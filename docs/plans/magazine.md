# The monthly wrestling magazine

Bill, 21 October 2026: "E4 - But I want A monthly wrestling magazine." This replaces idea E4 in the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, a zine of the year): the year's story becomes the magazine's annual issue, and the magazine comes out every month. Nothing here is built. One step at a time (rule 9a).

## The idea in one paragraph

An invented wrestling magazine, with an original name, comes out at the end of every game month and covers the whole world, not only the player's company. It is glossy and it plays along: like the newsstand wrestling magazines of the 80s and 90s, it reports the stories on screen as if they were real. The dirt sheet (`src/94-net.js`) tells the insiders' truth every week; the magazine tells the fans' version every month. The gap between them is the kayfabe layer made into something to read. Being on the cover matters to wrestlers, and a player can pitch a story or buy an ad.

## What is in an issue

Each part is built from what is true of the save, written by the grammar (`src/60-grammar.js`), picked by hash, never `rnd(S)`.

| Page | What it holds | Built from |
| --- | --- | --- |
| **The cover** | The month's hottest wrestler in the world, drawn by the scene engine's magazine cover template, with three cover lines | `E.power()` rankings, the "mag" template in `app/src/kit/scene.ts` |
| **The big story** | The month's biggest story told as real: a feud, a title change, a betrayal, an arc's chapter | Story sifting (`src/84-sift.js`), feuds, arcs |
| **The rankings** | A top ten for the world with who moved, and a top five per division | `E.power()`, `S.pw10` |
| **Match of the month** | The best match anywhere, with its stars and a paragraph | The match of the year list (`S.moty`) |
| **Around the world** | One line per company on its big night | `src/99-worldweek.js` |
| **The interview** | A wrestler talks, in their own voice (idea P4), sometimes about you | Memories (`youRemember()`), the relationship matrix |
| **The rumour mill** | Three rumours, marked Sure, Likely or Thin, in the magazine's own softer voice | The Net's rumours (`netRumours()`) |
| **Letters** | Three letters from different kinds of fan about what happened on shows | The four kinds of fan, the show reports |
| **The readers' poll** | Fans vote on a question (who deserves a title shot, who should turn); next month prints the result, and following it pleases them | Popularity, crowd reactions |
| **This month in history** | One or two lines from the save's own past, and from pre-history once it exists | The archive, `docs/plans/pre-history.md` |
| **The ads** | Invented sponsors, and merchandise for wrestlers who are hot | Sponsors, merchandise lines |

## What it does in the game

- **The cover.** Being on it lifts a wrestler's followers, merchandise and asking price for a month. Some wrestlers' goals become "make the cover" (career goals, `src/87-goals.js`). Nobody on your roster on the cover for six months is something the owner and the locker room notice.
- **The editor.** The magazine has an editor, one of the journalists in `src/99-press.js`, with a feeling about you. A friendly editor puts your big night on the cover; a hostile one gives your rival the big story.
- **Pitch a story.** Once a month, for a point of booking power or some money, the player can pitch the editor a story: a push for a wrestler, a feud to hype before a big night. It is an attempt, and it works better with a friendly editor and a story that is really hot.
- **Buy an ad.** Money for a page that lifts hype for your next big event (the event calendar's promotion spending).
- **The poll.** The result is a booking hint, as the shelved fan poll idea (IDEAS B4) described.

## The annual issue

After each flagship (the wrestling year ends at the big show, `docs/plans/last-booker.md`), the magazine prints a thicker annual issue: the year's story, the feud of the year with its timeline, awards, who rose and who left, the best quotes. One button saves any issue as an image set or PDF to share, which is the point of the old E4: players showing other people the stories their save made.

## Where it lives

A new issue is a line on the desk ("The new issue is out") that opens it in a pop-up, as the desk does for everything after a show. Past issues sit in the Net section beside the dirt sheet. The issue is a magazine spread in the workbench look (rule 2a): torn glossy paper, the cover drawn by the scene engine, marker cover lines.

## Keeping the save small

An issue is stored as a handful of ids and numbers (who, which match, which story, the poll), and its words are written again from the grammar when it is opened. The last twelve issues and every annual issue are kept.

## Steps, in build order

1. **The issue in the engine.** `src/9x-magazine.js` builds an issue at the end of each month from the save. Headless test: 60 weeks of every company, errs 0 and NaN 0, every issue has a cover star and a big story, and the same seed makes the same issues.
2. **Reading it.** The desk line, the pop-up spread, past issues in the Net section. The cover from the scene engine.
3. **What it does.** The cover's lift, the editor, pitching a story, buying an ad.
4. **Letters and the readers' poll.**
5. **The annual issue** after each flagship, and saving an issue to share.

## Open questions for Bill

- What is it called? It needs an original name (rule 3).
- Is there one magazine for the world, or one per region (a Japanese monthly, a British one) later?
- Can a rival's wrestler be on the cover of the issue that comes out the week of your flagship? (It would sting.)
