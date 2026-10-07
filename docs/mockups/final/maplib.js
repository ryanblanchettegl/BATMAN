const { open, go } = require('/home/claude/batman/app/tests/helper.js');
const GRID = ['AK . . . . . . . . . . ME', '. . . . . . . . . . VT NH', 'WA ID MT ND MN IL WI MI NY RI MA', 'OR NV WY SD IA IN OH PA NJ CT .', 'CA UT CO NE MO KY WV VA MD DE .', '. AZ NM KS AR TN NC SC DC . .', '. . . OK LA MS AL GA . . .', 'HI . . TX . . . . FL . .'].map(r => { const a = r.split(' '); while (a.length < 12) a.push('.'); return a; });
const C = { AL: [32.8, -86.8], AZ: [34.2, -111.7], AR: [34.9, -92.4], CA: [37.2, -119.4], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5], FL: [28.6, -82.4], GA: [32.7, -83.4], ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3], IA: [42.1, -93.5], KS: [38.5, -98.4], KY: [37.5, -85.3], LA: [31.1, -92.0], ME: [45.4, -69.2], MD: [39.0, -76.8], MA: [42.3, -71.8], MI: [44.3, -85.4], MN: [46.3, -94.3], MS: [32.7, -89.7], MO: [38.4, -92.5], MT: [47.0, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6], NH: [43.7, -71.6], NJ: [40.2, -74.7], NM: [34.4, -106.1], NY: [42.9, -75.5], NC: [35.6, -79.4], ND: [47.5, -100.5], OH: [40.3, -82.8], OK: [35.6, -97.5], OR: [43.9, -120.6], PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.9, -80.9], SD: [44.4, -100.2], TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7], VT: [44.1, -72.7], VA: [37.5, -78.9], WA: [47.4, -120.5], WV: [38.6, -80.6], WI: [44.6, -89.9], WY: [43.0, -107.5] };
const OUT = [[-124.7, 48.4], [-123.0, 49.0], [-95.2, 49.0], [-89.5, 48.0], [-84.5, 46.5], [-82.5, 45.3], [-82.4, 43.0], [-83.1, 41.9], [-78.9, 42.9], [-79.0, 43.3], [-76.3, 43.6], [-75.0, 45.0], [-71.1, 45.3], [-70.0, 46.7], [-69.2, 47.4], [-68.2, 47.3], [-67.8, 45.7], [-67.0, 44.8], [-70.2, 43.6], [-70.7, 42.7], [-70.0, 41.7], [-71.5, 41.3], [-74.0, 40.6], [-74.2, 39.6], [-75.0, 38.9], [-75.6, 37.9], [-76.0, 36.9], [-75.5, 35.3], [-77.0, 34.6], [-78.6, 33.9], [-80.9, 32.0], [-81.4, 30.7], [-80.0, 26.8], [-80.4, 25.2], [-81.8, 26.0], [-82.8, 27.9], [-82.7, 29.0], [-84.0, 30.0], [-85.4, 29.7], [-87.5, 30.3], [-89.5, 30.2], [-89.4, 29.2], [-91.2, 29.3], [-93.8, 29.7], [-95.0, 29.2], [-97.2, 27.8], [-97.2, 25.9], [-99.2, 26.5], [-100.6, 28.9], [-101.4, 29.8], [-103.1, 29.0], [-104.5, 29.6], [-106.5, 31.8], [-108.2, 31.8], [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.5, 34.0], [-120.6, 34.5], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.8], [-124.3, 40.4], [-124.2, 42.0], [-124.1, 44.0], [-123.9, 46.2]];
const inside = (x, y) => { let c = false; for (let i = 0, j = OUT.length - 1; i < OUT.length; j = i++) { const [xi, yi] = OUT[i], [xj, yj] = OUT[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const IL = [[-90.64,42.51],[-87.8,42.49],[-87.53,41.7],[-87.53,39.35],[-88.07,37.9],[-88.5,37.1],[-89.17,37.0],[-89.5,37.3],[-89.5,37.9],[-90.2,38.3],[-90.35,38.9],[-91.4,39.9],[-91.5,40.4],[-90.95,41.1],[-91.1,41.3],[-90.3,41.8]];
const MO = [[-95.77,40.58],[-91.73,40.61],[-91.4,39.9],[-90.35,38.9],[-90.2,38.3],[-89.5,37.3],[-89.1,36.95],[-89.5,36.5],[-89.7,36.0],[-90.37,36.0],[-90.15,36.5],[-94.62,36.5],[-94.62,39.1]];
const CITY = [['NEW YORK',-74.0,40.7],['ATLANTA',-84.4,33.75],['DALLAS',-96.8,32.8],['CHICAGO',-87.63,41.88],['DENVER',-105.0,39.74]], LA = [-118.2,34.05], CO = [[-109.05,41],[-102.05,41],[-102.05,37],[-109.05,37]];
const inPoly = (P, x, y) => { let c = false; for (let i = 0, k = P.length - 1; i < P.length; k = i++) { const [xi, yi] = P[i], [xj, yj] = P[k]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 997; return h; };
const stateAt = (lon, lat) => { if (inPoly(IL, lon, lat)) return 'IL'; if (inPoly(CO, lon, lat)) return 'CO'; let best = null, bd = 1e9; for (const k in C) { const dx = (C[k][1] - lon) * 0.79, dy = C[k][0] - lat, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } } return best === 'IL' ? 'IN' : (best === 'CO' ? 'KS' : best); };
/* ---- style 1: ANSI text mode. Every cell is a character; the shade is how well a state knows you. ---- */
function ansi() {
  const W = 76, H = 21, LON0 = -125, DL = 0.77, LAT0 = 49.6, DT = 1.2, g = [];
  const col = lon => Math.round((lon - LON0) / DL), row = lat => Math.round((LAT0 - lat) / DT);
  for (let r = 0; r < H; r++) { g.push([]); for (let c = 0; c < W; c++) { const lon = LON0 + (c + 0.5) * DL, lat = LAT0 - (r + 0.5) * DT;
    if (!inside(lon, lat)) { g[r].push(null); continue; } const s = stateAt(lon, lat), m = hash(s) % 4;
    g[r].push(s === 'IL' ? ['█', 'now'] : (s === 'CO' ? ['▓', 'nx'] : [['░', '░', '▒', '▓'][m], 'm' + m])); } }
  const line = (a, b, cls) => { let x0 = col(a[1]), y0 = row(a[2]), x1 = col(b[1]), y1 = row(b[2]); const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 1; i < n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (g[y] && x >= 0 && x < W && !(g[y][x] && g[y][x][1] === 'now')) g[y][x] = [i % 2 ? '·' : '•', cls]; } };
  for (let i = 0; i < 3; i++) line(CITY[i], CITY[i + 1], 'rt'); line(CITY[3], CITY[4], 'rn'); line(CITY[4], ['LA', LA[0], LA[1]], 'rf');
  const put = (lon, lat, ch, cls, label, dx) => { const x = col(lon), y = row(lat); g[y][x] = [ch, cls]; if (label) for (let i = 0; i < label.length; i++) { const xx = x + (dx == null ? 2 : dx) + i; if (xx >= 0 && xx < W) g[y][xx] = [label[i], cls + ' lb']; } };
  put(-74, 40.7, '○', 'ct', 'NEW YORK', -9); put(-84.4, 33.75, '○', 'ct', 'ATLANTA'); put(-96.8, 32.8, '○', 'ct', 'DALLAS', -7); put(-105, 39.74, '◘', 'nx', 'DENVER', -7); put(LA[0], LA[1], '☼', 'nx', 'LOS ANGELES');
  put(-87.63, 41.88, '◙', 'here', '◄ CHICAGO');
  return g.map(r => r.map(c => c ? `<i class="${c[1]}">${c[0]}</i>` : ' ').join('')).join('\n');
}
/* ---- styles 2 and 3: the map as a field of dots ---- */
function dots(o) {
  const SX = o.sx, SY = o.sx * 1.27, W = Math.round(59 * SX), H = Math.round(25.6 * SY), X = lon => (lon + 125.4) * SX, Y = lat => (49.9 - lat) * SY, st = o.step; let d = '';
  for (let y = st / 2; y < H; y += st) for (let x = st / 2; x < W; x += st) { const lon = x / SX - 125.4, lat = 49.9 - y / SY; if (!inside(lon, lat)) { if (o.sea) d += `<rect x="${x - 1}" y="${y - 1}" width="2" height="2" class="s"/>`; continue; }
    const s = stateAt(lon, lat), c = s === 'IL' ? 'n' : (s === 'CO' ? 'x' : 'l' + (hash(s) % 3)), r = c === 'n' ? st * 0.44 : st * 0.33;
    d += o.sq ? `<rect x="${(x - st * 0.42).toFixed(1)}" y="${(y - st * 0.42).toFixed(1)}" width="${(st * 0.84).toFixed(1)}" height="${(st * 0.84).toFixed(1)}" class="${c}"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" class="${c}"/>`; }
  let arcs = ''; const P = CITY.concat([['LOS ANGELES', LA[0], LA[1]]]);
  for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], x1 = X(a[1]), y1 = Y(a[2]), x2 = X(b[1]), y2 = Y(b[2]), dd = Math.hypot(x2 - x1, y2 - y1); arcs += `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - dd * 0.36 - 6} ${x2},${y2}" class="arc ${i < 3 ? 'done' : (i === 3 ? 'nx' : 'far')}"/>`; }
  const cd = P.map((c, i) => `<circle cx="${X(c[1])}" cy="${Y(c[2])}" r="${i === 3 ? 4.5 : 3.2}" class="${i === 3 ? 'cn' : (i > 3 ? 'cx' : 'cd')}"/>`).join('');
  const T = (lon, lat, dx, dy, t, cls) => `<text x="${X(lon) + dx}" y="${Y(lat) + dy}" class="lb ${cls || ''}">${t}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="dmap">${d}${arcs}${cd}<circle cx="${X(-87.63)}" cy="${Y(41.88)}" r="11" class="ring"/>
   ${T(-87.63, 41.88, 18, -14, 'CHICAGO', 'now')}${T(-105, 39.74, -30, 30, 'DENVER', 'nx')}${T(-74, 40.7, -66, 20, 'NEW YORK')}${T(-84.4, 33.75, 8, 16, 'ATLANTA')}${T(-96.8, 32.8, -22, 18, 'DALLAS')}${T(-118.2, 34.05, 8, 18, 'LOS ANGELES', 'nx')}</svg>`;
}
const bar = (n, of, w) => { const f = Math.round(n / of * w); return '█'.repeat(f) + '░'.repeat(w - f); };
module.exports = { open, go, ansi, dots, bar };
