# User Flows

Who uses the system and what they can do. This drives the data model and the API in
`docs/SYSTEM-ARCHITECTURE.md`.

## Actors

| Actor | Who | Goal |
|-------|-----|------|
| **Citizen** | Any resident of Pelotas, including people with disabilities and support associations (e.g. Louis Braille school). | Report problems in public spaces and confirm whether reported problems still exist. |
| **Agent** (admin) | Staff of the Municipal Urban Planning Department. | See where the problems are, keep their status up to date, and prioritize interventions. |

## Report statuses

| Status | Meaning | Set by |
|--------|---------|--------|
| `open` | Reported; no agent has checked it yet. | System (on creation) |
| `fixed` | The problem was resolved. | Agent |
| `not_found` | An agent went to the location and did not find the problem. | Agent |

Only agents change a report's status. Citizen upvotes are a **signal** that helps agents prioritize;
they never change status automatically.

## Accounts

Everyone needs an account (email + password) — citizens and agents alike. Anonymous reporting
and voting would let bots flood the system with fake reports and votes. Each account has a role:
`citizen` or `agent`. Agent accounts are created by the department, not by self sign-up.

### U1 – Sign up (citizen)

1. Citizen creates an account with name, email and password.

### U2 – Log in (citizen or agent)

1. User logs in with email and password; the app shows the features for their role.

## Citizen flows

### C1 – Report a new problem

1. Citizen taps **Report problem**.
2. Picks a **category** from the menu (e.g. pothole, broken sidewalk, missing tactile paving,
   obstruction, lighting, signage, other).
3. Sets the **location**, either:
   - **Use my location** (device GPS), or
   - **Pick on map** (drops/drags a pin).
4. Optionally adds a short **description**.
5. Submits → report is created with status `open` and appears on the map.

### C2 – Browse the map

1. Citizen opens the **map**.
2. Sees all reported problems as pins, distinguished by category and status.
3. Taps a pin to see details: category, description, status, date, and upvote count.

### C3 – Upvote a report

1. From a report's details (C2), the citizen **upvotes** it — like a social-media "like",
   meaning _"this matters to me too"_.
2. One upvote per citizen per report; tapping again removes it.
3. The upvote count is shown on the report. The more upvotes, the more people a problem affects,
   which helps agents decide where to act first.

## Agent flows

### A1 – List reports

1. Agent opens the **reports list**.
2. Sees all reports with category, location, status, date and upvote count.
3. Can filter by status and category.
4. Can sort by **most upvoted** (default) or by date.

### A2 – Report a problem

Same as C1. Agents also find problems during inspections.

### A3 – Mark a report as fixed

1. From a report (list or map), agent sets status to **`fixed`**.

### A4 – Mark a report as not found

1. From a report, agent sets status to **`not_found`** (checked on site, problem not there).
   This records that the department has already looked at it.
