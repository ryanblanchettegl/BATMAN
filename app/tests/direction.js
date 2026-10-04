/* The direction of the company: the two calls from the gorilla position that decide more than tonight.
   The owner on the headset (the office wants its favourite to win), and who the show is built around (decided on
   the air after a main event). The test sets each one up, answers it, and checks what it leaves behind.
   Run: NODE_PATH=<dir containing playwright> node app/tests/direction.js   (MODES=desk,tablet) */
const { open, go, overflow, shot, state, fits, airShow, redraw } = require('./helper');
const MODES = (process.env.MODES || 'desk,tablet').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));
/** All of an element's text, including the part of a line that has not typed itself out yet. */
const whole = (page, sel) => page.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
/** The newest call line on the broadcast: a match can carry one from before the bell and one from after it. */
const lastCall = page => page.$$eval('#live .ln.call', a => a.length ? a[a.length - 1].textContent.replace(/\s+/g, ' ').trim() : '');

/** From a card that can run to the broadcast's title card. */
async function toAir(page) {
  for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
  return has(page, '#live');
}
/** Run every show left this week with the safe answers, close the week, and open the next card. */
async function nextWeek(page) {
  await state(page, S => { const E = window.GP, house = () => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
    house(); while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S); house(); S.card = []; });
  await page.evaluate(() => { const b = window.EWF_DEBUG.ui.slices.booking; if (b) { b.report = null; b.live = null; b.edit = -1; } });
  await go(page, 'desk'); await go(page, 'booking'); await redraw(page);
}

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const fit = async label => { const f = await fits(page), o = await overflow(page); ok(mode, label + ' fits one screen', !f && !o, f || o); };
  try {
    /* ---- the owner on the headset ---- */
    await go(page, 'booking'); await page.click('[data-t="suggest"]');
    const set = await state(page, S => { const E = window.GP, n = S.card.length; S.lcd = {};
      for (let i = 0; i < n; i++) { const m = S.card[i]; if (m.mt !== '1v1' || m.title || m.call != null) continue; const o = E.matchOdds(S, m, i, n); if (!o) continue; const side = o.p[0] < o.p[1] ? 0 : 1, id = m.sides[side][0];
        S.quests = S.quests.filter(q => q.type !== 'o_strong'); S.quests.push({ id: S.nid++, type: 'o_strong', w: id, due: S.week + 3, gain: 6, bp: 2, text: S.owner.name + ': keep ' + S.w[id].name + ' strong this month. No clean losses.' });
        return { i, id, name: S.w[id].name, owner: S.owner.name, trust: S.owner.trust, bp: S.bp }; }
      return null; });
    ok(mode, 'a match the owner cares about is on the card', !!set, set ? set.name : '');
    ok(mode, 'the show goes on the air', await toAir(page));
    let seen = false;
    await airShow(page, { report: false, onCall: async k => {
      if (k !== 'owner') return; seen = true;
      const q = await whole(page, '.callbox .q');
      ok(mode, 'the owner is on the headset about their favourite', q.includes(set.owner) && q.includes(set.name) && /does not lose tonight/.test(q), q);
      ok(mode, 'three answers, and only the way round costs booking power', (await page.$$('[data-t="live-pick"]')).length === 3 && /1 BP/.test(await txt(page, '[data-t="live-pick"][data-c="2"]')) && !/BP/.test(await txt(page, '[data-t="live-pick"][data-c="1"]')));
      ok(mode, 'it says why the office is calling now', /Why now: .*kept strong this month.*% chance tonight/.test(await txt(page, '.callbox .why')), await txt(page, '.callbox .why'));
      await fit('the owner’s call');
      await shot(page, 'direction-' + mode + '-owner');
      const bp = await state(page, S => S.bp);
      await page.waitForTimeout(430); await page.click('[data-t="live-pick"][data-c="1"]');
      ok(mode, 'doing as the office says is on the broadcast', /the office says so/.test(await lastCall(page)), await lastCall(page));
      const after = await state(page, (S, a) => ({ call: S.live.card[a.i].call, side: S.live.card[a.i].sides.findIndex(s => s.includes(a.id)), trust: S.owner.trust, bp: S.bp }), set);
      ok(mode, 'the finish is called for the favourite, the owner is pleased, and no booking power is spent', after.call === after.side && after.trust > set.trust && after.bp === bp, JSON.stringify(after));
    } });
    ok(mode, 'the owner’s call came up', seen);
    ok(mode, 'the favourite won', await state(page, (S, a) => S.reports[0].segs.some(s => s.k === 'match' && s.wi && s.wi.includes(a.id) && (s.calls || []).some(c => c.k === 'owner')), set));
    await page.click('[data-t="live-done"]');

    /* ---- who the show is built around ---- */
    let face = null;
    for (let tries = 0; tries < 5 && !face; tries++) {
      await nextWeek(page);
      await page.click('[data-t="suggest"]');
      const main = await state(page, S => { const E = window.GP, P = S.promos[S.player], n = S.card.length, m = S.card[n - 1]; S.lcd = {}; S.bp = 12;
        if (!m || m.mt !== '1v1') return null;
        const top = S.w.filter(w => w.promo === P.id && !w.nw).sort((a, b) => b.ovr - a.ovr).slice(0, 5).map(w => w.id), side = m.sides.findIndex(s => top.includes(s[0])); if (side < 0) return null;
        m.call = side; return { id: m.sides[side][0], name: S.w[m.sides[side][0]].name, had: S.fc ? S.fc.id : null }; });
      if (!main) continue;
      await redraw(page);
      if (!(await toAir(page))) continue;
      await airShow(page, { report: false, onCall: async k => {
        if (k !== 'face') return;
        const who = await state(page, S => ({ id: S.live.ev.who, name: S.w[S.live.ev.who].name }));   // whoever won the main event
        main.id = who.id; main.name = who.name;
        const q = await whole(page, '.callbox .q');
        ok(mode, 'after the main event the truck asks who the company is built around', q.includes(main.name) && /who is this company built around/.test(q), q);
        ok(mode, 'with nobody at the centre yet there are two answers', (await page.$$('[data-t="live-pick"]')).length === 2 && (await txt(page, '[data-t="live-pick"][data-c="1"]')).includes('BUILD THE COMPANY AROUND ' + main.name.toUpperCase()), await txt(page, '[data-t="live-pick"][data-c="1"]'));
        ok(mode, 'the match that led to it is still on screen', (await page.$$('#live .lv-log .ln')).length >= 3 && /After the bell|Who the show is built around/i.test(await txt(page, '#live .lv-head .eyebrow')));
        await fit('the call about who the show is built around');
        await shot(page, 'direction-' + mode + '-face');
        await page.waitForTimeout(430); await page.click('[data-t="live-pick"][data-c="1"]');
        face = main;
        ok(mode, 'the answer is on the broadcast', /company now/.test(await lastCall(page)), await lastCall(page));
        ok(mode, 'the game records who the company is built around', await state(page, (S, a) => !!S.fc && S.fc.id === a.id && S.fc.w === S.week, main));
        await shot(page, 'direction-' + mode + '-face-after');
      } });
      await page.click('[data-t="live-done"]');
    }
    ok(mode, 'the call about who the show is built around came up', !!face);
    if (face) {
      ok(mode, 'the notification bar says they will remember it', /will remember that/i.test(await txt(page, '.ftop')) || await state(page, (S, a) => !!(S.rmY[a.id] && S.rmY[a.id].mem.some(m => m.k === 'theone')), face));
      /* the next card: leave them off and the staff say so */
      await nextWeek(page); await page.click('[data-t="suggest"]');
      await state(page, (S, a) => { S.card = S.card.filter(m => !m.sides.some(s => s.includes(a.id))); }, face); await redraw(page);
      ok(mode, 'left off the next card, the notes beside the sheet say the crowd will feel it', (await txt(page, '.b1-pane')).includes('The shows are built around ' + face.name), (await txt(page, '.b1-pane')).slice(0, 200));
      await fit('the card with that warning');
      await page.click('[data-t="suggest"]');
      /* the Company page and their profile */
      await go(page, 'overview');
      ok(mode, 'the Company page says who the shows are built around', (await txt(page, '[data-t="built-around"]')).includes(face.name) && /a lift when they are in the main event/.test(await txt(page, '[data-t="built-around"]')), await txt(page, '[data-t="built-around"]'));
      const o = await overflow(page); ok(mode, 'the Company page fits its width', !o, o);
      await page.click('[data-t="built-around"] button');
      ok(mode, 'and so does their profile', await has(page, '[data-t="is-face"]'));
      if (mode === 'desk') await shot(page, 'direction-desk-profile');
    }
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'direction-fail-' + mode).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('direction: all passed');
})();
