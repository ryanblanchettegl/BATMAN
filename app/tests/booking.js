/* Booking: card builder, match editor, side panel, the run flow (pre-show incident, headset call), broadcast, report.
   Build:  EWF_OUT=next-booking EWF_DEV=1 node build.js
   Run:    NODE_PATH=/opt/npm-tools/node_modules node app/tests/booking.js */
const { open, go, overflow, shot, flash, state } = require('./helper');
const FILE = process.env.EWF_OUT || 'index';

function ok(cond, msg) { if (!cond) throw new Error(msg); }
const txt = (page, sel) => page.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
const count = (page, sel) => page.$$eval(sel, e => e.length);
const has = async (page, sel) => (await count(page, sel)) > 0;
const focusId = page => page.evaluate(() => document.activeElement && document.activeElement.id);
/** Where the broadcast is: 's:b', or null when it is not showing. */
const pos = page => page.evaluate(() => { const b = window.EWF_DEBUG.ui.slices.booking; return b && b.live ? b.live.s + ':' + b.live.b : null; });
const plant = page => state(page, S => { for (let i = 0; i < 400; i++) { S.chs = null; if (GP.chaos(S, S.card)) return true; } return false; });

/** The newest commentary line as far as it has been typed (the rest is in the page, hidden, holding its place). */
const typed = page => page.$eval('#live .ln.last', e => { const c = (e.querySelector('.tx') || e).cloneNode(true); c.querySelectorAll('.untyped').forEach(x => x.remove()); return c.textContent; }).catch(() => '');
/** Is the continue button on screen, clear of the menu bar and the status bar? */
const goInView = page => page.evaluate(() => { const g = document.getElementById('live-go').getBoundingClientRect(), st = document.querySelector('.ffoot').getBoundingClientRect(), mn = document.querySelector('.menu').getBoundingClientRect(); return g.top >= mn.bottom && g.bottom <= st.top; });
/** Advance the broadcast one step. The first press may only finish the line being typed, so press until it moves. */
async function advance(page, how) {
  const from = await pos(page);
  for (let k = 0; k < 4; k++) {
    if (how === 'click') await page.click('#live-go'); else await page.keyboard.press(how);
    await page.waitForTimeout(25);
    if (await pos(page) !== from) { if (await page.$('#live-go') && !(await goInView(page))) throw new Error('the continue button is off screen at ' + await pos(page)); return; }
  }
  throw new Error('the broadcast did not advance with ' + how + ' from ' + from);
}
/** Press Run and answer whatever stands in the way. Returns what happened: { pre, chaos }. */
async function runShow(page, mode, check) {
  const seen = { pre: false, chaos: false };
  ok(!(await has(page, '[data-t="run"]')) && !(await has(page, '[data-t="asst"]')) && !(await has(page, '[data-t="asstrun"]')), mode + ': the card has no Run or assistant buttons of its own');
  ok(await page.$eval('[data-t="advance"]', e => e.getAttribute('data-v') + ':' + e.innerText.split('\n')[0].trim().toLowerCase()) === 'run:run show', mode + ': the big button should say Run show');
  await page.click('[data-t="advance"]');
  for (let k = 0; k < 6 && !(await has(page, '#live')); k++) {
    if (await has(page, '.win [data-t="chaos"]')) {
      seen.chaos = true;
      ok(await focusId(page) === 'modal-ok', mode + ': the first headset choice should have focus');
      ok(!(await has(page, '.win .wf #modal-ok')), mode + ': the headset window has no OK button');
      await check('headset call');
      if (mode === 'desk') await shot(page, 'booking-' + mode + '-chaos');
      // Esc puts the headset down; Run picks it up again
      await page.keyboard.press('Escape'); ok(!(await has(page, '.win')), mode + ': Esc should close the headset window');
      await page.click('[data-t="advance"]'); await page.waitForSelector('.win [data-t="chaos"]');
      await page.click('.win [data-t="chaos"][data-c="1"]');
    } else if (await has(page, '[data-t="pre"]')) {
      seen.pre = true;
      ok(await page.$eval('[data-t="advance"]', e => e.getAttribute('data-v')) === 'pre', mode + ': the big button should wait for the pre-show answer');
      await check('pre-show incident');
      await page.click('[data-t="pre"][data-c="0"]');
    } else if (await has(page, '.flash.err')) {
      // the incident took a match off the card: start again from a fresh card
      await page.click('[data-t="suggest"]'); await page.click('[data-t="advance"]');
    }
    await page.waitForTimeout(30);
  }
  ok(await has(page, '#live'), mode + ': the broadcast did not start. Message: ' + await flash(page));
  return seen;
}

async function section(mode) {
  const { browser, page, errs } = await open({ mode, file: FILE });
  const steps = [];
  const check = async name => { const o = await overflow(page); ok(o === '', mode + ' / ' + name + ': ' + o); ok(!errs.length, mode + ' / ' + name + ': ' + errs.join(' | ')); steps.push(name); };
  const seg = i => '.sheet .seg[data-m="' + i + '"]';   // a match row; promos and angles sit between them

  /* ---- the card builder ---- */
  await go(page, 'booking');
  const shows = await state(page, S => S.queue.map(q => q.name));
  ok(shows.length >= 2, mode + ': expected two shows this week');
  ok(await txt(page, '.head h1') === shows[0], mode + ': heading should be the first show');
  ok(/The card is empty/.test(await txt(page, '.cols')), mode + ': empty card text');
  ok(/This crowd expects an? [a-z- ]+\./.test(await txt(page, '.head')) && !/expects about/.test(await txt(page, '.head')) && !/%/.test(await txt(page, '[data-t="expect"]')), mode + ': what the crowd expects should be in words, not a number: ' + await txt(page, '.head'));
  await page.click('[data-t="ladder"]');
  ok((await page.$$('[data-t="ladder-list"] li')).length === 10 && (await page.$$('[data-t="ladder-list"] li.on')).length === 1 && /what your crowd expects/.test(await txt(page, '[data-t="ladder-list"] li.on')), mode + ': the ladder window should list ten rungs and mark this crowd’s');
  await check('the ladder');
  await page.click('#modal-ok');
  await check('empty card');
  await page.click('[data-t="suggest"]');
  const n = await count(page, '.sheet .seg:not(.sg)');   // matches only: promos and angles are .seg.sg
  ok(n >= 3 && n === await state(page, S => S.card.length), mode + ': suggested card');
  ok(await plant(page), mode + ': could not plant a headset call');
  await check('suggest a card');

  /* ---- the match editor ---- */
  await page.click('[data-t="edit"][data-v="0"]');
  ok(await has(page, seg(0) + ' .editor'), mode + ': editor should open');
  await page.selectOption('#m0-int', 'brutal');
  ok(await state(page, S => S.card[0].int) === 'brutal' && /Brutal/.test(await txt(page, seg(0) + ' .meta')), mode + ': intensity');
  await check('intensity');
  const stip = await page.$eval('#m0-stip', e => [...e.options].map(o => o.value).find(v => v !== 'std'));
  await page.selectOption('#m0-stip', stip);
  const stipName = await page.$eval('#m0-stip', e => e.options[e.selectedIndex].text);
  ok(await state(page, S => S.card[0].stip) === stip && (await txt(page, seg(0) + ' .meta')).includes(stipName), mode + ': stipulation');
  await check('stipulation');
  await state(page, S => { S.card.forEach((m, i) => { if (i) delete m.call; }); });   // a suggested card may already hold a call; this check is about the one made here
  await page.selectOption('#m0-call', '0');
  ok(await state(page, S => S.card[0].call) === 0 && /Your call: .* wins \(\d BP\)/.test(await txt(page, seg(0) + ' .meta')), mode + ': called finish');
  ok(/committed on this card/.test(await txt(page, '.head')), mode + ': booking power committed');
  ok(await state(page, S => GP.cardCost(S, S.card) <= S.bp), mode + ': the call should be affordable: ' + await state(page, S => GP.cardCost(S, S.card) + ' of ' + S.bp + ' BP, ' + S.card.map(m => m.call).join(',')));
  ok(await page.$eval('#m0-call', e => e.value) === '0', mode + ': the select should show the call');
  await check('called finish');
  if (mode === 'desk') await shot(page, 'booking-desk-editor', true);
  await page.click('[data-t="edit"][data-v="0"]');
  ok(!(await has(page, '.editor')), mode + ': editor should close');

  /* ---- order, add, remove ---- */
  const who = i => txt(page, seg(i) + ' .who'), a = await who(0), b = await who(1);
  await page.click('[data-t="down"][data-v="0"]');
  ok(await who(0) === b && await who(1) === a, mode + ': move down');
  await check('move down');
  await page.click('[data-t="up"][data-v="1"]');
  ok(await who(0) === a && await who(1) === b, mode + ': move up');
  ok(await page.$eval('[data-t="up"][data-v="0"]', e => e.disabled) && await page.$eval('[data-t="down"][data-v="' + (n - 1) + '"]', e => e.disabled), mode + ': end buttons disabled');
  await check('move up');
  await page.click('[data-t="add"]');
  ok(await count(page, '.sheet .seg[data-m]') === n + 1 && await has(page, '#m' + n + '-type') && /Unfinished/.test(await txt(page, seg(n) + ' .meta')), mode + ': add a match');
  await page.selectOption('#m' + n + '-type', 'tag');
  ok(await count(page, seg(n) + ' [data-t="slot"]') === 4, mode + ': a tag match has four slots');
  if (await has(page, '#m' + n + '-t0')) {
    const team = await page.$eval('#m' + n + '-t0', e => e.options[1].value);
    await page.selectOption('#m' + n + '-t0', team);
    ok(await state(page, (S, k) => S.card[k].sides[0].every(id => id != null), n), mode + ': picking a team fills the side');
    ok(await page.$eval('#m' + n + '-t0', e => e.value) === '', mode + ': the team list goes back to its heading');
  }
  await check('add a match');
  await page.click('[data-t="advance"]');
  ok(/can’t run yet/.test(await flash(page)) && /Fix before the show can run/.test(await txt(page, '.flash.err:not([role])')), mode + ': an unfinished card should not run');
  await check('validation');
  await page.click('[data-t="rm"][data-v="' + n + '"]');
  ok(await count(page, '.sheet .seg[data-m]') === n && !(await has(page, '.editor')), mode + ': remove a match');
  await check('remove a match');

  /* ---- the side panel ---- */
  for (const t of [['promo', 'Opening promo'], ['feuds', 'Storylines in play'], ['targets', 'Promises and targets'], ['advice', 'The top of the hour']]) {
    await page.click('[data-t="bk"][data-v="' + t[0] + '"]');
    ok(await txt(page, '.cols > .stack:last-child .panel h2') === t[1], mode + ': side tab ' + t[0]);
    ok(await page.$eval('[data-t="bk"][data-v="' + t[0] + '"]', e => e.getAttribute('aria-pressed')) === 'true', mode + ': tab pressed');
    if (t[0] === 'promo') {
      const sp = await page.$eval('#plan-sp', e => e.options[1].value);
      await page.selectOption('#plan-sp', sp);
      await page.selectOption('#plan-topic', await page.$eval('#plan-topic', e => e.options[1].value));
      await page.selectOption('#plan-del', await page.$eval('#plan-del', e => e.options[1].value));
      ok(await state(page, (S, v) => S.plan && S.plan.sp === +v, sp) && /an attempt with a \d+% chance/.test(await txt(page, '.cols > .stack:last-child .panel')), mode + ': opening promo plan');
    }
    await check('side tab: ' + t[0]);
  }
  await shot(page, 'booking-' + mode + '-card', true);

  /* ---- run it: pre-show incident if there is one, then the planted headset call ---- */
  await state(page, S => { GP.fitShow(S, S.card); });   // the edits above changed what is on the clock: make the show fit its time again
  await go(page, 'booking');
  const seen = await runShow(page, mode, check);
  ok(seen.chaos, mode + ': the planted headset call did not come up');
  ok(/Your call: /.test(await flash(page)), mode + ': the headset result should be said. Got: ' + await flash(page));
  ok(await pos(page) === '-1:0' && await txt(page, '#live-go') === 'Ring the bell', mode + ': the title card');
  ok(await focusId(page) === 'live-go', mode + ': the continue button should have focus');
  await check('title card');
  await shot(page, 'booking-' + mode + '-titlecard', true);

  /* ---- the broadcast: button, Enter, Space, Esc, Back ---- */
  const partial = await typed(page); await page.waitForTimeout(1500);
  const whole = await typed(page);
  ok(whole.length > partial.length && /main event/.test(whole), mode + ': the last line should type itself out (' + partial.length + ' then ' + whole.length + ')');
  await advance(page, 'click');
  ok(await pos(page) !== '-1:0' && (await pos(page)).startsWith('0:') && await flash(page) === '-', mode + ': first segment, message cleared');
  // a click while a line is still typing finishes that line and does not move on
  const lastLine = () => typed(page);
  let finished = false;
  for (let k = 0; k < 80 && !(await has(page, '#live .result')); k++) {
    const at = await pos(page), part = await lastLine();
    const whole = await state(page, (S, a) => { const q = a.split(':'), bc = S.reports[0].segs[+q[0]].bc || []; return bc[+q[1]] ? bc[+q[1]].x : ''; }, at);
    if (!finished && whole.length - part.length > 45) {
      const t0 = Date.now(); await page.$eval('#live-go', e => e.click());   // not page.click: an achievement pop-up can sit over the button on a phone, and Playwright would wait it out
      const now = await pos(page), shown = await lastLine();
      ok(now === at && shown === whole, mode + ': a click while typing should finish the line, not skip it (' + at + ' -> ' + now + ', had ' + part.length + ' of ' + whole.length + ', click took ' + (Date.now() - t0) + 'ms, shows ' + shown.length + ')');
      finished = true;
    }
    if (k === 2) { await check('a line of commentary'); await shot(page, 'booking-' + mode + '-live', true); }
    await advance(page, 'click');
  }
  ok(finished, mode + ': never caught a line mid-typing');
  ok(await has(page, '#live .result'), mode + ': first segment result');
  ok(await focusId(page) === 'live-go', mode + ': focus stays on the continue button');
  await check('segment result (button)');
  await shot(page, 'booking-' + mode + '-result', true);
  await advance(page, 'Enter');                                             // Enter on the focused button
  ok((await pos(page)).startsWith('1:'), mode + ': Enter should move to the second segment');
  await page.evaluate(() => document.activeElement.blur());
  await advance(page, 'Enter');                                             // Enter with nothing focused
  await page.evaluate(() => document.activeElement.blur());
  await advance(page, ' ');
  ok(await focusId(page) === 'live-go', mode + ': the continue button takes focus back');
  await page.keyboard.press('b'); ok(await has(page, '#live'), mode + ': page shortcuts wait until the show is over');
  await page.keyboard.press('Escape');                                      // Esc skips to the result
  ok(await has(page, '#live .result'), mode + ': Esc should skip to the result');
  await check('segment result (Enter, Esc)');
  await advance(page, 'Enter');
  if (!(await has(page, '#live .result'))) { await page.evaluate(() => window.EWF_DEBUG.pad('b')); ok(await has(page, '#live .result'), mode + ': Back should skip to the result'); }
  if (await has(page, '[data-t="live-skip"]')) throw new Error(mode + ': no skip button once the result is showing');
  await page.click('[data-t="live-end"]');
  ok(await txt(page, '#live .bar span:last-child') === 'Sign-off' && await has(page, '#live-go[data-t="live-done"]'), mode + ': skip to the results');
  await check('sign-off');
  await shot(page, 'booking-' + mode + '-signoff', true);

  /* ---- the report ---- */
  await page.click('#live-go');
  const rep = await state(page, S => ({ rating: S.reports[0].rating, name: S.reports[0].name, matches: S.reports[0].segs.filter(s => s.k === 'match').length, angles: S.reports[0].segs.filter(s => s.k !== 'match').length }));
  ok(!(await has(page, '#live')) && await txt(page, '.head h1') === rep.name && /^(A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/.test((await txt(page, '.big')).trim()) && (await txt(page, '.big')).trim() === await state(page, (S, v) => GP.grade(v), rep.rating) && !/%/.test(await txt(page, '.rating')), mode + ': the report should give the show a letter grade and no percentage: ' + await txt(page, '.rating'));
  ok(await count(page, '.sheet .seg') === rep.matches && await count(page, '.sheet .angle') === rep.angles + (seen.pre ? 1 : 0), mode + ': every segment is in the report');
  ok(rep.name === shows[0] && await count(page, '[data-t="closeReport"]') === 2 && (await txt(page, '[data-t="closeReport"]')) === 'Book ' + shows[1], mode + ': the report offers the next show');
  await check('report');
  await shot(page, 'booking-' + mode + '-report', true);
  await page.click('[data-t="options"]'); await page.click('[data-t="pref"][data-k="type"]'); await page.click('#modal-ok');   // typewriter off
  await page.click('[data-t="replay"]');
  ok(await pos(page) === '-1:0' && await has(page, '#live'), mode + ': replay');
  ok(!(await has(page, '#live .untyped')) && /main event/.test(await typed(page)), mode + ': with the typewriter off the line is there at once');
  await page.click('#live-go'); ok((await pos(page)).startsWith('0:'), mode + ': with the typewriter off one click moves on');
  await page.click('[data-t="live-end"]'); await page.click('#live-go');
  ok(await has(page, '.big') && !(await has(page, '#live')), mode + ': back at the report after the replay');
  await check('replay');
  await page.click('[data-t="closeReport"]');
  ok(await txt(page, '.head h1') === shows[1] && /The card is empty/.test(await txt(page, '.cols')), mode + ': closing the report opens the second show');
  await check('close the report');

  /* ---- the second show, then Week booked ---- */
  await page.click('[data-t="suggest"]');
  const seen2 = await runShow(page, mode, check);
  await page.click('[data-t="live-end"]'); await page.click('#live-go');
  ok(await has(page, '.panel [data-t="endweek"]') && await has(page, '[data-t="replay"]') && !(await has(page, '[data-t="closeReport"]')), mode + ': the last report offers the end of the week');
  await check('second report');
  await page.keyboard.press('Escape');                                      // Back closes the report
  ok(await txt(page, '.head h1') === 'Week booked' && await count(page, '[data-t="report"]') === 2, mode + ': Week booked');
  await check('week booked');
  await shot(page, 'booking-' + mode + '-weekbooked', true);
  await page.click('[data-t="report"][data-v="1"]');                        // the first show's report, from the schedule
  ok(await txt(page, '.head h1') === shows[0] && await has(page, '.big'), mode + ': a report opened from the schedule');
  await check('report from the schedule');
  await page.click('.menu [data-t="tab"][data-v="booking"]');
  ok(await txt(page, '.head h1') === 'Week booked', mode + ': the Booking button leaves the report');
  ok(!errs.length, mode + ': ' + errs.join(' | '));
  console.log(mode, 'ok:', steps.length, 'steps, no overflow, no errors.', 'First show: pre-show incident', seen.pre ? 'yes' : 'no', '· headset call yes.', 'Second show: pre-show', seen2.pre ? 'yes' : 'no', '· headset', seen2.chaos ? 'yes' : 'no');
  await browser.close();
}

/** The couch: arrows and Enter only. */
async function tv() {
  const { browser, page, errs } = await open({ mode: 'tv', file: FILE });
  const key = async k => { await page.keyboard.press(k); await page.waitForTimeout(25); };
  const focusT = () => page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-t'));
  await go(page, 'booking');
  await page.waitForTimeout(50);
  ok(await focusT() === 'suggest', 'tv: the highlight should start on Suggest a card, not ' + await focusT());
  await key('Enter');
  ok(await count(page, '.sheet .seg') >= 3, 'tv: Enter should suggest a card');
  await key('ArrowDown'); ok(/^(edit|up|down|rm|bk|promo-open|seg-edit|seg-rm)$/.test(await focusT()), 'tv: down should move into the page, not to ' + await focusT());
  await key('ArrowUp'); ok(/^(suggest|add|seg-new|clear)$/.test(await focusT()), 'tv: up should come back to the top row, not ' + await focusT());
  ok(await overflow(page) === '', 'tv card: ' + await overflow(page));
  await shot(page, 'booking-tv-card');
  await page.click('[data-t="advance"]');
  let presses = 0, pre = false, chaos = false;
  for (let k = 0; k < 8 && !(await has(page, '#live')); k++) {       // a pre-show incident or a headset call: the highlight is already on the first answer
    const t = await focusT(); ok(t === 'pre' || t === 'chaos', 'tv: the highlight should be on an answer, not ' + t + '. Message: ' + await flash(page));
    if (t === 'pre') pre = true; else chaos = true;
    await key('Enter');
    if (!(await has(page, '[data-t="pre"]')) && !(await has(page, '.win')) && !(await has(page, '#live'))) await page.click('[data-t="advance"]');
  }
  ok(await has(page, '#live'), 'tv: the broadcast should start');
  ok(await overflow(page) === '', 'tv title card: ' + await overflow(page));
  await shot(page, 'booking-tv-live');
  while (await has(page, '#live')) { ok(await page.evaluate(() => document.activeElement.id) === 'live-go' && await goInView(page), 'tv: the highlight should stay on the continue button, on screen'); await key('Enter'); if (++presses > 900) throw new Error('tv: the broadcast never ended'); }
  ok(await has(page, '.big') && await overflow(page) === '', 'tv report: ' + await overflow(page));
  ok(await focusT() === 'closeReport', 'tv: the highlight should land on the next show button, not ' + await focusT());
  ok(!errs.length, 'tv: ' + errs.join(' | '));
  console.log('tv ok: suggested and ran a show with arrows and Enter (' + presses + ' presses through the broadcast' + (pre ? ', pre-show incident answered' : '') + (chaos ? ', headset call answered' : '') + '), no overflow, no errors.');
  await browser.close();
}

(async () => { await section('desk'); await section('tablet'); if (process.env.TV) await tv(); else console.log('tv: the remote walk is parked while the booking screen is rebuilt (run with TV=1)'); console.log('booking: all passed'); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
