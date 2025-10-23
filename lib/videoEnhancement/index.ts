/**
 * Video Enhancement Pipeline - Main exports
 * 
 * This module provides automatic video and audio enhancement capabilities
 * for the Snip.ai application.
 */

// Main pipeline orchestrator
export { EnhancementPipeline } from './EnhancementPipeline'
export type { EnhancementPipelineOptions } from './EnhancementPipeline'

// Processors
export { VideoProcessor } from './processors/VideoProcessor'
export type { VideoProcessingSettings, FrameAnalysisResult } from './processors/VideoProcessor'

export { AudioProcessor } from './processors/AudioProcessor'
export type {
    AudioProcessorConfig,
    AudioProcessorSettings,
    AudioProcessingResult
} from './processors/AudioProcessor'

export { FrameProcessor } from './processors/FrameProcessor'
export type {
    FrameProcessingSettings,
    FrameProcessingResult
} from './processors/FrameProcessor'

// Types
export type {
    EnhancementConfig,
    EnhancementSettings,
    EnhancementResult,
    EnhancementMetrics,
    ProcessingContext,
    FrameData,
    AudioData
} from './types'

export { EnhancementError, EnhancementErrorCode } from './types'

// Utilities
export {
    detectWebGLSupport,
    detectWebGL2Support,
    getGPUCapabilities,
    shouldUseGPUProcessing,
    createWebGLContext,
    testGPUProcessing
} from './utils/gpuDetection'

export type { GPUCapabilities } from './utils/gpuDetection'

export {
    analyzeFrame,
    calculateAverageBrightness,
    calculateContrast,
    detectColorTemperature,
    identifyDominantColors
} from './utils/colorAnalysis'

export type { ColorAnalysisResult } from './utils/colorAnalysis'

export {
    analyzeAudio,
    calculateAverageVolume,
    calculatePeakVolume,
    measureNoiseFloor,
    calculateDynamicRange
} from './utils/audioAnalysis'

export type { AudioAnalysisResult } from './utils/audioAnalysis'

// Presets and Configuration
export {
    DEFAULT_PRESETS,
    getPresetById,
    getPresetsByCategory,
    getDefaultPreset,
    getPresetCategories,
    validatePreset,
    createCustomPreset,
    ConfigStorage,
    getConfigStorage
} from './presets'

export type { EnhancementPreset, UserPreferences } from './presets'
