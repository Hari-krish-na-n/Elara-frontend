// src/views/PlaylistsView.js
import React, { useState } from 'react';
import'./Entire.css'; 
function PlaylistsView({ playlists, createNewPlaylist, onPlaylistSelect }) {
    const [playlistName, setPlaylistName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (playlistName.trim()) {
            createNewPlaylist(playlistName.trim());
            setPlaylistName('');
        }
    };

    const handleViewDetails = (playlist) => {
        if (onPlaylistSelect) {
            onPlaylistSelect(playlist);
        }
    };

    return (
        <div className="playlists-view">
            <h2>Your Playlists 📃</h2>
            
            <div className="create-playlist-section">
                <h3>Create New Playlist</h3>
                <form onSubmit={handleCreate}>
                    <input
                        type="text"
                        placeholder="Enter playlist name"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        required
                    />
                    <button type="submit" className="create-btn">
                        + Create
                    </button>
                </form>
            </div>

            <div className="playlist-list">
                {playlists.length === 0 ? (
                    <p className="no-playlists">You haven't created any playlists yet.</p>
                ) : (
                    playlists.map(playlist => (
                        <div key={playlist.id} className="playlist-card">
                            <div className="playlist-info">
                                <h4>{playlist.name}</h4>
                                <small>{playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}</small>
                            </div>
                            <button 
                                className="view-details-btn"
                                onClick={() => handleViewDetails(playlist)}
                            >
                                View Details
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PlaylistsView;