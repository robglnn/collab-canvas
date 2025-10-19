/**
 * Canvas utility functions for coordinate calculations and transformations
 */

/**
 * Convert screen coordinates to canvas coordinates
 * Takes into account the current viewport position and scale
 * 
 * @param {Object} screenPos - Screen position {x, y}
 * @param {Object} stage - Konva stage reference
 * @returns {Object} Canvas position {x, y}
 */
export function screenToCanvas(screenPos, stage) {
  const scale = stage.scaleX();
  const stagePos = stage.position();

  return {
    x: (screenPos.x - stagePos.x) / scale,
    y: (screenPos.y - stagePos.y) / scale,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 * Takes into account the current viewport position and scale
 * 
 * @param {Object} canvasPos - Canvas position {x, y}
 * @param {Object} stage - Konva stage reference
 * @returns {Object} Screen position {x, y}
 */
export function canvasToScreen(canvasPos, stage) {
  const scale = stage.scaleX();
  const stagePos = stage.position();

  return {
    x: canvasPos.x * scale + stagePos.x,
    y: canvasPos.y * scale + stagePos.y,
  };
}

/**
 * Clamp zoom level to min/max range
 * 
 * @param {number} scale - Desired scale value
 * @param {number} min - Minimum scale (default: 0.1)
 * @param {number} max - Maximum scale (default: 5)
 * @returns {number} Clamped scale value
 */
export function clampZoom(scale, min = 0.1, max = 5) {
  return Math.max(min, Math.min(max, scale));
}

/**
 * Clamp viewport position to stay within canvas boundaries
 * 
 * @param {Object} pos - Position {x, y}
 * @param {number} scale - Current scale
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {number} canvasHeight - Canvas height in pixels
 * @param {number} containerWidth - Container width in pixels
 * @param {number} containerHeight - Container height in pixels
 * @returns {Object} Clamped position {x, y}
 */
export function clampPosition(
  pos,
  scale,
  canvasWidth,
  canvasHeight,
  containerWidth,
  containerHeight
) {
  // Calculate the visible canvas bounds
  const maxX = 0;
  const minX = -(canvasWidth * scale - containerWidth);
  const maxY = 0;
  const minY = -(canvasHeight * scale - containerHeight);

  return {
    x: Math.max(minX, Math.min(maxX, pos.x)),
    y: Math.max(minY, Math.min(maxY, pos.y)),
  };
}

/**
 * Calculate zoom towards a specific point (usually the cursor)
 * 
 * @param {Object} pointer - Pointer position {x, y}
 * @param {Object} stage - Konva stage reference
 * @param {number} newScale - New scale value
 * @returns {Object} New stage position {x, y}
 */
export function zoomToPoint(pointer, stage, newScale) {
  const oldScale = stage.scaleX();
  const stagePos = stage.position();

  const mousePointTo = {
    x: (pointer.x - stagePos.x) / oldScale,
    y: (pointer.y - stagePos.y) / oldScale,
  };

  return {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
}

/**
 * Generate a random color for user identification
 * 
 * @param {string} userId - User ID to generate color from
 * @returns {string} Hex color string
 */
export function getUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  ];
  
  // Simple hash function to get consistent color per user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Format Firestore timestamp for comment display
 * Format: "YY Month Day hh:mm:ss" (24-hour time)
 * Example: "24 Oct 19 14:32:15"
 * 
 * @param {Object} timestamp - Firestore timestamp object
 * @returns {string} Formatted timestamp string
 */
export function formatCommentTimestamp(timestamp) {
  if (!timestamp) return '';
  
  try {
    // Convert Firestore timestamp to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const year = String(date.getFullYear()).slice(-2);
    const month = date.toLocaleString('en', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year} ${month} ${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
}

/**
 * Extract user initials from display name
 * Format: First letter of first name + first letter of last name
 * Examples: "John Doe" → "JD", "Alice" → "A", "Bob Smith Jones" → "BS"
 * 
 * @param {string} userName - User's display name
 * @returns {string} User initials (e.g., "JD")
 */
export function extractUserInitials(userName) {
  if (!userName) return '?';
  
  const words = userName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || '?';
  }
  
  return (words[0][0] + words[1][0]).toUpperCase();
}

