import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MusicLibrary from './components/MusicLibrary';
import Player from './components/Player';
import { musicDB } from './utils/musicDatabase';
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statistics, setStatistics] = useState(null);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize app and load saved data
  useEffect(() => {
    initializeApp();
    
    // Cleanup blob URLs on unmount
    return () => {
      songs.forEach(song => {
        if (song.url && song.url.startsWith('blob:')) {
          URL.revokeObjectURL(song.url);
        }
      });
    };
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      console.log('🎵 Initializing Elara Music Player...');
      
      // Initialize database
      await musicDB.init();
      console.log('✓ Database initialized');
      
      // Load saved songs
      const savedSongs = await musicDB.getAllSongs();
      console.log(`✓ Loaded ${savedSongs.length} songs from storage`);
      
      // Mark songs that need reimport
      const processedSongs = savedSongs.map(song => ({
        ...song,
        needsReimport: !song.url || song.url.startsWith('blob:') === false
      }));
      
      setSongs(processedSongs);
      
      // Load playlists
      const savedPlaylists = await musicDB.getAllPlaylists();
      setPlaylists(savedPlaylists);
      console.log(`✓ Loaded ${savedPlaylists.length} playlists`);
      
      // Load statistics
      const stats = await musicDB.getStatistics();
      setStatistics(stats);
      
      // Load last session state
      const lastPlayingSongId = await musicDB.getSetting('lastPlayingSongId');
      if (lastPlayingSongId) {
        const lastSong = savedSongs.find(s => s.id === lastPlayingSongId);
        if (lastSong) {
          setCurrentSong(lastSong);
        }
      }
      
      if (savedSongs.length === 0) {
        console.log('👋 Welcome to Elara! Add your music to get started.');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setLoadingProgress(0);
    
    try {
      const newSongs = [];
      const totalFiles = files.length;
      
      console.log(`📂 Processing ${totalFiles} files...`);
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('audio/')) {
          console.warn(`⚠ Skipping non-audio file: ${file.name}`);
          continue;
        }
        
        // Create blob URL
        const url = URL.createObjectURL(file);
        
        // Extract metadata from filename
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const parts = fileName.split(' - ');
        
        // Create audio element to get duration
        const audio = new Audio(url);
        await new Promise((resolve) => {
          audio.onloadedmetadata = resolve;
          audio.onerror = resolve;
        });
        
        const songData = {
          title: parts.length > 1 ? parts[1] : fileName,
          artist: parts.length > 1 ? parts[0] : 'Unknown Artist',
          album: 'Unknown Album',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          url: url,
          duration: audio.duration || 0,
          addedDate: new Date().toISOString(),
          playCount: 0,
          liked: false,
          needsReimport: false,
          lastAccessed: new Date().toISOString()
        };
        
        newSongs.push(songData);
        setLoadingProgress(Math.round(((i + 1) / totalFiles) * 100));
        
        // Cleanup audio element
        audio.src = '';
      }
      
      console.log(`✓ Processed ${newSongs.length} audio files`);
      
      // Save to IndexedDB
      await musicDB.saveSongs(newSongs);
      console.log('✓ Songs saved to database');
      
      // Update state
      setSongs(prev => {
        const existingIds = new Set(prev.map(s => s.fileName));
        const uniqueNewSongs = newSongs.filter(s => !existingIds.has(s.fileName));
        return [...uniqueNewSongs, ...prev];
      });
      
      // Update statistics
      const stats = await musicDB.getStatistics();
      setStatistics(stats);
      
      // alert(`Added ${newSongs.length} songs to your library!`);
      
    } catch (error) {
      console.error('❌ Failed to load files:', error);
      // alert('Failed to add songs. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handlePlaySong = async (song) => {
    if (song.needsReimport) {
      // alert('This song needs to be re-imported. Please add your music folder again.');
      return;
    }
    
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Save playback state
    await musicDB.saveSetting('lastPlayingSongId', song.id);
    
    // Update play count and last played
    if (song.id) {
      try {
        const updatedSong = await musicDB.updateSong(song.id, {
          playCount: (song.playCount || 0) + 1,
          lastPlayed: new Date().toISOString()
        });
        
        // Update local state
        setSongs(prev => prev.map(s => 
          s.id === song.id ? updatedSong : s
        ));
        
        // Update statistics
        const stats = await musicDB.getStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to update play count:', error);
      }
    }
  };

  const handleToggleLike = async (songId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    
    try {
      const updatedSong = await musicDB.updateSong(songId, {
        liked: !song.liked
      });
      
      setSongs(prev => prev.map(s => 
        s.id === songId ? updatedSong : s
      ));
      
      // Update statistics
      const stats = await musicDB.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Remove this song from your library?')) return;
    
    try {
      await musicDB.deleteSong(songId);
      
      // Revoke blob URL
      const song = songs.find(s => s.id === songId);
      if (song?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(song.url);
      }
      
      setSongs(prev => prev.filter(s => s.id !== songId));
      
      if (currentSong?.id === songId) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
      
      // Update statistics
      const stats = await musicDB.getStatistics();
      setStatistics(stats);
      
    } catch (error) {
      console.error('Failed to delete song:', error);
      // alert('Failed to delete song. Please try again.');
    }
  };

  const handleClearLibrary = async () => {
    if (!window.confirm('⚠️ Delete ALL songs from your library?')) return;
    
    try {
      await musicDB.clearAllSongs();
      
      // Revoke all blob URLs
      songs.forEach(song => {
        if (song.url?.startsWith('blob:')) {
          URL.revokeObjectURL(song.url);
        }
      });
      
      setSongs([]);
      setCurrentSong(null);
      setIsPlaying(false);
      setQueue([]);
      setStatistics(null);
      
      // alert('Library cleared successfully.');
    } catch (error) {
      console.error('Failed to clear library:', error);
      // alert('Failed to clear library. Please try again.');
    }
  };

  const handleCreatePlaylist = async (name, songIds = []) => {
    try {
      const playlist = {
        name,
        songIds,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      await musicDB.savePlaylist(playlist);
      
      // Reload playlists
      const savedPlaylists = await musicDB.getAllPlaylists();
      setPlaylists(savedPlaylists);
      
      // alert(`Playlist "${name}" created!`);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      // alert('Failed to create playlist.');
    }
  };

  const handleShufflePlay = () => {
    const availableSongs = songs.filter(s => !s.needsReimport);
    if (availableSongs.length === 0) {
      alert('Please add some music first!');
      return;
    }
    
    const shuffled = [...availableSongs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    handlePlaySong(shuffled[0]);
  };

  // File System Access API Integration (Optional)
  const handleOpenFolder = async () => {
    if (!window.showDirectoryPicker) {
      alert('File System Access API not supported in your browser. Using standard file picker.');
      fileInputRef.current?.click();
      return;
    }
    
    try {
      const directoryHandle = await window.showDirectoryPicker();
      const files = [];
      
      // Recursively get all audio files
      const getFiles = async (dirHandle) => {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && entry.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)) {
            const file = await entry.getFile();
            files.push(file);
          } else if (entry.kind === 'directory') {
            await getFiles(entry);
          }
        }
      };
      
      await getFiles(directoryHandle);
      
      if (files.length > 0) {
        await handleLoadFiles(files);
      } else {
        // alert('No audio files found in the selected folder.');
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      if (error.name !== 'AbortError') {
        // alert('Failed to access folder. Please try the standard file picker.');
      }
    }
  };

  if (isLoading && loadingProgress > 0) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>🎵 Loading Music...</h1>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p>{loadingProgress}% Complete</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Sidebar 
          playlists={playlists}
          statistics={statistics}
          onSearch={async (query) => {
            const results = await musicDB.searchSongs(query);
            return results;
          }}
          onCreatePlaylist={handleCreatePlaylist}
          isOpen={sidebarOpen}
        />
        
        <div className="main-content">
          <Header
            loadFiles={handleLoadFiles}
            onOpenFolder={handleOpenFolder}
            onShufflePlay={handleShufflePlay}
            onClearLibrary={handleClearLibrary}
            songCount={songs.length}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <div className="content-area">
            <Routes>
              <Route path="/" element={
                <div className="home-page">
                  <h1>Welcome to Elara Music Player</h1>
                  <p>Your personal music library with {songs.length} songs</p>
                  
                  {songs.length === 0 ? (
                    <div className="empty-state">
                      <p>No music yet. Add some songs to get started!</p>
                      <div className="import-options">
                        <button onClick={handleOpenFolder} className="import-btn">
                          Open Music Folder
                        </button>
                        <label htmlFor="file-upload" className="import-btn">
                          Select Files
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="audio/*"
                            onChange={(e) => handleLoadFiles(Array.from(e.target.files))}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      {songs.some(s => s.needsReimport) && (
                        <div className="warning-banner">
                          ⚠️ Some songs need to be re-imported. 
                          Please add your music folder again.
                        </div>
                      )}
                      
                      <div className="stats">
                        <div className="stat-card">
                          <h3>{songs.length}</h3>
                          <p>Total Songs</p>
                        </div>
                        <div className="stat-card">
                          <h3>{songs.filter(s => s.liked).length}</h3>
                          <p>Liked Songs</p>
                        </div>
                        <div className="stat-card">
                          <h3>{statistics?.totalPlayCount || 0}</h3>
                          <p>Total Plays</p>
                        </div>
                        <div className="stat-card">
                          <h3>{playlists.length}</h3>
                          <p>Playlists</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              } />
              
              <Route path="/library" element={
                <MusicLibrary
                  songs={songs}
                  currentSong={currentSong}
                  onPlaySong={handlePlaySong}
                  onToggleLike={handleToggleLike}
                  onDeleteSong={handleDeleteSong}
                  onCreatePlaylist={handleCreatePlaylist}
                />
              } />
            </Routes>
          </div>
          
          {currentSong && (
            <Player
              song={currentSong}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              audioRef={audioRef}
              queue={queue}
              onNext={() => {
                if (queue.length > 0) {
                  const currentIndex = queue.findIndex(s => s.id === currentSong.id);
                  const nextSong = queue[(currentIndex + 1) % queue.length];
                  if (nextSong) handlePlaySong(nextSong);
                }
              }}
              onPrevious={() => {
                if (queue.length > 0) {
                  const currentIndex = queue.findIndex(s => s.id === currentSong.id);
                  const prevSong = queue[(currentIndex - 1 + queue.length) % queue.length];
                  if (prevSong) handlePlaySong(prevSong);
                }
              }}
            />
          )}
        </div>
        
        <audio 
          ref={audioRef} 
          src={currentSong?.url}
          onEnded={() => {
            if (queue.length > 0) {
              const currentIndex = queue.findIndex(s => s.id === currentSong.id);
              const nextSong = queue[(currentIndex + 1) % queue.length];
              if (nextSong) handlePlaySong(nextSong);
            }
          }}
        />
      </div>
    </Router>
  );
}

export default App;