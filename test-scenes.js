/* Scenes in the engine: hooks, the parts of a scene the game fills from a moment of the show; and Create a Player
   files (a wrestler's look), checked, kept in a world, carried into a game and written out again.  Run: node test-scenes.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [], ok = (c, m) => { if (!c) fails.push(m); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const S = E.newGame('pdw', 3, { name: 'R' }), P = S.promos.pdw, mine = S.w.filter(w => w && w.promo === 'pdw');
const heels = mine.filter(w => w.align === 'H'), faces = mine.filter(w => w.align !== 'H');
const hero = faces[0], vil = heels[0], m1 = heels[1], m2 = heels[2], m3 = heels[3];
// a stable for the villain, led by somebody else, so the leader comes first among the villain's people
S.stables = [{ id: 9001, promo: 'pdw', name: 'The Test', leader: m1.id, m: [m1.id, vil.id, m2.id], formed: 1, tension: 0 }];
[m1, vil, m2].forEach(w => { w.stable = 9001; });
vil.mgr = m3.id;
const before = JSON.stringify(S);
let h = E.sceneHooks(S, { ids: [vil.id, hero.id], a: vil.id, b: hero.id });
ok(JSON.stringify(S) === before, 'sceneHooks changed the game');
ok(h.hero === hero.id, 'the hero is the face in the moment');
ok(h.villain === vil.id, 'the villain is the heel in the moment');
ok(h.attacker === vil.id && h.victim === hero.id, 'the attacker and who gets attacked');
ok(h.heel1 === m1.id && h.heel2 === m2.id, 'the heel group: the leader first, then the rest of the stable (' + h.heel1 + ', ' + h.heel2 + ')');
ok(h.heel3 === m3.id, 'the manager comes after the stable');
ok(h.manager === m3.id, 'the manager');
// order does not decide the hero: the face is the hero whoever is named first
h = E.sceneHooks(S, { ids: [hero.id, vil.id] });
ok(h.hero === hero.id && h.villain === vil.id, 'hero and villain by side, not by order');
// two heroes: the first is the hero, the other plays the villain's part
h = E.sceneHooks(S, { ids: [faces[1].id, faces[2].id] });
ok(h.hero === faces[1].id && h.villain === faces[2].id, 'two of a side still fill hero and villain');
// a title on the line: its holder is the champion and the other the challenger
const t = P.titles.find(x => !x.tag && x.holders.length), ch = S.w[t.holders[0]], other = mine.find(w => w.id !== ch.id && w.g === ch.g);
h = E.sceneHooks(S, { ids: [other.id, ch.id], title: t.name });
ok(h.champ === ch.id && h.challenger === other.id, 'the champion and the challenger of the title on the line');
// winners and losers
h = E.sceneHooks(S, { ids: [hero.id, vil.id], win: [vil.id] });
ok(h.winner === vil.id && h.loser === hero.id, 'the winner and the loser');
// a tag partner is the hero's partner
const tm = S.teams.find(x => x.promo === 'pdw' && x.m.every(id => S.w[id].align !== 'H'));
if (tm) { h = E.sceneHooks(S, { ids: [tm.m[0], vil.id] }); ok(h.ally === tm.m[1], "the hero's tag partner is the ally"); }
// nobody in the moment: nothing is filled, and nothing breaks
h = E.sceneHooks(S, { ids: [] }); ok(h.hero == null && h.villain == null, 'an empty moment fills no parts');
ok(Array.isArray(E.SCENE_HOOKS) && E.SCENE_HOOKS.includes('heel1'), 'the list of hooks');
// Create a Player: Ryan's example file, word for word
const RIP = { id: 'wrestler_uuid_98765', name: 'Rip Jackson', moniker: 'The Enforcer', hometown: 'Minneapolis, MN', archetype: 'Heavyweight',
  physical_attributes: { height_inches: 76, weight_lbs: 275, body_archetype: 'Heavyweight_Powerhouse', proportional_scalers: { torso_width: 1.15, torso_height: 1.05, limb_length: 1.10, muscle_mass: 1.20 } },
  attires: {
    primary_ring: { description: 'In-Ring Gear', equipped_assets: { head: 'hair_buzz_01', upper_body: 'singlet_straps_down', lower_body: 'tights_long_01', footwear: 'boots_laced_heavy', accessories: ['wrist_tape_white'] },
      palette_slots: { primary: 'swatch_black_matte', secondary: 'swatch_crimson_paper', trim: 'swatch_gold_foil' }, custom_layers: [{ type: 'shape_combiner', shape_id: 'tactical_vest_straps', placement: { x: 0, y: -5, z: 2 }, palette_slot: 'swatch_black_matte' }] },
    entrance_gear: { description: 'Ring Walk / Entrance Attire', equipped_assets: { head: 'hair_buzz_01', upper_body: 'jacket_leather_biker', lower_body: 'tights_long_01', footwear: 'boots_laced_heavy', accessories: ['sunglasses_aviator'] },
      palette_slots: { primary: 'swatch_black_matte', secondary: 'swatch_silver_foil', trim: 'swatch_leather_brown' }, custom_layers: [{ type: 'text_decal', string: 'ENFORCE', font: 'stencil_block', placement: { x: 0, y: -2, z: 3 }, palette_slot: 'swatch_white_paper' }] },
    street_clothes: { description: 'Backstage / Promo Attire', equipped_assets: { head: 'hair_buzz_01', upper_body: 'shirt_tshirt_base', lower_body: 'jeans_distressed', footwear: 'sneakers_retro', accessories: [] },
      palette_slots: { primary: 'swatch_blue_denim', secondary: 'swatch_charcoal_paper', trim: 'swatch_white_paper' }, custom_layers: [] } },
  finishing_moves: [{ name: 'State Line Slam', impact_damage: 88, kickout_difficulty: 'Protected', position: 'Standing', category: 'Pinfall Impact', preview_pose_id: 'pose_slam_impact_01' }] };
ok(E.lookOk(RIP), 'the example wrestler file is a look');
const rc = E.lookClean(RIP);
ok(rc.physical_attributes.height_inches === 76 && rc.physical_attributes.proportional_scalers.muscle_mass === 1.2, 'the body is kept');
ok(rc.attires.primary_ring.equipped_assets.upper_body === 'singlet_straps_down' && rc.attires.entrance_gear.custom_layers[0].string === 'ENFORCE' && rc.attires.street_clothes.palette_slots.primary === 'swatch_blue_denim', 'the three outfits are kept, with their lettering and colours');
ok(rc.finishing_moves[0].kickout_difficulty === 'Protected' && rc.finishing_moves[0].preview_pose_id === 'pose_slam_impact_01', 'the finishing move is kept');
ok(JSON.stringify(E.lookClean(rc)) === JSON.stringify(rc), 'cleaning a clean file changes nothing');
ok(E.lookClean({ name: 'X', physical_attributes: { height_inches: 70 }, entrance: 'scene-abc' }).entrance === 'scene-abc' && !E.lookClean({ name: 'X', physical_attributes: { height_inches: 70 }, entrance: 'bad id!' }).entrance, 'their entrance is kept when it is a scene id');
ok(!E.lookOk({ hello: 1 }) && !E.lookOk(null) && !E.lookOk([1, 2]) && !E.lookOk('x'), 'anything else is not a look');
const odd = E.lookClean({ name: '<b>Big</b>' + 'x'.repeat(80), physical_attributes: { height_inches: 400, weight_lbs: -5 }, attires: { primary_ring: { equipped_assets: { upper_body: 'robe; drop', accessories: new Array(30).fill('knee_pads') }, palette_slots: { primary: 'swatch_gold_foil' }, custom_layers: [{ type: 'evil' }, { type: 'text_decal', string: '' }] } } });
ok(odd.name.length <= 32 && odd.name.indexOf('<') < 0, 'a name is trimmed and has no markup');
ok(odd.physical_attributes.height_inches === 96 && odd.physical_attributes.weight_lbs === 100, 'numbers are held in range');
ok(!odd.attires.primary_ring.equipped_assets.upper_body && odd.attires.primary_ring.equipped_assets.accessories.length === 8 && odd.attires.primary_ring.custom_layers.length === 0, 'bad parts and empty lettering are left out');
// kept on a worker in a world, carried into a game, written out again
const pkg = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')), wk = pkg.workers.find(x => (pkg.contracts || []).some(c => c.worker_id === x.id && c.promotion_id === 'pdw'));
ok(E.edSetLook(pkg, wk.id, RIP) && E.edLook(pkg, wk.id).name === 'Rip Jackson', 'a look is kept on a worker in the world');
ok(!E.edSetLook(pkg, wk.id, { nope: 1 }) && E.edLook(pkg, wk.id).name === 'Rip Jackson', 'a bad file does not replace it');
E.useUniverse(pkg);
const G2 = E.newGame('pdw', 5, { name: 'R' }), gw = G2.w.find(x => x && x.name === wk.ring_name);
ok(gw && gw.look && gw.look.finishing_moves[0].name === 'State Line Slam' && E.lookOf(G2, gw.id).name === 'Rip Jackson', 'a new game carries the look onto the wrestler');
const out = E.exportUniverse(G2, {}), ow = out.workers.find(x => x.ring_name === wk.ring_name);
ok(ow && ow.look && ow.look.attires.entrance_gear.equipped_assets.upper_body === 'jacket_leather_biker', 'writing the world out keeps the look');
E.edRemoveLook(pkg, wk.id); ok(!E.edLook(pkg, wk.id), 'and a look can be taken off');
const others = G2.w.filter(x => x && x.look && x.name !== wk.ring_name).length; ok(others === 0, 'nobody else wears a look');
// finishers in the match: people kick out of them, by how protected they are, and it wears them down
{
  const pk = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')), LV = ['Easy', 'Medium', 'Protected', 'Instant'];
  const mineW = pk.workers.filter(x => (pk.contracts || []).some(c => c.worker_id === x.id && c.promotion_id === 'pdw'));
  mineW.forEach((x, i) => E.edSetLook(pk, x.id, { name: x.ring_name, physical_attributes: { height_inches: 74 }, finishing_moves: [{ name: 'Move ' + i, kickout_difficulty: LV[i % 4], impact_damage: 80, position: 'Standing', category: 'Pinfall Impact' }] }));
  E.useUniverse(pk);
  const tally = { Easy: [0, 0], Medium: [0, 0], Protected: [0, 0], Instant: [0, 0] }, kickLines = [], finLines = [];
  for (let seed = 1; seed <= 3; seed++) {
    const S = E.newGame('pdw', seed, { name: 'R' }), lv = {};
    S.w.forEach(w => { if (w && w.look && w.look.finishing_moves) lv[w.name] = w.look.finishing_moves[0].kickout_difficulty; });
    if (seed === 1) ok(S.w.filter(w => w && w.look).every(w => w.fin === w.look.finishing_moves[0].name), 'a file\'s first move is the wrestler\'s finisher');
    for (let wk = 0; wk < 36 && !S.over; wk++) {
      S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
      if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
      while (S.qi < S.queue.length) {
        const card = E.suggest(S); const pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); }
        if (E.validate(S, card).errors.length) { S.qi++; continue; }
        const r = E.runPlayerShow(S, card);
        r.rep.segs.filter(g => g.k === 'match').forEach(g => {
          (g.ids || []).forEach(id => { const w = S.w[id]; if (w && lv[w.name] && g.win) tally[lv[w.name]][0]++; });
          (g.bc || []).forEach(b => { if (/KICKS OUT!/.test(b.x)) { kickLines.push(b.x); const who = Object.keys(lv).find(n => b.x.indexOf('hits') > 0 && b.x.slice(0, b.x.indexOf(' hits')).endsWith(n)); if (who) tally[lv[who]][1]++; } if (/! One, two, three!|that is it!|over the moment/.test(b.x) && /Move \d+/.test(b.x)) finLines.push(b.x); });
        });
      }
      E.endWeek(S);
    }
    if (seed === 3) { const k = S.w.filter(w => w && w.fko > 0); ok(k.every(w => w.fko <= 8), 'wear stays in bounds'); }
  }
  const rate = l => tally[l][1] / Math.max(1, tally[l][0]);
  console.log('  finisher kick-outs by level (kick-outs / matches):', LV.map(l => l + ' ' + tally[l][1] + '/' + tally[l][0]).join(', '));
  ok(tally.Easy[1] > 0 && tally.Medium[1] > 0, 'people kick out of easy and medium finishers');
  ok(rate('Easy') > rate('Medium') && rate('Medium') > rate('Protected') && rate('Protected') >= rate('Instant'), 'the more protected a finisher, the rarer the kick-out');
  ok(kickLines.every(t => /KICKS OUT!$/.test(t)), 'a kick-out is called as one');
  ok(finLines.length > 0, 'a clean win with a finisher is called by its name');
}
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'ok: scene hooks, Create a Player files, and finishers in the match');
process.exit(fails.length ? 1 : 0);
