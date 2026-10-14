"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const wisp = fs.readFileSync("supabase/functions/proxy-wisp/index.ts", "utf8");
const server = fs.readFileSync("src/index.js", "utf8");

assert.match(html, /id="searchbar"/, "keep the single destination bar");
assert.match(html, /id="preset-select"/, "keep the preset selector");
assert.equal(html.includes('id="engine-select"'), false, "homepage should expose Scramjet only");
assert.equal(html.includes("public/index.html?url="), false, "homepage must not route to Ultraviolet");
assert.equal(html.includes("proxy-engine"), false, "homepage must not persist an alternate engine");
assert.match(html, /showBrowser\(sj\.encodeUrl\(url\)\)/, "destination navigation must use Scramjet");
assert.match(wisp, /Wisp WebSocket endpoint|Deno\.upgradeWebSocket/, "Supabase function is a Wisp WebSocket service");
assert.match(server, /wisp\.routeRequest/, "Node dev server routes Wisp transport");

console.log("Scramjet-only checks passed: single URL bar, presets, and Wisp-backed Scramjet routing.");
