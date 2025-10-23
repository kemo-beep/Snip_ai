/**
 * Audio Processor
 * Orchestrates all audio enhancements in a unified pipeline
 */

import { analyzeAudio, AudioAnalysisResult } from '../utils/audioAnalysis';
import { applyNoiseReduction, NoiseReductionOptions } from '../enhancements/noiseReduction';
import { normalizeVolume, VolumeNormalizeOptions } from '../enhancements/volumeNormalize';
import { applyVoiceEnhancement, VoiceEnhanceOptions } from '../enhancements/voiceEnhance';
import { applyEchoCancellation, EchoCancelOptions } from '../enhancements/echoCancel';

export interface AudioProcessorConfig {
  enableNoiseReduction: boolean;
  enableVolumeNormalization: boolean;
  enableVoiceEnhancement: boolean;
  enableEchoCancellation: boolean;
}

export interface AudioProcessorSettings {
  noiseReduction: NoiseReductionOptions;
  volumeNormalization: VolumeNormalizeOptions;
  voiceEnhancement: VoiceEnhanceOptions;
  echoCancellation: EchoCancelOptions;
}

export interface AudioProcessingResult {
  processedBuffer: AudioBuffer;
  applied: string[];
  skipped: string[];
  analysis: AudioAnalysisResult;
  processingTime: number;
}

/**
 * AudioProcessor class that orchestrates all audio enhancements
 */
export class AudioProcessor {
  private config: AudioProcessorConfig;
  private settings: AudioProcessorSettings;

  constructor(config: AudioProcessorConfig, settings?: Partial<AudioProcessorSettings>) {
    this.config = config;
    this.settings = {
      noiseReduction: settings?.noiseReduction || { strength: 70, adaptiveThreshold: true },
      volumeNormalization: settings?.volumeNormalization || { targetLevel: 70, method: 'rms', preventClipping: true },
      voiceEnhancement: settings?.voiceEnhancement || { clarity: 60, preserveNaturalness: true },
      echoCancellation: settings?.echoCancellation || { reduction: 60, detectDelay: true },
    };
  }

  /**
   * Analyze audio buffer to determine optimal enhancement settings
   * @param audioBuffer - The audio buffer to analyze
   * @returns Audio analysis results
   */
  analyzeAudio(audioBuffer: AudioBuffer): AudioAnalysisResult {
    return analyzeAudio(audioBuffer);
  }

  /**
   * Apply noise reduction enhancement
   * @param audioBuffer - The audio buffer to process
   * @returns Processed audio buffer
   */
  async applyNoiseReduction(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.config.enableNoiseReduction) {
      return audioBuffer;
    }
    return await applyNoiseReduction(audioBuffer, this.settings.noiseReduction);
  }

  /**
   * Apply volume normalization enhancement
   * @param audioBuffer - The audio buffer to process
   * @returns Processed audio buffer
   */
  applyVolumeNormalization(audioBuffer: AudioBuffer): AudioBuffer {
    if (!this.config.enableVolumeNormalization) {
      return audioBuffer;
    }
    return normalizeVolume(audioBuffer, this.settings.volumeNormalization);
  }

  /**
   * Apply voice enhancement
   * @param audioBuffer - The audio buffer to process
   * @returns Processed audio buffer
   */
  async applyVoiceEnhancement(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.config.enableVoiceEnhancement) {
      return audioBuffer;
    }
    return await applyVoiceEnhancement(audioBuffer, this.settings.voiceEnhancement);
  }

  /**
   * Apply echo cancellation enhancement
   * @param audioBuffer - The audio buffer to process
   * @returns Processed audio buffer
   */
  async applyEchoCancellation(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.config.enableEchoCancellation) {
      return audioBuffer;
    }
    return await applyEchoCancellation(audioBuffer, this.settings.echoCancellation);
  }

  /**
   * Process audio buffer through the complete enhancement pipeline
   * Applies enhancements in optimal order:
   * 1. Noise Reduction (remove unwanted noise first)
   * 2. Echo Cancellation (remove echo/reverb)
   * 3. Voice Enhancement (enhance voice clarity)
   * 4. Volume Normalization (normalize levels last)
   * 
   * @param audioBuffer - The audio buffer to process
   * @param onProgress - Optional progress callback (0-1)
   * @returns Processing result with enhanced audio and metadata
   */
  async processAudio(
    audioBuffer: AudioBuffer,
    onProgress?: (progress: number) => void
  ): Promise<AudioProcessingResult> {
    const startTime = performance.now();
    const applied: string[] = [];
    const skipped: string[] = [];

    // Analyze audio before processing
    const analysis = this.analyzeAudio(audioBuffer);
    onProgress?.(0.1);

    let processedBuffer = audioBuffer;

    // Step 1: Noise Reduction (20% of progress)
    if (this.config.enableNoiseReduction) {
      processedBuffer = await this.applyNoiseReduction(processedBuffer);
      applied.push('Noise Reduction');
      onProgress?.(0.3);
    } else {
      skipped.push('Noise Reduction');
    }

    // Step 2: Echo Cancellation (20% of progress)
    if (this.config.enableEchoCancellation) {
      processedBuffer = await this.applyEchoCancellation(processedBuffer);
      applied.push('Echo Cancellation');
      onProgress?.(0.5);
    } else {
      skipped.push('Echo Cancellation');
    }

    // Step 3: Voice Enhancement (20% of progress)
    if (this.config.enableVoiceEnhancement) {
      processedBuffer = await this.applyVoiceEnhancement(processedBuffer);
      applied.push('Voice Enhancement');
      onProgress?.(0.7);
    } else {
      skipped.push('Voice Enhancement');
    }

    // Step 4: Volume Normalization (20% of progress)
    if (this.config.enableVolumeNormalization) {
      processedBuffer = this.applyVolumeNormalization(processedBuffer);
      applied.push('Volume Normalization');
      onProgress?.(0.9);
    } else {
      skipped.push('Volume Normalization');
    }

    const processingTime = performance.now() - startTime;
    onProgress?.(1.0);

    return {
      processedBuffer,
      applied,
      skipped,
      analysis,
      processingTime,
    };
  }

  /**
   * Update processor configuration
   * @param config - New configuration
   */
  updateConfig(config: Partial<AudioProcessorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update processor settings
   * @param settings - New settings
   */
  updateSettings(settings: Partial<AudioProcessorSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
      noiseReduction: { ...this.settings.noiseReduction, ...settings.noiseReduction },
      volumeNormalization: { ...this.settings.volumeNormalization, ...settings.volumeNormalization },
      voiceEnhancement: { ...this.settings.voiceEnhancement, ...settings.voiceEnhancement },
      echoCancellation: { ...this.settings.echoCancellation, ...settings.echoCancellation },
    };
  }

  /**
   * Get current configuration
   * @returns Current processor configuration
   */
  getConfig(): AudioProcessorConfig {
    return { ...this.config };
  }

  /**
   * Get current settings
   * @returns Current processor settings
   */
  getSettings(): AudioProcessorSettings {
    return {
      noiseReduction: { ...this.settings.noiseReduction },
      volumeNormalization: { ...this.settings.volumeNormalization },
      voiceEnhancement: { ...this.settings.voiceEnhancement },
      echoCancellation: { ...this.settings.echoCancellation },
    };
  }

  /**
   * Create a preset configuration
   * @param presetName - Name of the preset
   * @returns Preset configuration
   */
  static createPreset(presetName: 'minimal' | 'balanced' | 'maximum'): {
    config: AudioProcessorConfig;
    settings: AudioProcessorSettings;
  } {
    const presets = {
      minimal: {
        config: {
          enableNoiseReduction: true,
          enableVolumeNormalization: true,
          enableVoiceEnhancement: false,
          enableEchoCancellation: false,
        },
        settings: {
          noiseReduction: { strength: 50, adaptiveThreshold: true },
          volumeNormalization: { targetLevel: 70, method: 'rms' as const, preventClipping: true },
          voiceEnhancement: { clarity: 0, preserveNaturalness: true },
          echoCancellation: { reduction: 0, detectDelay: false },
        },
      },
      balanced: {
        config: {
          enableNoiseReduction: true,
          enableVolumeNormalization: true,
          enableVoiceEnhancement: true,
          enableEchoCancellation: true,
        },
        settings: {
          noiseReduction: { strength: 60, adaptiveThreshold: true },
          volumeNormalization: { targetLevel: 70, method: 'rms' as const, preventClipping: true },
          voiceEnhancement: { clarity: 50, preserveNaturalness: true },
          echoCancellation: { reduction: 50, detectDelay: true },
        },
      },
      maximum: {
        config: {
          enableNoiseReduction: true,
          enableVolumeNormalization: true,
          enableVoiceEnhancement: true,
          enableEchoCancellation: true,
        },
        settings: {
          noiseReduction: { strength: 80, adaptiveThreshold: true },
          volumeNormalization: { targetLevel: 75, method: 'rms' as const, preventClipping: true },
          voiceEnhancement: { clarity: 70, preserveNaturalness: false },
          echoCancellation: { reduction: 70, detectDelay: true },
        },
      },
    };

    return presets[presetName];
  }
}
