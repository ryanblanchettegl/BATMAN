# Plan: the live Gorilla Position

Ryan, 3 October: the broadcast becomes an active phase. Events interrupt the show and the player makes the call on the headset. Relationships are the centre of the game: every call ripples through how wrestlers feel about each other, about the booker and about the crowd. People remember what you did. A notification bar says what changed.

This plan is built in steps, one at a time. Step 1 is done.

| Step | What | State |
|---|---|---|
| 1 | The relationship matrix, memories, the notification bar | Built in 0.16 |
| 2 | The show runs in steps, and live events stop it for a decision | Next |
| 3 | The broadcast screen: the headset, the choices, the fallout | After 2 |
| 4 | Promos with depth: archetypes, feud heat by act, odds shifted by a good promo | After 3 |

## Step 1 (built): the relationship matrix

Code: `src/66-relations.js`. Tests: `node test-relations.js`, `app/tests/relations.js`.

The worker object does not change. How two people feel about each other is not a field on either of them. It is one entry per pair:

```
S.rm["12-45"] = {            // the two worker ids, lower first
  bond: -62,                 // -100 real heat ... +100 close friends. Shared.
  base: -40,                 // the part that has settled for good. The bond drifts back to it.
  resp: [35, -10],           // respect. [what the lower id thinks of the higher, the reverse]. -100..100
  jeal: [0, 45],             // jealousy, same order. 0..100. Fades unless fed. Sours the bond while it is 50 or more.
  mem:  [ {w: 31, k: "shoot", by: 45, t: "Dracula went off script about King Arthur on live television."} ],
  last: 31
}
S.rmY["12"] = { v: -20, mem: [ {w: 31, k: "pushed", v: -20, t: "You sent them to the finish while they were hurt."} ] }
```

- **Standing ties** (mentor and student, tag partners, family) are read from where the game already keeps them, through `tieOf(S, a, b)`.
- **One way in.** Every change goes through `relBump(S, a, b, {bond, ra, rb, ja, jb}, memory)` or `youRemember(S, worker, kind, text, v)`. A memory marked `keep` is one nobody gets over: 70% of the change is permanent, against 35% for an ordinary one.
- **What reads it.** Ring chemistry (`relChem`: friends and people who respect each other work better together), the "You" line of morale (`youLean`), the travel and court systems (`relOf`), the wrestler card (`E.relations`).
- **What feeds it today.** Every match on the player's shows (partners bond, a great match earns respect, a bad one costs it, a clean loss by a bigger name earns the winner's respect, the same winner over and over is a grudge), a title change (the people who thought it should be theirs grow jealous), betrayals, wrestlers' court, the road, and the headset calls the game already had.
- **The notification bar.** `note(S, heading, line, kind)` queues a line in `S.toasts`; the status bar shows it for a few seconds. It fires when a wrestler remembers something the player did, and when two people on the roster become friends or enemies.
- **Deterministic.** Nothing in the file calls `rnd(S)`.

## Step 2 (built in 0.24): live events

What was built, where it differs from the plan below (the plan is kept as it was written):

- The functions are `E.liveBegin(S, card)`, `E.liveNext(S)`, `E.liveDecide(S, choice)` and `E.liveInfo(S)`, in `src/31-live.js`. `runShow` in `src/30-show.js` is `showStart`, `showStep` and `showEnd`.
- A kind of call is an entry in `LIVEK`: `pre(S, L, step)` or `post(S, L, step, seg)` offers the call, `run(S, L, ev, choice)` applies the answer and returns one line. A call in a match is answered before the match is worked out, so the answer is built into it; the screen shows the ring introductions while the call is up.
- The first kinds are not the three below. They are: the title is on the line, a rival at the curtain, off the script (the hot mic), after the bell, and trouble on the air (the old headset calls). The botch and the audible are still to do, and so are the `careless` and `ego` traits.
- Limits: three calls on weekly television, four at a big event, each kind once a night, plus the one after the bell. Trouble on the air does not count. A feud's rival comes to the curtain at most every other week; a speaker goes off the script at most once in eight weeks.
- The safe answer is always "do nothing", except for trouble on the air where it is the old safe choice.
- Added in 0.25 (`src/32-direction.js`): the owner on the headset, and who the show is built around. These decide more than the night: the owner's trust, and a face of the company (`S.fc`) that the crowd comes to see.


Today `runShow()` in `src/30-show.js` runs a whole show in one call, and the "headset" (`E.chaos` in `src/77-backstage.js`) asks one question before the show starts, about 13% of the time. Step 2 replaces that.

### The show runs in steps

`runShow` is split into three parts that share one saved object, `S.live`, so a show can stop in the middle and a save made mid-show loads back into it:

```
E.liveBegin(S, card)      // sells the tickets, sets up S.live
E.liveNext(S)             // runs the next promo, angle or match. Returns {seg} or {event} or {done, rep}
E.resolveLiveDecision(S, eventId, choice)   // applies the call, then the stopped match finishes
E.runPlayerShow(S, card)  // kept: begin, then next until done, answering every event with its safe choice (tests, fast mode)
```

Rival shows and the sample shows that set expectations run straight through, with no events.

### The LiveEvent

```
S.live.event = {
  id: 17, kind: "botch",            // botch | hotmic | audible (more kinds later)
  at: 3, phase: "mid",              // match index, and when it fires: before the bell, mid-match, at the finish
  who: 12, other: 45,               // the people it is about
  why: ["Dracula is worn down (41% condition)", "Brutal intensity", "A 20-minute match"],
  text: "Dracula lands on his neck and does not get up. The referee looks at you.",
  choices: [
    { n: "Ring the bell", cost: 0, says: "The match ends now. Dracula is protected. King Arthur loses his win." },
    { n: "Tell them to push through", cost: 0, says: "An attempt: 55% they get there. If not, a real injury.", check: {...} }
  ],
  safe: 0                           // the choice a headless run takes
}
```

### The three first kinds

Numbers are starting points. They get tuned against 60-week runs.

**The botch.** Somebody is hurt mid-match.
- *Ring the bell:* the match is cut to a short finish; its work score drops by 12 to 18 points (worse the earlier it happens). The hurt wrestler takes no further damage and remembers it (+25 with you). The wrestler who was winning loses the finish: -8 with you unless they are friends with the hurt one, and their respect for the hurt one drops 5 ("could not finish").
- *Push through:* an attempt, helped by the opponent's work rate and the pair's bond and respect, hurt by condition and match length. Success: the match keeps its rating and gains a little crowd; the two gain respect for each other (+15 each way) and a kept memory ("worked hurt and got there"). Failure: a real injury of 2 to 8 weeks, the work score drops 20, the hurt wrestler remembers (-25 with you), and everybody who is a friend of theirs (bond 30 or more) remembers too (-8 each).

**The hot mic.** A wrestler goes off script about somebody who is not in the segment.
- *Cut the mic:* the segment is cut short and scores about a star lower. The speaker's morale drops 8 and they remember (-15 with you). The target, if they hear of it, remembers kindly (+8).
- *Let them cook:* the segment gains up to a star and a half, on the speaker's promo skill. The bond between speaker and target drops 40 to 60 and is kept; the target's respect for the speaker drops 20. A feud can start from it at once. The target remembers that you let it air (-20 with you). The target's friends lose a little bond with the speaker.

**The audible.** The crowd is dead for the finish you planned.
- *Stay the course:* the finish runs as booked; the crowd score for the match drops 6.
- *Spend 1 booking power, the heel cheats to win:* the crowd wakes up (+5), the face is protected (keeps their momentum), the feud gains heat. The heel remembers being made to cheat only if they have an ego (see triggers): -10 with you.
- *Spend 2 booking power, call the upset:* the crowd gets what it wants (+8). The loser remembers (-15 with you), and is jealous of the winner (+15).

### The ripple, in order

Every decision runs the same five steps, so new kinds are data, not code:

1. **The match.** A change to this match's work score, crowd score or finish, with a label the report shows.
2. **The bodies.** Condition, a named injury, stress.
3. **The pair.** `relBump` between the people it is about, with a memory.
4. **The room.** Friends and enemies of those people react at a fraction of the size. Friends of the wronged party move against the one who wronged them, and against you if you allowed it.
5. **You and the crowd.** `youRemember` for everyone who has a view, locker room trust, feud heat, momentum.

Each step that changes something visible queues a line for the notification bar.

### What triggers an event

Ryan's question: random from hidden traits, or caused by who is in the ring? **Caused, with traits as a multiplier. Never a flat chance.**

Each match gets a risk for each kind from what is true about it:

- *Botch:* low condition, a worn body part, brutal intensity or a gimmick match, a long match for somebody without the stamina, a big gap in skill, a wrestler with a careless streak.
- *Hot mic:* real heat with somebody on the roster (bond -50 or lower), jealousy of 50 or more, low morale, off-the-cuff delivery, a wrestler with an ego, a memory of something you did to them.
- *Audible:* the crowd energy is low by the time of the match, the feud is stale, a face against a face, the finish is a third dirty finish.

Two people who hate each other in a 30-minute iron man match is the clearest case: their bond feeds the botch risk and the "it turned real" risk directly. The risk is shown before the show in the Running order notes ("Dracula and King Arthur have real heat. Thirty minutes is a long time to trust each other."), so a careful booker can see it coming and a reckless one can court it.

Two new hidden traits come with this step: `careless` (botches) and `ego` (hot mics, takes offence at being made to look weak). They are revealed by what happens, like the others.

At most two events a show, more likely on a big event. A show with nothing risky on it has none.

## Step 3 (built in 0.24): the screen

Built as one screen: what is on the air on the left, tonight's run sheet on the right, the call as a box of wide buttons where the commentary is.

The broadcast page shows the event where the commentary is, with the choices as buttons, what each costs, and the "what helps and what hurts" list for any attempt. After the call: what happened, then the notification bar lines one by one. Works with mouse, touch, keyboard and remote. The old headset window goes.

## Step 4: promos

From Ryan's second note. It builds on the promo kinds and booked segments already in the game.

- **Mic skill:** the game already has it (`mic`, shown as Promo on the roster). No new stat. Promo ability stays mic skill, charisma and gimmick fit.
- **Archetypes against traits.** Five ways to cut a promo, chosen when booking: the shoot, the underdog, the arrogant heel, the fighting champion, the cold threat. Each fits an alignment, some gimmicks and some traits. A fit lifts the segment; a mismatch bombs it.
- **Heat by act.** A feud's acts are gated by heat already (30 and 60). Added: a share of that heat must come from the microphone before the next act opens, shown on the feud card as "needs words".
- **A good promo moves the odds.** A promo of four stars or better on the same show shifts that wrestler's match odds a few points, so the favourite costs less booking power to call.
