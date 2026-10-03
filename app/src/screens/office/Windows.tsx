/* The Office pop-ups: the week-closed summary and the clock detail. Both are drawn from the live game state. */
import { E } from '../../engine';
import { G, me, Modal, full } from '../../store';
import { Window, ColChart, Dial, Empty, Txt } from '../../kit';

/** Opened by flow.endWeek() once the engine has closed the week: the money, the last ten weeks, the news, the new date. */
export function WeekClosed(p: { m: Modal }) {
  const S = G.S, P = me(), fin = S.fin, H: any[] = P.hist.slice(-10), nw: any[] = S.news.filter((x: any) => x.w === S.week - 1).slice(0, 6);
  return <Window title="Week closed" ok="On to next week">
    {fin ? <p>Net for the week: <b class={'num ' + (fin.net < 0 ? 'bad' : 'good')}>{full(fin.net)}</b>. Cash in the bank: <b class="num">{full(P.cash)}</b>.</p>
      : <p>Cash in the bank: <b class="num">{full(P.cash)}</b>.</p>}
    {H.length > 0 && <ColChart vals={H.map(x => x.net)} labels={H.map(x => x.w)} title={'Weekly net, last ' + H.length + ' weeks'} />}
    {nw.length > 0 && <><p class="eyebrow mt1">This week</p><ul class="list">{nw.map(x => <li><span><Txt>{x.t}</Txt></span></li>)}</ul></>}
    <p class="mt2">It is now <b>{E.cal(S.week).label}</b>.</p>
  </Window>;
}

/** What one clock measures and what moved it this week. `m.k` is the clock id. */
export function ClockWindow(p: { m: Modal }) {
  const ck = E.clocks(G.S).find((x: any) => x.id === p.m.k);
  if (!ck) return <Window title="Clock"><Empty>That clock is not running.</Empty></Window>;
  return <Window title={ck.n}>
    <div class="row nowrap top gap2">
      <Dial v={ck.v} n={ck.segs} bad={ck.bad} />
      <div>
        <p><b>{ck.v} of {ck.segs}</b> segments filled.</p>
        <p class="mt1">{ck.d}</p>
        {ck.why ? <p class="muted mt1">This week: {ck.why}.</p> : null}
      </div>
    </div>
  </Window>;
}
