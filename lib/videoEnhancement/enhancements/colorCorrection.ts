/**
 * Unified Color Correction Module
 * Combines brightness, contrast, and white balance adjustments in a single pass
 * Provides both CPU and GPU implementations for optimal performance
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7
 */

import { calculateOptimalBrightness } from './brightnessAdjust';
import { calculateOptimalContrast } from './contrastEnhance';
import { calculateOptimalWhiteBalance } from './whiteBalance';

/**
 * Settings for color correction
 */
export interface ColorCorrectionSettings {
  brightness: number;      // -100 to 100
  contrast: number;        // -100 to 100
  temperature: number;     // -100 to 100 (negative = cooler, positive = warmer)
}

/**
 * Apply all color corrections in a single pass using CPU
 * This is more efficient than applying each correction separately
 * @param imageData - The image data to adjust
 * @param settings - Color correction settings
 * @returns Adjusted image data
 */
export function applyColorCorrectionCPU(
  imageData: ImageData,
  settings: ColorCorrectionSettings
): ImageData {
  const data = imageData.data;
  const { brightness, contrast, temperature } = settings;

  // Pre-calculate adjustment values
  const brightnessValue = (brightness / 100) * 255;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const redShift = (temperature / 100) * 50;
  const blueShift = -(temperature / 100) * 50;
  const greenShift = (temperature / 100) * 5;

  // Apply all corrections in a single pass
  for (let i = 0; i < data.length; i += 4) {
    // Normalize to 0-1 range for processing
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // 1. Apply contrast adjustment first (works better on normalized values)
    r = (r - 0.5) * (1 + contrast / 100) + 0.5;
    g = (g - 0.5) * (1 + contrast / 100) + 0.5;
    b = (b - 0.5) * (1 + contrast / 100) + 0.5;

    // 2. Apply brightness adjustment
    r += brightness / 100;
    g += brightness / 100;
    b += brightness / 100;

    // 3. Apply white balance (temperature) adjustment
    r += redShift / 255;
    g += greenShift / 255;
    b += blueShift / 255;

    // Clamp and convert back to 0-255 range
    data[i] = Math.max(0, Math.min(255, r * 255));
    data[i + 1] = Math.max(0, Math.min(255, g * 255));
    data[i + 2] = Math.max(0, Math.min(255, b * 255));
    // Alpha channel remains unchanged
  }

  return imageData;
}

/**
 * Calculate optimal color correction settings based on image analysis
 * @param imageData - The image data to analyze
 * @param options - Optional target values
 * @returns Optimal color correction settings
 */
export function calculateOptimalColorCorrection(
  imageData: ImageData,
  options?: {
    targetBrightness?: number;
    targetContrast?: number;
    targetTemperature?: number;
  }
): ColorCorrectionSettings {
  const brightness = calculateOptimalBrightness(
    imageData,
    options?.targetBrightness
  );
  const contrast = calculateOptimalContrast(
    imageData,
    options?.targetContrast
  );
  const temperature = calculateOptimalWhiteBalance(
    imageData,
    options?.targetTemperature
  );

  return {
    brightness,
    contrast,
    temperature,
  };
}

/**
 * WebGL shader source for unified color correction
 */
export const colorCorrectionVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const colorCorrectionFragmentShader = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_temperature;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    vec3 color = texColor.rgb;
    
    // 1. Apply brightness adjustment
    color = color + u_brightness;
    
    // 2. Apply contrast adjustment
    color = (color - 0.5) * (1.0 + u_contrast) + 0.5;
    
    // 3. Apply white balance (temperature) adjustment
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
 * Apply all color corrections in a single pass using WebGL
 * @param gl - WebGL rendering context
 * @param program - Compiled shader program
 * @param texture - Source texture
 * @param settings - Color correction settings
 * @param width - Image width
 * @param height - Image height
 * @returns Adjusted image data
 */
export function applyColorCorrectionGPU(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  settings: ColorCorrectionSettings,
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

  // Set all uniforms (convert to 0-1 range)
  const brightnessValue = settings.brightness / 100;
  const contrastValue = settings.contrast / 100;
  const temperatureValue = settings.temperature / 100;

  gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), brightnessValue);
  gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), contrastValue);
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
 * Auto-adjust all color corrections based on image analysis
 * @param imageData - The image data to adjust
 * @param options - Optional target values
 * @returns Adjusted image data
 */
export function autoColorCorrection(
  imageData: ImageData,
  options?: {
    targetBrightness?: number;
    targetContrast?: number;
    targetTemperature?: number;
  }
): ImageData {
  const settings = calculateOptimalColorCorrection(imageData, options);
  return applyColorCorrectionCPU(imageData, settings);
}

/**
 * Helper function to compile and link WebGL shader program for color correction
 * @param gl - WebGL rendering context
 * @returns Compiled shader program or null if compilation fails
 */
export function createColorCorrectionProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): WebGLProgram | null {
  // Create vertex shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) return null;
  
  gl.shaderSource(vertexShader, colorCorrectionVertexShader);
  gl.compileShader(vertexShader);
  
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return null;
  }

  // Create fragment shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }
  
  gl.shaderSource(fragmentShader, colorCorrectionFragmentShader);
  gl.compileShader(fragmentShader);
  
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Create and link program
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    return null;
  }

  // Clean up shaders (they're now part of the program)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Helper function to create a WebGL texture from ImageData
 * @param gl - WebGL rendering context
 * @param imageData - Source image data
 * @returns WebGL texture
 */
export function createTextureFromImageData(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  imageData: ImageData
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // Upload image data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    imageData.width,
    imageData.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    imageData.data
  );

  return texture;
}
