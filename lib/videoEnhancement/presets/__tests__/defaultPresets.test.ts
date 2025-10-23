/**
 * Unit tests for default presets
 * Requirements: 4.1, 4.6
 */

import { describe, it, expect } from 'vitest'
import {
    DEFAULT_PRESETS,
    getPresetById,
    getPresetsByCategory,
    getDefaultPreset,
    getPresetCategories,
    validatePreset,
    createCustomPreset,
    type EnhancementPreset
} from '../defaultPresets'

describe('Default Presets', () => {
    describe('DEFAULT_PRESETS', () => {
        it('should contain all required presets', () => {
            expect(DEFAULT_PRESETS).toHaveLength(7)

            const presetIds = DEFAULT_PRESETS.map(p => p.id)
            expect(presetIds).toContain('auto')
            expect(presetIds).toContain('minimal')
            expect(presetIds).toContain('professional')
            expect(presetIds).toContain('social-media')
            expect(presetIds).toContain('low-light')
            expect(presetIds).toContain('outdoor')
            expect(presetIds).toContain('interview')
        })

        it('should have unique IDs', () => {
            const ids = DEFAULT_PRESETS.map(p => p.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it('should have valid configurations', () => {
            DEFAULT_PRESETS.forEach(preset => {
                expect(validatePreset(preset)).toBe(true)
            })
        })

        it('should have proper category assignments', () => {
            const categories = getPresetCategories()
            expect(categories).toContain('auto')
            expect(categories).toContain('minimal')
            expect(categories).toContain('professional')
            expect(categories).toContain('social')
            expect(categories).toContain('custom')
        })
    })

    describe('getPresetById', () => {
        it('should return correct preset for valid ID', () => {
            const autoPreset = getPresetById('auto')
            expect(autoPreset).toBeDefined()
            expect(autoPreset?.name).toBe('Auto')
            expect(autoPreset?.category).toBe('auto')
        })

        it('should return undefined for invalid ID', () => {
            const preset = getPresetById('nonexistent')
            expect(preset).toBeUndefined()
        })
    })

    describe('getPresetsByCategory', () => {
        it('should return presets for valid category', () => {
            const autoPresets = getPresetsByCategory('auto')
            expect(autoPresets).toHaveLength(1)
            expect(autoPresets[0].id).toBe('auto')

            const customPresets = getPresetsByCategory('custom')
            expect(customPresets.length).toBeGreaterThan(0)
        })

        it('should return empty array for invalid category', () => {
            const presets = getPresetsByCategory('nonexistent' as any)
            expect(presets).toHaveLength(0)
        })
    })

    describe('getDefaultPreset', () => {
        it('should return the auto preset', () => {
            const defaultPreset = getDefaultPreset()
            expect(defaultPreset.id).toBe('auto')
            expect(defaultPreset.name).toBe('Auto')
        })
    })

    describe('getPresetCategories', () => {
        it('should return all unique categories', () => {
            const categories = getPresetCategories()
            expect(categories).toContain('auto')
            expect(categories).toContain('minimal')
            expect(categories).toContain('professional')
            expect(categories).toContain('social')
            expect(categories).toContain('custom')

            // Should be unique
            const uniqueCategories = new Set(categories)
            expect(uniqueCategories.size).toBe(categories.length)
        })
    })

    describe('validatePreset', () => {
        it('should validate correct preset', () => {
            const validPreset: EnhancementPreset = {
                id: 'test',
                name: 'Test',
                description: 'Test preset',
                category: 'custom',
                config: {
                    autoColorCorrection: true,
                    autoBrightnessAdjust: true,
                    autoContrast: false,
                    autoWhiteBalance: false,
                    autoNoiseReduction: true,
                    autoVolumeNormalization: true,
                    autoVoiceEnhancement: false,
                    autoEchoCancel: false,
                    autoStabilization: false
                },
                settings: {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    temperature: 0,
                    noiseReduction: 50,
                    volumeBoost: 0,
                    voiceClarity: 0,
                    echoReduction: 0,
                    stabilizationStrength: 0
                }
            }

            expect(validatePreset(validPreset)).toBe(true)
        })

        it('should reject preset with missing required fields', () => {
            const invalidPreset = {
                id: 'test',
                name: 'Test'
                // Missing description, category, config, settings
            } as any

            expect(validatePreset(invalidPreset)).toBe(false)
        })

        it('should reject preset with invalid config types', () => {
            const invalidPreset: EnhancementPreset = {
                id: 'test',
                name: 'Test',
                description: 'Test preset',
                category: 'custom',
                config: {
                    autoColorCorrection: 'true' as any, // Should be boolean
                    autoBrightnessAdjust: true,
                    autoContrast: false,
                    autoWhiteBalance: false,
                    autoNoiseReduction: true,
                    autoVolumeNormalization: true,
                    autoVoiceEnhancement: false,
                    autoEchoCancel: false,
                    autoStabilization: false
                },
                settings: {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    temperature: 0,
                    noiseReduction: 50,
                    volumeBoost: 0,
                    voiceClarity: 0,
                    echoReduction: 0,
                    stabilizationStrength: 0
                }
            }

            expect(validatePreset(invalidPreset)).toBe(false)
        })

        it('should reject preset with invalid settings ranges', () => {
            const invalidPreset: EnhancementPreset = {
                id: 'test',
                name: 'Test',
                description: 'Test preset',
                category: 'custom',
                config: {
                    autoColorCorrection: true,
                    autoBrightnessAdjust: true,
                    autoContrast: false,
                    autoWhiteBalance: false,
                    autoNoiseReduction: true,
                    autoVolumeNormalization: true,
                    autoVoiceEnhancement: false,
                    autoEchoCancel: false,
                    autoStabilization: false
                },
                settings: {
                    brightness: 150, // Should be -100 to 100
                    contrast: 0,
                    saturation: 0,
                    temperature: 0,
                    noiseReduction: 50,
                    volumeBoost: 0,
                    voiceClarity: 0,
                    echoReduction: 0,
                    stabilizationStrength: 0
                }
            }

            expect(validatePreset(invalidPreset)).toBe(false)
        })
    })

    describe('createCustomPreset', () => {
        it('should create valid custom preset', () => {
            const preset = createCustomPreset(
                'custom-test',
                'Custom Test',
                'Test custom preset',
                {
                    autoColorCorrection: true,
                    autoBrightnessAdjust: true,
                    autoContrast: false,
                    autoWhiteBalance: false,
                    autoNoiseReduction: true,
                    autoVolumeNormalization: true,
                    autoVoiceEnhancement: false,
                    autoEchoCancel: false,
                    autoStabilization: false
                },
                {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    temperature: 0,
                    noiseReduction: 50,
                    volumeBoost: 0,
                    voiceClarity: 0,
                    echoReduction: 0,
                    stabilizationStrength: 0
                }
            )

            expect(preset.id).toBe('custom-test')
            expect(preset.name).toBe('Custom Test')
            expect(preset.category).toBe('custom')
            expect(validatePreset(preset)).toBe(true)
        })

        it('should throw error for invalid preset', () => {
            expect(() => {
                createCustomPreset(
                    'invalid',
                    'Invalid',
                    'Invalid preset',
                    {
                        autoColorCorrection: 'true' as any, // Invalid type
                        autoBrightnessAdjust: true,
                        autoContrast: false,
                        autoWhiteBalance: false,
                        autoNoiseReduction: true,
                        autoVolumeNormalization: true,
                        autoVoiceEnhancement: false,
                        autoEchoCancel: false,
                        autoStabilization: false
                    },
                    {
                        brightness: 0,
                        contrast: 0,
                        saturation: 0,
                        temperature: 0,
                        noiseReduction: 50,
                        volumeBoost: 0,
                        voiceClarity: 0,
                        echoReduction: 0,
                        stabilizationStrength: 0
                    }
                )
            }).toThrow('Invalid preset configuration')
        })
    })

    describe('Preset configurations', () => {
        it('should have auto preset with all enhancements enabled', () => {
            const autoPreset = getPresetById('auto')!
            expect(autoPreset.config.autoColorCorrection).toBe(true)
            expect(autoPreset.config.autoBrightnessAdjust).toBe(true)
            expect(autoPreset.config.autoContrast).toBe(true)
            expect(autoPreset.config.autoWhiteBalance).toBe(true)
            expect(autoPreset.config.autoNoiseReduction).toBe(true)
            expect(autoPreset.config.autoVolumeNormalization).toBe(true)
            expect(autoPreset.config.autoVoiceEnhancement).toBe(true)
            expect(autoPreset.config.autoEchoCancel).toBe(true)
            expect(autoPreset.config.autoStabilization).toBe(true)
        })

        it('should have minimal preset with only essential enhancements', () => {
            const minimalPreset = getPresetById('minimal')!
            expect(minimalPreset.config.autoColorCorrection).toBe(true)
            expect(minimalPreset.config.autoBrightnessAdjust).toBe(true)
            expect(minimalPreset.config.autoContrast).toBe(false)
            expect(minimalPreset.config.autoWhiteBalance).toBe(false)
            expect(minimalPreset.config.autoNoiseReduction).toBe(true)
            expect(minimalPreset.config.autoVolumeNormalization).toBe(true)
            expect(minimalPreset.config.autoVoiceEnhancement).toBe(false)
            expect(minimalPreset.config.autoEchoCancel).toBe(false)
            expect(minimalPreset.config.autoStabilization).toBe(false)
        })

        it('should have professional preset with high quality settings', () => {
            const professionalPreset = getPresetById('professional')!
            expect(professionalPreset.settings.noiseReduction).toBe(80)
            expect(professionalPreset.settings.voiceClarity).toBe(75)
            expect(professionalPreset.settings.echoReduction).toBe(70)
            expect(professionalPreset.settings.stabilizationStrength).toBe(60)
        })

        it('should have social media preset with enhanced saturation', () => {
            const socialPreset = getPresetById('social-media')!
            expect(socialPreset.settings.saturation).toBe(10)
            expect(socialPreset.settings.volumeBoost).toBe(5)
            expect(socialPreset.settings.stabilizationStrength).toBe(70)
        })
    })
})
