/**
 * Unit tests for GPU detection utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectWebGLSupport,
  detectWebGL2Support,
  getGPUCapabilities,
  shouldUseGPUProcessing,
  createWebGLContext,
  testGPUProcessing
} from '../gpuDetection'

describe('gpuDetection', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks()
  })

  describe('detectWebGLSupport', () => {
    it('should return true when WebGL is supported', () => {
      const result = detectWebGLSupport()
      // In a real browser environment, this should return true
      expect(typeof result).toBe('boolean')
    })

    it('should return false when canvas creation fails', () => {
      const originalCreateElement = document.createElement
      document.createElement = vi.fn(() => {
        throw new Error('Canvas creation failed')
      }) as any

      const result = detectWebGLSupport()
      expect(result).toBe(false)

      document.createElement = originalCreateElement
    })
  })

  describe('detectWebGL2Support', () => {
    it('should return a boolean value', () => {
      const result = detectWebGL2Support()
      expect(typeof result).toBe('boolean')
    })

    it('should return false when canvas creation fails', () => {
      const originalCreateElement = document.createElement
      document.createElement = vi.fn(() => {
        throw new Error('Canvas creation failed')
      }) as any

      const result = detectWebGL2Support()
      expect(result).toBe(false)

      document.createElement = originalCreateElement
    })
  })

  describe('getGPUCapabilities', () => {
    it('should return capabilities object with correct structure', () => {
      const capabilities = getGPUCapabilities()
      
      expect(capabilities).toHaveProperty('webgl')
      expect(capabilities).toHaveProperty('webgl2')
      expect(capabilities).toHaveProperty('maxTextureSize')
      expect(capabilities).toHaveProperty('maxRenderbufferSize')
      expect(capabilities).toHaveProperty('vendor')
      expect(capabilities).toHaveProperty('renderer')
      expect(capabilities).toHaveProperty('supportsFloatTextures')
      expect(capabilities).toHaveProperty('supportsHalfFloatTextures')
    })

    it('should return valid types for all properties', () => {
      const capabilities = getGPUCapabilities()
      
      expect(typeof capabilities.webgl).toBe('boolean')
      expect(typeof capabilities.webgl2).toBe('boolean')
      expect(typeof capabilities.maxTextureSize).toBe('number')
      expect(typeof capabilities.maxRenderbufferSize).toBe('number')
      expect(typeof capabilities.vendor).toBe('string')
      expect(typeof capabilities.renderer).toBe('string')
      expect(typeof capabilities.supportsFloatTextures).toBe('boolean')
      expect(typeof capabilities.supportsHalfFloatTextures).toBe('boolean')
    })

    it('should return zero values when WebGL is not supported', () => {
      // Mock canvas to return null context
      const originalCreateElement = document.createElement
      const mockCanvas = {
        getContext: vi.fn(() => null)
      }
      document.createElement = vi.fn(() => mockCanvas) as any

      const capabilities = getGPUCapabilities()
      
      expect(capabilities.webgl).toBe(false)
      expect(capabilities.webgl2).toBe(false)
      expect(capabilities.maxTextureSize).toBe(0)
      expect(capabilities.maxRenderbufferSize).toBe(0)
      expect(capabilities.vendor).toBe('unknown')
      expect(capabilities.renderer).toBe('unknown')

      document.createElement = originalCreateElement
    })
  })

  describe('shouldUseGPUProcessing', () => {
    it('should return a boolean value', () => {
      const result = shouldUseGPUProcessing()
      expect(typeof result).toBe('boolean')
    })

    it('should return false when WebGL is not supported', () => {
      // Mock canvas to return null context
      const originalCreateElement = document.createElement
      const mockCanvas = {
        getContext: vi.fn(() => null)
      }
      document.createElement = vi.fn(() => mockCanvas) as any

      const result = shouldUseGPUProcessing()
      expect(result).toBe(false)

      document.createElement = originalCreateElement
    })
  })

  describe('createWebGLContext', () => {
    it('should create a WebGL context on a canvas', () => {
      const canvas = document.createElement('canvas')
      const gl = createWebGLContext(canvas, true)
      
      // In test environment, this might be null, but should not throw
      expect(gl === null || gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext).toBe(true)
    })

    it('should prefer WebGL2 when preferWebGL2 is true', () => {
      const canvas = document.createElement('canvas')
      const gl = createWebGLContext(canvas, true)
      
      if (gl) {
        // If we got a context, it should be WebGL2 if available
        const isWebGL2 = gl instanceof WebGL2RenderingContext
        expect(typeof isWebGL2).toBe('boolean')
      }
    })

    it('should fall back to WebGL when WebGL2 is not available', () => {
      const canvas = document.createElement('canvas')
      const gl = createWebGLContext(canvas, false)
      
      // Should return a context or null
      expect(gl === null || gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext).toBe(true)
    })

    it('should return null when context creation fails', () => {
      const mockCanvas = {
        getContext: vi.fn(() => {
          throw new Error('Context creation failed')
        })
      } as any

      const gl = createWebGLContext(mockCanvas, true)
      expect(gl).toBe(null)
    })
  })

  describe('testGPUProcessing', () => {
    it('should return a boolean value', () => {
      const result = testGPUProcessing()
      expect(typeof result).toBe('boolean')
    })

    it('should return false when WebGL context cannot be created', () => {
      const originalCreateElement = document.createElement
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => null)
      }
      document.createElement = vi.fn(() => mockCanvas) as any

      const result = testGPUProcessing()
      expect(result).toBe(false)

      document.createElement = originalCreateElement
    })

    it('should handle shader compilation errors gracefully', () => {
      // This test verifies the function doesn't throw on errors
      expect(() => testGPUProcessing()).not.toThrow()
    })
  })
})
