/* Bot bookers for the AI playtest lab (docs/MASTER.md §7 rows L2 and L3). A bot is a function that books and answers
   one week. They play headless on the real engine; the cause log (engine/99-zzcause.ts) says where each change came from.
   suggest:    presses Suggest a card for every show and gives the second answer to every matter (as test-balance.js).
   thoughtful: the full suggestion (E.suggestSmart), the stand-in for a booker who thinks (as test-balance.js). */
const BOTS = {
  suggest: { card: E => S => E.suggest(S) },
  thoughtful: { card: E => S => E.suggestSmart(S) },
};
/** Play one week with a bot. Returns the crowd scores of the player's shows and how many shows were skipped because
    the card did not validate (test-balance.js runs them anyway; the report counts them so the bots stay comparable). */
function playWeek(E, S, bot) {
  const cs = [], card = BOTS[bot].card(E);
  let skipped = 0;
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length && !S.over) {
    const c = card(S), pr = E.preShow(S, c);
    if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
    if (E.validate(S, c).errors.length) { S.qi++; skipped++; continue; }
    const r = E.runPlayerShow(S, c); if (r && r.rep) cs.push(E.repCS(r.rep));
  }
  E.endWeek(S);
  return { cs, skipped };
}
module.exports = { BOTS, playWeek };
