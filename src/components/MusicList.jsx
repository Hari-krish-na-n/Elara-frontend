// src/components/MusicList.jsx - Fixed Cover Image Version
import React, { useEffect, useState } from 'react';
import {
  Heart,
  MoreVertical,
  Play,
  Plus,
  Share2,
  Download,
  Trash2,
  ListMusic,
  Clock,
  Music,
  Search,
} from 'lucide-react';
import './MusicList.css';
import './MusicListMenu.css';
import './PlaylistDisplay.css';
import { playLikeSound, playAddToPlaylistSound } from '../utils/soundEffects';

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="search-match-highlight">{part}</span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const MusicList = ({
  songs = [],
  playSong,
  currentSongId,
  playlists = [],
  addSongToPlaylist,
  searchQuery = '',
  isSongLiked,
  onToggleLike,
  onAddToQueue,
  focusTarget,
  onDragStart,
  onDragEnd,
  onPlaylistSelect,
  onNavigateToLiked,
  onDeleteSong,
  onShareSong,
  onDownloadSong,
  onOpenPlaylistSidebar,
  queue = [],
  moveInQueue,
  isLikedView = false,
  onOpenDetails,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [modalSong, setModalSong] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [localSearch, setLocalSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSong, setDraggedSong] = useState(null);
  const [dropTargetPlaylist, setDropTargetPlaylist] = useState(null);
  const [dropTargetLiked, setDropTargetLiked] = useState(false);

  const safeSongs = Array.isArray(songs) ? songs : [];
  const activeSearch = searchQuery || localSearch;

  // Use activeSearch for internal filtering
  const displayedSongs = safeSongs.filter((song) => {
    if (!activeSearch.trim()) return true;
    const q = activeSearch.toLowerCase();
    return (
      (song.title && song.title.toLowerCase().includes(q)) ||
      (song.artist && song.artist.toLowerCase().includes(q)) ||
      (song.album && song.album.toLowerCase().includes(q)) ||
      (song.fileName && song.fileName.toLowerCase().includes(q))
    );
  });

  // Reset image errors when songs change
  useEffect(() => {
    setImageErrors(new Set());
  }, [safeSongs]);

  // Locate and highlight song when focusTarget changes
  useEffect(() => {
    if (!focusTarget || !focusTarget.id) return;

    let targetEl = null;
    const rows = document.querySelectorAll('.song-row');
    rows.forEach((el) => {
      if (el && el.dataset && el.dataset.songId === focusTarget.id) {
        targetEl = el;
      }
    });

    if (targetEl) {
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (error) {
        console.error('Error scrolling to element:', error);
      }

      targetEl.classList.add('locate-highlight');
      setTimeout(() => {
        if (targetEl) targetEl.classList.remove('locate-highlight');
      }, 2000);
    }
  }, [focusTarget]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.song-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Handle global drag operations
  useEffect(() => {
    const handleGlobalDragStart = (e) => {
      setIsDragging(true);
      try {
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
          const song = JSON.parse(data);
          setDraggedSong(song);
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    };

    const handleGlobalDragEnd = () => {
      setIsDragging(false);
      setDraggedSong(null);
      setDropTargetPlaylist(null);
      setDropTargetLiked(false);
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // Playlist drag handlers
  const handlePlaylistDragOver = (e, playlistId) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetPlaylist(playlistId);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handlePlaylistDragLeave = (e, playlistId) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropTargetPlaylist === playlistId) {
      setDropTargetPlaylist(null);
    }
  };

  const handlePlaylistDrop = (e, playlist) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetPlaylist(null);

    try {
      const songData = JSON.parse(e.dataTransfer.getData('text/plain'));

      if (addSongToPlaylist) {
        playAddToPlaylistSound();
        addSongToPlaylist(songData.id, playlist.id);

        const playlistCard = e.currentTarget;
        playlistCard.style.backgroundColor = 'rgba(70, 130, 180, 0.5)';
        playlistCard.style.transform = 'scale(1.05)';

        setTimeout(() => {
          playlistCard.style.backgroundColor = '';
          playlistCard.style.transform = '';
        }, 300);

        showSuccessMessage(`Added "${songData.title}" to "${playlist.name}"`);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Liked drag handlers
  const handleLikedDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetLiked(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleLikedDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetLiked(false);
  };

  const handleLikedDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetLiked(false);

    try {
      const songData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const song = safeSongs.find((s) => s.id === songData.id);

      if (song && onToggleLike) {
        if (!isSongLiked(song.id)) {
          playLikeSound();
          onToggleLike(song);

          const likedCard = e.currentTarget;
          likedCard.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
          likedCard.style.transform = 'scale(1.05)';

          setTimeout(() => {
            likedCard.style.backgroundColor = '';
            likedCard.style.transform = '';
          }, 300);

          showSuccessMessage(`Added "${songData.title}" to Liked Songs ❤️`);
        } else {
          showInfoMessage(`"${songData.title}" is already in Liked Songs`);
        }
      }
    } catch (error) {
      console.error('Error handling liked drop:', error);
    }
  };

  const showSuccessMessage = (message) => {
    console.log('Success:', message);
  };

  const showInfoMessage = (message) => {
    console.log('Info:', message);
  };

  const handleSongClick = (song) => {
    if (isDragging || openMenuId) return;
    if (currentSongId === song.id && onOpenDetails) {
      onOpenDetails();
      return;
    }
    if (playSong) playSong(song);
  };

  const toggleMenu = (songId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === songId ? null : songId);
  };

  const handleMenuItemClick = (action, song, e) => {
    e.stopPropagation();
    setOpenMenuId(null);
    let performed = false;
    switch (action) {
      case 'play':
        if (playSong) {
          playSong(song);
          performed = true;
        }
        break;
      case 'add-to-queue':
        if (onAddToQueue) {
          onAddToQueue(song);
          performed = true;
          showSuccessMessage(`Added "${song.title}" to queue`);
        }
        break;
      case 'like':
        if (onToggleLike) {
          const liked = isSongLiked && isSongLiked(song.id);
          if (!liked) {
            playLikeSound();
          }
          onToggleLike(song);
          performed = true;
          showSuccessMessage(
            liked
              ? `Removed "${song.title}" from liked`
              : `Added "${song.title}" to liked`
          );
        }
        break;
      case 'add-to-playlist':
        if (playlists && playlists.length > 0) {
          setOpenMenuId(song.id);
        } else {
          showInfoMessage('Create a playlist first');
        }
        break;
      case 'share':
        if (onShareSong) {
          onShareSong(song);
          performed = true;
        } else if (navigator.share) {
          navigator
            .share({
              title: song.title,
              text: `Check out "${song.title}" by ${song.artist || 'Unknown Artist'
                }`,
            })
            .catch(() => { });
          performed = true;
        } else {
          showInfoMessage('Share feature not available');
        }
        break;
      case 'download':
        if (onDownloadSong) {
          onDownloadSong(song);
          performed = true;
        } else {
          showInfoMessage('Download feature not available');
        }
        break;
      case 'delete':
        if (
          onDeleteSong &&
          window.confirm(`Remove "${song.title}" from library?`)
        ) {
          onDeleteSong(song.id);
          performed = true;
          showSuccessMessage(`Removed "${song.title}" from library`);
        }
        break;
      default:
        break;
    }
    if (performed) setModalSong(null);
  };

  const handleAddToPlaylistClick = (song, playlist, e) => {
    e.stopPropagation();
    if (addSongToPlaylist) {
      playAddToPlaylistSound();
      addSongToPlaylist(song.id, playlist.id);
      showSuccessMessage(`Added "${song.title}" to "${playlist.name}"`);
    }
    setOpenMenuId(null);
    setModalSong(null);
  };

  const handleImageError = (songId) => {
    setImageErrors((prev) => new Set([...prev, songId]));
  };

  const getSongCoverUrl = (song) => {
    if (song.coverUrl) return song.coverUrl;
    if (song.cover && typeof song.cover === 'string') return song.cover;
    if (song.picture && song.picture.url) return song.picture.url;
    if (song.picture && song.picture.data && song.picture.format) {
      return `data:${song.picture.format};base64,${song.picture.data}`;
    }
    return null;
  };

  const renderCoverArt = (song) => {
    const hasError = imageErrors.has(song.id);
    const coverUrl = !hasError ? getSongCoverUrl(song) : null;

    if (coverUrl) {
      return (
        <img
          src={coverUrl}
          alt={song.title || 'Cover'}
          className="song-cover-img"
          onError={() => handleImageError(song.id)}
          loading="lazy"
        />
      );
    }

    return (
      <div className="song-cover-placeholder">
        <Music size={18} />
      </div>
    );
  };

  const isLibraryEmpty = safeSongs.length === 0;
  const isSearchEmpty = displayedSongs.length === 0 && !!activeSearch;

  return (
    <div className="music-library-layout full-width">
      {/* Left: liked + playlists column */}
      <div className="playlist-side-panel">
        <div className="side-panel-header">
          <div className="side-header-row">
            <span className="side-header-icon">🎧</span>
            <h3>Playlists & Favorites</h3>
          </div>
        </div>

        {/* Now Playing */}
        {currentSongId && safeSongs.length > 0 && (
          (() => {
            const currentSong = safeSongs.find((s) => s.id === currentSongId);
            if (!currentSong) return null;
            const cover = getSongCoverUrl(currentSong);
            return (
              <div className="now-playing-section">
                <div className="now-playing-indicator">
                  <span className="pulse-dot"></span>
                  <span className="now-playing-text">NOW PLAYING</span>
                </div>
                <div className="current-song-display">
                  <div className="current-song-cover-mini">
                    {cover ? (
                      <img src={cover} alt={currentSong.title || 'Current song'} />
                    ) : (
                      <div className="mini-cover-placeholder">
                        <Music size={20} />
                      </div>
                    )}
                  </div>
                  <div className="current-song-info">
                    <div className="current-song-title">
                      {currentSong.title || currentSong.fileName || 'Unknown Title'}
                    </div>
                    <div className="current-song-artist">
                      {currentSong.artist || 'Unknown Artist'}
                    </div>
                  </div>
                  {currentSong.album && (
                    <div className="current-song-album">
                      from <span className="album-name">{currentSong.album}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* Liked Songs drop zone */}
        <div
          className={`side-liked-card ${dropTargetLiked ? 'drop-target' : ''
            }`}
          onDragOver={handleLikedDragOver}
          onDragLeave={handleLikedDragLeave}
          onDrop={handleLikedDrop}
          onClick={onNavigateToLiked}
        >
          <div className="side-liked-icon">
            <Heart
              size={20}
              fill={
                dropTargetLiked || (isSongLiked && isSongLiked())
                  ? '#ef4444'
                  : 'none'
              }
              color="#ef4444"
            />
          </div>
          <div className="side-liked-info">
            <div className="side-liked-name">Liked Songs</div>
            <div className="side-liked-meta">Drop to like</div>
          </div>
        </div>

        {playlists && playlists.length > 0 && (
          <div className="side-panel-playlists">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className={`side-playlist-card ${dropTargetPlaylist === playlist.id ? 'drop-target' : ''
                  }`}
                onClick={() =>
                  !isDragging &&
                  onPlaylistSelect &&
                  onPlaylistSelect(playlist)
                }
                onDragOver={(e) => handlePlaylistDragOver(e, playlist.id)}
                onDragLeave={(e) => handlePlaylistDragLeave(e, playlist.id)}
                onDrop={(e) => handlePlaylistDrop(e, playlist)}
              >
                <div className="side-playlist-icon">
                  {playlist.coverUrl ? (
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.name || 'Cover'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  ) : (
                    '🎶'
                  )}
                </div>
                <div className="side-playlist-info">
                  <div className="side-playlist-name">{playlist.name}</div>
                  <div className="side-playlist-meta">
                    {playlist.songs?.length || 0} songs
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: song list */}
      <div className="music-list-main-area">
        <div className="top-gradient-cap"></div>
        <div className="content-search-bar">
          <div className="search-pill">
            <Search size={18} className="search-pill-icon" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search your library"
              aria-label="Search your music"
            />
          </div>
        </div>
        {isLibraryEmpty ? (
          <div className="empty-list">
            <div className="empty-list-content">
              <div className="empty-icon">
                {isLikedView ? '❤️' : '🎵'}
              </div>
              <h3>
                {isLikedView ? 'No Liked Songs Yet' : 'Your Music Library is Empty'}
              </h3>
              <p>
                {isLikedView
                  ? 'Drop any track here or click the heart icon to save it.'
                  : 'Add a folder or select files to start building your offline library. We’ll index titles, artists, and albums for quick search.'}
              </p>
              {!isLikedView && (
                <div className="empty-cta-row">
                  <label htmlFor="file-upload" className="empty-cta-btn add-folder">
                    + Add Folder
                  </label>
                  <label htmlFor="file-upload" className="empty-cta-btn select-files">
                    Select Files
                  </label>
                </div>
              )}
            </div>
          </div>
        ) : isSearchEmpty ? (
          <div className="empty-list">
            <div className="empty-list-content">
              <div className="empty-icon">🔍</div>
              <h3>No Results Found</h3>
              <p>No songs match "{activeSearch}"</p>
              <div className="empty-cta-row" style={{ marginTop: '20px' }}>
                <button
                  className="empty-cta-btn select-files"
                  onClick={() => { setLocalSearch(''); if (onSearch) onSearch(''); }}
                >
                  Clear search
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="song-list-simple">
            <div className="disc-header">Library</div>
            {displayedSongs.map((song, index) => (
              <div
                key={song.id}
                className={`song-row ${currentSongId === song.id ? 'current' : ''}`}
                data-song-id={song.id}
                onClick={() => handleSongClick(song)}
                draggable
                onDragStart={(e) => {
                  const data = JSON.stringify(song);
                  e.dataTransfer.setData('text/plain', data);
                  if (onDragStart) onDragStart(song, e);
                }}
                onDragEnd={(e) => {
                  if (onDragEnd) onDragEnd(song, e);
                }}
              >
                <div className="song-index">
                  {currentSongId === song.id ? (
                    <div className="active-song-indicator">
                      <Music size={14} className="playing-icon" />
                    </div>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="song-cover-thumb">{renderCoverArt(song)}</div>
                <div className="song-main">
                  <div className="song-title">
                    <HighlightText text={song.title || song.fileName || 'Unknown Title'} highlight={activeSearch} />
                  </div>
                  <div className="song-artist">
                    <HighlightText text={song.artist || 'Unknown Artist'} highlight={activeSearch} />
                  </div>
                </div>
                <div className="song-duration">
                  <span className="song-duration-text">
                    {formatDuration(song.duration)}
                  </span>
                  <span className="song-plays">
                    {(song.plays ?? song.playCount ?? 0) + ' plays'}
                  </span>
                </div>
                <div className="song-menu">
                  <button
                    className={`like-trigger ${isSongLiked && isSongLiked(song.id) ? 'liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSongLiked && !isSongLiked(song.id)) {
                        playLikeSound();
                      }
                      onToggleLike && onToggleLike(song);
                    }}
                    aria-label={isSongLiked && isSongLiked(song.id) ? 'Unlike' : 'Like'}
                  >
                    <Heart
                      size={18}
                      fill={isSongLiked && isSongLiked(song.id) ? '#ef4444' : 'none'}
                      color={isSongLiked && isSongLiked(song.id) ? '#ef4444' : 'currentColor'}
                    />
                  </button>
                  <button
                    className="menu-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalSong(song);
                      setOpenMenuId(null);
                    }}
                    aria-label="More options"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openMenuId === song.id && !modalSong && (
                    <div className="menu-dropdown">
                      <button
                        className="menu-item"
                        onClick={(e) => handleMenuItemClick('play', song, e)}
                      >
                        <Play size={16} />
                        Play Now
                      </button>
                      <button
                        className="menu-item"
                        onClick={(e) => handleMenuItemClick('add-to-queue', song, e)}
                      >
                        <ListMusic size={16} />
                        Add to Queue
                      </button>
                      <button
                        className="menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          const endIndex = queue?.length ?? 0;
                          if (onAddToQueue) onAddToQueue(song);
                          if (moveInQueue) {
                            moveInQueue(endIndex, 0);
                          }
                          showSuccessMessage(`Will play "${song.title}" next`);
                          setOpenMenuId(null);
                        }}
                      >
                        <ListMusic size={16} />
                        Play Next
                      </button>
                      <button
                        className="menu-item"
                        onClick={(e) => handleMenuItemClick('like', song, e)}
                      >
                        <Heart
                          size={16}
                          fill={isSongLiked && isSongLiked(song.id) ? '#ef4444' : 'none'}
                          color={isSongLiked && isSongLiked(song.id) ? '#ef4444' : 'currentColor'}
                        />
                        {isSongLiked && isSongLiked(song.id) ? 'Unlike' : 'Like'}
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
                        <Plus size={16} />
                        Add to Playlist
                      </button>
                      {playlists && playlists.length > 0 && (
                        <div className="menu-item-with-submenu">
                          <div className="submenu">
                            {playlists.map((playlist) => (
                              <button
                                key={playlist.id}
                                className="submenu-item"
                                onClick={(e) => handleAddToPlaylistClick(song, playlist, e)}
                              >
                                🎶 {playlist.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        className="menu-item"
                        onClick={(e) => handleMenuItemClick('share', song, e)}
                      >
                        <Share2 size={16} />
                        Share
                      </button>
                      <button
                        className="menu-item"
                        onClick={(e) => handleMenuItemClick('download', song, e)}
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <div className="menu-divider"></div>
                      <button
                        className="menu-item delete"
                        onClick={(e) => handleMenuItemClick('delete', song, e)}
                      >
                        <Trash2 size={16} />
                        Remove from Library
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Action Modal */}
      {modalSong && (
        <div
          className="action-modal-overlay"
          onClick={() => setModalSong(null)}
        >
          <div
            className="action-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="action-modal-header">
              <div className="action-modal-cover">
                {renderCoverArt(modalSong)}
              </div>
              <div className="action-modal-info">
                <div className="action-modal-title">
                  {modalSong.title}
                </div>
                <div className="action-modal-subtitle">
                  {modalSong.artist || 'Unknown Artist'}
                </div>
              </div>
            </div>
            <div className="action-modal-content">
              <button
                className="menu-item"
                onClick={(e) =>
                  handleMenuItemClick('play', modalSong, e)
                }
              >
                <Play size={16} />
                Play Now
              </button>
              <button
                className="menu-item"
                onClick={(e) =>
                  handleMenuItemClick('add-to-queue', modalSong, e)
                }
              >
                <ListMusic size={16} />
                Add to Queue
              </button>
              <button
                className="menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  const endIndex = queue?.length ?? 0;
                  if (onAddToQueue) onAddToQueue(modalSong);
                  if (moveInQueue) moveInQueue(endIndex, 0);
                  showSuccessMessage(
                    `Will play "${modalSong.title}" next`
                  );
                  setModalSong(null);
                }}
              >
                <ListMusic size={16} />
                Play Next
              </button>
              <button
                className="menu-item"
                onClick={(e) =>
                  handleMenuItemClick('like', modalSong, e)
                }
              >
                <Heart
                  size={16}
                  fill={
                    isSongLiked && isSongLiked(modalSong.id)
                      ? '#ef4444'
                      : 'none'
                  }
                  color={
                    isSongLiked && isSongLiked(modalSong.id)
                      ? '#ef4444'
                      : 'currentColor'
                  }
                />
                {isSongLiked && isSongLiked(modalSong.id)
                  ? 'Unlike'
                  : 'Like'}
              </button>
              <button
                className="menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalSong(null);
                  if (onOpenPlaylistSidebar)
                    onOpenPlaylistSidebar(modalSong);
                }}
              >
                <Plus size={16} />
                Add to Playlist
              </button>
              <button
                className="menu-item"
                onClick={(e) =>
                  handleMenuItemClick('share', modalSong, e)
                }
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                className="menu-item"
                onClick={(e) =>
                  handleMenuItemClick('download', modalSong, e)
                }
              >
                <Download size={16} />
                Download
              </button>
              <div className="menu-divider"></div>
              <button
                className="menu-item delete"
                onClick={(e) =>
                  handleMenuItemClick('delete', modalSong, e)
                }
              >
                <Trash2 size={16} />
                Remove from Library
              </button>
            </div>
            <div className="action-modal-footer">
              <button
                className="close-modal-btn"
                onClick={() => setModalSong(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Format individual song duration as mm:ss
const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default MusicList;
