// src/components/PlaylistItem.jsx - FIXED Add to Playlist
import { GripVertical } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Heart, MoreVertical, Play, Clock, ListPlus, Music, ListMusic } from 'lucide-react';
import './PlaylistItem.css';
import { playLikeSound, playAddToPlaylistSound } from '../utils/soundEffects';

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function PlaylistItem({ 
    song, 
    playSong, 
    isCurrent, 
    playlists,
    addSongToPlaylist,
    onOpenPlaylistSidebar, 
    isLiked, 
    onToggleLike, 
    onAddToQueue,
    index
}) {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
    const playlistDropdownRef = useRef(null);
    
    // Safety check at the beginning
    if (!song) {
        console.warn('PlaylistItem: No song data provided');
        return null;
    }

    const handleSongClick = () => {
        if (playSong && song) {
            playSong(song);
        }
    };

    const handleDragStart = (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', JSON.stringify(song));
        e.dataTransfer.effectAllowed = 'copy';
        
        // Optional: Add custom drag image
        const dragImage = document.createElement('div');
        dragImage.innerHTML = `🎵 ${song.title}`;
        dragImage.style.cssText = `
            background: rgba(30, 60, 114, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-family: 'Cinzel', serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 75, 15);
        setTimeout(() => document.body.removeChild(dragImage), 0);
        
        console.log('Dragging:', song.title);
    };

    const openMobileMenu = (e) => { 
        e.stopPropagation(); 
        setShowMobileMenu(true); 
        document.body.classList.add('modal-open');
    };
    
    const closeMobileMenu = (e) => { 
        e?.stopPropagation?.(); 
        setShowMobileMenu(false); 
        document.body.classList.remove('modal-open');
    };

    const togglePlaylistDropdown = (e) => {
        e.stopPropagation();
        console.log('Toggle dropdown - current state:', showPlaylistDropdown);
        console.log('Available playlists:', playlists);
        setShowPlaylistDropdown(!showPlaylistDropdown);
    };

    const handleAddToPlaylist = (e, playlist) => {
        e.stopPropagation();
        console.log('Adding song to playlist:', song.title, '→', playlist.name);
        
        if (addSongToPlaylist) {
            // Call with songId and playlistId
            playAddToPlaylistSound();
            addSongToPlaylist(song.id, playlist.id);
            console.log('✓ Song added successfully');
        } else {
            console.error('addSongToPlaylist function not provided');
        }
        
        setShowPlaylistDropdown(false);
        
        // Show visual feedback
        const button = e.currentTarget;
        button.style.background = 'rgba(70, 130, 180, 0.5)';
        setTimeout(() => {
            button.style.background = '';
        }, 300);
    };

    const handleCreateNewPlaylist = (e) => {
        e.stopPropagation();
        console.log('Opening playlist sidebar for song:', song.title);
        
        if (onOpenPlaylistSidebar) {
            onOpenPlaylistSidebar(song);
        } else {
            console.error('onOpenPlaylistSidebar function not provided');
        }
        
        setShowPlaylistDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (playlistDropdownRef.current && 
                !playlistDropdownRef.current.contains(event.target)) {
                setShowPlaylistDropdown(false);
            }
        };

        if (showPlaylistDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showPlaylistDropdown]);

    return (
        <>
            {/* ===== MOBILE COMPACT VIEW (Phone) ===== */}
            <div 
                className={`playlist-item-mobile ${isCurrent ? 'playing' : ''}`}
                onClick={handleSongClick}
                data-song-id={song.id}
            >
                <div className="mobile-song-left">
                    <div className="mobile-play-indicator">
                        {isCurrent ? (
                            <Play size={12} color="#87ceeb" fill="#87ceeb" />
                        ) : (
                            <div className="song-index">{index + 1}</div>
                        )}
                    </div>
                    
                    <div className="mobile-song-info">
                        <div className="mobile-song-title">
                            {song.title || 'Unknown Title'}
                        </div>
                        <div className="mobile-song-meta">
                            <span className="mobile-song-plays">
                                {(song.plays ?? song.playCount ?? 0)} plays
                            </span>
                            <span className="mobile-song-duration">
                                <Clock size={10} /> {formatTime(song.duration || 0)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="mobile-song-right">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (!isLiked) playLikeSound();
                            onToggleLike && onToggleLike(song); 
                        }} 
                        className={`mobile-like-btn ${isLiked ? 'active' : ''}`}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                    >
                        <Heart 
                            size={16} 
                            color={isLiked ? '#ef4444' : 'currentColor'} 
                            fill={isLiked ? '#ef4444' : 'none'} 
                        />
                    </button>
                    
                    <button 
                        className="mobile-menu-btn"
                        onClick={openMobileMenu}
                        aria-label="More actions"
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* ===== DESKTOP GRID VIEW ===== */}
            <div 
                className={`playlist-item-desktop ${isCurrent ? 'playing' : ''}`}
                onClick={handleSongClick}
                data-song-id={song.id}
            >
                {/* Cover Column */}
                <div className="col-cover">
                    <div className="song-cover-small">
                        {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="cover-img-small" />
                        ) : (
                            <div className="cover-placeholder-small">
                                <Music size={20} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Title Column */}
                <div className="col-title">
                    <div 
                        className="drag-handle" 
                        draggable="true"
                        onDragStart={handleDragStart}
                        onDragEnd={() => console.log('Drag ended')}
                        style={{ 
                            cursor: 'grab',
                            padding: '4px',
                            marginRight: '8px',
                            opacity: 0.6,
                            transition: 'opacity 0.3s',
                            display: 'inline-block'
                        }}
                        title="Drag to playlist"
                    >
                        <GripVertical size={14} />
                    </div>
                    <span className={`song-title ${(song?.title || '').trim().split(/[\s,_\-]+/).length > 4 ? 'two-line' : ''}`}>
                        {song.title || 'Unknown Title'}
                    </span>
                    {isCurrent && <span className="playing-indicator">▶</span>}
                </div>

                {/* Artist Column */}
                <div className="col-artist">
                    {song.artist || 'Unknown Artist'}
                </div>

                {/* Album Column */}
                <div className="col-album">
                    {song.album || 'Unknown Album'}
                </div>

                {/* Plays Column */}
                <div className="col-plays">
                    {song.plays || song.playCount || 0}
                </div>

                {/* Duration Column */}
                <div className="col-duration">
                    {formatTime(song.duration || 0)}
                </div>

                {/* Actions Column */}
                <div className="col-actions">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (!isLiked) playLikeSound();
                            onToggleLike && onToggleLike(song); 
                        }} 
                        className={`action-icon-btn like-btn ${isLiked ? 'active' : ''}`}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                    >
                        <Heart 
                            size={18} 
                            color={isLiked ? '#ef4444' : 'currentColor'} 
                            fill={isLiked ? '#ef4444' : 'none'} 
                        />
                    </button>
                    
                    <button 
                        className="action-icon-btn queue-btn"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onAddToQueue && onAddToQueue(song); 
                        }}
                        aria-label="Add to Queue"
                        title="Add to Queue"
                    >
                        <ListPlus size={18} />
                    </button>
                    
                    <div className="playlist-dropdown-wrapper" ref={playlistDropdownRef}>
                        <button 
                            className="add-btn"
                            onClick={togglePlaylistDropdown}
                            aria-label="Add to Playlist"
                            title="Add to Playlist"
                        >
                            Add to Playlist
                        </button>
                        
                        {showPlaylistDropdown && (
                            <div className="playlist-dropdown" onClick={(e) => e.stopPropagation()}>
                                <div className="dropdown-header">
                                    <h4>Add to Playlist</h4>
                                    <button 
                                        className="create-new-btn"
                                        onClick={handleCreateNewPlaylist}
                                        title="Create a new playlist"
                                    >
                                        + Create New
                                    </button>
                                </div>
                                <div className="dropdown-content">
                                    {playlists && playlists.length > 0 ? (
                                        playlists.map((playlist) => (
                                            <button
                                                key={playlist.id}
                                                className="playlist-option"
                                                onClick={(e) => handleAddToPlaylist(e, playlist)}
                                                title={`Add to ${playlist.name}`}
                                            >
                                                <ListMusic size={14} />
                                                <span className="playlist-option-name">{playlist.name}</span>
                                                <span className="song-count">
                                                    {playlist.songs?.length || 0}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="no-playlists">
                                            <p>No playlists yet</p>
                                            <button 
                                                className="create-first-btn"
                                                onClick={handleCreateNewPlaylist}
                                            >
                                                Create your first playlist
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== MOBILE BOTTOM SHEET MENU ===== */}
            {showMobileMenu && (
                <div className="mobile-bottom-sheet" onClick={closeMobileMenu}>
                    <div className="sheet-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-drag-handle"></div>
                        
                        <div className="sheet-song-info">
                            <div className="sheet-song-title">{song.title || 'Unknown Title'}</div>
                            <div className="sheet-song-artist">{song.artist || 'Unknown Artist'}</div>
                        </div>
                        
                        <div className="sheet-actions">
                            <button 
                                className="sheet-action-btn primary"
                                onClick={() => { 
                                    playSong && playSong(song); 
                                    closeMobileMenu(); 
                                }}
                            >
                                <Play size={16} /> Play Now
                            </button>
                            
                            <button 
                                className="sheet-action-btn"
                                onClick={() => { 
                                    onAddToQueue && onAddToQueue(song); 
                                    closeMobileMenu(); 
                                }}
                            >
                                <ListPlus size={16} /> Add to Queue
                            </button>
                            
                            <button 
                                className="sheet-action-btn"
                                onClick={() => { 
                                    if (onOpenPlaylistSidebar) {
                                        onOpenPlaylistSidebar(song); 
                                    }
                                    closeMobileMenu(); 
                                }}
                            >
                                <ListMusic size={16} /> Add to Playlist
                            </button>
                            
                            <button 
                                className="sheet-action-btn"
                                onClick={() => { 
                                    onToggleLike && onToggleLike(song); 
                                    closeMobileMenu(); 
                                }}
                            >
                                <Heart size={16} /> {isLiked ? 'Remove from Liked' : 'Add to Liked'}
                            </button>
                        </div>
                        
                        <button 
                            className="sheet-cancel-btn"
                            onClick={closeMobileMenu}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default PlaylistItem;
