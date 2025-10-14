import { useRef, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvas } from '../hooks/useCanvas';
import { useCursors } from '../hooks/useCursors';
import { screenToCanvas } from '../lib/canvasUtils';
import Toolbar from './Toolbar';
import Shape from './Shape';
import UserCursor from './UserCursor';
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
  
  // Viewport state (position and scale)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  // Pan state
  const [isDragging, setIsDragging] = useState(false);
  
  // Place mode state
  const [placeMode, setPlaceMode] = useState(null); // null or 'rectangle'

  // Canvas state hook
  const {
    shapes,
    selectedShapeId,
    isOwner,
    loading,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
  } = useCanvas();

  // Cursors hook
  const { cursors, updateCursorPosition } = useCursors();

  // Canvas boundaries
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;

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
  const clampPosition = (pos, scale) => {
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
  };

  /**
   * Handle mouse wheel for zoom
   */
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    // Calculate zoom factor
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 
      ? oldScale / scaleBy 
      : oldScale * scaleBy;

    // Clamp scale
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    // Calculate new position to zoom towards cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // Clamp position to boundaries
    const clampedPos = clampPosition(newPos, clampedScale);

    setStageScale(clampedScale);
    setStagePos(clampedPos);
  };

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
   * Handle mouse move - update cursor position in Firestore
   */
  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert to canvas coordinates
    const canvasPos = screenToCanvas(pointerPos, stage);

    // Update cursor position (throttled in useCursors hook)
    updateCursorPosition(canvasPos.x, canvasPos.y);
  };

  /**
   * Handle stage click - for placing shapes or deselecting
   */
  const handleStageClick = (e) => {
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
        };

        addShape(newShape);
        
        // Auto-exit place mode after placing one shape
        setPlaceMode(null);
        if (window.exitPlaceMode) {
          window.exitPlaceMode();
        }
      } else {
        // Deselect any selected shape
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
            {/* Render all shapes */}
            {shapes.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                onSelect={() => handleShapeSelect(shape.id)}
                onChange={handleShapeChange}
              />
            ))}
          </Layer>
        </Stage>

        {/* Render remote cursors - convert canvas coords to screen coords */}
        {cursors.map((cursor) => {
          const stage = stageRef.current;
          if (!stage) return null;
          
          // Convert canvas coordinates to screen coordinates
          // Account for current pan (stage position) and zoom (stage scale)
          const screenX = cursor.x * stageScale + stagePos.x;
          const screenY = cursor.y * stageScale + stagePos.y;
          
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
          <div>Position: ({Math.round(stagePos.x)}, {Math.round(stagePos.y)})</div>
          <div>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
          <div>Shapes: {shapes.length}</div>
          <div>Cursors: {cursors.length}</div>
          <div>Role: {isOwner ? 'Owner' : 'Collaborator'}</div>
          {selectedShapeId && <div>Selected: {selectedShapeId}</div>}
        </div>
      </div>
    </div>
  );
}
