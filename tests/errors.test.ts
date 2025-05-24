import { describe, it, expect } from 'vitest'
import {
  SelfDBError,
  ApiError,
  NetworkError,
  TimeoutError,
  AuthError,
  ValidationError
} from '../src/errors'

describe('Errors', () => {
  it('should create SelfDBError correctly', () => {
    const error = new SelfDBError('Test error', 500, { detail: 'test' })
    
    expect(error.name).toBe('SelfDBError')
    expect(error.message).toBe('Test error')
    expect(error.status).toBe(500)
    expect(error.data).toEqual({ detail: 'test' })
  })

  it('should create ApiError correctly', () => {
    const error = new ApiError('API error', 400, { field: 'invalid' })
    
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('API error')
    expect(error.status).toBe(400)
    expect(error.data).toEqual({ field: 'invalid' })
  })

  it('should create NetworkError correctly', () => {
    const error = new NetworkError('Network failed')
    
    expect(error.name).toBe('NetworkError')
    expect(error.message).toBe('Network failed')
    expect(error.status).toBeUndefined()
  })

  it('should create TimeoutError correctly', () => {
    const error = new TimeoutError('Request timeout')
    
    expect(error.name).toBe('TimeoutError')
    expect(error.message).toBe('Request timeout')
  })

  it('should create AuthError correctly', () => {
    const error = new AuthError('Unauthorized')
    
    expect(error.name).toBe('AuthError')
    expect(error.message).toBe('Unauthorized')
    expect(error.status).toBe(401)
  })

  it('should create ValidationError correctly', () => {
    const error = new ValidationError('Invalid data', { field: 'required' })
    
    expect(error.name).toBe('ValidationError')
    expect(error.message).toBe('Invalid data')
    expect(error.status).toBe(400)
    expect(error.data).toEqual({ field: 'required' })
  })
})