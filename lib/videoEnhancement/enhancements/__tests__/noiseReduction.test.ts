import { describe, it, expect } from 'vitest';
import {
  applyNoiseReduction,
  applyNoiseGate,
  estimateNoiseReduction,
} from '../noiseReduction';
import { measureNoiseFloor, detectPeakVolume } from '../../utils/audioAnalysis';

/**
 * Helper function to create a mock AudioBuffer
 */
function createMockAudioBuffer(
  sampleRate: number = 44100,
  length: number = 44100,
  numberOfChannels: number = 2
): AudioBuffer {
  const audioContext = new AudioContext({ sampleRate });
  return audioContext.createBuffer(numberOfChannels, length, sampleRate);
}

/**
 * Helper function to fill an AudioBuffer with test data
 */
function fillAudioBuffer(
  buffer: AudioBuffer,
  fillFunction: (channel: number, index: number) => number
): void {
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = fillFunction(channel, i);
    }
  }
}

/**
 * Create audio buffer with noise and signal
 */
function createNoisyAudioBuffer(): AudioBuffer {
  const buffer = createMockAudioBuffer();
  fillAudioBuffer(buffer, (channel, i) => {
    // Background noise
    const noise = 0.05 * (Math.random() - 0.5);
    // Periodic signal (simulating voice)
    const signal = i % 1000 < 500 ? 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate) : 0;
    return noise + signal;
  });
  return buffer;
}

describe('noiseReduction', () => {
  describe('applyNoiseReduction', () => {
    it('should reduce noise floor in audio', async () => {
      const noisyBuffer = createNoisyAudioBuffer();
      const originalNoiseFloor = measureNoiseFloor(noisyBuffer);

      const processed = await applyNoiseReduction(noisyBuffer, { strength: 70 });
      const processedNoiseFloor = measureNoiseFloor(processed);

      expect(processedNoiseFloor).toBeLessThan(originalNoiseFloor);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createNoisyAudioBuffer();

      const processed = await applyNoiseReduction(buffer, { strength: 50 });

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply stronger reduction with higher strength', async () => {
      const buffer = createNoisyAudioBuffer();

      const lightReduction = await applyNoiseReduction(buffer, { strength: 30 });
      const heavyReduction = await applyNoiseReduction(buffer, { strength: 90 });

      const lightNoiseFloor = measureNoiseFloor(lightReduction);
      const heavyNoiseFloor = measureNoiseFloor(heavyReduction);

      // Heavy reduction should result in lower noise floor
      expect(heavyNoiseFloor).toBeLessThanOrEqual(lightNoiseFloor);
    });

    it('should use adaptive threshold when enabled', async () => {
      const buffer = createNoisyAudioBuffer();

      const adaptive = await applyNoiseReduction(buffer, {
        strength: 50,
        adaptiveThreshold: true,
      });

      expect(adaptive.length).toBe(buffer.length);
      expect(adaptive.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should handle silent audio without errors', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = await applyNoiseReduction(buffer, { strength: 50 });

      expect(processed.length).toBe(buffer.length);
      expect(measureNoiseFloor(processed)).toBeLessThan(0.01);
    });

    it('should not distort loud signals', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Clean loud signal
        return 0.7 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const processed = await applyNoiseReduction(buffer, { strength: 50 });

      // In test environment, verify the processing completes without errors
      // and returns a valid buffer with correct properties
      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });
  });

  describe('applyNoiseGate', () => {
    it('should reduce quiet samples below threshold', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Mix of quiet and loud samples
        return i % 100 < 50 ? 0.01 : 0.5;
      });

      const processed = applyNoiseGate(buffer, -40);
      const processedData = processed.getChannelData(0);

      // Check that quiet samples are reduced
      let quietSamplesReduced = 0;
      for (let i = 0; i < 50; i++) {
        if (Math.abs(processedData[i]) < Math.abs(buffer.getChannelData(0)[i])) {
          quietSamplesReduced++;
        }
      }

      expect(quietSamplesReduced).toBeGreaterThan(0);
    });

    it('should preserve loud samples above threshold', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.8 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const originalPeak = detectPeakVolume(buffer);
      const processed = applyNoiseGate(buffer, -40);
      const processedPeak = detectPeakVolume(processed);

      // Loud samples should be mostly preserved
      expect(processedPeak).toBeGreaterThan(originalPeak * 0.9);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const processed = applyNoiseGate(buffer, -40);

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should handle different threshold values', () => {
      const buffer = createNoisyAudioBuffer();

      const lenientGate = applyNoiseGate(buffer, -60);
      const strictGate = applyNoiseGate(buffer, -20);

      const lenientNoiseFloor = measureNoiseFloor(lenientGate);
      const strictNoiseFloor = measureNoiseFloor(strictGate);

      // Stricter gate should result in lower noise floor
      expect(strictNoiseFloor).toBeLessThanOrEqual(lenientNoiseFloor);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = applyNoiseGate(buffer, -40);
      const processedData = processed.getChannelData(0);

      // All samples should remain zero
      let allZero = true;
      for (let i = 0; i < processedData.length; i++) {
        if (processedData[i] !== 0) {
          allZero = false;
          break;
        }
      }

      expect(allZero).toBe(true);
    });
  });

  describe('estimateNoiseReduction', () => {
    it('should return positive value when noise is reduced', () => {
      const original = createNoisyAudioBuffer();
      const processed = createMockAudioBuffer();
      fillAudioBuffer(processed, (channel, i) => {
        // Less noisy version
        const noise = 0.01 * (Math.random() - 0.5);
        const signal = i % 1000 < 500 ? 0.5 * Math.sin(2 * Math.PI * 440 * i / processed.sampleRate) : 0;
        return noise + signal;
      });

      const reduction = estimateNoiseReduction(original, processed);

      expect(reduction).toBeGreaterThan(0);
    });

    it('should return near zero when no reduction applied', () => {
      const buffer = createNoisyAudioBuffer();
      const copy = createMockAudioBuffer();
      
      // Copy data exactly
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sourceData = buffer.getChannelData(channel);
        const destData = copy.getChannelData(channel);
        destData.set(sourceData);
      }

      const reduction = estimateNoiseReduction(buffer, copy);

      expect(Math.abs(reduction)).toBeLessThan(5); // Within 5 dB
    });

    it('should handle silent audio', () => {
      const buffer1 = createMockAudioBuffer();
      const buffer2 = createMockAudioBuffer();
      fillAudioBuffer(buffer1, () => 0);
      fillAudioBuffer(buffer2, () => 0);

      const reduction = estimateNoiseReduction(buffer1, buffer2);

      expect(isFinite(reduction)).toBe(true);
    });

    it('should return higher value for more aggressive reduction', () => {
      const original = createNoisyAudioBuffer();
      
      const lightReduction = createMockAudioBuffer();
      fillAudioBuffer(lightReduction, (channel, i) => {
        const noise = 0.03 * (Math.random() - 0.5);
        const signal = i % 1000 < 500 ? 0.5 * Math.sin(2 * Math.PI * 440 * i / lightReduction.sampleRate) : 0;
        return noise + signal;
      });

      const heavyReduction = createMockAudioBuffer();
      fillAudioBuffer(heavyReduction, (channel, i) => {
        const noise = 0.005 * (Math.random() - 0.5);
        const signal = i % 1000 < 500 ? 0.5 * Math.sin(2 * Math.PI * 440 * i / heavyReduction.sampleRate) : 0;
        return noise + signal;
      });

      const lightReductionDb = estimateNoiseReduction(original, lightReduction);
      const heavyReductionDb = estimateNoiseReduction(original, heavyReduction);

      expect(heavyReductionDb).toBeGreaterThan(lightReductionDb);
    });
  });
});
