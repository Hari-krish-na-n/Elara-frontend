// src/components/QueueView.jsx
import React from 'react';

function QueueView({ queue = [], removeFromQueue, clearQueue, playSong, currentSongId }) {
  const hasItems = Array.isArray(queue) && queue.length > 0;

  return (
    <div className="playlists-view">
      <h2>Up Next ⏭️</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className="create-btn" onClick={clearQueue} disabled={!hasItems}>
          Clear Queue
        </button>
      </div>

      {!hasItems ? (
        <div className="empty-list">
          <p>Your queue is empty. Add songs from the library.</p>
        </div>
      ) : (
        <div className="music-list-container">
          <div className="list-header">
            <div className="col-title">Title</div>
            <div className="col-artist">Artist</div>
            <div className="col-album">Album</div>
            <div className="col-duration">Time</div>
            <div className="col-actions">Actions</div>
          </div>
          <div className="song-list">
            {queue.map((song) => (
              <div key={song.id} className="playlist-item-detail">
                <div className="col-title">
                  <span
                    className="song-title clickable"
                    onClick={() => playSong && playSong(song)}
                  >
                    {song.title}
                  </span>
                  {currentSongId === song.id && (
                    <span className="playing-indicator">▶️</span>
                  )}
                </div>
                <div className="col-artist">{song.artist}</div>
                <div className="col-album">{song.album}</div>
                <div className="col-duration">{song.duration ? formatTime(song.duration) : '00:00'}</div>
                <div className="col-actions">
                  <button
                    className="remove-btn"
                    onClick={() => removeFromQueue && removeFromQueue(song.id)}
                    title="Remove from queue"
                  >
                    🗑️
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
