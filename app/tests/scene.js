/* Create a Scene and the scenes on the broadcast (app/src/screens/scene, app/src/kit/scene.ts).
   The studio: it opens from the World Editor's Scenes tab, a person and a part of the body can be picked with the
   pointer, the pins and the controls, turning and dragging change the pose, keyframes add and play, a scene saves in the world, a
   file that is not a scene is refused, and the page fits one screen. The broadcast: with Scenes on, a match shows
   a scene at the bell, the count at a near fall and the three at the finish; Scenes off takes it away.
   Run: NODE_PATH=<dir containing playwright> node app/tests/scene.js   (SHOTS=<dir> keeps pictures) */
const { open, go, state, fits, shot } = require('./helper');
const MODES = (process.env.MODES || 'desk').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const has = async (page, sel) => !!(await page.$(sel));
const attr = (page, sel, a) => page.$eval(sel, (e, a) => e.getAttribute(a), a).catch(() => null);

async function studio(mode) {
  const { browser, page, errs } = await open({ mode, promo: null });
  try {
    // Create a Scene is in the World Editor: a copy of a world, its Scenes tab
    await page.click('[data-t="scr"][data-v="editor"]'); await page.click('[data-t="ed-new-copy"]');
    await page.click('[data-t="ed-tab"][data-v="scenes"]');
    ok(mode, 'the World Editor has a Scenes tab', await has(page, '[data-t="ed-scene-new"]'));
    await page.click('[data-t="ed-scene-open"][data-id="lockup"]'); await page.waitForTimeout(400);
    ok(mode, 'Create a Scene opens full screen on the stage', await has(page, '[data-t="scene-stage"]'));
    ok(mode, 'the studio fits one screen', !(await fits(page)), await fits(page));
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-studio');
    // a new scene starts from a setup: the set and the people placed for it
    await page.click('[data-t="scene-tab"][data-v="new"]');
    ok(mode, 'a new scene offers a setup for every kind of set', (await page.$$('[data-t="scene-setup"]')).length >= 10);
    await page.click('[data-t="scene-setup"][data-v="talk"]'); await page.waitForTimeout(300);
    ok(mode, 'a talk show setup puts a host and a guest on the talk show set', (await page.$eval('[data-t="scene-set"]', e => e.value).catch(() => '')) === 'talk' || /talk show/i.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)));
    ok(mode, 'the studio still fits with a setup', !(await fits(page)), await fits(page));
    await page.click('[data-t="scene-done"]'); await page.waitForTimeout(300); await page.click('[data-t="ed-scene-open"][data-id="lockup"]'); await page.waitForTimeout(400);
    // pick a person, then a part by its pin, turn it, and see the angle move
    await page.selectOption('[data-t="scene-who"]', 'A');
    ok(mode, 'the picked person is drawn with a pin at every joint', (await page.$$eval('[data-t="scene-pin"]', a => a.length)) === 15, 'pins: ' + (await page.$$eval('[data-t="scene-pin"]', a => a.length)));
    await page.click('[data-t="scene-pin"][data-v="sh_n"]');
    ok(mode, 'pressing a pin picks that part', (await attr(page, '[data-t="scene-stage"]', 'data-sel')) === 'A:sh_n');
    const a0 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    await page.click('[data-t="scene-turn"][data-v="15"]');
    const a1 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    ok(mode, 'turning +15 turns the picked part', a1 === a0 + 15, a0 + ' to ' + a1);
    await page.focus('[data-t="scene-stage"]'); await page.keyboard.press('ArrowLeft');
    const a2 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    ok(mode, 'an arrow key on the stage turns the picked part', a2 === a1 + 5, a1 + ' to ' + a2);
    // the pointer: dragging the part on the stage turns it
    const box = await page.$eval('[data-t="scene-stage"]', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.click('[data-t="scene-pin"][data-v="body"]');
    const px = box.x + box.w * (0.5 + (-2.6 / 16)), py = box.y + box.h * (0.5 - (1.3 / 9));   // Wrestler A's chest at the first keyframe
    await page.mouse.move(px, py); await page.mouse.down(); await page.mouse.move(px - 40, py, { steps: 4 }); await page.mouse.up();
    ok(mode, 'pressing on a person on the stage picks them', /^A:/.test((await attr(page, '[data-t="scene-stage"]', 'data-sel')) || ''), await attr(page, '[data-t="scene-stage"]', 'data-sel'));
    // a pose to start from, a size, a face and marks
    await page.selectOption('[data-t="scene-poselib"]', 'kneel');
    await page.click('[data-t="scene-size"][data-v="+"]');
    ok(mode, 'the size goes up', (await page.$eval('[data-t="scene-sizev"]', e => e.textContent)) === '105%', await page.$eval('[data-t="scene-sizev"]', e => e.textContent));
    await page.click('[data-t="scene-tab"][data-v="face"]');
    await page.click('[data-t="scene-expr"][data-v="snarl"]'); await page.click('[data-t="scene-blood"][data-v="3"]'); await page.click('[data-t="scene-mark"][data-v="tears"]');
    const fg = JSON.parse(await attr(page, '[data-t="scene-fig"]', 'data-v') || '{}');
    ok(mode, 'a pose from the library is applied', fg.y === -1.33 && fg.p && fg.p.kn_n === -90, JSON.stringify(fg.p));
    ok(mode, 'a face and marks are kept on the keyframe', fg.e === 'snarl' && fg.m && fg.m.blood === 3 && fg.m.tears === true, JSON.stringify(fg.m) + ' ' + fg.e);
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-marks');
    await page.click('[data-t="scene-tab"][data-v="pose"]');
    // the camera: zoom in, then drag an empty part of the stage to pan, then take a picture
    await page.click('[data-t="scene-zoom"][data-v="in"]');
    ok(mode, 'Zoom in moves the camera closer', (await page.$eval('[data-t="scene-zoomv"]', e => e.textContent)) === '125%', await page.$eval('[data-t="scene-zoomv"]', e => e.textContent));
    const cam0 = await attr(page, '[data-t="scene-stage"]', 'data-cam');
    const ex = box.x + box.w * 0.03, ey = box.y + box.h * 0.04;   // the top left corner, above the crowd: nothing to pick there
    await page.mouse.move(ex, ey); await page.mouse.down(); await page.mouse.move(ex + 60, ey + 10, { steps: 4 }); await page.mouse.up();
    const cam1 = await attr(page, '[data-t="scene-stage"]', 'data-cam');
    ok(mode, 'a drag on an empty part of the stage pans the camera', cam1 !== cam0, cam0 + ' to ' + cam1);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('[data-t="scene-snap"]')]);
    ok(mode, 'Take picture saves a picture', /\.png$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    await page.click('[data-t="scene-camreset"]');
    ok(mode, 'Whole set puts the camera back', (await page.$eval('[data-t="scene-zoomv"]', e => e.textContent)) === '100%');
    const k0 = await page.$$eval('[data-t="scene-key"]', a => a.length);
    await page.click('[data-t="scene-addkey"]');
    ok(mode, '+ Key adds a keyframe', (await page.$$eval('[data-t="scene-key"]', a => a.length)) === k0 + 1);
    await page.click('[data-t="scene-play"]'); await page.waitForTimeout(300);
    ok(mode, 'Play plays the scene', /Stop/.test(await page.$eval('[data-t="scene-play"]', e => e.textContent)));
    await page.waitForTimeout(3200);
    // the 3D stage: the same scene as a model; press a person to pick them, drag a part to turn it
    await page.click('[data-t="scene-key"][data-v="0"]');
    await page.click('[data-t="scene-3d"]'); await page.waitForTimeout(2500);
    ok(mode, 'the 3D stage opens', await has(page, '[data-t="scene-stage3d"]'));
    const ca = await page.evaluate(() => window.EWF_DEBUG.three && window.EWF_DEBUG.three() ? window.EWF_DEBUG.three().where('B', 'chest') : null);
    if (ca) { await page.mouse.click(ca[0], ca[1]); await page.waitForTimeout(300); }
    ok(mode, 'pressing a person in 3D picks them', /^B:/.test((await attr(page, '[data-t="scene-stage3d"]', 'data-sel')) || ''), await attr(page, '[data-t="scene-stage3d"]', 'data-sel'));
    await page.click('[data-t="scene-pin"][data-v="sh_n"]');
    const s0 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    const hd = await page.evaluate(() => window.EWF_DEBUG.three().where('B', 'hand_n'));
    if (hd) { await page.mouse.move(hd[0], hd[1]); await page.mouse.down(); await page.mouse.move(hd[0] + 10, hd[1] - 110, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300); }
    const s1 = +(await page.$eval('[data-t="scene-angle"]', e => e.textContent));
    ok(mode, 'dragging a part in 3D turns it round its pin', s1 !== s0 && /^B:/.test((await attr(page, '[data-t="scene-stage3d"]', 'data-sel')) || ''), s0 + ' to ' + s1);
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-3d');
    await page.click('[data-t="scene-3d"]');
    // a headline, then keep it in the world
    await page.click('[data-t="scene-tab"][data-v="cast"]');
    await page.selectOption('[data-t="scene-propkind"]', 'headline'); await page.fill('[data-t="scene-newwords"]', 'BREAKING NEWS'); await page.click('[data-t="scene-addprop"]');
    ok(mode, 'a headline is added and picked', /:prop$/.test((await attr(page, '[data-t="scene-stage"]', 'data-sel')) || ''));
    // layers: everything in the keyframe, front first; reorder, hide and lock
    await page.click('[data-t="scene-tab"][data-v="layers"]'); await page.waitForTimeout(150);
    const order0 = await page.$$eval('[data-t="scene-lpick"]', b => b.map(x => x.getAttribute('data-v')));
    ok(mode, 'the layers list everybody and every prop, front first', order0.length >= 3, order0.join(','));
    const last = order0[order0.length - 1];
    await page.click('[data-t="scene-lfwd"][data-v="' + last + '"]'); await page.waitForTimeout(150);
    const order1 = await page.$$eval('[data-t="scene-lpick"]', b => b.map(x => x.getAttribute('data-v')));
    ok(mode, 'Forward brings a layer in front of the one ahead of it', order1[order1.length - 2] === last, order1.join(','));
    await page.click('[data-t="scene-lhide"][data-v="' + order1[0] + '"]'); await page.click('[data-t="scene-llock"][data-v="' + order1[1] + '"]'); await page.waitForTimeout(150);
    ok(mode, 'a hidden or locked layer cannot be picked', (await attr(page, '[data-t="scene-lpick"][data-v="' + order1[0] + '"]', 'disabled')) != null && (await attr(page, '[data-t="scene-lpick"][data-v="' + order1[1] + '"]', 'disabled')) != null);
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-layers');
    ok(mode, 'the studio fits with the layers open', !(await fits(page)), await fits(page));
    await page.click('[data-t="scene-lhide"][data-v="' + order1[0] + '"]'); await page.click('[data-t="scene-llock"][data-v="' + order1[1] + '"]');
    // the Backdrop tab: a wall of your own behind the scene
    await page.click('[data-t="scene-tab"][data-v="bg"]'); await page.click('[data-t="scene-bgnew"]'); await page.waitForTimeout(150);
    await page.selectOption('[data-t="scene-bgwall"]', '#5c2430');
    await page.fill('[data-t="scene-bgwords"]', 'FIGHT NIGHT'); await page.click('[data-t="scene-bgadd"]');
    await page.selectOption('[data-t="scene-bgkind"]', 'skyline'); await page.click('[data-t="scene-bgadd"]');
    await page.click('[data-t="scene-bgpart"][data-v="0"]'); await page.click('[data-t="scene-bgmove"][data-v="u"]'); await page.waitForTimeout(250);
    ok(mode, 'a backdrop takes a banner and a skyline', (await page.$$('[data-t="scene-bgpart"]')).length === 2);
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-backdrop');
    ok(mode, 'the studio fits with the Backdrop tab', !(await fits(page)), await fits(page));
    await page.click('[data-t="scene-bgsave"]'); await page.waitForTimeout(100);
    ok(mode, 'Keep the backdrop keeps it in the world', /kept in/.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)));
    await page.click('[data-t="scene-tab"][data-v="file"]');
    ok(mode, 'the set list offers the backdrop', (await page.$$eval('[data-t="scene-set"] option', o => o.filter(x => x.value.indexOf('bg_') === 0).length)) >= 1);
    await page.selectOption('[data-t="scene-set"]', 'plain');
    // easing: how a keyframe is reached
    await page.click('[data-t="scene-key"][data-v="1"]'); await page.waitForTimeout(100);
    await page.selectOption('[data-t="scene-ease"]', 'cut'); await page.waitForTimeout(100);
    ok(mode, 'a keyframe can be reached in a cut', (await page.$eval('[data-t="scene-ease"]', e => e.value)) === 'cut');
    ok(mode, 'the studio fits with the easing choice', !(await fits(page)), await fits(page));
    await page.selectOption('[data-t="scene-ease"]', ''); await page.click('[data-t="scene-key"][data-v="0"]');
    await page.click('[data-t="scene-tab"][data-v="file"]');
    const sets = await page.$$eval('[data-t="scene-set"] option', o => o.map(x => x.value));
    for (const st of sets) { await page.selectOption('[data-t="scene-set"]', st); await page.waitForTimeout(80); }
    ok(mode, 'every set draws (' + sets.length + ', each from its own angle)', sets.length >= 9 && !errs.length, sets.join(','));
    ok(mode, 'a scene has no filters until it asks', !(await has(page, '[data-t="scene-fx"][aria-pressed="true"]')) && !(await has(page, '.sc-stage .scfx')));
    await page.click('[data-t="scene-fx"][data-v="scan"]'); await page.click('[data-t="scene-fx"][data-v="mono"]'); await page.waitForTimeout(150);
    ok(mode, 'scan lines and black and white lay over the stage', await has(page, '.sc-stage.fx-scan.fx-mono .scfx'));
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-fx');
    await page.click('[data-t="scene-fx"][data-v="mono"]'); await page.waitForTimeout(80);
    await page.selectOption('[data-t="scene-frame"]', 'tall'); await page.waitForTimeout(300);
    { const bb = await (await page.$('[data-t="scene-stage"]')).boundingBox(); ok(mode, 'a tall picture is taller than it is wide', bb && bb.height > bb.width * 1.2, bb && (bb.width + 'x' + bb.height)); }
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-tall');
    await page.selectOption('[data-t="scene-frame"]', 'square'); await page.waitForTimeout(300);
    { const bb = await (await page.$('[data-t="scene-stage"]')).boundingBox(); ok(mode, 'a square picture is square', bb && Math.abs(bb.height - bb.width) < 3, bb && (bb.width + 'x' + bb.height)); }
    await page.selectOption('[data-t="scene-frame"]', 'wide'); await page.waitForTimeout(300);
    ok(mode, 'a filter comes off again', !(await has(page, '.sc-stage.fx-mono')) && await has(page, '.sc-stage.fx-scan'));
    await page.fill('[data-t="scene-name"]', 'Test scene'); await page.selectOption('[data-t="scene-when"]', 'news');
    await page.click('[data-t="scene-save"]');
    ok(mode, 'Save keeps the scene in the world', /kept in/.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)), await page.$eval('[data-t="scene-msg"]', e => e.textContent));
    await page.setInputFiles('[data-t="scene-file"]', { name: 'x.scene.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await page.waitForTimeout(200);
    ok(mode, 'a file that is not a scene is refused', /not a scene/.test(await page.$eval('[data-t="scene-msg"]', e => e.textContent)));
    ok(mode, 'the studio still fits one screen', !(await fits(page)), await fits(page));
    // the commentary desk: two in suits, an open chair; bring a guest in and send them away
    await page.selectOption('[data-t="scene-open"]', 'desk1'); await page.waitForTimeout(200);
    await page.click('[data-t="scene-tab"][data-v="cast"]');
    ok(mode, 'the desk has an open chair to bring a guest into', await has(page, '[data-t="scene-bringin"][data-v="C3"]'));
    await page.click('[data-t="scene-bringin"][data-v="C3"]');
    ok(mode, 'a guest is brought in to the third chair', await has(page, '[data-t="scene-sendaway"][data-v="C3"]') && /^C3:/.test((await attr(page, '[data-t="scene-stage"]', 'data-sel')) || ''));
    await page.click('[data-t="scene-sendaway"][data-v="C3"]');
    ok(mode, 'and sent away again', await has(page, '[data-t="scene-bringin"][data-v="C3"]'));
    if (process.env.SHOTS) await shot(page, 'scene-' + mode + '-desk');
    // holding: the slam lifts B in A's hands; put B down and pick B up again, and bring an arm in front
    await page.click('[data-t="scene-tab"][data-v="file"]');
    await page.selectOption('[data-t="scene-open"]', 'slam'); await page.waitForTimeout(200);
    await page.click('[data-t="scene-tab"][data-v="pose"]');
    await (await page.$$('[data-t="scene-key"]'))[1].click();
    await page.selectOption('[data-t="scene-who"]', 'B');
    ok(mode, 'in the slam B is held in A\'s hands', (await page.$eval('[data-t="scene-heldby"]', e => e.value)) === 'A:hands');
    const figOf = async () => { await page.click('[data-t="scene-tab"][data-v="face"]'); const f = JSON.parse(await attr(page, '[data-t="scene-fig"]', 'data-v')); await page.click('[data-t="scene-tab"][data-v="pose"]'); return f; };
    const held = await figOf();
    await page.selectOption('[data-t="scene-heldby"]', '');
    const down = await figOf();
    ok(mode, 'put down, B stays where they were, on their own', !down.on && down.y > held.y + 2, JSON.stringify({ was: held.y, now: down.y }));
    await page.selectOption('[data-t="scene-heldby"]', 'A:shoulders');
    const up = await figOf();
    ok(mode, 'and can be picked up again, by the shoulders', up.on === 'A:shoulders', up.on);
    await page.selectOption('[data-t="scene-who"]', 'A'); await page.click('[data-t="scene-pin"][data-v="el_n"]');
    await page.click('[data-t="scene-limb"][data-v="3"]');
    const arm = await figOf();
    ok(mode, 'an arm can be brought in front of everyone', arm.lz && arm.lz.arm_n === 3, JSON.stringify(arm.lz));
    // hooks: a slot is a part in the story
    await page.click('[data-t="scene-tab"][data-v="cast"]');
    await page.selectOption('[data-t="scene-hook"][data-v="B"]', 'villain');
    ok(mode, 'a slot can be given a part in the story', /The villain/.test(await page.$eval('[data-t="scene-side"]', e => e.textContent)));
    ok(mode, 'the studio fits one screen with the holds and the parts', !(await fits(page)), await fits(page));
    await page.click('[data-t="scene-tab"][data-v="file"]');
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
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
    ok(mode, 'the show goes on the air', await has(page, '#live'));
    const seen = new Set(); let shots = 0, fitBad = null;
    for (let g = 0; g < 600; g++) {
      if (await has(page, '[data-t="live-call"]')) {
        ok(mode, 'a call takes the scene away', !(await has(page, '[data-t="live-scene"]')));
        await page.waitForTimeout(430); const safe = await state(page, S => (S.live.ev && S.live.ev.safe) || 0);
        await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); continue;
      }
      if (await has(page, '#live[data-v="signoff"]')) break;
      await page.click('[data-t="advance"]'); await page.waitForTimeout(40);
      const v = await attr(page, '[data-t="live-scene"]', 'data-v');
      if (v && !seen.has(v)) {
        seen.add(v); await page.waitForTimeout(2600);
        if (fitBad == null) fitBad = await fits(page);
        if (process.env.SHOTS && shots++ < 8) await shot(page, 'scene-' + mode + '-live-' + v);
      }
    }
    ok(mode, 'the bell brings the lock-up', seen.has('lockup'), [...seen].join(','));
    ok(mode, 'a near fall brings the count', seen.has('nearfall'), [...seen].join(','));
    ok(mode, 'a win brings the three count', seen.has('finish'), [...seen].join(','));
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
  for (const m of MODES) { await studio(m); await broadcast(m); }
  console.log(fails.length ? 'FAILED: ' + fails.length : 'all scene checks passed');
  process.exit(fails.length ? 1 : 0);
})();
