import { chromium } from "playwright";

const base = "https://idkeman.github.io/Proxy/";
const target = "https://example.com/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const failed = [];
page.on("pageerror", (error) => errors.push(error.stack || error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("requestfailed", (request) => failed.push(request.url() + " :: " + request.failure()?.errorText));
page.on("response", (response) => {
  if (response.status() >= 500) errors.push("HTTP " + response.status() + " " + response.url());
});

try {
  const response = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!response || response.status() >= 400) {
    throw new Error("GitHub Pages returned an unsuccessful response.");
  }

  await page.waitForFunction(() => {
    const status = document.querySelector("#status");
    return status && status.textContent.trim() === "Ready";
  }, { timeout: 60000 });

  const bar = page.locator("#searchbar");
  await bar.fill(target);
  await page.locator("#proxy-search-form").evaluate((form) => form.requestSubmit());

  await page.waitForFunction(() => {
    const frame = document.querySelector("#browser");
    return frame && frame.classList.contains("visible");
  }, { timeout: 15000 });

  await page.waitForFunction(() => {
    const frame = document.querySelector("#browser");
    try {
      const doc = frame?.contentDocument;
      return doc?.readyState === "complete" && (
        doc.title?.includes("Example Domain") ||
        doc.body?.innerText?.includes("This domain is for use in documentation examples")
      );
    } catch {
      return false;
    }
  }, { timeout: 60000 });

  console.log("LIVE PAGES TEST PASSED: example.com rendered through the deployed Scramjet + Wisp path.");
} catch (error) {
  const diagnostics = await page.evaluate(() => ({
    status: document.querySelector("#status")?.textContent || "(missing)",
    input: document.querySelector("#searchbar")?.value || "(missing)",
    frameClass: document.querySelector("#browser")?.className || "(missing)",
    frameSrc: document.querySelector("#browser")?.src || "(missing)"
  })).catch(() => null);
  console.error("LIVE PAGES TEST FAILED");
  console.error("URL:", page.url());
  console.error("Diagnostics:", JSON.stringify(diagnostics));
  console.error("Page errors:", errors.join("\n"));
  console.error("Failed requests:", failed.join("\n"));
  throw error;
} finally {
  await browser.close();
}
