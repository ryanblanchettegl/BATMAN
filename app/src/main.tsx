import { render } from 'preact';
import { App } from './app';
import { G, ui, pref, setUniverse } from './store';
import { E } from './engine';
import { initInput, setBootTimer } from './input';
import { BOOT_STEPS } from './screens/start';

setUniverse(pref.uni || 'public_domain');
initInput();

/* a preview host can hand back the state it captured before a hot reload */
const hot = (window as any).claude && (window as any).claude.hot;
function boot(d: any) {
  if (d && d.S && d.S.v === 4) { G.S = d.S; E.attach(G.S); }
  else {
    let calm = false; try { calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
    if (pref.boot && !calm) {
      ui.boot = { step: 0 };
      const tick = () => { if (!ui.boot) return; ui.boot.step++; if (ui.boot.step > BOOT_STEPS) ui.boot = null; else setBootTimer(setTimeout(tick, 430)); draw(); };
      setBootTimer(setTimeout(tick, 380));
    }
  }
  draw();
}
let mounted = false;
function draw() { if (!mounted) { mounted = true; render(<App />, document.getElementById('app')!); } else (window as any).EWF_DEBUG.render(); }
if (hot && hot.snapshot) hot.snapshot(() => ({ S: G.S }));
if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
