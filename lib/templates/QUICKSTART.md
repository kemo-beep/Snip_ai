# Templates & Presets - Quick Start Guide

Get started with Professional Templates & Presets in 5 minutes.

## 🚀 Quick Start

### 1. Import What You Need

```typescript
import { 
  colorGradingPresets, 
  getPresetById 
} from '@/lib/templates/colorGradingPresets'

import { 
  aspectRatioTemplates 
} from '@/lib/templates/aspectRatioTemplates'

import { 
  defaultBrandKits 
} from '@/lib/templates/brandKit'
```

### 2. Apply a Color Preset (3 lines)

```typescript
const preset = getPresetById('cinematic-teal-orange')
const ctx = canvas.getContext('2d')
applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
```

### 3. Set Aspect Ratio (2 lines)

```typescript
const template = aspectRatioTemplates.find(t => t.id === 'instagram-square')
canvas.width = template.width
canvas.height = template.height
```

### 4. Apply Brand Kit (4 lines)

```typescript
const brandKit = defaultBrandKits[0]
const primaryColor = brandKit.colors.find(c => c.usage === 'primary')
const secondaryColor = brandKit.colors.find(c => c.usage === 'secondary')
// Use colors in your UI
```

## 📋 Common Use Cases

### Instagram Story Video

```typescript
// Set dimensions
const template = aspectRatioTemplates.find(t => t.id === 'instagram-story')
canvas.width = template.width  // 1080
canvas.height = template.height // 1920

// Apply social media color grading
const preset = getPresetById('social-instagram')
applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
```

### YouTube Video with Branding

```typescript
// Set YouTube dimensions
const template = aspectRatioTemplates.find(t => t.id === 'youtube-standard')
canvas.width = template.width  // 1920
canvas.height = template.height // 1080

// Apply corporate look
const preset = getPresetById('corporate-clean')
applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)

// Add brand watermark
const brandKit = getBrandKitById('tech-startup')
if (brandKit.watermarks[0]) {
  await applyWatermark(ctx, brandKit.watermarks[0], canvas.width, canvas.height)
}
```

### Cinematic Video

```typescript
// Set cinematic aspect ratio
const template = aspectRatioTemplates.find(t => t.id === 'cinematic-wide')
canvas.width = template.width  // 2560
canvas.height = template.height // 1080

// Apply cinematic color grading
const preset = getPresetById('cinematic-moody')
applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
```

## 🎨 Browse Available Options

### List All Color Presets

```typescript
import { colorGradingPresets } from '@/lib/templates/colorGradingPresets'

colorGradingPresets.forEach(preset => {
  console.log(`${preset.icon} ${preset.name} - ${preset.description}`)
})
```

### List All Aspect Ratios

```typescript
import { aspectRatioTemplates } from '@/lib/templates/aspectRatioTemplates'

aspectRatioTemplates.forEach(template => {
  console.log(`${template.icon} ${template.name} (${template.ratio})`)
  console.log(`  Platforms: ${template.platforms.join(', ')}`)
})
```

### List All Brand Kits

```typescript
import { defaultBrandKits } from '@/lib/templates/brandKit'

defaultBrandKits.forEach(kit => {
  console.log(`${kit.name}: ${kit.description}`)
  console.log(`  Colors: ${kit.colors.map(c => c.name).join(', ')}`)
})
```

## 🔍 Find What You Need

### By Category

```typescript
import { getPresetsByCategory } from '@/lib/templates/colorGradingPresets'

const cinematicPresets = getPresetsByCategory('cinematic')
const socialPresets = getPresetsByCategory('social')
```

### By Platform

```typescript
import { getTemplatesByPlatform } from '@/lib/templates/aspectRatioTemplates'

const instagramTemplates = getTemplatesByPlatform('Instagram')
const youtubeTemplates = getTemplatesByPlatform('YouTube')
```

### By Type

```typescript
import { getTransitionsByType } from '@/lib/templates/transitionPresets'

const fadeTransitions = getTransitionsByType('fade')
const slideTransitions = getTransitionsByType('slide')
```

## 🎬 Real-time Preview

Use CSS filters for instant preview without canvas processing:

```typescript
import { createCSSFilterString } from '@/lib/templates/applyColorGrading'

const preset = getPresetById('cinematic-teal-orange')
const filterString = createCSSFilterString(preset.filters)

// Apply to video element
videoElement.style.filter = filterString
```

## 🛠️ Create Custom Presets

### Custom Brand Kit

```typescript
import { createCustomBrandKit } from '@/lib/templates/brandKit'

const myBrand = createCustomBrandKit(
  'My Company',
  [
    { id: 'primary', name: 'Blue', hex: '#0066cc', usage: 'primary' },
    { id: 'secondary', name: 'Orange', hex: '#ff6600', usage: 'secondary' }
  ],
  [
    { id: 'heading', name: 'Roboto', family: 'Roboto', weights: [700], usage: 'heading' }
  ]
)
```

### Custom Color Preset

```typescript
const myPreset: ColorGradingPreset = {
  id: 'my-custom-look',
  name: 'My Custom Look',
  description: 'My unique style',
  category: 'creative',
  icon: '🎨',
  filters: {
    brightness: 10,
    contrast: 15,
    saturation: 20,
    temperature: 5,
    tint: 0,
    highlights: 10,
    shadows: -5,
    vibrance: 15,
    hue: 0,
    sharpness: 10,
    vignette: 15,
    grain: 5
  }
}
```

## 📱 Platform-Specific Quick Setup

### Instagram

```typescript
import { optimizeForPlatform } from '@/lib/templates/examples'
optimizeForPlatform(canvas, 'instagram')
```

### TikTok

```typescript
import { optimizeForPlatform } from '@/lib/templates/examples'
optimizeForPlatform(canvas, 'tiktok')
```

### YouTube

```typescript
import { optimizeForPlatform } from '@/lib/templates/examples'
optimizeForPlatform(canvas, 'youtube')
```

### LinkedIn

```typescript
import { optimizeForPlatform } from '@/lib/templates/examples'
optimizeForPlatform(canvas, 'linkedin')
```

## 🎯 Best Practices

1. **Apply aspect ratio first**, then color grading
2. **Use CSS filters for preview**, canvas processing for export
3. **Cache preset selections** to avoid repeated lookups
4. **Test on target platform** before final export
5. **Combine presets** for unique looks (aspect + color + brand)

## 🐛 Troubleshooting

### Preset not found?
```typescript
const preset = getPresetById('my-preset')
if (!preset) {
  console.error('Preset not found')
  // Use default preset
  const defaultPreset = colorGradingPresets[0]
}
```

### Canvas not updating?
```typescript
// Make sure to get fresh context
const ctx = canvas.getContext('2d', { willReadFrequently: true })
```

### Colors look wrong?
```typescript
// Ensure canvas has content before applying filters
ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
// Then apply color grading
applyColorGradingToCanvas(ctx, preset.filters, canvas.width, canvas.height)
```

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [examples.ts](./examples.ts) for 10 complete examples
- Review [tests](`./__tests__/templates.test.ts`) for usage patterns
- Explore the [TemplatesPanel component](../../components/TemplatesPanel.tsx)

## 💡 Tips

- Start with pre-built presets, customize later
- Use category filters to find relevant presets quickly
- Combine templates for platform-specific optimization
- Save your favorite combinations for reuse
- Test exports on actual devices/platforms

## 🎉 You're Ready!

You now know enough to use the templates system effectively. Start with the examples above and explore from there!

---

**Need Help?** Check the full documentation in [README.md](./README.md)
