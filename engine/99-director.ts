/* The Director, step 1: the tension reading (docs/plans/director.md; Ryan's go-ahead 28 October 2026).
   At the start of every week it reads how tense the player's company already is, from 0 to 100, and keeps the last
   eight weeks. In this step it only reads: nothing it keeps is used by play yet (test-golden.js leaves S.dir out).
   It never calls rnd(S). */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, rosterOf, wagesWeek } from './00-core';

// how much each part can add to the reading; together they reach 100
const DIR_PARTS = { open: 25, clocks: 20, room: 20, money: 15, stories: 10, wait: 10 };

export function dirInit(S: any) {
  if (!S.dir) S.dir = { st: 'promoter', t: [], seen: 0, fire: S.week, log: [] };
  return S.dir;
}

/* The reading, with each part, from what is true now. */
export function dirParts(S: any) {
  const P = S.promos[S.player], R = rosterOf(S, P.id).filter((w: any) => !w.nw);
  const open = S.inbox.filter((e: any) => !e.done);
  // open matters: each one adds, a dated one adds more
  const o = clamp(open.length * 4 + open.filter((e: any) => e.due != null || e.type === 'expire').length * 3, 0, DIR_PARTS.open);
  // the bad clocks: the fullest one counts most
  let worst = 0, sum = 0;
  Object.keys(S.clocks || {}).forEach(k => { const d = $L.CLOCKS[k], c = S.clocks[k]; if (!d || !d.bad || !c) return; const f = clamp(c.v / d.segs, 0, 1); worst = Math.max(worst, f); sum += f; });
  const ck = clamp(worst * 14 + sum * 3, 0, DIR_PARTS.clocks);
  // the room: low spirits, people near breaking, and real heat between them
  const avg = R.length ? R.reduce((a: number, w: any) => a + w.morale, 0) / R.length : 65;
  const low = R.filter((w: any) => w.morale < 35).length;
  let heat = 0; const ids: any = {}; R.forEach((w: any) => { ids[w.id] = 1; });
  Object.keys(S.rm || {}).forEach(k => { const e = S.rm[k], p = k.split('-'); if (e && e.bond <= -$L.REL_STRONG && ids[p[0]] && ids[p[1]]) heat++; });
  const rm = clamp((65 - avg) * 0.5 + low * 2 + heat * 2, 0, DIR_PARTS.room);
  // money: fewer than eight weeks of wages in the bank starts to tell
  const wk = wagesWeek(S, P) || 1, weeks = P.cash / wk;
  const mo = clamp((8 - weeks) * (DIR_PARTS.money / 8), 0, DIR_PARTS.money);
  // stories: a story on the boil keeps the company on edge
  const hot = S.feuds.filter((f: any) => !f.dead && (f.a || []).concat(f.b || []).some((id: any) => S.w[id] && S.w[id].promo === P.id)).reduce((a: number, f: any) => Math.max(a, f.heat || 0), 0);
  const st = clamp(hot / 10, 0, DIR_PARTS.stories);
  // waiting: the longer since a matter last came in, the more the quiet itself builds
  const d = dirInit(S), quiet = Math.max(0, S.week - d.fire);
  const wt = clamp(quiet * 4, 0, DIR_PARTS.wait);
  const t = Math.round(o + ck + rm + mo + st + wt);
  return { t: clamp(t, 0, 100), open: Math.round(o), clocks: Math.round(ck), room: Math.round(rm), money: Math.round(mo), stories: Math.round(st), wait: Math.round(wt), quiet };
}

/* Taken at the start of each week, before the week's matters are made (startWeek in 40-week.ts). */
export function dirRead(S: any) {
  const d = dirInit(S);
  // a matter that came in since the last reading counts as a fire
  const ids = S.inbox.map((e: any) => e.id), top = ids.length ? Math.max.apply(null, ids) : 0;
  if (top > d.seen) { if (d.seen) d.fire = S.week; d.seen = top; }
  const r = dirParts(S);
  d.t.push(r.t); if (d.t.length > 8) d.t.shift();
  return r;
}

/* Whether the company is building, at a peak or coming down, from the last eight readings. */
export function dirTrend(S: any) {
  const t = dirInit(S).t; if (t.length < 3) return 'settling';
  const now = t[t.length - 1], before = t.slice(0, -1).reduce((a: number, v: number) => a + v, 0) / (t.length - 1);
  return now >= 60 ? 'peak' : now > before + 6 ? 'building' : now < before - 6 ? 'easing' : 'steady';
}

E.dirInfo = function (S: any) { const r = dirParts(S); return { t: r.t, parts: r, trend: dirTrend(S), hist: dirInit(S).t.slice() }; };

$L.dirRead = dirRead;
