"use strict";

const stockSW = new URL("./sw.js", location.href).pathname;
const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  if (location.protocol !== "https:" && !swAllowedHostnames.includes(location.hostname)) {
    throw new Error("A secure HTTPS connection is required to start the proxy.");
  }

  // Remove the previous nested registration; it would take precedence for /uv/service/ URLs.
  const staleScope = new URL("./uv/", location.href).href;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations
    .filter((registration) => registration.scope.startsWith(staleScope))
    .map((registration) => registration.unregister()));

  await navigator.serviceWorker.register(stockSW, { scope: new URL("./", location.href).pathname });
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker startup timed out. Reload the page and try again.")), 10000))
  ]);
}
