/* Sound: the front the rest of the interface calls (docs/plans/sound.md). The sounds are real recordings and piano
   figures Ryan picked by ear, played by ./audio/engine.ts and chosen by ./audio/cues.ts: the broadcast (step 2) and
   the office (step 4). Nothing plays until the first press or key wakes the sound. */
import { hooks } from './store';
import { wake } from './audio/engine';
import { big, crowd, ring, office, uiSetup } from './audio/cues';

const quiet = () => { /* no sound picked for this yet */ };
export const SFX = {
  bell() { big.bell(); },
  bellEnd() { big.bellEnd(); },
  count() { crowd.shout(['one', 'two', 'three']); },
  /** The show goes on the air, and the sign-off. */
  fanfare() { big.onAir(); },
  /** A call on the headset, an achievement. */
  ach: quiet,
  crowd(cr: number) { crowd.pop(cr); },
  hit() { ring.hit(); },
  tick: quiet,
  open() { office.pop(); },
  close: quiet,
  win() { office.good(); },
  fail() { office.bad(); },
  week() { office.week(); },
  star() { office.star(); },
  after(rep: any) { office.after(rep); }
};
hooks.sound = k => { const f = (SFX as any)[k]; if (f) f(); };
// browsers keep sound asleep until the player presses something
document.addEventListener('pointerdown', wake, true);
document.addEventListener('keydown', wake, true);
uiSetup();
