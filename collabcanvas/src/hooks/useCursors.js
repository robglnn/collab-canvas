import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

const CANVAS_ID = 'main';
const THROTTLE_MS = 50; // 20 updates per second

/**
 * Custom hook for cursor synchronization
 * Manages local cursor position updates and subscribes to remote cursors
 * Throttles updates to 50-100ms to avoid excessive Firestore writes
 * 
 * @returns {Object} Cursors state and methods
 * @returns {Array} cursors - Array of remote user cursors
 * @returns {Function} updateCursorPosition - Function to update current user's cursor
 */
export function useCursors() {
  const { user } = useAuth();
  const [cursors, setCursors] = useState([]);
  
  // Throttle state
  const lastUpdateRef = useRef(0);
  const pendingUpdateRef = useRef(null);

  // Subscribe to cursors collection
  useEffect(() => {
    if (!user) return;

    console.log('Setting up cursor subscription...');

    const cursorsRef = collection(db, 'canvases', CANVAS_ID, 'cursors');
    
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      const remoteCursors = [];
      
      snapshot.forEach((doc) => {
        // Filter out current user's cursor
        if (doc.id !== user.uid) {
          remoteCursors.push({
            userId: doc.id,
            ...doc.data(),
          });
        }
      });
      
      setCursors(remoteCursors);
      console.log('Remote cursors updated:', remoteCursors.length);
    }, (error) => {
      console.error('Error in cursors subscription:', error);
    });

    return () => {
      console.log('Cleaning up cursor subscription...');
      unsubscribe();
    };
  }, [user]);

  /**
   * Update cursor position with throttling
   * Throttles to 50-100ms to prevent excessive Firestore writes
   * 
   * @param {number} x - Canvas X coordinate
   * @param {number} y - Canvas Y coordinate
   */
  const updateCursorPosition = useCallback(async (x, y) => {
    if (!user) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Store pending update
    pendingUpdateRef.current = { x, y };

    // If throttle period hasn't passed, skip this update
    if (timeSinceLastUpdate < THROTTLE_MS) {
      return;
    }

    // Update last update time
    lastUpdateRef.current = now;

    try {
      const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', user.uid);
      await setDoc(cursorRef, {
        x,
        y,
        userName: user.displayName,
        photoURL: user.photoURL || null,
        lastUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating cursor position:', error);
      // Fail silently - cursor updates are not critical
    }
  }, [user]);

  /**
   * Remove current user's cursor from Firestore
   * Called on unmount or when user leaves canvas
   */
  const removeCursor = useCallback(async () => {
    if (!user) return;

    try {
      const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', user.uid);
      await setDoc(cursorRef, {
        x: -1000, // Move off-screen
        y: -1000,
        userName: user.displayName,
        photoURL: user.photoURL || null,
        lastUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing cursor:', error);
    }
  }, [user]);

  // Clean up cursor on unmount
  useEffect(() => {
    return () => {
      removeCursor();
    };
  }, [removeCursor]);

  return {
    cursors,
    updateCursorPosition,
    removeCursor,
  };
}

