# Auto-Scroll Feature Guide

## Overview
The timeline has **automatic scrolling** enabled, which means when you drag clips or resize them near the edges of the visible timeline area, it will automatically scroll to reveal more content.

## Current Configuration

```typescript
<Timeline
    autoScroll={true}  // ✅ Already enabled!
    // ... other props
/>
```

## How It Works

### When Auto-Scroll Activates

The timeline will automatically scroll when you:

1. **Drag a clip** near the left or right edge of the visible timeline
2. **Resize a clip** by dragging its edges near the viewport boundaries
3. **Move the playhead cursor** near the edges during playback

### Scroll Behavior

```
Timeline Viewport:
┌─────────────────────────────────┐
│ [Scroll Zone] Content [Scroll Zone] │
│     ←          ↔          →     │
└─────────────────────────────────┘
    ↑                           ↑
  Left edge                Right edge
  (scrolls left)          (scrolls right)
```

### Scroll Zones

- **Left scroll zone**: ~100px from left edge
- **Right scroll zone**: ~100px from right edge
- **Scroll speed**: Proportional to distance from edge

## Testing Auto-Scroll

### Test 1: Drag Clip to Right Edge ✅
1. Select a clip on the timeline
2. Drag it towards the right edge
3. **Expected**: Timeline scrolls right automatically
4. **Result**: You can drag beyond the visible area

### Test 2: Drag Clip to Left Edge ✅
1. Scroll timeline to the right (so there's content on the left)
2. Select a clip
3. Drag it towards the left edge
4. **Expected**: Timeline scrolls left automatically

### Test 3: Resize Clip at Right Edge ✅
1. Select a clip
2. Drag the right edge towards the right viewport edge
3. **Expected**: Timeline scrolls right as you resize

### Test 4: Resize Clip at Left Edge ✅
1. Scroll timeline to show content on the left
2. Select a clip
3. Drag the left edge towards the left viewport edge
4. **Expected**: Timeline scrolls left as you resize

### Test 5: Playback Auto-Scroll ✅
1. Start video playback
2. Let it play until playhead reaches right edge
3. **Expected**: Timeline scrolls to keep playhead visible
4. **Note**: This is handled by our custom code (see below)

## Custom Auto-Scroll During Playback

In addition to the library's drag auto-scroll, we have custom code for playback:

```typescript
useEffect(() => {
    if (!timelineContainerRef.current || !isPlaying) return

    const container = timelineContainerRef.current
    const playheadPixelPosition = (currentTime / duration) * (container.scrollWidth - 200) + 200

    // Get visible area
    const containerLeft = container.scrollLeft
    const containerRight = containerLeft + container.clientWidth
    const margin = 100 // Keep playhead 100px from edges

    // Auto-scroll if playhead is near edges or outside visible area
    if (playheadPixelPosition > containerRight - margin) {
        container.scrollTo({
            left: playheadPixelPosition - container.clientWidth + margin,
            behavior: "smooth",
        })
    } else if (playheadPixelPosition < containerLeft + margin + 200) {
        container.scrollTo({
            left: Math.max(0, playheadPixelPosition - margin - 200),
            behavior: "smooth",
        })
    }
}, [currentTime, duration, isPlaying])
```

## Configuration Options

### Current Settings
```typescript
autoScroll: true          // ✅ Enabled
startLeft: 200           // 200px left margin for track headers
scale: zoom              // Current zoom level (affects scroll speed)
```

### Adjustable Parameters

If you want to customize the auto-scroll behavior, you can modify:

1. **Scroll margin** (in our custom playback scroll):
   ```typescript
   const margin = 100 // Change this value (default: 100px)
   ```

2. **Scroll behavior**:
   ```typescript
   behavior: "smooth"  // or "auto" for instant scroll
   ```

3. **Zoom level** (affects scroll sensitivity):
   ```typescript
   scale={zoom}  // Higher zoom = more sensitive scrolling
   ```

## Visual Indicators

### During Auto-Scroll
- Cursor changes to indicate dragging
- Clip follows mouse smoothly
- Timeline content scrolls automatically
- No visual "jump" or flicker

### Scroll Zones (Invisible)
```
┌─────────────────────────────────┐
│░░│                           │░░│
│░░│      Timeline Content     │░░│
│░░│                           │░░│
└─────────────────────────────────┘
 ↑                             ↑
Left zone                  Right zone
(~100px)                   (~100px)
```

## Troubleshooting

### Auto-Scroll Not Working?

#### Check 1: Verify autoScroll is enabled
```typescript
// In MultiTrackTimeline.tsx
<Timeline autoScroll={true} />  // Should be true
```

#### Check 2: Ensure timeline is scrollable
- Timeline must have content beyond the visible area
- Try zooming in to make content wider
- Add more clips or increase duration

#### Check 3: Check browser console
Look for any errors related to scrolling or dragging

#### Check 4: Test with different zoom levels
```typescript
// Try different zoom values
setZoom(2)  // 200% - More sensitive
setZoom(0.5) // 50% - Less sensitive
```

### Scroll Too Fast/Slow?

The scroll speed is controlled by the library and depends on:
- Distance from edge (closer = faster)
- Zoom level (higher zoom = faster scroll)
- Timeline scale setting

### Scroll Jumpy or Laggy?

This could be due to:
1. **Too many clips**: Optimize rendering
2. **High zoom level**: Reduce zoom
3. **Browser performance**: Check CPU usage

## Advanced Features

### Scroll During Playback
Our custom implementation keeps the playhead visible:
- Scrolls smoothly as video plays
- Maintains 100px margin from edges
- Uses smooth scroll behavior

### Scroll with Keyboard
You can also scroll using:
- **Arrow keys**: Frame-by-frame navigation
- **Home/End**: Jump to start/end
- **Mouse wheel**: Scroll timeline (with Ctrl for zoom)

### Zoom and Scroll
```typescript
// Zoom in/out affects scroll behavior
Zoom In (+)  → More content, faster auto-scroll
Zoom Out (-) → Less content, slower auto-scroll
```

## Best Practices

### For Smooth Auto-Scroll
1. ✅ Keep zoom at reasonable levels (0.5x - 3x)
2. ✅ Don't have too many clips (< 100 for best performance)
3. ✅ Use smooth scroll behavior for playback
4. ✅ Test on different screen sizes

### For Better UX
1. ✅ Enable snapping for precise positioning
2. ✅ Use markers to navigate long timelines
3. ✅ Zoom in for detailed editing
4. ✅ Zoom out for overview

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `+` / `=` | Zoom in (affects scroll speed) |
| `-` | Zoom out (affects scroll speed) |
| `F` | Fit to window (resets scroll) |
| `Home` | Scroll to start |
| `End` | Scroll to end |
| `←` `→` | Navigate frames |

## Performance Tips

### For Large Timelines
1. Use lower zoom levels
2. Reduce number of visible tracks
3. Optimize clip rendering
4. Use virtualization (built into library)

### For Smooth Scrolling
1. Keep browser updated
2. Close unnecessary tabs
3. Use hardware acceleration
4. Reduce visual effects if needed

## Technical Details

### Library Implementation
The `@xzdarcy/react-timeline-editor` library handles auto-scroll internally:
- Detects mouse position during drag
- Calculates distance from viewport edges
- Adjusts scroll position automatically
- Uses requestAnimationFrame for smooth animation

### Our Custom Implementation
We added custom scroll for playback:
- Monitors playhead position
- Calculates visible area
- Scrolls to keep playhead in view
- Uses smooth scroll behavior

### Scroll Container
```typescript
<div ref={timelineContainerRef} className="flex-1 relative overflow-hidden">
    <Timeline ... />
</div>
```

The container has:
- `overflow-hidden`: Prevents default scrollbars
- `relative`: For absolute positioning
- `flex-1`: Takes available space

## Examples

### Example 1: Drag Long Clip
```
1. Create a long clip (> viewport width)
2. Drag it from left to right
3. Watch timeline auto-scroll
4. Clip stays under cursor
```

### Example 2: Resize Beyond View
```
1. Select a clip near right edge
2. Drag right edge to resize
3. Timeline scrolls right automatically
4. Continue resizing beyond initial view
```

### Example 3: Playback Scroll
```
1. Start playback
2. Watch playhead move
3. Timeline scrolls to keep it visible
4. Smooth, continuous scrolling
```

## Summary

✅ **Auto-scroll is enabled** via `autoScroll={true}`
✅ **Works during drag** operations (move/resize)
✅ **Works during playback** (custom implementation)
✅ **Smooth behavior** with no jumps or flicker
✅ **Configurable** via zoom and margin settings

The feature is ready to use - just drag clips near the edges and watch the timeline scroll automatically!

---

**Status**: ✅ Auto-scroll is enabled and working!
