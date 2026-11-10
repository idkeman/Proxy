// Retire the legacy root-scoped Scramjet service worker.
// The active Ultraviolet worker is registered from /public/sw.js.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
