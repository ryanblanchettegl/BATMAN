/* The screen map (docs/design.md, section 3). Six sections, each with a row of page buttons. Office holds the desk,
   Backstage and Storylines (Ryan, 6 October); History sits with the other information pages on Company. */
import { G, ui, redraw } from './store';

export interface Section { id: string; n: string; key: string; pages: [string, string][] }
export const SECTIONS: Section[] = [
  { id: 'office', n: 'Office', key: 'o', pages: [['desk', 'The desk'], ['backstage', 'Backstage'], ['storylines', 'Storylines'], ['career', 'Career']] },
  { id: 'booking', n: 'Booking', key: 'b', pages: [['booking', 'Booking']] },
  { id: 'roster', n: 'Roster', key: 'r', pages: [['roster', 'Roster'], ['locker', 'Locker room'], ['titles', 'Titles'], ['market', 'Free agents']] },
  { id: 'net', n: 'Net', key: 'n', pages: [['sheet', 'Dirt sheet'], ['feed', 'The feed'], ['boards', 'The boards']] },
  { id: 'manage', n: 'Manage', key: 'm', pages: [['manage', 'Operations'], ['house', 'House'], ['deals', 'Deals']] },
  { id: 'company', n: 'Company', key: 'c', pages: [['overview', 'Overview'], ['finances', 'Finances'], ['world', 'World'], ['history', 'History']] }
];
/** keyboard shortcuts: letter -> page */
export const HOT: Record<string, string> = { o: 'desk', p: 'backstage', a: 'career', b: 'booking', r: 'roster', l: 'locker', t: 'titles', k: 'market', s: 'storylines', h: 'history', n: 'sheet', e: 'feed', g: 'boards', m: 'manage', u: 'house', d: 'deals', c: 'overview', f: 'finances', w: 'world' };
export function sectionOf(page: string): Section { return SECTIONS.find(s => s.pages.some(p => p[0] === page)) || SECTIONS[0]; }
export function pageName(page: string): string { for (const s of SECTIONS) for (const p of s.pages) if (p[0] === page) return p[1]; return page; }

/** Called when the page changes, so a section can drop transient state (an open report, a confirm bar). */
const leaveHooks: (() => void)[] = [];
export function onLeavePage(fn: () => void) { leaveHooks.push(fn); }

/** Go to a page. Section ids work too and open the section's first page. */
export function go(page: string) {
  const sec = SECTIONS.find(s => s.id === page);
  if (sec) page = sec.pages[0][0];
  // a show that is on the air cannot be walked away from
  if (G.S && G.S.live && page !== 'booking') { if (ui.page !== 'booking') page = 'booking'; else { ui.flash = { text: 'The show is on the air. See it through.', err: true }; redraw(); return; } }
  leaveHooks.forEach(fn => fn());
  ui.page = page; ui.confirm = null; ui.flash = null;
  try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  redraw();
}
export function weekDone(): boolean { const S = G.S; return S.qi >= S.queue.length; }
export function pending(): number { return G.S.inbox.filter((e: any) => !e.done).length; }
