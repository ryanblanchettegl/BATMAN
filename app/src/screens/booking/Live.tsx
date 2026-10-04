/* The broadcast: the show you just ran, clicked through a line at a time. Title card, each segment, sign-off. */
import { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, ui, me } from '../../store';
import { book } from '../../flow';
import { Btn, KV, Meter, Banner, BeltArt, Portrait, stars } from '../../kit';
import { verdict, OddsLine, FxList, Crowd } from './Report';
import { typer, preNote, liveNext, liveSkip, liveEnd, liveDone } from './run';

/** Text that types itself out once, when it first appears. Esc, Back or the continue button finishes it at once.
    The part still to come is in the page but hidden, so nothing below it moves while it types. */
function Typed(p: { text: string }) {
  const [n, setN] = useState(() => typer.wanted() ? 0 : -1);
  useEffect(() => n < 0 ? undefined : typer.start(p.text.length, setN, () => setN(-1)), []);
  return <>{n < 0 ? p.text : p.text.slice(0, n)}{n < 0 ? null : <span class="untyped">{p.text.slice(n)}</span>}</>;
}
interface Beat { t: string; x: string }
/** One line of the broadcast. `tk` marks the newest line: it is drawn brighter and typed out. */
function Line(p: { r: any; b: Beat; tk?: string }) {
  const b = p.b, cls = 'ln ' + b.t + (p.tk ? ' last' : ''), text = p.tk ? <Typed key={p.tk} text={b.x} /> : b.x;
  if (b.t === 'note' || b.t === 'ent') return <p class={cls}>{text}</p>;
  const who = b.t === 'pbp' ? p.r.ann[0].split(' ').pop() : (b.t === 'col' ? p.r.ann[1].split(' ').pop() : 'Ring');
  return <p class={cls}><span class="sp">{who}:</span><span class="tx">{text}</span></p>;
}
/** Portraits of both sides, for matches of up to six. */
function VsStrip(p: { s: any }) {
  const S = G.S, ids: number[] = p.s.ids || [], ns = (p.s.sidesN || []).length;
  if (!ns || ids.length > 6 || ids.length % ns) return null;
  const per = ids.length / ns, groups: number[][] = [];
  for (let k = 0; k < ns; k++) groups.push(ids.slice(k * per, k * per + per));
  return <div class="vs">{groups.map((g, k) => <>{k > 0 && <b aria-hidden="true">VS</b>}<span class="row">{g.map(id => S.w[id] ? <Portrait w={S.w[id]} /> : null)}</span></>)}</div>;
}
const Rule = () => <div class="rule" aria-hidden="true">{'═'.repeat(60)}</div>;
const cityOf = (r: any): string => r.venue.replace(/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/, '');

function TitleCard(p: { r: any }) {
  const r = p.r, P = me(), pre = preNote(r), last = r.lineup.length - 1;
  return <>
    <div class="card">
      <Rule /><p class="eyebrow">{P.name} presents</p>
      {r.big ? <Banner text={r.name.replace(P.name + ' ', '')} /> : <div class="show">{r.name}</div>}
      <Rule />
      <p><b>Live from the {r.venue}</b> {'·'} {E.cal(r.week).label}</p>
      <p>Your hosts: {r.ann[0]} and {r.ann[1]}</p>
      <p class="eyebrow mt2">Tonight</p>
      <ol>{r.lineup.map((x: string, i: number) => <li>{i === last ? <><span class="gold">Main event:</span> <b>{x}</b></> : (i + 1) + '. ' + x}</li>)}</ol>
      {pre ? <p class="good">Before the show: {pre}</p> : null}
    </div>
    <Line r={r} b={{ t: 'pbp', x: 'Welcome, everybody, to ' + r.name + '! We are live in ' + cityOf(r) + ' with ' + r.att.toLocaleString('en-US') + ' on hand' + (r.sellout ? ', and this place is sold out!' : '.') }} />
    <Line r={r} tk="open" b={{ t: 'col', x: 'And wait until you see the main event: ' + r.lineup[last].split(' — ')[0] + '.' }} />
  </>;
}
function SignOff(p: { r: any; ms: any[] }) {
  const r = p.r;
  return <>
    <div class="card"><Rule /><p class="eyebrow">That is the show</p><div class="show">{r.rating}%</div><Rule /><p><b>{verdict(r)}</b> ({r.exp}%).</p></div>
    <div class="kv mt2 mb1">
      <KV label="Attendance"><Crowd r={r} /></KV>
      <KV label="TV viewers">{(r.viewers / 1e6).toFixed(2)}M</KV>
      {r.big ? <KV label="Buys">{r.buys.toLocaleString('en-US')}</KV> : null}
      <KV label="Best match">{stars(Math.max(...p.ms.map(s => s.ov)))}</KV>
    </div>
    <Line r={r} tk="close" b={{ t: 'pbp', x: 'For ' + r.ann[1] + ' and everyone at ' + me().name + ', I am ' + r.ann[0] + '. Good night from ' + cityOf(r) + '!' }} />
  </>;
}
function Result(p: { s: any }) {
  const s = p.s;
  if (s.k !== 'match') return <div class="result"><p>The segment: <span class="gold">{stars(s.ov)}</span></p></div>;
  const score = (label: string, v: number, kind?: 'hot' | 'cool' | 'au') => <div class={kind === 'au' ? 'ov' : undefined}><span>{label}</span><span><Meter v={v} kind={kind} /></span></div>;
  return <>
    {s.change ? <BeltArt name={s.title} /> : null}
    <div class="result">
      <p><b>{s.win ? 'Winner: ' + s.win : 'Draw'}</b> {'·'} <span class="gold">{stars(s.ov)}</span></p>
      <OddsLine s={s} />
      <div class="scores">{score('The work', s.mq)}{score('The crowd', s.cr, 'hot')}{score('Effort', s.eff, 'cool')}<div class="ov"><span>Overall</span><span class="gold">{stars(s.ov)}</span></div></div>
      <FxList s={s} max={5} />
    </div>
  </>;
}
function Segment(p: { r: any; ms: any[]; s: any; at: number; done: boolean }) {
  const s = p.s, bc: Beat[] = s.bc || [], mi = p.ms.indexOf(s), shown = bc.slice(0, Math.min(bc.length, p.at + 1));
  const meta = [s.mt, s.mins + ' min']; if (s.stip) meta.push(s.stip);
  return <>
    {s.k === 'match'
      ? <><p class="eyebrow">{(mi === p.ms.length - 1 ? 'Main event' : 'Match ' + (mi + 1) + ' of ' + p.ms.length) + ' · ' + meta.join(' · ')}{s.title ? <> {'·'} <span class="gold">{s.title}</span></> : null}</p><h1>{s.label}</h1><VsStrip s={s} /></>
      : <><p class="eyebrow">{s.head}</p><h1>Meanwhile...</h1></>}
    {shown.map((b, i) => <Line r={p.r} b={b} tk={!p.done && i === shown.length - 1 ? 'b' + i : undefined} />)}
    {p.done ? <Result s={s} /> : null}
  </>;
}

/** Scroll just far enough that a control is clear of the menu bar above and the status bar below. */
function keepInView(el: HTMLElement) {
  const r = el.getBoundingClientRect(), menu = document.querySelector('.ftop') || document.querySelector('.menu'), status = document.querySelector('.ffoot') || document.querySelector('.status');
  const top = (menu ? menu.getBoundingClientRect().bottom : 0) + 8, bottom = (status ? status.getBoundingClientRect().top : window.innerHeight) - 12;
  if (r.bottom > bottom) window.scrollBy(0, r.bottom - bottom); else if (r.top < top) window.scrollBy(0, r.top - top);
}

export function Live(p: { r: any }) {
  const r = p.r, L = book().live!, n = r.segs.length, ms = r.segs.filter((s: any) => s.k === 'match');
  const s = L.s >= 0 && L.s < n ? r.segs[L.s] : null, done = !!s && L.b >= (s.bc || []).length, nx = r.segs[L.s + 1];
  // each time the show moves on, the continue button takes the highlight (so Enter and OK keep it going) and is brought into view
  useLayoutEffect(() => {
    const el = document.getElementById('live-go'); if (!el || ui.modal) return;
    try { el.focus({ preventScroll: true }); keepInView(el); } catch (e) { /* ignore */ }
  }, [r, L.s, L.b]);
  let body: ComponentChildren, foot: ComponentChildren;
  if (L.s < 0) {
    body = <TitleCard r={r} />;
    foot = <><Btn id="live-go" kind="go" t="live-next" onClick={liveNext}>Ring the bell</Btn><Btn kind="sm" t="live-end" onClick={liveEnd}>Skip to the results</Btn></>;
  } else if (!s) {
    body = <SignOff r={r} ms={ms} />;
    foot = <Btn id="live-go" kind="go" t="live-done" onClick={liveDone}>See the full report</Btn>;
  } else {
    body = <Segment key={L.s} r={r} ms={ms} s={s} at={L.b} done={done} />;
    foot = <>
      <Btn id="live-go" kind="go" t="live-next" onClick={liveNext}>{!done ? 'Continue' : (nx ? (nx.k === 'match' ? 'Next match' : 'Next') : 'Close the show')}</Btn>
      {!done && <Btn kind="sm" t="live-skip" onClick={liveSkip}>Skip to the result</Btn>}
      {(L.s < n - 1 || !done) && <Btn kind="sm" t="live-end" onClick={liveEnd}>Skip the rest of the show</Btn>}
    </>;
  }
  return <div class="live" id="live">
    <div class="bar"><span>{r.name}</span><span>{L.s < 0 ? 'On the air' : (L.s >= n ? 'Sign-off' : 'Segment ' + (L.s + 1) + ' of ' + n)}</span></div>
    {body}
    <div class="foot">{foot}<span class="blink" aria-hidden="true">_</span><span class="keys-hint">Enter continue {'·'} Esc skip</span></div>
  </div>;
}
