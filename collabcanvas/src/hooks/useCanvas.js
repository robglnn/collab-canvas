import { useState, useCallback, useEffect } from 'react';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';
import {
  addShape as addShapeToFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeFromFirestore,
  setCanvasOwner,
  getCanvasOwner,
} from '../lib/firestoreService';

/**
 * Custom hook to manage canvas state with Firestore integration
 * Handles optimistic updates with rollback on errors
 * 
 * @returns {Object} Canvas state and methods
 */
export function useCanvas() {
  const { user } = useAuth();
  const { shapes: firestoreShapes, canvasMetadata, loading } = useFirestore();
  
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Use Firestore shapes as source of truth
  const shapes = firestoreShapes;

  // Set up canvas owner logic
  useEffect(() => {
    if (!user) return;

    const initializeOwner = async () => {
      try {
        const currentOwner = await getCanvasOwner();
        
        if (!currentOwner) {
          // No owner yet - this user becomes owner
          await setCanvasOwner(user.uid);
          setIsOwner(true);
          console.log('User is now canvas owner');
        } else if (currentOwner === user.uid) {
          // User is the owner
          setIsOwner(true);
          console.log('User is canvas owner');
        } else {
          // User is a collaborator
          setIsOwner(false);
          console.log('User is collaborator');
        }
      } catch (error) {
        console.error('Error initializing owner:', error);
      }
    };

    initializeOwner();
  }, [user]);

  // Update isOwner when metadata changes
  useEffect(() => {
    if (user && canvasMetadata) {
      setIsOwner(canvasMetadata.ownerId === user.uid);
    }
  }, [user, canvasMetadata]);

  /**
   * Add a new shape with optimistic update
   * 
   * @param {Object} shape - Shape object with id, type, x, y, width, height
   */
  const addShape = useCallback(async (shape) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Optimistic update happens through Firestore listener
      await addShapeToFirestore(shape, user.uid);
    } catch (error) {
      console.error('Failed to add shape:', error);
      // Rollback not needed - Firestore never updated
      alert('Failed to create shape. Please try again.');
    }
  }, [user]);

  /**
   * Update an existing shape with optimistic update
   * 
   * @param {string} shapeId - ID of shape to update
   * @param {Object} updates - Properties to update
   */
  const updateShape = useCallback(async (shapeId, updates) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Store original shape for rollback
    const originalShape = shapes.find(s => s.id === shapeId);
    if (!originalShape) return;

    try {
      // Update happens through Firestore listener (optimistic)
      await updateShapeInFirestore(shapeId, updates);
    } catch (error) {
      console.error('Failed to update shape:', error);
      // Firestore listener will revert to last known state
      alert('Failed to update shape. Please try again.');
    }
  }, [user, shapes]);

  /**
   * Delete a shape with optimistic update
   * 
   * @param {string} shapeId - ID of shape to delete
   */
  const deleteShape = useCallback(async (shapeId) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Clear selection if deleted shape was selected
    if (selectedShapeId === shapeId) {
      setSelectedShapeId(null);
    }

    try {
      // Delete happens through Firestore listener (optimistic)
      await deleteShapeFromFirestore(shapeId);
    } catch (error) {
      console.error('Failed to delete shape:', error);
      // Firestore listener will restore shape if delete failed
      alert('Failed to delete shape. Please try again.');
    }
  }, [user, selectedShapeId]);

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
    isOwner,
    loading,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
    getShape,
  };
}

