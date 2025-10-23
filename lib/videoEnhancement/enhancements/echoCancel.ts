/**
 * Echo Cancellation Enhancement
 * Reduces echo and reverb in audio recordings
 */

export interface EchoCancelOptions {
  reduction: number;          // 0-100, amount of echo reduction
  detectDelay?: boolean;      // Automatically detect echo delay
}

/**
 * Apply echo cancellation to audio buffer using Web Audio API
 * @param audioBuffer - The audio buffer to process
 * @param options - Echo cancellation options
 * @returns Processed audio buffer with reduced echo
 */
export async function applyEchoCancellation(
  audioBuffer: AudioBuffer,
  options: EchoCancelOptions
): Promise<AudioBuffer> {
  const { reduction } = options;

  // Create offline audio context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source node
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Create reverb reduction using dynamics compressor
  // This helps reduce the tail of echoes
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -40;
  compressor.knee.value = 30;
  compressor.ratio.value = 4 + (reduction / 100) * 8; // 4:1 to 12:1
  compressor.attack.value = 0.001;
  compressor.release.value = 0.05 + (reduction / 100) * 0.15; // Faster release for more reduction

  // Create high-pass filter to reduce low-frequency reverb
  const highpass = offlineContext.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 100 + (reduction / 100) * 100; // 100-200 Hz
  highpass.Q.value = 0.7;

  // Create gate to cut very quiet reverb tail
  const gate = offlineContext.createDynamicsCompressor();
  gate.threshold.value = -50 + (reduction / 100) * 20; // More aggressive with higher reduction
  gate.knee.value = 10;
  gate.ratio.value = 20;
  gate.attack.value = 0;
  gate.release.value = 0.1;

  // Connect nodes: source -> highpass -> compressor -> gate -> destination
  source.connect(highpass);
  highpass.connect(compressor);
  compressor.connect(gate);
  gate.connect(offlineContext.destination);

  // Process audio
  source.start();
  return await offlineContext.startRendering();
}

/**
 * Apply simple echo reduction using CPU processing
 * @param audioBuffer - The audio buffer to process
 * @param reduction - Reduction strength (0-100)
 * @returns Processed audio buffer
 */
export function applyEchoReductionCPU(
  audioBuffer: AudioBuffer,
  reduction: number
): AudioBuffer {
  const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });
  const processedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const reductionFactor = reduction / 100;

  // Process each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);

    // Simple echo reduction: attenuate samples that follow loud samples
    let previousPeak = 0;
    const decayRate = 0.95 - (reductionFactor * 0.2);

    for (let i = 0; i < inputData.length; i++) {
      const sample = inputData[i];
      const amplitude = Math.abs(sample);

      // Track peak decay (simulating echo tail)
      previousPeak *= decayRate;

      // If current sample is much quieter than recent peak, it might be echo
      if (amplitude < previousPeak * 0.3) {
        // Attenuate potential echo
        outputData[i] = sample * (1 - reductionFactor * 0.7);
      } else {
        outputData[i] = sample;
        // Update peak
        if (amplitude > previousPeak) {
          previousPeak = amplitude;
        }
      }
    }
  }

  return processedBuffer;
}

/**
 * Detect echo delay in audio buffer
 * @param audioBuffer - The audio buffer to analyze
 * @returns Estimated echo delay in milliseconds, or 0 if no echo detected
 */
export function detectEchoDelay(audioBuffer: AudioBuffer): number {
  // Simplified echo detection using autocorrelation
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Search for echo in range of 50-500ms
  const minDelaySamples = Math.floor(sampleRate * 0.05); // 50ms
  const maxDelaySamples = Math.floor(sampleRate * 0.5);  // 500ms

  let maxCorrelation = 0;
  let detectedDelay = 0;

  // Sample a portion of the audio for analysis (first 2 seconds)
  const analysisLength = Math.min(sampleRate * 2, channel.length);

  // Calculate autocorrelation for different delays
  for (let delay = minDelaySamples; delay < maxDelaySamples; delay += 10) {
    let correlation = 0;
    let count = 0;

    for (let i = 0; i < analysisLength - delay; i++) {
      correlation += channel[i] * channel[i + delay];
      count++;
    }

    correlation /= count;

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      detectedDelay = delay;
    }
  }

  // Convert samples to milliseconds
  const delayMs = (detectedDelay / sampleRate) * 1000;

  // Only return delay if correlation is significant
  return maxCorrelation > 0.1 ? delayMs : 0;
}

/**
 * Apply reverb reduction
 * Reduces room reverb and echo tail
 * @param audioBuffer - The audio buffer to process
 * @param strength - Reduction strength (0-100)
 * @returns Processed audio buffer
 */
export async function applyReverbReduction(
  audioBuffer: AudioBuffer,
  strength: number = 50
): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Use dynamics processing to reduce reverb tail
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -35;
  compressor.knee.value = 20;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.001;
  compressor.release.value = 0.05;

  // Add gate to cut reverb tail
  const gate = offlineContext.createDynamicsCompressor();
  gate.threshold.value = -45 + (strength / 100) * 15;
  gate.knee.value = 5;
  gate.ratio.value = 20;
  gate.attack.value = 0;
  gate.release.value = 0.08;

  // High-pass filter to reduce low-frequency reverb
  const highpass = offlineContext.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 120;
  highpass.Q.value = 0.7;

  source.connect(highpass);
  highpass.connect(compressor);
  compressor.connect(gate);
  gate.connect(offlineContext.destination);

  source.start();
  return await offlineContext.startRendering();
}

/**
 * Estimate the amount of echo reduction applied
 * @param originalBuffer - Original audio buffer
 * @param processedBuffer - Processed audio buffer
 * @returns Echo reduction estimate (0-100)
 */
export function estimateEchoReduction(
  originalBuffer: AudioBuffer,
  processedBuffer: AudioBuffer
): number {
  // Measure the reduction in reverb tail
  // Compare the decay rate of the audio

  const originalChannel = originalBuffer.getChannelData(0);
  const processedChannel = processedBuffer.getChannelData(0);

  // Analyze the last 20% of the audio (where reverb tail would be)
  const startIndex = Math.floor(originalChannel.length * 0.8);
  const endIndex = originalChannel.length;

  let originalTailEnergy = 0;
  let processedTailEnergy = 0;

  for (let i = startIndex; i < endIndex; i++) {
    originalTailEnergy += originalChannel[i] * originalChannel[i];
    processedTailEnergy += processedChannel[i] * processedChannel[i];
  }

  originalTailEnergy = Math.sqrt(originalTailEnergy / (endIndex - startIndex));
  processedTailEnergy = Math.sqrt(processedTailEnergy / (endIndex - startIndex));

  // Calculate reduction percentage
  if (originalTailEnergy < 0.0001) {
    return 0; // No significant tail to reduce
  }

  const reduction = ((originalTailEnergy - processedTailEnergy) / originalTailEnergy) * 100;
  return Math.max(0, Math.min(100, reduction));
}
