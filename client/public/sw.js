// LifeQuest Service Worker
const CACHE_NAME = 'lifequest-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// ── Install: precache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return

  // API calls: network only
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          // Cache successful HTML/JS/CSS responses
          if (
            response.ok &&
            (request.destination === 'document' ||
              request.destination === 'script' ||
              request.destination === 'style')
          ) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL)
          }
        })

      return cached || networkFetch
    })
  )
})

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const options = {
    body: data.body || 'Time to level up your life!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Later' },
    ],
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LifeQuest', options)
  )
})

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
      } else {
        clients.openWindow(targetUrl)
      }
    })
  )
})

// ── Scheduled local reminders (message from main thread) ────────────────────
// Main thread sends: { type: 'SCHEDULE_REMINDER', title, body, url, delay }
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { title, body, url, delay } = event.data
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: { url },
        actions: [{ action: 'open', title: 'Log Now' }],
      })
    }, delay || 0)
  }
})
