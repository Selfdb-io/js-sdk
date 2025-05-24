export interface SelfDBConfig {
  baseUrl: string
  storageUrl?: string
  anonKey: string
  headers?: Record<string, string>
  timeout?: number
}

export class Config {
  private static instance: Config
  private config: Required<SelfDBConfig>

  private constructor(config: SelfDBConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      storageUrl: config.storageUrl || config.baseUrl.replace(':8000', ':8001'),
      anonKey: config.anonKey,
      headers: config.headers || {},
      timeout: config.timeout || 10000
    }
  }

  static init(config: SelfDBConfig): Config {
    Config.instance = new Config(config)
    return Config.instance
  }

  static getInstance(): Config {
    if (!Config.instance) {
      throw new Error('SelfDB SDK not initialized. Call init() first.')
    }
    return Config.instance
  }

  get baseUrl(): string {
    return this.config.baseUrl
  }

  get storageUrl(): string {
    return this.config.storageUrl
  }

  get anonKey(): string {
    return this.config.anonKey
  }

  get headers(): Record<string, string> {
    return { ...this.config.headers }
  }

  get timeout(): number {
    return this.config.timeout
  }

  updateConfig(updates: Partial<SelfDBConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      headers: {
        ...this.config.headers,
        ...updates.headers
      }
    }
  }
}