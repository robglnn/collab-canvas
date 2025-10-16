import { useState } from 'react';
import './Toolbar.css';

/**
 * Toolbar component with shape creation buttons
 * Currently supports: Rectangle, Circle, Text
 * Also includes AI Command Bar as children
 * 
 * @param {Function} onCreateShape - Callback when shape creation is requested
 * @param {ReactNode} children - Optional children (e.g., AI Command Bar)
 */
export default function Toolbar({ onCreateShape, children }) {
  const [isPlaceMode, setIsPlaceMode] = useState(false);
  const [activeShape, setActiveShape] = useState(null);

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
      </div>

      {isPlaceMode && (
        <div className="toolbar-hint">
          Click on canvas to place {activeShape}
        </div>
      )}
    </div>
  );
}

