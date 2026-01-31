// src/components/SongCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import './SongCard.css';
import '../App1.css';

import { playLikeSound, playAddToPlaylistSound } from '../utils/soundEffects';

const SongCard = ({
  song,
  playSong,
  isCurrent = false,
  playlists = [],
  addSongToPlaylist,
  onToggleLike,
  isLiked = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom');
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if clicked outside both the button and the menu
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPlaylistMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate menu position
  useEffect(() => {
    if (showPlaylistMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // If there's not enough space below, show above
      if (rect.bottom + 250 > windowHeight && rect.top > 250) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
  }, [showPlaylistMenu]);

  const handleCardClick = () => {
    if (!song) return;
    playSong?.(song);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    playSong?.(song);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      playLikeSound();
    }
    onToggleLike?.(song);
  };

  const handlePlaylistToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPlaylistMenu(prev => !prev);
  };

  const handleAddToPlaylist = (e, playlistId) => {
    e.stopPropagation();
    e.preventDefault();
    if (addSongToPlaylist) {
      playAddToPlaylistSound();
      addSongToPlaylist(song.id, playlistId);
    }
    setShowPlaylistMenu(false);
  };

  /* Add state for image error */
  const [imageError, setImageError] = useState(false);

  /* Helper to get normalized cover URL */
  const getSongCoverUrl = (song) => {
    if (!song) return null;
    if (song.coverUrl) return song.coverUrl;
    if (song.cover && typeof song.cover === 'string') return song.cover;
    if (song.picture && song.picture.url) return song.picture.url;
    if (song.picture && song.picture.data && song.picture.format) {
      return `data:${song.picture.format};base64,${song.picture.data}`;
    }
    return null;
  };

  const coverUrl = getSongCoverUrl(song);

  return (
    <div
      className={`song-card ${isCurrent ? 'is-current' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        // Don't hide actions immediately when moving to menu
        if (!showPlaylistMenu) {
          setTimeout(() => {
            if (!showPlaylistMenu) {
              setShowActions(false);
            }
          }, 100);
        }
      }}
      onClick={handleCardClick}
      ref={containerRef}
    >
      <div className="song-card-content">
        {/* Cover + inline play */}
        <div className="song-cover">
          {!imageError && coverUrl ? (
            <img
              src={coverUrl}
              alt={song.title || 'Cover'}
              className="cover-img"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="cover-placeholder">
              {firstLetter}
            </div>
          )}

          {showActions && (
            <button
              className="play-btn"
              onClick={handlePlayClick}
              title="Play"
            >
              ▶️
            </button>
          )}
        </div>

        {/* Basic info */}
        <div className="song-info">
          <div className="song-title" title={song.title}>
            {song.title || 'Unknown title'}
          </div>
          <div className="song-artist" title={song.artist}>
            {song.artist || 'Unknown artist'}
          </div>
        </div>

        {/* Duration */}
        <div className="song-duration">
          {formatTime(song.duration)}
        </div>

        {/* Action buttons */}
        <div className="song-actions">
          {showActions && (
            <div className="action-buttons">
              {/* Like */}
              <button
                className={`action-btn like-btn ${isLiked ? 'is-liked' : ''}`}
                title={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
                onClick={handleLikeClick}
              >
                {isLiked ? '💖' : '❤️'}
              </button>

              {/* Add to playlist - SIMPLIFIED VERSION */}
              <div className="playlist-dropdown-wrapper">
                <button
                  ref={buttonRef}
                  className="action-btn playlist-btn"
                  onClick={handlePlaylistToggle}
                  title="Add to playlist"
                  aria-expanded={showPlaylistMenu}
                >
                  📃
                </button>

                {showPlaylistMenu && (
                  <div
                    className="playlist-dropdown-menu"
                    ref={menuRef}
                    style={{
                      position: 'fixed',
                      zIndex: 99999
                    }}
                    onMouseEnter={() => {
                      setShowActions(true);
                      setShowPlaylistMenu(true);
                    }}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        setShowPlaylistMenu(false);
                        setShowActions(false);
                      }, 300);
                    }}
                  >
                    <div className="dropdown-content">
                      <div className="dropdown-header">
                        <h4>Add to Playlist</h4>
                        <small>"{song.title}"</small>
                      </div>

                      <div className="playlists-list">
                        {playlists.length > 0 ? (
                          playlists.map((playlist) => (
                            <button
                              key={playlist.id}
                              className="playlist-item"
                              onClick={(e) => handleAddToPlaylist(e, playlist.id)}
                            >
                              <span className="playlist-icon">📁</span>
                              <span className="playlist-name">{playlist.name}</span>
                              <span className="playlist-count">
                                ({playlist.songs?.length || playlist.songCount || 0})
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="empty-playlists">
                            <div className="empty-icon">📭</div>
                            <p>No playlists yet</p>
                            <small>Create a playlist first</small>
                          </div>
                        )}
                      </div>

                      <div className="dropdown-footer">
                        <button
                          className="close-btn"
                          onClick={() => setShowPlaylistMenu(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* More options */}
              <button
                className="action-btn more-btn"
                title="More options"
                onClick={(e) => e.stopPropagation()}
              >
                ⋮
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default SongCard;
