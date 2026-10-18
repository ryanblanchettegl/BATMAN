# The papercraft engine: the master plan

Ryan, 18 October. This is the blueprint for the construction paper game, in his words, with notes on how each part
fits the code we have today. Rule 2a in `CLAUDE.md` is the look; `docs/plans/character-creator.md` is the detail
of the wrestlers' faces and parts. Where this plan and an older plan disagree, this one wins.

**The look:** a handmade construction paper diorama, like stop motion. Matte card, edges cut and folded by hand,
a shadow under every piece worked out from its height, and limbs held on by brass split pins. The reference
pictures are in `docs/mockups/paper/` (the desk, the portraits, the bodies, the lock-up and the cover).

## 1. Making the parts in Blender

- Every piece of clothing, hair, beard and extra is made in Blender: few polygons, flat card with a matte paper
  finish.
- Every part has the same attachment points (sockets): `head_socket`, `chest_socket`, `waist_socket`, and one at
  every split pin (shoulders, elbows, wrists, hips, knees, ankles). The game fits a part to any body by its
  sockets: it scales and stretches it to the wrestler's proportions.

**How it fits today's code.** The game draws by code and keeps no image files (rule 2). So a Blender part is
exported as data: each piece's outline, its colour slots, its height in the stack, and its sockets, written to
JSON by a script in `tools/creator/`. The game cuts the piece from that outline at run time and draws its paper
grain, its pale cut edge and its shadow. A part is a few hundred bytes, the world stays one small page, and a
modder can add a part without an image.

## 2. Create a wrestler, and what a wrestler is

A wrestler is a small JSON record:

| Field | What it holds |
|---|---|
| `id` | A unique id |
| `name`, `moniker`, `hometown` | Ring name, nickname, home town (the hometown already counts on the road: `homeKm()`) |
| `physical_attributes` | Height in inches, weight in pounds, body type, and the body's sliders: `torso_width`, `limb_length`, `muscle_mass` (and the rest in `character-creator.md`) |
| `attires` | Outfits: `primary_ring`, `entrance_gear`, `street_clothes`. Each lists the parts worn, their colours, and the text and shapes stamped on them |
| `finishing_moves` | The finisher and signature moves: `impact_damage`, `kickout_difficulty`, `position`, `category`, and the pose the picture shows |

**How it fits today's code.** Today a wrestler lives inside the save (`S.w`, the save key `ewf9000-save-4`) and
inside a world package. The record above becomes part of each wrestler there, so the save stays one piece and old
saves carry over (rule 9: a version bump and a migration). Each wrestler can also be written out as its own
`.json` file and read back in: on the desktop build into a folder of the player's (`/save/wrestlers/`), and that
same file is what goes to the Steam Workshop (section 6). The finisher numbers feed the match engine through the
hooks it already has (`MQX`, `FINX` in `src/10-match.js`), so a big finish is harder to kick out of.

## 3. The gear studio: lettering and shapes

- **Lettering:** a team name or a slogan set in card, with sliders to bend it into an arch or a curve. It takes
  the paper grain and throws its own shadow.
- **Shapes and patterns:** drop shapes, straps and plates onto a piece of gear to build something new (a vest
  with straps, a jacket in layers), with stencil and spray paint effects.

Both are stored as data on the outfit, never as a picture.

## 4. The diorama and match picture studio (built first)

This comes first because everything else draws through it: every match card, poster, rivalry graphic and
celebration in the game is a diorama it renders.

- **The renderer:** places paper pieces in layers, sorts them by height, and draws each with its grain, its cut
  edge and a soft shadow that grows with its height and follows the light. It runs in the game (a canvas), not in
  Blender, so it can draw whoever is on tonight's card.
- **The scene builder:** an in-game sandbox where the player places figures, props (tables, chairs, belts) and
  backdrops on a stage, and sets the camera, the zoom and the light. A scene they make can be saved and used as a
  template (section 5).

## 5. Canned scenes and the match

A canned scene is a `.scene.json` file: the backdrop, the props and where they stand, the slots for the people
(`Slot_A`, `Slot_B`, the referee), the pose in each slot, and the camera.

When the game books a match it:
1. reads the wrestlers' records;
2. picks a scene that fits (a stare-down, a brawl in the corner, a title celebration);
3. puts each wrestler's body, gear, colours and proportions into the slots;
4. draws it, and keeps it with the match in the report and the history.

**How it fits today's code.** The broadcast already marks its big moments (`h` on a beat: a near fall, a finish,
a new champion, set in `callMatch()`), and After the show already lists what the night left. Those are where the
scenes go: a scene on the broadcast at the moment, and the night's best scene on After the show and in History.
The moments are made up and the people in them are made up or parody characters (rule 3), so a title celebration
is "a new champion held up on a shoulder", never a real wrestler's moment by name.

## 6. Steam Workshop and total conversions

A roster, a wrestler, a scene, a pack of match moments or a company's history is a small bundle of JSON. A player
subscribes on the Workshop, and the game downloads it and reads it in at start-up. A world package (`universes/`,
`src/85-history.js`) is already the right shape for a roster and its history; the Workshop is a way to ship it.
The desktop build already has `steamworks.js` as an optional part.

## The order of work (one step at a time, rule 9a)

1. **The paper renderer in the game:** one canvas routine that cuts a piece from an outline and draws its grain,
   cut edge and shadow. Checked against the Blender pictures until the two match.
2. **A wrestler drawn from a recipe** with it: the portrait first (it replaces the pixel faces), then the full
   paper doll.
3. **The scene file and two canned scenes** (the lock-up, the cover) played on the broadcast at the right
   moments.
4. **The record in section 2** in the save and the world packages, with the migration.
5. **Create a wrestler** in the paper look, then the gear studio.
6. **The scene builder** for players.
7. **The parts library** filled out from Blender, with the export script.
8. **Steam Workshop.**

## Questions for Ryan

1. **Real names in scenes:** the blueprint names a real wrestler's celebration as an example. Rule 3 keeps real
   names out of the game, so the scenes copy the kind of moment, never the person. All right?
2. **Where wrestlers are saved:** inside the save and the world packages, with a file per wrestler to export and
   import (and for the Workshop). Or should the game read its wrestlers from the folder of files directly?
3. **The order:** section 4 says the diorama studio comes first. The renderer comes first above; the sandbox scene
   builder is step 6, after the scenes it builds are working in the show. Is that the order you want?
