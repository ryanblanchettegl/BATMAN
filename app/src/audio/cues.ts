/* What sounds when (docs/plans/sound.md, Ryan's answers and picks of 23 October). The only file that knows the game:
   lines of the broadcast, the moments in a match picture and the crowd meter, each turned into sounds from the engine
   (./engine.ts). It only reads; it never touches the game.
   Step 2 of the plan is the broadcast, built here: a real arena mixed like television while the music plays on as
   normal. The office (piano) is the next step; until then presses make no sound.
   - The bell: a tubular bell, one strike to start a match and three quick ones at the end; it keeps ringing when
     time runs out.
   - The crowd: a stadium crowd for the whole broadcast that follows the crowd meter, sized by the building and the
     company (a big house on a big night sounds big, a few hundred people in a hall sound thin and close).
   - Entrances: a hero gets a pop. Villains (boos) and tweeners (a mixed reaction) wait on sounds still to be found.
   - A pin: the crowd shouts the count, "ONE! TWO! THR-" breaking off into the gasp on a kick-out, "ONE! TWO! THREE!"
     then the bell and the pop on a win; "EIGHT! NINE! TEN!" then the bell on a count-out (rendered voices,
     tools/sfx/build-voices.py; a big house or a small hall by the size of the room).
   - Voices (audition rounds 8 and 9): every commentary line is wah-wah talk, the muffled muted horn of the Charlie
     Brown adults but chill, play-by-play and colour each in their own voice; a wrestler's promo quote is the same
     sharper and louder, a woman, a man or a big man; a hero's line gets a cheer. Each fits the length of its line and
     varies a little each time.
   - The ring: every move lands (a body blow for strikes, a body fall on wood for slams), heavier and lower the bigger
     the people in the match.
   - At the fastest auto-play pace (Results) only the results play: bells, finishes, pops. */
import { G, pref } from '../store';
import { play, loop, Loop, levels, ready, load, speak, hush, SFX_ON } from './engine';

/* ---------- how big the room is ---------- */
/** 0 for a couple of hundred people in a hall, 1 for a stadium, a little more on a big night. */
let room = 0.6;
function roomOf(r: any): number {
  if (!r) return 0.6;
  const att = Math.max(50, +r.att || 0) || 2000;
  const k = (Math.log10(att) - 2.3) / 2.0;   // 200 people -> 0, 20,000 -> 1
  return Math.max(0, Math.min(1.15, k + (r.big ? 0.15 : 0)));
}
/** The current show's report, on the air or being replayed. */
function liveRep(): any { const S = G.S; return S && S.live ? S.live.st.rep : null; }

/* ---------- the ring ---------- */
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
let matchLb = 235;
function weightOf(seg: any) {
  const S = G.S; if (!S || !seg || !seg.ids) return 235;
  const lbs = seg.ids.map((id: number) => poundsOf(S.w[id])).sort((a: number, b: number) => b - a);
  return lbs.length ? (lbs[0] * 2 + lbs[lbs.length - 1]) / 3 : 235;
}
/** Heavier is lower and louder: 190 lb plays bright, 380 lb a good deal lower. */
const heft = (lb: number) => ({ rate: Math.max(0.78, Math.min(1.15, 1.12 - (lb - 190) / 190 * 0.34)), gain: Math.max(0.8, Math.min(1.25, 0.85 + (lb - 190) / 190 * 0.4)) });
const quick = () => pref.pace === 'results';   // Ryan: at the fastest pace only the results play
export const ring = {
  hit() { if (quick()) return; const h = heft(matchLb); play('hit', { rate: h.rate, gain: 0.7 * h.gain, gap: 0.08 }); },
  slam() { if (quick()) return; const h = heft(matchLb); play('slam', { rate: h.rate, gain: 0.85 * h.gain, gap: 0.12 }); }
};

/* ---------- the big moments ---------- */
let rung = '';   // the segment whose finish has already rung the bell, so the result does not ring it again
export const big = {
  /** The opening bell: one strike. */
  bell() { play('bell', { gain: 0.8, gap: 0.3, vary: 0.02 }); },
  /** The bell at the finish: three quick strikes. */
  bellEnd(n = 3, delay = 0) { for (let i = 0; i < n; i++) play('bell', { gain: 0.75, delay: delay + i * 0.3, gap: 0, vary: 0.02 }); },
  /** Time has run out: the bell keeps going. */
  bellTime() { big.bellEnd(8); },
  /** A pin that is kicked out of: "ONE! TWO! THR-" and the gasp. */
  nearFall() { crowd.shout(['one', 'two', 'thr']); crowd.gasp(1.95); },
  /** The pin that wins: "ONE! TWO! THREE!", the bell, the pop. */
  finish(cr: number, seg: string) { crowd.shout(['one', 'two', 'three']); big.bellEnd(3, 2.55); crowd.pop(Math.max(cr, 60), 2.6); rung = seg; },
  /** A count-out: "EIGHT! NINE! TEN!", the bell, the gasp. */
  countOut() { crowd.shout(['eight', 'nine', 'ten']); big.bellEnd(3, 2.4); crowd.gasp(2.5); },
  champion() { crowd.pop(100, 0.1); big.bellEnd(5); },
  /** The show goes on the air: the crowd comes up with it. */
  onAir() { crowd.pop(70, 0.3); }
};

/* ---------- the crowd ---------- */
let bed: Loop | null = null, heat = 50, wanted = false;
export const crowd = {
  /** The broadcast is on screen: the crowd starts (or waits for the recordings to be ready). */
  start() {
    wanted = true; if (!SFX_ON || !pref.snd) return;
    if (!ready()) { load().then(() => { if (wanted && !bed && ready()) crowd.start(); }); return; }
    if (bed) return; room = roomOf(liveRep()); bed = loop('bed'); crowd.level(heat);
  },
  stop() { wanted = false; hush(0.3); if (bed) bed.stop(2.5); bed = null; },
  /** The crowd meter (0 to 100): a cold building murmurs, a hot one roars. A small room stays thinner and closer. */
  level(v: number) {
    heat = v; if (!bed) { if (wanted && pref.snd && SFX_ON) crowd.start(); if (!bed) return; }
    const k = Math.max(0, Math.min(1, v / 100)), size = 0.45 + 0.55 * Math.min(1, room);
    bed.set((0.3 + 0.5 * k) * size); bed.tone(700 + (2200 + 3000 * k) * size);
  },
  /** A pop: the stadium surge, bigger in a bigger room and on a hotter moment (0 to 100). */
  pop(v = 70, delay = 0) {
    if (v < 35) return;
    const size = 0.4 + 0.6 * Math.min(1, room);
    play('pop', { gain: (0.35 + (v - 35) / 65 * 0.6) * size, delay, gap: 0.8, vary: 0.04, rate: 1 + (1 - Math.min(1, room)) * 0.04 });
  },
  /** The crowd shouting the count with the referee, a word a second: a big house, or a small hall. */
  shout(words: string[], every = 0.95) { const sz = room < 0.4 ? 'small' : 'big'; words.forEach((w, i) => play('cnt_' + sz + '_' + w, { gain: 0.8, delay: i * every, gap: 0, vary: 0.02 })); },
  /** The near-miss gasp, for a kick-out, a cheap finish, a count-out. */
  gasp(delay = 0) { play('gasp', { gain: 0.75 * (0.5 + 0.5 * Math.min(1, room)), delay, gap: 0.8, vary: 0.03 }); }
};

/* ---------- the broadcast: a line of commentary, a moment in a picture ---------- */
const COUNT = /One, two, three|hree count|gets the three|and that is it|Cover, and that is it/i;
const KICK = /kicks? out|KICKS OUT/;
const SLAM = /slam|powerbomb|suplex|driver|piledriver|spear|spine|bomb|crash|through the table|off the top|from the top|dive|flies|splash|leg drop|elbow drop|DDT|plancha|moonsault|bodyslam|takedown|throws/i;
const HIT = /chop|punch|kick|clothesline|forearm|elbow|lariat|knee|slap|strike|superkick|headbutt|stomp|fist|right hand|left hand/i;
/** How long a line would take to say, in seconds: about five and a half syllables a second. */
function secsOf(x: string): number { return Math.max(0.8, Math.min(7, (String(x).toLowerCase().match(/[aeiouy]+/g) || []).length / 5.5)); }
/** Which promo voice a wrestler speaks in: a woman, a big man (270 lb or more), or a man. */
function micVoice(w: any): string { return !w ? 'mic_man' : w.g === 'F' ? 'mic_woman' : poundsOf(w) >= 270 ? 'mic_big' : 'mic_man'; }
/** Who comes out on an entrance line: a hero gets a pop; a villain or a tweener waits on boos and a mixed reaction. */
function entrance(nb: any, sg: any) {
  if (quick()) return;
  const S = G.S, ids: number[] = (nb.side || []).slice(); if (!S || !ids.length) return;
  const ws = ids.map(id => S.w[id]).filter(Boolean); if (!ws.length) return;
  const lead = ws.reduce((a: any, b: any) => ((b.ovr || 0) > (a.ovr || 0) ? b : a));
  if (lead.align === 'F' && !lead.twn) crowd.pop(Math.max(45, Math.min(95, (lead.ovr || 50) + 10)));
  void sg;
}
/** A name for a segment of a show, to know the bell for its finish has rung. */
function segKey(sg: any): string { const r = liveRep(); return (r ? r.week + ':' + r.id : '') + ':' + (sg.label || '') + ':' + (sg.mins || ''); }
/** The broadcast moved to line `nb` of segment `sg` (or past its last line when nb is undefined). `first` is the line
    the opening bell rings on. `pics`: a picture is playing and gives the ring sounds from its keyframes. */
export function beat(sg: any, nb: any, first: boolean, pics: boolean) {
  if (!sg || !SFX_ON) return;
  matchLb = weightOf(sg); const lr = liveRep(); if (lr) room = roomOf(lr);
  const isMatch = sg.k === 'match';
  if (!nb) {   // past the last line: the result
    if (!isMatch) return;
    if (sg.fin === 'co') { big.countOut(); return; }
    if (sg.fin === 'dq') { big.bellEnd(); crowd.gasp(0.3); return; }
    if (sg.win == null) { big.bellTime(); crowd.gasp(0.6); return; }
    if (rung === segKey(sg)) return;   // the count already rang the bell and brought the pop
    big.bellEnd(); if (sg.fin === 'cheap' || sg.fin === 'interf') crowd.gasp(0.3); else crowd.pop(sg.cr, 0.4);
    return;
  }
  const x = String(nb.x || '');
  // the voices: commentators on every line, a wrestler on the microphone; a hero's line gets a cheer
  if (nb.t === 'pbp' || nb.t === 'col') speak(nb.t === 'pbp' ? 'wah_pbp' : 'wah_col', secsOf(x));
  else if (nb.t === 'mic') { const S = G.S, w = S && nb.w != null ? S.w[nb.w] : null, d = secsOf(x); speak(micVoice(w), d, 1.15); if (w && w.align === 'F' && !w.twn) crowd.pop(50, d); }
  if (nb.h === 2 || /NEW .*champion/i.test(x)) { big.champion(); return; }
  if (isMatch && first) { big.bell(); return; }
  if (nb.t === 'ent') { entrance(nb, sg); return; }
  if (nb.h && KICK.test(x)) { big.nearFall(); return; }
  if (nb.h && COUNT.test(x)) { big.finish(sg.cr || 70, segKey(sg)); return; }
  if (/time limit|out of time/i.test(x)) { big.bellTime(); return; }
  if (isMatch && !pics && nb.t === 'pbp') {   // with no picture the line gives the ring sounds
    if (SLAM.test(x)) ring.slam(); else if (HIT.test(x)) ring.hit();
  }
}
/** A match picture reached a keyframe: the burst on it names what happened, and every move lands. */
export function sceneKey(sc: any, key: any) {
  if (!SFX_ON || !pref.snd || !key) return;
  const b = (key.props || []).find((q: any) => q.k === 'burst'), w = b ? String(b.txt || '').toUpperCase() : '';
  if (!w) return;
  if (/^ONE!|^TWO!|^THREE!|KICK OUT|NEW CHAMPION|^NEW!|^BOO!|LOCK-UP|^VS/.test(w)) return;   // the line of commentary gives these
  if (/POW|WHAM|BAM|STOMP|CHOP/.test(w)) return ring.hit();
  if (/ring/.test(sc.set || '') || sc.when === 'move' || /CRASH|SPIKED|SPEAR|SLAM|BOOM|FLYING/.test(w)) ring.slam();
}
/** Options changed the volume, the crowd level or Sound itself. */
export function prefsChanged() { levels(); if (!pref.snd) crowd.stop(); else if (wanted) crowd.start(); }
