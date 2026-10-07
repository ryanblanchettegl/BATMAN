/* World: every promotion ranked by popularity with where you stand with each, the news wire and the power ten. Read-only:
   supershows, wars and trades are proposed on Manage. */
import { E } from '../../engine';
import { G, cash, slice, view } from '../../store';
import { Head, Panel, Tag, Meter, Empty, Txt, Name, PromoName, Btn, grade } from '../../kit';

function Promotions() {
  const S = G.S, ids = S.order.slice().sort((a: string, b: string) => S.promos[b].image - S.promos[a].image);
  return <div class="tw mb3"><table>
    <thead><tr><th>Promotion</th><th>Model</th><th>Popularity</th><th class="r">Relations</th><th class="r">Cash</th><th class="r">Roster</th><th>Top champion</th><th>Last show</th></tr></thead>
    <tbody>{ids.map((id: string) => {
      const P = S.promos[id], rel = Math.round(P.rel || 0), top = P.titles.filter((t: any) => !t.tag).sort((a: any, b: any) => (b.lvl - a.lvl) || (a.g === 'M' ? -1 : 1))[0];
      return <tr class={id === S.player ? 'on' : undefined}>
        <td><span class="nm"><PromoName id={id} /></span>{id === S.player ? <> <Tag>You</Tag></> : null}</td>
        <td class="muted">{E.modelOf(S, id).n}</td>
        <td><Meter v={P.image} /> <span class="num">{P.image.toFixed(1)}</span></td>
        <td class={'r num ' + (id === S.player ? 'muted' : (rel >= 20 ? 'good' : (rel <= -20 ? 'bad' : 'muted')))}>{id === S.player ? '—' : (rel > 0 ? '+' : '') + rel}</td>
        <td class="r num">{cash(P.cash)}</td>
        <td class="r num">{E.rosterOf(S, id).length}</td>
        <td>{top && top.holders.length ? <Name w={S.w[top.holders[0]]} /> : <span class="muted">Vacant</span>}</td>
        <td>{P.last ? <>{P.last.name} <b class="gold">{E.repGrade(P.last)}</b></> : <span class="muted">—</span>}</td>
      </tr>;
    })}</tbody>
  </table></div>;
}

const FILTERS: [string, string, string[] | null][] = [['all', 'All', null], ['title', 'Titles', ['title']], ['sign', 'Signings', ['contract']], ['story', 'Stories', ['story']], ['money', 'Money', ['money']]];
function wire() { return slice<{ f: string }>('wire', () => ({ f: 'all' })); }
/** The newest `n` lines of the news wire, optionally only one kind. */
export function NewsList(p: { n: number; kinds?: string[] | null }) {
  const S = G.S, L = p.kinds ? S.news.filter((x: any) => p.kinds!.indexOf(x.k) >= 0) : S.news;
  if (!L.length) return <Empty>{p.kinds ? 'Nothing of that kind yet.' : 'No news yet.'}</Empty>;
  return <ul class="list news">{L.slice(0, p.n).map((x: any) => <li><span class="num muted">Wk {x.w}</span><span><Txt>{x.t}</Txt></span></li>)}</ul>;
}
function NewsWire() {
  const st = wire(), cur = FILTERS.find(f => f[0] === st.f) || FILTERS[0];
  return <Panel title="News wire">
    <div class="row opts mb2">{FILTERS.map(f => <Btn kind="sm" on={f[0] === cur[0]} t="newsf" d={{ v: f[0] }} onClick={() => view(() => { st.f = f[0]; })}>{f[1]}</Btn>)}</div>
    <NewsList n={60} kinds={cur[2]} />
  </Panel>;
}

function PowerTen() {
  const S = G.S;
  return <Panel title="The power ten">
    <ol class="rank">{E.power(S, 10).map((w: any) =>
      <li>{w.promo === S.player ? <b>{w.name}</b> : w.name} <span class="muted">{S.promos[w.promo].name} {'·'} {Math.round(w.yp || 0)} pts</span></li>)}</ol>
    <p class="muted mt2">The best year anyone is having, across every promotion. Wins on bigger stages count for more. The top name in the last week of December is wrestler of the year.</p>
  </Panel>;
}

/** A supershow or a war already running: who with, until when, the series score and who is visiting. */
function Arrangement() {
  const S = G.S, x = E.xfState(S);
  if (!x) return null;
  return <p class="note mb3"><span>{x.kind === 'war' ? 'At war with ' : 'Supershow with '}{S.promos[x.with].name} until {E.cal(x.until).label}. Series: {x.sc[0]}–{x.sc[1]}. Visiting: {x.guests.map((id: number) => S.w[id].name).join(', ')}.</span></p>;
}

export function World() {
  const S = G.S;
  return <>
    <Head eyebrow={E.cal(S.week).label} title="World" />
    <Promotions />
    <Arrangement />
    <div class="cols wire">
      <NewsWire />
      <PowerTen />
    </div>
  </>;
}
