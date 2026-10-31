/* The bot lab (tools/bots/, docs/MASTER.md §7 row L2): a short run of the report gives every bot a season of trace
   shares between 0 and 1 for every meter, an early grade and a desk word count, and every cause-log frame closes.
   Run: node test-bots.js   (the full baseline is node tools/bots/report.js) */
const { execFileSync } = require('child_process'), fs = require('fs');
let fails = 0; const ok = (c, t) => { if (!c) { fails++; console.log('FAIL', t); } };
execFileSync('node', ['tools/bots/report.js'], { env: { ...process.env, QUICK: '1' }, stdio: 'inherit' });
const R = JSON.parse(fs.readFileSync('tools/bots/out/report.json', 'utf8'));
['suggest', 'thoughtful'].forEach(b => { const s = R.summary[b];
  ok(s && s.seasons.length >= 1, b + ': no season');
  ['cash', 'pop', 'trust', 'morale'].forEach(m => ['direct', 'booked'].forEach(k => { const v = s.seasons[0][k][m]; ok(v == null || (v >= 0 && v <= 1), b + ' ' + m + ' ' + k + ' share ' + v); })
    || ok(s.seasons[0].booked[m] == null || s.seasons[0].booked[m] >= s.seasons[0].direct[m], b + ' ' + m + ': booked share below direct'));
  ok(['direct', 'booked', 'n', 'of'].every(k => k in s.seasons[0]) && typeof s.skipped === 'number', b + ': report shape (direct, booked, n, of, skipped)');
  ok(typeof s.earlyGrade === 'string', b + ': no early grade'); ok(s.deskWords > 0, b + ': no desk words'); });
ok(R.runs.every(r => r.bad === 0), 'a cause-log frame did not close');
console.log(fails ? 'test-bots: ' + fails + ' failed' : 'test-bots: all passed'); process.exit(fails ? 1 : 0);
