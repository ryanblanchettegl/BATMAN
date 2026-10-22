import { render } from 'preact';
import { App } from './app';
import { G, ui, pref, setUniverse, DEFAULT_UNI, initSaves } from './store';
import { E } from './engine';
import { initInput } from './input';
import { mountTips } from './shell/Tip';

setUniverse(pref.uni || DEFAULT_UNI);
initInput();

/* a preview host can hand back the state it captured before a hot reload */
const hot = (window as any).claude && (window as any).claude.hot;
function boot(d: any) {
  if (d && d.S && d.S.v === 4) { G.S = d.S; E.attach(G.S); }
  draw();
}
let mounted = false;
function draw() { if (!mounted) { mounted = true; render(<App />, document.getElementById('app')!); mountTips(); } else (window as any).EWF_DEBUG.render(); }
if (hot && hot.snapshot) hot.snapshot(() => ({ S: G.S }));
// the saves are read from the database before the first screen
initSaves().then(() => { if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {}); });
