// src/components/PlaylistItem.js
import React from 'react';

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

function PlaylistItem({ song, playSong, isCurrent, onOpenPlaylistSidebar, isLiked, onToggleLike }) {
    console.log('PlaylistItem props:', { 
        hasSong: !!song, 
        hasOnOpenPlaylistSidebar: !!onOpenPlaylistSidebar,
        songTitle: song?.title 
    });

    const handleSongClick = () => {
        if (playSong && song) {
            playSong(song);
        }
    };

    const handleAddToPlaylistClick = (e) => {
        e.stopPropagation();
        console.log('Add to Playlist clicked!');
        if (onOpenPlaylistSidebar) {
            console.log('Calling onOpenPlaylistSidebar with:', song);
            onOpenPlaylistSidebar(song);
        } else {
            console.log('onOpenPlaylistSidebar is undefined!');
        }
    };

    if (!song) return null;

    return (
        <div className={`playlist-item ${isCurrent ? 'playing' : ''}`} onClick={handleSongClick} data-song-id={song.id}>
            <div className="col-title">
<span className={`song-title ${(song?.title || '').trim().split(/[\s,_\-]+/).length > 4 ? 'two-line' : ''}`}>{song.title || 'Unknown Title'}</span>
                {isCurrent && <span className="playing-indicator">▶️</span>}
            </div>
            <div className="col-artist">{song.artist || 'Unknown Artist'}</div>
            <div className="col-album">{song.album || 'Unknown Album'}</div>
            <div className="col-plays">{song.playCount || 0}</div>
            <div className="col-duration">{formatTime(song.duration)}</div>
            <div className="add-menu-container">
                <button 
                    onClick={() => onToggleLike && onToggleLike(song)} 
                    className="like-btn"
                    title={isLiked ? 'Unlike' : 'Like'}
                >
                    {isLiked ? '❤️' : '🤍'}
                </button>
                <button 
                    onClick={handleAddToPlaylistClick} 
                    className="add-btn"
                >
                    + Add to Playlist
                </button>
            </div>
        </div>
    );
}

export default PlaylistItem;