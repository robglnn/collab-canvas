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
  
  // Cursor position on canvas (for debug display)
  const [cursorCanvasPos, setCursorCanvasPos] = useState({ x: 0, y: 0 });

  // Auth hook
  const { user } = useAuth();

  // Canvas state hook
  const {
    shapes,
    selectedShapeId,
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
   * Handle keyboard events (Delete key)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedShapeId) {
        deleteShape(selectedShapeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, deleteShape]);

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
   * Handle mouse wheel for zoom
   * Smooth zoom centered on cursor position
   */
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

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
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 
      ? oldScale * scaleBy 
      : oldScale / scaleBy;

    // Clamp scale to min/max bounds
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    // If scale didn't change (hit limits), don't update
    if (clampedScale === oldScale) return;

    // Calculate the point on the canvas that the pointer is over
    // Using ACTUAL stage position from stage.x()/stage.y()
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
  }, [stageScale, clampPosition]);

  /**
   * Handle drag start
   */
  const handleDragStart = (e) => {
    // Only allow stage dragging, not shape dragging
    if (e.target === stageRef.current) {
      setIsDragging(true);
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
   * Handle mouse move - update cursor position in Firestore and debug display
   */
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position relative to stage container (screen coordinates)
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

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
        // Deselect any selected shape and unlock it
        if (selectedShapeId) {
          const selectedShape = shapes.find(s => s.id === selectedShapeId);
          if (selectedShape && selectedShape.lockedBy === user?.uid) {
            unlockShape(selectedShapeId);
          }
        }
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
   * Handle shape selection
   */
  const handleShapeSelect = (shapeId) => {
    selectShape(shapeId);
  };

  /**
   * Handle shape change (move, resize)
   */
  const handleShapeChange = (updatedShape) => {
    updateShape(updatedShape.id, updatedShape);
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
          draggable={true}
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseMove={handleMouseMove}
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
                isSelected={shape.id === selectedShapeId}
                canEdit={canEditShape(shape)}
                lockedByName={shape.lockedBy ? getUserName(shape.lockedBy) : null}
                isOwner={isOwner}
                currentUserId={user?.uid}
                onSelect={() => handleShapeSelect(shape.id)}
                onChange={handleShapeChange}
                onLock={lockShape}
                onUnlock={unlockShape}
                onRightClick={handleShapeRightClick}
              />
            ))}
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
          {selectedShapeId && <div>Selected: {selectedShapeId}</div>}
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
