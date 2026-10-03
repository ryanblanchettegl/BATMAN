/* History: season chronicles, the record book, year-end awards, the hall of fame and every title's line of champions. Read-only. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, me } from '../../store';
import { Head, Panel, Empty, stars, Txt } from '../../kit';

const wk = (w: number): string => E.cal(Math.max(1, w)).label;
/** One line of a list: what it is on the left, the figure on the right. */
function Row(p: { children: ComponentChildren; v: ComponentChildren }) { return <li><span>{p.children}</span><span class="num muted">{p.v}</span></li>; }

function Chronicles() {
  const L = G.S.chron || [];
  return <Panel title="Season chronicles">
    {L.length ? L.map((c: any) => <>
      <p class="eyebrow mt2">Season {c.n}: {c.title}</p>
      {c.lines.map((x: string) => <p class="mt1"><Txt>{x}</Txt></p>)}
    </>) : <Empty>The first chronicle is written when season one ends, 48 weeks in.</Empty>}
  </Panel>;
}

function RecordBook() {
  const R = G.S.rec || {}, M = R.matches || [];
  if (!M.length) return <Panel title="Record book"><Empty>Run a show and the book opens.</Empty></Panel>;
  return <Panel title="Record book">
    <p class="eyebrow">Best matches</p>
    <ul class="list">{M.slice(0, 10).map((m: any) =>
      <Row v={stars(m.ov)}><b class="num">{m.ov}%</b> {m.l}<br /><span class="muted">{m.show}, {wk(m.w)}</span></Row>)}</ul>
    <p class="eyebrow mt3">Best shows</p>
    <ul class="list">{(R.shows || []).map((s: any) => <Row v={s.r + '%'}>{s.n}<br /><span class="muted">{wk(s.w)}</span></Row>)}</ul>
    <p class="eyebrow mt3">High-water marks</p>
    <ul class="list">
      {R.gate ? <Row v={R.gate.v.toLocaleString('en-US')}>Biggest crowd<br /><span class="muted">{R.gate.n}, {wk(R.gate.w)}</span></Row> : null}
      {R.buys ? <Row v={Math.round(R.buys.v).toLocaleString('en-US')}>Most big-event buys<br /><span class="muted">{R.buys.n}, {wk(R.buys.w)}</span></Row> : null}
      {R.streak ? <Row v={R.streak.v + ' straight'}>Longest winning streak<br /><span class="muted">{R.streak.n}</span></Row> : null}
    </ul>
  </Panel>;
}

function Awards() {
  const L = G.S.awards || [];
  return <Panel title="Year-end awards">
    {L.length ? L.map((y: any) => <>
      <p class="eyebrow mt2">{y.year}</p>
      <ul class="list">{y.list.map((x: any) => <Row v={<span class="gold">{x.v}</span>}>{x.k}</Row>)}</ul>
    </>) : <Empty>The awards are handed out in the last week of December.</Empty>}
  </Panel>;
}

function HallOfFame() {
  const L = G.S.hof || [];
  return <Panel title="Hall of fame">
    {L.length ? <ul class="list">{L.map((x: any) => <Row v={'Class of ' + x.year}><b class="gold">{x.n}</b></Row>)}</ul>
      : <Empty>Nobody inducted yet. You choose one name each year after the awards.</Empty>}
  </Panel>;
}

/** One title's reigns, newest first. The current champion is in gold. */
function TitleLine(p: { t: any }) {
  const S = G.S, H = (p.t.hist || []).slice().reverse();
  return <Panel title={p.t.name}>
    {H.length ? <>
      <ul class="list">{H.slice(0, 8).map((x: any) => {
        const who = x.h.join(' & ');
        return <Row v={<>{(x.to == null ? S.week : x.to) - x.from} wk {'·'} {x.defs} def.</>}>
          {x.to == null ? <b class="gold">{who}</b> : who}<br />
          <span class="muted">{x.from <= 1 ? 'Champion when you arrived' : 'Won ' + wk(x.from) + (x.show ? ' at ' + x.show : '')}</span>
        </Row>;
      })}</ul>
      {H.length > 8 ? <p class="muted">{H.length - 8} earlier reigns.</p> : null}
    </> : <Empty>Nobody has held it yet.</Empty>}
  </Panel>;
}

export function History() {
  const P = me();
  return <>
    <Head eyebrow={P.name} title="History" />
    <div class="cols">
      <div class="stack"><Chronicles /><RecordBook /><Awards /><HallOfFame /></div>
      <div class="stack">{P.titles.map((t: any) => <TitleLine t={t} />)}</div>
    </div>
  </>;
}
