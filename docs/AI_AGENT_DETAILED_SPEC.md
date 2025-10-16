# AI Canvas Agent - DETAILED Implementation Specification

## 📋 Document Purpose
This document contains the finalized, detailed implementation specifications for the AI Canvas Agent feature (PRs 26-29), including code examples, UI mockups, data flows, and technical implementation details.

---

## 🎨 UI Component: AI Command Bar

### Location & Layout
**Position:** Left toolbar, above "Rectangle" button, below color picker

**Expanded View (Default):**
```
┌──────────────────────────────────┐
│ 🤖 AI Assistant            [—] │ ← Collapsible header
├──────────────────────────────────┤
│ Type your command...        180  │ ← Input field + char count
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                     [Submit]  │ ← Submit button
└──────────────────────────────────┘
```

**Collapsed View:**
```
┌──────────────────────────────────┐
│ 🤖 AI Assistant            [+] │ ← Click to expand
└──────────────────────────────────┘
```

### Visual States

**1. Default State**
- Input: White background, gray placeholder text
- Submit button: Blue (#0066FF), "Submit" text
- Enabled, waiting for input

**2. Typing State**
- Input: White background, black text
- Character counter: Shows when >150 chars
  - Gray if ≤200 chars
  - Red if >200 chars (disable submit)
- Submit button: Blue, enabled

**3. Submitting State**
- Input: Disabled, gray background
- Submit button: Blue, loading spinner icon
- Cannot submit while processing

**4. Success State**
- Input: White background, cleared
- Submit button: Green (#00CC00), checkmark icon ✓
- Duration: 1 second, then return to default
- Input remains enabled for next command

**5. Error State**
- Input: Remains unchanged
- Submit button: Returns to default
- Error banner appears at top

**6. Rate Limited State**
- Input: Disabled, yellow background
- Submit button: Disabled, gray
- Timer shows: "Wait 3s..." (countdown)
- Re-enables after countdown

### CSS Implementation

**`src/components/AICommandBar.css`:**
```css
.ai-command-bar {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-command-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  user-select: none;
}

.ai-command-bar-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-command-bar-toggle {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.ai-command-bar-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-command-bar-content.collapsed {
  display: none;
}

.ai-command-input-wrapper {
  position: relative;
}

.ai-command-input {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  resize: none;
  transition: all 0.2s ease;
}

.ai-command-input:focus {
  outline: none;
  border-color: #0066FF;
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.ai-command-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.ai-command-input.rate-limited {
  background: #fff9e6;
  border-color: #ffcc00;
}

.ai-command-char-count {
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 11px;
  color: #999;
  pointer-events: none;
}

.ai-command-char-count.over-limit {
  color: #ff0000;
  font-weight: 600;
}

.ai-command-footer {
  display: flex;
  justify-content: flex-end;
}

.ai-command-submit {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ai-command-submit.default {
  background: #0066FF;
  color: white;
}

.ai-command-submit.default:hover {
  background: #0052CC;
}

.ai-command-submit.success {
  background: #00CC00;
  color: white;
}

.ai-command-submit.loading {
  background: #0066FF;
  color: white;
  cursor: wait;
}

.ai-command-submit:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

.ai-command-submit .spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-command-submit .checkmark {
  width: 16px;
  height: 16px;
}

.ai-rate-limit-timer {
  font-size: 12px;
  color: #ff9900;
  text-align: right;
  margin-top: 4px;
}
```

---

## 🎨 UI Component: AI Banner

### Location & Types
**Position:** Top of screen, below top bar, above canvas

**Banner Types:**

**1. Error Banner (Red)**
```
┌────────────────────────────────────────────────┐
│ ⚠️ Rate limit exceeded, wait 3 seconds    [×] │
└────────────────────────────────────────────────┘
```

**2. Warning Banner (Yellow)**
```
┌────────────────────────────────────────────────┐
│ ⏱️ Finishing previous agent prompt...     [×] │
└────────────────────────────────────────────────┘
```

**3. Info Banner (Blue)**
```
┌────────────────────────────────────────────────┐
│ ℹ️ Your prompt is #2 in queue             [×] │
└────────────────────────────────────────────────┘
```

**4. Success Banner (Green)**
```
┌────────────────────────────────────────────────┐
│ ✓ Created 3 shapes                        [×] │
└────────────────────────────────────────────────┘
```

### CSS Implementation

**`src/components/AIBanner.css`:**
```css
.ai-banner {
  position: fixed;
  top: 60px; /* Below top bar */
  left: 0;
  right: 0;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.ai-banner.error {
  background: #ff4444;
  color: white;
}

.ai-banner.warning {
  background: #ffcc00;
  color: #333;
}

.ai-banner.info {
  background: #0066FF;
  color: white;
}

.ai-banner.success {
  background: #00CC00;
  color: white;
}

.ai-banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-banner-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.ai-banner-close:hover {
  opacity: 1;
}
```

---

## 🔧 Implementation: OpenAI Integration

### File: `src/lib/openai.js`

```javascript
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Use server-side proxy in production
});

/**
 * Execute AI command with canvas context
 */
export async function executeAICommand(command, canvasContext) {
  const { shapes, viewport, selectedShapeIds, userId, userRole } = canvasContext;

  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(shapes, viewport, selectedShapeIds);

  // Build function schemas
  const functions = getCanvasFunctionSchemas();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command }
      ],
      functions: functions,
      function_call: 'auto',
      temperature: 0.2,
      max_tokens: 500,
      timeout: 2000 // 2 second timeout
    });

    // Parse function calls from response
    const functionCalls = parseFunctionCalls(response);

    return {
      success: true,
      functionCalls: functionCalls,
      message: response.choices[0].message.content
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Command timed out, please try again');
    }
    
    throw new Error('Could not understand command, please rephrase');
  }
}

/**
 * Build system prompt with canvas context
 */
function buildSystemPrompt(shapes, viewport, selectedShapeIds) {
  const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
  const usedColors = [...new Set(shapes.map(s => s.fill || s.stroke).filter(Boolean))];

  return `You are an AI assistant for a collaborative canvas application.

Current Canvas State:
- Total Shapes: ${shapes.length}
- Viewport Center: (${viewport.centerX}, ${viewport.centerY})
- Zoom Level: ${viewport.scale}x
- Selected Shapes: ${selectedShapes.length > 0 ? selectedShapes.map(s => `${s.type} (${s.id.slice(0, 8)})`).join(', ') : 'none'}
- Available Shape Types: rectangle, circle, text, line
- Used Colors: ${usedColors.length > 0 ? usedColors.join(', ') : 'none'}

Canvas Dimensions: 5000x5000px

Instructions:
- Execute the user's request using the available canvas functions
- Be concise and accurate
- If the request is ambiguous, make reasonable assumptions
- Use viewport center as reference for "center" commands
- For "create X shapes", distribute them evenly
- Default shape size: 100x100px for rectangles/circles
- Default text size: 16px
- When moving shapes, use absolute coordinates
- When modifying shapes, reference them by ID, color, or type

Respond with function calls to execute the command.`;
}

/**
 * Parse function calls from OpenAI response
 */
function parseFunctionCalls(response) {
  const message = response.choices[0].message;

  // Check if function_call is present (single function)
  if (message.function_call) {
    return [{
      name: message.function_call.name,
      arguments: JSON.parse(message.function_call.arguments)
    }];
  }

  // Check for multiple function calls in content
  // (GPT-4 may include multiple calls in the response)
  const calls = [];
  
  // Parse tool_calls if present (new format)
  if (message.tool_calls) {
    message.tool_calls.forEach(call => {
      calls.push({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments)
      });
    });
  }

  return calls;
}

export default openai;
```

### Environment Variables

**`.env.local`:**
```
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**`.env.example`:**
```
# OpenAI API Key for AI Canvas Agent
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🔧 Implementation: Canvas Function Schemas

### File: `src/lib/aiTools.js`

```javascript
/**
 * Define all canvas functions available to the AI
 */
export function getCanvasFunctionSchemas() {
  return [
    // Shape Creation
    {
      name: 'createShape',
      description: 'Create a new shape on the canvas',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'line'],
            description: 'Type of shape to create'
          },
          x: {
            type: 'number',
            description: 'X coordinate (0-5000)'
          },
          y: {
            type: 'number',
            description: 'Y coordinate (0-5000)'
          },
          width: {
            type: 'number',
            description: 'Width in pixels (default: 100)'
          },
          height: {
            type: 'number',
            description: 'Height in pixels (default: 100)'
          },
          fill: {
            type: 'string',
            description: 'Fill color as hex code (e.g., #FF0000)'
          },
          stroke: {
            type: 'string',
            description: 'Stroke color as hex code (for lines)'
          },
          strokeWidth: {
            type: 'number',
            description: 'Stroke width in pixels (for lines, default: 2)'
          },
          text: {
            type: 'string',
            description: 'Text content (for text shapes)'
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (for text, default: 16)'
          },
          rotation: {
            type: 'number',
            description: 'Rotation in degrees (0-360, default: 0)'
          }
        },
        required: ['type', 'x', 'y']
      }
    },

    // Shape Manipulation
    {
      name: 'moveShape',
      description: 'Move a shape to a new position',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to move'
          },
          x: {
            type: 'number',
            description: 'New X coordinate'
          },
          y: {
            type: 'number',
            description: 'New Y coordinate'
          }
        },
        required: ['shapeId', 'x', 'y']
      }
    },

    {
      name: 'resizeShape',
      description: 'Resize a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to resize'
          },
          width: {
            type: 'number',
            description: 'New width in pixels'
          },
          height: {
            type: 'number',
            description: 'New height in pixels'
          }
        },
        required: ['shapeId', 'width', 'height']
      }
    },

    {
      name: 'rotateShape',
      description: 'Rotate a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to rotate'
          },
          degrees: {
            type: 'number',
            description: 'Rotation in degrees (0-360)'
          }
        },
        required: ['shapeId', 'degrees']
      }
    },

    {
      name: 'changeShapeColor',
      description: 'Change the color of a shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to recolor'
          },
          color: {
            type: 'string',
            description: 'New color as hex code (e.g., #00FF00)'
          }
        },
        required: ['shapeId', 'color']
      }
    },

    {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to delete'
          }
        },
        required: ['shapeId']
      }
    },

    // Text Operations
    {
      name: 'updateText',
      description: 'Update the text content of a text shape',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the text shape'
          },
          newText: {
            type: 'string',
            description: 'New text content'
          }
        },
        required: ['shapeId', 'newText']
      }
    },

    // Selection Operations
    {
      name: 'selectShapesByProperty',
      description: 'Select shapes matching a property (color, type, etc.)',
      parameters: {
        type: 'object',
        properties: {
          property: {
            type: 'string',
            enum: ['type', 'fill', 'stroke'],
            description: 'Property to match'
          },
          value: {
            type: 'string',
            description: 'Value to match (e.g., "rectangle" or "#FF0000")'
          }
        },
        required: ['property', 'value']
      }
    },

    {
      name: 'deselectAll',
      description: 'Deselect all shapes',
      parameters: {
        type: 'object',
        properties: {}
      }
    },

    // Layout Operations
    {
      name: 'arrangeHorizontal',
      description: 'Arrange shapes in a horizontal row',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of shapes to arrange'
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)'
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate (default: use first shape)'
          },
          y: {
            type: 'number',
            description: 'Y coordinate for the row (default: use first shape)'
          }
        },
        required: ['shapeIds']
      }
    },

    {
      name: 'arrangeVertical',
      description: 'Arrange shapes in a vertical column',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of shapes to arrange'
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)'
          },
          x: {
            type: 'number',
            description: 'X coordinate for the column (default: use first shape)'
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate (default: use first shape)'
          }
        },
        required: ['shapeIds']
      }
    },

    {
      name: 'arrangeGrid',
      description: 'Arrange shapes in a grid pattern',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of shapes to arrange'
          },
          rows: {
            type: 'number',
            description: 'Number of rows'
          },
          cols: {
            type: 'number',
            description: 'Number of columns'
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)'
          },
          startX: {
            type: 'number',
            description: 'Starting X coordinate (default: viewport center)'
          },
          startY: {
            type: 'number',
            description: 'Starting Y coordinate (default: viewport center)'
          }
        },
        required: ['shapeIds', 'rows', 'cols']
      }
    },

    {
      name: 'alignShapes',
      description: 'Align shapes to a common edge or center',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of shapes to align'
          },
          alignment: {
            type: 'string',
            enum: ['left', 'right', 'top', 'bottom', 'center-horizontal', 'center-vertical'],
            description: 'Alignment type'
          }
        },
        required: ['shapeIds', 'alignment']
      }
    },

    // Query Operations
    {
      name: 'getCanvasInfo',
      description: 'Get information about the canvas (shape count, colors, etc.)',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            enum: ['count', 'colors', 'types', 'summary'],
            description: 'Type of information to retrieve'
          }
        },
        required: ['query']
      }
    }
  ];
}
```

---

## 🔧 Implementation: Function Executor

### File: `src/lib/aiExecutor.js`

```javascript
import { 
  addShape, 
  updateShape, 
  deleteShape 
} from './firestoreService';

/**
 * Execute AI function calls on the canvas
 */
export async function executeFunctions(functionCalls, context) {
  const { shapes, userId, selectedShapeIds, viewport, canModifyShape } = context;
  
  const results = {
    createdShapeIds: [],
    modifiedShapeIds: [],
    errors: [],
    summary: ''
  };

  for (const call of functionCalls) {
    try {
      const result = await executeFunction(call, context, shapes);
      
      if (result.createdShapeId) {
        results.createdShapeIds.push(result.createdShapeId);
      }
      
      if (result.modifiedShapeIds) {
        results.modifiedShapeIds.push(...result.modifiedShapeIds);
      }
      
      if (result.error) {
        results.errors.push(result.error);
      }
      
    } catch (error) {
      console.error(`Error executing ${call.name}:`, error);
      results.errors.push(error.message);
    }
  }

  // Generate summary
  results.summary = generateSummary(results);

  return results;
}

/**
 * Execute a single function
 */
async function executeFunction(call, context, shapes) {
  const { name, arguments: args } = call;
  const { userId, canModifyShape } = context;

  switch (name) {
    case 'createShape':
      return await createShape(args, userId);

    case 'moveShape':
      return await moveShape(args, shapes, canModifyShape);

    case 'resizeShape':
      return await resizeShape(args, shapes, canModifyShape);

    case 'rotateShape':
      return await rotateShape(args, shapes, canModifyShape);

    case 'changeShapeColor':
      return await changeShapeColor(args, shapes, canModifyShape);

    case 'deleteShape':
      return await deleteShapeById(args, shapes, canModifyShape);

    case 'updateText':
      return await updateText(args, shapes, canModifyShape);

    case 'selectShapesByProperty':
      return selectShapesByProperty(args, shapes, context);

    case 'deselectAll':
      return deselectAll(context);

    case 'arrangeHorizontal':
      return await arrangeHorizontal(args, shapes, canModifyShape);

    case 'arrangeVertical':
      return await arrangeVertical(args, shapes, canModifyShape);

    case 'arrangeGrid':
      return await arrangeGrid(args, shapes, canModifyShape);

    case 'alignShapes':
      return await alignShapes(args, shapes, canModifyShape);

    case 'getCanvasInfo':
      return getCanvasInfo(args, shapes);

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

/**
 * Create shape implementation
 */
async function createShape(args, userId) {
  const { type, x, y, width, height, fill, stroke, strokeWidth, text, fontSize, rotation } = args;

  const shapeData = {
    type,
    x,
    y,
    width: width || 100,
    height: height || 100,
    fill: fill || '#000000',
    stroke: stroke || null,
    strokeWidth: strokeWidth || 2,
    rotation: rotation || 0,
    createdBy: userId,
    createdByAI: true,
    lockedBy: null
  };

  // Add text-specific properties
  if (type === 'text') {
    shapeData.text = text || 'Text';
    shapeData.fontSize = fontSize || 16;
    shapeData.fontFamily = 'Arial';
  }

  const shapeId = await addShape('main', shapeData);

  return {
    createdShapeId: shapeId
  };
}

/**
 * Move shape implementation
 */
async function moveShape(args, shapes, canModifyShape) {
  const { shapeId, x, y } = args;
  const shape = shapes.find(s => s.id === shapeId);

  if (!shape) {
    return { error: `Shape ${shapeId} not found` };
  }

  if (!canModifyShape(shape)) {
    return { error: `Cannot modify shape (locked by another user)` };
  }

  await updateShape('main', shapeId, { x, y, updatedByAI: true });

  return {
    modifiedShapeIds: [shapeId]
  };
}

/**
 * Resize shape implementation
 */
async function resizeShape(args, shapes, canModifyShape) {
  const { shapeId, width, height } = args;
  const shape = shapes.find(s => s.id === shapeId);

  if (!shape) {
    return { error: `Shape ${shapeId} not found` };
  }

  if (!canModifyShape(shape)) {
    return { error: `Cannot modify shape (locked by another user)` };
  }

  await updateShape('main', shapeId, { width, height, updatedByAI: true });

  return {
    modifiedShapeIds: [shapeId]
  };
}

/**
 * Rotate shape implementation
 */
async function rotateShape(args, shapes, canModifyShape) {
  const { shapeId, degrees } = args;
  const shape = shapes.find(s => s.id === shapeId);

  if (!shape) {
    return { error: `Shape ${shapeId} not found` };
  }

  if (!canModifyShape(shape)) {
    return { error: `Cannot modify shape (locked by another user)` };
  }

  await updateShape('main', shapeId, { rotation: degrees, updatedByAI: true });

  return {
    modifiedShapeIds: [shapeId]
  };
}

/**
 * Change shape color implementation
 */
async function changeShapeColor(args, shapes, canModifyShape) {
  const { shapeId, color } = args;
  const shape = shapes.find(s => s.id === shapeId);

  if (!shape) {
    return { error: `Shape ${shapeId} not found` };
  }

  if (!canModifyShape(shape)) {
    return { error: `Cannot modify shape (locked by another user)` };
  }

  const updateData = { updatedByAI: true };
  
  if (shape.type === 'line') {
    updateData.stroke = color;
  } else {
    updateData.fill = color;
  }

  await updateShape('main', shapeId, updateData);

  return {
    modifiedShapeIds: [shapeId]
  };
}

/**
 * Delete shape implementation
 */
async function deleteShapeById(args, shapes, canModifyShape) {
  const { shapeId } = args;
  const shape = shapes.find(s => s.id === shapeId);

  if (!shape) {
    return { error: `Shape ${shapeId} not found` };
  }

  if (!canModifyShape(shape)) {
    return { error: `Cannot modify shape (locked by another user)` };
  }

  await deleteShape('main', shapeId);

  return {
    modifiedShapeIds: [shapeId]
  };
}

/**
 * Update text implementation
 */
async function updateText(args, shapes, canModifyShape) {
  const { shapeId, newText } = args;
  const shape = shapes.find(s => s.id === shapeId);

  if (!shape) {
    return { error: `Shape ${shapeId} not found` };
  }

  if (shape.type !== 'text') {
    return { error: `Shape ${shapeId} is not a text shape` };
  }

  if (!canModifyShape(shape)) {
    return { error: `Cannot modify shape (locked by another user)` };
  }

  await updateShape('main', shapeId, { text: newText, updatedByAI: true });

  return {
    modifiedShapeIds: [shapeId]
  };
}

/**
 * Select shapes by property
 */
function selectShapesByProperty(args, shapes, context) {
  const { property, value } = args;
  const { setSelectedShapeIds } = context;

  const matchingShapes = shapes.filter(shape => {
    if (property === 'type') {
      return shape.type === value;
    } else if (property === 'fill') {
      return shape.fill === value;
    } else if (property === 'stroke') {
      return shape.stroke === value;
    }
    return false;
  });

  const shapeIds = matchingShapes.map(s => s.id);
  setSelectedShapeIds(shapeIds);

  return {
    modifiedShapeIds: [],
    summary: `Selected ${shapeIds.length} shapes`
  };
}

/**
 * Deselect all shapes
 */
function deselectAll(context) {
  const { setSelectedShapeIds } = context;
  setSelectedShapeIds([]);

  return {
    modifiedShapeIds: [],
    summary: 'Deselected all shapes'
  };
}

/**
 * Arrange shapes horizontally
 */
async function arrangeHorizontal(args, shapes, canModifyShape) {
  const { shapeIds, spacing = 20, startX, y } = args;
  
  const targetShapes = shapes.filter(s => shapeIds.includes(s.id));
  if (targetShapes.length === 0) {
    return { error: 'No shapes found to arrange' };
  }

  // Check permissions
  const cannotModify = targetShapes.filter(s => !canModifyShape(s));
  if (cannotModify.length > 0) {
    return { error: `Cannot modify ${cannotModify.length} locked shapes` };
  }

  let currentX = startX !== undefined ? startX : targetShapes[0].x;
  const rowY = y !== undefined ? y : targetShapes[0].y;

  const modifiedIds = [];

  for (const shape of targetShapes) {
    await updateShape('main', shape.id, { x: currentX, y: rowY, updatedByAI: true });
    currentX += shape.width + spacing;
    modifiedIds.push(shape.id);
  }

  return {
    modifiedShapeIds: modifiedIds
  };
}

/**
 * Arrange shapes vertically
 */
async function arrangeVertical(args, shapes, canModifyShape) {
  const { shapeIds, spacing = 20, x, startY } = args;
  
  const targetShapes = shapes.filter(s => shapeIds.includes(s.id));
  if (targetShapes.length === 0) {
    return { error: 'No shapes found to arrange' };
  }

  // Check permissions
  const cannotModify = targetShapes.filter(s => !canModifyShape(s));
  if (cannotModify.length > 0) {
    return { error: `Cannot modify ${cannotModify.length} locked shapes` };
  }

  const colX = x !== undefined ? x : targetShapes[0].x;
  let currentY = startY !== undefined ? startY : targetShapes[0].y;

  const modifiedIds = [];

  for (const shape of targetShapes) {
    await updateShape('main', shape.id, { x: colX, y: currentY, updatedByAI: true });
    currentY += shape.height + spacing;
    modifiedIds.push(shape.id);
  }

  return {
    modifiedShapeIds: modifiedIds
  };
}

/**
 * Arrange shapes in a grid
 */
async function arrangeGrid(args, shapes, canModifyShape) {
  const { shapeIds, rows, cols, spacing = 20, startX, startY } = args;
  
  const targetShapes = shapes.filter(s => shapeIds.includes(s.id));
  if (targetShapes.length === 0) {
    return { error: 'No shapes found to arrange' };
  }

  // Check permissions
  const cannotModify = targetShapes.filter(s => !canModifyShape(s));
  if (cannotModify.length > 0) {
    return { error: `Cannot modify ${cannotModify.length} locked shapes` };
  }

  const gridStartX = startX !== undefined ? startX : targetShapes[0].x;
  const gridStartY = startY !== undefined ? startY : targetShapes[0].y;

  const modifiedIds = [];

  for (let i = 0; i < targetShapes.length; i++) {
    const shape = targetShapes[i];
    const row = Math.floor(i / cols);
    const col = i % cols;

    const x = gridStartX + (col * (shape.width + spacing));
    const y = gridStartY + (row * (shape.height + spacing));

    await updateShape('main', shape.id, { x, y, updatedByAI: true });
    modifiedIds.push(shape.id);
  }

  return {
    modifiedShapeIds: modifiedIds
  };
}

/**
 * Align shapes
 */
async function alignShapes(args, shapes, canModifyShape) {
  const { shapeIds, alignment } = args;
  
  const targetShapes = shapes.filter(s => shapeIds.includes(s.id));
  if (targetShapes.length < 2) {
    return { error: 'Need at least 2 shapes to align' };
  }

  // Check permissions
  const cannotModify = targetShapes.filter(s => !canModifyShape(s));
  if (cannotModify.length > 0) {
    return { error: `Cannot modify ${cannotModify.length} locked shapes` };
  }

  const modifiedIds = [];

  switch (alignment) {
    case 'left': {
      const leftMost = Math.min(...targetShapes.map(s => s.x));
      for (const shape of targetShapes) {
        await updateShape('main', shape.id, { x: leftMost, updatedByAI: true });
        modifiedIds.push(shape.id);
      }
      break;
    }

    case 'right': {
      const rightMost = Math.max(...targetShapes.map(s => s.x + s.width));
      for (const shape of targetShapes) {
        await updateShape('main', shape.id, { x: rightMost - shape.width, updatedByAI: true });
        modifiedIds.push(shape.id);
      }
      break;
    }

    case 'top': {
      const topMost = Math.min(...targetShapes.map(s => s.y));
      for (const shape of targetShapes) {
        await updateShape('main', shape.id, { y: topMost, updatedByAI: true });
        modifiedIds.push(shape.id);
      }
      break;
    }

    case 'bottom': {
      const bottomMost = Math.max(...targetShapes.map(s => s.y + s.height));
      for (const shape of targetShapes) {
        await updateShape('main', shape.id, { y: bottomMost - shape.height, updatedByAI: true });
        modifiedIds.push(shape.id);
      }
      break;
    }

    case 'center-horizontal': {
      const avgX = targetShapes.reduce((sum, s) => sum + s.x + s.width / 2, 0) / targetShapes.length;
      for (const shape of targetShapes) {
        await updateShape('main', shape.id, { x: avgX - shape.width / 2, updatedByAI: true });
        modifiedIds.push(shape.id);
      }
      break;
    }

    case 'center-vertical': {
      const avgY = targetShapes.reduce((sum, s) => sum + s.y + s.height / 2, 0) / targetShapes.length;
      for (const shape of targetShapes) {
        await updateShape('main', shape.id, { y: avgY - shape.height / 2, updatedByAI: true });
        modifiedIds.push(shape.id);
      }
      break;
    }
  }

  return {
    modifiedShapeIds: modifiedIds
  };
}

/**
 * Get canvas info
 */
function getCanvasInfo(args, shapes) {
  const { query } = args;

  switch (query) {
    case 'count':
      return {
        modifiedShapeIds: [],
        summary: `There are ${shapes.length} shapes on the canvas`
      };

    case 'colors': {
      const colors = [...new Set(shapes.map(s => s.fill || s.stroke).filter(Boolean))];
      return {
        modifiedShapeIds: [],
        summary: `Colors used: ${colors.join(', ')}`
      };
    }

    case 'types': {
      const types = shapes.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {});
      const summary = Object.entries(types).map(([type, count]) => `${count} ${type}s`).join(', ');
      return {
        modifiedShapeIds: [],
        summary: `Shapes: ${summary}`
      };
    }

    case 'summary':
      return {
        modifiedShapeIds: [],
        summary: `Canvas has ${shapes.length} shapes`
      };

    default:
      return {
        modifiedShapeIds: [],
        summary: 'Unknown query'
      };
  }
}

/**
 * Generate summary message
 */
function generateSummary(results) {
  const parts = [];

  if (results.createdShapeIds.length > 0) {
    parts.push(`Created ${results.createdShapeIds.length} shape${results.createdShapeIds.length === 1 ? '' : 's'}`);
  }

  if (results.modifiedShapeIds.length > 0) {
    parts.push(`Modified ${results.modifiedShapeIds.length} shape${results.modifiedShapeIds.length === 1 ? '' : 's'}`);
  }

  if (results.errors.length > 0) {
    parts.push(`${results.errors.length} error${results.errors.length === 1 ? '' : 's'}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Command executed';
}
```

---

## 🔧 Implementation: Rate Limiting Hook

### File: `src/hooks/useAIRateLimit.js`

```javascript
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const USER_RATE_LIMIT_MS = 5000; // 5 seconds per user
const CANVAS_RATE_LIMIT_PER_MINUTE = 300;

/**
 * Hook to manage AI rate limiting
 */
export function useAIRateLimit(userId) {
  const [canSubmit, setCanSubmit] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Check if user can submit a command
   */
  const checkRateLimit = async () => {
    try {
      // Check user rate limit
      const userLimitRef = doc(db, 'canvases', 'main', 'aiRateLimits', userId);
      const userLimitDoc = await getDoc(userLimitRef);

      if (userLimitDoc.exists()) {
        const data = userLimitDoc.data();
        const lastCommandTime = data.lastCommandTime?.toMillis() || 0;
        const timeSinceLastCommand = Date.now() - lastCommandTime;

        if (timeSinceLastCommand < USER_RATE_LIMIT_MS) {
          const remaining = Math.ceil((USER_RATE_LIMIT_MS - timeSinceLastCommand) / 1000);
          throw new Error(`Rate limit exceeded, wait ${remaining} second${remaining === 1 ? '' : 's'}`);
        }
      }

      // Check canvas rate limit
      const canvasLimitRef = doc(db, 'canvases', 'main', 'aiRateLimits', 'canvas');
      const canvasLimitDoc = await getDoc(canvasLimitRef);

      if (canvasLimitDoc.exists()) {
        const data = canvasLimitDoc.data();
        const resetAt = data.resetAt?.toMillis() || 0;
        const now = Date.now();

        let commandCount = data.totalCommands || 0;

        // Reset counter if past reset time
        if (now > resetAt) {
          commandCount = 0;
        }

        if (commandCount >= CANVAS_RATE_LIMIT_PER_MINUTE) {
          throw new Error('Canvas AI limit reached, try again in a moment');
        }
      }

      return true;

    } catch (error) {
      throw error;
    }
  };

  /**
   * Record command submission
   */
  const recordCommand = async () => {
    const now = Date.now();

    // Update user rate limit
    const userLimitRef = doc(db, 'canvases', 'main', 'aiRateLimits', userId);
    await setDoc(userLimitRef, {
      userId,
      lastCommandTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update canvas rate limit
    const canvasLimitRef = doc(db, 'canvases', 'main', 'aiRateLimits', 'canvas');
    const canvasLimitDoc = await getDoc(canvasLimitRef);

    let commandCount = 1;
    let resetAt = now + 60000; // 1 minute from now

    if (canvasLimitDoc.exists()) {
      const data = canvasLimitDoc.data();
      const existingResetAt = data.resetAt?.toMillis() || 0;

      if (now < existingResetAt) {
        commandCount = (data.totalCommands || 0) + 1;
        resetAt = existingResetAt;
      }
    }

    await setDoc(canvasLimitRef, {
      totalCommands: commandCount,
      resetAt: new Date(resetAt),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Start cooldown timer
    startCooldownTimer();
  };

  /**
   * Start cooldown timer
   */
  const startCooldownTimer = () => {
    setCanSubmit(false);
    setWaitTime(5);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setWaitTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return {
    canSubmit,
    waitTime,
    checkRateLimit,
    recordCommand
  };
}
```

---

## 🔧 Implementation: Queue Hook

### File: `src/hooks/useAIQueue.js`

```javascript
import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const MAX_QUEUE_SIZE = 10;
const COMMAND_TIMEOUT_MS = 2000;

/**
 * Hook to manage AI command queue
 */
export function useAIQueue(userId) {
  const [queuePosition, setQueuePosition] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCommandId, setCurrentCommandId] = useState(null);
  const processingRef = useRef(false);

  useEffect(() => {
    // Subscribe to queue
    const queueRef = collection(db, 'canvases', 'main', 'aiCommands');
    const q = query(
      queueRef, 
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commands = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter pending commands
      const pending = commands.filter(c => c.status === 'pending');

      // Find user's position in queue
      const userCommandIndex = pending.findIndex(c => c.userId === userId);
      if (userCommandIndex >= 0) {
        setQueuePosition(userCommandIndex + 1);
      } else {
        setQueuePosition(null);
      }

      // Process next command if not already processing
      if (!processingRef.current && pending.length > 0) {
        processNextCommand(pending[0]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  /**
   * Add command to queue
   */
  const addToQueue = async (command, userName) => {
    try {
      // Check queue size
      const queueRef = collection(db, 'canvases', 'main', 'aiCommands');
      const q = query(queueRef, orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      const pendingCount = snapshot.docs.filter(doc => 
        doc.data().status === 'pending'
      ).length;

      if (pendingCount >= MAX_QUEUE_SIZE) {
        throw new Error('AI queue is full, try again shortly');
      }

      // Add to queue
      const docRef = await addDoc(queueRef, {
        userId,
        userName,
        command,
        status: 'pending',
        createdShapeIds: [],
        modifiedShapeIds: [],
        error: null,
        timestamp: serverTimestamp(),
        queuePosition: pendingCount + 1
      });

      setCurrentCommandId(docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  };

  /**
   * Process next command in queue
   */
  const processNextCommand = async (commandData) => {
    if (processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);

    const commandRef = doc(db, 'canvases', 'main', 'aiCommands', commandData.id);

    try {
      // Update status to processing
      await updateDoc(commandRef, {
        status: 'processing',
        startedAt: serverTimestamp()
      });

      // Set timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Command timed out')), COMMAND_TIMEOUT_MS)
      );

      // Execute command (this will be implemented in main AI hook)
      // For now, just mark as completed
      await Promise.race([
        executeCommand(commandData),
        timeoutPromise
      ]);

      // Update status to completed
      await updateDoc(commandRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Delete after 5 seconds
      setTimeout(async () => {
        await deleteDoc(commandRef);
      }, 5000);

    } catch (error) {
      console.error('Error processing command:', error);

      // Update status to failed
      await updateDoc(commandRef, {
        status: 'failed',
        error: error.message,
        completedAt: serverTimestamp()
      });

      // Delete after 5 seconds
      setTimeout(async () => {
        await deleteDoc(commandRef);
      }, 5000);

    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      
      if (commandData.userId === userId) {
        setCurrentCommandId(null);
      }
    }
  };

  /**
   * Execute command (placeholder - will be implemented in main AI hook)
   */
  const executeCommand = async (commandData) => {
    // This will be implemented in useAI hook
    console.log('Executing command:', commandData);
  };

  /**
   * Cancel command
   */
  const cancelCommand = async (commandId) => {
    try {
      const commandRef = doc(db, 'canvases', 'main', 'aiCommands', commandId);
      await deleteDoc(commandRef);
      setCurrentCommandId(null);
    } catch (error) {
      console.error('Error canceling command:', error);
    }
  };

  return {
    queuePosition,
    isProcessing,
    currentCommandId,
    addToQueue,
    cancelCommand
  };
}
```

---

## 📊 Data Flow Diagram

```
User Types Command
       ↓
AICommandBar Component
       ↓
Validate Input (200 char limit)
       ↓
Check Rate Limit (useAIRateLimit)
   ↓ PASS    ↓ FAIL
   |         └→ Show Error Banner
   ↓
Add to Queue (useAIQueue)
   ↓ FULL    ↓ SUCCESS
   |         └→ Show "Waiting" Banner
   └→ Error
       ↓
Wait for Turn in Queue
       ↓
Process Command (when first in queue)
       ↓
Send to OpenAI (lib/openai.js)
       ↓
Receive Function Calls
       ↓
Execute Functions (lib/aiExecutor.js)
   ↓ LOCKED   ↓ SUCCESS
   |          └→ Create/Modify Shapes
   └→ Skip     ↓
       ↓      Write to Firestore
       ↓       ↓
       └→ Partial Success
              ↓
       Firestore Listeners
              ↓
       Sync to All Users
              ↓
       Show Success Banner
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Rate limit logic (per-user, per-canvas)
- [ ] Queue management (add, process, timeout)
- [ ] Function schema validation
- [ ] Command parsing
- [ ] Shape permission checks

### Integration Tests
- [ ] OpenAI API calls
- [ ] Function execution
- [ ] Firestore writes/reads
- [ ] Real-time sync

### Manual Testing Scenarios

#### Single User Tests
- [ ] Create rectangle with color
- [ ] Create circle at specific position
- [ ] Create text with content
- [ ] Move shape by description
- [ ] Resize shape
- [ ] Rotate shape
- [ ] Change shape color
- [ ] Delete shape
- [ ] Select shapes by property
- [ ] Arrange shapes in row/column/grid
- [ ] Align shapes
- [ ] Query canvas info
- [ ] Submit 200+ character command (rejected)
- [ ] Submit command while rate limited
- [ ] Undo AI command
- [ ] Complex command (login form, nav bar)

#### Multi-User Tests (2+ browsers)
- [ ] Both users submit commands simultaneously
- [ ] Verify queue works (first-come-first-served)
- [ ] Test canvas rate limit (300/minute)
- [ ] Verify shapes sync to all users
- [ ] Test locked shape interaction
- [ ] Owner override AI command on locked shape

#### Performance Tests
- [ ] Command latency <2 seconds
- [ ] Queue processing <100ms between commands
- [ ] Timeout after 2 seconds
- [ ] Canvas with 50+ shapes

#### Error Handling Tests
- [ ] Ambiguous command
- [ ] Impossible command (move non-existent shape)
- [ ] Locked shape modification
- [ ] Rate limit exceeded
- [ ] Queue full
- [ ] OpenAI API failure
- [ ] Network timeout

---

## 🚀 Deployment Checklist

### Environment Setup
- [ ] Add OpenAI API key to `.env.local`
- [ ] Update `.env.example` with new variables
- [ ] Add API key to Firebase Hosting environment

### Firestore Rules
- [ ] Add rules for `aiCommands` collection
- [ ] Add rules for `aiRateLimits` collection
- [ ] Test rules in emulator
- [ ] Deploy rules to production

### Dependencies
- [ ] Install `openai` package: `npm install openai`
- [ ] Update `package.json`
- [ ] Test build: `npm run build`

### Firebase Deploy
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy hosting: `firebase deploy --only hosting`
- [ ] Test deployed version

### Monitoring
- [ ] Monitor OpenAI API usage
- [ ] Track rate limit hits
- [ ] Monitor command success rate
- [ ] Check average latency

---

## 📝 Future Enhancements (Out of Scope for MVP)

- Command history panel
- Re-run previous commands
- Command templates/macros
- Voice input support
- AI suggestions/autocomplete
- Learning from user corrections
- Preview mode before execution
- Complex multi-step wizards
- Custom function creation
- AI-powered design suggestions

---

## 🎯 Success Criteria Summary

**Must Have:**
- ✅ 6+ command types supported
- ✅ <2 second latency
- ✅ Rate limiting works (5s per user, 300/min per canvas)
- ✅ Queue prevents conflicts
- ✅ Multi-user AI works seamlessly
- ✅ Undo integration works
- ✅ Clear error messages
- ✅ Respects shape locks

**Nice to Have:**
- Natural language variations
- Smart defaults
- Smooth animations
- AI error corrections

---

## 📚 Code Examples: Complex Commands

### Login Form Command
```javascript
// User: "Create a login form"
// AI generates:
[
  { name: 'createShape', arguments: { type: 'text', x: 2500, y: 2200, text: 'Username:', fontSize: 16, fill: '#000000' } },
  { name: 'createShape', arguments: { type: 'rectangle', x: 2500, y: 2230, width: 200, height: 30, fill: '#FFFFFF', stroke: '#CCCCCC', strokeWidth: 1 } },
  { name: 'createShape', arguments: { type: 'text', x: 2500, y: 2280, text: 'Password:', fontSize: 16, fill: '#000000' } },
  { name: 'createShape', arguments: { type: 'rectangle', x: 2500, y: 2310, width: 200, height: 30, fill: '#FFFFFF', stroke: '#CCCCCC', strokeWidth: 1 } },
  { name: 'createShape', arguments: { type: 'rectangle', x: 2500, y: 2360, width: 200, height: 40, fill: '#0066FF' } },
  { name: 'createShape', arguments: { type: 'text', x: 2570, y: 2372, text: 'Submit', fontSize: 16, fill: '#FFFFFF' } }
]
```

### Nav Bar Command
```javascript
// User: "Build a navigation bar with 4 menu items"
// AI generates:
[
  { name: 'createShape', arguments: { type: 'rectangle', x: 2000, y: 2000, width: 800, height: 60, fill: '#333333' } },
  { name: 'createShape', arguments: { type: 'text', x: 2050, y: 2025, text: 'Home', fontSize: 16, fill: '#FFFFFF' } },
  { name: 'createShape', arguments: { type: 'text', x: 2250, y: 2025, text: 'About', fontSize: 16, fill: '#FFFFFF' } },
  { name: 'createShape', arguments: { type: 'text', x: 2450, y: 2025, text: 'Services', fontSize: 16, fill: '#FFFFFF' } },
  { name: 'createShape', arguments: { type: 'text', x: 2650, y: 2025, text: 'Contact', fontSize: 16, fill: '#FFFFFF' } }
]
```

### Grid Command
```javascript
// User: "Create a 3x3 grid of 50px squares"
// AI generates:
[
  { name: 'createShape', arguments: { type: 'rectangle', x: 2400, y: 2400, width: 50, height: 50, fill: '#0066FF' } },
  // ... (creates 9 shapes)
  { name: 'arrangeGrid', arguments: { shapeIds: [...all 9 IDs...], rows: 3, cols: 3, spacing: 20, startX: 2400, startY: 2400 } }
]
```


