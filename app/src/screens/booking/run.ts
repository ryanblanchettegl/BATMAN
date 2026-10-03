/* What the Booking page does: edits to the draft card, the run flow (validate, pre-show incident, the headset call,
   the show itself) and the position in the broadcast. Components call these; nothing here draws. */
import { E } from '../../engine';
import { G, ui, pref, reduceMotion, act, view, say, slice } from '../../store';
import { book } from '../../flow';
import { SFX } from '../../sfx';
import { showResult } from '../../kit';

export type Match = any;
const top0 = () => { try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } };
/** A click that only changes the view. As in the old interface, any click clears the last message. */
export function look(fn: () => void) { view(() => { ui.flash = null; fn(); }); }

/* ---------- the draft card. S.card is the one piece of game state the interface owns ---------- */
export function complete(m: Match): boolean { return m.sides.every((s: any[]) => s.every(id => id != null)); }
export function sideText(s: (number | null)[]): string { return s.map(id => id == null ? 'open spot' : G.S.w[id].name).join(' & '); }
/** Everyone booked on the card, optionally leaving one match out. */
export function onCard(skip?: number): Record<number, 1> {
  const o: Record<number, 1> = {};
  G.S.card.forEach((m: Match, k: number) => { if (k !== skip) m.sides.forEach((s: any[]) => s.forEach(id => { if (id != null) o[id] = 1; })); });
  return o;
}
export const suggest = () => act(() => { const b = book(); G.S.card = E.suggest(G.S); b.edit = -1; b.tried = false; });
/** The assistant books this show the way you usually would. */
export const asstBook = () => act(() => { const b = book(); E.assistantBook(G.S); b.edit = -1; b.tried = false; });
/** Fast mode: the assistant books and runs every small show left this week, then stops at the big event. */
export const asstRun = () => act(() => {
  const S = G.S, o: any[] = E.assistantRun(S);
  const ok = o.filter(x => !x.err), bad = o.filter(x => x.err);
  const text = o.length ? ok.map(x => x.show + ': ' + x.rating + '% (expected ' + x.exp + '%)').join('. ') + (bad.length ? '. Stopped at ' + bad[0].show + ': ' + bad[0].err : '') : 'There is no small show left to run.';
  say(text, { err: !ok.length && o.length > 0 });
  showResult('The assistant', text, !ok.length && o.length > 0);
});
export const addMatch = () => act(() => { const c = G.S.card; c.push({ mt: '1v1', sides: [[null], [null]], win: -2, call: null, title: null, stip: 'std', len: 'M' }); book().edit = c.length - 1; });
export const clearCard = () => act(() => { const b = book(); G.S.card = []; b.edit = -1; b.tried = false; });
export const removeMatch = (i: number) => act(() => { G.S.card.splice(i, 1); book().edit = -1; });
export const toggleEdit = (i: number) => look(() => { const b = book(); b.edit = b.edit === i ? -1 : i; });
export function moveMatch(i: number, by: -1 | 1) {
  act(() => {
    const c = G.S.card, j = i + by, b = book(); if (j < 0 || j >= c.length) return;
    const t = c[i]; c[i] = c[j]; c[j] = t;
    if (b.edit === i) b.edit = j; else if (b.edit === j) b.edit = i;
  });
}
/** A select in the match editor changed. `c` is the old data-ch name. */
export function setMatch(i: number, c: string, v: string, at?: { s: number; p?: number }) {
  act(() => {
    const S = G.S, m = S.card[i]; if (!m) return;
    if (c === 'mt') {
      const def = E.MT[v], ids = ([] as any[]).concat(...m.sides).filter(x => x != null); let k = 0;
      m.mt = v; m.sides = [];
      for (let s = 0; s < def.sides; s++) { const a: (number | null)[] = []; for (let p = 0; p < def.per; p++) a.push(k < ids.length ? ids[k++] : null); m.sides.push(a); }
      m.win = -2; m.call = null; m.title = null;
    }
    else if (c === 'slot' && at) m.sides[at.s][at.p || 0] = v === '' ? null : +v;
    else if (c === 'team' && at) { const tm = S.teams.find((x: any) => x.id === +v); if (tm) m.sides[at.s] = tm.m.slice(); }
    else if (c === 'call') m.call = v === '' ? null : +v;
    else if (c === 'title') m.title = v || null;
    else if (c === 'stip') m.stip = v;
    else if (c === 'len') m.len = v;
    else if (c === 'int') m.int = v;
    else if (c === 'agent') { if (v) m.agent = +v; else delete m.agent; }
    else if (c === 'boss') { if (v) m.boss = 1; else delete m.boss; }
    else if (c === 'how') { if (v) m.how = v; else delete m.how; }
  });
}
/** The opening promo: who speaks, about what, and how tightly scripted. */
export function setPlan(k: 'sp' | 'topic' | 'del' | 'kind', v: string) {
  act(() => {
    const S = G.S; let pl: any = Object.assign({ sp: null, topic: 'crowd', del: 'notes', kind: 'interview' }, S.plan);
    if (k === 'sp') { if (v === '') pl = null; else pl.sp = +v; } else pl[k] = v;
    E.setPlan(S, pl);
  });
}

/* ---------- running the show ---------- */
/* The engine does not stamp the pre-show result on the report (the old interface wrote it there itself), so it is
   read back from S.pre while that still belongs to the show, and remembered for the rest of the session. */
const notes = () => slice<Record<string, string>>('booking-pre', () => ({}));
export function preNote(r: any): string | null {
  const S = G.S, key = r.week + ':' + r.id;
  return r.pre || (S.pre && S.pre.key === key && S.pre.result) || notes()[key] || null;
}
/** Run the show, or answer what stands in its way. `a` is 'run' (the button), 'pre' (a pre-show choice) or 'chaos' (a headset call). */
export function run(a: 'run' | 'pre' | 'chaos', c?: number) {
  act(() => {
    const S = G.S, b = book(); let chNote: string | null = null;
    const cant = () => { b.tried = true; say('The show can’t run yet. See the list below.', { err: true }); };
    if (a === 'pre') { E.resolvePre(S, S.card, c); b.edit = -1; }
    if (a === 'chaos') { chNote = E.resolveChaos(S, S.card, c); ui.modal = null; }
    if (E.validate(S, S.card).errors.length) return cant();
    if (a === 'run' && E.preShow(S, S.card)) { b.edit = -1; top0(); return; }
    if (a !== 'chaos' && E.chaos(S, S.card)) { ui.modal = { kind: 'chaos' }; b.edit = -1; SFX.ach(); return; }
    const r = E.runPlayerShow(S, S.card);
    if (r.errors) return cant();
    if (S.pre && S.pre.result) notes()[S.pre.key] = S.pre.result;
    b.report = 0; b.live = { s: -1, b: 0 }; b.edit = -1; b.tried = false;
    if (chNote) say('Your call: ' + chNote);
    top0(); SFX.fanfare();
  });
}

/* ---------- the typewriter: the newest commentary line types itself out ---------- */
let timer: any = null, whenDone: (() => void) | null = null;
export const typer = {
  /** Off in Options, or the player has asked the system for less motion. */
  wanted(): boolean { return !!pref.type && !reduceMotion(); },
  active(): boolean { return timer != null; },
  /** Show the whole line now. */
  finish() { if (timer == null) return; clearInterval(timer); timer = null; const f = whenDone; whenDone = null; if (f) f(); },
  /** Type `len` characters, three at a time (the Broadcast speed option scales that). Returns the function that abandons this line (for an effect's cleanup). */
  start(len: number, show: (n: number) => void, done: () => void): () => void {
    typer.finish();
    let i = 0; whenDone = done;
    const mine = timer = setInterval(() => { i += 3 * (pref.speed || 1); if (i >= len) { typer.finish(); return; } show(Math.floor(i)); if (i % 9 === 0) SFX.tick(); }, 18);
    return () => { if (timer === mine) { clearInterval(mine); timer = null; whenDone = null; } };
  }
};

/* ---------- the broadcast ---------- */
/** The report being broadcast, or null when the broadcast is not showing. */
export function liveReport(): any | null {
  const S = G.S; if (!S || ui.page !== 'booking') return null;
  const b = book(), r = b.live && b.report != null ? S.reports[b.report] : null;
  return r && r.venue ? r : null;
}
/** Ring introductions come out together: a segment opens on its last entrance line. */
export function lead(seg: any): number { const bc = seg.bc || []; let i = 0; while (i < bc.length && (bc[i].t === 'ring' || bc[i].t === 'ent')) i++; return Math.max(0, i - 1); }
const COUNT = /One, two, three|hree count|tapping|taps!|gets the three|and that is it/;
export function liveNext() {
  if (typer.active()) { typer.finish(); return; }
  const r = liveReport(); if (!r) return;
  look(() => {
    const L = book().live!, sg = r.segs[L.s], bc = (sg && sg.bc) || [];
    if (sg && L.b < bc.length) {
      L.b++; const nb = bc[L.b];
      if (nb && COUNT.test(nb.x)) SFX.count();
      else if (!nb && sg.k === 'match') { SFX.bellEnd(); SFX.crowd(sg.cr); }
      else if (nb && nb.t === 'pbp' && sg.k === 'match' && L.b === lead(sg) + 2) SFX.bell();
    }
    else { L.s++; L.b = r.segs[L.s] ? lead(r.segs[L.s]) : 0; }
  });
}
/** Finish the line being typed and jump to this segment's result. */
export function liveSkip() { typer.finish(); const r = liveReport(); if (r) look(() => { const L = book().live!; if (r.segs[L.s]) L.b = (r.segs[L.s].bc || []).length; }); }
export function liveEnd() { const r = liveReport(); if (r) look(() => { book().live = { s: r.segs.length, b: 0 }; }); }
export const liveDone = () => look(() => { book().live = null; top0(); });
export const replay = () => look(() => { book().live = { s: -1, b: 0 }; top0(); });
export const closeReport = () => look(() => { const b = book(); b.report = null; b.live = null; top0(); });
export const pickSide = (id: string) => look(() => { book().side = id; });
