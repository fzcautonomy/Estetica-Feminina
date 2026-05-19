/* ============================================================
   STUDIO BELLA — sw.js (Service Worker)
   Cache-first para assets estáticos, network-first para HTML
   PERSONALIZE: Atualize CACHE_VERSION ao modificar o site
============================================================ */

const CACHE_VERSION = 'bella-v1.0';
const CACHE_STATIC  = 'bella-static-v1';

/* Assets para pré-cache */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/animations.css',
  '/js/main.js',
  '/js/agendamento.js',
  '/js/portfolio.js',
  '/manifest.json',
];

/* ── Install: pré-cache dos assets ──────────────────────── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

/* ── Activate: limpa caches antigos ─────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: estratégia híbrida ───────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Ignora requests não-GET e de outros domínios */
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) return;

  /* HTML: network-first (sempre tenta buscar versão nova) */
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* Google Fonts: cache persistente */
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          caches.open('bella-fonts').then(c => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  /* Assets estáticos: cache-first */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.status === 200) {
          caches.open(CACHE_STATIC).then(c => c.put(request, res.clone()));
        }
        return res;
      });
    })
  );
});
