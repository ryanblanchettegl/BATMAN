/* Storylines on the card, on screen (src/99-tale.js, src/99-ringside.js, src/99-tutorial.js): the first show is the
   tutorial, the arc's ending is decided on the run sheet and plays after the main event, storyline matches are red,
   a match takes a guest on commentary and a run-in, and a promised match cannot come off the card.
   Run: NODE_PATH=<dir containing playwright> node app/tests/tale.js */
const { open, go, fits, state, airShow, shot } = require('./helper');
const MODES = (process.env.MODES || 'desk').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail && !pass ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const has = async (page, sel) => !!(await page.$(sel));

async function run(mode) {
  const { browser, page, errs } = await open({ mode, tut: true, gate: true, pics: true });
  try {
    const st = await state(page, S => ({ q: S.queue.map(x => x.big), wk: window.GP.cal(S.week).wom, flag: S.promos[S.player].flagship === window.GP.cal(S.week).month }));
    ok(mode, 'a new game opens in the week of the biggest show of the year, with only that show', st.q.length === 1 && st.q[0] && st.wk === 4 && st.flag, JSON.stringify(st));
    await go(page, 'booking'); await page.waitForTimeout(300);
    ok(mode, 'the booking screen opens on the first show’s steps', await has(page, '[data-t="tut-steps"]'));
    ok(mode, 'the promised match is on the run sheet already, in red', await has(page, '.b1-rows .seg.story [data-t="row-story"]') && await has(page, '[data-t="row-promised"]'));
    ok(mode, 'the arc is on the run sheet, waiting for a decision', (await page.$$eval('[data-t="row-arc"]', L => L.map(e => e.textContent).join(''))).indexOf('Decide') >= 0);
    ok(mode, 'the booking screen fits with the steps', !(await fits(page)), await fits(page));
    // the show cannot go on the air until the champions are booked and the arc is decided
    const gate0 = await state(page, S => window.GP.taskGate(S, 'show').left.join(' | '));
    ok(mode, 'unbooked champions and an undecided arc stop the show', /champion/.test(gate0) && /arc/.test(gate0), gate0);
    await page.click('[data-t="tut-titles"]'); await page.waitForTimeout(200);
    ok(mode, 'Title matches books the champions', await state(page, S => window.GP.tutInfo(S).steps.find(x => x.k === 'champs').done));
    await page.click('[data-t="tut-suggest"]'); await page.waitForTimeout(200);
    ok(mode, 'Suggest fills around them and keeps the promise', await state(page, S => window.GP.tutInfo(S).steps.find(x => x.k === 'champs').done && S.card.some(m => m.pm != null)));
    // the promised match cannot be removed
    const pi = await state(page, S => S.card.findIndex(m => m.pm != null));
    await page.click('[data-t="edit"][data-v="' + pi + '"]'); await page.waitForTimeout(150);
    ok(mode, 'the editor says the match was promised, and holds the promised wrestler', await has(page, '[data-t="ed-promised"]') && await page.$eval('[data-t="slot"][data-i="' + pi + '"]', e => e.disabled).catch(() => false));
    await page.click('[data-t="rm"][data-v="' + pi + '"]'); await page.waitForTimeout(150);
    ok(mode, 'Remove leaves a promised match on the card', await state(page, S => S.card.some(m => m.pm != null)));
    // a guest on commentary and a run-in, from the editor
    await page.click('[data-t="edit"][data-v="0"]'); await page.waitForTimeout(150); if (!(await has(page, '[data-t="gc"]'))) await page.click('[data-t="edit"][data-v="0"]');
    const opts = await page.$$eval('select[data-t="gc"] option', L => L.map(o => o.value).filter(Boolean));
    await page.selectOption('select[data-t="gc"]', opts[0]); await page.selectOption('select[data-t="ri"]', opts[1]);
    ok(mode, 'a match takes a guest on commentary and a run-in', await state(page, S => S.card[0].gc != null && S.card[0].ri != null));
    ok(mode, 'the booking screen fits with the match editor open', !(await fits(page)), await fits(page));
    await shot(page, 'tale-' + mode + '-editor');
    // decide the arc's ending
    const ai = await state(page, S => window.GP.segInfo(S).list.findIndex(x => x.k === 'arc'));
    await page.click('[data-t="seg-edit"][data-v="' + ai + '"]'); await page.waitForTimeout(150);
    ok(mode, 'the arc opens beside the run sheet with its question and three answers', (await page.$$('[data-t="arc-pick"]')).length === 3);
    await page.click('[data-t="arc-pick"][data-v="1"]'); await page.waitForTimeout(150);
    ok(mode, 'an answer is picked', await state(page, S => S.sa.ch === 1) && await has(page, '[data-t="arc-pick"][data-v="1"][aria-pressed="true"]'));
    ok(mode, 'the booking screen fits with the arc open', !(await fits(page)), await fits(page));
    await shot(page, 'tale-' + mode + '-arc');
    await page.click('[data-t="arc-story"]'); await page.waitForTimeout(150);
    ok(mode, 'The story so far lists the chapters before you took the book', (await page.$$eval('[data-t="arc-hist"] li', L => L.length)) === 3);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    const gate1 = await state(page, S => window.GP.taskGate(S, 'show').left.join(' | '));
    ok(mode, 'with the champions booked and the arc decided, nothing of the show’s stops it', !/champion|arc/.test(gate1), gate1);
    // on the air: the ending plays after the main event, with its own scene, the way it was decided
    await state(page, S => window.GP.setGate(S, false));
    for (let k = 0; k < 6 && !(await has(page, '#live')); k++) { if (await has(page, '[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(60); }
    ok(mode, 'the show goes on the air', await has(page, '#live'));
    const seen = new Set(); let calls = [];
    calls = await airShow(page, { report: false, onCall: async () => {} });
    const rep = await state(page, S => { const r = (S.live && S.live.st && S.live.st.rep) || S.reports[0]; const segs = r.segs || [], last = segs[segs.length - 1]; return { last: last && last.arc ? last.arc : null, beat: last && last.beat, mainBefore: segs.length > 1 && segs[segs.length - 2].k === 'match', gc: segs.some(x => x.gc != null), ri: segs.some(x => x.ri != null) }; });
    ok(mode, 'the arc ends after the main event, the way it was decided', rep.last && rep.last.ch === 1 && rep.last.you && rep.mainBefore && rep.beat === 'payoff', JSON.stringify(rep));
    ok(mode, 'the booked run-in was a call on the air', calls.indexOf('bookrun') >= 0, calls.join(','));
    ok(mode, 'the guest was on commentary and the run-in happened', rep.gc && rep.ri, JSON.stringify(rep));
    ok(mode, 'no errors', !errs.length, errs.join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, e.message); }
  await browser.close();
}
(async () => { for (const m of MODES) await run(m); console.log(fails.length ? 'FAILED: ' + fails.length : 'all storyline checks passed'); process.exit(fails.length ? 1 : 0); })();
