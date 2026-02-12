import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

serviceWorkerRegistration.register({
  onSuccess: () => console.log('[PWA] Service Worker ready: offline enabled'),
  onUpdate: (registration) => {
    console.log('[PWA] Update available for Service Worker');
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  },
});

