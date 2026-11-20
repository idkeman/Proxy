"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");
const wisp = fs.readFileSync("supabase/functions/proxy-wisp/index.ts", "utf8");
const server = fs.readFileSync("src/index.js", "utf8");

assert.match(html, /id="searchbar"/, "keep the single destination bar");
assert.match(html, /id="preset-select"/, "keep the preset selector");
assert.equal(html.includes('id="engine-select"'), false, "homepage should expose Scramjet only");
assert.equal(html.includes("proxy-engine"), false, "homepage must not persist an alternate engine");
assert.match(html, /scramjet-runtime\/scramjet\/scramjet\.js/, "load the pinned Scramjet 2.x core");
assert.match(html, /scramjet-runtime\/controller\/controller\.api\.js/, "load the Scramjet 2.x controller");
assert.match(html, /window\.\$scramjetController/, "initialize the v2 controller API");
assert.match(html, /controller\.createFrame\(frame\)/, "create the managed proxy frame");
assert.match(html, /scramjetFrame\.go\(destinationUrl\)/, "navigate through the v2 frame API");
assert.equal(html.includes("$scramjetLoadController"), false, "do not use the Scramjet 1.x loader");
assert.equal(html.includes("bare-mux"), false, "do not load the deprecated Bare-Mux transport stack");
assert.match(worker, /controller\/controller\.sw\.js/, "route requests through the v2 service worker");
assert.match(worker, /\$scramjetController\.shouldRoute/, "use the v2 service worker router");
assert.match(wisp, /Wisp WebSocket endpoint|Deno\.upgradeWebSocket/, "Supabase function is a Wisp WebSocket service");
assert.match(server, /wisp\.routeRequest/, "Node dev server routes Wisp transport");

console.log("Scramjet 2.x checks passed: controller, managed frame, Wisp transport, and presets.");
