import { Config, type SelfDBConfig } from './config'
import { AuthClient } from './auth/client'
import { DatabaseClient } from './db/client'
import { StorageClient } from './storage/client'
import { RealtimeClient, type RealtimeConfig } from './realtime/client'
import { FunctionsClient } from './functions/client'

export class SelfDB {
  public readonly auth: AuthClient
  public readonly db: DatabaseClient
  public readonly storage: StorageClient
  public readonly realtime: RealtimeClient
  public readonly functions: FunctionsClient

  constructor(config: SelfDBConfig, realtimeConfig?: RealtimeConfig) {
    Config.init(config)
    
    this.auth = new AuthClient()
    this.db = new DatabaseClient(this.auth)
    this.storage = new StorageClient(this.auth)
    this.realtime = new RealtimeClient(this.auth, realtimeConfig)
    this.functions = new FunctionsClient(this.auth)
  }
}

export function createClient(config: SelfDBConfig, realtimeConfig?: RealtimeConfig): SelfDB {
  return new SelfDB(config, realtimeConfig)
}

export * from './errors'
export * from './config'
export * from './auth/types'
export * from './db/types'
export * from './storage/types'
export * from './realtime/types'
export * from './functions/types'