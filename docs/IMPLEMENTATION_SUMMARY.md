# CollabCanvas Implementation Summary - PRs 13-25

## 📋 Quick Reference

This document provides a quick overview of all planned features for PRs 13-25. For detailed technical specifications, see:
- `PR13_PLUS_SPECIFICATION.md` - Original features (color, shapes, multi-select, copy/paste)
- `PR13_PLUS_DETAILED_SPEC.md` - Additional features (arrows, undo, layers, comments, etc.)

---

## 🎯 Complete Feature List (13 Features)

### 1. Advanced Color System (PR #13)
- **Toolbar color picker** with 15 slots:
  - 10 default colors (black, white, blue, green, red, purple, pink, gray, yellow, orange)
  - 5 custom user-specific colors (persistent)
- **Hex code input** for manual color entry
- **Apply to selection** - change color of all selected shapes
- **Effort:** 4-5 hours

### 2. Rename Rectangle to Square (PR #14)
- Update UI text from "Rectangle" to "Square"
- Keep internal `type: "rectangle"` for backward compatibility
- **Effort:** 15 minutes

### 3. Circle Tool (PR #15)
- Add **Circle button** to toolbar
- Click-to-place interaction (same as square)
- Circles support: select, move, resize (locked aspect ratio), rotate, color
- **Effort:** 2-3 hours

### 4. Line Tool (PR #16)
- Add **Line button** to toolbar
- **Two-click placement** (click start, click end)
- **Line width submenu** with slider (1-100px)
- Lines support: select, move (both endpoints), adjust width
- **Effort:** 4-5 hours

### 5. Text Tool (PR #17)
- Add **Text button** to toolbar
- Click-to-place with text prompt
- **Font options:** Arial (default), Times New Roman, Papyrus
- **Styling:** Bold, Underline
- **Double-click to edit** text after placing
- **Effort:** 4-5 hours

### 6. Multi-Select (PR #18)
- **Click and drag** on empty canvas to draw selection box
- **Release** to select all shapes within box
- **Move in unison** - drag one, all selected shapes move together
- **Color in unison** - change color applies to all selected
- **Delete in unison** - Delete key removes all selected
- **Effort:** 5-6 hours

### 7. Copy/Paste (PR #19)
- **Right-click** shape → Copy
- **Right-click** canvas → Paste
- Paste at cursor position with slight offset
- **Keyboard shortcuts:** Ctrl+C, Ctrl+V
- Works with multi-select (copy/paste multiple shapes)
- **Effort:** 3-4 hours

### 8. Arrow Key Movement (PR #20)
- **Arrow keys** move selected shapes by **1 pixel**
  - ← Left arrow → Move 1px left
  - ↑ Up arrow → Move 1px up
  - → Right arrow → Move 1px right
  - ↓ Down arrow → Move 1px down
- Works with single or multiple selection
- **Effort:** 1-2 hours

### 9. Undo/Redo System (PR #21)
- **Ctrl+Z** → Undo last action
- **Ctrl+Shift+Z** → Redo action
- **Maximum 10 undo steps**
- **Banner** shown if user tries to undo beyond 10 steps
- Tracks: create, update, delete, move, color change
- **Effort:** 6-8 hours

### 10. Layers Panel (PR #22)
- **Left sidebar section** showing all shapes/objects
- **Top of list** = front of canvas (highest z-index)
- **Drag to reorder** layers (changes z-index)
- **Right-click menu:**
  - Bring to Front
  - Send to Back
- **Effort:** 5-6 hours

### 11. Comments System (PR #23)
- **Left sidebar section** under Layers
- **+ button** to add comment to a shape
- Comment shows:
  - User initials (2 letters)
  - User name + timestamp (relative, e.g., "3m ago")
  - Comment text (max 100 chars)
- **Click text to edit**, click elsewhere to save
- **X button** to delete
- All users can see and edit all comments
- **Effort:** 6-8 hours

### 12. Users Online Button (PR #24)
- Replace sidebar user list with **top bar button**
- Button shows **"XX Users"** (count of online users)
- Positioned left of user profile icon
- Click to show dropdown with full user list
- **Effort:** 2-3 hours

### 13. Connection Indicator (PR #25)
- **Green circle** = connected and synced
- **Red circle** after 1000ms of disconnect
- **Auto-reconnect** attempt every 5 seconds
- Positioned left of "XX Users" button
- **Effort:** 2-3 hours

---

## 🗂️ New Data Models

### Shape Object (Extended)
```javascript
{
  id: string,
  type: "rectangle" | "circle" | "line" | "text",
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  fill: string,                  // NEW: Hex color
  stroke: string,                // NEW: For lines
  strokeWidth: number,           // NEW: Line width (1-100)
  zIndex: number,                // NEW: Layer order
  
  // Line-specific
  points: [x1, y1, x2, y2],     // NEW: Line endpoints
  
  // Text-specific
  text: string,                  // NEW: Text content
  fontSize: number,              // NEW: Font size
  fontFamily: string,            // NEW: Font name
  fontStyle: string,             // NEW: "normal" | "bold"
  textDecoration: string,        // NEW: "" | "underline"
  
  // Existing
  createdBy: userId,
  lockedBy: userId | null,
  updatedAt: timestamp,
}
```

### User Preferences (NEW Collection)
```
/users/{userId}/
  ├── customColors: string[]    // 5 custom hex colors
  └── updatedAt: timestamp
```

### Comments (NEW Collection)
```
/canvases/main/comments/{commentId}/
  ├── id: string
  ├── shapeId: string
  ├── text: string
  ├── userId: string
  ├── userName: string
  ├── userInitials: string
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── deleted: boolean
```

---

## 🎨 UI Layout Changes

### Left Sidebar (NEW)
```
┌──────────────────────┐
│ Tools                │
│  [Square] [Circle]   │
│  [Line] [Text]       │
│                      │
│ Color                │
│  [●][●][●][●][●]...  │ 10 default
│  [ ][ ][ ][ ][ ]     │ 5 custom
│  Hex: [#000000]      │
│                      │
│ ▶ Layers             │ Expandable
│   Rectangle 1        │
│   Circle 1           │
│   ...                │
│                      │
│ ▶ Comments      [+]  │ Expandable
│   #1 · Shape Name    │
│   User 3m ago        │
│   Comment text...    │
└──────────────────────┘
```

### Top Bar (UPDATED)
```
┌────────────────────────────────────────────┐
│ [●] [3 Users] ▼            👤 User Name ▼  │
│  ^      ^                       ^           │
│  |      |                       |           │
│  |      +-- Users online        +-- Profile│
│  +-- Connection indicator                   │
└────────────────────────────────────────────┘
```

---

## 📦 New Dependencies

```bash
npm install react-beautiful-dnd  # For layers drag-and-drop
```

---

## 🗂️ New Files to Create

### Components
- `src/components/LayersPanel.jsx` + `LayersPanel.css`
- `src/components/CommentsPanel.jsx` + `CommentsPanel.css`
- `src/components/ConnectionIndicator.jsx` + `ConnectionIndicator.css`
- `src/components/UsersOnlineButton.jsx` + (styles in existing CSS)

### Hooks
- `src/hooks/useUserPreferences.js` - Custom colors
- `src/hooks/useUndoRedo.js` - Undo/redo history
- `src/hooks/useComments.js` - Comments CRUD

### Services
- Update `src/lib/firestoreService.js` with comment operations

---

## 🔄 Files to Modify

### Major Changes
- `src/components/Canvas.jsx` - Multi-select, arrow keys, undo/redo keyboard shortcuts
- `src/components/Shape.jsx` - Render circles, lines, text; handle different transform behaviors
- `src/components/Toolbar.jsx` - Add color picker, new tool buttons, font options
- `src/components/ContextMenu.jsx` - Add copy/paste, bring to front, send to back, delete
- `src/hooks/useCanvas.js` - Layer management (zIndex), multi-select state

### Minor Changes
- `src/App.jsx` - Integrate new top bar layout, left sidebar panels
- `src/components/Toolbar.css` - Color picker styles
- `src/components/Canvas.css` - Selection box styles, undo banner
- `src/components/ContextMenu.css` - New menu items

---

## ⚙️ Firestore Security Rules Updates

Add rules for new collections:

```javascript
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /canvases/{canvasId}/comments/{commentId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 🧪 Testing Checklist

For each PR, test:
- ✅ Multi-user sync (2+ browser windows)
- ✅ Real-time updates (<100ms latency)
- ✅ Lock conflicts (two users try same action)
- ✅ Offline/reconnect scenarios
- ✅ Performance with 20+ shapes
- ✅ Keyboard shortcuts work
- ✅ Mobile/tablet compatibility (if applicable)

---

## 📊 Implementation Priority

### Phase 1: Core Tools (PRs 13-17) - 15-18 hours
1. PR #13: Color System
2. PR #14: Rename to Square
3. PR #15: Circle Tool
4. PR #16: Line Tool
5. PR #17: Text Tool

### Phase 2: Selection & Manipulation (PRs 18-20) - 9-12 hours
6. PR #18: Multi-Select
7. PR #19: Copy/Paste
8. PR #20: Arrow Key Movement

### Phase 3: Advanced Features (PRs 21-25) - 21-28 hours
9. PR #21: Undo/Redo
10. PR #22: Layers Panel
11. PR #23: Comments System
12. PR #24: Users Online Button
13. PR #25: Connection Indicator

---

## 🚀 Total Estimated Effort

**50-65 hours** total for all 13 features (PRs 13-25)

- **Minimum:** ~50 hours (optimistic, experienced dev)
- **Maximum:** ~65 hours (including debugging, testing, polish)
- **Average:** ~4-5 hours per feature

---

## 💡 Implementation Tips

1. **Start simple:** Implement PR #14 first (15 min) to get momentum
2. **Test incrementally:** Open 2-3 browser windows for every feature
3. **Commit frequently:** Commit after each sub-feature works
4. **Deploy often:** Deploy after each PR to catch Firebase issues early
5. **Use the docs:** Reference `PR13_PLUS_DETAILED_SPEC.md` for code examples
6. **Handle errors:** All Firestore writes need try-catch blocks
7. **Performance:** Test with 20+ shapes to ensure 60 FPS
8. **Backward compatibility:** Don't break existing data when adding fields

---

## 📚 Reference Documents

- **PRD.md** - Original product requirements
- **tasks.md** - PR 1-12 breakdown (completed MVP)
- **ARCHITECTURE.md** - Firestore structure diagram
- **TESTING_GUIDE.md** - Comprehensive testing checklist
- **PR13_PLUS_SPECIFICATION.md** - Original features (tools, multi-select, copy/paste)
- **PR13_PLUS_DETAILED_SPEC.md** - Additional features (arrows, undo, layers, comments)

---

## ❓ Questions Answered

1. ✅ **Color picker location:** Toolbar (for new shapes and selected shapes)
2. ✅ **Text editing:** Use browser `prompt()` for simplicity, upgrade later if needed
3. ✅ **Multi-select behavior:** Drag shows preview box, release selects all within bounds
4. ✅ **Default colors:** 10 fixed + 5 custom user-specific colors with hex input
5. ✅ **Line rotation:** No rotation, only endpoint dragging
6. ✅ **Shape defaults:** 100x100px, black (or selected color)

---

## 🎉 Ready to Build!

All technical decisions made, all features specified, all code examples provided. Time to implement PRs 13-25 and take CollabCanvas to the next level! 🚀

