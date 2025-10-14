import { useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import './Canvas.css';

/**
 * Main canvas component with Konva.js
 * Handles pan and zoom interactions (local only - no multiplayer yet)
 * 
 * Canvas size: 5000x5000px workspace
 * Pan: Left-click drag on empty canvas
 * Zoom: Mouse scroll wheel
 */
export default function Canvas() {
  const stageRef = useRef(null);
  
  // Viewport state (position and scale)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  // Pan state
  const [isDragging, setIsDragging] = useState(false);

  // Canvas boundaries
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;

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
  const handleDragStart = () => {
    setIsDragging(true);
  };

  /**
   * Handle drag end - clamp position to boundaries
   */
  const handleDragEnd = (e) => {
    setIsDragging(false);
    
    const stage = e.target;
    const newPos = {
      x: stage.x(),
      y: stage.y(),
    };

    const clampedPos = clampPosition(newPos, stageScale);
    setStagePos(clampedPos);
  };

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 60} // Subtract header height
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable={true}
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={isDragging ? 'dragging' : ''}
      >
        <Layer>
          {/* Canvas background - visual indicator of workspace */}
          {/* Shapes will be added in PR #4 */}
        </Layer>
      </Stage>

      {/* Debug info */}
      <div className="canvas-debug">
        <div>Zoom: {(stageScale * 100).toFixed(0)}%</div>
        <div>Position: ({Math.round(stagePos.x)}, {Math.round(stagePos.y)})</div>
        <div>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
      </div>
    </div>
  );
}

