import { useState, useEffect, useRef } from 'react';
import { useComments } from '../hooks/useComments';
import { formatCommentTimestamp } from '../lib/canvasUtils';
import './CommentsSubmenu.css';

/**
 * CommentsSubmenu component - Submenu for viewing and managing comments on a shape
 * Opens from the context menu when "Comments" is clicked
 * 
 * @param {Object} props - Component props
 * @param {string} shapeId - ID of the shape to show comments for
 * @param {number} x - X position of parent context menu
 * @param {number} y - Y position of parent context menu
 * @param {Object} user - Current user object (uid, displayName)
 * @param {Function} onClose - Callback to close submenu and parent menu
 */
export default function CommentsSubmenu({ shapeId, x, y, user, onClose }) {
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(shapeId, user);
  
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const submenuRef = useRef(null);
  const inputRef = useRef(null);

  // Calculate submenu position (to the right of context menu, or left if no space)
  useEffect(() => {
    if (!submenuRef.current) return;

    const submenuRect = submenuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const contextMenuWidth = 200; // Approximate width of context menu

    let submenuX = x + contextMenuWidth + 8; // 8px gap
    let submenuY = y;

    // If submenu would go off screen on the right, position it on the left
    if (submenuX + submenuRect.width > viewportWidth) {
      submenuX = x - submenuRect.width - 8;
    }

    // Adjust vertical position if would go off bottom of screen
    if (submenuY + submenuRect.height > viewportHeight) {
      submenuY = Math.max(10, viewportHeight - submenuRect.height - 10);
    }

    // Ensure it doesn't go off top of screen
    submenuY = Math.max(10, submenuY);

    setSubmenuPosition({ x: submenuX, y: submenuY });
  }, [x, y, comments.length]);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (submenuRef.current && !submenuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      await addComment(newCommentText);
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment: ' + error.message);
    }
  };

  // Handle starting edit mode
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  // Handle saving edited comment
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      await updateComment(commentId, editText);
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment: ' + error.message);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId, true); // First delete (soft delete)
      setShowDeleteConfirm(null);
      // TODO: Integrate with undo/redo system in future task
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment: ' + error.message);
    }
  };

  const remainingChars = 100 - newCommentText.length;
  const editRemainingChars = editText ? 100 - editText.length : 100;

  return (
    <div
      ref={submenuRef}
      className="comments-submenu"
      style={{
        left: `${submenuPosition.x}px`,
        top: `${submenuPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="comments-submenu-header">
        <span className="comments-submenu-icon">💬</span>
        <span className="comments-submenu-title">Comments</span>
      </div>

      {/* Comments List */}
      <div className="comments-submenu-list">
        {loading && (
          <div className="comments-empty-state">Loading comments...</div>
        )}

        {!loading && comments.length === 0 && (
          <div className="comments-empty-state">No comments yet</div>
        )}

        {!loading && comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            {/* User initials badge */}
            <div className="comment-initials">{comment.userInitials}</div>

            <div className="comment-content">
              {/* Header: username and timestamp */}
              <div className="comment-header">
                <span className="comment-username">{comment.userName}</span>
                <span className="comment-timestamp">
                  {formatCommentTimestamp(comment.createdAt)}
                  {comment.updatedAt && comment.createdAt !== comment.updatedAt && (
                    <span className="comment-edited"> (edited)</span>
                  )}
                </span>
              </div>

              {/* Comment text or edit mode */}
              {editingCommentId === comment.id ? (
                <div className="comment-edit-mode">
                  <textarea
                    className="comment-edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value.slice(0, 100))}
                    maxLength={100}
                    rows={3}
                    autoFocus
                  />
                  <div className="comment-edit-actions">
                    <span className="comment-char-counter">{editRemainingChars} left</span>
                    <button
                      className="comment-edit-btn comment-save-btn"
                      onClick={() => handleSaveEdit(comment.id)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      className="comment-edit-btn comment-cancel-btn"
                      onClick={handleCancelEdit}
                      title="Cancel"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="comment-text">{comment.text}</div>

                  {/* Action buttons (only show if it's the current user's comment) */}
                  {user && comment.userId === user.uid && (
                    <div className="comment-actions">
                      <button
                        className="comment-action-btn"
                        onClick={() => handleStartEdit(comment)}
                        title="Edit comment"
                      >
                        ✏️
                      </button>
                      <button
                        className="comment-action-btn"
                        onClick={() => setShowDeleteConfirm(comment.id)}
                        title="Delete comment"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm === comment.id && (
              <div className="comment-delete-confirm">
                <p>Delete this comment?</p>
                <div className="comment-delete-actions">
                  <button
                    className="comment-delete-yes"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Yes
                  </button>
                  <button
                    className="comment-delete-no"
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add comment input */}
      <div className="comments-submenu-input">
        <textarea
          ref={inputRef}
          className="comment-input-textarea"
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value.slice(0, 100))}
          maxLength={100}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleAddComment();
            }
          }}
        />
        <div className="comment-input-footer">
          <span className="comment-char-counter">{remainingChars} left</span>
          <button
            className="comment-submit-btn"
            onClick={handleAddComment}
            disabled={!newCommentText.trim()}
            title="Submit comment (Ctrl+Enter)"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}

