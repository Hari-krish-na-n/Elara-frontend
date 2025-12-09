// src/App.jsx - COMPLETE WORKING VERSION WITH COVER ART SUPPORT
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './App1.css';

import'./components/Entire.css'; 
// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MusicList from './components/MusicList';
import PlayerControls from './components/PlayerControls';
import PlaylistSidebar from './components/PlaylistSidebar';
import PlaylistsView from './components/PlaylistView';
import PlaylistDetail from './components/PlaylistDetail';
import QueueView from './components/QueueView';
import Home from './components/Home';
import ErrorBoundary from './components/ErrorBoundary';

// Helper functions
const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[<>:"|?*]/g, '').replace(/\.\w+$/, '');
};

// Helper function for MP3 metadata extraction with cover art support
const extractMP3Metadata = (file) => {
  return new Promise((resolve) => {
    // Dynamically import jsmediatags to avoid build issues
    import('jsmediatags').then(({ default: jsmediatags }) => {
      jsmediatags.read(file, {
        onSuccess: function(tag) {
          const tags = tag.tags;
          
          // Extract cover art if available
          let pictureUrl = null;
          if (tags.picture) {
            try {
              // Create base64 string from picture data
              const base64String = btoa(
                tags.picture.data.reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              
              // Determine MIME type
              let mimeType = 'image/jpeg'; // default
              if (tags.picture.format) {
                if (tags.picture.format.startsWith('image/')) {
                  mimeType = tags.picture.format;
                } else if (tags.picture.format === 'PNG') {
                  mimeType = 'image/png';
                } else if (tags.picture.format === 'GIF') {
                  mimeType = 'image/gif';
                } else if (tags.picture.format === 'BMP') {
                  mimeType = 'image/bmp';
                }
              }
              
              pictureUrl = `data:${mimeType};base64,${base64String}`;
              console.log('Successfully extracted cover art:', mimeType, base64String.length, 'bytes');
            } catch (error) {
              console.error('Error processing album art:', error);
            }
          }
          
          const metadata = {
            title: tags.title,
            artist: tags.artist,
            album: tags.album,
            year: tags.year,
            genre: tags.genre,
            track: tags.track,
            composer: tags.composer,
            picture: pictureUrl
          };
          
          console.log('Extracted metadata:', { 
            title: metadata.title, 
            artist: metadata.artist,
            album: metadata.album,
            hasCoverArt: !!pictureUrl 
          });
          resolve(metadata);
        },
        onError: function(error) {
          console.error('Error reading ID3 tags:', error);
          resolve(null);
        }
      });
    }).catch(error => {
      console.error('Failed to load jsmediatags:', error);
      resolve(null);
    });
  });
};

// Helper function to extract metadata from non-MP3 files (basic implementation)
const extractBasicMetadata = (file) => {
  return new Promise((resolve) => {
    // For non-MP3 files, we can try to extract basic info
    // This is a placeholder for future expansion
    resolve({
      title: null,
      artist: null,
      album: null,
      picture: null
    });
  });
};

function App() {
  // ===== STATE =====
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const [focusTarget, setFocusTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [metadataCache, setMetadataCache] = useState(new Map());

  const audioRef = useRef(new Audio());

  // ===== LOAD SAVED DATA =====
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem('playlists');
      const savedLiked = localStorage.getItem('likedSongs');
      const savedVolume = localStorage.getItem('volume');
      const savedRepeatMode = localStorage.getItem('repeatMode');
      const savedIsShuffled = localStorage.getItem('isShuffled');
      const savedSongs = localStorage.getItem('songsWithMetadata');

      if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));
      if (savedLiked) setLikedSongs(new Set(JSON.parse(savedLiked)));
      if (savedVolume) setVolume(parseFloat(savedVolume));
      if (savedRepeatMode) setRepeatMode(savedRepeatMode);
      if (savedIsShuffled) setIsShuffled(savedIsShuffled === 'true');
      
      // Load previously saved songs with metadata
      if (savedSongs) {
        const parsedSongs = JSON.parse(savedSongs);
        setSongs(parsedSongs);
        setFilteredSongs(parsedSongs);
        console.log(`Loaded ${parsedSongs.length} songs from storage`);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // ===== SAVE DATA =====
  useEffect(() => {
    try {
      localStorage.setItem('playlists', JSON.stringify(playlists));
      // Save songs with their metadata
      localStorage.setItem('songsWithMetadata', JSON.stringify(songs));
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }, [playlists, songs]);

  useEffect(() => {
    try {
      localStorage.setItem('likedSongs', JSON.stringify([...likedSongs]));
    } catch (e) {
      console.error('Error saving liked songs:', e);
    }
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem('volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('repeatMode', repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    localStorage.setItem('isShuffled', isShuffled.toString());
  }, [isShuffled]);

  // ===== LOAD FILES WITH METADATA EXTRACTION =====
  const loadFiles = useCallback(async (files) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
      alert('No valid audio files selected!');
      return;
    }

    setIsLoading(true);
    console.log(`Loading ${audioFiles.length} files with metadata extraction...`);

    try {
      const loadPromises = audioFiles.map(async (file, index) => {
        try {
          // Create a unique ID for this file
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;
          
          // Check cache first
          if (metadataCache.has(fileId)) {
            console.log(`Using cached metadata for: ${file.name}`);
            return metadataCache.get(fileId);
          }

          const dataURL = await fileToDataURL(file);
          
          return new Promise(async (resolve) => {
            const audio = new Audio();
            
            const handleLoad = async () => {
              try {
                // Create initial song object
                const song = {
                  id: `song-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                  title: sanitizeFilename(file.name),
                  artist: 'Unknown Artist',
                  album: 'Unknown Album',
                  duration: audio.duration || 0,
                  url: dataURL,
                  plays: 0,
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  lastModified: file.lastModified,
                  originalFile: file
                };

                // Extract metadata based on file type
                let metadata = null;
                const isMP3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
                
                if (isMP3) {
                  console.log(`Extracting metadata from MP3: ${file.name}`);
                  metadata = await extractMP3Metadata(file);
                } else {
                  // For other audio formats, extract basic metadata
                  metadata = await extractBasicMetadata(file);
                }

                // Update song with extracted metadata
                if (metadata) {
                  if (metadata.title && metadata.title.trim()) {
                    song.title = metadata.title;
                  }
                  if (metadata.artist && metadata.artist.trim()) {
                    song.artist = metadata.artist;
                  }
                  if (metadata.album && metadata.album.trim()) {
                    song.album = metadata.album;
                  }
                  if (metadata.year) {
                    song.year = metadata.year;
                  }
                  if (metadata.genre) {
                    song.genre = metadata.genre;
                  }
                  if (metadata.track) {
                    song.track = metadata.track;
                  }
                  if (metadata.composer) {
                    song.composer = metadata.composer;
                  }
                  
                  // Set cover image if available
                  if (metadata.picture) {
                    song.coverUrl = metadata.picture;
                    console.log(`✓ Loaded with cover art: "${song.title}" by ${song.artist}`);
                  } else {
                    console.log(`✓ Loaded: "${song.title}" by ${song.artist} (no cover art)`);
                  }
                } else {
                  console.log(`✓ Loaded: "${song.title}" (no metadata found)`);
                }

                // Cache the song
                setMetadataCache(prev => new Map(prev).set(fileId, song));
                
                resolve(song);
              } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                resolve(null);
              }
            };
            
            const handleError = () => {
              console.error(`✗ Failed to load: ${file.name}`);
              resolve(null);
            };
            
            audio.addEventListener('loadedmetadata', handleLoad);
            audio.addEventListener('error', handleError);
            
            // Set a timeout to avoid hanging
            setTimeout(() => {
              if (audio.readyState === 0) {
                console.warn(`⏱ Timeout loading: ${file.name}`);
                audio.removeEventListener('loadedmetadata', handleLoad);
                audio.removeEventListener('error', handleError);
                resolve(null);
              }
            }, 10000);
            
            audio.src = dataURL;
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          return null;
        }
      });

      // Load files in batches to avoid overwhelming the browser
      const batchSize = 5;
      const newSongs = [];
      
      for (let i = 0; i < loadPromises.length; i += batchSize) {
        const batch = loadPromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        newSongs.push(...batchResults.filter(song => song !== null));
        
        // Update progress
        console.log(`Progress: ${newSongs.length}/${audioFiles.length} files loaded`);
      }

      if (newSongs.length === 0) {
        alert('Failed to load any audio files.');
        setIsLoading(false);
        return;
      }
      
      console.log(`✓ Successfully loaded ${newSongs.length}/${audioFiles.length} files with metadata`);
      
      // Merge with existing songs, avoiding duplicates by checking file properties
      const existingFileIds = new Set(songs.map(s => `${s.fileName}-${s.fileSize}-${s.lastModified}`));
      const uniqueNewSongs = newSongs.filter(song => 
        !existingFileIds.has(`${song.fileName}-${song.fileSize}-${song.lastModified}`)
      );
      
      if (uniqueNewSongs.length === 0) {
        alert('All selected files are already in your library.');
        setIsLoading(false);
        return;
      }
      
      const updatedSongs = [...songs, ...uniqueNewSongs];
      setSongs(updatedSongs);
      setFilteredSongs(updatedSongs);
      
      // Show success message
      alert(`Successfully added ${uniqueNewSongs.length} new songs to your library!`);
      
    } catch (error) {
      console.error('Error loading files:', error);
      alert('An error occurred while loading files. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [songs, metadataCache]);

  // ===== PLAYBACK =====
  const playSong = useCallback((song) => {
    if (!song || !song.url) {
      console.error('Invalid song:', song);
      return;
    }
    
    try {
      const songIndex = filteredSongs.findIndex(s => s.id === song.id);
      if (songIndex === -1) return;

      setCurrentSongIndex(songIndex);
      
      const audio = audioRef.current;
      if (audio.src !== song.url) {
        audio.src = song.url;
      }
      
      audio.play().then(() => {
        setIsPlaying(true);
        
        // Increment play count
        const updatedSongs = songs.map(s => 
          s.id === song.id ? { ...s, plays: (s.plays || 0) + 1 } : s
        );
        setSongs(updatedSongs);
        
        const updatedFiltered = filteredSongs.map(s => 
          s.id === song.id ? { ...s, plays: (s.plays || 0) + 1 } : s
        );
        setFilteredSongs(updatedFiltered);
        
        console.log(`Now playing: "${song.title}" by ${song.artist}`);
      }).catch(error => {
        console.error('Error playing song:', error);
        setIsPlaying(false);
      });
    } catch (error) {
      console.error('Error in playSong:', error);
    }
  }, [songs, filteredSongs]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      console.log('Playback paused');
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
      console.log('Playback started');
    }
  }, [isPlaying]);

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
      nextIndex = Math.floor(Math.random() * filteredSongs.length);
    } else {
      nextIndex = (currentSongIndex + 1) % filteredSongs.length;
    }

    if (repeatMode === 'off' && nextIndex === 0 && !isShuffled) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('Playback finished');
      return;
    }

    setCurrentSongIndex(nextIndex);
    playSong(filteredSongs[nextIndex]);
  }, [currentSongIndex, filteredSongs, isShuffled, repeatMode, queue, playSong]);

  const playPrevSong = useCallback(() => {
    if (currentSongIndex === null || filteredSongs.length === 0) return;

    const prevIndex = currentSongIndex === 0 
      ? filteredSongs.length - 1 
      : currentSongIndex - 1;

    setCurrentSongIndex(prevIndex);
    playSong(filteredSongs[prevIndex]);
  }, [currentSongIndex, filteredSongs, playSong]);

  const seekTo = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    console.log(`Audio ${!isMuted ? 'muted' : 'unmuted'}`);
  }, [isMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled);
    console.log(`Shuffle ${!isShuffled ? 'enabled' : 'disabled'}`);
  }, [isShuffled]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(current => {
      if (current === 'off') return 'all';
      if (current === 'all') return 'one';
      return 'off';
    });
  }, []);

  // ===== AUDIO EVENTS =====
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
        console.log('Repeating current song');
      } else {
        playNextSong();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, playNextSong]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ===== LIKED SONGS =====
  const toggleLike = useCallback((song) => {
    setLikedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(song.id)) {
        newSet.delete(song.id);
        console.log(`Removed "${song.title}" from liked songs`);
      } else {
        newSet.add(song.id);
        console.log(`Added "${song.title}" to liked songs`);
      }
      return newSet;
    });
  }, []);

  const isSongLiked = useCallback((songId) => {
    return likedSongs.has(songId);
  }, [likedSongs]);

  // ===== QUEUE =====
  const addToQueue = useCallback((song) => {
    setQueue(prev => [...prev, song]);
    console.log(`Added "${song.title}" to queue`);
  }, []);

  const removeFromQueue = useCallback((songId) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    console.log('Queue cleared');
  }, []);

  // ===== SEARCH =====
  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setFilteredSongs(songs);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = songs.filter(song => 
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.album.toLowerCase().includes(searchLower) ||
      (song.fileName && song.fileName.toLowerCase().includes(searchLower)) ||
      (song.genre && song.genre.toLowerCase().includes(searchLower))
    );
    setFilteredSongs(filtered);
    console.log(`Search "${query}" found ${filtered.length} songs`);
  }, [songs]);

  // ===== SORT =====
  const handleSort = useCallback((sortType) => {
    let sorted = [...filteredSongs];
    
    switch(sortType) {
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'artist-asc':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'artist-desc':
        sorted.sort((a, b) => b.artist.localeCompare(a.artist));
        break;
      case 'album-asc':
        sorted.sort((a, b) => (a.album || '').localeCompare(b.album || ''));
        break;
      case 'album-desc':
        sorted.sort((a, b) => (b.album || '').localeCompare(a.album || ''));
        break;
      case 'duration-asc':
        sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'duration-desc':
        sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'plays-asc':
        sorted.sort((a, b) => (a.plays || 0) - (b.plays || 0));
        break;
      case 'plays-desc':
        sorted.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      default:
        break;
    }
    
    setFilteredSongs(sorted);
    console.log(`Sorted by ${sortType}`);
  }, [filteredSongs]);

  // ===== SHUFFLE PLAY =====
  const handleShufflePlay = useCallback(() => {
    if (filteredSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    setIsShuffled(true);
    playSong(filteredSongs[randomIndex]);
    console.log('Started shuffle play');
  }, [filteredSongs, playSong]);

  // ===== PLAYLISTS =====
  const createNewPlaylist = useCallback((name) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songs: [],
      createdAt: new Date().toISOString()
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    console.log(`Created playlist: "${name}"`);
  }, []);

  const addSongToPlaylist = useCallback((songId, playlistId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const songExists = playlist.songs.some(s => s.id === songId);
        if (!songExists) {
          console.log(`Added "${song.title}" to playlist "${playlist.name}"`);
          return { ...playlist, songs: [...playlist.songs, song] };
        } else {
          console.log('Song already in playlist');
        }
      }
      return playlist;
    }));
  }, [songs]);

  const removeSongFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.id !== songId)
        };
      }
      return playlist;
    }));
  }, []);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    setSelectedPlaylist(null);
    console.log('Playlist deleted');
  }, []);

  // ===== LOCATE SONG =====
  const locateSong = useCallback((songId) => {
    setFocusTarget({ id: songId, timestamp: Date.now() });
  }, []);

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }

      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
        return;
      }

      switch(e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          playNextSong();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playPrevSong();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 's':
        case 'S':
          toggleShuffle();
          break;
        case 'r':
        case 'R':
          toggleRepeat();
          break;
        case 'l':
        case 'L':
          if (currentSong) toggleLike(currentSong);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, playNextSong, playPrevSong, toggleMute, toggleShuffle, toggleRepeat, toggleLike]);

  // ===== CURRENT SONG =====
  const currentSong = currentSongIndex !== null ? filteredSongs[currentSongIndex] : null;
  const likedSongsList = songs.filter(song => likedSongs.has(song.id));

  // ===== CLEANUP COVER ART URLs =====
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      songs.forEach(song => {
        if (song.coverUrl && song.coverUrl.startsWith('blob:')) {
          URL.revokeObjectURL(song.coverUrl);
        }
      });
    };
  }, [songs]);

  // ===== RENDER =====
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading audio files and extracting metadata...</p>
              <p className="loading-subtext">This may take a moment for files with cover art</p>
            </div>
          )}

          {showKeyboardHelp && (
            <div className="keyboard-help-overlay" onClick={() => setShowKeyboardHelp(false)}>
              <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
                <div className="help-header">
                  <h2>⌨️ Keyboard Shortcuts</h2>
                  <button onClick={() => setShowKeyboardHelp(false)} className="close-help">×</button>
                </div>
                <div className="help-content">
                  <div className="help-section">
                    <h3>Playback</h3>
                    <div className="shortcut"><kbd>Space</kbd> or <kbd>K</kbd> <span>Play / Pause</span></div>
                    <div className="shortcut"><kbd>→</kbd> <span>Next Song</span></div>
                    <div className="shortcut"><kbd>←</kbd> <span>Previous Song</span></div>
                    <div className="shortcut"><kbd>↑</kbd> <span>Volume Up</span></div>
                    <div className="shortcut"><kbd>↓</kbd> <span>Volume Down</span></div>
                    <div className="shortcut"><kbd>M</kbd> <span>Mute / Unmute</span></div>
                  </div>
                  <div className="help-section">
                    <h3>Controls</h3>
                    <div className="shortcut"><kbd>S</kbd> <span>Toggle Shuffle</span></div>
                    <div className="shortcut"><kbd>R</kbd> <span>Toggle Repeat</span></div>
                    <div className="shortcut"><kbd>L</kbd> <span>Like Current Song</span></div>
                    <div className="shortcut"><kbd>?</kbd> <span>Show This Help</span></div>
                    <div className="shortcut"><kbd>Esc</kbd> <span>Close Dialogs</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Sidebar onSearch={handleSearch} />
          
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              
              <Route path="/library" element={
                <>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Header 
                      loadFiles={loadFiles}
                      onShufflePlay={handleShufflePlay}
                      onSort={handleSort}
                    />
                    <button 
                      className="help-button" 
                      onClick={() => setShowKeyboardHelp(true)}
                      title="Keyboard Shortcuts (?)"
                      style={{ 
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        fontSize: '20px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '20px 30px',
                        transition: 'all 0.2s'
                      }}
                    >
                      ?
                    </button>
                  </div>
                  <MusicList
                    songs={filteredSongs}
                    playSong={playSong}
                    currentSongId={currentSong?.id}
                    playlists={playlists}
                    addSongToPlaylist={addSongToPlaylist}
                    onOpenPlaylistSidebar={setSelectedPlaylistForAdd}
                    isSongLiked={isSongLiked}
                    onToggleLike={toggleLike}
                    onAddToQueue={addToQueue}
                    focusTarget={focusTarget}
                  />
                </>
              } />
              
              <Route path="/liked" element={
                <MusicList
                  songs={likedSongsList}
                  playSong={playSong}
                  currentSongId={currentSong?.id}
                  playlists={playlists}
                  addSongToPlaylist={addSongToPlaylist}
                  onOpenPlaylistSidebar={setSelectedPlaylistForAdd}
                  isSongLiked={isSongLiked}
                  onToggleLike={toggleLike}
                  onAddToQueue={addToQueue}
                />
              } />
              
              <Route path="/queue" element={
                <QueueView
                  queue={queue}
                  removeFromQueue={removeFromQueue}
                  clearQueue={clearQueue}
                  playSong={playSong}
                  currentSongId={currentSong?.id}
                />
              } />
              
              <Route path="/playlists" element={
                selectedPlaylist ? (
                  <PlaylistDetail
                    playlist={selectedPlaylist}
                    onBack={() => setSelectedPlaylist(null)}
                    playSong={playSong}
                    currentSongId={currentSong?.id}
                    removeSongFromPlaylist={removeSongFromPlaylist}
                    deletePlaylist={deletePlaylist}
                  />
                ) : (
                  <PlaylistsView
                    playlists={playlists}
                    createNewPlaylist={createNewPlaylist}
                    onPlaylistSelect={setSelectedPlaylist}
                  />
                )
              } />
            </Routes>
          </div>

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
            setVolume={(v) => {
              setVolume(v);
              audioRef.current.volume = isMuted ? 0 : v;
            }}
            isShuffled={isShuffled}
            toggleShuffle={toggleShuffle}
            repeatMode={repeatMode}
            toggleRepeat={toggleRepeat}
            locateSong={locateSong}
            isCurrentLiked={currentSong ? isSongLiked(currentSong.id) : false}
            onToggleCurrentLike={toggleLike}
          />

          {selectedPlaylistForAdd && (
            <PlaylistSidebar
              song={selectedPlaylistForAdd}
              playlists={playlists}
              addSongToPlaylist={addSongToPlaylist}
              addToQueue={addToQueue}
              onClose={() => setSelectedPlaylistForAdd(null)}
              createNewPlaylist={createNewPlaylist}
            />
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;