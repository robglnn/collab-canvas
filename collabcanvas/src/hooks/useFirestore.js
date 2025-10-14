import { useState, useEffect } from 'react';
import { subscribeToShapes, subscribeToCanvasMetadata } from '../lib/firestoreService';

/**
 * Custom hook for Firestore real-time listeners
 * Subscribes to shapes collection and canvas metadata
 * Detects connection state for offline/online handling
 * 
 * @returns {Object} Firestore state
 * @returns {Array} shapes - Array of shape objects from Firestore
 * @returns {Object|null} canvasMetadata - Canvas metadata (ownerId, createdAt)
 * @returns {boolean} loading - Loading state
 * @returns {boolean} isConnected - Connection state
 * @returns {boolean} showDisconnectBanner - Whether to show disconnect banner (after 3s)
 * @returns {string|null} error - Error message if subscription fails
 */
export function useFirestore() {
  const [shapes, setShapes] = useState([]);
  const [canvasMetadata, setCanvasMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [showDisconnectBanner, setShowDisconnectBanner] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Setting up Firestore subscriptions...');

    // Subscribe to shapes collection
    const unsubscribeShapes = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
      setIsConnected(true); // Receiving data means connected
      setShowDisconnectBanner(false);
      console.log('Shapes updated from Firestore:', updatedShapes.length);
    });

    // Subscribe to canvas metadata
    const unsubscribeMetadata = subscribeToCanvasMetadata((metadata) => {
      setCanvasMetadata(metadata);
      setIsConnected(true); // Receiving data means connected
      console.log('Canvas metadata updated:', metadata);
    });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up Firestore subscriptions...');
      unsubscribeShapes();
      unsubscribeMetadata();
    };
  }, []);

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

