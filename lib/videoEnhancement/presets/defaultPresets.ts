/**
 * Default enhancement presets for the Auto-Enhancement Pipeline
 * Requirements: 4.1, 4.6
 */

import type { EnhancementConfig, EnhancementSettings } from '../types'

/**
 * Preset definition interface
 */
export interface EnhancementPreset {
    id: string
    name: string
    description: string
    config: EnhancementConfig
    settings: EnhancementSettings
    category: 'auto' | 'minimal' | 'professional' | 'social' | 'custom'
}

/**
 * Default enhancement presets
 * Requirements: 4.1, 4.6
 */
export const DEFAULT_PRESETS: EnhancementPreset[] = [
    {
        id: 'auto',
        name: 'Auto',
        description: 'Automatically applies all enhancements with optimal settings for most content',
        category: 'auto',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        },
        settings: {
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Auto-calculated
            saturation: 0,        // Auto-calculated
            temperature: 0,       // Auto-calculated
            noiseReduction: 70,   // Moderate noise reduction
            volumeBoost: 0,       // Auto-calculated
            voiceClarity: 60,     // Moderate voice enhancement
            echoReduction: 60,    // Moderate echo reduction
            stabilizationStrength: 50 // Moderate stabilization
        }
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Only essential enhancements for basic quality improvement',
        category: 'minimal',
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
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Disabled
            saturation: 0,        // Disabled
            temperature: 0,       // Disabled
            noiseReduction: 50,   // Light noise reduction
            volumeBoost: 0,       // Auto-calculated
            voiceClarity: 0,      // Disabled
            echoReduction: 0,     // Disabled
            stabilizationStrength: 0 // Disabled
        }
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Optimized for business content, presentations, and professional videos',
        category: 'professional',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        },
        settings: {
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Auto-calculated
            saturation: 0,        // Auto-calculated
            temperature: 0,       // Auto-calculated
            noiseReduction: 80,   // Strong noise reduction for clarity
            volumeBoost: 0,       // Auto-calculated
            voiceClarity: 75,     // High voice clarity for presentations
            echoReduction: 70,    // Strong echo reduction
            stabilizationStrength: 60 // Strong stabilization for professional look
        }
    },
    {
        id: 'social-media',
        name: 'Social Media',
        description: 'Optimized for social platforms with vibrant colors and clear audio',
        category: 'social',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        },
        settings: {
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Auto-calculated
            saturation: 10,       // Slightly enhanced saturation for vibrancy
            temperature: 0,       // Auto-calculated
            noiseReduction: 60,   // Moderate noise reduction
            volumeBoost: 5,       // Slight volume boost for mobile viewing
            voiceClarity: 65,     // Good voice clarity
            echoReduction: 50,    // Moderate echo reduction
            stabilizationStrength: 70 // Strong stabilization for mobile viewing
        }
    },
    {
        id: 'low-light',
        name: 'Low Light',
        description: 'Optimized for videos shot in low light conditions',
        category: 'custom',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        },
        settings: {
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Auto-calculated
            saturation: 0,        // Auto-calculated
            temperature: 0,       // Auto-calculated
            noiseReduction: 85,   // Very strong noise reduction for low light
            volumeBoost: 0,       // Auto-calculated
            voiceClarity: 70,     // High voice clarity
            echoReduction: 60,    // Moderate echo reduction
            stabilizationStrength: 40 // Moderate stabilization (low light often has intentional camera movement)
        }
    },
    {
        id: 'outdoor',
        name: 'Outdoor',
        description: 'Optimized for outdoor videos with natural lighting',
        category: 'custom',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        },
        settings: {
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Auto-calculated
            saturation: 5,        // Slight saturation boost for outdoor colors
            temperature: 0,       // Auto-calculated
            noiseReduction: 40,   // Light noise reduction (outdoor usually has less noise)
            volumeBoost: 0,       // Auto-calculated
            voiceClarity: 50,     // Moderate voice clarity
            echoReduction: 30,    // Light echo reduction
            stabilizationStrength: 80 // Very strong stabilization for outdoor movement
        }
    },
    {
        id: 'interview',
        name: 'Interview',
        description: 'Optimized for interview-style content with clear voice and minimal distractions',
        category: 'custom',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: false // Interviews are usually static
        },
        settings: {
            brightness: 0,        // Auto-calculated
            contrast: 0,          // Auto-calculated
            saturation: 0,        // Auto-calculated
            temperature: 0,       // Auto-calculated
            noiseReduction: 90,   // Very strong noise reduction for clean audio
            volumeBoost: 0,       // Auto-calculated
            voiceClarity: 85,     // Very high voice clarity
            echoReduction: 80,    // Very strong echo reduction
            stabilizationStrength: 0 // Disabled for interviews
        }
    }
]

/**
 * Get a preset by ID
 * @param id - The preset ID
 * @returns The preset or undefined if not found
 */
export function getPresetById(id: string): EnhancementPreset | undefined {
    return DEFAULT_PRESETS.find(preset => preset.id === id)
}

/**
 * Get all presets by category
 * @param category - The preset category
 * @returns Array of presets in the category
 */
export function getPresetsByCategory(category: EnhancementPreset['category']): EnhancementPreset[] {
    return DEFAULT_PRESETS.filter(preset => preset.category === category)
}

/**
 * Get the default preset (Auto)
 * @returns The default preset
 */
export function getDefaultPreset(): EnhancementPreset {
    return DEFAULT_PRESETS.find(preset => preset.id === 'auto')!
}

/**
 * Get all available preset categories
 * @returns Array of unique categories
 */
export function getPresetCategories(): EnhancementPreset['category'][] {
    return Array.from(new Set(DEFAULT_PRESETS.map(preset => preset.category)))
}

/**
 * Validate a preset configuration
 * @param preset - The preset to validate
 * @returns True if valid, false otherwise
 */
export function validatePreset(preset: EnhancementPreset): boolean {
    // Check required fields
    if (!preset.id || !preset.name || !preset.description || !preset.config || !preset.settings) {
        return false
    }

    // Validate config boolean values
    const configKeys: (keyof EnhancementConfig)[] = [
        'autoColorCorrection', 'autoBrightnessAdjust', 'autoContrast', 'autoWhiteBalance',
        'autoNoiseReduction', 'autoVolumeNormalization', 'autoVoiceEnhancement',
        'autoEchoCancel', 'autoStabilization'
    ]

    for (const key of configKeys) {
        if (typeof preset.config[key] !== 'boolean') {
            return false
        }
    }

    // Validate settings numeric values
    const settingsKeys: (keyof EnhancementSettings)[] = [
        'brightness', 'contrast', 'saturation', 'temperature',
        'noiseReduction', 'volumeBoost', 'voiceClarity', 'echoReduction', 'stabilizationStrength'
    ]

    for (const key of settingsKeys) {
        if (typeof preset.settings[key] !== 'number') {
            return false
        }
    }

    // Validate numeric ranges
    if (preset.settings.brightness < -100 || preset.settings.brightness > 100) return false
    if (preset.settings.contrast < -100 || preset.settings.contrast > 100) return false
    if (preset.settings.saturation < -100 || preset.settings.saturation > 100) return false
    if (preset.settings.temperature < -100 || preset.settings.temperature > 100) return false
    if (preset.settings.noiseReduction < 0 || preset.settings.noiseReduction > 100) return false
    if (preset.settings.volumeBoost < 0 || preset.settings.volumeBoost > 100) return false
    if (preset.settings.voiceClarity < 0 || preset.settings.voiceClarity > 100) return false
    if (preset.settings.echoReduction < 0 || preset.settings.echoReduction > 100) return false
    if (preset.settings.stabilizationStrength < 0 || preset.settings.stabilizationStrength > 100) return false

    return true
}

/**
 * Create a custom preset
 * @param id - Unique ID for the preset
 * @param name - Display name
 * @param description - Description
 * @param config - Enhancement configuration
 * @param settings - Enhancement settings
 * @returns The created preset
 */
export function createCustomPreset(
    id: string,
    name: string,
    description: string,
    config: EnhancementConfig,
    settings: EnhancementSettings
): EnhancementPreset {
    const preset: EnhancementPreset = {
        id,
        name,
        description,
        config,
        settings,
        category: 'custom'
    }

    if (!validatePreset(preset)) {
        throw new Error('Invalid preset configuration')
    }

    return preset
}
