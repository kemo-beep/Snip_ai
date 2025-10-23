/**
 * Tests for EnhancementPipeline class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancementPipeline } from '../EnhancementPipeline'
import type { EnhancementConfig } from '../types'

describe('EnhancementPipeline', () => {
    let pipeline: EnhancementPipeline
    let defaultConfig: EnhancementConfig

    beforeEach(() => {
        defaultConfig = {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        }
    })

    afterEach(() => {
        if (pipeline) {
            pipeline.dispose()
        }
    })

    describe('Constructor', () => {
        it('should create pipeline with config', () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            expect(pipeline).toBeDefined()
            expect(pipeline.getConfig()).toEqual(defaultConfig)
        })

        it('should merge custom settings with defaults', () => {
            pipeline = new EnhancementPipeline(defaultConfig, {
                brightness: 20,
                contrast: 10
            })

            const settings = pipeline.getSettings()
            expect(settings.brightness).toBe(20)
            expect(settings.contrast).toBe(10)
            expect(settings.saturation).toBe(0) // default
        })

        it('should initialize with empty metrics', () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            const metrics = pipeline.getMetrics()

            expect(metrics.brightnessAdjustment).toBe(0)
            expect(metrics.contrastAdjustment).toBe(0)
            expect(metrics.colorTemperatureShift).toBe(0)
            expect(metrics.noiseReductionDb).toBe(0)
            expect(metrics.volumeAdjustmentDb).toBe(0)
            expect(metrics.shakeReduction).toBe(0)
        })
    })

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            expect(pipeline.isInitialized()).toBe(true)
            expect(pipeline.getContext()).not.toBeNull()
        })

        it('should create canvas context', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            const context = pipeline.getContext()
            expect(context).not.toBeNull()
            expect(context?.canvas).toBeDefined()
            expect(context?.ctx).toBeDefined()
        })

        it('should handle GPU initialization', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize(undefined, { useGPU: true })

            expect(pipeline.isInitialized()).toBe(true)
            // GPU availability depends on environment
        })

        it('should handle CPU-only mode', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize(undefined, { useGPU: false })

            expect(pipeline.isInitialized()).toBe(true)
            expect(pipeline.isUsingGPU()).toBe(false)
        })

        it('should not reinitialize if already initialized', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            const consoleSpy = vi.spyOn(console, 'warn')
            await pipeline.initialize()

            expect(consoleSpy).toHaveBeenCalledWith('EnhancementPipeline already initialized')
        })
    })

    describe('dispose', () => {
        it('should clean up resources', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            expect(pipeline.isInitialized()).toBe(true)

            pipeline.dispose()

            expect(pipeline.isInitialized()).toBe(false)
            expect(pipeline.getContext()).toBeNull()
        })

        it('should handle dispose when not initialized', () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            expect(() => pipeline.dispose()).not.toThrow()
        })

        it('should handle multiple dispose calls', async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            pipeline.dispose()
            expect(() => pipeline.dispose()).not.toThrow()
        })
    })

    describe('Configuration Management', () => {
        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()
        })

        it('should update config', () => {
            pipeline.updateConfig({ autoColorCorrection: false })

            const config = pipeline.getConfig()
            expect(config.autoColorCorrection).toBe(false)
            expect(config.autoBrightnessAdjust).toBe(true) // unchanged
        })

        it('should update settings', () => {
            pipeline.updateSettings({ brightness: 30, contrast: 20 })

            const settings = pipeline.getSettings()
            expect(settings.brightness).toBe(30)
            expect(settings.contrast).toBe(20)
        })

        it('should return copy of config', () => {
            const config1 = pipeline.getConfig()
            const config2 = pipeline.getConfig()

            expect(config1).toEqual(config2)
            expect(config1).not.toBe(config2) // different objects
        })

        it('should return copy of settings', () => {
            const settings1 = pipeline.getSettings()
            const settings2 = pipeline.getSettings()

            expect(settings1).toEqual(settings2)
            expect(settings1).not.toBe(settings2) // different objects
        })
    })

    describe('Metrics and Tracking', () => {
        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()
        })

        it('should return empty metrics initially', () => {
            const metrics = pipeline.getMetrics()

            expect(metrics.brightnessAdjustment).toBe(0)
            expect(metrics.contrastAdjustment).toBe(0)
        })

        it('should return empty applied enhancements initially', () => {
            const applied = pipeline.getAppliedEnhancements()
            expect(applied).toEqual([])
        })

        it('should return empty skipped enhancements initially', () => {
            const skipped = pipeline.getSkippedEnhancements()
            expect(skipped).toEqual([])
        })

        it('should return copy of metrics', () => {
            const metrics1 = pipeline.getMetrics()
            const metrics2 = pipeline.getMetrics()

            expect(metrics1).toEqual(metrics2)
            expect(metrics1).not.toBe(metrics2)
        })
    })

    describe('analyzeVideo', () => {
        let originalDrawImage: any

        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            // Mock canvas drawImage to work with our mock video objects
            const context = pipeline.getContext()
            if (context) {
                originalDrawImage = context.ctx.drawImage
                context.ctx.drawImage = vi.fn(() => {
                    // Fill with test pattern (mid-gray)
                    const imageData = context.ctx.createImageData(context.canvas.width, context.canvas.height)
                    for (let i = 0; i < imageData.data.length; i += 4) {
                        imageData.data[i] = 128     // R
                        imageData.data[i + 1] = 128 // G
                        imageData.data[i + 2] = 128 // B
                        imageData.data[i + 3] = 255 // A
                    }
                    context.ctx.putImageData(imageData, 0, 0)
                })
            }
        })

        afterEach(() => {
            // Restore original drawImage
            const context = pipeline.getContext()
            if (context && originalDrawImage) {
                context.ctx.drawImage = originalDrawImage
            }
        })

        it('should throw error if not initialized', async () => {
            const uninitializedPipeline = new EnhancementPipeline(defaultConfig)
            const mockVideo = document.createElement('video')

            await expect(uninitializedPipeline.analyzeVideo(mockVideo)).rejects.toMatchObject({
                message: 'EnhancementPipeline not initialized. Call initialize() first.'
            })
        })

        it('should analyze video and return recommended settings', async () => {
            const mockVideo = {
                duration: 10,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                addEventListener: vi.fn((event: string, callback: any) => {
                    if (event === 'seeked') {
                        setTimeout(() => callback(), 0)
                    }
                }),
                removeEventListener: vi.fn()
            } as any

            const settings = await pipeline.analyzeVideo(mockVideo, { sampleFrames: 3 })

            expect(settings).toBeDefined()
            expect(settings.brightness).toBeGreaterThanOrEqual(-50)
            expect(settings.brightness).toBeLessThanOrEqual(50)
            expect(settings.contrast).toBeGreaterThanOrEqual(-30)
            expect(settings.contrast).toBeLessThanOrEqual(30)
            expect(settings.temperature).toBeGreaterThanOrEqual(-40)
            expect(settings.temperature).toBeLessThanOrEqual(40)
        })

        it('should use custom sample frames', async () => {
            const mockVideo = {
                duration: 10,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                addEventListener: vi.fn((event: string, callback: any) => {
                    if (event === 'seeked') {
                        setTimeout(() => callback(), 0)
                    }
                }),
                removeEventListener: vi.fn()
            } as any

            const settings = await pipeline.analyzeVideo(mockVideo, { sampleFrames: 5 })

            expect(settings).toBeDefined()
        })

        it('should preserve audio settings from current settings', async () => {
            pipeline.updateSettings({
                noiseReduction: 80,
                volumeBoost: 10,
                voiceClarity: 70,
                echoReduction: 50
            })

            const mockVideo = {
                duration: 10,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                addEventListener: vi.fn((event: string, callback: any) => {
                    if (event === 'seeked') {
                        setTimeout(() => callback(), 0)
                    }
                }),
                removeEventListener: vi.fn()
            } as any

            const settings = await pipeline.analyzeVideo(mockVideo, { sampleFrames: 2 })

            expect(settings.noiseReduction).toBe(80)
            expect(settings.volumeBoost).toBe(10)
            expect(settings.voiceClarity).toBe(70)
            expect(settings.echoReduction).toBe(50)
        })
    })

    describe('processFrame', () => {
        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()
        })

        it('should throw error if not initialized', () => {
            const uninitializedPipeline = new EnhancementPipeline(defaultConfig)
            const mockFrame: FrameData = {
                imageData: new ImageData(100, 100),
                timestamp: 0,
                index: 0
            }

            expect(() => uninitializedPipeline.processFrame(mockFrame)).toThrow()
        })

        it('should process frame with enhancements', () => {
            const mockFrame: FrameData = {
                imageData: new ImageData(100, 100),
                timestamp: 0,
                index: 0
            }

            const result = pipeline.processFrame(mockFrame)

            expect(result).toBeDefined()
            expect(result.imageData).toBeDefined()
            expect(result.timestamp).toBe(0)
            expect(result.index).toBe(0)
        })

        it('should apply color correction when enabled', () => {
            pipeline.updateSettings({
                brightness: 20,
                contrast: 10
            })

            const mockFrame: FrameData = {
                imageData: new ImageData(100, 100),
                timestamp: 0,
                index: 0
            }

            const result = pipeline.processFrame(mockFrame)

            expect(result.imageData.width).toBe(100)
            expect(result.imageData.height).toBe(100)
        })
    })

    describe('processAudio', () => {
        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()
        })

        it('should throw error if not initialized', async () => {
            const uninitializedPipeline = new EnhancementPipeline(defaultConfig)
            const mockAudioData: AudioData = {
                buffer: new AudioBuffer({ length: 1000, sampleRate: 44100 }),
                sampleRate: 44100,
                channels: 2
            }

            await expect(uninitializedPipeline.processAudio(mockAudioData)).rejects.toThrow()
        })

        it('should process audio with enhancements', async () => {
            const mockAudioData: AudioData = {
                buffer: new AudioBuffer({ length: 1000, sampleRate: 44100 }),
                sampleRate: 44100,
                channels: 2
            }

            const result = await pipeline.processAudio(mockAudioData)

            expect(result).toBeDefined()
            expect(result.length).toBeGreaterThan(0)
        })

        it('should track applied enhancements', async () => {
            const mockAudioData: AudioData = {
                buffer: new AudioBuffer({ length: 1000, sampleRate: 44100 }),
                sampleRate: 44100,
                channels: 2
            }

            await pipeline.processAudio(mockAudioData)

            const applied = pipeline.getAppliedEnhancements()
            expect(applied.length).toBeGreaterThan(0)
        })
    })

    describe('generatePreview', () => {
        let originalDrawImage: any

        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()

            // Mock canvas drawImage
            const context = pipeline.getContext()
            if (context) {
                originalDrawImage = context.ctx.drawImage
                context.ctx.drawImage = vi.fn(() => {
                    const imageData = context.ctx.createImageData(context.canvas.width, context.canvas.height)
                    for (let i = 0; i < imageData.data.length; i += 4) {
                        imageData.data[i] = 128
                        imageData.data[i + 1] = 128
                        imageData.data[i + 2] = 128
                        imageData.data[i + 3] = 255
                    }
                    context.ctx.putImageData(imageData, 0, 0)
                })
            }
        })

        afterEach(() => {
            const context = pipeline.getContext()
            if (context && originalDrawImage) {
                context.ctx.drawImage = originalDrawImage
            }
        })

        it('should throw error if not initialized', async () => {
            const uninitializedPipeline = new EnhancementPipeline(defaultConfig)
            const mockVideo = document.createElement('video')

            await expect(uninitializedPipeline.generatePreview(mockVideo)).rejects.toThrow()
        })

        it('should generate preview with original and enhanced frames', async () => {
            const mockVideo = {
                duration: 10,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                addEventListener: vi.fn((event: string, callback: any) => {
                    if (event === 'seeked') {
                        setTimeout(() => callback(), 0)
                    }
                }),
                removeEventListener: vi.fn()
            } as any

            const preview = await pipeline.generatePreview(mockVideo)

            expect(preview).toBeDefined()
            expect(preview.original).toBeDefined()
            expect(preview.enhanced).toBeDefined()
            expect(preview.original.width).toBe(1920)
            expect(preview.original.height).toBe(1080)
        })

        it('should use custom timestamp', async () => {
            const mockVideo = {
                duration: 10,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                addEventListener: vi.fn((event: string, callback: any) => {
                    if (event === 'seeked') {
                        setTimeout(() => callback(), 0)
                    }
                }),
                removeEventListener: vi.fn()
            } as any

            const preview = await pipeline.generatePreview(mockVideo, 3.5)

            expect(preview).toBeDefined()
            expect(mockVideo.currentTime).toBe(3.5)
        })

        it('should default to middle of video', async () => {
            const mockVideo = {
                duration: 10,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                addEventListener: vi.fn((event: string, callback: any) => {
                    if (event === 'seeked') {
                        setTimeout(() => callback(), 0)
                    }
                }),
                removeEventListener: vi.fn()
            } as any

            const preview = await pipeline.generatePreview(mockVideo)

            expect(preview).toBeDefined()
            expect(mockVideo.currentTime).toBe(5) // middle of 10s video
        })
    })

    describe('enhanceVideo', () => {
        beforeEach(async () => {
            pipeline = new EnhancementPipeline(defaultConfig)
            await pipeline.initialize()
        })

        it('should throw error if not initialized', async () => {
            const uninitializedPipeline = new EnhancementPipeline(defaultConfig)
            const mockBlob = new Blob(['test'], { type: 'video/webm' })

            await expect(uninitializedPipeline.enhanceVideo(mockBlob)).rejects.toThrow()
        })

        it('should process video blob', async () => {
            const mockBlob = new Blob(['test'], { type: 'video/webm' })

            const result = await pipeline.enhanceVideo(mockBlob)

            expect(result).toBeDefined()
            expect(result).toBeInstanceOf(Blob)
        })

        it('should call progress callback', async () => {
            const mockBlob = new Blob(['test'], { type: 'video/webm' })
            const progressCallback = vi.fn()

            await pipeline.enhanceVideo(mockBlob, progressCallback)

            expect(progressCallback).toHaveBeenCalled()
            expect(progressCallback).toHaveBeenCalledWith(expect.any(Number))
        })

        it('should reset metrics before processing', async () => {
            // Set some metrics
            const mockAudioData: AudioData = {
                buffer: new AudioBuffer({ length: 1000, sampleRate: 44100 }),
                sampleRate: 44100,
                channels: 2
            }
            await pipeline.processAudio(mockAudioData)

            const mockBlob = new Blob(['test'], { type: 'video/webm' })
            await pipeline.enhanceVideo(mockBlob)

            // Metrics should be reset
            const metrics = pipeline.getMetrics()
            expect(metrics.brightnessAdjustment).toBe(0)
        })
    })
})
