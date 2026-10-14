import { chromium } from "playwright";

const base = "https://idkeman.github.io/Proxy/";
const target = "https://example.com/";
const browser = await chromium.launch({ headless: true });

async function assertExampleDomain(page, frameSelector, label) {
  await page.waitForFunction((selector) => {
    const frame = document.querySelector(selector);
    try {
      const doc = frame?.contentDocument;
      return doc?.readyState === "complete" && (
        doc.title?.includes("Example Domain") ||
        doc.body?.innerText?.includes("This domain is for use in documentation examples")
      );
    } catch {
      return false;
    }
  }, frameSelector, { timeout: 60000 }).catch(async (error) => {
    const details = await page.locator(frameSelector).evaluate((frame) => {
      let body = "(unavailable)";
      try { body = frame.contentDocument?.body?.innerText || "(empty)"; } catch (e) { body = String(e); }
      return { src: frame.src, readyState: frame.contentDocument?.readyState, body: body.slice(0, 1200) };
    }).catch(() => null);
    throw new Error(label + " did not render Example Domain: " + JSON.stringify(details) + "; " + error.message);
  });
}

async function waitForReady(page) {
  let lastError;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector("#searchbar", { timeout: 5000 });
      await page.waitForFunction(() => document.querySelector("#status")?.textContent.trim() === "Ready", {
        timeout: 60000
      });
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
  throw new Error("The deployed Scramjet homepage did not become ready after retrying: " + (lastError?.message || "unknown error"));
}

try {
  const scramjet = await browser.newPage();
  const sjErrors = [];
  scramjet.on("pageerror", (error) => sjErrors.push(error.stack || error.message));
  await waitForReady(scramjet);
  await scramjet.locator("#searchbar").fill(target);
  await scramjet.locator("#proxy-search-form").evaluate((form) => form.requestSubmit());
  await scramjet.waitForFunction(() => document.querySelector("#browser")?.classList.contains("visible"), { timeout: 15000 });
  await assertExampleDomain(scramjet, "#browser", "Scramjet/Wisp");
  if (sjErrors.length) throw new Error("Scramjet page errors: " + sjErrors.join("\n"));
  console.log("LIVE TEST PASSED: Scramjet rendered example.com through the deployed Wisp path.");
  await scramjet.close();

} catch (error) {
  console.error("LIVE ENGINE TEST FAILED:", error.stack || error.message);
  throw error;
} finally {
  await browser.close();
}
