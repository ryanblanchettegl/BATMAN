# Blueprint: wrestler look, Human Scrapbook + signature style

- Status: gate 1 (blueprint) 2026-10-26; gate 2 (questions) answered by Ryan 2026-10-27, see §11. Gate 3: build **after the TypeScript engine switch** (Ryan); no game code before then. Critic sign-off 9.3 vs the reference (rounds D1 to D3).
- Chosen: Ryan, 2026-10-26, F · Human Scrapbook over C · Human. Critic 9.0 at choice; target 9.8.
- **Final target (Ryan, 2026-10-27, "This is perfect"): his reference image `tools/concepts/current/ryan-ref-paper-doll.jpg`, built as G · Paper doll (`?v=doll`).** It overrides §2 where they differ: thick cream die-cut border round each figure (about 8px at 1080p), felt-grain card on every piece (texture, not shading), soft blurred shadow on a navy board, solid colour gear (no pattern papers; glitter only where a costume calls for it), plain boots with a trim band, glossy rounded pads, brass pins kept at the joints. Signature layer (§3) sits on top of this, with S4 patterns dropped.
- Mockup: `tools/concepts/characters.html?v=scrap` with `&show=figs|sig|heads|women|broadcast|scene|stars|starheads`. Reference roster in `stars`/`starheads` is real wrestlers, concept only: it never enters `BATMAN/` (rule 3).
- Renders into the existing paper doll: `BATMAN/app/src/kit/puppet.ts` (`Recipe`, `recipeOf()`, `puppet()`), Create a Player (`kit/caw.ts`, `look` records).

## 1. The look in one line
Real human proportions (6.8 heads), cut from layered paper. Every wrestler is built from the same pieces; who they are comes from a **signature layer** on top.

## 2. Base rules (every wrestler)
| part | rule |
|---|---|
| proportions | 6.8 heads; head width about 0.75 of height; chin point; neck on everyone |
| face | eyes about 1/5 of face width, iris at least 75% showing, catchlight; brows thin; mouth iris-to-iris; ears small |
| body | shaped limbs: deltoid-biceps, forearm wider at elbow (at least 0.78 of upper arm), wrist taper; thigh bulge at 20%; calf |
| hands | fist with knuckle row and thumb card; open hand for poses that need it |
| paper | each body piece casts a tiny shadow (psh0); the head casts one shadow as a unit (no seams on the face) |
| gear | patterned paper per wrestler (dots, stripes, stars, scales, more), trim strip in the second colour |
| pads | knee pads and elbow pads on everyone (Ryan, 2026-10-26); accent colour; none over long trousers |
| boots | top trim band + laces |
| shading | none on the figure (rule 2a): flat colour, one shadow on the set. Piece shadows are paper lift, not shading (to confirm, Q1.1) |

## 3. The signature layer (what makes someone *them*)
Eight slots. A wrestler fills 2 to 4 of them; nobody fills all eight (keeps it clean at 70px).
| # | slot | options (concept so far) | Recipe field today | new field |
|---|---|---|---|---|
| S1 | silhouette | build preset (giant, power, brawler, tech, flyer, women's, power women's) + belly, hunch | `h`, `w`, `belly`, `tw`, `th`, `ll`, `mm` | none |
| S2 | hair | bald, buzz, crop, peak, mullet, spiky, waves/long, afro, bandana, hat over hair; torn-strip texture | `hair`, `hairCol`, `hairCol2`, `hairMix` | `hat?` |
| S3 | face marks | beard (full, goatee, short stubble, horseshoe), scar, freckles, eyeshadow, lip colour, face paint | `beard`, `scars`, `freckles`, `paint`, `paint2` | `beardKind?` |
| S4 | gear pattern + emblem | pattern paper; emblem or cut letter on the trunks (♛ ★ ☠ ♦ or initial) | `gear`, `gear2`, `kits` | `pat`, `emblem` |
| S5 | tattoos | paper decals in ink-dark card: tribal chevrons, barbed-wire band, colour sleeve, chest patch | `tats: string[]` (where) | `tatStyle` per place |
| S6 | outerwear | entrance coat, cape, jacket, vest (entrance kit only) | `kits.entrance` | coat shape |
| S7 | accessories | tape, pads colour, wristbands, boot decals (stars), mask, belt over shoulder | `tape`, `straps`, `mask`, `belts` | `padCol`, `bootDecal` |
| S8 | signature pose | one pose for entrances, posters and roster cards (double bicep, fists up, one finger up, pointing, V arms, arms wide, guard) | `look.taunts` (scenes) | `sigPose` (joint angles, `JOINTS`) |

## 4. How a wrestler gets a signature
| source | how |
|---|---|
| Create a Player (`look`) | player picks each slot; a Signature tab shows the 70px roster tile live so they see it read |
| world files (parody, public domain) | hand-set per character, like EWE `look` today |
| everyone else (`plainRecipe()`) | picked from the wrestler: style → silhouette and pose pool; gimmick words → tattoo, outerwear, emblem; side → palette; hash of name → which ones. Rule: 2 to 4 slots filled, never two wrestlers on the same roster sharing pattern + emblem + hair |

## 4a. Create a Player: every part morphs to the body (Ryan, 2026-10-27)
"These characters also need to work in Create a Player, so all the different parts have to fit logically or morph onto the body shape."
| rule | how |
|---|---|
| no fixed-size parts | every piece is cut from the body's own numbers: shoulders `sw`, chest `cw`, waist `ww`, hips `hw`, belly `bel`, limb widths `au af th sh`, leg length, height `H`, head unit `hu` |
| anchored to joints | pads sit on the knee/elbow joint and take the limb's width and angle; tape and wristbands on the wrist; boots on the foot; trunks between waist and crotch points |
| clothing follows the outline | trunks, singlet, crop top, halter, coat panels, sash are built from torso points, so a belly or wide hips reshape them |
| decals follow limbs | tattoos are laid in the limb's local frame (along the bone) and scale with its width |
| hair and beards follow the head | built from cranium and jaw widths |
| the border follows scale | die-cut border width scales with the figure (`hu × 0.19`), never a fixed pixel width |
| tested | `characters.html?v=doll&show=cap`: one outfit on nine bodies (slim to super heavy, tall to stocky, two women's builds); port test: 20 random Create a Player sliders per part, no gaps or floating parts |

## 4b. Create a Player is modular (Ryan, 2026-10-27)
"Create a Player is still modular, you pick each piece of gear, tops, bottoms, accessories, hair, etc."
- The player picks **every piece separately**. A gimmick type's signature look (`docs/plans/gimmick-signatures.md`) is never locked:
  - it fills a generated wrestler's pieces;
  - in Create a Player it is an optional "start from a look" preset that the player then changes piece by piece.
- Each slot holds one piece, or none. Every piece morphs to the body (§4a), takes colours and a finish (matte, glitter, foil/metallic, leather/vinyl, denim/fabric), and can carry decal layers (§11, 1.4).

| group | slots |
|---|---|
| body | build sliders (height, shoulders, chest, waist, hips, belly, limb size, leg length), skin |
| head | head shape, eyes, brows, nose, mouth, ears, freckles/scars |
| hair | hair style, hair colour (+ second colour), facial hair |
| face | face paint, mask |
| tops | none, tank, singlet, crop top, halter, T-shirt, sash |
| bottoms | trunks, briefs, tights, shorts, jeans/trousers |
| legs | knee pads, kneebraces, boots, boot decals |
| arms | elbow pads, wrist tape, wristbands, gloves, armbands |
| outerwear (entrance) | jacket, coat, robe, vest, hoodie, cape |
| accessories | hat, sunglasses, headgear, chain, belt (title belts separate) |
| poses | entrance, win, taunt (three) |
| layers | images, shapes, text on any piece or on skin |

- Old SmackDown is the model: each slot is a list of pieces, then colours, then layers.

## 5. Readability targets (tested)
| size | must read |
|---|---|
| 70 to 150px (entrance, crowd, ring wide) | silhouette, gear pattern, hair colour |
| 300px (lineup, ring) | + emblem, tattoos, pads, pose |
| 2x waist-up (backstage, promo) | + faces, eyeshadow, beard detail; joint pins hidden |
| 64px roster tile | simplified face (LOD), hair, gear colour |

## 6. Scenes
- Poses come from `JOINTS` angles; the scene view proved overlap (dive), reaction poses and waist-up crops.
- Signature pose plays on: entrance, roster card, poster templates, a win.
- Far arm in guard poses draws in front; pins hidden above 1.5x.

## 7. Port plan (after approval, on the TS engine)
1. Add new Recipe fields (`pat`, `emblem`, `tatStyle`, `hat`, `beardKind`, `padCol`, `bootDecal`, `sigPose`), all optional; old saves and looks need nothing.
2. `puppet()` pieces: shaped limbs, fist knuckles, pads, boot trim, tattoo decals, coat, head-as-unit shadow.
3. `plainRecipe()` signature picker (§4) + uniqueness check across a roster.
4. Create a Player: Signature tab.
5. Tests: 20 random wrestlers per world render with 2 to 4 slots; no duplicates; 70px tile check; 60 fps check with 30 dolls.

## 8. Cost and performance
- Patterns are SVG/canvas patterns, cached per wrestler. Decals are 3 to 8 small paths. Target: a doll in under 1 ms to cut, 30 on screen at 60 fps.
- A quality setting drops piece shadows first, then decals at small sizes.

## 9. Risks
- Clutter: more than 4 slots reads busy at 70px. Cap enforced in the picker.
- Real likeness: parody world characters must not become near-copies (rule 3). Signature slots must stay generic shapes, never a real logo or tattoo.
- Rule 2a: piece shadows may be read as shading (Q1.1).

## 11. Ryan's answers (gate 2, 2026-10-27). These override anything above.
| # | question | answer |
|---|---|---|
| 1.1 | grain, soft shadow, glossy pads, raised muscle plates vs rule 2a | **Allowed**: paper material, not shading. Rule 2a updated in `BATMAN/CLAUDE.md` |
| 1.2 | proportions | **Push by type**: caricature by build (giants smaller heads, flyers bigger) on top of the doll scale |
| 1.3 | gear finishes in Create a Player | **Glitter, foil/metallic, leather/vinyl, denim/fabric** (all four), on solid colours |
| 1.4 | tattoos | **Layer editor, like the old SmackDown games**: add images, shapes and text, each with transparency, on skin **and on all gear** (trunks, tops, boots, pads, coats, masks). Replaces the fixed tattoo styles (S5) and emblems (S4) |
| 2.1 | signature slots for generated wrestlers | **2 to 4 each** |
| 2.2 | look changes over a career | **On a turn** (palette and poses) and **with age** (greyer hair and beard, heavier build). Not after big moments on its own |
| 3.1 | poses | **Three**: entrance, win, taunt, picked in Create a Player |
| 3.2 | roster card picture | **Signature pose** everywhere (cards, posters) |
| 3.3 | promo camera | **Waist-up at about 2x**, joint pins hidden |
| 4.1 | uniqueness of generated looks | **Whole world**: no two anywhere share hair + gear colours + main signature |
| 4.2 | gimmick → signature table | **Built together** (Ryan and Claude, one session) |
| 5.1 | Create a Player Signature tab with live 70px tile | **Yes**: tile + three poses + the layer editor |
| 5.2 | a switch to turn the signature layer off | **No**: players remove pieces one by one |
| 6.1 | when | **After the TS engine switch** |
| 6.2 | first world | **Parody, EWE first** |
| 6.3 | decal images from | **Local files and Steam Workshop** (files kept in the save/world; Workshop for sharing; still plays offline, rule 2) |

### Changes these answers make to the plan
- §3 S4 and S5 become one **layer editor**: a layer = `{kind: image|shape|text, part, x, y, scale, rot, flip, colour, opacity, z}`, placed in the part's own frame so it morphs with the body (§4a). Images are stored in the world/save as data; Workshop items are layer packs.
- §2 proportions gain a per-type caricature step (`headK`, `bodyK`, `limbK` by style) on top of the doll scale.
- Career: a turn swaps palette + pose set; age shifts hair and beard colour toward grey and adds belly and build over years (no `rnd(S)`: from age only).
- Uniqueness check runs across the whole world at world build and when a wrestler is created.
- Gimmick → signature table: done with Ryan 2026-10-27, `docs/plans/gimmick-signatures.md`. **Gimmicks never set looks** (Ryan): they drive only acting, dialogue and relationships. The 20 looks are standalone presets (Street brawler, Rich kid, ...), used for generated wrestlers and as optional Create a Player starting points.

## 10. Questions for Ryan (gate 2, answered in §11)
### 1. Look
1.1 Piece shadows (each paper piece lifts off the one under it): allowed under rule 2a "no shading", or flatten them?
1.2 Is 6.8 heads right for every style, or should flyers and giants push further (5.8 to 7.5)?
1.3 Should women get their own pattern papers (lace, sequins, snakeskin) or share the men's?
1.4 Are piece-shaped tattoos OK, or must tattoos be readable designs (names, skulls, roses)?
### 2. Signature layer
2.1 How many slots should a generated wrestler fill: always 2 to 4, or by how over they are (main-eventers get more)?
2.2 Should a signature change over a career (new tattoo after a big win, a coat when they turn heel)?
2.3 Should turning heel or face swap the palette and pose automatically?
2.4 Emblems: a fixed list of symbols, or can players draw their own in Create a Player?
### 3. Poses and scenes
3.1 One signature pose each, or a set of three (entrance, win, taunt)?
3.2 Should the signature pose be the roster card picture everywhere, or stand only on entrances and posters?
3.3 Backstage and promos at 2x waist-up: is that the camera you want for promos?
### 4. Generation and uniqueness
4.1 Uniqueness: no two on one roster share pattern + emblem + hair. Across the whole world too?
4.2 Gimmick words driving signature (e.g. "biker" → leather vest, wire tattoo): do you want to write that table, or should I draft it?
### 5. Create a Player
5.1 A Signature tab with the live 70px tile: yes?
5.2 Should players be able to turn the signature layer off for a plain wrestler?
### 6. Rollout
6.1 Build this before or after the TS engine switch (the Clock Wall waits for the switch)?
6.2 Re-dress the parody world's EWE `look`s in this style first, or the public-domain world?
