import { useState, useEffect, useMemo } from 'react';
import Auth from './components/Auth';
import Canvas from './components/Canvas';
import UserList from './components/UserList';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useCursors } from './hooks/useCursors';
import { getCanvasOwner } from './lib/firestoreService';
import './App.css';

function App() {
  const { user } = useAuth();
  const [ownerId, setOwnerId] = useState(null);

  // Get canvas owner ID
  useEffect(() => {
    if (!user) return;

    const fetchOwner = async () => {
      try {
        const owner = await getCanvasOwner();
        setOwnerId(owner);
      } catch (error) {
        console.error('Error fetching owner:', error);
      }
    };

    fetchOwner();
  }, [user]);

  // Use presence hook to track users
  const { users, onlineCount, isOwner, wasKicked, kickUser, setUserOfflineBeforeSignout } = usePresence(ownerId);
  
  // Use cursors hook to get removeCursor function for cleanup
  // Memoize onlineUserIds to prevent infinite loop in useCursors dependency array
  const onlineUserIds = useMemo(() => users.filter(u => u.online).map(u => u.userId), [users]);
  const { removeCursor } = useCursors(onlineUserIds);
  
  // Combined cleanup before signout
  const handleBeforeSignOut = async () => {
    await setUserOfflineBeforeSignout(); // Set presence offline
    await removeCursor(); // Remove cursor
  };

  // Handle canvas download
  const handleDownloadCanvas = (format) => {
    if (typeof window !== 'undefined' && window.downloadCanvas) {
      window.downloadCanvas(format);
    }
  };

  // Show kicked message if user was removed
  if (wasKicked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#fee2e2',
      }}>
        <div style={{
          fontSize: '48px',
        }}>🚫</div>
        <h2 style={{ margin: 0, color: '#991b1b' }}>You have been removed from the canvas</h2>
        <p style={{ color: '#7f1d1d' }}>The owner has removed you from this collaboration session.</p>
        <p style={{ fontSize: '14px', color: '#991b1b' }}>Signing you out...</p>
      </div>
    );
  }

  return (
    <Auth 
      onBeforeSignOut={handleBeforeSignOut}
      onDownloadCanvas={handleDownloadCanvas}
      usersButton={user && (
        <UserList 
          users={users} 
          onlineCount={onlineCount} 
          currentUserId={user.uid}
          isOwner={isOwner}
          onKickUser={kickUser}
        />
      )}
    >
      <Canvas />
    </Auth>
  );
}

export default App;
