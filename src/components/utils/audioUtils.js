// src/utils/audioUtils.js
import * as mm from 'music-metadata-browser';

/**
 * Extract metadata from an MP3 file
 * @param {File} file - The audio file to extract metadata from
 * @returns {Promise<Object>} Metadata object containing title, artist, album, and duration
 */
export const extractMP3Metadata = async (file) => {
  try {
    const metadata = await mm.parseBlob(file);
    return {
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration || 0,
      genre: metadata.common.genre?.[0] || 'Unknown',
      year: metadata.common.year || null,
      picture: metadata.common.picture?.[0] || null,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Fallback metadata if extraction fails
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      genre: 'Unknown',
      year: null,
      picture: null,
    };
  }
};

/**
 * Convert a file to a Data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Data URL representation of the file
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Sanitize a filename by removing special characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .toLowerCase()
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get album art URL from metadata picture
 * @param {Object} picture - Picture object from metadata
 * @returns {string|null} URL or null if no picture
 */
export const getAlbumArtURL = (picture) => {
  if (!picture) return null;
  try {
    const blob = new Blob([picture.data], { type: picture.format });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating album art URL:', error);
    return null;
  }
};

/**
 * Validate if file is an audio file
 * @param {File} file - File to validate
 * @returns {boolean} True if file is audio
 */
export const isAudioFile = (file) => {
  const audioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/m4a',
    'audio/aac',
  ];
  return audioTypes.includes(file.type) || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name);
};

/**
 * Create a unique ID for a song
 * @param {string} filename - Original filename
 * @param {number} timestamp - Optional timestamp
 * @returns {string} Unique ID
 */
export const createSongId = (filename, timestamp = Date.now()) => {
  const sanitized = sanitizeFilename(filename);
  return `${sanitized}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
};