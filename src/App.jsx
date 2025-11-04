// src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MusicList from './components/MusicList';
import PlayerControls from './components/PlayerControls';
import PlaylistsView from './components/PlaylistView';
import PlaylistDetail from './components/PlaylistDetail';
import PlaylistSidebar from './components/PlaylistSidebar';
import QueueView from './components/QueueView';
import Home from './components/Home';
import './App.css';
import { fetchPlayCounts, incrementPlayCount, extractMetadata, scanPaths } from './api/client';

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

    // Fetch and merge play counts from backend
    useEffect(() => {
        (async () => {
            const counts = await fetchPlayCounts();
            if (!counts) return;
            setPlayerState(prev => ({
                ...prev,
                songList: prev.songList.map(s => ({ ...s, playCount: counts[s.id] ?? s.playCount ?? 0 })),
                currentSong: prev.currentSong ? ({ ...prev.currentSong, playCount: counts[prev.currentSong.id] ?? prev.currentSong.playCount ?? 0 }) : null,
            }));
        })();
    }, []);

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

    // --- File Loading Logic ---
    // Extract cover art and tags from audio files
    const extractSongData = async (file) => {
        let coverUrl = null;
        let title = file.name.replace(/\.[^/.]+$/, "");
        let artist = 'Local Artist';
        let album = 'Local Files';
        let durationTag = undefined;
        try {
            const { parseBlob } = await import('music-metadata-browser');
            const metadata = await parseBlob(file);
            const pic = metadata?.common?.picture?.[0];
            if (pic && pic.data) {
                const blob = new Blob([pic.data], { type: pic.format || 'image/jpeg' });
                coverUrl = URL.createObjectURL(blob);
            }
            if (metadata?.common?.title) title = metadata.common.title;
            if (metadata?.common?.artist) artist = metadata.common.artist;
            if (metadata?.common?.album) album = metadata.common.album;
            if (typeof metadata?.format?.duration === 'number') durationTag = metadata.format.duration;
        } catch (_) {
            // ignore parsing errors
        }
        // If still no cover, try jsmediatags immediately for better UX
        if (!coverUrl) {
            try {
                const jsmt = await import('jsmediatags');
                await new Promise((resolve) => {
                    const reader = (jsmt.default || jsmt);
                    reader.read(file, {
                        onSuccess: ({ tags }) => {
                            const p = tags?.picture;
                            if (p && p.data) {
                                const mime = p.format || 'image/jpeg';
                                const byteArray = new Uint8Array(p.data);
                                const blob = new Blob([byteArray], { type: mime });
                                coverUrl = URL.createObjectURL(blob);
                            }
                            resolve();
                        },
                        onError: () => resolve()
                    });
                });
            } catch {}
        }
        return { coverUrl, title, artist, album, durationTag };
    };

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

    const loadFiles = (files) => {
        const audioFiles = Array.from(files).filter(file =>
            (file.type && file.type.startsWith('audio/')) || /\.(mp3|m4a|aac|flac|wav|ogg|opus)$/i.test(file.name)
        );
        const newSongs = audioFiles.map((file) => {
            const id = URL.createObjectURL(file);
            // Fast path: basic fields first
            return {
                id,
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown',
                album: 'Unknown',
                duration: 0,
                coverUrl: null,
                file,
                filePath: file.path || null,
            };
        });
        setPlayerState(prevState => ({
            ...prevState,
            songList: [...prevState.songList, ...newSongs],
        }));

        // Prefer path-based bulk scan when file paths are available (Electron/local backend)
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

        // Ask backend for real metadata and merge in as it arrives (web fallback)
        newSongs.forEach(async (song, idx) => {
            try {
                const meta = await extractMetadata(audioFiles[idx]);
                if (!meta) return;
                let fallback = {};
                try {
                    if (!meta.coverUrl || !meta.duration || !meta.title || !meta.artist || !meta.album) {
                        const data = await extractSongData(audioFiles[idx]);
                        fallback = { title: data?.title, artist: data?.artist, album: data?.album, duration: data?.durationTag, coverUrl: data?.coverUrl };
                    }
                } catch {}
                const merged = {
                    title: meta.title || fallback.title,
                    artist: meta.artist || fallback.artist,
                    album: meta.album || fallback.album,
                    duration: (typeof meta.duration === 'number' ? meta.duration : undefined) ?? fallback.duration ?? 0,
                    coverUrl: meta.coverUrl || fallback.coverUrl || null,
                };
                setPlayerState(prev => ({
                    ...prev,
                    songList: prev.songList.map(s => s.id === song.id ? {
                        ...s,
                        title: merged.title || s.title,
                        artist: merged.artist || s.artist,
                        album: merged.album || s.album,
                        duration: typeof merged.duration === 'number' ? merged.duration : s.duration,
                        coverUrl: merged.coverUrl || s.coverUrl,
                    } : s),
                    currentSong: prev.currentSong && prev.currentSong.id === song.id ? {
                        ...prev.currentSong,
                        title: merged.title || prev.currentSong.title,
                        artist: merged.artist || prev.currentSong.artist,
                        album: merged.album || prev.currentSong.album,
                        duration: typeof merged.duration === 'number' ? merged.duration : prev.currentSong.duration,
                        coverUrl: merged.coverUrl || prev.currentSong.coverUrl,
                    } : prev.currentSong,
                }));
            } catch {}
        });
    };

    // Refresh metadata for already-loaded songs
    const refreshAllMetadata = async () => {
        const songs = playerState.songList;
        const updated = await Promise.all(
            songs.map(async (s) => {
                if (!s?.file) return s;
                try {
                    const data = await extractSongData(s.file);
                    return {
                        ...s,
                        title: data.title || s.title,
                        artist: data.artist || s.artist,
                        album: data.album || s.album,
                        coverUrl: data.coverUrl || s.coverUrl,
                    };
                } catch {
                    return s;
                }
            })
        );
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

        const updatedSong = { ...song, playCount: (song.playCount || 0) + 1 };

        const audio = audioRef.current;
        // Create a fresh blob URL if we still have the File, else use stored id
        const src = song.file ? URL.createObjectURL(song.file) : updatedSong.id;
        audio.src = src;
        // Start immediately; let the browser buffer in background
        audio.play().catch(err => console.warn('Audio play() failed', err));
        // Revoke temp object URL shortly after to free memory
        if (song.file && src.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(src), 1000);
        }

        setPlayerState(prevState => ({
            ...prevState,
            currentSong: updatedSong,
            isPlaying: true,
            songList: prevState.songList.map(s => s.id === updatedSong.id ? updatedSong : s),
        }));

        // Lazily enrich metadata for the current song
        if (updatedSong.file) {
            (async () => {
                try {
                    const { parseBlob } = await import('music-metadata-browser');
                    const meta = await parseBlob(updatedSong.file);
                    const updates = {};
                    if (meta?.common?.title) updates.title = meta.common.title;
                    if (meta?.common?.artist) updates.artist = meta.common.artist;
                    if (meta?.common?.album) updates.album = meta.common.album;
                    if (typeof meta?.format?.duration === 'number') updates.duration = meta.format.duration;
                    const p = meta?.common?.picture?.[0];
                    if (p?.data) {
                        const blob = new Blob([p.data], { type: p.format || 'image/jpeg' });
                        updates.coverUrl = URL.createObjectURL(blob);
                    }
                    if (Object.keys(updates).length) {
                        setPlayerState(prev => ({
                            ...prev,
                            currentSong: prev.currentSong && prev.currentSong.id === updatedSong.id ? { ...prev.currentSong, ...updates } : prev.currentSong,
                            songList: prev.songList.map(s => s.id === updatedSong.id ? { ...s, ...updates } : s)
                        }));
                    }
                } catch {}
            })();
        }

        // Persist play count
        incrementPlayCount(updatedSong.id);
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

    // --- UI Structure ---
    return (
        <Router>
            <div className="player-layout">
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
                        <Route path="/" element={<Header loadFiles={loadFiles} onShufflePlay={shuffleAndPlay} />} />
                        <Route path="/library" element={<Header loadFiles={loadFiles} onShufflePlay={shuffleAndPlay} />} />
                        <Route path="/liked" element={<h2 className='header-placeholder'>Liked Songs</h2>} />
                        <Route path="/queue" element={<h2 className='header-placeholder'>Queue</h2>} />
                        <Route path="/playlists" element={
                            selectedPlaylist ? 
                                <h2 className='header-placeholder'>{selectedPlaylist.name}</h2> : 
                                <h2 className='header-placeholder'>Playlists</h2>
                        } />
                        <Route path="/settings" element={<h2 className='header-placeholder'>Settings</h2>} />
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
                />
            </div>
           
        </Router>
    );
}

export default App;