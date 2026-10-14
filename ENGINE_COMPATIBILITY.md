# Multi-engine compatibility and deployment status

This repository intentionally does not report an engine as available merely because its browser-side assets exist.

## Current status

| Engine | Frontend assets | Required backend | Current backend match | Status |
| --- | --- | --- | --- | --- |
| Scramjet | Bundled in `scramjet-engine/` | Scramjet controller + BareMux transport + Wisp-compatible transport endpoint | `proxy-wisp` is a Wisp WebSocket TCP relay and is what the current Scramjet page configures | Configured; live browse flow still needs a real target-site test |
| Ultraviolet | Bundled under `public/uv/`; app at `public/index.html` | Ultraviolet service worker + BareMux/Epoxy transport configured for Wisp | The existing UV app already selects Epoxy and connects to the same Supabase Wisp endpoint; the local Chromium browser test passes its target-site navigation | Configured; live GitHub Pages target-site verification pending |
| Rammerhead | Not integrated as a browser-side engine | A separately running Rammerhead Node.js application with its own session/proxy routes | `proxy-wisp` is not a Rammerhead server | Blocked; needs a Node.js host |

## Free-tier deployment implications

- GitHub Pages can host the static UI and existing browser assets; it cannot run the Node.js service required by Rammerhead or a Bare server.
- Supabase currently hosts `proxy-wisp`, which accepts WebSocket upgrades and relays TCP connections using Wisp framing. Scramjet and this repository's existing Ultraviolet/BareMux/Epoxy setup can use that transport. It is not a Rammerhead endpoint.
- Supabase Edge Functions are designed for edge request handlers. The current Ultraviolet app is configured to use Wisp through BareMux/Epoxy, so it does not require us to invent a Bare endpoint for this build. Rammerhead still requires its own compatible Node.js server runtime. Do not assume that requirement is solved by changing a URL.
- A free Node-compatible host may be suitable for the Bare server and Rammerhead, but its current free-tier availability, sleep behavior, WebSocket support, and proxy-use terms must be checked before deployment. No external host is silently assumed or configured here.

## UI behavior

The homepage keeps one destination input and all existing preset options. The engine selector persists the user's choice. Scramjet remains the only engine allowed to navigate until the corresponding backend has been deployed and verified. Selecting Ultraviolet opens the existing `public/index.html` app and passes the normalized destination through its query string, preserving preset launches. Selecting Rammerhead displays the concrete missing dependency and blocks navigation rather than sending the request to an incompatible backend.

## Verification checklist

Before changing an engine's status to available:

1. Confirm its deployed endpoint and expected protocol.
2. Run the endpoint's health/manifest check.
3. Verify WebSocket upgrade behavior where required.
4. Run an actual browser navigation to a controlled HTTPS test page on the deployed GitHub Pages path.
5. Test reload, in-site navigation, and at least one preset for both Scramjet and Ultraviolet.
6. Confirm no cross-engine service-worker or storage collision.
7. Record endpoint and browser test results here.

## Upstream references

- Scramjet App: https://github.com/MercuryWorkshop/Scramjet-App
- Ultraviolet App: https://github.com/titaniumnetwork-dev/Ultraviolet-App
- TOMPHTTP Bare server: https://www.npmjs.com/package/@tomphttp/bare-server-node
- Rammerhead: https://github.com/binary-person/rammerhead
