# team/ : the shared brain for Bill's and Ryan's Claude sessions

Every Claude session that works on WrestleCraft, Bill's or Ryan's, reads and writes this folder.
It lives in `C:\Users\Ryan\Desktop\WrestleCraft\team\` on the desktop PC (ryepc), the one folder all active work happens in.
Nothing here goes through GitHub first: the file on this PC is the truth, so a decision written here is seen by the next session at once.

| file | what it holds | who writes |
|---|---|---|
| `DECISIONS.md` | every decision, one line each, numbered, newest last | any session, the moment Bill or Ryan decides (`node team/decide.js`) |
| `OPEN.md` | questions waiting on Bill or Ryan, and clashes between their calls | any session; an item leaves when a decision closes it |
| `NOW.md` | who is doing what right now: Ryan's lane, Bill's lane, claimed tasks | the PM session, and any session that starts or finishes a task |
| `brief.js` | prints the short brief (NOW, OPEN, last decisions) | runs by itself when a session starts (`.claude/settings.json`, once installed) |
| `decide.js` | adds a decision line, and can close an OPEN item | any session |

The rules for using it are the master skill: `team/SKILL.md` (CLAUDE.md points every session to it).

To make the brief print by itself when a session starts, a session on this PC copies `team/install/settings.json` to `.claude/settings.json` and `team/SKILL.md` to `.claude/skills/wrestlecraft-team/SKILL.md` (remote tools may not write in `.claude/`).
