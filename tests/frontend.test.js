"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim());

assert.equal(scripts.length, 1, "frontend should have exactly one inline script");
assert.equal(html.includes('id="server-input"'), false, "users should not need a backend input");
assert.equal(html.includes("onrender.com"), false, "the frontend must not depend on Render");

class FakeElement {
  constructor() {
    this.value = "";
    this.textContent = "";
    this.listeners = {};
    this.classList = {
      values: new Set(),
      add(name) { this.values.add(name); },
      remove(name) { this.values.delete(name); }
    };
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() {}
}

const elements = new Map();
const getElementById = (id) => {
  if (!elements.has(id)) elements.set(id, new FakeElement());
  return elements.get(id);
};
let currentLocation = "";
const location = {
  href: "https://idkeman.github.io/Proxy/",
  search: "",
  assign(url) { currentLocation = url; }
};

vm.runInNewContext(scripts[0], {
  document: { getElementById },
  location,
  window: { location },
  URL,
  URLSearchParams,
  encodeURIComponent,
  console
});

const targetInput = getElementById("target-input");
const form = getElementById("portal-form");
const submit = () => form.listeners.submit({ preventDefault() {} });

targetInput.value = "snokido.com";
submit();
assert.equal(targetInput.value, "https://snokido.com/");
assert.equal(
  currentLocation,
  "https://idkeman.github.io/Proxy/public/index.html?url=https%3A%2F%2Fsnokido.com%2F",
  "first URL should be normalized and sent to the backend"
);

targetInput.value = "youtube.com";
submit();
assert.equal(targetInput.value, "https://youtube.com/");
assert.equal(
  currentLocation,
  "https://idkeman.github.io/Proxy/public/index.html?url=https%3A%2F%2Fyoutube.com%2F",
  "second URL should replace the first URL rather than replaying stale state"
);
assert.notEqual(currentLocation, "https://idkeman.github.io/Proxy/public/index.html?url=https%3A%2F%2Fsnokido.com%2F");

const preset = getElementById("preset-select");
preset.value = "https://example.org/";
preset.listeners.change.call(preset);
assert.equal(targetInput.value, "https://example.org/");
submit();
assert.equal(
  currentLocation,
  "https://idkeman.github.io/Proxy/public/index.html?url=https%3A%2F%2Fexample.org%2F",
  "preset destinations should route through the same backend path"
);

console.log("Frontend routing tests passed: normalized URL, consecutive destinations, and presets.");
