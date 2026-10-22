/* The broadcast, on one screen with nothing to scroll. Left: what is on the air (the heading, the commentary, the
   result). Right: tonight's run sheet, with stars for what has aired and a mark on what is on now. Commentary fills
   from the top; when there is more than fits, the oldest lines go off the top, as on a terminal.
   A show on the air runs one segment at a time and nobody knows how it comes out, the booker included: Continue
   (the SPACE key at the bottom right, or Enter: the broadcast has no continue button of its own)
   asks the engine for the next thing (src/31-live.js). When the gorilla position needs a call, the show stops on a
   box with the choices, and only an answer moves it on. A show on the air cannot be skipped. A finished show can
   be replayed from its report, and a replay can be skipped. */
import { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, ui, me, pref, savePrefs, redraw, reduceMotion } from '../../store';
import { ScenePlayer } from '../../kit/sceneplayer';
import { scenesFor, allScenes, copy, Scene, dressEntrance } from '../../kit/scene';
import { finScene, threeMoves } from '../../kit/caw';
import { recipeOf, Recipe, commentator } from '../../kit/puppet';
import { book } from '../../flow';
import { fillScene, MomentPic, segPick, beatPick } from '../../shared/moment';
import { Btn, KV, Meter, Banner, BeltArt, Belt, Portrait, CheckLine, stars, grade } from '../../kit';
import { Verdict, OddsLine, FxList, Crowd } from './Report';
import { typer, preNote, liveSkip, liveEnd, liveDecide, liveCall, onAir, livePos, autoArm, autoStop, autoToggle, paceNext, PACE_N, tvKeys, liveReplaySeg, canReplaySeg } from './run';
import { Logo } from '../../kit/logo';
import { hm } from './Segments';

/** Text that types itself out once, when it first appears. Esc, Back or the continue button finishes it at once.
    The part still to come is in the page but hidden, so nothing below it moves while it types. */
function Typed(p: { text: string }) {
  const [n, setN] = useState(() => typer.wanted() ? 0 : -1);
  useEffect(() => n < 0 ? undefined : typer.start(p.text.length, setN, () => setN(-1)), []);
  return <>{n < 0 ? p.text : p.text.slice(0, n)}{n < 0 ? null : <span class="untyped">{p.text.slice(n)}</span>}</>;
}
interface Beat { t: string; x: string; h?: number; w?: string }
/** One line of the broadcast. `tk` marks the newest line: it is drawn brighter and typed out. */
function Line(p: { r: any; b: Beat; tk?: string }) {
  const b = p.b, cls = 'ln ' + b.t + (p.tk ? ' last' : '') + (b.h ? ' hot' + (b.h > 1 ? ' hot2' : '') : ''), text = p.tk && pref.pace !== 'tv' ? <Typed key={p.tk} text={b.x} /> : b.x;
  if (b.t === 'note' || b.t === 'ent') return <p class={cls}>{text}</p>;
  const who = b.t === 'mic' ? String(b.w || '').split(' ').pop() : b.t === 'pbp' ? p.r.ann[0].split(' ').pop() : (b.t === 'col' ? p.r.ann[1].split(' ').pop() : (b.t === 'ear' ? 'Headset' : (b.t === 'call' ? 'Gorilla' : 'Ring')));
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

/** The best-graded rival show from the week before this show, or null. Reads only. */
function rivalBest(r: any): { cs: number; l: any; who: string } | null {
  const S = G.S; if (!S || !S.order) return null;
  let best: { cs: number; l: any; who: string } | null = null;
  S.order.forEach((pid: string) => { if (pid === S.player) return; const P = S.promos[pid], l = P && P.last; if (!l || l.week !== r.week - 1) return; const cs = E.repCS(l); if (!best || cs > best.cs) best = { cs, l, who: P.name }; });
  return best;
}
const gA = (g: string) => (/^[AF]/.test(g) ? 'an ' : 'a ') + g;
/** The competition: the night starts with something to beat. */
function Rival(p: { r: any }) {
  const b = rivalBest(p.r); if (!b) return null;
  return <p class="muted" data-t="live-rival">The competition: {b.who} {b.l.name} got <b class="gold">{gA(E.repGrade(b.l))}</b> last week.</p>;
}
/** At the sign-off: did tonight beat it? */
function RivalBeat(p: { r: any }) {
  const b = rivalBest(p.r); if (!b) return null;
  const me = E.repCS(p.r), win = me > b.cs, tie = E.repGrade(p.r) === E.repGrade(b.l);
  return <p data-t="live-rival-beat" class={win ? 'good' : (tie ? 'muted' : 'bad')}>{win ? 'You beat ' : (tie ? 'Level with ' : 'Short of ')}{b.who} {b.l.name}{' ('}{gA(E.repGrade(b.l))}{')'}{'.'}</p>;
}
function TitleCard(p: { r: any }) {
  const r = p.r, P = me(), pre = preNote(r), last = r.lineup.length - 1;
  return <>
    <div class="card">
      <Rule /><p class="eyebrow">{P.name} presents</p>
      {r.big ? <Banner text={r.name.replace(P.name + ' ', '')} /> : <div class="show">{r.name}</div>}
      <Rule />
      <p><b>Live from the {r.venue}</b> {'·'} {E.cal(r.week).label}</p>
      {r.ep && !r.big ? <p class="muted" data-t="live-ep">Episode {r.ep.toLocaleString('en-US')}{r.net ? ' · on ' + r.net : ''}</p> : null}
      {r.occ ? <p class="gold" data-t="live-occ">Tonight: {r.occ.x.toLowerCase()}. The building is up for it.</p> : null}
      <p>Your hosts: {r.ann[0]} and {r.ann[1]}</p>
      <p><span class="gold">Tonight’s main event:</span> <b>{r.lineup[last]}</b></p>
      {pre ? <p class="good">Before the show: {pre}</p> : null}
      <Rival r={r} />
    </div>
    <Line r={r} b={{ t: 'pbp', x: 'Welcome, everybody, to ' + r.name + '! We are live in ' + cityOf(r) + ' with ' + r.att.toLocaleString('en-US') + ' on hand' + (r.sellout ? ', and this place is sold out!' : '.') }} />
    <Line r={r} tk="open" b={{ t: 'col', x: 'And wait until you see the main event: ' + r.lineup[last].split(' — ')[0] + '.' }} />
  </>;
}
/** The night's big moments, as they aired: a new champion first, then the best matches' near falls and finishes. At most three. */
function Moments(p: { ms: any[] }) {
  const L: { h: number; ov: number; x: string; label: string }[] = [];
  p.ms.forEach(s => (s.bc || []).forEach((b: Beat) => { if (b.h) L.push({ h: b.h, ov: s.ov, x: b.x, label: s.label }); }));
  // one moment from each match, the biggest of it
  const seen: Record<string, 1> = {}, top = L.sort((a, b) => (b.h - a.h) || (b.ov - a.ov)).filter(m => seen[m.label] ? false : (seen[m.label] = 1)).slice(0, 3);
  if (!top.length) return null;
  return <div class="moments" data-t="live-moments"><p class="eyebrow">Tonight’s moments</p>{top.map((m, i) => <p key={i} class="ln"><span class="sp gold">{m.h > 1 ? 'Gold' : 'Moment'}:</span><span class="tx">{m.x} <span class="muted">({m.label})</span></span></p>)}</div>;
}
function SignOff(p: { r: any; ms: any[] }) {
  const r = p.r;
  return <>
    <div class="card"><Rule /><p class="eyebrow">That is the show</p><div class="show" data-t="show-grade">{E.repGrade(r)}</div><Rule /><p><Verdict r={r} /></p><RivalBeat r={r} /></div>
    <div class="kv mt2 mb1">
      <KV label="Attendance"><Crowd r={r} /></KV>
      <KV label="TV viewers">{(r.viewers / 1e6).toFixed(2)}M</KV>
      {r.big ? <KV label="Buys">{r.buys.toLocaleString('en-US')}</KV> : null}
      <KV label="Best match">{stars(Math.max(...p.ms.map(s => s.ov)))}</KV>
    </div>
    <Moments ms={p.ms} />
    <Line r={r} tk="close" b={{ t: 'pbp', x: 'For ' + r.ann[1] + ' and everyone at ' + me().name + ', I am ' + r.ann[0] + '. Good night from ' + cityOf(r) + '!' }} />
  </>;
}
function Result(p: { s: any; best?: boolean; fx?: number }) {
  const s = p.s;
  if (s.k !== 'match') return <div class="result"><p>The segment: <span class="gold">{stars(s.ov)}</span></p></div>;
  const score = (label: string, v: number, kind?: 'hot' | 'cool' | 'au') => <div class={kind === 'au' ? 'ov' : undefined}><span>{label}</span><span><Meter v={v} kind={kind} /></span></div>;
  return <>
    {s.change ? (() => { const P = me(), t = (P.titles || []).find((x: any) => x.name === s.title); return t ? <Belt of={t} co={P} dot={2} /> : <BeltArt name={s.title} />; })() : null}
    <div class="result">
      <p><b>{s.win ? 'Winner: ' + s.win : 'Draw'}</b> {'·'} <span class="gold">{stars(s.ov)}</span>{p.best ? <> {'·'} <span class="gold" data-t="live-best">The best match of the night so far</span></> : null}</p>
      <OddsLine s={s} />
      <div class="scores">{score('The work', s.mq)}{score('The crowd', s.cr, 'hot')}{score('Effort', s.eff, 'cool')}<div class="ov"><span>Overall</span><span class="gold">{stars(s.ov)}</span></div></div>
      <FxList s={s} max={p.fx || 4} />
    </div>
  </>;
}
/** How loud the building is at this point of a match. It climbs through the match, jumps on a big moment and
    ends on the crowd score the engine gave the match: it shows the result a beat at a time and never makes one up. */
export function crowdAt(s: any, at: number): number {
  const bc: Beat[] = s.bc || [], n = Math.max(1, bc.length - 1), f = Math.max(0, Math.min(1, at / n)), cr = s.cr || 0;
  let hot = 0; for (let i = 0; i <= Math.min(at, bc.length - 1); i++) if (bc[i].h) hot = i === at ? 8 : Math.max(hot, 3);
  return Math.max(0, Math.min(100, Math.round(cr * (0.4 + 0.6 * Math.pow(f, 1.3)) + (f < 1 ? hot : 0))));
}
const CROWD_W: [number, string][] = [[85, 'on its feet'], [70, 'loud'], [55, 'into it'], [40, 'warming up'], [0, 'quiet']];
function CrowdNow(p: { s: any; at: number }) {
  const v = crowdAt(p.s, p.at), w = (CROWD_W.find(x => v >= x[0]) as [number, string])[1];
  return <p class="lv-crowd" data-t="live-crowd" data-v={v}>The crowd <Meter v={v} kind="hot" n={12} /> {w}</p>;
}
/** The heading of what is on the air: what it is, who is in it, and their faces. */
/** Who a promo or an angle is about, for its chyron: the people booked into it, or the people in the beat. */
function segNames(s: any): string { const S = G.S, ids: number[] = (s.ids && s.ids.length ? s.ids : s.bids) || []; return ids.filter(id => S.w[id]).slice(0, 3).map(id => S.w[id].name).join(' and '); }
function SegHead(p: { rows: NRow[]; si: number; s: any; eyebrow?: string; at?: number }) {
  const s = p.s, row = p.rows.find(x => x.si === p.si), nm = p.rows.filter(x => x.match).length, meta = [s.mt, s.mins + ' min']; if (s.stip) meta.push(s.stip);
  return <div class="lv-head">
    {s.k === 'match'
      ? <><div><p class="eyebrow">{p.eyebrow || ((row ? (row.main ? 'Main event' : 'Match ' + row.tag + ' of ' + nm) + ' · ' : '') + meta.join(' · '))}{s.title && !p.eyebrow ? <> {'·'} <span class="gold">{s.title}</span></> : null}</p><h1>{s.label}</h1>{p.at != null && p.at < (s.bc || []).length ? <CrowdNow s={s} at={p.at} /> : null}</div><VsStrip s={s} /></>
      : <div><p class="eyebrow">{p.eyebrow || s.head}</p><h1>{p.eyebrow ? s.head : (segNames(s) || 'Meanwhile...')}</h1></div>}
  </div>;
}
/** The lines of a segment shown so far (at TV pace only its big moments, its finish and evenly spaced lines). */
function shownBeats(s: any, at: number): Beat[] {
  const bc: Beat[] = s.bc || [], keys = pref.pace === 'tv' ? new Set(tvKeys(s)) : null;
  return bc.slice(0, Math.min(bc.length, at + 1)).filter((_, j) => !keys || keys.has(j) || j === at);
}
/** The best match so far: at least the second match of the night, and better than every one before it. */
function bestSoFar(r: any, s: any): boolean {
  const i = r.segs.indexOf(s), before = i > 0 ? r.segs.slice(0, i).filter((x: any) => x.k === 'match') : [];
  return s.k === 'match' && before.length > 0 && before.every((x: any) => s.ov > x.ov);
}
function SegLines(p: { r: any; s: any; at: number; done: boolean }) {
  const shown = shownBeats(p.s, p.at);
  return <>
    {shown.map((b, i) => <Line r={p.r} b={b} tk={!p.done && i === shown.length - 1 ? 'b' + i : undefined} />)}
    {p.done ? <Result s={p.s} best={bestSoFar(p.r, p.s)} /> : null}
  </>;
}
/** The commentary as closed captions over the picture (Ryan, 21 October: the eye stays on the scene). The newest
    line, with the one before it above it, rolling up as on television. */
function Captions(p: { r: any; s: any; at: number; done: boolean }) {
  const shown = shownBeats(p.s, p.at), from = Math.max(0, shown.length - 2);
  if (!shown.length) return null;
  return <div class="cc" data-t="live-cc" aria-live="polite">{shown.slice(from).map((b, k) => { const i = from + k; return <Line key={'c' + i} r={p.r} b={b} tk={!p.done && i === shown.length - 1 ? 'b' + i : undefined} />; })}</div>;
}

/** The call from the gorilla position: what is happening, why now, and the choices. Each choice is one big button
    that says what it does. Only an answer moves the show on. The number keys answer too. */
function CallBox(p: { ev: any }) {
  const ev = p.ev, S = G.S, n = ev.choices.length;
  return <div class="callbox paper" data-t="live-call" data-v={ev.kind}>
    <div class="cbt"><span class="pbox" aria-hidden="true" /><h2>{'Gorilla position: ' + ev.title}</h2><span class="pbox zoom" aria-hidden="true" /></div>
    <div class="wnfo"><span>{n + ' answers'}</span><span>The show waits for you</span></div>
    <div class="cbb">
    <MomentPic ev={ev} call t="call-pic" />
    <div class="callside">
    <p class="q"><Typed key={'ev' + ev.id} text={ev.text} /></p>
    {ev.why && ev.why.length ? <p class="muted why">Why now: {ev.why.join('. ')}.</p> : null}
    <div class="callopts">{ev.choices.map((c: any, i: number) => <div key={i}>
      <button type="button" class={'callopt ' + (i === 0 ? 'k0' : i === n - 1 ? 'kz' : 'k1')} data-t="live-pick" data-c={i} disabled={!!c.bp && S.bp < c.bp} onClick={() => liveDecide(i)}>
        <span class="n"><b>{i + 1}. {c.n}</b>{c.bp ? <span class="bp">{c.bp} BP</span> : null}</span>
        {c.says ? <span class="says">{c.says}</span> : null}
      </button>
      {ev.checks && ev.checks[i] ? <CheckLine label="If you try it" ck={ev.checks[i]} /> : null}
    </div>)}</div>
    <p class="muted callhint">Pick one, or press its number.</p>
    </div>
    </div>
  </div>;
}

interface NRow { key: string; at: number | null; tag: string; label: string; si: number; k: number; ran: boolean; ov: number | null; main: boolean; match: boolean; cut?: boolean }
/** Tonight's run sheet for the side of the broadcast. On the air it comes from the engine; a finished show kept its own. */
function nightRows(r: any, info: any): NRow[] {
  const tag = (x: any) => x.t === 'match' ? String(x.no) : (x.cat === 'promo' ? 'MIC' : 'ANG');
  if (info) return info.sheet.map((x: any) => ({ key: 'k' + x.k, at: x.at, tag: tag(x), label: x.label, si: x.si, k: x.k, ran: x.ran, ov: x.ov, main: x.main, match: x.t === 'match', cut: x.cut }));
  if (r.night) return r.night.map((x: any, k: number) => ({ key: 'k' + k, at: x.at, tag: tag(x), label: x.label, si: x.si, k: k, ran: true, ov: x.si >= 0 && r.segs[x.si] ? r.segs[x.si].ov : null, main: !!x.main, match: x.t === 'match' }));
  let n = 0; const last = r.segs.map((s: any) => s.k).lastIndexOf('match');
  return r.segs.map((s: any, j: number) => ({ key: 'k' + j, at: s.at == null ? null : s.at, tag: s.k === 'match' ? String(++n) : 'ANG', label: s.label || s.head, si: j, k: j, ran: true, ov: s.ov, main: j === last, match: s.k === 'match' }));
}
/** Beside the broadcast: everything booked tonight in running order. What has aired shows its stars, what is on now is marked. */
/** Tonight's order as a rail of chips under the bar, the way a broadcast shows what is coming: what has been on with
    its stars, what is on now, where the headset is waiting. The right side of the screen is the feed. */
function Night(p: { rows: NRow[]; at: number; done: boolean; wait: number; call: boolean; info: any }) {
  return <nav class="lv-rail" data-t="night" aria-label="Tonight">
    <ol class="nt">{p.rows.map(x => {
      const now = p.wait >= 0 ? x.k === p.wait : (x.si >= 0 && x.si === p.at), seen = x.si >= 0 && x.ov != null && (x.si < p.at || (x.si === p.at && p.done));
      return <li key={x.key} class={'nt-r' + (now ? ' now' : '') + (seen || x.cut ? ' seen' : '') + (x.main ? ' me' : '')} data-v={now ? 'now' : (seen ? 'seen' : 'next')} data-tip={(x.at == null ? '' : hm(x.at) + '  ') + x.label}>
        <span class="at">{x.at == null ? '' : hm(x.at)}</span><span class="no">{x.tag}</span><span class="who">{x.label}</span>
        <span class="st">{now && p.call ? 'Your call' : (seen ? stars(x.ov as number) : (now ? 'On now' : (x.cut || (x.ran && x.si < 0) ? 'Cut' : '')))}</span>
      </li>;
    })}</ol>
  </nav>;
}
/** A fan's picture: a circle cut from coloured card with their first letter. */
const FAN_COL = ['#e64d40', '#4d77c1', '#48a151', '#e2a52b', '#8a4fb0', '#2b8a8a', '#c2577a', '#6b6457'];
function Avatar(p: { x: any }) {
  const S = G.S, x = p.x, w = x.w != null ? S.w[x.w] : null;
  if (w) return <span class="av wr"><Portrait w={w} /></span>;
  if (x.k === 'c') return <span class="av co"><Logo of={S.promos[S.player]} size="chip" /></span>;
  let h = 0; for (const c of String(x.u)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return <span class={'av ' + (x.k === 'p' ? 'press' : 'fan')} style={{ background: x.k === 'p' ? '#17171b' : FAN_COL[Math.abs(h) % FAN_COL.length] }} aria-hidden="true">{x.k === 'p' ? 'W' : String(x.n).replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase()}</span>;
}
/** The right side of the broadcast: what people are posting as the show goes, and how loud the building is. */
function LiveFeed(p: { r: any; si: number; b: number; info: any }) {
  const S = G.S, F = E.liveFeed(S, p.r, p.si, p.b), v = F.crowd.v, n = 16, on = Math.round(v / 100 * n);
  const P = S.promos[S.player], tag = '#' + String(p.r.name || '').replace(/[^A-Za-z0-9]/g, '');
  return <aside class="lv-side">
    <section class="wn fdwin" aria-label="The feed"><header class="ttl"><span aria-hidden="true" /><h2>Ringside</h2><span>{tag}</span></header>
      <div class="bd fd-list" data-t="live-feed">{F.posts.length ? F.posts.slice(0, 12).map((x: any) => <article key={x.id} class={'post k-' + x.k} data-k={x.k}>
        <Avatar x={x} />
        <div class="pb"><p class="ph"><b>{x.n}</b>{x.k === 'w' || x.k === 'c' || x.k === 'p' ? <span class="vf" aria-label="verified">{'✓'}</span> : null}<span class="hn">{x.u}</span><span class="tm">{hm(x.at)}</span></p>
          <p class="pt">{x.t}</p><p class="pm"><span>{'♥'} {x.l.toLocaleString('en-US')}</span><span>{'↻'} {x.r.toLocaleString('en-US')}</span></p></div>
      </article>) : <p class="muted fd-empty">{P ? P.name : 'The company'} is on the air. The feed is waiting for the first bell.</p>}</div>
    </section>
    <p class={'crowdln' + (v >= 85 ? ' wild' : '')} data-t="live-crowd" data-v={v} aria-label={'The crowd: ' + F.crowd.word}><span>The crowd</span><i class="cbar" aria-hidden="true"><i style={{ width: v + '%' }} /></i><b>{F.crowd.word}</b></p>
    {p.info ? <p class="nt-foot" data-t="night-calls"><span>Calls from the headset: <b>{p.info.calls}</b></span><span>Booking power: <b>{p.info.bp}</b></span></p> : null}
  </aside>;
}
const DOT = ' · ';
/** An entrance for one, made into an entrance for a team: each partner a copy of the one walking out, a step
    behind and a little further back, in the same pose, so they come down the ramp together. */
function withPartners(sc: Scene, n: number): Scene {
  const lead = sc.slots.find(x => (x.hook || x.role) === 'a'); if (!lead) return sc;
  const slots = sc.slots.concat(Array.from({ length: n }, (_, j) => ({ id: 'M' + j, n: 'Partner ' + (j + 1), role: 'b' as const, hook: 'mate' + j })));
  const keys = sc.keys.map(kf => { const f = kf.figs[lead.id]; if (!f || f.on) return kf; const figs = { ...kf.figs };
    for (let j = 0; j < n; j++) figs['M' + j] = { ...f, x: f.x - (j + 1) * 1.75 * (f.f || 1), z: f.z - (j + 1) * 0.25, e: j ? f.e : (f.e === 'shout' ? 'shout' : f.e) };
    return { ...kf, figs }; });
  return { ...sc, id: sc.id + '+' + n, slots, keys };
}

const IN_RING = ['ring', 'ringlow', 'ringcorner'];
/** Which scene from Create a Scene fits this moment of the broadcast, and who plays it. It only reads the show:
    the bell and the first exchanges get the lock-up, the middle a trade of blows, a near fall the count and the
    kick-out (the one named first in the line is the one covering), the deciding fall the three count, a new
    champion the belt held high, and a promo the one holding the microphone. */
function scenePick(r: any, s: any, at: number, done: boolean): { sc: Scene; cast: Record<string, Recipe>; play: string; label: string } | null {
  const S = G.S; if (!S || !s) return null;
  const bc: Beat[] = s.bc || [], i = r.segs.indexOf(s), now = Math.min(at, bc.length - 1), cast: Record<string, Recipe> = {};
  const world = E.worldScenes(S) as Scene[], choose = (when: string, salt: number) => { const l = scenesFor(when, world); return l.length ? l[Math.abs((r.week || 0) * 31 + i * 7 + salt) % l.length] : null; };
  const nm = (rc?: Recipe) => rc ? rc.name : '';
  // the canned entrance a wrestler picked in Create a Player, if they did
  const ownEnt = (id: number): Scene | null => { const w = S.w[id], v = w && w.look && w.look.entrance; return v ? allScenes(world).find(x => x.id === v && x.when === 'entrance') || null : null; };
  if (s.k !== 'match') {
    // a booked promo or angle plays its own kind's scene, with the people booked into it (rule 9c)
    if (s.booked && Array.isArray(s.ids) && s.ids.length) {
      const pk = segPick(s.booked, s.ids); if (pk) { Object.assign(cast, pk.cast); return { sc: pk.sc, cast, play: 'g' + i, label: pk.label }; }
    }
    // a beat of a storyline the writers wrote plays that beat's scene
    if (s.beat && Array.isArray(s.bids) && s.bids.length) {
      const pk = beatPick(s.beat, s.bids); if (pk) { Object.assign(cast, pk.cast); return { sc: pk.sc, cast, play: 'b' + i, label: pk.label }; }
    }
    // an attack: the first named does it to the second, and the villain's people come with them
    const txt = String(s.text || ''), named = S.w.filter((w: any) => w && w.promo === S.player && txt.indexOf(w.name) >= 0).sort((x: any, y: any) => txt.indexOf(x.name) - txt.indexOf(y.name)).map((w: any) => w.id as number);
    if (/ambush|brawl|attack|beat|jump/i.test((s.head || '') + ' ' + txt.slice(0, 80)) && named.length >= 2) {
      const sc0 = choose('attack', 0), hk = E.sceneHooks(S, { ids: named, a: named[0], b: named[1] }), sc = sc0 && fillScene(sc0, hk, cast);
      if (sc) return { sc, cast, play: 'a' + i, label: sc.name + ': ' + Object.values(cast).map(nm).join(', ') };
    }
    let who = ''; for (let j = now; j >= 0 && !who; j--) if (bc[j] && bc[j].t === 'mic' && bc[j].w) who = bc[j].w || '';
    const w = who && S.w.find((x: any) => x && x.name === who); if (!w) return null;
    const sc0 = choose('promo', 0); if (!sc0) return null;
    const sc = fillScene(sc0, E.sceneHooks(S, { ids: [w.id].concat(named.filter((x: number) => x !== w.id)), a: w.id }), cast); if (!sc) return null;
    return { sc, cast, play: 'p' + i + ':' + who, label: who + ' on the microphone' };
  }
  const ids: number[] = s.ids || [], ns = (s.sidesN || []).length; if (!ns || !ids.length) return null;
  const per = Math.max(1, Math.floor(ids.length / ns)), sideOf = (id: number) => Math.floor(ids.indexOf(id) / per);
  const first = (txt: string) => { let best = -1, pos = 1e9; ids.forEach(id => { const w = S.w[id], k = w ? txt.indexOf(w.name) : -1; if (k >= 0 && k < pos) { pos = k; best = id; } }); return best; };
  const winSide = s.win ? (s.sidesN as string[]).indexOf(s.win) : -1, winner = winSide >= 0 ? ids[winSide * per] : -1;
  let lastH = -1; bc.forEach((b, j) => { if (b.h) lastH = j; });
  // the entrances: whoever is walking out, in their entrance gear, on their own entrance if they picked one
  // the ring announcer's line before an entrance plays that entrance (they are introduced, they come out)
  let entAt = now;
  if (!done && bc[now] && bc[now].t === 'ring') { const bell = bc.findIndex(b => b.t === 'pbp'); for (let j = now + 1; j < bc.length && (bell < 0 || j < bell); j++) if (bc[j].t === 'ent') { entAt = j; break; } }
  if (!done && bc[entAt] && bc[entAt].t === 'ent') {
    // the entrance line names its own side (the engine brings the champions out last); an old report falls back on the order of the card
    const k = bc.slice(0, entAt + 1).filter(b => b.t === 'ent').length - 1, eb: any = bc[entAt], ew: number[] = Array.isArray(eb.side) ? eb.side.filter((id: number) => !!S.w[id]) : [];
    const who = ew.length ? ew[0] : ids[Math.min(ids.length - 1, k * per)];
    // a newcomer's first time out is the debut's own beat (rule 9c): the teasers paid off, the surprise attack, or just the debut
    // (the broadcast joins a match at its last introduction, so the debut takes the entrance whoever is walking out)
    const dbt = (s.debut || []).find((d: any) => d.id === who) || (s.debut || [])[0];
    if (dbt) { const pk = beatPick('debut_' + dbt.k, [dbt.id].concat(ids.filter(id => sideOf(id) !== sideOf(dbt.id)).slice(0, 1))); if (pk) { Object.assign(cast, pk.cast); return { sc: pk.sc, cast, play: i + ':db' + dbt.id, label: pk.label }; } }
    // a tag team (or a trio) comes out together: the partners walk a step behind on the same entrance (Ryan, 20 October)
    const mates = ew.length ? ew.slice(1, 3) : (per > 1 ? ids.slice(k * per + 1, k * per + per).filter(id => !!S.w[id]).slice(0, 2) : []);
    const ent0 = ownEnt(who) || choose('entrance', k), fx = S.w[who] && S.w[who].look && S.w[who].look.entrance_fx, sc1 = ent0 && dressEntrance(ent0, fx);
    const sc0 = sc1 && mates.length ? withPartners(sc1, mates.length) : sc1, hk: Record<string, number> = { a: who }; mates.forEach((id, j) => { hk['mate' + j] = id; });
    const sc = sc0 && fillScene(sc0, hk, cast);
    if (sc) {
      // a champion wears their belts on the way out, up to three (Ryan, 20 October); tag champions both wear theirs
      const P = S.promos[S.player], beltsOf = (id: number) => P ? P.titles.filter((t: any) => t.holders.indexOf(id) >= 0).sort((a: any, b: any) => b.lvl - a.lvl).slice(0, 3) : [];
      const wear = (id: number, slot: string) => { const h = beltsOf(id); if (h.length && cast[slot]) cast[slot] = { ...cast[slot], belts: h.length, beltL: h.map((t: any) => E.beltOf(t, P)) }; return h.length; };
      const sl = sc.slots.find(x => (x.hook || x.role) === 'a'), held = sl ? wear(who, sl.id) : 0; mates.forEach((id, j) => wear(id, 'M' + j));
      const names = mates.length ? [S.w[who].name].concat(mates.map(id => S.w[id].name)).join(' & ') : nm(cast.A);
      return { sc, cast, play: i + ':e' + k + (held ? 'b' + held : '') + (mates.length ? 'm' + mates.length : ''), label: names + (mates.length ? ' come out' : ' comes out') + (held ? ' with ' + (held === 1 ? 'the gold' : held + ' belts') : '') };
    }
  }
  let when = 'mid', key = 'm', a = ids[0];
  // a line of colour from the desk, between the moves: cut to the two of them, the colour voice talking
  const line = bc[now];
  if (!done && line && line.t === 'col' && !line.h && now !== lastH) {
    const sc = choose('desk2', now); if (sc) { const ann: string[] = r.ann || [];
      cast.C1 = { ...commentator(0), name: ann[0] || 'Play-by-play' }; cast.C2 = { ...commentator(1), name: ann[1] || 'Colour' };
      return { sc, cast, play: i + ':d' + now, label: 'At the desk: ' + (ann[1] || 'the colour voice') + ' talking, with ' + (ann[0] || 'the play-by-play voice') };
    }
  }
  // after the bell, a match that closed a chapter or ended a story plays that beat (a new title is still the champion's picture, unless the story ended)
  if (done && s.story && (s.story.k === 'payoff' || !s.change) && (s.story.w || []).length) {
    const pk = beatPick(s.story.k, [s.story.w[0]].concat((s.story.l || []).slice(0, 1))); if (pk) { Object.assign(cast, pk.cast); return { sc: pk.sc, cast, play: i + ':st', label: pk.label }; }
  }
  if (done && s.change && winner >= 0) { when = 'champion'; key = 'c'; a = winner; }
  else if (winner >= 0 && lastH >= 0 && now >= lastH) { when = 'finish'; key = 'f'; a = winner; }
  else {
    let h = -1; for (let j = now; j >= Math.max(0, now - 1); j--) if (bc[j] && bc[j].h) { h = j; break; }
    if (h >= 0) { when = 'nearfall'; key = 'n' + h; const f = first(bc[h].x); if (f >= 0) a = f; }
    else if (bc.slice(0, now + 1).filter(b => b.t === 'pbp' || b.t === 'col').length <= 2) { when = 'start'; key = 's'; }   // the bell: the first two lines of the call after the introductions
    else { key = 'm' + Math.floor(now / 4); const f = first((bc[now] || { x: '' }).x); if (f >= 0) a = f; }
  }
  let sc0 = choose(when, key.length); if (!sc0) return null;
  // the one in control in the middle of a match: a signature move for this part of it (early, the middle, late), or now and then a taunt
  const lkA = when === 'mid' && S.w[a] ? (S.w[a].look || {}) : null, part = now < bc.length * 0.35 ? 'early' : now < bc.length * 0.7 ? 'mid' : 'late', hsh = Math.abs((r.week || 0) + i * 3 + key.length * 7 + now);
  const all = lkA ? threeMoves(S.w[a], lkA.finishing_moves).slice(1) : [], here = all.filter((m: any) => (m.stage || 'mid') === part), sigs = here.length ? here : all;
  const tn = lkA ? (lkA.taunts || []).map((id: string) => allScenes(world).find(x => x.id === id && x.when === 'taunt')).filter(Boolean) as Scene[] : [];
  if (tn.length && (!sigs.length || hsh % 3 === 0)) sc0 = tn[hsh % tn.length];
  else if (sigs.length) { const sm = sigs[hsh % sigs.length], fs = allScenes(world).find(x => x.id === finScene(sm));
    if (fs) { sc0 = copy(fs); const lk0 = sc0.keys[sc0.keys.length - 1]; let named = false; lk0.props.forEach(q => { if (q.k === 'burst') { q.txt = sm.name.toUpperCase().slice(0, 16); named = true; } }); if (!named) lk0.props.push({ id: 'sig', k: 'burst', x: 3.6, y: 2.8, r: 0, z: 3, s: 1, txt: sm.name.toUpperCase().slice(0, 16) }); sc0.name = sm.name; } }
  // a winner made in Create a Player finishes with their own move: its picture, with its name in the burst
  const fm = when === 'finish' && S.w[a] && S.w[a].look && (S.w[a].look.finishing_moves || [])[0];
  if (fm) { const fs = allScenes(world).find(x => x.id === finScene(fm)); if (fs) { sc0 = copy(fs); sc0.keys.forEach(k => k.props.forEach(q => { if (q.k === 'burst' && k === sc0!.keys[sc0!.keys.length - 1]) q.txt = fm.name.toUpperCase().slice(0, 16); })); sc0.name = fm.name; } }
  // a match under rules with a set of its own is played there: the cage, the cell with its roof, the ring of fire, the belt hung for the ladder
  const sk = s.sk || Object.keys(E.STIP).find(k => E.STIP[k].n === s.stip) || '', rig = E.STIP[sk] && E.STIP[sk].set;
  if (rig && IN_RING.includes(sc0.set)) sc0 = { ...sc0, set: rig };
  const b = ids.find(id => sideOf(id) !== sideOf(a)), wins = winSide >= 0 ? ids.filter(id => sideOf(id) === winSide) : [];
  const sc = fillScene(sc0, E.sceneHooks(S, { ids, a, b, win: wins, title: s.title || null }), cast); if (!sc) return null;
  return { sc, cast, play: i + ':' + key, label: sc.name + ': ' + Object.values(cast).map(nm).join(' and ') };
}
function picsToggle() { pref.pics = !pref.pics; savePrefs(); redraw(); }

export function Live(p: { r: any }) {
  const r = p.r, air = onAir(), ev = liveCall(), S = G.S, info = air ? E.liveInfo(S) : null;
  // a game loaded with a show on the air picks up where the show had got to
  const L = livePos(r);
  const n = air ? S.live.st.steps.length : r.segs.length, ms = r.segs.filter((s: any) => s.k === 'match');
  const s = L.s >= 0 && L.s < r.segs.length ? r.segs[L.s] : null, done = !!s && L.b >= (s.bc || []).length, nx = r.segs[L.s + 1];
  // each time the show moves on, the SPACE key takes the highlight (so Enter and OK keep it going). On a call the highlight is left to the answers.
  useLayoutEffect(() => {
    const el = document.querySelector('[data-t="advance"]') as HTMLElement | null; if (!el || ui.modal || ev) return;
    try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }, [r, L.s, L.b, ev ? ev.id : 0]);
  useLayoutEffect(() => {
    const box = document.querySelector('#live .lv-log') as HTMLElement | null, inner = box && box.firstElementChild as HTMLElement | null;
    if (box && inner) box.classList.toggle('full', inner.offsetHeight > box.clientHeight + 1);
    // a call with a lot to say on a small screen: the extras go (the faces, why now, the key hint) so every answer stays on screen
    const live = document.getElementById('live'), main = live && live.querySelector('.lv-main') as HTMLElement | null;
    if (live && main) { live.classList.remove('tight'); if (main.scrollHeight > main.clientHeight + 1) live.classList.add('tight'); }
  });
  // auto-play: re-armed every time the screen moves on, stopped when the broadcast goes
  const akey = r.week + ':' + r.id + ':' + L.s + ':' + L.b + ':' + (ev ? ev.id : 0) + ':' + (pref.auto ? 1 : 0) + pref.pace;
  useEffect(() => { autoArm(akey); }, [akey]);
  useEffect(() => () => autoStop(), []);
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
    foot = air ? null : <Btn kind="sm" t="live-end" onClick={liveEnd}>Skip to the results</Btn>;
  } else if (!s) {
    state = 'signoff';
    log = <SignOff r={r} ms={ms} />;
    foot = null;
  } else {
    state = 'seg';
    head = <SegHead rows={rows} si={L.s} s={s} at={L.b} />;
    log = <SegLines key={L.s} r={r} s={s} at={L.b} done={done} />;
    foot = <>
      {!done && <Btn kind="sm" t="live-skip" onClick={liveSkip}>Skip to the result</Btn>}
      {!air && (L.s < n - 1 || !done) && <Btn kind="sm" t="live-end" onClick={liveEnd}>Skip the rest of the replay</Btn>}
    </>;
  }
  // with the scenes on, the commentary runs as captions over the picture, and when the segment ends the result pops up over its last moment
  const pk = pref.pics && !ev && state === 'seg' && s ? scenePick(r, s, L.b, done) : null;
  const now = rows.find(x => ev && !post ? x.k === info.step : (x.si >= 0 && x.si === (post ? ev.si : L.s)));
  // on the air the clock runs through the segment as its lines are read, up to where the next one starts
  const nxt = now && now.at != null ? rows.find(x => x.at != null && x.at > (now.at as number)) : null, span = nxt && now && now.at != null ? (nxt.at as number) - now.at : 0;
  return <div class="onescreen live live1" id="live" data-v={state}>
    <div class="bar"><span>{r.name}{air || L.aired ? '' : ' · replay'}</span><span data-t="live-where">{ev ? 'The headset is live' : (L.s < 0 ? 'On the air' : (!s ? 'Sign-off' : (air ? 'On the air' : 'Segment ' + (L.s + 1) + ' of ' + n) + (now && now.at != null ? DOT + hm(Math.round(now.at + span * (air ? Math.min(1, Math.max(0, ((L.b || 0) + 1) / Math.max(1, ((s && s.bc) || []).length))) : 0))) + ' into the show' : '')))}</span></div>
    <Night rows={rows} at={post ? ev.si : L.s} done={done || !!post} wait={ev && !post ? info.step : -1} call={!!ev} info={info} />
    <div class="lv-body">
      <div class="lv-main">
        {pk ? <div class="tvframe" data-t="tv"><ScenePlayer key="scene" sc={pk.sc} cast={pk.cast} play={pk.play} label={pk.label} still={reduceMotion()} fill /><div class="chyron">{head}</div><span class="bug" aria-hidden="true"><Logo of={S.promos[S.player]} size="chip" /><i class="dot" />LIVE</span>{done ? <div class="lv-res" data-t="live-res" role="dialog" aria-label="The result"><Result s={s} best={bestSoFar(r, s)} fx={3} /></div> : <Captions key={L.s} r={r} s={s} at={L.b} done={done} />}</div> : head}
        {pk ? null
          : <div class={'lv-log' + (state === 'title' || state === 'signoff' ? ' mid' : '')}><div class="lv-lines">{log}</div></div>}
        {box}
        {ev ? null : <div class="foot">{foot}{canReplaySeg() ? <Btn kind="sm" t="live-replay" tip="Play this segment again from the start" onClick={liveReplaySeg}>Replay</Btn> : null}<Btn kind="sm" t="live-pics" on={!!pref.pics} onClick={picsToggle}>{pref.pics ? 'Scenes: on' : 'Scenes: off'}</Btn><Btn kind="sm" t="live-auto" on={!!pref.auto} onClick={autoToggle}>{pref.auto ? 'Auto-play: on' : 'Auto-play: off'}</Btn>{pref.auto ? <Btn kind="sm" t="live-pace" onClick={paceNext}>{'Pace: ' + PACE_N[pref.pace]}</Btn> : null}<span class="blink" aria-hidden="true">_</span><span class="keys-hint">{state === 'signoff' ? 'Space: after the show' : (pref.auto ? (state === 'title' ? 'Space: ring the bell. The show then runs itself and stops for your calls' : 'Running itself, and stops after each segment. Space: next. R: replay. P: pause') : 'Space or Enter: on with the show. R: replay. P: auto-play')}</span></div>}
      </div>
      <LiveFeed r={r} si={post ? ev.si : L.s} b={post ? 9999 : L.b} info={info} />
    </div>
  </div>;
}
