/* The World Editor's Wrestlers page, in the paper look (rule 2a; docs/mockups/paper/desk.png). Create a Wrestler is
   its heart (Ryan, 18 October): the list on the left, the wrestler drawn full length in the middle with Edit wrestler,
   and the ring sheet on the right, a section at a time, so the page is one screen. Under a white menu bar with the
   editor's tabs, a navy strip for notes, and a control strip along the bottom, as on the desk. */
import { E } from '../../engine';
import { Btn, Sel, Opt, Desktop, Win, LightText } from '../../kit';
import { ScenePlayer } from '../../kit/sceneplayer';
import { WAIST } from '../../kit/scene';
import { recipeOf } from '../../kit/puppet';
import { workerW } from '../player';
import { es, world, edit, look, note, keep } from './state';
import { EdShell } from './shell';
import { SheetView, Many } from './People';
import { plural, UNIS, BUILT_IN, builtInUniverse } from '../../store';
import { useRef, useState } from 'preact/hooks';
import { Window } from '../../kit/window';
import { saveFile } from '../../shared/savefile';

const PER = 8;
/** Import: pick wrestlers from another world (your others, the built-in ones, the Steam Workshop) or a wrestler file, and they come in as free agents. */
function ImportWindow(p: { onClose: () => void }) {
  const st = es(), pkg = world(), steam = (window as any).gpSteam, file = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState(''), [q, setQ] = useState(''), [pk, setPk] = useState<Record<string, 1>>({}), [ws, setWs] = useState<any[] | null>(null);
  const mine = Object.keys(UNIS).filter(id => id !== st.id).map(id => ['u:' + id, UNIS[id].manifest.name || id] as Opt);
  const built = Object.keys(BUILT_IN).map(id => ['b:' + id, builtInUniverse(id).manifest.name] as Opt);
  const wsO = (ws || []).map((x, i) => ['w:' + i, x.manifest.name || 'A Workshop world'] as Opt);
  const srcPkg = src.startsWith('u:') ? UNIS[src.slice(2)] : src.startsWith('b:') ? builtInUniverse(src.slice(2)) : src.startsWith('w:') && ws ? ws[+src.slice(2)] : null;
  const L: any[] = srcPkg ? E.edImportList(srcPkg) : [], ql = q.trim().toLowerCase(), shown = L.filter(x => !ql || (x.name + ' ' + x.co).toLowerCase().indexOf(ql) >= 0), n = Object.keys(pk).length;
  const go = () => edit(() => { const got = E.edImportWorkers(pkg, srcPkg, Object.keys(pk)); if (got[0]) st.sel.wrestlers = got[0].id; st.fp = 'FA'; st.q = ''; note(got.length + ' ' + plural(got.length, 'wrestler') + ' came in as free agents: ' + got.slice(0, 3).map((w: any) => w.ring_name).join(', ') + (got.length > 3 ? ' and more.' : '.')); p.onClose(); });
  const onFile = (e: Event) => { const t = e.currentTarget as HTMLInputElement, fl = t.files && t.files[0]; if (!fl) return; const fr = new FileReader();
    fr.onload = () => { let x: any = null; try { x = JSON.parse(String(fr.result)); } catch (er) { x = null; } edit(() => { const got = x && E.edImportFile(pkg, x, { name: fl.name.replace(/\.wrestlers?\.json$|\.json$/i, '') }); if (got && got.length) { st.sel.wrestlers = got[0].id; st.fp = 'FA'; note(got.length === 1 ? got[0].ring_name + ' came in from a file as a free agent.' : got.length + ' wrestlers came in from a file as free agents.'); p.onClose(); } else note(fl.name + ' is not a wrestler file.', true); }); };
    fr.readAsText(fl); t.value = ''; };
  return <Window paper big esc title="Import wrestlers" info={['From another world, the Workshop or a file', n ? n + ' picked' : 'Pick some']} onClose={p.onClose} ok="Cancel" hint="Esc closes"
    footer={<Btn kind="go" t="ed-import-go" disabled={!n || !srcPkg} onClick={go}>{n ? 'Import ' + n : 'Import'}</Btn>}>
    <div class="sc-row"><span class="sc-lbl">From</span><Sel t="ed-import-src" label="Import from" value={src} options={[['', 'Pick a world'] as Opt]} groups={[{ label: 'Your other worlds', options: mine }, { label: 'Included', options: built }, { label: 'The Steam Workshop', options: wsO }]} onChange={v => { setSrc(v); setPk({}); }} />
      {steam && steam.workshopWorlds && !ws ? <Btn kind="sm" t="ed-import-ws" onClick={() => Promise.resolve(steam.workshopWorlds()).then((l: any[]) => setWs((l || []).filter(x => x && x.manifest)), () => setWs([]))}>Load the Workshop</Btn> : null}
      <Btn kind="sm" t="ed-import-file" onClick={() => file.current && file.current.click()}>A wrestler file</Btn><input ref={file} type="file" accept=".json,application/json" hidden data-t="ed-import-filein" onChange={onFile} /></div>
    {srcPkg ? <>
      <div class="sc-row"><input type="search" value={q} placeholder={'Search ' + L.length + ' wrestlers'} aria-label="Search the wrestlers" data-t="ed-import-q" onInput={e => setQ((e.currentTarget as HTMLInputElement).value)} />
        <Btn kind="sm" t="ed-import-all" onClick={() => { const o: Record<string, 1> = { ...pk }; shown.forEach(x => { o[x.id] = 1; }); setPk(o); }}>Pick all shown</Btn><Btn kind="less" t="ed-import-none" disabled={!n} onClick={() => setPk({})}>Pick none</Btn></div>
      <div class="edimport" role="list">{shown.map(x => { const on = !!pk[x.id]; return <button type="button" key={x.id} class={'edrow' + (on ? ' on' : '')} aria-pressed={on} data-t="ed-import-pick" data-id={x.id}
        onClick={() => { const o = { ...pk }; if (on) delete o[x.id]; else o[x.id] = 1; setPk(o); }}><span class="nm">{x.name}</span><span class="st">{x.co + ' · Over ' + x.over + (x.look ? ' · their own look' : '')}</span></button>; })}
        {shown.length ? null : <p class="muted">Nobody matches.</p>}</div>
    </> : <p class="muted">Pick a world to see its wrestlers, or bring one in from a wrestler file (Create a Wrestler, File, Write a file). Each comes in as a free agent with their look, moves and attributes.</p>}
  </Window>;
}
const PARTS: ['who' | 'work' | 'rates' | 'more', string][] = [['who', 'Biography'], ['work', 'Company'], ['rates', 'Attributes'], ['more', 'More']];

export function WrestlersPage() {
  const [imp, setImp] = useState(false);
  const st = es(), pkg = world(), info = E.edInfo(pkg), q = st.q.trim().toLowerCase();
  const pname: Record<string, string> = {}; pkg.promotions.forEach((x: any) => { pname[x.id] = x.name; });
  const all: any[] = pkg.workers.filter((w: any) => (st.fp === '' || (st.fp === 'FA' ? !info.home[w.id] : info.home[w.id] === st.fp)) && (!q || String(w.ring_name).toLowerCase().indexOf(q) >= 0));
  const sorts = st.sort || (st.sort = {}), by = sorts[String(st.id)] || 'over', ov = (x: any) => (x.ratings && x.ratings.overness) || 0, nm = (x: any) => String(x.ring_name || '');
  const cmp: Record<string, (a: any, b: any) => number> = {
    over: (a, b) => ov(b) - ov(a) || nm(a).localeCompare(nm(b)), name: (a, b) => nm(a).localeCompare(nm(b)),
    age: (a, b) => (+a.age || 0) - (+b.age || 0) || nm(a).localeCompare(nm(b)),
    co: (a, b) => String(pname[info.home[a.id]] || '~').localeCompare(String(pname[info.home[b.id]] || '~')) || ov(b) - ov(a) };
  all.sort(cmp[by] || cmp.over);
  const pages = Math.max(1, Math.ceil(all.length / PER)), pg = Math.min(st.wpg || 0, pages - 1), shown = all.slice(pg * PER, pg * PER + PER);
  const w = pkg.workers.find((x: any) => x.id === st.sel.wrestlers) || null, con = w ? E.edContract(pkg, w.id) : null;
  const part = st.sheet || 'who', fa = pkg.workers.filter((x: any) => !info.home[x.id]).length;
  const add = () => edit(() => { const pid = st.fp && st.fp !== 'FA' ? st.fp : null, n = E.edAddWorker(pkg, { ring_name: 'New wrestler', promotion_id: pid }); st.sel.wrestlers = n.id; st.q = ''; st.sheet = 'who'; });
  const pick = (id: string) => look(() => { if (st.many) { const P = st.picked || (st.picked = {}); if (P[id]) delete P[id]; else P[id] = 1; } else st.sel.wrestlers = id; });
  const back = () => look(() => { if (st.sel.wrestlers) st.sel.wrestlers = null; else { keep(true); st.id = null; st.msg = ''; } });
  const caw = (attire = false) => { if (shownW) look(() => { st.player = shownW.id; st.attire = attire; }); };
  const shownW = w || shown[0] || null;   // somebody is always on show: the picked one, else the first on the list (rule 5c)
  // Export: the picked wrestlers (Pick several), or the one on show, as one .wrestler.json
  const exportIt = () => { const ids = st.many ? Object.keys(st.picked || {}) : shownW ? [shownW.id] : []; if (!ids.length) return;
    const f = E.edExportWorkers(pkg, ids), one = f.workers.length === 1, slug = (x: string) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wrestler';
    const name = (one ? slug(f.workers[0].ring_name) : slug(pkg.manifest.name || 'world') + '-' + f.workers.length + '-wrestlers') + '.wrestler.json';
    saveFile(name, JSON.stringify(f, null, 1)).then(r => look(() => note(r === 'saved' ? (one ? f.workers[0].ring_name : f.workers.length + ' wrestlers') + ' written to ' + name + '. Import brings them into any world.' : (r === 'declined' ? 'Not saved.' : 'The file could not be written here.'), r !== 'saved' && r !== 'declined'))); };
  const lk = shownW && shownW.look, fin = lk && lk.finishing_moves && lk.finishing_moves[0] ? lk.finishing_moves[0].name : shownW && shownW.finisher;
  const ww = shownW ? { ...workerW(shownW), look: shownW.look || null } : null;
  const sc = { v: 1 as const, id: 'edw', name: 'The wrestler', when: 'any', set: 'ring', attire: 'primary_ring' as const, slots: [{ id: 'A', n: w ? w.ring_name : '', role: 'a' as const }],
    keys: [{ t: 0, figs: { A: { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} } }, props: [], cam: { x: 0, y: 0.15, z: 1.4 } }] };
  const sideOf = (x: any) => x.disposition === 'heel' ? 'Heel' : x.disposition === 'tweener' ? 'Tweener' : 'Face';
  return <EdShell tab="wrestlers" t="ed-wpage" cls="edwfull" bad={st.err} note={st.msg || (w ? w.ring_name + ': Edit wrestler opens Create a Wrestler, Edit attire their outfits.' : 'Pick a wrestler on the list, or add one.')}
    back={back} backLabel={w ? 'Back to the list' : 'All worlds'} main={<Btn kind="go" cls="pkey" t="ed-caw-key" disabled={!shownW} onClick={() => caw()}>EDIT WRESTLER</Btn>}
    tiles={<><span class="tile">Wrestlers <b>{pkg.workers.length}</b></span><span class="tile">Companies <b>{pkg.promotions.length}</b></span><span class="tile">Free agents <b>{fa}</b></span>{con ? <span class="tile">{pname[con.promotion_id]}</span> : null}</>}>
    <Desktop cls="edwpage">
      <Win title="Wrestlers" area="list" t="ed-wlist" info={[all.length + (all.length === pkg.workers.length ? ' in this world' : ' of ' + pkg.workers.length), pages > 1 ? 'Page ' + (pg + 1) + ' of ' + pages : (st.many ? Object.keys(st.picked || {}).length + ' picked' : '')]}>
        <div class="sc-row">
          <input type="search" id="ed-q" data-t="ed-q" value={st.q} placeholder="Search by name" aria-label="Search by name" onInput={e => look(() => { st.q = (e.currentTarget as HTMLInputElement).value; st.wpg = 0; })} />
        </div>
        <div class="sc-row">
          <Sel t="ed-sort" label="Sort by" value={by} options={[['over', 'Overness'], ['name', 'Name'], ['age', 'Age'], ['co', 'Company']] as Opt[]} onChange={v2 => look(() => { sorts[String(st.id)] = v2; st.wpg = 0; })} />
          <Sel t="ed-fp" label="Company" value={st.fp} options={[['', 'Everyone'], ['FA', 'Free agents']].concat(pkg.promotions.map((x: any) => [x.id, x.name])) as Opt[]} onChange={v2 => look(() => { st.fp = v2; st.wpg = 0; })} />
        </div>
        {st.many && Object.keys(st.picked || {}).length ? <Many /> : null}
        <div class="edlist" role="list" data-n={all.length}>
          {shown.length ? shown.map(x => { const on = st.many ? !!(st.picked || {})[x.id] : x.id === st.sel.wrestlers;
            return <button type="button" key={x.id} class={'edrow' + (on ? ' on' : '')} aria-pressed={on} data-t="ed-pick" data-id={x.id} onClick={() => pick(x.id)}>
              <span class="nm">{x.ring_name}</span><span class="st">{(pname[info.home[x.id]] || 'Free agent') + ' · Over ' + ov(x)}</span></button>; })
            : <p class="empty">{pkg.workers.length ? 'Nobody matches.' : 'No wrestlers yet. Add one.'}</p>}
        </div>
        <p class="muted edshow">{'Showing ' + (all.length ? (pg * PER + 1) + '-' + (pg * PER + shown.length) : 0) + ' of ' + all.length + '.'}</p>
        <div class="sc-row">
          <Btn kind="less" t="ed-wpg" d={{ v: 'prev' }} label="Earlier names" disabled={pg <= 0} onClick={() => look(() => { st.wpg = pg - 1; })}>{'<'}</Btn>
          <Btn kind="less" t="ed-wpg" d={{ v: 'next' }} label="Later names" disabled={pg >= pages - 1} onClick={() => look(() => { st.wpg = pg + 1; })}>{'>'}</Btn>
          <Btn kind="sm" t="ed-add-wrestler" onClick={add}>Add a wrestler</Btn>
          <Btn kind="sm" t="ed-import-open" tip="Wrestlers from another world, the Steam Workshop or a wrestler file" onClick={() => setImp(true)}>Import</Btn>
          <Btn kind="sm" t="ed-export" disabled={!(st.many ? Object.keys(st.picked || {}).length : shownW)} tip="Write a wrestler file: the whole wrestler, to keep, share, put on the Steam Workshop or bring into another world" onClick={exportIt}>{st.many && Object.keys(st.picked || {}).length > 1 ? 'Export ' + Object.keys(st.picked || {}).length : 'Export'}</Btn>
          {st.fp === 'FA' ? <Btn kind="sm" t="ed-unknowns" onClick={() => edit(() => { const m = E.edFillFree(pkg, 6, Date.now() & 0xffff); note('Six unknowns added to the free agents: ' + m.map((x: any) => x.ring_name).slice(0, 3).join(', ') + ' and three more.'); })}>Make unknowns</Btn> : null}
          <Btn kind="less" t="ed-many" on={!!st.many} onClick={() => look(() => { st.many = !st.many; st.picked = {}; st.del = null; })}>{st.many ? 'Pick several: on' : 'Pick several'}</Btn>{st.many ? <span class="muted">{Object.keys(st.picked || {}).length} picked</span> : null}
        </div>
      </Win>
      <Win title={shownW ? shownW.ring_name : 'Nobody yet'} area="doll" t="ed-wdoll" info={shownW ? [pname[info.home[shownW.id]] || 'Free agent', sideOf(shownW) + (lk ? ' · their own look' : ' · drawn by the game')] : ['', '']}>
        {shownW && ww ? <>
          <div class="sc-stage edw-stage"><ScenePlayer key="edw" sc={sc} cast={{ A: recipeOf(ww) }} play={shownW.id + JSON.stringify(shownW.look || null) + (shownW.face ? JSON.stringify(shownW.face) : '')} still orbit fill t="ed-wview" label={shownW.ring_name + ' in ring gear. Drag to walk round them.'} /></div>
          <div class="pmarquee"><LightText text={(shownW.ring_name + (fin ? ' · ' + fin : '')).toUpperCase()} t="ed-wlights" /></div>
          <div class="sc-row edw-acts"><Btn kind="go" t="ed-caw" onClick={() => caw()}>Edit wrestler</Btn><Btn kind="sm" t="ed-attire" onClick={() => caw(true)}>Edit attire</Btn></div>
        </> : <p class="empty">No wrestlers yet. Add one, and they stand here.</p>}
      </Win>
      <Win title={shownW ? (PARTS.find(x => x[0] === part) || PARTS[0])[1] : 'Biography'} area="sheet" t="ed-wsheet" info={shownW ? [(shownW.age ? 'Age ' + shownW.age : 'Age unknown') + ' · ' + (shownW.gender === 'F' ? 'Women' : 'Men'), 'Over ' + ov(shownW)] : ['', '']}>
        {shownW ? <>
          <div class="sc-row edw-parts"><span class="sc-lbl">Show</span><Sel t="ed-sheet" label="Section" value={part} options={PARTS as Opt[]} onChange={v => look(() => { st.sheet = v as any; })} /></div>
          <div class="edsheet edcol-form" data-part={part}><SheetView key={shownW.id + part} w={shownW} part={part} /></div>
        </> : <p class="empty">Their biography, their company and their attributes show here.</p>}
      </Win>
    </Desktop>
    {imp ? <ImportWindow onClose={() => setImp(false)} /> : null}
  </EdShell>;
}
