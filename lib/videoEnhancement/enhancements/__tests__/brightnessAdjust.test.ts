import { describe, it, expect } from 'vitest';
import {
  applyBrightnessCPU,
  calculateOptimalBrightness,
  autoAdjustBrightness,
} from '../brightnessAdjust';

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
 * Helper to calculate average brightness
 */
function getAverageBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let total = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return total / pixelCount;
}

describe('brightnessAdjust', () => {
  describe('applyBrightnessCPU', () => {
    it('should increase brightness with positive adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 100, g: 100, b: 100, a: 255 });
      const originalBrightness = getAverageBrightness(imageData);
      
      const adjusted = applyBrightnessCPU(imageData, 20);
      const newBrightness = getAverageBrightness(adjusted);
      
      expect(newBrightness).toBeGreaterThan(originalBrightness);
    });

    it('should decrease brightness with negative adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 150, g: 150, b: 150, a: 255 });
      const originalBrightness = getAverageBrightness(imageData);
      
      const adjusted = applyBrightnessCPU(imageData, -20);
      const newBrightness = getAverageBrightness(adjusted);
      
      expect(newBrightness).toBeLessThan(originalBrightness);
    });

    it('should not change brightness with zero adjustment', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const originalBrightness = getAverageBrightness(imageData);
      
      const adjusted = applyBrightnessCPU(imageData, 0);
      const newBrightness = getAverageBrightness(adjusted);
      
      expect(newBrightness).toBeCloseTo(originalBrightness, 0);
    });

    it('should clamp values to 0-255 range', () => {
      const imageData = createTestImageData(10, 10, { r: 250, g: 250, b: 250, a: 255 });
      
      const adjusted = applyBrightnessCPU(imageData, 100);
      
      // Check that no values exceed 255
      for (let i = 0; i < adjusted.data.length; i += 4) {
        expect(adjusted.data[i]).toBeLessThanOrEqual(255);
        expect(adjusted.data[i + 1]).toBeLessThanOrEqual(255);
        expect(adjusted.data[i + 2]).toBeLessThanOrEqual(255);
      }
    });

    it('should preserve alpha channel', () => {
      const imageData = createTestImageData(10, 10, { r: 100, g: 100, b: 100, a: 200 });
      
      const adjusted = applyBrightnessCPU(imageData, 50);
      
      // Check that alpha values remain unchanged
      for (let i = 3; i < adjusted.data.length; i += 4) {
        expect(adjusted.data[i]).toBe(200);
      }
    });

    it('should preserve image dimensions', () => {
      const imageData = createTestImageData(1920, 1080, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjusted = applyBrightnessCPU(imageData, 30);
      
      expect(adjusted.width).toBe(1920);
      expect(adjusted.height).toBe(1080);
    });
  });

  describe('calculateOptimalBrightness', () => {
    it('should return positive adjustment for dark images', () => {
      const darkImage = createTestImageData(10, 10, { r: 50, g: 50, b: 50, a: 255 });
      
      const adjustment = calculateOptimalBrightness(darkImage, 128);
      
      expect(adjustment).toBeGreaterThan(0);
    });

    it('should return negative adjustment for bright images', () => {
      const brightImage = createTestImageData(10, 10, { r: 200, g: 200, b: 200, a: 255 });
      
      const adjustment = calculateOptimalBrightness(brightImage, 128);
      
      expect(adjustment).toBeLessThan(0);
    });

    it('should return near-zero adjustment for images at target brightness', () => {
      const targetImage = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      
      const adjustment = calculateOptimalBrightness(targetImage, 128);
      
      expect(Math.abs(adjustment)).toBeLessThan(5);
    });

    it('should clamp adjustment to -100 to 100 range', () => {
      const veryDarkImage = createTestImageData(10, 10, { r: 0, g: 0, b: 0, a: 255 });
      const veryBrightImage = createTestImageData(10, 10, { r: 255, g: 255, b: 255, a: 255 });
      
      const darkAdjustment = calculateOptimalBrightness(veryDarkImage, 128);
      const brightAdjustment = calculateOptimalBrightness(veryBrightImage, 128);
      
      expect(darkAdjustment).toBeGreaterThanOrEqual(-100);
      expect(darkAdjustment).toBeLessThanOrEqual(100);
      expect(brightAdjustment).toBeGreaterThanOrEqual(-100);
      expect(brightAdjustment).toBeLessThanOrEqual(100);
    });

    it('should respect custom target brightness', () => {
      const image = createTestImageData(10, 10, { r: 100, g: 100, b: 100, a: 255 });
      
      const adjustment1 = calculateOptimalBrightness(image, 150);
      const adjustment2 = calculateOptimalBrightness(image, 80);
      
      expect(adjustment1).toBeGreaterThan(adjustment2);
    });
  });

  describe('autoAdjustBrightness', () => {
    it('should brighten dark images', () => {
      const darkImage = createTestImageData(10, 10, { r: 50, g: 50, b: 50, a: 255 });
      const originalBrightness = getAverageBrightness(darkImage);
      
      const adjusted = autoAdjustBrightness(darkImage, 128);
      const newBrightness = getAverageBrightness(adjusted);
      
      expect(newBrightness).toBeGreaterThan(originalBrightness);
    });

    it('should darken bright images', () => {
      const brightImage = createTestImageData(10, 10, { r: 200, g: 200, b: 200, a: 255 });
      const originalBrightness = getAverageBrightness(brightImage);
      
      const adjusted = autoAdjustBrightness(brightImage, 128);
      const newBrightness = getAverageBrightness(adjusted);
      
      expect(newBrightness).toBeLessThan(originalBrightness);
    });

    it('should move brightness closer to target', () => {
      const image = createTestImageData(10, 10, { r: 50, g: 50, b: 50, a: 255 });
      const targetBrightness = 150;
      
      const adjusted = autoAdjustBrightness(image, targetBrightness);
      const newBrightness = getAverageBrightness(adjusted);
      const originalBrightness = getAverageBrightness(image);
      
      const originalDistance = Math.abs(targetBrightness - originalBrightness);
      const newDistance = Math.abs(targetBrightness - newBrightness);
      
      // Should move closer or stay the same if already optimal
      expect(newDistance).toBeLessThanOrEqual(originalDistance);
    });

    it('should preserve image dimensions', () => {
      const image = createTestImageData(640, 480, { r: 100, g: 100, b: 100, a: 255 });
      
      const adjusted = autoAdjustBrightness(image);
      
      expect(adjusted.width).toBe(640);
      expect(adjusted.height).toBe(480);
    });
  });
});
