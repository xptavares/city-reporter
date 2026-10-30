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

## Known limitations

-
