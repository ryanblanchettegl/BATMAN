/* World Editor view state. The world being edited is a universe package kept with the player's other worlds (UNIS). */
import { E } from '../../engine';
import { UNIS, saveUnis, slice, redraw, ui } from '../../store';

export type EdTab = 'world' | 'companies' | 'shows' | 'belts' | 'wrestlers' | 'teams' | 'share';
export interface EdState {
  /** the world open in the editor, or null on the list of worlds */
  id: string | null; tab: EdTab;
  /** the record open on each tab */
  sel: Record<string, string | null>;
  q: string; fp: string; newName: string; del: string | null; msg: string; err: boolean; text: string; copied: boolean; fill: number;
}
export const es = () => slice<EdState>('worldedit', () => ({ id: null, tab: 'world', sel: {}, q: '', fp: '', newName: '', del: null, msg: '', err: false, text: '', copied: false, fill: 12 }));
/** The package open in the editor. */
export const world = (): any => UNIS[es().id as string];

let timer: any = null, stale = true, checked: { id: string | null; v: any } = { id: null, v: null };
/** Keep the change. Typing saves a moment after the last key so a long world is not written on every letter. */
export function keep(now?: boolean) {
  const st = es(); stale = true;
  const write = () => { timer = null; if (!saveUnis()) { st.msg = 'This device could not store the world. Copy its text from Check and share to keep it.'; st.err = true; redraw(); } };
  if (timer) clearTimeout(timer);
  if (now) write(); else timer = setTimeout(write, 400);
}
/** Change the world, keep it and redraw. */
export function edit(fn: () => void) { const st = es(); st.msg = ''; st.err = false; st.del = null; st.copied = false; fn(); keep(); redraw(); }
/** Change only the view. */
export function look(fn: () => void) { const st = es(); st.del = null; fn(); redraw(); }
export function note(msg: string, err?: boolean) { const st = es(); st.msg = msg; st.err = !!err; }
/** The checker's report for the open world, worked out once per change. */
export function report(): any {
  const st = es();
  if (stale || checked.id !== st.id || !checked.v) { checked = { id: st.id, v: E.edCheck(world()) }; stale = false; }
  return checked.v;
}
/** A world id that no other stored world uses. */
export function freeId(base: string): string { let id = base, n = 2; while (UNIS[id] || id === 'public_domain') { id = base.slice(0, 36) + '_' + n; n++; } return id; }
export function openWorld(id: string) { const st = es(); st.id = id; st.tab = 'world'; st.sel = {}; st.q = ''; st.fp = ''; st.msg = ''; st.text = ''; stale = true; ui.mi = 0; }
export const pushOrder = ['main_eventer', 'upper_midcarder', 'midcarder', 'lower_midcarder', 'jobber', 'non_wrestler'];
/** A record's id follows its name. Keep whatever was open pointing at it. */
export function reId(table: string, old: string, id: string) {
  if (old === id) return; const st = es();
  const keys = table === 'promotions' ? ['companies', 'showsFor', 'beltsFor', 'teamsFor'] : table === 'workers' ? ['wrestlers', 'bondA', 'bondB'] : table === 'titles' ? ['belts'] : table === 'teams' ? ['teams'] : [];
  keys.forEach(k => { if (st.sel[k] === old) st.sel[k] = id; });
  if (table === 'promotions' && st.fp === old) st.fp = id;
}
