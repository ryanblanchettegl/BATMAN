# The art bible: the locked look (MASTER §7 row 3)

Status: draft, 31 October 2026. The look is taken from what Ryan says is right today: **Book the show** (the Clock Wall, `app/styles/clockwall.css`) and **the desk concept** (`docs/concepts/look/desk-concept-ref.webp`, Bill is building the desk). Every other page moves to this, one at a time, with Ryan's go-ahead. Rule 2a (the workbench, made by hand) still holds; this file says how it is laid out and how much goes on a screen.

## 1. Three windows, 22 / 56 / 22
- **Left (22%): reference.** What you look things up in: a list to pick from, or the facts behind the page. Quiet, small, read when needed.
- **Centre (56%): the wall.** Whatever matters most on that page, given most of the screen. It is not a timeline unless the page is about time; on Book the show it is the clock, on the desk it is the week, on Roster it could be the card of people, on Finances the money.
- **Right (22%): the picked thing.** Whatever is selected, told in full: who or what it is, its story, and the answers open to you. When nothing is picked it shows the page's own headline (the desk concept's right panel: the booker, who leads the ratings, the key numbers).
- One screen, no page scroll (rule 5b). The menu bar and the one bottom line stay as they are (rule 5a).

## 2. The pieces
| piece | what it is | rules |
|---|---|---|
| Window | torn cream paper, navy title strip with yellow marker | one title, a short note at its right end; nothing outside a window |
| Card | a cream card inside the wall, coloured top edge | small marker label, a bold one-line headline, one plain sentence, at most two buttons; a face when it is about a person |
| **Option tile** | an index card in a grid of three across, the way Book the show sets a match (`.cw-tile`, `TILES` and `WallOptWindow` in `app/src/screens/booking/Wall.tsx`) | small red marker label (the setting), the current value in bold hand, one short note; a blue top edge and a slight hand tilt that lifts when pointed at; pressing it opens a pop-up with that one setting's choices and Done returns. **Every setting in the game is chosen this way** (Ryan, 31 October): the page shows tiles, the choices live in pop-ups (rule 6a). The World Editor keeps its dropdowns (rule 5d) |
| Answer bar | a full-width bar in the right pane | the answer in marker, the chance at its right end, one line of what it costs or gives under it |
| Number box | a small framed box | a label in marker, one big figure; at most four in a column |
| Row | a line in a list | name first, one or two facts, one meter at most; the picked row in yellow |
| Sticky note | yellow paper | for asides only: the assistant, the end of the week, tips |
| Ticker | a navy strip along the bottom of the wall | the one line that sums the page up |

## 3. Colour has a job
- **Yellow:** tonight's show and the picked thing.
- **Red:** urgent, must do, the bell, money lost.
- **Blue:** the frame of the week, navigation, ordinary buttons.
- **Purple:** people backstage.
- **Green:** done, gained, a good answer.
- Never colour for decoration. Dark ink on light paper for every word (rule 2a).

## 4. Type and density
- Marker for labels, titles and buttons; the clean hand (Patrick Hand) for every sentence; figures may be in the clean face.
- Fewer things, larger: a card says one thing. If a window needs more than about 12 rows, it scrolls inside itself or turns pages; the page never does.
- Sizes scale with the window (`--fs`), from 1080p up to 4K (rule 0).

## 5. Motion (to be decided separately)
Windows land, the grade stamps, cards flip, money counts up. The motion language is its own art decision (three concepts), after this.

## 6. How a page is converted
1. The left, centre and right are named for that page (what is reference, what is most important, what is picked).
2. Built from the pieces in §2 only; no new piece without adding it here.
3. A screenshot at 1080p, 1440p and 4K is approved by Ryan and becomes the page's baseline (nightly diff, MASTER row 3).
4. `fits(page)` and the vision critic (rubric in `critic-review`) at 8.5 or higher.

## 7. Open
- How each page fills the three windows: three concepts (golden rule 2), shown on Roster, Backstage and a Company page.
