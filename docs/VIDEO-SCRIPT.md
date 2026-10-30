# Video Script (~5 min)

Camera + screen together. Speak to the reviewers as if presenting to the team.
~130 spoken words per minute: the lines below are a guide, not something to read word for word.

| Time | Section | Show |
|------|---------|------|
| 0:00–0:40 | The problem | PIEX slides (Urban Planning "main difficulty" slide) or `docs/PROBLEM.md` |
| 0:40–1:10 | Why I picked it | Louis Braille "barriers" slide / the "None." answer |
| 1:10–2:00 | How I solved it | `docs/USER-FLOWS.md`, then the architecture diagram in `docs/SYSTEM-ARCHITECTURE.md` |
| 2:00–3:00 | Live demo | the app (phone-size window, then desktop) |
| 3:00–4:15 | Code walkthrough | 4 files, see below |
| 4:15–5:00 | Trade-offs, AI, next steps | `docs/DECISIONS.md`, `docs/NEXT-STEPS.md` |

## 0:00 – The problem

> "I'm Alexandre, I study Data Science and AI at UCPel, in Pelotas, Brazil. In a university
> extension course this October, I interviewed Pelotas' Urban Planning Department. I asked the
> Director of Urban Planning what their main difficulty was, and the answer was direct: **they
> don't have up-to-date data**. There's a huge backlog of sidewalks and public spaces to fix,
> they deteriorate over time, and without knowing where the problems are, they can't decide
> where to act first."

## 0:40 – Why I picked it

> "My group also interviewed a school for visually impaired people. They know every barrier in
> the city — potholes, missing tactile paving, cars on the sidewalk. When we asked which parts of
> the city's infrastructure help them move around safely, the answer was: 'None.' So the
> knowledge exists, it just never reaches the people who plan. It's a real problem, from people I
> talked to, and it's small enough to solve well in three days."

## 1:10 – How I solved it

> "City Reporter turns citizen reports into structured, geolocated data. Citizens report a
> problem on a map and upvote the ones that affect them. Agents from the department see a list
> sorted by upvotes — where the most people are affected — and mark reports as fixed or not
> found. I started with documents, not code: problem, user flows, architecture, and a decision
> log with fourteen decisions. The stack is a TypeScript monorepo: Express and Sequelize, Postgres
> with PostGIS because everything is geographic, Redis as a cache, and React with Leaflet on
> OpenStreetMap — the same open map the department already uses."

## 2:00 – Live demo

Follow the **Demo flow** below. Narrate what the user does, not the UI details.

## 3:00 – Code walkthrough

1. **`packages/shared/src/schemas.ts`** — "One zod schema validates the request in the API and the
   form in the browser, so client and server can't disagree."
2. **`apps/api/src/services/report-service.ts`** → `addUpvote` — "Upvotes run in a transaction with
   a row lock, so concurrent upvotes never break the count. There's a test with ten at once."
   Then `getMapPins` — "The map is cached per map tile, not per exact viewport, so people looking
   at the same neighborhood share cache entries."
3. **`apps/api/src/cache/keys.ts`** — "Every Redis key and TTL in one file. Invalidation bumps a
   version number instead of deleting keys one by one. Upvotes don't touch the map cache, because
   pins don't carry counts. And if Redis is down, the API keeps working from Postgres."
4. **`apps/web/src/i18n/locales/pt.ts`** — "Portuguese, English and Spanish. The translations are
   typed from English, so a missing translation is a compile error."

Optional (if time): `apps/api/test/reports.test.ts` → "never exposes who created or changed a
report" — privacy rule turned into a test.

## 4:15 – Trade-offs, AI, next steps

> "Some trade-offs: accounts for everyone, which adds friction but stops bots; in production I'd
> tie them to the national ID through gov.br. Only agents change status — upvotes are a signal,
> not a vote that closes problems. And users can never identify each other, which also keeps the
> cache simple.
>
> I built it with Claude Code. I made the product decisions and the AI wrote most of the code, but
> always against written docs and tests. Driving a real browser caught bugs the tests didn't,
> and my own manual testing caught a pagination bug. Next: photos as evidence, duplicate
> detection with PostGIS, and end-to-end tests. Thanks!"

## Demo flow

**Phone-size window (DevTools device mode), language: Português**

1. Log in as `citizen@cityreporter.local` / `123qwe`.
2. Map of downtown Pelotas: point at the colors (open / fixed / not found).
3. Tap the **missing tactile paving** pin near the main square → details → **"Isso me afeta"** (count
   goes up).
4. **Reportar problema** → pick *Calçada quebrada* → tap the map (or "Usar minha localização") →
   description → **Enviar**. The new pin appears immediately.
5. Switch language to **English**, then **Español** (header).

**Desktop window**

6. Log out, log in as `agent@cityreporter.local` / `123qwe` → **Reports**: most upvoted first.
7. Filter by category, show pagination.
8. **Mark fixed** on the top report → it leaves the "Open" filter → **View on map** → green pin.
9. DevTools → Network → a `/api/reports/map` request: `X-Cache: MISS`, reload: `HIT`.
10. (Optional) `docker compose stop redis` → reload: still works, `X-Cache: BYPASS` →
    `docker compose start redis`.

## Pre-recording checklist

- [ ] `npm run infra:up && npm run db:seed && npm run dev` (fresh demo data)
- [ ] Browser password-leak warning disabled or a different demo password (the warning pops up
      on `123qwe`)
- [ ] Clear `localStorage` (logged out, language not pinned)
- [ ] Editor and browser font size readable; DevTools docked
- [ ] Slides PDF and `docs/` open in tabs
- [ ] Notifications off
- [ ] Do one full dry run with a timer
