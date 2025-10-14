import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Canvas from './components/Canvas';
import UserList from './components/UserList';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
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
  const { users, onlineCount } = usePresence(ownerId);

  return (
    <Auth>
      <Canvas />
      {user && <UserList users={users} onlineCount={onlineCount} currentUserId={user.uid} />}
    </Auth>
  );
}

export default App;
