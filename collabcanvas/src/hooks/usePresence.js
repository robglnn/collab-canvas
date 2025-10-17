import { useState, useEffect } from 'react';
import {
  ref,
  onValue,
  set,
  onDisconnect,
  off,
} from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from './useAuth';

const CANVAS_ID = 'main';

/**
 * Custom hook for user presence tracking via RTDB
 * Manages current user's online status and subscribes to all users' presence
 * Uses Firebase Realtime Database with automatic disconnect detection
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

  // Set current user as online when component mounts with auto-disconnect
  useEffect(() => {
    if (!user) return;

    const setUserOnline = async () => {
      try {
        const presenceRef = ref(database, `presence/${CANVAS_ID}/${user.uid}`);
        
        // Check if user was kicked before setting online
        const snapshot = await new Promise((resolve, reject) => {
          onValue(presenceRef, resolve, reject, { onlyOnce: true });
        });
        
        if (snapshot.exists() && snapshot.val().kicked) {
          console.log('[RTDB] User was kicked, not setting online');
          setWasKicked(true);
          return;
        }
        
        // Determine user role
        const role = canvasOwnerId === user.uid ? 'owner' : 'collaborator';
        setIsOwner(role === 'owner');

        const now = Date.now();
        const presenceData = {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userEmail: user.email,
          photoURL: user.photoURL || null,
          role,
          online: true,
          kicked: false,
          lastSeen: now,
        };

        // Set up auto-disconnect: mark user offline when connection drops
        await onDisconnect(presenceRef).set({
          ...presenceData,
          online: false,
          lastSeen: now,
        });

        // Set user online
        await set(presenceRef, presenceData);

        console.log('[RTDB] User presence set to online with auto-disconnect:', user.displayName);
      } catch (error) {
        console.error('[RTDB] Error setting user online:', error);
      }
    };

    setUserOnline();

    // Cleanup on unmount
    return () => {
      const presenceRef = ref(database, `presence/${CANVAS_ID}/${user.uid}`);
      
      // Set offline on unmount (onDisconnect already handles network drops)
      set(presenceRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email,
        photoURL: user.photoURL || null,
        role: canvasOwnerId === user.uid ? 'owner' : 'collaborator',
        online: false,
        kicked: false,
        lastSeen: Date.now(),
      }).catch(err => {
        console.error('[RTDB] Error setting user offline on unmount:', err);
      });
    };
  }, [user, canvasOwnerId]);

  // Handle page close/refresh - RTDB onDisconnect handles this automatically
  // No beforeunload listener needed - onDisconnect() does the work for us!

  // Subscribe to presence in RTDB
  useEffect(() => {
    if (!user) return;

    console.log('[RTDB] Setting up presence subscription...');

    const presenceRef = ref(database, `presence/${CANVAS_ID}`);
    
    const handlePresenceUpdate = (snapshot) => {
      const allUsers = [];
      let onlineUsers = 0;
      const presenceData = snapshot.val();
      
      if (presenceData) {
        Object.entries(presenceData).forEach(([userId, userData]) => {
          const user = {
            userId,
            ...userData,
          };
          
          allUsers.push(user);
          
          if (userData.online) {
            onlineUsers++;
          }
        });
      }
      
      // Sort: owner first, then by name
      allUsers.sort((a, b) => {
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (a.role !== 'owner' && b.role === 'owner') return 1;
        return (a.userName || '').localeCompare(b.userName || '');
      });
      
      setUsers(allUsers);
      setOnlineCount(onlineUsers);
      console.log('[RTDB] Presence updated:', onlineUsers, 'online,', allUsers.length, 'total');
    };
    
    onValue(presenceRef, handlePresenceUpdate, (error) => {
      console.error('[RTDB] Error in presence subscription:', error);
    });

    return () => {
      console.log('[RTDB] Cleaning up presence subscription...');
      off(presenceRef, 'value', handlePresenceUpdate);
    };
  }, [user]);

  // Listen to own presence document to detect if kicked
  useEffect(() => {
    if (!user) return;

    const myPresenceRef = ref(database, `presence/${CANVAS_ID}/${user.uid}`);
    
    const handleMyPresenceUpdate = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Check if we've been kicked
        if (data.kicked && data.online === false) {
          console.log('[RTDB] User was kicked from canvas');
          setWasKicked(true);
          
          // Sign out after a short delay to show message
          setTimeout(() => {
            signOut();
          }, 3000);
        }
      }
    };
    
    onValue(myPresenceRef, handleMyPresenceUpdate, (error) => {
      console.error('[RTDB] Error listening to own presence:', error);
    });

    return () => {
      off(myPresenceRef, 'value', handleMyPresenceUpdate);
    };
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
      const userPresenceRef = ref(database, `presence/${CANVAS_ID}/${userId}`);
      
      // Get current user data
      const snapshot = await new Promise((resolve, reject) => {
        onValue(userPresenceRef, resolve, reject, { onlyOnce: true });
      });
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // Update presence to mark as kicked and offline
        await set(userPresenceRef, {
          ...userData,
          online: false,
          kicked: true,
          lastSeen: Date.now(),
        });
        
        console.log('[RTDB] Successfully kicked user:', userId);
      }
    } catch (error) {
      console.error('[RTDB] Failed to kick user:', error);
      throw error;
    }
  };

  /**
   * Set user offline before signout (for explicit sign-out button)
   * Call this BEFORE signOut() to ensure presence is updated
   */
  const setUserOfflineBeforeSignout = async () => {
    if (!user) return;
    
    try {
      const presenceRef = ref(database, `presence/${CANVAS_ID}/${user.uid}`);
      
      // Get current user data
      const snapshot = await new Promise((resolve, reject) => {
        onValue(presenceRef, resolve, reject, { onlyOnce: true });
      });
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        await set(presenceRef, {
          ...userData,
          online: false,
          lastSeen: Date.now(),
        });
      }
      
      console.log('[RTDB] User explicitly set to offline before signout');
    } catch (error) {
      console.error('[RTDB] Error setting user offline before signout:', error);
    }
  };

  return {
    users,
    onlineCount,
    isOwner,
    wasKicked,
    kickUser,
    setUserOfflineBeforeSignout,
  };
}

