import { useState, useEffect } from 'react';
import { subscribeToShapes, subscribeToCanvasMetadata } from '../lib/firestoreService';

/**
 * Custom hook for Firestore real-time listeners
 * Subscribes to shapes collection and canvas metadata
 * 
 * @returns {Object} Firestore state
 * @returns {Array} shapes - Array of shape objects from Firestore
 * @returns {Object|null} canvasMetadata - Canvas metadata (ownerId, createdAt)
 * @returns {boolean} loading - Loading state
 * @returns {string|null} error - Error message if subscription fails
 */
export function useFirestore() {
  const [shapes, setShapes] = useState([]);
  const [canvasMetadata, setCanvasMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Setting up Firestore subscriptions...');

    // Subscribe to shapes collection
    const unsubscribeShapes = subscribeToShapes((updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
      console.log('Shapes updated from Firestore:', updatedShapes.length);
    });

    // Subscribe to canvas metadata
    const unsubscribeMetadata = subscribeToCanvasMetadata((metadata) => {
      setCanvasMetadata(metadata);
      console.log('Canvas metadata updated:', metadata);
    });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up Firestore subscriptions...');
      unsubscribeShapes();
      unsubscribeMetadata();
    };
  }, []);

  return {
    shapes,
    canvasMetadata,
    loading,
    error,
  };
}

