# CLAUDE.md

## Context

This repo is a submission for the Jeeves **Software Engineer – Phase 2 Vibe Coding Challenge**
(instructions in `docs/Software Engineer – Phase 2 Vibe Coding Challenge_ Candidate Instructions (v1).pdf`).

- Deadline: 3 days from receiving the instructions.
- Deliverables: source code + README (how to run locally), ~5 min video, 1-page write-up.
- Evaluation: product thinking, engineering, decision-making, use of AI tools, communication.
- Guiding principle: a focused problem solved well beats a big one half done. Clarity > polish.
- Must run locally with clear instructions; deployment is not required.

## Documentation (source of truth)

| File | Purpose |
|------|---------|
| `docs/PROBLEM.md` | The problem, who has it, why it matters, scope (in/out). Written by the author. |
| `docs/USER-FLOWS.md` | Actors (citizen, agent), report statuses, and what each actor can do. Drives the data model and API. |
| `docs/DECISIONS.md` | Decision log: each significant choice with options considered, trade-offs and rationale. |
| `docs/SYSTEM-ARCHITECTURE.md` | Components, data model, flows, and how the pieces fit together. |
| `docs/AI-USAGE.md` | Log of how AI tools were used: what was delegated, corrected or rejected. |
| `docs/NEXT-STEPS.md` | What was left out of the MVP, known limitations, what comes next. |
| `docs/VIDEO-SCRIPT.md` | Script and demo flow for the ~5 min submission video. |
| `docs/WRITEUP.md` | The 1-page submission write-up. Written last, summarizing the docs above. |
| `README.md` | How to install, run and test locally, plus links to the docs. |

Read `docs/PROBLEM.md` before proposing features. Do not expand scope beyond what it defines
without asking.

## Working agreements

- **Language:** the user talks to Claude in Portuguese; all code, comments, commits and docs in
  the repo are written in English (the reviewers read English).
- **Log decisions as we go:** whenever we make a non-trivial choice (stack, library, data model,
  trade-off, something deliberately left out), add an entry to `docs/DECISIONS.md` in the same
  change. This feeds the write-up and the interview walkthrough.
- **Keep architecture docs current:** if a change alters components, data model or flows, update
  `docs/SYSTEM-ARCHITECTURE.md` in the same change.
- **Log AI usage as we go:** after a notable AI-assisted step (especially when output was corrected
  or rejected), add a short entry to `docs/AI-USAGE.md`.
- **Track what's left out:** when something is cut or deferred, add it to `docs/NEXT-STEPS.md`.
- **Keep the README runnable:** whenever setup, run or test commands change, update `README.md`.
- **Small, meaningful commits** with clear messages — the git history should tell the story.
- **Tests on the critical paths** (core domain logic, main API flows); no need for exhaustive coverage.
- **Readable over clever:** the author must be able to explain every line in the follow-up call.
- Prefer boring, well-known libraries over novel ones; avoid adding dependencies without a reason.

## Stack & commands

_To be defined (see `docs/DECISIONS.md`). Fill in once chosen: how to install, run, test, lint._
