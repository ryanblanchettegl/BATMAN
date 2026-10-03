/* Browser run of the Roster section: Roster, Locker room, Titles, Market, the scouting window and the creator.
   Build:  EWF_OUT=next-roster EWF_DEV=1 node build.js
   Run:    NODE_PATH=/opt/npm-tools/node_modules node app/tests/roster.js */
const { open, go, overflow, shot, flash, state } = require('./helper');
const FILE = process.env.EWF_OUT || 'index';

function must(ok, what) { if (!ok) throw new Error(what); }
/** After each step: nothing sticks out sideways and the page threw no errors. */
async function ok(t, name, note) {
  const o = await overflow(t.page);
  must(o === '', t.mode + ' ' + name + ': ' + o);
  must(!t.errs.length, t.mode + ' ' + name + ': ' + t.errs.join(' | '));
  console.log(t.mode, 'ok', name + (note ? ' (' + note + ')' : ''));
}
const view = page => page.evaluate(() => window.EWF_DEBUG.ui.slices.roster);
const rowNames = page => page.$$eval('tr.pick .nm', L => L.map(e => e.textContent));
/** How many different colours a canvas holds. A canvas nobody drew on has one. */
const ink = (page, sel) => page.$eval(sel, c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set(); for (let i = 0; i < d.length; i += 4) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ',' + d[i + 3]); return seen.size; });
const sum = (page, sel) => page.$eval(sel, c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i++) s = (s * 31 + d[i]) >>> 0; return s; });
/** True once the canvas no longer looks the way it did. Portraits repaint just after the page redraws. */
const repainted = async (page, sel, before) => { for (let i = 0; i < 40; i++) { if (await sum(page, sel) !== before) return true; await page.waitForTimeout(50); } return false; };
const drawn = async (page, sel) => { for (let i = 0; i < 40; i++) { if (await ink(page, sel) > 3) return true; await page.waitForTimeout(50); } return false; };
const profTab = async (page, v) => { await page.click('.prof [data-t="ptab"][data-v="' + v + '"]'); must(await page.$eval('.prof [data-t="ptab"][data-v="' + v + '"]', e => e.getAttribute('aria-pressed')) === 'true', 'profile page ' + v + ' not pressed'); };
const openProfile = async (page, id) => { if (await page.$('.prof [data-t="sel"][data-id="' + id + '"]')) return; await page.click('tr.pick[data-id="' + id + '"]'); await page.waitForSelector('.prof [data-t="sel"][data-id="' + id + '"]'); };

async function run(mode) {
  const t = await open({ mode, file: FILE }), { page } = t;
  const me = await state(page, S => ({ id: S.player, n: S.w.filter(w => w.promo === S.player && !w.rt).length, week: S.week }));

  /* ----- roster: sort and filter ----- */
  await go(page, 'roster'); await page.waitForSelector('tr.pick');
  let names = await rowNames(page); must(names.length === me.n, 'roster shows ' + names.length + ' of ' + me.n);
  await ok(t, 'roster table', names.length + ' rows');
  await page.click('[data-t="sort"][data-v="name"]'); names = await rowNames(page);
  must(names.join('|') === names.slice().sort().join('|'), 'name sort is not ascending');
  await page.click('[data-t="sort"][data-v="name"]'); names = await rowNames(page);
  must(names.join('|') === names.slice().sort().reverse().join('|'), 'name sort did not flip');
  await page.click('[data-t="sort"][data-v="age"]');
  const ages = await page.$$eval('tr.pick', L => L.map(r => +r.querySelector('td.r').textContent));
  must(ages.every((a, i) => !i || ages[i - 1] >= a), 'age sort is not oldest first: ' + ages.slice(0, 6));
  must(await page.$eval('th[aria-sort] button', e => e.dataset.v) === 'age', 'aria-sort is not on the age column');
  await ok(t, 'sort', 'name up, name down, age');
  const women = await state(page, S => S.w.filter(w => w.promo === S.player && !w.rt && w.g === 'F').length);
  await page.selectOption('#rf-g', 'F'); must((await rowNames(page)).length === women, 'division filter shows the wrong count');
  await page.selectOption('#rf-g', 'all'); await page.selectOption('#rf-al', 'H');
  must((await page.$$eval('tr.pick .tag.face', L => L.length)) === 0, 'alignment filter let a face through');
  await page.selectOption('#rf-al', 'all');
  const some = (await rowNames(page))[3];
  await page.fill('#rq', some.slice(0, 5).toLowerCase()); names = await rowNames(page);
  must(names.length >= 1 && names.every(n => n.toLowerCase().indexOf(some.slice(0, 5).toLowerCase()) >= 0), 'search did not narrow the table');
  must(await page.evaluate(() => document.activeElement.id) === 'rq', 'typing lost the search box');
  await page.fill('#rq', 'zzzz'); must(/Nobody matches/.test(await page.$eval('tbody', e => e.innerText)), 'no empty-table message');
  await page.fill('#rq', '');
  await ok(t, 'filter', 'division, alignment, search');
  await page.click('[data-t="sort"][data-v="ovr"]');

  /* ----- profile: four pages ----- */
  const first = await page.$eval('tr.pick', e => ({ id: +e.dataset.id, name: e.querySelector('.nm').textContent }));
  await openProfile(page, first.id);
  must(await page.$eval('.prof h2', e => e.textContent) === first.name, 'profile shows the wrong name');
  must(await drawn(page, '.prof canvas.pt'), 'profile portrait is blank');
  must(await page.$$eval('.prof .kv > div', L => L.length) === 10, 'overview does not show ten stats');
  await ok(t, 'profile overview', first.name);
  if (mode === 'desk' || mode === 'phone') await shot(page, 'roster-profile-' + mode, mode === 'phone');
  await profTab(page, 'deal'); must(/a week, \d+ weeks left/.test(await page.$eval('.prof', e => e.innerText)), 'contract page has no terms'); await ok(t, 'profile contract');
  await profTab(page, 'room'); must(await page.$('.prof .ego') && await page.$('.prof pre.body'), 'locker page lacks the ego grid or body figure'); await ok(t, 'profile locker room');
  await profTab(page, 'scout'); must(await page.$$eval('.prof .scout > div', L => L.length) >= 3, 'scouting page has no ranges'); await ok(t, 'profile scouting and career');
  const second = await page.$eval('tr.pick:not(.on)', e => +e.dataset.id);
  await openProfile(page, second);
  must(await page.$('.prof .scout'), 'the profile page did not persist between wrestlers');
  await ok(t, 'profile page persists');

  /* ----- contract moves: renew, release and keep ----- */
  await profTab(page, 'deal');
  await page.click('.prof [data-t="renew"][data-w="48"]'); must(/re-signs/.test(await flash(page)), 'renew said: ' + await flash(page));
  await page.click('.prof [data-t="release"]'); must(await page.$('.prof [data-t="release-yes"]'), 'no release confirmation');
  await ok(t, 'release asks first');
  await page.click('.prof [data-t="cancel"]'); must(!await page.$('.prof [data-t="release-yes"]') && await state(page, (S, id) => S.w[id].promo === S.player, second), 'Keep did not keep them');
  await page.selectOption('#repack-' + second, { index: 1 }); must(await page.$('.prof [data-t="repack"]') && /an attempt with a \d+% chance/.test(await page.$eval('.prof', e => e.innerText)), 'repackage odds missing');
  await page.selectOption('#repack-' + second, ''); await ok(t, 'renew, release and keep, repackage odds');

  /* ----- rest and undo ----- */
  const fit = await state(page, S => S.w.filter(w => w.promo === S.player && !w.rt && !(w.inj > 0)).sort((a, b) => b.ovr - a.ovr)[2].id);
  await openProfile(page, fit); await profTab(page, 'room');
  await page.click('.prof [data-t="rest"]');
  must(/gets the week off/.test(await flash(page)) && await state(page, (S, id) => S.w[id].rest === S.week, fit), 'rest did not take');
  must(await page.$eval('.prof [data-t="rest"]', e => e.getAttribute('aria-pressed')) === 'true', 'rest button is not pressed');
  await ok(t, 'rest');
  await page.click('.prof [data-t="rest"]');
  must(/back on the card/.test(await flash(page)) && await state(page, (S, id) => !S.w[id].rest, fit), 'rest was not undone');
  await ok(t, 'rest undone');

  /* ----- mentor ----- */
  const pupil = await state(page, S => { for (const w of S.w) if (w.promo === S.player && !w.rt) { const m = window.GP.mentorsFor(S, w.id); if (m.length) return { id: w.id, m: m[0].id }; } return null; });
  if (pupil) {
    await openProfile(page, pupil.id); await profTab(page, 'room');
    await page.selectOption('#ment-' + pupil.id, String(pupil.m));
    must(/under their wing/.test(await flash(page)) && await state(page, (S, p) => S.w[p.id].ment === p.m, pupil), 'mentor was not set');
    await ok(t, 'mentor set');
  } else console.log(mode, 'skip mentor: nobody on this roster is offered one');

  /* ----- training camp ----- */
  const camp = await state(page, S => window.GP.campInfo(S).cap);
  if (camp) {
    const green = await state(page, S => { const P = S.promos[S.player]; return S.w.filter(w => w.promo === S.player && !w.rt && !w.nw && !P.titles.some(x => x.holders.indexOf(w.id) >= 0)).sort((a, b) => a.ovr - b.ovr)[0].id; });
    await openProfile(page, green); await profTab(page, 'deal');
    await page.click('.prof [data-t="camp"][data-k="mic"]');
    must(/is in camp, working on promos/.test(await flash(page)) && await state(page, (S, id) => S.w[id].camp === true && S.w[id].focus === 'mic', green), 'camp said: ' + await flash(page));
    must(await page.$('tr.pick.on .tag.warn') && await page.$eval('.prof [data-t="camp"][data-k="mic"]', e => e.getAttribute('aria-pressed')) === 'true', 'no Camp tag in the table, or the focus is not pressed');
    await ok(t, 'sent to camp', camp + ' places');
    await page.click('.prof [data-t="callup"]'); must(await state(page, (S, id) => !S.w[id].camp, green), 'call up did not work');
    await ok(t, 'called up');
  } else console.log(mode, 'skip camp: the company has no training camp in week ' + me.week);

  /* ----- Esc closes the profile ----- */
  await page.keyboard.press('Escape'); must(!await page.$('.prof'), 'Esc did not close the profile'); await ok(t, 'Esc closes the profile');

  /* ----- market: scouting window ----- */
  await go(page, 'market'); await page.waitForSelector('#mq');
  const mk = await state(page, S => { const E = window.GP, P = S.promos[S.player], room = E.budget(S) - S.w.filter(w => w.promo === S.player && !w.rt).reduce((a, w) => a + w.wage, 0);
    const L = E.market(S).sort((a, b) => b.ovr - a.ovr).slice(0, 120).filter(w => E.canSign(S, w) && !(w.lock > S.week) && !w.sc).map(w => ({ id: w.id, name: w.name, ask: E.ask(S, w), fa: w.promo === 'FA' }));
    const cheap = L.filter(w => w.fa).sort((a, b) => a.ask - b.ask)[0]; return { n: E.market(S).length, room, scout: L[0], buy: cheap, cash: P.cash }; });
  must(mk.scout && mk.buy, 'nobody on the market to talk to');
  await ok(t, 'market', mk.n + ' in the market');
  await page.click('[data-t="offer"][data-id="' + mk.scout.id + '"]'); await page.waitForSelector('#offer-wage');
  must(await page.$eval('#offer-wage', e => +e.value) === mk.scout.ask, 'offer does not start at the asking wage');
  await ok(t, 'offer row');
  await page.click('[data-t="scout"][data-id="' + mk.scout.id + '"]'); await page.waitForSelector('.win');
  must(await page.$eval('.win .wt span', e => e.textContent) === 'Scouting report: ' + mk.scout.name, 'wrong scouting window');
  must(/The report on/.test(await page.$eval('.win .wb', e => e.innerText)) && await page.$$eval('.win .scout > div', L => L.length) >= 3 && await drawn(page, '.win canvas.pt'), 'scouting window is incomplete');
  must(await state(page, (S, id) => S.w[id].sc === S.week, mk.scout.id), 'the scout was not sent');
  await ok(t, 'scouting window', mk.scout.name);
  await page.click('#modal-ok'); must(!await page.$('.win') && !await page.$('[data-t="scout"]'), 'window did not close, or Scout first is still offered');
  await page.click('[data-t="offer"][data-id="' + mk.scout.id + '"]'); must(!await page.$('#offer-wage'), 'Cancel left the offer row open');

  /* ----- locker room ----- */
  await go(page, 'locker'); await page.waitForSelector('.piebox');
  must(await page.$$eval('.panel > h2', L => L.map(e => e.textContent).join('|')) === 'Mood of the room|Who is who|Cliques|The camp show|Under strain|The trainer’s room', 'locker room panels are wrong');
  await ok(t, 'locker room');
  if (mode === 'desk' || mode === 'phone') await shot(page, 'roster-locker-' + mode, true);
  let who = await page.$('.cols [data-t="sel"]');
  if (!who) { console.log(mode, 'nobody is named in the locker room yet: the test puts one wrestler under strain'); await state(page, (S, id) => { S.w[id].stress = 80; }, fit); await go(page, 'locker'); who = await page.$('.cols [data-t="sel"]'); }
  const whoId = await who.evaluate(e => +e.dataset.id), whoName = await who.evaluate(e => e.textContent);
  await who.click(); await page.waitForSelector('.prof');
  must(await page.$eval('.prof h2', e => e.textContent) === whoName && await view(page).then(v => v.sel) === whoId, 'the name did not open that profile');
  await ok(t, 'locker room name opens the profile', whoName);
  await page.click('.prof [data-t="sel"]'); must(!await page.$('.prof'), 'Close did not close the profile');

  /* ----- titles and a tournament ----- */
  await go(page, 'titles'); await page.waitForSelector('.rank, .empty');
  must(await page.$$eval('.tw tbody tr', L => L.length) === await state(page, S => S.promos[S.player].titles.length), 'titles table is short');
  await ok(t, 'titles');
  const tb = await page.$('[data-t="tourn"]:not([disabled])');
  if (tb) {
    const fmt = await tb.evaluate(e => e.dataset.v); await tb.click();
    must(/is set/.test(await flash(page)) && await state(page, S => !!S.tourn && !S.tourn.done), 'tournament said: ' + await flash(page));
    must(await page.$eval('.panel.mb3 > h2', e => e.textContent) === await state(page, S => S.tourn.name), 'no tournament panel');
    must(await page.$$eval('[data-t="tourn"]:not([disabled])', L => L.length) === 0, 'a second tournament is still on offer');
    if (fmt === 'ko') must(await page.$eval('.bracket', e => e.innerText.split('\n').length >= 15 && /[├┐┘]/.test(e.innerText)).catch(() => false), 'the knockout has no bracket drawn');
    await ok(t, 'tournament started', fmt === 'ko' ? 'knockout' : 'league');
  } else console.log(mode, 'skip tournament: none is offered');

  /* ----- create a wrestler, end to end ----- */
  await go(page, 'market'); await page.click('[data-t="cw-open"]'); await page.waitForSelector('.caw-win');
  must(await drawn(page, '#portraitCanvas'), 'creator preview is blank');
  await ok(t, 'creator open');
  // the starting face is random, so pick styles it does not already have
  const face0 = (await view(page)).cw.face, hr = (face0.hr + 3) % 10, ms = (face0.ms + 3) % 10;
  let before = await sum(page, '#portraitCanvas');
  await page.click('[data-t="caw-part"][data-v="hr"]'); await page.click('[data-t="caw-pick"][data-v="' + hr + '"]');
  must(new RegExp('^Hair ' + (hr + 1) + ': ').test(await page.$eval('.caw-split [role="status"]', e => e.textContent)) && await repainted(page, '#portraitCanvas', before), 'picking a hair style did not preview it');
  must((await view(page)).cw.face.hr === face0.hr, 'a style was applied before Apply was pressed');
  await page.click('[data-t="caw-apply"]'); must((await view(page)).cw.face.hr === hr && await page.$eval('[data-t="caw-apply"]', e => e.disabled), 'hair was not applied');
  await page.click('[data-t="caw-part"][data-v="ms"]'); await page.click('[data-t="caw-pick"][data-v="' + ms + '"]'); await page.click('[data-t="caw-apply"]');
  must((await view(page)).cw.face.ms === ms, 'mustache was not applied');
  await ok(t, 'creator hair and mustache', 'hair ' + (hr + 1) + ', mustache ' + (ms + 1));
  await page.click('[data-t="caw-step"][data-v="1"]'); must((await view(page)).caw.pick === (ms + 1) % 10, 'the scroll arrow did not step the style');
  if (mode === 'desk') { await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); must((await view(page)).caw.pick === (ms + 2) % 10, 'Left and Right did not step the style'); }
  await page.click('[data-t="caw-part"][data-v="ms"]'); must((await view(page)).caw.pick === null && (await view(page)).cw.face.ms === ms, 'an unapplied style stuck');
  before = await sum(page, '#portraitCanvas');
  const skin = await page.$eval('[data-t="cawsl"][data-k="sk"]', e => { e.value = String(+e.value > 50 ? 12 : 88); e.dispatchEvent(new Event('input', { bubbles: true })); return +e.value; });
  must((await view(page)).cw.face.sk === skin && await repainted(page, '#portraitCanvas', before), 'the skin slider did not repaint the face');
  await ok(t, 'creator slider', 'skin ' + skin);
  if (mode === 'desk' || mode === 'phone') await shot(page, 'roster-creator-' + mode, mode === 'phone');
  await page.click('[data-t="caw-cat"][data-v="body"]'); await page.selectOption('#cw-bg', 'rookie'); await ok(t, 'creator body');
  await page.click('[data-t="caw-cat"][data-v="skills"]'); must(/Potential/.test(await page.$eval('.caw-fields', e => e.innerText)), 'no skills preview'); await ok(t, 'creator skills');
  await page.click('[data-t="caw-cat"][data-v="gear"]');
  await page.click('[data-t="cw-make"]'); must(/name/.test(await page.$eval('.caw-err', e => e.textContent)) && await page.$('.caw-win'), 'signing with no name was not refused in the window');
  const cname = 'Test Dummy ' + mode;
  await page.fill('#cw-name', cname); await page.fill('#cw-fin', 'Unit Test'); await page.selectOption('#cw-align', 'H');
  must(await page.$eval('.caw-split [role="status"]', e => e.textContent) === cname, 'the name is not shown in the window');
  await ok(t, 'creator gear');
  await page.click('[data-t="cw-make"]');
  must(!await page.$('.caw-win'), 'the creator did not close: ' + await page.$eval('.caw-err', e => e.textContent).catch(() => '?'));
  must(/signs a two-year deal/.test(await flash(page)), 'signing said: ' + await flash(page));
  const made = await state(page, (S, n) => { const w = S.w.find(x => x.name === n); return w && { id: w.id, mine: w.promo === S.player, face: w.face, fin: w.fin, align: w.align }; }, cname);
  must(made && made.mine && made.face.hr === hr && made.face.ms === ms && made.face.sk === skin && made.fin === 'Unit Test' && made.align === 'H', 'the new wrestler is wrong: ' + JSON.stringify(made));
  await ok(t, 'creator signed', cname);
  await go(page, 'roster'); await page.fill('#rq', cname); must((await rowNames(page)).join() === cname, 'the new wrestler is not on the roster');
  await openProfile(page, made.id); await profTab(page, 'over');
  must(await drawn(page, '.prof canvas.pt'), 'the new wrestler’s portrait is blank');
  must(/the Unit Test/.test(await page.$eval('.prof', e => e.innerText)), 'the finisher is not on the profile');
  await ok(t, 'created wrestler on the roster', await ink(page, '.prof canvas.pt') + ' colours in the portrait');
  await page.fill('#rq', '');

  /* ----- market offer ----- */
  await go(page, 'market'); must(!await page.$('.prof'), 'a profile is showing on the market');
  await page.fill('#mq', mk.buy.name); must((await page.$$eval('.tw tbody tr', L => L.length)) === 1, 'market search did not narrow to one');
  await page.click('[data-t="offer"][data-id="' + mk.buy.id + '"]'); await page.waitForSelector('#offer-wage');
  await page.fill('#offer-wage', String(mk.buy.ask)); await page.selectOption('#offer-weeks', '96');
  await ok(t, 'market offer row', mk.buy.name + ' asks ' + mk.buy.ask);
  await page.click('[data-t="sign"][data-id="' + mk.buy.id + '"]');
  const said = await flash(page), got = await state(page, (S, id) => ({ mine: S.w[id].promo === S.player, con: S.w[id].con }), mk.buy.id);
  must(said !== '-' && !await page.$('#offer-wage'), 'the offer got no answer');
  must(got.mine ? got.con === 96 : !!await page.$('.flash.err'), 'answer and state disagree: ' + said);
  await ok(t, 'market offer', (got.mine ? 'signed: ' : 'refused: ') + said.slice(0, 70));
  await page.fill('#mq', '');
  await t.browser.close();
}

/* TV: only arrow keys and Enter, as a remote would send them. */
async function tv() {
  const t = await open({ mode: 'tv', file: FILE }), { page } = t;
  await go(page, 'roster'); await page.waitForSelector('tr.pick');
  const at = () => page.evaluate(() => { const e = document.activeElement; return { tag: e.tagName, id: e.dataset ? e.dataset.id : null, t: e.dataset ? e.dataset.t : null, v: e.dataset ? e.dataset.v : null, prof: !!e.closest('.prof') }; });
  let a = await at(), n = 0;
  must(a.tag !== 'BODY', 'tv: nothing is highlighted on the roster page');
  while (a.tag !== 'TR' && n++ < 12) { await page.keyboard.press('ArrowDown'); a = await at(); }
  must(a.tag === 'TR', 'tv: arrows never reached the table (' + n + ' presses, on ' + JSON.stringify(a) + ')');
  await page.keyboard.press('ArrowDown'); a = await at(); must(a.tag === 'TR', 'tv: Down left the table');
  const id = a.id;
  await page.keyboard.press('Enter'); await page.waitForSelector('.prof');
  must(await page.$('.prof [data-t="sel"][data-id="' + id + '"]'), 'tv: Enter opened the wrong profile');
  await page.waitForFunction(() => !!document.activeElement.closest('.prof'), null, { timeout: 2000 }).catch(() => {});
  a = await at(); must(a.prof && a.t === 'ptab', 'tv: the highlight did not move to the profile: ' + JSON.stringify(a));
  await ok(t, 'profile opened with arrows and Enter', n + 1 + ' presses down, then Enter');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  must(/a week, \d+ weeks left/.test(await page.$eval('.prof', e => e.innerText)), 'tv: Right and Enter did not open the Contract page');
  await ok(t, 'profile page changed with arrows and Enter');
  await shot(page, 'roster-profile-tv');
  await page.evaluate(() => window.EWF_DEBUG.pad('b'));
  must(!await page.$('.prof'), 'tv: Back did not close the profile');
  await page.waitForFunction(() => document.activeElement.tagName === 'TR', null, { timeout: 2000 }).catch(() => {});
  a = await at(); must(a.tag === 'TR' && a.id === id, 'tv: Back did not return the highlight to the row: ' + JSON.stringify(a));
  await ok(t, 'Back closes the profile and returns to the row');
  await t.browser.close();
}

(async () => {
  for (const mode of ['desk', 'phone']) await run(mode);
  await tv();
  console.log('roster: all passed');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
