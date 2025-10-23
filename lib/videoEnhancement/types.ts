/**
 * Type definitions and interfaces for the Auto-Enhancement Pipeline
 * Requirements: 4.1, 4.2, 6.6
 */

/**
 * Configuration for which enhancements are enabled
 */
export interface EnhancementConfig {
    autoColorCorrection: boolean
    autoBrightnessAdjust: boolean
    autoContrast: boolean
    autoWhiteBalance: boolean
    autoNoiseReduction: boolean
    autoVolumeNormalization: boolean
    autoVoiceEnhancement: boolean
    autoEchoCancel: boolean
    autoStabilization: boolean
}

/**
 * Settings for enhancement parameters
 */
export interface EnhancementSettings {
    // Color settings
    brightness: number        // -100 to 100
    contrast: number          // -100 to 100
    saturation: number        // -100 to 100
    temperature: number       // -100 to 100 (warm to cool)

    // Audio settings
    noiseReduction: number    // 0 to 100
    volumeBoost: number       // 0 to 100
    voiceClarity: number      // 0 to 100
    echoReduction: number     // 0 to 100

    // Stabilization
    stabilizationStrength: number  // 0 to 100
}

/**
 * Result of enhancement processing
 */
export interface EnhancementResult {
    applied: string[]         // List of enhancements applied
    skipped: string[]         // List of enhancements skipped
    metrics: EnhancementMetrics
    processingTime: number    // milliseconds
}

/**
 * Metrics collected during enhancement processing
 */
export interface EnhancementMetrics {
    // Color metrics
    brightnessAdjustment: number
    contrastAdjustment: number
    colorTemperatureShift: number

    // Audio metrics
    noiseReductionDb: number
    volumeAdjustmentDb: number

    // Stabilization metrics
    shakeReduction: number    // percentage
}

/**
 * Processing context containing canvas and WebGL resources
 */
export interface ProcessingContext {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    gl?: WebGLRenderingContext | WebGL2RenderingContext
    audioContext?: AudioContext
    useGPU: boolean
}

/**
 * Frame data for video processing
 */
export interface FrameData {
    imageData: ImageData
    timestamp: number
    index: number
}

/**
 * Audio data for audio processing
 */
export interface AudioData {
    buffer: AudioBuffer
    sampleRate: number
    channels: number
}

/**
 * Error codes for enhancement errors
 */
export enum EnhancementErrorCode {
    // GPU and Hardware errors
    GPU_NOT_AVAILABLE = 'GPU_NOT_AVAILABLE',
    GPU_CONTEXT_LOST = 'GPU_CONTEXT_LOST',
    WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED',
    WEBGL2_NOT_SUPPORTED = 'WEBGL2_NOT_SUPPORTED',

    // Memory and resource errors
    INSUFFICIENT_MEMORY = 'INSUFFICIENT_MEMORY',
    MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
    VIDEO_TOO_LARGE = 'VIDEO_TOO_LARGE',

    // Processing errors
    PROCESSING_FAILED = 'PROCESSING_FAILED',
    FRAME_PROCESSING_FAILED = 'FRAME_PROCESSING_FAILED',
    AUDIO_PROCESSING_FAILED = 'AUDIO_PROCESSING_FAILED',
    STABILIZATION_FAILED = 'STABILIZATION_FAILED',

    // Input validation errors
    INVALID_VIDEO_FORMAT = 'INVALID_VIDEO_FORMAT',
    INVALID_AUDIO_FORMAT = 'INVALID_AUDIO_FORMAT',
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
    INVALID_SETTINGS = 'INVALID_SETTINGS',

    // Audio context errors
    AUDIO_CONTEXT_ERROR = 'AUDIO_CONTEXT_ERROR',
    AUDIO_CONTEXT_SUSPENDED = 'AUDIO_CONTEXT_SUSPENDED',
    AUDIO_ANALYSIS_FAILED = 'AUDIO_ANALYSIS_FAILED',

    // Timeout and performance errors
    TIMEOUT = 'TIMEOUT',
    PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
    FRAME_RATE_TOO_LOW = 'FRAME_RATE_TOO_LOW',

    // File and data errors
    FILE_READ_ERROR = 'FILE_READ_ERROR',
    DATA_CORRUPTION = 'DATA_CORRUPTION',
    UNSUPPORTED_CODEC = 'UNSUPPORTED_CODEC',

    // Browser compatibility errors
    BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
    FEATURE_NOT_SUPPORTED = 'FEATURE_NOT_SUPPORTED',
    SECURITY_RESTRICTION = 'SECURITY_RESTRICTION',

    // Generic errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PERMISSION_DENIED = 'PERMISSION_DENIED'
}

/**
 * Error recovery strategy
 */
export enum ErrorRecoveryStrategy {
    RETRY = 'RETRY',
    FALLBACK_TO_CPU = 'FALLBACK_TO_CPU',
    SKIP_ENHANCEMENT = 'SKIP_ENHANCEMENT',
    REDUCE_QUALITY = 'REDUCE_QUALITY',
    CHUNK_PROCESSING = 'CHUNK_PROCESSING',
    USER_INTERVENTION = 'USER_INTERVENTION',
    NONE = 'NONE'
}

/**
 * Error context information
 */
export interface ErrorContext {
    component?: string
    operation?: string
    videoSize?: number
    memoryUsage?: number
    gpuAvailable?: boolean
    browserInfo?: string
    timestamp?: number
}

/**
 * Custom error class for enhancement errors
 */
export class EnhancementError extends Error {
    public code: EnhancementErrorCode
    public recoverable: boolean
    public recoveryStrategy: ErrorRecoveryStrategy
    public context: ErrorContext
    public userMessage: string
    public suggestion: string

    constructor(
        message: string,
        code: EnhancementErrorCode,
        options: {
            recoverable?: boolean
            recoveryStrategy?: ErrorRecoveryStrategy
            context?: ErrorContext
            userMessage?: string
            suggestion?: string
        } = {}
    ) {
        super(message)
        this.name = 'EnhancementError'
        this.code = code
        this.recoverable = options.recoverable ?? true
        this.recoveryStrategy = options.recoveryStrategy ?? ErrorRecoveryStrategy.RETRY
        this.context = options.context ?? {}
        this.userMessage = options.userMessage ?? this.getDefaultUserMessage(code)
        this.suggestion = options.suggestion ?? this.getDefaultSuggestion(code)

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, EnhancementError)
        }
    }

    private getDefaultUserMessage(code: EnhancementErrorCode): string {
        const messages: Record<EnhancementErrorCode, string> = {
            [EnhancementErrorCode.GPU_NOT_AVAILABLE]: 'GPU acceleration is not available on this device.',
            [EnhancementErrorCode.GPU_CONTEXT_LOST]: 'GPU context was lost during processing.',
            [EnhancementErrorCode.WEBGL_NOT_SUPPORTED]: 'WebGL is not supported in this browser.',
            [EnhancementErrorCode.WEBGL2_NOT_SUPPORTED]: 'WebGL2 is not supported in this browser.',
            [EnhancementErrorCode.INSUFFICIENT_MEMORY]: 'Not enough memory available for processing.',
            [EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED]: 'Memory limit exceeded during processing.',
            [EnhancementErrorCode.VIDEO_TOO_LARGE]: 'Video file is too large to process.',
            [EnhancementErrorCode.PROCESSING_FAILED]: 'Video processing failed.',
            [EnhancementErrorCode.FRAME_PROCESSING_FAILED]: 'Frame processing failed.',
            [EnhancementErrorCode.AUDIO_PROCESSING_FAILED]: 'Audio processing failed.',
            [EnhancementErrorCode.STABILIZATION_FAILED]: 'Video stabilization failed.',
            [EnhancementErrorCode.INVALID_VIDEO_FORMAT]: 'Unsupported video format.',
            [EnhancementErrorCode.INVALID_AUDIO_FORMAT]: 'Unsupported audio format.',
            [EnhancementErrorCode.INVALID_CONFIGURATION]: 'Invalid enhancement configuration.',
            [EnhancementErrorCode.INVALID_SETTINGS]: 'Invalid enhancement settings.',
            [EnhancementErrorCode.AUDIO_CONTEXT_ERROR]: 'Audio context initialization failed.',
            [EnhancementErrorCode.AUDIO_CONTEXT_SUSPENDED]: 'Audio context was suspended.',
            [EnhancementErrorCode.AUDIO_ANALYSIS_FAILED]: 'Audio analysis failed.',
            [EnhancementErrorCode.TIMEOUT]: 'Processing timed out.',
            [EnhancementErrorCode.PROCESSING_TIMEOUT]: 'Processing took too long.',
            [EnhancementErrorCode.FRAME_RATE_TOO_LOW]: 'Video frame rate is too low.',
            [EnhancementErrorCode.FILE_READ_ERROR]: 'Failed to read video file.',
            [EnhancementErrorCode.DATA_CORRUPTION]: 'Video data appears to be corrupted.',
            [EnhancementErrorCode.UNSUPPORTED_CODEC]: 'Video codec is not supported.',
            [EnhancementErrorCode.BROWSER_NOT_SUPPORTED]: 'Browser is not supported.',
            [EnhancementErrorCode.FEATURE_NOT_SUPPORTED]: 'Feature is not supported.',
            [EnhancementErrorCode.SECURITY_RESTRICTION]: 'Security restrictions prevent processing.',
            [EnhancementErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred.',
            [EnhancementErrorCode.NETWORK_ERROR]: 'Network error occurred.',
            [EnhancementErrorCode.PERMISSION_DENIED]: 'Permission denied for required resources.'
        }
        return messages[code] || 'An error occurred during video enhancement.'
    }

    private getDefaultSuggestion(code: EnhancementErrorCode): string {
        const suggestions: Record<EnhancementErrorCode, string> = {
            [EnhancementErrorCode.GPU_NOT_AVAILABLE]: 'Try using CPU processing or update your graphics drivers.',
            [EnhancementErrorCode.GPU_CONTEXT_LOST]: 'Try processing again or restart the application.',
            [EnhancementErrorCode.WEBGL_NOT_SUPPORTED]: 'Update your browser or try a different browser.',
            [EnhancementErrorCode.WEBGL2_NOT_SUPPORTED]: 'Update your browser to a newer version.',
            [EnhancementErrorCode.INSUFFICIENT_MEMORY]: 'Close other applications or try processing a smaller video.',
            [EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED]: 'Try processing the video in smaller chunks.',
            [EnhancementErrorCode.VIDEO_TOO_LARGE]: 'Try compressing the video or processing in chunks.',
            [EnhancementErrorCode.PROCESSING_FAILED]: 'Check your video file and try again.',
            [EnhancementErrorCode.FRAME_PROCESSING_FAILED]: 'Try reducing video quality or using different settings.',
            [EnhancementErrorCode.AUDIO_PROCESSING_FAILED]: 'Check audio settings and try again.',
            [EnhancementErrorCode.STABILIZATION_FAILED]: 'Try reducing stabilization strength.',
            [EnhancementErrorCode.INVALID_VIDEO_FORMAT]: 'Convert your video to a supported format (MP4, WebM).',
            [EnhancementErrorCode.INVALID_AUDIO_FORMAT]: 'Check audio format compatibility.',
            [EnhancementErrorCode.INVALID_CONFIGURATION]: 'Reset enhancement settings to defaults.',
            [EnhancementErrorCode.INVALID_SETTINGS]: 'Check enhancement settings and try again.',
            [EnhancementErrorCode.AUDIO_CONTEXT_ERROR]: 'Try refreshing the page or check browser permissions.',
            [EnhancementErrorCode.AUDIO_CONTEXT_SUSPENDED]: 'Click anywhere on the page to resume audio processing.',
            [EnhancementErrorCode.AUDIO_ANALYSIS_FAILED]: 'Try different audio enhancement settings.',
            [EnhancementErrorCode.TIMEOUT]: 'Try processing a smaller video or reduce quality settings.',
            [EnhancementErrorCode.PROCESSING_TIMEOUT]: 'Try reducing video resolution or frame rate.',
            [EnhancementErrorCode.FRAME_RATE_TOO_LOW]: 'Use a video with higher frame rate.',
            [EnhancementErrorCode.FILE_READ_ERROR]: 'Check if the video file is accessible and not corrupted.',
            [EnhancementErrorCode.DATA_CORRUPTION]: 'Try re-encoding the video file.',
            [EnhancementErrorCode.UNSUPPORTED_CODEC]: 'Convert to a supported codec (H.264, VP9).',
            [EnhancementErrorCode.BROWSER_NOT_SUPPORTED]: 'Use a modern browser like Chrome, Firefox, or Safari.',
            [EnhancementErrorCode.FEATURE_NOT_SUPPORTED]: 'This feature is not available in your browser.',
            [EnhancementErrorCode.SECURITY_RESTRICTION]: 'Check browser security settings and permissions.',
            [EnhancementErrorCode.UNKNOWN_ERROR]: 'Try refreshing the page or contact support.',
            [EnhancementErrorCode.NETWORK_ERROR]: 'Check your internet connection and try again.',
            [EnhancementErrorCode.PERMISSION_DENIED]: 'Grant necessary permissions and try again.'
        }
        return suggestions[code] || 'Please try again or contact support if the problem persists.'
    }
}
