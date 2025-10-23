import { describe, it, expect, beforeEach } from 'vitest';
import { FrameProcessor, type FrameProcessingSettings } from '../FrameProcessor';
import type { FrameData, ProcessingContext } from '../../types';

describe('FrameProcessor', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let processingContext: ProcessingContext;

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 320;
    mockCanvas.height = 240;
    mockContext = mockCanvas.getContext('2d')!;

    processingContext = {
      canvas: mockCanvas,
      ctx: mockContext,
      useGPU: false,
      gl: null,
    };
  });

  function createTestFrame(width: number, height: number, color: [number, number, number] = [128, 128, 128]): FrameData {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = color[0];
      data[i * 4 + 1] = color[1];
      data[i * 4 + 2] = color[2];
      data[i * 4 + 3] = 255;
    }

    return {
      imageData: new ImageData(data, width, height),
      timestamp: 0,
      index: 0,
    };
  }

  describe('constructor', () => {
    it('should create FrameProcessor with CPU mode', () => {
      const processor = new FrameProcessor(processingContext);

      expect(processor).toBeDefined();
      expect(processor.isUsingGPU()).toBe(false);
    });

    it('should initialize in CPU mode when GPU is not available', () => {
      const processor = new FrameProcessor({
        ...processingContext,
        useGPU: true,
        gl: null,
      });

      expect(processor.isUsingGPU()).toBe(false);
    });
  });

  describe('processFrame', () => {
    it('should process frame without modifications when no settings provided', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100, [128, 128, 128]);
      const settings: FrameProcessingSettings = {};

      const result = processor.processFrame(frame, settings);

      expect(result.processedFrame).toBeDefined();
      expect(result.processedFrame.imageData.width).toBe(100);
      expect(result.processedFrame.imageData.height).toBe(100);
      expect(result.appliedEnhancements).toHaveLength(0);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should not modify original frame data', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100, [128, 128, 128]);
      const originalData = new Uint8ClampedArray(frame.imageData.data);

      const settings: FrameProcessingSettings = {
        colorCorrection: {
          brightness: 0.2,
          contrast: 0.1,
          saturation: 0,
          whiteBalance: 0,
        },
      };

      processor.processFrame(frame, settings);

      // Original frame should be unchanged
      expect(frame.imageData.data).toEqual(originalData);
    });

    it('should apply color correction when settings provided', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100, [50, 50, 50]);

      const settings: FrameProcessingSettings = {
        colorCorrection: {
          brightness: 0.2,
          contrast: 0,
          saturation: 0,
          whiteBalance: 0,
        },
      };

      const result = processor.processFrame(frame, settings);

      expect(result.appliedEnhancements).toContain('color-correction');
      expect(result.processedFrame.imageData.data[0]).toBeGreaterThan(0);
    });

    it('should track processing time', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const result = processor.processFrame(frame, {});

      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.processingTimeMs).toBeLessThan(1000);
    });

    it('should preserve frame metadata', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);
      frame.timestamp = 1.5;
      frame.index = 42;

      const result = processor.processFrame(frame, {});

      expect(result.processedFrame.timestamp).toBe(1.5);
      expect(result.processedFrame.index).toBe(42);
    });
  });

  describe('processFrameWithStabilization', () => {
    it('should process frame with stabilization', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const settings: FrameProcessingSettings = {
        applyStabilization: true,
      };

      const stabilizationResult = {
        stabilized: true,
        transform: {
          dx: 5,
          dy: 5,
          rotation: 0,
          scale: 1.02,
        },
        cropPercentage: 0.02,
        confidence: 0.8,
      };

      const result = processor.processFrameWithStabilization(
        frame,
        settings,
        stabilizationResult
      );

      expect(result.appliedEnhancements).toContain('stabilization');
    });

    it('should apply both stabilization and color correction', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const settings: FrameProcessingSettings = {
        applyStabilization: true,
        colorCorrection: {
          brightness: 0.1,
          contrast: 0.1,
          saturation: 0,
          whiteBalance: 0,
        },
      };

      const stabilizationResult = {
        stabilized: true,
        transform: {
          dx: 2,
          dy: 2,
          rotation: 0,
          scale: 1.01,
        },
        cropPercentage: 0.01,
        confidence: 0.5,
      };

      const result = processor.processFrameWithStabilization(
        frame,
        settings,
        stabilizationResult
      );

      expect(result.appliedEnhancements).toContain('stabilization');
      expect(result.appliedEnhancements).toContain('color-correction');
      expect(result.appliedEnhancements).toHaveLength(2);
    });

    it('should skip stabilization when not enabled', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const settings: FrameProcessingSettings = {
        applyStabilization: false,
      };

      const stabilizationResult = {
        stabilized: true,
        transform: {
          dx: 5,
          dy: 5,
          rotation: 0,
          scale: 1.02,
        },
        cropPercentage: 0.02,
        confidence: 0.8,
      };

      const result = processor.processFrameWithStabilization(
        frame,
        settings,
        stabilizationResult
      );

      expect(result.appliedEnhancements).not.toContain('stabilization');
    });

    it('should skip stabilization when result indicates not stabilized', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const settings: FrameProcessingSettings = {
        applyStabilization: true,
      };

      const stabilizationResult = {
        stabilized: false,
        transform: {
          dx: 0,
          dy: 0,
          rotation: 0,
          scale: 1.0,
        },
        cropPercentage: 0,
        confidence: 0,
      };

      const result = processor.processFrameWithStabilization(
        frame,
        settings,
        stabilizationResult
      );

      expect(result.appliedEnhancements).not.toContain('stabilization');
    });
  });

  describe('applyStabilizationTransform', () => {
    it('should return original frame when not stabilized', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const stabilizationResult = {
        stabilized: false,
        transform: {
          dx: 0,
          dy: 0,
          rotation: 0,
          scale: 1.0,
        },
        cropPercentage: 0,
        confidence: 0,
      };

      const result = processor.applyStabilizationTransform(frame, stabilizationResult);

      expect(result).toBe(frame);
    });

    it('should preserve frame dimensions after stabilization', () => {
      const processor = new FrameProcessor(processingContext);
      const frame = createTestFrame(100, 100);

      const stabilizationResult = {
        stabilized: true,
        transform: {
          dx: 5,
          dy: 5,
          rotation: 0,
          scale: 1.02,
        },
        cropPercentage: 0.02,
        confidence: 0.8,
      };

      const result = processor.applyStabilizationTransform(frame, stabilizationResult);

      expect(result.imageData.width).toBe(100);
      expect(result.imageData.height).toBe(100);
    });
  });

  describe('GPU mode control', () => {
    it('should report GPU usage status', () => {
      const processor = new FrameProcessor(processingContext);

      expect(processor.isUsingGPU()).toBe(false);
    });

    it('should allow forcing CPU mode', () => {
      const processor = new FrameProcessor(processingContext);

      processor.forceCPUMode();

      expect(processor.isUsingGPU()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      const processor = new FrameProcessor(processingContext);

      expect(() => processor.dispose()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      const processor = new FrameProcessor(processingContext);

      processor.dispose();
      expect(() => processor.dispose()).not.toThrow();
    });
  });
});
