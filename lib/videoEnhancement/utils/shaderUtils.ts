/**
 * WebGL Shader Utilities
 * Provides shader compilation, caching, and management for video enhancement
 */

export interface ShaderProgram {
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
}

export interface ShaderCache {
  [key: string]: ShaderProgram;
}

// Global shader cache
const shaderCache: ShaderCache = {};

/**
 * Compile a shader from source
 */
export function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  source: string,
  type: number
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error('Shader compilation failed:', info);
    console.error('Shader source:', source);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create and link a shader program
 */
export function createShaderProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  cacheKey?: string
): WebGLProgram | null {
  // Check cache first
  if (cacheKey && shaderCache[cacheKey]) {
    return shaderCache[cacheKey].program;
  }

  const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
  if (!vertexShader) return null;

  const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

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
    const info = gl.getProgramInfoLog(program);
    console.error('Shader program linking failed:', info);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Cache the program
  if (cacheKey) {
    shaderCache[cacheKey] = {
      program,
      vertexShader,
      fragmentShader,
    };
  }

  return program;
}

/**
 * Standard vertex shader for full-screen quad
 */
export const STANDARD_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

/**
 * Fragment shader for brightness adjustment
 */
export const BRIGHTNESS_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_brightness;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    gl_FragColor = vec4(color.rgb + u_brightness, color.a);
  }
`;

/**
 * Fragment shader for contrast adjustment
 */
export const CONTRAST_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_contrast;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec3 adjusted = (color.rgb - 0.5) * (1.0 + u_contrast) + 0.5;
    gl_FragColor = vec4(adjusted, color.a);
  }
`;

/**
 * Fragment shader for saturation adjustment
 */
export const SATURATION_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_saturation;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Calculate luminance
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Interpolate between grayscale and original color
    vec3 adjusted = mix(vec3(luminance), color.rgb, 1.0 + u_saturation);
    
    gl_FragColor = vec4(adjusted, color.a);
  }
`;

/**
 * Fragment shader for white balance adjustment
 */
export const WHITE_BALANCE_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_temperature;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Adjust color temperature
    // Positive values = warmer (more red/yellow)
    // Negative values = cooler (more blue)
    vec3 adjusted = color.rgb;
    
    if (u_temperature > 0.0) {
      // Warm: increase red, decrease blue
      adjusted.r += u_temperature * 0.3;
      adjusted.b -= u_temperature * 0.2;
    } else {
      // Cool: decrease red, increase blue
      adjusted.r += u_temperature * 0.2;
      adjusted.b -= u_temperature * 0.3;
    }
    
    gl_FragColor = vec4(clamp(adjusted, 0.0, 1.0), color.a);
  }
`;

/**
 * Combined fragment shader for all color corrections
 */
export const COMBINED_COLOR_CORRECTION_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_temperature;
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec3 result = color.rgb;
    
    // Apply brightness
    result += u_brightness;
    
    // Apply contrast
    result = (result - 0.5) * (1.0 + u_contrast) + 0.5;
    
    // Apply saturation
    float luminance = dot(result, vec3(0.299, 0.587, 0.114));
    result = mix(vec3(luminance), result, 1.0 + u_saturation);
    
    // Apply white balance
    if (u_temperature > 0.0) {
      result.r += u_temperature * 0.3;
      result.b -= u_temperature * 0.2;
    } else {
      result.r += u_temperature * 0.2;
      result.b -= u_temperature * 0.3;
    }
    
    gl_FragColor = vec4(clamp(result, 0.0, 1.0), color.a);
  }
`;

/**
 * Setup full-screen quad geometry
 */
export function setupQuadGeometry(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram
): void {
  // Create position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]);
  
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Create texture coordinate buffer
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  
  const texCoords = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ]);
  
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
}

/**
 * Create texture from ImageData
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

/**
 * Read pixels from framebuffer to ImageData
 */
export function readPixelsToImageData(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  width: number,
  height: number
): ImageData {
  const pixels = new Uint8ClampedArray(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  
  // Flip vertically (WebGL has origin at bottom-left)
  const flipped = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = y * width * 4;
    flipped.set(pixels.subarray(srcRow, srcRow + width * 4), dstRow);
  }
  
  return new ImageData(flipped, width, height);
}

/**
 * Clear shader cache
 */
export function clearShaderCache(
  gl?: WebGLRenderingContext | WebGL2RenderingContext
): void {
  if (gl) {
    // Delete all cached programs
    Object.values(shaderCache).forEach(({ program, vertexShader, fragmentShader }) => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    });
  }
  
  // Clear cache
  Object.keys(shaderCache).forEach(key => delete shaderCache[key]);
}

/**
 * Get cached shader program
 */
export function getCachedShader(key: string): WebGLProgram | null {
  return shaderCache[key]?.program || null;
}
