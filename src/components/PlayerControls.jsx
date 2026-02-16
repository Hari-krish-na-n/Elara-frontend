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
  X,
  ExternalLink,
  Search,
  Shuffle,
  Repeat,
  Gauge,
  ChevronDown,
  ChevronUp,
  MapPin
} from 'lucide-react';
import './PlayerControl.css';
import FullscreenPlayer from './FullscreenPlayer';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

function PlayerControls({
  song,
  isBuffering,
  onOpenDetails,
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
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const overlayRef = useRef(null);

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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setShowNowPlaying(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div
        className={`player-controls player-controls--compact ${controlsHidden ? 'player-controls--hidden' : ''}`}
        onTouchStart={(e) => {
          try {
            const t = e.touches?.[0];
            if (t) (e.currentTarget)._startY = t.clientY;
          } catch { }
        }}
        onTouchEnd={(e) => {
          try {
            const t = e.changedTouches?.[0];
            const startY = (e.currentTarget)._startY || 0;
            if (t && startY && startY - t.clientY > 30) {
              if (song) setShowNowPlaying(true);
            }
          } catch { }
        }}
      >
        <div className="pc-container">
          <div className="pc-layout">
            {/* LEFT: Song Info & Album Art */}
            <div
              className="pc-section pc-left"
              onClick={() => song && onOpenDetails && onOpenDetails()}
              style={{ cursor: song ? 'pointer' : 'default' }}
            >
              {song ? (
                <div className="pc-song-card">
                  <div className="pc-artwork">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} className="pc-img" />
                    ) : (
                      <div className="pc-placeholder">
                        {(song.title || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="pc-meta">
                    <div className="pc-song-title">{song.title || 'Unknown Title'}</div>
                    <div className="pc-song-artist">{song.artist || 'Unknown Artist'}</div>
                  </div>
                </div>
              ) : (
                <div className="pc-empty-info">No track playing</div>
              )}
            </div>

            {/* CENTER: Focused Playback Controls */}
            <div className="pc-section pc-center">
              <div className="pc-playback-group">
                <button
                  onClick={toggleShuffle}
                  className={`pc-ctrl-btn pc-alt ${isShuffled ? 'active' : ''}`}
                  title="Shuffle"
                >
                  <Shuffle size={16} />
                </button>

                <button
                  onClick={playPrevSong}
                  disabled={!song}
                  className="pc-ctrl-btn"
                  aria-label="Previous"
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>

                <button
                  onClick={togglePlayPause}
                  disabled={!song}
                  className="pc-main-play-btn"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>

                <button
                  onClick={playNextSong}
                  disabled={!song}
                  className="pc-ctrl-btn"
                  aria-label="Next"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`pc-ctrl-btn pc-alt ${repeatMode !== 'off' ? 'active' : ''}`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <Repeat size={16} />
                  {repeatMode === 'one' && <span className="pc-repeat-badge">1</span>}
                </button>
              </div>
            </div>

            {/* RIGHT: Utilities */}
            <div className="pc-section pc-right">
              <div className="pc-utils-group">
                <div className="pc-volume-control">
                  <button onClick={toggleMute} className="pc-ctrl-btn pc-mini">
                    <VolumeIcon size={16} />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : Math.round((volume ?? 1) * 100)}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="pc-volume-slider"
                  />
                </div>

                <button
                  onClick={() => navigate('/queue')}
                  className="pc-ctrl-btn pc-mini"
                  title="Up Next"
                >
                  <ExternalLink size={16} />
                </button>

                <button
                  onClick={() => locateSong && locateSong()}
                  disabled={!song}
                  className="pc-ctrl-btn pc-mini"
                  title="Locate currently playing song"
                >
                  <MapPin size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM: Thin Progress Bar */}
          <div className="pc-progress-footer">
            <span className="pc-timestamp">{formatTime(currentTime)}</span>
            <div className="pc-progress-container">
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={handleSeek}
                className="pc-progress-slider"
                disabled={!song}
                aria-label="Seek track"
              />
              <div
                className="pc-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="pc-timestamp">{formatTime(duration)}</span>
          </div>
        </div>

        {showNowPlaying && song && (
          <FullscreenPlayer
            song={song}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            togglePlayPause={togglePlayPause}
            playNextSong={playNextSong}
            playPrevSong={playPrevSong}
            seekTo={seekTo}
            onClose={() => setShowNowPlaying(false)}
            isShuffled={isShuffled}
            toggleShuffle={toggleShuffle}
            repeatMode={repeatMode}
            toggleRepeat={toggleRepeat}
            isCurrentLiked={isCurrentLiked}
            onToggleCurrentLike={onToggleCurrentLike}
          />
        )}
      </div>

      <button
        className={`player-toggle-btn ${controlsHidden ? 'player-toggle-btn--collapsed' : 'player-toggle-btn--raised'}`}
        onClick={() => setControlsHidden(!controlsHidden)}
        aria-label={controlsHidden ? 'Show player controls' : 'Hide player controls'}
        title={controlsHidden ? 'Show Player' : 'Hide Player'}
      >
        {controlsHidden ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
    </>
  );
}

export default PlayerControls;
