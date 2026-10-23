/* The sound engine (Ryan, 23 October: real recorded sound, external assets allowed). One AudioContext; every sound
   goes to one of four groups (the interface, the ring, the big moments, the crowd), then the effects volume, then a
   limiter, so nothing clips however much is going on. The recordings are in the page (app/addons/sfx-bank.js, written
   by tools/sfx/build-sfx.py) and are decoded once, the first time sound is wanted, so a sound plays the moment it is
   asked for. Each group holds a few voices at most and the oldest gives way; a sound asked for again too soon is
   skipped, so fast clicking never stutters. Sound never reads or writes the game: it cannot change how a game plays. */
import { pref } from '../store';

/** On (Ryan, 23 October). It was switched off after the first try ("It sounds terrible") and comes back with only the
    sounds Ryan picked by ear (docs/plans/sound.md). False makes the game silent apart from the soundtrack. */
export const SFX_ON = true;

export type Group = 'ui' | 'ring' | 'big' | 'crowd';
const VOICES: Record<Group, number> = { ui: 4, ring: 6, big: 3, crowd: 4 };
const LEVEL: Record<Group, number> = { ui: 0.55, ring: 0.9, big: 0.8, crowd: 0.75 };

let AC: AudioContext | null = null, master: GainNode | null = null;
const bus: Partial<Record<Group, GainNode>> = {};
const voices: Record<Group, { src: AudioBufferSourceNode; at: number }[]> = { ui: [], ring: [], big: [], crowd: [] };
const lastAt: Record<string, number> = {};
let bank: Record<string, { g: Group; loop: boolean; b: AudioBuffer[] }> | null = null, loading: Promise<void> | null = null;

/** The audio context, made on first use. Null where the browser has none. */
export function ctx(): AudioContext | null {
  if (AC) return AC;
  try {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext; if (!C) return null;
    AC = new C() as AudioContext;
    const lim = AC.createDynamicsCompressor();   // the limiter: loud moments stack up without clipping
    lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.15;
    master = AC.createGain(); master.connect(lim); lim.connect(AC.destination);
    (Object.keys(VOICES) as Group[]).forEach(g => { const n = AC!.createGain(); n.gain.value = LEVEL[g]; n.connect(master!); bus[g] = n; });
    levels();
  } catch (e) { AC = null; }
  return AC;
}
/** Set the effects volume and the crowd level from Options. */
export function levels() {
  if (!AC || !master) return;
  master.gain.setTargetAtTime(pref.snd ? (pref.fxvol || 1) : 0, AC.currentTime, 0.05);
  if (bus.crowd) bus.crowd.gain.setTargetAtTime(LEVEL.crowd * (pref.crowd == null ? 1 : pref.crowd), AC.currentTime, 0.1);
}
function b64(s: string): ArrayBuffer { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
/** Decode the recordings once. Safe to call often. */
export function load(): Promise<void> {
  if (loading) return loading;
  const ac = ctx(), D = (window as any).EWF_SFX_DATA; if (!ac || !D) { bank = {}; return (loading = Promise.resolve()); }   // nothing to decode: ready, with no sounds
  const out: typeof bank = {};
  loading = Promise.all(Object.keys(D).map(id => Promise.all(D[id].t.map((t: string) => new Promise<AudioBuffer | null>(res => {
    try { ac.decodeAudioData(b64(t), res, () => res(null)); } catch (e) { res(null); }
  }))).then((bs: (AudioBuffer | null)[]) => { out![id] = { g: D[id].g, loop: !!D[id].loop, b: bs.filter(Boolean) as AudioBuffer[] }; }))).then(() => { bank = out; });
  return loading;
}
/** The first press or key wakes the sound (browsers keep it asleep until then) and decodes the recordings. */
export function wake() { if (!SFX_ON) return; const ac = ctx(); if (!ac) return; if (ac.state === 'suspended') ac.resume().catch(() => {}); load(); }
export const ready = () => !!bank;
export const now = () => (AC ? AC.currentTime : 0);

export interface PlayOpt { gain?: number; rate?: number; delay?: number; take?: number; gap?: number; vary?: number; pan?: number }
/** Play one take of a sound. Rate and gain move a little each time (vary) so a sound heard twice is not a copy. */
export function play(id: string, o: PlayOpt = {}): AudioBufferSourceNode | null {
  if (!SFX_ON || !pref.snd || !bank || !AC || !master) return null;
  const s = bank[id]; if (!s || !s.b.length) return null;
  const t0 = AC.currentTime, key = id + ':' + (o.delay || 0).toFixed(2);
  if (o.gap !== 0 && lastAt[key] != null && t0 - lastAt[key] < (o.gap || 0.035)) return null;   // asked again too soon
  lastAt[key] = t0;
  const g = s.g, vs = voices[g]; while (vs.length >= VOICES[g]) { const v = vs.shift()!; try { v.src.stop(); } catch (e) { /* gone */ } }
  const vary = o.vary == null ? 0.06 : o.vary, buf = s.b[o.take != null ? o.take % s.b.length : Math.floor(Math.random() * s.b.length)];
  const src = AC.createBufferSource(), gn = AC.createGain();
  src.buffer = buf; src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * vary);
  gn.gain.value = (o.gain == null ? 1 : o.gain) * (1 + (Math.random() * 2 - 1) * vary);
  let out: AudioNode = gn;
  if (o.pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = o.pan; gn.connect(p); out = p; }
  src.connect(gn); out.connect(bus[g]!);
  const v = { src, at: t0 }; vs.push(v);
  src.onended = () => { const i = vs.indexOf(v); if (i >= 0) vs.splice(i, 1); };
  src.start(t0 + (o.delay || 0)); heard(id);
  return src;
}
/** A looping sound with a level that can be glided: the crowd's murmur. */
export interface Loop { set(v: number, secs?: number): void; stop(secs?: number): void; tone(hz: number): void }
export function loop(id: string): Loop | null {
  if (!SFX_ON || !bank || !AC) return null;
  const s = bank[id]; if (!s || !s.b.length) return null;
  const src = AC.createBufferSource(), gn = AC.createGain(), lp = AC.createBiquadFilter();
  src.buffer = s.b[0]; src.loop = true; lp.type = 'lowpass'; lp.frequency.value = 2400; gn.gain.value = 0;
  src.connect(lp); lp.connect(gn); gn.connect(bus.crowd!); src.start(AC.currentTime, Math.random() * s.b[0].duration); heard('loop:' + id);
  return {
    set(v, secs = 1.2) { gn.gain.setTargetAtTime(Math.max(0, v), AC!.currentTime, secs / 3); },
    tone(hz) { lp.frequency.setTargetAtTime(hz, AC!.currentTime, 0.5); },
    stop(secs = 1) { gn.gain.setTargetAtTime(0, AC!.currentTime, secs / 3); try { src.stop(AC!.currentTime + secs * 2); } catch (e) { /* gone */ } }
  };
}
/** Lower the crowd under a big moment for a moment, then let it back up. */
export function duck(amount = 0.45, secs = 1.4) {
  if (!AC || !bus.crowd) return;
  const g = bus.crowd.gain, full = LEVEL.crowd * (pref.crowd == null ? 1 : pref.crowd), t = AC.currentTime;
  g.cancelScheduledValues(t); g.setTargetAtTime(full * amount, t, 0.05); g.setTargetAtTime(full, t + secs, 0.4);
}
/** The tension under a near fall: a rising swell made in code, the one thing no recording here does. */
export function riser(secs = 1.1) {
  if (!SFX_ON || !pref.snd || !AC || !bus.big) return;
  try {
    const t = AC.currentTime, o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(440, t + secs);
    o2.frequency.setValueAtTime(111.5, t); o2.frequency.exponentialRampToValueAtTime(446, t + secs);
    f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + secs);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + secs * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + secs + 0.12);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(bus.big); o.start(t); o2.start(t); o.stop(t + secs + 0.2); o2.stop(t + secs + 0.2);
  } catch (e) { /* no audio is fine */ }
}
/** The last sounds played, newest last (the sound test reads it through window.EWF_SOUND). */
const played: string[] = [];
function heard(id: string) { played.push(id); if (played.length > 300) played.shift(); }
/** How many voices each group holds right now (EWF_DEBUG and the sound test read it). */
export function voiceCount(): Record<Group, number> { return { ui: voices.ui.length, ring: voices.ring.length, big: voices.big.length, crowd: voices.crowd.length }; }

document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) AC.suspend().catch(() => {}); else if (pref.snd) AC.resume().catch(() => {}); });
(window as any).EWF_SOUND = { played, voices: voiceCount, ready: () => !!bank, state: () => (AC ? AC.state : 'none') };
