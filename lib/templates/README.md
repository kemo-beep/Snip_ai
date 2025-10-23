# Professional Templates & Presets

A comprehensive library of professional templates and presets for video editing, designed to give users instant professional results without manual editing.

## Features

### 1. Color Grading Presets

Professional color grading looks organized by category:

- **Cinematic** (4 presets): Teal & Orange, Moody Cinematic, Warm Glow, Cool Blue
- **Corporate** (3 presets): Clean Corporate, Bright & Professional, Tech Corporate
- **Social Media** (3 presets): Vibrant Social, Instagram Style, TikTok Trendy
- **Creative** (3 presets): Pastel Dream, Neon Nights, Golden Sunset
- **Vintage** (3 presets): Vintage Film, 70s Retro, Classic B&W

Each preset includes:
- Brightness, contrast, saturation adjustments
- Temperature and tint controls
- Highlights and shadows manipulation
- Vibrance and hue shifts
- Sharpness, vignette, and grain effects

### 2. Aspect Ratio Templates

Pre-configured templates for different platforms:

- **Social Media**: Instagram Square (1:1), Instagram Story (9:16), TikTok (9:16), Twitter (16:9)
- **Professional**: YouTube (16:9), LinkedIn (16:9), Presentation HD/4K (16:9), Webinar (16:9)
- **Cinematic**: Ultra-wide (21:9), CinemaScope (2.39:1), IMAX (1.43:1)

Each template includes:
- Optimal resolution for platform
- Aspect ratio dimensions
- Platform recommendations
- Usage descriptions

### 3. Brand Kit Integration

Customizable brand kits with:

- **Color Palettes**: Primary, secondary, accent, background, and text colors
- **Typography**: Heading and body font specifications
- **Logo Management**: Multiple logo variants (full, icon, wordmark)
- **Watermarks**: Configurable position, size, and opacity

Pre-built brand kits:
- Tech Startup (modern, clean aesthetic)
- Creative Agency (bold, vibrant colors)
- Corporate Professional (traditional, trustworthy)

### 4. Transition Presets

Professional transitions between clips:

- **Fade**: Fade to Black, Fade to White, Crossfade
- **Slide**: Left, Right, Up, Down
- **Zoom**: Zoom In, Zoom Out
- **Blur**: Blur Transition
- **Wipe**: Left, Right, Circle

Each transition includes:
- Configurable duration
- Easing functions
- Custom parameters

## Usage

### Applying Color Grading

```typescript
import { colorGradingPresets, applyPresetToCanvas } from '@/lib/templates/colorGradingPresets'

// Get a preset
const preset = colorGradingPresets.find(p => p.id === 'cinematic-teal-orange')

// Apply to canvas
const ctx = canvas.getContext('2d')
applyPresetToCanvas(ctx, preset, canvas.width, canvas.height)
```

### Using Aspect Ratio Templates

```typescript
import { aspectRatioTemplates } from '@/lib/templates/aspectRatioTemplates'

// Get template for Instagram
const template = aspectRatioTemplates.find(t => t.id === 'instagram-square')

// Apply dimensions
canvas.width = template.width
canvas.height = template.height
```

### Applying Brand Kit

```typescript
import { defaultBrandKits, applyWatermark } from '@/lib/templates/brandKit'

// Get brand kit
const brandKit = defaultBrandKits.find(k => k.id === 'tech-startup')

// Apply watermark
const watermark = brandKit.watermarks[0]
await applyWatermark(ctx, watermark, canvas.width, canvas.height)
```

### Using Transitions

```typescript
import { transitionPresets, applyTransition } from '@/lib/templates/transitionPresets'

// Get transition
const transition = transitionPresets.find(t => t.id === 'fade-black')

// Apply between frames
applyTransition(ctx, fromFrame, toFrame, transition, progress)
```

## UI Integration

The templates are integrated into the video editor through the `TemplatesPanel` component in the right sidebar:

1. **Templates Tab**: Access all templates from a dedicated tab
2. **Category Filters**: Filter presets by category
3. **Visual Previews**: See previews before applying
4. **One-Click Apply**: Instant application with visual feedback
5. **Active Indicators**: See which templates are currently applied

## File Structure

```
lib/templates/
├── README.md                    # This file
├── colorGradingPresets.ts       # Color grading presets and utilities
├── aspectRatioTemplates.ts      # Aspect ratio templates
├── brandKit.ts                  # Brand kit management
├── transitionPresets.ts         # Transition effects
└── applyColorGrading.ts         # Color grading application utilities
```

## Extending Templates

### Adding a New Color Grading Preset

```typescript
const newPreset: ColorGradingPreset = {
  id: 'my-custom-preset',
  name: 'My Custom Look',
  description: 'A unique color grading style',
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

### Creating a Custom Brand Kit

```typescript
import { createCustomBrandKit } from '@/lib/templates/brandKit'

const myBrandKit = createCustomBrandKit(
  'My Brand',
  [
    { id: 'primary', name: 'Brand Blue', hex: '#0066cc', usage: 'primary' },
    { id: 'secondary', name: 'Brand Gray', hex: '#666666', usage: 'secondary' }
  ],
  [
    { id: 'heading', name: 'Roboto Bold', family: 'Roboto', weights: [700], usage: 'heading' }
  ]
)
```

## Performance Considerations

- Color grading is applied during export to avoid real-time processing overhead
- CSS filters are used for real-time preview when possible
- Canvas operations are optimized for batch processing
- Transitions are pre-calculated and cached

## Future Enhancements

- [ ] LUT (Look-Up Table) support for advanced color grading
- [ ] Custom preset creation and saving
- [ ] Preset import/export functionality
- [ ] AI-powered preset recommendations
- [ ] Animated transitions with keyframes
- [ ] Advanced brand kit features (multiple logos, custom fonts)
- [ ] Thumbnail generation with brand styling
- [ ] Preset marketplace/sharing

## Contributing

When adding new templates:

1. Follow the existing interface patterns
2. Include descriptive names and icons
3. Test across different video types
4. Document any special requirements
5. Add preview generation if applicable

## License

Part of the Snip.ai video editor project.
