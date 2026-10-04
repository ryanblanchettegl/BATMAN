/* The Net section: the dirt sheet, the feed and the boards.
   Run: NODE_PATH=<dir containing playwright> node app/tests/net.js   (MODES=desk,tv) */
const { open, go, overflow, shot, state, redraw } = require('./helper');
const MODES = (process.env.MODES || 'desk,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const count = (page, sel) => page.$$eval(sel, L => L.length);

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    ok(mode, 'Net is a section in the top menu, after Stories', await page.$$eval('.menu [data-t="tab"]', L => L.map(b => b.getAttribute('data-v')).join()) === 'office,booking,roster,stories,net,manage,company');
    ok(mode, 'every menu button is on screen', await page.evaluate(() => [...document.querySelectorAll('.menu button')].every(b => { const r = b.getBoundingClientRect(); return r.width > 20 && r.left >= 0 && r.right <= window.innerWidth + 1; })));
    await page.click('.menu [data-t="tab"][data-v="net"]');
    ok(mode, 'the section opens on the dirt sheet, with three pages', /DIRT SHEET/i.test(await txt(page, 'h1')) && await count(page, '.subnav [data-t]') >= 3);
    ok(mode, 'before any show the sheet says so', /No shows yet this week/.test(await txt(page, 'main.main')));
    await over('the empty dirt sheet');
    await go(page, 'feed');
    ok(mode, 'the feed is empty before any show', /Nobody has posted yet/.test(await txt(page, 'main.main')));
    /* three weeks through the engine */
    await state(page, S => { for (let w = 0; w < 3 && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = GP.suggest(S), pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); if (GP.validate(S, c).errors.length) { S.qi++; continue; } GP.runPlayerShow(S, c); } GP.endWeek(S); } });
    await redraw(page);
    await go(page, 'sheet');
    const want = await state(page, S => { const I = GP.sheetInfo(S); return { past: I.past.length, lead: I.past[0].lead.head, shows: I.past[0].yours.map(y => y.show), rum: I.past[0].rumours.length }; });
    ok(mode, 'with no show yet this week it opens on last week’s issue', want.past === 3 && new RegExp(want.lead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(await txt(page, '.sheet-head')), want.lead);
    ok(mode, 'the issue reviews each of your shows', want.shows.length > 0 && want.shows.every(async s => (await txt(page, 'main.main')).indexOf(s) >= 0) && await count(page, '.sheet-show') === want.shows.length);
    ok(mode, 'rumours carry how sure they are', want.rum > 0 && /Sure|Likely|Thin/i.test(await txt(page, 'main.main')));
    ok(mode, 'the other companies are in it', /Around the companies/i.test(await txt(page, 'main.main')) && await count(page, '.list li') > 3);
    await over('a full dirt sheet');
    await shot(page, 'net-' + mode + '-sheet', true);
    await page.click('[data-t="sheet-tab"][data-v="now"]');
    ok(mode, 'This week shows the issue in progress', /so far/i.test(await txt(page, '.lead')));
    await page.click('[data-t="sheet-tab"][data-v="p1"]');
    ok(mode, 'older issues can be opened', !/so far/i.test(await txt(page, '.lead')));
    await go(page, 'feed');
    const n = await state(page, S => GP.feed(S).length);
    ok(mode, 'the feed has posts from wrestlers, the press, the company and fans', n >= 12 && await count(page, '.feed .fp') === Math.min(20, n) && ['wrestler', 'press', 'company', 'fan'].every(async k => await count(page, '.feed .fp.' + k) > 0), n + ' posts');
    await page.click('[data-t="feed-tab"][data-v="w"]');
    ok(mode, 'the filter shows one kind', await count(page, '.feed .fp') === await count(page, '.feed .fp.wrestler') && await count(page, '.feed .fp') > 0);
    await page.click('[data-t="feed-tab"][data-v="all"]');
    if (n > 20) { await page.click('[data-t="feed-more"]'); ok(mode, 'Show older posts shows more', await count(page, '.feed .fp') > 20); }
    ok(mode, 'no real network is named', !/twitter|reddit|facebook|instagram|tiktok/i.test(await txt(page, 'main.main')));
    await over('the feed');
    await shot(page, 'net-' + mode + '-feed');
    await go(page, 'boards');
    ok(mode, 'the boards keep their threads, with votes on each post', /THE BOARDS/i.test(await txt(page, 'h1')) && await count(page, '.post') > 0 && await count(page, '.post .votes') === await count(page, '.post'));
    await over('the boards');
    await page.keyboard.press('n');
    ok(mode, 'the N key opens the dirt sheet', /DIRT SHEET/i.test(await txt(page, 'h1')));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'net-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('net: all passed');
})();
