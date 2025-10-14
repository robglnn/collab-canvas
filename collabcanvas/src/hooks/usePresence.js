import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { kickUser as kickUserFromFirestore } from '../lib/firestoreService';

const CANVAS_ID = 'main';

/**
 * Custom hook for user presence tracking
 * Manages current user's online status and subscribes to all users' presence
 * 
 * @param {string} canvasOwnerId - The ID of the canvas owner
 * @returns {Object} Presence state
 * @returns {Array} users - Array of all users with presence data
 * @returns {number} onlineCount - Count of online users
 * @returns {boolean} isOwner - Whether current user is the owner
 */
export function usePresence(canvasOwnerId) {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);

  // Set current user as online when component mounts
  useEffect(() => {
    if (!user) return;

    const setUserOnline = async () => {
      try {
        const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', user.uid);
        
        // Check if user was kicked before setting online
        const presenceDoc = await getDoc(presenceRef);
        if (presenceDoc.exists() && presenceDoc.data().kicked) {
          console.log('User was kicked, not setting online');
          setWasKicked(true);
          return;
        }
        
        // Determine user role
        const role = canvasOwnerId === user.uid ? 'owner' : 'collaborator';
        setIsOwner(role === 'owner');

        // Use merge: true to preserve kicked field if it exists
        await setDoc(presenceRef, {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userEmail: user.email,
          photoURL: user.photoURL || null,
          role,
          online: true,
          kicked: false, // Explicitly set kicked to false when user joins
          lastSeen: serverTimestamp(),
        }, { merge: true });

        console.log('User presence set to online:', user.displayName);
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    };

    setUserOnline();

    // Set user offline on unmount
    return () => {
      const setUserOffline = async () => {
        try {
          const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', user.uid);
          await setDoc(presenceRef, {
            online: false,
            lastSeen: serverTimestamp(),
          }, { merge: true });
          console.log('User presence set to offline');
        } catch (error) {
          console.error('Error setting user offline:', error);
        }
      };

      setUserOffline();
    };
  }, [user, canvasOwnerId]);

  // Handle page close/refresh - set user offline
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = async () => {
      try {
        const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', user.uid);
        // Use keepalive to ensure request completes even if page is closing
        await setDoc(presenceRef, {
          online: false,
          lastSeen: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error('Error in beforeunload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, canvasOwnerId]);

  // Subscribe to presence collection
  useEffect(() => {
    if (!user) return;

    console.log('Setting up presence subscription...');

    const presenceRef = collection(db, 'canvases', CANVAS_ID, 'presence');
    
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const allUsers = [];
      let onlineUsers = 0;
      
      snapshot.forEach((doc) => {
        const userData = {
          userId: doc.id,
          ...doc.data(),
        };
        
        allUsers.push(userData);
        
        if (userData.online) {
          onlineUsers++;
        }
      });
      
      // Sort: owner first, then by name
      allUsers.sort((a, b) => {
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (a.role !== 'owner' && b.role === 'owner') return 1;
        return (a.userName || '').localeCompare(b.userName || '');
      });
      
      setUsers(allUsers);
      setOnlineCount(onlineUsers);
      console.log('Presence updated:', onlineUsers, 'online,', allUsers.length, 'total');
    }, (error) => {
      console.error('Error in presence subscription:', error);
    });

    return () => {
      console.log('Cleaning up presence subscription...');
      unsubscribe();
    };
  }, [user]);

  // Listen to own presence document to detect if kicked
  useEffect(() => {
    if (!user) return;

    const myPresenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', user.uid);
    
    const unsubscribe = onSnapshot(myPresenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Check if we've been kicked
        if (data.kicked && data.online === false) {
          console.log('User was kicked from canvas');
          setWasKicked(true);
          
          // Sign out after a short delay to show message
          setTimeout(() => {
            signOut();
          }, 3000);
        }
      }
    }, (error) => {
      console.error('Error listening to own presence:', error);
    });

    return () => unsubscribe();
  }, [user, signOut]);

  /**
   * Kick a user from the canvas (owner only)
   * 
   * @param {string} userId - User ID to kick
   */
  const kickUser = async (userId) => {
    if (!isOwner) {
      console.warn('Only owner can kick users');
      return;
    }
    
    if (userId === user?.uid) {
      console.warn('Cannot kick yourself');
      return;
    }
    
    try {
      await kickUserFromFirestore(userId);
      console.log('Successfully kicked user:', userId);
    } catch (error) {
      console.error('Failed to kick user:', error);
      throw error;
    }
  };

  return {
    users,
    onlineCount,
    isOwner,
    wasKicked,
    kickUser,
  };
}

