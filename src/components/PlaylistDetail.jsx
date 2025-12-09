// src/components/PlaylistDetail.js
import React from 'react';
import PlaylistItem from './PlaylistItem';
import './PlayerControl.css';
function PlaylistDetail({ playlist, onBack, playSong, currentSongId, removeSongFromPlaylist, deletePlaylist }) {
    const handleRemoveSong = (songId) => {
        if (window.confirm('Are you sure you want to remove this song from the playlist?')) {
            removeSongFromPlaylist(playlist.id, songId);
        }
    };

    const handleDeletePlaylist = () => {
        if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
            deletePlaylist(playlist.id);
        }
    };

    return (
        <div className="playlist-detail">
            <div className="playlist-header">
                <button onClick={onBack} className="back-btn">← Back to Playlists</button>
                <div className="playlist-actions">
                    <button onClick={handleDeletePlaylist} className="delete-playlist-btn">
                        Delete Playlist
                    </button>
                </div>
            </div>

            <div className="playlist-info-card">
                <h2>{playlist.name}</h2>
                <p>
                    {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
                    {" "}•{" "}
                    {formatLongTime((playlist.songs || []).reduce((acc, s) => acc + (s?.duration || 0), 0))}
                </p>
            </div>

            {playlist.songs.length === 0 ? (
                <div className="empty-playlist">
                    <p>This playlist is empty</p>
                    <p className="hint">Add songs from your music library using the "+ Playlist" button</p>
                </div>
            ) : (
                    <div className="playlist-songs">
                        <div className="list-header">
                            <div className="col-title">Title</div>
                            <div className="col-artist">Artist</div>
                            <div className="col-album">Album</div>
                            <div className="col-plays">Plays</div>
                            <div className="col-duration">Time</div>
                            <div className="col-actions">Actions</div>
                        </div>
                    <div className="song-list">
                        {playlist.songs.map(song => (
                            <div key={song.id} className="playlist-item-detail" onClick={() => playSong(song)}>
                                <div className="col-title">
                                    <span 
                                        className="song-title clickable"
                                        onClick={(e) => { e.stopPropagation(); playSong(song); }}
                                    >
                                        {song.title}
                                    </span>
                                    {currentSongId === song.id && <span className="playing-indicator">▶️</span>}
                                </div>
                                <div className="col-artist">{song.artist}</div>
                                <div className="col-album">{song.album}</div>
                                <div className="col-plays">{song.playCount || 0}</div>
                                <div className="col-duration">{song.duration ? formatTime(song.duration) : '00:00'}</div>
                                <div className="col-actions">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                                        className="remove-btn"
                                        title="Remove from playlist"
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

// Helper function for time formatting
const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// Playlist duration formatting (HH:MM:SS when hours present)
const formatLongTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const total = Math.floor(seconds || 0);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
};

export default PlaylistDetail;