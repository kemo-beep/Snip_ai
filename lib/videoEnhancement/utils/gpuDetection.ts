/**
 * GPU detection utility for WebGL and WebGL2 support
 * Requirements: 8.2, 8.3
 */

export interface GPUCapabilities {
  webgl: boolean
  webgl2: boolean
  maxTextureSize: number
  maxRenderbufferSize: number
  vendor: string
  renderer: string
  supportsFloatTextures: boolean
  supportsHalfFloatTextures: boolean
}

/**
 * Detects WebGL support in the browser
 * @returns true if WebGL is supported, false otherwise
 */
export function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return gl !== null && gl !== undefined
  } catch (e) {
    return false
  }
}

/**
 * Detects WebGL2 support in the browser
 * @returns true if WebGL2 is supported, false otherwise
 */
export function detectWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    return gl !== null && gl !== undefined
  } catch (e) {
    return false
  }
}

/**
 * Gets detailed GPU capabilities
 * @returns GPUCapabilities object with detailed information
 */
export function getGPUCapabilities(): GPUCapabilities {
  const canvas = document.createElement('canvas')
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  
  // Try WebGL2 first, then fall back to WebGL
  gl = canvas.getContext('webgl2') as WebGL2RenderingContext
  const webgl2 = gl !== null
  
  if (!gl) {
    gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext
  }
  
  const webgl = gl !== null
  
  if (!gl) {
    // No WebGL support at all
    return {
      webgl: false,
      webgl2: false,
      maxTextureSize: 0,
      maxRenderbufferSize: 0,
      vendor: 'unknown',
      renderer: 'unknown',
      supportsFloatTextures: false,
      supportsHalfFloatTextures: false
    }
  }
  
  // Get GPU info
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const vendor = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) 
    : gl.getParameter(gl.VENDOR)
  const renderer = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) 
    : gl.getParameter(gl.RENDERER)
  
  // Check texture capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
  const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
  
  // Check float texture support
  const floatTextureExt = gl.getExtension('OES_texture_float')
  const halfFloatTextureExt = gl.getExtension('OES_texture_half_float')
  
  return {
    webgl,
    webgl2,
    maxTextureSize,
    maxRenderbufferSize,
    vendor,
    renderer,
    supportsFloatTextures: floatTextureExt !== null,
    supportsHalfFloatTextures: halfFloatTextureExt !== null
  }
}

/**
 * Determines if GPU-accelerated processing is available and recommended
 * @returns true if GPU processing should be used, false for CPU fallback
 */
export function shouldUseGPUProcessing(): boolean {
  const capabilities = getGPUCapabilities()
  
  // Require at least WebGL support
  if (!capabilities.webgl) {
    return false
  }
  
  // Check if texture size is sufficient for video processing (at least 2048x2048)
  if (capabilities.maxTextureSize < 2048) {
    return false
  }
  
  // WebGL2 is preferred but not required
  return true
}

/**
 * Creates a WebGL context with appropriate fallbacks
 * @param canvas The canvas element to create context on
 * @param preferWebGL2 Whether to prefer WebGL2 over WebGL
 * @returns WebGL context or null if not available
 */
export function createWebGLContext(
  canvas: HTMLCanvasElement,
  preferWebGL2: boolean = true
): WebGLRenderingContext | WebGL2RenderingContext | null {
  try {
    if (preferWebGL2) {
      const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext
      if (gl2) return gl2
    }
    
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext
    return gl
  } catch (e) {
    console.error('Failed to create WebGL context:', e)
    return null
  }
}

/**
 * Tests if GPU processing is working correctly
 * @returns true if GPU processing test passes, false otherwise
 */
export function testGPUProcessing(): boolean {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    
    const gl = createWebGLContext(canvas, true)
    if (!gl) return false
    
    // Try to create a simple shader program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) return false
    
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    
    gl.shaderSource(vertexShader, vertexShaderSource)
    gl.compileShader(vertexShader)
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      return false
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) return false
    
    const fragmentShaderSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `
    
    gl.shaderSource(fragmentShader, fragmentShaderSource)
    gl.compileShader(fragmentShader)
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      return false
    }
    
    const program = gl.createProgram()
    if (!program) return false
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return false
    }
    
    // If we got here, GPU processing should work
    return true
  } catch (e) {
    console.error('GPU processing test failed:', e)
    return false
  }
}
