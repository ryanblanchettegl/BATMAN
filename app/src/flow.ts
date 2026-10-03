/* Things more than one section needs: starting and ending a game, ending the week, opening a show report. */
import { E } from './engine';
import { G, ui, pref, save, loadSave, clearSave, resetUi, redraw, setUniverse, slice, openModal, closeModal, say } from './store';
import { go } from './nav';

/** View state of the Booking section. Office reads it to link to a report. */
export interface BookState { edit: number; tried: boolean; report: number | null; live: { s: number; b: number } | null; side: string }
export function book(): BookState { return slice<BookState>('booking', () => ({ edit: -1, tried: false, report: null, live: null, side: 'advice' })); }
/** Index into S.reports of this week's report for a show, or -1. */
export function repFor(sh: any): number { const S = G.S; for (let i = 0; i < S.reports.length; i++) if (S.reports[i].week === S.week && S.reports[i].id === sh.id) return i; return -1; }
export function openReport(i: number) { go('booking'); const b = book(); b.report = i; b.live = null; redraw(); }

const seed = () => (Date.now() % 2000000000) | 0;
export function startGame(pid: string | null, opts: { name: string; diff: string; fed: any | null; dpart?: any; iron?: boolean }) {
  setUniverse(pref.uni || 'public_domain');
  G.S = E.newGame(pid, seed(), opts);
  resetUi(); save(); redraw(); window.scrollTo(0, 0);
}
/** The weekly challenge: the same world and seed for everyone this week, twelve weeks to run. */
export function isoWeekId(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return y + '-W' + (w < 10 ? '0' : '') + w;
}
export function startChallenge() {
  setUniverse('public_domain');
  const S = E.challengeStart(isoWeekId(new Date()));
  if (!S) return;
  G.S = S; closeModal(); resetUi(); save(); redraw(); window.scrollTo(0, 0);
}
/** Fired bookers take a job elsewhere and keep their level and skills. */
export function takeJob(pid: string, terms?: string[]) {
  const S = G.S, bk = S.booker; G.S = E.newGame(pid, seed(), { name: bk.name, booker: bk, diff: S.diff, iron: S.iron, dpart: S.dpart });
  const msg = terms && terms.length ? E.applyJobTerms(G.S, terms) : null;
  resetUi(); if (msg) say(msg, { err: /did not like/.test(msg) }); save(); redraw(); window.scrollTo(0, 0);
}
export function continueGame() { const sv = loadSave(); if (sv) { G.S = sv; resetUi(); E.attach(G.S); } redraw(); }
/** Load a save pasted as text. Returns a message if it cannot be used, else null. */
export function loadSaveText(text: string): string | null {
  let o: any; try { o = JSON.parse(text); } catch (e) { return 'That is not a save. It should be the long block of text from Copy my save.'; }
  if (!o || o.v !== 4 || !o.promos || !o.w || !o.player) return 'That text is not an EWF 9000 save, or it is from a version this game cannot read.';
  G.S = o; resetUi(); E.attach(G.S); save(); redraw(); return null;
}
export function abandonGame() { clearSave(); G.S = null; resetUi({ scr: 'select' }); setUniverse(pref.uni || 'public_domain'); redraw(); }

/** Close the week, go back to the desk and show the week-closed window. */
export function endWeek() {
  const S = G.S; if (S.inbox.some((e: any) => !e.done) || S.qi < S.queue.length) return;
  ui.flash = null;
  // before the week turns: what the booker did with action points, and everyone's overness, to find the movers
  const did = (E.backstage(S).log || []).map((l: any) => ({ place: l.place, act: l.act, ok: l.ok, msg: l.msg })), before: Record<number, number> = {};
  S.w.forEach((w: any) => { if (w.promo === S.player && !w.nw) before[w.id] = w.ovr; });
  E.endWeek(S);
  const moves = S.w.filter((w: any) => before[w.id] != null && w.promo === S.player).map((w: any) => ({ id: w.id, d: w.ovr - before[w.id] }));
  const up = moves.filter((m: any) => m.d >= 0.3).sort((a: any, b: any) => b.d - a.d)[0] || null, down = moves.filter((m: any) => m.d <= -0.3).sort((a: any, b: any) => a.d - b.d)[0] || null;
  const b = book(); b.report = null; b.live = null; b.edit = -1;
  save(); go('desk');
  if (S.fin && !S.over) {
    const wc = { kind: 'weekclosed', did, up, down };
    // the year-end report comes first and hands over to the week-closed window when it is closed
    if (S.annualNew) { S.annualNew = false; openModal({ kind: 'annual', next: wc }); } else openModal(wc);
  }
}
