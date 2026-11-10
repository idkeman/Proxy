"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const root = fs.readFileSync("index.html", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const sw = fs.readFileSync("public/sw.js", "utf8");
const wisp = fs.readFileSync("supabase/functions/proxy-wisp/index.ts", "utf8");
const server = fs.readFileSync("src/index.js", "utf8");

assert.match(root, /\.\/public\//, "root must route visitors to the Ultraviolet app");
assert.match(html, /id="uv-address"/, "keep one destination field");
assert.match(html, /id="preset-select"/, "keep presets");
assert.match(html, /id="uv-frame"/, "keep the UV browser frame");
assert.match(app, /__uv\$config\.prefix \+ __uv\$config\.encodeUrl\(target\)/, "navigation must use Ultraviolet");
assert.match(app, /proxy-wisp/, "keep the Supabase Wisp transport");
assert.match(sw, /uv\.bundle\.js/, "service worker must route requests through Ultraviolet");
assert.match(wisp, /Wisp WebSocket endpoint|Deno\.upgradeWebSocket/, "Supabase function must remain a Wisp WebSocket service");
assert.match(server, /wisp\.routeRequest/, "Node dev server must keep Wisp transport routing");

console.log("Ultraviolet-only checks passed: single URL bar, presets, UV routing, and Wisp transport.");
