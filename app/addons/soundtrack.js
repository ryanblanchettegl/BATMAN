/* Soundtrack add-on. Self-contained: its own audio and its own Jukebox window. build.js appends this file to the page as it is,
   after music-list.js (the list, window.EWF_MUSIC_DATA). The music is twenty real recordings of mellow classical pieces by
   real orchestras, quartets and pianists, all free to use (tools/music/CREDITS.md), kept beside the page as music/<id>.ogg
   and streamed by an audio element, so only the piece playing is loaded. Ryan, 22 October: all real music; quiet
   background music by default, louder as a choice; a random order, the first piece too; the jukebox says who recorded each.
   The Music button is drawn by the interface: any element with data-jk="open" opens the Jukebox. */
(function () {
var D = window.EWF_MUSIC_DATA || { pieces: [] };
var MKEY = 'gorilla-position-music';
/* quiet background music by default; louder is a choice. A level kept from the old soundtrack (no v2) starts Low. */
var LEVELS = [[0.15, 'Low'], [0.4, 'Medium'], [1, 'Loud']];
var MP = (function () { var o = {}; try { o = JSON.parse(localStorage.getItem(MKEY) || '{}') || {}; } catch (e) {} return { on: o.on !== false, vol: o.v2 && o.vol != null ? +o.vol : 0.15, off: o.v2 ? (o.off || {}) : {} }; })();
function musMark() { try { document.documentElement.setAttribute('data-music', MP.on ? 'on' : 'off'); } catch (e) {} }
function saveMus() { try { localStorage.setItem(MKEY, JSON.stringify({ on: MP.on, vol: MP.vol, off: MP.off, v2: 1 })); } catch (e) {} musMark(); }
var TRACKS = D.pieces;
var GROUPS = ['Orchestra', 'Strings', 'Piano'];
var MUS = { playing: false, tr: null, el: null, played: [], fade: null };

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

function audio() {
  if (MUS.el) return MUS.el;
  var a = new Audio(); a.preload = 'auto'; a.volume = 0;
  a.addEventListener('ended', function () { if (MUS.playing) musPlay(musNextId()); });
  a.addEventListener('error', function () { if (MUS.playing) setTimeout(function () { musPlay(musNextId()); }, 1500); });
  return (MUS.el = a);
}
/* the volume glides rather than jumps, so starting, stopping and changing the level never startle */
function glide(to, ms, done) {
  var a = audio(), from = a.volume, t0 = Date.now(); clearInterval(MUS.fade);
  MUS.fade = setInterval(function () { var k = Math.min(1, (Date.now() - t0) / ms); a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k >= 1) { clearInterval(MUS.fade); if (done) done(); } }, 40);
}
function musPlay(id) {
  var tr = musTrack(id) || musTrack(musNextId()); if (!tr) return;
  var a = audio(); MUS.tr = tr; MUS.played.push(tr.id); if (MUS.played.length > 10) MUS.played.shift();
  a.src = tr.src; a.volume = 0;
  var p = a.play(); if (p && p.catch) p.catch(function () {});
  glide(MP.vol, 1200);
  try { window.dispatchEvent(new CustomEvent('ewf-track', { detail: { name: tr.n + ' (' + tr.c + ')' } })); } catch (e) {}
  if (JK.open) setTimeout(jkRender, 0);
}
function musStart(id) {
  MUS.playing = true;
  if (id || !MUS.tr) { musPlay(id || musNextId()); return; }
  var a = audio(), p = a.play(); if (p && p.catch) p.catch(function () {}); glide(MP.vol, 800);   // carry on where it paused
}
function musStop() { MUS.playing = false; if (MUS.el) glide(0, 500, function () { if (!MUS.playing) MUS.el.pause(); }); }
function musGesture() { if (MP.on && !MUS.playing && !document.hidden && TRACKS.length) musStart(); }
document.addEventListener('pointerdown', musGesture, true);
document.addEventListener('keydown', musGesture, true);
document.addEventListener('visibilitychange', function () { if (document.hidden) { if (MUS.playing) musStop(); } else if (MP.on && MUS.tr) musStart(); });

/* ---------- the Jukebox ---------- */
var JK = { open: false, root: null, last: null };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function jukeHtml() {
  var volb = LEVELS.map(function (o) { var on = Math.abs(MP.vol - o[0]) < 0.01; return '<button class="btn sm' + (on ? ' on' : '') + '" data-jk="vol" data-v="' + o[0] + '"' + (on ? ' aria-pressed="true"' : '') + '>' + o[1] + '</button>'; }).join('');
  var cur = MUS.tr && MP.on && MUS.playing ? MUS.tr.id : '';
  return '<div class="row"><button class="btn' + (MP.on ? ' on' : '') + '" data-jk="toggle" aria-pressed="' + (MP.on ? 'true' : 'false') + '">Music ' + (MP.on ? 'On' : 'Off') + '</button><button class="btn sm" data-jk="next">Next piece</button></div>' +
    '<div class="row" style="margin-top:6px"><span>Volume</span>' + volb + '</div>' +
        '<div class="jk-list">' + GROUPS.map(function (g) {
      var L = TRACKS.filter(function (t) { return t.mood === g; }); if (!L.length) return '';
      return '<p class="eyebrow" style="margin:8px 0 2px">' + esc(g) + '</p><ul class="list">' + L.map(function (t) {
        var inr = !MP.off[t.id], now = t.id === cur;
        // Ryan, 22 October: the jukebox says only the piece and who recorded it
        return '<li data-jk-piece="' + esc(t.id) + '"><span><b>' + (now ? '♫ ' : '') + esc(t.n) + '</b>' + (now ? ' <span class="good">now playing</span>' : '') +
          '<br><span class="muted" style="font-size:.88em">Recorded by <b data-jk-by>' + esc(t.by) + '</b></span></span><span class="row"><button class="btn sm" data-jk="play" data-v="' + esc(t.id) + '">Play</button><button class="btn sm' + (inr ? ' on' : '') + '" data-jk="rot" data-v="' + esc(t.id) + '" aria-pressed="' + (inr ? 'true' : 'false') + '">' + (inr ? 'In rotation' : 'Left out') + '</button></span></li>';
      }).join('') + '</ul>';
    }).join('') + '</div>';
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
  else if (a === 'vol') { MP.vol = +v; if (MUS.el && MUS.playing) glide(MP.vol, 300); }
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
jkBoot(); musMark();
// the interface's Options window reads and sets the music level through this
window.EWF_MUSIC_VOL = { vol: function () { return MP.vol; }, setVol: function (v) { jkAct('vol', v); } };
window.EWF_MUSIC = { tracks: TRACKS, state: MUS, start: musStart, stop: musStop, play: musPlay, next: musNextId };
})();
