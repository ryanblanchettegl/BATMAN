# cyberpunkdreams — UI study

An analysis of the interface in *cyberpunkdreams* (Steam 1361680, Late Night Games, Electron),
and what of it is worth borrowing for WrestleCraft.

**What this is not:** a copy of their design, and not assets to ship. Everything under
`reference/` is a local study copy of shipped files and illustration samples, kept so the
analysis is checkable. None of it should end up in a build.

## Contents

| File | What it covers |
|---|---|
| `01-design-tokens.md` | colour tokens, type scale, spacing, shadows |
| `02-components.md` | the shell, cards, lists, dialogs, inventory, notifications |
| `03-motion.md` | every keyframe and what the timing philosophy is |
| `04-porting-to-wrestlecraft.md` | what transfers to a papercraft game, what would fight it, and how to build it |
| `reference/css/` | `base.css`, `elements.css`, `fonts.css`, `keyframes.css`, `media.css` (study copies) |
| `reference/shell.html` | the shipped `index.html`, markup only |
| `sample-cards/` | five neutral card illustrations, to show the art direction |

## The one-paragraph version

It is a fixed three-zone application window — status rail on the left, card play in the centre,
consequences on the right — on a near-monochrome palette where red means both *hover* and
*error*. Motion is fades and slides at 0.3–0.5s, with blur used to pull focus. The core object
is a card: it opens, you choose, and the played card stays on the board, so the history of what
you did **is** the interface. Card art is hand-inked illustration, not 3D.

## Note on content

The game is an adult title. Its `grfx/cards/` folder (3,704 images) includes explicit material;
the five samples kept here are scenery only.

## Source of the findings

Static analysis of the shipped asar (2.35 GB, 5,376 entries) — CSS and markup only, plus
string-table decoding of the obfuscated Electron main and preload. The application was not
run, so statements about feel are inference from structure and timing. See
`../REPORT.md` for the security/architecture pass.
