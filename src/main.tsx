
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './firebase';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => console.error('No se pudo registrar el Service Worker', error));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
