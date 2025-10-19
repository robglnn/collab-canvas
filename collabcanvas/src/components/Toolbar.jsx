import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserPreferences } from '../hooks/useUserPreferences';
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
export default function Toolbar({ onCreateShape, selectedShapes = [], onUpdateLineWidth, onLineWidthInput, debugData, isDebugExpanded, onToggleDebug, children }) {
  const { user } = useAuth();
  const { customColors, saveCustomColor, loading: prefsLoading } = useUserPreferences(user?.uid);

  const [isPlaceMode, setIsPlaceMode] = useState(false);
  const [activeShape, setActiveShape] = useState(null);
  const [lineWidth, setLineWidth] = useState(3);
  const [tempLineWidth, setTempLineWidth] = useState(null); // Temporary width while dragging

  // Text formatting state
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Color picker state
  const [selectedColor, setSelectedColor] = useState('#000000'); // Default black
  const [hexInput, setHexInput] = useState('#000000');
  const [hexError, setHexError] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isAIBarOpen, setIsAIBarOpen] = useState(false);

  // Default color palette (10 colors)
  const defaultColors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFFFFF', // White
  ];

  // Check if a single line is selected
  const selectedLine = selectedShapes.length === 1 && selectedShapes[0].type === 'line' ? selectedShapes[0] : null;

  // Check if text shapes are selected
  const selectedTextShapes = selectedShapes.filter(s => s.type === 'text');
  const hasTextSelected = selectedTextShapes.length > 0;

  // Get the current width to display
  const displayWidth = tempLineWidth !== null 
    ? tempLineWidth 
    : (selectedLine ? (selectedLine.strokeWidth || 3) : lineWidth);

  /**
   * Unified tool selection handler with toggle support
   * If tool is already active, deselects it. Otherwise activates it.
   * 
   * @param {string} toolType - Type of tool to select ('rectangle', 'circle', 'text', 'line')
   * @param {Object} options - Optional configuration for the tool (e.g., text formatting, line width)
   */
  const handleToolSelect = (toolType, options = {}) => {
    if (isPlaceMode && activeShape === toolType) {
      // Tool is already active - deselect/exit place mode
      exitPlaceMode();
      console.log(`Place mode deactivated: ${toolType}`);
    } else {
      // Activate the tool
      setIsPlaceMode(true);
      setActiveShape(toolType);
      onCreateShape(toolType, options);
      console.log(`Place mode activated: ${toolType}`);
    }
  };

  /**
   * Handle rectangle button click - toggle rectangle tool
   */
  const handleRectangleClick = () => handleToolSelect('rectangle');

  /**
   * Handle circle button click - toggle circle tool
   */
  const handleCircleClick = () => handleToolSelect('circle');

  /**
   * Handle text button click - toggle text tool
   */
  const handleTextClick = () => handleToolSelect('text', { fontFamily, isBold, isUnderline });

  /**
   * Handle line button click - toggle line tool
   */
  const handleLineClick = () => handleToolSelect('line', { lineWidth });

  /**
   * Exit place mode (called from Canvas component after placing shape)
   */
  const exitPlaceMode = () => {
    setIsPlaceMode(false);
    setActiveShape(null);
    console.log('Place mode deactivated');
  };

  /**
   * Handle color selection
   */
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setHexInput(color);
    setHexError('');
    
    // Apply color to window for Canvas to access
    if (typeof window !== 'undefined' && window.updateSelectedColor) {
      window.updateSelectedColor(color);
    }
  };

  /**
   * Validate hex color format
   */
  const isValidHex = (hex) => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  /**
   * Handle hex input apply
   */
  const handleHexApply = () => {
    const trimmedHex = hexInput.trim().toUpperCase();
    
    if (!isValidHex(trimmedHex)) {
      setHexError('Invalid hex format (use #RRGGBB)');
      return;
    }

    setHexError('');
    handleColorSelect(trimmedHex);
  };

  /**
   * Handle saving custom color to slot
   */
  const handleSaveCustomColor = (slotIndex) => {
    saveCustomColor(slotIndex, selectedColor);
    console.log(`Saved ${selectedColor} to custom slot ${slotIndex}`);
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
        
        {/* AI Assistant Button */}
        <button
          className={`toolbar-btn ${isAIBarOpen ? 'active' : ''}`}
          onClick={() => setIsAIBarOpen(!isAIBarOpen)}
          title="AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C10.9 2 10 2.9 10 4C10 4.7 10.4 5.3 11 5.6V7H9C7.3 7 6 8.3 6 10V12C6 13.7 7.3 15 9 15H11V18.4C10.4 18.7 10 19.3 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 19.3 13.6 18.7 13 18.4V15H15C16.7 15 18 13.7 18 12V10C18 8.3 16.7 7 15 7H13V5.6C13.6 5.3 14 4.7 14 4C14 2.9 13.1 2 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
            <path d="M9 12.5C9 12.5 10 13.5 12 13.5C14 13.5 15 12.5 15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'rectangle' ? 'active' : ''}`}
          onClick={handleRectangleClick}
          title="Click to place rectangle (100x100px)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="2" rx="1"/>
          </svg>
        </button>

        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'circle' ? 'active' : ''}`}
          onClick={handleCircleClick}
          title="Click to place circle (100px diameter)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'text' ? 'active' : ''}`}
          onClick={handleTextClick}
          title="Click to place text (double-click to edit)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <text x="12" y="16" fontSize="14" textAnchor="middle" fill="currentColor" fontWeight="bold">T</text>
          </svg>
        </button>

        <button
          className={`toolbar-btn ${isPlaceMode && activeShape === 'line' ? 'active' : ''}`}
          onClick={handleLineClick}
          title="Click twice to draw a line"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="18" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <button
          className={`toolbar-btn ${isColorPickerOpen ? 'active' : ''}`}
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          title="Color Picker"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C10.9 2 10 2.9 10 4C10 4.7 10.4 5.4 11 5.7V7C8.2 7.4 6 9.7 6 12.5C6 15.5 8.5 18 11.5 18H12.5C15.5 18 18 15.5 18 12.5C18 9.7 15.8 7.4 13 7V5.7C13.6 5.4 14 4.7 14 4C14 2.9 13.1 2 12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="11" r="1" fill="currentColor"/>
            <circle cx="15" cy="11" r="1" fill="currentColor"/>
            <circle cx="12" cy="9" r="1" fill="currentColor"/>
            <circle cx="9" cy="14" r="1" fill="currentColor"/>
            <circle cx="15" cy="14" r="1" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* AI Command Bar - Collapsible */}
      {isAIBarOpen && children && (
        <div className="toolbar-section">
          {children}
        </div>
      )}

      {/* Color Picker - Collapsible */}
      {isColorPickerOpen && (
      <div className="toolbar-section">
        <h3 className="toolbar-title">Colors</h3>
        
        {/* Default Colors */}
        <div className="color-grid">
          {defaultColors.map((color) => (
            <button
              key={color}
              className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              title={color}
            />
          ))}
        </div>

        {/* Custom Colors */}
        <div className="custom-colors-label">Custom Colors</div>
        <div className="color-grid">
          {[0, 1, 2, 3, 4].map((slotIndex) => {
            const customColor = customColors[slotIndex];
            return (
              <button
                key={`custom-${slotIndex}`}
                className={`color-swatch custom-swatch ${selectedColor === customColor && customColor ? 'selected' : ''} ${!customColor ? 'empty' : ''}`}
                style={{ backgroundColor: customColor || '#e0e0e0' }}
                onClick={() => customColor && handleColorSelect(customColor)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleSaveCustomColor(slotIndex);
                }}
                title={customColor ? `${customColor} (Right-click to overwrite)` : 'Right-click to save current color'}
              />
            );
          })}
        </div>

        {/* Hex Input */}
        <div className="hex-input-container">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleHexApply();
              }
            }}
            placeholder="#000000"
            className="hex-input"
            maxLength={7}
          />
          <button
            onClick={handleHexApply}
            className="hex-apply-btn"
          >
            Apply
          </button>
        </div>
        {hexError && <div className="hex-error">{hexError}</div>}

        {/* Current Color Display */}
        <div className="current-color-display">
          <div className="current-color-box" style={{ backgroundColor: selectedColor }} />
          <span className="current-color-label">{selectedColor}</span>
        </div>
      </div>
      )}

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

      {/* Text Formatting Controls - Show when creating text OR when text is selected */}
      {((isPlaceMode && activeShape === 'text') || hasTextSelected) && (
        <div className="toolbar-section">
          <h3 className="toolbar-title">Text Formatting</h3>
          
          {/* Font Family Selector */}
          <label className="toolbar-label">
            Font
            <select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                if (typeof window !== 'undefined' && window.updateTextFormatting) {
                  window.updateTextFormatting({ fontFamily: e.target.value });
                }
              }}
              className="font-selector"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Papyrus">Papyrus</option>
            </select>
          </label>

          {/* Bold and Underline Toggles */}
          <div className="text-style-buttons">
            <button
              className={`toolbar-btn toolbar-btn-small ${isBold ? 'active' : ''}`}
              onClick={() => {
                setIsBold(!isBold);
                if (typeof window !== 'undefined' && window.updateTextFormatting) {
                  window.updateTextFormatting({ isBold: !isBold });
                }
              }}
              title="Bold"
            >
              <span style={{ fontWeight: 'bold' }}>B</span>
            </button>
            <button
              className={`toolbar-btn toolbar-btn-small ${isUnderline ? 'active' : ''}`}
              onClick={() => {
                setIsUnderline(!isUnderline);
                if (typeof window !== 'undefined' && window.updateTextFormatting) {
                  window.updateTextFormatting({ isUnderline: !isUnderline });
                }
              }}
              title="Underline"
            >
              <span style={{ textDecoration: 'underline' }}>U</span>
            </button>
          </div>
        </div>
      )}

      {/* Zoom indicator button at bottom */}
      {debugData && (
        <div className="toolbar-debug-container">
          <button
            className={`toolbar-btn zoom-btn ${isDebugExpanded ? 'active' : ''}`}
            onClick={onToggleDebug}
            title={isDebugExpanded ? 'Hide debug info' : `Zoom: ${(debugData.zoom * 100).toFixed(0)}% (click for debug)`}
          >
            <div className="zoom-btn-content">
              <svg className="zoom-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <span className="zoom-percent">{(debugData.zoom * 100).toFixed(0)}%</span>
            </div>
          </button>
          
          {/* Debug info panel (when expanded) */}
          {isDebugExpanded && (
            <div className="debug-panel">
              <div className="debug-panel-content">
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
          )}
        </div>
      )}
    </div>
  );
}

