// src/components/PlayerControls.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, MapPin } from 'lucide-react';
import './PlayerControl.css';
const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
};

function PlayerControls({ 
    song, 
    isPlaying, 
    currentTime, 
    duration, 
    togglePlayPause, 
    playNextSong, 
    playPrevSong, 
    seekTo,
    isMuted, 
    toggleMute,
    volume,
    setVolume,
    isShuffled,
    toggleShuffle,
    locateSong,
    isCurrentLiked,
    onToggleCurrentLike,
}) {
    const [showNowPlaying, setShowNowPlaying] = useState(false);
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const navigate = useNavigate();

    const handleSeek = (e) => {
        const time = (e.target.value / 100) * duration;
        seekTo(time);
    };
    
    // Icon components based on state
    const VolumeIcon = isMuted ? VolumeX : Volume2;

    return (
        <>
        <div className="player-controls">
            {/* Song Info Section */}
            {song ? (
                <div className="current-song-info" onClick={() => setShowNowPlaying(true)} style={{ cursor: 'pointer' }}>
                    <div className="song-cover">
                        {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="song-cover-img" />
                        ) : (
                            <div className="cover-placeholder">{(song.title || '?').charAt(0).toUpperCase()}</div>
                        )}
                    </div>
                    <div className="song-text">
<div className={`title ${(song?.title || '').trim().split(/[\s,_\-]+/).length > 4 ? 'two-line' : ''}`}>{song.title}</div>
                        <div className="artist">{song.artist}</div>
                    </div>
                </div>
            ) : (
                <div className="current-song-info">
                    <div className="song-text">No song playing</div>
                </div>
            )}

            {/* Main Playback Controls */}
            <div className="main-controls">
                <button onClick={playPrevSong} disabled={!song} className="icon-btn" aria-label="Previous">
                    <SkipBack size={20} />
                </button>
                <button onClick={togglePlayPause} disabled={!song} className="icon-btn icon-btn--primary" aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button onClick={playNextSong} disabled={!song} className="icon-btn" aria-label="Next">
                    <SkipForward size={20} />
                </button>
            </div>

            {/* Playback Bar */}
            <div className="playback-bar">
                <span className="time-current">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercent}
                    onChange={handleSeek}
                    className="progress-slider"
                    disabled={!song}
                />
                <span className="time-duration">{formatTime(duration)}</span>
            </div>
            
            {/* ⭐ VOLUME/MUTE CONTROL SECTION ⭐ */}
            <div className="volume-controls">
                <button onClick={toggleMute} className="mute-btn icon-btn" title="Mute / Unmute" aria-label="Mute / Unmute">
                    <VolumeIcon size={18} />
                </button>
                <button
                    onClick={() => { if (song && onToggleCurrentLike) onToggleCurrentLike(song); }}
                    className={`like-btn-mini icon-btn ${isCurrentLiked ? 'active' : ''}`}
                    disabled={!song}
                    title={isCurrentLiked ? 'Unlike' : 'Like'}
                    aria-label={isCurrentLiked ? 'Unlike' : 'Like'}
                >
                    <Heart size={16} color={isCurrentLiked ? '#ef4444' : 'currentColor'} fill={isCurrentLiked ? '#ef4444' : 'none'} />
                </button>
                <button
                    onClick={() => { if (!song) return; navigate('/library'); if (locateSong) locateSong(song.id); }}
                    className="locate-btn icon-btn"
                    disabled={!song}
                    title="Locate current song"
                    aria-label="Locate current song"
                >
                    <MapPin size={16} />
                </button>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : Math.round((volume ?? 1) * 100)}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="volume-slider"
                    disabled={!song}
                    aria-label="Volume"
                />
                <span className="vol-level">{isMuted ? 0 : Math.round((volume ?? 1) * 100)}%</span>
            </div>
        </div>
        
        {/* Now Playing Modal */}
        {showNowPlaying && song && (
            <div className="now-playing-modal" onClick={() => setShowNowPlaying(false)}>
                <div className="now-playing-content" onClick={(e) => e.stopPropagation()}>
                    <button className="close-now-playing" onClick={() => setShowNowPlaying(false)}>✕</button>
                    <div className="now-playing-cover">
                        {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} />
                        ) : (
                            <div className="now-playing-placeholder">{(song.title || '?').charAt(0).toUpperCase()}</div>
                        )}
                        {isPlaying && (
                            <div className="equalizer-bars">
                                <span className="bar bar-1"></span>
                                <span className="bar bar-2"></span>
                                <span className="bar bar-3"></span>
                                <span className="bar bar-4"></span>
                            </div>
                        )}
                    </div>
                    <div className="ambient-glow" style={{ backgroundImage: song.coverUrl ? `url(${song.coverUrl})` : 'none' }}></div>
                    <div className="now-playing-info">
                        <h2 className="now-playing-title">{song.title}</h2>
                        <p className="now-playing-artist">{song.artist}</p>
                        {song.album && <p className="now-playing-album">{song.album}</p>}
                        <div className="now-playing-stats">
                            <span className="stat-item">
                                <span className="stat-icon">🎵</span>
                                <span className="stat-value">{song.plays || 0} plays</span>
                            </span>
                            {song.duration && (
                                <span className="stat-item">
                                    <span className="stat-icon">⏱️</span>
                                    <span className="stat-value">{formatTime(song.duration)}</span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="now-playing-progress">
                        <span className="time-current">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progressPercent}
                            onChange={handleSeek}
                            className="progress-slider"
                        />
                        <span className="time-duration">{formatTime(duration)}</span>
                    </div>
                    <div className="now-playing-controls">
                        <button onClick={playPrevSong} className="now-playing-btn" aria-label="Previous">
                            <SkipBack size={22} />
                        </button>
                        <button onClick={togglePlayPause} className="now-playing-btn play-btn-large" aria-label={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                        </button>
                        <button onClick={playNextSong} className="now-playing-btn" aria-label="Next">
                            <SkipForward size={22} />
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default PlayerControls;