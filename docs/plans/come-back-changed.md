# They come back changed

Bill, 21 October 2026: "p3 - Yes!" From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea P3). Nothing here is built. One step at a time (rule 9a).

## The idea in one paragraph

A wrestler you released, buried or wronged can turn up again months later, at a rival company or on the indies, as a new character made from the grievance. Fired on screen by an authority figure, they come back as an avenger with that person in their sights. Lost a loser-leaves-town match, they come back under a mask. Released by you, they come back to the rival with your name in every promo. Their memory of you decides what they say, whether they will ever work for you again, and what it costs if you try. Your mistakes walk back through the curtain.

## What exists today

- **Releases are remembered.** `w.cut` (`src/78-models.js`) keeps the week, the company and its standing. A castoff who joins a smaller company arrives "with a point to prove" (`w.chip`).
- **Memories.** `youRemember()` and the pair memories in the relationship matrix (`src/66-relations.js`) keep what you did to them, with a week and a sentence.
- **Gimmicks.** Fourteen in `src/60-rpg.js` (`GIMS`), with what each is good for in `src/99-gimmicks.js`, and repackaging.
- **The indies** (`src/88-indies.js`) where free agents work while they wait.
- **Speaking out** (wish 73) covers the interview after leaving, not the return.

## Grievances

When something happens that a wrestler would hold against you, the game keeps a **grievance** on them: `{k, by, w, text}`, what it was, who did it (you, a company, a person), the week, and a sentence. It is kept small: the worst three.

| Grievance | Brought on by |
| --- | --- |
| Released | `w.cut` by your company |
| Fired on screen | An on-screen firing (the authority arc, an angle) |
| Lost a loser-leaves-town match | That stipulation |
| Buried | A long run of losses while over, or jobbing to someone below them |
| A broken promise | A title or push promised and not given |
| Screwed | Lost a title in a screwjob finish they did not agree to |
| Replaced | Their spot or tag partner given to someone new |
| Hurt and dropped | Released while injured |

## The return

A wrestler with a grievance who is away (released, at a rival, on the indies, or written off television) can come back. The game checks each month, by hash: the bigger the grievance and the longer they have been gone (three months at least), the likelier. They come back:

- **At a rival company**, signed by them, often at the rival's biggest show. The rival's booker uses the grievance against you.
- **On the indies**, building a following, and the news reports "the one who got away". You can sign them back, if they will come.
- **At your door**, for a one-off: they buy a ticket and stand in the front row (live call 28), or demand a match.

## The new character

The grievance picks the new gimmick and what they are after. Each pairing is data, so modders can add more.

| Grievance | Comes back as | Their target |
| --- | --- | --- |
| Fired on screen | **Rebel** or **Outlaw**: the avenger | The authority figure who fired them, then you |
| Lost a loser-leaves-town match | **Mystic**, masked, a new name | The one who beat them; a mystery until unmasked |
| Released | The same name, a harder edge (**Cocky** if heel, **Underdog** if face) | Your company: "the place that threw me away" |
| Buried | **Monster** or **Brute**: what you never let them be | Whoever you pushed over them |
| A broken promise | **Cocky**, a title in another company | You by name |
| Screwed | **Rebel**, with the screwjob in every promo | The one who held the title, then you |
| Replaced | Their old self, against the replacement | The one who took their spot |
| Hurt and dropped | **Underdog**, the comeback | You |

They come back with a mood (`docs/plans/traits-and-perks.md`): **Bitter** or **Proving it**. Their promos (P4, `docs/plans/promos.md`) call back the grievance in their own voice, with the date and what happened ("You fired me in front of eight thousand people in Harbour City").

## Will they work for you again?

The grievance sets a price. Their **want** shifts to revenge or respect, and signing them needs more money, a public apology (a promo segment you book), a promise you must keep, or a match against their target. A wrestler whose grievance you settled forgets it slowly and remembers that you did it (`youRemember()`, good). Some never come back: the worst grievance with a Proud or Hothead personality closes the door for good, and the file says so.

## The two-way story

The return is a ready-made feud. When they turn up at a rival, the desk offers: answer it (a promo back), ignore it, or try to bring them home. If they come back to you, a feud with their target is offered at once and counts as an arc seed (`docs/plans/arc-beats.md`: the comeback shape). The magazine (0af) runs the return as its big story.

## A caution: the Nemesis patent

Warner Bros. holds a patent on the Nemesis system (Middle-earth: Shadow of Mordor), reported to run to 2036, covering enemies who remember the player and come back changed. This plan stays clearly on its own ground: it is a release and return loop driven by the booker's business decisions (contracts, releases, booking), it runs through companies and contracts rather than a hierarchy of enemies who rank up by beating the player, and nobody "dies" and returns. A lawyer should look at it before release, as for pre-history.

## Steps, in build order

1. **Grievances** kept on wrestlers, from the events in the table. Headless test: 60 weeks of every company, errs 0, NaN 0, and grievances stay small.
2. **The return**, by hash: to a rival, the indies, or your door, with the news line.
3. **The new character** from the grievance, with the target and the mood.
4. **Signing them back**: the price, the apology, the door that stays shut.
5. **The feud and the arc seed**, the desk offer, and the magazine story.

## Open questions for Bill

- Should a masked return keep their identity hidden on screen until they are unmasked, even from the player?
- Can a wrestler with a grievance against a rival company come to you to get back at them?
