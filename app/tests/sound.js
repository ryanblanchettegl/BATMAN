/* Sound effects (Ryan, 23 October): real recordings, decoded once the first press wakes the sound; a press snaps, the
   voices of a group never pile up past their limit however fast the clicks come, nothing plays with Sound off, and a
   show on the air rings the bell and brings up the crowd, which goes when the broadcast does.
   Run: NODE_PATH=<dir containing playwright> node app/tests/sound.js */
const { open, go, redraw } = require('./helper');
const fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
const has = async (page, sel) => !!(await page.$(sel));
const played = page => page.evaluate(() => window.EWF_SOUND.played.slice());
async function waitFor(fn, ms) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 150)); } return false; }

(async () => {
  const { browser, page, errs } = await open({ promo: 'pdw', auto: false, prefs: { snd: true } });
  try {
    ok('the sound bank is in the page', await page.evaluate(() => !!window.EWF_SFX_DATA && Object.keys(window.EWF_SFX_DATA).length >= 20));
    await page.mouse.click(5, 5);
    ok('the first press wakes the sound and decodes the recordings', await waitFor(() => page.evaluate(() => window.EWF_SOUND.ready()), 15000), await page.evaluate(() => window.EWF_SOUND.state()));
    await go(page, 'booking');
    const before = (await played(page)).length;
    await page.click('[data-t="suggest"]'); await page.waitForTimeout(150);
    const after = await played(page);
    ok('a press snaps', after.length > before && after.slice(before).some(x => /^ui_/.test(x)), after.slice(before).join(' '));
    // fifty presses as fast as the page can take them: the interface never holds more than its four voices
    const most = await page.evaluate(() => new Promise(res => { let m = 0, i = 0; const bs = [...document.querySelectorAll('button')]; const go = () => { bs[i % bs.length].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); m = Math.max(m, window.EWF_SOUND.voices().ui); if (++i < 50) setTimeout(go, 12); else res(m); }; go(); }));
    ok('fast clicking never piles up voices', most <= 4 && most >= 2, 'most at once: ' + most);
    // Sound off: nothing plays
    await page.evaluate(() => { const p = window.EWF_DEBUG.pref || null; if (p) p.snd = false; });
    const offPref = await page.evaluate(() => !!window.EWF_DEBUG.pref);
    if (offPref) {
      const n0 = (await played(page)).length; await page.click('[data-t="suggest"]'); await page.waitForTimeout(150);
      ok('nothing plays with Sound off', (await played(page)).length === n0);
      await page.evaluate(() => { window.EWF_DEBUG.pref.snd = true; });
    }
    // a show on the air: the crowd comes up, the bell rings
    await redraw(page);
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(80); }
    ok('the show goes on the air', await has(page, '#live'));
    let bell = false, crowd = false;
    for (let i = 0; i < 90; i++) {
      if (await has(page, '[data-t="live-call"]')) { await page.waitForTimeout(450); const safe = await page.evaluate(() => (window.EWF_DEBUG.state().live.ev || {}).safe || 0); await page.click('[data-t="live-pick"][data-c="' + safe + '"]'); }
      else await page.click('[data-t="advance"]');
      await page.waitForTimeout(120);
      const p = await played(page); bell = bell || p.includes('bell'); crowd = crowd || p.includes('loop:crowd_bed');
    }
    ok('the bell rings in a match', bell);
    ok('the crowd murmur plays during the broadcast', crowd);
    const ring = (await played(page)).filter(x => /^(hit|hit_heavy|body|boards|mat|steel|grab|pop|pop_big|ooh)$/.test(x));
    ok('the ring and the crowd are heard', ring.length > 0, [...new Set(ring)].join(' '));
    ok('no errors', !errs.length, errs.join(' | '));
  } catch (e) { ok('ran to the end', false, e.message); }
  await browser.close();
  console.log(fails.length ? 'FAILED: ' + fails.length : 'sound ok');
  process.exit(fails.length ? 1 : 0);
})();
