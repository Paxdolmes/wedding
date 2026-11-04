/* Imogen & Dan guest app: shows push notifications and keeps the app shell working on patchy venue signal. */
const SHELL = 'iad-shell-v1'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(['/app/', '/app/manifest.webmanifest', '/app/icons/icon-192.png'])).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== SHELL).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return
  // Network first, falling back to the last copy we saw.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && (url.pathname.startsWith('/app') || url.pathname.startsWith('/assets/'))) {
      const copy = response.clone()
      caches.open(SHELL).then(cache => cache.put(event.request, copy))
    }
    return response
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match('/app/'))))
})

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'Imogen & Dan', body: event.data ? event.data.text() : '' } }
  const title = data.title || 'Imogen & Dan'
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/app/icons/icon-192.png',
      badge: '/app/icons/badge-96.png',
      tag: data.tag,
      data: { url: data.url || '/app/#home' },
    }),
    self.clients.matchAll({ type: 'window' }).then(clients => clients.forEach(client => client.postMessage({ type: 'notification' }))),
  ]))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/app/#home', location.origin).href
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const open = clients.find(client => client.url.includes('/app'))
    if (open) return open.navigate(target).then(client => (client || open).focus()).catch(() => open.focus())
    return self.clients.openWindow(target)
  }))
})
