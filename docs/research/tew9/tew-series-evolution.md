# The TEW / EWR series: what Ryland changes, era by era

Sources: `[wiki]` Wikipedia *Total Extreme Wrestling* (per-release summaries);
`[doc]` Grey Dog external-editor reference; `[hb]` TEW IX Player's Handbook.
Confidence note: Grey Dog's own forums (patch notes / Developer's Journals) returned
HTTP 403 behind Cloudflare, so this is built from encyclopedic release summaries plus
first-party in-game documentation, **not** from raw patch lists. Where a claim depends
on a patch note I could not read, it is marked `[unverified]`.

## Timeline

| Release | Year | Engine | Headline changes |
|---|---|---|---|
| Extreme Warfare 1 | 1995 | QBasic | matches, winners, simple wages |
| EW 2 / 2000 / 2001 / 2002 / 5000 / 6000 / 7500 / 9000 | 1996–2000 | Turbo Pascal | incremental upgrades of the same core; booking + business side |
| **Extreme Warfare Deluxe** | 2001 | rebuilt | whole world hireable (not just WWE/WCW/ECW rosters); promotions get AI; **match report screen** with quality / crowd reaction / effort / overall |
| **Extreme Warfare Revenge** | 2002 | Visual Basic | **user controls everything on the card** — angles, finishes, interviews were previously random; **feud system** counts match/angle/interview wins; promotion **size** tiers; TV timeslots (further from prime time = fewer segments); Internet sites (indie / gossip / your own); **worker relationships** drive backstage politics; multiple tag teams + experience; gimmicks affect overness; multiple open contracts (up to 3 promotions); Japanese tours; optional pictures |
| **TEW 2004** | 2004 | rebuilt, commercial | world expands to Japan / Mexico / UK / Australia; **overness per region** replacing one global value; AI bookings, finances and deals become visible; more contract clauses (medical, travel) and deals resolve over time; **multiplayer**; **time-based booking** (no 11-hour Iron Mans in a 2-hour show); Create-A-Match and Create-A-Gimmick; **the CornellVerse** (fictional world, for copyright) |
| **TEW 2005** | 2005 | rebuilt | **advance booking**; TV competition + multiple worldwide deals per show; **PPV providers as entities** you must deal with; **momentum meter**; match purpose returns enhanced; **road-agent instructions** (put over, bury, performance); editable angles / storylines / locations / injuries; **angle editor** with many types and up to 6 participant roles; **storyline editor** (inspired by Polti's *36 Dramatic Situations*); **grades instead of exact stats** |
| **TEW 2007** | 2006 | on 2005 code | customizable **merchandise**; many new **contract types** (short-term etc.) |
| **TEW 2008** | 2008 | on 2007 code | 100+ changes; **imports and converts 2007 databases** |
| **TEW 2010** | 2010 | on 2008 code | **backstage morale revamp**; heavy UI/navigation work to cut booking time |
| **TEW 2013** | 2012 | on 2010 code | **Autobooker**, **Fog of War**, **Tribute Shows**, **Shoot Interviews**, **Legacies**; more database options |
| **TEW 2016** | 2016 | on 2013 code | **backstage cliques**; more realism; longer demo |
| **TEW 2020** | 2020 | **complete rewrite** | features re-inserted onto new code; **attributes replace personality + lifestyle**; **playable developmental territory**; more house-show control |
| **TEW IX** | 2024 | on 2020 code | **four-axis relationships**; mortal avatars; **height/weight replace size category**; external editor; cap-decline instead of skill-decline; Time Decline hidden; Match Style setting removed |

## The seven recurring patterns

Reading the whole arc, seven habits repeat. These are the *designer's* patterns, and they
are the most transferable thing in this document.

### 1. Remove randomness, then reintroduce uncertainty elsewhere
EWR's defining change was that angles, finishes and interviews **stopped being random** —
the user took control `[wiki]`. But TEW 2005 then introduced **grades instead of exact
numbers** `[wiki]`, and TEW 2013 added **Fog of War** `[wiki]`. Control over *decisions*
increases while visibility of *magnitudes* decreases. Never both at once.

### 2. Every feature becomes an entity with a deal
PPV providers became companies you negotiate with (2005). TV became multiple worldwide
deals. Contracts gained clauses and delayed resolution (2004). The trend is consistently
"a hidden rule becomes a visible counterparty".

### 3. Expand the map, then subdivide it
World grew from North America → Japan/Mexico/UK/Australia (2004), and simultaneously
overness went from one value to per-region `[wiki]`. Later IX subdivides again: size
category → exact height/weight, one relationship → four axes.

### 4. Editors are the content strategy
Create-A-Match, Create-A-Gimmick (2004), angle editor with 6 roles, storyline editor
(2005), editable locations and injuries, then the external editor (IX). Each release
converts more hardcoded behaviour into authorable data. The external editor in IX is the
culmination: **45 tables**.

### 5. Performance is a feature
TEW 2010 was largely a UI/navigation release to reduce booking time `[wiki]`. TEW 2020 was
a full rewrite explicitly to make the game "sharper, quicker, more intuitive" `[wiki]`.
IX fixed organic biographies rewriting causing load-time cost `[hb 19.19]`. He ships
performance work as headline features.

### 6. Special-case the player less
EWR was player-centric. IX explicitly removes player privilege: avatars become mortal,
User Reputation and User Image are deleted, the avatar uses the same Booking Reputation
skill as everyone else `[hb 6.3]`. Long-run direction: the player is an entity, not an
exception.

### 7. Rewrite every ~5–7 years
2001 (EWD), 2004, 2005, then code-reuse 2007→2016, then a **full rewrite in 2020**, and
2024 on 2020 code. Pattern: 3–4 incremental releases on a codebase, then a ground-up
rebuild, then incremental again. Feature debt accumulates until the rewrite resets it.

## What that predicts

- **TEW X (next)** is likely *incremental on IX code* — 2024 was already the post-rewrite
  release, so expect 2–3 more content releases before another rebuild. `[infer]`
- Expect the next cycle's headline to be either **UI/performance** (per pattern 5) or
  **editor breadth** (pattern 4), because IX spent its budget on simulation realism.
  `[infer]`
- Expect another **subdivision** of a coarse model (pattern 3). The remaining coarse
  things are: match types vs aims, gimmick ratings, morale (still incident-based), and
  the company size ladder. `[infer]`

## What WrestleCraft should take from each era

| Era | Lesson | Concrete action |
|---|---|---|
| EWR (2002) | **Control converts**: the moment the player books angles and finishes instead of rolling them, the game becomes a game | You already book; keep pushing control — expose finish selection and angle composition |
| EWD (2001) | A **match report** with quality / crowd / effort / overall is enough to make outcomes legible | You have ratings; ensure the breakdown is visible (cf. IX Dirt Sheet) |
| TEW 2004 | **Per-region popularity** is the single best modelling decision in the series | Verify yours is per region, not global |
| TEW 2005 | **Grades beat numbers** for tension | Consider hiding exact skill values from the player, exposing grade bands |
| TEW 2005 | **Storyline editor** built on Polti's 36 situations | Steal the structure: storylines as typed dramatic situations, not free text |
| TEW 2007 | **Merchandise + contract types** are cheap content | Merchandise exists in yours; add contract *types* rather than more fields |
| TEW 2008 | **Database import/conversion** retains players across versions | If you ship v2, ship a converter |
| TEW 2010 | **Speed is a feature** | Profile your advance-day path; 100+ files in global scope will bite eventually |
| TEW 2013 | **Autobooker + Fog of War** widen the audience | An autobooker is a great "I don't know what to book" escape hatch |
| TEW 2016 | **Backstage cliques** make the locker room social | You have stables + locker room; a *clique* is a stable that spans companies |
| TEW 2020 | **Periodic rewrite** is how feature debt gets paid | Plan your rewrite at the point where adding systems gets slow, not before |
| TEW IX | **Remove the player's special cases** | If you have player-only stats or privileges, generalise them |

## Don't copy

- **Database churn for its own sake.** 2007 → 2008 was 100+ changes, many invisible. Depth
  you can't perceive is not value.
- **Rewriting too early.** The 2020 rewrite was justified by 15 years of debt. A
  one-person project that rewrites yearly never ships.
- **Opaque maths without a reveal.** IX finally added the Dirt Sheet toggle. If you hide
  formulas, ship the opt-in explanation in the same release, not 20 years later.

## Caveat on this analysis

Release-note archaeology is inherently lossy: forum patch logs were unreachable, so
feature-level attributions come from encyclopedia summaries that themselves compress
dozens of patches. Treat the *direction* of each era as reliable and the *exhaustiveness*
as not. The IX column is the most reliable because it comes from first-party in-game
documentation.
