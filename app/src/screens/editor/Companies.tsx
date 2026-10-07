/* World Editor: companies, their weekly shows, and the big events of the year. */
import { E } from '../../engine';
import { Btn, Panel, Sel, Field, Opt, Logo, dataAttrs } from '../../kit';
import { openLogoMaker } from '../../shared/logomaker';
import { ModelCard } from '../../shared/model';
import { es, world, edit, look, note } from './state';
import { TextF, NameF, NumF, SelF, PickList, DelBtn, TwoPane } from './parts';

const names = (t: Record<string, any>): Opt[] => Object.keys(t).map(k => [k, t[k].n] as Opt);
export const companyOpts = (pkg: any): Opt[] => pkg.promotions.map((p: any) => [p.id, p.name + (p.full_name ? ' - ' + p.full_name : '')] as Opt);

export function CompaniesTab() {
  const st = es(), pkg = world(), info = E.edInfo(pkg), p = pkg.promotions.find((x: any) => x.id === st.sel.companies) || null;
  const add = () => edit(() => { const n = E.edAddPromo(pkg, { name: 'NEW' + (pkg.promotions.length + 1), full_name: 'New Wrestling Company', popularity: 50 }); st.sel.companies = n.id; });
  const list = <>
    <div class="row mb2"><Btn kind="go" t="ed-add-company" onClick={add}>Add a company</Btn></div>
    <PickList t="ed-pick" sel={st.sel.companies} onPick={id => { st.sel.companies = id; }} empty="No companies yet. A world needs at least two."
      items={pkg.promotions.map((x: any) => { const c = info.per[x.id]; return { id: x.id, label: x.name, sub: 'Pop ' + x.popularity + ' · ' + c.roster + ' wrestlers', bad: c.roster < 6 || !c.shows }; })} />
  </>;
  if (!p) return <TwoPane open={false} list={list} onBack={() => { }}><p class="empty">Pick a company on the left, or add one.</p></TwoPane>;
  const c = info.per[p.id], own = p.owner || (p.owner = {}), months: Opt[] = E.MONTHS.map((n: string, i: number) => [i + 1, n] as Opt);
  const fill = () => edit(() => { const made = E.edFill(pkg, p.id, st.fill, Date.now()); note(made.length + ' unknowns signed to ' + p.name + '. Rename them on the Wrestlers tab.'); });
  return <TwoPane open list={list} onBack={() => { st.sel.companies = null; }}>
    <Panel cls="mb4" title={p.name || 'Company'}>
      <div class="editor plain">
        <NameF label="Initials or short name" table="promotions" rec={p} max={12} t="ed-cname" />
        <TextF label="Full name" rec={p} k="full_name" max={48} />
        <NumF label="Popularity (5 to 100)" rec={p} k="popularity" min={5} max={100} />
      </div>
      <div class="editor plain"><TextF label="About it" rec={p} k="blurb" max={200} ph="One or two lines for the company list" /></div>
      <p class="muted mt2">Popularity sets the size of everything: crowds, television money, wages. 90 is a giant, 50 a regional company, 20 a local one.</p>
    </Panel>
    <Panel cls="mb4" title="The logo">
      <div class="row top"><Logo of={p} t="ed-logo" /><div>
        <p>{p.logo ? 'A logo of its own.' : 'The logo its model gives it, made from its letters.'} <Logo of={p} size="chip" /></p>
        <div class="row mt1"><Btn kind="go" t="ed-logo-open" onClick={() => openLogoMaker({ name: p.name, model: p.model || 'classic', logo: E.logoOf(p), list: pkg.promotions, self: p.id,
          onSave: m => { const r = E.edSetLogo(pkg, p.id, m); if (r.ok) edit(() => { note(r.msg); }); return r; } })}>Change the logo</Btn>
          {p.logo ? <Btn kind="sm" t="ed-logo-reset" onClick={() => edit(() => { note(E.edSetLogo(pkg, p.id, null).msg); })}>Back to the model’s own</Btn> : null}</div>
      </div></div>
      <p class="muted mt2">Every company has its own icon, built from its initials. It shows beside the company’s name everywhere in the game.</p>
    </Panel>
    <Panel cls="mb4" title="How it is run">
      <div class="editor plain"><SelF label="Company model" rec={p} k="model" options={names(E.MODELS)} t="ed-model" /></div>
      <div class="mt1"><ModelCard id={p.model} short /></div>
    </Panel>
    <Panel cls="mb4" title="The owner">
      <div class="editor plain">
        <TextF label="Owner's name" rec={own} k="name" max={32} ph="The owner" />
        <SelF label="House style" rec={own} k="style" options={names(E.STYLES)} />
        <SelF label="What the crowd expects" rec={own} k="roots" options={names(E.ROOTS)} />
        <SelF label="Promise to the locker room" rec={own} k="pledge" options={names(E.PLEDGE)} />
      </div>
    </Panel>
    <Panel cls="mb4" title="Money and calendar">
      <div class="editor plain">
        <NumF label="Cash at the start ($)" rec={p} k="cash" min={0} max={2000000000} step={100000} blank="worked out" />
        <NumF label="Owner's weekly target ($)" rec={p} k="target_weekly_net" min={-5000000} max={20000000} step={10000} blank="worked out" />
        <SelF label="Month of the flagship event" rec={p} k="flagship_month" options={[['', 'April (the usual)'] as Opt].concat(months)} num none />
      </div>
      <div class="editor plain"><Field label="Cities it runs in (commas between them)"><input type="text" {...dataAttrs('ed-cities')} value={(p.cities || []).join(', ')} maxLength={300} placeholder="Chicago, Boston, Memphis"
        onInput={e => { const v = (e.currentTarget as HTMLInputElement).value; edit(() => { p.cities = v.split(',').map(x => x.trim()).filter(Boolean); }); }} /></Field></div>
      <p class="muted mt2">Leave the money boxes empty and the game works them out from popularity.</p>
    </Panel>
    <Panel cls="mb4" title="The roster">
      <p>{c.roster} {c.roster === 1 ? 'wrestler' : 'wrestlers'} under contract ({c.men} men, {c.women} women), {c.titles} {c.titles === 1 ? 'belt' : 'belts'}, {c.shows} weekly {c.shows === 1 ? 'show' : 'shows'}.
        {c.roster < 6 ? <span class="bad"> A company needs at least six wrestlers.</span> : (c.roster < 12 ? <span class="hl"> Twelve or more makes a full card.</span> : null)}</p>
      <div class="row mt2"><Field label="How many"><Sel t="ed-fill-n" value={st.fill} options={[6, 12, 18, 24, 36].map(n => [n, n + ' unknowns'] as Opt)} onChange={v => look(() => { st.fill = +v; })} /></Field>
        <Btn t="ed-fill" onClick={fill}>Fill the roster with unknowns</Btn>
        <Btn kind="sm" t="ed-see-roster" onClick={() => look(() => { st.tab = 'wrestlers'; st.fp = p.id; st.q = ''; st.sel.wrestlers = null; window.scrollTo(0, 0); })}>See its wrestlers</Btn></div>
      <p class="muted mt2">Unknowns are made-up names with ratings that suit a company this size. A quick way to make a world playable, then replace them with your own.</p>
    </Panel>
    <div class="row mb4"><DelBtn id={'promo:' + p.id} what={p.name} onDelete={() => { E.edRemove(pkg, 'promotions', p.id); st.sel.companies = null; note(p.name + ' is gone, with its shows, belts and contracts. Its wrestlers are now unsigned.'); }} /></div>
  </TwoPane>;
}

const SIZES: [number, string][] = [[1, 'The main show'], [0.7, 'A second show'], [0.4, 'A small show']];
export function ShowsTab() {
  const st = es(), pkg = world(), pid = st.sel.showsFor && pkg.promotions.some((x: any) => x.id === st.sel.showsFor) ? st.sel.showsFor : (pkg.promotions[0] ? pkg.promotions[0].id : null);
  const shows = pkg.shows.filter((s: any) => s.promotion_id === pid), ev = (m: number) => pkg.events.find((e: any) => e.month === m);
  const setEv = (m: number, k: string, v: string) => edit(() => {
    let e = ev(m); if (!e) { e = { month: m, name: E.MONTHS[m - 1] + ' Showcase' }; pkg.events.push(e); pkg.events.sort((a: any, b: any) => a.month - b.month); }
    const plain = E.MONTHS[m - 1] + ' Showcase';
    if (k === 'rule') { if (v === '') delete e.rule; else e.rule = v; } else e.name = v.trim() === '' ? plain : v;
    if (e.name === plain && !e.rule) pkg.events = pkg.events.filter((x: any) => x !== e);
  });
  return <>
    <Panel cls="mb4" title="Weekly shows">
      {pkg.promotions.length ? <>
        <div class="row"><Field label="Company"><Sel t="ed-shows-for" value={pid} options={companyOpts(pkg)} onChange={v => look(() => { st.sel.showsFor = v; })} /></Field>
          <Btn kind="go" t="ed-add-show" onClick={() => edit(() => { E.edAddShow(pkg, pid, 'New show'); })}>Add a show</Btn></div>
        {shows.length ? <ul class="list mt2">{shows.map((s: any, i: number) => <li class="col" key={i}><div class="editor plain">
          <NameF label="Name of the show" table="shows" rec={s} max={32} t="ed-show-name" />
          <SelF label="How big" rec={s} k="weight" num options={(SIZES.some(z => z[0] === (s.weight == null ? 1 : s.weight)) ? SIZES : SIZES.concat([[s.weight, 'Size ' + s.weight]])) as Opt[]} />
        </div><span class="row opts"><DelBtn id={'show:' + s.id} what="this show" onDelete={() => { E.edRemove(pkg, 'shows', s.id); }} /></span></li>)}</ul>
          : <p class="bad mt2">This company has no weekly show. It needs one.</p>}
        <p class="muted mt2">A company runs every one of its shows each week. Smaller shows draw less and count for less.</p>
      </> : <p class="empty">Add a company first.</p>}
    </Panel>
    <Panel cls="mb4" title="The big events of the year">
      <p class="muted mb2">One big event a month, shared by every company in the world. Leave a month empty and it is called the Showcase. A rule changes how that night plays.</p>
      <ul class="list">{E.MONTHS.map((mn: string, i: number) => { const e = ev(i + 1) || {}; return <li class="col" key={mn}><div class="editor plain">
        <Field label={mn}><input type="text" value={e.name && e.name !== mn + ' Showcase' ? e.name : ''} maxLength={36} placeholder={mn + ' Showcase'} {...dataAttrs('ed-ev-name', { v: i + 1 })} onInput={x => setEv(i + 1, 'name', (x.currentTarget as HTMLInputElement).value)} /></Field>
        <Field label="Rule of the night"><Sel t="ed-ev-rule" d={{ v: i + 1 }} value={e.rule || ''} options={[['', 'No special rule'] as Opt].concat(Object.keys(E.RULES).map(k => [k, String(E.RULES[k]).split(':')[0]] as Opt))} onChange={v => setEv(i + 1, 'rule', v)} /></Field>
      </div>{e.rule && E.RULES[e.rule] ? <span class="muted">{E.RULES[e.rule]}</span> : null}</li>; })}</ul>
    </Panel>
  </>;
}
