/* The desk, the hub of the game: the Map Board (docs/plans/desk-map-board.md; the page itself is Board.tsx).
   Here are its pop-ups: a matter from the inbox, the month in review, the schedule, and "The week in full", which keeps
   everything else the desk holds (the week's shows, promises, what is worth knowing, the clocks, the news, what has
   been answered, what the Director held back). Cash, popularity and booking power are on the bottom line. */
import { ComponentChildren } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, ui, me, act, openModal, closeModal, plural, view, Modal } from '../../store';
import { go, pending } from '../../nav';
import { book } from '../../flow';
import { Btn, Name, CheckLine, Empty, Dial, dataAttrs, Txt, Tag, Tabs, Window, Desktop } from '../../kit';
import { MomentPic } from '../../shared/moment';
import { ScheduleList, QuestList } from '../../shared/week';
import { Board } from './Board';
import { office } from './util';
import { openVoices } from './Windows';

const num = (v: number) => Math.round(v).toLocaleString('en-US');

/** Things the player should know about before booking: money trouble, injuries, contracts, strain. */
function alerts(): ComponentChildren[] {
  const S = G.S, P = me(), R: W[] = E.rosterOf(S, P.id), out: ComponentChildren[] = [], byOvr = (a: W, b: W) => b.ovr - a.ovr;
  if (P.neg > 0) out.push(<span class="bad">Cash has been negative for {P.neg} {plural(P.neg, 'week')}. Six in a row ends the game.</span>);
  (E.netInfo(S) as any[]).filter((n: any) => n.miss >= 2).forEach((n: any) => out.push(<span class="bad">{n.name} has missed {n.net}{'’'}s target {n.miss} weeks running. One more and an executive calls.</span>));
  R.filter(w => w.inj > 0).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} /> is injured: {w.inj} {plural(w.inj, 'week')} left.</>));
  R.filter(w => w.con <= 8).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} />{'’'}s contract ends in {Math.max(0, w.con)} {w.con === 1 ? 'week' : 'weeks'}.</>));
  R.filter(w => (w.stress || 0) >= 60).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is under strain (stress {Math.round(w.stress)}).</>));
  R.filter(w => w.morale < 40).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is unhappy (morale {Math.round(w.morale)}).</>));
  // the secrets come first among what is worth knowing: they change quietly and nothing else says so
  { const K = E.kayfabe(S); if (K.kept.length || K.prot < 60) out.unshift(<span class={K.prot < 40 ? 'bad' : undefined} data-t="kf-line">Secrets: {K.line}</span>); }
  return out;
}

/** The month in review (post-mortems): what went well, what went badly, and why. Read once, it leaves the desk. */
export function ReviewBody(p: { r: any }) {
  const r = p.r, part = (h: string, L: any[], k: string) => <div class="mt1"><p class="eyebrow">{h}</p>{L.slice(0, 4).map((x: any, i: number) => <p key={i} class={'clamp ' + k}><Txt>{x.t + (x.why ? '. ' + x.why : '')}</Txt></p>)}</div>;
  return <div data-t="pm-body">
    {r.money ? <p class={r.money.good ? 'good' : 'bad'}><Txt>{r.money.lines.join(' ')}</Txt></p> : null}
    {r.owner ? <p class="mt1"><Txt>{r.owner}</Txt></p> : null}
    {part('What went well', r.well, 'good')}{part('What went badly', r.badly, 'bad')}
  </div>;
}
export function MonthWindow(_p: { m: Modal }) {
  const S = G.S, M = E.monthReview(S);
  if (!M) return <Window title="The month in review"><Empty>The first month is not over yet.</Empty></Window>;
  return <Window title={M.r.label + ' in review'} wide ok="Done"><ReviewBody r={M.r} /></Window>;
}
/** The stops ahead, in a pop-up: when, which show, where, and how big a building it is. */
export function RoadYearWindow() {
  const S = G.S, L: any[] = E.roadAhead(S, 16), R: string[] = E.roadRoute(S);
  return <Window title="The schedule" wide ok="Done">
    <p>Your shows go from city to city in a loop, the nearest city next. The building is booked on what you draw today. A television show goes on sale four weeks out, a big event eight; Soon means not on sale yet. A strong market fills a bigger building; a good night there makes it stronger, and staying away cools it. Cold means a winter night: a weekly show there sells a few fewer tickets.</p>
    <table class="mt1" data-t="road-ahead"><thead><tr><th>When</th><th>Show</th><th>City</th><th>Market</th><th class="r">Sold</th><th class="r">Holds</th></tr></thead>
      <tbody>{L.map((a, i) => <tr key={i}><td>{a.when}</td><td>{a.show}{a.big ? <> <Tag kind="gold">{a.kind || 'Big event'}</Tag></> : null}</td><td><b>{a.city}</b></td><td>{a.mkt}{a.cold ? <span class="muted">, cold</span> : null}</td><td class="r num">{a.on ? num(a.sold) : 'Soon'}</td><td class="r num">{num(a.cap)}</td></tr>)}</tbody></table>
    <p class="muted mt1">The loop: {R.join(', ')}.</p>
  </Window>;
}

/** One matter from the inbox, in a pop-up: the whole of it, the chance of each attempt, and a button for each answer.
    Once it is answered the same window says what happened, and offers the next one. */
/** The answers' colours, card on card as on the desk: the first green, the last (often leaving it) navy, the rest blue. */
const mtKind = (i: number, n: number) => i === 0 ? undefined : (i === n - 1 ? 'less' : 'sm');
export function MatterWindow(p: { m: Modal }) {
  const S = G.S, e: any = S.inbox.find((x: any) => x.id === p.m.id);
  if (!e) return <Window title="On your desk"><Empty>That matter is closed.</Empty></Window>;
  const next: any = S.inbox.find((x: any) => !x.done && x.id !== e.id);
  if (e.done) return <Window title="On your desk" wide paper info={[e.night ? 'From last night' : 'A matter', 'Answered']} ok={next ? 'Back to the desk' : 'Done'} footer={next ? <Btn kind="go" t="ev-next" d={{ home: '' }} onClick={() => openModal({ kind: 'matter', id: next.id })}>The next matter</Btn> : undefined}>
    <div class="mtwin">
      <MomentPic ev={e} />
      <div class="mtside">
        <p class="muted"><Txt>{e.text}</Txt></p>
        <p class={'mt1 ' + (e.roll ? (e.roll.ok ? 'good' : 'bad') : '')} data-t="ev-result"><Txt>{e.result || 'It is dealt with.'}</Txt></p>
        {next ? <p class="muted mt1">{pending()} more on your desk.</p> : null}
      </div>
    </div>
  </Window>;
  return <Window title={e.night ? 'From last night' : 'On your desk'} wide paper info={[e.choices.length + ' answers', pending() > 1 ? pending() + ' on your desk' : 'Needs an answer']} ok="Not now">
    <div class="mtwin">
      <MomentPic ev={e} />
      <div class="mtside">
        <p data-t="ev-text"><Txt>{e.text}</Txt></p>
        <div class="mtopts">{e.choices.map((c: string, i: number) => <div key={i} class="mtopt">
          <Btn kind={mtKind(i, e.choices.length)} t="ev" d={{ id: e.id, c: i }} onClick={() => act(() => { E.resolveEvent(S, e.id, i); })}>{c}</Btn>
          {e.checks && e.checks[i] ? <CheckLine label="If you try it" ck={e.checks[i]} /> : null}
        </div>)}</div>
        <p class="muted mt1">The week cannot end until this has an answer.</p>
      </div>
    </div>
  </Window>;
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
const MORE: [string, string][] = [['week', 'This week'], ['world', 'Around the world'], ['promises', 'Promises'], ['know', 'Worth knowing'], ['clocks', 'Clocks'], ['news', 'News'], ['answered', 'Answered'], ['held', 'Also this week']];
/** What the Director held back this week: read it here, or bring one to the desk now for an action point. */
function Held() {
  const S = G.S, D = (E as any).dirDesk(S);
  const more = D.more ? <p class="muted" data-t="dir-more">{D.more}</p> : null;
  if (!D.held.length) return <>{more}<Empty>Nothing is waiting. Everything that needs you is on the desk.</Empty></>;
  return <>{more}<ul class="list" data-t="held-list">{D.held.map((h: any) => <li key={h.id} data-t="held" data-id={h.id}>
    <span><Tag kind={h.tag === 'chance' ? 'good' : h.tag === 'problem' ? 'bad' : undefined}>{h.tag === 'chance' ? 'A chance' : h.tag === 'problem' ? 'Trouble' : 'Life'}</Tag> <Txt>{h.text}</Txt>{h.left != null ? <span class="muted" data-t="held-left"> {h.left ? 'Waits ' + h.left + ' more ' + (h.left > 1 ? 'weeks' : 'week') + '.' : 'Lapses this week.'}</span> : null}</span>
    <Btn kind="sm" t="held-pull" d={{ id: h.id }} disabled={S.ap < 1} tip={S.ap < 1 ? 'You have no action points left this week.' : 'Bring it to your desk now. It costs one action point.'}
      onClick={() => act(() => { const r = (E as any).dirPull(S, h.id); if (r.ok) closeModal(); })}>Pull forward</Btn>
  </li>)}</ul></>;
}
/** The week around the world (src/99-worldweek.js): what every other company did last week, one line each, the rest below it. */
function WorldWeek() {
  const WK = (E as any).worldWeek(G.S, 2) as any[];
  if (!WK.length) return <Empty>Nothing filed yet. At the end of the week you will see what every other company did.</Empty>;
  const AU = (E as any).audience(G.S);
  return <div data-t="world-week"><p data-t="ww-rank"><b>Audience share:</b> you are number {AU.rank} of {AU.of}, with {AU.table.find((x: any) => x.mine).share.toFixed(1)}%. {AU.table[0].mine ? 'Nobody draws more.' : AU.table[0].name + ' leads with ' + AU.table[0].share.toFixed(1) + '%.'}</p>{WK.map((w, i) => <div key={w.w} class={i ? 'mt2' : ''}>
    <h3 class="ww-wk">{i ? 'The week before: ' : 'Last week: '}{w.label}</h3>
    {w.cos.length ? <ul class="list ww">{w.cos.map((c: any) => <li key={c.id} data-t="ww-co" data-v={c.id}>
      <span><b>{c.name}</b> {c.lead}
        {c.titles.length > 1 ? <span class="muted"> Also: {c.titles.slice(1).map((x: any) => x.now + ' won the ' + x.title).join('; ')}.</span> : null}
        {c.ended.length ? <span class="muted"> Ended: {c.ended.join('; ')}.</span> : null}
        {c.begun.length && c.lead && c.lead.indexOf('A new story') < 0 ? <span class="muted"> New: {c.begun.join('; ')}.</span> : null}
      </span></li>)}</ul> : <Empty>A quiet week everywhere else.</Empty>}
  </div>)}</div>;
}
export function DeskMoreWindow(p: { m: Modal }) {
  const st = office() as any, k: string = MORE.some(x => x[0] === p.m.k) ? p.m.k : 'week', A = k === 'know' ? alerts() : [];
  const pick = (id: string) => view(() => { st.more = id; p.m.k = id; });
  // who calls your shows and the owner's letter live here, the one place on the desk for them (D-031)
  const foot = <><Btn kind="sm" t="open-voices" tip="Who calls your shows: the play-by-play voice and the colour voice." onClick={() => openVoices()}>Commentary</Btn><Btn kind="sm" t="open-letter" tip="Read the owner's letter again: what they want from you this year." onClick={() => openModal({ kind: 'welcome', again: 1 })}>Owner's letter</Btn></>;
  return <Window title="The week in full" wide ok="Back to the desk" footer={foot}>
    <Tabs label="The week in full" items={MORE.map(x => ({ id: x[0], label: x[1], t: 'more-tab', d: { v: x[0] } }))} value={k} onPick={pick} />
    <div class="dmore" data-t="desk-more-body" data-v={k} onClickCapture={(ev: any) => { if (ev.target && ev.target.closest && ev.target.closest('[data-t="book-show"],[data-t="report"]')) ui.modal = null; }}>
      {k === 'week' ? <ScheduleList /> : k === 'world' ? <WorldWeek /> : k === 'promises' ? <QuestList /> : k === 'clocks' ? <Clocks /> : k === 'answered' ? <Answered /> : k === 'held' ? <Held />
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
    <Desktop cls="deskpage mapboard" t="desk">
      <Board />
    </Desktop>
  </div>;
}
