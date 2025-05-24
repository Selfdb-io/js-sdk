export interface RealtimeConfig {
  url?: string
  autoReconnect?: boolean
  maxRetries?: number
  retryDelay?: number
}

export interface RealtimeMessage {
  type: string
  channel: string
  event: string
  payload: unknown
}

export interface SubscriptionOptions {
  event?: string
  filter?: Record<string, unknown>
}

export type RealtimeCallback = (payload: unknown) => void

export interface Subscription {
  id: string
  channel: string
  event?: string
  callback: RealtimeCallback
  unsubscribe: () => void
}

export interface ConnectionState {
  connected: boolean
  connecting: boolean
  reconnecting: boolean
}