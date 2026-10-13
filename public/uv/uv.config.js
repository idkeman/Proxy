// Derive the application base path in both page and service-worker contexts.
const __proxyBase = typeof document !== "undefined"
  ? new URL("../", document.currentScript.src).pathname
  : new URL("./", self.location.href).pathname;
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
