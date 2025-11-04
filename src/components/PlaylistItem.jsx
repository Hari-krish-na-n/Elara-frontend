// src/components/PlaylistItem.js
import React, { useState } from 'react';

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

function PlaylistItem({ song, playSong, isCurrent, onOpenPlaylistSidebar, isLiked, onToggleLike, onAddToQueue }) {
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

    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const openMobileMenu = (e) => { e.stopPropagation(); setShowMobileMenu(true); };
    const closeMobileMenu = (e) => { e?.stopPropagation?.(); setShowMobileMenu(false); };

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
            <div className="add-menu-container desktop-actions">
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
            <button className="more-btn" aria-label="More actions" onClick={openMobileMenu}>⋯</button>

            {showMobileMenu && (
                <div className="bottom-sheet" role="dialog" aria-modal="true" onClick={closeMobileMenu}>
                    <div className="sheet-card" onClick={(e)=>e.stopPropagation()}>
                        <div className="sheet-handle" />
                        <button className="sheet-item" onClick={()=>{ playSong && playSong(song); closeMobileMenu(); }}>Play ▶️</button>
                        <button className="sheet-item" onClick={()=>{ onToggleLike && onToggleLike(song); closeMobileMenu(); }}>{isLiked ? 'Unlike ❤️' : 'Like 🤍'}</button>
                        <button className="sheet-item" onClick={()=>{ onAddToQueue && onAddToQueue(song); closeMobileMenu(); }}>Add to Queue ⏭️</button>
                        <button className="sheet-item" onClick={()=>{ handleAddToPlaylistClick(new Event('click')); closeMobileMenu(); }}>Add to Playlist 📃</button>
                        <button className="sheet-cancel" onClick={closeMobileMenu}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlaylistItem;