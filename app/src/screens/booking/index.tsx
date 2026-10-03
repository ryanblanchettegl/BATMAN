/* Booking: build the card, make the calls, watch the show, read the fallout. One page that shows, in this order of
   priority, the broadcast, a show report, "Week booked", or the card builder. View state is book() in flow.ts. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, ui, Modal } from '../../store';
import { HOT, weekDone, onLeavePage } from '../../nav';
import { onBack, onKey } from '../../input';
import { book } from '../../flow';
import { ScheduleList, EndWeekBtn } from '../../shared/week';
import { Head, Panel, Btn, CheckLine, Window } from '../../kit';
import { Card } from './Card';
import { SegWindow } from './Segments';
import { ShapeGuide } from './Shape';
import { Live } from './Live';
import { Report } from './Report';
import { run, typer, liveReport, liveSkip, closeReport } from './run';

function WeekBooked() {
  return <>
    <Head eyebrow={E.cal(G.S.week).label} title="Week booked" />
    <Panel title="This week"><ScheduleList /><EndWeekBtn /></Panel>
  </>;
}
function Booking() {
  const S = G.S, b = book(), r = b.report != null ? S.reports[b.report] : null;
  if (r) return b.live && r.venue ? <Live r={r} /> : <Report r={r} />;
  return weekDone() ? <WeekBooked /> : <Card />;
}

/* ---------- the headset call: something went wrong on the air and the director wants an answer ---------- */
const RED_PHONE = '  .-------.\n /  ( ! )  \\\n \\_________/\n   |RED |\n   \'----\'';
function Chaos(p: { m: Modal }) {
  const c = G.S.chs, open = c && !c.done;
  return <Window title="Gorilla position" noOk hint="Esc puts the headset down. The call will still be waiting.">
    {!open ? <p>The moment has passed.</p> : <>
      <pre class="ascii phone" aria-hidden="true">{RED_PHONE}</pre>
      <p><b>{c.text}</b></p>
      <p class="muted mt1">The director is shouting in your headset. Make the call.</p>
      {c.checks ? Object.keys(c.checks).map(k => <CheckLine label={c.choices[k]} ck={c.checks[k]} />) : null}
      <div class="stack calls mt3">{c.choices.map((x: string, i: number) =>
        <Btn kind={i === 0 ? 'go' : undefined} id={i === 0 ? 'modal-ok' : undefined} t="chaos" d={{ c: i }} onClick={() => run('chaos', i)}>{x}</Btn>)}</div>
    </>}
  </Window>;
}

/* ---------- keys and Back ---------- */
// While the broadcast is showing: Enter or Space presses the continue button, Esc finishes the line and skips to the
// result, and the page shortcuts wait until the show is over (as in the old interface).
onKey(e => {
  if (ui.modal || !liveReport() || G.S.over || e.ctrlKey || e.metaKey || e.altKey) return false;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return false;
  if (e.key === 'Escape') { liveSkip(); return true; }
  if ((e.key === 'Enter' || e.key === ' ') && tag !== 'BUTTON') { const go = document.getElementById('live-go'); if (go) go.click(); return true; }
  return e.key.length === 1 && !!HOT[e.key.toLowerCase()];
});
// Back skips the segment being broadcast, else closes an open report.
onBack(() => {
  if (ui.page !== 'booking' || G.S.over) return false;
  if (liveReport()) { liveSkip(); return true; }
  if (book().report != null) { closeReport(); return true; }
  return false;
});
// Leaving the page drops the open report and the broadcast. (openReport() goes to Booking first, then sets the report.)
onLeavePage(() => { typer.finish(); const b = book(); b.report = null; b.live = null; });

export const pages: Record<string, () => ComponentChildren> = { booking: Booking };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { chaos: Chaos, segwin: SegWindow, shapeguide: ShapeGuide };
