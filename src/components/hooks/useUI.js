// src/hooks/useUI.js
import { useState, useCallback } from 'react';

export const useUI = () => {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVisualizerModal, setShowVisualizerModal] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [notification, setNotification] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'compact'

  // Modal controls
  const openKeyboardHelp = useCallback(() => setShowKeyboardHelp(true), []);
  const closeKeyboardHelp = useCallback(() => setShowKeyboardHelp(false), []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const openVisualizerModal = useCallback(() => setShowVisualizerModal(true), []);
  const closeVisualizerModal = useCallback(() => setShowVisualizerModal(false), []);

  const toggleEqualizer = useCallback(() => setShowEqualizer(prev => !prev), []);
  const toggleLyrics = useCallback(() => setShowLyrics(prev => !prev), []);
  const toggleSongInfo = useCallback(() => setShowSongInfo(prev => !prev), []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setShowKeyboardHelp(false);
    setShowSettings(false);
    setShowVisualizerModal(false);
    setShowEqualizer(false);
    setShowLyrics(false);
    setShowSongInfo(false);
    setSelectedPlaylistForAdd(null);
  }, []);

  // Playlist sidebar
  const openPlaylistSidebar = useCallback((song) => {
    setSelectedPlaylistForAdd(song);
  }, []);

  const closePlaylistSidebar = useCallback(() => {
    setSelectedPlaylistForAdd(null);
  }, []);

  // Focus target (for scrolling to song)
  const setFocusOnSong = useCallback((songId) => {
    setFocusTarget({ id: songId, timestamp: Date.now() });
  }, []);

  const clearFocusTarget = useCallback(() => {
    setFocusTarget(null);
  }, []);

  // Notifications
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    // Notifications removed
    console.log('Notification:', message);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  // View mode
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  }, []);

  // Overlay click handler
  const handleOverlayClick = useCallback((e) => {
    if (e.target.classList.contains('overlay') || 
        e.target.classList.contains('sidebar-overlay') ||
        e.target.classList.contains('modal-overlay')) {
      closeAllModals();
    }
  }, [closeAllModals]);

  return {
    // Modals
    showKeyboardHelp,
    openKeyboardHelp,
    closeKeyboardHelp,

    showSettings,
    openSettings,
    closeSettings,

    showVisualizerModal,
    openVisualizerModal,
    closeVisualizerModal,

    showEqualizer,
    toggleEqualizer,

    showLyrics,
    toggleLyrics,

    showSongInfo,
    toggleSongInfo,

    closeAllModals,

    // Playlist sidebar
    selectedPlaylistForAdd,
    openPlaylistSidebar,
    closePlaylistSidebar,

    // Focus
    focusTarget,
    setFocusOnSong,
    clearFocusTarget,

    // Notifications
    notification,
    showNotification,
    hideNotification,

    // Theme
    theme,
    toggleTheme,

    // View mode
    viewMode,
    changeViewMode,

    // Overlay handler
    handleOverlayClick,
  };
};