import { URL } from "node:url";
import { join } from "node:path";
import { createServer } from "node:http";
import express from "express";
import wisp from "wisp-server-node";

import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const app = express();
const publicPath = join(process.cwd(), "public");

app.disable("x-powered-by");

function getRequestedTarget(req) {
  try {
    const target = new URL(req.url || "/", "http://localhost").searchParams.get("url");
    if (!target) return null;

    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

app.use((req, res, next) => {
  if (!new URL(req.url || "/", "http://localhost").searchParams.has("url")) {
    next();
    return;
  }

  const target = getRequestedTarget(req);
  if (!target) {
    res.status(400).send("Invalid proxy target.");
    return;
  }

  // The normalized target is intentionally carried by the request URL.
  // public/app.js consumes the same value and starts Ultraviolet with it.
  res.locals.proxyTarget = target;
  next();
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Serve the custom page first so its UV configuration overrides the package default.
app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

app.use((_req, res) => {
  res.status(404).sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  let pathname = "";
  try {
    pathname = new URL(req.url || "/", "http://localhost").pathname;
  } catch {
    socket.destroy();
    return;
  }

  if (pathname.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
    return;
  }

  socket.destroy();
});

const port = Number.parseInt(process.env.PORT || "8080", 10);

server.on("listening", () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    console.log("Proxy server is listening.");
    return;
  }

  const host = address.address.includes(":") ? "[" + address.address + "]" : address.address;
  console.log("Proxy server listening on port " + address.port);
  console.log("Local URL: http://localhost:" + address.port);
  console.log("Bound address: http://" + host + ":" + address.port);
});

function shutdown() {
  console.log("Shutdown requested; closing the HTTP server.");
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen({ port, host: "0.0.0.0" });
