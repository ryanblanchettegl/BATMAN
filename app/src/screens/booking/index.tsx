/* Booking: build the card, make the calls, watch the show, read the fallout. One page that shows, in this order of
   priority, the broadcast, a show report, "Week booked", or the card builder. View state is book() in flow.ts. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, ui, Modal } from '../../store';
import { HOT, weekDone, onLeavePage } from '../../nav';
import { onBack, onKey } from '../../input';
import { book } from '../../flow';
import { ScheduleList, EndWeekBtn } from '../../shared/week';
import { Head, Panel } from '../../kit';
import { Card } from './Card';
import { SegWindow, OpenGuide } from './Segments';
import { ShapeGuide } from './Shape';
import { Live } from './Live';
import { Report, Ladder } from './Report';
import { typer, liveReport, liveSkip, liveCall, liveDecide, liveGo, closeReport } from './run';

function WeekBooked() {
  return <>
    <Head eyebrow={E.cal(G.S.week).label} title="Week booked" />
    <Panel title="This week"><ScheduleList /><EndWeekBtn /></Panel>
  </>;
}
function Booking() {
  const S = G.S, b = book(), r = b.report != null ? S.reports[b.report] : null;
  if (S.live) return <Live r={S.live.st.rep} />;   // a show on the air comes before everything
  if (r) return b.live && r.venue ? <Live r={r} /> : <Report r={r} />;
  return weekDone() ? <WeekBooked /> : <Card />;
}

/* ---------- keys and Back ---------- */
// While the broadcast is showing: Enter or Space does what the big yellow button does, Esc finishes the line and skips to the
// result, and the page shortcuts wait until the show is over (as in the old interface).
onKey(e => {
  if (ui.modal || !liveReport() || G.S.over || e.ctrlKey || e.metaKey || e.altKey) return false;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return false;
  if (liveCall() && /^[1-9]$/.test(e.key)) { liveDecide(+e.key - 1); return true; }   // the number keys answer a call
  if (e.key === 'Escape') { liveSkip(); return true; }
  if ((e.key === 'Enter' || e.key === ' ') && tag !== 'BUTTON') { liveGo(); return true; }
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
onLeavePage(() => { typer.finish(); const b = book(); b.report = null; if (!(G.S && G.S.live)) b.live = null; });

export const pages: Record<string, () => ComponentChildren> = { booking: Booking };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { segwin: SegWindow, shapeguide: ShapeGuide, openguide: OpenGuide, ladder: Ladder };
