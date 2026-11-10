"use strict";

// Resolve paths from this script's URL, not location.href (the document URL).
// On GitHub Pages this resolves to /Proxy/public/register-sw.js.
const registrationScriptUrl = document.currentScript?.src || new URL("./register-sw.js", location.href).href;
const appBase = new URL("./", registrationScriptUrl);
const rootSW = new URL("../sw.js?uv-build=20261110d", registrationScriptUrl).href;
const repoScope = new URL("../", registrationScriptUrl);
const swAllowedHostnames = ["localhost", "127.0.0.1"];

function pingUltraviolet(worker) {
  return new Promise((resolve) => {
    if (!worker) return resolve(false);
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(false), 1500);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(event.data === "UV_WORKER_READY");
    };
    try {
      worker.postMessage("UV_PING", [channel.port2]);
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

async function waitForUltravioletController(registration) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const controller = navigator.serviceWorker.controller;
    if (controller && await pingUltraviolet(controller)) return true;
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
  const oldRepoRegistrations = registrations.filter((item) => {
    const scope = new URL(item.scope);
    return scope.origin === repoScope.origin
      && scope.pathname.startsWith(repoScope.pathname);
  });
  await Promise.all(oldRepoRegistrations.map((item) => item.unregister()));

  const registration = await navigator.serviceWorker.register(rootSW, {
    scope: repoScope.pathname,
    updateViaCache: "none"
  });

  if (!await waitForUltravioletController(registration)) {
    const activePing = await pingUltraviolet(registration.active);
    throw new Error(activePing
      ? "Ultraviolet installed, but this tab is still controlled by an older service worker. Close every Proxy tab, then reopen the site."
      : "Ultraviolet could not take control. The worker failed its startup handshake. Close every Proxy tab, then reopen the site.");
  }

  if (!registration.active || !await pingUltraviolet(registration.active)) {
    throw new Error("The active /Proxy/ worker is not responding as Ultraviolet. Close every Proxy tab and reload.");
  }
}
