import { ExportOptions } from '@/components/ExportDialog'
import { convertWebMToMP4, isFFmpegSupported } from './ffmpegConverter'

interface VideoExportParams {
    videoUrl: string
    webcamUrl?: string
    options: ExportOptions
    videoDuration?: number // Actual duration from the video element
    webcamSettings?: {
        visible: boolean
        position: { x: number; y: number }
        size: { width: number; height: number }
        shape: 'rectangle' | 'square' | 'circle'
        borderWidth: number
        borderColor: string
    }
    backgroundSettings?: {
        type: 'wallpaper' | 'gradient' | 'color' | 'image'
        padding: number
        borderRadius: number
    }
    onProgress?: (progress: number) => void
}

export async function exportVideo(params: VideoExportParams): Promise<Blob> {
    const {
        videoUrl,
        webcamUrl,
        options,
        videoDuration,
        webcamSettings,
        backgroundSettings,
        onProgress
    } = params

    try {
        onProgress?.(0.05) // 5% - Starting

        // Fetch the main video
        const videoResponse = await fetch(videoUrl)
        const videoBlob = await videoResponse.blob()

        onProgress?.(0.15) // 15% - Main video loaded

        // If we need to include webcam and it exists
        let webcamBlob: Blob | null = null
        if (options.includeWebcam && webcamUrl && webcamSettings?.visible) {
            try {
                console.log('Fetching webcam video from:', webcamUrl)
                const webcamResponse = await fetch(webcamUrl)
                if (webcamResponse.ok) {
                    webcamBlob = await webcamResponse.blob()
                    console.log('Webcam blob loaded, size:', webcamBlob.size)
                } else {
                    console.warn('Webcam fetch failed with status:', webcamResponse.status)
                }
            } catch (error) {
                console.warn('Failed to fetch webcam video, continuing without it:', error)
            }
            onProgress?.(0.25) // 25% - Webcam loaded or skipped
        } else {
            onProgress?.(0.25) // 25% - Skip webcam
        }

        // Get resolution dimensions
        const dimensions = getResolutionDimensions(options.resolution)

        onProgress?.(0.30) // 30% - Ready to process

        // Process video with canvas (30% to 85%)
        const webmBlob = await processVideoWithCanvas(
            videoBlob,
            webcamBlob,
            dimensions,
            options,
            videoDuration,
            webcamSettings,
            backgroundSettings,
            (progress) => {
                // Map canvas progress (0-1) to overall progress (30%-85%)
                const overallProgress = 0.30 + (progress * 0.55)
                onProgress?.(overallProgress)
            }
        )

        onProgress?.(0.85) // 85% - Canvas processing complete

        // Convert to MP4 if requested and supported (85% to 98%)
        let finalBlob = webmBlob
        let actualFormat = options.format
        
        if (options.format === 'mp4') {
            console.log('MP4 format requested, checking FFmpeg support...')
            const ffmpegSupported = await isFFmpegSupported()
            console.log('FFmpeg supported:', ffmpegSupported)
            
            if (ffmpegSupported) {
                console.log('Converting WebM to MP4...')
                console.log('WebM blob size:', webmBlob.size, 'bytes')
                try {
                    finalBlob = await convertWebMToMP4(webmBlob, (conversionProgress) => {
                        // Map conversion progress (0-1) to overall progress (85%-98%)
                        const overallProgress = 0.85 + (conversionProgress * 0.13)
                        console.log('Conversion progress:', Math.round(conversionProgress * 100) + '%')
                        onProgress?.(overallProgress)
                    })
                    console.log('✅ MP4 conversion complete! Final blob size:', finalBlob.size, 'bytes')
                    console.log('Blob type:', finalBlob.type)
                } catch (error) {
                    console.error('❌ MP4 conversion failed, falling back to WebM:', error)
                    actualFormat = 'webm'
                    // Fall back to WebM if conversion fails
                }
            } else {
                console.warn('⚠️ FFmpeg not supported in this browser, exporting as WebM')
                console.warn('SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined')
                console.warn('Secure context:', typeof window !== 'undefined' ? window.isSecureContext : 'unknown')
                actualFormat = 'webm'
            }
        }
        
        console.log('Final export format:', actualFormat)
        console.log('Final blob size:', finalBlob.size, 'bytes')
        console.log('Final blob type:', finalBlob.type)

        onProgress?.(0.98) // 98% - Finalizing

        return finalBlob
    } catch (error) {
        console.error('Video export error:', error)
        throw error
    }
}

function getResolutionDimensions(resolution: ExportOptions['resolution']): { width: number; height: number } {
    switch (resolution) {
        case '4k':
            return { width: 3840, height: 2160 }
        case '1080p':
            return { width: 1920, height: 1080 }
        case '720p':
            return { width: 1280, height: 720 }
        case '480p':
            return { width: 854, height: 480 }
        case 'original':
        default:
            return { width: 0, height: 0 } // Will use original dimensions
    }
}

async function processVideoWithCanvas(
    videoBlob: Blob,
    webcamBlob: Blob | null,
    dimensions: { width: number; height: number },
    options: ExportOptions,
    knownDuration?: number,
    webcamSettings?: any,
    backgroundSettings?: any,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        try {
            // Create video elements
            const video = document.createElement('video')
            let webcamVideo: HTMLVideoElement | null = null
            
            // Only create webcam video if we have a blob and settings say to use it
            if (webcamBlob && webcamSettings?.visible) {
                webcamVideo = document.createElement('video')
            }

            video.src = URL.createObjectURL(videoBlob)
            if (webcamVideo && webcamBlob) {
                webcamVideo.src = URL.createObjectURL(webcamBlob)
            }

            video.muted = true
            video.preload = 'metadata'
            if (webcamVideo) {
                webcamVideo.muted = true
                webcamVideo.preload = 'metadata'
            }

            // Wait for main video metadata with timeout
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Video metadata loading timeout'))
                }, 10000)
                
                video.onloadedmetadata = () => {
                    clearTimeout(timeout)
                    resolve(null)
                }
                
                video.onerror = () => {
                    clearTimeout(timeout)
                    reject(new Error('Video loading error'))
                }
            })

            // Try to load webcam video, but don't fail if it doesn't work
            if (webcamVideo && webcamBlob) {
                try {
                    await Promise.race([
                        new Promise((resolve) => {
                            webcamVideo!.onloadedmetadata = () => resolve(null)
                            webcamVideo!.onerror = () => resolve(null)
                        }),
                        new Promise((resolve) => setTimeout(resolve, 3000)) // 3 second timeout
                    ])
                    
                    // Check if webcam video actually loaded
                    if (webcamVideo.readyState < 2) {
                        console.warn('Webcam video did not load properly, disabling webcam overlay')
                        webcamVideo.remove()
                        webcamVideo = null
                    }
                } catch (error) {
                    console.warn('Webcam loading failed, continuing without webcam:', error)
                    webcamVideo.remove()
                    webcamVideo = null
                }
            }

            // Check if duration is valid, use known duration if available
            let duration = video.duration
            if (!isFinite(duration) || duration === 0) {
                if (knownDuration && isFinite(knownDuration) && knownDuration > 0) {
                    console.log('Using known duration:', knownDuration, 'seconds')
                    duration = knownDuration
                } else {
                    console.warn('Video duration is invalid, estimating from blob size')
                    // Estimate: ~2MB per second for typical screen recording
                    duration = Math.max(videoBlob.size / (2 * 1024 * 1024), 10)
                    console.log('Estimated duration:', duration, 'seconds')
                }
            }

            console.log('Video info:', {
                duration,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
            })

            // Determine canvas dimensions
            const canvasWidth = dimensions.width || video.videoWidth
            const canvasHeight = dimensions.height || video.videoHeight

            // Create canvas
            const canvas = document.createElement('canvas')
            canvas.width = canvasWidth
            canvas.height = canvasHeight
            const ctx = canvas.getContext('2d')!

            // Setup MediaRecorder
            const stream = canvas.captureStream(options.fps)
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: getVideoBitrate(options.quality, canvasWidth, canvasHeight)
            })

            const chunks: Blob[] = []
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' })
                URL.revokeObjectURL(video.src)
                if (webcamVideo && webcamVideo.src) {
                    URL.revokeObjectURL(webcamVideo.src)
                }
                console.log('Export complete, blob size:', blob.size)
                resolve(blob)
            }

            mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder error:', error)
                reject(error)
            }

            // Start recording
            mediaRecorder.start(100) // Collect data every 100ms
            
            // Play videos
            await video.play()
            if (webcamVideo) {
                try {
                    await webcamVideo.play()
                } catch (error) {
                    console.warn('Failed to play webcam video:', error)
                    webcamVideo = null
                }
            }

            // Render frames
            const fps = options.fps
            const frameInterval = 1000 / fps
            let lastFrameTime = 0
            let currentFrame = 0
            const totalFrames = Math.floor(duration * fps)
            const startTime = Date.now()

            console.log('Starting render:', { duration, fps, totalFrames })

            const renderFrame = (timestamp: number) => {
                if (timestamp - lastFrameTime >= frameInterval) {
                    // Clear canvas
                    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

                    // Draw background if needed
                    if (backgroundSettings) {
                        drawBackground(ctx, canvasWidth, canvasHeight, backgroundSettings)
                    }

                    // Calculate padding
                    const padding = backgroundSettings?.padding || 0
                    const paddingPx = (canvasWidth * padding) / 100
                    const videoX = paddingPx
                    const videoY = paddingPx
                    const videoWidth = canvasWidth - paddingPx * 2
                    const videoHeight = canvasHeight - paddingPx * 2

                    // Draw main video
                    ctx.drawImage(video, videoX, videoY, videoWidth, videoHeight)

                    // Draw webcam overlay if enabled
                    if (webcamVideo && webcamSettings?.visible) {
                        drawWebcamOverlay(
                            ctx,
                            webcamVideo,
                            webcamSettings,
                            canvasWidth,
                            canvasHeight
                        )
                    }

                    lastFrameTime = timestamp
                    currentFrame++

                    // Update progress (clamp between 0 and 1)
                    const progress = Math.min(currentFrame / totalFrames, 1)
                    onProgress?.(progress)
                }

                // Check if we should continue rendering
                const elapsed = (Date.now() - startTime) / 1000
                const shouldContinue = video.currentTime < duration && 
                                      elapsed < duration + 5 && // Add 5 second buffer
                                      !video.ended

                if (shouldContinue) {
                    requestAnimationFrame(renderFrame)
                } else {
                    console.log('Stopping render:', {
                        currentTime: video.currentTime,
                        duration,
                        elapsed,
                        ended: video.ended,
                        framesRendered: currentFrame
                    })
                    mediaRecorder.stop()
                }
            }

            requestAnimationFrame(renderFrame)
        } catch (error) {
            console.error('processVideoWithCanvas error:', error)
            reject(error)
        }
    })
}

function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: any
) {
    const { type, backgroundColor, gradientColors } = settings

    switch (type) {
        case 'color':
            ctx.fillStyle = backgroundColor || '#000000'
            ctx.fillRect(0, 0, width, height)
            break
        case 'gradient':
            const gradient = ctx.createLinearGradient(0, 0, width, height)
            gradient.addColorStop(0, gradientColors?.[0] || '#ff6b6b')
            gradient.addColorStop(1, gradientColors?.[1] || '#4ecdc4')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)
            break
        default:
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, width, height)
    }
}

function drawWebcamOverlay(
    ctx: CanvasRenderingContext2D,
    webcamVideo: HTMLVideoElement,
    settings: any,
    canvasWidth: number,
    canvasHeight: number
) {
    const { position, size, shape, borderWidth, borderColor } = settings

    // Calculate position as percentage of canvas
    const x = (canvasWidth * position.x) / 100
    const y = (canvasHeight * position.y) / 100
    const width = size.width
    const height = size.height

    ctx.save()

    // Create clipping path based on shape
    if (shape === 'circle') {
        const radius = Math.min(width, height) / 2
        ctx.beginPath()
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
        ctx.clip()
    } else if (shape === 'square') {
        const size = Math.min(width, height)
        ctx.beginPath()
        ctx.rect(x, y, size, size)
        ctx.clip()
    } else {
        // Rectangle with rounded corners
        ctx.beginPath()
        roundRect(ctx, x, y, width, height, 12)
        ctx.clip()
    }

    // Draw webcam video
    ctx.drawImage(webcamVideo, x, y, width, height)

    ctx.restore()

    // Draw border
    if (borderWidth > 0) {
        ctx.strokeStyle = borderColor || '#3b82f6'
        ctx.lineWidth = borderWidth

        if (shape === 'circle') {
            const radius = Math.min(width, height) / 2
            ctx.beginPath()
            ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
            ctx.stroke()
        } else if (shape === 'square') {
            const size = Math.min(width, height)
            ctx.strokeRect(x, y, size, size)
        } else {
            ctx.beginPath()
            roundRect(ctx, x, y, width, height, 12)
            ctx.stroke()
        }
    }
}

function getVideoBitrate(quality: ExportOptions['quality'], width: number, height: number): number {
    const pixelCount = width * height
    const baseRate = pixelCount / 1000 // Base rate per 1000 pixels

    switch (quality) {
        case 'high':
            return baseRate * 8000 // 8 Mbps per megapixel
        case 'medium':
            return baseRate * 5000 // 5 Mbps per megapixel
        case 'low':
            return baseRate * 3000 // 3 Mbps per megapixel
        default:
            return baseRate * 5000
    }
}

// Helper function for rounded rectangles (fallback for browsers without roundRect)
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x, y, width, height, radius)
    } else {
        // Fallback implementation
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
    }
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
