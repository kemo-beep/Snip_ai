/**
 * Example usage of the unified color correction module
 * This file demonstrates how to use the color correction functions
 */

import {
  applyColorCorrectionCPU,
  applyColorCorrectionGPU,
  calculateOptimalColorCorrection,
  autoColorCorrection,
  createColorCorrectionProgram,
  createTextureFromImageData,
  type ColorCorrectionSettings,
} from '../colorCorrection';

/**
 * Example 1: Apply manual color correction using CPU
 */
export function exampleManualCPUCorrection(imageData: ImageData): ImageData {
  const settings: ColorCorrectionSettings = {
    brightness: 15,    // Increase brightness by 15%
    contrast: 10,      // Increase contrast by 10%
    temperature: -5,   // Make slightly cooler (more blue)
  };

  return applyColorCorrectionCPU(imageData, settings);
}

/**
 * Example 2: Apply automatic color correction
 */
export function exampleAutoCorrection(imageData: ImageData): ImageData {
  // Automatically calculates and applies optimal settings
  return autoColorCorrection(imageData);
}

/**
 * Example 3: Calculate optimal settings without applying
 */
export function exampleCalculateSettings(imageData: ImageData): ColorCorrectionSettings {
  // Get recommended settings based on image analysis
  return calculateOptimalColorCorrection(imageData, {
    targetBrightness: 140,  // Target slightly brighter than default
    targetContrast: 55,     // Target slightly higher contrast
    targetTemperature: 0,   // Target neutral temperature
  });
}

/**
 * Example 4: Apply color correction using GPU (WebGL)
 */
export function exampleGPUCorrection(
  canvas: HTMLCanvasElement,
  imageData: ImageData
): ImageData | null {
  // Get WebGL context
  const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
  if (!gl) {
    console.error('WebGL not available');
    return null;
  }

  // Create shader program
  const program = createColorCorrectionProgram(gl);
  if (!program) {
    console.error('Failed to create shader program');
    return null;
  }

  // Create texture from image data
  const texture = createTextureFromImageData(gl, imageData);
  if (!texture) {
    console.error('Failed to create texture');
    gl.deleteProgram(program);
    return null;
  }

  // Apply color correction
  const settings: ColorCorrectionSettings = {
    brightness: 20,
    contrast: 15,
    temperature: 10,
  };

  const result = applyColorCorrectionGPU(
    gl,
    program,
    texture,
    settings,
    imageData.width,
    imageData.height
  );

  // Clean up
  gl.deleteTexture(texture);
  gl.deleteProgram(program);

  return result;
}

/**
 * Example 5: Process video frame with fallback
 */
export function exampleProcessFrameWithFallback(
  imageData: ImageData,
  canvas?: HTMLCanvasElement
): ImageData {
  const settings: ColorCorrectionSettings = {
    brightness: 10,
    contrast: 10,
    temperature: 0,
  };

  // Try GPU first if canvas is available
  if (canvas) {
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (gl) {
      const program = createColorCorrectionProgram(gl);
      if (program) {
        const texture = createTextureFromImageData(gl, imageData);
        if (texture) {
          const result = applyColorCorrectionGPU(
            gl,
            program,
            texture,
            settings,
            imageData.width,
            imageData.height
          );
          gl.deleteTexture(texture);
          gl.deleteProgram(program);
          return result;
        }
        gl.deleteProgram(program);
      }
    }
  }

  // Fallback to CPU
  return applyColorCorrectionCPU(imageData, settings);
}

/**
 * Example 6: Batch process multiple frames
 */
export async function exampleBatchProcess(
  frames: ImageData[],
  onProgress?: (progress: number) => void
): Promise<ImageData[]> {
  // Calculate optimal settings from first frame
  const settings = calculateOptimalColorCorrection(frames[0]);

  const results: ImageData[] = [];
  
  for (let i = 0; i < frames.length; i++) {
    // Apply same settings to all frames for consistency
    results.push(applyColorCorrectionCPU(frames[i], settings));
    
    // Report progress
    if (onProgress) {
      onProgress((i + 1) / frames.length);
    }
  }

  return results;
}

/**
 * Example 7: Compare before and after
 */
export function exampleCompareBeforeAfter(imageData: ImageData): {
  original: ImageData;
  corrected: ImageData;
  settings: ColorCorrectionSettings;
} {
  // Calculate optimal settings
  const settings = calculateOptimalColorCorrection(imageData);

  // Create a copy of the original
  const original = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Apply correction
  const corrected = applyColorCorrectionCPU(imageData, settings);

  return {
    original,
    corrected,
    settings,
  };
}
