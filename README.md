# City Reporter

_One-line description — to be written once the problem is defined (see [docs/PROBLEM.md](docs/PROBLEM.md))._

## Requirements

- Node.js 22+ (developed on 24) and npm 10+
- Docker with Docker Compose

## Getting started

```bash
cp .env.example .env     # ports and connection strings
npm install
npm run infra:up         # Postgres + PostGIS and Redis in Docker
npm run dev              # API on :4000 and web on :5180
```

Open http://localhost:5180.

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
npm test
npm run typecheck
```

## Repository layout

```
apps/api         Express + Sequelize REST API
apps/web         React + Vite web app
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
