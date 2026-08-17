# -1 DAYS

A browser-based, real-time multiplayer board game (2–8 players) themed around cyber
security, built as a social-deduction game with its own rule set. See [`DESIGN.md`](DESIGN.md) for the
architecture and [`PLAYER_GUIDE.md`](PLAYER_GUIDE.md) for how to actually play.

## Project layout

```
shared/           Card catalog, types, enums — single source of truth for client + services
db/               Prisma schema + client (Postgres) — used only by auth & matchmaking
services/
  engine/         Authoritative game-rules engine (in-memory state, no DB)
  matchmaking/    Lobby/queue, room codes, match history (Postgres)
  gateway/        Public Socket.IO endpoint the client talks to (thin relay, no game logic)
  bots/           AI seat runner (Random / Rule / Alpha-beta strategies)
  auth/           Google OAuth login, issues app JWTs (Postgres)
client/           React + Vite SPA (fully self-contained; only talks to gateway + auth)
scripts/          generate-assets.mjs — one-time persona portrait fetch (DiceBear)
```

## Prerequisites

- Node.js 20+
- A Postgres database (only `auth` and `matchmaking` need it) — either:
  - `docker compose up -d` (uses the included `docker-compose.yml`), or
  - any Postgres 14+ instance you already have.

## Local setup

```bash
npm install

# one .env per service that needs one — copy the examples and adjust if needed
cp services/engine/.env.example services/engine/.env
cp services/matchmaking/.env.example services/matchmaking/.env
cp services/gateway/.env.example services/gateway/.env
cp services/bots/.env.example services/bots/.env
cp services/auth/.env.example services/auth/.env
cp db/.env.example db/.env
cp client/.env.example client/.env

# build the shared package + Prisma client, then apply the initial migration
npm run build:shared
npm run build -w @minus1days/db
npm run migrate:deploy -w @minus1days/db

# run everything (5 services + client dev server) concurrently
npm run dev
```

The client dev server prints its local URL (Vite default `http://localhost:5173`). Open it,
use "Dev quick login" (no Google credentials needed locally), create a room, add a couple of
AI bots to fill seats, and start.

### Google OAuth (optional for local dev)

`auth`'s `/auth/dev-login` endpoint is enabled whenever `NODE_ENV !== production`, so you can
develop and test the whole app without setting up real Google OAuth credentials. To wire up
real "Sign in with Google": create an OAuth 2.0 Client ID (Web application) in the Google Cloud
Console, set `GOOGLE_CLIENT_ID` in `services/auth/.env` and `VITE_GOOGLE_CLIENT_ID` in
`client/.env` to the same client id, and add your dev/prod origins to the client's authorized
JavaScript origins.

### Running a quick bot-vs-bot sanity check without the client

Since `engine` and `bots` have no DB dependency, you can smoke-test the rules engine directly:
start just those two (`npm run dev:engine`, `npm run dev:bots`), `POST` a `/games/:roomId` to
the engine with a few `BOT` seats and the bots service's URL as a subscriber, and poll
`GET /games/:roomId/view/:playerId` to watch it play out.

## Deploy to Render

`render.yaml` defines a Blueprint: a Postgres database, the 5 Node services, and the client as
a static site. Render assigns each service's public URL only *after* its first deploy, so the
wiring is a two-step process:

1. Push this repo to GitHub, then in Render: **New → Blueprint**, point it at the repo. This
   creates all 6 resources; the interdependent `*_URL` env vars are left blank (`sync: false`)
   in the blueprint, so the cross-referencing services will fail to talk to each other until
   step 2.
2. Once every service has deployed once (and therefore has a `https://<name>.onrender.com`
   URL), open each service's **Environment** tab and fill in the blank vars from `render.yaml`
   with the real URLs (e.g. `matchmaking`'s `ENGINE_URL` = the engine service's URL), plus
   `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` if you're wiring up real Google login. Redeploy.

`JWT_SECRET` must be identical across `auth`, `matchmaking`, and `gateway` — the blueprint only
`generateValue`s it once (on `matchmaking`); copy that same value into the other two services'
env vars.
