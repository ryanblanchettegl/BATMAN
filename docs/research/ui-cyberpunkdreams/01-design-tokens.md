# 01 — Design tokens

Everything below is read from the shipped `base.css` and `fonts.css`.

## Colour

Twenty custom properties. The discipline is the point: two neutrals carry the whole surface,
and only three hues are allowed to mean anything.

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--pure-black` / `--black` | `#050200` | true black, shadows, button text |
| `--blue-black` | `#151521` | deep panel |
| `--main-background` | `#191A21` | the page |
| `--greyer-black` | `#292B2F` | inset block |
| `--blue-grey` | `#2A2A42` | raised panel |
| `--grey-black` | `#2F3136` | alternate panel |
| `--mid-grey` | `#36393F` | divider |
| `--dark-grey` | `#3D4147` | disabled |
| `--light-grey` | `#B9BBBE` | secondary text |

### Ink

`--white #fdfdfd` · `--off-white #fafaf7` — body text is near-white, never pure white.

### Meaning

| Token | Value | Meaning |
|---|---|---|
| `--foxy-red` | `#C83522` | **hover / active** |
| `--link-hover` / `--error` | `#a80000` | **hover and failure share a colour** |
| `--invalid` | `#8C0E1F` | validation |
| `--kinda-gold` / `--social` | `#C88F22` | money, social |
| `--credits` | `#383EEE` | premium currency |
| `--pale-blue` | `#3899EE` | information |
| `--growing-green` | `#1CA74A` | positive |
| `--nice-purple` | `#991CA7` | accent |

The three `--menu-*` pastels (`#D8DEF0`, `#D8F0E0`, `#EDD8F0`) are the only light surfaces —
they exist so the menu can read as paper slips stuck onto the dark shell.

## Type

Self-hosted woff2, no webfont CDN.

| Family | Weights | Use |
|---|---|---|
| **Barlow** | 400, 400i, 700, 700i | body |
| **Barlow Condensed** | 400, 400i, 700, 700i | dense labels, counts |
| **Roboto** | 400, 400i, 700, 700i | secondary / fallback |

```css
body { font-size: 1em; line-height: 1.6em; font-family: 'Barlow', sans-serif; }
```

`line-height: 1.6` on a 1em body is *loose*. This is the whole trick of the density: the
screen holds a dozen numbers and still breathes.

## Space & chrome

```css
button { padding: 6px 12px; margin: 10px 12px 10px 0; font-weight: bold;
         background: var(--white); color: var(--pure-black);
         transition: padding .5s, color .5s; }
button:hover { padding-left: 24px; color: var(--link-hover); }
```

- Buttons are **light on dark** — inverted from the surface, so every action is a slip of paper
  on the board. This is why they read at a glance without borders.
- Shadow vocabulary is tiny: `box-shadow: 0 0 5px var(--pure-black)` for lift.
- Radius is near-zero; edges are square. The look is terminal, not soft.

## Layout constants

```css
html, body { height: 100vh; overflow: hidden; }
body { display: grid; grid-template-rows: 32px 30px 1fr; }
```

32px window bar, 30px header, everything else in the frame. Only three breakpoints exist
(`max-height: 800px`, `max-width: 1400px`, `max-width: 1030px`) and they only shrink the card
header image (to `140×182`) and re-wrap the tab bar.

## What to take

1. **Two neutrals + three meanings.** Restraint is what makes the accent feel like a signal.
2. **Loose leading** (`1.6`) under dense information.
3. **Light buttons on a dark field**, so actions read as objects on the board.
4. **Shared colour for hover and error.** Unusual, effective, and worth thinking about.
