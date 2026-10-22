/* World Editor building blocks: form fields bound to a record, the pick list and the two-step delete. */
import { ComponentChildren, createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';
import { Step } from '../../kit/step';
import { Btn, Field, Sel, Opt, dataAttrs } from '../../kit';
import { E } from '../../engine';
import { es, edit, editDel, look, world, reId } from './state';

type Rec = Record<string, any>;
/** A text box that writes straight into a record. An empty optional field is removed, not stored as ''. */
export function TextF(p: { label: string; rec: Rec; k: string; max?: number; ph?: string; keepEmpty?: boolean; t?: string }) {
  return <Field label={p.label}><input type="text" value={p.rec[p.k] == null ? '' : String(p.rec[p.k])} maxLength={p.max || 40} placeholder={p.ph} {...dataAttrs(p.t || 'ed-f', { k: p.k })}
    onInput={e => { const v = (e.currentTarget as HTMLInputElement).value; edit(() => { if (v === '' && !p.keepEmpty) delete p.rec[p.k]; else p.rec[p.k] = v; }); }} /></Field>;
}
/** The name of a company, show, belt, wrestler or team. The record's hidden id follows the name. */
export function NameF(p: { label: string; table: string; rec: Rec; max?: number; t: string }) {
  const k = p.table === 'workers' ? 'ring_name' : 'name';
  return <Field label={p.label}><input type="text" value={p.rec[k] == null ? '' : String(p.rec[k])} maxLength={p.max || 40} {...dataAttrs(p.t)}
    onInput={e => { const v = (e.currentTarget as HTMLInputElement).value, old = p.rec.id; edit(() => { reId(p.table, old, E.edRename(world(), p.table, old, v)); }); }} /></Field>;
}
/** A whole number inside a range. Out-of-range typing is pulled back when the box loses focus. */
export function NumF(p: { label: string; rec: Rec; k: string; min: number; max: number; step?: number; blank?: string; t?: string }) {
  const cur = p.rec[p.k];
  const set = (raw: string, clampIt: boolean) => { const n = parseFloat(raw); edit(() => { if (raw.trim() === '' || !isFinite(n)) { if (p.blank != null) delete p.rec[p.k]; return; } p.rec[p.k] = clampIt ? Math.max(p.min, Math.min(p.max, n)) : n; }); };
  return <Field label={p.label}><input type="number" inputMode="numeric" value={cur == null ? '' : String(cur)} min={p.min} max={p.max} step={p.step || 1} placeholder={p.blank} {...dataAttrs(p.t || 'ed-f', { k: p.k })}
    onInput={e => set((e.currentTarget as HTMLInputElement).value, false)} onBlur={e => set((e.currentTarget as HTMLInputElement).value, true)} /></Field>;
}
/** Inside Create a Wrestler the World Editor's forms step like the rest of the suite: ◀ the choice ▶ (Ryan, 20 October). */
export const InSuite = createContext(false);
/** A dropdown that is a Step line inside Create a Wrestler and a plain dropdown elsewhere. */
export function MaybeStep(p: { children: ComponentChildren }) { return useContext(InSuite) ? <Step>{p.children}</Step> : <>{p.children}</>; }
export function SelF(p: { label: string; rec: Rec; k: string; options: Opt[]; num?: boolean; none?: boolean; t?: string }) {
  return <Field label={p.label}><MaybeStep><Sel t={p.t || 'ed-f'} d={{ k: p.k }} value={p.rec[p.k] == null ? '' : p.rec[p.k]} options={p.options}
    onChange={v => edit(() => { if (v === '' && p.none) delete p.rec[p.k]; else p.rec[p.k] = p.num ? +v : v; })} /></MaybeStep></Field>;
}
/** A 0 to 100 rating: a slider with its number beside it. `opt` ratings can be left for the game to work out. */
export function Rating(p: { label: string; obj: Rec; k: string; opt?: boolean }) {
  const has = p.obj[p.k] != null, v = has ? p.obj[p.k] : 50;
  return <div class="edrate"><div class="edrate-top"><span>{p.label} <b>{has ? v : 'auto'}</b></span>
    {p.opt && has ? <Btn kind="sm" t="ed-rate-auto" d={{ k: p.k }} label={'Let the game work out ' + p.label} onClick={() => edit(() => { delete p.obj[p.k]; })}>Auto</Btn> : null}</div>
    <input type="range" min={0} max={100} value={v} aria-label={p.label} {...dataAttrs('ed-rate', { k: p.k })} onInput={e => { const n = +(e.currentTarget as HTMLInputElement).value; edit(() => { p.obj[p.k] = n; }); }} /></div>;
}
export interface Pick { id: string; label: string; sub?: string; bad?: boolean; pic?: ComponentChildren }
/** The list on the left of a tab. One row is open at a time. */
export function PickList(p: { items: Pick[]; sel: string | null | undefined; onPick: (id: string) => void; t: string; empty: string; more?: string; many?: Record<string, any> }) {
  if (!p.items.length) return <p class="empty">{p.empty}</p>;
  return <div class="edlist" role="list">{p.items.map(it => <button type="button" key={it.id} class={'edrow' + ((p.many ? !!p.many[it.id] : it.id === p.sel) ? ' on' : '') + (it.bad ? ' bad' : '')} aria-pressed={p.many ? !!p.many[it.id] : it.id === p.sel} {...dataAttrs(p.t, { id: it.id })}
    onClick={() => look(() => p.onPick(it.id))}>{it.pic ? <span class="pic">{it.pic}</span> : null}<span class="nm">{it.label}</span>{it.sub ? <span class="st">{it.sub}</span> : null}</button>)}
    {p.more ? <p class="muted mt1">{p.more}</p> : null}</div>;
}
/** Delete in two presses, because the page cannot ask "are you sure?" in a system box. */
export function DelBtn(p: { id: string; what: string; onDelete: () => void }) {
  const st = es(), armed = st.del === p.id;
  return armed
    ? <span class="row"><Btn kind="danger" t="ed-del-yes" onClick={() => editDel(p.onDelete, p.what.charAt(0).toUpperCase() + p.what.slice(1))}>Yes, delete {p.what}</Btn><Btn kind="sm" t="ed-del-no" onClick={() => look(() => { /* look() disarms it */ })}>Keep it</Btn></span>
    : <Btn kind="sm" t="ed-del" onClick={() => look(() => { es().del = p.id; })}>Delete {p.what}</Btn>;
}
/** List on the left, the open record on the right. On a narrow screen the open record replaces the list. */
export function TwoPane(p: { open: boolean; list: ComponentChildren; children: ComponentChildren; onBack: () => void }) {
  return <div class={'edgrid' + (p.open ? ' has-sel' : '')}>
    <div class="edcol-list">{p.list}</div>
    <div class="edcol-form">{p.open ? <div class="row edback"><Btn kind="sm" t="ed-list" onClick={() => look(p.onBack)}>{'◄'} Back to the list</Btn></div> : null}{p.children}</div>
  </div>;
}
export const opts = (table: Record<string, string>): Opt[] => Object.keys(table).map(k => [k, table[k]] as Opt);

/** The brand a show, belt or contract belongs to. Shown only when its company has brands. */
export function BrandSel(p: { pkg: any; pid: string; rec: any; t?: string }) {
  const P = p.pkg.promotions.find((x: any) => x.id === p.pid), B: any[] = (P && P.brands) || [];
  if (!B.length) return null;
  return <Field label="Brand"><Sel t={p.t || 'ed-brand'} value={p.rec.brand || ''} options={[['', 'No brand'] as Opt].concat(B.map((b: any) => [b.id, b.name + (b.dev ? ' (developmental)' : '')] as Opt))} onChange={v => edit(() => { E.edPutBrand(p.rec, v || null); })} /></Field>;
}
export interface MenuItem { id: string; label: string; sub?: string; on?: boolean; mine?: boolean }
/** A long list that will keep growing (Ryan, 20 October: the included scenes, and those people make): one list, a
    search box over it, in a box that scrolls inside itself. What was made or changed for this world comes first,
    marked. Each row is a button. */
export function ScrollMenu(p: { t: string; items: MenuItem[]; onPick: (id: string) => void; label: string; tall?: boolean }) {
  const [q, setQ] = useState(''), ql = q.trim().toLowerCase();
  const items = ql ? p.items.filter(it => (it.label + ' ' + (it.sub || '')).toLowerCase().indexOf(ql) >= 0) : p.items;
  return <div class={'edmenu' + (p.tall ? ' tall' : '')}>
    <input type="search" value={q} placeholder={'Search ' + p.items.length} aria-label={'Search ' + p.label} {...dataAttrs(p.t + '-q')} onInput={e => setQ((e.currentTarget as HTMLInputElement).value)} />
    <div class="edmenu-list" role="list" aria-label={p.label}>
      {items.length ? items.map(it => <button type="button" key={it.id} class={'edrow' + (it.on ? ' on' : '') + (it.mine ? ' mine' : '')} aria-pressed={!!it.on} {...dataAttrs(p.t, { id: it.id })} onClick={() => p.onPick(it.id)}>
        <span class="nm">{it.label}</span>{it.sub ? <span class="st">{it.sub}</span> : null}</button>) : <p class="muted edmenu-none">Nothing matches.</p>}
    </div>
  </div>;
}
