/* World Editor: wrestlers and other people. Who they are, what they can do, how they look, and who they work for. */
import { E } from '../../engine';
import { Btn, Panel, Sel, Field, Opt, FaceCanvas, dataAttrs } from '../../kit';
import { derive, NAMES, Face, FaceKey } from '../../lib/portrait';
import { es, world, edit, look, note } from './state';
import { TextF, NameF, NumF, SelF, Rating, PickList, DelBtn, TwoPane, opts } from './parts';

const PARTS: [FaceKey, string][] = [['h', 'Head'], ['hr', 'Hair'], ['fh', 'Facial hair'], ['ms', 'Mustache'], ['ey', 'Eyes'], ['ns', 'Nose']];
const SHOWN = 60;
const faceOf = (w: any): Face => Object.assign(derive(w.ring_name || w.id, w.gender, w.age || 28), w.face || {});

function Looks(p: { w: any }) {
  const w = p.w, f = faceOf(w), set = (k: string, v: number) => edit(() => { w.face = Object.assign(faceOf(w), { [k]: v }); });
  return <Panel cls="mb4" title="How they look">
    <div class="edface">
      <FaceCanvas cls="pt" face={f} g={w.gender} bg={w.disposition === 'heel' ? 'H' : (w.disposition === 'tweener' ? 'N' : 'F')} label={'Portrait of ' + w.ring_name} />
      <div class="edparts">{PARTS.map(x => <div class="edpart" key={x[0]}>
        <Btn kind="sm" t="ed-face" d={{ k: x[0], v: -1 }} label={'Previous ' + x[1]} onClick={() => set(x[0], (f[x[0]] + 9) % 10)}>{'◄'}</Btn>
        <span><small>{x[1]}</small> {NAMES[x[0]][f[x[0]]]}</span>
        <Btn kind="sm" t="ed-face" d={{ k: x[0], v: 1 }} label={'Next ' + x[1]} onClick={() => set(x[0], (f[x[0]] + 1) % 10)}>{'►'}</Btn></div>)}</div>
    </div>
    <div class="editor plain">
      <Field label="Skin tone"><input type="range" min={0} max={100} value={f.sk} {...dataAttrs('ed-face-sl', { k: 'sk' })} onInput={e => set('sk', +(e.currentTarget as HTMLInputElement).value)} /></Field>
      <Field label="Hair colour"><input type="range" min={0} max={100} value={f.hc} {...dataAttrs('ed-face-sl', { k: 'hc' })} onInput={e => set('hc', +(e.currentTarget as HTMLInputElement).value)} /></Field>
    </div>
    <div class="row mt2"><Btn kind="sm" t="ed-face-rnd" onClick={() => edit(() => { w.face = derive('ed' + Math.random(), w.gender, w.age || 28); })}>Random face</Btn>
      {w.face ? <Btn kind="sm" t="ed-face-auto" onClick={() => edit(() => { delete w.face; })}>Let the game draw it from the name</Btn> : null}</div>
  </Panel>;
}

function Form(p: { w: any }) {
  const st = es(), pkg = world(), w = p.w; if (!w.ratings) w.ratings = {};
  const con = E.edContract(pkg, w.id), roles: string[] = w.roles && w.roles.length ? w.roles : ['wrestler'];
  const companies: Opt[] = [['', 'Free agent (no contract)'] as Opt].concat(pkg.promotions.map((x: any) => [x.id, x.name] as Opt));
  const role = (r: string) => edit(() => { const has = roles.indexOf(r) >= 0, next = has ? roles.filter(x => x !== r) : roles.concat([r]); w.roles = next.length ? next : ['wrestler']; });
  return <>
    <Panel cls="mb4" title={w.ring_name || 'Wrestler'}>
      <div class="editor plain">
        <NameF label="Ring name" table="workers" rec={w} max={32} t="ed-wrname" />
        <SelF label="Division" rec={w} k="gender" options={[['M', 'Men'], ['F', 'Women']]} />
        <NumF label="Age" rec={w} k="age" min={16} max={75} blank="unknown" />
        <SelF label="Side" rec={w} k="disposition" options={opts(E.ED.sides)} />
        <SelF label="Style" rec={w} k="style" options={opts(E.ED.styles)} />
        <TextF label="Finishing move" rec={w} k="finisher" max={32} />
        <TextF label="Home town" rec={w} k="hometown" max={32} />
        <SelF label="Weight" rec={w} k="weight_class" options={[['', 'Not set'] as Opt].concat(opts(E.ED.weights))} none />
        <SelF label="In the locker room" rec={w} k="locker_role" options={[['', 'Nobody in particular'] as Opt].concat(opts(E.ED.lockers))} none />
      </div>
      <p class="eyebrow mt2">What they do</p>
      <div class="row opts">{Object.keys(E.ED.roles).map(r => <Btn kind="sm" key={r} on={roles.indexOf(r) >= 0} t="ed-role" d={{ v: r }} onClick={() => role(r)}>{E.ED.roles[r]}</Btn>)}</div>
    </Panel>
    <Panel cls="mb4" title="Who they work for">
      <div class="editor plain">
        <Field label="Company"><Sel t="ed-sign" value={con ? con.promotion_id : ''} options={companies} onChange={v => edit(() => { E.edSign(pkg, w.id, v || null, con ? con.push_level : undefined); })} /></Field>
        {con ? <SelF label="Place on the card" rec={con} k="push_level" options={opts(E.ED.push)} /> : null}
        {con ? <NumF label="Weeks left on the contract" rec={con} k="weeks_left" min={1} max={520} blank="the game decides" /> : null}
      </div>
      {con ? null : <p class="muted mt2">An unsigned wrestler starts the game as a free agent any company can sign.</p>}
    </Panel>
    <Panel cls="mb4" title="What they can do">
      <div class="edrates">{E.ED.ratings.map((r: any) => <Rating key={r[0]} label={r[1]} obj={w.ratings} k={r[0]} opt={!r[2]} />)}</div>
      <p class="muted mt2">Overness is how much the crowd cares. The ones marked auto are worked out from the rest unless you set them.</p>
    </Panel>
    <Looks w={w} />
    <div class="row mb4"><DelBtn id={'worker:' + w.id} what={w.ring_name} onDelete={() => { E.edRemove(pkg, 'workers', w.id); st.sel.wrestlers = null; note(w.ring_name + ' has been removed from the world.'); }} /></div>
  </>;
}

export function WrestlersTab() {
  const st = es(), pkg = world(), info = E.edInfo(pkg), q = st.q.trim().toLowerCase();
  const pname: Record<string, string> = {}; pkg.promotions.forEach((x: any) => { pname[x.id] = x.name; });
  const all: any[] = pkg.workers.filter((w: any) => (st.fp === '' || (st.fp === 'FA' ? !info.home[w.id] : info.home[w.id] === st.fp)) && (!q || String(w.ring_name).toLowerCase().indexOf(q) >= 0));
  all.sort((a, b) => ((b.ratings && b.ratings.overness) || 0) - ((a.ratings && a.ratings.overness) || 0));
  const w = pkg.workers.find((x: any) => x.id === st.sel.wrestlers) || null;
  const add = () => edit(() => { const pid = st.fp && st.fp !== 'FA' ? st.fp : null, n = E.edAddWorker(pkg, { ring_name: 'New wrestler', promotion_id: pid }); st.sel.wrestlers = n.id; st.q = ''; });
  const list = <>
    <div class="row mb2"><Btn kind="go" t="ed-add-wrestler" onClick={add}>Add a wrestler</Btn></div>
    <div class="row mb2">
      <input type="search" id="ed-q" data-t="ed-q" value={st.q} placeholder="Search by name" aria-label="Search by name" onInput={e => look(() => { st.q = (e.currentTarget as HTMLInputElement).value; })} />
      <Sel t="ed-fp" label="Company" value={st.fp} options={[['', 'Everyone'], ['FA', 'Free agents']].concat(pkg.promotions.map((x: any) => [x.id, x.name])) as Opt[]} onChange={v => look(() => { st.fp = v; })} />
    </div>
    <PickList t="ed-pick" sel={st.sel.wrestlers} onPick={id => { st.sel.wrestlers = id; }} empty={pkg.workers.length ? 'Nobody matches.' : 'No wrestlers yet. Add one, or fill a roster from the Companies tab.'}
      more={all.length > SHOWN ? 'Showing ' + SHOWN + ' of ' + all.length + '. Search or pick a company to narrow it.' : all.length + (all.length === 1 ? ' person.' : ' people.')}
      items={all.slice(0, SHOWN).map(x => ({ id: x.id, label: x.ring_name, sub: (pname[info.home[x.id]] || 'Free agent') + ' · Over ' + ((x.ratings && x.ratings.overness) || 0) }))} />
  </>;
  return <TwoPane open={!!w} list={list} onBack={() => { st.sel.wrestlers = null; }}>{w ? <Form w={w} /> : <p class="empty">Pick someone on the left, or add a wrestler.</p>}</TwoPane>;
}
