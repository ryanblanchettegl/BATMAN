# Create a Player

Ryan, 18 October: the technical breakdown of the Create-A-Player suite and how it hands a wrestler to the diorama and
scene engine. This is his blueprint, kept here in plain words, with what is built and what comes next. It belongs to
`papercraft-engine.md` (section 2, "Create a wrestler, and what a wrestler is"; section 3, the gear studio).

Rule 3: the blueprint gave real wrestlers, stables and celebrations as examples of gear and scenes. They are left out
here and from the game. The tools copy the kind of thing (a tactical vest with straps, a spray-painted stencil tee,
a title celebration), never the people.

## The suite

A full-body view of the wrestler on the left, drawn by the diorama engine, and the choices in windows on the right.
It never makes a picture: it builds a paper doll from data, and every part is cut to fit the body it is worn on.

| Module | What it does | Built |
|---|---|---|
| Body | Height in inches and weight in pounds stretch and widen the doll; four sliders for chest and shoulders, length of the body, length of arms and legs, and muscle; four body types (cruiserweight or high flyer, technical, heavyweight, super heavyweight or monster) | Yes |
| Three outfits | Ring gear, entrance gear and street clothes, each with its own parts, colours and lettering. A scene dresses each person for its set: ring gear in the ring, entrance gear on the ramp, street clothes backstage and at the desk | Yes |
| Colours | A palette of paper swatches with a finish each: matte card, foil (it shines), corrugated board (ridges), neon paper (it glows), denim, leather. Each outfit has four slots (main colour, second colour, trim, buckles and metal), and every part takes its colour from a slot, so one change recolours the outfit | Yes |
| A colour for each part | The top, the bottoms and the footwear can each take a swatch of their own over the outfit's palette (`part_colours`) | Yes |
| Gear studio | Lettering cut from card in three styles (block capitals, stencil, tall and narrow), bent into an arch, on the chest or down the leg; shapes (vest straps, a bandolier, stripes, a patch, a disc, a star, a diamond, a triangle, a lightning bolt, flames, a heart, a buckle, spray paint) to layer and pin, moved, sized and turned | Yes |
| Finishers | Up to four moves, each with a name, impact, how hard it is to kick out of (easy, medium, protected, instant), where it comes from (standing, running, the top rope, on the counter) and how it wins (an impact and the pin, or a submission). The wrestler acts it out on a plain card dummy | Yes, in the picture and in the match |
| The head | Sixteen hair styles (bald to an afro, cornrows, dreadlocks, a ponytail, a mullet, long and wild) or one of three masks (mouth open, full, half), hair colour, eleven kinds of facial hair (a chin strap, a braided beard, a handlebar, a horseshoe and the rest), face shape, eyes, nose and skin tone | Yes |
| Eyes, noses, mouths and ears | Six of each to choose from: almond, round, narrow, hooded, deep-set eyes or eyes with lashes; a straight, button, broad, hooked, flat and broken, or long pointed nose; a plain, thin, full, wide, frowning or smiling mouth; round, pointed, cauliflower, small, big or flat ears (`FEATURES`) | Yes |
| Shape the face | Thirteen sliders: head width and height, jaw, chin, eye size, gap and height, brow thickness and angle, nose width and length, mouth width, ears (`FACE_SLIDERS`, kept as `appearance.shape`) | Yes |
| Paint and ink | Face paint (stripes, war paint, the upper half, the whole face, a skull) in any swatch; tattoos (a sleeve on either arm, a shoulder piece, a chest piece, the neck), drawn only where skin shows | Yes |
| More for the head and body | Four more hair styles (a top knot, an undercut, pigtails, a bob), sixteen in all before these; a second hair colour put in as frosted tips, a streak, the front, or underneath and at the back; a hood among the masks, and six designs cut into a mask in its trim colour (flames round the eyes, plain rims, a star on the brow, stripes over the top, split down the middle, a mouth of teeth); scars through the eyebrow, across the cheek, on the lip, over the scalp or across the chest; freckles; body hair on the chest, or chest and belly, as small cut tufts (`HAIR_MIX`, `MASK_DESIGNS`, `SCARS`; kept in `appearance`) | Yes |
| Their portrait | Bottom right of the full-body window, beside the poses (Ryan, 18 October: one window to save space); pressing it opens its settings: the outfit, the face, the pose, the card behind them and the framing (head and shoulders, or to the chest). It is cut from their own doll (`kit/paperportrait.tsx`) and the game shows it wherever it shows a portrait (`Portrait` in `kit/portrait.tsx`) for anybody with a file; everybody else keeps the face drawn from their numbers | Yes |

The parts library today is drawn by code in `app/src/kit/puppet.ts`: tops (bare chest, a singlet with the straps up
or down, a full singlet to the thigh, a crop top, a T-shirt, a tank top, a sports top, an open vest, a biker jacket, an entrance robe, a hooded top, a suit and
tie), bottoms (trunks, long trunks, long tights, fight shorts, a short ring skirt, torn jeans, suit trousers), footwear (boots with knee
pads, kick pads, heavy laced boots, short boots, retro sneakers, dress shoes, bare feet) and extras (wrist tape, wrist wraps, knee pads and sleeves, elbow
pads, fingerless gloves, an arm band, aviator sunglasses, a cowboy hat, a bandana, face paint, a chain). Parts made in
Blender come later and take the same ids (`papercraft-engine.md`, section 1).

## The file: `wrestler.json`

Ryan's record, used as written. One file a wrestler, a few kilobytes, no pictures:

- `id`, `name`, `moniker`, `hometown`, `archetype`
- `physical_attributes`: `height_inches`, `weight_lbs`, `body_archetype`, `proportional_scalers`
  (`torso_width`, `torso_height`, `limb_length`, `muscle_mass`)
- `attires`: `primary_ring`, `entrance_gear`, `street_clothes`, each with `description`, `equipped_assets` (`head`,
  `upper_body`, `lower_body`, `footwear`, `accessories`), `palette_slots` (`primary`, `secondary`, `trim`, and
  `hardware` for buckles and metal) and `custom_layers` (a `text_decal` with `string`, `font`, `placement`
  {x, y, z}, `palette_slot`; or a `shape_combiner` with `shape_id`, `placement`, `palette_slot`)
- `finishing_moves`: `name`, `impact_damage`, `kickout_difficulty`, `position`, `category`, `preview_pose_id`

Added to the record so a file carries the whole person: `appearance` (the face numbers the game already keeps, skin
tone, hair colour, facial hair); on a layer, `on` ("lower_body" for down the leg), `arch`, `scale` and `rot`. A
layer's `palette_slot` may name one of the outfit's slots or a swatch of its own, as in Ryan's example.

Placement is measured from the middle of the chest (or of the thigh), a step being about a twentieth of the chest's
width; `z` orders layers that overlap.

## How it reaches the game

Ryan's handshake, as built:

1. **Context.** The broadcast asks for a moment (`scenePick()` in `app/src/screens/booking/Live.tsx`).
2. **The scene.** A canned or world scene (`.scene.json`) with its set, props, camera and slots.
3. **The wrestler.** `recipeOf(w)` reads `w.look` and builds the doll (`fromLook()` in `app/src/kit/caw.ts`): the
   body scaled from height, weight and the sliders; the outfit the set calls for (`wear()`, `ATTIRE_OF`); every part
   cut to that body; the palette applied; lettering and shapes stuck on.
4. **Slots and pose.** The doll goes into its slot (or the part it plays in the story, a hook) and takes the pose.
5. **Depth and shadow.** The diorama renderer orders the pieces and casts the shadows, in 3D on Steam and on the
   flat paper renderer where 3D cannot run.
6. **The picture.** On the broadcast, in Create a Scene, and anywhere else a scene is drawn. A winner with a finishing
   move ends the match on that move's picture, its name in the burst.

Where it lives: on the worker in a world package (`workers[i].look`, `E.edSetLook`), carried onto the wrestler in a
game (`w.look`, `src/86-looks.js`), written out with the world, and as its own `.wrestler.json` from Write a file.
`E.lookClean()` keeps only what it knows, so a file from anywhere is safe to open. Old saves and worlds need nothing:
a wrestler with no file is drawn as before.

## Next steps (one at a time, each shown to Ryan)

1. **The finisher in the match engine.** *Built 18 October* (`src/86-looks.js`, a `FINX` hook; Ryan: "people can kick
   out of finishers too"). The booker still picks the winner; the finisher changes how the finish plays and lands.
   People kick out of finishers: in a season of tests, an easy one about one match in five, a medium one about one in
   twelve, a protected one about one in seventy-five (and the building comes apart), an instant one about one in three
   hundred. A kick-out needs a big night or a long match, is called on the air ("...KICKS OUT!"), and gives whoever
   kicked out momentum. Every kick-out wears the move down a step (up to eight; kicked out of a little more, landing a
   little lighter), and it comes back a step a month. A clean win with the move pays by how protected it is, how hard
   it hits and where it comes from, and the call says where it came from (the top rope, off the ropes, on the counter);
   a submission ends on a tap-out. The move's name is the wrestler's finisher everywhere the game names it.
   `E.finInfo(S, id)` is the move and how much protection it has left. Picked by a hash of the match, never rnd(S).
2. **Create a Player in a game.** *Built 18 October* (Ryan's calls that day). On the Roster page every wrestler's file
   has **Edit wrestler**: it opens that wrestler's record in the suite (one built from what the game knows if they
   have never been edited), and Save keeps it through `E.setLook` (they remember it). **Create a wrestler** on Free
   agents opens Create a Player on a new wrestler: who they are (name, division, side, style, background, strongest
   suit, gimmick, and what that makes them), then the body, gear and finishers, then Create. A new wrestler always
   goes to **free agency** (`E.createWrestler`) and is signed from Free agents like anybody else; only the World
   Editor puts somebody straight into a company. The old Windows 95 Create a wrestler window is gone.
3. **Entrances and move pictures** (Ryan, 18 October). Every wrestler comes out on an entrance, worn in entrance
   gear: one of the game's five (arms up at the top of the ramp, points out at the crowd, stops and flexes, a slow
   cold walk, taunts the crowd), or a custom one. In the World Editor, Make a custom entrance on the Entrance tab
   saves the wrestler and opens Create a Scene on a copy of their entrance with them in it; saving there picks it for
   them and Done comes back (a custom entrance is a world scene, so others can pick it too). Their other pictures are
   their moves: the first move is the finisher, the rest are signature moves, and each picks the scene it plays as.
   On the broadcast each wrestler comes out on their entrance, a back-and-forth moment led by somebody with signature
   moves plays one of them with its name, and the finisher ends the match. Create a Scene stays in the World Editor.
4. **More parts**, then the parts made in Blender with sockets (`papercraft-engine.md`, section 1).
5. **A file per wrestler on disk** on the desktop build (`/save/wrestlers/`), and the Steam Workshop.
