# Export Fix - Duration and Progress Issues

## Problems Identified

### 1. Video Duration = Infinity
**Issue**: MediaRecorder-generated video blobs don't have proper duration metadata, causing `video.duration` to return `Infinity`.

**Impact**: 
- Export couldn't calculate total frames
- Progress calculation failed (currentFrame / Infinity = 0)
- Video rendering never stopped

### 2. Progress Showing 6000%
**Issue**: Progress was being calculated incorrectly when duration was Infinity.

**Calculation**:
```
progress = currentFrame / totalFrames
totalFrames = Infinity * 30 = Infinity
progress = 60 / Infinity = 0 (but displayed as 6000% due to bug)
```

## Solutions Implemented

### 1. Pass Known Duration from VideoEditor
```typescript
// VideoEditor.tsx
const exportedBlob = await processVideoExport({
    videoUrl,
    videoDuration: duration, // ✅ Pass actual duration from video element
    // ... other options
})
```

### 2. Use Known Duration in Exporter
```typescript
// lib/videoExporter.ts
let duration = video.duration

if (!isFinite(duration) || duration === 0) {
    if (knownDuration && isFinite(knownDuration) && knownDuration > 0) {
        console.log('Using known duration:', knownDuration)
        duration = knownDuration // ✅ Use passed duration
    } else {
        // Fallback: estimate from blob size
        duration = Math.max(videoBlob.size / (2 * 1024 * 1024), 10)
    }
}
```

### 3. Improved Progress Calculation
```typescript
// Clamp progress between 0 and 1
const progress = Math.min(currentFrame / totalFrames, 1)
onProgress?.(progress)
```

### 4. Better Render Loop Control
```typescript
const startTime = Date.now()
const elapsed = (Date.now() - startTime) / 1000

const shouldContinue = 
    video.currentTime < duration && 
    elapsed < duration + 5 && // Add 5 second buffer
    !video.ended

if (shouldContinue) {
    requestAnimationFrame(renderFrame)
} else {
    mediaRecorder.stop()
}
```

### 5. Enhanced Error Handling
```typescript
// Timeout for metadata loading
await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
        reject(new Error('Video metadata loading timeout'))
    }, 10000)
    
    video.onloadedmetadata = () => {
        clearTimeout(timeout)
        resolve(null)
    }
})
```

### 6. Better MediaRecorder Configuration
```typescript
const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9', // ✅ Explicit codec
    videoBitsPerSecond: getVideoBitrate(quality, width, height)
})

mediaRecorder.start(100) // ✅ Collect data every 100ms
```

## How It Works Now

### Export Flow
1. **VideoEditor** has the actual video duration from the loaded video element
2. **VideoEditor** passes `duration` to `processVideoExport()`
3. **Exporter** tries to get duration from video blob
4. If duration is invalid (Infinity/0), uses the passed `knownDuration`
5. Calculates `totalFrames = duration * fps`
6. Renders frames and updates progress: `currentFrame / totalFrames`
7. Progress is clamped to 0-1 range
8. Stops when video ends OR elapsed time exceeds duration

### Progress Calculation
```
Known duration: 60 seconds
FPS: 30
Total frames: 60 * 30 = 1800

Frame 1: 1/1800 = 0.055% → 0.0005 → 0.05%
Frame 900: 900/1800 = 50% → 0.5 → 50%
Frame 1800: 1800/1800 = 100% → 1.0 → 100%
```

### Mapped to Overall Progress (30%-95%)
```
Canvas 0% → Overall 30%
Canvas 50% → Overall 62.5%
Canvas 100% → Overall 95%
```

## Testing Results

### Before Fix
- ❌ Duration: Infinity
- ❌ Progress: 6000%
- ❌ Export never completes
- ❌ Browser hangs

### After Fix
- ✅ Duration: Actual video duration (e.g., 60 seconds)
- ✅ Progress: 0% → 100% smoothly
- ✅ Export completes successfully
- ✅ File downloads automatically

## Additional Improvements

### Logging
Added comprehensive logging for debugging:
```typescript
console.log('Video info:', {
    duration,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    readyState: video.readyState
})

console.log('Starting render:', { duration, fps, totalFrames })

console.log('Stopping render:', {
    currentTime: video.currentTime,
    duration,
    elapsed,
    ended: video.ended,
    framesRendered: currentFrame
})
```

### Preload Metadata
```typescript
video.preload = 'metadata'
```

### Better Codec Support
```typescript
mimeType: 'video/webm;codecs=vp9'
```

## Known Limitations

1. **WebM Output Only**: Currently exports as WebM (not true MP4)
2. **Duration Estimation**: If no duration available, estimates from file size
3. **Browser Support**: Requires MediaRecorder API support
4. **Memory Usage**: Large videos may consume significant memory

## Future Enhancements

- [ ] Add FFmpeg.wasm for true MP4 export with proper metadata
- [ ] Support for trimming during export
- [ ] Better duration detection methods
- [ ] Chunked processing for large videos
- [ ] Background export with Web Workers

## Files Modified

1. `lib/videoExporter.ts`
   - Added `videoDuration` parameter
   - Improved duration detection
   - Better progress calculation
   - Enhanced error handling

2. `components/VideoEditor.tsx`
   - Pass `duration` to exporter
   - Better error messages

3. `components/ExportDialog.tsx`
   - Already had proper progress display
   - No changes needed

## Verification Steps

1. ✅ Record a video
2. ✅ Click Export
3. ✅ Select resolution and quality
4. ✅ Click "Export Video"
5. ✅ Progress bar shows 0-100%
6. ✅ Stage messages update correctly
7. ✅ Export completes
8. ✅ File downloads
9. ✅ Video plays correctly

## Console Output (Expected)

```
Starting export with options: {resolution: "1080p", format: "mp4", ...}
Using known duration: 60 seconds
Video info: {duration: 60, videoWidth: 1920, videoHeight: 1080, ...}
Starting render: {duration: 60, fps: 30, totalFrames: 1800}
Export progress: 5%
Export progress: 10%
...
Export progress: 95%
Stopping render: {currentTime: 60, duration: 60, elapsed: 60.1, ...}
Export complete, blob size: 12345678
```
