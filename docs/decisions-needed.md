# Decisions needed

One line each: what was chosen during an unattended run, and the alternative. The owner decides.

- Balance 0.73: on suggested cards the giant is still fired on 2 of 3 seeds and the workrate and outlaw companies go broke on 1 of 3. Chosen: leave it (the flat Suggest a card means the game cannot play itself). Alternative: soften the owner further for big companies.
- Parody notes: `docs/parody/` (who each parody character is based on) moved to `private/parody-notes/`, which is gitignored. Git history still holds the old files. Rewriting history to remove them is a separate decision (it needs a force-push, which this run does not do). The folder exists only in this container; keep your own copy.
- Licence: none chosen. Options: keep the code all rights reserved (no LICENSE file, the default for a commercial game); a source-available licence (people can read but not reuse); MIT or Apache-2.0 for the engine with the art and worlds kept separate; a separate permissive licence for world packages so modders can share theirs.
- Eras (item 1): cut by the owner during the run (16 October). Nothing of it was committed; the world format stays at schema 1.
- WPW's belts (universes/parody/companies/wpw.json) start vacant, so every WPW title is decided in the first week of a game and floods the week around the world. Chosen: leave the data alone (Ryan's own company). Alternative: give each WPW belt its current holder in the world file.
- The desk test fails at 1280x720 about two runs in three: some cities have no state outline (E.road(S).shape is null), and the map check reads its name. Seen with a city in Chiapas. Not changed: the paper map is Ryan's work in progress.
