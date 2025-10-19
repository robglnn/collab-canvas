import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LayersPanel.css';

/**
 * Individual sortable layer item
 */
function SortableLayerItem({ shape, isSelected, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shape.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get shape icon based on type
  const getShapeIcon = (type) => {
    switch (type) {
      case 'rectangle':
        return '▭';
      case 'circle':
        return '●';
      case 'text':
        return 'T';
      case 'line':
        return '⁄';
      default:
        return '□';
    }
  };

  // Get shape name
  const getShapeName = (shape) => {
    if (shape.type === 'text' && shape.text) {
      // Show first 20 chars of text
      return shape.text.length > 20 ? shape.text.substring(0, 20) + '...' : shape.text;
    }
    return `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <span className="layer-icon">{getShapeIcon(shape.type)}</span>
      <span className="layer-name">{getShapeName(shape)}</span>
    </div>
  );
}

/**
 * LayersPanel component
 * Shows all shapes in a sortable list (top = front, bottom = back)
 * Allows drag-to-reorder and clicking to select shapes
 * 
 * @param {Array} shapes - All shapes on the canvas
 * @param {Array} selectedShapeIds - Currently selected shape IDs
 * @param {Function} onSelectShape - Callback when a shape is selected
 * @param {Function} onReorderShapes - Callback when shapes are reordered (updates zIndex)
 * @param {Boolean} isOpen - Whether the panel is open
 * @param {Function} onToggle - Callback to toggle panel open/closed
 */
export default function LayersPanel({ 
  shapes = [], 
  selectedShapeIds = [], 
  onSelectShape,
  onReorderShapes,
  isOpen,
  onToggle,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort shapes by zIndex (highest first = front of canvas = top of list)
  const sortedShapes = [...shapes].sort((a, b) => {
    const aZIndex = a.zIndex ?? 0;
    const bZIndex = b.zIndex ?? 0;
    return bZIndex - aZIndex; // Descending order (highest zIndex at top)
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find old and new indices in the sorted array
    const oldIndex = sortedShapes.findIndex(s => s.id === active.id);
    const newIndex = sortedShapes.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the sorted array
    const reorderedShapes = arrayMove(sortedShapes, oldIndex, newIndex);

    // Assign new zIndex values (top of list = highest zIndex)
    // Start from highest zIndex at index 0, decrease as we go down
    const maxZIndex = shapes.length;
    const zIndexUpdates = reorderedShapes.map((shape, index) => ({
      id: shape.id,
      zIndex: maxZIndex - index, // Highest at top, lowest at bottom
    }));

    // Call parent callback to update zIndex in Firestore
    onReorderShapes(zIndexUpdates);
  };

  const handleShapeClick = (shapeId, event) => {
    // Prevent drag from triggering click
    if (event.defaultPrevented) return;
    
    onSelectShape(shapeId, event.shiftKey);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <h3 className="layers-title">Layers</h3>
        <button className="layers-close-btn" onClick={onToggle} title="Close layers panel">
          ×
        </button>
      </div>

      <div className="layers-list">
        {sortedShapes.length === 0 ? (
          <div className="layers-empty">No shapes on canvas</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedShapes.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedShapes.map((shape) => (
                <SortableLayerItem
                  key={shape.id}
                  shape={shape}
                  isSelected={selectedShapeIds.includes(shape.id)}
                  onClick={(e) => handleShapeClick(shape.id, e)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="layers-hint">
        Drag to reorder • Top = Front
      </div>
    </div>
  );
}

