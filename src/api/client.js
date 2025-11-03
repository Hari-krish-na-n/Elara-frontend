// src/api/client.js
const baseUrl = (import.meta.env.VITE_API_URL || 'https://elara-backend-up86.onrender.com').replace(/\/$/, '');



export async function fetchPlayCounts() {
  try {
    const res = await fetch(`${baseUrl}/api/plays`);
    if (!res.ok) throw new Error('Failed plays');
    return await res.json();
  } catch (e) {
    console.warn('fetchPlayCounts failed', e);
    return {};
  }
}

export async function incrementPlayCount(id) {
  try {
    await fetch(`${baseUrl}/api/plays/${encodeURIComponent(id)}`, {
      method: 'POST'
    });
  } catch (e) {
    console.warn('incrementPlayCount failed', e);
  }
}

export async function extractMetadata(file) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${baseUrl}/api/metadata`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('metadata error');
    const data = await res.json();
    // If backend gave relative coverUrl, make absolute
    if (data.coverUrl && data.coverUrl.startsWith('/')) {
      data.coverUrl = `${baseUrl}${data.coverUrl}`;
    }
    return data;
  } catch (e) {
    console.warn('extractMetadata failed', e);
    return null;
  }
}
