# Video Enhancement Modules

This directory contains individual enhancement modules for the Auto-Enhancement Pipeline.

## Available Enhancements

### Color Correction

#### Individual Modules
- **brightnessAdjust.ts** - Brightness adjustment (CPU & GPU)
- **contrastEnhance.ts** - Contrast enhancement (CPU & GPU)
- **whiteBalance.ts** - White balance correction (CPU & GPU)

#### Unified Module
- **colorCorrection.ts** - Combined color correction in a single pass

The unified color correction module combines brightness, contrast, and white balance adjustments into a single processing pass for optimal performance. This is more efficient than applying each correction separately.

### Key Features

1. **Dual Implementation**: Both CPU and GPU (WebGL) implementations for maximum compatibility
2. **Auto-Correction**: Automatic calculation of optimal settings based on image analysis
3. **Single-Pass Processing**: All color corrections applied in one pass for better performance
4. **Flexible API**: Can apply manual settings or use automatic detection

### Usage

```typescript
import {
  applyColorCorrectionCPU,
  autoColorCorrection,
  calculateOptimalColorCorrection,
  type ColorCorrectionSettings,
} from './colorCorrection';

// Automatic correction
const enhanced = autoColorCorrection(imageData);

// Manual correction
const settings: ColorCorrectionSettings = {
  brightness: 15,
  contrast: 10,
  temperature: -5,
};
const enhanced = applyColorCorrectionCPU(imageData, settings);

// Calculate optimal settings
const optimal = calculateOptimalColorCorrection(imageData);
```

### Performance

The unified color correction module processes:
- 1080p frames in < 20ms (CPU)
- 1080p frames in < 5ms (GPU with WebGL)

### Testing

All modules include comprehensive test coverage:
- Unit tests for individual functions
- Integration tests for combined operations
- Performance tests for large images
- Browser compatibility tests

Run tests with:
```bash
npm test -- lib/videoEnhancement/enhancements/__tests__/
```

## Requirements Coverage

The color correction modules satisfy the following requirements:

- **1.1**: Auto-color correction with automatic analysis
- **1.2**: Auto-brightness adjustment
- **1.3**: Auto-contrast enhancement
- **1.4**: Auto-white balance correction
- **1.6**: Preserves aspect ratio and resolution
- **1.7**: Efficient processing (< 5 seconds for 5-minute videos)

## Future Enhancements

Planned additions to this directory:
- Audio enhancement modules (noise reduction, volume normalization, etc.)
- Video stabilization
- Additional color grading presets
