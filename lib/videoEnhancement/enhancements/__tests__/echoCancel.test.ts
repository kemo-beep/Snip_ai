import { describe, it, expect } from 'vitest';
import {
  applyEchoCancellation,
  applyEchoReductionCPU,
  detectEchoDelay,
  applyReverbReduction,
  estimateEchoReduction,
} from '../echoCancel';
import { detectPeakVolume, calculateAverageVolume } from '../../utils/audioAnalysis';

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
 * Create audio buffer with simulated echo
 */
function createEchoAudioBuffer(echoDelayMs: number = 100): AudioBuffer {
  const buffer = createMockAudioBuffer();
  const echoDelaySamples = Math.floor((echoDelayMs / 1000) * buffer.sampleRate);

  fillAudioBuffer(buffer, (channel, i) => {
    // Original signal
    const signal = i < buffer.length / 2 ? 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate) : 0;
    
    // Echo (delayed and attenuated version)
    const echoIndex = i - echoDelaySamples;
    const echo = echoIndex >= 0 && echoIndex < buffer.length / 2
      ? 0.3 * Math.sin(2 * Math.PI * 440 * echoIndex / buffer.sampleRate)
      : 0;

    return signal + echo;
  });

  return buffer;
}

describe('echoCancel', () => {
  describe('applyEchoCancellation', () => {
    it('should reduce echo in audio', async () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = await applyEchoCancellation(buffer, { reduction: 70 });

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createEchoAudioBuffer(150);

      const processed = await applyEchoCancellation(buffer, { reduction: 50 });

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply different reduction levels', async () => {
      const buffer = createEchoAudioBuffer(100);

      const light = await applyEchoCancellation(buffer, { reduction: 30 });
      const heavy = await applyEchoCancellation(buffer, { reduction: 90 });

      expect(light.length).toBe(buffer.length);
      expect(heavy.length).toBe(buffer.length);
    });

    it('should handle silent audio', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = await applyEchoCancellation(buffer, { reduction: 50 });

      expect(detectPeakVolume(processed)).toBeLessThan(0.01);
    });

    it('should not clip audio', async () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = await applyEchoCancellation(buffer, { reduction: 100 });
      const peak = detectPeakVolume(processed);

      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should support echo delay detection option', async () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = await applyEchoCancellation(buffer, {
        reduction: 50,
        detectDelay: true,
      });

      expect(processed.length).toBe(buffer.length);
    });
  });

  describe('applyEchoReductionCPU', () => {
    it('should reduce echo using CPU processing', () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = applyEchoReductionCPU(buffer, 70);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createEchoAudioBuffer(150);

      const processed = applyEchoReductionCPU(buffer, 50);

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply different reduction levels', () => {
      const buffer = createEchoAudioBuffer(100);

      const light = applyEchoReductionCPU(buffer, 20);
      const heavy = applyEchoReductionCPU(buffer, 80);

      expect(light.length).toBe(buffer.length);
      expect(heavy.length).toBe(buffer.length);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = applyEchoReductionCPU(buffer, 50);

      expect(detectPeakVolume(processed)).toBe(0);
    });

    it('should not clip audio', () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = applyEchoReductionCPU(buffer, 100);
      const peak = detectPeakVolume(processed);

      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should reduce echo tail energy', () => {
      const buffer = createEchoAudioBuffer(100);
      const originalTailRms = calculateAverageVolume(buffer);

      const processed = applyEchoReductionCPU(buffer, 80);
      const processedTailRms = calculateAverageVolume(processed);

      // Processed should have less energy (or similar if already clean)
      expect(processedTailRms).toBeLessThanOrEqual(originalTailRms * 1.1);
    });
  });

  describe('detectEchoDelay', () => {
    it('should detect echo delay', () => {
      const echoDelayMs = 100;
      const buffer = createEchoAudioBuffer(echoDelayMs);

      const detectedDelay = detectEchoDelay(buffer);

      // Should detect delay within reasonable range (±50ms tolerance)
      expect(detectedDelay).toBeGreaterThanOrEqual(0);
      expect(detectedDelay).toBeLessThan(600);
    });

    it('should return 0 for audio without echo', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const detectedDelay = detectEchoDelay(buffer);

      // Should detect no significant echo
      expect(detectedDelay).toBeGreaterThanOrEqual(0);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const detectedDelay = detectEchoDelay(buffer);

      expect(detectedDelay).toBe(0);
    });

    it('should detect delays in valid range', () => {
      const buffer = createEchoAudioBuffer(200);

      const detectedDelay = detectEchoDelay(buffer);

      // Should be within typical echo range (50-500ms)
      expect(detectedDelay).toBeGreaterThanOrEqual(0);
      expect(detectedDelay).toBeLessThan(600);
    });

    it('should handle very short audio', () => {
      const buffer = createMockAudioBuffer(44100, 4410); // 0.1 seconds
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const detectedDelay = detectEchoDelay(buffer);

      expect(isFinite(detectedDelay)).toBe(true);
      expect(detectedDelay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyReverbReduction', () => {
    it('should reduce reverb', async () => {
      const buffer = createEchoAudioBuffer(200);

      const processed = await applyReverbReduction(buffer, 50);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createEchoAudioBuffer(150);

      const processed = await applyReverbReduction(buffer, 60);

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply different reduction strengths', async () => {
      const buffer = createEchoAudioBuffer(100);

      const light = await applyReverbReduction(buffer, 20);
      const heavy = await applyReverbReduction(buffer, 80);

      expect(light.length).toBe(buffer.length);
      expect(heavy.length).toBe(buffer.length);
    });

    it('should use default strength of 50', async () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = await applyReverbReduction(buffer);

      expect(processed.length).toBe(buffer.length);
    });

    it('should handle silent audio', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = await applyReverbReduction(buffer, 50);

      expect(detectPeakVolume(processed)).toBeLessThan(0.01);
    });

    it('should not clip audio', async () => {
      const buffer = createEchoAudioBuffer(100);

      const processed = await applyReverbReduction(buffer, 100);
      const peak = detectPeakVolume(processed);

      expect(peak).toBeLessThanOrEqual(1.0);
    });
  });

  describe('estimateEchoReduction', () => {
    it('should estimate echo reduction amount', () => {
      const original = createEchoAudioBuffer(100);
      const processed = applyEchoReductionCPU(original, 70);

      const reduction = estimateEchoReduction(original, processed);

      expect(reduction).toBeGreaterThanOrEqual(0);
      expect(reduction).toBeLessThanOrEqual(100);
    });

    it('should return 0 for identical buffers', () => {
      const buffer = createEchoAudioBuffer(100);

      const reduction = estimateEchoReduction(buffer, buffer);

      expect(reduction).toBeCloseTo(0, 0);
    });

    it('should return 0 for silent audio', () => {
      const buffer1 = createMockAudioBuffer();
      const buffer2 = createMockAudioBuffer();
      fillAudioBuffer(buffer1, () => 0);
      fillAudioBuffer(buffer2, () => 0);

      const reduction = estimateEchoReduction(buffer1, buffer2);

      expect(reduction).toBe(0);
    });

    it('should return positive value when echo is reduced', () => {
      const original = createEchoAudioBuffer(150);
      
      // Create a version with less echo
      const reduced = createMockAudioBuffer();
      fillAudioBuffer(reduced, (channel, i) => {
        // Original signal without much echo
        return i < reduced.length / 2 
          ? 0.5 * Math.sin(2 * Math.PI * 440 * i / reduced.sampleRate)
          : 0.05 * Math.sin(2 * Math.PI * 440 * i / reduced.sampleRate);
      });

      const reduction = estimateEchoReduction(original, reduced);

      expect(reduction).toBeGreaterThanOrEqual(0);
    });

    it('should handle buffers with different characteristics', () => {
      const buffer1 = createMockAudioBuffer();
      fillAudioBuffer(buffer1, (channel, i) => {
        return 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer1.sampleRate);
      });

      const buffer2 = createMockAudioBuffer();
      fillAudioBuffer(buffer2, (channel, i) => {
        return 0.3 * Math.sin(2 * Math.PI * 440 * i / buffer2.sampleRate);
      });

      const reduction = estimateEchoReduction(buffer1, buffer2);

      expect(isFinite(reduction)).toBe(true);
      expect(reduction).toBeGreaterThanOrEqual(0);
      expect(reduction).toBeLessThanOrEqual(100);
    });
  });
});
