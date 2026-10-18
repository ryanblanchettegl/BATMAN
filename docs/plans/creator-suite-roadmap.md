# The creator suite: where it stands and where it goes (18 October)

Ryan, 18 October, at the end of a long session: break down everything built, how viable it is as the killer feature,
and what Create a Wrestler, Create a Scene and the creators still to come (a belt, a logo, props, animations) need,
with the Steam Workshop in mind. Read with `papercraft-engine.md` (the master plan) and `create-a-player.md`.

## What is built

**The diorama engine (the game's graphics).** A 2D paper renderer (`app/src/kit/paper.ts`: hand-cut card with
thickness, light, shadows, depth of field, grain, finishes for foil, neon, corrugated board, denim and leather) and a
3D diorama in three.js (`diorama3d.ts`: an arena with fans and lights, rooms, flat paper figures that face the camera,
on-demand drawing). Paper dolls are cut by `puppet.ts` from a recipe: fourteen joints, ten faces, blood, sweat, tears.

**Create a Scene** (World Editor). Sets (ring from three angles, ramp, desk, hallway, office, locker room, backstage,
plain), poses, faces, marks, props (belt, chair, table, mic, burst, sign, headline, confetti), keyframes, camera, holds
and lifts (one person held by another, each limb in front or behind), hooks (slots filled by the story: hero, villain,
heel group, champion, manager), custom entrances, scene files. Canned scenes: lock-up, strike, slam, sleeper, carry,
near fall, finish, new champion, promo, beat-down, two desk shots, five entrances.

**The broadcast in pictures.** Entrances, the bell, moves, near falls, finishers (a wrestler's own, with its name),
new champions, promos, attacks, and cuts to the commentary desk on lines of colour.

**Create a Wrestler** (Create a Player in a game, Edit wrestler on the roster and in the World Editor). Ryan's
`wrestler.json`, one small file a wrestler: sex, six body types, height, weight, four proportion sliders; sixteen hair
styles, three masks, eleven kinds of facial hair, six eyes, noses, mouths and ears, thirteen face sliders; face paint
and tattoos; three outfits (ring, entrance, street) worn by context, with 11 tops, 7 bottoms, 7 footwear and 12
extras, a colour for each part, 34 paper swatches, lettering in three styles and 14 shapes; Edit attire a part of the
body at a time; finishers and signature moves that play in the match (kick-outs by protection, wear) and on the
broadcast; an entrance; a portrait used across the game on the company's or brand's colour. Wrestlers made in a game
go to free agency. Files write out and open in again.

**The World Editor's Wrestlers page** in the paper look (rule 2a), with the wrestler always on show (rule 5c).

## How viable it is as the killer feature

Strong. Three things make it so, and all three are already true in the code:

1. **Everything is data, not pictures.** A wrestler is a few kilobytes, a scene a few more, and every part is cut by
   code to fit any body. That makes sharing instant, saves tiny, and the Workshop cheap to run.
2. **Everything made plays in the game.** A wrestler someone makes walks out on their entrance, wins with their
   finisher and shows their portrait in lists, with no extra work by anyone. That loop (make, share, see it play) is
   what makes creation suites last (the wrestling games of the early 2000s; the creature and level editors since).
3. **The look is its own.** Construction paper in a 90s Mac reads at any size, forgives simple shapes, and nobody
   else has it.

The risks: the paper look needs the Blender pass (TASKS 0x) to match the mockups; 3D performance on a Steam Deck is
untested; real names and logos must stay out of shared files (rule 3), so the Workshop needs a report button and a
check; and the creators need depth before launch, because players judge a creation suite by how many ways it says yes.

## What Create a Wrestler still needs

- More hair (styles and a second colour), body hair, scars, freckles, more masks and mask designs, face paint layers.
- More gear: jackets with lettering on the back, coats, hats, kick pads and wraps in more cuts, women's gear sets,
  armour and gimmick pieces (capes, crowns, chains), title belts worn on the waist or shoulder.
- A move set: signature moves for each part of a match, taunts, and an entrance built from parts (music cue, pyro,
  lights, walk style).
- Paper portraits for everybody (not only the edited), and a quick random wrestler.
- Parts made in Blender with sockets (the master plan, section 1), then a parts format modders can add to.
- Save and share: a file per wrestler on disk (`/save/wrestlers/`), and the Workshop.

## What Create a Scene still needs (TASKS 0z)

- Fixes Ryan noted: the ring front too long zoomed out, figures that do not read as paper in 3D, and a choice of set
  and setup when starting a scene.
- More sets: a packed stadium, a steel cage, the rafters, a parking lot, a talk show, a news desk.
- Effects: spotlights, smoke and pyro, motion lines, camera flashes, sparks, a spray of liquid.
- Props: ladders, bats, steps, bins, a truck, broken tables; props that can be held and thrown.
- Frames: tall and square pictures for posters, magazine covers and portraits, with captions and mastheads.
- Animation: more keyframes with easing choices, a timeline, sound cues, and reusable moves (a move is a short scene).
- More hooks (the authority figure, the interviewer, the referee as a person) and more canned scenes for them.

## New creators the art style makes possible

Each is a small file, cut by code, played in the game and shared on the Workshop:

- **Create a Belt.** Plates, straps, gems, lettering and a company's logo cut from card and foil; the belt then shows
  on champions in every scene, portrait and title page.
- **Create a Logo.** The logo maker exists (`logomaker.tsx`); move it into the paper look and let logos go on gear,
  rings, banners and portraits.
- **Create an Arena.** The ring's colours and apron, the stage and ramp, banners, the crowd's size and signs.
- **Create a Prop.** Shapes, lettering and finishes assembled into a prop with a hold point, used in scenes.
- **Create a Move.** A short scene with two hooks (who does it, who takes it): the community's move library.
- **Create a Show.** A show's lights, its marquee, its open (a short scene) and its desk team.
- **Create a Poster or Cover.** Scenes framed tall, with type, for big events, the dirt sheet and the Web pages.

## The Steam Workshop

Everything above is one kind of thing: a small JSON file with a type, a version and an author. The Workshop should
carry each type on its own (a wrestler, a scene, an entrance, a move, a belt, a logo, an arena, a prop) and as
packs (a whole world). Needed: upload and subscribe in the desktop build (`desktop/`, written but never run),
a browser in the game for what is subscribed, a check on every file (`E.lookClean` is the pattern), versions so old
files still open, and a way to report a file that breaks rule 3.
