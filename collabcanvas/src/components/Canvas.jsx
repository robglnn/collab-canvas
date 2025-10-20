import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvas } from '../hooks/useCanvas';
import { useCursors } from '../hooks/useCursors';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../hooks/useAuth';
import { useHistory } from '../hooks/useHistory';
import { useAI } from '../hooks/useAI';
import { useRTDB } from '../hooks/useRTDB';
import { screenToCanvas } from '../lib/canvasUtils';
import Toolbar from './Toolbar';
import Shape from './Shape';
import UserCursor from './UserCursor';
import ContextMenu from './ContextMenu';
import DisconnectBanner from './DisconnectBanner';
import { AIBannerManager } from './AIBanner';
import LayersPanel from './LayersPanel';
import AIPanel from './AIPanel';
import './Canvas.css';

/**
 * Main canvas component with Konva.js
 * Handles pan, zoom, shape creation, selection, and deletion (local only)
 * 
 * Canvas size: 5000x5000px workspace
 * Pan: Left-click drag on empty canvas
 * Zoom: Mouse scroll wheel
 * Create: Click toolbar button, then click canvas to place
 * Select: Click on shape
 * Delete: Select shape, press Delete key
 */
export default function Canvas() {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Viewport state (position and scale)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  // Stage dimensions (dynamic based on container)
  const [stageDimensions, setStageDimensions] = useState({ width: 0, height: 0 });
  
  // Pan state
  const [isDragging, setIsDragging] = useState(false);
  
  // Place mode state
  const [placeMode, setPlaceMode] = useState(null); // null or 'rectangle'
  const [placeModeOptions, setPlaceModeOptions] = useState(null); // Options for place mode (e.g., lineWidth)
  
  // Line tool state
  const [lineStartPoint, setLineStartPoint] = useState(null); // First click point for line tool
  
  // Optimistic updates state (for instant UI feedback)
  const [optimisticUpdates, setOptimisticUpdates] = useState({}); // { shapeId: { updates } }
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  
  // Selection box state (for drag-to-select)
  const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, endX, endY }
  const [isSelecting, setIsSelecting] = useState(false);
  const justCompletedSelectionRef = useRef(false); // Prevent click event from deselecting after selection
  
  // Clipboard state for copy/paste
  const [clipboard, setClipboard] = useState([]);
  
  // Cursor position on canvas (for debug display) - using ref to avoid re-renders
  const cursorCanvasPosRef = useRef({ x: 0, y: 0 });

  // Debug panel expansion state
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  // Color selection state
  const [selectedColor, setSelectedColor] = useState('#000000');

  // Layers panel state
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  
  // AI panel state
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  // Update CSS variable for toolbar width (for layers panel positioning)
  useEffect(() => {
    const updateToolbarWidth = () => {
      const toolbar = document.querySelector('.toolbar');
      if (toolbar) {
        const width = toolbar.offsetWidth;
        document.documentElement.style.setProperty('--toolbar-width', `${width}px`);
      }
    };

    updateToolbarWidth();
    
    // Use ResizeObserver to track toolbar width changes
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
      const resizeObserver = new ResizeObserver(updateToolbarWidth);
      resizeObserver.observe(toolbar);
      
      return () => resizeObserver.disconnect();
    }
  }, []); // Run once on mount, ResizeObserver handles dynamic updates

  // Auth hook
  const { user } = useAuth();

  // Canvas state hook
  const {
    shapes,
    selectedShapeIds,
    isOwner,
    ownerId,
    loading,
    isConnected,
    showDisconnectBanner,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    deselectShape,
    lockShape,
    unlockShape,
    forceOverrideLock,
    canEditShape,
    updateShapesZIndex,
    bringToFront,
    sendToBack,
  } = useCanvas();

  // Presence hook - to get user names for lock labels
  const { users } = usePresence(ownerId);
  
  // Get online user IDs from presence data (memoized to prevent infinite loops)
  const onlineUserIds = useMemo(() => {
    return users.filter(u => u.online).map(u => u.userId);
  }, [users]);
  
  // Cursors hook - pass online user IDs to filter cursors
  const { cursors, updateCursorPosition, removeCursor } = useCursors(onlineUserIds);

  // RTDB hook for temporary updates (line width slider)
  const { writeTempUpdate, clearTempUpdate } = useRTDB();

  // History hook for undo/redo
  const { canUndo, canRedo, takeSnapshot, undo, redo, clearHistory } = useHistory();

  // Expose updateLineWidth function to Toolbar (for dynamic line width changes)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateLineWidth = (newWidth) => {
        setPlaceModeOptions({ lineWidth: newWidth });
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.updateLineWidth = undefined;
      }
    };
  }, []);

  // Expose updateTextFormatting function to Toolbar (for text formatting changes)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateTextFormatting = (formatting) => {
        // Update place mode options for new text
        setPlaceModeOptions(prev => ({ ...prev, ...formatting }));
        
        // Apply to selected text shapes
        if (selectedShapeIds.length > 0) {
          takeSnapshot(shapes); // Take snapshot before modifying
          selectedShapeIds.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            if (shape && shape.type === 'text') {
              const updates = {};
              if (formatting.fontFamily !== undefined) {
                updates.fontFamily = formatting.fontFamily;
              }
              if (formatting.isBold !== undefined) {
                updates.fontStyle = formatting.isBold ? 'bold' : 'normal';
              }
              if (formatting.isUnderline !== undefined) {
                updates.textDecoration = formatting.isUnderline ? 'underline' : 'none';
              }
              updateShape(shapeId, updates);
            }
          });
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.updateTextFormatting = undefined;
      }
    };
  }, [selectedShapeIds, shapes, updateShape, takeSnapshot]);

  // Expose updateSelectedColor function to Toolbar (for color changes)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateSelectedColor = (color) => {
        setSelectedColor(color);
        
        // Apply to selected shapes
        if (selectedShapeIds.length > 0) {
          takeSnapshot(shapes); // Take snapshot before modifying
          selectedShapeIds.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            if (shape) {
              const updates = {};
              if (shape.type === 'line') {
                updates.stroke = color; // Lines use stroke color
              } else {
                updates.fill = color; // Other shapes use fill color
              }
              updateShape(shapeId, updates);
            }
          });
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.updateSelectedColor = undefined;
      }
    };
  }, [selectedShapeIds, shapes, updateShape, takeSnapshot]);

  // Create AI-specific shape update function that skips RTDB for batch operations
  const updateShapeForAI = useCallback(async (shapeId, updates) => {
    // AI operations skip RTDB to avoid performance overhead
    // They only write to Firestore (persistent) since AI batch operations
    // don't need real-time sync - they complete in <2 seconds
    return updateShape(shapeId, updates);
  }, [updateShape]);

  // AI hook - pass canvas context
  const aiContext = useMemo(() => ({
    shapes,
    selectedShapeIds,
    stagePos,
    stageScale,
    stageRef,
    addShape,
    updateShape: updateShapeForAI, // Use AI-specific version
    deleteShape,
    selectShape,
    deselectShape,
    user,
    takeSnapshot, // Add takeSnapshot for undo/redo
    viewport: { x: stagePos.x, y: stagePos.y, scale: stageScale }
  }), [shapes, selectedShapeIds, stagePos, stageScale, addShape, updateShapeForAI, deleteShape, selectShape, deselectShape, user, takeSnapshot]);

  const { submitCommand, isProcessing, lastResult, error, clearResult, cooldownRemaining, isOnCooldown } = useAI(aiContext);

  // AI Banner state
  const [aiBanners, setAiBanners] = useState([]);

  // Handle AI command submission
  const handleAISubmit = useCallback(async (command) => {
    const result = await submitCommand(command);
    
    // Show result in banner
    if (result) {
      const bannerType = result.success ? 'success' : 'error';
      const bannerId = Date.now().toString();
      
      setAiBanners(prev => [...prev, {
        id: bannerId,
        message: result.message,
        type: bannerType,
        duration: 3000
      }]);
    }
  }, [submitCommand]);

  // Handle banner close
  const handleBannerClose = useCallback((bannerId) => {
    setAiBanners(prev => prev.filter(b => b.id !== bannerId));
  }, []);

  // Canvas boundaries and zoom limits
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;
  const MAX_SCALE = 5;
  
  // Calculate minimum scale to ensure canvas always fills viewport
  // This prevents zooming out to see empty space outside the canvas
  const MIN_SCALE = useMemo(() => {
    if (stageDimensions.width === 0 || stageDimensions.height === 0) return 0.1;
    
    // Calculate scale needed for canvas to fill viewport
    const scaleToFitWidth = stageDimensions.width / CANVAS_WIDTH;
    const scaleToFitHeight = stageDimensions.height / CANVAS_HEIGHT;
    
    // Use the larger scale to ensure canvas fills viewport in both dimensions
    const minScale = Math.max(scaleToFitWidth, scaleToFitHeight);
    
    // Add a small buffer (0.95x) to allow slight zoom out for UX
    return Math.max(0.1, minScale * 0.95);
  }, [stageDimensions, CANVAS_WIDTH, CANVAS_HEIGHT]);
  
  // Spawn configuration: Where users appear when they first load
  // 
  // To change spawn behavior for different canvas sizes:
  // - For center spawn: CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2
  // - For top-left: 0, 0
  // - For custom position: any coordinates within canvas bounds
  // - Zoom: 1.0 = 100%, 0.5 = 50%, 2.0 = 200%
  //
  // Example for 10000x8000 canvas with top-left spawn:
  //   const CANVAS_WIDTH = 10000;
  //   const CANVAS_HEIGHT = 8000;
  //   const SPAWN_CANVAS_X = 0;
  //   const SPAWN_CANVAS_Y = 0;
  //   const SPAWN_ZOOM = 0.5; // Zoomed out to see more
  //
  const SPAWN_CANVAS_X = CANVAS_WIDTH / 2;  // 2500 for 5000px canvas (center X)
  const SPAWN_CANVAS_Y = CANVAS_HEIGHT / 2; // 2500 for 5000px canvas (center Y)
  const SPAWN_ZOOM = 1.0; // 100% zoom

  /**
   * Calculate stage position to show a specific canvas point at viewport center
   * 
   * @param {number} canvasX - Canvas X coordinate to center on (0-CANVAS_WIDTH)
   * @param {number} canvasY - Canvas Y coordinate to center on (0-CANVAS_HEIGHT)
   * @param {number} zoom - Zoom level (1.0 = 100%)
   * @param {number} viewportWidth - Viewport width in pixels
   * @param {number} viewportHeight - Viewport height in pixels
   * @returns {{x: number, y: number}} Stage position
   */
  const calculateStagePosition = useCallback((canvasX, canvasY, zoom, viewportWidth, viewportHeight) => {
    // To show canvas point (canvasX, canvasY) at viewport center:
    // viewportCenter = stagePos + (canvasPoint * zoom)
    // Therefore: stagePos = viewportCenter - (canvasPoint * zoom)
    return {
      x: viewportWidth / 2 - canvasX * zoom,
      y: viewportHeight / 2 - canvasY * zoom,
    };
  }, []);

  /**
   * Update stage dimensions when container resizes
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        console.log('[Canvas] updateDimensions called:', { width, height });
        if (width > 0 && height > 0) {
          setStageDimensions({ width, height });
          console.log('[Canvas] Stage dimensions set:', { width, height });
        }
      } else {
        console.log('[Canvas] containerRef.current is null');
      }
    };

    // Use multiple delays as fallback to ensure container is mounted
    const timeoutId1 = setTimeout(updateDimensions, 0);
    const timeoutId2 = setTimeout(updateDimensions, 100);
    const timeoutId3 = setTimeout(updateDimensions, 500);

    // Watch for resize with ResizeObserver
    let resizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []); // Empty deps - effect runs once on mount

  /**
   * Handle window resize with debouncing
   * Ensures canvas dimensions update when browser window is resized
   */
  useEffect(() => {
    let resizeTimeout;
    
    const handleWindowResize = () => {
      // Debounce resize updates to avoid performance issues during resize
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          const height = containerRef.current.offsetHeight;
          console.log('[Canvas] Window resize - updating dimensions:', { width, height });
          if (width > 0 && height > 0) {
            setStageDimensions({ width, height });
          }
        }
      }, 100); // 100ms debounce
    };

    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []); // Empty deps - effect runs once on mount

  /**
   * Initialize canvas position - spawn user at center of canvas
   * Flexible for any canvas size and spawn point
   */
  useEffect(() => {
    if (!stageRef.current || isInitialized || stageDimensions.width === 0) return;

    const stage = stageRef.current;
    const viewportWidth = stageDimensions.width;
    const viewportHeight = stageDimensions.height;

    // Calculate stage position to show spawn point at viewport center
    const initialPos = calculateStagePosition(
      SPAWN_CANVAS_X,
      SPAWN_CANVAS_Y,
      SPAWN_ZOOM,
      viewportWidth,
      viewportHeight
    );

    setStagePos(initialPos);
    setStageScale(SPAWN_ZOOM);
    setIsInitialized(true);
    
    console.log(`Canvas initialized: User spawned at canvas (${SPAWN_CANVAS_X}, ${SPAWN_CANVAS_Y}) with ${SPAWN_ZOOM * 100}% zoom`);
    console.log(`Stage position: (${Math.round(initialPos.x)}, ${Math.round(initialPos.y)})`);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, SPAWN_CANVAS_X, SPAWN_CANVAS_Y, SPAWN_ZOOM, isInitialized, calculateStagePosition, stageDimensions]);

  /**
   * Handle copy from context menu or keyboard
   */
  const handleCopy = useCallback(() => {
    if (selectedShapeIds.length > 0) {
      const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
      setClipboard(selectedShapes);
      console.log(`Copied ${selectedShapes.length} shape(s) to clipboard`);
    }
  }, [selectedShapeIds, shapes]);

  /**
   * Handle paste from context menu or keyboard
   */
  const handlePaste = useCallback((cursorX, cursorY) => {
    if (clipboard.length === 0) return;

    const stage = stageRef.current;
    if (!stage) return;

    takeSnapshot(shapes); // Take snapshot before pasting

    // If cursor position provided (from right-click), use it
    // Otherwise use viewport center (for keyboard shortcut)
    let pasteX, pasteY;
    if (cursorX !== undefined && cursorY !== undefined) {
      // Convert screen coordinates to canvas coordinates
      const canvasPos = screenToCanvas({ x: cursorX, y: cursorY }, stage);
      pasteX = canvasPos.x;
      pasteY = canvasPos.y;
    } else {
      // Use viewport center for keyboard paste
      pasteX = (stageDimensions.width / 2 - stagePos.x) / stageScale;
      pasteY = (stageDimensions.height / 2 - stagePos.y) / stageScale;
    }

    const pastedShapes = clipboard.map((shape, index) => ({
      ...shape,
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: pasteX + (index * 20), // Offset each shape slightly
      y: pasteY + (index * 20),
      lockedBy: null, // Clear lock
    }));

    pastedShapes.forEach(shape => addShape(shape));

    // Select the newly pasted shapes
    const newIds = pastedShapes.map(s => s.id);
    selectShape(newIds);

    console.log(`Pasted ${pastedShapes.length} shape(s)`);
  }, [clipboard, shapes, takeSnapshot, addShape, selectShape, stageDimensions, stagePos, stageScale]);

  /**
   * Handle duplicate from context menu or keyboard
   */
  const handleDuplicate = useCallback(() => {
    if (selectedShapeIds.length === 0) return;

    takeSnapshot(shapes); // Take snapshot before duplicating

    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    const duplicatedShapes = selectedShapes.map(shape => ({
      ...shape,
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: shape.x + 20, // Offset by 20px
      y: shape.y + 20,
      lockedBy: null, // Clear lock
    }));

    duplicatedShapes.forEach(shape => addShape(shape));

    // Select the duplicated shapes
    const newIds = duplicatedShapes.map(s => s.id);
    selectShape(newIds);

    console.log(`Duplicated ${duplicatedShapes.length} shape(s)`);
  }, [selectedShapeIds, shapes, takeSnapshot, addShape, selectShape]);

  /**
   * Handle keyboard events (Delete, Copy, Paste, Duplicate)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete selected shapes
      if (e.key === 'Delete' && selectedShapeIds.length > 0) {
        takeSnapshot(shapes); // Take snapshot before deleting
        deleteShape(selectedShapeIds);
      }
      
      // Copy selected shapes (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedShapeIds.length > 0) {
        e.preventDefault();
        handleCopy();
      }
      
      // Paste shapes (Ctrl+V or Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();
        handlePaste(); // Uses viewport center when called from keyboard
      }
      
      // Duplicate shapes (Ctrl+D or Cmd+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedShapeIds.length > 0) {
        e.preventDefault();
        handleDuplicate();
      }
      
      // Undo (Ctrl+Z or Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          const previousState = undo(shapes);
          if (previousState) {
            // Apply previous state to Firestore
            // First, clear current shapes
            shapes.forEach(shape => deleteShape(shape.id));
            // Then add previous shapes
            previousState.forEach(shape => addShape(shape));
            console.log('Undo applied');
          }
        }
      }
      
      // Redo (Ctrl+Shift+Z or Cmd+Shift+Z, or Ctrl+Y)
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) || 
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        if (canRedo) {
          const nextState = redo(shapes);
          if (nextState) {
            // Apply next state to Firestore
            // First, clear current shapes
            shapes.forEach(shape => deleteShape(shape.id));
            // Then add next shapes
            nextState.forEach(shape => addShape(shape));
            console.log('Redo applied');
          }
        }
      }
      
      // Arrow key movement (1px or 10px with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedShapeIds.length > 0) {
        e.preventDefault(); // Prevent page scrolling
        takeSnapshot(shapes); // Take snapshot before moving
        
        const nudgeAmount = e.shiftKey ? 10 : 1; // 10px with Shift, 1px without
        let deltaX = 0;
        let deltaY = 0;
        
        switch (e.key) {
          case 'ArrowUp':
            deltaY = -nudgeAmount;
            break;
          case 'ArrowDown':
            deltaY = nudgeAmount;
            break;
          case 'ArrowLeft':
            deltaX = -nudgeAmount;
            break;
          case 'ArrowRight':
            deltaX = nudgeAmount;
            break;
        }
        
        // Move all selected shapes
        selectedShapeIds.forEach(shapeId => {
          const shape = shapes.find(s => s.id === shapeId);
          if (shape) {
            updateShape(shapeId, {
              ...shape,
              x: shape.x + deltaX,
              y: shape.y + deltaY,
            });
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeIds, shapes, clipboard, deleteShape, addShape, selectShape, updateShape, canUndo, canRedo, undo, redo, handleCopy, handlePaste, handleDuplicate]);

  /**
   * Track previous shapes for snapshot comparison
   * Only take snapshots when shapes actually change from user actions
   */
  const previousShapesRef = useRef([]);
  const dragSnapshotTakenRef = useRef(false);
  
  useEffect(() => {
    // Take initial snapshot when canvas first loads
    if (previousShapesRef.current.length === 0 && shapes.length > 0) {
      takeSnapshot(shapes);
      previousShapesRef.current = shapes;
    }
  }, [shapes, takeSnapshot]);

  /**
   * Complete selection box - shared logic for both global and Stage mouse up
   */
  const completeSelection = useCallback(() => {
    if (!isSelecting) return;

      setIsSelecting(false);

      if (!selectionBox) {
        return;
      }

      // Calculate selection box bounds
      const box = {
        x: Math.min(selectionBox.startX, selectionBox.endX),
        y: Math.min(selectionBox.startY, selectionBox.endY),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY)
      };

      // Find shapes that intersect with selection box
      const selectedIds = shapes.filter(shape => {
        if (shape.type === 'circle') {
          // For circles, check if circle's bounding box intersects with selection box
          const left = shape.x - shape.radius;
          const right = shape.x + shape.radius;
          const top = shape.y - shape.radius;
          const bottom = shape.y + shape.radius;
          
          return (
            left < box.x + box.width &&
            right > box.x &&
            top < box.y + box.height &&
            bottom > box.y
          );
      } else if (shape.type === 'text') {
        // For text, estimate height from fontSize (text doesn't have explicit height)
        const estimatedHeight = (shape.fontSize || 24) * 1.2; // Line height multiplier
        return (
          shape.x < box.x + box.width &&
          shape.x + (shape.width || 200) > box.x &&
          shape.y < box.y + box.height &&
          shape.y + estimatedHeight > box.y
        );
      } else if (shape.type === 'line') {
        // For lines, check if any point is within selection box
        if (!shape.points || shape.points.length < 4) return false;
        
        // Get line bounding box (points are relative to shape.x, shape.y in Konva)
        const lineX = shape.x || 0;
        const lineY = shape.y || 0;
        const xCoords = shape.points.filter((_, i) => i % 2 === 0).map(x => x + lineX);
        const yCoords = shape.points.filter((_, i) => i % 2 === 1).map(y => y + lineY);
        const lineLeft = Math.min(...xCoords);
        const lineRight = Math.max(...xCoords);
        const lineTop = Math.min(...yCoords);
        const lineBottom = Math.max(...yCoords);
        
        return (
          lineLeft < box.x + box.width &&
          lineRight > box.x &&
          lineTop < box.y + box.height &&
          lineBottom > box.y
        );
        } else {
        // For rectangles and other shapes with width/height
          return (
            shape.x < box.x + box.width &&
          shape.x + (shape.width || 0) > box.x &&
            shape.y < box.y + box.height &&
          shape.y + (shape.height || 0) > box.y
          );
        }
      }).map(shape => shape.id);

      if (selectedIds.length > 0) {
        selectShape(selectedIds);
        
        // Set flag to prevent the subsequent click event from deselecting
        // Only set if we actually selected something
        justCompletedSelectionRef.current = true;
        setTimeout(() => {
          justCompletedSelectionRef.current = false;
        }, 50); // Reset after 50ms (enough time for click event to fire)
      }

      setSelectionBox(null);
  }, [isSelecting, selectionBox, shapes, selectShape]);

  /**
   * Global mouse up handler to complete selection box even if mouse released outside Stage
   */
  useEffect(() => {
    if (!isSelecting) return;

    const handleGlobalMouseUp = () => {
      completeSelection();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, completeSelection]);

  /**
   * Clamp viewport position to stay within canvas boundaries
   * Ensures users can never pan outside the 5000x5000px canvas
   */
  const clampPosition = useCallback((pos, scale) => {
    if (stageDimensions.width === 0 || stageDimensions.height === 0) return pos;

    // Calculate scaled canvas dimensions
    const scaledCanvasWidth = CANVAS_WIDTH * scale;
    const scaledCanvasHeight = CANVAS_HEIGHT * scale;

    // Calculate boundaries - ensure canvas edges never go past viewport edges
    // maxX/maxY = 0 means canvas top-left can't go right/down from viewport top-left
    // minX/minY ensures canvas bottom-right never goes left/up from viewport bottom-right
    const maxX = 0;
    const minX = Math.min(0, stageDimensions.width - scaledCanvasWidth);
    const maxY = 0;
    const minY = Math.min(0, stageDimensions.height - scaledCanvasHeight);

    // If canvas is smaller than viewport (shouldn't happen with MIN_SCALE, but be safe)
    // Center it instead of allowing panning
    const clampedX = scaledCanvasWidth < stageDimensions.width 
      ? (stageDimensions.width - scaledCanvasWidth) / 2 
      : Math.max(minX, Math.min(maxX, pos.x));
      
    const clampedY = scaledCanvasHeight < stageDimensions.height
      ? (stageDimensions.height - scaledCanvasHeight) / 2
      : Math.max(minY, Math.min(maxY, pos.y));

    return {
      x: clampedX,
      y: clampedY,
    };
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, stageDimensions]);

  /**
   * Handle mouse wheel - Ctrl+scroll = zoom, plain scroll = pan vertical, Shift+scroll = pan horizontal
   */
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const evt = e.evt;

    // Ctrl + Scroll = Zoom (centered on cursor)
    if (evt.ctrlKey) {
    // Read LIVE scale from stage, not React state
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    // Get actual stage position (not state, which may lag)
    const oldPos = {
      x: stage.x(),
      y: stage.y(),
    };

    // Smoother zoom factor (smaller increments = smoother)
    const scaleBy = 1.05;
    
    // Calculate zoom direction and new scale
      const direction = evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 
      ? oldScale * scaleBy 
      : oldScale / scaleBy;

    // Clamp scale to min/max bounds
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    // If scale didn't change (hit limits), don't update
    if (clampedScale === oldScale) return;

    // Calculate the point on the canvas that the pointer is over
    const mousePointTo = {
      x: (pointer.x - oldPos.x) / oldScale,
      y: (pointer.y - oldPos.y) / oldScale,
    };

    // Calculate new position to keep the mouse point stationary
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // Apply position clamping to boundaries
    const clampedPos = clampPosition(newPos, clampedScale);

    // Apply directly to stage first, then sync to React state
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position(clampedPos);
    setStageScale(clampedScale);
    setStagePos(clampedPos);
    }
    // Shift + Scroll = Pan left/right
    else if (evt.shiftKey) {
      const panSpeed = 1;
      const deltaX = evt.deltaY * panSpeed; // Use deltaY for horizontal panning
      
      // Read LIVE position from stage, not React state (which may be stale)
      const currentPos = stage.position();
      const newPos = {
        x: currentPos.x - deltaX,
        y: currentPos.y
      };

      const clampedPos = clampPosition(newPos, stageScale);
      
      // Apply directly to stage, then sync to React state
      stage.position(clampedPos);
      setStagePos(clampedPos);
    }
    // Plain Scroll = Pan up/down
    else {
      const panSpeed = 1;
      const deltaY = evt.deltaY * panSpeed;
      
      // Read LIVE position from stage, not React state (which may be stale)
      const currentPos = stage.position();
      const newPos = {
        x: currentPos.x,
        y: currentPos.y - deltaY
      };

      const clampedPos = clampPosition(newPos, stageScale);
      
      // Apply directly to stage, then sync to React state
      stage.position(clampedPos);
      setStagePos(clampedPos);
    }
  }, [stageScale, clampPosition, MIN_SCALE, MAX_SCALE]);

  /**
   * Handle mouse down - start selection box or middle-click pan
   */
  const handleMouseDown = useCallback((e) => {
    // Middle mouse button (button 1) = allow Stage to pan
    if (e.evt.button === 1) {
      // Enable dragging for middle mouse button
      return; // Stage draggable will handle it
    }

    // If clicked on a shape (not Stage or Layer), don't start selection box
    const clickedOnEmpty = e.target === stageRef.current || e.target.getClassName() === 'Layer';
    if (!clickedOnEmpty) {
      return;
    }

    // If in place mode, don't start selection box
    if (placeMode) {
      return;
    }

    // Left mouse button (button 0) - Start selection box
    if (e.evt.button === 0) {
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      const canvasPos = screenToCanvas(pointerPos, stage);

      setSelectionBox({
        startX: canvasPos.x,
        startY: canvasPos.y,
        endX: canvasPos.x,
        endY: canvasPos.y
      });
      setIsSelecting(true);
    }
  }, [placeMode]);

  /**
   * Handle mouse move - update selection box
   */
  const handleMouseMoveForSelection = useCallback((e) => {
    if (!isSelecting) return;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    const canvasPos = screenToCanvas(pointerPos, stage);

    setSelectionBox(prev => ({
      ...prev,
      endX: canvasPos.x,
      endY: canvasPos.y
    }));
  }, [isSelecting]);

  /**
   * Handle mouse up - complete selection box (called from Stage onMouseUp)
   */
  const handleMouseUp = useCallback(() => {
    completeSelection();
  }, [completeSelection]);

  /**
   * Handle drag start - allow middle mouse button pan
   */
  const handleDragStart = useCallback((e) => {
    // Only allow stage dragging, not shape dragging
    if (e.target === stageRef.current) {
      // Check if middle mouse button was used (Konva doesn't expose button directly in drag)
      // Allow dragging if not in selection mode
      if (!isSelecting) {
      setIsDragging(true);
      }
    }
  }, [isSelecting]);

  /**
   * Handle drag end - clamp position to boundaries
   */
  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    
    // Only handle stage drag end
    if (e.target === stageRef.current) {
      const stage = e.target;
      
      // Read LIVE position and scale from stage
      const newPos = {
        x: stage.x(),
        y: stage.y(),
      };
      const currentScale = stage.scaleX();

      const clampedPos = clampPosition(newPos, currentScale);
      
      // Apply clamped position back to stage, then sync to React state
      stage.position(clampedPos);
      setStagePos(clampedPos);
    }
  }, [clampPosition]);

  /**
   * Handle mouse move - update cursor position, selection box, and debug display
   */
  const handleMouseMove = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position relative to stage container (screen coordinates)
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Update selection box if selecting
    if (isSelecting) {
      handleMouseMoveForSelection(e);
    }

    // Use LIVE stage values for accurate canvas conversion during interactions
    const currentPos = stage.position();
    const currentScale = stage.scaleX();

    // Convert screen coordinates to canvas coordinates
    // This accounts for stage pan and zoom to get absolute canvas position
    const canvasX = (pointerPos.x - currentPos.x) / currentScale;
    const canvasY = (pointerPos.y - currentPos.y) / currentScale;

    // Update cursor position for debug display (using ref to avoid re-renders)
    cursorCanvasPosRef.current = { x: Math.round(canvasX), y: Math.round(canvasY) };

    // Update cursor position (throttled in useCursors hook)
    updateCursorPosition(canvasX, canvasY);
  }, [isSelecting, handleMouseMoveForSelection, updateCursorPosition]);

  /**
   * Handle stage click - for placing shapes or deselecting
   */
  const handleStageClick = useCallback((e) => {
    // Close context menu if open
    if (contextMenu) {
      setContextMenu(null);
    }

    // If clicked on empty canvas (not a shape)
    const clickedOnEmpty = e.target === stageRef.current;

    if (clickedOnEmpty) {
      if (placeMode === 'rectangle') {
        // Place a rectangle at click position
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        const canvasPos = screenToCanvas(pointerPos, stage);

        const newShape = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'rectangle',
          x: canvasPos.x,
          y: canvasPos.y,
          width: 100,
          height: 100,
          fill: selectedColor, // Apply selected color
          rotation: 0, // Initialize rotation at 0 degrees
        };

        takeSnapshot(shapes); // Take snapshot before adding
        addShape(newShape);
        
        // Auto-exit place mode after placing one shape
        setPlaceMode(null);
        if (window.exitPlaceMode) {
          window.exitPlaceMode();
        }
      } else if (placeMode === 'circle') {
        // Place a circle at click position
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        const canvasPos = screenToCanvas(pointerPos, stage);

        const newShape = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'circle',
          x: canvasPos.x,
          y: canvasPos.y,
          radius: 50, // Default radius of 50px (100px diameter)
          fill: selectedColor, // Apply selected color
          rotation: 0,
        };

        takeSnapshot(shapes); // Take snapshot before adding
        addShape(newShape);
        
        // Auto-exit place mode after placing one shape
        setPlaceMode(null);
        if (window.exitPlaceMode) {
          window.exitPlaceMode();
        }
      } else if (placeMode === 'text') {
        // Place text at click position
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        const canvasPos = screenToCanvas(pointerPos, stage);

        const fontFamily = placeModeOptions?.fontFamily || 'Arial';
        const isBold = placeModeOptions?.isBold || false;
        const isUnderline = placeModeOptions?.isUnderline || false;

        const newShape = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          x: canvasPos.x,
          y: canvasPos.y,
          text: 'Double-click to edit',
          fontSize: 24,
          fontFamily: fontFamily,
          fontStyle: isBold ? 'bold' : 'normal',
          textDecoration: isUnderline ? 'underline' : 'none',
          fill: selectedColor, // Apply selected color
          width: 200,
          rotation: 0,
        };

        takeSnapshot(shapes); // Take snapshot before adding
        addShape(newShape);
        
        // Auto-exit place mode after placing one shape
        setPlaceMode(null);
        if (window.exitPlaceMode) {
          window.exitPlaceMode();
        }
      } else if (placeMode === 'line') {
        // Two-click line placement
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        const canvasPos = screenToCanvas(pointerPos, stage);

        if (!lineStartPoint) {
          // First click: store start point
          setLineStartPoint(canvasPos);
          console.log('Line start point set:', canvasPos);
        } else {
          // Second click: create line
          const lineWidth = placeModeOptions?.lineWidth || 3;
          
          const newShape = {
            id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'line',
            x: 0, // Lines use points array, x/y are not used but kept for consistency
            y: 0,
            points: [lineStartPoint.x, lineStartPoint.y, canvasPos.x, canvasPos.y],
            stroke: selectedColor, // Apply selected color
            strokeWidth: lineWidth,
            rotation: 0,
          };

          takeSnapshot(shapes); // Take snapshot before adding
          addShape(newShape);
          
          // Reset line tool
          setLineStartPoint(null);
          setPlaceMode(null);
          setPlaceModeOptions(null);
          if (window.exitPlaceMode) {
            window.exitPlaceMode();
          }
          console.log('Line created:', newShape);
        }
      } else {
        // Don't deselect if we just completed a selection box
        if (justCompletedSelectionRef.current) {
          return;
        }
        
        // Deselect all selected shapes and unlock them
        selectedShapeIds.forEach(shapeId => {
          const selectedShape = shapes.find(s => s.id === shapeId);
          if (selectedShape && selectedShape.lockedBy === user?.uid) {
            unlockShape(shapeId);
          }
        });
        deselectShape();
      }
    }
  }, [contextMenu, placeMode, lineStartPoint, placeModeOptions, shapes, addShape, takeSnapshot, selectedShapeIds, user, unlockShape, deselectShape]);

  /**
   * Handle toolbar create shape request
   */
  const handleCreateShape = (shapeType, options = null) => {
    setPlaceMode(shapeType);
    setPlaceModeOptions(options);
    setLineStartPoint(null); // Reset line start point when entering line mode
  };

  /**
   * Handle line width input event (while dragging slider)
   * Uses RTDB for sub-100ms sync to other users
   */
  const handleLineWidthInput = (shapeId, newWidth) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && shape.type === 'line') {
      // 1. Optimistic update: Update local state immediately (0ms)
      setOptimisticUpdates(prev => ({
        ...prev,
        [shapeId]: { strokeWidth: newWidth }
      }));
      
      // 2. Write to RTDB for other users (50-100ms sync)
      writeTempUpdate(shapeId, { strokeWidth: newWidth });
    }
  };

  /**
   * Handle line width final update (on slider release)
   * Writes to Firestore for persistence and clears RTDB temp update
   */
  const handleUpdateLineWidth = (shapeId, newWidth) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && shape.type === 'line') {
      // Take snapshot before modifying (for undo/redo)
      takeSnapshot(shapes);
      
      // Keep optimistic update for instant feedback
      setOptimisticUpdates(prev => ({
        ...prev,
        [shapeId]: { strokeWidth: newWidth }
      }));
      
      // 3. Write to Firestore (permanent, 100-200ms)
      updateShape(shapeId, { strokeWidth: newWidth }).then(() => {
        // 4. Clear both optimistic and RTDB temp updates
        setOptimisticUpdates(prev => {
          const updated = { ...prev };
          delete updated[shapeId];
          return updated;
        });
        
        // Clear RTDB temp update
        clearTempUpdate(shapeId);
      });
    }
  };

  /**
   * Handle shape selection (supports Shift-click for multi-select)
   */
  const handleShapeSelect = (shapeId, event) => {
    const addToSelection = event?.evt?.shiftKey || false;
    selectShape(shapeId, addToSelection);
  };

  /**
   * Handle shape change (move, resize) - supports multi-shape movement
   * OPTION A: Simple optimistic updates + immediate Firestore writes
   */
  const handleShapeChange = (updatedShape) => {
    // Take snapshot before first change in a drag/transform session
    if (!dragSnapshotTakenRef.current) {
      takeSnapshot(shapes);
      dragSnapshotTakenRef.current = true;
    }
    
    // If this is a selected shape and multiple shapes are selected, check if we should move all together
    if (selectedShapeIds.includes(updatedShape.id) && selectedShapeIds.length > 1) {
      // Find the original shape to check what changed
      const originalShape = shapes.find(s => s.id === updatedShape.id);
      if (originalShape) {
        // Detect if this is a simple drag (only position changed) vs transform (size/rotation changed)
        const isDrag = (
          updatedShape.width === originalShape.width &&
          updatedShape.height === originalShape.height &&
          updatedShape.radius === originalShape.radius &&
          updatedShape.rotation === originalShape.rotation &&
          JSON.stringify(updatedShape.points) === JSON.stringify(originalShape.points) &&
          updatedShape.scaleX === originalShape.scaleX &&
          updatedShape.scaleY === originalShape.scaleY
        );
        
        if (isDrag) {
          // Simple drag - move all selected shapes together
          const deltaX = updatedShape.x - originalShape.x;
          const deltaY = updatedShape.y - originalShape.y;

          selectedShapeIds.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            if (shape) {
              updateShape(shapeId, {
                x: shape.x + deltaX,
                y: shape.y + deltaY,
              });
            }
          });
        } else {
          // Transform (resize/rotate) - only update the transformed shape
          updateShape(updatedShape.id, updatedShape);
        }
      }
    } else {
      // Single shape update
      updateShape(updatedShape.id, updatedShape);
    }
  };

  /**
   * Handle drag/transform end - reset snapshot flag
   * OPTION A: Simple approach - Firestore writes already happened during drag
   */
  const handleDragEndComplete = useCallback(() => {
    dragSnapshotTakenRef.current = false;
  }, []);

  /**
   * Download canvas as PNG or SVG
   * Exports the entire 5000x5000px canvas
   */
  const handleDownloadCanvas = useCallback((format) => {
    try {
      const stage = stageRef.current;
      if (!stage) {
        console.error('Stage ref not available for download');
        return;
      }

      console.log(`Starting canvas download as ${format}...`);

      // Generate timestamp for filename (YYYYMMDD-HHMMSS)
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const filename = `canvas-${timestamp}.${format}`;

      // Save original position and scale
      const originalPos = stage.position();
      const originalScale = stage.scale();
      
      // Temporarily reset stage position and scale to export full canvas
      stage.position({ x: 0, y: 0 });
      stage.scale({ x: 1, y: 1 });

      // Use requestAnimationFrame to ensure stage has redrawn before export
      requestAnimationFrame(() => {
        try {
          // Export based on format - capture the full 5000x5000 canvas area
          let dataURL;
          if (format === 'svg') {
            dataURL = stage.toDataURL({ 
              mimeType: 'image/svg+xml',
              x: 0,
              y: 0,
              width: 5000,
              height: 5000,
              pixelRatio: 1
            });
          } else {
            // PNG
            dataURL = stage.toDataURL({ 
              x: 0,
              y: 0,
              width: 5000,
              height: 5000,
              pixelRatio: 1
            });
          }

          // Restore original position and scale
          stage.position(originalPos);
          stage.scale(originalScale);

          // Trigger download
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log(`Canvas exported as ${format.toUpperCase()}: ${filename}`);
        } catch (error) {
          // Restore original position/scale even if export fails
          stage.position(originalPos);
          stage.scale(originalScale);
          console.error('Error exporting canvas:', error);
        }
      });
    } catch (error) {
      console.error('Error downloading canvas:', error);
    }
  }, []);

  // Expose download handler to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.downloadCanvas = handleDownloadCanvas;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.downloadCanvas;
      }
    };
  }, [handleDownloadCanvas]);

  /**
   * Handle shape right-click
   */
  const handleShapeRightClick = (shape, position) => {
    setContextMenu({
      shape,
      x: position.x,
      y: position.y,
    });
  };

  /**
   * Handle canvas right-click (for paste menu)
   */
  const handleCanvasRightClick = (e) => {
    e.evt.preventDefault(); // Prevent default browser context menu
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    
    // Only show paste menu if clipboard has data
    if (clipboard.length > 0) {
      setContextMenu({
        shape: null, // null indicates canvas context menu
        x: pointerPos.x,
        y: pointerPos.y,
      });
    }
  };

  /**
   * Handle override control from context menu
   */
  const handleOverrideControl = (shapeId) => {
    forceOverrideLock(shapeId);
  };

  /**
   * Get user name by user ID
   */
  const getUserName = (userId) => {
    const userPresence = users.find(u => u.userId === userId);
    return userPresence?.userName || 'Unknown User';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="canvas-container">
        <Toolbar 
          onCreateShape={handleCreateShape}
          selectedShapes={[]}
          onUpdateLineWidth={handleUpdateLineWidth}
          onLineWidthInput={handleLineWidthInput}
          isLayersPanelOpen={isLayersPanelOpen}
          onToggleLayersPanel={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
          isAIPanelOpen={isAIPanelOpen}
          onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
        />
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  // Apply optimistic updates to shapes and sort by zIndex (simple and reliable)
  const shapesWithOptimisticUpdates = shapes
    .map(shape => {
      const localUpdate = optimisticUpdates[shape.id] || {};
      
      // Merge base shape with optimistic updates
      return { 
        ...shape, 
        ...localUpdate
      };
    })
    .sort((a, b) => {
      // Sort by zIndex (lower zIndex = rendered first = back)
      const aZIndex = a.zIndex ?? 0;
      const bZIndex = b.zIndex ?? 0;
      return aZIndex - bZIndex;
    });

  // Get selected shapes for Toolbar (with optimistic updates applied)
  const selectedShapes = shapesWithOptimisticUpdates.filter(s => selectedShapeIds.includes(s.id));

  return (
    <div className="canvas-container">
      <Toolbar 
        onCreateShape={handleCreateShape}
        selectedShapes={selectedShapes}
        onUpdateLineWidth={handleUpdateLineWidth}
        onLineWidthInput={handleLineWidthInput}
        debugData={{
          zoom: stageScale,
          canvasCenter: {
            x: Math.round((stageDimensions.width / 2 - stagePos.x) / stageScale),
            y: Math.round((stageDimensions.height / 2 - stagePos.y) / stageScale)
          },
          cursor: cursorCanvasPosRef.current,
          stageOffset: { x: Math.round(stagePos.x), y: Math.round(stagePos.y) },
          canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
          shapesCount: shapes.length,
          cursorsCount: cursors.length,
          role: isOwner ? 'Owner' : 'Collaborator',
          selectedCount: selectedShapeIds.length
        }}
        isDebugExpanded={isDebugExpanded}
        onToggleDebug={() => setIsDebugExpanded(!isDebugExpanded)}
        isLayersPanelOpen={isLayersPanelOpen}
        onToggleLayersPanel={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
        isAIPanelOpen={isAIPanelOpen}
        onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
      />
      
      {/* Layers Panel */}
      <LayersPanel
        shapes={shapes}
        selectedShapeIds={selectedShapeIds}
        onSelectShape={(shapeId, addToSelection) => {
          if (addToSelection) {
            selectShape(shapeId, true);
          } else {
            selectShape(shapeId, false);
          }
        }}
        onReorderShapes={updateShapesZIndex}
        isOpen={isLayersPanelOpen}
        onToggle={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
      />
      
      {/* AI Panel */}
      <AIPanel
        onSubmit={handleAISubmit}
        isProcessing={isProcessing}
        showSuccess={lastResult?.success && !isProcessing}
        cooldownRemaining={cooldownRemaining}
        isOnCooldown={isOnCooldown}
        isOpen={isAIPanelOpen}
        onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)}
      />
      
      <AIBannerManager banners={aiBanners} onBannerClose={handleBannerClose} />
      <DisconnectBanner show={showDisconnectBanner} />
      
      <div ref={containerRef} className={`canvas-workspace ${placeMode ? 'place-mode' : ''}`}>
        {stageDimensions.width > 0 && stageDimensions.height > 0 && (
          <Stage
            ref={stageRef}
            width={stageDimensions.width}
            height={stageDimensions.height}
            x={stagePos.x}
            y={stagePos.y}
            scaleX={stageScale}
            scaleY={stageScale}
            draggable={!isSelecting} // Disable drag when selecting
            onWheel={handleWheel}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onContextMenu={handleCanvasRightClick}
            className={isDragging ? 'dragging' : ''}
          >
          <Layer>
            {/* White canvas background - 5000x5000 workspace */}
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="#FFFFFF"
              listening={false}
            />
            
            {/* Render all shapes (with optimistic updates for instant feedback) */}
            {shapesWithOptimisticUpdates.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeIds.includes(shape.id)}
                canEdit={canEditShape(shape)}
                lockedByName={shape.lockedBy ? getUserName(shape.lockedBy) : null}
                isOwner={isOwner}
                currentUserId={user?.uid}
                onSelect={(event) => handleShapeSelect(shape.id, event)}
                onChange={handleShapeChange}
                onDragEndComplete={handleDragEndComplete}
                onLock={lockShape}
                onUnlock={unlockShape}
                onRightClick={handleShapeRightClick}
              />
            ))}

            {/* Selection box - blue dashed rectangle */}
            {selectionBox && (
              <Rect
                x={Math.min(selectionBox.startX, selectionBox.endX)}
                y={Math.min(selectionBox.startY, selectionBox.endY)}
                width={Math.abs(selectionBox.endX - selectionBox.startX)}
                height={Math.abs(selectionBox.endY - selectionBox.startY)}
                fill="rgba(0, 102, 255, 0.1)"
                stroke="#0066FF"
                strokeWidth={2 / stageScale} // Keep consistent width at all zoom levels
                dash={[10 / stageScale, 5 / stageScale]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
        )}

        {/* Render remote cursors - convert canvas coords to screen coords */}
        {cursors.map((cursor) => {
          const stage = stageRef.current;
          if (!stage) return null;
          
          // Use LIVE stage values for accurate screen conversion
          const currentPos = stage.position();
          const currentScale = stage.scaleX();
          
          // Convert canvas coordinates to screen coordinates
          // Account for current pan (stage position) and zoom (stage scale)
          const screenX = cursor.x * currentScale + currentPos.x;
          const screenY = cursor.y * currentScale + currentPos.y;
          
          // Only render cursors within the visible workspace boundaries
          // Add some padding (50px) to keep labels visible near edges
          const isVisible = 
            screenX >= -50 && 
            screenX <= stageDimensions.width + 50 &&
            screenY >= -50 && 
            screenY <= stageDimensions.height + 50;
          
          if (!isVisible) return null;
          
          return (
            <UserCursor
              key={cursor.userId}
              cursor={{
                ...cursor,
                x: screenX,
                y: screenY,
              }}
            />
          );
        })}

        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            shape={contextMenu.shape}
            isOwner={isOwner}
            currentUserId={user?.uid}
            user={user}
            onOverride={handleOverrideControl}
            onCopy={handleCopy}
            onPaste={() => handlePaste(contextMenu.x, contextMenu.y)}
            onDuplicate={handleDuplicate}
            hasClipboardData={clipboard.length > 0}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
