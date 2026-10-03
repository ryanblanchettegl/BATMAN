const { open, go, overflow, shot, state, redraw } = require('./helper');
(async () => {
  let bad = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
  for (const mode of (process.env.MODES || 'desk,phone,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, promo: 'pdw' });
    const n = sel => page.$$eval(sel, L => L.length), title = () => page.$eval('.cards .wt span', e => e.textContent).catch(() => '');
    // titles page: a title name opens its history
    await go(page, 'titles'); await page.waitForTimeout(100);
    ok(await n('[data-t="title-card"]') >= 4, mode + ' title names are links');
    await page.click('[data-t="title-card"]'); await page.waitForSelector('.cards .win');
    ok(/Title/.test(await title()) && await n('.cards .belt') === 1 && /Lineage/i.test(await page.$eval('.cards .wb', e => e.innerText)), mode + ' title card: ' + await title());
    ok((await overflow(page)) === '', mode + ' title card fits');
    await shot(page, 'card-' + mode + '-title');
    // champion's name inside it opens the wrestler on top
    await page.click('.cards [data-t="who"]'); await page.waitForTimeout(80);
    const who = await title();
    ok(await n('.cards canvas.pt') >= 1 && /Popularity/i.test(await page.$eval('.cards .wb', e => e.innerText)) && await n('[data-t="card-back"]') === 1, mode + ' wrestler card on top: ' + who);
    ok((await overflow(page)) === '', mode + ' wrestler card fits');
    await shot(page, 'card-' + mode + '-wrestler');
    // Back steps out one at a time
    if (mode === 'tv') await page.keyboard.press('Backspace'); else await page.keyboard.press('Escape');
    await page.waitForTimeout(80);
    ok(/Title/.test(await title()), mode + ' Back returns to the title card: ' + await title());
    await page.keyboard.press('Escape'); await page.waitForTimeout(80);
    ok(await n('.cards .win') === 0, mode + ' second Back closes the stack');
    // news text: a name in a sentence is a link; a team card
    await state(page, S => { for (let k = 0; k < 2; k++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); while (S.qi < S.queue.length) { const c = GP.suggest(S); const pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); const ch = GP.chaos(S, c); if (ch) GP.resolveChaos(S, c, 0); GP.runPlayerShow(S, c); } GP.endWeek(S); } }); await redraw(page);
    await go(page, 'world'); await page.waitForTimeout(100);
    ok(await n('.news .lnk') >= 1, mode + ' names in the news are links (' + await n('.news .lnk') + ')');
    const tid = await state(page, S => { const t = S.teams.find(t => t.promo === S.player); return t ? t.id : null; });
    await page.evaluate(id => { window.EWF_DEBUG.ui.cards.push({ k: 'team', id }); window.EWF_DEBUG.render(); }, tid);
    await page.waitForSelector('.cards .win');
    ok(await n('.cards canvas.pt') === 2 && /Experience together/i.test(await page.$eval('.cards .wb', e => e.innerText)), mode + ' team card: ' + await title());
    ok((await overflow(page)) === '', mode + ' team card fits');
    await shot(page, 'card-' + mode + '-team');
    await page.click('[data-t="card-close"]'); ok(await n('.cards .win') === 0, mode + ' Close shuts it');
    // own wrestler: Full profile goes to the roster page with them open
    await go(page, 'desk'); const own = await state(page, S => S.w.find(w => w.promo === S.player && !w.nw).id);
    await page.evaluate(id => { window.EWF_DEBUG.ui.cards.push({ k: 'w', id }); window.EWF_DEBUG.render(); }, own);
    await page.waitForSelector('[data-t="card-full"]'); await page.click('[data-t="card-full"]'); await page.waitForTimeout(100);
    ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'roster' && await n('.prof') === 1 && await n('.cards .win') === 0, mode + ' Full profile opens the roster profile');
    ok(errs.length === 0, mode + ' errors: ' + errs.join(' | '));
    await browser.close();
  }
  console.log(bad ? 'FAILED ' + bad : 'cards ok'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
