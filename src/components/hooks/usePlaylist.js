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

  return {
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
    searchPlaylist,
    exportPlaylist,
  };
};
