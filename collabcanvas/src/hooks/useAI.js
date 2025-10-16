import { useState, useCallback } from 'react';
import { callOpenAI } from '../lib/openai';
import { aiTools } from '../lib/aiTools';
import { executeFunction } from '../lib/aiExecutor';

/**
 * useAI Hook
 * 
 * Manages AI command processing workflow:
 * 1. Accept user's natural language command
 * 2. Send to OpenAI with canvas context
 * 3. Parse function calls from response
 * 4. Execute functions via aiExecutor
 * 5. Return results and errors for UI display
 * 
 * @param {Object} canvasContext - Canvas state and operations (shapes, hooks, user, viewport)
 * @returns {Object} AI state and methods
 */
export function useAI(canvasContext) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Submit a command to the AI
   * 
   * @param {string} command - User's natural language command
   * @returns {Promise<Object>} Result { success, message, actions, errors }
   */
  const submitCommand = useCallback(async (command) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Build canvas context for AI
      const context = buildContext(canvasContext);

      console.log('Submitting AI command:', command);
      console.log('Canvas context:', context);

      // Call OpenAI with command and function schemas
      const response = await callOpenAI(command, aiTools, context);

      console.log('OpenAI response:', response);

      // Check if AI wants to call functions
      const message = response.choices[0]?.message;
      
      if (!message) {
        throw new Error('No response from AI');
      }

      // Handle function calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const results = await executeFunctionCalls(message.tool_calls, canvasContext);
        
        setLastResult(results);
        setIsProcessing(false);

        return results;
      }

      // Handle text-only response (for query commands or errors)
      if (message.content) {
        const result = {
          success: true,
          message: message.content,
          actions: [],
          errors: []
        };
        
        setLastResult(result);
        setIsProcessing(false);

        return result;
      }

      // No function calls and no content
      throw new Error('AI returned no actionable response');

    } catch (err) {
      console.error('AI command error:', err);
      
      const errorResult = {
        success: false,
        message: `AI Error: ${err.message}`,
        actions: [],
        errors: [err.message]
      };

      setError(err.message);
      setLastResult(errorResult);
      setIsProcessing(false);

      return errorResult;
    }
  }, [canvasContext]);

  /**
   * Execute multiple function calls returned by OpenAI
   * 
   * @param {Array} toolCalls - Array of tool call objects from OpenAI
   * @param {Object} context - Canvas context
   * @returns {Promise<Object>} Aggregated results
   */
  async function executeFunctionCalls(toolCalls, context) {
    const actions = [];
    const errors = [];
    let overallSuccess = true;

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`Executing function: ${functionName}`, args);

      try {
        const result = await executeFunction(functionName, args, context);
        
        actions.push({
          function: functionName,
          args,
          ...result
        });

        if (!result.success) {
          overallSuccess = false;
          if (result.errors) {
            errors.push(...result.errors);
          }
        }
      } catch (err) {
        console.error(`Error executing ${functionName}:`, err);
        overallSuccess = false;
        errors.push(`${functionName} failed: ${err.message}`);
        
        actions.push({
          function: functionName,
          args,
          success: false,
          message: err.message,
          errors: [err.message]
        });
      }
    }

    // Generate summary message
    const successCount = actions.filter(a => a.success).length;
    const totalCount = actions.length;
    
    let summaryMessage;
    if (overallSuccess && successCount === totalCount) {
      // All succeeded
      summaryMessage = actions.map(a => a.message).join('. ');
    } else if (successCount > 0) {
      // Partial success
      summaryMessage = `Completed ${successCount}/${totalCount} actions. ${errors.join('. ')}`;
    } else {
      // All failed
      summaryMessage = `All actions failed: ${errors.join('. ')}`;
    }

    return {
      success: overallSuccess,
      message: summaryMessage,
      actions,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Build context object for AI with current canvas state
   * 
   * @param {Object} canvasContext - Canvas state and hooks
   * @returns {Object} Context for AI (shapes, viewport, selected, etc.)
   */
  function buildContext(canvasContext) {
    const { shapes, selectedShapeIds, stagePos, stageScale, stageRef } = canvasContext;

    // Calculate viewport information
    let viewport = {
      centerX: 2500,
      centerY: 2500,
      scale: stageScale || 1
    };

    if (stageRef?.current) {
      const stage = stageRef.current;
      const width = stage.width();
      const height = stage.height();
      
      // Calculate viewport center in canvas coordinates
      viewport.centerX = (-stagePos.x + width / 2) / stageScale;
      viewport.centerY = (-stagePos.y + height / 2) / stageScale;
    }

    return {
      shapes: shapes || [],
      selectedShapeIds: selectedShapeIds || [],
      viewport
    };
  }

  /**
   * Clear last result and error
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    submitCommand,
    isProcessing,
    lastResult,
    error,
    clearResult
  };
}

export default useAI;

