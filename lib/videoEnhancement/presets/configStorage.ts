/**
 * Configuration storage for enhancement preferences
 * Requirements: 4.5, 4.6
 */

import type { EnhancementConfig, EnhancementSettings } from '../types'
import type { EnhancementPreset } from './defaultPresets'
import { getDefaultPreset, createCustomPreset, validatePreset } from './defaultPresets'

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
    DEFAULT_CONFIG: 'enhancement_default_config',
    DEFAULT_SETTINGS: 'enhancement_default_settings',
    CUSTOM_PRESETS: 'enhancement_custom_presets',
    LAST_USED_PRESET: 'enhancement_last_used_preset',
    USER_PREFERENCES: 'enhancement_user_preferences'
} as const

/**
 * User preferences interface
 */
export interface UserPreferences {
    autoApplyPreset: boolean
    showAdvancedSettings: boolean
    enableGPUProcessing: boolean
    previewQuality: 'low' | 'medium' | 'high'
    rememberLastPreset: boolean
}

/**
 * Default user preferences
 */
const DEFAULT_USER_PREFERENCES: UserPreferences = {
    autoApplyPreset: true,
    showAdvancedSettings: false,
    enableGPUProcessing: true,
    previewQuality: 'medium',
    rememberLastPreset: true
}

/**
 * Configuration storage manager
 * Requirements: 4.5, 4.6
 */
export class ConfigStorage {
    private static instance: ConfigStorage | null = null

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): ConfigStorage {
        if (!ConfigStorage.instance) {
            ConfigStorage.instance = new ConfigStorage()
        }
        return ConfigStorage.instance
    }

    /**
     * Check if localStorage is available
     */
    private isStorageAvailable(): boolean {
        try {
            const test = '__storage_test__'
            localStorage.setItem(test, test)
            localStorage.removeItem(test)
            return true
        } catch {
            return false
        }
    }

    /**
     * Get default configuration
     * Requirements: 4.5
     */
    getDefaultConfig(): EnhancementConfig {
        if (!this.isStorageAvailable()) {
            return getDefaultPreset().config
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEYS.DEFAULT_CONFIG)
            if (stored) {
                const config = JSON.parse(stored) as EnhancementConfig
                // Validate the stored config
                if (this.validateConfig(config)) {
                    return config
                }
            }
        } catch (error) {
            console.warn('Failed to load default config from storage:', error)
        }

        // Return default preset config if storage fails
        return getDefaultPreset().config
    }

    /**
     * Set default configuration
     * Requirements: 4.5
     */
    setDefaultConfig(config: EnhancementConfig): void {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, cannot save default config')
            return
        }

        if (!this.validateConfig(config)) {
            throw new Error('Invalid configuration provided')
        }

        try {
            localStorage.setItem(STORAGE_KEYS.DEFAULT_CONFIG, JSON.stringify(config))
        } catch (error) {
            console.error('Failed to save default config to storage:', error)
            throw error
        }
    }

    /**
     * Get default settings
     * Requirements: 4.5
     */
    getDefaultSettings(): EnhancementSettings {
        if (!this.isStorageAvailable()) {
            return getDefaultPreset().settings
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEYS.DEFAULT_SETTINGS)
            if (stored) {
                const settings = JSON.parse(stored) as EnhancementSettings
                // Validate the stored settings
                if (this.validateSettings(settings)) {
                    return settings
                }
            }
        } catch (error) {
            console.warn('Failed to load default settings from storage:', error)
        }

        // Return default preset settings if storage fails
        return getDefaultPreset().settings
    }

    /**
     * Set default settings
     * Requirements: 4.5
     */
    setDefaultSettings(settings: EnhancementSettings): void {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, cannot save default settings')
            return
        }

        if (!this.validateSettings(settings)) {
            throw new Error('Invalid settings provided')
        }

        try {
            localStorage.setItem(STORAGE_KEYS.DEFAULT_SETTINGS, JSON.stringify(settings))
        } catch (error) {
            console.error('Failed to save default settings to storage:', error)
            throw error
        }
    }

    /**
     * Get custom presets
     * Requirements: 4.6
     */
    getCustomPresets(): EnhancementPreset[] {
        if (!this.isStorageAvailable()) {
            return []
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS)
            if (stored) {
                const presets = JSON.parse(stored) as EnhancementPreset[]
                // Validate all presets
                return presets.filter(preset => validatePreset(preset))
            }
        } catch (error) {
            console.warn('Failed to load custom presets from storage:', error)
        }

        return []
    }

    /**
     * Save custom presets
     * Requirements: 4.6
     */
    saveCustomPresets(presets: EnhancementPreset[]): void {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, cannot save custom presets')
            return
        }

        // Validate all presets before saving
        const validPresets = presets.filter(preset => validatePreset(preset))

        if (validPresets.length !== presets.length) {
            console.warn('Some presets were invalid and were not saved')
        }

        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(validPresets))
        } catch (error) {
            console.error('Failed to save custom presets to storage:', error)
            throw error
        }
    }

    /**
     * Add a custom preset
     * Requirements: 4.6
     */
    addCustomPreset(preset: EnhancementPreset): void {
        if (!validatePreset(preset)) {
            throw new Error('Invalid preset configuration')
        }

        const customPresets = this.getCustomPresets()

        // Check if preset with same ID already exists
        if (customPresets.some(p => p.id === preset.id)) {
            throw new Error('Preset with this ID already exists')
        }

        customPresets.push(preset)
        this.saveCustomPresets(customPresets)
    }

    /**
     * Update a custom preset
     * Requirements: 4.6
     */
    updateCustomPreset(id: string, updates: Partial<EnhancementPreset>): void {
        const customPresets = this.getCustomPresets()
        const index = customPresets.findIndex(p => p.id === id)

        if (index === -1) {
            throw new Error('Preset not found')
        }

        const updatedPreset = { ...customPresets[index], ...updates }

        if (!validatePreset(updatedPreset)) {
            throw new Error('Invalid preset configuration')
        }

        customPresets[index] = updatedPreset
        this.saveCustomPresets(customPresets)
    }

    /**
     * Delete a custom preset
     * Requirements: 4.6
     */
    deleteCustomPreset(id: string): void {
        const customPresets = this.getCustomPresets()
        const filteredPresets = customPresets.filter(p => p.id !== id)

        if (filteredPresets.length === customPresets.length) {
            throw new Error('Preset not found')
        }

        this.saveCustomPresets(filteredPresets)
    }

    /**
     * Get last used preset ID
     * Requirements: 4.5
     */
    getLastUsedPresetId(): string | null {
        if (!this.isStorageAvailable()) {
            return null
        }

        try {
            return localStorage.getItem(STORAGE_KEYS.LAST_USED_PRESET)
        } catch (error) {
            console.warn('Failed to load last used preset from storage:', error)
            return null
        }
    }

    /**
     * Set last used preset ID
     * Requirements: 4.5
     */
    setLastUsedPresetId(presetId: string): void {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, cannot save last used preset')
            return
        }

        try {
            localStorage.setItem(STORAGE_KEYS.LAST_USED_PRESET, presetId)
        } catch (error) {
            console.error('Failed to save last used preset to storage:', error)
        }
    }

    /**
     * Get user preferences
     * Requirements: 4.5
     */
    getUserPreferences(): UserPreferences {
        if (!this.isStorageAvailable()) {
            return DEFAULT_USER_PREFERENCES
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
            if (stored) {
                const preferences = JSON.parse(stored) as UserPreferences
                // Merge with defaults to ensure all properties exist
                return { ...DEFAULT_USER_PREFERENCES, ...preferences }
            }
        } catch (error) {
            console.warn('Failed to load user preferences from storage:', error)
        }

        return DEFAULT_USER_PREFERENCES
    }

    /**
     * Set user preferences
     * Requirements: 4.5
     */
    setUserPreferences(preferences: Partial<UserPreferences>): void {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, cannot save user preferences')
            return
        }

        const currentPreferences = this.getUserPreferences()
        const updatedPreferences = { ...currentPreferences, ...preferences }

        try {
            localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPreferences))
        } catch (error) {
            console.error('Failed to save user preferences to storage:', error)
            throw error
        }
    }

    /**
     * Clear all stored configuration
     * Requirements: 4.5, 4.6
     */
    clearAllConfig(): void {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available, cannot clear configuration')
            return
        }

        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key)
            })
        } catch (error) {
            console.error('Failed to clear configuration from storage:', error)
            throw error
        }
    }

    /**
     * Export configuration as JSON
     * Requirements: 4.5, 4.6
     */
    exportConfig(): string {
        const config = {
            defaultConfig: this.getDefaultConfig(),
            defaultSettings: this.getDefaultSettings(),
            customPresets: this.getCustomPresets(),
            userPreferences: this.getUserPreferences(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        }

        return JSON.stringify(config, null, 2)
    }

    /**
     * Import configuration from JSON
     * Requirements: 4.5, 4.6
     */
    importConfig(jsonConfig: string): void {
        try {
            const config = JSON.parse(jsonConfig)

            // Validate the imported configuration
            if (config.defaultConfig && this.validateConfig(config.defaultConfig)) {
                this.setDefaultConfig(config.defaultConfig)
            }

            if (config.defaultSettings && this.validateSettings(config.defaultSettings)) {
                this.setDefaultSettings(config.defaultSettings)
            }

            if (config.customPresets && Array.isArray(config.customPresets)) {
                const validPresets = config.customPresets.filter((preset: any) => validatePreset(preset))
                this.saveCustomPresets(validPresets)
            }

            if (config.userPreferences) {
                this.setUserPreferences(config.userPreferences)
            }
        } catch (error) {
            console.error('Failed to import configuration:', error)
            throw new Error('Invalid configuration file')
        }
    }

    /**
     * Validate configuration object
     */
    private validateConfig(config: any): config is EnhancementConfig {
        if (!config || typeof config !== 'object') return false

        const requiredKeys: (keyof EnhancementConfig)[] = [
            'autoColorCorrection', 'autoBrightnessAdjust', 'autoContrast', 'autoWhiteBalance',
            'autoNoiseReduction', 'autoVolumeNormalization', 'autoVoiceEnhancement',
            'autoEchoCancel', 'autoStabilization'
        ]

        return requiredKeys.every(key => typeof config[key] === 'boolean')
    }

    /**
     * Validate settings object
     */
    private validateSettings(settings: any): settings is EnhancementSettings {
        if (!settings || typeof settings !== 'object') return false

        const requiredKeys: (keyof EnhancementSettings)[] = [
            'brightness', 'contrast', 'saturation', 'temperature',
            'noiseReduction', 'volumeBoost', 'voiceClarity', 'echoReduction', 'stabilizationStrength'
        ]

        return requiredKeys.every(key => typeof settings[key] === 'number')
    }
}

/**
 * Get the global configuration storage instance
 */
export function getConfigStorage(): ConfigStorage {
    return ConfigStorage.getInstance()
}
