/* Sound effects (docs/plans/sound.md): only sounds Ryan picked by ear. The broadcast and the office piano: the
   recordings are in the page, a press plays a piano note (not with Button sounds off), a show on the air rings the bell and brings up the
   crowd, the ring is heard, nothing plays with Sound off, and there are no errors.
   Run: NODE_PATH=<dir containing playwright> node app/tests/sound.js */
const { open, go, redraw } = require('./helper');
const fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
const has = async (page, sel) => !!(await page.$(sel));
const played = page => page.evaluate(() => (window.EWF_SOUND ? window.EWF_SOUND.played.slice() : []));
async function waitFor(fn, ms) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 150)); } return false; }

(async () => {
  const { browser, page, errs } = await open({ promo: 'pdw', auto: false, prefs: { snd: true } });
  try {
    ok('the picked recordings are in the page', await page.evaluate(() => !!window.EWF_SFX_DATA && ['pn_small', 'pn_big', 'pn_pop', 'pn_good', 'pn_bad', 'pn_week', 'pn_grade_a', 'pn_grade_f', 'pn_feud', 'pn_champ', 'pn_star', 'bell', 'bed', 'pop', 'gasp', 'hit', 'slam', 'cnt_big_one', 'cnt_small_thr', 'wah_pbp', 'wah_col', 'mic_man', 'mic_woman', 'mic_big'].every(k => window.EWF_SFX_DATA[k])));
    await page.mouse.click(5, 5);
    ok('the first press wakes the sound and decodes the recordings', await waitFor(() => page.evaluate(() => window.EWF_SOUND.ready()), 15000));
    await go(page, 'booking');
    await page.click('[data-t="suggest"]'); await page.waitForTimeout(150);
    ok('a press plays a piano note', (await played(page)).some(x => /^pn_(small|big)$/.test(x)), (await played(page)).join(' '));
    // Button sounds off: presses are silent
    await page.evaluate(() => { window.EWF_DEBUG.pref.btn = false; });
    const n0 = (await played(page)).length; await page.click('[data-t="suggest"]'); await page.waitForTimeout(150);
    ok('Button sounds off makes presses silent', (await played(page)).length === n0);
    await page.evaluate(() => { window.EWF_DEBUG.pref.btn = true; window.EWF_SOUND.played.length = 0; });
    // Sound off: nothing plays, even on the air
    await page.evaluate(() => { window.EWF_DEBUG.pref.snd = false; });
    await redraw(page);
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(80); }
    ok('the show goes on the air', await has(page, '#live'));
    for (let i = 0; i < 6; i++) { if (await has(page, '[data-t="live-call"]')) break; await page.click('[data-t="advance"]'); await page.waitForTimeout(100); }
    ok('nothing plays with Sound off', !(await played(page)).length, (await played(page)).join(' '));
    await page.evaluate(() => { window.EWF_SOUND.played.length = 0; });
    await page.evaluate(() => { window.EWF_DEBUG.pref.snd = true; });
    let bell = false, bed = false;
    for (let i = 0; i < 400; i++) {
      if (await has(page, '[data-t="live-call"]')) { await page.waitForTimeout(450); const safe = await page.evaluate(() => (window.EWF_DEBUG.state().live.ev || {}).safe || 0); await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); }
      else await page.click('[data-t="advance"]');
      await page.waitForTimeout(60);
      const p = await played(page); bell = bell || p.includes('bell'); bed = bed || p.includes('loop:bed');
      if (!(await has(page, '#live'))) break;
    }
    ok('the bell rings in a match', bell);
    ok('the voice group never holds more than two at once', await page.evaluate(() => window.EWF_SOUND.voices().voice <= 2));
    ok('the crowd plays under the broadcast', bed);
    const heard = [...new Set((await played(page)).filter(x => /^(hit|slam|pop|gasp|cnt_.*)$/.test(x)))];
    ok('the ring and the crowd are heard', heard.length >= 2, heard.join(' '));
    ok('the commentators talk', (await played(page)).some(x => /^wah_(pbp|col)$/.test(x)));
    ok('every sound played is one Ryan picked', (await played(page)).every(x => /^(loop:)?(bell|bed|pop|gasp|hit|slam|cnt_(big|small)_(one|two|three|thr|eight|nine|ten)|wah_pbp|wah_col|mic_(man|woman|big)|pn_[a-z_]+)$/.test(x)), [...new Set(await played(page))].join(' '));
    // the show goes off the air: After the show plays the grade's sting
    ok('After the show plays the grade on the piano', (await played(page)).some(x => /^pn_grade_[abcdf]$/.test(x)), [...new Set(await played(page))].filter(x => /^pn_/.test(x)).join(' '));
    ok('no group ever holds more voices than its limit', await page.evaluate(() => { const v = window.EWF_SOUND.voices(); return v.ui <= 4 && v.ring <= 6 && v.big <= 3 && v.crowd <= 8 && v.voice <= 2; }));
    ok('no errors', !errs.length, errs.join(' | '));
  } catch (e) { ok('ran to the end', false, e.message); }
  await browser.close();
  console.log(fails.length ? 'FAILED: ' + fails.length : 'sound ok');
  process.exit(fails.length ? 1 : 0);
})();
