import { describe, it, expect } from 'vitest';
import {
  applyWhiteBalanceCPU,
  calculateOptimalWhiteBalance,
  autoAdjustWhiteBalance,
} from '../whiteBalance';

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
 * Helper to calculate average red-blue ratio (color temperature indicator)
 */
function getColorTemperatureRatio(imageData: ImageData): number {
  const data = imageData.data;
  let totalRed = 0;
  let totalBlue = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    totalRed += data[i];
    totalBlue += data[i + 2];
  }

  const avgRed = totalRed / pixelCount;
  const avgBlue = totalBlue / pixelCount;

  return avgRed - avgBlue;
}

describe('whiteBalance', () => {
  describe('applyWhiteBalanceCPU', () => {
    it('should add warmth with positive adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const originalRatio = getColorTemperatureRatio(imageData);
      
      const adjusted = applyWhiteBalanceCPU(imageData, 50);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      // Positive adjustment should increase red and decrease blue (warmer)
      expect(newRatio).toBeGreaterThan(originalRatio);
    });

    it('should add coolness with negative adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const originalRatio = getColorTemperatureRatio(imageData);
      
      const adjusted = applyWhiteBalanceCPU(imageData, -50);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      // Negative adjustment should decrease red and increase blue (cooler)
      expect(newRatio).toBeLessThan(originalRatio);
    });

    it('should not change color temperature with zero adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const originalRatio = getColorTemperatureRatio(imageData);
      
      const adjusted = applyWhiteBalanceCPU(imageData, 0);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      expect(newRatio).toBeCloseTo(originalRatio, 0);
    });

    it('should clamp values to 0-255 range', () => {
      const imageData = createTestImageData(10, 10, { r: 250, g: 128, b: 10, a: 255 });
      
      const adjusted = applyWhiteBalanceCPU(imageData, 100);
      
      // Check that no values exceed 255 or go below 0
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
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 200 });
      
      const adjusted = applyWhiteBalanceCPU(imageData, 50);
      
      // Check that alpha values remain unchanged
      for (let i = 3; i < adjusted.data.length; i += 4) {
        expect(adjusted.data[i]).toBe(200);
      }
    });

    it('should preserve image dimensions', () => {
      const imageData = createTestImageData(1920, 1080, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjusted = applyWhiteBalanceCPU(imageData, 30);
      
      expect(adjusted.width).toBe(1920);
      expect(adjusted.height).toBe(1080);
    });

    it('should increase red channel for warm adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 100, g: 100, b: 100, a: 255 });
      
      const adjusted = applyWhiteBalanceCPU(imageData, 50);
      
      // Red should increase
      expect(adjusted.data[0]).toBeGreaterThan(100);
    });

    it('should increase blue channel for cool adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 100, g: 100, b: 100, a: 255 });
      
      const adjusted = applyWhiteBalanceCPU(imageData, -50);
      
      // Blue should increase
      expect(adjusted.data[2]).toBeGreaterThan(100);
    });
  });

  describe('calculateOptimalWhiteBalance', () => {
    it('should return negative adjustment for warm images', () => {
      // Warm image has more red than blue
      const warmImage = createTestImageData(10, 10, { r: 180, g: 128, b: 80, a: 255 });
      
      const adjustment = calculateOptimalWhiteBalance(warmImage, 0);
      
      // Should suggest cooling down (negative adjustment)
      expect(adjustment).toBeLessThan(0);
    });

    it('should return positive adjustment for cool images', () => {
      // Cool image has more blue than red
      const coolImage = createTestImageData(10, 10, { r: 80, g: 128, b: 180, a: 255 });
      
      const adjustment = calculateOptimalWhiteBalance(coolImage, 0);
      
      // Should suggest warming up (positive adjustment)
      expect(adjustment).toBeGreaterThan(0);
    });

    it('should return near-zero adjustment for neutral images', () => {
      const neutralImage = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjustment = calculateOptimalWhiteBalance(neutralImage, 0);
      
      expect(Math.abs(adjustment)).toBeLessThan(10);
    });

    it('should clamp adjustment to -100 to 100 range', () => {
      const veryWarmImage = createTestImageData(10, 10, { r: 255, g: 128, b: 0, a: 255 });
      const veryCoolImage = createTestImageData(10, 10, { r: 0, g: 128, b: 255, a: 255 });
      
      const warmAdjustment = calculateOptimalWhiteBalance(veryWarmImage, 0);
      const coolAdjustment = calculateOptimalWhiteBalance(veryCoolImage, 0);
      
      expect(warmAdjustment).toBeGreaterThanOrEqual(-100);
      expect(warmAdjustment).toBeLessThanOrEqual(100);
      expect(coolAdjustment).toBeGreaterThanOrEqual(-100);
      expect(coolAdjustment).toBeLessThanOrEqual(100);
    });

    it('should respect custom target temperature', () => {
      const image = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjustment1 = calculateOptimalWhiteBalance(image, 50);
      const adjustment2 = calculateOptimalWhiteBalance(image, -50);
      
      // Targeting warm should give positive adjustment, targeting cool should give negative
      expect(adjustment1).toBeGreaterThan(adjustment2);
    });

    it('should limit correction to avoid overcorrection', () => {
      const extremeImage = createTestImageData(10, 10, { r: 255, g: 128, b: 0, a: 255 });
      
      const adjustment = calculateOptimalWhiteBalance(extremeImage, 0);
      
      // Should not suggest full -100 correction even for extreme case
      expect(Math.abs(adjustment)).toBeLessThan(100);
    });
  });

  describe('autoAdjustWhiteBalance', () => {
    it('should cool down warm images', () => {
      const warmImage = createTestImageData(10, 10, { r: 180, g: 128, b: 80, a: 255 });
      const originalRatio = getColorTemperatureRatio(warmImage);
      
      const adjusted = autoAdjustWhiteBalance(warmImage, 0);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      // Should reduce the red-blue difference (cool down)
      expect(Math.abs(newRatio)).toBeLessThan(Math.abs(originalRatio));
    });

    it('should warm up cool images', () => {
      const coolImage = createTestImageData(10, 10, { r: 80, g: 128, b: 180, a: 255 });
      const originalRatio = getColorTemperatureRatio(coolImage);
      
      const adjusted = autoAdjustWhiteBalance(coolImage, 0);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      // Should reduce the blue-red difference (warm up)
      expect(Math.abs(newRatio)).toBeLessThan(Math.abs(originalRatio));
    });

    it('should move color temperature closer to target', () => {
      const warmImage = createTestImageData(10, 10, { r: 180, g: 128, b: 80, a: 255 });
      const targetTemp = 0;
      
      const adjusted = autoAdjustWhiteBalance(warmImage, targetTemp);
      const originalRatio = getColorTemperatureRatio(warmImage);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      // Should move closer to neutral (0) or stay the same
      expect(Math.abs(newRatio)).toBeLessThanOrEqual(Math.abs(originalRatio));
    });

    it('should preserve image dimensions', () => {
      const image = createTestImageData(640, 480, { r: 180, g: 128, b: 80, a: 255 });
      
      const adjusted = autoAdjustWhiteBalance(image);
      
      expect(adjusted.width).toBe(640);
      expect(adjusted.height).toBe(480);
    });

    it('should handle neutral images without significant changes', () => {
      const neutralImage = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const originalRatio = getColorTemperatureRatio(neutralImage);
      
      const adjusted = autoAdjustWhiteBalance(neutralImage, 0);
      const newRatio = getColorTemperatureRatio(adjusted);
      
      // Should remain close to original for already neutral images
      expect(Math.abs(newRatio - originalRatio)).toBeLessThan(10);
    });

    it('should work with custom target temperatures', () => {
      // Start with a neutral image
      const neutralImage = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      
      // Calculate adjustments for different targets
      const warmAdjustment = calculateOptimalWhiteBalance(neutralImage, 50);
      const coolAdjustment = calculateOptimalWhiteBalance(neutralImage, -50);
      
      // Warm target should suggest positive adjustment, cool target should suggest negative
      expect(warmAdjustment).toBeGreaterThan(0);
      expect(coolAdjustment).toBeLessThan(0);
      expect(warmAdjustment).toBeGreaterThan(coolAdjustment);
    });
  });
});
