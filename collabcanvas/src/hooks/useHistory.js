import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50; // Maximum number of undo steps

/**
 * Custom hook for undo/redo functionality
 * Manages history stacks (past and future) and provides undo/redo operations
 * 
 * @returns {Object} History state and methods
 * @returns {boolean} canUndo - Whether undo is available
 * @returns {boolean} canRedo - Whether redo is available
 * @returns {Function} takeSnapshot - Save current state to history
 * @returns {Function} undo - Undo last action
 * @returns {Function} redo - Redo last undone action
 * @returns {Function} clearHistory - Clear all history
 */
export function useHistory() {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoingRef = useRef(false); // Flag to prevent taking snapshot during undo/redo

  /**
   * Take a snapshot of the current state
   * @param {Array} currentState - Current shapes array
   */
  const takeSnapshot = useCallback((currentState) => {
    // Don't take snapshot during undo/redo operations
    if (isUndoingRef.current) return;

    setPast(prevPast => {
      const newPast = [...prevPast, JSON.parse(JSON.stringify(currentState))];
      // Limit history size
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return newPast;
    });
    
    // Clear future when new action is taken
    setFuture([]);
    
    console.log('Snapshot taken');
  }, []);

  /**
   * Undo the last action
   * @param {Array} currentState - Current shapes array
   * @returns {Array|null} Previous state or null if nothing to undo
   */
  const undo = useCallback((currentState) => {
    if (past.length === 0) {
      console.log('Nothing to undo');
      return null;
    }

    isUndoingRef.current = true;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture(prevFuture => [...prevFuture, JSON.parse(JSON.stringify(currentState))]);

    console.log(`Undone (${newPast.length} states in history)`);

    // Reset flag after state update
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return JSON.parse(JSON.stringify(previous));
  }, [past]);

  /**
   * Redo the last undone action
   * @param {Array} currentState - Current shapes array
   * @returns {Array|null} Next state or null if nothing to redo
   */
  const redo = useCallback((currentState) => {
    if (future.length === 0) {
      console.log('Nothing to redo');
      return null;
    }

    isUndoingRef.current = true;

    const next = future[future.length - 1];
    const newFuture = future.slice(0, future.length - 1);

    setFuture(newFuture);
    setPast(prevPast => [...prevPast, JSON.parse(JSON.stringify(currentState))]);

    console.log(`Redone (${newFuture.length} states available to redo)`);

    // Reset flag after state update
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return JSON.parse(JSON.stringify(next));
  }, [future]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
    console.log('History cleared');
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    takeSnapshot,
    undo,
    redo,
    clearHistory,
  };
}

