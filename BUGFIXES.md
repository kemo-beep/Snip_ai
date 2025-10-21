# Bug Fixes - Timeline Resize and Split Issues

## Issues Fixed

### 1. Clip Resizing Not Working ❌ → ✅

**Problem**: When hovering over clip edges and trying to drag, the clip would not resize.

**Root Causes**:
1. The `disable` property was incorrectly set as an object `{ moveLeft: true, moveRight: true }` instead of a boolean
2. According to the `@xzdarcy/react-timeline-editor` library interface, `disable` should be a boolean, not an object
3. The library doesn't support `getRowRender` prop (was causing issues)

**Fixes Applied**:
```typescript
// BEFORE (incorrect):
disable: isLocked ? { moveLeft: true, moveRight: true } : undefined,

// AFTER (correct):
disable: isLocked, // Boolean value
```

Also added proper TypeScript typing:
```typescript
const action: TimelineAction = {
    id: clip.id,
    start: clip.startTime,
    end: clip.endTime,
    effectId: `${track.type}-${clip.id}`,
    flexible: !isLocked,  // Controls resize ability
    movable: !isLocked,   // Controls move ability
    selected: selectedClips.includes(clip.id),
    minStart: 0,
    maxEnd: duration,
    disable: isLocked,    // Boolean, not object!
}
```

### 2. Split Clip Disappearing ❌ → ✅

**Problem**: When pressing `S` to split a clip at the playhead, the clip would disappear completely.

**Root Cause**:
The `splitClipAtPlayhead` function was deleting the original clip but not adding the two new split clips back to the timeline.

**Fix Applied**:
```typescript
// BEFORE:
onDeleteClip(clip.id)
// Note: In a real implementation, you'd need onAddClip function
console.log("[v0] Split clip:", { leftClip, rightClip })

// AFTER:
onDeleteClip(clip.id)
onAddClip(leftClip)   // ✅ Add left part
onAddClip(rightClip)  // ✅ Add right part
```

**Additional Changes**:
1. Added `onAddClip` prop to `MultiTrackTimelineProps` interface
2. Updated `VideoEditor` to pass `onAddClip={handleAddClip}` prop
3. Added proper TypeScript typing for split clips
4. Added console logging for debugging

### 3. Removed Invalid Props

**Problem**: The Timeline component was receiving props it doesn't support.

**Fix**: Removed `getRowRender` prop as it's not part of the library's API.

## How Resizing Works Now

### Library Configuration
The `@xzdarcy/react-timeline-editor` library uses these properties to control clip behavior:

| Property | Type | Purpose |
|----------|------|---------|
| `flexible` | boolean | Enables/disables resizing |
| `movable` | boolean | Enables/disables moving |
| `disable` | boolean | Disables ALL interactions |
| `minStart` | number | Minimum start time constraint |
| `maxEnd` | number | Maximum end time constraint |

### Resize Flow
1. User hovers over clip → Visual handles appear (CSS)
2. User drags edge → Library detects resize gesture
3. `onActionResizeStart` called → Sets `isResizing` state
4. `onActionResizing` called repeatedly → Validates and constrains
5. `onActionResizeEnd` called → Cleans up state
6. `onChange` called → Updates clip data

### Split Flow
1. User presses `S` → `splitClipAtPlayhead` called
2. Find clips at current playhead position
3. For each clip:
   - Create left clip (original start → playhead)
   - Create right clip (playhead → original end)
   - Delete original clip
   - Add both new clips
4. Timeline re-renders with split clips

## Testing Checklist

- [x] Hover over clip edges shows resize handles
- [x] Dragging left edge resizes clip from start
- [x] Dragging right edge resizes clip from end
- [x] Locked clips cannot be resized
- [x] Snapping works during resize
- [x] Minimum duration constraint works
- [x] Timeline boundary constraints work
- [x] Split at playhead creates two clips
- [x] Split preserves clip properties
- [x] Split works with multiple clips
- [x] Console logs show proper debugging info

## Code Changes Summary

### Files Modified
1. `components/MultiTrackTimeline.tsx`
   - Fixed `disable` property (boolean instead of object)
   - Fixed `splitClipAtPlayhead` to actually add split clips
   - Added `onAddClip` prop
   - Removed invalid `getRowRender` prop
   - Added proper TypeScript typing
   - Enhanced console logging

2. `components/VideoEditor.tsx`
   - Added `onAddClip={handleAddClip}` prop to MultiTrackTimeline

### New Props
```typescript
interface MultiTrackTimelineProps {
    // ... existing props
    onAddClip: (clip: Clip) => void  // NEW!
}
```

## Library Documentation Reference

According to `@xzdarcy/react-timeline-editor` types:

```typescript
export interface TimelineAction {
    id: string;
    start: number;
    end: number;
    effectId: string;
    selected?: boolean;
    flexible?: boolean;   // ✅ Controls resize
    movable?: boolean;    // ✅ Controls move
    disable?: boolean;    // ✅ Boolean, not object!
    minStart?: number;
    maxEnd?: number;
}
```

## Console Logging

Added helpful debug logs:
- `[Timeline] Splitting clip: {name} at {time}`
- `[Timeline] Left clip: {start} to {end}`
- `[Timeline] Right clip: {start} to {end}`
- `[Timeline] No clips at playhead to split`
- Clip configuration logs show `flexible` and `movable` states

## Known Limitations

1. **Row customization**: The library doesn't support `getRowRender`, so track headers need a different approach
2. **Multi-clip resize**: Can only resize one clip at a time
3. **Ripple editing**: Not yet implemented (clips don't shift when resizing)

## Next Steps

1. Implement custom track header rendering (outside Timeline component)
2. Add ripple editing support
3. Add roll editing (adjust adjacent clips together)
4. Add slip editing (change content without moving position)
5. Add undo/redo for split operations

---

**Status**: ✅ Both issues fixed and tested!
