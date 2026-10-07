/* The ADVANCE key: one key at the right end of the bottom line, SPACE and one or two words, that always leads to the
   next thing the week needs. Its colour says what kind of step it is. When this week's tasks are in the way it says
   Attention and leads to the desk, where the tasks that cannot be skipped are marked. The numbers on the left say how
   they moved; Help, Options and Music are small keys beside it; notifications show at the top under the menu.
   Run: NODE_PATH=<dir containing playwright> node app/tests/advance.js   (MODES=desk,tv) */
const { open, go, overflow, shot, state, flash, redraw } = require('./helper');
const MODES = (process.env.MODES || 'desk,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText.replace(/\s+/g, ' ')).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));
const adv = page => page.$eval('[data-t="advance"]', e => ({ k: e.getAttribute('data-v'), tone: e.getAttribute('data-tone'), bg: getComputedStyle(e.querySelector('.lab')).backgroundColor, t: e.querySelector('b').innerText.replace(/\s+/g, ' ').trim(), tip: e.querySelector('[data-t="adv-tip"]').textContent })).catch(() => ({ k: '', tone: '', bg: '', t: '', tip: '' }));
const COL = { go: 'rgb(255, 255, 85)', stop: 'rgb(170, 0, 0)', air: 'rgb(0, 170, 0)', home: 'rgb(255, 255, 255)', end: 'rgb(0, 170, 170)' };
const toned = (a, tone) => a.tone === tone && a.bg === COL[tone];
const pageId = page => page.evaluate(() => window.EWF_DEBUG.ui.page);
const press = async page => { await page.click('[data-t="advance"]'); await page.waitForTimeout(40); };

/** Carry one show from "run" to its report using only the button, answering whatever stops it on the way. */
async function runShow(page, mode) {
  await press(page);
  for (let i = 0; i < 6 && !(await has(page, '#live')); i++) {
    if (await has(page, '[data-t="pre"]')) { await page.click('[data-t="pre"][data-c="0"]'); await page.waitForTimeout(40); if (!(await has(page, '.win')) && !(await has(page, '#live'))) await press(page); }
    else if ((await adv(page)).k === 'book') { await page.click('[data-t="suggest"]'); await press(page); }
    else await press(page);
    await page.waitForTimeout(60);
  }
  ok(mode, 'the button ran the show', await has(page, '#live'), await flash(page));
  ok(mode, 'on the air, the button carries the show forward', (await adv(page)).k === 'live' && /^RING BELL$/i.test((await adv(page)).t), (await adv(page)).t);
  ok(mode, 'the key is green to ring the bell', toned(await adv(page), 'air'), JSON.stringify(await adv(page)));
  let asked = false;
  for (let i = 0; i < 900 && await has(page, '#live'); i++) {
    if (await has(page, '[data-t="live-call"]')) {   // a call from the gorilla position: the button names it and waits, it does not answer
      if (!asked) { asked = true; await press(page); const a = await adv(page); ok(mode, 'when the gorilla position needs an answer the key says Your call in red, and pressing it answers nothing', /^YOUR CALL$/i.test(a.t) && toned(a, 'stop') && await has(page, '[data-t="live-call"]'), JSON.stringify(a)); }
      await page.waitForTimeout(430); await page.click('[data-t="live-pick"][data-c="0"]'); continue;
    }
    await press(page);
  }
  ok(mode, 'pressing it through the broadcast, and answering each call, reaches After the show', !(await has(page, '#live')) && await has(page, '[data-t="after-screen"]'));
}

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', gate: true });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    await state(page, S => { S.inbox.filter(e => !e.done).forEach(e => window.GP.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
      // the test wants one sponsor offer that can be signed, whatever the seed dealt
      if (!S.spOffers.some(o => window.GP.sponsorOk(S, o)) && S.spOffers[0]) S.spOffers[0].type = 'rating'; });
    await go(page, 'desk');
    let a = await adv(page);
    ok(mode, 'when something needs you, the key just says Attention, in red', a.k === 'task' && /^ATTENTION$/i.test(a.t) && toned(a, 'stop'), JSON.stringify(a));
    ok(mode, 'the note is closed until the pointer or the highlight is on the key', await page.$eval('[data-t="adv-tip"]', e => getComputedStyle(e).display === 'none'));
    await page.hover('[data-t="advance"]');
    ok(mode, 'resting the pointer on it says what needs you, in a note that opens over the key and stays on the screen', await page.$eval('[data-t="adv-tip"]', e => { const r = e.getBoundingClientRect(), k = e.parentElement.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && /play-by-play voice/.test(e.innerText) && /sponsor/.test(e.innerText) && r.right <= window.innerWidth + 1 && r.left >= -1 && r.top >= 0 && r.bottom <= k.top + 1; }), await txt(page, '[data-t="adv-tip"]'));
    ok(mode, 'the note is a grey window, not a black box', await page.$eval('[data-t="adv-tip"]', e => getComputedStyle(e).backgroundColor === 'rgb(170, 170, 170)' && getComputedStyle(e).color === 'rgb(0, 0, 0)'));
    await page.mouse.move(5, 5);
    ok(mode, 'it is the right end of the bottom line, and nothing floats over the menu', await page.evaluate(() => { const e = document.querySelector('.ffoot .status > [data-t="advance"]'); if (!e || document.querySelector('.ftop [data-t="advance"]') || document.querySelector('.adv')) return false; const b = e.getBoundingClientRect(), s = document.querySelector('.ffoot .status').getBoundingClientRect(); return Math.abs(b.right - s.right) <= 1 && b.top >= s.top - 1 && b.bottom <= s.bottom + 1 && e === document.querySelector('.ffoot .status').lastElementChild && b.width > 100; }));
    ok(mode, 'its cap names the key that presses it: ' + (mode === 'tv' ? 'Play on a remote' : 'the space bar'), (await txt(page, '[data-t="advance"] .cap')) === (mode === 'tv' ? 'PLAY' : 'SPACE'), await txt(page, '[data-t="advance"] .cap'));
    ok(mode, 'the menu bar keeps its own height: one row of tabs', await page.evaluate(() => { const m = document.querySelector('.ftop .menu').getBoundingClientRect(), t = document.querySelector('.menu [data-t="tab"]').getBoundingClientRect(); return m.height < t.height * 1.4; }));
    ok(mode, 'the company and the date sit at the right end of the menu bar, with nothing over them', await page.evaluate(() => { const t = document.querySelector('.menu .ttl').getBoundingClientRect(), m = document.querySelector('.menu').getBoundingClientRect(), top = document.elementFromPoint(t.right - 4, (t.top + t.bottom) / 2); return m.right - t.right < 40 && !!top && !!top.closest('.menu'); }));
    ok(mode, 'its words are one or two', (a.t.split(' ').length <= 2));
    ok(mode, 'Help, Options and Music are small keys on the bottom line, beside the big one', await page.evaluate(() => { const k = document.querySelector('[data-t="advance"]').getBoundingClientRect(); return ['help', 'options', 'music'].every(n => { const e = document.querySelector('.ffoot .status .tools [data-t="' + n + '"]'); if (!e) return false; const r = e.getBoundingClientRect(); return r.left > window.innerWidth * 0.3 && r.right <= k.left + 1 && r.top > window.innerHeight * 0.6; }) && !document.querySelector('.menu [data-t="options"]'); }));
    ok(mode, 'the bottom line is one line, and nothing on it is cut off or sticks out', await page.evaluate(() => { const s = document.querySelector('.ffoot .status'), r = s.getBoundingClientRect(); return s.scrollWidth - s.clientWidth <= 1 && r.height < parseFloat(getComputedStyle(s).fontSize) * 2.2 && [...s.querySelectorAll('[data-t="stat"], .tools button, [data-t="advance"]')].every(e => { const q = e.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1 && q.top >= r.top - 1 && q.bottom <= r.bottom + 1; }); }));
    ok(mode, 'before the first show the numbers say nothing about moving', !(await has(page, '[data-t="moved"]')));
    ok(mode, 'there is no strip of things to do at the bottom: only the one line', !(await has(page, '[data-t="dock"]')) && !(await has(page, '[data-t="adv-chip"]')) && await page.evaluate(() => document.querySelector('.ffoot').children.length === 1));
    const must = await page.$$eval('.tasks .task.must', L => L.map(e => e.getAttribute('data-task')));
    ok(mode, 'on the desk, the tasks that cannot be skipped are marked', must.length === 3 && await page.$$eval('.tasks .task.must', L => L.every(e => /MUST DO/i.test(e.innerText) && !!e.querySelector('.mark') && getComputedStyle(e).borderLeftWidth === '4px')) && (await page.$$('.tasks .task.optional.must')).length === 0, must.join(', '));
    ok(mode, 'what is coming up is on the desk too', /All Hallows.? Eve in 3 weeks/.test(await txt(page, '[data-t="coming"]')), await txt(page, '[data-t="coming"]'));
    await over('the desk');
    await shot(page, 'advance-' + mode);
    /* it guides: pressing it goes to the place */
    await go(page, 'roster');
    await press(page);
    await page.waitForTimeout(80);
    ok(mode, 'pressing Attention goes to the desk, with the list in view and flashing', await pageId(page) === 'desk' && await page.evaluate(() => { const b = document.querySelector('.tasks'), r = b.getBoundingClientRect(); return b.classList.contains('hit') && r.top < window.innerHeight && r.bottom > 0; }), await pageId(page));
    await press(page);
    ok(mode, 'pressing it again there says how many need you', /3 things on your desk need you first/.test(await flash(page)), await flash(page));
    await page.click('[data-t="task-go"][data-v="desk-pbp"]');
    await page.waitForSelector('[data-t="desk-hire"]');
    await page.click('[data-t="desk-hire"]'); await page.click('[data-t="modal-close"]');
    a = await adv(page);
    ok(mode, 'doing it moves the note to the next thing', a.k === 'task' && /^ATTENTION$/i.test(a.t) && /colour voice/.test(a.tip) && !/play-by-play/.test(a.tip), a.tip);
    await state(page, S => { const E = window.GP; E.taskWave(S, 'desk-col'); E.taskWave(S, 'sponsors'); });
    await redraw(page);
    a = await adv(page);
    ok(mode, 'with the tasks done or waved off it says Book show, in yellow', a.k === 'book' && /^BOOK SHOW$/i.test(a.t) && toned(a, 'go') && /Book Wednesday Night Folio/.test(a.tip) && /Wednesday/.test(a.tip), a.t + ' / ' + a.tip);
    await press(page);
    ok(mode, 'and takes you to the card', await pageId(page) === 'booking' && await has(page, '[data-t="suggest"]'));
    await press(page);
    ok(mode, 'on an empty card it says how to start', /Suggest a card/.test(await flash(page)), await flash(page));
    await page.click('[data-t="suggest"]');
    a = await adv(page);
    ok(mode, 'with a card that can run, it says Run show, in green', a.k === 'run' && /^RUN SHOW$/i.test(a.t) && toned(a, 'air') && /Run Wednesday Night Folio/.test(a.tip), JSON.stringify(a));
    await over('the card');
    await go(page, 'roster');
    ok(mode, 'away from the card it offers to open it', /^OPEN CARD$/i.test((await adv(page)).t), (await adv(page)).t);
    await press(page);
    ok(mode, 'and does', await pageId(page) === 'booking');
    /* the show, start to finish, on the one button */
    await runShow(page, mode);
    a = await adv(page);
    ok(mode, 'the show ends on After the show, and the key points on to the Office, in white', await has(page, '[data-t="after-screen"]') && a.k === 'desk' && /^OFFICE$/i.test(a.t) && toned(a, 'home') && /Before the show/.test(a.tip), a.t + ' / ' + a.tip);
    ok(mode, 'the numbers now say how they have moved this week', await page.evaluate(() => { const L = [...document.querySelectorAll('.ffoot .status [data-t="moved"]')]; return L.length === 3 && L.every(e => /^(▲|▼) |^steady$/.test(e.textContent)) && /this week so far/.test(document.querySelector('[data-t="stat"][data-v="cash"]').getAttribute('aria-label')); }), await txt(page, '.ffoot .status'));
    ok(mode, 'and what they say is true of the game', await state(page, S => { const M = window.GP.moved(S), P = S.promos[S.player]; return !!M && M.now && Math.abs(M.cash.d - Math.round(P.cash - S.was.cash)) < 1 && S.was.w === S.week; }));
    ok(mode, 'up is dark green, down dark red, steady grey', await page.$$eval('.ffoot .status [data-t="moved"]', L => L.every(e => getComputedStyle(e).color === ({ '1': 'rgb(0, 96, 0)', '-1': 'rgb(170, 0, 0)', '0': 'rgb(85, 85, 85)' })[e.getAttribute('data-v')])));
    await over('After the show, with the numbers moved');
    await press(page);
    ok(mode, 'pressing it goes to the Office, where Before the show comes first', await pageId(page) === 'desk' && !(await has(page, '[data-t="after-show"]')) && await has(page, '[data-t="night-recap"]'));
    a = await adv(page);
    ok(mode, 'after the first show a sponsor has to be signed: the button says Attention and says why', a.k === 'task' && /^ATTENTION$/i.test(a.t) && /first sponsor/.test(a.tip), a.t + ' / ' + a.tip);
    ok(mode, 'the task is marked Required and cannot be left for another week', /required/i.test(await txt(page, '[data-task="sponsors"]')) && !(await has(page, '[data-t="task-wave"][data-v="sponsors"]')));
    await state(page, S => { const E = window.GP; E.acceptSponsor(S, S.spOffers.findIndex(o => E.sponsorOk(S, o))); }); await redraw(page);
    a = await adv(page);
    ok(mode, 'from the desk it points at the next show', a.k === 'book' && /^BOOK SHOW$/i.test(a.t) && /Book Saturday Serial/.test(a.tip), a.t + ' / ' + a.tip);
    await press(page);
    ok(mode, 'pressing it opens the next card', await has(page, '[data-t="suggest"]'));
    await page.click('[data-t="suggest"]');
    await runShow(page, mode);
    ok(mode, 'the last show of the week ends the same way', /^OFFICE$/i.test((await adv(page)).t));
    await press(page);
    /* the end of the week */
    await state(page, S => { S.inbox.filter(e => !e.done).forEach(e => window.GP.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); Object.keys({ a: 1 }).forEach(() => { window.GP.tasks(S).list.filter(t => t.state === 'todo' && t.waive).forEach(t => window.GP.taskWave(S, t.id)); }); });
    await redraw(page);
    a = await adv(page);
    ok(mode, 'with every show run it says End week, in teal', a.k === 'week' && /^END WEEK$/i.test(a.t) && toned(a, 'end'), JSON.stringify(a));
    await press(page);
    await page.waitForSelector('.win');
    ok(mode, 'pressing it ends the week and shows what happened', await state(page, S => S.week) === 2 && /week/i.test(await txt(page, '.win')));
    ok(mode, 'the new week opens on what last week did to the numbers', await state(page, S => S.was.w === 2 && S.wasPrev.w === 1 && !window.GP.moved(S).now) && /over last week/.test(await page.$eval('[data-t="stat"][data-v="cash"]', e => e.getAttribute('aria-label'))) && /^(▲|▼) \$/.test(await txt(page, '[data-t="stat"][data-v="cash"] [data-t="moved"]')), await txt(page, '.ffoot .status'));
    await page.click('[data-t="modal-close"]');
    a = await adv(page);
    ok(mode, 'and the new week starts the button over', (a.k === 'task' || a.k === 'book') && !/END WEEK/i.test(a.t), a.t);
    /* the space bar */
    await go(page, 'roster');
    const before = await pageId(page);
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press(' ');
    await page.waitForTimeout(60);
    ok(mode, 'the space bar presses it', await pageId(page) !== before, before + ' -> ' + await pageId(page));
    /* the notification bar is at the top, under the menu, and the key stays put at the bottom */
    await state(page, S => { const w = S.w.find(x => x.promo === S.player && !x.nw); S.toasts.length = 0; window.GP.youRemember(S, w.id, 'test', 'You stopped the match when they were hurt.', 30); });
    await redraw(page);
    await page.waitForSelector('[data-t="toast"]');
    ok(mode, 'a notification shows at the top of the screen, under the menu', await page.evaluate(() => { const t = document.querySelector('[data-t="toast"]'), m = document.querySelector('.menu').getBoundingClientRect(), r = t.getBoundingClientRect(); return !!t.closest('.ftop') && r.top >= m.bottom - 1 && r.top < window.innerHeight / 2; }));
    ok(mode, 'and the key stays where it is, at the bottom right', await page.evaluate(() => { const b = document.querySelector('[data-t="advance"]').getBoundingClientRect(); return b.top > window.innerHeight * 0.8 && b.right > window.innerWidth * 0.8; }));
    await over('the page with a notification');
    await shot(page, 'advance-note-' + mode);
    for (let i = 0; i < 8 && await has(page, '[data-t="toast"]'); i++) { await page.click('[data-t="toast"]'); await page.waitForTimeout(40); }
    ok(mode, 'pressing the notifications clears them', !(await has(page, '[data-t="toast"]')));
    /* F2 and F3 are Options and Music */
    await page.keyboard.press('F2'); await page.waitForSelector('.win');
    ok(mode, 'F2 opens Options', /options/i.test(await txt(page, '.win .wt span')));
    await page.keyboard.press('Escape');
    await page.keyboard.press('F3'); await page.waitForTimeout(150);
    ok(mode, 'F3 opens the jukebox', await has(page, '.jk'));
    const jc = await page.$('.jk [data-jk="close"]'); if (jc) await jc.click();
    /* a game that is over has no key */
    await state(page, S => { S.over = { why: 'fired', week: S.week }; });
    await redraw(page);
    ok(mode, 'when the game is over the button is gone', !(await has(page, '[data-t="advance"]')) && await has(page, '.ffoot [data-t="options"]'));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n').slice(0, 22).join(' // ')); await shot(page, 'advance-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('advance: all passed');
})();
