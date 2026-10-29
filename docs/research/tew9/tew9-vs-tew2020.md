# TEW 2020 → TEW IX: what changed

Method: the IX handbook contains 28 explicit self-comparisons ("unlike in previous
games", "in previous versions", "no longer exists"). Those are first-party statements
about the delta, so the 2020 side is inferred from the IX side's own description rather
than from a 2020 install. Marked `[hb]` with section numbers. Anything without such a
statement is flagged unverified.

## Confirmed changes

| # | Area | TEW 2020 (per IX text) | TEW IX | Why it matters |
|---|---|---|---|---|
| 1 | **Relationships** | one relationship per pair | **four elements** — Family, Personal, Romantic, Mentor/Protege; "sum of its parts", can mix positive and negative `[hb 22.1]` | The single biggest model change. Enables sibling-rivals, divorced-partners, mentor-who-hates-you |
| 2 | **User avatar** | immortal | mortal — immune to random death, cannot die before 66, warned in advance, switchable `[hb 6.1]` | Avatar is now "part of the world, less a special exception" `[hb 6.3]` |
| 3 | **User Reputation** | separate stat tracking how others see you | **removed** — avatar uses the same Booking Reputation skill as everyone `[hb 6.3]` | Kills a privileged channel; one skill system for all |
| 4 | **User Image** | control showing feared/loyalty state | **removed** — replaced by evaluation of personality, relationships, prior choices `[hb 6.3]` | Moves from a visible dial to emergent judgement |
| 5 | **Height & weight** | a "size category" | **exact height/weight** used for skill caps, title eligibility, hiring; weight varies within min/max, height fixed `[hb 19.3]` | Fine-grained eligibility instead of buckets |
| 6 | **Match Style** | match had a Style setting | **setting removed** — same information lives in road-agent match aims `[hb 14.3]` | Fewer redundant fields; intent expressed at booking time |
| 7 | **Time Decline** | Creative Meeting had a Time Decline section showing decline from the moment it began | **caps decline instead of skills** — harder to spot, workers can still improve `[hb 8.5]` | Removes a spoiler; decline becomes gradual and hidden |
| 8 | **Excursions** | worker-initiated | **company must proactively start them** `[hb 7.13]` | Shifts agency to the booker |
| 9 | **Child companies** | not playable ("unlike many older games") | **playable**, with parent-imposed restrictions; can sign independently `[hb 30.4]` | Adds a whole play mode |
| 10 | **Alliance loans** | capped | **no limits** on repeats, source companies, or total loans `[hb 33.3]` | Removes a grind restriction |
| 11 | **Event extras** | celebrities were an option | **removed** — celebrities now exist in their own right `[hb 24.20]` | Deduplication of concepts |
| 12 | **Attendance** | higher baseline | **significantly lower on average**; >60,000 reserved for legendary events `[hb 9.4]` | Economy rebalance; scarcity |
| 13 | **Organic biographies** | rewritten whenever an important change happened | **updated on the fly** → no longer affects load times `[hb 19.19]` | Performance fix masquerading as feature |
| 14 | **External editor** | did not exist | **debuted in TEW IX** `[doc: External Editor Reference v1.04]` | The modding contract is new |

## Smaller confirmed deltas

- **Commentary** is rated *in context* of company size and segment quality, unlike road
  agent/referee performance which are absolute. `[hb 12.18]`
- **Refereeing** is stated as an absolute value, explicitly unlike most skills. `[hb 20.31]`
- **Experience** rises only from matches (not angles), faster with longer matches, and
  non-linearly. `[hb 20.11]`
- **Respect** has an inverse learning curve: slow to build, easier once established.
  `[hb 20.12]`
- **Performance Centres** are "super dojos": higher chance of ex-athlete graduates and
  can produce non-wrestlers (announcers, managers). `[hb 31.1]`
- **Wrestling schools**: only *training level* affects student quality, not the owner's
  skill. `[hb 31.4]`
- **Figureheads** must be active full-time Major Stars or Stars; keeping an ineligible
  one makes them "a liability"; removing one causes a major morale hit. `[hb 16.14]`
- **Locker-room %** shown in the office assumes the full roster is present; the show-time
  number can differ drastically. `[hb 8.25, 16.9]`
- **Dirt Sheet** toggle reveals the hidden bonuses/penalties behind a rating `[hb 36.9]`
  — an opt-in answer to "the maths is opaque".
- **Company Hall of Fame** (low bar) vs **Hall of Immortals** (high bar) are distinct
  `[hb 8.34]`.

## Likely new in IX, but NOT confirmed by a self-comparison

Treat as unverified — the handbook describes them but never says they are new:

Eras (§37) · Narratives (§38) · Creative Energy & Creative Ideas (§7.14) · Figurehead
system (§16.14) · Brand Split (§16.11) · Drug policy (§16.29) · Owner Goals (§16.22) ·
Production/merchandising ladders (§8.39–8.44) · Tournaments as a first-class screen
(§8.16) · Dirty Doctor (§18.7) · Geo tags (§34.4).

If you need certainty, diff a TEW 2020 save against an IX database — the table presence
alone would settle it.

## What did NOT change

The spine is identical: day→show→year loop, the two currencies, the momentum/perception
chain, minutes-weighted show rating, the ±6 popularity-vs-rating growth rule, and the
45-table data model. IX is a **refinement** release, not a rebuild.

Also unchanged: the designer's habit of hiding magnitudes. The IX text still says
"potentially over a hundred" factors and "hidden" durations.

## What this tells you about the designer

Reading the deltas as a set, five themes appear:

1. **Remove special cases.** User Reputation, User Image, immortal avatar, celebrity
   event extras — all deleted or generalised. The player is now just another entity.
2. **Replace coarse buckets with precise values.** Size category → height/weight; one
   relationship → four axes.
3. **Hide the maths, offer a window.** Time Decline becomes cap-decline; constants stay
   hidden; but Dirt Sheet is an opt-in reveal. Opacity by default, transparency on
   request.
4. **Shift agency to the booker.** Excursions, playable child companies.
5. **Optimise what was slow.** Organic biographies rewritten on change → on the fly.

## Implications for WrestleCraft

| Delta | Relevance to you |
|---|---|
| Four-axis relationships | Directly applicable — you already have a pair table; add fields, not a rewrite |
| Height/weight over size category | Applicable to title eligibility + weight classes; you have weight, check for a size bucket |
| Match Style removal | You have match types; consider whether style is redundant with road-agent aims |
| Cap decline instead of skill decline | Cheap, high realism: age workers by lowering caps, not stats |
| Avatar mortality + no special-case reputation | Applies if you have a player-avatar layer |
| Dirt Sheet toggle | Cheap to build on your existing rating pipeline; big perceived-depth win |
| Locker-room "full roster vs present roster" distinction | Cheap; makes backstage feel dynamic |
| Alliance loan limits removed | Suggests limits were pure friction — keep yours loose |

**The one to copy first:** *cap decline instead of skill decline*. It costs a few lines
(age → lower caps, skills follow), it is invisible to players until they look, and it
fixes the "why did my veteran suddenly fall off a cliff" problem without adding a
visible timer.

**The one to skip:** four-axis relationships. It is the right call for TEW, which is a
world simulator first; WrestleCraft already has `strength` plus chemistry and a working
matrix. Add axes only if you also add the UI to make them legible.
