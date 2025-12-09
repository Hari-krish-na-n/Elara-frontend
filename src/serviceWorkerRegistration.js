export function register(config) {
  if ('serviceWorker' in navigator) {
    const swUrl = '/service-worker.js';
    const onReady = () => {
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          if (config && config.onSuccess) config.onSuccess(registration);
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  if (config && config.onUpdate) config.onUpdate(registration);
                } else {
                  if (config && config.onSuccess) config.onSuccess(registration);
                }
              }
            };
          };
        })
        .catch(() => {});
    };
    if (document.readyState === 'complete') onReady();
    else window.addEventListener('load', onReady);
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch(() => {});
  }
}
