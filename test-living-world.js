/* The living world (the week of 20 October): a game opens on a world that was already turning.
   node test-living-world.js */
const fs = require('fs'); require('./engine.js'); const E = globalThis.GP;
let fails = 0;
const ok = (k, what, cond, info) => { console.log((cond ? 'ok   ' : 'FAIL ') + k.padEnd(8) + what + (info ? '  (' + info + ')' : '')); if (!cond) fails++; };
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));

// 1. reigns carry the history: a champion who began the game mid-reign keeps its weeks and defences
{
  const S = E.newGame('ewe', 3, { name: 'R' }), P = S.promos.ewe;
  const ts = P.titles.filter(t => t.holders.length);
  const long = ts.filter(t => S.week - t.since > 4);
  ok('reigns', 'champions start with the reign the history gives them', long.length >= ts.length - 1, long.length + ' of ' + ts.length);
  const w = P.titles.find(t => t.name === 'EWE World Championship');
  ok('reign1', 'the world title: weeks, defences and a recent defence', w && S.week - w.since >= 20 && w.defs > 0 && w.last <= 0 && w.last > w.since, w && (S.week - w.since) + ' wk, ' + w.defs + ' defences, last ' + w.last);
  ok('hist', 'the running reign in the title line matches the title', w && w.hist.some(h => h.to == null && h.from === w.since));
}

console.log(fails ? fails + ' failed' : 'test-living-world: all passed');
process.exit(fails ? 1 : 0);
