// src/App.jsx - Refactored Version
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import './views/Entire.css';


// Custom Hooks
// In App.jsx, update these imports:
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { usePlaylist } from "./hooks/usePlaylist";
import { useLibrary } from './hooks/useLibrary';
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUI } from "./hooks/useUI";

// Components
import Header from './components/Header';
import MusicList from './components/MusicList';
import PlayerControls from './components/PlayerControls';
import PlaylistSidebar from './components/PlaylistSidebar';
import PlaylistsView from './components/PlaylistView';
import QueueView from './components/QueueView';
import Home from './components/Home';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingOverlay from './components/LoadingOverlay';

import NotificationToast from './components/NotificationToast';
import FullscreenPlayer from './components/FullscreenPlayer';
import PlaylistPage from './pages/PlaylistPage';
import LikedSongsPage from './pages/LikedSongsPage';

function MainContent({ children }) {
  const { pathname } = useLocation();
  const isFullBleed = ['/library', '/liked', '/queue', '/playlists'].some((p) =>
    pathname.startsWith(p)
  );
  return <div className={`main-content ${isFullBleed ? 'full-bleed' : ''}`}>{children}</div>;
}


function App() {
  // ===== LIBRARY MANAGEMENT =====
  const {
    songs,
    filteredSongs,
    likedSongs,
    likedSongsList,
    isLoading,
    loadFiles,
    searchSongs,
    sortSongs,
    toggleLike,
    isSongLiked,
    incrementPlayCount,
    getLibraryStats,
  } = useLibrary();

  // ===== AUDIO PLAYER =====
  const {
    currentSong,
    currentSongIndex,
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
    playSong,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    skipForward,
    skipBackward,
    toggleMute,
    setVolume,
    increaseVolume,
    decreaseVolume,
    toggleShuffle,
    toggleRepeat,
    changePlaybackRate,
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    moveInQueue,
  } = useAudioPlayer(songs, filteredSongs);

  // ===== PLAYLIST MANAGEMENT =====
  const {
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    createPlaylist,
    addSongToPlaylist,
    addMultipleSongsToPlaylist,
    removeSongFromPlaylist,
    updatePlaylist,
    deletePlaylist,
    duplicatePlaylist,
    reorderPlaylistSongs,
    getPlaylistStats,
    exportPlaylist,
    mergePlaylists,
    dedupePlaylistSongs,
    shufflePlaylistSongs,
    sortPlaylistSongs,
    sortPlaylists,
    importPlaylistFromJSON,
  } = usePlaylist(songs);

  // ===== UI STATE =====
  const {
    showKeyboardHelp,
    openKeyboardHelp,
    closeKeyboardHelp,
    selectedPlaylistForAdd,
    openPlaylistSidebar,
    closePlaylistSidebar,
    focusTarget,
    setFocusOnSong,
    notification,
    showNotification,
    hideNotification,
    viewMode,
    changeViewMode,
    showSongInfo,
    toggleNowPlaying,
  } = useUI();

  // ===== KEYBOARD SHORTCUTS =====
  useKeyboardShortcuts({
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
    seekToStart: () => seekTo(0),
    seekToEnd: () => seekTo(duration),
    showHelp: openKeyboardHelp,
    closeModals: () => {
      closeKeyboardHelp();
    },
    currentSong,
  });

  // ===== ENHANCED PLAY SONG WITH PLAY COUNT =====
  const playSongWithTracking = (song) => {
    playSong(song);
    incrementPlayCount(song.id);
  };

  // ===== SHUFFLE PLAY =====
  const handleShufflePlay = () => {
    const pool = filteredSongs && filteredSongs.length > 0 ? filteredSongs : songs;
    if (!pool || pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    playSongWithTracking(pool[randomIndex]);
  };

  // ===== SORT HANDLER =====
  const handleSort = (sortType) => {
    const [field, direction] = sortType.split('-');
    sortSongs(field, direction);
  };

  // ===== RENDER =====
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          {/* Loading Overlay */}
          {isLoading && <LoadingOverlay />}

          {/* Keyboard Help Modal */}
          {showKeyboardHelp && (
            <KeyboardHelpModal onClose={closeKeyboardHelp} />
          )}

          {/* Mobile Menu Overlay */}

          {/* Header (Global) */}
          <Header
            loadFiles={loadFiles}
            onShufflePlay={handleShufflePlay}
            onSort={handleSort}
            onSearch={searchSongs}
          />

          {/* Main Content */}
          <MainContent>
            <Routes>
              <Route path="/" element={<Home />} />

              <Route
                path="/library"
                element={
                  <>
                    <MusicList
                      songs={filteredSongs}
                      playSong={playSongWithTracking}
                      currentSongId={currentSong?.id}
                      playlists={playlists}
                      addSongToPlaylist={addSongToPlaylist}
                      onOpenPlaylistSidebar={openPlaylistSidebar}
                      isSongLiked={isSongLiked}
                      onToggleLike={toggleLike}
                      onAddToQueue={addToQueue}
                      queue={queue}
                      moveInQueue={moveInQueue}
                      focusTarget={focusTarget}
                      onOpenDetails={toggleNowPlaying}
                    />
                  </>
                }
              />

              <Route
                path="/liked"
                element={
                  <LikedSongsPage
                    likedSongsList={likedSongsList}
                    currentSong={currentSong}
                    playlists={playlists}
                    addSongToPlaylist={addSongToPlaylist}
                    openPlaylistSidebar={openPlaylistSidebar}
                    isSongLiked={isSongLiked}
                    toggleLike={toggleLike}
                    addToQueue={addToQueue}
                    queue={queue}
                    moveInQueue={moveInQueue}
                    toggleNowPlaying={toggleNowPlaying}
                    playSongWithTracking={playSongWithTracking}
                  />
                }
              />

              <Route
                path="/queue"
                element={
                  <QueueView
                    queue={queue}
                    removeFromQueue={removeFromQueue}
                    clearQueue={clearQueue}
                    playSong={playSongWithTracking}
                    currentSongId={currentSong?.id}
                    moveInQueue={moveInQueue}
                  />
                }
              />

              <Route
                path="/playlists"
                element={
                  <PlaylistsView
                    playlists={playlists}
                    createNewPlaylist={createPlaylist}
                    onPlaylistSelect={setSelectedPlaylist}
                    duplicatePlaylist={duplicatePlaylist}
                    updatePlaylist={updatePlaylist}
                    deletePlaylist={deletePlaylist}
                    mergePlaylists={mergePlaylists}
                    dedupePlaylistSongs={dedupePlaylistSongs}
                    shufflePlaylistSongs={shufflePlaylistSongs}
                    sortPlaylistSongs={sortPlaylistSongs}
                    sortPlaylists={sortPlaylists}
                    importPlaylistFromJSON={importPlaylistFromJSON}
                    viewMode={viewMode}
                    changeViewMode={changeViewMode}
                  />
                }
              />
              <Route
                path="/playlists/:playlistId"
                element={
                  <PlaylistPage
                    playlists={playlists}
                    playSongWithTracking={playSongWithTracking}
                    currentSong={currentSong}
                    removeSongFromPlaylist={removeSongFromPlaylist}
                    deletePlaylist={deletePlaylist}
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                    playNextSong={playNextSong}
                    playPrevSong={playPrevSong}
                    isSongLiked={isSongLiked}
                    toggleLike={toggleLike}
                    openPlaylistSidebar={openPlaylistSidebar}
                    getPlaylistStats={getPlaylistStats}
                    isShuffled={isShuffled}
                    toggleShuffle={toggleShuffle}
                    repeatMode={repeatMode}
                    toggleRepeat={toggleRepeat}
                    volume={volume}
                    isMuted={isMuted}
                    toggleMute={toggleMute}
                    setVolume={setVolume}
                    exportPlaylist={exportPlaylist}
                  />
                }
              />
            </Routes>
          </MainContent>

          {/* Player Controls */}
          <PlayerControls
            song={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            togglePlayPause={togglePlayPause}
            playNextSong={playNextSong}
            playPrevSong={playPrevSong}
            seekTo={seekTo}
            isMuted={isMuted}
            toggleMute={toggleMute}
            volume={volume}
            setVolume={setVolume}
            isShuffled={isShuffled}
            toggleShuffle={toggleShuffle}
            repeatMode={repeatMode}
            toggleRepeat={toggleRepeat}
            playbackRate={playbackRate}
            setPlaybackRate={changePlaybackRate}
            locateSong={setFocusOnSong}
            isCurrentLiked={currentSong ? isSongLiked(currentSong.id) : false}
            onToggleCurrentLike={() => currentSong && toggleLike(currentSong)}
            queueLength={queue.length}
            isBuffering={isBuffering}
            onOpenDetails={toggleNowPlaying}
          />

          {/* Fullscreen Player Overlay */}
          {showSongInfo && currentSong && (
            <FullscreenPlayer
              song={currentSong}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              togglePlayPause={togglePlayPause}
              playNextSong={playNextSong}
              playPrevSong={playPrevSong}
              seekTo={seekTo}
              onClose={toggleNowPlaying}
              isShuffled={isShuffled}
              toggleShuffle={toggleShuffle}
              repeatMode={repeatMode}
              toggleRepeat={toggleRepeat}
              isCurrentLiked={isSongLiked(currentSong.id)}
              onToggleCurrentLike={() => toggleLike(currentSong)}
            />
          )}

          {/* Playlist Sidebar */}
          {selectedPlaylistForAdd && (
            <PlaylistSidebar
              song={selectedPlaylistForAdd}
              playlists={playlists}
              addSongToPlaylist={addSongToPlaylist}
              addToQueue={addToQueue}
              onClose={closePlaylistSidebar}
              createNewPlaylist={createPlaylist}
            />
          )}

          {/* Notifications */}
          {notification && (
            <NotificationToast
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              onClose={hideNotification}
            />
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
