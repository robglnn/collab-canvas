import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const CANVAS_ID = 'main'; // Single shared canvas for MVP

/**
 * Firestore service for canvas operations
 * All operations target /canvases/main/ collection
 */

// ==================== SHAPES ====================

/**
 * Add a shape to Firestore
 * 
 * @param {Object} shape - Shape object with id, type, x, y, width, height
 * @param {string} userId - User ID who created the shape
 * @returns {Promise<void>}
 */
export async function addShape(shape, userId) {
  try {
    const shapeRef = doc(db, 'canvases', CANVAS_ID, 'objects', shape.id);
    
    // Get current max zIndex to assign new shape to front
    const objectsRef = collection(db, 'canvases', CANVAS_ID, 'objects');
    const snapshot = await getDocs(objectsRef);
    const maxZIndex = Math.max(0, ...snapshot.docs.map(doc => doc.data().zIndex ?? 0));
    
    await setDoc(shapeRef, {
      ...shape,
      createdBy: userId,
      lockedBy: null,
      zIndex: shape.zIndex ?? maxZIndex + 1, // Assign next highest zIndex
      updatedAt: serverTimestamp(),
    });
    console.log('Shape added to Firestore:', shape.id);
  } catch (error) {
    console.error('Error adding shape:', error);
    throw error;
  }
}

/**
 * Update a shape in Firestore
 * 
 * @param {string} shapeId - Shape ID
 * @param {Object} updates - Properties to update
 * @returns {Promise<void>}
 */
export async function updateShape(shapeId, updates) {
  try {
    const shapeRef = doc(db, 'canvases', CANVAS_ID, 'objects', shapeId);
    await updateDoc(shapeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape updated in Firestore:', shapeId);
  } catch (error) {
    console.error('Error updating shape:', error);
    throw error;
  }
}

/**
 * Delete a shape from Firestore
 * 
 * @param {string} shapeId - Shape ID
 * @returns {Promise<void>}
 */
export async function deleteShape(shapeId) {
  try {
    const shapeRef = doc(db, 'canvases', CANVAS_ID, 'objects', shapeId);
    await deleteDoc(shapeRef);
    console.log('Shape deleted from Firestore:', shapeId);
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw error;
  }
}

/**
 * Lock a shape for editing
 * 
 * @param {string} shapeId - Shape ID
 * @param {string} userId - User ID who is locking the shape
 * @returns {Promise<void>}
 */
export async function lockShape(shapeId, userId) {
  try {
    const shapeRef = doc(db, 'canvases', CANVAS_ID, 'objects', shapeId);
    await updateDoc(shapeRef, {
      lockedBy: userId,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape locked by:', userId, shapeId);
  } catch (error) {
    console.error('Error locking shape:', error);
    throw error;
  }
}

/**
 * Unlock a shape (release lock)
 * 
 * @param {string} shapeId - Shape ID
 * @returns {Promise<void>}
 */
export async function unlockShape(shapeId) {
  try {
    const shapeRef = doc(db, 'canvases', CANVAS_ID, 'objects', shapeId);
    await updateDoc(shapeRef, {
      lockedBy: null,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape unlocked:', shapeId);
  } catch (error) {
    console.error('Error unlocking shape:', error);
    throw error;
  }
}

/**
 * Force override lock on a shape (owner only)
 * 
 * @param {string} shapeId - Shape ID
 * @param {string} ownerId - Owner's user ID
 * @returns {Promise<void>}
 */
export async function forceOverrideLock(shapeId, ownerId) {
  try {
    const shapeRef = doc(db, 'canvases', CANVAS_ID, 'objects', shapeId);
    await updateDoc(shapeRef, {
      lockedBy: ownerId,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape lock overridden by owner:', shapeId);
  } catch (error) {
    console.error('Error overriding shape lock:', error);
    throw error;
  }
}

/**
 * Get all shapes from Firestore
 * 
 * @returns {Promise<Array>} Array of shape objects
 */
export async function getShapes() {
  try {
    const shapesRef = collection(db, 'canvases', CANVAS_ID, 'objects');
    const snapshot = await getDocs(shapesRef);
    const shapes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Shapes loaded from Firestore:', shapes.length);
    return shapes;
  } catch (error) {
    console.error('Error getting shapes:', error);
    throw error;
  }
}

/**
 * Subscribe to shapes changes in real-time
 * 
 * @param {Function} callback - Callback function called with updated shapes array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToShapes(callback) {
  const shapesRef = collection(db, 'canvases', CANVAS_ID, 'objects');
  
  return onSnapshot(shapesRef, (snapshot) => {
    const shapes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(shapes);
  }, (error) => {
    console.error('Error in shapes subscription:', error);
  });
}

// ==================== CANVAS METADATA ====================

/**
 * Set canvas owner (first user becomes permanent owner)
 * 
 * @param {string} userId - User ID to set as owner
 * @returns {Promise<void>}
 */
export async function setCanvasOwner(userId) {
  try {
    const canvasRef = doc(db, 'canvases', CANVAS_ID);
    await setDoc(canvasRef, {
      ownerId: userId,
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('Canvas owner set:', userId);
  } catch (error) {
    console.error('Error setting canvas owner:', error);
    throw error;
  }
}

/**
 * Get canvas owner ID
 * 
 * @returns {Promise<string|null>} Owner user ID or null if not set
 */
export async function getCanvasOwner() {
  try {
    const canvasRef = doc(db, 'canvases', CANVAS_ID);
    const canvasDoc = await getDoc(canvasRef);
    
    if (canvasDoc.exists()) {
      return canvasDoc.data().ownerId || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting canvas owner:', error);
    throw error;
  }
}

/**
 * Subscribe to canvas metadata changes
 * 
 * @param {Function} callback - Callback function called with canvas metadata
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCanvasMetadata(callback) {
  const canvasRef = doc(db, 'canvases', CANVAS_ID);
  
  return onSnapshot(canvasRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in canvas metadata subscription:', error);
  });
}

// ==================== USER MANAGEMENT ====================

/**
 * Kick a user from the canvas (owner only)
 * Sets their presence to offline and marks them as kicked
 * 
 * @param {string} userId - User ID to kick
 * @returns {Promise<void>}
 */
export async function kickUser(userId) {
  try {
    const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', userId);
    await setDoc(presenceRef, {
      online: false,
      kicked: true,
      kickedAt: serverTimestamp(),
    }, { merge: true });
    console.log('User kicked:', userId);
  } catch (error) {
    console.error('Error kicking user:', error);
    throw error;
  }
}

