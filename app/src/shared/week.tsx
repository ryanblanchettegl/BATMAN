/* Widgets both the Office and Booking show: this week's shows, the end-week button, promises and targets. */
import { E } from '../engine';
import { G, me } from '../store';
import { go, pending } from '../nav';
import { repFor, openReport, endWeek } from '../flow';
import { Btn, Tag, Empty, brandName, Txt } from '../kit';

export function ScheduleList() {
  const S = G.S, gate = E.taskGate(S, 'book');
  return <ul class="list">{S.queue.map((sh: any, i: number) => {
    let right;
    if (i < S.qi) { const ri = repFor(sh), r = ri >= 0 ? S.reports[ri] : null; right = r ? <span class="row"><span class="num">{r.rating}%</span><Btn kind="sm" t="report" d={{ v: ri }} onClick={() => openReport(ri)}>Report</Btn></span> : <span class="muted">Done</span>; }
    else if (i === S.qi) right = gate.ok ? <Btn kind="go" t="book-show" onClick={() => go('booking')}>Book this show</Btn> : <span class="muted">After this week{'’'}s tasks</span>;
    else right = <span class="muted">Up next</span>;
    return <li><span><b>{sh.name}</b> {sh.big ? <Tag kind="gold">Big event</Tag> : <Tag>TV</Tag>}{sh.brand ? <> <Tag>{brandName(me(), sh.brand)}</Tag></> : null}</span>{right}</li>;
  })}</ul>;
}
export function EndWeekBtn() {
  const n = pending(), g = E.taskGate(G.S, 'week');
  return <div class="row mt3"><Btn kind="go" t="endweek" disabled={!!n || !g.ok} onClick={endWeek}>End the week</Btn>{n ? <span class="muted">Answer your inbox first.</span> : (g.ok ? null : <span class="muted">Finish this week{'’'}s tasks on the desk first.</span>)}</div>;
}
/** On the booking page: what on the desk still stands in the way of the show, with a button to go there. */
export function GateNote() {
  const g = E.taskGate(G.S, 'show');
  if (g.ok) return null;
  return <div class="flash err" data-t="gate-note"><b>On your desk before this show can run</b><ul>{g.left.map((x: string) => <li><Txt>{x}</Txt></li>)}</ul>
    <div class="row mt1"><Btn kind="sm" t="gate-desk" onClick={() => go('desk')}>Go to the desk</Btn></div></div>;
}
export function QuestList() {
  const S = G.S;
  if (!S.quests.length) return <Empty>Nothing promised yet. Wrestlers and the network will ask soon enough; answer them from the inbox on the desk.</Empty>;
  return <ul class="list">{S.quests.map((q: any) => { const left = q.due - S.week; return <li><span><Txt>{q.text}</Txt></span><Tag kind={left <= 0 ? 'warn' : undefined}>{left <= 0 ? 'This week' : left + ' wk left'}</Tag></li>; })}</ul>;
}
