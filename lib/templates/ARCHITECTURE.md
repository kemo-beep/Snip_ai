# Templates & Presets - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TemplatesPanel Component                    │  │
│  │  ┌────────┬────────┬────────┬────────────┐              │  │
│  │  │ Color  │ Aspect │ Brand  │ Transition │              │  │
│  │  │ Grading│ Ratio  │  Kit   │            │              │  │
│  │  └────────┴────────┴────────┴────────────┘              │  │
│  │                                                          │  │
│  │  • Visual Previews                                       │  │
│  │  • Category Filters                                      │  │
│  │  • One-Click Apply                                       │  │
│  │  • Active Indicators                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VideoEditor Component                       │  │
│  │                                                          │  │
│  │  • State Management                                      │  │
│  │  • Handler Functions                                     │  │
│  │  • Real-time Preview                                     │  │
│  │  • Export Integration                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Template Libraries                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Color Grading    │  │ Aspect Ratio     │                   │
│  │ Presets          │  │ Templates        │                   │
│  │                  │  │                  │                   │
│  │ • 16 Presets     │  │ • 12 Templates   │                   │
│  │ • 5 Categories   │  │ • 3 Categories   │                   │
│  │ • 12 Filters     │  │ • Platform Tags  │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Brand Kit        │  │ Transitions      │                   │
│  │ System           │  │ Presets          │                   │
│  │                  │  │                  │                   │
│  │ • 3 Kits         │  │ • 12 Transitions │                   │
│  │ • Custom Create  │  │ • 5 Types        │                   │
│  │ • Watermarks     │  │ • Easing         │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Processing Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              applyColorGrading.ts                        │  │
│  │                                                          │  │
│  │  • Canvas Processing                                     │  │
│  │  • CSS Filter Generation                                 │  │
│  │  • Vignette Effect                                       │  │
│  │  • Grain Effect                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Transition Application                      │  │
│  │                                                          │  │
│  │  • Frame Blending                                        │  │
│  │  • Easing Functions                                      │  │
│  │  • Effect Rendering                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Output Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Real-time Preview (CSS Filters)                             │
│  • Export Processing (Canvas)                                  │
│  • Thumbnail Generation                                        │
│  • Watermark Application                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Selects Template

```
User Click
    ↓
TemplatesPanel
    ↓
onApply Handler
    ↓
VideoEditor State Update
    ↓
Re-render with New Settings
```

### 2. Color Grading Application

```
Select Preset
    ↓
Get Preset by ID
    ↓
Extract Filters
    ↓
Preview: Apply CSS Filters
    ↓
Export: Apply Canvas Processing
```

### 3. Aspect Ratio Change

```
Select Template
    ↓
Get Template Dimensions
    ↓
Update Canvas Size
    ↓
Redraw Video Content
```

### 4. Brand Kit Application

```
Select Brand Kit
    ↓
Extract Colors/Fonts
    ↓
Apply to Background
    ↓
Add Watermark (if available)
    ↓
Generate Thumbnail
```

## Component Hierarchy

```
App
└── VideoEditor
    ├── Canvas (Video Preview)
    ├── VideoAnnotation
    ├── MultiTrackTimeline
    └── RightSidebar
        ├── Media Tab
        ├── Background Tab
        ├── Layout Tab
        ├── Templates Tab ← NEW
        │   └── TemplatesPanel
        │       ├── Color Grading Tab
        │       ├── Aspect Ratio Tab
        │       ├── Brand Kit Tab
        │       └── Transitions Tab
        ├── Webcam Tab
        ├── Video Tab
        └── Draw Tab
```

## State Management

### VideoEditor State

```typescript
{
  // Existing state
  backgroundSettings: {...},
  webcamSettings: {...},
  annotations: [...],
  clips: [...],
  
  // New template state
  currentColorPreset: string | undefined,
  currentAspectRatio: string | undefined,
  currentBrandKit: string | undefined,
  colorGradingFilters: ColorGradingFilters | null
}
```

### Template Selection Flow

```
1. User clicks preset in TemplatesPanel
2. TemplatesPanel calls onApply handler
3. Handler updates VideoEditor state
4. VideoEditor re-renders with new settings
5. Preview updates immediately (CSS)
6. Export applies full processing (Canvas)
```

## File Organization

```
lib/templates/
├── index.ts                      # Main exports
├── colorGradingPresets.ts        # 16 presets
├── aspectRatioTemplates.ts       # 12 templates
├── brandKit.ts                   # Brand management
├── transitionPresets.ts          # 12 transitions
├── applyColorGrading.ts          # Processing utilities
├── examples.ts                   # Usage examples
├── README.md                     # Full documentation
├── QUICKSTART.md                 # Quick start guide
├── ARCHITECTURE.md               # This file
└── __tests__/
    └── templates.test.ts         # Test suite

components/
├── TemplatesPanel.tsx            # UI component
├── VideoEditor.tsx               # Updated with handlers
└── RightSidebar.tsx              # Updated with tab

docs/
├── product_differential.md       # Updated status
└── TEMPLATES_IMPLEMENTATION.md   # Implementation details
```

## Integration Points

### 1. UI Layer
- **TemplatesPanel**: User interface for template selection
- **RightSidebar**: Container for templates tab
- **VideoEditor**: Main integration point

### 2. State Layer
- **Template Selection**: Track active templates
- **Filter Settings**: Store color grading parameters
- **Aspect Ratio**: Canvas dimensions

### 3. Processing Layer
- **Preview**: CSS filters for real-time feedback
- **Export**: Canvas processing for final output
- **Watermarks**: Brand kit integration

### 4. Data Layer
- **Presets**: Static template definitions
- **Custom Kits**: User-created brand kits
- **Preferences**: Saved template selections

## Performance Optimization

### Real-time Preview
```
CSS Filters (Fast)
    ↓
Immediate Visual Feedback
    ↓
No Canvas Processing
    ↓
60 FPS Performance
```

### Export Processing
```
Canvas Processing (Quality)
    ↓
Full Filter Application
    ↓
Pixel-level Manipulation
    ↓
High-Quality Output
```

### Lazy Loading
```
Templates Loaded on Demand
    ↓
Reduce Initial Bundle Size
    ↓
Faster Page Load
```

## Extension Points

### Adding New Presets

```typescript
// 1. Define preset
const newPreset: ColorGradingPreset = {
  id: 'my-preset',
  name: 'My Preset',
  // ... configuration
}

// 2. Add to array
colorGradingPresets.push(newPreset)

// 3. Automatically available in UI
```

### Custom Brand Kits

```typescript
// 1. Create kit
const kit = createCustomBrandKit(name, colors, fonts)

// 2. Save to storage (future)
localStorage.setItem('brandKit', JSON.stringify(kit))

// 3. Load and use
const savedKit = JSON.parse(localStorage.getItem('brandKit'))
```

### New Transition Types

```typescript
// 1. Define transition
const newTransition: TransitionPreset = {
  id: 'my-transition',
  type: 'custom',
  // ... configuration
}

// 2. Implement effect
function applyCustomTransition(ctx, from, to, progress) {
  // Custom logic
}

// 3. Register in system
transitionPresets.push(newTransition)
```

## Testing Strategy

### Unit Tests
- Individual preset validation
- Filter value ranges
- ID uniqueness
- Category filtering

### Integration Tests
- Template application
- State updates
- UI interactions
- Export processing

### Visual Tests
- Preview accuracy
- Color grading results
- Aspect ratio correctness
- Transition smoothness

## Security Considerations

### Input Validation
- Validate hex colors
- Check dimension ranges
- Sanitize user input
- Prevent XSS in custom content

### Resource Limits
- Max canvas size
- Processing timeouts
- Memory management
- File size limits

## Accessibility

### Keyboard Navigation
- Tab through templates
- Enter to select
- Arrow keys for navigation
- Escape to close

### Screen Readers
- ARIA labels on buttons
- Descriptive text for presets
- Status announcements
- Focus management

### Visual Indicators
- High contrast mode support
- Clear active states
- Hover feedback
- Focus outlines

## Browser Compatibility

### Supported Features
- Canvas API (all modern browsers)
- CSS Filters (IE11+)
- ES6+ (transpiled)
- TypeScript (compiled)

### Fallbacks
- CSS filter fallback for old browsers
- Canvas fallback for unsupported features
- Graceful degradation

## Future Architecture

### Planned Enhancements
- LUT support (3D color grading)
- GPU acceleration
- Web Workers for processing
- IndexedDB for custom presets
- Cloud sync for brand kits
- Preset marketplace API

---

**Last Updated**: October 22, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
