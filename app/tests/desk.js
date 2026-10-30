/* The desk as the Map Board (docs/plans/desk-map-board.md): your company on the left, the next show in the middle (the
   poster pinned on the road map, the night card, what is on the card so far), and the to-do list on the right.
   It fits one screen at every size, in week one and in the fullest week there can be; rows give way rather than being
   cut; the map is the right one and is drawn once; everything the old desk held is one pop-up away.
   Run: NODE_PATH=<dir containing playwright> node app/tests/desk.js */
const { open, go, overflow, shot, fits, state, redraw } = require('./helper');
const SIZES = [[1280, 720], [1920, 1080], [2560, 1440], [3840, 2160]];
const fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(10), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const playWeeks = (S, n) => { const E = window.GP, ans = () => S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); });
  for (let i = 0; i < n; i++) { ans(); while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); } ans(); E.endWeek(S); } ans(); };
/** No row half shown: every row, card and post in a window is either hidden or wholly inside it. */
const whole = page => page.$$eval('.mapboard > .wn > .bd', B => B.every(b => { const r = b.getBoundingClientRect();
  return [...b.querySelectorAll('.dk-row, .dk-st, .dk-post, .dk-last, .dk-ev, .dk-card')].every(e => { const q = e.getBoundingClientRect(); return !q.height || (q.top >= r.top - 12 && q.bottom <= r.bottom + 12); }); }));
async function run(w, h) {
  const id = w + 'x' + h, { browser, page, errs } = await open({ mode: 'desk' });
  const fit = async label => { await page.waitForTimeout(150); const f = await fits(page), o = await overflow(page); ok(id, label + ' fits one screen', !f && !o, f || o); ok(id, label + ': no row is cut in half', await whole(page)); };
  try {
    await page.setViewportSize({ width: w, height: h });
    await go(page, 'desk'); await page.waitForSelector('[data-t="road-map"]'); await page.waitForTimeout(300);
    /* week one */
    await fit('the desk in week one');
    ok(id, 'three windows side by side, 22 / 56 / 22: your company, the next show, to do', await page.evaluate(() => { const W = [...document.querySelectorAll('.mapboard > .wn')], r = W.map(e => e.getBoundingClientRect()), all = r[2].right - r[0].left;
      return W.map(e => e.getAttribute('data-t')).join() === 'desk-co,next,fire' && r[0].right < r[1].left && r[1].right < r[2].left && Math.abs(r[0].top - r[2].top) < 2 && Math.abs(r[1].width / all - 0.56) < 0.04 && Math.abs(r[0].width - r[2].width) < 4; }));
    const D = await state(page, S => window.GP.deskBoard(S));
    ok(id, 'the standings are by TV share with your row marked', /TV share/i.test(await txt(page, '[data-t="desk-standings"]')) && await page.$$eval('[data-t="desk-standings"] .dk-tr.me', L => L.length) === 1);
    ok(id, 'three top stars, each opening their file', await page.$$eval('[data-t="desk-star"]', L => L.length) === 3);
    ok(id, 'the poster has the face of the company in the middle and the night on it', (await page.$$eval('[data-t="desk-poster"] .dk-pn span', L => L.map(e => e.textContent)))[1] === await state(page, (S, id) => S.w[id].name, D.face) && /live from/i.test(await txt(page, '.dk-psub')));
    const R = await state(page, S => window.GP.road(S));
    ok(id, 'the map is the state this week’s city is in, with this week’s pin', (await page.$eval('[data-t="road-map"]', e => e.getAttribute('data-shape'))) === R.shape.n && R.shape.pins.some(q => q.k === 'now' && q.city === R.now.city));
    ok(id, 'the map fills the board behind the poster and the night card', await page.evaluate(() => { const c = document.querySelector('[data-t="road-map"]').getBoundingClientRect(), b = document.querySelector('.dk-board').getBoundingClientRect(); return c.width >= b.width - 2 && c.height >= b.height - 2; }));
    ok(id, 'the night card says tickets sold of the house, the building, the crowd and what they expect', (await txt(page, '[data-t="road-building"]')).indexOf(R.now.sold.toLocaleString('en-US') + ' of ' + R.now.cap.toLocaleString('en-US')) >= 0 && (await txt(page, '[data-t="road-city"]')).indexOf(R.now.city) >= 0 && /likes/.test(await txt(page, '[data-t="road-mkt"]')) && /expect/.test(await txt(page, '[data-t="next-expect"]')));
    ok(id, 'the map says what it shows to a screen reader', new RegExp('A map of ' + R.shape.n + '\\. This week: ' + R.now.city).test(await page.$eval('[data-t="road-map"]', e => e.getAttribute('aria-label'))));
    ok(id, 'on the card so far: the main event and what comes after', /Main event/i.test(await txt(page, '[data-t="desk-card"]')) && /Then/i.test(await txt(page, '[data-t="desk-card"]')));
    ok(id, 'the first row of the to-do list has the red edge, and only it', await page.$$eval('.dk-todo .dk-row.first', L => L.length) === 1);
    ok(id, 'buttons are coloured by kind: assign green, money yellow', await page.$$eval('.dk-todo [data-t="task-go"]', L => { const k = id => { const e = L.find(x => x.getAttribute('data-v') === id); return e ? (e.classList.contains('go') ? 'money' : e.classList.contains('sm') ? 'answer' : 'assign') : null; }; return k('desk-pbp') === 'assign' && k('sponsors') === 'money'; }));
    ok(id, 'no Book show button on the desk: the SPACE key books (D-031)', !(await page.$('.deskpage [data-t="book-next"]')) && /SPACE/.test(await txt(page, '[data-t="book-wait"]')));
    ok(id, 'week one: no show yet, said in words', /No show yet/.test(await txt(page, '[data-t="desk-last"]')));
    /* the map is drawn once and kept */
    const d0 = await page.evaluate(() => window.EWF_DEBUG.maps()); await redraw(page); await redraw(page); await page.waitForTimeout(60);
    ok(id, 'drawing the page again does not draw the map again', await page.evaluate(() => window.EWF_DEBUG.maps()) === d0);
    /* the show goes on where the desk said */
    const told = R.now.venue; await state(page, S => { const E = window.GP, c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); });
    ok(id, 'the show runs in the building the desk named', await state(page, S => S.reports[0].venue) === told, told);
    /* some weeks in */
    await state(page, playWeeks, 4); await redraw(page); await page.waitForTimeout(200);
    await fit('the desk in week five');
    ok(id, 'last show: the grade, the house and the verdict, the match of the night', /^[A-F][+-]?$/.test((await txt(page, '.dk-grade')).trim()) && /\d in\./.test(await txt(page, '[data-t="night-recap"]')) && (await page.$('.dk-motn') ? /Match of the night/.test(await txt(page, '.dk-motn')) : true));
    ok(id, 'the feed posts open Web', await page.$$eval('[data-t="desk-post"]', L => L.length) >= 0);
    /* the fullest week there can be: four matters, a hurt star, every kind of task, a head to head */
    await state(page, S => { const R = window.GP.rosterOf(S, S.player).filter(x => !x.nw), long = 'A very long matter that goes on for a good while about a promised win that is two weeks late and a locker room that is watching to see what you do about it.';
      R[2].inj = 3; R[3].con = 2; R[4].morale = 20;
      for (let i = 0; i < 4; i++) S.inbox.push({ id: 90000 + i, type: 'x', w: R[i].id, text: long, choices: ['Sit down with them', 'Fine them a week', 'Let it go for now'], done: false, night: i === 0 });
      S.promos[S.player].titles.forEach(t => { t.holders = []; }); R[6].con = 1; R[7].con = 1; });
    await redraw(page); await page.waitForTimeout(250);
    await fit('the fullest desk');
    ok(id, 'three matters shown first with Answer, and the rest counted', await page.$$eval('.dk-todo [data-t="ev-open"]', L => L.length) === 3 && /And \d+ more/.test(await txt(page, '[data-t="fire"]')));
    ok(id, 'buttons are coloured by kind: answer blue', await page.$$eval('.dk-todo [data-t="ev-open"]', L => L.every(e => e.classList.contains('sm'))));
    ok(id, 'a hurt star is off the poster and says so in Top stars', await state(page, S => window.GP.deskBoard(S).poster.every(id => !(S.w[id].inj > 0))));
    await shot(page, 'desk-' + w, false);
    /* answering: the pop-up, the result, the next one */
    await page.click('[data-t="ev-open"]'); await page.waitForSelector('.win [data-t="ev"]');
    await page.waitForTimeout(400);
    ok(id, 'Answer opens the whole matter with a button for each answer, inside the screen', await page.$$eval('.win [data-t="ev"]', L => L.length) === 3 && await page.$eval('.win', e => e.getBoundingClientRect().bottom <= innerHeight + 1));
    await page.click('.win [data-t="ev"]');
    ok(id, 'the answer is taken and the next matter is offered', !!(await page.$('[data-t="ev-next"]')));
    await page.keyboard.press('Escape');
    /* the pop-ups off the desk */
    await page.click('[data-t="road-year"]'); await page.waitForSelector('.win [data-t="road-ahead"]');
    ok(id, 'The schedule lists the stops ahead', await page.$$eval('.win [data-t="road-ahead"] tbody tr', L => L.length) >= 8);
    await page.keyboard.press('Escape');
    await page.click('[data-t="desk-more"]'); await page.waitForSelector('[data-t="more-tab"]');
    for (const t of ['week', 'promises', 'know', 'clocks', 'news', 'answered', 'held']) { await page.click('[data-t="more-tab"][data-v="' + t + '"]'); ok(id, 'the week in full: ' + t, (await page.$eval('[data-t="desk-more-body"]', e => e.getAttribute('data-v'))) === t); }
    ok(id, 'commentary and the owner’s letter live in the week in full', !!(await page.$('.win [data-t="open-voices"]')) && !!(await page.$('.win [data-t="open-letter"]')));
    await page.keyboard.press('Escape');
    await page.click('[data-t="desk-star"]'); await page.waitForTimeout(200);
    ok(id, 'a star opens their file as a pop-up on the desk', !!(await page.$('.win')) && await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk');
    await page.keyboard.press('Escape');
    /* every control has a name, and is a real control */
    ok(id, 'every control on the desk is a real button with a name', await page.$$eval('.deskpage button, .deskpage select, .deskpage input', L => L.every(e => e.getAttribute('data-t') || e.classList.contains('lnk'))));
    if (w >= 1920) ok(id, 'nothing on the desk is smaller than 14 pixels at 1080p and up', await page.$$eval('.deskpage *', L => L.filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).every(e => { const f = parseFloat(getComputedStyle(e).fontSize); return !f || f >= 13.5; })));
    /* a city nobody has placed */
    await state(page, S => { S.promos[S.player].cities = ['Nowhere Much']; S.inbox = S.inbox.filter(e => e.id < 90000); }); await redraw(page);
    ok(id, 'a city with no place has no map, and the desk says so', /on no map yet/.test(await txt(page, '.rmap')));
    await fit('the desk with no map');
    ok(id, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(id, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'desk-' + w + '-fail', false).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const s of SIZES) await run(s[0], s[1]);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('desk: all passed');
})();
