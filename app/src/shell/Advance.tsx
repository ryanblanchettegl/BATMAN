/* The ADVANCE button. One button, laid over the right end of the menu bar, big, one or two words: the next thing the
   week needs. When this week's tasks are in the way it says Attention and leads to the desk, where the list is. The engine decides all of it (src/96-advance.js);
   this file draws it and presses the right thing. Why it is built this way: docs/plans/advance-button.md. */
import { E } from '../engine';
import { G, ui, act, say } from '../store';
import { go } from '../nav';
import { endWeek, book } from '../flow';
import { onKey } from '../input';

/** Is the broadcast on screen? Then the button carries the show forward. */
function live(): boolean { const b = book(); return ui.page === 'booking' && b.report != null && !!b.live && !!document.getElementById('live-go'); }
function reportOpen(): boolean { const b = book(); return ui.page === 'booking' && b.report != null; }

/** What the button says right now: one or two words (short), and the same thing as a sentence (label). */
export function advanceNow(): { short: string; label: string; day: string; k: string; why: string[] } {
  const S = G.S, A = E.advance(S), sh = S.queue[S.qi];
  if (A.k !== 'over' && reportOpen() && book().live) return { short: 'Continue', label: 'On with the show', day: 'On the air', k: 'live', why: [] };
  if (A.k === 'run' && ui.page !== 'booking') return { short: 'Open card', label: 'The card for ' + sh.name + ' is ready. Open it, then run the show.', day: A.day, k: 'book', why: [] };
  return { short: A.short, label: A.label, day: A.day, k: A.k, why: A.why };
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
  if (live()) { (document.getElementById('live-go') as HTMLElement).click(); return; }
  if (reportOpen()) { const b = book(); act(() => { b.report = null; b.live = null; }); }
  const A = E.advance(S);
  if (A.k === 'week') { endWeek(); return; }
  if (A.k === 'run') {
    if (ui.page !== 'booking') { go('booking'); return; }
    const btn = document.querySelector('[data-t="run"]') as HTMLElement | null; if (btn) btn.click(); else go('booking');
    return;
  }
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

/** The button itself: top right, big, one or two words. What it means in full, and anything in the way, is in the
    note that opens under it when the pointer or the highlight is on it. The same list is always on the desk. */
export function AdvanceBtn() {
  const S = G.S; if (!S || S.over) return null;
  const A = advanceNow(), lines = A.k === 'task' ? A.why : [A.label].concat(A.why);
  return <button type="button" class={'adv k-' + A.k} data-t="advance" data-v={A.k} aria-label={A.short + ': ' + A.label} onClick={pressAdvance}>
    <b>{A.short}</b>
    <span class="tip" data-t="adv-tip" role="note"><span class="th">{A.k === 'task' ? 'Needs you first' : (A.day || 'Next')}</span>{lines.map((x, i) => <span class="tl" key={i}>{x}</span>)}<span class="hint">{A.k === 'task' ? 'Press to go to your desk.' : 'Space bar'}</span></span>
  </button>;
}

// The space bar is the ADVANCE key, anywhere a space would not be typed or press something else.
onKey(e => {
  if (e.key !== ' ' || !G.S || G.S.over || ui.modal || ui.cards.length || ui.boot || e.ctrlKey || e.metaKey || e.altKey) return false;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'TR') return false;
  if (document.getElementById('live-go')) return false;   // the broadcast has its own space bar
  pressAdvance(); return true;
});
