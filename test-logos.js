/* Company logos: every company has one, built from its initials; the creator's rules; logos travel in a world package.
   Run: node test-logos.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const U = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'));
E.useUniverse(U);
const ids = L => L.map(x => x[0]), M = E.LOGO, key = m => JSON.stringify(m);
const whole = m => /^[A-Z0-9]{2,3}$/.test(m.l) && ids(M.styles).includes(m.st) && ids(M.lays).includes(m.lay) && ids(M.shapes).includes(m.sh) && ids(M.fins).includes(m.fin) && [m.c1, m.c2, m.c3].every(c => ids(M.cols).includes(c)) && ids(M.extras).includes(m.ex) && typeof m.tag === 'string';

{ const S = E.newGame('whw', 3, { name: 'R' }), L = S.order.map(id => S.promos[id]), logos = L.map(P => E.logoOf(P));
  ok('all', 'every company in the default world has a whole logo, with nothing set by hand', logos.every(whole) && L.every(P => !P.logo), logos.map(m => m.l + ':' + m.sh).join(' '));
  ok('all', 'the letters are the company’s three initials', L.every((P, i) => logos[i].l === P.name.toUpperCase().slice(0, 3)), logos.map(m => m.l).join(' '));
  ok('all', 'no two companies share a logo', new Set(logos.map(key)).size === logos.length);
  ok('all', 'each model has a shape of its own', new Set(['classic', 'corporate', 'workrate', 'purist', 'outlaw', 'underdog', 'startup', 'spectacle', 'tradition', 'joshi'].map(m => E.logoOf({ name: 'ABC', model: m }).sh)).size === 10);
  ok('all', 'every default logo can be read, and passes the creator’s own check', L.every((P, i) => E.logoOk(L, logos[i], P.id).ok), L.map((P, i) => E.logoOk(L, logos[i], P.id).errors.join('/')).filter(Boolean).join(' | '));
  ok('all', 'the parts: eighteen shapes and letters only, six letter styles, four layouts, three finishes, sixteen colours', M.shapes.length === 19 && M.styles.length === 6 && M.lays.length === 4 && M.fins.length === 3 && M.cols.length === 16 && M.extras.length === 5);
  const before = JSON.stringify(S); E.logoOf(S.promos.whw); E.logoIdeas('WHW', 6, 0); E.logoOk(L, logos[0], 'whw');
  ok('all', 'reading a logo changes nothing in the game', JSON.stringify(S) === before);
  /* names that are not three letters */
  ok('name', 'a long short name uses the capitals of the full name', E.logoOf({ name: 'Dynasty', full: 'Grand Old Wrestling', model: 'classic' }).l === 'GOW' && E.logoOf({ name: 'Dynasty', full: 'dynasty', model: 'classic' }).l === 'DYN');
  ok('name', 'a two-letter name is kept, and a logo never has fewer than two', E.logoOf({ name: 'NW' }).l === 'NW' && E.logoOf({ name: 'X' }).l.length === 2 && E.logoOf(null).l.length >= 2);
  /* a logo that is half filled in or wrong */
  const odd = E.logoOf({ name: 'ABC', model: 'corporate', logo: { sh: 'banana', c1: '#123456', st: 'wide', ex: 'tag', tag: '' } });
  ok('fill', 'anything missing or unknown falls back to the model’s own', whole(odd) && odd.sh === 'shield' && odd.c1 === '#5555ff' && odd.st === 'wide' && odd.ex === 'none', key(odd));
  ok('fill', 'a second line is capitals and numbers, eight at most', E.logoOf({ name: 'ABC', logo: { ex: 'tag', tag: 'est. nineteen 97!' } }).tag === 'EST NINE');
  /* the creator's two rules */
  const same = E.logoOk(L, Object.assign({}, logos[1], { l: logos[1].l }), 'whw');
  ok('rule', 'a logo another company already has is refused, and it says who', !same.ok && same.errors.some(e => e.indexOf(L[1].name) >= 0), same.errors.join(' '));
  const blind = E.logoOk(L, { l: 'ABC', sh: 'shield', c1: '#ffff55', c2: '#ffffff', c3: '#ffff55' }, 'whw');
  ok('rule', 'letters the colour of the shape are refused, with the nearest colour that would show', !blind.ok && /cannot be read/.test(blind.errors[0]) && !!blind.c3 && blind.c3 !== '#ffff55' && E.logoOk(L, { l: 'ABC', sh: 'shield', c1: '#ffff55', c2: '#ffffff', c3: blind.c3 }, 'whw').ok, JSON.stringify(blind));
  ok('rule', 'with no shape the letters sit on the black board, so black letters are refused', !E.logoOk(L, { l: 'ABC', sh: 'none', c3: '#000000' }, 'whw').ok && E.logoOk(L, { l: 'ABC', sh: 'none', c3: '#ffff55' }, 'whw').ok);
  ok('rule', 'a logo needs at least two letters', !E.logoOk(L, { l: 'A' }, 'whw').ok);
  /* ideas */
  const a = E.logoIdeas('WHW', 6, 0), b = E.logoIdeas('WHW', 6, 0), c = E.logoIdeas('WHW', 6, 1);
  ok('idea', 'six ideas from the same letters, all whole, all readable, all different', a.length === 6 && a.every(whole) && a.every(m => m.l === 'WHW' && E.logoOk([], m, 'x').ok) && new Set(a.map(key)).size === 6);
  ok('idea', 'the same letters and count give the same six; shuffle gives six more', key(a) === key(b) && key(a) !== key(c) && c.length === 6);
  ok('idea', 'ideas use every kind of part across a few shuffles', (() => { const all = []; for (let s = 0; s < 12; s++) all.push(...E.logoIdeas('KJP', 6, s)); return new Set(all.map(m => m.sh)).size >= 14 && new Set(all.map(m => m.st)).size === 6 && new Set(all.map(m => m.lay)).size === 4; })());
  /* in a game: the owner's to change */
  const no = E.setLogo(S, a[0]);
  ok('game', 'a booker who is not the owner cannot change the logo', !no.ok && !S.promos.whw.logo && /owner/.test(no.msg), no.msg);
  S.owner.me = true; const yes = E.setLogo(S, a[0]);
  ok('game', 'an owner can, and it is in the news', yes.ok && key(E.logoOf(S.promos.whw)) === key(a[0]) && S.news.some(n => /new logo/.test(n.t || n.text || '')), yes.msg);
  ok('game', 'a clash with a rival is refused in a game too', !E.setLogo(S, E.logoOf(S.promos.pdw)).ok);
  const saved = JSON.parse(JSON.stringify(S));
  ok('game', 'the logo is in the save', key(E.logoOf(saved.promos.whw)) === key(a[0]));
}
/* the World Editor, and a logo travelling in a world */
{ const pkg = E.edCopy(U, 'Logos test'), ideas = E.logoIdeas('WHW', 6, 3);
  const r = E.edSetLogo(pkg, 'whw', ideas[0]);
  ok('ed', 'the editor sets a company’s logo', r.ok && key(E.logoOf(pkg.promotions.find(p => p.id === 'whw'))) === key(ideas[0]), r.msg);
  ok('ed', 'the world still checks out', E.validateUniverse(pkg).ok, JSON.stringify(E.validateUniverse(pkg).errors || []).slice(0, 200));
  ok('ed', 'the editor refuses a clash and letters that cannot be read', !E.edSetLogo(pkg, 'pdw', ideas[0]).ok && !E.edSetLogo(pkg, 'pdw', { l: 'PDW', sh: 'ring', c1: '#ffffff', c3: '#ffffff' }).ok && !E.edSetLogo(pkg, 'nobody', ideas[1]).ok);
  E.useUniverse(pkg); const S = E.newGame('pdw', 4, { name: 'R' });
  ok('ed', 'a game started in that world has the logo, on a rival as well as on your own company', key(E.logoOf(S.promos.whw)) === key(ideas[0]) && !S.promos.pdw.logo);
  const out = E.exportUniverse ? E.exportUniverse(S, {}) : null;
  ok('ed', 'a world saved from a game keeps it', !out || key(E.logoOf(out.promotions.find(p => p.id === 'whw'))) === key(ideas[0]));
  const back = E.edSetLogo(pkg, 'whw', null);
  ok('ed', 'putting it back gives the model’s logo again', back.ok && !pkg.promotions.find(p => p.id === 'whw').logo && E.logoOf(pkg.promotions.find(p => p.id === 'whw')).sh === 'shield');
  E.useUniverse(U);
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('logos: all passed');
