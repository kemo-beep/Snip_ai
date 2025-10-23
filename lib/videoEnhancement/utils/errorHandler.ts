/**
 * Error handling utilities for the enhancement pipeline
 * Requirements: 6.4, 6.6, 8.3, 8.5
 */

import {
    EnhancementError,
    EnhancementErrorCode,
    ErrorRecoveryStrategy,
    ErrorContext
} from '../types'

/**
 * Error handler class that manages error recovery and fallback strategies
 */
export class ErrorHandler {
    private static instance: ErrorHandler
    private errorHistory: EnhancementError[] = []
    private maxRetries = 3
    private retryDelay = 1000 // milliseconds

    private constructor() { }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler()
        }
        return ErrorHandler.instance
    }

    /**
     * Handle an error and determine recovery strategy
     */
    public handleError(error: Error, context: ErrorContext = {}): EnhancementError {
        let enhancementError: EnhancementError

        if (error instanceof EnhancementError) {
            enhancementError = error
        } else {
            // Convert generic error to EnhancementError
            enhancementError = this.convertToEnhancementError(error, context)
        }

        // Add context information
        enhancementError.context = { ...enhancementError.context, ...context }

        // Log error
        this.logError(enhancementError)

        // Add to error history
        this.errorHistory.push(enhancementError)

        return enhancementError
    }

    /**
     * Convert a generic error to EnhancementError
     */
    private convertToEnhancementError(error: Error, context: ErrorContext): EnhancementError {
        const message = error.message
        let code: EnhancementErrorCode
        let recoveryStrategy: ErrorRecoveryStrategy

        // Determine error type based on message and context
        if (message.includes('WebGL') || message.includes('GPU')) {
            code = EnhancementErrorCode.GPU_NOT_AVAILABLE
            recoveryStrategy = ErrorRecoveryStrategy.FALLBACK_TO_CPU
        } else if (message.includes('memory') || message.includes('Memory')) {
            code = EnhancementErrorCode.INSUFFICIENT_MEMORY
            recoveryStrategy = ErrorRecoveryStrategy.CHUNK_PROCESSING
        } else if (message.includes('timeout') || message.includes('Timeout')) {
            code = EnhancementErrorCode.TIMEOUT
            recoveryStrategy = ErrorRecoveryStrategy.REDUCE_QUALITY
        } else if (message.includes('format') || message.includes('codec')) {
            code = EnhancementErrorCode.INVALID_VIDEO_FORMAT
            recoveryStrategy = ErrorRecoveryStrategy.SKIP_ENHANCEMENT
        } else if (message.includes('AudioContext')) {
            code = EnhancementErrorCode.AUDIO_CONTEXT_ERROR
            recoveryStrategy = ErrorRecoveryStrategy.RETRY
        } else {
            code = EnhancementErrorCode.UNKNOWN_ERROR
            recoveryStrategy = ErrorRecoveryStrategy.USER_INTERVENTION
        }

        return new EnhancementError(message, code, {
            context,
            recoveryStrategy
        })
    }

    /**
     * Get recovery strategy for an error
     */
    public getRecoveryStrategy(error: EnhancementError): ErrorRecoveryStrategy {
        // Check if we've tried this error before
        const similarErrors = this.errorHistory.filter(e =>
            e.code === error.code &&
            Date.now() - (e.context.timestamp || 0) < 60000 // Within last minute
        )

        if (similarErrors.length >= this.maxRetries) {
            return ErrorRecoveryStrategy.USER_INTERVENTION
        }

        return error.recoveryStrategy
    }

    /**
     * Check if an error is recoverable
     */
    public isRecoverable(error: EnhancementError): boolean {
        const nonRecoverableCodes = [
            EnhancementErrorCode.BROWSER_NOT_SUPPORTED,
            EnhancementErrorCode.SECURITY_RESTRICTION,
            EnhancementErrorCode.UNSUPPORTED_CODEC,
            EnhancementErrorCode.DATA_CORRUPTION
        ]

        return error.recoverable && !nonRecoverableCodes.includes(error.code)
    }

    /**
     * Get user-friendly error message
     */
    public getUserMessage(error: EnhancementError): string {
        return error.userMessage
    }

    /**
     * Get suggestion for error resolution
     */
    public getSuggestion(error: EnhancementError): string {
        return error.suggestion
    }

    /**
     * Log error for debugging
     */
    private logError(error: EnhancementError): void {
        console.error('Enhancement Error:', {
            code: error.code,
            message: error.message,
            userMessage: error.userMessage,
            suggestion: error.suggestion,
            context: error.context,
            stack: error.stack
        })
    }

    /**
     * Clear error history
     */
    public clearHistory(): void {
        this.errorHistory = []
    }

    /**
     * Get error statistics
     */
    public getErrorStats(): {
        totalErrors: number
        errorsByCode: Record<string, number>
        recentErrors: EnhancementError[]
    } {
        const errorsByCode: Record<string, number> = {}

        this.errorHistory.forEach(error => {
            errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1
        })

        return {
            totalErrors: this.errorHistory.length,
            errorsByCode,
            recentErrors: this.errorHistory.slice(-10) // Last 10 errors
        }
    }

    /**
     * Check if GPU fallback should be attempted
     */
    public shouldAttemptGPUFallback(error: EnhancementError): boolean {
        const gpuErrorCodes = [
            EnhancementErrorCode.GPU_NOT_AVAILABLE,
            EnhancementErrorCode.GPU_CONTEXT_LOST,
            EnhancementErrorCode.WEBGL_NOT_SUPPORTED,
            EnhancementErrorCode.WEBGL2_NOT_SUPPORTED
        ]

        return gpuErrorCodes.includes(error.code) &&
            error.recoveryStrategy === ErrorRecoveryStrategy.FALLBACK_TO_CPU
    }

    /**
     * Check if quality reduction should be attempted
     */
    public shouldReduceQuality(error: EnhancementError): boolean {
        const qualityErrorCodes = [
            EnhancementErrorCode.INSUFFICIENT_MEMORY,
            EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED,
            EnhancementErrorCode.VIDEO_TOO_LARGE,
            EnhancementErrorCode.TIMEOUT,
            EnhancementErrorCode.PROCESSING_TIMEOUT
        ]

        return qualityErrorCodes.includes(error.code) &&
            error.recoveryStrategy === ErrorRecoveryStrategy.REDUCE_QUALITY
    }

    /**
     * Check if chunk processing should be attempted
     */
    public shouldUseChunkProcessing(error: EnhancementError): boolean {
        const chunkErrorCodes = [
            EnhancementErrorCode.INSUFFICIENT_MEMORY,
            EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED,
            EnhancementErrorCode.VIDEO_TOO_LARGE
        ]

        return chunkErrorCodes.includes(error.code) &&
            error.recoveryStrategy === ErrorRecoveryStrategy.CHUNK_PROCESSING
    }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
    private static readonly MEMORY_LIMIT_MB = 1024 // 1GB limit
    private static readonly CHUNK_SIZE_MB = 50 // 50MB chunks

    /**
     * Check if video size exceeds memory limit
     */
    public static isVideoTooLarge(videoSizeBytes: number): boolean {
        const videoSizeMB = videoSizeBytes / (1024 * 1024)
        return videoSizeMB > MemoryManager.MEMORY_LIMIT_MB
    }

    /**
     * Calculate optimal chunk size based on available memory
     */
    public static calculateChunkSize(videoSizeBytes: number, availableMemoryMB?: number): number {
        const videoSizeMB = videoSizeBytes / (1024 * 1024)
        const memoryLimit = availableMemoryMB || MemoryManager.MEMORY_LIMIT_MB
        const maxChunkSize = Math.min(memoryLimit * 0.5, MemoryManager.CHUNK_SIZE_MB) // Use 50% of available memory

        return Math.min(videoSizeMB, maxChunkSize)
    }

    /**
     * Estimate memory usage for video processing
     */
    public static estimateMemoryUsage(width: number, height: number, frameCount: number): number {
        // Rough estimate: 4 bytes per pixel per frame (RGBA)
        const bytesPerFrame = width * height * 4
        const totalBytes = bytesPerFrame * frameCount
        return totalBytes / (1024 * 1024) // Convert to MB
    }

    /**
     * Check if current memory usage is acceptable
     */
    public static isMemoryUsageAcceptable(estimatedUsageMB: number): boolean {
        return estimatedUsageMB <= MemoryManager.MEMORY_LIMIT_MB
    }
}

/**
 * GPU fallback utilities
 */
export class GPUFallbackManager {
    /**
     * Check if CPU fallback is available
     */
    public static isCPUFallbackAvailable(): boolean {
        // Check if we can create a canvas for CPU processing
        try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            return ctx !== null
        } catch {
            return false
        }
    }

    /**
     * Get fallback processing mode
     */
    public static getFallbackMode(): 'gpu' | 'cpu' | 'none' {
        if (this.isWebGL2Available()) return 'gpu'
        if (this.isWebGL1Available()) return 'gpu'
        if (this.isCPUFallbackAvailable()) return 'cpu'
        return 'none'
    }

    /**
     * Check WebGL2 availability
     */
    private static isWebGL2Available(): boolean {
        try {
            const canvas = document.createElement('canvas')
            return canvas.getContext('webgl2') !== null
        } catch {
            return false
        }
    }

    /**
     * Check WebGL1 availability
     */
    private static isWebGL1Available(): boolean {
        try {
            const canvas = document.createElement('canvas')
            return canvas.getContext('webgl') !== null
        } catch {
            return false
        }
    }
}

export default ErrorHandler
