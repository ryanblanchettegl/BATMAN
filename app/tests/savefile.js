/* A save to a file and back: Options, Save to a file, then Load a save file restores the game.
   Run: NODE_PATH=<dir containing playwright> node app/tests/savefile.js */
const { open, state } = require('./helper'), fs = require('fs');
const fails = [], ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
(async () => {
  const { browser, page, errs } = await open({ mode: 'desk', promo: 'pdw' });
  try {
    await page.keyboard.press('F2'); await page.waitForSelector('[data-t="save-file"]');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-t="save-file"]')]);
    const p = await dl.path(), txt = fs.readFileSync(p, 'utf8');
    ok('the save comes out as a file named for its week', /^ewf-save-week-\d+\.json$/.test(dl.suggestedFilename()) && txt.length > 1000, dl.suggestedFilename());
    ok('and says so', /Saved as/.test(await page.$eval('[data-t="save-msg"]', e => e.textContent).catch(() => '')));
    const wk = await state(page, S => S.week); await state(page, S => { S.week = 99; });
    await page.setInputFiles('[data-t="save-loadfile"] input', p); await page.waitForTimeout(500);
    ok('loading the file brings the game back', (await state(page, S => S.week)) === wk);
    ok('no errors', !errs.length, errs.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'savefile: all passed'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
