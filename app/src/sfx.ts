/* Sound: a handful of square-wave beeps and a burst of filtered noise for the crowd. Starts only after a click. */
import { pref } from './store';

let AC: AudioContext | null = null;
function ctx(): AudioContext { if (!AC) AC = new ((window as any).AudioContext || (window as any).webkitAudioContext)(); return AC!; }
export function tone(f: number, d: number, type?: OscillatorType, vol?: number, when?: number) {
  if (!pref.snd) return;
  try {
    const ac = ctx(), o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + (when || 0);
    o.type = type || 'square'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.start(t); o.stop(t + d + 0.03);
  } catch (e) { /* no audio is fine */ }
}
function crowdNoise(vol: number, d: number) {
  if (!pref.snd) return;
  try {
    const ac = ctx(), n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    const src = ac.createBufferSource(), g = ac.createGain(), flt = ac.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = 900; g.gain.value = vol; src.buffer = buf; src.connect(flt); flt.connect(g); g.connect(ac.destination); src.start();
  } catch (e) { /* no audio is fine */ }
}
export const SFX = {
  bell() { tone(1568, 0.5, 'triangle', 0.09, 0); tone(1568, 0.5, 'triangle', 0.09, 0.22); tone(1568, 0.7, 'triangle', 0.09, 0.44); },
  count() { tone(520, 0.09, 'square', 0.05, 0); tone(520, 0.09, 'square', 0.05, 0.38); tone(780, 0.16, 'square', 0.05, 0.76); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.04, i * 0.13)); tone(1047, 0.5, 'square', 0.04, 0.55); },
  ach() { tone(880, 0.1, 'square', 0.04, 0); tone(1320, 0.22, 'square', 0.04, 0.1); },
  crowd(cr: number) { crowdNoise(0.02 + Math.max(0, cr - 30) / 70 * 0.1, 0.9 + cr / 100); },
  tick() { tone(1100, 0.012, 'square', 0.008); }
};
