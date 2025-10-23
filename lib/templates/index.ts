/**
 * Professional Templates & Presets
 * Main export file for easy imports
 */

// Color Grading Presets
export {
  colorGradingPresets,
  getPresetsByCategory,
  getPresetById,
  applyPresetToCanvas,
  type ColorGradingPreset
} from './colorGradingPresets'

// Aspect Ratio Templates
export {
  aspectRatioTemplates,
  getTemplateByRatio,
  getTemplatesByCategory as getAspectTemplatesByCategory,
  getTemplatesByPlatform,
  type AspectRatioTemplate
} from './aspectRatioTemplates'

// Brand Kit
export {
  defaultBrandKits,
  getBrandKitById,
  createCustomBrandKit,
  applyBrandColors,
  applyWatermark,
  generateBrandedThumbnail,
  type BrandKit,
  type BrandColor,
  type BrandFont,
  type BrandLogo,
  type BrandWatermark
} from './brandKit'

// Transitions
export {
  transitionPresets,
  getTransitionsByType,
  getTransitionById,
  applyTransition,
  type TransitionPreset
} from './transitionPresets'

// Color Grading Utilities
export {
  applyColorGradingToCanvas,
  createCSSFilterString,
  type ColorGradingFilters
} from './applyColorGrading'

// Examples (optional, for reference)
export * from './examples'
