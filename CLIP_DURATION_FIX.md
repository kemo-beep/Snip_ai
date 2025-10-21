# Fix: Clip Duration Not Matching Video Duration

## Issue
The recorded video clip on the timeline always shows 00:10 (10 seconds) or 00:60 (60 seconds) instead of the actual video duration. For example, a 5-second video would show as 10 seconds on the timeline.

## Root Cause
The video loading logic had multiple fallback mechanisms that would use hardcoded durations (10s or 60s) when the actual video duration wasn't immediately available. This happened because:

1. **Fallback values**: Code used `10` and `60` as default durations
2. **Missing durationchange event**: Didn't listen for the `durationchange` event which fires when duration becomes available
3. **Premature clip creation**: Created clips before video duration was known
4. **No clip updates**: Once a clip was created with wrong duration, it was never updated

## Solution

### 1. Added `durationchange` Event Listener
The `durationchange` event is specifically designed to fire when the video duration becomes available:

```typescript
const handleDurationChange = () => {
    console.log('Duration changed event, new duration:', video.duration)
    if (isFinite(video.duration) && video.duration > 0) {
        console.log('✅ Setting duration from durationchange:', video.duration)
        setDuration(video.duration)
        setTrimRange({ start: 0, end: video.duration })
        setIsVideoReady(true)
        addRecordedVideoClip(video.duration)
    }
}

video.addEventListener('durationchange', handleDurationChange)
```

### 2. Updated Clip Creation to Update Existing Clips
Modified `addRecordedVideoClip` to update existing clips instead of ignoring them:

```typescript
const addRecordedVideoClip = (duration: number) => {
    if (videoUrl && duration > 0) {
        setClips(prev => {
            const existingIndex = prev.findIndex(clip => clip.name === 'Recorded Video')
            
            if (existingIndex !== -1) {
                // Update existing clip with correct duration
                console.log('Updating existing recorded video clip duration from', 
                    prev[existingIndex].endTime, 'to', duration)
                const updated = [...prev]
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    duration: duration,
                    endTime: duration,
                }
                return updated
            }

            // Add new clip
            return [...prev, newClip]
        })
    }
}
```

### 3. Removed Hardcoded Fallback Durations
Changed fallback logic to wait for actual duration instead of using fake values:

```typescript
// BEFORE:
console.log('Using fallback duration for recorded video clip')
addRecordedVideoClip(10) // ❌ Hardcoded 10 seconds

// AFTER:
console.warn('⚠️ Video duration not available yet, will retry on durationchange event')
// ✅ Wait for actual duration
```

### 4. Improved Logging
Added clear logging with emojis to track video loading:

- ✅ Success: Duration detected
- ⚠️ Warning: Duration not available yet
- 🔍 Debug: Checking video state

## How It Works Now

### Video Loading Flow

```
1. Video element created
   ↓
2. video.load() called
   ↓
3. Events fire in sequence:
   - loadstart
   - loadedmetadata (duration might be available)
   - loadeddata (duration should be available)
   - durationchange (duration definitely available) ← NEW!
   - canplay
   ↓
4. Duration detected → Clip created/updated with correct duration
```

### Event Priority

| Event | When Duration Available | Action |
|-------|------------------------|--------|
| `loadedmetadata` | Sometimes | Try to get duration |
| `loadeddata` | Usually | Try to get duration |
| `durationchange` | Always | Get duration (NEW!) |
| `canplay` | Always | Get duration |

### Fallback Strategy

```
Immediate check (500ms)
  ↓ Duration available? → ✅ Use it
  ↓ Not available? → ⚠️ Wait
  ↓
Longer check (1500ms)
  ↓ Duration available? → ✅ Use it
  ↓ Not available? → ⚠️ Wait
  ↓
Final timeout (3000ms)
  ↓ Duration available? → ✅ Use it
  ↓ Not available? → ⚠️ Show editor without clip
```

## Testing

### Test 1: 5-Second Video ✅
1. Record a 5-second video
2. Open in editor
3. **Expected**: Clip shows 00:05 duration
4. **Console**: `✅ Setting duration from durationchange: 5`

### Test 2: 30-Second Video ✅
1. Record a 30-second video
2. Open in editor
3. **Expected**: Clip shows 00:30 duration
4. **Console**: `✅ Setting duration from durationchange: 30`

### Test 3: Very Short Video (1s) ✅
1. Record a 1-second video
2. Open in editor
3. **Expected**: Clip shows 00:01 duration
4. **Console**: `✅ Setting duration from durationchange: 1`

### Test 4: Long Video (2min) ✅
1. Record a 2-minute video
2. Open in editor
3. **Expected**: Clip shows 02:00 duration
4. **Console**: `✅ Setting duration from durationchange: 120`

## Console Output Examples

### Successful Load
```
Video element found, attempting to load: blob:http://...
Video load started
Video metadata loaded, duration: 5.234
✅ Valid video duration detected: 5.234
Adding/updating recorded video clip with duration: 5.234
Adding new recorded video clip: {duration: 5.234, endTime: 5.234, ...}
```

### Load with durationchange
```
Video element found, attempting to load: blob:http://...
Video load started
Video can play, readyState: 4, duration: NaN
⚠️ Video duration not available yet, will retry on durationchange event
Duration changed event, new duration: 5.234
✅ Setting duration from durationchange: 5.234
Adding/updating recorded video clip with duration: 5.234
```

### Update Existing Clip
```
Duration changed event, new duration: 5.234
✅ Setting duration from durationchange: 5.234
Adding/updating recorded video clip with duration: 5.234
Updating existing recorded video clip duration from 10 to 5.234
```

## Code Changes

### Files Modified
1. `components/VideoEditor.tsx`
   - Added `handleDurationChange` event handler
   - Updated `addRecordedVideoClip` to update existing clips
   - Removed hardcoded fallback durations (10s, 60s)
   - Added `durationchange` event listener
   - Improved logging with emojis
   - Added duration validation (`duration > 0`)

### Key Changes

#### Before
```typescript
// Hardcoded fallback
addRecordedVideoClip(10) // ❌

// Ignored existing clips
if (existingRecordedVideo) {
    return prev // ❌ Don't update
}
```

#### After
```typescript
// Wait for actual duration
console.warn('⚠️ Will wait for durationchange event') // ✅

// Update existing clips
if (existingIndex !== -1) {
    updated[existingIndex] = {
        ...updated[existingIndex],
        duration: duration,
        endTime: duration,
    }
    return updated // ✅ Update with correct duration
}
```

## Why This Approach

### Alternative Approaches Considered

1. **Poll video.duration**: Would waste CPU cycles
2. **Increase timeout**: Wouldn't solve the root cause
3. **Use metadata from recording**: Not always available

### Chosen Approach Benefits

✅ Uses native browser event (`durationchange`)
✅ Updates clips when duration becomes available
✅ No hardcoded fallback values
✅ Works with any video duration
✅ Efficient (event-driven, not polling)
✅ Clear logging for debugging

## Edge Cases Handled

1. **Duration available immediately**: Uses it right away
2. **Duration delayed**: Waits for `durationchange` event
3. **Duration never available**: Shows editor without clip (rare)
4. **Clip already exists**: Updates it with correct duration
5. **Multiple duration changes**: Last value wins
6. **Invalid duration (NaN, Infinity)**: Ignored, waits for valid value

## Known Limitations

1. **Blob URLs**: Some blob URLs might not provide duration immediately
2. **Streaming videos**: Duration might change during playback
3. **Corrupted videos**: Might never provide valid duration

## Future Enhancements

1. Show loading indicator while waiting for duration
2. Add manual duration input if detection fails
3. Support for videos without duration metadata
4. Better error handling for corrupted videos

---

**Status**: ✅ Fixed! Clips now show the actual video duration.
