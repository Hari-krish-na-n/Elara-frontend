// src/hooks/usePlaylist.js
import { useState, useEffect, useCallback } from 'react';

export const usePlaylist = (songs = []) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // Load saved playlists
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem('playlists');
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists));
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }, []);

  // Save playlists
  useEffect(() => {
    try {
      localStorage.setItem('playlists', JSON.stringify(playlists));
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  }, [playlists]);

  // Create new playlist
  const createPlaylist = useCallback((name, description = '') => {
    if (!name || !name.trim()) {
      // Alert removed
      return null;
    }

    const newPlaylist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      songs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coverUrl: null,
      isPublic: false,
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    console.log(`Created playlist: "${name}"`);
    return newPlaylist;
  }, []);

  // Add song to playlist
  const addSongToPlaylist = useCallback((songId, playlistId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) {
      console.error('Song not found:', songId);
      // Alert removed
      return false;
    }

    let success = false;
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const songExists = playlist.songs.some(s => s.id === songId);
        if (songExists) {
          console.log(`Song already in playlist`);
          // Alert removed
          return playlist;
        }
        
        success = true;
        console.log(`Added "${song.title}" to playlist "${playlist.name}"`);
        // Alert removed
        
        return { 
          ...playlist, 
          songs: [...playlist.songs, song],
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    }));

    return success;
  }, [songs]);

  // Add multiple songs to playlist
  const addMultipleSongsToPlaylist = useCallback((songIds, playlistId) => {
    const songsToAdd = songs.filter(s => songIds.includes(s.id));
    if (songsToAdd.length === 0) return false;

    let addedCount = 0;
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const newSongs = songsToAdd.filter(song => 
          !playlist.songs.some(s => s.id === song.id)
        );
        
        addedCount = newSongs.length;
        if (addedCount > 0) {
          // Alert removed
          return {
            ...playlist,
            songs: [...playlist.songs, ...newSongs],
            updatedAt: new Date().toISOString()
          };
        }
      }
      return playlist;
    }));

    return addedCount > 0;
  }, [songs]);

  // New API: addToPlaylist (single or multiple IDs)
  const addToPlaylist = useCallback((playlistId, ids) => {
    const idsArr = Array.isArray(ids) ? ids : [ids];
    return addMultipleSongsToPlaylist(idsArr, playlistId);
  }, [addMultipleSongsToPlaylist]);

  // Remove song from playlist
  const removeSongFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => s.id !== songId),
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    }));
  }, []);

  // New API: removeFromPlaylist (single or multiple IDs)
  const removeFromPlaylist = useCallback((playlistId, ids) => {
    const idsSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(s => !idsSet.has(s.id)),
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    }));
  }, []);

  // Update playlist details
  const updatePlaylist = useCallback((playlistId, updates) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    }));
  }, []);

  // New API: set playlist details (name/description/public)
  const setPlaylistDetails = useCallback((playlistId, { name, description, isPublic }) => {
    const payload = {};
    if (typeof name === 'string') payload.name = name.trim() || 'Untitled';
    if (typeof description === 'string') payload.description = description.trim();
    if (typeof isPublic === 'boolean') payload.isPublic = isPublic;
    updatePlaylist(playlistId, payload);
  }, [updatePlaylist]);

  // New API: set playlist cover
  const setPlaylistCover = useCallback((playlistId, coverUrl) => {
    updatePlaylist(playlistId, { coverUrl });
  }, [updatePlaylist]);

  // Delete playlist
  const deletePlaylist = useCallback((playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && !confirm(`Delete "${playlist.name}"? This cannot be undone.`)) {
      return false;
    }

    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
    console.log('Playlist deleted');
    return true;
  }, [playlists, selectedPlaylist]);

  // Duplicate playlist
  const duplicatePlaylist = useCallback((playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return null;

    const newPlaylist = {
      ...playlist,
      id: `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${playlist.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  }, [playlists]);

  // Reorder songs in playlist
  const reorderPlaylistSongs = useCallback((playlistId, fromIndex, toIndex) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const newSongs = [...playlist.songs];
        const [removed] = newSongs.splice(fromIndex, 1);
        newSongs.splice(toIndex, 0, removed);
        
        return {
          ...playlist,
          songs: newSongs,
          updatedAt: new Date().toISOString()
        };
      }
      return playlist;
    }));
  }, []);

  // Get playlist statistics
  const getPlaylistStats = useCallback((playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return null;

    const totalDuration = playlist.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    const totalPlays = playlist.songs.reduce((sum, song) => sum + (song.plays || 0), 0);
    const artists = new Set(playlist.songs.map(s => s.artist));

    return {
      songCount: playlist.songs.length,
      totalDuration,
      totalPlays,
      uniqueArtists: artists.size,
      avgSongDuration: playlist.songs.length > 0 ? totalDuration / playlist.songs.length : 0
    };
  }, [playlists]);

  // Search within playlist
  const searchPlaylist = useCallback((playlistId, query) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return [];

    const searchLower = query.toLowerCase();
    return playlist.songs.filter(song =>
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.album.toLowerCase().includes(searchLower)
    );
  }, [playlists]);

  // Export playlist (as JSON)
  const exportPlaylist = useCallback((playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return null;

    const exportData = {
      name: playlist.name,
      description: playlist.description,
      songs: playlist.songs.map(song => ({
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration
      })),
      createdAt: playlist.createdAt,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }, [playlists]);

  // Merge playlists (append unique songs from source into target)
  const mergePlaylists = useCallback((sourceId, targetId) => {
    if (sourceId === targetId) return false;
    const source = playlists.find(p => p.id === sourceId);
    const target = playlists.find(p => p.id === targetId);
    if (!source || !target) return false;
    const targetIds = new Set(target.songs.map(s => s.id));
    const toAdd = source.songs.filter(s => !targetIds.has(s.id));
    if (toAdd.length === 0) return false;
    setPlaylists(prev => prev.map(p => {
      if (p.id === targetId) {
        return { ...p, songs: [...p.songs, ...toAdd], updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    return true;
  }, [playlists]);

  // Remove duplicate songs within a playlist
  const dedupePlaylistSongs = useCallback((playlistId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const seen = new Set();
        const unique = [];
        for (const s of p.songs) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            unique.push(s);
          }
        }
        return { ...p, songs: unique, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  }, []);

  // New API: normalizePlaylist (currently dedupe)
  const normalizePlaylist = useCallback((playlistId) => {
    dedupePlaylistSongs(playlistId);
  }, [dedupePlaylistSongs]);

  // Shuffle songs within a playlist
  const shufflePlaylistSongs = useCallback((playlistId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const arr = [...p.songs];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return { ...p, songs: arr, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  }, []);

  // New API: shufflePlaylist
  const shufflePlaylist = useCallback((playlistId) => {
    shufflePlaylistSongs(playlistId);
  }, [shufflePlaylistSongs]);

  // Sort songs in a playlist
  const sortPlaylistSongs = useCallback((playlistId, field = 'title', direction = 'asc') => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const arr = [...p.songs];
        arr.sort((a, b) => {
          let av = a[field] ?? '';
          let bv = b[field] ?? '';
          if (typeof av === 'string') av = av.toLowerCase();
          if (typeof bv === 'string') bv = bv.toLowerCase();
          const cmp = av > bv ? 1 : av < bv ? -1 : 0;
          return direction === 'desc' ? -cmp : cmp;
        });
        return { ...p, songs: arr, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  }, []);

  // New API: sortPlaylist
  const sortPlaylist = useCallback((playlistId, field = 'title', direction = 'asc') => {
    sortPlaylistSongs(playlistId, field, direction);
  }, [sortPlaylistSongs]);

  // Sort playlists list
  const sortPlaylists = useCallback((field = 'name', direction = 'asc') => {
    setPlaylists(prev => {
      const arr = [...prev];
      arr.sort((a, b) => {
        let av = field === 'songCount' ? a.songs.length : a[field] ?? '';
        let bv = field === 'songCount' ? b.songs.length : b[field] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return direction === 'desc' ? -cmp : cmp;
      });
      return arr;
    });
  }, []);

  // New API: sortAllPlaylists
  const sortAllPlaylists = useCallback((field = 'name', direction = 'asc') => {
    sortPlaylists(field, direction);
  }, [sortPlaylists]);

  // Import playlist from JSON string
  const importPlaylistFromJSON = useCallback((jsonText) => {
    if (!jsonText) return null;
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch {
      return null;
    }
    const name = (data.name || `Imported ${new Date().toLocaleDateString()}`).trim();
    const description = (data.description || '').trim();
    const created = createPlaylist(name, description);
    if (!created) return null;
    const wanted = Array.isArray(data.songs) ? data.songs : [];
    const songIds = [];
    for (const w of wanted) {
      const match = songs.find(s =>
        (s.title || '').toLowerCase() === (w.title || '').toLowerCase() &&
        (s.artist || '').toLowerCase() === (w.artist || '').toLowerCase()
      );
      if (match) songIds.push(match.id);
    }
    addMultipleSongsToPlaylist(songIds, created.id);
    return created;
  }, [songs, createPlaylist, addMultipleSongsToPlaylist]);

  // New API: importPlaylist
  const importPlaylist = useCallback((jsonText) => {
    return importPlaylistFromJSON(jsonText);
  }, [importPlaylistFromJSON]);

  return {
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    createPlaylist,
    // New API
    addToPlaylist,
    removeFromPlaylist,
    setPlaylistDetails,
    setPlaylistCover,
    normalizePlaylist,
    shufflePlaylist,
    sortPlaylist,
    sortAllPlaylists,
    importPlaylist,
    // Backwards compatibility
    addSongToPlaylist,
    addMultipleSongsToPlaylist,
    removeSongFromPlaylist,
    updatePlaylist,
    deletePlaylist,
    duplicatePlaylist,
    reorderPlaylistSongs,
    getPlaylistStats,
    searchPlaylist,
    exportPlaylist,
    mergePlaylists,
    dedupePlaylistSongs,
    shufflePlaylistSongs,
    sortPlaylistSongs,
    sortPlaylists,
    importPlaylistFromJSON,
  };
};
