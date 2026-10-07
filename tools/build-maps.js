/* Rebuild src/91-maps.js: the road maps, each a board of 59 by 32 dots.

   A map is data, not a picture (rule 2). This tool reads public-domain outlines (Natural Earth through the npm
   packages `world-atlas` and `us-atlas`, read with `topojson-client`), lays a grid over each frame and writes down
   which area every dot belongs to. The game never needs the packages; only this tool does.

     mkdir /tmp/maps && cd /tmp/maps && npm i world-atlas us-atlas topojson-client
     MAPS_MODULES=/tmp/maps/node_modules node tools/build-maps.js

   To add a map: one more entry in MAPS below (a frame and a rule that names the area of a point), then run this. */
const path = require('path'), fs = require('fs');
const MOD = process.env.MAPS_MODULES || path.join(__dirname, '..', 'node_modules');
const need = n => require(path.join(MOD, n));
const topo = need('topojson-client');
const W = 59, H = 32;

/* ---------- outlines ---------- */
function polys(f) {   // a feature as a list of polygons, each with its box
  const g = f.geometry; if (!g) return [];
  const L = g.type === 'Polygon' ? [g.coordinates] : (g.type === 'MultiPolygon' ? g.coordinates : []);
  return L.map(rings => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; rings[0].forEach(p => { if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; }); return { rings, box: [a, b, c, d] }; });
}
function inRing(R, x, y) { let c = false; for (let i = 0, j = R.length - 1; i < R.length; j = i++) { const xi = R[i][0], yi = R[i][1], xj = R[j][0], yj = R[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function inPolys(P, x, y) { for (const p of P) { const b = p.box; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (!inRing(p.rings[0], x, y)) continue; let hole = false; for (let i = 1; i < p.rings.length; i++) if (inRing(p.rings[i], x, y)) { hole = true; break; } if (!hole) return true; } return false; }
function layer(file, obj) { const t = need(file); return topo.feature(t, t.objects[obj]).features.filter(f => f.properties.name !== 'Fiji' && f.properties.name !== 'Antarctica').map(f => ({ n: f.properties.name, P: polys(f) })); }   // Fiji's outline crosses the date line and would cover the whole row
const C50 = layer('world-atlas/countries-50m.json', 'countries'), C110 = layer('world-atlas/countries-110m.json', 'countries');
const US = layer('us-atlas/states-10m.json', 'states').filter(s => !/Alaska|Hawaii|Samoa|Guam|Mariana|Puerto|Virgin/.test(s.n));
function find(L, x, y) { for (const f of L) if (inPolys(f.P, x, y)) return f.n; return null; }
/** The nearest of a list of seeds [name, lat, lon]. A cheap way to split a country into its regions on a board this coarse. */
function nearest(seeds, lon, lat) { let best = null, bd = 1e9; const k = Math.cos(lat * Math.PI / 180); for (const s of seeds) { const dx = (s[2] - lon) * k, dy = s[1] - lat, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = s[0]; } } return best; }

/* ---------- regions inside a country ---------- */
const MEX = [['Baja California', 30, -115.2], ['Baja California Sur', 25.5, -111.8], ['Sonora', 29.6, -110.6], ['Chihuahua', 28.6, -106.3], ['Coahuila', 27.3, -102], ['Nuevo León', 25.6, -99.9], ['Tamaulipas', 24.3, -98.6],
  ['Sinaloa', 25, -107.5], ['Durango', 24.9, -104.9], ['Zacatecas', 23.2, -102.8], ['San Luis Potosí', 22.6, -100.4], ['Nayarit', 21.8, -104.9], ['Jalisco', 20.6, -103.7], ['Aguascalientes', 22, -102.4],
  ['Guanajuato', 21, -101.2], ['Querétaro', 20.8, -99.9], ['Hidalgo', 20.5, -98.9], ['Colima', 19.1, -103.9], ['Michoacán', 19.2, -101.9], ['the Valley of Mexico', 19.4, -99.4], ['Morelos', 18.75, -99.1],
  ['Tlaxcala', 19.4, -98.2], ['Puebla', 18.9, -97.9], ['Veracruz', 19.4, -96.4], ['Veracruz', 21.5, -97.8], ['Veracruz', 18, -95], ['Guerrero', 17.6, -100], ['Oaxaca', 17, -96.5], ['Chiapas', 16.5, -92.5],
  ['Tabasco', 18, -92.6], ['Campeche', 18.9, -90.4], ['Yucatán', 20.7, -89], ['Quintana Roo', 19.6, -88]];
const JAP = [['Hokkaido', 43.3, 142.8], ['Tohoku', 40.7, 140.9], ['Tohoku', 39.6, 140.5], ['Tohoku', 38.4, 140.6], ['Tohoku', 37.6, 140.2], ['Kanto', 36.3, 139.8], ['Kanto', 35.7, 139.7], ['Kanto', 35.4, 140.2], ['Kanto', 36.5, 139],
  ['Chubu', 37.4, 138.8], ['Chubu', 36.6, 137], ['Chubu', 36, 138], ['Chubu', 35.3, 137], ['Chubu', 35, 138.4], ['Chubu', 35.6, 138.6], ['Chubu', 35.9, 136.2],
  ['Kansai', 34.9, 135.6], ['Kansai', 34.2, 135.6], ['Kansai', 35.2, 134.8], ['Kansai', 34.5, 136.4], ['Kansai', 35.3, 136.1], ['Chugoku', 34.6, 133.7], ['Chugoku', 35.2, 133], ['Chugoku', 34.3, 131.7], ['Chugoku', 34.6, 132.5],
  ['Shikoku', 33.7, 133.5], ['Shikoku', 33.5, 132.7], ['Kyushu', 32.8, 130.8], ['Kyushu', 31.8, 130.8], ['Kyushu', 33.4, 130.8]];
function britain(n, lon, lat) {
  if (n === 'Ireland') return 'Ireland';
  if (n !== 'United Kingdom') return null;
  if (lon < -5.35 && lat > 53.9 && lat < 55.35) return 'Northern Ireland';
  if (lon >= -3.1 ? lat > 54.95 + 0.794 * (lon + 3.1) : lat > 54.6) return 'Scotland';
  if (lon < -2.9 && lat > 51.35 && lat < 53.45) return 'Wales';
  if (lat >= 53.3) return 'the North of England';
  if (lat >= 52.2) return 'the Midlands';
  return lon < -2 ? 'the West Country' : 'the South East';
}
/* The lands of the old world, for the map the gods and heroes tour. */
const OLD = { Turkey: 'Anatolia', Iraq: 'Mesopotamia', Iran: 'Persia', Syria: 'the Levant', Lebanon: 'the Levant', Israel: 'the Levant', Jordan: 'the Levant', Palestine: 'the Levant', 'Saudi Arabia': 'Arabia', Kuwait: 'Arabia',
  Tunisia: 'Carthage', Algeria: 'Numidia', Libya: 'Libya', Egypt: 'Egypt', Greece: 'Greece', Italy: 'Italy', Cyprus: 'Cyprus', Bulgaria: 'Thrace', Macedonia: 'Macedon', 'North Macedonia': 'Macedon',
  Albania: 'Illyria', Montenegro: 'Illyria', Croatia: 'Illyria', 'Bosnia and Herz.': 'Illyria', Serbia: 'Illyria', Slovenia: 'Illyria', Kosovo: 'Illyria', Romania: 'Dacia', Moldova: 'Dacia', Hungary: 'Pannonia', Austria: 'Pannonia',
  Georgia: 'the Caucasus', Armenia: 'the Caucasus', Azerbaijan: 'the Caucasus', Ukraine: 'Scythia', Russia: 'Scythia', France: 'Gaul', Switzerland: 'Gaul', Spain: 'Hispania', Malta: 'Italy', Sudan: 'Nubia', Kazakhstan: 'Scythia', Turkmenistan: 'Persia', Slovakia: 'Pannonia' };
const EURN = {}; ('Albania,Andorra,Austria,Belarus,Belgium,Bosnia and Herz.,Bulgaria,Croatia,Cyprus,Czechia,Denmark,Estonia,Finland,France,Germany,Greece,Hungary,Iceland,Ireland,Italy,Kosovo,Latvia,Liechtenstein,Lithuania,Luxembourg,Macedonia,North Macedonia,Malta,Moldova,Monaco,Montenegro,Netherlands,Norway,Poland,Portugal,Romania,San Marino,Serbia,Slovakia,Slovenia,Spain,Sweden,Switzerland,Ukraine,United Kingdom,Vatican,Isle of Man,Jersey,Guernsey,Faeroe Is.,Åland,N. Cyprus').split(',').forEach(n => { EURN[n] = 1; });
const NEAR = {}; ('Saudi Arabia,Yemen,Oman,United Arab Emirates,Qatar,Kuwait,Iraq,Iran,Syria,Jordan,Israel,Lebanon,Turkey,Palestine,Bahrain,Georgia,Armenia,Azerbaijan').split(',').forEach(n => { NEAR[n] = 1; });
const OCE = {}; ('Australia,New Zealand,Papua New Guinea,Fiji,Solomon Is.,Vanuatu,New Caledonia').split(',').forEach(n => { OCE[n] = 1; });
function continent(n, lon, lat) {
  if (n === 'Antarctica') return null;
  if (OCE[n]) return 'Oceania';
  if (n === 'Russia') return lon > 0 && lon < 60 ? 'Europe' : 'Asia';
  if (n === 'Greenland' || lon < -30) return lat > 12.5 || (lat > 7 && lon < -77.5) ? 'North America' : 'South America';
  if (EURN[n]) return 'Europe';
  if (NEAR[n]) return 'Asia';
  if (lon < 60 && lat < 38 && lon > -27) return 'Africa';
  return 'Asia';
}
const EUNAME = { 'Bosnia and Herz.': 'Bosnia', Macedonia: 'North Macedonia', Czechia: 'Bohemia', 'United Kingdom': 'Britain' };
const SA = {}; ('Argentina,Bolivia,Brazil,Chile,Colombia,Ecuador,Guyana,Paraguay,Peru,Suriname,Uruguay,Venezuela,Fr. S. Antarctic Lands,Falkland Is.').split(',').forEach(n => { SA[n] = 1; });
const CA = {}; ('Guatemala,Belize,Honduras,El Salvador,Nicaragua,Costa Rica,Panama,Cuba,Jamaica,Haiti,Dominican Rep.,Bahamas').split(',').forEach(n => { CA[n] = 1; });

/* ---------- the maps: a frame (top and bottom latitude, the longitude of the middle) and a rule for the area ---------- */
const MAPS = [
  { id: 'usa', n: 'The United States', top: 49.9, bot: 24, mid: -95.7, ky: 1.27, area: (lon, lat) => find(US, lon, lat), other: () => null },
  { id: 'brit', n: 'Britain and Ireland', top: 59.6, bot: 49.6, mid: -4.2, area: (lon, lat) => britain(find(C50, lon, lat), lon, lat) },
  { id: 'eur', n: 'Europe', top: 62, bot: 35, mid: 13, area: (lon, lat) => { const n = find(C50, lon, lat); return n && (EURN[n] || n === 'Russia' || n === 'Turkey') ? (EUNAME[n] || n) : null; } },
  { id: 'med', n: 'The Mediterranean and the Near East', top: 46.5, bot: 24.5, mid: 29, area: (lon, lat) => { const n = find(C50, lon, lat); return n ? (OLD[n] || null) : null; } },
  { id: 'mex', n: 'Mexico and Central America', top: 33, bot: 7, mid: -95, area: (lon, lat) => { const n = find(C50, lon, lat); return n === 'Mexico' ? nearest(MEX, lon, lat) : (CA[n] ? n.replace('Dominican Rep.', 'Hispaniola').replace('Haiti', 'Hispaniola') : null); } },
  { id: 'sam', n: 'South America', top: 14, bot: -56, mid: -60, area: (lon, lat) => { const n = find(C50, lon, lat); return SA[n] ? n.replace('Falkland Is.', 'Argentina') : null; } },
  { id: 'jap', n: 'Japan', top: 46, bot: 30, mid: 137, area: (lon, lat) => find(C50, lon, lat) === 'Japan' ? nearest(JAP, lon, lat) : null },
  { id: 'world', n: 'The world', top: 78, bot: -58, mid: 12, span: 360, src: C110, area: (lon, lat) => { const n = find(C110, lon, lat); return n ? continent(n, lon, lat) : null; } }
];

const ABC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&()*+,/:;<=>?@[]^_{|}~';
function build(m) {
  const dLat = (m.top - m.bot) / H, midLat = (m.top + m.bot) / 2, ky = m.ky || 1 / Math.cos(midLat * Math.PI / 180), dLon = m.span ? m.span / W : dLat * ky, lon0 = m.mid - W / 2 * dLon;
  const land = m.src || C50, names = [], rows = [], count = {};
  const wrap = x => x > 180 ? x - 360 : (x < -180 ? x + 360 : x);
  for (let r = 0; r < H; r++) { let row = '';
    for (let c = 0; c < W; c++) {
      const votes = {}; let any = 0, best = null, bn = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const lon = wrap(lon0 + (c + (sx + .5) / 3) * dLon), lat = m.top - (r + (sy + .5) / 3) * dLat;
        let a = m.area(lon, lat); if (a == null && m.other ? m.other(lon, lat) : (a == null && find(land, lon, lat))) a = '-';
        if (a != null) { any++; votes[a] = (votes[a] || 0) + (a === '-' ? 0.6 : 1); }
      }
      for (const k in votes) if (votes[k] > bn) { bn = votes[k]; best = k; }
      if (any < 4 || best == null) { row += ' '; continue; }
      if (best === '-') { row += '-'; continue; }
      let i = names.indexOf(best); if (i < 0) { i = names.length; names.push(best); }
      if (i >= ABC.length) throw new Error(m.id + ': too many areas'); count[best] = (count[best] || 0) + 1; row += ABC[i];
    }
    rows.push(row);
  }
  return { id: m.id, n: m.n, f: [+lon0.toFixed(3), +dLon.toFixed(4), m.top, +dLat.toFixed(4)], a: names, g: rows };
}
const out = MAPS.map(build);
let js = '/* ---------- the road maps: generated by tools/build-maps.js. Do not edit by hand. ----------\n' +
  '   Each map is a board of ' + W + ' by ' + H + ' dots. `f` is the frame: the longitude of the left edge, degrees of longitude a dot,\n' +
  '   the latitude of the top edge, degrees of latitude a dot. `a` is the areas that can light up. `g` is the board, a\n' +
  '   row a string: a space is sea, "-" is land outside the map\'s areas, and any other character is an area (its place\n' +
  '   in MAP_ABC is its place in `a`). The outlines are Natural Earth\'s, which are public domain. */\n';
js += 'var MAP_W=' + W + ',MAP_H=' + H + ',MAP_ABC=' + JSON.stringify(ABC) + ';\nvar MAPS=[\n' + out.map(m => ' {id:' + JSON.stringify(m.id) + ',n:' + JSON.stringify(m.n) + ',f:' + JSON.stringify(m.f) + ',\n  a:' + JSON.stringify(m.a) + ',\n  g:[' + m.g.map(r => JSON.stringify(r)).join(',\n     ') + ']}').join(',\n') + '\n];\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', '91-maps.js'), js);
out.forEach(m => { console.log('\n' + m.id + ': ' + m.n + ' (' + m.a.length + ' areas)\n' + m.g.join('\n')); });
