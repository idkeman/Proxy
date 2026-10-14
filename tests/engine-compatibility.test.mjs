"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const config = fs.readFileSync("public/uv/uv.config.js", "utf8");
const wisp = fs.readFileSync("supabase/functions/proxy-wisp/index.ts", "utf8");
const server = fs.readFileSync("src/index.js", "utf8");
const docs = fs.readFileSync("ENGINE_COMPATIBILITY.md", "utf8");

assert.match(html, /id="searchbar"/, "keep the single destination bar");
assert.match(html, /id="preset-select"/, "keep the preset selector");
assert.match(html, /id="engine-select"/, "include the engine selector");
for (const engine of ["scramjet", "ultraviolet", "rammerhead"]) {
  assert.match(html, new RegExp('value="' + engine + '"'), "selector should include " + engine);
}
assert.match(html, /TOMPHTTP Bare server/i, "Ultraviolet must explain its required protocol");
assert.match(html, /own running Node\.js server/i, "Rammerhead must explain its required backend");
assert.match(html, /getSelectedEngine\(\) !== 'scramjet'/, "unavailable engines must not navigate");
assert.match(config, /prefix:.*uv\/service\//, "Ultraviolet assets are configured locally");
assert.match(wisp, /Wisp WebSocket endpoint|Deno\.upgradeWebSocket/, "Supabase function is a Wisp WebSocket service");
assert.match(server, /wisp\.routeRequest/, "Node dev server currently routes Wisp, not Bare or Rammerhead");
assert.match(docs, /Blocked; do not route traffic to Wisp/);
assert.match(docs, /Blocked; needs a Node\.js host/);

console.log("Engine compatibility tests passed: single URL bar, presets, selector, and backend mismatch guards.");
