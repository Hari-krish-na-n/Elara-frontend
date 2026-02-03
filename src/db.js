// src/db.js
import { openDB } from 'idb';

const DB_NAME = 'elara-db';
const DB_VERSION = 3;
const STORE_SONGS = 'songs';
const STORE_PLAYLISTS = 'playlists';
const STORE_LIKED = 'likedSongs';
const STORE_AUDIO = 'audio_data';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion) {
    if (!db.objectStoreNames.contains(STORE_SONGS)) {
      db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
      db.createObjectStore(STORE_PLAYLISTS, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORE_LIKED)) {
      db.createObjectStore(STORE_LIKED, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(STORE_AUDIO)) {
      db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
    }
  }
});

// ===== SONGS =====
export async function getSongs() {
  const db = await dbPromise;
  return db.getAll(STORE_SONGS);
}

export async function saveSongs(songs) {
  if (!songs || songs.length === 0) return;
  const db = await dbPromise;
  const tx = db.transaction(STORE_SONGS, 'readwrite');
  for (const s of songs) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function saveSong(song) {
  const db = await dbPromise;
  await db.put(STORE_SONGS, song);
}

export async function getAllSongs() {
  return getSongs();
}

export async function clearAllSongs() {
  const db = await dbPromise;
  await db.clear(STORE_SONGS);
}

export async function updateSong(song) {
  const db = await dbPromise;
  await db.put(STORE_SONGS, song);
}

export async function clearSongs() {
  return clearAllSongs();
}

// ===== PLAYLISTS =====
export async function getPlaylists() {
  const db = await dbPromise;
  return db.getAll(STORE_PLAYLISTS);
}

export async function savePlaylists(playlists) {
  const db = await dbPromise;
  const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
  await tx.store.clear();
  if (playlists && playlists.length > 0) {
    for (const p of playlists) {
      await tx.store.put(p);
    }
  }
  await tx.done;
}

// ===== LIKED SONGS =====
export async function getLikedSongs() {
  const db = await dbPromise;
  return db.getAll(STORE_LIKED);
}

export async function saveLikedSongs(likedSongs) {
  if (!likedSongs || likedSongs.length === 0) return;
  const db = await dbPromise;
  const tx = db.transaction(STORE_LIKED, 'readwrite');
  await tx.store.clear();
  for (const s of likedSongs) {
    await tx.store.put(s);
  }
  await tx.done;
}

// ===== AUDIO DATA =====
export async function saveAudio(songId, blob) {
  const db = await dbPromise;
  await db.put(STORE_AUDIO, { id: songId, data: blob, timestamp: Date.now() });
}

export async function getAudio(songId) {
  const db = await dbPromise;
  const item = await db.get(STORE_AUDIO, songId);
  return item ? item.data : null;
}

export async function deleteAudio(songId) {
  const db = await dbPromise;
  await db.delete(STORE_AUDIO, songId);
}

export async function isAudioCached(songId) {
  const db = await dbPromise;
  const count = await db.count(STORE_AUDIO, songId);
  return count > 0;
}