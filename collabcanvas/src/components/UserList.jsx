import './UserList.css';

/**
 * UserList component - Display online users in sidebar
 * Shows user avatars, names, roles, and online status
 * Owner can remove collaborators
 * 
 * @param {Array} users - Array of user presence objects
 * @param {number} onlineCount - Count of currently online users
 * @param {string} currentUserId - Current user's ID to highlight them
 * @param {boolean} isOwner - Whether current user is the owner
 * @param {Function} onKickUser - Callback to kick a user
 */
export default function UserList({ users, onlineCount, currentUserId, isOwner, onKickUser }) {
  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Users</h3>
        <span className="user-count">
          {onlineCount} online
        </span>
      </div>

      <div className="user-list-items">
        {users.map((user) => (
          <div
            key={user.userId}
            className={`user-item ${!user.online ? 'offline' : ''} ${
              user.userId === currentUserId ? 'current-user' : ''
            }`}
          >
            {/* User avatar */}
            <div className="user-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.userName} />
              ) : (
                <div className="user-avatar-placeholder">
                  {(user.userName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Online indicator */}
              {user.online && <div className="online-indicator" />}
            </div>

            {/* User info */}
            <div className="user-info">
              <div className="user-name">
                {user.userName || 'Anonymous'}
                {user.userId === currentUserId && ' (you)'}
              </div>
              
              {/* Role badge */}
              <div className={`user-role ${user.role}`}>
                {user.role === 'owner' ? '👑 Owner' : 'Collaborator'}
              </div>
            </div>

            {/* Remove button (owner only, not for self or other owner) */}
            {isOwner && user.userId !== currentUserId && user.role !== 'owner' && (
              <button
                className="remove-user-btn"
                onClick={() => onKickUser(user.userId)}
                title="Remove user from canvas"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <div className="no-users">
            No users yet
          </div>
        )}
      </div>
    </div>
  );
}

