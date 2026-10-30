# Decisions: Bill and Ryan
One line per decision, newest last. Add with `node team/decide.js <who> <area> "<decision>" [--replaces D-012] [--closes O-3]`.
A later line wins over an earlier one only when it names it in "replaces". Seeded 2026-10-28 from Claude project memory (Bill) and Research/docs/MASTER.md (Ryan).

| id | date | who | area | decision | replaces |
|---|---|---|---|---|---|
| D-001 | 2026-10-21 | Bill | modes | Two modes. Booker Mode starts in the week of the company's grand show at the end of its business year; the next week opens a new wrestling year. Sandbox Mode is a free start with no mess. | |
| D-002 | 2026-10-21 | Bill | modes | Booker Mode opens with the previous booker's mess and teaches the game. Wrestling years run flagship to flagship, per company. | |
| D-003 | 2026-10-21 | Bill | world | Both worlds ship from day one. Parody world is the Steam default; a world switch sits top right of the title screen. (Ryan's D-024 disagrees, see O-1) | |
| D-004 | 2026-10-21 | Bill | process | Pause new features until balance, first hour and screens are fixed. (Ryan's D-021 disagrees, see O-2) | |
| D-005 | 2026-10-21 | Bill | balance | Picking the winner is free. Booking power pays for extras: protected finish, run-in, surprise, upset title change. | |
| D-006 | 2026-10-21 | Bill | balance | Suggest a card should land around a C. | |
| D-007 | 2026-10-21 | Bill | process | One PR per phase; Bill or Ryan merges. Licence is all rights reserved. | |
| D-008 | 2026-10-21 | Bill | live show | Keep the long broadcasts (no "key moments" pace). Play-by-play and colour commentators each get their own picking menu, not steps. Three-person booths come later. | |
| D-009 | 2026-10-22 | Bill | screens | 1080p is the design base; the game scales up to 1440p, ultrawide and 4K. No Steam Deck, no tablet. Use the full screen. | |
| D-010 | 2026-10-21 | Bill | plan | Seven-phase master plan: 0 lock plan, 1 balance, 2 Booker Mode and first hour, 3 screens, 4 live show, 5 launch slice, 6 sound and ship, then 7 free updates. Doc: claude.ai/artifact/2KAQNzmys18dszqCvtRWSP | |
| D-011 | 2026-10-21 | Bill | features | Approved for the plan: Director, catching fire + 40 live calls, arcs from beats, monthly magazine, promos as a main feature, traits/moods/perks, come back changed, Backstage Politics, hallway on the desk, word travels, locker room diorama, buildings that remember, corkboard (low priority), pre-history. | |
| D-012 | 2026-10-21 | Bill | features | Long game picks: career mode, one life in wrestling, owner's five-year vision, recruiting pitch, path to the Hall, families, coalitions, mission trees, territory map by region, rival owners, rival plans, trends, world firsts. Rejected: free agency week, power blocs. | |
| D-013 | 2026-10-22 | Bill | art | Character art round 3 locked: no ears, white paper border, every new touch is an option, cheeks off by default. Redo order: EWE, then WWE parody, then legends. (Ryan's D-030 differs, see O-3) | |
| D-014 | 2026-10-22 | Bill | balance | Stars were too easy. Earned star curve: 85 = 3, 90 = 3.5, 96 = 4, 98 = 4.5, 100 = 5 (PR #28). | |
| D-015 | 2026-10-26 | Ryan | engine | Popularity is stored per region: worker x region and company x region. | |
| D-016 | 2026-10-26 | Ryan | engine | Schema library zod; engine build esbuild. | |
| D-017 | 2026-10-26 | Ryan | engine | Morale and backstage are two modules; health is four pools (head, body, arms, legs). | |
| D-018 | 2026-10-27 | Ryan | engine | The simulation is TypeScript modules in engine/ (PR #29 merged). src/ is gone. | |
| D-019 | 2026-10-26 | Ryan | booking | Booking screen is the Clock Wall (Research/docs/plans/booking-clock-wall.md, 14 questions answered). Win chances in words only. Build on the TS engine. | |
| D-020 | 2026-10-27 | Ryan | screens | Every main page uses three columns: 22% / 56% / 22%. | |
| D-021 | 2026-10-26 | Ryan | engine | Relationship types (family, personal, romantic) now, with full UI. Marked "confirm with Bill" (O-2). | |
| D-022 | 2026-10-27 | Ryan | gimmicks | 20 gimmick types (docs/plans/gimmick-signatures.md). Gimmicks drive only acting, dialogue and relationships, never looks or match ratings. 20 separate look presets. | |
| D-023 | 2026-10-27 | Ryan | art | Create a Player is modular, with a SmackDown-style layer editor on skin and all gear, three poses, looks unique across the world, changes on a turn and with age. | |
| D-024 | 2026-10-26 | Ryan | world | Public domain world is the Steam default, parody opt-in after a lawyer. Marked "confirm with Bill" (O-1). | |
| D-025 | 2026-10-27 | Ryan | art | Wrestler look is G Paper doll from Ryan's reference image: human build, felt-grain card, thick cream border, solid gear, brass pins, pads on everyone, small ears. EWE first, after the TS switch. (see O-3) | |
| D-026 | 2026-10-28 | Bill | process | All active work happens in C:\Users\Ryan\Desktop\WrestleCraft on the desktop PC, not GitHub. Bill's and Ryan's sessions share team/ there and log every decision in it. | |
| D-027 | 2026-10-28 | Ryan | process | Retire Research/docs/MASTER.md; team/ is the one source of truth, MASTER.md points to it and its live optimization ideas move to the task list. |  |
| D-028 | 2026-10-28 | Ryan | screens | The desk is C, the People Wall: who needs you on the left, the night down the wall, the road and the picked person on the right (Research/tools/concepts/desk.html?v=people). |  |
| D-029 | 2026-10-28 | Bill | process | New split: Ryan works on the game on GitHub (balance and core features); Bill's sessions on the desktop PC work on art, style and game design. | D-026 |
| D-030 | 2026-10-28 | Bill | process | Ryan does not need to know about team/ yet; his focus is the engine right now. team/ is for Bill's sessions for now. |  |
| D-031 | 2026-10-28 | Bill | screens | One way to do each thing on a screen: no second button or option that does the same as another (the SPACE key is the one shared shortcut). |  |
| D-032 | 2026-10-28 | Bill | screens | The road map stays on the desk somewhere, big enough to read (on the People Wall it sits at the foot of the right column). |  |
| D-033 | 2026-10-28 | Bill | screens | The People Wall desk is too busy and the layout is wrong: none of the finalists (Poster 8.3, Door, Clock) goes ahead. The desk needs far fewer things on screen. |  |
| D-034 | 2026-10-28 | Bill | screens | The desk: left is your company (your stats, company rank, money, top 3 stars, top 2 potential, other manager stats); middle is the next show (a poster with the 3 most popular wrestlers, the map built in with the night's information, and what is already coming up on the card); right is your to-do list with the actions you must take, plus the feed's new posts, rating results and other clickable information. |  |
| D-035 | 2026-10-28 | Bill | screens | The desk is the Map Board (Research/tools/concepts/desk.html?v=board, critic 7.9): your company left, the poster pinned on the map with the night card middle, to do right. Blueprint: docs/plans/desk-map-board.md. |  |
| D-036 | 2026-10-29 | Bill | art | Wrestler look is C Human: the human paper doll in flat colour (felt-grain card, cream paper border, soft shadow, knee and elbow pads on everyone), not F Human scrapbook. Replaces the round 3 look. | D-013 |
| D-037 | 2026-10-29 | Bill | screens | Desk Map Board answers (docs/plans/desk-map-board.md): rank by TV share; top stars by overall; the face of the company in the middle of the poster; to-do buttons coloured by kind; a hurt star leaves the poster; no Book show button (SPACE books); owner note only with news; last show adds the match of the night; three feed posts; big events get a gold poster; a star opens as a pop-up; the booker is a drawn figure. |  |
| D-038 | 2026-10-29 | Bill | screens | The Map Board is the desk for the main game on GitHub, agreed by Ryan (docs/plans/desk-map-board.md). | D-028 |
| D-039 | 2026-10-29 | Bill | art | Wrestler look is style C, Human: flat colour, cream border, drawn in the game by the concept's own code (concepts/characters.html?v=human); it must look exactly like the concept and nothing like the old art. | D-013 |
| D-040 | 2026-10-29 | Bill | art | A wrestler style is kept and goes to a PR only once the critic scores it 9 out of 10 or more. |  |
| D-041 | 2026-10-29 | Bill | art | Style C is ready for main as it now stands (beards along the jaw, serious faces, shaped women's gear, necks under long hair); Bill approved it after critic round 12 (8.9 fidelity, 9.0 game art). |  |
| D-042 | 2026-10-29 | Bill | screens | The Clock Wall booking screen goes to main only once the critic scores it 9.4 or more. |  |
