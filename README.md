# Proxy

A GitHub Pages frontend for Ultraviolet, using a Supabase Edge Function for the Wisp TCP WebSocket transport.

## Deployment

- Frontend: https://idkeman.github.io/Proxy/
- Wisp transport: `wss://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/`
- Supabase project: `dkwmkvruzebnqlmvwzhy`

GitHub Pages is static hosting and cannot run the Node server in `src/index.js`. The browser frontend uses the Supabase Edge Function for Wisp TCP streams.

## Supabase function

Source: `supabase/functions/proxy-wisp/index.ts`

Deploy/update from a Supabase CLI environment:

~~~bash
supabase functions deploy proxy-wisp --no-verify-jwt
~~~

JWT verification is disabled because browser WebSocket APIs cannot attach the usual Authorization header. The function limits destinations to ports 80 and 443, rejects private IPv4 destinations, and limits each WebSocket session to 64 streams. Do not remove those restrictions.

Health check:
`https://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/healthz`

The optional `/healthz?tcp=1` check tests outbound TCP to example.com:80.

## Local Node backend

~~~bash
npm install
npm start
~~~

Then open http://localhost:8080.

## Project structure

- `index.html` — GitHub Pages landing page and presets.
- `public/` — Ultraviolet app, service worker, and browser assets.
- `supabase/functions/proxy-wisp/index.ts` — Supabase WebSocket-to-TCP transport.
- `src/index.js` — original local Node/Express backend.

## Safety

This is a web proxy, not an anonymity guarantee. The operator can observe destination domains and connection metadata. Do not enter sensitive credentials. The Edge Function currently supports TCP streams for ports 80 and 443; UDP is not implemented.
