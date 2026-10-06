/* Shared helpers for browser tests of the new interface.
   Run a test with:  NODE_PATH=/opt/npm-tools/node_modules node app/tests/<name>.js
   Build first:      node build.js          (tests open dist/index.html)
   Work in progress: EWF_OUT=wip EWF_DEV=1 node build.js, then EWF_OUT=wip node app/tests/<name>.js */
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

/* The game is served from a local web server, not opened as a file: browser storage is only dependable on a real origin. */
let server = null, port = 0;
function serve() {
  if (server) return Promise.resolve(port);
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      const f = path.join(__dirname, '..', '..', 'dist', path.basename(decodeURIComponent(req.url.split('?')[0])));
      fs.readFile(f, (err, buf) => { if (err) { res.writeHead(404); res.end('not found'); } else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(buf); } });
    });
    server.listen(0, '127.0.0.1', () => { port = server.address().port; server.unref(); resolve(port); });
  });
}

const SHOTS = process.env.SHOTS || require('os').tmpdir();   // where screenshots go
const VIEWPORTS = { desk: { viewport: { width: 1280, height: 860 } }, tablet: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true }, tv: { viewport: { width: 1920, height: 1080 } } };

/** Open the game. opts: { mode: 'desk'|'tablet'|'tv', file: 'index', promo: 'pdw' or null to stay on the title screen, name } */
async function open(opts) {
  opts = opts || {};
  const mode = opts.mode || 'desk', browser = await chromium.launch(), ctx = await browser.newContext(VIEWPORTS[mode]), page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(p => { try { if (!localStorage.getItem('gorilla-position-prefs')) localStorage.setItem('gorilla-position-prefs', JSON.stringify(p)); } catch (e) {} }, Object.assign({ boot: false }, mode === 'tv' ? { screen: 'tv' } : {}));
  await page.goto('http://127.0.0.1:' + (await serve()) + '/' + (opts.file || 'index') + '.html');
  await page.waitForSelector('.logo-box');
  if (opts.promo !== null) {
    await page.click('[data-t="scr"][data-v="select"]');
    await page.click('[data-t="pick"][data-v="' + (opts.promo || 'pdw') + '"]');
    await page.fill('#bname', opts.name || 'Ryan');
    await page.click('[data-t="begin"]');
    await page.waitForSelector('main.main');
    // this week's tasks do not hold up the tests unless one asks for that (opts.gate)
    if (!opts.gate) await page.evaluate(() => { window.GP.setGate(window.EWF_DEBUG.state(), false); window.EWF_DEBUG.render(); });
  }
  return { browser, page, errs, mode };
}
/** Go to a page by id (desk, career, booking, roster, locker, titles, market, storylines, history, net, manage, house, deals, overview, finances, world). */
async function go(page, id) { await page.evaluate(p => window.EWF_DEBUG.go(p), id); }
/** Returns '' when nothing sticks out sideways, else a description of what does. Tables inside .tw and <pre> art may scroll on their own. */
async function overflow(page) {
  return page.evaluate(() => {
    const o = document.documentElement.scrollWidth - document.documentElement.clientWidth; if (o <= 1) return '';
    const W = window.innerWidth;
    return 'page is ' + o + 'px too wide: ' + [...document.querySelectorAll('.crt *, .win *, .caw *')].filter(e => e.getBoundingClientRect().right > W + 1 && !e.closest('.tw') && !e.closest('pre') && !e.closest('.menu')).slice(0, 4).map(e => e.tagName + '.' + e.className + ' "' + (e.innerText || '').slice(0, 40).replace(/\n/g, ' ') + '"').join(' | ');
  });
}
/** On a one-screen page: '' if nothing needs scrolling, else what does not fit. Other pages always answer ''. */
async function fits(page) {
  return page.evaluate(() => {
    if (!document.querySelector('.onescreen')) return '';
    const d = document.documentElement, bad = [], over = (sel, name) => { const e = document.querySelector(sel); if (e && e.scrollHeight - e.clientHeight > 1) bad.push(name + ' is ' + (e.scrollHeight - e.clientHeight) + 'px too tall'); };
    if (d.scrollHeight - d.clientHeight > 1) bad.push('the page scrolls by ' + (d.scrollHeight - d.clientHeight) + 'px');
    over('.main', 'the page area'); over('.b1-pane', 'the pane beside the sheet'); over('.b1-pane > .panel', 'the panel in the pane'); over('.b1-rows', 'the run sheet'); over('.lv-main', 'the broadcast'); over('.lv-night', 'tonight’s run sheet'); over('.callbox', 'the call box'); over('.a1-list', 'the list of what the night left'); over('.a1-pane', 'the pane beside it');
    const st = document.querySelector('.ffoot'); if (st && st.getBoundingClientRect().bottom > window.innerHeight + 1) bad.push('the status line is off the screen');
    return bad.join('; ');
  });
}
async function shot(page, name, full) { await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full }); }
/** The one-line message above the page, or '-'. */
async function flash(page) { return (await page.$eval('.flash', e => e.innerText).catch(() => '-')).replace(/\n/g, ' ').slice(0, 200); }
/** Read or change the live game state, e.g. state(page, S => S.week). The function runs in the browser. */
async function state(page, fn, arg) { return page.evaluate(new Function('arg', 'return (' + fn.toString() + ')(window.EWF_DEBUG.state(), arg)'), arg); }
async function redraw(page) { await page.evaluate(() => window.EWF_DEBUG.render()); }
/** See the show that is on screen through to its sign-off. On the air there is no skipping the night: each segment is
    skipped to its result, and every call from the gorilla position is answered (the safe choice, or opts.pick(kind)).
    opts.onCall(kind) runs while a call is waiting. opts.report === false stops on the sign-off instead of opening the
    report. Works for a replay too. Returns the kinds of call that came up, in order. */
async function airShow(page, opts) {
  opts = opts || {}; const calls = [], has = async sel => !!(await page.$(sel));
  for (let g = 0; g < 900; g++) {
    if (await has('[data-t="live-call"]')) {
      const k = await page.$eval('[data-t="live-call"]', e => e.getAttribute('data-v')); calls.push(k);
      if (opts.onCall) { await opts.onCall(k); if (!(await has('[data-t="live-call"]'))) continue; }   // onCall may answer it itself
      await page.waitForTimeout(430);   // a call takes no answer in its first moments
      const safe = await page.evaluate(() => { const S = window.EWF_DEBUG.state(); return (S.live && S.live.ev && S.live.ev.safe) || 0; });
      await page.click('[data-t="live-pick"][data-c="' + (opts.pick ? opts.pick(k) : safe) + '"]');
      continue;
    }
    // the sign-off leads to After the show. A test that wants the match-by-match report opens it from there.
    if (await has('#live[data-v="signoff"]')) { if (opts.report !== false) { await page.click('[data-t="advance"]'); if (await has('[data-t="after-full"]')) await page.click('[data-t="after-full"]'); } return calls; }
    if (await has('[data-t="live-end"]')) { await page.click('[data-t="live-end"]'); continue; }
    if (await has('[data-t="live-skip"]')) { await page.click('[data-t="live-skip"]'); continue; }
    if (await has('#live')) { await page.click('[data-t="advance"]'); continue; }   // the big yellow button is the only way forward
    throw new Error('the broadcast has no way forward');
  }
  throw new Error('the broadcast never ended');
}
/** From the report or After the show, on to the Office (the yellow button, once or twice). */
async function toOffice(page) { for (let i = 0; i < 3 && (await page.evaluate(() => window.EWF_DEBUG.ui.page)) !== 'desk'; i++) { await page.click('[data-t="advance"]'); await page.waitForTimeout(60); } }
module.exports = { open, go, overflow, shot, flash, state, redraw, SHOTS, fits, airShow, toOffice };
