/* Browser run of staff: Create staff from the Roster, Move to staff from a wrestler's file, and back to wrestling.
   Run:  NODE_PATH=<dir containing playwright> node app/tests/staff.js */
const { open, go, overflow, shot, state } = require('./helper');
let fails = 0;
function ok(what, cond, info) { console.log((cond ? 'ok   ' : 'FAIL ') + what + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }
(async () => {
  const t = await open({ uni: 'parody', promo: 'ewe' }), { page } = t;
  await page.setViewportSize({ width: 1280, height: 800 });
  await go(page, 'roster'); await page.waitForSelector('[data-t="staff-open"]');
  await page.click('[data-t="staff-open"]'); await page.waitForSelector('[data-t="staff-create"]');
  await page.fill('#stf-name', 'Stripes McGee');
  await page.click('[data-t="staff-role"][data-v="referee"]'); await page.click('[data-t="staff-lvl"][data-v="veteran"]');
  await shot(page, 'staff-window');
  await page.click('[data-t="staff-hire"]'); await page.waitForTimeout(200);
  const ref = await state(page, S => { const w = S.w.find(x => x.name === 'Stripes McGee'); return w && { nw: w.nw, role: w.srole, tag: w.roles && w.roles[0], promo: w.promo === S.player }; });
  ok('Create staff hires a referee onto your books', ref && ref.nw && ref.role === 'referee' && ref.tag === 'referee' && ref.promo, JSON.stringify(ref));
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  // a wrestler with nothing to keep them in the ring moves to staff as a commentator
  const id = await state(page, S => { const E = window.GP; const w = E.rosterOf(S, S.player).find(w => !w.nw && E.toStaffOk(S, w.id).ok); return w && w.id; });
  ok('somebody can move to staff', id != null);
  await page.click('tr.pick[data-id="' + id + '"]').catch(() => {});
  await page.click('[data-t="roster-tostaff"][data-id="' + id + '"]'); await page.waitForSelector('[data-t="tostaff"]');
  await shot(page, 'staff-move');
  await page.click('[data-t="tostaff"][data-v="commentator"]'); await page.waitForTimeout(200);
  const mv = await state(page, (S, id) => ({ nw: S.w[id].nw, role: S.w[id].srole, voice: (S.voices || []).some(v => v.wid === id) }), id);
  ok('Move to staff makes them a commentator with a seat for the desk', mv.nw && mv.role === 'commentator' && mv.voice, JSON.stringify(mv));
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  await page.click('[data-t="roster-back"][data-id="' + id + '"]'); await page.waitForTimeout(200);
  const bk = await state(page, (S, id) => ({ nw: !!S.w[id].nw, voice: (S.voices || []).some(v => v.wid === id) }), id);
  ok('Wrestle again brings them back and frees the seat', !bk.nw && !bk.voice, JSON.stringify(bk));
  const o = await overflow(page); ok('nothing sticks out', o === '', o);
  ok('no errors', !t.errs.length, t.errs.join(' | '));
  await t.browser.close();
  console.log(fails ? fails + ' failed' : 'staff: all passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
