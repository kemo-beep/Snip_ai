/**
 * Unit tests for configuration storage
 * Requirements: 4.5, 4.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConfigStorage, getConfigStorage, type UserPreferences } from '../configStorage'
import { getDefaultPreset, createCustomPreset } from '../defaultPresets'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
}

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('ConfigStorage', () => {
    let configStorage: ConfigStorage

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks()

        // Reset localStorage mock to return null by default
        localStorageMock.getItem.mockReturnValue(null)
        localStorageMock.setItem.mockImplementation(() => { })
        localStorageMock.removeItem.mockImplementation(() => { })

        // Get fresh instance
        configStorage = ConfigStorage.getInstance()
    })

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = ConfigStorage.getInstance()
            const instance2 = ConfigStorage.getInstance()
            expect(instance1).toBe(instance2)
        })
    })

    describe('getDefaultConfig', () => {
        it('should return default preset config when localStorage is not available', () => {
            // Mock localStorage not available
            const originalLocalStorage = window.localStorage
            // @ts-ignore
            delete window.localStorage

            const config = configStorage.getDefaultConfig()
            expect(config).toEqual(getDefaultPreset().config)

            // Restore localStorage
            window.localStorage = originalLocalStorage
        })

        it('should return stored config when available', () => {
            const storedConfig = {
                autoColorCorrection: true,
                autoBrightnessAdjust: false,
                autoContrast: true,
                autoWhiteBalance: false,
                autoNoiseReduction: true,
                autoVolumeNormalization: false,
                autoVoiceEnhancement: true,
                autoEchoCancel: false,
                autoStabilization: true
            }

            localStorageMock.getItem.mockReturnValue(JSON.stringify(storedConfig))

            const config = configStorage.getDefaultConfig()
            expect(config).toEqual(storedConfig)
        })

        it('should return default preset config when stored config is invalid', () => {
            localStorageMock.getItem.mockReturnValue('invalid json')

            const config = configStorage.getDefaultConfig()
            expect(config).toEqual(getDefaultPreset().config)
        })
    })

    describe('setDefaultConfig', () => {
        it('should save valid config to localStorage', () => {
            const config = {
                autoColorCorrection: true,
                autoBrightnessAdjust: true,
                autoContrast: false,
                autoWhiteBalance: false,
                autoNoiseReduction: true,
                autoVolumeNormalization: true,
                autoVoiceEnhancement: false,
                autoEchoCancel: false,
                autoStabilization: false
            }

            configStorage.setDefaultConfig(config)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'enhancement_default_config',
                JSON.stringify(config)
            )
        })

        it('should throw error for invalid config', () => {
            const invalidConfig = {
                autoColorCorrection: 'true' // Should be boolean
            } as any

            expect(() => {
                configStorage.setDefaultConfig(invalidConfig)
            }).toThrow('Invalid configuration provided')
        })

        it('should handle localStorage not available', () => {
            // Mock localStorage not available
            const originalLocalStorage = window.localStorage
            // @ts-ignore
            delete window.localStorage

            const config = getDefaultPreset().config
            // Should not throw error
            expect(() => {
                configStorage.setDefaultConfig(config)
            }).not.toThrow()

            // Restore localStorage
            window.localStorage = originalLocalStorage
        })
    })

    describe('getDefaultSettings', () => {
        it('should return default preset settings when localStorage is not available', () => {
            // Mock localStorage not available
            const originalLocalStorage = window.localStorage
            // @ts-ignore
            delete window.localStorage

            const settings = configStorage.getDefaultSettings()
            expect(settings).toEqual(getDefaultPreset().settings)

            // Restore localStorage
            window.localStorage = originalLocalStorage
        })

        it('should return stored settings when available', () => {
            const storedSettings = {
                brightness: 10,
                contrast: 20,
                saturation: 5,
                temperature: -10,
                noiseReduction: 80,
                volumeBoost: 5,
                voiceClarity: 70,
                echoReduction: 60,
                stabilizationStrength: 50
            }

            localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSettings))

            const settings = configStorage.getDefaultSettings()
            expect(settings).toEqual(storedSettings)
        })
    })

    describe('setDefaultSettings', () => {
        it('should save valid settings to localStorage', () => {
            const settings = {
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

            configStorage.setDefaultSettings(settings)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'enhancement_default_settings',
                JSON.stringify(settings)
            )
        })

        it('should throw error for invalid settings', () => {
            const invalidSettings = {
                brightness: '0' // Should be number
            } as any

            expect(() => {
                configStorage.setDefaultSettings(invalidSettings)
            }).toThrow('Invalid settings provided')
        })
    })

    describe('Custom Presets', () => {
        const customPreset = createCustomPreset(
            'test-preset',
            'Test Preset',
            'Test description',
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

        describe('getCustomPresets', () => {
            it('should return empty array when no presets stored', () => {
                const presets = configStorage.getCustomPresets()
                expect(presets).toEqual([])
            })

            it('should return stored custom presets', () => {
                localStorageMock.getItem.mockReturnValue(JSON.stringify([customPreset]))

                const presets = configStorage.getCustomPresets()
                expect(presets).toEqual([customPreset])
            })

            it('should filter out invalid presets', () => {
                const invalidPreset = { ...customPreset, id: '' } // Invalid
                localStorageMock.getItem.mockReturnValue(JSON.stringify([customPreset, invalidPreset]))

                const presets = configStorage.getCustomPresets()
                expect(presets).toEqual([customPreset])
            })
        })

        describe('saveCustomPresets', () => {
            it('should save valid presets to localStorage', () => {
                configStorage.saveCustomPresets([customPreset])

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_custom_presets',
                    JSON.stringify([customPreset])
                )
            })

            it('should filter out invalid presets before saving', () => {
                const invalidPreset = { ...customPreset, id: '' } // Invalid
                configStorage.saveCustomPresets([customPreset, invalidPreset])

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_custom_presets',
                    JSON.stringify([customPreset])
                )
            })
        })

        describe('addCustomPreset', () => {
            it('should add valid preset', () => {
                configStorage.addCustomPreset(customPreset)

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_custom_presets',
                    JSON.stringify([customPreset])
                )
            })

            it('should throw error for invalid preset', () => {
                const invalidPreset = { ...customPreset, id: '' } // Invalid

                expect(() => {
                    configStorage.addCustomPreset(invalidPreset)
                }).toThrow('Invalid preset configuration')
            })

            it('should throw error for duplicate ID', () => {
                // First add a preset
                localStorageMock.getItem.mockReturnValue(JSON.stringify([customPreset]))

                // Try to add another with same ID
                expect(() => {
                    configStorage.addCustomPreset(customPreset)
                }).toThrow('Preset with this ID already exists')
            })
        })

        describe('updateCustomPreset', () => {
            it('should update existing preset', () => {
                localStorageMock.getItem.mockReturnValue(JSON.stringify([customPreset]))

                const updates = { name: 'Updated Test Preset' }
                configStorage.updateCustomPreset('test-preset', updates)

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_custom_presets',
                    JSON.stringify([{ ...customPreset, ...updates }])
                )
            })

            it('should throw error for non-existent preset', () => {
                localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

                expect(() => {
                    configStorage.updateCustomPreset('nonexistent', { name: 'Updated' })
                }).toThrow('Preset not found')
            })
        })

        describe('deleteCustomPreset', () => {
            it('should delete existing preset', () => {
                localStorageMock.getItem.mockReturnValue(JSON.stringify([customPreset]))

                configStorage.deleteCustomPreset('test-preset')

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_custom_presets',
                    JSON.stringify([])
                )
            })

            it('should throw error for non-existent preset', () => {
                localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

                expect(() => {
                    configStorage.deleteCustomPreset('nonexistent')
                }).toThrow('Preset not found')
            })
        })
    })

    describe('User Preferences', () => {
        describe('getUserPreferences', () => {
            it('should return default preferences when none stored', () => {
                const preferences = configStorage.getUserPreferences()
                expect(preferences.autoApplyPreset).toBe(true)
                expect(preferences.showAdvancedSettings).toBe(false)
                expect(preferences.enableGPUProcessing).toBe(true)
                expect(preferences.previewQuality).toBe('medium')
                expect(preferences.rememberLastPreset).toBe(true)
            })

            it('should return stored preferences', () => {
                const storedPreferences: UserPreferences = {
                    autoApplyPreset: false,
                    showAdvancedSettings: true,
                    enableGPUProcessing: false,
                    previewQuality: 'high',
                    rememberLastPreset: false
                }

                localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences))

                const preferences = configStorage.getUserPreferences()
                expect(preferences).toEqual(storedPreferences)
            })

            it('should merge with defaults for partial preferences', () => {
                const partialPreferences = {
                    autoApplyPreset: false,
                    previewQuality: 'high' as const
                }

                localStorageMock.getItem.mockReturnValue(JSON.stringify(partialPreferences))

                const preferences = configStorage.getUserPreferences()
                expect(preferences.autoApplyPreset).toBe(false)
                expect(preferences.previewQuality).toBe('high')
                expect(preferences.showAdvancedSettings).toBe(false) // Default
                expect(preferences.enableGPUProcessing).toBe(true) // Default
                expect(preferences.rememberLastPreset).toBe(true) // Default
            })
        })

        describe('setUserPreferences', () => {
            it('should save preferences to localStorage', () => {
                const preferences = {
                    autoApplyPreset: false,
                    showAdvancedSettings: true
                }

                configStorage.setUserPreferences(preferences)

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_user_preferences',
                    expect.stringContaining('"autoApplyPreset":false')
                )
            })
        })
    })

    describe('Last Used Preset', () => {
        describe('getLastUsedPresetId', () => {
            it('should return null when none stored', () => {
                const presetId = configStorage.getLastUsedPresetId()
                expect(presetId).toBeNull()
            })

            it('should return stored preset ID', () => {
                localStorageMock.getItem.mockReturnValue('test-preset')

                const presetId = configStorage.getLastUsedPresetId()
                expect(presetId).toBe('test-preset')
            })
        })

        describe('setLastUsedPresetId', () => {
            it('should save preset ID to localStorage', () => {
                configStorage.setLastUsedPresetId('test-preset')

                expect(localStorageMock.setItem).toHaveBeenCalledWith(
                    'enhancement_last_used_preset',
                    'test-preset'
                )
            })
        })
    })

    describe('Export/Import', () => {
        it('should export configuration as JSON', () => {
            const config = configStorage.exportConfig()
            const parsed = JSON.parse(config)

            expect(parsed).toHaveProperty('defaultConfig')
            expect(parsed).toHaveProperty('defaultSettings')
            expect(parsed).toHaveProperty('customPresets')
            expect(parsed).toHaveProperty('userPreferences')
            expect(parsed).toHaveProperty('exportDate')
            expect(parsed).toHaveProperty('version')
        })

        it('should import valid configuration', () => {
            const testCustomPreset = createCustomPreset(
                'test-import-preset',
                'Test Import Preset',
                'Test description for import',
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

            const configData = {
                defaultConfig: getDefaultPreset().config,
                defaultSettings: getDefaultPreset().settings,
                customPresets: [testCustomPreset],
                userPreferences: {
                    autoApplyPreset: false,
                    showAdvancedSettings: true,
                    enableGPUProcessing: false,
                    previewQuality: 'high' as const,
                    rememberLastPreset: false
                }
            }

            const jsonConfig = JSON.stringify(configData)
            configStorage.importConfig(jsonConfig)

            // Verify that setItem was called for each component
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'enhancement_default_config',
                JSON.stringify(configData.defaultConfig)
            )
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'enhancement_default_settings',
                JSON.stringify(configData.defaultSettings)
            )
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'enhancement_custom_presets',
                JSON.stringify(configData.customPresets)
            )
        })

        it('should throw error for invalid JSON', () => {
            expect(() => {
                configStorage.importConfig('invalid json')
            }).toThrow('Invalid configuration file')
        })
    })

    describe('clearAllConfig', () => {
        it('should clear all configuration from localStorage', () => {
            configStorage.clearAllConfig()

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('enhancement_default_config')
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('enhancement_default_settings')
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('enhancement_custom_presets')
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('enhancement_last_used_preset')
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('enhancement_user_preferences')
        })
    })
})

describe('getConfigStorage', () => {
    it('should return ConfigStorage instance', () => {
        const storage = getConfigStorage()
        expect(storage).toBeInstanceOf(ConfigStorage)
    })
})
