import { useState, useCallback, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';
import { db } from '../lib/firebase';
import {
  addShape as addShapeToFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeFromFirestore,
  lockShape as lockShapeInFirestore,
  unlockShape as unlockShapeInFirestore,
  forceOverrideLock as forceOverrideLockInFirestore,
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
  const { shapes: firestoreShapes, canvasMetadata, loading, isConnected, showDisconnectBanner } = useFirestore();
  
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerId, setOwnerId] = useState(null);

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
          setOwnerId(user.uid);
          console.log('User is now canvas owner');
        } else if (currentOwner === user.uid) {
          // User is the owner
          setIsOwner(true);
          setOwnerId(currentOwner);
          console.log('User is canvas owner');
        } else {
          // User is a collaborator
          setIsOwner(false);
          setOwnerId(currentOwner);
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
   * Cleanup locks from offline users
   * Periodically checks locked shapes and releases locks if user is offline
   */
  useEffect(() => {
    if (!user || shapes.length === 0) return;

    const cleanupLocks = async () => {
      try {
        // Get all presence documents to check who's online
        const presenceRef = collection(db, 'canvases', 'main', 'presence');
        const presenceSnapshot = await getDocs(presenceRef);
        
        const onlineUserIds = new Set();
        presenceSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.online) {
            onlineUserIds.add(doc.id);
          }
        });

        // Check each locked shape
        for (const shape of shapes) {
          if (shape.lockedBy && !onlineUserIds.has(shape.lockedBy)) {
            console.log(`Unlocking shape ${shape.id} - user ${shape.lockedBy} is offline`);
            await unlockShapeInFirestore(shape.id);
          }
        }
      } catch (error) {
        console.error('Error cleaning up locks:', error);
      }
    };

    // Run cleanup every 5 seconds
    const interval = setInterval(cleanupLocks, 5000);
    
    // Also run immediately
    cleanupLocks();

    return () => clearInterval(interval);
  }, [user, shapes]);

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

  /**
   * Lock a shape for editing
   * 
   * @param {string} shapeId - Shape ID to lock
   */
  const lockShape = useCallback(async (shapeId) => {
    if (!user) return;
    
    try {
      await lockShapeInFirestore(shapeId, user.uid);
    } catch (error) {
      console.error('Error locking shape:', error);
      alert('Failed to lock shape. Please try again.');
    }
  }, [user]);

  /**
   * Unlock a shape (release lock)
   * 
   * @param {string} shapeId - Shape ID to unlock
   */
  const unlockShape = useCallback(async (shapeId) => {
    try {
      await unlockShapeInFirestore(shapeId);
    } catch (error) {
      console.error('Error unlocking shape:', error);
    }
  }, []);

  /**
   * Force override a lock (owner only)
   * 
   * @param {string} shapeId - Shape ID to override
   */
  const forceOverrideLock = useCallback(async (shapeId) => {
    if (!user || !isOwner) {
      console.warn('Only owner can override locks');
      return;
    }
    
    try {
      await forceOverrideLockInFirestore(shapeId, user.uid);
    } catch (error) {
      console.error('Error overriding lock:', error);
      alert('Failed to override lock. Please try again.');
    }
  }, [user, isOwner]);

  /**
   * Check if a shape can be edited by current user
   * 
   * @param {Object} shape - Shape object
   * @returns {boolean} True if shape can be edited
   */
  const canEditShape = useCallback((shape) => {
    if (!user) return false;
    if (!shape.lockedBy) return true; // Not locked
    if (shape.lockedBy === user.uid) return true; // Locked by current user
    if (isOwner) return true; // Owner can always edit
    return false; // Locked by someone else
  }, [user, isOwner]);

  return {
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
    getShape,
    lockShape,
    unlockShape,
    forceOverrideLock,
    canEditShape,
  };
}

