# Booking demands: every show is a puzzle

Status: **gate 3 of 3** (CLAUDE.md rule 9d). The blueprint is written and Ryan has answered the questions (section 10).
No code until he says go.

Ryan, 23 October: "forced finishes, matches, segments, by all the different relationships in the game would be a good hook
in the game. everytime you go to book a new show, it's like a puzzle you have to manage because of weekly promises from
writers, wrestlers, buisness associates, ect." It builds on his decision of 21 October: picking a winner is free, and
booking power buys the extras.

## 1. What it is

Every week the people around the booker want things from the next show: a win, a match, a segment, a spot on the card, a
star kept off it. Some ask and can be refused; some hold power and impose. Each demand comes from a relationship, so
meeting it or breaking it moves that relationship. The booker still picks every winner for free; the puzzle is that the
demands pull against each other and against the story the booker wants to tell. Booking power is what buys a way out.

## 2. Who makes demands

| Source | What they want | Can you refuse? | What rides on it |
| --- | --- | --- | --- |
| Wrestlers | A win, a title shot, a match with someone, promo time, not to lose clean, a spot in the main event | Yes, when they ask; no, once you have promised | Their morale and memory of you; the locker room hears a broken promise |
| Creative control | Not to lose without agreeing to it | Only by paying (booking power, today 2) | Their trust; a walk-out risk |
| The writers | Their pitch runs as written | Yes; a head writer passed over twice sulks (`src/99-writers.js`) | The writers' room, and the quality of their next pitches |
| The owner | The favourite goes over; a segment for someone he likes | Imposed; refusing costs owner trust or booking power | Owner trust and the year's goals |
| The network | A star in the first hour, a match type that suits its taste, a hook for the ratings | Imposed by the deal; refusing costs network patience | Patience, the renewal, the ratings target |
| Sponsors | Their name on the main event, a clean finish, a family-friendly night | Imposed while the deal runs | The sponsor money and the deal's renewal |
| Business associates | A local star on the card (the building's owner), a guest (a celebrity's agent), a partner company's wrestler in a good spot (a talent exchange) | Mostly yes, at a cost to the deal | The building, the partnership, the press |

## 3. Kinds of demand

- **Finish:** someone wins, does not lose clean, or wins clean.
- **Match:** a pairing, a rule (a cage, a ladder), a title defended.
- **Segment:** a promo, an angle, a pre-tape, a guest's moment.
- **Place:** the main event, the first hour, the opening.
- **Keep off:** someone is not on the show.
- **Time:** a match gets at least so many minutes.

## 4. How a demand moves

1. **Arrives.** On the desk at the start of the week or at your door backstage. A request shows who, what, for which show,
   and what rides on it. An imposed demand arrives already open.
2. **Answered.** A request is accepted (it becomes a promise), refused (remembered), or bargained (an attempt: a later
   show, a smaller ask). Imposed demands skip this.
3. **Open.** It sits on Book the show as a pinned card. The run sheet flags every line that meets it, breaks it, or
   clashes with another demand.
4. **Met, broken or bought out.** At the bell. Bought out means booking power spent so the source accepts it, and it is
   remembered more gently than a plain break. An imposed demand can also be negotiated: an attempt to move it to a later
   show or shrink it, with odds from your standing with the source (Ryan).
5. **Remembered.** Through `relBump()` and `youRemember()` (rule 9b), the notification bar, and After the show.

## 5. Data

`S.dem`, a list, each `{id, src, who, kind, need, show, due, hard, bp, stake, st}`: the source (a person's id, or
`owner`, `network`, `sponsor:<id>`, `assoc:<id>`), what is wanted (`need`: who wins, who meets whom, what segment,
which slot), the show it is for, whether it was imposed (`hard`), the booking power that buys it out, what rides on it,
and its state (asked, open, met, broken, bought, refused, expired). Old saves start with an empty list.

## 6. The puzzle on the screen

- **The desk:** this week's demands under On your desk; requests answered there or at your door.
- **Book the show:** a strip of pinned demand cards above the run sheet. Each line of the sheet shows a pin when it meets
  one and a red mark when it breaks one. Clashes are named in one line ("The owner wants Rex to win; you promised Kai
  the win over Rex").
- **Suggest a card** meets what it can and leaves the hardest choice to the player.
- **After the show:** demands met and broken, and who remembers.

## 7. Balance

- One to three demands a show (Ryan), and at most one real clash a week. The Director (TASKS.md 0ao) decides the mix, so the
  puzzle never becomes a chore.
- A demand's weight follows the source's power and the relationship: a main-eventer asks harder than a rookie.
- Meeting imposed demands pays (sponsor money, network patience, owner trust); meeting requests pays in morale and
  trust; breaking any costs more than meeting it pays, so the booker breaks one only for a story worth it.
- Booking power stays scarce: buying out one imposed demand a week should cost most of a week's power.

## 8. What it hands the next phase (rule 7a)

A broken promise opens a matter for next week. A demand bought out leaves its source owed a favour. A met demand can
raise a bigger one (the owner's favourite won, and now he wants the title).

## 9. What it gathers

Promised wins (`E.cardFlags` "Promised a win"), the owner on the headset (`LIVEK.owner`), the sponsor at ringside,
creative control (`src/97-clauses.js`), the writers' pitches, and the requests at your door (`src/79-people.js`, kinds
starting `ask`). They become one list with one screen.

## 10. Ryan's answers (23 October)

1. How many: **one to three demands a show.**
2. Refusing a wrestler's ask: **yes, up front, and it is remembered.** A refusal costs a little; a broken promise a lot.
3. An imposed demand that clashes: **meet it, break it, buy it out, or negotiate it.**
4. Suggest a card: **meets the easy demands and leaves the clash for the player.**
5. Timing: **mostly known before booking, with a rare late one** on the night (the owner on the headset, a sponsor at
   ringside).
6. Escalation: **sometimes** (about one met demand in four grows into a bigger ask a few weeks later).
7. Rivals: **they face demands too, quietly**; the dirt sheet reports a broken promise, and their unhappy stars become
   easier to sign.
8. Company size: **who asks changes, not how many.** A small indie hears from wrestlers and the building's owner; a big
   company from the network, sponsors and stars with creative control.
9. A new game: **one demand at a time to teach it.** One simple wrestler request at the first show, explained; the first
   imposed demand around the first big event; the full load after the first month.
