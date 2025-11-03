// src/components/SongContextMenu.js
import React, { useState, useEffect, useRef } from 'react';

const SongContextMenu = ({ song, playlists, addSongToPlaylist, position, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleAddToPlaylist = (playlistId) => {
        addSongToPlaylist(song.id, playlistId);
        onClose();
    };

    return (
        <div 
            ref={menuRef}
            className="context-menu"
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 1000
            }}
        >
            <div className="context-menu-header">
                <div className="song-info-preview">
                    <div className="preview-title">{song.title}</div>
                    <div className="preview-artist">{song.artist}</div>
                </div>
            </div>
            
            <div className="context-menu-item" onClick={() => playSong(song)}>
                <span className="menu-icon">▶️</span>
                Start playback
            </div>
            
            <div className="context-menu-divider"></div>
            
            <div className="context-menu-section">
                <div className="section-title">Add to playlist</div>
                {playlists.length > 0 ? (
                    playlists.map(playlist => (
                        <div 
                            key={playlist.id}
                            className="context-menu-item"
                            onClick={() => handleAddToPlaylist(playlist.id)}
                        >
                            <span className="menu-icon">📃</span>
                            {playlist.name}
                        </div>
                    ))
                ) : (
                    <div className="context-menu-item disabled">
                        No playlists available
                    </div>
                )}
            </div>

            <div className="context-menu-divider"></div>

            <div className="context-menu-item" onClick={() => {/* Add to liked songs */}}>
                <span className="menu-icon">❤️</span>
                Add to liked songs
            </div>
            
            <div className="context-menu-item" onClick={() => {/* Add to queue */}}>
                <span className="menu-icon">⏭️</span>
                Add to queue
            </div>
        </div>
    );
};

export default SongContextMenu;