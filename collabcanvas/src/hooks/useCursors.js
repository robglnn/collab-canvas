import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ref, 
  onValue, 
  set,
  remove,
  off 
} from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from './useAuth';

const CANVAS_ID = 'main';
const THROTTLE_MS = 50; // 20 updates per second (sub-50ms target)

/**
 * Custom hook for cursor synchronization via RTDB
 * Manages local cursor position updates and subscribes to remote cursors
 * Uses Firebase Realtime Database for sub-50ms cursor sync latency
 * Throttles updates to 50ms to avoid excessive RTDB writes (20 updates/sec)
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

  // Subscribe to cursors in RTDB
  useEffect(() => {
    if (!user) return;

    console.log('[RTDB] Setting up cursor subscription...');

    const cursorsRef = ref(database, `cursors/${CANVAS_ID}`);
    
    const handleCursorsUpdate = (snapshot) => {
      const remoteCursors = [];
      const cursorsData = snapshot.val();
      
      if (cursorsData) {
        Object.entries(cursorsData).forEach(([userId, cursorData]) => {
          // Filter out current user's cursor
          if (userId !== user.uid) {
            remoteCursors.push({
              userId,
              ...cursorData,
            });
          }
        });
      }
      
      setAllCursors(remoteCursors);
      console.log('[RTDB] All remote cursors:', remoteCursors.length);
    };
    
    // Subscribe to RTDB value changes
    onValue(cursorsRef, handleCursorsUpdate, (error) => {
      console.error('[RTDB] Error in cursors subscription:', error);
    });

    return () => {
      console.log('[RTDB] Cleaning up cursor subscription...');
      off(cursorsRef, 'value', handleCursorsUpdate);
    };
  }, [user]);

  /**
   * Update cursor position with throttling to RTDB
   * Throttles to 50ms to prevent excessive writes (20 updates/sec)
   * Target: Sub-50ms sync latency
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
      const cursorRef = ref(database, `cursors/${CANVAS_ID}/${user.uid}`);
      await set(cursorRef, {
        x,
        y,
        userName: user.displayName,
        photoURL: user.photoURL || null,
        timestamp: now, // Use client timestamp for latency measurement
      });
    } catch (error) {
      console.error('[RTDB] Error updating cursor position:', error);
      // Fail silently - cursor updates are not critical
    }
  }, [user]);

  /**
   * Remove current user's cursor from RTDB
   * Called on unmount or when user leaves canvas
   */
  const removeCursor = useCallback(async () => {
    if (!user) return;

    try {
      const cursorRef = ref(database, `cursors/${CANVAS_ID}/${user.uid}`);
      await remove(cursorRef);
      console.log('[RTDB] Cursor removed for user:', user.displayName);
    } catch (error) {
      console.error('[RTDB] Error removing cursor:', error);
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
        const cursorsRef = ref(database, `cursors/${CANVAS_ID}`);
        const snapshot = await new Promise((resolve, reject) => {
          onValue(cursorsRef, resolve, reject, { onlyOnce: true });
        });
        
        const cursorsData = snapshot.val();
        if (!cursorsData) return;
        
        const onlineUserIdSet = new Set(onlineUserIds);
        const deletePromises = [];
        
        Object.keys(cursorsData).forEach((userId) => {
          // If cursor belongs to offline user, delete it
          if (!onlineUserIdSet.has(userId)) {
            console.log(`[RTDB] Deleting stale cursor for offline user: ${userId}`);
            const cursorRef = ref(database, `cursors/${CANVAS_ID}/${userId}`);
            deletePromises.push(remove(cursorRef));
          }
        });
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log(`[RTDB] Cleaned up ${deletePromises.length} stale cursors`);
        }
      } catch (error) {
        console.error('[RTDB] Error cleaning up stale cursors:', error);
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

