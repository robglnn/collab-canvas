import { useState, useCallback } from 'react';

/**
 * Custom hook to manage canvas state (shapes, selection, etc.)
 * Local state only - no Firestore integration yet (that comes in PR #5)
 * 
 * @returns {Object} Canvas state and methods
 */
export function useCanvas() {
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);

  /**
   * Add a new shape to the canvas
   * 
   * @param {Object} shape - Shape object with id, type, x, y, width, height
   */
  const addShape = useCallback((shape) => {
    setShapes((prev) => [...prev, shape]);
    console.log('Shape added:', shape);
  }, []);

  /**
   * Update an existing shape
   * 
   * @param {string} shapeId - ID of shape to update
   * @param {Object} updates - Properties to update
   */
  const updateShape = useCallback((shapeId, updates) => {
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === shapeId ? { ...shape, ...updates } : shape
      )
    );
    console.log('Shape updated:', shapeId, updates);
  }, []);

  /**
   * Delete a shape from the canvas
   * 
   * @param {string} shapeId - ID of shape to delete
   */
  const deleteShape = useCallback((shapeId) => {
    setShapes((prev) => prev.filter((shape) => shape.id !== shapeId));
    
    // Clear selection if deleted shape was selected
    if (selectedShapeId === shapeId) {
      setSelectedShapeId(null);
    }
    
    console.log('Shape deleted:', shapeId);
  }, [selectedShapeId]);

  /**
   * Select a shape
   * 
   * @param {string|null} shapeId - ID of shape to select, or null to deselect
   */
  const selectShape = useCallback((shapeId) => {
    setSelectedShapeId(shapeId);
    console.log('Shape selected:', shapeId);
  }, []);

  /**
   * Deselect current shape
   */
  const deselectShape = useCallback(() => {
    setSelectedShapeId(null);
    console.log('Shape deselected');
  }, []);

  /**
   * Get a specific shape by ID
   * 
   * @param {string} shapeId - ID of shape to get
   * @returns {Object|undefined} Shape object or undefined if not found
   */
  const getShape = useCallback((shapeId) => {
    return shapes.find((shape) => shape.id === shapeId);
  }, [shapes]);

  return {
    shapes,
    selectedShapeId,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
    getShape,
  };
}

