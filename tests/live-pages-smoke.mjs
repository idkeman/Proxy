import { chromium } from "playwright";

const base = "https://idkeman.github.io/Proxy";
const target = "https://example.com/";
const url = base + "/?url=" + encodeURIComponent(target);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const failed = [];
page.on("pageerror", (error) => errors.push(error.stack || error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("requestfailed", (request) => failed.push(request.url() + " :: " + request.failure()?.errorText));
page.on("response", (response) => { if (response.status() >= 400) errors.push("HTTP " + response.status() + " " + response.url()); });

try {
  // Allow Pages deployment to finish if this test was triggered by a fresh push.
  let loaded = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      if (response && response.status() < 500) { loaded = true; break; }
    } catch (error) {
      errors.push("navigation attempt " + (attempt + 1) + ": " + error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  if (!loaded) throw new Error("Live GitHub Pages app did not become reachable.");

  await page.waitForFunction(() => {
    const view = document.querySelector("#browser-view");
    return view && !view.hidden;
  }, { timeout: 30000 });

  await page.waitForFunction(() => {
    const frame = document.querySelector("#uv-frame");
    try {
      const doc = frame?.contentDocument;
      return doc?.readyState === "complete" && (
        doc.title?.includes("Example Domain") ||
        doc.body?.innerText?.includes("This domain is for use in documentation examples")
      );
    } catch { return false; }
  }, { timeout: 45000 });

  console.log("LIVE PAGES TEST PASSED: example.com rendered through the deployed proxy.");
} catch (error) {
  const info = await page.locator("#uv-frame").evaluate((frame) => {
    let text = "(cross-origin or unavailable)";
    let html = "";
    try {
      text = frame.contentDocument?.body?.innerText || "(empty body)";
      html = frame.contentDocument?.documentElement?.outerHTML?.slice(0, 1800) || "";
    } catch (e) { text = String(e); }
    return { src: frame.src, readyState: frame.contentDocument?.readyState, text, html };
  }).catch(() => null);
  console.error("LIVE PAGES TEST FAILED");
  console.error("URL:", page.url());
  console.error("Status:", await page.locator("#uv-error").textContent().catch(() => "(unavailable)"));
  console.error("Details:", await page.locator("#uv-error-code").textContent().catch(() => "(unavailable)"));
  console.error("Frame:", JSON.stringify(info));
  console.error("Errors:", errors.join("\\n"));
  console.error("Failed requests:", failed.join("\\n"));
  throw error;
} finally {
  await browser.close();
}
