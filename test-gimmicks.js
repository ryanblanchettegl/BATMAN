/* The smart gimmick system (src/99-gimmicks.js).  node test-gimmicks.js */
const fs = require('fs'); require('./engine.js'); const E = globalThis.GP;
let fails = 0;
const ok = (k, what, cond, info) => { console.log((cond ? 'ok   ' : 'FAIL ') + k.padEnd(8) + what + (info ? '  (' + info + ')' : '')); if (!cond) fails++; };
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
const S = E.newGame('ewe', 3, { name: 'R' }), by = n => S.w.find(w => w.name === n);
ok('words', 'a character gets the gimmick their own words point to', by('Coffin Kid Corwin').gim === 'daredevil' && by('Clementine Casual').gim === 'comedy' && by('Long Island Lux').gim === 'cocky', by('Coffin Kid Corwin').gim + ', ' + by('Clementine Casual').gim + ', ' + by('Long Island Lux').gim);
ok('all', 'every wrestler has a gimmick with benefits', S.w.filter(w => !w.nw && !w.rt).every(w => E.GFX[w.gim]));
const gi = E.gimInfo(S, by('Barbwire Burke').id);
ok('info', 'the screens are told what it shines in, who it is hot and flat against, and the microphone', gi && gi.best.length && gi.hot.length && gi.flat.length && gi.promo);
ok('fit', 'a gimmick that is who they are fits them', E.gimInfo(S, by('Kid Comet').id).fit >= 70);
// a hot pairing heats faster than a flat one
const mk = (a, b) => ({ id: 9e6 + Math.random(), promo: 'ewe', a: [a.id], b: [b.id], heat: 20, fresh: 90, start: S.week, last: S.week - 1, log: [], hist: [] });
const hero = S.w.find(w => w.gim === 'hero' && w.promo === 'ewe'), cocky = S.w.find(w => w.gim === 'cocky' && w.promo === 'ewe'), hero2 = S.w.find(w => w.gim === 'hero' && w.promo === 'ewe' && w !== hero);
const f1 = mk(hero, cocky), f2 = mk(hero, hero2); S.feuds.push(f1, f2);
E.heatStory(S, f1, 10); E.heatStory(S, f2, 10);
ok('feud', 'a hot pairing heats faster than a flat one', f1.heat > f2.heat, f1.heat.toFixed(1) + ' against ' + f2.heat.toFixed(1));
S.feuds = S.feuds.filter(f => f !== f1 && f !== f2);
console.log(fails ? fails + ' failed' : 'test-gimmicks: all passed');
process.exit(fails ? 1 : 0);
