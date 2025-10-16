import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvas } from '../hooks/useCanvas';
import { useCursors } from '../hooks/useCursors';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../hooks/useAuth';
import { screenToCanvas } from '../lib/canvasUtils';
import Toolbar from './Toolbar';
import Shape from './Shape';
import UserCursor from './UserCursor';
import ContextMenu from './ContextMenu';
import DisconnectBanner from './DisconnectBanner';
import './Canvas.css';

/**
 * Main canvas component with Konva.js
 * Handles pan, zoom, shape creation, selection, and deletion (local only)
 * 
 * Canvas size: 5000x5000px workspace
 * Pan: Left-click drag on empty canvas
 * Zoom: Mouse scroll wheel
 * Create: Click toolbar button, then click canvas to place
 * Select: Click on shape
 * Delete: Select shape, press Delete key
 */
export default function Canvas() {
  const stageRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Viewport state (position and scale)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  // Pan state
  const [isDragging, setIsDragging] = useState(false);
  
  // Place mode state
  const [placeMode, setPlaceMode] = useState(null); // null or 'rectangle'
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  
  // Selection box state (for drag-to-select)
  const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, endX, endY }
  const [isSelecting, setIsSelecting] = useState(false);
  const justCompletedSelectionRef = useRef(false); // Prevent click event from deselecting after selection
  
  // Cursor position on canvas (for debug display)
  const [cursorCanvasPos, setCursorCanvasPos] = useState({ x: 0, y: 0 });

  // Auth hook
  const { user } = useAuth();

  // Canvas state hook
  const {
    shapes,
    selectedShapeIds,
    isOwner,
    ownerId,
    loading,
    isConnected,
    showDisconnectBanner,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
    lockShape,
    unlockShape,
    forceOverrideLock,
    canEditShape,
  } = useCanvas();

  // Presence hook - to get user names for lock labels
  const { users } = usePresence(ownerId);
  
  // Get online user IDs from presence data
  const onlineUserIds = users.filter(u => u.online).map(u => u.userId);
  
  // Cursors hook - pass online user IDs to filter cursors
  const { cursors, updateCursorPosition, removeCursor } = useCursors(onlineUserIds);

  // Canvas boundaries and zoom limits
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  
  // Spawn configuration: Where users appear when they first load
  // 
  // To change spawn behavior for different canvas sizes:
  // - For center spawn: CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2
  // - For top-left: 0, 0
  // - For custom position: any coordinates within canvas bounds
  // - Zoom: 1.0 = 100%, 0.5 = 50%, 2.0 = 200%
  //
  // Example for 10000x8000 canvas with top-left spawn:
  //   const CANVAS_WIDTH = 10000;
  //   const CANVAS_HEIGHT = 8000;
  //   const SPAWN_CANVAS_X = 0;
  //   const SPAWN_CANVAS_Y = 0;
  //   const SPAWN_ZOOM = 0.5; // Zoomed out to see more
  //
  const SPAWN_CANVAS_X = CANVAS_WIDTH / 2;  // 2500 for 5000px canvas (center X)
  const SPAWN_CANVAS_Y = CANVAS_HEIGHT / 2; // 2500 for 5000px canvas (center Y)
  const SPAWN_ZOOM = 1.0; // 100% zoom

  /**
   * Calculate stage position to show a specific canvas point at viewport center
   * 
   * @param {number} canvasX - Canvas X coordinate to center on (0-CANVAS_WIDTH)
   * @param {number} canvasY - Canvas Y coordinate to center on (0-CANVAS_HEIGHT)
   * @param {number} zoom - Zoom level (1.0 = 100%)
   * @param {number} viewportWidth - Viewport width in pixels
   * @param {number} viewportHeight - Viewport height in pixels
   * @returns {{x: number, y: number}} Stage position
   */
  const calculateStagePosition = useCallback((canvasX, canvasY, zoom, viewportWidth, viewportHeight) => {
    // To show canvas point (canvasX, canvasY) at viewport center:
    // viewportCenter = stagePos + (canvasPoint * zoom)
    // Therefore: stagePos = viewportCenter - (canvasPoint * zoom)
    return {
      x: viewportWidth / 2 - canvasX * zoom,
      y: viewportHeight / 2 - canvasY * zoom,
    };
  }, []);

  /**
   * Initialize canvas position - spawn user at center of canvas
   * Flexible for any canvas size and spawn point
   */
  useEffect(() => {
    if (!stageRef.current || isInitialized) return;

    const stage = stageRef.current;
    const container = stage.container();
    const viewportWidth = container.offsetWidth;
    const viewportHeight = container.offsetHeight;

    // Calculate stage position to show spawn point at viewport center
    const initialPos = calculateStagePosition(
      SPAWN_CANVAS_X,
      SPAWN_CANVAS_Y,
      SPAWN_ZOOM,
      viewportWidth,
      viewportHeight
    );

    setStagePos(initialPos);
    setStageScale(SPAWN_ZOOM);
    setIsInitialized(true);
    
    console.log(`Canvas initialized: User spawned at canvas (${SPAWN_CANVAS_X}, ${SPAWN_CANVAS_Y}) with ${SPAWN_ZOOM * 100}% zoom`);
    console.log(`Stage position: (${Math.round(initialPos.x)}, ${Math.round(initialPos.y)})`);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, SPAWN_CANVAS_X, SPAWN_CANVAS_Y, SPAWN_ZOOM, isInitialized, calculateStagePosition]);

  /**
   * Handle keyboard events (Delete key for multi-delete)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedShapeIds.length > 0) {
        deleteShape(selectedShapeIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeIds, deleteShape]);

  /**
   * Global mouse up handler to complete selection box even if mouse released outside Stage
   */
  useEffect(() => {
    if (!isSelecting) return;

    const handleGlobalMouseUp = () => {
      setIsSelecting(false);

      if (!selectionBox) {
        return;
      }

      // Calculate selection box bounds
      const box = {
        x: Math.min(selectionBox.startX, selectionBox.endX),
        y: Math.min(selectionBox.startY, selectionBox.endY),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY)
      };

      // Find shapes that intersect with selection box
      const selectedIds = shapes.filter(shape => {
        return (
          shape.x < box.x + box.width &&
          shape.x + shape.width > box.x &&
          shape.y < box.y + box.height &&
          shape.y + shape.height > box.y
        );
      }).map(shape => shape.id);

      if (selectedIds.length > 0) {
        selectShape(selectedIds);
        
        // Set flag to prevent the subsequent click event from deselecting
        // Only set if we actually selected something
        justCompletedSelectionRef.current = true;
        setTimeout(() => {
          justCompletedSelectionRef.current = false;
        }, 50); // Reset after 50ms (enough time for click event to fire)
      }

      setSelectionBox(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, selectionBox, shapes, selectShape]);

  /**
   * Clamp viewport position to stay within canvas boundaries
   */
  const clampPosition = useCallback((pos, scale) => {
    const stage = stageRef.current;
    if (!stage) return pos;

    const container = stage.container();
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate the visible canvas bounds
    const maxX = 0;
    const minX = -(CANVAS_WIDTH * scale - containerWidth);
    const maxY = 0;
    const minY = -(CANVAS_HEIGHT * scale - containerHeight);

    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  /**
   * Handle mouse wheel - Ctrl+scroll = zoom, plain scroll = pan vertical, Shift+scroll = pan horizontal
   */
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const evt = e.evt;

    // Ctrl + Scroll = Zoom (centered on cursor)
    if (evt.ctrlKey) {
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      
      // Get actual stage position (not state, which may lag)
      const oldPos = {
        x: stage.x(),
        y: stage.y(),
      };

      // Smoother zoom factor (smaller increments = smoother)
      const scaleBy = 1.05;
      
      // Calculate zoom direction and new scale
      const direction = evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 
        ? oldScale * scaleBy 
        : oldScale / scaleBy;

      // Clamp scale to min/max bounds
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      
      // If scale didn't change (hit limits), don't update
      if (clampedScale === oldScale) return;

      // Calculate the point on the canvas that the pointer is over
      const mousePointTo = {
        x: (pointer.x - oldPos.x) / oldScale,
        y: (pointer.y - oldPos.y) / oldScale,
      };

      // Calculate new position to keep the mouse point stationary
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      // Apply position clamping to boundaries
      const clampedPos = clampPosition(newPos, clampedScale);

      // Update both scale and position
      setStageScale(clampedScale);
      setStagePos(clampedPos);
    }
    // Shift + Scroll = Pan left/right
    else if (evt.shiftKey) {
      const panSpeed = 1;
      const deltaX = evt.deltaY * panSpeed; // Use deltaY for horizontal panning
      
      const newPos = {
        x: stagePos.x - deltaX,
        y: stagePos.y
      };

      const clampedPos = clampPosition(newPos, stageScale);
      setStagePos(clampedPos);
    }
    // Plain Scroll = Pan up/down
    else {
      const panSpeed = 1;
      const deltaY = evt.deltaY * panSpeed;
      
      const newPos = {
        x: stagePos.x,
        y: stagePos.y - deltaY
      };

      const clampedPos = clampPosition(newPos, stageScale);
      setStagePos(clampedPos);
    }
  }, [stageScale, stagePos, clampPosition]);

  /**
   * Handle mouse down - start selection box or middle-click pan
   */
  const handleMouseDown = (e) => {
    // Middle mouse button (button 1) = allow Stage to pan
    if (e.evt.button === 1) {
      // Enable dragging for middle mouse button
      return; // Stage draggable will handle it
    }

    // If clicked on a shape (not Stage or Layer), don't start selection box
    const clickedOnEmpty = e.target === stageRef.current || e.target.getClassName() === 'Layer';
    if (!clickedOnEmpty) {
      return;
    }

    // If in place mode, don't start selection box
    if (placeMode) {
      return;
    }

    // Left mouse button (button 0) - Start selection box
    if (e.evt.button === 0) {
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      const canvasPos = screenToCanvas(pointerPos, stage);

      setSelectionBox({
        startX: canvasPos.x,
        startY: canvasPos.y,
        endX: canvasPos.x,
        endY: canvasPos.y
      });
      setIsSelecting(true);
    }
  };

  /**
   * Handle mouse move - update selection box
   */
  const handleMouseMoveForSelection = (e) => {
    if (!isSelecting) return;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    const canvasPos = screenToCanvas(pointerPos, stage);

    setSelectionBox(prev => ({
      ...prev,
      endX: canvasPos.x,
      endY: canvasPos.y
    }));
  };

  /**
   * Handle mouse up - complete selection box (called from Stage onMouseUp)
   */
  const handleMouseUp = () => {
    if (!isSelecting) return;

    setIsSelecting(false);

    if (!selectionBox) return;

    // Calculate selection box bounds
    const box = {
      x: Math.min(selectionBox.startX, selectionBox.endX),
      y: Math.min(selectionBox.startY, selectionBox.endY),
      width: Math.abs(selectionBox.endX - selectionBox.startX),
      height: Math.abs(selectionBox.endY - selectionBox.startY)
    };

    // Find shapes that intersect with selection box
    const selectedIds = shapes.filter(shape => {
      return (
        shape.x < box.x + box.width &&
        shape.x + shape.width > box.x &&
        shape.y < box.y + box.height &&
        shape.y + shape.height > box.y
      );
    }).map(shape => shape.id);

    if (selectedIds.length > 0) {
      selectShape(selectedIds);
      
      // Set flag to prevent the subsequent click event from deselecting
      // Only set if we actually selected something
      justCompletedSelectionRef.current = true;
      setTimeout(() => {
        justCompletedSelectionRef.current = false;
      }, 50); // Reset after 50ms (enough time for click event to fire)
    }

    setSelectionBox(null);
  };

  /**
   * Handle drag start - allow middle mouse button pan
   */
  const handleDragStart = (e) => {
    // Only allow stage dragging, not shape dragging
    if (e.target === stageRef.current) {
      // Check if middle mouse button was used (Konva doesn't expose button directly in drag)
      // Allow dragging if not in selection mode
      if (!isSelecting) {
        setIsDragging(true);
      }
    }
  };

  /**
   * Handle drag end - clamp position to boundaries
   */
  const handleDragEnd = (e) => {
    setIsDragging(false);
    
    // Only handle stage drag end
    if (e.target === stageRef.current) {
      const stage = e.target;
      const newPos = {
        x: stage.x(),
        y: stage.y(),
      };

      const clampedPos = clampPosition(newPos, stageScale);
      setStagePos(clampedPos);
    }
  };

  /**
   * Handle mouse move - update cursor position, selection box, and debug display
   */
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position relative to stage container (screen coordinates)
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Update selection box if selecting
    if (isSelecting) {
      handleMouseMoveForSelection(e);
    }

    // Use LIVE stage values for accurate canvas conversion during interactions
    const currentPos = stage.position();
    const currentScale = stage.scaleX();

    // Convert screen coordinates to canvas coordinates
    // This accounts for stage pan and zoom to get absolute canvas position
    const canvasX = (pointerPos.x - currentPos.x) / currentScale;
    const canvasY = (pointerPos.y - currentPos.y) / currentScale;

    // Update cursor position for debug display
    setCursorCanvasPos({ x: Math.round(canvasX), y: Math.round(canvasY) });

    // Update cursor position (throttled in useCursors hook)
    updateCursorPosition(canvasX, canvasY);
  };

  /**
   * Handle stage click - for placing shapes or deselecting
   */
  const handleStageClick = (e) => {
    // Close context menu if open
    if (contextMenu) {
      setContextMenu(null);
    }

    // If clicked on empty canvas (not a shape)
    const clickedOnEmpty = e.target === stageRef.current;

    if (clickedOnEmpty) {
      if (placeMode === 'rectangle') {
        // Place a rectangle at click position
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        const canvasPos = screenToCanvas(pointerPos, stage);

        const newShape = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'rectangle',
          x: canvasPos.x,
          y: canvasPos.y,
          width: 100,
          height: 100,
          rotation: 0, // Initialize rotation at 0 degrees
        };

        addShape(newShape);
        
        // Auto-exit place mode after placing one shape
        setPlaceMode(null);
        if (window.exitPlaceMode) {
          window.exitPlaceMode();
        }
      } else {
        // Don't deselect if we just completed a selection box
        if (justCompletedSelectionRef.current) {
          return;
        }
        
        // Deselect all selected shapes and unlock them
        selectedShapeIds.forEach(shapeId => {
          const selectedShape = shapes.find(s => s.id === shapeId);
          if (selectedShape && selectedShape.lockedBy === user?.uid) {
            unlockShape(shapeId);
          }
        });
        deselectShape();
      }
    }
  };

  /**
   * Handle toolbar create shape request
   */
  const handleCreateShape = (shapeType) => {
    setPlaceMode(shapeType);
  };

  /**
   * Handle shape selection (supports Shift-click for multi-select)
   */
  const handleShapeSelect = (shapeId, event) => {
    const addToSelection = event?.evt?.shiftKey || false;
    selectShape(shapeId, addToSelection);
  };

  /**
   * Handle shape change (move, resize) - supports multi-shape movement
   */
  const handleShapeChange = (updatedShape) => {
    // If this is a selected shape and multiple shapes are selected, move all together
    if (selectedShapeIds.includes(updatedShape.id) && selectedShapeIds.length > 1) {
      // Find the original shape to calculate delta
      const originalShape = shapes.find(s => s.id === updatedShape.id);
      if (originalShape) {
        const deltaX = updatedShape.x - originalShape.x;
        const deltaY = updatedShape.y - originalShape.y;

        // Update all selected shapes with the same delta
        selectedShapeIds.forEach(shapeId => {
          const shape = shapes.find(s => s.id === shapeId);
          if (shape) {
            updateShape(shapeId, {
              ...shape,
              x: shape.x + deltaX,
              y: shape.y + deltaY,
            });
          }
        });
      }
    } else {
      // Single shape update
      updateShape(updatedShape.id, updatedShape);
    }
  };

  /**
   * Handle shape right-click
   */
  const handleShapeRightClick = (shape, position) => {
    setContextMenu({
      shape,
      x: position.x,
      y: position.y,
    });
  };

  /**
   * Handle override control from context menu
   */
  const handleOverrideControl = (shapeId) => {
    forceOverrideLock(shapeId);
  };

  /**
   * Get user name by user ID
   */
  const getUserName = (userId) => {
    const userPresence = users.find(u => u.userId === userId);
    return userPresence?.userName || 'Unknown User';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="canvas-container">
        <Toolbar onCreateShape={handleCreateShape} />
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      <Toolbar onCreateShape={handleCreateShape} />
      <DisconnectBanner show={showDisconnectBanner} />
      
      <div className={`canvas-workspace ${placeMode ? 'place-mode' : ''}`}>
        <Stage
          ref={stageRef}
          width={window.innerWidth - 200} // Subtract toolbar width
          height={window.innerHeight - 60} // Subtract header height
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={!isSelecting} // Disable drag when selecting
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleStageClick}
          onTap={handleStageClick}
          className={isDragging ? 'dragging' : ''}
        >
          <Layer>
            {/* White canvas background - 5000x5000 workspace */}
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="#FFFFFF"
              listening={false}
            />
            
            {/* Render all shapes */}
            {shapes.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeIds.includes(shape.id)}
                canEdit={canEditShape(shape)}
                lockedByName={shape.lockedBy ? getUserName(shape.lockedBy) : null}
                isOwner={isOwner}
                currentUserId={user?.uid}
                onSelect={(event) => handleShapeSelect(shape.id, event)}
                onChange={handleShapeChange}
                onLock={lockShape}
                onUnlock={unlockShape}
                onRightClick={handleShapeRightClick}
              />
            ))}

            {/* Selection box - blue dashed rectangle */}
            {selectionBox && (
              <Rect
                x={Math.min(selectionBox.startX, selectionBox.endX)}
                y={Math.min(selectionBox.startY, selectionBox.endY)}
                width={Math.abs(selectionBox.endX - selectionBox.startX)}
                height={Math.abs(selectionBox.endY - selectionBox.startY)}
                fill="rgba(0, 102, 255, 0.1)"
                stroke="#0066FF"
                strokeWidth={2 / stageScale} // Keep consistent width at all zoom levels
                dash={[10 / stageScale, 5 / stageScale]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>

        {/* Render remote cursors - convert canvas coords to screen coords */}
        {cursors.map((cursor) => {
          const stage = stageRef.current;
          if (!stage) return null;
          
          // Use LIVE stage values for accurate screen conversion
          const currentPos = stage.position();
          const currentScale = stage.scaleX();
          
          // Convert canvas coordinates to screen coordinates
          // Account for current pan (stage position) and zoom (stage scale)
          const screenX = cursor.x * currentScale + currentPos.x;
          const screenY = cursor.y * currentScale + currentPos.y;
          
          return (
            <UserCursor
              key={cursor.userId}
              cursor={{
                ...cursor,
                x: screenX,
                y: screenY,
              }}
            />
          );
        })}

        {/* Debug info */}
        <div className="canvas-debug">
          <div>Zoom: {(stageScale * 100).toFixed(0)}%</div>
          <div>Canvas Center: ({
            Math.round((window.innerWidth / 2 - stagePos.x) / stageScale)
          }, {
            Math.round((window.innerHeight / 2 - stagePos.y) / stageScale)
          })</div>
          <div>Cursor: ({cursorCanvasPos.x}, {cursorCanvasPos.y})</div>
          <div>Stage Offset: ({Math.round(stagePos.x)}, {Math.round(stagePos.y)})</div>
          <div>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
          <div>Shapes: {shapes.length} | Cursors: {cursors.length}</div>
          <div>Role: {isOwner ? 'Owner' : 'Collaborator'}</div>
          {selectedShapeIds.length > 0 && <div>Selected: {selectedShapeIds.length} shape(s)</div>}
        </div>

        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            shape={contextMenu.shape}
            isOwner={isOwner}
            currentUserId={user?.uid}
            onOverride={handleOverrideControl}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
