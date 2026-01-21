// src/components/PlayerControls.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  Search,
  Shuffle,
  Repeat,
  Gauge
} from 'lucide-react';
import './PlayerControl.css';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  isShuffled,        // kept for logic if you still use keyboard shortcuts
  toggleShuffle,
  repeatMode,
  toggleRepeat,
  locateSong,
  isCurrentLiked,
  onToggleCurrentLike,
  onAddToQueue,
  queueLength,
  playbackRate,
  setPlaybackRate,
  onShareSong,
  onDownloadSong,
  onEditSongInfo,
}) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const navigate = useNavigate();
  const volumeRef = useRef(null);

  const VolumeIcon = isMuted ? VolumeX : Volume2;

  const handleSeek = (e) => {
    const pct = Number(e.target.value);
    const time = (pct / 100) * duration;
    seekTo(time);
  };

  // optional: keep volume menu click‑outside in case you later add popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        // nothing for now
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="player-controls player-controls--compact">
      {/* LEFT: Song info */}
      <div className="pc-left">
        {song ? (
          <>
            <div className="pc-cover">
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="pc-cover-img"
                />
              ) : (
                <div className="pc-cover-placeholder">
                  {(song.title || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="pc-meta">
              <div className="pc-title">{song.title || 'Unknown title'}</div>
              <div className="pc-artist">
                {song.artist || 'Unknown artist'}
              </div>
            </div>
          </>
        ) : (
          <div className="pc-meta">
            <div className="pc-title">No song playing</div>
          </div>
        )}
      </div>

      {/* CENTER: Controls + progress */}
      <div className="pc-center">
        <div className="pc-controls-row">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`pc-icon-btn pc-secondary-btn ${isShuffled ? 'active' : ''}`}
            aria-label="Shuffle"
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button
            onClick={playPrevSong}
            disabled={!song}
            className="pc-icon-btn"
            aria-label="Previous"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={!song}
            className="pc-icon-btn pc-icon-btn--primary pc-play-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <button
            onClick={playNextSong}
            disabled={!song}
            className="pc-icon-btn"
            aria-label="Next"
          >
            <SkipForward size={18} />
          </button>

          {/* Repeat Button */}
          <button
            onClick={toggleRepeat}
            className={`pc-icon-btn pc-secondary-btn ${repeatMode !== 'off' ? 'active' : ''}`}
            aria-label="Repeat"
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={18} />
            {repeatMode === 'one' && <span className="repeat-one-badge">1</span>}
          </button>
        </div>

        <div className="pc-progress-row">
          <span className="pc-time pc-time-current">
            {formatTime(currentTime)}
          </span>
          <div className="pc-progress">
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={handleSeek}
              className="pc-progress-slider"
              disabled={!song}
              aria-label="Seek"
            />
            <div
              className="pc-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="pc-time pc-time-total">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT: Volume + extra icons */}
      <div className="pc-right">
        <div className="pc-volume" ref={volumeRef}>
          {/* Playback Speed Toggle */}
          <button
            onClick={() => {
                const rates = [1.0, 1.25, 1.5, 2.0, 0.5];
                const currentIndex = rates.indexOf(playbackRate || 1.0);
                const nextRate = rates[(currentIndex + 1) % rates.length];
                setPlaybackRate && setPlaybackRate(nextRate);
            }}
            className="pc-icon-btn pc-speed-btn"
            title={`Speed: ${playbackRate || 1}x`}
          >
            <span className="speed-text">{playbackRate || 1}x</span>
          </button>

          <button
            onClick={toggleMute}
            className="pc-icon-btn"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon size={16} />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : Math.round((volume ?? 1) * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="pc-volume-slider"
            aria-label="Volume"
          />
        </div>

        {/* Locate current song in list */}
        <button
          onClick={() => {
            if (song?.id) {
              try {
                navigate('/library');
              } catch {}
              locateSong && locateSong(song.id);
            }
          }}
          className="pc-icon-btn"
          title="Locate song in list"
          aria-label="Locate song"
          disabled={!song}
        >
          <Search size={16} />
        </button>

        <button
          onClick={() => navigate('/queue')}
          className="pc-icon-btn"
          title="Queue"
          aria-label="Queue"
        >
          <ExternalLink size={16} />
        </button>

        <button
          onClick={() => {
            // if you keep a full-screen / now‑playing view, open it here
          }}
          className="pc-icon-btn"
          title="Full screen"
          aria-label="Full screen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default PlayerControls;
