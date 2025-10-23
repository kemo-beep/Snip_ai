import { describe, it, expect } from 'vitest';
import {
  normalizeVolume,
  applyAutomaticGainControl,
  normalizePeak,
  normalizeRms,
  calculateVolumeAdjustment,
} from '../volumeNormalize';
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

describe('volumeNormalize', () => {
  describe('normalizeVolume', () => {
    it('should increase volume of quiet audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.1 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const originalPeak = detectPeakVolume(buffer);
      const normalized = normalizeVolume(buffer, {
        targetLevel: 80,
        method: 'peak',
      });
      const normalizedPeak = detectPeakVolume(normalized);

      expect(normalizedPeak).toBeGreaterThan(originalPeak);
    });

    it('should decrease volume of loud audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.95 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const originalPeak = detectPeakVolume(buffer);
      const normalized = normalizeVolume(buffer, {
        targetLevel: 50,
        method: 'peak',
      });
      const normalizedPeak = detectPeakVolume(normalized);

      expect(normalizedPeak).toBeLessThan(originalPeak);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const normalized = normalizeVolume(buffer, {
        targetLevel: 80,
        method: 'peak',
      });

      expect(normalized.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(normalized.length).toBe(buffer.length);
      expect(normalized.sampleRate).toBe(buffer.sampleRate);
    });

    it('should prevent clipping when enabled', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.8 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const normalized = normalizeVolume(buffer, {
        targetLevel: 100,
        method: 'peak',
        preventClipping: true,
      });

      const peak = detectPeakVolume(normalized);
      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const normalized = normalizeVolume(buffer, {
        targetLevel: 80,
        method: 'peak',
      });

      const peak = detectPeakVolume(normalized);
      expect(peak).toBe(0);
    });

    it('should normalize using RMS method', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.2 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const originalRms = calculateAverageVolume(buffer);
      const normalized = normalizeVolume(buffer, {
        targetLevel: 50,
        method: 'rms',
      });
      const normalizedRms = calculateAverageVolume(normalized);

      expect(normalizedRms).toBeGreaterThan(originalRms);
    });

    it('should normalize using peak method', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.3 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const normalized = normalizeVolume(buffer, {
        targetLevel: 80,
        method: 'peak',
      });

      const peak = detectPeakVolume(normalized);
      expect(peak).toBeCloseTo(0.8, 1);
    });
  });

  describe('applyAutomaticGainControl', () => {
    it('should increase volume of quiet audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.1 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const originalRms = calculateAverageVolume(buffer);
      const processed = applyAutomaticGainControl(buffer, 0.3);
      const processedRms = calculateAverageVolume(processed);

      expect(processedRms).toBeGreaterThan(originalRms);
    });

    it('should compress loud peaks', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Mix of quiet and loud samples
        return i % 100 < 50 ? 0.2 : 0.9;
      });

      const processed = applyAutomaticGainControl(buffer, 0.3);
      const peak = detectPeakVolume(processed);

      // Peak should be limited
      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const processed = applyAutomaticGainControl(buffer, 0.3);

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = applyAutomaticGainControl(buffer, 0.3);
      const rms = calculateAverageVolume(processed);

      expect(rms).toBe(0);
    });

    it('should maintain consistent RMS level', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.15 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const targetRms = 0.3;
      const processed = applyAutomaticGainControl(buffer, targetRms);
      const processedRms = calculateAverageVolume(processed);

      // Should be close to target (within 20%)
      expect(processedRms).toBeGreaterThan(targetRms * 0.8);
      expect(processedRms).toBeLessThan(targetRms * 1.2);
    });

    it('should not clip audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const processed = applyAutomaticGainControl(buffer, 0.5);
      const peak = detectPeakVolume(processed);

      expect(peak).toBeLessThanOrEqual(1.0);
    });
  });

  describe('normalizePeak', () => {
    it('should normalize to target peak level', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const targetPeak = 0.95;
      const normalized = normalizePeak(buffer, targetPeak);
      const peak = detectPeakVolume(normalized);

      expect(peak).toBeCloseTo(targetPeak, 1);
    });

    it('should use default target of 0.95', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.3 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const normalized = normalizePeak(buffer);
      const peak = detectPeakVolume(normalized);

      expect(peak).toBeCloseTo(0.95, 1);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const normalized = normalizePeak(buffer);

      expect(normalized.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(normalized.length).toBe(buffer.length);
      expect(normalized.sampleRate).toBe(buffer.sampleRate);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const normalized = normalizePeak(buffer);
      const peak = detectPeakVolume(normalized);

      expect(peak).toBe(0);
    });
  });

  describe('normalizeRms', () => {
    it('should normalize to target RMS level', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.2 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const targetRms = 0.3;
      const normalized = normalizeRms(buffer, targetRms);
      const rms = calculateAverageVolume(normalized);

      expect(rms).toBeCloseTo(targetRms, 1);
    });

    it('should use default target of 0.3', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.1 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const normalized = normalizeRms(buffer);
      const rms = calculateAverageVolume(normalized);

      expect(rms).toBeCloseTo(0.3, 1);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const normalized = normalizeRms(buffer);

      expect(normalized.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(normalized.length).toBe(buffer.length);
      expect(normalized.sampleRate).toBe(buffer.sampleRate);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const normalized = normalizeRms(buffer);
      const rms = calculateAverageVolume(normalized);

      expect(rms).toBe(0);
    });
  });

  describe('calculateVolumeAdjustment', () => {
    it('should return positive value when volume increased', () => {
      const original = createMockAudioBuffer();
      fillAudioBuffer(original, (channel, i) => {
        return 0.2 * Math.sin(2 * Math.PI * 440 * i / original.sampleRate);
      });

      const normalized = normalizeVolume(original, {
        targetLevel: 80,
        method: 'rms',
      });

      const adjustment = calculateVolumeAdjustment(original, normalized);
      expect(adjustment).toBeGreaterThan(0);
    });

    it('should return negative value when volume decreased', () => {
      const original = createMockAudioBuffer();
      fillAudioBuffer(original, (channel, i) => {
        return 0.8 * Math.sin(2 * Math.PI * 440 * i / original.sampleRate);
      });

      const normalized = normalizeVolume(original, {
        targetLevel: 30,
        method: 'rms',
      });

      const adjustment = calculateVolumeAdjustment(original, normalized);
      expect(adjustment).toBeLessThan(0);
    });

    it('should return near zero for identical buffers', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const adjustment = calculateVolumeAdjustment(buffer, buffer);
      expect(Math.abs(adjustment)).toBeLessThan(0.1);
    });

    it('should handle silent audio', () => {
      const buffer1 = createMockAudioBuffer();
      const buffer2 = createMockAudioBuffer();
      fillAudioBuffer(buffer1, () => 0);
      fillAudioBuffer(buffer2, () => 0);

      const adjustment = calculateVolumeAdjustment(buffer1, buffer2);
      expect(isFinite(adjustment)).toBe(true);
    });

    it('should calculate reasonable adjustment values', () => {
      const original = createMockAudioBuffer();
      fillAudioBuffer(original, (channel, i) => {
        return 0.3 * Math.sin(2 * Math.PI * 440 * i / original.sampleRate);
      });

      const normalized = normalizeVolume(original, {
        targetLevel: 60,
        method: 'rms',
      });

      const adjustment = calculateVolumeAdjustment(original, normalized);
      
      // Adjustment should be reasonable (between -20 and +20 dB)
      expect(adjustment).toBeGreaterThan(-20);
      expect(adjustment).toBeLessThan(20);
    });
  });
});
