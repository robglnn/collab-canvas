import { useState, useCallback, useRef, useEffect } from 'react';
import { callOpenAI } from '../lib/openai';
import { aiTools } from '../lib/aiTools';
import { executeFunction } from '../lib/aiExecutor';

/**
 * useAI Hook
 * 
 * Manages AI command processing workflow with rate limiting:
 * 1. Accept user's natural language command
 * 2. Check rate limits (5 sec cooldown per user, 300/min per canvas)
 * 3. Send to OpenAI with canvas context
 * 4. Parse function calls from response
 * 5. Execute functions via aiExecutor
 * 6. Return results and errors for UI display
 * 
 * Rate Limits:
 * - Per user: 1 command every 5 seconds (12/minute)
 * - Per canvas: 300 commands/minute (simple check)
 * 
 * @param {Object} canvasContext - Canvas state and operations (shapes, hooks, user, viewport)
 * @returns {Object} AI state and methods
 */
export function useAI(canvasContext) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const lastCommandTimeRef = useRef(0);
  const cooldownIntervalRef = useRef(null);

  const COOLDOWN_SECONDS = 5; // 5 seconds between commands per user

  /**
   * Submit a command to the AI
   * 
   * @param {string} command - User's natural language command
   * @returns {Promise<Object>} Result { success, message, actions, errors }
   */
  const submitCommand = useCallback(async (command) => {
    // Check cooldown
    const now = Date.now();
    const timeSinceLastCommand = (now - lastCommandTimeRef.current) / 1000;
    
    if (timeSinceLastCommand < COOLDOWN_SECONDS) {
      const remaining = Math.ceil(COOLDOWN_SECONDS - timeSinceLastCommand);
      const errorResult = {
        success: false,
        message: `Please wait ${remaining} second${remaining > 1 ? 's' : ''} before sending another command`,
        actions: [],
        errors: [`Cooldown: ${remaining}s remaining`]
      };
      setError(errorResult.message);
      return errorResult;
    }

    setIsProcessing(true);
    setError(null);
    lastCommandTimeRef.current = now;

    // Start cooldown timer
    startCooldownTimer();

    try {
      // Take snapshot for undo/redo BEFORE executing AI command
      if (canvasContext.takeSnapshot && canvasContext.shapes) {
        canvasContext.takeSnapshot(canvasContext.shapes);
        console.log('Snapshot taken for undo/redo');
      }

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
    let totalShapesCreated = 0;
    let totalShapesModified = 0;
    let totalShapesDeleted = 0;

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

        // Count shapes for better feedback
        if (result.success && result.data) {
          if (result.data.count) totalShapesCreated += result.data.count;
          if (result.data.movedShapeIds) totalShapesModified += result.data.movedShapeIds.length;
          if (result.data.resizedShapeIds) totalShapesModified += result.data.resizedShapeIds.length;
          if (result.data.rotatedShapeIds) totalShapesModified += result.data.rotatedShapeIds.length;
          if (result.data.updatedShapeIds) totalShapesModified += result.data.updatedShapeIds.length;
          if (result.data.deletedShapeIds) totalShapesDeleted += result.data.deletedShapeIds.length;
        }

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

    // Generate enhanced summary message with shape counts
    const successCount = actions.filter(a => a.success).length;
    const totalCount = actions.length;
    
    let summaryMessage;
    if (overallSuccess && successCount === totalCount) {
      // All succeeded - provide detailed feedback
      const parts = [];
      if (totalShapesCreated > 0) parts.push(`Created ${totalShapesCreated} shape${totalShapesCreated > 1 ? 's' : ''}`);
      if (totalShapesModified > 0) parts.push(`Modified ${totalShapesModified} shape${totalShapesModified > 1 ? 's' : ''}`);
      if (totalShapesDeleted > 0) parts.push(`Deleted ${totalShapesDeleted} shape${totalShapesDeleted > 1 ? 's' : ''}`);
      
      if (parts.length > 0) {
        summaryMessage = parts.join(', ');
      } else {
        summaryMessage = actions.map(a => a.message).join('. ');
      }
    } else if (successCount > 0) {
      // Partial success - be specific about what worked
      const parts = [];
      if (totalShapesCreated > 0) parts.push(`created ${totalShapesCreated}`);
      if (totalShapesModified > 0) parts.push(`modified ${totalShapesModified}`);
      if (totalShapesDeleted > 0) parts.push(`deleted ${totalShapesDeleted}`);
      
      const failCount = totalCount - successCount;
      summaryMessage = `Partial success: ${parts.join(', ')} shape${parts.length > 1 || (totalShapesCreated + totalShapesModified + totalShapesDeleted) > 1 ? 's' : ''}. ${failCount} action${failCount > 1 ? 's' : ''} failed (${errors[0] || 'locked or not found'})`;
    } else {
      // All failed - provide helpful error message
      const errorMsg = errors[0] || 'Unknown error';
      if (errorMsg.includes('locked')) {
        summaryMessage = `Action failed: Some shapes are locked by other users. Try selecting unlocked shapes or ask the owner to release them.`;
      } else if (errorMsg.includes('not found')) {
        summaryMessage = `Action failed: Shapes not found. Try creating shapes first or selecting existing ones.`;
      } else {
        summaryMessage = `Action failed: ${errorMsg}`;
      }
    }

    return {
      success: overallSuccess,
      message: summaryMessage,
      actions,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        created: totalShapesCreated,
        modified: totalShapesModified,
        deleted: totalShapesDeleted
      }
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
   * Start cooldown countdown timer
   */
  const startCooldownTimer = useCallback(() => {
    // Clear any existing interval
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    setCooldownRemaining(COOLDOWN_SECONDS);

    cooldownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastCommandTimeRef.current) / 1000;
      const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);

      if (remaining <= 0) {
        setCooldownRemaining(0);
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
        }
      } else {
        setCooldownRemaining(Math.ceil(remaining));
      }
    }, 100); // Update every 100ms for smooth countdown
  }, [COOLDOWN_SECONDS]);

  /**
   * Clear last result and error
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  return {
    submitCommand,
    isProcessing,
    lastResult,
    error,
    clearResult,
    cooldownRemaining,
    isOnCooldown: cooldownRemaining > 0
  };
}

export default useAI;

