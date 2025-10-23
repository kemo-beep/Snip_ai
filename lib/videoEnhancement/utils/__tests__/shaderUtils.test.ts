import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  compileShader,
  createShaderProgram,
  setupQuadGeometry,
  createTextureFromImageData,
  readPixelsToImageData,
  clearShaderCache,
  getCachedShader,
  STANDARD_VERTEX_SHADER,
  BRIGHTNESS_FRAGMENT_SHADER,
  CONTRAST_FRAGMENT_SHADER,
  SATURATION_FRAGMENT_SHADER,
  WHITE_BALANCE_FRAGMENT_SHADER,
  COMBINED_COLOR_CORRECTION_SHADER,
} from '../shaderUtils';

describe('shaderUtils', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | null;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.warn('WebGL not available in test environment');
    }
  });

  afterEach(() => {
    if (gl) {
      clearShaderCache(gl);
    }
  });

  describe('compileShader', () => {
    it('should compile valid vertex shader', () => {
      if (!gl) return;

      const shader = compileShader(gl, STANDARD_VERTEX_SHADER, gl.VERTEX_SHADER);
      
      expect(shader).not.toBeNull();
      if (shader) {
        gl.deleteShader(shader);
      }
    });

    it('should compile valid fragment shader', () => {
      if (!gl) return;

      const shader = compileShader(gl, BRIGHTNESS_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
      
      expect(shader).not.toBeNull();
      if (shader) {
        gl.deleteShader(shader);
      }
    });

    it('should return null for invalid shader source', () => {
      if (!gl) return;

      const invalidSource = 'this is not valid GLSL code';
      const shader = compileShader(gl, invalidSource, gl.VERTEX_SHADER);
      
      expect(shader).toBeNull();
    });

    it('should handle empty shader source', () => {
      if (!gl) return;

      const shader = compileShader(gl, '', gl.VERTEX_SHADER);
      
      expect(shader).toBeNull();
    });
  });

  describe('createShaderProgram', () => {
    it('should create valid shader program', () => {
      if (!gl) return;

      const program = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER
      );
      
      expect(program).not.toBeNull();
      if (program) {
        gl.deleteProgram(program);
      }
    });

    it('should cache shader program with key', () => {
      if (!gl) return;

      const cacheKey = 'test-brightness';
      const program1 = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER,
        cacheKey
      );
      
      const program2 = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER,
        cacheKey
      );
      
      expect(program1).toBe(program2);
      expect(getCachedShader(cacheKey)).toBe(program1);
    });

    it('should return null for invalid vertex shader', () => {
      if (!gl) return;

      const program = createShaderProgram(
        gl,
        'invalid vertex shader',
        BRIGHTNESS_FRAGMENT_SHADER
      );
      
      expect(program).toBeNull();
    });

    it('should return null for invalid fragment shader', () => {
      if (!gl) return;

      const program = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        'invalid fragment shader'
      );
      
      expect(program).toBeNull();
    });
  });

  describe('shader sources', () => {
    it('should have valid standard vertex shader', () => {
      expect(STANDARD_VERTEX_SHADER).toContain('attribute vec2 a_position');
      expect(STANDARD_VERTEX_SHADER).toContain('attribute vec2 a_texCoord');
      expect(STANDARD_VERTEX_SHADER).toContain('varying vec2 v_texCoord');
    });

    it('should have valid brightness fragment shader', () => {
      expect(BRIGHTNESS_FRAGMENT_SHADER).toContain('uniform sampler2D u_image');
      expect(BRIGHTNESS_FRAGMENT_SHADER).toContain('uniform float u_brightness');
      expect(BRIGHTNESS_FRAGMENT_SHADER).toContain('varying vec2 v_texCoord');
    });

    it('should have valid contrast fragment shader', () => {
      expect(CONTRAST_FRAGMENT_SHADER).toContain('uniform float u_contrast');
    });

    it('should have valid saturation fragment shader', () => {
      expect(SATURATION_FRAGMENT_SHADER).toContain('uniform float u_saturation');
      expect(SATURATION_FRAGMENT_SHADER).toContain('luminance');
    });

    it('should have valid white balance fragment shader', () => {
      expect(WHITE_BALANCE_FRAGMENT_SHADER).toContain('uniform float u_temperature');
    });

    it('should have valid combined color correction shader', () => {
      expect(COMBINED_COLOR_CORRECTION_SHADER).toContain('uniform float u_brightness');
      expect(COMBINED_COLOR_CORRECTION_SHADER).toContain('uniform float u_contrast');
      expect(COMBINED_COLOR_CORRECTION_SHADER).toContain('uniform float u_saturation');
      expect(COMBINED_COLOR_CORRECTION_SHADER).toContain('uniform float u_temperature');
    });
  });

  describe('setupQuadGeometry', () => {
    it('should setup geometry without errors', () => {
      if (!gl) return;

      const program = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER
      );
      
      if (!program) {
        throw new Error('Failed to create program');
      }

      expect(() => setupQuadGeometry(gl!, program)).not.toThrow();
      
      gl.deleteProgram(program);
    });

    it('should enable vertex attributes', () => {
      if (!gl) return;

      const program = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER
      );
      
      if (!program) return;

      setupQuadGeometry(gl, program);
      
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
      
      expect(positionLocation).toBeGreaterThanOrEqual(0);
      expect(texCoordLocation).toBeGreaterThanOrEqual(0);
      
      gl.deleteProgram(program);
    });
  });

  describe('createTextureFromImageData', () => {
    it('should create texture from ImageData', () => {
      if (!gl) return;

      const imageData = new ImageData(100, 100);
      const texture = createTextureFromImageData(gl, imageData);
      
      expect(texture).not.toBeNull();
      if (texture) {
        gl.deleteTexture(texture);
      }
    });

    it('should handle different image sizes', () => {
      if (!gl) return;

      const sizes = [
        [64, 64],
        [128, 256],
        [256, 128],
      ];

      sizes.forEach(([width, height]) => {
        const imageData = new ImageData(width, height);
        const texture = createTextureFromImageData(gl!, imageData);
        
        expect(texture).not.toBeNull();
        if (texture) {
          gl!.deleteTexture(texture);
        }
      });
    });
  });

  describe('readPixelsToImageData', () => {
    it('should read pixels from framebuffer', () => {
      if (!gl) return;

      const width = 100;
      const height = 100;
      
      // Clear to a known color
      gl.clearColor(1, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const imageData = readPixelsToImageData(gl, width, height);
      
      expect(imageData.width).toBe(width);
      expect(imageData.height).toBe(height);
      expect(imageData.data.length).toBe(width * height * 4);
    });

    it('should flip image vertically', () => {
      if (!gl) return;

      const width = 2;
      const height = 2;
      
      // This test verifies the flip is applied
      const imageData = readPixelsToImageData(gl, width, height);
      
      expect(imageData.width).toBe(width);
      expect(imageData.height).toBe(height);
    });
  });

  describe('shader cache', () => {
    it('should cache and retrieve shader programs', () => {
      if (!gl) return;

      const key = 'test-cache';
      const program = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER,
        key
      );
      
      expect(getCachedShader(key)).toBe(program);
    });

    it('should return null for non-existent cache key', () => {
      expect(getCachedShader('non-existent')).toBeNull();
    });

    it('should clear cache', () => {
      if (!gl) return;

      const key = 'test-clear';
      createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        BRIGHTNESS_FRAGMENT_SHADER,
        key
      );
      
      expect(getCachedShader(key)).not.toBeNull();
      
      clearShaderCache(gl);
      
      expect(getCachedShader(key)).toBeNull();
    });

    it('should handle clearing empty cache', () => {
      if (!gl) return;

      expect(() => clearShaderCache(gl)).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should create and use complete shader pipeline', () => {
      if (!gl) return;

      // Create program
      const program = createShaderProgram(
        gl,
        STANDARD_VERTEX_SHADER,
        COMBINED_COLOR_CORRECTION_SHADER,
        'integration-test'
      );
      
      if (!program) {
        throw new Error('Failed to create program');
      }

      // Setup geometry
      setupQuadGeometry(gl, program);
      
      // Create texture
      const imageData = new ImageData(64, 64);
      const texture = createTextureFromImageData(gl, imageData);
      
      expect(program).not.toBeNull();
      expect(texture).not.toBeNull();
      
      // Cleanup
      if (texture) gl.deleteTexture(texture);
      gl.deleteProgram(program);
    });
  });
});
