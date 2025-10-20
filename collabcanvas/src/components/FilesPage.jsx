import { useState, useEffect } from 'react';
import { getUserCanvases } from '../lib/firestoreService';
import CanvasShareMenu from './CanvasShareMenu';
import './FilesPage.css';

/**
 * Files page - Shows user's 3 canvases
 */
export default function FilesPage({ user, onSelectCanvas }) {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [shareMenuCanvasId, setShareMenuCanvasId] = useState(null);

  useEffect(() => {
    if (!user) return;

    loadCanvases();
  }, [user]);

  const loadCanvases = async () => {
    try {
      setLoading(true);
      const userCanvases = await getUserCanvases(user.uid, user.email);
      setCanvases(userCanvases);
    } catch (error) {
      console.error('Error loading canvases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = (canvas) => {
    setEditingCanvasId(canvas.id);
    setEditingName(canvas.name);
  };

  const handleSaveName = async (canvasId) => {
    try {
      const { updateCanvasName } = await import('../lib/firestoreService');
      await updateCanvasName(canvasId, editingName);
      setEditingCanvasId(null);
      loadCanvases();
    } catch (error) {
      console.error('Error updating canvas name:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCanvasId(null);
    setEditingName('');
  };

  const handleShareClick = (e, canvasId) => {
    e.stopPropagation();
    setShareMenuCanvasId(shareMenuCanvasId === canvasId ? null : canvasId);
  };

  if (loading) {
    return (
      <div className="files-page">
        <div className="files-container">
          <h1>My Canvases</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="files-page">
      <div className="files-container">
        <h1>My Canvases</h1>
        <div className="canvases-grid">
          {canvases.map((canvas) => (
            <div key={canvas.id} className="canvas-card">
              <button
                className="canvas-preview"
                onClick={() => onSelectCanvas(canvas.id)}
                style={{ backgroundColor: canvas.color }}
                title={`Open ${canvas.name}`}
              >
                <div className="canvas-preview-content">
                  <span className="canvas-icon">🎨</span>
                </div>
              </button>
              
              <div className="canvas-info">
                {editingCanvasId === canvas.id ? (
                  <div className="canvas-name-edit">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      maxLength={50}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(canvas.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      className="save-name-btn"
                      onClick={() => handleSaveName(canvas.id)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      className="cancel-name-btn"
                      onClick={handleCancelEdit}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="canvas-name-display">
                    <h3>{canvas.name}</h3>
                    <button
                      className="edit-name-btn"
                      onClick={() => handleEditName(canvas)}
                      title="Rename canvas"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                
                <div className="canvas-actions">
                  <button
                    className="share-btn"
                    onClick={(e) => handleShareClick(e, canvas.id)}
                    title="Share canvas"
                  >
                    👤
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
        
        {/* Render share menu outside the cards to avoid hover conflicts */}
        {shareMenuCanvasId && (
          <CanvasShareMenu
            canvas={canvases.find(c => c.id === shareMenuCanvasId)}
            onClose={() => setShareMenuCanvasId(null)}
            onUpdate={loadCanvases}
          />
        )}
      </div>
    </div>
  );
}

