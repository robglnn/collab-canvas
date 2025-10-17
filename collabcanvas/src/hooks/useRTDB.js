import { useEffect, useCallback, useRef } from 'react';
import { ref, set, onValue, remove, off } from 'firebase/database';
import { database } from '../lib/firebase';

/**
 * Custom hook for RTDB temporary updates
 * Handles high-frequency shape updates (like line width while dragging)
 * that need sub-100ms sync but don't need to be immediately persisted
 * 
 * Flow:
 * 1. User drags slider -> writeTempUpdate() to RTDB (50-100ms to others)
 * 2. Others see update via subscribeTempUpdates()
 * 3. On mouse up -> write to Firestore (permanent) + clearTempUpdate()
 * 
 * @param {string} canvasId - Canvas ID (default: 'main')
 * @returns {Object} RTDB operations
 * @returns {Function} writeTempUpdate - Write temporary shape update to RTDB
 * @returns {Function} subscribeTempUpdates - Subscribe to temp updates
 * @returns {Function} clearTempUpdate - Clear temp update from RTDB
 * @returns {Function} clearAllTempUpdates - Clear all temp updates for cleanup
 */
export function useRTDB(canvasId = 'main') {
  const listenerRef = useRef(null);
  const callbackRef = useRef(null);

  /**
   * Write a temporary update to RTDB
   * Target: Sub-100ms sync to other users
   * 
   * @param {string} shapeId - Shape ID
   * @param {Object} updates - Partial shape data to update
   * @returns {Promise<void>}
   */
  const writeTempUpdate = useCallback(async (shapeId, updates) => {
    try {
      const tempRef = ref(database, `tempUpdates/${canvasId}/${shapeId}`);
      await set(tempRef, {
        ...updates,
        timestamp: Date.now(), // For latency measurement
      });
    } catch (error) {
      console.error('[RTDB] Error writing temp update:', error);
      // Fail silently - temp updates are not critical
    }
  }, [canvasId]);

  /**
   * Subscribe to temporary updates from RTDB
   * Calls callback with updates object whenever changes occur
   * 
   * @param {Function} callback - Called with { [shapeId]: updateData }
   * @returns {Function} Unsubscribe function
   */
  const subscribeTempUpdates = useCallback((callback) => {
    const tempRef = ref(database, `tempUpdates/${canvasId}`);
    
    // Store callback for cleanup
    callbackRef.current = callback;
    
    const handleTempUpdates = (snapshot) => {
      const updates = snapshot.val() || {};
      callback(updates);
      
      // Log latency for performance monitoring
      const now = Date.now();
      Object.entries(updates).forEach(([shapeId, data]) => {
        if (data.timestamp) {
          const latency = now - data.timestamp;
          if (latency < 200) { // Only log if reasonable (not stale data)
            console.log(`[RTDB] Temp update latency for ${shapeId}: ${latency}ms`);
          }
        }
      });
    };
    
    // Subscribe
    onValue(tempRef, handleTempUpdates, (error) => {
      console.error('[RTDB] Error in temp updates subscription:', error);
    });
    
    // Store listener ref for cleanup
    listenerRef.current = tempRef;
    
    // Return unsubscribe function
    return () => {
      if (listenerRef.current) {
        off(listenerRef.current, 'value', handleTempUpdates);
        listenerRef.current = null;
        callbackRef.current = null;
      }
    };
  }, [canvasId]);

  /**
   * Clear a specific temporary update from RTDB
   * Called after permanent write to Firestore
   * 
   * @param {string} shapeId - Shape ID
   * @returns {Promise<void>}
   */
  const clearTempUpdate = useCallback(async (shapeId) => {
    try {
      const tempRef = ref(database, `tempUpdates/${canvasId}/${shapeId}`);
      await remove(tempRef);
      console.log(`[RTDB] Cleared temp update for ${shapeId}`);
    } catch (error) {
      console.error('[RTDB] Error clearing temp update:', error);
    }
  }, [canvasId]);

  /**
   * Clear all temporary updates for this canvas
   * Used for cleanup on unmount or reset
   * 
   * @returns {Promise<void>}
   */
  const clearAllTempUpdates = useCallback(async () => {
    try {
      const tempRef = ref(database, `tempUpdates/${canvasId}`);
      await remove(tempRef);
      console.log('[RTDB] Cleared all temp updates');
    } catch (error) {
      console.error('[RTDB] Error clearing all temp updates:', error);
    }
  }, [canvasId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current && callbackRef.current) {
        off(listenerRef.current, 'value', callbackRef.current);
      }
    };
  }, []);

  return {
    writeTempUpdate,
    subscribeTempUpdates,
    clearTempUpdate,
    clearAllTempUpdates,
  };
}

