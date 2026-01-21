// src/components/PlaylistDisplay.jsx
import React, { useState } from 'react';
import './PlaylistDisplay.css';
import { 
  Play, Pause, SkipBack, SkipForward, Heart, 
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
  MoreVertical, Share2, Download, Edit2, 
  Music, Clock, TrendingUp, ListMusic
} from 'lucide-react';

function PlaylistDisplay({ 
  playlist, 
  isPlaying, 
  onPlayToggle,
  onNext,
  onPrev,
  onLike,
  isLiked,
  currentSong,
  isShuffled,
  onToggleShuffle,
  repeatMode, // 'off', 'all', 'one'
  onToggleRepeat,
  volume,
  isMuted,
  onToggleMute,
  onVolumeChange,
  onShare,
  onDownload,
  onEdit,
  playCount,
  currentTime,
  duration
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!playlist) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = playlist.songs.reduce((total, song) => total + (song.duration || 0), 0);
  const totalPlays = playlist.songs.reduce((total, song) => total + (song.plays || 0), 0);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const VolumeIcon = isMuted ? VolumeX : Volume2;

  return (
    <div className="playlist-display-enhanced">
      {/* Background Gradient */}
      <div className="playlist-bg-gradient"></div>

      {/* Header Section */}
      <div className="playlist-display-header">
        <div className="playlist-cover-section">
          <div className="playlist-cover-large">
            {playlist.coverUrl ? (
              <img src={playlist.coverUrl} alt={playlist.name} className="cover-img-large" />
            ) : (
              <div className="cover-placeholder-large">
                <Music size={60} />
              </div>
            )}
            {isPlaying && (
              <div className="cover-overlay-playing">
                <div className="equalizer-animation">
                  <span className="eq-bar"></span>
                  <span className="eq-bar"></span>
                  <span className="eq-bar"></span>
                  <span className="eq-bar"></span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="playlist-info-section">
          <div className="playlist-type-badge">PLAYLIST</div>
          <h1 className="playlist-title-large">{playlist.name}</h1>
          
          {playlist.description && (
            <p className="playlist-description">{playlist.description}</p>
          )}
          
          <div className="playlist-stats-row">
            <div className="stat-item">
              <ListMusic size={16} />
              <span>{playlist.songs.length} songs</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <Clock size={16} />
              <span>{formatTime(totalDuration)}</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <TrendingUp size={16} />
              <span>{totalPlays} plays</span>
            </div>
          </div>

          {playlist.createdAt && (
            <div className="playlist-metadata">
              Created {new Date(playlist.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          )}
        </div>

        <div className="playlist-actions-menu">
          <button 
            className="menu-toggle-btn"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="playlist-dropdown-menu">
              <button className="menu-option" onClick={onShare}>
                <Share2 size={16} />
                <span>Share Playlist</span>
              </button>
              <button className="menu-option" onClick={onDownload}>
                <Download size={16} />
                <span>Download All</span>
              </button>
              <button className="menu-option" onClick={onEdit}>
                <Edit2 size={16} />
                <span>Edit Details</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Controls Section */}
      <div className="playlist-main-controls">
        <div className="controls-left">
          <button 
            className={`control-btn-modern shuffle-btn ${isShuffled ? 'active' : ''}`}
            onClick={onToggleShuffle}
            title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
            aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <Shuffle size={18} />
          </button>

          <button 
            className={`control-btn-modern repeat-btn ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={onToggleRepeat}
            title={
              repeatMode === 'one' ? 'Repeat one' : 
              repeatMode === 'all' ? 'Repeat all' : 
              'Repeat off'
            }
            aria-label="Toggle repeat"
          >
            <RepeatIcon size={18} />
            {repeatMode === 'one' && <span className="repeat-one-badge">1</span>}
          </button>
        </div>

        <div className="controls-center">
          <button 
            className="control-btn-modern prev-btn"
            onClick={onPrev}
            disabled={!currentSong}
            aria-label="Previous track"
          >
            <SkipBack size={22} />
          </button>
          
          <button 
            className="control-btn-modern play-btn-large"
            onClick={onPlayToggle}
            disabled={!playlist.songs || playlist.songs.length === 0}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          
          <button 
            className="control-btn-modern next-btn"
            onClick={onNext}
            disabled={!currentSong}
            aria-label="Next track"
          >
            <SkipForward size={22} />
          </button>
        </div>

        <div className="controls-right">
          {currentSong && (
            <button 
              className={`control-btn-modern like-btn ${isLiked ? 'active' : ''}`}
              onClick={onLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart 
                size={20} 
                fill={isLiked ? '#ef4444' : 'none'} 
                color={isLiked ? '#ef4444' : 'currentColor'} 
              />
            </button>
          )}

          <div className="volume-control-group">
            <button 
              className="control-btn-modern volume-btn"
              onClick={onToggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon size={20} />
            </button>
            
            {showVolumeSlider && (
              <div 
                className="volume-slider-popup"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : Math.round((volume || 1) * 100)}
                  onChange={(e) => onVolumeChange && onVolumeChange(Number(e.target.value) / 100)}
                  className="volume-slider-vertical"
                  orient="vertical"
                  aria-label="Volume"
                />
                <span className="volume-percentage">
                  {isMuted ? 0 : Math.round((volume || 1) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (if song is playing) */}
      {currentSong && (
        <div className="playlist-progress-section">
          <span className="progress-time-current">{formatTime(currentTime)}</span>
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              >
                <div className="progress-bar-thumb"></div>
              </div>
            </div>
          </div>
          <span className="progress-time-total">{formatTime(duration)}</span>
        </div>
      )}

      {/* Now Playing Section */}
      {currentSong && (
        <div className="now-playing-section">
          <div className="now-playing-indicator">
            <span className="pulse-dot"></span>
            <span className="now-playing-text">NOW PLAYING</span>
          </div>
          
          <div className="current-song-display">
            <div className="current-song-cover-mini">
              {currentSong.coverUrl ? (
                <img src={currentSong.coverUrl} alt={currentSong.title} />
              ) : (
                <div className="mini-cover-placeholder">
                  <Music size={20} />
                </div>
              )}
            </div>
            
            <div className="current-song-info">
              <div className="current-song-title">{currentSong.title}</div>
              <div className="current-song-artist">{currentSong.artist}</div>
            </div>
            
            {currentSong.album && (
              <div className="current-song-album">
                from <span className="album-name">{currentSong.album}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!playlist.songs || playlist.songs.length === 0) && (
        <div className="playlist-empty-state">
          <Music size={60} className="empty-icon" />
          <h3>No songs in this playlist</h3>
          <p>Add some songs to get started</p>
        </div>
      )}
    </div>
  );
}

export default PlaylistDisplay;