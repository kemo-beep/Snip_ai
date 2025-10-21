# Fix: Clip Moving to Different Track During Resize

## Issue
When resizing a clip by dragging its edges, the clip would move vertically to a different track and sometimes disappear.

## Root Cause
The `@xzdarcy/react-timeline-editor` library allows clips to move between tracks during resize operations by default. The `onActionResizing` callback receives a `row` parameter that can be different from the clip's original track.

## Solution

### 1. Track Change Detection in Resize Handler
Added a check in `handleActionResizingFinal` to detect and block track changes during resize:

```typescript
const handleActionResizingFinal = useCallback(
    (params: { action: TimelineAction; row: TimelineRow; start: number; end: number; dir: "right" | "left" }) => {
        const { action, start, end, dir, row } = params

        // Check if action is flexible
        if (!action.flexible) {
            return false
        }

        // CRITICAL: Prevent clip from moving to a different track during resize
        const clip = clips.find(c => c.id === action.id)
        if (clip && clip.trackId !== row.id) {
            console.warn(`Resize blocked: Clip ${action.id} trying to move from track ${clip.trackId} to ${row.id}`)
            return false // Block the resize if it would move the clip to a different track
        }

        // ... rest of constraints and validation
        return true
    },
    [isSnapping, duration, clips], // Added 'clips' to dependencies
)
```

### 2. Track Change Handling in onChange
Updated `handleTimelineChangeFinal` to properly handle track changes when they do occur (during move operations):

```typescript
const handleTimelineChangeFinal = useCallback(
    (editorData: TimelineRow[]) => {
        editorData.forEach((row) => {
            row.actions.forEach((action) => {
                const clip = clips.find((c) => c.id === action.id)
                if (clip) {
                    const updates: Partial<Clip> = {
                        startTime: action.start,
                        endTime: action.end,
                    }
                    
                    // Only update trackId if it actually changed
                    if (clip.trackId !== row.id) {
                        console.log(`Clip ${clip.name} moved from track ${clip.trackId} to ${row.id}`)
                        updates.trackId = row.id
                    }
                    
                    onUpdateClip(clipId, updates)
                }
            })
        })
    },
    [clips, onUpdateClip],
)
```

### 3. Added Move Handlers
Added proper move start and end handlers for better tracking:

```typescript
const handleActionMoveStart = useCallback(
    (params: { action: TimelineAction; row: TimelineRow }) => {
        console.log(`Started moving clip ${params.action.id}`)
    },
    [],
)

const handleActionMoveEnd = useCallback(
    (params: { action: TimelineAction; row: TimelineRow; start: number; end: number }) => {
        console.log(`Finished moving clip ${params.action.id} to track ${params.row.id}`)
    },
    [],
)
```

### 4. Updated Timeline Component Props
Added the move handlers to the Timeline component:

```typescript
<Timeline
    // ... other props
    onActionMoveStart={handleActionMoveStart}
    onActionMoving={handleActionMovingFinal}
    onActionMoveEnd={handleActionMoveEnd}
    onActionResizeStart={handleActionResizeStart}
    onActionResizing={handleActionResizingFinal}
    onActionResizeEnd={handleActionResizeEnd}
    // ... other props
/>
```

## How It Works Now

### Resize Operation (Horizontal Only)
1. User hovers over clip edge
2. User drags edge left or right
3. `onActionResizing` called with current row
4. **Check**: Is `row.id` same as `clip.trackId`?
   - ✅ Yes → Allow resize, apply constraints
   - ❌ No → Block resize, return `false`
5. Clip resizes horizontally on its track

### Move Operation (Horizontal and Vertical)
1. User clicks and drags clip body
2. `onActionMoving` called with current row
3. **No track restriction** → Allow move to any track
4. Clip moves to new position and/or track
5. `onChange` updates both position and trackId

## Key Differences

| Operation | Horizontal Movement | Vertical Movement | Track Change |
|-----------|-------------------|-------------------|--------------|
| **Resize** | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| **Move** | ✅ Allowed | ✅ Allowed | ✅ Allowed |

## Testing

### Test 1: Resize on Same Track ✅
1. Hover over clip edge
2. Drag left or right
3. **Expected**: Clip resizes horizontally, stays on same track

### Test 2: Try to Resize to Different Track ❌
1. Hover over clip edge
2. Drag diagonally (up/down and left/right)
3. **Expected**: Resize blocked, console warning appears
4. **Console**: `Resize blocked: Clip X trying to move from track A to B`

### Test 3: Move to Different Track ✅
1. Click clip body (not edge)
2. Drag vertically to different track
3. **Expected**: Clip moves to new track
4. **Console**: `Clip X moved from track A to B`

### Test 4: Resize Near Track Boundary ✅
1. Position clip near track edge
2. Resize clip edge
3. **Expected**: Clip stays on track, doesn't jump to adjacent track

## Console Logging

Added helpful debug messages:

### Resize Blocked
```
Resize blocked: Clip recorded-video-123 trying to move from track video-1 to effect-1
```

### Track Change During Move
```
Clip Recorded Video moved from track video-1 to effect-1
```

### Normal Resize
```
Resizing clip recorded-video-123: left edge, start=1.000s, end=5.000s, duration=4.000s
```

## Code Changes

### Files Modified
1. `components/MultiTrackTimeline.tsx`
   - Added track change detection in `handleActionResizingFinal`
   - Updated `handleTimelineChangeFinal` to handle track changes
   - Added `handleActionMoveStart` and `handleActionMoveEnd`
   - Added move handlers to Timeline component
   - Added `clips` to resize handler dependencies

## Why This Approach

### Alternative Approaches Considered

1. **CSS pointer-events**: Wouldn't work because library handles drag internally
2. **Disable vertical drag globally**: Would prevent intentional track changes during move
3. **Lock all clips**: Would prevent all movement, not just vertical during resize

### Chosen Approach Benefits

✅ Allows resize horizontally (intended behavior)
✅ Blocks resize vertically (prevents bug)
✅ Still allows move to different tracks (intended feature)
✅ Clear console warnings for debugging
✅ Minimal code changes
✅ Works with library's callback system

## Edge Cases Handled

1. **Resize near track boundary**: Blocked if would cross to adjacent track
2. **Fast diagonal drag during resize**: Blocked immediately
3. **Move vs Resize**: Different behaviors correctly applied
4. **Multiple tracks**: Works with any number of tracks
5. **Locked clips**: Already blocked by `flexible: false`

## Known Limitations

1. **Visual feedback**: No visual indicator that vertical movement is blocked during resize (could add cursor change)
2. **User confusion**: User might not understand why diagonal drag doesn't work during resize (could add tooltip)

## Future Enhancements

1. Add visual feedback when resize is blocked (e.g., red outline)
2. Add tooltip explaining resize is horizontal-only
3. Add setting to allow/disallow track changes during move
4. Add ripple editing (move subsequent clips when resizing)

---

**Status**: ✅ Fixed! Clips now stay on their track during resize operations.
