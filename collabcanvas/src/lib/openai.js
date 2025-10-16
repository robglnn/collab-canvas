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
    // Optimized system prompt - concise but informative
    const systemPrompt = `You are an AI assistant for a collaborative canvas app. Interpret natural language commands and call appropriate functions.

Context: ${context.shapes?.length || 0} shapes, ${context.selectedShapeIds?.length || 0} selected, viewport at (${Math.round(context.viewport?.centerX || 0)}, ${Math.round(context.viewport?.centerY || 0)})

Shape types: rectangle, circle, text | Canvas: 5000x5000px

RULES:
1. Multiple shapes: use count + arrangement in createShape
2. Manipulate by type: selectShapesByProperty first, then use ["selected"]
3. For selected shapes: use shapeIds: ["selected"]
4. Undo/redo: respond "Use Ctrl+Z to undo or Ctrl+Shift+Z to redo"
5. Off-topic: respond "I can only help with canvas operations"
6. Always use functions when applicable

PATTERNS:
Simple: "create 5 squares in a row" → createShape(type:"rectangle", count:5, arrangement:"horizontal")
UI: "create a login form" → createUITemplate(type:"loginForm")
Templates: loginForm, navBar, card, button, dashboard, sidebar (customize with menuItems, buttonText, cardCount, etc)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Latest GPT-4 Turbo for faster responses
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.2, // Lower temperature for consistent, deterministic responses
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

