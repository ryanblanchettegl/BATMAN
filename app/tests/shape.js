/* The running order beside the card, the guide window, and stars instead of percentages for matches and segments.
   Run: NODE_PATH=<dir containing playwright> node app/tests/shape.js   (MODES=desk,tv) */
const { open, go, overflow, shot, state, flash } = require('./helper');
const MODES = (process.env.MODES || 'desk,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    await go(page, 'booking');
    ok(mode, 'with no card the running order asks for one', /three or more matches/.test(await txt(page, 'main.main')));
    await page.click('[data-t="suggest"]');
    const n = await state(page, S => S.card.length);
    const meta = i => txt(page, '.sheet .seg[data-m="' + i + '"] .meta');
    ok(mode, 'each spot on the card is named', /^Opener/.test(await meta(0)) && /^Semi-main/.test(await meta(n - 2)) && /^Main event/.test(await meta(n - 1)), await meta(0));
    ok(mode, 'the running order reads the card', await has(page, '[data-t="shape-notes"]') && /biggest match is on last/.test(await txt(page, '[data-t="shape-notes"]')), await txt(page, '[data-t="shape-notes"]'));
    /* a long opener is called out at once */
    await state(page, S => { S.card[0].len = 'L'; });
    await go(page, 'booking');
    ok(mode, 'a long opener is flagged before the show', /opener is a long match/.test(await txt(page, '[data-t="shape-notes"] li.bad')), await txt(page, '[data-t="shape-notes"]'));
    await state(page, S => { S.card[0].len = 'S'; });
    await go(page, 'booking');
    await over('the card with the running order');
    await shot(page, 'shape-' + mode, true);
    /* the guide */
    await page.click('[data-t="shape-guide"]');
    await page.waitForSelector('.win');
    ok(mode, 'the guide lists the seven rules', (await page.$$('.win .rules li')).length === 7 && /Open hot/.test(await txt(page, '.win')) && /counts three times/.test(await txt(page, '.win')));
    await over('the guide');
    await shot(page, 'shape-guide-' + mode);
    await page.click('[data-t="modal-close"]');
    /* a booked promo is forecast in stars */
    await page.click('[data-t="seg-suggest"]');
    ok(mode, 'a booked promo or angle is forecast in stars', /should be about ★/.test(await txt(page, '.sheet')) && !/should (score|be) about \d/.test(await txt(page, '.sheet')));
    /* run the show and read the report */
    const rep = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP, pr = E.preShow(S, S.card); if (pr) E.resolvePre(S, S.card, 0); E.fitShow(S, S.card); const v = E.validate(S, S.card); if (v.errors.length) return { err: v.errors.join(' | ') }; const r = E.runPlayerShow(S, S.card).rep; window.EWF_DEBUG.render(); return { n: r.segs.filter(s => s.k === 'match').length, lines: r.sheet.lines.join(' / ') }; });
    ok(mode, 'the show ran', !rep.err, rep.err);
    await go(page, 'desk');
    await page.click('[data-t="report"]');
    await page.waitForSelector('[data-t="match-stars"]');
    const starsTxt = await page.$$eval('[data-t="match-stars"]', L => L.map(e => e.innerText));
    ok(mode, 'every match in the report has a star rating and no percentage', starsTxt.length === rep.n && starsTxt.every(t => /^[★¼½¾]+$/.test(t.trim())), starsTxt.join(' '));
    const scores = await page.$$eval('.sheet .seg .scores', L => L.map(e => e.innerText).join(' '));
    ok(mode, 'the score lines under a match carry no percentage either', scores.length > 0 && !/%/.test(scores), scores.slice(0, 120));
    const segStars = await page.$$eval('[data-t="seg-stars"]', L => L.map(e => e.innerText));
    ok(mode, 'promos and angles are rated in stars', segStars.length >= 1 && segStars.every(t => /^[★¼½¾]+$/.test(t.trim())), segStars.join(' '));
    ok(mode, 'the report says how the show did in words, with no expected percentage', /^(Blew the roof off|Sent them home happy|Gave them what they came for|Came up short|Died in front of them)\. /.test(await txt(page, '[data-t="verdict"]')) && !/%/.test(await txt(page, '[data-t="verdict"]')), await txt(page, '[data-t="verdict"]'));
    ok(mode, 'the show itself gets a letter grade and no percentage', /^(A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/.test((await txt(page, '[data-t="show-grade"]')).trim()) && !/%/.test(await txt(page, '.rating')), await txt(page, '.rating'));
    ok(mode, 'the report names the spots', /Opener/.test(await txt(page, '.sheet')) && /Main event/.test(await txt(page, '.sheet')));
    ok(mode, 'the dirt sheet lines give stars', /Match of the night: .*★/.test(rep.lines) && !/Match of the night[^/]*\d%/.test(rep.lines), rep.lines.slice(0, 160));
    await over('the report');
    await shot(page, 'shape-report-' + mode, true);
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'shape-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('shape: all passed');
})();
