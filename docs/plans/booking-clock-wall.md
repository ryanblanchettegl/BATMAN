# Blueprint: the Clock Wall booking screen

Status: approved (rule 9d gates 1-3, 2026-10-26). **Build after the TypeScript engine switch, on the new engine** (Ryan). The engine queries (§4) are written once, in `engine/systems/show/` and `story/`; nothing goes into the ES5 `src/`. Chosen by Ryan 2026-10-26 from 3 critic-approved finalists (Wall 8.6). No code until Ryan answers the questions below and says go.
Mockup: `tools/concepts/booker.html?v=wall` (sample data). Real v0.88 screen it replaces: `tools/concepts/current/booking-*.jpg` (`app/src/screens/booking/Card.tsx`, `Side.tsx`, `run.ts`).

## 1. What the player sees (1080p, one screen, no page scroll)
Column widths changed by Ryan on 2026-10-27 to the game-wide 22/56/22 (MASTER.md, layout rule).
| zone | width | contents |
|---|---|---|
| Left: Your roster | 22% | search, filter chips (All, Men, Women, Faces, Heels, Free), scrolling list of wrestler rectangles: bust, overall, side, style or belt, feud dots, labelled Body and Mood bars, "booked" mark |
| Centre: the Clock Wall | 56% | toolbar (Suggest, + Match, + Promo, + Angle, Clear, CROWD stamp, time left); ruler 0:00 to 2:00 (ticks every 5, labels every 15); pieces whose height = minutes; "N MIN OPEN" block; red 2:00 line; FEUDS gutter with one lane per running feud; loose-thread strip |
| Right: the picked segment | 22% | masthead (busts, names, expected-winner bar); option tiles (Type, Length, Rules, Title, Ending, Finish) opening sticky-note pop-ups; Who fits this spot (when a spot is empty) or the road agent's facts (when full); What this card changes; Earlier, Later, Remove, Next |
Top menu bar, notification bar and bottom line stay as they are (rule 5a). SPACE reads: Finish the card / Fill N min / Cut N min / Ring the bell · N threads loose.

## 2. States and what moves them
| state | entered by | SPACE says |
|---|---|---|
| Empty | new show | Fill 120 min (Suggest offered) |
| Building | any booking | Finish the card (empty spot) or Fill / Cut N min |
| Ready | every spot filled, within ±5 min | Ring the bell (· N threads loose) |
| Over | total > 2:05 | Cut N min (pieces past the line hatched red) |
The live show, After the show and everything downstream are unchanged.

## 3. Interactions (rule 5: mouse, touch, keys, pad)
- Book: drag a roster card onto a spot; or press the card, then press a spot; or press a Who-fits row (books straight in, focus goes to the next empty spot or Finish).
- New match: drop a wrestler on the open block. Book a feud: drop or press a loose-thread note.
- Swap or remove: drag a booked name to another spot (swap) or back onto the roster (remove); ✕ on the name.
- Reorder: drag a piece by its grip; Alt+arrows; Earlier / Later buttons. `[` and `]` change the picked segment.
- Options: tiles open pop-ups (rule 6a); arrows move between choices; Esc closes.
- Feud lane: press to name the feud and pick the first segment it touches.

## 4. Data (engine owns it; screen only reads)
No new save fields needed for the screen. It reads what exists:
| need | source today (v0.88) |
|---|---|
| card, minutes, clock, over/short | `S.card`, `E.clock(S)`, `E.matchMins`, `E.fitShow` |
| segments (promos, angles) | `E.segInfo(S)`, `src/93-segments.js` |
| options lists | `E.MT`, `E.STIP`, titles, finishes (`how`), `call` + BP cost (`E.matchOdds`) |
| flags (worn, chemistry, promised, unhappy) | `E.cardFlags(S)` |
| agent facts | `E.agentReads(S)`, `S.know` (fog of war, rule 8a) |
| feuds and heat | `S.feuds`, `E.feudPlan` |
| crowd word | `E.expectWords`, `crowdWord()` |
| relationships, promises | `relOf`, promises in `src/96-first.js` / tasks |
New engine queries (pure, headless-testable):
- `E.fitsFor(S, slotKey)` → ranked free wrestlers with reasons (feud +, chemistry +, splits another feud −, face/heel clash −, mixed team −, worn −, owed a win +).
- `E.cardKnock(S, card)` → lines `{kind, text, ids}` (feuds on/off/half, promise owed, worn bodies, BP cost, title).
- `E.looseThreads(S, card)` → running feuds not meeting tonight, with stakes text.
After the TypeScript switch these live in `engine/systems/show/` and `story/` (docs/ARCHITECTURE.md §3).

## 5. Pictures (rule 9c)
Storyboard frames (entrance, the turn, the finish) on the selected full match and 28+ min pieces, drawn by `kit/scene.ts` stills, cached per recipe.
**Gate:** cached frames at 160×90, max 3 on screen, hold 60 fps while dragging on the modest-PC spec. If not, fall back to one still per piece.

## 6. Balance and the loop
Nothing changes in how shows rate. The screen makes existing costs visible earlier: worn bodies, promises, cooling feuds, BP for a called finish. Rule 7a: the screen always hands the show something (loose threads, a promise, a rematch).

## 7. Build order (after approval; one step, one go-ahead, rule 9a)
1. Engine queries `fitsFor`, `cardKnock`, `looseThreads` + `test-booking-wall.js` (60 weeks, errs 0, NaN 0, no `rnd(S)`).
2. Three-zone layout with today's run sheet in the centre (no visual change to pieces yet) + roster column with drag/press booking.
3. The wall: proportional pieces, ruler, open block, 2:00 line, reorder by drag.
4. Right pane: tiles + pop-ups, Who fits, agent facts, knock-on slip.
5. Feud gutter + loose threads + SPACE labels.
6. Storyboard frames (after the render gate).
7. Browser test `app/tests/booking.js` rewrite; `fits()` at 1080p, 1440p, 4K; journey.js.

## 8. Ryan's answers (gate 2, 2026-10-26)
| # | question | answer | what it changes |
|---|---|---|---|
| 1 | Notes tabs | Pop-ups from the right | a row of small tab buttons on the right pane (Notes, Order, Clock, Promo, Stories, Targets), each opens a pop-up |
| 2 | Short pieces | One line | under 10 min: names on one line, flags as "+N" |
| 3 | 3-hour shows | Squeeze to fit | ruler always fits the screen: 0:00 to 2:00 or 3:00 |
| 4 | Other brand in Who fits | Yes, flagged | other-brand wrestlers appear with a red "Other brand" flag and a cost (`fitsFor` takes the show's brand) |
| 5 | Drop on a full spot | Swap | as mockup |
| 6 | Suggest | Fill gaps first, rebuild on second press | button label changes to "Suggest all" after the first press |
| 7 | Win chances | **Words only** | expected-winner bar labels become words ("a strong favourite", "about even", "an upset"); the Finish pop-up's BP costs stay numbers |
| 8 | Loose threads | **Every running feud** | strip shows up to 3 with "+N"; "+N" opens a pop-up list of all of them |
| 9 | Tone | Keep it personal | as mockup |
| 10 | Hurt before the show | Mark red, you decide | piece goes red with a note; Who fits offers a replacement; SPACE "Finish the card" |
| 11 | Battle royal | One piece, name grid | chips grid inside the piece; drop more onto it |
| 12 | Tag teams | Yes, a Teams filter | roster chip "Teams"; dropping a team fills one side |
| 13 | Render gate fails | Ship with one still each | fallback is a single cached still per piece |
| 14 | Paper skin | Yes | Corkboard texture on the ruler and the open block |

## 9. Original questions
**Layout**
1. Roster on the left takes 22%: OK to move the booking notes tabs (Notes, Order, Clock, Promo, Stories, Targets) into the right pane's pop-ups?
2. A 5-minute promo is a thin piece. Minimum height for short pieces: keep one line, or always two?
3. Shows of 3 hours (big events): same ruler squeezed, or a ruler that scrolls inside the wall?
**Booking**
4. Should "Who fits" ever suggest someone from another brand's roster on a weekly brand show?
5. When a booked name is dragged onto a full spot, swap (as in the mockup) or replace and send the old one back?
6. Should Suggest fill only empty spots (mockup) or rebuild the whole card like today?
**Information**
7. The expected-winner bar shows percentages. Rule 4 allows chances as percentages; keep it, or words only ("a strong favourite")?
8. Loose threads: show every running feud, or only ones the player started or that are hot?
9. Knock-on lines: is "Spike Sharpe is unhappy. A loss here will be remembered." the right tone, or more neutral?
**Edge cases**
10. A wrestler gets hurt between booking and the show: mark the piece red and keep it, or pull them automatically?
11. Battle royal (6 to 30): one tall piece with a name grid, or a pop-up list?
12. Tag teams: drag a team as one card from the roster as well as single wrestlers?
**Pictures**
13. If the render gate fails, ship without storyboards or delay the screen?
14. Paper skin: add the Corkboard's warmer texture to the ruler and open block (the critic's note)?
