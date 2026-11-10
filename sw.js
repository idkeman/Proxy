// Root-scoped Ultraviolet worker. GitHub Pages stores the app assets
// under /Proxy/public/, while the local Express server mounts public/ at /.
const __uvAssetBase = self.location.pathname === "/sw.js" ? "./" : "./public/";

importScripts(__uvAssetBase + "uv/uv.bundle.js");
importScripts(__uvAssetBase + "uv/uv.config.js");
importScripts(__uvAssetBase + "uv/uv.sw.js");

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
