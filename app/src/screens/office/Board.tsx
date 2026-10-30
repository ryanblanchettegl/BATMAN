/* The desk as the Map Board (docs/plans/desk-map-board.md, Bill 28 October 2026). Three windows, 22 / 56 / 22:
   your company on the left, the next show in the middle (the poster pinned on the road map, the night, what is already
   on the card), and what you must do on the right. One way to do each thing: a row here opens its pop-up, and the
   SPACE key on the bottom line books the show or ends the week. E.deskBoard (engine/99-desk.ts) is everything it reads. */
import { E, W } from '../../engine';
import { G, me, openModal } from '../../store';
import { go, weekDone, pending } from '../../nav';
import { Btn, Win, Empty, Txt, RoadMap, Portrait, Logo } from '../../kit';
import { Ovr } from '../../shared/ovr';
import { ScenePlayer } from '../../kit/sceneplayer';
import { WAIST } from '../../kit/scene';
import { recipeOf } from '../../kit/puppet';
import { openNight } from '../booking/run';
import { open as openTask } from './Tasks';
import { useFocusAfter } from './util';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const file = (id: number) => openModal({ kind: 'dossier', id });

/* ---------- left: your company ---------- */
function Company() {
  const S = G.S, P = me(), D = E.deskBoard(S), mv = E.moved(S);
  return <Win title="Your company" right={P.short || ''} area="co" cls="dk-co" t="desk-co">
    <div class="dk-you" data-t="desk-you"><span class="dk-bk"><Logo of={P} size="badge" label={P.name} /></span>
      <span><span class="eyebrow">You, the booker</span><br /><b>Level {D.lv}</b></span></div>
    <div class="dk-clip" data-t="desk-standings"><p class="eyebrow">The standings: TV share</p>
      {D.table.map((x: any) => <p key={x.name} class={'dk-tr' + (x.mine ? ' me' : '')}><span>{x.rank}</span><b>{x.mine ? x.name + ' (you)' : x.name}</b><span class="num">{x.share.toFixed(1)}%</span></p>)}</div>
    <div class="dk-nums"><p><span>This week</span><b class={mv && mv.cash.d < 0 ? 'bad' : 'good'}>{mv ? (mv.cash.d < 0 ? '-' : '+') + '$' + num(Math.abs(mv.cash.d)) : 'First show ahead'}</b></p><p><span>Locker room</span><b>{D.mood || '-'}</b></p></div>
    <p class="eyebrow">Top stars</p>
    {D.stars.map((x: any) => <button type="button" key={x.id} class="dk-st" data-t="desk-star" data-id={x.id} onClick={() => file(x.id)}><Portrait w={S.w[x.id]} /><span><b>{S.w[x.id].name}</b><br /><span class={x.hurt ? 'bad' : 'muted'}>{x.word}</span></span><Ovr w={S.w[x.id]} /></button>)}
    <p class="eyebrow">Ones to watch</p>
    {D.watch.slice(0, 2).map((x: any) => <button type="button" key={x.id} class="dk-st" data-t="desk-watch" data-id={x.id} onClick={() => file(x.id)}><Portrait w={S.w[x.id]} /><span><b>{S.w[x.id].name}</b><br /><span class="muted">{x.dev} {'·'} {x.ovr} now</span></span><span class="dk-up">rising</span></button>)}
    {D.owner ? <div class="dk-own" data-t="desk-owner"><b>The owner</b>{'“'}{D.owner}{'”'}</div> : null}
  </Win>;
}

/* ---------- middle: the next show ---------- */
const POSTER = { v: 1 as const, id: 'dkp', name: 'The poster', when: 'any', set: 'ramp', attire: 'primary_ring' as const,
  slots: [{ id: 'A', n: '', role: 'a' as const }, { id: 'B', n: '', role: 'a' as const }, { id: 'C', n: '', role: 'a' as const }],
  keys: [{ t: 0, figs: { A: { x: -0.95, y: WAIST, r: 0, f: 1, z: 0.45, p: {} }, B: { x: 0, y: WAIST, r: 0, f: 1, z: 0.7, p: {} }, C: { x: 0.95, y: WAIST, r: 0, f: -1, z: 0.45, p: {} } }, props: [], cam: { x: 0, y: 0.1, z: 1.15 } }] } as any;
function Poster(p: { ids: number[]; name: string; big: boolean }) {
  const S = G.S, L = p.ids.map(id => S.w[id]).filter(Boolean) as W[];
  const cast: any = {}; ['A', 'B', 'C'].forEach((k, i) => { if (L[i]) cast[k] = recipeOf(L[i]); });
  return <figure class={'dk-poster' + (p.big ? ' gold' : '')} data-t="desk-poster">
    <figcaption class="dk-pt"><b>{p.name}</b></figcaption>
    {L.length ? <div class="dk-pfig"><ScenePlayer key="dkp" sc={POSTER} cast={cast} play={'dkp' + p.ids.join('.')} still fill t="desk-poster-scene" label={'The poster: ' + L.map(w => w.name).join(', ')} /></div> : null}
    <p class="dk-pn">{L.map((w, i) => <span key={w.id} class={i === 1 ? 'mid' : ''}>{w.name}</span>)}</p>
  </figure>;
}
function Night(p: { R: any }) {
  const S = G.S, N = p.R.now, x = weekDone() ? null : E.expectWords(S), sh = S.queue[S.qi], h2h: any[] = sh ? E.nightRivals(S, sh) : [];
  const bw = (() => { const B = E.buildingWords(S); return B && B.short !== 'nothing special' ? String(B.short) : ''; })();
  return <div class="dk-night" data-t="road-crowd">
    <p class="dk-tix" data-t="road-building"><b class="num">{num(N.sold)}</b> of {num(N.cap)} sold<span class="dk-bar"><i style={{ width: Math.min(100, N.sold / N.cap * 100) + '%' }} /></span></p>
    <p class="dk-venue" data-t="road-city"><b>{N.venue}</b>, {N.city}</p>
    <p data-t="road-mkt">The crowd likes <b>{N.taste}</b>.{bw ? ' ' + bw[0].toUpperCase() + bw.slice(1) + '.' : ''}</p>
    {x ? <p data-t="next-expect">They expect <b>{x.a}</b>: <b>{x.bar}</b> or better.</p> : null}
    {h2h.length ? <div class="dk-h2h" data-t="desk-h2h"><b>Head to head</b>{h2h[0].co}{'’'}s {h2h[0].n} is on the same night.</div> : null}
  </div>;
}
function NextShow() {
  const S = G.S, D = E.deskBoard(S), R = E.road(S), sh = S.queue[S.qi], left = S.queue.length - S.qi, done = weekDone(), gate = E.taskGate(S, 'book'), n = pending(), wk = E.taskGate(S, 'week');
  const hint = done ? (n || !wk.ok ? 'The week ends once the to-do list is done' : 'Every show this week has run. SPACE ends the week')
    : (gate.ok ? 'Ready: SPACE books the show' : 'Book show opens when the to-do list is done');
  return <Win title={done ? 'The week is booked' : 'Next show'} right={done ? '' : (left > 1 ? left + ' shows left this week' : 'the last show this week')} area="show" cls="dk-show" t="next">
    <div class="dk-board" data-t="road">
      {R ? <div class="dk-map"><RoadMap road={R} t="road-map" /></div> : null}
      {!done && sh ? <Poster ids={D.poster} name={sh.name} big={!!(R && R.now.big)} /> : null}
      {R ? <Night R={R} /> : <Empty>No show is on the road yet.</Empty>}
    </div>
    <div class="dk-card" data-t="desk-card"><p class="eyebrow">On the card so far{sh ? ': ' + sh.name : ''}</p>
      {D.card.length ? D.card.map((c: any, i: number) => <p key={i} class="dk-ln"><b>{c.k}</b><span><Txt>{c.t}</Txt></span></p>) : <p class="muted">Nothing is set yet.</p>}</div>
    <p class={'dk-hint' + (gate.ok || done ? ' ok' : '')} data-t="book-wait">{hint}</p>
  </Win>;
}

/* ---------- right: to do ---------- */
function LastShow() {
  const S = G.S, r: any = S.reports.find((x: any) => x.promo === S.player) || null;
  if (!r) return <div class="dk-last muted" data-t="desk-last">No show yet. Your first one is this week.</div>;
  return <button type="button" class="dk-last" data-t="night-recap" onClick={() => { if (E.afterShow(S)) openNight(); else go('history'); }}>
    <span class="eyebrow">Last show</span>
    <span class="dk-grade">{E.repGrade(r)}</span>
    <span>{r.show || ''}{r.att ? ': ' + num(r.att) + ' in' : ''}.</span>
  </button>;
}
function Feed() {
  const F: any[] = (E.feed(G.S) || []).slice(0, 3);
  if (!F.length) return null;
  return <><p class="eyebrow">New on the feed</p>{F.map((f: any, i: number) => <button type="button" key={i} class={'dk-post' + (f.k === 'w' ? ' w' : '')} data-t="desk-post" onClick={() => go('net')}><b>{f.n}</b> <Txt>{f.t}</Txt></button>)}</>;
}
/** This week's tasks, one line each with the one button that deals with it (no Later: one way to do each thing). */
function Before() {
  const S = G.S, T = E.tasks(S), L: any[] = T.list.filter((t: any) => t.state === 'todo' || t.state === 'optional').sort((a: any, b: any) => (a.state === 'todo' ? 0 : 1) - (b.state === 'todo' ? 0 : 1)), gate = E.taskGate(S, 'book');
  if (!L.length) return <p class="good" data-t="task-win">All done for this week.</p>;
  return <div class="dk-tasks tasks" data-t="task-win"><p class="eyebrow">Before the bell</p>
    {L.slice(0, 5).map((t: any) => <div key={t.id} class="dk-row task" data-t="task" data-id={t.id}><span class={'dk-dot' + (t.state === 'todo' ? ' must' : '')} /><span class="clamp"><Txt>{t.short || t.text}</Txt></span>
      <Btn kind="go" t="task-go" d={{ id: t.id }} onClick={() => openTask(t)}>{t.label}</Btn></div>)}</div>;
}
/** The next big night, at the foot of the list: the thing the weeks are building to. */
function BigNext() {
  const D = E.deskBoard(G.S);
  return <div class="dk-ev" data-t="desk-big"><span class="eyebrow">Next big event</span><br /><b>{D.big.name}</b> <span class="muted">{D.big.in <= 0 ? 'this week' : 'in ' + D.big.in + (D.big.in === 1 ? ' week' : ' weeks')}</span>{D.owner ? null : <><br /><span class="muted">Every show between now and then builds to it.</span></>}</div>;
}
function ToDo() {
  const S = G.S, open: any[] = S.inbox.filter((e: any) => !e.done), T = E.tasks(S), left = open.length + T.todo;
  useFocusAfter();
  return <Win title="To do" right={left ? String(left) : 'all done'} tone={open.length ? 'hot' : undefined} area="todo" cls="dk-todo" t="fire">
    {open.length ? <div class="dk-mat">{open.slice(0, 3).map((e: any, i: number) => <div key={e.id} class={'dk-row' + (i ? '' : ' first')} data-t="matter" data-id={e.id}>
      {e.w != null && S.w[e.w] ? <Portrait w={S.w[e.w]} /> : <span class="dk-dot" />}
      <span class="clamp"><Txt>{e.text}</Txt></span>
      <Btn kind="sm" t="ev-open" d={{ id: e.id }} onClick={() => openModal({ kind: 'matter', id: e.id })}>Answer</Btn></div>)}
      {open.length > 3 ? <p class="muted">And {open.length - 3} more.</p> : null}</div> : null}
    <Before />
    <LastShow />
    <Feed />
    <BigNext />
  </Win>;
}

export function Board() {
  return <><Company /><NextShow /><ToDo /></>;
}
