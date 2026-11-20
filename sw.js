/* Scramjet 2.x service worker. Keep this file at the repository root so
   its scope covers the GitHub Pages project path. */
importScripts("./scramjet-runtime/controller/controller.sw.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  if ($scramjetController.shouldRoute(event)) {
    event.respondWith($scramjetController.route(event));
  }
});
