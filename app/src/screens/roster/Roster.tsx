/* The Roster page as a desktop of windows: the list on the left, the picked file on the right, four sums along
   the bottom, and the full profile one press away. */
import { E, W } from '../../engine';
import { G, me, cash, view, act, openModal } from '../../store';
import { Ovr } from '../../shared/ovr';
import { LevelLine } from './Attrs';
import { Head, Sel, TextBox, Tag, Side, Opt, Meter, Btn, Portrait, champOf, brandName, dataAttrs, showResult } from '../../kit';
import { ScenePlayer } from '../../kit/sceneplayer';
import { WAIST } from '../../kit/scene';
import { recipeOf } from '../../kit/puppet';
import { Desktop, Win, Group, Line } from '../../kit';
import { rs, selected } from './state';
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
    <Btn kind="sm" t="staff-open" onClick={() => openModal({ kind: 'staff' })}>Staff</Btn>
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
  // the two that matter most, shortest words first: the column is narrow on a Steam Deck. The file says the rest.
  const w = p.w, L: [string, string][] = [];
  if (w.inj > 0) L.push(['bad', 'Out ' + w.inj + ' wk']);
  if (w.retiring) L.push(['bad', 'Retiring']);
  if (p.champ) L.push(['gold', 'Champ']);
  if (E.feudsFor(G.S, w.id).length) L.push(['heel', 'Feud']);
  if (w.chip >= G.S.week) L.push(['good', 'To prove']);
  if (w.camp) L.push(['warn', 'Camp']);
  if (w.nw) L.push(['', (w.roles || ['staff'])[0].replace('_', ' ')]);
  if (w.stable != null) L.push(['warn', 'Stable']);
  if (w.team != null) L.push(['', 'Team']);
  return <>{L.slice(0, 2).map(([k, s], i) => <span key={s} class={i ? "hold2" : undefined}><Tag kind={(k || undefined) as any}>{s}</Tag> </span>)}</>;
}

/** One line of the roster: the face, the name, where they stand and how they are. A press picks it; a press on
    the picked line opens the full profile. */
function Line_(p: { w: W; on: boolean; spot: string; champ: boolean; brand?: string }) {
  const w = p.w, st = rs();
  return <tr class={'pick' + (p.on ? ' on' : '')} data-home={st.sel == null && (st.last ?? st.peek) === w.id ? '' : undefined} onClick={() => view(() => { if (p.on) st.sel = w.id; st.peek = w.id; })} {...dataAttrs('sel', { id: w.id })}>
    <td class="pf"><Portrait w={w} /></td>
    <td><span class="nm">{w.name}</span></td>
    {p.brand != null && <td>{p.brand}</td>}
    <td><Side w={w} /></td><td>{p.spot}</td>
    <td class="r num">{w.age}</td>
    <td class="r"><Ovr w={w} /></td>
    <td><Meter v={w.ovr} n={5} /></td><td><Meter v={w.morale} n={5} kind={w.morale < 35 ? 'hot' : undefined} /></td><td><Meter v={w.cond} n={5} kind={w.cond < 50 ? 'hot' : undefined} /></td>
    <td class={'r num' + (w.dl !== 'show' && w.con <= 4 ? ' bad' : '')}>{w.dl === 'show' ? <span title="Per appearance: paid for each show they are on">Per show</span> : Math.max(0, w.con)}</td>
    <td class="stt"><div><Status w={w} champ={p.champ} /></div></td>
  </tr>;
}

/** The picked wrestler in short, as the right-hand window of the page. The full profile is one press away. */
/* the stand the picked wrestler is drawn on: one figure at the waist line, the camera a little above the ring */
const STAND = { v: 1 as const, id: 'rsw', name: 'The wrestler', when: 'any', set: 'ring', attire: 'primary_ring' as const, slots: [{ id: 'A', n: '', role: 'a' as const }],
  keys: [{ t: 0, figs: { A: { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} } }, props: [], cam: { x: 0, y: 0.15, z: 1.4 } }] } as any;
/* a word beside each bar, so two bars that look alike still say how far apart they are */
const lvlWord = (v: number) => v >= 88 ? 'one of the best' : v >= 78 ? 'main event' : v >= 68 ? 'upper card' : v >= 55 ? 'solid' : v >= 42 ? 'getting there' : 'raw';
const moodWord = (v: number) => v >= 75 ? 'happy' : v >= 55 ? 'steady' : v >= 35 ? 'low' : 'furious';
const bodyWord = (v: number) => v >= 85 ? 'fresh' : v >= 65 ? 'fine' : v >= 45 ? 'worn' : 'hurting';
function File(p: { w: W | null; spot: string }) {
  const S = G.S, P = me(), w = p.w;
  if (!w) return <Win title="Their file" area="file" t="roster-file"><p class="muted">Pick somebody on the list.</p></Win>;
  const feuds = E.feudsFor(S, w.id), titles = champOf(P, w.id);
  return <Win title={w.name} area="file" t="roster-file" right={titles.length ? '★' : undefined}>
    {/* rule 5c: the wrestler is always on show, full length, drawn by the diorama engine */}
    <div class="sc-stage rs-stage"><ScenePlayer key="rsw" sc={STAND} cast={{ A: recipeOf(w) }} play={'rs' + w.id + ':' + titles.length + JSON.stringify((w as any).look || null)} still orbit fill t="roster-stage" label={w.name + ' in ring gear. Drag to walk round them.'} /></div>
    <p class="big"><Ovr w={w} big /> <b>{w.name}</b> <Side w={w} /></p>
    <p>{p.spot} {'·'} age {w.age}</p>
    {!w.nw ? <LevelLine w={w} /> : null}
    {w.fin || titles.length ? <p class="muted">{w.fin ? 'Finisher: ' + w.fin : ''}{titles.length ? <> <Tag kind="gold">{titles.map((t: any) => t.name).join(', ')}</Tag></> : null}</p> : null}
    <Group title="In the ring">
      <Line label="Crowd"><Meter v={w.ovr} n={8} /> <span class="muted">{lvlWord(w.ovr)}</span></Line>
      <Line label="Work rate"><Meter v={E.workRate(w)} n={8} /> <span class="muted">{lvlWord(E.workRate(w))}</span></Line>
      <Line label="On the mic"><Meter v={w.mic} n={8} /> <span class="muted">{lvlWord(w.mic)}</span></Line>
    </Group>
    <Group title="Right now">
      <Line label="Mood"><Meter v={w.morale} n={8} kind={w.morale < 35 ? 'hot' : undefined} /> <span class="muted">{moodWord(w.morale)}</span></Line>
      <Line label="Body"><Meter v={w.cond} n={8} kind={w.cond < 50 ? 'hot' : undefined} /> <span class="muted">{bodyWord(w.cond)}</span>{w.inj > 0 ? <> <Tag kind="bad">Out {w.inj} wk</Tag></> : null}</Line>
      <Line label="Story">{feuds.length ? feuds.map((f: any) => S.w[f.a === w.id ? f.b : f.a].name).join(', ') : <span class="muted">None</span>}</Line>
    </Group>
    <Group title="The deal">
      {(() => { const c = E.contractOf(S, w); return c ? <><Line label="Contract">{c.n}</Line><Line label="Pay"><span class={c.ct === 'year' && w.con <= 4 ? 'bad' : undefined} title={c.line}>{c.ct === 'show' ? cash(c.pay) + ' a show' : cash(c.pay) + ' a week, ' + Math.max(0, w.con) + ' weeks left'}</span></Line></> : null; })()}
    </Group>
    <div class="row mt1">{!w.nw ? <Btn kind="go" t="roster-attrs" d={{ id: w.id }} onClick={() => openModal({ kind: 'attrs', id: w.id })}>Attributes</Btn> : null}
      <Btn t="roster-full" d={{ id: w.id }} onClick={() => view(() => { const st = rs(); st.peek = w.id; st.sel = w.id; })}>Full profile</Btn>
      <Btn t="roster-caw" d={{ id: w.id }} onClick={() => openModal({ kind: 'player', id: w.id })}>{w.nw ? 'Edit look' : 'Edit wrestler'}</Btn>
      {w.nw ? (w.wasW ? <Btn t="roster-back" d={{ id: w.id }} onClick={() => { const r = act(() => E.fromStaff(G.S, w.id)); showResult('Back to wrestling', r.msg, !r.ok); }}>Wrestle again</Btn> : null)
        : <Btn t="roster-tostaff" d={{ id: w.id }} onClick={() => openModal({ kind: 'tostaff', id: w.id })}>Move to staff</Btn>}</div>
  </Win>;
}

/** The four small windows along the bottom: wages, mood, bodies and deals across the roster. */
function Sums(p: { R: W[] }) {
  const S = G.S, R = p.R, n = R.length || 1, wages = R.reduce((a, w) => a + (w.wage || 0), 0), bud = E.budget(S);
  const mood = Math.round(R.reduce((a, w) => a + w.morale, 0) / n), low = R.filter(w => w.morale < 35).length, high = R.filter(w => w.morale >= 70).length;
  const hurt = R.filter(w => w.inj > 0).length, worn = R.filter(w => !(w.inj > 0) && w.cond < 50).length;
  const soon = R.filter(w => w.con <= 4).length, year = R.filter(w => w.con <= 48).length;
  return <>
    <Win title="Wages" area="wages" t="roster-wages"><p class="big"><b>{cash(wages)}</b></p><p class="muted">a week{isFinite(bud) ? ', ' + Math.round(wages / bud * 100) + '% of the budget' : ''}</p></Win>
    <Win title="Mood" area="mood" t="roster-mood"><p><Meter v={mood} n={8} /></p><p class="muted">{low} unhappy, {high} happy</p></Win>
    <Win title="Bodies" area="bodies" t="roster-bodies" tone={hurt ? 'hot' : undefined}><p><b>{hurt}</b> hurt</p><p class="muted">{worn} worn down</p></Win>
    <Win title="Deals" area="deals" t="roster-deals" tone={soon ? 'hot' : undefined}><p><b>{soon}</b> end this month</p><p class="muted">{year} this year</p></Win>
  </>;
}

export function Roster() {
  const S = G.S, P = me(), st = rs(), f = st.rf, q = f.q.toLowerCase(), sel = selected();
  const R: W[] = E.rosterOf(S, P.id), push = { ...E.pushMap(S, P.id) };
  E.staffList(S).forEach((x: any) => { push[x.id] = x.role; });
  const L = R.filter(w => (f.brand === 'all' || w.brand === f.brand) && (f.g === 'all' || w.g === f.g) && (f.al === 'all' || w.align === f.al) && (!q || w.name.toLowerCase().indexOf(q) >= 0));
  const k = st.rs.k, d = st.rs.d, val = (w: W) => k === 'name' ? w.name : (k === 'work' ? E.workRate(w) : (k === 'all' ? E.overallOf(w) : w[k]));
  L.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * d || E.overallOf(b) - E.overallOf(a); });
  // the whole list, in a window that scrolls inside itself (Ryan, 20 October: "I don't want rosters and stuff like that on pages, I want it scrollable")
  const shown = L;
  const pk = st.peek != null ? L.find(w => w.id === st.peek) : null, focus = pk || sel || (shown.length ? shown[0] : null);
  return <div class="onescreen"><Desktop cls="rspage" t="roster">
    <Win title={'Roster: ' + R.length + ' under contract'} area="list" t="roster-list">
      <Filters shown={L.length} of={R.length} />
      <div class="lb rsl scroll"><table>
        <thead><tr>
          <th aria-label="Face" /><Th k="name" label="Name" />{P.brands && <Th k="brand" label="Brand" />}<Th k="align" label="Side" /><th>Spot</th>
          <Th k="age" label="Age" r /><Th k="all" label="Overall" r /><Th k="ovr" label="Crowd" /><Th k="morale" label="Mood" /><Th k="cond" label="Body" /><Th k="con" label="Deal" r /><th>Holds</th>
        </tr></thead>
        <tbody>
          {shown.map(w => <Line_ key={w.id} w={w} on={!!focus && focus.id === w.id} spot={push[w.id]} champ={champOf(P, w.id).length > 0} brand={P.brands ? brandName(P, w.brand) : undefined} />)}
          {!L.length && <tr><td colSpan={12} class="muted">Nobody matches those filters.</td></tr>}
        </tbody>
      </table></div>
    </Win>
    <File w={focus} spot={focus ? push[focus.id] : ''} />
    <Sums R={R} />
    {sel ? <div class="rsfull" role="dialog" aria-label={'Profile of ' + sel.name}><div class="rsfull-in"><Profile w={sel} /></div></div> : null}
  </Desktop></div>;
}
