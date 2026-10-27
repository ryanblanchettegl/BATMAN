---
name: free-tools-first
description: Use before building any feature, asset or pipeline step in WrestleCraft. Checks the tools already here and searches for free, open-source tools or code that already solve it.
---
# free-tools-first

1. Read `docs/toolset.md`. If a listed tool covers the need, use it, by script (Node, Python, ffmpeg, ImageMagick `convert`, Playwright, Blender `bpy` from pip).
2. Else search:
   - GitHub: `gh search repos "<concept>" --sort stars --limit 10` (also "<concept> javascript", "<concept> open source").
   - `WebSearch`: "<concept> open source free"; for assets OpenGameArt, Kenney, Poly Haven, Freesound (CC0), Musopen.
3. Filter: licence (CC0, MIT, BSD, Apache, zlib first; GPL fine for a tool that is not shipped; anything non-commercial is out, rule 2), a commit in the last two years, works on Linux (this cloud) and ships on Windows (Steam).
4. Give a table: tool, fits, licence, effort, how to install. Pick the best; if the pick is a look, a sound or a name, use the `design-decision` skill.
5. Add the new tool to `docs/toolset.md`. An asset that ships gets its source and licence in a credits file beside the tool that brings it in (rule 2; `tools/music/CREDITS.md` is the pattern).
