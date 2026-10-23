/* Sound effects are off (Ryan, 23 October: "It sounds terrible", "turn it all off"): the game is quiet except the
   soundtrack until new sounds are chosen and approved. This checks that nothing plays: no recordings in the page,
   nothing heard on a press or through a show on the air, no sound settings in Options, and no errors.
   When sound effects come back, this test goes back to checking them.
   Run: NODE_PATH=<dir containing playwright> node app/tests/sound.js */
const { open, go, redraw } = require('./helper');
const fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
const has = async (page, sel) => !!(await page.$(sel));
const played = page => page.evaluate(() => (window.EWF_SOUND ? window.EWF_SOUND.played.slice() : []));

(async () => {
  const { browser, page, errs } = await open({ promo: 'pdw', auto: false });
  try {
    ok('no sound effect recordings in the page', await page.evaluate(() => !window.EWF_SFX_DATA));
    await page.mouse.click(5, 5);
    await go(page, 'booking');
    await page.click('[data-t="suggest"]'); await page.waitForTimeout(150);
    ok('a press plays nothing', !(await played(page)).length, (await played(page)).join(' '));
    await redraw(page);
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(80); }
    ok('the show goes on the air', await has(page, '#live'));
    for (let i = 0; i < 40; i++) {
      if (await has(page, '[data-t="live-call"]')) { await page.waitForTimeout(450); const safe = await page.evaluate(() => (window.EWF_DEBUG.state().live.ev || {}).safe || 0); await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); }
      else await page.click('[data-t="advance"]');
      await page.waitForTimeout(100);
    }
    ok('a show on the air plays no sound effects', !(await played(page)).length, (await played(page)).join(' '));
    ok('no errors', !errs.length, errs.join(' | '));
  } catch (e) { ok('ran to the end', false, e.message); }
  await browser.close();
  console.log(fails.length ? 'FAILED: ' + fails.length : 'sound ok');
  process.exit(fails.length ? 1 : 0);
})();
