/* A test that reads an engine file's source finds it wherever it lives during the TypeScript move (ADR-0001):
   src/NN-name.js before it moves, engine/NN-name.ts after. */
const fs = require('fs');
module.exports = file => { const base = file.replace(/^src\//, '').replace(/\.(js|ts)$/, '');
  for (const p of ['src/' + base + '.js', 'engine/' + base + '.ts']) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  throw new Error('engine file not found: ' + base); };
