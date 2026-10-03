/* The World Editor: build a world from scratch, or change a copy of one, and share it. Reached from the title screen. */
import { useRef } from 'preact/hooks';
import { E } from '../../engine';
import { UNIS, ui, redraw, builtInUniverse, plural } from '../../store';
import { onBack } from '../../input';
import { Btn, Panel, Head, Tabs, Field } from '../../kit';
import { StartMenu } from '../start';
import { es, world, keep, look, note, report, freeId, openWorld, EdTab } from './state';
import { DelBtn } from './parts';
import { WorldTab, ShareTab } from './World';
import { CompaniesTab, ShowsTab } from './Companies';
import { WrestlersTab } from './People';
import { BeltsTab, TeamsTab } from './Belts';

/* Back steps out one level at a time: the open record, then the world, then the title screen. */
onBack(() => {
  if (ui.scr !== 'editor') return false;
  const st = es();
  if (st.id && st.sel[st.tab]) { st.sel[st.tab] = null; redraw(); return true; }
  if (st.id) { keep(true); st.id = null; st.msg = ''; redraw(); return true; }
  ui.scr = 'title'; ui.mi = 0; redraw(); return true;
});

function addWorld(pkg: any) { const id = freeId(pkg.manifest.id); pkg.manifest.id = id; UNIS[id] = pkg; openWorld(id); keep(true); }
/** worlds read from the player's Workshop subscriptions (Steam version only) */
let ws: any[] = [];
function summary(pkg: any): string { const n = (pkg.promotions || []).length, w = (pkg.workers || []).length; return n + ' ' + plural(n, 'company', 'companies') + ', ' + w + ' ' + plural(w, 'wrestler'); }

function Home() {
  const st = es(), ids = Object.keys(UNIS), file = useRef<HTMLInputElement>(null), steam = (window as any).gpSteam;
  const onFile = (e: Event) => {
    const t = e.currentTarget as HTMLInputElement, fl = t.files && t.files[0]; if (!fl) return;
    const fr = new FileReader();
    fr.onload = () => { let pkg: any = null; try { pkg = JSON.parse(String(fr.result)); } catch (x) { pkg = null; }
      look(() => { if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) note(fl.name + ' is not a world file.', true); else addWorld(E.edCopy(pkg, (pkg.manifest && pkg.manifest.name) || fl.name.replace(/\.json$/i, ''))); }); };
    fr.onerror = () => look(() => note('That file could not be read.', true));
    fr.readAsText(fl); t.value = '';
  };
  return <>
    <Head eyebrow="World Editor" title="Build your own world" />
    <p class="lede c mb3">Companies, shows, belts and wrestlers. Make them all, then play it or share it.</p>
    {st.msg ? <p class={'ednote ' + (st.err ? 'bad' : 'good') + ' mb2'} role="status">{st.msg}</p> : null}
    <Panel cls="mb4" title="Your worlds">
      {ids.length ? <ul class="list">{ids.map(id => { const pkg = UNIS[id], v = E.edCheck(pkg); return <li class="col" key={id}>
        <span><b>{pkg.manifest.name || id}</b> <span class="muted">{'·'} {summary(pkg)}</span><br />
          {v.ok ? <span class="good">Ready to play.</span> : <span class="bad">{v.errors} {plural(v.errors, 'problem')} to fix before it can be played.</span>}</span>
        <span class="row opts"><Btn kind="go" t="ed-open" d={{ id }} onClick={() => look(() => openWorld(id))}>Edit</Btn>
          <Btn kind="sm" t="ed-copy" d={{ id }} onClick={() => look(() => addWorld(E.edCopy(pkg)))}>Make a copy</Btn>
          <DelBtn id={'world:' + id} what="this world" onDelete={() => { delete UNIS[id]; keep(true); }} /></span></li>; })}</ul>
        : <p class="empty">No worlds yet. Start one below.</p>}
    </Panel>
    <Panel cls="mb4" title="Start a new world">
      <div class="row"><Field label="Name of the world"><input type="text" id="ed-newname" data-t="ed-newname" value={st.newName} maxLength={40} placeholder="My world" onInput={e => { st.newName = (e.currentTarget as HTMLInputElement).value; }} /></Field></div>
      <div class="row mt2">
        <Btn kind="go" t="ed-new" onClick={() => look(() => { addWorld(E.edNew(st.newName)); st.newName = ''; })}>Start from scratch</Btn>
        <Btn t="ed-new-copy" onClick={() => look(() => { addWorld(E.edCopy(builtInUniverse(), st.newName || undefined)); st.newName = ''; })}>Start from a copy of the built-in world</Btn>
        <Btn t="ed-import" onClick={() => file.current && file.current.click()}>Open a world file</Btn>
        <input type="file" id="ed-file" ref={file} accept=".json,application/json" hidden onChange={onFile} />
      </div>
      <p class="muted mt2">From scratch gives you an empty world. A world needs at least two companies, each with a weekly show and six wrestlers, before it can be played.</p>
    </Panel>
    {steam && steam.workshopWorlds ? <Panel cls="mb4" title="From the Workshop">
      <div class="row"><Btn t="ed-ws-load" onClick={() => Promise.resolve(steam.workshopWorlds()).then((list: any[]) => look(() => { st.sel.ws = 'y'; ws = (list || []).filter(x => x && x.manifest); }), () => look(() => note('The Workshop could not be read.', true)))}>Look for worlds I have subscribed to</Btn></div>
      {st.sel.ws ? (ws.length ? <ul class="list mt2">{ws.map((pkg, i) => <li key={i}><span><b>{pkg.manifest.name}</b> <span class="muted">{'·'} {summary(pkg)}{pkg.manifest.author ? ' · by ' + pkg.manifest.author : ''}</span></span>
        <Btn kind="sm" t="ed-ws-add" d={{ v: i }} onClick={() => look(() => addWorld(E.edCopy(pkg, pkg.manifest.name)))}>Add to my worlds</Btn></li>)}</ul> : <p class="empty mt2">No subscribed worlds found.</p>) : null}
    </Panel> : null}
    <div class="row"><Btn t="ed-exit" onClick={() => look(() => { ui.scr = 'title'; ui.mi = 0; })}>{'◄'} Back to the title screen</Btn></div>
  </>;
}

const TABS: [EdTab, string][] = [['world', 'World'], ['companies', 'Companies'], ['shows', 'Shows'], ['belts', 'Belts'], ['wrestlers', 'Wrestlers'], ['teams', 'Teams'], ['share', 'Check and share']];
function Open() {
  const st = es(), pkg = world(), v = report();
  const body = st.tab === 'world' ? <WorldTab /> : st.tab === 'companies' ? <CompaniesTab /> : st.tab === 'shows' ? <ShowsTab /> : st.tab === 'belts' ? <BeltsTab /> : st.tab === 'wrestlers' ? <WrestlersTab /> : st.tab === 'teams' ? <TeamsTab /> : <ShareTab />;
  return <>
    <Head eyebrow="World Editor" title={pkg.manifest.name || 'My world'} />
    <div class="row edtop mb2">
      <Btn kind="sm" t="ed-worlds" onClick={() => look(() => { keep(true); st.id = null; st.msg = ''; })}>{'◄'} All worlds</Btn>
      <span class="sp" />
      {v.ok ? <span class="good" role="status">Ready to play{v.warnings ? ' · ' + v.warnings + ' ' + plural(v.warnings, 'note') : ''}</span>
        : <Btn kind="sm" t="ed-problems" onClick={() => look(() => { st.tab = 'share'; })}>{v.errors} {plural(v.errors, 'problem')} to fix</Btn>}
    </div>
    <Tabs label="Parts of the world" items={TABS.map(x => ({ id: x[0], label: x[1], t: 'ed-tab' }))} value={st.tab} onPick={id => look(() => { st.tab = id as EdTab; window.scrollTo(0, 0); })} />
    {st.msg ? <p class={'ednote ' + (st.err ? 'bad' : 'good') + ' mt2'} role="status">{st.msg}</p> : null}
    <div class="mt2">{body}</div>
  </>;
}

export function Editor() {
  const st = es();
  if (st.id && !UNIS[st.id]) st.id = null;
  return <div class="crt"><StartMenu /><div class="start edpage">{st.id ? <Open /> : <Home />}</div>
    <div class="status"><span>World Editor</span><span class="opt">|</span><span class="opt">Changes are kept as you make them</span><span>Esc: back</span></div></div>;
}
