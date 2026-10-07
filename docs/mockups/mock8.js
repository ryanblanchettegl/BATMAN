const { open, go, state } = require('/home/claude/batman/app/tests/helper.js');
(async () => { const { browser, page } = await open({ mode: 'desk', promo: 'whw' });
  const W = await state(page, S => { const R = window.GP.rosterOf(S, S.player); const f = n => { const w = R.filter(x => x.name === n)[0]; return { id: w.id, name: w.name, fin: w.fin }; }; return { a: f('Alexander the Great'), b: f('Napoleon Bonaparte'), pbp: (S.voices || []).filter(v => v.hired).map(v => v.name) }; });
  const faces = {};
  for (const w of [W.a, W.b]) { await page.evaluate(id => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.ui.cards.push({ k: 'w', id }); D.render(); }, w.id); await page.waitForTimeout(250);
    faces[w.id] = await page.evaluate(() => { const c = document.querySelector('.caw canvas') || document.querySelector('canvas'); return c ? c.toDataURL() : null; }); }
  await page.evaluate(() => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.render(); });
  await state(page, S => { S.inbox.forEach(e => { if (!e.done) window.GP.resolveEvent(S, e.id, 1); }); });
  await go(page, 'booking'); await page.click('[data-t="suggest"]'); await page.click('[data-t="advance"]');
  for (let i = 0; i < 8 && !(await page.$('#live')); i++) { if (await page.$('[data-t="pre"]')) await page.click('[data-t="pre"][data-c="0"]'); else if (await page.$('.win')) await page.click('#modal-ok'); else await page.click('[data-t="advance"]'); await page.waitForTimeout(120); }
  for (let i = 0; i < 9; i++) { if (await page.$('.lv-head h1') && (await page.$$('.lv-lines .pbp')).length >= 2) break; await page.click('[data-t="advance"]'); await page.waitForTimeout(700); }
  await page.waitForTimeout(1200);
  const names = await page.evaluate(() => [...document.querySelectorAll('.lv-lines .sp')].map(e => e.innerText.replace(':', '')).filter(x => !/RING|HEADSET/i.test(x)));
  const PBP = (names.find(n => /herodotus/i.test(n)) || names[1] || 'Play-by-play'), COL = (names.find(n => n !== PBP) || 'Colour');
  const A = W.a, B = W.b, a1 = A.name.split(' ')[0], b1 = B.name.split(' ')[0];
  const ln = (cls, sp, tx) => `<p class="ln ${cls}">${sp ? `<span class="sp">${sp}:</span>` : ''}<span class="tx">${tx}</span></p>`;
  const lines = [ln('pbp', PBP, `${a1} has him up for the ${A.fin}... ${b1} slides off his back!`), ln('col', COL, 'He scouted it! He has watched that move for a year!'), ln('pbp', PBP, `Boot to the ribs. ${b1} hooks the arm. The ${B.fin}!`), ln('ear', 'Headset', 'Milo of Croton: “That is the finish. Let them have it.”'), ln('pbp', PBP, 'Cover! One... two...'),
    ln('pbp last', PBP, 'THREE! He has done it! Listen to this building!'), ln('ring', 'Ring', `HERE IS YOUR WINNER, AND THE NEW IMPERIAL WORLD CHAMPION...`), ln('ring', 'Ring', `${B.name.toUpperCase()}!`), `<p class="ln ent">»${A.name} sits against the ropes with his head down. The belt goes past him.</p>`, ln('col', COL, 'Thirty-one weeks, and it ends like that.')].join('');
  const feed = [['@TheRingsideWire', 'NEW CHAMPION. ' + B.name + ' beats ' + A.name + ' in Chicago.', '4.1K', 'now', 'w'], ['@top_rope_tess', 'I AM IN THE BUILDING. THE FLOOR IS SHAKING.', '880', 'now', ''], ['@ironcrown_ian', a1 + ' was robbed and you all know it', '412', 'now', 'r'], ['@whw_faithful', '31 weeks. What a reign. What a way to lose it.', '1.2K', '1m', '']];
  const bars = [2, 2, 3, 2, 3, 4, 3, 4, 5, 4, 6, 5, 7, 6, 8, 9, 11, 14, 16, 16];
  const spark = `<svg viewBox="0 0 ${bars.length * 9} ${16 * 6}" width="${bars.length * 9}" height="${16 * 6}" style="display:block">${bars.map((h, x) => Array.from({ length: 16 }, (_, y) => `<circle cx="${x * 9 + 4}" cy="${(15 - y) * 6 + 3}" r="2.2" fill="${y < h ? (y >= 12 ? '#ff5555' : (y >= 7 ? '#ffff55' : '#00aa00')) : '#0c2a2a'}"/>`).join('')).join('')}</svg>`;
  // the belt, in dots
  let belt = ''; const BW = 66, BH = 17, st = 7;
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const dx = x - (BW - 1) / 2, dy = y - (BH - 1) / 2, e = (dx / 11.5) ** 2 + (dy / 8.6) ** 2;
    const side = (Math.abs(Math.abs(dx) - 20) < 5.5 && Math.abs(dy) < 5.6), strap = Math.abs(dy) < 3.6 && Math.abs(dx) < 32.5, centre = e <= 1;
    if (!(centre || side || strap)) continue; const rim = centre && e > 0.72, star = centre && (Math.abs(dx) + Math.abs(dy) * 1.5 < 4.2), sideRim = side && (Math.abs(Math.abs(dx) - 20) > 4 || Math.abs(dy) > 4.4);
    const c = centre ? (star ? '#aa0000' : (rim ? '#fff36b' : '#c9a400')) : (side ? (sideRim ? '#fff36b' : '#b08f00') : '#5a3d10');
    belt += `<circle cx="${x * st + st / 2}" cy="${y * st + st / 2}" r="${centre || side ? 2.9 : 2.5}" fill="${c}"/>`; }
  const beltSvg = `<svg viewBox="0 0 ${BW * st} ${BH * st}" width="${BW * st}" height="${BH * st}" style="display:block;margin:0 auto;filter:drop-shadow(0 0 3px #806000)">${belt}</svg>`;
  const css = `<style>
   .mfeed{margin-top:.5em;border-top:2px solid var(--dcyan);padding-top:.3em;font-size:.92em}.mfeed h2{display:flex;justify-content:space-between;align-items:center}.mfeed .lv{color:var(--red)}
   .mfeed .noise{display:flex;gap:1.4ch;align-items:flex-end;margin:.2em 0 .4em}.mfeed .noise p{margin:0;color:var(--dcyan);line-height:1.15}.mfeed .noise b{color:var(--yellow);font-weight:normal;font-size:1.5em}
   .mfeed .po{border-top:1px dotted var(--dcyan);padding:.16em 0}.mfeed .po .h{color:var(--cyan)}.mfeed .po .h.w{color:var(--yellow)}.mfeed .po .t{color:var(--dcyan);float:right}.mfeed .po p{margin:0;color:var(--grey);line-height:1.15}.mfeed .po.r p{color:var(--red)}.mfeed .po .lk{color:var(--mag)}
   .mfeed .po.new{background:#0b2c33}
   .cdim{position:fixed;inset:30px 0 26px 0;background:rgba(0,0,0,.5);z-index:40;right:412px}
   .cpop{position:fixed;z-index:50;left:100px;top:160px;width:700px;font-size:20.736px;background:var(--grey);color:#000;border:3px solid var(--yellow);box-shadow:1.6ch 1em 0 rgba(0,0,0,.85),0 0 0 2px #000}
   .cpop .ttl{background:#806000;color:var(--yellow);display:flex;justify-content:space-between;padding:0 1ch}.cpop .ttl b{font-weight:normal;color:#fff;letter-spacing:.3em}
   .cpop .led{background:#000;margin:.5em 1.2ch .3em;padding:.35em 0 .3em;border:3px solid #222;border-right-color:#fff;border-bottom-color:#fff;text-align:center}
   .cpop .led .big{font-size:3.05em;line-height:.95;color:var(--yellow);letter-spacing:.06em;-webkit-mask:radial-gradient(circle,#000 0 62%,transparent 66%) 0 0/4px 4px;mask:radial-gradient(circle,#000 0 62%,transparent 66%) 0 0/4px 4px;text-shadow:1px 0 0 currentColor,0 1px 0 currentColor}
   .cpop .led .glow{filter:drop-shadow(0 0 5px #ffd800)}
   .cpop .body{display:grid;grid-template-columns:auto 1fr;gap:2ch;padding:.2em 1.4ch .2em;align-items:center}.cpop .body img{width:11ch;height:11ch;image-rendering:pixelated;border:3px solid #000;box-shadow:.6ch .4em 0 rgba(0,0,0,.5)}
   .cpop p{margin:0 0 .12em}.cpop .nm{font-size:1.75em;line-height:1;color:var(--blue)}.cpop .mut{color:#444}.cpop .stars{font-size:2.2em;line-height:1;color:#806000;text-shadow:2px 2px 0 #fff}
   .cpop .tg{display:inline-block;padding:0 .7ch;color:#fff;margin-right:.8ch}.cpop .rem{border-top:2px solid var(--dgrey);margin:.35em 1.4ch 0;padding:.3em 0 .4em}.cpop .rd{color:var(--dred)}.cpop .gn{color:#006000}
  </style>`;
  const setLive = async () => page.evaluate(([lines, feedHtml, fa, fb, A, B, css]) => {
    document.querySelectorAll('[data-mock]').forEach(e => e.remove());
    document.querySelector('.lv-head .eyebrow').innerText = 'Match 5 of 5 · Imperial World Title · 28 min'; document.querySelector('.lv-head h1').innerText = A.name + ' vs ' + B.name;
    const rows = document.querySelectorAll('.lv-head .vs .row'); [fa, fb].forEach((src, i) => { rows[i].innerHTML = '<img src="' + src + '" style="width:58px;height:58px;image-rendering:pixelated;border:2px solid var(--grey);display:block">'; });
    document.querySelector('.lv-lines').innerHTML = lines; document.querySelector('[data-t="live-where"]').innerText = 'On the air · 1:57 into the show';
    const nt = [...document.querySelectorAll('.nt-r')], st = ['★★★½', '★★★', '★★★¾', '★★★¼', '★★★', '★★★★', 'On now']; nt.forEach((li, i) => { li.classList.toggle('now', i === nt.length - 1); li.querySelector('.st').innerText = st[i] || ''; if (i === nt.length - 1) li.querySelector('.who').innerText = (A.name + ' vs ' + B.name); });
    const foot = document.querySelector('.nt-foot'); const d = document.createElement('div'); d.setAttribute('data-mock', '1'); d.innerHTML = css + feedHtml; foot.parentElement.insertBefore(d, foot); foot.style.display = 'none';
  }, [lines, `<div class="mfeed"><h2><span>The feed</span><span class="lv">● LIVE</span></h2><div class="noise">${spark}<p><b>2,140</b><br>posts a minute<br><span style="color:var(--red)">▲ loudest of the night</span></p></div>${feed.map((f, i) => `<div class="po ${f[4] === 'r' ? 'r' : ''}${i < 2 ? ' new' : ''}"><span class="h ${f[4] === 'w' ? 'w' : ''}">${f[0]}</span><span class="t">${f[3]}</span><p>${f[1]} <span class="lk">♥ ${f[2]}</span></p></div>`).join('')}</div>`, faces[A.id], faces[B.id], A, B, css]);
  await setLive(); await page.waitForTimeout(300);
  await page.screenshot({ path: process.argv[2] + '/show-old-style-feed.png' });
  await page.evaluate(([beltSvg, fb, A, B]) => { const d = document.createElement('div'); d.setAttribute('data-mock', '2');
    d.innerHTML = `<div class="cdim"></div><div class="cpop"><div class="ttl"><span>═[■]═</span><b>TITLE CHANGE</b><span>1:57</span></div>
      <div class="led"><div class="glow"><div class="big">NEW CHAMPION</div></div><div style="margin-top:.45em">${beltSvg}</div></div>
      <div class="body"><img src="${fb}"><div><p class="nm">${B.name.toUpperCase()}</p><p>wins the <b style="font-weight:normal;color:#000">Imperial World Title</b></p><p class="mut">${A.name}’s reign ends at 31 weeks.</p><p class="stars">★★★★½</p><p><span class="tg" style="background:var(--dred)">Red hot</span><span class="tg" style="background:var(--blue)">Network target hit</span><span class="tg" style="background:#006000">+2 booking power</span></p></div></div>
      <div class="rem"><p><span class="rd">${A.name.split(' ')[0]} will remember this.</span> <span class="gn">${B.name.split(' ')[0]} will remember who gave him the night.</span></p><p class="mut">The yellow key: on with the show.</p></div></div>`; document.body.appendChild(d); }, [beltSvg, faces[B.id], A, B]);
  await page.waitForTimeout(300); await page.screenshot({ path: process.argv[2] + '/show-old-style-champion.png' });
  await browser.close(); })().catch(e => { console.error(e); process.exit(1); });
