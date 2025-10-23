/**
 * Apply color grading filters to video frames during export
 */

import { ColorGradingPreset } from './colorGradingPresets'

export interface ColorGradingFilters {
  brightness: number
  contrast: number
  saturation: number
  temperature: number
  tint: number
  highlights: number
  shadows: number
  vibrance: number
  hue: number
  sharpness: number
  vignette: number
  grain: number
}

/**
 * Apply color grading to a canvas context
 */
export const applyColorGradingToCanvas = (
  ctx: CanvasRenderingContext2D,
  filters: ColorGradingFilters,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Convert filter values to usable ranges
  const brightnessMultiplier = 1 + (filters.brightness / 100)
  const contrastMultiplier = 1 + (filters.contrast / 100)
  const saturationMultiplier = 1 + (filters.saturation / 100)
  const temperatureShift = filters.temperature / 100
  const tintShift = filters.tint / 100
  const highlightsAdjust = filters.highlights / 100
  const shadowsAdjust = filters.shadows / 100
  const vibranceMultiplier = 1 + (filters.vibrance / 100)

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Calculate luminance for highlights/shadows
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b

    // Apply highlights and shadows
    if (luminance > 128) {
      // Highlights
      const highlightFactor = 1 + (highlightsAdjust * ((luminance - 128) / 127))
      r *= highlightFactor
      g *= highlightFactor
      b *= highlightFactor
    } else {
      // Shadows
      const shadowFactor = 1 + (shadowsAdjust * (1 - luminance / 128))
      r *= shadowFactor
      g *= shadowFactor
      b *= shadowFactor
    }

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

    // Apply vibrance (affects less saturated colors more)
    const maxChannel = Math.max(r, g, b)
    const minChannel = Math.min(r, g, b)
    const currentSaturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0
    const vibranceFactor = 1 + ((1 - currentSaturation) * (vibranceMultiplier - 1))
    r = gray + (r - gray) * vibranceFactor
    g = gray + (g - gray) * vibranceFactor
    b = gray + (b - gray) * vibranceFactor

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  // Apply vignette
  if (filters.vignette > 0) {
    applyVignette(data, width, height, filters.vignette / 100)
  }

  // Apply grain
  if (filters.grain > 0) {
    applyGrain(data, filters.grain / 100)
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Apply vignette effect
 */
const applyVignette = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  intensity: number
): void => {
  const centerX = width / 2
  const centerY = height / 2
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const vignetteFactor = 1 - (distance / maxDistance) * intensity

      data[i] *= vignetteFactor
      data[i + 1] *= vignetteFactor
      data[i + 2] *= vignetteFactor
    }
  }
}

/**
 * Apply film grain effect
 */
const applyGrain = (data: Uint8ClampedArray, intensity: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * intensity * 50
    data[i] = Math.max(0, Math.min(255, data[i] + grain))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain))
  }
}

/**
 * Create a CSS filter string from color grading filters
 * (for real-time preview without canvas processing)
 */
export const createCSSFilterString = (filters: ColorGradingFilters): string => {
  const filterParts: string[] = []

  if (filters.brightness !== 0) {
    filterParts.push(`brightness(${1 + filters.brightness / 100})`)
  }

  if (filters.contrast !== 0) {
    filterParts.push(`contrast(${1 + filters.contrast / 100})`)
  }

  if (filters.saturation !== 0) {
    filterParts.push(`saturate(${1 + filters.saturation / 100})`)
  }

  if (filters.hue !== 0) {
    filterParts.push(`hue-rotate(${filters.hue}deg)`)
  }

  return filterParts.join(' ')
}
