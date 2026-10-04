/* Browser run of the weekly challenge: the title card entry, the code checker, twelve weeks, and the finished screen with its code. Desk and tablet.
   Build first:  node build.js
   Run:          NODE_PATH=/opt/npm-tools/node_modules node app/tests/challenge.js */
const { open, overflow, state, redraw } = require('./helper');
const fails = [];
function check(mode, label, ok, detail) { console.log(mode.padEnd(6), ok ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!ok) fails.push(mode + ' ' + label); }
(async () => {
  for (const mode of ['desk', 'tablet']) {
    const { browser, page, errs } = await open({ mode, promo: null, file: process.env.EWF_OUT || 'index' });
    await page.click('[data-t="challenge"]'); await page.waitForSelector('#chal-code');
    const txt = await page.$eval('.modal, [role="dialog"], .win', e => e.innerText).catch(() => '');
    check(mode, 'the challenge window opens with this week and the length', /12 weeks/.test(txt) && /20\d\d-W\d\d/.test(txt), txt.slice(0, 60).replace(/\s+/g, ' '));
    check(mode, 'the window fits the screen', (await overflow(page)) === '', await overflow(page));
    await page.fill('#chal-code', 'hello'); await page.waitForTimeout(100);
    check(mode, 'a bad code is refused', /not a challenge code/.test(await page.$eval('.modal, [role="dialog"], .win', e => e.innerText).catch(() => '')));
    await page.click('[data-t="chal-play"]'); await page.waitForSelector('main.main');
    const c0 = await state(page, S => S.chal ? { id: S.chal.id, weeks: S.chal.weeks, week: S.week } : null);
    check(mode, 'playing starts a twelve week game', !!c0 && c0.weeks === 12 && c0.week === 1, JSON.stringify(c0));
    // run the twelve weeks through the engine, answering the inbox with the first choice
    await state(page, S => { for (let w = 0; w < 14 && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = GP.suggest(S); S.card = c; const pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); if (GP.validate(S, c).errors.length) { S.qi++; continue; } GP.runPlayerShow(S, c); } GP.endWeek(S); } });
    await redraw(page); await page.waitForSelector('#chal-final');
    const code = await page.$eval('#chal-final', e => e.innerText), over = await state(page, S => S.over && S.over.why);
    check(mode, 'twelve weeks end the game with a code', over === 'challenge' && /^EWF-\d{4}W\d{2}-[0-9A-Z]+-[0-9A-Z]{2}$/.test(code), code);
    check(mode, 'the code reads back to the same score', await state(page, (S, c) => { const r = GP.challengeRead(c); return r.ok && r.score === S.chal.score; }, code));
    check(mode, 'the finished screen fits', (await overflow(page)) === '', await overflow(page));
    await page.click('[data-t="chal-copy"]').catch(() => {});
    await page.click('[data-t="newgame-yes"]'); await page.waitForSelector('.selrow');
    check(mode, 'back to the menu', true);
    check(mode, 'no errors', errs.length === 0, errs.join(' | '));
    await browser.close();
  }
  if (fails.length) { console.log('FAILED: ' + fails.length); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
  console.log('challenge: all checks passed');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
