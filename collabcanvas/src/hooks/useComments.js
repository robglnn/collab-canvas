import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const CANVAS_ID = 'main'; // Single shared canvas for MVP

/**
 * Extract user initials from display name
 * Format: First letter of first name + first letter of last name
 * 
 * @param {string} userName - User's display name
 * @returns {string} User initials (e.g., "JD" for "John Doe")
 */
function extractInitials(userName) {
  if (!userName) return '?';
  const words = userName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Custom hook to manage shape comments
 * Handles Firestore subscriptions, CRUD operations, and undo support
 * 
 * @param {string} shapeId - ID of the shape to get comments for
 * @param {Object} user - Current user object (uid, displayName)
 * @returns {Object} Comments state and methods
 * @returns {Array} comments - Array of comment objects for the shape
 * @returns {boolean} loading - Loading state
 * @returns {string|null} error - Error message if operation fails
 * @returns {Function} addComment - Add a new comment
 * @returns {Function} updateComment - Edit an existing comment
 * @returns {Function} deleteComment - Delete a comment (soft or permanent)
 * @returns {Function} restoreComment - Restore a soft-deleted comment (for undo)
 */
export function useComments(shapeId, user) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to comments for this shape
  useEffect(() => {
    if (!shapeId) {
      setComments([]);
      setLoading(false);
      return;
    }

    console.log('Subscribing to comments for shape:', shapeId);

    try {
      const commentsRef = collection(db, 'canvases', CANVAS_ID, 'comments');
      
      // Query: Get non-deleted comments for this shape, sorted by creation date (newest first)
      const q = query(
        commentsRef,
        where('shapeId', '==', shapeId),
        where('deleted', '==', false),
        where('permanentlyDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const commentsData = [];
          snapshot.forEach((doc) => {
            commentsData.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          setComments(commentsData);
          setLoading(false);
          setError(null);
          console.log('Comments updated:', commentsData.length);
        },
        (err) => {
          console.error('Error subscribing to comments:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        console.log('Unsubscribing from comments');
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up comments subscription:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [shapeId]);

  /**
   * Add a new comment to a shape
   * 
   * @param {string} text - Comment text (max 100 chars)
   * @returns {Promise<string>} Comment ID
   */
  const addComment = async (text) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Comment text cannot be empty');
    }

    if (text.length > 100) {
      throw new Error('Comment text cannot exceed 100 characters');
    }

    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const commentRef = doc(db, 'canvases', CANVAS_ID, 'comments', commentId);
      
      // Use client timestamp for immediate display (serverTimestamp creates null initially)
      const now = new Date();
      
      const commentData = {
        id: commentId,
        shapeId,
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userInitials: extractInitials(user.displayName || 'Anonymous'),
        createdAt: now,
        updatedAt: now,
        deleted: false,
        deletedAt: null,
        permanentlyDeleted: false,
      };

      await setDoc(commentRef, commentData);
      console.log('Comment added:', commentId);
      return commentId;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update an existing comment
   * 
   * @param {string} commentId - Comment ID
   * @param {string} text - Updated comment text (max 100 chars)
   * @returns {Promise<void>}
   */
  const updateComment = async (commentId, text) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Comment text cannot be empty');
    }

    if (text.length > 100) {
      throw new Error('Comment text cannot exceed 100 characters');
    }

    try {
      const commentRef = doc(db, 'canvases', CANVAS_ID, 'comments', commentId);
      
      await updateDoc(commentRef, {
        text: text.trim(),
        updatedAt: new Date(),
      });

      console.log('Comment updated:', commentId);
    } catch (err) {
      console.error('Error updating comment:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete a comment (soft delete or permanent delete)
   * 
   * @param {string} commentId - Comment ID
   * @param {boolean} firstDelete - True for soft delete (can undo), false for permanent
   * @returns {Promise<void>}
   */
  const deleteComment = async (commentId, firstDelete = true) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const commentRef = doc(db, 'canvases', CANVAS_ID, 'comments', commentId);

      if (firstDelete) {
        // Soft delete - can be restored with undo
        await updateDoc(commentRef, {
          deleted: true,
          deletedAt: new Date(),
        });
        console.log('Comment soft-deleted:', commentId);
      } else {
        // Permanent delete - remove from database
        await deleteDoc(commentRef);
        console.log('Comment permanently deleted:', commentId);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Restore a soft-deleted comment (for undo)
   * 
   * @param {string} commentId - Comment ID
   * @returns {Promise<void>}
   */
  const restoreComment = async (commentId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const commentRef = doc(db, 'canvases', CANVAS_ID, 'comments', commentId);
      
      await updateDoc(commentRef, {
        deleted: false,
        deletedAt: null,
      });

      console.log('Comment restored:', commentId);
    } catch (err) {
      console.error('Error restoring comment:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    restoreComment,
  };
}

