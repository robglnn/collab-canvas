import AICommandBar from './AICommandBar';
import './AIPanel.css';

/**
 * AIPanel component - Expandable panel for AI assistant
 * Opens next to toolbar similar to LayersPanel
 * 
 * @param {Function} onSubmit - Callback when AI command is submitted
 * @param {Boolean} isProcessing - Whether AI is processing
 * @param {Boolean} showSuccess - Whether to show success state
 * @param {Number} cooldownRemaining - Remaining cooldown time in seconds
 * @param {Boolean} isOnCooldown - Whether user is on cooldown
 * @param {Boolean} isOpen - Whether the panel is open
 * @param {Function} onToggle - Callback to toggle panel open/closed
 */
export default function AIPanel({ 
  onSubmit,
  isProcessing,
  showSuccess,
  cooldownRemaining,
  isOnCooldown,
  isOpen,
  onToggle,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3 className="ai-panel-title">AI Assistant</h3>
        <button className="ai-panel-close-btn" onClick={onToggle} title="Close AI assistant">
          ×
        </button>
      </div>

      <div className="ai-panel-content">
        <AICommandBar 
          onSubmit={onSubmit} 
          isProcessing={isProcessing}
          showSuccess={showSuccess}
          cooldownRemaining={cooldownRemaining}
          isOnCooldown={isOnCooldown}
        />
      </div>
    </div>
  );
}

