# System Architecture

How City Reporter is built. Product behavior is defined in `docs/USER-FLOWS.md`; the reasons
behind each choice are in `docs/DECISIONS.md`.

## Overview

```
 Browser (mobile-first responsive web)
 ┌──────────────────────────────────────┐
 │ apps/web  React + Vite + Leaflet/OSM │
 └──────────────────┬───────────────────┘
                    │ HTTPS / JSON (JWT in Authorization header)
 ┌──────────────────▼───────────────────┐
 │ apps/api  Express + Sequelize        │
 │  routes → controllers → services     │
 └───────┬───────────────────┬──────────┘
         │ cache-aside       │ SQL
 ┌───────▼───────┐   ┌───────▼─────────────┐
 │ Redis         │   │ PostgreSQL + PostGIS│
 │ (read cache)  │   │ (source of truth)   │
 └───────────────┘   └─────────────────────┘
```

- **PostgreSQL + PostGIS** is the source of truth. Every report is a geographic point.
- **Redis** is a read cache in front of the hottest queries. It is never the source of truth: if
  Redis is down, the API falls back to the database (fail-open).
- Everything runs locally with **Docker Compose** (Postgres + Redis) and npm scripts (API + web).

## Repository layout (monorepo)

npm workspaces, TypeScript everywhere.

```
city-reporter/
├── apps/
│   ├── api/                 Express REST API
│   │   └── src/
│   │       ├── routes/      HTTP routing + auth guards
│   │       ├── controllers/ request/response mapping, validation
│   │       ├── services/    business rules (statuses, upvotes, cache invalidation)
│   │       ├── models/      Sequelize models
│   │       ├── cache/       Redis client + key builders
│   │       ├── db/          Umzug migrations, migrate CLI, demo seed
│   │       └── middleware/  auth (JWT), error handler
│   └── web/                 React SPA
│       └── src/
│           ├── pages/       Map, NewReport, AgentReports, Login, SignUp
│           ├── components/
│           └── api/         typed API client
├── packages/
│   └── shared/              types, enums (categories, statuses, roles), zod schemas
├── docker-compose.yml       postgres (postgis) + redis
└── docs/
```

`packages/shared` holds the **zod schemas** for request payloads: the API uses them to validate
input and the web app uses the same schemas for its forms, so both sides can't drift apart.

## Tech stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript (Node.js LTS) |
| API | Express 5, Sequelize 6, zod, bcryptjs, jsonwebtoken, Umzug (migrations) |
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |
| Web | React, Vite, React Router, TanStack Query, react-leaflet + OpenStreetMap tiles |
| Tests | Vitest + Supertest (API against real Postgres/Redis from Docker Compose) |
| Local infra | Docker Compose |

## Data model

```
users                          reports                               upvotes
─────────────────────          ───────────────────────────────       ─────────────────────
id            uuid PK          id                 uuid PK            user_id    uuid FK ┐ PK
name          text             category           enum               report_id  uuid FK ┘
email         text unique      description        text null          created_at timestamptz
password_hash text             location           geography(Point)
role          enum             status             enum
created_at    timestamptz      upvote_count       int default 0
                               created_by         uuid FK → users
                               status_changed_by  uuid FK → users null
                               status_changed_at  timestamptz null
                               created_at / updated_at
```

- **Enums** (defined once in `packages/shared`):
  - `role`: `citizen`, `agent`
  - `status`: `open`, `fixed`, `not_found`
  - `category`: `pothole`, `broken_sidewalk`, `missing_tactile_paving`, `sidewalk_obstruction`,
    `lighting`, `signage`, `other`
- **`location`** is `geography(Point, 4326)` (lat/lng) with a **GiST index**, so "reports inside
  the visible map area" is an indexed query.
- **`upvote_count`** is denormalized on `reports` so "sort by most upvoted" doesn't need a
  `COUNT(*)` join. It is updated in the **same transaction** as the insert/delete on `upvotes`.
- **`upvotes`** has a composite primary key `(user_id, report_id)`: the database itself enforces
  one upvote per citizen per report.

## API

All endpoints are JSON under `/api`. 🔒 = requires login, 🛡️ = agent only.

| Method | Path | Who | Flow |
|--------|------|-----|------|
| POST | `/auth/register` | public | U1 – citizen sign up |
| POST | `/auth/login` | public | U2 – returns a JWT |
| GET | `/auth/me` | 🔒 | current user + role |
| GET | `/reports/map?bbox=minLng,minLat,maxLng,maxLat` | 🔒 | C2 – pins in the visible area |
| GET | `/reports/:id` | 🔒 | C2 – report details (+ whether I upvoted it) |
| POST | `/reports` | 🔒 | C1 / A2 – create report |
| PUT | `/reports/:id/upvote` | 🔒 | C3 – upvote (idempotent) |
| DELETE | `/reports/:id/upvote` | 🔒 | C3 – remove upvote |
| GET | `/reports?status=&category=&sort=upvotes\|recent&page=` | 🛡️ | A1 – agent list |
| PATCH | `/reports/:id/status` | 🛡️ | A3 / A4 – set `fixed` or `not_found` |

Notes:
- **Map vs. details are split on purpose.** `/reports/map` returns lightweight pins (id,
  category, status, lat/lng) — no upvote counts. Details come from `/reports/:id`. This keeps the
  map payload small and lets upvotes change without invalidating the map cache (see below).
- Agent accounts are created by a **seeder** (no public sign-up for agents). `/auth/register`
  always creates a `citizen`, whatever the payload says.
- **Upvotes are idempotent:** `PUT` twice keeps one upvote; `DELETE` without an upvote is a no-op.
  Both return `{ upvoteCount, upvotedByMe }`. Upvoting is allowed on any status.
- **Status changes:** agents can set any status, including back to `open` (e.g. to undo a mistake).
- **Errors:** `{ error }`, plus `issues: [{ path, message }]` on validation failures (400).

## Caching (Redis)

**Pattern: cache-aside.** On read, try Redis; on miss, query Postgres and store the result with a
TTL. On write, invalidate the affected keys. If Redis errors, log it and serve from Postgres.

**Invalidation strategy: versioned namespaces.** Instead of hunting down every key a write
affects, each group of keys includes a version number. A write does `INCR` on the version, so all
old keys become unreachable instantly and expire on their own via TTL. Simple and hard to get
wrong.

### Keys

| Key | Value | TTL | Invalidated when |
|-----|-------|-----|------------------|
| `cr:map:v{mapVer}:tile:{z}:{x}:{y}` | pins (id, category, status, lat/lng) in one map tile | 10 min | report created or status changed → `INCR cr:map:ver` |
| `cr:report:{id}` | report details (without per-user fields) | 10 min | report status changed or upvoted → `DEL` |
| `cr:list:v{listVer}:{hash(filters, sort, page)}` | one page of the agent list | 60 s | report created, status changed or upvoted → `INCR cr:list:ver` |
| `cr:user:{id}` | `/auth/me` payload (id, name, email, role) — never the password hash | 10 min | user data or role changed → `DEL` |

Design notes:
- **Map tiles instead of raw bounding boxes.** Every user's viewport is slightly different, so
  caching by exact `bbox` would almost never hit. The API snaps the requested bbox to fixed
  **slippy-map tiles** at one zoom level, loads each tile from cache (or DB), and merges them.
  Users looking at the same neighborhood share the same cache entries.
- **Upvotes don't touch the map cache.** Pins don't carry upvote counts, so the most frequent write
  (upvotes) only invalidates the report details and the agent list — not the map.
- **Per-user data is never in shared keys.** "Did I upvote this?" is read from Postgres (a primary
  key lookup) and merged into the cached details.
- **Short TTL on the agent list.** It changes with every upvote; 60 s plus version bumps keeps it
  fresh while still absorbing repeated reloads and pagination.

## Privacy: users can't identify each other

**No API response ever exposes another user's identity.** Report payloads (map pins, details,
agent list) never include `created_by`, `status_changed_by`, or who upvoted — only counts.
The only user data the API returns is the caller's own, via `/auth/me`. Author and upvote records
stay in the database for integrity (one upvote per user, abuse tracing) but are never serialized.

## Authentication & authorization

- Passwords hashed with **bcrypt**.
- Login returns a signed **JWT** (`sub`, `role`, short expiry), sent as `Authorization: Bearer`.
- Middleware: `requireAuth` (any logged-in user) and `requireRole('agent')`.
- Citizens self-register; agents are seeded.

## Frontend

Mobile-first responsive web app — citizens use it on their phones in the street.

| Route | Who | Content |
|-------|-----|---------|
| `/login`, `/signup` | public | auth forms |
| `/` | 🔒 | full-screen map with pins; tap a pin → details sheet with upvote button |
| `/report/new` | 🔒 | category menu → "use my location" (browser Geolocation API) or pick on map → description |
| `/agent/reports` | 🛡️ | table/list sorted by most upvoted, filters, status actions |

- **TanStack Query** handles fetching, caching on the client and refetching after mutations.
- **react-leaflet** with **OpenStreetMap** tiles — the same open map the department already uses.

## Main flows

**Create report (C1):** web validates with shared zod schema → `POST /reports` → API validates
again → insert into Postgres → `INCR cr:map:ver`, `INCR cr:list:ver` → 201.

**Open map (C2):** web sends visible bbox → API snaps to tiles → for each tile, Redis hit or
PostGIS query (`location && ST_MakeEnvelope(...)`) and cache → merged pins returned.

**Upvote (C3):** `PUT /reports/:id/upvote` → transaction: lock the report row
(`SELECT … FOR UPDATE`), insert into `upvotes` (no-op if it already exists), and only if inserted
`upvote_count + 1`. The lock serializes concurrent upvotes so the count never drifts → `DEL cr:report:{id}`, `INCR cr:list:ver`.

**Change status (A3/A4):** agent `PATCH /reports/:id/status` → update status,
`status_changed_by/at` → `DEL cr:report:{id}`, `INCR cr:map:ver`, `INCR cr:list:ver`.
