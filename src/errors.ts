export interface ErrorConfig {
  message: string
  code?: string
  action?: string
  suggestion?: string
  retryable?: boolean
  status?: number
  data?: unknown
}

export class SelfDBError extends Error {
  public readonly code: string
  public readonly action?: string
  public readonly suggestion?: string
  public readonly retryable: boolean
  public readonly status?: number
  public readonly data?: unknown

  constructor(config: string | ErrorConfig, status?: number, data?: unknown) {
    if (typeof config === 'string') {
      super(config)
      this.code = 'GENERIC_ERROR'
      this.retryable = false
      this.status = status
      this.data = data
    } else {
      super(config.message)
      this.code = config.code || 'GENERIC_ERROR'
      this.action = config.action
      this.suggestion = config.suggestion
      this.retryable = config.retryable || false
      this.status = config.status || status
      this.data = config.data || data
    }
    this.name = 'SelfDBError'
  }

  isRetryable(): boolean {
    return this.retryable
  }
}

export class ApiError extends SelfDBError {
  constructor(message: string, status: number, data?: unknown) {
    super({
      message,
      code: 'API_ERROR',
      status,
      data,
      retryable: status >= 500
    })
    this.name = 'ApiError'
  }
}

export class NetworkError extends SelfDBError {
  constructor(message: string) {
    super({
      message,
      code: 'NETWORK_ERROR',
      suggestion: 'Check your internet connection and SelfDB server status',
      retryable: true
    })
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends SelfDBError {
  constructor(message: string) {
    super({
      message,
      code: 'TIMEOUT_ERROR',
      suggestion: 'The request took too long. Try again or check your connection',
      retryable: true
    })
    this.name = 'TimeoutError'
  }
}

export class AuthError extends SelfDBError {
  constructor(message: string) {
    super({
      message,
      code: 'AUTH_ERROR',
      status: 401,
      suggestion: 'Check your credentials or login again',
      action: 'auth.login'
    })
    this.name = 'AuthError'
  }
}

export class ValidationError extends SelfDBError {
  constructor(message: string, data?: unknown) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      status: 400,
      data,
      suggestion: 'Check your input data and try again'
    })
    this.name = 'ValidationError'
  }
}