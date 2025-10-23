/**
 * White Balance Correction
 * Provides CPU and GPU-based white balance adjustment for video frames
 */

import { detectColorTemperature } from '../utils/colorAnalysis';

/**
 * Apply white balance correction using CPU
 * @param imageData - The image data to adjust
 * @param adjustment - Temperature adjustment value (-100 to 100, negative = cooler, positive = warmer)
 * @returns Adjusted image data
 */
export function applyWhiteBalanceCPU(
  imageData: ImageData,
  adjustment: number
): ImageData {
  const data = imageData.data;
  
  // Convert adjustment to color shift values
  // Negative adjustment = add blue, reduce red (cooler)
  // Positive adjustment = add red, reduce blue (warmer)
  const redShift = adjustment / 100;
  const blueShift = -adjustment / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Apply temperature shift
    // Red channel: increase for warm, decrease for cool
    data[i] = Math.max(0, Math.min(255, r + (redShift * 50)));
    
    // Green channel: slight adjustment to maintain balance
    data[i + 1] = Math.max(0, Math.min(255, g + (adjustment * 0.1)));
    
    // Blue channel: increase for cool, decrease for warm
    data[i + 2] = Math.max(0, Math.min(255, b + (blueShift * 50)));
    
    // Alpha channel remains unchanged
  }

  return imageData;
}

/**
 * Calculate optimal white balance adjustment based on current color temperature
 * @param imageData - The image data to analyze
 * @param targetTemperature - Target temperature (default: 0 for neutral)
 * @returns Optimal adjustment value (-100 to 100)
 */
export function calculateOptimalWhiteBalance(
  imageData: ImageData,
  targetTemperature: number = 0
): number {
  const currentTemperature = detectColorTemperature(imageData);
  const difference = targetTemperature - currentTemperature;
  
  // Scale the difference to adjustment range
  // Limit correction to avoid overcorrection
  const adjustment = Math.max(-100, Math.min(100, difference * 0.8));
  
  return adjustment;
}

/**
 * WebGL shader source for white balance correction
 */
export const whiteBalanceVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const whiteBalanceFragmentShader = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_temperature;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    vec3 color = texColor.rgb;
    
    // Apply white balance adjustment
    // Positive temperature = warmer (more red, less blue)
    // Negative temperature = cooler (more blue, less red)
    float redShift = u_temperature * 0.5;
    float blueShift = -u_temperature * 0.5;
    float greenShift = u_temperature * 0.1;
    
    color.r = color.r + redShift;
    color.g = color.g + greenShift;
    color.b = color.b + blueShift;
    
    // Clamp values to valid range
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, texColor.a);
  }
`;

/**
 * Apply white balance correction using WebGL
 * @param gl - WebGL rendering context
 * @param program - Compiled shader program
 * @param texture - Source texture
 * @param adjustment - Temperature adjustment value (-100 to 100)
 * @param width - Image width
 * @param height - Image height
 * @returns Adjusted image data
 */
export function applyWhiteBalanceGPU(
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

  // Set temperature uniform (convert to 0-1 range)
  const temperatureValue = adjustment / 100;
  gl.uniform1f(gl.getUniformLocation(program, 'u_temperature'), temperatureValue);

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
 * Auto-adjust white balance based on image analysis
 * @param imageData - The image data to adjust
 * @param targetTemperature - Target temperature (default: 0 for neutral)
 * @returns Adjusted image data
 */
export function autoAdjustWhiteBalance(
  imageData: ImageData,
  targetTemperature: number = 0
): ImageData {
  const adjustment = calculateOptimalWhiteBalance(imageData, targetTemperature);
  return applyWhiteBalanceCPU(imageData, adjustment);
}
