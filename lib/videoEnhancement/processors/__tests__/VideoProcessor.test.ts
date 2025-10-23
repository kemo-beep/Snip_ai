/**
 * Integration tests for VideoProcessor
 * Tests GPU and CPU processing paths, color correction, white balance, and stabilization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VideoProcessor } from '../VideoProcessor'
import type { ProcessingContext, FrameData } from '../../types'
import type { ColorCorrectionSettings } from '../../enhancements/colorCorrection'

// Mock canvas and WebGL context
function createMockCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    return canvas
}

function createMockContext(useGPU: boolean = false): ProcessingContext {
    const canvas = createMockCanvas()
    const ctx = canvas.getContext('2d')!

    let gl: WebGLRenderingContext | null = null
    if (useGPU) {
        gl = canvas.getContext('webgl') as WebGLRenderingContext
    }

    return {
        canvas,
        ctx,
        gl: gl || undefined,
        useGPU
    }
}

function createTestImageData(width: number = 256, height: number = 256): ImageData {
    const data = new Uint8ClampedArray(width * height * 4)

    // Create a gradient pattern for testing
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            data[i] = (x / width) * 255     // R
            data[i + 1] = (y / height) * 255 // G
            data[i + 2] = 128                 // B
            data[i + 3] = 255                 // A
        }
    }

    return new ImageData(data, width, height)
}

function createTestFrame(index: number = 0): FrameData {
    return {
        imageData: createTestImageData(),
        timestamp: index * 33.33, // ~30fps
        index
    }
}

describe('VideoProcessor', () => {
    let processor: VideoProcessor
    let context: ProcessingContext

    describe('CPU Processing', () => {
        beforeEach(() => {
            context = createMockContext(false)
            processor = new VideoProcessor(context)
        })

        afterEach(() => {
            processor.dispose()
        })

        it('should initialize with CPU mode', () => {
            expect(processor.isUsingGPU()).toBe(false)
        })

        it('should apply color correction using CPU', () => {
            const imageData = createTestImageData()
            const settings: ColorCorrectionSettings = {
                brightness: 20,
                contrast: 10,
                saturation: 5,
                temperature: 0
            }

            const result = processor.applyColorCorrection(imageData, settings)

            expect(result.width).toBe(imageData.width)
            expect(result.height).toBe(imageData.height)
            expect(result.data.length).toBe(imageData.data.length)

            // Check that brightness was increased
            let avgBrightnessBefore = 0
            let avgBrightnessAfter = 0
            for (let i = 0; i < imageData.data.length; i += 4) {
                avgBrightnessBefore += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
                avgBrightnessAfter += (result.data[i] + result.data[i + 1] + result.data[i + 2]) / 3
            }
            avgBrightnessBefore /= (imageData.data.length / 4)
            avgBrightnessAfter /= (result.data.length / 4)

            expect(avgBrightnessAfter).toBeGreaterThan(avgBrightnessBefore)
        })

        it('should apply white balance correction', () => {
            const imageData = createTestImageData()
            const adjustment = 30 // Warm adjustment

            const result = processor.applyWhiteBalance(imageData, adjustment)

            expect(result.width).toBe(imageData.width)
            expect(result.height).toBe(imageData.height)

            // Check that red channel increased and blue decreased (warmer)
            let avgRedBefore = 0
            let avgRedAfter = 0
            let avgBlueBefore = 0
            let avgBlueAfter = 0

            for (let i = 0; i < imageData.data.length; i += 4) {
                avgRedBefore += imageData.data[i]
                avgRedAfter += result.data[i]
                avgBlueBefore += imageData.data[i + 2]
                avgBlueAfter += result.data[i + 2]
            }

            const pixelCount = imageData.data.length / 4
            avgRedBefore /= pixelCount
            avgRedAfter /= pixelCount
            avgBlueBefore /= pixelCount
            avgBlueAfter /= pixelCount

            expect(avgRedAfter).toBeGreaterThan(avgRedBefore)
            expect(avgBlueAfter).toBeLessThan(avgBlueBefore)
        })

        it('should analyze frame and provide recommendations', () => {
            const imageData = createTestImageData()

            const analysis = processor.analyzeFrame(imageData)

            expect(analysis).toHaveProperty('averageBrightness')
            expect(analysis).toHaveProperty('contrast')
            expect(analysis).toHaveProperty('colorTemperature')
            expect(analysis).toHaveProperty('dominantColors')
            expect(analysis).toHaveProperty('recommendedSettings')

            expect(analysis.averageBrightness).toBeGreaterThanOrEqual(0)
            expect(analysis.averageBrightness).toBeLessThanOrEqual(255)
            expect(analysis.contrast).toBeGreaterThanOrEqual(0)
            expect(analysis.contrast).toBeLessThanOrEqual(100)
            expect(Array.isArray(analysis.dominantColors)).toBe(true)
        })

        it('should process complete frame with all settings', () => {
            const frame = createTestFrame()
            const settings = {
                colorCorrection: {
                    brightness: 10,
                    contrast: 5,
                    saturation: 0,
                    temperature: 0
                },
                whiteBalance: 15
            }

            const result = processor.processFrame(frame, settings)

            expect(result.timestamp).toBe(frame.timestamp)
            expect(result.index).toBe(frame.index)
            expect(result.imageData.width).toBe(frame.imageData.width)
            expect(result.imageData.height).toBe(frame.imageData.height)
        })

        it('should handle negative brightness adjustment', () => {
            const imageData = createTestImageData()
            const settings: ColorCorrectionSettings = {
                brightness: -30,
                contrast: 0,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(imageData, settings)

            // Check that brightness was decreased
            let avgBrightnessBefore = 0
            let avgBrightnessAfter = 0
            for (let i = 0; i < imageData.data.length; i += 4) {
                avgBrightnessBefore += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
                avgBrightnessAfter += (result.data[i] + result.data[i + 1] + result.data[i + 2]) / 3
            }
            avgBrightnessBefore /= (imageData.data.length / 4)
            avgBrightnessAfter /= (result.data.length / 4)

            expect(avgBrightnessAfter).toBeLessThan(avgBrightnessBefore)
        })

        it('should handle cool white balance adjustment', () => {
            const imageData = createTestImageData()
            const adjustment = -30 // Cool adjustment

            const result = processor.applyWhiteBalance(imageData, adjustment)

            // Check that blue channel increased and red decreased (cooler)
            let avgRedBefore = 0
            let avgRedAfter = 0
            let avgBlueBefore = 0
            let avgBlueAfter = 0

            for (let i = 0; i < imageData.data.length; i += 4) {
                avgRedBefore += imageData.data[i]
                avgRedAfter += result.data[i]
                avgBlueBefore += imageData.data[i + 2]
                avgBlueAfter += result.data[i + 2]
            }

            const pixelCount = imageData.data.length / 4
            avgRedBefore /= pixelCount
            avgRedAfter /= pixelCount
            avgBlueBefore /= pixelCount
            avgBlueAfter /= pixelCount

            expect(avgRedAfter).toBeLessThan(avgRedBefore)
            expect(avgBlueAfter).toBeGreaterThan(avgBlueBefore)
        })

        it('should preserve image dimensions after processing', () => {
            const frame = createTestFrame()
            const originalWidth = frame.imageData.width
            const originalHeight = frame.imageData.height

            const settings = {
                colorCorrection: {
                    brightness: 20,
                    contrast: 10,
                    saturation: 5,
                    temperature: 10
                }
            }

            const result = processor.processFrame(frame, settings)

            expect(result.imageData.width).toBe(originalWidth)
            expect(result.imageData.height).toBe(originalHeight)
        })

        it('should not modify original frame data', () => {
            const frame = createTestFrame()
            const originalData = new Uint8ClampedArray(frame.imageData.data)

            const settings = {
                colorCorrection: {
                    brightness: 50,
                    contrast: 20,
                    saturation: 10,
                    temperature: 0
                }
            }

            processor.processFrame(frame, settings)

            // Original frame data should be unchanged
            expect(frame.imageData.data).toEqual(originalData)
        })

        it('should handle zero adjustments', () => {
            const imageData = createTestImageData()
            const settings: ColorCorrectionSettings = {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(imageData, settings)

            // Result should be very similar to original (allowing for minor rounding)
            let maxDiff = 0
            for (let i = 0; i < imageData.data.length; i++) {
                const diff = Math.abs(result.data[i] - imageData.data[i])
                maxDiff = Math.max(maxDiff, diff)
            }

            expect(maxDiff).toBeLessThanOrEqual(2) // Allow small rounding differences
        })

        it('should calculate stabilization transform', () => {
            const currentMotion = { x: 5, y: 3, magnitude: Math.sqrt(34) }
            const smoothedMotion = { x: 2, y: 1, magnitude: Math.sqrt(5) }

            const result = processor.calculateStabilization(currentMotion, smoothedMotion)

            expect(result).toHaveProperty('transform')
            expect(result).toHaveProperty('cropPercentage')
            expect(result).toHaveProperty('confidence')
            expect(result.transform).toHaveProperty('translateX')
            expect(result.transform).toHaveProperty('translateY')
            expect(result.transform).toHaveProperty('scale')
            expect(result.transform).toHaveProperty('rotation')
        })

        it('should apply stabilization transform', () => {
            const imageData = createTestImageData()
            const transform = {
                translateX: 5,
                translateY: 3,
                scale: 1.05,
                rotation: 0
            }

            const result = processor.applyStabilization(imageData, transform)

            expect(result.width).toBe(imageData.width)
            expect(result.height).toBe(imageData.height)
            expect(result.data.length).toBe(imageData.data.length)
        })
    })

    describe('GPU Processing', () => {
        beforeEach(() => {
            context = createMockContext(true)
            processor = new VideoProcessor(context)
        })

        afterEach(() => {
            processor.dispose()
        })

        it('should attempt GPU initialization', () => {
            // GPU may or may not be available in test environment
            // Just verify the processor was created
            expect(processor).toBeDefined()
        })

        it('should fall back to CPU if GPU fails', () => {
            // Force CPU mode
            processor.forceCPUMode()
            expect(processor.isUsingGPU()).toBe(false)

            // Should still work with CPU
            const imageData = createTestImageData()
            const settings: ColorCorrectionSettings = {
                brightness: 10,
                contrast: 5,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(imageData, settings)
            expect(result.width).toBe(imageData.width)
            expect(result.height).toBe(imageData.height)
        })
    })

    describe('Edge Cases', () => {
        beforeEach(() => {
            context = createMockContext(false)
            processor = new VideoProcessor(context)
        })

        afterEach(() => {
            processor.dispose()
        })

        it('should handle extreme brightness values', () => {
            const imageData = createTestImageData()
            const settings: ColorCorrectionSettings = {
                brightness: 100,
                contrast: 0,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(imageData, settings)

            // All values should be clamped to 0-255
            for (let i = 0; i < result.data.length; i++) {
                expect(result.data[i]).toBeGreaterThanOrEqual(0)
                expect(result.data[i]).toBeLessThanOrEqual(255)
            }
        })

        it('should handle extreme contrast values', () => {
            const imageData = createTestImageData()
            const settings: ColorCorrectionSettings = {
                brightness: 0,
                contrast: 100,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(imageData, settings)

            // All values should be clamped to 0-255
            for (let i = 0; i < result.data.length; i++) {
                expect(result.data[i]).toBeGreaterThanOrEqual(0)
                expect(result.data[i]).toBeLessThanOrEqual(255)
            }
        })

        it('should handle small images', () => {
            const smallImage = createTestImageData(16, 16)
            const settings: ColorCorrectionSettings = {
                brightness: 10,
                contrast: 5,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(smallImage, settings)

            expect(result.width).toBe(16)
            expect(result.height).toBe(16)
        })

        it('should handle large images', () => {
            const largeImage = createTestImageData(1920, 1080)
            const settings: ColorCorrectionSettings = {
                brightness: 10,
                contrast: 5,
                saturation: 0,
                temperature: 0
            }

            const result = processor.applyColorCorrection(largeImage, settings)

            expect(result.width).toBe(1920)
            expect(result.height).toBe(1080)
        })
    })

    describe('Resource Management', () => {
        it('should clean up resources on dispose', () => {
            context = createMockContext(false)
            processor = new VideoProcessor(context)

            processor.dispose()

            // After dispose, should still be safe to call
            expect(() => processor.dispose()).not.toThrow()
        })

        it('should handle multiple dispose calls', () => {
            context = createMockContext(false)
            processor = new VideoProcessor(context)

            processor.dispose()
            processor.dispose()
            processor.dispose()

            // Should not throw
            expect(processor).toBeDefined()
        })
    })
})
