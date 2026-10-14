# The soap opera update: how stories grow out of the game

The game should hand the player stories, not just ask them to write them. Every arc built so far follows one pattern.

## The pattern: cause, warning, choice, payoff
1. **A cause the player made.** Something the booker did moves a feeling in the relationship matrix (`relBump()` in `src/66-relations.js`). For example, one tag partner wins singles matches and the other does not.
2. **It builds slowly and fades on its own.** Jealousy loses 3% a week, so only a run of the same thing gets anywhere. Nothing comes from a flat chance.
3. **A warning the player can read.** The dirt sheet's rumours (`netRumours()` in `src/94-net.js`), Backstage scenes, or a matter on the desk.
4. **A choice.** A matter on the desk with answers (`pushEv()` and an `EVR` entry), or something to do backstage (taking a jealous wrestler aside lowers their jealousy).
5. **A payoff with a reason given.** When it happens, the text says why ("X has been jealous of Y for weeks").
6. **They remember it.** Every answer goes through `relBump()` and `youRemember()`.

## Built so far
| Arc | Cause | Warning | Payoff | Where |
|---|---|---|---|---|
| The partner left behind | Singles wins and titles for one tag partner | Dirt sheet: "tired of standing in Y's shadow" | The jealous one turns after a tag loss | `src/66-relations.js`, `src/94-net.js`, `src/10-match.js` |
| The student passes the teacher | A trained wrestler (`w.coach`) becomes more over | The matter itself | Put them over, leave it (jealousy), or teacher against student | `src/76-student.js` |
| Friends on a collision course | A friend of the champion climbs to next in line | The matter itself | A respectful title match, a friendship gone sour, or kept apart | `src/76-friends.js` |
| A rival star on the way out | A top rival wrestler with no title and a deal running down | Dirt sheet: "unhappy with their spot" (Thin or Likely) | Confirmed when they leave, an update if they stay; the player can sign them | `src/94-net.js` |
| Rumours that come due | Contracts running down, free agents seen | The rumour, marked Sure, Likely or Thin | Confirmed, corrected or updated weeks later | `src/94-net.js` |

## Rules for the next arc
- Use what the game already keeps. Add a field only when nothing holds the cause.
- It should be rare. Check how often it happens over 60 weeks of several companies, and say so in the commit.
- If an arc makes a claim ("the dirt sheet will say"), make it true or cut it.
- Arcs with no player cause are background (rival companies). Arcs on the player's roster need a warning first.

## Next candidates
- The veteran on the way out who wants one last run.
