# Multi-engine compatibility and deployment status

This repository intentionally does not report an engine as available merely because its browser-side assets exist.

## Current status

| Engine | Frontend assets | Required backend | Current backend match | Status |
| --- | --- | --- | --- | --- |
| Scramjet | Bundled in `scramjet-engine/` | Scramjet controller + BareMux transport + Wisp-compatible transport endpoint | `proxy-wisp` is a Wisp WebSocket TCP relay and is what the current Scramjet page configures | Configured; live browse flow still needs a real target-site test |
| Ultraviolet | Bundled under `public/uv/` | Ultraviolet service worker + TOMPHTTP Bare server endpoint (HTTP and WebSocket upgrade routes) | `proxy-wisp` speaks Wisp, not the Bare protocol | Blocked; do not route traffic to Wisp |
| Rammerhead | Not integrated as a browser-side engine | A separately running Rammerhead Node.js application with its own session/proxy routes | `proxy-wisp` is not a Rammerhead server | Blocked; needs a Node.js host |

## Free-tier deployment implications

- GitHub Pages can host the static UI and existing browser assets; it cannot run the Node.js service required by Rammerhead or a Bare server.
- Supabase currently hosts `proxy-wisp`, which accepts WebSocket upgrades and relays TCP connections using Wisp framing. It is not a generic HTTP reverse proxy and must not be reused as a Bare or Rammerhead endpoint.
- Supabase Edge Functions are designed for edge request handlers. A working UV deployment requires a tested Bare-protocol implementation; Rammerhead requires its own compatible Node.js server runtime. Do not assume these are solved by changing a URL.
- A free Node-compatible host may be suitable for the Bare server and Rammerhead, but its current free-tier availability, sleep behavior, WebSocket support, and proxy-use terms must be checked before deployment. No external host is silently assumed or configured here.

## UI behavior

The homepage keeps one destination input and all existing preset options. The engine selector persists the user's choice. Scramjet remains the only engine allowed to navigate until the corresponding backend has been deployed and verified. Selecting Ultraviolet or Rammerhead displays the concrete missing dependency and blocks navigation rather than sending the request to an incompatible backend.

## Verification checklist

Before changing an engine's status to available:

1. Confirm its deployed endpoint and expected protocol.
2. Run the endpoint's health/manifest check.
3. Verify WebSocket upgrade behavior where required.
4. Run an actual browser navigation to a controlled HTTPS test page.
5. Test reload, in-site navigation, and at least one preset.
6. Confirm no cross-engine service-worker or storage collision.
7. Record endpoint and browser test results here.

## Upstream references

- Scramjet App: https://github.com/MercuryWorkshop/Scramjet-App
- Ultraviolet App: https://github.com/titaniumnetwork-dev/Ultraviolet-App
- TOMPHTTP Bare server: https://www.npmjs.com/package/@tomphttp/bare-server-node
- Rammerhead: https://github.com/binary-person/rammerhead
