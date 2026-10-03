/* The notification bar ("X will remember that") and what a wrestler card says about relationships.
   Run: NODE_PATH=<dir containing playwright> node app/tests/relations.js   (MODES=desk,phone,tv) */
const { open, go, overflow, shot, state, redraw } = require('./helper');
const MODES = (process.env.MODES || 'desk,phone,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    await go(page, 'roster');
    ok(mode, 'nothing is announced at the start of a game', !(await has(page, '[data-t="toast"][data-v="note"]')));
    const who = await state(page, S => { const a = S.w.find(w => w.name === 'King Arthur'), b = S.w.find(w => w.name === 'Sir Lancelot'); S.toasts.length = 0; window.GP.youRemember(S, a.id, 'test', 'You stopped the match when they were hurt.', 35); window.GP.relBump(S, a.id, b.id, { bond: -130 }, { k: 'test', keep: true, t: 'Sir Lancelot walked out on King Arthur in the middle of a tag match.' }); return { a: a.id, b: b.id }; });
    await redraw(page);
    await page.waitForSelector('[data-t="toast"][data-v="note"]');
    const first = await txt(page, '[data-t="toast"]');
    ok(mode, 'the bar says who will remember what you did', /KING ARTHUR WILL REMEMBER THAT/i.test(first) && /stopped the match/.test(first) && (mode === 'phone' || /\+1 more/.test(first)), first.replace(/\n/g, ' '));
    ok(mode, 'a kind memory is green', await page.$eval('[data-t="toast"]', e => e.classList.contains('good')));
    await over('the notification bar');
    await shot(page, 'relations-bar-' + mode);
    await page.click('[data-t="toast"]');
    const second = await txt(page, '[data-t="toast"]');
    ok(mode, 'pressing it moves to the next: two friends now have heat', /KING ARTHUR AND SIR LANCELOT HAVE REAL HEAT NOW/i.test(second) && await page.$eval('[data-t="toast"]', e => e.classList.contains('bad')), second.replace(/\n/g, ' '));
    await page.click('[data-t="toast"]');
    ok(mode, 'then the status bar comes back', !(await has(page, '[data-t="toast"]')) && await has(page, '[data-t="options"]'));
    /* the card */
    await go(page, 'titles');
    await page.locator('[data-t="who"]', { hasText: 'King Arthur' }).first().click();
    await page.waitForSelector('[data-t="rel-notes"]');
    ok(mode, 'the card lists what he remembers', /walked out on/.test(await txt(page, '[data-t="rel-notes"]')));
    ok(mode, 'and where you stand with him', /On your side/.test(await txt(page, '[data-t="rel-you"]')) && /stopped the match/.test(await txt(page, '[data-t="rel-you"]')));
    ok(mode, 'Sir Lancelot has moved from friend to enemy on the card', /Does not get on with[\s\S]*Sir Lancelot/.test(await txt(page, '.cards .wb')));
    await over('the card');
    await shot(page, 'relations-card-' + mode);
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'relations-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('relations: all passed');
})();
