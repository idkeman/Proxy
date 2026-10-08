# Proxy

A custom web workspace built around [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet), with an original landing page, address bar, quick links, and an in-browser view.

> **Hosting note:** GitHub Pages is static hosting. It can serve the front page in this repository, but it cannot run the Node.js server or the WebSocket transport Ultraviolet needs. The backend must be deployed separately on a host that permits this type of traffic and supports HTTPS and WebSockets.

## Deploy the proxy backend

1. Fork or use this repository in your GitHub account.
2. Create a web service on a Node.js hosting provider that permits proxy workloads. This repository includes a `render.yaml` blueprint for Render; you can also deploy manually on a compatible host.
3. Use Node.js 24 or newer. The build command is `npm install` and the start command is `npm start`.
4. Wait for the service to finish installing and start. Check `https://YOUR-SERVER/healthz`; a healthy server responds with `{"status":"ok"}`.
5. The server must provide HTTPS and WebSocket upgrade support. The proxy's Wisp transport uses the `/wisp/` WebSocket path.

Hosting providers have different acceptable-use policies. Check the provider's rules before deploying a proxy; do not use a service that prohibits open proxies or proxy traffic.

## Use the GitHub Pages front page

1. Deploy the Node.js backend first, as above.
2. In this repository, open **Settings → Pages** and publish from the `main` branch and the repository root.
3. Open the resulting GitHub Pages URL.
4. Under **Your proxy server**, paste the HTTPS base URL provided by your host, such as `https://your-service.example`, then press **Save server**.
5. Enter a URL or search phrase and press **Go**. The page will open that destination on your backend, where the Ultraviolet service worker and Wisp transport run.

The server URL is stored in local browser storage for the GitHub Pages origin. You can also open the backend URL directly; it serves the same Proxy interface and does not need the Pages front end.

## Run locally

You need Node.js 24 or newer:

~~~bash
npm install
npm start
~~~

Then open `http://localhost:8080`. Service workers are allowed on localhost for development. For public deployment, use a valid HTTPS domain.

## Project structure

- `index.html` — static GitHub Pages front door with a backend URL setting.
- `public/` — the actual Proxy interface served by the Node.js app.
- `src/index.js` — Express server, Ultraviolet assets, and Wisp WebSocket route.
- `render.yaml` — deployment blueprint example.
- `package.json` — server and Ultraviolet dependencies.

## Important notes

- Ultraviolet's upstream repository currently says it is no longer actively maintained and has been superseded by [Scramjet](https://github.com/MercuryWorkshop/scramjet). This project uses Ultraviolet because that is what this repository was requested to use.
- This is a proxy, not an anonymity guarantee. The server operator can observe connection metadata and destination domains. Avoid entering sensitive credentials into a proxy you do not control, and respect the network and website rules that apply to you.
- The app follows the upstream Ultraviolet-App deployment pattern. See [Ultraviolet-App](https://github.com/titaniumnetwork-dev/Ultraviolet-App) and the [Ultraviolet project](https://github.com/titaniumnetwork-dev/Ultraviolet) for upstream documentation and licensing details.
