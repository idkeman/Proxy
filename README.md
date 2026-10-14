# Proxy

A static browser proxy frontend powered by Scramjet, with the existing Supabase-hosted Wisp TCP transport.

## Deployment

- GitHub Pages: https://idkeman.github.io/Proxy/
- Wisp endpoint: `wss://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/`
- Browser engine: [Scramjet](https://github.com/MercuryWorkshop/scramjet)
- Reference application: [Scramjet STATIC](https://github.com/hahahah67-pixel/scramjet-static)

The frontend is static and can be hosted on GitHub Pages. The Wisp transport is a separate service and must remain deployed and healthy. The Scramjet WASM asset is currently loaded from the upstream Scramjet STATIC repository; for a fully self-contained deployment, vendor that binary into this repository and update the `files.wasm` path in `index.html`.

## Troubleshooting

1. Open `https://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/healthz` to check that the transport function responds.
2. If the page gets stuck on “Connecting transport…”, check the browser console and verify the Epoxy transport module is reachable.
3. GitHub Pages cannot run `src/index.js`; it serves only static files.
4. This proxy is not an anonymity guarantee. Do not enter sensitive credentials.

## Licensing

Scramjet and Epoxy are third-party open-source projects. Review their upstream licenses before redistributing or modifying their files.
