import { useRef, useEffect, useState } from 'react';
import { Rect, Transformer, Text, Group } from 'react-konva';

/**
 * Shape component - Renders a single shape on the canvas
 * Supports selection, dragging, locking, and visual feedback
 * 
 * @param {Object} shape - Shape data (id, type, x, y, width, height, lockedBy, createdBy)
 * @param {boolean} isSelected - Whether this shape is currently selected
 * @param {boolean} canEdit - Whether current user can edit this shape
 * @param {string} lockedByName - Name of user who locked this shape (if any)
 * @param {boolean} isOwner - Whether current user is canvas owner
 * @param {string} currentUserId - Current user's ID
 * @param {Function} onSelect - Callback when shape is clicked
 * @param {Function} onChange - Callback when shape is modified (moved)
 * @param {Function} onLock - Callback to lock shape
 * @param {Function} onUnlock - Callback to unlock shape
 * @param {Function} onRightClick - Callback for right-click (passes shape and position)
 */
export default function Shape({ 
  shape, 
  isSelected, 
  canEdit, 
  lockedByName,
  isOwner,
  currentUserId,
  onSelect, 
  onChange,
  onLock,
  onUnlock,
  onRightClick,
}) {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const [showLockLabel, setShowLockLabel] = useState(false);

  // Determine if shape is locked by another user
  const isLockedByOther = shape.lockedBy && shape.lockedBy !== currentUserId;

  // Attach transformer to shape when selected (only if can edit)
  useEffect(() => {
    if (isSelected && canEdit && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, canEdit]);

  // Lock shape when selected
  useEffect(() => {
    if (isSelected && canEdit && !shape.lockedBy) {
      onLock(shape.id);
    }
  }, [isSelected, canEdit, shape.id, shape.lockedBy, onLock]);

  // Force update draggable state when canEdit changes
  useEffect(() => {
    if (shapeRef.current) {
      shapeRef.current.draggable(canEdit);
    }
  }, [canEdit]);

  /**
   * Handle shape click
   */
  const handleClick = (e) => {
    // Don't select if locked by another user (unless owner)
    if (isLockedByOther && !isOwner) {
      console.log('Shape is locked by another user');
      return;
    }
    onSelect();
  };

  /**
   * Handle right-click
   */
  const handleRightClick = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    onRightClick(shape, pointerPos);
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (e) => {
    // Prevent drag if can't edit - stop immediately
    if (!canEdit) {
      e.target.stopDrag();
      e.evt.preventDefault();
      console.log('Drag prevented: shape is locked by another user');
      return;
    }
    
    // Lock shape on drag start
    if (!shape.lockedBy) {
      onLock(shape.id);
    }
  };

  /**
   * Handle drag end - update shape position
   */
  const handleDragEnd = (e) => {
    if (!canEdit) return;
    
    onChange({
      ...shape,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  /**
   * Handle transform end - update shape dimensions
   */
  const handleTransformEnd = () => {
    if (!canEdit) return;
    
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height instead
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      ...shape,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };

  // Determine stroke color based on lock state
  let strokeColor = '#000000';
  let strokeWidth = 1;
  
  if (isSelected) {
    strokeColor = '#667eea'; // Selected: blue
    strokeWidth = 3;
  } else if (isLockedByOther) {
    strokeColor = '#ef4444'; // Locked by other: red
    strokeWidth = 2;
  } else if (shape.lockedBy === currentUserId) {
    strokeColor = '#10b981'; // Locked by me: green
    strokeWidth = 2;
  }

  return (
    <>
      <Group>
        <Rect
          ref={shapeRef}
          id={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="#000000" // All rectangles are black for MVP
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          draggable={canEdit}
          onClick={handleClick}
          onTap={handleClick}
          onContextMenu={handleRightClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onMouseEnter={() => {
            if (isLockedByOther) {
              setShowLockLabel(true);
            }
          }}
          onMouseLeave={() => {
            setShowLockLabel(false);
          }}
          shadowColor={isSelected ? '#667eea' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          shadowOpacity={0.5}
        />
        
        {/* Lock indicator label */}
        {(isLockedByOther && showLockLabel) && (
          <Text
            x={shape.x}
            y={shape.y - 25}
            text={`🔒 ${lockedByName || 'Locked'}`}
            fontSize={14}
            fill="#ef4444"
            padding={6}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
        )}
      </Group>
      
      {isSelected && canEdit && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          rotateEnabled={false} // Disable rotation for MVP
        />
      )}
    </>
  );
}

