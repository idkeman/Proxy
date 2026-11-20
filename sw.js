/* Scramjet 2.x service worker. Keep this file at the repository root so
   its scope covers the GitHub Pages project path. */

// Resolve the runtime bundle from this worker's deployed URL. This keeps the
// import inside /Proxy/ on GitHub Pages and avoids root-relative URL mistakes.
const scramjetWorkerBundle = new URL(
  "./scramjet-runtime/controller/controller.sw.js",
  self.location.href
).href;

try {
  importScripts(scramjetWorkerBundle);
} catch (error) {
  console.error("[Proxy] Failed to load Scramjet service-worker bundle:", scramjetWorkerBundle, error);
  throw error;
}

if (typeof $scramjetController === "undefined") {
  throw new Error("Scramjet service-worker bundle loaded but did not expose $scramjetController.");
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  if ($scramjetController.shouldRoute(event)) {
    event.respondWith($scramjetController.route(event));
  }
});
