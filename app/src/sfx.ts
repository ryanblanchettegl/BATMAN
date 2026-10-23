/* Sound: the front the rest of the interface calls. The sounds are real recordings played by the engine in
   ./audio/engine.ts and chosen by ./audio/cues.ts (Ryan, 23 October). Nothing plays until the first press or key. */
import { hooks } from './store';
import { play, wake, SFX_ON } from './audio/engine';
import { big, crowd, ring, uiSetup } from './audio/cues';

export const SFX = {
  bell() { big.bell(); },
  bellEnd() { big.bellEnd(); },
  count() { ring.count(3, 0.5); },
  /** The show goes on the air, and the sign-off. */
  fanfare() { big.onAir(); },
  /** Something to look at: a call on the headset, an achievement. */
  ach() { wake(); play('ui_call', { gain: 0.8, gap: 0.2 }); },
  crowd(cr: number) { crowd.pop(cr); },
  /** A line of commentary typing itself out. */
  tick() { play('ui_tick', { gain: 0.12, gap: 0.05, vary: 0.15 }); },
  open() { play('ui_open', { gain: 0.6, gap: 0.08 }); },
  close() { play('ui_close', { gain: 0.5, gap: 0.08 }); },
  win() { play('ui_ok', { gain: 0.6, gap: 0.15 }); },
  fail() { play('ui_err', { gain: 0.6, gap: 0.15 }); }
};
hooks.sound = k => { const f = (SFX as any)[k]; if (f) f(); };
if (SFX_ON) uiSetup();   // off for now: no listeners, nothing plays
