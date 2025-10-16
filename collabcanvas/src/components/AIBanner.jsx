import { useState, useEffect } from 'react';
import './AIBanner.css';

/**
 * AI Banner Component
 * 
 * Displays status, error, warning, info, or success messages
 * Auto-hides after specified duration
 * 
 * Types:
 * - error (red): For AI errors, permission issues
 * - warning (yellow): For cautionary messages
 * - info (blue): For informational messages
 * - success (green): For successful operations
 * 
 * @param {string} message - Message to display
 * @param {string} type - Banner type: 'error', 'warning', 'info', 'success'
 * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
 * @param {Function} onClose - Callback when banner is closed
 */
export default function AIBanner({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300); // Match animation duration
  };

  if (!isVisible) {
    return null;
  }

  // Icon based on type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`ai-banner ai-banner-${type} ${isAnimatingOut ? 'fade-out' : 'fade-in'}`}>
      <div className="ai-banner-content">
        <span className="ai-banner-icon">{getIcon()}</span>
        <span className="ai-banner-message">{message}</span>
      </div>
      <button 
        className="ai-banner-close" 
        onClick={handleClose}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * AI Banner Manager Component
 * 
 * Manages multiple banners with a queue system
 * Only shows one banner at a time
 * 
 * @param {Array} banners - Array of banner objects { id, message, type, duration }
 * @param {Function} onBannerClose - Callback when a banner is closed (receives id)
 */
export function AIBannerManager({ banners = [], onBannerClose }) {
  if (banners.length === 0) {
    return null;
  }

  // Show only the most recent banner
  const currentBanner = banners[banners.length - 1];

  return (
    <div className="ai-banner-manager">
      <AIBanner
        key={currentBanner.id}
        message={currentBanner.message}
        type={currentBanner.type || 'info'}
        duration={currentBanner.duration !== undefined ? currentBanner.duration : 3000}
        onClose={() => onBannerClose(currentBanner.id)}
      />
    </div>
  );
}

