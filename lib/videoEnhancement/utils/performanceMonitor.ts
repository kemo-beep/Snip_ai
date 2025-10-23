/**
 * Performance monitoring utility for video enhancement pipeline
 * Requirements: 6.1, 6.2, 8.5
 */

export interface PerformanceMetrics {
  memoryUsage: number          // bytes
  processingTime: number       // milliseconds
  framesProcessed: number
  averageFPS: number
  peakMemoryUsage: number      // bytes
  startTime: number            // timestamp
  endTime?: number             // timestamp
}

export interface FrameMetrics {
  frameIndex: number
  processingTime: number       // milliseconds
  timestamp: number
}

/**
 * Performance monitor for tracking video enhancement processing
 */
export class PerformanceMonitor {
  private startTime: number = 0
  private endTime?: number
  private framesProcessed: number = 0
  private frameMetrics: FrameMetrics[] = []
  private peakMemoryUsage: number = 0
  private lastFrameTime: number = 0
  private processingTimes: number[] = []

  /**
   * Start monitoring performance
   */
  start(): void {
    this.startTime = performance.now()
    this.framesProcessed = 0
    this.frameMetrics = []
    this.peakMemoryUsage = this.getCurrentMemoryUsage()
    this.lastFrameTime = this.startTime
    this.processingTimes = []
  }

  /**
   * Record a processed frame
   * @param frameIndex The index of the processed frame
   */
  recordFrame(frameIndex: number): void {
    const now = performance.now()
    const processingTime = now - this.lastFrameTime
    
    this.framesProcessed++
    this.frameMetrics.push({
      frameIndex,
      processingTime,
      timestamp: now
    })
    
    this.processingTimes.push(processingTime)
    this.lastFrameTime = now
    
    // Update peak memory usage
    const currentMemory = this.getCurrentMemoryUsage()
    if (currentMemory > this.peakMemoryUsage) {
      this.peakMemoryUsage = currentMemory
    }
  }

  /**
   * Stop monitoring and finalize metrics
   */
  stop(): void {
    this.endTime = performance.now()
  }

  /**
   * Get current memory usage in bytes
   * @returns Memory usage in bytes, or 0 if not available
   */
  getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize || 0
    }
    return 0
  }

  /**
   * Get total processing time in milliseconds
   * @returns Processing time in milliseconds
   */
  getProcessingTime(): number {
    if (this.endTime) {
      return this.endTime - this.startTime
    }
    return performance.now() - this.startTime
  }

  /**
   * Get average frames per second
   * @returns Average FPS
   */
  getAverageFPS(): number {
    const processingTime = this.getProcessingTime()
    if (processingTime === 0) return 0
    return (this.framesProcessed / processingTime) * 1000
  }

  /**
   * Get current FPS based on recent frames
   * @param sampleSize Number of recent frames to consider (default: 10)
   * @returns Current FPS
   */
  getCurrentFPS(sampleSize: number = 10): number {
    if (this.processingTimes.length === 0) return 0
    
    const recentTimes = this.processingTimes.slice(-sampleSize)
    const averageTime = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length
    
    if (averageTime === 0) return 0
    return 1000 / averageTime
  }

  /**
   * Get estimated time remaining in milliseconds
   * @param totalFrames Total number of frames to process
   * @returns Estimated time remaining in milliseconds
   */
  getEstimatedTimeRemaining(totalFrames: number): number {
    if (this.framesProcessed === 0) return 0
    
    const averageTimePerFrame = this.getProcessingTime() / this.framesProcessed
    const remainingFrames = totalFrames - this.framesProcessed
    
    return averageTimePerFrame * remainingFrames
  }

  /**
   * Get progress percentage
   * @param totalFrames Total number of frames to process
   * @returns Progress as a number between 0 and 1
   */
  getProgress(totalFrames: number): number {
    if (totalFrames === 0) return 0
    return Math.min(1, this.framesProcessed / totalFrames)
  }

  /**
   * Get complete performance metrics
   * @returns PerformanceMetrics object
   */
  getMetrics(): PerformanceMetrics {
    return {
      memoryUsage: this.getCurrentMemoryUsage(),
      processingTime: this.getProcessingTime(),
      framesProcessed: this.framesProcessed,
      averageFPS: this.getAverageFPS(),
      peakMemoryUsage: this.peakMemoryUsage,
      startTime: this.startTime,
      endTime: this.endTime
    }
  }

  /**
   * Get frame-by-frame metrics
   * @returns Array of FrameMetrics
   */
  getFrameMetrics(): FrameMetrics[] {
    return [...this.frameMetrics]
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTime = 0
    this.endTime = undefined
    this.framesProcessed = 0
    this.frameMetrics = []
    this.peakMemoryUsage = 0
    this.lastFrameTime = 0
    this.processingTimes = []
  }

  /**
   * Check if memory usage is approaching limits
   * @param thresholdMB Memory threshold in megabytes (default: 500MB)
   * @returns true if memory usage is high
   */
  isMemoryUsageHigh(thresholdMB: number = 500): boolean {
    const currentMemory = this.getCurrentMemoryUsage()
    const thresholdBytes = thresholdMB * 1024 * 1024
    return currentMemory > thresholdBytes
  }

  /**
   * Get a summary string of current performance
   * @returns Human-readable performance summary
   */
  getSummary(): string {
    const metrics = this.getMetrics()
    const memoryMB = (metrics.memoryUsage / (1024 * 1024)).toFixed(2)
    const peakMemoryMB = (metrics.peakMemoryUsage / (1024 * 1024)).toFixed(2)
    const processingSeconds = (metrics.processingTime / 1000).toFixed(2)
    
    return `Processed ${metrics.framesProcessed} frames in ${processingSeconds}s ` +
           `(${metrics.averageFPS.toFixed(2)} FPS avg). ` +
           `Memory: ${memoryMB}MB (peak: ${peakMemoryMB}MB)`
  }
}

/**
 * Create a new performance monitor instance
 * @returns PerformanceMonitor instance
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor()
}

/**
 * Format bytes to human-readable string
 * @param bytes Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format milliseconds to human-readable time string
 * @param ms Milliseconds
 * @returns Formatted string (e.g., "1m 30s")
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  }
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
