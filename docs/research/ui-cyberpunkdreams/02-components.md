# 02 — Components

Read from `index.html` structure and `elements.css` (2,448 lines, 896 selectors). Class names
below are theirs; the descriptions are inference from markup, CSS and animation names.

## The shell

```html
<body>
  <div id="windowBar"></div>                       <!-- 32px drag strip -->
  <div id="header">
    <div id="tabButtons"></div>
    <button id="mainMenu">menu</button>
    <div id="submenu-mainMenu" class="submenu">
      welcome · account · options · history · switch character
      · logout · shortcuts · support · close
    </div>
  </div>
  <div id="container">
    <div id="left"    class="unit"> … twelve column-blocks … </div>
    <div id="centre"  class="unit"></div>
    <div id="right"   class="unit"> laterals · effects </div>
  </div>
  <div id="message"></div>
</body>
```

Key decision: **the menu is a submenu of buttons, not a modal**. `menu` opens a row of nine
plain buttons. No overlay, no animation beyond the submenu reveal — the navigation is part of
the furniture.

## The left rail

Twelve `column-block` modules in a fixed vertical stack:

`characterArea` → `areaBanner` → `lhOutfits` → `quickInventory` → `scene` → `objectives` →
`health` → `weapon` → `menaces` → `city` → `style`

Each is one fact. None expands. The rail is a **dashboard, not a form** — the UI equivalent of
glancing at a car's instruments. That is why twelve blocks do not overwhelm: they are all read,
never operated.

`#areaBanner` uses `areaBannerIn` / `areaBannerOut`: it drops in from `translateY(-100px)` when
you change area, so place-change is announced by motion rather than a screen change.

## The card

The dominant object (`card-branch` 54 rules, `card-open` 29, `card-branch-played` 19).

Anatomy from CSS and media queries:

- **Header** is a three-column grid: `image | title/description | action area`, roughly
  `196px auto 200px`, shrinking to `140px auto 200px` with a `140×182` image below 800px height.
- **Body** holds prose.
- **`branch-actions`** (31 rules) is the choice row at the bottom.
- **`card-open`** = the expanded card currently being read.
- **`card-branch-played`** = the same card, collapsed and dimmed, still on the board.

That last one is the design idea: a played card does not disappear into a log. It **stays where
it was played**, so the board is a physical record of the session. Nine `cardFadein` /
`cardFadeout` / `fadeInPartial` / `fadeoutup` keyframes exist to make that movement legible.

`quality` and `qualityFadein` / `qualityFadeout` suggest a rarity or outcome band applied to a
card on resolution.

## Hand, deck, decks

`hand`, `charHand`, `deck`, `decks` — cards you hold (drawn/buyable) versus the deck they come
from. `deckFadein` slides in from `translateX(-10px)`, `handFadeout` blurs out. So the
hand/deck is a **separate physical layer** from the played board: cards move from deck to hand
to board to history.

## Laterals and effects (right rail)

`#laterals` and `#effects` are `right-block`s. Their animation is distinctive:

```css
@keyframes lateralFadein { from { opacity:0; transform:translateX(100%); margin-bottom:-111px; } … }
```

They animate **`margin-bottom` from −111px to 0** as well as sliding in. That means the block
*pushes the layout open* as it arrives rather than appearing in reserved space. The effect is
that consequences physically make room for themselves.

## Dialogs

`accountdialog` (15 rules), `historydialog` (11), `bundle-dialog` (10), `confirmCancel`,
`deleteOutfit`, `followerTip`, `legalShizzle`, `mandatoryFlag`.

All are inline overlay panels styled from the same tokens — no window chrome, no shadows
beyond `0 0 5px`. They read as **slips of paper laid on the board**, which is consistent with
the inverted (light-on-dark) buttons.

## Inventory

`inventory-item` (16 rules), `inventoryHeader`, `inventoryButtons`, `supply-packet` (13),
`bundleList`, `bundleMiddle`, `bundledBottom`, `bundledRightInner`, `bundleCancel`,
`bundleFinalise`.

Inventory is a **grid of items with a bundle/consolidate workflow** — `bundle*` nodes imply
selecting several items and combining them. `supply-packet` is a container item.

## Notifications and the message bar

`notificationFadein` / `notificationRemove`, plus `#message` at the bottom of the body and a
`blinker` keyframe (`50% { opacity: 0 }`) for a caret.

Notifications drop in from `top: -15px` with a blur — they take the same visual language as
cards, so the interface stays one system.

## Sticky

`sticky` (12 rules) with `stickyFadein` / `stickyFadeout`. A pinned card that survives
navigation — the closest thing to a "keep this visible" affordance.

## What to take

1. **Rail of single-fact blocks**, read-only.
2. **Played cards persist on the board**, dimmed.
3. **Laterals that push the layout open** as they arrive (via negative margin), instead of
   appearing in pre-reserved space.
4. **One visual language for cards, dialogs and notifications** — all slips on the same board.
