/* The Web page: the dirt sheet, the podcast and Wrestle Search (six make-believe sites, the board among them) on one page.
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
    ok(mode, 'Net is a section in the top menu, after Roster', await page.$$eval('.menu [data-t="tab"]', L => L.map(b => b.getAttribute('data-v')).join()) === 'office,booking,roster,net,manage,company');
    ok(mode, 'every menu button is on screen', await page.evaluate(() => [...document.querySelectorAll('.menu button')].every(b => { const r = b.getBoundingClientRect(); return r.width > 20 && r.left >= 0 && r.right <= window.innerWidth + 1; })));
    await page.click('.menu [data-t="tab"][data-v="net"]');
    ok(mode, 'the section is one page, Web, with the dirt sheet, the podcast and the boards in their windows', /WEB/i.test(await txt(page, 'h1')) && await count(page, '[data-t="web-sheet"]') === 1 && await count(page, '[data-t="web-podcast"]') === 1 && await count(page, '[data-t="web-boards"]') === 1);
    ok(mode, 'before any show the sheet says so', /No shows yet this week/.test(await txt(page, 'main.main')));
    await over('the empty dirt sheet');
    await go(page, 'feed');
    ok(mode, 'there is no episode before the first week ends', /No episodes yet/.test(await txt(page, '[data-t="web-podcast"]')));
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
    ok(mode, 'This week shows the issue in progress', /so far/i.test(await txt(page, '.paper .mast')));
    await page.click('[data-t="sheet-tab"][data-v="p1"]');
    ok(mode, 'older issues can be opened', !/so far/i.test(await txt(page, '.lead')));
    await go(page, 'feed');
    const P = await state(page, S => { const I = GP.podcast(S), e = GP.podEp(S); return { show: I.show, n: I.eps.length, title: I.eps[0].title, segs: e.segs.map(x => x.n), lines: e.lines.map(x => x.t), first: e.segs.map(x => x.i), hosts: I.hosts.map(h => h.name) }; });
    ok(mode, 'the podcast window shows the newest episode, what is in it, and the ones before', P.n === 3 && (await txt(page, '.pod-new')).indexOf(P.title) >= 0 && await count(page, '.pod-segs li') === P.segs.length && await count(page, '.pod-old li') === 2, P.show + ', ' + P.title);
    ok(mode, 'no real network is named', !/twitter|reddit|facebook|instagram|tiktok/i.test(await txt(page, 'main.main')));
    await over('the podcast window');
    await page.click('.pod-new');
    await page.waitForSelector('[data-t="pod-player"]');
    const cap = () => txt(page, '[data-t="pod-caption"]');
    const c0 = await cap(); ok(mode, 'the player opens at the start, with a caption', P.lines.slice(0, 3).some(l => c0.indexOf(l) >= 0), c0);
    ok(mode, 'the player uses the whole screen', await page.$eval('.win:has(.podplayer)', e => e.getBoundingClientRect().width >= window.innerWidth * 0.9));
    ok(mode, 'the picture is on, the hosts at the desk', await count(page, '[data-t="pod-tv"] .lv-scene') === 1);
    ok(mode, 'the chapters and the whole transcript are beside it', await count(page, '[data-t="pod-chapter"]') === P.segs.length && await count(page, '[data-t="pod-line"]') === P.lines.length);
    await page.waitForFunction(t => { const e = document.querySelector('[data-t="pod-caption"]'); return e && e.textContent.indexOf(t) < 0; }, P.lines[0], { timeout: 6000 }).catch(() => null);
    ok(mode, 'it plays on by itself', (await cap()).indexOf(P.lines[0]) < 0, await cap());
    await page.click('[data-t="pod-toggle"]');
    ok(mode, 'pause stops it', /Play/.test(await txt(page, '[data-t="pod-toggle"]')));
    const k = P.segs.length - 1;
    await page.click('[data-t="pod-chapter"][data-v="' + k + '"]');
    ok(mode, 'a chapter jumps to its first line', (await cap()).indexOf(P.lines[P.first[k]]) >= 0 && (await txt(page, '[data-t="pod-pos"]')).indexOf('Line ' + (P.first[k] + 1) + ' of') >= 0, await txt(page, '[data-t="pod-pos"]'));
    await page.click('[data-t="pod-next"]');
    ok(mode, 'Line on goes to the next line', (await cap()).indexOf(P.lines[P.first[k] + 1]) >= 0);
    await page.click('[data-t="pod-line"][data-v="1"]');
    ok(mode, 'a line in the transcript can be picked', (await cap()).indexOf(P.lines[1]) >= 0 && await count(page, '.pp-tx li.now') === 1);
    ok(mode, 'the speaker is named in the caption', (await cap()).indexOf(P.hosts[0]) >= 0 || (await cap()).indexOf(P.hosts[1]) >= 0, await cap());
    await page.click('[data-t="pod-cap"]');
    ok(mode, 'captions can be turned off', await count(page, '[data-t="pod-caption"]') === 0);
    await page.click('[data-t="pod-cap"]'); await page.click('[data-t="pod-capbox"]');
    ok(mode, 'and on again, with a solid box behind them', await count(page, '.pp-cap.box') === 1);
    await page.keyboard.press('ArrowRight');
    ok(mode, 'the arrow keys move a line', (await cap()).indexOf(P.lines[2]) >= 0);
    await over('the player');
    await shot(page, 'net-' + mode + '-podcast', true);
    await page.keyboard.press('Escape');
    ok(mode, 'Esc closes the player', await count(page, '[data-t="pod-player"]') === 0);
    await go(page, 'boards');
    ok(mode, 'Wrestle Search opens on six sites, all in view with nothing to scroll', await count(page, '[data-t="ws-go"]') === 6 && await page.$eval('[data-t="web-boards"] > .bd', e => e.scrollHeight - e.clientHeight <= 1));
    for (const v of ['rumor', 'results', 'rank', 'belts', 'whisper']) { await page.click('[data-t="ws-go"][data-v="' + v + '"]'); ok(mode, 'the site ' + v + ' opens with its address', await count(page, '[data-t="ws-site"][data-v="' + v + '"]') === 1 && /http:\/\/\S+/.test(await txt(page, '[data-t="ws-url"]'))); await page.click('[data-t="ws-back"]'); }
    await page.click('[data-t="ws-go"][data-v="board"]');
    ok(mode, 'the board keeps its threads, with votes on each post', /WEB/i.test(await txt(page, 'h1')) && await count(page, '.post') > 0 && await count(page, '.post .votes') === await count(page, '.post'));
    await over('the boards');
    await page.keyboard.press('n');
    ok(mode, 'the N key opens Web', /WEB/i.test(await txt(page, 'h1')));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'net-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('net: all passed');
})();
