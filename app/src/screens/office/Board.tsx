/* The desk as the Map Board (docs/plans/desk-map-board.md, Bill 28 October 2026). Three windows, 22 / 56 / 22:
   your company on the left, the next show in the middle (the poster pinned on the road map, the night, what is already
   on the card), and what you must do on the right. One way to do each thing: a row here opens its pop-up, and the
   SPACE key on the bottom line books the show or ends the week. E.deskBoard (engine/99-desk.ts) is everything it reads. */
import { useEffect, useLayoutEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, act, me, openModal, say } from '../../store';
import { go, weekDone, pending } from '../../nav';
import { Btn, Win, Empty, Txt, RoadMap, Logo } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { onBoardResize } from '../../kit/lights';
import { Ovr } from '../../shared/ovr';
import { ScenePlayer } from '../../kit/sceneplayer';
import { WAIST } from '../../kit/scene';
import { recipeOf } from '../../kit/puppet';
import { openNight } from '../booking/run';
import { open as openTask } from './Tasks';
import { office, useFocusAfter } from './util';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const file = (id: number) => openModal({ kind: 'dossier', id });
const inWeeks = (n: number) => n <= 0 ? 'this week' : 'in ' + n + (n === 1 ? ' week' : ' weeks');

/** Each window shows what it holds. Rows marked dk-opt give way when a window runs short, highest data-p first
    (the third feed post before the first, a third one to watch before the second), so nothing is ever cut in half. */
function fitBoard() {
  document.querySelectorAll('.mapboard > .wn > .bd').forEach(b => {
    const L = Array.prototype.slice.call(b.querySelectorAll('.dk-opt')) as HTMLElement[];
    L.forEach(e => { e.style.display = ''; });
    b.querySelectorAll('.dk-grp').forEach(g => { (g as HTMLElement).style.display = ''; });
    L.sort((a, c) => +(c.dataset.p || 0) - +(a.dataset.p || 0));
    const over = () => b.scrollHeight - b.clientHeight > 1, hid: HTMLElement[] = [];
    for (const e of L) { if (!over()) break; e.style.display = 'none'; hid.push(e); }
    // then put back whatever fits again, the most wanted first (a short row hidden early may fit after a tall one went)
    for (let i = hid.length - 1; i >= 0; i--) { hid[i].style.display = ''; if (over()) hid[i].style.display = 'none'; }
    b.querySelectorAll('.dk-grp').forEach(g => { (g as HTMLElement).style.display = g.querySelector('.dk-opt:not([style*="none"])') ? '' : 'none'; });
  });
}

/* ---------- left: your company ---------- */
/** The booker has no look of their own yet (Bill's answer 12 asks for one in Create a Player): a drawn figure made from their name. */
function bookerFig(): W { const S = G.S, n = (S.booker && S.booker.name) || 'You'; return { id: 7000 + (n.charCodeAt(0) || 0), name: n, g: 'M', align: 'face', style: 'technician' } as any; }
function Company() {
  const S = G.S, P = me(), D = E.deskBoard(S), mv = E.moved(S), sh = S.queue[S.qi], left = S.queue.length - S.qi;
  return <Win title="Your company" right={<Logo of={P} size="chip" label={P.name} />} area="co" cls="dk-co" t="desk-co">
    <div class="dk-you" data-t="desk-you"><span class="dk-bk"><Portrait w={bookerFig()} /></span>
      <span><span class="eyebrow">You, the booker</span><br /><b>Level {D.lv}</b> <span class="muted">{'·'} booking power {S.bp}</span>
        <span class="muted dk-opt dk-blk" data-p={25}>{weekDone() ? 'Every show this week has run' : sh ? (left > 1 ? left + ' shows this week, ' + sh.name + ' first' : sh.name + ' is next') : ''}</span></span></div>
    <button type="button" class="dk-clip" data-t="desk-standings" aria-label="The standings by TV share. Open Overview." onClick={() => go('overview')}><span class="eyebrow">The standings: TV share</span>
      {D.table.map((x: any, i: number) => <span key={x.name} class={'dk-tr' + (x.mine ? ' me' : '') + (i === 3 && !x.mine ? ' dk-opt' : '')} data-p={i === 3 ? 12 : undefined}><span>{x.rank}</span><b>{x.mine ? x.name + ' (you)' : x.name}</b><span class="num">{x.share.toFixed(1)}%</span></span>)}</button>
    <div class="dk-nums"><p><span>This week</span><b class={mv && mv.cash.d < 0 ? 'bad' : 'good'} data-t="desk-net">{mv && mv.cash.d ? (mv.cash.d < 0 ? '-' : '+') + '$' + num(Math.abs(mv.cash.d)) : 'No show yet'}</b></p><p><span>Locker room</span><b data-t="desk-mood">{D.mood || '-'}</b></p></div>
    <p class="eyebrow">Top stars</p>
    {D.stars.map((x: any) => <button type="button" key={x.id} class="dk-st" data-t="desk-star" data-id={x.id} onClick={() => file(x.id)}><Portrait w={S.w[x.id]} /><span><b>{S.w[x.id].name}</b><br /><span class={x.hurt ? 'bad' : 'muted'}>{x.word}</span></span><Ovr w={S.w[x.id]} /></button>)}
    <div class="dk-grp"><p class="eyebrow">Ones to watch</p>
      {D.watch.slice(0, D.owner ? 2 : 3).map((x: any, i: number) => <button type="button" key={x.id} class="dk-st dk-opt" data-p={8 + i} data-t="desk-watch" data-id={x.id} onClick={() => file(x.id)}><Portrait w={S.w[x.id]} /><span><b>{S.w[x.id].name}</b><br /><span class="muted">{x.dev} {'·'} {x.ovr} now</span></span><span class="dk-up">{'▲'} rising</span></button>)}</div>
    {D.owner ? <div class="dk-own" data-t="desk-owner"><b>The owner</b>{'“'}{D.owner}{'”'}</div> : null}
    <div class="dk-ev" data-t="desk-big"><span class="eyebrow">Next big event</span> <b>{D.big.name}</b> <span>{inWeeks(D.big.in)}{D.big.city ? ', ' + D.big.city : ''}.</span>
      <span class="dk-opt muted" data-p={20}> Every show until then builds to it.</span></div>
  </Win>;
}

/* ---------- middle: the next show ---------- */
const POSTER = { v: 1 as const, id: 'dkp', name: 'The poster', when: 'any', set: 'stadium', attire: 'primary_ring' as const,
  slots: [{ id: 'A', n: '', role: 'a' as const }, { id: 'B', n: '', role: 'a' as const }, { id: 'C', n: '', role: 'a' as const }],
  keys: [{ t: 0, figs: { A: { x: -1.7, y: WAIST, r: 0, f: 1, z: 0.4, p: {} }, B: { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} }, C: { x: 1.7, y: WAIST, r: 0, f: -1, z: 0.4, p: {} } }, props: [], cam: { x: 0, y: 0.1, z: 1.08 } }] } as any;
function Poster(p: { ids: number[]; name: string; sub: string; big: boolean }) {
  const S = G.S, L = p.ids.map(id => S.w[id]).filter(Boolean) as W[];
  const cast: any = {}; ['A', 'B', 'C'].forEach((k, i) => { if (L[i]) cast[k] = recipeOf(L[i]); });
  return <figure class={'dk-poster' + (p.big ? ' gold' : '')} data-t="desk-poster">
    <figcaption class="dk-pt"><b>{p.name}</b>{p.sub ? <span class="dk-psub">{p.sub}</span> : null}</figcaption>
    {L.length ? <div class="dk-pfig"><ScenePlayer key="dkp" sc={POSTER} cast={cast} play={'dkp' + p.ids.join('.')} still fill t="desk-poster-scene" label={'The poster: ' + L.map(w => w.name).join(', ')} /></div> : null}
    <p class="dk-pn">{L.map((w, i) => <span key={w.id} class={i === 1 ? 'mid' : ''}>{w.name}</span>)}</p>
  </figure>;
}
function Night(p: { R: any }) {
  const S = G.S, N = p.R.now, x = weekDone() ? null : E.expectWords(S), sh = S.queue[S.qi], h2h: any[] = sh ? E.nightRivals(S, sh) : [];
  const bw = (() => { const B = E.buildingWords(S); return B && B.short !== 'nothing special' ? String(B.short) : ''; })();
  const venue = String(N.venue).indexOf(N.city) >= 0 ? N.venue : N.venue + ', ' + N.city;
  return <div class="dk-night" data-t="road-crowd">
    <p class="dk-tix" data-t="road-building"><b class="num">{num(N.sold)}</b> of {num(N.cap)} sold{N.sold >= N.cap ? <b class="good"> Sold out</b> : null}<span class="dk-bar" aria-hidden="true"><i style={{ width: Math.min(100, N.sold / N.cap * 100) + '%' }} /></span></p>
    <p class="dk-venue" data-t="road-city"><b>{venue}</b>{N.big ? <span class="muted">{' · $'}{num(N.seat)} a seat</span> : null}</p>
    <p data-t="road-mkt">The crowd likes <b>{N.taste}</b>.{bw ? ' ' + bw[0].toUpperCase() + bw.slice(1) + '.' : ''}</p>
    {x ? <p data-t="next-expect">They expect <b>{x.a}</b>: <b>{x.bar}</b> or better.</p> : null}
    {h2h.length ? <div class="dk-h2h" data-t="desk-h2h"><b>Head to head</b>{h2h[0].co}{'’'}s {h2h[0].n} is on the same night.</div> : null}
  </div>;
}
/** Where the state is cut on the board: the larger of the free spaces beside the poster, to the left of the night card
    or under it, for the shape this week's state has. */
function mapFit(R: any) {
  return (bx: HTMLElement) => {
    const B = bx.getBoundingClientRect(), pe = bx.closest('.dk-board'), po = pe && pe.querySelector('.dk-poster'), ni = pe && pe.querySelector('.dk-night');
    if (!B.width || !B.height) return { l: 0, t: 0, r: 1, b: 1 };
    const l = po ? (po.getBoundingClientRect().right - B.left) / B.width + 0.01 : 0, n = ni ? ni.getBoundingClientRect() : null;
    const nl = n ? (n.left - B.left) / B.width - 0.01 : 1, nb = n ? (n.bottom - B.top) / B.height + 0.01 : 0, a = R.shape ? R.shape.w / R.shape.h : 1;
    const k = (f: any) => Math.min((f.r - f.l) * B.width / a, (f.b - f.t) * B.height);
    const beside = { l, t: 0, r: nl, b: 1 }, under = { l, t: nb, r: 1, b: 1 };
    return k(under) >= k(beside) ? under : beside;
  };
}
function NextShow() {
  const S = G.S, D = E.deskBoard(S), R = E.road(S), sh = S.queue[S.qi], left = S.queue.length - S.qi, done = weekDone(), gate = E.taskGate(S, 'book'), n = pending(), wk = E.taskGate(S, 'week');
  const hint = done ? (n || !wk.ok ? 'The week ends once the to-do list is done' : 'Every show this week has run. SPACE ends the week')
    : (gate.ok ? 'Ready: SPACE books the show' : 'Booking opens when the to-do list is done');
  const sub = R ? [D.day, R.now.big ? (R.now.kind || 'Big event') : '', 'live from ' + R.now.city].filter(Boolean).join(' · ') : '';
  return <Win title={done ? 'The week is booked' : 'Next show'} right={done ? '' : (left > 1 ? left + ' shows left this week' : 'the last show this week')} area="show" cls="dk-show" t="next">
    <div class="dk-board" data-t="road">
      {R ? <div class="dk-map"><RoadMap road={R} t="road-map" fit={mapFit(R)} tags={D.grades} /></div> : null}
      {!done && sh ? <Poster ids={D.poster} name={sh.name} sub={sub} big={!!(R && R.now.big)} /> : null}
      {R ? <Night R={R} /> : <Empty>No show is on the road yet.</Empty>}
    </div>
    <div class="dk-card" data-t="desk-card"><p class="eyebrow">On the card so far{sh ? ': ' + sh.name : ''}</p>
      {D.card.length ? D.card.map((c: any, i: number) => <p key={i} class="dk-ln"><b>{c.k}</b><span><Txt>{c.t}</Txt></span></p>) : <p class="muted">Nothing is set yet.</p>}</div>
    <div class="dk-foot"><Btn kind="less" t="desk-more" onClick={() => openModal({ kind: 'deskmore', k: (office() as any).more || 'week' })} label="The week in full: shows, promises, clocks, news and more">The week</Btn>
      <p class={'dk-hint' + (gate.ok || done ? ' ok' : '')} data-t="book-wait">{hint}</p></div>
  </Win>;
}

/* ---------- right: to do ---------- */
/** A button's colour says what kind of thing it does (Bill's answer 4): answer blue, assign green, money yellow. */
const MONEY: Record<string, 1> = { sponsors: 1, contract: 1, tix: 1, deals: 1, budget: 1, house: 1 };
const kindOf = (t: any): 'sm' | 'go' | undefined => /^answer/i.test(t.label) ? 'sm' : (MONEY[t.id] || /offer|money|pay|sign|renew/i.test(t.label) ? 'go' : undefined);
function LastShow() {
  const L = E.deskBoard(G.S).last;
  if (!L) return <div class="dk-last none" data-t="desk-last"><span class="eyebrow">Last show</span><span>No show yet. Your first one is this week.</span></div>;
  return <button type="button" class="dk-last" data-t="night-recap" aria-label={'Last show: ' + L.name + ', graded ' + L.grade + '. Open the recap.'} onClick={() => { if (E.afterShow(G.S)) openNight(); else go('history'); }}>
    <span class="eyebrow">Last show: {L.name}</span>
    <span class="dk-grade">{L.grade}</span>
    <span class="dk-lt"><b>{L.word}.</b> {num(L.att)} in. Your share {L.share.toFixed(1)}%{L.rival ? ', ' + L.rival.name + ' ' + L.rival.share.toFixed(1) + '%' : ''}.</span>
    {L.motn ? <span class="dk-motn dk-opt" data-p={5}>Match of the night: {L.motn.label}, <span class="stars">{L.motn.stars}</span></span> : null}
  </button>;
}
function Feed() {
  const F: any[] = (E.feed(G.S) || []).slice(0, 3);
  if (!F.length) return <div class="dk-grp"><p class="eyebrow">New on the feed</p><p class="muted dk-opt" data-p={27}>Nothing yet. The fans start posting once your first show is on the air.</p></div>;
  return <div class="dk-grp"><p class="eyebrow">New on the feed</p>{F.map((f: any, i: number) => <button type="button" key={i} class={'dk-post dk-opt' + (f.k === 'w' ? ' w' : '')} data-p={28 + i} data-t="desk-post" aria-label={f.n + ': ' + f.t + '. Open Web.'} onClick={() => go('net')}><b>{f.n}</b> <Txt>{f.t}</Txt></button>)}</div>;
}
/** The to-do list: the matters on your desk first, then this week's tasks, each with the one button that deals with it.
    A task that may wait a week keeps its Later, which is a different thing from doing it. */
function ToDo() {
  const S = G.S, open: any[] = S.inbox.filter((e: any) => !e.done).sort((a: any, b: any) => (b.head ? 1 : 0) - (a.head ? 1 : 0)), T = E.tasks(S);
  const L: any[] = T.list.filter((t: any) => (t.state === 'todo' || t.state === 'optional') && !(t.id === 'inbox' && open.length)).sort((a: any, b: any) => (a.state === 'todo' ? 0 : 1) - (b.state === 'todo' ? 0 : 1));
  const left = open.length + T.todo - (open.length && T.list.some((t: any) => t.id === 'inbox' && t.state === 'todo') ? 1 : 0), more = open.length > 3 ? open.length - 3 : 0;
  useFocusAfter();
  const waved: any[] = T.list.filter((t: any) => t.state === 'waved'), M = E.monthReview(S), month = M && M.unread;
  const rows = open.slice(0, 3).length + L.length + waved.length + (month ? 1 : 0);
  return <Win title="To do" right={<span class="dk-count" data-t="desk-count">{left ? String(left) : 'all done'}</span>} area="todo" cls="dk-todo" t="fire">
    {rows ? <div class="dk-tasks tasks" data-t="task-win"><p class="eyebrow">Before the bell</p>
      {open.slice(0, 3).map((e: any, i: number) => <div key={e.id} class={'dk-row' + (i ? '' : ' first')} data-t="matter" data-id={e.id}>
        {e.w != null && S.w[e.w] ? <Portrait w={S.w[e.w]} /> : <span class="dk-dot must" aria-hidden="true" />}
        <span class="clamp">{e.head ? <b class="dk-head">Headline. </b> : null}{e.night ? <b class="dk-head">Last night. </b> : null}<Txt>{e.text}</Txt></span>
        <Btn kind="sm" t="ev-open" d={{ id: e.id }} onClick={() => openModal({ kind: 'matter', id: e.id })}>Answer</Btn></div>)}
      {more ? <p class="muted dk-more">And {more} more on your desk after {more === 1 ? 'that' : 'those'}.</p> : null}
      {L.map((t: any, i: number) => <div key={t.id} class={'dk-row task' + (!open.length && !i ? ' first' : '') + (t.state === 'todo' && t.waive ? ' two' : '') + (t.state === 'optional' ? ' dk-opt' : '')} data-p={t.state === 'optional' ? 14 + i : undefined} data-t="task" data-id={t.id} data-task={t.id}>
        <span class={'dk-dot' + (t.state === 'todo' ? ' must' : '')} aria-hidden="true" />
        <span class="clamp" title={t.text}>{t.short || <Txt>{t.text}</Txt>}</span>
        <span class="dk-opts"><Btn kind={kindOf(t)} t="task-go" d={{ id: t.id, v: t.id }} tip={t.text} onClick={() => openTask(t)}>{t.label}</Btn>
          {t.state === 'todo' && t.waive ? <Btn kind="less" cls="dk-later" t="task-wave" d={{ v: t.id }} label={'Not this week: ' + t.text} onClick={() => act(() => { const r = E.taskWave(S, t.id); say(r.msg, { err: !r.ok }); })}>Later</Btn> : null}</span></div>)}
      {month ? <div class="dk-row task dk-opt" data-p={13} data-t="desk-month"><span class="dk-dot" aria-hidden="true" />
        <span class="clamp" data-t="pm-line">{M.r.label} in review: what went well, what went badly, and why.</span>
        <span class="dk-opts"><Btn kind="sm" t="pm-open" onClick={() => { act(() => { E.readMonth(S); }); openModal({ kind: 'pmmonth' }); }}>Read</Btn></span></div> : null}
      {waved.map((t: any) => <div key={t.id} class="dk-row task waved dk-opt" data-p={12} data-t="task" data-id={t.id} data-task={t.id}><span class="dk-dot" aria-hidden="true" />
        <span class="clamp muted" title={t.text}>Not this week: {t.short || t.text}</span>
        <span class="dk-opts"><Btn kind="less" cls="dk-later" t="task-unwave" d={{ v: t.id }} onClick={() => act(() => { E.taskUnwave(S, t.id); })}>Put back</Btn></span></div>)}
    </div> : <p class="dk-alldone" data-t="task-win"><span aria-hidden="true">{'✔'}</span> All done for this week.</p>}
    <LastShow />
    <Feed />
  </Win>;
}

/* The windows change height without a redraw (the notification bar comes and goes, the fonts arrive, a portrait is
   drawn): one watcher fits the board again whenever a window or anything in it changes size. */
let watch: any = null;
function watchBoard() {
  const RO = (window as any).ResizeObserver; if (!RO) return;
  if (!watch) watch = new RO(() => fitBoard());
  document.querySelectorAll('.mapboard > .wn > .bd, .mapboard > .wn > .bd > *').forEach(e => watch.observe(e));
}
export function Board() {
  useLayoutEffect(() => { fitBoard(); watchBoard(); });
  useEffect(() => { const off = onBoardResize(fitBoard), f = (document as any).fonts;
    if (f && f.ready) f.ready.then(fitBoard);
    return () => { off(); if (watch) { watch.disconnect(); watch = null; } }; }, []);
  return <><Company /><NextShow /><ToDo /></>;
}
