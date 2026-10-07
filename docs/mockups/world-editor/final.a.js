/* The picked screens, redrawn together: one look, one key, and the dot-matrix lights. Mock-ups only. */
const { open, go, state } = require('/home/claude/batman/app/tests/helper.js');
const dotlib = require('./dotlib.js'); const { dots } = require('./maplib.js');
const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
(async () => {
  const { browser, page } = await open({ mode: 'desk', promo: 'whw' });
  const D = await state(page, S => { const E = window.GP, P = S.promos[S.player]; const card = E.suggest(S); S.card = card; const ck = E.clock(S), rd = E.agentReads(S), X = E.expectWords(S);
    const tOf = id => { const t = P.titles.filter(t => t.holders.indexOf(id) >= 0)[0]; return t ? t.name : ''; };
    const R = E.rosterOf(S, S.player).filter(w => !w.nw).sort((a, b) => b.ovr - a.ovr).map(w => ({ id: w.id, name: w.name, g: w.g, al: w.align, ovr: w.ovr, mor: w.morale, cond: w.cond, mom: w.mom, con: w.con, wage: w.wage, brawl: w.brawl, tech: w.tech, speed: w.speed, stam: w.stam, mic: w.mic, cha: w.cha, age: w.age, fin: w.fin, title: tOf(w.id) }));
    return { R, card: card.map(m => ({ sides: m.sides, title: m.title ? (P.titles.filter(t => t.id === m.title)[0] || {}).name : '', len: m.len, mt: m.mt })), items: ck.items, budget: ck.budget, total: ck.total, reads: rd.map(r => ({ who: r.who, t: r.lines[0] ? r.lines[0].t : '' })), show: S.queue[S.qi].name, queue: S.queue.map(q => q.name), top: P.titles[0].name, exp: X, n: R.length, owner: S.owner.name,
      tasks: E.tasks(S).list.map(t => ({ text: t.short || t.text, state: t.state, label: t.label, req: t.req })) }; });
  const R = D.R, byId = {}; R.forEach(w => byId[w.id] = w); const nm = id => byId[id] ? byId[id].name : '?';
  const need = {}; R.slice(0, 24).forEach(w => need[w.id] = 1); D.card.forEach(m => m.sides.forEach(s => s.forEach(id => need[id] = 1)));
  const faces = {};
  for (const id of Object.keys(need)) { await page.evaluate(id => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.ui.cards.push({ k: 'w', id: +id }); D.render(); }, id); await page.waitForTimeout(170);
    const url = await page.evaluate(() => { const c = document.querySelector('.caw canvas') || document.querySelector('canvas'); return c ? c.toDataURL() : null; }); if (url) faces[id] = url; }
  await page.evaluate(() => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.render(); });
  // lettering in lights: [text, colour] pieces joined into one strip
  const strip = (key, parts, p) => { let s = '', c = []; parts.forEach(q => { s += q[0]; for (let i = 0; i < q[0].length; i++) c.push(q[1]); }); return [key, s, c, p]; };
  const Y = '#ffff55', CY = '#55ffff', RD = '#ff5555', GN = '#55ff55', WH = '#ffffff', MG = '#ff55ff', DIM = '#8a8a8a', sep = [' · ', DIM];
  const DOT = await dotlib(page, { arts: [['ring', 2], ['belt', 2], ['bell', 2], ['entrance', 2], ['mic', 2], ['flex', 2], ['mask', 2], ['cage', 2], ['ladder', 2], ['chair', 2]], texts: [
    strip('tick', [['CHICAGO', CY], sep, [D.show, Y], sep, ['LAKEFRONT COLISEUM', WH], sep, ['13,420 SOLD', GN], sep, ['2,580 TO A SELL-OUT ', RD], ['★', Y]], 2),
    strip('show', [[D.show, Y]], 2), strip('season', [['NEXT ENDING', DIM], sep, ['ALL HALLOWS’ EVE', Y], sep, ['3 WEEKS', CY], sep, ['2 BLOW-OFFS ', RD], ['★★', Y]], 2),
    strip('champ', [['NEW CHAMPION', Y]], 6), strip('call', [['YOUR CALL', RD]], 5), strip('count', [['0:08', RD]], 4), strip('air', [['ON THE AIR', RD]], 2), strip('bell', [['RING THE BELL', GN]], 2), strip('mood', [['FURIOUS', RD]], 2),
    strip('crowd', [['CROWD ', DIM], ['▲▲▲▲▲▲▲▲▲', RD], ['▲', Y], [' RED HOT', RD]], 2)] });
  const art = (k, sc) => `<span class="ledb"><img src="${DOT.art[k + '@2']}" width="${Math.round(128 * (sc || 1))}" height="${Math.round(96 * (sc || 1))}" alt=""></span>`;
  const led = (k, sc) => { const t = DOT.text[k]; return `<span class="ledb"><img src="${t.url}" width="${Math.round(t.w * (sc || 1))}" height="${Math.round(t.h * (sc || 1))}" alt=""></span>`; };
  const F = (id, s) => `<img src="${faces[id] || ''}" class="pp" style="width:${s || 3.4}ch;height:${s || 3.4}ch" alt="">`;
  const W = (title, body, o) => { o = o || {}; return `<div class="wn ${o.cls || ''}" style="${o.style || ''}"><div class="ttl"><span>[■]</span><b>${title}</b><span>${o.right || ''}</span></div><div class="bd ${o.bd || ''}">${body}</div></div>`; };
  const G = (title, body, st) => `<div class="grp" style="${st || ''}"><h4>${title}</h4>${body}</div>`;
  const B = (t, c) => `<span class="bt ${c || ''}">${t}</span>`;
  const M = (v, c, n) => { n = n || 10; v = Math.max(0, Math.min(n, Math.round(v * n / 10))); return `<span class="mt ${c || ''}">${'█'.repeat(v)}<i>${'░'.repeat(n - v)}</i></span>`; };
  const kv = (l, v, w) => `<p class="kv"><span class="l"${w ? ` style="width:${w}ch"` : ''}>${l}</span><span class="v">${v}</span></p>`;
  const money = n => '$' + Math.round(n).toLocaleString('en-US'), hm = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'), first = w => ({ 'George Washington': 'Washington', 'Theodore Roosevelt': 'Roosevelt' })[w.name] || w.name.replace(/ the .*$/, '').replace(/ (Bonaparte|Khan)$/, '');
  const css = `<style>
   .scr{font-size:.92em;display:grid;gap:1.15em 2.6ch;color:var(--k);line-height:1.26}
   .wn{background:var(--grey);color:var(--k);box-shadow:1ch .55em 0 rgba(0,0,0,.55);border:2px solid var(--white);border-right-color:var(--dgrey);border-bottom-color:var(--dgrey);min-width:0;min-height:0;display:flex;flex-direction:column}
   .wn>.ttl{background:var(--blue);color:var(--white);padding:0 1ch;display:grid;grid-template-columns:minmax(4ch,1fr) auto minmax(4ch,1fr);gap:1ch;flex:none;white-space:nowrap}.wn>.ttl b{color:var(--yellow);font-weight:normal;text-align:center}.wn>.ttl span:last-child{text-align:right}.wn.hot>.ttl{background:var(--dred)}.wn.gold>.ttl{background:#806000}
   .wn>.bd{padding:.4em 1.2ch .45em;flex:1;min-height:0;overflow:hidden}.wn p{margin:0 0 .12em}.wn b{color:#000;font-weight:normal}.wn .mut{color:#444}.wn .bl,.wn b.bl{color:var(--blue)}.wn .rd,.wn b.rd{color:var(--dred)}.wn .gn,.wn b.gn{color:#006000}.wn .big{font-size:1.32em;line-height:1.1}
   .wn .bt{display:inline-block;background:var(--dgreen);color:var(--white);padding:0 1.3ch;box-shadow:.6ch .3em 0 #000;margin:.15em 1.5ch .42em 0;white-space:nowrap}.wn .bt.y{background:var(--yellow);color:var(--k)}.wn .bt.g{background:var(--dgrey)}.wn .bt.r{background:var(--dred)}.wn .bt small{color:#bff5bf;margin-left:.6ch}.wn .bt.wide{display:flex;justify-content:space-between;margin-right:1ch}.wn .tight .bt{margin-right:.9ch}.wn .bt.y small{color:#555}
   .wn .grp{border:2px solid var(--dgrey);padding:.55em 1ch .2em;position:relative;margin:.62em 0 .25em}.wn .grp>h4{position:absolute;top:-.72em;left:1ch;margin:0;background:var(--grey);padding:0 .6ch;font-weight:normal;color:var(--dred);font-size:1em;line-height:1.26}
   .wn .kv{display:flex;white-space:nowrap}.wn .kv .l,.wn .l{display:inline-block;width:11ch;color:#333;flex:none}.wn .kv .v{min-width:0;overflow:hidden;text-overflow:ellipsis}
   .wn .mt{letter-spacing:-.04em;color:#006000}.wn .mt i{font-style:normal;color:#777}.wn .mt.r{color:var(--dred)}.wn .mt.b{color:var(--blue)}.wn .mt.y{color:#806000}
   .pp{image-rendering:pixelated;display:block;border:2px solid #000;flex:none}.wn .tg{display:inline-block;padding:0 .7ch;background:var(--dred);color:var(--white);margin-right:.9ch;white-space:nowrap}.wn .tg.o{background:var(--dgrey)}.wn .tg.d{background:#006000}.wn .tg.b{background:var(--blue)}.wn .tg.y{background:var(--yellow);color:#000}.wn .tg.go{background:#806000}
   .lb{background:var(--dcyan);border:2px solid var(--dgrey);border-right-color:var(--white);border-bottom-color:var(--white);overflow:hidden}.lb .hd,.lb .rw{display:grid;gap:1.2ch;align-items:center;padding:0 1ch}.lb .hd{background:var(--grey);border-bottom:2px solid var(--dgrey);color:var(--blue)}
   .lb .rw{border-bottom:1px solid #007c7c;padding-block:2px}.lb .rw>span,.lb .rw>b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lb .rw.sel{background:var(--dgreen);color:var(--white)}.lb .rw.sel *{color:var(--white)!important}.lb .rw.sel .pp{border-color:var(--yellow)}.lb .rw.sel .mt i{color:#9fd89f!important}.lb .rw.sel .tg{outline:1px solid #fff}
   .lb .t-r{color:#7a0000}.lb .t-g{color:#004800}.lb .mt i{color:#007c7c}
   [data-mock] .row{display:flex;gap:1.2ch;align-items:center;flex-wrap:nowrap;margin:0}[data-mock] .row.top{align-items:flex-start}[data-mock] .row>div,[data-mock] .row>span{min-width:0}.col2{display:grid;grid-template-columns:1fr 1fr;gap:0 2.4ch}
   .ledb{display:inline-block;background:#050505;border:2px solid #333;border-right-color:#fff;border-bottom-color:#fff;padding:3px;line-height:0;vertical-align:middle}.ledb img{display:block}[data-mock] .row>.ledb{flex:none}
   .it{border-bottom:1px solid var(--dgrey);padding:.2em 0 .12em;display:flex;justify-content:space-between;gap:1ch;align-items:center;white-space:nowrap}.it:last-of-type{border:0}.it>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis}.it .bt{margin:0 .7ch .3em 0}
   .ans{border:2px solid var(--dgrey);border-left:1ch solid var(--dgreen);padding:.08em 1ch .1em;background:#bdbdbd;margin:.32em 0;display:flex;justify-content:space-between;gap:1ch;align-items:center}.ans.y{border-left-color:var(--yellow)}.ans.r{border-left-color:var(--dred)}.ans small{color:#444;font-size:1em;white-space:nowrap}
   hr.sp{border:0;border-top:1px solid var(--dgrey);margin:.3em 0}
   /* the bars */
   .fk{position:fixed;z-index:30;left:28px;width:1223px;background:var(--grey);color:#000;font-size:20.736px;display:flex;align-items:center;box-sizing:border-box;white-space:nowrap}.fk .fkmi{padding:0 1.2ch;font-size:1.08em;align-self:stretch;display:flex;align-items:center;white-space:pre}.fk .fkmi i{color:var(--dred);font-style:normal}.fk .fkmi.on{background:var(--dgreen);color:#fff}.fk .fkmi.on i{color:#fff}
   .fk .fksp{flex:1}.fk .fkdt{font-size:1em;color:#222;margin-right:1.4ch}.fk .fkst b{color:var(--dred);font-weight:normal;margin:0 .6ch 0 1.5ch}.fk .fkst em{font-style:normal;font-size:.82em;margin-left:.5ch}.fk .up{color:#006000}.fk .dn{color:var(--dred)}.fk .fl{color:#555}
   .fk .nk{display:inline-flex;align-self:stretch;align-items:stretch;margin-left:.6ch}.fk .nk i{font-style:normal;background:#000;color:var(--grey);padding:0 .6ch;display:flex;align-items:center}.fk .nk em{font-style:normal;background:var(--dcyan);color:#000;padding:0 1.1ch;display:flex;align-items:center}
   .fk .bigk{display:inline-flex;align-self:stretch;align-items:stretch;font-size:1.12em;margin-left:1.6ch;box-shadow:inset 0 2px 0 rgba(255,255,255,.5)}.fk .bigk i{font-style:normal;background:#000;color:#fff;padding:0 1.1ch;display:flex;align-items:center}.fk .bigk em{font-style:normal;padding:0 2.2ch;display:flex;align-items:center;min-width:13ch;justify-content:center}
  </style>`;
  const mi = (t, on) => `<span class="fkmi${on ? ' on' : ''}"><i>${t[0]}</i>${t.slice(1)}</span>`;
  const KEYC = { y: ['var(--yellow)', '#000'], r: ['var(--dred)', '#fff'], g: ['var(--dgreen)', '#fff'], w: ['var(--white)', '#000'] };
  const chrome = (active, key, kc, stats) => `<div class="fk" style="top:0;height:30px">${['Office', 'Booking (2)', 'Roster', 'Net', 'Manage (3)', 'Company'].map(t => mi(t, t.indexOf(active) === 0)).join('')}<span class="fksp"></span><span class="fkdt">WHW · Week 1, October 2026</span></div>
    <div class="fk" style="top:828px;height:32px"><span class="fkst">${stats || `<b>BP</b>5<b>AP</b>3<b>Cash</b>$110M<em class="up">▲ $1.1M</em><b>Pop</b>88.0<em class="up">▲ 0.1</em><b>Owner</b>55<em class="fl">steady</em>`}</span><span class="fksp"></span><span class="nk"><i>F1</i><em>Help</em></span><span class="nk"><i>F2</i><em>Options</em></span><span class="nk"><i>F3</i><em>Music</em></span><span class="bigk"><i>SPACE</i><em style="background:${KEYC[kc || 'y'][0]};color:${KEYC[kc || 'y'][1]}">► ${key}</em></span></div>`;
  const shot = async (name, pageName, html, o) => {
    if (ONLY.length && !ONLY.some(x => name.indexOf(x) === 0)) return;
    await go(page, pageName === 'desk' ? 'backstage' : 'desk'); await go(page, pageName); await page.waitForTimeout(250);
    await page.evaluate(([h, chrome]) => { document.querySelectorAll('[data-mock]').forEach(e => e.remove()); const m = document.querySelector('main.main'), sub = m.querySelector(':scope > .subnav'), mr = m.getBoundingClientRect(), top = (sub ? sub.getBoundingClientRect().bottom + 12 : 44);
      const d = document.createElement('div'); d.setAttribute('data-mock', '1'); d.style.cssText = 'position:fixed;z-index:3;left:' + mr.left + 'px;width:' + mr.width + 'px;top:' + top + 'px;bottom:32px;background:var(--blue);overflow:hidden;padding:2px ' + getComputedStyle(m).paddingRight + ' 0 ' + getComputedStyle(m).paddingLeft + ';box-sizing:border-box;font-size:20.736px';
      d.innerHTML = h; document.body.appendChild(d); window.scrollTo(0, 0); const c = document.createElement('div'); c.setAttribute('data-mock', '2'); c.innerHTML = chrome + '<style>.ftop>*:not(nav){display:none!important}</style>'; document.body.appendChild(c); }, [css + html, chrome(o.active, o.key, o.kc)]);
    await page.waitForTimeout(300); const b = await page.evaluate(() => Math.round(document.querySelector('[data-mock] .scr').getBoundingClientRect().bottom));
    await page.screenshot({ path: process.argv[2] + '/' + name + '.png' }); console.log(name, 'bottom', b, '(key bar starts at 828)');
  };
