import { describe, it, expect, beforeEach } from 'vitest'
import { SelfDB, createClient } from '../src/index'
import { Config } from '../src/config'

describe('SelfDB SDK', () => {
  beforeEach(() => {
    // Reset singleton
    ;(Config as any).instance = undefined
  })

  it('should create SelfDB instance correctly', () => {
    const client = new SelfDB({
      baseUrl: 'http://localhost:8000',
      anonKey: 'test-key'
    })

    expect(client.auth).toBeDefined()
    expect(client.db).toBeDefined()
    expect(client.storage.buckets).toBeDefined()
    expect(client.storage.files).toBeDefined()
    expect(client.realtime).toBeDefined()
    expect(client.functions).toBeDefined()
  })

  it('should create client using createClient function', () => {
    const client = createClient({
      baseUrl: 'http://localhost:8000',
      anonKey: 'test-key'
    })

    expect(client).toBeInstanceOf(SelfDB)
    expect(client.auth).toBeDefined()
    expect(client.db).toBeDefined()
    expect(client.storage.buckets).toBeDefined()
    expect(client.storage.files).toBeDefined()
    expect(client.realtime).toBeDefined()
    expect(client.functions).toBeDefined()
  })

  it('should accept realtime config', () => {
    const client = createClient(
      {
        baseUrl: 'http://localhost:8000',
        anonKey: 'test-key'
      },
      {
        autoReconnect: false,
        maxRetries: 10
      }
    )

    expect(client.realtime).toBeDefined()
  })
})