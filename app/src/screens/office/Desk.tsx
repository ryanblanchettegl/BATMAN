/* The desk, the hub of the game, as four windows on one screen (docs/mockups/final/final-1-desk.png).
   The road runs across the top: the map, this week's city and building, the crowd, and the stops behind and ahead.
   Under it: what needs an answer, this week's tasks, and the next show. Everything else the old desk held (the week's
   shows, promises, what is worth knowing, the clocks, the news, what has been answered) is one button away, in the
   pop-up "The week in full". Cash, popularity and booking power are on the bottom line. */
import { ComponentChildren } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, ui, me, act, openModal, closeModal, plural, view, Modal } from '../../store';
import { go, weekDone, pending } from '../../nav';
import { book, endWeek } from '../../flow';
import { Btn, Meter, Name, CheckLine, Empty, Dial, dataAttrs, Txt, Tag, Tabs, Window, Desktop, Win, Group, Line, RoadMap, LightText, LightPic, brandName } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { ScheduleList, QuestList } from '../../shared/week';
import { openNight } from '../booking/run';
import { Tasks } from './Tasks';
import { office, useFocusAfter } from './util';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const weeks = (n: number) => n <= 0 ? 'this week' : (n === 1 ? 'a week ago' : n + ' weeks ago');

/** Things the player should know about before booking: money trouble, injuries, contracts, strain. */
function alerts(): ComponentChildren[] {
  const S = G.S, P = me(), R: W[] = E.rosterOf(S, P.id), out: ComponentChildren[] = [], byOvr = (a: W, b: W) => b.ovr - a.ovr;
  if (P.neg > 0) out.push(<span class="bad">Cash has been negative for {P.neg} {plural(P.neg, 'week')}. Six in a row ends the game.</span>);
  R.filter(w => w.inj > 0).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} /> is injured: {w.inj} {plural(w.inj, 'week')} left.</>));
  R.filter(w => w.con <= 8).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} />{'’'}s contract ends in {Math.max(0, w.con)} {w.con === 1 ? 'week' : 'weeks'}.</>));
  R.filter(w => (w.stress || 0) >= 60).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is under strain (stress {Math.round(w.stress)}).</>));
  R.filter(w => w.morale < 40).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is unhappy (morale {Math.round(w.morale)}).</>));
  return out;
}

/* ---------- the road ---------- */
const CHIP: Record<string, string> = { past: '#ff5555', now: '#ffff55', next: '#ff55ff', far: '#ffffff' };
/** The line of lights under the map: the city, the show, the building and the tickets, as much as there is room for. */
function ticker(N: any): [string, string][] {
  const room = document.documentElement.getAttribute('data-screen') === 'tablet' ? 46 : 66, sep: [string, string] = [' · ', '#777777'];
  const bits: [string, string][] = [[N.city, '#55ffff'], [N.show, '#ffff55'], [num(N.sold) + ' sold', '#55ff55'], [N.venue.slice(N.city.length + 1), '#ffffff'], ...(N.sold >= N.cap ? [['Sold out ★', '#ffff55'] as [string, string]] : [[num(N.cap - N.sold) + ' to a sell-out', '#ff5555'] as [string, string]])];
  const out: [string, string][] = []; let n = 0;
  for (const b of bits) { const add = b[0].length + (out.length ? 3 : 0); if (out.length && n + add > room) continue; if (out.length) out.push(sep); out.push([b[0].slice(0, room), b[1]]); n += add; }
  return out;
}
function Road() {
  const S = G.S, R = E.road(S), date = E.cal(S.week).label;
  if (!R) return <Win title="The road" right={date} cls="road" area="road" t="road"><Empty>No show is on the road yet.</Empty></Win>;
  const N = R.now, h = Math.min(2, N.home.length), past: any[] = R.stops.filter((s: any) => s.k === 'past').slice(h === 2 ? -2 : -3), ahead: any[] = R.stops.filter((s: any) => s.k !== 'past').slice(0, Math.min(4, (h === 2 ? 5 : 6) - past.length));
  const offMap = (s: any) => R.map && s.x == null ? <span class="muted"> {'·'} off this map</span> : null;
  return <Win title={R.mapName ? 'The road: ' + R.mapName : 'The road'} right={date} cls="road" area="road" t="road">
    <div class="r3">
      <RoadMap road={R} t="road-map" />
      <div class="rmid">
        <p class="bl big one" data-t="road-city">{N.city.toUpperCase()}{N.land ? ', ' + N.land.toUpperCase() : ''}</p>
        <p class="one" data-t="road-show"><b>{N.venue}</b>{N.big ? <> <Tag kind="gold">Big event</Tag></> : null} <span class="muted">{'·'} {N.later ? 'next week. Every show this week has run.' : (N.left > 1 ? 'the first of ' + N.left + ' shows left this week' : 'the last show this week')}</span></p>
        <Group title="The building" t="road-building">
          <Line label="Sold" w={12}><b class="bl">{num(N.sold)}</b> of {num(N.cap)} <Meter v={N.sold / N.cap * 100} n={8} kind={N.sold >= N.cap ? 'au' : 'cool'} />{N.sold >= N.cap ? <b class="good"> Sold out</b> : null}</Line>
          <Line label="This week" w={12}>{N.wk > 0 ? <span class="good">{'▲'} {num(N.wk)} sold</span> : <span class="muted">Nothing sold yet</span>}</Line>
          <Line label="Gate so far" w={12}>${num(N.gate)} <span class="muted">at ${num(N.seat)} a seat</span></Line>
        </Group>
        <Group title="The crowd" t="road-crowd">
          <Line label="Likes" w={12}>{N.taste.charAt(0).toUpperCase() + N.taste.slice(1)}.{N.tour ? <span class="muted"> On tour in {N.tour}.</span> : null}</Line>
          <Line label="Last here" w={12}>{N.last ? <>{weeks(N.last.ago).replace(/^a/, 'A')}, {/^[AF]/.test(N.last.grade) ? 'an' : 'a'} <b class={/^[AB]/.test(N.last.grade) ? 'good' : 'bad'}>{N.last.grade}</b>{N.last.so ? ', sold out' : ', ' + num(N.last.att) + ' in'}</> : <span class="muted">No night here on record</span>}</Line>
          <Line label="In town" w={12}>{N.rival ? <span class="bad">{N.rival.by} had a great night here {weeks(N.rival.ago)}</span> : <span class="muted">Nobody else lately</span>}</Line>
        </Group>
      </div>
      <div class="rright">
        <Group title="Hometown" t="road-home">
          {N.home.length ? N.home.slice(0, 2).map((x: any) => <p class="one hm" key={x.id}><Portrait w={S.w[x.id]} /><Name w={S.w[x.id]} /> <span class={x.hurt ? 'bad' : 'muted'}>{x.hurt ? 'is hurt, and from here' : 'The crowd is theirs.'}</span></p>)
            : <p class="muted one">Nobody on the roster is from here.</p>}
        </Group>
        <Group title="The road" t="road-list">
          {past.map((s, i) => <p class="one" key={'p' + i}><i class="chip" style={{ background: CHIP.past }} />{s.city} <b class={/^[AB]/.test(s.grade) ? 'good' : 'bad'}>{s.grade}</b> <span class="muted">{'·'} {s.so ? 'sold out' : num(s.att)}</span></p>)}
          {ahead.map((s, i) => <p class="one" key={'a' + i}><i class="chip" style={{ background: CHIP[s.k] }} />{s.k === 'now' ? <b>{'►'} {s.city}, {N.later ? 'next week' : 'this week'}</b> : <span class="bl">{s.city}{s.k === 'next' ? ' next' : ''}{s.big ? ' · the big event' : ''}</span>}{s.k === 'now' ? null : <span class="muted"> {'·'} {s.on ? num(s.sold) + ' sold' : 'on sale in ' + s.opens + (s.opens === 1 ? ' week' : ' weeks')}</span>}{offMap(s)}</p>)}
          <p class="one muted"><i class="chip" style={{ background: '#55ff55' }} />Where you tour</p>
        </Group>
      </div>
    </div>
    <div class="rfoot">
      <span class="tick"><LightText text={ticker(N)} dot={2} t="road-ticker" /></span>
      <Btn t="road-year" onClick={() => openModal({ kind: 'roadyear' })}>The schedule</Btn>
      <Btn t="road-tix" onClick={() => openModal({ kind: 'mng', k: 'manage', v: 'tix' })}>Ticket prices</Btn>
    </div>
  </Win>;
}
/** The stops ahead, in a pop-up: when, which show, where, and how big a building it is. */
export function RoadYearWindow() {
  const S = G.S, L: any[] = E.roadAhead(S, 16), R: string[] = E.roadRoute(S);
  return <Window title="The schedule" wide ok="Done">
    <p>Your shows go from city to city in a loop, the nearest city next. The building is booked on what you draw today. A television show goes on sale four weeks out, a big event eight; Soon means not on sale yet.</p>
    <table class="mt1" data-t="road-ahead"><thead><tr><th>When</th><th>Show</th><th>City</th><th class="r">Sold</th><th class="r">Holds</th></tr></thead>
      <tbody>{L.map((a, i) => <tr key={i}><td>{a.when}</td><td>{a.show}{a.big ? <> <Tag kind="gold">Big event</Tag></> : null}</td><td><b>{a.city}</b></td><td class="r num">{a.on ? num(a.sold) : 'Soon'}</td><td class="r num">{num(a.cap)}</td></tr>)}</tbody></table>
    <p class="muted mt1">The loop: {R.join(', ')}.</p>
  </Window>;
}

/* ---------- on your desk: what needs an answer ---------- */
function OnDesk() {
  const S = G.S, open: any[] = S.inbox.filter((e: any) => !e.done), done = S.inbox.length - open.length, A = alerts();
  const room = open.length ? (open.length === 1 ? 2 : 0) : 4, more = (k: string) => openModal({ kind: 'deskmore', k });
  useFocusAfter();
  return <Win title={open.length ? 'On your desk: ' + open.length + ' to answer' : 'On your desk'} right={open.length ? '' : (done ? done + ' answered' : '')} tone={open.length ? 'hot' : undefined} cls="ondesk" area="fire" t="fire">
    {open.slice(0, 3).map(e => <div class="mat" key={e.id} data-t="matter" data-id={e.id}>
      <p class={'clamp' + (open.length < 3 ? ' c3' : '')}>{e.night ? <Tag kind="bad">Last night</Tag> : null}<Txt>{e.text}</Txt></p>
      <Btn t="ev-open" d={{ id: e.id }} onClick={() => openModal({ kind: 'matter', id: e.id })}>Answer</Btn>
    </div>)}
    {open.length > 3 ? <p class="muted one">And {open.length - 3} more after {open.length - 3 === 1 ? 'that' : 'those'}.</p> : null}
    {!open.length && !A.length ? <p class="good">Nothing is waiting for an answer.</p> : null}
    {room && A.length ? <div class="know" data-t="know">
      <p class={open.length ? 'hd' : 'good'}>{open.length ? 'Worth knowing' : 'Nothing needs an answer. Worth knowing:'}</p>
      {A.slice(0, room).map((a, i) => <p class="one" key={i}>{a}</p>)}
      {A.length > room ? <p class="one"><Btn kind="sm" t="know-more" onClick={() => more('know')}>{A.length - room} more</Btn></p> : null}
    </div> : null}
  </Win>;
}
/** One matter from the inbox, in a pop-up: the whole of it, the chance of each attempt, and a button for each answer.
    Once it is answered the same window says what happened, and offers the next one. */
export function MatterWindow(p: { m: Modal }) {
  const S = G.S, e: any = S.inbox.find((x: any) => x.id === p.m.id);
  if (!e) return <Window title="On your desk"><Empty>That matter is closed.</Empty></Window>;
  const next: any = S.inbox.find((x: any) => !x.done && x.id !== e.id);
  if (e.done) return <Window title="On your desk" wide ok={next ? 'Back to the desk' : 'Done'} footer={next ? <Btn kind="go" t="ev-next" d={{ home: '' }} onClick={() => openModal({ kind: 'matter', id: next.id })}>The next matter</Btn> : undefined}>
    <p class="muted"><Txt>{e.text}</Txt></p>
    <p class={'mt1 ' + (e.roll ? (e.roll.ok ? 'good' : 'bad') : '')} data-t="ev-result"><Txt>{e.result || 'It is dealt with.'}</Txt></p>
    {next ? <p class="muted mt1">{pending()} more on your desk.</p> : null}
  </Window>;
  return <Window title={e.night ? 'From last night' : 'On your desk'} wide ok="Not now">
    <p data-t="ev-text"><Txt>{e.text}</Txt></p>
    {e.checks ? Object.keys(e.checks).map(k => <CheckLine key={k} label={e.choices[k]} ck={e.checks[k]} />) : null}
    <div class="row mt2">{e.choices.map((c: string, i: number) => <Btn key={i} t="ev" d={{ id: e.id, c: i }} onClick={() => act(() => { E.resolveEvent(S, e.id, i); })}>{c}</Btn>)}</div>
    <p class="muted mt1">The week cannot end until this has an answer.</p>
  </Window>;
}

/* ---------- the next show ---------- */
/** The nearest countdown, so there is always something about to pay off. It goes to its page. */
function ComingUp() {
  const U: any[] = E.comingUp(G.S); if (!U.length) return null; const u = U[0];
  return <span class="coming" data-t="coming">Coming up: <button type="button" class="lnk" data-t="coming-go" data-v={u.k} onClick={() => go(u.to)}>{u.t}</button></span>;
}
function NextShow() {
  const S = G.S, sh = S.queue[S.qi], left = S.queue.length - S.qi, gate = E.taskGate(S, 'book'), B = E.backstage(S), N = E.people(S), done = weekDone();
  const x = done ? null : E.expectWords(S), n = pending(), wk = E.taskGate(S, 'week'), recap = E.afterShow(S);
  const nc = S.court ? S.court.length : 0;
  return <Win title={done ? 'The week is booked' : 'Next show'} right={done ? '' : (gate.ok ? (left > 1 ? left + ' left this week' : 'the last this week') : <span data-t="book-wait">tasks first: {gate.left.length} to do</span>)} cls="nextwin" area="next" t="next">
    {done ? <p class="lh"><LightText text="Week booked" color="#55ff55" dot={2} /></p> : <p class="lh"><LightText text={String(sh.name).slice(0, 26)} dot={2} label={sh.name} t="next-name" /></p>}
    <div class="nx">
      <div>
        {done ? <p>Every show this week has run.</p> : <>
          <p data-t="next-expect">{sh.big ? <Tag kind="gold">Big event</Tag> : null}{sh.brand ? <Tag>{brandName(me(), sh.brand)}</Tag> : null}The crowd expects <b>{x ? x.a : 'a show'}</b>{x ? <>: matches of <b>{x.bar}</b> or better.</> : '.'}</p></>}
        {done && (n || !wk.ok) ? <p class="bad one">{n ? 'Answer what is on your desk first.' : 'Finish this week’s tasks first.'}</p> : <p class="muted cu"><ComingUp /></p>}
      </div>
      <LightPic name={done ? 'bell' : 'ring'} dot={1} t="next-pic" />
    </div>
    <p class="bsl one" data-t="bs-line"><Btn t="to-backstage" onClick={() => go('backstage')}>Backstage</Btn><span class="num">{B.ap} of {B.max}</span> {plural(B.max, 'point')}{N.count ? <span class="bad"> {'·'} {N.count} waiting</span> : null}{nc ? <span class="bad"> {'·'} {nc} in court</span> : null}</p>
    <div class="nbtn">
      {done ? <Btn kind="go" t="endweek" disabled={!!n || !wk.ok} onClick={endWeek}>End the week</Btn>
        : <Btn kind="go" t="book-next" d={{ home: '' }} disabled={!gate.ok} onClick={() => go('booking')}>Book the show</Btn>}
      {recap ? <Btn kind="less" t="night-recap" onClick={openNight} label="After the show recap">Recap</Btn> : null}
      <Btn kind="less" t="desk-more" onClick={() => openModal({ kind: 'deskmore', k: (office() as any).more || 'week' })} label="The week in full">The week</Btn>
    </div>
  </Win>;
}

/* ---------- the week in full: everything else the desk keeps, in one pop-up ---------- */
function Answered() {
  const done: any[] = G.S.inbox.filter((e: any) => e.done);
  if (!done.length) return <Empty>{G.S.inbox.length ? 'Nothing answered yet. What needs you is on the desk.' : 'A quiet week in the office.'}</Empty>;
  return <ul class="list">{done.map((e: any) => <li key={e.id}><span><Txt>{e.text}</Txt>{e.result ? <><br /><span class={e.roll ? (e.roll.ok ? 'good' : 'bad') : 'muted'}><Txt>{e.result}</Txt></span></> : null}</span></li>)}</ul>;
}
const NEWSH: Record<string, string> = { title: 'Title Change', injury: 'Injury Report', contract: 'Roster Update', story: 'Storylines', money: 'Front Office', world: 'Around the Territories', you: 'Your Career' };
/** The newest `n` news items, dated like memos: your own company first, then the most recent story from elsewhere. */
function OfficeNews(p: { n: number }) {
  const S = G.S, seen: Record<number, number> = {};
  if (!S.news.length) return <Empty>No news yet. Run a show and the wire starts.</Empty>;
  const own = S.news.filter((x: any) => x.k !== 'world').slice(0, p.n - 1), away = S.news.filter((x: any) => x.k === 'world')[0];
  return <ul class="onews">{own.concat(away ? [away] : []).map((x: any) => {
    const c = E.cal(x.w), k = seen[x.w] = (seen[x.w] || 0) + 1, day = (c.wom - 1) * 7 + Math.max(1, 8 - k);
    return <li><span class="d num">{c.month + 1}/{day}/{String(c.year).slice(-2)}</span><span class="h">{NEWSH[x.k] || 'Office Memo'}</span><span><Txt>{x.t}</Txt></span></li>;
  })}</ul>;
}
/** Slow pressure you can watch build. Selecting a clock opens a window that says what moves it. */
function Clocks() {
  const C: any[] = E.clocks(G.S), st = office();
  useLayoutEffect(() => { if (st.clock && !ui.modal) st.clock = null; });
  const idle = C.filter(c => !c.why && !c.v), moving = C.filter(c => !(!c.why && !c.v)), words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const show = st.quiet ? C : moving;
  return <>
    {show.length ? <div class="clocks">{show.map(c =>
      <button type="button" class="clock" aria-label={c.n + ': ' + c.v + ' of ' + c.segs + '. ' + (c.why || '')} data-first={st.clock === c.id ? '' : undefined} {...dataAttrs('clock', { k: c.id })}
        onClick={() => { ui.flash = null; st.clock = c.id; openModal({ kind: 'clock', k: c.id }); }}>
        <Dial v={c.v} n={c.segs} bad={c.bad} />
        <span><b>{c.n}</b> <span class={'num ' + (c.bad ? (c.v >= c.segs - 2 ? 'bad' : 'muted') : 'good')}>{c.v}/{c.segs}</span><br /><span class="muted">{c.why || 'Nothing moving'}</span></span>
      </button>)}</div> : <Empty>No clock is moving this week.</Empty>}
    {idle.length ? <div class="row mt1"><Btn kind="sm" t="clocks-quiet" onClick={() => view(() => { st.quiet = !st.quiet; })}>{st.quiet ? 'Hide the quiet clocks' : (words[idle.length] || idle.length) + ' ' + plural(idle.length, 'clock') + ' ' + (idle.length === 1 ? 'is' : 'are') + ' quiet'}</Btn></div> : null}
    <p class="muted mt1">Red clocks are trouble building. Green clocks pay out when they fill. Select one to see what moves it.</p>
  </>;
}
const MORE: [string, string][] = [['week', 'This week'], ['promises', 'Promises'], ['know', 'Worth knowing'], ['clocks', 'Clocks'], ['news', 'News'], ['answered', 'Answered']];
export function DeskMoreWindow(p: { m: Modal }) {
  const st = office() as any, k: string = MORE.some(x => x[0] === p.m.k) ? p.m.k : 'week', A = k === 'know' ? alerts() : [];
  const pick = (id: string) => view(() => { st.more = id; p.m.k = id; });
  return <Window title="The week in full" wide ok="Back to the desk">
    <Tabs label="The week in full" items={MORE.map(x => ({ id: x[0], label: x[1], t: 'more-tab', d: { v: x[0] } }))} value={k} onPick={pick} />
    <div class="dmore" data-t="desk-more-body" data-v={k} onClickCapture={(ev: any) => { if (ev.target && ev.target.closest && ev.target.closest('[data-t="book-show"],[data-t="report"]')) ui.modal = null; }}>
      {k === 'week' ? <ScheduleList /> : k === 'promises' ? <QuestList /> : k === 'clocks' ? <Clocks /> : k === 'answered' ? <Answered />
        : k === 'news' ? <><OfficeNews n={7} /><div class="row mt2"><Btn kind="sm" t="tab" d={{ v: 'world' }} onClick={() => { closeModal(); go('world'); }}>All the news</Btn></div></>
        : (A.length ? <ul class="list">{A.map((a, i) => <li key={i}><span>{a}</span></li>)}</ul> : <Empty>Nothing urgent.</Empty>)}
    </div>
  </Window>;
}

export function Desk() {
  const S = G.S;
  book().night = false;   // After the show is behind us once the Office is open; its button brings it back
  return <div class="onescreen">
    <h1 class="vh">Office - Week {S.week}</h1>
    <Desktop cls="deskpage" t="desk">
      <Road />
      <OnDesk />
      <Win title={'This week’s tasks'} right={(() => { const T = E.tasks(S); return T.todo ? T.todo + ' to do' : 'all done'; })()} cls="taskwin" area="tasks" t="task-win"><Tasks /></Win>
      <NextShow />
    </Desktop>
  </div>;
}
