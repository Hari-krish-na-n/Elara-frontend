// src/components/PlaylistsView.jsx - Fixed Version
import React, { useRef, useState } from 'react';
import './Entire.css';
import './PlaylistView.css';
import { MoreVertical, Image as ImageIcon, Pencil, AlignLeft, Globe, Lock, Download, Trash2, Brush } from 'lucide-react';
import { fileToDataURL } from './utils/audioUtils';

function PlaylistsView({ playlists, createNewPlaylist, onPlaylistSelect, duplicatePlaylist, updatePlaylist, deletePlaylist }) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editModal, setEditModal] = useState(null); // { id, name, description }
  const fileInputRef = useRef(null);
  const pendingCoverFor = useRef(null);

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    setError('');

    if (!newPlaylistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    if (playlists.some(p => p.name.toLowerCase() === newPlaylistName.trim().toLowerCase())) {
      setError('A playlist with this name already exists');
      return;
    }

    try {
      createNewPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setError('');
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'success-toast';
      toast.textContent = `Created playlist "${newPlaylistName.trim()}"`;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2500);
    } catch (err) {
      setError('Failed to create playlist. Please try again.');
      console.error('Error creating playlist:', err);
    }
  };

  const handlePlaylistClick = (playlist) => {
    try {
      if (onPlaylistSelect && typeof onPlaylistSelect === 'function') {
        onPlaylistSelect(playlist);
      } else {
        console.error('onPlaylistSelect is not a function');
      }
    } catch (err) {
      console.error('Error selecting playlist:', err);
      // Alert removed
    }
  };

  const handleDuplicatePlaylist = (playlist, e) => {
    e.stopPropagation();
    
    try {
      if (duplicatePlaylist && typeof duplicatePlaylist === 'function') {
        duplicatePlaylist(playlist.id);
        // Notifications removed
      }
    } catch (err) {
      console.error('Error duplicating playlist:', err);
      // Alert removed
    }
  };

  const handleOpenMenu = (playlist, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === playlist.id ? null : playlist.id);
  };

  const triggerCoverUpload = (playlist, e) => {
    e.stopPropagation();
    pendingCoverFor.current = playlist;
    fileInputRef.current?.click();
  };

  const onCoverFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const playlist = pendingCoverFor.current;
    pendingCoverFor.current = null;
    if (!file || !playlist) return;
    try {
      const dataURL = await fileToDataURL(file);
      if (updatePlaylist) {
        updatePlaylist(playlist.id, { coverUrl: dataURL, updatedAt: new Date().toISOString() });
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to set playlist cover:', err);
    }
  };

  const openEditDetails = (playlist, e) => {
    e.stopPropagation();
    setEditModal({
      id: playlist.id,
      name: playlist.name || '',
      description: playlist.description || ''
    });
    setOpenMenuId(null);
  };

  const saveEditDetails = () => {
    if (!editModal || !updatePlaylist) return;
    const { id, name, description } = editModal;
    updatePlaylist(id, { name: name?.trim() || 'Untitled', description: description || '', updatedAt: new Date().toISOString() });
    setEditModal(null);
  };

  const togglePublic = (playlist, e) => {
    e.stopPropagation();
    if (!updatePlaylist) return;
    updatePlaylist(playlist.id, { isPublic: !playlist.isPublic, updatedAt: new Date().toISOString() });
    setOpenMenuId(null);
  };

  const clearSongs = (playlist, e) => {
    e.stopPropagation();
    if (!updatePlaylist) return;
    updatePlaylist(playlist.id, { songs: [], updatedAt: new Date().toISOString() });
    setOpenMenuId(null);
  };

  const exportPlaylist = (playlist, e) => {
    e.stopPropagation();
    const payload = {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      isPublic: !!playlist.isPublic,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      coverUrl: playlist.coverUrl || null,
      songs: (playlist.songs || []).map(s => ({ id: s.id, title: s.title, artist: s.artist, duration: s.duration }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(playlist.name || 'playlist').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    setOpenMenuId(null);
  };

  const deletePlaylistAction = (playlist, e) => {
    e.stopPropagation();
    if (deletePlaylist) {
      deletePlaylist(playlist.id);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="playlists-view">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onCoverFileSelected}
        style={{ display: 'none' }}
      />
      <div className="playlists-header">
        <h2>🎵 Your Playlists</h2>
        <p className="playlists-subtitle">
          Create and manage your music collections
        </p>
      </div>

      {/* Create New Playlist Section */}
      <div className="create-playlist-section">
        <h3>✨ Create New Playlist</h3>
        <form onSubmit={handleCreatePlaylist} className="create-playlist-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter playlist name..."
              value={newPlaylistName}
              onChange={(e) => {
                setNewPlaylistName(e.target.value);
                setError('');
              }}
              className="playlist-name-input"
              maxLength={50}
            />
            <button type="submit" className="create-btn">
              Create Playlist
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>

      {/* Playlists Grid */}
      {playlists && playlists.length > 0 ? (
        <div className="playlist-list">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="playlist-card"
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="playlist-card-header">
                <div className="playlist-icon">
                  {playlist.coverUrl ? (
                    <img src={playlist.coverUrl} alt={playlist.name || 'Cover'} className="playlist-cover-thumb" />
                  ) : (
                    <span>🎶</span>
                  )}
                </div>
                <div className="playlist-stats">
                  <span className="song-count">{playlist.songs?.length || 0} songs</span>
                </div>
              </div>
              
              <div className="playlist-info">
                <h4 className="playlist-name">{playlist.name}</h4>
                <p className="playlist-meta">
                  {playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'Recently created'}
                </p>
              </div>

              <div className="playlist-actions">
                <button
                  className="view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaylistClick(playlist);
                  }}
                  aria-label={`View ${playlist.name}`}
                >
                  View Details
                </button>
                {duplicatePlaylist && (
                  <button
                    className="duplicate-btn"
                    onClick={(e) => handleDuplicatePlaylist(playlist, e)}
                    aria-label={`Duplicate ${playlist.name}`}
                  >
                    📋 Duplicate
                  </button>
                )}
                <button
                  className="playlist-options-btn"
                  onClick={(e) => handleOpenMenu(playlist, e)}
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                </button>
                {openMenuId === playlist.id && (
                  <div className="playlist-options-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button className="options-item" onClick={(e) => triggerCoverUpload(playlist, e)}>
                      <ImageIcon size={16} />
                      Change Cover
                    </button>
                    <button className="options-item" onClick={(e) => openEditDetails(playlist, e)}>
                      <Pencil size={16} />
                      Rename
                    </button>
                    <button className="options-item" onClick={(e) => openEditDetails(playlist, e)}>
                      <AlignLeft size={16} />
                      Edit Description
                    </button>
                    <button className="options-item" onClick={(e) => togglePublic(playlist, e)}>
                      {playlist.isPublic ? <Lock size={16} /> : <Globe size={16} />}
                      {playlist.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                    <button className="options-item" onClick={(e) => exportPlaylist(playlist, e)}>
                      <Download size={16} />
                      Export JSON
                    </button>
                    <button className="options-item" onClick={(e) => clearSongs(playlist, e)}>
                      <Brush size={16} />
                      Clear Songs
                    </button>
                    <div className="options-divider"></div>
                    <button className="options-item delete" onClick={(e) => deletePlaylistAction(playlist, e)}>
                      <Trash2 size={16} />
                      Delete Playlist
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-playlists">
          <div className="no-playlists-content">
            <div className="no-playlists-icon">🎭</div>
            <h3>No Playlists Yet</h3>
            <p>Create your first playlist to organize your music</p>
          </div>
        </div>
      )}
      {editModal && (
        <div className="playlist-edit-overlay" onClick={() => setEditModal(null)}>
          <div className="playlist-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="playlist-edit-header">Edit Playlist</div>
            <div className="playlist-edit-body">
              <label className="playlist-edit-label">Name</label>
              <input
                className="playlist-edit-input"
                type="text"
                value={editModal.name}
                onChange={(e) => setEditModal(prev => ({ ...prev, name: e.target.value }))}
                maxLength={50}
              />
              <label className="playlist-edit-label">Description</label>
              <textarea
                className="playlist-edit-textarea"
                rows={3}
                value={editModal.description}
                onChange={(e) => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="playlist-edit-footer">
              <button className="edit-cancel-btn" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="edit-save-btn" onClick={saveEditDetails}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistsView;
