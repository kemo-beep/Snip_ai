import { describe, it, expect } from 'vitest';
import {
  calculateAverageBrightness,
  calculateContrast,
  detectColorTemperature,
  identifyDominantColors,
  analyzeFrame,
} from '../colorAnalysis';

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

describe('colorAnalysis', () => {
  describe('calculateAverageBrightness', () => {
    it('should return 0 for completely black image', () => {
      const imageData = createTestImageData(10, 10, { r: 0, g: 0, b: 0, a: 255 });
      const brightness = calculateAverageBrightness(imageData);
      expect(brightness).toBe(0);
    });

    it('should return 255 for completely white image', () => {
      const imageData = createTestImageData(10, 10, { r: 255, g: 255, b: 255, a: 255 });
      const brightness = calculateAverageBrightness(imageData);
      expect(brightness).toBe(255);
    });

    it('should calculate correct brightness for gray image', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const brightness = calculateAverageBrightness(imageData);
      expect(brightness).toBeCloseTo(128, 1);
    });

    it('should use luminance formula for RGB values', () => {
      // Pure red should have lower perceived brightness than pure green
      const redImage = createTestImageData(10, 10, { r: 255, g: 0, b: 0, a: 255 });
      const greenImage = createTestImageData(10, 10, { r: 0, g: 255, b: 0, a: 255 });
      
      const redBrightness = calculateAverageBrightness(redImage);
      const greenBrightness = calculateAverageBrightness(greenImage);
      
      expect(greenBrightness).toBeGreaterThan(redBrightness);
    });
  });

  describe('calculateContrast', () => {
    it('should return 0 for uniform color image', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const contrast = calculateContrast(imageData);
      expect(contrast).toBe(0);
    });

    it('should return high contrast for black and white image', () => {
      const imageData = createTestImageData(10, 10);
      // Fill half with black, half with white
      for (let i = 0; i < imageData.data.length / 2; i += 4) {
        imageData.data[i] = 0;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = 255;
      }
      for (let i = imageData.data.length / 2; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 255;
        imageData.data[i + 2] = 255;
        imageData.data[i + 3] = 255;
      }
      
      const contrast = calculateContrast(imageData);
      expect(contrast).toBeGreaterThan(50);
    });

    it('should return value between 0 and 100', () => {
      const imageData = createTestImageData(10, 10);
      // Create random pixel values
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.random() * 255;
        imageData.data[i + 1] = Math.random() * 255;
        imageData.data[i + 2] = Math.random() * 255;
        imageData.data[i + 3] = 255;
      }
      
      const contrast = calculateContrast(imageData);
      expect(contrast).toBeGreaterThanOrEqual(0);
      expect(contrast).toBeLessThanOrEqual(100);
    });
  });

  describe('detectColorTemperature', () => {
    it('should return positive value for warm (red) image', () => {
      const imageData = createTestImageData(10, 10, { r: 255, g: 128, b: 50, a: 255 });
      const temperature = detectColorTemperature(imageData);
      expect(temperature).toBeGreaterThan(0);
    });

    it('should return negative value for cool (blue) image', () => {
      const imageData = createTestImageData(10, 10, { r: 50, g: 128, b: 255, a: 255 });
      const temperature = detectColorTemperature(imageData);
      expect(temperature).toBeLessThan(0);
    });

    it('should return near-zero for neutral gray image', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const temperature = detectColorTemperature(imageData);
      expect(Math.abs(temperature)).toBeLessThan(10);
    });

    it('should return value between -100 and 100', () => {
      const imageData = createTestImageData(10, 10, { r: 255, g: 0, b: 0, a: 255 });
      const temperature = detectColorTemperature(imageData);
      expect(temperature).toBeGreaterThanOrEqual(-100);
      expect(temperature).toBeLessThanOrEqual(100);
    });
  });

  describe('identifyDominantColors', () => {
    it('should return single color for uniform image', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 64, b: 192, a: 255 });
      const colors = identifyDominantColors(imageData, 5);
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should return requested number of colors', () => {
      const imageData = createTestImageData(20, 20);
      // Create image with multiple colors
      for (let i = 0; i < imageData.data.length; i += 4) {
        const section = Math.floor(i / (imageData.data.length / 3));
        if (section === 0) {
          imageData.data[i] = 255;
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
        } else if (section === 1) {
          imageData.data[i] = 0;
          imageData.data[i + 1] = 255;
          imageData.data[i + 2] = 0;
        } else {
          imageData.data[i] = 0;
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 255;
        }
        imageData.data[i + 3] = 255;
      }
      
      const colors = identifyDominantColors(imageData, 3);
      expect(colors.length).toBeLessThanOrEqual(3);
    });

    it('should return valid hex color codes', () => {
      const imageData = createTestImageData(10, 10, { r: 255, g: 128, b: 64, a: 255 });
      const colors = identifyDominantColors(imageData);
      
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('analyzeFrame', () => {
    it('should return complete analysis result', () => {
      const imageData = createTestImageData(10, 10, { r: 128, g: 128, b: 128, a: 255 });
      const result = analyzeFrame(imageData);
      
      expect(result).toHaveProperty('averageBrightness');
      expect(result).toHaveProperty('contrast');
      expect(result).toHaveProperty('colorTemperature');
      expect(result).toHaveProperty('dominantColors');
      expect(Array.isArray(result.dominantColors)).toBe(true);
    });

    it('should return consistent results for same image', () => {
      const imageData = createTestImageData(10, 10, { r: 200, g: 150, b: 100, a: 255 });
      const result1 = analyzeFrame(imageData);
      const result2 = analyzeFrame(imageData);
      
      expect(result1.averageBrightness).toBe(result2.averageBrightness);
      expect(result1.contrast).toBe(result2.contrast);
      expect(result1.colorTemperature).toBe(result2.colorTemperature);
    });

    it('should handle different image sizes', () => {
      const smallImage = createTestImageData(5, 5, { r: 128, g: 128, b: 128, a: 255 });
      const largeImage = createTestImageData(100, 100, { r: 128, g: 128, b: 128, a: 255 });
      
      const smallResult = analyzeFrame(smallImage);
      const largeResult = analyzeFrame(largeImage);
      
      // Results should be similar for same color regardless of size
      expect(Math.abs(smallResult.averageBrightness - largeResult.averageBrightness)).toBeLessThan(1);
    });
  });
});
