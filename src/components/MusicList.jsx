// src/components/MusicList.js
import React, { useEffect } from 'react';
import PlaylistItem from './PlaylistItem';

function MusicList({
  songs = [],
  playSong,
  currentSongId,
  playlists = [],
  addSongToPlaylist,
  searchQuery = '',
  onOpenPlaylistSidebar,
  isSongLiked,
  onToggleLike,
  onAddToQueue,
  focusTarget
}) {
  const safeSongs = Array.isArray(songs) ? songs : [];


  useEffect(() => {
    if (!focusTarget || !focusTarget.id) return;
    let targetEl = null;
    const rows = document.querySelectorAll('.playlist-item');
    rows.forEach((el) => {
      if (el && el.dataset && el.dataset.songId === focusTarget.id) {
        targetEl = el;
      }
    });
    if (targetEl) {
      try { targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
      targetEl.classList.add('locate-highlight');
      setTimeout(() => {
        if (targetEl) targetEl.classList.remove('locate-highlight');
      }, 2000);
    }
  }, [focusTarget]);

  if (safeSongs.length === 0) {
    return (
      <div className="empty-list">
        <p>Please use the '+ Add folder' button to browse and select local audio files to start your music library.</p>
      </div>
    );
  }

  return (
    <div className="music-list-container">
      <div className="list-header">
        <div className="col-title">Title</div>
        <div className="col-artist">Artist</div>
        <div className="col-album">Album</div>
        <div className="col-plays">Plays</div>
        <div className="col-duration">Duration</div>
        <div className="col-actions">Actions</div>
      </div>
      <div className="song-list">
        {safeSongs.map((song, index) => {
          if (!song || typeof song !== 'object') return null;
          return (
            <PlaylistItem
              key={song.id || `song-${index}`}
              song={song}
              playSong={playSong}
              isCurrent={song.id === currentSongId}
              playlists={playlists}
              addSongToPlaylist={addSongToPlaylist}
              onOpenPlaylistSidebar={onOpenPlaylistSidebar}
              isLiked={isSongLiked ? isSongLiked(song.id) : false}
              onToggleLike={onToggleLike}
              onAddToQueue={onAddToQueue}
            />
          );
        })}
      </div>
    </div>
  );
}

export default MusicList;
