import { useEffect } from 'react';
import './PermissionDeniedBanner.css';

/**
 * Permission denied banner - Shown when user tries to access unauthorized canvas
 */
export default function PermissionDeniedBanner({ onGoToFiles }) {
  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      onGoToFiles();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onGoToFiles]);

  return (
    <div className="permission-denied-container">
      <div className="permission-denied-card">
        <div className="permission-denied-icon">🔒</div>
        <h2>Permission Denied</h2>
        <p>You don't have access to this canvas.</p>
        <p className="redirect-message">Redirecting you to your files...</p>
        <button className="go-to-files-btn" onClick={onGoToFiles}>
          Go to My Files Now
        </button>
      </div>
    </div>
  );
}

