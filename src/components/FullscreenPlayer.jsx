import React, { useEffect, useState, useRef } from 'react';
import {
    ChevronDown,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Heart,
    MoreHorizontal
} from 'lucide-react';
import './FullscreenPlayer.css';

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const FullscreenPlayer = ({
    song,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    onClose,
    isShuffled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    isCurrentLiked,
    onToggleCurrentLike
}) => {
    const [startY, setStartY] = useState(null);
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const overlayRef = useRef(null);

    // Body Scroll Lock & ESC listener
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Swipe logic
    const handleTouchStart = (e) => {
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (startY === null) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // Visual feedback for swipe (optional but nice)
        if (diff > 0 && overlayRef.current) {
            overlayRef.current.style.transform = `translateY(${diff}px)`;
        }

        if (diff > 150) { // Swipe threshold
            onClose();
            setStartY(null);
        }
    };

    const handleTouchEnd = () => {
        if (overlayRef.current) {
            overlayRef.current.style.transform = '';
        }
        setStartY(null);
    };

    const handleSeek = (e) => {
        const pct = Number(e.target.value);
        const time = (pct / 100) * duration;
        seekTo(time);
    };

    if (!song) return null;

    return (
        <div
            className="fs-overlay"
            ref={overlayRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Cinematic Animated Background */}
            <div
                className="fs-blur-bg"
                style={{ backgroundImage: `url(${song.coverUrl})` }}
            />
            <div className="fs-vignette" />

            <div className="fs-content">
                <header className="fs-header">
                    <button className="fs-collapse-btn" onClick={onClose} aria-label="Collapse">
                        <ChevronDown size={32} />
                    </button>
                    <div className="fs-header-meta">
                        <span>NOW PLAYING</span>
                        <strong>{song.album || 'Elara Selects'}</strong>
                    </div>
                    <button className="fs-more-btn">
                        <MoreHorizontal size={24} />
                    </button>
                </header>

                <main className="fs-main">
                    <div className="fs-art-wrapper">
                        <div className="fs-glow-ring" />
                        {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="fs-album-art" />
                        ) : (
                            <div className="fs-art-placeholder">
                                {song.title?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="fs-info-group">
                        <div className="fs-text">
                            <h1 className="fs-title">{song.title || 'Unknown Title'}</h1>
                            <p className="fs-artist">{song.artist || 'Unknown Artist'}</p>
                        </div>
                        <button
                            className={`fs-like-btn ${isCurrentLiked ? 'active' : ''}`}
                            onClick={onToggleCurrentLike}
                        >
                            <Heart size={32} fill={isCurrentLiked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="fs-controls-panel">
                        <div className="fs-progress-block">
                            <div className="fs-seekbar-area">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={progressPercent}
                                    onChange={handleSeek}
                                    className="fs-seekbar-input"
                                />
                                <div className="fs-seekbar-rail">
                                    <div
                                        className="fs-seekbar-fill"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="fs-time-labels">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="fs-playback-btns">
                            <button
                                className={`fs-opt-btn ${isShuffled ? 'active' : ''}`}
                                onClick={toggleShuffle}
                            >
                                <Shuffle size={20} />
                            </button>

                            <button className="fs-nav-btn" onClick={playPrevSong}>
                                <SkipBack size={36} fill="currentColor" />
                            </button>

                            <button className="fs-play-btn" onClick={togglePlayPause}>
                                {isPlaying ? (
                                    <Pause size={44} fill="currentColor" />
                                ) : (
                                    <Play size={44} fill="currentColor" />
                                )}
                            </button>

                            <button className="fs-nav-btn" onClick={playNextSong}>
                                <SkipForward size={36} fill="currentColor" />
                            </button>

                            <button
                                className={`fs-opt-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                                onClick={toggleRepeat}
                            >
                                <Repeat size={20} />
                                {repeatMode === 'one' && <span className="fs-repeat-indicator">1</span>}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FullscreenPlayer;

