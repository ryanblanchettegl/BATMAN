/* Things more than one section needs: starting and ending a game, ending the week, opening a show report. */
import { E } from './engine';
import { G, ui, pref, save, loadSave, clearSave, resetUi, redraw, setUniverse, slice, openModal } from './store';
import { go } from './nav';

/** View state of the Booking section. Office reads it to link to a report. */
export interface BookState { edit: number; tried: boolean; report: number | null; live: { s: number; b: number } | null; side: string }
export function book(): BookState { return slice<BookState>('booking', () => ({ edit: -1, tried: false, report: null, live: null, side: 'advice' })); }
/** Index into S.reports of this week's report for a show, or -1. */
export function repFor(sh: any): number { const S = G.S; for (let i = 0; i < S.reports.length; i++) if (S.reports[i].week === S.week && S.reports[i].id === sh.id) return i; return -1; }
export function openReport(i: number) { go('booking'); const b = book(); b.report = i; b.live = null; redraw(); }

const seed = () => (Date.now() % 2000000000) | 0;
export function startGame(pid: string | null, opts: { name: string; diff: string; fed: any | null }) {
  setUniverse(pref.uni || 'public_domain');
  G.S = E.newGame(pid, seed(), opts);
  resetUi(); save(); redraw(); window.scrollTo(0, 0);
}
/** Fired bookers take a job elsewhere and keep their level and skills. */
export function takeJob(pid: string) { const S = G.S, bk = S.booker; G.S = E.newGame(pid, seed(), { name: bk.name, booker: bk, diff: S.diff }); resetUi(); save(); redraw(); window.scrollTo(0, 0); }
export function continueGame() { const sv = loadSave(); if (sv) { G.S = sv; resetUi(); E.attach(G.S); } redraw(); }
export function abandonGame() { clearSave(); G.S = null; resetUi({ scr: 'select' }); setUniverse(pref.uni || 'public_domain'); redraw(); }

/** Close the week, go back to the desk and show the week-closed window. */
export function endWeek() {
  const S = G.S; if (S.inbox.some((e: any) => !e.done) || S.qi < S.queue.length) return;
  ui.flash = null;
  E.endWeek(S);
  const b = book(); b.report = null; b.live = null; b.edit = -1;
  save(); go('desk');
  if (S.fin && !S.over) openModal({ kind: 'weekclosed' });
}
