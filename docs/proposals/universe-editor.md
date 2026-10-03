# Proposal: the universe editor (wish 99)

**Status:** decided on 3 October 2026. Ryan asked for the full editor as its own page called World Editor on the title screen, with Workshop upload. Built as `TASKS.md` task 0. The text below is kept for the record.

## The idea

Edit promotions and wrestlers inside the game, with problems explained in plain words. Today a universe is a JSON file made by hand or by the tools in `tools/`. The validator (`E.validateUniverse`) already finds problems and names them. An editor would let a player fix them without a text editor.

## Three sizes

1. **Checker only.** Paste or load a file, see the problem list, copy it. This exists in part (the universe report window).
2. **Roster editor.** Pick a promotion, rename it, add or remove wrestlers, change ratings with sliders, set titles and teams. Save as a file.
3. **Full editor.** Everything in the file format, including contracts, rivalries, events and sponsors.

## What I would build first

Size 2, limited to wrestlers, promotions and titles. It reuses the creator window for portraits and the validator for checking. It would live on the title screen under Workshop (the button is already there and says "not open yet").

## Risks

- Every field needs a plain-words label and a safe range.
- The editor must not break the rule about original content. It would show a reminder when a name looks like a real promotion or wrestler, but it cannot stop a player.
- The file must still load in older versions of the game.

## Questions for Ryan

1. Which size?
2. Should it live on the title screen only, or also inside a running game?
3. Should it warn about names that look like real people?
