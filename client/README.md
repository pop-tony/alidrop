# Meridian Trade

Full-stack B2B sourcing marketplace built with React, Vite, Tailwind CSS, and Node.js/Express.

## Run locally

```bash
cd client
npm install
npm --prefix ../server install
npm run dev
```

Run the commands from `client/`. The frontend owns the display catalog in `client/src/data/catalog.js`, while the API owns its dependencies in `server/` and handles server-side actions.

Open the Vite URL printed by the dev server. The API runs on port 3001 and Vite proxies `/api` requests to it. The first server start creates `server/data/store.json`; quote requests, supplier messages, buyer accounts, and supplier applications are persisted there.

## Production

```bash
cd client
npm run build
cd ../server
npm start
```

Express serves the built client from `client/dist` and the API on port 3001.

Set `JWT_SECRET` to a private random value before deployment. The frontend catalog and server-side validation data are demonstration records. Payments, live freight rates, email delivery, and production identity verification need external providers and are not connected in this local implementation.

## Deploy to Vercel

Deploy `server/` as one Vercel project and `client/` as a second Vercel project.

For the server project, add `JWT_SECRET` and `CLIENT_ORIGIN` environment variables. Set `CLIENT_ORIGIN` to the deployed client URL, then redeploy the server. The server entrypoint is `server/api/[...path].js` and exposes the `/api/*` routes.

For the client project, add `VITE_API_URL` with the deployed server URL, without a trailing slash, then redeploy the client. The frontend keeps using relative `/api/...` paths locally through Vite's proxy and uses this URL in production.

Demo tracking number: `MT-20481`.
