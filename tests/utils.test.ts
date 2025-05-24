import { describe, it, expect, vi } from 'vitest'
import { getStorageItem, setStorageItem, removeStorageItem, isServer } from '../src/utils'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Utils', () => {
  describe('Storage utilities', () => {
    it('should get item from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-value')
      
      const result = getStorageItem('test-key')
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
      expect(result).toBe('test-value')
    })

    it('should set item in localStorage', () => {
      setStorageItem('test-key', 'test-value')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value')
    })

    it('should remove item from localStorage', () => {
      removeStorageItem('test-key')
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
    })

    it('should return null if localStorage throws', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const result = getStorageItem('test-key')
      
      expect(result).toBeNull()
    })
  })

  describe('isServer', () => {
    it('should detect browser environment', () => {
      expect(isServer).toBe(false)
    })
  })
})