import { useState } from 'react';
import './Toolbar.css';

/**
 * Toolbar component with shape creation buttons
 * Currently supports: Rectangle (more shapes can be added later)
 * 
 * @param {Function} onCreateShape - Callback when shape creation is requested
 */
export default function Toolbar({ onCreateShape }) {
  const [isPlaceMode, setIsPlaceMode] = useState(false);

  /**
   * Handle rectangle button click
   * Enters "place mode" where user clicks on canvas to place shape
   */
  const handleRectangleClick = () => {
    setIsPlaceMode(true);
    onCreateShape('rectangle');
    console.log('Place mode activated: rectangle');
  };

  /**
   * Exit place mode (called from Canvas component after placing shape)
   */
  const exitPlaceMode = () => {
    setIsPlaceMode(false);
    console.log('Place mode deactivated');
  };

  // Expose exitPlaceMode to parent component
  // This is a bit of a hack - we'll use a ref or context in a real app
  if (typeof window !== 'undefined') {
    window.exitPlaceMode = exitPlaceMode;
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Tools</h3>
        
        <button
          className={`toolbar-btn ${isPlaceMode ? 'active' : ''}`}
          onClick={handleRectangleClick}
          title="Click to place rectangle (100x100px)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="2" rx="1"/>
          </svg>
          <span>Rectangle</span>
        </button>
      </div>

      {isPlaceMode && (
        <div className="toolbar-hint">
          Click on canvas to place rectangle
        </div>
      )}
    </div>
  );
}

