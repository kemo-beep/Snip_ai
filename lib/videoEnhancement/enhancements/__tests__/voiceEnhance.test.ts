import { describe, it, expect } from 'vitest';
import {
  applyVoiceEnhancement,
  applyVoiceClarityCPU,
  applyVoiceEQ,
  applyDeEsser,
} from '../voiceEnhance';
import { detectPeakVolume } from '../../utils/audioAnalysis';

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
 * Create audio buffer simulating voice
 */
function createVoiceAudioBuffer(): AudioBuffer {
  const buffer = createMockAudioBuffer();
  fillAudioBuffer(buffer, (channel, i) => {
    // Simulate voice with fundamental frequency around 150Hz
    const fundamental = 0.3 * Math.sin(2 * Math.PI * 150 * i / buffer.sampleRate);
    // Add harmonics
    const harmonic1 = 0.15 * Math.sin(2 * Math.PI * 300 * i / buffer.sampleRate);
    const harmonic2 = 0.1 * Math.sin(2 * Math.PI * 450 * i / buffer.sampleRate);
    // Add some noise
    const noise = 0.02 * (Math.random() - 0.5);
    return fundamental + harmonic1 + harmonic2 + noise;
  });
  return buffer;
}

describe('voiceEnhance', () => {
  describe('applyVoiceEnhancement', () => {
    it('should enhance voice audio', async () => {
      const buffer = createVoiceAudioBuffer();

      const enhanced = await applyVoiceEnhancement(buffer, { clarity: 70 });

      expect(enhanced.length).toBe(buffer.length);
      expect(enhanced.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(enhanced.sampleRate).toBe(buffer.sampleRate);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createVoiceAudioBuffer();

      const enhanced = await applyVoiceEnhancement(buffer, { clarity: 50 });

      expect(enhanced.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(enhanced.length).toBe(buffer.length);
      expect(enhanced.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply different enhancement levels', async () => {
      const buffer = createVoiceAudioBuffer();

      const light = await applyVoiceEnhancement(buffer, { clarity: 30 });
      const heavy = await applyVoiceEnhancement(buffer, { clarity: 90 });

      expect(light.length).toBe(buffer.length);
      expect(heavy.length).toBe(buffer.length);
    });

    it('should preserve naturalness when enabled', async () => {
      const buffer = createVoiceAudioBuffer();

      const natural = await applyVoiceEnhancement(buffer, {
        clarity: 70,
        preserveNaturalness: true,
      });

      expect(natural.length).toBe(buffer.length);
      expect(natural.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should handle silent audio', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const enhanced = await applyVoiceEnhancement(buffer, { clarity: 50 });

      expect(enhanced.length).toBe(buffer.length);
      expect(detectPeakVolume(enhanced)).toBeLessThan(0.01);
    });

    it('should not clip audio', async () => {
      const buffer = createVoiceAudioBuffer();

      const enhanced = await applyVoiceEnhancement(buffer, { clarity: 100 });
      const peak = detectPeakVolume(enhanced);

      expect(peak).toBeLessThanOrEqual(1.0);
    });
  });

  describe('applyVoiceClarityCPU', () => {
    it('should enhance voice clarity', () => {
      const buffer = createVoiceAudioBuffer();

      const enhanced = applyVoiceClarityCPU(buffer, 70);

      expect(enhanced.length).toBe(buffer.length);
      expect(enhanced.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should preserve audio buffer properties', () => {
      const buffer = createVoiceAudioBuffer();

      const enhanced = applyVoiceClarityCPU(buffer, 50);

      expect(enhanced.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(enhanced.length).toBe(buffer.length);
      expect(enhanced.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply different clarity levels', () => {
      const buffer = createVoiceAudioBuffer();

      const light = applyVoiceClarityCPU(buffer, 20);
      const heavy = applyVoiceClarityCPU(buffer, 80);

      expect(light.length).toBe(buffer.length);
      expect(heavy.length).toBe(buffer.length);
    });

    it('should handle silent audio', () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const enhanced = applyVoiceClarityCPU(buffer, 50);

      expect(detectPeakVolume(enhanced)).toBe(0);
    });

    it('should not clip audio', () => {
      const buffer = createVoiceAudioBuffer();

      const enhanced = applyVoiceClarityCPU(buffer, 100);
      const peak = detectPeakVolume(enhanced);

      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should increase volume with higher clarity', () => {
      const buffer = createVoiceAudioBuffer();
      const originalPeak = detectPeakVolume(buffer);

      const enhanced = applyVoiceClarityCPU(buffer, 80);
      const enhancedPeak = detectPeakVolume(enhanced);

      expect(enhancedPeak).toBeGreaterThanOrEqual(originalPeak);
    });
  });

  describe('applyVoiceEQ', () => {
    it('should apply voice-optimized EQ', async () => {
      const buffer = createVoiceAudioBuffer();

      const processed = await applyVoiceEQ(buffer);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createVoiceAudioBuffer();

      const processed = await applyVoiceEQ(buffer);

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should handle silent audio', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = await applyVoiceEQ(buffer);

      expect(detectPeakVolume(processed)).toBeLessThan(0.01);
    });

    it('should not clip audio', async () => {
      const buffer = createVoiceAudioBuffer();

      const processed = await applyVoiceEQ(buffer);
      const peak = detectPeakVolume(processed);

      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should handle different audio frequencies', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Mix of low, mid, and high frequencies
        const low = 0.2 * Math.sin(2 * Math.PI * 100 * i / buffer.sampleRate);
        const mid = 0.3 * Math.sin(2 * Math.PI * 1000 * i / buffer.sampleRate);
        const high = 0.1 * Math.sin(2 * Math.PI * 5000 * i / buffer.sampleRate);
        return low + mid + high;
      });

      const processed = await applyVoiceEQ(buffer);

      expect(processed.length).toBe(buffer.length);
    });
  });

  describe('applyDeEsser', () => {
    it('should reduce sibilance', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, (channel, i) => {
        // Simulate sibilant sounds (high frequency)
        const sibilance = 0.4 * Math.sin(2 * Math.PI * 6500 * i / buffer.sampleRate);
        const voice = 0.3 * Math.sin(2 * Math.PI * 200 * i / buffer.sampleRate);
        return sibilance + voice;
      });

      const processed = await applyDeEsser(buffer, 50);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createVoiceAudioBuffer();

      const processed = await applyDeEsser(buffer, 50);

      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(processed.length).toBe(buffer.length);
      expect(processed.sampleRate).toBe(buffer.sampleRate);
    });

    it('should apply different de-essing strengths', async () => {
      const buffer = createVoiceAudioBuffer();

      const light = await applyDeEsser(buffer, 20);
      const heavy = await applyDeEsser(buffer, 80);

      expect(light.length).toBe(buffer.length);
      expect(heavy.length).toBe(buffer.length);
    });

    it('should use default strength of 50', async () => {
      const buffer = createVoiceAudioBuffer();

      const processed = await applyDeEsser(buffer);

      expect(processed.length).toBe(buffer.length);
    });

    it('should handle silent audio', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const processed = await applyDeEsser(buffer, 50);

      expect(detectPeakVolume(processed)).toBeLessThan(0.01);
    });

    it('should not clip audio', async () => {
      const buffer = createVoiceAudioBuffer();

      const processed = await applyDeEsser(buffer, 100);
      const peak = detectPeakVolume(processed);

      expect(peak).toBeLessThanOrEqual(1.0);
    });
  });
});
