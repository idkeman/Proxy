"use strict";

function search(input, template) {
  const value = String(input || "").trim();
  if (!value) throw new Error("Enter a website address or a search phrase.");

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch {
    // The input may be a host name or a search phrase.
  }

  try {
    const parsed = new URL("https://" + value);
    if (parsed.hostname.includes(".") && !parsed.hostname.includes(" ")) return parsed.href;
  } catch {
    // Treat malformed input as a search query.
  }

  return template.replace("%s", encodeURIComponent(value));
}
