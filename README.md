# City Reporter

Citizens of Pelotas (Brazil) report problems in public spaces — potholes, broken sidewalks,
missing tactile paving — on a map, and upvote the ones that affect them. The Municipal Urban
Planning Department gets an up-to-date, prioritized list of where to act. Built from field
interviews with the department, whose main complaint was **the lack of up-to-date data**
(see [docs/PROBLEM.md](docs/PROBLEM.md)).

Responsive web app (works on phones), available in **Portuguese, English and Spanish**.

## Requirements

- Node.js 22+ (developed on 24) and npm 10+
- Docker with Docker Compose

## Getting started

```bash
cp .env.example .env     # ports and connection strings
npm install
npm run infra:up         # Postgres + PostGIS and Redis in Docker
npm run db:migrate       # create tables
npm run db:seed          # demo data in Pelotas (wipes existing data!)
npm run dev              # API on :4000 and web on :5180
```

Open http://localhost:5180.

### Demo accounts (from the seed)

| Role | Email | Password |
|------|-------|----------|
| Agent (Urban Planning Dept.) | `agent@cityreporter.local` | `password123` |
| Citizen | `citizen@cityreporter.local` | `password123` |

Default ports are non-standard on purpose, so the project doesn't clash with a local Postgres,
Redis or other dev servers. Change them in `.env` if needed:

| Service | Port |
|---------|------|
| Web (Vite) | 5180 |
| API (Express) | 4000 |
| Postgres | 5433 |
| Redis | 6380 |

## Running tests

```bash
npm run infra:up   # tests run against a separate `city_reporter_test` database
npm test           # migrations are applied to the test DB automatically
npm run typecheck
```

Tests use their own Postgres database (`TEST_DATABASE_URL`) and Redis logical DB
(`TEST_REDIS_URL`, db 1), and refuse to run if those point at the dev ones.

### Seeing the cache work

Cached endpoints (`/api/reports/map`, `/api/reports/:id`, `/api/reports`, `/api/auth/me`) return an
`X-Cache: HIT | MISS | BYPASS` header. Request the same one twice: `MISS`, then `HIT`. Stop Redis
(`docker compose stop redis`) and the API keeps answering with `BYPASS`.

## Repository layout

```
apps/api         Express + Sequelize REST API
apps/web         React + Vite + Tailwind + Leaflet web app (i18n: pt, en, es)
packages/shared  enums, types and schemas shared by API and web
```

## Project docs

- [Problem](docs/PROBLEM.md)
- [User flows](docs/USER-FLOWS.md)
- [System architecture](docs/SYSTEM-ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Write-up](docs/WRITEUP.md)
- [AI usage](docs/AI-USAGE.md)
- [Next steps](docs/NEXT-STEPS.md)
