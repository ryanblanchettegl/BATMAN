/* Sound: the front the rest of the interface calls (docs/plans/sound.md). The sounds are real recordings Ryan picked
   by ear, played by ./audio/engine.ts and chosen by ./audio/cues.ts. Step 2 of the plan is the broadcast; the office
   sounds (piano) are the next step, so presses, pop-ups and results are silent for now. Nothing plays until the first
   press or key wakes the sound. */
import { hooks } from './store';
import { wake } from './audio/engine';
import { big, crowd, ring } from './audio/cues';

const quiet = () => { /* an office sound: the piano comes in the next step */ };
export const SFX = {
  bell() { big.bell(); },
  bellEnd() { big.bellEnd(); },
  count() { crowd.count(); },
  /** The show goes on the air, and the sign-off. */
  fanfare() { big.onAir(); },
  /** A call on the headset, an achievement. */
  ach: quiet,
  crowd(cr: number) { crowd.pop(cr); },
  hit() { ring.hit(); },
  tick: quiet, open: quiet, close: quiet, win: quiet, fail: quiet
};
hooks.sound = k => { const f = (SFX as any)[k]; if (f) f(); };
// browsers keep sound asleep until the player presses something
document.addEventListener('pointerdown', wake, true);
document.addEventListener('keydown', wake, true);
