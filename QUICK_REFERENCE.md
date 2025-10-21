# 🎬 Video Editor Timeline - Quick Reference

## Clip Resizing

### How to Resize
1. **Hover** over clip → Handles appear
2. **Drag** left edge → Trim start
3. **Drag** right edge → Trim end

### Visual Indicators
- 🔵 **Blue line** = Resize edge
- ⚪ **White grip** = Drag point
- ↔️ **Cursor** = Resize mode
- 🔒 **Lock icon** = Cannot resize

### Constraints
- ⏱️ Min duration: 1 frame (~0.033s)
- 📍 Start boundary: 0s
- 📍 End boundary: Video duration
- 🔒 Locked clips: Cannot resize

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `S` | Split at playhead |
| `M` | Add marker |
| `←` `→` | Frame by frame |
| `Shift` + `←` `→` | Jump to marker |
| `Del` | Delete clip |
| `Shift` + `Del` | Ripple delete |
| `Ctrl/Cmd` + `C` | Copy |
| `Ctrl/Cmd` + `V` | Paste |
| `Ctrl/Cmd` + `D` | Duplicate |
| `Ctrl/Cmd` + `A` | Select all |
| `+` `-` | Zoom |
| `F` | Fit to window |
| `Esc` | Clear selection |

## Timeline Controls

### Playback
- ⏯️ Play/Pause
- ⏪ Rewind 5s
- ⏩ Fast forward 5s
- 🎯 Click timeline to seek

### Tools
- 🖱️ Select tool (default)
- ✂️ Razor tool (split)
- 🧲 Snapping toggle
- 🔖 Add marker

### Zoom
- 🔍 Zoom in/out
- 📏 Fit to window
- 🖱️ Ctrl + Scroll to zoom

## Track Controls

### Per Track
- 🔇 Mute/Unmute
- 👁️ Solo/Unsolo
- 🔒 Lock/Unlock
- ⬆️ Move up
- ⬇️ Move down
- 🗑️ Delete track

### Track Info
- Clip count
- Total duration
- Lock status

## Clip Operations

### Selection
- Click to select
- Ctrl + Click for multi-select
- Drag to move
- Drag edges to resize

### Context Menu (Right-click)
- Copy
- Duplicate
- Split at playhead
- Delete
- Ripple delete

### Visual States
- 🔵 Selected = Blue ring
- 🟦 Hovered = Light blue ring
- 🔴 Muted = Reduced opacity
- 🔒 Locked = Lock icon

## Markers

### Usage
- Press `M` to add at playhead
- Click marker to seek
- Hover for info tooltip
- Shift + arrows to jump

### Visual
- 🔵 Blue line
- 🔵 Blue dot at top
- Label on hover

## Status Bar

Shows:
- Selected clip count
- Total clip count
- Total track count

## Tips & Tricks

### Precision Editing
1. Enable snapping
2. Zoom in
3. Use markers
4. Frame-by-frame navigation

### Workflow
1. Add markers at key points
2. Split clips at markers
3. Resize to fine-tune
4. Lock finished clips

### Performance
- Lock unused tracks
- Zoom out for overview
- Zoom in for details
- Use keyboard shortcuts

## Common Workflows

### Trim Clip
1. Hover over clip
2. Drag edge to trim
3. Enable snap for precision

### Split & Delete
1. Seek to split point
2. Press `S` to split
3. Select unwanted part
4. Press `Del`

### Duplicate & Adjust
1. Select clip
2. Press `Ctrl+D`
3. Move duplicate
4. Resize as needed

### Multi-Clip Edit
1. Select multiple clips
2. Move together
3. Delete together
4. (Resize individually)

## Troubleshooting

### Can't resize clip
- Check if locked 🔒
- Check if track locked
- Verify flexible property

### Handles not showing
- Hover over clip
- Check lock status
- Verify not at boundary

### Snapping not working
- Click snap button
- Check snap interval
- Verify gridSnap enabled

### Clip won't move
- Check if locked
- Check movable property
- Verify not at boundary

## Documentation

- 📖 Full guide: `docs/clip-resize-feature.md`
- 🎨 Interaction guide: `docs/resize-interaction-guide.md`
- 📋 Improvements: `docs/timeline-improvements.md`
- ✨ Summary: `RESIZE_FEATURE_SUMMARY.md`

---

**Need Help?** Check the full documentation or console logs for debugging info.
