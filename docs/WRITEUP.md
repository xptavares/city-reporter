# City Reporter — Write-up

## The problem

In October 2026, for a university extension course (PIEX, UCPel), I interviewed the Urban Planning
Department of Pelotas, Brazil. The Director of Urban Planning named their main difficulty
directly: **no up-to-date data** on where public spaces are failing. There is a large backlog,
places deteriorate over time, and without knowing where the problems are, the department can't
prioritize. My group also interviewed a school for visually impaired people, who know every
barrier in the city — when asked which infrastructure helps them move safely, they answered
"None." **The people who know where the problems are aren't connected to the people who need the
data.** Details: [PROBLEM.md](PROBLEM.md).

## My approach

A responsive web app that turns citizen reports into structured, geolocated data:

- **Citizens** report a problem (category + GPS or a pin on the map) and **upvote** reports that
  affect them.
- **Agents** (department staff) see reports **sorted by upvotes** and mark them `fixed` or
  `not_found` ("we checked, it's not there").

I wrote the docs before the code — problem → user flows → architecture → decision log — and built
on them: a TypeScript monorepo with Express + Sequelize, **PostgreSQL + PostGIS**, **Redis**,
React + Leaflet on OpenStreetMap (the department already uses OSM), and i18n in Portuguese,
English and Spanish. 34 API tests run against real Postgres and Redis.

## Key decisions and trade-offs

Full log of 14 decisions: [DECISIONS.md](DECISIONS.md). The main ones:

- **General urban problems, with accessibility as a category** — the data gap is city-wide;
  accessibility stays a first-class category so that signal isn't lost.
- **Accounts for everyone** — more friction, but it stops bot floods. In production: identity
  tied to CPF via gov.br.
- **Only agents change status; citizen upvotes are a priority signal**, so votes can't be gamed
  to close real problems.
- **Users never identify each other** — no author on any response, enforced by a test.
- **PostGIS** for indexed "reports in this map area" queries, at the cost of one extension.
- **Redis cache-aside, cached per map tile** (not per viewport) so neighbors share entries;
  versioned keys for race-safe invalidation; upvotes don't invalidate the map; **fail-open** if
  Redis is down. Cost: up to 60 s staleness on the agent list.
- **Responsive web, not native** — fits three days and still has GPS; no push notifications.

## How I used AI tools

I used **Claude Code** throughout. I chose the problem from my own fieldwork and made the
product decisions (scope, statuses, upvotes, accounts, caching, i18n); the AI drafted the docs
and wrote most of the code against them, logging each decision as we went. What worked:

- **Docs first** gave the AI enough context for a coherent data model and cache design.
- **Turning rules into tests** (privacy, concurrent upvotes, cache HIT/MISS/BYPASS) keeps them from
  silently regressing.
- **Having the AI drive a real browser** (Playwright) caught bugs types and API tests missed: a
  lost deep link after login, Portuguese plurals, a hanging seed script.
- **My own manual testing** still found pagination bugs the AI didn't.

The AI also flagged that our signed consent form forbids naming interviewees, so the repo uses
roles only. Log: [AI-USAGE.md](AI-USAGE.md).

## What I'd do next

Photo evidence (citizens when reporting, agents when closing); duplicate detection with PostGIS
before creating a report; gov.br identity and rate limiting; end-to-end tests; code splitting;
and a pilot with the department and the Louis Braille school. See [NEXT-STEPS.md](NEXT-STEPS.md).
