/* What the Booking page does: edits to the draft card, the run flow (validate, pre-show incident, the headset call,
   the show itself) and the position in the broadcast. Components call these; nothing here draws. */
import { E } from '../../engine';
import { G, ui, pref, reduceMotion, act, view, say, slice, savePrefs } from '../../store';
import { book } from '../../flow';
import { go } from '../../nav';
import { SFX } from '../../sfx';

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
/** A suggested card is a whole show: matches, promos and angles, fitted to the show's time. */
export const suggest = () => act(() => { const b = book(); G.S.card = E.suggestKeep(G.S); b.edit = -1; sel().seg = -1; b.tried = false; });
export const addMatch = () => act(() => { const c = G.S.card; c.push({ mt: '1v1', sides: [[null], [null]], win: -2, call: null, title: null, stip: 'std', len: 'M' }); book().edit = c.length - 1; sel().seg = -1; });
export const clearCard = () => act(() => { const b = book(); G.S.card = []; E.segClear(G.S); b.edit = -1; sel().seg = -1; b.tried = false; });
export const removeMatch = (i: number) => act(() => { G.S.card.splice(i, 1); book().edit = -1; });
/** What is selected on the run sheet besides a match: a promo or an angle, by its place in the list (-1 for none). */
export const sel = () => slice<{ seg: number }>('booksel', () => ({ seg: -1 }));
/** Select a match on the run sheet (its details show beside the sheet), or let go of it. */
export const pickMatch = (i: number) => look(() => { const b = book(); b.edit = b.edit === i ? -1 : i; sel().seg = -1; });
export const toggleEdit = pickMatch;
/** Select a promo or an angle on the run sheet, or let go of it. */
export const pickSeg = (slot: number) => look(() => { const s = sel(); s.seg = s.seg === slot ? -1 : slot; book().edit = -1; });
export function moveMatch(i: number, by: number) { moveMatchTo(i, i + by); }
/** Move a match to another place on the card (the arrows, a drag, or the pop-up). Locked matches keep their places. */
export function moveMatchTo(i: number, j: number) {
  act(() => {
    const S = G.S, b = book(), was = S.card.map((m: any) => m), r = E.moveMatchTo(S, i, j);
    if (!r.ok) { if (r.msg) say(r.msg, { err: true }); return; }
    if (b.edit >= 0) b.edit = S.card.indexOf(was[b.edit]);
  });
}
export function lockMatch(i: number) { act(() => { const m = G.S.card[i]; if (m) E.lockMatch(G.S, i, !m.lock); }); }
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
    else if (c === 'size') E.brSize(S, i, +v);
    else if (c === 'shot') E.brShot(S, i, !!v);
    else if (c === 'surp') E.brSurprise(S, i, !!v);
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
/** Put the show on the air, or answer what stands in its way before the bell. `a` is 'run' (the ADVANCE key) or
    'pre' (the answer to a problem before the show). Once it is on the air the card is closed: the night runs one
    segment at a time (liveNext) and stops for every call from the gorilla position (liveDecide). */
export function run(a: 'run' | 'pre', c?: number) {
  act(() => {
    const S = G.S, b = book();
    const cant = () => { b.tried = true; b.edit = -1; sel().seg = -1; b.side = 'advice'; say('The show can’t run yet. The list is beside the run sheet.', { err: true }); };
    // this week's tasks on the desk come first
    if (a === 'run') { const g = E.taskGate(S, 'show'); if (!g.ok) { say('The show cannot run yet. ' + g.left.length + ' ' + (g.left.length === 1 ? 'task is' : 'tasks are') + ' still on your desk.', { err: true }); top0(); return; } }
    if (a === 'pre') { E.resolvePre(S, S.card, c); b.edit = -1; }
    if (E.validate(S, S.card).errors.length) return cant();
    if (a === 'run' && E.preShow(S, S.card)) { b.edit = -1; top0(); return; }
    if (S.pre && S.pre.result) notes()[S.pre.key] = S.pre.result;
    const r = E.liveBegin(S, S.card);
    if (r.errors) return cant();
    b.report = null; b.live = { s: -1, b: 0 }; b.edit = -1; sel().seg = -1; b.tried = false;
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
/** The show on screen: the one on the air (its report is still being written), or a finished one being replayed. Null when neither. */
export function liveReport(): any | null {
  const S = G.S; if (!S || ui.page !== 'booking') return null;
  if (S.live) return S.live.st.rep;
  const b = book(), r = b.live && b.report != null ? S.reports[b.report] : null;
  return r && r.venue ? r : null;
}
/** Is a show on the air right now? */
export const onAir = (): boolean => !!(G.S && G.S.live);
/** The call from the gorilla position that is waiting for an answer, or null. */
export function liveCall(): any | null { const L = G.S && G.S.live; return L && L.ev && !L.ev.done ? L.ev : null; }
/** Ring introductions come out together: a segment opens on its last entrance line. */
export function lead(seg: any): number { const bc = seg.bc || []; let i = 0; while (i < bc.length && (bc[i].t === 'ring' || bc[i].t === 'ent')) i++; return Math.max(0, i - 1); }
/** Where a segment starts on screen: at the call that shaped it if there was one (the introductions were watched while the call came in), else after the introductions. */
function startBeat(seg: any): number { const bc = seg.bc || [], k = bc.findIndex((x: any) => x.t === 'call'); return k >= 0 ? k : opening(seg); }
/** Where a segment opens on screen: a match at its first entrance, so every side walks out (Ryan, 20 October: a tag
    team comes out together, a champion with the gold); a battle royal, whose ring fills at once, at its last line. */
export function opening(seg: any): number { const bc = seg.bc || [], ents = bc.filter((x: any) => x.t === 'ent').length;
  if (seg.k !== 'match' || ents < 2 || ents > 4) return lead(seg); const k = bc.findIndex((x: any) => x.t === 'ent'); return k >= 0 ? k : lead(seg); }
/** When the call on screen came up. An answer in its first moments is not taken: a press meant for Continue must not answer a call nobody has read. */
let callAt = 0;
/** Ask the engine for the next thing on the show and put the screen on it. Must be called inside act(). */
function stepLive() {
  const S = G.S, b = book(), L = b.live || (b.live = { s: -1, b: 0 });
  for (let g = 0; g < 40; g++) {
    const x = E.liveNext(S);
    if (x.event) { callAt = Date.now(); SFX.ach(); return; }
    if (x.skip) continue;
    if (x.seg) { L.s = x.i; L.b = startBeat(x.seg); return; }
    if (x.done) { b.report = 0; L.s = S.reports[0] ? S.reports[0].segs.length : 0; L.b = 0; L.aired = true; SFX.fanfare(); return; }   // the sign-off of the show that just aired, not a replay
  }
}
const COUNT = /One, two, three|hree count|tapping|taps!|gets the three|and that is it/;
export function liveNext() {
  if (typer.active()) { typer.finish(); return; }
  const r = liveReport(); if (!r) return;
  if (liveCall()) return;   // the headset is waiting: only an answer moves the show on
  const L = book().live!, sg = r.segs[L.s], bc = (sg && sg.bc) || [];
  if (sg && L.b < bc.length) {
    look(() => {
      L.b = pref.pace === 'tv' ? tvNext(sg, L.b) : L.b + 1; const nb = bc[L.b];
      if (nb && COUNT.test(nb.x)) SFX.count();
      else if (nb && nb.h) SFX.crowd(nb.h > 1 ? 100 : 80);
      else if (!nb && sg.k === 'match') { SFX.bellEnd(); SFX.crowd(sg.cr); }
      else if (nb && nb.t === 'pbp' && sg.k === 'match' && L.b === lead(sg) + 2) SFX.bell();
    });
    return;
  }
  if (onAir()) { act(stepLive); return; }   // the next thing has not happened yet
  look(() => { L.s++; L.b = r.segs[L.s] ? opening(r.segs[L.s]) : 0; });
}
/** Answer the call that is waiting. A call made in a match carries on into it. A call made after the bell shows what came of it first. */
export function liveDecide(c: number) {
  if (Date.now() - callAt < 400) return;
  typer.finish();
  act(() => {
    const S = G.S, ev = liveCall(); if (!ev || c < 0 || c >= ev.choices.length) return;
    const d = E.liveDecide(S, c);
    if (!d.ok) { say(d.msg, { err: true }); return; }
    ui.flash = null;
    if (ev.phase === 'post') { const L = book().live!, sg = S.live.st.rep.segs[ev.si]; if (sg) { L.s = ev.si; L.b = Math.max(0, (sg.bc || []).length - 1); return; } }
    stepLive();
  });
}
/** Where the broadcast is on screen. A game loaded with a show on the air picks up where the show had got to. */
export function livePos(r: any): { s: number; b: number; aired?: boolean } { const b = book(); return b.live || (b.live = { s: r.segs.length - 1, b: 9999 }); }
/** What the SPACE key does while a broadcast is showing, in one or two words. Null when none is. The button
    is the only way forward: there is no second continue button on the broadcast itself. */
export function liveStep(): { short: string; label: string; k: 'call' | 'title' | 'seg' | 'next' | 'off' | 'signoff' } | null {
  const r = liveReport(); if (!r) return null;
  if (liveCall()) return { short: 'Your call', label: 'The gorilla position is waiting for your answer', k: 'call' };
  const S = G.S, air = onAir(), L = livePos(r), s = L.s >= 0 && L.s < r.segs.length ? r.segs[L.s] : null;
  if (L.s < 0) return { short: 'Ring bell', label: 'Ring the bell and start the show', k: 'title' };
  if (!s) return { short: 'Report', label: 'See the full report', k: 'signoff' };
  if (L.b < (s.bc || []).length) return { short: 'Continue', label: 'On with the show', k: 'seg' };
  if (air) return S.live.st.k < S.live.st.steps.length ? { short: 'Next', label: 'What is next on the show', k: 'next' } : { short: 'Sign off', label: 'Go off the air', k: 'off' };
  const nx = r.segs[L.s + 1];
  return nx ? { short: nx.k === 'match' ? 'Next match' : 'Next', label: 'On with the replay', k: 'next' } : { short: 'Sign off', label: 'Close the show', k: 'off' };
}
/** The SPACE key and Enter during a broadcast: the next line, the next thing on the show, or the report at
    the sign-off. A call from the gorilla position waits for its own answer. */
export function liveGo() {
  const st = liveStep(); if (!st) return;
  if (st.k === 'signoff') { typer.finish(); liveDone(); return; }   // the good-night line does not hold up the report
  if (st.k === 'title') typer.finish();   // nor does the welcome hold up the bell: one press rings it
  if (typer.active()) { typer.finish(); return; }
  if (st.k === 'call') { act(() => say('The gorilla position is waiting for your call.')); return; }
  liveNext();
}
/** Play the segment on screen again from its first moment (Ryan, 20 October). It only replays what was shown: nothing in the game changes. */
export function liveReplaySeg() { typer.finish(); const r = liveReport(); if (r && !liveCall()) look(() => { const L = book().live!, sg = r.segs[L.s]; if (sg) L.b = sg.k === 'match' ? 0 : 0; }); }
/** Is there a segment on screen to play again? */
export function canReplaySeg(): boolean { const r = liveReport(); if (!r || liveCall()) return false; const L = livePos(r); return L.s >= 0 && L.s < r.segs.length && L.b > 0; }
/** Finish the line being typed and jump to this segment's result. */
export function liveSkip() { typer.finish(); const r = liveReport(); if (r && !liveCall()) look(() => { const L = book().live!; if (r.segs[L.s]) L.b = (r.segs[L.s].bc || []).length; }); }
/** In a replay only: skip to the sign-off. A show on the air cannot be skipped. */
export function liveEnd() { const r = liveReport(); if (r && !onAir()) look(() => { book().live = { s: r.segs.length, b: 0 }; }); }
/** Leave the sign-off. A show that has just aired ends on After the show, not on the match-by-match report. A replay goes back to its report. */
export const liveDone = () => look(() => { const b = book(), aired = !!(b.live && b.live.aired) && !!E.afterShow(G.S); b.live = null; if (aired) { b.report = null; b.night = true; } top0(); });
/** Open After the show for the last show of this week (the Office has a button for it). */
export function openNight() { if (!E.afterShow(G.S)) return; go('booking'); look(() => { const b = book(); b.night = true; b.report = null; b.live = null; top0(); }); }
/** Done with After the show: on to the Office, where Before the show is the first thing on the desk. */
export function closeNight() { book().night = false; go('desk'); }
/** From After the show: the full report, match by match. Closing it comes back. */
export function nightFull() { const S = G.S, A = E.afterShow(S); if (!A) return; const i = S.reports.findIndex((r: any) => r.left && r.left.key === A.key); if (i >= 0) look(() => { book().report = i; book().live = null; top0(); }); }
export const replay = () => look(() => { book().live = { s: -1, b: 0 }; top0(); });
/** Close the report. One opened from After the show goes back there (the screen is still under it). */
export const closeReport = () => look(() => { const b = book(); b.report = null; b.live = null; top0(); });
/** Show one of the booking notes beside the sheet. Whatever was selected on the sheet is let go. */
export const pickSide = (id: string) => look(() => { const b = book(); b.side = id; b.edit = -1; sel().seg = -1; });

/* ---------- auto-play: the broadcast runs itself at a reading pace ----------
   Each line stays up long enough to read (longer for a near fall, a finish or a new champion, longest on a
   result), then the next one comes. It never answers a call, never rings the opening bell and never leaves the
   sign-off: those wait for the player. SPACE still moves on at once, and P (or the button) pauses it. What is
   shown and when is all it changes: the show itself was decided by the engine, whatever the pace. */
let autoT: any = null, autoKey = '';
// auto-play stops when a segment is over (Ryan, 20 October: "the show screen needs to stop after every segment"): Next moves on, Replay plays it again
const autoHalt = (k: string | undefined) => !k || k === 'signoff' || k === 'title' || k === 'call' || k === 'next' || k === 'off';
export function autoStop() { if (autoT) { clearTimeout(autoT); autoT = null; } autoKey = ''; }
const PACES: ('tv' | 'full' | 'quick' | 'results')[] = ['tv', 'full', 'quick', 'results'];
export const PACE_N: Record<string, string> = { tv: 'TV', full: 'Full', quick: 'Quick', results: 'Results' };
/* The TV pace (Ryan, 19 October: "a 2 hour show to run about 2 minutes"). A segment gets one second for every minute
   it runs on the show's clock. In that time the broadcast shows the lines that matter: every big moment (a near
   fall, the finish, a new champion), the call of the bell, and lines spread evenly between, while the scene plays;
   the rest of the call is passed over, as a highlight package would. The result takes the last part of the time. */
const TV_LINE = 2400, TV_SEC = 2600;   // each minute on the show's clock is about two and a half seconds on screen
/** Which lines of a segment the TV pace shows, in order. */
export function tvKeys(sg: any): number[] {
  const bc = (sg && sg.bc) || [], n = bc.length; if (!n) return [];
  const T = (sg.mins || 5) * TV_SEC * 0.85, K = Math.max(2, Math.min(n, Math.round(T / TV_LINE))), keep = new Set<number>([0, n - 1]);
  if (sg.k === 'match') { keep.add(lead(sg) + 1); const o = opening(sg); bc.forEach((b: any, i: number) => { if (b.t === 'ent' && i >= o) keep.add(i); }); }
  bc.forEach((b: any, i: number) => { if (b.h || b.t === 'call' || b.t === 'ear') keep.add(i); });
  for (let j = 1; keep.size < K && j <= K; j++) keep.add(Math.round(j * (n - 1) / (K + 1)));
  return [...keep].filter(i => i >= 0 && i < n).sort((a, b) => a - b);
}
/** The next line the TV pace shows after line `b`, or the result. */
export function tvNext(sg: any, b: number): number { const k = tvKeys(sg).find(i => i > b); return k == null ? ((sg && sg.bc) || []).length : k; }
/** Full, quick or results only. What is shown and how fast; never what happens. */
export function paceNext() { look(() => { pref.pace = PACES[(PACES.indexOf(pref.pace) + 1) % PACES.length]; savePrefs(); }); }
export function autoToggle() { look(() => { pref.auto = !pref.auto; savePrefs(); }); }
/** How long the line on screen stays up, in milliseconds. */
export function autoWait(): number {
  const r = liveReport(); if (!r) return 0;
  const L = livePos(r), s = r.segs[L.s], bc = (s && s.bc) || [], sp = Math.sqrt(pref.speed || 1);
  if (!s) return 0;
  if (pref.pace === 'tv') {   // the segment's seconds, shared between the lines shown, and the last part for its result
    const T = (s.mins || 5) * TV_SEC, keys = tvKeys(s);
    if (L.b >= bc.length) return Math.round(Math.max(1600, T * 0.15) / sp);
    const b = bc[L.b], hot = b && b.h ? (b.h > 1 ? 900 : 400) : 0;
    return Math.round(Math.max(900, T * 0.85 / Math.max(1, keys.length)) / sp + hot);
  }
  const quick = pref.pace === 'quick' || pref.pace === 'results';
  if (L.b >= bc.length) return Math.round((quick ? 2400 : 3400) / sp);   // the result: stars, the scores, the belt
  if (pref.pace === 'results') return 500;   // straight on to the result
  const b = bc[L.b], len = b && b.x ? b.x.length : 40, hot = b && b.h ? (b.h > 1 ? 1500 : 800) : 0;
  // quick: the routine lines go by at half the time; a big moment still gets its full time
  return Math.round(Math.min(5200, (800 + len * 26) * (quick && !hot ? 0.5 : 1) + hot) / sp);
}
/** Arm auto-play for what is on screen now. `key` names that moment; a new moment re-arms it. */
export function autoArm(key: string) {
  autoStop(); if (!pref.auto) return;
  autoKey = key;
  const still = () => pref.auto && autoKey === key && !ui.modal && !!liveReport() && !liveCall();
  const wait = () => {
    autoT = null; if (!still()) return;
    if (typer.active() || (typeof document !== 'undefined' && document.hidden)) { autoT = setTimeout(wait, 150); return; }
    const st = liveStep(); if (!st || autoHalt(st.k)) return;
    autoT = setTimeout(() => { autoT = null; if (!still() || typer.active()) return; const s2 = liveStep(); if (!s2 || autoHalt(s2.k)) return; if (pref.pace === 'results' && s2.k === 'seg') liveSkip(); else liveNext(); }, autoWait());
  };
  autoT = setTimeout(wait, 60);
}
