/**
 * Noise Reduction Enhancement
 * Reduces background noise using Web Audio API
 */

import { measureNoiseFloor } from '../utils/audioAnalysis';

export interface NoiseReductionOptions {
  strength: number;           // 0-100, strength of noise reduction
  adaptiveThreshold?: boolean; // Use adaptive threshold based on noise floor
}

/**
 * Apply noise reduction to an audio buffer using Web Audio API
 * @param audioBuffer - The audio buffer to process
 * @param options - Noise reduction options
 * @returns Processed audio buffer with reduced noise
 */
export async function applyNoiseReduction(
  audioBuffer: AudioBuffer,
  options: NoiseReductionOptions
): Promise<AudioBuffer> {
  const { strength, adaptiveThreshold = true } = options;

  // Create offline audio context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source node
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Determine threshold based on noise floor if adaptive
  let threshold = -50 + (strength / 2);
  if (adaptiveThreshold) {
    const noiseFloor = measureNoiseFloor(audioBuffer);
    const noiseFloorDb = 20 * Math.log10(Math.max(noiseFloor, 0.0001));
    // Set threshold slightly above noise floor
    threshold = Math.max(noiseFloorDb + 6, -60);
  }

  // Create noise gate using dynamics compressor
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = threshold;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  // Create high-pass filter to remove low-frequency noise
  const highpass = offlineContext.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80; // Remove frequencies below 80Hz
  highpass.Q.value = 0.7;

  // Create low-pass filter to remove high-frequency noise
  const lowpass = offlineContext.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 8000 - (strength * 30); // Adjust based on strength
  lowpass.Q.value = 0.7;

  // Connect nodes: source -> highpass -> compressor -> lowpass -> destination
  source.connect(highpass);
  highpass.connect(compressor);
  compressor.connect(lowpass);
  lowpass.connect(offlineContext.destination);

  // Process audio
  source.start();
  return await offlineContext.startRendering();
}

/**
 * Apply noise gate to audio buffer
 * Simpler noise reduction that just cuts audio below a threshold
 * @param audioBuffer - The audio buffer to process
 * @param thresholdDb - Threshold in decibels below which audio is cut
 * @returns Processed audio buffer
 */
export function applyNoiseGate(
  audioBuffer: AudioBuffer,
  thresholdDb: number = -40
): AudioBuffer {
  // Create a new audio context to create a new buffer
  const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });
  const processedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const threshold = Math.pow(10, thresholdDb / 20);

  // Process each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);

    for (let i = 0; i < inputData.length; i++) {
      const sample = inputData[i];
      const amplitude = Math.abs(sample);

      // Apply gate: if below threshold, reduce to zero with smooth transition
      if (amplitude < threshold) {
        outputData[i] = sample * (amplitude / threshold) * 0.1;
      } else {
        outputData[i] = sample;
      }
    }
  }

  return processedBuffer;
}

/**
 * Estimate the amount of noise reduction applied
 * @param originalBuffer - Original audio buffer
 * @param processedBuffer - Processed audio buffer
 * @returns Noise reduction amount in decibels
 */
export function estimateNoiseReduction(
  originalBuffer: AudioBuffer,
  processedBuffer: AudioBuffer
): number {
  const originalNoiseFloor = measureNoiseFloor(originalBuffer);
  const processedNoiseFloor = measureNoiseFloor(processedBuffer);

  const originalDb = 20 * Math.log10(Math.max(originalNoiseFloor, 0.0001));
  const processedDb = 20 * Math.log10(Math.max(processedNoiseFloor, 0.0001));

  return originalDb - processedDb;
}
