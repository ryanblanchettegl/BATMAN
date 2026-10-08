/* The desk in four windows: the road with its map, what needs an answer, this week's tasks and the next show.
   It fits one screen at every size, with a quiet week and with the fullest week there can be; the map is the right one
   and is drawn once; everything the old desk held is one pop-up away.
   Run: NODE_PATH=<dir containing playwright> node app/tests/desk.js */
const { open, go, overflow, shot, fits, state, redraw } = require('./helper');
const SIZES = [['desk', 1280, 720, 'nmw'], ['desk', 1280, 860, 'whw'], ['desk', 1920, 1080, 'kjp'], ['tablet', 1024, 768, 'ocw'], ['tv', 1920, 1080, 'ldd']];
const fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(15), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const playWeeks = (S, n) => { const E = window.GP, ans = () => S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); });
  for (let i = 0; i < n; i++) { ans(); while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); } ans(); E.endWeek(S); } ans(); };
/** How many dots of the map are lit in each colour, read off the canvas. */
const mapColours = page => page.$eval('[data-t="road-map"]', cv => { const x = cv.getContext('2d'), p = +cv.getAttribute('data-dot'), d = x.getImageData(0, 0, cv.width, cv.height).data, n = { now: 0, next: 0, mine: 0, land: 0 };
  for (let r = 0; r < cv.height / p; r++) for (let c = 0; c < cv.width / p; c++) { const i = ((r * p + Math.floor(p / 2)) * cv.width + c * p + Math.floor(p / 2)) * 4, k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; if (k === '255,255,85') n.now++; else if (k === '255,85,255') n.next++; else if (k === '85,255,85') n.mine++; else if (d[i + 1] > 120 && d[i] < 20) n.land++; } return n; });

async function run(mode, w, h, promo) {
  const id = mode + ' ' + w + 'x' + h, { browser, page, errs } = await open({ mode, promo });
  const fit = async label => { const f = await fits(page), o = await overflow(page); ok(id, label + ' fits one screen', !f && !o, f || o); };
  try {
    await page.setViewportSize({ width: w, height: h });
    await go(page, 'desk'); await page.waitForSelector('[data-t="road-map"]'); await page.waitForTimeout(150);
    /* week one */
    await fit('the desk in week one');
    ok(id, 'four windows: the road across the top, then the desk, the tasks and the next show', await page.evaluate(() => { const g = t => document.querySelector('.deskpage > [data-t="' + t + '"]').getBoundingClientRect(), r = g('road'), a = g('fire'), b = g('task-win'), c = g('next'); return document.querySelectorAll('.deskpage > .wn').length === 4 && r.bottom < a.top && Math.abs(a.top - b.top) < 2 && Math.abs(b.top - c.top) < 2 && a.right < b.left && b.right < c.left && r.width > a.width * 2.4; }));
    ok(id, 'no title is cut short', await page.$$eval('.deskpage .wn > .ttl h2', L => L.every(e => e.scrollWidth <= e.clientWidth + 1)));
    const R = await state(page, S => window.GP.road(S));
    ok(id, 'the map is the one the engine names, and the window says which', (await page.$eval('[data-t="road-map"]', e => e.getAttribute('data-map'))) === R.map && (await txt(page, '[data-t="road"] .ttl h2')).indexOf(R.mapName) > 0, R.mapName);
    const dot = +(await page.$eval('[data-t="road-map"]', e => e.getAttribute('data-dot'))), box = await page.$eval('[data-t="road-map"]', e => { const r = e.getBoundingClientRect(), b = e.closest('.r3').getBoundingClientRect(); return { w: r.width, h: r.height, bh: b.height, cw: e.width, ch: e.height }; });
    ok(id, 'the map is 59 by 32 square dots, each a whole number of pixels, and as tall as its window lets it be', box.cw === 59 * dot && box.ch === 32 * dot && dot >= 4 && box.h <= box.bh + 1 && box.bh - box.h < 34 + 32, dot + 'px dots, ' + Math.round(box.h) + ' of ' + Math.round(box.bh));
    const col = await mapColours(page);
    ok(id, 'this week’s land is lit yellow, the places the company tours a lighter green, the rest green', col.now > 0 && col.land > 20 && col.mine + col.next > 0, JSON.stringify(col));
    ok(id, 'the heading is this week’s city and its land', (await txt(page, '[data-t="road-city"]')).trim() === (R.now.city + ', ' + R.now.land).toUpperCase(), await txt(page, '[data-t="road-city"]'));
    ok(id, 'the building is named before the show is booked', (await txt(page, '[data-t="road-show"]')).indexOf(R.now.venue) >= 0);
    const bt = await txt(page, '[data-t="road-building"]');
    ok(id, 'it says how many tickets are sold of how many, how many this week, and the gate so far', bt.indexOf(R.now.sold.toLocaleString('en-US') + ' of ' + R.now.cap.toLocaleString('en-US')) >= 0 && bt.indexOf(R.now.wk.toLocaleString('en-US') + ' sold') >= 0 && bt.indexOf('$' + R.now.gate.toLocaleString('en-US')) >= 0, bt.replace(/\s+/g, ' '));
    ok(id, 'the line of lights says the city, the show and the tickets', /sold/i.test(await page.$eval('[data-t="road-ticker"]', e => e.getAttribute('aria-label'))) && new RegExp(R.now.city + ' · ' + R.now.show.slice(0, 8), 'i').test(await page.$eval('[data-t="road-ticker"]', e => e.getAttribute('aria-label'))), await page.$eval('[data-t="road-ticker"]', e => e.getAttribute('aria-label')));
    ok(id, 'the map says what it shows to a screen reader', new RegExp('A map of ' + R.mapName + '\\. This week: ' + R.now.city).test(await page.$eval('[data-t="road-map"]', e => e.getAttribute('aria-label'))));
    ok(id, 'the road list has this week and the stops ahead, each with its colour', (await txt(page, '[data-t="road-list"]')).indexOf(R.now.city + ', this week') >= 0 && await page.$$eval('[data-t="road-list"] .chip', L => L.length >= 3));
    /* the map is drawn once and kept */
    const d0 = await page.evaluate(() => window.EWF_DEBUG.maps()); await redraw(page); await redraw(page); await page.waitForTimeout(60);
    ok(id, 'drawing the page again does not draw the map again', await page.evaluate(() => window.EWF_DEBUG.maps()) === d0);
    /* the show goes on where the desk said */
    const told = R.now.venue; await state(page, S => { const E = window.GP, c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); });
    ok(id, 'the show runs in the building the desk named', await state(page, S => S.reports[0].venue) === told, told);
    /* some weeks in: the road so far */
    await state(page, playWeeks, 4); await redraw(page); await page.waitForTimeout(120);
    await fit('the desk in week five');
    const R2 = await state(page, S => window.GP.road(S));
    ok(id, 'the road so far is listed with a grade for each night (three nights, or two when two hometown names take a line)', (await page.$$eval('[data-t="road-list"] p', L => L.filter(e => /\b[A-F][+-]?\b/.test(e.innerText) && /sold out|\d,\d{3}|\d{3}/.test(e.innerText)).length)) === (R2.now.home.length >= 2 ? 2 : 3) && await page.evaluate(() => window.EWF_DEBUG.maps()) > d0, R2.stops.filter(s => s.k === 'past').map(s => s.city + ' ' + s.grade).join(', '));
    /* the fullest week there can be: three matters, a long one from last night, two from the hometown, a rival in town, every kind of task */
    await state(page, S => { const E = window.GP, R = E.rosterOf(S, S.player).filter(x => !x.nw), c = E.road(S).now.city, long = 'A very long matter that goes on for a good while about a promised win that is two weeks late and a locker room that is watching to see what the booker does about it before the next big event comes round.';
      R[0].town = c; R[1].town = c; R[2].inj = 3; R[3].con = 2; R[4].morale = 20; R[5].stress = 80;
      S.bar = {}; S.bar[c] = { w: S.week - 2, d: 1, by: 'A rival with a long name', r: 80 }; S.rdv = S.rdv || {}; S.rdv[c] = { w: S.week - 9, cs: 82, att: 9000, cap: 9000, so: 1 };
      for (let i = 0; i < 4; i++) S.inbox.push({ id: 90000 + i, type: 'x', text: long, choices: ['Sit down with them', 'Fine them a week', 'Let it go for now'], done: false, night: i === 0 });
      S.promos[S.player].titles.forEach(t => { t.holders = []; }); R[6].con = 1; R[7].con = 1; });
    await redraw(page); await page.waitForTimeout(120);
    await fit('the fullest desk');
    ok(id, 'with something to answer the desk window is red and counts them', await page.$eval('[data-t="fire"]', e => e.classList.contains('hot')) && /4 to answer/.test(await txt(page, '[data-t="fire"] .ttl')) && await page.$$eval('[data-t="ev-open"]', L => L.length) === 3 && /1 more/.test(await txt(page, '[data-t="fire"]')));
    ok(id, 'the hometown names, the last night here and the rival in town are all said', await page.$$eval('[data-t="road-home"] .hm', L => L.length) === 2 && /9 weeks ago, an A-, sold out/.test(await txt(page, '[data-t="road-crowd"]')) && /had a great night here 2 weeks ago/.test((await page.$eval('[data-t="road-crowd"]', e => e.textContent))));
    ok(id, 'the tasks turn pages and never scroll', await page.$$eval('.tasks .task', L => L.length) <= 4 && /1 of \d/.test(await txt(page, '[data-t="tasks-pg"]')));
    await page.click('[data-t="tasks-page"][data-v="next"]'); ok(id, 'the next page of tasks', /2 of \d/.test(await txt(page, '[data-t="tasks-pg"]'))); await fit('the second page of tasks');
    await shot(page, 'desk-' + mode + '-' + w, false);
    /* answering: the pop-up, the result, the next one */
    await page.click('[data-t="ev-open"]'); await page.waitForSelector('.win [data-t="ev"]');
    ok(id, 'Answer opens the whole matter with a button for each answer, inside the screen', await page.$$eval('.win [data-t="ev"]', L => L.length) === 3 && await page.$eval('.win', e => { const r = e.getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1; }));
    await page.waitForTimeout(80); await page.click('.win [data-t="ev"]');
    ok(id, 'the answer is taken and the next matter is offered', await state(page, S => S.inbox.filter(e => !e.done).length) === 3 && !!(await page.$('[data-t="ev-next"]')));
    await page.keyboard.press('Escape');
    /* the pop-ups off the road */
    await page.click('[data-t="road-year"]'); await page.waitForSelector('.win [data-t="road-ahead"]');
    ok(id, 'The schedule lists the stops ahead', await page.$$eval('.win [data-t="road-ahead"] tbody tr', L => L.length) >= 8 && await page.$eval('.win', e => e.getBoundingClientRect().bottom <= innerHeight + 1));
    await page.keyboard.press('Escape');
    await page.click('[data-t="road-tix"]'); await page.waitForSelector('.win');
    ok(id, 'Ticket prices opens the choice over the desk', /Ticket prices/i.test(await txt(page, '.win')) && await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk');
    await page.keyboard.press('Escape');
    /* the week in full */
    await page.click('[data-t="desk-more"]'); await page.waitForSelector('[data-t="more-tab"]');
    for (const t of ['week', 'promises', 'know', 'clocks', 'news', 'answered']) { await page.click('[data-t="more-tab"][data-v="' + t + '"]'); ok(id, 'the week in full: ' + t, (await page.$eval('[data-t="desk-more-body"]', e => e.getAttribute('data-v'))) === t && (await txt(page, '[data-t="desk-more-body"]')).length > 10 && await page.$eval('.win', e => e.getBoundingClientRect().right <= innerWidth + 1)); }
    await page.keyboard.press('Escape');
    /* every control has a name, and is a real control */
    ok(id, 'every control on the desk is a real button with a name', await page.$$eval('.deskpage button, .deskpage select, .deskpage input', L => L.every(e => e.getAttribute('data-t') || e.classList.contains('lnk'))) && await page.$$eval('.deskpage [onclick]', L => L.length === 0));
    /* a city nobody has placed */
    await state(page, S => { S.promos[S.player].cities = ['Nowhere Much']; S.inbox = S.inbox.filter(e => e.id < 90000); }); await redraw(page);
    ok(id, 'a city with no place has no map, and the desk says so', /NOWHERE MUCH/.test(await txt(page, '[data-t="road-city"]')) && /on no map yet/.test(await txt(page, '.rmap')));
    await fit('the desk with no map');
    ok(id, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(id, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'desk-' + mode + '-fail', false).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const s of SIZES) await run(s[0], s[1], s[2], s[3]);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('desk: all passed');
})();
