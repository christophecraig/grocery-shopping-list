# grocery-shopping-list

Ultra-simple shared grocery list. One person adds items, the other checks them off in the store.

- **Frontend:** a single static page (`public/index.html`), installable as a PWA.
- **Backend:** one Netlify Function (`netlify/functions/api.mjs`) storing the list as JSON in **Netlify Blobs** (no database to manage).
- **Auth:** one shared password, read from the `APP_PASSWORD` environment variable.

## Features

- Add / check / remove items, synced between phones (auto-refresh every 5 s).
- "Shopping done" archives the current list and starts a fresh empty one (undo available).
- Last 20 lists kept as history; item names are suggested from past lists.
- Works offline for reading (cached list); editing needs a connection.

## Deploy on Netlify

1. Import this repo as a new site (no build command, publish directory `public`, already set in `netlify.toml`).
2. Add the environment variable `APP_PASSWORD` (Site configuration → Environment variables), then redeploy.
3. Open the site on each phone and use "Add to Home Screen".
