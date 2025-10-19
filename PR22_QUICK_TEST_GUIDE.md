# PR #22 Layers Panel - Quick Test Guide

## 🚀 Quick Start
1. Start dev server: `npm run dev` (in collabcanvas directory)
2. Open http://localhost:5173 in browser
3. Sign in with Google

## ✅ Test Checklist

### Test 1: Open Layers Panel
- [ ] Click the 📄 button in the left toolbar
- [ ] Panel slides in smoothly from the left
- [ ] Button shows active state (purple background)
- [ ] Click 📄 again to close panel

### Test 2: Create and View Layers
- [ ] Create 5 shapes: 2 rectangles, 2 circles, 1 text
- [ ] Open layers panel
- [ ] All 5 shapes appear in the list
- [ ] Most recent shape is at the top
- [ ] Shape icons display correctly (▭ ● T)

### Test 3: Drag to Reorder
- [ ] Click and hold on a layer item
- [ ] Drag it up or down
- [ ] Layer item follows cursor with visual feedback
- [ ] Release to drop in new position
- [ ] Canvas updates immediately - shape rendering order changes
- [ ] Drag again - order persists

### Test 4: Select from Layers Panel
- [ ] Click a layer item
- [ ] Corresponding shape on canvas gets selected (blue border)
- [ ] Click another layer
- [ ] Selection switches to new shape
- [ ] Shift+click a second layer
- [ ] Both shapes selected (multi-select)

### Test 5: Bring to Front / Send to Back
- [ ] Create 3 overlapping rectangles
- [ ] Right-click the bottom rectangle
- [ ] Select "Bring to Front"
- [ ] Rectangle moves to top of stack
- [ ] Check layers panel - it's now at the top of the list
- [ ] Right-click the top rectangle
- [ ] Select "Send to Back"  
- [ ] Rectangle moves to bottom of stack
- [ ] Layers panel updates accordingly

### Test 6: Context Menu Integration
- [ ] Right-click any shape
- [ ] Context menu shows these options in order:
  - Copy
  - Duplicate
  - Comments
  - **---divider---**
  - **Bring to Front** ⬅️ NEW
  - **Send to Back** ⬅️ NEW
  - (Override Control - if applicable)

### Test 7: Empty State
- [ ] Delete all shapes from canvas
- [ ] Open layers panel
- [ ] Should show "No shapes on canvas" message

### Test 8: Real-Time Collaboration
- [ ] Open second browser window (use incognito mode)
- [ ] Sign in as different user
- [ ] Window 1: Create shapes and reorder layers
- [ ] Window 2: Should see all changes in real-time
- [ ] Window 2: Reorder layers
- [ ] Window 1: Should see changes immediately
- [ ] Both windows: Layers stay in sync

### Test 9: Text Shape Names
- [ ] Create a text shape with content "Hello World"
- [ ] Open layers panel
- [ ] Text layer shows "Hello World" instead of "Text"
- [ ] Create text with 30+ characters
- [ ] Layer name truncates with "..." after 20 chars

### Test 10: Panel Interactions
- [ ] Open layers panel
- [ ] Click the X button in panel header
- [ ] Panel closes smoothly
- [ ] Refresh page
- [ ] Panel is closed by default (state doesn't persist - expected)

## 🐛 What to Look For

### Visual Issues
- ✅ Panel should have smooth slide-in animation
- ✅ Selected layers highlighted in light purple
- ✅ Hover shows gray background with purple border
- ✅ Drag cursor shows as "grabbing"
- ✅ Layer items shouldn't clip or overlap

### Functionality Issues
- ✅ Drag threshold: Must move 8px before drag starts (prevents accidental drags)
- ✅ Canvas order must match layers panel order (top = front)
- ✅ Selection from panel must match selection on canvas
- ✅ Context menu options must work immediately
- ✅ No console errors during any operation

### Performance Issues
- ✅ Smooth 60fps animations
- ✅ No lag when dragging layers
- ✅ Fast real-time sync (changes appear within 100-200ms)
- ✅ Works smoothly with 20+ shapes

### Edge Cases
- ✅ Panel works with locked shapes (by other users)
- ✅ Panel works during shape creation (place mode)
- ✅ Layer operations work while AI is processing
- ✅ Multi-select in panel matches multi-select on canvas

## 🎯 Expected Behavior

### Layer Ordering Logic
```
Top of Layers List = Front of Canvas = Highest zIndex
Bottom of Layers List = Back of Canvas = Lowest zIndex
```

### Example:
```
Layers Panel:          Canvas View:
┌─────────────────┐    ┌─────────────────┐
│ Text (zIndex: 5)│    │       [Text]    │ ← On top
│ Circle (zIndex:4)│   │      [Circle]   │
│ Rectangle (z:3) │    │   [Rectangle]   │
│ Circle (zIndex:2)│   │    [Circle]     │
│ Rectangle (z:1) │    │  [Rectangle]    │ ← At back
└─────────────────┘    └─────────────────┘
```

### Drag to Reorder:
```
Before:                After dragging Rectangle to top:
┌─────────────────┐    ┌─────────────────┐
│ Text            │    │ Rectangle ✓     │ ← Moved here
│ Circle          │    │ Text            │
│ Rectangle       │ →  │ Circle          │
└─────────────────┘    └─────────────────┘
```

## 📸 Screenshot Points

Take screenshots of:
1. Layers panel closed (just the 📄 button)
2. Layers panel open with 5+ shapes
3. Dragging a layer (mid-drag state)
4. Selected layer (highlighted in purple)
5. Context menu with new "Bring to Front" / "Send to Back" options
6. Empty state ("No shapes on canvas")
7. Multi-user view (two windows showing sync)

## ⚠️ Known Issues (Not Bugs)

1. **Panel state doesn't persist** - This is expected. Panel always starts closed after refresh.
2. **Non-text shapes show type name** - Rectangles show "Rectangle", not custom names (no custom naming feature yet).
3. **No keyboard shortcuts** - Layer ordering only via mouse/context menu for now.

## 🎉 Success Criteria

All tests pass? **PR #22 is ready!** 

If you find any issues:
1. Note which test failed
2. Check browser console for errors
3. Try in different browser (Chrome vs Firefox)
4. Test with multiple users to verify real-time sync
5. Report specific steps to reproduce

---

**Happy Testing! 🚀**

