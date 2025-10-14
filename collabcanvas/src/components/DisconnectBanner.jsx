import './DisconnectBanner.css';

/**
 * DisconnectBanner component - Shows when user loses connection
 * Displays after 3 seconds of disconnect with prompt to refresh
 * 
 * @param {boolean} show - Whether to show the banner
 */
export default function DisconnectBanner({ show }) {
  if (!show) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="disconnect-banner">
      <div className="disconnect-banner-content">
        <div className="disconnect-icon">⚠️</div>
        <div className="disconnect-text">
          <h3>Disconnected from server</h3>
          <p>You've been disconnected. Please refresh to reconnect.</p>
        </div>
        <button className="disconnect-refresh-btn" onClick={handleRefresh}>
          Refresh Page
        </button>
      </div>
    </div>
  );
}

