// src/hooks/useLibrary.js
import { useState, useEffect, useCallback } from 'react';
import { extractMP3Metadata, fileToDataURL, parseFilenameToMetadata, getAlbumArtURL, bufferToBase64 } from '../utils/audioUtils';
import * as db from '../db';

export const useLibrary = () => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [metadataCache, setMetadataCache] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'title', direction: 'asc' });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load saved data from IndexedDB
  useEffect(() => {
    async function loadFromDB() {
      try {
        const savedSongs = await db.getSongs();
        const savedLiked = await db.getLikedSongs();

        if (savedSongs && savedSongs.length > 0) {
          // Check for expired blob URLs
          const processedSongs = await Promise.all(savedSongs.map(async (song) => {
            if (song.url && song.url.startsWith('blob:')) {
              const isCached = await db.isAudioCached(song.id);
              if (!isCached) {
                return {
                  ...song,
                  playable: false,
                  needsImport: true,
                  url: null // Clear expired URL
                };
              } else {
                // Restore Blob URL from IndexedDB
                try {
                  const blob = await db.getAudio(song.id);
                  if (blob) {
                    const newUrl = URL.createObjectURL(blob);
                    return {
                      ...song,
                      url: newUrl,
                      playable: true,
                      needsImport: false
                    };
                  }
                } catch (err) {
                  console.error('Failed to restore audio blob for song:', song.id, err);
                }
              }
            }
            return song;
          }));

          const pruned = processedSongs.filter(s => s.playable !== false && s.needsImport !== true);
          setSongs(pruned);
          setFilteredSongs(pruned);
          console.log(`Loaded ${pruned.length} songs from IndexedDB`);
        } else {
          // Fallback to localStorage if exists (migration)
          const legacySongs = localStorage.getItem('songsWithMetadata');
          if (legacySongs) {
            const parsed = JSON.parse(legacySongs);
            setSongs(parsed);
            setFilteredSongs(parsed);
            db.saveSongs(parsed);
          } else {
            // No saved songs, library is empty
            setSongs([]);
            setFilteredSongs([]);
          }
        }

        if (savedLiked && savedLiked.length > 0) {
          setLikedSongs(new Set(savedLiked.map(s => s.id)));
        } else {
          const legacyLiked = localStorage.getItem('likedSongs');
          if (legacyLiked) {
            const parsed = JSON.parse(legacyLiked);
            setLikedSongs(new Set(parsed));
          }
        }
      } catch (error) {
        console.error('Error loading library data from IndexedDB:', error);
      }
    }
    loadFromDB();
  }, []);

  // Save songs to IndexedDB
  useEffect(() => {
    if (songs.length > 0) {
      db.saveSongs(songs);
    }
  }, [songs]);

  // Save liked songs to IndexedDB
  useEffect(() => {
    const list = songs
      .filter(s => likedSongs.has(s.id))
      .map(s => ({ id: s.id })); // Store only ID or full song? db.js expects full song?

    // The current db.js STORE_LIKED uses keyPath 'id'.
    // Let's store full objects if possible or just IDs.
    // In useLibrary, likedSongs is a Set of IDs.
    db.saveLikedSongs(songs.filter(s => likedSongs.has(s.id)));
  }, [likedSongs, songs]);

  // Load files with metadata
  const loadFiles = useCallback(async (files) => {
    const audioFiles = Array.from(files).filter(file =>
      file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
      // Alert removed
      return;
    }

    setIsLoading(true);
    console.log(`Loading ${audioFiles.length} files...`);

    try {
      const loadPromises = audioFiles.map(async (file, index) => {
        try {
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;

          if (metadataCache.has(fileId)) {
            return metadataCache.get(fileId);
          }

          const dataURL = await fileToDataURL(file);

          return new Promise(async (resolve) => {
            const audio = new Audio();

            const handleLoad = async () => {
              try {
                const baseMeta = parseFilenameToMetadata(file.name);
                const song = {
                  id: `song-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                  title: baseMeta.title,
                  artist: baseMeta.artist,
                  album: 'Unknown Album',
                  duration: audio.duration || 0,
                  url: dataURL,
                  plays: 0,
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  lastModified: file.lastModified,
                  addedAt: new Date().toISOString(),
                  playable: true
                };

                const metadata = await extractMP3Metadata(file);
                if (metadata) {
                  Object.assign(song, {
                    title: metadata.title || song.title,
                    artist: metadata.artist || song.artist,
                    album: metadata.album || song.album,
                    duration: metadata.duration || song.duration,
                    genre: metadata.genre || song.genre,
                    year: metadata.year || song.year
                  });
                  if (metadata.picture) {
                    const pic = { data: bufferToBase64(metadata.picture.data), format: metadata.picture.format };
                    if (pic.data) {
                      song.picture = pic;
                      const artUrl = getAlbumArtURL(pic);
                      if (artUrl) song.coverUrl = artUrl;
                    }
                  }
                }

                setMetadataCache(prev => new Map(prev).set(fileId, song));
                resolve(song);
              } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                resolve(null);
              }
            };

            audio.addEventListener('loadedmetadata', handleLoad);
            audio.addEventListener('error', () => resolve(null));

            setTimeout(() => {
              if (audio.readyState === 0) resolve(null);
            }, 10000);

            audio.src = dataURL;
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          return null;
        }
      });

      const batchSize = 5;
      const newSongs = [];

      for (let i = 0; i < loadPromises.length; i += batchSize) {
        const batch = loadPromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        newSongs.push(...batchResults.filter(song => song !== null));
      }

      if (newSongs.length === 0) {
        alert('Failed to load any audio files.');
        return;
      }

      const existingFileIds = new Set(songs.map(s =>
        `${s.fileName}-${s.fileSize}-${s.lastModified}`
      ));

      const uniqueNewSongs = newSongs.filter(song =>
        !existingFileIds.has(`${song.fileName}-${song.fileSize}-${song.lastModified}`)
      );

      if (uniqueNewSongs.length === 0) {
        alert('All selected files are already in your library.');
        return;
      }

      const updatedSongs = [...songs, ...uniqueNewSongs];
      setSongs(updatedSongs);
      setFilteredSongs(updatedSongs);
      alert(`Successfully added ${uniqueNewSongs.length} new songs!`);

    } catch (error) {
      console.error('Error loading files:', error);
      alert('An error occurred while loading files.');
    } finally {
      setIsLoading(false);
    }
  }, [songs, metadataCache]);

  // Filter and Sort Effect
  useEffect(() => {
    let result = songs.filter(s => s.playable !== false && s.needsImport !== true);

    // 1. Filter
    if (debouncedSearchQuery.trim()) {
      const queryLower = debouncedSearchQuery.trim().toLowerCase();
      result = result.filter(song =>
        (song.title && song.title.toLowerCase().includes(queryLower)) ||
        (song.artist && song.artist.toLowerCase().includes(queryLower)) ||
        (song.album && song.album.toLowerCase().includes(queryLower)) ||
        (song.fileName && song.fileName.toLowerCase().includes(queryLower)) ||
        (song.genre && song.genre.toLowerCase().includes(queryLower))
      );
    }

    // 2. Sort
    const { field, direction } = sortConfig;
    if (field) {
      result.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];

        if (field === 'duration' || field === 'plays') {
          aVal = aVal || 0;
          bVal = bVal || 0;
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();

        if (direction === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    }

    setFilteredSongs(result);
  }, [songs, debouncedSearchQuery, sortConfig]);

  // Search songs
  const searchSongs = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Sort songs
  const sortSongs = useCallback((field, direction) => {
    setSortConfig({ field, direction });
  }, []);

  // Toggle like
  const toggleLike = useCallback((song) => {
    setLikedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(song.id)) {
        newSet.delete(song.id);
      } else {
        newSet.add(song.id);
      }
      return newSet;
    });
  }, []);

  // Increment play count
  const incrementPlayCount = useCallback((songId) => {
    setSongs(prev => prev.map(song =>
      song.id === songId ? { ...song, plays: (song.plays || 0) + 1 } : song
    ));

    setFilteredSongs(prev => prev.map(song =>
      song.id === songId ? { ...song, plays: (song.plays || 0) + 1 } : song
    ));
  }, []);

  // Delete song
  const deleteSong = useCallback((songId) => {
    const song = songs.find(s => s.id === songId);
    if (song && !confirm(`Delete "${song.title}"? This cannot be undone.`)) {
      return false;
    }

    setSongs(prev => prev.filter(s => s.id !== songId));
    setFilteredSongs(prev => prev.filter(s => s.id !== songId));
    setLikedSongs(prev => {
      const newSet = new Set(prev);
      newSet.delete(songId);
      return newSet;
    });

    return true;
  }, [songs]);

  // Delete multiple songs
  const deleteMultipleSongs = useCallback((songIds) => {
    if (!confirm(`Delete ${songIds.length} songs? This cannot be undone.`)) {
      return false;
    }

    setSongs(prev => prev.filter(s => !songIds.includes(s.id)));
    setFilteredSongs(prev => prev.filter(s => !songIds.includes(s.id)));
    setLikedSongs(prev => {
      const newSet = new Set(prev);
      songIds.forEach(id => newSet.delete(id));
      return newSet;
    });

    return true;
  }, []);

  // Get library statistics
  const getLibraryStats = useCallback(() => {
    const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    const totalPlays = songs.reduce((sum, song) => sum + (song.plays || 0), 0);
    const artists = new Set(songs.map(s => s.artist));
    const albums = new Set(songs.map(s => s.album));
    const genres = new Set(songs.filter(s => s.genre).map(s => s.genre));

    return {
      totalSongs: songs.length,
      totalDuration,
      totalPlays,
      totalLiked: likedSongs.size,
      uniqueArtists: artists.size,
      uniqueAlbums: albums.size,
      uniqueGenres: genres.size,
      avgSongDuration: songs.length > 0 ? totalDuration / songs.length : 0,
    };
  }, [songs, likedSongs]);

  // Get songs by artist
  const getSongsByArtist = useCallback((artist) => {
    return songs.filter(song => song.artist === artist);
  }, [songs]);

  // Get songs by album
  const getSongsByAlbum = useCallback((album) => {
    return songs.filter(song => song.album === album);
  }, [songs]);

  // Get songs by genre
  const getSongsByGenre = useCallback((genre) => {
    return songs.filter(song => song.genre === genre);
  }, [songs]);

  const likedSongsList = songs.filter(song => likedSongs.has(song.id));

  return {
    songs,
    filteredSongs,
    likedSongs,
    likedSongsList,
    isLoading,
    searchQuery,
    sortConfig,
    loadFiles,
    searchSongs,
    sortSongs,
    toggleLike,
    isSongLiked: (songId) => likedSongs.has(songId),
    incrementPlayCount,
    deleteSong,
    deleteMultipleSongs,
    getLibraryStats,
    getSongsByArtist,
    getSongsByAlbum,
    getSongsByGenre,
  };
};  
