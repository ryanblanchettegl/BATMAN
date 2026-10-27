/* Move one ES5 file from src/ to a TypeScript module in engine/ (ADR-0001). Every name the file borrows from the legacy
   block (a free identifier that is a top-level name of another src/ file) is rewritten to go through the bridge, L.name,
   so reads, calls, wraps (L.name = ...) and hook pushes reach the real bindings. The file's own top-level names are
   exported and handed back to the bridge at the end (L.name = name), so legacy code that calls them still finds them.
   Run: node tools/to-module.js src/99-zpodcast.js   (writes engine/99-zpodcast.ts and deletes the src/ file) */
const fs = require('fs'), path = require('path');
const ts = require(path.join(__dirname, '..', 'app', 'node_modules', 'typescript'));
const file = process.argv[2]; if (!file) { console.error('usage: node tools/to-module.js src/NN-name.js'); process.exit(1); }
const root = path.join(__dirname, '..'), src = fs.readFileSync(path.join(root, file), 'utf8');
const topNames = text => { const sf = ts.createSourceFile('x.js', text, ts.ScriptTarget.ES2017, false, ts.ScriptKind.JS), n = new Set();
  sf.statements.forEach(st => { if (ts.isFunctionDeclaration(st) && st.name) n.add(st.name.text); else if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(d => { if (ts.isIdentifier(d.name)) n.add(d.name.text); }); }); return n; };
// the names every other file declares, and modules already moved
const others = new Set();
for (const f of fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.js'))) if ('src/' + f !== file) topNames(fs.readFileSync(path.join(root, 'src', f), 'utf8')).forEach(n => others.add(n));
const engDir = path.join(root, 'engine');
for (const f of fs.existsSync(engDir) ? fs.readdirSync(engDir).filter(f => /^\d.*\.ts$/.test(f)) : []) topNames(fs.readFileSync(path.join(engDir, f), 'utf8')).forEach(n => others.add(n));
const own = topNames(src);
// resolve every identifier with the checker: a free one (no symbol in this file) that another file declares goes to L
const host = ts.createCompilerHost({ allowJs: true, noLib: true });
const orig = host.getSourceFile;
host.getSourceFile = (n, v) => n === 'mod.js' ? ts.createSourceFile('mod.js', src, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS) : orig(n, v);
host.fileExists = n => n === 'mod.js'; host.readFile = () => src;
const prog = ts.createProgram(['mod.js'], { allowJs: true, noLib: true, noResolve: true }, host), chk = prog.getTypeChecker(), sf = prog.getSourceFile('mod.js');
const edits = [];
// the file's own top-level declarations; inside functions, a reference to one goes through the bridge too, so a later
// file that wraps it (L.name = wrapper) is seen here exactly as in the old shared closure
const topDecl = new Set(); sf.statements.forEach(st => { if (ts.isFunctionDeclaration(st) && st.name) topDecl.add(st); else if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(d => topDecl.add(d)); });
const inFunction = n => { for (let p = n.parent; p && p !== sf; p = p.parent) if (ts.isFunctionLike(p)) return true; return false; };
(function walk(node) {
  if (ts.isIdentifier(node)) {
    const p = node.parent;
    const isProp = (ts.isPropertyAccessExpression(p) && p.name === node) || (ts.isPropertyAssignment(p) && p.name === node) || (ts.isMethodDeclaration(p) && p.name === node);
    const isShort = ts.isShorthandPropertyAssignment(p), isDeclName = (ts.isFunctionDeclaration(p) || ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionExpression(p)) && p.name === node;
    const sym = chk.getSymbolAtLocation(node), decls = (sym && sym.declarations) || [];
    const t = isShort ? node.text + ': $L.' + node.text : '$L.' + node.text;
    if (!isProp && !isDeclName) {
      if (own.has(node.text)) { if (decls.some(d => topDecl.has(d)) && inFunction(node)) edits.push({ s: node.getStart(sf), e: node.end, t }); }
      else if (others.has(node.text)) { const real = decls.some(d => ts.isVariableDeclaration(d) || ts.isParameter(d) || ts.isFunctionDeclaration(d) || ts.isFunctionExpression(d) || ts.isBindingElement(d) || ts.isCatchClause(d.parent)); if (!real) edits.push({ s: node.getStart(sf), e: node.end, t }); }
    }
  }
  ts.forEachChild(node, walk);
})(sf);
// hand each top-level var back to the bridge straight after its statement (functions are handed back at the top, since
// they are hoisted), and everything once more at the end in case top-level code reassigned one
sf.statements.forEach(st => { if (ts.isVariableStatement(st)) edits.push({ s: st.end, e: st.end, t: '\n' + st.declarationList.declarations.filter(d => ts.isIdentifier(d.name)).map(d => '$L.' + d.name.text + ' = ' + d.name.text + ';').join(' ') }); });
sf.statements.forEach(st => { if ((ts.isFunctionDeclaration(st) && st.name) || ts.isVariableStatement(st)) edits.push({ s: st.getStart(sf), e: st.getStart(sf), t: 'export ' }); });
const fnNames = sf.statements.filter(st => ts.isFunctionDeclaration(st) && st.name).map(st => st.name.text);
let out = src; edits.sort((a, b) => b.s - a.s || b.e - a.e).forEach(x => { out = out.slice(0, x.s) + x.t + out.slice(x.e); });
// export the file's own top-level declarations
// (exports are added from the parse above, statement by statement)
const head = '// @ts-nocheck\n/* Moved from ' + file + ' (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */\nimport { L as $L } from \'./_gen/legacy.js\';\n' + (fnNames.length ? fnNames.map(n => '$L.' + n + ' = ' + n + ';').join(' ') + '\n' : '');
const tail = own.size ? '\n// hand this module\'s names back to the bridge once more, in case top-level code reassigned one\n' + [...own].map(n => '$L.' + n + ' = ' + n + ';').join('\n') + '\n' : '';
const dest = path.join(engDir, path.basename(file).replace(/\.js$/, '.ts'));
fs.mkdirSync(engDir, { recursive: true }); fs.writeFileSync(dest, head + out + tail); fs.unlinkSync(path.join(root, file));
console.log('moved', file, '->', path.relative(root, dest), '|', edits.length, 'names through L,', own.size, 'own names');
