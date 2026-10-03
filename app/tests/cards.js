const { open, go, overflow, shot, state, redraw } = require('./helper');
(async () => {
  let bad = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
  for (const mode of (process.env.MODES || 'desk,phone,tablet,tv').split(',')) {
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
    // Tab stays inside a pop-up: from the last control it wraps to the first and never reaches the page behind
    if (mode === 'desk') {
      await go(page, 'titles'); await page.waitForTimeout(100);
      await page.click('[data-t="title-card"]'); await page.waitForSelector('.cards .win'); await page.waitForTimeout(150);
      let stayed = true; for (let k = 0; k < 14; k++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('.cards .win')))) stayed = false; }
      ok(stayed, 'Tab cycles inside the pop-up');
      await page.keyboard.press('Shift+Tab'); ok(await page.evaluate(() => !!document.activeElement.closest('.cards .win')), 'Shift+Tab stays inside too');
      await page.click('[data-t="card-close"]');
    }
    // a promotion's name opens its pop-up
    await go(page, 'world'); await page.waitForTimeout(100);
    ok(await n('[data-t="promo-card"]') >= 5, mode + ' promotion names in the World table are links (' + await n('[data-t="promo-card"]') + ')');
    await page.click('[data-t="promo-card"]'); await page.waitForSelector('.cards .win');
    ok(/Champions/i.test(await page.$eval(".cards .wb", e => e.innerText)) && /Model/i.test(await page.$eval('.cards .wb', e => e.innerText)), mode + ' promotion card: ' + await title());
    ok((await overflow(page)) === '', mode + ' promotion card fits');
    await page.click('[data-t="card-close"]');
    // after a pop-up closes the highlight is back on the name that opened it: by mouse and by keyboard
    if (mode === 'desk') {
      await go(page, 'titles'); await page.waitForTimeout(150);
      const id0 = await page.$eval('[data-t="title-card"]', e => e.dataset.id);
      const backOn = () => page.evaluate(() => ({ t: document.activeElement.dataset.t, id: document.activeElement.dataset.id }));
      await page.click('[data-t="title-card"]'); await page.waitForSelector('.cards .win'); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      let b = await backOn(); ok(b.t === 'title-card' && b.id === id0, 'mouse: the highlight returns to the name: ' + JSON.stringify(b));
      await page.focus('[data-t="title-card"]'); await page.keyboard.press('Enter'); await page.waitForSelector('.cards .win'); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      b = await backOn(); ok(b.t === 'title-card' && b.id === id0, 'keyboard: the highlight returns to the name: ' + JSON.stringify(b));
    }
    // gamepad: A on a name opens the pop-up, B closes it, and the highlight is back on the name
    if (mode === 'tv') {
      await go(page, 'titles'); await page.waitForTimeout(150);
      await page.focus('[data-t="title-card"]');
      const mark = await page.evaluate(() => document.activeElement.dataset.id);
      await page.evaluate(() => window.EWF_DEBUG.pad('a')); await page.waitForSelector('.cards .win');
      ok(await n('.cards .win') === 1, 'gamepad A on a name opens its pop-up');
      await page.evaluate(() => window.EWF_DEBUG.pad('b')); await page.waitForTimeout(150);
      const back = await page.evaluate(() => ({ t: document.activeElement.dataset.t, id: document.activeElement.dataset.id }));
      ok(await n('.cards .win') === 0 && back.t === 'title-card' && back.id === mark, 'gamepad B closes it and the highlight returns to the name: ' + JSON.stringify(back) + ' wanted ' + mark);
    }
    // a long wrestler list: typing letters jumps to a name
    if (mode === 'desk') {
      await go(page, 'desk'); await page.waitForTimeout(100); await page.click('[data-t="bs-room"][data-v="trainer"]');
      const pick = await page.$eval('#bs-a', e => { const o = e.options[30]; return { name: o.text.split(' ·')[0], v: o.value }; });
      await page.focus('#bs-a'); await page.keyboard.type(pick.name.slice(0, 4), { delay: 20 });
      const got = await page.$eval('#bs-a', e => e.options[e.selectedIndex].text);
      ok(got.toLowerCase().indexOf(pick.name.slice(0, 4).toLowerCase()) === 0, 'typing ' + pick.name.slice(0, 4) + ' jumps to a name: ' + got);
    }
    // remote: Page Down and Page Up (channel up and down) move ten rows of a long table
    if (mode === 'tv') {
      await go(page, 'roster'); await page.waitForTimeout(200);
      await page.focus('tr.pick'); const at = () => page.evaluate(() => [].indexOf.call(document.querySelectorAll('tr.pick'), document.activeElement));
      await page.keyboard.press('PageDown'); ok(await at() === 10, 'Page Down moves ten rows: row ' + await at());
      await page.keyboard.press('PageUp'); ok(await at() === 0, 'Page Up moves back ten: row ' + await at());
    }
    // the Options window draws without errors and its volume buttons work
    if (mode === 'desk') {
      await page.evaluate(() => { window.EWF_DEBUG.ui.modal = { kind: 'options' }; window.EWF_DEBUG.render(); }); await page.waitForSelector('.win'); await page.click('[data-t="musvol"][data-v="1"]');
      ok(await page.evaluate(() => window.EWF_MUSIC_VOL.vol()) === 1, 'Options: music volume button sets the Jukebox level');
      await page.keyboard.press('Escape'); await page.waitForTimeout(80);
    }
    // gamepad X opens Help, Y opens the Jukebox
    if (mode === 'tv') {
      await page.evaluate(() => window.EWF_DEBUG.pad('x')); await page.waitForTimeout(100);
      ok(await page.evaluate(() => /help/i.test((document.querySelector('.win .wt span') || {}).textContent || '')), 'gamepad X opens Help');
      await page.evaluate(() => window.EWF_DEBUG.pad('b')); await page.waitForTimeout(100);
      await page.evaluate(() => window.EWF_DEBUG.pad('y')); await page.waitForTimeout(150);
      ok(await n('.jk') >= 1, 'gamepad Y opens the Jukebox');
      await page.evaluate(() => window.EWF_DEBUG.pad('y')); await page.waitForTimeout(100);
    }
    // a stack four deep: Back steps out in the right order
    const ids = await state(page, S => { const L = S.w.filter(w => w.promo === S.player && !w.nw); return { a: L[0].id, b: L[1].id, tid: S.teams.find(t => t.promo === S.player).id, pid: S.player, title: S.promos[S.player].titles[0].id }; });
    await page.evaluate(i => { const u = window.EWF_DEBUG.ui; u.cards.length = 0; u.cards.push({ k: 'w', id: i.a }, { k: 'team', id: i.tid }, { k: 'title', pid: i.pid, id: i.title }, { k: 'w', id: i.b }); window.EWF_DEBUG.render(); }, ids);
    await page.waitForSelector('.cards .win');
    const depth = () => page.evaluate(() => window.EWF_DEBUG.ui.cards.map(c => c.k).join(','));
    ok(await depth() === 'w,team,title,w', mode + ' stack four deep: ' + await depth());
    ok((await overflow(page)) === '', mode + ' four-deep stack fits');
    for (const want of ['w,team,title', 'w,team', 'w']) { await page.click('[data-t="card-back"]'); await page.waitForTimeout(60); ok(await depth() === want, mode + ' Back leaves ' + want + ': ' + await depth()); }
    await page.click('[data-t="card-close"]');
    // a retired wrestler still has a card
    await state(page, (S, id) => { S.w[id].rt = true; }, ids.b);
    await page.evaluate(id => { window.EWF_DEBUG.ui.cards.length = 0; window.EWF_DEBUG.ui.cards.push({ k: 'w', id }); window.EWF_DEBUG.render(); }, ids.b);
    await page.waitForSelector('.cards .win');
    ok(await n('.cards canvas.pt') >= 1 && (await overflow(page)) === '', mode + ' a retired wrestler\'s card opens and fits: ' + await title());
    await page.click('[data-t="card-close"]');
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
