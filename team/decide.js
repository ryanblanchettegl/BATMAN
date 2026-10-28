// Add one decision to team/DECISIONS.md, and optionally close an item in team/OPEN.md.
// node team/decide.js <who> <area> "<decision>" [--replaces D-012] [--closes O-3]
const fs = require('fs'), path = require('path');
const dir = __dirname, file = path.join(dir, 'DECISIONS.md'), open = path.join(dir, 'OPEN.md');
const a = process.argv.slice(2), opt = (k) => { const i = a.indexOf(k); if (i < 0) return ''; const v = a[i + 1]; a.splice(i, 2); return v; };
const replaces = opt('--replaces'), closes = opt('--closes');
const [who, area, text] = a;
if (!who || !area || !text) { console.log('usage: node team/decide.js <who> <area> "<decision>" [--replaces D-012] [--closes O-3]'); process.exit(1); }
const body = fs.readFileSync(file, 'utf8');
const ids = [...body.matchAll(/^\| D-(\d+)/gm)].map((m) => +m[1]);
const id = 'D-' + String((ids.length ? Math.max(...ids) : 0) + 1).padStart(3, '0');
const date = new Date().toISOString().slice(0, 10);
const clean = (s) => s.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
fs.appendFileSync(file, `| ${id} | ${date} | ${clean(who)} | ${clean(area)} | ${clean(text)} | ${replaces || ''} |\n`);
if (closes && fs.existsSync(open)) {
  const lines = fs.readFileSync(open, 'utf8').split('\n');
  const out = lines.filter((l) => !l.startsWith(`- ${closes} `) && !l.startsWith(`- **${closes}**`));
  fs.writeFileSync(open, out.join('\n'));
}
console.log(`${id} saved${closes ? `, ${closes} closed` : ''}`);
