// src/utils/audioStorage.js
import { openDB } from 'idb';

const DB_NAME = 'ElaraMusicDB';        // Name of our database
const STORE_NAME = 'songs';            // Like a "table" in the database

// Initialize database (creates it if doesn't exist)
export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Create the "songs" store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// Save one song to database
export async function saveSong(song) {
  const db = await initDB();
  await db.put(STORE_NAME, song);      // "put" = save/update
}

// Get all songs from database
export async function getAllSongs() {
  const db = await initDB();
  return db.getAll(STORE_NAME);        // Returns array of all songs
}

// Delete one song by ID
export async function deleteSong(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

// Delete all songs
export async function clearAllSongs() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}