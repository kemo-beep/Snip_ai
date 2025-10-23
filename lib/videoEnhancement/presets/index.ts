/**
 * Enhancement presets module
 * Exports all preset-related functionality
 * Requirements: 4.1, 4.5, 4.6
 */

// Default presets
export {
    DEFAULT_PRESETS,
    getPresetById,
    getPresetsByCategory,
    getDefaultPreset,
    getPresetCategories,
    validatePreset,
    createCustomPreset,
    type EnhancementPreset
} from './defaultPresets'

// Configuration storage
export {
    ConfigStorage,
    getConfigStorage,
    type UserPreferences
} from './configStorage'
