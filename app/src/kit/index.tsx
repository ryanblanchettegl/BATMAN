/* The building blocks. A screen is built only from these plus plain layout classes
   (row, cols, stack, list, kv, tw: see styles/kit.css). */
import { ComponentChildren } from 'preact';
import { Check, W } from '../engine';
import { G, openCard, openModal, Card } from '../store';

export type Data = Record<string, string | number | null | undefined>;
/** `t` becomes data-t (the stable name tests and tools use); `d` becomes data-v, data-id and so on. */
export function dataAttrs(t?: string, d?: Data): Record<string, string> {
  const o: Record<string, string> = {};
  if (t) o['data-t'] = t;
  if (d) Object.keys(d).forEach(k => { if (d[k] != null) o['data-' + k] = String(d[k]); });
  return o;
}

/* ---------- controls ---------- */
/** A button. `kind`: 'go' moves things on (yellow), 'less' is the lesser choice (grey), 'danger' is the one that hurts
    (red), 'sm' is a small switch (teal). `cost` is shown at the right end of a button that costs something. */
export function Btn(p: { t?: string; d?: Data; kind?: 'go' | 'sm' | 'danger' | 'less'; on?: boolean; disabled?: boolean; id?: string; label?: string; cls?: string; cost?: ComponentChildren; onClick?: () => void; children?: ComponentChildren }) {
  return <button type="button" id={p.id} class={'btn' + (p.kind ? ' ' + p.kind : '') + (p.on ? ' on' : '') + (p.cls ? ' ' + p.cls : '')} disabled={p.disabled} aria-label={p.label} aria-pressed={p.on == null ? undefined : p.on} onClick={p.onClick} {...dataAttrs(p.t, p.d)}>{p.children}{p.cost != null && <span class="cost">{p.cost}</span>}</button>;
}
export interface TabItem { id: string; label: ComponentChildren; t?: string; d?: Data }
/** A row of buttons that switches between pages or views. One is always pressed. */
export function Tabs(p: { label: string; items: TabItem[]; value: string; onPick: (id: string) => void; cls?: string }) {
  return <div class={'subnav' + (p.cls ? ' ' + p.cls : '')} role="group" aria-label={p.label}>
    {p.items.map(it => <Btn kind="sm" on={it.id === p.value} t={it.t || 'tab'} d={it.d || { v: it.id }} onClick={() => p.onPick(it.id)}>{it.label}</Btn>)}
  </div>;
}
export type Opt = [string | number, string];
/** A drop-down. `options` are [value, label] pairs; `groups` adds labelled groups after them. */
let jump = { buf: '', at: 0 };
/** In a long list, typing letters jumps to the first name that starts with them. Needed where the browser's own jump is not reached (remote, gamepad, on-screen keyboard). */
function typeAhead(e: KeyboardEvent) {
  const el = e.currentTarget as HTMLSelectElement;
  if (el.options.length <= 20 || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || e.key === ' ') return;
  const now = Date.now(); jump.buf = (now - jump.at > 900 ? '' : jump.buf) + e.key.toLowerCase(); jump.at = now;
  for (let i = 0; i < el.options.length; i++) if (el.options[i].text.toLowerCase().indexOf(jump.buf) === 0) { e.preventDefault(); el.selectedIndex = i; el.dispatchEvent(new Event('change', { bubbles: true })); return; }
}
export function Sel(p: { id?: string; value: string | number | null | undefined; options: Opt[]; groups?: { label: string; options: Opt[] }[]; onChange: (v: string) => void; label?: string; t?: string; d?: Data; disabled?: boolean }) {
  const cur = p.value == null ? '' : String(p.value);
  const opt = (o: Opt) => <option value={String(o[0])} selected={String(o[0]) === cur}>{o[1]}</option>;
  return <select id={p.id} aria-label={p.label} disabled={p.disabled} onKeyDown={typeAhead} onChange={e => p.onChange((e.currentTarget as HTMLSelectElement).value)} {...dataAttrs(p.t, p.d)}>
    {p.options.map(opt)}
    {(p.groups || []).filter(g => g.options.length).map(g => <optgroup label={g.label}>{g.options.map(opt)}</optgroup>)}
  </select>;
}
/** A labelled form control, label above. */
export function Field(p: { label: string; children: ComponentChildren }) { return <label class="f">{p.label}{p.children}</label>; }
/** A text box bound to a value. Typing calls onInput without a full redraw being required. */
export function TextBox(p: { id?: string; value: string; onInput: (v: string) => void; max?: number; placeholder?: string; label?: string; type?: string; width?: string; t?: string; d?: Data }) {
  return <input type={p.type || 'text'} id={p.id} value={p.value} maxLength={p.max} placeholder={p.placeholder} aria-label={p.label} style={p.width ? { width: p.width, maxWidth: '100%' } : undefined} onInput={e => p.onInput((e.currentTarget as HTMLInputElement).value)} {...dataAttrs(p.t, p.d)} />;
}

/* ---------- layout ---------- */
/** The double-line box. `title` sits on the top border. */
export function Panel(p: { title?: ComponentChildren; cls?: string; children?: ComponentChildren; live?: boolean }) {
  return <section class={'panel' + (p.cls ? ' ' + p.cls : '')} aria-live={p.live ? 'polite' : undefined}>{p.title != null && <h2>{p.title}</h2>}{p.children}</section>;
}
/** Page heading: small cyan line, then the big yellow title. Children go under the title. */
export function Head(p: { eyebrow?: ComponentChildren; title: ComponentChildren; children?: ComponentChildren }) {
  return <div class="head"><div>{p.eyebrow != null && <p class="eyebrow">{p.eyebrow}</p>}<h1><span class="hl">{p.title}</span></h1>{p.children}</div></div>;
}

/* ---------- small pieces ---------- */
/** A one-word tag. On a dark page it is the word in brackets; inside a grey window it is a small filled box.
    'info' (blue) and 'off' (grey) are for windows. */
export function Tag(p: { kind?: 'face' | 'heel' | 'gold' | 'good' | 'bad' | 'warn' | 'info' | 'off'; children: ComponentChildren }) { return <span class={'tag' + (p.kind ? ' ' + p.kind : '')}>{p.children}</span>; }
/** A wrestler's name in their alignment colour. */
/** A wrestler's name in their alignment colour. Selecting it opens their pop-up profile; `plain` draws it as text only. */
export function Name(p: { w: W; plain?: boolean }) {
  const cls = p.w.align === 'F' ? 'face' : 'heel';
  if (p.plain) return <span class={cls}>{p.w.name}</span>;
  return <button type="button" class={'lnk ' + cls} data-t="who" data-id={p.w.id} onClick={e => { e.stopPropagation(); openCard({ k: 'w', id: p.w.id }); }}>{p.w.name}</button>;
}
/** A title's name. Selecting it opens the title's history. `pid` is the promotion that owns it. */
export function TitleName(p: { pid: string; t: any }) {
  return <button type="button" class="lnk gold" data-t="title-card" data-id={p.t.id} onClick={e => { e.stopPropagation(); openCard({ k: 'title', pid: p.pid, id: p.t.id }); }}>{p.t.name}</button>;
}
/** A promotion's name. Selecting it opens the promotion's pop-up. */
export function PromoName(p: { id: string; text?: string }) {
  const P = G.S.promos[p.id]; if (!P) return <>{p.text || p.id}</>;
  return <button type="button" class="lnk" data-t="promo-card" data-id={p.id} onClick={e => { e.stopPropagation(); openCard({ k: 'promo', id: p.id }); }}>{p.text || P.name}</button>;
}
/** A tag team's name (or "A & B"). Selecting it opens the team's pop-up. */
export function TeamName(p: { t: any }) {
  return <button type="button" class="lnk" data-t="team-card" data-id={p.t.id} onClick={e => { e.stopPropagation(); openCard({ k: 'team', id: p.t.id }); }}>{p.t.name || teamName(p.t)}</button>;
}

/* Names inside sentences the engine wrote (news, reports, the inbox): find every wrestler, title and named team and make
   each one selectable. The lookup is rebuilt when the world changes size or the week turns. */
/** Single-word names that are also ordinary English words. They are not linked when one stands at the start of a sentence, where it may be just a word. */
const WORDLIKE = /^(set|paris|atlas|nemesis|mark|will|rose|hope|faith|grace|joy|dawn|king|queen|prince|baron|duke|earl|major|cash|hunter|bishop|storm|stone|hawk|wolf|fox|bear|lion|tiger|rocky|jack|bill|ray|sage|ash|blake|chase|cole|dean|drake|frank|lance|miles|rich|skip|tag)$/i;
let lk: { key: string; re: RegExp | null; map: Record<string, Card> } = { key: '', re: null, map: {} };
function lookup() {
  const S = G.S; if (!S) return lk;
  const key = S.seed + ':' + S.week + ':' + S.w.length + ':' + S.teams.length;
  if (lk.key === key) return lk;
  const map: Record<string, Card> = {};
  S.w.forEach((w: W) => { if (w.name && w.name.length >= 4) map[w.name] = { k: 'w', id: w.id }; });
  S.order.forEach((pid: string) => S.promos[pid].titles.forEach((t: any) => { if (!map[t.name]) map[t.name] = { k: 'title', pid, id: t.id }; }));
  S.teams.forEach((t: any) => { if (t.name && !map[t.name]) map[t.name] = { k: 'team', id: t.id }; });
  S.order.forEach((pid: string) => { const P = S.promos[pid]; [P.name, P.full].forEach(n => { if (n && n.length >= 3 && !map[n]) map[n] = { k: 'promo', id: pid }; }); });
  const names = Object.keys(map).sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let re: RegExp | null = null;
  try { re = names.length ? new RegExp('(?<![A-Za-z0-9])(' + names.join('|') + ')(?![A-Za-z0-9])', 'g') : null; } catch (e) { re = null; }
  lk = { key, re, map };
  return lk;
}
/** Text with every known name turned into a link to its pop-up. */
export function Txt(p: { children: string | null | undefined }) {
  const text = p.children == null ? '' : String(p.children), L = lookup();
  if (!L.re || !text) return <>{text}</>;
  const out: ComponentChildren[] = []; let last = 0, m: RegExpExecArray | null; L.re.lastIndex = 0;
  while ((m = L.re.exec(text))) {
    const c = L.map[m[1]]; if (!c) continue;
    if (c.k === 'w' && WORDLIKE.test(m[1]) && (m.index === 0 || /[.!?]\s+$/.test(text.slice(0, m.index)))) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    const w = c.k === 'w' ? G.S.w[c.id as number] : null;
    out.push(<button type="button" class={'lnk' + (w ? (w.align === 'F' ? ' face' : ' heel') : (c.k === 'title' ? ' gold' : ''))} data-t={c.k === 'w' ? 'who' : c.k + '-card'} data-id={c.id} onClick={e => { e.stopPropagation(); openCard(c); }}>{m[1]}</button>);
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
export function Side(p: { w: W }) { return <Tag kind={p.w.align === 'F' ? 'face' : 'heel'}>{p.w.align === 'F' ? 'Face' : 'Heel'}</Tag>; }
/** A text meter in blocks for a 0 to 100 value: ten wide, or `n` wide (five or eight) where space is tight. */
export function Meter(p: { v: number; kind?: 'hot' | 'cool' | 'au'; n?: number }) {
  const w = p.n || 10, n = Math.max(0, Math.min(w, Math.round(p.v / 100 * w)));
  return <span class={'meter' + (p.kind ? ' ' + p.kind : '')} role="img" aria-label={Math.round(p.v) + ' out of 100'}>{'█'.repeat(n)}<i>{'░'.repeat(w - n)}</i></span>;
}
/** The 18-segment gauge from the Office dashboard. `frac` is 0 to 1. */
export function Gauge(p: { frac: number }) {
  const n = 18, f = Math.max(0, Math.min(n, Math.round(p.frac * n)));
  return <div class="gauge" role="img" aria-label={Math.round(Math.max(0, Math.min(1, p.frac)) * 100) + ' percent'}>{Array.from({ length: n }, (_, i) => <i class={i < f ? 'on' : undefined} />)}</div>;
}
/** Label, number and meter: one cell of a `.kv` grid. */
export function Stat(p: { label: string; v: number; kind?: 'hot' | 'cool' | 'au' }) { return <div><small>{p.label}</small><span>{Math.round(p.v)} <Meter v={p.v} kind={p.kind} /></span></div>; }
/** Label and any value: one cell of a `.kv` grid. */
export function KV(p: { label: string; children: ComponentChildren }) { return <div><small>{p.label}</small><span>{p.children}</span></div>; }
/** One line that explains an attempt before the player commits to it: the chance, then what helps and what hurts. */
/** A small pop-up that says what just happened, for actions whose result would otherwise only be a line above the page. */
export function showResult(title: string, text: string, err?: boolean) { openModal({ kind: 'info', title, body: () => <p class={err ? 'bad' : 'good'}><Txt>{text}</Txt></p> }); }
/** A word for a chance: long shot, even, likely or near certain. */
export function chanceWord(p: number): [string, string] { return p < 0.3 ? ['a long shot', 'bad'] : (p < 0.55 ? ['about even', 'hl'] : (p < 0.85 ? ['likely', 'good'] : ['near certain', 'good'])); }
export function CheckLine(p: { label?: string; ck: Check }) {
  const ck = p.ck, cw = chanceWord(ck.p), up = ck.mods.filter(x => x.v > 0).map(x => x.n), dn = ck.mods.filter(x => x.v < 0).map(x => x.n);
  return <p class="muted">{p.label ? p.label + ': ' : ''}an attempt with a <b>{Math.round(ck.p * 100)}%</b> chance, <b class={cw[1]}>{cw[0]}</b>
    {up.length ? <> {'·'} <span class="good">{'▲'} {up.join(', ')}</span></> : null}{dn.length ? <> {'·'} <span class="bad">{'▼'} {dn.join(', ')}</span></> : null}</p>;
}
export function Empty(p: { children: ComponentChildren }) { return <p class="empty">{p.children}</p>; }
/** A letter grade for a rating out of 100: A+ from 90, down to F below 40. */
export function grade(v: number): string { const G: [number, string][] = [[90, 'A+'], [85, 'A'], [80, 'A-'], [75, 'B+'], [70, 'B'], [65, 'B-'], [60, 'C+'], [55, 'C'], [50, 'C-'], [40, 'D']]; for (const g of G) if (v >= g[0]) return g[1]; return 'F'; }
/** Match rating as stars, quarter steps. */
export function stars(v: number): string { const q = Math.round(v / 20 * 4) / 4, f = Math.floor(q), r = q - f; return ('★'.repeat(f) + (r === 0.25 ? '¼' : r === 0.5 ? '½' : r === 0.75 ? '¾' : '')) || '¼'; }

/* ---------- lookups shared by many screens ---------- */
export function champOf(P: any, id: number): string[] { return P.titles.filter((t: any) => t.holders.indexOf(id) >= 0).map((t: any) => t.name); }
export function brandName(P: any, id: string | null): string { if (!P.brands || !id) return ''; const b = P.brands.find((x: any) => x.id === id); return b ? b.name : ''; }
export function teamName(t: any): string { const S = G.S; return S.w[t.m[0]].name + ' & ' + S.w[t.m[1]].name; }

export * from './charts';
export * from './portrait';
export * from './window';
export * from './win';
export * from './lights';
export * from './logo';
