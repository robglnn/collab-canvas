import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

/**
 * Custom hook to manage Firebase authentication state
 * Handles Google sign-in, sign-out, and user state persistence
 * 
 * @returns {Object} Authentication state and methods
 * @returns {Object|null} user - Current user object (displayName, email, photoURL, uid)
 * @returns {boolean} loading - Loading state during auth operations
 * @returns {string|null} error - Error message if auth operation fails
 * @returns {Function} signInWithGoogle - Function to trigger Google OAuth sign-in
 * @returns {Function} signOut - Function to sign out current user
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign in with Google OAuth popup
   * Force account selection to allow switching users
   */
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set custom parameters to force account selection
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // User info is automatically set by onAuthStateChanged listener
      console.log('Successfully signed in:', result.user.displayName);
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out current user
   * Includes cleanup of presence, cursor, and locks before signing out
   */
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cleanup will be handled by usePresence and useCursors unmount effects
      // when user becomes null after firebaseSignOut
      await firebaseSignOut(auth);
      
      console.log('Successfully signed out');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };
}

