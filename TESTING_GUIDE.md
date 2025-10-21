# Testing Guide - Resize and Split Features

## Quick Test Checklist

### Test 1: Basic Clip Resizing ✅
1. Open the video editor
2. Hover over a clip on the timeline
3. **Expected**: Blue resize handles appear on left and right edges
4. Click and drag the left edge
5. **Expected**: Clip start time changes, duration updates
6. Click and drag the right edge
7. **Expected**: Clip end time changes, duration updates

### Test 2: Resize with Snapping ✅
1. Enable snapping (click snap button in toolbar)
2. Hover over a clip
3. Drag an edge slowly
4. **Expected**: Edge snaps to frame boundaries (30fps grid)
5. Disable snapping
6. Drag an edge
7. **Expected**: Smooth, continuous movement

### Test 3: Resize Constraints ✅
1. Try to resize a clip before timeline start (0s)
2. **Expected**: Edge stops at 0s, cannot go negative
3. Try to resize a clip beyond video duration
4. **Expected**: Edge stops at video duration
5. Try to resize a clip to very small size
6. **Expected**: Stops at minimum duration (~0.033s)

### Test 4: Locked Clip Resize ✅
1. Lock a clip (click lock button on track)
2. Hover over the locked clip
3. **Expected**: No resize handles appear
4. **Expected**: Lock icon shows on hover
5. Try to drag the clip
6. **Expected**: Clip doesn't move

### Test 5: Split Clip ✅
1. Seek to middle of a clip (e.g., 2.5s into a 5s clip)
2. Press `S` key
3. **Expected**: Original clip disappears
4. **Expected**: Two new clips appear:
   - Left clip: original start → playhead
   - Right clip: playhead → original end
5. Check console logs
6. **Expected**: See split messages with times

### Test 6: Split Multiple Clips ✅
1. Position playhead where it intersects multiple clips
2. Press `S` key
3. **Expected**: All intersecting clips split at playhead
4. **Expected**: Each clip becomes two clips

### Test 7: Split Locked Clip ✅
1. Lock a clip
2. Position playhead over the locked clip
3. Press `S` key
4. **Expected**: Locked clip is NOT split
5. **Expected**: Console shows "No clips at playhead to split"

### Test 8: Resize Visual Feedback ✅
1. Hover over clip edge
2. **Expected**: Cursor changes to ↔ (ew-resize)
3. Start dragging
4. **Expected**: Enhanced blue ring appears
5. **Expected**: Shadow becomes more prominent
6. Release mouse
7. **Expected**: Visual feedback returns to normal

### Test 9: Resize with Playback ✅
1. Start video playback
2. While playing, try to resize a clip
3. **Expected**: Resize works normally
4. **Expected**: Playhead continues moving

### Test 10: Split with Playback ✅
1. Start video playback
2. While playing, press `S` to split
3. **Expected**: Clip splits at current playhead position
4. **Expected**: Playback continues

## Console Log Verification

### Expected Logs for Resize
```
Clip My Video Clip: start=0, end=5, duration=5, flexible=true, movable=true
Started resizing clip recorded-video-123 from left edge
Resizing clip recorded-video-123: left edge, start=1.000s, end=5.000s, duration=4.000s
Finished resizing clip recorded-video-123
```

### Expected Logs for Split
```
[Timeline] Splitting clip: Recorded Video at 2.5
[Timeline] Left clip: 0 to 2.5
[Timeline] Right clip: 2.5 to 5
```

### Expected Logs for Locked Clip
```
Action is not flexible (locked): recorded-video-123
```

## Visual Indicators

### Resize Handles
- **Color**: Blue (#3b82f6)
- **Width**: 2px
- **Grip**: White circle, 1px wide, 8px tall
- **Opacity**: 0 → 100% on hover (200ms transition)

### Resizing State
- **Ring**: 4px blue ring (ring-4)
- **Shadow**: Enhanced shadow (shadow-2xl)
- **Cursor**: ew-resize (↔)

### Locked State
- **No handles**: Handles don't appear
- **Lock icon**: Shows on hover
- **Overlay**: Semi-transparent gray overlay

## Performance Checks

### Smooth Resizing
- [ ] No lag when dragging edges
- [ ] Smooth cursor movement
- [ ] No frame drops
- [ ] Duration updates in real-time

### Smooth Splitting
- [ ] Instant split (< 100ms)
- [ ] No flicker
- [ ] Clips appear immediately
- [ ] Timeline re-renders smoothly

## Edge Cases

### Edge Case 1: Split at Clip Start
1. Position playhead at exact clip start
2. Press `S`
3. **Expected**: Left clip has 0 duration (minimum)
4. **Expected**: Right clip has full duration

### Edge Case 2: Split at Clip End
1. Position playhead at exact clip end
2. Press `S`
3. **Expected**: Left clip has full duration
4. **Expected**: Right clip has 0 duration (minimum)

### Edge Case 3: Resize to Minimum
1. Drag edge to make clip very small
2. **Expected**: Stops at ~0.033s (1 frame)
3. **Expected**: Cannot make smaller

### Edge Case 4: Resize Beyond Boundary
1. Drag left edge before timeline start
2. **Expected**: Stops at 0s
3. Drag right edge beyond video duration
4. **Expected**: Stops at video duration

### Edge Case 5: Multiple Rapid Splits
1. Press `S` multiple times quickly
2. **Expected**: Each split creates new clips
3. **Expected**: No clips disappear
4. **Expected**: No duplicate IDs

## Browser Testing

### Chrome/Edge
- [ ] Resize works
- [ ] Split works
- [ ] Cursor changes correctly
- [ ] Visual feedback smooth

### Firefox
- [ ] Resize works
- [ ] Split works
- [ ] Cursor changes correctly
- [ ] Visual feedback smooth

### Safari
- [ ] Resize works
- [ ] Split works
- [ ] Cursor changes correctly
- [ ] Visual feedback smooth

## Keyboard Shortcuts Test

| Key | Expected Behavior |
|-----|-------------------|
| `S` | Split clip at playhead |
| `Space` | Play/Pause (doesn't interfere) |
| `M` | Add marker (doesn't interfere) |
| `Del` | Delete clip (doesn't interfere) |
| `Ctrl+D` | Duplicate clip (doesn't interfere) |

## Troubleshooting

### If resize doesn't work:
1. Check console for "Action is not flexible" message
2. Verify clip is not locked
3. Verify track is not locked
4. Check `flexible: true` in action config
5. Check `disable: false` in action config

### If split doesn't work:
1. Check console for "No clips at playhead" message
2. Verify playhead is over a clip
3. Verify clip is not locked
4. Check that `onAddClip` is being called
5. Check clips array updates

### If handles don't appear:
1. Hover directly over clip edge (2px wide)
2. Check if clip is locked
3. Check CSS for `.group-hover` classes
4. Verify `flexible: true` in action

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Smooth performance
✅ Visual feedback clear
✅ Constraints work correctly
✅ Locked clips protected
✅ Split creates two clips
✅ Resize updates duration

---

**Test Status**: Ready for testing!
