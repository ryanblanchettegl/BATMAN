/* Browser run of the Office section: the desk (Before the show, the backstage rooms, the inbox), Career, the clock and week-closed windows, game over.
   Build:  EWF_OUT=next-office EWF_DEV=1 node build.js
   Run:    NODE_PATH=/opt/npm-tools/node_modules node app/tests/office.js            (MODES=desk,phone,tablet,tv,remote picks the passes; the default is desk,phone,remote) */
const { open, go, overflow, shot, flash, state, redraw } = require('./helper');

const MODES = (process.env.MODES || 'desk,phone,remote').split(',');
const FILE = process.env.EWF_OUT || 'index';

/** Run every show left this week with the suggested card, straight through the engine (Booking is another section). */
const runShows = S => { let g = 0; while (S.qi < S.queue.length && g++ < 12) { S.card = window.GP.suggest(S); if (window.GP.runPlayerShow(S, S.card).errors) break; } return S.qi >= S.queue.length; };
/** A whole week with nothing answered: the shows, then the close. */
const playWeek = S => { let g = 0; while (S.qi < S.queue.length && g++ < 12) { S.card = window.GP.suggest(S); if (window.GP.runPlayerShow(S, S.card).errors) break; } window.GP.endWeek(S); return S.week; };
/** A dispute between two fit wrestlers of the same division, with two witnesses. `a` is in the right. */
const plantCase = S => {
  const R = window.GP.rosterOf(S, S.player).filter(w => !w.nw && w.inj <= 0 && !w.camp), a = R[0], b = R.filter(w => w.id !== a.id && w.g === a.g)[0], wit = R.filter(w => w.id !== a.id && w.id !== b.id).slice(0, 2);
  S.court.push({ id: S.nid++, a: a.id, b: b.id, k: 'rib', wk: S.week, right: 'a', ev: [{ w: wit[0].id, side: 'a' }, { w: wit[1].id, side: 'b' }], text: a.name + ' found their gear bag full of shaving foam and blames ' + b.name + '.' });
  return S.court.length;
};

async function run(mode) {
  const { browser, page, errs } = await open({ mode, file: FILE }), fails = [], log = [];
  const ok = (cond, what) => { if (!cond) fails.push(what); };
  const txt = sel => page.$eval(sel, e => e.textContent).catch(() => '');
  const count = sel => page.$$eval(sel, L => L.length);
  const ap = () => state(page, S => S.ap);
  /** After each step: nothing may stick out sideways. */
  const step = async (name, pic) => { const o = await overflow(page); ok(o === '', name + ': ' + o); log.push(name); if (pic) await shot(page, 'office-' + mode + '-' + pic, true); };
  const subnav = async id => { await page.click('[data-t="page"][data-v="' + id + '"]'); };

  /* ---- the desk, week 1 ---- */
  ok(/Office - Week 1/.test(await txt('h1')), 'desk heading');
  ok(await count('.gp') === 0 && await count('.gauge') === 0, 'no gauges on the desk: they are on Company');
  ok((await page.$$eval('.panel > h2', L => L[0].textContent)) === 'Before the show' && await count('.pre [data-t="book-next"]') === 1, 'the desk opens on Before the show, with the booking button');
  ok(await count('.onews li') >= 1, 'office news has a memo');
  for (const t of ['Before the show', 'Inbox', 'This week', 'Promises and targets', 'Needs attention', 'Clocks', 'Office news']) ok((await page.$$eval('.panel > h2', L => L.map(e => e.textContent))).includes(t), 'panel: ' + t);
  ok(await count('[data-t="book-show"]') === 1 && await count('[data-t="endweek"]') === 0, 'a show to book, no end-week button yet');
  await step('desk', 'desk');
  await page.click('[data-t="book-next"]'); ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'booking', 'Book the next show opens Booking'); await go(page, 'desk');

  /* ---- a clock window: open, read, close with the button; open again, close with Esc ---- */
  ok(await count('[data-t="clock"]') === 6, 'six clocks');
  await page.click('[data-t="clock"][data-k="mutiny"]'); await page.waitForSelector('.win');
  ok(/Mutiny/.test(await txt('.win .wt')) && /0 of 6 segments filled/.test(await txt('.win .wb')) && await count('.win .dial') === 1, 'clock window content');
  await step('clock window', 'clock');
  await page.click('#modal-ok'); ok(await count('.win') === 0, 'clock window closes on OK');
  await page.click('[data-t="clock"][data-k="star"]'); await page.waitForSelector('.win'); await page.keyboard.press('Escape'); ok(await count('.win') === 0, 'clock window closes on Esc');
  await step('clock closed');

  /* ---- backstage: the trainer's room ---- */
  ok(await count('.pre .room') === 7 && await count('[data-t="page"]') === 2, 'seven rooms on the desk, and no separate Backstage page');
  const max = await ap(); ok(max === 3 && /3 of 3/.test(await txt('.panel')), 'three action points to start');
  await step('rooms', 'rooms');
  await page.click('[data-t="bs-room"][data-v="trainer"]');
  ok(await count('.room.on') === 1 && await count('#bs-a') === 1 && await count('#bs-b') === 0, 'trainer room open with one wrestler picker');
  await page.click('[data-t="bs-do"][data-v="treat"]');           // nobody picked: the engine refuses and nothing is spent
  ok(/Pick a wrestler first/.test(await flash(page)) && await ap() === max, 'no wrestler picked: no point spent');
  await page.selectOption('#bs-a', { index: 1 });
  await page.click('[data-t="bs-do"][data-v="treat"]');
  ok(await ap() === max - 1 && /treatment/.test(await flash(page)), 'trainer visit costs one point: ' + await flash(page));
  ok(await page.$eval('[data-t="bs-do"][data-v="treat"]', e => e.disabled) && await count('.room.used') === 1 && /already spent time here/.test(await txt('.roomdet')), 'trainer room is used up for the week');
  await page.click('[data-t="bs-do"][data-v="treat"]', { force: true }); ok(await ap() === max - 1, 'a used room spends nothing');
  await step('trainer visit', 'trainer');

  /* ---- backstage: the gym needs two different wrestlers ---- */
  await page.click('[data-t="bs-room"][data-v="gym"]');
  ok(await count('#bs-a') === 1 && await count('#bs-b') === 1, 'gym has two pickers');
  await page.selectOption('#bs-b', { index: 1 });               // the same wrestler twice
  await page.click('[data-t="bs-do"][data-v="drill"]');
  ok(/Pick two different wrestlers/.test(await flash(page)) && await ap() === max - 1, 'same wrestler twice: no point spent');
  await step('gym refused');

  /* ---- wrestlers' court: plant a case, rule on it; a second case can only be handed to a leader ---- */
  ok(await state(page, plantCase) === 1, 'case planted'); await redraw(page);
  ok(/1 in court/.test(await txt('.pre')) && /1 case waiting/.test(await txt('[data-t="bs-room"][data-v="court"]')), 'court badges');
  await page.click('[data-t="bs-room"][data-v="court"]');
  ok(await count('[data-t="bs-court"]') === 4 && /Witnesses/.test(await txt('.roomdet')), 'case shows four rulings and its witnesses');
  await step('court case', 'court');
  await page.click('[data-t="bs-court"][data-v="0"]');
  ok(await state(page, S => S.court.length) === 0 && await ap() === max - 2 && /You find for/.test(await flash(page)), 'ruling closes the case for one point: ' + await flash(page));
  ok(/No cases on the docket/.test(await txt('.roomdet')), 'empty docket');
  await state(page, plantCase); await redraw(page);
  ok(await page.$$eval('[data-t="bs-court"]', L => L.length === 4 && L.every(b => b.disabled)), 'court already sat this week: rulings are off');
  if (await count('[data-t="bs-deleg"]')) { await page.click('[data-t="bs-deleg"]'); ok(await state(page, S => S.court.length) === 0 && await ap() === max - 2 && /hears the case/.test(await flash(page)), 'a leader hears it for free'); }
  else { log.push('(no locker-room leader: delegate button not shown)'); await state(page, S => { S.court.length = 0; }); await redraw(page); }
  await step('court done');

  /* ---- spend the last point, then nothing more can be spent ---- */
  await page.click('[data-t="bs-room"][data-v="truck"]'); await page.click('[data-t="bs-do"][data-v="hype"]');
  ok(await ap() === 0 && /0 of 3/.test(await txt('.panel')), 'last point spent in the truck');
  await page.click('[data-t="bs-room"][data-v="catering"]');
  ok(/out of action points/.test(await txt('.roomdet')) && await page.$$eval('[data-t="bs-do"]', L => L.length === 2 && L.every(b => b.disabled)), 'out of points: every action is off');
  await page.click('[data-t="bs-do"][data-v="pep"]', { force: true }); ok(await ap() === 0 && await state(page, S => !S.pep), 'nothing spent at zero');
  await step('out of points', 'spent');

  /* ---- career: skills only when there is a point to spend ---- */
  await subnav('career');
  ok(/Career/.test(await txt('h1')) && await count('.ach > div') === await page.evaluate(() => window.GP.ACH.length), 'career heading and every achievement');
  ok(await count('[data-t="skill"]') === 0, 'no skill buttons without a point');
  await step('career', 'career');
  const key = await state(page, S => { S.booker.pts = 1; return Object.keys(window.GP.SKILLS)[0]; }); await redraw(page);
  const before = await state(page, (S, k) => S.booker.sk[k], key);
  await page.click('[data-t="skill"][data-k="' + key + '"]');
  ok(await state(page, (S, k) => S.booker.sk[k], key) === before + 1 && await state(page, S => S.booker.pts) === 0 && await count('[data-t="skill"]') === 0, 'one point buys one skill level, then the buttons go');
  await step('skill spent');

  /* ---- close week 1 through the real button; the week-closed window follows ---- */
  ok(await state(page, runShows), 'shows ran'); await go(page, 'desk');
  await page.click('[data-t="endweek"]'); await page.waitForSelector('.win');
  ok(/Week closed/.test(await txt('.win .wt')) && /Net for the week/.test(await txt('.win .wb')) && await count('.win pre.bars') === 1 && /It is now/.test(await txt('.win .wb')), 'week-closed window content');
  await step('week closed');
  await page.click('#modal-ok');
  ok(await count('.win') === 0 && /Office - Week 2/.test(await txt('h1')) && await ap() === 3, 'on to week 2 with fresh action points');

  /* ---- the inbox: play on through the engine until somebody wants an answer, then answer on the desk ---- */
  let weeks = 0;
  while (weeks++ < 14 && !(await state(page, S => S.over || S.inbox.some(e => !e.done)))) await state(page, playWeek);
  await redraw(page);
  let open0 = await state(page, S => S.inbox.filter(e => !e.done).length);
  ok(open0 > 0 && await count('[data-t="ev"]') >= 2, 'an inbox event with choices by week ' + await state(page, S => S.week));
  ok(/\((\d+)\)/.test(await txt('.menu [data-v="office"]')), 'menu badge counts the inbox');
  await step('inbox waiting', 'inbox');
  await state(page, runShows); await redraw(page);
  ok(await page.$eval('[data-t="endweek"]', e => e.disabled) && /Answer your inbox first/.test(await txt('.pre')) && await count('[data-t="book-next"]') === 0, 'cannot end the week with the inbox open');
  while (open0 > 0) {
    await page.click('[data-t="ev"]');
    const now = await state(page, S => S.inbox.filter(e => !e.done).length); ok(now === open0 - 1, 'one click answers one event'); open0 = now;
  }
  ok(await count('[data-t="ev"]') === 0 && await state(page, S => S.inbox.some(e => e.done && e.result)), 'answered events show a result');
  await step('inbox answered', 'answered');
  await page.click('[data-t="endweek"]'); await page.waitForSelector('.win');
  ok(await page.$eval('.win pre.bars', e => e.textContent.split('\n').length >= 8), 'chart has rows for several weeks');
  await step('week closed again', 'weekclosed');
  await page.click('#modal-ok');

  /* ---- game over: fired, take a job elsewhere; then bankrupt, start again ---- */
  const old = await state(page, S => { S.over = { why: 'fired', week: S.week }; return S.player; }); await redraw(page);
  ok(/You are fired/.test(await txt('h1')) && await count('[data-t="job"]') >= 1 && await count('.subnav') === 0, 'fired screen offers jobs');
  await step('fired', 'fired');
  await page.click('[data-t="job"]');
  ok(/Office - Week 1/.test(await txt('h1')) && await state(page, S => S.player) !== old && await state(page, S => S.booker.name) === 'Ryan', 'new job, same booker');
  await state(page, S => { S.over = { why: 'bankrupt', week: S.week }; }); await redraw(page);
  ok(/Out of business/.test(await txt('h1')) && await count('[data-t="job"]') === 0, 'bankrupt screen has no job offers');
  await step('bankrupt');
  await page.click('[data-t="newgame-yes"]'); await page.waitForSelector('.dbox');
  ok(await page.evaluate(() => window.EWF_DEBUG.state() === null), 'back to Select promotion');

  ok(errs.length === 0, 'console errors: ' + errs.join(' | '));
  await browser.close();
  console.log(mode + ': ' + log.length + ' steps, ' + (fails.length ? fails.length + ' failed' : 'no overflow, no errors') + '\n  ' + log.join(' > '));
  fails.forEach(f => console.log('  FAIL ' + f));
  return fails.length;
}

/** TV mode, driven by keys only: the highlight must survive every action (docs/design.md, section 4). */
async function remote() {
  const { browser, page, errs } = await open({ mode: 'tv', file: FILE }), fails = [];
  const ok = (cond, what) => { if (!cond) fails.push(what); };
  const focus = () => page.evaluate(() => { const e = document.activeElement; return !e || e === document.body ? 'nothing' : (e.dataset.t || e.tagName) + (e.dataset.v ? ':' + e.dataset.v : '') + (e.disabled ? ' (off)' : ''); });
  // the highlight is placed after the frame is painted, so let two frames pass before asking where it is
  const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))));
  const key = async k => { await page.keyboard.press(k); await settle(); };
  const press = async sel => { await page.focus(sel); await key('Enter'); };
  // settle() after every go(): the input layer homes the highlight one frame after a page change, and two page changes
  // inside one frame leave it on the old control
  for (const id of ['desk', 'career']) { await go(page, id); await settle(); const o = await overflow(page); ok(o === '', 'tv ' + id + ': ' + o); }
  await go(page, 'desk'); await settle();
  ok(await focus() === 'book-next', 'the desk starts on Book the next show: ' + await focus());
  await key('ArrowDown'); ok(/^bs-room:/.test(await focus()), 'down from the button reaches the rooms: ' + await focus());
  await page.focus('[data-t="bs-room"][data-v="office"]'); await key('ArrowRight'); await key('ArrowRight'); ok(await focus() === 'bs-room:trainer', 'arrows walk the map: ' + await focus());
  await key('Enter'); ok(await page.$$eval('.room.on', L => L.length) === 1 && await focus() === 'bs-room:trainer', 'OK opens the room and the highlight stays');
  await page.click('[data-t="bs-room"][data-v="gym"]'); await page.click('[data-t="bs-room"][data-v="trainer"]');   // whatever the arrows did, the trainer's room is open now
  await page.selectOption('#bs-a', { index: 1 }); await press('[data-t="bs-do"]');
  ok(await state(page, S => S.ap) === 2 && await focus() === 'bs-room:trainer', 'after spending, the highlight is back on the map: ' + await focus());
  await state(page, plantCase); await redraw(page); await press('[data-t="bs-room"][data-v="court"]'); await press('[data-t="bs-court"][data-v="3"]');
  ok(await state(page, S => S.court.length) === 0 && await focus() === 'bs-room:court', 'after a ruling, the highlight is back on the map: ' + await focus());
  let weeks = 0; while (weeks++ < 14 && !(await state(page, S => S.over || S.inbox.some(e => !e.done)))) await state(page, playWeek);
  await go(page, 'career'); await settle(); await go(page, 'desk'); await redraw(page); await settle();   // arriving from another page
  ok(await focus() === 'book-next', 'the desk starts on Book the next show, not on an answer: ' + await focus());
  let left = await page.$$eval('[data-t="ev"]', L => L.length); ok(left > 0, 'tv: an inbox event to answer');
  while (left > 0) { await press('[data-t="ev"]'); left = await page.$$eval('[data-t="ev"]', L => L.length); ok(/^(ev|book-next|endweek)$/.test(await focus()), 'after an answer the highlight moves on: ' + await focus()); }
  await press('[data-t="clock"][data-k="hot"]'); ok(await focus() === 'modal-close', 'clock window takes the highlight: ' + await focus());
  await key('Backspace'); ok(await page.$$eval('.win', L => L.length) === 0 && await focus() === 'clock', 'Back closes it and the highlight returns to the clock: ' + await focus());
  ok(errs.length === 0, 'console errors: ' + errs.join(' | '));
  await browser.close();
  console.log('remote (tv): ' + (fails.length ? fails.length + ' failed' : 'highlight never lost, no overflow, no errors')); fails.forEach(f => console.log('  FAIL ' + f));
  return fails.length;
}

(async () => { let bad = 0; for (const m of MODES) bad += m === 'remote' ? await remote() : await run(m); console.log(bad ? 'FAILED: ' + bad : 'OFFICE OK'); process.exit(bad ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
