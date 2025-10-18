import { useState } from 'react';
import './Toolbar.css';

/**
 * Toolbar component with shape creation buttons
 * Currently supports: Rectangle, Circle, Text, Line
 * Also includes AI Command Bar as children
 * 
 * @param {Function} onCreateShape - Callback when shape creation is requested
 * @param {Array} selectedShapes - Currently selected shapes
 * @param {Function} onUpdateLineWidth - Callback to update selected line's width
 * @param {Object} debugData - Debug information to display
 * @param {Boolean} isDebugExpanded - Whether debug panel is expanded
 * @param {Function} onToggleDebug - Callback to toggle debug panel
 * @param {ReactNode} children - Optional children (e.g., AI Command Bar)
 */
export default function Toolbar({ onCreateShape, selectedShapes = [], onUpdateLineWidth, debugData, isDebugExpanded, onToggleDebug, children }) {
  const [isPlaceMode, setIsPlaceMode] = useState(false);
  const [activeShape, setActiveShape] = useState(null);
  const [lineWidth, setLineWidth] = useState(3);
  const [tempLineWidth, setTempLineWidth] = useState(null); // Temporary width while dragging

  // Check if a single line is selected
  const selectedLine = selectedShapes.length === 1 && selectedShapes[0].type === 'line' ? selectedShapes[0] : null;

  // Get the current width to display
  const displayWidth = tempLineWidth !== null 
    ? tempLineWidth 
    : (selectedLine ? (selectedLine.strokeWidth || 3) : lineWidth);

  /**
   * Handle rectangle button click
   * Enters "place mode" where user clicks on canvas to place shape
   */
  const handleRectangleClick = () => {
    setIsPlaceMode(true);
    setActiveShape('rectangle');
    onCreateShape('rectangle');
    console.log('Place mode activated: rectangle');
  };

  /**
   * Handle circle button click
   * Enters "place mode" where user clicks on canvas to place shape
   */
  const handleCircleClick = () => {
    setIsPlaceMode(true);
    setActiveShape('circle');
    onCreateShape('circle');
    console.log('Place mode activated: circle');
  };

  /**
   * Handle text button click
   * Enters "place mode" where user clicks on canvas to place text
   */
  const handleTextClick = () => {
    setIsPlaceMode(true);
    setActiveShape('text');
    onCreateShape('text');
    console.log('Place mode activated: text');
  };

  /**
   * Handle line button click
   * Enters "place mode" where user clicks twice to create a line
   */
  const handleLineClick = () => {
    setIsPlaceMode(true);
    setActiveShape('line');
    onCreateShape('line', { lineWidth });
    console.log('Place mode activated: line');
  };

  /**
   * Exit place mode (called from Canvas component after placing shape)
   */
  const exitPlaceMode = () => {
    setIsPlaceMode(false);
    setActiveShape(null);
    console.log('Place mode deactivated');
  };

  // Expose exitPlaceMode to parent component
  // This is a bit of a hack - we'll use a ref or context in a real app
  if (typeof window !== 'undefined') {
    window.exitPlaceMode = exitPlaceMode;
  }

  return (
    <div className="toolbar">
      {/* AI Command Bar (passed as children) */}
      {children && (
        <div className="toolbar-section">
          {children}
        </div>
      )}
      
      <div className="toolbar-section">
        <h3 className="toolbar-title">Tools</h3>
        
        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'rectangle' ? 'active' : ''}`}
          onClick={handleRectangleClick}
          title="Click to place rectangle (100x100px)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="2" rx="1"/>
          </svg>
          <span>Rectangle</span>
        </button>

        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'circle' ? 'active' : ''}`}
          onClick={handleCircleClick}
          title="Click to place circle (100px diameter)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Circle</span>
        </button>

        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'text' ? 'active' : ''}`}
          onClick={handleTextClick}
          title="Click to place text (double-click to edit)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <text x="12" y="16" fontSize="14" textAnchor="middle" fill="currentColor" fontWeight="bold">T</text>
          </svg>
          <span>Text</span>
        </button>

        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'line' ? 'active' : ''}`}
          onClick={handleLineClick}
          title="Click twice to draw a line"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="18" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Line</span>
        </button>
      </div>

      {/* Line Width Controls - Show when creating line OR when line is selected */}
      {((isPlaceMode && activeShape === 'line') || selectedLine) && (
        <div className="toolbar-section">
          <h3 className="toolbar-title">Line Width</h3>
          <label className="toolbar-label">
            {displayWidth}px
            <input
              type="range"
              min="1"
              max="20"
              value={displayWidth}
              onInput={(e) => {
                // Update local state immediately for smooth dragging
                const newWidth = parseInt(e.target.value);
                setTempLineWidth(newWidth);
                
                // Send to RTDB for real-time sync to other users (sub-100ms)
                if (selectedLine && onLineWidthInput) {
                  onLineWidthInput(selectedLine.id, newWidth);
                }
              }}
              onChange={(e) => {
                const newWidth = parseInt(e.target.value);
                
                if (selectedLine) {
                  // Update selected line's width (writes to Firestore)
                  if (onUpdateLineWidth) {
                    onUpdateLineWidth(selectedLine.id, newWidth);
                  }
                  setTempLineWidth(null); // Clear temp value after update
                } else {
                  // Update line width for line creation mode
                  setLineWidth(newWidth);
                  if (typeof window !== 'undefined' && window.updateLineWidth) {
                    window.updateLineWidth(newWidth);
                  }
                }
              }}
              onMouseUp={() => {
                // Also clear temp value on mouse up
                if (tempLineWidth !== null && selectedLine) {
                  setTempLineWidth(null);
                }
              }}
              className="line-width-slider"
            />
          </label>
        </div>
      )}

      {isPlaceMode && (
        <div className="toolbar-hint">
          {activeShape === 'line' 
            ? 'Click twice on canvas to draw a line' 
            : `Click on canvas to place ${activeShape}`}
        </div>
      )}

      {/* Debug/Zoom button at bottom */}
      {debugData && (
        <div className="toolbar-debug-container">
          <button
            className={`toolbar-debug-btn ${isDebugExpanded ? 'expanded' : ''}`}
            onClick={onToggleDebug}
            title={isDebugExpanded ? 'Click to collapse' : 'Click to expand debug info'}
          >
            {isDebugExpanded ? (
              <div className="debug-expanded">
                <div className="debug-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Debug Info</span>
                </div>
                <div className="debug-content">
                  <div>Zoom: {(debugData.zoom * 100).toFixed(0)}%</div>
                  <div>Canvas Center: ({debugData.canvasCenter.x}, {debugData.canvasCenter.y})</div>
                  <div>Cursor: ({debugData.cursor.x}, {debugData.cursor.y})</div>
                  <div>Stage Offset: ({debugData.stageOffset.x}, {debugData.stageOffset.y})</div>
                  <div>Canvas: {debugData.canvasSize.width}x{debugData.canvasSize.height}px</div>
                  <div>Shapes: {debugData.shapesCount} | Cursors: {debugData.cursorsCount}</div>
                  <div>Role: {debugData.role}</div>
                  {debugData.selectedCount > 0 && <div>Selected: {debugData.selectedCount} shape(s)</div>}
                </div>
              </div>
            ) : (
              <div className="debug-compact">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{(debugData.zoom * 100).toFixed(0)}%</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

