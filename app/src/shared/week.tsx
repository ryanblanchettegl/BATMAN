/* Widgets both the Office and Booking show: this week's shows, the end-week button, promises and targets. */
import { G, me } from '../store';
import { go, pending } from '../nav';
import { repFor, openReport, endWeek } from '../flow';
import { Btn, Tag, Empty, brandName, Txt } from '../kit';

export function ScheduleList() {
  const S = G.S;
  return <ul class="list">{S.queue.map((sh: any, i: number) => {
    let right;
    if (i < S.qi) { const ri = repFor(sh), r = ri >= 0 ? S.reports[ri] : null; right = r ? <span class="row"><span class="num">{r.rating}%</span><Btn kind="sm" t="report" d={{ v: ri }} onClick={() => openReport(ri)}>Report</Btn></span> : <span class="muted">Done</span>; }
    else if (i === S.qi) right = <Btn kind="go" t="book-show" onClick={() => go('booking')}>Book this show</Btn>;
    else right = <span class="muted">Up next</span>;
    return <li><span><b>{sh.name}</b> {sh.big ? <Tag kind="gold">Big event</Tag> : <Tag>TV</Tag>}{sh.brand ? <> <Tag>{brandName(me(), sh.brand)}</Tag></> : null}</span>{right}</li>;
  })}</ul>;
}
export function EndWeekBtn() {
  const n = pending();
  return <div class="row mt3"><Btn kind="go" t="endweek" disabled={!!n} onClick={endWeek}>End the week</Btn>{n ? <span class="muted">Answer your inbox first.</span> : null}</div>;
}
export function QuestList() {
  const S = G.S;
  if (!S.quests.length) return <Empty>Nothing promised yet. Wrestlers and the network will ask soon enough; answer them from the inbox on the desk.</Empty>;
  return <ul class="list">{S.quests.map((q: any) => { const left = q.due - S.week; return <li><span><Txt>{q.text}</Txt></span><Tag kind={left <= 0 ? 'warn' : undefined}>{left <= 0 ? 'This week' : left + ' wk left'}</Tag></li>; })}</ul>;
}
