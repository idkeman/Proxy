"use strict";

const rootSW = new URL("../sw.js", location.href).pathname;
const repoScope = new URL("../", location.href);
const swAllowedHostnames = ["localhost", "127.0.0.1"];

function pingUltraviolet(worker) {
  return new Promise((resolve) => {
    if (!worker) return resolve(false);
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(false), 1200);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data === "UV_WORKER_READY");
    };
    worker.postMessage("UV_PING", [channel.port2]);
  });
}

async function waitForUltravioletController(registration) {
  const deadline = Date.now() + 18000;
  while (Date.now() < deadline) {
    const controller = navigator.serviceWorker.controller;
    if (controller && await pingUltraviolet(controller)) return true;

    // Force an update check. The existing root registration is intentionally
    // retained so the new worker replaces Scramjet at the same scope.
    await registration.update().catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }
  if (location.protocol !== "https:" && !swAllowedHostnames.includes(location.hostname)) {
    throw new Error("A secure HTTPS connection is required to start the proxy.");
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations
    .filter((item) => {
      const scope = new URL(item.scope);
      return scope.origin === location.origin
        && scope.pathname.startsWith(repoScope.pathname)
        && scope.pathname !== repoScope.pathname;
    })
    .map((item) => item.unregister()));

  const registration = await navigator.serviceWorker.register(rootSW, {
    scope: repoScope.pathname,
    updateViaCache: "none"
  });

  if (!await waitForUltravioletController(registration)) {
    throw new Error("The /Proxy/ service worker is not running Ultraviolet yet. Close every Proxy tab, reopen the site, and try again.");
  }

  if (!registration.active || !await pingUltraviolet(registration.active)) {
    throw new Error("The root service worker did not pass the Ultraviolet startup check. Close every Proxy tab and reload.");
  }
}
