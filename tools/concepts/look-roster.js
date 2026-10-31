/* Three concepts for the locked look (docs/plans/art-bible.md, MASTER §7 row 3), shown on the Roster page. Round 2.
   A: the person is the wall.  B: the roster is the wall.  C: the trouble is the wall.
   Built from the game's own hand-made pieces (app/ui/craft: the black board, torn cream windows, navy strips, cut-card
   buttons) and the embedded hand faces, with real EWE names. Every concept draws the picked wrestler full length (rule
   5c); the figure is a placeholder for the game's paper-doll renderer. Writes docs/concepts/look/roster-{a,b,c}.html/.png.
   Run: node tools/concepts/look-roster.js <roster.json>   (roster.json: {co, r:[{n,o,m,side,age,con,wage,inj}]}) */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..'), out = path.join(root, 'docs', 'concepts', 'look');
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), R = D.r;
const b64 = f => fs.readFileSync(path.join(root, f)).toString('base64');
const font = (n, f) => "@font-face{font-family:'" + n + "';src:url(data:font/woff2;base64," + b64('app/fonts/hand/' + f) + ") format('woff2')}";
const piece = n => '--' + n + ':url(data:image/png;base64,' + b64('app/ui/craft/' + n + '.png') + ');';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const spot = i => i < 4 ? 'Main event' : i < 9 ? 'Upper card' : 'Midcard';
const mood = m => m >= 70 ? 'Happy' : m >= 60 ? 'Content' : m >= 45 ? 'Low' : 'Unhappy';
const hue = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const face = (n, sz) => '<span class="face" style="--h:' + hue(n) + ';width:' + sz + 'em;height:' + sz + 'em"><i class="hair"></i><i class="skin"></i><i class="sh"></i></span>';
const doll = (n, cls) => '<div class="doll ' + (cls || '') + '" style="--h:' + hue(n) + '"><i class="hr"></i><i class="hd"></i><i class="ar l"></i><i class="ar r"></i><i class="bd"></i><i class="tr"></i><i class="lg l"></i><i class="lg r"></i><i class="bt l"></i><i class="bt r"></i><span class="ring"></span></div>';
const P = R[2], PI = 2;
// what needs the booker, worst first, each with its own reason (from the real numbers)
const why = {
  con: w => w.n + "'s deal ends in " + w.con + ' weeks',
  age: w => w.n + ' is ' + w.age,
  low: w => w.n + ' is only ' + mood(w.m).toLowerCase(),
};
// what needs the booker, worst first; every card written for that wrestler, with what each answer hands on
const T = [
  { k: 'Contract', c: 'red', i: 2, t: "Hollywood Hazel's deal ends in 26 weeks", s: 'Two rivals have asked about her. She wants about a fifth more and a title shot written in.', b: [['Renew', '72%'], ['Let her test the market', '']], h: 'Renew helps: she trusts you; hurts: two rivals bid. Testing the market saves $32k a week; a rival gets her.' },
  { k: 'Age', c: 'purple', i: 4, t: 'Zed Zenith is 42', s: 'Still sells out Brisbane, but his back went at the last two shows. He wants one more run at the title.', b: [['Plan a last run', ''], ['Talk', '']], h: 'Last run: a farewell that pays big at the flagship. Talk helps: he trusts you; hurts: he is restless.' },
  { k: 'Age', c: 'purple', i: 5, t: 'Barbwire Burke is 40', s: 'Wants to keep doing the hardcore matches. The trainer says one more bad fall ends him.', b: [['Ease him off', '60%'], ['Let him go on', '']], h: 'Ease off helps: he is safe; hurts: he sulks a little. Go on: a big pop and a risk of a long injury.' },
  { k: 'Contract', c: 'red', i: 13, t: "Minerva's deal ends in 28 weeks", s: 'Asking more than the wage budget allows. Nobody else has called yet, so there is time.', b: [['Renew', '85%'], ['Wait', '']], h: 'Renew helps: nobody is bidding yet. Waiting saves money now; a rival may call in a month.' },
  { k: 'Age', c: 'purple', i: 15, t: 'Mitch Fawn is 41', s: 'The crowd still knows him. He has asked twice about training the rookies.', b: [['Make him a coach', ''], ['Later', '']], h: 'Coach: the rookies learn faster and he leaves the card.' },
  { k: 'Mood', c: 'blue', i: R.findIndex(w => w.n === 'Kid Comet'), t: 'Kid Comet is restless', s: 'Six weeks on the midcard with no feud. Has told the locker room he is being wasted.', b: [['Give him a feud', ''], ['Talk', '45%']], h: 'A feud: he is happy and the midcard gets a story. Talk helps: he likes you; hurts: no story yet.' },
];
const trouble = T.map(t => Object.assign(t, { w: R[t.i] })), needN = new Set(trouble.map(t => t.w.n));
const flag = w => { const t = trouble.find(x => x.w.n === w.n); return t ? '<b class="flag ' + t.c + '">' + t.k + '</b>' : ''; };
const tiles = [['Push', 'Main event', 'Wins come easier'], ['Contract', P.con + ' weeks left', '$' + Math.round(P.wage / 1000) + 'k a week'], ['Role', P.side, 'The crowd boos her'], ['Gimmick', 'Showman', 'Shines in big promos'], ['Partner', 'None', 'Two teams want her'], ['Gear', 'Ring gear', 'Edit wrestler']];
const tileHTML = tiles.map(t => '<button class="tile"><i>' + t[0] + '</i><b>' + esc(t[1]) + '</b><small>' + esc(t[2]) + '</small></button>').join('');
const ans = [['Give her the rematch', 'Sure', 'Hazel grateful. Kay Starchart loses the spot.', 'g'], ['Ask her to wait a month', '42%', 'Helps: she trusts you. Hurts: she lost twice.', 'b'], ['Tell her to earn it', '70%', 'She remembers "earn it" for 12 weeks.', 'b']];
const answers = '<div class="answers"><h3>She wants the rematch</h3>' + ans.map(a => '<button class="ans ' + a[3] + '"><b>' + a[0] + '</b><em>' + a[1] + '</em><small>' + a[2] + '</small></button>').join('') + '</div>';
const row = (w, i) => '<button class="row' + (i === PI ? ' on' : '') + '">' + face(w.n, 1.6) + '<span class="nm">' + esc(w.n) + '</span>' + flag(w) + (row.g ? '' : '<span class="sp">' + spot(i) + '</span>') + '<span class="ov">' + w.o + '</span></button>';
const chips = '<div class="filters"><button class="chip on">All ' + R.length + '</button><button class="chip red">Needs you ' + needN.size + '</button><button class="chip">Faces</button><button class="chip">Heels</button><button class="chip">Women</button></div>';
const win = (title, note, body, cls) => '<section class="win ' + (cls || '') + '"><h2><span>' + title + '</span><em>' + (note || '') + '</em></h2><div class="bd">' + body + '</div></section>';
const ticker = t => '<div class="ticker">' + t + '</div>';
const sub = P.side + ' · ' + spot(PI) + ' · ' + P.age + ' · from Los Angeles';
const pickTop = '<div class="pktop"><p>' + sub + '</p></div>';
const pickFig = '<div class="pkrow">' + doll(P.n, 'tall') + '<div class="pkfacts">' + [['Overall', P.o], ['Mood', mood(P.m)], ['Wage', '$' + Math.round(P.wage / 1000) + 'k'], ['Rivals', '2 bid']].map(b => '<div class="box sm"><i>' + b[0] + '</i><b>' + b[1] + '</b></div>').join('') + '</div></div>';
const mems = '<h3>She remembers</h3>' + [['good', 'You put her on the debut card.', '4 weeks ago'], ['bad', 'You booked her to lose on debut.', '4 weeks ago'], ['good', 'You came to see her after the loss.', '3 weeks ago']].map(m => '<div class="mem ' + m[0] + '"><b>' + m[1] + '</b><small>' + m[2] + '</small></div>').join('');

const CENTRE = {
  a: win('Hollywood Hazel', 'the wrestler, full length', '<div class="stage">' + doll(P.n, 'big') + '<div class="side">'
    + '<div class="boxes">' + [['Overall', P.o], ['Mood', mood(P.m)], ['Age', P.age], ['Deal', P.con + ' wk']].map(b => '<div class="box"><i>' + b[0] + '</i><b>' + b[1] + '</b></div>').join('') + '</div>'
    + '<div class="two"><div><h3>Promises to her</h3><div class="line red"><b>A rematch at the next big night</b><small>due in 3 weeks · stake 2 · broken costs her trust</small></div><div class="line"><b>A spot on the flagship card</b><small>ripe in 9 weeks</small></div></div>'
    + '<div><h3>Her people</h3><div class="ppl">' + face('Coco Capital', 2.4) + '<span><b>Coco Capital</b><small>friend · they tag on the indies</small></span></div><div class="ppl">' + face('Kay Starchart', 2.4) + '<span><b>Kay Starchart</b><small>rival · beat her on debut</small></span></div><div class="ppl">' + face('Detour Dante', 2.4) + '<span><b>Detour Dante</b><small>jealous · she took his spot</small></span></div></div></div>'
    + '<div class="two"><div><h3>Her last three</h3><p class="res"><b class="l">L</b> Debut vs Kay Starchart · ★★½<br><b class="w">W</b> Dark match, Brisbane · ★★<br><b class="w">W</b> Dark match, Brisbane · ★★½</p></div>' + '<div>' + mems + '</div></div>'
    + '<h3>Her deal</h3><div class="dealrow"><div class="box"><i>Wage</i><b>$' + Math.round(P.wage / 1000) + 'k</b></div><div class="box"><i>Weeks left</i><b>' + P.con + '</b></div><div class="box"><i>Clauses</i><b>2</b></div><div class="dealtxt">Paid travel and a title match within a year. She will ask for a raise of about a fifth; two rivals have called.</div></div>'
    + '</div></div>' + ticker('Hollywood Hazel · main event · wants the rematch · deal ends in ' + P.con + ' weeks'), 'wall'),
  b: win('The roster', R.length + ' under contract · by spot on the card', ['Main event', 'Upper card', 'Midcard'].map(g => { const L = R.map((w, i) => [w, i]).filter(x => spot(x[1]) === g); const pad = (5 - L.length % 5) % 5; return '<div class="grp" style="flex:' + Math.ceil(L.length / 5) + '"><h3>' + g + '</h3><div class="cards">' + L.map(([w, i]) => { const t = trouble.find(x => x.w.n === w.n); return '<button class="card' + (i === PI ? ' on' : '') + (t ? ' ' + t.c : '') + '">' + face(w.n, 2.6) + '<b>' + esc(w.n) + '</b><small>' + w.side + ' · ' + w.o + ' · $' + Math.round(w.wage / 1000) + 'k · ' + w.con + ' wk</small><span class="mt"><i style="width:' + w.m + '%"></i></span>' + (t ? '<em>' + t.k + '</em>' : '<small class="ok">' + mood(w.m) + '</small>') + '</button>'; }).join('') + Array.from({ length: pad }, () => '<button class="card open"><b>Open spot</b><small>Sign a free agent or move someone up</small></button>').join('') + '</div></div>'; }).join('') + ticker('EWE · ' + needN.size + ' need you · 2 deals end soon · wage bill 96% of budget'), 'wall'),
  c: win('Needs you', trouble.length + ' need you · worst first', '<div class="tcards">' + trouble.map(t => '<div class="tcard ' + t.c + (t.w.n === P.n ? ' on' : '') + '">' + face(t.w.n, 3) + '<div><i>' + t.k + '</i><b>' + esc(t.t) + '</b><small>' + esc(t.s) + '</small><span class="bb">' + t.b.map((x, j) => '<button class="btn ' + (j ? 'navy' : 'green') + '">' + x[0] + (x[1] ? ' <u>' + x[1] + '</u>' : '') + '</button>').join('') + '</span><p class="hands">' + esc(t.h) + '</p></div></div>').join('') + '</div>'
    + '<h3>Coming up</h3><div class="soon">' + [['Promise due', 'Billy Kestrel was promised a win', 'in 3 weeks'], ['Deal', 'Reiji Ameda: talks open', 'in 6 weeks'], ['Big night', 'Lakefront Brawl: 4 spots to fill', 'in 4 weeks']].map(x => '<div class="note"><i>' + x[0] + '</i><b>' + x[1] + '</b><small>' + x[2] + '</small></div>').join('') + '</div>'
    + ticker('Everyone else is fine · ' + (R.length - needN.size) + ' with nothing to answer · nobody hurt'), 'wall'),
};
const LEFT = {
  a: win('Roster', R.length + ' under contract', chips + '<div class="rows">' + R.map(row).join('') + '</div>', 'list'),
  b: win('Needs you', needN.size + ' of ' + R.length + ' · worst first', trouble.map(t => '<div class="mini ' + t.c + '">' + face(t.w.n, 1.8) + '<span><b>' + esc(t.w.n) + '</b><small>' + t.k + ' · ' + esc(t.s.split('.')[0]) + '</small></span><button class="btn ' + (t.c === 'red' ? 'green' : 'navy') + ' tiny">' + t.b[0][0] + '</button></div>').join('')
    + '<h3>Coming up</h3>' + [['Promise due', 'Billy Kestrel was promised a win', 'in 3 weeks'], ['Deal', 'Reiji Ameda: talks open', 'in 6 weeks']].map(x => '<div class="note"><i>' + x[0] + '</i><b>' + x[1] + '</b><small>' + x[2] + '</small></div>').join('')
    + '<div class="tiles one" style="margin-top:auto">' + [['Show', 'Everyone', 'Faces, heels, women, teams'], ['Group', 'By spot', 'Or by side, by mood']].map(t => '<button class="tile"><i>' + t[0] + '</i><b>' + t[1] + '</b><small>' + t[2] + '</small></button>').join('') + '</div>', 'list'),
  c: win('Roster', R.length + ' under contract', chips + '<div class="rows">' + R.map(row).join('') + '</div>', 'list'),
};
const RIGHT = {
  a: win('Answer her', 'she is at your door', pickTop + answers + '<h3>Set her up</h3><div class="tiles">' + tileHTML + '</div><div class="sticky">Your assistant: she draws best in Los Angeles. The Lakefront Brawl is there in four weeks.</div>', 'pick'),
  b: win(esc(P.n), 'picked', pickTop + pickFig + answers + '<div class="tiles">' + tileHTML + '</div>', 'pick'),
  c: win(esc(P.n), 'picked', pickTop + pickFig + answers + '<div class="tiles">' + tileHTML + '</div>', 'pick'),
};
const SPACE = { a: 'Answer Hazel', b: 'Answer Hazel', c: 'Renew Hazel' };
const NAMES = { a: 'A · The person is the wall', b: 'B · The roster is the wall', c: 'C · The trouble is the wall' };

// ---- round 4: C with B's by-spot view (Ryan, 31 October). Every choice that can fail shows its chance; the rest say Sure.
const CH = { 'Let her test the market': 'Sure', 'Talk': '55%', 'Plan a last run': 'Sure', 'Let him go on': 'Sure', 'Wait': 'Sure', 'Make him a coach': 'Sure', 'Later': 'Sure', 'Give him a feud': 'Sure' };
trouble.forEach(t => t.b = t.b.map(x => [x[0], x[1] || CH[x[0]] || 'Sure']));
const ansC = [['Renew for three years', '72%', 'Helps: she trusts you, the title shot written in. Hurts: two rivals bid.', 'g'], ['Renew for one year', '88%', 'Cheaper; she asks again next autumn.', 'b'], ['Let her test the market', 'Sure', 'Saves $32k a week. A rival gets a main eventer.', 'b']];
const answersC = '<div class="answers"><h3>Her contract: your answer</h3>' + ansC.map(a => '<button class="ans ' + a[3] + '"><b>' + a[0] + '</b><em>' + a[1] + '</em><small>' + a[2] + '</small></button>').join('') + '</div>';
const pickedC = win(esc(P.n), 'from the card you picked', pickTop + pickFig + answersC + '<div class="tiles">' + tileHTML + '</div>', 'pick');
const tcard = t => '<div class="tcard ' + t.c + (t.w.n === P.n ? ' on' : '') + '">' + face(t.w.n, 3) + '<div><i>' + t.k + (t === trouble[0] ? ' · worst' : '') + '</i><b>' + esc(t.t) + '</b><small>' + esc(t.s) + '</small><span class="bb">' + t.b.map((x, j) => '<button class="btn ' + (j ? 'blue' : 'navy') + '">' + x[0] + ' <u>' + x[1] + '</u></button>').join('') + '</span><p class="hands">' + esc(t.h) + '</p></div></div>';
const soonC = '<div class="soon slim">' + [['Promise due', 'Billy Kestrel was promised a win', 'in 3 weeks'], ['Deal', 'Reiji Ameda: talks open', 'in 6 weeks'], ['Big night', 'Lakefront Brawl: 4 spots to fill', 'in 4 weeks'], ['Debut', 'A rookie from the camp is ready', 'next week'], ['Rival', 'Atlas Pro is courting Long Island Lux', 'this month'], ['Hometown', 'Detour Dante: a show near home?', 'in 5 weeks']].map(x => '<div class="note"><i>' + x[0] + ' · ' + x[2] + '</i><b>' + x[1] + '</b></div>').join('') + '</div>';
const tabs = on => '<div class="wtabs"><button class="wtab' + (on === 0 ? ' on' : '') + '">Needs you ' + trouble.length + '</button><button class="wtab' + (on === 1 ? ' on' : '') + '">By spot · ' + trouble.length + ' need you</button></div>';
const bySpot = ['Main event', 'Upper card', 'Midcard'].map(g => { const L = R.map((w, i) => [w, i]).filter(x => spot(x[1]) === g), pad = (5 - L.length % 5) % 5; const fc = L.filter(x => x[0].side === 'Face').length, pay = L.reduce((a, x) => a + x[0].wage, 0); return '<div class="grp" style="flex:' + Math.ceil(L.length / 5) + '"><h3>' + g + ' · ' + L.length + ' of ' + (L.length + pad) + ' · ' + fc + ' faces, ' + (L.length - fc) + ' heels · $' + Math.round(pay / 1000) + 'k a week</h3><div class="cards">' + L.map(([w, i]) => { const t = trouble.find(x => x.w.n === w.n); return '<button class="card' + (i === PI ? ' on' : '') + (t ? ' ' + t.c : '') + '">' + face(w.n, 2.6) + '<b>' + esc(w.n) + '</b><small>' + w.side + ' · ' + w.o + '</small><span class="mt"><i style="width:' + w.m + '%"></i></span>' + (t ? '<em>' + t.k + '</em>' : '') + '</button>'; }).join('') + Array.from({ length: pad }, () => '<button class="card open"><b>Open spot</b><small>Sign a free agent or move someone up</small></button>').join('') + '</div></div>'; }).join('');
const strip = '<h3>The card by spot</h3><div class="spotstrip">' + ['Main event', 'Upper card', 'Midcard'].map(g => '<div class="srow"><b>' + g + '</b>' + R.map((w, i) => [w, i]).filter(x => spot(x[1]) === g).map(([w, i]) => { const t = trouble.find(x => x.w.n === w.n); return '<button class="chipw' + (i === PI ? ' on' : '') + (t ? ' ' + t.c : '') + '">' + esc(w.n.split(',')[0]) + ' <u>' + w.o + '</u></button>'; }).join('') + '</div>').join('') + '</div>';
const grpList = ['Main event', 'Upper card', 'Midcard'].map(g => { const L = R.map((w, i) => [w, i]).filter(x => spot(x[1]) === g), cap = g === 'Midcard' ? 9 : 5, fc = L.filter(x => x[0].side === 'Face').length; row.g = 1; const h = '<h3 class="lgrp">' + g + ' <span>' + L.length + ' of ' + cap + ' · ' + fc + 'F ' + (L.length - fc) + 'H</span></h3>' + L.map(([w, i]) => row(w, i)).join('') + (L.length < cap ? '<button class="row open">+ ' + (cap - L.length) + ' open spot · sign or move up</button>' : ''); row.g = 0; return h; }).join('');
const tick = ticker('Everyone else is fine · ' + (R.length - needN.size) + ' with nothing to answer · nobody hurt');
CENTRE.d = win('Needs you', 'worst first', tabs(0) + '<div class="tcards">' + trouble.map(tcard).join('') + '</div>' + '<h3>Coming up</h3>' + soonC + tick, 'wall');
CENTRE.d2 = win('By spot', R.length + ' under contract', tabs(1) + bySpot + ticker('EWE · ' + needN.size + ' need you · 2 deals end soon · wage bill 96% of budget'), 'wall');
const strip2 = '<h3>The card by spot</h3><div class="spt">' + ['Main event', 'Upper card', 'Midcard'].map(g => '<div class="spr"><b>' + g + '</b><div>' + R.map((w, i) => [w, i]).filter(x => spot(x[1]) === g).map(([w, i]) => { const t = trouble.find(x => x.w.n === w.n); return '<span class="sw' + (i === PI ? ' on' : '') + '">' + face(w.n, 1.4) + esc(w.n.split(',')[0]) + (t ? '<em class="flag ' + t.c + '">' + t.k + '</em>' : '') + '</span>'; }).join('') + '</div></div>').join('') + '</div>';
CENTRE.e = win('Needs you', 'worst first · the roster by spot below', '<div class="tcards">' + trouble.slice(0, 4).map(tcard).join('') + '</div><p class="more">+ 2 more need you: Mitch Fawn, Kid Comet</p>' + strip2 + tick, 'wall');
CENTRE.f = win('Needs you', 'worst first', '<div class="tcards">' + trouble.map(tcard).join('') + '</div><h3>Coming up</h3>' + soonC + tick, 'wall');
const chipsNo = chips.replace(/<button class="chip red">[^<]*<\/button>/, '');
LEFT.d = win('Roster', R.length + ' under contract', chipsNo + '<div class="rows">' + R.map(row).join('') + '</div>', 'list'); LEFT.d2 = LEFT.d; LEFT.e = LEFT.c;
LEFT.f = win('Roster', R.length + ' under contract · by spot', chips + '<div class="rows">' + grpList + '</div>', 'list');
['d', 'd2', 'e', 'f'].forEach(k => { RIGHT[k] = pickedC; SPACE[k] = 'Renew Hazel'; });
Object.assign(NAMES, { d: '1 · Tabs on the wall', d2: '1 · Tabs on the wall (By spot tab)', e: '2 · Split wall', f: '3 · Grouped list' });

const css = font('Craft Marker', 'marker.woff2') + font('Craft Hand', 'hand.woff2') + font('Craft Kalam', 'kalam.woff2') + ':root{' + ['black', 'win', 'navy', 'paper', 'card', 'note', 'btn-green', 'btn-navy', 'btn-blue', 'btn-yellow', 'btn-red', 'btn-cream'].map(piece).join('') + '}' + `
*{box-sizing:border-box;margin:0}body{width:1920px;height:1080px;overflow:hidden;background:radial-gradient(130% 100% at 30% 10%,rgba(255,255,255,.05),rgba(0,0,0,.3)),var(--black) 0 0/480px 480px,#1e1d21;font-family:'Craft Hand';color:#22202a;font-size:19px}
button{font:inherit;color:inherit;cursor:pointer;text-align:left}
.menu{height:42px;background:var(--paper) 0 0/360px;display:flex;align-items:center;gap:26px;padding:0 18px;box-shadow:0 4px 8px rgba(0,0,0,.45)}
.menu b{font-family:'Craft Marker';font-weight:400;font-size:20px}.menu b.on{background:var(--navy) 0 0/240px;color:#ffe48a;padding:2px 10px;transform:rotate(-1.5deg)}
.menu .dt{margin-left:auto;font-size:18px}.menu .co{background:#c23a30;color:#fff;font-family:'Craft Marker';padding:0 8px;margin-right:8px;display:inline-block;transform:rotate(-2deg)}
.sub{height:40px;display:flex;align-items:center;gap:10px;padding:0 16px}
.sub b{font-family:'Craft Marker';font-weight:400;border-image:var(--btn-blue) 22 fill / 12px / 3px;color:#ffe48a;padding:2px 14px;font-size:17px;transform:rotate(-.8deg)}.sub b.on{border-image-source:var(--btn-yellow);color:#22202a;transform:rotate(.6deg)}
.label{position:absolute;left:50%;top:46px;transform:translateX(-50%) rotate(-1.2deg);background:var(--note) 0 0/100% 100%;font-family:'Craft Marker';padding:4px 16px;font-size:18px;z-index:9;box-shadow:0 3px 6px rgba(0,0,0,.45)}
.page{position:absolute;top:88px;left:14px;right:14px;bottom:44px;display:grid;grid-template-columns:22fr 56fr 22fr;gap:18px}
.win{border-image:var(--win) 30 fill / 20px / 6px stretch;display:flex;flex-direction:column;min-height:0;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45))}
.win.list{transform:rotate(-.25deg)}.win.pick{transform:rotate(.25deg)}
.win h2{display:flex;justify-content:space-between;align-items:center;margin:4px 6px 0;background:var(--navy) 0 0/240px;padding:7px 14px;font-weight:400;clip-path:polygon(0 8%,12% 0,40% 6%,70% 0,100% 7%,99% 92%,72% 100%,30% 94%,0 100%)}
.win h2 span{font-family:'Craft Marker';color:#ffe48a;font-size:21px}.win h2 em{font-style:normal;color:#f3ebd6;font-size:16px}
.bd{padding:10px 10px 6px;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:8px}
h3{font-family:'Craft Marker';font-weight:400;color:#b0281c;font-size:16px;letter-spacing:.02em;margin-top:2px}
.filters{display:flex;gap:6px;flex-wrap:wrap}.chip{font-family:'Craft Marker';font-size:14px;border:0;background:#dfe7f5;padding:3px 9px;transform:rotate(-.6deg)}.chip.on{background:#ffd640}.chip.red{background:#f6d2cb;color:#8e2219}
.rows{display:flex;flex-direction:column}
.row{display:grid;grid-template-columns:30px 1fr auto auto 44px;align-items:center;gap:7px;padding:4px 6px;border:0;border-bottom:1px solid rgba(31,32,40,.13);background:none;font-size:17px}
.row.on{background:#ffe48a;box-shadow:0 2px 3px rgba(0,0,0,.2);transform:rotate(-.4deg)}.row .sp{font-size:13px;color:#55505e}.row .ov{font-family:'Craft Marker';background:var(--navy) 0 0/120px;color:#fff;text-align:center;font-size:14px;padding:1px 0}
.flag{font-family:'Craft Marker';font-weight:400;font-size:12px;color:#fff;padding:0 5px;transform:rotate(-2deg)}.flag.red{background:#c23a30}.flag.purple{background:#7a3fa0}.flag.blue{background:#2f5fae}
.mt{height:8px;background:#ddd2bb}.mt i{display:block;height:100%;background:#3c8c4f}
.face{display:inline-block;position:relative;background:hsl(var(--h),35%,82%);border:2px solid #22202a;overflow:hidden;flex:none}
.face .hair{position:absolute;left:18%;right:18%;top:8%;height:38%;background:hsl(calc(var(--h) + 40),45%,28%);border-radius:40% 40% 10% 10%;z-index:2}
.face .skin{position:absolute;left:24%;right:24%;top:18%;height:52%;background:#e5b48d;border-radius:30% 30% 40% 40%}
.face .sh{position:absolute;left:6%;right:6%;bottom:-10%;height:34%;background:hsl(var(--h),55%,40%);border-radius:40% 40% 0 0}
.pk .big{font-family:'Craft Marker';font-size:22px;display:block;line-height:1.05}.pk p{font-size:15px;color:#55505e}
.pkrow{display:grid;grid-template-columns:118px 1fr;gap:12px;align-items:end}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.tiles.one{grid-template-columns:1fr 1fr}
.tile{border:0;background:#fff8d8;padding:5px 8px;display:flex;flex-direction:column;box-shadow:0 2px 4px rgba(0,0,0,.28);border-top:5px solid #7fb7e8;min-height:62px}
.tile:nth-child(3n+2){transform:rotate(.6deg)}.tile:nth-child(3n){transform:rotate(-.5deg)}
.tile i{font-style:normal;font-family:'Craft Marker';font-size:13px;color:#b0281c;text-transform:uppercase}.tile b{font-family:'Craft Kalam';font-size:16px;line-height:1.1}.tile small{font-size:13px;color:#4a4655}
.answers{display:flex;flex-direction:column;gap:6px}
.ans{display:grid;grid-template-columns:1fr auto;border:0;background:#fff;border-left:7px solid #2f5fae;padding:4px 10px;box-shadow:0 2px 3px rgba(0,0,0,.22)}.ans.g{border-left-color:#3c8c4f}
.ans b{font-family:'Craft Marker';font-weight:400;font-size:17px;color:#22336b}.ans em{font-style:normal;font-family:'Craft Marker'}.ans small{grid-column:1/3;font-size:14px;color:#4a4655}
.boxes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.boxes.col{grid-template-columns:1fr 1fr}
.box{border:2px solid #22202a;background:#fffdf5;padding:4px 8px;text-align:center}.box i{font-style:normal;font-family:'Craft Marker';font-size:13px;color:#b0281c;display:block}.box b{font-family:'Craft Marker';font-weight:400;font-size:25px}
.stage{display:grid;grid-template-columns:30% 1fr;gap:18px;flex:1;min-height:0}
.doll{position:relative;background:linear-gradient(#2a2c3c,#14151c);border-image:var(--card) 30 fill / 10px / 2px;overflow:hidden}
.doll.big{min-height:0}.doll.small{height:300px}
.doll i{position:absolute;display:block}.doll .hd{left:41%;top:9%;width:18%;height:11%;background:#e5b48d;border-radius:30%}.doll .hr{left:40%;top:7%;width:20%;height:6%;background:hsl(calc(var(--h) + 40),45%,28%);border-radius:40% 40% 0 0;z-index:2}
.doll .bd{left:32%;top:21%;width:36%;height:27%;background:#e5b48d;border-radius:20% 20% 10% 10%}.doll .tr{left:32%;top:45%;width:36%;height:14%;background:hsl(var(--h),60%,42%)}
.doll .lg{top:58%;width:13%;height:27%;background:#e5b48d}.doll .lg.l{left:35%}.doll .lg.r{left:52%}.doll .bt{top:83%;width:15%;height:8%;background:#1d1d1d}.doll .bt.l{left:33%}.doll .bt.r{left:52%}
.doll .ar{top:23%;width:9%;height:29%;background:#e5b48d;border-radius:30%}.doll .ar.l{left:22%;transform:rotate(8deg)}.doll .ar.r{left:69%;transform:rotate(-8deg)}
.doll .ring{position:absolute;left:8%;right:8%;bottom:3%;height:4%;background:rgba(0,0,0,.45);border-radius:50%}
.side{display:flex;flex-direction:column;gap:16px;min-height:0}.side .dealrow{margin-top:auto}.side .line b,.side .ppl b{font-size:19px}.side .line small,.side .ppl small{font-size:15px}.side .two{flex:1}.side .mem b{font-size:17px}.side .res{font-size:17px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.line{background:#fff;border-top:5px solid #2f5fae;padding:4px 10px;margin-top:5px;box-shadow:0 2px 3px rgba(0,0,0,.2)}.line.red{border-top-color:#c23a30}.line b{display:block;font-size:17px}.line small{font-size:14px;color:#4a4655}
.ppl{display:flex;gap:10px;align-items:center;margin-top:5px}.ppl b{display:block;font-size:17px}.ppl small{font-size:14px;color:#4a4655}
.deal{position:relative;height:30px;background:#ddd2bb;border:2px solid #22202a}.deal i{position:absolute;left:0;top:0;bottom:0;background:#e7b23a}.deal span{position:absolute;top:32px;font-size:14px;color:#4a4655}.deal span:nth-of-type(1){left:0}.deal span:nth-of-type(2){left:58%}.deal span:nth-of-type(3){right:0}
.mem{background:#fffdf5;border-left:6px solid #3c8c4f;padding:4px 10px;box-shadow:0 2px 3px rgba(0,0,0,.18)}.mem.bad{border-left-color:#c23a30}.mem b{display:block;font-size:16px;font-weight:400}.mem small{font-size:13px;color:#4a4655}.res{font-size:16px;line-height:1.35}.res b{font-family:'Craft Marker';font-weight:400;margin-right:6px}.res .l{color:#c23a30}.res .w{color:#3c8c4f}
.sticky{margin-top:auto;background:var(--note) 0 0/100% 100%;padding:8px 12px;font-family:'Craft Kalam';font-size:16px;transform:rotate(-.8deg);box-shadow:0 3px 5px rgba(0,0,0,.3)}
.grp{display:flex;flex-direction:column;min-height:0}.grp .cards{flex:1;grid-auto-rows:1fr}.grp h3{border-bottom:2px solid #c23a30;margin-bottom:6px}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.card .face{width:3em!important;height:3em!important}.card{border:0;background:#fffdf5;border-top:6px solid #9aa8c2;box-shadow:0 2px 4px rgba(0,0,0,.25);padding:6px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;min-height:132px;justify-content:center}
.card:nth-child(odd){transform:rotate(-.6deg)}.card:nth-child(even){transform:rotate(.4deg)}.card b{font-size:16px;line-height:1.05}.card small{font-size:13px;color:#4a4655}.card small.ok{color:#3c8c4f}
.card em{font-style:normal;font-family:'Craft Marker';font-size:13px;color:#fff;padding:0 6px;transform:rotate(-2deg)}
.card.red{border-top-color:#c23a30}.card.red em{background:#c23a30}.card.purple{border-top-color:#7a3fa0}.card.purple em{background:#7a3fa0}.card.blue{border-top-color:#2f5fae}.card.blue em{background:#2f5fae}
.card.on{background:#ffe48a;transform:translateY(-3px) rotate(-.8deg);box-shadow:0 5px 8px rgba(0,0,0,.35)}
.mini{display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center;border:0;background:#fffdf5;border-left:6px solid #2f5fae;padding:5px 8px;box-shadow:0 2px 3px rgba(0,0,0,.2)}
.mini.red{border-left-color:#c23a30}.mini.purple{border-left-color:#7a3fa0}.mini b{display:block;font-size:16px}.mini small{font-size:13px;color:#4a4655}
.tcards{display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1;grid-auto-rows:1fr}.tcard{align-items:flex-start}.tcard b{font-size:22px}.tcard small{font-size:16px}
.tcard{display:flex;gap:12px;background:#fffdf5;border-top:6px solid #2f5fae;padding:10px;box-shadow:0 3px 5px rgba(0,0,0,.25)}
.tcard:nth-child(odd){transform:rotate(-.4deg)}.tcard:nth-child(even){transform:rotate(.35deg)}
.tcard.red{border-top-color:#c23a30}.tcard.purple{border-top-color:#7a3fa0}.tcard.on{background:#fff4c2;outline:3px solid #e7b23a}
.tcard i{font-style:normal;font-family:'Craft Marker';font-size:13px;color:#b0281c;text-transform:uppercase;display:block}.tcard b{font-size:20px;display:block;line-height:1.1}.tcard small{font-size:15px;color:#4a4655;display:block;margin:3px 0 7px}
.btn{font-family:'Craft Marker';border:0;color:#fff;padding:3px 14px;margin-right:6px;font-size:15px;border-image:var(--btn-green) 22 fill / 12px / 3px;transform:rotate(-1deg)}.btn.navy{border-image-source:var(--btn-navy);transform:rotate(.8deg)}
.soon{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;min-height:120px}.note{padding:12px 14px}
.note{background:var(--note) 0 0/100% 100%;padding:8px 12px;box-shadow:0 3px 5px rgba(0,0,0,.3)}.note:nth-child(2){transform:rotate(.8deg)}.note:nth-child(1){transform:rotate(-.6deg)}
.note i{font-style:normal;font-family:'Craft Marker';font-size:13px;color:#b0281c;display:block}.note b{font-family:'Craft Kalam';font-size:17px;display:block}.note small{font-size:14px;color:#4a4655}
.ticker{margin-top:auto;background:var(--navy) 0 0/240px;color:#ffe48a;font-family:'Craft Marker';padding:6px 14px;font-size:15px;letter-spacing:.03em;clip-path:polygon(0 0,100% 6%,99% 100%,1% 94%)}
.foot{position:absolute;left:14px;right:14px;bottom:8px;height:30px;display:flex;align-items:center;gap:8px;font-size:16px}
.foot span{background:var(--paper) 0 0/240px;color:#22202a;padding:1px 9px}.foot .k{border-image:var(--btn-blue) 22 fill / 10px / 2px;background:none;color:#fff;font-family:'Craft Marker';font-size:14px;padding:1px 10px}.foot .gap{margin-left:auto;background:none;padding:0}
.foot .sp{border-image:var(--btn-yellow) 22 fill / 10px / 2px;background:none;font-family:'Craft Marker';padding:1px 14px}
.pktop .big{font-family:'Craft Marker';font-size:24px;display:block;line-height:1.05}.pktop p{font-size:15px;color:#55505e}
.pkrow{display:grid;grid-template-columns:150px 1fr;gap:10px}.doll.tall{height:330px}.pkfacts{display:grid;grid-template-columns:1fr;gap:6px;align-content:start}.box.sm b{font-size:20px}
.dealrow{display:grid;grid-template-columns:repeat(3,110px) 1fr;gap:10px;align-items:stretch}.dealtxt{font-size:16px;line-height:1.3;background:#fffdf5;padding:6px 10px;border-left:5px solid #e7b23a}
.card .mt{width:80%;margin:3px 0}.card.open{background:rgba(255,253,245,.55);border:2px dashed #9aa8c2;border-top:2px dashed #9aa8c2;box-shadow:none}.card.open b{color:#55505e}
.mini{grid-template-columns:36px 1fr auto}.btn.tiny{font-size:13px;padding:2px 9px;margin:0}
.btn u{text-decoration:none;opacity:.85;font-family:'Craft Hand';font-size:14px;margin-left:4px}
.hands{font-size:14px;color:#3a5a40;margin-top:6px;border-top:1px dashed rgba(0,0,0,.2);padding-top:4px}
.tcards{grid-template-columns:1fr 1fr;flex:none;grid-auto-rows:auto}.btn.blue{border-image-source:var(--btn-blue)}.tcard{transform:rotate(-.6deg)}.tcard:nth-child(even){transform:rotate(.5deg)}
.wtabs{display:flex;gap:8px;margin-bottom:2px}.wtab{font-family:'Craft Marker';font-size:16px;border:0;background:#dfe7f5;padding:4px 14px;transform:rotate(-.6deg)}.wtab.on{background:#ffd640;box-shadow:0 2px 3px rgba(0,0,0,.25)}
.soon.slim{min-height:0;flex:1;grid-auto-rows:1fr}.soon.slim .note{padding:6px 12px}.soon.slim .note b{font-size:16px}
.tcards .tcard:first-child{border-top-width:9px}.tcards .tcard:first-child b{font-size:24px}
.tcards.short .tcard small{display:none}.tcards.short{flex:none;grid-auto-rows:auto}
.spotstrip{display:flex;flex-direction:column;gap:8px;flex:1}.srow{display:flex;flex-wrap:wrap;gap:9px;align-items:center;flex:1;align-content:center}.srow>b{font-family:'Craft Marker';font-weight:400;color:#b0281c;font-size:14px;width:96px}
.chipw{border:0;background:#fffdf5;border-top:5px solid #9aa8c2;padding:8px 14px;font-size:18px;box-shadow:0 2px 3px rgba(0,0,0,.2)}.chipw u{text-decoration:none;font-family:'Craft Marker';font-size:13px;color:#22336b}.chipw.on{background:#ffe48a}.chipw.red{border-top-color:#c23a30}.chipw.purple{border-top-color:#7a3fa0}.chipw.blue{border-top-color:#2f5fae}
.lgrp{border-bottom:2px solid #c23a30;margin-top:6px;display:flex;justify-content:space-between}.lgrp span{font-family:'Craft Hand';font-size:14px;color:#4a4655}.row.open{display:block;color:#2f5fae;font-family:'Craft Kalam';font-size:15px;border-bottom:1px dashed #9aa8c2}
.spt{display:flex;flex-direction:column;gap:14px;flex:1}.spt .sw{font-size:18px;padding:5px 12px 5px 5px}.spr{display:grid;grid-template-columns:100px 1fr;align-items:start;gap:8px}.spr>b{font-family:'Craft Marker';font-weight:400;color:#b0281c;font-size:14px;padding-top:6px}.spr>div{display:flex;flex-wrap:wrap;gap:6px}
.sw{display:inline-flex;align-items:center;gap:6px;background:#fffdf5;padding:3px 9px 3px 4px;font-size:16px;box-shadow:0 2px 3px rgba(0,0,0,.2)}.sw.on{background:#ffe48a}.sw .flag{margin-left:4px}.more{font-family:'Craft Kalam';color:#2f5fae;font-size:16px}
`;
const page = k => '<!doctype html><html><head><meta charset="utf-8"><title>Roster concept ' + k.toUpperCase() + '</title><style>' + css + '</style></head><body>'
  + '<div class="menu"><b>Office</b><b>Booking</b><b class="on">Roster</b><b>Web</b><b>Manage</b><b>Company</b><span class="dt"><span class="co">EWE</span>Week 1, October 2026</span></div>'
  + '<div class="sub"><b class="on">Roster</b><b>Locker room</b><b>Titles</b><b>Free agents</b></div><div class="label">' + NAMES[k] + '</div>'
  + '<div class="page">' + LEFT[k] + CENTRE[k] + RIGHT[k] + '</div>'
  + '<div class="foot"><span>BP 7</span><span>AP 3</span><span>Cash $35.4M</span><span>Pop 74.0</span><span>Owner 55</span><span class="gap"></span><span class="k">F1 Help</span><span class="k">F2 Options</span><span class="k">F3 Music on</span><span class="sp">SPACE · ' + SPACE[k] + '</span></div></body></html>';
fs.mkdirSync(out, { recursive: true });
const KEYS = (process.env.KEYS || 'd,d2,e,f').split(',');
KEYS.forEach(k => fs.writeFileSync(path.join(out, 'roster-' + k + '.html'), page(k)));
(async () => {
  const { chromium } = require('playwright'), b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const k of KEYS) { await p.goto('file://' + path.join(out, 'roster-' + k + '.html')); await p.waitForTimeout(400); await p.screenshot({ path: path.join(out, 'roster-' + k + '.png') }); }
  await b.close(); console.log('wrote', out);
})();
