// src/components/QueueView.jsx
import React from 'react';
import { Trash2, X, Play, Music } from 'lucide-react';
import './QueueView.css';

function QueueView({ queue = [], removeFromQueue, clearQueue, playSong, currentSongId }) {
  const hasItems = Array.isArray(queue) && queue.length > 0;

  return (
    <div className="queue-view">
      <div className="queue-header">
        <h2>
          <Music size={20} style={{ marginRight: '10px' }} />
          Queue
          <span className="queue-count">({queue.length})</span>
        </h2>
        <button 
          className="clear-queue-btn" 
          onClick={clearQueue} 
          disabled={!hasItems}
          title="Clear all songs from queue"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      {!hasItems ? (
        <div className="queue-empty">
          <div className="empty-icon">
            <Music size={48} />
          </div>
          <p className="empty-title">Queue is empty</p>
          <p className="empty-subtitle">Add songs from your library to get started</p>
        </div>
      ) : (
        <div className="queue-container">
          <div className="queue-list-header">
            <div className="queue-col queue-col-index">#</div>
            <div className="queue-col queue-col-title">Title</div>
            <div className="queue-col queue-col-artist">Artist</div>
            <div className="queue-col queue-col-album">Album</div>
            <div className="queue-col queue-col-duration">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="queue-col queue-col-actions">Actions</div>
          </div>
          
          <div className="queue-list">
            {queue.map((song, index) => (
              <div 
                key={`${song.id}-${index}`} 
                className={`queue-item ${currentSongId === song.id ? 'queue-item-playing' : ''}`}
                onClick={() => playSong && playSong(song)}
              >
                <div className="queue-col queue-col-index">
                  <div className="queue-index">
                    {currentSongId === song.id ? (
                      <div className="playing-indicator">
                        <div className="playing-bars">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    ) : (
                      <span className="index-number">{index + 1}</span>
                    )}
                  </div>
                </div>
                <div className="queue-col queue-col-title">
                  <div className="queue-song-info">
                    <span className="queue-song-title">{song.title || 'Unknown Title'}</span>
                    {currentSongId === song.id && (
                      <span className="currently-playing-badge">Now Playing</span>
                    )}
                  </div>
                </div>
                <div className="queue-col queue-col-artist">
                  <span className="queue-song-artist">{song.artist || 'Unknown Artist'}</span>
                </div>
                <div className="queue-col queue-col-album">
                  <span className="queue-song-album">{song.album || 'Unknown Album'}</span>
                </div>
                <div className="queue-col queue-col-duration">
                  <span className="queue-song-duration">{formatTime(song.duration)}</span>
                </div>
                <div className="queue-col queue-col-actions">
                  <button 
                    className="queue-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue && removeFromQueue(song.id);
                    }}
                    title="Remove from queue"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default QueueView;