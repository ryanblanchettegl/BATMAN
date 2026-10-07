/* A whole-game run on the combined build: five weeks by real clicks, every page visited, on four screen modes. */
const { open, go, overflow, shot, flash, fits, airShow } = require('./helper');
const FILE = process.env.EWF_OUT || 'index';
const PAGES = ['desk', 'backstage', 'career', 'booking', 'roster', 'locker', 'titles', 'market', 'storylines', 'history', 'sheet', 'feed', 'boards', 'manage', 'house', 'deals', 'overview', 'finances', 'world'];
async function run(mode, weeks) {
  const { browser, page, errs } = await open({ mode, file: FILE, promo: process.env.PROMO || 'pdw' }), bad = [];
  const fit = async where => { const o = await overflow(page); if (o) bad.push(where + ': ' + o); const f = await fits(page); if (f) bad.push(where + ' does not fit one screen: ' + f); };
  const has = sel => page.$(sel);
  const click = async sel => { const e = await page.$(sel); if (e) { await e.click(); return true; } return false; };
  const info = await page.evaluate(() => ({ screen: document.documentElement.dataset.screen, fs: getComputedStyle(document.body).fontSize, font: document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(',') : '' }));
  for (let w = 0; w < weeks; w++) {
    await go(page, 'booking');
    for (let g = 0; g < 40; g++) {
      if (await has('.win')) { await page.click('.win #modal-ok'); continue; }
      if (await has('#live')) {   // on the air: every call answered, and each one has to fit the screen
        await fit('title card w' + w);
        await airShow(page, { report: false, pick: k => (w + k.length) % 2, onCall: async k => { await fit('call ' + k + ' w' + w); } });
        await fit('sign-off w' + w); await page.click('[data-t="advance"]'); await fit('after the show w' + w); continue;
      }
      if (await has('[data-t="closeReport"]')) { await page.click('[data-t="closeReport"]'); continue; }
      if (await has('[data-t="after-screen"]')) { await fit('after the show w' + w); await page.click('[data-t="after-look"] >> nth=1'); await page.click('[data-t="advance"]'); await fit('the office after the show w' + w); if (await has('[data-t="book-next"]:not([disabled])')) { await page.click('[data-t="book-next"]'); continue; } break; }
      if (await has('[data-t="pre"]')) { await page.click('[data-t="pre"]'); continue; }
      if (await has('[data-t="suggest"]')) { await page.click('[data-t="suggest"]'); await fit('card w' + w); await page.click('[data-t="advance"]'); continue; }
      break;
    }
    await go(page, 'desk');
    for (let g = 0; g < 12 && await click('[data-t="ev-open"]'); g++) { await click('.win [data-t="ev"]'); await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
    await fit('desk w' + w);
    if (!(await has('[data-t="endweek"]:not([disabled])'))) { bad.push('week ' + w + ' could not be closed: ' + (await page.$eval('.main', e => e.innerText.slice(0, 200).replace(/\n/g, ' ')))); break; }
    await page.click('[data-t="endweek"]');
    if (await has('.win')) { await fit('week closed w' + w); await page.keyboard.press('Escape'); }
    if (w === 1) for (const p of PAGES) { await go(page, p); await fit(p); if (['desk', 'roster', 'manage', 'house', 'deals', 'overview', 'finances', 'storylines', 'sheet', 'boards', 'world', 'career', 'locker'].includes(p) && (mode === 'desk' || mode === 'phone' || mode === 'tv')) await shot(page, 'j-' + mode + '-' + p); if (p === 'roster') { await page.click('tbody tr.pick'); await fit('profile'); await shot(page, 'j-' + mode + '-profile'); await page.keyboard.press('Escape'); } }
  }
  const before = await page.evaluate(() => { const S = window.EWF_DEBUG.state(); return S.week + '/' + S.promos[S.player].cash; });
  await page.reload();
  try { await page.waitForSelector('[data-t="continue"]', { timeout: 8000 }); } catch (e) { bad.push('no Continue after reload. Saved bytes: ' + await page.evaluate(() => { const t = localStorage.getItem('ewf9000-save-4'); return t ? t.length : null; }) + '. Screen: ' + (await page.evaluate(() => document.getElementById('app').innerText.slice(0, 160).replace(/\n/g, ' | ')))); console.log(mode, bad); await browser.close(); return 1; }
  await page.click('[data-t="continue"]'); await page.waitForSelector('main.main');
  const after = await page.evaluate(() => { const S = window.EWF_DEBUG.state(); return S.week + '/' + S.promos[S.player].cash; });
  if (before !== after) bad.push('save did not round-trip: ' + before + ' vs ' + after);
  console.log(mode, JSON.stringify(info), '| week', after.split('/')[0], '|', await page.$eval('.status', e => e.innerText.replace(/\n/g, ' ').slice(0, 60)), '| overflow/problems:', bad.length ? bad : 'none', '| errors:', errs.length ? errs : 'none');
  await browser.close();
  return bad.length + errs.length;
}
(async () => { let n = 0; for (const m of (process.env.MODES || "desk,tablet,tv").split(",")) n += await run(m, +(process.env.WEEKS || 5)); console.log(n ? 'journey: ' + n + ' PROBLEMS' : 'journey: all passed'); process.exit(n ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
