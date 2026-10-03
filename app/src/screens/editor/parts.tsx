/* World Editor building blocks: form fields bound to a record, the pick list and the two-step delete. */
import { ComponentChildren } from 'preact';
import { Btn, Field, Sel, Opt, dataAttrs } from '../../kit';
import { E } from '../../engine';
import { es, edit, look, world, reId } from './state';

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
export function SelF(p: { label: string; rec: Rec; k: string; options: Opt[]; num?: boolean; none?: boolean; t?: string }) {
  return <Field label={p.label}><Sel t={p.t || 'ed-f'} d={{ k: p.k }} value={p.rec[p.k] == null ? '' : p.rec[p.k]} options={p.options}
    onChange={v => edit(() => { if (v === '' && p.none) delete p.rec[p.k]; else p.rec[p.k] = p.num ? +v : v; })} /></Field>;
}
/** A 0 to 100 rating: a slider with its number beside it. `opt` ratings can be left for the game to work out. */
export function Rating(p: { label: string; obj: Rec; k: string; opt?: boolean }) {
  const has = p.obj[p.k] != null, v = has ? p.obj[p.k] : 50;
  return <div class="edrate"><div class="edrate-top"><span>{p.label} <b>{has ? v : 'auto'}</b></span>
    {p.opt && has ? <Btn kind="sm" t="ed-rate-auto" d={{ k: p.k }} label={'Let the game work out ' + p.label} onClick={() => edit(() => { delete p.obj[p.k]; })}>Auto</Btn> : null}</div>
    <input type="range" min={0} max={100} value={v} aria-label={p.label} {...dataAttrs('ed-rate', { k: p.k })} onInput={e => { const n = +(e.currentTarget as HTMLInputElement).value; edit(() => { p.obj[p.k] = n; }); }} /></div>;
}
export interface Pick { id: string; label: string; sub?: string; bad?: boolean }
/** The list on the left of a tab. One row is open at a time. */
export function PickList(p: { items: Pick[]; sel: string | null | undefined; onPick: (id: string) => void; t: string; empty: string; more?: string }) {
  if (!p.items.length) return <p class="empty">{p.empty}</p>;
  return <div class="edlist" role="list">{p.items.map(it => <button type="button" key={it.id} class={'edrow' + (it.id === p.sel ? ' on' : '') + (it.bad ? ' bad' : '')} aria-pressed={it.id === p.sel} {...dataAttrs(p.t, { id: it.id })}
    onClick={() => look(() => p.onPick(it.id))}><span class="nm">{it.label}</span>{it.sub ? <span class="st">{it.sub}</span> : null}</button>)}
    {p.more ? <p class="muted mt1">{p.more}</p> : null}</div>;
}
/** Delete in two presses, because the page cannot ask "are you sure?" in a system box. */
export function DelBtn(p: { id: string; what: string; onDelete: () => void }) {
  const st = es(), armed = st.del === p.id;
  return armed
    ? <span class="row"><Btn kind="danger" t="ed-del-yes" onClick={() => edit(p.onDelete)}>Yes, delete {p.what}</Btn><Btn kind="sm" t="ed-del-no" onClick={() => look(() => { /* look() disarms it */ })}>Keep it</Btn></span>
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
