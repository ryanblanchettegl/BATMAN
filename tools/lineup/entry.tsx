/* The lineup sheet (tools/lineup.js): a company's wrestlers drawn by the game's own renderer, full length in a row
   and as head-and-shoulders portraits, so a change to the look can be judged on a whole roster at once. */
import { G, setUniverse } from '../../app/src/store';
import { E } from '../../app/src/engine';
import { Scene, build, viewFor, WAIST } from '../../app/src/kit/scene';
import { recipeOf } from '../../app/src/kit/puppet';
import { drawScene } from '../../app/src/kit/paper';
import { drawPortrait, companyCard } from '../../app/src/kit/paperportrait';

const W = window as any;
W.lineupStart = (uni: string, pid: string) => { setUniverse(uni); G.S = E.newGame(pid, 7, { name: 'Bill', diff: 'normal', fed: null }); };
/** Wrestlers of a company, those with a Create a Player file first. */
W.lineupRoster = (pid: string) => G.S.w.filter((w: any) => w.promo === pid && !w.nw && !w.ret)
  .sort((a: any, b: any) => (b.look ? 1 : 0) - (a.look ? 1 : 0) || (b.ovr || 0) - (a.ovr || 0)).map((w: any) => w.id);
/** A row of wrestlers standing, on navy card, as a PNG data URL. */
W.lineupRow = (ids: number[], wpx = 1920, hpx = 760) => {
  const S = G.S, ws = ids.map(id => S.w.find((x: any) => x.id === id)), n = ws.length, gap = 15.0 / n;
  const sc: Scene = { v: 1, id: 'lineup', name: 'Lineup', when: 'portrait', set: 'none', attire: 'primary_ring', slots: ws.map((w, i) => ({ id: 'S' + i, n: w.name, role: 'a' as const })),
    keys: [{ t: 0, figs: Object.fromEntries(ws.map((w, i) => ['S' + i, { x: -7.5 + gap * (i + 0.5), y: WAIST, r: 0, f: 1, z: 0.6, p: {}, e: '' }])), props: [], cam: { x: 0, y: 0.4, z: 1 } }] };
  const c = document.createElement('canvas'); c.width = wpx; c.height = hpx; const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1f2a55'; ctx.fillRect(0, 0, wpx, hpx);
  const k = sc.keys[0], b = build(sc, k, Object.fromEntries(ws.map((w, i) => ['S' + i, recipeOf(w)])), 0);
  const v = viewFor(wpx, hpx, k.cam); drawScene(ctx, b.pieces.filter(p => !p.layer), v, 'lineup');
  ctx.font = '600 18px sans-serif'; ctx.fillStyle = '#f1ead6'; ctx.textAlign = 'center';
  ws.forEach((w, i) => ctx.fillText(w.name, v.ox + (-7.5 + gap * (i + 0.5)) * v.s, hpx - 12));
  return c.toDataURL('image/png');
};
/** Head-and-shoulders portraits in a grid, as a PNG data URL. */
W.lineupHeads = (ids: number[], px = 240, cols = 6) => {
  const S = G.S, rows = Math.ceil(ids.length / cols), c = document.createElement('canvas'); c.width = cols * px; c.height = rows * (px + 26);
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#16181c'; ctx.fillRect(0, 0, c.width, c.height);
  ids.forEach((id, i) => { const w = S.w.find((q: any) => q.id === id), x = (i % cols) * px, y = Math.floor(i / cols) * (px + 26);
    ctx.drawImage(drawPortrait(recipeOf(w), {}, companyCard({ c1: '#a51f1f', c2: '#fff', c3: '#000' }), px), x + 4, y + 4, px - 8, px - 8);
    ctx.font = '600 16px sans-serif'; ctx.fillStyle = '#f1ead6'; ctx.textAlign = 'center'; ctx.fillText(w.name, x + px / 2, y + px + 16); });
  return c.toDataURL('image/png');
};
