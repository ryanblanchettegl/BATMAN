/* Booking: the Clock Wall (book by hand, Who fits, option pop-ups, notes pop-ups), the run flow (pre-show incident), the live broadcast and its calls from the gorilla position, report.
   Build:  EWF_OUT=next-booking EWF_DEV=1 node build.js
   Run:    NODE_PATH=/opt/npm-tools/node_modules node app/tests/booking.js */
const { open, go, overflow, shot, flash, state, fits, airShow } = require('./helper');
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
/** Is the SPACE key on screen, at the right end of the bottom line? It is the only way forward on a broadcast. */
const goInView = page => page.evaluate(() => { const g = document.querySelector('[data-t="advance"]').getBoundingClientRect(), st = document.querySelector('.ffoot').getBoundingClientRect(); return g.top >= st.top - 1 && g.bottom <= innerHeight + 1 && g.right <= innerWidth + 1 && g.width > 40 && g.left > innerWidth / 2; });
const focusAdv = page => page.evaluate(() => !!document.activeElement && document.activeElement.getAttribute('data-t') === 'advance');
const advWord = page => page.$eval('[data-t="advance"] b', e => e.innerText.replace(/\s+/g, ' ').trim());
/** What to do when a call from the gorilla position comes up while the test is walking the show. Set by section(). */
let onCall = null;
/** Advance the broadcast one step. The first press may only finish the line being typed, so press until it moves. A call that comes up is answered. */
async function advance(page, how) {
  const from = await pos(page);
  for (let k = 0; k < 4; k++) {
    if (how === 'click') await page.click('[data-t="advance"]'); else await page.keyboard.press(how);
    await page.waitForTimeout(25);
    if (await has(page, '[data-t="live-call"]')) { await onCall(); return; }
    if (await pos(page) !== from) { if (await page.$('#live') && !(await goInView(page))) throw new Error('the big button is off screen at ' + await pos(page)); return; }
  }
  throw new Error('the broadcast did not advance with ' + how + ' from ' + from);
}
/** Press Run and answer whatever stands in the way before the bell. Returns what happened: { pre }. */
async function runShow(page, mode, check) {
  const seen = { pre: false };
  ok(!(await has(page, '[data-t="run"]')) && !(await has(page, '[data-t="asst"]')) && !(await has(page, '[data-t="asstrun"]')), mode + ': the card has no Run or assistant buttons of its own');
  ok(await page.$eval('[data-t="advance"]', e => e.getAttribute('data-v') + ':' + e.querySelector('b').innerText.trim().toLowerCase() + ':' + e.getAttribute('data-tone')) === 'run:ring bell:air', mode + ': the key should say Ring bell, in green');
  await page.click('[data-t="advance"]');
  for (let k = 0; k < 6 && !(await has(page, '#live')); k++) {
    if (await has(page, '[data-t="pre"]')) {
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
  const check = async name => { const o = await overflow(page); ok(o === '', mode + ' / ' + name + ': ' + o); const f = await fits(page); ok(f === '', mode + ' / ' + name + ' should fit one screen: ' + f); ok(!errs.length, mode + ' / ' + name + ': ' + errs.join(' | ')); steps.push(name); };
  const seg = i => '.sheet .seg[data-m="' + i + '"]';   // a match row; promos and angles sit between them

  /* ---- the Clock Wall: book by hand ---- */
  await go(page, 'booking');
  const shows = await state(page, S => S.queue.map(q => q.name));
  ok(shows.length >= 2, mode + ': expected two shows this week');
  ok(await txt(page, '[data-t="book1"] h1') === shows[0], mode + ': heading should be the first show');
  ok(await has(page, '.onescreen') && await has(page, '[data-t="wall-roster"]') && await has(page, '[data-t="wall-pick-pane"]'), mode + ': the Clock Wall is a one-screen page of three windows');
  ok(/\d+ min open/i.test(await txt(page, '[data-t="wall-open"]')), mode + ': an empty show is all open time: ' + await txt(page, '[data-t="wall-open"]'));
  ok(/^Crowd: an? [a-z- ]+$/i.test(await txt(page, '[data-t="expect"]')) && /^[★¼½¾]+$/.test(await txt(page, '[data-t="expect-bar"]')), mode + ': what the crowd expects is in words and stars, not a number: ' + await txt(page, '[data-t="expect"]'));
  await check('empty card');
  await page.click('[data-t="add"]');
  ok(await state(page, S => S.card.length) === 1 && await count(page, '[data-t="wall-hole"]') === 2, mode + ': + Match puts a match with two empty spots on the wall');
  const w1 = await page.$eval('[data-t="wall-wr"]', e => +e.getAttribute('data-v'));
  await page.click('[data-t="wall-wr"][data-v="' + w1 + '"]');
  ok(await page.$eval('[data-t="wall-wr"][data-v="' + w1 + '"]', e => e.getAttribute('aria-pressed')) === 'true', mode + ': pressing a wrestler holds them');
  await page.click('[data-t="wall-hole"]');
  ok(await state(page, (S, id) => S.card[0].sides[0][0] === id, w1), mode + ': pressing a spot books the held wrestler there');
  ok(await has(page, '[data-t="wall-fits"]') && await count(page, '[data-t="wall-fit"]') >= 3, mode + ': an empty spot shows who fits it');
  await page.click('[data-t="wall-fit"]');
  ok(await state(page, S => S.card[0].sides.every(s => s.every(id => id != null))), mode + ': Who fits books straight in');
  ok(!/%/.test(await txt(page, '[data-t="wall-mast"]')), mode + ': the expected winner is in words: ' + await txt(page, '[data-t="wall-mast"]'));
  await check('booked by hand');
  await page.click('[data-t="wall-tile"][data-v="rules"]');
  const stip = await page.$eval('#m0-stip', e => [...e.options].map(o => o.value).find(v => v !== 'std'));
  await page.selectOption('#m0-stip', stip);
  ok(await state(page, S => S.card[0].stip) === stip, mode + ': the Rules tile changes the rules');
  await page.click('#modal-ok');
  await page.click('[data-t="wall-tile"][data-v="finish"]');
  ok(!/%/.test(await page.$eval('#m0-call', e => [...e.options].map(o => o.text).join('|'))), mode + ': the Finish pop-up says chances in words');
  await page.selectOption('#m0-call', '0');
  ok(await state(page, S => S.card[0].call) === 0 && await state(page, S => GP.cardCost(S, S.card)) === 0, mode + ': picking a winner costs no booking power');
  await page.click('#modal-ok');
  await check('options');
  await page.click('[data-t="wall-unbook"]');
  ok(await state(page, S => S.card[0].sides.some(s => s.some(id => id == null))), mode + ': the cross takes somebody off the card');
  await page.click('[data-t="rm"]');
  ok(await state(page, S => S.card.length) === 0, mode + ': Remove takes the match off the wall');

  /* ---- a suggested card, each piece picked ---- */
  await page.click('[data-t="suggest"]');
  const n = await state(page, S => S.card.length);
  ok(n >= 3 && await count(page, '.cw-pc.match') === n, mode + ': suggested card');
  ok(await plant(page), mode + ': could not plant a headset call');
  for (let i = 0; i < n; i++) { await page.click('[data-t="edit"][data-v="' + i + '"]'); ok(/no read|No read|cannot tell|Nothing to flag|My read|Hard to read|not a regular team|running on fumes|squash|bad way|new pairing|first time/i.test(await txt(page, '[data-t="agent-say"][data-v="' + i + '"]')), mode + ': picking match ' + (i + 1) + ' should show the road agent’s comment on it: ' + await txt(page, '[data-t="agent-say"]')); await check('match ' + (i + 1) + ' picked'); }
  ok(await has(page, '[data-t="wall-knock"]'), mode + ': what this card changes is beside the wall');
  if (mode === 'desk') await shot(page, 'booking-desk-wall', true);

  /* ---- order, and an unfinished card ---- */
  const who = i => state(page, (S, k) => S.card[k].sides.map(s => s.join('+')).join('v'), i), a = await who(0), b = await who(1);
  await page.click('[data-t="edit"][data-v="0"]');
  ok(await page.$eval('[data-t="up"]', e => e.disabled), mode + ': the first match cannot move earlier');
  await page.click('[data-t="down"]');
  ok(await who(0) === b && await who(1) === a, mode + ': move down');
  await page.click('[data-t="up"]');
  ok(await who(0) === a && await who(1) === b, mode + ': move up');
  await check('move');
  await page.click('[data-t="add"]');
  await page.click('[data-t="advance"]');
  ok(/can’t run yet/.test(await flash(page)), mode + ': an unfinished card should not run');
  await check('validation');
  await page.click('[data-t="edit"][data-v="' + n + '"]');
  await page.click('[data-t="rm"]');
  ok(await state(page, S => S.card.length) === n, mode + ': remove a match');

  /* ---- the booking notes, each in its pop-up ---- */
  for (const t of ['promo', 'feuds', 'targets', 'order', 'clock', 'advice']) {
    await page.click('[data-t="bk"][data-v="' + t + '"]');
    ok(await has(page, '[data-t="pane"][data-v="' + t + '"]'), mode + ': the ' + t + ' notes open in a pop-up');
    if (t === 'promo') {
      const sp = await page.$eval('#plan-sp', e => e.options[1].value);
      await page.selectOption('#plan-sp', sp);
      ok(await state(page, (S, v) => S.plan && S.plan.sp === +v, sp), mode + ': opening promo plan');
    }
    await check('notes: ' + t);
    await page.click('#modal-ok');
  }
  await shot(page, 'booking-' + mode + '-card', true);

  /* ---- run it: pre-show incident if there is one, then the planted headset call ---- */
  await state(page, S => { GP.fitShow(S, S.card); });   // the edits above changed what is on the clock: make the show fit its time again
  await go(page, 'booking');
  const seen = await runShow(page, mode, check);
  /* a call from the gorilla position: the show stops on it, Enter and the big button answer nothing, a choice does */
  const calls = [];
  onCall = async () => {
    const k = await page.$eval('[data-t="live-call"]', e => e.getAttribute('data-v')), nth = calls.push(k);
    ok(!(await has(page, '[data-t="live-skip"]')) && !(await has(page, '[data-t="live-end"]')), mode + ': a call has no skip button');
    ok(await count(page, '[data-t="live-pick"]') >= 2 && (await txt(page, '.callbox .q')).length > 20, mode + ': a call should ask a question and offer at least two answers');
    ok(/^YOUR CALL$/i.test(await page.$eval('[data-t="advance"] b', e => e.innerText.replace(/\s+/g, ' ').trim())), mode + ': the big button should say Your call');
    ok(await page.$eval('[data-t="night"] .nt-r.now .st', e => e.innerText) === 'Your call', mode + ': tonight’s run sheet should mark where the call is');
    await check('call: ' + k);
    if (nth === 1) await shot(page, 'booking-' + mode + '-call');
    await page.keyboard.press('Enter'); await page.click('[data-t="advance"]');
    ok(await has(page, '[data-t="live-call"]'), mode + ': Enter and the big button should not answer a call');
    await page.waitForTimeout(430);
    const bp = await state(page, S => S.bp), cost = await state(page, S => S.live.ev.choices[0].bp || 0), evId = await state(page, S => S.live.ev.id);
    if (nth === 1) await page.keyboard.press('1'); else await page.click('[data-t="live-pick"][data-c="0"]');   // the number keys answer too
    // a second call can come up at once for the same match (trouble on the air does not use up the night's calls), so "taken" means this call is no longer the one waiting
    const gone = await state(page, (S, id) => !S.live || !S.live.ev || S.live.ev.done || S.live.ev.id !== id, evId);
    ok(gone && await state(page, S => S.live.log.length) === nth && await state(page, S => S.bp) >= bp - cost, mode + ': the answer should be taken, logged and paid for (' + k + ', waiting ' + await state(page, S => S.live && S.live.ev && !S.live.ev.done ? S.live.ev.kind : 'nothing') + ', log ' + await state(page, S => S.live.log.length) + ' of ' + nth + ', bp ' + bp + ' - ' + cost + ' -> ' + await state(page, S => S.bp) + ')');
    ok(await has(page, '#live .ln.call'), mode + ': what the call led to should be on the broadcast');
  };
  const partial = await typed(page);   // the line types itself out in under half a second, so read it before the checks below
  ok(await state(page, S => !!S.live && S.card.length > 0), mode + ': the show should be on the air');
  ok(await pos(page) === '-1:0' && /^RING BELL$/i.test(await advWord(page)), mode + ': the title card, and the big button says Ring bell: ' + await advWord(page));
  ok(await focusAdv(page), mode + ': the big button should have focus');
  ok(!(await has(page, '#live .foot button:not([data-t="live-auto"]):not([data-t="live-pics"]):not([data-t="live-pace"])')), mode + ': the broadcast has no continue button of its own');
  ok(await page.$eval('[data-t="adv-tip"]', e => getComputedStyle(e).display) === 'none', mode + ': the big button’s note stays shut on a broadcast');
  ok(!(await has(page, '[data-t="live-end"]')), mode + ': a show on the air cannot be skipped');
  ok(await page.$eval('[data-t="advance"]', e => e.getAttribute('data-v') + ':' + e.getAttribute('data-live')) === 'live:title', mode + ': on the air the big button belongs to the show');
  await go(page, 'roster');
  ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'booking' && /on the air/.test(await flash(page)), mode + ': nobody leaves the gorilla position while the show is on the air');
  ok(await count(page, '[data-t="night"] .nt-r') === await state(page, S => S.live.st.steps.length) && await count(page, '[data-t="night"] .nt-r.seen') === 0, mode + ': tonight’s run sheet should list everything booked, with nothing aired yet');
  await check('title card');
  await shot(page, 'booking-' + mode + '-titlecard', true);

  /* ---- the broadcast: button, Enter, Space, Esc, Back ---- */
  await page.waitForTimeout(1500);
  const whole = await typed(page);
  ok(whole.length > partial.length && /main event/.test(whole), mode + ': the last line should type itself out (' + partial.length + ' then ' + whole.length + ')');
  await advance(page, 'click');
  ok(await pos(page) !== '-1:0' && (await pos(page)).startsWith('0:') && await flash(page) === '-', mode + ': first segment, message cleared');
  // a click while a line is still typing finishes that line and does not move on
  const lastLine = () => typed(page);
  let finished = false;
  for (let k = 0; k < 80 && !(await has(page, '#live .result')); k++) {
    const at = await pos(page), part = await lastLine();
    const whole = await state(page, (S, a) => { const q = a.split(':'), bc = (S.live ? S.live.st.rep : S.reports[0]).segs[+q[0]].bc || []; return bc[+q[1]] ? bc[+q[1]].x : ''; }, at);
    if (!finished && whole.length - part.length > 45) {
      const t0 = Date.now(); await page.$eval('[data-t="advance"]', e => e.click());   // not page.click: Playwright would wait out anything sitting over the button
      const now = await pos(page), shown = await lastLine();
      ok(now === at && shown === whole, mode + ': a click while typing should finish the line, not skip it (' + at + ' -> ' + now + ', had ' + part.length + ' of ' + whole.length + ', click took ' + (Date.now() - t0) + 'ms, shows ' + shown.length + ')');
      finished = true;
    }
    if (k === 2) { await check('a line of commentary'); await shot(page, 'booking-' + mode + '-live', true); }
    await advance(page, 'click');
  }
  ok(finished, mode + ': never caught a line mid-typing');
  ok(await has(page, '#live .result'), mode + ': first segment result');
  ok(await focusAdv(page), mode + ': focus stays on the big button');
  ok(/^(NEXT|SIGN OFF)$/i.test(await advWord(page)) && await has(page, '[data-t="advance"][data-live="next"]') , mode + ': with a result showing the big button says Next: ' + await advWord(page));
  ok(await count(page, '[data-t="night"] .nt-r.seen') === 1 && /★|¼|½|¾/.test(await txt(page, '[data-t="night"] .nt-r.seen .st')), mode + ': the run sheet should show stars for what has aired, and only that');
  await check('segment result (button)');
  if (mode === 'desk') {   // a game saved with the show on the air comes back on the air, where it had got to
    const at = await state(page, S => S.live.st.k + ':' + S.live.log.length);
    await page.reload(); await page.waitForSelector('[data-t="continue"]'); await page.click('[data-t="continue"]'); await page.waitForSelector('main.main');
    ok(await has(page, '#live') && await state(page, S => S.live.st.k + ':' + S.live.log.length) === at && await has(page, '#live .result'), mode + ': a save taken on the air should load back on the air');
    await check('loaded on the air');
  }
  await shot(page, 'booking-' + mode + '-result', true);
  await advance(page, 'Enter');                                             // Enter on the focused button
  ok((await pos(page)).startsWith('1:'), mode + ': Enter should move to the second segment');
  await page.evaluate(() => document.activeElement.blur());
  await advance(page, 'Enter');                                             // Enter with nothing focused
  await page.evaluate(() => document.activeElement.blur());
  await advance(page, ' ');
  ok(await focusAdv(page), mode + ': the big button takes focus back');
  await page.keyboard.press('b'); ok(await has(page, '#live'), mode + ': page shortcuts wait until the show is over');
  await page.keyboard.press('Escape');                                      // Esc skips to the result
  ok(await has(page, '#live .result'), mode + ': Esc should skip to the result');
  await check('segment result (Enter, Esc)');
  await advance(page, 'Enter');
  if (!(await has(page, '#live .result'))) { await page.evaluate(() => window.EWF_DEBUG.pad('b')); ok(await has(page, '#live .result'), mode + ': Back should skip to the result'); }
  if (await has(page, '[data-t="live-skip"]')) throw new Error(mode + ': no skip button once the result is showing');
  const rest = await airShow(page, { report: false, onCall: async () => { await onCall(); } }).catch(e => { throw new Error(mode + ': ' + e.message); });
  ok(await txt(page, '#live .bar span:last-child') === 'Sign-off' && await has(page, '#live[data-v="signoff"]') && /^REPORT$/i.test(await advWord(page)), mode + ': the show should reach its sign-off, and the big button says Report: ' + await advWord(page));
  ok(calls.includes('chaos'), mode + ': the planted trouble should have come up in its match. Calls: ' + calls.join(', '));
  ok(await state(page, S => !S.live && (S.reports[0].calls || []).length) === calls.length, mode + ': every call made should be on the report');
  await check('sign-off');
  await shot(page, 'booking-' + mode + '-signoff', true);

  /* ---- After the show: where a show ends. Not the match-by-match report. ---- */
  await page.click('[data-t="advance"]');
  ok(await has(page, '[data-t="after-screen"]') && !(await has(page, '.sheet')) && !(await has(page, '#live')) && await txt(page, '.head h1') === shows[0], mode + ': the sign-off leads to After the show, not to the report');
  ok(/^(A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/.test((await txt(page, '[data-t="after-grade"]')).trim()) && !/%/.test(await txt(page, '[data-t="after-verdict"]')), mode + ': it gives the show a letter grade and a verdict in words');
  // the list turns pages when a matter is open above it: read every page
  const nextPg = '[data-t="after-lpg"] [data-t="pg-next"]:not([disabled])', prevPg = '[data-t="after-lpg"] [data-t="pg-prev"]:not([disabled])';
  const seek = async k => { while (await has(page, prevPg)) await page.click(prevPg); while (!(await has(page, '[data-t="after-item"][data-v="' + k + '"]')) && await has(page, nextPg)) await page.click(nextPg); };
  let items = []; while (await has(page, prevPg)) await page.click(prevPg);
  for (;;) { items = items.concat(await page.$$eval('[data-t="after-item"]', a => a.map(e => e.getAttribute('data-v')))); if (!(await has(page, nextPg))) break; await page.click(nextPg); }
  await seek('gate');
  ok(['gate', 'tv', 'writers'].every(k => items.includes(k)) && /tickets/.test(await txt(page, '[data-t="after-item"][data-v="gate"]')), mode + ': it lists the gate, the television number and the writers: ' + items.join(', '));
  await seek('writers');
  await page.click('[data-t="after-look"][data-v="writers"]');
  ok(await has(page, '[data-t="night-detail"][data-v="writers"]') && !(await has(page, '.win')), mode + ': picking one shows it beside the list, on the same screen');
  ok(/^OFFICE$/i.test(await advWord(page)), mode + ': the big button leads on to the Office: ' + await advWord(page));
  await check('after the show');
  await shot(page, 'booking-' + mode + '-after', true);
  /* ---- the report, match by match, is one press from there ---- */
  await page.click('[data-t="after-full"]');
  const rep = await state(page, S => ({ rating: S.reports[0].rating, name: S.reports[0].name, matches: S.reports[0].segs.filter(s => s.k === 'match').length, angles: S.reports[0].segs.filter(s => s.k !== 'match').length }));
  ok(!(await has(page, '#live')) && await txt(page, '.head h1') === rep.name && /^(A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/.test((await txt(page, '.big')).trim()) && (await txt(page, '.big')).trim() === await state(page, S => GP.repGrade(S.reports[0])) && !/%/.test(await txt(page, '.rating')), mode + ': the report should give the show a letter grade and no percentage: ' + await txt(page, '.rating'));
  ok(await count(page, '.sheet .seg') === rep.matches && await count(page, '.sheet .angle') === rep.angles + (seen.pre ? 1 : 0), mode + ': every segment is in the report');
  ok(rep.name === shows[0] && await count(page, '[data-t="closeReport"]') === 2 && (await txt(page, '[data-t="closeReport"]')) === 'Back to After the show' && /^RECAP$/i.test(await advWord(page)), mode + ': the report leads back to After the show: ' + await advWord(page));
  await check('report');
  await shot(page, 'booking-' + mode + '-report', true);
  await page.click('[data-t="options"]'); await page.click('[data-t="pref"][data-k="type"]'); await page.click('#modal-ok');   // typewriter off
  await page.click('[data-t="replay"]');
  ok(await pos(page) === '-1:0' && await has(page, '#live'), mode + ': replay');
  ok(!(await has(page, '#live .untyped')) && /main event/.test(await typed(page)), mode + ': with the typewriter off the line is there at once');
  await page.click('[data-t="advance"]'); ok((await pos(page)).startsWith('0:'), mode + ': with the typewriter off one click moves on');
  await page.click('[data-t="live-end"]'); await page.click('[data-t="advance"]');
  ok(await has(page, '.big') && !(await has(page, '#live')), mode + ': back at the report after the replay');
  await check('replay');
  await page.click('[data-t="closeReport"]');
  ok(await has(page, '[data-t="after-screen"]'), mode + ': closing the report goes back to After the show');
  /* done with After the show: the Office, with Before the show first and a button that comes back */
  await page.click('[data-t="advance"]');
  ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk' && await has(page, '.deskpage [data-t="road"]') && await has(page, '.deskpage [data-t="next"]') && !(await has(page, '[data-t="after-show"]')), mode + ': then the Office, with the road and the next show');
  ok((await page.$eval('[data-t="night-recap"]', e => e.getAttribute('aria-label'))) === 'After the show recap', mode + ': the Office has a button back to After the show');
  await page.click('[data-t="night-recap"]');
  ok(await has(page, '[data-t="after-screen"]') && await txt(page, '.head h1') === shows[0], mode + ': and it goes back there');
  await page.click('[data-t="advance"]');
  ok(/^BOOK SHOW$/i.test(await advWord(page)), mode + ': from the desk the big button leads to the next show: ' + await advWord(page));
  await page.click('[data-t="book-next"]');
  ok(await txt(page, '[data-t="book1"] h1') === shows[1] && /\d+ min open/i.test(await txt(page, '[data-t="wall-open"]')), mode + ': the next show’s card is one press from the desk');
  await check('close the report');

  /* ---- the second show, then Week booked ---- */
  await page.click('[data-t="suggest"]');
  const seen2 = await runShow(page, mode, check);
  onCall = null; const calls2 = await airShow(page);
  ok(await has(page, '[data-t="replay"]') && (await txt(page, '[data-t="closeReport"]')) === 'Back to After the show', mode + ': the last show of the week ends the same way');
  await check('second report');
  await page.keyboard.press('Escape');                                      // Back closes the report
  ok(await has(page, '[data-t="after-screen"]') && await txt(page, '.head h1') === shows[1], mode + ': Back closes the last report to After the show');
  await page.click('[data-t="advance"]');
  ok(await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk' && await has(page, '[data-t="endweek"]'), mode + ': and the Office offers the end of the week');
  await go(page, 'booking');
  ok(await txt(page, '.head h1') === 'Week booked' && await count(page, '[data-t="report"]') === 2, mode + ': Week booked');
  await check('week booked');
  await shot(page, 'booking-' + mode + '-weekbooked', true);
  await page.click('[data-t="report"][data-v="1"]');                        // the first show's report, from the schedule
  ok(await txt(page, '.head h1') === shows[0] && await has(page, '.big'), mode + ': a report opened from the schedule');
  await check('report from the schedule');
  await page.click('.menu [data-t="tab"][data-v="booking"]');
  ok(await txt(page, '.head h1') === 'Week booked', mode + ': the Booking button leaves the report');
  ok(!errs.length, mode + ': ' + errs.join(' | '));
  console.log(mode, 'ok:', steps.length, 'steps, no overflow, no errors.', 'First show: pre-show incident', seen.pre ? 'yes' : 'no', '· calls', calls.join(', ') + '.', 'Second show: pre-show', seen2.pre ? 'yes' : 'no', '· calls', calls2.join(', ') || 'none');
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
  let presses = 0, pre = false, chaos = 0;
  for (let k = 0; k < 8 && !(await has(page, '#live')); k++) {       // a pre-show incident: the highlight is already on the first answer
    const t = await focusT(); ok(t === 'pre', 'tv: the highlight should be on an answer, not ' + t + '. Message: ' + await flash(page));
    pre = true;
    await key('Enter');
    if (!(await has(page, '[data-t="pre"]')) && !(await has(page, '.win')) && !(await has(page, '#live'))) await page.click('[data-t="advance"]');
  }
  ok(await has(page, '#live'), 'tv: the broadcast should start');
  ok(await overflow(page) === '', 'tv title card: ' + await overflow(page));
  await shot(page, 'booking-tv-live');
  while (await has(page, '#live')) {
    if (await has(page, '[data-t="live-call"]')) { chaos++; await page.waitForTimeout(430); ok(await focusT() === 'live-pick', 'tv: on a call the highlight should be on the first answer, not ' + await focusT()); await key('Enter'); continue; }
    ok(await focusT() === 'advance' && await goInView(page), 'tv: the highlight should stay on the big button, on screen, not ' + await focusT()); await key('Enter'); if (++presses > 900) throw new Error('tv: the broadcast never ended'); }
  ok(await has(page, '.big') && await overflow(page) === '', 'tv report: ' + await overflow(page));
  ok(await focusT() === 'closeReport', 'tv: the highlight should land on the next show button, not ' + await focusT());
  ok(!errs.length, 'tv: ' + errs.join(' | '));
  console.log('tv ok: suggested and ran a show with arrows and Enter (' + presses + ' presses through the broadcast' + (pre ? ', pre-show incident answered' : '') + (chaos ? ', ' + chaos + ' calls answered' : '') + '), no overflow, no errors.');
  await browser.close();
}

(async () => { await section('desk'); await section('big'); if (process.env.TV) await tv(); else console.log('tv: the remote walk is parked while the booking screen is rebuilt (run with TV=1)'); console.log('booking: all passed'); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
