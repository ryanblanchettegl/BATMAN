/* One store: the game state (owned by the engine), the view state (owned by the interface), preferences and saving. */
import { E, GameState } from './engine';
import { useBackdropSource } from './kit/backdrop';

export const KEY = 'ewf9000-save-4', UKEY = 'ewf9000-universes', PKEY = 'gorilla-position-prefs';
export const VER = '0.89';

/* ---------- preferences ---------- */
export interface Prefs { snd: boolean; type: boolean; crt: boolean; boot: boolean; letter: boolean; tut: boolean; screen: 'auto' | 'desk' | 'tablet' | 'tv'; zoom: number; speed: number; auto: boolean; pace: 'tv' | 'full' | 'quick' | 'results'; pv?: number; motion: 'auto' | 'reduce' | 'full'; fxvol: number; uni: string ; u2?: boolean; pics: boolean }
function readPrefs(): Prefs {
  let o: any = {};
  try { o = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { /* storage can be blocked */ }
  return { snd: o.snd !== false, type: o.type !== false, crt: false, boot: o.boot !== false, letter: o.letter !== false, tut: o.tut !== false, screen: o.screen || 'auto', zoom: +o.zoom || 1, speed: +o.speed || 1, auto: o.auto !== false, pace: o.pv === 2 && (o.pace === 'full' || o.pace === 'quick' || o.pace === 'results' || o.pace === 'tv') ? o.pace : 'tv', pv: 2, fxvol: +o.fxvol || 1, motion: o.motion === 'reduce' || o.motion === 'full' ? o.motion : 'auto', uni: o.u2 ? (o.uni || 'parody') : (!o.uni || o.uni === 'public_domain' ? 'parody' : o.uni), u2: true, pics: o.pics !== false };
}
export const pref: Prefs = readPrefs();
/** Reduced motion: switched on in Options, or by the system when Options says Auto. Stops the typewriter and the blinking cursor. */
export function reduceMotion(): boolean { let sys = false; try { sys = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ } return pref.motion === 'reduce' || (pref.motion === 'auto' && sys); }
export function savePrefs() { try { localStorage.setItem(PKEY, JSON.stringify(pref)); } catch (e) { /* ignore */ } }

/* ---------- game state ---------- */
/** The live game. `G.S` is null on the start screens. Only the engine changes what is inside it. */
export const G: { S: GameState | null } = { S: null };
// scenes in a game stand in front of the backdrops its world carries
useBackdropSource(() => G.S ? E.worldBackdrops(G.S) : []);
export function me() { return G.S.promos[G.S.player]; }
/* Saves live in IndexedDB (a career outgrows localStorage). A copy stays in localStorage while it fits, so a reload
   straight after a save, before the database has finished writing, still finds it; each copy carries a counter and the
   newer one wins at start-up. An old save found only in localStorage is moved into the database. */
const IDB = 'ewf-wm', IST = 'saves', NKEY = KEY + '-n';
let cache: string | null = null, cacheN = 0, db: IDBDatabase | null = null;
function idbOpen(): Promise<IDBDatabase | null> {
  return new Promise(res => { try { const r = indexedDB.open(IDB, 1); r.onupgradeneeded = () => { r.result.createObjectStore(IST); }; r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
}
function idbGet(k: string): Promise<any> { return new Promise(res => { if (!db) return res(null); try { const q = db.transaction(IST).objectStore(IST).get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }); }
function idbPut(k: string, v: any) { if (!db) return; try { db.transaction(IST, 'readwrite').objectStore(IST).put(v, k); } catch (e) { /* ignore */ } }
function idbDel(k: string) { if (!db) return; try { db.transaction(IST, 'readwrite').objectStore(IST).delete(k); } catch (e) { /* ignore */ } }
/** Called once before the first screen: opens the database and picks the newest save. */
export async function initSaves() {
  db = await idbOpen();
  const d = await idbGet(KEY);
  let lt: string | null = null, ln = 0; try { lt = localStorage.getItem(KEY); ln = +(localStorage.getItem(NKEY) || '0') || 0; } catch (e) { /* ignore */ }
  // every save writes both copies alike, so a localStorage copy that differs is the newer one (the database had not
  // finished writing, or it came from an older version of the game); a missing one means it outgrew localStorage
  if (lt && (!d || lt !== d.text)) { cache = lt; cacheN = Math.max(ln, d ? d.n || 0 : 0) + 1; idbPut(KEY, { n: cacheN, text: lt }); }
  else if (d && d.text) { cache = d.text; cacheN = d.n || 0; }
}
export function save(): boolean {
  try { const text = JSON.stringify(G.S); cache = text; cacheN++; idbPut(KEY, { n: cacheN, text });
    try { localStorage.setItem(KEY, text); localStorage.setItem(NKEY, String(cacheN)); } catch (e) { try { localStorage.removeItem(KEY); } catch (e2) { /* full: the database holds it */ } }
    return !!db || true; } catch (e) { return false; }
}
export function loadSave(): GameState | null {
  try { const t = cache; if (!t) return null; const o = JSON.parse(t); return o && o.v === 4 && o.promos ? o : null; } catch (e) { return null; }
}
export function clearSave() { cache = null; idbDel(KEY); try { localStorage.removeItem(KEY); localStorage.removeItem(NKEY); } catch (e) { /* ignore */ } }
/** The save as text, for a backup file. */
export function saveText(): string | null { return G.S ? JSON.stringify(G.S) : cache; }

/* ---------- universes: the built-in default plus anything the player imported ---------- */
export const UNIS: Record<string, any> = (() => { try { return JSON.parse(localStorage.getItem(UKEY) || '{}') || {}; } catch (e) { return {}; } })();
export function saveUnis(): boolean { try { localStorage.setItem(UKEY, JSON.stringify(UNIS)); return true; } catch (e) { return false; } }
/** The worlds that come with the game. The parody world is the default (Ryan, 16 October); the public-domain world stays. */
export const DEFAULT_UNI = 'parody';
export const BUILT_IN: Record<string, () => any> = { parody: () => (globalThis as any).GP_UNIVERSE_PARODY || (globalThis as any).GP_UNIVERSE, public_domain: () => (globalThis as any).GP_UNIVERSE };
export function isBuiltIn(id?: string): boolean { return !!id && !!BUILT_IN[id]; }
export function builtInUniverse(id?: string): any { return (BUILT_IN[id || DEFAULT_UNI] || BUILT_IN[DEFAULT_UNI])(); }
/** Companies the player has left out of the next new game, and whether their wrestlers leave the world too.
    It lasts until another universe is chosen or a game is started and abandoned. */
export const cut: { out: string[]; gone: boolean } = { out: [], gone: false };
/** The universe as stored, before any companies are left out. */
export function basePackage(id?: string): any { const u = id || pref.uni || DEFAULT_UNI; return !isBuiltIn(u) && UNIS[u] ? UNIS[u] : builtInUniverse(u); }
/** Make a universe the one new games start from. Returns the validation report. Falls back to the built-in one if it does not load. `keepCut` keeps the companies left out. */
export function setUniverse(id: string, keepCut?: boolean): any {
  if (!keepCut) { cut.out = []; cut.gone = false; }
  let pkg = !isBuiltIn(id) && UNIS[id] ? UNIS[id] : builtInUniverse(isBuiltIn(id) ? id : DEFAULT_UNI);
  let v = E.useUniverse(cut.out.length ? E.edWithout(pkg, cut.out, cut.gone) : pkg);
  if (!v.ok && cut.out.length) { cut.out = []; cut.gone = false; v = E.useUniverse(pkg); }
  if (!v.ok) { v = E.useUniverse(builtInUniverse()); id = DEFAULT_UNI; }
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

/** Pop-ups a result goes back to: a page of choices stays open while the player works through it. */
const BACK_TO: Record<string, 1> = { mng: 1, plot: 1, apact: 1 };
export function openModal(m: Modal) { const cur = ui.modal; if (cur && ((m.kind === 'info' && BACK_TO[cur.kind]) || (m.kind === 'clock' && cur.kind === 'deskmore'))) m.back = cur; ui.modal = m; snd('open'); redraw(); }
export function closeModal() { const back = ui.modal && ui.modal.back; if (ui.modal) snd('close'); ui.modal = back || null; redraw(); }
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
