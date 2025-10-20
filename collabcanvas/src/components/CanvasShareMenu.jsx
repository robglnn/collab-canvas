import { useState } from 'react';
import { addCanvasCollaborator, removeCanvasCollaborator } from '../lib/firestoreService';
import './CanvasShareMenu.css';

/**
 * Canvas share menu - Manage collaborators and invite links
 */
export default function CanvasShareMenu({ canvas, onClose, onUpdate }) {
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${canvas.inviteToken}`;

  const handleAddCollaborator = async () => {
    if (!newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setAdding(true);
      setError('');
      await addCanvasCollaborator(canvas.id, newEmail.trim());
      setNewEmail('');
      onUpdate();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setError('Failed to add collaborator');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (email) => {
    try {
      await removeCanvasCollaborator(canvas.id, email);
      onUpdate();
    } catch (error) {
      console.error('Error removing collaborator:', error);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-menu-overlay" onClick={onClose}>
      <div className="share-menu" onClick={(e) => e.stopPropagation()}>
        <div className="share-menu-header">
          <h3>Share Canvas</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="share-menu-content">
          {/* Invite Link Section */}
          <div className="invite-link-section">
            <label>Invite Link</label>
            <div className="invite-link-container">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="invite-link-input"
              />
              <button
                className="copy-link-btn"
                onClick={handleCopyInviteLink}
                title="Copy invite link"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
            {copied && <div className="copied-message">Link copied!</div>}
          </div>

          {/* Add Collaborator Section */}
          <div className="add-collaborator-section">
            <label>Add Collaborator by Email</label>
            <div className="add-collaborator-form">
              <input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCollaborator();
                }}
                disabled={adding}
              />
              <button
                className="add-btn"
                onClick={handleAddCollaborator}
                disabled={adding || !newEmail.trim()}
              >
                {adding ? '...' : 'Add'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>

          {/* Collaborators List */}
          <div className="collaborators-section">
            <label>
              Collaborators ({canvas.sharedWith?.length || 0})
            </label>
            {canvas.sharedWith && canvas.sharedWith.length > 0 ? (
              <div className="collaborators-list">
                {canvas.sharedWith.map((email) => (
                  <div key={email} className="collaborator-item">
                    <span className="collaborator-email">{email}</span>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveCollaborator(email)}
                      title="Remove access"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-collaborators">
                No collaborators yet. Share the invite link or add by email.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

