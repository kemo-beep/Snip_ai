/**
 * Examples and usage patterns for Professional Templates & Presets
 * This file demonstrates how to use the templates system
 */

import { 
  colorGradingPresets, 
  getPresetsByCategory,
  getPresetById,
  ColorGradingPreset 
} from './colorGradingPresets'

import { 
  aspectRatioTemplates,
  getTemplateByRatio,
  getTemplatesByCategory as getAspectTemplatesByCategory,
  getTemplatesByPlatform 
} from './aspectRatioTemplates'

import { 
  defaultBrandKits,
  getBrandKitById,
  createCustomBrandKit,
  applyWatermark,
  generateBrandedThumbnail,
  BrandKit 
} from './brandKit'

import { 
  transitionPresets,
  getTransitionsByType,
  getTransitionById,
  applyTransition 
} from './transitionPresets'

import { 
  applyColorGradingToCanvas,
  createCSSFilterString 
} from './applyColorGrading'

// ============================================================================
// Example 1: Apply Cinematic Color Grading to a Video
// ============================================================================

export const applyCinematicLook = (
  canvas: HTMLCanvasElement,
  presetId: string = 'cinematic-teal-orange'
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Get the preset
  const preset = getPresetById(presetId)
  if (!preset) {
    console.error('Preset not found:', presetId)
    return
  }

  console.log(`Applying ${preset.name} preset...`)
  
  // Apply color grading
  applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
  
  console.log('✅ Color grading applied successfully')
}

// ============================================================================
// Example 2: Set Up Video for Instagram Story
// ============================================================================

export const setupForInstagramStory = (canvas: HTMLCanvasElement) => {
  // Get Instagram Story template
  const template = getTemplatesByPlatform('Instagram').find(
    t => t.id === 'instagram-story'
  )
  
  if (!template) {
    console.error('Instagram Story template not found')
    return
  }

  console.log(`Setting up for ${template.name}...`)
  console.log(`Aspect Ratio: ${template.ratio}`)
  console.log(`Resolution: ${template.width}x${template.height}`)
  
  // Apply dimensions
  canvas.width = template.width
  canvas.height = template.height
  
  // Apply social media color grading
  const socialPreset = getPresetsByCategory('social').find(
    p => p.id === 'social-instagram'
  )
  
  if (socialPreset) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      applyColorGradingToCanvas(ctx, socialPreset.filters, canvas.width, canvas.height)
    }
  }
  
  console.log('✅ Instagram Story setup complete')
}

// ============================================================================
// Example 3: Apply Brand Kit to Video
// ============================================================================

export const applyTechStartupBranding = async (
  canvas: HTMLCanvasElement,
  videoTitle: string = 'Product Demo'
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Get Tech Startup brand kit
  const brandKit = getBrandKitById('tech-startup')
  if (!brandKit) {
    console.error('Brand kit not found')
    return
  }

  console.log(`Applying ${brandKit.name} brand kit...`)
  
  // Apply brand colors as gradient background
  const primaryColor = brandKit.colors.find(c => c.usage === 'primary')
  const secondaryColor = brandKit.colors.find(c => c.usage === 'secondary')
  
  if (primaryColor && secondaryColor) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, primaryColor.hex)
    gradient.addColorStop(1, secondaryColor.hex)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  // Generate branded thumbnail
  const thumbnail = generateBrandedThumbnail(canvas, brandKit, videoTitle)
  console.log('✅ Branded thumbnail generated:', thumbnail.substring(0, 50) + '...')
  
  // Apply watermark if available
  if (brandKit.watermarks.length > 0) {
    await applyWatermark(ctx, brandKit.watermarks[0], canvas.width, canvas.height)
    console.log('✅ Watermark applied')
  }
  
  console.log('✅ Brand kit applied successfully')
}

// ============================================================================
// Example 4: Create Custom Brand Kit
// ============================================================================

export const createMyCompanyBrandKit = (): BrandKit => {
  console.log('Creating custom brand kit...')
  
  const brandKit = createCustomBrandKit(
    'My Company',
    [
      { id: 'primary', name: 'Company Blue', hex: '#0066cc', usage: 'primary' },
      { id: 'secondary', name: 'Company Orange', hex: '#ff6600', usage: 'secondary' },
      { id: 'accent', name: 'Bright Green', hex: '#00cc66', usage: 'accent' },
      { id: 'bg', name: 'Dark Background', hex: '#1a1a1a', usage: 'background' },
      { id: 'text', name: 'White Text', hex: '#ffffff', usage: 'text' }
    ],
    [
      { id: 'heading', name: 'Montserrat Bold', family: 'Montserrat', weights: [700, 900], usage: 'heading' },
      { id: 'body', name: 'Open Sans', family: 'Open Sans', weights: [400, 600], usage: 'body' }
    ]
  )
  
  console.log('✅ Custom brand kit created:', brandKit.name)
  return brandKit
}

// ============================================================================
// Example 5: Apply Transition Between Clips
// ============================================================================

export const applyFadeTransition = (
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  progress: number // 0 to 1
) => {
  // Get fade transition
  const transition = getTransitionById('crossfade')
  if (!transition) {
    console.error('Transition not found')
    return
  }

  console.log(`Applying ${transition.name} transition at ${Math.round(progress * 100)}%`)
  
  // Apply transition
  applyTransition(ctx, fromFrame, toFrame, transition, progress)
}

// ============================================================================
// Example 6: Get All Presets for a Category
// ============================================================================

export const listCinematicPresets = () => {
  console.log('Available Cinematic Presets:')
  console.log('=' .repeat(50))
  
  const cinematicPresets = getPresetsByCategory('cinematic')
  
  cinematicPresets.forEach((preset, index) => {
    console.log(`${index + 1}. ${preset.icon} ${preset.name}`)
    console.log(`   ${preset.description}`)
    console.log(`   Brightness: ${preset.filters.brightness}, Contrast: ${preset.filters.contrast}`)
    console.log('')
  })
  
  return cinematicPresets
}

// ============================================================================
// Example 7: Real-time Preview with CSS Filters
// ============================================================================

export const applyRealtimePreview = (
  videoElement: HTMLVideoElement,
  presetId: string
) => {
  const preset = getPresetById(presetId)
  if (!preset) {
    console.error('Preset not found')
    return
  }

  console.log(`Applying real-time preview: ${preset.name}`)
  
  // Create CSS filter string for real-time preview
  const filterString = createCSSFilterString(preset.filters)
  videoElement.style.filter = filterString
  
  console.log('✅ CSS filters applied:', filterString)
}

// ============================================================================
// Example 8: Batch Process Multiple Videos
// ============================================================================

export const batchProcessVideos = async (
  canvases: HTMLCanvasElement[],
  presetId: string,
  aspectRatioId: string
) => {
  console.log('Starting batch processing...')
  console.log(`Processing ${canvases.length} videos`)
  
  const preset = getPresetById(presetId)
  const template = aspectRatioTemplates.find(t => t.id === aspectRatioId)
  
  if (!preset || !template) {
    console.error('Preset or template not found')
    return
  }

  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i]
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    console.log(`Processing video ${i + 1}/${canvases.length}...`)
    
    // Apply aspect ratio
    canvas.width = template.width
    canvas.height = template.height
    
    // Apply color grading
    applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
    
    console.log(`✅ Video ${i + 1} processed`)
  }
  
  console.log('✅ Batch processing complete')
}

// ============================================================================
// Example 9: Platform-Specific Optimization
// ============================================================================

export const optimizeForPlatform = (
  canvas: HTMLCanvasElement,
  platform: 'youtube' | 'instagram' | 'tiktok' | 'linkedin'
) => {
  console.log(`Optimizing for ${platform}...`)
  
  let templateId: string
  let presetId: string
  
  switch (platform) {
    case 'youtube':
      templateId = 'youtube-standard'
      presetId = 'corporate-clean'
      break
    case 'instagram':
      templateId = 'instagram-square'
      presetId = 'social-instagram'
      break
    case 'tiktok':
      templateId = 'tiktok-vertical'
      presetId = 'social-tiktok'
      break
    case 'linkedin':
      templateId = 'linkedin-video'
      presetId = 'corporate-bright'
      break
  }
  
  const template = aspectRatioTemplates.find(t => t.id === templateId)
  const preset = getPresetById(presetId)
  
  if (!template || !preset) {
    console.error('Template or preset not found')
    return
  }

  // Apply template
  canvas.width = template.width
  canvas.height = template.height
  
  // Apply preset
  const ctx = canvas.getContext('2d')
  if (ctx) {
    applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
  }
  
  console.log('✅ Optimization complete')
  console.log(`   Resolution: ${template.width}x${template.height}`)
  console.log(`   Aspect Ratio: ${template.ratio}`)
  console.log(`   Color Grading: ${preset.name}`)
}

// ============================================================================
// Example 10: Export All Available Options
// ============================================================================

export const listAllAvailableOptions = () => {
  console.log('📋 AVAILABLE TEMPLATES & PRESETS')
  console.log('=' .repeat(70))
  
  console.log('\n🎨 COLOR GRADING PRESETS:')
  console.log(`   Total: ${colorGradingPresets.length}`)
  console.log(`   Cinematic: ${getPresetsByCategory('cinematic').length}`)
  console.log(`   Corporate: ${getPresetsByCategory('corporate').length}`)
  console.log(`   Social: ${getPresetsByCategory('social').length}`)
  console.log(`   Creative: ${getPresetsByCategory('creative').length}`)
  console.log(`   Vintage: ${getPresetsByCategory('vintage').length}`)
  
  console.log('\n📐 ASPECT RATIO TEMPLATES:')
  console.log(`   Total: ${aspectRatioTemplates.length}`)
  console.log(`   Social: ${getAspectTemplatesByCategory('social').length}`)
  console.log(`   Professional: ${getAspectTemplatesByCategory('professional').length}`)
  console.log(`   Cinematic: ${getAspectTemplatesByCategory('cinematic').length}`)
  
  console.log('\n✨ BRAND KITS:')
  console.log(`   Total: ${defaultBrandKits.length}`)
  defaultBrandKits.forEach(kit => {
    console.log(`   - ${kit.name}: ${kit.colors.length} colors, ${kit.fonts.length} fonts`)
  })
  
  console.log('\n🎬 TRANSITIONS:')
  console.log(`   Total: ${transitionPresets.length}`)
  console.log(`   Fade: ${getTransitionsByType('fade').length}`)
  console.log(`   Slide: ${getTransitionsByType('slide').length}`)
  console.log(`   Zoom: ${getTransitionsByType('zoom').length}`)
  console.log(`   Blur: ${getTransitionsByType('blur').length}`)
  console.log(`   Wipe: ${getTransitionsByType('wipe').length}`)
  
  console.log('\n' + '=' .repeat(70))
}
