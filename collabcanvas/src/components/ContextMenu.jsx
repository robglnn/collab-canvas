import { useEffect, useRef } from 'react';
import './ContextMenu.css';

/**
 * ContextMenu component - Right-click menu for shapes
 * Shows options based on user permissions and shape state
 * 
 * @param {Object} props - Component props
 * @param {number} x - X position of menu
 * @param {number} y - Y position of menu
 * @param {Object} shape - Shape object being right-clicked
 * @param {boolean} isOwner - Whether current user is canvas owner
 * @param {string} currentUserId - Current user's ID
 * @param {Function} onOverride - Callback for override control action
 * @param {Function} onClose - Callback to close menu
 */
export default function ContextMenu({ x, y, shape, isOwner, currentUserId, onOverride, onClose }) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Check if shape is locked by someone else
  const isLockedByOther = shape.lockedBy && shape.lockedBy !== currentUserId;
  
  // Only show override option for owner when shape is locked by collaborator
  const showOverrideOption = isOwner && isLockedByOther;

  if (!showOverrideOption) {
    // No actions available, don't show menu
    onClose();
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="context-menu-item" onClick={() => {
        onOverride(shape.id);
        onClose();
      }}>
        <span className="context-menu-icon">👑</span>
        <span>Override Control</span>
      </div>
      
      <div className="context-menu-info">
        Owner can take control of this shape
      </div>
    </div>
  );
}

