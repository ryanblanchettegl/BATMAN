/* World Editor: Import for the rest of a world (Ryan, 20 October: import from other worlds or Steam). Scenes and moves,
   promos and angles, match rules: pick a world (another of yours, an included one, the Steam Workshop), pick what you want,
   and it comes in; something with an id this world has already comes in under a new one (E.edImportThings). */
import { useState } from 'preact/hooks';
import { E } from '../../engine';
import { Btn, Sel, Opt } from '../../kit';
import { Window } from '../../kit/window';
import { UNIS, BUILT_IN, builtInUniverse, plural } from '../../store';
import { es, world, edit, note } from './state';

/** The worlds something can come from, as dropdown groups, and the world a value names. */
export function useSources() {
  const st = es(), steam = (window as any).gpSteam, [ws, setWs] = useState<any[] | null>(null);
  const groups = [{ label: 'Your other worlds', options: Object.keys(UNIS).filter(id => id !== st.id).map(id => ['u:' + id, UNIS[id].manifest.name || id] as Opt) },
    { label: 'Included', options: Object.keys(BUILT_IN).map(id => ['b:' + id, builtInUniverse(id).manifest.name] as Opt) },
    { label: 'The Steam Workshop', options: (ws || []).map((x, i) => ['w:' + i, x.manifest.name || 'A Workshop world'] as Opt) }];
  const of = (v: string): any => v.startsWith('u:') ? UNIS[v.slice(2)] : v.startsWith('b:') ? builtInUniverse(v.slice(2)) : v.startsWith('w:') && ws ? ws[+v.slice(2)] : null;
  const loadWs = steam && steam.workshopWorlds && !ws ? () => Promise.resolve(steam.workshopWorlds()).then((l: any[]) => setWs((l || []).filter(x => x && x.manifest)), () => setWs([])) : null;
  return { groups, of, loadWs };
}

export function ImportThings(p: { kind: 'scenes' | 'segkinds' | 'stips'; onClose: () => void }) {
  const pkg = world(), src = useSources(), [from, setFrom] = useState(''), [q, setQ] = useState(''), [pk, setPk] = useState<Record<string, 1>>({});
  const label = (E.ED_THINGS as [string, string][]).find(x => x[0] === p.kind)![1], s0 = from ? src.of(from) : null;
  const L: any[] = s0 ? E.edThingList(s0, p.kind) : [], ql = q.trim().toLowerCase(), shown = L.filter(x => !ql || (x.name + ' ' + x.sub).toLowerCase().indexOf(ql) >= 0), n = Object.keys(pk).length;
  const go = () => edit(() => { const k = E.edImportThings(pkg, s0, p.kind, Object.keys(pk)); note(k + ' ' + plural(k, 'thing') + ' came in from ' + (s0.manifest.name || 'the other world') + ': ' + label.toLowerCase() + '.'); p.onClose(); });
  return <Window paper big esc title={'Import: ' + label} info={['From another world or the Steam Workshop', n ? n + ' picked' : 'Pick some']} onClose={p.onClose} ok="Cancel" hint="Esc closes"
    footer={<Btn kind="go" t="ed-imp-go" disabled={!n || !s0} onClick={go}>{n ? 'Import ' + n : 'Import'}</Btn>}>
    <div class="sc-row"><span class="sc-lbl">From</span><Sel t="ed-imp-src" label="Import from" value={from} options={[['', 'Pick a world'] as Opt]} groups={src.groups} onChange={v => { setFrom(v); setPk({}); }} />
      {src.loadWs ? <Btn kind="sm" t="ed-imp-ws" onClick={src.loadWs}>Load the Workshop</Btn> : null}</div>
    {s0 ? <>
      <div class="sc-row"><input type="search" value={q} placeholder={'Search ' + L.length} aria-label={'Search ' + label.toLowerCase()} data-t="ed-imp-q" onInput={e => setQ((e.currentTarget as HTMLInputElement).value)} />
        <Btn kind="sm" t="ed-imp-all" disabled={!shown.length} onClick={() => { const o: Record<string, 1> = { ...pk }; shown.forEach(x => { o[x.id] = 1; }); setPk(o); }}>Pick all shown</Btn><Btn kind="less" t="ed-imp-none" disabled={!n} onClick={() => setPk({})}>Pick none</Btn></div>
      {L.length ? <div class="edimport" role="list">{shown.map(x => { const on = !!pk[x.id]; return <button type="button" key={x.id} class={'edrow' + (on ? ' on' : '')} aria-pressed={on} data-t="ed-imp-pick" data-id={x.id}
        onClick={() => { const o = { ...pk }; if (on) delete o[x.id]; else o[x.id] = 1; setPk(o); }}><span class="nm">{x.name}</span><span class="st">{x.sub}</span></button>; })}</div>
        : <p class="muted">{s0.manifest.name || 'That world'} has none of its own.</p>}
    </> : <p class="muted">Pick a world to see its {label.toLowerCase()}.</p>}
  </Window>;
}
