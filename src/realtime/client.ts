import { Config } from '../config'
import { AuthClient } from '../auth/client'
import type {
  RealtimeConfig,
  RealtimeMessage,
  SubscriptionOptions,
  RealtimeCallback,
  Subscription,
  ConnectionState
} from './types'

export type { RealtimeConfig }

export class RealtimeClient {
  private ws: WebSocket | null = null
  private config: Config
  private authClient: AuthClient
  private realtimeConfig: Required<RealtimeConfig>
  private subscriptions = new Map<string, Subscription>()
  private connectionState: ConnectionState = {
    connected: false,
    connecting: false,
    reconnecting: false
  }
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private retryCount = 0

  constructor(authClient: AuthClient, config: RealtimeConfig = {}) {
    this.config = Config.getInstance()
    this.authClient = authClient
    this.realtimeConfig = {
      url: config.url || this.config.baseUrl.replace('http', 'ws') + '/api/v1/realtime/ws',
      autoReconnect: config.autoReconnect !== false,
      maxRetries: config.maxRetries || 5,
      retryDelay: config.retryDelay || 1000
    }
  }

  async connect(): Promise<void> {
    if (this.connectionState.connected || this.connectionState.connecting) {
      return
    }

    this.connectionState.connecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.realtimeConfig.url)

        this.ws.onopen = async () => {
          // Send authentication message
          const headers = this.authClient.getAuthHeaders()
          const token = headers.Authorization?.replace('Bearer ', '') || headers.apikey || ''
          
          const authMessage = {
            type: 'authenticate',
            token: token
          }
          
          this.ws!.send(JSON.stringify(authMessage))
          
          this.connectionState = {
            connected: true,
            connecting: false,
            reconnecting: false
          }
          this.retryCount = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = () => {
          this.handleDisconnection()
        }

        this.ws.onerror = (error) => {
          this.connectionState.connecting = false
          reject(error)
        }
      } catch (error) {
        this.connectionState.connecting = false
        reject(error)
      }
    })
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: RealtimeMessage = JSON.parse(event.data)
      
      if (message.type === 'pong') {
        return
      }

      this.subscriptions.forEach((subscription) => {
        if (subscription.channel === message.channel) {
          if (!subscription.event || subscription.event === message.event) {
            subscription.callback(message.payload)
          }
        }
      })
    } catch (error) {
      console.error('Error parsing realtime message:', error)
    }
  }

  private handleDisconnection(): void {
    this.connectionState.connected = false
    this.stopHeartbeat()

    if (this.realtimeConfig.autoReconnect && this.retryCount < this.realtimeConfig.maxRetries) {
      this.connectionState.reconnecting = true
      this.retryCount++
      
      const delay = this.realtimeConfig.retryDelay * Math.pow(2, this.retryCount - 1)
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch(console.error)
      }, delay)
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  subscribe(
    channel: string, 
    callback: RealtimeCallback,
    options: SubscriptionOptions = {}
  ): Subscription {
    const id = `${channel}_${options.event || 'all'}_${Date.now()}`
    
    const subscription: Subscription = {
      id,
      channel,
      event: options.event,
      callback,
      unsubscribe: () => this.unsubscribe(id)
    }

    this.subscriptions.set(id, subscription)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel,
        event: options.event,
        filter: options.filter
      }))
    }

    return subscription
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    this.subscriptions.delete(subscriptionId)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel: subscription.channel,
        event: subscription.event
      }))
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopHeartbeat()
    this.subscriptions.clear()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connectionState = {
      connected: false,
      connecting: false,
      reconnecting: false
    }
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  isConnected(): boolean {
    return this.connectionState.connected
  }
}