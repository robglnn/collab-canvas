# CollabCanvas PRs 13+ - Technical Specification & Implementation Guide

## 📋 Document Purpose
This document provides comprehensive technical details for implementing feature additions beyond the MVP (PRs 13+). It includes current system architecture, implementation patterns, and detailed specifications for new features.

---

## 🎯 New Features to Implement (PRs 13+)

### High-Level Feature List:
1. **Color Customization** - Allow changing shape fill colors
2. **Circle Tool** - Add button for creating circles
3. **Line Tool** - Add button for creating lines with adjustable width (1-100px)
4. **Text Tool** - Add text creation with font options (Arial, Times New Roman, Papyrus) and styling (bold, underline)
5. **Multi-Select** - Click and drag to select multiple shapes simultaneously
6. **Copy/Paste** - Right-click menu options to copy and paste shapes
7. **Tool Renaming** - Rename "Rectangle" to "Square" in UI

---

## 🏗️ Current System Architecture

### Tech Stack
- **Frontend:** React 18 + Vite
- **Canvas Rendering:** Konva.js (React-Konva)
- **Backend:** Firebase (Firestore + Authentication + Hosting)
- **Authentication:** Google OAuth via Firebase Auth
- **Deployment:** Firebase Hosting (https://collab-canvas-d0e38.web.app)

### Project Structure
```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx              # Main canvas with Konva Stage
│   │   ├── Toolbar.jsx             # Tool buttons (rectangle, etc.)
│   │   ├── Shape.jsx               # Individual shape renderer
│   │   ├── UserCursor.jsx          # Remote user cursors
│   │   ├── UserList.jsx            # Online users sidebar
│   │   ├── ContextMenu.jsx         # Right-click menu
│   │   ├── Auth.jsx                # Google sign-in
│   │   └── DisconnectBanner.jsx    # Network status
│   ├── hooks/
│   │   ├── useCanvas.js            # Canvas state management
│   │   ├── useAuth.js              # Firebase auth state
│   │   ├── useFirestore.js         # Real-time Firestore listeners
│   │   ├── useCursors.js           # Cursor sync logic
│   │   └── usePresence.js          # User presence tracking
│   ├── lib/
│   │   ├── firebase.js             # Firebase config
│   │   ├── firestoreService.js     # Firestore CRUD operations
│   │   └── canvasUtils.js          # Coordinate transformations
│   └── main.jsx                    # React entry point
├── firebase.json                   # Firebase hosting config
├── firestore.rules                 # Security rules
└── .env.local                      # Firebase credentials (not committed)
```

---

## 🗄️ Current Firestore Data Model

### Database Structure
```
/canvases/
  └── main/                           # Single shared canvas
      ├── (metadata document)         # Canvas owner info
      │   ├── ownerId: string
      │   └── createdAt: timestamp
      │
      ├── objects/                    # All shapes
      │   └── {shapeId}/
      │       ├── id: string
      │       ├── type: "rectangle"   # Currently only rectangles
      │       ├── x: number
      │       ├── y: number
      │       ├── width: number
      │       ├── height: number
      │       ├── rotation: number    # 0-360 degrees
      │       ├── fill: string        # Currently always "#000000"
      │       ├── createdBy: userId
      │       ├── lockedBy: userId | null
      │       └── updatedAt: timestamp
      │
      ├── cursors/                    # User cursor positions
      │   └── {userId}/
      │       ├── userId: string
      │       ├── userName: string
      │       ├── x: number
      │       ├── y: number
      │       └── lastUpdate: timestamp
      │
      └── presence/                   # User online status
          └── {userId}/
              ├── userId: string
              ├── userName: string
              ├── userEmail: string
              ├── photoURL: string | null
              ├── role: "owner" | "collaborator"
              ├── online: boolean
              ├── kicked: boolean
              └── lastSeen: timestamp
```

### **IMPORTANT: Data Model Updates for New Features**

For PRs 13+, the shape data model will need to be extended:

```javascript
// Updated Shape Object (for all shape types)
{
  id: string,                    // Unique shape ID (unchanged)
  type: "rectangle" | "circle" | "line" | "text",  // NEW: Add new types
  x: number,                     // Position (unchanged)
  y: number,                     // Position (unchanged)
  width: number,                 // Dimensions (unchanged)
  height: number,                // Dimensions (unchanged)
  rotation: number,              // 0-360 degrees (unchanged)
  fill: string,                  // NEW: Hex color (e.g., "#ff5733")
  stroke: string,                // NEW: Stroke color (for lines, borders)
  strokeWidth: number,           // NEW: For lines (1-100px)
  createdBy: userId,             // Unchanged
  lockedBy: userId | null,       // Unchanged
  updatedAt: timestamp,          // Unchanged
  
  // Text-specific fields (only for type: "text")
  text: string,                  // NEW: Text content
  fontSize: number,              // NEW: Font size in pixels
  fontFamily: string,            // NEW: "Arial" | "Times New Roman" | "Papyrus"
  fontStyle: string,             // NEW: "normal" | "bold"
  textDecoration: string,        // NEW: "" | "underline"
}
```

---

## 🎨 Current Shape System Implementation

### Shape Component (`src/components/Shape.jsx`)

**Current Behavior:**
- Renders a **Konva `<Rect>`** component
- Supports **selection** (blue outline), **locking** (red border), **dragging**, **resizing** (8 handles), and **rotation**
- All rectangles currently have `fill="#000000"` (black)
- Lock mechanism prevents other users from editing when a shape is locked
- Owner can override locks via right-click context menu

**Key Props:**
```javascript
Shape({
  shape,              // Shape data object
  isSelected,         // Boolean: is this shape selected?
  canEdit,            // Boolean: can current user edit this?
  lockedByName,       // String: name of user who locked shape
  isOwner,            // Boolean: is current user canvas owner?
  currentUserId,      // String: current user's ID
  onSelect,           // Function: called when shape clicked
  onChange,           // Function: called when shape moved/resized/rotated
  onLock,             // Function: lock shape
  onUnlock,           // Function: unlock shape
  onRightClick,       // Function: show context menu
})
```

**Current Konva Components Used:**
- `<Rect>` - Rectangle rendering
- `<Transformer>` - Resize/rotate handles (8 handles + rotation handle)
- `<Text>` - Lock indicator label
- `<Group>` - Groups shape and label together

**Transform Behavior:**
- **8 resize handles:** 4 corners + 4 middles (free-form resizing, not locked to aspect ratio)
- **Rotation handle:** Circular icon above shape, rotates 0-360°
- **Transform end:** Updates Firestore with new dimensions/position/rotation

---

## 🧩 Current Toolbar System

### Toolbar Component (`src/components/Toolbar.jsx`)

**Current Implementation:**
- Single tool: "Rectangle" button
- Clicking button enters **place mode** (cursor changes to crosshair)
- User clicks canvas once to place shape
- **Auto-exits place mode** after placing one shape
- Uses `window.exitPlaceMode()` global function (hack for parent communication)

**Current Structure:**
```jsx
<div className="toolbar">
  <div className="toolbar-section">
    <h3 className="toolbar-title">Tools</h3>
    
    <button className={`toolbar-btn ${isPlaceMode ? 'active' : ''}`}>
      <svg><!-- SVG icon --></svg>
      <span>Rectangle</span>
    </button>
  </div>
  
  {isPlaceMode && (
    <div className="toolbar-hint">
      Click on canvas to place rectangle
    </div>
  )}
</div>
```

**Styling:** Uses `Toolbar.css` with purple gradient theme matching auth page

---

## 🖱️ Current Canvas Interaction Flow

### Canvas Component (`src/components/Canvas.jsx`)

**Key State:**
```javascript
const [stagePos, setStagePos] = useState({ x: 0, y: 0 });  // Pan position
const [stageScale, setStageScale] = useState(1);           // Zoom level
const [isDragging, setIsDragging] = useState(false);       // Panning?
const [placeMode, setPlaceMode] = useState(null);          // "rectangle" or null
const [contextMenu, setContextMenu] = useState(null);      // Right-click menu
const [cursorCanvasPos, setCursorCanvasPos] = useState({x: 0, y: 0}); // Debug display
```

**Canvas Dimensions:**
- **Canvas Size:** 5000x5000px workspace (white background)
- **Spawn Point:** Center of canvas (2500, 2500) at 100% zoom
- **Zoom Range:** 0.1x to 5x (10% to 500%)
- **Zoom Behavior:** Cursor-centered zoom (zooms toward mouse position, not origin)

**Pan & Zoom:**
- **Pan:** Left-click drag on empty canvas
- **Zoom:** Mouse scroll wheel (cursor-centered with smooth 1.05 scale factor)
- **Boundary Enforcement:** Cannot pan beyond 5000x5000px canvas bounds

**Shape Creation Flow:**
1. User clicks toolbar button → `placeMode = "rectangle"`
2. Canvas cursor changes to crosshair
3. User clicks canvas → `handleCanvasClick()` fires
4. Creates shape at click position with:
   - Width: 100px, Height: 100px
   - Fill: Random color (generated via `generateRandomColor()`)
   - Position: Cursor position on canvas
5. Writes shape to Firestore via `addShape()`
6. Exits place mode automatically

**Shape Deletion:**
- **Method 1:** Right-click shape → "Delete" option (currently not in context menu)
- **Method 2:** Select shape → press **Delete key** (keyboard listener on canvas)

**Keyboard Handling:**
```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && selectedShapeId) {
      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (shape && canEditShape(shape)) {
        deleteShape(selectedShapeId);
      }
    }
  };
  // ... attach listener
}, [selectedShapeId, shapes, canEditShape, deleteShape]);
```

---

## 🔄 Real-Time Sync Pattern

### Optimistic Updates with Firestore Listeners

**Pattern Used Throughout App:**
1. User action triggers local state change (immediate feedback)
2. Write to Firestore (async)
3. Firestore `onSnapshot` listener fires
4. All clients receive update and re-render
5. If Firestore write fails, listener never fires → local state stays stale → user sees error alert

**Example: Moving a Shape**
```javascript
// In Shape.jsx - handleDragEnd
const handleDragEnd = (e) => {
  if (!canEdit) return;
  
  onChange({
    ...shape,
    x: e.target.x(),
    y: e.target.y(),
  });
};

// In Canvas.jsx - passes onChange to Shape
const handleShapeChange = (updatedShape) => {
  updateShape(updatedShape.id, updatedShape);
};

// In useCanvas.js - updateShape
const updateShape = useCallback(async (shapeId, updates) => {
  // No local optimistic update - Firestore listener handles it
  await updateShapeInFirestore(shapeId, updates);
}, [user]);

// In firestoreService.js - updateShapeInFirestore
export async function updateShape(shapeId, updates) {
  const shapeRef = doc(db, 'canvases', 'main', 'objects', shapeId);
  await updateDoc(shapeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// In useFirestore.js - Real-time listener
export function useFirestore() {
  const [shapes, setShapes] = useState([]);
  
  useEffect(() => {
    const shapesRef = collection(db, 'canvases', 'main', 'objects');
    const unsubscribe = onSnapshot(shapesRef, (snapshot) => {
      const shapesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setShapes(shapesData);
    });
    
    return unsubscribe;
  }, []);
  
  return { shapes };
}
```

**Key Insight:** No manual optimistic updates needed. Konva shapes re-render automatically when Firestore listener updates state. This is fast enough (<100ms latency) that it feels instant.

---

## 🔐 Shape Locking Mechanism

### Lock Flow
1. User selects shape → `lockShape(shapeId)` called
2. Writes `lockedBy: userId` to Firestore
3. All clients see lock → shape shows red border with "Locked by [User]" label
4. Other users cannot select/move/resize locked shape (unless owner)
5. User deselects shape → `unlockShape(shapeId)` called
6. Writes `lockedBy: null` to Firestore

### Lock Cleanup (Stale Locks)
- Every **5 seconds**, `useCanvas.js` checks all locked shapes
- If `lockedBy` user is offline (not in presence collection), unlocks shape
- Prevents stale locks when users disconnect without properly releasing

### Owner Override
- Owner can right-click any locked shape
- Context menu shows "Override Control" option
- Calls `forceOverrideLock(shapeId)` → writes `lockedBy: ownerId`
- Previous user loses control immediately

---

## 🎨 Color System (Current & Planned)

### Current Implementation
All shapes have hardcoded black fill:
```javascript
fill="#000000"
```

Random colors are generated but stored in Firestore (not used for fill yet):
```javascript
function generateRandomColor() {
  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

### Planned for PRs 13+
- Add color picker UI (toolbar or context menu)
- Store `fill` property in Firestore (already supported in data model)
- Render shapes with `fill={shape.fill || "#000000"}`
- Allow changing color of existing shapes (update Firestore)

---

## 🧪 Testing Infrastructure

### Testing Strategy
- **Multi-user testing:** Open 3+ browser windows with different Google accounts
- **Real-time sync testing:** Verify actions in one window appear in others <100ms
- **Lock testing:** Verify owner override, stale lock cleanup
- **Performance testing:** Test with 20+ shapes, verify 60 FPS
- **Network testing:** Use Chrome DevTools to simulate offline, verify disconnect banner

### Current Testing Guide
See `docs/TESTING_GUIDE.md` for comprehensive 50+ test case checklist

---

## 📐 Coordinate System & Utilities

### Coordinate Transformation (`src/lib/canvasUtils.js`)

**Two coordinate systems:**
1. **Screen coordinates:** Pixels from top-left of viewport (what mouse gives you)
2. **Canvas coordinates:** Pixels from top-left of 5000x5000 canvas (what shapes use)

**Conversion Function:**
```javascript
/**
 * Convert screen coordinates to canvas coordinates
 * Accounts for pan (stagePos) and zoom (stageScale)
 * 
 * @param {number} screenX - X position in screen coordinates
 * @param {number} screenY - Y position in screen coordinates
 * @param {Object} stagePos - Stage position {x, y}
 * @param {number} stageScale - Stage scale (zoom level)
 * @returns {Object} Canvas coordinates {x, y}
 */
export function screenToCanvas(screenX, screenY, stagePos, stageScale) {
  return {
    x: (screenX - stagePos.x) / stageScale,
    y: (screenY - stagePos.y) / stageScale,
  };
}
```

**Usage Example (placing a shape at cursor position):**
```javascript
const stage = stageRef.current;
const pointerPos = stage.getPointerPosition();
const canvasPos = screenToCanvas(
  pointerPos.x,
  pointerPos.y,
  stage.position(),
  stage.scaleX()
);
// Now canvasPos.x and canvasPos.y are correct for shape creation
```

---

## 🚀 Development Workflow & PR Process

### Code Style Rules (from `.cursorrules`)
- Use **functional React components** with hooks
- **Named exports** for utilities, **default export** for components
- Prefer `async/await` over promises
- Add **JSDoc comments** for complex functions
- Use descriptive variable names

### Firebase Rules
- Never hardcode Firebase config (use `.env.local`)
- All Firestore writes must handle errors (try-catch)
- Throttle real-time updates (cursors: 50-100ms)
- Use optimistic updates for better UX

### Testing Before Committing
- Test with 2+ browser windows for multiplayer features
- Console.log key state changes during development
- Test offline/reconnection scenarios

### PR Workflow
- Create feature branch from `main`
- Implement feature following PRD and task breakdown
- Test thoroughly (see TESTING_GUIDE.md)
- Commit with descriptive messages (e.g., "feat: Add color picker to toolbar")
- Push to GitHub and create PR
- Merge to main after review
- Deploy to Firebase Hosting

---

# 🎯 DETAILED FEATURE SPECIFICATIONS FOR PRS 13+

---

## Feature 1: Color Customization

### User Story
As a user, I want to change the fill color of shapes so that I can create colorful designs.

### Requirements
1. Add a **color picker** to the toolbar or shape properties panel
2. Allow selecting color when creating new shapes (preview in place mode)
3. Allow changing color of existing shapes (select shape → pick new color)
4. Support hex colors (e.g., `#ff5733`) or predefined palette
5. Sync color changes to all users in real-time

### Technical Implementation

#### Data Model Changes
- Shape object already supports `fill: string` (currently hardcoded to `"#000000"`)
- No schema changes needed - just start writing `fill` to Firestore

#### UI Components to Add/Modify

**Option A: Toolbar Color Picker**
```jsx
// Add to Toolbar.jsx
<div className="toolbar-section">
  <h3 className="toolbar-title">Color</h3>
  <input 
    type="color" 
    value={selectedColor} 
    onChange={(e) => setSelectedColor(e.target.value)}
    className="color-picker"
  />
  {/* Or color swatches */}
  <div className="color-swatches">
    {COLORS.map(color => (
      <button 
        key={color}
        className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
        style={{ backgroundColor: color }}
        onClick={() => setSelectedColor(color)}
      />
    ))}
  </div>
</div>
```

**Option B: Context Menu Color Picker**
```jsx
// Add to ContextMenu.jsx
<div className="context-menu-item" onClick={handleColorPickerOpen}>
  <span className="context-menu-icon">🎨</span>
  <span>Change Color</span>
</div>
```

#### Code Changes

**1. Update `Canvas.jsx` - store selected color:**
```javascript
const [selectedColor, setSelectedColor] = useState('#000000');

// Pass selectedColor to Toolbar
<Toolbar 
  onCreateShape={handleCreateShape} 
  selectedColor={selectedColor}
  onColorChange={setSelectedColor}
/>
```

**2. Update shape creation in `Canvas.jsx`:**
```javascript
const handleCanvasClick = (e) => {
  if (!placeMode || !user) return;
  
  // ... get canvas position ...
  
  const newShape = {
    id: `shape-${Date.now()}-${Math.random()}`,
    type: placeMode, // "rectangle"
    x: canvasPos.x - 50,
    y: canvasPos.y - 50,
    width: 100,
    height: 100,
    rotation: 0,
    fill: selectedColor, // Use selected color instead of hardcoded black
  };
  
  addShape(newShape);
  // ...
};
```

**3. Update `Shape.jsx` - use shape.fill:**
```javascript
<Rect
  // ...
  fill={shape.fill || "#000000"} // Use shape's fill color
  // ...
/>
```

**4. Add function to change color of existing shape:**
```javascript
// In Canvas.jsx
const handleColorChange = (shapeId, newColor) => {
  updateShape(shapeId, { fill: newColor });
};
```

#### Suggested Color Palette
```javascript
const DEFAULT_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ef4444', // Red
  '#f59e0b', // Orange
  '#eab308', // Yellow
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
];
```

---

## Feature 2: Rename "Rectangle" to "Square"

### User Story
As a user, I want the "Rectangle" tool to be labeled as "Square" for clarity.

### Requirements
1. Rename button text from "Rectangle" to "Square" in toolbar
2. Update all user-facing text references
3. Keep internal `type: "rectangle"` in data model for backward compatibility

### Technical Implementation

**Changes needed:**

**1. Update `Toolbar.jsx`:**
```javascript
<button
  className={`toolbar-btn ${isPlaceMode ? 'active' : ''}`}
  onClick={handleRectangleClick} // Keep function name or rename
  title="Click to place square (100x100px)"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" rx="1"/>
  </svg>
  <span>Square</span> {/* Changed from "Rectangle" */}
</button>
```

**2. Update tooltip/hint text:**
```javascript
{isPlaceMode && (
  <div className="toolbar-hint">
    Click on canvas to place square {/* Changed */}
  </div>
)}
```

**Note:** Keep `type: "rectangle"` in Firestore for backward compatibility with existing shapes.

---

## Feature 3: Circle Tool

### User Story
As a user, I want to create circle shapes so that I can design with more variety.

### Requirements
1. Add "Circle" button to toolbar
2. Click button → enter place mode (like rectangle)
3. Click canvas → place circle (default: 100px diameter)
4. Circles can be selected, moved, resized, rotated, locked (same as rectangles)
5. Circles sync in real-time

### Technical Implementation

#### Data Model
Circle stored as:
```javascript
{
  id: "shape-xyz",
  type: "circle",
  x: 2500,          // Center X
  y: 2500,          // Center Y
  radius: 50,       // Or width/height: 100 (diameter)
  fill: "#3b82f6",
  rotation: 0,      // Not visually useful for circles, but keep for consistency
  createdBy: "user123",
  lockedBy: null,
  updatedAt: timestamp,
}
```

**Decision:** Use `radius` or `width`/`height`?
- **Option A:** Store `radius: 50` (simpler for circles)
- **Option B:** Store `width: 100, height: 100` (consistent with rectangles, allows ellipses)

**Recommendation:** Use Option B (`width`/`height`) for consistency and future ellipse support.

#### Code Changes

**1. Add Circle button to `Toolbar.jsx`:**
```jsx
<button
  className={`toolbar-btn ${isPlaceMode === 'circle' ? 'active' : ''}`}
  onClick={handleCircleClick}
  title="Click to place circle (100px diameter)"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
  </svg>
  <span>Circle</span>
</button>
```

```javascript
const handleCircleClick = () => {
  setIsPlaceMode('circle');
  onCreateShape('circle');
  console.log('Place mode activated: circle');
};
```

**2. Update `Canvas.jsx` - handle circle placement:**
```javascript
const handleCanvasClick = (e) => {
  if (!placeMode || !user) return;
  
  // ... get canvas position ...
  
  const newShape = {
    id: `shape-${Date.now()}-${Math.random()}`,
    type: placeMode, // "rectangle" or "circle"
    x: canvasPos.x - 50,
    y: canvasPos.y - 50,
    width: 100,
    height: 100, // For circles, width === height (diameter)
    rotation: 0,
    fill: selectedColor,
  };
  
  addShape(newShape);
  exitPlaceMode();
};
```

**3. Update `Shape.jsx` - render circles:**
```jsx
import { Rect, Circle, Transformer, Text, Group } from 'react-konva';

const Shape = memo(function Shape({ shape, ... }) {
  // ... existing logic ...
  
  // Determine which shape to render
  const renderShape = () => {
    if (shape.type === 'circle') {
      return (
        <Circle
          ref={shapeRef}
          id={shape.id}
          x={shape.x + shape.width / 2}  // Circle x is center, not top-left
          y={shape.y + shape.height / 2} // Circle y is center, not top-left
          radius={shape.width / 2}        // Assumes width === height
          fill={shape.fill || "#000000"}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          draggable={canEdit}
          onClick={handleClick}
          onTap={handleClick}
          onContextMenu={handleRightClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onMouseEnter={() => { if (isLockedByOther) setShowLockLabel(true); }}
          onMouseLeave={() => setShowLockLabel(false)}
          shadowColor={isSelected ? '#667eea' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={0.5}
        />
      );
    } else {
      // Rectangle (existing code)
      return (
        <Rect
          ref={shapeRef}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rotation={shape.rotation || 0}
          fill={shape.fill || "#000000"}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          draggable={canEdit}
          onClick={handleClick}
          onTap={handleClick}
          onContextMenu={handleRightClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onMouseEnter={() => { if (isLockedByOther) setShowLockLabel(true); }}
          onMouseLeave={() => setShowLockLabel(false)}
          shadowColor={isSelected ? '#667eea' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={0.5}
        />
      );
    }
  };
  
  return (
    <>
      <Group>
        {renderShape()}
        
        {/* Lock indicator label */}
        {(isLockedByOther && showLockLabel) && (
          <Text
            x={shape.x}
            y={shape.y - 25}
            text={`🔒 ${lockedByName || 'Locked'}`}
            fontSize={14}
            fill="#ef4444"
            padding={6}
          />
        )}
      </Group>
      
      {isSelected && canEdit && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          keepRatio={shape.type === 'circle'} // Lock aspect ratio for circles
        />
      )}
    </>
  );
});
```

**Important:** For circles, set `keepRatio={true}` on Transformer to maintain circular shape during resize.

---

## Feature 4: Line Tool

### User Story
As a user, I want to create lines with adjustable width (1-100px) so that I can connect shapes or draw diagrams.

### Requirements
1. Add "Line" button to toolbar
2. Click button → enter place mode
3. Click canvas once → set start point
4. Click canvas again → set end point (line appears)
5. After placing line, show **line width submenu** (1-100px slider or input)
6. Selected line can be moved (both endpoints together), resized (stretch endpoints), but not rotated
7. Line width can be changed after creation (select line → adjust width)

### Technical Implementation

#### Data Model
Line stored as:
```javascript
{
  id: "shape-xyz",
  type: "line",
  points: [x1, y1, x2, y2], // Start and end coordinates
  stroke: "#000000",         // Line color
  strokeWidth: 5,            // Line thickness (1-100px)
  fill: null,                // Lines don't have fill
  createdBy: "user123",
  lockedBy: null,
  updatedAt: timestamp,
}
```

**Note:** Lines use `stroke` instead of `fill`, and `strokeWidth` for thickness.

#### Code Changes

**1. Add Line button to `Toolbar.jsx`:**
```jsx
<button
  className={`toolbar-btn ${isPlaceMode === 'line' ? 'active' : ''}`}
  onClick={handleLineClick}
  title="Click twice to draw line"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
  <span>Line</span>
</button>

{/* Line width submenu (shown when line tool is active) */}
{isPlaceMode === 'line' && (
  <div className="tool-submenu">
    <label>Line Width: {lineWidth}px</label>
    <input 
      type="range" 
      min="1" 
      max="100" 
      value={lineWidth}
      onChange={(e) => setLineWidth(Number(e.target.value))}
      className="width-slider"
    />
  </div>
)}
```

**2. Update `Canvas.jsx` - two-click line placement:**
```javascript
const [lineStartPoint, setLineStartPoint] = useState(null);

const handleCanvasClick = (e) => {
  if (!placeMode || !user) return;
  
  const stage = stageRef.current;
  const pointerPos = stage.getPointerPosition();
  const canvasPos = screenToCanvas(
    pointerPos.x,
    pointerPos.y,
    stage.position(),
    stage.scaleX()
  );
  
  if (placeMode === 'line') {
    if (!lineStartPoint) {
      // First click - set start point
      setLineStartPoint({ x: canvasPos.x, y: canvasPos.y });
      console.log('Line start point set:', canvasPos);
      // Don't exit place mode - wait for second click
    } else {
      // Second click - set end point and create line
      const newLine = {
        id: `shape-${Date.now()}-${Math.random()}`,
        type: 'line',
        points: [
          lineStartPoint.x,
          lineStartPoint.y,
          canvasPos.x,
          canvasPos.y,
        ],
        stroke: selectedColor,
        strokeWidth: lineWidth,
      };
      
      addShape(newLine);
      setLineStartPoint(null); // Reset for next line
      exitPlaceMode();
    }
  } else {
    // Rectangle or circle placement (existing logic)
    const newShape = {
      id: `shape-${Date.now()}-${Math.random()}`,
      type: placeMode,
      x: canvasPos.x - 50,
      y: canvasPos.y - 50,
      width: 100,
      height: 100,
      rotation: 0,
      fill: selectedColor,
    };
    
    addShape(newShape);
    exitPlaceMode();
  }
};
```

**3. Update `Shape.jsx` - render lines:**
```jsx
import { Rect, Circle, Line, Transformer, Text, Group } from 'react-konva';

const renderShape = () => {
  if (shape.type === 'line') {
    return (
      <Line
        ref={shapeRef}
        id={shape.id}
        points={shape.points} // [x1, y1, x2, y2]
        stroke={shape.stroke || "#000000"}
        strokeWidth={shape.strokeWidth || 2}
        draggable={canEdit}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={handleRightClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        shadowColor={isSelected ? '#667eea' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.5}
      />
    );
  } else if (shape.type === 'circle') {
    // ... circle render code ...
  } else {
    // ... rectangle render code ...
  }
};

// Handle drag end for lines (update points, not x/y)
const handleDragEnd = (e) => {
  if (!canEdit) return;
  
  if (shape.type === 'line') {
    const node = shapeRef.current;
    const dx = node.x();
    const dy = node.y();
    
    // Update line points by adding drag delta
    const newPoints = [
      shape.points[0] + dx,
      shape.points[1] + dy,
      shape.points[2] + dx,
      shape.points[3] + dy,
    ];
    
    node.x(0);
    node.y(0);
    
    onChange({
      ...shape,
      points: newPoints,
    });
  } else {
    onChange({
      ...shape,
      x: e.target.x(),
      y: e.target.y(),
    });
  }
};
```

**4. Add line width adjustment UI:**
```jsx
// In Toolbar.jsx or ContextMenu.jsx
<div className="context-menu-item">
  <label>Line Width: {shape.strokeWidth}px</label>
  <input 
    type="range" 
    min="1" 
    max="100" 
    value={shape.strokeWidth}
    onChange={(e) => handleLineWidthChange(shape.id, Number(e.target.value))}
  />
</div>
```

---

## Feature 5: Text Tool

### User Story
As a user, I want to add text to the canvas with font options (Arial, Times New Roman, Papyrus) and styling (bold, underline) so that I can label my designs.

### Requirements
1. Add "Text" button to toolbar
2. Click button → enter place mode
3. Click canvas → show text input prompt or inline editor
4. After entering text, place text box on canvas
5. Font options: **Arial (default)**, **Times New Roman**, **Papyrus**
6. Styling options: **Bold**, **Underline**
7. Text can be selected, moved, resized (font size changes), edited (double-click)

### Technical Implementation

#### Data Model
Text stored as:
```javascript
{
  id: "shape-xyz",
  type: "text",
  x: 2500,
  y: 2500,
  text: "Hello World",            // Text content
  fontSize: 24,                    // Font size in pixels
  fontFamily: "Arial",             // "Arial" | "Times New Roman" | "Papyrus"
  fontStyle: "normal",             // "normal" | "bold"
  textDecoration: "",              // "" | "underline"
  fill: "#000000",                 // Text color
  width: 200,                      // Text box width (auto or manual)
  rotation: 0,
  createdBy: "user123",
  lockedBy: null,
  updatedAt: timestamp,
}
```

#### Code Changes

**1. Add Text button to `Toolbar.jsx`:**
```jsx
<button
  className={`toolbar-btn ${isPlaceMode === 'text' ? 'active' : ''}`}
  onClick={handleTextClick}
  title="Click to place text"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 7h16M7 7v13M17 7v13M7 20h10" stroke="currentColor" strokeWidth="2"/>
  </svg>
  <span>Text</span>
</button>

{/* Text options submenu */}
{isPlaceMode === 'text' && (
  <div className="tool-submenu">
    <label>Font</label>
    <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)}>
      <option value="Arial">Arial</option>
      <option value="Times New Roman">Times New Roman</option>
      <option value="Papyrus">Papyrus</option>
    </select>
    
    <div className="text-style-buttons">
      <button 
        className={`style-btn ${isBold ? 'active' : ''}`}
        onClick={() => setIsBold(!isBold)}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button 
        className={`style-btn ${isUnderline ? 'active' : ''}`}
        onClick={() => setIsUnderline(!isUnderline)}
        title="Underline"
      >
        <u>U</u>
      </button>
    </div>
  </div>
)}
```

**2. Update `Canvas.jsx` - text placement with prompt:**
```javascript
const [selectedFont, setSelectedFont] = useState('Arial');
const [isBold, setIsBold] = useState(false);
const [isUnderline, setIsUnderline] = useState(false);

const handleCanvasClick = (e) => {
  if (!placeMode || !user) return;
  
  const stage = stageRef.current;
  const pointerPos = stage.getPointerPosition();
  const canvasPos = screenToCanvas(
    pointerPos.x,
    pointerPos.y,
    stage.position(),
    stage.scaleX()
  );
  
  if (placeMode === 'text') {
    // Prompt user for text content
    const textContent = prompt('Enter text:');
    if (!textContent) {
      exitPlaceMode();
      return;
    }
    
    const newText = {
      id: `shape-${Date.now()}-${Math.random()}`,
      type: 'text',
      x: canvasPos.x,
      y: canvasPos.y,
      text: textContent,
      fontSize: 24,
      fontFamily: selectedFont,
      fontStyle: isBold ? 'bold' : 'normal',
      textDecoration: isUnderline ? 'underline' : '',
      fill: selectedColor,
      width: 200,
      rotation: 0,
    };
    
    addShape(newText);
    exitPlaceMode();
  } else if (placeMode === 'line') {
    // ... line placement logic ...
  } else {
    // ... rectangle/circle placement logic ...
  }
};
```

**3. Update `Shape.jsx` - render text:**
```jsx
import { Rect, Circle, Line, Text, Transformer, Group } from 'react-konva';

const renderShape = () => {
  if (shape.type === 'text') {
    return (
      <Text
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize || 24}
        fontFamily={shape.fontFamily || 'Arial'}
        fontStyle={shape.fontStyle || 'normal'}
        textDecoration={shape.textDecoration || ''}
        fill={shape.fill || "#000000"}
        width={shape.width || 200}
        rotation={shape.rotation || 0}
        draggable={canEdit}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={handleRightClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onDblClick={handleTextEdit} // Double-click to edit
        shadowColor={isSelected ? '#667eea' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.5}
      />
    );
  } else if (shape.type === 'line') {
    // ... line render code ...
  } else if (shape.type === 'circle') {
    // ... circle render code ...
  } else {
    // ... rectangle render code ...
  }
};

// Handle text editing on double-click
const handleTextEdit = () => {
  if (!canEdit || shape.type !== 'text') return;
  
  const newText = prompt('Edit text:', shape.text);
  if (newText !== null && newText !== shape.text) {
    onChange({
      ...shape,
      text: newText,
    });
  }
};

// Handle transform end for text (resize changes font size)
const handleTransformEnd = () => {
  if (!canEdit) return;
  
  const node = shapeRef.current;
  
  if (shape.type === 'text') {
    const scaleX = node.scaleX();
    node.scaleX(1);
    node.scaleY(1);
    
    onChange({
      ...shape,
      x: node.x(),
      y: node.y(),
      fontSize: Math.max(8, shape.fontSize * scaleX), // Scale font size
      width: Math.max(50, node.width() * scaleX),
      rotation: node.rotation(),
    });
  } else {
    // ... existing rectangle/circle/line transform logic ...
  }
};
```

**Alternative: Inline Text Editor**
For better UX, consider using Konva's built-in text editing or a custom HTML input overlay:
```javascript
// Show HTML input when placing text
const handleTextPlacement = (canvasPos) => {
  // Create temporary HTML input at canvas position
  // On blur/enter, create Konva Text shape
  // This provides better text editing UX than prompt()
};
```

**Libraries for Rich Text Editing:**
- `react-contenteditable` - Inline editing
- Konva built-in text editing (manual implementation)

---

## Feature 6: Multi-Select (Click & Drag Selection Box)

### User Story
As a user, I want to click and drag to select multiple shapes at once so that I can move or delete them together.

### Requirements
1. Click and drag on empty canvas → draw selection rectangle (blue outline)
2. Release mouse → all shapes within rectangle are selected
3. Selected shapes show blue outline (all of them)
4. Drag any selected shape → all selected shapes move together
5. Press Delete → all selected shapes deleted
6. Click outside → deselect all

### Technical Implementation

#### State Changes
```javascript
// In Canvas.jsx
const [selectedShapeIds, setSelectedShapeIds] = useState([]); // Array instead of single ID
const [selectionBox, setSelectionBox] = useState(null); // { x, y, width, height }
const [isDrawingSelection, setIsDrawingSelection] = useState(false);
```

#### Code Changes

**1. Update `Canvas.jsx` - selection box drawing:**
```javascript
const [selectionStart, setSelectionStart] = useState(null);

const handleMouseDown = (e) => {
  const stage = e.target.getStage();
  const clickedOnEmpty = e.target === stage || e.target === e.target.getLayer();
  
  if (clickedOnEmpty && !placeMode) {
    // Start selection box
    const pos = stage.getPointerPosition();
    setSelectionStart(pos);
    setIsDrawingSelection(true);
    setSelectedShapeIds([]); // Clear existing selection
  }
};

const handleMouseMove = (e) => {
  if (!isDrawingSelection || !selectionStart) return;
  
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  
  // Calculate selection box
  const box = {
    x: Math.min(selectionStart.x, pos.x),
    y: Math.min(selectionStart.y, pos.y),
    width: Math.abs(pos.x - selectionStart.x),
    height: Math.abs(pos.y - selectionStart.y),
  };
  
  setSelectionBox(box);
};

const handleMouseUp = (e) => {
  if (!isDrawingSelection || !selectionBox) return;
  
  // Find shapes within selection box
  const stage = stageRef.current;
  const selected = shapes.filter(shape => {
    // Convert selection box to canvas coordinates
    const boxCanvas = {
      x: (selectionBox.x - stage.x()) / stage.scaleX(),
      y: (selectionBox.y - stage.y()) / stage.scaleY(),
      width: selectionBox.width / stage.scaleX(),
      height: selectionBox.height / stage.scaleY(),
    };
    
    // Check if shape intersects with selection box
    return (
      shape.x < boxCanvas.x + boxCanvas.width &&
      shape.x + shape.width > boxCanvas.x &&
      shape.y < boxCanvas.y + boxCanvas.height &&
      shape.y + shape.height > boxCanvas.y
    );
  });
  
  setSelectedShapeIds(selected.map(s => s.id));
  setSelectionBox(null);
  setSelectionStart(null);
  setIsDrawingSelection(false);
};
```

**2. Render selection box:**
```jsx
{/* In Canvas.jsx - inside <Layer> */}
{selectionBox && (
  <Rect
    x={selectionBox.x}
    y={selectionBox.y}
    width={selectionBox.width}
    height={selectionBox.height}
    stroke="#667eea"
    strokeWidth={2}
    dash={[5, 5]}
    fill="rgba(102, 126, 234, 0.1)"
  />
)}
```

**3. Update shape selection logic:**
```javascript
// Pass isSelected to Shape component
{shapes.map((shape) => (
  <Shape
    key={shape.id}
    shape={shape}
    isSelected={selectedShapeIds.includes(shape.id)} // Multi-select support
    // ...
  />
))}
```

**4. Handle multi-shape movement:**
```javascript
const handleShapeChange = (updatedShape) => {
  if (selectedShapeIds.length > 1 && selectedShapeIds.includes(updatedShape.id)) {
    // Calculate delta from original position
    const originalShape = shapes.find(s => s.id === updatedShape.id);
    const dx = updatedShape.x - originalShape.x;
    const dy = updatedShape.y - originalShape.y;
    
    // Move all selected shapes by same delta
    selectedShapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        updateShape(id, {
          x: shape.x + dx,
          y: shape.y + dy,
        });
      }
    });
  } else {
    // Single shape update
    updateShape(updatedShape.id, updatedShape);
  }
};
```

**5. Handle multi-shape deletion:**
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Delete' && selectedShapeIds.length > 0) {
    selectedShapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape && canEditShape(shape)) {
        deleteShape(id);
      }
    });
    setSelectedShapeIds([]);
  }
};
```

---

## Feature 7: Copy/Paste Shapes

### User Story
As a user, I want to right-click a shape and copy/paste it so that I can quickly duplicate shapes.

### Requirements
1. Right-click shape → context menu shows "Copy" option
2. Click "Copy" → shape data stored in clipboard
3. Right-click canvas → context menu shows "Paste" option
4. Click "Paste" → duplicate shape placed at cursor position (slight offset from original)
5. Works with multi-select (copy all selected shapes, paste all)

### Technical Implementation

#### Clipboard State
```javascript
// In Canvas.jsx
const [clipboard, setClipboard] = useState(null); // Stores copied shape(s)
```

#### Code Changes

**1. Update `ContextMenu.jsx` - add Copy option:**
```jsx
{/* Show Copy option when right-clicking shape */}
<div className="context-menu-item" onClick={() => {
  onCopy(shape);
  onClose();
}}>
  <span className="context-menu-icon">📋</span>
  <span>Copy</span>
</div>

{/* Show Paste option when right-clicking canvas */}
{hasClipboard && (
  <div className="context-menu-item" onClick={() => {
    onPaste(cursorPosition);
    onClose();
  }}>
    <span className="context-menu-icon">📋</span>
    <span>Paste</span>
  </div>
)}
```

**2. Implement copy in `Canvas.jsx`:**
```javascript
const handleCopy = (shape) => {
  if (selectedShapeIds.length > 1) {
    // Copy multiple shapes
    const shapesToCopy = shapes.filter(s => selectedShapeIds.includes(s.id));
    setClipboard(shapesToCopy);
    console.log('Copied', shapesToCopy.length, 'shapes');
  } else {
    // Copy single shape
    setClipboard([shape]);
    console.log('Copied shape:', shape.id);
  }
};
```

**3. Implement paste in `Canvas.jsx`:**
```javascript
const handlePaste = (cursorPos) => {
  if (!clipboard || clipboard.length === 0) return;
  
  // Calculate offset from original position
  const firstShape = clipboard[0];
  const offsetX = cursorPos.x - firstShape.x;
  const offsetY = cursorPos.y - firstShape.y;
  
  clipboard.forEach(shape => {
    const newShape = {
      ...shape,
      id: `shape-${Date.now()}-${Math.random()}`, // New ID
      x: shape.x + offsetX + 20, // Slight offset so it's visible
      y: shape.y + offsetY + 20,
      lockedBy: null, // Clear lock
      createdBy: user.uid, // New owner
    };
    
    addShape(newShape);
  });
  
  console.log('Pasted', clipboard.length, 'shapes');
};
```

**4. Keyboard shortcuts (optional):**
```javascript
const handleKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'c' && selectedShapeIds.length > 0) {
      // Ctrl+C / Cmd+C - Copy
      const shapesToCopy = shapes.filter(s => selectedShapeIds.includes(s.id));
      handleCopy(shapesToCopy[0]); // Or pass all
      e.preventDefault();
    } else if (e.key === 'v' && clipboard) {
      // Ctrl+V / Cmd+V - Paste
      const stage = stageRef.current;
      const center = {
        x: (stage.width() / 2 - stage.x()) / stage.scaleX(),
        y: (stage.height() / 2 - stage.y()) / stage.scaleY(),
      };
      handlePaste(center);
      e.preventDefault();
    }
  } else if (e.key === 'Delete' && selectedShapeIds.length > 0) {
    // ... delete logic ...
  }
};
```

---

## 📝 SUGGESTED PR BREAKDOWN FOR PRS 13+

### PR #13: Color Customization
**Goal:** Add color picker to toolbar and allow changing shape colors

**Tasks:**
- Add color picker UI to toolbar (swatches or HTML input)
- Update shape creation to use selected color
- Update Shape.jsx to render `shape.fill`
- Add context menu option to change color of existing shapes
- Test multi-user color sync

**Files Modified:**
- `src/components/Toolbar.jsx`
- `src/components/Toolbar.css`
- `src/components/Canvas.jsx`
- `src/components/Shape.jsx`
- `src/components/ContextMenu.jsx`

**Estimated Effort:** 2-3 hours

---

### PR #14: Rename Rectangle to Square
**Goal:** Update UI labels for clarity

**Tasks:**
- Change "Rectangle" to "Square" in Toolbar.jsx
- Update tooltips and hints
- Update icon (make it a perfect square)
- Keep `type: "rectangle"` in data model for backward compatibility

**Files Modified:**
- `src/components/Toolbar.jsx`

**Estimated Effort:** 15 minutes

---

### PR #15: Circle Tool
**Goal:** Add circle shape creation

**Tasks:**
- Add Circle button to toolbar
- Handle circle placement in Canvas.jsx (same as rectangle)
- Update Shape.jsx to render `<Circle>` for `type: "circle"`
- Handle circle resizing (lock aspect ratio on Transformer)
- Test multi-user circle sync

**Files Modified:**
- `src/components/Toolbar.jsx`
- `src/components/Toolbar.css`
- `src/components/Canvas.jsx`
- `src/components/Shape.jsx`

**Estimated Effort:** 2-3 hours

---

### PR #16: Line Tool
**Goal:** Add line shape with adjustable width

**Tasks:**
- Add Line button to toolbar
- Add line width slider (1-100px) to toolbar
- Implement two-click line placement in Canvas.jsx
- Update Shape.jsx to render `<Line>` for `type: "line"`
- Handle line dragging (move both endpoints together)
- Add context menu option to adjust line width after creation
- Test multi-user line sync

**Files Modified:**
- `src/components/Toolbar.jsx`
- `src/components/Toolbar.css`
- `src/components/Canvas.jsx`
- `src/components/Shape.jsx`
- `src/components/ContextMenu.jsx`

**Estimated Effort:** 4-5 hours

---

### PR #17: Text Tool
**Goal:** Add text with font and styling options

**Tasks:**
- Add Text button to toolbar
- Add font selector (Arial, Times New Roman, Papyrus)
- Add styling buttons (Bold, Underline)
- Handle text placement with prompt or inline editor
- Update Shape.jsx to render `<Text>` for `type: "text"`
- Handle text editing on double-click
- Handle text resizing (scale font size)
- Test multi-user text sync

**Files Modified:**
- `src/components/Toolbar.jsx`
- `src/components/Toolbar.css`
- `src/components/Canvas.jsx`
- `src/components/Shape.jsx`

**Estimated Effort:** 4-5 hours

---

### PR #18: Multi-Select
**Goal:** Click and drag to select multiple shapes

**Tasks:**
- Change `selectedShapeId` to `selectedShapeIds` array
- Implement selection box drawing on mouse drag
- Detect shapes within selection box
- Update Shape.jsx to support multi-selection
- Handle multi-shape movement (move all together)
- Handle multi-shape deletion (delete all together)
- Update lock logic (lock all selected shapes)
- Test multi-user multi-select

**Files Modified:**
- `src/components/Canvas.jsx`
- `src/components/Canvas.css`
- `src/components/Shape.jsx`
- `src/hooks/useCanvas.js`

**Estimated Effort:** 5-6 hours

---

### PR #19: Copy/Paste
**Goal:** Right-click copy and paste shapes

**Tasks:**
- Add clipboard state to Canvas.jsx
- Add "Copy" option to context menu
- Add "Paste" option to context menu (when clipboard has data)
- Implement copy logic (store shape data)
- Implement paste logic (duplicate shapes at cursor position)
- Support multi-select copy/paste
- Add keyboard shortcuts (Ctrl+C, Ctrl+V)
- Test multi-user copy/paste

**Files Modified:**
- `src/components/Canvas.jsx`
- `src/components/ContextMenu.jsx`
- `src/components/ContextMenu.css`

**Estimated Effort:** 3-4 hours

---

## 🚀 Implementation Tips & Best Practices

### 1. Backward Compatibility
- Keep existing `type: "rectangle"` in Firestore for old shapes
- All new fields should have default values (e.g., `fill: shape.fill || "#000000"`)
- Test with existing canvas data before deploying

### 2. Performance Considerations
- Konva handles 100+ shapes well, but be mindful of complex interactions
- Throttle Firestore writes for frequently changing properties (e.g., line width slider)
- Use `React.memo()` on Shape component to prevent unnecessary re-renders

### 3. Real-Time Sync Testing
- Always test with 2+ browser windows
- Verify changes sync within 100ms
- Test with throttled network (Chrome DevTools)
- Test lock conflicts (two users try to edit same shape)

### 4. UI/UX Considerations
- Keep toolbar organized (group similar tools)
- Use clear icons (SVG from Heroicons or Feather Icons)
- Provide visual feedback (hover states, active states)
- Show tooltips for all buttons

### 5. Error Handling
- All Firestore writes should have try-catch blocks
- Show user-friendly error messages (alerts or toast notifications)
- Roll back optimistic updates on Firestore write failure

### 6. Code Organization
- Keep shape rendering logic in `Shape.jsx` (don't duplicate in Canvas.jsx)
- Extract common logic into utility functions (`canvasUtils.js`)
- Use TypeScript types for shape objects (optional but recommended)

### 7. Security
- Validate shape data on Firestore write (use Firestore rules)
- Prevent malicious data (e.g., extremely large shapes, invalid colors)
- Keep authentication checks on all write operations

---

## ❓ Questions to Clarify

1. **Color Picker UI:** Should it be in the toolbar (always visible) or context menu (right-click)?
   - **Recommendation:** Toolbar for new shapes, context menu for existing shapes

2. **Text Editing:** Should it use browser `prompt()` or inline HTML editor?
   - **Recommendation:** Inline editor for better UX (more complex)

3. **Multi-Select Behavior:** Should clicking a shape add to selection (Ctrl+click) or replace selection?
   - **Recommendation:** Click replaces, Ctrl+click adds (standard behavior)

4. **Line Rotation:** Should lines support rotation or only endpoint dragging?
   - **Recommendation:** No rotation for lines (endpoints are sufficient)

5. **Shape Defaults:** What should default colors/sizes be for new shapes?
   - **Current:** Rectangle 100x100px black
   - **Recommendation:** Keep 100x100px for square/circle, random colors

6. **Toolbar Layout:** Should tools be in one column or multiple rows?
   - **Recommendation:** Single column (current layout) is clean and scalable

---

## 📚 Additional Resources

### Konva.js Documentation
- **Official Docs:** https://konvajs.org/docs/
- **React-Konva:** https://konvajs.org/docs/react/
- **Shape Types:** https://konvajs.org/docs/shapes/Rect.html
- **Transformer:** https://konvajs.org/docs/select_and_transform/Basic_demo.html

### Firebase Documentation
- **Firestore:** https://firebase.google.com/docs/firestore
- **Real-time Updates:** https://firebase.google.com/docs/firestore/query-data/listen
- **Security Rules:** https://firebase.google.com/docs/firestore/security/get-started

### React Patterns
- **Custom Hooks:** https://react.dev/learn/reusing-logic-with-custom-hooks
- **Context API:** https://react.dev/learn/passing-data-deeply-with-context
- **Performance:** https://react.dev/learn/render-and-commit

---

## 🎉 Summary

This specification provides everything needed to implement PRs 13+ for CollabCanvas:

1. ✅ **Current System Understanding:** Architecture, data models, component structure
2. ✅ **Feature Specifications:** Detailed requirements for 7 new features
3. ✅ **Technical Implementation:** Code examples, data models, UI mockups
4. ✅ **PR Breakdown:** Suggested order and estimated effort
5. ✅ **Best Practices:** Testing, performance, security, UX considerations

**Next Steps:**
1. Review this specification
2. Start with PR #13 (Color Customization) - simplest feature
3. Progress through PRs 14-19 in order
4. Test each PR with multiple users before merging
5. Deploy to Firebase Hosting after each PR

**Total Estimated Effort:** 20-30 hours for all 7 features

Good luck with implementation! 🚀

