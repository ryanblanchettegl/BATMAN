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
import { Sheet, Many } from './People';
import { plural } from '../../store';

const PER = 8;
const PARTS: ['who' | 'work' | 'rates' | 'more', string][] = [['who', 'Biography'], ['work', 'Company'], ['rates', 'Attributes'], ['more', 'More']];

export function WrestlersPage() {
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
          {st.fp === 'FA' ? <Btn kind="sm" t="ed-unknowns" onClick={() => edit(() => { const m = E.edFillFree(pkg, 6, Date.now() & 0xffff); note('Six unknowns added to the free agents: ' + m.map((x: any) => x.ring_name).slice(0, 3).join(', ') + ' and three more.'); })}>Make unknowns</Btn> : null}
          <Btn kind="less" t="ed-many" on={!!st.many} onClick={() => look(() => { st.many = !st.many; st.picked = {}; st.del = null; })}>{st.many ? 'Pick several: on' : 'Pick several'}</Btn>{st.many ? <span class="muted">{Object.keys(st.picked || {}).length} picked</span> : null}
        </div>
      </Win>
      <Win title={shownW ? shownW.ring_name : 'Nobody yet'} area="doll" t="ed-wdoll" info={shownW ? [pname[info.home[shownW.id]] || 'Free agent', sideOf(shownW) + (lk ? ' · their own look' : ' · drawn by the game')] : ['', '']}>
        {shownW && ww ? <>
          <div class="sc-stage edw-stage"><ScenePlayer key="edw" sc={sc} cast={{ A: recipeOf(ww) }} play={shownW.id + JSON.stringify(shownW.look || null) + (shownW.face ? JSON.stringify(shownW.face) : '')} still orbit fill t="ed-wview" label={shownW.ring_name + ' in ring gear. Drag to walk round them.'} /></div>
          <div class="pmarquee"><LightText text={(shownW.ring_name + (fin ? ' · ' + fin : '')).toUpperCase().slice(0, 40)} t="ed-wlights" /></div>
          <div class="sc-row edw-acts"><Btn kind="go" t="ed-caw" onClick={() => caw()}>Edit wrestler</Btn><Btn kind="sm" t="ed-attire" onClick={() => caw(true)}>Edit attire</Btn></div>
        </> : <p class="empty">No wrestlers yet. Add one, and they stand here.</p>}
      </Win>
      <Win title={shownW ? (PARTS.find(x => x[0] === part) || PARTS[0])[1] : 'Biography'} area="sheet" t="ed-wsheet" info={shownW ? [(shownW.age ? 'Age ' + shownW.age : 'Age unknown') + ' · ' + (shownW.gender === 'F' ? 'Women' : 'Men'), 'Over ' + ov(shownW)] : ['', '']}>
        {shownW ? <>
          <div class="sc-row edw-parts"><span class="sc-lbl">Show</span><Sel t="ed-sheet" label="Section" value={part} options={PARTS as Opt[]} onChange={v => look(() => { st.sheet = v as any; })} /></div>
          <div class="edsheet edcol-form" data-part={part}><Sheet key={shownW.id + part} w={shownW} part={part} /></div>
        </> : <p class="empty">Their biography, their company and their attributes show here.</p>}
      </Win>
    </Desktop>
  </EdShell>;
}
