/* Bot bookers for the AI playtest lab (docs/MASTER.md §7 rows L2 and L3). A bot books and answers one week on the real
   engine; the cause log (engine/99-zzcause.ts) says where each change came from. Bots never touch S directly: every
   move is an E.* call, as a player's would be.
   suggest:    presses Suggest a card and gives the second answer to every matter (as test-balance.js).
   thoughtful: the full suggestion (E.suggestSmart), the stand-in for a booker who thinks (as test-balance.js).
   greedy:     the full suggestion, and every answer and action picked by trying each on a copy of the game and keeping
               the one that pays most at once (popularity, plus money at $100k a point): short-term and nothing else.
   story:      the full suggestion; starts the story the sifter rates best whenever booking power allows, and spends
               action points on people with a story first.
   chaos:      Suggest a card; every answer and action picked by a seeded coin, so runs repeat.
   spender:    the thoughtful bot that also spends every action point the default way (the first move offered): the
               baseline the exploit sweep compares against, so a repeat bot gains nothing just from spending points.
   repeat:k    (the exploit sweep) as spender, but every action point goes to the one kind of action k.
   answer:n    (the exploit sweep) as spender, but every matter gets answer n (or the last one there is).
   pre:n       (the exploit sweep) as spender, but every pre-show choice gets answer n. */
const SKIP_EV = { handover: 1 };
function prng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clone = (E, S) => { const c = JSON.parse(JSON.stringify(S)); E.attach(c); return c; };
const worth = S => { const P = S.promos[S.player]; return (P.image || 0) + (P.cash || 0) / 1e5; };

/** Every action point move open right now: people backstage and the acts each offers. */
function moves(E, S) {
  const out = [];
  if (S.ap <= 0) return out;
  E.people(S).rooms.forEach(r => r.people.forEach(p => { if (p.used) return; p.acts.forEach(a => out.push({ k: a.id, story: p.k === 'story', id: p.id, act: a.id })); }));
  return out;
}
const doMove = (E, S, m) => E.peopleDo(S, m.id, m.act);
/** Try each choice on a copy and keep the best by worth. */
function bestOf(E, S, n, apply) { let best = 0, bv = -Infinity; for (let i = 0; i < n; i++) { const c = clone(E, S); try { apply(c, i); } catch (e) { continue; } const v = worth(c); if (v > bv) { bv = v; best = i; } } return best; }

function answer(E, S, bot, rnd, fixed) {
  S.inbox.filter(e => !e.done).forEach(e => {
    let ch = 1;
    if (SKIP_EV[e.type]) ch = 0;
    else if (fixed != null) { const n = (e.choices || e.opts || [0, 1]).length || 2; ch = Math.min(fixed, n - 1); }
    else if (bot === 'greedy') { const n = (e.choices || e.opts || [0, 1]).length || 2; ch = bestOf(E, S, n, (c, i) => E.resolveEvent(c, e.id, i)); }
    else if (bot === 'chaos') { const n = (e.choices || e.opts || [0, 1]).length || 2; ch = Math.floor(rnd() * n); }
    E.resolveEvent(S, e.id, ch);
  });
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
}
function spend(E, S, bot, rnd, k) {
  for (let guard = 0; guard < 12 && S.ap > 0; guard++) {
    let M = moves(E, S); if (!M.length) return;
    if (k) M = M.filter(m => m.k === k);
    else if (bot === 'story') M = M.filter(m => m.story).concat(M.filter(m => !m.story));
    if (!M.length) return;
    let m = M[0];
    if (bot === 'greedy') m = M[bestOf(E, S, Math.min(M.length, 8), (c, i) => doMove(E, c, M[i]))];
    else if (bot === 'chaos') m = M[Math.floor(rnd() * M.length)];
    const r = doMove(E, S, m); if (!r || r.ok === false) return;
  }
}
function storyStart(E, S) {
  if ((S.bp || 0) < 2) return;
  const p = (E.sift(S) || [])[0]; if (p) E.storyStart(S, p.a, p.b);
}
const BOTS = { suggest: 1, thoughtful: 1, greedy: 1, story: 1, chaos: 1 };   // spender and the sweep's variants run in exploit.js
/** Play one week. Returns the crowd scores of the player's shows and how many shows were skipped because the card did
    not validate (test-balance.js runs them anyway; the report counts them so the bots stay comparable). */
function playWeek(E, S, bot, ctx) {
  ctx = ctx || {}; const rnd = ctx.rnd || (ctx.rnd = prng(ctx.seed || 1));
  const [kind, arg] = bot.split(':'), sweep = kind === 'repeat' || kind === 'answer' || kind === 'pre' || kind === 'spender';
  const k = kind === 'repeat' ? arg : null, ans = kind === 'answer' ? +arg : null, pre = kind === 'pre' ? +arg : null, base = sweep ? 'thoughtful' : bot;
  const cs = []; let skipped = 0;
  answer(E, S, base, rnd, ans);
  if (sweep || base === 'greedy' || base === 'story' || base === 'chaos') spend(E, S, base, rnd, k);   // suggest and thoughtful stay as in L2's baseline
  if (base === 'story') storyStart(E, S);
  while (S.qi < S.queue.length && !S.over) {
    const c = (base === 'suggest' || base === 'chaos') ? E.suggest(S) : E.suggestSmart(S), pr = E.preShow(S, c);
    if (pr) { E.resolvePre(S, c, pre != null ? pre : base === 'chaos' ? Math.floor(rnd() * 2) : 0); E.fitShow(S, c); }
    if (E.validate(S, c).errors.length) { S.qi++; skipped++; continue; }
    const r = E.runPlayerShow(S, c); if (r && r.rep) cs.push(E.repCS(r.rep));
  }
  E.endWeek(S);
  return { cs, skipped };
}
module.exports = { BOTS, playWeek, moves, prng };
