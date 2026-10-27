---
name: design-decision
description: Use whenever a design, art, style, UX, audio or naming decision would be made in WrestleCraft. Present the three best options and let Ryan choose instead of deciding.
---
# design-decision

Ryan picks; Claude never decides a look, a sound, a word on screen or a name on its own.

1. Make exactly three strong, distinct options. Each has a title, a one-line pitch, pros, cons, and a picture when it is visual (a small SVG, a screenshot from `tools/screenshots.js`, or a swatch).
2. Show them:
   - Words only: `AskUserQuestion` with the three options, each with a `preview` (a mock-up, a snippet or a swatch in text). Put the recommended one first, marked (Recommended).
   - Visual: one HTML page with the three side by side, published with the `Artifact` tool (load the `artifact-design` skill first), and a picker on the page that saves the pick with the database capability (`artifact-capabilities`), as the sound audition page did. Read the pick back with `ArtifactData`.
3. Wait for the pick. Never build ahead of it.
4. Write the decision into `TASKS.md` under the task it belongs to, in Ryan's words and with the date (rule 9d keeps decisions there), then apply it.
