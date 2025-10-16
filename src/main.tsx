
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
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => console.error('No se pudo registrar el Service Worker', error));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
