// src/hooks/useKeyboardShortcuts.js
import { useEffect, useCallback } from 'react';

export const useKeyboardShortcuts = ({
  togglePlayPause,
  playNextSong,
  playPrevSong,
  increaseVolume,
  decreaseVolume,
  toggleMute,
  toggleShuffle,
  toggleRepeat,
  toggleLike,
  skipForward,
  skipBackward,
  seekToStart,
  seekToEnd,
  openSearch,
  openQueue,
  showHelp,
  closeModals,
  currentSong,
  isEnabled = true
}) => {
  
  const handleKeyPress = useCallback((e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Prevent default for specific keys
    const shouldPreventDefault = [
      ' ', 'k', 'K',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'j', 'J', 'l', 'L',
      '0', 'Home', 'End'
    ].includes(e.key);

    if (shouldPreventDefault) {
      e.preventDefault();
    }

    // Help modal
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      showHelp?.();
      return;
    }

    // Close modals
    if (e.key === 'Escape') {
      closeModals?.();
      return;
    }

    // Playback controls
    switch(e.key) {
      // Play/Pause
      case ' ':
      case 'k':
      case 'K':
        togglePlayPause?.();
        break;

      // Next song
      case 'ArrowRight':
      case 'n':
      case 'N':
        if (e.shiftKey) {
          skipForward?.(30); // Skip 30 seconds
        } else {
          playNextSong?.();
        }
        break;

      // Previous song
      case 'ArrowLeft':
      case 'p':
      case 'P':
        if (e.shiftKey) {
          skipBackward?.(30); // Skip back 30 seconds
        } else {
          playPrevSong?.();
        }
        break;

      // Volume up
      case 'ArrowUp':
        increaseVolume?.();
        break;

      // Volume down
      case 'ArrowDown':
        decreaseVolume?.();
        break;

      // Skip forward 10s
      case 'j':
      case 'J':
        skipForward?.(10);
        break;

      // Skip backward 10s
      case 'l':
      case 'L':
        skipBackward?.(10);
        break;

      // Mute/Unmute
      case 'm':
      case 'M':
        toggleMute?.();
        break;

      // Shuffle
      case 's':
      case 'S':
        toggleShuffle?.();
        break;

      // Repeat
      case 'r':
      case 'R':
        toggleRepeat?.();
        break;

      // Like current song
      case 'h':
      case 'H':
        if (currentSong) {
          toggleLike?.(currentSong);
        }
        break;

      // Seek to start
      case '0':
      case 'Home':
        seekToStart?.();
        break;

      // Seek to end
      case 'End':
        seekToEnd?.();
        break;

      // Open search
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          openSearch?.();
        }
        break;

      // Open queue
      case 'q':
      case 'Q':
        openQueue?.();
        break;

      default:
        break;
    }
  }, [
    togglePlayPause,
    playNextSong,
    playPrevSong,
    increaseVolume,
    decreaseVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    skipForward,
    skipBackward,
    seekToStart,
    seekToEnd,
    openSearch,
    openQueue,
    showHelp,
    closeModals,
    currentSong
  ]);

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, isEnabled]);

  return null;
};

/**
 * Keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS = {
  playback: [
    { key: 'Space / K', action: 'Play / Pause' },
    { key: '→ / N', action: 'Next Song' },
    { key: '← / P', action: 'Previous Song' },
    { key: 'J', action: 'Skip Forward 10s' },
    { key: 'L', action: 'Skip Backward 10s' },
    { key: 'Shift + →', action: 'Skip Forward 30s' },
    { key: 'Shift + ←', action: 'Skip Backward 30s' },
    { key: '0 / Home', action: 'Seek to Start' },
    { key: 'End', action: 'Seek to End' },
  ],
  volume: [
    { key: '↑', action: 'Volume Up' },
    { key: '↓', action: 'Volume Down' },
    { key: 'M', action: 'Mute / Unmute' },
  ],
  controls: [
    { key: 'S', action: 'Toggle Shuffle' },
    { key: 'R', action: 'Toggle Repeat' },
    { key: 'H', action: 'Like Current Song' },
    { key: 'Q', action: 'Open Queue' },
  ],
  navigation: [
    { key: 'Ctrl/Cmd + F', action: 'Search' },
    { key: '?', action: 'Show Help' },
    { key: 'Esc', action: 'Close Dialogs' },
  ]
};