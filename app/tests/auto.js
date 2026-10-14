/* Auto-play on the broadcast: the show runs itself at a reading pace, never rings the opening bell, stops for every
   call and never answers one, can be paused with P or its button, and stays on the sign-off.
   Run: NODE_PATH=<dir containing playwright> node app/tests/auto.js   (MODES=desk,tv) */
const { open, go, state, redraw, fits } = require('./helper');
const MODES = (process.env.MODES || 'desk').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const has = async (page, sel) => !!(await page.$(sel));
const pos = page => page.evaluate(() => { const b = window.EWF_DEBUG.ui.slices.booking; return b && b.live ? b.live.s + ':' + b.live.b : ''; });
async function waitFor(page, fn, ms) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await page.waitForTimeout(150); } return false; }

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', auto: true, prefs: { speed: 2.5 } });
  try {
    await go(page, 'booking');
    await page.click('[data-t="suggest"]');
    // a worn body in a brutal opener: the first match brings a call from the gorilla position
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP; S.lcd = {}; S.bp = 12; for (let i = 0; i < 60; i++) { S.chs = null; if (!E.chaos(S, S.card)) break; } const m = S.card[0], w = S.w[m.sides[0][0]]; w.rd = 95; m.int = 'brutal'; });
    await redraw(page);
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
    ok(mode, 'the show goes on the air', await has(page, '#live'));
    ok(mode, 'the auto-play button is on the broadcast and says it is on', /on/.test(await page.$eval('[data-t="live-auto"]', e => e.textContent).catch(() => '')));
    await page.waitForTimeout(2500);
    ok(mode, 'auto-play does not ring the opening bell', await has(page, '#live[data-v="title"]'));
    ok(mode, 'week one has no rival show to name yet', !(await has(page, '[data-t="live-rival"]')));
    ok(mode, 'the title card fits one screen', !(await fits(page)), await fits(page));
    await page.click('[data-t="advance"]');
    // answer a call (after checking the first one is left waiting) and come back with the screen moving on its own
    let waited = null;
    const answer = async () => {
      if (!(await has(page, '[data-t="live-call"]'))) return false;
      if (waited == null) { const n = await state(page, S => S.live.ev.id); await page.waitForTimeout(4000); waited = await has(page, '[data-t="live-call"]') && await state(page, (S, n) => !!S.live.ev && S.live.ev.id === n && !S.live.ev.done, n); }
      else await page.waitForTimeout(450);
      const safe = await state(page, S => (S.live.ev && S.live.ev.safe) || 0);
      await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); await page.waitForTimeout(100); return true;
    };
    /** Does the broadcast move within `ms` with no press but answers to calls? */
    const moves = async ms => { const t = Date.now(), p = await pos(page); while (Date.now() - t < ms) { if (await answer()) continue; if ((await pos(page)) !== p) return true; await page.waitForTimeout(150); } return false; };
    ok(mode, 'after the bell the lines come by themselves', await moves(15000), await pos(page));
    if (await waitFor(page, () => has(page, '[data-t="live-crowd"]'), 15000)) ok(mode, 'a match shows how loud the building is', /The crowd/.test(await page.$eval('[data-t="live-crowd"]', e => e.textContent)));
    ok(mode, 'and keep coming with no press', await moves(10000), await pos(page));
    while (await answer());
    await page.keyboard.press('p'); await page.waitForTimeout(250);
    const p2 = await pos(page); await page.waitForTimeout(5000);
    ok(mode, 'P pauses it', (await pos(page)) === p2 && /off/.test(await page.$eval('[data-t="live-auto"]', e => e.textContent).catch(() => '')), p2 + ' -> ' + await pos(page));
    await page.click('[data-t="live-auto"]');
    ok(mode, 'the button starts it again', await moves(10000));
    if (waited == null) await waitFor(page, () => has(page, '[data-t="live-call"]'), 120000).then(() => answer());
    ok(mode, 'auto-play waits on a call and never answers it', waited === true, String(waited));
    // the rest of the night, then the sign-off stays put
    // turn auto-play off and walk the rest of the night by hand, checking each match's result
    if (/on/.test(await page.$eval('[data-t="live-auto"]', e => e.textContent).catch(() => 'off'))) await page.keyboard.press('p');
    let bestOk = true, bestSeen = 0;
    for (let g = 0; g < 900 && !(await has(page, '#live[data-v="signoff"]')); g++) {
      if (await answer()) continue;
      if (await has(page, '#live .result')) {
        const want = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), b = window.EWF_DEBUG.ui.slices.booking.live, r = S.live ? S.live.st.rep : S.reports[0], s = r.segs[b.s]; if (!s || s.k !== 'match') return null; const before = r.segs.slice(0, b.s).filter(x => x.k === 'match'); return before.length > 0 && before.every(x => s.ov > x.ov); });
        const shown = await has(page, '[data-t="live-best"]'); if (want != null && want !== shown) bestOk = false; if (shown) bestSeen++;
        await page.click('[data-t="advance"]'); continue;
      }
      if (await has(page, '[data-t="live-skip"]')) await page.click('[data-t="live-skip"]'); else await page.click('[data-t="advance"]');
    }
    ok(mode, 'the best match of the night so far is called out, and only then', bestOk, bestSeen + ' times');
    await page.waitForTimeout(4000);
    ok(mode, 'the sign-off lists the night’s big moments', /Tonight’s moments/.test(await page.$eval('[data-t="live-moments"]', e => e.textContent).catch(() => '')));
    ok(mode, 'the sign-off fits one screen', !(await fits(page)), await fits(page));
    ok(mode, 'auto-play stays on the sign-off', await has(page, '#live[data-v="signoff"]'));
    ok(mode, 'a near fall or a finish is marked as a big moment', await state(page, S => S.reports[0].segs.some(s => (s.bc || []).some(b => b.h))));
    // a replay runs itself the same way: one press after the title card, then it moves with no press
    await page.click('[data-t="live-auto"]').catch(() => {});   // auto-play back on
    await page.click('[data-t="advance"]'); if (await has(page, '[data-t="after-full"]')) await page.click('[data-t="after-full"]');
    if (await has(page, '[data-t="replay"]')) {
      await page.click('[data-t="replay"]'); await page.waitForTimeout(300);
      ok(mode, 'a replay opens on its title card and waits', await has(page, '#live[data-v="title"]'));
      await page.click('[data-t="advance"]');
      const r0 = await pos(page);
      ok(mode, 'a replay runs itself after one press', await waitFor(page, async () => (await pos(page)) !== r0 && (await pos(page)) !== '', 12000), r0 + ' -> ' + await pos(page));
    } else ok(mode, 'the report offers a replay', false);
    ok(mode, 'no errors', !errs.length, errs.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
}
/** On a fresh show, SPACE while the welcome is still typing rings the bell: one press, not two. */
async function onePress(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', prefs: { speed: 0.5 } });
  try {
    await go(page, 'booking'); await page.click('[data-t="suggest"]');
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
    const typing = await has(page, '#live .untyped');
    await page.click('[data-t="advance"]'); await page.waitForTimeout(300);
    ok(mode, 'one press rings the bell while the welcome is still typing', typing && !(await has(page, '#live[data-v="title"]')), 'typing: ' + typing);
    ok(mode, 'no errors (one press)', !errs.length, errs.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
}
/** Results pace: the night goes from result to result on its own, and still stops for every call. */
async function results(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', auto: true, prefs: { pace: 'results' } });
  try {
    await go(page, 'booking'); await page.click('[data-t="suggest"]');
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
    ok(mode, 'the footer with its buttons fits', !(await fits(page)), await fits(page));
    ok(mode, 'the pace button says Results', /Results/.test(await page.$eval('[data-t="live-pace"]', e => e.textContent).catch(() => '')));
    await page.waitForTimeout(1200); await page.click('[data-t="advance"]');
    await page.waitForTimeout(1500); if (await has(page, '#live[data-v="seg"]')) ok(mode, 'a segment with skip, auto-play and pace fits', !(await fits(page)), await fits(page));
    const t0 = Date.now(); let calls = 0, waitedOk = true;
    while (Date.now() - t0 < 180000 && !(await has(page, '#live[data-v="signoff"]'))) {
      if (await has(page, '[data-t="live-call"]')) { calls++; const n = await state(page, S => S.live.ev.id); await page.waitForTimeout(1500); if (!(await state(page, (S, n) => !!S.live.ev && S.live.ev.id === n && !S.live.ev.done, n))) waitedOk = false; const safe = await state(page, S => (S.live.ev && S.live.ev.safe) || 0); await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); continue; }
      await page.waitForTimeout(200);
    }
    const secs = Math.round((Date.now() - t0) / 1000);
    ok(mode, 'on Results pace the night reaches its sign-off with no press but the answers', await has(page, '#live[data-v="signoff"]'), secs + ' s, ' + calls + ' calls');
    ok(mode, 'and it still waits on every call', waitedOk && calls > 0, calls + ' calls');
    ok(mode, 'no errors (results)', !errs.length, errs.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
}
(async () => { for (const m of MODES) { await onePress(m); await results(m); await run(m); } console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'auto: all passed'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
