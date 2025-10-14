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
    await setDoc(shapeRef, {
      ...shape,
      createdBy: userId,
      lockedBy: null,
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

