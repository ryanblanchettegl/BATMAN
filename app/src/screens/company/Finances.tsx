/* Finances: cash, the weekly net as a column chart, last week's ledger as two pies, and the last twelve weeks as a table. Read-only. */
import { E } from '../../engine';
import { G, me, cash, full, slice, view } from '../../store';
import { screenMode } from '../../input';
import { Head, Panel, KV, Pie, ColChart, Empty, Btn, Desktop, Win } from '../../kit';

function Line(p: { k: string; v: number; neg?: boolean }) { return <li><span>{p.k}</span><span class={'num' + (p.neg ? ' bad' : '')}>{full(p.neg ? -p.v : p.v)}</span></li>; }

/** Weekly net income as columns. The type shrinks to fit the panel. */
function NetChart(p: { H: any[]; bare?: boolean }) {
  const P = me();
  const H = p.H.slice(-24), n = H.length;
  let best = H[0], worst = H[0];
  H.forEach(x => { if (x.net > best.net) best = x; if (x.net < worst.net) worst = x; });
  const labels = H.map((x, i) => n <= 12 || i % 4 === 0 || i === n - 1 ? String(x.w).slice(-2) : '');
  const size = p.bare ? 'min(0.9em,calc((100cqw - 4.8em) / ' + (n * 3 * 0.62).toFixed(1) + '))' : 'min(1em,calc((min(100vw,59em) - 4.8em) / ' + (n * 3 * 0.62).toFixed(1) + '))';
  const body = <>
    <div style={{ fontSize: size }}><ColChart vals={H.map(x => x.net)} labels={labels} line={P.net} title={'Weekly net income for the last ' + n + ' weeks'} /></div>
    <p class="muted">Top of the chart: <b class="num">{full(Math.max(best.net, P.net > 0 ? P.net : 0, 1))}</b>. {worst.net < 0 ? <>Bottom: <b class="num bad">{full(worst.net)}</b>. </> : null}<span class="plan">{'──'}</span> is the owner{'’'}s plan, <b class="num">{full(P.net)}</b> a week.</p>
    {p.bare ? null : <p class="muted">One column a week, by week number. Best: <b class="num">{full(best.net)}</b> in week {best.w}.{worst.net < 0 ? <> Worst: <span class="num bad">{full(worst.net)}</span> in week {worst.w}.</> : null}</p>}
  </>;
  return p.bare ? body : <Panel cls="mb3" title="Weekly net">{body}</Panel>;
}

function Ledger(p: { only?: 'inc' | 'out' }) {
  const f = G.S.fin;
  if (!f) return <Panel><Empty>The books open after your first week. Close the week to see them.</Empty></Panel>;
  const inc = [{ n: 'TV money', v: f.tv }, { n: 'Tickets', v: f.gate }, { n: 'Big event buys', v: f.ppv }, { n: 'Merchandise', v: f.merch }, { n: 'Sponsors', v: f.spons || 0 }, { n: 'Bonuses', v: f.bonus }];
  const out = [{ n: 'Wages', v: f.wages }, { n: 'Production', v: f.prod }, { n: 'Advertising', v: f.adv || 0 }, { n: 'Training camp', v: f.camp || 0 }, { n: 'Medical staff', v: f.med || 0 }, { n: 'Travel', v: f.trv || 0 }, { n: 'Loan and investor', v: f.fin || 0 }, { n: 'Shareholders', v: f.div || 0 }, { n: 'Overheads', v: f.over }];
  const incP = <Panel title={'Week ' + f.w + ' income'}>
      <ul class="list">
        <Line k="TV money" v={f.tv} /><Line k="Ticket sales" v={f.gate} /><Line k="Big event buys" v={f.ppv} /><Line k="Merchandise" v={f.merch} /><Line k="Sponsors" v={f.spons || 0} /><Line k="Bonuses" v={f.bonus} />
        <li><span><b>Total</b></span><span class="num"><b>{full(f.inc)}</b></span></li>
      </ul>
      <Pie parts={inc} title="Where the money came from" />
    </Panel>;
  const outP = <Panel title={'Week ' + f.w + ' costs'}>
      <ul class="list">
        {out.map(x => <Line k={x.n} v={x.v} neg />)}
        <li><span><b>Total</b></span><span class="num"><b>{full(-f.exp)}</b></span></li>
        <li><span><b>Net</b></span><span class="num"><b class={f.net < 0 ? 'bad' : 'good'}>{full(f.net)}</b></span></li>
      </ul>
      <Pie parts={out} title="Where the money went" />
    </Panel>;
  if (p.only) return p.only === 'inc' ? incP : outP;
  return <div class="cols ledger">{incP}{outP}</div>;
}

function Weeks(p: { H: any[] }) {
  return <div class="tw mt4"><table>
    <thead><tr><th>Week</th><th class="r">Income</th><th class="r">Costs</th><th class="r">Net</th><th class="r">Cash</th><th class="r">Popularity</th></tr></thead>
    <tbody>{p.H.slice().reverse().slice(0, 12).map(x => <tr>
      <td class="num">{E.cal(x.w).label}</td><td class="r num">{cash(x.inc)}</td><td class="r num">{cash(x.exp)}</td>
      <td class={'r num ' + (x.net < 0 ? 'bad' : 'good')}>{cash(x.net)}</td><td class="r num">{cash(x.cash)}</td><td class="r num">{x.image.toFixed(1)}</td>
    </tr>)}</tbody>
  </table></div>;
}

/** Every big night: the buys at home against the forecast, and the money. */
function BigNights() {
  const L: any[] = E.buyLog(G.S), k = (n: number) => n >= 1000 ? Math.round(n / 1000) + 'K' : String(n);
  if (!L.length) return <Empty>Your first big event goes in here, with its buys against the forecast.</Empty>;
  return <div class="tw" data-t="fn-big"><table>
    <thead><tr><th>Night</th><th class="r">Bought</th><th class="r">Forecast</th><th class="r">Money</th></tr></thead>
    <tbody>{L.map((x, i) => <tr key={i}><td>{x.n.replace(me().name + ' ', '')}<br /><span class="muted">{E.cal(x.w).label.replace(/^Week \d+, /, '')}</span></td>
      <td class={'r num ' + (x.b >= x.f ? 'good' : 'bad')}>{k(x.b)}</td><td class="r num">{k(x.f)}</td><td class="r num">{cash(x.m)}</td></tr>)}</tbody>
  </table></div>;
}
export function Finances() {
  const S = G.S, P = me(), H = P.hist.slice(-24);
  let wages = 0; E.rosterOf(S, P.id).forEach((w: any) => { wages += w.wage; });
  const money = <div class="kv">
    <KV label="Cash">{P.cash < 0 ? <span class="bad">{full(P.cash)}</span> : full(P.cash)}</KV>
    <KV label="Weekly wage bill">{full(wages)}</KV>
    <KV label="Popularity">{P.image.toFixed(1)}</KV>
    <KV label="Started with">{cash(P.cash0)}</KV>
  </div>;
  // for the browser tests: everything laid out on the page, as it was
  if ((window as any).EWF_FLAT) return <div class="onescreen winpage">
    <Head eyebrow={P.name} title="Finances" />
    <Panel cls="mb3 money">{money}<p class="muted mt3">Weekly TV roughly pays for itself. The monthly big event is where the money is made, and popularity drives all of it.</p></Panel>
    {H.length ? <NetChart H={H} /> : null}
    <Ledger />
    {H.length ? <Weeks H={H} /> : null}
  </div>;
  const st = slice<{ k: string }>('finances', () => ({ k: 'inc' })), f = S.fin;
  const TABS: [string, string][] = [['inc', 'Income'], ['out', 'Costs'], ['weeks', 'By week'], ['big', 'Big nights']];
  return <div class="onescreen"><div class="head sr"><h1>Finances</h1></div><Desktop cls="fnpage" t="finances">
    <Win title={'The money: ' + P.name} area="sum" t="fn-sum">{money}</Win>
    <Win title="Weekly net" area="chart" t="fn-chart">{H.length ? <NetChart H={H} bare /> : <Empty>The chart starts after your first week.</Empty>}</Win>
    <Win title="The books" area="books" t="fn-books">
      <div class="row">{TABS.map(([k, n]) => <Btn key={k} kind="sm" on={st.k === k} t="fn-tab" d={{ k }} onClick={() => view(() => { st.k = k; })}>{n}</Btn>)}</div>
      <div class="fnpane">{st.k === 'big' ? <BigNights /> : st.k === 'weeks' ? (H.length ? <Weeks H={H} /> : <Empty>Nothing yet.</Empty>) : <Ledger only={st.k as any} />}</div>
    </Win>
  </Desktop></div>;
}
