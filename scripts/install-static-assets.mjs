import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const root = process.cwd();
const uvDestination = resolve(root, "public/uv");
const customConfigPath = resolve(uvDestination, "uv.config.js");
const customConfig = existsSync(customConfigPath) ? readFileSync(customConfigPath, "utf8") : null;

function replaceDirectory(source, destination) {
  if (!existsSync(source)) throw new Error("Missing package asset directory: " + source);
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
  console.log("Copied " + source + " -> " + destination);
}

replaceDirectory(uvPath, uvDestination);
if (customConfig !== null) writeFileSync(customConfigPath, customConfig);
replaceDirectory(baremuxPath, resolve(root, "public/baremux"));
replaceDirectory(epoxyPath, resolve(root, "public/epoxy"));

for (const required of [
  "public/uv/uv.bundle.js",
  "public/uv/uv.client.js",
  "public/uv/uv.handler.js",
  "public/uv/uv.sw.js",
  "public/uv/sw.js",
  "public/baremux/index.js",
  "public/baremux/worker.js",
  "public/epoxy/index.mjs"
]) {
  if (!existsSync(resolve(root, required))) throw new Error("Missing required static asset: " + required);
}
console.log("Static proxy assets installed and verified.");
