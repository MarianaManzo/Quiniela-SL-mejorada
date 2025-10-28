importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB4fCVOyxAWBKuKE9VtGsdcq-Ay_gRRThc',
  authDomain: 'somos-locales-femx.firebaseapp.com',
  projectId: 'somos-locales-femx',
  storageBucket: 'somos-locales-femx.firebasestorage.app',
  messagingSenderId: '923976377151',
  appId: '1:923976377151:web:a5e3dc2fc644a53b6ea98a',
});

const messaging = firebase.messaging();
const DEFAULT_NOTIFICATION_TAG = "somos-locales-alert";

if (messaging?.onBackgroundMessage) {
  messaging.onBackgroundMessage((payload) => {
    const notification = payload?.notification ?? {};
    const data = payload?.data ?? {};

    const notificationTitle = notification.title || data.title || "Somos Locales FEMx";

    const defaultIcon = "/icons/icon-192.png";
    const defaultBadge = "/icons/notification-small.png";
    const resolvedTag = notification.tag || data.tag || DEFAULT_NOTIFICATION_TAG;

    const notificationData = {
      ...data,
      url: data.url || notification.click_action || "/",
      origin: "somos-locales",
      tag: resolvedTag,
    };

    const options = {
      body: notification.body || data.body || "Tienes una actualización en la quiniela.",
      icon: notification.icon || data.icon || defaultIcon,
      badge: notification.badge || data.badge || defaultBadge,
      tag: resolvedTag,
      renotify: data.renotify === "true",
      data: notificationData,
      vibrate: [200, 100, 200],
    };

    const showNotification = async () => {
      const existing = await self.registration.getNotifications();
      existing.forEach((item) => {
        if (item.data?.origin !== "somos-locales") {
          item.close();
        }
      });

      await self.registration.showNotification(notificationTitle, options);
    };

    showNotification().catch((error) => {
      console.warn("No se pudo mostrar la notificación personalizada", error);
    });
  });
}

const handleNotificationClick = (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            const url = new URL(client.url);
            if (url.pathname === targetUrl || targetUrl === '/') {
              return client.focus();
            }
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return null;
      })
  );
};

self.addEventListener('notificationclick', handleNotificationClick);

const CACHE_VERSION = 'v29';
const STATIC_CACHE = `somos-locales-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `somos-locales-runtime-${CACHE_VERSION}`;

const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const isLocalhost = ['localhost', '127.0.0.1'].includes(self.location.hostname);

const DEV_OFFLINE_URLS = isLocalhost
  ? [
      '/src/main.tsx',
      '/src/App.tsx',
      '/src/imports/AperturaJornada15.tsx',
      '/src/index.css',
      '/@vite/client',
      '/@react-refresh',
      '/client',
      '/pwa-install.js',
    ]
  : [];

const STATIC_ASSET_DESTINATIONS = ['style', 'script', 'font', 'image'];
const STATIC_ASSET_EXTENSIONS = [
  '.js',
  '.mjs',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.ico',
  '.json',
  '.ts',
  '.tsx',
];

const isStaticAsset = (request, url) => {
  if (STATIC_ASSET_DESTINATIONS.includes(request.destination)) {
    return true;
  }

  return (
    STATIC_ASSET_EXTENSIONS.some((extension) => url.pathname.endsWith(extension)) ||
    url.pathname.startsWith('/assets/')
  );
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([...OFFLINE_URLS, ...DEV_OFFLINE_URLS]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => ![STATIC_CACHE, RUNTIME_CACHE].includes(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

const cacheFirst = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }

  return response;
};

const networkFirst = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === 'navigate') {
      const offlineFallback = await caches.match('/index.html');
      if (offlineFallback) {
        return offlineFallback;
      }
    }

    throw error;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
