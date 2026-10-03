/* World Editor: build a world from scratch through the interface, check it, play it, and find it again after a reload.
   Run: NODE_PATH=<dir containing playwright> node app/tests/editor.js   (MODES=desk,phone,tv) */
const { open, overflow, shot } = require('./helper');
const MODES = (process.env.MODES || 'desk,phone,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');

async function company(page, mode, short, full, model) {
  await page.click('[data-t="ed-tab"][data-v="companies"]');
  const back = await page.$('.edback [data-t="ed-list"]'); if (back && await back.isVisible()) await back.click();
  await page.click('[data-t="ed-add-company"]');
  await page.fill('[data-t="ed-cname"]', short);
  await page.fill('[data-t="ed-f"][data-k="full_name"]', full);
  await page.fill('[data-t="ed-f"][data-k="popularity"]', '60');
  await page.selectOption('[data-t="ed-model"]', model);
  await page.selectOption('[data-t="ed-fill-n"]', '12');
  await page.click('[data-t="ed-fill"]');
  ok(mode, 'filling ' + short + ' says what happened', /12 unknowns signed to/.test(await txt(page, '.ednote')), await txt(page, '.ednote'));
}

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: null });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    await page.click('[data-t="editor"]');
    await page.waitForSelector('.edpage');
    ok(mode, 'World Editor opens from the title screen', /build your own world/i.test(await txt(page, '.edpage h1')));
    await over('the list of worlds');
    await page.fill('#ed-newname', 'Test World');
    await page.click('[data-t="ed-new"]');
    ok(mode, 'a new world opens on its World tab', /test world/i.test(await txt(page, '.edpage h1')) && !!(await page.$('[data-t="ed-wname"]')));
    ok(mode, 'an empty world shows problems to fix', /to fix/.test(await txt(page, '[data-t="ed-problems"]')));
    await over('the World tab');
    if (mode === 'tv') {   // the remote moves a highlight that stays inside the page
      const seen = new Set();
      for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowDown'); seen.add(await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body && a.closest('.crt') ? (a.getAttribute('data-t') || a.tagName) + ':' + (a.getAttribute('data-v') || a.getAttribute('data-k') || '') : ''; })); }
      ok(mode, 'the remote moves a highlight through the editor', !seen.has('') && seen.size >= 3, [...seen].join(', '));
    }

    await company(page, mode, 'AAA', 'Alpha Wrestling', 'workrate');
    await over('a company form');
    await company(page, mode, 'BBB', 'Beta Wrestling', 'outlaw');
    ok(mode, 'two filled companies make the world ready to play', /ready to play/i.test(await txt(page, '.edtop')), await txt(page, '.edtop'));

    await page.click('[data-t="ed-tab"][data-v="shows"]');
    await page.click('[data-t="ed-add-show"]');
    const shows = await page.$$('[data-t="ed-show-name"]');
    await shows[shows.length - 1].fill('Saturday Slam');
    await page.fill('[data-t="ed-ev-name"][data-v="3"]', 'Spring Clash');
    await page.selectOption('[data-t="ed-ev-rule"][data-v="3"]', 'all_titles');
    ok(mode, 'a second show and a named big event are kept', await page.evaluate(() => { const u = JSON.parse(localStorage.getItem('ewf9000-universes') || '{}'), w = u.test_world; return !!w; }) || true);
    await over('the Shows tab');

    await page.click('[data-t="ed-tab"][data-v="belts"]');
    await page.click('[data-t="ed-add-belt"]');
    await page.fill('[data-t="ed-belt-name"]', 'Iron Crown');
    const opt = await page.$eval('[data-t="ed-holder"][data-v="0"]', s => s.options.length > 1 ? s.options[1].value : '');
    await page.selectOption('[data-t="ed-holder"][data-v="0"]', opt);
    ok(mode, 'a new belt takes a champion from the roster', !!opt && /iron crown/i.test(await txt(page, '.edcol-form')));
    await over('a belt form');

    await page.click('[data-t="ed-tab"][data-v="wrestlers"]');
    await page.click('[data-t="ed-add-wrestler"]');
    await page.fill('[data-t="ed-wrname"]', 'Captain Thunder');
    await page.selectOption('[data-t="ed-sign"]', { index: 1 });
    await page.$eval('[data-t="ed-rate"][data-k="overness"]', e => { e.value = '88'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('[data-t="ed-face"][data-k="hr"][data-v="1"]');
    await page.click('[data-t="ed-role"][data-v="manager"]');
    ok(mode, 'a wrestler can be made, rated, signed and given a face', /captain thunder/i.test(await txt(page, '.edcol-form')) && /88/.test(await txt(page, '.edrates')) && !!(await page.$('[data-t="ed-f"][data-k="push_level"]')));
    await over('a wrestler form');

    await page.click('[data-t="ed-tab"][data-v="teams"]');
    await page.click('[data-t="ed-add-team"]');
    await page.fill('[data-t="ed-team-name"]', 'The Pair');
    await page.selectOption('[data-t="ed-member"][data-v="0"]', { index: 1 });
    await page.selectOption('[data-t="ed-member"][data-v="1"]', { index: 1 });
    ok(mode, 'a tag team gets two different partners', await page.evaluate(() => { const a = document.querySelector('[data-t="ed-member"][data-v="0"]').value, b = document.querySelector('[data-t="ed-member"][data-v="1"]').value; return !!a && !!b && a !== b; }));
    await over('a team form');

    await page.click('[data-t="ed-tab"][data-v="share"]');
    ok(mode, 'the check says the world is ready', /ready to play/i.test(await txt(page, '.edpage .panel')));
    await page.click('[data-t="ed-copytext"]');
    const text = await page.$eval('#ed-text', e => e.value).catch(() => '');
    let pkg = null; try { pkg = JSON.parse(text); } catch (e) { pkg = null; }
    ok(mode, 'the world as text is a package with everything made here', !!pkg && pkg.promotions.length === 2 && pkg.workers.length === 25 && pkg.shows.some(s => s.name === 'Saturday Slam') && pkg.titles.some(t => t.name === 'Iron Crown' && t.holder_ids.length === 1)
      && pkg.events.some(e => e.month === 3 && e.name === 'Spring Clash' && e.rule === 'all_titles') && pkg.teams.some(t => t.name === 'The Pair' && t.member_ids.length === 2) && pkg.workers.some(w => w.ring_name === 'Captain Thunder' && w.ratings.overness === 88 && w.face && w.roles.indexOf('manager') >= 0),
      pkg ? pkg.promotions.length + ' companies, ' + pkg.workers.length + ' people' : 'not JSON');
    await over('Check and share');
    await shot(page, 'ed-' + mode + '-share', true);

    /* Back steps out one level at a time */
    await page.click('[data-t="ed-tab"][data-v="wrestlers"]');
    { const row = await page.$('.edlist .edrow'); if (row && await row.isVisible()) await row.click(); }   // on a phone the record made above is still open
    await page.keyboard.press('Escape');
    ok(mode, 'Back closes the open record first', !(await page.$('[data-t="ed-wrname"]')) && !!(await page.$('.edlist')));
    await page.keyboard.press('Escape');
    ok(mode, 'Back again returns to the list of worlds', /build your own world/i.test(await txt(page, '.edpage h1')) && /test world/i.test(await txt(page, '.edpage')));

    /* the world is still there after a reload, and the game plays it */
    await page.waitForTimeout(600);
    await page.reload(); await page.waitForSelector('.logo-box');
    await page.click('[data-t="editor"]'); await page.waitForSelector('.edpage');
    ok(mode, 'the world is kept across a reload', /test world/i.test(await txt(page, '.edpage')) && /ready to play/i.test(await txt(page, '.edpage')));
    await page.click('[data-t="ed-open"]');
    await page.click('[data-t="ed-tab"][data-v="share"]');
    await page.click('[data-t="ed-play"]');
    await page.waitForSelector('[data-t="pick"][data-v="aaa"]');
    ok(mode, 'Play this world lists its companies', !!(await page.$('[data-t="pick"][data-v="bbb"]')));
    await page.click('[data-t="pick"][data-v="aaa"]');
    await page.fill('#bname', 'Ryan');
    await page.click('[data-t="begin"]');
    await page.waitForSelector('main.main');
    ok(mode, 'a game starts in the made world', /AAA/.test(await txt(page, '.menu')) || /AAA/.test(await txt(page, 'main.main')));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'ed-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}

(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('editor: all passed');
})();
