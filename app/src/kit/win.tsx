/* The new look: grey desktop windows on the blue desktop (docs/plans/art-direction.md, section 2; styles in
   styles/win.css). A page that has been moved over is a <Desktop> of <Win>s. Inside a window the ordinary Btn, Tag and
   Meter draw themselves for a grey background, so a page keeps using the same controls. */
import { ComponentChildren } from 'preact';
import { Data, dataAttrs } from './index';

/** A page of windows. `cls` sets the grid (columns and rows); the gaps and the room for shadows come with it. */
export function Desktop(p: { cls?: string; t?: string; children: ComponentChildren }) {
  return <div class={'desktop' + (p.cls ? ' ' + p.cls : '')} {...dataAttrs(p.t)}>{p.children}</div>;
}
/** A grey window: blue title bar with the title centred, a short status at its right end, and the body.
    `tone` is 'hot' for a window that wants attention (red bar) or 'gold' for a celebration. */
export function Win(p: { title: ComponentChildren; right?: ComponentChildren; tone?: 'hot' | 'gold'; cls?: string; area?: string; t?: string; label?: string; children?: ComponentChildren }) {
  return <section class={'wn' + (p.tone ? ' ' + p.tone : '') + (p.cls ? ' ' + p.cls : '')} style={p.area ? { gridArea: p.area } : undefined} aria-label={p.label || (typeof p.title === 'string' ? p.title : undefined)} {...dataAttrs(p.t)}>
    <header class="ttl"><span aria-hidden="true">[{'■'}]</span><h2>{p.title}</h2><span>{p.right}</span></header>
    <div class="bd">{p.children}</div>
  </section>;
}
/** A group box: a thin frame with its heading in red on the top edge. */
export function Group(p: { title: ComponentChildren; cls?: string; t?: string; children?: ComponentChildren }) {
  return <div class={'grp' + (p.cls ? ' ' + p.cls : '')} role="group" aria-label={typeof p.title === 'string' ? p.title : undefined} {...dataAttrs(p.t)}><h3>{p.title}</h3>{p.children}</div>;
}
/** A label and its value on one line. `w` is the label column's width in characters (11 if left out). */
export function Line(p: { label: ComponentChildren; w?: number; children?: ComponentChildren }) {
  return <p class="kvl" style={p.w ? { '--lw': p.w + 'ch' } as any : undefined}><span class="l">{p.label}</span><span class="v">{p.children}</span></p>;
}
/** The list box. `cols` is the grid every row shares (a CSS grid-template-columns value); `head` is the header cells. */
export function ListBox(p: { cols: string; head?: ComponentChildren; label: string; cls?: string; t?: string; children?: ComponentChildren }) {
  return <div class={'lb' + (p.cls ? ' ' + p.cls : '')} style={{ '--cols': p.cols } as any} role="group" aria-label={p.label} {...dataAttrs(p.t)}>
    {p.head != null && <div class="hd" aria-hidden="true">{p.head}</div>}
    {p.children}
  </div>;
}
/** One line of a list box. With `onPick` it is a real button, so it works by mouse, touch, keys and gamepad. */
export function Row(p: { sel?: boolean; onPick?: () => void; t?: string; d?: Data; label?: string; children?: ComponentChildren }) {
  if (!p.onPick) return <div class={'rw' + (p.sel ? ' sel' : '')} {...dataAttrs(p.t, p.d)}>{p.children}</div>;
  return <button type="button" class={'rw' + (p.sel ? ' sel' : '')} aria-pressed={!!p.sel} aria-label={p.label} onClick={p.onPick} {...dataAttrs(p.t, p.d)}>{p.children}</button>;
}
/** An answer drawn as a wide bar with a coloured left edge. `note` sits at the right end (a cost, a chance, a word). */
export function Answer(p: { kind?: 'go' | 'danger' | 'less'; note?: ComponentChildren; disabled?: boolean; onClick?: () => void; t?: string; d?: Data; children?: ComponentChildren }) {
  return <button type="button" class={'ans' + (p.kind ? ' ' + p.kind : '')} disabled={p.disabled} onClick={p.onClick} {...dataAttrs(p.t, p.d)}><span>{p.children}</span>{p.note != null && <small>{p.note}</small>}</button>;
}
