# Decisions needed

One line each: what was chosen during an unattended run, and the alternative. The owner decides.

- Balance 0.73: on suggested cards the giant is still fired on 2 of 3 seeds and the workrate and outlaw companies go broke on 1 of 3. Chosen: leave it (the flat Suggest a card means the game cannot play itself). Alternative: soften the owner further for big companies.
- Parody notes: `docs/parody/` (who each parody character is based on) moved to `private/parody-notes/`, which is gitignored. Git history still holds the old files. Rewriting history to remove them is a separate decision (it needs a force-push, which this run does not do). The folder exists only in this container; keep your own copy.
- Licence: none chosen. Options: keep the code all rights reserved (no LICENSE file, the default for a commercial game); a source-available licence (people can read but not reuse); MIT or Apache-2.0 for the engine with the art and worlds kept separate; a separate permissive licence for world packages so modders can share theirs.
