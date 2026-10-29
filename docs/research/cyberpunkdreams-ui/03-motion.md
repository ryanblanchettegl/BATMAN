# 03 — Motion

Twenty-eight keyframes, forty transitions, and one philosophy: **fade, slide, and blur — never
bounce**.

## The complete keyframe set

| Keyframe | Movement |
|---|---|
| `areaBannerIn` | `opacity 0→1`, `translateY(-100px)→0` — area change drops in from above |
| `areaBannerOut` | reverse |
| `fadein` | `opacity 0→1`, `translateY(-30px)→0` |
| `fadeout` / `fadeoutup` / `plainFadeout` | `opacity 1→0`, optional upward drift |
| `plainFadein` | `opacity 0→1` only |
| `fadeInPartial` | `opacity 0→0.6` — **deliberately never reaches 1** |
| `fadeOutPartial` | `opacity →0.6→0` |
| `qualityFadein` | `translateX(100%)`, `margin-bottom -41px→0`, blur at 5% |
| `qualityFadeout` | reverse, with padding collapsing |
| `lateralFadein` | `translateX(100%)`, `margin-bottom -111px→0` |
| `lateralFadeout` | reverse |
| `lateralQualityFadein/Out` | combined version of the two above |
| `cardFadein` | `translateY(-20px)→0`, `opacity 0→1`, `filter: blur(10px)` at 5% |
| `cardFadeout` | reverse, blur at 95% |
| `stickyFadein` / `stickyFadeout` | as card |
| `deckFadein` | `translateX(-10px)→0` — small, inward |
| `handFadeout` | `translateX→0`, blur at 95% |
| `headerStickyFadein` / `headerNormalFadein` | `translateY(-80px)`, blur at 5% |
| `flashFade` | `20% { filter: brightness(0) invert(1) }`, `25% { blur(10px) }` — a hard white blink |
| `notificationFadein` | `top -15px→`, blur at 5% |
| `notificationRemove` | reverse |
| `blinker` | `50% { opacity: 0 }` — terminal caret |

## The four ideas in that set

**1. Blur as a focus cue.** Almost every entrance blurs at 5% and sharpens to 0; exits blur at
95%. This reads as an object coming *toward* you rather than a `div` fading. It costs one
`filter` property and does more for perceived quality than any easing curve.

**2. Negative margins collapse space.** `lateralFadein` animates `margin-bottom` from `-111px`
to `0`, `qualityFadein` from `-41px`. The block *makes room for itself* instead of appearing in
a gap that was always reserved. This is why the right rail feels alive.

**3. Nothing reaches full opacity when it is only half there.** `fadeInPartial` stops at `0.6`.
Played, inactive, or secondary cards stay visibly *less present* than active ones. The game has
a stated visual hierarchy of attention, not just of size.

**4. No scale, no rotate, no elastic.** There is not a single `scale()` or `rotate()` in the
keyframes. Movement is translation and opacity only. A terminal should not bounce.

## Durations

Transitions cluster at **0.3s and 0.5s**:

```
padding ease 0.5s, color 0.5s            (buttons)
margin-top 0.5s, opacity 0.5s            (panels)
background-color 0.35s, background-image 0.35s
box-shadow 0.35s
margin-top 0.5s
```

Two values, applied consistently. There is no 0.2s anywhere and no transition over 0.5s.

## The signature interaction

```css
button       { padding: 6px 12px; transition: padding .5s, color .5s; }
button:hover { padding-left: 24px; color: #a80000; }
```

Hover doubles the left padding. The button **grows and its label slides right**, and the text
turns red. No icon, no scale, no shadow. It is the cheapest pressability cue available and it
is used on every button in the game.

## What to take

1. **Blur-in / blur-out** for anything entering or leaving the board.
2. **Negative-margin collapse** to make arriving panels push the layout.
3. **A partial-opacity state** for played/inactive objects, so attention has a gradient.
4. **Two durations only** — 0.3s for state, 0.5s for movement.
5. **Translation and opacity only.** No scale.
