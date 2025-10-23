/**
 * Brightness Adjustment Enhancement
 * Provides CPU and GPU-based brightness adjustment for video frames
 */

import { calculateAverageBrightness } from '../utils/colorAnalysis';

/**
 * Apply brightness adjustment using CPU
 * @param imageData - The image data to adjust
 * @param adjustment - Brightness adjustment value (-100 to 100)
 * @returns Adjusted image data
 */
export function applyBrightnessCPU(
  imageData: ImageData,
  adjustment: number
): ImageData {
  const data = imageData.data;
  const adjustmentValue = (adjustment / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + adjustmentValue));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustmentValue));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustmentValue));
    // Alpha channel remains unchanged
  }

  return imageData;
}

/**
 * Calculate optimal brightness adjustment based on current brightness
 * @param imageData - The image data to analyze
 * @param targetBrightness - Target brightness level (default: 128)
 * @returns Optimal adjustment value (-100 to 100)
 */
export function calculateOptimalBrightness(
  imageData: ImageData,
  targetBrightness: number = 128
): number {
  const currentBrightness = calculateAverageBrightness(imageData);
  const difference = targetBrightness - currentBrightness;
  
  // Convert difference to -100 to 100 scale
  const adjustment = (difference / 255) * 100;
  
  // Clamp to reasonable limits
  return Math.max(-100, Math.min(100, adjustment));
}

/**
 * WebGL shader source for brightness adjustment
 */
export const brightnessVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const brightnessFragmentShader = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_brightness;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    vec3 color = texColor.rgb;
    
    // Apply brightness adjustment
    color = color + u_brightness;
    
    // Clamp values to valid range
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, texColor.a);
  }
`;

/**
 * Apply brightness adjustment using WebGL
 * @param gl - WebGL rendering context
 * @param program - Compiled shader program
 * @param texture - Source texture
 * @param adjustment - Brightness adjustment value (-100 to 100)
 * @param width - Image width
 * @param height - Image height
 * @returns Adjusted image data
 */
export function applyBrightnessGPU(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  adjustment: number,
  width: number,
  height: number
): ImageData {
  // Use the shader program
  gl.useProgram(program);

  // Set up position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Set up texture coordinate buffer
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  const texCoords = new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    1, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  // Bind texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

  // Set brightness uniform (convert to 0-1 range)
  const brightnessValue = adjustment / 100;
  gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), brightnessValue);

  // Set viewport and draw
  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Read pixels
  const pixels = new Uint8ClampedArray(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Clean up
  gl.deleteBuffer(positionBuffer);
  gl.deleteBuffer(texCoordBuffer);

  return new ImageData(pixels, width, height);
}

/**
 * Auto-adjust brightness based on image analysis
 * @param imageData - The image data to adjust
 * @param targetBrightness - Target brightness level (default: 128)
 * @returns Adjusted image data
 */
export function autoAdjustBrightness(
  imageData: ImageData,
  targetBrightness: number = 128
): ImageData {
  const adjustment = calculateOptimalBrightness(imageData, targetBrightness);
  return applyBrightnessCPU(imageData, adjustment);
}
