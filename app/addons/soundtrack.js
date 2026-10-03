/* Soundtrack add-on. Self-contained: its own audio and its own Jukebox window. build.js appends this file to the page as it is.
   The Music button is drawn by the interface, at the right-hand end of the top bar: any element with data-jk="open" opens the Jukebox. */
(function () {
var AC = null;
/* ---------- soundtrack: a small rock band synthesised in the browser, sequenced like a MIDI file ---------- */
var MKEY = 'gorilla-position-music';
var MP = (function () { var o = {}; try { o = JSON.parse(localStorage.getItem(MKEY) || '{}') || {}; } catch (e) {} return { on: o.on !== false, vol: o.vol != null ? +o.vol : 0.6, off: o.off || {}, cur: o.cur || '', shuf: !!o.shuf }; })();
function musMark() { try { document.documentElement.setAttribute('data-music', MP.on ? 'on' : 'off'); } catch (e) {} }
function saveMus() { try { localStorage.setItem(MKEY, JSON.stringify(MP)); } catch (e) {} musMark(); }
var STD_S = '....x.......x...', H8 = 'x.x.x.x.x.x.x.x.';
var TRACKS = [
  { id: 'main', n: 'Main Event', d: 'Driving hard rock', bpm: 144, root: 40, sc: 'min', form: 'AABBAABBCCBB', sec: {
    A: { ch: [0, 0, 3, -2], g: 'x.xxX-x.xxX-x.xx', k: 'x.....x.x.x.....', s: STD_S, h: H8 },
    B: { ch: [-4, -2, 0, 0], g: 'X-----X-X-----xx', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['8-8-7-8-', '9-7---4-', '8---5-7-', '8-----..'] },
    C: { ch: [0, -4, 3, -2], g: 'X---X---X-x-X-x-', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['5-8-a-8-', '8-a-8-6-', 'a-9-a-c-', 'b-9-7-9-'] } } },
  { id: 'heel', n: 'Heel Turn', d: 'Slow, heavy and mean', bpm: 96, root: 38, sc: 'min', form: 'AABBAACCBB', sec: {
    A: { ch: [0, 0, 1, 0], g: 'X--.x.x.X--.xxx.', k: 'x.....x...x.....', s: '........x.......', h: H8 },
    B: { ch: [0, -2, -4, -5], g: 'X-------X---x.x.', k: 'x.....x...x.....', s: '........x.......', h: H8, l: ['5---8---', '7---4---', '6---8-6-', '5-------'] },
    C: { ch: [0, 3, 5, 1], g: 'x.x.x.x.X---X---', k: 'x...x...x...x...', s: STD_S, h: H8, l: ['1-3-5-3-', '3-5-7-5-', '4-6-8-6-', '6-4-6-4-'] } } },
  { id: 'runin', n: 'Run-In', d: 'Fast punk sprint', bpm: 176, root: 45, sc: 'min', form: 'AABBAABBCCBB', sec: {
    A: { ch: [0, 0, -4, -2], g: 'x.x.x.x.x.x.x.x.', k: 'x.....x.x.....x.', s: STD_S, h: H8 },
    B: { ch: [3, -2, 0, -4], g: 'X-x.X-x.X-x.X-x.', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['5-7-a-7-', '9-7-9-b-', '8-a-c-a-', '8---6---'] },
    C: { ch: [0, -2, -4, -5], g: 'X-------X-------', k: 'x.......x.x.....', s: STD_S, h: 'x...x...x...x...', l: ['8-7-5-7-', '7-5-4-5-', '6-5-3-5-', '5---7---'] } } },
  { id: 'pop', n: 'Saturday Night Pop', d: 'Arena anthem, major key', bpm: 128, root: 43, sc: 'maj', form: 'AABBAACCBB', sec: {
    A: { ch: [0, 5, 0, 7], g: 'X-x.x.X-x.x.X-x.', k: 'x.......x.x.....', s: STD_S, h: H8 },
    B: { ch: [5, 7, 0, -3], g: 'X-----x.X-----x.', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['8-8-6-8-', '9-9-7-5-', '8-a-8-5-', '6---8---'] },
    C: { ch: [0, 7, 5, 7], g: 'X---X---X-x-X-x-', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['5-6-8-6-', '5-7-9-7-', '8-9-a-8-', '9-------'] } } },
  { id: 'cage', n: 'Steel Cage', d: 'Galloping metal', bpm: 152, root: 40, sc: 'min', form: 'AABBAACCBB', sec: {
    A: { ch: [0, 0, 0, 1], g: 'x.xxx.xxx.xxx.xx', k: 'x.x.x.x.x.x.x.x.', s: STD_S, h: 'x...x...x...x...' },
    B: { ch: [0, 3, 5, 3], g: 'X--x..X--x..X-x-', k: 'x..x..x.x..x..x.', s: STD_S, h: H8, l: ['8-a-c-a-', 'a-9-a-c-', '8-b-8-6-', '7-9-a-9-'] },
    C: { ch: [-4, -2, -4, -2], g: 'X-----x.X-----x.', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['8---a---', '9---b---', '8-a-c-a-', 'b-9-7---'] } } },
  { id: 'come', n: 'Comeback Kid', d: 'Bright, uplifting rocker', bpm: 136, root: 45, sc: 'maj', form: 'AABBAACCBB', sec: {
    A: { ch: [0, -3, 5, 7], g: 'x.x.x.x.x.x.X-x.', k: 'x.....x.x.x.....', s: STD_S, h: H8 },
    B: { ch: [5, 7, 0, 0], g: 'X-----X-X-----xx', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['6-8-6-4-', '5-7-9-7-', '8---5-8-', 'a-9-8---'] },
    C: { ch: [-3, 5, 0, 7], g: 'X---X---X-x-X-x-', k: 'x.....x.x.....x.', s: STD_S, h: H8, l: ['6-8-a-8-', '6-8-b-8-', '5-8-a-8-', '9-7-5---'] } } }
];
var SCALES = { min: [0, 2, 3, 5, 7, 8, 10], maj: [0, 2, 4, 5, 7, 9, 11] };
var MUS = { playing: false, tr: null, pos: 0, nt: 0, timer: null, out: null };
function mhz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function musTrack(id) { for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i]; return null; }
function musList() { var l = TRACKS.filter(function (t) { return !MP.off[t.id]; }); return l.length ? l : TRACKS; }
function musSetup() {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  if (MUS.out) return;
  var comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.connect(AC.destination);
  MUS.out = AC.createGain(); MUS.out.gain.value = MP.vol * 0.55; MUS.out.connect(comp);
  var curve = new Float32Array(1024), i; for (i = 0; i < 1024; i++) curve[i] = Math.tanh(7 * (i / 511.5 - 1));
  var sh = AC.createWaveShaper(); sh.curve = curve; sh.oversample = '2x';
  var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
  var gg = AC.createGain(); gg.gain.value = 0.17; sh.connect(hp); hp.connect(lp); lp.connect(gg); gg.connect(MUS.out); MUS.gtr = sh;
  var n = AC.sampleRate, buf = AC.createBuffer(1, n, n), ch = buf.getChannelData(0); for (i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1; MUS.noise = buf;
}
function mVoice(type, f, t, dur, vol, dest, det) {
  var o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol, t + Math.max(0.01, dur - 0.03)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02); return o;
}
function mNoise(t, dur, vol, type, freq) {
  var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = MUS.noise; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(MUS.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function mKick(t) { var o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.11); g.gain.setValueAtTime(0.95, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(MUS.out); o.start(t); o.stop(t + 0.22); }
function mSnare(t, v) { mNoise(t, 0.16, 0.5 * v, 'bandpass', 1900); var o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08); g.gain.setValueAtTime(0.35 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); o.connect(g); g.connect(MUS.out); o.start(t); o.stop(t + 0.12); }
function runLen(p, i, unit) { var n = 1; while (i + n < p.length && p.charAt(i + n) === '-') n++; return n * unit; }
function musStep(t) {
  var tr = MUS.tr, sd = 60 / tr.bpm / 4, pos = MUS.pos, s = pos % 16, bar = Math.floor(pos / 16), si = Math.floor(bar / 4), sec = tr.sec[tr.form.charAt(si)], b = bar % 4;
  var nextSec = tr.form.charAt(si + 1) || tr.form.charAt(0), fill = b === 3 && s >= 12 && nextSec !== tr.form.charAt(si), root = tr.root + sec.ch[b], c;
  if (s === 0 && b === 0) mNoise(t, 1.1, 0.22, 'highpass', 5000);
  if (sec.k.charAt(s) === 'x') mKick(t);
  if (fill) mSnare(t, 0.7 + 0.1 * (s - 12)); else if (sec.s.charAt(s) === 'x') mSnare(t, 1);
  c = sec.h.charAt(s); if (c === 'x') mNoise(t, 0.045, 0.13, 'highpass', 7500);
  c = sec.g.charAt(s);
  if (c === 'x' || c === 'X') {
    var d = c === 'X' ? runLen(sec.g, s, sd) * 0.96 : sd * 0.8, f = mhz(root);
    mVoice('sawtooth', f, t, d, 0.5, MUS.gtr, -4); mVoice('sawtooth', f * 1.4983, t, d, 0.42, MUS.gtr, 5); if (c === 'X') mVoice('sawtooth', f * 2, t, d, 0.3, MUS.gtr, 3);
  }
  if (s % 2 === 0) {
    var bo = mVoice('triangle', mhz(root - 12), t, sd * 1.8, 0.5, MUS.out); mVoice('square', mhz(root - 12), t, sd * 1.8, 0.07, MUS.out);
    if (sec.l) {
      c = sec.l[b].charAt(s / 2);
      if (c !== '.' && c !== '-') {
        var deg = parseInt(c, 36) - 1, sc = SCALES[tr.sc], m = tr.root + 24 + sc[deg % 7] + 12 * Math.floor(deg / 7), ld = runLen(sec.l[b], s / 2, sd * 2) * 0.94;
        var lo = mVoice('square', mhz(m), t, ld, 0.085, MUS.out); mVoice('sawtooth', mhz(m), t, ld, 0.05, MUS.out, 9);
        if (ld > sd * 3) { var v = AC.createOscillator(), vg = AC.createGain(); v.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(14, t + ld); v.connect(vg); vg.connect(lo.detune); v.start(t); v.stop(t + ld + 0.02); }
      }
    }
  }
  MUS.pos++;
  if (MUS.pos >= tr.form.length * 64) { MUS.pos = 0; var l = musList(); if (l.length > 1 || l[0] !== tr) { musPick(musNextId()); return sd; } }
  return sd;
}
function musNextId() {
  var l = musList(), i = l.indexOf(MUS.tr);
  if (MP.shuf && l.length > 1) { var o = l.filter(function (x) { return x !== MUS.tr; }); return o[Math.floor(Math.random() * o.length)].id; }
  return l[(i + 1) % l.length].id;
}
function musPick(id) {
  MUS.tr = musTrack(id) || musList()[0]; MUS.pos = 0; MP.cur = MUS.tr.id; saveMus();
  if (JK.open) setTimeout(jkRender, 0);
}
function musTick() {
  if (!MUS.playing) return;
  try { if (MUS.nt < AC.currentTime) MUS.nt = AC.currentTime + 0.05; while (MUS.nt < AC.currentTime + 0.18) MUS.nt += musStep(MUS.nt); } catch (e) {}
}
function musStart(id) {
  try {
    musSetup(); if (AC.state === 'suspended') AC.resume();
    if (id || !MUS.tr) musPick(id || (musTrack(MP.cur) && !MP.off[MP.cur] ? MP.cur : musList()[0].id));
    MUS.out.gain.cancelScheduledValues(AC.currentTime); MUS.out.gain.setValueAtTime(MP.vol * 0.55, AC.currentTime);
    MUS.nt = AC.currentTime + 0.08; MUS.playing = true; clearInterval(MUS.timer); MUS.timer = setInterval(musTick, 25); musTick();
  } catch (e) {}
}
function musStop() { MUS.playing = false; clearInterval(MUS.timer); try { if (MUS.out) { MUS.out.gain.cancelScheduledValues(AC.currentTime); MUS.out.gain.setTargetAtTime(0, AC.currentTime, 0.04); } } catch (e) {} }
function musGesture() { if (MP.on && !MUS.playing && !document.hidden) musStart(); }
document.addEventListener('pointerdown', musGesture, true);
document.addEventListener('keydown', musGesture, true);
document.addEventListener('visibilitychange', function () { if (document.hidden) { if (MUS.playing) musStop(); } else if (MP.on && MUS.out) musStart(); });

var JK = { open: false, root: null, last: null };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function jukeHtml() {
  var volb = [[0.3, 'Low'], [0.6, 'Medium'], [1, 'High']].map(function (o) { var on = Math.abs(MP.vol - o[0]) < 0.01; return '<button class="btn sm' + (on ? ' on' : '') + '" data-jk="vol" data-v="' + o[0] + '"' + (on ? ' aria-pressed="true"' : '') + '>' + o[1] + '</button>'; }).join('');
  var cur = MUS.tr && MP.on ? MUS.tr.id : '';
  return '<div class="row"><button class="btn' + (MP.on ? ' on' : '') + '" data-jk="toggle" aria-pressed="' + (MP.on ? 'true' : 'false') + '">Music ' + (MP.on ? 'On' : 'Off') + '</button><button class="btn sm" data-jk="next">Next track</button><button class="btn sm' + (MP.shuf ? ' on' : '') + '" data-jk="shuf" aria-pressed="' + (MP.shuf ? 'true' : 'false') + '">Shuffle ' + (MP.shuf ? 'On' : 'Off') + '</button></div>' +
    '<div class="row" style="margin-top:6px"><span>Volume</span>' + volb + '</div>' +
    '<p class="muted" style="margin-top:8px">Play any track now, or switch tracks in and out of the rotation. Only tracks in the rotation come up on their own.</p>' +
    '<ul class="list" style="margin-top:6px">' + TRACKS.map(function (t, i) {
      var inr = !MP.off[t.id], now = t.id === cur;
      return '<li><span><b>' + (now ? '♫ ' : '') + (i + 1) + '. ' + esc(t.n) + '</b>' + (now ? ' <span class="good">now playing</span>' : '') + '<br><span class="muted">' + esc(t.d) + ' · ' + t.bpm + ' BPM</span></span><span class="row"><button class="btn sm" data-jk="play" data-v="' + t.id + '">Play</button><button class="btn sm' + (inr ? ' on' : '') + '" data-jk="rot" data-v="' + t.id + '" aria-pressed="' + (inr ? 'true' : 'false') + '">' + (inr ? 'In rotation' : 'Skipped') + '</button></span></li>';
    }).join('') + '</ul>';
}
function jkRender() {
  if (!JK.root) return;
  var foc = document.activeElement && JK.root.contains(document.activeElement) ? document.activeElement : null, key = foc ? [foc.getAttribute('data-jk'), foc.getAttribute('data-v')] : null;
  JK.root.innerHTML = JK.open ? '<div class="scrim jk"><div class="win" role="dialog" aria-modal="true" aria-label="Jukebox"><div class="wt"><span>Jukebox</span><button data-jk="close" aria-label="Close">[■]</button></div><div class="wb">' + jukeHtml() + '</div><div class="wf"><button class="btn go" data-jk="close">Done</button><span class="muted opt">Esc closes</span></div></div></div>' : '';
  if (JK.open) { var el = key && JK.root.querySelector('[data-jk="' + key[0] + '"]' + (key[1] != null ? '[data-v="' + key[1] + '"]' : '')); (el || JK.root.querySelector('.wf .btn')).focus(); }
}
function jkOpen(on) { if (on === JK.open) return; JK.open = on; if (on) JK.last = document.activeElement; jkRender(); if (!on && JK.last && JK.last.focus) try { JK.last.focus(); } catch (e) {} }
function jkAct(a, v) {
  if (a === 'open') { jkOpen(true); return; }
  if (a === 'close') { jkOpen(false); return; }
  if (a === 'toggle') { MP.on = !MP.on; if (MP.on) musStart(); else musStop(); }
  else if (a === 'play') { MP.on = true; musStart(v); }
  else if (a === 'next') { MP.on = true; if (!MUS.tr) musStart(); else musStart(musNextId()); }
  else if (a === 'rot') { if (MP.off[v]) delete MP.off[v]; else MP.off[v] = 1; }
  else if (a === 'shuf') { MP.shuf = !MP.shuf; }
  else if (a === 'vol') { MP.vol = +v; try { if (MUS.out && MUS.playing) MUS.out.gain.setTargetAtTime(MP.vol * 0.55, AC.currentTime, 0.03); } catch (e) {} }
  saveMus(); jkRender();
}
function jkBoot() {
  var st = document.createElement('style');
  st.textContent = '.jk.scrim{z-index:40}.jk .btn.on{background:var(--yellow);color:var(--k)}.jk .list li{align-items:center}';
  document.head.appendChild(st);
  JK.root = document.createElement('div'); document.body.appendChild(JK.root);
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-jk]'); if (t) { e.stopPropagation(); jkAct(t.getAttribute('data-jk'), t.getAttribute('data-v')); } else if (JK.open && e.target.classList && e.target.classList.contains('jk')) jkOpen(false); }, true);
  document.addEventListener('keydown', function (e) {
    if (!JK.open) return;
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack' || e.key === 'GoBack') { e.preventDefault(); e.stopPropagation(); jkOpen(false); return; }   // Back on a TV remote closes it too
    var bs = Array.prototype.slice.call(JK.root.querySelectorAll('button')), i = bs.indexOf(document.activeElement);
    if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); bs[(i + (e.shiftKey ? bs.length - 1 : 1)) % bs.length].focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); bs[(i + bs.length - 1) % bs.length].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) jkAct(bs[i].getAttribute('data-jk'), bs[i].getAttribute('data-v')); }
    e.stopPropagation();
  }, true);
}
jkBoot(); musMark();
window.EWF_MUSIC = { tracks: TRACKS, state: MUS, start: musStart, stop: musStop, setup: musSetup, ctx: function () { return AC; } };
})();
