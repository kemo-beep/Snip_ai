/**
 * Tests for Professional Templates & Presets
 */

import { 
  colorGradingPresets, 
  getPresetsByCategory,
  getPresetById 
} from '../colorGradingPresets'

import { 
  aspectRatioTemplates,
  getTemplateByRatio,
  getTemplatesByCategory,
  getTemplatesByPlatform 
} from '../aspectRatioTemplates'

import { 
  defaultBrandKits,
  getBrandKitById,
  createCustomBrandKit 
} from '../brandKit'

import { 
  transitionPresets,
  getTransitionsByType,
  getTransitionById 
} from '../transitionPresets'

describe('Color Grading Presets', () => {
  test('should have all required presets', () => {
    expect(colorGradingPresets.length).toBeGreaterThan(0)
    expect(colorGradingPresets.length).toBe(16)
  })

  test('should have presets in all categories', () => {
    const categories = ['cinematic', 'corporate', 'social', 'creative', 'vintage']
    categories.forEach(category => {
      const presets = getPresetsByCategory(category as any)
      expect(presets.length).toBeGreaterThan(0)
    })
  })

  test('should get preset by id', () => {
    const preset = getPresetById('cinematic-teal-orange')
    expect(preset).toBeDefined()
    expect(preset?.name).toBe('Teal & Orange')
    expect(preset?.category).toBe('cinematic')
  })

  test('should have valid filter values', () => {
    colorGradingPresets.forEach(preset => {
      expect(preset.filters.brightness).toBeGreaterThanOrEqual(-100)
      expect(preset.filters.brightness).toBeLessThanOrEqual(100)
      expect(preset.filters.contrast).toBeGreaterThanOrEqual(-100)
      expect(preset.filters.contrast).toBeLessThanOrEqual(100)
      expect(preset.filters.saturation).toBeGreaterThanOrEqual(-100)
      expect(preset.filters.saturation).toBeLessThanOrEqual(100)
    })
  })

  test('should have unique ids', () => {
    const ids = colorGradingPresets.map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('Aspect Ratio Templates', () => {
  test('should have all required templates', () => {
    expect(aspectRatioTemplates.length).toBeGreaterThan(0)
    expect(aspectRatioTemplates.length).toBe(12)
  })

  test('should get template by ratio', () => {
    const template = getTemplateByRatio('16:9')
    expect(template).toBeDefined()
    expect(template?.ratio).toBe('16:9')
  })

  test('should get templates by category', () => {
    const socialTemplates = getTemplatesByCategory('social')
    expect(socialTemplates.length).toBeGreaterThan(0)
    socialTemplates.forEach(t => {
      expect(t.category).toBe('social')
    })
  })

  test('should get templates by platform', () => {
    const instagramTemplates = getTemplatesByPlatform('Instagram')
    expect(instagramTemplates.length).toBeGreaterThan(0)
    instagramTemplates.forEach(t => {
      expect(t.platforms.some(p => p.includes('Instagram'))).toBe(true)
    })
  })

  test('should have valid dimensions', () => {
    aspectRatioTemplates.forEach(template => {
      expect(template.width).toBeGreaterThan(0)
      expect(template.height).toBeGreaterThan(0)
      
      // Verify aspect ratio calculation
      const calculatedRatio = template.width / template.height
      const [w, h] = template.ratio.split(':').map(Number)
      const expectedRatio = w / h
      
      // Allow small floating point differences
      expect(Math.abs(calculatedRatio - expectedRatio)).toBeLessThan(0.1)
    })
  })

  test('should have unique ids', () => {
    const ids = aspectRatioTemplates.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('Brand Kits', () => {
  test('should have default brand kits', () => {
    expect(defaultBrandKits.length).toBeGreaterThan(0)
    expect(defaultBrandKits.length).toBe(3)
  })

  test('should get brand kit by id', () => {
    const brandKit = getBrandKitById('tech-startup')
    expect(brandKit).toBeDefined()
    expect(brandKit?.name).toBe('Tech Startup')
  })

  test('should have valid color palettes', () => {
    defaultBrandKits.forEach(kit => {
      expect(kit.colors.length).toBeGreaterThan(0)
      kit.colors.forEach(color => {
        expect(color.hex).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(['primary', 'secondary', 'accent', 'background', 'text']).toContain(color.usage)
      })
    })
  })

  test('should create custom brand kit', () => {
    const customKit = createCustomBrandKit(
      'Test Brand',
      [
        { id: 'primary', name: 'Blue', hex: '#0000ff', usage: 'primary' },
        { id: 'secondary', name: 'Red', hex: '#ff0000', usage: 'secondary' }
      ],
      [
        { id: 'heading', name: 'Arial', family: 'Arial', weights: [700], usage: 'heading' }
      ]
    )

    expect(customKit.name).toBe('Test Brand')
    expect(customKit.colors.length).toBe(2)
    expect(customKit.fonts.length).toBe(1)
    expect(customKit.id).toContain('custom-')
  })

  test('should have default settings', () => {
    defaultBrandKits.forEach(kit => {
      expect(kit.defaultSettings).toBeDefined()
      expect(kit.defaultSettings.logoPosition).toBeDefined()
      expect(kit.defaultSettings.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(kit.defaultSettings.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})

describe('Transition Presets', () => {
  test('should have all required transitions', () => {
    expect(transitionPresets.length).toBeGreaterThan(0)
    expect(transitionPresets.length).toBe(13)
  })

  test('should get transitions by type', () => {
    const fadeTransitions = getTransitionsByType('fade')
    expect(fadeTransitions.length).toBeGreaterThan(0)
    fadeTransitions.forEach(t => {
      expect(t.type).toBe('fade')
    })
  })

  test('should get transition by id', () => {
    const transition = getTransitionById('crossfade')
    expect(transition).toBeDefined()
    expect(transition?.name).toBe('Crossfade')
    expect(transition?.type).toBe('dissolve')
  })

  test('should have valid durations', () => {
    transitionPresets.forEach(transition => {
      expect(transition.duration).toBeGreaterThan(0)
      expect(transition.duration).toBeLessThanOrEqual(2)
    })
  })

  test('should have valid easing functions', () => {
    const validEasings = ['linear', 'ease-in', 'ease-out', 'ease-in-out']
    transitionPresets.forEach(transition => {
      expect(validEasings).toContain(transition.easing)
    })
  })

  test('should have unique ids', () => {
    const ids = transitionPresets.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('Integration Tests', () => {
  test('should have matching categories across systems', () => {
    // Color grading categories
    const colorCategories = ['cinematic', 'corporate', 'social', 'creative', 'vintage']
    colorCategories.forEach(category => {
      const presets = getPresetsByCategory(category as any)
      expect(presets.length).toBeGreaterThan(0)
    })

    // Aspect ratio categories
    const aspectCategories = ['social', 'professional', 'cinematic']
    aspectCategories.forEach(category => {
      const templates = getTemplatesByCategory(category as any)
      expect(templates.length).toBeGreaterThan(0)
    })
  })

  test('should have consistent naming conventions', () => {
    // All presets should have kebab-case ids
    colorGradingPresets.forEach(preset => {
      expect(preset.id).toMatch(/^[a-z0-9-]+$/)
    })

    aspectRatioTemplates.forEach(template => {
      expect(template.id).toMatch(/^[a-z0-9-]+$/)
    })

    transitionPresets.forEach(transition => {
      expect(transition.id).toMatch(/^[a-z0-9-]+$/)
    })
  })

  test('should have descriptions for all items', () => {
    colorGradingPresets.forEach(preset => {
      expect(preset.description).toBeTruthy()
      expect(preset.description.length).toBeGreaterThan(10)
    })

    aspectRatioTemplates.forEach(template => {
      expect(template.description).toBeTruthy()
      expect(template.description.length).toBeGreaterThan(10)
    })

    transitionPresets.forEach(transition => {
      expect(transition.description).toBeTruthy()
      expect(transition.description.length).toBeGreaterThan(10)
    })
  })
})
