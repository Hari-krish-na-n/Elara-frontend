// src/components/PlayerControls.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

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
}) {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const navigate = useNavigate();

    const handleSeek = (e) => {
        const time = (e.target.value / 100) * duration;
        seekTo(time);
    };
    
    // Choose emoji based on mute state
    const volumeIcon = isMuted ? '🔇' : '🔊';

    return (
        <div className="player-controls">
            {/* Song Info Section */}
            {song ? (
                <div className="current-song-info">
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
                <button onClick={playPrevSong} disabled={!song}>⏮️</button>
                <button onClick={togglePlayPause} disabled={!song}>
                    {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button onClick={playNextSong} disabled={!song}>⏭️</button>
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
                <button onClick={toggleMute} className="mute-btn">
                    {volumeIcon}
                </button>
                <button
                    onClick={() => { if (!song) return; navigate('/library'); if (locateSong) locateSong(song.id); }}
                    className="locate-btn"
                    disabled={!song}
                    title="Locate current song"
                >
                    📍
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
    );
}

export default PlayerControls;