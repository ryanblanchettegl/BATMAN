/* The arena in 3D on the broadcast (app/src/kit/arena.tsx): it is drawn while a show is on the air, its seats fill
   to the night's real attendance, it is as loud as the crowd line says, it gets out of the way of a call, the
   Arena button turns it off and on, and the broadcast still fits one screen with it.
   Run: NODE_PATH=<dir containing playwright> node app/tests/arena.js   (MODES=desk,tablet,tv; SHOTS=<dir> keeps pictures) */
const { open, go, state, fits, shot } = require('./helper');
const MODES = (process.env.MODES || 'desk').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', arena: true });
  const has = async sel => !!(await page.$(sel));
  try {
    await go(page, 'booking');
    await page.click('[data-t="suggest"]');
    for (let k = 0; k < 6 && !(await has('#live')); k++) { if (await has('[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(50); }
    ok(mode, 'the show goes on the air', await has('#live'));
    await page.waitForTimeout(800);
    ok(mode, 'the arena is drawn on the title card', await page.$eval('[data-t="arena"]', e => !e.hidden).catch(() => false));
    const want = await state(page, S => { const r = S.live.st.rep; return Math.round(Math.min(1, r.att / r.cap) * 100); });
    const sold = await page.$eval('[data-t="arena"]', e => +e.dataset.v);
    ok(mode, 'the seats fill to the night\'s attendance', sold === want, sold + '% of ' + want + '%');
    ok(mode, 'the arena says the crowd in words', /in a building that holds/.test(await page.$eval('[data-t="arena"]', e => e.getAttribute('aria-label'))));
    ok(mode, 'the title card fits one screen with the arena', !(await fits(page)), await fits(page));
    if (process.env.SHOTS) await shot(page, 'arena-' + mode + '-title');
    // on to a match, then check the arena is as loud as the crowd line
    let seen = false, call = false, quiet = true;
    for (let g = 0; g < 400 && !(seen && call); g++) {
      if (await has('[data-t="live-call"]')) {
        if (!call) { call = true; ok(mode, 'a call from the gorilla position takes the arena away', !(await has('[data-t="arena"]'))); }
        await page.waitForTimeout(450);
        const safe = await state(page, S => (S.live.ev && S.live.ev.safe) || 0);
        await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); continue;
      }
      if (await has('#live[data-v="signoff"]')) break;
      await page.click('[data-t="advance"]'); await page.waitForTimeout(60);
      if (!seen && await has('[data-t="live-crowd"]')) {
        const crowd = await page.$eval('[data-t="live-crowd"]', e => +e.dataset.v), heat = await page.$eval('[data-t="arena"]', e => +e.dataset.heat).catch(() => -1);
        if (heat !== crowd) quiet = false;
        if (g > 4) { seen = true; ok(mode, 'the arena is as loud as the crowd line', quiet, 'arena ' + heat + ', crowd ' + crowd); ok(mode, 'a match fits one screen with the arena', !(await fits(page)), await fits(page)); if (process.env.SHOTS) await shot(page, 'arena-' + mode + '-match'); }
      }
    }
    ok(mode, 'a match was seen on the air', seen);
    if (await has('#live') && await has('[data-t="live-arena"]')) {
      await page.click('[data-t="live-arena"]');
      ok(mode, 'the Arena button turns it off', !(await has('[data-t="arena"]')) && await page.evaluate(() => JSON.parse(localStorage.getItem('gorilla-position-prefs')).arena === false));
      await page.click('[data-t="live-arena"]');
      ok(mode, 'and on again', await has('[data-t="arena"]'));
    }
    const n = await page.evaluate(() => window.EWF_DEBUG.arena());
    ok(mode, 'the arena is set up once per stretch on the screen, not every redraw', n >= 1 && n <= 12, n + ' set-ups');
    ok(mode, 'no errors in the page', !errs.length, errs.join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, e.message); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  console.log(fails.length ? 'FAILED: ' + fails.length : 'all arena checks passed');
  process.exit(fails.length ? 1 : 0);
})();
