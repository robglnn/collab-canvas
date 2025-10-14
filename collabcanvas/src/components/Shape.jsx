import { useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva';

/**
 * Shape component - Renders a single shape on the canvas
 * Supports selection, dragging, and visual feedback
 * 
 * @param {Object} shape - Shape data (id, type, x, y, width, height)
 * @param {boolean} isSelected - Whether this shape is currently selected
 * @param {Function} onSelect - Callback when shape is clicked
 * @param {Function} onChange - Callback when shape is modified (moved)
 */
export default function Shape({ shape, isSelected, onSelect, onChange }) {
  const shapeRef = useRef();
  const transformerRef = useRef();

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  /**
   * Handle drag end - update shape position
   */
  const handleDragEnd = (e) => {
    onChange({
      ...shape,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  /**
   * Handle transform end - update shape dimensions (not needed for MVP, but good to have)
   */
  const handleTransformEnd = () => {
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

  return (
    <>
      <Rect
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill="#000000" // All rectangles are black for MVP
        stroke={isSelected ? '#667eea' : '#000000'}
        strokeWidth={isSelected ? 3 : 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        shadowColor={isSelected ? '#667eea' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.5}
      />
      {isSelected && (
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

