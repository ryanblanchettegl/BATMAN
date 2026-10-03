/* Input that is not a mouse: keyboard shortcuts, a TV remote, a gamepad. Also the screen mode (desk, tablet, TV, phone).
   See docs/design.md, sections 4 and 5. */
import { G, ui, pref, redraw, closeModal, openModal, popCard } from './store';
import { HOT, SECTIONS, sectionOf, go } from './nav';
import { book } from './flow';

/* ---------- screen mode ---------- */
export const NAV = { on: false, pad: false, tv: false };
export function autoScreen(): 'desk' | 'tablet' | 'tv' | 'phone' {
  const w = window.innerWidth, ua = navigator.userAgent || ''; let coarse = false;
  try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* ignore */ }
  if (/SmartTV|SMART-TV|Tizen|Web0S|webOS|\bAFT[A-Z]|GoogleTV|Android TV|BRAVIA|HbbTV|CrKey|Roku|Xbox|PlayStation|\bTV\b/i.test(ua)) return 'tv';
  if (w <= 640) return 'phone';
  return coarse ? 'tablet' : 'desk';
}
export function screenMode() { return pref.screen && pref.screen !== 'auto' ? pref.screen : autoScreen(); }
export function applyScreen() {
  const de = document.documentElement, m = screenMode();
  de.setAttribute('data-screen', m); de.style.setProperty('--zoom', String(pref.zoom || 1));
  de.classList.toggle('crtfx', !!pref.crt);
  NAV.tv = m === 'tv'; NAV.on = NAV.tv || NAV.pad; de.classList.toggle('nav', NAV.on);
}

/* ---------- section hooks ---------- */
/** A section registers what Back means while it has something open (a report, a profile). Return true if handled. */
const backs: (() => boolean)[] = [];
export function onBack(fn: () => boolean) { backs.push(fn); }
/** A section can take keys before the global shortcuts do (Enter in the broadcast, arrows in the creator). Return true if handled. */
const keys: ((e: KeyboardEvent) => boolean)[] = [];
export function onKey(fn: (e: KeyboardEvent) => boolean) { keys.push(fn); }

/* ---------- focus by geometry ---------- */
const app = () => document.getElementById('app')!;
function navScope(): HTMLElement { return (document.querySelector('.win') || document.querySelector('.caw-win') || app()) as HTMLElement; }
function focusables(scope: HTMLElement): HTMLElement[] {
  return ([].slice.call(scope.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]):not([hidden]),textarea,tr.pick')) as HTMLElement[]).filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
}
export function isText(el: any): boolean { return !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(range|checkbox|radio|button|file)$/.test(el.type || ''))); }
/** Put the highlight on the most useful control of whatever is showing. */
export function navHome(): boolean {
  const scope = navScope();
  let el = scope.querySelector('[data-home]') as HTMLElement | null;
  if (!el) el = (scope.querySelector('.dmenu .mi.on') || scope.querySelector('#live-go') || scope.querySelector('#modal-ok')) as HTMLElement | null;
  if (!el) { const L = focusables(scope), M = L.filter(e => !e.closest('.menu') && !e.closest('.status') && !e.closest('.wt') && !e.classList.contains('caw-x')); el = M[0] || L[0] || null; }
  if (el) { try { el.focus(); el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ } }
  return !!el;
}
const gap = (a1: number, a2: number, b1: number, b2: number) => b1 > a2 ? b1 - a2 : (a1 > b2 ? a1 - b2 : 0);
function navMove(dir: string): boolean {
  const scope = navScope(), L = focusables(scope), cur = document.activeElement as HTMLElement | null, vh = window.innerHeight, vert = dir === 'up' || dir === 'down';
  if (!L.length) return false;
  if (!cur || L.indexOf(cur) < 0) return navHome();
  const curLnk = cur.classList.contains('lnk'), LNK_COST = vh * 0.18;
  const barOf = (e: HTMLElement) => e.closest('.menu') ? 1 : (e.closest('.status') ? 2 : 0), cb = barOf(cur), r = cur.getBoundingClientRect();
  const pickFrom = (pool: HTMLElement[]) => {
    let best: HTMLElement | null = null, bs = Infinity;
    pool.forEach(e => {
      if (e === cur) return; const q = e.getBoundingClientRect(); let prim: number, sec: number;
      if (dir === 'down') { if (q.top < r.bottom - 2) return; prim = q.top - r.bottom; sec = gap(r.left, r.right, q.left, q.right); }
      else if (dir === 'up') { if (q.bottom > r.top + 2) return; prim = r.top - q.bottom; sec = gap(r.left, r.right, q.left, q.right); }
      else if (dir === 'right') { if (q.left < r.right - 2) return; prim = q.left - r.right; sec = gap(r.top, r.bottom, q.top, q.bottom); }
      else { if (q.right > r.left + 2) return; prim = r.left - q.right; sec = gap(r.top, r.bottom, q.top, q.bottom); }
      // names inside text are stops too, but a button or a row that lies the same way comes first
      const sc = prim + sec * (vert ? 2.5 : 4) + (e.classList.contains('lnk') && !curLnk ? LNK_COST : 0); if (sc < bs) { bs = sc; best = e; }
    });
    return best as HTMLElement | null;
  };
  // the menu and status bars stay on screen while the page scrolls, so they are only a destination once the page has nothing left that way
  let best = pickFrom(L.filter(e => !vert && cb ? barOf(e) === cb : barOf(e) === 0));
  if (!best && vert) {
    const de = document.documentElement, atEnd = dir === 'down' ? window.innerHeight + window.scrollY >= de.scrollHeight - 4 : window.scrollY <= 2;
    if (!atEnd && !cb) { window.scrollBy(0, (dir === 'down' ? 1 : -1) * vh * 0.4); return true; }
    best = pickFrom(L.filter(e => barOf(e) === (dir === 'up' ? 1 : 2)));
  }
  if (!best) return true;
  const bq = best.getBoundingClientRect();
  if (!barOf(best) && ((dir === 'down' && bq.top > vh * 1.6) || (dir === 'up' && bq.bottom < -vh * 0.6))) { window.scrollBy(0, (dir === 'down' ? 1 : -1) * vh * 0.5); return true; }
  try { best.focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* ignore */ }
  return true;
}
function navKey(dir: string): boolean {
  const el = document.activeElement as any, side = dir === 'left' || dir === 'right';
  if (el && el.type === 'range' && side) { el.value = String(+el.value + (dir === 'right' ? 4 : -4)); el.dispatchEvent(new Event('input', { bubbles: true })); return true; }
  if (isText(el) && side) { let cp: number | null = null; try { cp = el.selectionStart; } catch (e) { /* number inputs */ } if (cp != null && ((dir === 'right' && cp < el.value.length) || (dir === 'left' && cp > 0))) return false; }
  return navMove(dir);
}
function activate(el: any, pad?: boolean) {
  if (!el || el === document.body) { navHome(); return; }
  // a remote's OK opens the browser's own list, which its arrows can then drive. A gamepad could not drive that list, so A steps to the next choice instead.
  if (el.tagName === 'SELECT') {
    const step = () => { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (pad) step(); else { try { el.showPicker(); } catch (e) { step(); } }
    return;
  }
  if (isText(el)) { el.focus(); return; }
  el.click();
}

/* ---------- back ---------- */
/** One rule everywhere: close the pop-up, else leave what is open, else go to the desk, else highlight the menu. */
export function goBack(): boolean {
  if (ui.boot) { skipBoot(); return true; }
  if (ui.cards.length) { popCard(); return true; }
  if (ui.modal) { closeModal(); return true; }
  if (!G.S) {
    if (ui.setup) { ui.setup = null; ui.scr = 'select'; redraw(); return true; }
    if (ui.scr === 'select') { ui.scr = 'title'; ui.mi = 0; redraw(); return true; }
    return false;
  }
  for (const fn of backs) if (fn()) return true;
  if (ui.page !== 'desk') { go('desk'); return true; }
  const mb = document.querySelector('.menu button[aria-current="page"]') as HTMLElement | null;
  if (NAV.on && mb && document.activeElement !== mb) { mb.focus(); return true; }
  return false;
}
let bootTimer: any = null;
export function setBootTimer(t: any) { bootTimer = t; }
export function skipBoot() { if (!ui.boot) return; clearTimeout(bootTimer); ui.boot = null; redraw(); }

/* ---------- gamepad ---------- */
const PAD: { prev: Record<string, boolean>; t: Record<string, number>; rep: Record<string, boolean>; raf: number } = { prev: {}, t: {}, rep: {}, raf: 0 };
export function padPress(k: string) {
  if (ui.boot) { skipBoot(); return; }
  if (k === 'up' || k === 'down' || k === 'left' || k === 'right') { navKey(k); return; }
  if (k === 'a') { activate(document.activeElement, true); return; }
  if (k === 'b') { goBack(); return; }
  if (k === 'start') { if (ui.modal && ui.modal.kind === 'options') closeModal(); else openModal({ kind: 'options' }); return; }
  if (k === 'sel') { if (ui.modal && ui.modal.kind === 'help') closeModal(); else openModal({ kind: 'help' }); return; }
  if ((k === 'lb' || k === 'rb') && G.S && !ui.modal && !G.S.over && !book().live) {
    let i = SECTIONS.indexOf(sectionOf(ui.page)); i = (i + (k === 'rb' ? 1 : SECTIONS.length - 1)) % SECTIONS.length; go(SECTIONS[i].id);
  }
}
function padPoll() {
  let gps: (Gamepad | null)[] = [], gp: Gamepad | null = null;
  try { gps = navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; } catch (e) { /* blocked */ }
  for (const g of gps) if (g && g.connected) { gp = g; break; }
  if (gp) {
    const now = Date.now(), b = (n: number) => !!(gp!.buttons[n] && gp!.buttons[n].pressed), ax = gp.axes || [];
    const st: Record<string, boolean> = { a: b(0), b: b(1), lb: b(4), rb: b(5), sel: b(8), start: b(9), up: b(12) || ax[1] < -0.6, down: b(13) || ax[1] > 0.6, left: b(14) || ax[0] < -0.6, right: b(15) || ax[0] > 0.6 };
    Object.keys(st).forEach(k => {
      const move = k === 'up' || k === 'down' || k === 'left' || k === 'right';
      if (st[k] && (!PAD.prev[k] || (move && now - PAD.t[k] > (PAD.rep[k] ? 120 : 400)))) { PAD.rep[k] = !!PAD.prev[k]; PAD.t[k] = now; padPress(k); }
      if (!st[k]) PAD.rep[k] = false; PAD.prev[k] = st[k];
    });
    if (Math.abs(ax[3] || 0) > 0.25) window.scrollBy(0, ax[3] * 24);
  }
  PAD.raf = window.requestAnimationFrame(padPoll);
}

/* ---------- after every draw ---------- */
let lastPage = '';
/** Keeps the highlight alive: after a draw, if nothing is focused and the player is on a remote or gamepad, focus the page's first control. */
export function afterDraw() {
  [].forEach.call(document.querySelectorAll('tr.pick'), (tr: HTMLElement) => { if (tr.tabIndex !== 0) tr.tabIndex = 0; });
  // a pop-up moves focus in and out by itself (kit/window.tsx), so only a change of page or screen sends the highlight home
  const key = (G.S ? ui.page : ui.scr + (ui.setup ? '+setup' : '')) + (ui.boot ? '+boot' : '');
  const changed = key !== lastPage; lastPage = key;
  const ae = document.activeElement;
  if (NAV.on && (changed || !ae || ae === document.body)) navHome();
}

/* ---------- wiring ---------- */
export function initInput() {
  applyScreen();
  window.addEventListener('resize', applyScreen);
  window.addEventListener('gamepadconnected', () => { if (!NAV.pad) { NAV.pad = true; applyScreen(); redraw(); } if (!PAD.raf) padPoll(); });
  document.addEventListener('keydown', e => {
    if (ui.boot) { e.preventDefault(); skipBoot(); return; }
    const tg = e.target as HTMLElement | null, tag = tg && tg.tagName;
    if (e.key === 'F1') { e.preventDefault(); if (ui.modal && ui.modal.kind === 'help') closeModal(); else openModal({ kind: 'help' }); return; }
    if (e.key === 'F2') { e.preventDefault(); openModal({ kind: 'options' }); return; }
    if (e.key === 'GoBack' || e.key === 'BrowserBack' || e.keyCode === 461 || e.keyCode === 10009 || (e.key === 'Backspace' && NAV.on && !isText(tg))) { if (goBack()) e.preventDefault(); return; }
    if (e.key === 'Enter' && tag === 'TR') { e.preventDefault(); (tg as HTMLElement).click(); return; }
    if (NAV.on && e.key === 'Enter' && tag === 'SELECT') { e.preventDefault(); activate(tg); return; }
    for (const fn of keys) if (fn(e)) { e.preventDefault(); return; }
    if (NAV.on && /^Arrow/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) { if (navKey(e.key.slice(5).toLowerCase())) e.preventDefault(); return; }
    if (e.key === 'Escape') {
      let done = false;
      if (ui.cards.length) { popCard(); done = true; }
      else if (ui.modal) { closeModal(); done = true; }
      else if (!G.S) done = goBack();
      else for (const fn of backs) if (fn()) { done = true; break; }
      if (done) e.preventDefault();
      return;
    }
    if (!G.S || ui.modal || ui.cards.length || G.S.over || e.ctrlKey || e.metaKey || e.altKey) return;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : '';
    if (HOT[k]) { e.preventDefault(); go(HOT[k]); }
  });
  (window as any).EWF_DEBUG = { state: () => G.S, render: redraw, go, pad: padPress, nav: NAV, ui };
}
