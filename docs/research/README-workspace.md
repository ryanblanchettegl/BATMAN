# Research index

Copied into the project from `C:\Users\ryanb\OneDrive\Desktop\cool stuff\` on 2026-10-28, so the project stands on its own. The originals stay in `cool stuff`.

## Design plans (Bill, 21 October 2026)
Each PDF is the source. The `.md` beside it is a text copy for search. Re-extract with `pdftotext -layout` if the PDF changes.

| file | one line | used in |
|---|---|---|
| `plans/WrestleCraft Review and Master Plan.pdf` | Verdict B- today, A in reach. The gorilla-position live show is the genre's best idea. Coasting, contradicting numbers and a chore-filled first hour hold it back. Market estimate: 8k to 20k copies year one at $24.99. | ARCHITECTURE §14 priorities |
| `plans/WrestleCraft game review and the road to A+.pdf` | Graded by area: simulation A, tests A-, broadcast A-, balance C, clarity C+. Fix: make systems bite, read clearly, feel finished. | balance and clarity work |
| `plans/WrestleCraft roadmap what to build first, what waits, what to cut.pdf` | Build first: clean the lists and bugs, a louder live show, a past and a first hour. Ship-gates: Steam client, installer, gamepad on hardware. Wait: GM tree, owner mode, most creator work, multiplayer. | roadmap order |
| `plans/What other genres can teach WrestleCraft.pdf` | 21 ideas. Top six: wrestler career mode, eras mode, territory map, the war as a struggle, the recruiting pitch, the owner's five-year vision. | future modes |
| `plans/Visual storytelling plan.pdf` | Point the existing diorama engine (puppet.ts, scene.ts) at more screens: belts on portraits, stills, templates. | Paper doll port, desk and roster pictures |
| `plans/Weekly podcast design and build plan.pdf` | The chat room becomes a weekly podcast with two hosts, built from S.feed and GR_CHAT. | built in BATMAN (`src/99-zpodcast.js`) |

## TEW IX systems notes (`tew9/`, 25 files)
- **Start with** `tew9-schema-index.md` (the whole picture), then `wrestlecraft-tew9-gap-audit.md` (the seven real gaps).
- **Skill:** `.claude/skills/tew9-systems-transfer/SKILL.md` lists every file and its use.
- **Rules:** mechanics only. Never TEW names, text or data in the game (rule 3, and Ryan: "use our own naming").
- **Already used:**
  - gimmick types → `docs/plans/gimmick-signatures.md`
  - worker and contract split, health pools (D7), regions (D1) → `docs/ARCHITECTURE.md`

## Create a Player (skill)
- `.claude/skills/create-a-player/` holds the skill and three notes: current state, data model, UX and testing.
- Ryan's later decisions win: modular pieces, morph to body, the Paper doll, and the layer editor.

## UI study: cyberpunkdreams (`ui-cyberpunkdreams/`)
- Four analysis notes: tokens, components, motion, and porting to WrestleCraft. These fed the desk and booker concepts (three-zone window, cards that stay on the board).
- **Not copied:** their shipped CSS, markup and card art (`cool stuff/cyberpunkdreams-ui/reference/`, `sample-cards/`). Those are another studio's files: study only, never in a build.
