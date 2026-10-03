/* Writes docs/map.md: one entry per src/*.js file, saying what it owns, what it hooks into, what state it keeps and which E. functions it adds.
   The words come from docs/map-notes.json (edit that by hand when a file changes). The E. function names are read from the source, so they cannot drift.
   Usage:  node tools/make-map.js          rewrite docs/map.md
           node tools/make-map.js --check  exit 1 if a src file has no note, a note has no file, or docs/map.md is out of date */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), srcDir = path.join(root, 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
const notes = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'map-notes.json'), 'utf8'));
const problems = [];
files.forEach(f => { if (!notes['src/' + f]) problems.push('no note for src/' + f); });
Object.keys(notes).forEach(k => { if (k[0] !== '_' && !fs.existsSync(path.join(root, k))) problems.push('note for a file that is gone: ' + k); });

const lines = [];
lines.push('# EWF 9000: code map');
lines.push('');
lines.push('One entry per file in `src/`. Read this before the code. It is written by `node tools/make-map.js` from `docs/map-notes.json` (the words) and from the source (the `E.` names). When you add or change a file, edit its note in `docs/map-notes.json` and run the tool again. `node tools/make-map.js --check` says if anything is out of date.');
lines.push('');
lines.push('The files are joined in name order into one closure (`build.js` makes `engine.js`). A later file can use any function declared in an earlier one and wrap what an earlier file put on `E`. Systems plug in through the hook lists declared at the top of `src/10-match.js`: `MQX`/`CRX` (match quality and crowd, return `{d,x}`), `FINX` (finish), `EFX` (effort), `POST` (after a match), `SHOWX` (after a show), `WEEKX` (end of week), `NEWX` (new game), `PREX` (before a show), `ANGX`/`ANGDONE` (angles), `EVMAKE`/`EVR` (inbox events and their results).');
lines.push('');
lines.push('## src/');
lines.push('');
let efnTotal = 0;
files.forEach(f => {
  const n = notes['src/' + f] || { owns: '(no note yet)', hooks: 'none', state: 'none' };
  const text = fs.readFileSync(path.join(srcDir, f), 'utf8');
  const names = [];
  const re = /(^|[^A-Za-z0-9_$.])E\.([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)/g;
  let m;
  while ((m = re.exec(text))) if (names.indexOf(m[2]) < 0) names.push(m[2]);
  efnTotal += names.length;
  lines.push('- **`src/' + f + '`** (' + text.split('\n').length + ' lines). ' + n.owns);
  if (n.hooks && n.hooks !== 'none') lines.push('  - Hooks: ' + n.hooks);
  if (n.state && n.state !== 'none') lines.push('  - State: ' + n.state);
  if (names.length) lines.push('  - Adds: ' + names.sort().map(x => '`E.' + x + '`').join(', '));
});
lines.push('');
if (notes._after) { lines.push(notes._after.join('\n')); lines.push(''); }
const outText = lines.join('\n');
const target = path.join(root, 'docs', 'map.md');
if (process.argv.indexOf('--check') >= 0) {
  const have = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (have !== outText) problems.push('docs/map.md is out of date: run node tools/make-map.js');
  if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
  console.log('docs/map.md is up to date (' + files.length + ' files, ' + efnTotal + ' E. names).');
} else {
  if (problems.length) console.log(problems.join('\n'));
  fs.writeFileSync(target, outText);
  console.log('wrote docs/map.md: ' + files.length + ' files, ' + efnTotal + ' E. names.');
  if (problems.length) process.exit(1);
}
