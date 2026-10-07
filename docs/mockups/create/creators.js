/* The creation suite in the World Editor, in the new look: create a federation (with the logo creator in it), a move,
   a show, a belt, a tag team, a stable and a relationship. Mock-ups only. Every name here is from the game's own world. */
const fs = require('fs');
const { open, state } = require('/home/claude/batman/app/tests/helper.js'); const dotlib = require('./dotlib.js');
const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
(async () => {
  const { browser, page } = await open({ mode: 'desk', promo: 'whw' });
  const D = await state(page, S => { const E = window.GP, P = S.promos[S.player]; const R = E.rosterOf(S, S.player).filter(w => !w.nw).sort((a, b) => b.ovr - a.ovr).map(w => ({ id: w.id, name: w.name, al: w.align, ovr: w.ovr, brawl: w.brawl, tech: w.tech, speed: w.speed, mic: w.mic, cha: w.cha, age: w.age, fin: w.fin, style: w.style }));
    return { R, titles: P.titles.map(t => ({ n: t.name, tag: t.tag, lvl: t.lvl })), shows: P.shows.map(s => s.name), cities: P.cities, owner: S.owner.name, n: R.length, teams: S.teams.filter(t => t.promo === P.id).map(t => t.name), stables: S.stables.filter(t => t.promo === P.id).map(t => t.name), people: S.w.filter(Boolean).length, cos: Object.keys(S.promos).length }; });
  const R = D.R, faces = {};
  for (const w of R.slice(0, 16)) { await page.evaluate(id => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.ui.cards.push({ k: 'w', id }); D.render(); }, w.id); await page.waitForTimeout(170);
    faces[w.id] = await page.evaluate(() => { const c = document.querySelector('.caw canvas') || document.querySelector('canvas'); return c ? c.toDataURL() : null; }); }
  await page.evaluate(() => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.render(); });
  const Y = '#ffff55', CY = '#55ffff', RD = '#ff5555', WH = '#ffffff', GN = '#55ff55';
  const strip = (key, s, col, p) => [key, s, Array.from(s).map(() => col), p];
  const DOT = await dotlib(page, { arts: [['entrance', 2], ['ring', 2], ['belt', 2], ['mic', 2]], texts: [strip('move', 'GORDIAN KNOT', Y, 4), strip('show', 'MONDAY NIGHT DYNASTY', Y, 3), strip('belt', 'IMPERIAL WORLD TITLE', Y, 3), strip('team', 'THE TWIN EAGLES', CY, 3), strip('stable', 'THE PRINCES', RD, 4), strip('heat', 'REAL HEAT', RD, 3), strip('fed', 'WORLD HISTORY WRESTLING', Y, 2), strip('story', 'THE BROKEN PROMISE', Y, 3), strip('gim', 'THE EMPEROR', Y, 4), strip('event', 'A WALKOUT', RD, 4)] });
  // the mark and belt drawing routines, loaded into the page
  const m2 = fs.readFileSync(__dirname + '/marks2.js', 'utf8'); const lib = m2.slice(m2.indexOf('const FONT ='), m2.indexOf("const root = document.createElement('div'); root.id = 'm2root'"));
  await page.addScriptTag({ content: `window.__mark = (function(){ ${lib}; return mark; })();
    window.__belt = function (o, p) { const GW = 64, GH = 30, c = document.createElement('canvas'); c.width = GW; c.height = GH; const x = c.getContext('2d'); const MET = { gold: ['#c9a400', '#fff36b', '#806000'], silver: ['#9aa0a8', '#ffffff', '#555555'], bronze: ['#aa5500', '#e0a060', '#553008'] }[o.metal || 'gold'], strap = o.strap || '#7a4a12';
      const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); }, EL = (a, b, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(a, b, rx, ry, 0, 0, 7); x.fill(); }, poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
      R(1, 10, 62, 10, strap); R(1, 10, 62, 1, 'rgba(255,255,255,.25)'); R(1, 19, 62, 1, 'rgba(0,0,0,.4)'); [3, 6].forEach(a => { R(a, 14, 1, 2, '#cccccc'); R(63 - a, 14, 1, 2, '#cccccc'); });
      const sides = o.sides == null ? 2 : o.sides, sx = sides === 4 ? [9, 18, 40, 49] : (sides === 2 ? [13, 45] : []); sx.forEach(a => { R(a, 8, 6 + (sides === 2 ? 2 : 0), 14, MET[0]); R(a + 1, 9, 4 + (sides === 2 ? 2 : 0), 12, MET[1]); R(a + 2, 10, 2 + (sides === 2 ? 2 : 0), 10, MET[0]); });
      const cs = o.centre || 'round';
      if (cs === 'round') { EL(32, 15, 11, 13.5, MET[1]); EL(32, 15, 9.5, 12, MET[0]); EL(32, 15, 6.5, 8.5, MET[2]); }
      if (cs === 'oval') { EL(32, 15, 14, 11, MET[1]); EL(32, 15, 12.5, 9.5, MET[0]); EL(32, 15, 9, 6.5, MET[2]); }
      if (cs === 'shield') { poly([[21, 2], [43, 2], [43, 17], [32, 29], [21, 17]], MET[1]); poly([[23, 4], [41, 4], [41, 16], [32, 26], [23, 16]], MET[0]); poly([[26, 7], [38, 7], [38, 15], [32, 21], [26, 15]], MET[2]); }
      if (cs === 'plate') { R(21, 3, 22, 24, MET[1]); R(23, 5, 18, 20, MET[0]); R(26, 8, 12, 14, MET[2]); }
      if (cs === 'crown') { poly([[24, 5], [27, 0], [30, 4], [32, 0], [34, 4], [37, 0], [40, 5]], MET[1]); EL(32, 16, 11, 12, MET[1]); EL(32, 16, 9.5, 10.5, MET[0]); EL(32, 16, 6.5, 7.5, MET[2]); }
      EL(32, cs === 'crown' ? 16 : 15, 3, 3, o.gem || '#ff5555'); R(31, (cs === 'crown' ? 16 : 15) - 2, 1, 1, '#ffffff');
      const im = x.getImageData(0, 0, GW, GH), out = document.createElement('canvas'); out.width = GW * p; out.height = GH * p; const y = out.getContext('2d'); y.fillStyle = '#050505'; y.fillRect(0, 0, out.width, out.height);
      for (let yy = 0; yy < GH; yy++) for (let xx = 0; xx < GW; xx++) { const i = (yy * GW + xx) * 4, a = im.data[i + 3], r = im.data[i], g = im.data[i + 1], b = im.data[i + 2], on = a > 90 && r + g + b > 40; y.shadowBlur = on ? p * .9 : 0; y.shadowColor = 'rgb(' + r + ',' + g + ',' + b + ')'; y.fillStyle = on ? 'rgb(' + r + ',' + g + ',' + b + ')' : '#161616'; y.beginPath(); y.arc(xx * p + p / 2, yy * p + p / 2, p * (on ? .42 : .26), 0, 7); y.fill(); }
      out.style.display = 'block'; return out; };` });
  const fa = fs.readFileSync(__dirname + '/final.a.js', 'utf8'); const css = eval(fa.slice(fa.indexOf('const css = `<style>') + 'const css = '.length, fa.indexOf('</style>`;', fa.indexOf('const css = `<style>')) + '</style>`'.length));
  const F = (id, s) => `<img src="${faces[id] || ''}" class="pp" style="width:${s || 3.4}ch;height:${s || 3.4}ch" alt="">`;
  const W = (title, body, o) => { o = o || {}; return `<div class="wn ${o.cls || ''}" style="${o.style || ''}"><div class="ttl"><span>[■]</span><b>${title}</b><span>${o.right || ''}</span></div><div class="bd">${body}</div></div>`; };
  const G = (title, body, st) => `<div class="grp" style="${st || ''}"><h4>${title}</h4>${body}</div>`;
  const B = (t, c) => `<span class="bt ${c || ''}">${t}</span>`;
  const M = (v, c, n) => { n = n || 10; v = Math.max(0, Math.min(n, Math.round(v * n / 10))); return `<span class="mt ${c || ''}">${'█'.repeat(v)}<i>${'░'.repeat(n - v)}</i></span>`; };
  const kv = (l, v, w) => `<p class="kv"><span class="l"${w ? ` style="width:${w}ch"` : ''}>${l}</span><span class="v">${v}</span></p>`;
  const plain = v => String(v).replace(/<[^>]+>/g, '').length, inp = (v, w) => `<span class="inp" style="width:${Math.max(w || 0, plain(v) + 2.4)}ch">${v}</span>`, sel = (v, w) => `<span class="inp sel" style="width:${Math.max(w || 0, plain(v) + 5)}ch">${v}<i>▼</i></span>`;
  const rad = (opts, on) => opts.map((o, i) => `<span class="rad${i === on ? ' on' : ''}">${i === on ? '(•)' : '( )'} ${o}</span>`).join(' ');
  const opt = (opts, on, cols) => `<div class="opts" style="grid-template-columns:repeat(${cols || opts.length},1fr)">${opts.map((o, i) => `<span class="${i === on ? 'on' : ''}">${o}</span>`).join('')}</div>`;
  const sw = (on, set) => `<span class="sws">${(set || ['#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff', '#000000']).map(c => `<span class="sw${c === on ? ' on' : ''}" style="background:${c}"></span>`).join('')}</span>`;
  const mk = (m, p, cls) => `<i class="cv ${cls || ''}" data-mk="${encodeURIComponent(JSON.stringify(m))}" data-p="${p}"></i>`, bl = (o, p) => `<i class="cv" data-bl="${encodeURIComponent(JSON.stringify(o))}" data-p="${p}"></i>`;
  const led = (k, sc) => { const t = DOT.text[k]; return `<span class="ledb"><img src="${t.url}" width="${Math.round(t.w * (sc || 1))}" height="${Math.round(t.h * (sc || 1))}" alt=""></span>`; };
  const art = (k, sc) => `<span class="ledb"><img src="${DOT.art[k + '@2']}" width="${Math.round(128 * (sc || 1))}" height="${Math.round(96 * (sc || 1))}" alt=""></span>`;
  const slider = (v, lo, hi, col) => `<span class="sld"><i style="left:${Math.round((v - lo) / (hi - lo) * 100)}%;background:${col || 'var(--yellow)'}"></i>${lo < 0 ? '<b></b>' : ''}</span>`;
  const first = w => ({ 'George Washington': 'Washington', 'Theodore Roosevelt': 'Roosevelt' })[w.name] || w.name.replace(/ the .*$/, '').replace(/ (Bonaparte|Khan)$/, '');
  const xcss = css + `<style>
   #ed{position:fixed;inset:0;z-index:9999;background:var(--blue);font-family:var(--f);font-size:20.736px;color:#000;overflow:hidden}
   #ed .fk{left:0;width:100%}#ed .fk .fkmi{padding:0 .85ch;font-size:1em}#ed .wn .kv{white-space:normal;align-items:baseline}#ed .wn .kv .v{white-space:normal;overflow:visible}#ed .rad{margin-right:1.4ch}#ed .opts span{font-size:.94em}#ed .crumb{position:absolute;left:18px;right:18px;top:38px;color:var(--cyan);white-space:nowrap;display:flex;justify-content:space-between}#ed .crumb b{color:var(--yellow);font-weight:normal}
   #ed .scr{position:absolute;left:18px;right:26px;top:70px;bottom:46px}
   .inp{display:inline-block;background:#fff;color:#000;border:2px solid #555;border-right-color:#fff;border-bottom-color:#fff;padding:0 .8ch;box-shadow:inset 2px 2px 0 #000;white-space:nowrap;overflow:hidden;vertical-align:middle;box-sizing:border-box}.inp.sel{display:inline-flex;justify-content:space-between;gap:1ch}.inp.sel i{font-style:normal;background:var(--grey);margin-right:-.8ch;padding:0 .5ch;border-left:2px solid #555}
   .rad{margin-right:2ch;white-space:nowrap}.rad.on{color:#000}.wn .rad{color:#333}
   .opts{display:grid;gap:4px;margin:.15em 0 .3em}.opts span{background:#8c8c8c;color:#111;text-align:center;white-space:nowrap;padding:0 .4ch;border:2px solid transparent;overflow:hidden}.opts span.on{background:var(--dgreen);color:#fff;border-color:#000}
   .sws{display:inline-flex;gap:3px;vertical-align:middle}.sw{width:17px;height:17px;border:2px solid #555;display:inline-block;flex:none}.sw.on{outline:3px solid #000;border-color:#fff;transform:translateY(-3px)}
   .cv{display:inline-block;line-height:0;vertical-align:middle}.cv canvas{border:2px solid #555;border-right-color:#fff;border-bottom-color:#fff}.tiles{display:grid;gap:6px}.tiles>span{text-align:center;font-size:.8em;border:2px solid transparent;padding:3px 2px 0;white-space:nowrap}.tiles>span.on{background:var(--dgreen);color:#fff;border-color:#000}
   .sld{display:inline-block;position:relative;width:22ch;height:.8em;background:#666;border:2px solid #333;border-right-color:#fff;border-bottom-color:#fff;vertical-align:middle;margin:0 1ch}.sld i{position:absolute;top:-.35em;width:1.2ch;height:1.4em;margin-left:-.6ch;border:2px solid #000;box-sizing:border-box}.sld b{position:absolute;left:50%;top:-.2em;bottom:-.2em;border-left:2px solid #fff}
   .tale{display:grid;grid-template-columns:1fr auto 1fr;gap:.1em 1.4ch;align-items:center}.tale .r{text-align:right}.tale .c{color:#333;text-align:center}
   .tv{background:#000;color:var(--grey);padding:.4em 1.2ch;border:2px solid #333;border-right-color:#fff;border-bottom-color:#fff}.tv p{margin:0 0 .15em}.tv .s1{color:var(--yellow)}.tv .s2{color:var(--cyan)}.tv .hi{color:#fff}
  </style>`;
  const TABS = ['World', 'Companies', 'Wrestlers', 'Gimmicks', 'Moves', 'Titles', 'Shows', 'Teams', 'Stables', 'Ties', 'Stories', 'Events', 'Check'];
  const shot = async (name, tab, crumb, html, key, note) => {
    if (ONLY.length && !ONLY.some(x => name.indexOf(x) === 0)) return;
    await page.evaluate(([h, tabs, tab, crumb, key, note, people, cos]) => { document.querySelectorAll('#ed').forEach(e => e.remove()); const d = document.createElement('div'); d.id = 'ed'; d.setAttribute('data-mock', '1');
      d.innerHTML = `<div class="fk" style="top:0;height:30px"><span class="fkmi" style="background:#000;color:var(--yellow)">WORLD EDITOR</span>${tabs.map(t => `<span class="fkmi${t === tab ? ' on' : ''}"><i>${t[0]}</i>${t.slice(1)}</span>`).join('')}<span class="fksp"></span><span class="fkdt">My world</span></div>
        <div class="crumb"><span>${crumb}</span><span>${note || ''}</span></div>${h}
        <div class="fk" style="top:auto;bottom:0;height:32px"><span class="fkst"><b>World</b>My world<b>Companies</b>${cos}<b>People</b>${people}<b>To fix</b>3</span><span class="fksp"></span><span class="nk"><i>F1</i><em>Help</em></span><span class="nk"><i>F2</i><em>Check the world</em></span><span class="nk"><i>ESC</i><em>Back</em></span><span class="bigk"><i>SPACE</i><em style="background:var(--yellow);color:#000">► ${key}</em></span></div>`;
      document.body.appendChild(d);
      d.querySelectorAll('[data-mk]').forEach(e => e.appendChild(window.__mark(JSON.parse(decodeURIComponent(e.dataset.mk)), +e.dataset.p)));
      d.querySelectorAll('[data-bl]').forEach(e => e.appendChild(window.__belt(JSON.parse(decodeURIComponent(e.dataset.bl)), +e.dataset.p))); }, [xcss + html, TABS, tab, crumb, key, note, D.people, D.cos]);
    await page.waitForTimeout(350); const b = await page.evaluate(() => { const s = document.querySelector('#ed .scr'), r = s.getBoundingClientRect(); let over = 0; s.querySelectorAll('.wn>.bd').forEach(e => { over = Math.max(over, e.scrollHeight - e.clientHeight); }); return Math.round(r.bottom) + ' clipped ' + over; });
    await page.screenshot({ path: process.argv[2] + '/' + name + '.png' }); console.log(name, b);
  };
  const SH = ['shield', 'ring', 'laurel', 'slash', 'star', 'diamond', 'sun', 'steps', 'moon', 'circle', 'hex', 'crown', 'oval', 'globe', 'bolt', 'wings', 'flame', 'pennant'];
  const NOW = { n: 'WHW', sh: 'shield', c1: '#5555ff', c2: '#ffff55', fin: 'split', st: 'shadow', ex: 'stars' };
  /* ================= 1. Create a federation, with the logo creator in it ================= */
  const fed = `<div class="scr" style="grid-template-columns:41ch minmax(0,1fr) 37ch;grid-template-rows:1fr">
    ${W('The company', `${kv('Name', inp('World History Wrestling', 27), 9)}${kv('Short', `${inp('W', 3)} ${inp('H', 3)} ${inp('W', 3)} <span class="mut">initials</span>`, 9)}
      ${G('What kind of company', opt(['Corporate', 'Work rate', 'Purist', 'Outlaw', 'Underdog', 'Start-up', 'Spectacle', 'Tradition', 'Joshi'], 0, 3) + `<p class="mut">Stars before wrestling. A board that watches the money.</p>`)}
      ${G('Where', kv('Home', sel('Rome', 20), 9) + kv('Territory', '12 cities in 6 countries', 9) + kv('Reach', M(8.8, 'b') + ' worldwide', 9) + kv('Money', inp('$110,000,000', 15), 9))}
      ${G('The owner', kv('Name', inp(D.owner, 20), 9) + kv('Wants', sel('Star power', 20), 9) + kv('Roots', sel('Family entertainment', 20), 9) + kv('Promises', sel('Wages on time', 20), 9))}
      ${G('The product', kv('How rough', sel('Family', 20), 9) + kv('Production', sel('Slick', 20), 9))}`, { right: '1 of 9' })}
    ${W('The mark', `<div class="row top" style="gap:2ch">${mk(NOW, 5)}<div style="flex:1"><p>${led('fed', .95)}</p>
        ${G('Letters', opt(['Block', 'Slant', 'Wide', 'Tall', 'Outline', 'Shadow'], 5, 3) + opt(['Row', 'Stack', 'Stairs', 'Big'], 0, 4), 'margin-top:.7em')}</div></div>
      ${G('Colours', kv('Shape', sw('#5555ff'), 8) + kv('Trim', sw('#ffff55'), 8) + kv('Letters', sw('#ffffff', ['#ffffff', '#ffff55', '#55ffff', '#ff5555', '#000000']) + ' <span class="mut">always kept readable</span>', 8))}
      ${G('The shape', `<div class="tiles" style="grid-template-columns:repeat(9,1fr);gap:3px">${SH.map(s => `<span class="${s === 'shield' ? 'on' : ''}" style="padding:2px 0">${mk({ n: '', sh: s, c1: '#5555ff', c2: '#ffff55' }, 1.3)}</span>`).join('')}</div>`)}
      ${G('Finish and one extra', kv('Finish', opt(['Flat', 'Two-tone', 'Striped'], 1, 3), 8) + kv('Extra', opt(['None', 'Stars', 'A bar', 'A line', 'Edge lights'], 1, 5), 8))}
      ${G('Ideas', `<div class="row" style="gap:8px">${[['crown', '#aa0000', '#ffff55'], ['globe', '#0000aa', '#55ff55'], ['wings', '#5555ff', '#ffffff'], ['oval', '#00aaaa', '#ffffff'], ['bolt', '#555555', '#55ffff']].map(v => mk({ n: 'WHW', sh: v[0], c1: v[1], c2: v[2], st: 'shadow' }, 2)).join('')}<span>${B('Shuffle', 'g')}<br><span class="mut">Press one to take it.</span></span></div>`)}`, { right: '18 shapes' })}
    ${W('It starts with', `${G('How the mark will look', `<div class="row" style="margin-bottom:.3em"><span class="tg" style="background:#5555ff;margin:0">WHW</span><span class="tg" style="background:#000;color:#ffff55;margin:0">WHW</span>${mk(NOW, 2)}</div><div class="wn" style="box-shadow:.6ch .35em 0 rgba(0,0,0,.5)"><div class="ttl" style="background:#5555ff"><span>[■]</span><b>The road</b><span></span></div><div class="bd" style="padding:.1em 1ch"><span class="mut">Title bars take its colours.</span></div></div>`, 'margin-top:.35em')}
      ${G('Shows', D.shows.map(s => `<p>${s}</p>`).join('') + `<p>${B('Create a show')}</p>`)}
      ${G('Belts', D.titles.slice(0, 2).map(t => `<p>${t.n}</p>`).join('') + `<p class="mut">and ${D.titles.length - 2} more</p><p>${B('Create a belt')}</p>`)}
      ${G('People', kv('Roster', D.n + ', ' + D.teams.length + ' teams, ' + D.stables.length + ' stable', 8) + `<p>${B('Sign people')}${B('Fill it', 'g')}</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> A world title, and a champion</p><p><span class="rd">!</span> No colour voice on the desk</p>`)}`, { right: 'ready' })}</div>`;
  await shot('create-1-federation', 'Companies', 'Companies ▸ <b>World History Wrestling</b>', fed, 'SAVE THE COMPANY', 'Every change shows at once.');
  /* ================= 2. Create a move ================= */
  const A0 = R[0], B0 = R[1];
  const move = `<div class="scr" style="grid-template-columns:44ch minmax(0,1fr) 34ch;grid-template-rows:1fr">
    ${W('The move', `${kv('Name', inp('Gordian Knot', 26), 9)}${kv('Kind', '', 9)}${opt(['Strike', 'Slam', 'Suplex', 'Hold', 'Dive', 'Power', 'Roll-up', 'Weapon'], 3, 4)}
      ${kv('Used as', rad(['Any time', 'Signature', 'Finisher'], 2), 9)}${kv('From', sel('Standing, face to face', 26), 9)}
      ${G('What it does', kv('Works the', opt(['Neck', 'Arms', 'Back', 'Knees'], 0, 4), 10) + kv('Ends a match', M(9, 'r') + ' nearly always', 10) + kv('Crowd', M(8, 'y') + ' a big pop', 10) + kv('Danger', M(6, 'r') + ' to a worn neck', 10) + kv('Wears out', M(3) + ' the one doing it', 10))}
      ${G('Who can do it', kv('Strength', M(4, 'b', 8) + ' any', 10) + kv('Skill', M(7, 'b', 8) + ' technicians', 10) + kv('Speed', M(2, 'b', 8) + ' any', 10) + kv('Size', rad(['Any', 'Not on giants'], 1), 10))}
      ${G('How it can be beaten', `<p>${rad(['Cannot be', 'A rope break', 'A counter', 'A kick-out'], 1)}</p>`)}`, { right: 'a hold' })}
    ${W('How it reads on the air', `<p style="text-align:center">${led('move')}</p>
      ${G('The call', kv('Setting up', inp('{a} has {b} tied up in the ropes...', 46), 10) + kv('Hitting it', inp('{a} locks in the {move}! There is no way out!', 46), 10) + kv('The finish', inp('{b} taps. It is over.', 46), 10) + kv('Escaping', inp('{b} gets a foot on the rope. The hold is broken.', 46), 10) + `<p class="mut">{a} does the move, {b} takes it, {move} is its name.</p>`, 'margin-top:.75em')}
      ${G('Tonight it would sound like this', `<div class="tv"><p><span class="s1">HERODOTUS:</span> ${first(A0)} has ${first(B0)} tied up in the ropes...</p><p><span class="s1">HERODOTUS:</span> <span class="hi">${first(A0)} locks in the Gordian Knot! There is no way out!</span></p><p><span class="s2">PEPYS:</span> He has been working that neck all night.</p><p><span class="s1">HERODOTUS:</span> <span class="hi">${first(B0)} taps. It is over.</span></p></div>`)}
      ${G('What the agent will say about it', `<p>“A hold on the neck. Do not book it against anyone whose neck is already worn.”</p>`)}`, { right: 'preview' })}
    ${W('Who uses it', `<div class="row top" style="margin-bottom:.3em">${F(A0.id, 6)}<div><p class="bl big">${A0.name}</p><p>His finisher.</p><p class="mut">Used 0 times.</p></div></div><p>${B('Give it to somebody')}</p>
      ${G('Moves in this world', `<p><b>212</b> moves</p>${[['Finishers', 71], ['Signatures', 48], ['Holds', 31], ['Dives', 22], ['The rest', 40]].map(x => kv(x[0], M(x[1] / 8, 'b', 8) + ' ' + x[1], 11)).join('')}`)}
      ${G('Like this one', `<p>Sleeper hold <span class="mut">· neck</span></p><p>Guillotine <span class="mut">· neck</span></p><p>Iron grip <span class="mut">· shoulders</span></p><p>${B('Start from one', 'g')}</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Nobody else uses this name</p><p><span class="gn">✔</span> Every call line has its names</p>`)}`, { right: '1' })}</div>`;
  await shot('create-2-move', 'Moves', 'Moves ▸ <b>Gordian Knot</b>', move, 'SAVE THE MOVE', 'The engine has finishers by name only today.');
  /* ================= 3. Create a show ================= */
  const show = `<div class="scr" style="grid-template-columns:46ch minmax(0,1fr) 35ch;grid-template-rows:1fr">
    ${W('The show', `${kv('Name', inp('Monday Night Dynasty', 26), 10)}${kv('Company', sel('World History Wrestling', 26), 10)}${kv('Kind', rad(['Weekly television', 'A big event'], 0), 10)}
      ${G('When', kv('Night', opt(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 0, 7), 9) + kv('Length', rad(['One hour', 'Two hours', 'Three hours'], 1), 9) + kv('Runs', rad(['Every week', 'Seasons'], 0), 9))}
      ${G('Where it is seen', kv('Network', sel('Calder, a big one', 20), 9) + kv('Slot', sel('Prime time', 20), 9) + kv('The deal', '89 weeks left', 9) + kv('Standing', M(7.8, 'y') + ' A fixture', 9))}
      ${G('How it is made', kv('Production', sel('Slick', 20), 9) + kv('Opens', sel('Straight to the ring', 20), 9) + kv('Voices', sel('Herodotus and Pepys', 20), 9) + kv('Building', sel('Arenas, about 16,000', 20), 9))}
      ${G('Who is on it', kv('Roster', rad(['Everybody', 'One brand'], 0), 9) + kv('Home belt', sel('Imperial World Title', 20), 9))}`, { right: 'episode 1,330' })}
    ${W('The look', `<div class="row top" style="gap:2ch">${art('entrance', 1.9)}<div style="flex:1"><p>${led('show', .66)}</p>
        ${G('The stage', opt(['Ramp', 'Tunnel', 'Curtain', 'Big screen'], 3, 2) + kv('Lights', sw('#55ffff', ['#55ffff', '#ff55ff', '#ffff55', '#ff5555', '#55ff55', '#ffffff', '#5555ff']), 9) + kv('Second', sw('#ff55ff', ['#55ffff', '#ff55ff', '#ffff55', '#ff5555', '#55ff55', '#ffffff', '#5555ff']), 9) + kv('Fireworks', sel('Always', 14), 9), 'margin-top:.7em')}</div></div>
      ${G('On the air', `<div class="tv" style="padding:0"><p style="background:var(--dcyan);color:#000;padding:0 1ch;display:flex;justify-content:space-between;margin:0"><span>MONDAY NIGHT DYNASTY</span><span>ON THE AIR · 0:00 INTO THE SHOW</span></p><p style="padding:.2em 1ch 0"><span class="s1">HERODOTUS:</span> We are live from Chicago, and what a night we have for you.</p><p style="padding:0 1ch .2em"><span class="s2">PEPYS:</span> Sixteen thousand of them, partner, and they are already on their feet.</p></div>`)}
      ${G('Its own night of the year', kv('Anniversary', 'Week 1 of October: a bigger crowd', 11) + kv('Tradition', sel('None', 30), 11) + `<p class="mut">A tradition is a rule the night always follows: every title defended, a cage, a tournament final.</p>`)}`, { right: 'weekly television' })}
    ${W('What it means', `${G('Each week it costs', `<p class="bl big">$412,000</p><p class="mut">crew, travel, the building</p>`, 'margin-top:.35em')}
      ${G('Each week it should bring', kv('Viewers', 'about 1.5 million', 9) + kv('Gate', 'about $600,000', 9) + kv('Rights', '$1.9M from the network', 9))}
      ${G('What the crowd expects', `<p><b>A red-hot show:</b> matches of ★★★★¼ or better.</p><p class="mut">Set from the company’s popularity. A new show starts lower and earns it.</p>`)}
      ${G('The week', `<p><span class="tg b">Mon</span>Monday Night Dynasty</p><p><span class="tg o">Thu</span>Thursday Chronicle</p><p class="mut">Two shows is the most a roster of 71 can fill.</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> No other show on a Monday</p><p><span class="rd">!</span> A rival runs Monday too: a ratings war</p>`)}`, { right: '1 of 2' })}</div>`;
  await shot('create-3-show', 'Shows', 'Shows ▸ <b>Monday Night Dynasty</b>', show, 'SAVE THE SHOW');
  /* ================= 4. Create a belt ================= */
  const BN = { centre: 'crown', metal: 'gold', strap: '#101010', sides: 2, gem: '#ff5555' };
  const belt = `<div class="scr" style="grid-template-columns:45ch minmax(0,1fr) 34ch;grid-template-rows:1fr">
    ${W('The belt', `${kv('Name', inp('Imperial World Title', 26), 10)}${kv('Company', sel('World History Wrestling', 26), 10)}
      ${G('Where it stands', opt(['World', 'Second', 'TV', 'Tag team', 'Women’s', 'Regional'], 0, 3) + kv('Standing', M(8.5, 'y') + ' the top prize', 10))}
      ${G('Who can hold it', kv('Open to', rad(['Men', 'Women', 'Anyone'], 0), 10) + kv('Held by', rad(['One', 'A team', 'Three'], 0), 10) + kv('Weight', sel('No limit', 18), 10) + kv('Brand', sel('The whole company', 18), 10))}
      ${G('The rules', kv('Defended', sel('Every 4 weeks', 18), 10) + kv('Changes on', rad(['Pin or tap', 'Any finish'], 0), 10) + kv('Big events', rad(['Always on the card', 'When booked'], 0), 10))}
      ${G('The first champion', `<p>${rad(['A tournament', 'Hand it to somebody', 'Leave it vacant'], 0)}</p>${kv('How many', sel('Eight, over three weeks', 22), 10)}`)}`, { right: '1 of 5' })}
    ${W('The look', `<p style="text-align:center">${bl(BN, 7)}</p><p style="text-align:center;margin-top:.45em">${led('belt', .9)}</p>
      ${G('The centre plate', `<div class="tiles" style="grid-template-columns:repeat(5,1fr)">${[['round', 'Round'], ['oval', 'Oval'], ['shield', 'Shield'], ['plate', 'Plate'], ['crown', 'Crown']].map(c => `<span class="${c[0] === 'crown' ? 'on' : ''}">${bl({ centre: c[0], metal: 'gold', strap: '#101010', sides: 0 }, 1.5)}<br>${c[1]}</span>`).join('')}</div>`)}
      <div class="row top" style="gap:2ch"><div style="flex:1">${G('Metal and strap', kv('Metal', opt(['Gold', 'Silver', 'Bronze'], 0, 3), 7) + kv('Strap', sw('#101010', ['#101010', '#7a4a12', '#ffffff', '#aa0000', '#0000aa', '#00aa00']), 7))}</div>
        <div style="flex:1">${G('Plates, jewel and text', kv('Plates', rad(['None', 'Two', 'Four'], 1), 7) + kv('Jewel', sw('#ff5555', ['#ff5555', '#55ffff', '#55ff55', '#ff55ff', '#ffffff', '#5555ff']), 7) + kv('Text', inp('IMPERIAL', 12), 7))}</div></div>
      <p class="mut" style="margin-top:.3em">A belt that reaches the top standing gains a second row of jewels by itself.</p>`, { right: 'drawn by the game' })}
    ${W('Its place', `${G('This company’s belts', D.titles.map((t, i) => `<p${i === 0 ? ' style="background:var(--dgreen);color:#fff;padding:0 .6ch"' : ''}>${i + 1}. ${t.n}</p>`).join(''), 'margin-top:.35em')}
      ${G('Champions', `<div class="row top">${F(R[0].id, 5.4)}<div><p class="bl">${R[0].name}</p><p>31 weeks, 6 defences</p></div></div><p class="mut" style="margin-top:.3em">In a new world this list is empty. In a world with history you can write the reigns that came before.</p><p>${B('Write its history', 'g')}</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Nobody else has this name</p><p><span class="gn">✔</span> Eight people can fill the tournament</p><p><span class="rd">!</span> Five belts for 71 people is a lot</p>`)}`, { right: 'top of 5' })}</div>`;
  await shot('create-4-belt', 'Titles', 'Titles ▸ <b>Imperial World Title</b>', belt, 'SAVE THE BELT');
  /* ================= 5. Create a tag team ================= */
  const T1 = R[11], T2 = R[13], tl = (l, a, b) => `<span class="r">${M(a / 10, 'b', 8)}</span><span class="c">${l}</span><span>${M(b / 10, 'b', 8)}</span>`;
  const team = `<div class="scr" style="grid-template-columns:minmax(0,1.05fr) minmax(0,1fr) 35ch;grid-template-rows:1fr">
    ${W('The two of them', `<div class="row" style="justify-content:center;gap:2ch">${F(T1.id, 9.5)}<span class="big bl" style="font-size:2em">&amp;</span>${F(T2.id, 9.5)}</div><div class="col2" style="text-align:center;margin-top:.2em"><p><b class="bl">${T1.name}</b><br>${B('Change', 'g')}</p><p><b class="bl">${T2.name}</b><br>${B('Change', 'g')}</p></div>
      ${G('Side by side', `<div class="tale">${tl('Crowd', T1.ovr, T2.ovr)}${tl('Brawling', T1.brawl, T2.brawl)}${tl('Technical', T1.tech, T2.tech)}${tl('Speed', T1.speed, T2.speed)}${tl('Talking', T1.mic, T2.mic)}<span class="r">${T1.age}</span><span class="c">Age</span><span>${T2.age}</span><span class="r">${T1.al === 'F' ? 'Hero' : 'Villain'}</span><span class="c">Side</span><span>${T2.al === 'F' ? 'Hero' : 'Villain'}</span></div>`)}
      ${G('Add a third', `<p class="mut">Three can defend the belts two at a time. Whoever is left out will keep count.</p><p>${B('Pick a third')}</p>`)}
      ${G('Their mark', `<div class="row top" style="gap:1.6ch">${mk({ n: 'TE', sh: 'wings', c1: '#00aaaa', c2: '#ffffff', st: 'shadow' }, 3)}<div><p>A team can carry a mark of its own, made in the logo creator.</p><p>${B('Change the mark')}</p></div></div>`)}`, { right: 'two people' })}
    ${W('The team', `<p style="text-align:center">${led('team')}</p>${kv('Name', inp('The Twin Eagles', 20) + ' ' + B('Another name', 'g'), 9)}
      ${G('What they are', opt(['Thrown together', 'A regular team', 'Brothers', 'Teacher and pupil', 'Old friends', 'Odd couple'], 1, 3) + kv('Side', rad(['Heroes', 'Villains', 'Leave them be'], 0), 9) + kv('Together', sel('Two years', 16) + ' <span class="mut">they know each other’s moves</span>', 9))}
      ${G('In the ring', kv('Team move', sel('The Double Eagle', 22) + ' ' + B('Create a move', 'g'), 10) + kv('Who talks', sel(first(T1), 22), 10) + kv('Manager', sel('None', 22), 10) + kv('Come out', rad(['Together', 'One at a time'], 0), 10))}
      ${G('If it ends', `<p>${rad(['They shake hands', 'One turns on the other', 'Decide then'], 2)}</p><p class="mut">A break-up is a story. It costs booking power in a game.</p>`)}`, { right: 'a regular team' })}
    ${W('How they fit', `${G('What can be seen', `<p><span class="gn">✔</span> <b>Styles:</b> a brawler and a technician. A good mix.</p><p><span class="gn">✔</span> <b>They get on.</b> Friends for two years.</p><p><span class="rd">!</span> <b>Both heroes,</b> one more popular. Jealousy can grow.</p>`, 'margin-top:.35em')}
      ${G('What cannot', `<p>How they work together is only known once they have been seen.</p><p class="mut">In the editor you can set it. In a game the agent has to find out.</p>${kv('Chemistry', sel('The game decides', 18), 10)}`)}
      ${G('Teams in this company', D.teams.slice(0, 5).map(t => `<p>${t}</p>`).join('') + `<p class="mut">${D.teams.length} teams, 1 pair of belts</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Neither is in another team</p><p><span class="gn">✔</span> Both with the same company</p>`)}`, { right: 'fits' })}</div>`;
  await shot('create-5-tag-team', 'Teams', 'Teams ▸ <b>The Twin Eagles</b>', team, 'SAVE THE TEAM');
  /* ================= 6. Create a stable ================= */
  const SM = [R[1], R[8], R[10], R[2], R[14]], ROLE = ['Leader', 'Mouthpiece', 'Enforcer', 'Workhorse', 'Prospect'];
  const srel = (a, b) => { if (a === b) return '<i class="me">■</i>'; const p = [a, b].sort().join(''); return p === '03' ? '<i class="h">✕</i>' : (p === '01' || p === '24' ? '<i class="f">♥</i>' : (p === '34' ? '<i class="j">▲</i>' : '<i class="n">·</i>')); };
  const stable = `<style>.mx{display:grid;gap:2px}.mr{display:grid;grid-template-columns:repeat(6,3.8ch);gap:2px;align-items:center}.mr i,.wn p i.k{font-style:normal;display:inline-block;width:3.6ch;text-align:center}.mr i{height:1.6em;line-height:1.6em;background:#8c8c8c}.wn i.f{color:#fff;background:#008000}.wn i.h{color:#fff;background:var(--dred)}.wn i.j{color:#000;background:var(--yellow)}.wn i.n{color:#555}.wn i.me{background:var(--dgrey);color:var(--dgrey)}
     .mem{display:grid;grid-template-columns:repeat(5,1fr);gap:1ch;text-align:center}.mem b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mem .pp{margin:0 auto}.mem .tg{margin:0}</style>
    <div class="scr" style="grid-template-columns:40ch minmax(0,1fr) 36ch;grid-template-rows:1fr">
    ${W('The stable', `${kv('Name', inp('The Princes', 24), 9)}${kv('Company', sel('World History Wrestling', 24), 9)}
      ${G('Why they are together', opt(['Power', 'Family', 'Hired guns', 'Rebels', 'Old guard', 'Young lions'], 0, 3) + `<p class="mut">They want every belt in the company, and they share.</p>`)}
      ${G('How they act', kv('Side', rad(['Heroes', 'Villains', 'Either'], 1), 9) + kv('In a fight', rad(['They run in', 'They stay out'], 0), 9) + kv('Size', '5 members <span class="mut">3 to 6</span>', 9))}
      ${G('The mark', `<div class="row top" style="gap:1.6ch">${mk({ n: 'PRN', sh: 'crown', c1: '#aa0000', c2: '#ffff55', st: 'shadow' }, 3.4)}<div><p>A stable gets a mark too, made in the logo creator.</p><p>${B('Change the mark')}</p></div></div>`)}
      ${G('Who they are after', kv('Rivals', sel('The Academy', 22), 9) + kv('Target', sel('Imperial World Title', 22), 9))}`, { right: '1 of 3' })}
    ${W('The members', `<p style="text-align:center">${led('stable', .8)}</p>
      <div class="mem" style="margin-top:.6em">${SM.map((w, i) => `<div>${F(w.id, 7.4)}<b>${first(w)}</b><span class="tg ${i === 0 ? 'y' : 'o'}">${ROLE[i]}</span></div>`).join('')}</div>
      <p style="margin-top:.5em">${B('Add a member')}${B('Take one out', 'g')}${B('Change the leader', 'g')}</p>
      ${G('The pecking order', SM.map((w, i) => `<p>${i + 1}. <b>${w.name}</b> <span class="mut">${['calls the shots', 'does the talking', 'does the hitting', 'does the work', 'carries the bags'][i]}</span></p>`).join('') + `<p class="mut">Whoever is second wants to be first. The lower they are, the more they lose for the group.</p>`)}`, { right: '5 members' })}
    ${W('Inside the group', `${G('Who gets on with whom', `<div class="mx"><div class="mr"><span></span>${SM.map(w => F(w.id, 3.2)).join('')}</div>${SM.map((w, a) => `<div class="mr">${F(w.id, 3.2)}${SM.map((q, b) => srel(a, b)).join('')}</div>`).join('')}</div><p style="margin-top:.35em"><i class="k f">♥</i> friends <i class="k h">✕</i> heat <i class="k j">▲</i> jealous</p>`, 'margin-top:.35em')}
      ${G('How long it will hold', kv('Tension', M(6, 'r') + ' rising', 9) + `<p><span class="rd">!</span> ${first(SM[0])} and ${first(SM[3])} have real heat.</p><p><span class="rd">!</span> ${first(SM[3])} is more popular than the leader.</p><p><span class="gn">✔</span> A mouthpiece who can talk.</p>`)}
      ${G('What it gives them', `<p>Help at ringside. A reason to be on every show. A break-up worth a big event.</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Nobody is in two stables</p>`)}`, { right: 'tense' })}</div>`;
  await shot('create-6-stable', 'Stables', 'Stables ▸ <b>The Princes</b>', stable, 'SAVE THE STABLE');
  /* ================= 7. Create a relationship ================= */
  const P1 = R[3], P2 = R[7];
  const rel = `<div class="scr" style="grid-template-columns:minmax(0,1fr) minmax(0,1.12fr) 36ch;grid-template-rows:1fr">
    ${W('Between these two', `<div class="row" style="justify-content:center;gap:1.6ch">${F(P1.id, 9.5)}<span style="text-align:center">${led('heat', .8)}<br><span class="rd" style="font-size:1.6em">◄ ✕ ►</span></span>${F(P2.id, 9.5)}</div><div class="col2" style="text-align:center;margin-top:.2em"><p><b class="bl">${P1.name}</b><br>${B('Change', 'g')}</p><p><b class="bl">${P2.name}</b><br>${B('Change', 'g')}</p></div>
      ${G('What they are to each other', opt(['Friends', 'Real heat', 'Teacher and pupil', 'Family', 'A couple', 'Former partners', 'Same trainer', 'Old score'], 1, 2))}
      ${G('Who knows', `<p>${rad(['Everybody', 'The locker room', 'Only them'], 1)}</p><p class="mut">What only they know cannot be used in a story until it comes out.</p>`)}`, { right: 'real heat' })}
    ${W('How strong, and which way', `${G('The bond', `<p><span class="l" style="width:8ch">Hate</span>${slider(-70, -100, 100, 'var(--dred)')}<span>Love</span> <span class="rd" style="margin-left:2ch">−70</span></p><p class="mut">Well below the line. They will not share a table.</p>`, 'margin-top:.35em')}
      ${G('Respect', `<p><span class="l" style="width:23ch">${first(P1)} for ${first(P2)}</span>${slider(20, 0, 100)}<span>grudging</span></p><p><span class="l" style="width:23ch">${first(P2)} for ${first(P1)}</span>${slider(72, 0, 100)}<span>a lot</span></p><p class="mut">It does not have to match. That is where stories come from.</p>`)}
      ${G('Jealousy', `<p><span class="l" style="width:23ch">${first(P1)} of ${first(P2)}</span>${slider(64, 0, 100, 'var(--dred)')}<span>of his spot</span></p><p><span class="l" style="width:23ch">${first(P2)} of ${first(P1)}</span>${slider(8, 0, 100)}<span>none</span></p>`)}
      ${G('Why', kv('What happened', inp('He took the win that was promised to me.', 42), 14) + kv('When', sel('Two weeks ago', 20), 14) + kv('Who remembers', rad(['Both', 'Only ' + first(P1)], 0), 14) + `<p class="mut">This is the line each of them carries. It shows on their dossier and in the notification bar.</p>`)}
      ${G('In the ring together', `<p>${rad(['Let the game decide', 'They click', 'They do not'], 0)}</p>`)}`, { right: 'bond −70' })}
    ${W('What it will do', `${G('Booked against each other', `<p><span class="gn">▲</span> The crowd can tell it is real.</p><p><span class="rd">▼</span> It will be stiff. Somebody may get hurt.</p>`, 'margin-top:.35em')}
      ${G('Booked as a team', `<p><span class="rd">▼</span> They will not work together. Morale drops for both.</p>`)}
      ${G('Backstage', `<p>Separate tables in catering.</p><p>${first(P1)} will come to your office to be kept away from him.</p><p>Friends of each take sides.</p>`)}
      ${G('Their other ties', `<div class="row" style="gap:.5ch">${F(R[4].id, 3)}${F(R[6].id, 3)}<span class="gn">friends of ${first(P1)}</span></div><div class="row" style="gap:.5ch;margin-top:.2em">${F(R[1].id, 3)}${F(R[9].id, 3)}<span class="rd">friends of ${first(P2)}</span></div>`)}
      ${G('The check', `<p><span class="gn">✔</span> No other tie between these two</p><p><span class="rd">!</span> They are in the same stable</p>`)}`, { right: '' })}</div>`;
  await shot('create-7-relationship', 'Ties', 'Ties ▸ <b>' + first(P1) + ' and ' + first(P2) + '</b>', rel, 'SAVE THE TIE');
  /* ================= 8. Create a storyline ================= */
  const ACTS = [['Spark', 'o', 'Angle', '{villain} takes the win promised to {hero}.', '1 week'], ['Escalation', 'b', 'Promo and brawl', '{hero} calls him out. {villain} brings a chair.', '3 weeks'], ['Twist', 'y', 'Angle', '{friend} turns on {hero}.', '1 week'], ['Blow-off', '', 'Match', '{hero} against {villain} at {event}.', 'the event']];
  const story = `<style>.act{display:grid;grid-template-columns:13ch 20ch minmax(0,1fr) 9ch;gap:1ch;align-items:center;border-bottom:1px solid var(--dgrey);padding:.2em 0}.act:last-child{border:0}.cast{display:grid;grid-template-columns:repeat(4,1fr);gap:1ch;text-align:center}.cast .pp{margin:0 auto}.cast b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cast .tg{margin:0}</style>
    <div class="scr" style="grid-template-columns:41ch minmax(0,1fr) 33ch;grid-template-rows:1fr">
    ${W('The storyline', `${kv('Name', inp('The broken promise', 24), 9)}
      ${G('What kind of story', opt(['A grudge', 'The chase', 'A betrayal', 'An invasion', 'Who did it?', 'The pupil', 'The streak', 'Last chance', 'A break-up'], 2, 3) + `<p class="mut">Somebody close turns. The crowd has to feel it coming and still be shocked.</p>`)}
      ${G('Who can start it', kv('Cost', sel('2 booking power', 18), 9) + kv('Needs', 'A hero the crowd is with, and somebody close to them', 9) + kv('Also', 'The writers can pitch it', 9))}
      ${G('How long', kv('Runs', sel('6 to 8 weeks', 18), 9) + kv('Ends at', sel('The next big event', 18), 9) + kv('If rushed', 'the ending lands flat', 9))}
      ${G('How it can go wrong', `<p><span class="rd">!</span> One of them is hurt: it stalls.</p><p><span class="rd">!</span> The crowd cheers the wrong one.</p><p><span class="rd">!</span> They have real heat: it gets stiff.</p>`)}`, { right: 'a betrayal' })}
    ${W('The story, act by act', `<p style="text-align:center">${led('story', .9)}</p>
      ${G('The cast', `<div class="cast">${[[R[3], 'The hero', 'd'], [R[7], 'The villain', ''], [R[4], 'The friend', 'y'], [R[0], 'The prize', 'b']].map(c => `<div>${F(c[0].id, 5.6)}<b>${first(c[0])}</b><span class="tg ${c[2]}">${c[1]}</span></div>`).join('')}</div><p class="mut" style="margin-top:.3em">Only for the preview. In a game the story casts itself.</p>`, 'margin-top:.7em')}
      ${G('The four acts', ACTS.map((a, i) => `<div class="act"><span><span class="tg ${a[1]}" style="margin:0">${i + 1} ${a[0]}</span></span><span>${sel(a[2], 15)}</span><span>${a[3]}</span><span class="mut">${a[4]}</span></div>`).join('') + `<p style="margin-top:.35em">${B('Add a beat')}${B('Add a second twist', 'g')}</p>`)}
      ${G('How it will read', `<div class="tv"><p><span class="s1">WEEK 1:</span> ${first(R[7])} takes the win promised to ${first(R[3])}.</p><p><span class="s1">WEEK 3:</span> ${first(R[3])} calls him out. ${first(R[7])} brings a chair.</p><p><span class="s1">WEEK 5:</span> <span class="hi">${first(R[4])} turns on ${first(R[3])}.</span></p><p><span class="s1">WEEK 7:</span> ${first(R[3])} against ${first(R[7])} at All Hallows’ Eve.</p></div>`)}`, { right: '4 acts, 7 weeks' })}
    ${W('What it pays', `${G('If it lands', `<p><span class="gn">▲</span> The hero’s popularity</p><p><span class="gn">▲</span> A sold-out big event</p><p><span class="gn">▲</span> The friend becomes a top villain</p>`, 'margin-top:.35em')}
      ${G('What people remember', `<p>The hero remembers who booked the betrayal, and whether he won at the end.</p><p>The friend remembers being given the turn.</p>`)}
      ${G('What it needs each week', `<p><span class="tg o">Act 1</span>An angle</p><p><span class="tg b">Act 2</span>A promo. Keep them apart.</p><p><span class="tg y">Act 3</span>The friend at ringside</p><p><span class="tg">Act 4</span>The match, on last</p>`)}
      ${G('Stories in this world', `<p><b>14</b> to start from</p><p>${B('Start from one', 'g')}</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Every act has its cast</p><p><span class="gn">✔</span> It ends in a match</p>`)}`, { right: '' })}</div>`;
  await shot('create-8-storyline', 'Stories', 'Stories ▸ <b>The broken promise</b>', story, 'SAVE THE STORY');
  /* ================= 9. Create an event: something happens, and the booker has to answer ================= */
  const ans = (n, t, ch, good, bad, cls) => `<div class="ans ${cls || ''}" style="display:block"><p><b>${n} · ${t}</b>${ch ? ` <span class="tg y" style="margin:0 0 0 .8ch">${ch}</span>` : ''}</p><p><span class="gn">${good}</span> <span class="rd">${bad}</span></p></div>`;
  const event = `<div class="scr" style="grid-template-columns:40ch minmax(0,1fr) 35ch;grid-template-rows:1fr">
    ${W('The event', `${kv('Name', inp('A walkout', 24), 9)}
      ${G('Where it happens', opt(['On your desk', 'Backstage', 'On the air', 'After the show'], 1, 2) + `<p class="mut">Backstage: it shows up as a person in a room, and costs an action point to deal with.</p>`)}
      ${G('What sets it off', kv('Who', sel('Anybody', 16), 8) + `<p>${rad(['All of these', 'Any of these'], 0)}</p><p><span class="tg">1</span>Mood is ${sel('Furious', 10)}</p><p><span class="tg">2</span>A promise to them is ${sel('Broken', 10)}</p><p><span class="tg">3</span>Standing with you is ${sel('Low', 10)}</p><p>${B('Add a cause')}</p>`)}
      ${G('How often', kv('Chance', 'None. Only its causes.', 8) + kv('Again', sel('Not for 12 weeks', 18), 8) + kv('Deadline', sel('The next show', 18), 8))}
      ${G('If it is ignored', kv('Then', sel('They go home', 18), 8) + `<p class="mut">And they remember that you never came.</p>`)}`, { right: 'backstage' })}
    ${W('What the booker sees', `<div class="row top" style="gap:2ch"><span>${led('event', .8)}</span></div>
      ${G('The words', kv('Headline', inp('{who} is packing a bag.', 46), 10) + kv('The line', inp('{who} has had enough. {friend} is with them.', 46), 10) + `<p class="mut">{who} is whoever set it off. {friend} is their closest friend. {owner}, {rival}, {champion} and {show} also work.</p>`, 'margin-top:.6em')}
      ${G('The answers', ans(1, 'Sit down with them', '55% chance', 'They stay, and they remember you came.', 'If it fails they leave tonight.', 'y') + ans(2, 'Send {friend}', '', 'They stay.', '{friend} will want a favour back.') + ans(3, 'Give them the win they were promised', '', 'They stay, happy.', 'It costs 1 booking power and somebody else loses.') + ans(4, 'Let them go', '', 'The room sees you will not be pushed.', 'Two weeks without them, and trust drops.', 'r') + `<p>${B('Add an answer')} <span class="mut">Two to four.</span></p>`)}
      ${G('What helps and what hurts answer 1', `<p><span class="gn">▲</span> Your skill at talking &nbsp; <span class="gn">▲</span> Where you stand with them</p><p><span class="rd">▼</span> Their mood &nbsp; <span class="rd">▼</span> Their ego</p>`)}`, { right: '4 answers' })}
    ${W('What each answer does', `${G('Answer 1, if it works', kv('Their mood', '<span class="gn">▲ 12</span>', 13) + kv('With you', '<span class="gn">▲ 8</span>', 13) + kv('Remember', '“You came to me.”', 13), 'margin-top:.35em')}
      ${G('Answer 1, if it fails', kv('They are gone', sel('2 weeks', 10), 13) + kv('Locker room', '<span class="rd">▼ 3 trust</span>', 13) + kv('Remember', '“You talked. I left.”', 13))}
      ${G('It can touch', `<p>Mood, stress, standing, a bond, trust, the owner, money, a feud, a title, a contract, tonight’s card.</p>`)}
      ${G('Try it', `<p>${B('Play it now')} <span class="mut">on a test roster</span></p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Every answer changes something</p><p><span class="rd">!</span> Answer 3 costs booking power</p>`)}`, { right: 'answer 1' })}</div>`;
  await shot('create-9-event', 'Events', 'Events ▸ <b>A walkout</b>', event, 'SAVE THE EVENT', 'A cause, never a flat chance.');
  /* ================= 10. Create a gimmick ================= */
  const GW0 = R[1];
  const gim = `<div class="scr" style="grid-template-columns:43ch minmax(0,1fr) 35ch;grid-template-rows:1fr">
    ${W('The gimmick', `${kv('Name', inp('The Emperor', 24), 9)}
      ${G('What kind of act', opt(['Brute', 'Cocky', 'Underdog', 'Daredevil', 'Technician', 'Monster', 'Old hand', 'Rebel', 'Hero', 'Showman', 'Mystic', 'Workhorse', 'Outlaw', 'Comedy', 'Royalty'], 14, 3) + `<p class="mut">He believes the company is his by right, and he dresses like it.</p>`)}
      ${G('Who it suits', kv('Side', sel('Villain', 14), 9) + kv('Talking', M(8, 'b', 8) + ' it lives on the mic', 9) + kv('Charisma', M(7, 'b', 8) + ' a lot', 9) + kv('Ring work', M(3, 'b', 8) + ' any', 9) + kv('Size', sel('Any', 14), 9))}
      ${G('Where it works', kv('Product', sel('Family and up', 18), 9) + kv('Crowds', 'Where they like spectacle', 9))}
      ${G('How long it lasts', kv('Fresh for', sel('About a year', 16), 9) + kv('Then', sel('It needs a twist', 18), 9))}`, { right: 'royalty' })}
    ${W('How it looks and sounds', `<div class="row top" style="gap:2ch">${F(GW0.id, 11)}<div style="flex:1"><p>${led('gim', .8)}</p><p class="bl big" style="margin-top:.3em">${GW0.name}</p><p class="mut">Shown on him for the preview. A gimmick can be given to anyone it suits.</p></div></div>
      ${G('The entrance', kv('Walks out', sel('Slowly, in a robe, with attendants', 34), 12) + kv('The crowd', sel('Boos, then louder boos', 34), 12) + kv('Lights', sw('#ffff55', ['#ffff55', '#ff5555', '#55ffff', '#ff55ff', '#ffffff', '#55ff55']) + ' ' + rad(['No fireworks', 'Fireworks'], 1), 12), 'margin-top:.6em')}
      ${G('What he says', kv('Catchphrase', inp('“Kneel, or be made to.”', 34), 12) + kv('About rivals', inp('{rival} is a peasant with a good tailor.', 44), 12) + kv('After a win', inp('The throne is not for sharing.', 44), 12))}
      ${G('On the air it sounds like this', `<div class="tv"><p><span class="s1">RING:</span> <span class="hi">INTRODUCING... THE EMPEROR, ${GW0.name.toUpperCase()}!</span></p><p style="color:var(--dcyan)">»He walks out slowly, in a robe, with attendants. The reaction: boos, then louder boos.</p><p><span class="s2">PEPYS:</span> “Kneel, or be made to.” He means it, partner.</p></div>`)}`, { right: 'preview' })}
    ${W('What it does', `${G('In the game', `<p><span class="gn">▲</span> Promos land harder</p><p><span class="gn">▲</span> A louder entrance</p><p><span class="rd">▼</span> Clean losses hurt it more</p><p><span class="rd">▼</span> It dies in a tag team</p>`, 'margin-top:.35em')}
      ${G('How well it fits him', kv('Fit', M(9, 'y', 8) + ' made for him', 5) + `<p class="mut">A poor fit shows on the report as a gimmick that is not connecting.</p>`)}
      ${G('Goes with', `<p><b>Moves:</b> a hold to beg out of</p><p><b>Stories:</b> The chase, A betrayal</p><p><b>Stables:</b> only as the leader</p>`)}
      ${G('Gimmicks in this world', `<p><b>62</b> written up ${B('Start from one', 'g')}</p>`)}
      ${G('The check', `<p><span class="gn">✔</span> Nobody else has this name</p><p><span class="gn">✔</span> Fits a family show</p>`)}`, { right: 'fits him' })}</div>`;
  await shot('create-10-gimmick', 'Gimmicks', 'Gimmicks ▸ <b>The Emperor</b>', gim, 'SAVE THE GIMMICK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
