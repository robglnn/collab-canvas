import { useState, useEffect } from 'react';
import { subscribeToShapes, subscribeToCanvasMetadata, subscribeToCanvasShapes } from '../lib/firestoreService';

/**
 * Custom hook for Firestore real-time listeners
 * Subscribes to shapes collection and canvas metadata
 * Detects connection state for offline/online handling
 * 
 * @param {string} canvasId - Optional canvas ID for multi-canvas support
 * @returns {Object} Firestore state
 * @returns {Array} shapes - Array of shape objects from Firestore
 * @returns {Object|null} canvasMetadata - Canvas metadata (ownerId, createdAt)
 * @returns {boolean} loading - Loading state
 * @returns {boolean} isConnected - Connection state
 * @returns {boolean} showDisconnectBanner - Whether to show disconnect banner (after 3s)
 * @returns {string|null} error - Error message if subscription fails
 */
export function useFirestore(canvasId) {
  const [shapes, setShapes] = useState([]);
  const [canvasMetadata, setCanvasMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [showDisconnectBanner, setShowDisconnectBanner] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasId) {
      setLoading(false);
      return;
    }

    console.log('Setting up Firestore subscriptions for canvas:', canvasId);

    // Subscribe to shapes collection (use canvas-specific if canvasId provided)
    const unsubscribeShapes = canvasId 
      ? subscribeToCanvasShapes(canvasId, (updatedShapes) => {
          setShapes(updatedShapes);
          setLoading(false);
          setIsConnected(true);
          setShowDisconnectBanner(false);
          console.log('Shapes updated from Firestore:', updatedShapes.length);
        })
      : subscribeToShapes((updatedShapes) => {
          setShapes(updatedShapes);
          setLoading(false);
          setIsConnected(true);
          setShowDisconnectBanner(false);
          console.log('Shapes updated from Firestore:', updatedShapes.length);
        });

    // Subscribe to canvas metadata
    const unsubscribeMetadata = subscribeToCanvasMetadata((metadata) => {
      setCanvasMetadata(metadata);
      setIsConnected(true);
      console.log('Canvas metadata updated:', metadata);
    });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up Firestore subscriptions...');
      unsubscribeShapes();
      unsubscribeMetadata();
    };
  }, [canvasId]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser is online');
      setIsConnected(true);
      setShowDisconnectBanner(false);
    };

    const handleOffline = () => {
      console.log('Browser is offline');
      setIsConnected(false);
      
      // Show banner after 3 seconds
      const timer = setTimeout(() => {
        setShowDisconnectBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    shapes,
    canvasMetadata,
    loading,
    isConnected,
    showDisconnectBanner,
    error,
  };
}

