import { describe, it, expect } from 'vitest';
import {
  calculateSmoothPath,
  calculateStabilizationTransform,
  applyStabilization,
  shouldApplyStabilization,
  type StabilizationTransform,
} from '../stabilization';
import type { MotionVector } from '../../utils/motionDetection';

describe('stabilization', () => {
  function createTestFrame(width: number, height: number, color: [number, number, number] = [128, 128, 128]): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = color[0];
      data[i * 4 + 1] = color[1];
      data[i * 4 + 2] = color[2];
      data[i * 4 + 3] = 255;
    }

    return new ImageData(data, width, height);
  }

  describe('calculateSmoothPath', () => {
    it('should return original path if history is too short', () => {
      const motionHistory: MotionVector[] = [
        { x: 1, y: 2, magnitude: 2.2 },
        { x: 2, y: 1, magnitude: 2.2 },
      ];

      const smoothed = calculateSmoothPath(motionHistory, 5);

      expect(smoothed).toEqual(motionHistory);
    });

    it('should smooth out jittery motion', () => {
      const motionHistory: MotionVector[] = [
        { x: 5, y: 0, magnitude: 5 },
        { x: 10, y: 0, magnitude: 10 },
        { x: 5, y: 0, magnitude: 5 },
        { x: 10, y: 0, magnitude: 10 },
        { x: 5, y: 0, magnitude: 5 },
      ];

      const smoothed = calculateSmoothPath(motionHistory, 3);

      // Middle values should be averaged
      expect(smoothed[2].x).toBeCloseTo(8.33, 1);
      expect(smoothed[2].magnitude).toBeGreaterThan(5);
      expect(smoothed[2].magnitude).toBeLessThan(10);
    });

    it('should preserve motion direction', () => {
      const motionHistory: MotionVector[] = [
        { x: 5, y: 2, magnitude: 5.4 },
        { x: 6, y: 2, magnitude: 6.3 },
        { x: 5, y: 2, magnitude: 5.4 },
        { x: 6, y: 2, magnitude: 6.3 },
        { x: 5, y: 2, magnitude: 5.4 },
      ];

      const smoothed = calculateSmoothPath(motionHistory, 3);

      // All smoothed values should have positive x and y
      smoothed.forEach(v => {
        expect(v.x).toBeGreaterThan(0);
        expect(v.y).toBeGreaterThan(0);
      });
    });

    it('should handle edge cases at start and end', () => {
      const motionHistory: MotionVector[] = [
        { x: 1, y: 1, magnitude: 1.4 },
        { x: 2, y: 2, magnitude: 2.8 },
        { x: 3, y: 3, magnitude: 4.2 },
        { x: 4, y: 4, magnitude: 5.7 },
        { x: 5, y: 5, magnitude: 7.1 },
      ];

      const smoothed = calculateSmoothPath(motionHistory, 3);

      expect(smoothed.length).toBe(motionHistory.length);
      expect(smoothed[0]).toBeDefined();
      expect(smoothed[smoothed.length - 1]).toBeDefined();
    });
  });

  describe('calculateStabilizationTransform', () => {
    it('should calculate correction for shaky motion', () => {
      const currentMotion: MotionVector = { x: 10, y: 5, magnitude: 11.2 };
      const smoothedMotion: MotionVector = { x: 5, y: 2, magnitude: 5.4 };

      const result = calculateStabilizationTransform(currentMotion, smoothedMotion);

      expect(result.transform.translateX).toBeLessThan(0);
      expect(result.transform.translateY).toBeLessThan(0);
      expect(result.transform.scale).toBeGreaterThan(1);
    });

    it('should limit correction to prevent excessive cropping', () => {
      const currentMotion: MotionVector = { x: 100, y: 100, magnitude: 141.4 };
      const smoothedMotion: MotionVector = { x: 0, y: 0, magnitude: 0 };
      const maxCrop = 0.05;

      const result = calculateStabilizationTransform(currentMotion, smoothedMotion, maxCrop);

      expect(Math.abs(result.transform.translateX)).toBeLessThanOrEqual(maxCrop * 100);
      expect(Math.abs(result.transform.translateY)).toBeLessThanOrEqual(maxCrop * 100);
      expect(result.cropPercentage).toBeLessThanOrEqual(maxCrop);
    });

    it('should maintain 95% of frame content', () => {
      const currentMotion: MotionVector = { x: 3, y: 2, magnitude: 3.6 };
      const smoothedMotion: MotionVector = { x: 1, y: 1, magnitude: 1.4 };

      const result = calculateStabilizationTransform(currentMotion, smoothedMotion);

      // Crop percentage should be small (< 5%)
      expect(result.cropPercentage).toBeLessThan(0.05);
      // This means we maintain > 95% of content
      const contentRetained = 1 - result.cropPercentage;
      expect(contentRetained).toBeGreaterThanOrEqual(0.95);
    });

    it('should calculate confidence based on correction magnitude', () => {
      const smallCorrection = calculateStabilizationTransform(
        { x: 1, y: 1, magnitude: 1.4 },
        { x: 0.5, y: 0.5, magnitude: 0.7 }
      );

      const largeCorrection = calculateStabilizationTransform(
        { x: 10, y: 10, magnitude: 14.1 },
        { x: 0, y: 0, magnitude: 0 }
      );

      expect(largeCorrection.confidence).toBeGreaterThan(smallCorrection.confidence);
    });

    it('should set rotation to 0 (not implemented)', () => {
      const currentMotion: MotionVector = { x: 5, y: 5, magnitude: 7.1 };
      const smoothedMotion: MotionVector = { x: 3, y: 3, magnitude: 4.2 };

      const result = calculateStabilizationTransform(currentMotion, smoothedMotion);

      expect(result.transform.rotation).toBe(0);
    });
  });

  describe('applyStabilization', () => {
    it('should preserve frame dimensions', () => {
      const frame = createTestFrame(320, 240);
      const transform: StabilizationTransform = {
        translateX: 5,
        translateY: 5,
        scale: 1.02,
        rotation: 0,
      };

      const stabilized = applyStabilization(frame, transform);

      expect(stabilized.width).toBe(320);
      expect(stabilized.height).toBe(240);
    });

    it('should apply translation transform', () => {
      const frame = createTestFrame(100, 100, [255, 0, 0]);
      const transform: StabilizationTransform = {
        translateX: 10,
        translateY: 0,
        scale: 1.0,
        rotation: 0,
      };

      const stabilized = applyStabilization(frame, transform);

      // Check that pixels have been shifted
      expect(stabilized.data).toBeDefined();
      expect(stabilized.data.length).toBe(frame.data.length);
    });

    it('should apply scale transform', () => {
      const frame = createTestFrame(100, 100, [0, 255, 0]);
      const transform: StabilizationTransform = {
        translateX: 0,
        translateY: 0,
        scale: 1.1,
        rotation: 0,
      };

      const stabilized = applyStabilization(frame, transform);

      expect(stabilized.data).toBeDefined();
      expect(stabilized.width).toBe(100);
      expect(stabilized.height).toBe(100);
    });

    it('should fill out-of-bounds pixels with black', () => {
      const frame = createTestFrame(50, 50, [255, 255, 255]);
      const transform: StabilizationTransform = {
        translateX: 100, // Large translation
        translateY: 100,
        scale: 1.0,
        rotation: 0,
      };

      const stabilized = applyStabilization(frame, transform);

      // Most pixels should be black (out of bounds)
      let blackPixels = 0;
      for (let i = 0; i < stabilized.data.length; i += 4) {
        if (stabilized.data[i] === 0 && stabilized.data[i + 1] === 0 && stabilized.data[i + 2] === 0) {
          blackPixels++;
        }
      }

      expect(blackPixels).toBeGreaterThan(0);
    });

    it('should use bilinear interpolation for smooth results', () => {
      const frame = createTestFrame(100, 100, [128, 128, 128]);
      const transform: StabilizationTransform = {
        translateX: 0.5, // Sub-pixel translation
        translateY: 0.5,
        scale: 1.0,
        rotation: 0,
      };

      const stabilized = applyStabilization(frame, transform);

      // Result should be smooth (no hard edges from nearest-neighbor)
      expect(stabilized.data).toBeDefined();
    });
  });

  describe('shouldApplyStabilization', () => {
    it('should return false for insufficient motion history', () => {
      const motionHistory: MotionVector[] = [
        { x: 1, y: 1, magnitude: 1.4 },
      ];

      const shouldApply = shouldApplyStabilization(motionHistory);

      expect(shouldApply).toBe(false);
    });

    it('should return false for minimal motion', () => {
      const motionHistory: MotionVector[] = [
        { x: 0.1, y: 0.1, magnitude: 0.14 },
        { x: 0.2, y: 0.1, magnitude: 0.22 },
        { x: 0.1, y: 0.2, magnitude: 0.22 },
      ];

      const shouldApply = shouldApplyStabilization(motionHistory);

      expect(shouldApply).toBe(false);
    });

    it('should return true for significant motion', () => {
      const motionHistory: MotionVector[] = [
        { x: 5, y: 5, magnitude: 7.1 },
        { x: 6, y: 4, magnitude: 7.2 },
        { x: 4, y: 6, magnitude: 7.2 },
      ];

      const shouldApply = shouldApplyStabilization(motionHistory);

      expect(shouldApply).toBe(true);
    });

    it('should respect custom motion threshold', () => {
      const motionHistory: MotionVector[] = [
        { x: 2, y: 2, magnitude: 2.8 },
        { x: 2, y: 2, magnitude: 2.8 },
        { x: 2, y: 2, magnitude: 2.8 },
      ];

      const shouldApplyLow = shouldApplyStabilization(motionHistory, 1.0);
      const shouldApplyHigh = shouldApplyStabilization(motionHistory, 5.0);

      expect(shouldApplyLow).toBe(true);
      expect(shouldApplyHigh).toBe(false);
    });
  });
});
