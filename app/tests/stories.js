/* Browser run of the Stories section: Storylines, History, The Net. Desk and tablet.
   Build first:  EWF_OUT=next-company EWF_DEV=1 node build.js
   Run:          NODE_PATH=/opt/npm-tools/node_modules node app/tests/stories.js */
const { open, go, overflow, shot, state, redraw, fits: fitsOne } = require('./helper');
const FILE = process.env.EWF_OUT || 'index';
const PAGES = ['storylines', 'history', 'boards'];
const fails = [];
function check(mode, label, ok, detail) { console.log(mode.padEnd(6), ok ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!ok) fails.push(mode + ' ' + label); }
async function fits(page, mode, label) { const o = await overflow(page); check(mode, label + ' fits the screen', o === '', o); }
/** Achievement pop-ups sit over the top right corner for six seconds; wait them out before a screenshot. */
async function calm(page) { await page.waitForFunction(() => { const S = window.EWF_DEBUG.state(); return !document.querySelector('[data-t="toast"]') && !(S && S.toasts.length); }, null, { timeout: 20000 }); }
/** Play `n` weeks through the engine: answer the inbox with the first choice, run the suggested cards, close the week. */
async function advance(page, n) {
  await state(page, (S, n) => { for (let w = 0; w < n && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const card = GP.suggest(S); const pr = GP.preShow(S, card); if (pr) GP.resolvePre(S, card, 0); const ch = GP.chaos(S, card); if (ch) GP.resolveChaos(S, card, 0); GP.runPlayerShow(S, card); } GP.endWeek(S); } }, n);
  await redraw(page); await calm(page);
}
const count = (page, sel) => page.$$eval(sel, L => L.length);
/** The game takes its seed from the clock. Swap in the same promotion from a fixed seed so every run of this file plays out the same way.
    Set EWF_SEED to try another one. */
const SEED = +process.env.EWF_SEED || 9000;
async function reseed(page, promo, seed) {
  await state(page, (S, a) => {
    const fed = a.promo === 'OWN' ? { name: '', short: '', show: '', title: '', size: 'regional', region: 'midwest', style: 'merit', roots: 'tradition', pledge: 'chance', women: true } : null;
    const N = GP.newGame(fed ? null : a.promo, a.seed, { name: 'Ryan', diff: 'normal', fed });
    Object.keys(S).forEach(k => { delete S[k]; }); Object.assign(S, N); GP.attach(S);
  }, { promo, seed });
  await redraw(page);
}
/** Open the game on a promotion with a fixed seed. */
async function start(mode, promo, n) { const o = await open({ mode, file: FILE, promo }); await reseed(o.page, promo, SEED + n); return o; }

const text = page => page.$eval('main', e => e.innerText.replace(/\s+/g, ' '));
/** How many list rows the panel with this title holds, or -1 when the panel is not on the page. */
const rows = (page, title) => page.evaluate(t => { const p = [...document.querySelectorAll('.panel')].find(x => x.querySelector('h2') && x.querySelector('h2').innerText.trim().toUpperCase() === t.toUpperCase()); return p ? p.querySelectorAll('li').length : -1; }, title);
/** The text of the panel with this title, or null. */
const panel = (page, title) => page.evaluate(t => { const p = [...document.querySelectorAll('.panel')].find(x => x.querySelector('h2') && x.querySelector('h2').innerText.trim().toUpperCase() === t.toUpperCase()); return p ? p.innerText.replace(/\s+/g, ' ') : null; }, title);
async function tour(page, mode, label) { for (const p of PAGES) { await go(page, p); await page.waitForSelector('h1'); await fits(page, mode, label + ' ' + p); } }

/* what each page shows must be what the engine holds */
async function storylines(page, mode) {
  await go(page, 'storylines');
  for (let i = 0; i < 4 && await page.$('.win, .caw'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); }
  const want = await state(page, S => { const P = S.promos[S.player], se = GP.season(S), live = se.stories, hot = live.slice().sort((a, b) => b.heat - a.heat)[0];
    return { live: live.length, top: hot ? hot.label : '', says: se.says.length, done: S.feuds.filter(f => f.res && f.promo === P.id).slice(-12).length, streaks: GP.rosterOf(S, P.id).filter(w => w.ws >= 4).length, stables: (S.stables || []).filter(s => s.promo === S.player).length, teams: S.teams.filter(t => t.promo === P.id).length }; });
  await page.evaluate(() => { window.EWF_FLAT = 1; window.EWF_DEBUG.render(); });
  check(mode, 'every live story has a line on the season', want.live > 0 && await count(page, '[data-t="season-row"]') === want.live && await count(page, '.sn .c') >= want.live * 12, want.live + ' stories');
  check(mode, 'what the calendar says is every line the engine has', await count(page, '[data-t="says"]') === want.says, want.says + ' lines');
  await page.evaluate(() => { window.EWF_FLAT = 0; window.EWF_DEBUG.render(); });
  const title = () => page.$eval('[data-t="story-pane"] h2', e => e.innerText);
  const labels = await state(page, S => GP.season(S).stories.map(x => ({ id: x.id, label: x.label })));
  check(mode, 'a story is picked, with its track and its night', labels.map(x => x.label).includes(await title()) && await count(page, '[data-t="story-track"] .on') === 1 && (await page.$eval('[data-t="feud-end"]', e => e.innerText)).length > 5, await title());
  if (want.live > 1) { const v = await page.$eval('[data-t="season-row"]:not(.sel)', e => +e.getAttribute('data-v')); await page.click('[data-t="season-row"][data-v="' + v + '"]'); await page.waitForTimeout(100);
    check(mode, 'picking another line shows that story', (await title()) === labels.find(x => x.id === v).label && !!(await page.$('[data-t="season-row"][data-v="' + v + '"].sel'))); }
  const pop = async (v, n, extra) => { await page.click('[data-t="st-more"][data-v="' + v + '"]'); await page.waitForSelector('.win'); const t = await page.$eval('.win', e => e.innerText); const li = await page.$$eval('.win li', L => L.length);
    await page.keyboard.press('Escape'); await page.waitForTimeout(80); return n ? li === n && (!extra || extra.test(t)) : (extra ? extra.test(t) : li === 0); };
  check(mode, 'finished stories open in a pop-up', await pop('finished', want.done, null), want.done + ' finished');
  check(mode, 'stables open in a pop-up', await pop('stables', 0, want.stables ? /unity/i : /No stables/), want.stables + ' stables');
  check(mode, 'tag teams open in a pop-up', await pop('teams', want.teams, want.teams ? null : /No regular teams/), want.teams + ' teams');
  check(mode, 'winning streaks open in a pop-up', await pop('streaks', want.streaks, want.streaks ? null : /Nobody has won four in a row/), want.streaks + ' streaks');
  const f = await fitsOne(page); check(mode, 'storylines with stories fits one screen', f === '', f);
  // the long plan: two picks and a button pencil in the flagship main event
  const ids = await state(page, S => { const P = S.promos[S.player]; return S.w.filter(w => w.promo === P.id && !w.nw && w.inj <= 0).sort((x, y) => y.ovr - x.ovr).slice(0, 2).map(w => w.id); });
  for (let i = 0; i < 4 && await page.$('.win, .caw'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); }
  await page.click('[data-t="plot-open"][data-v="plan"]');
  check(mode, 'the long plan is a button that opens a pop-up', (await panel(page, 'The long plan')) !== null && !!(await page.$('.win [data-t="lp-a"]')));
  await page.selectOption('[data-t="lp-a"]', String(ids[0])); await page.selectOption('[data-t="lp-b"]', String(ids[1]));
  await page.click('[data-t="lp-set"]'); await page.waitForTimeout(150);
  const lp = await state(page, S => S.lp ? { a: S.lp.a, b: S.lp.b } : null);
  check(mode, 'pencilling it in stores the plan', !!lp && lp.a === ids[0] && lp.b === ids[1], JSON.stringify(lp));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  for (let i = 0; i < 3 && await page.$('.win'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
  await page.click('[data-t="plot-open"][data-v="plan"]');
  check(mode, 'the panel shows the plan and a scrap button', /Build so far/.test(await panel(page, 'The long plan')) && !!(await page.$('[data-t="lp-drop"]')));
  await page.click('[data-t="lp-drop"]'); await page.waitForTimeout(150); await page.keyboard.press('Escape');
  check(mode, 'a result goes back to the pop-up it came from', !!(await page.$('.win [data-t="lp-a"]')));
  for (let i = 0; i < 4 && await page.$('.win'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); }
  check(mode, 'scrapping it clears the plan', (await state(page, S => S.lp)) == null);
}
async function history(page, mode) {
  await go(page, 'history');
  const want = await state(page, S => { const P = S.promos[S.player], R = S.rec || {}; return { titles: P.titles.map(t => t.name), champ: (P.titles.find(t => t.holders.length) || { holders: [] }).holders.map(id => S.w[id].name).join(' & '), matches: Math.min(10, (R.matches || []).length), shows: (R.shows || []).length, best: R.matches && R.matches[0] ? R.matches[0].l : '', awards: (S.awards || []).length, hof: (S.hof || []).map(x => x.n), chron: (S.chron || []).map(c => c.title) }; });
  const rec = await panel(page, 'Record book');
  check(mode, 'record book has the best matches and shows', want.matches > 0 && !!rec && rec.indexOf(want.best) >= 0 && /Best shows/i.test(rec) && /Biggest crowd/.test(rec), want.matches + ' matches, ' + want.shows + ' shows');
  check(mode, 'a panel for every title', (await Promise.all(want.titles.map(t => panel(page, t)))).every(Boolean), want.titles.length + ' titles');
  check(mode, 'the reigning champion is named in gold', !want.champ || (await page.$$eval('.panel b.gold', L => L.map(e => e.innerText))).indexOf(want.champ) >= 0, want.champ);
  const aw = await panel(page, 'Year-end awards'), hf = await panel(page, 'Hall of fame'), ch = await panel(page, 'Season chronicles');
  check(mode, 'awards', want.awards ? /\d{4}/.test(aw) && !/handed out in the last week/.test(aw) : /handed out in the last week of December/.test(aw), want.awards + ' years');
  check(mode, 'hall of fame', want.hof.length ? want.hof.every(n => hf.indexOf(n) >= 0) && /Class of \d{4}/.test(hf) : /Nobody inducted yet/.test(hf), want.hof.join(', ') || 'empty');
  check(mode, 'season chronicles', want.chron.length ? want.chron.every(t => ch.toLowerCase().indexOf(t.toLowerCase()) >= 0) && /Season \d+:/i.test(ch) : /first chronicle is written/.test(ch), want.chron.join(', ') || 'not yet');
  await fits(page, mode, 'history');
}
async function net(page, mode) {
  await go(page, 'boards');
  const want = await state(page, S => ({ threads: S.net.threads.length, posts: S.net.threads.reduce((a, t) => a + t.posts.length, 0), mood: Math.round(S.net.mood), sub: S.net.threads[0] ? S.net.threads[0].sub : '', user: S.net.threads[0] ? S.net.threads[0].posts[0].u : '' }));
  check(mode, 'every thread and post is on the board', want.threads > 0 && await count(page, '.post') === want.posts && await count(page, '.panel') === want.threads + 1, want.threads + ' threads, ' + want.posts + ' posts');
  check(mode, 'posts show who wrote them', await page.$eval('.post .u', e => e.innerText) === '<' + want.user + '>');
  check(mode, 'mood of the board', new RegExp('Mood of the board .* ' + want.mood + ' ').test(await text(page)), 'mood ' + want.mood);
  check(mode, 'newsgroup name', /^alt\.wrestling\.[a-z0-9]+$/i.test(await page.$eval('.eyebrow', e => e.innerText)), await page.$eval('.eyebrow', e => e.innerText));
  await fits(page, mode, 'the net with threads');
}

(async () => {
  for (const mode of ['desk', 'tablet']) {
    const { browser, page, errs } = await start(mode, 'pdw', mode === 'desk' ? 0 : 1);
    await tour(page, mode, 'week 1');
    await go(page, 'storylines');
    check(mode, 'storylines page before any show', await count(page, '[data-t="storylines"] .wn') === 5 && !!(await page.$('[data-t="season"]')));
    check(mode, 'Storylines is a tab in the Office, and booking power can be spent there four ways', (await page.$$eval('[data-t="page"]', L => L.map(e => e.innerText.trim()).join('|'))) === 'The desk|Backstage|Storylines|Career' && await count(page, '[data-t="plot-open"]') === 5 && /booking power/i.test(await page.$eval('[data-t="plot"]', e => e.closest('.wn').innerText)));
    await state(page, S => { S.bp = 5; }); await page.evaluate(() => window.EWF_DEBUG.render());
    await page.click('[data-t="plot-open"][data-v="tape"]');
    if (await count(page, '[data-t="plot-a"] option') > 2) { await page.selectOption('[data-t="plot-a"]', { index: 2 }); await page.selectOption('[data-t="plot-at"]', 'end'); await page.click('[data-t="plot-do"][data-v="tape"]'); await page.click('#modal-ok');
      check(mode, 'a pre-tape bought here costs one booking power and is on the next show’s run sheet', await state(page, S => S.bp) === 4 && await state(page, S => (S.segs || []).some(x => x.tape && x.at === 'end')) && await count(page, '[data-t="plot-taped"]') === 1); } else await page.keyboard.press('Escape');
    // start a story: two people, a length, and booking power
    for (let i = 0; i < 4 && await count(page, '.win'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
    await state(page, S => { S.bp = 5; }); await page.evaluate(() => window.EWF_DEBUG.render());
    const pair = await state(page, S => { const R = GP.storyPeople(S).filter(w => w.g === 'M' && !w.n && !w.hurt); return [R[3].id, R[8].id]; });
    const feuds0 = await state(page, S => GP.activeFeuds(S).length);
    await page.click('[data-t="plot-open"][data-v="story"]'); await page.waitForSelector('[data-t="story-a"]');
    check(mode, 'Start a feud shows the three lengths before anybody is picked', await count(page, '[data-t="story-len"]') === 3 && await page.$eval('[data-t="story-start"]', e => e.disabled));
    await page.selectOption('[data-t="story-a"]', String(pair[0])); await page.selectOption('[data-t="story-b"]', String(pair[1]));
    await page.click('[data-t="story-len"][data-v="l"]');
    const ends = await page.$$eval('[data-t="story-ends"]', L => L.map(e => e.innerText));
    check(mode, 'with two picked, each length names the night it ends', ends.length === 3 && ends.every(t => t && !/pick two/.test(t)) && /3 chapters/.test(ends[2]), ends.join(' | '));
    await page.click('[data-t="story-start"]'); await page.waitForTimeout(200);
    const made = await state(page, (S, p) => { const f = GP.feudOf(S, p[0], p[1]); return { bp: S.bp, len: f && f.len, ch: f && f.ch && f.ch.length, n: GP.activeFeuds(S).length }; }, pair);
    check(mode, 'a long story costs three booking power and has three chapters', made.bp === 2 && made.len === 'l' && made.ch === 3 && made.n === feuds0 + 1, JSON.stringify(made));
    await page.click('#modal-ok').catch(() => {}); await page.waitForTimeout(150);
    check(mode, 'the new story is picked, and its pane says the length and where chapter 1 ends', /Long feud/i.test(await page.$eval('[data-t="story-pane"]', e => e.innerText)) && /Chapter 1 ends/i.test(await page.$eval('[data-t="story-pane"]', e => e.innerText)));
    await go(page, 'history');
    check(mode, 'history before any show', /Run a show on Booking and the book opens/.test(await text(page)) && /Champion when you arrived/.test(await text(page)));
    await go(page, 'boards');
    check(mode, 'the net before any show', await count(page, '.post') === await state(page, S => S.net.threads.reduce((a, t) => a + t.posts.length, 0)) && (await count(page, '.post') > 0 || /Nobody has posted yet/.test(await text(page))));

    await advance(page, 8);
    check(mode, 'eight weeks played', await state(page, S => S.week) === 9 && !(await state(page, S => S.over)));
    await tour(page, mode, 'week 9');
    await storylines(page, mode); await history(page, mode); await net(page, mode);
    await calm(page);
    for (const p of PAGES) { await go(page, p); await shot(page, 'stories-' + mode + '-' + p, true); }

    // a full season: awards, a hall of fame class and the first chronicle
    await advance(page, 42);
    if (!(await state(page, S => S.over))) {
      check(mode, 'a season played', await state(page, S => S.week) === 51 && await state(page, S => (S.chron || []).length) >= 1 && await state(page, S => (S.awards || []).length) >= 1);
      await tour(page, mode, 'week 51');
      await storylines(page, mode); await history(page, mode); await net(page, mode);
      await calm(page); await go(page, 'history'); await shot(page, 'stories-' + mode + '-history-season', true);
    } else console.log(mode.padEnd(6), 'skip week 51: the game ended');
    check(mode, 'no errors', errs.length === 0, errs.join(' | '));
    await browser.close();

    // your own federation: every title vacant, nothing settled yet
    const own = await start(mode, 'OWN', 20);
    await tour(own.page, mode, 'own federation');
    await go(own.page, 'history');
    check(mode, 'vacant titles say so', /Nobody has held it yet/.test(await text(own.page)));
    await go(own.page, 'storylines');
    check(mode, 'no feuds yet', /No feuds running/.test(await text(own.page)) && await count(own.page, '[data-t="season-row"]') === 0);
    check(mode, 'no errors (own federation)', own.errs.length === 0, own.errs.join(' | '));
    await own.browser.close();
  }
  console.log(fails.length ? 'FAILED: ' + fails.length + '\n  ' + fails.join('\n  ') : 'stories: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
