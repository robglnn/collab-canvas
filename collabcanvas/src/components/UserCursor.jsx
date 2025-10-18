import { memo } from 'react';
import { getUserColor } from '../lib/canvasUtils';
import './UserCursor.css';

/**
 * UserCursor component - Renders a remote user's cursor with name label
 * Now renders as regular HTML outside Konva canvas to avoid Html component issues
 * Optimized with React.memo to prevent unnecessary re-renders
 * 
 * @param {Object} cursor - Cursor data (userId, userName, x, y, photoURL)
 */
function UserCursor({ cursor }) {
  const color = getUserColor(cursor.userId);

  return (
    <div 
      className="user-cursor"
      style={{
        position: 'absolute',
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        pointerEvents: 'none',
        zIndex: 1000,
        transform: 'translate(0, 0)', // Force GPU acceleration
      }}
    >
      {/* Cursor pointer SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M5.65376 12.3673L8.84846 15.5619L12.9336 18.8003L13.0483 13.8192L19.1686 14.3841L5.65376 12.3673Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <div 
        className="user-cursor-label"
        style={{ 
          backgroundColor: color,
          borderColor: color,
        }}
      >
        {cursor.userName || 'Anonymous'}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
// Only re-render if cursor position or name changes
export default memo(UserCursor, (prevProps, nextProps) => {
  // Return TRUE if props are equal (skip re-render)
  // Return FALSE if props are different (do re-render)
  return (
    prevProps.cursor.userId === nextProps.cursor.userId &&
    prevProps.cursor.x === nextProps.cursor.x &&
    prevProps.cursor.y === nextProps.cursor.y &&
    prevProps.cursor.userName === nextProps.cursor.userName
  );
});

