import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAverageVolume,
  detectPeakVolume,
  measureNoiseFloor,
  calculateDynamicRange,
  analyzeAudio,
} from '../audioAnalysis';

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

describe('audioAnalysis', () => {
  describe('calculateAverageVolume', () => {
    it('should return 0 for silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const avgVolume = calculateAverageVolume(buffer);
      expect(avgVolume).toBe(0);
    });

    it('should calculate correct RMS for constant amplitude', () => {
      const buffer = createMockAudioBuffer();
      const amplitude = 0.5;
      fillAudioBuffer(buffer, () => amplitude);

      const avgVolume = calculateAverageVolume(buffer);
      expect(avgVolume).toBeCloseTo(amplitude, 2);
    });

    it('should calculate correct RMS for sine wave', () => {
      const buffer = createMockAudioBuffer();
      const amplitude = 0.8;
      const frequency = 440; // A4 note
      
      fillAudioBuffer(buffer, (channel, i) => {
        return amplitude * Math.sin(2 * Math.PI * frequency * i / buffer.sampleRate);
      });

      const avgVolume = calculateAverageVolume(buffer);
      // RMS of sine wave is amplitude / sqrt(2)
      const expectedRms = amplitude / Math.sqrt(2);
      expect(avgVolume).toBeCloseTo(expectedRms, 2);
    });

    it('should handle multiple channels', () => {
      const buffer = createMockAudioBuffer(44100, 44100, 2);
      fillAudioBuffer(buffer, (channel) => channel === 0 ? 0.5 : 0.3);

      const avgVolume = calculateAverageVolume(buffer);
      // Average of both channels
      const expectedRms = Math.sqrt((0.5 * 0.5 + 0.3 * 0.3) / 2);
      expect(avgVolume).toBeCloseTo(expectedRms, 2);
    });

    it('should cap at 1.0 for very loud audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 2.0); // Clipped audio

      const avgVolume = calculateAverageVolume(buffer);
      expect(avgVolume).toBe(1);
    });
  });

  describe('detectPeakVolume', () => {
    it('should return 0 for silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const peak = detectPeakVolume(buffer);
      expect(peak).toBe(0);
    });

    it('should detect peak in positive values', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return i === 1000 ? 0.8 : 0.1;
      });

      const peak = detectPeakVolume(buffer);
      expect(peak).toBeCloseTo(0.8, 1);
    });

    it('should detect peak in negative values', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return i === 1000 ? -0.9 : 0.1;
      });

      const peak = detectPeakVolume(buffer);
      expect(peak).toBeCloseTo(0.9, 1);
    });

    it('should find peak across all channels', () => {
      const buffer = createMockAudioBuffer(44100, 44100, 2);
      fillAudioBuffer(buffer, (channel, i) => {
        if (channel === 0 && i === 1000) return 0.7;
        if (channel === 1 && i === 2000) return 0.95;
        return 0.1;
      });

      const peak = detectPeakVolume(buffer);
      expect(peak).toBeCloseTo(0.95, 1);
    });

    it('should cap at 1.0 for clipped audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 5.0);

      const peak = detectPeakVolume(buffer);
      expect(peak).toBe(1);
    });
  });

  describe('measureNoiseFloor', () => {
    it('should return near 0 for silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const noiseFloor = measureNoiseFloor(buffer);
      expect(noiseFloor).toBeLessThan(0.01);
    });

    it('should detect low noise floor with quiet background', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // 90% quiet noise, 10% louder signal
        return i % 10 === 0 ? 0.5 : 0.02;
      });

      const noiseFloor = measureNoiseFloor(buffer);
      expect(noiseFloor).toBeLessThan(0.2);
      expect(noiseFloor).toBeGreaterThan(0);
    });

    it('should use custom window size', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.05);

      const noiseFloor = measureNoiseFloor(buffer, 1024);
      expect(noiseFloor).toBeGreaterThan(0);
      expect(noiseFloor).toBeLessThan(0.1);
    });

    it('should handle varying noise levels', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Create sections with different noise levels
        const section = Math.floor(i / 10000);
        return section % 2 === 0 ? 0.01 : 0.3;
      });

      const noiseFloor = measureNoiseFloor(buffer);
      // Should detect the quieter sections
      expect(noiseFloor).toBeLessThan(0.15);
    });
  });

  describe('calculateDynamicRange', () => {
    it('should return high dynamic range for varied audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Quiet background with loud peaks
        return i % 1000 === 0 ? 0.9 : 0.01;
      });

      const dynamicRange = calculateDynamicRange(buffer);
      expect(dynamicRange).toBeGreaterThan(20); // > 20 dB
    });

    it('should return low dynamic range for constant audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0.5);

      const dynamicRange = calculateDynamicRange(buffer);
      expect(dynamicRange).toBeLessThan(5); // < 5 dB
    });

    it('should handle silent audio without errors', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const dynamicRange = calculateDynamicRange(buffer);
      expect(dynamicRange).toBeGreaterThanOrEqual(0);
      expect(isFinite(dynamicRange)).toBe(true);
    });

    it('should calculate reasonable range for typical speech', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Simulate speech with varying amplitude
        const envelope = 0.3 + 0.4 * Math.sin(i / 5000);
        const signal = Math.sin(2 * Math.PI * 200 * i / buffer.sampleRate);
        return envelope * signal;
      });

      const dynamicRange = calculateDynamicRange(buffer);
      expect(dynamicRange).toBeGreaterThan(10);
      expect(dynamicRange).toBeLessThan(60);
    });
  });

  describe('analyzeAudio', () => {
    it('should return complete analysis for audio buffer', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        return 0.5 * Math.sin(2 * Math.PI * 440 * i / buffer.sampleRate);
      });

      const analysis = analyzeAudio(buffer);

      expect(analysis).toHaveProperty('averageVolume');
      expect(analysis).toHaveProperty('peakVolume');
      expect(analysis).toHaveProperty('noiseFloor');
      expect(analysis).toHaveProperty('dynamicRange');

      expect(analysis.averageVolume).toBeGreaterThan(0);
      expect(analysis.peakVolume).toBeGreaterThan(0);
      expect(analysis.noiseFloor).toBeGreaterThanOrEqual(0);
      expect(analysis.dynamicRange).toBeGreaterThan(0);
    });

    it('should show peak > average > noise floor', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Mix of quiet noise and louder signal
        const noise = 0.02 * (Math.random() - 0.5);
        const signal = i % 100 === 0 ? 0.7 : 0;
        return noise + signal;
      });

      const analysis = analyzeAudio(buffer);

      expect(analysis.peakVolume).toBeGreaterThan(analysis.averageVolume);
      expect(analysis.averageVolume).toBeGreaterThan(analysis.noiseFloor);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const analysis = analyzeAudio(buffer);

      expect(analysis.averageVolume).toBe(0);
      expect(analysis.peakVolume).toBe(0);
      expect(analysis.noiseFloor).toBeLessThan(0.01);
      expect(isFinite(analysis.dynamicRange)).toBe(true);
    });
  });
});
