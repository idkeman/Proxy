// Retire the old root-scoped service worker.
// Ultraviolet runs from the more-specific /public/ scope.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
