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
const serverInput = document.getElementById("server-input");
const serverForm = document.getElementById("server-form");
const serverMessage = document.getElementById("server-message");
const setupPanel = document.querySelector(".setup-panel");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

function getSavedServer() {
  try {
    return localStorage.getItem("proxy-backend-url") || "";
  } catch {
    return "";
  }
}

function setSavedServer(url) {
  try {
    localStorage.setItem("proxy-backend-url", url);
    return true;
  } catch {
    return false;
  }
}

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
  connectionLabel.textContent = "BROWSING";
}

function showHome() {
  frame.src = "about:blank";
  browserView.classList.remove("active");
  browserView.hidden = true;
  landingView.hidden = false;
  connectionLabel.textContent = "READY";
  address.focus();
  showMessage("Ready.", false);
}

function normalizeBackend(raw) {
  const parsed = new URL(String(raw || "").trim());
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("Use an HTTPS proxy server URL.");
  }
  return parsed.origin;
}

async function getBackendOrigin() {
  const saved = getSavedServer();
  if (!saved) return location.origin;

  try {
    return normalizeBackend(saved);
  } catch {
    return location.origin;
  }
}

async function startProxy(rawInput) {
  let target;
  try {
    target = search(rawInput, searchEngine.value || "https://www.google.com/search?q=%s");
  } catch (err) {
    showMessage(err.message || "Enter a website address or search.", true);
    return;
  }

  try {
    const backend = await getBackendOrigin();
    const isExternalBackend = backend !== location.origin;

    if (isExternalBackend) {
      const handoff = backend + "/?url=" + encodeURIComponent(target);
      showMessage("Opening…", false);
      window.location.assign(handoff);
      return;
    }

    connectionLabel.textContent = "CONNECTING";
    showMessage("Opening…", false);
    await registerSW();

    const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    const currentTransport = await connection.getTransport();
    if (currentTransport !== "/epoxy/index.mjs") {
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    }

    address.value = target;
    showBrowser(target);
    frame.src = __uv$config.prefix + __uv$config.encodeUrl(target);
    showMessage("Ready.", false);
  } catch (err) {
    connectionLabel.textContent = "ERROR";
    showMessage("Proxy could not start.", true, String(err && err.stack ? err.stack : err));
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

serverForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const origin = normalizeBackend(serverInput.value);
    if (!setSavedServer(origin)) throw new Error("Could not save the server address.");
    serverInput.value = origin;
    serverMessage.textContent = "Saved.";
    serverMessage.classList.remove("error");
    setupPanel.removeAttribute("open");
    address.focus();
  } catch (err) {
    serverMessage.textContent = err.message || "Enter a valid HTTPS server URL.";
    serverMessage.classList.add("error");
  }
});

document.getElementById("home-button").addEventListener("click", showHome);
document.getElementById("back-button").addEventListener("click", () => {
  try { frame.contentWindow.history.back(); } catch {}
});
document.getElementById("forward-button").addEventListener("click", () => {
  try { frame.contentWindow.history.forward(); } catch {}
});
document.getElementById("reload-button").addEventListener("click", () => {
  try { frame.contentWindow.location.reload(); } catch { frame.src = frame.src; }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    if (browserView.hidden) {
      address.focus();
      address.select();
    } else {
      navAddress.focus();
      navAddress.select();
    }
  }

  if (event.key === "Escape" && !browserView.hidden) {
    showHome();
  }
});

const savedServer = getSavedServer();
if (savedServer) {
  serverInput.value = savedServer;
}

const requestedUrl = new URLSearchParams(location.search).get("url");
if (requestedUrl) {
  address.value = requestedUrl;
  startProxy(requestedUrl);
}
