// The start-of-session brief: what is happening now, what waits on Bill or Ryan, the latest decisions.
// Runs from the SessionStart hook in .claude/settings.json. Keep it short: it is paid for in every session.
const fs = require('fs'), path = require('path');
const dir = __dirname, read = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch { return ''; } };
const lines = (s) => s.split('\n').filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('<!--'));
const dec = read('DECISIONS.md').split('\n').filter((l) => /^\| D-\d+/.test(l));
const n = +(process.env.TEAM_BRIEF_N || 15);
console.log('TEAM BRIEF (team/). Rules: team/SKILL.md. Log every decision with node team/decide.js.');
console.log('\nNOW:\n' + lines(read('NOW.md')).join('\n'));
console.log('\nOPEN (ask, do not guess):\n' + (lines(read('OPEN.md')).join('\n') || 'none'));
console.log(`\nLAST ${Math.min(n, dec.length)} OF ${dec.length} DECISIONS (id | date | who | area | decision | replaces):\n` + dec.slice(-n).join('\n'));
