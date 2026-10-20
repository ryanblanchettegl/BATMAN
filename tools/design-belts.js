/* Gives every title in a world kept as a folder a belt of its own, written into its company file, so a modder can
   change it by hand or in Create a Belt. A title that already has a belt keeps it. Build first (it uses engine.js).
     node tools/design-belts.js                 universes/parody/
     node tools/design-belts.js <folder>        any world kept the same way
   Then pack the world again: node tools/build-parody.js */
const fs = require('fs'), path = require('path');
require(path.join(__dirname, '..', 'engine.js'));
const E = globalThis.GP, dir = process.argv[2] || path.join(__dirname, '..', 'universes', 'parody'), cdir = path.join(dir, 'companies');
let made = 0, kept = 0;
for (const f of fs.readdirSync(cdir).filter(f => f.endsWith('.json'))) {
  const file = path.join(cdir, f), raw = fs.readFileSync(file, 'utf8'), ind = (raw.match(/\n( +)"/) || ['', ' '])[1].length, C = JSON.parse(raw), P = C.promotion, seen = {};
  for (const t of C.titles || []) {
    if (t.belt) { kept++; continue; }
    const as = { id: t.id, name: t.name, g: t.gender, lvl: t.level, tag: !!t.tag };
    let b = E.beltOf(as, P);
    // a company's own belts never look alike: a second one with the same plate takes the next plate along
    const L = E.BELT.plates.map(x => x[0]);
    for (let k = 0; seen[b.pl + b.mt + b.st] && k < L.length; k++) b = E.beltFill(Object.assign({}, b, { pl: L[(L.indexOf(b.pl) + 1) % L.length] }), as, P);
    seen[b.pl + b.mt + b.st] = 1; t.belt = b; made++;
  }
  fs.writeFileSync(file, JSON.stringify(C, null, ind) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log('belts designed: ' + made + ', kept as they were: ' + kept);
