/**
 * Contrast Enhancement
 * Provides CPU and GPU-based contrast adjustment for video frames
 */

import { calculateContrast } from '../utils/colorAnalysis';

/**
 * Apply contrast adjustment using CPU
 * @param imageData - The image data to adjust
 * @param adjustment - Contrast adjustment value (-100 to 100)
 * @returns Adjusted image data
 */
export function applyContrastCPU(
  imageData: ImageData,
  adjustment: number
): ImageData {
  const data = imageData.data;
  const factor = (259 * (adjustment + 255)) / (255 * (259 - adjustment));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    // Alpha channel remains unchanged
  }

  return imageData;
}

/**
 * Calculate optimal contrast adjustment based on current contrast
 * @param imageData - The image data to analyze
 * @param targetContrast - Target contrast level (default: 50)
 * @returns Optimal adjustment value (-100 to 100)
 */
export function calculateOptimalContrast(
  imageData: ImageData,
  targetContrast: number = 50
): number {
  const currentContrast = calculateContrast(imageData);
  const difference = targetContrast - currentContrast;
  
  // Scale the difference to adjustment range
  const adjustment = difference * 2;
  
  // Clamp to reasonable limits
  return Math.max(-100, Math.min(100, adjustment));
}

/**
 * WebGL shader source for contrast adjustment
 */
export const contrastVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const contrastFragmentShader = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_contrast;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    vec3 color = texColor.rgb;
    
    // Apply contrast adjustment
    // Formula: (color - 0.5) * (1 + contrast) + 0.5
    color = (color - 0.5) * (1.0 + u_contrast) + 0.5;
    
    // Clamp values to valid range
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, texColor.a);
  }
`;

/**
 * Apply contrast adjustment using WebGL
 * @param gl - WebGL rendering context
 * @param program - Compiled shader program
 * @param texture - Source texture
 * @param adjustment - Contrast adjustment value (-100 to 100)
 * @param width - Image width
 * @param height - Image height
 * @returns Adjusted image data
 */
export function applyContrastGPU(
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

  // Set contrast uniform (convert to 0-1 range)
  const contrastValue = adjustment / 100;
  gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), contrastValue);

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
 * Auto-adjust contrast based on image analysis
 * @param imageData - The image data to adjust
 * @param targetContrast - Target contrast level (default: 50)
 * @returns Adjusted image data
 */
export function autoAdjustContrast(
  imageData: ImageData,
  targetContrast: number = 50
): ImageData {
  const adjustment = calculateOptimalContrast(imageData, targetContrast);
  return applyContrastCPU(imageData, adjustment);
}
