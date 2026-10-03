/* World Editor: belts, tag teams, stables and who gets on with whom. */
import { E } from '../../engine';
import { Btn, Panel, Sel, Field, Opt, BeltArt } from '../../kit';
import { es, world, edit, look, note } from './state';
import { TextF, NameF, NumF, SelF, PickList, DelBtn, TwoPane, opts } from './parts';
import { companyOpts } from './Companies';

/** The wrestlers under contract to a company, biggest names first. */
function roster(pkg: any, pid: string, g?: string): any[] {
  const home = E.edInfo(pkg).home;
  return pkg.workers.filter((w: any) => home[w.id] === pid && (!g || w.gender === g) && (!w.roles || !w.roles.length || w.roles.indexOf('wrestler') >= 0))
    .sort((a: any, b: any) => ((b.ratings && b.ratings.overness) || 0) - ((a.ratings && a.ratings.overness) || 0));
}
const people = (list: any[], none: string): Opt[] => [['', none] as Opt].concat(list.map(w => [w.id, w.ring_name] as Opt));
function pidFor(pkg: any, key: string): string | null { const st = es(), v = st.sel[key]; return v && pkg.promotions.some((x: any) => x.id === v) ? v : (pkg.promotions[0] ? pkg.promotions[0].id : null); }

export function BeltsTab() {
  const st = es(), pkg = world(), pid = pidFor(pkg, 'beltsFor'), pn: Record<string, string> = {}; pkg.promotions.forEach((x: any) => { pn[x.id] = x.name; });
  const t = pkg.titles.find((x: any) => x.id === st.sel.belts) || null;
  const list = pkg.promotions.length ? <>
    <div class="row mb2"><Field label="Company"><Sel t="ed-belts-for" value={pid} options={companyOpts(pkg)} onChange={v => look(() => { st.sel.beltsFor = v; st.sel.belts = null; })} /></Field>
      <Btn kind="go" t="ed-add-belt" onClick={() => edit(() => { const n = E.edAddTitle(pkg, pid, { name: 'New title' }); st.sel.belts = n.id; })}>Add a belt</Btn></div>
    <PickList t="ed-pick" sel={st.sel.belts} onPick={id => { st.sel.belts = id; }} empty="This company has no belts yet."
      items={pkg.titles.filter((x: any) => x.promotion_id === pid).sort((a: any, b: any) => b.level - a.level).map((x: any) => ({ id: x.id, label: x.name, sub: (x.gender === 'F' ? 'Women' : 'Men') + ' · ' + (E.ED.levels[x.level] || 'Title') + (x.tag ? ' · Tag team' : '') + ((x.holder_ids || []).length ? '' : ' · Vacant') }))} />
  </> : <p class="empty">Add a company first.</p>;
  if (!t) return <TwoPane open={false} list={list} onBack={() => { }}><p class="empty">Pick a belt on the left, or add one.</p></TwoPane>;
  const ros = roster(pkg, t.promotion_id, t.gender), hold: string[] = t.holder_ids || [], slots = t.tag ? [0, 1] : [0];
  const setHolder = (i: number, v: string) => edit(() => { const h = slots.map(k => (k === i ? v : hold[k] || '')).filter((x, k, a) => x && a.indexOf(x) === k); t.holder_ids = h; });
  return <TwoPane open list={list} onBack={() => { st.sel.belts = null; }}>
    <Panel cls="mb4" title={t.name || 'Belt'}>
      <div class="edbelt"><BeltArt name={t.name || 'Title'} top={pn[t.promotion_id] || ''} /></div>
      <div class="editor plain">
        <NameF label="Name of the belt" table="titles" rec={t} max={40} t="ed-belt-name" />
        <Field label="Company"><Sel t="ed-belt-co" value={t.promotion_id} options={companyOpts(pkg)} onChange={v => edit(() => { t.promotion_id = v; t.holder_ids = []; st.sel.beltsFor = v; })} /></Field>
        <Field label="Division"><Sel t="ed-belt-g" value={t.gender} options={[['M', 'Men'], ['F', 'Women']]} onChange={v => edit(() => { t.gender = v; t.holder_ids = []; })} /></Field>
        <SelF label="How big a prize" rec={t} k="level" num options={[[3, 'Top title'], [2, 'Second title'], [1, 'Third title']]} />
        <Field label="Who fights for it"><Sel t="ed-belt-tag" value={t.tag ? '1' : ''} options={[['', 'One wrestler'], ['1', 'A tag team']]} onChange={v => edit(() => { t.tag = v === '1'; t.holder_ids = []; })} /></Field>
      </div>
    </Panel>
    <Panel cls="mb4" title={t.tag ? 'The champions' : 'The champion'}>
      <div class="editor plain">{slots.map(i => <Field key={i} label={t.tag ? 'Champion ' + (i + 1) : 'Champion'}><Sel t="ed-holder" d={{ v: i }} value={hold[i] || ''} options={people(ros, 'Vacant')} onChange={v => setHolder(i, v)} /></Field>)}</div>
      <p class="muted mt2">{ros.length ? 'Only ' + (t.gender === 'F' ? 'women' : 'men') + ' under contract to this company are listed. Leave it vacant and the first champion is crowned in the game.' : 'Nobody in this division is under contract here yet, so the belt starts vacant.'}</p>
    </Panel>
    <div class="row mb4"><DelBtn id={'belt:' + t.id} what={t.name} onDelete={() => { E.edRemove(pkg, 'titles', t.id); st.sel.belts = null; }} /></div>
  </TwoPane>;
}

export function TeamsTab() {
  const st = es(), pkg = world(), pid = pidFor(pkg, 'teamsFor'), wn: Record<string, string> = {}; pkg.workers.forEach((w: any) => { wn[w.id] = w.ring_name; });
  const t = pkg.teams.find((x: any) => x.id === st.sel.teams) || null, addT = (kind: string) => edit(() => { const n = E.edAddTeam(pkg, pid, kind); st.sel.teams = n.id; });
  const list = pkg.promotions.length ? <>
    <div class="row mb2"><Field label="Company"><Sel t="ed-teams-for" value={pid} options={companyOpts(pkg)} onChange={v => look(() => { st.sel.teamsFor = v; st.sel.teams = null; })} /></Field></div>
    <div class="row mb2"><Btn kind="go" t="ed-add-team" onClick={() => addT('tag')}>Add a tag team</Btn><Btn t="ed-add-stable" onClick={() => addT('stable')}>Add a stable</Btn></div>
    <PickList t="ed-pick" sel={st.sel.teams} onPick={id => { st.sel.teams = id; }} empty="This company has no teams or stables yet."
      items={pkg.teams.filter((x: any) => x.promotion_id === pid).map((x: any) => ({ id: x.id, label: x.name, sub: (x.kind === 'stable' ? 'Stable' : 'Tag team') + ' · ' + (x.member_ids || []).length + ' members', bad: (x.kind || 'tag') === 'tag' && (x.member_ids || []).length !== 2 }))} />
  </> : <p class="empty">Add a company first.</p>;
  const form = () => {
    const stable = t.kind === 'stable', ros = roster(pkg, t.promotion_id), mem: string[] = t.member_ids || (t.member_ids = []), free = ros.filter(w => mem.indexOf(w.id) < 0);
    const setM = (i: number, v: string) => edit(() => { const a = [mem[0] || '', mem[1] || '']; a[i] = v; t.member_ids = a.filter((x, k, arr) => x && arr.indexOf(x) === k); });
    return <>
      <Panel cls="mb4" title={t.name || 'Team'}>
        <div class="editor plain">
          <NameF label={stable ? 'Name of the stable' : 'Name of the team'} table="teams" rec={t} max={40} t="ed-team-name" />
          {stable ? null : <NumF label="Experience together (0 to 100)" rec={t} k="experience" min={0} max={100} blank="the game decides" />}
          {stable ? null : <TextF label="Team finishing move" rec={t} k="finisher" max={32} />}
        </div>
      </Panel>
      <Panel cls="mb4" title="Members">
        {stable ? <>
          {mem.length ? <ul class="list">{mem.map(id => <li key={id}><span>{wn[id] || id}{t.leader_id === id ? <span class="hl"> {'·'} Leader</span> : null}</span><span class="row opts">
            {t.leader_id === id ? null : <Btn kind="sm" t="ed-leader" d={{ id }} onClick={() => edit(() => { t.leader_id = id; })}>Make leader</Btn>}
            <Btn kind="sm" t="ed-member-out" d={{ id }} onClick={() => edit(() => { t.member_ids = mem.filter(x => x !== id); if (t.leader_id === id) delete t.leader_id; })}>Remove</Btn></span></li>)}</ul> : <p class="empty">Nobody in it yet.</p>}
          <div class="row mt2"><Field label="Add a member"><Sel t="ed-member-in" value="" options={people(free, free.length ? 'Pick someone' : 'Nobody left to add')} onChange={v => { if (v) edit(() => { t.member_ids = mem.concat([v]); }); }} /></Field></div>
        </> : <div class="editor plain">{[0, 1].map(i => <Field key={i} label={'Partner ' + (i + 1)}><Sel t="ed-member" d={{ v: i }} value={mem[i] || ''} options={people(ros.filter(w => w.id === mem[i] || mem.indexOf(w.id) < 0), 'Pick someone')} onChange={v => setM(i, v)} /></Field>)}</div>}
        <p class="muted mt2">{ros.length ? 'Only wrestlers under contract to this company are listed.' : 'Nobody is under contract to this company yet. Sign wrestlers first.'}</p>
      </Panel>
      <div class="row mb4"><DelBtn id={'team:' + t.id} what={t.name} onDelete={() => { E.edRemove(pkg, 'teams', t.id); st.sel.teams = null; }} /></div>
    </>;
  };
  return <>
    <TwoPane open={!!t} list={list} onBack={() => { st.sel.teams = null; }}>{t ? form() : <p class="empty">Pick a team on the left, or add one.</p>}</TwoPane>
    <Bonds wn={wn} />
  </>;
}

/** Friendships, rivalries and family ties between any two people in the world. */
function Bonds(p: { wn: Record<string, string> }) {
  const st = es(), pkg = world(), all: Opt[] = people(pkg.workers.slice().sort((a: any, b: any) => String(a.ring_name).localeCompare(String(b.ring_name))), 'Pick someone');
  const a = st.sel.bondA || '', b = st.sel.bondB || '', type = st.sel.bondT || 'rivalry';
  const add = () => edit(() => { E.edAddRel(pkg, a, b, type); st.sel.bondA = null; st.sel.bondB = null; note(p.wn[a] + ' and ' + p.wn[b] + ': ' + E.ED.rels[type].toLowerCase() + '.'); });
  return <Panel cls="mb4" title="Friends, rivals and family">
    <div class="editor plain">
      <Field label="This person"><Sel t="ed-bond-a" value={a} options={all} onChange={v => look(() => { st.sel.bondA = v; })} /></Field>
      <Field label="And this person"><Sel t="ed-bond-b" value={b} options={all} onChange={v => look(() => { st.sel.bondB = v; })} /></Field>
      <Field label="Are"><Sel t="ed-bond-t" value={type} options={opts(E.ED.rels)} onChange={v => look(() => { st.sel.bondT = v; })} /></Field>
    </div>
    <div class="row mt2"><Btn t="ed-add-bond" disabled={!a || !b || a === b} onClick={add}>Add this tie</Btn></div>
    {pkg.relationships.length ? <ul class="list mt2">{pkg.relationships.slice(0, 80).map((r: any, i: number) => <li key={i}><span><b>{p.wn[r.a] || r.a}</b> and <b>{p.wn[r.b] || r.b}</b> <span class="muted">{'·'} {E.ED.rels[r.type] || r.type}</span></span>
      <Btn kind="sm" t="ed-bond-out" d={{ v: i }} onClick={() => edit(() => { E.edRemove(pkg, 'relationships', i); })}>Remove</Btn></li>)}</ul> : <p class="muted mt2">No ties yet. They change chemistry in the ring and trouble backstage.</p>}
    {pkg.relationships.length > 80 ? <p class="muted">Showing 80 of {pkg.relationships.length}.</p> : null}
  </Panel>;
}
