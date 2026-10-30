/* The desk as the Map Board (docs/plans/desk-map-board.md, Bill 28 October 2026). Three windows, 22 / 56 / 22:
   your company on the left, the next show in the middle (the poster pinned on the road map, the night, what is already
   on the card), and what you must do on the right. One way to do each thing: a row here opens its pop-up, and the
   SPACE key on the bottom line books the show or ends the week. E.deskBoard (engine/99-desk.ts) is everything it reads,
   worked out once a draw and handed to the three windows. */
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
const all = (root: ParentNode, sel: string) => Array.prototype.slice.call(root.querySelectorAll(sel)) as HTMLElement[];

/** Each window shows what it holds. Rows marked dk-opt give way when a window runs short, highest data-p first (the
    third feed post before the first, a third one to watch before the second); then the to-dos from the bottom up,
    counted under the list. A row that gives way is marked dk-gone, so nothing is ever cut in half. */
function fitBoard() {
  all(document, '.mapboard > .wn > .bd').forEach(b => {
    const over = () => b.scrollHeight - b.clientHeight > 1, gone = (e: HTMLElement, v: boolean) => e.classList.toggle('dk-gone', v);
    const opt = all(b, '.dk-opt'), must = all(b, '.dk-row.dk-must'), grp = all(b, '.dk-grp'), left = b.querySelector('[data-t="todo-left"]') as HTMLElement | null;
    opt.concat(must, grp).forEach(e => gone(e, false));
    const count = () => { if (!left) return; const n = must.filter(e => e.classList.contains('dk-gone')).length; left.textContent = n ? 'And ' + n + ' more to do. Each comes up as this list clears.' : ''; gone(left, !n); };
    count();
    const hid: HTMLElement[] = [];
    opt.sort((a, c) => +(c.dataset.p || 0) - +(a.dataset.p || 0)).forEach(e => { if (over()) { gone(e, true); hid.push(e); } });
    // put back whatever fits again, the most wanted first (a short row hidden early may fit after a tall one went)
    for (let i = hid.length - 1; i >= 0; i--) { gone(hid[i], false); if (over()) gone(hid[i], true); }
    grp.forEach(g => gone(g, !g.querySelector('.dk-opt:not(.dk-gone)')));
    // a to-do that gives way is still owed: the first always stays, and the list says how many more are waiting
    for (let i = must.length - 1; i > 0 && over(); i--) { gone(must[i], true); count(); }
  });
}

/* ---------- left: your company ---------- */
/** The booker has no look of their own yet (Bill's answer 12 asks for one in Create a Player): a drawn figure made from their name. */
function bookerFig(): W { const S = G.S, n = (S.booker && S.booker.name) || 'You'; return { id: 7000 + (n.charCodeAt(0) || 0), name: n, g: 'M', align: 'face', style: 'technician' } as any; }
function Company(p: { D: any }) {
  const S = G.S, P = me(), D = p.D, mv = E.moved(S), sh = S.queue[S.qi], left = S.queue.length - S.qi;
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
  keys: [{ t: 0, figs: { A: { x: -1.6, y: WAIST, r: 0, f: 1, z: 0.4, p: {} }, B: { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} }, C: { x: 1.6, y: WAIST, r: 0, f: -1, z: 0.4, p: {} } }, props: [], cam: { x: 0, y: -0.05, z: 1.3 } }] } as any;
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
function NextShow(p: { D: any }) {
  const S = G.S, D = p.D, R = E.road(S), sh = S.queue[S.qi], left = S.queue.length - S.qi, done = weekDone(), gate = E.taskGate(S, 'book'), n = pending(), wk = E.taskGate(S, 'week');
  const hint = done ? (n || !wk.ok ? 'The week ends once the to-do list is done' : 'Every show this week has run. SPACE ends the week')
    : (gate.ok ? 'Ready: SPACE books the show' : 'Booking opens when the to-do list is done');
  const sub = R ? [D.day, R.now.big ? (R.now.kind || 'Big event') : '', 'live from ' + R.now.city].filter(Boolean).join(' · ') : '';
  // the next stop, when it is off this map: a slip at the edge of the board with an arrow (the blueprint's tour across the water)
  const nx = R && R.shape ? R.stops.find((s: any) => s.k === 'next') : null, away = nx && !R.shape.pins.some((q: any) => q.city === nx.city) ? 'Next: ' + nx.city + ' →' : '';
  return <Win title={done ? 'The week is booked' : 'Next show'} right={done ? '' : (left > 1 ? left + ' shows left this week' : 'the last show this week')} area="show" cls="dk-show" t="next">
    <div class="dk-board" data-t="road">
      {R ? <div class="dk-map"><RoadMap road={R} t="road-map" fit={mapFit(R)} tags={D.grades} away={away} /></div> : null}
      {!done && sh ? <Poster ids={D.poster} name={sh.name} sub={sub} big={!!(R && R.now.big)} /> : null}
      {R ? <Night R={R} /> : <Empty>No show is on the road yet.</Empty>}
    </div>
    <div class="dk-card" data-t="desk-card"><p class="eyebrow">On the card so far{sh ? ': ' + sh.name : ''}</p>
      {D.card.length ? D.card.map((c: any, i: number) => <p key={i} class="dk-ln"><b>{c.k}</b><span><Txt>{c.t}</Txt></span></p>) : <p class="muted">Nothing is set yet.</p>}</div>
    <div class="dk-foot"><span class="dk-opts"><Btn kind="less" t="desk-more" onClick={() => openModal({ kind: 'deskmore', k: (office() as any).more || 'week' })} label="The week in full: shows, promises, clocks, news and more">The week</Btn>
      <Btn kind="less" t="road-year" tip="The stops ahead: when, which show, where, and how many tickets are sold." onClick={() => openModal({ kind: 'roadyear' })}>Schedule</Btn></span>
      <p class={'dk-hint' + (gate.ok || done ? ' ok' : '')} data-t="book-wait">{hint}</p></div>
  </Win>;
}

/* ---------- right: to do ---------- */
/** A button's colour says what kind of thing it does (Bill's answer 4): answer blue, money yellow, everything else
    (assign, spend, go somewhere) green. Money is told by the task, never by a word in its label. */
const kindOf = (t: any): 'sm' | 'go' | undefined => t.label === 'Answer' || t.label === 'Read' ? 'sm' : (t.id === 'sponsors' || /^con-/.test(t.id) || t.id === 'tix' ? 'go' : undefined);
function LastShow(p: { L: any }) {
  const L = p.L;
  if (!L) return <div class="dk-last none" data-t="desk-last"><span class="eyebrow">Last show</span><span>No show yet. Your first one is this week.</span></div>;
  return <button type="button" class="dk-last" data-t="night-recap" aria-label={'Last show: ' + L.name + ', graded ' + L.grade + '. Open the recap.'} onClick={() => { if (E.afterShow(G.S)) openNight(); else go('history'); }}>
    <span class="eyebrow">Last show: {L.name}</span>
    <span class="dk-grade">{L.grade}</span>
    <span class="dk-lt"><b>{L.word}.</b> {num(L.att)} in. {L.h2h ? (L.h2h.won ? 'Beat ' : 'Lost to ') + L.h2h.co + ' on the night.' : <Txt>{L.line}</Txt>}</span>
    {L.motn ? <span class="dk-motn dk-opt" data-p={5}>Match of the night: {L.motn.label}, <span class="stars">{L.motn.stars}</span></span> : null}
  </button>;
}
function Feed() {
  const F: any[] = (E.feed(G.S) || []).slice(0, 3);
  if (!F.length) return <div class="dk-grp"><p class="eyebrow">New on the feed</p><p class="dk-post w dk-opt" data-p={27}>Nothing yet. The fans start posting once your first show is on the air.</p></div>;
  return <div class="dk-grp"><p class="eyebrow">New on the feed</p>{F.map((f: any, i: number) => <button type="button" key={i} class={'dk-post dk-opt' + (f.k === 'w' ? ' w' : '')} data-p={28 + i} data-t="desk-post" aria-label={f.n + ': ' + f.t + '. Open Web.'} onClick={() => go('net')}><b>{f.n}</b> <Txt>{f.t}</Txt></button>)}</div>;
}
/** One line of the to-do list, always laid out the same way: a face or a mark, up to two lines of words, and under
    them at the right the button that deals with it (and Later, where a task may wait a week). */
function Row(p: { t: string; id: string; first: boolean; must: boolean; cls?: string; p?: number; pic: any; text: any; children: any }) {
  return <div class={'dk-row' + (p.first ? ' first' : '') + (p.must ? ' dk-must' : ' dk-opt') + (p.cls ? ' ' + p.cls : '')} data-p={p.must ? undefined : p.p} data-t={p.t} data-id={p.id} data-task={p.t === 'task' ? p.id : undefined}>
    {p.pic}<span class="clamp">{p.text}</span><span class="dk-opts">{p.children}</span></div>;
}
const dot = (must: boolean) => <span class={'dk-dot' + (must ? ' must' : '')} aria-hidden="true" />;
/** The to-do list: the matters on your desk first, then this week's tasks, each with the one button that deals with it. */
function ToDo(p: { L: any }) {
  const S = G.S, open: any[] = S.inbox.filter((e: any) => !e.done).sort((a: any, b: any) => (b.head ? 1 : 0) - (a.head ? 1 : 0)), T = E.tasks(S);
  const L: any[] = T.list.filter((t: any) => (t.state === 'todo' || t.state === 'optional') && !(t.id === 'inbox' && open.length)).sort((a: any, b: any) => (a.state === 'todo' ? 0 : 1) - (b.state === 'todo' ? 0 : 1));
  const left = open.length + T.todo - (open.length && T.list.some((t: any) => t.id === 'inbox' && t.state === 'todo') ? 1 : 0), more = open.length > 3 ? open.length - 3 : 0;
  const waved: any[] = T.list.filter((t: any) => t.state === 'waved'), M = E.monthReview(S), month = M && M.unread;
  const rows = Math.min(3, open.length) + L.length + waved.length + (month ? 1 : 0);
  useFocusAfter();
  return <Win title="To do" right={<span class="dk-count" data-t="desk-count">{left ? String(left) : 'all done'}</span>} area="todo" cls="dk-todo" t="fire">
    {rows ? <div class="dk-tasks tasks" data-t="task-win"><p class="eyebrow">Before the bell</p>
      {open.slice(0, 3).map((e: any, i: number) => <Row key={e.id} t="matter" id={e.id} first={!i} must pic={e.w != null && S.w[e.w] ? <Portrait w={S.w[e.w]} /> : dot(true)}
        text={<>{e.head ? <b class="dk-head">Headline. </b> : null}{e.night ? <b class="dk-head">Last night. </b> : null}<Txt>{e.text}</Txt></>}>
        <Btn kind="sm" t="ev-open" d={i ? { id: e.id } : { id: e.id, home: '' }} onClick={() => openModal({ kind: 'matter', id: e.id })}>Answer</Btn></Row>)}
      {more ? <p class="muted dk-more">And {more} more on your desk after {more === 1 ? 'that' : 'those'}.</p> : null}
      {L.map((t: any, i: number) => <Row key={t.id} t="task" id={t.id} first={!open.length && !i} must={t.state === 'todo'} cls={'task ' + t.state} p={14 + i} pic={dot(t.state === 'todo')}
        text={<>{t.req ? <b class="dk-head">Required. </b> : null}{t.short || <Txt>{t.text}</Txt>}</>}>
        <Btn kind={kindOf(t)} t="task-go" d={!open.length && !i ? { id: t.id, v: t.id, home: '' } : { id: t.id, v: t.id }} tip={t.text} onClick={() => openTask(t)}>{t.label}</Btn>
        {t.state === 'todo' && t.waive ? <Btn kind="less" cls="dk-later" t="task-wave" d={{ v: t.id }} label={'Not this week: ' + t.text} onClick={() => act(() => { const r = E.taskWave(S, t.id); say(r.msg, { err: !r.ok }); })}>Later</Btn> : null}</Row>)}
      {month ? <Row t="desk-month" id="month" first={false} must={false} p={13} pic={dot(false)} text={<span data-t="pm-line">{M.r.label} in review: what went well, what went badly, and why.</span>}>
        <Btn kind="sm" t="pm-open" onClick={() => { act(() => { E.readMonth(S); }); openModal({ kind: 'pmmonth' }); }}>Read</Btn></Row> : null}
      {waved.map((t: any) => <Row key={t.id} t="task" id={t.id} first={false} must={false} cls="task waved" p={12} pic={dot(false)} text={<span class="muted">Not this week: {t.short || t.text}</span>}>
        <Btn kind="less" cls="dk-later" t="task-unwave" d={{ v: t.id }} onClick={() => act(() => { E.taskUnwave(S, t.id); })}>Put back</Btn></Row>)}
      <p class="muted dk-more dk-gone" data-t="todo-left" />
    </div> : <p class="dk-alldone" data-t="task-win"><span aria-hidden="true">{'✔'}</span> All done for this week.</p>}
    <div class="dk-after"><LastShow L={p.L} /><Feed /></div>
  </Win>;
}

/* The windows change height without a redraw (the notification bar comes and goes, the fonts arrive): one watcher on
   the three window bodies fits the board again. A redraw fits it from its own layout effect. */
export function Board() {
  const D = E.deskBoard(G.S);
  useLayoutEffect(fitBoard);
  useEffect(() => { const off = onBoardResize(fitBoard), f = (document as any).fonts, RO = (window as any).ResizeObserver, ro = RO ? new RO(() => fitBoard()) : null;
    if (ro) all(document, '.mapboard > .wn > .bd').forEach(b => ro.observe(b));
    if (f && f.ready) f.ready.then(fitBoard);
    return () => { off(); if (ro) ro.disconnect(); }; }, []);
  return <><Company D={D} /><NextShow D={D} /><ToDo L={D.last} /></>;
}
