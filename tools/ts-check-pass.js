/* Turn the type checker on for engine modules (after the rebuild's step 4). The old code grows objects after making them
   and calls functions with fewer arguments than they name; under the checker both are errors. This marks such a variable
   `: any` and such a trailing parameter optional (`x?`), in passes until a module checks clean, then removes its
   `// @ts-nocheck`. Types are erased by the build, so nothing changes in play (test-golden.js proves it).
   A module that still has errors after the passes keeps its @ts-nocheck and is listed.
   Run: node tools/ts-check-pass.js */
const fs = require('fs'), path = require('path');
const ts = require(path.join(__dirname, '..', 'app', 'node_modules', 'typescript'));
const dir = path.join(__dirname, '..', 'engine');
const files = fs.readdirSync(dir).filter(f => /^\d.*\.ts$/.test(f)).map(f => path.join(dir, f));
const NOCHECK = '// @ts-nocheck\n';
const text = {}; files.forEach(f => { text[f] = fs.readFileSync(f, 'utf8').replace(NOCHECK, ''); });   // checked without it; put back at the end where errors remain
const opts = { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: false, noEmit: true, allowJs: true, skipLibCheck: true, lib: ['lib.es2017.d.ts', 'lib.dom.d.ts'] };
function program() {
  const host = ts.createCompilerHost(opts), orig = host.getSourceFile, rf = host.readFile;
  host.readFile = n => text[path.resolve(n)] != null ? text[path.resolve(n)] : rf(n);
  host.getSourceFile = (n, v) => text[path.resolve(n)] != null ? ts.createSourceFile(n, host.readFile(n), v, true) : orig(n, v);
  return ts.createProgram(files.concat(path.join(dir, 'types.ts')), opts, host);
}
const nodeAt = (sf, pos) => { let found = null; (function walk(n) { if (pos >= n.getStart(sf) && pos < n.end) { found = n; ts.forEachChild(n, walk); } })(sf); return found; };
const declOf = (chk, id) => { let s = chk.getSymbolAtLocation(id); if (s && (s.flags & ts.SymbolFlags.Alias)) s = chk.getAliasedSymbol(s); return s && s.valueDeclaration; };   // follow an import to where it is made
for (let pass = 1; pass <= 8; pass++) {
  const prog = program(), chk = prog.getTypeChecker(), edits = {};   // file -> [{pos, t}]
  const add = (sf, pos, t) => { const f = path.resolve(sf.fileName); (edits[f] = edits[f] || []); if (!edits[f].some(e => e.pos === pos)) edits[f].push({ pos, t }); };
  // a variable declared without a type: give it `: any` (after its name)
  const anyVar = d => { if (d && ts.isVariableDeclaration(d) && !d.type && ts.isIdentifier(d.name)) { add(d.getSourceFile(), d.name.end, ': any'); return true; } return false; };
  let n = 0, left = 0;
  for (const dg of ts.getPreEmitDiagnostics(prog)) {
    if (!dg.file || text[path.resolve(dg.file.fileName)] == null) continue; n++;
    const sf = dg.file, node = nodeAt(sf, dg.start);
    let done = false;
    if (dg.code === 2554) {   // too few arguments: the callee's trailing parameters become optional
      let call = node; while (call && !ts.isCallExpression(call) && !ts.isNewExpression(call)) call = call.parent;
      const sig = call && chk.getResolvedSignature(call), decl = sig && sig.declaration, given = call && call.arguments ? call.arguments.length : 0;
      if (decl && decl.parameters && text[path.resolve(decl.getSourceFile().fileName)] != null) {
        decl.parameters.forEach((p, i) => { if (i >= given && !p.questionToken && !p.initializer && !p.dotDotDotToken) add(p.getSourceFile(), p.name.end, '?'); });
        done = true; }
    } else if ([2339, 2551].includes(dg.code)) {   // a property the object was not made with
      let pa = node; while (pa && !ts.isPropertyAccessExpression(pa)) pa = pa.parent;
      if (pa && ts.isIdentifier(pa.expression)) done = anyVar(declOf(chk, pa.expression));
      else if (pa && ts.isPropertyAccessExpression(pa.expression) && ts.isIdentifier(pa.expression.expression)) done = anyVar(declOf(chk, pa.expression.expression));
    } else if (dg.code === 2353) {   // an object pushed into, or put in, something typed from its first entries
      let p = node; while (p && !(ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression)) && !ts.isVariableDeclaration(p) && !ts.isBinaryExpression(p)) p = p.parent;
      if (p && ts.isCallExpression(p) && ts.isIdentifier(p.expression.expression)) done = anyVar(declOf(chk, p.expression.expression));
      else if (p && ts.isVariableDeclaration(p)) done = anyVar(p);
      else if (p && ts.isBinaryExpression(p) && ts.isIdentifier(p.left)) done = anyVar(declOf(chk, p.left));
    } else if (dg.code === 2403) {   // a var declared twice with different types: both any
      let d = node; while (d && !ts.isVariableDeclaration(d)) d = d.parent;
      if (d) { const s = chk.getSymbolAtLocation(d.name); (s && s.declarations || []).forEach(anyVar); done = true; }
    }
    if (!done) left++;
  }
  const nf = Object.keys(edits).length;
  console.log('pass ' + pass + ': ' + n + ' errors, edits in ' + nf + ' files, ' + left + ' not handled');
  if (!nf) break;
  for (const f in edits) { let s = text[f]; edits[f].sort((a, b) => b.pos - a.pos).forEach(e => { s = s.slice(0, e.pos) + e.t + s.slice(e.pos); }); text[f] = s; }
}
// a module with no errors left loses its @ts-nocheck
const prog = program(), bad = {};
ts.getPreEmitDiagnostics(prog).forEach(d => { if (d.file) bad[path.resolve(d.file.fileName)] = (bad[path.resolve(d.file.fileName)] || 0) + 1; });
let on = 0; const still = [];
files.forEach(f => { if (!bad[f]) on++; else { text[f] = NOCHECK + text[f]; still.push(path.basename(f) + ' ' + bad[f]); } fs.writeFileSync(f, text[f]); });
console.log('checked now: ' + on + ' of ' + files.length + (still.length ? ' | still @ts-nocheck: ' + still.join(', ') : ''));
