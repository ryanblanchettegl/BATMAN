/* Create a Player (app/src/screens/player, app/src/kit/caw.ts): it opens full screen from a wrestler's page in the
   World Editor with the wrestler drawn in 3D, a body type sets height and weight, each of the three outfits has its
   own gear and colours, lettering and shapes are added, moved and taken off, a finishing move is acted out on the
   dummy, the file saves on the wrestler in the world and writes out as a .wrestler.json, a file that is not a
   wrestler is refused, and the page fits one screen.
   Run: NODE_PATH=<dir containing playwright> node app/tests/player.js   (SHOTS=<dir> keeps pictures) */
const { open, fits, shot, pick, picked } = require('./helper');
const fails = [];
const ok = (label, pass, detail) => { console.log('desk  ', pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
const has = async (page, sel) => !!(await page.$(sel));
const txt = (page, sel) => page.$eval(sel, e => e.textContent).catch(() => '');
const attr = (page, sel, a) => page.$eval(sel, (e, a) => e.getAttribute(a), a).catch(() => null);
const msg = page => txt(page, '[data-t="caw-msg"]');

(async () => {
  const { browser, page, errs } = await open({ promo: null });
  try {
    await page.click('[data-t="scr"][data-v="editor"]'); await page.click('[data-t="ed-new-copy"]'); await page.click('[data-t="ed-tab"][data-v="wrestlers"]');
    await (await page.$$('[data-t="ed-pick"]'))[2].click(); await page.waitForTimeout(200);
    ok('a wrestler\'s page has an Edit wrestler button', await has(page, '[data-t="ed-caw"]'));
    await page.click('[data-t="ed-caw"]'); await page.waitForTimeout(1500);
    ok('Create a Player opens full screen', await has(page, '[data-t="caw"]'));
    ok('the wrestler is drawn in 3D', (await attr(page, '[data-t="caw-view"]', 'data-3d')) === '1');
    ok('the suite fits one screen', !(await fits(page)), await fits(page));
    // the body
    await pick(page, 'caw-sex', 'F');
    ok('the body can be a woman\'s or a man\'s', await picked(page, 'caw-sex', 'F'));
    await pick(page, 'caw-arch', 'Big_Man');
    ok('a body type can be picked, a big man among them', await picked(page, 'caw-arch', 'Big_Man'));
    await pick(page, 'caw-sex', 'M');
    await pick(page, 'caw-arch', 'Super_Heavyweight');
    ok('a body type sets the height and weight', (await txt(page, '[data-t="caw-heightv"]')) === '6\'10"' && (await txt(page, '[data-t="caw-weightv"]')) === '380 lb', (await txt(page, '[data-t="caw-heightv"]')) + ' ' + (await txt(page, '[data-t="caw-weightv"]')));
    await page.click('[data-t="caw-height"][data-v="-"]'); await page.click('[data-t="caw-weight"][data-v="+"]');
    ok('height and weight move one step at a time', (await txt(page, '[data-t="caw-heightv"]')) === '6\'9"' && (await txt(page, '[data-t="caw-weightv"]')) === '390 lb');
    await page.$eval('[data-t="caw-scale"][data-v="muscle_mass"]', e => { e.value = '1.4'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    ok('a slider changes a proportion', /140%/.test(await page.$eval('[data-t="caw-scale"][data-v="muscle_mass"]', e => e.parentElement.textContent)));
    // the head: a hair style, facial hair, face paint and tattoos
    await pick(page, 'caw-tab', 'head');
    await page.selectOption('[data-t="caw-hair"]', 'hair_dreads_01'); await page.selectOption('[data-t="caw-facial"]', 'beard_braided');
    await page.selectOption('[data-t="caw-feat"][data-v="ears"]', 'cauliflower'); await page.selectOption('[data-t="caw-feat"][data-v="nose"]', 'flat');
    const hair0 = await page.$eval('[data-t="caw-hair"]', e => e.value);
    await pick(page, 'caw-tab', 'face');
    await page.$eval('[data-t="caw-fsl"][data-v="jaw"]', e => { e.value = '80'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.$eval('[data-t="caw-fsl"][data-v="eye_size"]', e => { e.value = '-40'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    ok('the face can be shaped with sliders', (await page.$eval('[data-t="caw-fsl"][data-v="jaw"]', e => e.value)) === '80');
    ok('the suite fits with the face sliders', !(await fits(page)), await fits(page));
    await pick(page, 'caw-tab', 'ink');
    await page.selectOption('[data-t="caw-paint"]', 'war'); await page.selectOption('[data-t="caw-paintcol"]', 'swatch_neon_green');
    await page.click('[data-t="caw-paintlyadd"]'); await page.click('[data-t="caw-paintlyadd"]'); await page.selectOption('[data-t="caw-paintly"][data-v="1"]', 'grin'); await page.selectOption('[data-t="caw-paintlycol"][data-v="1"]', 'swatch_white_paper').catch(() => {});
    ok('face paint takes layers over the first design', (await page.$$('[data-t="caw-paintly"]')).length === 2 && (await page.$eval('[data-t="caw-paintly"][data-v="1"]', e => e.value)) === 'grin');
    if (process.env.SHOTS) await shot(page, 'player-paint-layers');
    await page.click('[data-t="caw-paintlydel"][data-v="0"]');
    ok('a layer can be wiped off', (await page.$$('[data-t="caw-paintly"]')).length === 1);
    await page.click('[data-t="caw-tat"][data-v="sleeve_near"]'); await page.click('[data-t="caw-tat"][data-v="chest"]');
    ok('hair, a beard, face paint and tattoos can be picked', hair0 === 'hair_dreads_01' && (await attr(page, '[data-t="caw-tat"][data-v="chest"]', 'aria-pressed')) === 'true');
    await page.click('[data-t="caw-scar"][data-v="cheek"]'); await page.click('[data-t="caw-freckles"]'); await pick(page, 'caw-bodyhair', '2');
    ok('scars, freckles and body hair can be picked', (await attr(page, '[data-t="caw-scar"][data-v="cheek"]', 'aria-pressed')) === 'true' && (await attr(page, '[data-t="caw-freckles"]', 'aria-pressed')) === 'true' && await picked(page, 'caw-bodyhair', '2'));
    ok('the suite still fits with the ink tab full', !(await fits(page)), await fits(page));
    await pick(page, 'caw-tab', 'head');
    await page.selectOption('[data-t="caw-hair"]', 'hair_undercut_01'); await page.selectOption('[data-t="caw-hairmix"]', 'streak'); await page.selectOption('[data-t="caw-haircol2"]', 'swatch_red_paper');
    ok('a new hair style takes a second colour', (await page.$eval('[data-t="caw-haircol2"]', e => e.value)) === 'swatch_red_paper');
    if (process.env.SHOTS) { await page.waitForTimeout(1500); await shot(page, 'player-hair2'); }
    await page.selectOption('[data-t="caw-hair"]', 'mask_hood_01');
    ok('a mask asks for a design instead of a second hair colour', !!(await page.$('[data-t="caw-maskdesign"]')) && !(await page.$('[data-t="caw-hairmix"]')));
    await page.selectOption('[data-t="caw-maskdesign"]', 'teeth');
    if (process.env.SHOTS) { await page.waitForTimeout(1500); await shot(page, 'player-hood'); }
    ok('the suite still fits with the head tab full', !(await fits(page)), await fits(page));
    await page.selectOption('[data-t="caw-hair"]', 'hair_dreads_01');
    // gear for the ring, then the street, each its own
    await pick(page, 'caw-tab', 'gear');
    await page.selectOption('[data-t="caw-part"][data-v="upper_body"]', 'singlet_straps_up');
    await page.click('[data-t="caw-acc"][data-v="elbow_pads"]');
    await page.click('[data-t="caw-acc"][data-v="cape"]'); await page.click('[data-t="caw-acc"][data-v="belt_waist"]'); await page.click('[data-t="caw-acc"][data-v="crown"]');
    ok('a cape, a title belt and a crown can be worn', (await attr(page, '[data-t="caw-acc"][data-v="cape"]', 'aria-pressed')) === 'true' && (await attr(page, '[data-t="caw-acc"][data-v="belt_waist"]', 'aria-pressed')) === 'true');
    ok('the gear tab still fits with every extra listed', !(await fits(page)), await fits(page));
    for (const v of ['cape', 'belt_waist', 'crown']) await page.click('[data-t="caw-acc"][data-v="' + v + '"]');
    await page.selectOption('[data-t="caw-partcol"][data-v="footwear"]', 'swatch_gold_foil');
    ok('a part takes a colour of its own', (await page.$eval('[data-t="caw-partcol"][data-v="footwear"]', e => e.value)) === 'swatch_gold_foil');
    ok('a part and an extra can be picked', (await page.$eval('[data-t="caw-part"][data-v="upper_body"]', e => e.value)) === 'singlet_straps_up' && (await attr(page, '[data-t="caw-acc"][data-v="elbow_pads"]', 'aria-pressed')) === 'true');
    await pick(page, 'caw-attire', 'street_clothes');
    ok('street clothes are an outfit of their own', (await page.$eval('[data-t="caw-part"][data-v="upper_body"]', e => e.value)) === 'shirt_tshirt_base');
    await pick(page, 'caw-attire', 'primary_ring');
    // colours
    await pick(page, 'caw-tab', 'colour');
    await page.selectOption('[data-t="caw-swatch"][data-v="trim"]', 'swatch_gold_foil');
    ok('a palette slot takes a swatch', (await page.$eval('[data-t="caw-swatch"][data-v="trim"]', e => e.value)) === 'swatch_gold_foil');
    // lettering and shapes
    await pick(page, 'caw-tab', 'studio');
    await page.fill('[data-t="caw-text"]', 'ENFORCE'); await page.click('[data-t="caw-addtext"]');
    ok('lettering is added to the outfit', /ENFORCE/.test(await txt(page, '[data-t="caw-layer"][data-v="0"]')));
    await page.click('[data-t="caw-larch"][data-v="+"]'); await page.click('[data-t="caw-lmove"][data-v="u"]');
    await page.selectOption('[data-t="caw-shape"]', 'tactical_vest_straps'); await page.click('[data-t="caw-addshape"]');
    ok('a shape is added beside it', (await page.$$('[data-t="caw-layer"]')).length === 2);
    { const names = async () => page.$$eval('[data-t="caw-layer"]', b => b.map(x => x.textContent)); const n0 = await names();
      await page.click('[data-t="caw-layer"][data-v="0"]'); await page.click('[data-t="caw-lorder"][data-v="f"]'); const n1 = await names();
      ok('Bring forward puts the lettering in front of the shape', n1[1] === n0[0] && n1[0] === n0[1], n0.join('|') + ' -> ' + n1.join('|')); }
    await page.click('[data-t="caw-ldrop"]');
    ok('and taken off again', (await page.$$('[data-t="caw-layer"]')).length === 1);
    if (process.env.SHOTS) { await page.waitForTimeout(2500); await shot(page, 'player-studio'); }
    // the back: lettering across the back, and the doll turned round to show it
    await page.click('[data-t="caw-layer"][data-v="0"]').catch(() => {}); await page.selectOption('[data-t="caw-lon"]', 'back'); await page.waitForTimeout(400);
    ok('lettering can go across the back, and the doll turns round to show it', (await attr(page, '[data-t="caw-back"]', 'aria-pressed')) === 'true');
    if (process.env.SHOTS) { await page.waitForTimeout(1500); await shot(page, 'player-back'); }
    await page.click('[data-t="caw-back"]'); await page.waitForTimeout(300);
    ok('Their front turns the doll back round', (await attr(page, '[data-t="caw-back"]', 'aria-pressed')) === 'false');
    ok('the suite still fits one screen', !(await fits(page)), await fits(page));
    // a finishing move, acted out on the dummy
    await pick(page, 'caw-tab', 'fin'); await pick(page, 'caw-fin', '0');
    await page.fill('[data-t="caw-finname"]', 'State Line Slam');
    await page.selectOption('[data-t="caw-finopt"][data-v="kickout_difficulty"]', 'Instant');
    await page.selectOption('[data-t="caw-finopt"][data-v="preview_pose_id"]', 'slam');
    await page.click('[data-t="caw-act"]'); await page.waitForTimeout(800);
    ok('the move is acted out on the dummy', (await attr(page, '[data-t="caw-view"]', 'data-v')) === 'slam' && /State Line Slam/.test(await txt(page, '[data-t="caw-win"]')));
    await page.selectOption('[data-t="caw-finopt"][data-v="preview_pose_id"]', 'sleeper'); await page.waitForTimeout(400);
    ok('a submission plays as a hold', (await attr(page, '[data-t="caw-view"]', 'data-v')) === 'sleeper');
    await page.click('[data-t="caw-act"]');
    // a signature move for late in the match, and taunts
    ok('every wrestler has one finisher and two signature moves', (await page.$$('[data-t="caw-fin"] option')).length === 3 && !(await page.$('[data-t="caw-addfin"]'))); await pick(page, 'caw-fin', '2'); await page.fill('[data-t="caw-finname"]', 'Back Breaker');
    ok('the second signature comes out late until told otherwise', (await page.$eval('[data-t="caw-finstage"]', e => e.value)) === 'late');
    await page.selectOption('[data-t="caw-finstage"]', 'early');
    ok('a signature move says when in a match it comes out', (await page.$eval('[data-t="caw-finstage"]', e => e.value)) === 'early');
    await page.click('[data-t="caw-taunt"][data-v="taunt_call"]'); await page.waitForTimeout(600);
    ok('a taunt plays on the dummy when picked', (await attr(page, '[data-t="caw-view"]', 'data-v')) === 'taunt_call');
    await page.click('[data-t="caw-taunt"][data-v="taunt_flex"]'); await page.click('[data-t="caw-taunt"][data-v="taunt_crowd"]');
    ok('three taunts at most', await page.$eval('[data-t="caw-taunt"][data-v="taunt_mock"]', e => e.disabled));
    ok('the moves tab fits with its taunts', !(await fits(page)), await fits(page));
    if (process.env.SHOTS) await shot(page, 'player-moves');
    await page.click('[data-t="caw-tauntstop"]');
    // the entrance: one of the game's, or a custom one made in Create a Scene
    await pick(page, 'caw-tab', 'scenes');
    ok('there are canned entrances to pick from', (await page.$$('[data-t="caw-ent"] option')).length >= 6);
    await pick(page, 'caw-ent', 'ent_flex'); await page.waitForTimeout(600);
    ok('a picked entrance plays with them in it', (await attr(page, '[data-t="caw-view"]', 'data-v')) === 'ent_flex' && await picked(page, 'caw-ent', 'ent_flex'));
    await page.selectOption('[data-t="caw-pyro"]', 'fire'); await page.selectOption('[data-t="caw-lights"]', 'red'); await page.fill('[data-t="caw-music"]', 'Iron Rain');
    await page.waitForTimeout(1600); if (process.env.SHOTS) await shot(page, 'player-entfx');
    ok('pyro, lights and their music are picked for the entrance', (await page.$eval('[data-t="caw-pyro"]', e => e.value)) === 'fire' && (await page.$eval('[data-t="caw-music"]', e => e.value)) === 'Iron Rain');
    ok('the entrance tab still fits', !(await fits(page)), await fits(page));
    await page.click('[data-t="caw-newent"]'); await page.waitForSelector('[data-t="scene-stage"]');
    await pick(page, 'scene-tab', 'file');
    ok('Make a custom entrance opens Create a Scene on their entrance', /Napoleon/.test(await page.$eval('[data-t="scene-win"]', e => e.textContent)) && (await page.$eval('[data-t="scene-when"]', e => e.value)) === 'entrance');
    await page.click('[data-t="scene-save"]'); await page.click('[data-t="scene-done"]'); await page.waitForSelector('[data-t="caw"]');
    await pick(page, 'caw-tab', 'scenes');
    { const ev = await page.$eval('[data-t="caw-ent"]', e => e.value + ' of ' + [...e.options].map(o => o.value).join(',')); ok('Done comes back to them with the custom entrance picked', /^scene-/.test(ev), ev); }
    // a custom move: Create a Move opens on their finisher with them in it, and saving makes it the finisher's picture
    await pick(page, 'caw-tab', 'fin'); await pick(page, 'caw-fin', '0'); await page.click('[data-t="caw-newmove"]'); await page.waitForSelector('[data-t="scene-stage"]');
    { const who = await page.$eval('[data-t="scene-who"]', e => e.textContent).catch(() => ''); ok('Make a custom move opens Create a Move with them in it', /Create a Move/.test(await txt(page, '.sc-menubar')) && /Napoleon/.test(who), who); }
    await page.click('[data-t="scene-save"]'); await page.click('[data-t="scene-done"]'); await page.waitForSelector('[data-t="caw"]');
    await pick(page, 'caw-tab', 'fin'); await pick(page, 'caw-fin', '0');
    ok('Done comes back with the custom move as the finisher\'s picture', /^scene-/.test(await page.$eval('[data-t="caw-finopt"][data-v="preview_pose_id"]', e => e.value)));
    // their portrait: bottom right, pressed to change it
    ok('their portrait is in the full-body window, bottom right', !!(await page.$('[data-t="caw-win"] [data-t="caw-portrait"] canvas')));
    await page.click('[data-t="caw-portrait"]');
    await pick(page, 'caw-ptexpr', 'snarl'); await page.selectOption('[data-t="caw-ptframe"]', 'chest');
    ok('pressing it opens the portrait, and it changes', /Their portrait/.test(await txt(page, '[data-t="caw-side"]')) && await picked(page, 'caw-ptexpr', 'snarl'));
    ok('the suite fits with the portrait', !(await fits(page)), await fits(page));
    // the file
    await pick(page, 'caw-tab', 'file');
    await page.fill('[data-t="caw-moniker"]', 'The Enforcer');
    await page.click('[data-t="caw-save"]');
    ok('Save keeps the file on the wrestler in the world', /is kept in/.test(await msg(page)), await msg(page));
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('[data-t="caw-export"]')]);
    ok('Write a file gives a .wrestler.json', /\.wrestler\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    const body = JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8'));
    ok('the file keeps the portrait', body.portrait && body.portrait.expr === 'snarl' && body.portrait.frame === 'chest');
    ok('the file keeps a part\'s own colour', body.attires.primary_ring.part_colours && body.attires.primary_ring.part_colours.footwear === 'swatch_gold_foil');
    ok('the file keeps the head: hair, beard, paint and tattoos', body.attires.primary_ring.equipped_assets.head === 'hair_dreads_01' && body.appearance.facial_hair === 'beard_braided' && body.appearance.shape && body.appearance.shape.jaw === 0.8 && body.appearance.features && body.appearance.features.ears === 'cauliflower' && body.appearance.features.nose === 'flat' && body.appearance.shape.eye_size === -0.4 && body.appearance.face_paint === 'war' && body.appearance.paint_colour === 'swatch_neon_green' && body.appearance.tattoos.join() === 'sleeve_near,chest' && body.appearance.scars.join() === 'cheek' && body.appearance.freckles === true && body.appearance.body_hair === 2 && body.appearance.hair_mix === 'streak' && body.appearance.mask_design === 'teeth');
    ok('the file is the record: body, three outfits, the finisher', body.moniker === 'The Enforcer' && body.physical_attributes.height_inches === 81 && body.physical_attributes.sex === 'M' && Object.keys(body.attires).length === 3 && body.finishing_moves[0].kickout_difficulty === 'Instant' && body.finishing_moves.length === 3 && body.finishing_moves[2].name === 'Back Breaker' && body.finishing_moves[2].stage === 'early' && body.taunts.join() === 'taunt_call,taunt_flex,taunt_crowd' && body.entrance_fx.pyro === 'fire' && body.entrance_fx.music === 'Iron Rain');
    await page.setInputFiles('[data-t="caw-file"]', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') }); await page.waitForTimeout(200);
    ok('a file that is not a wrestler is refused', /not a wrestler/.test(await msg(page)));
    body.name = 'Opened From File'; await page.setInputFiles('[data-t="caw-file"]', { name: 'w.wrestler.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(body)) }); await page.waitForTimeout(200);
    ok('a wrestler file opens', /Opened From File/.test(await msg(page)) && /Opened From File/.test(await txt(page, '[data-t="caw-win"]')));
    if (process.env.SHOTS) await shot(page, 'player-file');
    { await pick(page, 'caw-tab', 'body'); const before = await page.$eval('[data-t="caw-heightv"]', e => e.textContent); let changed = false;
      for (let i = 0; i < 4 && !changed; i++) { await page.click('[data-t="caw-random"]'); changed = (await page.$eval('[data-t="caw-heightv"]', e => e.textContent)) !== before; }
      ok('Surprise me makes a new look at random', changed && /Opened From File/.test(await txt(page, '[data-t="caw-win"]'))); }
    await page.click('[data-t="caw-done"]'); await page.waitForTimeout(300);
    ok('Done goes back to the wrestler, drawn from their own look', /their own look/.test(await txt(page, '[data-t="ed-wdoll"]')));
    // Edit attire: the outfits a part of the body at a time
    await page.click('[data-t="ed-attire"]'); await page.waitForSelector('[data-t="caw"]');
    ok('Edit attire opens on the head', /Edit attire/.test(await txt(page, '.sc-menubar')) && await picked(page, 'caw-tab', 'a_head'));
    for (const t of ['a_upper', 'a_lower', 'a_feet']) await pick(page, 'caw-tab', t);
    await page.selectOption('[data-t="caw-part"][data-v="footwear"]', 'kick_pads');
    await pick(page, 'caw-tab', 'a_upper'); await page.click('[data-t="caw-acc"][data-v="gloves_fingerless"]');
    ok('Edit attire fits one screen', !(await fits(page)), await fits(page));
    await page.click('[data-t="caw-save"]');
    ok('Edit attire saves the outfit', /kept in/.test(await msg(page)), await msg(page));
    await page.click('[data-t="caw-done"]');
    ok('no errors', !errs.length, errs.join(' | '));
  } catch (e) { ok('the run finished', false, e.message); }
  await browser.close();
  console.log(fails.length ? fails.length + ' failed' : 'all player checks passed');
  process.exit(fails.length ? 1 : 0);
})();
