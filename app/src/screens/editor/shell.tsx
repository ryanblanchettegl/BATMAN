/* The World Editor's frame, the same on every page of it (Ryan, 20 October: every screen fits with the others): the
   menu bar with the editor's name card and its tabs, a navy strip for notes, the page, and a strip along the bottom
   with what is in the world, Esc and the page's main key. Create a Wrestler and Create a Scene wear the same bar. */
import { ComponentChildren } from 'preact';
import { Btn } from '../../kit';
import { plural } from '../../store';
import { es, world, look, report, keep, canUndo, undoDel, TABS, EdTab } from './state';

export function EdShell(p: { tab?: EdTab | null; note: ComponentChildren; bad?: boolean; back: () => void; backLabel: string; main?: ComponentChildren; t?: string; cls?: string; children: ComponentChildren; tiles?: ComponentChildren }) {
  const st = es(), pkg = st.id ? world() : null, v = pkg ? report() : null;
  return <div class={'scfull paper edpage edshell' + (p.cls ? ' ' + p.cls : '')} data-t={p.t}>
    <nav class="pmenu" aria-label={pkg ? 'Parts of the world' : 'World Editor'}>
      <b class="pm-app">World Editor</b>
      {pkg ? TABS.map(([id, n]) => <button type="button" class={'it' + (id === p.tab ? ' on' : '')} aria-current={id === p.tab ? 'page' : undefined} data-t="ed-tab" data-v={id} onClick={() => look(() => { st.tab = id; })}>{n}</button>) : <span class="pm-world">Your worlds</span>}
      <span class="sp" />
      {pkg ? <><span class="pm-world">{pkg.manifest.name || 'My world'}</span>
        {v.ok ? <span class="pm-ok" role="status">Ready to play</span> : <button type="button" class="it bad" data-t="ed-problems" onClick={() => look(() => { st.tab = 'share'; })}>{v.errors} {plural(v.errors, 'problem')}</button>}
        <button type="button" class="it" data-t="ed-worlds" onClick={() => look(() => { keep(true); st.id = null; st.msg = ''; })}>All worlds</button></> : null}
    </nav>
    <div class={'pnote' + (p.bad ? ' bad' : '')} role="status">{p.note}{canUndo() ? <Btn kind="sm" t="ed-undo" onClick={undoDel}>Undo</Btn> : null}</div>
    {p.children}
    <div class="pstrip" role="group" aria-label={pkg ? 'This world' : 'Your worlds'}>
      {pkg ? (p.tiles || <><span class="tile">Companies <b>{pkg.promotions.length}</b></span><span class="tile">Belts <b>{pkg.titles.length}</b></span><span class="tile">Wrestlers <b>{pkg.workers.length}</b></span><span class="tile">Teams <b>{pkg.teams.length}</b></span></>) : <span class="tile">Changes are kept as you make them</span>}
      <span class="sp" />
      <kbd>ESC</kbd><Btn kind="less" t="ed-back" onClick={p.back}>{p.backLabel}</Btn>
      {p.main}
    </div>
  </div>;
}
