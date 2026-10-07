const { open, go, state } = require('/home/claude/batman/app/tests/helper.js');
const { dots, bar } = require('./maplib.js');
(async () => {
  const { browser, page } = await open({ mode: 'desk', promo: 'whw' });
  const ids = await state(page, S => window.GP.rosterOf(S, S.player).filter(w => !w.nw).sort((a, b) => b.ovr - a.ovr).slice(0, 9).map(w => ({ id: w.id, name: w.name })));
  const faces = {};
  for (const w of ids) {
    await page.evaluate(id => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.ui.cards.push({ k: 'w', id }); D.render(); }, w.id); await page.waitForTimeout(250);
    const url = await page.evaluate(() => { const c = document.querySelector('.caw canvas') || document.querySelector('canvas'); return c ? c.toDataURL() : null; }); if (url) faces[w.name] = url;
  }
  await page.evaluate(() => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.render(); });
  const N = ids.map(w => w.name); console.log('faces', Object.keys(faces).length, N.join(', '));
  const P = [ // who, room, badge, tone, one line
    { n: N[0], room: 'office', b: '?', t: 'y', line: 'Wants a title shot' }, { n: N[1], room: 'office', b: '!', t: 'r', line: 'Arguing over the losing run', duo: N[2] }, { n: N[2], room: 'office', b: '!', t: 'r', line: 'Arguing over the losing run', duo: N[1] },
    { n: N[3], room: 'catering', b: '!', t: 'r', line: 'Furious after last night' }, { n: N[4], room: 'catering', b: '·', t: 'c', line: 'Eating alone. Low.' },
    { n: N[5], room: 'trainer', b: '+', t: 'r', line: 'Hurt. Out 3 weeks' }, { n: N[6], room: 'gym', b: '▲', t: 'g', line: 'The crowd is with them' }, { n: N[7], room: 'gym', b: '▲', t: 'g', line: 'Working late with a veteran' },
    { n: N[8], room: 'lot', b: '$', t: 'y', line: 'A rival made an offer' }];
  const ROOM = { office: 'YOUR OFFICE', owner: 'THE OWNER', catering: 'CATERING', trainer: "TRAINER'S ROOM", gym: 'THE GYM', lot: 'PARKING LOT' };
  const img = (n, cls) => `<img src="${faces[n] || ''}" class="${cls || 'dmp'}" alt="">`;
  const tok = (p, hot) => `<span class="tok t-${p.t}${hot ? ' hot' : ''}"><span class="pf">${img(p.n)}<b class="bd">${p.b}</b></span><small>${p.n}</small></span>`;
  const inRoom = r => P.filter(p => p.room === r);
  const H = P[3];
  const card = (style) => `<div class="hov" style="${style}"><div class="hh">${img(H.n, 'full')}<div><b class="gold">${H.n.toUpperCase()}</b><br><span class="bad">Furious after last night</span><br><span class="muted">In catering, not eating.</span></div></div>
    <p><span class="l">Why</span>Lost in 6 minutes. You promised a win.</p>
    <p><span class="l">Mood</span><span class="bad">●●</span><span class="muted">○○○○○○○○</span> <span class="bad">down 3</span></p>
    <p><span class="l">With you</span><span class="warn">●●●●</span><span class="muted">○○○○○○</span> <span class="muted">a broken promise</span></p>
    <p class="opt"><b>Sit down with them</b> <span class="warn">58%</span> <span class="muted">· 1 action point</span></p>
    <p class="opt"><b>Send ${N[4]} over</b> <span class="good">sure thing</span> <span class="muted">· 1 action point</span></p>
    <p class="opt"><b>Promise the rematch</b> <span class="muted">free · a promise on the card</span></p>
<i class="cur">▲</i></div>`;
  const base = `<style>
   .dmp{width:5.6ch;height:5.6ch;image-rendering:pixelated;display:block}
   .full{width:7ch;height:7ch;image-rendering:pixelated;border:2px solid var(--yellow);flex:none}
   .tok{display:inline-flex;flex-direction:column;align-items:center;width:10ch;text-align:center;vertical-align:top}.tok small{font-size:.72em;line-height:1.05;color:var(--white);max-width:10ch;overflow:hidden}
   .tok .pf{position:relative;display:block;padding:3px;background:#000058;border:2px solid var(--dcyan)}.tok .bd{position:absolute;top:-.55em;right:-1.1ch;min-width:1.7ch;height:1.15em;line-height:1.15em;background:var(--dcyan);color:var(--k);font-weight:normal;text-align:center}
   .tok.t-r .pf{border-color:var(--red)}.tok.t-r .bd{background:var(--red)}.tok.t-y .pf{border-color:var(--yellow)}.tok.t-y .bd{background:var(--yellow)}.tok.t-g .pf{border-color:var(--green)}.tok.t-g .bd{background:var(--green)}
   .tok.hot .pf{box-shadow:0 0 0 3px var(--white)}
   .hov{position:absolute;z-index:5;width:47ch;background:var(--blue);border:4px double var(--yellow);padding:.3em 1ch;box-shadow:1ch .6em 0 rgba(0,0,0,.6);font-size:.92em}.hov p{margin:.1em 0}.hov .hh{display:flex;gap:1.2ch;align-items:center;margin-bottom:.2em}
   .hov .l{display:inline-block;width:9ch;color:var(--dcyan)}.hov .opt{border:2px solid var(--dcyan);padding:0 1ch;margin:.2em 0}.hov .cur{position:absolute;font-style:normal;color:var(--white);font-size:1.5em}
   .bk{position:relative;margin:0 0 .5em}.bk .cap{color:var(--yellow);margin:0 0 .3em}
  </style>`;
  const road = [['NEW YORK', 'Empire Garden', 'A-', 'sold out'], ['ATLANTA', 'Peachtree Arena', 'B', '11,200'], ['DALLAS', 'Lone Star Hall', 'C+', '9,850']];
  const fld = (l, v) => `<p><span class="l">${l}</span><span class="v">${v}</span></p>`;
  const s2 = `<style>
   .a2x{background:var(--grey);color:var(--k);margin:0 0 .9em;box-shadow:1.2ch .7em 0 rgba(0,0,0,.55);border:2px solid var(--white);border-right-color:var(--dgrey);border-bottom-color:var(--dgrey)}
   .a2x .ttl{background:var(--blue);color:var(--white);padding:0 1ch;display:flex;justify-content:space-between}.a2x .ttl b{color:var(--yellow);font-weight:normal}
   .a2x .body{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,.9fr);gap:1.2ch;padding:.4em 1ch}
   .a2x .dmap{display:block;background:#0000aa;border:2px solid var(--dgrey);border-right-color:var(--white);border-bottom-color:var(--white)}
   .a2x .s{fill:#0044d0}.a2x .l0{fill:#00aa00}.a2x .l1{fill:#55ff55}.a2x .l2{fill:#008a3a}.a2x .n{fill:#ffff55;stroke:#000;stroke-width:.6}.a2x .x{fill:#ff55ff}
   .a2x .arc{fill:none;stroke:#fff;stroke-width:2}.a2x .arc.done{stroke:#ff5555}.a2x .arc.nx{stroke:#ffff55;stroke-dasharray:5 4}.a2x .arc.far{stroke:#ff55ff;stroke-dasharray:2 5}
   .a2x .cd{fill:#ff5555;stroke:#000}.a2x .cx{fill:#fff;stroke:#000}.a2x .cn{fill:#fff;stroke:#000;stroke-width:1.5}.a2x .ring{fill:none;stroke:#fff;stroke-width:1.6}
   .a2x .lb{font-family:inherit;font-size:15px;fill:#fff;paint-order:stroke;stroke:#000;stroke-width:3px}.a2x .lb.now{font-size:18px;fill:#ffff55}.a2x .lb.nx{fill:#ff9cff}
   .a2x .grp{border:2px solid var(--dgrey);padding:.5em 1ch .2em;position:relative;margin-top:.5em}.a2x .grp>h4{position:absolute;top:-.75em;left:1ch;margin:0;background:var(--grey);padding:0 .6ch;font-weight:normal;color:var(--dred)}
   .a2x p{margin:0 0 .12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.a2x .l{display:inline-block;width:12ch;color:#333}.a2x .v{color:#000}.a2x .big{font-size:1.3em;color:var(--blue)}
   .a2x .bt{display:inline-block;background:var(--dgreen);color:var(--white);padding:0 1.5ch;box-shadow:.6ch .3em 0 #000;margin:.3em 1.5ch .4em 0}.a2x .gb{color:#006000}.a2x .rb{color:var(--dred)}.a2x .bl{color:var(--blue)}
  </style><section class="a2x" data-mock="2"><div class="ttl"><span>═[■]═</span><b>Tour map: October 2026</b><span>═[↕]═</span></div><div class="body">
   ${dots({ sx: 8.0, step: 6.5, sq: 1, sea: 1 })}
   <div><p class="big">CHICAGO, ILLINOIS</p><p>Monday Night Dynasty · the bell rings in 2 days</p>
    <div class="grp"><h4>The building</h4>${fld('Arena', 'Lakefront Coliseum')}${fld('Seats', '16,000')}${fld('Sold', '<b class="gb">13,420</b> (84%) <span class="gb">' + bar(13420, 16000, 10) + '</span>')}${fld('This week', '<span class="gb">+1,150</span> since Monday')}${fld('Gate so far', '$603,900 at $45')}</div>
    <div class="grp"><h4>The crowd</h4>${fld('Market', '<b class="gb">Strong</b>')}${fld('Likes', 'Brawling')}${fld('Last here', '9 weeks ago, A-, sold out')}${fld('In town', '<span class="rb">A rival ran here 3 weeks ago</span>')}</div></div>
   <div><div class="grp"><h4>Hometown</h4><p><b class="bl">${N[2]}</b></p><p>The crowd is theirs tonight.</p><p><b class="bl">${N[6]}</b></p><p>Trained here.</p></div>
    <div class="grp"><h4>The road</h4>${road.map(r => `<p>${r[0]} <span class="gb">${r[2]}</span> · ${r[3]}</p>`).join('')}<p><b style="color:#000">► CHICAGO this week</b></p><p class="bl">Denver next · 6,300 sold</p><p class="bl">Los Angeles · big event</p></div>
    <span class="bt">Year schedule</span><span class="bt">Ticket prices</span></div></div></section>`;
  const D = await state(page, S => { const E = window.GP, T = E.tasks(S).list, X = E.expectWords(S); return { tasks: T.map(t => ({ text: t.short || t.text, state: t.state, label: t.label, req: t.req, waive: t.waive })), inbox: S.inbox.filter(e => !e.done).map(e => ({ text: e.text, choices: e.choices })), show: S.queue[S.qi].name, left: S.queue.length - S.qi, exp: X.a, bar: X.bar, coming: (E.comingUp(S) || []).map(c => c.t || c.text || String(c)).slice(0, 3), ap: E.backstage(S).ap }; });
  console.log(JSON.stringify(D).slice(0, 600));
  const shot = async (name, pageName, html, keepHead) => {
    await go(page, pageName === 'desk' ? 'backstage' : 'desk'); await go(page, pageName); await page.waitForTimeout(250);
    await page.evaluate(([h, keep]) => { const m = document.querySelector('main.main'); const head = m.querySelector('.head'); let n = head.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } const d = document.createElement('div'); d.setAttribute('data-mock', '1'); d.innerHTML = h; head.insertAdjacentElement('afterend', d); if (!keep) head.remove(); window.scrollTo(0, 0); }, [html, keepHead]);
    await page.waitForTimeout(250); const b = await page.evaluate(() => Math.round(Math.max(document.querySelector('[data-mock]').getBoundingClientRect().bottom, ...[...document.querySelectorAll('.hov')].map(e => e.getBoundingClientRect().bottom))));
    await page.screenshot({ path: process.argv[2] + '/' + name + '.png', clip: { x: 0, y: 0, width: 1280, height: Math.min(860, Math.max(b + 46, 700)) } }); console.log(name, b);
  };
  /* ================= the whole desk, in windows, on one screen ================= */
  const win = `<style>
   .wn{background:var(--grey);color:var(--k);box-shadow:1ch .6em 0 rgba(0,0,0,.55);border:2px solid var(--white);border-right-color:var(--dgrey);border-bottom-color:var(--dgrey);min-width:0;display:flex;flex-direction:column}
   .wn>.ttl{background:var(--blue);color:var(--white);padding:0 1ch;display:flex;justify-content:space-between;flex:none}.wn>.ttl b{color:var(--yellow);font-weight:normal}.wn.hot>.ttl{background:var(--dred)}
   .wn>.bd{padding:.35em 1ch .4em;flex:1;min-height:0;overflow:hidden}.wn p{margin:0 0 .15em}.wn b{color:#000;font-weight:normal}.wn>.ttl b{color:var(--yellow)}.wn .bl,.wn b.bl{color:var(--blue)}.wn .mut{color:#444}.wn .bl{color:var(--blue)}.wn .rd{color:var(--dred)}.wn .gn{color:#006000}
   .wn .bt{display:inline-block;background:var(--dgreen);color:var(--white);padding:0 1.4ch;box-shadow:.6ch .3em 0 #000;margin:.2em 1.4ch .35em 0;white-space:nowrap}.wn .bt.y{background:var(--yellow);color:var(--k)}.wn .bt.g{background:var(--dgrey)}
   .wn .tg{display:inline-block;padding:0 .6ch;background:var(--dred);color:var(--white);margin-right:.8ch}.wn .tg.o{background:var(--dgrey)}.wn .tg.d{background:#006000}
   .wn .it{border-bottom:1px solid var(--dgrey);padding:.15em 0 .05em;display:flex;justify-content:space-between;gap:1ch;align-items:flex-start}.wn .it:last-child{border:0}.wn .it>span:first-child{min-width:0}
   .dsk{display:grid;grid-template-columns:1.2fr 1.15fr 1fr;gap:1em 2.2ch;margin-top:.9em;height:14.6em}.dsk .wn .bt{margin:0 0 .3em .6ch;font-size:.92em}
   .a2x{margin:0!important}.a2x .body{padding:.3em 1ch!important}.a2x p{margin:0 0 .05em!important}.a2x .grp{margin-top:.45em!important;padding:.4em 1ch .1em!important}
  </style>`;
  const clip = (t, n) => t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t;
  const fire = `<p><span class="tg">Today</span><b>${N[3]} went home furious.</b></p><p>Lost in six minutes on Monday, two weeks after you promised a win. The locker room is watching what you do.</p><p><span class="bt">Sit down with them</span><span class="bt g">Fine them</span><span class="bt g">Let it go</span></p>
    <p style="border-top:1px solid var(--dgrey);padding-top:.25em"><span class="tg o">2 weeks</span><b>The network deal is up.</b> Stay, move or hold out.</p><p><span class="bt">Answer</span></p>`;
  const tasks = D.tasks.slice(0, 5).map(t => `<div class="it"><span><span class="tg${t.req ? '' : (t.state === 'done' ? ' d' : (t.state === 'todo' ? '' : ' o'))}">${t.req ? 'Required' : (t.state === 'todo' ? 'To do' : (t.state === 'done' ? 'Done' : 'Worth doing'))}</span>${clip(t.text, 40)}</span><span style="white-space:nowrap">${t.label ? `<span class="bt">${t.label}</span>` : ''}</span></div>`).join('');
  const desk = win + s2.replace('<b>Tour map: October 2026</b>', '<b>The road · Week 1, October 2026</b>') + `<div class="dsk">
    <div class="wn hot"><div class="ttl"><span>═[■]═</span><b>On your desk: 2 to answer</b><span></span></div><div class="bd">${fire}</div></div>
    <div class="wn"><div class="ttl"><span>═[■]═</span><b>This week's tasks</b><span>${D.tasks.filter(t => t.state === 'todo').length} to do</span></div><div class="bd">${tasks}</div></div>
    <div class="wn"><div class="ttl"><span>═[■]═</span><b>Next show</b><span></span></div><div class="bd"><p class="bl" style="font-size:1.3em">${D.show}</p><p class="mut">${D.left} shows left this week</p>
      <p>This crowd expects <b>${D.exp}</b>: matches of <b>${D.bar}</b> or better.</p><p><span class="bt y">Book the next show</span></p>
      <p style="border-top:1px solid var(--dgrey);padding-top:.2em"><b>Backstage:</b> ${D.ap} action points, <span class="rd">2 at your door</span></p><p><span class="bt">Go backstage</span><span class="bt g">Last night</span></p>
      <p class="mut">Coming up: All Hallows' Eve in 3 weeks.</p></div></div></div>`;
  require('fs').writeFileSync(__dirname + '/desk.html', desk);
  await shot('desk-window-onescreen', 'desk', desk, false);
  /* the road window on today's desk, whole page */
  await go(page, 'backstage'); await go(page, 'desk'); await page.waitForTimeout(250);
  await page.evaluate(h => { const m = document.querySelector('main.main'); const head = m.querySelector('.head'); const d = document.createElement('div'); d.innerHTML = h; head.insertAdjacentElement('afterend', d); window.scrollTo(0, 0); }, s2 + '<div style="height:.9em"></div>');
  await page.waitForTimeout(200); await page.screenshot({ path: process.argv[2] + '/desk-window-today.png', fullPage: true });
  /* ================= the call board, three ways ================= */
  const R = [P[3], P[5], P[1], P[2], P[0], P[8], P[4], P[6], P[7]].map(p => Object.assign({ mood: p.t === 'r' ? 2 : (p.t === 'g' ? 8 : (p.t === 'c' ? 4 : 6)), you: p.t === 'r' ? 4 : (p.t === 'g' ? 7 : 5) }, p));
  const pf = (p, cls) => `<img src="${faces[p.n] || ''}" class="${cls || 'pp'}" alt="">`;
  const bb = (n, w) => '█'.repeat(n) + '░'.repeat((w || 10) - n);
  /* 1. the grey desktop window: a list box and a side panel */
  const v1 = base + win + `<style>
   .b1{display:grid;grid-template-columns:minmax(0,1fr) 31ch;gap:1.6ch}.b1 .lst{background:var(--dcyan);border:2px solid var(--dgrey);border-right-color:var(--white);border-bottom-color:var(--white)}
   .b1 .hd,.b1 .rw{display:grid;grid-template-columns:5.4ch 25ch 16ch minmax(0,1fr) 11ch 11ch;gap:1.2ch;align-items:center;padding:0 .8ch}.b1 .hd{background:var(--grey);border-bottom:2px solid var(--dgrey);color:var(--blue)}
   .b1 .rw{border-bottom:1px solid #007c7c;padding-block:2px}.b1 .pp{width:3.7ch;height:3.7ch;image-rendering:pixelated;display:block;border:2px solid #000}.b1 .rw b{font-weight:normal;font-size:1.12em;white-space:nowrap;overflow:hidden}
   .b1 .rw span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.b1 .t-r .wh{color:#7a0000}.b1 .t-g .wh{color:#004800}.b1 .mb{color:#004800}.b1 .t-r .mb{color:#7a0000}.b1 .yb{color:var(--blue)}
   .b1 .rw.sel{background:var(--dgreen);color:var(--white)}.b1 .rw.sel .wh,.b1 .rw.sel .mb,.b1 .rw.sel .yb{color:var(--white)}.b1 .rw.sel .pp{border-color:var(--yellow)}
   .b1 .grp{border:2px solid var(--dgrey);padding:.5em 1ch .2em;position:relative;margin:.5em 0 .7em}.b1 .grp>h4{position:absolute;top:-.75em;left:1ch;margin:0;background:var(--grey);padding:0 .6ch;font-weight:normal;color:var(--dred)}
   .v1 .hov{background:var(--grey);color:var(--k);border:2px solid var(--white);border-right-color:var(--dgrey);border-bottom-color:var(--dgrey);padding:0 0 .3em}.v1 .hov>*{margin-inline:1ch}.v1 .hov:before{content:"═[■]═  George Washington";display:block;background:var(--blue);color:var(--yellow);padding:0 1ch;margin:0 0 .3em}
   .v1 .hov .gold{color:var(--blue)}.v1 .hov .bad{color:var(--dred)}.v1 .hov .muted{color:#444}.v1 .hov .warn{color:#6b5a00}.v1 .hov .good{color:#006000}.v1 .hov .l{color:#333}.v1 .hov .opt{border:0;background:var(--dgreen);color:var(--white);box-shadow:.6ch .3em 0 #000;margin:.35em 2ch .45em 1ch}.v1 .hov .opt *{color:var(--white)!important}.v1 .hov .cur{color:var(--yellow)}
  </style><div class="bk v1"><p class="cap">1. The desktop window: a list box, grey panels and green buttons, the same look as the road window</p>
   <div class="wn"><div class="ttl"><span>═[■]═</span><b>Backstage: who needs you tonight</b><span>═[↕]═</span></div><div class="bd b1">
    <div class="lst"><div class="hd"><span></span><span>Who</span><span>Where</span><span>What is going on</span><span>Mood</span><span>With you</span></div>
     ${R.map((p, i) => `<div class="rw t-${p.t}${i === 0 ? ' sel' : ''}">${pf(p)}<b>${p.n}</b><span>${ROOM[p.room].charAt(0) + ROOM[p.room].slice(1).toLowerCase()}</span><span class="wh">${p.line}</span><span class="mb">${bb(p.mood)}</span><span class="yb">${bb(p.you)}</span></div>`).join('')}</div>
    <div><div class="grp"><h4>This week</h4><p><b class="bl" style="font-size:1.3em">3 action points</b></p><p>9 people with something going on.</p><p class="rd">3 are trouble.</p></div>
     <div class="grp"><h4>Show me</h4><p>(•) Worst first</p><p>( ) By room</p><p>( ) People at my door</p></div>
     <p><span class="bt">Things to do</span></p><p><span class="bt g">Around the building</span></p></div></div></div>
   ${card('right:36ch;top:8.6em').replace('<i class="cur">▲</i>', '<i class="cur" style="left:-2.4ch;top:-1.9em">◄</i>')}</div>`;
  /* 2. ANSI text mode: ruled columns, shaded bars, inverse tags */
  const tag = { office: 'ty', owner: 'tw', catering: 'tm', trainer: 'tr', gym: 'tg2', lot: 'tc' };
  const v2 = base + `<style>
   .b2{border:4px double var(--yellow);background:var(--blue)}.b2 .ttl{background:var(--dcyan);color:var(--k);padding:0 1ch;display:flex;justify-content:space-between}
   .b2 .hd,.b2 .rw{display:grid;grid-template-columns:5.6ch 26ch 18ch minmax(0,1fr) 13ch 13ch 4ch;align-items:center}.b2 .hd>span,.b2 .rw>span{padding:0 1ch;border-right:2px solid var(--dcyan);align-self:stretch;display:flex;align-items:center;white-space:nowrap;overflow:hidden}
   .b2 .hd>span:last-child,.b2 .rw>span:last-child{border-right:0}.b2 .hd{color:var(--cyan);border-bottom:2px solid var(--dcyan);background:#000080}
   .b2 .rw{border-bottom:1px solid #0000d8}.b2 .rw:nth-child(odd){background:#00008c}.b2 .pp{width:3.7ch;height:3.7ch;image-rendering:pixelated;display:block;border:2px solid var(--dcyan);margin:2px 0}
   .b2 .nm{color:var(--yellow);font-size:1.15em}.b2 .rt i{font-style:normal;padding:0 .8ch;color:var(--k)}.b2 .ty{background:var(--yellow)}.b2 .tm{background:var(--mag)}.b2 .tr{background:var(--red)}.b2 .tg2{background:var(--green)}.b2 .tc{background:var(--cyan)}
   .b2 .t-r .wh{color:var(--red)}.b2 .t-g .wh{color:var(--green)}.b2 .t-y .wh{color:var(--yellow)}.b2 .wh{color:var(--white)}.b2 .mb{color:var(--green)}.b2 .t-r .mb{color:var(--red)}.b2 .yb{color:var(--cyan)}.b2 .ic{color:var(--k);background:var(--dcyan);justify-content:center}.b2 .t-r .ic{background:var(--red)}.b2 .t-y .ic{background:var(--yellow)}.b2 .t-g .ic{background:var(--green)}
   .b2 .rw.sel{background:var(--dcyan)}.b2 .rw.sel>span{color:var(--k);border-color:var(--blue)}.b2 .rw.sel .nm{color:var(--white)}.b2 .rw.sel .mb,.b2 .rw.sel .yb,.b2 .rw.sel .wh{color:var(--k)}.b2 .rw.sel .pp{border-color:var(--yellow)}
   .b2 .ft{border-top:2px solid var(--dcyan);padding:0 1ch;color:var(--grey);display:flex;gap:3ch}.b2 .ft b{color:var(--yellow);font-weight:normal}
  </style><div class="bk v2"><p class="cap">2. Text mode: ruled columns, shaded bars and colour tags, on the game's own blue</p>
   <div class="b2"><div class="ttl"><span>■ BACKSTAGE · WHO NEEDS YOU TONIGHT</span><span>3 ACTION POINTS</span></div>
    <div class="hd"><span></span><span>WHO</span><span>WHERE</span><span>WHAT IS GOING ON</span><span>MOOD</span><span>WITH YOU</span><span></span></div>
    ${R.map((p, i) => `<div class="rw t-${p.t}${i === 0 ? ' sel' : ''}"><span style="padding:0 .6ch">${pf(p)}</span><span class="nm">${p.n}</span><span class="rt"><i class="${tag[p.room]}">${ROOM[p.room]}</i></span><span class="wh">${p.line}</span><span class="mb">${'▓'.repeat(p.mood) + '░'.repeat(10 - p.mood)}</span><span class="yb">${'▓'.repeat(p.you) + '░'.repeat(10 - p.you)}</span><span class="ic">${p.b}</span></div>`).join('')}
    <div class="ft"><span><b>↑↓</b> move</span><span><b>Enter</b> open</span><span><b>F2</b> things to do</span><span><b>F3</b> by room</span><span>Page 1 of 1</span></div></div>
   ${card('right:6ch;top:8.4em').replace('<i class="cur">▲</i>', '<i class="cur" style="left:-2.4ch;top:-1.6em">◄</i>')}</div>`;
  /* 3. the call sheet: dot-matrix ink on green-bar paper, photos clipped on, a note stuck to it */
  const v3 = base + `<style>
   .b3{background:#f4f1e2;color:#1b2a4a;padding:.3em 4.5ch .5em;position:relative;background-image:repeating-linear-gradient(#f4f1e2 0 2.5em,#dcebd2 2.5em 5em);box-shadow:.8ch .5em 0 rgba(0,0,0,.45)}
   .b3:before,.b3:after{content:"";position:absolute;top:0;bottom:0;width:3ch;background:radial-gradient(circle at 50% 50%,#0000aa 0 .42ch,transparent .46ch) 0 0/3ch 1.6em}.b3:before{left:0;border-right:1px dashed #a9b5a0}.b3:after{right:0;border-left:1px dashed #a9b5a0}
   .b3 .ttl{display:flex;justify-content:space-between;border-bottom:2px dotted #1b2a4a;letter-spacing:.14em;font-size:1.15em}
   .b3 .hd,.b3 .rw{display:grid;grid-template-columns:5.6ch 31ch 18ch minmax(0,1fr) 12ch 12ch;gap:1.2ch;align-items:center;text-transform:uppercase}.b3 .hd{color:#5d6f9c;letter-spacing:.12em;font-size:.82em;border-bottom:2px dotted #5d6f9c}
   .b3 .rw{height:2.5em}.b3 .rw span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.b3 .pp{width:3.5ch;height:3.5ch;image-rendering:pixelated;display:block;border:3px solid #fff;box-shadow:2px 2px 0 rgba(0,0,0,.35);transform:rotate(-3deg)}.b3 .rw:nth-child(odd) .pp{transform:rotate(2deg)}
   .b3 .nm{font-size:1.15em;letter-spacing:.03em}.b3 .t-r .wh,.b3 .t-r .mb{color:#c81e1e}.b3 .mb,.b3 .yb{letter-spacing:-.06em}.b3 .yb{color:#5d6f9c}
   .b3 .rw.sel{outline:3px solid #c81e1e;outline-offset:-2px;border-radius:1.2em}.b3 .ft{border-top:2px dotted #1b2a4a;margin-top:.2em;letter-spacing:.1em;display:flex;justify-content:space-between}
   .v3 .hov{background:#fff58a;color:#1b2a4a;border:0;box-shadow:.8ch .6em 0 rgba(0,0,0,.4);transform:rotate(1.2deg);padding:.5em 1.4ch}.v3 .hov .gold{color:#1b2a4a}.v3 .hov .bad{color:#c81e1e}.v3 .hov .muted{color:#6b6540}.v3 .hov .warn{color:#8a5a00}.v3 .hov .good{color:#006000}.v3 .hov .l{color:#6b6540}
   .v3 .hov .opt{border:0;border-bottom:2px dotted #1b2a4a;padding:0}.v3 .hov .opt:before{content:"☐ "}.v3 .hov b{color:#1b2a4a}.v3 .hov .full{border:3px solid #fff;box-shadow:2px 2px 0 rgba(0,0,0,.35)}.v3 .hov .cur{color:#c81e1e}
  </style><div class="bk v3"><p class="cap">3. The call sheet: a printout on green-bar paper, photos clipped on, your notes on a yellow sticker</p>
   <div class="b3"><div class="ttl"><span>EWF CALL SHEET</span><span>BACKSTAGE · MONDAY NIGHT DYNASTY</span><span>3 ACTION POINTS</span></div>
    <div class="hd"><span></span><span>Who</span><span>Where</span><span>What is going on</span><span>Mood</span><span>With you</span></div>
    ${R.map((p, i) => `<div class="rw t-${p.t}${i === 0 ? ' sel' : ''}">${pf(p)}<span class="nm">${p.n}</span><span>${ROOM[p.room]}</span><span class="wh">${p.b === '!' || p.b === '+' ? '▶ ' : ''}${p.line}</span><span class="mb">${bb(p.mood)}</span><span class="yb">${bb(p.you)}</span></div>`).join('')}
    <div class="ft"><span>9 LISTED · 3 MARKED TROUBLE</span><span>PAGE 1 OF 1</span></div></div>
   ${card('right:7ch;top:7.6em').replace('<i class="cur">▲</i>', '<i class="cur" style="left:-2.4ch;top:-1em">◄</i>')}</div>`;
  await shot('board-window', 'backstage', v1, true); await shot('board-ansi', 'backstage', v2, true); await shot('board-paper', 'backstage', v3, true);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
