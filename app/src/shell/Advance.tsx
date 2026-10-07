/* The ADVANCE key. One key at the right end of the bottom line: SPACE, and one or two words for the next thing the
   week needs. Its colour says what kind of step it is: yellow moves the week on, red wants you first, green puts a
   show on the air, white goes back to the Office, teal ends the week. When this week's tasks are in the way it says
   Attention and leads to the desk, where the list is. The engine decides all of it (src/96-advance.js);
   this file draws it and presses the right thing. Why it is built this way: docs/plans/advance-button.md. */
import { E } from '../engine';
import { G, ui, act, say } from '../store';
import { go } from '../nav';
import { endWeek, book } from '../flow';
import { onKey, NAV } from '../input';
import { run, liveStep, liveGo, onAir, closeReport, closeNight } from '../screens/booking/run';

/** Is the broadcast on screen? Then the button carries the show forward. */
function live(): boolean { return !!liveStep(); }
/** Is the report of a show that ran this week open? Closing it goes to the desk. */
function nightOpen(): boolean { const b = book(), S = G.S; return ui.page === 'booking' && !!b.night && !S.live && !b.live && !!E.afterShow(S); }
function reportOpen(): boolean { const b = book(); return ui.page === 'booking' && b.report != null; }

export type Tone = 'go' | 'stop' | 'air' | 'home' | 'end';
/** What the key says right now: one or two words (short), the same thing as a sentence (label), and its colour (tone). */
export function advanceNow(): { short: string; label: string; day: string; k: string; tone: Tone; why: string[]; live?: string } {
  const S = G.S, A = E.advance(S), sh = S.queue[S.qi], st = liveStep();
  // a broadcast on screen: the key is the only way forward, and says what it will do
  if (st) return { short: st.short, label: st.label, day: onAir() ? 'On the air' : 'Replay', k: 'live', tone: st.k === 'call' ? 'stop' : (st.k === 'title' ? 'air' : 'go'), why: [], live: st.k };
  if (S.live) { const call = S.live.ev && !S.live.ev.done; return { short: call ? 'Your call' : 'Continue', label: call ? 'The gorilla position is waiting for your answer' : 'The show is on the air', day: 'On the air', k: 'live', tone: call ? 'stop' : 'go', why: [] }; }
  if (A.k !== 'over' && reportOpen() && book().live) return { short: 'Continue', label: 'On with the replay', day: 'Replay', k: 'live', tone: 'go', why: [] };
  // a report of tonight's show is open: the night ends on the desk, with what it left behind
  if (A.k !== 'over' && nightOpen()) return book().report != null ? { short: 'Recap', label: 'Back to After the show', day: 'After the show', k: 'desk', tone: 'home', why: [] }
    : { short: 'Office', label: 'On to the Office. Before the show is the first thing on your desk.', day: 'After the show', k: 'desk', tone: 'home', why: [] };
  if (A.k === 'run' && ui.page !== 'booking') return { short: 'Open card', label: 'The card for ' + sh.name + ' is ready. Open it, then run the show.', day: A.day, k: 'book', tone: 'go', why: [] };
  return { short: A.short, label: A.label, day: A.day, k: A.k, tone: (A.tone || 'go') as Tone, why: A.why };
}
/** Go to the desk and point at this week's tasks: the list comes into view, the ones that cannot be skipped flash,
    and the highlight lands on the first of them. */
function toDesk() {
  if (ui.page !== 'desk') go('desk');
  setTimeout(() => {
    const box = document.querySelector('.tasks') as HTMLElement | null; if (!box) return;
    box.scrollIntoView({ block: 'center' });
    box.classList.remove('hit'); void box.offsetWidth; box.classList.add('hit');
    setTimeout(() => box.classList.remove('hit'), 2400);
    const first = box.querySelector('.task.todo [data-t="task-go"]') as HTMLElement | null; if (first) first.focus();
  }, 0);
}
/** Press the button: go to the next decision, or do the one thing that is a single press. */
export function pressAdvance() {
  const S = G.S; if (!S || S.over || ui.modal || ui.cards.length) return;
  if (live()) { liveGo(); return; }
  if (S.live) { if (ui.page !== 'booking') go('booking'); else act(() => say('The gorilla position is waiting for your call.')); return; }
  if (nightOpen()) { if (book().report != null) closeReport(); else closeNight(); return; }
  if (reportOpen()) { const b = book(); act(() => { b.report = null; b.live = null; }); }
  const A = E.advance(S);
  if (A.k === 'week') { endWeek(); return; }
  // on the card, this button is the only way to run the show. An unfinished card is tried too, so the list of what to fix comes up.
  if (ui.page === 'booking' && (A.k === 'run' || (A.k === 'book' && S.card.length))) { run('run'); return; }
  if (A.k === 'run') { go('booking'); return; }
  if (A.k === 'task') {
    const here = ui.page === 'desk';
    toDesk();
    if (here) act(() => say(A.why.length > 1 ? A.why.length + ' things on your desk need you first. They are marked.' : (A.why[0] || A.label)));
    return;
  }
  // the card needs building or fixing, or there is a problem before the bell
  if (ui.page === 'booking') { act(() => say(A.why[0] || (A.k === 'pre' ? 'Something needs an answer before the bell. It is at the top of the card.' : 'Build the card: Suggest a card, or Add a match.'), { err: !!A.why.length })); return; }
  go('booking');
}

/** What is printed on the key cap: the space bar at a desk, the right trigger on a pad, Play on a remote. A tablet has no key, so no cap. */
function cap(): string { return NAV.pad ? 'RT' : (NAV.tv ? 'PLAY' : (document.documentElement.getAttribute('data-screen') === 'tablet' ? '' : 'SPACE')); }
/** The key itself: the right end of the bottom line. What it means in full, and anything in the way, is in the
    note that opens over it when the pointer or the highlight is on it. The same list is always on the desk. */
export function AdvanceKey() {
  const S = G.S; if (!S || S.over) return null;
  const A = advanceNow(), lines = A.k === 'task' ? A.why : [A.label].concat(A.why), c = cap();
  return <button type="button" class={'key tone-' + A.tone + ' k-' + A.k} data-t="advance" data-v={A.k} data-tone={A.tone} data-live={A.live} aria-label={A.short + ': ' + A.label} onClick={pressAdvance}>
    {c ? <i class="cap" aria-hidden="true">{c}</i> : null}
    <span class="lab"><span class="arw" aria-hidden="true">{'►'}</span><b>{A.short}</b></span>
    <span class="tip" data-t="adv-tip" role="note"><span class="th">{A.k === 'task' ? 'Needs you first' : (A.day || 'Next')}</span>{lines.map((x, i) => <span class="tl" key={i}>{x}</span>)}<span class="hint">{A.k === 'task' ? 'Press to go to your desk.' : 'Space bar, or Play on a remote'}</span></span>
  </button>;
}

// The space bar is the ADVANCE key, anywhere a space would not be typed or press something else.
// A remote has no space bar: its play button does the same from anywhere (a pad uses the right trigger).
const PLAY = (e: KeyboardEvent) => e.key === 'MediaPlayPause' || e.key === 'MediaPlay' || e.keyCode === 415 || e.keyCode === 10252;
onKey(e => {
  if (PLAY(e)) { if (!G.S || G.S.over || ui.modal || ui.cards.length || ui.boot) return false; const a = document.querySelector('[data-t="advance"]') as HTMLElement | null; if (!a) return false; a.click(); return true; }
  if (e.key !== ' ' || !G.S || G.S.over || ui.modal || ui.cards.length || ui.boot || e.ctrlKey || e.metaKey || e.altKey) return false;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'TR') return false;
  pressAdvance(); return true;
});
