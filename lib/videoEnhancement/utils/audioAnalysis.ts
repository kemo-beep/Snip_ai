/**
 * Audio Analysis Utility
 * Provides functions to analyze AudioBuffer properties for enhancement decisions
 */

export interface AudioAnalysisResult {
  averageVolume: number;      // Average RMS volume (0-1)
  peakVolume: number;          // Peak volume (0-1)
  noiseFloor: number;          // Estimated noise floor (0-1)
  dynamicRange: number;        // Dynamic range in dB
}

/**
 * Calculate the average volume (RMS) of an audio buffer
 * @param audioBuffer - The audio buffer to analyze
 * @returns Average volume level (0-1)
 */
export function calculateAverageVolume(audioBuffer: AudioBuffer): number {
  let sumSquares = 0;
  let sampleCount = 0;

  // Process all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    
    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] * channelData[i];
      sampleCount++;
    }
  }

  // Calculate RMS (Root Mean Square)
  const rms = Math.sqrt(sumSquares / sampleCount);
  return Math.min(1, rms);
}

/**
 * Detect the peak volume in an audio buffer
 * @param audioBuffer - The audio buffer to analyze
 * @returns Peak volume level (0-1)
 */
export function detectPeakVolume(audioBuffer: AudioBuffer): number {
  let peak = 0;

  // Process all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    
    for (let i = 0; i < channelData.length; i++) {
      const absSample = Math.abs(channelData[i]);
      if (absSample > peak) {
        peak = absSample;
      }
    }
  }

  return Math.min(1, peak);
}

/**
 * Measure the noise floor of an audio buffer
 * Uses the lowest 10th percentile of RMS values across small windows
 * @param audioBuffer - The audio buffer to analyze
 * @param windowSize - Size of analysis window in samples (default: 2048)
 * @returns Estimated noise floor level (0-1)
 */
export function measureNoiseFloor(
  audioBuffer: AudioBuffer,
  windowSize: number = 2048
): number {
  const rmsValues: number[] = [];

  // Process all channels
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    
    // Calculate RMS for each window
    for (let i = 0; i < channelData.length; i += windowSize) {
      let sumSquares = 0;
      const windowEnd = Math.min(i + windowSize, channelData.length);
      const actualWindowSize = windowEnd - i;
      
      for (let j = i; j < windowEnd; j++) {
        sumSquares += channelData[j] * channelData[j];
      }
      
      const rms = Math.sqrt(sumSquares / actualWindowSize);
      rmsValues.push(rms);
    }
  }

  // Sort RMS values
  rmsValues.sort((a, b) => a - b);

  // Take the 10th percentile as noise floor estimate
  const percentileIndex = Math.floor(rmsValues.length * 0.1);
  const noiseFloor = rmsValues[percentileIndex] || 0;

  return Math.min(1, noiseFloor);
}

/**
 * Calculate the dynamic range of an audio buffer
 * Dynamic range is the difference between peak and noise floor in dB
 * @param audioBuffer - The audio buffer to analyze
 * @returns Dynamic range in decibels
 */
export function calculateDynamicRange(audioBuffer: AudioBuffer): number {
  const peak = detectPeakVolume(audioBuffer);
  const noiseFloor = measureNoiseFloor(audioBuffer);

  // Avoid log of zero
  const safePeak = Math.max(peak, 0.0001);
  const safeNoiseFloor = Math.max(noiseFloor, 0.0001);

  // Convert to dB
  const peakDb = 20 * Math.log10(safePeak);
  const noiseFloorDb = 20 * Math.log10(safeNoiseFloor);

  return peakDb - noiseFloorDb;
}

/**
 * Perform comprehensive audio analysis
 * @param audioBuffer - The audio buffer to analyze
 * @returns Complete audio analysis results
 */
export function analyzeAudio(audioBuffer: AudioBuffer): AudioAnalysisResult {
  return {
    averageVolume: calculateAverageVolume(audioBuffer),
    peakVolume: detectPeakVolume(audioBuffer),
    noiseFloor: measureNoiseFloor(audioBuffer),
    dynamicRange: calculateDynamicRange(audioBuffer),
  };
}
