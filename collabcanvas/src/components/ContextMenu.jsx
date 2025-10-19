import { useState, useEffect, useRef } from 'react';
import CommentsSubmenu from './CommentsSubmenu';
import './ContextMenu.css';

/**
 * ContextMenu component - Right-click menu for shapes and canvas
 * Shows options based on user permissions, shape state, and context
 * 
 * @param {Object} props - Component props
 * @param {number} x - X position of menu
 * @param {number} y - Y position of menu
 * @param {Object} shape - Shape object being right-clicked (null for canvas)
 * @param {boolean} isOwner - Whether current user is canvas owner
 * @param {string} currentUserId - Current user's ID
 * @param {Object} user - Current user object (uid, displayName)
 * @param {Function} onOverride - Callback for override control action
 * @param {Function} onCopy - Callback for copy action
 * @param {Function} onPaste - Callback for paste action
 * @param {Function} onDuplicate - Callback for duplicate action
 * @param {boolean} hasClipboardData - Whether clipboard has data to paste
 * @param {Function} onBringToFront - Callback for bring to front action
 * @param {Function} onSendToBack - Callback for send to back action
 * @param {Function} onClose - Callback to close menu
 */
export default function ContextMenu({ 
  x, 
  y, 
  shape, 
  isOwner, 
  currentUserId,
  user,
  onOverride, 
  onCopy,
  onPaste,
  onDuplicate,
  hasClipboardData,
  onBringToFront,
  onSendToBack,
  onClose 
}) {
  const menuRef = useRef(null);
  const [showCommentsSubmenu, setShowCommentsSubmenu] = useState(false);

  // Close menu when clicking outside (but not if clicking on submenu)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // Don't close if clicking on submenu
        if (!e.target.closest('.comments-submenu')) {
          onClose();
        }
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

  // If shape is provided, show shape-specific menu
  if (shape) {
    // Check if shape is locked by someone else
    const isLockedByOther = shape.lockedBy && shape.lockedBy !== currentUserId;
    
    // Show override option for owner when shape is locked by collaborator
    const showOverrideOption = isOwner && isLockedByOther;

    // If comments submenu is open, only show that
    if (showCommentsSubmenu) {
      return (
        <CommentsSubmenu
          shapeId={shape.id}
          x={x}
          y={y}
          user={user}
          onClose={() => {
            setShowCommentsSubmenu(false);
            onClose();
          }}
        />
      );
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
        {/* Copy option - always available for shapes */}
        <div className="context-menu-item" onClick={() => {
          onCopy();
          onClose();
        }}>
          <span>Copy</span>
          <span className="context-menu-shortcut">Ctrl+C</span>
        </div>

        {/* Duplicate option - always available for shapes */}
        <div className="context-menu-item" onClick={() => {
          onDuplicate();
          onClose();
        }}>
          <span>Duplicate</span>
          <span className="context-menu-shortcut">Ctrl+D</span>
        </div>

        {/* Comments option - opens submenu */}
        <div className="context-menu-item" onClick={() => {
          setShowCommentsSubmenu(true);
        }}>
          <span>Comments</span>
        </div>

        <div className="context-menu-divider"></div>

        {/* Bring to Front option */}
        <div className="context-menu-item" onClick={() => {
          onBringToFront([shape.id]);
          onClose();
        }}>
          <span>Bring to Front</span>
        </div>

        {/* Send to Back option */}
        <div className="context-menu-item" onClick={() => {
          onSendToBack([shape.id]);
          onClose();
        }}>
          <span>Send to Back</span>
        </div>

        {/* Override option - only for owner when shape is locked */}
        {showOverrideOption && (
          <>
            <div className="context-menu-divider"></div>
            <div className="context-menu-item" onClick={() => {
              onOverride(shape.id);
              onClose();
            }}>
              <span>Override Control</span>
            </div>
            <div className="context-menu-info">
              Take control of this locked shape
            </div>
          </>
        )}
      </div>
    );
  }

  // Canvas menu (no shape) - show paste if clipboard has data
  if (hasClipboardData) {
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
          onPaste();
          onClose();
        }}>
          <span>Paste</span>
          <span className="context-menu-shortcut">Ctrl+V</span>
        </div>
      </div>
    );
  }

  // No actions available, don't show menu
  onClose();
  return null;
}

