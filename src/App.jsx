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
import PlaylistDetail from './components/PlaylistDetail';
import QueueView from './components/QueueView';
import Home from './components/Home';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingOverlay from './components/LoadingOverlay';
import KeyboardHelpModal from './components/KeyboardHelpModal';
import NotificationToast from './components/NotificationToast';
import FullscreenPlayer from './components/FullscreenPlayer';

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
    if (filteredSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    playSongWithTracking(filteredSongs[randomIndex]);
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
                      onPlaylistSelect={setSelectedPlaylist}
                      onOpenDetails={toggleNowPlaying}
                    />
                  </>
                }
              />

              <Route
                path="/liked"
                element={
                  <>
                    <MusicList
                      songs={likedSongsList}
                      isLikedView={true}
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
                      onOpenDetails={toggleNowPlaying}
                    />
                  </>
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
                  selectedPlaylist ? (
                    <PlaylistDetail
                      playlist={selectedPlaylist}
                      onBack={() => setSelectedPlaylist(null)}
                      playSong={playSongWithTracking}
                      currentSongId={currentSong?.id}
                      removeSongFromPlaylist={removeSongFromPlaylist}
                      deletePlaylist={deletePlaylist}
                      isPlaying={isPlaying}
                      togglePlayPause={togglePlayPause}
                      playNextSong={playNextSong}
                      playPrevSong={playPrevSong}
                      isSongLiked={isSongLiked}
                      onToggleLike={toggleLike}
                      addToQueue={addToQueue}
                      onOpenPlaylistSidebar={openPlaylistSidebar}
                      getPlaylistStats={getPlaylistStats}
                      isShuffled={isShuffled}
                      toggleShuffle={toggleShuffle}
                      repeatMode={repeatMode}
                      toggleRepeat={toggleRepeat}
                      volume={volume}
                      isMuted={isMuted}
                      toggleMute={toggleMute}
                      setVolume={setVolume}
                      onDownload={(p) => {
                        const json = exportPlaylist?.(p.id);
                        if (!json) return;
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${p.name || 'playlist'}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    />
                  ) : (
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
                  )
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
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
