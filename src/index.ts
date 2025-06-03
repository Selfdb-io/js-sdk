import { Config, type SelfDBConfig } from './config'
import { AuthClient } from './auth/client'
import { DatabaseClient } from './db/client'
import { StorageClient } from './storage/client'
import { RealtimeClient, type RealtimeConfig } from './realtime/client'
import { FunctionsClient } from './functions/client'
import { FileClient } from './storage/files'

export class SelfDB {
  public readonly auth: AuthClient
  public readonly db: DatabaseClient
  public readonly storage: StorageClient
  public readonly realtime: RealtimeClient
  public readonly functions: FunctionsClient
  public readonly files: FileClient

  constructor(config: SelfDBConfig, realtimeConfig?: RealtimeConfig) {
    Config.init(config)
    
    this.auth = new AuthClient()
    this.db = new DatabaseClient(this.auth)
    this.storage = new StorageClient(this.auth)
    this.realtime = new RealtimeClient(this.auth, realtimeConfig)
    this.functions = new FunctionsClient(this.auth)
    this.files = new FileClient(this.auth)
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

// Export individual client classes
export { AuthClient } from './auth/client'
export { DatabaseClient } from './db/client'
export { StorageClient } from './storage/client'
export { BucketClient } from './storage/buckets'
export { FileClient } from './storage/files'
export { RealtimeClient } from './realtime/client'
export { FunctionsClient } from './functions/client'