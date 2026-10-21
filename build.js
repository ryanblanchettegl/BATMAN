// Builds engine.js from src/*.js, then bundles the default universe, the engine and the interface (app/) into one page in dist/.
const fs=require('fs'),path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const parts=fs.readdirSync(path.join(__dirname,'src')).filter(f=>f.endsWith('.js')).sort();
const engine="/* Gorilla Position — simulation engine (built from src/). No DOM. State is plain JSON so it can be saved as-is. */\n(function (root) {\n'use strict';\n"+parts.map(f=>'/* ===== '+f+' ===== */\n'+rd('src/'+f)).join('\n')+"\nroot.GP=E;\n})(typeof window !== 'undefined' ? window : globalThis);\n";
// one version: VER in app/src/store.ts is the source; the build writes it into package.json and the README's version line
(function(){
  const ver=(fs.readFileSync(path.join(__dirname,'app','src','store.ts'),'utf8').match(/export const VER = '([\d.]+)'/)||[])[1];if(!ver)return;
  const semver=ver.split('.').concat(['0','0']).slice(0,3).join('.');
  for(const pj of ['package.json',path.join('app','package.json')]){const f=path.join(__dirname,pj);if(!fs.existsSync(f))continue;const J=JSON.parse(fs.readFileSync(f,'utf8'));if(J.version!==semver){J.version=semver;fs.writeFileSync(f,JSON.stringify(J,null,2)+'\n');}}
  const rf=path.join(__dirname,'README.md');if(fs.existsSync(rf)){const R=fs.readFileSync(rf,'utf8'),R2=R.replace(/(\*\*Version:\*\* )[\d.]+/,'$1'+ver);if(R2!==R)fs.writeFileSync(rf,R2);}
})();
fs.writeFileSync(path.join(__dirname,'engine.js'),engine);
// ---- the interface (app/): Preact + TypeScript, bundled to one script by esbuild ----
const appDir=path.join(__dirname,'app');
if(fs.existsSync(path.join(appDir,'node_modules','esbuild'))){
  const esbuild=require(path.join(appDir,'node_modules','esbuild'));
  const out=esbuild.buildSync({entryPoints:[path.join(appDir,'src','main.tsx')],bundle:true,write:false,format:'iife',target:'es2019',minify:!process.env.EWF_DEV,jsx:'automatic',jsxImportSource:'preact',legalComments:'none',absWorkingDir:appDir,logLevel:'warning'});
  const js=out.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
  // the styles; theme.css (the paper look over every page) comes last. Sizes written in ch were measured in VT323's
  // character, so they become that width (--ch) whatever the face is now: the layouts keep their shape
  const css=['base','start','editor','office','booking','roster','stories','net','manage','company','win','scene','paper','theme'].map(f=>fs.readFileSync(path.join(appDir,'styles',f+'.css'),'utf8')).join('\n')
    .replace(/(^|[^\w.#-])(-?\d*\.?\d+)ch\b/g,(m,pre,n)=>pre+'calc('+n+'*var(--ch))');
  // the interface face: Inter in three weights (SIL Open Font License 1.1; tools/build-ui-font.py)
  const sans=[400,600,800].map(w=>{const f=path.join(appDir,'fonts','inter-'+w+'.woff2');return fs.existsSync(f)?"@font-face{font-family:'EWF Sans';font-style:normal;font-weight:"+w+";font-display:swap;src:url(data:font/woff2;base64,"+fs.readFileSync(f).toString('base64')+") format('woff2')}\n":'';}).join('');
  // the paper pieces rendered in Blender (tools/creator/ui-pieces.py), as variables the theme reads
  const uiDir=path.join(appDir,'ui');
  const ui=fs.existsSync(uiDir)?':root{'+fs.readdirSync(uiDir).filter(f=>f.endsWith('.png')).sort().map(f=>'--ui-'+f.slice(0,-4)+':url(data:image/png;base64,'+fs.readFileSync(path.join(uiDir,f)).toString('base64')+');').join('')+'}\n':'';
  // The craft look (Ryan, 19 October: the workbench, concept A, is the core art style): its pieces (tools/creator/craft-kit.py,
  // app/ui/craft) as --lk-*, the hand-lettering faces, and app/styles/craft.css after everything else. EWF_LOOK=b|c
  // with EWF_OUT layers one of the two concepts that lost (app/styles/looks/) on top, to look back at them.
  const look=process.env.EWF_LOOK,lkDir=path.join(uiDir,'craft');
  const pieces=d=>fs.existsSync(d)?':root{'+fs.readdirSync(d).filter(f=>f.endsWith('.png')).sort().map(f=>'--lk-'+f.slice(0,-4)+':url(data:image/png;base64,'+fs.readFileSync(path.join(d,f)).toString('base64')+');').join('')+'}\n':'';
  const lk=pieces(lkDir)
    +[['marker','Craft Marker'],['hand','Craft Hand'],['typed','Craft Typed'],['kalam','Craft Kalam'],['gochi','Craft Gochi']].map(x=>{const f=path.join(appDir,'fonts','hand',x[0]+'.woff2');return fs.existsSync(f)?"@font-face{font-family:'"+x[1]+"';font-display:swap;src:url(data:font/woff2;base64,"+fs.readFileSync(f).toString('base64')+") format('woff2')}\n":'';}).join('')
    +fs.readFileSync(path.join(appDir,'styles','craft.css'),'utf8').replace(/(^|[^\w.#-])(-?\d*\.?\d+)ch\b/g,(m,pre,n)=>pre+'calc('+n+'*var(--ch))')
    +(look&&look!=='a'?pieces(path.join(uiDir,look))
      +fs.readFileSync(path.join(appDir,'styles','looks',look+'.css'),'utf8').replace(/(^|[^\w.#-])(-?\d*\.?\d+)ch\b/g,(m,pre,n)=>pre+'calc('+n+'*var(--ch))'):'');
  // the one typeface is embedded, so the game fetches nothing at all (VT323, SIL Open Font License 1.1)
  const fontFile=path.join(appDir,'node_modules','@fontsource','vt323','files','vt323-latin-400-normal.woff2');
  const font=fs.existsSync(fontFile)?"@font-face{font-family:'VT323';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,"+fs.readFileSync(fontFile).toString('base64')+") format('woff2')}\n":'';
  const blocksFile=path.join(appDir,'fonts','ewf-blocks.woff2');   // box-drawing, block and shape glyphs VT323 lacks (tools/build-font.py)
  const blocks=fs.existsSync(blocksFile)?"@font-face{font-family:'EWF Blocks';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,"+fs.readFileSync(blocksFile).toString('base64')+") format('woff2')}\n":'';
  // add-ons: self-contained scripts appended after the interface (app/addons/*.js), each in its own script tag
  const addDir=path.join(appDir,'addons');
  const addons=fs.existsSync(addDir)?fs.readdirSync(addDir).filter(f=>f.endsWith('.js')).sort().map(f=>'\n<script>\n'+fs.readFileSync(path.join(addDir,f),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>').join(''):'';
  const next=`<title>WrestleCraft: Be The Booker</title>
<style>
${font}${blocks}${sans}${ui}${css}${lk}</style>
<div id="app"></div>
<script>
window.GP_UNIVERSE=${rd('universes/public_domain.json').replace(/<\//g,'<\\/')};
window.GP_UNIVERSE_PARODY=${rd('universes/parody.json').replace(/<\//g,'<\\/')};</script>
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
