/**
 * FrameProcessor - Single frame processing with color corrections and stabilization
 * Provides both CPU and GPU processing paths for individual frames
 * Requirements: 1.6, 1.7
 */

import type { FrameData, ProcessingContext } from '../types'
import {
    applyColorCorrectionCPU,
    applyColorCorrectionGPU,
    createColorCorrectionProgram,
    createTextureFromImageData,
    type ColorCorrectionSettings
} from '../enhancements/colorCorrection'
import type { StabilizationResult } from '../enhancements/stabilization'

/**
 * Settings for frame processing
 */
export interface FrameProcessingSettings {
    colorCorrection?: ColorCorrectionSettings
    applyStabilization?: boolean
}

/**
 * Result of frame processing
 */
export interface FrameProcessingResult {
    processedFrame: FrameData
    appliedEnhancements: string[]
    processingTimeMs: number
}

/**
 * FrameProcessor class for processing individual video frames
 */
export class FrameProcessor {
    private context: ProcessingContext
    private colorCorrectionProgram: WebGLProgram | null = null
    private useGPU: boolean

    constructor(context: ProcessingContext) {
        this.context = context
        this.useGPU = context.useGPU && !!context.gl

        // Initialize GPU resources if available
        if (this.useGPU && context.gl) {
            this.initializeGPUResources(context.gl)
        }
    }

    /**
     * Initialize GPU resources (shader programs)
     */
    private initializeGPUResources(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
        try {
            this.colorCorrectionProgram = createColorCorrectionProgram(gl)
            if (!this.colorCorrectionProgram) {
                console.warn('Failed to create color correction shader program, falling back to CPU')
                this.useGPU = false
            }
        } catch (error) {
            console.error('Error initializing GPU resources:', error)
            this.useGPU = false
        }
    }

    /**
     * Process a single frame with color corrections
     * @param frame - The frame to process
     * @param settings - Processing settings
     * @returns Processed frame result
     */
    processFrame(
        frame: FrameData,
        settings: FrameProcessingSettings
    ): FrameProcessingResult {
        const startTime = performance.now()
        const appliedEnhancements: string[] = []

        // Clone the frame data to avoid modifying the original
        const processedImageData = new ImageData(
            new Uint8ClampedArray(frame.imageData.data),
            frame.imageData.width,
            frame.imageData.height
        )

        // Apply color correction if settings provided
        if (settings.colorCorrection) {
            this.applyColorCorrection(processedImageData, settings.colorCorrection)
            appliedEnhancements.push('color-correction')
        }

        const processingTimeMs = performance.now() - startTime

        return {
            processedFrame: {
                imageData: processedImageData,
                timestamp: frame.timestamp,
                index: frame.index
            },
            appliedEnhancements,
            processingTimeMs
        }
    }

    /**
     * Apply color correction to frame using GPU or CPU
     * @param imageData - The image data to process (modified in place)
     * @param settings - Color correction settings
     */
    private applyColorCorrection(
        imageData: ImageData,
        settings: ColorCorrectionSettings
    ): void {
        if (this.useGPU && this.context.gl && this.colorCorrectionProgram) {
            try {
                const result = this.applyColorCorrectionGPU(imageData, settings)
                imageData.data.set(result.data)
            } catch (error) {
                console.warn('GPU processing failed, falling back to CPU:', error)
                this.useGPU = false
                applyColorCorrectionCPU(imageData, settings)
            }
        } else {
            applyColorCorrectionCPU(imageData, settings)
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

        // Create texture from image data
        const texture = createTextureFromImageData(gl, imageData)
        if (!texture) {
            throw new Error('Failed to create texture from image data')
        }

        try {
            // Apply color correction using GPU
            const result = applyColorCorrectionGPU(
                gl,
                program,
                texture,
                settings,
                imageData.width,
                imageData.height
            )

            return result
        } finally {
            // Clean up texture
            gl.deleteTexture(texture)
        }
    }

    /**
     * Apply stabilization transform to a frame
     * @param frame - The frame to stabilize
     * @param stabilizationResult - The stabilization transform to apply
     * @returns Stabilized frame
     */
    applyStabilizationTransform(
        frame: FrameData,
        stabilizationResult: StabilizationResult
    ): FrameData {
        if (!stabilizationResult.stabilized) {
            return frame
        }

        const { canvas, ctx } = this.context
        const { imageData } = frame
        const { transform, cropPercentage } = stabilizationResult
        const width = imageData.width
        const height = imageData.height

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Save context state
        ctx.save()

        // Apply transformation
        ctx.translate(width / 2, height / 2)
        ctx.translate(transform.dx, transform.dy)
        ctx.rotate(transform.rotation)
        ctx.scale(transform.scale, transform.scale)
        ctx.translate(-width / 2, -height / 2)

        // Create temporary canvas for source image
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.putImageData(imageData, 0, 0)

        // Draw transformed image
        ctx.drawImage(tempCanvas, 0, 0)

        // Restore context
        ctx.restore()

        // Apply crop if needed
        if (cropPercentage > 0) {
            const cropPixels = Math.floor(width * cropPercentage)
            const croppedWidth = width - 2 * cropPixels
            const croppedHeight = height - 2 * cropPixels

            // Get cropped region
            const croppedData = ctx.getImageData(
                cropPixels,
                cropPixels,
                croppedWidth,
                croppedHeight
            )

            // Scale back to original size
            ctx.clearRect(0, 0, width, height)
            const scaledCanvas = document.createElement('canvas')
            scaledCanvas.width = croppedWidth
            scaledCanvas.height = croppedHeight
            const scaledCtx = scaledCanvas.getContext('2d')!
            scaledCtx.putImageData(croppedData, 0, 0)

            ctx.drawImage(scaledCanvas, 0, 0, width, height)
        }

        // Get the transformed result
        const resultData = ctx.getImageData(0, 0, width, height)

        return {
            imageData: resultData,
            timestamp: frame.timestamp,
            index: frame.index
        }
    }

    /**
     * Process frame with both color correction and stabilization
     * @param frame - The frame to process
     * @param settings - Processing settings
     * @param stabilizationResult - Optional stabilization transform
     * @returns Processed frame result
     */
    processFrameWithStabilization(
        frame: FrameData,
        settings: FrameProcessingSettings,
        stabilizationResult?: StabilizationResult
    ): FrameProcessingResult {
        const startTime = performance.now()
        const appliedEnhancements: string[] = []

        let processedFrame = frame

        // Apply stabilization first if provided
        if (stabilizationResult && settings.applyStabilization) {
            processedFrame = this.applyStabilizationTransform(processedFrame, stabilizationResult)
            if (stabilizationResult.stabilized) {
                appliedEnhancements.push('stabilization')
            }
        }

        // Apply color correction
        if (settings.colorCorrection) {
            const colorCorrectedData = new ImageData(
                new Uint8ClampedArray(processedFrame.imageData.data),
                processedFrame.imageData.width,
                processedFrame.imageData.height
            )
            this.applyColorCorrection(colorCorrectedData, settings.colorCorrection)
            processedFrame = {
                ...processedFrame,
                imageData: colorCorrectedData
            }
            appliedEnhancements.push('color-correction')
        }

        const processingTimeMs = performance.now() - startTime

        return {
            processedFrame,
            appliedEnhancements,
            processingTimeMs
        }
    }

    /**
     * Check if GPU processing is available and enabled
     */
    isUsingGPU(): boolean {
        return this.useGPU
    }

    /**
     * Force CPU processing mode
     */
    forceCPUMode(): void {
        this.useGPU = false
    }

    /**
     * Clean up GPU resources
     */
    dispose(): void {
        if (this.context.gl && this.colorCorrectionProgram) {
            this.context.gl.deleteProgram(this.colorCorrectionProgram)
            this.colorCorrectionProgram = null
        }
    }
}
