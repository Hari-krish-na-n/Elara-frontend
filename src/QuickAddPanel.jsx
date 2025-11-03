// src/components/QuickAddPanel.js
import React, { useState } from 'react';

const QuickAddPanel = ({ song, playlists, addSongToPlaylist, onClose }) => {
    const [selectedPlaylists, setSelectedPlaylists] = useState([]);

    const togglePlaylistSelection = (playlistId) => {
        setSelectedPlaylists(prev => 
            prev.includes(playlistId) 
                ? prev.filter(id => id !== playlistId)
                : [...prev, playlistId]
        );
    };

    const handleAddToSelected = () => {
        selectedPlaylists.forEach(playlistId => {
            addSongToPlaylist(song.id, playlistId);
        });
        onClose();
    };

    return (
        <div className="quick-add-panel-overlay">
            <div className="quick-add-panel">
                <div className="panel-header">
                    <h3>Add "{song.title}" to Playlists</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="song-preview">
                    <div className="preview-cover"></div>
                    <div className="preview-info">
                        <div className="preview-title">{song.title}</div>
                        <div className="preview-artist">{song.artist}</div>
                    </div>
                </div>
                
                <div className="playlists-selection">
                    <div className="selection-title">Select playlists:</div>
                    <div className="playlists-list">
                        {playlists.map(playlist => (
                            <label key={playlist.id} className="playlist-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedPlaylists.includes(playlist.id)}
                                    onChange={() => togglePlaylistSelection(playlist.id)}
                                />
                                <span className="checkmark"></span>
                                <span className="playlist-name">{playlist.name}</span>
                                <span className="song-count">({playlist.songs.length})</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="panel-actions">
                    <button 
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="add-btn"
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