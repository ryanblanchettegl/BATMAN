# The character creator in 3D: a concept

Ryan, 17 October: redo Create a wrestler with models made in Blender, with enough choices to make any wrestler
there has ever been, in an art style of the game's own that pops.

This is a concept for Ryan to pick through. Nothing here is built yet. The open questions are at the end.

**Decided, 17 October (Ryan):** construction paper is the style, and it replaces the pixel portraits. The 3D ring
waits until later. The first concept sheet is `docs/mockups/paper/portraits-1.png` (four made-up wrestlers) with
a close-up in `portrait-closeup.png`, rendered in Blender by `tools/creator/paper-concept.py` in about ten seconds.
Sections 1 to 3 below were written before the pick; where they say papier-mache, read construction paper.

### What the concept sheet shows

- A portrait is a stack of shapes cut from coloured card, about twenty pieces: two background cards in the side's
  colours, shoulders, gear, neck, ears, head, a darker piece for the shade down one cheek, eyes (white, iris,
  pupil, and a punched dot of light), brows, nose and nostrils, mouth, beard and moustache, hair, and extras
  (earrings, freckles, face paint, a mask with its trim). The name is on a white strip along the bottom.
- Every edge is cut by hand: short straight snips, each a little off the line. The cut edge shows the paler core
  of the card. Each piece sits a little above the one under it, so light from the upper left leaves a soft shadow
  round it.
- Faces are the side colours of today's portraits: a hero on blue, a villain on maroon, in between on grey (purple
  and other colours for a custom card).

### What this means for how it is built

Construction paper is flat pieces in layers, so a portrait does not need a 3D model in the game at all. Every
piece is a shape worked out from the recipe's numbers (a head outline from its width, jaw and chin, an eye from
its size and tilt), and the game can draw it straight onto a canvas: the piece, its shadow, the pale edge and the
paper grain. That keeps the page small, draws fast on a tablet, and keeps today's rule that a portrait is numbers
in the save and never an image file. Blender stays the place where the look is worked out and where the shapes for
the parts library (hair, beards, masks, paint) are drawn and checked, and it renders the large pictures (match
moments, the box art).

So the order of work in section 6 becomes:

1. The concept sheet (done) and Ryan's notes on it.
2. A paper portrait drawn by the game from a recipe, on the kit sheet, beside the Blender picture of the same
   recipe, until the two match.
3. The recipe: the numbers, and every wrestler in both worlds given one (today's eight numbers carried across).
4. Paper portraits everywhere the pixel faces are now.
5. The creator pop-up, then the parts library filled out (section 2).

## 1. The art style: Ringside Papercraft

Every wrestler is a handmade toy. The body is papier-mache: strips of newsprint pasted over a form, painted, with
the edges of the strips still showing through the paint. Everything stuck on top is cut from construction paper:
hair, beards, eyebrows, masks, face paint, the stripes on the tights, the letters on a jacket. Gear that shines is
foil or glitter card.

It looks like something a fan built in their bedroom in 1994 out of old dirt sheets, and that is the point.

**Why this style:**

- **It pops.** Flat, bright card colours, hard cut edges and a little shadow under every layer read well at the size
  of a list line and on a TV across the room. Nobody else's wrestling game looks like this.
- **It fits the game.** The game is a 1990s desk with a newsletter on it. The newsprint under the paint *is* our
  dirt sheet: the texture is made from the game's own headlines, so a close-up shows a scrap of a real story from
  your save.
- **It forgives.** A toy does not have to be anatomically right. Simple shapes look deliberate, not cheap. That
  matters when one person builds a whole cast.
- **It cannot be mistaken for a photo.** Anybody a player makes is clearly a figure, a likeness and not a person.
  That keeps the parody line clean (rule 3).
- **It is cheap to draw.** Paper is flat colour with a fibre texture and a few steps of light, not shiny skin and
  sweat. A tablet can run it.

**How it is made in Blender:**

| Part | How it looks | How it is built |
|---|---|---|
| Skin and body | Painted papier-mache, the strip edges faintly visible | Smooth low-poly forms. A paint colour over a newsprint texture, with a strip pattern pressed in through a bump map. |
| Hair, beards, brows | Layered cut paper, curled at the tips | Thin sheets with jagged cut edges, stacked two or three deep, each casting a soft shadow on the one under it |
| Masks and face paint | Construction paper cut and glued on, a little proud of the face | Decals on the head, cut out with an outline of white card around them like a sticker |
| Gear | Card for the trunks and boots, felt for the knee pads, foil for anything that shines | Separate pieces worn over the body, swapped as a set |
| Light | Three hard steps of shade and a bright edge where the light catches the card | A shader with stepped lighting and a rim light |

**Two other directions I considered:**

- **Pure construction paper (flat cutouts, a stage diorama in a shoebox):** bolder, but flat figures cannot turn to
  face the camera, so a match moment would always be side-on.
- **Clay (plasticine, thumbprints and all):** warm and funny, but it is close to what other games have done, and it
  has less to do with the 90s desk.

A style test is the first step (section 6): the same head drawn in all three, so you pick by eye.

## 2. Any wrestler ever: the choices

A wrestler is made from **sliders** (shapes that blend smoothly) and **parts** (pieces swapped in from a library).
Every part takes the colours you give it. Every slider has a left and a right, so the range covers anybody, from the
smallest high-flyer to the biggest giant.

### The face

| Group | Sliders | Parts and choices |
|---|---|---|
| Head | Width, length, top of the head, back of the head, neck thickness | Starting shapes: oval, square, long, round, heart, lantern, wedge, block |
| Brow and forehead | Forehead height and slope, brow ridge, brow width | |
| Eyes | Size, spacing, height, tilt, how deep set, lid weight, squint | Eye colour, and an eye that looks a different way |
| Eyebrows | Thickness, arch, angle, gap between them | 20 brow shapes, each brow on its own if wanted |
| Nose | Length, width, bridge height, tip up or down, nostril flare, a bend to one side | Shapes: straight, hooked, broken, flat, button, Roman, boxer's |
| Cheeks and jaw | Cheekbones, cheek fullness, jaw width, jaw angle, jowls | |
| Chin | Length, width, how far it sticks out, a cleft | |
| Mouth | Width, top lip, bottom lip, how high it sits, overbite or underbite | Expressions: plain, sneer, grin, snarl, shout, a tongue out, missing teeth |
| Ears | Size, angle, how far they stick out | Cauliflower ear on either side |
| Age and wear | Wrinkles, sagging, scars (place and size), a broken nose, a forehead scarred from years of blading | |
| Skin | Any tone from a smooth range, undertone, freckles, flush, a tan line | |

### The hair

| Group | Choices |
|---|---|
| Hair styles | About 50 to start: bald, shaved, buzz, receding, crew cut, flat top, spikes, slicked back, side part, pompadour, quiff, mohawk, fauxhawk, mullet, rat tail, curls, afro, high top, cornrows, braids, locs, twists, man bun, top knot, ponytail, pigtails, bob, shoulder length, long and straight, long and wild, half shaved, frosted tips, and more as they are cut |
| Colour | Two colours a style (root and tip, or base and streak), any colour |
| Facial hair | Stubble, goatee, chin strap, full beard in four lengths, braided beard, mutton chops, the classic moustaches (pencil, chevron, handlebar, horseshoe, walrus), soul patch. Each in its own colour, with grey through it |
| Body hair | Chest, arms, back. None, light, heavy |

### Masks, paint and the extras

- **Mask maker.** A mask is built, not picked: full head, open top, half face or eyes only. The eye trim, the mouth
  (open or closed), a crest, side panels, laces at the back, and up to three colours. Patterns are cut-paper shapes
  laid on top: flames, stars, wings, teardrops, teeth, a skull, lightning, initials. Built from shapes, so a player
  can make a mask in the old luchador tradition without the game shipping anybody's real mask.
- **Face paint.** Layers of cut-paper shapes on the face (up to eight), each with a colour, a place, a size, a turn,
  and mirrored or not: stripes, a full skull, half a face, around the eyes, war paint, tears, wings, stars, symbols.
- **Tattoos.** Cut-paper shapes on the face, neck, arms, chest and back, from a small set of shapes and letters. No
  copies of anybody's real tattoos.
- **Extras:** sunglasses (six shapes), a bandana, a headband, a cap, a cowboy hat, earrings, a nose ring, a chain, dog
  tags, a mouthguard, tape on the nose.

### The body

- **Size:** height (from 5 ft 2 to 7 ft 6) and weight. The game already keeps both for every wrestler, so the model
  and the numbers agree.
- **Build sliders:** muscle, fat, shoulder width, chest, belly, arms, legs, waist, the neck that joins head to
  shoulders. Together these cover the lean high-flyer, the bodybuilder, the barrel-chested brawler, the big man with
  a belly and the giant.

### The gear

- **Bottoms:** trunks (short, long or tied), tights, a singlet, trousers, jeans, shorts, kick pads, a gi, a skirt.
- **Tops:** none, a vest, a tank top, a T-shirt, a rash guard, a jacket, a robe, a cape, a duster.
- **Feet and pads:** boots (short, high, laced, with a coloured stripe), wrestling shoes, bare feet, knee pads,
  elbow pads, wrist tape, gloves, arm bands.
- **Colour and pattern:** three colours a piece, and cut-paper patterns (flames, stars, stripes, checks, initials,
  a number) placed by the player.
- **Ring gear and entrance gear** are two outfits, so a robe comes off before the bell.

### Making it quick

Nobody should have to touch eighty sliders to make a wrestler:

- **Start from a type:** the giant, the high-flyer, the bodybuilder, the brawler, the masked luchador, the
  technician, the veteran, the monster, the showman. Each is a full starting point.
- **Mix:** pick two existing wrestlers and blend their faces.
- **Roll the dice:** a fresh random wrestler. Anything locked with the padlock stays as it is.
- **Mirror:** one button that makes the face even, or leaves it uneven on purpose.
- **Undo and redo**, for every change.

### Real wrestlers

A player can make anybody they like, the way players always have in wrestling games. The game ships no real faces,
names, masks or logos, and no presets that copy one (rule 3). A world package holds only numbers, never images, so
what a modder shares is a recipe, not a picture.

## 3. How it works in the game

Blender runs **while the game is being made, not while it is played**. Blender builds the kit and the game puts
wrestlers together from it, live, in three.js (built into the page on 17 October for the arena).

1. **The kit, built in Blender.** One base head and one base body, each with *shape keys* (Blender's name for the
   sliders above), and a library of parts made to fit them: hair, beards, gear, extras. Each is exported as a
   `.glb` file. It is built by a script, `tools/creator/build-kit.py`, run with Blender's Python. I tested that
   Blender 5.2 runs here headless from Python and renders with Cycles, so the kit can be rebuilt in a cloud session
   like this one.
2. **The game puts a wrestler together.** It loads the base, sets each slider, adds the parts, paints the colours,
   and lays the paper decals on. A change in the creator shows at once.
3. **Pictures are made once and kept.** A portrait for the roster or the dossier is drawn into a small image the
   first time it is needed and kept, so a page of forty wrestlers costs nothing after the first look. This is how
   the lights already work.
4. **A wrestler is a recipe.** The save keeps a short list of numbers and part names for each wrestler, about 150
   bytes. That is small enough for every wrestler in a world package. Old saves need nothing: today's eight-number
   pixel face turns into the nearest recipe (the face shape, hair, beard, moustache, eyes, nose, skin and hair
   colour all have a match).
5. **The same figures everywhere.** The creator, portraits, the roster, the dossier, the arena on the broadcast,
   and the match moments all use one model, so a wrestler looks the same on every screen.

**Size:** a guess of 1 to 2 MB for the base models and 5 to 8 MB for a first library of parts. That still fits the
single page, which is 2.9 MB today, under the 16 MB limit of your live artifact page.

## 4. The creator screen

It is one pop-up with three windows, the same layout as the logo creator, so a player learns it once:

- **Left, the groups:** Start, Head, Eyes, Nose, Mouth, Hair, Facial hair, Mask, Paint, Body, Gear, Extras.
- **Middle, the wrestler,** on a turntable lit like the ring. Buttons turn the model and move the camera: Face,
  Head and shoulders, Full body, Entrance. Nothing depends on dragging, so it works with a mouse, touch, keys and a
  pad (rule 5). Bumpers change the group.
- **Right, the choices for the picked group:** parts as a grid of small paper cards, sliders as bars with − and +
  keys, colours as swatches. The Randomize button, the padlocks and Undo sit at the bottom.

The creator opens from the World Editor, from a player starting their own company, and later from hiring a
newcomer.

## 5. What it changes elsewhere

- **Portraits:** the pixel faces could stay as a choice in Options, or go (open question 2).
- **Match moments** (started 17 October, `tools/moments/`): the moments become papercraft too. The two people in
  the ring are the real wrestlers on your card, in their own gear, posed in the moment, rather than anonymous
  figures.
- **The arena** on the broadcast moves to the same style: a cardboard ring, crepe paper ropes, a crowd of
  paper-doll cutouts.

## 6. The order of work (one step at a time, rule 9a)

1. **Style test.** One head rendered in Blender in papercraft, construction paper and clay, front and three
   quarters, with three different faces in each. You pick the style.
2. **The base head** with its first twenty sliders and ten hair styles, exported, and shown turning on the kit sheet
   in the game.
3. **The creator pop-up** for the face, in the World Editor, saving a recipe.
4. **Portraits from recipes** on the roster and in the dossier, with the old faces brought across.
5. **The body and the gear.**
6. **The mask maker, face paint and tattoos.**
7. **The full hair and beard library,** filled out to the counts above.
8. **Match moments and the arena** in the new style.

## 7. Questions for Ryan

1. **The style:** papercraft (my pick), construction paper or clay? Or something else you have in mind? The style
   test in step 1 is the way to decide by eye.
2. **The pixel faces:** do the new 3D portraits replace them, or are both kept as a choice?
3. **The grey windows:** does the 1990s desktop stay round the new models, or should the whole interface move
   toward papercraft too (paper menus, card buttons)?
4. **Bodies on the roster:** is a head and shoulders portrait enough there, with full bodies only in the creator,
   the arena and match moments?
5. **The work in progress:** the 3D arena on the broadcast (branch `claude/arena-3d`) and the match moments script
   are not committed yet. Keep them, finish them in the new style, or put them aside?
