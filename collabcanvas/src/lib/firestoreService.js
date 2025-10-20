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
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const CANVAS_ID = 'main'; // Single shared canvas for MVP (deprecated, now using user-specific canvases)

/**
 * Generate a random invite token
 */
function generateInviteToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a random canvas color
 */
function generateCanvasColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

// ==================== MULTI-CANVAS SYSTEM ====================

/**
 * Get canvas ID for a user's specific canvas number
 * @param {string} userId - User ID
 * @param {number} canvasNumber - Canvas number (1-3)
 * @returns {string} Canvas ID
 */
export function getCanvasId(userId, canvasNumber) {
  return `user_${userId}_canvas_${canvasNumber}`;
}

/**
 * Initialize a user's canvas if it doesn't exist
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {number} canvasNumber - Canvas number (1-3)
 * @returns {Promise<void>}
 */
export async function initializeCanvas(userId, userEmail, canvasNumber) {
  try {
    const canvasId = getCanvasId(userId, canvasNumber);
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasDoc = await getDoc(canvasRef);
    
    if (!canvasDoc.exists()) {
      await setDoc(canvasRef, {
        ownerId: userId,
        ownerEmail: userEmail,
        name: `Canvas ${canvasNumber}`,
        color: generateCanvasColor(),
        sharedWith: [], // Array of email addresses
        inviteToken: generateInviteToken(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Canvas initialized:', canvasId);
    }
  } catch (error) {
    console.error('Error initializing canvas:', error);
    throw error;
  }
}

/**
 * Get metadata for a specific canvas
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Object|null>} Canvas metadata or null
 */
export async function getCanvasMetadata(canvasId) {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasDoc = await getDoc(canvasRef);
    
    if (canvasDoc.exists()) {
      return { id: canvasId, ...canvasDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting canvas metadata:', error);
    throw error;
  }
}

/**
 * Get all canvases for a user (their own 3 canvases)
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Promise<Array>} Array of canvas metadata objects
 */
export async function getUserCanvases(userId, userEmail) {
  try {
    const canvases = [];
    
    for (let i = 1; i <= 3; i++) {
      await initializeCanvas(userId, userEmail, i);
      const canvasId = getCanvasId(userId, i);
      const metadata = await getCanvasMetadata(canvasId);
      if (metadata) {
        canvases.push({ ...metadata, canvasNumber: i });
      }
    }
    
    return canvases;
  } catch (error) {
    console.error('Error getting user canvases:', error);
    throw error;
  }
}

/**
 * Check if user has permission to access a canvas
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Promise<boolean>} True if user has access
 */
export async function checkCanvasPermission(canvasId, userId, userEmail) {
  try {
    const metadata = await getCanvasMetadata(canvasId);
    
    if (!metadata) return false;
    
    // Owner always has access
    if (metadata.ownerId === userId) return true;
    
    // Check if user's email is in sharedWith list
    if (metadata.sharedWith && metadata.sharedWith.includes(userEmail)) return true;
    
    return false;
  } catch (error) {
    console.error('Error checking canvas permission:', error);
    return false;
  }
}

/**
 * Update canvas name
 * @param {string} canvasId - Canvas ID
 * @param {string} newName - New canvas name
 * @returns {Promise<void>}
 */
export async function updateCanvasName(canvasId, newName) {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    await updateDoc(canvasRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
    console.log('Canvas name updated:', canvasId, newName);
  } catch (error) {
    console.error('Error updating canvas name:', error);
    throw error;
  }
}

/**
 * Add user email to canvas shared list
 * @param {string} canvasId - Canvas ID
 * @param {string} email - Email to add
 * @returns {Promise<void>}
 */
export async function addCanvasCollaborator(canvasId, email) {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasDoc = await getDoc(canvasRef);
    
    if (!canvasDoc.exists()) {
      throw new Error('Canvas not found');
    }
    
    const currentSharedWith = canvasDoc.data().sharedWith || [];
    
    if (!currentSharedWith.includes(email)) {
      await updateDoc(canvasRef, {
        sharedWith: [...currentSharedWith, email],
        updatedAt: serverTimestamp(),
      });
      console.log('Collaborator added to canvas:', canvasId, email);
    }
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
}

/**
 * Remove user email from canvas shared list
 * @param {string} canvasId - Canvas ID
 * @param {string} email - Email to remove
 * @returns {Promise<void>}
 */
export async function removeCanvasCollaborator(canvasId, email) {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasDoc = await getDoc(canvasRef);
    
    if (!canvasDoc.exists()) {
      throw new Error('Canvas not found');
    }
    
    const currentSharedWith = canvasDoc.data().sharedWith || [];
    
    await updateDoc(canvasRef, {
      sharedWith: currentSharedWith.filter(e => e !== email),
      updatedAt: serverTimestamp(),
    });
    console.log('Collaborator removed from canvas:', canvasId, email);
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Get canvas ID by invite token
 * @param {string} inviteToken - Invite token
 * @returns {Promise<string|null>} Canvas ID or null
 */
export async function getCanvasIdByInviteToken(inviteToken) {
  try {
    const canvasesRef = collection(db, 'canvases');
    const q = query(canvasesRef, where('inviteToken', '==', inviteToken));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting canvas by invite token:', error);
    return null;
  }
}

/**
 * Regenerate invite token for a canvas
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<string>} New invite token
 */
export async function regenerateInviteToken(canvasId) {
  try {
    const newToken = generateInviteToken();
    const canvasRef = doc(db, 'canvases', canvasId);
    await updateDoc(canvasRef, {
      inviteToken: newToken,
      updatedAt: serverTimestamp(),
    });
    console.log('Invite token regenerated:', canvasId);
    return newToken;
  } catch (error) {
    console.error('Error regenerating invite token:', error);
    throw error;
  }
}

// ==================== CANVAS-SPECIFIC OPERATIONS ====================

/**
 * Add a shape to a specific canvas
 */
export async function addShapeToCanvas(canvasId, shape, userId) {
  try {
    const shapeRef = doc(db, 'canvases', canvasId, 'objects', shape.id);
    
    // Get current max zIndex to assign new shape to front
    const objectsRef = collection(db, 'canvases', canvasId, 'objects');
    const snapshot = await getDocs(objectsRef);
    const maxZIndex = Math.max(0, ...snapshot.docs.map(doc => doc.data().zIndex ?? 0));
    
    await setDoc(shapeRef, {
      ...shape,
      createdBy: userId,
      lockedBy: null,
      zIndex: shape.zIndex ?? maxZIndex + 1,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape added to canvas:', canvasId, shape.id);
  } catch (error) {
    console.error('Error adding shape to canvas:', error);
    throw error;
  }
}

/**
 * Update a shape in a specific canvas
 */
export async function updateShapeInCanvas(canvasId, shapeId, updates) {
  try {
    const shapeRef = doc(db, 'canvases', canvasId, 'objects', shapeId);
    await updateDoc(shapeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape updated in canvas:', canvasId, shapeId);
  } catch (error) {
    console.error('Error updating shape in canvas:', error);
    throw error;
  }
}

/**
 * Delete a shape from a specific canvas
 */
export async function deleteShapeFromCanvas(canvasId, shapeId) {
  try {
    const shapeRef = doc(db, 'canvases', canvasId, 'objects', shapeId);
    await deleteDoc(shapeRef);
    console.log('Shape deleted from canvas:', canvasId, shapeId);
  } catch (error) {
    console.error('Error deleting shape from canvas:', error);
    throw error;
  }
}

/**
 * Subscribe to shapes changes in a specific canvas
 */
export function subscribeToCanvasShapes(canvasId, callback) {
  const shapesRef = collection(db, 'canvases', canvasId, 'objects');
  
  return onSnapshot(shapesRef, (snapshot) => {
    const shapes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(shapes);
  }, (error) => {
    console.error('Error in canvas shapes subscription:', error);
  });
}

/**
 * Get all shapes from a specific canvas
 */
export async function getCanvasShapes(canvasId) {
  try {
    const shapesRef = collection(db, 'canvases', canvasId, 'objects');
    const snapshot = await getDocs(shapesRef);
    const shapes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Shapes loaded from canvas:', canvasId, shapes.length);
    return shapes;
  } catch (error) {
    console.error('Error getting canvas shapes:', error);
    throw error;
  }
}

/**
 * Lock a shape in a specific canvas
 */
export async function lockShapeInCanvas(canvasId, shapeId, userId) {
  try {
    const shapeRef = doc(db, 'canvases', canvasId, 'objects', shapeId);
    await updateDoc(shapeRef, {
      lockedBy: userId,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape locked in canvas:', canvasId, shapeId, 'by:', userId);
  } catch (error) {
    console.error('Error locking shape in canvas:', error);
    throw error;
  }
}

/**
 * Unlock a shape in a specific canvas
 */
export async function unlockShapeInCanvas(canvasId, shapeId) {
  try {
    const shapeRef = doc(db, 'canvases', canvasId, 'objects', shapeId);
    await updateDoc(shapeRef, {
      lockedBy: null,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape unlocked in canvas:', canvasId, shapeId);
  } catch (error) {
    console.error('Error unlocking shape in canvas:', error);
    throw error;
  }
}

/**
 * Force override lock on a shape in a specific canvas (owner only)
 */
export async function forceOverrideLockInCanvas(canvasId, shapeId, ownerId) {
  try {
    const shapeRef = doc(db, 'canvases', canvasId, 'objects', shapeId);
    await updateDoc(shapeRef, {
      lockedBy: ownerId,
      updatedAt: serverTimestamp(),
    });
    console.log('Shape lock overridden in canvas:', canvasId, shapeId);
  } catch (error) {
    console.error('Error overriding shape lock in canvas:', error);
    throw error;
  }
}

