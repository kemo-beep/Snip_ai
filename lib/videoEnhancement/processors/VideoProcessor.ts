/**
 * VideoProcessor - Main video processing class with GPU and CPU support
 * Orchestrates color correction, white balance, and stabilization
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 8.2, 8.3
 */

import type { ProcessingContext, FrameData, EnhancementError, EnhancementErrorCode } from '../types'
import { analyzeFrame, type ColorAnalysisResult } from '../utils/colorAnalysis'
import { shouldUseGPUProcessing } from '../utils/gpuDetection'
import { ErrorHandler, MemoryManager, GPUFallbackManager } from '../utils/errorHandler'
import {
    createShaderProgram,
    STANDARD_VERTEX_SHADER,
    COMBINED_COLOR_CORRECTION_SHADER,
    setupQuadGeometry,
    createTextureFromImageData,
    readPixelsToImageData,
    clearShaderCache
} from '../utils/shaderUtils'
import {
    applyColorCorrectionCPU,
    type ColorCorrectionSettings
} from '../enhancements/colorCorrection'
import {
    applyWhiteBalanceCPU,
    calculateOptimalWhiteBalance
} from '../enhancements/whiteBalance'
import {
    calculateStabilizationTransform,
    applyStabilization,
    type StabilizationResult,
    type StabilizationTransform
} from '../enhancements/stabilization'
import type { MotionVector } from '../utils/motionDetection'

/**
 * Settings for video processing
 */
export interface VideoProcessingSettings {
    colorCorrection?: ColorCorrectionSettings
    whiteBalance?: number // -100 to 100
    stabilization?: {
        enabled: boolean
        strength: number // 0 to 100
        maxCrop: number // 0 to 0.1 (10%)
    }
}

/**
 * Result of frame analysis
 */
export interface FrameAnalysisResult extends ColorAnalysisResult {
    recommendedSettings: VideoProcessingSettings
}

/**
 * VideoProcessor class for processing video frames with enhancements
 */
export class VideoProcessor {
    private context: ProcessingContext
    private useGPU: boolean
    private colorCorrectionProgram: WebGLProgram | null = null
    private initialized: boolean = false
    private errorHandler: ErrorHandler
    private gpuFallbackAttempted: boolean = false
    private lastError: EnhancementError | null = null

    constructor(context: ProcessingContext) {
        this.context = context
        this.useGPU = context.useGPU && !!context.gl && shouldUseGPUProcessing()
        this.errorHandler = ErrorHandler.getInstance()

        if (this.useGPU && context.gl) {
            this.initializeGPU(context.gl)
        }
    }

    /**
     * Initialize GPU resources
     */
    private initializeGPU(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
        try {
            // Create combined color correction shader program
            this.colorCorrectionProgram = createShaderProgram(
                gl,
                STANDARD_VERTEX_SHADER,
                COMBINED_COLOR_CORRECTION_SHADER,
                'color-correction'
            )

            if (!this.colorCorrectionProgram) {
                console.warn('Failed to create color correction shader, falling back to CPU')
                this.useGPU = false
                return
            }

            // Setup geometry for full-screen quad
            setupQuadGeometry(gl, this.colorCorrectionProgram)

            this.initialized = true
        } catch (error) {
            const enhancementError = this.errorHandler.handleError(error as Error, {
                component: 'VideoProcessor',
                operation: 'initializeGPU',
                gpuAvailable: !!gl
            })

            this.lastError = enhancementError
            this.useGPU = false
            this.gpuFallbackAttempted = true
        }
    }

    /**
     * Apply color correction to a frame
     * @param imageData - The image data to process
     * @param settings - Color correction settings
     * @returns Processed image data
     */
    applyColorCorrection(
        imageData: ImageData,
        settings: ColorCorrectionSettings
    ): ImageData {
        if (this.useGPU && this.context.gl && this.colorCorrectionProgram) {
            try {
                return this.applyColorCorrectionGPU(imageData, settings)
            } catch (error) {
                const enhancementError = this.errorHandler.handleError(error as Error, {
                    component: 'VideoProcessor',
                    operation: 'applyColorCorrection',
                    gpuAvailable: !!this.context.gl
                })

                this.lastError = enhancementError

                // Attempt GPU fallback if not already attempted
                if (!this.gpuFallbackAttempted && this.errorHandler.shouldAttemptGPUFallback(enhancementError)) {
                    this.useGPU = false
                    this.gpuFallbackAttempted = true
                    console.warn('GPU processing failed, falling back to CPU:', enhancementError.userMessage)
                } else {
                    throw enhancementError
                }
            }
        }

        // CPU fallback
        try {
            const result = new ImageData(
                new Uint8ClampedArray(imageData.data),
                imageData.width,
                imageData.height
            )
            applyColorCorrectionCPU(result, settings)
            return result
        } catch (error) {
            const enhancementError = this.errorHandler.handleError(error as Error, {
                component: 'VideoProcessor',
                operation: 'applyColorCorrectionCPU'
            })
            throw enhancementError
        }
    }

    /**
     * Apply color correction using GPU
     */
    private applyColorCorrectionGPU(
        imageData: ImageData,
        settings: ColorCorrectionSettings
    ): ImageData {
        const gl = this.context.gl!
        const program = this.colorCorrectionProgram!
        const width = imageData.width
        const height = imageData.height

        // Create and bind framebuffer
        const framebuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

        // Create output texture
        const outputTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, outputTexture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        // Attach texture to framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            outputTexture,
            0
        )

        // Create input texture
        const inputTexture = createTextureFromImageData(gl, imageData)
        if (!inputTexture) {
            throw new Error('Failed to create input texture')
        }

        // Use shader program
        gl.useProgram(program)

        // Set uniforms
        gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0)
        gl.uniform1f(
            gl.getUniformLocation(program, 'u_brightness'),
            settings.brightness / 100
        )
        gl.uniform1f(
            gl.getUniformLocation(program, 'u_contrast'),
            settings.contrast / 100
        )
        gl.uniform1f(
            gl.getUniformLocation(program, 'u_saturation'),
            settings.saturation / 100
        )
        gl.uniform1f(
            gl.getUniformLocation(program, 'u_temperature'),
            (settings.temperature || 0) / 100
        )

        // Bind input texture
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, inputTexture)

        // Set viewport and draw
        gl.viewport(0, 0, width, height)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        // Read pixels
        const result = readPixelsToImageData(gl, width, height)

        // Cleanup
        gl.deleteTexture(inputTexture)
        gl.deleteTexture(outputTexture)
        gl.deleteFramebuffer(framebuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        return result
    }

    /**
     * Apply white balance correction to a frame
     * @param imageData - The image data to process
     * @param adjustment - Temperature adjustment (-100 to 100)
     * @returns Processed image data
     */
    applyWhiteBalance(imageData: ImageData, adjustment: number): ImageData {
        // For now, use CPU implementation
        // GPU implementation can be added later if needed
        const result = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        )
        applyWhiteBalanceCPU(result, adjustment)
        return result
    }

    /**
     * Apply stabilization to a frame
     * @param imageData - The image data to process
     * @param transform - Stabilization transform to apply
     * @returns Processed image data
     */
    applyStabilization(
        imageData: ImageData,
        transform: StabilizationTransform
    ): ImageData {
        // Use CPU implementation for stabilization
        return applyStabilization(imageData, transform)
    }

    /**
     * Calculate stabilization transform for a frame
     * @param currentMotion - Current frame motion vector
     * @param smoothedMotion - Smoothed motion vector
     * @param maxCrop - Maximum crop percentage (default: 0.05)
     * @returns Stabilization result
     */
    calculateStabilization(
        currentMotion: MotionVector,
        smoothedMotion: MotionVector,
        maxCrop: number = 0.05
    ): StabilizationResult {
        return calculateStabilizationTransform(currentMotion, smoothedMotion, maxCrop)
    }

    /**
     * Analyze a frame for color properties
     * @param imageData - The image data to analyze
     * @returns Frame analysis result with recommended settings
     */
    analyzeFrame(imageData: ImageData): FrameAnalysisResult {
        const analysis = analyzeFrame(imageData)

        // Calculate recommended settings based on analysis
        const recommendedSettings: VideoProcessingSettings = {
            colorCorrection: {
                brightness: this.calculateBrightnessAdjustment(analysis.averageBrightness),
                contrast: this.calculateContrastAdjustment(analysis.contrast),
                saturation: 0, // Default, can be adjusted based on needs
                temperature: this.calculateTemperatureAdjustment(analysis.colorTemperature)
            },
            whiteBalance: calculateOptimalWhiteBalance(imageData, 0)
        }

        return {
            ...analysis,
            recommendedSettings
        }
    }

    /**
     * Calculate recommended brightness adjustment
     * @param averageBrightness - Current average brightness (0-255)
     * @returns Recommended adjustment (-100 to 100)
     */
    private calculateBrightnessAdjustment(averageBrightness: number): number {
        const target = 128 // Target mid-range brightness
        const difference = target - averageBrightness

        // Scale to -100 to 100 range, with dampening
        const adjustment = (difference / 255) * 100 * 0.6

        // Clamp to reasonable range
        return Math.max(-50, Math.min(50, adjustment))
    }

    /**
     * Calculate recommended contrast adjustment
     * @param contrast - Current contrast level (0-100)
     * @returns Recommended adjustment (-100 to 100)
     */
    private calculateContrastAdjustment(contrast: number): number {
        const target = 50 // Target mid-range contrast
        const difference = target - contrast

        // Scale adjustment
        const adjustment = difference * 0.5

        // Clamp to reasonable range
        return Math.max(-30, Math.min(30, adjustment))
    }

    /**
     * Calculate recommended temperature adjustment
     * @param colorTemperature - Current color temperature (-100 to 100)
     * @returns Recommended adjustment (-100 to 100)
     */
    private calculateTemperatureAdjustment(colorTemperature: number): number {
        // Aim for neutral temperature (0)
        const adjustment = -colorTemperature * 0.7

        // Clamp to reasonable range
        return Math.max(-40, Math.min(40, adjustment))
    }

    /**
     * Process a complete frame with all enhancements
     * @param frame - The frame to process
     * @param settings - Processing settings
     * @returns Processed frame
     */
    processFrame(frame: FrameData, settings: VideoProcessingSettings): FrameData {
        let processedData = new ImageData(
            new Uint8ClampedArray(frame.imageData.data),
            frame.imageData.width,
            frame.imageData.height
        )

        // Apply color correction if specified
        if (settings.colorCorrection) {
            processedData = this.applyColorCorrection(processedData, settings.colorCorrection)
        }

        // Apply white balance if specified
        if (settings.whiteBalance !== undefined && settings.whiteBalance !== 0) {
            processedData = this.applyWhiteBalance(processedData, settings.whiteBalance)
        }

        return {
            imageData: processedData,
            timestamp: frame.timestamp,
            index: frame.index
        }
    }

    /**
     * Check if GPU processing is being used
     */
    isUsingGPU(): boolean {
        return this.useGPU && this.initialized
    }

    /**
     * Force CPU processing mode
     */
    forceCPUMode(): void {
        this.useGPU = false
    }

    /**
     * Get processing context
     */
    getContext(): ProcessingContext {
        return this.context
    }

    /**
     * Clean up GPU resources
     */
    dispose(): void {
        if (this.context.gl) {
            if (this.colorCorrectionProgram) {
                this.context.gl.deleteProgram(this.colorCorrectionProgram)
                this.colorCorrectionProgram = null
            }
            clearShaderCache(this.context.gl)
        }
        this.initialized = false
    }
}
