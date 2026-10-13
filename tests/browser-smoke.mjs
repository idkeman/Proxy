import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const runtimeErrors = [];
const failedRequests = [];
page.on("pageerror", (error) => runtimeErrors.push("pageerror: " + (error.stack || error.message)));
page.on("console", (message) => {
  if (message.type() === "error") runtimeErrors.push("console: " + message.text());
});
page.on("requestfailed", (request) => failedRequests.push(request.url() + " :: " + request.failure()?.errorText));
page.on("response", (response) => {
  if (response.status() >= 400) runtimeErrors.push("HTTP " + response.status() + " " + response.url());
});

try {
  await page.goto("http://127.0.0.1:8080/?url=https%3A%2F%2Fexample.com", {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });

  await page.waitForFunction(() => {
    const view = document.querySelector("#browser-view");
    return view && !view.hidden;
  }, { timeout: 30000 });

  const frameUrl = await page.locator("#uv-frame").getAttribute("src");
  if (!frameUrl || !frameUrl.includes("/uv/service/")) {
    throw new Error("Proxy view opened without a valid Ultraviolet frame URL: " + frameUrl);
  }

  try {
    await page.waitForFunction(() => {
      const frame = document.querySelector("#uv-frame");
      try {
        return frame?.contentDocument?.querySelector("h1")?.textContent?.includes("Example Domain");
      } catch {
        return false;
      }
    }, { timeout: 15000 });
  } catch {
    const frameInfo = await page.locator("#uv-frame").evaluate((frame) => {
      let text = "(cross-origin or unavailable)";
      let html = "";
      try {
        text = frame.contentDocument?.body?.innerText || "(empty body)";
        html = frame.contentDocument?.documentElement?.outerHTML?.slice(0, 2500) || "";
      } catch (error) {
        text = String(error);
      }
      return { src: frame.src, readyState: frame.contentDocument?.readyState, text, html };
    });
    throw new Error("Target did not render. Frame details: " + JSON.stringify(frameInfo));
  }

  console.log("Browser smoke test passed: example.com rendered through Ultraviolet.");
} catch (error) {
  const status = await page.locator("#uv-error").textContent().catch(() => "(status unavailable)");
  const details = await page.locator("#uv-error-code").textContent().catch(() => "(details unavailable)");
  console.error("Browser smoke test failed.");
  console.error("Page URL:", page.url());
  console.error("Status:", status);
  console.error("Details:", details);
  console.error("Runtime errors:", runtimeErrors.join("\n"));
  console.error("Failed requests:", failedRequests.join("\n"));
  throw error;
} finally {
  await browser.close();
}
