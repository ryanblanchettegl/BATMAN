# TEW IX — complete system inventory

Every subsystem named in the handbook's 42 chapters, grouped by domain, with what it
reads and writes. `[hb]` = Player's Handbook section the system is documented in.

## 1. World and data

| System | What it does | Refs |
|---|---|---|
| Databases vs save games | a database is the authored world; a save is a world in motion | hb 39.1 |
| Turn save → database | convert a played save into a new starting database | hb 39.2 |
| MDB files | the Access container format | hb 39.3 |
| Password protection | databases can be locked | hb 39.4 |
| Game recovery / annual backup | crash and corruption recovery | hb 39.6–39.7 |
| Multiplayer files | shared-save play | hb 39.9 |
| Main editor / external editor / in-game editor | three editing surfaces | hb 40.1–40.5 |
| TEW2020 conversion | import legacy databases | hb 40.6 |
| Database size limits | caps on entities | hb 40.7 |
| Start data variance | randomised starting conditions | hb 40.8 |
| Picture changers / free pictures | conditional and placeholder art | hb 40.9–40.10 |
| Soft vs hard closes | company closure semantics | hb 40.12 |
| Ageing / de-ageing | time-shift workers | hb 40.13 |

## 2. Eras and narratives

| System | What it does | Refs |
|---|---|---|
| Eras | date-bounded presets: universal settings, per-area settings, product trends | hb 37.1–37.4 |
| Narratives | trigger date range, chance, importance, single-use, presentation, requirements, effects, effect strength | hb 38.1–38.9 |

## 3. People

| System | What it does | Refs |
|---|---|---|
| Worker styles | 17 archetypes incl. `Never Wrestles` | hb 19.2 |
| Height / weight / body shape | ranges, match-legality inputs | hb 19.3–19.4 |
| Physical health | injury and fatigue state | hb 19.7 |
| Active areas / languages | where they can work, what they can cut promos in | hb 19.9–19.10 |
| Gender ID, pronouns, sexuality, race, nationality | identity fields with gameplay effect | hb 19.11–19.14 |
| Competes vs. | restriction matrix | hb 19.16 |
| Popularity and popularity caps | per region, with ceilings | hb 19.17–19.18 |
| Loyalty / freelance | contract-leaving behaviour | hb 19.20–19.21 |
| Worker roles | active wrestler, manager, referee, announcer, road agent, etc. | hb 19.22 |
| Attributes and personalities | hidden modifiers that colour incidents | hb 19.23–19.24 |
| Regeneration | procedural replacement workers | hb 19.25 |
| Outside relationships | relationships outside your company | hb 19.26 |
| Alter egos | masked/renamed personas | hb 19.28 |
| Legacies, celebrities, career goals | narrative hooks | hb 19.30–19.32 |

**Skills (hb 20)** — 30+ rated 0–100: Brawling, Puroresu, Hardcore, Technical, Aerial,
Flashiness, Psychology, Experience, Respect, Reputation, Charisma, Microphone, Acting,
Star Quality, Sex Appeal, Menace, Basics, Selling, Consistency, Safety, Stamina,
Athleticism, Power, Toughness, Resilience, Play-by-Play, Colour, Refereeing, Scouting,
Potential. Skills have **learning rates and caps** per worker.

**Business skills (hb 21)** — the owner/booker side: business reputation, minimum age,
personal wealth, min/max company size, roster size, patience, roster turnover, finance,
style preference, owner specialism, booking reputation/skill, hiring/firing preference,
title reigns, booker specialism.

## 4. Relationships (hb 22)

Four elements per pair — **Family, Personal, Romantic, Mentor/Protege** — plus Seniority.

| Sub-system | Notes |
|---|---|
| Shifting relationships | hidden counters accumulate shifts; no instant re-tiering |
| Reporting | only significant changes reach News; minor ones only on-screen |
| Isolated through relationships | a worker can be shut out socially |
| Seniority | tenure-based standing |
| Chemistry | in-ring and commentary chemistry, discovered through play |

Values: Family (7), Personal (9), Romantic (7) — see `tew9-relationships.md`.

## 5. Companies (hb 16)

Sizes; per-region popularity; rankings; AI hiring/firing; home arena; prestige and
momentum; finances; locker-room morale; hiring rules; brand split; storylines;
figureheads (+ pros/cons, heirs); house shows; merchandising (company and per-worker);
owners; owner goals; booking team; inner circle; commentary; divisions; Hall of Fame;
geo tags; drug policies; show priority/order; companies as properties; set-to-open and
closed dates; website; logos/backdrops; fix belts; pre-alliance membership; company
loyalty; young lion system; touring companies; corporate HQ; physical Hall of Fame.

## 6. Products (hb 17)

Current product, core product, gender setting, match focus, angle focus, face/heel
divide, men's weight split, minis divisions, stables, managers, in-ring settings.
`[hb 17.1]` Product "controls virtually everything about a company" and can be changed
during play, but only to a *related* product and only after a conversion period.

## 7. Booking and creative (hb 9, 10, 14, 15)

Pre-show: give the night off, venue/location, attendance level, region, finalise
broadcasters, pre-show incidents, booking-team meeting, locker-room incidents, address
the locker room.

Booking: placement mode, cost per live show, show order, pre-booking (+exceptions),
mid-show booking, match lengths, title assignment, commentary team, **road agent**,
**referee**, intensity and danger levels, no specified winner, hiring locals, leaving
workers off, borrowing workers.

Matches (hb 14): naming, type, style, prestige, minimum size, held, entrances, rules,
injury risk, content risk, name value, defaults, times, set-up, finishes.

Angles (hb 15): name, length, importance, scripted vs unscripted, output, parts,
ratings, and ~20 participant roles — Attacker, Background Player, Being Interviewed,
Bodyguard, Cameo, Character Development, Comic Relief, Cutting A Promo, Dramatic
Acting, Fighting, Interviewer, Intimidation, Making The Save, Non-Speaking Appearance,
Off Screen, Segment Host, Selling An Injury, Sex Appeal, Subject Of Video, Victim,
Working The Crowd — plus Skill-vs-Popularity weighting.

## 8. Show execution (hb 11, 12)

Segment ratings; match descriptions; copy/paste text; crowd burn-out; worker popularity
growth; audience boredom; audience apathy; final rating; company popularity growth;
popularity growth vs viewers; show-count limits.

Feedback vocabulary (hb 12) — 25 named conditions the road agent reports: Vocal Crowd,
Eating Up, Made To Look Strong, Don't Seem To Click, Recent Matches, Holding Back,
Phoning It In, Type Of Match, The Match Finish, Worker Looked Good, Cinematic-Style
Approach, Crowd Management, Looking Stale, Young Female Demographic, Road Agent
Performance, Referee Performance, Commentary Performance, Lack Of Selling, Lack Of
Psychology, No Investment In Workers, Good Work At Ringside, Off His/Her Game, Shoot
Comments, Manager Help In Angle.

## 9. Backstage (hb 18)

Rules: no drugs/alcohol/smoking, arriving and leaving times, dress code, no outsiders,
catering/masseuse/chiropractor, transport and hotels, dirty doctor. These are **company
settings that generate morale incidents**.

## 10. Competition and media

| Domain | Systems | Refs |
|---|---|---|
| Broadcasting | media groups, owned broadcasters, 4 types × 4 delivery, size, style, coverage, viewership maths, wrestling stance, risk levels, dates, min requirements, max limits, deals, deal length, exclusivity, minimum quality, broadcaster changes, tour highlights, time slots, taped shows, negotiating, viewing figures, breach, counter-programming, day-of-week effects | hb 32.1–32.30 |
| TV | A vs B shows, length, held-on vs shown-on, tape schedule, numbering, prestige, avoiding dates, fixed locations, priority | hb 25.1–25.10 |
| Events | AI and player scheduling, PPV overuse, names, types, positioning (+shift over years), avoiding dates, advancing, multi-day, lengths, intent, importance, season finales, tour settings, AI instructions, fixed locations, dormant shows, extras, priority | hb 24.1–24.21 |
| Alliances | alliance titles, loans, public/consortium/bordered/territorial/protective/trading types | hb 33.1–33.9 |
| Company relationships | opinion, approaching, parents/children, sister companies, friendly, **war**, hostile, talent trading, no-stealing, no-signing, accepting excursions/developmentals | hb 30.1–30.16 |
| Game world | venues, economy, wrestling industry, geo tags, hire costs, potential fan base, generic venue caps, popularity spillover, regional languages, **area battles**, regional battles, awards, website, historical/holiday dates, inactive areas, region definitions | hb 34.1–34.19 |

## 11. Contracts (hb 23)

Types (exclusive, ongoing, touring), wage demands, pay, automatic renegotiation, iron
clad clause, downside agreements, developmental deals, notice periods, release costs,
travel clause, limited appearances, momentum. **Intended roles** — Normal, Icon, Special
Attraction, Gatekeeper, Passing The Torch, Future Main Eventer, Backbone, Blue Chipper,
Nostalgia Act, Developing. Control clauses — creative control, hiring veto, wage
matching, merchandise cut, shows control. Bonuses and stored templates.

## 12. Championships and factions

| System | Sub-system | Refs |
|---|---|---|
| Titles | owned-by vs original owner, alliance titles, limits, level, prestige, fixed area/region, function, frequency, achievements, annual competitions, AI reign lengths, lineages | hb 28.1–28.12 |
| Tag teams | company-specific teams, team types, tag experience, tag finisher, tag relationships | hb 26.1–26.5 |
| Stables | faction, brotherhood, cult, gang, alliance types; members, strength, AI stables, logos | hb 27.1–27.10 |
| Tournaments | — | hb 8.16 |

## 13. Development pipeline (hb 31)

Facility types, affiliation, locations, training level, facility level, styles taught,
graduation, lack of graduates, first refusal, AI graduate hiring, closures, AI
facilities, performance-centre training, taking over facilities.

## 14. Office surfaces (hb 8)

Personal assistant, brand split, booking team, chemistry, creative, divisions, end-of-year
awards, inner circle, figurehead, product, roster, stables, storylines, teams, titles,
tournaments, commentary, broadcasting, coverage, events & TV, pre-booking (+exceptions),
show history, top 100s, backstage, child companies, company info, contract overview,
developmental, drug testing, **finance**, geo tags, house shows, Hall of Fame,
investments, absences, merchandise, owner goals, production, promises, size, ticket
prices, training facilities, alliances, battles, talent trades, **relationships**, dirty
tricks, shortlist, blacklist, resign.

## 15. Meta

Achievements, Power 500, Hall of Immortals, end-of-year awards, in-game website,
dirt sheet, media scrum, shortlists/blacklists, search tools, skins, picture packs.
