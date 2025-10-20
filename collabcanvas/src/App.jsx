import { useState, useEffect, useMemo } from 'react';
import Auth from './components/Auth';
import Canvas from './components/Canvas';
import FilesPage from './components/FilesPage';
import PermissionDeniedBanner from './components/PermissionDeniedBanner';
import UserList from './components/UserList';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useCursors } from './hooks/useCursors';
import { 
  checkCanvasPermission, 
  getCanvasIdByInviteToken, 
  addCanvasCollaborator,
  getCanvasMetadata 
} from './lib/firestoreService';
import './App.css';

function App() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('files'); // 'files' or 'canvas'
  const [currentCanvasId, setCurrentCanvasId] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [canvasMetadata, setCanvasMetadata] = useState(null);

  // Handle invite token from URL
  useEffect(() => {
    if (!user) return;

    const handleInviteToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite');

      if (inviteToken) {
        try {
          const canvasId = await getCanvasIdByInviteToken(inviteToken);
          
          if (canvasId) {
            // Add user to canvas collaborators
            await addCanvasCollaborator(canvasId, user.email);
            
            // Navigate to canvas
            setCurrentCanvasId(canvasId);
            setCurrentPage('canvas');
            
            // Clear invite token from URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Error handling invite token:', error);
        }
      }
    };

    handleInviteToken();
  }, [user]);

  // Get canvas metadata when canvas is selected
  useEffect(() => {
    if (!user || !currentCanvasId) return;

    const fetchCanvasMetadata = async () => {
      try {
        const metadata = await getCanvasMetadata(currentCanvasId);
        if (metadata) {
          setCanvasMetadata(metadata);
          setOwnerId(metadata.ownerId);
        }
      } catch (error) {
        console.error('Error fetching canvas metadata:', error);
      }
    };

    fetchCanvasMetadata();
  }, [user, currentCanvasId]);

  // Use presence hook to track users (only when on canvas page)
  const { users, onlineCount, isOwner, wasKicked, kickUser, setUserOfflineBeforeSignout } = usePresence(
    currentPage === 'canvas' ? ownerId : null
  );
  
  // Use cursors hook to get removeCursor function for cleanup
  // Memoize onlineUserIds to prevent infinite loop in useCursors dependency array
  const onlineUserIds = useMemo(() => users.filter(u => u.online).map(u => u.userId), [users]);
  const { removeCursor } = useCursors(onlineUserIds);
  
  // Combined cleanup before signout
  const handleBeforeSignOut = async () => {
    await setUserOfflineBeforeSignout(); // Set presence offline
    await removeCursor(); // Remove cursor
  };

  // Handle canvas selection from Files page
  const handleSelectCanvas = async (canvasId) => {
    try {
      // Check permissions
      const hasPermission = await checkCanvasPermission(canvasId, user.uid, user.email);
      
      if (!hasPermission) {
        setPermissionDenied(true);
        return;
      }

      setCurrentCanvasId(canvasId);
      setCurrentPage('canvas');
      setPermissionDenied(false);
    } catch (error) {
      console.error('Error selecting canvas:', error);
      setPermissionDenied(true);
    }
  };

  // Handle navigation to Files page
  const handleGoToFiles = () => {
    setCurrentPage('files');
    setCurrentCanvasId(null);
    setPermissionDenied(false);
  };

  // Handle navigation to Canvas page (from nav menu)
  const handleGoToCanvas = () => {
    if (currentPage === 'canvas') return; // Already on canvas
    
    if (currentCanvasId) {
      setCurrentPage('canvas');
    }
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

  // Show permission denied banner
  if (permissionDenied) {
    return (
      <Auth 
        onBeforeSignOut={handleBeforeSignOut}
        onDownloadCanvas={handleDownloadCanvas}
        currentPage={currentPage}
        onNavigateToFiles={handleGoToFiles}
        onNavigateToCanvas={handleGoToCanvas}
      >
        <PermissionDeniedBanner onGoToFiles={handleGoToFiles} />
      </Auth>
    );
  }

  return (
    <Auth 
      onBeforeSignOut={handleBeforeSignOut}
      onDownloadCanvas={handleDownloadCanvas}
      currentPage={currentPage}
      onNavigateToFiles={handleGoToFiles}
      onNavigateToCanvas={handleGoToCanvas}
      usersButton={user && currentPage === 'canvas' && (
        <UserList 
          users={users} 
          onlineCount={onlineCount} 
          currentUserId={user.uid}
          isOwner={isOwner}
          onKickUser={kickUser}
          inviteToken={canvasMetadata?.inviteToken}
        />
      )}
    >
      {currentPage === 'files' ? (
        <FilesPage user={user} onSelectCanvas={handleSelectCanvas} />
      ) : (
        <Canvas canvasId={currentCanvasId} />
      )}
    </Auth>
  );
}

export default App;
