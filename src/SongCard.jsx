// src/components/SongCard.js
import React, { useState } from 'react';
import './App.css';
const SongCard = ({ song, playSong, isCurrent, playlists, addSongToPlaylist }) => {
    const [showActions, setShowActions] = useState(false);
    const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

    return (
        <div 
            className="song-card"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false);
                setShowPlaylistMenu(false);
            }}
            onClick={() => playSong(song)}
        >
            <div className="song-card-content">
                <div className="song-cover">
                    <div className="cover-placeholder">
                        {song.title.charAt(0)}
                    </div>
                    {showActions && (
                        <button 
                            className="play-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                playSong(song);
                            }}
                        >
                            ▶️
                        </button>
                    )}
                </div>
                
                <div className="song-info">
                    <div className="song-title">{song.title}</div>
                    <div className="song-artist">{song.artist}</div>
                </div>
                
                <div className="song-duration">
                    {formatTime(song.duration)}
                </div>
                
                <div className="song-actions">
                    {showActions && (
                        <div className="action-buttons">
                            <button 
                                className="action-btn like-btn"
                                title="Add to liked songs"
                            >
                                ❤️
                            </button>
                            
                            <div className="playlist-dropdown-container">
                                <button 
                                    className="action-btn playlist-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPlaylistMenu(!showPlaylistMenu);
                                    }}
                                    title="Add to playlist"
                                >
                                    📃
                                </button>
                                
                                {showPlaylistMenu && (
                                    <div className="playlist-quick-menu">
                                        <div className="menu-title">Add to playlist</div>
                                        {playlists.map(playlist => (
                                            <div
                                                key={playlist.id}
                                                className="playlist-option"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addSongToPlaylist(song.id, playlist.id);
                                                    setShowPlaylistMenu(false);
                                                }}
                                            >
                                                {playlist.name}
                                            </div>
                                        ))}
                                        {playlists.length === 0 && (
                                            <div className="no-playlists">
                                                No playlists yet
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                className="action-btn more-btn"
                                title="More options"
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