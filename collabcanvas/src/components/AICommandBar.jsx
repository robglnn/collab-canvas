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
  const [isExpanded, setIsExpanded] = useState(true);
  const [command, setCommand] = useState('');
  const [showCharCount, setShowCharCount] = useState(false);
  const textareaRef = useRef(null);

  const MAX_CHARS = 200;
  const CHAR_WARNING_THRESHOLD = 150;

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
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setCommand(value);
    }
  };

  const handleSubmit = () => {
    const trimmedCommand = command.trim();
    if (trimmedCommand && !isProcessing) {
      onSubmit(trimmedCommand);
      // Don't clear command immediately - let parent control this
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
    <div className={`ai-command-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header with toggle */}
      <div className="ai-command-header" onClick={toggleExpanded}>
        <div className="ai-command-title">
          <span className="ai-icon">🤖</span>
          <span>AI Assistant</span>
        </div>
        <button 
          className="ai-command-toggle"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Input area (only visible when expanded) */}
      {isExpanded && (
        <div className="ai-command-body">
          <textarea
            ref={textareaRef}
            className="ai-command-input"
            value={command}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type command here... (e.g., 'Create 3 blue circles in a row')"
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
      )}
    </div>
  );
}

