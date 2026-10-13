/* Auto-play on the broadcast: the show runs itself at a reading pace, never rings the opening bell, stops for every
   call and never answers one, can be paused with P or its button, and stays on the sign-off.
   Run: NODE_PATH=<dir containing playwright> node app/tests/auto.js   (MODES=desk,tv) */
const { open, go, state, redraw, airShow, fits } = require('./helper');
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
    await airShow(page, { report: false });
    await page.waitForTimeout(4000);
    ok(mode, 'auto-play stays on the sign-off', await has(page, '#live[data-v="signoff"]'));
    ok(mode, 'a near fall or a finish is marked as a big moment', await state(page, S => S.reports[0].segs.some(s => (s.bc || []).some(b => b.h))));
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
(async () => { for (const m of MODES) { await onePress(m); await run(m); } console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'auto: all passed'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
