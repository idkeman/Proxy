"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const root = fs.readFileSync("index.html", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const sw = fs.readFileSync("public/sw.js", "utf8");
const legacySw = fs.readFileSync("sw.js", "utf8");
const registration = fs.readFileSync("public/register-sw.js", "utf8");
const config = fs.readFileSync("public/uv/uv.config.js", "utf8");

assert.match(root, /location\.replace\(new URL\("\.\/public\//, "repository root should route visitors to the Ultraviolet app");
assert.match(html, /id="uv-address"/, "keep one main destination input");
assert.match(html, /id="preset-select"/, "keep the preset list");
assert.match(html, /id="uv-frame"/, "keep the Ultraviolet browsing frame");
assert.match(html, /baremux\/index\.js/, "load BareMux");
assert.match(html, /uv\/uv\.bundle\.js/, "load Ultraviolet bundle");
assert.match(app, /__uv\$config\.prefix \+ __uv\$config\.encodeUrl\(target\)/, "navigation must use Ultraviolet URL encoding");
assert.match(app, /presetSelect\.addEventListener\("change"/, "presets must use the normal destination submission path");
assert.match(app, /proxy-wisp/, "retain the existing Supabase Wisp endpoint");
assert.match(sw, /uv\.bundle\.js/, "service worker must route requests through Ultraviolet");
assert.doesNotMatch(legacySw, /importScripts.*scramjet|ScramjetServiceWorker/i, "root-scoped legacy worker must no longer execute Scramjet");
assert.match(legacySw, /self\.registration\.unregister\(\)/, "legacy root worker must unregister itself");
assert.match(registration, /scope\.pathname\.startsWith\(repoScope\.pathname\)/, "registration must clean up old workers inside this repository path");
assert.match(registration, /controller\?\.scriptURL === expectedWorker/, "startup must verify that Ultraviolet controls the page");
assert.match(registration, /updateViaCache: "none"/, "service-worker updates must bypass stale script caches");
assert.match(config, /uv\/service\//, "Ultraviolet service prefix must remain configured");
assert.equal(root.toLowerCase().includes("scramjet"), false, "root entry point must not load Scramjet");

console.log("Ultraviolet frontend tests passed: root redirect, presets, URL routing, worker cleanup, and Wisp transport.");
