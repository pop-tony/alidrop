# Meridian Trade

Full-stack B2B sourcing marketplace built with React, Vite, Tailwind CSS, and Node.js/Express.

## Run locally

```bash
cd client
npm install
npm --prefix ../server install
npm run dev
```

Run the commands from `client/`. The frontend lives in `client/`, and the API owns its dependencies in `server/`.

Open the Vite URL printed by the dev server. The API runs on port 3001 and Vite proxies `/api` requests to it. The first server start creates `server/data/store.json`; quote requests, supplier messages, buyer accounts, and supplier applications are persisted there.

## Production

```bash
cd client
npm run build
cd ../server
npm start
```

Express serves the built client from `client/dist` and the API on port 3001.

Set `JWT_SECRET` to a private random value before deployment. Catalog, supplier, review, and sample shipment data are demonstration records. Payments, live freight rates, email delivery, and production identity verification need external providers and are not connected in this local implementation.

Demo tracking number: `MT-20481`.
