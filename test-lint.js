/* The engine's house rules, checked (step 5 of the engine rebuild, docs/plans/typescript-engine.md):
   - the engine never uses Math.random or the clock: every chance comes from rnd(S), so the same seed plays the same;
   - a screen never writes to the state S: it calls E.something(S, ...) (rule 1 in CLAUDE.md).
   Run: node test-lint.js */
const fs = require('fs'), path = require('path');
const ts = require(path.join(__dirname, 'app', 'node_modules', 'typescript'));
const fails = [];
const walkDir = (d, ok) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'node_modules' || e.name === '_gen' ? [] : walkDir(path.join(d, e.name), ok)) : ok(e.name) ? [path.join(d, e.name)] : []);
const at = (sf, n) => path.relative(__dirname, sf.fileName) + ':' + (sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1);
const parse = f => ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2019, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
// 1. the engine: no Math.random, Date or performance.now
for (const f of walkDir(path.join(__dirname, 'engine'), n => n.endsWith('.ts'))) {
  const sf = parse(f);
  (function walk(n) {
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression)) {
      const o = n.expression.text, p = n.name.text;
      if ((o === 'Math' && p === 'random') || (o === 'Date' && p === 'now') || (o === 'performance' && p === 'now')) fails.push(at(sf, n) + ' uses ' + o + '.' + p + ' (use rnd(S); the engine has no clock)');
    }
    if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Date') fails.push(at(sf, n) + ' uses new Date (the engine has no clock)');
    ts.forEachChild(n, walk);
  })(sf);
}
// 2. the screens: no assignment to anything reached through S
const rootIsS = n => { while (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) n = n.expression; return ts.isIdentifier(n) && n.text === 'S'; };
const isMember = n => ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n);
for (const f of walkDir(path.join(__dirname, 'app', 'src'), n => /\.tsx?$/.test(n))) {
  const sf = parse(f);
  (function walk(n) {
    let target = null;
    if (ts.isBinaryExpression(n) && n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && n.operatorToken.kind <= ts.SyntaxKind.LastAssignment) target = n.left;
    else if ((ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken)) target = n.operand;
    else if (ts.isDeleteExpression(n)) target = n.expression;
    if (target && isMember(target) && rootIsS(target)) fails.push(at(sf, n) + ' writes to the state from a screen (call an E.* function inside act())');
    ts.forEachChild(n, walk);
  })(sf);
}
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-lint: ' + fails.length + ' failures' : 'test-lint: all passed');
process.exit(fails.length ? 1 : 0);
