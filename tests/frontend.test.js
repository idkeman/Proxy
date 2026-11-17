"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim());

assert.equal(inlineScripts.length, 2, "frontend should have its ES module plus the shared-list sync script");
assert.match(inlineScripts[1], /shared_website_presets/, "include the shared preset client");
assert.match(inlineScripts[1], /postgres_changes/, "listen for changes from the other site");
assert.match(inlineScripts[1], /added_from: "proxy"/, "new Proxy entries should be written to the shared list");
assert.match(html, /id="searchbar"/, "keep exactly one destination input");
assert.match(html, /id="preset-select"/, "keep the preset selector");
assert.equal(html.includes('id="engine-select"'), false, "keep the homepage Scramjet-only");
assert.equal((html.match(/<input[^>]+type="text"/gi) || []).length, 2,
  "the only text inputs should be the destination bar and hidden Wisp settings input");
assert.equal(html.includes('id="server-input"'), false, "do not add a second visible backend input");
assert.equal(html.includes("onrender.com"), false, "do not depend on Render");
assert.match(inlineScripts[0], /function toUrl\(raw\)/, "URL normalization should remain in place");
assert.match(inlineScripts[0], /https:\/\/duckduckgo\.com\//, "non-URL text should remain searchable");
assert.match(inlineScripts[0], /bar\.value = destination/, "normalize the actual destination input");
assert.match(inlineScripts[0], /searchForm\.requestSubmit\(\)/, "presets should use the same form submission path");

console.log("Frontend structure tests passed: proxy navigation, presets, and shared-list synchronization.");
