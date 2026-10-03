/* Company overview: where the company stands. Three gauges (cash, popularity, booking power), who owns it, how it is set
   up, the house rules in force and the sponsors signed. Read-only: every choice behind these numbers is made on Manage. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, me, cash, full, plural } from '../../store';
import { Head, Panel, Gauge, Meter, Empty } from '../../kit';
import { ModelCard } from '../../shared/model';

/** A gauge panel: the title is centred inside the box (docs/design.md, section 6). */
function GaugePanel(p: { title: string; children: ComponentChildren }) {
  return <section class="gp"><h2>{p.title}</h2>{p.children}</section>;
}

function Gauges() {
  const S = G.S, P = me(), H = P.hist, last = H[H.length - 1], wk = last ? last.net : 0, c0 = Math.max(1, P.cash0 || P.cash);
  const old = H.length >= 4 ? H[H.length - 4].image : P.image0, tr = Math.round((P.image - old) * 10) / 10;
  const rank = 1 + S.order.filter((id: string) => S.promos[id].image > P.image).length, max = Math.max(1, (S.bpGrant || S.bp || 1) * 2), nb = E.nextBig(S);
  return <div class="gauges">
    <GaugePanel title="Cash">
      <p class="kv"><span>Current balance:</span><b class={'num' + (P.cash < 0 ? ' bad' : '')}>{full(P.cash)}</b></p>
      <Gauge frac={P.cash / (c0 * 2)} />
      <p>Week change: <span class={'num ' + (wk < 0 ? 'bad' : 'good')}>{wk >= 0 ? '+' : ''}{full(wk)}</span> <span class="muted">{'·'} opened with {cash(c0)}</span></p>
    </GaugePanel>
    <GaugePanel title="Popularity">
      <p class="kv"><span>Company popularity:</span><b class="num">{Math.round(P.image)}%</b></p>
      <Gauge frac={P.image / 100} />
      <p>Trend: {tr >= 0.3 ? <span class="good">{'▲'} UP (+{tr.toFixed(1)})</span> : (tr <= -0.3 ? <span class="bad">{'▼'} DOWN ({tr.toFixed(1)})</span> : <span class="muted">{'■'} LEVEL</span>)} <span class="muted">{'·'} No. {rank} of {S.order.length}</span></p>
    </GaugePanel>
    <GaugePanel title="Booking power">
      <p class="kv"><span>Current booking power:</span><b class="num">{S.bp}</b></p>
      <Gauge frac={S.bp / max} />
      <p>Next event: <span class="gold">{String(nb.name).toUpperCase()}</span> <span class="muted">({nb.week === S.week ? 'THIS WEEK' : 'WEEK ' + nb.week})</span></p>
    </GaugePanel>
  </div>;
}

function Ownership() {
  const S = G.S, o = S.owner, P = me();
  return <Panel title="Ownership">
    {o.me ? <p>You own {P.name}, and you book it.</p> : <p><b>{o.name}</b> owns {P.name}. You book it.</p>}
    <p class="mt1">House style: <b>{E.STYLES[o.style].n}.</b> {E.STYLES[o.style].d}</p>
    <p class="mt1">The crowd: <b>{E.ROOTS[o.roots].n}.</b> {E.ROOTS[o.roots].d}</p>
    <p class="mt1">The locker room: <b>{E.PLEDGE[o.pledge].n}.</b> {E.PLEDGE[o.pledge].d}</p>
    <p class="muted mt2">True to the crowd <Meter v={S.creedScore} kind="cool" /> {S.creedScore}.{o.me ? null : <> {o.name}{'’'}s trust in you: <b class="num">{Math.round(o.trust)}</b>.</>}</p>
  </Panel>;
}

/** The current level of every setting, with what it costs where it costs anything. */
function Setup() {
  const S = G.S, P = me(), C = E.company(S), md = E.medInfo(S), ci = E.campInfo(S);
  const rows: [string, string, string][] = [
    ['Broadcast slot', E.SLOTN[P.slot], E.SLOT_MAX[P.slot] + ' matches a show'],
    ['Production values', E.PRODN[P.prodLvl], cash(C.prodCost[P.prodLvl]) + ' a TV show'],
    ['Risk level', E.RISKN[P.risk], ''],
    ['Ticket prices', E.TIXN[P.tix], ''],
    ['Advertising', E.ADVN[P.adv], P.adv ? cash(C.adCost[P.adv]) + ' a week' : 'No spend'],
    ['Training camp', ci.names[P.camp || 0], P.camp ? ci.n + ' of ' + ci.cap + ' places taken' : ''],
    ['Medical staff', md.names[P.med || 0], P.med ? cash(md.costs[P.med]) + ' a week' : '']
  ];
  return <Panel title="How it runs" cls="setup">
    <ul class="list">{rows.map(r => <li><span>{r[0]}</span><span class="r"><b>{r[1]}</b>{r[2] ? <><br /><span class="muted">{r[2]}</span></> : null}</span></li>)}</ul>
  </Panel>;
}

function Rules() {
  const H = E.houseInfo(G.S), on = H.rules.filter((r: any) => r.on);
  return <Panel title="House rules in force">
    {on.length ? <ul class="list">{on.map((r: any) => <li class="col"><span><b>{r.n}</b></span><span class="good">+ {r.plus}</span><span class="bad">− {r.minus}</span></li>)}</ul>
      : <Empty>No house rules in force.</Empty>}
    <p class="muted mt2">{on.length} of {H.slots} {plural(H.slots, 'slot')} in use.</p>
  </Panel>;
}

function Sponsors() {
  const S = G.S; let pay = 0; S.sponsors.forEach((x: any) => { pay += x.pay; });
  return <Panel title="Sponsors">
    {S.sponsors.length ? <ul class="list">{S.sponsors.map((x: any) => <li class="col">
      <span><b>{x.name}</b> {'·'} {cash(x.pay)} a week {'·'} {x.weeks} {plural(x.weeks, 'week')} left</span><span class="muted">Condition: {x.text}</span>
    </li>)}</ul> : <Empty>No sponsors signed.</Empty>}
    {S.sponsors.length ? <p class="muted mt2">{cash(pay)} a week in all.</p> : null}
  </Panel>;
}

export function Overview() {
  const S = G.S, P = me();
  return <>
    <Head eyebrow={P.name} title="Company" />
    <Gauges />
    <div class="cols">
      <div class="stack"><Panel title="How this company is run"><ModelCard id={P.model} /></Panel><Ownership /><Rules /></div>
      <div class="stack"><Setup /><Sponsors /></div>
    </div>
  </>;
}
