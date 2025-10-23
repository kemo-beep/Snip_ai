/**
 * Color Analysis Utility
 * Provides functions to analyze video frames for color properties
 */

export interface ColorAnalysisResult {
  averageBrightness: number; // 0-255
  contrast: number; // 0-100
  colorTemperature: number; // -100 (cool) to 100 (warm)
  dominantColors: string[]; // Hex color codes
}

/**
 * Calculate average brightness from ImageData
 * @param imageData - The image data to analyze
 * @returns Average brightness value (0-255)
 */
export function calculateAverageBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let totalBrightness = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Use luminance formula (perceived brightness)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
  }

  return totalBrightness / pixelCount;
}

/**
 * Calculate contrast level from ImageData
 * @param imageData - The image data to analyze
 * @returns Contrast level (0-100)
 */
export function calculateContrast(imageData: ImageData): number {
  const data = imageData.data;
  const pixelCount = data.length / 4;
  const brightnesses: number[] = [];

  // Calculate brightness for each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnesses.push(brightness);
  }

  // Calculate standard deviation
  const mean = brightnesses.reduce((sum, val) => sum + val, 0) / pixelCount;
  const variance = brightnesses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixelCount;
  const stdDev = Math.sqrt(variance);

  // Normalize to 0-100 scale (standard deviation of 0-64 maps to 0-100)
  return Math.min(100, (stdDev / 64) * 100);
}

/**
 * Detect color temperature from ImageData
 * @param imageData - The image data to analyze
 * @returns Color temperature (-100 cool to 100 warm)
 */
export function detectColorTemperature(imageData: ImageData): number {
  const data = imageData.data;
  let totalRed = 0;
  let totalBlue = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    totalRed += data[i];
    totalBlue += data[i + 2];
  }

  const avgRed = totalRed / pixelCount;
  const avgBlue = totalBlue / pixelCount;

  // Calculate temperature based on red-blue ratio
  // More red = warm, more blue = cool
  const temperatureDiff = avgRed - avgBlue;
  
  // Normalize to -100 to 100 scale
  // Typical range is -50 to 50, so we scale accordingly
  return Math.max(-100, Math.min(100, temperatureDiff / 0.5));
}

/**
 * Identify dominant colors in the image
 * @param imageData - The image data to analyze
 * @param colorCount - Number of dominant colors to return (default: 5)
 * @returns Array of hex color codes
 */
export function identifyDominantColors(
  imageData: ImageData,
  colorCount: number = 5
): string[] {
  const data = imageData.data;
  const colorMap = new Map<string, number>();

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = Math.floor(data[i] / 32) * 32; // Quantize to reduce color space
    const g = Math.floor(data[i + 1] / 32) * 32;
    const b = Math.floor(data[i + 2] / 32) * 32;
    
    const colorKey = `${r},${g},${b}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }

  // Sort by frequency and get top colors
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, colorCount);

  // Convert to hex
  return sortedColors.map(([color]) => {
    const [r, g, b] = color.split(',').map(Number);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  });
}

/**
 * Perform complete color analysis on a frame
 * @param imageData - The image data to analyze
 * @returns Complete color analysis result
 */
export function analyzeFrame(imageData: ImageData): ColorAnalysisResult {
  return {
    averageBrightness: calculateAverageBrightness(imageData),
    contrast: calculateContrast(imageData),
    colorTemperature: detectColorTemperature(imageData),
    dominantColors: identifyDominantColors(imageData),
  };
}
