/* The name linker (Txt): names with a full stop, comma or apostrophe link; a short name inside a longer word does not; titles and named teams link.
   Run:  NODE_PATH=<dir containing playwright> node app/tests/linker.js   (build first) */
const { open, go, state, redraw } = require('./helper');
(async () => {
  let bad = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
  const { browser, page, errs } = await open({ mode: 'desk', promo: 'pdw' });
  const t = await state(page, S => {
    const mine = S.w.filter(w => w.promo === S.player && !w.nw && w.team == null);
    const a = mine[0], b = mine[1], c = mine[2], d = mine[3];
    a.name = "Tam O'Shanter"; b.name = 'J. K. Marsh'; c.name = 'Rex';
    const title = S.promos[S.player].titles[0].name;
    S.teams.push({ id: S.nid++, promo: S.player, m: [c.id, d.id], exp: 5, ls: 0, name: 'Thunder Pair' });
    S.news.unshift({ w: S.week, k: 'story', t: 'Thunder Pair won the ' + title + '.' });
    S.news.unshift({ w: S.week, k: 'story', t: 'J. K. Marsh, Tam O\'Shanter and Rexford met. Rex stayed home.' });
    S.news.unshift({ w: S.week, k: 'story', t: "Tam O'Shanter beat J. K. Marsh." });
    return { title };
  });
  await redraw(page); await go(page, 'world'); await page.waitForTimeout(150);
  const rows = await page.$$eval('.news > *', L => L.slice(0, 3).map(e => ({ n: e.querySelectorAll('.lnk').length, links: [].map.call(e.querySelectorAll('.lnk'), x => x.textContent) })));
  ok(rows[0] && rows[0].n === 2, 'full stops and apostrophes link: ' + JSON.stringify(rows[0]));
  ok(rows[1] && rows[1].links.indexOf('Rex') >= 0 && rows[1].links.every(x => x !== 'Rexford') && rows[1].n === 3, 'a short name links alone, never inside a longer word: ' + JSON.stringify(rows[1]));
  ok(rows[2] && rows[2].links.indexOf('Thunder Pair') >= 0 && rows[2].links.indexOf(t.title) >= 0, 'a named team and a title link: ' + JSON.stringify(rows[2]));
  ok(errs.length === 0, 'errors: ' + errs.join(' | '));
  await browser.close();
  console.log(bad ? 'FAILED ' + bad : 'linker ok'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
