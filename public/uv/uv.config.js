// Resolve assets relative to the actual app, not the worker's scope root.
// GitHub Pages serves the app under /Proxy/public/ while the migration worker
// is at /Proxy/sw.js. The local Express server serves public/ at /.
const __proxyBase = typeof document !== "undefined"
  ? new URL("../", document.currentScript.src).pathname
  : self.location.pathname === "/sw.js"
    ? "/"
    : self.location.pathname.endsWith("/public/sw.js")
      ? new URL("./", self.location.href).pathname
      : new URL("./public/", self.location.href).pathname;

self.__uv$config = {
  prefix: __proxyBase + "uv/service/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: __proxyBase + "uv/uv.handler.js",
  client: __proxyBase + "uv/uv.client.js",
  bundle: __proxyBase + "uv/uv.bundle.js",
  config: __proxyBase + "uv/uv.config.js",
  sw: __proxyBase + "uv/uv.sw.js"
};
