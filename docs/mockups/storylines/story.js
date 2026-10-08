/* Storylines concept: short, medium and long feuds, and rivals (docs/plans/storylines.md). Mock-ups only. Run: node story.js <outdir> */
const { open, go, state } = require('/home/claude/batman/app/tests/helper.js');
const dotlib = require('../final/dotlib.js'); const { dots } = require('../final/maplib.js');
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
    const url = await page.evaluate(n => { const L = [...document.querySelectorAll('canvas')].filter(c => (c.getAttribute('aria-label') || '') === 'Portrait of ' + n); const c = L[L.length - 1]; return c ? c.toDataURL() : null; }, byId[id].name); if (url) faces[id] = url; }
  await page.evaluate(() => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.render(); });
  // lettering in lights: [text, colour] pieces joined into one strip
  const strip = (key, parts, p) => { let s = '', c = []; parts.forEach(q => { s += q[0]; for (let i = 0; i < q[0].length; i++) c.push(q[1]); }); return [key, s, c, p]; };
  const Y = '#ffff55', CY = '#55ffff', RD = '#ff5555', GN = '#55ff55', WH = '#ffffff', MG = '#ff55ff', DIM = '#8a8a8a', sep = [' · ', DIM];
  const DOT = await dotlib(page, { arts: [['ring', 2], ['belt', 2], ['bell', 2], ['entrance', 2], ['mic', 2], ['flex', 2], ['mask', 2], ['cage', 2], ['ladder', 2], ['chair', 2]], texts: [
    strip('season', [['NEXT ENDING', DIM], sep, ['ALL HALLOWS’ EVE', Y], sep, ['3 WEEKS', CY], sep, ['1 SHORT  1 MEDIUM ', RD], ['★', Y]], 2),
    strip('vs', [['RIVALS', RD]], 4), strip('series', [['4', Y], [' - ', DIM], ['3', CY], ['  ·  ', DIM], ['1 DRAW', WH]], 3), strip('rest', [['RESTED 26 WEEKS', GN], [' · ', DIM], ['THEY ARE WAITING', Y]], 2),
    strip('len', [['SHORT', CY], [' · ', DIM], ['MEDIUM', Y], [' · ', DIM], ['LONG', RD]], 3)] });
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

  /* ================= the shared bits ================= */
  const ACT = ['', 'Spark', 'Escalation', 'Twist', 'Blow-off'];
  const LEN = { s: ['S', 'Short', 'tg b'], m: ['M', 'Medium', 'tg go'], l: ['L', 'Long', 'tg'] };
  const lt = k => `<span class="${LEN[k][2]} ln">${LEN[k][0]}</span>`;
  const vs = (a, b, team) => first(a) + (team ? ' and ' : ' vs ') + first(b);
  const stcss = `<style>
    .tl{display:grid;grid-template-columns:40ch repeat(12,1fr);gap:2px;align-items:stretch}.tl>span{min-height:2.1em;display:flex;align-items:center;white-space:nowrap;overflow:hidden}.tl .mh{min-height:1.2em;background:var(--blue);color:var(--yellow);justify-content:center}.tl .mh:first-child{background:none}
    .tl .h{background:var(--grey);color:var(--blue);justify-content:center;font-size:.86em;min-height:1.4em;border:1px solid var(--dgrey)}.tl .h.ev{background:var(--yellow);color:#000}.tl .h.now{background:var(--dred);color:#fff}
    .tl .c{background:#008c8c;color:#fff;font-size:.8em;justify-content:center}.tl .c1{background:#555}.tl .c2{background:var(--blue)}.tl .c3{background:#b89b00;color:#000}.tl .c4{background:var(--dred)}.tl .c5{background:#7a2a8a}.tl .evc{box-shadow:inset 0 0 0 2px var(--yellow)}
    .tl .c.go{background:repeating-linear-gradient(90deg,#7a2a8a 0 6px,#5a1a6a 6px 12px)}
    .tl .nm{gap:.5ch;color:#000;background:var(--grey);padding:0 .5ch}.tl .nm b{flex:1;overflow:hidden;text-overflow:ellipsis}.tl .nm.sel{background:var(--dgreen)}.tl .nm.sel b{color:#fff}.tl .nm.sel .pp{border-color:var(--yellow)}.tl .nm.sel .mt{color:#fff}.tl .nm.sel .mt i{color:#9fd89f}
    .tl .evn{font-size:.72em;color:#000;justify-content:center;background:var(--yellow)}
    .wn .tg.ln{margin-right:.4ch;padding:0 .5ch;outline:1px solid #000}
    .trk{display:grid;gap:3px;margin:.3em 0 .25em;font-size:.92em}.trk span{background:#8c8c8c;color:#333;text-align:center;white-space:nowrap;overflow:hidden}.trk .dn{background:#006000;color:#fff}.trk .on{background:var(--yellow);color:#000;outline:2px solid #000}
    .ovl{position:absolute;inset:0;background:rgba(0,0,40,.55);z-index:5}
    .pop{position:absolute;z-index:6;box-shadow:1.4ch .8em 0 rgba(0,0,0,.6)}
    .slens{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.6ch;margin:.3em 0}
    .slc{border:2px solid var(--dgrey);background:#b4b4b4;padding:0 0 .3em}.slc h5{margin:0 0 .3em;font-weight:normal;text-align:center;color:#fff;padding:.1em 0;font-size:1.08em}.slc p{padding:0 1ch}.slc .kv .l{width:9ch}
    .slc.on{outline:3px solid var(--yellow);outline-offset:1px;background:#c8c8c8}.slc.ks h5{background:var(--blue)}.slc.km h5{background:#806000}.slc.kl h5{background:var(--dred)}
    .ch{display:grid;grid-template-columns:3ch 12ch 8ch minmax(0,1fr) 10ch 6ch;gap:1ch;align-items:center}
  </style>`;

  /* ================= 1. THE SEASON, WITH LENGTHS ================= */
  // each row: who, length, heat, the act in each of the next twelve weeks (5 = a chapter end of a long story, 4 = the blow-off), star weeks
  const evs = { 3: 'ALL HALLOWS’ EVE', 11: 'WINTER CROWN' };
  const ROWS = [
    { a: R[0], b: R[1], len: 'l', heat: 74, plan: [3, 3, 3, 5, 2, 2, 3, 3, 3, 3, 3, 5], star: { 3: '★', 11: '★' }, more: 1 },
    { a: R[3], b: R[7], len: 'm', heat: 68, plan: [3, 3, 3, 4], star: { 3: '★' } },
    { a: R[6], b: R[10], len: 's', heat: 41, plan: [1, 4], star: { 1: '★' } },
    { a: R[5], b: R[8], len: 'm', heat: 22, plan: [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4], star: { 11: '★' } },
    { a: R[11], b: R[13], len: 's', heat: 30, plan: [2, 2, 4], star: { 2: '★' } }];
  const tlHead = `<span class="mh" style="grid-column:1"></span>${['October', 'November', 'December'].map((m, i) => `<span class="mh" style="grid-column:${2 + i * 4}/span 4">${m}</span>`).join('')}<span class="h" style="justify-content:flex-start;padding-left:.6ch;color:#333">Story · length · heat</span>${Array.from({ length: 12 }, (_, i) => `<span class="h${evs[i] ? ' ev' : (i === 0 ? ' now' : '')}">${i === 0 ? 'NOW' : (evs[i] ? '★' : 'W' + (i % 4 + 1))}</span>`).join('')}`;
  const tlRows = ROWS.map((f, r) => `<span class="nm${r === 0 ? ' sel' : ''}">${lt(f.len)}${F(f.a.id, 2.6)}${F(f.b.id, 2.6)}<b>${vs(f.a, f.b)}</b>${M(f.heat / 10, f.heat >= 60 ? 'r' : 'y', 5)}</span>${Array.from({ length: 12 }, (_, i) => { const a = f.plan[i]; return `<span class="c ${a ? 'c' + a : ''}${evs[i] ? ' evc' : ''}${f.more && i === 11 ? '' : ''}">${f.star[i] || (f.more && i === 11 ? '' : '')}</span>`; }).join('')}`).join('');
  const L0 = ROWS[0];
  const chTrack = `<div class="trk" style="grid-template-columns:1fr 1fr 1fr 1fr"><span class="dn">✔ Spark</span><span class="dn">✔ Build</span><span class="on">● Ch 1</span><span>○ Ch 2</span></div><div class="trk" style="grid-template-columns:1fr 1fr;margin-top:0"><span>○ Ch 3: the end</span><span style="background:#7a2a8a;color:#fff">Spring Clash, Mar</span></div>`;
  const season = `<div class="scr" style="grid-template-columns:minmax(0,1fr) 43ch;grid-template-rows:20.2em 16.3em">
    ${W('The season: where every story is going', `<div class="tl">${tlHead}${tlRows}<span class="nm"><b style="color:#333">Big events</b></span>${Array.from({ length: 12 }, (_, i) => `<span class="c${evs[i] ? ' evn' : ''}">${evs[i] ? (i === 3 ? 'HALLOWS' : 'CROWN') : ''}</span>`).join('')}</div>
      <div class="row" style="justify-content:space-between;margin-top:.4em"><span>${lt('s')}Short ${lt('m')}Medium ${lt('l')}Long &nbsp;<span class="tg o">Spark</span><span class="tg b">Build</span><span class="tg" style="background:#b89b00;color:#000">Twist</span><span class="tg" style="background:#7a2a8a">★ Chapter</span><span class="tg">★ Blow-off</span></span><span class="mut">Long goes on into March ►</span></div>`, { right: 'next 12 weeks', style: 'grid-column:1;grid-row:1' })}
    ${W(vs(L0.a, L0.b), `<div class="row" style="justify-content:center;gap:1.6ch">${F(L0.a.id, 5.6)}<span class="rd" style="font-size:1.6em">VS</span>${F(L0.b.id, 5.6)}</div><p style="text-align:center"><span class="tg ln">L</span><b class="bl">A long story</b> <span class="mut">· 24 weeks · 3 chapters</span></p>
      ${chTrack}${kv('Heat', M(7.4, 'r') + ' <span class="gn">▲ rising</span>', 9)}${kv('Running', '9 weeks of 24', 9)}${kv('Rivals', '<b class="rd">Bitter rivals</b> · 4 to 3', 9)}
      ${G('Chapter 1 ends', `<div class="row top">${art('entrance', .62)}<div style="flex:1"><p><b class="bl">All Hallows’ Eve</b>, in 3 weeks.</p><p>A match. Whoever loses has a reason to come back.</p></div></div>`)}
      ${G('This week it needs', `<p><span class="gn">✔</span> A promo, ten minutes</p><p><span class="rd">!</span> A twist inside 2 weeks, or the crowd tires of it</p>`)}
      <p style="margin-top:.4em">${B('Add a twist<small>1</small>')}${B('Move a chapter', 'g')}${B('End it', 'r')}</p>`, { style: 'grid-column:2;grid-row:1/3', right: 'Chapter 1' })}
    <div style="grid-column:1;grid-row:2;display:grid;grid-template-columns:.9fr 1.72fr .7fr;gap:2.6ch;min-height:0">
     ${W('The calendar says', `<p><span class="tg y">Tired</span>${vs(L0.a, L0.b)}: no twist in 4 weeks.</p><p><span class="tg">Small</span>A short story tops the Crown.</p><p><span class="tg">Gap</span>No ending in November.</p><p><span class="tg o">Idle</span>6 with no story.</p>`, { cls: 'hot', right: '4' })}
     ${W('Rivalries', `<div class="lb" style="--cols:5.6ch minmax(0,1fr) 5ch 10ch 3ch"><div class="hd" style="grid-template-columns:var(--cols)"><span></span><span>Who</span><span>Rested</span><span>How deep</span><span class="r"></span></div>
       ${[[R[0], R[1], 'Bitter', '4-3', 'live', 1], [R[3], R[7], 'Rivals', '2-2', 'live'], [R[4], R[9], 'Of the age', '4-3', '26 wk'], [R[2], R[12], 'Old foes', '1-1', '40 wk'], [R[5], R[15], 'Rivals', '3-0', '9 wk']].map(r => `<div class="rw${r[5] ? ' sel' : ''}" style="grid-template-columns:var(--cols)"><span style="display:flex;gap:2px">${F(r[0].id, 2.4)}${F(r[1].id, 2.4)}</span><span>${vs(r[0], r[1])}</span><span class="${r[4] === 'live' ? 't-g' : 't-r'}">${r[4] === 'live' ? 'Live' : r[4]}</span><span>${r[2]}</span><span class="r">${r[3]}</span></div>`).join('')}</div>
       <p style="margin-top:.35em">${B('Their file')}<span class="mut">Rested 26 weeks: they are waiting.</span></p>`, { right: '5' })}
     ${W('Booking power', [['Start a story', '1-3'], ['Break up a team', 2], ['Push a wrestler', 2], ['Buy a pre-tape', 1]].map(t => `<span class="bt wide">${t[0]}<small>${t[1]}</small></span>`).join(''), { right: '5' })}
    </div></div>`;
  await shot('st-1-season', 'storylines', stcss + season, { active: 'Office', key: 'BOOK SHOW', kc: 'y' });

  /* ================= 2. START A STORY: THE THREE LENGTHS ================= */
  const A = R[3], Bw = R[7];
  const card = (k, on, rows, good) => `<div class="slc k${k}${on ? ' on' : ''}"><h5>${on ? '● ' : ''}${LEN[k][1]}</h5>${rows.map(r => kv(r[0], r[1])).join('')}<p class="mut" style="margin-top:.25em">${good}</p></div>`;
  const start = `<div class="ovl"></div><div class="pop wn" style="left:7%;right:7%;top:.3em">
    <div class="ttl"><span>[■]</span><b>Start a story</b><span>Booking power 5</span></div><div class="bd">
     <div class="row" style="justify-content:space-between"><div class="row">${F(A.id, 5)}<div><p><b class="bl">${A.name}</b></p><p class="mut">Face · upper card</p></div></div><span class="rd" style="font-size:1.6em">VS</span><div class="row"><div style="text-align:right"><p><b class="bl">${Bw.name}</b></p><p class="mut">Heel · upper card</p></div>${F(Bw.id, 5)}</div></div>
     ${G('How long', `<div class="slens">
       ${card('s', 0, [['Runs', '2 to 4 weeks'], ['Ends at', 'a weekly show'], ['Heat to', 'Hot'], ['Cost', '1 power']], 'A challenger for a month. Quick and safe. Cannot carry a big main event.')}
       ${card('m', 1, [['Runs', '5 weeks'], ['Ends at', 'All Hallows’ Eve'], ['Heat to', 'White hot'], ['Cost', '<s>2</s> <b class="gn">1 power</b>']], 'Four acts and a blow-off at the big event. Most stories are this.')}
       ${card('l', 0, [['Runs', '12 to 24 weeks'], ['Ends at', 'Hallows, Crown, Spring'], ['Heat to', 'As far as it goes'], ['Cost', '<s>3</s> <b class="gn">2 power</b>']], 'The story of the year, in chapters. Needs a twist in each one.')}</div>`)}
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.4ch">
      ${G('They have history', `<p><b class="rd">Rivals</b> since March 2025 · 2 to 2</p><p>It starts at <b>Build</b>, not Spark, and costs one less.</p><p class="gn">Rested 14 weeks: the crowd is ready for more.</p>`)}
      ${G('The road agent', `<p><b class="bl">Milo of Croton:</b> “They have had two good matches. ${first(Bw)} talks better. Five weeks is right for these two.”</p>`)}</div>
     <p style="margin-top:.5em;text-align:right">${B('Cancel', 'g')}${B('Start it<small>1 power</small>', 'y')}</p></div></div>`;
  await shot('st-2-start', 'storylines', stcss + season + start, { active: 'Office', key: 'BOOK SHOW', kc: 'y' });

  /* ================= 3. THE RIVALRY FILE ================= */
  const X = R[4], Z = R[9];
  const chap = [['1', 'Spring 2025', 'Medium', `${first(X)} won at Spring Clash`, '<span class="gn">B+</span>', '★★★'], ['2', 'Summer 2025', 'Short', 'Fizzled. No ending.', '<span class="rd">—</span>', ''], ['3', 'Autumn 2025', 'Long', `${first(Z)} won the last chapter in a cage`, '<span class="gn">A</span>', '★★★★'], ['4', 'Spring 2026', 'Medium', `${first(X)} won. ${first(Z)} wants it back.`, '<span class="gn">A-</span>', '★★★★']];
  const file = `<div class="ovl"></div><div class="pop wn" style="left:9%;right:9%;top:.3em">
    <div class="ttl"><span>[■]</span><b>${vs(X, Z)}: the rivalry</b><span>Rivalry of the age</span></div><div class="bd">
     <div style="display:grid;grid-template-columns:auto 1fr auto;gap:2ch;align-items:center">
      <div style="text-align:center">${F(X.id, 6)}<p><b class="bl">${first(X)}</b></p></div>
      <div style="text-align:center"><p>${led('vs', .8)}</p><p style="margin-top:.3em">${led('series', .8)}</p><p class="mut">every singles match, ${first(X)} first</p></div>
      <div style="text-align:center">${F(Z.id, 6)}<p><b class="bl">${first(Z)}</b></p></div></div>
     ${G('The chapters', `<div class="lb" style="--cols:3ch 12ch 8ch minmax(0,1fr) 5ch 7ch"><div class="hd"><span>#</span><span>When</span><span>Length</span><span>How it ended</span><span>Show</span><span>Best</span></div>${chap.map(c => `<div class="rw"><span>${c[0]}</span><span>${c[1]}</span><span>${c[2]}</span><span>${c[3]}</span><span>${c[4]}</span><span style="color:#806000">${c[5]}</span></div>`).join('')}</div>`)}
     <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2.4ch">
      ${G('How deep', `${kv('Level', M(9, 'r') + '', 7)}<p><b class="rd">Rivalry of the age.</b></p><p class="mut">A fizzled chapter takes it down a step.</p>`)}
      ${G('Backstage', `<p><span class="tg d">Respect</span></p><p>They ride together. In the ring they make each other better.</p>`)}
      ${G('They remember', `<p>${first(Z)}: “You gave him the last word.”</p><p>${first(X)}: “You trusted us with the cage.”</p>`)}</div>
     <div class="row" style="justify-content:space-between;margin-top:.4em"><span>${led('rest', .9)}</span><span>${B('Close', 'g')}${B('Rekindle it<small>1 power</small>', 'y')}</span></div>
    </div></div>`;
  await shot('st-3-rivalry', 'storylines', stcss + season + file, { active: 'Office', key: 'BOOK SHOW', kc: 'y' });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
