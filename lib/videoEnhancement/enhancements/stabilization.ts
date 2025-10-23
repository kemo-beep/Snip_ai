/**
 * Video Stabilization Enhancement
 * Applies digital stabilization to reduce camera shake
 */

import type { MotionVector } from '../utils/motionDetection';

export interface StabilizationTransform {
  translateX: number;
  translateY: number;
  scale: number;
  rotation: number;
}

export interface StabilizationResult {
  transform: StabilizationTransform;
  cropPercentage: number;
  confidence: number;
}

/**
 * Calculate smoothed camera path from motion vectors
 */
export function calculateSmoothPath(
  motionHistory: MotionVector[],
  smoothingWindow: number = 5
): MotionVector[] {
  if (motionHistory.length < smoothingWindow) {
    return motionHistory;
  }

  const smoothed: MotionVector[] = [];
  const halfWindow = Math.floor(smoothingWindow / 2);

  for (let i = 0; i < motionHistory.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(motionHistory.length, i + halfWindow + 1);
    const window = motionHistory.slice(start, end);

    const avgX = window.reduce((sum, v) => sum + v.x, 0) / window.length;
    const avgY = window.reduce((sum, v) => sum + v.y, 0) / window.length;
    const magnitude = Math.sqrt(avgX * avgX + avgY * avgY);

    smoothed.push({ x: avgX, y: avgY, magnitude });
  }

  return smoothed;
}

/**
 * Calculate stabilization transform for a frame
 */
export function calculateStabilizationTransform(
  currentMotion: MotionVector,
  smoothedMotion: MotionVector,
  maxCrop: number = 0.05
): StabilizationResult {
  // Calculate correction needed
  const correctionX = smoothedMotion.x - currentMotion.x;
  const correctionY = smoothedMotion.y - currentMotion.y;

  // Limit correction to prevent excessive cropping
  const maxCorrection = maxCrop * 100; // Convert to pixels (assuming ~100px per 5%)
  const limitedX = Math.max(-maxCorrection, Math.min(maxCorrection, correctionX));
  const limitedY = Math.max(-maxCorrection, Math.min(maxCorrection, correctionY));

  // Calculate crop percentage needed
  const cropX = Math.abs(limitedX) / 100;
  const cropY = Math.abs(limitedY) / 100;
  const cropPercentage = Math.max(cropX, cropY);

  // Scale slightly to compensate for translation
  const scale = 1 + cropPercentage;

  // Calculate confidence based on how much correction was needed
  const correctionMagnitude = Math.sqrt(correctionX * correctionX + correctionY * correctionY);
  const confidence = Math.min(1, correctionMagnitude / 10);

  return {
    transform: {
      translateX: limitedX,
      translateY: limitedY,
      scale,
      rotation: 0, // Rotation stabilization not implemented yet
    },
    cropPercentage,
    confidence,
  };
}

/**
 * Apply stabilization transform to a frame
 */
export function applyStabilization(
  frame: ImageData,
  transform: StabilizationTransform
): ImageData {
  const width = frame.width;
  const height = frame.height;
  const stabilized = new Uint8ClampedArray(width * height * 4);

  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Apply inverse transform to find source pixel
      const dx = x - centerX;
      const dy = y - centerY;

      // Apply scale
      const scaledX = dx / transform.scale;
      const scaledY = dy / transform.scale;

      // Apply translation
      const srcX = scaledX + centerX - transform.translateX;
      const srcY = scaledY + centerY - transform.translateY;

      const dstIdx = (y * width + x) * 4;

      // Bilinear interpolation for smooth result
      if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
        const x0 = Math.floor(srcX);
        const x1 = x0 + 1;
        const y0 = Math.floor(srcY);
        const y1 = y0 + 1;

        const fx = srcX - x0;
        const fy = srcY - y0;

        const idx00 = (y0 * width + x0) * 4;
        const idx10 = (y0 * width + x1) * 4;
        const idx01 = (y1 * width + x0) * 4;
        const idx11 = (y1 * width + x1) * 4;

        for (let c = 0; c < 4; c++) {
          const v00 = frame.data[idx00 + c];
          const v10 = frame.data[idx10 + c];
          const v01 = frame.data[idx01 + c];
          const v11 = frame.data[idx11 + c];

          const v0 = v00 * (1 - fx) + v10 * fx;
          const v1 = v01 * (1 - fx) + v11 * fx;
          const v = v0 * (1 - fy) + v1 * fy;

          stabilized[dstIdx + c] = Math.round(v);
        }
      } else {
        // Fill with black for out-of-bounds pixels
        stabilized[dstIdx] = 0;
        stabilized[dstIdx + 1] = 0;
        stabilized[dstIdx + 2] = 0;
        stabilized[dstIdx + 3] = 255;
      }
    }
  }

  return new ImageData(stabilized, width, height);
}

/**
 * Apply stabilization using GPU (WebGL)
 */
export function applyStabilizationGPU(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  transform: StabilizationTransform,
  program: WebGLProgram
): void {
  gl.useProgram(program);

  // Set transform uniforms
  const translateLoc = gl.getUniformLocation(program, 'u_translate');
  const scaleLoc = gl.getUniformLocation(program, 'u_scale');

  gl.uniform2f(translateLoc, transform.translateX, transform.translateY);
  gl.uniform1f(scaleLoc, transform.scale);

  // Bind texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

  // Draw
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Create WebGL shader program for stabilization
 */
export function createStabilizationShader(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform vec2 u_translate;
    uniform float u_scale;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 offset = v_texCoord - center;
      
      // Apply scale and translation
      vec2 scaledOffset = offset / u_scale;
      vec2 srcCoord = scaledOffset + center - u_translate / 1000.0;
      
      if (srcCoord.x >= 0.0 && srcCoord.x <= 1.0 && 
          srcCoord.y >= 0.0 && srcCoord.y <= 1.0) {
        gl_FragColor = texture2D(u_image, srcCoord);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) return null;
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) return null;
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
    return null;
  }

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
    return null;
  }

  return program;
}

/**
 * Check if stabilization should be applied based on motion analysis
 */
export function shouldApplyStabilization(
  motionHistory: MotionVector[],
  minMotionThreshold: number = 1.0
): boolean {
  if (motionHistory.length < 3) {
    return false;
  }

  // Calculate average motion magnitude
  const avgMagnitude =
    motionHistory.reduce((sum, v) => sum + v.magnitude, 0) / motionHistory.length;

  // Only apply stabilization if there's significant motion
  return avgMagnitude > minMotionThreshold;
}
