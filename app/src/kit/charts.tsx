/* Text-mode charts and block lettering. Everything here is drawn with characters, in keeping with the screen. */
import { ComponentChildren } from 'preact';
import { GLYPH } from './glyphs';

const PIEC = ['pc0', 'pc1', 'pc2', 'pc3', 'pc4', 'pc5', 'pc6'];
/** A pie made of block characters, with a legend. Parts with a zero value are dropped. */
export function Pie(p: { parts: { n: string; v: number }[]; title?: string }) {
  const parts = p.parts.filter(x => x.v > 0), tot = parts.reduce((a, x) => a + x.v, 0);
  if (!tot) return null;
  const W = 23, H = 11, cuts: number[] = []; let acc = 0; parts.forEach(x => { acc += x.v / tot; cuts.push(acc); });
  const rows: ComponentChildren[] = [];
  for (let y = 0; y < H; y++) {
    const cells: ComponentChildren[] = [];
    for (let x = 0; x < W; x++) {
      const dx = (x - (W - 1) / 2) / ((W - 1) / 2), dy = (y - (H - 1) / 2) / ((H - 1) / 2);
      if (Math.sqrt(dx * dx + dy * dy) > 1.03) { cells.push(' '); continue; }
      let a = Math.atan2(dx, -dy) / (2 * Math.PI); if (a < 0) a += 1;
      let k = 0; while (k < cuts.length - 1 && a > cuts[k]) k++;
      cells.push(<span class={PIEC[k % PIEC.length]}>{'█'}</span>);
    }
    rows.push(cells, '\n');
  }
  const label = (p.title || 'Pie chart') + ': ' + parts.map(x => x.n + ' ' + Math.round(x.v / tot * 100) + '%').join(', ');
  return <div class="piebox" role="img" aria-label={label}>
    <pre class="pie" aria-hidden="true">{rows}</pre>
    <div class="legend">{parts.map((x, i) => <div><span class={PIEC[i % PIEC.length]}>{'██'}</span> {x.n} <span class="num muted">{Math.round(x.v / tot * 100)}%</span></div>)}</div>
  </div>;
}
/** A column chart. Negative values hang below the line in red. */
export function ColChart(p: { vals: number[]; labels?: (string | number)[]; title?: string; line?: number }) {
  const vals = p.vals, H = 6, out: ComponentChildren[] = []; let max = 1, neg = false;
  vals.forEach(v => { if (Math.abs(v) > max) max = Math.abs(v); if (v < 0) neg = true; });
  if (p.line != null && p.line > max) max = p.line;
  const rl = p.line != null && p.line > 0 ? Math.max(1, Math.round(p.line / max * H)) : 0;
  for (let r = H; r >= 1; r--) { out.push(vals.map(v => { const h = v / max * H; return [h >= r ? <span class="good">{'██'}</span> : (h >= r - 0.5 ? <span class="good">{'▄▄'}</span> : (r === rl ? <span class="plan">{'──'}</span> : '  ')), r === rl ? <span class="plan">{'─'}</span> : ' ']; }), '\n'); }
  out.push('─'.repeat(Math.max(0, vals.length * 3 - 1)), '\n');
  if (neg) for (let r = 1; r <= 3; r++) { out.push(vals.map(v => { const h = -v / max * H; return [h >= r ? <span class="bad">{'██'}</span> : (h >= r - 0.5 ? <span class="bad">{'▀▀'}</span> : '  '), ' ']; }), '\n'); }
  if (p.labels) out.push(p.labels.map(l => (String(l) + '  ').slice(0, 2) + ' ').join(''));
  return <pre class="ascii bars" role="img" aria-label={p.title || 'Chart'}>{out}</pre>;
}
/** A 20-cell bar that shows a range, for scouting reports. */
export function RangeBar(p: { lo: number; hi: number }) {
  let s = ''; for (let i = 0; i < 20; i++) { const v = i * 5 + 2.5; s += v >= p.lo - 2.5 && v <= p.hi + 2.5 ? '█' : '░'; }
  return <span class="meter au" aria-hidden="true">{s}</span>;
}
/** A progress clock: a small pie of `n` segments with `v` filled. Red for trouble, green for a pay-out. */
export function Dial(p: { v: number; n: number; bad?: boolean }) {
  const W = 11, H = 5, rows: ComponentChildren[] = [];
  for (let y = 0; y < H; y++) {
    const cells: ComponentChildren[] = [];
    for (let x = 0; x < W; x++) {
      const dx = (x - (W - 1) / 2) / ((W - 1) / 2), dy = (y - (H - 1) / 2) / ((H - 1) / 2);
      if (dx * dx + dy * dy > 1.12) { cells.push(' '); continue; }
      let a = Math.atan2(dx, -dy) / (2 * Math.PI); if (a < 0) a += 1;
      cells.push(Math.min(p.n - 1, Math.floor(a * p.n)) < p.v ? <span class="on">{'█'}</span> : <span class="off">{'░'}</span>);
    }
    rows.push(cells, '\n');
  }
  return <pre class={'dial ' + (p.bad ? 'bad' : 'good')} aria-hidden="true">{rows}</pre>;
}
function blockRows(word: string, zeroAsO?: boolean): string[] {
  const rows = ['', '', '', '', ''];
  word.split('').forEach(ch => {
    if (ch === ' ') { for (let r = 0; r < 5; r++) rows[r] += '   '; return; }
    const g = ((zeroAsO && ch === '0' ? GLYPH.O : GLYPH[ch]) || GLYPH['-']).split('/');
    for (let r = 0; r < 5; r++) rows[r] += g[r].replace(/#/g, '█') + ' ';
  });
  return rows;
}
/** Block lettering that shrinks to fit. `one` keeps the words on one line; `scale` is the largest size in em; `zeroAsO` draws 0 as a plain ring. */
export function BigText(p: { text: string; scale?: number; one?: boolean; cls?: string; padEm?: number; label?: boolean; zeroAsO?: boolean }) {
  const clean = String(p.text).toUpperCase().replace(/[^A-Z0-9'! -]/g, ''), words = p.one ? [clean] : clean.split(/\s+/).filter(Boolean), out: string[] = []; let max = 1;
  words.forEach((w, i) => { blockRows(w, p.zeroAsO).forEach(r => { if (r.length > max) max = r.length; out.push(r); }); if (i < words.length - 1) out.push(''); });
  const size = 'min(' + (p.scale || 1) + 'em,calc((min(100vw,59em) - ' + (p.padEm || 5.7) + 'em) / ' + (max * 0.62).toFixed(1) + '))';
  return <pre class={'ascii logo' + (p.cls ? ' ' + p.cls : '')} role={p.label ? 'img' : undefined} aria-label={p.label ? p.text : undefined} aria-hidden={p.label ? undefined : true} style={{ fontSize: size }}>{out.join('\n')}</pre>;
}
/** The gold banner used for big-event title cards. */
export function Banner(p: { text: string }) { return <BigText text={p.text} cls="gold" label />; }
/** The "new champion" belt drawn when a title changes hands. */
export function BeltArt(p: { name: string; top?: string }) {
  const n = String(p.name).toUpperCase(), top = '★ ' + String(p.top || 'NEW CHAMPION').toUpperCase() + ' ★', w = Math.max(19, n.length + 4, top.length + 2), bar = '═'.repeat(w);
  const pad = (s: string) => { const l = Math.max(0, w - s.length), a = Math.floor(l / 2); return ' '.repeat(a) + s + ' '.repeat(l - a); };
  return <pre class="ascii belt" role="img" aria-label={'Title belt: ' + p.name}>{'      ╔' + bar + '╗\n ╒════╣' + pad(top) + '╠════╕\n ╘════╣' + pad(n) + '╠════╛\n      ╚' + bar + '╝'}</pre>;
}
