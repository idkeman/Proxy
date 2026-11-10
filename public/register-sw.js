"use strict";

const rootSW = new URL("../sw.js", location.href).pathname;
const repoScope = new URL("../", location.href);
const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  if (location.protocol !== "https:" && !swAllowedHostnames.includes(location.hostname)) {
    throw new Error("A secure HTTPS connection is required to start the proxy.");
  }

  // Keep the existing /Proxy/ registration and replace its script in-place.
  // Remove only stale nested registrations from earlier migration attempts.
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

  const expectedWorker = new URL(rootSW, location.href).href;
  const hasUltravioletControl = () =>
    navigator.serviceWorker.controller?.scriptURL === expectedWorker;

  // Wait for this exact root-scoped registration, not the generic ready
  // promise, which can resolve to an older controller's registration.
  await Promise.race([
    (async () => {
      if (registration.installing) {
        await new Promise((resolve, reject) => {
          const worker = registration.installing;
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") resolve();
            if (worker.state === "redundant") reject(new Error("The Ultraviolet worker became redundant during installation."));
          });
        });
      } else if (registration.waiting) {
        throw new Error("Ultraviolet is waiting to activate. Close other Proxy tabs and reload.");
      } else if (!registration.active) {
        throw new Error("The Ultraviolet service worker did not become active.");
      }

      if (!hasUltravioletControl()) {
        await new Promise((resolve, reject) => {
          const onChange = () => {
            if (hasUltravioletControl()) {
              navigator.serviceWorker.removeEventListener("controllerchange", onChange);
              resolve();
            }
          };
          navigator.serviceWorker.addEventListener("controllerchange", onChange);
          onChange();
          setTimeout(() => {
            navigator.serviceWorker.removeEventListener("controllerchange", onChange);
            reject(new Error("Ultraviolet is active at /Proxy/ but has not taken control of this tab. Close every Proxy tab, then reopen the site."));
          }, 12000);
        });
      }
    })(),
    new Promise((_, reject) => setTimeout(
      () => reject(new Error("Ultraviolet service worker startup timed out. Close every Proxy tab and reload.")),
      20000
    ))
  ]);

  if (!hasUltravioletControl() || !registration.active || registration.active.scriptURL !== expectedWorker) {
    throw new Error("The /Proxy/ service worker is not the Ultraviolet worker. Close every Proxy tab and reload.");
  }
}
