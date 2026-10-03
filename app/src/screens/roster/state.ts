/* View state of the Roster section, and the few moves more than one of its pages make. */
import { W } from '../../engine';
import { G, me, ui, slice, view } from '../../store';
import { onLeavePage } from '../../nav';
import { onBack } from '../../input';
import { Face, FaceKey } from '../../lib/portrait';

export type ProfilePage = 'over' | 'deal' | 'room' | 'scout';
/** The wrestler being designed in the creator window. Kept between visits until they are signed. */
export interface Draft { name: string; g: string; style: string; align: string; bg: string; emph: string; fin: string; gim: string; face: Face }
export interface RosterState {
  /** the open profile (a wrestler id), on the Roster and Locker room pages */
  sel: number | null;
  /** the profile closed last, so a remote lands back on that row */
  last: number | null;
  /** which of the four profile pages is showing. Stays put while the player moves between wrestlers. */
  pt: ProfilePage;
  rf: { brand: string; g: string; al: string; q: string };
  rs: { k: string; d: number };
  repack: { id: number; g: string } | null;
  mq: string;
  offer: number | null;
  wage: string;
  weeks: string;
  cw: Draft | null;
  caw: { cat: 'head' | 'face' | 'body' | 'gear' | 'skills'; part: FaceKey; pick: number | null };
  cawMsg: string | null;
}
export function rs(): RosterState {
  return slice<RosterState>('roster', () => ({ sel: null, last: null, pt: 'over', rf: { brand: 'all', g: 'all', al: 'all', q: '' }, rs: { k: 'ovr', d: -1 }, repack: null, mq: '', offer: null, wage: '', weeks: '48', cw: null, caw: { cat: 'face', part: 'hr', pick: null }, cawMsg: null }));
}

/** The wrestler whose profile is open, if they are still on the player's roster. */
export function selected(): W | null {
  const S = G.S, st = rs(), w = st.sel != null ? S.w[st.sel] : null;
  return w && w.promo === me().id ? w : null;
}
/** Open a profile, or close it when it is the one already open. */
export function pick(id: number) {
  view(() => {
    const st = rs();
    if (st.sel === id) { st.last = id; st.sel = null; } else st.sel = id;
    ui.confirm = null;
    if (st.sel != null) { try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } }
  });
}

/* Back closes the open profile on the two pages that show one. */
onBack(() => {
  if (ui.page !== 'roster' && ui.page !== 'locker') return false;
  const w = selected(); if (!w) return false;
  pick(w.id);
  return true;
});
/* Half-finished business does not follow the player to another page. */
onLeavePage(() => { const st = ui.slices.roster as RosterState | undefined; if (st) { st.offer = null; st.last = null; } });
