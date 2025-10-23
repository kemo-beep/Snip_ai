/**
 * Voice Enhancement
 * Enhances voice clarity using frequency-based filtering and compression
 */

export interface VoiceEnhanceOptions {
  clarity: number;            // 0-100, amount of voice enhancement
  preserveNaturalness?: boolean; // Keep voice sounding natural
}

/**
 * Apply voice enhancement to audio buffer using Web Audio API
 * @param audioBuffer - The audio buffer to process
 * @param options - Voice enhancement options
 * @returns Processed audio buffer with enhanced voice
 */
export async function applyVoiceEnhancement(
  audioBuffer: AudioBuffer,
  options: VoiceEnhanceOptions
): Promise<AudioBuffer> {
  const { clarity, preserveNaturalness = true } = options;

  // Create offline audio context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source node
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Create band-pass filter for voice frequencies (80Hz - 8kHz)
  const lowpass = offlineContext.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 8000;
  lowpass.Q.value = 0.7;

  const highpass = offlineContext.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;
  highpass.Q.value = 0.7;

  // Create presence boost filter (2-5 kHz range for clarity)
  const presenceBoost = offlineContext.createBiquadFilter();
  presenceBoost.type = 'peaking';
  presenceBoost.frequency.value = 3000;
  presenceBoost.Q.value = 1.0;
  // Boost based on clarity setting, but keep natural if enabled
  const maxBoost = preserveNaturalness ? 6 : 12;
  presenceBoost.gain.value = (clarity / 100) * maxBoost;

  // Create subtle compression for voice consistency
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.knee.value = 20;
  compressor.ratio.value = 3 + (clarity / 100) * 3; // 3:1 to 6:1 ratio
  compressor.attack.value = 0.005;
  compressor.release.value = 0.1;

  // Connect nodes: source -> highpass -> lowpass -> presenceBoost -> compressor -> destination
  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(presenceBoost);
  presenceBoost.connect(compressor);
  compressor.connect(offlineContext.destination);

  // Process audio
  source.start();
  return await offlineContext.startRendering();
}

/**
 * Apply voice clarity enhancement using CPU processing
 * Fallback for when Web Audio API is not available
 * @param audioBuffer - The audio buffer to process
 * @param clarity - Enhancement strength (0-100)
 * @returns Processed audio buffer
 */
export function applyVoiceClarityCPU(
  audioBuffer: AudioBuffer,
  clarity: number
): AudioBuffer {
  const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });
  const processedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const enhancementFactor = 1 + (clarity / 100) * 0.5;

  // Process each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);

    // Simple enhancement: boost mid-range frequencies
    // This is a simplified version - real implementation would use FFT
    for (let i = 0; i < inputData.length; i++) {
      let sample = inputData[i];

      // Apply subtle enhancement
      sample = sample * enhancementFactor;

      // Soft clipping to prevent distortion
      if (Math.abs(sample) > 0.9) {
        const sign = sample > 0 ? 1 : -1;
        sample = sign * (0.9 + (Math.abs(sample) - 0.9) * 0.1);
      }

      outputData[i] = Math.max(-1, Math.min(1, sample));
    }
  }

  return processedBuffer;
}

/**
 * Create a voice-optimized EQ preset
 * @param audioBuffer - The audio buffer to process
 * @returns Processed audio buffer with voice-optimized EQ
 */
export async function applyVoiceEQ(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Remove rumble (below 80Hz)
  const rumbleFilter = offlineContext.createBiquadFilter();
  rumbleFilter.type = 'highpass';
  rumbleFilter.frequency.value = 80;
  rumbleFilter.Q.value = 0.7;

  // Reduce muddiness (200-400Hz)
  const mudFilter = offlineContext.createBiquadFilter();
  mudFilter.type = 'peaking';
  mudFilter.frequency.value = 300;
  mudFilter.Q.value = 1.0;
  mudFilter.gain.value = -3;

  // Boost presence (2-5kHz)
  const presenceFilter = offlineContext.createBiquadFilter();
  presenceFilter.type = 'peaking';
  presenceFilter.frequency.value = 3500;
  presenceFilter.Q.value = 1.0;
  presenceFilter.gain.value = 4;

  // Reduce sibilance (6-8kHz)
  const sibilanceFilter = offlineContext.createBiquadFilter();
  sibilanceFilter.type = 'peaking';
  sibilanceFilter.frequency.value = 7000;
  sibilanceFilter.Q.value = 1.5;
  sibilanceFilter.gain.value = -2;

  // Remove high-frequency noise (above 10kHz)
  const airFilter = offlineContext.createBiquadFilter();
  airFilter.type = 'lowpass';
  airFilter.frequency.value = 10000;
  airFilter.Q.value = 0.7;

  // Connect filters in series
  source.connect(rumbleFilter);
  rumbleFilter.connect(mudFilter);
  mudFilter.connect(presenceFilter);
  presenceFilter.connect(sibilanceFilter);
  sibilanceFilter.connect(airFilter);
  airFilter.connect(offlineContext.destination);

  source.start();
  return await offlineContext.startRendering();
}

/**
 * Apply de-esser to reduce harsh sibilant sounds
 * @param audioBuffer - The audio buffer to process
 * @param strength - De-essing strength (0-100)
 * @returns Processed audio buffer
 */
export async function applyDeEsser(
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

  // Target sibilant frequencies (5-8 kHz)
  const sibilanceDetector = offlineContext.createBiquadFilter();
  sibilanceDetector.type = 'peaking';
  sibilanceDetector.frequency.value = 6500;
  sibilanceDetector.Q.value = 2.0;
  sibilanceDetector.gain.value = -(strength / 100) * 6;

  source.connect(sibilanceDetector);
  sibilanceDetector.connect(offlineContext.destination);

  source.start();
  return await offlineContext.startRendering();
}
