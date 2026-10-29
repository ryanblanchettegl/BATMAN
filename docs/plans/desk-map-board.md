# The desk: the Map Board

Bill's design (D-034, picked D-035, 28 October 2026). Concept: `Research/tools/concepts/desk.html?v=board`. Shots: `Research/tools/concepts/review/desk-r9-board.png` and `-1440.png`. Critic score 7.9 after three passes; the fixes still open are listed under "Must fix in the build".

**Status: blueprint with Bill's answers (rule 9d gates 1 and 2 done).** Bill and Ryan agreed this replaces the People Wall (D-028) for the main game.

## What the desk is for

The desk is the first screen of every week. It answers three questions in three columns, left to right:

1. **How are we doing?** Your company (left).
2. **What is coming?** The next show (middle).
3. **What must I do?** Your to-do list (right).

The player's decision on this screen: work down the to-do list, then book the show. Everything else is reading.

**Director tag (rule 9g):** problem. **Hands on (rule 7a):** the locked show and the head to head carry into Booking; the to-dos left open carry into the week; the owner's line and the next big event carry into the season. **Replaces:** the current desk (`app/src/screens/office/Desk.tsx`) and the People Wall concept.

## Rules this screen keeps

- One way to do each thing (D-031). SPACE on the bottom bar is the one shared shortcut. Nothing else on the desk does what another control does.
- The road map stays, readable (D-032).
- Not busy (D-033). One main picture (the poster on the map), one red thing (the first to-do).
- Three columns, 22 / 56 / 22 (D-020). One screen, no scroll (rule 5b). 1080p base, scales to 1440p, 4K and ultrawide (rule 0). Type follows the smaller side of the screen, nothing under 14px, buttons at least 40px tall.
- The workbench look (rule 2a): the game's own craft pieces (`app/ui/craft/`), embedded fonts.

## The look, column by column

### Left: Your company (window title "Your company", company badge at the right)

From the top:

1. **You.** The booker's face, "Level 3 · Learning the ropes", booking power and the first or next show in one line.
2. **The standings.** A newspaper clipping: the companies by TV share, your row highlighted. Rank is the row number.
3. **Two numbers** the bottom bar does not show: this week's net (green or red) and the locker room's mood in a word.
4. **Top stars.** Three rows: face, name, one word (Champion, Red hot, Hurt: 2 weeks), overall rating badge. A hurt star says so.
5. **Ones to watch.** The two with the most potential: face, name, development trait and rating now, "rising".
6. **The owner.** A sticky note with one line the owner said this week.
7. **Next big event.** Name, weeks away, city.

Every row here opens that person's file or that page. Nothing here is an action.

### Middle: Next show (window title "Next show", "show 1 of 3 this week" at the right)

1. **The board.** The road map fills the window: this week's state or region cut from green card with a cream edge and a shadow on blue paper (the real shapes from `engine/91-shapes.ts`). This week's city on a yellow paper label beside a red pin; other stops on cream labels with their last grade spelled out ("Brisbane, last week: B").
2. **The poster**, pinned on the left of the board: the show's name in marker, "Wednesday · 8 PM · live from Melbourne", and the three most popular wrestlers standing full length (diorama renderer). A hurt one wears a HURT tag. Their names on a red strip at the foot.
3. **The night card**, pinned top right, clear of the coast: tickets sold as a big number and a bar; the building and city; what this crowd likes and the building's quirk; what they expect in words and stars (rule 8a). Under it, a red-edged sticky note for a head to head when there is one.
4. **On the card so far** (strip under the board): what is already set for this show: the main event's champion and an open challenger, promises owed, a sponsor's wish, and "Then": the next shows.
5. **Book show**: no second button. A hint under the strip: "Book show opens when the to-do list is done". SPACE does it once the list is clear.

### Right: To do (window title "To do", count in yellow marker)

1. **Before the bell.** One row a to-do: a face (if it is about a person) or a dot, the line in plain words, one button. The first row has a red edge. Button colour by kind (to settle: question 4).
2. **Last show.** The grade letter stamped, the verdict word, the crowd and share, the rival's share. Opens the report.
3. **New on the feed.** Three posts as index cards (a wrestler's on a sticky note). Each opens the Web page at that post.

## States

| State | What changes |
|---|---|
| Week with to-dos (normal) | As above. SPACE names the first to-do ("Answer Hazel"). |
| All to-dos done | The right column says "All done" with a green tick; the hint becomes "Ready to book"; SPACE says "Book the show". |
| Show already booked | The strip "On the card so far" shows the booked card; SPACE says "Go on the air" on show day. |
| After the show, same week | The poster turns to the next show of the week; Last show shows tonight's grade. |
| No show this week | The board shows the next stop; the poster says "Next: <show>, in N days". |
| Big event week | The poster is the big event's (gold edge); the night card adds the price and buys. |
| Head to head | The red sticky note on the night card. Only then. |
| A star hurt | HURT tag on the poster figure and "Hurt: N weeks" in Top stars. |
| First week of a game | The owner's welcome line in the owner note; Last show says "No show yet". |
| A tour that crosses the world | The board cuts the continent instead of the state, and the next stop over the water is a label at the edge with an arrow. |

## Flow

Desk → press a to-do's button → its pop-up (rule 6a) → answer → back to the desk with the row gone. When the list is empty, SPACE books the show (Booking, the Clock Wall, D-019). Last show opens the After the show recap. A feed post opens Web at that post. A star or one to watch opens their file. The standings open Company, Overview.

## What it needs from the engine (requests for Ryan, not code)

Most of it exists. To check or add:

- **Rank and standings by TV share** for the clipping (`E.audience` or the share in `engine/99-audience`?). One call that returns the companies in order with your row marked.
- **Top three stars by overall** and **top two by potential** (`E.overallOf`, `w.dev`, `w.lv`). One call, `E.deskCompany(S)`.
- **The three most popular wrestlers** for the poster (by `w.ovr`, how over they are), with a hurt flag.
- **The owner's line this week**: one sentence, picked by hash, true of the game (owner trust, a goal, a head to head).
- **The night card**: already in `E.road(S)` (sold, building, market, quirk) plus `E.expectWords(S)` and the head to head from `engine/88-nights.ts` before the show (today it is only known after).
- **On the card so far**: the champion of the main title, promises due, sponsor wishes, the next shows. Most are in `E.weekInFull`-style data today; one call, `E.cardSoFar(S)`.
- **The to-do list**: `E.tasks(S)` plus the inbox matters as one ordered list, first one first, with the kind of action for the button colour.
- **Last show**: `S.reports[0]` grade, verdict, crowd, share, the rival's share.
- **Feed**: the newest three posts from `E.liveFeed`/Web.

## Must fix in the build (from the critic, round 9)

1. The sea is a flat rectangle: give it paper texture and shrink it to the region.
2. Stop labels say what the letter means ("Brisbane, last week: B").
3. Left column: no dead gap; say why the big event is in another country (the tour moves there).
4. Grey hint text and sub-labels at 4.5:1 or darker.
5. The title strip's count in yellow marker.
6. Feed posts look pressable: a lift and focus ring on the card.

## Bill's answers (28 October 2026)

1. **Rank** is by TV share.
2. **Top stars** are ranked by overall rating (how good). The poster uses popularity, so the two lists differ.
3. **The poster:** the face of the company always stands in the middle, flanked by the next two most popular.
4. **To-do buttons:** a colour per kind of action (answer blue, assign green, money yellow); only the first row has the red edge.
5. **A hurt star** comes off the poster: the next most popular takes the place until they are fit. (Top stars still says "Hurt: N weeks".)
6. **Book show:** no button on the desk. A hint says when it opens; SPACE books the show.
7. **The owner note** shows only when the owner has something to say; otherwise that space goes to a third one to watch.
8. **Last show:** the grade, the crowd and share against the rival, and the match of the night in stars.
9. **The feed:** the three newest posts, each opening Web at that post.
10. **Big event weeks:** the same layout; the poster gets a gold edge and the night card adds the price and buys.
11. **Clicking a star** opens their file as a pop-up on the desk.
12. **You:** the booker is a drawn figure, made in Create a Player. This needs a look for the booker (a request: the booker has no `look` today, and the start of a game should let the player make one or give a default).

All twelve answered. Agreed by Bill and Ryan for the main game. Next: the go-ahead to change `app/` for the desk (rule 2a).
