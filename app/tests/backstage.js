/* Backstage as the board (docs/mockups/final/final-2-backstage.png): one screen of windows at every size, with a quiet
   week and with the busiest one the test can make; the file beside the board follows the pick; the door is answered
   there; a point is spent from the file.
   Run: NODE_PATH=<dir containing playwright> node app/tests/backstage.js */
const { open, go, overflow, shot, fits, state, redraw } = require('./helper');
const SIZES = [['desk', 1280, 720, 'whw'], ['desk', 1280, 860, 'pdw'], ['desk', 1920, 1080, 'kjp'], ['tablet', 1024, 768, 'ocw'], ['tv', 1920, 1080, 'ttt']];
const fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(15), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const play = (S, n) => { const E = window.GP, ans = () => S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); });
  for (let i = 0; i < n; i++) { ans(); while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); } ans(); E.endWeek(S); } ans(); };

async function run(mode, w, h, promo) {
  const id = mode + ' ' + w + 'x' + h, { browser, page, errs } = await open({ mode, promo });
  const fit = async label => { const f = await fits(page), o = await overflow(page); ok(id, label + ' fits one screen', !f && !o, f || o); };
  try {
    await page.setViewportSize({ width: w, height: h });
    await state(page, play, 4); await go(page, 'backstage'); await page.waitForSelector('[data-t="people"]'); await page.waitForTimeout(120);
    await fit('Backstage after four weeks');
    ok(id, 'five windows: the board, things to do, your door, the room, and a file down the right', await page.evaluate(() => { const g = t => document.querySelector('.bspage > [data-t="' + t + '"]').getBoundingClientRect(), b = g('people'), a = g('bs-things'), d = g('bs-door'), r = g('bs-roomwin'), f = g('ppl-det'); return document.querySelectorAll('.bspage > .wn').length === 5 && b.bottom < a.top && a.right < d.left && d.right < r.left && r.right < f.left && f.top <= b.top + 2 && f.bottom >= r.bottom - 2; }));
    ok(id, 'no title is cut short', await page.$$eval('.bspage .wn > .ttl h2', L => L.every(e => e.scrollWidth <= e.clientWidth + 1)));
    const rows = await page.$$eval('[data-t="ppl-who"]', L => L.map(e => ({ v: e.getAttribute('data-v'), h: e.getBoundingClientRect().height, sel: e.classList.contains('sel'), face: !!e.querySelector('canvas') })));
    ok(id, 'the board: a line each, every one the same height, each with a face, one picked', rows.length >= 3 && rows.every(r => r.face && Math.abs(r.h - rows[0].h) < 1.5) && rows.filter(r => r.sel).length === 1, rows.length + ' lines');
    const worst = await state(page, S => { const N = window.GP.people(S); let bad = 0; N.rooms.forEach(r => r.people.forEach(p => { if (p.tone === 'bad') bad++; })); return bad; });
    ok(id, 'worst first: trouble is at the top', !worst || /!/.test(await txt(page, '[data-t="ppl-who"]')));
    for (const r of rows.slice(0, 4)) { await page.click('[data-t="ppl-who"][data-v="' + r.v + '"]'); await page.waitForTimeout(30); const f = await fits(page);
      ok(id, 'the file follows the pick, and fits: ' + r.v, await page.$eval('[data-t="ppl-det"] [data-t="dossier"]', e => e.getAttribute('data-id')) === r.v && !f, f); }
    /* the busiest week: more people than the board holds, long names, people at the door */
    await state(page, S => { const E = window.GP, R = E.rosterOf(S, S.player).filter(x => !x.nw); R.slice(0, 6).forEach((x, i) => { x.inj = 3; x.morale = 15 + i; x.stress = 80; }); R.slice(6, 9).forEach(x => { x.con = 2; }); S.apWho = {}; S.lcd = {}; });
    await redraw(page); await page.waitForTimeout(80);
    await fit('the busiest Backstage');
    const pg = await txt(page, '[data-t="people"] .pgr');
    ok(id, 'a board longer than its window turns pages, and never scrolls', !pg || /1 of \d/.test(pg), pg);
    if (pg) { await page.click('[data-t="bs-page"][data-v="next"]'); await fit('the second page of the board'); await page.click('[data-t="bs-page"][data-v="prev"]'); }
    for (const v of ['room', 'door', 'worst']) { await page.click('[data-t="bs-sort"][data-v="' + v + '"]'); await page.waitForTimeout(20); }
    ok(id, 'three ways to sort the board, one pressed at a time', await page.$$eval('[data-t="bs-sort"].on', L => L.length) === 1);
    await shot(page, 'backstage-' + mode + '-' + w, false);
    /* the door is answered on the page, for nothing */
    const door = await page.$('[data-t="door-do"]');
    if (door) { const ap = await state(page, S => S.ap); await door.click(); await page.waitForTimeout(80); ok(id, 'an answer at the door costs no action point and says what happened', await state(page, S => S.ap) === ap && !!(await page.$('.win')), await txt(page, '.win .wb')); await page.keyboard.press('Escape'); }
    /* a point spent from the file */
    const d = await page.$('[data-t="ppl-det"] [data-t="ppl-do"]:not([disabled])');
    if (d) { const ap = await state(page, S => S.ap); await d.click(); await page.waitForTimeout(80); ok(id, 'a point spent from the file', await state(page, S => S.ap) <= ap && !!(await page.$('.win'))); await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
    /* things to do turn pages, and each opens its pop-up */
    const n = await page.$$eval('[data-t="bs-act"]', L => L.length); await page.click('[data-t="bs-act"]'); await page.waitForSelector('.win');
    ok(id, 'things to do: a few at a time, each opens its pop-up', n >= 4 && n <= 5 && !!(await page.$('.win [data-t="bs-do"], .win [data-t="bs-court"]')));
    await page.keyboard.press('Escape');
    ok(id, 'every control on the page is a real button with a name', await page.$$eval('.bspage button, .bspage select', L => L.every(e => e.getAttribute('data-t') || e.classList.contains('lnk'))));
    ok(id, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(id, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'backstage-' + mode + '-fail', false).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const s of SIZES) await run(s[0], s[1], s[2], s[3]);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('backstage: all passed');
})();
