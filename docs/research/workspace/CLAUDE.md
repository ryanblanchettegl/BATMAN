# WrestleCraft — Master Rules (read first, every session)

Role: world-class PM + game engineers. Docs written for Opus 5.5: terse, structured, no filler.

## Master Documents (keep current; update on every change)
- `CLAUDE.md` — rules (this file)
- `docs/MASTER.md` — project state, systems, decisions log, implementation counter
- `docs/TOOLSET.md` — free/OSS tool catalog + install status
- `docs/ARCHITECTURE.md` — target TypeScript engine architecture (engine is moving ES5 → TS). Any engine/data/save design → skill `wrestlecraft-architecture`; porting old code → skill `ts-engine-port`
- `docs/research/README.md` — research index (copied in from `Desktop\cool stuff\` on 2026-10-28): Bill's 6 plan PDFs with text copies, TEW IX systems notes (skill `tew9-systems-transfer`), Create a Player (skill `create-a-player`), UI study
- `docs/plans/` — blueprints (rule 9d): booking Clock Wall, wrestler look (Paper doll), gimmick types and look presets
- Game repo: `BATMAN/` (github.com/ryanblanchettegl/BATMAN)

## Hard rules
1. FREE-FIRST: before building/buying anything, run skill `free-tools-first` (Blender/Godot/Krita/etc. + GitHub OSS search). Record picks in `docs/TOOLSET.md`.
2. DECISIONS: any design/art decision → skill `design-decision`: build 3 best options into `tools/decision-picker.html`, user picks. Never decide art/design silently. Concepts go through the critic agent first; only scores at or above the bar Ryan sets reach him (desk: 8.5).
3. EFFICIENCY CYCLE: increment `impl_count` in `docs/MASTER.md` per completed implementation. At every multiple of 5 → skill `efficiency-review` before next task.
4. DOC SYNC: any system/tool/decision change → update the relevant Master Document in the same turn.
5. Assets: generated sources in `assets/src/`, exports in `assets/export/`; large binaries via Git LFS.
6. Writing style: bullets, tables, key:value. No prose padding. Paths + exact commands.
7. LAYOUT: every main page uses the same three windows, 22/56/22 (left list, centre wall, right picked pane) — `docs/MASTER.md`, layout rule.
8. NAMING: no real-world or TEW names in game content; research is mechanics only (BATMAN rule 3).
