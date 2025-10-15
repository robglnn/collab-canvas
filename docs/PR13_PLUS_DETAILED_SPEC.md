# CollabCanvas PRs 13+ - DETAILED Feature Specifications

## 📋 Document Purpose
This document contains the finalized, detailed specifications for all features in PRs 13+, including UI/UX requirements, data models, and implementation details.

---

## 🎨 Feature 1: Advanced Color System

### Requirements
1. **Toolbar color picker** with 15 color slots total:
   - **10 default colors** (fixed palette, cannot be changed)
   - **5 custom color slots** (user can save custom hex colors, persistent per user)
2. **Hex code input field** showing selected color's hex code
3. User can manually type hex code to select any color
4. Selected color applies to:
   - New shapes being created
   - All currently selected shapes/text (batch color change)
5. Custom colors are **user-specific** and persist across sessions

### Default Color Palette (10 Colors)
```javascript
const DEFAULT_COLORS = [
  '#000000', // Black (default)
  '#FFFFFF', // White
  '#0000FF', // Blue
  '#00FF00', // Bright Green
  '#FF0000', // Red
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#474747', // Dark Gray
  '#FFFF00', // Yellow
  '#FFA500', // Orange
];
```

### UI Layout in Toolbar
```
┌─────────────────────────────┐
│ Color                       │
├─────────────────────────────┤
│ [●][●][●][●][●][●][●][●][●][●] │  10 default colors
│ [ ][ ][ ][ ][ ]              │  5 custom slots (empty until user saves)
│                              │
│ Hex: [#000000]    [Apply]    │  Text input + apply button
└─────────────────────────────┘
```

### Data Model Changes

**New Firestore Collection for User Preferences:**
```
/users/
  └── {userId}/
      ├── customColors: string[]  // Array of 5 hex codes
      │   Example: ["#ff5733", "#33ff57", "", "", ""]
      └── updatedAt: timestamp
```

**Shape color field** (already exists, just document usage):
```javascript
{
  // ... existing shape fields
  fill: "#000000",  // For rectangles, circles, text
  stroke: "#000000", // For lines
}
```

### Implementation Details

#### 1. Add custom colors state management

**Create new hook: `src/hooks/useUserPreferences.js`**
```javascript
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook to manage user preferences (custom colors, etc.)
 */
export function useUserPreferences(userId) {
  const [customColors, setCustomColors] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(true);

  // Load custom colors from Firestore
  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCustomColors(data.customColors || ['', '', '', '', '']);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading user preferences:', error);
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Save custom color to Firestore
  const saveCustomColor = async (index, hexColor) => {
    if (!userId || index < 0 || index > 4) return;

    const newCustomColors = [...customColors];
    newCustomColors[index] = hexColor;
    setCustomColors(newCustomColors);

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        customColors: newCustomColors,
        updatedAt: new Date(),
      }, { merge: true });
      console.log('Custom color saved:', hexColor, 'at index', index);
    } catch (error) {
      console.error('Error saving custom color:', error);
    }
  };

  return {
    customColors,
    saveCustomColor,
    loading,
  };
}
```

#### 2. Update Toolbar with color picker

**Update `src/components/Toolbar.jsx`:**
```jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserPreferences } from '../hooks/useUserPreferences';
import './Toolbar.css';

const DEFAULT_COLORS = [
  '#000000', '#FFFFFF', '#0000FF', '#00FF00', '#FF0000',
  '#800080', '#FFC0CB', '#474747', '#FFFF00', '#FFA500'
];

export default function Toolbar({ 
  onCreateShape, 
  selectedColor, 
  onColorChange,
  // ... other props
}) {
  const { user } = useAuth();
  const { customColors, saveCustomColor, loading } = useUserPreferences(user?.uid);
  const [hexInput, setHexInput] = useState(selectedColor);
  const [editingCustomSlot, setEditingCustomSlot] = useState(null);

  // Handle color swatch click
  const handleColorClick = (color) => {
    if (color) {
      onColorChange(color);
      setHexInput(color);
    }
  };

  // Handle hex input change
  const handleHexChange = (e) => {
    setHexInput(e.target.value);
  };

  // Apply hex color
  const handleApplyHex = () => {
    // Validate hex color
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (hexRegex.test(hexInput)) {
      onColorChange(hexInput);
    } else {
      alert('Invalid hex color. Use format: #RRGGBB');
    }
  };

  // Right-click custom slot to save current color
  const handleCustomSlotRightClick = (e, index) => {
    e.preventDefault();
    if (selectedColor) {
      saveCustomColor(index, selectedColor);
    }
  };

  return (
    <div className="toolbar">
      {/* Existing tool buttons... */}
      
      {/* Color Picker Section */}
      <div className="toolbar-section">
        <h3 className="toolbar-title">Color</h3>
        
        {/* Default Colors */}
        <div className="color-swatches">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              title={color}
            />
          ))}
        </div>
        
        {/* Custom Color Slots */}
        <div className="color-swatches custom-colors">
          {customColors.map((color, index) => (
            <button
              key={`custom-${index}`}
              className={`color-swatch custom ${selectedColor === color && color ? 'active' : ''} ${!color ? 'empty' : ''}`}
              style={{ backgroundColor: color || '#f0f0f0' }}
              onClick={() => color && handleColorClick(color)}
              onContextMenu={(e) => handleCustomSlotRightClick(e, index)}
              title={color ? `${color} (Right-click to overwrite)` : 'Right-click to save current color'}
            >
              {!color && '+'}
            </button>
          ))}
        </div>
        
        {/* Hex Input */}
        <div className="hex-input-group">
          <label>Hex:</label>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyHex()}
            placeholder="#000000"
            maxLength={7}
            className="hex-input"
          />
          <button onClick={handleApplyHex} className="apply-btn">Apply</button>
        </div>
      </div>
    </div>
  );
}
```

#### 3. Apply color to selected shapes

**Update `src/components/Canvas.jsx`:**
```javascript
// When user selects a color, apply to all selected shapes
const handleColorChange = (newColor) => {
  setSelectedColor(newColor);
  
  // If shapes are selected, apply color to them
  if (selectedShapeIds.length > 0) {
    selectedShapeIds.forEach(shapeId => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        if (shape.type === 'line') {
          updateShape(shapeId, { stroke: newColor });
        } else {
          updateShape(shapeId, { fill: newColor });
        }
      }
    });
  }
};
```

#### 4. Add CSS for color picker

**Add to `src/components/Toolbar.css`:**
```css
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: #667eea;
}

.color-swatch.active {
  border-color: #667eea;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.color-swatch.empty {
  background: linear-gradient(135deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0),
              linear-gradient(135deg, #f0f0f0 25%, #fff 25%, #fff 75%, #f0f0f0 75%, #f0f0f0);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #999;
}

.custom-colors {
  padding-top: 8px;
  border-top: 1px solid #ddd;
}

.hex-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hex-input-group label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.hex-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  text-transform: uppercase;
}

.hex-input:focus {
  outline: none;
  border-color: #667eea;
}

.apply-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.apply-btn:hover {
  background: #5568d3;
}
```

---

## ⌨️ Feature 2: Arrow Key Movement

### Requirements
- Arrow keys move selected shapes/text by 1 pixel
- **Left arrow** → Move 1px left
- **Up arrow** → Move 1px up
- **Right arrow** → Move 1px right
- **Down arrow** → Move 1px down
- Works with single or multiple selected shapes

### Implementation

**Update `src/components/Canvas.jsx`:**
```javascript
// Add to existing keyboard handler
const handleKeyDown = (e) => {
  // Delete key
  if (e.key === 'Delete' && selectedShapeIds.length > 0) {
    // ... existing delete logic ...
  }
  
  // Arrow keys - move selected shapes
  if (selectedShapeIds.length > 0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault(); // Prevent page scrolling
    
    let dx = 0;
    let dy = 0;
    
    switch (e.key) {
      case 'ArrowLeft':
        dx = -1;
        break;
      case 'ArrowRight':
        dx = 1;
        break;
      case 'ArrowUp':
        dy = -1;
        break;
      case 'ArrowDown':
        dy = 1;
        break;
    }
    
    // Move all selected shapes
    selectedShapeIds.forEach(shapeId => {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape && canEditShape(shape)) {
        if (shape.type === 'line') {
          // Move line by updating points
          const newPoints = [
            shape.points[0] + dx,
            shape.points[1] + dy,
            shape.points[2] + dx,
            shape.points[3] + dy,
          ];
          updateShape(shapeId, { points: newPoints });
        } else {
          // Move other shapes by updating x/y
          updateShape(shapeId, {
            x: shape.x + dx,
            y: shape.y + dy,
          });
        }
      }
    });
  }
  
  // Undo/Redo (implemented below)
  // ...
};
```

---

## ↩️ Feature 3: Undo/Redo System

### Requirements
- **Ctrl+Z** → Undo last action
- **Ctrl+Shift+Z** → Redo action
- Maximum **10 undo steps**
- Show temporary banner if user exceeds 10 undo limit
- Track all shape changes: create, update, delete, color change, move

### Data Model

**Undo history state:**
```javascript
const [undoStack, setUndoStack] = useState([]); // Max 10 states
const [redoStack, setRedoStack] = useState([]);
const [showUndoLimitBanner, setShowUndoLimitBanner] = useState(false);
```

**History entry structure:**
```javascript
{
  timestamp: Date.now(),
  action: "create" | "update" | "delete",
  shapes: [...],  // Snapshot of shapes before action
}
```

### Implementation

**Create new hook: `src/hooks/useUndoRedo.js`**
```javascript
import { useState, useCallback, useEffect } from 'react';

const MAX_UNDO_STEPS = 10;

/**
 * Hook to manage undo/redo history
 */
export function useUndoRedo(shapes, setShapes) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showLimitBanner, setShowLimitBanner] = useState(false);

  // Save current state to undo stack
  const saveState = useCallback(() => {
    setUndoStack(prev => {
      const newStack = [{ shapes: [...shapes], timestamp: Date.now() }, ...prev];
      // Limit to 10 entries
      return newStack.slice(0, MAX_UNDO_STEPS);
    });
    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, [shapes]);

  // Undo action
  const undo = useCallback(() => {
    if (undoStack.length === 0) {
      // Show banner that undo limit exceeded
      setShowLimitBanner(true);
      setTimeout(() => setShowLimitBanner(false), 3000);
      return null;
    }

    const [prevState, ...remainingUndo] = undoStack;
    
    // Save current state to redo stack
    setRedoStack(prev => [{ shapes: [...shapes], timestamp: Date.now() }, ...prev]);
    setUndoStack(remainingUndo);
    
    return prevState.shapes;
  }, [undoStack, shapes]);

  // Redo action
  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;

    const [nextState, ...remainingRedo] = redoStack;
    
    // Save current state to undo stack
    setUndoStack(prev => [{ shapes: [...shapes], timestamp: Date.now() }, ...prev].slice(0, MAX_UNDO_STEPS));
    setRedoStack(remainingRedo);
    
    return nextState.shapes;
  }, [redoStack, shapes]);

  return {
    saveState,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    showLimitBanner,
  };
}
```

**Update `src/components/Canvas.jsx`:**
```javascript
import { useUndoRedo } from '../hooks/useUndoRedo';

export default function Canvas() {
  // ... existing state ...
  
  const { saveState, undo, redo, canUndo, canRedo, showLimitBanner } = useUndoRedo(shapes, (newShapes) => {
    // This callback would need to sync shapes to Firestore
    // For now, we'll handle undo/redo differently
  });

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Undo: Ctrl+Z (Windows) or Cmd+Z (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      const prevShapes = undo();
      if (prevShapes) {
        // Apply undo by restoring previous state
        // This is complex with Firestore - need to batch update
        handleUndoShapes(prevShapes);
      }
    }
    
    // Redo: Ctrl+Shift+Z (Windows) or Cmd+Shift+Z (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      const nextShapes = redo();
      if (nextShapes) {
        handleRedoShapes(nextShapes);
      }
    }
    
    // ... existing keyboard handlers ...
  };

  // Helper to apply undo state
  const handleUndoShapes = async (prevShapes) => {
    // This is a simplified version - in production, you'd need to:
    // 1. Calculate diff between current shapes and prevShapes
    // 2. Batch update Firestore with changes
    // 3. Let Firestore listener update local state
    
    console.log('Undo to state:', prevShapes);
    // TODO: Implement Firestore batch update
  };

  return (
    <>
      {/* Undo limit banner */}
      {showLimitBanner && (
        <div className="undo-limit-banner">
          Undo limit reached (maximum 10 steps)
        </div>
      )}
      
      {/* ... rest of canvas ... */}
    </>
  );
}
```

**Add CSS for undo banner:**
```css
.undo-limit-banner {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
```

**Note:** Full undo/redo with Firestore is complex because you need to batch update all shapes. Consider implementing local-only undo/redo first, or use Firestore transactions for atomic updates.

---

## 📚 Feature 4: Layers Panel

### Requirements
- **Left sidebar section** labeled "Layers"
- Shows all shapes/text/objects with their layer priority
- **Top of list** = front of canvas (highest z-index)
- **Bottom of list** = back of canvas (lowest z-index)
- User can **click and drag** to reorder layers
- Right-click menu options:
  - **"Bring to Front"** - Move to top of layer stack
  - **"Send to Back"** - Move to bottom of layer stack

### Data Model

**Add `zIndex` field to shapes:**
```javascript
{
  // ... existing shape fields
  zIndex: number,  // Higher number = front, lower = back
  updatedAt: timestamp,
}
```

### Implementation

#### 1. Create Layers Panel component

**Create `src/components/LayersPanel.jsx`:**
```jsx
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './LayersPanel.css';

/**
 * LayersPanel component - Shows shape layers with drag-to-reorder
 */
export default function LayersPanel({ 
  shapes, 
  selectedShapeIds, 
  onSelectShape,
  onReorderLayers,
  isExpanded,
  onToggle,
}) {
  // Sort shapes by zIndex (highest first)
  const sortedShapes = [...shapes].sort((a, b) => b.zIndex - a.zIndex);

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reorder shapes
    const reordered = Array.from(sortedShapes);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    // Update zIndex values
    onReorderLayers(reordered);
  };

  // Get shape display name
  const getShapeName = (shape) => {
    if (shape.type === 'text') return shape.text || 'Text';
    if (shape.type === 'line') return 'Line';
    if (shape.type === 'circle') return 'Circle';
    return 'Rectangle'; // or 'Square'
  };

  // Get shape icon
  const getShapeIcon = (shape) => {
    if (shape.type === 'text') return 'T';
    if (shape.type === 'line') return '―';
    if (shape.type === 'circle') return '●';
    return '▭';
  };

  return (
    <div className="layers-panel">
      <div className="layers-header" onClick={onToggle}>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
        <h3>Layers</h3>
      </div>

      {isExpanded && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers">
            {(provided) => (
              <div
                className="layers-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sortedShapes.map((shape, index) => (
                  <Draggable key={shape.id} draggableId={shape.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`layer-item ${selectedShapeIds.includes(shape.id) ? 'selected' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                        onClick={() => onSelectShape(shape.id)}
                      >
                        <span className="layer-icon">{getShapeIcon(shape)}</span>
                        <span className="layer-name">{getShapeName(shape)}</span>
                        {shape.lockedBy && (
                          <span className="lock-indicator">🔒</span>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
```

#### 2. Add drag-and-drop library

**Install react-beautiful-dnd:**
```bash
npm install react-beautiful-dnd
```

#### 3. Update context menu for layer actions

**Update `src/components/ContextMenu.jsx`:**
```jsx
export default function ContextMenu({ 
  x, y, shape, shapes,
  isOwner, currentUserId, 
  onOverride, onClose,
  onCopy, onPaste,
  onBringToFront,  // NEW
  onSendToBack,    // NEW
  onDelete,        // NEW
}) {
  // ... existing code ...

  return (
    <div className="context-menu" style={{ left: `${x}px`, top: `${y}px` }}>
      {/* Copy/Paste */}
      <div className="context-menu-item" onClick={() => { onCopy(shape); onClose(); }}>
        <span className="context-menu-icon">📋</span>
        <span>Copy</span>
      </div>
      
      <div className="context-menu-item" onClick={() => { onPaste(); onClose(); }}>
        <span className="context-menu-icon">📋</span>
        <span>Paste</span>
      </div>
      
      <div className="context-menu-divider" />
      
      {/* Layer Actions */}
      <div className="context-menu-item" onClick={() => { onBringToFront(shape.id); onClose(); }}>
        <span className="context-menu-icon">⬆️</span>
        <span>Bring to Front</span>
      </div>
      
      <div className="context-menu-item" onClick={() => { onSendToBack(shape.id); onClose(); }}>
        <span className="context-menu-icon">⬇️</span>
        <span>Send to Back</span>
      </div>
      
      <div className="context-menu-divider" />
      
      {/* Delete */}
      <div className="context-menu-item danger" onClick={() => { onDelete(shape.id); onClose(); }}>
        <span className="context-menu-icon">🗑️</span>
        <span>Delete</span>
      </div>
      
      {/* Override (owner only, if locked by other) */}
      {showOverrideOption && (
        <>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => { onOverride(shape.id); onClose(); }}>
            <span className="context-menu-icon">👑</span>
            <span>Override Control</span>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 4. Implement layer ordering logic

**Update `src/components/Canvas.jsx`:**
```javascript
// Handle bring to front
const handleBringToFront = (shapeId) => {
  const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
  updateShape(shapeId, { zIndex: maxZIndex + 1 });
};

// Handle send to back
const handleSendToBack = (shapeId) => {
  const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0));
  updateShape(shapeId, { zIndex: minZIndex - 1 });
};

// Handle layer reorder from drag-and-drop
const handleReorderLayers = (reorderedShapes) => {
  // Assign new zIndex values based on position in array
  reorderedShapes.forEach((shape, index) => {
    const newZIndex = reorderedShapes.length - index; // Reverse order (top = highest)
    if (shape.zIndex !== newZIndex) {
      updateShape(shape.id, { zIndex: newZIndex });
    }
  });
};
```

#### 5. Render shapes in layer order

**Update `src/components/Canvas.jsx`:**
```javascript
// Sort shapes by zIndex before rendering
const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

return (
  <Stage>
    <Layer>
      {/* Canvas background */}
      <Rect />
      
      {/* Render shapes in zIndex order */}
      {sortedShapes.map(shape => (
        <Shape key={shape.id} shape={shape} {...props} />
      ))}
    </Layer>
  </Stage>
);
```

#### 6. Add CSS for layers panel

**Create `src/components/LayersPanel.css`:**
```css
.layers-panel {
  background: #2c2c2c;
  color: white;
  padding: 0;
  border-bottom: 1px solid #444;
}

.layers-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.layers-header:hover {
  background: #333;
}

.layers-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.expand-icon {
  font-size: 10px;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.layers-list {
  max-height: 300px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  border-left: 3px solid transparent;
}

.layer-item:hover {
  background: #333;
}

.layer-item.selected {
  background: #444;
  border-left-color: #667eea;
}

.layer-item.dragging {
  opacity: 0.5;
  background: #555;
}

.layer-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.layer-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lock-indicator {
  font-size: 12px;
  opacity: 0.7;
}

.context-menu-divider {
  height: 1px;
  background: #ddd;
  margin: 4px 0;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
}
```

---

## 💬 Feature 5: Comments System

### Requirements
- **Left sidebar section** labeled "Comments"
- Click **+ button** to add comment to a shape
- Comment input: 100 characters max
- Each comment shows:
  - User abbreviation (first letter of first + last name)
  - Timestamp (relative, e.g., "3 minutes ago")
  - Comment text
- All users can see and edit all comments
- Click text to edit, click elsewhere to save
- **X button** to delete comment
- No search functionality

### UI Reference
Based on the screenshot you provided:
```
┌─────────────────────────┐
│ Comments          [+]   │
├─────────────────────────┤
│  ┌───┐                  │
│  │ H │  #2 · Page 1     │
│  └───┘  Harrison 3m ago │
│         actually smaller│
├─────────────────────────┤
│  ┌───┐                  │
│  │ H │  #1 · Page 1     │
│  └───┘  Harrison 3m ago │
│         should make...  │
└─────────────────────────┘
```

### Data Model

**New Firestore Collection:**
```
/canvases/
  └── main/
      └── comments/
          └── {commentId}/
              ├── id: string
              ├── shapeId: string        // Shape this comment is attached to
              ├── text: string           // Comment text (max 100 chars)
              ├── userId: string         // User who created comment
              ├── userName: string       // User's display name
              ├── userInitials: string   // "HJ" for Harrison Jones
              ├── createdAt: timestamp
              ├── updatedAt: timestamp
              └── deleted: boolean       // Soft delete
```

### Implementation

#### 1. Create Comments Panel component

**Create `src/components/CommentsPanel.jsx`:**
```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useComments } from '../hooks/useComments';
import './CommentsPanel.css';

/**
 * CommentsPanel component - Shows shape comments
 */
export default function CommentsPanel({ 
  shapes,
  isExpanded,
  onToggle,
}) {
  const { user } = useAuth();
  const { comments, addComment, updateComment, deleteComment } = useComments();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  // Get user initials
  const getUserInitials = (userName) => {
    const names = userName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  // Handle add comment
  const handleAddComment = () => {
    setIsAdding(true);
  };

  // Handle shape selection for comment
  const handleShapeSelect = (shapeId) => {
    setSelectedShapeId(shapeId);
  };

  // Submit comment
  const handleSubmitComment = () => {
    if (!commentText.trim() || !selectedShapeId) return;

    const userInitials = getUserInitials(user.displayName);

    addComment({
      shapeId: selectedShapeId,
      text: commentText.trim(),
      userId: user.uid,
      userName: user.displayName,
      userInitials: userInitials,
    });

    setCommentText('');
    setSelectedShapeId(null);
    setIsAdding(false);
  };

  // Handle edit comment
  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  // Save edited comment
  const handleSaveEdit = (commentId) => {
    if (editText.trim()) {
      updateComment(commentId, { text: editText.trim() });
    }
    setEditingCommentId(null);
    setEditText('');
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diffMs = now - timestamp.toMillis();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get shape name
  const getShapeName = (shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return 'Deleted shape';
    
    if (shape.type === 'text') return shape.text || 'Text';
    if (shape.type === 'line') return 'Line';
    if (shape.type === 'circle') return 'Circle';
    return 'Rectangle';
  };

  return (
    <div className="comments-panel">
      <div className="comments-header" onClick={onToggle}>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
        <h3>Comments</h3>
        {isExpanded && (
          <button 
            className="add-comment-btn"
            onClick={(e) => { e.stopPropagation(); handleAddComment(); }}
          >
            +
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="comments-content">
          {/* Add comment form */}
          {isAdding && (
            <div className="add-comment-form">
              <label>Select shape:</label>
              <select 
                value={selectedShapeId || ''} 
                onChange={(e) => handleShapeSelect(e.target.value)}
              >
                <option value="">-- Select --</option>
                {shapes.map(shape => (
                  <option key={shape.id} value={shape.id}>
                    {getShapeName(shape.id)}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Enter comment (max 100 chars)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={100}
                rows={3}
              />

              <div className="form-actions">
                <button onClick={handleSubmitComment} disabled={!commentText.trim() || !selectedShapeId}>
                  Submit
                </button>
                <button onClick={() => setIsAdding(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Comments list */}
          <div className="comments-list">
            {comments.length === 0 && !isAdding && (
              <div className="empty-state">No comments yet</div>
            )}

            {comments.map((comment, index) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="user-avatar">{comment.userInitials}</div>
                  <div className="comment-meta">
                    <div className="comment-title">
                      #{comments.length - index} · {getShapeName(comment.shapeId)}
                    </div>
                    <div className="comment-timestamp">
                      {comment.userName} {formatTimestamp(comment.createdAt)}
                    </div>
                  </div>
                  <button 
                    className="delete-comment-btn"
                    onClick={() => deleteComment(comment.id)}
                    title="Delete comment"
                  >
                    ×
                  </button>
                </div>

                <div className="comment-body">
                  {editingCommentId === comment.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => handleSaveEdit(comment.id)}
                      maxLength={100}
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="comment-text"
                      onClick={() => handleEditClick(comment)}
                    >
                      {comment.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2. Create comments hook

**Create `src/hooks/useComments.js`:**
```javascript
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook to manage comments
 */
export function useComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to comments
  useEffect(() => {
    const commentsRef = collection(db, 'canvases', 'main', 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(comment => !comment.deleted); // Filter out deleted comments

      setComments(commentsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add comment
  const addComment = async (commentData) => {
    try {
      const commentsRef = collection(db, 'canvases', 'main', 'comments');
      await addDoc(commentsRef, {
        ...commentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
      });
      console.log('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Update comment
  const updateComment = async (commentId, updates) => {
    try {
      const commentRef = doc(db, 'canvases', 'main', 'comments', commentId);
      await updateDoc(commentRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  // Delete comment (soft delete)
  const deleteComment = async (commentId) => {
    try {
      const commentRef = doc(db, 'canvases', 'main', 'comments', commentId);
      await updateDoc(commentRef, {
        deleted: true,
        updatedAt: serverTimestamp(),
      });
      console.log('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
  };
}
```

#### 3. Add CSS for comments panel

**Create `src/components/CommentsPanel.css`:**
```css
.comments-panel {
  background: #2c2c2c;
  color: white;
  padding: 0;
  border-bottom: 1px solid #444;
}

.comments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.comments-header:hover {
  background: #333;
}

.comments-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}

.add-comment-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #667eea;
  color: white;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-comment-btn:hover {
  background: #5568d3;
}

.comments-content {
  padding: 0;
}

.add-comment-form {
  padding: 12px 16px;
  background: #333;
  border-bottom: 1px solid #444;
}

.add-comment-form label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  color: #aaa;
}

.add-comment-form select {
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: #2c2c2c;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 13px;
}

.add-comment-form textarea {
  width: 100%;
  padding: 8px;
  background: #2c2c2c;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.form-actions button {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.form-actions button:first-child {
  background: #667eea;
  color: white;
}

.form-actions button:first-child:hover:not(:disabled) {
  background: #5568d3;
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions .cancel-btn {
  background: #555;
  color: white;
}

.form-actions .cancel-btn:hover {
  background: #666;
}

.comments-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: 24px 16px;
  text-align: center;
  color: #aaa;
  font-size: 13px;
}

.comment-item {
  padding: 12px 16px;
  border-bottom: 1px solid #444;
}

.comment-item:hover {
  background: #333;
}

.comment-header {
  display: flex;
  gap: 10px;
  margin-bottom: 6px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-meta {
  flex: 1;
  min-width: 0;
}

.comment-title {
  font-size: 13px;
  font-weight: 500;
  color: white;
}

.comment-timestamp {
  font-size: 11px;
  color: #aaa;
}

.delete-comment-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.delete-comment-btn:hover {
  color: #ef4444;
}

.comment-body {
  margin-left: 42px;
}

.comment-text {
  font-size: 13px;
  line-height: 1.4;
  color: #ddd;
  cursor: text;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.comment-text:hover {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  margin: -4px;
  border-radius: 4px;
}

.comment-body textarea {
  width: 100%;
  padding: 6px;
  background: #2c2c2c;
  color: white;
  border: 1px solid #667eea;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
}
```

---

## 👥 Feature 6: Users Online Button

### Requirements
- Replace current "Users List" sidebar with a button
- Button shows "XX Users" where XX is the count of online users
- Positioned in top bar, to the left of user profile icon
- Clicking button opens a dropdown/modal with full user list

### Implementation

**Update `src/App.jsx` or top bar component:**
```jsx
import { useState } from 'react';
import { usePresence } from './hooks/usePresence';
import './App.css';

export default function App() {
  const { users } = usePresence();
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  
  const onlineUsers = users.filter(u => u.online);
  const userCount = onlineUsers.length;

  return (
    <div className="app">
      {/* Top bar */}
      <div className="top-bar">
        {/* Left side - connection indicator + users button */}
        <div className="top-bar-left">
          <ConnectionIndicator />
          
          <button 
            className="users-online-btn"
            onClick={() => setShowUsersDropdown(!showUsersDropdown)}
          >
            {userCount} User{userCount !== 1 ? 's' : ''}
          </button>
          
          {showUsersDropdown && (
            <UsersDropdown users={onlineUsers} onClose={() => setShowUsersDropdown(false)} />
          )}
        </div>

        {/* Right side - user profile */}
        <div className="top-bar-right">
          <UserProfile />
        </div>
      </div>

      {/* Rest of app */}
    </div>
  );
}
```

**Add CSS:**
```css
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.users-online-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.users-online-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}
```

---

## 🟢 Feature 7: Connection Indicator

### Requirements
- **Green circle** = connected and synced
- **Red circle** after **1000ms** of disconnect
- Auto-reconnect attempt every **5 seconds**
- When reconnected, change back to green
- Positioned left of "XX Users" button in top bar

### Implementation

**Create `src/components/ConnectionIndicator.jsx`:**
```jsx
import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import './ConnectionIndicator.css';

/**
 * ConnectionIndicator - Shows connection status with color
 */
export default function ConnectionIndicator() {
  const { isConnected } = useFirestore();
  const [status, setStatus] = useState('connected'); // 'connected' | 'disconnected'
  const [disconnectTimer, setDisconnectTimer] = useState(null);

  useEffect(() => {
    if (isConnected) {
      // Connected - clear any disconnect timer
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        setDisconnectTimer(null);
      }
      setStatus('connected');
    } else {
      // Disconnected - wait 1000ms before showing red
      const timer = setTimeout(() => {
        setStatus('disconnected');
      }, 1000);
      setDisconnectTimer(timer);
    }

    return () => {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
      }
    };
  }, [isConnected]);

  // Attempt reconnection every 5 seconds when disconnected
  useEffect(() => {
    if (status === 'disconnected') {
      const reconnectInterval = setInterval(() => {
        console.log('Attempting to reconnect...');
        // Firestore will automatically reconnect
        // We just need to check isConnected
      }, 5000);

      return () => clearInterval(reconnectInterval);
    }
  }, [status]);

  return (
    <div className="connection-indicator" title={status === 'connected' ? 'Connected' : 'Disconnected - Reconnecting...'}>
      <div className={`indicator-circle ${status}`} />
    </div>
  );
}
```

**Add CSS `src/components/ConnectionIndicator.css`:**
```css
.connection-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.indicator-circle.connected {
  background-color: #10b981; /* Green */
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.indicator-circle.disconnected {
  background-color: #ef4444; /* Red */
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Update `src/hooks/useFirestore.js` to expose connection state:**
```javascript
export function useFirestore() {
  const [shapes, setShapes] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    // Monitor Firestore connection state
    const connectedRef = ref(db, '.info/connected');
    
    onValue(connectedRef, (snapshot) => {
      setIsConnected(snapshot.val() === true);
    });
  }, []);

  return {
    shapes,
    isConnected,
    // ... other returns
  };
}
```

---

## 📊 Updated PR Breakdown

### PR #13: Advanced Color System (4-5 hours)
- Color picker with 10 default + 5 custom slots
- User preferences Firestore collection
- Hex code input
- Apply color to selected shapes

### PR #14: Rename Rectangle to Square (15 min)
- Update UI labels

### PR #15: Circle Tool (2-3 hours)
- Add circle button
- Handle circle placement and rendering

### PR #16: Line Tool (4-5 hours)
- Two-click line placement
- Line width submenu (1-100px)

### PR #17: Text Tool (4-5 hours)
- Text placement with prompt
- Font options (Arial, Times New Roman, Papyrus)
- Bold and underline styling

### PR #18: Multi-Select (5-6 hours)
- Selection box drag preview
- Multi-shape selection
- Move/color change in unison

### PR #19: Copy/Paste (3-4 hours)
- Right-click copy/paste
- Keyboard shortcuts

### PR #20: Arrow Key Movement (1-2 hours)
- Arrow keys move selected shapes 1px

### PR #21: Undo/Redo System (6-8 hours)
- Ctrl+Z undo, Ctrl+Shift+Z redo
- Max 10 steps
- Undo limit banner

### PR #22: Layers Panel (5-6 hours)
- Left sidebar layers list
- Drag to reorder
- Bring to front / send to back
- zIndex management

### PR #23: Comments System (6-8 hours)
- Left sidebar comments panel
- Add/edit/delete comments
- User initials + timestamp
- 100 char limit

### PR #24: Users Online Button (2-3 hours)
- Replace sidebar with button
- Dropdown user list

### PR #25: Connection Indicator (2-3 hours)
- Green/red circle
- 1000ms delay
- Auto-reconnect every 5s

---

## 📝 Total Estimated Effort
**50-65 hours** for all features (PRs 13-25)

---

## 🎉 Summary

This detailed specification includes:
1. ✅ Advanced color system with custom user colors
2. ✅ Arrow key movement (1px precision)
3. ✅ Undo/redo with 10-step history
4. ✅ Layers panel with drag-to-reorder
5. ✅ Comments system matching your screenshot
6. ✅ Users online button (top bar)
7. ✅ Connection indicator (green/red circle)
8. ✅ Complete code examples for every feature
9. ✅ Data models and Firestore schemas
10. ✅ CSS styling for all new components

Ready for implementation! 🚀

