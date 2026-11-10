# Ultraviolet deployment status

This branch is a single-engine Ultraviolet build. Scramjet is not used for navigation.

## Active deployment

- GitHub Pages: https://idkeman.github.io/Proxy/
- App entry point: `public/index.html`; the repository root redirects to it.
- Browser engine: [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)
- Service worker: `public/sw.js`, scoped to the app directory.
- Transport: Epoxy through BareMux.
- Wisp endpoint: `wss://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/`

GitHub Pages hosts the static interface and vendored browser assets. Supabase hosts the Wisp WebSocket TCP relay used by BareMux/Epoxy.

## Legacy service-worker migration

Older versions registered Scramjet's worker at the repository root (`/Proxy/`). This branch retires that root worker and unregisters any other legacy worker inside this repository path before starting Ultraviolet. Startup waits for, and verifies, the Ultraviolet worker at `/Proxy/public/sw.js` to control the page. This avoids a stale root worker intercepting requests intended for the Ultraviolet app.

If a browser still has an old controller after deployment, close all Proxy tabs and reopen https://idkeman.github.io/Proxy/ so the retired worker can update and unregister.

## Navigation behavior

- One visible destination input is retained.
- Existing preset groups and preset URLs are retained.
- Hostnames such as `example.com` are normalized to HTTPS.
- Presets and typed destinations use the same Ultraviolet navigation function.
- The target is encoded with Ultraviolet's configured URL codec.
- No Scramjet or Rammerhead engine selector is present in this branch.

## Verification

The GitHub Actions workflow checks JavaScript syntax, frontend routing, the Supabase Wisp health endpoint, a local Chromium navigation, and a live GitHub Pages Chromium navigation to `https://example.com/`. A passing Pages build alone is not treated as proof that proxy navigation works.

## Upstream projects

- Ultraviolet: https://github.com/titaniumnetwork-dev/Ultraviolet
- BareMux: https://github.com/MercuryWorkshop/bare-mux
- Epoxy transport: https://github.com/MercuryWorkshop/epoxy-transport
