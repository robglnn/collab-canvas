import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  // Set current user as online when component mounts
  useEffect(() => {
    if (!user) return;

    const setUserOnline = async () => {
      try {
        const presenceRef = doc(db, 'canvases', CANVAS_ID, 'presence', user.uid);
        
        // Determine user role
        const role = canvasOwnerId === user.uid ? 'owner' : 'collaborator';
        setIsOwner(role === 'owner');

        await setDoc(presenceRef, {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userEmail: user.email,
          photoURL: user.photoURL || null,
          role,
          online: true,
          lastSeen: serverTimestamp(),
        });

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
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userEmail: user.email,
            photoURL: user.photoURL || null,
            role: canvasOwnerId === user.uid ? 'owner' : 'collaborator',
            online: false,
            lastSeen: serverTimestamp(),
          });
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
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userEmail: user.email,
          photoURL: user.photoURL || null,
          role: canvasOwnerId === user.uid ? 'owner' : 'collaborator',
          online: false,
          lastSeen: serverTimestamp(),
        });
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

  return {
    users,
    onlineCount,
    isOwner,
  };
}

