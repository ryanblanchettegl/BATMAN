/* The lineup sheet: every wrestler of a company drawn by the game's renderer, full length in rows of eight and as
   portraits, written to PNGs to judge a change to the look on a whole roster.
   Build first: node build.js     Run: NODE_PATH=<dir containing playwright> node tools/lineup.js [company ...] [--out dir] [--uni parody]
   Companies default to every company in the world. */
const path = require('path'), fs = require('fs'), root = path.join(__dirname, '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const out = path.resolve(opt('--out', path.join(require('os').tmpdir(), 'lineup'))), uni = opt('--uni', 'parody');
fs.mkdirSync(out, { recursive: true });
const esbuild = require(path.join(root, 'app', 'node_modules', 'esbuild'));
const js = esbuild.buildSync({ entryPoints: [path.join(__dirname, 'lineup', 'entry.tsx')], bundle: true, write: false, format: 'iife', target: 'es2019', jsx: 'automatic', jsxImportSource: 'preact', absWorkingDir: path.join(root, 'app'), nodePaths: [path.join(root, 'app', 'node_modules')], logLevel: 'warning' }).outputFiles[0].text;
const html = path.join(out, 'lineup.html');
fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><body><script>window.GP_UNIVERSE=' + fs.readFileSync(path.join(root, 'universes', 'public_domain.json'), 'utf8') + ';window.GP_UNIVERSE_PARODY=' + fs.readFileSync(path.join(root, 'universes', 'parody.json'), 'utf8') + ';</script><script>' + fs.readFileSync(path.join(root, 'engine.js'), 'utf8').replace(/<\/script/g, '<\\/script') + '</script><script>' + js.replace(/<\/script/g, '<\\/script') + '</script>');
(async () => {
  const { chromium } = require('playwright'), browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}), page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + html);
  const pids = args.length ? args : require(path.join(root, 'universes', uni + '.json')).promotions.map(p => p.id);
  const save = (f, d) => fs.writeFileSync(path.join(out, f), Buffer.from(d.split(',')[1], 'base64'));
  for (const pid of pids) {
    const ids = await page.evaluate(([u, p]) => { window.lineupStart(u, p); return window.lineupRoster(p); }, [uni, pid]);
    for (let i = 0; i < ids.length; i += 5) save(pid + '-row' + (i / 5 + 1) + '.png', await page.evaluate(x => window.lineupRow(x), ids.slice(i, i + 5)));
    for (let i = 0; i < ids.length; i += 24) save(pid + '-heads' + (i / 24 + 1) + '.png', await page.evaluate(x => window.lineupHeads(x), ids.slice(i, i + 24)));
    console.log(pid + ': ' + ids.length + ' wrestlers');
  }
  if (errs.length) console.log('errors: ' + errs.slice(0, 5).join(' | '));
  await browser.close();
  console.log('wrote ' + out);
})().catch(e => { console.error(e); process.exit(1); });
