// src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MusicList from './components/MusicList';
import PlayerControls from './components/PlayerControls';
import PlaylistsView from './components/PlaylistView';
import PlaylistDetail from './components/PlaylistDetail';
import PlaylistSidebar from './components/PlaylistSidebar';
import QueueView from './components/QueueView';
import Home from './components/Home';
import './App.css';
import { fetchTracks, incrementPlayCount, streamUrlFor, extractMetadata, scanPaths } from './api/client';

// LocalStorage keys for persistence
const LOCAL_STORAGE_PLAYLISTS_KEY = 'musicPlayer.playlists';
const LOCAL_STORAGE_SONGLIST_KEY = 'musicPlayer.songList';

const loadFromLS = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

// Initial state for the player
const initialPlayerState = {
    isPlaying: false,
    currentSong: null,
    songList: [],
    currentTime: 0,
    duration: 0,
    isMuted: false,
    volume: 1,
    isShuffled: false,
};

function App() {
    const [playerState, setPlayerState] = useState(() => ({
        ...initialPlayerState,
        // Load minimal song metadata from localStorage (no File blobs)
        songList: loadFromLS(LOCAL_STORAGE_SONGLIST_KEY, []),
    }));
    const [playlists, setPlaylists] = useState(() => loadFromLS(LOCAL_STORAGE_PLAYLISTS_KEY, []));
    const [likedSongs, setLikedSongs] = useState([]);
    const [queue, setQueue] = useState([]);
    const [focusTarget, setFocusTarget] = useState({ id: null, nonce: 0 });
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSongs, setFilteredSongs] = useState([]);
    const [playlistSidebar, setPlaylistSidebar] = useState({
        isOpen: false,
        song: null
    });
    const audioRef = useRef(new Audio());

    // --- Liked Songs ---
    useEffect(() => {
        try {
            const saved = localStorage.getItem('likedSongs');
            if (saved) setLikedSongs(JSON.parse(saved));
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
        } catch {}
    }, [likedSongs]);

    const isSongLiked = useCallback((id) => likedSongs.some(s => s.id === id), [likedSongs]);
    const toggleLike = (song) => {
        if (!song) return;
        setLikedSongs(prev => {
            const exists = prev.some(s => s.id === song.id);
            return exists ? prev.filter(s => s.id !== song.id) : [{...song}, ...prev];
        });
    };

    // --- Search Functionality ---
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        
        if (!query.trim()) {
            setFilteredSongs(playerState.songList);
            return;
        }

        const lowercasedQuery = query.toLowerCase();
        const filtered = playerState.songList.filter(song => 
            song.title.toLowerCase().includes(lowercasedQuery) ||
            song.artist.toLowerCase().includes(lowercasedQuery) ||
            song.album.toLowerCase().includes(lowercasedQuery)
        );
        
        setFilteredSongs(filtered);
    }, [playerState.songList]);

    // Update filtered songs when songList changes
    useEffect(() => {
        setFilteredSongs(playerState.songList);
    }, [playerState.songList]);

    // --- Sort Functionality ---
    const handleSort = useCallback((sortType) => {
        const sorted = [...filteredSongs];
        
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
            case 'duration-asc':
                sorted.sort((a, b) => {
                    const durA = (typeof a.duration === 'number' && !isNaN(a.duration)) ? a.duration : 0;
                    const durB = (typeof b.duration === 'number' && !isNaN(b.duration)) ? b.duration : 0;
                    return durA - durB;
                });
                break;
            case 'duration-desc':
                sorted.sort((a, b) => {
                    const durA = (typeof a.duration === 'number' && !isNaN(a.duration)) ? a.duration : 0;
                    const durB = (typeof b.duration === 'number' && !isNaN(b.duration)) ? b.duration : 0;
                    return durB - durA;
                });
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
    }, [filteredSongs]);


    // --- Persistence Effects (localStorage) ---
    useEffect(() => {
        // Save song list without File blobs
        const songsToSave = playerState.songList.map(({ file, ...rest }) => rest);
        try { localStorage.setItem(LOCAL_STORAGE_SONGLIST_KEY, JSON.stringify(songsToSave)); } catch {}
    }, [playerState.songList]);

    useEffect(() => {
        // Save playlists; strip File blobs from nested songs
        const toSave = playlists.map(p => ({
            ...p,
            songs: (p.songs || []).map(({ file, ...rest }) => rest),
        }));
        try { localStorage.setItem(LOCAL_STORAGE_PLAYLISTS_KEY, JSON.stringify(toSave)); } catch {}
    }, [playlists]);

    // Clear library on tab/window close
    useEffect(() => {
        const handler = () => {
            try {
                localStorage.removeItem(LOCAL_STORAGE_SONGLIST_KEY);
                localStorage.removeItem(LOCAL_STORAGE_PLAYLISTS_KEY);
            } catch {}
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // --- Backend library load ---
    useEffect(() => {
        (async () => {
            try {
                const items = await fetchTracks({ page: 1, pageSize: 500 });
                setPlayerState(prev => ({ ...prev, songList: items }));
            } catch (e) {
                console.warn('tracks load failed', e);
            }
        })();
    }, []);

    // Update a song's duration in state by id
    const updateSongDuration = (songId, duration) => {
        if (!songId || isNaN(duration)) return;
        setPlayerState(prev => ({
            ...prev,
            songList: prev.songList.map(s => s.id === songId ? { ...s, duration } : s),
            currentSong: prev.currentSong && prev.currentSong.id === songId
                ? { ...prev.currentSong, duration }
                : prev.currentSong,
        }));
    };

    // Preload duration for a song without playing it (restored so durations show up)
    const preloadDuration = (song) => {
        try {
            const a = new Audio();
            a.preload = 'metadata';
            a.src = song.id;
            const onMeta = () => {
                updateSongDuration(song.id, a.duration);
                a.removeEventListener('loadedmetadata', onMeta);
                a.src = '';
            };
            a.addEventListener('loadedmetadata', onMeta);
        } catch {}
    };

    // Local file import restored: enrich via backend (/api/metadata) or scanPaths (Electron)
    const loadFiles = (files) => {
        const audioFiles = Array.from(files).filter(file =>
            (file.type && file.type.startsWith('audio/')) || /\.(mp3|m4a|aac|flac|wav|ogg|opus)$/i.test(file.name)
        );
        const newSongs = audioFiles.map((file) => {
            const id = URL.createObjectURL(file);
            return {
                id, // blob URL id for local playback
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown',
                album: 'Unknown',
                duration: 0,
                coverUrl: null,
                file,
                filePath: file.path || null,
            };
        });
        setPlayerState(prev => ({ ...prev, songList: [...prev.songList, ...newSongs] }));

        // If we have absolute paths (Electron), batch scan for faster results
        const pathList = newSongs.map(s => s.filePath).filter(Boolean);
        if (pathList.length) {
            (async () => {
                const items = await scanPaths(pathList);
                setPlayerState(prev => ({
                    ...prev,
                    songList: prev.songList.map(s => {
                        const found = items.find(it => it.path === s.filePath);
                        if (!found) return s;
                        return {
                            ...s,
                            title: found.title || s.title,
                            artist: found.artist || s.artist,
                            album: found.album || s.album,
                            duration: typeof found.duration === 'number' ? found.duration : s.duration,
                            coverUrl: found.coverUrl || s.coverUrl,
                        };
                    })
                }));
            })();
        }

        // Fallback: upload file to backend for metadata (web)
        newSongs.forEach(async (song, idx) => {
            try {
                const meta = await extractMetadata(audioFiles[idx]);
                if (!meta) return;
                setPlayerState(prev => ({
                    ...prev,
                    songList: prev.songList.map(s => s.id === song.id ? {
                        ...s,
                        title: meta.title || s.title,
                        artist: meta.artist || s.artist,
                        album: meta.album || s.album,
                        duration: typeof meta.duration === 'number' ? meta.duration : s.duration,
                        coverUrl: meta.coverUrl || s.coverUrl,
                    } : s)
                }));
            } catch {}
        });
    };

    // Refresh metadata for already-loaded songs
    const refreshAllMetadata = async () => {
        const songs = playerState.songList;
        const pathList = songs.map(x=>x.filePath).filter(Boolean);
        if (pathList.length === 0) return alert('No file paths to refresh.');
        const items = await scanPaths(pathList);
        const updated = songs.map(s => {
            const found = items.find(it => it.path === s.filePath);
            if (!found) return s;
            return { ...s, title: found.title || s.title, artist: found.artist || s.artist, album: found.album || s.album, coverUrl: found.coverUrl || s.coverUrl, duration: typeof found.duration==='number'?found.duration:s.duration };
        });
        setPlayerState(prev => ({
            ...prev,
            songList: updated,
            currentSong: prev.currentSong ? (updated.find(x => x.id === prev.currentSong.id) || prev.currentSong) : null,
        }));
        alert('Metadata refreshed for loaded songs.');
    };

    // --- Playlist Management ---
    const createNewPlaylist = (name) => {
        const newPlaylist = {
            id: Date.now(),
            name: name,
            songs: [],
        };
        setPlaylists(prevPlaylists => [...prevPlaylists, newPlaylist]);
    };

    const addSongToPlaylist = (songId, playlistId) => {
        const songToAdd = playerState.songList.find(s => s.id === songId);
        
        if (!songToAdd) return;

        setPlaylists(prevPlaylists => {
            const next = prevPlaylists.map(p => {
                if (p.id === playlistId) {
                    if (!p.songs.some(s => s.id === songId)) {
                        alert(`Added ${songToAdd.title} to ${p.name}`);
                        return { ...p, songs: [...p.songs, songToAdd] };
                    } else {
                        alert(`${songToAdd.title} is already in ${p.name}`);
                        return p;
                    }
                }
                return p;
            });
            // Keep selected playlist in sync
            if (selectedPlaylist && selectedPlaylist.id === playlistId) {
                const updated = next.find(p => p.id === playlistId);
                setSelectedPlaylist(updated || null);
            }
            return next;
        });
    };

    const removeSongFromPlaylist = (playlistId, songId) => {
        setPlaylists(prevPlaylists => {
            const next = prevPlaylists.map(p => {
                if (p.id === playlistId) {
                    return {
                        ...p,
                        songs: (p.songs || []).filter(s => s.id !== songId)
                    };
                }
                return p;
            });
            // Update selected playlist if it's the one being viewed
            if (selectedPlaylist && selectedPlaylist.id === playlistId) {
                const updated = next.find(p => p.id === playlistId);
                setSelectedPlaylist(updated || null);
            }
            return next;
        });
    };

    const deletePlaylist = (playlistId) => {
        setPlaylists(prevPlaylists => prevPlaylists.filter(p => p.id !== playlistId));
        if (selectedPlaylist && selectedPlaylist.id === playlistId) {
            setSelectedPlaylist(null);
        }
    };

    const handlePlaylistSelect = (playlist) => {
        setSelectedPlaylist(playlist);
    };

    const handleBackToPlaylists = () => {
        setSelectedPlaylist(null);
    };

    // --- Playlist Sidebar Functions ---
    const openPlaylistSidebar = (song) => {
        console.log("Opening sidebar for:", song.title);
        setPlaylistSidebar({
            isOpen: true,
            song: song
        });
    };

    const closePlaylistSidebar = () => {
        setPlaylistSidebar({
            isOpen: false,
            song: null
        });
    };

    // --- Playback Controls ---
    const playSong = useCallback((song) => {
        if (!song) return;
        if (playerState.currentSong && playerState.currentSong.id === song.id) {
            togglePlayPause();
            return;
        }

        const updatedSong = { ...song };

        const audio = audioRef.current;
        // Stream from backend if this is a backend track (numeric id). Otherwise play local blob URL.
        if (typeof updatedSong.id === 'number') {
            audio.src = streamUrlFor(updatedSong.id);
            audio.play().catch(err => console.warn('Audio play() failed', err));
            // Optimistic play count bump for UI and backend
            setPlayerState(prev => ({
                ...prev,
                currentSong: updatedSong,
                isPlaying: true,
                songList: prev.songList.map(s => s.id === updatedSong.id ? { ...s, plays: (s.plays || 0) + 1 } : s)
            }));
            incrementPlayCount(updatedSong.id);
        } else {
            const src = updatedSong.file ? URL.createObjectURL(updatedSong.file) : updatedSong.id;
            audio.src = src;
            audio.play().catch(err => console.warn('Audio play() failed', err));
            // Set current song and increment play count for local files
            setPlayerState(prev => ({
                ...prev,
                currentSong: updatedSong,
                isPlaying: true,
                songList: prev.songList.map(s => s.id === updatedSong.id ? { ...s, plays: (s.plays || 0) + 1 } : s)
            }));
            if (updatedSong.file && src.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(src), 1000);
            }
        }

    }, [playerState.currentSong]);

    const togglePlayPause = () => {
        if (playerState.isPlaying) {
            audioRef.current.pause();
        } else if (playerState.currentSong) {
            audioRef.current.play();
        }
        setPlayerState(prevState => ({
            ...prevState,
            isPlaying: !prevState.isPlaying,
        }));
    };

    const toggleMute = () => {
        const newMuteState = !playerState.isMuted;
        audioRef.current.muted = newMuteState;
        setPlayerState(prevState => ({
            ...prevState,
            isMuted: newMuteState,
        }));
    };

    // Volume controls
    const setVolume = (v) => {
        const clamped = Math.max(0, Math.min(1, v));
        audioRef.current.volume = clamped;
        setPlayerState(prev => ({
            ...prev,
            volume: clamped,
            isMuted: clamped === 0 ? true : prev.isMuted,
        }));
    };

    const increaseVolume = () => setVolume((playerState.volume ?? 1) + 0.1);
    const decreaseVolume = () => setVolume((playerState.volume ?? 1) - 0.1);

    // Shuffle
    const toggleShuffle = () => {
        setPlayerState(prev => {
            const list = prev.songList || [];
            const next = { ...prev, isShuffled: !prev.isShuffled };

            // Always jump to a new random song on click
            if (list.length > 0) {
                const candidates = list.filter(s => s.id !== prev.currentSong?.id);
                const pool = candidates.length > 0 ? candidates : list;
                const random = pool[Math.floor(Math.random() * pool.length)];
                if (random) {
                    audioRef.current.src = random.id;
                    audioRef.current.play();
                    next.currentSong = random;
                    next.isPlaying = true;
                }
            }
            return next;
        });
    };

    const shuffleAndPlay = useCallback(() => {
        setPlayerState(prev => {
            const list = prev.songList || [];
            if (list.length === 0) return prev;
            const candidates = list.filter(s => s.id !== prev.currentSong?.id);
            const pool = candidates.length > 0 ? candidates : list;
            const random = pool[Math.floor(Math.random() * pool.length)];
            if (!random) return prev;
            try { audioRef.current.src = random.id; audioRef.current.play(); } catch {}
            return { ...prev, isShuffled: true, currentSong: random, isPlaying: true };
        });
    }, []);

    const playNextSong = useCallback(() => {
        // 1) Take from queue if available
        if (queue.length > 0) {
            const [next, ...rest] = queue;
            setQueue(rest);
            playSong(next);
            return;
        }
        // 2) If shuffle is enabled, pick a random song (not the current one if possible)
        if (playerState.isShuffled && playerState.songList.length > 0) {
            const candidates = playerState.songList.filter(s => s.id !== playerState.currentSong?.id);
            const pool = candidates.length > 0 ? candidates : playerState.songList;
            const random = pool[Math.floor(Math.random() * pool.length)];
            if (random) {
                playSong(random);
                return;
            }
        }
        // 3) Otherwise fallback to next in songList
        const currentIndex = playerState.songList.findIndex(s => s.id === playerState.currentSong?.id);
        const nextSong = playerState.songList[currentIndex + 1];

        if (nextSong) {
            playSong(nextSong);
        } else {
            audioRef.current.pause();
            setPlayerState(prevState => ({ ...prevState, isPlaying: false, currentTime: 0 }));
        }
    }, [queue, playerState.songList, playerState.currentSong, playerState.isShuffled, playSong]);

    const playPrevSong = useCallback(() => {
        const currentIndex = playerState.songList.findIndex(s => s.id === playerState.currentSong?.id);
        const prevSong = playerState.songList[currentIndex - 1];

        if (prevSong) {
            playSong(prevSong);
        }
    }, [playerState.songList, playerState.currentSong, playSong]);

    // Queue operations
    const addToQueue = (song) => {
        if (!song) return;
        setQueue(prev => [...prev, song]);
    };
    const removeFromQueue = (id) => setQueue(prev => prev.filter(s => s.id !== id));
    const clearQueue = () => setQueue([]);

    // Locate current song in lists
    const locateSong = (id) => {
        if (!id) return;
        setFocusTarget({ id, nonce: Date.now() });
    };

    const seekTo = (time) => {
        audioRef.current.currentTime = time;
        setPlayerState(prevState => ({ ...prevState, currentTime: time }));
    };

    // --- Audio Event Handlers ---
    useEffect(() => {
        const audio = audioRef.current;
        audio.muted = playerState.isMuted;
        
        const setSongData = () => {
            setPlayerState(prevState => ({
                ...prevState,
                duration: audio.duration,
                songList: prevState.songList.map(s => s.id === prevState.currentSong?.id ? { ...s, duration: audio.duration } : s)
            }));
        };

        const updateTime = () => {
            setPlayerState(prevState => ({ ...prevState, currentTime: audio.currentTime }));
        };

        const handleEnded = () => {
            playNextSong();
        };

        audio.addEventListener('loadedmetadata', setSongData);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setSongData);
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [playerState.songList, playerState.currentSong, playNextSong, playerState.isMuted]);

    // Apply volume to audio element when it changes
    useEffect(() => {
        audioRef.current.volume = playerState.volume ?? 1;
    }, [playerState.volume]);

    // Close sidebar when clicking overlay
    const closeSidebar = () => {
        document.body.classList.remove('sidebar-open');
    };

    // Auto-hide header/footer on scroll AND after 4s of inactivity (mobile only)
    useEffect(() => {
        let lastScrollY = 0;
        let ticking = false;
        let inactivityTimer = null;

        const hideControls = () => {
            const header = document.querySelector('.header');
            const footer = document.querySelector('.player-controls');
            const layout = document.querySelector('.player-layout');
            header?.classList.add('hide-on-scroll');
            footer?.classList.add('hide-on-scroll');
            layout?.classList.add('fullscreen-mode');
        };

        const showControls = () => {
            const header = document.querySelector('.header');
            const footer = document.querySelector('.player-controls');
            const layout = document.querySelector('.player-layout');
            header?.classList.remove('hide-on-scroll');
            footer?.classList.remove('hide-on-scroll');
            layout?.classList.remove('fullscreen-mode');
        };

        const resetInactivityTimer = () => {
            showControls();
            if (inactivityTimer) clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(hideControls, 4000);
        };

        const handleScroll = (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollContainer = e.target;
                    const currentScrollY = scrollContainer.scrollTop;
                    
                    if (currentScrollY > lastScrollY && currentScrollY > 50) {
                        // Scrolling down - hide immediately
                        hideControls();
                        if (inactivityTimer) clearTimeout(inactivityTimer);
                    } else {
                        // Scrolling up - show and reset timer
                        resetInactivityTimer();
                    }
                    
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        const handleInteraction = () => {
            resetInactivityTimer();
        };

        // Target all scrollable areas
        const musicArea = document.querySelector('.music-area');
        const songList = document.querySelector('.song-list');
        const playerLayout = document.querySelector('.player-layout');
        
        // Scroll listeners
        musicArea?.addEventListener('scroll', handleScroll, { passive: true });
        songList?.addEventListener('scroll', handleScroll, { passive: true });
        
        // Interaction listeners (touch, mouse, tap)
        playerLayout?.addEventListener('touchstart', handleInteraction, { passive: true });
        playerLayout?.addEventListener('mousemove', handleInteraction, { passive: true });
        playerLayout?.addEventListener('click', handleInteraction, { passive: true });
        
        // Start initial timer on all devices
        inactivityTimer = setTimeout(hideControls, 4000);
        
        return () => {
            musicArea?.removeEventListener('scroll', handleScroll);
            songList?.removeEventListener('scroll', handleScroll);
            playerLayout?.removeEventListener('touchstart', handleInteraction);
            playerLayout?.removeEventListener('mousemove', handleInteraction);
            playerLayout?.removeEventListener('click', handleInteraction);
            if (inactivityTimer) clearTimeout(inactivityTimer);
        };
    }, []);

    // --- UI Structure ---
    return (
        <Router>
            <div className="player-layout" onClick={(e) => {
                // Close sidebar if clicking on overlay (body.sidebar-open::before)
                if (document.body.classList.contains('sidebar-open') && 
                    !e.target.closest('.sidebar') && 
                    !e.target.closest('.mobile-menu-btn')) {
                    closeSidebar();
                }
            }}>
                {/* Night sky elements */}
                <div className="moon"></div>
                <div className="cloud cloud-1"></div>
                <div className="cloud cloud-2"></div>
                <div className="cloud cloud-3"></div>
                <div className="cloud cloud-4"></div>
                
                <Sidebar onSearch={handleSearch} />
                {/* Playlist Sidebar */}
                {playlistSidebar.isOpen && (
                    <PlaylistSidebar 
                        song={playlistSidebar.song}
                        playlists={playlists}
                        addSongToPlaylist={addSongToPlaylist}
                        addToQueue={addToQueue}
                        onClose={closePlaylistSidebar}
                        createNewPlaylist={createNewPlaylist}
                    />
                )}
                
                <div className="main-content-area">
                    {/* Header Routes */}
                    <Routes> 
                        <Route path="/" element={<Header loadFiles={loadFiles} onShufflePlay={shuffleAndPlay} onSort={handleSort} />} />
                        <Route path="/library" element={<Header loadFiles={loadFiles} onShufflePlay={shuffleAndPlay} onSort={handleSort} />} />
                        <Route path="/liked" element={
                            <div className="header header-with-back">
                                <button className="back-nav-btn" onClick={() => window.history.back()}>← Back</button>
                                <h2>Liked Songs</h2>
                            </div>
                        } />
                        <Route path="/queue" element={
                            <div className="header header-with-back">
                                <button className="back-nav-btn" onClick={() => window.history.back()}>← Back</button>
                                <h2>Queue</h2>
                            </div>
                        } />
                        <Route path="/playlists" element={
                            selectedPlaylist ? 
                                <div className="header header-with-back">
                                    <button className="back-nav-btn" onClick={() => setSelectedPlaylist(null)}>← Back</button>
                                    <h2>{selectedPlaylist.name}</h2>
                                </div> : 
                                <div className="header header-with-back">
                                    <button className="back-nav-btn" onClick={() => window.history.back()}>← Back</button>
                                    <h2>Playlists</h2>
                                </div>
                        } />
                        <Route path="/settings" element={
                            <div className="header header-with-back">
                                <button className="back-nav-btn" onClick={() => window.history.back()}>← Back</button>
                                <h2>Settings</h2>
                            </div>
                        } />
                    </Routes>
                    
                    <div className="music-area">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            {/* Music Library View */}
                            <Route path="/library" element={
                                <MusicList 
                                    songs={filteredSongs} 
                                    playSong={playSong} 
                                    currentSongId={playerState.currentSong?.id} 
                                    playlists={playlists}
                                    addSongToPlaylist={addSongToPlaylist}
                                    searchQuery={searchQuery}
                                    onOpenPlaylistSidebar={openPlaylistSidebar}
                                    isSongLiked={isSongLiked}
                                    onToggleLike={toggleLike}
                                    onAddToQueue={addToQueue}
                                    focusTarget={focusTarget}
                                />
                            } />
                            
                            {/* Playlists View */}
                            <Route 
                                path="/playlists" 
                                element={
                                    selectedPlaylist ? (
                                        <PlaylistDetail 
                                            playlist={selectedPlaylist}
                                            onBack={handleBackToPlaylists}
                                            playSong={playSong}
                                            currentSongId={playerState.currentSong?.id}
                                            removeSongFromPlaylist={removeSongFromPlaylist}
                                            deletePlaylist={deletePlaylist}
                                        />
                                    ) : (
                                        <PlaylistsView 
                                            playlists={playlists} 
                                            createNewPlaylist={createNewPlaylist}
                                            onPlaylistSelect={handlePlaylistSelect}
                                        />
                                    )
                                } 
                            />
                            <Route path="/liked" element={
                                <MusicList
                                    songs={likedSongs}
                                    playSong={playSong}
                                    currentSongId={playerState.currentSong?.id}
                                    playlists={playlists}
                                    addSongToPlaylist={addSongToPlaylist}
                                    searchQuery={''}
                                    onOpenPlaylistSidebar={openPlaylistSidebar}
                                    isSongLiked={isSongLiked}
                                    onToggleLike={toggleLike}
                                    onAddToQueue={addToQueue}
                                    focusTarget={focusTarget}
                                />
                            } />
                            <Route path="/queue" element={
                                <QueueView
                                    queue={queue}
                                    removeFromQueue={removeFromQueue}
                                    clearQueue={clearQueue}
                                    playSong={playSong}
                                    currentSongId={playerState.currentSong?.id}
                                />
                            } />
                            <Route path="/settings" element={<p>Settings Page Content will be updated soon</p>} />
                        </Routes>
                    </div>
                </div>
                
                {/* Player Controls */}
                <PlayerControls
                    song={playerState.currentSong}
                    isPlaying={playerState.isPlaying}
                    currentTime={playerState.currentTime}
                    duration={playerState.duration}
                    togglePlayPause={togglePlayPause}
                    playNextSong={playNextSong}
                    playPrevSong={playPrevSong}
                    seekTo={seekTo}
                    isMuted={playerState.isMuted}
                    toggleMute={toggleMute}
                    volume={playerState.volume}
                    setVolume={setVolume}
                    isShuffled={playerState.isShuffled}
                    toggleShuffle={toggleShuffle}
                    locateSong={locateSong}
                    isCurrentLiked={playerState.currentSong ? isSongLiked(playerState.currentSong.id) : false}
                    onToggleCurrentLike={toggleLike}
                />
            </div>
           
        </Router>
    );
}

export default App;