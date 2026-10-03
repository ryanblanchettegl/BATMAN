/* Browser run of the Manage section (Operations, House, Deals: every choice) and the Company section (Overview, Finances,
   World: information only). Desk and phone, then a short pass on TV with arrow keys.
   Build first:  EWF_OUT=next-company EWF_DEV=1 node build.js
   Run:          NODE_PATH=/opt/npm-tools/node_modules node app/tests/company.js */
const { open, go, overflow, shot, flash, state, redraw } = require('./helper');
const FILE = process.env.EWF_OUT || 'index';
const PAGES = ['manage', 'house', 'deals', 'overview', 'finances', 'world'];
/** Company is for reading: apart from the page buttons, none of its pages may offer a control. */
async function readOnly(page, mode) { for (const p of ['overview', 'finances', 'world']) { await go(page, p); const n = await count(page, 'main button:not([data-t="page"]):not([data-t="newsf"]):not(.lnk), main select, main input'); check(mode, p + ' offers no choices', n === 0, n + ' controls'); } }
const fails = [];
function check(mode, label, ok, detail) { console.log(mode.padEnd(6), ok ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!ok) fails.push(mode + ' ' + label); }
/** Nothing may stick out sideways after any step. */
async function fits(page, mode, label) { const o = await overflow(page); check(mode, label + ' fits the screen', o === '', o); }
/** Achievement pop-ups sit over the top right corner for six seconds; wait them out before clicking there. */
async function calm(page) { await page.waitForFunction(() => { const S = window.EWF_DEBUG.state(); return !document.querySelector('.status.toast') && !(S && S.toasts.length); }, null, { timeout: 20000 }); }
async function click(page, sel) {
  await calm(page);
  // asking the owner now also opens a small result pop-up; close it before the next click
  const w = await page.$('.win'); if (w && /asking/i.test(await w.innerText())) { await page.keyboard.press('Escape'); await page.waitForTimeout(60); }
  await page.click(sel);
}
/** Play `n` weeks through the engine: answer the inbox with the first choice, run the suggested cards, close the week. */
async function advance(page, n) {
  await state(page, (S, n) => { for (let w = 0; w < n && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const card = GP.suggest(S); const pr = GP.preShow(S, card); if (pr) GP.resolvePre(S, card, 0); const ch = GP.chaos(S, card); if (ch) GP.resolveChaos(S, card, 0); GP.runPlayerShow(S, card); } GP.endWeek(S); } }, n);
  await redraw(page); await calm(page);
}
async function tour(page, mode, label) { for (const p of PAGES) { await go(page, p); await page.waitForSelector('h1'); await fits(page, mode, label + ' ' + p); } }
const count = (page, sel) => page.$$eval(sel, L => L.length);
const skip = (mode, what) => console.log(mode.padEnd(6), 'skip', what);
/** The game takes its seed from the clock. Swap in the same promotion from a fixed seed so every run of this file plays out the same way.
    Set EWF_SEED to try another one. */
const SEED = +process.env.EWF_SEED || 9000;
async function reseed(page, promo, seed) {
  await state(page, (S, a) => {
    const fed = a.promo === 'OWN' ? { name: '', short: '', show: '', title: '', size: 'regional', region: 'midwest', style: 'merit', roots: 'tradition', pledge: 'chance', women: true } : null;
    const N = GP.newGame(fed ? null : a.promo, a.seed, { name: 'Ryan', diff: 'normal', fed });
    Object.keys(S).forEach(k => { delete S[k]; }); Object.assign(S, N); GP.attach(S);
  }, { promo, seed });
  await redraw(page);
}
/** Open the game on a promotion with a fixed seed. */
async function start(mode, promo, n) { const o = await open({ mode, file: FILE, promo }); await reseed(o.page, promo, SEED + n); return o; }


/* ---------- Front office as a hired booker ---------- */
async function frontOffice(page, mode) {
  await go(page, 'overview');
  check(mode, 'overview has the three gauges', await count(page, '.gauges .gp') === 3 && await count(page, '.gauges .gauge') === 3 && /Cash[\s\S]*Popularity[\s\S]*Booking power/i.test(await page.$eval('.gauges', e => e.innerText)));
  check(mode, 'ownership names the owner', /owns .*You book it/.test(await page.$eval('main', e => e.innerText)));
  check(mode, 'the overview says how the company is run', /How this company is run/i.test(await page.$eval('main', e => e.innerText)) && await count(page, '.fits li') >= 4);
  check(mode, 'overview lists the seven settings', await count(page, '.setup li') === 7);
  await readOnly(page, mode);
  await go(page, 'manage');
  check(mode, 'operations panels', await count(page, '.panel') === 15, await count(page, '.panel') + ' panels');

  // a setting change: a booker has to ask the owner, and the answer is shown
  const before = await state(page, S => S.promos[S.player].adv);
  const want = before === 1 ? 0 : 1;
  await click(page, '[data-t="co-set"][data-k="adv"][data-v="' + want + '"]');
  const lob = await flash(page), after = await state(page, S => S.promos[S.player].adv);
  check(mode, 'lobbying the owner shows a result', /agrees|says no/.test(lob), lob);
  check(mode, 'the setting follows the answer', /agrees/.test(lob) ? after === want : after === before, 'adv ' + before + ' -> ' + after);
  check(mode, 'the pressed button is the live setting', await page.$eval('[data-t="co-set"][data-k="adv"][aria-pressed="true"]', e => +e.dataset.v) === after);
  await fits(page, mode, 'after lobbying');
  await click(page, '[data-t="co-set"][data-k="adv"][data-v="' + (after === 2 ? 1 : 2) + '"]');
  check(mode, 'a second ask is turned away', /heard enough/.test(await flash(page)), await flash(page));
  await click(page, '[data-t="co-set"][data-k="adv"][data-v="' + after + '"]');
  check(mode, 'clicking the current level asks nothing', await flash(page) === '-');

  // house rules: adopt one, then scrap it
  await go(page, 'house');
  await click(page, '[data-t="house"][data-k="clean"]');
  check(mode, 'adopt a house rule', /now the rule of the house/.test(await flash(page)), await flash(page));
  check(mode, 'the rule is in force', await state(page, S => GP.houseInfo(S).on.indexOf('clean') >= 0) && await page.$eval('[data-t="house"][data-k="clean"]', e => e.innerText.trim()) === 'Scrap it');
  await fits(page, mode, 'after adopting a rule');
  await click(page, '[data-t="house"][data-k="clean"]');
  check(mode, 'scrap a house rule', /is scrapped/.test(await flash(page)), await flash(page));
  check(mode, 'other rules wait four weeks', await count(page, '[data-t="house"]:not([disabled])') === 0 && /needs 4 more weeks/.test(await page.$eval('main', e => e.innerText)));
  await fits(page, mode, 'after scrapping a rule');

  // sponsors: sign the first offer that can be signed, then end the deal
  await go(page, 'deals');
  if (await count(page, '[data-t="sp-accept"]:not([disabled])')) {
    const offers = await state(page, S => S.spOffers.length);
    await click(page, '[data-t="sp-accept"]:not([disabled])');
    check(mode, 'sign a sponsor', /is on board/.test(await flash(page)) && await state(page, S => S.sponsors.length) === 1 && await state(page, S => S.spOffers.length) === offers - 1, await flash(page));
    await fits(page, mode, 'after signing a sponsor');
    await click(page, '[data-t="sp-drop"][data-v="0"]');
    check(mode, 'end a sponsor deal', /You ended the/.test(await flash(page)) && await state(page, S => S.sponsors.length) === 0, await flash(page));
    await fits(page, mode, 'after ending a sponsor deal');
  } else skip(mode, 'sponsors: no offer can be signed');

  // the universe export window
  await go(page, 'manage');
  await click(page, '[data-t="uni-export"]');
  await page.waitForSelector('#modal-text');
  const ex = await page.evaluate(() => { const el = document.getElementById('modal-text'); try { const pkg = JSON.parse(el.value), v = GP.validateUniverse(pkg); return { ok: true, readOnly: el.readOnly, workers: pkg.workers.length, promos: pkg.promotions.length, id: pkg.manifest.id, valid: v.ok, errors: v.errors.length, text: document.querySelector('.win .wb p').innerText }; } catch (e) { return { ok: false, err: e.message }; } });
  check(mode, 'export holds valid JSON', ex.ok && ex.workers > 0 && ex.promos > 0, ex.ok ? ex.workers + ' workers, ' + ex.promos + ' promotions, id ' + ex.id : ex.err);
  check(mode, 'export is a loadable universe', !!ex.valid, ex.errors + ' errors');
  check(mode, 'export text box is read-only and counted', !!ex.readOnly && ex.text.indexOf(ex.workers + ' workers') === 0, ex.text && ex.text.slice(0, 50));
  await fits(page, mode, 'export window');
  if (mode === 'desk') await shot(page, 'company-desk-export');
  await page.click('[data-t="copy-modal"]');
  await page.waitForTimeout(150);
  // a browser that refuses the clipboard gets the whole text selected instead, ready for Ctrl+C
  const cp = await page.evaluate(() => { const el = document.getElementById('modal-text'); return { label: document.querySelector('[data-t="copy-modal"]').innerText, all: el.selectionStart === 0 && el.selectionEnd === el.value.length }; });
  check(mode, 'copy to clipboard', cp.label === 'Copied' || cp.all, cp.label === 'Copied' ? 'copied' : 'clipboard refused, text selected');
  await page.keyboard.press('Escape');
  check(mode, 'Esc closes the export window', await count(page, '.win') === 0);
}

/* ---------- Finances ---------- */
async function finances(page, mode, weeks) {
  await go(page, 'finances');
  const cols = Math.min(weeks, mode === 'phone' ? 12 : 24);
  check(mode, 'two pies', await count(page, '.piebox') === 2);
  check(mode, 'weekly net chart', await count(page, 'pre.bars') === 1 && await page.$eval('pre.bars', e => e.getAttribute('aria-label')) === 'Weekly net income for the last ' + cols + ' weeks', await page.$eval('pre.bars', e => e.getAttribute('aria-label')));
  const pre = await page.$eval('pre.bars', e => ({ s: e.scrollWidth, c: e.clientWidth, px: parseFloat(getComputedStyle(e).fontSize) }));
  check(mode, 'the chart fits its panel without scrolling', pre.s <= pre.c + 1, pre.s + ' of ' + pre.c + 'px at ' + pre.px.toFixed(1) + 'px type');
  check(mode, 'ledger adds up', await page.evaluate(() => { const f = window.EWF_DEBUG.state().fin; return Math.abs(f.inc - f.exp - f.net) < 2; }));
  const net = await page.evaluate(() => { const b = [...document.querySelectorAll('.ledger li')].pop().querySelector('.num b'); return { v: window.EWF_DEBUG.state().fin.net, c: getComputedStyle(b).color }; });
  check(mode, 'the net figure is green or red by its sign', net.c === (net.v < 0 ? 'rgb(255, 85, 85)' : 'rgb(85, 255, 85)'), net.v + ' in ' + net.c);
  check(mode, 'week table', await count(page, '.tw tbody tr') === Math.min(weeks, 12), await count(page, '.tw tbody tr') + ' rows');
  await fits(page, mode, 'finances after ' + weeks + ' weeks');
}

/* ---------- World: fed against fed and a trade ---------- */
async function world(page, mode) {
  await go(page, 'world');
  check(mode, 'promotion table', await count(page, '.tw tbody tr') === await state(page, S => S.order.length) && await count(page, '.tw tbody tr.on') === 1);
  check(mode, 'news wire and power ten', await count(page, '.news li') > 5 && await count(page, '.rank li') === 10);
  check(mode, 'relations column', await page.$$eval('.tw thead th', L => L.some(e => e.textContent === 'Relations')));
  await go(page, 'deals');
  // propose a supershow to the first rival who will take the call
  if (await count(page, '[data-t="xf"][data-v="super"]:not([disabled])')) {
    await click(page, '[data-t="xf"][data-v="super"]:not([disabled])');
    const xf = await flash(page), on = await state(page, S => !!GP.xfState(S));
    check(mode, 'propose a supershow', /^The attempt (worked|did not come off)\. .*(They are in|turns the idea down)/.test(xf) && !/roll|dice/i.test(xf), xf);
    check(mode, on ? 'the arrangement is shown and the phones go quiet' : 'that rival will not take another call', on ? await count(page, '.note') === 1 && await count(page, '[data-t="xf"]:not([disabled])') === 0 : await count(page, '[data-t="xf"][disabled]') === 2);
    await fits(page, mode, 'after a proposal');
  } else skip(mode, 'supershow: no rival will take a call');
  // a trade: their least valuable name for our best, which they should like
  check(mode, 'trade starts with one select', await count(page, '#tr-pid') === 1 && await count(page, '#tr-theirs') === 0 && await count(page, '[data-t="trade"][data-k]') === 1);
  // pick the first rival with somebody who would come
  const pid = await state(page, S => S.order.filter(id => id !== S.player).find(id => GP.tradeList(S, id).length) || '');
  if (!pid) { skip(mode, 'trade: nobody at any rival would come'); return; }
  await page.selectOption('#tr-pid', pid);
  await page.waitForSelector('#tr-theirs');
  check(mode, 'no trade button until both are picked', await count(page, 'button[data-t="trade"]') === 0);
  await page.selectOption('#tr-theirs', await page.$eval('#tr-theirs', e => e.options[e.options.length - 1].value));
  await page.selectOption('#tr-mine', await page.$eval('#tr-mine', e => e.options[1].value));
  await page.waitForSelector('button[data-t="trade"]');
  check(mode, 'trade odds are shown first', /They say yes: an attempt with a \d+% chance/.test(await page.$eval('main', e => e.innerText)));
  await fits(page, mode, 'trade picked');
  const names = await page.evaluate(() => ['#tr-mine', '#tr-theirs'].map(s => { const e = document.querySelector(s); return e.options[e.selectedIndex].text; }));
  await click(page, 'button[data-t="trade"]');
  const tr = await flash(page);
  check(mode, 'propose a trade (' + names.join(' for ') + ')', /The attempt .*(goes to|says no deal)|will not sign off|will not talk trades|would not come/.test(tr), tr);
  if (/goes to/.test(tr)) check(mode, 'a done trade clears the form', await count(page, '#tr-theirs') === 0 && await page.$eval('#tr-pid', e => e.value) === '');
  else check(mode, 'a refused trade keeps the picks', await page.$eval('#tr-pid', e => e.value) === pid && await page.$eval('#tr-mine', e => e.value) !== '');
  await fits(page, mode, 'after a trade');
}

/* ---------- a promotion with a better slot on offer ---------- */
async function slotAsk(mode) {
  const { browser, page, errs } = await start(mode, 'pdp', 10);
  await go(page, 'manage');
  if (await count(page, '[data-t="slot-ask"]')) {
    const s0 = await state(page, S => S.promos[S.player].slot);
    await click(page, '[data-t="slot-ask"]');
    const f = await flash(page), s1 = await state(page, S => S.promos[S.player].slot);
    check(mode, 'ask for a better slot', /The network says (yes|not yet)/.test(f) && s1 === (/says yes/.test(f) ? s0 + 1 : s0), f);
    // after a meeting the button gives way to the engine's reason: no second meeting for eight weeks, or what the next slot up needs
    const why = await state(page, S => GP.slotOdds(S).why || '');
    check(mode, 'no second ask straight away', await count(page, '[data-t="slot-ask"]') === 0 && why !== '' && (await page.$eval('main', e => e.innerText)).replace(/\s+/g, ' ').indexOf(why) >= 0, why);
    await fits(page, mode, 'after the slot meeting');
  } else skip(mode, 'slot: no better slot on offer');
  check(mode, 'no errors (pdp)', errs.length === 0, errs.join(' | '));
  await browser.close();
}

/* ---------- your own federation: the owner sets things directly ---------- */
async function owner(mode) {
  const { browser, page, errs } = await start(mode, 'OWN', 20);
  await tour(page, mode, 'own federation, week 1,');
  await go(page, 'overview');
  check(mode, 'the overview says who owns it', /You own .*and you book it/.test(await page.$eval('main', e => e.innerText)));
  await go(page, 'house');
  check(mode, 'owner sees the house style picker', await count(page, '[data-t="creed-pick"]') >= 9 && await count(page, '[data-t="creed-save"]') === 1);
  await go(page, 'manage');
  await click(page, '[data-t="co-set"][data-k="tix"][data-v="2"]');
  check(mode, 'owner sets a level with no attempt needed', await state(page, S => S.promos[S.player].tix) === 2 && await flash(page) === '-' && await page.$eval('[data-t="co-set"][data-k="tix"][aria-pressed="true"]', e => e.dataset.v) === '2');
  check(mode, 'owner sees no approval odds', !/approval/.test(await page.$eval('main', e => e.innerText)));
  await go(page, 'house');
  const pickv = await page.evaluate(() => { const S = window.EWF_DEBUG.state(); return Object.keys(GP.STYLES).find(k => k !== S.owner.style); });
  await click(page, '[data-t="creed-pick"][data-k="style"][data-v="' + pickv + '"]');
  check(mode, 'a pick is only a pick', await page.$eval('[data-t="creed-pick"][data-k="style"][aria-pressed="true"]', e => e.dataset.v) === pickv && await state(page, S => S.owner.style) !== pickv);
  await click(page, '[data-t="creed-save"]');
  const f = await flash(page), st = await state(page, S => S.owner.style);
  check(mode, 'set the house style', /The house style is set/.test(f) ? st === pickv : /changed the house style recently/.test(f) && st !== pickv, f);
  await fits(page, mode, 'after the house style');
  await advance(page, 50);
  check(mode, 'own federation still running after 50 weeks', !(await state(page, S => S.over)), 'week ' + await state(page, S => S.week));
  await tour(page, mode, 'own federation, a year in,');
  // by now the crowd has settled, so the house style can change
  await go(page, 'house');
  await click(page, '[data-t="creed-pick"][data-k="style"][data-v="' + pickv + '"]');
  await click(page, '[data-t="creed-pick"][data-k="pledge"][data-v="' + await page.evaluate(() => { const S = window.EWF_DEBUG.state(); return Object.keys(GP.PLEDGE).find(k => k !== S.owner.pledge); }) + '"]');
  await click(page, '[data-t="creed-save"]');
  check(mode, 'change the house style a year later', /The house style is set/.test(await flash(page)) && await state(page, S => S.owner.style) === pickv, await flash(page));
  await fits(page, mode, 'after changing the house style');
  check(mode, 'no errors (own federation)', errs.length === 0, errs.join(' | '));
  await browser.close();
}

/* ---------- earning the company: the booker becomes the owner and has to pick a house style ---------- */
async function takeover(mode) {
  const { browser, page, errs } = await start(mode, 'whw', 30);
  const wk = await state(page, S => { for (let w = 0; w < 90 && !S.over && !S.owner.pending; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); while (S.qi < S.queue.length) { const card = GP.suggest(S); const pr = GP.preShow(S, card); if (pr) GP.resolvePre(S, card, 0); const ch = GP.chaos(S, card); if (ch) GP.resolveChaos(S, card, 0); GP.runPlayerShow(S, card); } GP.endWeek(S); } return S.owner.pending ? S.week : 0; });
  if (wk) {
    await redraw(page); await calm(page); await go(page, 'house');
    check(mode, 'new owner is asked for a house style (week ' + wk + ')', await count(page, '.panel .mark') === 1 && /The company is yours/.test(await page.$eval('.panel .mark', e => e.innerText)));
    await fits(page, mode, 'the takeover');
    if (mode === 'phone') await shot(page, 'company-phone-takeover');
    await click(page, '[data-t="creed-pick"][data-k="roots"][data-v="' + await page.evaluate(() => { const S = window.EWF_DEBUG.state(); return Object.keys(GP.ROOTS).find(k => k !== S.owner.roots); }) + '"]');
    await click(page, '[data-t="creed-save"]');
    check(mode, 'the first house style is set at once', /The house style is set/.test(await flash(page)) && !(await state(page, S => S.owner.pending)) && await count(page, '.panel .mark') === 0, await flash(page));
    await fits(page, mode, 'after the takeover');
  } else skip(mode, 'takeover: the owner never handed over the company');
  check(mode, 'no errors (takeover)', errs.length === 0, errs.join(' | '));
  await browser.close();
}

/* ---------- TV with a remote: arrows and OK only ---------- */
async function remote() {
  const mode = 'tv', { browser, page, errs } = await start(mode, 'pdw', 40);
  await advance(page, 8);
  await tour(page, mode, 'week 9');
  const key = async k => { await page.keyboard.press(k); await page.waitForTimeout(80); };
  const at = () => page.evaluate(() => { const e = document.activeElement, d = (e && e.dataset) || {}; return { t: d.t || '', k: d.k || '', v: d.v || '', id: (e && e.id) || '', y: Math.round(window.scrollY), lost: !e || e === document.body || !!e.disabled || !e.closest('main') }; });
  const near = (a, b) => !b.lost && Math.abs(a.y - b.y) < 1080;
  // the frame puts the highlight on a new page's first control a moment after the page changes; a key sent before that would race it
  const visit = async p => { await go(page, p); await page.waitForTimeout(250); await calm(page); };
  await visit('house');
  // OK on a house rule adopts it and the highlight stays on the same button, now "Scrap it"
  await page.focus('[data-t="house"][data-k="open"]'); await key('Enter');
  let a = await at();
  check(mode, 'OK adopts a rule and the highlight stays put', /now the rule of the house/.test(await flash(page)) && a.t === 'house' && a.k === 'open', await flash(page));
  // scrapping it switches every house button off: the highlight moves to the nearest live control, not to the top of the page
  await key('Enter');
  let b = await at();
  // the house page is taller than a screen; when the only live controls left are the page tabs at the top, the nearest one is as close as it gets
  const onlyTabs = await page.evaluate(() => [].every.call(document.querySelectorAll('main button:not([disabled]),main select:not([disabled]),main input:not([disabled])'), e => e.dataset.t === 'page'));
  check(mode, 'after a scrap the highlight stays nearby', /is scrapped/.test(await flash(page)) && (near(a, b) || (onlyTabs && b.t === 'page' && !b.lost)), 'now on ' + (b.t || b.id) + ' ' + b.k + ', scrolled ' + a.y + ' -> ' + b.y);
  // signing the last offer that can be signed removes its button
  await fits(page, mode, 'house by remote');
  await visit('deals');
  const can = await page.$$eval('[data-t="sp-accept"]:not([disabled])', L => L.map(e => e.dataset.v));
  if (can.length) {
    await page.focus('[data-t="sp-accept"][data-v="' + can[can.length - 1] + '"]'); a = await at(); await key('Enter'); b = await at();
    check(mode, 'after signing an offer the highlight stays nearby', /is on board/.test(await flash(page)) && near(a, b) && !b.lost, 'now on ' + b.t + ' ' + b.v);
    await page.focus('[data-t="sp-drop"]'); a = await at(); await key('Enter'); b = await at();
    check(mode, 'after ending a deal the highlight stays nearby', /You ended the/.test(await flash(page)) && near(a, b), 'now on ' + b.t + ' ' + b.v);
  } else skip(mode, 'sponsors: no offer can be signed');
  await fits(page, mode, 'deals by remote');
  // a refused or accepted proposal switches that rival's buttons off
  if (await count(page, '[data-t="xf"][data-v="war"]:not([disabled])')) {
    await page.focus('[data-t="xf"][data-v="war"]:not([disabled])'); a = await at(); await key('Enter'); b = await at();
    check(mode, 'after a proposal the highlight stays nearby', /The attempt/.test(await flash(page)) && near(a, b), 'now on ' + (b.id || b.t) + ' ' + b.k + ' ' + b.v);
  } else skip(mode, 'war: no rival will take a call');
  // the trade form by gamepad: A steps a select to its next choice, up and down move between the selects
  const padA = async () => { await page.evaluate(() => window.EWF_DEBUG.pad('a')); await page.waitForTimeout(80); };
  await page.focus('#tr-pid'); await padA();
  check(mode, 'A changes the promotion select', await page.$eval('#tr-pid', e => e.value) !== '' && (await at()).id === 'tr-pid');
  await key('ArrowDown'); const f1 = (await at()).id; await padA();
  await key('ArrowDown'); const f2 = (await at()).id; await padA();
  check(mode, 'down reaches both wrestler selects', f1 === 'tr-theirs' && f2 === 'tr-mine' && await page.$eval('#tr-theirs', e => e.value) !== '' && await page.$eval('#tr-mine', e => e.value) !== '', f1 + ', ' + f2);
  await key('ArrowDown'); a = await at();
  check(mode, 'down reaches the trade button', a.t === 'trade' && a.id === '', a.t + ' ' + a.id);
  await key('Enter'); b = await at();
  check(mode, 'OK proposes the trade and the highlight stays nearby', /The attempt|will not|would not/.test(await flash(page)) && near(a, b), (await flash(page)).slice(0, 70) + ' | now on ' + (b.id || b.t));
  await fits(page, mode, 'trade by remote');
  await shot(page, 'company-tv-deals');
  check(mode, 'no errors', errs.length === 0, errs.join(' | '));
  await browser.close();
}

(async () => {
  for (const mode of ['desk', 'phone']) {
    const { browser, page, errs } = await start(mode, 'pdw', mode === 'desk' ? 0 : 1);
    await tour(page, mode, 'week 1');
    await go(page, 'finances');
    check(mode, 'books are shut before the first week', /The books open after your first week/.test(await page.$eval('main', e => e.innerText)) && await count(page, 'pre.bars') === 0);
    await advance(page, 8);
    check(mode, 'eight weeks played', await state(page, S => S.week) === 9 && !(await state(page, S => S.over)));
    await tour(page, mode, 'week 9');
    await frontOffice(page, mode);
    await finances(page, mode, 8);
    await world(page, mode);
    await calm(page);
    for (const p of PAGES) { await go(page, p); await shot(page, 'company-' + mode + '-' + p, true); }
    // a long game: more history, more news, a full chart
    await advance(page, 22);
    if (!(await state(page, S => S.over))) { await tour(page, mode, 'week 31'); await finances(page, mode, 30); await shot(page, 'company-' + mode + '-finances-30wk', true); }
    else skip(mode, 'week 31: the game ended');
    check(mode, 'no errors', errs.length === 0, errs.join(' | '));
    await browser.close();
    await slotAsk(mode);
    await owner(mode);
    await takeover(mode);
  }
  await remote();
  console.log(fails.length ? 'FAILED: ' + fails.length + '\n  ' + fails.join('\n  ') : 'company: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
