# Auto-Scroll Testing Guide

## Quick Test Checklist

### ✅ Test 1: Drag Clip Right
```
Action: Drag a clip towards the right edge
Expected: Timeline scrolls right automatically
Status: [ ] Pass [ ] Fail
```

### ✅ Test 2: Drag Clip Left  
```
Action: Drag a clip towards the left edge
Expected: Timeline scrolls left automatically
Status: [ ] Pass [ ] Fail
```

### ✅ Test 3: Resize Right Edge
```
Action: Resize clip by dragging right edge
Expected: Timeline scrolls right when near edge
Status: [ ] Pass [ ] Fail
```

### ✅ Test 4: Resize Left Edge
```
Action: Resize clip by dragging left edge
Expected: Timeline scrolls left when near edge
Status: [ ] Pass [ ] Fail
```

### ✅ Test 5: Playback Scroll
```
Action: Play video and watch playhead
Expected: Timeline scrolls to keep playhead visible
Status: [ ] Pass [ ] Fail
```

## Visual Test

### Before Auto-Scroll
```
Viewport:
┌─────────────────────┐
│ Clip1  Clip2  Clip3 │ [Clip4 Clip5 Clip6] ← Hidden
└─────────────────────┘
         ↑
    Dragging Clip3 right →
```

### During Auto-Scroll
```
Viewport (scrolling):
┌─────────────────────┐
│ Clip2  Clip3  Clip4 │ [Clip5 Clip6] ← Becoming visible
└─────────────────────┘
              ↑
         Clip3 follows cursor
```

### After Auto-Scroll
```
Viewport (scrolled):
┌─────────────────────┐
│ Clip3  Clip4  Clip5 │ Clip6 ← Now visible
└─────────────────────┘
              ↑
         Clip3 dropped here
```

## Step-by-Step Test

### Setup
1. Open video editor
2. Ensure video clip is on timeline
3. Zoom in to make timeline wider than viewport
4. Verify you can scroll manually

### Test Procedure

#### Test A: Horizontal Drag Auto-Scroll
1. Click and hold a clip
2. Drag slowly towards right edge
3. **Observe**: Timeline should start scrolling when you get within ~100px of edge
4. Continue dragging
5. **Observe**: Clip stays under cursor, timeline scrolls
6. Release clip
7. **Result**: Clip placed at new position

#### Test B: Resize Auto-Scroll
1. Hover over clip's right edge
2. Click and hold resize handle
3. Drag towards right edge
4. **Observe**: Timeline scrolls as you approach edge
5. Continue resizing
6. **Observe**: Smooth scrolling, clip extends
7. Release
8. **Result**: Clip resized to new length

#### Test C: Playback Auto-Scroll
1. Seek to beginning of timeline
2. Press Space to play
3. **Observe**: Playhead moves right
4. **Observe**: When playhead gets near right edge, timeline scrolls
5. **Observe**: Playhead stays visible with ~100px margin
6. Let video play to end
7. **Result**: Timeline scrolled to show entire playback

## Expected Behavior

### Scroll Activation
- **Trigger zone**: ~100px from viewport edge
- **Activation**: Immediate when entering zone
- **Speed**: Faster closer to edge
- **Direction**: Follows drag direction

### Scroll Characteristics
- **Smoothness**: No jumps or stutters
- **Responsiveness**: Immediate response to mouse position
- **Accuracy**: Clip stays under cursor
- **Boundaries**: Stops at timeline start/end

### Visual Feedback
- Cursor shows drag state
- Clip follows smoothly
- No visual artifacts
- Smooth animation

## Troubleshooting Tests

### If Auto-Scroll Doesn't Work

#### Test 1: Check Configuration
```typescript
// In browser console:
console.log('Auto-scroll enabled:', 
    document.querySelector('[data-timeline]')?.getAttribute('data-autoscroll'))
```

#### Test 2: Verify Scrollable Content
1. Check if timeline is wider than viewport
2. Try zooming in: Press `+` key
3. Verify manual scroll works: Use mouse wheel

#### Test 3: Test Different Zoom Levels
1. Zoom to 50%: Press `-` key
2. Try auto-scroll
3. Zoom to 200%: Press `+` key multiple times
4. Try auto-scroll again

#### Test 4: Check Browser Console
1. Open DevTools (F12)
2. Look for errors
3. Check for warnings about scrolling

## Performance Tests

### Test 1: Smooth Scrolling
1. Drag clip slowly across viewport
2. **Observe**: Smooth, continuous scroll
3. **Check**: No stuttering or lag
4. **Result**: [ ] Smooth [ ] Laggy

### Test 2: Fast Dragging
1. Drag clip quickly towards edge
2. **Observe**: Scroll keeps up with cursor
3. **Check**: Clip doesn't "escape" cursor
4. **Result**: [ ] Responsive [ ] Slow

### Test 3: Multiple Clips
1. Add 10+ clips to timeline
2. Try auto-scroll with many clips
3. **Observe**: Performance impact
4. **Result**: [ ] Good [ ] Degraded

## Edge Cases

### Edge Case 1: Zoom Extremes
- **Min zoom (10%)**: Auto-scroll should still work
- **Max zoom (1000%)**: Auto-scroll should still work

### Edge Case 2: Timeline Boundaries
- **At start**: Should not scroll left beyond 0
- **At end**: Should not scroll right beyond end

### Edge Case 3: Locked Clips
- **Locked clip**: Should not trigger auto-scroll (can't drag)
- **Unlocked clip**: Should trigger auto-scroll normally

### Edge Case 4: Multiple Tracks
- **Vertical drag**: Should not trigger horizontal auto-scroll
- **Horizontal drag**: Should trigger auto-scroll on any track

## Success Criteria

✅ **All tests pass**
✅ **Smooth scrolling** (no stuttering)
✅ **Accurate positioning** (clip follows cursor)
✅ **Proper boundaries** (stops at start/end)
✅ **Good performance** (< 60ms frame time)
✅ **No console errors**

## Common Issues

### Issue 1: Scroll Too Sensitive
**Symptom**: Timeline scrolls when cursor is far from edge
**Solution**: Check scroll zone size (should be ~100px)

### Issue 2: Scroll Too Slow
**Symptom**: Can't keep up with fast dragging
**Solution**: Increase zoom level or check performance

### Issue 3: Scroll Jumpy
**Symptom**: Timeline jumps instead of smooth scroll
**Solution**: Check for performance issues, reduce clip count

### Issue 4: No Scroll at All
**Symptom**: Timeline doesn't scroll when dragging near edge
**Solution**: 
1. Verify `autoScroll={true}` in code
2. Check timeline is wider than viewport
3. Try zooming in

## Reporting Issues

If auto-scroll doesn't work as expected, report:

1. **Browser**: Chrome/Firefox/Safari + version
2. **Zoom level**: Current zoom percentage
3. **Clip count**: Number of clips on timeline
4. **Action**: What you were doing (drag/resize/playback)
5. **Expected**: What should happen
6. **Actual**: What actually happened
7. **Console**: Any error messages
8. **Video**: Screen recording if possible

---

**Test Date**: _____________
**Tester**: _____________
**Result**: [ ] Pass [ ] Fail
**Notes**: _____________
