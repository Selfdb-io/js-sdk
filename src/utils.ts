import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ApiError, NetworkError, TimeoutError } from './errors'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

export class HttpClient {
  private readonly baseURL: string
  private readonly timeout: number
  private readonly retryConfig: RetryConfig

  constructor(baseURL: string, timeout = 10000, retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.retryConfig = retryConfig
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt)
    return Math.min(delay, this.retryConfig.maxDelay)
  }

  private handleAxiosError(error: AxiosError): never {
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout')
    }
    
    if (!error.response) {
      throw new NetworkError('Network error occurred')
    }

    const status = error.response.status
    const message = (error.response.data as any)?.message || error.message
    const data = error.response.data

    throw new ApiError(message, status, data)
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      baseURL: this.baseURL,
      timeout: this.timeout,
      ...config
    }

    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response: AxiosResponse<T> = await axios(requestConfig)
        return response.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status && error.response.status < 500 && attempt === 0) {
            this.handleAxiosError(error)
          }
          lastError = error
        } else {
          throw error
        }

        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt)
          await this.delay(delay)
        }
      }
    }

    if (lastError && axios.isAxiosError(lastError)) {
      this.handleAxiosError(lastError)
    }
    
    throw lastError || new Error('Unknown error occurred')
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config })
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config })
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config })
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config })
  }
}

export const isServer = typeof window === 'undefined'

export function getStorageItem(key: string): string | null {
  if (isServer) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setStorageItem(key: string, value: string): void {
  if (isServer) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage errors
  }
}

export function removeStorageItem(key: string): void {
  if (isServer) return
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage errors
  }
}