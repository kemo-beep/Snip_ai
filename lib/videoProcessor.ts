import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

export async function initializeFFmpeg() {
    if (ffmpeg) return ffmpeg

    ffmpeg = new FFmpeg()

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    return ffmpeg
}

export async function trimVideo(
    videoBlob: Blob,
    startTime: number,
    endTime: number
): Promise<Blob> {
    const ffmpeg = await initializeFFmpeg()

    // Write input file
    await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob))

    // Calculate duration
    const duration = endTime - startTime

    // Run FFmpeg command to trim video
    await ffmpeg.exec([
        '-i', 'input.webm',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        'output.webm'
    ])

    // Read output file
    const data = await ffmpeg.readFile('output.webm')

    // Clean up
    await ffmpeg.deleteFile('input.webm')
    await ffmpeg.deleteFile('output.webm')

    return new Blob([data], { type: 'video/webm' })
}

export async function mergeVideos(videoBlobs: Blob[]): Promise<Blob> {
    const ffmpeg = await initializeFFmpeg()

    // Write input files
    for (let i = 0; i < videoBlobs.length; i++) {
        await ffmpeg.writeFile(`input${i}.webm`, await fetchFile(videoBlobs[i]))
    }

    // Create concat file
    const concatContent = videoBlobs.map((_, i) => `file 'input${i}.webm'`).join('\n')
    await ffmpeg.writeFile('concat.txt', concatContent)

    // Run FFmpeg command to merge videos
    await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        'output.webm'
    ])

    // Read output file
    const data = await ffmpeg.readFile('output.webm')

    // Clean up
    for (let i = 0; i < videoBlobs.length; i++) {
        await ffmpeg.deleteFile(`input${i}.webm`)
    }
    await ffmpeg.deleteFile('concat.txt')
    await ffmpeg.deleteFile('output.webm')

    return new Blob([data], { type: 'video/webm' })
}

export async function addTextOverlay(
    videoBlob: Blob,
    text: string,
    x: number,
    y: number,
    startTime: number,
    endTime: number
): Promise<Blob> {
    const ffmpeg = await initializeFFmpeg()

    // Write input file
    await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob))

    // Run FFmpeg command to add text overlay
    await ffmpeg.exec([
        '-i', 'input.webm',
        '-vf', `drawtext=text='${text}':x=${x}:y=${y}:fontsize=24:fontcolor=white:enable='between(t,${startTime},${endTime})'`,
        '-c:a', 'copy',
        'output.webm'
    ])

    // Read output file
    const data = await ffmpeg.readFile('output.webm')

    // Clean up
    await ffmpeg.deleteFile('input.webm')
    await ffmpeg.deleteFile('output.webm')

    return new Blob([data], { type: 'video/webm' })
}

export async function convertToMP4(videoBlob: Blob): Promise<Blob> {
    const ffmpeg = await initializeFFmpeg()

    // Write input file
    await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob))

    // Run FFmpeg command to convert to MP4
    await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        'output.mp4'
    ])

    // Read output file
    const data = await ffmpeg.readFile('output.mp4')

    // Clean up
    await ffmpeg.deleteFile('input.webm')
    await ffmpeg.deleteFile('output.mp4')

    return new Blob([data], { type: 'video/mp4' })
}
