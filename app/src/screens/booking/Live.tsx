/* The broadcast, on one screen with nothing to scroll. Left: what is on the air (the heading, the commentary, the
   result). Right: tonight's run sheet, with stars for what has aired and a mark on what is on now. Commentary fills
   from the top; when there is more than fits, the oldest lines go off the top, as on a terminal.
   A show on the air runs one segment at a time and nobody knows how it comes out, the booker included: Continue
   asks the engine for the next thing (src/31-live.js). When the gorilla position needs a call, the show stops on a
   box with the choices, and only an answer moves it on. A show on the air cannot be skipped. A finished show can
   be replayed from its report, and a replay can be skipped. */
import { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, ui, me } from '../../store';
import { book } from '../../flow';
import { Btn, KV, Meter, Banner, BeltArt, Portrait, CheckLine, stars, grade } from '../../kit';
import { Verdict, OddsLine, FxList, Crowd } from './Report';
import { typer, preNote, liveNext, liveSkip, liveEnd, liveDone, liveDecide, liveCall, onAir } from './run';
import { hm } from './Segments';

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
  const who = b.t === 'pbp' ? p.r.ann[0].split(' ').pop() : (b.t === 'col' ? p.r.ann[1].split(' ').pop() : (b.t === 'ear' ? 'Headset' : (b.t === 'call' ? 'Gorilla' : 'Ring')));
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
      <p><span class="gold">Tonight’s main event:</span> <b>{r.lineup[last]}</b></p>
      {pre ? <p class="good">Before the show: {pre}</p> : null}
    </div>
    <Line r={r} b={{ t: 'pbp', x: 'Welcome, everybody, to ' + r.name + '! We are live in ' + cityOf(r) + ' with ' + r.att.toLocaleString('en-US') + ' on hand' + (r.sellout ? ', and this place is sold out!' : '.') }} />
    <Line r={r} tk="open" b={{ t: 'col', x: 'And wait until you see the main event: ' + r.lineup[last].split(' — ')[0] + '.' }} />
  </>;
}
function SignOff(p: { r: any; ms: any[] }) {
  const r = p.r;
  return <>
    <div class="card"><Rule /><p class="eyebrow">That is the show</p><div class="show" data-t="show-grade">{grade(r.rating)}</div><Rule /><p><Verdict r={r} /></p></div>
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
      <FxList s={s} max={4} />
    </div>
  </>;
}
/** The heading of what is on the air: what it is, who is in it, and their faces. */
function SegHead(p: { rows: NRow[]; si: number; s: any; eyebrow?: string }) {
  const s = p.s, row = p.rows.find(x => x.si === p.si), nm = p.rows.filter(x => x.match).length, meta = [s.mt, s.mins + ' min']; if (s.stip) meta.push(s.stip);
  return <div class="lv-head">
    {s.k === 'match'
      ? <><div><p class="eyebrow">{p.eyebrow || ((row ? (row.main ? 'Main event' : 'Match ' + row.tag + ' of ' + nm) + ' · ' : '') + meta.join(' · '))}{s.title && !p.eyebrow ? <> {'·'} <span class="gold">{s.title}</span></> : null}</p><h1>{s.label}</h1></div><VsStrip s={s} /></>
      : <div><p class="eyebrow">{p.eyebrow || s.head}</p><h1>{p.eyebrow ? s.head : 'Meanwhile...'}</h1></div>}
  </div>;
}
function SegLines(p: { r: any; s: any; at: number; done: boolean }) {
  const s = p.s, bc: Beat[] = s.bc || [], shown = bc.slice(0, Math.min(bc.length, p.at + 1));
  return <>
    {shown.map((b, i) => <Line r={p.r} b={b} tk={!p.done && i === shown.length - 1 ? 'b' + i : undefined} />)}
    {p.done ? <Result s={s} /> : null}
  </>;
}

/** The call from the gorilla position: what is happening, why now, and the choices. Each choice is one big button
    that says what it does. Only an answer moves the show on. The number keys answer too. */
function CallBox(p: { ev: any }) {
  const ev = p.ev, S = G.S;
  return <div class="callbox" data-t="live-call" data-v={ev.kind}>
    <p class="q"><Typed key={'ev' + ev.id} text={ev.text} /></p>
    {ev.why && ev.why.length ? <p class="muted why">Why now: {ev.why.join('. ')}.</p> : null}
    <div class="callopts">{ev.choices.map((c: any, i: number) => <div key={i}>
      <button type="button" class="callopt" data-t="live-pick" data-c={i} disabled={!!c.bp && S.bp < c.bp} onClick={() => liveDecide(i)}>
        <span class="n"><b>{i + 1}. {c.n}</b>{c.bp ? <span class="bp">{c.bp} BP</span> : null}</span>
        {c.says ? <span class="says">{c.says}</span> : null}
      </button>
      {ev.checks && ev.checks[i] ? <CheckLine label="An attempt" ck={ev.checks[i]} /> : null}
    </div>)}</div>
    <p class="muted callhint">The show waits for your answer. Pick one, or press its number.</p>
  </div>;
}

interface NRow { key: string; at: number | null; tag: string; label: string; si: number; k: number; ran: boolean; ov: number | null; main: boolean; match: boolean }
/** Tonight's run sheet for the side of the broadcast. On the air it comes from the engine; a finished show kept its own. */
function nightRows(r: any, info: any): NRow[] {
  const tag = (x: any) => x.t === 'match' ? String(x.no) : (x.cat === 'promo' ? 'MIC' : 'ANG');
  if (info) return info.sheet.map((x: any) => ({ key: 'k' + x.k, at: x.at, tag: tag(x), label: x.label, si: x.si, k: x.k, ran: x.ran, ov: x.ov, main: x.main, match: x.t === 'match' }));
  if (r.night) return r.night.map((x: any, k: number) => ({ key: 'k' + k, at: x.at, tag: tag(x), label: x.label, si: x.si, k: k, ran: true, ov: x.si >= 0 && r.segs[x.si] ? r.segs[x.si].ov : null, main: !!x.main, match: x.t === 'match' }));
  let n = 0; const last = r.segs.map((s: any) => s.k).lastIndexOf('match');
  return r.segs.map((s: any, j: number) => ({ key: 'k' + j, at: s.at == null ? null : s.at, tag: s.k === 'match' ? String(++n) : 'ANG', label: s.label || s.head, si: j, k: j, ran: true, ov: s.ov, main: j === last, match: s.k === 'match' }));
}
/** Beside the broadcast: everything booked tonight in running order. What has aired shows its stars, what is on now is marked. */
function Night(p: { rows: NRow[]; at: number; done: boolean; wait: number; call: boolean; info: any }) {
  return <aside class="lv-night" data-t="night">
    <h2>Tonight</h2>
    <ol class="nt">{p.rows.map(x => {
      const now = p.wait >= 0 ? x.k === p.wait : (x.si >= 0 && x.si === p.at), seen = x.si >= 0 && x.ov != null && (x.si < p.at || (x.si === p.at && p.done));
      return <li key={x.key} class={'nt-r' + (now ? ' now' : '') + (seen ? ' seen' : '') + (x.main ? ' me' : '')} data-v={now ? 'now' : (seen ? 'seen' : 'next')}>
        <span class="at">{x.at == null ? '' : hm(x.at)}</span><span class="no">{x.tag}</span><span class="who">{x.label}</span>
        <span class="st">{now && p.call ? 'Your call' : (seen ? stars(x.ov as number) : (now ? 'On now' : (x.ran && x.si < 0 ? 'Cut' : '')))}</span>
      </li>;
    })}</ol>
    {p.info ? <div class="muted nt-foot" data-t="night-calls"><p>Calls from the headset: <b>{p.info.calls}</b></p><p>Booking power: <b class="gold">{p.info.bp}</b></p></div> : null}
  </aside>;
}
const DOT = ' · ';

export function Live(p: { r: any }) {
  const r = p.r, air = onAir(), ev = liveCall(), S = G.S, info = air ? E.liveInfo(S) : null;
  // a game loaded with a show on the air picks up where the show had got to
  const L = book().live || (book().live = { s: r.segs.length - 1, b: 9999 });
  const n = air ? S.live.st.steps.length : r.segs.length, ms = r.segs.filter((s: any) => s.k === 'match');
  const s = L.s >= 0 && L.s < r.segs.length ? r.segs[L.s] : null, done = !!s && L.b >= (s.bc || []).length, nx = r.segs[L.s + 1];
  // each time the show moves on, the continue button takes the highlight (so Enter and OK keep it going)
  useLayoutEffect(() => {
    const el = document.getElementById('live-go'); if (!el || ui.modal) return;
    try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }, [r, L.s, L.b, ev ? ev.id : 0]);
  useLayoutEffect(() => {
    const box = document.querySelector('#live .lv-log') as HTMLElement | null, inner = box && box.firstElementChild as HTMLElement | null;
    if (box && inner) box.classList.toggle('full', inner.offsetHeight > box.clientHeight + 1);
    // a call with a lot to say on a small screen: the extras go (the faces, why now, the key hint) so every answer stays on screen
    const live = document.getElementById('live'), main = live && live.querySelector('.lv-main') as HTMLElement | null;
    if (live && main) { live.classList.remove('tight'); if (main.scrollHeight > main.clientHeight + 1) live.classList.add('tight'); }
  });
  const rows = nightRows(r, info), post = ev && ev.phase === 'post' ? r.segs[ev.si] : null;
  let head: ComponentChildren = null, log: ComponentChildren, box: ComponentChildren = null, foot: ComponentChildren, state: string;
  if (ev) {
    state = 'call';
    head = post ? <SegHead rows={rows} si={ev.si} s={post} eyebrow={'Gorilla position · ' + ev.title} />
      : <div class="lv-head"><div><p class="eyebrow">Gorilla position {'·'} {ev.title}</p><h1>{ev.label || 'Your call'}</h1></div></div>;
    log = post ? <SegLines r={r} s={post} at={9999} done={false} /> : (ev.intro || []).map((b: Beat) => <Line r={r} b={b} />);
    box = <CallBox key={'call' + ev.id} ev={ev} />;
    foot = null;
  } else if (L.s < 0) {
    state = 'title';
    log = <TitleCard r={r} />;
    foot = <><Btn id="live-go" kind="go" t="live-next" onClick={liveNext}>Ring the bell</Btn>{air ? null : <Btn kind="sm" t="live-end" onClick={liveEnd}>Skip to the results</Btn>}</>;
  } else if (!s) {
    state = 'signoff';
    log = <SignOff r={r} ms={ms} />;
    foot = <Btn id="live-go" kind="go" t="live-done" onClick={liveDone}>See the full report</Btn>;
  } else {
    state = 'seg';
    head = <SegHead rows={rows} si={L.s} s={s} />;
    log = <SegLines key={L.s} r={r} s={s} at={L.b} done={done} />;
    foot = <>
      <Btn id="live-go" kind="go" t="live-next" onClick={liveNext}>{!done ? 'Continue' : (air ? (S.live.st.k < S.live.st.steps.length ? 'What is next' : 'Go off the air') : (nx ? (nx.k === 'match' ? 'Next match' : 'Next') : 'Close the show'))}</Btn>
      {!done && <Btn kind="sm" t="live-skip" onClick={liveSkip}>Skip to the result</Btn>}
      {!air && (L.s < n - 1 || !done) && <Btn kind="sm" t="live-end" onClick={liveEnd}>Skip the rest of the replay</Btn>}
    </>;
  }
  const now = rows.find(x => ev && !post ? x.k === info.step : (x.si >= 0 && x.si === (post ? ev.si : L.s)));
  return <div class="onescreen live live1" id="live" data-v={state}>
    <div class="bar"><span>{r.name}{air || L.aired ? '' : ' · replay'}</span><span data-t="live-where">{ev ? 'The headset is live' : (L.s < 0 ? 'On the air' : (!s ? 'Sign-off' : (air ? 'On the air' : 'Segment ' + (L.s + 1) + ' of ' + n) + (now && now.at != null ? DOT + hm(now.at) + ' into the show' : '')))}</span></div>
    <div class="lv-body">
      <div class="lv-main">
        {head}
        <div class={'lv-log' + (state === 'title' || state === 'signoff' ? ' mid' : '')}><div class="lv-lines">{log}</div></div>
        {box}
        {ev ? null : <div class="foot">{foot}<span class="blink" aria-hidden="true">_</span><span class="keys-hint">Enter continue</span></div>}
      </div>
      <Night rows={rows} at={post ? ev.si : L.s} done={done || !!post} wait={ev && !post ? info.step : -1} call={!!ev} info={info} />
    </div>
  </div>;
}
