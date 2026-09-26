# NPX Amazon Control Center

A live operations dashboard for the NPX Amazon wholesale (BeautyFort) business. It renders
directly from the same Postgres database the n8n automation pipeline writes to — nothing on
the page is estimated or AI-generated.

## How it works

- The n8n workflow **"Dashboard Data API (39)"** exposes a webhook (`GET /webhook/dashboard-api`)
  that runs a single read-only query across the pipeline's tables (daily controller summary,
  buy candidates, PO pipeline, cashflow, account health, alerts, returns) and returns one JSON
  payload.
- This Next.js app's home page (`app/page.tsx`) is a server component that fetches that payload
  on every request (no caching) and renders it.
- Requests to the webhook must include an `x-dashboard-key` header matching the secret configured
  in the workflow's "Check Auth" node.

## Setup

1. Copy `.env.example` to `.env.local` (for local dev) and fill in:
   - `DASHBOARD_API_URL` — the n8n webhook's production URL.
   - `DASHBOARD_API_KEY` — the shared secret from the "Check Auth" node.
2. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```
3. On Vercel: add the same two environment variables under Project Settings → Environment
   Variables (Production, and Preview if you want preview deploys to work too), then deploy.

## Project structure

- `app/page.tsx` — the dashboard itself.
- `lib/fetchDashboard.ts` — server-side fetch against the n8n webhook.
- `lib/types.ts` — TypeScript shape of the API payload.
- `lib/format.ts` — currency/percentage/date formatting helpers.
- `components/` — small presentational pieces (stat tiles, badges, tables).

## Extending it

The webhook's SQL query lives in the n8n workflow "Dashboard Data API (39)" (node "Fetch
Dashboard Data"). To surface more data, add a key to that query's `json_build_object(...)` and
a matching field in `lib/types.ts`, then render it in `app/page.tsx`.
