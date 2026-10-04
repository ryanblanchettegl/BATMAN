/* The ADVANCE button: one big button, top right, one or two words, that always leads to the next thing the week
   needs. When this week's tasks are in the way it says Attention and leads to the desk, where the tasks that cannot
   be skipped are marked. Options, Help and Music are bottom right; notifications show at the top under the menu.
   Run: NODE_PATH=<dir containing playwright> node app/tests/advance.js   (MODES=desk,tv) */
const { open, go, overflow, shot, state, flash, redraw } = require('./helper');
const MODES = (process.env.MODES || 'desk,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText.replace(/\s+/g, ' ')).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));
const adv = page => page.$eval('[data-t="advance"]', e => ({ k: e.getAttribute('data-v'), t: e.querySelector('b').innerText.replace(/\s+/g, ' ').trim(), tip: e.querySelector('[data-t="adv-tip"]').textContent })).catch(() => ({ k: '', t: '', tip: '' }));
const pageId = page => page.evaluate(() => window.EWF_DEBUG.ui.page);
const press = async page => { await page.click('[data-t="advance"]'); await page.waitForTimeout(40); };

/** Carry one show from "run" to its report using only the button, answering whatever stops it on the way. */
async function runShow(page, mode) {
  await press(page);
  for (let i = 0; i < 6 && !(await has(page, '#live-go')); i++) {
    if (await has(page, '.win [data-t="chaos"]')) await page.click('.win [data-t="chaos"][data-c="0"]');
    else if (await has(page, '[data-t="pre"]')) { await page.click('[data-t="pre"][data-c="0"]'); await page.waitForTimeout(40); if (!(await has(page, '.win')) && !(await has(page, '#live-go'))) await press(page); }
    else if ((await adv(page)).k === 'book') { await page.click('[data-t="suggest"]'); await press(page); }
    else await press(page);
    await page.waitForTimeout(60);
  }
  ok(mode, 'the button ran the show', await has(page, '#live-go'), await flash(page));
  ok(mode, 'on the air, the button carries the show forward', (await adv(page)).k === 'live' && /^CONTINUE$/i.test((await adv(page)).t), (await adv(page)).t);
  for (let i = 0; i < 900 && await has(page, '#live-go'); i++) { await press(page); }
  ok(mode, 'pressing it through the broadcast reaches the report', !(await has(page, '#live-go')) && await has(page, '[data-t="match-stars"]'));
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
    ok(mode, 'when something needs you, the button just says Attention', a.k === 'task' && /^ATTENTION$/i.test(a.t), a.t);
    ok(mode, 'the note is closed until the pointer or the highlight is on the button', await page.$eval('[data-t="adv-tip"]', e => getComputedStyle(e).display === 'none'));
    await page.hover('[data-t="advance"]');
    ok(mode, 'resting the pointer on it says what needs you', await page.$eval('[data-t="adv-tip"]', e => getComputedStyle(e).display !== 'none' && /play-by-play voice/.test(e.innerText) && /sponsor/.test(e.innerText) && e.getBoundingClientRect().right <= window.innerWidth + 1 && e.getBoundingClientRect().left >= -1), await txt(page, '[data-t="adv-tip"]'));
    await page.mouse.move(5, 5);
    ok(mode, 'it sits at the top right, in the menu, and it is big', await page.evaluate(() => { const e = document.querySelector('.ftop > [data-t="advance"]'); if (!e || document.querySelector('.menu [data-t="advance"]')) return false; const b = e.getBoundingClientRect(), m = document.querySelector('.ftop .menu').getBoundingClientRect(), tab = document.querySelector('.menu [data-t="tab"]'); return b.top >= m.top - 1 && b.top < m.bottom && b.bottom > m.bottom && b.right > window.innerWidth * 0.8 && parseFloat(getComputedStyle(e.querySelector('b')).fontSize) > parseFloat(getComputedStyle(tab).fontSize) * 1.05; }));
    ok(mode, 'the menu bar keeps its own height: one row of tabs' + (mode === 'phone' ? ', two on a phone' : ''), await page.evaluate(ph => { const m = document.querySelector('.ftop .menu').getBoundingClientRect(), t = document.querySelector('.menu [data-t="tab"]').getBoundingClientRect(); return m.height < t.height * (ph ? 2.4 : 1.4); }, mode === 'phone'));
    ok(mode, 'and the button covers none of the tabs', await page.evaluate(() => { const b = document.querySelector('[data-t="advance"]').getBoundingClientRect(); return [...document.querySelectorAll('.menu [data-t="tab"]')].every(t => { const r = t.getBoundingClientRect(); return r.right <= b.left + 1 || r.bottom <= b.top + 1 || r.top >= b.bottom - 1; }); }));
    ok(mode, 'its words are one or two', (a.t.split(' ').length <= 2));
    ok(mode, 'Options, Help and Music are at the bottom right', await page.evaluate(() => ['options', 'help', 'music'].every(k => { const e = document.querySelector('.ffoot .status [data-t="' + k + '"]'); return !!e && e.getBoundingClientRect().left > window.innerWidth * 0.3 && e.getBoundingClientRect().top > window.innerHeight * 0.6; }) && !document.querySelector('.menu [data-t="options"]')));
    ok(mode, 'there is no strip of things to do at the bottom: only the status line', !(await has(page, '[data-t="dock"]')) && !(await has(page, '[data-t="adv-chip"]')) && await page.evaluate(() => document.querySelector('.ffoot').children.length === 1));
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
    ok(mode, 'with the tasks done or waved off it says Book show', a.k === 'book' && /^BOOK SHOW$/i.test(a.t) && /Book Wednesday Night Folio/.test(a.tip) && /Wednesday/.test(a.tip), a.t + ' / ' + a.tip);
    await press(page);
    ok(mode, 'and takes you to the card', await pageId(page) === 'booking' && await has(page, '[data-t="suggest"]'));
    await press(page);
    ok(mode, 'on an empty card it says how to start', /Suggest a card/.test(await flash(page)), await flash(page));
    await page.click('[data-t="suggest"]');
    a = await adv(page);
    ok(mode, 'with a card that can run, it says Run show', a.k === 'run' && /^RUN SHOW$/i.test(a.t) && /Run Wednesday Night Folio/.test(a.tip), a.t);
    await over('the card');
    await go(page, 'roster');
    ok(mode, 'away from the card it offers to open it', /^OPEN CARD$/i.test((await adv(page)).t), (await adv(page)).t);
    await press(page);
    ok(mode, 'and does', await pageId(page) === 'booking');
    /* the show, start to finish, on the one button */
    await runShow(page, mode);
    a = await adv(page);
    ok(mode, 'after the show it points at the next one', a.k === 'book' && /^BOOK SHOW$/i.test(a.t) && /Book Saturday Serial/.test(a.tip), a.t + ' / ' + a.tip);
    await press(page);
    ok(mode, 'pressing it closes the report and opens the next card', await has(page, '[data-t="suggest"]') && !(await has(page, '[data-t="match-stars"]')));
    await page.click('[data-t="suggest"]');
    await runShow(page, mode);
    /* the end of the week */
    await state(page, S => { S.inbox.filter(e => !e.done).forEach(e => window.GP.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); Object.keys({ a: 1 }).forEach(() => { window.GP.tasks(S).list.filter(t => t.state === 'todo' && t.waive).forEach(t => window.GP.taskWave(S, t.id)); }); });
    await redraw(page);
    a = await adv(page);
    ok(mode, 'with every show run it says End week', a.k === 'week' && /^END WEEK$/i.test(a.t), a.t);
    await press(page);
    await page.waitForSelector('.win');
    ok(mode, 'pressing it ends the week and shows what happened', await state(page, S => S.week) === 2 && /week/i.test(await txt(page, '.win')));
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
    /* the notification bar is at the top now, and the button stays put under it */
    await state(page, S => { const w = S.w.find(x => x.promo === S.player && !x.nw); S.toasts.length = 0; window.GP.youRemember(S, w.id, 'test', 'You stopped the match when they were hurt.', 30); });
    await redraw(page);
    await page.waitForSelector('[data-t="toast"]');
    ok(mode, 'a notification shows at the top of the screen, under the menu', await page.evaluate(() => { const t = document.querySelector('[data-t="toast"]'), m = document.querySelector('.menu').getBoundingClientRect(), r = t.getBoundingClientRect(); return !!t.closest('.ftop') && r.top >= m.bottom - 1 && r.top < window.innerHeight / 2; }));
    ok(mode, 'and the button stays where it is', await page.evaluate(() => { const b = document.querySelector('[data-t="advance"]').getBoundingClientRect(); return b.top < 200 && b.right > window.innerWidth * 0.8; }));
    await over('the page with a notification');
    await shot(page, 'advance-note-' + mode);
    for (let i = 0; i < 8 && await has(page, '[data-t="toast"]'); i++) { await page.click('[data-t="toast"]'); await page.waitForTimeout(40); }
    ok(mode, 'pressing the notifications clears them', !(await has(page, '[data-t="toast"]')));
    /* a game that is over has no button */
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
