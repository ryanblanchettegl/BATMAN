/* Charts and block lettering. The pie and the column chart are cut card in SVG; the rest is still drawn with characters. */
import { ComponentChildren } from 'preact';
import { GLYPH } from './glyphs';

/* The pie and the column chart are drawn as cut card (rule 2a: no dot matrix), in SVG drawn by code. */
const PIEC = ['pc0', 'pc1', 'pc2', 'pc3', 'pc4', 'pc5', 'pc6'];
const CARD = ['#d9a52a', '#2f8c8c', '#3c8a3c', '#8a4a8a', '#c23a30', '#e8dcc0', '#2c4f9a'];
/** A pie of card wedges, with a legend. Parts with a zero value are dropped. */
export function Pie(p: { parts: { n: string; v: number }[]; title?: string }) {
  const parts = p.parts.filter(x => x.v > 0), tot = parts.reduce((a, x) => a + x.v, 0);
  if (!tot) return null;
  let a0 = -Math.PI / 2;
  const wedges = parts.map((x, i) => {
    const f = x.v / tot, a1 = a0 + f * Math.PI * 2, big = f > 0.5 ? 1 : 0, r = 46, c = 50;
    const d = f >= 0.9999 ? 'M 50 4 A 46 46 0 1 1 49.99 4 Z'
      : 'M ' + c + ' ' + c + ' L ' + (c + r * Math.cos(a0)).toFixed(2) + ' ' + (c + r * Math.sin(a0)).toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + big + ' 1 ' + (c + r * Math.cos(a1)).toFixed(2) + ' ' + (c + r * Math.sin(a1)).toFixed(2) + ' Z';
    a0 = a1;
    return <path key={i} d={d} fill={CARD[i % CARD.length]} stroke="#f4eedc" stroke-width="1.4" stroke-linejoin="round" />;
  });
  const label = (p.title || 'Pie chart') + ': ' + parts.map(x => x.n + ' ' + Math.round(x.v / tot * 100) + '%').join(', ');
  return <div class="piebox" role="img" aria-label={label}>
    <svg class="pie card" viewBox="0 0 100 100" aria-hidden="true">{wedges}</svg>
    <div class="legend">{parts.map((x, i) => <div key={i}><span class={'sw ' + PIEC[i % PIEC.length]} style={{ background: CARD[i % CARD.length] }} /> {x.n} <span class="num muted">{Math.round(x.v / tot * 100)}%</span></div>)}</div>
  </div>;
}
/** A column chart of card bars: green above the line, red hanging below it; `line` is a plan drawn as a dashed line. */
export function ColChart(p: { vals: number[]; labels?: (string | number)[]; title?: string; line?: number }) {
  const vals = p.vals, n = Math.max(1, vals.length); let max = 1, min = 0;
  vals.forEach(v => { if (v > max) max = v; if (v < min) min = v; });
  if (p.line != null && p.line > max) max = p.line;
  const span = max - min || 1, H = 100, top = 4, zero = top + (max / span) * (H - top - 4), y = (v: number) => zero - v / span * (H - top - 4), W = n * 10;
  return <div class="colchart" role="img" aria-label={p.title || 'Chart'}>
    <svg viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" aria-hidden="true">
      {vals.map((v, i) => { const y0 = Math.min(zero, y(v)), h = Math.max(0.6, Math.abs(y(v) - zero)); return <rect key={i} x={i * 10 + 1.6} y={y0} width={6.8} height={h} rx="0.8" fill={v >= 0 ? '#3c8a3c' : '#c23a30'} />; })}
      <rect x="0" y={zero - 0.35} width={W} height="0.7" fill="#23232a" />
      {p.line != null && p.line > 0 ? <line x1="0" x2={W} y1={y(p.line)} y2={y(p.line)} stroke="#b8860b" stroke-width="0.9" stroke-dasharray="3 2" vector-effect="non-scaling-stroke" /> : null}
    </svg>
    {p.labels ? <div class="cl" aria-hidden="true">{p.labels.map((l, i) => <span key={i}>{l}</span>)}</div> : null}
  </div>;
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
