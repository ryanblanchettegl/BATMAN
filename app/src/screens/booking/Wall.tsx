/* The Clock Wall (Research/docs/plans/booking-clock-wall.md; Ryan, 26 October, D-019): the booking screen as one wall
   of time. Left, your roster: drag a wrestler onto a spot, or press them and then press the spot. Centre, the show as
   a wall from 0:00 to the end of the slot: every promo, angle and match is a piece as tall as its minutes, the time
   still open is a block at the foot, the end of the slot is a red line, and each running feud has a lane in the
   gutter that touches the pieces it is on. Right, the picked piece: who is in it, its options as tiles that open
   pop-ups (rule 6a), who fits an empty spot or what the road agent sees, and what this card changes.
   The engine answers every question (E.clock, E.fitsFor, E.cardKnock, E.looseThreads); this file only draws. */
import { ComponentChildren } from 'preact';
import { E, W } from '../../engine';
import { G, me, openModal, closeModal, view, slice, act, say, Modal } from '../../store';
import { book } from '../../flow';
import { Btn, Win, Window, Tag, teamName } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { Ovr } from '../../shared/ovr';
import { roleOf } from './Shape';
import { addPromo, addAngle, hm, CATN, TopTag, openSeg } from './Segments';
import { SegPic } from '../../shared/moment';
import { Editor, winWord } from './Editor';
import { NOTE_TABS, PreShowPane, preNow } from './Side';
import { Match, onCard, sideText, suggest, addMatch, clearCard, removeMatch, moveMatch, pickMatch, pickSeg, sel, setMatch, lockMatch } from './run';

const DOT = ' · ';
/** The wall's own view state: who is held (pressed, waiting for a spot), the roster's search and filter, the empty spot picked. */
interface WallUI { hold: number | null; q: string; f: string; spot: { s: number; p: number } | null; sugg: number }
export const wall = () => slice<WallUI>('wall', () => ({ hold: null, q: '', f: 'all', spot: null, sugg: 0 }));
const FILT: [string, string][] = [['all', 'All'], ['M', 'Men'], ['F', 'Women'], ['face', 'Faces'], ['heel', 'Heels'], ['free', 'Free'], ['teams', 'Teams']];
const LANE = ['#d33b2c', '#2a62c9', '#7a3fb0', '#1f8a4c', '#c77d12', '#c2307a'];

/* ---------- booking a person into a spot ---------- */
function firstHole(m: Match): { s: number; p: number } | null { for (let s = 0; s < m.sides.length; s++) for (let p = 0; p < m.sides[s].length; p++) if (m.sides[s][p] == null) return { s, p }; return null; }
function where(id: number): { i: number; s: number; p: number } | null {
  const c = G.S.card; for (let i = 0; i < c.length; i++) for (let s = 0; s < c[i].sides.length; s++) { const p = c[i].sides[s].indexOf(id); if (p >= 0) return { i, s, p }; } return null;
}
/** Put a wrestler on a spot. Somebody already there swaps places with them when they came from another spot (Ryan's answer 5). */
export function bookInto(id: number, i: number, s: number, p: number) {
  const S = G.S, m = S.card[i]; if (!m) return;
  const from = where(id), was = m.sides[s][p];
  if (from && from.i === i && from.s === s && from.p === p) return;
  if (from) setMatch(from.i, 'slot', was == null ? '' : String(was), { s: from.s, p: from.p });
  setMatch(i, 'slot', String(id), { s, p });
  view(() => { const w = wall(); w.hold = null; book().edit = i; sel().seg = -1; const h = firstHole(S.card[i]); w.spot = h; });
}
/** Take a wrestler off the card (dropped back on the roster, or the cross on their name). */
export function unbook(id: number) { const at = where(id); if (at) setMatch(at.i, 'slot', '', { s: at.s, p: at.p }); }
/** A wrestler dropped on the open block starts a new match with them in it. */
function newMatchWith(id: number | null) {
  addMatch();
  if (id != null) { const i = G.S.card.length - 1; unbook(id); setMatch(i, 'slot', String(id), { s: 0, p: 0 }); }
  view(() => { wall().hold = null; wall().spot = firstHole(G.S.card[G.S.card.length - 1]); });
}
/** Book a feud left off tonight: a new match between its two sides. */
function bookFeud(t: any) {
  const S = G.S, f = S.feuds.find((x: any) => x.id === t.id); if (!f) return;
  const a = f.a.filter((id: number) => !where(id)), b = f.b.filter((id: number) => !where(id));
  if (!a.length || !b.length) { say('One side of that feud is already booked tonight. Move them first.', { err: true }); return; }
  addMatch(); const i = S.card.length - 1;
  if (a.length > 1 && b.length > 1) setMatch(i, 'mt', 'tag');
  S.card[i].sides.forEach((sd: any[], k: number) => sd.forEach((_x, p) => { const id = (k ? b : a)[p]; if (id != null) setMatch(i, 'slot', String(id), { s: k, p }); }));
  view(() => { book().edit = i; sel().seg = -1; wall().spot = firstHole(S.card[i]); });
}
const dragW = (id: number) => ({ draggable: true, onDragStart: (e: DragEvent) => { e.dataTransfer?.setData('text/plain', 'w:' + id); } });
const dropOn = (fn: (id: number) => void) => ({ onDragOver: (e: DragEvent) => e.preventDefault(), onDrop: (e: DragEvent) => { e.preventDefault(); const d = e.dataTransfer?.getData('text/plain') || ''; if (d.indexOf('w:') === 0) fn(+d.slice(2)); else if (d.indexOf('m:') === 0) fn(-1 - +d.slice(2)); } });

/* ---------- left: your roster ---------- */
function Bars(p: { w: W }) {
  const b = Math.round(p.w.cond), m = Math.round(p.w.morale), c = (v: number) => v < 40 ? 'bad' : (v < 60 ? 'warn' : 'good');
  return <span class="cw-bars" aria-label={'Body ' + b + ', mood ' + m}><span><i>Body</i><b class={c(b)} style={{ width: b + '%' }} /></span><span><i>Mood</i><b class={c(m)} style={{ width: m + '%' }} /></span></span>;
}
function sub(w: W, P: any): string {
  const t = P.titles.find((x: any) => x.holders.indexOf(w.id) >= 0);
  return (w.align === 'F' ? 'Face' : 'Heel') + DOT + (t ? t.name : (E.STYLE_NAME[w.style] || ''));
}
function Roster() {
  const S = G.S, P = me(), u = wall(), on = onCard(), feudIds: Record<number, string[]> = {};
  E.looseThreads(S, []).forEach((t: any, k: number) => t.ids.forEach((id: number) => { (feudIds[id] = feudIds[id] || []).push(LANE[k % LANE.length]); }));
  const q = u.q.trim().toLowerCase();
  if (u.f === 'teams') {
    const el: Record<number, 1> = {}; E.eligible(S).forEach((w: W) => { el[w.id] = 1; });
    const T = S.teams.filter((t: any) => t.promo === P.id && t.m.every((id: number) => el[id]) && (!q || teamName(t).toLowerCase().indexOf(q) >= 0));
    return <RosterWin u={u}>{T.length ? T.map((t: any) => <div key={'t' + t.id} class="cw-wr team" {...{ draggable: true, onDragStart: (e: DragEvent) => { e.dataTransfer?.setData('text/plain', 't:' + t.id); } }}>
      <button type="button" data-t="wall-team" data-v={t.id} onClick={() => bookTeam(t)}><span class="cw-nm"><b>{teamName(t)}</b><small>{t.m.map((id: number) => S.w[id].name).join(' and ')}</small></span></button></div>)
      : <p class="muted">No regular team is free for this show.</p>}</RosterWin>;
  }
  const L: W[] = E.eligible(S).filter((w: W) => (u.f === 'all' || (u.f === 'M' || u.f === 'F' ? w.g === u.f : u.f === 'face' ? w.align === 'F' : u.f === 'heel' ? w.align === 'H' : !on[w.id])) && (!q || w.name.toLowerCase().indexOf(q) >= 0))
    .sort((a: W, b: W) => (on[a.id] ? 1 : 0) - (on[b.id] ? 1 : 0) || E.overallOf(b) - E.overallOf(a));
  return <RosterWin u={u}>{L.map(w => <div key={w.id} class={'cw-wr' + (on[w.id] ? ' booked' : '') + (u.hold === w.id ? ' held' : '') + (w.align === 'F' ? ' face' : ' heel')} {...dragW(w.id)}>
    <button type="button" data-t="wall-wr" data-v={w.id} aria-pressed={u.hold === w.id} onClick={() => view(() => { u.hold = u.hold === w.id ? null : w.id; })}>
      <span class="cw-bust"><Portrait w={w} /><Ovr w={w} /></span>
      <span class="cw-nm"><b>{w.name}</b><small>{sub(w, P)}</small>{feudIds[w.id] ? <span class="cw-dots">{feudIds[w.id].map((c, k) => <i key={k} style={{ background: c }} />)}</span> : null}</span>
      <Bars w={w} />{on[w.id] ? <span class="cw-stamp">booked</span> : null}
    </button></div>)}</RosterWin>;
}
function bookTeam(t: any) {
  const b = book(), i = b.edit, m = G.S.card[i];
  if (!m || m.mt !== 'tag') { say('Pick a tag match on the wall first, then the team.', { err: true }); return; }
  const k = m.sides.findIndex((s: any[]) => s.some(id => id == null)); setMatch(i, 'team', String(t.id), { s: k < 0 ? 1 : k });
}
function RosterWin(p: { u: WallUI; children: ComponentChildren }) {
  const u = p.u, n = E.eligible(G.S).filter((w: W) => !onCard()[w.id]).length;
  return <Win cls="cw-roster" title="Your roster" right={n + ' free'} t="wall-roster">
    <input class="cw-q" type="search" data-t="wall-search" placeholder="Search the roster" aria-label="Search the roster" value={u.q} onInput={e => view(() => { u.q = (e.target as HTMLInputElement).value; })} />
    <div class="cw-chips" role="group" aria-label="Show">{FILT.map(f => <button key={f[0]} type="button" class={'cw-chip' + (u.f === f[0] ? ' on' : '')} aria-pressed={u.f === f[0]} data-t="wall-filter" data-v={f[0]} onClick={() => view(() => { u.f = f[0]; })}>{f[1]}</button>)}</div>
    <div class="cw-list" {...dropOn(id => { if (id >= 0) unbook(id); })}>{p.children}</div>
    <p class="cw-hint muted">{u.hold != null ? 'Now press a spot on the wall, or the open block for a new match.' : 'Drag or press a wrestler, then a spot.'}</p>
  </Win>;
}

/* ---------- centre: the wall ---------- */
interface Piece { key: string; at: number; mins: number; kind: 'match' | 'seg' | 'plan'; i?: number; slot?: number; top?: number }
function Name(p: { id: number | null; i: number; s: number; q: number }) {
  const S = G.S, u = wall(), id = p.id;
  const fill = () => { if (u.hold != null) bookInto(u.hold, p.i, p.s, p.q); else view(() => { book().edit = p.i; sel().seg = -1; u.spot = { s: p.s, p: p.q }; }); };
  const drop = dropOn(x => { if (x >= 0) bookInto(x, p.i, p.s, p.q); });
  if (id == null) return <button type="button" class={'cw-hole' + (u.hold != null ? ' ready' : '')} data-t="wall-hole" data-v={p.i + ':' + p.s + ':' + p.q} onClick={fill} {...drop}>{u.hold != null ? 'put ' + S.w[u.hold].name + ' here' : '+ someone'}</button>;
  const w = S.w[id];
  return <span class={'cw-name ' + (w.align === 'F' ? 'face' : 'heel')} {...dragW(id)} {...drop}>
    <button type="button" class="cw-nb" data-t="wall-name" data-v={id} onClick={fill}>{w.name}</button>
    <button type="button" class="cw-x" data-t="wall-unbook" data-v={id} aria-label={'Take ' + w.name + ' off the card'} onClick={() => unbook(id)}>✕</button>
  </span>;
}
function MatchBody(p: { i: number; n: number; flags: any[]; thin: boolean; tall: boolean }) {
  const S = G.S, P = me(), m: Match = S.card[p.i], t = m.title ? P.titles.find((x: any) => x.id === m.title) : null;
  const names = <span class="cw-names">{m.sides.map((s: any[], k: number) => <span key={k} class="cw-side">{k ? <span class="cw-vs">{m.mt === 'br' ? '' : 'vs'}</span> : null}{s.map((id, q) => <>{q ? <span class="cw-amp">&amp;</span> : null}<Name key={q} id={id} i={p.i} s={k} q={q} /></>)}</span>)}</span>;
  const role = roleOf(p.i, p.n);
  const tags = <span class="cw-tags">{E.MT[m.mt].n}{m.stip !== 'std' ? DOT + E.STIP[m.stip].n : ''}{t ? <>{DOT}<span class="gold">{t.name}</span></> : null}{m.lock ? <>{DOT}<span class="warn" data-t="row-lock">Locked</span></> : null}{p.thin && p.flags.length ? <Tag kind="warn">+{p.flags.length}</Tag> : p.flags.map((f: any, k: number) => <Tag key={k} kind={f.k === 'bad' ? 'bad' : (f.k === 'good' ? 'good' : 'warn')}>{f.t}</Tag>)}</span>;
  const say = p.tall ? handsLine(p.i, p.flags) : null;
  return <>{!p.thin && <span class="cw-role">{role || 'Match ' + (p.i + 1)}</span>}{names}{tags}{say ? <span class="cw-hand" data-t="wall-hands">{say}</span> : null}</>;
}
/** One handwritten line on a piece of 15 minutes or more: the story it moves, a risk the agent sees, or what it still needs. */
function handsLine(i: number, flags: any[]): string | null {
  const S = G.S, m = S.card[i];
  if (!m.sides.every((s: any[]) => s.every(id => id != null))) return 'Hands the show: nothing yet. It needs names.';
  const f = E.matchFeud(S, m);
  if (f) { const pl = E.feudPlan(S, f); return 'Hands the show: ' + (m.end ? 'the end of a feud' : 'the next chapter of a feud') + ' (' + String(pl.pn).toLowerCase() + ').'; }
  if (book().edit === i) return 'Hands the show: a match with no story behind it yet.';   // picked: the risks and the agent speak in the pane, not twice
  const bad = flags.find((x: any) => x.k === 'bad' || x.k === 'warn'); if (bad) return bad.x;
  if (book().edit === i) return null;   // picked: the agent speaks in the pane beside the wall, not twice
  const rd = E.agentReads(S)[i]; return rd && rd.lines[0] ? 'Agent: “' + rd.lines[0].t + '”' : null;
}
function feudLanes(S: any): { id: number; c: string; n: string; at: number[] }[] {
  return S.feuds.filter((f: any) => !f.res && f.promo === S.player).slice(0, 6).map((f: any, k: number) => ({ id: f.id, c: LANE[k % LANE.length], n: f.a.map((id: number) => S.w[id].name).join(' and ') + ' / ' + f.b.map((id: number) => S.w[id].name).join(' and '),
    at: S.card.map((m: Match, i: number) => ([] as number[]).concat(...m.sides).some(id => f.a.indexOf(id) >= 0 || f.b.indexOf(id) >= 0) ? i : -1).filter((i: number) => i >= 0) }));
}
function Wall() {
  const S = G.S, b = book(), u = wall(), show = S.queue[S.qi], ck = E.clock(S), I = E.segInfo(S), n = S.card.length, s = sel();
  // a little open time still gets a block big enough to read and drop on: the wall stretches to make room for it
  let span = Math.max(ck.budget, ck.total); const pct = (m: number) => (m / span * 100) + '%';
  const FL: any[][] = n ? E.cardFlags(S) : [];
  const P: Piece[] = [];
  ck.items.forEach((x: any) => {
    if (x.t === 'match') P.push({ key: 'm' + x.i, at: x.at, mins: x.mins, kind: 'match', i: x.i, top: x.top });
    else if (x.t === 'seg') P.push({ key: 's' + x.slot, at: x.at, mins: x.mins, kind: 'seg', slot: x.slot, top: x.top });
    else if (x.t === 'plan') P.push({ key: 'plan', at: x.at, mins: x.mins, kind: 'plan' });
  });
  // a match with nobody in it yet is not on the clock: it waits at the foot of the wall, as tall as it would run
  let tail = ck.total;
  S.card.forEach((m: Match, i: number) => { if (P.some(x => x.kind === 'match' && x.i === i)) return; const mm = E.matchMins(S, m, i, n).now || 10; P.push({ key: 'm' + i, at: tail, mins: mm, kind: 'match', i }); tail += mm; });
  span = Math.max(span, tail);
  const lanes = feudLanes(S), loose = E.looseThreads(S, S.card), open = Math.max(0, ck.budget - tail), over = ck.total - ck.budget;
  const ticks: number[] = []; for (let t = 0; t <= span; t += 5) ticks.push(t);
  const crowd = E.expectWords(S, show);
  const piece = (x: Piece) => {
    const thin = x.mins <= 10, past = x.at + x.mins > ck.budget + 5;
    if (x.kind === 'match') {
      const i = x.i!, m = S.card[i], on = b.edit === i, main = i === n - 1;
      return <div key={x.key} class={'cw-pc match' + (thin ? ' thin' : '') + (on ? ' on' : '') + (main ? ' main' : '') + (x.top ? ' top' : '') + (past ? ' past' : '') + (E.matchOdds(S, m, i, n) ? '' : ' open')} style={{ top: pct(x.at), height: pct(x.mins) }}
        data-t="wall-piece" data-v={i} {...{ draggable: !m.lock, onDragStart: (e: DragEvent) => { if ((e.target as HTMLElement).closest('.cw-name')) return; e.dataTransfer?.setData('text/plain', 'm:' + i); } }}
        onDragOver={(e: DragEvent) => e.preventDefault()} onDrop={(e: DragEvent) => { const d = e.dataTransfer?.getData('text/plain') || ''; if (d.indexOf('m:') === 0) { e.preventDefault(); const f = +d.slice(2); if (f !== i) moveMatchTo2(f, i); } else if (d.indexOf('t:') === 0) { e.preventDefault(); view(() => { b.edit = i; }); bookTeam(S.teams.find((t: any) => t.id === +d.slice(2))); } }}>
        <button type="button" class="cw-grip" data-t="edit" data-v={i} aria-label={'Pick match ' + (i + 1)} aria-pressed={on} onClick={() => { pickMatch(i); view(() => { u.spot = on ? null : firstHole(m); }); }}><span class="cw-at">{hm(x.at)}</span><span aria-hidden="true">⠿</span></button>
        <div class="cw-in"><MatchBody i={i} n={n} flags={FL[i] || []} thin={thin} tall={x.mins >= 20} /></div>
        <span class="cw-min">{x.mins}<small>min</small>{x.top ? <TopTag top={x.top} /> : null}</span>
      </div>;
    }
    if (x.kind === 'seg') {
      const sg = I.list[x.slot!], on = s.seg === x.slot;
      return <div key={x.key} class={'cw-pc seg' + (thin ? ' thin' : '') + (on ? ' on' : '') + (x.top ? ' top' : '') + (past ? ' past' : '')} style={{ top: pct(x.at), height: pct(x.mins) }} data-t="wall-seg" data-v={x.slot}>
        <button type="button" class="cw-grip" data-t="seg-edit" data-v={x.slot} aria-pressed={on} onClick={() => pickSeg(x.slot!)}><span class="cw-at">{hm(x.at)}</span></button>
        <div class="cw-in">{!thin && <span class="cw-role">{sg.t === 'any' ? 'Writers' : CATN[sg.t]}</span>}{sg.k === 'writers' ? <><span class="cw-names">Writers’ pick</span><span class="cw-tags">They choose the promo. Press to pick one yourself.</span></>
          : <><span class="cw-names">{sg.why ? <span class="bad">{sg.why}</span> : (sg.who.length ? sg.who.map((id: number) => S.w[id].name).join(', ') : 'The writers decide')}</span><span class="cw-tags">{E.SEGK[sg.k].n}</span></>}</div>
        <span class="cw-min">{x.mins}<small>min</small>{x.top ? <TopTag top={x.top} /> : null}</span>
      </div>;
    }
    return <div key={x.key} class="cw-pc seg thin" style={{ top: pct(x.at), height: pct(x.mins) }}><div class="cw-in"><span class="cw-names">{S.plan && S.w[S.plan.sp] ? S.w[S.plan.sp].name + ' opens the show' : 'The opening'}</span></div><span class="cw-min">{x.mins}<small>min</small>{x.top ? <TopTag top={x.top} /> : null}</span></div>;
  };
  return <Win cls="cw-wall" title={<>Book the show: <span class="hl">{show.name}</span></>} label={'Book the show: ' + show.name} right={'show ' + (S.qi + 1) + ' of ' + S.queue.length} t="book1">
    <h1 class="sr">{show.name}</h1>
    <p class="cw-info">{show.big ? 'Big event' : 'Weekly TV'}{DOT}matches of <b class="gold" data-t="expect-bar">{crowd.bar}</b> or better{DOT}booking power <b>{S.bp}</b><span class="cw-stamp crowd" data-t="expect">Crowd: {crowd.a}</span></p>
    <div class="cw-tools">
      <Btn kind="go" t="suggest" tip={u.sugg ? 'Rebuild the whole card from scratch.' : 'Fill the empty time and the empty spots, and keep what you booked.'} onClick={() => { if (u.sugg && n) suggest(); else suggestGaps(); view(() => { u.sugg++; }); }}>{u.sugg && n ? 'Suggest all' : 'Suggest'}</Btn>
      <Btn t="add" tip="Put a new match on the wall." onClick={() => newMatchWith(null)}>+ Match</Btn>
      <Btn t="add-promo" tip="Book a promo." onClick={addPromo}>+ Promo</Btn>
      <Btn t="add-angle" tip="Book an angle." onClick={addAngle}>+ Angle</Btn>
      {(n > 0 || ck.total > 0) && <Btn kind="less" t="clear" tip="Take everything off the wall and start again." onClick={() => { clearCard(); view(() => { u.sugg = 0; }); }}>Clear</Btn>}
      <span class={'cw-time ' + (ck.over || ck.short ? 'bad' : (ck.light ? 'warn' : 'good'))} data-t="clock" data-v={ck.over ? 'over' : (ck.short ? 'short' : (ck.light ? 'light' : 'ok'))}>{hm(ck.total)} of {hm(ck.budget)}{DOT}{!n && !ck.total ? ck.budget / 60 + ' hours to fill' : over > 0 ? over + ' min over' : open + ' min open'}</span>
    </div>
    <p class="cw-sub"><span data-t="opening" data-v={ck.open.k}>{ck.open.n}</span> <button type="button" class="lnk" data-t="open-guide" onClick={() => openModal({ kind: 'openguide' })}>Ways to open</button>
      {['match', 'promo', 'angle'].map(k => <span key={k} class="cw-cat" data-t={'cat-' + k}><b>{ck.cats[k].n}</b> {ck.cats[k].n === 1 ? k : (k === 'match' ? 'matches' : k + 's')}</span>)}</p>
    <div class="cw-board">
      <div class="cw-ruler" aria-hidden="true">{ticks.map(t => <span key={t} class={'cw-tick' + (t % 15 ? '' : ' big') + (t + 5 > span ? ' last' : '')} style={{ top: pct(t) }}>{t % 15 ? '' : hm(t)}</span>)}</div>
      <div class="cw-col">
        {P.map(piece)}
        {open > 0 && <div class={'cw-open' + (u.hold != null ? ' ready' : '') + (open < 15 ? ' thin' : '') + (open < 3 ? ' sliver' : '')} style={{ top: pct(tail), height: pct(open) }} {...dropOn(id => newMatchWith(id >= 0 ? id : null))}>
          <button type="button" class="cw-openb" data-t="wall-open" onClick={() => newMatchWith(u.hold)}><b>{open} min open</b><span>{u.hold != null ? 'press to start a match with ' + S.w[u.hold].name : 'drop a wrestler here for a new match'}</span></button>
        </div>}
        <div class="cw-end" style={{ top: pct(ck.budget) }} role="img" aria-label={hm(ck.budget) + ': off the air'} />
      </div>
      {lanes.length ? <div class="cw-gutter" aria-label="Feuds"><span class="cw-gh">Feuds</span><div class="cw-lanes">{lanes.map((l, k) => {
        const pcs = l.at.map(i => P.find(x => x.kind === 'match' && x.i === i)).filter(Boolean) as Piece[];
        const a = pcs.length ? pcs[0].at + pcs[0].mins / 2 : 0, z = pcs.length ? pcs[pcs.length - 1].at + pcs[pcs.length - 1].mins / 2 : 0;
        return <button key={l.id} type="button" class={'cw-lane' + (pcs.length ? '' : ' off')} style={{ '--lc': l.c, '--reach': (k * 1.9 + 1.9) + 'em' } as any} data-t="wall-lane" data-v={l.id} aria-label={'Feud: ' + l.n + (pcs.length ? '' : ', not on the card')} onClick={() => openModal({ kind: 'threads', id: l.id })}>
          <span class="cw-ln">{l.n}</span>
          {pcs.length > 0 && <i class="cw-run" style={{ top: 0, height: pct(z) }} />}
          {pcs.map(x => <i key={x.key} class="cw-dot" style={{ top: pct(x.at + x.mins / 2) }} />)}
        </button>;
      })}</div></div> : null}
    </div>
    {loose.length ? <div class="cw-loose" data-t="wall-loose"><span class="cw-lh">Left off tonight</span>{loose.slice(0, 3).map((t: any) => <button key={t.id} type="button" class="cw-note" data-t="wall-thread" data-v={t.id} onClick={() => bookFeud(t)}><b>{t.a} vs {t.b}</b><span>{t.phase}. {t.stakes}</span></button>)}
      {loose.length > 3 && <button type="button" class="cw-note more" data-t="wall-threads" onClick={() => openModal({ kind: 'threads' })}>+{loose.length - 3} more</button>}</div> : null}
  </Win>;
}
function moveMatchTo2(f: number, i: number) { const b = book(), was = G.S.card[f]; act(() => { const r = E.moveMatchTo(G.S, f, i); if (!r.ok && r.msg) say(r.msg, { err: true }); b.edit = G.S.card.indexOf(was); }); }
/** Suggest's first press fills what is empty and keeps what was booked (Ryan's answer 6). */
function suggestGaps() { act(() => { E.suggestGaps(G.S); }); }

/* ---------- right: the picked piece ---------- */
const TILES: [string, string][] = [['type', 'Type'], ['length', 'Length'], ['rules', 'Rules'], ['title', 'Title'], ['ending', 'Ending'], ['finish', 'Finish']];
function tileNow(k: string, m: Match, i: number, n: number): [string, string] {
  const S = G.S, P = me(), mm = E.matchMins(S, m, i, n);
  if (k === 'type') return [E.MT[m.mt].n, m.mt === 'br' ? m.sides.length + ' entrants' : ''];
  if (k === 'length') return [({ S: 'Short', M: 'Medium', L: 'Long' } as any)[m.len], mm.now + ' min'];
  if (k === 'rules') return [E.STIP[m.stip].n, ''];
  if (k === 'title') { const t = m.title ? P.titles.find((x: any) => x.id === m.title) : null; return [t ? String(t.name).replace(/ Championship$| Title$/, '') : 'No title', t ? 'on the line' : '']; }
  if (k === 'ending') return [m.how ? E.HOWS[m.how].n : 'Story decides', ''];
  const o = E.matchOdds(S, m, i, n);
  if (m.call == null) return ['Play it out', 'free'];
  return [m.call < 0 ? 'A draw' : sideText(m.sides[m.call]) + ' wins', o ? (m.call < 0 ? o.drawCost : o.cost[m.call]) + ' booking power' : ''];
}
function Masthead(p: { m: Match; i: number }) {
  const S = G.S, m = p.m, n = S.card.length, o = E.matchOdds(S, m, p.i, n), two = m.sides.length === 2;
  const face = (s: any[]) => { const id = s.find(x => x != null); return id != null ? <span class="cw-face"><Portrait w={S.w[id]} /></span> : <span class="cw-face cw-empty" aria-hidden="true"><i>?</i></span>; };
  const side = (s: any[], k: number) => s.every(id => id == null) ? <button type="button" class="cw-hole" data-t="wall-mast-hole" onClick={() => view(() => { wall().spot = { s: k, p: 0 }; })}>open spot</button> : <b>{sideText(s)}</b>;
  return <div class="cw-mast" data-t="wall-mast">
    {two ? <>{face(m.sides[0])}<span class="cw-mn">{side(m.sides[0], 0)}<span class="cw-vs">vs</span>{side(m.sides[1], 1)}</span>{face(m.sides[1])}</> : <span class="cw-mn"><b>{E.MT[m.mt].n}</b> with {m.sides.length} sides</span>}
    {o ? <p class="cw-fav" data-t="wall-fav">{o.p[o.fav] < 0.58 ? 'The crowd sees it as about even.' : sideText(m.sides[o.fav]) + ' is ' + winWord(o.p[o.fav]) + '.'}</p> : null}
  </div>;
}
function Fits(p: { i: number }) {
  const S = G.S, u = wall(), m = S.card[p.i], h = u.spot && m.sides[u.spot.s] && m.sides[u.spot.s][u.spot.p] == null ? u.spot : firstHole(m);
  if (!h) return null;
  const L = E.fitsFor(S, S.card, p.i, h.s, 6);
  return <div class="cw-fits" data-t="wall-fits"><h3>Who fits this spot</h3>{L.length ? L.map((x: any) => <button key={x.id} type="button" class={'cw-fit' + (x.other ? ' other' : '')} data-t="wall-fit" data-v={x.id} onClick={() => bookInto(x.id, p.i, h.s, h.p)}>
    <span class="cw-bust"><Portrait w={S.w[x.id]} /><Ovr w={S.w[x.id]} /></span><span class="cw-nm"><b>{x.name}</b><span class="cw-why">{x.why.slice(0, 3).map((y: any, k: number) => <Tag key={k} kind={y.s > 0 ? 'good' : 'bad'}>{y.t.replace(/\.$/, '')}</Tag>)}{x.why.length ? null : <small class="cw-plain">{S.w[x.id].align === 'F' ? 'Face' : 'Heel'} · free tonight</small>}</span></span></button>)
    : <p class="muted">Nobody free fits this spot.</p>}</div>;
}
function Agent(p: { i: number }) {
  const rd = E.agentReads(G.S)[p.i];
  if (!rd) return null;
  return <div class="cw-agent" data-t="agent-say" data-v={p.i}><h3>The road agent, {rd.who}{rd.own ? ', on this match' : ''}</h3>{rd.lines.slice(0, 4).map((l: any, k: number) => <p key={k} class={l.s > 0 ? 'good' : (l.s < 0 ? 'bad' : 'muted')} data-src={l.src}>{'“'}{l.t}{'”'}</p>)}</div>;
}
function Knock(p: { max?: number }) {
  const max = p.max || 5;
  const RANK: Record<string, number> = { promise: 0, worn: 1, unhappy: 2, bp: 3, title: 4, on: 5, half: 6 };
  const K = E.cardKnock(G.S, G.S.card).filter((x: any) => x.kind !== 'half').sort((a: any, b: any) => RANK[a.kind] - RANK[b.kind]);
  const ico: Record<string, string> = { on: '✓', half: '·', promise: '!', worn: '!', unhappy: '!', bp: '·', title: '★' };
  return <div class="cw-knock" data-t="wall-knock"><h3>What this card changes</h3>{K.length ? K.slice(0, max).map((x: any, k: number) => <p key={k} class={'cw-k ' + x.kind}><span aria-hidden="true">{ico[x.kind]}</span> {x.text}</p>) : <p class="muted">Nothing on the card moves a story yet.</p>}
    {K.length > max && <p class="muted cw-more">and {K.length - max} more</p>}</div>;
}
/** The booking notes as a row of small buttons, each opening its pop-up (Ryan's answer 1). */
function NoteTabs() {
  const v = G.S.card.length ? E.validate(G.S, G.S.card) : null, bad = !!(v && v.errors.length && book().tried);
  return <div class="cw-notes" role="group" aria-label="Booking notes">{NOTE_TABS.map(t => <button key={t[0]} type="button" class={'cw-nt' + (bad && t[0] === 'advice' ? ' hot' : '')} data-t="bk" data-v={t[0]} onClick={() => openModal({ kind: 'notes', k: t[0] })}>{t[1]}</button>)}
    {G.S.card.length ? <button type="button" class="cw-nt" data-t="could" onClick={() => openModal({ kind: 'could' })}>Risks</button> : null}
    {E.tournActive(G.S) && E.tournActive(G.S).pend.length ? <button type="button" class="cw-nt" data-t="bk" data-v="tourn" onClick={() => openModal({ kind: 'notes', k: 'tourn' })}>Cup</button> : null}</div>;
}
/** Nothing picked: what tonight asks of the booker (rule 7a), before a piece is pressed. */
function Tonight() {
  const S = G.S, show = S.queue[S.qi], cw = E.expectWords(S, show), ck = E.clock(S), loose = E.looseThreads(S, S.card);
  const owed = (S.quests || []).filter((q: any) => q.type === 'win' && S.w[q.w]).map((q: any) => S.w[q.w].name + ' was promised a win by ' + E.cal(q.due).label + '.');
  const vac = me().titles.filter((t: any) => !t.holders.length).map((t: any) => 'The ' + t.name + ' is vacant.');
  const hot = loose.filter((t: any) => /Boiling|Going stale/.test(t.phase)).slice(0, 3);
  return <div class="cw-tonight" data-t="wall-tonight">
    <div class="cw-card"><h3>The crowd</h3><p>They expect <b>{cw.a}</b>: matches of {cw.bar} or better. {ck.budget / 60} hours to fill.</p></div>
    <div class="cw-card"><h3>Owed this week</h3>{owed.length || vac.length ? owed.concat(vac).slice(0, 4).map((x: string, k: number) => <p key={k} class="bad">! {x}</p>) : <p>Nothing is owed. The card is yours.</p>}</div>
    <div class="cw-card"><h3>Hot right now</h3>{hot.length ? hot.map((t: any) => <p key={t.id}><b>{t.a} vs {t.b}</b>: {t.phase.toLowerCase()}.</p>) : <p>No feud is boiling. A good night could light one.</p>}</div>
    {(() => { let R: any = null; try { R = E.road(S); } catch (e) { R = null; } const N = R && R.now; return N ? <div class="cw-card" data-t="wall-building"><h3>The building</h3><p><b>{N.venue}</b>{(String(N.venue).indexOf(N.city) >= 0 ? '' : ', ' + N.city) + '. ' + N.sold.toLocaleString() + ' of ' + N.cap.toLocaleString() + ' tickets sold.'}</p>
      <p>{N.last ? 'Last time here: a ' + N.last.grade + '.' : 'Our first night here.'}{N.home && N.home.length ? ' Home crowd for ' + N.home.map((h: any) => h.name).join(' and ') + '.' : ''}</p></div> : null; })()}
    {(() => { const W = E.eligible(S).filter((w: W) => w.cond < 50 || w.morale < 38).slice(0, 3); return <div class="cw-card" data-t="wall-worn"><h3>Handle with care</h3>{W.length ? W.map((w: W) => <p key={w.id} class="bad">{w.name}: {w.cond < 50 ? 'worn down' : 'unhappy'}.</p>) : <p>Everybody free tonight is fit and happy.</p>}</div>; })()}
    <p class="cw-how cw-sticky">Press a wrestler, then a spot. Or drag them. Press a piece to see it here.</p>
  </div>;
}
const loose = (S: any) => E.looseThreads(S, S.card).length;
function Picked() {
  if (preNow()) return <Win cls="cw-pick" title="Before the show" tone="hot" t="wall-pick-pane"><PreShowPane /></Win>;
  return <PickedPane />;
}
function PickedPane() {
  const S = G.S, b = book(), n = S.card.length, i = b.edit, m = S.card[i], s = sel();
  if (s.seg >= 0) { const x = E.segInfo(S).list[s.seg]; if (x) return <Win cls="cw-pick" title={x.t === 'any' ? 'The writers' : CATN[x.t]} t="wall-pick-pane">
    <div data-t="pane" data-v="seg"><p class="cw-mn"><b>{E.SEGK[x.k].n}</b></p><p>{x.who.length ? x.who.map((id: number) => S.w[id].name).join(', ') : 'The writers decide who.'}</p><p class="muted">{x.mins} minutes. {E.SEGK[x.k].d}</p>
    {x.look && x.look.read ? <p class={x.look.read.k === 'good' ? 'good' : (x.look.read.k === 'bad' ? 'bad' : 'muted')} data-t="seg-read">{x.look.read.t}</p> : null}
    {x.k !== 'writers' && x.who.length ? <SegPic k={x.k} who={x.who} /> : null}</div>
    <div class="cw-acts"><Btn t="seg-change" onClick={() => openSeg(s.seg)}>Change</Btn><Btn kind="danger" t="seg-rm" onClick={() => act(() => { const r = E.setSeg(S, s.seg, null); sel().seg = -1; say(r.msg); })}>Remove</Btn></div><Knock /><NoteTabs /></Win>; }
  if (!m) return <Win cls="cw-pick" title="Tonight" t="wall-pick-pane"><Tonight /><Knock /><NoteTabs /></Win>;
  return <Win cls="cw-pick" title={roleOf(i, n) || 'Match ' + (i + 1)} right={(i + 1) + ' of ' + n + DOT + E.matchMins(S, m, i, n).now + ' min'} t="wall-pick-pane">
    <Masthead m={m} i={i} />
    <button type="button" class={'cw-lock' + (m.lock ? ' on' : '')} data-t="wall-lock" aria-pressed={!!m.lock} onClick={() => lockMatch(i)}>{m.lock ? 'Locked in place' : 'Lock this place'}</button>
    <div class="cw-tiles">{TILES.map(t => { const v = tileNow(t[0], m, i, n); return <button key={t[0]} type="button" class="cw-tile" data-t="wall-tile" data-v={t[0]} onClick={() => openModal({ kind: 'wallopt', i, k: t[0] })}><i>{t[1]}</i><b>{v[0]}</b>{v[1] ? <small>{v[1]}</small> : null}</button>; })}</div>
    {firstHole(m) ? <Fits i={i} /> : <Agent i={i} />}
    <Knock max={12} />
    {!firstHole(m) && E.validate(S, S.card).errors.length === 0 ? <p class="cw-sticky cw-ready" data-t="wall-ready">Ready to ring the bell.{loose(S) ? ' ' + loose(S) + (loose(S) === 1 ? ' feud is' : ' feuds are') + ' left off tonight.' : ' Every feud is on the card.'}</p> : null}
    <div class="cw-acts">
      <Btn t="up" label="Move this match earlier" disabled={i === 0} onClick={() => moveMatch(i, -1)}>Earlier</Btn>
      <Btn t="down" label="Move this match later" disabled={i === n - 1} onClick={() => moveMatch(i, 1)}>Later</Btn>
      <Btn kind="danger" t="rm" onClick={() => removeMatch(i)}>Remove</Btn>
      <Btn kind="go" t="wall-next" onClick={() => view(() => { const nx = S.card.findIndex((x: Match, k: number) => k !== i && firstHole(x)); b.edit = nx >= 0 ? nx : (i + 1) % n; wall().spot = null; })}>Next</Btn>
    </div>
    <NoteTabs />
  </Win>;
}

/* ---------- pop-ups ---------- */
const OPT_N: Record<string, string> = { type: 'Type', length: 'Length', rules: 'Rules', title: 'Title', ending: 'Ending', finish: 'Finish' };
export function WallOptWindow(p: { m: Modal }) {
  const i = p.m.i as number, m = G.S.card[i];
  if (!m) return <Window title="Match" ok="Close"><p class="muted">That match is no longer on the card.</p></Window>;
  return <Window title={OPT_N[p.m.k] + ': match ' + (i + 1)} ok="Done"><Editor m={m} i={i} only={p.m.k} />{p.m.k === 'type' ? <Editor m={m} i={i} only="more" /> : null}</Window>;
}
export function ThreadsWindow(p: { m: Modal }) {
  const L = E.looseThreads(G.S, G.S.card), on = G.S.feuds.filter((f: any) => !f.res && f.promo === G.S.player).length - L.length;
  return <Window title="Every running feud" ok="Close">
    <p class="muted">{on} on the card tonight. {L.length} left off.</p>
    {L.map((t: any) => <p key={t.id} class={p.m.id === t.id ? 'hl' : undefined}><Btn t="thread-book" d={{ v: t.id }} onClick={() => { closeModal(); bookFeud(t); }}>Book it</Btn> <b>{t.a} vs {t.b}</b>: {t.phase}, heat {t.heat}. {t.stakes}</p>)}
  </Window>;
}

export function ClockWall() {
  return <div class="onescreen cw" data-t="clockwall"><div class="desktop cw-desk"><Roster /><Wall /><Picked /></div></div>;
}
