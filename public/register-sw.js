"use strict";

const stockSW = new URL("./sw.js", location.href).pathname;
const appScope = new URL("./", location.href);
const repoScope = new URL("../", appScope);
const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  if (location.protocol !== "https:" && !swAllowedHostnames.includes(location.hostname)) {
    throw new Error("A secure HTTPS connection is required to start the proxy.");
  }

  // Remove the legacy Scramjet worker registered at /Proxy/ and any old
  // nested worker. Keep only the current Ultraviolet scope.
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations
    .filter((registration) => {
      const scope = new URL(registration.scope);
      return scope.origin === location.origin
        && scope.pathname.startsWith(repoScope.pathname)
        && scope.pathname !== appScope.pathname;
    })
    .map((registration) => registration.unregister()));

  const registration = await navigator.serviceWorker.register(stockSW, {
    scope: appScope.pathname,
    updateViaCache: "none"
  });

  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(
      () => reject(new Error("Ultraviolet service worker startup timed out. Reload the page and try again.")),
      15000
    ))
  ]);

  // navigator.serviceWorker.ready only means a worker is active. Verify that
  // the active page controller is the Ultraviolet worker for this app path.
  const expectedWorker = new URL(stockSW, location.href).href;
  const hasUltravioletControl = () =>
    navigator.serviceWorker.controller?.scriptURL === expectedWorker;

  if (!hasUltravioletControl()) {
    await Promise.race([
      new Promise((resolve) => {
        const onChange = () => {
          if (hasUltravioletControl()) {
            navigator.serviceWorker.removeEventListener("controllerchange", onChange);
            resolve();
          }
        };
        navigator.serviceWorker.addEventListener("controllerchange", onChange);
        onChange();
      }),
      new Promise((_, reject) => setTimeout(
        () => reject(new Error("The Ultraviolet service worker installed but did not take control. Close other Proxy tabs, reload, and try again.")),
        10000
      ))
    ]);
  }

  if (!hasUltravioletControl() || !registration.active) {
    throw new Error("Ultraviolet is not controlling this page. Reload the Proxy page and try again.");
  }
}
