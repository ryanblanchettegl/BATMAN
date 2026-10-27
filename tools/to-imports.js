/* Step 4b of the engine rebuild (ADR-0002). Every engine file is a module, but they still reach each other through the
   bridge, $L. This turns each $L.name into a plain import when that is safe:
   - the name lives in an earlier module (or this one), so importing it cannot change the order modules load in;
   - nothing anywhere assigns $L.name (a wrap, or a value written from outside), so the import sees the same binding.
   Everything else stays on $L: forward references and wrapped names, the extension points.
   Run: node tools/to-imports.js   (rewrites engine/*.ts in place) */
const fs = require('fs'), path = require('path');
const ts = require(path.join(__dirname, '..', 'app', 'node_modules', 'typescript'));
const dir = path.join(__dirname, '..', 'engine');
const files = fs.readdirSync(dir).filter(f => /^\d.*\.ts$/.test(f)).sort();
const parse = (f, t) => ts.createSourceFile(f, t, ts.ScriptTarget.ES2017, true, ts.ScriptKind.TS);
const text = {}, home = {}, order = {};
files.forEach((f, i) => { order[f] = i; text[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  parse(f, text[f]).statements.forEach(st => { if (!(st.modifiers || []).some(m => m.kind === ts.SyntaxKind.ExportKeyword)) return;
    if (ts.isFunctionDeclaration(st) && st.name) home[st.name.text] = f;
    else if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(d => { if (ts.isIdentifier(d.name)) home[d.name.text] = f; }); }); });
const isL = n => ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === '$L';
const isWrite = n => { const p = n.parent;
  if (ts.isBinaryExpression(p) && p.left === n && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return p;
  if ((ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) && (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)) return p;
  return null; };
// names written through the bridge other than a module handing back its own name ($L.x = x in x's home)
const written = new Set();
files.forEach(f => (function walk(n) { if (isL(n)) { const w = isWrite(n), nm = n.name.text;
    if (w) { const hand = ts.isBinaryExpression(w) && ts.isIdentifier(w.right) && w.right.text === nm && home[nm] === f; if (!hand) written.add(nm); } }
  ts.forEachChild(n, walk); })(parse(f, text[f])));
let changed = 0, kept = 0;
files.forEach(f => {
  const sf = parse(f, text[f]), edits = [], need = {}, locals = new Set();
  // names declared anywhere inside this file (parameters, inner vars) that would shadow an import of the same name
  (function walk(n) { if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n)) && n.name && ts.isIdentifier(n.name) && !(n.parent && n.parent.parent === sf) && !(ts.isFunctionDeclaration(n) && n.parent === sf)) locals.add(n.name.text); ts.forEachChild(n, walk); })(sf);
  (function walk(n) {
    if (isL(n)) { const nm = n.name.text, h = home[nm];
      const ok = h && order[h] <= order[f] && !written.has(nm) && !isWrite(n) && !locals.has(nm) && nm !== 'L';
      if (ok) { edits.push({ s: n.getStart(sf), e: n.end, t: nm }); if (h !== f) (need[h] = need[h] || new Set()).add(nm); changed++; } else kept++;
      return; }
    ts.forEachChild(n, walk); })(sf);
  let out = text[f]; edits.sort((a, b) => b.s - a.s).forEach(x => { out = out.slice(0, x.s) + x.t + out.slice(x.e); });
  // a shorthand property became { name: name } already; tidy is not needed for correctness
  const imp = Object.keys(need).sort().map(h => 'import { ' + [...need[h]].sort().join(', ') + " } from './" + h.replace(/\.ts$/, '') + "';").join('\n');
  if (imp) out = out.replace(/^(import \{ L as \$L \} from '\.\/_gen\/legacy\.js';)/m, '$1\n' + imp);
  fs.writeFileSync(path.join(dir, f), out);
});
console.log('imports:', changed, '| still on the bridge:', kept, '| names written through the bridge:', written.size);
