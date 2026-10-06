/* One store: the game state (owned by the engine), the view state (owned by the interface), preferences and saving. */
import { E, GameState } from './engine';

export const KEY = 'ewf9000-save-4', UKEY = 'ewf9000-universes', PKEY = 'gorilla-position-prefs';
export const VER = '0.31';

/* ---------- preferences ---------- */
export interface Prefs { snd: boolean; type: boolean; crt: boolean; boot: boolean; screen: 'auto' | 'desk' | 'tablet' | 'tv'; zoom: number; speed: number; motion: 'auto' | 'reduce' | 'full'; fxvol: number; uni: string }
function readPrefs(): Prefs {
  let o: any = {};
  try { o = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { /* storage can be blocked */ }
  return { snd: o.snd !== false, type: o.type !== false, crt: o.crt !== false, boot: o.boot !== false, screen: o.screen || 'auto', zoom: +o.zoom || 1, speed: +o.speed || 1, fxvol: +o.fxvol || 1, motion: o.motion === 'reduce' || o.motion === 'full' ? o.motion : 'auto', uni: o.uni || 'public_domain' };
}
export const pref: Prefs = readPrefs();
/** Reduced motion: switched on in Options, or by the system when Options says Auto. Stops the typewriter and the blinking cursor. */
export function reduceMotion(): boolean { let sys = false; try { sys = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ } return pref.motion === 'reduce' || (pref.motion === 'auto' && sys); }
export function savePrefs() { try { localStorage.setItem(PKEY, JSON.stringify(pref)); } catch (e) { /* ignore */ } }

/* ---------- game state ---------- */
/** The live game. `G.S` is null on the start screens. Only the engine changes what is inside it. */
export const G: { S: GameState | null } = { S: null };
export function me() { return G.S.promos[G.S.player]; }
export function save(): boolean { try { localStorage.setItem(KEY, JSON.stringify(G.S)); return true; } catch (e) { return false; } }
export function loadSave(): GameState | null {
  try { const t = localStorage.getItem(KEY); if (!t) return null; const o = JSON.parse(t); return o && o.v === 4 && o.promos ? o : null; } catch (e) { return null; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

/* ---------- universes: the built-in default plus anything the player imported ---------- */
export const UNIS: Record<string, any> = (() => { try { return JSON.parse(localStorage.getItem(UKEY) || '{}') || {}; } catch (e) { return {}; } })();
export function saveUnis(): boolean { try { localStorage.setItem(UKEY, JSON.stringify(UNIS)); return true; } catch (e) { return false; } }
export function builtInUniverse(): any { return (globalThis as any).GP_UNIVERSE; }
/** Companies the player has left out of the next new game, and whether their wrestlers leave the world too.
    It lasts until another universe is chosen or a game is started and abandoned. */
export const cut: { out: string[]; gone: boolean } = { out: [], gone: false };
/** The universe as stored, before any companies are left out. */
export function basePackage(id?: string): any { const u = id || pref.uni; return u && u !== 'public_domain' && UNIS[u] ? UNIS[u] : builtInUniverse(); }
/** Make a universe the one new games start from. Returns the validation report. Falls back to the built-in one if it does not load. `keepCut` keeps the companies left out. */
export function setUniverse(id: string, keepCut?: boolean): any {
  if (!keepCut) { cut.out = []; cut.gone = false; }
  let pkg = id !== 'public_domain' && UNIS[id] ? UNIS[id] : builtInUniverse();
  let v = E.useUniverse(cut.out.length ? E.edWithout(pkg, cut.out, cut.gone) : pkg);
  if (!v.ok && cut.out.length) { cut.out = []; cut.gone = false; v = E.useUniverse(pkg); }
  if (!v.ok) { v = E.useUniverse(builtInUniverse()); id = 'public_domain'; }
  pref.uni = id; savePrefs();
  return v;
}

/* ---------- view state ---------- */
export interface Flash { text: string; err?: boolean }
export interface Modal { kind: string; [k: string]: any }
/** A profile pop-up: a wrestler (`id` is their number), a tag team (its id) or a title (`pid` promotion, `id` title id). */
export interface Card { k: 'w' | 'team' | 'title' | 'promo' | 'tree'; id: number | string; pid?: string }
export interface Ui {
  boot: { step: number } | null;
  /** start screens: 'title' or 'select'. `setup` is set while the First day or Create a federation screen is open. */
  scr: 'title' | 'select' | 'editor';
  setup: null | { pid: string; name: string; diff: string; fed: any; dpart?: any; iron?: boolean };
  /** highlighted row of the start menus */
  mi: number;
  /** the page showing inside the game. See nav.ts for the list. */
  page: string;
  modal: Modal | null;
  /** the stack of profile pop-ups (wrestler, tag team, title). The last one is showing; Back steps out one at a time. */
  cards: Card[];
  flash: Flash | null;
  /** 'new' while the "start over?" bar is showing; screens may use their own strings */
  confirm: string | null;
  /** per-screen view state. Use slice() to read and create. Cleared on a new game. */
  slices: Record<string, any>;
}
const resetHooks: (() => void)[] = [];
/** Run something whenever the view state is wiped (new game, continue, back to the title). */
export function onReset(fn: () => void) { resetHooks.push(fn); }
function freshUi(): Ui { return { boot: null, scr: 'title', setup: null, mi: 0, page: 'desk', modal: null, cards: [], flash: null, confirm: null, slices: {} }; }
export const ui: Ui = freshUi();
export function resetUi(keep?: Partial<Ui>) { const f = freshUi(); Object.keys(f).forEach(k => { (ui as any)[k] = (f as any)[k]; }); if (keep) Object.assign(ui, keep); resetHooks.forEach(fn => fn()); }
/** Per-screen view state that survives redraws, e.g. `const st = slice('roster', () => ({ sel: null, q: '' }))`. */
export function slice<T>(key: string, init: () => T): T { if (!ui.slices[key]) ui.slices[key] = init(); return ui.slices[key]; }

/* ---------- redraw ---------- */
let draw: () => void = () => {};
export function onRedraw(fn: () => void) { draw = fn; }
/** Ask the root to draw again. Call after changing `ui`; `act()` does it for you. */
export function redraw() { draw(); }

/** Show a one-line result above the page. */
/** Sound is plugged in by sfx.ts, so the store does not need to import it. */
export const hooks: { sound?: (k: string) => void } = {};
const snd = (k: string) => { if (hooks.sound) hooks.sound(k); };
export function say(text: string | null | undefined, opt?: { err?: boolean }) { if (text) { ui.flash = { text, err: !!(opt && opt.err) }; if (opt) snd(opt.err ? 'fail' : 'win'); } }

let saveWarned = false;
/** Run something the player did: clears the last message, runs it, saves, redraws. Use for every click that touches the game. */
export function act<T>(fn: () => T): T {
  ui.flash = null;
  const r = fn();
  if (G.S && !save() && !saveWarned) { saveWarned = true; ui.flash = { text: 'Your browser would not store the save, so this game will be lost when you close the page. You can keep playing.', err: true }; }
  redraw();
  return r;
}
/** Change view state only (no save): tabs, filters, opening a panel. Clears the last message, like act(). */
export function view(fn: () => void) { ui.flash = null; fn(); redraw(); }

export function openModal(m: Modal) { ui.modal = m; snd('open'); redraw(); }
export function closeModal() { if (ui.modal) snd('close'); ui.modal = null; redraw(); }
/** Open a profile pop-up on top of whatever is showing. Opening the one already on top does nothing. */
export function openCard(c: Card) {
  const top = ui.cards[ui.cards.length - 1];
  if (top && top.k === c.k && top.id === c.id && top.pid === c.pid) return;
  if (ui.cards.length >= 12) ui.cards.shift();
  ui.cards.push(c); snd('open'); redraw();
}
/** Step back to the pop-up underneath, or close the last one. */
export function popCard() { ui.cards.pop(); snd('close'); redraw(); }
export function closeCards() { if (ui.cards.length) snd('close'); ui.cards = []; redraw(); }

/* ---------- formatting ---------- */
export function cash(n: number): string { const a = Math.abs(n), s = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M' : (a >= 1e3 ? Math.round(a / 1e3) + 'K' : String(Math.round(a))); return (n < 0 ? '−$' : '$') + s; }
export function full(n: number): string { return (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US'); }
export function plural(n: number, one: string, many?: string) { return n === 1 ? one : (many || one + 's'); }

/* Steam hook: the desktop wrapper exposes window.gpSteam.unlock(apiName). In a browser this does nothing. */
export const PLATFORM = { unlock(id: string) { try { const s = (globalThis as any).gpSteam; if (s && typeof s.unlock === 'function') s.unlock(id); } catch (e) { /* ignore */ } } };
