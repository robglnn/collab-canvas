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
import AICommandBar from './AICommandBar';
import { AIBannerManager } from './AIBanner';
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Viewport state (position and scale)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  // Pan state
  const [isDragging, setIsDragging] = useState(false);
  
  // Place mode state
  const [placeMode, setPlaceMode] = useState(null); // null or 'rectangle'
  const [placeModeOptions, setPlaceModeOptions] = useState(null); // Options for place mode (e.g., lineWidth)
  
  // Line tool state
  const [lineStartPoint, setLineStartPoint] = useState(null); // First click point for line tool
  
  // Optimistic updates state (for instant UI feedback)
  const [optimisticUpdates, setOptimisticUpdates] = useState({}); // { shapeId: { updates } }
  
  // RTDB temp updates state (for sub-100ms sync to other users)
  const [tempUpdates, setTempUpdates] = useState({}); // { shapeId: { updates } }
  
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
  } = useCanvas();

  // Presence hook - to get user names for lock labels
  const { users } = usePresence(ownerId);
  
  // Get online user IDs from presence data (memoized to prevent infinite loops)
  const onlineUserIds = useMemo(() => {
    return users.filter(u => u.online).map(u => u.userId);
  }, [users]);
  
  // Cursors hook - pass online user IDs to filter cursors
  const { cursors, updateCursorPosition, removeCursor } = useCursors(onlineUserIds);

  // RTDB hook for temporary updates (sub-100ms sync)
  const { writeTempUpdate, subscribeTempUpdates, clearTempUpdate } = useRTDB('main');
  
  // Subscribe to RTDB temp updates from other users
  useEffect(() => {
    if (!user) return; // Only subscribe when user is authenticated
    
    const unsubscribe = subscribeTempUpdates((updates) => {
      setTempUpdates(updates);
    });
    
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - subscribeTempUpdates is stable

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
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  
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
   * Initialize canvas position - spawn user at center of canvas
   * Flexible for any canvas size and spawn point
   */
  useEffect(() => {
    if (!stageRef.current || isInitialized) return;

    const stage = stageRef.current;
    const container = stage.container();
    const viewportWidth = container.offsetWidth;
    const viewportHeight = container.offsetHeight;

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
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, SPAWN_CANVAS_X, SPAWN_CANVAS_Y, SPAWN_ZOOM, isInitialized, calculateStagePosition]);

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
        const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
        setClipboard(selectedShapes);
        console.log(`Copied ${selectedShapes.length} shape(s) to clipboard`);
      }
      
      // Paste shapes (Ctrl+V or Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();
        takeSnapshot(shapes); // Take snapshot before pasting
        const pastedShapes = clipboard.map(shape => ({
          ...shape,
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: shape.x + 20, // Offset by 20px
          y: shape.y + 20,
          lockedBy: null, // Clear lock
        }));
        
        pastedShapes.forEach(shape => addShape(shape));
        
        // Select the newly pasted shapes
        const newIds = pastedShapes.map(s => s.id);
        selectShape(newIds);
        
        console.log(`Pasted ${pastedShapes.length} shape(s)`);
      }
      
      // Duplicate shapes (Ctrl+D or Cmd+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedShapeIds.length > 0) {
        e.preventDefault();
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
  }, [selectedShapeIds, shapes, clipboard, deleteShape, addShape, selectShape, updateShape, canUndo, canRedo, undo, redo]);

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
        
        // Get line bounding box
        const xCoords = shape.points.filter((_, i) => i % 2 === 0);
        const yCoords = shape.points.filter((_, i) => i % 2 === 1);
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
   */
  const clampPosition = useCallback((pos, scale) => {
    const stage = stageRef.current;
    if (!stage) return pos;

    const container = stage.container();
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate the visible canvas bounds
    const maxX = 0;
    const minX = -(CANVAS_WIDTH * scale - containerWidth);
    const maxY = 0;
    const minY = -(CANVAS_HEIGHT * scale - containerHeight);

    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

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
    const oldScale = stageScale;
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

    // Update both scale and position
    setStageScale(clampedScale);
    setStagePos(clampedPos);
    }
    // Shift + Scroll = Pan left/right
    else if (evt.shiftKey) {
      const panSpeed = 1;
      const deltaX = evt.deltaY * panSpeed; // Use deltaY for horizontal panning
      
      const newPos = {
        x: stagePos.x - deltaX,
        y: stagePos.y
      };

      const clampedPos = clampPosition(newPos, stageScale);
      setStagePos(clampedPos);
    }
    // Plain Scroll = Pan up/down
    else {
      const panSpeed = 1;
      const deltaY = evt.deltaY * panSpeed;
      
      const newPos = {
        x: stagePos.x,
        y: stagePos.y - deltaY
      };

      const clampedPos = clampPosition(newPos, stageScale);
      setStagePos(clampedPos);
    }
  }, [stageScale, stagePos, clampPosition]);

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
      const newPos = {
        x: stage.x(),
        y: stage.y(),
      };

      const clampedPos = clampPosition(newPos, stageScale);
      setStagePos(clampedPos);
    }
  }, [stageScale, clampPosition]);

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

        const newShape = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          x: canvasPos.x,
          y: canvasPos.y,
          text: 'Double-click to edit',
          fontSize: 24,
          fontFamily: 'Arial',
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
            stroke: '#000000', // Black by default
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
   * Now with real-time RTDB updates for live collaborative dragging!
   */
  const handleShapeChange = (updatedShape) => {
    // Take snapshot before first change in a drag/transform session
    if (!dragSnapshotTakenRef.current) {
      takeSnapshot(shapes);
      dragSnapshotTakenRef.current = true;
    }
    
    // If this is a selected shape and multiple shapes are selected, move all together
    if (selectedShapeIds.includes(updatedShape.id) && selectedShapeIds.length > 1) {
      // Find the original shape to calculate delta
      const originalShape = shapes.find(s => s.id === updatedShape.id);
      if (originalShape) {
        const deltaX = updatedShape.x - originalShape.x;
        const deltaY = updatedShape.y - originalShape.y;

        // Update all selected shapes with the same delta
        selectedShapeIds.forEach(shapeId => {
          const shape = shapes.find(s => s.id === shapeId);
          if (shape) {
            const updates = {
              ...shape,
              x: shape.x + deltaX,
              y: shape.y + deltaY,
            };
            
            // 1. Optimistic local update (via updateShape)
            updateShape(shapeId, updates);
            
            // 2. Send to RTDB for real-time sync to other users (sub-100ms)
            writeTempUpdate(shapeId, { x: updates.x, y: updates.y });
          }
        });
      }
    } else {
      // Single shape update
      
      // 1. Optimistic local update
      updateShape(updatedShape.id, updatedShape);
      
      // 2. Send to RTDB for real-time sync to other users (sub-100ms)
      writeTempUpdate(updatedShape.id, { 
        x: updatedShape.x, 
        y: updatedShape.y,
        // Include other transform properties if they changed
        ...(updatedShape.width !== undefined && { width: updatedShape.width }),
        ...(updatedShape.height !== undefined && { height: updatedShape.height }),
        ...(updatedShape.rotation !== undefined && { rotation: updatedShape.rotation }),
        ...(updatedShape.scaleX !== undefined && { scaleX: updatedShape.scaleX }),
        ...(updatedShape.scaleY !== undefined && { scaleY: updatedShape.scaleY }),
      });
    }
  };

  /**
   * Handle drag/transform end - reset snapshot flag and clear RTDB temp updates
   */
  const handleDragEndComplete = useCallback((shapeId) => {
    dragSnapshotTakenRef.current = false;
    
    // Clear RTDB temp updates for this shape (and all selected shapes if multi-select)
    if (selectedShapeIds.length > 1) {
      selectedShapeIds.forEach(id => clearTempUpdate(id));
    } else if (shapeId) {
      clearTempUpdate(shapeId);
    }
  }, [selectedShapeIds, clearTempUpdate]);

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
        />
        <div className="canvas-loading">
          <div className="loading-spinner"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  // Apply optimistic updates and RTDB temp updates to shapes
  // Priority: optimisticUpdates (local) > tempUpdates (RTDB from others) > shapes (Firestore)
  const shapesWithOptimisticUpdates = shapes.map(shape => {
    const rtdbUpdate = tempUpdates[shape.id] || {};
    const localUpdate = optimisticUpdates[shape.id] || {};
    
    // Merge: base shape + RTDB updates + local optimistic updates
    return { 
      ...shape, 
      ...rtdbUpdate, // Apply RTDB temp updates from other users
      ...localUpdate // Apply local optimistic updates (highest priority)
    };
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
      >
        <AICommandBar 
          onSubmit={handleAISubmit} 
          isProcessing={isProcessing}
          showSuccess={lastResult?.success && !isProcessing}
          cooldownRemaining={cooldownRemaining}
          isOnCooldown={isOnCooldown}
        />
      </Toolbar>
      <AIBannerManager banners={aiBanners} onBannerClose={handleBannerClose} />
      <DisconnectBanner show={showDisconnectBanner} />
      
      <div className={`canvas-workspace ${placeMode ? 'place-mode' : ''}`}>
        <Stage
          ref={stageRef}
          width={window.innerWidth - 200} // Subtract toolbar width
          height={window.innerHeight - 60} // Subtract header height
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

        {/* Debug info */}
        <div className="canvas-debug">
          <div>Zoom: {(stageScale * 100).toFixed(0)}%</div>
          <div>Canvas Center: ({
            Math.round((window.innerWidth / 2 - stagePos.x) / stageScale)
          }, {
            Math.round((window.innerHeight / 2 - stagePos.y) / stageScale)
          })</div>
          <div>Cursor: ({cursorCanvasPosRef.current.x}, {cursorCanvasPosRef.current.y})</div>
          <div>Stage Offset: ({Math.round(stagePos.x)}, {Math.round(stagePos.y)})</div>
          <div>Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}px</div>
          <div>Shapes: {shapes.length} | Cursors: {cursors.length}</div>
          <div>Role: {isOwner ? 'Owner' : 'Collaborator'}</div>
          {selectedShapeIds.length > 0 && <div>Selected: {selectedShapeIds.length} shape(s)</div>}
        </div>

        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            shape={contextMenu.shape}
            isOwner={isOwner}
            currentUserId={user?.uid}
            onOverride={handleOverrideControl}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
