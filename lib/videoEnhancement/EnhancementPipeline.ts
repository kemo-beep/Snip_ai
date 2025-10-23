/**
 * EnhancementPipeline - Core orchestrator for video and audio enhancements
 * Coordinates VideoProcessor, AudioProcessor, and FrameProcessor
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.2, 8.3
 */

import type {
    EnhancementConfig,
    EnhancementSettings,
    EnhancementResult,
    EnhancementMetrics,
    ProcessingContext,
    FrameData,
    AudioData,
    EnhancementError,
    ErrorRecoveryStrategy
} from './types'
import { EnhancementErrorCode } from './types'
import { VideoProcessor } from './processors/VideoProcessor'
import { AudioProcessor } from './processors/AudioProcessor'
import { FrameProcessor } from './processors/FrameProcessor'
import { getGPUCapabilities } from './utils/gpuDetection'
import { ErrorHandler, MemoryManager } from './utils/errorHandler'

/**
 * Options for initializing the enhancement pipeline
 */
export interface EnhancementPipelineOptions {
    useGPU?: boolean
    targetFPS?: number
    maxMemoryMB?: number
}

/**
 * EnhancementPipeline class - Main orchestrator for video enhancement
 */
export class EnhancementPipeline {
    private config: EnhancementConfig
    private settings: EnhancementSettings
    private context: ProcessingContext | null = null
    private videoProcessor: VideoProcessor | null = null
    private audioProcessor: AudioProcessor | null = null
    private frameProcessor: FrameProcessor | null = null
    private initialized: boolean = false
    private metrics: EnhancementMetrics
    private appliedEnhancements: string[] = []
    private skippedEnhancements: string[] = []
    private errorHandler: ErrorHandler
    private lastError: EnhancementError | null = null
    private errorState: 'none' | 'error' | 'recovering' = 'none'

    constructor(config: EnhancementConfig, settings?: Partial<EnhancementSettings>) {
        this.config = config
        this.settings = this.mergeWithDefaultSettings(settings)
        this.metrics = this.createEmptyMetrics()
        this.errorHandler = ErrorHandler.getInstance()
    }

    /**
     * Merge provided settings with defaults
     */
    private mergeWithDefaultSettings(settings?: Partial<EnhancementSettings>): EnhancementSettings {
        const defaults: EnhancementSettings = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            noiseReduction: 70,
            volumeBoost: 0,
            voiceClarity: 60,
            echoReduction: 60,
            stabilizationStrength: 50
        }

        return { ...defaults, ...settings }
    }

    /**
     * Create empty metrics object
     */
    private createEmptyMetrics(): EnhancementMetrics {
        return {
            brightnessAdjustment: 0,
            contrastAdjustment: 0,
            colorTemperatureShift: 0,
            noiseReductionDb: 0,
            volumeAdjustmentDb: 0,
            shakeReduction: 0
        }
    }

    /**
     * Initialize the enhancement pipeline
     * Requirements: 4.1, 8.2, 8.3
     * 
     * @param videoElement - Optional video element for analysis
     * @param options - Initialization options
     */
    async initialize(
        videoElement?: HTMLVideoElement,
        options: EnhancementPipelineOptions = {}
    ): Promise<void> {
        if (this.initialized) {
            console.warn('EnhancementPipeline already initialized')
            return
        }

        try {
            // Detect GPU capabilities
            const gpuCapabilities = getGPUCapabilities()
            const useGPU = options.useGPU !== false && (gpuCapabilities.webgl || gpuCapabilities.webgl2)

            // Create canvas for processing
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d', { willReadFrequently: true })

            if (!ctx) {
                throw new Error('Failed to create 2D canvas context')
            }

            // Try to create WebGL context if GPU is enabled
            let gl: WebGLRenderingContext | WebGL2RenderingContext | undefined

            if (useGPU) {
                try {
                    gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null || undefined

                    if (!gl) {
                        console.warn('WebGL not available, falling back to CPU processing')
                    }
                } catch (error) {
                    console.warn('Error creating WebGL context:', error)
                }
            }

            // Create AudioContext for audio processing
            let audioContext: AudioContext | undefined

            try {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            } catch (error) {
                console.warn('AudioContext not available, audio enhancements will be disabled:', error)
            }

            // Create processing context
            this.context = {
                canvas,
                ctx,
                gl,
                audioContext,
                useGPU: useGPU && !!gl
            }

            // Initialize processors
            this.videoProcessor = new VideoProcessor(this.context)
            this.frameProcessor = new FrameProcessor(this.context)

            // Initialize audio processor if audio context is available
            if (audioContext) {
                this.audioProcessor = new AudioProcessor(
                    {
                        enableNoiseReduction: this.config.autoNoiseReduction,
                        enableVolumeNormalization: this.config.autoVolumeNormalization,
                        enableVoiceEnhancement: this.config.autoVoiceEnhancement,
                        enableEchoCancellation: this.config.autoEchoCancel
                    },
                    {
                        noiseReduction: { strength: this.settings.noiseReduction, adaptiveThreshold: true },
                        volumeNormalization: { targetLevel: 70 + this.settings.volumeBoost, method: 'rms', preventClipping: true },
                        voiceEnhancement: { clarity: this.settings.voiceClarity, preserveNaturalness: true },
                        echoCancellation: { reduction: this.settings.echoReduction, detectDelay: true }
                    }
                )
            }

            this.initialized = true

            console.log('EnhancementPipeline initialized', {
                useGPU: this.context.useGPU,
                hasAudioContext: !!audioContext,
                gpuCapabilities
            })
        } catch (error) {
            const enhancementError = error as EnhancementError
            console.error('Failed to initialize EnhancementPipeline:', error)
            throw {
                message: 'Failed to initialize enhancement pipeline',
                code: EnhancementErrorCode.PROCESSING_FAILED,
                recoverable: false,
                originalError: error
            }
        }
    }

    /**
     * Dispose of all resources and clean up
     */
    dispose(): void {
        if (!this.initialized) {
            return
        }

        try {
            // Dispose processors
            if (this.videoProcessor) {
                this.videoProcessor.dispose()
                this.videoProcessor = null
            }

            if (this.frameProcessor) {
                this.frameProcessor.dispose()
                this.frameProcessor = null
            }

            // Close audio context
            if (this.context?.audioContext) {
                this.context.audioContext.close().catch(err => {
                    console.warn('Error closing AudioContext:', err)
                })
            }

            // Clear context
            this.context = null
            this.initialized = false

            console.log('EnhancementPipeline disposed')
        } catch (error) {
            console.error('Error disposing EnhancementPipeline:', error)
        }
    }

    /**
     * Check if pipeline is initialized
     */
    isInitialized(): boolean {
        return this.initialized
    }

    /**
     * Get current configuration
     */
    getConfig(): EnhancementConfig {
        return { ...this.config }
    }

    /**
     * Get current settings
     */
    getSettings(): EnhancementSettings {
        return { ...this.settings }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<EnhancementConfig>): void {
        this.config = { ...this.config, ...config }

        // Update audio processor config if available
        if (this.audioProcessor) {
            this.audioProcessor.updateConfig({
                enableNoiseReduction: this.config.autoNoiseReduction,
                enableVolumeNormalization: this.config.autoVolumeNormalization,
                enableVoiceEnhancement: this.config.autoVoiceEnhancement,
                enableEchoCancellation: this.config.autoEchoCancel
            })
        }
    }

    /**
     * Update settings
     */
    updateSettings(settings: Partial<EnhancementSettings>): void {
        this.settings = { ...this.settings, ...settings }

        // Update audio processor settings if available
        if (this.audioProcessor) {
            this.audioProcessor.updateSettings({
                noiseReduction: { strength: this.settings.noiseReduction, adaptiveThreshold: true },
                volumeNormalization: { targetLevel: 70 + this.settings.volumeBoost, method: 'rms', preventClipping: true },
                voiceEnhancement: { clarity: this.settings.voiceClarity, preserveNaturalness: true },
                echoCancellation: { reduction: this.settings.echoReduction, detectDelay: true }
            })
        }
    }

    /**
     * Get processing context
     */
    getContext(): ProcessingContext | null {
        return this.context
    }

    /**
     * Check if GPU processing is being used
     */
    isUsingGPU(): boolean {
        return this.context?.useGPU || false
    }

    /**
     * Get current metrics
     */
    getMetrics(): EnhancementMetrics {
        return { ...this.metrics }
    }

    /**
     * Get list of applied enhancements
     */
    getAppliedEnhancements(): string[] {
        return [...this.appliedEnhancements]
    }

    /**
     * Get list of skipped enhancements
     */
    getSkippedEnhancements(): string[] {
        return [...this.skippedEnhancements]
    }

    /**
     * Reset metrics and enhancement tracking
     */
    private resetMetrics(): void {
        this.metrics = this.createEmptyMetrics()
        this.appliedEnhancements = []
        this.skippedEnhancements = []
    }

    /**
     * Ensure pipeline is initialized
     */
    private ensureInitialized(): void {
        if (!this.initialized || !this.context) {
            throw {
                message: 'EnhancementPipeline not initialized. Call initialize() first.',
                code: EnhancementErrorCode.PROCESSING_FAILED,
                recoverable: true
            }
        }
    }

    /**
     * Analyze video to determine optimal enhancement settings
     * Requirements: 1.1, 5.1, 5.2, 7.1, 7.2
     * 
     * Samples frames from the video and analyzes them to calculate
     * recommended enhancement settings.
     * 
     * @param videoElement - The video element to analyze
     * @param options - Analysis options
     * @returns Recommended enhancement settings
     */
    async analyzeVideo(
        videoElement: HTMLVideoElement,
        options: {
            sampleFrames?: number
            sampleInterval?: number
        } = {}
    ): Promise<EnhancementSettings> {
        this.ensureInitialized()

        if (!this.videoProcessor) {
            throw {
                message: 'VideoProcessor not available',
                code: EnhancementErrorCode.PROCESSING_FAILED,
                recoverable: false
            }
        }

        const { canvas, ctx } = this.context!
        const duration = videoElement.duration
        const sampleFrames = options.sampleFrames || 10

        // Calculate sample interval (every Nth frame)
        // If sampleInterval is provided, use it; otherwise calculate based on duration
        const sampleInterval = options.sampleInterval || Math.max(1, Math.floor(duration / sampleFrames))

        console.log(`Analyzing video: duration=${duration}s, sampling ${sampleFrames} frames`)

        // Set canvas size to match video
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight

        // Collect analysis results from sampled frames
        const analysisResults: Array<{
            brightness: number
            contrast: number
            temperature: number
        }> = []

        // Sample frames at regular intervals
        for (let i = 0; i < sampleFrames; i++) {
            const timestamp = (i * sampleInterval) + (sampleInterval / 2)

            // Seek to timestamp
            videoElement.currentTime = Math.min(timestamp, duration - 0.1)

            // Wait for seek to complete
            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    videoElement.removeEventListener('seeked', onSeeked)
                    resolve()
                }
                videoElement.addEventListener('seeked', onSeeked)

                // Timeout after 1 second
                setTimeout(() => {
                    videoElement.removeEventListener('seeked', onSeeked)
                    resolve()
                }, 1000)
            })

            // Draw frame to canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            // Analyze frame
            const analysis = this.videoProcessor.analyzeFrame(imageData)

            analysisResults.push({
                brightness: analysis.averageBrightness,
                contrast: analysis.contrast,
                temperature: analysis.colorTemperature
            })
        }

        // Calculate average values
        const avgBrightness = analysisResults.reduce((sum, r) => sum + r.brightness, 0) / analysisResults.length
        const avgContrast = analysisResults.reduce((sum, r) => sum + r.contrast, 0) / analysisResults.length
        const avgTemperature = analysisResults.reduce((sum, r) => sum + r.temperature, 0) / analysisResults.length

        // Calculate recommended adjustments
        // Brightness: target is 128 (mid-range), scale to -100 to 100
        const brightnessAdjustment = Math.max(-50, Math.min(50, ((128 - avgBrightness) / 255) * 100 * 0.6))

        // Contrast: target is 50, scale to -100 to 100
        const contrastAdjustment = Math.max(-30, Math.min(30, (50 - avgContrast) * 0.5))

        // Temperature: aim for neutral (0), scale adjustment
        const temperatureAdjustment = Math.max(-40, Math.min(40, -avgTemperature * 0.7))

        // Create recommended settings
        const recommendedSettings: EnhancementSettings = {
            brightness: Math.round(brightnessAdjustment),
            contrast: Math.round(contrastAdjustment),
            saturation: 0, // Default, can be adjusted based on color analysis
            temperature: Math.round(temperatureAdjustment),
            noiseReduction: this.settings.noiseReduction,
            volumeBoost: this.settings.volumeBoost,
            voiceClarity: this.settings.voiceClarity,
            echoReduction: this.settings.echoReduction,
            stabilizationStrength: this.settings.stabilizationStrength
        }

        console.log('Video analysis complete', {
            avgBrightness,
            avgContrast,
            avgTemperature,
            recommendedSettings
        })

        return recommendedSettings
    }

    /**
     * Process a single frame with enhancements
     * Requirements: 1.6, 1.7, 4.3
     * 
     * @param frame - The frame to process
     * @returns Processed frame data
     */
    processFrame(frame: FrameData): FrameData {
        this.ensureInitialized()

        if (!this.frameProcessor) {
            throw {
                message: 'FrameProcessor not available',
                code: EnhancementErrorCode.PROCESSING_FAILED,
                recoverable: false
            }
        }

        // Build processing settings from config and current settings
        const processingSettings: any = {}

        // Add color correction if enabled
        if (this.config.autoColorCorrection || this.config.autoBrightnessAdjust ||
            this.config.autoContrast || this.config.autoWhiteBalance) {
            processingSettings.colorCorrection = {
                brightness: this.settings.brightness,
                contrast: this.settings.contrast,
                saturation: this.settings.saturation,
                temperature: this.settings.temperature
            }
        }

        // Process the frame
        const result = this.frameProcessor.processFrame(frame, processingSettings)

        return result.processedFrame
    }

    /**
     * Process audio with enhancements
     * Requirements: 2.6, 2.7, 4.3
     * 
     * @param audioData - The audio data to process
     * @param onProgress - Optional progress callback
     * @returns Processed audio buffer
     */
    async processAudio(
        audioData: AudioData,
        onProgress?: (progress: number) => void
    ): Promise<AudioBuffer> {
        this.ensureInitialized()

        if (!this.audioProcessor) {
            console.warn('AudioProcessor not available, returning original audio')
            return audioData.buffer
        }

        // Process audio through the audio processor
        const result = await this.audioProcessor.processAudio(audioData.buffer, onProgress)

        // Update metrics
        const analysis = result.analysis
        this.metrics.noiseReductionDb = analysis.noiseFloor
        this.metrics.volumeAdjustmentDb = analysis.averageVolume

        // Track applied/skipped enhancements
        result.applied.forEach(enhancement => {
            if (!this.appliedEnhancements.includes(enhancement)) {
                this.appliedEnhancements.push(enhancement)
            }
        })
        result.skipped.forEach(enhancement => {
            if (!this.skippedEnhancements.includes(enhancement)) {
                this.skippedEnhancements.push(enhancement)
            }
        })

        return result.processedBuffer
    }

    /**
     * Enhance entire video blob
     * Requirements: 1.7, 2.7, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
     * 
     * This is a placeholder implementation. Full video processing requires
     * extracting frames from the blob, processing each frame, and recombining.
     * This would typically be done using FFmpeg or similar tools.
     * 
     * @param videoBlob - The video blob to enhance
     * @param onProgress - Optional progress callback (0-1)
     * @returns Enhanced video blob
     */
    async enhanceVideo(
        videoBlob: Blob,
        onProgress?: (progress: number) => void
    ): Promise<Blob> {
        this.ensureInitialized()

        console.log('enhanceVideo called - this is a placeholder implementation')

        // Reset metrics for new processing
        this.resetMetrics()

        onProgress?.(0.1)

        // TODO: Implement full video enhancement
        // This would require:
        // 1. Extract frames from video blob
        // 2. Process each frame with processFrame()
        // 3. Extract and process audio with processAudio()
        // 4. Recombine frames and audio into output blob

        // For now, return the original blob
        console.warn('Full video enhancement not yet implemented, returning original video')

        onProgress?.(1.0)

        return videoBlob
    }

    /**
     * Generate preview of enhancements
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
     * 
     * @param videoElement - The video element to preview
     * @param timestamp - Optional timestamp to preview (defaults to middle of video)
     * @returns Original and enhanced image data for comparison
     */
    async generatePreview(
        videoElement: HTMLVideoElement,
        timestamp?: number
    ): Promise<{ original: ImageData; enhanced: ImageData }> {
        this.ensureInitialized()

        const { canvas, ctx } = this.context!

        // Set canvas size to match video
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight

        // Use middle of video if no timestamp provided
        const previewTime = timestamp !== undefined ? timestamp : videoElement.duration / 2

        // Seek to timestamp
        videoElement.currentTime = previewTime

        // Wait for seek to complete
        await new Promise<void>((resolve) => {
            const onSeeked = () => {
                videoElement.removeEventListener('seeked', onSeeked)
                resolve()
            }
            videoElement.addEventListener('seeked', onSeeked)

            // Timeout after 1 second
            setTimeout(() => {
                videoElement.removeEventListener('seeked', onSeeked)
                resolve()
            }, 1000)
        })

        // Draw frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

        // Get original image data
        const original = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Create frame data
        const frame: FrameData = {
            imageData: new ImageData(
                new Uint8ClampedArray(original.data),
                original.width,
                original.height
            ),
            timestamp: previewTime,
            index: 0
        }

        // Process frame with enhancements
        const enhancedFrame = this.processFrame(frame)

        console.log('Preview generated', {
            timestamp: previewTime,
            dimensions: `${canvas.width}x${canvas.height}`
        })

        return {
            original,
            enhanced: enhancedFrame.imageData
        }
    }

    /**
     * Handle errors and determine recovery strategy
     */
    private handleError(error: Error, context: any = {}): EnhancementError {
        const enhancementError = this.errorHandler.handleError(error, {
            component: 'EnhancementPipeline',
            ...context
        })

        this.lastError = enhancementError
        this.errorState = 'error'

        return enhancementError
    }

    /**
     * Attempt error recovery based on strategy
     */
    private async attemptRecovery(error: EnhancementError): Promise<boolean> {
        if (!this.errorHandler.isRecoverable(error)) {
            return false
        }

        this.errorState = 'recovering'

        try {
            switch (error.recoveryStrategy) {
                case ErrorRecoveryStrategy.RETRY:
                    // Simple retry - just return true to allow retry
                    return true

                case ErrorRecoveryStrategy.FALLBACK_TO_CPU:
                    // Disable GPU processing
                    if (this.context) {
                        this.context.useGPU = false
                    }
                    return true

                case ErrorRecoveryStrategy.REDUCE_QUALITY:
                    // Reduce processing quality
                    this.settings = this.reduceQualitySettings(this.settings)
                    return true

                case ErrorRecoveryStrategy.CHUNK_PROCESSING:
                    // Enable chunk processing for large videos
                    return true

                case ErrorRecoveryStrategy.SKIP_ENHANCEMENT:
                    // Skip the problematic enhancement
                    return true

                default:
                    return false
            }
        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError)
            return false
        } finally {
            this.errorState = 'none'
        }
    }

    /**
     * Reduce quality settings for memory-constrained processing
     */
    private reduceQualitySettings(settings: EnhancementSettings): EnhancementSettings {
        return {
            ...settings,
            brightness: Math.round(settings.brightness * 0.8),
            contrast: Math.round(settings.contrast * 0.8),
            saturation: Math.round(settings.saturation * 0.8),
            temperature: Math.round(settings.temperature * 0.8),
            noiseReduction: Math.round(settings.noiseReduction * 0.8),
            volumeBoost: Math.round(settings.volumeBoost * 0.8),
            voiceClarity: Math.round(settings.voiceClarity * 0.8),
            echoReduction: Math.round(settings.echoReduction * 0.8),
            stabilizationStrength: Math.round(settings.stabilizationStrength * 0.8)
        }
    }

    /**
     * Get the last error that occurred
     */
    public getLastError(): EnhancementError | null {
        return this.lastError
    }

    /**
     * Get current error state
     */
    public getErrorState(): 'none' | 'error' | 'recovering' {
        return this.errorState
    }

    /**
     * Clear error state
     */
    public clearError(): void {
        this.lastError = null
        this.errorState = 'none'
    }

    /**
     * Check if video size is acceptable for processing
     */
    private validateVideoSize(videoBlob: Blob): boolean {
        if (MemoryManager.isVideoTooLarge(videoBlob.size)) {
            const error = new EnhancementError(
                'Video file is too large for processing',
                EnhancementErrorCode.VIDEO_TOO_LARGE,
                {
                    context: {
                        videoSize: videoBlob.size,
                        memoryLimit: MemoryManager.MEMORY_LIMIT_MB
                    },
                    recoveryStrategy: ErrorRecoveryStrategy.CHUNK_PROCESSING
                }
            )
            this.handleError(error)
            return false
        }
        return true
    }
}
