// Builds engine.js from src/*.js, then bundles the default universe, the engine and the interface (app/) into one page in dist/.
const fs=require('fs'),path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const parts=fs.readdirSync(path.join(__dirname,'src')).filter(f=>f.endsWith('.js')).sort();
const engine="/* Gorilla Position — simulation engine (built from src/). No DOM. State is plain JSON so it can be saved as-is. */\n(function (root) {\n'use strict';\n"+parts.map(f=>'/* ===== '+f+' ===== */\n'+rd('src/'+f)).join('\n')+"\nroot.GP=E;\n})(typeof window !== 'undefined' ? window : globalThis);\n";
fs.writeFileSync(path.join(__dirname,'engine.js'),engine);
// ---- the interface (app/): Preact + TypeScript, bundled to one script by esbuild ----
const appDir=path.join(__dirname,'app');
if(fs.existsSync(path.join(appDir,'node_modules','esbuild'))){
  const esbuild=require(path.join(appDir,'node_modules','esbuild'));
  const out=esbuild.buildSync({entryPoints:[path.join(appDir,'src','main.tsx')],bundle:true,write:false,format:'iife',target:'es2019',minify:!process.env.EWF_DEV,jsx:'automatic',jsxImportSource:'preact',legalComments:'none',absWorkingDir:appDir,logLevel:'warning'});
  const js=out.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
  const css=['base','caw','start','editor','office','booking','roster','stories','manage','company'].map(f=>fs.readFileSync(path.join(appDir,'styles',f+'.css'),'utf8')).join('\n');
  // the one typeface is embedded, so the game fetches nothing at all (VT323, SIL Open Font License 1.1)
  const fontFile=path.join(appDir,'node_modules','@fontsource','vt323','files','vt323-latin-400-normal.woff2');
  const font=fs.existsSync(fontFile)?"@font-face{font-family:'VT323';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,"+fs.readFileSync(fontFile).toString('base64')+") format('woff2')}\n":'';
  const blocksFile=path.join(appDir,'fonts','ewf-blocks.woff2');   // box-drawing, block and shape glyphs VT323 lacks (tools/build-font.py)
  const blocks=fs.existsSync(blocksFile)?"@font-face{font-family:'EWF Blocks';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,"+fs.readFileSync(blocksFile).toString('base64')+") format('woff2')}\n":'';
  // add-ons: self-contained scripts appended after the interface (app/addons/*.js), each in its own script tag
  const addDir=path.join(appDir,'addons');
  const addons=fs.existsSync(addDir)?fs.readdirSync(addDir).filter(f=>f.endsWith('.js')).sort().map(f=>'\n<script>\n'+fs.readFileSync(path.join(addDir,f),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>').join(''):'';
  const next=`<title>Elite Wrestling Federation 9000</title>
<style>
${font}${blocks}${css}</style>
<div id="app"></div>
<script>
window.GP_UNIVERSE=${rd('universes/public_domain.json').replace(/<\//g,'<\\/')};</script>
<script>
${engine}</script>
<script>
${js}</script>${addons}
`;
  // dist/index.html is the whole page (desktop wrapper, tests). dist/gorilla-position.html is the same page without the document shell, for hosts that add their own.
  // EWF_OUT=name writes dist/name.html and dist/name-fragment.html instead, so a work-in-progress build does not replace the real one.
  const outName=process.env.EWF_OUT||'index',fragName=process.env.EWF_OUT?process.env.EWF_OUT+'-fragment':'gorilla-position';
  fs.mkdirSync(path.join(__dirname,'dist'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'dist',fragName+'.html'),next);
  fs.writeFileSync(path.join(__dirname,'dist',outName+'.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+next+'</body></html>');
  console.log('built',parts.length,'engine parts and the interface:',(js.length/1024).toFixed(0)+' KB script,',(next.length/1024).toFixed(0)+' KB page');
}else console.log('built engine.js only. Run npm install in app/ to build the interface.');
