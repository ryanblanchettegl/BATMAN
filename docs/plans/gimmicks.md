# Gimmicks and how they pair (draft for Ryan, 8 October)

A gimmick is the character a wrestler plays on screen. One each. The feud engine reads it to decide which feuds make sense, what the hook is, and which tone fits. Ryan asked for more of them (8 October); today there are 15.

Each line: what the character is, the rating it leans on, which side it usually plays (either side is allowed), and the tones it suits (gritty, dramatic, sporting, over the top).

## The list: 15 we have, 17 new, in nine families

### Power
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Brute | Hits hard, talks little | Ring (brawling) | Either | Gritty |
| Monster | Unstoppable, barely human | Power style, size | Heel | Gritty, dramatic |
| **Giant** (new) | The biggest man in the building, an attraction | Size, presence | Either | Dramatic, over the top |
| **Strongman** (new) | Feats of strength, lifts what nobody else can | Brawling | Face | Sporting, over the top |

### Skill
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Technician | Holds, counters, the purist | Technique | Either | Sporting |
| Workhorse | Shows up, works hard, never complains | Work rate, stamina | Face | Sporting |
| **Submission expert** (new) | Makes people quit; the match is a hunt for the hold | Technique | Either | Gritty, sporting |
| **Martial artist** (new) | Discipline, kicks, honour | Speed, technique | Face | Sporting, dramatic |

### Speed
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Daredevil | Takes risks nobody else will | Speed | Face | Dramatic |
| **Masked flyer** (new) | Masked, fast, a tradition behind the mask | Speed | Face | Sporting, dramatic |

### Talkers
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Cocky | Thinks they are the best, says so | Microphone | Heel | Any |
| Showman | Entrance, flash, the crowd's attention | Microphone, charisma | Either | Over the top |
| **Mastermind** (new) | Plans three moves ahead, talks people into things | Microphone | Heel | Dramatic |
| **Loudmouth** (new) | Never stops talking, often backs it up badly | Microphone | Either | Over the top |

### The elite
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| **Aristocrat** (new) | Money, privilege, looks down on the crowd | Microphone, charisma | Heel | Dramatic, over the top |
| **Company man** (new) | The office's favourite, wears a suit, reports to the boss | Microphone | Heel | Dramatic |

### Heart
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Underdog | Smaller, beaten, never stays down | Selling, speed | Face | Dramatic, sporting |
| Clean-cut hero | Does the right thing, the crowd's champion | Charisma, ring | Face | Sporting, dramatic |
| **Hometown hero** (new) | Carries a city or a country on their back | Charisma | Face | Dramatic |
| **Fighting champion** (new) | Defends against anyone, any night | Ring, stamina | Face | Sporting |

### Outsiders
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Rebel | Answers to nobody, fights the system | Microphone, brawling | Either | Gritty, dramatic |
| Outlaw | Rough, dangerous, lives by their own code | Brawling | Heel | Gritty |
| **Hardcore** (new) | Weapons, blood, any place in the building | Brawling, toughness | Either | Gritty |
| **Hired gun** (new) | Fights for whoever pays; loyal to nobody | Ring | Heel | Gritty, dramatic |

### The strange
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Mystic | Strange powers, rituals, silence | Charisma, Selling | Either | Dramatic |
| **Haunted** (new) | Horror: lights go out, something follows them | Selling, charisma | Either | Dramatic, over the top |
| **Masked man** (new) | Nobody knows who is under the mask | Ring, mystery | Either | Dramatic |

### Old and young
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Old hand | Has seen it all, knows every trick | Ring, experience | Either | Sporting, dramatic |
| **Legend** (new) | A great of the past; every match could be the last | Charisma, history | Face | Dramatic |
| **Rookie** (new) | Green, eager, learning on screen | Selling, speed | Face | Sporting |
| **Prodigy** (new) | Young and already great, and knows it | Ring, charisma | Either | Sporting, dramatic |

### Fun and dirty
| Gimmick | What it is | Leans on | Side | Tones |
|---|---|---|---|---|
| Comedy | Here to make the crowd laugh | Microphone, Selling | Either | Over the top |
| **Coward** (new) | Runs, hides, cheats, wins anyway | Selling, microphone | Heel | Over the top, dramatic |

That is 32. Every new one fits a wrestler from their ratings the way the old ones do (`GIMS` in `src/60-rpg.js`), so the default world can hand them out with no hand work.

## How two gimmicks pair

The engine gives every pair of gimmicks a score and a hook (a sentence that says why the feud makes sense). Three things set it:

1. **Contrast.** Opposites make a feud: big against small, talker against worker, rich against poor, honour against cheating.
2. **Sides.** Most great pairings are a hero against a villain. Two on the same side need a shape that fits it: respect (two equals), proving it, or a break-up.
3. **Tone.** A pairing that only works over the top is a risk in a company whose crowd wants it gritty.

### Classic pairings (the engine reaches for these)

| Pairing | The hook it writes | Best shapes | Tone |
|---|---|---|---|
| Cocky against Underdog | "He says she does not belong. She keeps getting up." | Proving it, the chase | Dramatic |
| Monster against Daredevil | "Nobody has knocked him off his feet. The daredevil will try anything." | The giant-killer | Dramatic |
| Giant against Underdog | David and the giant | Proving it | Dramatic |
| Technician against Brute | "Skill against fists. Only one of them can win the way they want." | Clash of styles | Sporting, gritty |
| Old hand against Prodigy | "The kid says the old man is finished. The old man has one more lesson." | Passing the torch | Dramatic |
| Legend against Prodigy | The last ride | The last ride | Dramatic |
| Company man against Rebel | "The office wants him gone. He will not go quietly." | The rebel and the boss | Gritty, dramatic |
| Aristocrat against Workhorse | Rich against the working man | Proving it, power | Dramatic, over the top |
| Mastermind against Clean-cut hero | "He wants the hero on his side, and he will break him to get it." | Corruption, the friend who turns | Dramatic |
| Showman against Workhorse | Flash against substance | Respect, proving it | Sporting |
| Coward against Fighting champion | "Every week he runs. One night there is nowhere to run." | The chase | Over the top |
| Masked man against anyone | "Who is under the mask?" | Mystery | Dramatic |
| Masked flyer against Masked flyer | Mask against mask, a bet years in the making | The bet | Dramatic |
| Hardcore against Technician | "Take him somewhere he cannot wrestle." | Grudge, ended in a cage or no rules | Gritty |
| Hired gun against anyone | "Somebody paid him. Who?" | Mystery, power | Gritty |
| Haunted against Hero | A horror story; the hero has to face it | Mystery | Dramatic, over the top |
| Hometown hero against Aristocrat | "He sneers at her town, so she brings the town with her." | Proving it | Dramatic |
| Rookie against Old hand (both heroes) | The teacher and the student | Respect, later the friend who turns | Sporting |
| Loudmouth against Monster | "He would not stop talking. Now he has to back it up." | Over the top grudge | Over the top |
| Comedy against Monster | The joke that went too far | Grudge (risky) | Over the top |

### Mirror pairings (same gimmick)

- **Work well:** Cocky against Cocky (an ego war), Old hand against Old hand (who is the greatest), Masked flyer against Masked flyer (the bet), Rebel against Rebel (two people who answer to nobody, and only one can lead).
- **Great matches, little story:** Technician, Workhorse, Martial artist. The engine pitches these only as respect feuds told in the ring, sporting tone.
- **Poor:** Comedy against Comedy (no stakes), Monster against Monster outside a big event, Coward against Coward. The engine avoids them unless the brief asks for over the top.

### Poor pairings (the engine avoids them)

- Two heroes with nothing between them and no hook from history.
- Mystic or Haunted against Comedy, unless the tone is over the top.
- Fighting champion against Coward when the champion is the coward's own manager or friend (no reason).
- Any pairing where both sides need the microphone and neither can talk (the engine says so in the pitch instead of pitching it).

## Where history beats gimmicks

A strong hook from history always outranks the gimmick table. Old partners, a title one cost the other, real heat backstage, a mentor and a student, the same hometown, a grudge brought from another company. The gimmick pairing decides the colour of the feud; history decides whether it matters.
