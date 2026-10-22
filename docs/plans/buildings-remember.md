# Buildings that remember

Bill, 21 October 2026: "v3" (yes). From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea V3). Nothing here is built. Small to medium, and one of the first to build. One step at a time (rule 9a).

## The idea in one paragraph

Every venue keeps its own history: the betrayal happened here, the record gate, the title change, the match of the year. Going back to the scene of a betrayal for the rematch adds heat and the commentary says so; the crowd brings signs about it; a banner for a famous night hangs in the rafters. Wrestling history is told by place ("it happened in this building"), and the road map is already one of the game's best screens.

## What exists today

Every building (`cityBuildings()` in `src/91-road.js`) already has quirks fixed by its name: feel, sound, sightlines, the crowd's temper, weather (`src/99-venues.js`). Shows already know their city and building. Home towns are known (`homeKm()`). The match of the year list (`S.moty`), title histories and the archive keep what happened, but not where.

## What a building remembers

A short list per building, kept as ids and a week, the most important five or so:

| Memory | Kept when |
| --- | --- |
| A title change | A title changed hands here |
| A betrayal or a turn | A turn angle or live call 37/38 happened here |
| A great match | A match rated among the year's best |
| A record gate | The company's best attendance |
| A riot or a disaster | A crowd riot or a building disaster (`LIVEK.disaster`) |
| A debut or a farewell | A first match, a retirement match |
| A home-town moment | A wrestler won big in their home town |
| A famous loss | A long streak ended here |

## What it does

- **Heat from the past.** A match between two people with a memory in this building (the betrayal, the title loss) gets a lift, and the match story and commentary say so: "The last time these two were in this building, Klaus Cuckoo turned his back on him."
- **Signs in the crowd.** The show report lists two or three signs, written from the building's memories and who is hot (this takes in the shelved E7).
- **Banners.** A building with a famous night hangs a banner in the rafters, drawn in the venue's scene and named on the road map.
- **The road map.** Pressing a city or building lists its memories. Booking a show there shows "what happened here" before you book it.
- **Booking hints.** The desk can suggest a rematch in the building where it started (for the arc beats, `docs/plans/arc-beats.md`, and the Director, `docs/plans/director.md`).
- **The magazine** (0af) uses it in "This month in history".

## Steps

1. **Memories per building**, kept from the events above, small. Headless test: 60 weeks, errs 0, NaN 0, the store stays small.
2. **Heat from the past** in the match (CRX) and a line in the match story.
3. **Signs in the crowd** in the show report.
4. **The road map** list and "what happened here" when booking.
5. **Banners** in the venue scene, as the scene work reaches it.
