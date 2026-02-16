// src/hooks/useAudioPlayer.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as db from '../db';

export const useAudioPlayer = (songs = [], filteredSongs = []) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [lastPlayedSong, setLastPlayedSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [queue, setQueue] = useState([]);
  const [playbackRate, setPlaybackRate] = useState(1); // New: playback speed
  const [isBuffering, setIsBuffering] = useState(false); // New: buffering state

  const audioRef = useRef(new Audio());
  const previousVolumeRef = useRef(1);
  const activeBlobUrlRef = useRef(null);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedVolume = localStorage.getItem('volume');
      const savedRepeatMode = localStorage.getItem('repeatMode');
      const savedIsShuffled = localStorage.getItem('isShuffled');
      const savedPlaybackRate = localStorage.getItem('playbackRate');

      if (savedVolume) setVolume(parseFloat(savedVolume));
      if (savedRepeatMode) setRepeatMode(savedRepeatMode);
      if (savedIsShuffled) setIsShuffled(savedIsShuffled === 'true');
      if (savedPlaybackRate) setPlaybackRate(parseFloat(savedPlaybackRate));
    } catch (error) {
      console.error('Error loading audio preferences:', error);
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('repeatMode', repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    localStorage.setItem('isShuffled', isShuffled.toString());
  }, [isShuffled]);

  useEffect(() => {
    localStorage.setItem('playbackRate', playbackRate.toString());
  }, [playbackRate]);

  const cleanupBlobUrl = useCallback(() => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
  }, []);

  // Play song
  const playSong = useCallback(async (song) => {
    if (!song) {
      console.error('Invalid song:', song);
      return;
    }

    const needsImport = song.playable === false || song.needsImport === true;

    try {
      const isOffline = !navigator.onLine;
      let playUrl = null;

      if (!song.id) {
        throw new Error('Song missing ID');
      }

      const cachedBlob = await db.getAudio(song.id);

      if (cachedBlob) {
        cleanupBlobUrl();
        playUrl = URL.createObjectURL(cachedBlob);
        activeBlobUrlRef.current = playUrl;
        console.log(`Using cached audio for: "${song.title}"`);
      } else if (song.url && !song.url.startsWith('blob:')) {
        // Only trust non-blob URLs from the metadata
        playUrl = song.url;
        try {
          if (!isOffline && /^https?:/i.test(song.url)) {
            const resp = await fetch(song.url, { mode: 'cors' }).catch(() => null);
            if (resp && resp.ok) {
              const blob = await resp.blob();
              if (blob && blob.size > 0 && blob.size <= 15 * 1024 * 1024) {
                await db.saveAudio(song.id, blob);
                cleanupBlobUrl();
                const url = URL.createObjectURL(blob);
                activeBlobUrlRef.current = url;
                playUrl = url;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to cache remote audio for offline use:', e);
        }
      }

      // Relaxed offline check to allow Service Worker cached responses
      /* 
      if (isOffline && !cachedBlob && (!playUrl || !playUrl.startsWith('data:'))) {
        const notification = new CustomEvent('app-notification', {
          detail: { message: `"${song.title || 'Track'}" is not available offline.`, type: 'error' }
        });
        window.dispatchEvent(notification);
        return;
      } 
      */

      if (!playUrl) {
        if (needsImport && window.showOpenFilePicker) {
          try {
            const pickers = await window.showOpenFilePicker({
              multiple: false,
              types: [
                {
                  description: 'Audio',
                  accept: {
                    'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']
                  }
                }
              ]
            });
            if (pickers && pickers.length > 0) {
              const handle = pickers[0];
              const perm = await handle.requestPermission?.({ mode: 'read' });
              if (perm !== 'denied') {
                const file = await handle.getFile();
                await db.saveFileHandle(song.id, handle);
                cleanupBlobUrl();
                const url = URL.createObjectURL(file);
                activeBlobUrlRef.current = url;
                playUrl = url;
              }
            }
          } catch { }
        }
      }

      if (!playUrl) {
        const notification = new CustomEvent('app-notification', {
          detail: {
            message: `"${song.title || 'Track'}" needs to be re-imported. The local link has expired.`,
            type: 'warning'
          }
        });
        window.dispatchEvent(notification);
        return;
      }

      setCurrentSongId(song.id);
      setLastPlayedSong(song);
      const songIndex = filteredSongs.findIndex(s => s.id === song.id);
      setCurrentSongIndex(songIndex !== -1 ? songIndex : null);

      const audio = audioRef.current;

      if (audio.src !== playUrl) {
        audio.pause();
        audio.src = playUrl;
        audio.load();
      }

      audio.playbackRate = playbackRate;

      try {
        await audio.play();
        setIsPlaying(true);
        console.log(`Now playing: "${song.title}" by ${song.artist}`);
      } catch (playError) {
        console.error('Playback failed:', playError);
        setIsPlaying(false);
        const notification = new CustomEvent('app-notification', {
          detail: { message: `Unable to play "${song.title}". The file might be corrupted or missing.`, type: 'error' }
        });
        window.dispatchEvent(notification);
      }
    } catch (error) {
      console.error('Error in playSong:', error);
      const notification = new CustomEvent('app-notification', {
        detail: { message: `An error occurred while trying to play this song.`, type: 'error' }
      });
      window.dispatchEvent(notification);
    }
  }, [filteredSongs, playbackRate, cleanupBlobUrl]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Play next song
  const playNextSong = useCallback(() => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue(queue.slice(1));
      playSong(nextSong);
      return;
    }

    if (currentSongIndex === null || filteredSongs.length === 0) return;

    let nextIndex;
    if (isShuffled) {
      // Pick a random song that is NOT the current one (if there are multiple songs)
      if (filteredSongs.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * filteredSongs.length);
        } while (nextIndex === currentSongIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = (currentSongIndex + 1) % filteredSongs.length;
    }

    if (repeatMode === 'off' && nextIndex === 0 && !isShuffled) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setCurrentSongIndex(nextIndex);
    playSong(filteredSongs[nextIndex]);
  }, [currentSongIndex, filteredSongs, isShuffled, repeatMode, queue, playSong]);

  // Play previous song
  const playPrevSong = useCallback(() => {
    if (currentSongIndex === null || filteredSongs.length === 0) return;

    // If more than 3 seconds into the song, restart it
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const prevIndex = currentSongIndex === 0
      ? filteredSongs.length - 1
      : currentSongIndex - 1;

    setCurrentSongIndex(prevIndex);
    playSong(filteredSongs[prevIndex]);
  }, [currentSongIndex, filteredSongs, currentTime, playSong]);

  // Seek to specific time
  const seekTo = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Skip forward/backward
  const skipForward = useCallback((seconds = 10) => {
    const newTime = Math.min(duration, currentTime + seconds);
    seekTo(newTime);
  }, [currentTime, duration, seekTo]);

  const skipBackward = useCallback((seconds = 10) => {
    const newTime = Math.max(0, currentTime - seconds);
    seekTo(newTime);
  }, [currentTime, seekTo]);

  // Volume controls
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolumeRef.current);
      setIsMuted(false);
    } else {
      previousVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const increaseVolume = useCallback((amount = 0.1) => {
    setVolume(prev => Math.min(1, prev + amount));
    if (isMuted) setIsMuted(false);
  }, [isMuted]);

  const decreaseVolume = useCallback((amount = 0.1) => {
    setVolume(prev => Math.max(0, prev - amount));
  }, []);

  // Playback controls
  const toggleShuffle = useCallback(() => {
    const newShuffleState = !isShuffled;
    setIsShuffled(newShuffleState);

    // If turning shuffle ON and we have songs, pick a random one to play
    if (newShuffleState && filteredSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredSongs.length);
      // Avoid playing the same index if it's already playing, or just play it anyway for immediate feedback
      // Here we just play the random one to satisfy "play a random song when clicked"
      playSong(filteredSongs[randomIndex]);
    }
  }, [isShuffled, filteredSongs, playSong]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(current => {
      if (current === 'off') return 'all';
      if (current === 'all') return 'one';
      return 'off';
    });
  }, []);

  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
  }, []);

  // Queue management
  const addToQueue = useCallback((song) => {
    setQueue(prev => [...prev, song]);
    console.log(`Added "${song.title}" to queue`);
  }, []);

  const addMultipleToQueue = useCallback((songs) => {
    setQueue(prev => [...prev, ...songs]);
    console.log(`Added ${songs.length} songs to queue`);
  }, []);

  const removeFromQueue = useCallback((songId) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const moveInQueue = useCallback((fromIndex, toIndex) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNextSong();
      }
    };
    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsBuffering(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, playNextSong]);

  // Update volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Keep index in sync with filteredSongs based on currentSongId
  useEffect(() => {
    if (currentSongId == null) return;
    const idx = filteredSongs.findIndex(s => s.id === currentSongId);
    setCurrentSongIndex(idx !== -1 ? idx : null);
  }, [filteredSongs, currentSongId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => cleanupBlobUrl();
  }, [cleanupBlobUrl]);

  // Get current song
  const currentSong = (currentSongId != null
    ? (filteredSongs.find(s => s.id === currentSongId) || lastPlayedSong)
    : null);

  return {
    // State
    currentSong,
    currentSongIndex,
    currentSongId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    queue,
    playbackRate,
    isBuffering,
    audioRef,

    // Playback controls
    playSong,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    skipForward,
    skipBackward,

    // Volume controls
    toggleMute,
    setVolume,
    increaseVolume,
    decreaseVolume,

    // Playback modes
    toggleShuffle,
    toggleRepeat,
    changePlaybackRate,

    // Queue management
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    moveInQueue,
  };
};
