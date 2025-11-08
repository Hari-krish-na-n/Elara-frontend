// src/api/client.js
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function fetchTracks(params = {}) {
  const qs = new URLSearchParams({ abs: '1', ...params }).toString();
  const res = await fetch(`${API_URL}/api/tracks?${qs}`);
  if (!res.ok) throw new Error('tracks_fetch_failed');
  const { items } = await res.json();
  return items || [];
}

export async function fetchPlayCounts() {
  try {
    const res = await fetch(`${API_URL}/api/plays`);
    if (!res.ok) throw new Error('Failed plays');
    return await res.json();
  } catch (e) {
    console.warn('fetchPlayCounts failed', e);
    return {};
  }
}

export async function incrementPlayCount(id) {
  try {
    await fetch(`${API_URL}/api/plays/${encodeURIComponent(id)}`, { method: 'POST' });
  } catch (e) {
    console.warn('incrementPlayCount failed', e);
  }
}

export function streamUrlFor(id) {
  return `${API_URL}/api/stream/${encodeURIComponent(id)}`;
}

// Optional: upload a single file to extract metadata via backend
export async function extractMetadata(file) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_URL}/api/metadata`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('metadata error');
    const data = await res.json();
    if (data.coverUrl && data.coverUrl.startsWith('/')) data.coverUrl = `${API_URL}${data.coverUrl}`;
    return data;
  } catch (e) {
    console.warn('extractMetadata failed', e);
    return null;
  }
}

// Optional: scan absolute paths (Electron only) to get metadata for local files
export async function scanPaths(paths) {
  try {
    const res = await fetch(`${API_URL}/api/scan-paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths })
    });
    if (!res.ok) throw new Error('scan error');
    const data = await res.json();
    const items = (data.items || []).map(it => ({
      ...it,
      coverUrl: it.coverUrl && it.coverUrl.startsWith('/') ? `${API_URL}${it.coverUrl}` : it.coverUrl
    }));
    return items;
  } catch (e) {
    console.warn('scanPaths failed', e);
    return [];
  }
}
