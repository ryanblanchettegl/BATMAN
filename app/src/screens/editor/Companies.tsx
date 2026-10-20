/* World Editor: companies, their weekly shows, and the big events of the year. */
import { E } from '../../engine';
import { Btn, Panel, Sel, Field, Opt, Logo, dataAttrs } from '../../kit';
import { openLogoMaker } from '../../shared/logomaker';
import { ModelCard } from '../../shared/model';
import { es, world, edit, look, note } from './state';
import { TextF, NameF, NumF, SelF, PickList, DelBtn, TwoPane, BrandSel, ScrollMenu } from './parts';

const names = (t: Record<string, any>): Opt[] => Object.keys(t).map(k => [k, t[k].n] as Opt);
export const companyOpts = (pkg: any): Opt[] => pkg.promotions.map((p: any) => [p.id, p.name + (p.full_name ? ' - ' + p.full_name : '')] as Opt);

export function CompaniesTab() {
  const st = es(), pkg = world(), info = E.edInfo(pkg), p = pkg.promotions.find((x: any) => x.id === st.sel.companies) || null;
  const add = () => edit(() => { const n = E.edAddPromo(pkg, { name: 'NEW' + (pkg.promotions.length + 1), full_name: 'New Wrestling Company', popularity: 50 }); st.sel.companies = n.id; });
  const list = <>
    <div class="row mb2"><Btn kind="go" t="ed-add-company" onClick={add}>Add a company</Btn></div>
    <PickList t="ed-pick" sel={st.sel.companies} onPick={id => { st.sel.companies = id; }} empty="No companies yet. A world needs at least two."
      items={pkg.promotions.map((x: any) => { const c = info.per[x.id]; return { id: x.id, pic: <Logo of={x} size="chip" />, label: x.name, sub: 'Pop ' + x.popularity + ' · ' + c.roster + ' wrestlers', bad: c.roster < 6 || !c.shows }; })} />
  </>;
  if (!p) return <TwoPane open={false} list={list} onBack={() => { }}><p class="empty">Pick a company on the left, or add one.</p></TwoPane>;
  const c = info.per[p.id], own = p.owner || (p.owner = {}), staff = p.staff || (p.staff = {}), months: Opt[] = E.MONTHS.map((n: string, i: number) => [i + 1, n] as Opt);
  const fill = () => edit(() => { const made = E.edFill(pkg, p.id, st.fill, Date.now()); note(made.length + ' unknowns signed to ' + p.name + '. Rename them on the Wrestlers tab.'); });
  return <TwoPane open list={list} onBack={() => { st.sel.companies = null; }}>
    <Panel cls="mb4" title={p.name || 'Company'}>
      <div class="editor plain">
        <NameF label="Short name" table="promotions" rec={p} max={12} t="ed-cname" />
        <TextF label="Full name" rec={p} k="full_name" max={48} />
        <NumF label="Popularity" rec={p} k="popularity" min={5} max={100} />
      </div>
      <div class="editor plain"><TextF label="Description" rec={p} k="blurb" max={200} ph="One or two lines for the company list" /></div>
      <p class="muted mt2">Popularity sets the size of everything: crowds, television money, wages. 90 is a giant, 50 a regional company, 20 a local one.</p>
    </Panel>
    <Panel cls="mb4" title="Logo">
      <div class="row top"><Logo of={p} t="ed-logo" /><div>
        <p>{p.logo ? 'A logo of its own.' : 'The logo its model gives it, made from its letters.'} <Logo of={p} size="chip" /></p>
        <div class="row mt1"><Btn kind="go" t="ed-logo-open" onClick={() => openLogoMaker({ name: p.name, model: p.model || 'classic', logo: E.logoOf(p), list: pkg.promotions, self: p.id,
          onSave: m => { const r = E.edSetLogo(pkg, p.id, m); if (r.ok) edit(() => { note(r.msg); }); return r; } })}>Change the logo</Btn>
          {p.logo ? <Btn kind="sm" t="ed-logo-reset" onClick={() => edit(() => { note(E.edSetLogo(pkg, p.id, null).msg); })}>Back to the model’s own</Btn> : null}</div>
      </div></div>
      <p class="muted mt2">Every company has its own icon, built from its initials. It shows beside the company’s name everywhere in the game.</p>
    </Panel>
    <Panel cls="mb4" title="Management">
      <div class="editor plain"><SelF label="Model" rec={p} k="model" options={names(E.MODELS)} t="ed-model" /></div>
      <div class="mt1"><ModelCard id={p.model} short /></div>
    </Panel>
    <Panel cls="mb4" title="Owner">
      <div class="editor plain">
        <TextF label="Owner" rec={own} k="name" max={32} ph="The owner" />
        <SelF label="House style" rec={own} k="style" options={names(E.STYLES)} />
        <SelF label="Crowd expectation" rec={own} k="roots" options={names(E.ROOTS)} />
        <SelF label="Locker room promise" rec={own} k="pledge" options={names(E.PLEDGE)} />
      </div>
    </Panel>
    <Panel cls="mb4" title="Status">
      <ul class="sheet-lines" data-t="ed-health">{E.edHealth(pkg, p.id).map((l: any, i: number) => <li key={i} class={l.warn ? 'bad' : undefined}>{l.t}</li>)}</ul>
    </Panel>
    <Panel cls="mb4" title="Brands">
      {(p.brands || []).length ? <ul class="list">{(p.brands as any[]).map((b: any) => <li key={b.id} class="col"><div class="editor plain">
        <Field label="Brand"><input type="text" maxLength={32} data-t="ed-brand-name" data-v={b.id} value={b.name} onInput={e => { const v = (e.currentTarget as HTMLInputElement).value; edit(() => { E.edSetBrand(pkg, p.id, b.id, { name: v }); }); }} /></Field>
        </div><span class="row opts"><Btn kind="sm" t="ed-brand-dev" d={{ v: b.id }} on={!!b.dev} onClick={() => edit(() => { E.edSetBrand(pkg, p.id, b.id, { dev: !b.dev }); })}>{b.dev ? 'Developmental' : 'Main roster'}</Btn>
        <DelBtn id={'brand:' + b.id} what={b.name} onDelete={() => { E.edRemoveBrand(pkg, p.id, b.id); note(b.name + ' is gone. Its shows, belts and wrestlers have no brand now.'); }} /></span></li>)}</ul>
        : <p class="muted">No brands. One roster runs every show.</p>}
      <div class="row mt2"><Btn kind="sm" t="ed-add-brand" onClick={() => edit(() => { const b = E.edAddBrand(pkg, p.id, ''); note(b.name + ' added. Put shows, belts and wrestlers on it.'); })}>Add a brand</Btn></div>
    </Panel>
    <Panel cls="mb4" title="Staff">
      <div class="editor plain">
        {(['Play-by-play', 'Colour'] as string[]).map((lab, i) => <Field key={lab} label={lab}><input type="text" maxLength={32} placeholder={i ? 'The colour man' : 'The play-by-play man'} data-t="ed-ann" data-v={i} value={(p.announcers && p.announcers[i]) || ''}
          onInput={e => { const v = (e.currentTarget as HTMLInputElement).value; edit(() => { const a = (p.announcers || ['', '']).slice(0, 2); while (a.length < 2) a.push(''); a[i] = v; if (a[0] || a[1]) p.announcers = a; else delete p.announcers; }); }} /></Field>)}
        <TextF label="Road agent" rec={staff} k="road_agent" max={32} ph="The road agent" t="ed-agent" />
        <TextF label="Head writer" rec={staff} k="head_writer" max={32} ph="The head writer" t="ed-writer" />
      </div>
      <p class="muted mt2">The voices on the broadcast and the two people backstage. Both commentators need a name for the game to use them.</p>
    </Panel>
    <Panel cls="mb4" title="Money">
      <div class="editor plain">
        <NumF label="Starting cash ($)" rec={p} k="cash" min={0} max={2000000000} step={100000} blank="worked out" />
        <NumF label="Weekly target ($)" rec={p} k="target_weekly_net" min={-5000000} max={20000000} step={10000} blank="worked out" />
        <SelF label="Flagship month" rec={p} k="flagship_month" options={[['', 'April (the usual)'] as Opt].concat(months)} num none />
      </div>
      <p class="muted mt2">Leave the money boxes empty and the game works them out from popularity.</p>
    </Panel>
    <Panel cls="mb4" title="Road">
      <div class="editor plain"><Field label="Cities"><input type="text" {...dataAttrs('ed-cities')} value={(p.cities || []).join(', ')} maxLength={300} placeholder="Chicago, Boston, Memphis"
        onInput={e => { const v = (e.currentTarget as HTMLInputElement).value; edit(() => { p.cities = v.split(',').map(x => x.trim()).filter(Boolean); }); }} /></Field></div>
      {(() => { const known: string[] = E.knownCities(), have: string[] = p.cities || [], off = have.filter(c => known.indexOf(c) < 0);
        return <><p class="muted mt1" data-t="ed-cities-note">{have.length + (have.length === 1 ? ' city' : ' cities') + ' on the road.'}{off.length ? ' Not on the map (no pin on the desk): ' + off.join(', ') + '.' : ''}</p>
          <ScrollMenu t="ed-city-add" label="Cities on the map" onPick={c => edit(() => { p.cities = have.concat([c]); })} items={known.filter(c => have.indexOf(c) < 0).map(c => ({ id: c, label: c, sub: 'Add to the road' }))} /></>; })()}
    </Panel>
    <Panel cls="mb4" title="Roster">
      <p>{c.roster} {c.roster === 1 ? 'wrestler' : 'wrestlers'} under contract ({c.men} men, {c.women} women), {c.titles} {c.titles === 1 ? 'belt' : 'belts'}, {c.shows} weekly {c.shows === 1 ? 'show' : 'shows'}.
        {c.roster < 6 ? <span class="bad"> A company needs at least six wrestlers.</span> : (c.roster < 12 ? <span class="hl"> Twelve or more makes a full card.</span> : null)}</p>
      <div class="row mt2"><Field label="Count"><Sel t="ed-fill-n" value={st.fill} options={[6, 12, 18, 24, 36].map(n => [n, n + ' unknowns'] as Opt)} onChange={v => look(() => { st.fill = +v; })} /></Field>
        <Btn t="ed-fill" onClick={fill}>Fill the roster with unknowns</Btn>
        <Btn kind="sm" t="ed-see-roster" onClick={() => look(() => { st.tab = 'wrestlers'; st.fp = p.id; st.q = ''; st.sel.wrestlers = null; window.scrollTo(0, 0); })}>See its wrestlers</Btn></div>
      <p class="muted mt2">Unknowns are made-up names with ratings that suit a company this size. A quick way to make a world playable, then replace them with your own.</p>
    </Panel>
    <div class="row mb4"><Btn kind="sm" t="ed-dup" onClick={() => edit(() => { const c = E.edDup(pkg, 'promotions', p.id); if (c) { st.sel.companies = c.id; note('Made a copy: ' + c.name + ', with its shows and belts. Its roster is empty.'); } })}>Make a copy</Btn><DelBtn id={'promo:' + p.id} what={p.name} onDelete={() => { E.edRemove(pkg, 'promotions', p.id); st.sel.companies = null; note(p.name + ' is gone, with its shows, belts and contracts. Its wrestlers are now unsigned.'); }} /></div>
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
          <NameF label="Name" table="shows" rec={s} max={32} t="ed-show-name" />
          <BrandSel pkg={pkg} pid={pid} rec={s} t="ed-show-brand" />
          <SelF label="Size" rec={s} k="weight" num options={(SIZES.some(z => z[0] === (s.weight == null ? 1 : s.weight)) ? SIZES : SIZES.concat([[s.weight, 'Size ' + s.weight]])) as Opt[]} />
        </div><span class="row opts"><DelBtn id={'show:' + s.id} what="this show" onDelete={() => { E.edRemove(pkg, 'shows', s.id); }} /></span></li>)}</ul>
          : <p class="bad mt2">This company has no weekly show. It needs one.</p>}
        <p class="muted mt2">A company runs every one of its shows each week. Smaller shows draw less and count for less.</p>
      </> : <p class="empty">Add a company first.</p>}
    </Panel>
    {pid ? (() => { const pr = pkg.promotions.find((x: any) => x.id === pid), own = (m: number) => (pr.events || []).find((e: any) => e.month === m) || {};
      const kinds = Object.keys(E.EV_TYPES).filter(k => k !== 'flag').map(k => [k, E.EV_TYPES[k].n] as Opt);
      return <Panel cls="mb4" title={pr.name + ': its own big events'}>
        <p class="muted mb2">Name a month for this company alone, and choose what kind of night it is. Left empty, it uses the world's name below. The flagship month keeps its kind.</p>
        <ul class="list">{E.MONTHS.map((mn: string, i: number) => { const e = own(i + 1); return <li class="col" key={'p' + mn}><div class="editor plain">
          <Field label={mn}><input type="text" value={e.name || ''} maxLength={28} placeholder={(ev(i + 1) || {}).name || mn + ' Showcase'} {...dataAttrs('ed-pev-name', { v: i + 1 })} onInput={x => edit(() => { E.edPromoEvent(pkg, pid, i + 1, { name: (x.currentTarget as HTMLInputElement).value }); })} /></Field>
          <Field label="Event type"><Sel t="ed-pev-type" d={{ v: i + 1 }} value={e.type || 'arena'} options={kinds} onChange={v => edit(() => { E.edPromoEvent(pkg, pid, i + 1, { type: v }); })} /></Field>
        </div></li>; })}</ul>
      </Panel>; })() : null}
    <Panel cls="mb4" title="Big events">
      <p class="muted mb2">One big event a month, shared by every company in the world. Leave a month empty and it is called the Showcase. A rule changes how that night plays.</p>
      <ul class="list">{E.MONTHS.map((mn: string, i: number) => { const e = ev(i + 1) || {}; return <li class="col" key={mn}><div class="editor plain">
        <Field label={mn}><input type="text" value={e.name && e.name !== mn + ' Showcase' ? e.name : ''} maxLength={36} placeholder={mn + ' Showcase'} {...dataAttrs('ed-ev-name', { v: i + 1 })} onInput={x => setEv(i + 1, 'name', (x.currentTarget as HTMLInputElement).value)} /></Field>
        <Field label="Match rule"><Sel t="ed-ev-rule" d={{ v: i + 1 }} value={e.rule || ''} options={[['', 'No special rule'] as Opt].concat(Object.keys(E.RULES).map(k => [k, String(E.RULES[k]).split(':')[0]] as Opt))} onChange={v => setEv(i + 1, 'rule', v)} /></Field>
      </div>{e.rule && E.RULES[e.rule] ? <span class="muted">{E.RULES[e.rule]}</span> : null}</li>; })}</ul>
    </Panel>
  </>;
}
