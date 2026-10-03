/* Office view state, and keeping the highlight alive when the control that was just used goes away. */
import { useLayoutEffect } from 'preact/hooks';
import { slice } from '../../store';
import { NAV } from '../../input';

/** Before the show: the room that is open (`pl`) and the wrestlers picked in its drop-downs (`a`, `b`).
    The desk: the clock whose window is open (`clock`), so the highlight can go back to it. */
export interface OfficeState { pl: string | null; a: number | null; b: number | null; clock: string | null }
export function office(): OfficeState { return slice<OfficeState>('office', () => ({ pl: null, a: null, b: null, clock: null })); }

/** Before the show: when the control just used is switched off or removed, the highlight goes back to the open room on the map. */
export const TO_MAP = ['.room.on', '.room'];

let want: { near: string[]; far: string[] } | null = null;
/** Call inside act(): if the control that was clicked is gone or switched off after the redraw, focus moves to the
    first selector that matches. `near` sits next to the old control and always applies. `far` may be off screen,
    so it only applies on a remote or gamepad, where the highlight must never be lost. */
export function focusAfter(near: string[], far?: string[]) { want = { near, far: far || [] }; }
/** Put this in the component that draws the controls named in focusAfter(). */
export function useFocusAfter() {
  useLayoutEffect(() => {
    const w = want; want = null; if (!w) return;
    const ae = document.activeElement as HTMLButtonElement | null;
    if (ae && ae !== document.body && document.contains(ae) && !ae.disabled) return;
    for (const s of w.near.concat(NAV.on ? w.far : [])) {
      const el = document.querySelector(s) as HTMLElement | null;
      // only a remote scrolls to follow the highlight; a mouse or a finger keeps the page where it is
      if (el) { try { el.focus({ preventScroll: !NAV.on }); if (NAV.on) el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ } return; }
    }
  });
}
