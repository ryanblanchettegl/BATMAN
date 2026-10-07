/* EWF Wrestling Manager portraits: a small procedural pixel-art face generator.
   Every face is drawn from eight numbers (head, hair, facial hair, mustache, eyes, nose, skin tone, hair colour),
   so a portrait costs a few bytes in a save or a universe package and needs no image files. */

var N = 96;
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var SKIN = [[250, 222, 196], [238, 196, 156], [222, 172, 128], [196, 138, 96], [158, 104, 68], [118, 76, 48], [84, 54, 36]];
var HAIRC = [[226, 214, 170], [208, 170, 92], [176, 98, 44], [128, 76, 40], [88, 54, 32], [54, 36, 26], [26, 22, 24], [124, 124, 130], [222, 222, 222], [180, 40, 44], [44, 92, 196], [44, 164, 84]];
var EYEC = [[70, 48, 30], [60, 90, 150], [70, 120, 80], [96, 74, 40], [40, 40, 44], [110, 130, 150]];
var NAMES = {
  h: ['Oval', 'Square', 'Long', 'Round', 'Heart', 'Lantern jaw', 'Narrow', 'Wide', 'Diamond', 'Block'],
  hr: ['Bald', 'Buzz cut', 'Crew cut', 'Side part', 'Slicked back', 'Flat top', 'Mohawk', 'Curls', 'Mullet', 'Long'],
  fh: ['Clean shaven', 'Stubble', 'Goatee', 'Chin strap', 'Full beard', 'Long beard', 'Mutton chops', 'Soul patch', 'Circle beard', 'Five o’clock shadow'],
  ms: ['None', 'Pencil', 'Chevron', 'Handlebar', 'Horseshoe', 'Walrus', 'Imperial', 'Brush', 'Droop', 'Heavy'],
  ey: ['Level', 'Narrow', 'Wide', 'Heavy brow', 'Arched', 'Scowl', 'Hooded', 'Bright', 'Deep set', 'Thin brow'],
  ns: ['Straight', 'Broad', 'Narrow', 'Long', 'Short', 'Hooked', 'Broken', 'Button', 'Roman', 'Flat']
};
var PARTS = { h: 'Head', hr: 'Hair', fh: 'Facial hair', ms: 'Mustache', ey: 'Eyes', ns: 'Nose' };
//            rx     chin   jaw  bottom
var HEADS = [[.155, .070, 1.7, .800], [.160, .108, 3.0, .800], [.146, .072, 1.9, .830], [.170, .090, 2.3, .775], [.160, .052, 1.35, .800],
             [.160, .124, 3.6, .812], [.136, .062, 1.7, .805], [.180, .100, 2.5, .795], [.150, .058, 1.15, .805], [.170, .130, 4.2, .800]];
//            topTh sideTh hairline sideT backLen backW kind
var HAIRS = [[0, 0, 0, 0, 0, 0, 'bald'], [.004, .002, .20, .50, 0, 0, 'buzz'], [.016, .008, .21, .47, 0, 0, 'crew'], [.028, .014, .24, .48, 0, 0, 'part'],
             [.022, .010, .16, .46, .66, .012, 'slick'], [.052, .010, .20, .44, 0, 0, 'flat'], [.085, 0, .17, 0, 0, 0, 'hawk'], [.050, .040, .23, .56, .60, .030, 'curl'],
             [.022, .012, .21, .47, .90, .050, 'mullet'], [.030, .020, .19, .52, 1.02, .085, 'long']];
//           ew    eh    tilt  browT browArch browTilt browOff iris
var EYES = [[.031, .013, 0, .011, .004, 0, .034, 0], [.030, .009, 0, .011, .002, .004, .030, 4], [.035, .016, 0, .010, .006, 0, .038, 1], [.031, .012, 0, .018, .002, .003, .030, 0],
            [.031, .013, 0, .010, .011, -.003, .040, 2], [.030, .011, .004, .014, .001, .011, .028, 4], [.031, .010, -.003, .012, .003, .002, .027, 3], [.034, .015, 0, .009, .006, -.002, .038, 5],
            [.029, .011, 0, .015, .003, .005, .026, 0], [.031, .013, 0, .006, .007, 0, .038, 1]];
//           width len    hook  shift
var NOSES = [[.027, 0, 0, 0], [.038, 0, 0, 0], [.021, 0, 0, 0], [.027, .016, 0, 0], [.026, -.016, 0, 0], [.028, .008, .010, 0], [.030, 0, 0, .009], [.023, -.020, 0, 0], [.030, .010, .006, 0], [.040, -.008, 0, 0]];

function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function pal(list, t) { var x = cl(t, 0, 100) / 100 * (list.length - 1), i = Math.min(list.length - 2, Math.floor(x)), f = x - i; return [lerp(list[i][0], list[i + 1][0], f), lerp(list[i][1], list[i + 1][1], f), lerp(list[i][2], list[i + 1][2], f)]; }
function ramp(c, warm) {
  var s = [0.34, 0.52, 0.72, 0.90, 1.04, 1.18], out = [];
  for (var i = 0; i < s.length; i++) { var k = s[i], d = k < 1 ? (1 - k) : 0; out.push([cl(c[0] * k + (warm ? 10 * d : 0), 0, 255), cl(c[1] * k * (1 - 0.10 * d * (warm ? 1 : 0)), 0, 255), cl(c[2] * k * (1 - 0.16 * d * (warm ? 1 : 0)), 0, 255)]); }
  return out;
}
function tone(r, b, x, y) { var f = cl(b, 0, 0.999) * (r.length - 1), i = Math.floor(f), th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; return r[Math.min(r.length - 1, i + (f - i > th ? 1 : 0))]; }
function noise(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

function norm(f) {
  f = f || {}; var o = {}, k;
  ['h', 'hr', 'fh', 'ms', 'ey', 'ns'].forEach(function (k) { o[k] = cl(Math.round(+f[k] || 0), 0, 9); });
  o.sk = cl(Math.round(f.sk == null ? 25 : +f.sk || 0), 0, 100); o.hc = cl(Math.round(f.hc == null ? 45 : +f.hc || 0), 0, 100);
  return o;
}
/* a stable face for anybody who was not given one: derived from their name, never random */
function derive(name, g, age) {
  var h = function (k, n) { return hash(name + '|' + k) % n; }, fem = g === 'F';
  var f = { h: h('h', 10), hr: fem ? [9, 9, 7, 8, 3, 9, 4, 7][h('hr', 8)] : h('hr', 10), fh: fem ? 0 : [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 0][h('fh', 14)], ms: fem ? 0 : [0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9][h('ms', 13)],
    ey: h('ey', 10), ns: h('ns', 10), sk: [8, 14, 20, 26, 32, 40, 50, 62, 74, 88][h('sk', 10)], hc: [4, 12, 22, 30, 38, 44, 48, 52, 54, 36][h('hc', 10)] };
  if (fem && f.h === 5 || fem && f.h === 9) f.h = 0;
  if (age >= 52) f.hc = h('gr', 2) ? 64 : 72; else if (age >= 44 && h('gr', 3) === 0) f.hc = 64;
  if (f.fh === 4 || f.fh === 5 || f.fh === 8) f.ms = f.ms || 2;
  return f;
}

function draw(canvas, face, opt) {
  opt = opt || {};
  var f = norm(face), fem = opt.g === 'F', ctx = canvas.getContext('2d');
  if (canvas.width !== N) { canvas.width = N; canvas.height = N; }
  var img = ctx.createImageData(N, N), D = img.data;
  var HD = HEADS[f.h], HR = HAIRS[f.hr], EY = EYES[f.ey], NS = NOSES[f.ns];
  var cx = 0.5, vt = 0.105, vc = HD[3], rx = HD[0] * 1.42 * (fem ? 0.94 : 1), cw = HD[1] * 1.42 * (fem ? 0.78 : 1), je = HD[2], span = vc - vt, tm = 0.42, K = rx / 0.155;
  var skin = ramp(pal(SKIN, f.sk), true), hcol = pal(HAIRC, f.hc), hair = ramp(hcol, false), dk = (hcol[0] + hcol[1] + hcol[2]) / 3 < 120;
  var lipc = pal(SKIN, f.sk), lips = ramp(fem ? [cl(lipc[0] * 0.86, 0, 255), lipc[1] * 0.42, lipc[2] * 0.46] : [lipc[0] * 0.80, lipc[1] * 0.60, lipc[2] * 0.58], true);
  var bgc = opt.bg === 'H' ? [92, 40, 44] : (opt.bg === 'N' ? [70, 70, 86] : [52, 96, 92]), bg = ramp(bgc, false);
  var iris = EYEC[EY[7]], garb = opt.gear || (opt.bg === 'H' ? [150, 30, 36] : [40, 70, 170]), gar = ramp(garb, false);
  var nk = rx * (fem ? 0.50 : 0.64), sy = vc + 0.045, slope = fem ? 0.26 : 0.30, shW = fem ? 0.40 : 0.48;
  var ve = vt + 0.455 * span, vn = vt + 0.66 * span + NS[1], vm = vt + 0.795 * span, eo = 0.066 * (rx / 0.155);
  var hw = function (v) { var t = (v - vt) / span; if (t < 0 || t > 1) return -1; if (t <= tm) { var q = (tm - t) / tm; return rx * Math.pow(Math.max(0, 1 - Math.pow(q, 2.5)), 0.5); } var p = (t - tm) / (1 - tm), w = lerp(rx, cw, Math.pow(p, je)); if (p > 0.84) { var e = (p - 0.84) / 0.16; w *= Math.sqrt(Math.max(0, 1 - e * e * 0.9)); } return w; };
  var put = function (x, y, c) { var i = (y * N + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  var hb = function (x, y, u, v, base) { var st = Math.sin((u - cx) * 150 + v * (HR[6] === 'curl' ? 90 : 14)) * 0.07, nz = (noise(x, y, 7) - 0.5) * 0.12; return base + st + nz - (u - cx) * 0.5; };
  var skc = (vt + tm * span), kind = HR[6];
  for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
    var u = (x + 0.5) / N, v = (y + 0.5) / N, du = u - cx, ad = Math.abs(du), c = null;
    // backdrop
    var bb = 0.50 - Math.sqrt(du * du + (v - 0.42) * (v - 0.42)) * 0.55 + (noise(x >> 1, y >> 1, 3) - 0.5) * 0.06; c = tone(bg, bb, x, y);
    // hair that hangs behind the head
    if (HR[4] > 0) {
      var bl = vt + HR[4] * span, bwid = rx + HR[5] + (kind === 'long' ? Math.max(0, v - ve) * 0.10 - Math.max(0, v - 0.80) * 0.35 : 0) + (kind === 'curl' ? Math.sin(v * 60) * 0.006 : 0);
      if (v > skc - 0.05 && v < bl && ad < bwid && (kind !== 'mullet' || v > ve)) { var fr = (bl - v) / 0.04; if (fr > 1 || noise(x, y, 5) < fr) c = tone(hair, hb(x, y, u, v, 0.38), x, y); }
    }
    // shoulders, neck, ears
    var shv = sy + Math.max(0, ad - nk) * slope + (ad > shW ? (ad - shW) * 2.2 : 0);
    if (v > shv && ad < 0.5) {
      var sb = 0.60 - du * 0.35 - Math.max(0, v - shv - 0.06) * 0.5 + (ad < nk + 0.02 ? -0.04 : 0); if (Math.abs(v - (sy + 0.085 + ad * 0.10)) < 0.006 && ad > 0.03 && ad < 0.20) sb -= 0.16;
      c = tone(skin, sb, x, y);
      if (fem ? v > 0.93 - ad * 0.10 && ad < 0.30 || (ad > 0.13 && ad < 0.165 && v > shv + 0.01) : false) c = tone(gar, 0.60 - du * 0.4, x, y);
    }
    if (ad < nk - Math.max(0, (v - sy)) * 0 && v > vc - 0.14 && v <= shv + 0.01) { var nb2 = 0.30 + cl((v - vc) / 0.10, 0, 1) * 0.30 - du * 0.9; c = tone(skin, nb2, x, y); }
    var hwe = hw(ve + 0.03), ee = (ad - hwe - 0.008) / 0.026, ev = (v - (ve + 0.03)) / 0.056; if (hwe > 0 && ee * ee + ev * ev < 1 && ad > hwe - 0.004) c = tone(skin, 0.50 - du * 0.5 - (ee < 0.2 ? 0.14 : 0), x, y);
    // the long-hair curtain falls in front of the shoulders
    if (kind === 'long' && v > ve + 0.02 && v < vt + HR[4] * span) { var cw2 = rx + HR[5] + (v - ve) * 0.10 - Math.max(0, v - 0.80) * 0.35 + Math.sin(v * 46 + du * 30) * 0.004, inner = Math.max(nk * 0.92, (hw(v) > 0 ? hw(v) : 0) * 0.98); if (ad < cw2 && ad > inner) { var fr2 = (vt + HR[4] * span - v) / 0.05; if (fr2 > 1 || noise(x, y, 5) < fr2) c = tone(hair, hb(x, y, u, v, 0.46 - (ad - inner) * 1.2), x, y); } }
    // head
    var w = hw(v);
    if (w > 0 && ad <= w) {
      var t = (v - vt) / span, nx = du / w, b = 0.68 - nx * 0.17 - (t - 0.5) * 0.10, an = Math.abs(nx);
      if (an > 0.68) b -= (an - 0.68) / 0.32 * (nx > 0 ? 0.34 : 0.20);
      b += Math.max(0, 0.10 - Math.sqrt((nx + 0.25) * (nx + 0.25) * 0.25 + (t - 0.20) * (t - 0.20)) * 0.5);
      if (t > 0.385 && t < 0.50 && an > 0.12 && an < 0.80) b -= 0.10;
      if (t > 0.50 && t < 0.63 && an > 0.38 && an < 0.74) b += 0.05;
      if (t > 0.70 && an > 0.52) b -= 0.07;
      if (t > 0.93) b -= (t - 0.93) * 2.0;
      c = tone(skin, b, x, y);
      // nose
      var NW = NS[0] * K * 0.92, bx = du - NS[3] * K * cl((t - 0.50) * 6, 0, 1) - NS[2] * K * Math.sin(cl((v - ve) / (vn - ve), 0, 1) * Math.PI);
      if (v > ve - 0.01 && v < vn - 0.010) { if (bx > 0.011 && bx < 0.028) c = tone(skin, b - 0.20, x, y); else if (bx > -0.012 && bx <= 0.005) c = tone(skin, b + 0.10, x, y); }
      var tx = bx / NW, ty = (v - (vn - 0.014)) / 0.027;
      if (tx * tx + ty * ty < 1) c = tone(skin, b + 0.08 - tx * 0.14 + (ty > 0.4 ? -0.10 : 0), x, y);
      if (v > vn + 0.004 && v < vn + 0.017 && Math.abs(bx) < NW * 0.95) c = tone(skin, b - 0.30, x, y);
      if (Math.abs(v - (vn + 0.001)) < 0.007 && Math.abs(Math.abs(bx) - NW * 0.62) < 0.007) c = skin[0];
      if (Math.abs(Math.abs(bx) - NW * 1.12) < 0.006 && v > vn - 0.026 && v < vn + 0.004) c = tone(skin, b - 0.16, x, y);
      // mouth
      var mw = 0.050 * K, mv = v - vm, am = Math.abs(du);
      if (am < mw * 0.90 * (1 - Math.abs(du) * 2) + 0.012 && mv > -0.019 && mv < -0.004 && am < mw * 0.9) c = tone(lips, 0.50 - nx * 0.2, x, y);
      if (am < mw * 0.74 && mv > 0.005 && mv < 0.022 - am * 0.12) c = tone(lips, 0.74 - nx * 0.2 - mv * 6, x, y);
      if (am < mw && Math.abs(mv + am * am * (opt.bg === 'H' ? -0.7 : 0.9)) < 0.0056) c = lips[1];
      if (am < mw * 0.5 && mv > 0.026 && mv < 0.036) c = tone(skin, b - 0.14, x, y);
      // eyes and brows
      for (var s = -1; s <= 1; s += 2) {
        var EW = EY[0] * K, EH = EY[1] * 1.3, ex = cx + s * eo, ey = ve, dx = (u - ex) / EW, dyy = (v - ey - EY[2] * (u - ex) * s * 8) / EH;
        var el = dx * dx + Math.pow(Math.abs(dyy), 1.7);
        if (el < 1) { c = [228 - (dx * s > 0 ? 18 : 0), 224 - (dx * s > 0 ? 18 : 0), 214]; var ir = Math.abs(u - ex + 0.002); if (ir < EW * 0.44) c = iris; if (ir < EW * 0.19 && Math.abs(dyy) < 0.7) c = [18, 14, 16]; if (dyy < -0.45) c = [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6]; }
        else if (Math.abs(dx) < 1.12 && dyy < 0 && el < 2.4 + (fem ? 1.2 : 0)) c = skin[0];
        else if (Math.abs(dx) < 1.0 && dyy > 0 && el < 2.0) c = tone(skin, b - 0.12, x, y);
        var bxn = (u - ex) / (EW * 1.38), vb = ey - EY[6] * 1.2 - EY[4] * (1 - bxn * bxn) - EY[5] * bxn * -s, bt = EY[3] * 1.2 * (fem ? 0.6 : 1) * (1 - Math.max(0, bxn * s) * 0.45);
        if (Math.abs(bxn) < 1 && Math.abs(v - vb) < bt / 2) c = tone(hair, dk ? 0.22 : 0.40, x, y);
      }
      // facial hair
      var jawd = 1 - an, low = t > 0.60, fh = f.fh, beard = false, fade = 1;
      var cheek = t > 0.52 + (1 - an) * 0.30;
      if (fh === 1 || fh === 9) { if (t > 0.60 && (cheek || t > 0.74) && !(am < mw * 0.8 && Math.abs(mv) < 0.022)) { if (noise(x, y, 11) < (fh === 9 ? 0.62 : 0.36)) c = tone(skin, b - 0.26, x, y); } }
      else if (fh === 2) beard = t > 0.80 && am < (0.050 + (t - 0.80) * 0.05) * K && mv > 0.024;
      else if (fh === 3) beard = t > 0.50 && jawd < 0.16 + (t > 0.9 ? 0.6 : 0) && (t < 0.9 || mv > 0.05);
      else if (fh === 4) beard = cheek && !(am < mw * 0.86 && mv > -0.020 && mv < 0.024);
      else if (fh === 5) beard = cheek && !(am < mw * 0.86 && mv > -0.020 && mv < 0.024);
      else if (fh === 6) beard = t > 0.44 && t < 0.80 && jawd < 0.30 - Math.max(0, t - 0.66) * 1.4;
      else if (fh === 7) beard = am < 0.016 * K && mv > 0.024 && mv < 0.060;
      else if (fh === 8) beard = am < mw * 1.25 && mv > -0.030 && t < 0.99 && !(am < mw * 0.80 && mv > -0.020 && mv < 0.024) && (am > mw * 0.80 || mv > 0.024);
      if (beard) c = tone(hair, hb(x, y, u, v, dk ? 0.30 : 0.46) - (t > 0.9 ? 0.08 : 0), x, y);
      // mustache
      var ms = f.ms, mu = v - (vm - 0.034), st2 = false;
      if (ms === 1) st2 = am < mw * 0.95 && Math.abs(mu + 0.003) < 0.0055;
      else if (ms === 2) st2 = am < mw * 1.0 && mu > -0.014 - 0 && mu < 0.006 + am * 0.10 && mu > -0.014 + am * 0.05;
      else if (ms === 3) st2 = (am < mw * 1.05 && mu > -0.012 && mu < 0.005) || (am >= mw * 0.95 && am < mw * 1.45 && Math.abs(mu + 0.006 + (am - mw) * 0.9) < 0.006);
      else if (ms === 4) st2 = (am < mw * 1.0 && mu > -0.013 && mu < 0.006) || (am > mw * 0.84 && am < mw * 1.14 && mu > -0.013 && mu < 0.125 && t < 0.985);
      else if (ms === 5) st2 = am < mw * 1.12 && mu > -0.015 && mu < 0.030 + am * 0.20;
      else if (ms === 6) st2 = (am < mw * 1.0 && mu > -0.011 && mu < 0.005) || (am >= mw * 0.9 && am < mw * 1.6 && Math.abs(mu + 0.004 + (am - mw * 0.9) * 0.55) < 0.0055);
      else if (ms === 7) st2 = am < mw * 0.62 && mu > -0.015 && mu < 0.007;
      else if (ms === 8) st2 = am < mw * 1.15 && Math.abs(mu + 0.004 - am * am * 3.2) < 0.0058;
      else if (ms === 9) st2 = am < mw * 1.2 && mu > -0.019 && mu < 0.016 + am * 0.12;
      if (st2) c = tone(hair, hb(x, y, u, v, dk ? 0.26 : 0.44), x, y);
    }
    // hair on top of the head
    if (kind !== 'bald') {
      var hl = vt + HR[2] * span, inCap = false, hbv = 0.50;
      if (kind === 'hawk') { inCap = ad < 0.040 && v > vt - HR[0] && v < hl + 0.01; if (!inCap && w > 0 && ad <= w && v < vt + 0.42 * span && v < hl + (ad / rx) * 0.10 && noise(x, y, 13) < 0.40) c = tone(skin, 0.36, x, y); hbv = 0.52; }
      else {
        var rxx = rx + HR[1], ryy = tm * span + HR[0], qx = du / rxx, qy = (v - skc) / ryy, inE = v <= skc ? (qx * qx + qy * qy < 1) : (ad < rxx);
        if (kind === 'flat') inE = (ad < rx + HR[1] && v > vt - HR[0] && v <= skc) || inE && v > vt;
        if (kind === 'curl') { var rr = 1 + Math.sin(Math.atan2(qy, qx) * 9) * 0.07; inE = v <= skc ? (qx * qx + qy * qy < rr * rr) : (ad < rxx + Math.sin(v * 70) * 0.008); }
        var line = hl + (kind === 'part' ? (du > -0.03 ? 0.035 + du * 0.15 : -0.012) : (kind === 'long' ? ad * 0.22 : (kind === 'slick' ? ad * 0.10 : (kind === 'crew' || kind === 'buzz' || kind === 'mullet' ? Math.max(0, 0.045 - ad) * 0.25 : ad * 0.04))));
        var sideLim = vt + HR[3] * span, onSide = w > 0 ? ad > w * (kind === 'long' ? 0.74 : 0.86) : true;
        inCap = inE && (v < line || (onSide && v < sideLim) || (kind === 'long' && ad > (w > 0 ? w * 0.80 : 0) && v < sideLim + 0.2));
        if (kind === 'buzz') { if (inCap && (w > 0 && ad <= w + 0.004)) { c = noise(x, y, 13) < 0.72 ? tone(hair, 0.42 - du * 0.5, x, y) : c; } inCap = false; }
        hbv = 0.50 + (kind === 'slick' ? 0.10 * Math.cos((v - vt) * 40) : 0) + (Math.abs(qy + 0.55) < 0.14 ? 0.12 : 0);
        if (kind === 'part' && Math.abs(du + 0.03) < 0.006 && v < hl + 0.02 && inCap) hbv -= 0.3;
      }
      if (inCap) c = tone(hair, hb(x, y, u, v, hbv), x, y);
    }
    put(x, y, c);
  }
  ctx.putImageData(img, 0, 0);
}

export { N, draw, derive, norm, NAMES, PARTS };
