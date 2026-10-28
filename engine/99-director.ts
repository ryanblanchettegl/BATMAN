/* The Director, step 1: the tension reading (docs/plans/director.md; Ryan's go-ahead 28 October 2026).
   At the start of every week it reads how tense the player's company already is, from 0 to 100, and keeps the last
   eight weeks. In this step it only reads: nothing it keeps is used by play yet (test-golden.js leaves S.dir out).
   It never calls rnd(S). */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, rosterOf, wagesWeek } from './00-core';

// how much each part can add to the reading; together they reach 100
const DIR_PARTS = { open: 25, clocks: 20, room: 20, money: 15, stories: 10, wait: 10 };

export function dirInit(S: any) {
  if (!S.dir) S.dir = { st: S.dst || 'promoter', t: [], seen: 0, fire: S.week, log: [] };   // S.dst: the style picked when the game began
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

/* ---------- step 2: the gate for the desk ----------
   Every matter that needs an answer passes through dirGate() inside pushEv(). Forced ones (a date, a deal, an order
   from the owner) always go through. The rest: the matters the week opens with are gathered and the Director picks one
   headline and two threads (Ryan, 28 October); later arrivals take what is left of the week; the rest are held, listed
   in The week in full, and can be pulled forward for one action point. A held problem costs the person in it a little
   mood each week it waits. A matter left by a show goes through as the show's hook, unless the show was graded A or
   better: then it is held, and the great night ends clean. */

// the tag of each kind of matter: problem, chance, colour, or forced (never held)
export const DIR_TAG: any = {
  // forced: dated, a deal, an order, the calendar, or required in the first year
  expire: 'forced', finalyear: 'forced', rights: 'forced', handover: 'forced', network: 'forced', sponsor: 'forced', awards: 'forced', hof: 'forced',
  arcch: 'forced', xfdeal: 'forced', invasion: 'forced', directive: 'forced', o_strong: 'forced', o_belt: 'forced', o_elevate: 'forced', nightmove: 'forced', netback: 'forced', netexec: 'forced', netmeet: 'forced',
  // problems
  holdout: 'problem', losing: 'problem', shot: 'problem', furious: 'problem', mutiny: 'problem', clique: 'problem', leak: 'problem', riot: 'problem',
  carfight: 'problem', scrum: 'problem', banged: 'problem', ko: 'problem', rebel: 'problem', walkup: 'problem', travel: 'problem', mainflop: 'problem',
  champout: 'problem', rematch: 'problem', clause: 'problem', goalblocked: 'problem', agreetrouble: 'problem',
  counter: 'problem', flop: 'problem', protect: 'problem', prove: 'problem', power: 'problem', shoot: 'problem', lights: 'problem', cash: 'problem',
  offer: 'problem', chant: 'problem', friends: 'problem', truck: 'problem', win: 'problem',
  // chances
  break: 'chance', buzz: 'chance', caughtfire: 'chance', upset: 'chance', pitch: 'chance', team: 'chance', mentor: 'chance', investor: 'chance',
  exclusive: 'chance', guest: 'chance', callup: 'chance', awardraise: 'chance', wroom: 'chance', rivalry: 'chance', ccask: 'chance',
  // colour
  dream: 'colour', life: 'colour', mom: 'colour', secondcareer: 'colour', lastwin: 'colour', passed: 'colour'
};
export function dirTag(ev: any) { return DIR_TAG[ev.type] || 'problem'; }

const DIR_BUDGET = 3;            // one headline and two threads a week (The Promoter; the styles below change it)

/* ---------- step 4: the styles (Ryan, 28 October: all three at once; a taste, not difficulty) ----------
   Each is a small table: the week's budget, calls on the air (weekly, big night), and a lean towards good news.
   The Carny swings: a quiet week, an ordinary one or a pile-up, picked by a hash of the week. */
export const DIR_STYLES: any = {
  promoter: { n: 'The Promoter', d: 'Steady pressure. One headline most weeks, rarely more than two problems open at once.', budget: () => 3, tv: 2, big: 3, lean: 0 },
  carny: { n: 'The Carny', d: 'Wild swings. Quiet spells, then several things at once, with bigger chances and bigger trouble.', budget: (S: any) => { const h = $L.h01('dc' + S.seed + ':' + S.week); return h < 0.35 ? 1 : h < 0.7 ? 3 : 5; }, tv: 3, big: 4, lean: 0.1 },
  purist: { n: 'The Purist', d: 'Slow burns. Fewer matters, more about people than money; shocks are rare.', budget: () => 2, tv: 2, big: 2, lean: -0.05 }
};
export function dirStyle(S: any) { const st = dirInit(S).st; return DIR_STYLES[st] || DIR_STYLES.promoter; }
// step 5, the rhythm around big nights: the big event's month builds (its week and the one before carry one more),
// and the week after a big night is calm (one fewer), unless the night itself left a problem (its hook still comes)
export function dirRhythm(S: any, wk?: number) {
  const w = wk || S.week, wom = $L.cal(w).wom;
  return wom === 3 || wom === 4 ? 1 : wom === 1 && w > 1 ? -1 : 0;
}
export function dirBudget(S: any, wk?: number) { const w0 = S.week; if (wk) S.week = wk; const b = Math.max(1, dirStyle(S).budget(S) + dirRhythm(S, wk)); S.week = w0; return b; }
export function dirCalls(S: any, big: boolean) { const y = dirStyle(S); return big ? y.big : y.tv; }
const DIR_HOLD_WEEKS = 3;        // a held matter whose time has passed is let go
const DIR_A = 85;                // a show at A or better may end clean (GRADES in 98-words.ts)

// how much a matter matters: the people in it and its kind; ties broken by a hash, never rnd(S)
function dirWeight(S: any, ev: any) {
  const w = ev.w != null ? S.w[ev.w] : null, o = ev.o != null ? S.w[ev.o] : null;
  const tag = dirTag(ev);
  return (w ? w.ovr : 50) + (o ? o.ovr * 0.3 : 0) + (tag === 'colour' ? -40 : 0) + $L.h01('dw' + S.seed + ':' + ev.id) * 3;
}

// matters about a moment that has passed: if they cannot come now, they never come
const DIR_NOW: any = { scrum: 1 };
// is the cause still true? a matter about somebody who has left, or one held too long, is let go
function dirAlive(S: any, ev: any) {
  if (DIR_NOW[ev.type]) return false;
  if (S.week - (ev.held || S.week) > DIR_HOLD_WEEKS) return false;
  for (const k of ['w', 'o']) { const x = ev[k] != null ? S.w[ev[k]] : null; if (ev[k] != null && (!x || x.promo !== S.player)) return false; }
  return true;
}

function dirAdmit(S: any, ev: any, count: boolean) {
  const d = dirInit(S); delete ev.held; ev.dir = 1;
  S.inbox.push(ev); if (count) d.n++;
  d.log.unshift({ wk: S.week, id: ev.id, t: ev.type, a: 'in' }); if (d.log.length > 16) d.log.length = 16;
}
function dirHold(S: any, ev: any) {
  const d = dirInit(S); if (ev.held == null) ev.held = S.week;
  d.held.push(ev);
  d.log.unshift({ wk: S.week, id: ev.id, t: ev.type, a: 'held' }); if (d.log.length > 16) d.log.length = 16;
}

/* Called by pushEv() once the matter has its id. True when the Director keeps it off the desk for now. */
export function dirGate(S: any, ev: any) {
  if (ev.done || ev.dir) return false;                       // news with no answer, or already let through
  const d = dirInit(S); if (!d.held) d.held = [];
  if (dirTag(ev) === 'forced') return false;
  if (ev.night != null) {                                     // the show's hook: the week's first always comes, the rest count
    if (ev.cs != null && ev.cs >= DIR_A) { dirHold(S, ev); return true; }
    if (d.n >= dirBudget(S)) { dirHold(S, ev); return true; }
    ev.dir = 1; d.hook = 1; d.n++; return false;
  }
  if (d.batch) { d.batch.push(ev); return true; }             // the week's opening matters are picked together
  // after the week's last show a matter waits for next week's desk, so it is counted there
  if (S.qi >= S.queue.length) { if ((d.late || 0) < dirBudget(S, S.week + 1) - 1) { ev.dir = 1; d.late = (d.late || 0) + 1; return false; } dirHold(S, ev); return true; }
  if (d.n < dirBudget(S) - (d.hook ? 0 : 1)) { ev.dir = 1; d.n++; return false; }   // a slot stays free for the show's hook
  dirHold(S, ev); return true;
}

/* Before the week's matters are made: the budget is fresh and the gathering starts. */
export function dirOpen(S: any) {
  const d = dirInit(S); if (!d.held) d.held = [];
  d.n = d.late || 0; d.late = 0; d.hook = 0; d.batch = [];
}

/* After genEvents(): pick the headline and the threads from the week's matters and the held ones still alive. */
export function dirClose(S: any) {
  const d = dirInit(S), offers = (d.batch || []).slice(); delete d.batch;
  const back = d.held.filter((e: any) => dirAlive(S, e));
  // a problem held until it lapsed was never answered: the person in it remembers that (Ryan: waiting costs)
  d.held.filter((e: any) => back.indexOf(e) < 0 && dirTag(e) === 'problem').forEach((e: any) => {
    const w = e.w != null ? S.w[e.w] : null;
    if (w && w.promo === S.player) { w.morale = clamp(w.morale - 6, 0, 100); $L.youRemember(S, w, 'ignored', 'They came to you and you never got to it.', -5); }
  });
  // a chance that lapsed was somebody's moment missed: they are a little less happy (Ryan, 28 October)
  d.held.filter((e: any) => back.indexOf(e) < 0 && dirTag(e) === 'chance').forEach((e: any) => {
    const w = e.w != null ? S.w[e.w] : null;
    if (w && w.promo === S.player) w.morale = clamp(w.morale - 4, 0, 100);
  });
  // and the owner notices what was let slide: a lapsed problem costs trust, a missed chance a little (Ryan, 28 October)
  const lapsed = d.held.filter((e: any) => back.indexOf(e) < 0 && dirTag(e) !== 'colour');
  if (lapsed.length && !S.owner.me) {
    const cost = lapsed.reduce((a: number, e: any) => a + (dirTag(e) === 'problem' ? 2 : 0.75), 0);
    S.owner.trust = clamp(S.owner.trust - cost, 0, 100);
    $L.note(S, 'The owner', lapsed.length === 1 ? 'Something on your desk was let slide, and the owner noticed.' : lapsed.length + ' things were let slide, and the owner noticed.', 'bad');
  }
  d.held = [];
  // waiting costs: somebody in a held problem loses a little mood each week it waits
  back.forEach((e: any) => { if (dirTag(e) === 'problem' && e.w != null && S.w[e.w]) S.w[e.w].morale = clamp(S.w[e.w].morale - 2, 0, 100); });
  const all = back.concat(offers);
  if (!all.length) return;
  const t = d.t.length ? d.t[d.t.length - 1] : 40;
  // the headline: a chance about one week in three on average, more often when tense (a lifeline), less when calm
  const wantChance = $L.h01('dh' + S.seed + ':' + S.week) < 0.05 + 0.6 * t / 100 + dirStyle(S).lean;   // about one in three on average: 0.17 when calm (20), 0.47 when tense (70)
  const byW = (a: any, b: any) => dirWeight(S, b) - dirWeight(S, a) || a.id - b.id;
  const pool = all.slice().sort(byW);
  const pref = pool.filter((e: any) => dirTag(e) === (wantChance ? 'chance' : 'problem'));
  const head = pref[0] || pool.find((e: any) => dirTag(e) !== 'colour') || pool[0];
  const rest = pool.filter((e: any) => e !== head);
  dirAdmit(S, head, true); head.head = 1;
  // the opening pick leaves the last slot for what the week's shows leave behind (the hook)
  const open = Math.max(1, dirBudget(S) - 1);
  // a calm company meets trouble (Ryan, 28 October): when tension is low the threads take problems first
  const calm = t < 55;
  if (calm) rest.sort((a: any, b: any) => (dirTag(b) === 'problem' ? 1 : 0) - (dirTag(a) === 'problem' ? 1 : 0) || byW(a, b));
  rest.forEach((e: any) => { if (d.n < open && dirTag(e) !== 'colour') dirAdmit(S, e, true); else dirHold(S, e); });
  // if a slot is still free, a bit of colour may take it
  d.held.slice().forEach((e: any) => { if (d.n < open && dirTag(e) === 'colour') { d.held.splice(d.held.indexOf(e), 1); dirAdmit(S, e, true); } });
}

/* What the screens show: the word on the desk, and what was held. */
const DIR_WORDS: any = { peak: 'A storm is breaking', building: 'A storm is building', steady: 'A steady week', easing: 'Things are calming down', settling: 'Finding your feet' };
E.dirDesk = function (S: any) {
  const d = dirInit(S), tr = dirTrend(S), t = d.t.length ? d.t[d.t.length - 1] : 0;
  const word = d.n === 0 && !(d.held || []).length ? 'A quiet week' : DIR_WORDS[tr] || 'A steady week';
  return { word, st: d.st, style: (DIR_STYLES[d.st] || DIR_STYLES.promoter).n, t: tr, held: (d.held || []).map((e: any) => ({ id: e.id, type: e.type, tag: dirTag(e), text: e.text, since: e.held })), cost: 1, ap: S.ap, calm: t < 35 };
};

/* Pull one held matter forward to the desk now, for one action point. */
E.dirPull = function (S: any, id: number) {
  const d = dirInit(S), i = (d.held || []).findIndex((e: any) => e.id === id);
  if (i < 0) return { ok: false, msg: 'That matter is no longer waiting.' };
  if ((S.ap || 0) < 1) return { ok: false, msg: 'You need an action point to bring it to your desk.' };
  const ev = d.held.splice(i, 1)[0]; S.ap -= 1; dirAdmit(S, ev, false);
  return { ok: true, msg: 'It is on your desk now.', id: ev.id };
};

E.dirTag = dirTag;
/* Change the style between shows: free in the first week, then a small cost to the owner's trust; never in iron man. */
E.DIR_STYLES = DIR_STYLES;
E.dirSetStyle = function (S: any, st: string) {
  const d = dirInit(S); if (!DIR_STYLES[st]) return { ok: false, msg: 'There is no such style.' };
  if (st === d.st) return { ok: true, msg: 'That is already how the week runs.' };
  if (S.iron && S.week > 1) return { ok: false, msg: 'In iron man the style is set for the whole game.' };
  if (S.live) return { ok: false, msg: 'Not while a show is on the air.' };
  const cost = S.week > 1 && !S.owner.me ? 4 : 0;
  if (cost) S.owner.trust = clamp(S.owner.trust - cost, 0, 100);
  d.st = st; return { ok: true, msg: DIR_STYLES[st].n + ' it is.' + (cost ? ' The owner wonders why the office keeps changing its mind.' : ''), cost };
};
E.dirBudget = dirBudget;
$L.dirCalls = dirCalls;
$L.dirGate = dirGate; $L.dirOpen = dirOpen; $L.dirClose = dirClose;
