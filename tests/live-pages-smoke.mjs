import { chromium } from "playwright";

const base = "https://idkeman.github.io/Proxy/";
const target = "https://example.com/";
const browser = await chromium.launch({ headless: true });

async function assertExampleDomain(page) {
  await page.waitForFunction(() => {
    const frame = document.querySelector("#uv-frame");
    try {
      const doc = frame?.contentDocument;
      return doc?.readyState === "complete" && (
        doc.title?.includes("Example Domain") ||
        doc.body?.innerText?.includes("This domain is for use in documentation examples")
      );
    } catch {
      return false;
    }
  }, { timeout: 60000 }).catch(async (error) => {
    const details = await page.locator("#uv-frame").evaluate((frame) => {
      let body = "(unavailable)";
      try { body = frame.contentDocument?.body?.innerText || "(empty)"; } catch (e) { body = String(e); }
      return { src: frame.src, readyState: frame.contentDocument?.readyState, body: body.slice(0, 1200) };
    }).catch(() => null);
    throw new Error("Ultraviolet did not render Example Domain: " + JSON.stringify(details) + "; " + error.message);
  });
}

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#uv-address", { timeout: 15000 });
  await page.locator("#uv-address").fill(target);
  await page.locator("#uv-form").evaluate((form) => form.requestSubmit());
  await page.waitForFunction(() => {
    const view = document.querySelector("#browser-view");
    return view && !view.hidden;
  }, { timeout: 30000 });
  const frameUrl = await page.locator("#uv-frame").getAttribute("src");
  if (!frameUrl || !frameUrl.includes("/uv/service/")) {
    throw new Error("Ultraviolet opened without a valid service URL: " + frameUrl);
  }
  await assertExampleDomain(page);
  if (errors.length) throw new Error("Ultraviolet page errors: " + errors.join("\n"));
  console.log("LIVE TEST PASSED: Ultraviolet rendered example.com through the deployed Wisp path.");
} catch (error) {
  console.error("LIVE ULTRAVIOLET TEST FAILED:", error.stack || error.message);
  throw error;
} finally {
  await browser.close();
}
