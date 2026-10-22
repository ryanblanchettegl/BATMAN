/* Create a Scene and the scenes on the broadcast (app/src/screens/scene, app/src/kit/scene.ts).
   The studio: it opens from the World Editor's Scenes tab, a person and a part of the body can be picked with the
   pointer, the pins and the controls, turning and dragging change the pose, keyframes add and play, a scene saves in the world, a
   file that is not a scene is refused, and the page fits one screen. The broadcast: with Scenes on, a match shows
   a scene at the bell, the count at a near fall and the three at the finish; Scenes off takes it away.
   Run: NODE_PATH=<dir containing playwright> node app/tests/scene.js   (SHOTS=<dir> keeps pictures) */
const { open, go, state, fits, shot, pick, openScene } = require('./helper');
const MODES = (process.env.MODES || 'desk').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const has = async (page, sel) => !!(await page.$(sel));
const attr = (page, sel, a) => page.$eval(sel, (e, a) => e.getAttribute(a), a).catch(() => null);

async function studio(mode) {
  const { browser, page, errs } = await open({ mode, promo: null });
  const fig = async () => JSON.parse((await attr(page, '[data-t="scene-fig"]', 'data-v')) || '{}');
  try {
    // Create a Scene is in the World Editor: a copy of a world, its Scenes tab
    await page.click('[data-t="scr"][data-v="editor"]'); await page.click('[data-t="ed-new-world"]'); await page.click('[data-t="ed-new-copy"]');
    await page.click('[data-t="ed-tab"][data-v="scenes"]');
    ok(mode, 'the World Editor has a Scenes tab', await has(page, '[data-t="ed-scene-new"]'));
    ok(mode, 'the Scenes tab has three studios: Animation, Create a Move, Create a Scene', (await page.$$('[data-t="ed-scene-new"]')).length === 3 && /Animation/.test(await page.textContent('.edstudios')) && /Create a Move/.test(await page.textContent('.edstudios')));
    await page.click('[data-t="ed-scene-new"][data-v="move"]'); await page.waitForTimeout(1500); await pick(page, 'scene-tab', 'file');
    ok(mode, 'Create a Move starts from moves, a powerbomb to a moonsault', /Create a Move/.test(await page.textContent('.sc-menubar')) && await page.$eval('[data-t="scene-setup"]', e => ['powerbomb', 'suplex', 'moonsault'].every(v => [...e.options].some(o => o.value === v))));
    await page.selectOption('[data-t="scene-setup"]', 'powerbomb'); await page.waitForTimeout(600);
    ok(mode, 'a powerbomb comes in four keyframes or more', (await page.$$('[data-t="scene-key"]')).length >= 4);
    await page.click('[data-t="scene-done"]'); await page.waitForTimeout(300);
    // an included move can be opened, changed and saved: it is kept as a changed copy for this world
    await openScene(page, 'move_powerbomb'); await page.waitForTimeout(1200);
    ok(mode, 'an included move opens in Create a Move', /Create a Move/.test(await page.textContent('.sc-menubar')) && /powerbomb/i.test(await page.$eval('[data-t="scene-win"]', e => e.textContent)));
    await page.click('[data-t="scene-addkey"]'); await page.click('[data-t="scene-save"]'); await page.waitForTimeout(200); await page.click('[data-t="scene-done"]'); await page.waitForTimeout(300);
    ok(mode, 'saved, it is kept for this world and listed first', /Made for this world/.test(await page.$eval('[data-t="ed-scene-open"][data-id="move_powerbomb"]', e => e.textContent).catch(() => '')));
    await page.click('[data-t="ed-scene-new"][data-v="still"]'); await page.waitForTimeout(1500); await pick(page, 'scene-tab', 'file');
    ok(mode, 'Create a Scene makes stills from templates: a magazine cover, a video game cover, a poster', /Create a Scene/.test(await page.textContent('.sc-menubar')) && await page.$eval('[data-t="scene-setup"]', e => ['mag', 'game', 'poster'].every(v => [...e.options].some(o => o.value === v))) && (await page.$eval('[data-t="scene-kind"]', e => e.value)) === 'still');
    await page.selectOption('[data-t="scene-setup"]', 'mag'); await page.waitForTimeout(600);
    await page.click('[data-t="scene-done"]'); await page.waitForTimeout(300);
    await openScene(page, 'lockup'); await page.waitForTimeout(2500);
    ok(mode, 'Create a Scene opens full screen on the 3D stage', await has(page, '[data-t="scene-stage"]') && !!(await page.evaluate(() => window.EWF_DEBUG.three && window.EWF_DEBUG.three())));
    ok(mode, 'the studio fits one screen', !(await fits(page)), await fits(page));
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-studio');
    // a new scene starts from a setup; ten people at most
    await pick(page, 'scene-tab', 'file');
    ok(mode, 'a new scene offers a setup for every kind of set and the classic moves', (await page.$$('[data-t="scene-setup"] option')).length >= 15);
    await pick(page, 'scene-setup', 'royal'); await page.waitForTimeout(800);
    await pick(page, 'scene-tab', 'people');
    ok(mode, 'the battle royal puts ten wrestlers and the referee in the ring', (await page.$$('[data-t="scene-lpick"]')).length === 11 && await page.$eval('[data-t="scene-addperson"]', e => e.disabled));
    await pick(page, 'scene-tab', 'file'); await pick(page, 'scene-setup', 'talk'); await page.waitForTimeout(300);
    await pick(page, 'scene-tab', 'set');
    ok(mode, 'a talk show setup puts a host and a guest on the talk show set', (await page.$eval('[data-t="scene-set"]', e => e.value).catch(() => '')) === 'talk');
    await page.click('[data-t="scene-done"]'); await page.waitForTimeout(300); await openScene(page, 'lockup'); await page.waitForTimeout(2000);
    // pick a person, then a part by its pin, turn it, and see the angle move
    await page.selectOption('[data-t="scene-who"]', 'A');
    ok(mode, 'the picked person has a pin at every joint', (await page.$$eval('[data-t="scene-pin"]', a => a.length)) === 15, 'pins: ' + (await page.$$eval('[data-t="scene-pin"]', a => a.length)));
    await page.click('[data-t="scene-pin"][data-v="sh_n"]');
    ok(mode, 'pressing a pin picks that part', (await attr(page, '[data-t="scene-stage"]', 'data-sel')) === 'A:sh_n');
    const a0 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    await page.click('[data-t="scene-turn"][data-v="15"]');
    const a1 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    ok(mode, 'turning +15 turns the picked part', a1 === a0 + 15, a0 + ' to ' + a1);
    await page.focus('[data-t="scene-stage"]'); await page.keyboard.press('ArrowLeft');
    const a2 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    ok(mode, 'an arrow key on the stage turns the picked part', a2 === a1 + 5, a1 + ' to ' + a2);
    // the pointer in 3D: press somebody to pick them, drag them across the floor
    const ca = await page.evaluate(() => window.EWF_DEBUG.three().where('B', 'chest'));
    if (ca) { await page.mouse.click(ca[0], ca[1]); await page.waitForTimeout(300); }
    ok(mode, 'pressing a person in 3D picks them', /^B:/.test((await attr(page, '[data-t="scene-stage"]', 'data-sel')) || ''), await attr(page, '[data-t="scene-stage"]', 'data-sel'));
    await page.click('[data-t="scene-pin"][data-v="body"]');
    const f0 = await fig(), wb = await page.evaluate(() => window.EWF_DEBUG.three().where('B', 'waist'));
    if (wb) { await page.mouse.move(wb[0], wb[1]); await page.mouse.down(); await page.mouse.move(wb[0] - 120, wb[1] + 30, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300); }
    const f1 = await fig();
    ok(mode, 'dragging somebody walks them across the floor', Math.abs(f1.x - f0.x) > 0.5 && f1.y === f0.y, JSON.stringify([f0.x, f0.z, f1.x, f1.z]));
    await page.selectOption('[data-t="scene-spot"]', 'tb_nr'); const f2 = await fig();
    ok(mode, 'they can be put on the top turnbuckle', f2.lv === 4.9 && f2.x === 9.5, JSON.stringify(f2));
    await page.click('[data-t="scene-pin"][data-v="sh_n"]');
    const s0 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    const hd = await page.evaluate(() => window.EWF_DEBUG.three().where('B', 'hand_n'));
    if (hd) { await page.mouse.move(hd[0], hd[1]); await page.mouse.down(); await page.mouse.move(hd[0] + 10, hd[1] - 110, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300); }
    ok(mode, 'dragging a part in 3D turns it round its pin', +(await page.$eval('[data-t="scene-angle"]', e => e.textContent)) !== s0);
    // a pose, a size, a face and marks, a hidden part
    await page.selectOption('[data-t="scene-poselib"]', 'kneel');
    await page.click('[data-t="scene-size"][data-v="+"]');
    ok(mode, 'the size goes up', (await page.$eval('[data-t="scene-sizev"]', e => e.textContent)) === '105%');
    await pick(page, 'scene-expr', 'snarl'); await pick(page, 'scene-blood', '3'); await page.click('[data-t="scene-mark"][data-v="tears"]');
    await page.click('[data-t="scene-hide"][data-v="wr_f"]'); await page.click('[data-t="scene-hide"][data-v="head"]');
    const fg = await fig();
    ok(mode, 'a pose from the library is applied', fg.y === -1.33 && fg.p && fg.p.kn_n === -90, JSON.stringify(fg.p));
    ok(mode, 'a face and marks are kept on the keyframe', fg.e === 'snarl' && fg.m && fg.m.blood === 3 && fg.m.tears === true);
    ok(mode, 'parts of the body can be hidden', JSON.stringify(fg.hide) === '["wr_f","head"]', JSON.stringify(fg.hide));
    await page.click('[data-t="scene-unhide"]'); ok(mode, 'and shown again', !(await fig()).hide);
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-marks');
    // the camera: a shot kept on the keyframe, a lens, a picture; keyframes glide or cut
    await page.selectOption('[data-t="scene-shot"]', 'low'); await page.waitForTimeout(300);
    ok(mode, 'a shot is kept on the keyframe', /own shot/.test(await page.$eval('[data-t="scene-shotname"]', e => e.textContent)));
    await page.selectOption('[data-t="scene-lens"]', '18');
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('[data-t="scene-snap"]')]);
    ok(mode, 'Picture saves a picture', /\.png$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    const k0 = await page.$$eval('[data-t="scene-key"]', a => a.length);
    await page.click('[data-t="scene-addkey"]');
    ok(mode, '+ Keyframe adds a keyframe', (await page.$$eval('[data-t="scene-key"]', a => a.length)) === k0 + 1);
    await page.click('[data-t="scene-camreset"]'); await page.selectOption('[data-t="scene-cammove"]', 'home');
    ok(mode, 'a keyframe can go back to the set camera', /set camera/.test(await page.$eval('[data-t="scene-shotname"]', e => e.textContent)));
    // a caption on the keyframe, on the picture
    await pick(page, 'scene-tab', 'cap'); await page.fill('[data-t="scene-cap"]', 'He is not done yet'); await page.selectOption('[data-t="scene-capstyle"]', 'title'); await page.waitForTimeout(200);
    ok(mode, 'a caption lies on the picture', /not done yet/.test(await page.$eval('[data-t="scene-caption"]', e => e.textContent).catch(() => '')));
    await page.click('[data-t="scene-play"]'); await page.waitForTimeout(300);
    ok(mode, 'Play plays the scene', /Stop/.test(await page.$eval('[data-t="scene-play"]', e => e.textContent)));
    await page.waitForTimeout(3600);
    await page.click('[data-t="scene-key"][data-v="1"]'); await page.selectOption('[data-t="scene-ease"]', 'cut');
    ok(mode, 'a keyframe can be reached in a cut', (await page.$eval('[data-t="scene-ease"]', e => e.value)) === 'cut');
    await page.click('[data-t="scene-key"][data-v="0"]');
    // a headline, then the people list: hide and lock
    await pick(page, 'scene-tab', 'people');
    await page.selectOption('[data-t="scene-propkind"]', 'headline'); await page.fill('[data-t="scene-newwords"]', 'BREAKING NEWS'); await page.click('[data-t="scene-addprop"]');
    ok(mode, 'a headline is added and picked', /:prop$/.test((await attr(page, '[data-t="scene-stage"]', 'data-sel')) || ''));
    await pick(page, 'scene-tab', 'people');
    await page.click('[data-t="scene-lhide"][data-v="A"]'); await page.click('[data-t="scene-llock"][data-v="B"]'); await page.waitForTimeout(150);
    ok(mode, 'a hidden or locked person cannot be picked', (await attr(page, '[data-t="scene-lpick"][data-v="A"]', 'disabled')) != null && (await attr(page, '[data-t="scene-lpick"][data-v="B"]', 'disabled')) != null);
    await page.click('[data-t="scene-lhide"][data-v="A"]'); await page.click('[data-t="scene-llock"][data-v="B"]');
    const p0 = (await page.$$('[data-t="scene-lpick"]')).length; await page.click('[data-t="scene-addperson"]'); await pick(page, 'scene-tab', 'people');
    ok(mode, 'Add a person brings somebody in', (await page.$$('[data-t="scene-lpick"]')).length === p0 + 1);
    ok(mode, 'the studio fits with the people open', !(await fits(page)), await fits(page));
    // the Set tab: a wall of your own behind the scene, every set, the look, the shape
    await pick(page, 'scene-tab', 'set'); await page.click('[data-t="scene-bgnew"]'); await page.waitForTimeout(150);
    await page.selectOption('[data-t="scene-bgwall"]', '#5c2430');
    await page.fill('[data-t="scene-bgwords"]', 'FIGHT NIGHT'); await page.click('[data-t="scene-bgadd"]');
    await page.selectOption('[data-t="scene-bgkind"]', 'skyline'); await page.click('[data-t="scene-bgadd"]');
    await pick(page, 'scene-bgpart', '0'); await page.click('[data-t="scene-bgmove"][data-v="u"]'); await page.waitForTimeout(250);
    ok(mode, 'a backdrop takes a banner and a skyline', (await page.$$('[data-t="scene-bgpart"] option:not([value="-1"])')).length === 2);
    await page.click('[data-t="scene-bgsave"]'); await page.waitForTimeout(100);
    ok(mode, 'Keep the backdrop keeps it in the world', /kept in/.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)));
    ok(mode, 'the set list offers the backdrop', (await page.$$eval('[data-t="scene-set"] option', o => o.filter(x => x.value.indexOf('bg_') === 0).length)) >= 1);
    const sets = await page.$$eval('[data-t="scene-set"] option', o => o.map(x => x.value).filter(v => v.indexOf('bg_') < 0));
    for (const st of sets) { await page.selectOption('[data-t="scene-set"]', st); await page.waitForTimeout(150); }
    ok(mode, 'every set draws (' + sets.length + ')', sets.length >= 9 && !errs.length, sets.join(','));
    await page.selectOption('[data-t="scene-set"]', 'ring');
    ok(mode, 'a scene has no filters until it asks', !(await has(page, '[data-t="scene-fx"][aria-pressed="true"]')) && !(await has(page, '.sc-stage .scfx')));
    await page.click('[data-t="scene-fx"][data-v="scan"]'); await page.click('[data-t="scene-fx"][data-v="mono"]'); await page.waitForTimeout(150);
    ok(mode, 'scan lines and black and white lay over the stage', await has(page, '.sc-stage.fx-scan.fx-mono .scfx'));
    await page.click('[data-t="scene-fx"][data-v="mono"]'); await page.click('[data-t="scene-fx"][data-v="scan"]');
    await page.selectOption('[data-t="scene-frame"]', 'tall'); await page.waitForTimeout(400);
    { const bb = await (await page.$('[data-t="scene-stage"]')).boundingBox(); ok(mode, 'a tall picture is taller than it is wide', bb && bb.height > bb.width * 1.2, bb && (bb.width + 'x' + bb.height)); }
    await page.selectOption('[data-t="scene-frame"]', 'wide'); await page.waitForTimeout(300);
    // rule 9c: every promo and angle a player can book has its scene
    { const miss = await page.evaluate(() => { const w = window.EWF_DEBUG.segScenes(); return window.GP.BEATS.filter(b => w.indexOf('beat_' + b) < 0 && w.indexOf('seg_' + b) < 0); });
      ok(mode, 'every beat of a storyline has its scene', !miss.length, miss.join(', ')); }
    { const miss = await page.evaluate(() => { const w = window.EWF_DEBUG.segScenes(), K = window.GP.SEGK; return Object.keys(K).filter(k => k !== 'writers' && w.indexOf('seg_' + k) < 0); });
      ok(mode, 'every kind of promo and angle has its scene', !miss.length, miss.join(',')); }
    // the Scene tab: name, when, save, a bad file
    await pick(page, 'scene-tab', 'file');
    await page.fill('[data-t="scene-name"]', 'Test scene'); await page.selectOption('[data-t="scene-when"]', 'news');
    await page.click('[data-t="scene-save"]');
    ok(mode, 'Save keeps the scene in the world', /kept in/.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)), await page.$eval('[data-t="scene-msg"]', e => e.textContent));
    await page.setInputFiles('[data-t="scene-file"]', { name: 'x.scene.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await page.waitForTimeout(200);
    ok(mode, 'a file that is not a scene is refused', /not a scene/.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)));
    // the commentary desk: an open chair; bring a guest in and send them away
    await page.selectOption('[data-t="scene-open"]', 'desk1'); await page.waitForTimeout(400);
    await pick(page, 'scene-tab', 'people');
    ok(mode, 'the desk has an open chair to bring a guest into', await has(page, '[data-t="scene-bringin"][data-v="C3"]'));
    await page.click('[data-t="scene-bringin"][data-v="C3"]'); await pick(page, 'scene-tab', 'people');
    ok(mode, 'a guest is brought in to the third chair', await has(page, '[data-t="scene-sendaway"][data-v="C3"]'));
    await page.click('[data-t="scene-sendaway"][data-v="C3"]');
    ok(mode, 'and sent away again', await has(page, '[data-t="scene-bringin"][data-v="C3"]'));
    // holding: the slam lifts B in A's hands; put B down and pick B up again, and bring an arm in front
    await pick(page, 'scene-tab', 'file');
    await page.selectOption('[data-t="scene-open"]', 'slam'); await page.waitForTimeout(400);
    await pick(page, 'scene-tab', 'sel');   // the keyframe where A has B up (a flourish may come before it)
    for (let i = 0, n = (await page.$$('[data-t="scene-key"]')).length; i < n; i++) { await page.click('[data-t="scene-key"][data-v="' + i + '"]'); await page.selectOption('[data-t="scene-who"]', 'B'); if ((await page.$eval('[data-t="scene-heldby"]', e => e.value)) === 'A:hands') break; }
    ok(mode, 'in the slam B is held in A\'s hands', (await page.$eval('[data-t="scene-heldby"]', e => e.value)) === 'A:hands');
    const held = await fig();
    await page.selectOption('[data-t="scene-heldby"]', '');
    const down = await fig();
    ok(mode, 'put down, B stays where they were, on their own', !down.on && down.y > held.y + 2, JSON.stringify({ was: held.y, now: down.y }));
    await page.selectOption('[data-t="scene-heldby"]', 'A:shoulders');
    ok(mode, 'and can be picked up again, by the shoulders', (await fig()).on === 'A:shoulders');
    await page.selectOption('[data-t="scene-who"]', 'A'); await page.click('[data-t="scene-pin"][data-v="el_n"]');
    await pick(page, 'scene-limb', '3');
    const arm = await fig(); ok(mode, 'an arm can be brought in front of everyone', arm.lz && arm.lz.arm_n === 3, JSON.stringify(arm.lz));
    await pick(page, 'scene-tab', 'people');
    await page.selectOption('[data-t="scene-hook"][data-v="B"]', 'villain');
    ok(mode, 'a slot can be given a part in the story', /The villain/.test(await page.$eval('[data-t="scene-side"]', e => e.textContent)));
    ok(mode, 'the studio fits one screen with the holds and the parts', !(await fits(page)), await fits(page));
    await page.click('[data-t="scene-done"]');
    ok(mode, 'Done comes back to the Scenes tab, with the scene in the world', /Test scene/.test(await page.$eval('.edpage', e => e.textContent)));
    ok(mode, 'no errors in the studio', !errs.length, errs.join(' | '));
  } catch (e) { ok(mode, 'the studio run finished', false, e.message); }
  await browser.close();
}

async function broadcast(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', pics: true });
  try {
    await go(page, 'booking'); await page.click('[data-t="suggest"]');
    // book a face-off, so a booked segment's own scene can be seen on the air
    const bookedSeg = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP; const ch = E.segChoices(S, 'faceoff', [], -1); const a = ch[0] && ch[0][0]; if (a == null) return 'no choices';
      const ch2 = E.segChoices(S, 'faceoff', [a], -1); const b = ch2[1] && ch2[1].find(x => x !== a); if (b == null) return 'no second'; const r = E.setSeg(S, -1, { k: 'faceoff', who: [a, b], pos: 1, len: 'S' }); window.EWF_DEBUG.render(); return r.ok ? '' : r.msg; });
    if (bookedSeg) console.log(mode.padEnd(6), 'note', 'could not book a face-off: ' + bookedSeg);
    // a steel cell match: it is played inside the cell
    const cellAt = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP, i = S.card.findIndex((m, j) => m && m.mt === '1v1'); if (i < 0) return -1; S.card[i].stip = 'cell'; E.fitShow(S, S.card); return i; });
    // a newcomer on the card who debuts with a surprise attack: their entrance is the debut's own scene
    const debId = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), m = S.card[0], seen = new Set([].concat(...(S.segs || []).map(g => g.who || []))), id = m && [].concat(...m.sides).find(x => !seen.has(x)); if (id == null) return -1; S.w[id].deb = true; S.w[id].dk = 'atk'; return id; });   // somebody not already in a booked segment before their debut
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
    ok(mode, 'the show goes on the air', await has(page, '#live'));
    const seen = new Set(), sets = new Set(); let shots = 0, fitBad = null;
    for (let g = 0; g < 600; g++) {
      if (await has(page, '[data-t="live-call"]')) {
        ok(mode, 'a call takes the scene away', !(await has(page, '[data-t="live-scene"]')));
        await page.waitForTimeout(430); const safe = await state(page, S => (S.live.ev && S.live.ev.safe) || 0);
        await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); continue;
      }
      if (await has(page, '#live[data-v="signoff"]')) break;
      await page.click('[data-t="advance"]'); await page.waitForTimeout(40);
      const v = await attr(page, '[data-t="live-scene"]', 'data-v'), vs = await attr(page, '[data-t="live-scene"]', 'data-set');
      if (vs) sets.add(vs);
      if (v && !seen.has(v)) {
        seen.add(v); await page.waitForTimeout(2600);
        if (fitBad == null) fitBad = await fits(page);
        if (process.env.SHOTS && shots++ < 8) await shot(page, 'scene-' + mode + '-live-' + v);
      }
    }
    { const kinds = await state(page, S => { const r = (S.live && S.live.st && S.live.st.rep) || S.reports[0]; return (r && r.segs || []).filter(x => x && x.booked && x.booked !== 'writers').map(x => x.booked); });
      if (kinds.length) ok(mode, 'a booked promo or angle plays its own kind of scene', [...seen].some(x => x.indexOf('seg_') === 0), kinds.join(',') + ' / ' + [...seen].join(','));
      else console.log(mode.padEnd(6), 'note', 'no promo or angle was booked on this card'); }
    { const beats = await state(page, S => { const r = (S.live && S.live.st && S.live.st.rep) || S.reports[0]; return (r && r.segs || []).filter(x => x && x.beat && (x.bids || []).length).map(x => x.beat); });
      if (beats.length) ok(mode, 'a beat of a storyline the writers wrote plays its own scene', [...seen].some(x => x.indexOf('beat_') === 0 || beats.some(b => x === 'seg_' + b)), beats.join(',') + ' / ' + [...seen].join(','));
      else console.log(mode.padEnd(6), 'note', 'the writers wrote no storyline beat on this card'); }
    { const deb = await state(page, S => { const r = (S.live && S.live.st && S.live.st.rep) || S.reports[0]; return JSON.stringify((r && r.segs || []).filter(x => x && x.debut).map(x => x.debut)); });
      if (debId >= 0 && deb !== '[]') ok(mode, 'a newcomer debuting with a surprise attack comes out on its scene', seen.has('beat_debut_atk'), [...seen].join(',') + ' / ' + deb);
      else console.log(mode.padEnd(6), 'note', 'the newcomer did not debut on this card (' + deb + ')'); }
    if (cellAt >= 0) ok(mode, 'a steel cell match is played inside the cell', sets.has('cell'), [...sets].join(','));
    ok(mode, 'the bell brings the lock-up', seen.has('lockup'), [...seen].join(','));
    ok(mode, 'a near fall brings the count', seen.has('nearfall'), [...seen].join(','));
    ok(mode, 'a win brings its finish: the three count, a tap-out, a roll-up, a cheap win or a disqualification', [...seen].some(x => x === 'finish' || /^fin_/.test(x) || /^move_/.test(x)), [...seen].join(','));
    ok(mode, 'each wrestler comes out on an entrance', [...seen].some(x => x === 'entrance' || x.startsWith('ent_')), [...seen].join(','));
    ok(mode, 'a line of colour cuts to the commentary desk', seen.has('desk2'), [...seen].join(','));
    ok(mode, 'the broadcast draws its scenes in 3D', (await attr(page, '[data-t="live-scene"]', 'data-3d').catch(() => null)) !== '0');
    if (seen.has('promo')) ok(mode, 'a promo brings the microphone', true); else console.log(mode.padEnd(6), 'note', 'no promo with a speaker on this card, so the microphone scene was not seen');
    ok(mode, 'the broadcast fits one screen with a scene on it', !fitBad, fitBad);
    ok(mode, 'no errors on the broadcast', !errs.length, errs.join(' | '));
  } catch (e) { ok(mode, 'the broadcast run finished', false, e.message); }
  await browser.close();
}
(async () => {
  for (const m of MODES) { if (process.env.ONLY !== "broadcast") await studio(m); await broadcast(m); }   // ONLY=broadcast runs just the show on the air
  console.log(fails.length ? 'FAILED: ' + fails.length : 'all scene checks passed');
  process.exit(fails.length ? 1 : 0);
})();
