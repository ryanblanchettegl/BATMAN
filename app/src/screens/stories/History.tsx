/* History: season chronicles, the record book, year-end awards, the hall of fame and every title's line of champions. Read-only. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, me, openModal, slice, view } from '../../store';
import { ReviewBody } from '../office/Desk';
import { Head, Panel, Empty, stars, Txt, Btn, grade, Name, Desktop, Win, ListBox, Row as KRow } from '../../kit';

const wk = (w: number): string => E.cal(Math.max(1, w)).label;
/** One line of a list: what it is on the left, the figure on the right. */
function Row(p: { children: ComponentChildren; v: ComponentChildren }) { return <li><span>{p.children}</span><span class="num muted">{p.v}</span></li>; }

/** The season in review (post-mortems): the year's causes, kept for the history books. */
function SeasonReviews() {
  const L = E.seasonReviews(G.S); if (!L.length) return null;
  return <Panel title="The season in review"><div data-t="pm-season">{L.slice(0, 1).map((r: any, i: number) => <div key={i}><p class="eyebrow">{r.label}</p><ReviewBody r={r} /></div>)}</div></Panel>;
}
function Chronicles() {
  const L = G.S.chron || [];
  return <Panel title="Season chronicles">
    {L.length ? L.map((c: any) => <>
      <p class="eyebrow mt2">Season {c.n}: {c.title}</p>
      {c.lines.map((x: string) => <p class="mt1"><Txt>{x}</Txt></p>)}
    </>) : <Empty>The first chronicle is written when season one ends, 48 weeks in. Keep booking shows until then.</Empty>}
  </Panel>;
}

/** The year's best matches across every promotion so far. Each opens a short card with the details. */
/** The moments kept from your shows (src/84-kept.js), newest first, in the words they were called. */
const KEPT_TAG: Record<string, string> = { gold: 'New champion', upset: 'Upset', streak: 'Streak broken', match: 'Five stars' };
function KeptList(p: { n: number }) {
  const L: any[] = E.kept(G.S).slice(0, p.n);
  return <ul class="list" data-t="kept">{L.map((k, i) => <li key={k.w + ':' + i} class="col"><span><span class="gold">{KEPT_TAG[k.k] || 'Moment'}</span> {'·'} <Txt>{k.label}</Txt> <span class="muted">{'·'} {k.show}, {wk(k.w)}</span></span><span><Txt>{'“' + k.x + '”'}</Txt></span></li>)}</ul>;
}
function Kept() {
  const all = E.kept(G.S).length, L: any[] = E.kept(G.S).slice(0, 3);
  return <Panel title="Moments kept">
    {all > 3 ? <div class="row mb1"><Btn kind="sm" t="hist-kept" onClick={() => openModal({ kind: 'info', title: 'Moments kept', wide: true, body: () => <KeptList n={40} /> })}>All {all} moments</Btn></div> : null}
    {L.length ? <ul class="list" data-t="kept">{L.map((k, i) => <li key={k.w + ':' + i} class="col"><span><span class="gold">{KEPT_TAG[k.k] || 'Moment'}</span> {'·'} <Txt>{k.label}</Txt> <span class="muted">{'·'} {k.show}, {wk(k.w)}</span></span><span><Txt>{'“' + k.x + '”'}</Txt></span></li>)}</ul>
      : <Empty>Nothing kept yet. A new champion, an upset, a long streak broken or a five-star match will be.</Empty>}
  </Panel>;
}
/** The greatest feuds you have run: how long, how hot, and how they ended (src/21-living.js, feudFile). */
function Feuds() {
  const L: any[] = E.feudBook(G.S), HOW: Record<string, string> = { end: 'settled', fizzle: 'faded', drop: 'dropped' };
  const line = (x: any) => <><Txt>{x.l}</Txt><br /><span class="muted">{x.e - x.s} weeks, at its hottest {x.pk}{x.r ? ', ' + x.r + (x.r === 1 ? ' round' : ' rounds') : ''}, {HOW[x.how] || 'ended'} {wk(x.e)}</span></>;
  return <Panel title="Greatest feuds">
    {L.length > 3 ? <div class="row mb1"><Btn kind="sm" t="feuds-all" onClick={() => openModal({ kind: 'info', title: 'Greatest feuds', wide: true, body: () => <ol class="rank">{L.map((x: any, i: number) => <li key={i}>{line(x)}</li>)}</ol> })}>All {L.length}</Btn></div> : null}
    {L.length ? <ol class="rank" data-t="feud-book">{L.slice(0, 3).map((x: any, i: number) => <li key={i}>{line(x)}</li>)}</ol> : <Empty>No feud has finished yet. End one at its peak and it goes in the book.</Empty>}
  </Panel>;
}
function MatchOfYear() {
  const L: any[] = E.matchOfYear(G.S);
  const open = (m: any) => openModal({ kind: 'info', title: m.l, body: () => <>
    <p class="gold">{stars(m.ov)}</p>
    <p class="mt1">{m.promoName} {'·'} {m.show} {'·'} {wk(m.w)}</p>
    <p>{m.mt}{m.stip ? ' · ' + m.stip : ''}{m.mins ? ' · ' + m.mins + ' min' : ''}{m.title ? ' · ' + m.title : ''}</p>
    <p class="mt1">{m.win ? 'Winner: ' + m.win : 'No winner'}</p></> });
  return <Panel title="Match of the year, so far">
    {L.length > 3 ? <div class="row mb1"><Btn kind="sm" t="moty-all" onClick={() => openModal({ kind: 'info', title: 'Match of the year, so far', wide: true, body: () => <ol class="rank">{L.map((m: any) => <li><b class="gold">{stars(m.ov)}</b> <Txt>{m.l}</Txt><br /><span class="muted">{m.promoName} {'·'} {m.show} {'·'} {wk(m.w)}</span></li>)}</ol> })}>The whole list</Btn></div> : null}
    {L.length ? <ol class="rank">{L.slice(0, 3).map((m, i) => <li key={m.w + m.l}><Btn kind="sm" t="moty" d={{ v: i }} onClick={() => open(m)}>Details</Btn> <b class="gold">{stars(m.ov)}</b> <Txt>{m.l}</Txt><br /><span class="muted">{m.promoName}, {m.show}, {wk(m.w)}</span></li>)}</ol>
      : <Empty>No matches yet this year. Run a show and the list starts.</Empty>}
  </Panel>;
}

function RecordBook() {
  const R = G.S.rec || {}, M = R.matches || [];
  if (!M.length) return <Panel title="Record book"><Empty>Run a show on Booking and the book opens.</Empty></Panel>;
  return <Panel title="Record book">
    <ul class="list">{M.slice(0, 3).map((m: any) => <Row v={stars(m.ov)}>{m.l}<br /><span class="muted">{m.show}, {wk(m.w)}</span></Row>)}</ul>
    <div class="row mt1"><Btn kind="sm" t="hist-book" onClick={() => openModal({ kind: 'info', title: 'Record book', wide: true, body: () => <RecordBookFull /> })}>The whole book</Btn></div>
  </Panel>;
}
function RecordBookFull() {
  const R = G.S.rec || {}, M = R.matches || [];
  return <Panel title="Record book">
    <p class="eyebrow">Best matches</p>
    <ul class="list">{M.slice(0, 10).map((m: any) =>
      <Row v={stars(m.ov)}>{m.l}<br /><span class="muted">{m.show}, {wk(m.w)}</span></Row>)}</ul>
    <p class="eyebrow mt3">Best shows</p>
    <ul class="list">{(R.shows || []).map((s: any) => <Row v={grade(s.c != null ? s.c : s.r)}>{s.n}<br /><span class="muted">{wk(s.w)}</span></Row>)}</ul>
    <p class="eyebrow mt3">High-water marks</p>
    <ul class="list">
      {R.gate ? <Row v={R.gate.v.toLocaleString('en-US')}>Biggest crowd<br /><span class="muted">{R.gate.n}, {wk(R.gate.w)}</span></Row> : null}
      {R.buys ? <Row v={Math.round(R.buys.v).toLocaleString('en-US')}>Most big-event buys<br /><span class="muted">{R.buys.n}, {wk(R.buys.w)}</span></Row> : null}
      {R.streak ? <Row v={R.streak.v + ' straight'}>Longest winning streak<br /><span class="muted">{R.streak.n}</span></Row> : null}
    </ul>
  </Panel>;
}

function PowerYears() {
  const L: any[] = E.powerYears(G.S);
  return <Panel title="The year's top 25">
    {L.length ? L.slice(0, 2).map((y: any) => ({ year: y.year, l: y.l.slice(0, 25).filter((x: any) => !Array.isArray(x)) })).map((y: any) => <>
      <p class="eyebrow mt2">{y.year}</p>
      <ul class="list" data-t="power-year">{y.l.map((x: any, i: number) => <Row v={<span class="muted">{x.was ? (x.was === i + 1 ? 'same place' : (x.was > i + 1 ? 'up from ' + x.was : 'down from ' + x.was)) : 'new'}</span>}>{i + 1}. <b>{x.n}</b> <span class="muted">{x.p}</span></Row>)}</ul>
    </>) : <Empty>The list is drawn up with the awards in the last week of December: the twenty-five wrestlers the whole business is talking about.</Empty>}
  </Panel>;
}
function Awards() {
  const L = G.S.awards || [];
  return <Panel title="Year-end awards">
    {L.length ? L.map((y: any) => <>
      <p class="eyebrow mt2">{y.year}</p>
      <ul class="list">{y.list.map((x: any) => <><Row v={<span class="gold">{x.v}</span>}>{x.k}</Row>{x.sp ? <li class="col"><span class="muted">{x.sp}</span></li> : null}</>)}</ul>
    </>) : <Empty>The awards are handed out in the last week of December. Keep your best wrestlers on the card until then.</Empty>}
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
  const S = G.S, H = (p.t.hist || []).slice().reverse(), now = H[0] && H[0].to == null ? H[0] : null;
  return <Panel title={p.t.name}>
    {!H.length ? <Empty>Nobody has held it yet. Book a match for the title and the winner is crowned.</Empty>
      : <p>{now ? <><b class="gold">{now.h.join(' & ')}</b> <span class="muted">{'·'} {S.week - now.from} wk, {now.defs} def.</span></> : <span class="muted">Vacant</span>}{H.length > 1 ? <span class="muted"> {'·'} {H.length} reigns</span> : null}</p>}
    {H.length ? <div class="row mt1"><Btn kind="sm" t="hist-line" d={{ v: p.t.id }} onClick={() => openModal({ kind: 'info', title: p.t.name, wide: true, body: () => <TitleLineFull t={p.t} /> })}>The line of champions</Btn></div> : null}
  </Panel>;
}
function TitleLineFull(p: { t: any }) {
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
    </> : <Empty>Nobody has held it yet. Book a match for the title and the winner is crowned.</Empty>}
  </Panel>;
}

/** Records from every company: pick a record and which way to sort. Every name opens its card. */
function Records() {
  const S = G.S, st = slice<{ k: string; asc: boolean }>('records', () => ({ k: 'reigns', asc: false })), rec = E.RECK.filter((r: any) => r.id === st.k)[0] || E.RECK[0];
  const L = E.records(S, rec.id, st.asc);
  return <Panel title="Records">
    <div class="row opts">{E.RECK.map((r: any) => <Btn kind="sm" on={r.id === rec.id} t="rec" d={{ v: r.id }} onClick={() => view(() => { st.k = r.id; })}>{r.n}</Btn>)}
      <Btn kind="sm" t="rec-sort" onClick={() => view(() => { st.asc = !st.asc; })}>{st.asc ? 'Lowest first' : 'Highest first'}</Btn></div>
    {L.length ? <ul class="list mt1">{L.map((r: any, i: number) => <li><span><span class="num">{i + 1}.</span> {r.w.length ? r.w.map((w: any, j: number) => <>{j ? ' & ' : ''}<Name w={w} /></>) : null}{r.note ? <span class="muted">{r.w.length ? ' · ' : ''}{r.note}</span> : null}</span><span class="num gold">{r.v.toLocaleString('en-US')} <span class="muted">{rec.unit}</span></span></li>)}</ul>
      : <Empty>Nothing in this record yet. It fills as the shows go on.</Empty>}
  </Panel>;
}

const BOOKS: { id: string; n: string; body: () => ComponentChildren }[] = [
  { id: 'titles', n: 'Titles and champions', body: () => <>{me().titles.map((t: any) => <TitleLine t={t} />)}</> },
  { id: 'feuds', n: 'Greatest feuds', body: () => <Feuds /> },
  { id: 'records', n: 'Records', body: () => <><RecordBook /><Records /></> },
  { id: 'moty', n: 'Match of the year', body: () => <MatchOfYear /> },
  { id: 'kept', n: 'Moments kept', body: () => <Kept /> },
  { id: 'awards', n: 'Year-end awards', body: () => <Awards /> },
  { id: 'power', n: "The year's top 25", body: () => <PowerYears /> },
  { id: 'hof', n: 'Hall of fame', body: () => <HallOfFame /> },
  { id: 'chron', n: 'Season chronicles', body: () => <><SeasonReviews /><Chronicles /></> }
];
export function History() {
  const P = me();
  // for the browser tests: every section laid out on the page, as it was
  if ((window as any).EWF_FLAT) return <div class="onescreen winpage">
    <Head eyebrow={P.name} title="History" />
    <div class="cols">
      <div class="stack"><Chronicles /><Kept /><MatchOfYear /><RecordBook /><Records /><Awards /><HallOfFame /></div>
      <div class="stack"><Feuds />{P.titles.map((t: any) => <TitleLine t={t} />)}</div>
    </div>
  </div>;
  const st = slice<{ k: string }>('history', () => ({ k: 'titles' })), cur = BOOKS.find(b => b.id === st.k) || BOOKS[0];
  return <div class="onescreen"><div class="head sr"><h1>History</h1></div><Desktop cls="hspage" t="history">
    <Win title={'The books of ' + P.name} area="list" t="hist-list">
      <ListBox cols="1fr" label="Sections">{BOOKS.map(b => <KRow key={b.id} sel={b.id === cur.id} onPick={() => view(() => { st.k = b.id; })} t="hist-sec" d={{ v: b.id }} label={b.n}><span>{b.n}</span></KRow>)}</ListBox>
    </Win>
    <Win title={cur.n} area="pane" t="hist-pane"><div class="hspane">{cur.body()}</div></Win>
  </Desktop></div>;
}
