import './DisconnectBanner.css';

/**
 * DisconnectBanner component - Shows when user loses connection
 * Displays after 3 seconds of disconnect and disappears automatically when reconnected
 * 
 * @param {boolean} show - Whether to show the banner
 */
export default function DisconnectBanner({ show }) {
  if (!show) return null;

  return (
    <div className="disconnect-banner">
      <div className="disconnect-banner-content">
        <div className="disconnect-icon">⚠️</div>
        <div className="disconnect-text">
          <h3>Disconnected from server</h3>
          <p>This alert will disappear when you are reconnected.</p>
        </div>
      </div>
    </div>
  );
}

