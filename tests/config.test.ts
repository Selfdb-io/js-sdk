import { describe, it, expect, beforeEach } from 'vitest'
import { Config } from '../src/config'

describe('Config', () => {
  beforeEach(() => {
    // Reset singleton
    ;(Config as any).instance = undefined
  })

  it('should initialize config correctly', () => {
    const config = Config.init({
      baseUrl: 'http://localhost:8000',
      anonKey: 'test-key'
    })

    expect(config.baseUrl).toBe('http://localhost:8000')
    expect(config.anonKey).toBe('test-key')
    expect(config.storageUrl).toBe('http://localhost:8001')
  })

  it('should throw error when getInstance called before init', () => {
    expect(() => Config.getInstance()).toThrow('SelfDB SDK not initialized')
  })

  it('should return same instance on subsequent calls', () => {
    const config1 = Config.init({ baseUrl: 'http://localhost:8000', anonKey: 'test-key' })
    const config2 = Config.getInstance()

    expect(config1).toBe(config2)
  })

  it('should update config correctly', () => {
    const config = Config.init({ baseUrl: 'http://localhost:8000', anonKey: 'test-key' })
    
    config.updateConfig({ 
      anonKey: 'new-key',
      headers: { 'Custom-Header': 'value' }
    })

    expect(config.anonKey).toBe('new-key')
    expect(config.headers).toEqual({ 'Custom-Header': 'value' })
  })
})