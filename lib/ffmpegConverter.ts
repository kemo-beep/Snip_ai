import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let isLoading = false
let isLoaded = false

export async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    if (ffmpegInstance && isLoaded) {
        return ffmpegInstance
    }

    if (isLoading) {
        // Wait for the current loading to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        if (ffmpegInstance && isLoaded) {
            return ffmpegInstance
        }
    }

    isLoading = true

    try {
        ffmpegInstance = new FFmpeg()

        // Set up logging
        ffmpegInstance.on('log', ({ message }) => {
            console.log('[FFmpeg]', message)
        })

        // Set up progress tracking
        ffmpegInstance.on('progress', ({ progress, time }) => {
            console.log(`[FFmpeg] Progress: ${(progress * 100).toFixed(2)}% (time: ${time}ms)`)
            onProgress?.(progress)
        })

        // Load FFmpeg core from CDN
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        
        await ffmpegInstance.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        isLoaded = true
        console.log('[FFmpeg] Loaded successfully')
        
        return ffmpegInstance
    } catch (error) {
        console.error('[FFmpeg] Failed to load:', error)
        ffmpegInstance = null
        isLoaded = false
        throw error
    } finally {
        isLoading = false
    }
}

export async function convertWebMToMP4(
    webmBlob: Blob,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    try {
        console.log('[FFmpeg] Starting WebM to MP4 conversion')
        console.log('[FFmpeg] Input blob size:', webmBlob.size)

        // Load FFmpeg
        onProgress?.(0.1) // 10% - Loading FFmpeg
        const ffmpeg = await loadFFmpeg((loadProgress) => {
            // Map FFmpeg loading to 10-20% of overall progress
            onProgress?.(0.1 + loadProgress * 0.1)
        })

        onProgress?.(0.2) // 20% - FFmpeg loaded

        // Write input file
        console.log('[FFmpeg] Writing input file')
        await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob))
        onProgress?.(0.25) // 25% - Input written

        // Convert WebM to MP4
        console.log('[FFmpeg] Starting conversion')
        await ffmpeg.exec([
            '-i', 'input.webm',
            '-c:v', 'libx264',      // H.264 video codec
            '-preset', 'fast',       // Encoding speed
            '-crf', '23',            // Quality (lower = better, 18-28 is good range)
            '-c:a', 'aac',           // AAC audio codec
            '-b:a', '128k',          // Audio bitrate
            '-movflags', '+faststart', // Enable streaming
            'output.mp4'
        ])

        onProgress?.(0.9) // 90% - Conversion complete

        // Read output file
        console.log('[FFmpeg] Reading output file')
        const data = await ffmpeg.readFile('output.mp4')
        const mp4Blob = new Blob([data], { type: 'video/mp4' })
        
        console.log('[FFmpeg] Output blob size:', mp4Blob.size)
        onProgress?.(0.95) // 95% - Output read

        // Clean up
        try {
            await ffmpeg.deleteFile('input.webm')
            await ffmpeg.deleteFile('output.mp4')
        } catch (error) {
            console.warn('[FFmpeg] Cleanup warning:', error)
        }

        onProgress?.(1.0) // 100% - Complete
        console.log('[FFmpeg] Conversion complete')

        return mp4Blob
    } catch (error) {
        console.error('[FFmpeg] Conversion error:', error)
        throw new Error(`Failed to convert video to MP4: ${error}`)
    }
}

export async function isFFmpegSupported(): Promise<boolean> {
    try {
        // Check if SharedArrayBuffer is available (required for FFmpeg)
        if (typeof SharedArrayBuffer === 'undefined') {
            console.error('[FFmpeg] ❌ SharedArrayBuffer not available')
            console.error('[FFmpeg] This usually means the required HTTP headers are not set')
            console.error('[FFmpeg] Required headers:')
            console.error('[FFmpeg]   - Cross-Origin-Opener-Policy: same-origin')
            console.error('[FFmpeg]   - Cross-Origin-Embedder-Policy: require-corp')
            return false
        }

        // Check if we're in a secure context (required for some features)
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            console.warn('[FFmpeg] ⚠️ Not in secure context (HTTPS required)')
            return false
        }

        console.log('[FFmpeg] ✅ Environment check passed')
        console.log('[FFmpeg] SharedArrayBuffer:', typeof SharedArrayBuffer)
        console.log('[FFmpeg] Secure context:', typeof window !== 'undefined' ? window.isSecureContext : 'N/A')
        
        return true
    } catch (error) {
        console.error('[FFmpeg] Support check failed:', error)
        return false
    }
}

export function getFFmpegStatus(): {
    isLoaded: boolean
    isLoading: boolean
    isSupported: boolean
} {
    return {
        isLoaded,
        isLoading,
        isSupported: typeof SharedArrayBuffer !== 'undefined'
    }
}
