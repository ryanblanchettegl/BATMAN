/* Soundtrack add-on. Self-contained: its own audio and its own Jukebox window. build.js appends this file to the page as it is,
   after music-notes.js (the pieces, window.EWF_MUSIC_DATA). Each instrument is a file of its own beside the page,
   music/<instrument>.js, loaded the first time a piece needs it. Both are written by tools/music/build-music.py.
   Fourteen mellow classical pieces from real scores (the Mutopia Project), each with the instruments it was written for,
   played note by note by recorded players: the string sections, double bass and solo violin of the Versilian Studios
   Chamber Orchestra 2 (held, short and plucked, at two loudness levels, with alternate takes), the Salamander grand piano
   at four loudness levels, and a harpsichord and solo cello, through a concert-hall reverb. Ryan, 22 October: quiet
   background music by default, louder as a choice; the pieces play in a random order, the first one too.
   Credits: tools/music/CREDITS.md. The Music button is drawn by the interface: any element with data-jk="open" opens the Jukebox. */
(function () {
var D = window.EWF_MUSIC_DATA || { inst: [], pieces: [] };
var AC = null;
var MKEY = 'gorilla-position-music';
/* Ryan, 22 October: quiet background music by default; louder is a choice. A level kept from the old soundtrack (no v2) starts Low. */
var LEVELS = [[0.15, 'Low'], [0.4, 'Medium'], [1, 'Loud']];
var MP = (function () { var o = {}; try { o = JSON.parse(localStorage.getItem(MKEY) || '{}') || {}; } catch (e) {} return { on: o.on !== false, vol: o.v2 && o.vol != null ? +o.vol : 0.15, off: o.v2 ? (o.off || {}) : {}, cur: '' }; })();
function musMark() { try { document.documentElement.setAttribute('data-music', MP.on ? 'on' : 'off'); } catch (e) {} }
function saveMus() { try { localStorage.setItem(MKEY, JSON.stringify({ on: MP.on, vol: MP.vol, off: MP.off, v2: 1 })); } catch (e) {} musMark(); }
var TRACKS = D.pieces;
var MOODS = ['Strings', 'Piano', 'Harpsichord'];
var MUS = { playing: false, tr: null, t0: 0, ix: 0, timer: null, out: null, bus: null, parts: [], voices: [], played: [], gen: 0 };
var BUF = {};    // instrument -> decoded AudioBuffer
var IM = {};     // instrument -> what its samples are (from music/<instrument>.js)
var NOTES = {};  // piece id -> its notes, unpacked

function musTrack(id) { for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i]; return null; }
function musList() { var l = TRACKS.filter(function (t) { return !MP.off[t.id]; }); return l.length ? l : TRACKS; }
/* the next piece: always at random, never the one just heard, and not one of the last few while others are left */
function musNextId() {
  var l = musList(); if (!l.length) return null;
  var fresh = l.filter(function (t) { return MUS.played.indexOf(t.id) < 0 && t !== MUS.tr; });
  if (!fresh.length) { MUS.played = MUS.tr ? [MUS.tr.id] : []; fresh = l.filter(function (t) { return t !== MUS.tr; }); }
  if (!fresh.length) fresh = l;
  return fresh[Math.floor(Math.random() * fresh.length)].id;
}

/* ---------- the hall: every part has its own level and place, all into one bus, a dry path and a reverb ---------- */
function hallIR(sec) {
  var n = Math.floor(AC.sampleRate * sec), b = AC.createBuffer(2, n, AC.sampleRate);
  for (var c = 0; c < 2; c++) {
    var d = b.getChannelData(c), lp = 0;
    for (var i = 0; i < n; i++) { var t = i / n, x = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6); lp += (x - lp) * (0.28 + 0.5 * (1 - t)); d[i] = i < AC.sampleRate * 0.012 ? 0 : lp; }
  }
  return b;
}
function musSetup() {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  if (MUS.out) return;
  var comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3; comp.connect(AC.destination);
  MUS.out = AC.createGain(); MUS.out.gain.value = MP.vol * 0.9; MUS.out.connect(comp);
  MUS.bus = AC.createGain(); MUS.bus.gain.value = 1;
  var dry = AC.createGain(); dry.gain.value = 0.82; MUS.bus.connect(dry); dry.connect(MUS.out);
  var rv = AC.createConvolver(); rv.buffer = hallIR(2.6); var wet = AC.createGain(); wet.gain.value = 0.34; MUS.bus.connect(rv); rv.connect(wet); wet.connect(MUS.out);
}

/* ---------- instruments: a script beside the page each, one packed Opus file inside, decoded the first time a piece needs it ---------- */
function b64bytes(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function fetchInst(k) {
  return new Promise(function (ok) {
    var have = window.EWF_MUSIC_INST && window.EWF_MUSIC_INST[k]; if (have || IM[k]) { ok(have || null); return; }
    var sc = document.createElement('script'); sc.src = 'music/' + k + '.js'; sc.onload = function () { ok(window.EWF_MUSIC_INST && window.EWF_MUSIC_INST[k]); }; sc.onerror = function () { ok(null); };
    document.head.appendChild(sc);
  });
}
function loadInst(k) {
  if (BUF[k]) return Promise.resolve(BUF[k]);
  return fetchInst(k).then(function (raw) {
    if (raw) IM[k] = { n: raw.n, att: raw.att, rel: raw.rel, arts: raw.arts, b64: raw.b64 };
    var I = IM[k]; if (!I || !I.b64) return null;
    return new Promise(function (ok) {
      var done = function (b) { if (b) BUF[k] = b; ok(b || null); };
      try { var p = AC.decodeAudioData(b64bytes(I.b64), done, function () { ok(null); }); if (p && p.then) p.then(done, function () { ok(null); }); }
      catch (e) { ok(null); }
    });
  });
}
function unpack(tr) {
  if (NOTES[tr.id]) return NOTES[tr.id];
  var by = new Uint8Array(b64bytes(tr.notes)), n = tr.count, T = new Float32Array(n), L = new Float32Array(n), K = new Uint8Array(n), V = new Uint8Array(n), P = new Uint8Array(n), Z = new Uint8Array(n), i = 0, j = 0, t = 0;
  function vi() { var v = 0, s = 0, b; do { b = by[i++]; v |= (b & 127) << s; s += 7; } while (b & 128); return v; }
  for (j = 0; j < n; j++) { t += vi(); T[j] = t / 100; L[j] = vi() / 100; K[j] = by[i++]; V[j] = by[i++]; P[j] = by[i++]; Z[j] = by[i++]; }
  return (NOTES[tr.id] = { t: T, l: L, k: K, v: V, p: P, z: Z, n: n });
}

/* ---------- one note, the way a player plays it: plucked where the score says pizzicato, short notes bowed short (spiccato),
   the rest held; the recording made at the loudness asked for; the nearest recorded note, tuned the rest of the way; a
   different take each time a short note repeats; a long note held by looping the steady middle of the recording ---------- */
function playNote(part, k, vel, t, len, pz) {
  var I = IM[part.i], buf = BUF[part.i]; if (!I || !buf || !part.node) return;
  var arts = I.arts, art = pz && arts.pizz ? 'pizz' : (len < 0.3 && arts.spic ? 'spic' : 'sus'), A = arts[art];
  // played by people: a few milliseconds either side of the beat, a little louder or softer, each section a hair apart in tune
  t += (Math.random() - 0.5) * 0.014; vel = Math.max(1, Math.min(127, vel * (0.93 + Math.random() * 0.14)));
  var li = Math.min(A.nl - 1, Math.floor(Math.pow(vel / 127, 1.15) * A.nl)), S = A.s, best = null, bd = 99, i;
  for (i = 0; i < S.length; i++) { var d = Math.abs(S[i][0] - k) + (S[i][1] === li ? 0 : 0.6 + Math.abs(S[i][1] - li)); if (d < bd) { bd = d; best = S[i]; } }
  var takes = S.filter(function (x) { return x[0] === best[0] && x[1] === best[1]; });
  if (takes.length > 1) { part.rr = (part.rr || 0) + 1; best = takes[part.rr % takes.length]; }
  var rate = Math.pow(2, (k - best[0]) / 12), off = best[3], src = AC.createBufferSource(), g = AC.createGain();
  src.buffer = buf; src.playbackRate.value = rate;
  if (src.detune) src.detune.value = (part.det || 0) + (part.i === 'piano' || part.i === 'harpsichord' ? 0 : (Math.random() - 0.5) * 4);
  var lvl = Math.pow(vel / 127, 0.9) * part.g * 0.3 / Math.max(0.2, best[4]), att = (art === 'sus' ? I.att : 0.004) * (0.85 + Math.random() * 0.3), rel = art === 'sus' ? I.rel : 0.12, end = t + len;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + att);
  if (A.loop) {
    if (len > A.loop[1] / rate) { src.loop = true; src.loopStart = off + A.loop[0]; src.loopEnd = off + A.loop[1]; }
    g.gain.setValueAtTime(lvl, Math.max(t + att, end)); g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    src.connect(g); g.connect(part.node); src.start(t, off, src.loop ? undefined : A.len); src.stop(end + rel + 0.05);
  } else {
    var ring = Math.min(A.len / rate, Math.max(len, art === 'sus' ? 0 : 0.2) + rel);
    g.gain.setValueAtTime(lvl, Math.max(t + att, Math.min(end, t + ring - 0.02))); g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
    src.connect(g); g.connect(part.node); src.start(t, off, A.len); src.stop(t + ring + 0.05);
  }
  MUS.voices.push(src); if (MUS.voices.length > 500) MUS.voices.splice(0, 100);
}

/* ---------- the score: notes are put on the clock a quarter of a second ahead ---------- */
function musTick() {
  if (!MUS.playing || !MUS.tr || MUS.loading) return;
  var N = unpack(MUS.tr), now = AC.currentTime, until = now + 0.25 - MUS.t0;
  try {
    while (MUS.ix < N.n && N.t[MUS.ix] < until) {
      var j = MUS.ix++, part = MUS.parts[N.p[j]];
      if (part && MUS.t0 + N.t[j] >= now - 0.05) playNote(part, N.k[j], N.v[j], MUS.t0 + N.t[j], N.l[j], N.z[j]);
    }
  } catch (e) {}
  if (MUS.ix >= N.n && now > MUS.t0 + MUS.tr.dur + 3) musPlay(musNextId());
}
function musPlay(id) {
  var tr = musTrack(id) || musTrack(musNextId()); if (!tr) return;
  musSilence();
  MUS.tr = tr; MP.cur = tr.id; MUS.ix = 0; MUS.played.push(tr.id); if (MUS.played.length > 8) MUS.played.shift();
  MUS.parts = tr.parts.map(function (p) { var g = AC.createGain(), pan = AC.createStereoPanner ? AC.createStereoPanner() : null; g.gain.value = 1; if (pan) { pan.pan.value = p.p; g.connect(pan); pan.connect(MUS.bus); } else g.connect(MUS.bus); return { i: p.i, g: p.g, node: g, det: p.i === 'piano' || p.i === 'harpsichord' ? 0 : (Math.random() - 0.5) * 8 }; });
  var gen = ++MUS.gen, need = []; tr.parts.forEach(function (p) { if (need.indexOf(p.i) < 0) need.push(p.i); });
  MUS.loading = true;
  Promise.all(need.map(loadInst)).then(function () {
    if (gen !== MUS.gen) return;
    MUS.loading = false; MUS.t0 = AC.currentTime + 0.3; musTick();
    // instruments this piece does not use are let go, so memory holds only what is playing
    Object.keys(BUF).forEach(function (k) { if (need.indexOf(k) < 0) delete BUF[k]; });
  });
  try { window.dispatchEvent(new CustomEvent('ewf-track', { detail: { name: tr.n + ' (' + tr.c + ')' } })); } catch (e) {}
  if (JK.open) setTimeout(jkRender, 0);
}
function musSilence() {
  MUS.voices.forEach(function (v) { try { v.stop(); } catch (e) {} }); MUS.voices = [];
  MUS.parts.forEach(function (p) { try { p.node.disconnect(); } catch (e) {} }); MUS.parts = [];
}
function musStart(id) {
  try {
    musSetup(); if (AC.state === 'suspended') AC.resume();
    MUS.out.gain.cancelScheduledValues(AC.currentTime); MUS.out.gain.setValueAtTime(MP.vol * 0.9, AC.currentTime);
    MUS.playing = true; clearInterval(MUS.timer); MUS.timer = setInterval(musTick, 30);
    if (id || !MUS.tr) musPlay(id || musNextId());
    else { MUS.t0 = AC.currentTime + 0.2 - (MUS.tr && MUS.ix ? unpack(MUS.tr).t[MUS.ix] : 0); musTick(); }
  } catch (e) {}
}
function musStop() { MUS.playing = false; clearInterval(MUS.timer); musSilence(); try { if (MUS.out) { MUS.out.gain.cancelScheduledValues(AC.currentTime); MUS.out.gain.setTargetAtTime(0, AC.currentTime, 0.05); } } catch (e) {} }
function musGesture() { if (MP.on && !MUS.playing && !document.hidden && TRACKS.length) musStart(); }
document.addEventListener('pointerdown', musGesture, true);
document.addEventListener('keydown', musGesture, true);
document.addEventListener('visibilitychange', function () { if (document.hidden) { if (MUS.playing) musStop(); } else if (MP.on && MUS.out) musStart(); });

/* ---------- the Jukebox ---------- */
var JK = { open: false, root: null, last: null };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function mins(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
function jukeHtml() {
  var volb = LEVELS.map(function (o) { var on = Math.abs(MP.vol - o[0]) < 0.01; return '<button class="btn sm' + (on ? ' on' : '') + '" data-jk="vol" data-v="' + o[0] + '"' + (on ? ' aria-pressed="true"' : '') + '>' + o[1] + '</button>'; }).join('');
  var cur = MUS.tr && MP.on ? MUS.tr.id : '';
  return '<div class="row"><button class="btn' + (MP.on ? ' on' : '') + '" data-jk="toggle" aria-pressed="' + (MP.on ? 'true' : 'false') + '">Music ' + (MP.on ? 'On' : 'Off') + '</button><button class="btn sm" data-jk="next">Next piece</button></div>' +
    '<div class="row" style="margin-top:6px"><span>Volume</span>' + volb + '</div>' +
    '<p class="muted" style="margin-top:8px">The pieces play in a random order. Play any one now, or take it out of the rotation.</p>' +
    '<div class="jk-list">' + MOODS.map(function (m) {
      var L = TRACKS.filter(function (t) { return t.mood === m; }); if (!L.length) return '';
      return '<p class="eyebrow" style="margin:8px 0 2px">' + esc(m) + '</p><ul class="list">' + L.map(function (t) {
        var inr = !MP.off[t.id], now = t.id === cur;
        return '<li><span><b>' + (now ? '♫ ' : '') + esc(t.n) + '</b> <span class="muted">' + esc(t.c) + ' · ' + mins(t.dur) + '</span>' + (now ? ' <span class="good">now playing</span>' : '') +
          '<br><span class="muted" style="font-size:.85em">Score typeset by ' + esc(t.by) + '</span></span><span class="row"><button class="btn sm" data-jk="play" data-v="' + t.id + '">Play</button><button class="btn sm' + (inr ? ' on' : '') + '" data-jk="rot" data-v="' + t.id + '" aria-pressed="' + (inr ? 'true' : 'false') + '">' + (inr ? 'In rotation' : 'Left out') + '</button></span></li>';
      }).join('') + '</ul>';
    }).join('') + '</div>' +
    '<p class="muted" style="margin-top:8px;font-size:.85em">' + esc(D.credit || '') + '</p>';
}
function jkRender() {
  if (!JK.root) return;
  var foc = document.activeElement && JK.root.contains(document.activeElement) ? document.activeElement : null, key = foc ? [foc.getAttribute('data-jk'), foc.getAttribute('data-v')] : null;
  var sc = JK.root.querySelector('.jk-list'), top = sc ? sc.scrollTop : 0;
  JK.root.innerHTML = JK.open ? '<div class="scrim jk"><div class="win" role="dialog" aria-modal="true" aria-label="Jukebox"><div class="wt"><span>Jukebox</span><button data-jk="close" aria-label="Close">[■]</button></div><div class="wb">' + jukeHtml() + '</div><div class="wf"><button class="btn" data-jk="close">Done</button></div></div></div>' : '';
  sc = JK.root.querySelector('.jk-list'); if (sc) sc.scrollTop = top;
  if (JK.open) { var el = key && JK.root.querySelector('[data-jk="' + key[0] + '"]' + (key[1] != null ? '[data-v="' + key[1] + '"]' : '')); (el || JK.root.querySelector('.wf .btn')).focus(); }
}
function jkOpen(on) { if (on === JK.open) return; JK.open = on; if (on) JK.last = document.activeElement; jkRender(); if (!on && JK.last && JK.last.focus) try { JK.last.focus(); } catch (e) {} }
function jkAct(a, v) {
  if (a === 'open') { jkOpen(true); return; }
  if (a === 'close') { jkOpen(false); return; }
  if (a === 'toggle') { MP.on = !MP.on; if (MP.on) musStart(); else musStop(); }
  else if (a === 'play') { MP.on = true; musStart(v); }
  else if (a === 'next') { MP.on = true; musStart(musNextId()); }
  else if (a === 'rot') { if (MP.off[v]) delete MP.off[v]; else MP.off[v] = 1; }
  else if (a === 'vol') { MP.vol = +v; try { if (MUS.out && MUS.playing) MUS.out.gain.setTargetAtTime(MP.vol * 0.9, AC.currentTime, 0.03); } catch (e) {} }
  saveMus(); jkRender();
}
function jkBoot() {
  var st = document.createElement('style');
  st.textContent = '.jk.scrim{z-index:40}.jk .btn.on{background:var(--yellow);color:var(--k)}.jk .list li{align-items:center}.jk .jk-list{max-height:58vh;overflow-y:auto}';
  document.head.appendChild(st);
  JK.root = document.createElement('div'); document.body.appendChild(JK.root);
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-jk]'); if (t) { e.stopPropagation(); jkAct(t.getAttribute('data-jk'), t.getAttribute('data-v')); } else if (JK.open && e.target.classList && e.target.classList.contains('scrim')) jkOpen(false); }, true);
  document.addEventListener('keydown', function (e) {
    if (!JK.open) return;
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack' || e.key === 'GoBack') { e.preventDefault(); e.stopPropagation(); jkOpen(false); return; }
    var bs = Array.prototype.slice.call(JK.root.querySelectorAll('button')), i = bs.indexOf(document.activeElement);
    if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); bs[(i + (e.shiftKey ? bs.length - 1 : 1)) % bs.length].focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); bs[(i + bs.length - 1) % bs.length].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) jkAct(bs[i].getAttribute('data-jk'), bs[i].getAttribute('data-v')); }
    e.stopPropagation();
  }, true);
}
/* Render a stretch of a piece offline, through the same instruments and hall, into a 16-bit stereo WAV (tests and
   listening copies use it; the game never calls it). */
function musRender(id, secs) {
  var tr = musTrack(id); if (!tr) return Promise.resolve(null);
  var keep = { AC: AC, out: MUS.out, bus: MUS.bus, parts: MUS.parts, voices: MUS.voices, buf: BUF };
  var rate = 48000, len = Math.min(secs || tr.dur + 3, tr.dur + 3);
  AC = new OfflineAudioContext(2, Math.ceil(rate * len), rate); MUS.out = null; BUF = {}; MUS.voices = [];
  musSetup();
  var parts = tr.parts.map(function (p) { var g = AC.createGain(), pan = AC.createStereoPanner(); pan.pan.value = p.p; g.connect(pan); pan.connect(MUS.bus); return { i: p.i, g: p.g, node: g, det: p.i === 'piano' || p.i === 'harpsichord' ? 0 : (Math.random() - 0.5) * 8 }; });
  var need = []; tr.parts.forEach(function (p) { if (need.indexOf(p.i) < 0) need.push(p.i); });
  var ctx = AC;
  return Promise.all(need.map(loadInst)).then(function () {
    var N = unpack(tr);
    for (var j = 0; j < N.n && N.t[j] < len; j++) playNote(parts[N.p[j]], N.k[j], N.v[j], 0.2 + N.t[j], N.l[j], N.z[j]);
    return ctx.startRendering();
  }).then(function (b) {
    AC = keep.AC; MUS.out = keep.out; MUS.bus = keep.bus; MUS.parts = keep.parts; MUS.voices = keep.voices; BUF = keep.buf;
    var n = b.length, L = b.getChannelData(0), R = b.getChannelData(1), pk = 0, i;
    for (i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    var sc = pk > 0.98 ? 0.98 / pk : 1, out = new DataView(new ArrayBuffer(44 + n * 4)), w = function (o, s) { for (var k = 0; k < s.length; k++) out.setUint8(o + k, s.charCodeAt(k)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, rate, true); out.setUint32(28, rate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
    for (i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * sc)) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * sc)) * 32767, true); }
    return { wav: out.buffer, peak: pk };
  });
}

jkBoot(); musMark();
// the interface's Options window reads and sets the music level through this
window.EWF_MUSIC_VOL = { vol: function () { return MP.vol; }, setVol: function (v) { jkAct('vol', v); } };
window.EWF_MUSIC = { tracks: TRACKS, state: MUS, start: musStart, stop: musStop, setup: musSetup, ctx: function () { return AC; }, play: musPlay, render: musRender };
})();
