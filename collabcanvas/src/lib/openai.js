import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 * 
 * Initializes OpenAI client for GPT-4 function calling
 * API key is loaded from environment variable
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * Call OpenAI GPT-4 with function calling
 * 
 * @param {string} userMessage - User's natural language command
 * @param {Array} tools - Array of function schemas
 * @param {Object} context - Canvas context (shapes, viewport, etc.)
 * @returns {Promise<Object>} OpenAI response with function calls
 */
export async function callOpenAI(userMessage, tools, context) {
  try {
    const systemPrompt = `You are an AI assistant for a collaborative canvas application similar to Figma. 
Your job is to interpret natural language commands and call the appropriate canvas manipulation functions.

Current Canvas Context:
- Total shapes: ${context.shapes?.length || 0}
- Selected shapes: ${context.selectedShapeIds?.length || 0} (IDs: ${context.selectedShapeIds?.join(', ') || 'none'})
- Viewport center: (${context.viewport?.centerX || 0}, ${context.viewport?.centerY || 0})
- Canvas size: 5000x5000px

Available shape types: rectangle, circle, text
Default sizes: rectangle (100x100), circle (radius 50), text (width 200)

IMPORTANT RULES:
1. For creating multiple shapes (e.g., "create 5 squares in a row"), use the count parameter in createShape with appropriate arrangement
2. For manipulating shapes by type (e.g., "rotate all squares"), first use selectShapesByProperty, then use ["selected"] in the manipulation function
3. For manipulating currently selected shapes, use shapeIds: ["selected"] 
4. For undo/redo commands, respond: "Please use Ctrl+Z to undo or Ctrl+Shift+Z to redo. I cannot perform undo/redo operations."
5. For questions about features outside canvas manipulation (weather, math, general knowledge), respond: "I'm sorry, my responses are limited. You must ask the right question. I can only help with canvas operations like creating, moving, arranging, and querying shapes."
6. Always use function calls when possible - only respond with text for undo/redo or out-of-scope questions

Command patterns:
- "create 5 squares in a row" → createShape with count: 5, arrangement: "horizontal"
- "create 6 circles in a grid" → createShape with count: 6, arrangement: "grid", gridRows: 2, gridCols: 3
- "rotate all squares 45 degrees" → selectShapesByProperty(type: rectangle) then rotateShape(shapeIds: ["selected"], rotation: 45)
- "delete selected shapes" → deleteShape(shapeIds: ["selected"])
- "move the blue circle" → selectShapesByProperty + moveShape(shapeIds: ["selected"])

Shape selection keywords:
- Use ["selected"] to reference currently selected shapes
- Use selectShapesByProperty to find shapes by type, position, or size before manipulating them`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview', // GPT-4 Turbo with function calling
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      tools: tools,
      tool_choice: 'auto', // Let GPT decide which functions to call
      temperature: 0.7,
      max_tokens: 1000
    });

    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

/**
 * Test OpenAI connection
 * 
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{ role: 'user', content: 'Test connection. Respond with "OK".' }],
      max_tokens: 10
    });
    
    console.log('OpenAI connection test:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

export default openai;

