# AI Usage Log

How AI tools were used while building this project. Feeds the "How I used AI tools" section of
the write-up.

## Tools

- Claude Code (Opus) — planning, docs, implementation, review.

## Log

<!--
### YYYY-MM-DD – Topic

**Delegated:** what I asked the AI to do.
**Outcome:** what worked, what I corrected or rejected, and why.
**Lesson:** prompt/workflow insight, if any.
-->

### 2026-10-29 – Problem discovery and docs

**Delegated:** Read the PIEX course material (interview notes, slides, consent form) and draft
`PROBLEM.md`, `USER-FLOWS.md`, `SYSTEM-ARCHITECTURE.md` in English.
**Outcome:** Drafts were reshaped by my decisions: general urban scope instead of
accessibility-only, a `not_found` status, upvotes instead of "still there/fixed" votes, mandatory
accounts, Redis caching. The AI flagged that the signed consent form forbids naming interviewees,
so names were kept out of the repo.
**Lesson:** Writing docs first (problem → flows → architecture) gave the AI enough context to
propose a coherent data model and cache design in one pass.

### 2026-10-29 – Scaffold

**Delegated:** Monorepo scaffold (workspaces, Docker Compose, API/web skeletons, health check test).
**Outcome:** The first test run was flaky; the cause was the Redis client rejecting commands
before connecting (`enableOfflineQueue: false`), fixed with a command timeout. Default ports
clashed with services already on my machine, so all ports moved to `.env`.
**Lesson:** Verify end to end (proxy → API → DB/Redis, and Redis stopped) rather than trusting a
green typecheck.

### 2026-10-29 – REST API

**Delegated:** Migrations, models, auth (JWT), reports, upvotes, agent endpoints, demo seed and a
22-test suite against a real Postgres + PostGIS.
**Outcome:** Tests caught a Vitest-specific issue (`import.meta.dirname` undefined in its module
runner, breaking migration discovery). The privacy rule (decision 010) is enforced by a test that asserts no response contains the author's or agent's id, plus a
concurrency test for the upvote count.
**Lesson:** Turning product rules ("users can't identify each other") into tests keeps the AI
from silently regressing them later.
