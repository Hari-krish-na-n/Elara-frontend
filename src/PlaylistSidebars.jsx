// src/components/PlaylistSidebar.js
import React, { useState } from 'react';
import'./components/Entire.css'; 
import './App1.css';
const PlaylistSidebar = ({ song, playlists, addSongToPlaylist, onClose, createNewPlaylist }) => {
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [selectedPlaylists, setSelectedPlaylists] = useState([]);

    if (!song) return null;

    const handleAddToPlaylist = (playlistId) => {
        if (addSongToPlaylist) {
            addSongToPlaylist(song.id, playlistId);
            // Visual feedback
            setSelectedPlaylists(prev => [...prev, playlistId]);
            setTimeout(() => {
                setSelectedPlaylists(prev => prev.filter(id => id !== playlistId));
            }, 2000);
        }
    };

    const handleCreateAndAdd = (e) => {
        e.preventDefault();
        if (newPlaylistName.trim()) {
            createNewPlaylist(newPlaylistName.trim());
            setNewPlaylistName('');
        }
    };

    const handleAddToSelected = () => {
        selectedPlaylists.forEach(playlistId => {
            addSongToPlaylist(song.id, playlistId);
        });
        onClose();
    };

    const togglePlaylistSelection = (playlistId) => {
        setSelectedPlaylists(prev => 
            prev.includes(playlistId) 
                ? prev.filter(id => id !== playlistId)
                : [...prev, playlistId]
        );
    };

    return (
        <div className="playlist-sidebar-overlay">
            <div className="playlist-sidebar">
                {/* Header */}
                <div className="playlist-sidebar-header">
                    <h2>Add to Playlist</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Song Info */}
                <div className="song-preview-card">
                    <div className="song-cover-large">
                        <div className="cover-placeholder">
                            {song.title.charAt(0)}
                        </div>
                    </div>
                    <div className="song-info-large">
                        <h3 className="song-title-large">{song.title}</h3>
                        <p className="song-artist-large">{song.artist}</p>
                        <p className="song-album-large">{song.album}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <button className="quick-action-btn" onClick={() => {/* Add to liked songs */}}>
                        ❤️ Add to Liked Songs
                    </button>
                    <button className="quick-action-btn" onClick={() => {/* Add to queue */}}>
                        ⏭️ Add to Queue
                    </button>
                </div>

                {/* Create New Playlist */}
                <div className="create-playlist-section">
                    <h4>Create New Playlist</h4>
                    <form onSubmit={handleCreateAndAdd} className="create-playlist-form">
                        <input
                            type="text"
                            placeholder="Enter playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="playlist-name-input"
                        />
                        <button type="submit" className="create-playlist-btn">
                            + Create
                        </button>
                    </form>
                </div>

                {/* Existing Playlists */}
                <div className="existing-playlists">
                    <h4>Your Playlists ({playlists.length})</h4>
                    <div className="playlists-list">
                        {playlists.length > 0 ? (
                            playlists.map(playlist => (
                                <div 
                                    key={playlist.id} 
                                    className={`playlist-item-card ${selectedPlaylists.includes(playlist.id) ? 'selected' : ''}`}
                                >
                                    <div className="playlist-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlaylists.includes(playlist.id)}
                                            onChange={() => togglePlaylistSelection(playlist.id)}
                                            id={`playlist-${playlist.id}`}
                                        />
                                        <label htmlFor={`playlist-${playlist.id}`}></label>
                                    </div>
                                    <div className="playlist-info">
                                        <span className="playlist-name">{playlist.name}</span>
                                        <span className="playlist-song-count">
                                            {playlist.songs.length} songs
                                        </span>
                                    </div>
                                    <button 
                                        className="add-single-btn"
                                        onClick={() => handleAddToPlaylist(playlist.id)}
                                        title={`Add to ${playlist.name}`}
                                    >
                                        +
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="no-playlists-message">
                                <p>No playlists yet</p>
                                <small>Create your first playlist above</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="sidebar-actions">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="add-to-selected-btn"
                        onClick={handleAddToSelected}
                        disabled={selectedPlaylists.length === 0}
                    >
                        Add to {selectedPlaylists.length} Playlist{selectedPlaylists.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaylistSidebar;