import { useState, useEffect, useCallback } from 'react';
import * as db from '../db';
import { streamUrlFor } from '../api/client';

export function useDownload() {
    const [downloadingIds, setDownloadingIds] = useState(new Set());
    const [downloadedIds, setDownloadedIds] = useState(new Set());

    // Load initial download status
    useEffect(() => {
        async function loadStatus() {
            const dbInstance = await (await import('idb')).openDB('elara-db', 3);
            const allKeys = await dbInstance.getAllKeys('audio_data');
            setDownloadedIds(new Set(allKeys));
        }
        loadStatus();
    }, []);

    const downloadSong = useCallback(async (song) => {
        if (downloadedIds.has(song.id) || downloadingIds.has(song.id)) return;

        setDownloadingIds(prev => new Set(prev).add(song.id));

        try {
            let blob;
            // If it's a data URL (local file), convert to blob
            if (song.url.startsWith('data:')) {
                const response = await fetch(song.url);
                blob = await response.blob();
            } else {
                // Fetch from streaming URL
                const url = song.url || streamUrlFor(song.id);
                const response = await fetch(url);
                if (!response.ok) throw new Error('Download failed');
                blob = await response.blob();
            }

            await db.saveAudio(song.id, blob);
            setDownloadedIds(prev => new Set(prev).add(song.id));
        } catch (error) {
            console.error('Error downloading song:', error);
            alert(`Failed to download ${song.title}`);
        } finally {
            setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(song.id);
                return next;
            });
        }
    }, [downloadedIds, downloadingIds]);

    const removeDownload = useCallback(async (songId) => {
        try {
            await db.deleteAudio(songId);
            setDownloadedIds(prev => {
                const next = new Set(prev);
                next.delete(songId);
                return next;
            });
        } catch (error) {
            console.error('Error removing download:', error);
        }
    }, []);

    return {
        downloadingIds,
        downloadedIds,
        downloadSong,
        removeDownload,
        isDownloaded: (id) => downloadedIds.has(id),
        isDownloading: (id) => downloadingIds.has(id),
    };
}
