/* The bot lab (tools/bots/, docs/MASTER.md §7 row L2): a short run of the report gives every bot (five, row L3) a season of trace
   shares between 0 and 1 for every meter, an early grade and a desk word count, and every cause-log frame closes.
   Run: node test-bots.js   (the full baseline is node tools/bots/report.js) */
const { execFileSync } = require('child_process'), fs = require('fs');
let fails = 0; const ok = (c, t) => { if (!c) { fails++; console.log('FAIL', t); } };
execFileSync('node', ['tools/bots/report.js'], { env: { ...process.env, QUICK: '1' }, stdio: 'inherit' });
const R = JSON.parse(fs.readFileSync('tools/bots/out/report.json', 'utf8'));
Object.keys(require('./tools/bots/bots').BOTS).forEach(b => { const s = R.summary[b];
  ok(s && s.seasons.length >= 1, b + ': no season');
  ['cash', 'pop', 'trust', 'morale'].forEach(m => ['direct', 'booked'].forEach(k => { const v = s.seasons[0][k][m]; ok(v == null || (v >= 0 && v <= 1), b + ' ' + m + ' ' + k + ' share ' + v); })
    || ok(s.seasons[0].booked[m] == null || s.seasons[0].booked[m] >= s.seasons[0].direct[m], b + ' ' + m + ': booked share below direct'));
  ok(['direct', 'booked', 'n', 'of'].every(k => k in s.seasons[0]) && typeof s.skipped === 'number', b + ': report shape (direct, booked, n, of, skipped)');
  ok(typeof s.earlyGrade === 'string', b + ': no early grade'); ok(s.deskWords > 0, b + ': no desk words'); });
ok(R.runs.every(r => r.bad === 0), 'a cause-log frame did not close');
// the exploit gate can fail: a repeated action that beats the thoughtful bot is named, a high share on a worse result is not
const { judge } = require('./tools/bots/exploit.js'), B = { pop: 2, cs: 70, cash: 1e6 };
const J = (o) => judge(Object.assign({ pop: 2, cs: 70, cash: 1e6, popShare: 0.1 }, o), B).length;
ok(J({ pop: 5.1 }) === 1, 'a loop that beats the spender on popularity is not named');
ok(J({ pop: 2.5, popShare: 0.4 }) === 1, 'a loop that makes 40% of an as-good popularity gain is not named');
ok(J({ pop: 1, popShare: 0.5 }) === 0, 'a weak loop with a high share was named as an exploit');
ok(J({ cash: 1.2e6, pop: 1 }) === 1, 'a loop that ends with 20% more cash, while losing a little popularity, is not named');
ok(J({ cs: 76 }) === 1, 'a loop that lifts the crowd 6 points is not named');
console.log(fails ? 'test-bots: ' + fails + ' failed' : 'test-bots: all passed'); process.exit(fails ? 1 : 0);
