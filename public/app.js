"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const landingView = document.getElementById("landing-view");
const browserView = document.getElementById("browser-view");
const frame = document.getElementById("uv-frame");
const navForm = document.getElementById("nav-form");
const navAddress = document.getElementById("nav-address");
const connectionLabel = document.getElementById("connection-label");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

function showMessage(message, isError, detail) {
  error.textContent = message;
  error.classList.toggle("error", Boolean(isError));
  errorCode.hidden = !detail;
  errorCode.textContent = detail || "";
}

function showBrowser(target) {
  landingView.hidden = true;
  browserView.hidden = false;
  browserView.classList.add("active");
  navAddress.value = target;
  connectionLabel.textContent = "WORKSPACE ACTIVE";
}

function showHome() {
  frame.src = "about:blank";
  browserView.classList.remove("active");
  browserView.hidden = true;
  landingView.hidden = false;
  address.focus();
  connectionLabel.textContent = "ENGINE READY";
  showMessage("Ready when you are.", false);
}

async function startProxy(rawInput) {
  let target;
  try {
    target = search(rawInput, searchEngine.value || "https://www.google.com/search?q=%s");
  } catch (err) {
    showMessage(err.message || "Enter a website address or search phrase.", true);
    return;
  }

  try {
    showMessage("Preparing a secure browser session…", false);
    connectionLabel.textContent = "CONNECTING";
    await registerSW();

    const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    const currentTransport = await connection.getTransport();
    if (currentTransport !== "/epoxy/index.mjs") {
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    }

    const proxiedUrl = __uv$config.prefix + __uv$config.encodeUrl(target);
    address.value = target;
    showBrowser(target);
    frame.src = proxiedUrl;
    showMessage("Opened " + target, false);
  } catch (err) {
    connectionLabel.textContent = "NOT CONNECTED";
    showMessage("The proxy could not start. Check the server deployment and try again.", true, String(err && err.stack ? err.stack : err));
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  startProxy(address.value);
});

navForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startProxy(navAddress.value);
});

document.querySelectorAll("[data-url]").forEach((button) => {
  button.addEventListener("click", () => {
    address.value = button.getAttribute("data-url") || "";
    startProxy(address.value);
  });
});

document.getElementById("home-button").addEventListener("click", showHome);
document.getElementById("back-button").addEventListener("click", () => {
  try { frame.contentWindow.history.back(); } catch { /* Navigation may not be available yet. */ }
});
document.getElementById("forward-button").addEventListener("click", () => {
  try { frame.contentWindow.history.forward(); } catch { /* Navigation may not be available yet. */ }
});
document.getElementById("reload-button").addEventListener("click", () => {
  try { frame.contentWindow.location.reload(); } catch { frame.src = frame.src; }
});

frame.addEventListener("load", () => {
  if (!browserView.hidden) {
    try {
      const current = frame.contentWindow.location.href;
      if (current.startsWith(location.origin + __uv$config.prefix)) {
        navAddress.value = __uv$config.decodeUrl(current.slice((location.origin + __uv$config.prefix).length));
      }
    } catch {
      // Some proxied pages intentionally navigate away from the initial document.
    }
  }
});

const requestedUrl = new URLSearchParams(location.search).get("url");
if (requestedUrl) {
  address.value = requestedUrl;
  startProxy(requestedUrl);
}
