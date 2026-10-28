---
name: wrestlecraft-team
description: Master skill for every WrestleCraft session, Bill's or Ryan's. Use at the start of any work, whenever Bill or Ryan makes or changes a decision, before asking them anything, and when a task starts or ends.
---
# WrestleCraft team: two people, one brain

WrestleCraft: Be The Booker is made by **Ryan** (builds the game, owns CLAUDE.md rules, answers blueprint gates, rule 9d) and **Bill** (plans, research, priorities, merges with Ryan). Both run Claude sessions. All active work happens in `C:\Users\Ryan\Desktop\WrestleCraft` on the desktop PC. The shared brain is `team/` there (see `team/README.md`).

## 1. Start of every session
- Run `node team/brief.js` first (the SessionStart hook does it when installed): NOW, OPEN, the last 15 decisions. Want more history: `TEAM_BRIEF_N=40 node team/brief.js`, or grep `team/DECISIONS.md` for the area.
- Do not re-ask anything already in DECISIONS.md. Do not decide anything listed in OPEN.md: ask the person it names.

## 2. Every decision, at once
The moment Bill or Ryan decides something (a pick, a yes, a rule, a change of mind), before doing anything else:
```
node team/decide.js <Bill|Ryan> <area> "<the decision in one plain sentence>" [--replaces D-012] [--closes O-3]
```
- Areas: modes, world, balance, booking, live show, screens, art, gimmicks, engine, features, process, sound, ship.
- One sentence, the person's own words where possible, no reasoning. Long detail goes in a plan doc; the line points to it.
- A decision that goes against the other person's earlier line does NOT replace it. Log it, then add an OPEN line naming both (`- O-n (Bill + Ryan) ...`). Only the two of them settle a clash.
- Claude never logs its own recommendation as a decision.

## 3. Tasks
- Before starting a task, claim it in `team/NOW.md` (one line: who, task, date). Clear the line when done or dropped. Never take a task someone else has claimed.
- The PM session splits work between Ryan's and Bill's time and keeps NOW.md under 40 lines.

## 4. Spend fewer tokens
- Read the brief, not whole files. Grep, then read only the lines you need. CLAUDE.md is about 92 KB and loads in every session; do not read it again by hand.
- One task per session. Start a fresh session for unrelated work instead of carrying a long chat.
- Replies: lead with the result, short, no replay of the work.
- Anything worth remembering across sessions goes in team/ (decision, open question, claim), not in chat.
- When a procedure repeats a third time, make it a skill in `.claude/skills/` and log the decision to use it.
- Every few sessions, trim: fold old DECISIONS lines that were replaced, clear stale NOW lines, close answered OPEN lines.

## 5. Where things are
- Rules for the game: `CLAUDE.md` (Ryan). Plans: `docs/plans/`, `Research/docs/plans/`. Ryan's architecture: `Research/docs/ARCHITECTURE.md`. Ryan's own skills: `Research/.claude/skills/` (design-decision, free-tools-first, ts-engine-port, wrestlecraft-architecture, efficiency-review).
