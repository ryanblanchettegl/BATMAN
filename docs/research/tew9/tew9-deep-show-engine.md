# TEW IX deep dive — Volume 1: the show engine

Handbook chapters 9–15. Every figure below is quoted from the in-game handbook (`[hb §]`).

## The week's pipeline

```
give the night off → venue/location → attendance level → region
→ finalise broadcasters → pre-show incidents → booking team meeting (CE)
→ locker room incidents → address the locker room
→ book the card → run segments → ratings → post-show (injury, finance, scrum)
```

Nothing here is optional in the model: each stage can modify the next.

## Attendance

- Base attendance is modified by **regional draws**: `−25%` if the show has few or no
  regional draws, `+50%` if it has them. A regional draw is a worker whose popularity in
  the region is close to or above the company's, and they only need to be **booked**, not
  used. `[hb 9.4]`
- IX deliberately lowered attendances overall; `60,000+` is reserved for legendary events.
  `[hb 9.4]`
- **Importance gates attendance.** A Normal-importance card struggles to exceed a *base*
  of 20,000 even for a hugely popular company; small attendances are unaffected. `[hb 24.12]`
- Running the same region repeatedly inside **28 days** incurs burnout penalties at Medium
  size and above. `[hb 9.4]`
- **Pre-booking gate** (when enabled): attendance is cut if the card lacks enough
  attractive segments, scored by the *Perception* of booked on-screen workers — Major Stars
  weigh heavily, Stars less, Well Known little, and a worker counts once no matter how many
  segments. Events have a higher threshold than TV. TV/weekly need **1 day** of lead time;
  everything else **1 week**. Lesser/Tour/Throwaway/B shows are exempt. `[hb 10.x]`

## Creative Energy

**20 CE per hour** of scheduled show, deducted automatically. Shortfall does not block the
show — it applies a flat **15% penalty** to the final grade instead. Leftover CE is banked
for Creative Ideas. `[hb 9.7, 7.14]`

## Matches

- Length: **1–90 minutes**, inside the match type's own min/max. `[hb 10.8]`
- **Short matches cap the in-ring ceiling** by product. Example product note: matches under
  20 minutes are capped — 19 minutes caps at 90, 14 minutes at 80. `[hb 10.x]`
- **Non-wrestling time** (entrances/exits) is added to the segment's run time; a 25-minute
  match with 5 minutes of entrances occupies 30 minutes of the show. `[hb 14.7]`
- **Length penalties are contextual to the match, not the card position** — a 5-minute main
  event gets exactly the same penalty as any other 5-minute match. `[hb 10.8]`
- **Title matches**: any active title whose type matches the match type; up to **+3%** rating
  for a high-prestige title, whether or not it changes hands. `[hb 10.9]`

## Commentary, referees, road agents

| Role | Rule | Effect |
|---|---|---|
| Commentary (max 3) | no commentary on a **broadcast** show | **−20%** flat |
| Colour score | their Colour, or **70% of Microphone** if higher | — |
| Commentary gap | score **≥20 below** match rating → penalty; **≥20 above** → bonus | per person |
| Play-by-play | **≤15** below rating → penalty; **≥20** above → bonus; **≥80** never penalised | — |
| Road agent | absolute skill, ignores card position | up to **−20%** for abysmal; small bonus if excellent |
| Referee | absolute, `≤40` hurts (scaling), `>75` helps | — |
| Guest commentary | **70% of Microphone**, may exceed their Colour | avoids guest penalty |

`[hb 10.10–10.12, 12.16–12.18, 20.29–20.30]`

## Angles

- Segment length is the **sum of its parts**; short angles are capped: `≤3 min → 75`,
  `≤5 min → 88`. `[hb 15.2]`
- Almost all roles blend **skill : popularity between 40:60 and 60:40**, and the game always
  picks whichever ratio yields the *higher* rating. `[hb 15.7]`
- ~20 participant roles (Attacker, Victim, Being Interviewed, Cutting A Promo, Interviewer,
  Bodyguard, Making The Save, Intimidation, Comic Relief, Character Development, Cameo,
  Non-Speaking, Off Screen, Segment Host, Selling An Injury, Sex Appeal, Subject Of Video,
  Working The Crowd, Dramatic Acting, Fighting…) each with its own Rated-On skill set.

## Segment rating, in full

```
base      = f(popularity in the show's region, performance)
          # matches: in-ring skills; angles: mic / acting / charisma per role
modifiers = road agent, referee, commentary, chemistry, gimmick, crowd state,
            match prestige, intensity/danger, fatigue/stamina, recent matches,
            repetitive booking, psychology flow, experience, star quality, selling
```

Handbook's own words: "potentially over a hundred" inputs. `[hb 11.1]`

Hard parts worth reproducing:

- **Psychology vs length**: a match over an hour requires **85 Psychology**; below that you
  take a "match dragged" penalty. `[hb 12.6]`
- **Stamina** must scale with length; 40 is a minor penalty at 7–10 minutes and severe at
  35–50. `[hb 20.24]`
- **Repetitive booking**: the same match-up **more than 3 times in 6 months** in a region is
  penalised unless it beats previous encounters (1v1, 2v2, 3-way singles, 4-way singles).
  `[hb 36.3]`
- **"Recent matches"** penalties apply for repeating a match on the *same card* or recent
  shows. `[hb 12.6]`

## Show rating

Matches and angles are aggregated separately, then blended **by minutes booked**:

```
show = match_aggregate × match_minute_share + angle_aggregate × angle_minute_share
```

A 60-minute show with 6 minutes of angles is 90%/10%. No angles → 100% matches. `[hb 11.8]`

The aggregates depend on **Match Focus** and **Angle Focus** from the product. `[hb 17.3–17.4]`

**Match Focus**
| Focus | Weights |
|---|---|
| Regular | 70% main event, 20% best other match, 10% undercard average |
| Main Event Spotlight | 90% main event, 10% rest; penalty if the main event is weak |
| Ensemble | 40% main event, 40% best other, 20% rest; bonus for a strong whole |

If there aren't enough matches, the main event's share absorbs the difference.

**Angle Focus**
| Focus | Weights |
|---|---|
| Regular | 70% best angle, 20% second, 10% third |
| Tight Focus | 90% best, 10% second; penalty if the best angle underperforms |

## Popularity growth — the ±6 rule in detail

```
if show_rating >= popularity + 6   → gain (proportional to the gap)
if show_rating <= popularity      → loss (proportional to the gap)
```

`[hb 11.9]`

Exceptions and modifiers:

- **High-population protection**: at **75+ popularity**, a company usually only loses if it
  scores below **75**, not below its actual popularity. Stops giants bleeding for good shows.
  `[hb 11.9]`
- **Lesser / Throwaway / Tour** shows widen the targets both ways — a Throwaway needs far
  more than +6 to gain.
- **Viewers amplify growth**: below **5,000** watchers in a region no bonus; above that a
  rising bonus, maxing at **1,000,000+** watchers. `[hb 11.5]`
- **Worker growth is capped by company size** — a 100-person promotion cannot make a star.
  `[hb 11.5]`
- **Natural growth ceilings** (option, default full): each broadcast region gets a
  popularity ceiling — home areas minimum **55** even below 1,500 viewers, foreign minimum
  **35**; the held-in region is exempt. Weak setting adds **+20** to ceilings; off disables
  the system. `[hb 35.23]`

## Audience state

Three separate decay mechanics, each its own counter:

| Mechanic | Trigger | Effect |
|---|---|---|
| **Crowd burn-out** | too many big spots/segments in a row | rating penalty later on card |
| **Boredom** | a big show in the home area with **no popularity change** → +1 (max 10); any gain → −1 | blocks positive growth, hurts merchandise |
| **Apathy** | long-run staleness | reduces responsiveness |

Boredom detail: regions at **85+** count "not losing" as a gain for the counter. `[hb 11.6]`

## Feedback vocabulary

25 conditions the road agent reports (`[hb 12]`), including: Vocal Crowd · Eating Up ·
Made To Look Strong · Don't Seem To Click · Recent Matches · Holding Back · Phoning It In ·
Type Of Match · Match Finish · Worker Looked Good · Cinematic-Style · Crowd Management ·
Looking Stale · Young Female Demographic · Road Agent Performance · Referee Performance ·
Commentary Performance · Lack Of Selling · Lack Of Psychology · No Investment In Workers ·
Good Work At Ringside · Off Their Game · Shoot Comments · Manager Help In Angle.

Two are **absolute**, not contextual: road agent skill and referee skill. The rest are
relative to the match rating at that point in the calculation. `[hb 12.1, 12.16–12.18]`

## Post-show

Injury review · financial report · popularity recap (only shown if **any** region changed,
including 52.1 → 52.2) · media scrum. `[hb 13]`

## Implementation notes

1. **Ratings are relative to the company's popularity**, never absolute. A 60 is woeful for a
   giant in a 90-population region and excellent for a tiny fed in a 10 region. `[hb 11.1]`
2. **Minutes, not segments**, drive the show blend. A 3-minute angle is 3 minutes of weight.
3. **Cap short matches** or the show blend will overvalue cheap cards.
4. **Repetition and "recent matches" are separate penalties** — both exist.
5. **Growth is a comparison, not accumulation**: `rating − popularity`, gated at ±6.
