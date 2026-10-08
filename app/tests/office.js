/* Browser run of the Office section: the desk (Before the show, the backstage rooms, the inbox), Career, the clock and week-closed windows, game over.
   Build:  EWF_OUT=next-office EWF_DEV=1 node build.js
   Run:    NODE_PATH=/opt/npm-tools/node_modules node app/tests/office.js            (MODES=desk,tablet,tv,remote picks the passes; the default is desk,tablet,remote) */
/** A backstage action now also opens a small result pop-up; close it so the test can carry on. */
const bsdo = async (page, sel, o) => { await page.click(sel, o); if (await page.$('.win')) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); } };
const { open, go, overflow, shot, flash, state, redraw } = require('./helper');

const MODES = (process.env.MODES || 'desk,tablet,remote').split(',');
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
  ok((await page.$$eval('.deskpage > .wn', L => L.map(e => e.getAttribute('data-t')).join())) === 'road,fire,task-win,next' && await count('[data-t="next"] [data-t="book-next"]') === 1, 'the desk is four windows: the road, what needs an answer, the tasks and the next show with its booking button');
  ok(await count('.main .panel') === 0 && await count('[data-t="endweek"]') === 0, 'no old panels on the desk, and no end-week button yet');
  /* everything else the desk keeps is in one pop-up */
  const moreTab = async id => { if (!(await page.$('[data-t="more-tab"]'))) { await page.click('[data-t="desk-more"]'); await page.waitForSelector('[data-t="more-tab"]'); } await page.click('[data-t="more-tab"][data-v="' + id + '"]'); };
  await page.click('[data-t="desk-more"]'); await page.waitForSelector('.win');
  ok((await page.$$eval('[data-t="more-tab"]', L => L.map(e => e.innerText.trim()).join('|'))) === 'This week|Promises|Worth knowing|Clocks|News|Answered', 'The week in full has six tabs: ' + (await page.$$eval('[data-t="more-tab"]', L => L.map(e => e.innerText.trim()).join('|'))));
  ok(await count('.win [data-t="book-show"]') === 1, 'This week lists the shows, with one to book');
  await moreTab('news'); ok(await count('.win .onews li') >= 1, 'office news has a memo');
  await step('the week in full', 'week');
  await page.keyboard.press('Escape');
  ok(/Backstage/.test(await txt('[data-t="bs-line"]')) && /\d of \d point/.test(await txt('[data-t="bs-line"]')) && await count('.pre .room') === 0 && await count('[data-t="ppl-who"]') === 0, 'the desk has one line about backstage and a button, not the rooms');
  await page.click('[data-t="book-next"]'); ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'booking', 'Book the next show opens Booking'); await go(page, 'desk');

  /* ---- a clock window: open, read, close with the button; open again, close with Esc ---- */
  await moreTab('clocks');
  ok(await count('[data-t="clocks-quiet"]') === 1 || await count('[data-t="clock"]') === 6, 'quiet clocks fold into one button');
  if (await count('[data-t="clocks-quiet"]')) await page.click('[data-t="clocks-quiet"]');
  ok(await count('[data-t="clock"]') === 6, 'six clocks');
  await page.click('[data-t="clock"][data-k="mutiny"]'); await page.waitForSelector('.win');
  ok(/Mutiny/.test(await txt('.win .wt')) && /0 of 6 segments filled/.test(await txt('.win .wb')) && await count('.win .dial') === 1, 'clock window content');
  await step('clock window', 'clock');
  await page.click('#modal-ok'); ok(await count('.win .dial') === 6 && await count('[data-t="clock"]') === 6, 'clock window closes on OK, back to the clocks');
  await page.click('[data-t="clock"][data-k="star"]'); await page.waitForFunction(() => document.querySelectorAll('.win .dial').length === 1); await page.keyboard.press('Escape'); ok(await count('[data-t="clock"]') === 6, 'clock window closes on Esc, back to the clocks');
  await page.keyboard.press('Escape'); ok(await count('.win') === 0, 'and Esc again closes the week in full');
  await step('clock closed');

  /* ---- backstage: the trainer's room ---- */
  await page.click('[data-t="to-backstage"]');
  ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'backstage' && (await page.$$eval('[data-t="page"]', a => a.map(e => e.innerText.trim()))).join('|') === 'The desk|Backstage|Storylines|Career', 'Backstage is its own page in the Office, between the desk and Storylines: ' + (await page.$$eval('[data-t="page"]', a => a.map(e => e.innerText.trim()))).join('|'));
  /* backstage is people, not rooms: seven rooms, your own office first, a face for everybody who is there for a reason */
  ok(await count('[data-t="ppl-room"]') === 7 && /your office/i.test(await txt('[data-t="ppl-room"]')) && await count('[data-t="ppl-who"]') >= 1 && await count('[data-t="ppl-who"] canvas') === await count('[data-t="ppl-who"]'), 'backstage shows people with faces, room by room');
  ok(/The room:/.test(await txt('[data-t="room-line"]')) && /unhappy/.test(await txt('[data-t="room-line"]')), 'Backstage sums up the room in one line');
  await page.click('[data-t="ppl-who"]');
  await page.click('[data-t="ppl-file"]'); await page.waitForSelector('[data-t="dossier"]');
  ok(await count('.win [data-t="dz-here"]') === 1 && await count('.win [data-t="dz-stand"] .kvl') === 3 && await count('.win [data-t="dz-acts"] [data-t="dz-do"]') >= 1 && await page.$eval('.win', e => e.getBoundingClientRect().bottom <= innerHeight + 1), 'their file opens: why they are here, how they stand, and what you can do');
  await step('their file', 'dossier');
  await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  ok((await txt('[data-t="ppl-det"]')).length > 40 && await state(page, S => S.ap) === await state(page, S => window.GP.backstage(S).max), 'picking somebody says why they are there and what a point does, and costs nothing yet');
  await page.click('[data-t="ppl-who"]');
  ok(/your office/i.test(await txt('[data-t="bs-act"][data-k="truck"]')), 'the truck is Your office now');
  const max = await ap(); ok(max === 3 && /3 of 3/.test(await txt('[data-t="bs-ap"]')), 'three action points to start');
  await step('rooms', 'rooms');
  /* things to do: one button each, and each opens a pop-up. There is no menu of rooms. */
  const act = (k, v) => '[data-t="bs-act"][data-k="' + k + '"][data-v="' + v + '"]', shut = async () => { for (let i = 0; i < 3 && await page.$('.win'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); } };
  ok(await count('.bsmap') === 0 && await count('[data-t="bs-room"]') === 0 && await count('[data-t="bs-act"]') >= 10, 'the rooms menu is gone: things to do are buttons');
  await page.click(act('trainer', 'treat'));
  ok(await count('.win #bs-a') === 1 && await count('.win [data-t="bs-do"]') === 1 && (await txt('.win [data-t="bs-act-what"]')).length > 20, 'a button opens a pop-up that says what it does and asks who');
  await page.selectOption('#bs-a', { index: 1 });
  await page.click('.win [data-t="bs-do"]'); await page.waitForTimeout(80);
  ok(await ap() === max - 1 && /treatment/.test(await txt('.win')), 'the trainer costs one point, and the pop-up says what happened: ' + (await txt('.win')).slice(0, 90));
  await page.click('#modal-ok'); await page.waitForTimeout(80);
  ok(await count('.win [data-t="bs-do"]') === 1 && /already spent time/.test(await txt('.win')), 'closing the result goes back to the pop-up it came from, which says the room is used');
  await shut();
  ok(await count(act('trainer', 'treat') + '.used') === 1, 'the trainer’s room is used up for the week');
  await page.click(act('trainer', 'treat'));
  ok(/already spent time/.test(await txt('.win')) && await page.$eval('.win [data-t="bs-do"]', e => e.disabled), 'a used room spends nothing'); await shut();
  await step('trainer visit', 'trainer');

  /* ---- drills need two different wrestlers ---- */
  await page.click(act('gym', 'drill'));
  ok(await count('.win #bs-a') === 1 && await count('.win #bs-b') === 1, 'drills ask for two wrestlers');
  await page.selectOption('#bs-a', { index: 1 }); await page.selectOption('#bs-b', { index: 1 });   // the same wrestler twice
  await page.click('.win [data-t="bs-do"]'); await page.waitForTimeout(80);
  ok(/Pick two different wrestlers/.test(await txt('.win')) && await ap() === max - 1, 'same wrestler twice: no point spent'); await shut();
  await step('gym refused');

  /* ---- wrestlers' court: plant a case, rule on it; a second case can only be handed to a leader ---- */
  ok(await state(page, plantCase) === 1, 'case planted'); await redraw(page);
  ok(/1 waiting/.test(await txt(act('court', 'case'))) && /\(1\)/.test(await txt('[data-t="ppl-room"][data-v="court"]')), 'court badges');
  await page.click(act('court', 'case'));
  ok(await count('.win [data-t="bs-court"]') === 4 && /Witnesses/.test(await txt('.win')), 'the court pop-up shows four rulings and the witnesses');
  await step('court case', 'court');
  await page.click('.win [data-t="bs-court"][data-v="0"]'); await page.waitForTimeout(80);
  ok(await state(page, S => S.court.length) === 0 && await ap() === max - 2, 'ruling closes the case for one point'); await shut();
  await state(page, plantCase); await redraw(page); await page.click(act('court', 'case'));
  ok(await page.$$eval('.win [data-t="bs-court"]', L => L.length === 4 && L.every(b => b.disabled)), 'court already sat this week: rulings are off');
  if (await count('.win [data-t="bs-deleg"]')) { await page.click('.win [data-t="bs-deleg"]'); await page.waitForTimeout(80); ok(await state(page, S => S.court.length) === 0 && await ap() === max - 2, 'a leader hears it for free'); }
  else { log.push('(no locker-room leader: delegate button not shown)'); await state(page, S => { S.court.length = 0; }); await redraw(page); }
  await shut();
  await step('court done');

  /* ---- spend the last point, then nothing more can be spent ---- */
  await page.click(act('truck', 'hype')); await page.click('.win [data-t="bs-do"]'); await page.waitForTimeout(80); await shut();
  ok(await ap() === 0 && /0 of 3/.test(await txt('[data-t="bs-ap"]')), 'last point spent in your office');
  await page.click(act('catering', 'pep'));
  ok(/out of action points/.test(await txt('.win')) && await page.$eval('.win [data-t="bs-do"]', e => e.disabled) && await state(page, S => !S.pep), 'out of points: nothing more can be spent'); await shut();
  await step('out of points', 'spent');

  /* ---- career: skills only when there is a point to spend ---- */
  await subnav('career');
  ok(/Career/.test(await txt('h1')) && await count('.ach > div') === await page.evaluate(() => window.GP.ACH.filter(a => !a.ms).length), 'career heading and every achievement');
  ok(await count('[data-t="skill"]') === 0, 'no skill buttons without a point');
  await step('career', 'career');
  const key = await state(page, S => { S.booker.pts = 1; return Object.keys(window.GP.SKILLS)[0]; }); await redraw(page);
  const before = await state(page, (S, k) => S.booker.sk[k], key);
  await page.click('[data-t="skill"][data-k="' + key + '"]');
  ok(await state(page, (S, k) => S.booker.sk[k], key) === before + 1 && await state(page, S => S.booker.pts) === 0 && await count('[data-t="skill"]') === 0, 'one point buys one skill level, then the buttons go');
  await step('skill spent');

  /* ---- close week 1 through the real button; the week-closed window follows ---- */
  ok(await state(page, runShows), 'shows ran');
  await state(page, S => { S.inbox.filter(e => !e.done).forEach(e => window.GP.resolveEvent(S, e.id, e.choices.length - 1)); });   // a show can leave a matter that holds the week: one for the night, or one of its own (a chant the crowd started)
  await go(page, 'desk');
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
  ok(open0 > 0 && await count('[data-t="ev-open"]') >= 1 && /to answer/.test(await txt('[data-t="fire"] .ttl')) && await page.$eval('[data-t="fire"]', e => e.classList.contains('hot')), 'an inbox matter on the desk, in a red window, by week ' + await state(page, S => S.week));
  ok(/\((\d+)\)/.test(await txt('.menu [data-v="office"]')), 'menu badge counts the inbox');
  ok(await page.evaluate(() => { const f = document.querySelector('[data-t="fire"]'), t = document.querySelector('.tasks'); return !!f && !!t && f.getBoundingClientRect().left < t.getBoundingClientRect().left && f.querySelectorAll('[data-t="ev-open"]').length >= 1; }), 'what needs an answer is first on the desk, above the tasks, with its answers');
  await page.click('[data-t="ev-open"]'); await page.waitForSelector('.win [data-t="ev"]');
  ok(await count('.win [data-t="ev"]') >= 2 && (await txt('.win [data-t="ev-text"]')).length > 20, 'Answer opens the matter in a pop-up with a button for each answer');
  await step('inbox waiting', 'inbox');
  await page.keyboard.press('Escape');
  await state(page, runShows); await redraw(page);
  open0 = await state(page, S => S.inbox.filter(e => !e.done).length);   // a show can leave one more matter
  ok(await page.$eval('[data-t="endweek"]', e => e.disabled) && /Answer what is on your desk first/.test(await txt('[data-t="next"]')) && await count('[data-t="book-next"]') === 0, 'cannot end the week with the inbox open');
  while (open0 > 0) {
    if (!(await page.$('.win [data-t="ev"]'))) await page.click('[data-t="ev-open"]');
    await page.click('.win [data-t="ev"]');
    const now = await state(page, S => S.inbox.filter(e => !e.done).length); ok(now === open0 - 1 && (await txt('.win [data-t="ev-result"]')).length > 3, 'one click answers one matter, and the pop-up says what happened'); open0 = now;
    ok(now === 0 ? !(await page.$('[data-t="ev-next"]')) : !!(await page.$('[data-t="ev-next"]')), 'the next matter is offered while there is one');
    if (now) await page.click('[data-t="ev-next"]'); else await page.keyboard.press('Escape');
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
  for (const id of ['desk', 'backstage', 'career']) { await go(page, id); await settle(); const o = await overflow(page); ok(o === '', 'tv ' + id + ': ' + o); }
  await go(page, 'desk'); await settle();
  ok(await focus() === 'book-next', 'the desk starts on Book the next show: ' + await focus());
  await key('ArrowLeft'); ok(await page.evaluate(() => !!document.activeElement.closest('[data-t="task-win"]')), 'left from the button reaches this week’s tasks: ' + await focus());
  await go(page, 'backstage'); await settle();
  await press('[data-t="bs-act"][data-k="trainer"][data-v="treat"]');
  ok(await page.$$eval('.win', L => L.length) === 1 && /^(bs|modal-close|bs-do)/.test(await focus()), 'OK on a thing to do opens its pop-up and the highlight goes in: ' + await focus());
  await page.selectOption('#bs-a', { index: 1 }); await press('.win [data-t="bs-do"]');
  ok(await focus() === 'modal-close', 'the result pop-up takes the highlight: ' + await focus());
  await key('Escape'); await settle(); if (await page.$('.win')) { await key('Escape'); await settle(); }
  ok(await state(page, S => S.ap) === 2 && await focus() !== 'nothing', 'after spending, the highlight is not lost: ' + await focus());
  await state(page, plantCase); await redraw(page); await press('[data-t="bs-act"][data-k="court"][data-v="case"]'); await press('.win [data-t="bs-court"][data-v="3"]');
  if (await page.$('.win')) { await key('Escape'); await settle(); } if (await page.$('.win')) { await key('Escape'); await settle(); }
  ok(await state(page, S => S.court.length) === 0 && await focus() !== 'nothing', 'after a ruling, the highlight is not lost: ' + await focus());
  let weeks = 0; while (weeks++ < 14 && !(await state(page, S => S.over || S.inbox.some(e => !e.done)))) await state(page, playWeek);
  await go(page, 'career'); await settle(); await go(page, 'desk'); await redraw(page); await settle();   // arriving from another page
  ok(await focus() === 'book-next', 'the desk starts on Book the next show, not on an answer: ' + await focus());
  let left = await page.$$eval('[data-t="ev-open"]', L => L.length); ok(left > 0, 'tv: an inbox matter to answer');
  await press('[data-t="ev-open"]'); ok(await focus() === 'modal-close', 'the matter opens with the highlight on Not now, never on an answer: ' + await focus());
  while (left > 0) { await press('.win [data-t="ev"]'); left = await state(page, S => S.inbox.filter(e => !e.done).length); ok(await focus() === (left ? 'ev-next' : 'modal-close'), 'after an answer the highlight moves on: ' + await focus()); if (left) { await press('[data-t="ev-next"]'); await settle(); } }
  await key('Escape'); await settle();
  await press('[data-t="desk-more"]'); await settle(); await press('[data-t="more-tab"][data-v="clocks"]'); await settle();
  if (!(await page.$('[data-t="clock"][data-k="hot"]'))) await press('[data-t="clocks-quiet"]');
  await press('[data-t="clock"][data-k="hot"]'); ok(await focus() === 'modal-close', 'clock window takes the highlight: ' + await focus());
  await key('Backspace'); ok(await page.$$eval('.win .dial', L => L.length) > 1 && await focus() === 'clock', 'Back closes it and the highlight returns to the clock: ' + await focus());
  ok(errs.length === 0, 'console errors: ' + errs.join(' | '));
  await browser.close();
  console.log('remote (tv): ' + (fails.length ? fails.length + ' failed' : 'highlight never lost, no overflow, no errors')); fails.forEach(f => console.log('  FAIL ' + f));
  return fails.length;
}

(async () => { let bad = 0; for (const m of MODES) bad += m === 'remote' ? await remote() : await run(m); console.log(bad ? 'FAILED: ' + bad : 'OFFICE OK'); process.exit(bad ? 1 : 0); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
