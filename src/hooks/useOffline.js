import { useState, useEffect } from 'react';

export function useOffline() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((granted) => {
                console.log('[Offline] Persistent storage', granted ? 'granted' : 'not granted');
            }).catch(() => {});
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOffline;
}
