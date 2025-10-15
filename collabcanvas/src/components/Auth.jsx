import { useAuth } from '../hooks/useAuth';
import './Auth.css';

/**
 * Authentication component
 * Displays sign-in page when user is not authenticated
 * Shows user info and sign-out button when authenticated
 */
export default function Auth({ children }) {
  const { user, loading, error, signInWithGoogle, signOut } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if user is not authenticated
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>CollabCanvas</h1>
          <p className="auth-subtitle">Real-time collaborative canvas</p>
          
          <button 
            className="google-signin-btn" 
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User is authenticated - show app with user info in header
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h2>CollabCanvas</h2>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                className="user-avatar"
              />
            )}
            <span className="user-name">{user.displayName}</span>
          </div>
          
          <button 
            className="signout-btn" 
            onClick={signOut}
            disabled={loading}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

