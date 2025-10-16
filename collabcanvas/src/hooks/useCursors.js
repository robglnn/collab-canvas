import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc,
  deleteDoc,
  getDocs,
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
 * Only shows cursors for users who are currently online
 * 
 * @param {Array} onlineUserIds - Array of user IDs who are currently online
 * @returns {Object} Cursors state and methods
 * @returns {Array} cursors - Array of remote user cursors (filtered to online users only)
 * @returns {Function} updateCursorPosition - Function to update current user's cursor
 * @returns {Function} removeCursor - Function to explicitly remove cursor
 */
export function useCursors(onlineUserIds = []) {
  const { user } = useAuth();
  const [allCursors, setAllCursors] = useState([]);
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
      
      setAllCursors(remoteCursors);
      console.log('All remote cursors:', remoteCursors.length);
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
      // Delete the cursor document completely
      await deleteDoc(cursorRef);
      console.log('Cursor removed for user:', user.displayName);
    } catch (error) {
      console.error('Error removing cursor:', error);
    }
  }, [user]);

  // Filter cursors to only show online users
  useEffect(() => {
    if (onlineUserIds.length === 0) {
      // No presence data yet, show all cursors temporarily
      setCursors(allCursors);
      return;
    }

    const onlineUserIdSet = new Set(onlineUserIds);
    const filteredCursors = allCursors.filter(cursor => 
      onlineUserIdSet.has(cursor.userId)
    );
    
    setCursors(filteredCursors);
    // Only log when cursor count actually changes
    if (filteredCursors.length !== cursors.length) {
      console.log(`Filtered cursors: ${filteredCursors.length} online out of ${allCursors.length} total`);
    }
  }, [allCursors, onlineUserIds, cursors.length]);

  // Clean up stale cursors on mount (remove cursors from offline users)
  useEffect(() => {
    if (!user || onlineUserIds.length === 0) return;

    const cleanupStaleCursors = async () => {
      try {
        const cursorsRef = collection(db, 'canvases', CANVAS_ID, 'cursors');
        const snapshot = await getDocs(cursorsRef);
        
        const onlineUserIdSet = new Set(onlineUserIds);
        const deletePromises = [];
        
        snapshot.forEach((doc) => {
          // If cursor belongs to offline user, delete it
          if (!onlineUserIdSet.has(doc.id)) {
            console.log(`Deleting stale cursor for offline user: ${doc.id}`);
            deletePromises.push(deleteDoc(doc.ref));
          }
        });
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log(`Cleaned up ${deletePromises.length} stale cursors`);
        }
      } catch (error) {
        console.error('Error cleaning up stale cursors:', error);
      }
    };

    // Run cleanup after a short delay to let presence data load
    const timer = setTimeout(cleanupStaleCursors, 2000);
    return () => clearTimeout(timer);
  }, [user, onlineUserIds]);

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

