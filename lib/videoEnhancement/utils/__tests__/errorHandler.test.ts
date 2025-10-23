/**
 * Unit tests for ErrorHandler and related utilities
 * Requirements: 6.4, 6.6, 8.3, 8.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorHandler, MemoryManager, GPUFallbackManager } from '../errorHandler'
import { EnhancementError, EnhancementErrorCode, ErrorRecoveryStrategy } from '../../types'

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler

    beforeEach(() => {
        errorHandler = ErrorHandler.getInstance()
        errorHandler.clearHistory()
    })

    describe('handleError', () => {
        it('should handle EnhancementError correctly', () => {
            const error = new EnhancementError(
                'Test error',
                EnhancementErrorCode.GPU_NOT_AVAILABLE,
                {
                    recoverable: true,
                    recoveryStrategy: ErrorRecoveryStrategy.FALLBACK_TO_CPU
                }
            )

            const result = errorHandler.handleError(error)

            expect(result).toBe(error)
            expect(result.code).toBe(EnhancementErrorCode.GPU_NOT_AVAILABLE)
            expect(result.recoverable).toBe(true)
        })

        it('should convert generic Error to EnhancementError', () => {
            const genericError = new Error('WebGL not supported')
            const result = errorHandler.handleError(genericError)

            expect(result).toBeInstanceOf(EnhancementError)
            expect(result.code).toBe(EnhancementErrorCode.GPU_NOT_AVAILABLE)
            expect(result.recoveryStrategy).toBe(ErrorRecoveryStrategy.FALLBACK_TO_CPU)
        })

        it('should add context information to error', () => {
            const error = new Error('Memory error')
            const context = { component: 'VideoProcessor', operation: 'processFrame' }

            const result = errorHandler.handleError(error, context)

            expect(result.context.component).toBe('VideoProcessor')
            expect(result.context.operation).toBe('processFrame')
        })
    })

    describe('getRecoveryStrategy', () => {
        it('should return original strategy for new errors', () => {
            const error = new EnhancementError(
                'Test error',
                EnhancementErrorCode.GPU_NOT_AVAILABLE,
                { recoveryStrategy: ErrorRecoveryStrategy.FALLBACK_TO_CPU }
            )

            const strategy = errorHandler.getRecoveryStrategy(error)
            expect(strategy).toBe(ErrorRecoveryStrategy.FALLBACK_TO_CPU)
        })

        it('should return USER_INTERVENTION after max retries', () => {
            const error = new EnhancementError(
                'Test error',
                EnhancementErrorCode.PROCESSING_FAILED,
                { recoveryStrategy: ErrorRecoveryStrategy.RETRY }
            )

            // Simulate multiple retries
            for (let i = 0; i < 4; i++) {
                errorHandler.handleError(error)
            }

            // After multiple retries, the error should suggest user intervention
            expect(error.recoveryStrategy).toBe(ErrorRecoveryStrategy.USER_INTERVENTION)
        })
    })

    describe('isRecoverable', () => {
        it('should return true for recoverable errors', () => {
            const error = new EnhancementError(
                'Test error',
                EnhancementErrorCode.GPU_NOT_AVAILABLE,
                { recoverable: true }
            )

            expect(errorHandler.isRecoverable(error)).toBe(true)
        })

        it('should return false for non-recoverable errors', () => {
            const error = new EnhancementError(
                'Test error',
                EnhancementErrorCode.BROWSER_NOT_SUPPORTED,
                { recoverable: false }
            )

            expect(errorHandler.isRecoverable(error)).toBe(false)
        })
    })

    describe('shouldAttemptGPUFallback', () => {
        it('should return true for GPU-related errors', () => {
            const error = new EnhancementError(
                'GPU error',
                EnhancementErrorCode.GPU_NOT_AVAILABLE,
                { recoveryStrategy: ErrorRecoveryStrategy.FALLBACK_TO_CPU }
            )

            expect(errorHandler.shouldAttemptGPUFallback(error)).toBe(true)
        })

        it('should return false for non-GPU errors', () => {
            const error = new EnhancementError(
                'Memory error',
                EnhancementErrorCode.INSUFFICIENT_MEMORY,
                { recoveryStrategy: ErrorRecoveryStrategy.CHUNK_PROCESSING }
            )

            expect(errorHandler.shouldAttemptGPUFallback(error)).toBe(false)
        })
    })

    describe('getErrorStats', () => {
        it('should return error statistics', () => {
            const error1 = new EnhancementError('Error 1', EnhancementErrorCode.GPU_NOT_AVAILABLE)
            const error2 = new EnhancementError('Error 2', EnhancementErrorCode.GPU_NOT_AVAILABLE)
            const error3 = new EnhancementError('Error 3', EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED)

            errorHandler.handleError(error1)
            errorHandler.handleError(error2)
            errorHandler.handleError(error3)

            const stats = errorHandler.getErrorStats()

            expect(stats.totalErrors).toBe(3)
            expect(stats.errorsByCode[EnhancementErrorCode.GPU_NOT_AVAILABLE]).toBe(2)
            expect(stats.errorsByCode[EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED]).toBe(1)
            expect(stats.recentErrors).toHaveLength(3)
        })
    })
})

describe('MemoryManager', () => {
    describe('isVideoTooLarge', () => {
        it('should return true for videos larger than limit', () => {
            const largeVideoSize = 2 * 1024 * 1024 * 1024 // 2GB
            expect(MemoryManager.isVideoTooLarge(largeVideoSize)).toBe(true)
        })

        it('should return false for videos smaller than limit', () => {
            const smallVideoSize = 500 * 1024 * 1024 // 500MB
            expect(MemoryManager.isVideoTooLarge(smallVideoSize)).toBe(false)
        })
    })

    describe('calculateChunkSize', () => {
        it('should calculate appropriate chunk size', () => {
            const videoSizeBytes = 100 * 1024 * 1024 // 100MB
            const chunkSize = MemoryManager.calculateChunkSize(videoSizeBytes)

            expect(chunkSize).toBeGreaterThan(0)
            expect(chunkSize).toBeLessThanOrEqual(50) // Max chunk size
        })

        it('should respect available memory limit', () => {
            const videoSizeBytes = 100 * 1024 * 1024 // 100MB
            const availableMemoryMB = 200 // 200MB
            const chunkSize = MemoryManager.calculateChunkSize(videoSizeBytes, availableMemoryMB)

            expect(chunkSize).toBeLessThanOrEqual(100) // 50% of available memory
        })
    })

    describe('estimateMemoryUsage', () => {
        it('should estimate memory usage correctly', () => {
            const width = 1920
            const height = 1080
            const frameCount = 30
            const estimatedMB = MemoryManager.estimateMemoryUsage(width, height, frameCount)

            // 1920 * 1080 * 4 bytes * 30 frames = ~248MB
            expect(estimatedMB).toBeCloseTo(248, 10)
        })
    })

    describe('isMemoryUsageAcceptable', () => {
        it('should return true for acceptable memory usage', () => {
            expect(MemoryManager.isMemoryUsageAcceptable(500)).toBe(true)
        })

        it('should return false for excessive memory usage', () => {
            expect(MemoryManager.isMemoryUsageAcceptable(2000)).toBe(false)
        })
    })
})

describe('GPUFallbackManager', () => {
    describe('isCPUFallbackAvailable', () => {
        it('should return true when canvas context is available', () => {
            // Mock canvas context
            const mockCanvas = {
                getContext: vi.fn().mockReturnValue({})
            }
            vi.stubGlobal('document', {
                createElement: vi.fn().mockReturnValue(mockCanvas)
            })

            expect(GPUFallbackManager.isCPUFallbackAvailable()).toBe(true)
        })

        it('should return false when canvas context is not available', () => {
            // Mock canvas without context
            const mockCanvas = {
                getContext: vi.fn().mockReturnValue(null)
            }
            vi.stubGlobal('document', {
                createElement: vi.fn().mockReturnValue(mockCanvas)
            })

            expect(GPUFallbackManager.isCPUFallbackAvailable()).toBe(false)
        })
    })

    describe('getFallbackMode', () => {
        it('should return appropriate fallback mode', () => {
            // Mock WebGL2 available
            const mockCanvas = {
                getContext: vi.fn().mockImplementation((type) => {
                    if (type === 'webgl2') return {}
                    return null
                })
            }
            vi.stubGlobal('document', {
                createElement: vi.fn().mockReturnValue(mockCanvas)
            })

            expect(GPUFallbackManager.getFallbackMode()).toBe('gpu')
        })
    })
})
