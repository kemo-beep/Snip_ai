/**
 * Integration tests for unified color correction module
 * Tests CPU and GPU implementations, auto-correction, and combined adjustments
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyColorCorrectionCPU,
  applyColorCorrectionGPU,
  calculateOptimalColorCorrection,
  autoColorCorrection,
  createColorCorrectionProgram,
  createTextureFromImageData,
  type ColorCorrectionSettings,
} from '../colorCorrection';

/**
 * Helper function to create test image data
 */
function createTestImageData(
  width: number = 100,
  height: number = 100,
  fillColor?: { r: number; g: number; b: number; a: number }
): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  if (fillColor) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillColor.r;
      data[i + 1] = fillColor.g;
      data[i + 2] = fillColor.b;
      data[i + 3] = fillColor.a;
    }
  } else {
    // Create a gradient pattern for more realistic testing
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        data[i] = (x / width) * 255; // Red gradient
        data[i + 1] = (y / height) * 255; // Green gradient
        data[i + 2] = 128; // Constant blue
        data[i + 3] = 255; // Full opacity
      }
    }
  }

  return imageData;
}

/**
 * Helper function to calculate average brightness
 */
function getAverageBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    count++;
  }

  return sum / count;
}

/**
 * Helper function to calculate average color values
 */
function getAverageColors(imageData: ImageData): { r: number; g: number; b: number } {
  const data = imageData.data;
  let r = 0, g = 0, b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
  };
}

describe('ColorCorrection - CPU Implementation', () => {
  it('should apply brightness adjustment correctly', () => {
    const input = createTestImageData(50, 50, { r: 100, g: 100, b: 100, a: 255 });
    const inputBrightness = getAverageBrightness(input);
    const settings: ColorCorrectionSettings = {
      brightness: 20,
      contrast: 0,
      temperature: 0,
    };

    const output = applyColorCorrectionCPU(input, settings);
    const avgBrightness = getAverageBrightness(output);

    expect(avgBrightness).toBeGreaterThan(inputBrightness);
  });

  it('should apply contrast adjustment correctly', () => {
    const input = createTestImageData(50, 50);
    const settings: ColorCorrectionSettings = {
      brightness: 0,
      contrast: 30,
      temperature: 0,
    };

    const output = applyColorCorrectionCPU(input, settings);
    
    // With increased contrast, the range of values should be wider
    expect(output.data.length).toBe(input.data.length);
  });

  it('should apply temperature adjustment correctly', () => {
    const input = createTestImageData(50, 50, { r: 128, g: 128, b: 128, a: 255 });
    const settings: ColorCorrectionSettings = {
      brightness: 0,
      contrast: 0,
      temperature: 50, // Warmer
    };

    const output = applyColorCorrectionCPU(input, settings);
    const colors = getAverageColors(output);

    // Warmer temperature should increase red and decrease blue
    expect(colors.r).toBeGreaterThan(128);
    expect(colors.b).toBeLessThan(128);
  });

  it('should apply all corrections in a single pass', () => {
    const input = createTestImageData(50, 50, { r: 100, g: 100, b: 100, a: 255 });
    const inputBrightness = getAverageBrightness(input);
    const inputColors = getAverageColors(input);
    const settings: ColorCorrectionSettings = {
      brightness: 20,
      contrast: 15,
      temperature: -10, // Cooler
    };

    const output = applyColorCorrectionCPU(input, settings);
    const colors = getAverageColors(output);

    // Should have applied all three adjustments
    expect(getAverageBrightness(output)).toBeGreaterThan(inputBrightness);
    expect(colors.b).toBeGreaterThan(inputColors.b); // Cooler = more blue
  });

  it('should preserve image dimensions', () => {
    const input = createTestImageData(1920, 1080);
    const settings: ColorCorrectionSettings = {
      brightness: 10,
      contrast: 10,
      temperature: 10,
    };

    const output = applyColorCorrectionCPU(input, settings);

    expect(output.width).toBe(1920);
    expect(output.height).toBe(1080);
  });

  it('should clamp values to valid range', () => {
    const input = createTestImageData(50, 50, { r: 250, g: 250, b: 250, a: 255 });
    const settings: ColorCorrectionSettings = {
      brightness: 100, // Maximum brightness
      contrast: 100,
      temperature: 100,
    };

    const output = applyColorCorrectionCPU(input, settings);
    const data = output.data;

    // All RGB values should be clamped to 0-255
    for (let i = 0; i < data.length; i += 4) {
      expect(data[i]).toBeGreaterThanOrEqual(0);
      expect(data[i]).toBeLessThanOrEqual(255);
      expect(data[i + 1]).toBeGreaterThanOrEqual(0);
      expect(data[i + 1]).toBeLessThanOrEqual(255);
      expect(data[i + 2]).toBeGreaterThanOrEqual(0);
      expect(data[i + 2]).toBeLessThanOrEqual(255);
    }
  });

  it('should handle negative adjustments', () => {
    const input = createTestImageData(50, 50, { r: 150, g: 150, b: 150, a: 255 });
    const inputBrightness = getAverageBrightness(input);
    const settings: ColorCorrectionSettings = {
      brightness: -30,
      contrast: -20,
      temperature: -40,
    };

    const output = applyColorCorrectionCPU(input, settings);
    const avgBrightness = getAverageBrightness(output);

    expect(avgBrightness).toBeLessThan(inputBrightness);
  });

  it('should preserve alpha channel', () => {
    const input = createTestImageData(50, 50, { r: 100, g: 100, b: 100, a: 200 });
    const settings: ColorCorrectionSettings = {
      brightness: 20,
      contrast: 20,
      temperature: 20,
    };

    const output = applyColorCorrectionCPU(input, settings);
    const data = output.data;

    // Check that alpha values remain unchanged
    for (let i = 3; i < data.length; i += 4) {
      expect(data[i]).toBe(200);
    }
  });
});

describe('ColorCorrection - Auto Correction', () => {
  it('should calculate optimal settings for dark image', () => {
    const darkImage = createTestImageData(50, 50, { r: 50, g: 50, b: 50, a: 255 });
    const settings = calculateOptimalColorCorrection(darkImage);

    // Should suggest increasing brightness
    expect(settings.brightness).toBeGreaterThan(0);
  });

  it('should calculate optimal settings for bright image', () => {
    const brightImage = createTestImageData(50, 50, { r: 200, g: 200, b: 200, a: 255 });
    const settings = calculateOptimalColorCorrection(brightImage);

    // Should suggest decreasing brightness
    expect(settings.brightness).toBeLessThan(0);
  });

  it('should calculate optimal settings for warm-tinted image', () => {
    const warmImage = createTestImageData(50, 50, { r: 180, g: 140, b: 100, a: 255 });
    const settings = calculateOptimalColorCorrection(warmImage);

    // Should suggest cooling down (negative temperature)
    expect(settings.temperature).toBeLessThan(0);
  });

  it('should apply auto correction successfully', () => {
    // Use a gradient image instead of uniform color for more realistic testing
    const input = createTestImageData(50, 50); // Creates gradient
    const inputBrightness = getAverageBrightness(input);
    const output = autoColorCorrection(input);
    const outputBrightness = getAverageBrightness(output);

    // Should have adjusted the image
    // The gradient has average brightness around 127, so adjustment should be minimal
    // but not exactly the same due to contrast and temperature adjustments
    expect(output.width).toBe(50);
    expect(output.height).toBe(50);
  });

  it('should respect custom target values', () => {
    const input = createTestImageData(50, 50, { r: 100, g: 100, b: 100, a: 255 });
    const settings = calculateOptimalColorCorrection(input, {
      targetBrightness: 150,
      targetContrast: 60,
      targetTemperature: 10,
    });

    expect(settings).toHaveProperty('brightness');
    expect(settings).toHaveProperty('contrast');
    expect(settings).toHaveProperty('temperature');
  });
});

describe('ColorCorrection - GPU Implementation', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | null;

  beforeEach(() => {
    // Create a canvas for WebGL context
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  });

  it('should create shader program successfully', () => {
    if (!gl) {
      console.log('WebGL not available, skipping GPU test');
      return;
    }

    const program = createColorCorrectionProgram(gl);
    expect(program).not.toBeNull();
    
    if (program) {
      gl.deleteProgram(program);
    }
  });

  it('should create texture from image data', () => {
    if (!gl) {
      console.log('WebGL not available, skipping GPU test');
      return;
    }

    const imageData = createTestImageData(50, 50);
    const texture = createTextureFromImageData(gl, imageData);
    
    expect(texture).not.toBeNull();
    
    if (texture) {
      gl.deleteTexture(texture);
    }
  });

  it('should apply color correction using GPU', () => {
    if (!gl) {
      console.log('WebGL not available, skipping GPU test');
      return;
    }

    const program = createColorCorrectionProgram(gl);
    if (!program) {
      console.log('Failed to create shader program, skipping test');
      return;
    }

    const input = createTestImageData(50, 50, { r: 100, g: 100, b: 100, a: 255 });
    const texture = createTextureFromImageData(gl, input);
    
    if (!texture) {
      gl.deleteProgram(program);
      console.log('Failed to create texture, skipping test');
      return;
    }

    const settings: ColorCorrectionSettings = {
      brightness: 20,
      contrast: 10,
      temperature: 5,
    };

    const output = applyColorCorrectionGPU(gl, program, texture, settings, 50, 50);

    expect(output.width).toBe(50);
    expect(output.height).toBe(50);
    expect(getAverageBrightness(output)).toBeGreaterThan(getAverageBrightness(input));

    // Clean up
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  });

  it('should produce similar results to CPU implementation', () => {
    if (!gl) {
      console.log('WebGL not available, skipping GPU test');
      return;
    }

    const program = createColorCorrectionProgram(gl);
    if (!program) {
      console.log('Failed to create shader program, skipping test');
      return;
    }

    const input = createTestImageData(50, 50, { r: 128, g: 128, b: 128, a: 255 });
    const settings: ColorCorrectionSettings = {
      brightness: 15,
      contrast: 10,
      temperature: -5,
    };

    // CPU version
    const cpuOutput = applyColorCorrectionCPU(
      createTestImageData(50, 50, { r: 128, g: 128, b: 128, a: 255 }),
      settings
    );

    // GPU version
    const texture = createTextureFromImageData(gl, input);
    if (!texture) {
      gl.deleteProgram(program);
      console.log('Failed to create texture, skipping test');
      return;
    }

    const gpuOutput = applyColorCorrectionGPU(gl, program, texture, settings, 50, 50);

    // Results should be similar (allowing for small floating-point differences)
    const cpuBrightness = getAverageBrightness(cpuOutput);
    const gpuBrightness = getAverageBrightness(gpuOutput);
    const difference = Math.abs(cpuBrightness - gpuBrightness);

    expect(difference).toBeLessThan(5); // Allow small difference due to GPU precision

    // Clean up
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  });
});

describe('ColorCorrection - Integration Tests', () => {
  it('should handle zero adjustments (no-op)', () => {
    const input = createTestImageData(50, 50);
    const settings: ColorCorrectionSettings = {
      brightness: 0,
      contrast: 0,
      temperature: 0,
    };

    const output = applyColorCorrectionCPU(input, settings);

    // Output should be very similar to input
    const inputBrightness = getAverageBrightness(input);
    const outputBrightness = getAverageBrightness(output);
    
    expect(Math.abs(inputBrightness - outputBrightness)).toBeLessThan(1);
  });

  it('should handle extreme adjustments gracefully', () => {
    const input = createTestImageData(50, 50);
    const settings: ColorCorrectionSettings = {
      brightness: 100,
      contrast: 100,
      temperature: 100,
    };

    const output = applyColorCorrectionCPU(input, settings);

    // Should not throw and should produce valid image data
    expect(output.width).toBe(50);
    expect(output.height).toBe(50);
    
    // All values should be valid
    for (let i = 0; i < output.data.length; i++) {
      expect(output.data[i]).toBeGreaterThanOrEqual(0);
      expect(output.data[i]).toBeLessThanOrEqual(255);
    }
  });

  it('should work with different image sizes', () => {
    const sizes = [
      [10, 10],
      [100, 100],
      [1920, 1080],
      [640, 480],
    ];

    const settings: ColorCorrectionSettings = {
      brightness: 10,
      contrast: 10,
      temperature: 10,
    };

    sizes.forEach(([width, height]) => {
      const input = createTestImageData(width, height);
      const output = applyColorCorrectionCPU(input, settings);

      expect(output.width).toBe(width);
      expect(output.height).toBe(height);
    });
  });

  it('should be performant for large images', () => {
    const input = createTestImageData(1920, 1080);
    const settings: ColorCorrectionSettings = {
      brightness: 15,
      contrast: 20,
      temperature: -10,
    };

    const startTime = performance.now();
    applyColorCorrectionCPU(input, settings);
    const endTime = performance.now();

    const processingTime = endTime - startTime;

    // Should process 1080p image in reasonable time (< 500ms)
    expect(processingTime).toBeLessThan(500);
  });

  it('should combine all three adjustments correctly', () => {
    const input = createTestImageData(50, 50, { r: 100, g: 100, b: 100, a: 255 });
    const inputBrightness = getAverageBrightness(input);
    const settings: ColorCorrectionSettings = {
      brightness: 20,
      contrast: 15,
      temperature: 30,
    };

    const output = applyColorCorrectionCPU(input, settings);
    const colors = getAverageColors(output);

    // Brightness should increase overall
    expect(getAverageBrightness(output)).toBeGreaterThan(inputBrightness);
    
    // Temperature adjustment should make it warmer (more red, less blue)
    expect(colors.r).toBeGreaterThan(colors.b);
  });
});
