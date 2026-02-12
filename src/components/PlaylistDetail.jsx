// src/components/PlaylistDetail.jsx
import React, { useState } from 'react';
import PlaylistDisplay from './PlaylistDisplay';
import './PlaylistDetail.css';
import { MoreVertical, Play, ListMusic, Trash2, Plus } from 'lucide-react';
import { playLikeSound } from '../utils/soundEffects';

function PlaylistDetail({ 
  playlist, 
  onBack, 
  playSong, 
  currentSongId, 
  removeSongFromPlaylist,
  deletePlaylist,
  isPlaying,
  togglePlayPause,
  playNextSong,
  playPrevSong,
  isSongLiked,
  onToggleLike,
  addToQueue,
  onOpenPlaylistSidebar,
  getPlaylistStats,
  isShuffled,
  toggleShuffle,
  repeatMode,
  toggleRepeat,
  volume,
  isMuted,
  toggleMute,
  setVolume,
  onDownload
}) {
  if (!playlist) return null;

  const [openMenuId, setOpenMenuId] = useState(null);
  React.useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  }, [playlist?.id]);

  const currentSong = playlist.songs.find(song => song.id === currentSongId);
  const isPlaylistPlaying = currentSong ? isPlaying : false;
  
  const handlePlayPlaylist = () => {
    if (!playlist || playlist.songs.length === 0) return;
    
    if (isPlaylistPlaying) {
      togglePlayPause();
    } else if (currentSong) {
      togglePlayPause();
    } else {
      playSong(playlist.songs[0]);
    }
  };
  
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const totalDuration = playlist.songs.reduce((total, song) => total + (song.duration || 0), 0);
  
  const toggleSongMenu = (songId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === songId ? null : songId);
  };

  const handleRemoveFromPlaylist = (song) => {
    if (removeSongFromPlaylist) {
      removeSongFromPlaylist(playlist.id, song.id);
    }
    setOpenMenuId(null);
  };

  const handleAddToQueue = (song) => {
    if (addToQueue) addToQueue(song);
    setOpenMenuId(null);
  };

  return (
    <div className="playlist-detail-container">
      <div className="playlist-detail-header">
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
        
        <div className="header-actions">
          <button 
            className="delete-btn"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                deletePlaylist(playlist.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
      
      <PlaylistDisplay
        playlist={playlist}
        isPlaying={isPlaylistPlaying}
        onPlayToggle={handlePlayPlaylist}
        onNext={playNextSong}
        onPrev={playPrevSong}
        currentSong={currentSong}
        isLiked={currentSong ? isSongLiked(currentSong.id) : false}
        onLike={() => {
          if (!currentSong) return;
          const liked = isSongLiked ? isSongLiked(currentSong.id) : false;
          if (!liked) playLikeSound();
          onToggleLike(currentSong);
        }}
        isShuffled={isShuffled}
        onToggleShuffle={toggleShuffle}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeat}
        volume={volume}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onVolumeChange={setVolume}
        onDownload={() => onDownload && onDownload(playlist)}
      />
      
      <div className="playlist-songs-container">
        <div className="songs-list-header">
          <div className="songs-header-info">
            <h2 className="playlist-title">{playlist.name}</h2>
            <div className="playlist-stats">
              <span className="stat-item">Songs</span>
              <span className="stat-value">{playlist.songs.length}</span>
              <span className="stat-divider">•</span>
              <span className="stat-item">Duration</span>
              <span className="stat-value">{formatTime(totalDuration)}</span>
            </div>
            {playlist.songs.length === 1 && (
              <div className="playlist-note">1 song — Playlist will grow as you add more</div>
            )}
          </div>
          <div className="songs-section-divider"><span>Songs</span></div>
        </div>
        
        {playlist.songs.length === 0 ? (
          <div className="empty-playlist">
            <div className="empty-state-icon">♪</div>
            <p>No songs added yet</p>
            <button
              className="add-songs-btn"
              onClick={() => onOpenPlaylistSidebar && onOpenPlaylistSidebar()}
            >
              Add songs
            </button>
          </div>
        ) : (
          <div className="playlist-songs-grid">
            {playlist.songs.map((song, index) => (
              <div 
                key={song.id} 
                className={`song-card ${song.id === currentSongId ? 'playing' : ''}`}
                onClick={() => playSong(song)}
              >
                <div className="song-card-content">
                  <div className="song-info">
                    <div className="song-cover-mini">
                      {song.coverUrl ? (
                        <img 
                          src={song.coverUrl} 
                          alt={song.title || 'Cover'} 
                          className="song-cover-img" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="song-cover-placeholder">♪</div>
                      )}
                    </div>
                    <div className="song-details">
                      <div className="song-title">{song.title}</div>
                      <div className="song-artist">{song.artist || 'Unknown Artist'}</div>
                    </div>
                  </div>
                  
                  <div className="song-card-actions">
                    <div className="song-duration">
                      <span className="song-duration-text">{formatTime(song.duration)}</span>
                      <span className="song-plays">{(song.plays ?? song.playCount ?? 0)} plays</span>
                    </div>
                    <button 
                      className={`like-btn ${isSongLiked && isSongLiked(song.id) ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSongLiked && !isSongLiked(song.id)) {
                          playLikeSound();
                        }
                        onToggleLike && onToggleLike(song);
                      }}
                      title={isSongLiked && isSongLiked(song.id) ? 'Unlike' : 'Like'}
                    >
                      <span className="heart-icon">{isSongLiked && isSongLiked(song.id) ? '❤' : '♡'}</span>
                    </button>
                    <button 
                      className={`play-btn ${song.id === currentSongId && isPlaying ? 'playing' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playSong(song);
                      }}
                      title={song.id === currentSongId && isPlaying ? "Pause" : "Play"}
                    >
                      {song.id === currentSongId && isPlaying ? (
                        <span className="pause-icon">⏸</span>
                      ) : (
                        <span className="play-icon">▶</span>
                      )}
                    </button>

                    <div className="song-menu">
                      <button
                        className="menu-trigger"
                        onClick={(e) => toggleSongMenu(song.id, e)}
                        aria-label="More options"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === song.id && (
                        <div className="menu-dropdown">
                          <button
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSong(song);
                              setOpenMenuId(null);
                            }}
                          >
                            <Play size={14} />
                            Play
                          </button>
                          <button
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToQueue(song);
                            }}
                          >
                            <ListMusic size={14} />
                            Add to Queue
                          </button>
                          <button
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              if (onOpenPlaylistSidebar) {
                                onOpenPlaylistSidebar(song);
                              }
                            }}
                          >
                            <Plus size={14} />
                            Add to Playlist
                          </button>
                          <div className="menu-divider"></div>
                          <button
                            className="menu-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromPlaylist(song);
                            }}
                          >
                            <Trash2 size={14} />
                            Remove from Playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistDetail;
