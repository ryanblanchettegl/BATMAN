/* More calls from the gorilla position, each set up by what causes it and then answered:
   somebody is hurt, the crowd has gone quiet, they are not going home, the network on the line, the sponsor at ringside.
   Every call has to fit one screen. Run: NODE_PATH=<dir containing playwright> node app/tests/calls.js   (MODES=desk,tablet) */
const { open, go, overflow, shot, state, fits, redraw } = require('./helper');
const MODES = (process.env.MODES || 'desk,tablet').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const has = async (page, sel) => !!(await page.$(sel));
const whole = (page, sel) => page.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
const lastCall = page => page.$$eval('#live .ln.call', a => a.length ? a[a.length - 1].textContent.replace(/\s+/g, ' ').trim() : '');
const picks = page => page.$$eval('[data-t="live-pick"]', a => a.map(b => b.querySelector('.n b').textContent.replace(/^\d+\. /, '')));

async function toAir(page) {
  for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
  return has(page, '#live');
}
/** A fresh card with no trouble planned for the night and no call still waiting out its time. `setup(S)` then arranges what causes the call. */
async function card(page, setup, arg) {
  await page.click('[data-t="suggest"]');
  const r = await page.evaluate(new Function('arg', 'const S = window.EWF_DEBUG.state(), E = window.GP; S.lcd = {}; S.bp = 12; for (let i = 0; i < 60; i++) { S.chs = null; if (!E.chaos(S, S.card)) break; } return (' + setup.toString() + ')(S, E, arg);'), arg);
  await redraw(page);
  return r;
}
/** See the show through. `on[kind]` answers a call of that kind; anything else gets the safe answer. `between` runs at each result. */
async function walk(page, on, between) {
  const seen = [];
  for (let g = 0; g < 900; g++) {
    if (await has(page, '[data-t="live-call"]')) {
      const k = await page.$eval('[data-t="live-call"]', e => e.getAttribute('data-v')); seen.push(k);
      await page.waitForTimeout(430);
      if (on[k]) await on[k]();
      if (await has(page, '[data-t="live-call"]')) { const safe = await state(page, S => (S.live.ev && S.live.ev.safe) || 0); await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); }
      await state(page, S => { if (S.live) S.live.cnt = 0; });   // the test wants every call it set up, whatever else the night brought
      continue;
    }
    if (await has(page, '#live[data-v="signoff"]')) return seen;
    if (await has(page, '#live .result')) { if (between) await between(); await page.click('[data-t="advance"]'); continue; }
    if (await has(page, '[data-t="live-skip"]')) await page.click('[data-t="live-skip"]'); else await page.click('[data-t="advance"]');
  }
  throw new Error('the broadcast never ended');
}
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
  const box = () => whole(page, '.callbox .q'), why = () => whole(page, '.callbox .why');
  try {
    /* ---- show one: somebody is hurt, and the crowd has gone quiet ---- */
    await go(page, 'booking');
    const hurt = await card(page, (S) => { const m = S.card[0], w = S.w[m.sides[0][0]]; w.rd = 95; m.int = 'brutal'; return { id: w.id, name: w.name }; });
    ok(mode, 'the show goes on the air', await toAir(page));
    let quiet = false;
    const one = await walk(page, {
      botch: async () => {
        ok(mode, 'a worn body in a brutal match goes down wrong', (await box()).includes(hurt.name + ' goes down wrong') && /on the road too long/.test(await why()) && /Brutal intensity/.test(await why()), await why());
        ok(mode, 'three answers, and the third is an attempt with its chance', (await picks(page)).length === 3 && /an attempt with a \d+% chance/.test(await whole(page, '.callbox')), (await picks(page)).join(' | '));
        await fit('the call when somebody is hurt'); await shot(page, 'calls-' + mode + '-hurt');
        await page.click('[data-t="live-pick"][data-c="0"]');
        ok(mode, 'stopping the match is on the broadcast, and they remember it', /You stop it/.test(await lastCall(page)) && await state(page, (S, a) => S.rmY[a.id].v > 0, hurt), await lastCall(page));
      },
      audible: async () => {
        quiet = true; const p = await picks(page);
        ok(mode, 'after a match that fell flat, the building has gone quiet', /The building has gone quiet/.test(await box()) && /last match/.test(await why()) && p.length >= 2 && p[0] === 'Stay with the plan', p.join(' | '));
        await fit('the call when the crowd has gone quiet'); await shot(page, 'calls-' + mode + '-quiet');
        const i = p.indexOf('Take it to the floor');
        if (i > 0) { await page.click('[data-t="live-pick"][data-c="' + i + '"]'); ok(mode, 'taking it to the floor is on the broadcast', /third row/.test(await lastCall(page)), await lastCall(page)); }
      }
    }, async () => { if (!quiet) await state(page, S => { const segs = S.live ? S.live.st.rep.segs : []; if (segs.length) segs[segs.length - 1].cr = 30; }); });
    ok(mode, 'both calls came up', one.includes('botch') && one.includes('audible'), one.join(', '));
    await page.click('[data-t="advance"]');
    ok(mode, 'the report lists the calls', (await whole(page, '[data-t="rep-calls"]')).includes('Stop the match'));
    await page.click('[data-t="closeReport"]'); await go(page, 'booking');   // the report closes to the desk

    /* ---- show two: the network on the line, and a match that will not go home ---- */
    const two = await card(page, (S) => { const n = S.card.length, free = S.card.map((m, i) => i).filter(i => i < n - 1 && !S.card[i].title && (S.card[i].mt === '1v1' || S.card[i].mt === 'tag') && S.card[i].len !== 'L');
      if (free.length < 2) return null; S.card[free[0]].int = 'brutal'; const w = S.w[S.card[free[1]].sides[0][0]]; w.cc = 1; return { net: free[0], ot: free[1], name: w.name, slot: S.promos[S.player].slot }; });
    ok(mode, 'the second card has room for both', !!two && two.slot >= 1, JSON.stringify(two));
    ok(mode, 'the second show goes on the air', await toAir(page));
    const twoSeen = await walk(page, {
      network: async () => {
        ok(mode, 'the network objects to what is going out in its slot', /standards desk/.test(await box()) && /Brutal intensity in/.test(await why()) && (await picks(page)).length === 3, await why());
        await fit('the network’s call'); await shot(page, 'calls-' + mode + '-network');
        await page.click('[data-t="live-pick"][data-c="1"]');
        ok(mode, 'toning it down is on the broadcast, and the match is tamer', /keep it clean/.test(await lastCall(page)) && await state(page, (S, a) => S.live.card[a.net].int === 'normal', two), await lastCall(page));
      },
      overtime: async () => {
        const p = await picks(page);
        ok(mode, 'somebody with creative control is going long', /not looking at the referee/.test(await box()) && (await why()).includes(two.name + ' has creative control') && p.length >= 2 && p[0] === 'Tell the referee to take it home', p.join(' | '));
        await fit('the call when they will not go home'); await shot(page, 'calls-' + mode + '-overtime');
        await page.click('[data-t="live-pick"][data-c="1"]');
        ok(mode, 'giving them the time is on the broadcast', /They get their time/.test(await lastCall(page)), await lastCall(page));
        if (/^Give them five more minutes\. Cut /.test(p[1])) ok(mode, 'the segment that lost its time is marked on tonight’s sheet', (await page.$$eval('[data-t="night"] .nt-r .st', a => a.map(e => e.textContent))).includes('Cut'));
      }
    });
    ok(mode, 'both calls came up', twoSeen.includes('network') && twoSeen.includes('overtime'), twoSeen.join(', '));
    await page.click('[data-t="advance"]');

    /* ---- next week: the sponsor at ringside ---- */
    await nextWeek(page);
    await card(page, (S) => { S.sponsors.push({ name: 'Harbor Lager', weeks: 3, type: 'image', val: 0, text: 'Popularity stays at 0 or better', pay: 20000 }); return true; });
    ok(mode, 'the third show goes on the air', await toAir(page));
    const three = await walk(page, {
      sponsor: async () => {
        ok(mode, 'a sponsor whose deal is nearly up wants the main event', /Harbor Lager’s people are in the front row/.test(await box()) && /\$20,000 a week/.test(await why()) && /runs out in 3 weeks/.test(await why()), await why());
        await fit('the sponsor’s call'); await shot(page, 'calls-' + mode + '-sponsor');
        await page.click('[data-t="live-pick"][data-c="1"]');
        ok(mode, 'reading the plug extends the deal', await state(page, S => S.sponsors.find(x => x.name === 'Harbor Lager').weeks === 15) && /word for word/.test(await lastCall(page)), await lastCall(page));
      }
    });
    ok(mode, 'the sponsor’s call came up', three.includes('sponsor'), three.join(', '));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'calls-fail-' + mode).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('calls: all passed');
})();
