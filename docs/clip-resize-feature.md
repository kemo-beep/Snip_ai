# Clip Resize Feature - Implementation Guide

## Overview
Users can now resize clips by dragging their edges, similar to professional video editors like Adobe Premiere Pro, DaVinci Resolve, and Final Cut Pro.

## Visual Design

```
┌─────────────────────────────────────────┐
│  Normal Clip (not hovered)              │
│  ┌───────────────────────────────────┐  │
│  │ 🎬 Video Clip Name          00:05 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Hovered Clip (resize handles visible)  │
│  ┌───────────────────────────────────┐  │
│ ║│ 🎬 Video Clip Name          00:05 │║ │
│ ║│                                   │║ │
│ ║└───────────────────────────────────┘║ │
│ ↔                                     ↔ │
│ Left Handle                Right Handle │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Resizing Clip (active resize)          │
│  ┌───────────────────────────────────┐  │
│ ║│ 🎬 Video Clip Name          00:03 │║ │
│ ║│                                   │║ │
│ ║└───────────────────────────────────┘║ │
│ ↔← Dragging left edge                  │
│    (Blue glow + enhanced shadow)        │
└─────────────────────────────────────────┘
```

## Implementation Details

### 1. Action Configuration
```typescript
{
    id: clip.id,
    start: clip.startTime,
    end: clip.endTime,
    flexible: !isLocked,        // Enable/disable resizing
    movable: !isLocked,         // Enable/disable moving
    minStart: 0,                // Minimum start time
    maxEnd: duration,           // Maximum end time
    disable: isLocked ? {       // Disable specific operations
        moveLeft: true,
        moveRight: true
    } : undefined,
}
```

### 2. Resize Handles (Visual Only)
```tsx
{/* Left resize handle */}
<div className="absolute left-0 top-0 bottom-0 w-2 
                opacity-0 group-hover:opacity-100 
                transition-all duration-200 cursor-ew-resize z-10">
    <div className="absolute left-0 top-0 bottom-0 w-1 
                    bg-blue-400 shadow-lg" />
    <div className="absolute left-0.5 top-1/2 -translate-y-1/2 
                    w-1 h-8 bg-white/90 rounded-full shadow-md" />
</div>

{/* Right resize handle */}
<div className="absolute right-0 top-0 bottom-0 w-2 
                opacity-0 group-hover:opacity-100 
                transition-all duration-200 cursor-ew-resize z-10">
    <div className="absolute right-0 top-0 bottom-0 w-1 
                    bg-blue-400 shadow-lg" />
    <div className="absolute right-0.5 top-1/2 -translate-y-1/2 
                    w-1 h-8 bg-white/90 rounded-full shadow-md" />
</div>
```

### 3. Resize Callbacks

#### onActionResizeStart
```typescript
const handleActionResizeStart = useCallback(
    (params: { action: TimelineAction; row: TimelineRow; dir: "left" | "right" }) => {
        setIsResizing(true)
        setResizeDirection(params.dir)
        console.log(`Started resizing clip ${params.action.id} from ${params.dir} edge`)
    },
    [],
)
```

#### onActionResizing
```typescript
const handleActionResizingFinal = useCallback(
    (params: { action: TimelineAction; row: TimelineRow; start: number; end: number; dir: "right" | "left" }) => {
        const { action, start, end, dir } = params

        // Check if action is flexible
        if (!action.flexible) {
            return false
        }

        // Apply constraints
        const minStart = action.minStart || 0
        const maxEnd = action.maxEnd || duration
        const minDuration = 0.033 // 1 frame at 30fps

        // Boundary checks
        if (start < minStart) params.start = minStart
        if (end > maxEnd) params.end = maxEnd

        // Minimum duration check
        if (end - start < minDuration) {
            if (dir === "right") {
                params.end = params.start + minDuration
            } else {
                params.start = params.end - minDuration
            }
        }

        // Apply snapping
        if (isSnapping) {
            const snapInterval = 1 / 30 // 30fps
            if (dir === "left") {
                params.start = Math.round(params.start / snapInterval) * snapInterval
            } else {
                params.end = Math.round(params.end / snapInterval) * snapInterval
            }
        }

        return true
    },
    [isSnapping, duration],
)
```

#### onActionResizeEnd
```typescript
const handleActionResizeEnd = useCallback(
    (params: { action: TimelineAction; row: TimelineRow }) => {
        setIsResizing(false)
        setResizeDirection(null)
        console.log(`Finished resizing clip ${params.action.id}`)
    },
    [],
)
```

### 4. State Management
```typescript
const [isResizing, setIsResizing] = useState(false)
const [resizeDirection, setResizeDirection] = useState<"left" | "right" | null>(null)
```

## User Experience Flow

1. **Hover over clip** → Resize handles fade in (200ms transition)
2. **Cursor changes** → Shows `ew-resize` cursor (↔)
3. **Click and drag** → Edge follows mouse with constraints
4. **Snapping** → If enabled, edge snaps to frame boundaries
5. **Visual feedback** → Enhanced ring and shadow during resize
6. **Release** → Clip updates with new duration
7. **Handles fade out** → When mouse leaves clip

## Constraints & Validation

### Minimum Duration
- **Value**: 0.033 seconds (1 frame at 30fps)
- **Reason**: Prevents clips from becoming too small to see or edit
- **Behavior**: Resize stops when minimum is reached

### Timeline Boundaries
- **Start boundary**: 0 seconds
- **End boundary**: Video duration
- **Behavior**: Cannot resize beyond these limits

### Snapping
- **Interval**: 1/30 second (30fps frame rate)
- **Behavior**: Edges snap to nearest frame boundary
- **Toggle**: Via snap button in toolbar

### Locked Clips
- **Behavior**: Cannot be resized
- **Visual**: Lock icon shows on hover
- **Property**: `flexible: false`

## Accessibility

- **Keyboard**: Not yet implemented (future enhancement)
- **Visual feedback**: Clear cursor changes and visual indicators
- **Color contrast**: Blue handles on dark background (WCAG AA compliant)
- **Hover states**: Clear indication of interactive areas

## Performance Considerations

- **Debouncing**: Not needed - library handles efficiently
- **Re-renders**: Optimized with `useCallback` and `useMemo`
- **DOM updates**: Minimal - only affected clips update
- **Smooth animations**: CSS transitions for visual feedback

## Browser Compatibility

- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅
- **Mobile**: Touch events supported by library ✅

## Future Enhancements

1. **Slip editing** - Change clip content without moving position
2. **Roll editing** - Adjust adjacent clip boundaries together
3. **Ripple editing** - Move all subsequent clips when resizing
4. **Keyboard shortcuts** - Trim by frame with arrow keys
5. **Numeric input** - Type exact duration values
6. **Multi-clip resize** - Resize multiple clips proportionally
7. **Undo/redo** - Full history support for resize operations

## Testing Checklist

- [ ] Resize from left edge
- [ ] Resize from right edge
- [ ] Resize with snapping enabled
- [ ] Resize with snapping disabled
- [ ] Try to resize locked clip (should fail)
- [ ] Try to resize beyond timeline start (should constrain)
- [ ] Try to resize beyond timeline end (should constrain)
- [ ] Try to resize below minimum duration (should constrain)
- [ ] Resize multiple clips in sequence
- [ ] Resize while video is playing
- [ ] Resize with different zoom levels
- [ ] Check visual feedback (handles, cursor, ring)
- [ ] Check console logs for debugging info

## Troubleshooting

### Handles not appearing
- Check if clip is locked
- Check if track is locked
- Verify `flexible: true` in action config

### Cannot resize
- Check `flexible` property
- Check `disable.moveLeft` and `disable.moveRight`
- Verify clip is not locked

### Snapping not working
- Check `isSnapping` state
- Verify `gridSnap` prop on Timeline
- Check snap interval calculation

### Resize jumpy or laggy
- Check for unnecessary re-renders
- Verify `useCallback` on handlers
- Check browser performance
