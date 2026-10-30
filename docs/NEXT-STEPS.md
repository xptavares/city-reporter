# Next Steps

What was deliberately left out of the MVP and what I would do next, roughly in priority order.

## Next

- **Identity tied to a real person in production:** link citizen accounts to a national ID
  (CPF in Brazil), ideally via the government's **gov.br** login, so one person = one account and
  mass-created bot accounts are not possible. (See decision 004.)
- **Rate limiting** on report and vote endpoints, as a second layer against abuse and flooding.

## Later

- **Native mobile app or PWA:** installable app with push notifications (e.g. "your report was
  fixed") and offline report drafts. The MVP is a responsive web app (decision 007).
- **Citizen XP / gamification** (Waze-style): citizens earn XP for reports and for upvotes their
  reports receive, encouraging participation.
- **Photo evidence:** citizens attach photos to reports; agents attach a photo when marking a
  report as `fixed` or `not_found` (proof the location was checked).

- **End-to-end tests** (Playwright) for the main flows; the web app was verified manually in a
  browser, while the API has automated tests.
- **Code splitting:** the web bundle is ~620 kB (Leaflet + i18n + React); lazy-load the agent
  page and the map.
- **Duplicate detection:** suggest existing nearby reports of the same category before creating a
  new one (PostGIS `ST_DWithin`), so upvotes concentrate instead of splitting.

## Known limitations

- Geolocation requires HTTPS (or localhost): opening the dev server from a phone over the LAN
  falls back to picking the location on the map.
- Report descriptions are not translated (user content is shown as written).
- The JWT lives in `localStorage` (simple, but readable by any XSS); production should use an
  httpOnly cookie.
