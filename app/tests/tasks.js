/* This week's tasks on the desk, and how they hold a show and the week until they are done or waved off.
   Run: NODE_PATH=<dir containing playwright> node app/tests/tasks.js   (MODES=desk,tv) */
const { open, go, overflow, shot, state, flash } = require('./helper');
const MODES = (process.env.MODES || 'desk,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));
const rows = (page, st) => page.$$eval('.tasks .task' + (st ? '.' + st : ''), L => L.map(e => e.getAttribute('data-task')));

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw', gate: true });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    /* a new game answers its opening inbox first, so the list is about the week */
    await state(page, S => { S.inbox.filter(e => !e.done).forEach(e => window.GP.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
      // the test wants one sponsor offer that can be signed, whatever the seed dealt
      if (!S.spOffers.some(o => window.GP.sponsorOk(S, o)) && S.spOffers[0]) S.spOffers[0].type = 'rating'; });
    await page.evaluate(() => { window.EWF_FLAT = 1; });   // the desk shows four tasks to a page; the test wants them all
    await go(page, 'desk');
    const todo = await rows(page, 'todo');
    ok(mode, 'the desk lists this week’s tasks', /This week.s tasks/i.test(await txt(page, '[data-t="task-win"]')) && ['desk-pbp', 'desk-col', 'sponsors'].every(id => todo.indexOf(id) >= 0), todo.join(', '));
    ok(mode, 'Book the next show waits for them', await page.$eval('[data-t="book-next"]', e => e.disabled) && /tasks first: 3 to do/.test(await txt(page, '[data-t="book-wait"]')), await txt(page, '[data-t="book-wait"]'));
    ok(mode, 'the note says a show cannot run', /3 to do/.test(await txt(page, '[data-t="task-win"] .ttl')) && /A show cannot run until those marked ! are done or left for later/.test(await txt(page, '[data-t="task-note"]')), await txt(page, '[data-t="task-note"]'));
    await over('the desk with tasks');
    await shot(page, 'tasks-' + mode, true);
    /* the booking page says the same thing and will not run the show */
    await go(page, 'booking');
    ok(mode, 'the booking page lists what is still on the desk', /On your desk before this show can run/.test(await txt(page, '[data-t="gate-note"]')));
    await over('the booking page with the note');
    await page.click('[data-t="suggest"]');
    ok(mode, 'the card has no Run button of its own', !(await has(page, '[data-t="run"]')));
    await page.click('[data-t="advance"]');
    ok(mode, 'the big button will not run the show: it leads to the desk', await has(page, '.tasks') && await state(page, S => S.qi) === 0);
    await go(page, 'booking');
    await page.click('[data-t="gate-desk"]');
    ok(mode, 'the note takes you back to the desk', await has(page, '.tasks'));
    /* do one: the button goes to the place, and doing it ticks the task */
    await page.click('[data-t="task-go"][data-v="desk-pbp"]');
    await page.waitForSelector('[data-t="desk-hire"]');
    ok(mode, 'the commentary desk opens as a pop-up, without leaving the Office', await has(page, '.win [data-t="voice-pool"]') && await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk' && await page.$eval('.win', e => e.getBoundingClientRect().bottom <= innerHeight + 1) && await page.$eval('[data-t="voice-chair"].on', e => e.getAttribute('data-v')) === 'pbp');
    await page.click('[data-t="desk-hire"]');
    ok(mode, 'signing says who took the chair and moves on to the empty one', /takes the play-by-play chair/.test(await txt(page, '[data-t="voice-msg"]')) && await page.$eval('[data-t="voice-chair"].on', e => e.getAttribute('data-v')) === 'col' && await has(page, '[data-t="voice-chair"][data-v="pbp"][data-full="1"]'));
    await page.click('[data-t="modal-close"]');
    ok(mode, 'the desk can open it again at any time', await has(page, '[data-t="open-voices"]'));
    await go(page, 'desk');
    ok(mode, 'a finished task says what was done', /A play-by-play voice is in the chair/.test(await txt(page, '.tasks .task.done')));
    await page.click('[data-t="desk-more"]'); await page.click('[data-t="more-tab"][data-v="week"]');
    ok(mode, 'the other Book this show button waits too', /After this week.s tasks/.test(await txt(page, '[data-t="desk-more-body"]')) && !(await has(page, '[data-t="book-show"]')));
    await page.keyboard.press('Escape');
    ok(mode, 'signing a voice ticks the task', (await rows(page, 'done')).indexOf('desk-pbp') >= 0 && (await rows(page, 'todo')).indexOf('desk-pbp') < 0);
    /* wave one off, put it back, wave it again */
    await page.click('[data-t="task-wave"][data-v="desk-col"]');
    ok(mode, 'Not this week sets a task aside', (await rows(page, 'waved')).indexOf('desk-col') >= 0 && /Left for another week/.test(await flash(page)), await flash(page));
    await page.click('[data-t="task-unwave"][data-v="desk-col"]');
    ok(mode, 'Put it back brings it back', (await rows(page, 'todo')).indexOf('desk-col') >= 0);
    await page.click('[data-t="task-wave"][data-v="desk-col"]');
    await page.click('[data-t="task-go"][data-v="sponsors"]');
    await page.waitForSelector('[data-t="sp-accept"]');
    ok(mode, 'the sponsor task opens the offers in a pop-up over the desk', await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk' && !!(await page.$('.win [data-t="sp-accept"]')));
    for (let i = 0; i < 3; i++) { if (!(await page.$('.win'))) { const tg = await page.$('[data-t="task-go"][data-v="sponsors"]'); if (!tg) break; await tg.click(); } if (!(await page.$('[data-t="sp-accept"]'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); } const b = await page.$('[data-t="sp-accept"]:not([disabled])'); if (!b) break; await b.click(); await page.waitForTimeout(60); }
    for (let i = 0; i < 3 && await page.$('.win'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
    await go(page, 'desk');
    ok(mode, 'signing the sponsors ticks the task', (await rows(page, 'done')).indexOf('sponsors') >= 0, (await rows(page)).join(', '));
    ok(mode, 'with nothing left to do the show can be booked', !(await page.$eval('[data-t="book-next"]', e => e.disabled)) && !(await has(page, '[data-t="book-wait"]')) && /Everything that had to be done is done/.test(await txt(page, '[data-t="task-note"]')));
    await over('the desk with tasks done');
    await page.click('[data-t="book-next"]');
    ok(mode, 'and the booking page has no note', !(await has(page, '[data-t="gate-note"]')));
    /* a vacant title: the card may open, the show may not run until the belt is on the card or a tournament starts */
    await state(page, S => { S.promos[S.player].titles[0].holders = []; S.card = []; });
    await go(page, 'desk');
    ok(mode, 'a vacant title is a task, and the card still opens to answer it', (await rows(page, 'todo')).some(id => /^title-/.test(id)) && !(await page.$eval('[data-t="book-next"]', e => e.disabled)));
    await page.click('[data-t="task-go"][data-v^="title-"]'); await page.waitForSelector('.win [data-t="tt-tourn"]');
    ok(mode, 'the vacant title is answered in a pop-up on the desk: a tournament or a match on the card', await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk' && (await page.$$('.win [data-t="tt-tourn"]')).length === 2 && !!(await page.$('.win [data-t="tt-book"]')) && /vacant/i.test(await txt(page, '.win')));
    await page.keyboard.press('Escape'); await page.waitForTimeout(60);
    /* a contract about to end is answered on the desk too */
    const cid = await state(page, S => { const w = window.GP.rosterOf(S, S.player).filter(x => !x.nw).sort((a, b) => b.ovr - a.ovr)[6]; w.con = 1; return w.id; });
    await go(page, 'desk'); await page.click('[data-t="task-go"][data-v="con-' + cid + '"]'); await page.waitForSelector('.win [data-t="tc-renew"]');
    const ask = await txt(page, '.win'); await page.click('.win [data-t="tc-renew"][data-v="48"]'); await page.waitForTimeout(80);
    ok(mode, 'a contract ending is a pop-up with the price, and signing ticks the task', /\$[\d,]+ a week/.test(ask) && /re-signs/.test(await txt(page, '.win')) && await state(page, (S, id) => S.w[id].con === 48, cid));
    for (let i = 0; i < 3 && await page.$('.win'); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
    ok(mode, 'and the desk is still the page', await page.evaluate(() => window.EWF_DEBUG.ui.page) === 'desk' && (await rows(page, 'done')).indexOf('con-' + cid) >= 0);
    /* the owner's letter can be read again from the desk */
    await page.click('[data-t="open-letter"]'); await page.waitForSelector('[data-t="welcome"]');
    ok(mode, 'the owner’s letter opens again from the desk, already written out', /the job/i.test(await txt(page, '[data-t="welcome"]')) && /Put it away/.test(await txt(page, '[data-t="welcome-go"]')) && await page.$eval('[data-t="welcome"] .tx-l', e => getComputedStyle(e).opacity === '1'));
    await page.click('[data-t="welcome-go"]'); await page.waitForTimeout(60);
    await page.click('[data-t^="task-wave"][data-v^="title-"]');
    /* the rule can be turned off in Options */
    await page.click('[data-t="task-unwave"][data-v="desk-col"]');
    ok(mode, 'an open task holds the show again', await page.$eval('[data-t="book-next"]', e => e.disabled));
    await state(page, S => { window.GP.setGate(S, false); });
    await go(page, 'desk');
    ok(mode, 'with the rule off the tasks are reminders only', !(await page.$eval('[data-t="book-next"]', e => e.disabled)) && /Reminders only/.test(await txt(page, '[data-t="task-note"]')));
    await state(page, S => { window.GP.setGate(S, true); });
    /* the week cannot end with an inbox matter open */
    await state(page, S => { window.GP.taskWave(S, 'desk-col'); S.qi = S.queue.length; S.inbox.push({ id: 99999, type: 'x', text: 'A test matter.', choices: ['Yes', 'No'], done: false }); });
    await go(page, 'desk');
    ok(mode, 'End the week waits for the inbox', await page.$eval('[data-t="endweek"]', e => e.disabled) && (await rows(page, 'todo')).indexOf('inbox') >= 0);
    await state(page, S => { S.inbox = S.inbox.filter(e => e.id !== 99999); });
    await go(page, 'desk');
    ok(mode, 'and opens once it is answered', !(await page.$eval('[data-t="endweek"]', e => e.disabled)));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'tasks-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('tasks: all passed');
})();
