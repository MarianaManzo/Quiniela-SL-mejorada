
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './firebase';
import { INLINE_FONT_CSS } from './styles/fonts-inline.css';

if (typeof document !== 'undefined') {
  const existing = document.getElementById('inline-fonts');
  if (!existing) {
    const styleTag = document.createElement('style');
    styleTag.id = 'inline-fonts';
    styleTag.textContent = INLINE_FONT_CSS;
    document.head.appendChild(styleTag);
  }
}
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => console.error('No se pudo registrar el Service Worker', error));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }
}

createRoot(document.getElementById('root')!).render(<App />);
