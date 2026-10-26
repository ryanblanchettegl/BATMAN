# Progression and gimmicks

Ryan, 20 October: every wrestler has attributes from 1 to 100, levels up, and spends one or two points a level, the way Madden does it. Rich companies buy finished stars; small ones sign raw talent and build it. After every show the player sees who gained experience, who levelled up and who earned a five-star bonus. Older wrestlers decline in the ring but keep their microphone, and hardcore matches build hardcore skill. Every wrestler also has a gimmick that helps in some matches, pairings, feuds and promos.

## What the sports games do

- **Madden franchise mode:** players earn XP from games and from weekly, season and milestone goals. XP buys skill points that raise attributes. A point costs more the higher the overall, the older the player and the lower the development trait. The traits are Normal, Star, Superstar and X-Factor; higher traits are cheaper, roughly 20 to 50 per cent off. Players regress as they age or play badly, and a trait can move up or down after a season. Sources: [Madden School, Madden 24](https://www.madden-school.com/how-progression-xp-and-skill-points-work-in-madden-24-franchise-mode/), [EA help on progression and regression](https://help.ea.com/en/articles/madden-nfl/progression-regression-franchise-mode/).
- **NBA 2K career and league modes:** a player's potential caps how far their attributes can grow. Badges improve by doing the thing in games ("use it to grow it"). Source: [MyNBA guide](https://nba.2k.com/2k27/learn-2k/mynba-legacy/).

## What WrestleCraft takes from them

- **Experience from the night (`src/99-progress.js`):**
  - A match is worth 6 + 5 × stars².
  - The main event is worth more, and so is a big show.
  - A win adds a fifth, and a title win adds 30 more.
  - A five-star match earns 150 extra, a five-star promo 120.
  - Age changes the rate: 1.35 at 23 and under, down to 0.7 at 36 and over.
  - The development trait changes it too: Normal 1, Rising star 1.2, Blue-chip 1.45, Generational 1.75.
- **Levels:** reaching level L+1 takes 300 + 60 × L experience. Each level gives 2 points, every fifth level 3, and Blue-chip and Generational wrestlers earn extra.
- **Spending:** a point raises an attribute by one below 80. It costs 2 above 80 and 3 above 90.
- **Caps:**
  - Ring skills stop at the wrestler's potential, plus a little for their style.
  - Speed, stamina and toughness stop growing once a wrestler is past their peak, and the yearly decline in `src/75-people.js` still takes them down.
  - Nothing new is learned in the ring once a wrestler is in steep decline.
  - Microphone, charisma and star quality have no cap, and a veteran gains a little on the microphone every year.
- **Use it to grow it:**
  - Hardcore, cage, ladder and fire matches teach Hardcore.
  - Submission and iron man matches teach Technical.
  - Ladder matches, and high flyers in any match, teach Agility.
  - Matches of 20 minutes or more teach Stamina.
  - Four-star matches teach Consistency, and main events teach Star quality.
  - Promos teach the Microphone and Charisma.
- **Trait changes:** at the end of each year a big year can raise a trait and a quiet one can lower it.
- **Who spends:**
  - Rival companies spend their points at once, by style and gimmick.
  - The player spends in the Attributes pop-up or presses Let them choose.
  - Points left unspent for eight weeks are spent by the wrestler.
- **Money:** the asking wage counts the overall rating as well as popularity, and a small company cannot sign someone far above its size.

## Gimmicks (`src/99-gimmicks.js`)

- **What each gimmick carries:**
  - the match rules it shines in;
  - the kinds of match it is at home in;
  - the gimmicks it makes hot pairings with, and the ones it falls flat with;
  - its strength on the microphone;
  - whether the crowd buys it in a main event.
- **Effects:**
  - A fitting rule, a hot pairing or a main-event gimmick makes a match louder, and a flat pairing quieter.
  - A hot feud pairing heats 20 per cent faster, and a flat one 20 per cent slower.
  - The microphone strength moves every promo.
  - The gimmick decides which attributes a wrestler grows first.
- **How a gimmick is chosen:** when a game begins, everybody takes the gimmick their character's own words point to, the category first and then the description. If the words point nowhere, they take the one their ratings fit best. A gimmick that comes from the character's own words always counts as a good fit.

## Regression (Ryan, 21 October)

What takes an attribute down, worked out and never drawn at random:

- **Age:** past the peak the body declines every year. In steep decline Consistency and Injury (how safely they work) go too. The microphone never does.
- **Ring rust:** eight weeks without a match costs a point of Stamina or Consistency every four weeks, up to three a spell. Matches give it back.
- **A cold streak:** three poor matches in a row cost a point of Consistency and a quarter of a level's experience.
- **A long injury:** six weeks out or more costs a point of Agility and Stamina on the way back, two after twelve weeks.

Every loss is kept on the wrestler, named on the notification bar for the player's own people, listed after the show, and shown in the Attributes pop-up with the reason.
