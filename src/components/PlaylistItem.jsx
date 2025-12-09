// src/components/PlaylistItem.js
import React, { useState } from 'react';
import { Heart, ListMusic, PlusCircle, Play } from 'lucide-react';
import './Entire.css';
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
    const openMobileMenu = (e) => { e.stopPropagation(); setShowMobileMenu(true); try{ document.body.classList.add('modal-open'); }catch(_){} };
    const closeMobileMenu = (e) => { e?.stopPropagation?.(); setShowMobileMenu(false); try{ document.body.classList.remove('modal-open'); }catch(_){} };

    return (
        <div className={`playlist-item ${isCurrent ? 'playing' : ''}`} onClick={handleSongClick} data-song-id={song.id}>
            <div className="col-title">
                <span className={`song-title ${(song?.title || '').trim().split(/[\s,_\-]+/).length > 4 ? 'two-line' : ''}`}>{song.title || 'Unknown Title'}</span>
                {isCurrent && <span className="playing-indicator">▶️</span>}
            </div>
            <div className="col-artist">{song.artist || 'Unknown Artist'}</div>
            <div className="col-album">{song.album || 'Unknown Album'}</div>
            <div className="col-plays">{(song.plays ?? song.playCount ?? 0)}</div>
            <div className="col-duration">{formatTime(song.duration)}</div>
            <div className="col-actions">
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(song); }} 
                    className={`action-icon-btn like-btn ${isLiked ? 'active' : ''}`}
                    title={isLiked ? 'Unlike' : 'Like'}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                    <Heart size={16} color={isLiked ? '#ef4444' : 'currentColor'} fill={isLiked ? '#ef4444' : 'none'} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddToQueue && onAddToQueue(song); }} 
                    className="action-icon-btn queue-btn"
                    title="Add to Queue"
                    aria-label="Add to Queue"
                >
                    <ListMusic size={16} />
                </button>
                <button 
                    onClick={handleAddToPlaylistClick} 
                    className="add-btn desktop-only"
                >
                    <PlusCircle size={16} style={{ marginRight: 6 }} /> Add to Playlist
                </button>
                <button className="more-btn mobile-only" aria-label="More actions" onClick={openMobileMenu}>⋯</button>
            </div>

            {showMobileMenu && (
                <div className="bottom-sheet" role="dialog" aria-modal="true" onClick={closeMobileMenu}>
                    <div className="sheet-card" onClick={(e)=>e.stopPropagation()}>
                        <div className="sheet-handle" />
                        <button className="sheet-item" onClick={()=>{ playSong && playSong(song); closeMobileMenu(); }}>
                            <Play size={16} style={{ marginRight: 8 }} /> Play
                        </button>
                        <button className="sheet-item" onClick={()=>{ onAddToQueue && onAddToQueue(song); closeMobileMenu(); }}>
                            <ListMusic size={16} style={{ marginRight: 8 }} /> Add to Queue
                        </button>
                        <button className="sheet-item" onClick={()=>{ handleAddToPlaylistClick(new Event('click')); closeMobileMenu(); }}>
                            <PlusCircle size={16} style={{ marginRight: 8 }} /> Add to Playlist
                        </button>
                        <button className="sheet-cancel" onClick={closeMobileMenu}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlaylistItem;