// Ultraviolet worker registered at /Proxy/.
// Keeping the original root scope lets the updated worker replace the
// previous Scramjet worker in-place and control /Proxy/public/ as well.
importScripts("./public/uv/uv.bundle.js");
importScripts("./public/uv/uv.config.js");
importScripts(__uv$config.sw || "./public/uv/uv.sw.js");

const uv = new UVServiceWorker();

async function handleRequest(event) {
  if (uv.route(event)) return await uv.fetch(event);
  return await fetch(event.request);
}

self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
