/**
 * Motion Detection Utility
 * Detects camera movement and shake between consecutive video frames
 */

export interface MotionVector {
  x: number
  y: number
  magnitude: number
  angle: number
}

export interface MotionAnalysis {
  motionVectors: MotionVector[]
  averageMotion: MotionVector
  isShake: boolean
  shakeIntensity: number // 0-1 scale
  confidence: number // 0-1 scale
}

export interface OpticalFlowResult {
  dx: number // horizontal displacement
  dy: number // vertical displacement
  confidence: number
}

/**
 * Calculate motion vectors between two consecutive frames
 */
export function calculateMotionVectors(
  frame1: ImageData,
  frame2: ImageData,
  blockSize: number = 16
): MotionVector[] {
  if (frame1.width !== frame2.width || frame1.height !== frame2.height) {
    throw new Error('Frames must have the same dimensions')
  }

  const vectors: MotionVector[] = []
  const width = frame1.width
  const height = frame1.height

  // Divide frame into blocks and calculate motion for each block
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const vector = calculateBlockMotion(frame1, frame2, x, y, blockSize)
      vectors.push(vector)
    }
  }

  return vectors
}

/**
 * Calculate motion for a single block using block matching
 */
function calculateBlockMotion(
  frame1: ImageData,
  frame2: ImageData,
  blockX: number,
  blockY: number,
  blockSize: number,
  searchRange: number = 16
): MotionVector {
  let minSAD = Infinity
  let bestDx = 0
  let bestDy = 0

  // Search for best match in the search range
  for (let dy = -searchRange; dy <= searchRange; dy++) {
    for (let dx = -searchRange; dx <= searchRange; dx++) {
      const sad = calculateSAD(
        frame1,
        frame2,
        blockX,
        blockY,
        blockX + dx,
        blockY + dy,
        blockSize
      )

      if (sad < minSAD) {
        minSAD = sad
        bestDx = dx
        bestDy = dy
      }
    }
  }

  // If the best match is very close to zero motion, snap to zero
  if (minSAD < blockSize * blockSize * 5) {
    const zeroSAD = calculateSAD(
      frame1,
      frame2,
      blockX,
      blockY,
      blockX,
      blockY,
      blockSize
    )

    // If zero motion is almost as good, prefer it
    if (Math.abs(minSAD - zeroSAD) < blockSize * blockSize * 2) {
      bestDx = 0
      bestDy = 0
    }
  }

  const magnitude = Math.sqrt(bestDx * bestDx + bestDy * bestDy)
  const angle = Math.atan2(bestDy, bestDx)

  return {
    x: bestDx,
    y: bestDy,
    magnitude,
    angle,
  }
}

/**
 * Calculate Sum of Absolute Differences (SAD) between two blocks
 */
function calculateSAD(
  frame1: ImageData,
  frame2: ImageData,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  blockSize: number
): number {
  let sad = 0
  const width = frame1.width

  // Ensure blocks are within bounds
  const maxX1 = Math.min(x1 + blockSize, frame1.width)
  const maxY1 = Math.min(y1 + blockSize, frame1.height)
  const maxX2 = Math.min(x2 + blockSize, frame2.width)
  const maxY2 = Math.min(y2 + blockSize, frame2.height)

  if (x2 < 0 || y2 < 0 || maxX2 > frame2.width || maxY2 > frame2.height) {
    return Infinity
  }

  for (let y = 0; y < Math.min(maxY1 - y1, maxY2 - y2); y++) {
    for (let x = 0; x < Math.min(maxX1 - x1, maxX2 - x2); x++) {
      const idx1 = ((y1 + y) * width + (x1 + x)) * 4
      const idx2 = ((y2 + y) * width + (x2 + x)) * 4

      // Calculate grayscale difference
      const gray1 =
        frame1.data[idx1] * 0.299 +
        frame1.data[idx1 + 1] * 0.587 +
        frame1.data[idx1 + 2] * 0.114
      const gray2 =
        frame2.data[idx2] * 0.299 +
        frame2.data[idx2 + 1] * 0.587 +
        frame2.data[idx2 + 2] * 0.114

      sad += Math.abs(gray1 - gray2)
    }
  }

  return sad
}

/**
 * Estimate optical flow using Lucas-Kanade method (simplified)
 */
export function estimateOpticalFlow(
  frame1: ImageData,
  frame2: ImageData,
  x: number,
  y: number,
  windowSize: number = 5
): OpticalFlowResult {
  const halfWindow = Math.floor(windowSize / 2)
  const width = frame1.width
  const height = frame1.height

  // Calculate image gradients
  let sumIx = 0
  let sumIy = 0
  let sumIt = 0
  let sumIxIx = 0
  let sumIyIy = 0
  let sumIxIy = 0
  let sumIxIt = 0
  let sumIyIt = 0
  let count = 0

  for (let dy = -halfWindow; dy <= halfWindow; dy++) {
    for (let dx = -halfWindow; dx <= halfWindow; dx++) {
      const px = x + dx
      const py = y + dy

      if (px < 1 || px >= width - 1 || py < 1 || py >= height - 1) {
        continue
      }

      // Calculate spatial gradients (Ix, Iy)
      const idx = (py * width + px) * 4
      const idxRight = (py * width + (px + 1)) * 4
      const idxLeft = (py * width + (px - 1)) * 4
      const idxDown = ((py + 1) * width + px) * 4
      const idxUp = ((py - 1) * width + px) * 4

      const gray = toGrayscale(frame1.data, idx)
      const grayRight = toGrayscale(frame1.data, idxRight)
      const grayLeft = toGrayscale(frame1.data, idxLeft)
      const grayDown = toGrayscale(frame1.data, idxDown)
      const grayUp = toGrayscale(frame1.data, idxUp)

      const Ix = (grayRight - grayLeft) / 2
      const Iy = (grayDown - grayUp) / 2

      // Calculate temporal gradient (It)
      const gray2 = toGrayscale(frame2.data, idx)
      const It = gray2 - gray

      sumIx += Ix
      sumIy += Iy
      sumIt += It
      sumIxIx += Ix * Ix
      sumIyIy += Iy * Iy
      sumIxIy += Ix * Iy
      sumIxIt += Ix * It
      sumIyIt += Iy * It
      count++
    }
  }

  if (count === 0) {
    return { dx: 0, dy: 0, confidence: 0 }
  }

  // Solve the optical flow equation using least squares
  const det = sumIxIx * sumIyIy - sumIxIy * sumIxIy

  if (Math.abs(det) < 1e-6) {
    return { dx: 0, dy: 0, confidence: 0 }
  }

  const dx = (sumIyIy * sumIxIt - sumIxIy * sumIyIt) / det
  const dy = (sumIxIx * sumIyIt - sumIxIy * sumIxIt) / det

  // Calculate confidence based on gradient strength
  const gradientStrength = Math.sqrt(sumIxIx + sumIyIy) / count
  const confidence = Math.min(1, gradientStrength / 50)

  return { dx: -dx, dy: -dy, confidence }
}

/**
 * Convert RGB to grayscale
 */
function toGrayscale(data: Uint8ClampedArray, idx: number): number {
  return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
}

/**
 * Detect if motion is camera shake vs intentional movement
 */
export function detectShake(
  motionVectors: MotionVector[],
  threshold: number = 2.0
): { isShake: boolean; shakeIntensity: number; confidence: number } {
  if (motionVectors.length === 0) {
    return { isShake: false, shakeIntensity: 0, confidence: 0 }
  }

  // Calculate average motion
  const avgMotion = calculateAverageMotion(motionVectors)

  // Calculate motion variance (shake is characterized by high variance)
  let varianceX = 0
  let varianceY = 0

  for (const vector of motionVectors) {
    varianceX += Math.pow(vector.x - avgMotion.x, 2)
    varianceY += Math.pow(vector.y - avgMotion.y, 2)
  }

  varianceX /= motionVectors.length
  varianceY /= motionVectors.length

  const totalVariance = Math.sqrt(varianceX + varianceY)

  // High variance with low average motion indicates shake
  // Low variance with high average motion indicates intentional panning
  const isShake = totalVariance > threshold && avgMotion.magnitude < threshold * 2

  // Calculate shake intensity (0-1 scale)
  const shakeIntensity = Math.min(1, totalVariance / 10)

  // Calculate confidence based on number of vectors and consistency
  const confidence = Math.min(1, motionVectors.length / 100)

  return { isShake, shakeIntensity, confidence }
}

/**
 * Calculate average motion vector
 */
export function calculateAverageMotion(
  motionVectors: MotionVector[]
): MotionVector {
  if (motionVectors.length === 0) {
    return { x: 0, y: 0, magnitude: 0, angle: 0 }
  }

  let sumX = 0
  let sumY = 0

  for (const vector of motionVectors) {
    sumX += vector.x
    sumY += vector.y
  }

  const x = sumX / motionVectors.length
  const y = sumY / motionVectors.length
  const magnitude = Math.sqrt(x * x + y * y)
  const angle = Math.atan2(y, x)

  return { x, y, magnitude, angle }
}

/**
 * Analyze motion between two frames
 */
export function analyzeMotion(
  frame1: ImageData,
  frame2: ImageData,
  options: {
    blockSize?: number
    shakeThreshold?: number
  } = {}
): MotionAnalysis {
  const { blockSize = 16, shakeThreshold = 2.0 } = options

  // Calculate motion vectors
  const motionVectors = calculateMotionVectors(frame1, frame2, blockSize)

  // Calculate average motion
  const averageMotion = calculateAverageMotion(motionVectors)

  // Detect shake
  const { isShake, shakeIntensity, confidence } = detectShake(
    motionVectors,
    shakeThreshold
  )

  return {
    motionVectors,
    averageMotion,
    isShake,
    shakeIntensity,
    confidence,
  }
}
