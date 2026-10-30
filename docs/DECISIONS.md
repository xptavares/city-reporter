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
