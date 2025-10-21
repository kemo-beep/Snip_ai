# Webcam Overlay Implementation

## Overview
This implementation allows recording both screen and webcam separately, then displaying them on different timeline tracks with the webcam as a small overlay on top of the main video.

## Changes Made

### 1. VideoRecorder.tsx
- **Updated interface**: `onVideoRecorded` now accepts both `videoBlob` and optional `webcamBlob`
- **Separate recorders**: Added `webcamRecorderRef` and `webcamStreamRef` to record webcam independently
- **Separate chunks**: Added `webcamChunksRef` to store webcam recording data separately
- **Dual recording**: Both screen and webcam are recorded simultaneously using separate MediaRecorder instances
- **Cleanup**: Both streams are properly stopped and cleaned up

**Key changes:**
```typescript
// Now records both streams separately
const screenRecorder = new MediaRecorder(screenStream, { mimeType })
const webcamRecorder = new MediaRecorder(webcamStream, { mimeType })

// Both start at the same time
screenRecorder.start(100)
webcamRecorder.start(100)

// Callback includes both blobs
onVideoRecorded(screenBlob, webcamBlob)
```

### 2. VideoEditor.tsx
- **Updated interface**: Added optional `webcamUrl` prop
- **Webcam video ref**: Added `webcamVideoRef` to control webcam video playback
- **Sync playback**: Webcam video syncs with main video (play, pause, seek)
- **Overlay display**: Webcam appears as draggable, resizable overlay on top of main video
- **Timeline integration**: Added `addWebcamClip()` function to add webcam to effect track
- **Visual styling**: Webcam overlay has border, shadow, and label for better UX

**Key features:**
- Webcam overlay is draggable (click and drag)
- Webcam overlay is resizable (drag bottom-right corner)
- Webcam video stays in sync with main video
- Webcam appears on "Effect Track 1" in the timeline
- Default size: 200x150px at position (20, 20)

### 3. app/page.tsx
- **State management**: Added `webcamVideo` and `webcamUrl` state
- **Pass to editor**: VideoEditor now receives `webcamUrl` prop
- **Cleanup**: Both video URLs are cleared when resetting

### 4. MultiTrackTimeline.tsx
- **Track structure**: 
  - Video Track 1: Main screen recording
  - Effect Track 1: Webcam overlay
  - Text Track 1: Text overlays
- **Visual distinction**: Each track has different colors and heights
- **Clip rendering**: Webcam clips show thumbnail and can be moved/resized

## How It Works

### Recording Flow
1. User clicks "Start Recording"
2. Browser requests screen sharing permission
3. Browser requests webcam permission
4. Two separate MediaRecorder instances start:
   - Screen recorder (with audio)
   - Webcam recorder (video only, no audio)
5. Both record simultaneously
6. When stopped, both blobs are passed to the editor

### Editor Flow
1. Main video loads on Video Track 1
2. Webcam video loads on Effect Track 1
3. Both appear in timeline as separate clips
4. Webcam overlay appears on video preview
5. User can:
   - Drag webcam overlay to reposition
   - Resize webcam overlay
   - Edit both clips independently in timeline
   - Trim, split, or adjust timing of either video

### Playback Sync
- When main video plays, webcam video plays
- When main video pauses, webcam video pauses
- When seeking, both videos seek to same time
- Time difference is monitored and corrected if > 0.1s

## Timeline Tracks

```
┌─────────────────────────────────────┐
│ Video Track 1 (Blue)                │  ← Main screen recording
│ [████████████████████████████████]  │
├─────────────────────────────────────┤
│ Effect Track 1 (Purple)             │  ← Webcam overlay
│ [████████████████████████████████]  │
├─────────────────────────────────────┤
│ Text Track 1 (Teal)                 │  ← Text overlays
│                                     │
└─────────────────────────────────────┘
```

## Visual Layout

```
┌─────────────────────────────────────────┐
│  Main Video Preview                     │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   Screen Recording              │    │
│  │                                 │    │
│  │   ┌──────────┐                  │    │
│  │   │ Webcam   │ ← Draggable      │    │
│  │   │ Overlay  │   & Resizable    │    │
│  │   └──────────┘                  │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Benefits

1. **Separate control**: Edit screen and webcam independently
2. **Flexible positioning**: Move and resize webcam overlay
3. **Professional look**: Clean overlay with border and label
4. **Timeline editing**: Full control over timing and placement
5. **Sync playback**: Both videos stay perfectly synchronized

## Future Enhancements

- [ ] Add webcam shape options (circle, rounded square)
- [ ] Add webcam border color/style options
- [ ] Add fade in/out effects for webcam
- [ ] Allow webcam to be moved between tracks
- [ ] Add picture-in-picture presets (corners, center)
- [ ] Export with webcam overlay baked in
