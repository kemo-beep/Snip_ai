import { describe, it, expect } from 'vitest';
import {
  applyContrastCPU,
  calculateOptimalContrast,
  autoAdjustContrast,
} from '../contrastEnhance';

/**
 * Helper function to create test ImageData
 */
function createTestImageData(
  width: number,
  height: number,
  fillColor?: { r: number; g: number; b: number; a: number }
): ImageData {
  const imageData = new ImageData(width, height);
  
  if (fillColor) {
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = fillColor.r;
      imageData.data[i + 1] = fillColor.g;
      imageData.data[i + 2] = fillColor.b;
      imageData.data[i + 3] = fillColor.a;
    }
  }
  
  return imageData;
}

/**
 * Helper to calculate contrast (standard deviation of brightness)
 */
function getContrast(imageData: ImageData): number {
  const data = imageData.data;
  const pixelCount = data.length / 4;
  const brightnesses: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnesses.push(brightness);
  }

  const mean = brightnesses.reduce((sum, val) => sum + val, 0) / pixelCount;
  const variance = brightnesses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixelCount;
  const stdDev = Math.sqrt(variance);

  return Math.min(100, (stdDev / 64) * 100);
}

describe('contrastEnhance', () => {
  describe('applyContrastCPU', () => {
    it('should increase contrast with positive adjustment', () => {
      const imageData = createTestImageData(10, 10);
      // Create image with some variation
      for (let i = 0; i < imageData.data.length; i += 4) {
        const value = (i / 4) % 2 === 0 ? 100 : 150;
        imageData.data[i] = value;
        imageData.data[i + 1] = value;
        imageData.data[i + 2] = value;
        imageData.data[i + 3] = 255;
      }
      
      const originalContrast = getContrast(imageData);
      const adjusted = applyContrastCPU(imageData, 30);
      const newContrast = getContrast(adjusted);
      
      expect(newContrast).toBeGreaterThan(originalContrast);
    });

    it('should decrease contrast with negative adjustment', () => {
      const imageData = createTestImageData(10, 10);
      // Create high contrast image
      for (let i = 0; i < imageData.data.length; i += 4) {
        const value = (i / 4) % 2 === 0 ? 50 : 200;
        imageData.data[i] = value;
        imageData.data[i + 1] = value;
        imageData.data[i + 2] = value;
        imageData.data[i + 3] = 255;
      }
      
      const originalContrast = getContrast(imageData);
      const adjusted = applyContrastCPU(imageData, -30);
      const newContrast = getContrast(adjusted);
      
      expect(newContrast).toBeLessThan(originalContrast);
    });

    it('should not change contrast with zero adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const originalData = new Uint8ClampedArray(imageData.data);
      
      applyContrastCPU(imageData, 0);
      
      // Values should be very close (allowing for minor floating point differences)
      for (let i = 0; i < imageData.data.length; i += 4) {
        expect(Math.abs(imageData.data[i] - originalData[i])).toBeLessThan(2);
        expect(Math.abs(imageData.data[i + 1] - originalData[i + 1])).toBeLessThan(2);
        expect(Math.abs(imageData.data[i + 2] - originalData[i + 2])).toBeLessThan(2);
      }
    });

    it('should clamp values to 0-255 range', () => {
      const imageData = createTestImageData(10, 10);
      // Create extreme values
      for (let i = 0; i < imageData.data.length; i += 4) {
        const value = (i / 4) % 2 === 0 ? 0 : 255;
        imageData.data[i] = value;
        imageData.data[i + 1] = value;
        imageData.data[i + 2] = value;
        imageData.data[i + 3] = 255;
      }
      
      const adjusted = applyContrastCPU(imageData, 100);
      
      // Check that no values exceed valid range
      for (let i = 0; i < adjusted.data.length; i += 4) {
        expect(adjusted.data[i]).toBeGreaterThanOrEqual(0);
        expect(adjusted.data[i]).toBeLessThanOrEqual(255);
        expect(adjusted.data[i + 1]).toBeGreaterThanOrEqual(0);
        expect(adjusted.data[i + 1]).toBeLessThanOrEqual(255);
        expect(adjusted.data[i + 2]).toBeGreaterThanOrEqual(0);
        expect(adjusted.data[i + 2]).toBeLessThanOrEqual(255);
      }
    });

    it('should preserve alpha channel', () => {
      const imageData = createTestImageData(10, 10, { r: 100, g: 100, b: 100, a: 200 });
      
      const adjusted = applyContrastCPU(imageData, 50);
      
      // Check that alpha values remain unchanged
      for (let i = 3; i < adjusted.data.length; i += 4) {
        expect(adjusted.data[i]).toBe(200);
      }
    });

    it('should preserve image dimensions', () => {
      const imageData = createTestImageData(1920, 1080, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjusted = applyContrastCPU(imageData, 30);
      
      expect(adjusted.width).toBe(1920);
      expect(adjusted.height).toBe(1080);
    });
  });

  describe('calculateOptimalContrast', () => {
    it('should return positive adjustment for low contrast images', () => {
      const lowContrastImage = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjustment = calculateOptimalContrast(lowContrastImage, 50);
      
      expect(adjustment).toBeGreaterThan(0);
    });

    it('should return negative adjustment for high contrast images', () => {
      const highContrastImage = createTestImageData(10, 10);
      // Create very high contrast
      for (let i = 0; i < highContrastImage.data.length / 2; i += 4) {
        highContrastImage.data[i] = 0;
        highContrastImage.data[i + 1] = 0;
        highContrastImage.data[i + 2] = 0;
        highContrastImage.data[i + 3] = 255;
      }
      for (let i = highContrastImage.data.length / 2; i < highContrastImage.data.length; i += 4) {
        highContrastImage.data[i] = 255;
        highContrastImage.data[i + 1] = 255;
        highContrastImage.data[i + 2] = 255;
        highContrastImage.data[i + 3] = 255;
      }
      
      const adjustment = calculateOptimalContrast(highContrastImage, 50);
      
      expect(adjustment).toBeLessThan(0);
    });

    it('should clamp adjustment to -100 to 100 range', () => {
      const veryLowContrast = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const veryHighContrast = createTestImageData(10, 10);
      
      // Create extreme contrast
      for (let i = 0; i < veryHighContrast.data.length / 2; i += 4) {
        veryHighContrast.data[i] = 0;
        veryHighContrast.data[i + 1] = 0;
        veryHighContrast.data[i + 2] = 0;
        veryHighContrast.data[i + 3] = 255;
      }
      for (let i = veryHighContrast.data.length / 2; i < veryHighContrast.data.length; i += 4) {
        veryHighContrast.data[i] = 255;
        veryHighContrast.data[i + 1] = 255;
        veryHighContrast.data[i + 2] = 255;
        veryHighContrast.data[i + 3] = 255;
      }
      
      const lowAdjustment = calculateOptimalContrast(veryLowContrast, 50);
      const highAdjustment = calculateOptimalContrast(veryHighContrast, 50);
      
      expect(lowAdjustment).toBeGreaterThanOrEqual(-100);
      expect(lowAdjustment).toBeLessThanOrEqual(100);
      expect(highAdjustment).toBeGreaterThanOrEqual(-100);
      expect(highAdjustment).toBeLessThanOrEqual(100);
    });

    it('should respect custom target contrast', () => {
      const image = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjustment1 = calculateOptimalContrast(image, 70);
      const adjustment2 = calculateOptimalContrast(image, 30);
      
      expect(adjustment1).toBeGreaterThan(adjustment2);
    });
  });

  describe('autoAdjustContrast', () => {
    it('should increase contrast for low contrast images', () => {
      const lowContrastImage = createTestImageData(10, 10);
      // Create low contrast
      for (let i = 0; i < lowContrastImage.data.length; i += 4) {
        const value = 120 + ((i / 4) % 10);
        lowContrastImage.data[i] = value;
        lowContrastImage.data[i + 1] = value;
        lowContrastImage.data[i + 2] = value;
        lowContrastImage.data[i + 3] = 255;
      }
      
      const originalContrast = getContrast(lowContrastImage);
      const adjusted = autoAdjustContrast(lowContrastImage, 50);
      const newContrast = getContrast(adjusted);
      
      expect(newContrast).toBeGreaterThan(originalContrast);
    });

    it('should preserve image dimensions', () => {
      const image = createTestImageData(640, 480, { r: 100, g: 100, b: 100, a: 255 });
      
      const adjusted = autoAdjustContrast(image);
      
      expect(adjusted.width).toBe(640);
      expect(adjusted.height).toBe(480);
    });
  });
});
