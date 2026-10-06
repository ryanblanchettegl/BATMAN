/* The desk, the hub of the game: what to do before the show and the button that books it, then the inbox, the week,
   what needs attention, the clocks and the office news. Cash, popularity and booking power are read on Company. */
import { ComponentChildren } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, ui, me, act, openModal, plural, view } from '../../store';
import { go, weekDone } from '../../nav';
import { Head, Panel, Btn, Name, CheckLine, Empty, Dial, dataAttrs, Txt, Tag } from '../../kit';
import { ScheduleList, QuestList } from '../../shared/week';
import { BeforeShow } from './BeforeShow';
import { office, focusAfter, useFocusAfter } from './util';

/** Things the player should know about before booking: money trouble, vacant titles, injuries, contracts, strain. */
interface Alert { c: ComponentChildren; to?: string; label?: string; run?: () => void }
function alerts(): Alert[] {
  const S = G.S, P = me(), R: W[] = E.rosterOf(S, P.id), raw: ComponentChildren[] = [], byOvr = (a: W, b: W) => b.ovr - a.ovr;
  const out: any = { push: (x: ComponentChildren) => raw.push(x) };
  const extra: Alert[] = [];
  if (P.neg > 0) out.push(<span class="bad">Cash has been negative for {P.neg} {plural(P.neg, 'week')}. Six in a row ends the game.</span>);
  R.filter(w => w.inj > 0).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} /> is injured: {w.inj} {plural(w.inj, 'week')} left.</>));
  R.filter(w => w.con <= 8).sort(byOvr).slice(0, 5).forEach(w => out.push(<><Name w={w} />{'’'}s contract ends in {Math.max(0, w.con)} {w.con === 1 ? 'week' : 'weeks'}.</>));
  R.filter(w => (w.stress || 0) >= 60).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is under strain (stress {Math.round(w.stress)}).</>));
  R.filter(w => w.morale < 40).slice(0, 4).forEach(w => out.push(<><Name w={w} /> is unhappy (morale {Math.round(w.morale)}).</>));
  return extra.concat(raw.map(c => ({ c })));
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
  return <ul class="list">{S.inbox.slice().sort((a: any, b: any) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).map((e: any) => <li key={e.id}>
    <span><Txt>{e.text}</Txt>
      {e.result ? <><br /><span class={e.roll ? (e.roll.ok ? 'good' : 'bad') : 'muted'}><Txt>{e.result}</Txt></span></> : null}
      {!e.done && e.checks ? Object.keys(e.checks).map(k => <CheckLine label={e.choices[k]} ck={e.checks[k]} />) : null}
    </span>
    {!e.done && <span class="row">{e.choices.map((c: string, i: number) => <Btn kind="sm" t="ev" d={{ id: e.id, c: i }} onClick={() => answer(e.id, i)}>{c}</Btn>)}</span>}
  </li>)}</ul>;
}

const NEWSH: Record<string, string> = { title: 'Title Change', injury: 'Injury Report', contract: 'Roster Update', story: 'Storylines', money: 'Front Office', world: 'Around the Territories', you: 'Your Career' };
/** The newest `n` news items, dated like memos. */
function OfficeNews(p: { n: number }) {
  const S = G.S, seen: Record<number, number> = {};
  if (!S.news.length) return <Empty>No news yet. Run a show and the wire starts.</Empty>;
  // your own company first, then the one most recent story from elsewhere
  const own = S.news.filter((x: any) => x.k !== 'world').slice(0, p.n - 1), away = S.news.filter((x: any) => x.k === 'world')[0];
  const list = own.concat(away ? [away] : []);
  return <ul class="onews">{list.map((x: any) => {
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
  const idle = C.filter(c => !c.why && !c.v), moving = C.filter(c => !(!c.why && !c.v)), words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const show = st.quiet ? C : moving;
  return <Panel title="Clocks">
    <div class="clocks">{show.map(c =>
      <button type="button" class="clock" aria-label={c.n + ': ' + c.v + ' of ' + c.segs + '. ' + (c.why || '')} data-home={st.clock === c.id ? '' : undefined} {...dataAttrs('clock', { k: c.id })}
        onClick={() => { ui.flash = null; st.clock = c.id; openModal({ kind: 'clock', k: c.id }); }}>
        <Dial v={c.v} n={c.segs} bad={c.bad} />
        <span><b>{c.n}</b> <span class={'num ' + (c.bad ? (c.v >= c.segs - 2 ? 'bad' : 'muted') : 'good')}>{c.v}/{c.segs}</span><br /><span class="muted">{c.why || 'Nothing moving'}</span></span>
      </button>)}</div>
    {idle.length ? <div class="row mt1"><Btn kind="sm" t="clocks-quiet" onClick={() => view(() => { st.quiet = !st.quiet; })}>{st.quiet ? 'Hide the quiet clocks' : (words[idle.length] || idle.length) + ' ' + plural(idle.length, 'clock') + ' ' + (idle.length === 1 ? 'is' : 'are') + ' quiet'}</Btn></div> : null}
    <p class="muted mt1">Red clocks are trouble building. Green clocks pay out when they fill. Select one to see what moves it.</p>
  </Panel>;
}

/** After a show: what the night left on the desk. One line each; each opens a pop-up, so nothing leaves the Office. */
function AfterShow() {
  const S = G.S, A = E.afterShow(S); if (!A) return null;
  const look = (it: any) => { act(() => { E.nightSeen(S, it.k); }); openModal({ kind: 'info', title: it.n + ': ' + A.name, body: () => <div data-t="night-detail" data-v={it.k}>{it.detail.map((x: string) => <p class="mb1"><Txt>{x}</Txt></p>)}</div> }); };
  return <Panel title={'After the show: ' + A.name} cls="after mb3">
    <div data-t="after-show" data-left={A.unseen}>
      <p><b class="gold">{A.grade}</b> {'·'} <b>{A.head}.</b> <span class="muted">{A.line}</span></p>
      <ul class="list mt1">{A.items.map((it: any) => <li key={it.k} data-t="after-item" data-v={it.k} data-seen={it.seen ? '1' : '0'}>
        <span>{it.seen ? null : <><Tag kind={it.tone === 'bad' ? 'bad' : (it.tone === 'good' ? 'good' : 'warn')}>New</Tag> </>}<b>{it.n}</b> <span class={it.seen ? 'muted' : (it.tone === 'bad' ? 'bad' : undefined)}><Txt>{it.line}</Txt></span></span>
        <Btn kind="sm" t="after-look" d={{ v: it.k }} onClick={() => look(it)}>Look</Btn></li>)}</ul>
      <p class="muted mt1">{A.unseen ? 'This is what the night left you. ' : 'You have been through all of it. '}{A.left > 0 ? 'The next show is under it.' : 'Every show this week has run.'}</p>
    </div>
  </Panel>;
}

export function Desk() {
  const S = G.S, A = alerts();
  return <>
    <Head eyebrow={E.cal(S.week).label} title={'Office - Week ' + S.week} />
    <AfterShow />
    <BeforeShow />
    <div class="cols">
      <div class="stack">
        <Panel title={'Inbox' + (S.inbox.filter((e: any) => !e.done).length ? ' (' + S.inbox.filter((e: any) => !e.done).length + ' to answer)' : '')}><Inbox /></Panel>
        <Panel title="This week"><ScheduleList /></Panel>
        <Panel title="Promises and targets"><QuestList /></Panel>
      </div>
      <div class="stack">
        <Panel title="Worth knowing">{A.length ? <ul class="list">{A.map(a => <li><span>{a.c}</span>{a.label ? <Btn kind="sm" t="attn" d={{ v: a.to || 'ap' }} onClick={() => { if (a.run) act(a.run); else if (a.to) go(a.to); }}>{a.label}</Btn> : null}</li>)}</ul> : <Empty>Nothing urgent.</Empty>}</Panel>
        <Clocks />
        <Panel title="Office news"><OfficeNews n={4} /><div class="row mt2"><Btn kind="sm" t="tab" d={{ v: 'world' }} onClick={() => go('world')}>All the news</Btn></div></Panel>
      </div>
    </div>
  </>;
}
