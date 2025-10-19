import { useState, useRef, useEffect } from 'react';
import './AICommandBar.css';

/**
 * AI Command Bar Component
 * 
 * Provides a collapsible input interface for AI natural language commands
 * Features:
 * - 200 character limit
 * - Character counter (shows at 150+)
 * - Submit button states: default, loading, success, disabled, cooldown
 * - Cooldown display (5 second rate limit)
 * - Collapse/expand toggle
 * - Enter key to submit
 * 
 * @param {Function} onSubmit - Callback when command is submitted
 * @param {boolean} isProcessing - Whether AI is currently processing
 * @param {boolean} showSuccess - Whether to show success checkmark
 * @param {number} cooldownRemaining - Seconds remaining in cooldown
 * @param {boolean} isOnCooldown - Whether user is in cooldown period
 */
export default function AICommandBar({ onSubmit, isProcessing = false, showSuccess = false, cooldownRemaining = 0, isOnCooldown = false }) {
  const [command, setCommand] = useState('');
  const [showCharCount, setShowCharCount] = useState(false);
  const textareaRef = useRef(null);

  const MAX_CHARS = 200;
  const CHAR_WARNING_THRESHOLD = 150;

  /**
   * Sanitize user input to prevent XSS and ensure clean commands
   * @param {string} input - Raw user input
   * @returns {string} Sanitized input
   */
  const sanitizeInput = (input) => {
    // Remove HTML tags and scripts
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove special characters that could be problematic
    sanitized = sanitized.replace(/[<>]/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
  };

  // Auto-expand textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [command]);

  // Show character count when approaching limit
  useEffect(() => {
    setShowCharCount(command.length >= CHAR_WARNING_THRESHOLD);
  }, [command]);

  const handleInputChange = (e) => {
    const value = sanitizeInput(e.target.value);
    if (value.length <= MAX_CHARS) {
      setCommand(value);
    }
  };

  const handleSubmit = () => {
    const trimmedCommand = command.trim();
    
    // Additional validation before submission
    if (!trimmedCommand) return;
    if (trimmedCommand.length < 2) return;
    if (isProcessing || isOnCooldown) return;
    
    // Final sanitization before sending
    const sanitizedCommand = sanitizeInput(trimmedCommand);
    
    if (sanitizedCommand) {
      onSubmit(sanitizedCommand);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearCommand = () => {
    setCommand('');
  };

  // Reset command after success animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        clearCommand();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const isSubmitDisabled = !command.trim() || isProcessing || isOnCooldown;

  // Determine button class based on state
  let buttonClass = 'ai-command-submit';
  if (isProcessing) {
    buttonClass += ' loading';
  } else if (showSuccess) {
    buttonClass += ' success';
  } else if (isOnCooldown) {
    buttonClass += ' cooldown';
  } else if (isSubmitDisabled) {
    buttonClass += ' disabled';
  }

  return (
    <div className="ai-command-bar expanded">
      {/* Input area */}
      <div className="ai-command-body">
          <textarea
            ref={textareaRef}
            className="ai-command-input"
            value={command}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type command here..."
            disabled={isProcessing}
            rows={1}
          />
          
          {/* Character counter */}
          {showCharCount && (
            <div className={`ai-command-char-count ${command.length >= MAX_CHARS ? 'limit' : ''}`}>
              {command.length}/{MAX_CHARS}
            </div>
          )}

          {/* Submit button */}
          <button
            className={buttonClass}
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            title={
              isProcessing ? 'Processing...' : 
              showSuccess ? 'Success!' : 
              isOnCooldown ? `Cooldown: ${cooldownRemaining}s` : 
              'Submit command'
            }
          >
            {isProcessing ? (
              <span className="spinner">⏳</span>
            ) : showSuccess ? (
              <span className="checkmark">✓</span>
            ) : isOnCooldown ? (
              <span className="cooldown-timer">{cooldownRemaining}s</span>
            ) : (
              'Submit'
            )}
          </button>
        </div>
    </div>
  );
}

