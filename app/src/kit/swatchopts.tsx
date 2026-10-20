/* The options of a colour dropdown (Ryan, 20 October: "show what each colour looks like in the drop down menu and sort
   them by colour shade and type, like all green colours by each other"). The swatches come in groups by colour family,
   each group lightest first, and every entry is painted in its own colour with ink that reads on it, its material in
   its name (paper, foil, neon, denim, leather, board). Hair colours take the natural shades first. It stays a real
   select, so keys, a pad and touch all work. */
import { swatchGroups, swatchInk } from './caw';

export function SwatchOpts(p: { hair?: boolean }) {
  const G = swatchGroups(), nat = G.flatMap(g => g[1]).filter(s => /^hair_/.test(s[0]));
  const opt = (s: [string, string, string, string]) => <option key={s[0]} value={s[0]} style={{ background: s[2], color: swatchInk(s[2]) }}>{'■ ' + s[1]}</option>;
  return <>
    {p.hair && nat.length ? <optgroup label="Natural hair">{nat.map(opt)}</optgroup> : null}
    {G.map(([f, L]) => { const l = L.filter(s => !/^hair_/.test(s[0])); return l.length ? <optgroup key={f} label={f}>{l.map(opt)}</optgroup> : null; })}
  </>;
}
