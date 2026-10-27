/* Build order: a module that wraps another module's functions must sort after it (build.js loads engine/*.ts in name order).
   Each such file says so in a header line, "wraps: 88-shows.js, 89-networks.js". This test reads those lines, and
   also finds every wrap in the code (var was=f; f=function... or var was=E.f; E.f=function...) and checks that the
   file defining the wrapped function sorts first and is named in the header.  Run: node test-buildorder.js */
const fs = require('fs'), path = require('path'), dir = path.join(__dirname, 'engine');
const files = fs.readdirSync(dir).filter(f => /^\d.*\.ts$/.test(f)).sort(), src = {}, fails = [];
files.forEach(f => { src[f] = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\$L\./g, ''); });   // the bridge prefix is not part of the name
const defIn = name => files.find(f => (name.startsWith('E.') ? new RegExp('^\\s*' + name.replace('.', '\\.') + '\\s*=\\s*function', 'm') : new RegExp('^\\s*(?:export )?function ' + name + '\\s*\\(', 'm')).test(src[f]));
let n = 0;
files.forEach(f => {
  const head = (src[f].match(/wraps:\s*([^\n*(]+)/) || [])[1], listed = head ? head.split(/[,\s]+/).filter(x => /\.js$/.test(x)).map(x => x.replace(/\.js$/, '.ts')) : [];
  listed.forEach(x => { if (!src[x]) fails.push(f + ' names ' + x + ', which does not exist'); else if (x >= f) fails.push(f + ' wraps ' + x + ' but sorts before it'); });
  const re = /var (\w+)=((?:E\.)?\w+);\s*\2=function/g; let m;
  while ((m = re.exec(src[f]))) { const d = defIn(m[2]); if (!d || d === f) continue; n++;
    if (d >= f) fails.push(f + ' wraps ' + m[2] + ' from ' + d + ' but sorts before it');
    else if (listed.indexOf(d) < 0) fails.push(f + ' wraps ' + m[2] + ' from ' + d + ' and does not say so in a "wraps:" header'); }
});
fails.forEach(x => console.log('FAIL', x));
console.log(fails.length ? fails.length + ' failed' : 'test-buildorder: all passed (' + n + ' wraps checked)'); process.exit(fails.length ? 1 : 0);
