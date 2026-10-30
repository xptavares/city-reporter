# Problem

> **Pelotas' Municipal Urban Planning Department (Secretaria Municipal de Urbanismo) lacks
> up-to-date data on where the city's public spaces are failing — a gap identified through
> field interviews I conducted for the _PIEX: Vida Sustentável I_ course at the Catholic
> University of Pelotas (UCPel), as part of my degree in _Data Science and Artificial Intelligence_.**

## Origin

In October 2026, as part of a university extension course (PIEX – Interprofessional Extension
Program, "Support Networks" assignment), my group investigated how the deterioration of public
spaces affects mobility and inclusion in Pelotas, Brazil. We ran semi-structured, in-person
interviews with two institutions looking at the same streets from opposite sides:

- **Associação Escola Louis Braille** (founded 1952) — a school and rehabilitation center for
  people with visual impairments. They _live_ the problem every day.
- **Secretaria Municipal de Urbanismo** (~90 staff) — the city department responsible for property
  registry, project approval, permits, inspections, and, through its Urban Planning Directorate,
  accessibility and urban mobility. They _plan_ the city.

I interviewed the Urban Planning Department in person (Oct 7, 2026), together with a classmate.
We spoke with two people: an **advisor to the Secretary's office** (2 years in the department)
and the **Director of Urban Planning**. Interviewees are identified by role only, as guaranteed
by the confidentiality clause of the signed consent form.

## The problem

When asked about their main difficulty, the **Director of Urban Planning** answered directly:
**the absence of up-to-date data.**

- There is a **huge backlog** of places that need improvement.
- Public spaces **deteriorate over time**, so whatever data exists goes stale.
- Some places need **requalification**; others have **never received any intervention at all**.
- **Without knowing where the problems are, the department cannot prioritize where to act.**

## Who has it

| Who | How it affects them |
|-----|---------------------|
| **Urban Planning Department** (primary user) | Plans and inspects but has no reliable, current picture of the city's sidewalks and public spaces, so prioritization is guesswork. |
| **People with disabilities** (e.g. visually impaired) | Face the barriers daily — and their knowledge never reaches the people who plan. |
| **Citizens in general** | Have no simple, targeted way to report a problem that turns into usable data. |

## Evidence from the other side of the street

The Louis Braille school listed the barriers visually impaired people face in Pelotas:

- Potholes and open manholes
- Missing tactile paving (or tactile paving that is badly installed, e.g. routed around a pole on
  a narrow sidewalk)
- Goods displayed on sidewalks (especially downtown)
- Cars parked on sidewalks
- Bus shelters placed in the middle of the sidewalk
- Unpruned trees and hedges
- Poorly marked crosswalks
- Traffic lights and buses/stops without audible signals

Asked which elements of the city's infrastructure help them move around safely and independently,
the vice-principal answered: **"None."**

## How it's handled today

- **Reporting channels:** the city website (pelotas.com.br → Serviços → Atendimento), "Fale
  Conosco" form, WhatsApp, and in-person service. These are generic support channels, not built
  to produce structured, mappable data about the condition of public spaces.
- **Mapping:** the department uses **georeferencing with OpenStreetMap** to update open data.
- **Execution:** the department plans but does not execute repairs — it contracts labor, and there
  is a shortage of technical staff.
- **Sidewalks:** maintenance is the responsibility of the property owner; the city's role is to
  **notify the owner**.

## The core insight

**The people who know where the problems are are not connected to the people who need the data.**

The Louis Braille community knows every barrier but has no direct channel into public decision
making. The department has the mandate to plan and inspect but lacks current data on where the
problems are. The director herself suggested the direction: **a dedicated app for reporting
accessibility problems.**

## Goal

Turn citizen reports into **structured, geolocated, up-to-date data** that the Urban Planning
Department can use to see where problems are and **prioritize interventions**.

## Scope

_To be defined together — see `docs/DECISIONS.md`._

**Focus:** urban public-space problems **in general** (sidewalks, potholes, lighting, signage,
obstructions, etc.), with **accessibility barriers as a first-class category** rather than the
only one. The department's data gap covers the whole backlog, not just accessibility, and a
general scope lets the same reports serve both planning and accessibility needs.

### In scope (MVP)

-

### Out of scope

-

## Open questions

- Integrate with OpenStreetMap, or keep our own data and export to it?
