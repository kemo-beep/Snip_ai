import { describe, it, expect, beforeEach } from 'vitest';
import { AudioProcessor } from '../AudioProcessor';
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
 * Create audio buffer simulating voice with noise
 */
function createNoisyVoiceBuffer(): AudioBuffer {
  const buffer = createMockAudioBuffer();
  fillAudioBuffer(buffer, (channel, i) => {
    const voice = 0.3 * Math.sin(2 * Math.PI * 200 * i / buffer.sampleRate);
    const noise = 0.05 * (Math.random() - 0.5);
    return voice + noise;
  });
  return buffer;
}

describe('AudioProcessor', () => {
  let processor: AudioProcessor;

  beforeEach(() => {
    processor = new AudioProcessor({
      enableNoiseReduction: true,
      enableVolumeNormalization: true,
      enableVoiceEnhancement: true,
      enableEchoCancellation: true,
    });
  });

  describe('constructor', () => {
    it('should create processor with default settings', () => {
      const config = processor.getConfig();
      const settings = processor.getSettings();

      expect(config.enableNoiseReduction).toBe(true);
      expect(settings.noiseReduction.strength).toBe(70);
    });

    it('should create processor with custom settings', () => {
      const customProcessor = new AudioProcessor(
        {
          enableNoiseReduction: false,
          enableVolumeNormalization: true,
          enableVoiceEnhancement: false,
          enableEchoCancellation: false,
        },
        {
          noiseReduction: { strength: 50, adaptiveThreshold: false },
        }
      );

      const config = customProcessor.getConfig();
      const settings = customProcessor.getSettings();

      expect(config.enableNoiseReduction).toBe(false);
      expect(settings.noiseReduction.strength).toBe(50);
    });
  });

  describe('analyzeAudio', () => {
    it('should analyze audio buffer', () => {
      const buffer = createNoisyVoiceBuffer();

      const analysis = processor.analyzeAudio(buffer);

      expect(analysis).toHaveProperty('averageVolume');
      expect(analysis).toHaveProperty('peakVolume');
      expect(analysis).toHaveProperty('noiseFloor');
      expect(analysis).toHaveProperty('dynamicRange');
    });

    it('should return valid analysis values', () => {
      const buffer = createNoisyVoiceBuffer();

      const analysis = processor.analyzeAudio(buffer);

      expect(analysis.averageVolume).toBeGreaterThan(0);
      expect(analysis.peakVolume).toBeGreaterThan(0);
      expect(analysis.noiseFloor).toBeGreaterThanOrEqual(0);
      expect(analysis.dynamicRange).toBeGreaterThan(0);
    });
  });

  describe('applyNoiseReduction', () => {
    it('should apply noise reduction when enabled', async () => {
      const buffer = createNoisyVoiceBuffer();

      const processed = await processor.applyNoiseReduction(buffer);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should skip noise reduction when disabled', async () => {
      processor.updateConfig({ enableNoiseReduction: false });
      const buffer = createNoisyVoiceBuffer();

      const processed = await processor.applyNoiseReduction(buffer);

      expect(processed).toBe(buffer);
    });
  });

  describe('applyVolumeNormalization', () => {
    it('should apply volume normalization when enabled', () => {
      const buffer = createNoisyVoiceBuffer();

      const processed = processor.applyVolumeNormalization(buffer);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should skip volume normalization when disabled', () => {
      processor.updateConfig({ enableVolumeNormalization: false });
      const buffer = createNoisyVoiceBuffer();

      const processed = processor.applyVolumeNormalization(buffer);

      expect(processed).toBe(buffer);
    });
  });

  describe('applyVoiceEnhancement', () => {
    it('should apply voice enhancement when enabled', async () => {
      const buffer = createNoisyVoiceBuffer();

      const processed = await processor.applyVoiceEnhancement(buffer);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should skip voice enhancement when disabled', async () => {
      processor.updateConfig({ enableVoiceEnhancement: false });
      const buffer = createNoisyVoiceBuffer();

      const processed = await processor.applyVoiceEnhancement(buffer);

      expect(processed).toBe(buffer);
    });
  });

  describe('applyEchoCancellation', () => {
    it('should apply echo cancellation when enabled', async () => {
      const buffer = createNoisyVoiceBuffer();

      const processed = await processor.applyEchoCancellation(buffer);

      expect(processed.length).toBe(buffer.length);
      expect(processed.numberOfChannels).toBe(buffer.numberOfChannels);
    });

    it('should skip echo cancellation when disabled', async () => {
      processor.updateConfig({ enableEchoCancellation: false });
      const buffer = createNoisyVoiceBuffer();

      const processed = await processor.applyEchoCancellation(buffer);

      expect(processed).toBe(buffer);
    });
  });

  describe('processAudio', () => {
    it('should process audio through complete pipeline', async () => {
      const buffer = createNoisyVoiceBuffer();

      const result = await processor.processAudio(buffer);

      expect(result.processedBuffer.length).toBe(buffer.length);
      expect(result.applied.length).toBeGreaterThan(0);
      expect(result.analysis).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should track applied enhancements', async () => {
      const buffer = createNoisyVoiceBuffer();

      const result = await processor.processAudio(buffer);

      expect(result.applied).toContain('Noise Reduction');
      expect(result.applied).toContain('Volume Normalization');
      expect(result.applied).toContain('Voice Enhancement');
      expect(result.applied).toContain('Echo Cancellation');
    });

    it('should track skipped enhancements', async () => {
      processor.updateConfig({
        enableNoiseReduction: false,
        enableEchoCancellation: false,
      });
      const buffer = createNoisyVoiceBuffer();

      const result = await processor.processAudio(buffer);

      expect(result.skipped).toContain('Noise Reduction');
      expect(result.skipped).toContain('Echo Cancellation');
      expect(result.applied).not.toContain('Noise Reduction');
      expect(result.applied).not.toContain('Echo Cancellation');
    });

    it('should call progress callback', async () => {
      const buffer = createNoisyVoiceBuffer();
      const progressValues: number[] = [];

      await processor.processAudio(buffer, (progress) => {
        progressValues.push(progress);
      });

      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[0]).toBeGreaterThanOrEqual(0);
      expect(progressValues[progressValues.length - 1]).toBe(1.0);
    });

    it('should preserve audio buffer properties', async () => {
      const buffer = createNoisyVoiceBuffer();

      const result = await processor.processAudio(buffer);

      expect(result.processedBuffer.numberOfChannels).toBe(buffer.numberOfChannels);
      expect(result.processedBuffer.length).toBe(buffer.length);
      expect(result.processedBuffer.sampleRate).toBe(buffer.sampleRate);
    });

    it('should handle silent audio', async () => {
      const buffer = createMockAudioBuffer();
      fillAudioBuffer(buffer, () => 0);

      const result = await processor.processAudio(buffer);

      expect(result.processedBuffer.length).toBe(buffer.length);
      expect(detectPeakVolume(result.processedBuffer)).toBeLessThan(0.01);
    });

    it('should not clip audio', async () => {
      const buffer = createNoisyVoiceBuffer();

      const result = await processor.processAudio(buffer);
      const peak = detectPeakVolume(result.processedBuffer);

      expect(peak).toBeLessThanOrEqual(1.0);
    });

    it('should process with all enhancements disabled', async () => {
      processor.updateConfig({
        enableNoiseReduction: false,
        enableVolumeNormalization: false,
        enableVoiceEnhancement: false,
        enableEchoCancellation: false,
      });
      const buffer = createNoisyVoiceBuffer();

      const result = await processor.processAudio(buffer);

      expect(result.applied.length).toBe(0);
      expect(result.skipped.length).toBe(4);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      processor.updateConfig({ enableNoiseReduction: false });

      const config = processor.getConfig();
      expect(config.enableNoiseReduction).toBe(false);
    });

    it('should preserve other config values', () => {
      processor.updateConfig({ enableNoiseReduction: false });

      const config = processor.getConfig();
      expect(config.enableVolumeNormalization).toBe(true);
      expect(config.enableVoiceEnhancement).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      processor.updateSettings({
        noiseReduction: { strength: 90, adaptiveThreshold: false },
      });

      const settings = processor.getSettings();
      expect(settings.noiseReduction.strength).toBe(90);
      expect(settings.noiseReduction.adaptiveThreshold).toBe(false);
    });

    it('should preserve other settings', () => {
      processor.updateSettings({
        noiseReduction: { strength: 90, adaptiveThreshold: false },
      });

      const settings = processor.getSettings();
      expect(settings.volumeNormalization.targetLevel).toBe(70);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = processor.getConfig();

      expect(config).toHaveProperty('enableNoiseReduction');
      expect(config).toHaveProperty('enableVolumeNormalization');
      expect(config).toHaveProperty('enableVoiceEnhancement');
      expect(config).toHaveProperty('enableEchoCancellation');
    });

    it('should return a copy of config', () => {
      const config1 = processor.getConfig();
      config1.enableNoiseReduction = false;

      const config2 = processor.getConfig();
      expect(config2.enableNoiseReduction).toBe(true);
    });
  });

  describe('getSettings', () => {
    it('should return current settings', () => {
      const settings = processor.getSettings();

      expect(settings).toHaveProperty('noiseReduction');
      expect(settings).toHaveProperty('volumeNormalization');
      expect(settings).toHaveProperty('voiceEnhancement');
      expect(settings).toHaveProperty('echoCancellation');
    });

    it('should return a copy of settings', () => {
      const settings1 = processor.getSettings();
      settings1.noiseReduction.strength = 999;

      const settings2 = processor.getSettings();
      expect(settings2.noiseReduction.strength).toBe(70);
    });
  });

  describe('createPreset', () => {
    it('should create minimal preset', () => {
      const preset = AudioProcessor.createPreset('minimal');

      expect(preset.config.enableNoiseReduction).toBe(true);
      expect(preset.config.enableVolumeNormalization).toBe(true);
      expect(preset.config.enableVoiceEnhancement).toBe(false);
      expect(preset.config.enableEchoCancellation).toBe(false);
    });

    it('should create balanced preset', () => {
      const preset = AudioProcessor.createPreset('balanced');

      expect(preset.config.enableNoiseReduction).toBe(true);
      expect(preset.config.enableVolumeNormalization).toBe(true);
      expect(preset.config.enableVoiceEnhancement).toBe(true);
      expect(preset.config.enableEchoCancellation).toBe(true);
    });

    it('should create maximum preset', () => {
      const preset = AudioProcessor.createPreset('maximum');

      expect(preset.config.enableNoiseReduction).toBe(true);
      expect(preset.settings.noiseReduction.strength).toBe(80);
      expect(preset.settings.voiceEnhancement.clarity).toBe(70);
    });

    it('should have different settings for each preset', () => {
      const minimal = AudioProcessor.createPreset('minimal');
      const balanced = AudioProcessor.createPreset('balanced');
      const maximum = AudioProcessor.createPreset('maximum');

      expect(minimal.settings.noiseReduction.strength).toBeLessThan(
        balanced.settings.noiseReduction.strength
      );
      expect(balanced.settings.noiseReduction.strength).toBeLessThan(
        maximum.settings.noiseReduction.strength
      );
    });

    it('should create processor from preset', async () => {
      const preset = AudioProcessor.createPreset('balanced');
      const presetProcessor = new AudioProcessor(preset.config, preset.settings);

      const buffer = createNoisyVoiceBuffer();
      const result = await presetProcessor.processAudio(buffer);

      expect(result.applied.length).toBeGreaterThan(0);
    });
  });
});
