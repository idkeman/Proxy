// Ultraviolet worker registered at /Proxy/.
// It replaces the previous Scramjet worker in-place at the same scope.
importScripts("./public/uv/uv.bundle.js");
importScripts("./public/uv/uv.config.js");
importScripts(__uv$config.sw || "./public/uv/uv.sw.js");

const uv = new UVServiceWorker();

async function handleRequest(event) {
  if (uv.route(event)) return await uv.fetch(event);
  return await fetch(event.request);
}

self.addEventListener("message", (event) => {
  if (event.data === "UV_PING" && event.ports?.[0]) {
    event.ports[0].postMessage("UV_WORKER_READY");
  }
});
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
