/**
 * AI Executor - Function Implementation
 * 
 * Executes AI function calls by interacting with canvas operations
 * Handles permission checks, error handling, and result generation
 */

/**
 * Execute a single AI function call
 * 
 * @param {string} functionName - Name of function to execute
 * @param {Object} args - Function arguments
 * @param {Object} context - Canvas context with shapes, hooks, user info, etc.
 * @returns {Promise<Object>} Execution result { success, message, data, errors }
 */
export async function executeFunction(functionName, args, context) {
  const { shapes, addShape, updateShape, deleteShape, selectShape, deselectShape, user, viewport } = context;

  try {
    switch (functionName) {
      case 'createShape':
        return await createShape(args, context);
      
      case 'moveShape':
        return await moveShape(args, context);
      
      case 'resizeShape':
        return await resizeShape(args, context);
      
      case 'rotateShape':
        return await rotateShape(args, context);
      
      case 'deleteShape':
        return await deleteShapeFunc(args, context);
      
      case 'updateText':
        return await updateText(args, context);
      
      case 'selectShapesByProperty':
        return await selectShapesByProperty(args, context);
      
      case 'deselectAll':
        return await deselectAll(args, context);
      
      case 'arrangeHorizontal':
        return await arrangeHorizontal(args, context);
      
      case 'arrangeVertical':
        return await arrangeVertical(args, context);
      
      case 'arrangeGrid':
        return await arrangeGrid(args, context);
      
      case 'alignShapes':
        return await alignShapes(args, context);
      
      case 'getCanvasInfo':
        return await getCanvasInfo(args, context);
      
      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}`,
          errors: [`Function ${functionName} is not implemented`]
        };
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return {
      success: false,
      message: `Error executing ${functionName}: ${error.message}`,
      errors: [error.message]
    };
  }
}

/**
 * Check if user can modify a shape
 */
function canModifyShape(shape, user) {
  // User can't modify shapes locked by others
  if (shape.lockedBy && shape.lockedBy !== user?.uid) {
    return false;
  }
  return true;
}

/**
 * Generate unique shape ID
 */
function generateShapeId() {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Resolve shape IDs, handling special keywords like "selected"
 * @param {Array<string>} shapeIds - Array of shape IDs or special keywords
 * @param {Object} context - Canvas context with shapes and selectedShapeIds
 * @returns {Array<string>} Resolved shape IDs
 */
function resolveShapeIds(shapeIds, context) {
  if (!shapeIds || !Array.isArray(shapeIds)) {
    return [];
  }

  const { shapes, selectedShapeIds } = context;
  const resolved = [];

  for (const id of shapeIds) {
    if (id === 'selected') {
      // Resolve to currently selected shapes
      if (selectedShapeIds && selectedShapeIds.length > 0) {
        resolved.push(...selectedShapeIds);
      }
    } else if (id === 'all') {
      // Resolve to all shapes
      resolved.push(...shapes.map(s => s.id));
    } else {
      // Regular shape ID
      resolved.push(id);
    }
  }

  // Remove duplicates
  return [...new Set(resolved)];
}

// ====== SHAPE CREATION ======

async function createShape(args, context) {
  const { shapeType, count = 1, x, y, width, height, radius, text, fontSize, arrangement, spacing = 20, gridRows, gridCols } = args;
  const { addShape, viewport, user } = context;

  // Default positions to viewport center if not specified
  const defaultX = x !== undefined ? x : viewport?.centerX || 2500;
  const defaultY = y !== undefined ? y : viewport?.centerY || 2500;

  const createdShapes = [];
  const commandId = Date.now().toString();

  // Determine shape dimensions for layout calculations
  let shapeWidth = width || (shapeType === 'rectangle' ? 100 : shapeType === 'circle' ? 100 : 200);
  let shapeHeight = height || (shapeType === 'rectangle' ? 100 : shapeType === 'circle' ? 100 : 50);
  
  if (shapeType === 'circle') {
    const r = radius || 50;
    shapeWidth = r * 2;
    shapeHeight = r * 2;
  }

  // Create shapes with automatic arrangement
  for (let i = 0; i < count; i++) {
    let posX = defaultX;
    let posY = defaultY;

    // Calculate position based on arrangement
    if (count > 1) {
      const defaultArrangement = arrangement || 'horizontal';
      
      if (defaultArrangement === 'horizontal') {
        posX = defaultX + i * (shapeWidth + spacing);
      } else if (defaultArrangement === 'vertical') {
        posY = defaultY + i * (shapeHeight + spacing);
      } else if (defaultArrangement === 'grid') {
        const cols = gridCols || Math.ceil(Math.sqrt(count));
        const rows = gridRows || Math.ceil(count / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);
        posX = defaultX + col * (shapeWidth + spacing);
        posY = defaultY + row * (shapeHeight + spacing);
      }
      // 'none' = all shapes at same position (stacked)
    }

    let newShape = {
      id: generateShapeId(),
      type: shapeType,
      x: posX,
      y: posY,
      rotation: 0,
      createdByAI: true,
      aiCommandId: commandId,
      createdBy: user?.uid,
    };

    // Add type-specific properties
    if (shapeType === 'rectangle') {
      newShape.width = width || 100;
      newShape.height = height || 100;
    } else if (shapeType === 'circle') {
      newShape.radius = radius || 50;
    } else if (shapeType === 'text') {
      newShape.text = text || 'Text';
      newShape.fontSize = fontSize || 24;
      newShape.width = width || 200;
      newShape.fontFamily = 'Arial';
      newShape.align = 'left';
    }

    await addShape(newShape);
    createdShapes.push(newShape);
  }

  const message = count === 1 
    ? `Created ${shapeType} at (${Math.round(defaultX)}, ${Math.round(defaultY)})`
    : `Created ${count} ${shapeType}${count > 1 ? 's' : ''} in ${arrangement || 'horizontal'} arrangement`;

  return {
    success: true,
    message,
    data: { 
      shapeIds: createdShapes.map(s => s.id),
      shapes: createdShapes,
      count: createdShapes.length
    }
  };
}

// ====== SHAPE MANIPULATION ======

async function moveShape(args, context) {
  const { shapeIds, x, y, deltaX, deltaY } = args;
  const { shapes, updateShape, user } = context;

  // Resolve special keywords like "selected"
  const resolvedIds = resolveShapeIds(shapeIds, context);

  if (resolvedIds.length === 0) {
    return {
      success: false,
      message: 'No shapes found to move',
      errors: ['No valid shape IDs provided or no shapes selected']
    };
  }

  const results = [];
  const errors = [];

  for (const shapeId of resolvedIds) {
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape) {
      errors.push(`Shape ${shapeId} not found`);
      continue;
    }

    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shapeId} is locked by another user`);
      continue;
    }

    let newX = shape.x;
    let newY = shape.y;

    // Absolute positioning
    if (x !== undefined) newX = x;
    if (y !== undefined) newY = y;

    // Relative positioning
    if (deltaX !== undefined) newX += deltaX;
    if (deltaY !== undefined) newY += deltaY;

    await updateShape(shapeId, {
      ...shape,
      x: newX,
      y: newY,
      updatedByAI: true,
      updatedBy: user?.uid
    });

    results.push(shapeId);
  }

  return {
    success: results.length > 0,
    message: `Moved ${results.length} shape(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    data: { movedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function resizeShape(args, context) {
  const { shapeIds, width, height, radius, scaleFactor } = args;
  const { shapes, updateShape, user } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  if (resolvedIds.length === 0) {
    return {
      success: false,
      message: 'No shapes found to resize',
      errors: ['No valid shape IDs provided or no shapes selected']
    };
  }

  const results = [];
  const errors = [];

  for (const shapeId of resolvedIds) {
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape) {
      errors.push(`Shape ${shapeId} not found`);
      continue;
    }

    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shapeId} is locked by another user`);
      continue;
    }

    const updates = { ...shape, updatedByAI: true, updatedBy: user?.uid };

    // Apply scale factor if provided
    if (scaleFactor !== undefined) {
      if (shape.type === 'rectangle') {
        updates.width = shape.width * scaleFactor;
        updates.height = shape.height * scaleFactor;
      } else if (shape.type === 'circle') {
        updates.radius = shape.radius * scaleFactor;
      } else if (shape.type === 'text') {
        updates.width = shape.width * scaleFactor;
        updates.fontSize = (shape.fontSize || 24) * scaleFactor;
      }
    }

    // Apply absolute dimensions
    if (width !== undefined && (shape.type === 'rectangle' || shape.type === 'text')) {
      updates.width = width;
    }
    if (height !== undefined && shape.type === 'rectangle') {
      updates.height = height;
    }
    if (radius !== undefined && shape.type === 'circle') {
      updates.radius = radius;
    }

    await updateShape(shapeId, updates);
    results.push(shapeId);
  }

  return {
    success: results.length > 0,
    message: `Resized ${results.length} shape(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    data: { resizedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function rotateShape(args, context) {
  const { shapeIds, rotation, deltaRotation } = args;
  const { shapes, updateShape, user } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  if (resolvedIds.length === 0) {
    return {
      success: false,
      message: 'No shapes found to rotate',
      errors: ['No valid shape IDs provided or no shapes selected']
    };
  }

  const results = [];
  const errors = [];

  for (const shapeId of resolvedIds) {
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape) {
      errors.push(`Shape ${shapeId} not found`);
      continue;
    }

    if (shape.type === 'text') {
      errors.push(`Cannot rotate text shapes`);
      continue;
    }

    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shapeId} is locked by another user`);
      continue;
    }

    let newRotation = shape.rotation || 0;

    if (rotation !== undefined) {
      newRotation = rotation % 360;
    } else if (deltaRotation !== undefined) {
      newRotation = (newRotation + deltaRotation) % 360;
    }

    await updateShape(shapeId, {
      ...shape,
      rotation: newRotation,
      updatedByAI: true,
      updatedBy: user?.uid
    });

    results.push(shapeId);
  }

  return {
    success: results.length > 0,
    message: `Rotated ${results.length} shape(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    data: { rotatedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function deleteShapeFunc(args, context) {
  const { shapeIds } = args;
  const { shapes, deleteShape, user } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  if (resolvedIds.length === 0) {
    return {
      success: false,
      message: 'No shapes found to delete',
      errors: ['No valid shape IDs provided or no shapes selected']
    };
  }

  const results = [];
  const errors = [];

  // Check permissions first
  const shapesToDelete = [];
  for (const shapeId of resolvedIds) {
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape) {
      errors.push(`Shape ${shapeId} not found`);
      continue;
    }

    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shapeId} is locked by another user`);
      continue;
    }

    shapesToDelete.push(shapeId);
  }

  // Delete all shapes in parallel for better performance
  if (shapesToDelete.length > 0) {
    try {
      await Promise.all(shapesToDelete.map(id => deleteShape(id)));
      results.push(...shapesToDelete);
    } catch (error) {
      console.error('Error deleting shapes:', error);
      errors.push('Some shapes failed to delete');
    }
  }

  return {
    success: results.length > 0,
    message: `Deleted ${results.length} shape(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    data: { deletedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function updateText(args, context) {
  const { shapeIds, text, fontSize } = args;
  const { shapes, updateShape, user } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  if (resolvedIds.length === 0) {
    return {
      success: false,
      message: 'No text shapes found to update',
      errors: ['No valid shape IDs provided or no shapes selected']
    };
  }

  const results = [];
  const errors = [];

  for (const shapeId of resolvedIds) {
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape) {
      errors.push(`Shape ${shapeId} not found`);
      continue;
    }

    if (shape.type !== 'text') {
      errors.push(`Shape ${shapeId} is not a text shape`);
      continue;
    }

    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shapeId} is locked by another user`);
      continue;
    }

    const updates = { ...shape, updatedByAI: true, updatedBy: user?.uid };
    if (text !== undefined) updates.text = text;
    if (fontSize !== undefined) updates.fontSize = fontSize;

    await updateShape(shapeId, updates);
    results.push(shapeId);
  }

  return {
    success: results.length > 0,
    message: `Updated ${results.length} text shape(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    data: { updatedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

// ====== SELECTION ======

async function selectShapesByProperty(args, context) {
  const { shapeType, limit, sortBy, sortOrder, minX, maxX, minY, maxY } = args;
  const { shapes, selectShape } = context;

  let filteredShapes = [...shapes];

  // Filter by type
  if (shapeType && shapeType !== 'all') {
    filteredShapes = filteredShapes.filter(s => s.type === shapeType);
  }

  // Filter by position
  if (minX !== undefined) filteredShapes = filteredShapes.filter(s => s.x >= minX);
  if (maxX !== undefined) filteredShapes = filteredShapes.filter(s => s.x <= maxX);
  if (minY !== undefined) filteredShapes = filteredShapes.filter(s => s.y >= minY);
  if (maxY !== undefined) filteredShapes = filteredShapes.filter(s => s.y <= maxY);

  // Sort shapes
  if (sortBy) {
    filteredShapes.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle special cases
      if (sortBy === 'size') {
        aVal = a.type === 'circle' ? a.radius * 2 : a.width || 0;
        bVal = b.type === 'circle' ? b.radius * 2 : b.width || 0;
      }

      if (sortOrder === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
  }

  // Apply limit
  if (limit && limit > 0) {
    filteredShapes = filteredShapes.slice(0, limit);
  }

  const shapeIds = filteredShapes.map(s => s.id);

  if (shapeIds.length > 0) {
    selectShape(shapeIds);
  }

  return {
    success: true,
    message: `Selected ${shapeIds.length} shape(s)`,
    data: { selectedShapeIds: shapeIds, shapes: filteredShapes }
  };
}

async function deselectAll(args, context) {
  const { deselectShape } = context;
  
  deselectShape();

  return {
    success: true,
    message: 'Deselected all shapes',
    data: {}
  };
}

// ====== LAYOUT COMMANDS ======

async function arrangeHorizontal(args, context) {
  const { shapeIds, startX, startY, spacing = 20 } = args;
  const { shapes, updateShape, user, viewport } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  const results = [];
  const errors = [];

  // Get shapes to arrange
  const shapesToArrange = resolvedIds.map(id => shapes.find(s => s.id === id)).filter(Boolean);

  if (shapesToArrange.length === 0) {
    return {
      success: false,
      message: 'No shapes found to arrange',
      errors: ['No valid shape IDs provided']
    };
  }

  const defaultStartX = startX !== undefined ? startX : shapesToArrange[0].x;
  const defaultStartY = startY !== undefined ? startY : shapesToArrange[0].y;

  let currentX = defaultStartX;

  for (const shape of shapesToArrange) {
    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shape.id} is locked`);
      continue;
    }

    const shapeWidth = shape.type === 'circle' ? shape.radius * 2 : shape.width || 100;

    await updateShape(shape.id, {
      ...shape,
      x: currentX,
      y: defaultStartY,
      updatedByAI: true,
      updatedBy: user?.uid
    });

    results.push(shape.id);
    currentX += shapeWidth + spacing;
  }

  return {
    success: results.length > 0,
    message: `Arranged ${results.length} shape(s) horizontally`,
    data: { arrangedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function arrangeVertical(args, context) {
  const { shapeIds, startX, startY, spacing = 20 } = args;
  const { shapes, updateShape, user, viewport } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  const results = [];
  const errors = [];

  const shapesToArrange = resolvedIds.map(id => shapes.find(s => s.id === id)).filter(Boolean);

  if (shapesToArrange.length === 0) {
    return {
      success: false,
      message: 'No shapes found to arrange',
      errors: ['No valid shape IDs provided']
    };
  }

  const defaultStartX = startX !== undefined ? startX : shapesToArrange[0].x;
  const defaultStartY = startY !== undefined ? startY : shapesToArrange[0].y;

  let currentY = defaultStartY;

  for (const shape of shapesToArrange) {
    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shape.id} is locked`);
      continue;
    }

    const shapeHeight = shape.type === 'circle' ? shape.radius * 2 : shape.height || shape.fontSize || 100;

    await updateShape(shape.id, {
      ...shape,
      x: defaultStartX,
      y: currentY,
      updatedByAI: true,
      updatedBy: user?.uid
    });

    results.push(shape.id);
    currentY += shapeHeight + spacing;
  }

  return {
    success: results.length > 0,
    message: `Arranged ${results.length} shape(s) vertically`,
    data: { arrangedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function arrangeGrid(args, context) {
  const { shapeIds, rows, cols, startX, startY, spacingX = 20, spacingY = 20 } = args;
  const { shapes, updateShape, user, viewport } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  const results = [];
  const errors = [];

  const shapesToArrange = resolvedIds.map(id => shapes.find(s => s.id === id)).filter(Boolean);

  if (shapesToArrange.length === 0) {
    return {
      success: false,
      message: 'No shapes found to arrange',
      errors: ['No valid shape IDs provided']
    };
  }

  const defaultStartX = startX !== undefined ? startX : viewport?.centerX - 200 || 2300;
  const defaultStartY = startY !== undefined ? startY : viewport?.centerY - 200 || 2300;

  // Estimate cell size based on first shape
  const firstShape = shapesToArrange[0];
  const cellWidth = (firstShape.type === 'circle' ? firstShape.radius * 2 : firstShape.width || 100) + spacingX;
  const cellHeight = (firstShape.type === 'circle' ? firstShape.radius * 2 : firstShape.height || firstShape.fontSize || 100) + spacingY;

  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index >= shapesToArrange.length) break;

      const shape = shapesToArrange[index];

      if (!canModifyShape(shape, user)) {
        errors.push(`Shape ${shape.id} is locked`);
        index++;
        continue;
      }

      const x = defaultStartX + col * cellWidth;
      const y = defaultStartY + row * cellHeight;

      await updateShape(shape.id, {
        ...shape,
        x,
        y,
        updatedByAI: true,
        updatedBy: user?.uid
      });

      results.push(shape.id);
      index++;
    }
  }

  return {
    success: results.length > 0,
    message: `Arranged ${results.length} shape(s) in ${rows}x${cols} grid`,
    data: { arrangedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

async function alignShapes(args, context) {
  const { shapeIds, alignment } = args;
  const { shapes, updateShape, user } = context;

  const resolvedIds = resolveShapeIds(shapeIds, context);

  const results = [];
  const errors = [];

  const shapesToAlign = resolvedIds.map(id => shapes.find(s => s.id === id)).filter(Boolean);

  if (shapesToAlign.length === 0) {
    return {
      success: false,
      message: 'No shapes found to align',
      errors: ['No valid shape IDs provided']
    };
  }

  // Calculate alignment reference (using first shape or group bounds)
  const firstShape = shapesToAlign[0];
  let referenceValue;

  if (alignment === 'left') {
    referenceValue = firstShape.x;
  } else if (alignment === 'right') {
    const firstWidth = firstShape.type === 'circle' ? firstShape.radius * 2 : firstShape.width || 100;
    referenceValue = firstShape.x + firstWidth;
  } else if (alignment === 'top') {
    referenceValue = firstShape.y;
  } else if (alignment === 'bottom') {
    const firstHeight = firstShape.type === 'circle' ? firstShape.radius * 2 : firstShape.height || firstShape.fontSize || 100;
    referenceValue = firstShape.y + firstHeight;
  } else if (alignment === 'center-horizontal') {
    referenceValue = firstShape.x + (firstShape.type === 'circle' ? 0 : (firstShape.width || 100) / 2);
  } else if (alignment === 'center-vertical') {
    referenceValue = firstShape.y + (firstShape.type === 'circle' ? 0 : (firstShape.height || firstShape.fontSize || 100) / 2);
  }

  for (const shape of shapesToAlign) {
    if (!canModifyShape(shape, user)) {
      errors.push(`Shape ${shape.id} is locked`);
      continue;
    }

    let newX = shape.x;
    let newY = shape.y;

    if (alignment === 'left') {
      newX = referenceValue;
    } else if (alignment === 'right') {
      const shapeWidth = shape.type === 'circle' ? shape.radius * 2 : shape.width || 100;
      newX = referenceValue - shapeWidth;
    } else if (alignment === 'top') {
      newY = referenceValue;
    } else if (alignment === 'bottom') {
      const shapeHeight = shape.type === 'circle' ? shape.radius * 2 : shape.height || shape.fontSize || 100;
      newY = referenceValue - shapeHeight;
    } else if (alignment === 'center-horizontal') {
      const shapeWidth = shape.type === 'circle' ? 0 : (shape.width || 100) / 2;
      newX = referenceValue - shapeWidth;
    } else if (alignment === 'center-vertical') {
      const shapeHeight = shape.type === 'circle' ? 0 : (shape.height || shape.fontSize || 100) / 2;
      newY = referenceValue - shapeHeight;
    }

    await updateShape(shape.id, {
      ...shape,
      x: newX,
      y: newY,
      updatedByAI: true,
      updatedBy: user?.uid
    });

    results.push(shape.id);
  }

  return {
    success: results.length > 0,
    message: `Aligned ${results.length} shape(s) to ${alignment}`,
    data: { alignedShapeIds: results },
    errors: errors.length > 0 ? errors : undefined
  };
}

// ====== QUERY COMMANDS ======

async function getCanvasInfo(args, context) {
  const { infoType } = args;
  const { shapes, selectedShapeIds } = context;

  let data = {};
  let message = '';

  if (infoType === 'count') {
    data.totalShapes = shapes.length;
    message = `Canvas has ${shapes.length} shape(s)`;
  } else if (infoType === 'types') {
    const typeCounts = {};
    shapes.forEach(shape => {
      typeCounts[shape.type] = (typeCounts[shape.type] || 0) + 1;
    });
    data.typeCounts = typeCounts;
    message = `Shape types: ${Object.entries(typeCounts).map(([type, count]) => `${count} ${type}(s)`).join(', ')}`;
  } else if (infoType === 'list') {
    data.shapes = shapes.map(s => ({
      id: s.id,
      type: s.type,
      x: Math.round(s.x),
      y: Math.round(s.y),
      ...(s.width && { width: Math.round(s.width) }),
      ...(s.height && { height: Math.round(s.height) }),
      ...(s.radius && { radius: Math.round(s.radius) }),
      ...(s.text && { text: s.text })
    }));
    message = `Retrieved ${shapes.length} shape details`;
  } else if (infoType === 'bounds') {
    if (shapes.length === 0) {
      data.bounds = null;
      message = 'Canvas is empty';
    } else {
      const xs = shapes.map(s => s.x);
      const ys = shapes.map(s => s.y);
      data.bounds = {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
      };
      message = `Canvas bounds: (${data.bounds.minX}, ${data.bounds.minY}) to (${data.bounds.maxX}, ${data.bounds.maxY})`;
    }
  } else if (infoType === 'selected') {
    const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
    data.selectedShapes = selectedShapes;
    data.selectedCount = selectedShapes.length;
    message = `${selectedShapes.length} shape(s) currently selected`;
  }

  return {
    success: true,
    message,
    data
  };
}

export default { executeFunction };

