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

