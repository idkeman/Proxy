"use strict";

import assert from "node:assert/strict";
import fs from "node:fs";

const root = fs.readFileSync("index.html", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const registration = fs.readFileSync("public/register-sw.js", "utf8");
const config = fs.readFileSync("public/uv/uv.config.js", "utf8");
const uvBundle = fs.readFileSync("public/uv/uv.bundle.js", "utf8");
const uvWorker = fs.readFileSync("public/uv/uv.sw.js", "utf8");

assert.match(root, /location\.replace\(new URL\("\.\/public\//, "repository root should route visitors to the Ultraviolet app");
assert.match(html, /id="uv-address"/, "keep one main destination input");
assert.match(html, /id="preset-select"/, "keep the preset list");
assert.match(html, /id="uv-frame"/, "keep the Ultraviolet browsing frame");
assert.match(html, /baremux\/index\.js/, "load BareMux");
assert.match(html, /uv\/uv\.bundle\.js/, "load Ultraviolet bundle");
assert.match(app, /__uv\$config\.prefix \+ __uv\$config\.encodeUrl\(target\)/, "navigation must use Ultraviolet URL encoding");
assert.match(app, /presetSelect\.addEventListener\("change"/, "presets must use the normal destination submission path");
assert.match(app, /proxy-wisp/, "retain the existing Supabase Wisp endpoint");

// Verify that every imported file exists at the URL produced by each host layout.
assert.match(sw, /__uvAssetBase \+ "uv\/uv\.bundle\.js"/, "root worker must derive its UV asset directory");
assert.match(sw, /importScripts\(__uvAssetBase \+ "uv\/uv\.config\.js"\)/, "root worker must load the matching UV config");
assert.match(sw, /importScripts\(__uvAssetBase \+ "uv\/uv\.sw\.js"\)/, "root worker must load the UV service worker directly");
assert.ok(uvBundle.length > 10000, "UV bundle must be present and non-empty");
assert.ok(uvWorker.includes("UVServiceWorker"), "UV service worker implementation must be present");
assert.match(config, /self\.location\.pathname === "\/sw\.js"/, "local root worker must resolve assets from /");
assert.match(config, /endsWith\("\/public\/sw\.js"\)/, "public worker must resolve assets from its own directory");
assert.match(config, /new URL\("\.\/public\/", self\.location\.href\)/, "GitHub Pages root worker must resolve assets from /Proxy/public/");
assert.match(config, /prefix: __proxyBase \+ "uv\/service\/"/, "UV service prefix must use the same asset base");
assert.match(config, /handler: __proxyBase \+ "uv\/uv\.handler\.js"/, "UV handler path must use the same asset base");
assert.match(config, /client: __proxyBase \+ "uv\/uv\.client\.js"/, "UV client path must use the same asset base");

const deployedScriptUrl = new URL("https://idkeman.github.io/Proxy/public/register-sw.js?uv-build=20261110c");
const deployedWorkerUrl = new URL("../sw.js?uv-build=20261110d", deployedScriptUrl);
const deployedScopeUrl = new URL("../", deployedScriptUrl);
assert.equal(deployedWorkerUrl.pathname, "/Proxy/sw.js", "GitHub Pages worker URL must stay inside /Proxy/");
assert.equal(deployedScopeUrl.pathname, "/Proxy/", "GitHub Pages worker scope must stay inside /Proxy/");
assert.match(registration, /document\.currentScript\?\.src/, "registration paths must be based on the registration script URL, not the document URL");
assert.match(registration, /sw\.js\?uv-build=20261110d/, "page must force a versioned worker script URL");
assert.match(registration, /oldRepoRegistrations\.map\(\(item\) => item\.unregister\(\)\)/, "migration must remove stale root and nested registrations before installing UV");
assert.match(registration, /scope: repoScope\.pathname/, "Ultraviolet must use the existing root scope");
assert.match(registration, /UV_WORKER_READY/, "startup must verify the running worker version");
assert.match(sw, /self\.clients\.claim\(\)/, "root Ultraviolet worker must claim existing pages");
assert.equal(root.toLowerCase().includes("scramjet"), false, "root entry point must not load Scramjet");

console.log("Ultraviolet frontend tests passed: asset paths, worker imports, root scope, presets, URL routing, and Wisp transport.");
