/**
 * Volume Normalization Enhancement
 * Normalizes audio volume levels for consistent playback
 */

import { detectPeakVolume, calculateAverageVolume } from '../utils/audioAnalysis';

export interface VolumeNormalizeOptions {
  targetLevel: number;        // 0-100, target volume level
  method: 'peak' | 'rms';     // Normalization method
  preventClipping?: boolean;   // Prevent audio from clipping
}

/**
 * Normalize audio volume to a target level
 * @param audioBuffer - The audio buffer to process
 * @param options - Volume normalization options
 * @returns Processed audio buffer with normalized volume
 */
export function normalizeVolume(
  audioBuffer: AudioBuffer,
  options: VolumeNormalizeOptions
): AudioBuffer {
  const { targetLevel, method, preventClipping = true } = options;

  // Create a new audio context to create a new buffer
  const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });
  const normalizedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Calculate current level based on method
  let currentLevel: number;
  if (method === 'peak') {
    currentLevel = detectPeakVolume(audioBuffer);
  } else {
    currentLevel = calculateAverageVolume(audioBuffer);
  }

  // Avoid division by zero
  if (currentLevel < 0.0001) {
    // Audio is essentially silent, return as-is
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      normalizedBuffer.getChannelData(channel).set(audioBuffer.getChannelData(channel));
    }
    return normalizedBuffer;
  }

  // Calculate gain factor
  const targetLevelNormalized = targetLevel / 100;
  let gainFactor = targetLevelNormalized / currentLevel;

  // Prevent clipping if enabled
  if (preventClipping) {
    const peak = detectPeakVolume(audioBuffer);
    const maxGain = 0.99 / peak; // Leave small headroom
    gainFactor = Math.min(gainFactor, maxGain);
  }

  // Apply gain to all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = normalizedBuffer.getChannelData(channel);

    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] * gainFactor;
    }
  }

  return normalizedBuffer;
}

/**
 * Apply automatic gain control with compression
 * Maintains consistent volume while preserving dynamics
 * @param audioBuffer - The audio buffer to process
 * @param targetRms - Target RMS level (0-1)
 * @returns Processed audio buffer
 */
export function applyAutomaticGainControl(
  audioBuffer: AudioBuffer,
  targetRms: number = 0.3
): AudioBuffer {
  const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });
  const processedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Calculate current RMS
  const currentRms = calculateAverageVolume(audioBuffer);

  if (currentRms < 0.0001) {
    // Silent audio, return as-is
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      processedBuffer.getChannelData(channel).set(audioBuffer.getChannelData(channel));
    }
    return processedBuffer;
  }

  // Calculate base gain
  const baseGain = targetRms / currentRms;

  // Process each channel with dynamic compression
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);

    // Apply gain with soft compression for loud samples
    for (let i = 0; i < inputData.length; i++) {
      let sample = inputData[i] * baseGain;

      // Soft clipping/compression for samples above threshold
      const threshold = 0.7;
      if (Math.abs(sample) > threshold) {
        const sign = sample > 0 ? 1 : -1;
        const excess = Math.abs(sample) - threshold;
        // Soft knee compression
        sample = sign * (threshold + excess * 0.3);
      }

      // Hard limit at ±0.99
      outputData[i] = Math.max(-0.99, Math.min(0.99, sample));
    }
  }

  return processedBuffer;
}

/**
 * Detect and normalize peak volume
 * Ensures audio reaches target peak without clipping
 * @param audioBuffer - The audio buffer to process
 * @param targetPeak - Target peak level (0-1)
 * @returns Processed audio buffer
 */
export function normalizePeak(
  audioBuffer: AudioBuffer,
  targetPeak: number = 0.95
): AudioBuffer {
  return normalizeVolume(audioBuffer, {
    targetLevel: targetPeak * 100,
    method: 'peak',
    preventClipping: true,
  });
}

/**
 * Apply RMS-based volume leveling
 * Maintains consistent perceived loudness
 * @param audioBuffer - The audio buffer to process
 * @param targetRms - Target RMS level (0-1)
 * @returns Processed audio buffer
 */
export function normalizeRms(
  audioBuffer: AudioBuffer,
  targetRms: number = 0.3
): AudioBuffer {
  return normalizeVolume(audioBuffer, {
    targetLevel: targetRms * 100,
    method: 'rms',
    preventClipping: true,
  });
}

/**
 * Calculate the volume adjustment applied
 * @param originalBuffer - Original audio buffer
 * @param normalizedBuffer - Normalized audio buffer
 * @returns Volume adjustment in decibels
 */
export function calculateVolumeAdjustment(
  originalBuffer: AudioBuffer,
  normalizedBuffer: AudioBuffer
): number {
  const originalRms = calculateAverageVolume(originalBuffer);
  const normalizedRms = calculateAverageVolume(normalizedBuffer);

  const originalDb = 20 * Math.log10(Math.max(originalRms, 0.0001));
  const normalizedDb = 20 * Math.log10(Math.max(normalizedRms, 0.0001));

  return normalizedDb - originalDb;
}
