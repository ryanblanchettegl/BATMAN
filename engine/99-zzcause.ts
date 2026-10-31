/* The cause log (docs/plans/cause-log.md, MASTER §7 row L1). Every change to cash, popularity, owner trust and the
   roster's mood is booked to a named cause, and each cause says whether it was a player decision. It only reads the
   game: frames snapshot the meters when they open and book the change when they close, minus what their children
   booked. A change made outside every frame is booked as "untracked" when the next frame opens, so nothing is lost.
   Never rnd(S). State: S.cz (left out of the golden fingerprint, like S.dir); the open frames live on S, unsaved.
   wraps: 31-live.js, 40-week.js, 55-preshow.js, 77-backstage.js, 79-people.js, 90-api.js (it must sort after them; test-buildorder.js checks) */
import { L as $L } from './_gen/legacy.js';
import { E } from './00-core';
import { SHOWX, WEEKX } from './10-match';

export const CZ_METERS = ['cash', 'pop', 'trust', 'morale'];
const SEASON = 48;
/** E functions that run the game rather than answer a choice: what they move is a consequence, not a decision. */
const NOT_DEC: any = { endWeek: 'other', runPlayerShow: 'show:night', liveBegin: 'show:night', liveNext: 'show:night', livePlay: 'show:night', suggest: 'booking aid', fitShow: 'booking aid', preShow: 'booking aid', validate: 'booking aid' };

type Snap = { v: number[]; id: Int32Array; m: Float64Array; n: number };
function stackOf(S: any): any[] {
  let s = S._czs;
  if (!s) { s = []; Object.defineProperty(S, '_czs', { value: s, enumerable: false, writable: true }); }
  return s;
}
/** One pass over S.w: the four meters, and the ids and moods of the player's roster only. A wrestler's id is its index
    in S.w, which only ever grows (nothing splices it), so ids line up between two readings.
    */
let bufId = new Int32Array(256), bufM = new Float64Array(256);
function czRead(S: any): Snap {
  const P = S.promos[S.player], W = S.w, me = S.player;
  let t = 0, n = 0;
  for (let i = 0; i < W.length; i++) {
    const w = W[i];
    if (w && w.promo === me) {
      if (n === bufId.length) { const a = new Int32Array(n * 2), b = new Float64Array(n * 2); a.set(bufId); b.set(bufM); bufId = a; bufM = b; }
      const x = w.morale || 0; bufId[n] = i; bufM[n] = x; t += x; n++;
    }
  }
  return { v: [P.cash || 0, P.image || 0, S.trust || 0, n ? t / n : 0], id: bufId.slice(0, n), m: bufM.slice(0, n), n: n };
}
function zone(S: any, wk: number): any {
  const y = Math.floor((wk - 1) / SEASON);
  let Z: any = S.cz;
  if (!Z) Z = S.cz = { y: y, sum: {}, dec: {}, cs: [0, 0], bad: 0, last: null };
  if (Z.y < y) { Z.last = { y: Z.y, sum: Z.sum, dec: Z.dec, cs: Z.cs }; Z.y = y; Z.sum = {}; Z.dec = {}; Z.cs = [0, 0]; }
  return Z;
}
function book(S: any, wk: number, cause: string, dec: boolean, d: number[]) {
  const Z = zone(S, wk), tgt = Z.y === Math.floor((wk - 1) / SEASON) ? Z : (Z.last || Z);
  for (let k = 0; k < 4; k++) {
    const v = d[k];
    if (!v || !isFinite(v)) continue;
    if (dec) tgt.dec[cause] = 1;
    const mt = CZ_METERS[k], t = tgt.sum[mt] || (tgt.sum[mt] = {}), c = t[cause] || (t[cause] = [0, 0]);
    c[0] += v; c[1] += Math.abs(v);
  }
}
/** Morale is a roster mean: split a change into mood (people on the roster at both ends) and roster mix (who joined or left). */
function split(a: Snap, b: Snap): number[] {
  let mood = 0, i = 0, j = 0;
  while (i < a.n && j < b.n) { const x = a.id[i], y = b.id[j]; if (x === y) { mood += b.m[j] - a.m[i]; i++; j++; } else if (x < y) i++; else j++; }
  mood = b.n ? mood / b.n : 0;
  return [mood, b.v[3] - a.v[3] - mood];
}
function live(S: any) { return S && S.promos && S.promos[S.player] && S.w && !S.cal; }

/** Open a frame. A top-level frame first books anything that changed since the last one closed as "untracked". */
export function czOpen(S: any, cause: string, dec?: boolean) {
  if (!live(S)) return;
  const st = stackOf(S), Z = S.cz;
  let now: Snap;
  if (!st.length && Z && S._czl && S._czl.w === S.w) {
    // top level: reuse the reading the last frame closed with. Cash, popularity and trust are checked at once (a
    // change outside every frame is booked as untracked); morale only changes inside engine calls (rule 1).
    const P = S.promos[S.player];
    let c = S._czl.s;
    const gap = [(P.cash || 0) - c.v[0], (P.image || 0) - c.v[1], (S.trust || 0) - c.v[2], 0];
    if (gap[0] || gap[1] || gap[2]) { book(S, S.week, 'untracked', false, gap); c = { v: [c.v[0] + gap[0], c.v[1] + gap[1], c.v[2] + gap[2], c.v[3]], id: c.id, m: c.m, n: c.n }; }
    now = c;
  } else now = czRead(S);
  st.push({ cause: cause, dec: !!dec, at: now, wk: S.week, kid: [0, 0, 0, 0] });
}
export function czClose(S: any) {
  if (!live(S)) return;
  const st = stackOf(S), f = st.pop();
  if (!f) { zone(S, S.week).bad++; return; }
  const now = czRead(S), d = [0, 0, 0, 0], own = [0, 0, 0, 0];
  for (let k = 0; k < 4; k++) { d[k] = now.v[k] - f.at.v[k]; own[k] = d[k] - f.kid[k]; }
  // the roster-mix part of this frame's own morale change goes to its own cause
  const sp = split(f.at, now), kidMix = f.kidMix || 0, mix = sp[1] - kidMix;
  own[3] -= mix;
  book(S, f.wk, f.cause, f.dec, own);
  // roster mix belongs to the top-level action it happened under: a release by the player is the player's decision
  const root = st.length ? st[0] : f;
  if (mix) book(S, f.wk, 'roster mix:' + root.cause, root.dec, [0, 0, 0, mix]);
  const up = st[st.length - 1];
  if (up) { for (let k = 0; k < 4; k++) up.kid[k] += d[k]; up.kidMix = (up.kidMix || 0) + sp[1]; }
  else { zone(S, S.week).r = now.v; if (!S._czl) Object.defineProperty(S, '_czl', { value: null, enumerable: false, writable: true }); S._czl = { s: now, w: S.w }; }
}
/** A phase inside a long function: closes the phase before it (if any) and opens the next. */
export function czMark(S: any, cause: string) {
  if (!live(S)) return;
  const st = stackOf(S), top = st[st.length - 1];
  if (top && top.phase) czClose(S);
  czOpen(S, cause);
  st[st.length - 1].phase = true;
}
export function czEndPhases(S: any) { if (!live(S)) return; const st = stackOf(S), top = st[st.length - 1]; if (top && top.phase) czClose(S); }

/** top: an E function opens a frame only when called from outside the engine (nothing open), so the engine's own
    calls to E.* belong to whatever called them and can never be booked as a player decision. Hooks always open one. */
function wrapFn(fn: any, cause: string, dec: boolean, top?: boolean) {
  const w: any = function (this: any) {
    const S = arguments[0];
    if (!live(S)) return fn.apply(this, arguments);
    const st = stackOf(S), depth = st.length;
    if (top && depth) return fn.apply(this, arguments);
    czOpen(S, cause, dec);
    try { return fn.apply(this, arguments); }
    finally { while (st.length > depth + 1) { st[st.length - 1].phase ? czClose(S) : (zone(S, S.week).bad++, czClose(S)); } czClose(S); }
  };
  Object.keys(fn).forEach(function (k) { w[k] = fn[k]; });
  return w;
}
// every player-facing E function is a frame: a choice unless it only runs the game
Object.keys(E).forEach(function (k) {
  if (typeof E[k] !== 'function' || k === 'causeInfo' || k === 'newGame' || k === 'load') return;
  E[k] = wrapFn(E[k], NOT_DEC[k] || 'd:' + k, !NOT_DEC[k], true);
});
/** A readable name for an anonymous hook: its own name, else the first engine function it calls with S. */
const SKIP: any = { rosterOf: 1, activeFeuds: 1, clamp: 1, function: 1, return: 1 };
export function hookName(fn: any, i: number): string {
  if (fn.name) return fn.name;
  const re = /(?:\$L\.|\b)([A-Za-z_]\w{3,})\s*\(\s*S\b/g, src = String(fn);
  let m: any;
  while ((m = re.exec(src))) if (!SKIP[m[1]]) return m[1];
  const any = /(?:\$L\.|\b)([A-Za-z_]\w{3,})\s*\(/g, LIB: any = { function: 1, forEach: 1, filter: 1, some: 1, every: 1, push: 1, slice: 1, sort: 1, indexOf: 1, keys: 1, floor: 1, round: 1, apply: 1, return: 1, concat: 1, splice: 1, reduce: 1 };
  while ((m = any.exec(src))) if (!LIB[m[1]] && !SKIP[m[1]]) return m[1];
  return 'hook' + i;
}
WEEKX.forEach(function (fn: any, i: number) { WEEKX[i] = wrapFn(fn, 'week:' + hookName(fn, i), false); });
SHOWX.forEach(function (fn: any, i: number) { SHOWX[i] = wrapFn(fn, 'show:' + hookName(fn, i), false); });
// the crowd score is a result per show, not a running meter: kept as a season sum and count for the player's shows
SHOWX.push(function czCrowd(S: any, P: any, show: any, rep: any) { if (live(S) && P && P.id === S.player && rep && isFinite(rep.cs)) { const Z = zone(S, S.week); Z.cs[0] += rep.cs; Z.cs[1]++; } });

/** The season's table: per meter, each cause's signed and absolute change; which causes are decisions; the crowd score sum and count; frames that did not close. */
E.causeInfo = function (S: any, last?: boolean) {
  const Z = S.cz, none = { sum: {}, dec: {}, cs: [0, 0], bad: 0 };
  if (!Z) return none;
  return last ? (Z.last || none) : { sum: Z.sum, dec: Z.dec, cs: Z.cs, bad: Z.bad };
};
$L.czOpen = czOpen; $L.czClose = czClose; $L.czMark = czMark; $L.czEndPhases = czEndPhases;
