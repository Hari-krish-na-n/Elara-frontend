export function register(config) {
  if ('serviceWorker' in navigator) {
    const swUrl = '/sw.js'; // Updated to use the new sw.js

    const onReady = () => {
      console.log('[SW Registration] Attempting to register Service Worker...');
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[SW Registration] Service Worker registered successfully:', registration.scope);

          if (config && config.onSuccess) config.onSuccess(registration);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[SW Registration] New content is available; please refresh.');
                  if (config && config.onUpdate) config.onUpdate(registration);
                } else {
                  console.log('[SW Registration] Content is cached for offline use.');
                  if (config && config.onSuccess) config.onSuccess(registration);
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('[SW Registration] Error during service worker registration:', error);
        });
    };

    if (document.readyState === 'complete') {
      onReady();
    } else {
      window.addEventListener('load', onReady);
    }
  } else {
    console.warn('[SW Registration] Service Worker is not supported in this browser.');
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch(() => { });
  }
}
