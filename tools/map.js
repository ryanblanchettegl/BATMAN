/* Writes docs/map.md: one line per src/*.js file, what it owns (its first comment) and the E. functions it adds.
   Run: node tools/map.js */
const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'src');
const out = ['# Map of the engine', '', 'One line per file in `src/`, in build order: what it owns, then the `E.` functions it adds. Made by `node tools/map.js`; run it again after adding a file.', ''];
fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().forEach(f => {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  const c = (s.match(/\/\*+\s*([\s\S]*?)\*\//) || [, ''])[1].replace(/=+|-{3,}/g, '').replace(/\s+/g, ' ').trim();
  let first = c.split(/(?<=\.)\s/)[0] || ''; if (first.length > 220) first = first.slice(0, 217).replace(/\s\S*$/, '') + '...';
  const fns = [...new Set([...s.matchAll(/\bE\.([A-Za-z_$][\w$]*)\s*=/g)].map(m => m[1]))];
  out.push('- **' + f + '**: ' + (first || '(no header comment)') + (fns.length ? ' `E.' + fns.join('`, `E.') + '`' : ''));
});
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'map.md'), out.join('\n') + '\n');
console.log('wrote docs/map.md, ' + (out.length - 4) + ' files');
