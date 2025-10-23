import { createCanvas } from 'canvas';
import '@testing-library/jest-dom';

// Polyfill scrollIntoView for Radix UI components
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = function () {
    // Mock implementation
  };
}

// Polyfill ResizeObserver
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
}

// Polyfill ImageData for Node.js test environment
if (typeof ImageData === 'undefined') {
  global.ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(width: number, height: number);
    constructor(data: Uint8ClampedArray, width: number, height?: number);
    constructor(
      dataOrWidth: Uint8ClampedArray | number,
      widthOrHeight: number,
      height?: number
    ) {
      if (typeof dataOrWidth === 'number') {
        // ImageData(width, height)
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        // ImageData(data, width, height?)
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height ?? dataOrWidth.length / (4 * widthOrHeight);
      }
    }
  } as any;
}

// Polyfill AudioBuffer for Node.js test environment
if (typeof AudioBuffer === 'undefined') {
  global.AudioBuffer = class AudioBuffer {
    sampleRate: number;
    length: number;
    duration: number;
    numberOfChannels: number;
    private channelData: Float32Array[];

    constructor(options: { length: number; numberOfChannels: number; sampleRate: number }) {
      this.length = options.length;
      this.numberOfChannels = options.numberOfChannels;
      this.sampleRate = options.sampleRate;
      this.duration = this.length / this.sampleRate;
      this.channelData = [];

      for (let i = 0; i < this.numberOfChannels; i++) {
        this.channelData.push(new Float32Array(this.length));
      }
    }

    getChannelData(channel: number): Float32Array {
      if (channel < 0 || channel >= this.numberOfChannels) {
        throw new Error('Invalid channel index');
      }
      return this.channelData[channel];
    }

    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void {
      const source = this.getChannelData(channelNumber);
      const start = startInChannel || 0;
      destination.set(source.subarray(start, start + destination.length));
    }

    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void {
      const destination = this.getChannelData(channelNumber);
      const start = startInChannel || 0;
      destination.set(source, start);
    }
  } as any;
}

// Polyfill AudioContext for Node.js test environment
if (typeof AudioContext === 'undefined') {
  global.AudioContext = class AudioContext {
    sampleRate: number;
    currentTime: number = 0;
    destination: any = {};
    state: string = 'running';

    constructor(options?: { sampleRate?: number }) {
      this.sampleRate = options?.sampleRate || 44100;
    }

    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
      return new AudioBuffer({ numberOfChannels, length, sampleRate });
    }

    createBufferSource(): any {
      return {
        buffer: null,
        connect: () => { },
        start: () => { },
        stop: () => { },
      };
    }

    createGain(): any {
      return {
        gain: { value: 1 },
        connect: () => { },
      };
    }

    createBiquadFilter(): any {
      return {
        type: 'lowpass',
        frequency: { value: 350 },
        Q: { value: 1 },
        gain: { value: 0 },
        connect: () => { },
      };
    }

    createDynamicsCompressor(): any {
      return {
        threshold: { value: -24 },
        knee: { value: 30 },
        ratio: { value: 12 },
        attack: { value: 0.003 },
        release: { value: 0.25 },
        connect: () => { },
      };
    }

    close(): Promise<void> {
      return Promise.resolve();
    }

    resume(): Promise<void> {
      return Promise.resolve();
    }

    suspend(): Promise<void> {
      return Promise.resolve();
    }
  } as any;
}

// Polyfill OfflineAudioContext for Node.js test environment
if (typeof OfflineAudioContext === 'undefined') {
  global.OfflineAudioContext = class OfflineAudioContext {
    sampleRate: number;
    length: number;
    numberOfChannels: number;
    currentTime: number = 0;
    destination: any = {};
    state: string = 'running';
    private outputBuffer: AudioBuffer;

    constructor(numberOfChannels: number, length: number, sampleRate: number) {
      this.numberOfChannels = numberOfChannels;
      this.length = length;
      this.sampleRate = sampleRate;
      this.outputBuffer = new AudioBuffer({ numberOfChannels, length, sampleRate });
    }

    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
      return new AudioBuffer({ numberOfChannels, length, sampleRate });
    }

    createBufferSource(): any {
      const self = this;
      return {
        buffer: null,
        connect: () => { },
        start: () => { },
        stop: () => { },
      };
    }

    createGain(): any {
      return {
        gain: { value: 1 },
        connect: () => { },
      };
    }

    createBiquadFilter(): any {
      return {
        type: 'lowpass',
        frequency: { value: 350 },
        Q: { value: 1 },
        gain: { value: 0 },
        connect: () => { },
      };
    }

    createDynamicsCompressor(): any {
      return {
        threshold: { value: -24 },
        knee: { value: 30 },
        ratio: { value: 12 },
        attack: { value: 0.003 },
        release: { value: 0.25 },
        connect: () => { },
      };
    }

    async startRendering(): Promise<AudioBuffer> {
      // Simple mock: return a copy of the source buffer if available
      // In real implementation, this would process the audio graph
      return this.outputBuffer;
    }
  } as any;
}
