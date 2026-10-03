/* The Roster page: filters, the sortable table, and the open profile above it. */
import { E, W } from '../../engine';
import { G, me, cash, view } from '../../store';
import { Head, Sel, TextBox, Tag, Side, Opt, champOf, brandName, dataAttrs } from '../../kit';
import { rs, selected, pick } from './state';
import { Profile } from './Profile';

/** Page heading shared with the Locker room page: the company and how many are under contract. */
export function RosterHead(p: { title: string }) {
  const P = me(), n = E.rosterOf(G.S, P.id).length;
  return <Head eyebrow={<>{P.name} {'·'} {n} under contract</>} title={p.title} />;
}

function Filters(p: { shown: number; of: number }) {
  const P = me(), f = rs().rf;
  const set = (k: 'brand' | 'g' | 'al') => (v: string) => view(() => { f[k] = v; });
  return <div class="row mb2">
    <TextBox type="search" id="rq" t="rq" label="Search roster" placeholder="Search by name" value={f.q} onInput={v => view(() => { f.q = v; })} />
    {P.brands && <Sel id="rf-brand" t="rf" d={{ k: 'brand' }} label="Brand" value={f.brand} onChange={set('brand')} options={[['all', 'All brands'] as Opt].concat(P.brands.map((b: any) => [b.id, b.name] as Opt))} />}
    <Sel id="rf-g" t="rf" d={{ k: 'g' }} label="Division" value={f.g} onChange={set('g')} options={[['all', 'Men and women'], ['M', 'Men'], ['F', 'Women']]} />
    <Sel id="rf-al" t="rf" d={{ k: 'al' }} label="Alignment" value={f.al} onChange={set('al')} options={[['all', 'Faces and heels'], ['F', 'Faces'], ['H', 'Heels']]} />
    <span class="muted">{p.shown} of {p.of}</span>
  </div>;
}

/** A column heading that sorts the table. Text columns start ascending, numbers start with the biggest. */
function Th(p: { k: string; label: string; r?: boolean }) {
  const st = rs(), on = st.rs.k === p.k, up = st.rs.d > 0;
  const sort = () => view(() => { if (on) st.rs.d = -st.rs.d; else st.rs = { k: p.k, d: p.k === 'name' || p.k === 'brand' || p.k === 'align' ? 1 : -1 }; });
  return <th class={p.r ? 'r' : undefined} aria-sort={on ? (up ? 'ascending' : 'descending') : undefined}>
    <button type="button" onClick={sort} {...dataAttrs('sort', { v: p.k })}>{p.label}{on ? (up ? ' ▲' : ' ▼') : ''}</button>
  </th>;
}

function Status(p: { w: W; champ: boolean }) {
  const w = p.w;
  return <>
    {w.camp ? <><Tag kind="warn">Camp</Tag> </> : null}
    {w.inj > 0 ? <><Tag kind="bad">Out {w.inj} wk</Tag> </> : null}
    {p.champ ? <><Tag kind="gold">Champion</Tag> </> : null}
    {w.nw ? <><Tag>{(w.roles || ['staff'])[0].replace('_', ' ')}</Tag> </> : null}
    {w.retiring ? <><Tag kind="bad">Retiring</Tag> </> : null}
    {w.team != null ? <><Tag>Team</Tag> </> : null}
    {w.stable != null ? <><Tag kind="warn">Stable</Tag> </> : null}
    {E.feudsFor(G.S, w.id).length ? <Tag kind="heel">Feud</Tag> : null}
  </>;
}

export function Roster() {
  const S = G.S, P = me(), st = rs(), f = st.rf, q = f.q.toLowerCase(), sel = selected();
  const R: W[] = E.rosterOf(S, P.id), push = E.pushMap(S, P.id);
  const L = R.filter(w => (f.brand === 'all' || w.brand === f.brand) && (f.g === 'all' || w.g === f.g) && (f.al === 'all' || w.align === f.al) && (!q || w.name.toLowerCase().indexOf(q) >= 0));
  const k = st.rs.k, d = st.rs.d, val = (w: W) => k === 'name' ? w.name : (k === 'work' ? E.workRate(w) : w[k]);
  L.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * d || b.ovr - a.ovr; });
  return <>
    <RosterHead title="Roster" />
    {sel && <Profile w={sel} />}
    <Filters shown={L.length} of={R.length} />
    <div class="tw"><table>
      <thead><tr>
        <Th k="name" label="Name" />{P.brands && <Th k="brand" label="Brand" />}<Th k="align" label="Side" /><th>Push</th>
        <Th k="age" label="Age" r /><Th k="ovr" label="Over" r /><Th k="work" label="Work" r /><Th k="mic" label="Promo" r /><Th k="mom" label="Mom." r /><Th k="cond" label="Cond." r /><Th k="morale" label="Morale" r /><Th k="wage" label="Wage/wk" r /><Th k="con" label="Weeks" r />
        <th>Status</th>
      </tr></thead>
      <tbody>
        {L.map(w => <tr key={w.id} class={'pick' + (sel && sel.id === w.id ? ' on' : '')} data-home={!sel && st.last === w.id ? '' : undefined} onClick={() => pick(w.id)} {...dataAttrs('sel', { id: w.id })}>
          <td><span class="nm">{w.name}</span></td>
          {P.brands && <td>{brandName(P, w.brand)}</td>}
          <td><Side w={w} /></td><td>{push[w.id]}</td>
          <td class="r num">{w.age}</td><td class="r num">{Math.round(w.ovr)}</td><td class="r num">{E.workRate(w)}</td><td class="r num">{w.mic}</td>
          <td class="r num">{(w.mom > 0 ? '+' : '') + Math.round(w.mom)}</td><td class="r num">{Math.round(w.cond)}</td><td class="r num">{Math.round(w.morale)}</td>
          <td class="r num">{cash(w.wage)}</td><td class="r num">{Math.max(0, w.con)}</td>
          <td><Status w={w} champ={champOf(P, w.id).length > 0} /></td>
        </tr>)}
        {!L.length && <tr><td colSpan={14} class="muted">Nobody matches those filters.</td></tr>}
      </tbody>
    </table></div>
  </>;
}
