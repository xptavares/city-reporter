# Decisions

Log of significant decisions, newest at the bottom. Each entry: context, options considered,
decision, and trade-offs.

<!--
## NNN – Title (YYYY-MM-DD)

**Context:** what prompted the decision.
**Options:** A, B, C.
**Decision:** what we chose.
**Why / trade-offs:** what we gain and what we give up.
-->

## 001 – Scope: general urban problems, not accessibility-only (2026-10-29)

**Context:** In the interview, the Director of Urban Planning suggested a dedicated app for
reporting accessibility problems. Her stated main difficulty, however, was the lack of
up-to-date data on the whole backlog of public spaces.
**Options:** (A) accessibility-only reporting; (B) general urban public-space problems.
**Decision:** B, with accessibility barriers as a first-class category.
**Why / trade-offs:** The data gap is city-wide, so a general tool addresses the department's
actual pain and gets more reports. The cost is a less narrow product; we mitigate it by keeping
accessibility as an explicit category so that signal is not lost.

## 002 – Interviewees identified by role only (2026-10-29)

**Context:** The interview notes contain interviewees' names; the repo may be public.
**Decision:** Refer to interviewees only by role in all repo docs.
**Why / trade-offs:** The signed consent form (TCLE) guarantees that participants' names and any
identifying data are kept confidential.

## 003 – Report statuses: open, fixed, not_found (2026-10-29)

**Context:** Agents need to record not only that a problem was fixed, but also that they went to
the location and the problem was not there — so the department knows it has already looked at it.
**Options:** (A) `open`/`fixed` only; (B) add `not_found` for "checked on site, not found".
**Decision:** B. Only agents change status; citizen votes are a prioritization signal and never
change status automatically.
**Why / trade-offs:** `not_found` keeps the record of the department's work instead of deleting
or silently closing reports. Keeping status agent-only avoids votes being gamed to close real
problems, at the cost of depending on agents to keep statuses current.

## 004 – Accounts required for everyone (2026-10-29)

**Context:** Anonymous reporting and voting is the lowest-friction option for citizens, but lets
bots flood the system with fake reports and votes.
**Options:** (A) anonymous; (B) email + password accounts for all, with `citizen`/`agent` roles;
(C) accounts tied to a national ID (CPF / gov.br).
**Decision:** B for the MVP. Agent accounts are created by the department, not self sign-up.
**Why / trade-offs:** Accounts give one identity per vote and make abuse traceable, at the cost of
some friction for citizens. Email accounts can still be mass-created, so C is the production
target (see `docs/NEXT-STEPS.md`); it is out of scope for a local MVP.

## 005 – Votes are upvotes ("likes"), used to rank reports (2026-10-29)

**Context:** Agents need to know which problems matter most to prioritize interventions.
**Options:** (A) "still there" / "fixed" votes to validate reports; (B) a single upvote, like a
social-media "like".
**Decision:** B. One upvote per citizen per report (toggle on/off). Agents sort reports by most
upvoted.
**Why / trade-offs:** Upvotes turn citizen input into a simple priority ranking, which is the
department's actual need. We lose citizen-driven validation of whether a problem still exists;
that stays with agents (`fixed` / `not_found`, decision 003).

## 006 – Monorepo with TypeScript on both sides (2026-10-29)

**Options:** (A) separate repos; (B) monorepo with npm workspaces; JavaScript vs. TypeScript.
**Decision:** B with TypeScript: `apps/api`, `apps/web`, `packages/shared`.
**Why / trade-offs:** One repo is easier to run and review. A shared package lets API and web use
the same enums, types and zod schemas, so they can't drift apart. TypeScript adds some setup but
catches contract mistakes at compile time.

## 007 – Responsive web app instead of a native mobile app (2026-10-29)

**Options:** (A) native/React Native app; (B) mobile-first responsive web.
**Decision:** B.
**Why / trade-offs:** Fits a 3-day timeline, needs no app store, and still gives citizens GPS via
the browser Geolocation API. We lose push notifications and offline use (see `NEXT-STEPS.md`).

## 008 – PostgreSQL + PostGIS, Express + Sequelize (2026-10-29)

**Options:** Postgres with plain lat/lng columns vs. PostGIS; Sequelize vs. Prisma.
**Decision:** Postgres + PostGIS (`geography(Point)` with a GiST index), accessed via Sequelize.
**Why / trade-offs:** The whole product is geographic; PostGIS makes "reports in this map area"
an indexed query and opens the door to proximity queries (e.g. duplicate detection). Sequelize
supports the `GEOMETRY`/`GEOGRAPHY` types natively, where Prisma's PostGIS support is limited.
Cost: one more extension to set up, handled by the PostGIS Docker image.

## 009 – Redis read cache, cache-aside with versioned keys (2026-10-29)

**Context:** The map is the most-read screen and is hit by every citizen.
**Decision:** Redis cache-aside in front of map pins, report details and the agent list.
Invalidation by bumping a version counter per key group; map cached per slippy-map tile rather
than per exact bounding box; upvote counts kept out of map pins so upvotes don't invalidate the
map. Fail-open: if Redis is down, serve from Postgres.
**Why / trade-offs:** Versioned keys avoid fragile key-by-key invalidation, at the cost of some
dead keys living until their TTL. Short TTLs mean a little staleness is possible (≤ 60 s on the
agent list). `/auth/me` is also cached per user (`cr:user:{id}`).

## 010 – Users can never identify each other (2026-10-29)

**Context:** Reporting problems near one's home can reveal where a person lives or moves;
citizens should feel safe reporting.
**Decision:** No API response exposes another user's identity: no author on reports, no list of
who upvoted, only counts. Author and upvote rows stay in the database for integrity and abuse
tracing but are never serialized.
**Why / trade-offs:** Protects reporters' privacy and keeps the cache simple (no per-user data in
shared keys). Agents can't contact a reporter for more details; acceptable for the MVP.

## 011 – Migrations with Umzug; upvote count kept consistent with a row lock (2026-10-29)

**Context:** We need versioned schema changes in TypeScript, and a denormalized `upvote_count`
that never drifts from the `upvotes` table.
**Options (migrations):** `sequelize.sync()`; `sequelize-cli`; Umzug (the library behind
sequelize-cli). **Options (count):** `COUNT(*)` on read; atomic `UPDATE … + 1`; row lock.
**Decision:** Umzug migrations written in TypeScript and run with `tsx` — `sync()` is not safe for
real schema evolution and `sequelize-cli` has poor TS/ESM support. Upvotes run in a transaction
that locks the report row, inserts the upvote (idempotent) and only then updates the count.
**Why / trade-offs:** The lock makes concurrent upvotes on the same report wait for each other — a
negligible cost at city scale — and a test proves 10 concurrent upvotes yield exactly 10.
`bcryptjs` (pure JS) was chosen over native `bcrypt` to avoid native builds; it's slower, which
doesn't matter for login volumes.
