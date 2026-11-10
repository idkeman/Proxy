# Proxy

A static browser proxy frontend powered by **Ultraviolet**, using the existing Supabase-hosted Wisp TCP transport.

## Deployment

- GitHub Pages: https://idkeman.github.io/Proxy/
- App entry point: `public/index.html` (the repository root redirects here)
- Wisp endpoint: `wss://dkwmkvruzebnqlmvwzhy.supabase.co/functions/v1/proxy-wisp/`
- Browser engine: [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)
- Transport: Epoxy through BareMux

The frontend is static and can be hosted on GitHub Pages. The Wisp transport is a separate Supabase Edge Function and must remain deployed and healthy. The Ultraviolet assets, BareMux files, and Epoxy transport are vendored under `public/`.

## Notes

- The destination field accepts full URLs, hostnames such as `example.com`, and search phrases.
- Presets submit through the same destination field and Ultraviolet navigation path.
- The proxy requires HTTPS and service-worker support.
- This proxy is not an anonymity guarantee. Do not enter sensitive credentials.

## Licensing

Ultraviolet, BareMux, and Epoxy are third-party open-source projects. Review their upstream licenses before redistributing or modifying them.
