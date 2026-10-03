/* The desk, the hub of the game: what to do before the show and the button that books it, then the inbox, the week,
   what needs attention, the clocks and the office news. Cash, popularity and booking power are read on Company. */
import { ComponentChildren } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, ui, me, act, openModal, plural } from '../../store';
import { go, weekDone } from '../../nav';
import { Head, Panel, Btn, Name, Dice, CheckLine, Empty, Dial, dataAttrs, Txt } from '../../kit';
import { ScheduleList, QuestList } from '../../shared/week';
import { BeforeShow } from './BeforeShow';
import { office, focusAfter, useFocusAfter } from './util';

/** Things the player should know about before booking: money trouble, vacant titles, injuries, contracts, strain. */
function alerts(): ComponentChildren[] {
  const S = G.S, P = me(), R: W[] = E.rosterOf(S, P.id), out: ComponentChildren[] = [], byOvr = (a: W, b: W) => b.ovr - a.ovr;
  if (S.owner.pending) out.push(<span class="mark">The company is yours. Set your house style on the Manage screen.</span>);
  if (P.neg > 0) out.push(<span class="bad">Cash has been negative for {P.neg} {plural(P.neg, 'week')}. Six in a row ends the game.</span>);
  P.titles.forEach((t: any) => { if (!t.holders.length) out.push(<>The {t.name} {t.tag ? 'are' : 'is'} vacant. Book a match for {t.tag ? 'them' : 'it'} to crown a champion.</>); });
  R.filter(w => w.inj > 0).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} /> is injured: {w.inj} {plural(w.inj, 'week')} left.</>));
  R.filter(w => w.con <= 8).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} />{'’'}s contract ends in {Math.max(0, w.con)} {w.con === 1 ? 'week' : 'weeks'}.</>));
  R.filter(w => (w.stress || 0) >= 60).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is under strain (stress {Math.round(w.stress)}).</>));
  R.filter(w => w.morale < 40).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is unhappy (morale {Math.round(w.morale)}).</>));
  return out;
}

/** Each open event shows the chance of each attempt and one button per choice. Answered ones show what happened. */
function Inbox() {
  const S = G.S;
  useFocusAfter();
  if (!S.inbox.length) return <Empty>A quiet week in the office.</Empty>;
  const answer = (id: number, c: number) => act(() => {
    E.resolveEvent(S, id, c);
    focusAfter(['[data-t="ev"]'], ['[data-t="endweek"]:not([disabled])', '[data-t="book-next"]']);
  });
  return <ul class="list">{S.inbox.map((e: any) => <li key={e.id}>
    <span><Txt>{e.text}</Txt>
      {e.result ? <><br /><Dice roll={e.roll} /><span class={e.roll ? (e.roll.ok ? 'good' : 'bad') : 'muted'}><Txt>{e.result}</Txt></span></> : null}
      {!e.done && e.checks ? Object.keys(e.checks).map(k => <CheckLine label={e.choices[k]} ck={e.checks[k]} />) : null}
    </span>
    {!e.done && <span class="row">{e.choices.map((c: string, i: number) => <Btn kind="sm" t="ev" d={{ id: e.id, c: i }} onClick={() => answer(e.id, i)}>{c}</Btn>)}</span>}
  </li>)}</ul>;
}

const NEWSH: Record<string, string> = { title: 'Title Change', injury: 'Injury Report', contract: 'Roster Update', story: 'Storylines', money: 'Front Office', world: 'Around the Territories', you: 'Your Career' };
/** The newest `n` news items, dated like memos. */
function OfficeNews(p: { n: number }) {
  const S = G.S, seen: Record<number, number> = {};
  if (!S.news.length) return <Empty>No news yet.</Empty>;
  return <ul class="onews">{S.news.slice(0, p.n).map((x: any) => {
    const c = E.cal(x.w), k = seen[x.w] = (seen[x.w] || 0) + 1, day = (c.wom - 1) * 7 + Math.max(1, 8 - k);
    return <li><span class="d num">{c.month + 1}/{day}/{String(c.year).slice(-2)}</span><span class="h">{NEWSH[x.k] || 'Office Memo'}</span><span><Txt>{x.t}</Txt></span></li>;
  })}</ul>;
}

/** Slow pressure you can watch build. Selecting a clock opens a window that says what moves it. */
function Clocks() {
  const C: any[] = E.clocks(G.S), st = office();
  // On a remote, closing a window sends the highlight to the page's data-home control. Keep that on the clock that was
  // opened for the one draw after its window closes, so Back lands where the player was.
  useLayoutEffect(() => { if (st.clock && !ui.modal) st.clock = null; });
  return <Panel title="Clocks">
    <div class="clocks">{C.map(c =>
      <button type="button" class="clock" aria-label={c.n + ': ' + c.v + ' of ' + c.segs + '. ' + (c.why || '')} data-home={st.clock === c.id ? '' : undefined} {...dataAttrs('clock', { k: c.id })}
        onClick={() => { ui.flash = null; st.clock = c.id; openModal({ kind: 'clock', k: c.id }); }}>
        <Dial v={c.v} n={c.segs} bad={c.bad} />
        <span><b>{c.n}</b> <span class={'num ' + (c.bad ? (c.v >= c.segs - 2 ? 'bad' : 'muted') : 'good')}>{c.v}/{c.segs}</span><br /><span class="muted">{c.why || 'Nothing moving'}</span></span>
      </button>)}</div>
    <p class="muted mt1">Red clocks are trouble building. Green clocks pay out when they fill. Select one to see what moves it.</p>
  </Panel>;
}

export function Desk() {
  const S = G.S, A = alerts();
  return <>
    <Head eyebrow={E.cal(S.week).label} title={'Office - Week ' + S.week} />
    <BeforeShow />
    <div class="cols">
      <div class="stack">
        <Panel title="Inbox"><Inbox /></Panel>
        <Panel title="This week"><ScheduleList /></Panel>
        <Panel title="Promises and targets"><QuestList /></Panel>
      </div>
      <div class="stack">
        <Panel title="Needs attention">{A.length ? <ul class="list">{A.map(a => <li><span>{a}</span></li>)}</ul> : <Empty>Nothing urgent.</Empty>}</Panel>
        <Clocks />
        <Panel title="Office news"><OfficeNews n={4} /><div class="row mt2"><Btn kind="sm" t="tab" d={{ v: 'world' }} onClick={() => go('world')}>All the news</Btn></div></Panel>
      </div>
    </div>
  </>;
}
