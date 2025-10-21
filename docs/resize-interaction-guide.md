# Clip Resize Interaction Guide

## Visual States

### State 1: Normal (No Interaction)
```
┌────────────────────────────────────────┐
│ Timeline Track                         │
│ ┌──────────────────────────────────┐   │
│ │ 🎬 My Video Clip          00:05  │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```
- No resize handles visible
- Default cursor
- Normal shadow

### State 2: Hover
```
┌────────────────────────────────────────┐
│ Timeline Track                         │
│ ║┌──────────────────────────────────┐║  │
│ ║│ 🎬 My Video Clip          00:05  │║  │
│ ║└──────────────────────────────────┘║  │
│ ↔                                    ↔  │
│ Blue line + white grip on each edge    │
└────────────────────────────────────────┘
```
- Resize handles fade in (200ms)
- Blue vertical line on edges
- White circular grip in center
- Cursor changes to ↔ when over handles

### State 3: Resizing (Dragging Left Edge)
```
┌────────────────────────────────────────┐
│ Timeline Track                         │
│    ║┌─────────────────────────────┐║   │
│    ║│ 🎬 My Video Clip      00:03 │║   │
│    ║└─────────────────────────────┘║   │
│    ↔← Dragging                         │
│    Enhanced blue glow + shadow         │
└────────────────────────────────────────┘
```
- Ring becomes thicker (ring-4)
- Enhanced shadow (shadow-2xl)
- Duration updates in real-time
- Cursor stays as ↔
- Snaps to frames if enabled

### State 4: Resizing (Dragging Right Edge)
```
┌────────────────────────────────────────┐
│ Timeline Track                         │
│ ║┌─────────────────────────────────────┐║
│ ║│ 🎬 My Video Clip          00:08    │║
│ ║└─────────────────────────────────────┘║
│                                      →↔ │
│                              Dragging   │
└────────────────────────────────────────┘
```
- Same visual feedback as left edge
- Extends clip duration
- Constrained by timeline end

### State 5: Locked Clip (Hover)
```
┌────────────────────────────────────────┐
│ Timeline Track (Locked)                │
│ ┌──────────────────────────────────┐   │
│ │ 🎬 My Video Clip   🔒     00:05  │   │
│ │        (Cannot resize)           │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```
- No resize handles appear
- Lock icon shows on hover
- Cursor stays as default
- Semi-transparent overlay

## Interaction Flow

```
┌─────────────┐
│   Hover     │
│   on clip   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Handles    │
│  appear     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Move to    │
│  edge       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Cursor     │
│  changes ↔  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Click &    │
│  drag       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Clip       │
│  resizes    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Release    │
│  mouse      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  New size   │
│  applied    │
└─────────────┘
```

## Resize Handle Anatomy

```
Left Handle (2px wide):
┌─┐
│ │ ← Blue line (1px, bg-blue-400)
│●│ ← White grip (1px wide, 8px tall, rounded)
│ │
└─┘

Right Handle (2px wide):
┌─┐
│ │ ← Blue line (1px, bg-blue-400)
│●│ ← White grip (1px wide, 8px tall, rounded)
│ │
└─┘
```

## Cursor States

| Location | Cursor | Description |
|----------|--------|-------------|
| Over clip body | `default` | Normal pointer |
| Over left handle | `ew-resize` | ↔ horizontal resize |
| Over right handle | `ew-resize` | ↔ horizontal resize |
| During resize | `ew-resize` | ↔ stays during drag |
| Over locked clip | `default` | Cannot resize |

## Snapping Behavior

### With Snapping Enabled
```
Timeline (30fps grid):
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
0s    1s    2s    3s

Dragging edge:
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
  ↑ Snaps to nearest frame
```

### Without Snapping
```
Timeline (smooth):
├───────────────────┤
0s                 3s

Dragging edge:
├───────────────────┤
    ↑ Free positioning
```

## Constraint Examples

### Example 1: Minimum Duration
```
Before:
├──────────┤ 5 seconds
0s        5s

Try to resize to 0.01s:
├┤ ← Blocked! Minimum is 0.033s (1 frame)

Result:
├┤ 0.033 seconds (1 frame)
```

### Example 2: Timeline Start Boundary
```
Timeline:
├──────────────────┤
0s               10s

Try to drag before 0s:
  ←├──────┤ ← Blocked!

Result:
├──────┤ Stays at 0s
```

### Example 3: Timeline End Boundary
```
Timeline:
├──────────────────┤
0s               10s

Try to drag after 10s:
        ├──────┤→ ← Blocked!

Result:
        ├──────┤ Stays at 10s
```

## Multi-Clip Scenarios

### Scenario 1: Adjacent Clips
```
Before:
├────────┤├────────┤
Clip A    Clip B

Resize Clip A right edge:
├──────────┤├──────┤
Clip A      Clip B
(Clip B doesn't move - no ripple yet)
```

### Scenario 2: Overlapping Prevention
```
Before:
├────────┤  ├────────┤
Clip A      Clip B

Resize Clip A right edge:
├────────────┤├──────┤
Clip A        Clip B
(Can overlap - user controls this)
```

## Keyboard Modifiers (Future)

| Modifier | Behavior |
|----------|----------|
| `Shift` | Snap to markers |
| `Alt` | Ripple edit (move subsequent clips) |
| `Ctrl` | Roll edit (adjust adjacent clip) |
| `Cmd` | Slip edit (change content, not position) |

## Accessibility Features

### Visual
- High contrast handles (blue on dark)
- Clear cursor feedback
- Real-time duration display
- Lock icon for locked clips

### Interaction
- Large hit area (2px wide handles)
- Smooth transitions (200ms)
- Clear hover states
- Consistent behavior

## Performance Notes

- Handles render only on hover (reduces DOM)
- CSS transitions for smooth animations
- Minimal re-renders with React.memo
- Efficient event handling with useCallback

## Common Issues & Solutions

### Issue: Handles not appearing
**Solution**: Check if clip or track is locked

### Issue: Cannot resize
**Solution**: Verify `flexible: true` in action config

### Issue: Jumpy resize
**Solution**: Disable snapping or check snap interval

### Issue: Resize stops early
**Solution**: Check minimum duration constraint

### Issue: Cannot resize beyond certain point
**Solution**: Check timeline boundary constraints

## Best Practices

1. **Enable snapping** for frame-accurate edits
2. **Lock clips** you don't want to accidentally resize
3. **Zoom in** for precise edits
4. **Use markers** to align clips
5. **Check duration display** for exact timing
6. **Test constraints** before complex edits

## Related Features

- **Move clips**: Drag clip body to move
- **Split clips**: Press `S` to split at playhead
- **Delete clips**: Press `Del` to delete
- **Duplicate clips**: Press `Ctrl+D` to duplicate
- **Lock clips**: Click lock button on track

---

**Pro Tip**: Combine resize with markers for precise editing. Add a marker at your target point, enable snapping, then resize to snap to the marker!
