import { useState, useRef, useEffect } from 'react';
import './UserList.css';

/**
 * UserList component - Display online users in top bar dropdown
 * Shows user avatars, names, roles for online users only
 * Owner can remove collaborators
 * 
 * @param {Array} users - Array of user presence objects
 * @param {number} onlineCount - Count of currently online users
 * @param {string} currentUserId - Current user's ID to highlight them
 * @param {boolean} isOwner - Whether current user is the owner
 * @param {Function} onKickUser - Callback to kick a user
 * @param {string} inviteToken - Canvas invite token for sharing
 */
export default function UserList({ users, onlineCount, currentUserId, isOwner, onKickUser, inviteToken }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  // Filter to show only online users
  const onlineUsers = users.filter(user => user.online);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCopyInviteLink = (e) => {
    e.stopPropagation();
    if (!inviteToken) return;
    
    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="users-online-container" ref={dropdownRef}>
      {/* Users button */}
      <button 
        className="users-online-button"
        onClick={toggleDropdown}
        title="View online users"
      >
        <span className="users-icon">👥</span>
        <span className="users-count">{onlineCount}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="users-dropdown">
          <div className="users-dropdown-header">
            <div className="users-header-left">
              <span>Online Users</span>
              <span className="users-dropdown-count">{onlineCount}</span>
            </div>
            {inviteToken && (
              <button 
                className="copy-invite-btn"
                onClick={handleCopyInviteLink}
                title={copied ? "Copied!" : "Copy invite link"}
              >
                {copied ? '✓' : '🔗'}
              </button>
            )}
          </div>

          <div className="users-dropdown-items">
            {onlineUsers.map((user) => (
              <div
                key={user.userId}
                className={`user-dropdown-item ${
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
                  <div className="online-indicator" />
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onKickUser(user.userId);
                    }}
                    title="Remove user from canvas"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {onlineUsers.length === 0 && (
              <div className="no-users">
                No users online
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

