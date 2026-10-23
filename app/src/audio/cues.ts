/* What sounds when (Ryan, 23 October). The only file that knows the game: presses on the page, lines of the broadcast,
   the moments in a match picture and the crowd meter, each turned into sounds from the engine (./engine.ts). It only
   reads; it never touches the game. Four parts:
   1. The interface: a card snapped under the finger for every press, a paper tick when something is pointed at,
      paper turned when a pop-up opens, a stamp for a good result and a buzz for a refused one.
   2. The ring: slaps, chops, bodies on the boards, the turnbuckle, the referee's hand on the mat, heavier and lower
      the bigger the people in the match.
   3. The big moments: the bell (one ring to start, a run of rings at the end, a bell that keeps going when time
      runs out), the tension under a near fall, the count, the pop for a new champion.
   4. The crowd: a murmur for the whole broadcast that follows the crowd meter, with pops, an "ooh" and groans. */
import { G, pref } from '../store';
import { wake, play, loop, Loop, duck, riser, levels, ready, load, SFX_ON } from './engine';

/* ---------- 1. the interface ---------- */
let lastPress = 0, lastHover: Element | null = null, lastKey = 0;
const PRESSABLE = 'button, select, [role="button"], input[type="checkbox"], input[type="radio"], summary';
function pressSound(el: Element) {
  const c = el.className && typeof el.className === 'string' ? el.className : '';
  if (el.tagName === 'SELECT') return play('ui_scroll', { gain: 0.6, gap: 0.06 });
  if (el.getAttribute('aria-pressed') != null || /\btoggle\b/.test(c)) return play('ui_toggle', { gain: 0.8, gap: 0.05 });
  if (/\bgo\b/.test(c) || el.getAttribute('data-t') === 'advance') return play('ui_go', { gain: 0.9, rate: 1.05, gap: 0.05 });
  if (/\bdanger\b/.test(c)) return play('ui_go', { gain: 0.9, rate: 0.8, gap: 0.05 });
  return play('ui_press', { gain: /\bsm\b|\bless\b/.test(c) ? 0.55 : 0.8, gap: 0.04 });
}
function onPointerDown(e: PointerEvent) {
  wake(); const el = (e.target as Element).closest && (e.target as Element).closest(PRESSABLE);
  if (!el || (el as HTMLButtonElement).disabled) return;
  lastPress = Date.now(); pressSound(el);
}
function onKeyDown(e: KeyboardEvent) {
  wake();
  if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
  const el = document.activeElement; if (!el || !el.matches || !el.matches(PRESSABLE)) return;
  lastKey = Date.now(); pressSound(el);
}
/** A press from a gamepad or remote arrives as a click with no pointer and no key before it. */
function onClick(e: MouseEvent) {
  if (Date.now() - lastPress < 800 || Date.now() - lastKey < 800) return;
  const el = (e.target as Element).closest && (e.target as Element).closest(PRESSABLE); if (el) pressSound(el);
}
function onOver(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return;   // a finger has no hover
  const el = (e.target as Element).closest && (e.target as Element).closest(PRESSABLE);
  if (!el || el === lastHover || (el as HTMLButtonElement).disabled) { if (!el) lastHover = null; return; }
  lastHover = el; play('ui_hover', { gain: 0.25, gap: 0.06, vary: 0.1 });
}
/** Keys and pads move the highlight: the same tick as pointing. */
function onFocus(e: FocusEvent) {
  if (Date.now() - lastPress < 300) return;
  const el = e.target as Element; if (el && el.matches && el.matches(PRESSABLE)) play('ui_hover', { gain: 0.22, gap: 0.06, vary: 0.1 });
}
export function uiSetup() {
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerover', onOver, true);
  document.addEventListener('focusin', onFocus, true);
}

/* ---------- 2. the ring ---------- */
const ARCH_LB: Record<string, number> = { Cruiserweight: 190, Technical: 225, Brawler: 250, Powerhouse: 285, Heavyweight: 270, Super_Heavyweight: 380, Giant: 400 };
/** How heavy a wrestler is, in pounds: from their Create a Player file, else from their traits. */
export function poundsOf(w: any): number {
  if (!w) return 235;
  const pa = (w.look && w.look.physical_attributes) || {};
  if (pa.weight_lbs) return +pa.weight_lbs;
  if (pa.body_archetype && ARCH_LB[pa.body_archetype]) return ARCH_LB[pa.body_archetype];
  const tr = w.tr || w.traits || [];
  return Array.isArray(tr) && tr.indexOf('giant') >= 0 ? 340 : 235;
}
/** The weight of the match on screen: the heavier side counts most, as it is the one that lands. */
let matchLb = 235;
function weightOf(seg: any) {
  const S = G.S; if (!S || !seg || !seg.ids) return 235;
  const lbs = seg.ids.map((id: number) => poundsOf(S.w[id])).sort((a: number, b: number) => b - a);
  return lbs.length ? (lbs[0] * 2 + lbs[lbs.length - 1]) / 3 : 235;
}
/** Heavier is lower and louder: 190 lb plays bright, 380 lb a good deal lower. */
const heft = (lb: number) => ({ rate: Math.max(0.72, Math.min(1.2, 1.16 - (lb - 190) / 190 * 0.42)), gain: Math.max(0.75, Math.min(1.3, 0.8 + (lb - 190) / 190 * 0.5)) });
export const ring = {
  hit(big = false) { const h = heft(matchLb); play(big ? 'hit_heavy' : 'hit', { rate: h.rate, gain: 0.8 * h.gain, gap: 0.05 }); },
  /** A body on the boards: the soft thud and the wood under the canvas, together. */
  slam(big = false) { const h = heft(matchLb + (big ? 40 : 0)); play('body', { rate: h.rate, gain: 1.1 * h.gain, gap: 0.08 }); play('boards', { rate: h.rate * 0.9, gain: 0.7 * h.gain, gap: 0.08, delay: 0.012 }); if (big) play('mat', { rate: 0.8, gain: 0.5, delay: 0.09, gap: 0.08 }); },
  corner() { const h = heft(matchLb); play('steel', { rate: 0.85 * h.rate, gain: 0.7, gap: 0.08 }); play('body', { rate: h.rate, gain: 0.8 * h.gain, delay: 0.01, gap: 0.08 }); },
  grab() { play('grab', { gain: 0.7, gap: 0.1 }); },
  /** The referee's hand on the mat, `n` times, a count apart (the last one may be cut by a kick-out). */
  count(n = 3, every = 0.55) { for (let i = 0; i < n; i++) play('mat', { gain: 0.95, rate: 1.05, delay: i * every, gap: 0, vary: 0.03 }); },
  step() { play('step', { gain: 0.4, gap: 0.12 }); }
};

/* ---------- 3. the big moments ---------- */
const BELL_RATE = 1.9;   // Kenney's heavy bell, raised to the bright ring of a timekeeper's bell
export const big = {
  /** The opening bell: one ring. */
  bell() { duck(0.6, 0.8); play('bell', { rate: BELL_RATE, gain: 0.85, gap: 0.3, vary: 0.02 }); },
  /** The bell at the finish: a run of quick rings. */
  bellEnd(n = 4) { for (let i = 0; i < n; i++) play('bell', { rate: BELL_RATE, gain: 0.8, delay: i * 0.17, gap: 0, vary: 0.02 }); },
  /** Time has run out: the bell keeps going. */
  bellTime() { big.bellEnd(9); },
  nearFall() { duck(0.5, 1.6); riser(1.15); ring.count(2, 0.5); crowd.ooh(1.0, 1.25); },
  finish(cr: number) { ring.count(3, 0.5); crowd.pop(cr, 1.45); },
  champion() { duck(0.3, 0.6); crowd.pop(100, 0.2); big.bellEnd(6); },
  /** The show goes on the air: the crowd comes up with it. */
  onAir() { crowd.pop(75, 0); }
};

/* ---------- 4. the crowd ---------- */
let bed: Loop | null = null, hot: Loop | null = null, heat = 50, wanted = false;
export const crowd = {
  /** The broadcast is on screen: the murmur starts (or waits for the recordings to be ready). */
  start() { wanted = true; if (!SFX_ON || !pref.snd) return; if (!ready()) { load().then(() => { if (wanted && !bed) crowd.start(); }); return; } if (bed) return; bed = loop('crowd_bed'); hot = loop('crowd_hot'); crowd.level(heat); },
  stop() { wanted = false; if (bed) bed.stop(1.5); if (hot) hot.stop(1.5); bed = hot = null; },
  /** The crowd meter (0 to 100): a cold building hums, a hot one claps and shouts. */
  level(v: number) {
    heat = v; if (!bed || !hot) return;
    const k = Math.max(0, Math.min(1, v / 100));
    bed.set(0.35 + 0.45 * k); bed.tone(900 + 3200 * k);
    hot.set(k < 0.55 ? 0 : (k - 0.55) / 0.45 * 0.8); hot.tone(2000 + 4000 * k);
  },
  /** A pop: bigger and longer the hotter the moment (0 to 100). */
  pop(v = 70, delay = 0) { if (v < 35) return; play(v >= 85 ? 'pop_big' : 'pop', { gain: 0.45 + (v - 35) / 65 * 0.65, delay, gap: 0.6, vary: 0.04 }); },
  ooh(gain = 0.9, delay = 0) { play('ooh', { gain, delay, gap: 0.5, vary: 0.05 }); },
  /** Groans and jeers: the "ooh" lowered, for a cheap finish or a count-out. */
  groan(delay = 0) { play('ooh', { gain: 0.85, rate: 0.72, delay, gap: 0.5, vary: 0.03 }); }
};

/* ---------- the broadcast: a line of commentary, a moment in a picture ---------- */
const COUNT = /One, two, three|hree count|gets the three|and that is it|Cover, and that is it/i;
const KICK = /kicks? out|KICKS OUT/;
const SLAM = /slam|powerbomb|suplex|driver|piledriver|spear|spine|bomb|crash|through the table|off the top|from the top|dive|flies|splash|leg drop|elbow drop|DDT|plancha|moonsault/i;
const HIT = /chop|punch|kick|clothesline|forearm|elbow|lariat|knee|slap|strike|superkick|headbutt|stomp/i;
const CORNER = /corner|turnbuckle|buckle/i;
const SUB = /locks in|submission|taps|hold|lock|grapple|lock-up|headlock/i;
/** The broadcast moved to line `nb` of segment `sg` (or past its last line when nb is undefined). `pics`: a picture
    is playing and gives the ring sounds itself, so the line only gives the big moments. */
export function beat(sg: any, nb: any, first: boolean, pics: boolean) {
  if (!sg) return;
  matchLb = weightOf(sg);
  const isMatch = sg.k === 'match';
  if (!nb) {   // past the last line: the result
    if (!isMatch) { crowd.pop(sg.ov || 50); return; }
    if (sg.fin === 'dq' || sg.fin === 'co') { big.bellEnd(4); crowd.groan(0.3); return; }
    if (sg.win == null) { big.bellTime(); crowd.groan(0.5); return; }
    big.bellEnd(); if (sg.fin === 'cheap' || sg.fin === 'interf') crowd.groan(0.3); else crowd.pop(sg.cr, 0.25);
    return;
  }
  const x = String(nb.x || '');
  if (nb.h === 2 || /NEW .*champion/i.test(x)) { big.champion(); return; }
  if (isMatch && first) { big.bell(); return; }
  if (nb.t === 'ent') { crowd.pop(Math.min(90, (sg.cr || 60) + 5)); return; }
  if (nb.h && KICK.test(x)) { big.nearFall(); return; }
  if (nb.h && COUNT.test(x)) { big.finish(sg.cr || 70); return; }
  if (/time limit|out of time/i.test(x)) { big.bellTime(); return; }
  if (nb.h) { crowd.ooh(0.8); return; }
  if (isMatch && !pics && (nb.t === 'pbp')) {   // with no picture the line gives the ring sounds
    if (SLAM.test(x)) ring.slam(/top|bomb|driver|table/i.test(x)); else if (CORNER.test(x)) ring.corner(); else if (HIT.test(x)) ring.hit(/super|lariat|clothesline/i.test(x)); else if (SUB.test(x)) ring.grab();
  }
  if (nb.t === 'col' && /chant/i.test(x)) crowd.pop(Math.max(60, sg.cr || 60));
}
/** A match picture reached keyframe `i` of scene `sc`: the burst on it names what happened. */
export function sceneKey(sc: any, key: any) {
  if (!pref.snd || !key) return;
  const b = (key.props || []).find((q: any) => q.k === 'burst'), w = b ? String(b.txt || '').toUpperCase() : '';
  if (!w) { if (key.t > 0 && /ring/.test(sc.set || '') && (sc.when === 'move' || /^move_/.test(sc.id || ''))) ring.grab(); return; }
  if (/^ONE!|^TWO!|^THREE!/.test(w)) return;   // the count comes from the line of commentary, in time with it
  if (/KICK OUT/.test(w)) return crowd.ooh(1);
  if (/NEW CHAMPION|^NEW!/.test(w)) return crowd.pop(100);
  if (/^BOO!/.test(w)) return crowd.groan();
  if (/LOCK-UP/.test(w)) return ring.grab();
  if (/CRASH|SPIKED|SPEAR|SLAM|BOOM|FLYING/.test(w)) return /corner/.test(sc.set || '') ? ring.corner() : ring.slam(/SPIKED|FLYING|BOOM/.test(w));
  if (/POW|WHAM|BAM|STOMP/.test(w)) return /corner/.test(sc.set || '') ? ring.corner() : ring.hit(/WHAM|BAM/.test(w));
  if (/ring/.test(sc.set || '') || sc.when === 'move') ring.slam(true);   // a move's own name on the burst: it lands
}
/** Options changed the volume or the crowd level. */
export function prefsChanged() { levels(); if (!pref.snd) crowd.stop(); }
