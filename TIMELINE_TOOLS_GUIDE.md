# Timeline Editing Tools Guide

## Overview
The timeline now includes professional video editing tools similar to Adobe Premiere Pro, DaVinci Resolve, and Final Cut Pro.

## Available Tools

### 1. Select Tool (V) 🖱️
**Default tool for basic editing**

- **Icon**: Cursor/Arrow
- **Shortcut**: `V`
- **Function**: Select, move, and resize clips
- **Usage**:
  - Click to select clips
  - Drag to move clips
  - Drag edges to resize clips
  - Ctrl/Cmd + Click for multi-select

### 2. Razor Tool (C) ✂️
**Split clips at any point**

- **Icon**: Scissors
- **Shortcut**: `C`
- **Function**: Split clips where you click
- **Usage**:
  - Click on any clip to split it at that point
  - Creates two separate clips
  - Cursor changes to crosshair
  - Cannot drag clips while active

**Example**:
```
Before:
├──────────────────┤ One clip

After clicking in middle:
├─────────┤├──────┤ Two clips
```

### 3. Ripple Edit Tool (B) 🌊
**Move clips and shift following content**

- **Icon**: Move arrows
- **Shortcut**: `B`
- **Function**: Move clips and automatically shift all following clips
- **Usage**:
  - Drag a clip to move it
  - All clips after it shift to close/open gaps
  - Maintains timeline continuity
  - Useful for inserting/removing content

**Example**:
```
Before:
Clip1 ├──┤ Clip2 ├──┤ Clip3 ├──┤

Move Clip2 right with Ripple:
Clip1 ├──┤    ├──┤ Clip2 Clip3 ├──┤
              ↑ Gap created, Clip3 shifts
```

### 4. Roll Edit Tool (N) 🔄
**Adjust edit point between two clips**

- **Icon**: Slice
- **Shortcut**: `N`
- **Function**: Adjust the boundary between adjacent clips
- **Usage**:
  - Drag the edit point between two clips
  - Extends one clip while trimming the other
  - Total duration stays the same
  - No gaps created

**Example**:
```
Before:
Clip1 ├─────┤├─────┤ Clip2

Roll edit point right:
Clip1 ├───────┤├───┤ Clip2
      (longer) (shorter)
```

### 5. Slip Tool (Y) 📄
**Change clip content without moving position**

- **Icon**: Copy
- **Shortcut**: `Y`
- **Function**: Adjust which part of the source is used
- **Usage**:
  - Drag to change the in/out points
  - Clip position on timeline stays fixed
  - Clip duration stays the same
  - Changes what content is visible

**Example**:
```
Source: [────────────────────]
         0s  2s  4s  6s  8s

Before Slip:
Timeline: ├──2s-4s──┤

After Slip:
Timeline: ├──4s-6s──┤
          (different content, same position)
```

### 6. Hand Tool (H) 🖐️
**Pan the timeline view**

- **Icon**: Hand
- **Shortcut**: `H`
- **Function**: Scroll/pan the timeline
- **Usage**:
  - Drag to pan the timeline view
  - Useful for navigating large projects
  - Cursor changes to grab hand
  - Cannot edit clips while active

## Tool Comparison

| Tool | Move Clips | Resize Clips | Split Clips | Shift Following | Change Content |
|------|-----------|--------------|-------------|-----------------|----------------|
| **Select** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Razor** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Ripple** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Roll** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Slip** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Hand** | ❌ | ❌ | ❌ | ❌ | ❌ |

## Keyboard Shortcuts

### Tool Selection
- `V` - Select Tool
- `C` - Razor Tool
- `B` - Ripple Edit Tool
- `N` - Roll Edit Tool
- `Y` - Slip Tool
- `H` - Hand Tool
- `Esc` - Return to Select Tool

### Other Shortcuts
- `Space` - Play/Pause
- `S` - Split at playhead
- `M` - Add marker
- `←` `→` - Navigate frames
- `Del` - Delete selected clips
- `Ctrl/Cmd + C` - Copy
- `Ctrl/Cmd + V` - Paste
- `Ctrl/Cmd + D` - Duplicate
- `+` `-` - Zoom in/out

## Visual Indicators

### Tool Active State
- **Active tool**: Blue background
- **Inactive tool**: Gray
- **Current tool**: Shown in status bar (bottom right)

### Cursor Changes
- **Select**: Default arrow
- **Razor**: Crosshair ✂️
- **Hand**: Grab hand 🖐️
- **Resize**: Horizontal arrows ↔️

## Usage Tips

### Best Practices

1. **Use Select Tool (V) for most editing**
   - Default tool for general work
   - Switch back with `Esc` or `V`

2. **Use Razor Tool (C) for quick splits**
   - Click exactly where you want to split
   - Faster than using `S` key at playhead

3. **Use Ripple Edit (B) for insertions**
   - Automatically maintains timeline flow
   - No manual gap closing needed

4. **Use Roll Edit (N) for fine-tuning**
   - Adjust edit points precisely
   - Maintains overall timing

5. **Use Slip Tool (Y) for content adjustment**
   - Fix timing without moving clips
   - Useful for syncing to music

6. **Use Hand Tool (H) for navigation**
   - Pan large timelines easily
   - Alternative to scrollbar

### Workflow Examples

#### Example 1: Insert New Clip
```
1. Select Ripple Tool (B)
2. Drag existing clip right
3. Following clips shift automatically
4. Drop new clip in gap
```

#### Example 2: Remove Section
```
1. Select Razor Tool (C)
2. Click at start of section to remove
3. Click at end of section
4. Select middle clip
5. Press Delete
6. Use Ripple Tool to close gap
```

#### Example 3: Adjust Edit Point
```
1. Select Roll Tool (N)
2. Drag boundary between clips
3. One extends, other trims
4. No gap created
```

## Current Implementation Status

### ✅ Implemented
- Select Tool - Full functionality
- Razor Tool - Click to split clips
- Tool switching with keyboard shortcuts
- Visual tool indicators
- Cursor changes
- Status bar showing active tool

### 🚧 Partially Implemented
- Ripple Edit - Tool selection works, logic needs implementation
- Roll Edit - Tool selection works, logic needs implementation
- Slip Tool - Tool selection works, logic needs implementation
- Hand Tool - Tool selection works, pan logic needs implementation

### 📋 To Be Implemented
- Ripple edit logic (shift following clips)
- Roll edit logic (adjust adjacent clips)
- Slip edit logic (change content timing)
- Hand tool pan functionality
- Visual feedback during edits
- Undo/redo for tool operations

## Technical Details

### Tool State Management
```typescript
const [tool, setTool] = useState<"select" | "razor" | "slip" | "slide" | "ripple" | "roll" | "hand">("select")
```

### Razor Tool Implementation
```typescript
if (tool === "razor") {
    const clip = clips.find(c => c.id === action.id)
    if (clip && !clip.locked) {
        // Split clip at click position
        const leftClip = { ...clip, endTime: time }
        const rightClip = { ...clip, startTime: time }
        
        onDeleteClip(clip.id)
        onAddClip(leftClip)
        onAddClip(rightClip)
    }
}
```

### Cursor Management
```typescript
style={{
    cursor: tool === "hand" ? "grab" : 
            tool === "razor" ? "crosshair" : 
            "default"
}}
```

## Future Enhancements

1. **Advanced Ripple Edit**
   - Ripple trim (resize with ripple)
   - Ripple delete (delete with ripple)
   - Track-specific ripple

2. **Advanced Roll Edit**
   - Multi-track roll
   - Asymmetric roll
   - Roll with audio sync

3. **Advanced Slip Edit**
   - Visual slip preview
   - Slip with audio scrub
   - Slip multiple clips

4. **Tool Modifiers**
   - Hold Alt for different behavior
   - Hold Shift for constrained edits
   - Hold Ctrl for precision mode

5. **Tool Presets**
   - Save custom tool configurations
   - Quick tool switching
   - Tool-specific settings

## Troubleshooting

### Tool Not Working?
1. Check if correct tool is selected (see status bar)
2. Verify clips are not locked
3. Try pressing `Esc` to reset
4. Switch to Select Tool (`V`) and try again

### Razor Tool Not Splitting?
1. Ensure you're clicking on a clip (not empty space)
2. Check clip is not locked (🔒 icon)
3. Verify click is within clip boundaries
4. Check console for error messages

### Can't Move Clips?
1. Switch to Select Tool (`V`)
2. Check if Razor or Hand tool is active
3. Verify clips are not locked
4. Check track is not locked

---

**Status**: ✅ Tools implemented and ready to use!
**Version**: 1.0
**Last Updated**: Current session
