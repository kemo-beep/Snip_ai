/**
 * Professional Color Grading Presets
 * Industry-standard color grading looks for different video styles
 */

export interface ColorGradingPreset {
  id: string
  name: string
  description: string
  category: 'cinematic' | 'corporate' | 'social' | 'creative' | 'vintage'
  icon: string
  filters: {
    brightness: number      // -100 to 100
    contrast: number        // -100 to 100
    saturation: number      // -100 to 100
    temperature: number     // -100 to 100 (warm/cool)
    tint: number           // -100 to 100 (green/magenta)
    highlights: number      // -100 to 100
    shadows: number         // -100 to 100
    vibrance: number        // -100 to 100
    hue: number            // -180 to 180
    sharpness: number       // 0 to 100
    vignette: number        // 0 to 100
    grain: number           // 0 to 100
  }
  lut?: string // Optional LUT file reference
}

export const colorGradingPresets: ColorGradingPreset[] = [
  // Cinematic Presets
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    description: 'Hollywood blockbuster look with teal shadows and orange highlights',
    category: 'cinematic',
    icon: '🎬',
    filters: {
      brightness: 5,
      contrast: 15,
      saturation: 10,
      temperature: 15,
      tint: -5,
      highlights: -10,
      shadows: -15,
      vibrance: 20,
      hue: 0,
      sharpness: 10,
      vignette: 20,
      grain: 5
    }
  },
  {
    id: 'cinematic-moody',
    name: 'Moody Cinematic',
    description: 'Dark, dramatic look with crushed blacks and muted colors',
    category: 'cinematic',
    icon: '🌙',
    filters: {
      brightness: -10,
      contrast: 25,
      saturation: -15,
      temperature: -10,
      tint: 5,
      highlights: -15,
      shadows: -30,
      vibrance: -10,
      hue: 0,
      sharpness: 15,
      vignette: 35,
      grain: 10
    }
  },
  {
    id: 'cinematic-warm-glow',
    name: 'Warm Glow',
    description: 'Soft, warm look with glowing highlights',
    category: 'cinematic',
    icon: '☀️',
    filters: {
      brightness: 10,
      contrast: 5,
      saturation: 5,
      temperature: 25,
      tint: -5,
      highlights: 15,
      shadows: 5,
      vibrance: 15,
      hue: 5,
      sharpness: 5,
      vignette: 15,
      grain: 3
    }
  },
  {
    id: 'cinematic-cool-blue',
    name: 'Cool Blue',
    description: 'Sci-fi inspired cool blue tones',
    category: 'cinematic',
    icon: '❄️',
    filters: {
      brightness: 0,
      contrast: 20,
      saturation: -5,
      temperature: -25,
      tint: -10,
      highlights: 5,
      shadows: -10,
      vibrance: 10,
      hue: -10,
      sharpness: 20,
      vignette: 25,
      grain: 8
    }
  },

  // Corporate Presets
  {
    id: 'corporate-clean',
    name: 'Clean Corporate',
    description: 'Professional, neutral look with balanced colors',
    category: 'corporate',
    icon: '💼',
    filters: {
      brightness: 5,
      contrast: 10,
      saturation: 0,
      temperature: 5,
      tint: 0,
      highlights: 5,
      shadows: 5,
      vibrance: 5,
      hue: 0,
      sharpness: 15,
      vignette: 0,
      grain: 0
    }
  },
  {
    id: 'corporate-bright',
    name: 'Bright & Professional',
    description: 'Bright, energetic look for corporate videos',
    category: 'corporate',
    icon: '✨',
    filters: {
      brightness: 15,
      contrast: 15,
      saturation: 10,
      temperature: 10,
      tint: 0,
      highlights: 10,
      shadows: 10,
      vibrance: 15,
      hue: 0,
      sharpness: 20,
      vignette: 0,
      grain: 0
    }
  },
  {
    id: 'corporate-tech',
    name: 'Tech Corporate',
    description: 'Modern tech company aesthetic with cool tones',
    category: 'corporate',
    icon: '💻',
    filters: {
      brightness: 5,
      contrast: 15,
      saturation: -5,
      temperature: -10,
      tint: 0,
      highlights: 5,
      shadows: 0,
      vibrance: 10,
      hue: 0,
      sharpness: 25,
      vignette: 5,
      grain: 0
    }
  },

  // Social Media Presets
  {
    id: 'social-vibrant',
    name: 'Vibrant Social',
    description: 'Eye-catching, saturated colors for social media',
    category: 'social',
    icon: '🌈',
    filters: {
      brightness: 10,
      contrast: 20,
      saturation: 30,
      temperature: 5,
      tint: 0,
      highlights: 10,
      shadows: 5,
      vibrance: 35,
      hue: 0,
      sharpness: 20,
      vignette: 10,
      grain: 0
    }
  },
  {
    id: 'social-instagram',
    name: 'Instagram Style',
    description: 'Popular Instagram filter aesthetic',
    category: 'social',
    icon: '📸',
    filters: {
      brightness: 8,
      contrast: 12,
      saturation: 15,
      temperature: 10,
      tint: -3,
      highlights: 8,
      shadows: -5,
      vibrance: 20,
      hue: 0,
      sharpness: 15,
      vignette: 15,
      grain: 5
    }
  },
  {
    id: 'social-tiktok',
    name: 'TikTok Trendy',
    description: 'Trendy, high-contrast look for TikTok',
    category: 'social',
    icon: '🎵',
    filters: {
      brightness: 5,
      contrast: 25,
      saturation: 20,
      temperature: 0,
      tint: 0,
      highlights: 5,
      shadows: -10,
      vibrance: 25,
      hue: 0,
      sharpness: 25,
      vignette: 20,
      grain: 3
    }
  },

  // Creative Presets
  {
    id: 'creative-pastel',
    name: 'Pastel Dream',
    description: 'Soft, dreamy pastel colors',
    category: 'creative',
    icon: '🎨',
    filters: {
      brightness: 15,
      contrast: -10,
      saturation: -20,
      temperature: 10,
      tint: 5,
      highlights: 20,
      shadows: 15,
      vibrance: -15,
      hue: 0,
      sharpness: 5,
      vignette: 10,
      grain: 5
    }
  },
  {
    id: 'creative-neon',
    name: 'Neon Nights',
    description: 'Cyberpunk-inspired neon colors',
    category: 'creative',
    icon: '🌃',
    filters: {
      brightness: -5,
      contrast: 30,
      saturation: 40,
      temperature: -15,
      tint: 10,
      highlights: 20,
      shadows: -25,
      vibrance: 45,
      hue: 15,
      sharpness: 30,
      vignette: 30,
      grain: 15
    }
  },
  {
    id: 'creative-sunset',
    name: 'Golden Sunset',
    description: 'Warm, golden hour glow',
    category: 'creative',
    icon: '🌅',
    filters: {
      brightness: 10,
      contrast: 10,
      saturation: 20,
      temperature: 30,
      tint: -5,
      highlights: 15,
      shadows: -5,
      vibrance: 25,
      hue: 10,
      sharpness: 10,
      vignette: 20,
      grain: 5
    }
  },

  // Vintage Presets
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    description: 'Classic film camera look with grain',
    category: 'vintage',
    icon: '📽️',
    filters: {
      brightness: 0,
      contrast: 15,
      saturation: -10,
      temperature: 15,
      tint: 5,
      highlights: -5,
      shadows: -10,
      vibrance: -5,
      hue: 5,
      sharpness: 5,
      vignette: 40,
      grain: 25
    }
  },
  {
    id: 'vintage-70s',
    name: '70s Retro',
    description: 'Warm, faded 1970s aesthetic',
    category: 'vintage',
    icon: '🕺',
    filters: {
      brightness: 5,
      contrast: -5,
      saturation: -15,
      temperature: 20,
      tint: 10,
      highlights: 10,
      shadows: 5,
      vibrance: -10,
      hue: 15,
      sharpness: 0,
      vignette: 30,
      grain: 20
    }
  },
  {
    id: 'vintage-bw',
    name: 'Classic B&W',
    description: 'Timeless black and white',
    category: 'vintage',
    icon: '⚫',
    filters: {
      brightness: 0,
      contrast: 25,
      saturation: -100,
      temperature: 0,
      tint: 0,
      highlights: 10,
      shadows: -15,
      vibrance: 0,
      hue: 0,
      sharpness: 20,
      vignette: 25,
      grain: 15
    }
  }
]

export const getPresetsByCategory = (category: ColorGradingPreset['category']): ColorGradingPreset[] => {
  return colorGradingPresets.filter(p => p.category === category)
}

export const getPresetById = (id: string): ColorGradingPreset | undefined => {
  return colorGradingPresets.find(p => p.id === id)
}

export const applyPresetToCanvas = (
  ctx: CanvasRenderingContext2D,
  preset: ColorGradingPreset,
  width: number,
  height: number
) => {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const { filters } = preset

  // Convert filter values to usable ranges
  const brightnessMultiplier = 1 + (filters.brightness / 100)
  const contrastMultiplier = 1 + (filters.contrast / 100)
  const saturationMultiplier = 1 + (filters.saturation / 100)
  const temperatureShift = filters.temperature / 100
  const tintShift = filters.tint / 100

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Apply brightness
    r *= brightnessMultiplier
    g *= brightnessMultiplier
    b *= brightnessMultiplier

    // Apply contrast
    r = ((r / 255 - 0.5) * contrastMultiplier + 0.5) * 255
    g = ((g / 255 - 0.5) * contrastMultiplier + 0.5) * 255
    b = ((b / 255 - 0.5) * contrastMultiplier + 0.5) * 255

    // Apply temperature (warm/cool)
    r += temperatureShift * 30
    b -= temperatureShift * 30

    // Apply tint (green/magenta)
    g += tintShift * 30
    r -= tintShift * 15
    b -= tintShift * 15

    // Apply saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = gray + (r - gray) * saturationMultiplier
    g = gray + (g - gray) * saturationMultiplier
    b = gray + (b - gray) * saturationMultiplier

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  ctx.putImageData(imageData, 0, 0)
}
