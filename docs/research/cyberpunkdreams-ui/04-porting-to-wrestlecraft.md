# 04 — Porting to WrestleCraft

The honest assessment first: **the surface does not transfer, the structure does.**

## Compatible traditions, incompatible surfaces

cyberpunkdreams is a dark terminal: near-black field, light inverted buttons, blur, red accents.
WrestleCraft is black construction paper with cut pieces, flat colour, hand lettering, and no
shading on wrestlers (rule 2a). Put their palette on your board and every paper screen dies.

But their **card art is hand-inked illustration** (500×650, pen and ink with digital colour),
not 3D and not photography. So both games are built on *made* objects. That is why the
structural ideas transfer cleanly even though the skin cannot.

## Mapping

| cyberpunkdreams | WrestleCraft translation |
|---|---|
| 32px window bar + 30px header | a taped paper strip across the top with the show name and date |
| left rail of twelve single-fact blocks | slips pinned down the left: roster state, heat, money, injuries |
| centre card board | the booking sheet / segment cards |
| right laterals + effects | consequences slip: projected heat, morale, cost, fallout |
| `card-branch-played` (dimmed, stays on board) | **a booked segment stays on the sheet as a cut card, pushed back** |
| `button:hover { padding-left:24px }` | a card **slides out of the stack** and tilts flat |
| `cardFadein` with blur | **drop and settle** — see caveat below |
| `fadeInPartial` at 0.6 | played segments at reduced contrast, not hidden |
| light buttons on dark | white paper strips on the black board — you already do this |

## The five transfers, concretely

### 1. Three-zone desk

```css
.desk { display:grid; grid-template-columns: 220px minmax(0,1fr) 240px; gap:18px;
        align-items:start; }
```

Left = status slips, centre = the sheet, right = consequences. Unlike their fixed `100vh`,
**let the centre column scroll** — a booking sheet has many segments and a fixed frame would
trap them. Do not copy `overflow:hidden`.

### 2. A played segment stays on the board

This is the big one, and it is a data change as much as a style change: a booked segment should
render as a card at `opacity:.7`, slightly rotated, in place, after booking — not disappear into
a list. It gives the sheet a physical memory and makes "what did I book?" answerable at a glance.

### 3. Hover slide instead of hover grow

Their button doubles left padding. In paper the equivalent is the piece **sliding out of the
stack**:

```css
.seg { transition: transform .3s, box-shadow .3s; }
.seg:hover { transform: translateX(6px) rotate(-.4deg); }
```

You already lift on hover (rule 2a); add the lateral slide and a fraction of rotation, so it
reads as a piece being pulled forward rather than a UI element highlighting.

### 4. Attention gradient via partial presence

Their `fadeInPartial` stops at `0.6`. Copy the *idea*, not the value: played/inactive segments
should be **less present** (lighter paper, smaller shadow), active ones full. This is what stops
a dense booking screen from being a wall.

### 5. Consequences that make room for themselves

Their laterals animate `margin-bottom` from `-111px` to `0` so arriving blocks push the layout
open. Translated: when a segment is added, the consequences slip should **grow downward and push
the stack**, not appear in reserved empty space.

## The one thing not to port: blur

Their entrances blur at 5% and sharpen. **Do not blur paper.** A blur implies a lens, which
breaks the material metaphor — paper does not go out of focus. Use instead:

```css
@keyframes settle { from { opacity:0; transform: translateY(-10px) rotate(-1.2deg); }
                    to   { opacity:1; transform: translateY(0)     rotate(0); } }
```

A dropped piece lands and straightens. Same duration band (0.3–0.5s), same intent, correct
material.

## Durations

Keep their discipline: **0.3s for state changes, 0.5s for movement**, and nothing longer. Your
existing hover lift should be 0.3s.

## Build order

1. `.desk` grid on the booking screen; move existing controls into the three columns. No visual
   change to pieces yet — just placement.
2. Convert segment rows into cards that render post-booking in place (data + render).
3. Add the settle keyframe and replace any fade-only entrance.
4. Add the hover slide + fraction of rotation.
5. Dim played cards; verify the screen is still legible at 20 segments.

## Acceptance checks

- A 20-segment sheet is still readable and scrolls without the frame clipping.
- A booked segment is visibly still there, and distinguishable from an unbooked one.
- Nothing blurs. Nothing scales. Nothing bounces.
- Only one accent colour carries "action", and it does not also carry "error" unless you
  deliberately adopt their shared-meaning trick.

## What their design says about yours

Theirs is calm because **every element is one fact in one place**. Your screens are expressive
— texture, hand lettering, pieces with weight. That is a different pleasure, and the risk is
opposite: not density, but *scatter*. The single most useful thing to borrow is their
discipline about hierarchy: one dominant object per screen, everything else small, quiet and
read-only.
