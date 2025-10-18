import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ref, 
  onValue, 
  set,
  remove,
  off,
  onDisconnect
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
      const onlineUserIdSet = new Set(onlineUserIds);
      
      if (cursorsData) {
        Object.entries(cursorsData).forEach(([userId, cursorData]) => {
          // Filter out current user's cursor
          if (userId !== user.uid) {
            // Apply online filter immediately (no second state update needed)
            if (onlineUserIds.length === 0 || onlineUserIdSet.has(userId)) {
              remoteCursors.push({
                userId,
                ...cursorData,
              });
              console.log(`[RTDB] Cursor update for ${cursorData.userName}: (${Math.round(cursorData.x)}, ${Math.round(cursorData.y)})`);
            }
          }
        });
      }
      
      // Single state update - no delay!
      setCursors(remoteCursors);
      console.log('[RTDB] Filtered cursors set:', remoteCursors.length);
    };
    
    // Subscribe to RTDB value changes
    onValue(cursorsRef, handleCursorsUpdate, (error) => {
      console.error('[RTDB] Error in cursors subscription:', error);
    });

    return () => {
      console.log('[RTDB] Cleaning up cursor subscription...');
      off(cursorsRef, 'value', handleCursorsUpdate);
    };
  }, [user, onlineUserIds]); // Added onlineUserIds to dependencies

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
      
      // Set up automatic cleanup on disconnect (only needs to be set once, but safe to call multiple times)
      onDisconnect(cursorRef).remove().catch((err) => {
        console.error('[RTDB] Error setting onDisconnect for cursor:', err);
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

  // Note: Filtering now happens directly in handleCursorsUpdate for instant updates
  // No separate filtering effect needed - avoids double state update delay

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

