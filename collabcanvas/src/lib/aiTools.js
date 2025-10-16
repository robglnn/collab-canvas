/**
 * AI Tools - OpenAI Function Schemas
 * 
 * Defines all function schemas available to the AI agent
 * Each schema describes a canvas operation the AI can perform
 */

export const aiTools = [
  // ====== SHAPE CREATION ======
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create one or more shapes on the canvas (rectangle, circle, or text). Use count for multiple shapes.',
      parameters: {
        type: 'object',
        properties: {
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text'],
            description: 'Type of shape to create'
          },
          count: {
            type: 'number',
            description: 'Number of shapes to create (default: 1). For "5 squares", use count: 5',
            default: 1
          },
          x: {
            type: 'number',
            description: 'X position (0-5000). Use viewport center if not specified.'
          },
          y: {
            type: 'number',
            description: 'Y position (0-5000). Use viewport center if not specified.'
          },
          width: {
            type: 'number',
            description: 'Width for rectangle or text (default: 100 for rectangle, 200 for text)'
          },
          height: {
            type: 'number',
            description: 'Height for rectangle (default: 100)'
          },
          radius: {
            type: 'number',
            description: 'Radius for circle (default: 50)'
          },
          text: {
            type: 'string',
            description: 'Text content for text shapes'
          },
          fontSize: {
            type: 'number',
            description: 'Font size for text shapes (default: 24)'
          },
          arrangement: {
            type: 'string',
            enum: ['horizontal', 'vertical', 'grid', 'none'],
            description: 'How to arrange multiple shapes: horizontal (row), vertical (column), grid, or none (stacked). Default: horizontal for count > 1',
            default: 'horizontal'
          },
          spacing: {
            type: 'number',
            description: 'Spacing between shapes when arrangement is used (default: 20)',
            default: 20
          },
          gridRows: {
            type: 'number',
            description: 'Number of rows for grid arrangement (required if arrangement=grid)'
          },
          gridCols: {
            type: 'number',
            description: 'Number of columns for grid arrangement (required if arrangement=grid)'
          }
        },
        required: ['shapeType']
      }
    }
  },

  // ====== SHAPE MANIPULATION ======
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move one or more shapes to a new position or by a relative amount. Use "selected" to move currently selected shapes, or use selectShapesByProperty first.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to move. Use ["selected"] to move currently selected shapes, or provide specific IDs from selectShapesByProperty.'
          },
          x: {
            type: 'number',
            description: 'Absolute X position, or leave undefined for relative move'
          },
          y: {
            type: 'number',
            description: 'Absolute Y position, or leave undefined for relative move'
          },
          deltaX: {
            type: 'number',
            description: 'Relative X movement (e.g., 100 to move right)'
          },
          deltaY: {
            type: 'number',
            description: 'Relative Y movement (e.g., -100 to move up)'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize one or more shapes',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to resize'
          },
          width: {
            type: 'number',
            description: 'New width (for rectangles and text)'
          },
          height: {
            type: 'number',
            description: 'New height (for rectangles only)'
          },
          radius: {
            type: 'number',
            description: 'New radius (for circles only)'
          },
          scaleFactor: {
            type: 'number',
            description: 'Scale multiplier (e.g., 2 for double size, 0.5 for half)'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate one or more shapes (rectangles and circles only, not text)',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to rotate'
          },
          rotation: {
            type: 'number',
            description: 'Absolute rotation in degrees (0-360)'
          },
          deltaRotation: {
            type: 'number',
            description: 'Relative rotation change in degrees'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete one or more shapes from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to delete'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'updateText',
      description: 'Update the text content or font size of text shapes',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of text shape IDs to update'
          },
          text: {
            type: 'string',
            description: 'New text content'
          },
          fontSize: {
            type: 'number',
            description: 'New font size'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  // ====== SELECTION ======
  {
    type: 'function',
    function: {
      name: 'selectShapesByProperty',
      description: 'Select shapes based on their properties (type, position, size, etc.). Returns shape IDs.',
      parameters: {
        type: 'object',
        properties: {
          shapeType: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'all'],
            description: 'Filter by shape type. Use "all" for all types.'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of shapes to select (default: all matching)'
          },
          sortBy: {
            type: 'string',
            enum: ['x', 'y', 'width', 'height', 'radius', 'size'],
            description: 'Sort shapes by property before selecting'
          },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort order: ascending or descending (default: asc)'
          },
          minX: {
            type: 'number',
            description: 'Minimum X position filter'
          },
          maxX: {
            type: 'number',
            description: 'Maximum X position filter'
          },
          minY: {
            type: 'number',
            description: 'Minimum Y position filter'
          },
          maxY: {
            type: 'number',
            description: 'Maximum Y position filter'
          }
        },
        required: []
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'deselectAll',
      description: 'Deselect all currently selected shapes',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  // ====== LAYOUT COMMANDS ======
  {
    type: 'function',
    function: {
      name: 'arrangeHorizontal',
      description: 'Arrange shapes in a horizontal row with even spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange'
          },
          startX: {
            type: 'number',
            description: 'Starting X position (default: first shape X or viewport left)'
          },
          startY: {
            type: 'number',
            description: 'Y position for the row (default: first shape Y or viewport centerY)'
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'arrangeVertical',
      description: 'Arrange shapes in a vertical column with even spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange'
          },
          startX: {
            type: 'number',
            description: 'X position for the column (default: first shape X or viewport centerX)'
          },
          startY: {
            type: 'number',
            description: 'Starting Y position (default: first shape Y or viewport top)'
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)'
          }
        },
        required: ['shapeIds']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'arrangeGrid',
      description: 'Arrange shapes in a grid pattern',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to arrange'
          },
          rows: {
            type: 'number',
            description: 'Number of rows in the grid'
          },
          cols: {
            type: 'number',
            description: 'Number of columns in the grid'
          },
          startX: {
            type: 'number',
            description: 'Starting X position (default: viewport left)'
          },
          startY: {
            type: 'number',
            description: 'Starting Y position (default: viewport top)'
          },
          spacingX: {
            type: 'number',
            description: 'Horizontal spacing between shapes (default: 20)'
          },
          spacingY: {
            type: 'number',
            description: 'Vertical spacing between shapes (default: 20)'
          }
        },
        required: ['shapeIds', 'rows', 'cols']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align shapes to a common edge or center',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align'
          },
          alignment: {
            type: 'string',
            enum: ['left', 'right', 'top', 'bottom', 'center-horizontal', 'center-vertical'],
            description: 'Alignment type'
          }
        },
        required: ['shapeIds', 'alignment']
      }
    }
  },

  // ====== QUERY COMMANDS ======
  {
    type: 'function',
    function: {
      name: 'getCanvasInfo',
      description: 'Get information about the canvas state (shape counts, types, positions, etc.)',
      parameters: {
        type: 'object',
        properties: {
          infoType: {
            type: 'string',
            enum: ['count', 'types', 'list', 'bounds', 'selected'],
            description: 'Type of information to retrieve: count (total shapes), types (shape type breakdown), list (all shape details), bounds (canvas usage area), selected (currently selected shapes)'
          }
        },
        required: ['infoType']
      }
    }
  },

  // ====== COMPLEX UI TEMPLATES ======
  {
    type: 'function',
    function: {
      name: 'createUITemplate',
      description: 'Create complex UI components from templates (login form, navigation bar, card layout, button)',
      parameters: {
        type: 'object',
        properties: {
          templateType: {
            type: 'string',
            enum: ['loginForm', 'navBar', 'card', 'button'],
            description: 'Type of UI template to create'
          },
          x: {
            type: 'number',
            description: 'X position for template (default: viewport center)'
          },
          y: {
            type: 'number',
            description: 'Y position for template (default: viewport center)'
          },
          customization: {
            type: 'object',
            description: 'Optional customizations (labels, sizes, etc.)',
            properties: {
              buttonText: {
                type: 'string',
                description: 'Text for button template'
              },
              menuItems: {
                type: 'array',
                items: { type: 'string' },
                description: 'Menu item labels for nav bar (default: ["Home", "About", "Services", "Contact"])'
              },
              title: {
                type: 'string',
                description: 'Title text for card template'
              },
              description: {
                type: 'string',
                description: 'Description text for card template'
              }
            }
          }
        },
        required: ['templateType']
      }
    }
  }
];

export default aiTools;

