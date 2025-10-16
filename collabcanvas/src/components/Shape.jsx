import { useRef, useEffect, useState, memo } from 'react';
import { Rect, Circle, Transformer, Text, Group } from 'react-konva';

/**
 * Shape component - Renders a single shape on the canvas
 * Supports selection, dragging, locking, and visual feedback
 * Memoized to prevent unnecessary re-renders
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
const Shape = memo(function Shape({ 
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
    onSelect(e);
  };

  /**
   * Handle double-click for text editing
   */
  const handleDblClick = (e) => {
    if (shape.type === 'text' && canEdit) {
      const newText = prompt('Edit text:', shape.text || '');
      if (newText !== null) {
        onChange({
          ...shape,
          text: newText || 'Double-click to edit',
        });
      }
    }
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
   * Handle transform end - update shape dimensions and rotation
   */
  const handleTransformEnd = () => {
    if (!canEdit) return;
    
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    if (shape.type === 'circle') {
      // For circles, update radius (use average of scaleX and scaleY)
      onChange({
        ...shape,
        x: node.x(),
        y: node.y(),
        radius: Math.max(5, shape.radius * ((scaleX + scaleY) / 2)),
        rotation: rotation,
      });
    } else if (shape.type === 'text') {
      // For text, only update width (height is automatic based on text content)
      onChange({
        ...shape,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * scaleX),
        rotation: 0, // Don't allow rotation for text in basic version
      });
    } else {
      // For rectangles, update width/height
      onChange({
        ...shape,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: rotation,
      });
    }
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

  // Common props for all shapes
  const commonProps = {
    ref: shapeRef,
    id: shape.id,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation || 0,
    fill: "#000000", // All shapes are black for MVP
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    draggable: canEdit,
    onClick: handleClick,
    onTap: handleClick,
    onDblClick: handleDblClick, // Double-click to edit text
    onContextMenu: handleRightClick,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onMouseEnter: () => {
      if (isLockedByOther) {
        setShowLockLabel(true);
      }
    },
    onMouseLeave: () => {
      setShowLockLabel(false);
    },
    shadowColor: isSelected ? '#667eea' : 'transparent',
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: 0.5,
  };

  return (
    <>
      <Group>
        {shape.type === 'circle' ? (
          <Circle
            {...commonProps}
            radius={shape.radius}
          />
        ) : shape.type === 'text' ? (
          <Text
            {...commonProps}
            text={shape.text || 'Double-click to edit'}
            fontSize={shape.fontSize || 24}
            fontFamily={shape.fontFamily || 'Arial'}
            width={shape.width || 200}
            align={shape.align || 'left'}
          />
        ) : (
          <Rect
            {...commonProps}
            width={shape.width}
            height={shape.height}
          />
        )}
        
        {/* Lock indicator label */}
        {(isLockedByOther && showLockLabel) && (
          <Text
            x={shape.x}
            y={shape.type === 'circle' ? shape.y - shape.radius - 25 : shape.y - 25}
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
            const minSize = shape.type === 'circle' ? 10 : shape.type === 'text' ? 20 : 5;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={
            shape.type === 'circle'
              ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] // Only corners for circles
              : shape.type === 'text'
              ? ['middle-left', 'middle-right'] // Only horizontal resize for text
              : ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']
          }
          keepRatio={shape.type === 'circle'} // Keep circular shape for circles
          rotateEnabled={shape.type !== 'text'} // Disable rotation for text
          rotationSnaps={[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345]} // 15° snapping when Shift is held
          anchorSize={8} // Larger anchors for easier grabbing
          anchorStroke="#667eea" // Match selection color
          anchorFill="#ffffff" // White fill for visibility
          anchorCornerRadius={2} // Slightly rounded anchors
          borderStroke="#667eea" // Match selection color
          borderStrokeWidth={2} // Thicker border for visibility
        />
      )}
    </>
  );
});

export default Shape;
