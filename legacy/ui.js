/* Gorilla Position — interface. Reads and writes the plain-JSON game state through the GP engine. */
(function () {
'use strict';
var E = window.GP, S = null;
var KEY = 'ewf9000-save-4', UKEY = 'ewf9000-universes';
var app = document.getElementById('app'), toastBox = document.getElementById('toasts');
var U = fresh();
function fresh() { return { tab: 'office', edit: -1, report: null, flash: null, tried: false, rf: { brand: 'all', g: 'all', al: 'all', q: '' }, rs: { k: 'ovr', d: -1 }, sel: null, mq: '', offer: null, confirm: null, focus: null, live: null }; }

/* Steam hook: the desktop wrapper exposes window.gpSteam.unlock(apiName). In a browser this is a no-op. */
var PLATFORM = { unlock: function (id) { try { if (window.gpSteam && typeof window.gpSteam.unlock === 'function') window.gpSteam.unlock(id); } catch (e) {} } };

var SAVEB = 0;
function save() { try { var tx = JSON.stringify(S); SAVEB = tx.length; localStorage.setItem(KEY, tx); return true; } catch (e) { return false; } }
function load() { try { var t = localStorage.getItem(KEY); if (!t) return null; var o = JSON.parse(t); return o && o.v === 4 && o.promos ? o : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }

/* ---------- preferences, sound and the typewriter ---------- */
var PKEY = 'gorilla-position-prefs';
var PREF = (function () { try { var o = JSON.parse(localStorage.getItem(PKEY) || '{}'); return { snd: o.snd !== false, type: o.type !== false, crt: o.crt !== false, boot: o.boot !== false, screen: o.screen || 'auto', zoom: +o.zoom || 1, uni: o.uni || 'public_domain' }; } catch (e) { return { snd: true, type: true, crt: true, boot: true, screen: 'auto', zoom: 1, uni: 'public_domain' }; } })();
function savePrefs() { try { localStorage.setItem(PKEY, JSON.stringify(PREF)); } catch (e) {} }
var AC = null;
function tone(f, d, type, vol, when) {
  if (!PREF.snd) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (when || 0);
    o.type = type || 'square'; o.frequency.value = f; o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.start(t); o.stop(t + d + 0.03);
  } catch (e) {}
}
function crowdNoise(vol, d) {
  if (!PREF.snd) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    var n = Math.floor(AC.sampleRate * d), buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0), i;
    for (i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    var src = AC.createBufferSource(), g = AC.createGain(), flt = AC.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = 900; g.gain.value = vol; src.buffer = buf; src.connect(flt); flt.connect(g); g.connect(AC.destination); src.start();
  } catch (e) {}
}
var SFX = {
  bell: function () { tone(1568, 0.5, 'triangle', 0.09, 0); tone(1568, 0.5, 'triangle', 0.09, 0.22); tone(1568, 0.7, 'triangle', 0.09, 0.44); },
  count: function () { tone(520, 0.09, 'square', 0.05, 0); tone(520, 0.09, 'square', 0.05, 0.38); tone(780, 0.16, 'square', 0.05, 0.76); },
  fanfare: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'square', 0.04, i * 0.13); }); tone(1047, 0.5, 'square', 0.04, 0.55); },
  ach: function () { tone(880, 0.1, 'square', 0.04, 0); tone(1320, 0.22, 'square', 0.04, 0.1); },
  crowd: function (cr) { crowdNoise(0.02 + Math.max(0, cr - 30) / 70 * 0.1, 0.9 + cr / 100); }
};
var typer = { t: null, el: null, full: '', finish: function () { if (this.t) { clearInterval(this.t); this.t = null; if (this.el) this.el.textContent = this.full; } }, active: function () { return !!this.t; } };
function typeLast() {
  typer.finish();
  if (!U.live || !PREF.type || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var el = document.querySelector('#live .ln.last .tx') || document.querySelector('#live .ln.last');
  if (!el) return;
  var full = el.textContent, i = 0; typer.el = el; typer.full = full; el.textContent = '';
  typer.t = setInterval(function () { i += 3; el.textContent = full.slice(0, i); if (i % 9 === 0) tone(1100, 0.012, 'square', 0.008); if (i >= full.length) typer.finish(); }, 18);
}

/* ---------- ASCII art ---------- */
var GLYPH = {A:' ### /#   #/#####/#   #/#   #',B:'#### /#   #/#### /#   #/#### ',C:' ####/#    /#    /#    / ####',D:'#### /#   #/#   #/#   #/#### ',E:'#####/#    /#### /#    /#####',F:'#####/#    /#### /#    /#    ',G:' ####/#    /#  ##/#   #/ ####',H:'#   #/#   #/#####/#   #/#   #',I:'###/ # / # / # /###',J:'  ###/    #/    #/#   #/ ### ',K:'#   #/#  # /###  /#  # /#   #',L:'#    /#    /#    /#    /#####',M:'#   #/## ##/# # #/#   #/#   #',N:'#   #/##  #/# # #/#  ##/#   #',O:' ### /#   #/#   #/#   #/ ### ',P:'#### /#   #/#### /#    /#    ',Q:' ### /#   #/# # #/#  # / ## #',R:'#### /#   #/#### /#  # /#   #',S:' ####/#    / ### /    #/#### ',T:'#####/  #  /  #  /  #  /  #  ',U:'#   #/#   #/#   #/#   #/ ### ',V:'#   #/#   #/#   #/ # # /  #  ',W:'#   #/#   #/# # #/## ##/#   #',X:'#   #/ # # /  #  / # # /#   #',Y:'#   #/ # # /  #  /  #  /  #  ',Z:'#####/   # /  #  / #   /#####','0':' ### /#  ##/# # #/##  #/ ### ','1':' # /## / # / # /###','2':'#### /    #/ ### /#    /#####','3':'#### /    #/ ### /    #/#### ','4':'#   #/#   #/#####/    #/    #','5':'#####/#    /#### /    #/#### ','6':' ### /#    /#### /#   #/ ### ','7':'#####/    #/   # /  #  /  #  ','8':' ### /#   #/ ### /#   #/ ### ','9':' ### /#   #/ ####/    #/ ### ',"'":'#/#/ / / ','!':'#/#/#/ /#','-':'   /   /###/   /   '};
function banner(text, cls) {
  var words = String(text).toUpperCase().replace(/[^A-Z0-9'! -]/g, '').split(/\s+/).filter(Boolean), out = [], max = 0;
  words.forEach(function (w) {
    var rows = ['', '', '', '', ''];
    w.split('').forEach(function (ch) { var g = (GLYPH[ch] || GLYPH['-']).split('/'); for (var r = 0; r < 5; r++) rows[r] += g[r].replace(/#/g, '█') + ' '; });
    rows.forEach(function (r) { if (r.length > max) max = r.length; out.push(r); }); out.push('');
  });
  return '<pre class="ascii ' + (cls || '') + '" role="img" aria-label="' + esc(text) + '" style="font-size:min(1em,calc((100vw - 76px) / ' + (max * 0.62).toFixed(1) + '))">' + out.join('\n') + '</pre>';
}
function beltArt(name) {
  var n = String(name).toUpperCase(), pad = function (s, w) { var l = Math.max(0, w - s.length), a = Math.floor(l / 2); return new Array(a + 1).join(' ') + s + new Array(l - a + 1).join(' '); }, w = Math.max(19, n.length + 4);
  var bar = new Array(w + 1).join('═');
  return '<pre class="ascii belt" role="img" aria-label="Title belt: ' + esc(name) + '">' +
    '      ╔' + bar + '╗\n' +
    ' ╒════╣' + pad('★ NEW CHAMPION ★', w) + '╠════╕\n' +
    ' ╘════╣' + pad(n, w) + '╠════╛\n' +
    '      ╚' + bar + '╝</pre>';
}

/* ---------- text-mode charts, portraits and pop-up windows ---------- */
var PIEC = ['pc0', 'pc1', 'pc2', 'pc3', 'pc4', 'pc5', 'pc6'];
function pie(parts, title) {
  var tot = 0; parts = parts.filter(function (p) { return p.v > 0; }); parts.forEach(function (p) { tot += p.v; });
  if (!tot) return '';
  var W = 23, H = 11, rows = [], acc = 0, cuts = parts.map(function (p) { acc += p.v / tot; return acc; });
  for (var y = 0; y < H; y++) {
    var line = '';
    for (var x = 0; x < W; x++) {
      var dx = (x - (W - 1) / 2) / ((W - 1) / 2), dy = (y - (H - 1) / 2) / ((H - 1) / 2);
      if (Math.sqrt(dx * dx + dy * dy) > 1.03) { line += ' '; continue; }
      var a = Math.atan2(dx, -dy) / (2 * Math.PI); if (a < 0) a += 1;
      var k = 0; while (k < cuts.length - 1 && a > cuts[k]) k++;
      line += '<span class="' + PIEC[k % PIEC.length] + '">█</span>';
    }
    rows.push(line);
  }
  var legend = parts.map(function (p, i) { return '<div><span class="' + PIEC[i % PIEC.length] + '">██</span> ' + esc(p.n) + ' <span class="num muted">' + Math.round(p.v / tot * 100) + '%</span></div>'; }).join('');
  return '<div class="piebox" role="img" aria-label="' + esc((title || 'Pie chart') + ': ' + parts.map(function (p) { return p.n + ' ' + Math.round(p.v / tot * 100) + '%'; }).join(', ')) + '"><pre class="pie" aria-hidden="true">' + rows.join('\n') + '</pre><div class="legend">' + legend + '</div></div>';
}
function colChart(vals, labels, title) {
  var max = 1, neg = false, H = 6, out = [], r, i; vals.forEach(function (v) { if (Math.abs(v) > max) max = Math.abs(v); if (v < 0) neg = true; });
  for (r = H; r >= 1; r--) { var ln = ''; for (i = 0; i < vals.length; i++) { var h = vals[i] / max * H; ln += (h >= r ? '<span class="good">██</span>' : (h >= r - 0.5 ? '<span class="good">▄▄</span>' : '  ')) + ' '; } out.push(ln); }
  out.push(new Array(vals.length * 3).join('─'));
  if (neg) for (r = 1; r <= 3; r++) { var l2 = ''; for (i = 0; i < vals.length; i++) { var h2 = -vals[i] / max * H; l2 += (h2 >= r ? '<span class="bad">██</span>' : (h2 >= r - 0.5 ? '<span class="bad">▀▀</span>' : '  ')) + ' '; } out.push(l2); }
  if (labels) out.push(labels.map(function (l) { return (String(l) + '  ').slice(0, 2) + ' '; }).join(''));
  return '<pre class="ascii bars" role="img" aria-label="' + esc(title || 'Chart') + '">' + out.join('\n') + '</pre>';
}
function rangeBar(lo, hi) { var s = ''; for (var i = 0; i < 20; i++) { var v = i * 5 + 2.5; s += v >= lo - 2.5 && v <= hi + 2.5 ? '█' : '░'; } return '<span class="meter au" aria-hidden="true">' + s + '</span>'; }
function face(w) {
  var h = function (k) { var x = 7, s = w.name + k; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; };
  var hair = w.nw ? '▄▄███▄▄' : ['▓▓▓▓▓▓▓', '░░░░░░░', '▀▀▀▀▀▀▀', '       ', '▄█▄▄▄█▄', '▒▒▀▀▀▒▒'][h('h') % 6];
  var eyes = [' o   o ', ' -   - ', ' ^   ^ ', ' *   * ', ' 0   0 ', ' >   < '][h('e') % 6], nose = ['   v   ', '   ^   ', '   >   ', '   u   '][h('n') % 4];
  var mouth = w.align === 'H' ? ['  ---  ', '  ~~~  ', ' \\___/ ', '  vvv  '][h('m') % 4] : ['  ___  ', ' \\___/ ', '  ---  ', '  ───  '][h('m') % 4];
  var chin = (w.style === 'P' || w.style === 'B') && h('c') % 2 ? ' ░░░░░ ' : (w.style === 'H' && h('c') % 3 === 0 ? ' ▒▒▒▒▒ ' : '       ');
  var rows = ['┌───────┐', '│' + hair + '│', '│' + eyes + '│', '│' + nose + '│', '│' + mouth + '│', '│' + chin + '│', '└───────┘'];
  return '<pre class="ascii face ' + (w.twn ? 'warn' : (w.align === 'F' ? 'face' : 'heel')) + '" aria-hidden="true">' + rows.map(esc).join('\n') + '</pre>';
}
function modalHtml() {
  var m = U.modal; if (!m) return '';
  if (m.kind === 'options') m.html = optionsHtml(); else if (m.kind === 'help') m.html = helpHtml(); else if (m.kind === 'chaos') m.html = chaosHtml();
  return '<div class="scrim"><div class="win' + (m.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(m.title) + '"><div class="wt"><span>' + esc(m.title) + '</span><button data-act="modal-close" aria-label="Close">[■]</button></div><div class="wb">' + m.html + '</div><div class="wf">' + (m.copy ? '<button class="btn" data-act="copy-modal">Copy to clipboard</button>' : '') + (m.noOk ? '' : '<button id="modal-ok" class="btn go" data-act="modal-close">' + esc(m.ok || 'OK') + '</button>') + '<span class="muted opt">' + (m.noOk ? 'Esc puts the headset down. The call will still be waiting.' : 'Esc closes') + '</span></div></div></div>';
}
function copyText(t, fallbackId) {
  var done = function () { var b = document.querySelector('[data-act="copy-modal"]'); if (b) b.textContent = 'Copied'; }, sel = function () { var el = document.getElementById(fallbackId); if (el && el.select) el.select(); };
  try { navigator.clipboard.writeText(t).then(done, sel); } catch (e) { sel(); }
}
/* universes: the built-in default plus any package the player has imported */
var UNIS = (function () { try { return JSON.parse(localStorage.getItem(UKEY) || '{}') || {}; } catch (e) { return {}; } })();
function saveUnis() { try { localStorage.setItem(UKEY, JSON.stringify(UNIS)); return true; } catch (e) { return false; } }
function setUniverse(id) {
  var pkg = id !== 'public_domain' && UNIS[id] ? UNIS[id] : window.GP_UNIVERSE, v = E.useUniverse(pkg);
  if (!v.ok) { v = E.useUniverse(window.GP_UNIVERSE); id = 'public_domain'; }
  PREF.uni = id; savePrefs(); return v;
}
function reportHtml(v, name) {
  var li = function (x) { return '<li><span><b>' + esc(x.at) + '</b><br><span class="muted">' + esc(x.msg) + '</span></span></li>'; };
  return '<p>' + (v.ok ? '<span class="good">' + esc(name) + ' loaded' + (v.warnings.length ? ' with ' + v.warnings.length + ' warning' + (v.warnings.length === 1 ? '' : 's') : ' cleanly') + '.</span>' : '<span class="bad">' + esc(name) + ' could not be loaded: ' + v.errors.length + ' error' + (v.errors.length === 1 ? '' : 's') + '.</span>') + '</p>' +
    (v.errors.length ? '<p class="eyebrow" style="margin-top:8px">Errors</p><ul class="list">' + v.errors.slice(0, 40).map(li).join('') + '</ul>' : '') +
    (v.warnings.length ? '<p class="eyebrow" style="margin-top:8px">Warnings</p><ul class="list">' + v.warnings.slice(0, 40).map(li).join('') + '</ul>' : '') +
    (v.info ? '<p style="margin-top:8px">' + v.info.workers + ' workers in ' + v.info.promotions.length + ' promotions. The world starts in ' + esc(v.info.start) + '.</p>' : '');
}
function importUniverse(text, fname) {
  var pkg, v;
  try { pkg = JSON.parse(text); } catch (e) { U.modal = { title: 'Universe not loaded', html: '<p class="bad">' + esc(fname) + ' is not valid JSON.</p><p class="muted" style="margin-top:6px">' + esc(String(e.message)) + '</p>' }; render(); return; }
  v = E.validateUniverse(pkg);
  var name = pkg && pkg.manifest && pkg.manifest.name ? pkg.manifest.name : fname, text2 = (v.ok ? 'OK' : 'FAILED') + ': ' + name + '\n' + v.errors.map(function (x) { return 'ERROR ' + x.at + ': ' + x.msg; }).concat(v.warnings.map(function (x) { return 'WARNING ' + x.at + ': ' + x.msg; })).join('\n');
  if (v.ok) { UNIS[pkg.manifest.id] = pkg; var kept = saveUnis(); v = setUniverse(pkg.manifest.id); if (!kept) v.warnings.push({ at: 'storage', msg: 'This browser could not store the package, so it will need importing again next time.' }); }
  U.modal = { title: v.ok ? 'Universe loaded' : 'Universe not loaded', html: reportHtml(v, name), copy: !v.ok || v.warnings.length > 0, text: text2, wide: true };
  render();
}

/* ---------- small helpers ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function cash(n) { var a = Math.abs(n), s = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M' : (a >= 1e3 ? Math.round(a / 1e3) + 'K' : String(Math.round(a))); return (n < 0 ? '−$' : '$') + s; }
function full(n) { return (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US'); }
function stars(v) { var q = Math.round(v / 20 * 4) / 4, f = Math.floor(q), r = q - f; return (f ? new Array(f + 1).join('★') : '') + (r === 0.25 ? '¼' : r === 0.5 ? '½' : r === 0.75 ? '¾' : '') || '¼'; }
function meter(v, cls) { var n = Math.max(0, Math.min(10, Math.round(v / 10))); return '<span class="meter ' + (cls || '') + '" role="img" aria-label="' + Math.round(v) + ' out of 100">' + new Array(n + 1).join('\u2588') + '<i>' + new Array(11 - n).join('\u2591') + '</i></span>'; }
function nm(w) { return '<span class="' + (w.align === 'F' ? 'face' : 'heel') + '">' + esc(w.name) + '</span>'; }
function side(w) { return '<span class="tag ' + (w.align === 'F' ? 'face' : 'heel') + '">' + (w.align === 'F' ? 'Face' : 'Heel') + '</span>'; }
function me() { return S.promos[S.player]; }
function checkLine(label, ck) {
  var m = ck.mods.map(function (x) { return esc(x.n) + ' ' + (x.v > 0 ? '+' : '\u2212') + Math.abs(x.v); }).join(', ');
  return '<p class="muted">' + (label ? esc(label) + ': ' : '') + 'roll 2d6' + (ck.mod ? (ck.mod > 0 ? ' +' : ' \u2212') + Math.abs(ck.mod) : '') + ' against ' + ck.target + ' \u00B7 <b>' + Math.round(ck.p * 100) + '%</b>' + (m ? ' (' + m + ')' : '') + '</p>';
}
function dice(r) { return r ? '<span class="dice" aria-hidden="true">[' + r.d[0] + '][' + r.d[1] + ']</span> ' : ''; }
function brandName(P, id) { if (!P.brands || !id) return ''; for (var i = 0; i < P.brands.length; i++) if (P.brands[i].id === id) return P.brands[i].name; return ''; }
function teamName(t) { return esc(S.w[t.m[0]].name) + ' &amp; ' + esc(S.w[t.m[1]].name); }
function champOf(P, id) { var out = []; P.titles.forEach(function (t) { if (t.holders.indexOf(id) >= 0) out.push(t.name); }); return out; }
function pend() { return S.inbox.filter(function (e) { return !e.done; }).length; }
function weekDone() { return S.qi >= S.queue.length; }

/* ---------- screens: desk, tablet, TV and phone share one layout that scales ---------- */
var NAV = { on: false, pad: false, tv: false, home: false };
function autoScreen() {
  var w = window.innerWidth, ua = navigator.userAgent || '', coarse = false;
  try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
  if (/SmartTV|SMART-TV|Tizen|Web0S|webOS|\bAFT[A-Z]|GoogleTV|Android TV|BRAVIA|HbbTV|CrKey|Roku|Xbox|PlayStation|\bTV\b/i.test(ua)) return 'tv';
  if (w <= 640) return 'phone';
  return coarse ? 'tablet' : 'desk';
}
function screenMode() { return PREF.screen && PREF.screen !== 'auto' ? PREF.screen : autoScreen(); }
function applyScreen() {
  var de = document.documentElement, m = screenMode();
  de.setAttribute('data-screen', m); de.style.setProperty('--zoom', String(PREF.zoom || 1));
  NAV.tv = m === 'tv'; NAV.on = NAV.tv || NAV.pad; de.classList.toggle('nav', NAV.on);
}
/* a remote, a d-pad or a gamepad moves focus by geometry: the nearest control in the direction pressed */
function navScope() { return document.querySelector('.win') || document.querySelector('.caw-win') || app; }
function focusables(scope) { return [].slice.call(scope.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]):not([hidden]),textarea,tr.pick')).filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); }
function isText(el) { return !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(range|checkbox|radio|button|file)$/.test(el.type || ''))); }
function sigOf(el) { var d = el.dataset || {}; return [el.tagName, d.act, d.ch, d.inp, d.v, d.id, d.k, d.i, d.c, d.s, d.p, d.w].join('|'); }
function focusKey() { var el = document.activeElement; if (!el || el === document.body || !app.contains(el)) return null; var r = el.getBoundingClientRect(); return { id: el.id, sig: sigOf(el), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
function navHome() {
  var scope = navScope(), el = scope.querySelector('.dmenu .mi.on') || scope.querySelector('#live-go') || scope.querySelector('#modal-ok');
  if (!el) { var L = focusables(scope).filter(function (e) { return !e.closest('.menu') && !e.closest('.status') && !e.closest('.wt') && !e.classList.contains('caw-x'); }); el = L[0] || focusables(scope)[0]; }
  if (el) { try { el.focus(); el.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  return !!el;
}
function restoreFocus(fk) {
  var scope = navScope(), el = null, L, i;
  if (NAV.home) { NAV.home = false; return navHome(); }
  if (fk) {
    if (fk.id) { el = document.getElementById(fk.id); if (el && !scope.contains(el)) el = null; }
    if (!el) { L = focusables(scope); for (i = 0; i < L.length; i++) if (sigOf(L[i]) === fk.sig) { el = L[i]; break; } }
    if (!el && NAV.on) { var best = Infinity; L = L || focusables(scope); L.forEach(function (e) { var r = e.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - fk.x) + Math.abs(r.top + r.height / 2 - fk.y) * 2; if (d < best) { best = d; el = e; } }); }
  }
  if (!el) return NAV.on ? navHome() : false;
  try { el.focus({ preventScroll: !NAV.on }); if (NAV.on) el.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  return true;
}
function top0() { window.scrollTo(0, 0); if (NAV.on) { var e = document.activeElement; if (e && e !== document.body && e.scrollIntoView) { try { e.scrollIntoView({ block: 'nearest' }); } catch (x) {} } } }
function gap1(a1, a2, b1, b2) { return b1 > a2 ? b1 - a2 : (a1 > b2 ? a1 - b2 : 0); }
function navMove(dir) {
  var scope = navScope(), L = focusables(scope), cur = document.activeElement, vh = window.innerHeight, vert = dir === 'up' || dir === 'down';
  if (!L.length) return false;
  if (!cur || L.indexOf(cur) < 0) return navHome();
  var barOf = function (e) { return e.closest('.menu') ? 1 : (e.closest('.status') ? 2 : 0); }, cb = barOf(cur), r = cur.getBoundingClientRect();
  var pickFrom = function (pool) {
    var best = null, bs = Infinity;
    pool.forEach(function (e) {
      if (e === cur) return; var q = e.getBoundingClientRect(), prim, sec;
      if (dir === 'down') { if (q.top < r.bottom - 2) return; prim = q.top - r.bottom; sec = gap1(r.left, r.right, q.left, q.right); }
      else if (dir === 'up') { if (q.bottom > r.top + 2) return; prim = r.top - q.bottom; sec = gap1(r.left, r.right, q.left, q.right); }
      else if (dir === 'right') { if (q.left < r.right - 2) return; prim = q.left - r.right; sec = gap1(r.top, r.bottom, q.top, q.bottom); }
      else { if (q.right > r.left + 2) return; prim = r.left - q.right; sec = gap1(r.top, r.bottom, q.top, q.bottom); }
      var sc = prim + sec * (vert ? 2.5 : 4); if (sc < bs) { bs = sc; best = e; }
    });
    return best;
  };
  // the menu and status bars stay on screen while the page scrolls, so they are only a destination once the page itself has nothing left that way
  var best = pickFrom(L.filter(function (e) { return !vert && cb ? barOf(e) === cb : barOf(e) === 0; }));
  if (!best && vert) {
    var de = document.documentElement, atEnd = dir === 'down' ? window.innerHeight + window.scrollY >= de.scrollHeight - 4 : window.scrollY <= 2;
    if (!atEnd && !cb) { window.scrollBy(0, (dir === 'down' ? 1 : -1) * vh * 0.4); return true; }
    best = pickFrom(L.filter(function (e) { return barOf(e) === (dir === 'up' ? 1 : 2); }));
  }
  if (!best) return true;
  var bq = best.getBoundingClientRect();
  if (!barOf(best) && ((dir === 'down' && bq.top > vh * 1.6) || (dir === 'up' && bq.bottom < -vh * 0.6))) { window.scrollBy(0, (dir === 'down' ? 1 : -1) * vh * 0.5); return true; }
  try { best.focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
  return true;
}
function navKey(dir) {
  var el = document.activeElement, side = dir === 'left' || dir === 'right';
  if (el && el.tagName === 'SELECT' && side) { var i = el.selectedIndex + (dir === 'right' ? 1 : -1); if (i >= 0 && i < el.options.length) { el.selectedIndex = i; el.dispatchEvent(new Event('change', { bubbles: true })); } return true; }
  if (el && el.type === 'range' && side) { el.value = String(+el.value + (dir === 'right' ? 4 : -4)); el.dispatchEvent(new Event('input', { bubbles: true })); return true; }
  if (isText(el) && side) { var cp = null; try { cp = el.selectionStart; } catch (e) {} if (cp != null && ((dir === 'right' && cp < el.value.length) || (dir === 'left' && cp > 0))) return false; }
  return navMove(dir);
}
function activate(el) {
  if (!el || el === document.body) { navHome(); return; }
  if (el.tagName === 'SELECT') { try { el.showPicker(); } catch (e) { navKey('right'); } return; }
  if (isText(el)) { el.focus(); return; }
  el.click();
}
function goBack() {
  if (BOOT) { bootSkip(); return true; }
  if (U.modal) { act('modal-close', {}); return true; }
  if (!S) { if (U.setup) { act('unpick', {}); return true; } if (U.scr === 'select') { act('scr', { v: 'title' }); return true; } return false; }
  if (U.cwOpen) { act('cw-open', {}); return true; }
  if (U.live) { act('live-skip', {}); return true; }
  if (U.report != null) { act('closeReport', {}); return true; }
  if (U.sel != null && U.tab === 'roster') { act('sel', { id: U.sel }); return true; }
  if (U.tab !== 'office' || U.ov === 'back') { NAV.home = true; act('tab', { v: 'office' }); return true; }
  var mb = document.querySelector('.menu button[aria-current="page"]'); if (NAV.on && mb && document.activeElement !== mb) { mb.focus(); return true; }
  return false;
}
var PAD = { prev: {}, t: {}, rep: {}, raf: 0 };
function padPress(k) {
  if (BOOT) { bootSkip(); return; }
  if (k === 'up' || k === 'down' || k === 'left' || k === 'right') { navKey(k); return; }
  if (k === 'a') { activate(document.activeElement); return; }
  if (k === 'b') { goBack(); return; }
  if (k === 'start') { act(U.modal && U.modal.kind === 'options' ? 'modal-close' : 'options', {}); return; }
  if (k === 'sel') { act(U.modal && U.modal.kind === 'help' ? 'modal-close' : 'help', {}); return; }
  if ((k === 'lb' || k === 'rb') && S && !U.modal && !U.cwOpen && !U.live && !S.over) { var gi = NAVG.indexOf(groupOf(U.tab)); gi = (gi + (k === 'rb' ? 1 : NAVG.length - 1)) % NAVG.length; NAV.home = true; act('tab', { v: NAVG[gi].id }); }
}
function padPoll() {
  var gps = [], gp = null, i; try { gps = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) {}
  for (i = 0; i < gps.length; i++) if (gps[i] && gps[i].connected) { gp = gps[i]; break; }
  if (gp) {
    var now = Date.now(), b = function (n) { return !!(gp.buttons[n] && gp.buttons[n].pressed); }, ax = gp.axes || [];
    var st = { a: b(0), b: b(1), lb: b(4), rb: b(5), sel: b(8), start: b(9), up: b(12) || ax[1] < -0.6, down: b(13) || ax[1] > 0.6, left: b(14) || ax[0] < -0.6, right: b(15) || ax[0] > 0.6 };
    Object.keys(st).forEach(function (k) {
      var move = k === 'up' || k === 'down' || k === 'left' || k === 'right';
      if (st[k] && (!PAD.prev[k] || (move && now - PAD.t[k] > (PAD.rep[k] ? 120 : 400)))) { PAD.rep[k] = !!PAD.prev[k]; PAD.t[k] = now; padPress(k); }
      if (!st[k]) PAD.rep[k] = false; PAD.prev[k] = st[k];
    });
    if (Math.abs(ax[3] || 0) > 0.25) window.scrollBy(0, ax[3] * 24);
  }
  PAD.raf = window.requestAnimationFrame(padPoll);
}
window.addEventListener('gamepadconnected', function () { if (!NAV.pad) { NAV.pad = true; applyScreen(); render(); } if (!PAD.raf) padPoll(); });
window.addEventListener('resize', function () { applyScreen(); });

/* ---------- boot sequence, title card and the Select Promotion menu ---------- */
var VER = '0.9', BOOT = null;
function bootLines() { var info = E.universe(), sv = load(); return ['LOADING ROSTER... ' + info.workers + ' WORKERS', 'INITIALIZING BOOKING SYSTEM...', 'CHECKING MEMORY... 640K OK', 'READING SAVE... ' + (sv ? 'FOUND' : 'NONE')]; }
function bootView() {
  var L = bootLines(), n = BOOT.step, W = 22, f = Math.min(W, Math.round(W * n / (L.length + 1)));
  return '<div class="bootscr" data-act="boot-skip"><div class="bootin"><p class="bt">GORILLA POSITION ENGINE <span>v</span>' + VER + '</p><p class="rule" aria-hidden="true">' + new Array(27).join('\u2500') + '</p>' +
    L.map(function (l, k) { return '<p' + (k < n ? '' : ' style="visibility:hidden"') + '>' + esc(l) + '</p>'; }).join('') +
    '<p class="bar" role="img" aria-label="Loading">[<span>' + new Array(f + 1).join('\u2588') + '</span><i>' + new Array(W - f + 1).join('\u2591') + '</i>]</p><p class="skip">Press any key</p></div></div>';
}
function bootTick() { if (!BOOT) return; BOOT.step++; if (BOOT.step > bootLines().length + 1) { BOOT = null; render(); return; } render(); BOOT.t = setTimeout(bootTick, 430); }
function bootSkip() { if (!BOOT) return; clearTimeout(BOOT.t); BOOT = null; render(); }
function bigText(text, opt) {
  opt = opt || {};
  var words = opt.one ? [String(text).toUpperCase()] : String(text).toUpperCase().split(/\s+/), out = [], max = 0;
  words.forEach(function (w, wi) {
    var rows = ['', '', '', '', ''];
    w.split('').forEach(function (ch) { var r; if (ch === ' ') { for (r = 0; r < 5; r++) rows[r] += '   '; return; } var g = (GLYPH[ch] || GLYPH['-']).split('/'); for (r = 0; r < 5; r++) rows[r] += g[r].replace(/#/g, '\u2588') + ' '; });
    rows.forEach(function (r) { if (r.length > max) max = r.length; out.push(r); }); if (wi < words.length - 1) out.push('');
  });
  return '<pre class="ascii logo ' + (opt.cls || '') + '" aria-hidden="true" style="font-size:min(' + (opt.scale || 1) + 'em,calc((min(100vw,59em) - ' + ((opt.pad || 120) / 21).toFixed(1) + 'em) / ' + (max * 0.62).toFixed(1) + '))">' + out.join('\n') + '</pre>';
}
function startMenu() {
  return '<nav class="menu" aria-label="Menu"><button data-act="scr" data-v="title"><u>T</u>itle</button><button data-act="scr" data-v="select"><u>F</u>ederations</button><button data-act="options"><u>O</u>ptions</button><button data-act="help"><u>H</u>elp</button></nav>';
}
function menuList(items) {
  var cur = Math.max(0, Math.min(items.length - 1, U.mi || 0)); U.mi = cur; U.mn = items.length;
  return '<div class="dmenu" role="menu">' + items.map(function (it, k) {
    return '<button class="mi' + (k === cur ? ' on' : '') + (it.cls ? ' ' + it.cls : '') + '" role="menuitem" data-i="' + k + '" data-act="' + it.act + '"' + (it.v != null ? ' data-v="' + esc(it.v) + '"' : '') + '>' + it.html + '</button>';
  }).join('') + '</div>';
}
function titleView() {
  var sv = load(), items = [];
  if (sv) items.push({ act: 'continue', html: '<span class="ab">CONTINUE</span><span class="st">' + esc(sv.booker.name) + ' at ' + esc(sv.promos[sv.player].name) + ' \u00B7 week ' + sv.week + '</span>' });
  items.push({ act: 'scr', v: 'select', html: '<span class="ab">NEW GAME</span><span class="st">Pick a promotion or create your own</span>' });
  items.push({ act: 'help', html: '<span class="ab">HOW TO PLAY</span><span class="st">F1</span>' });
  items.push({ act: 'options', html: '<span class="ab">OPTIONS</span><span class="st">Sound, typing, screen</span>' });
  return '<div class="crt">' + startMenu() + '<div class="start"><h1 class="sr">Elite Wrestling Federation 9000</h1>' +
    '<div class="logo-box"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>' + bigText('ELITE', { scale: 2, one: true, pad: 150 }) +
    '<div class="wide">' + bigText('WRESTLING FEDERATION', { one: true, pad: 150 }) + '</div><div class="narrow">' + bigText('WRESTLING FEDERATION', { pad: 110 }) + '</div>' + bigText('9000', { scale: 1.5, one: true, pad: 150 }) + '</div>' +
    '<p class="lede c">You are the booker. The odds decide who wins, unless you spend your booking power to call the finish yourself.</p>' +
    '<div class="dbox sm">' + menuList(items) + '</div></div>' +
    '<div class="status c"><span>Gorilla Position Engine v' + VER + '</span><span class="opt">|</span><span>(C) 1997 Elite Software</span></div></div>';
}
function selectView() {
  var info = E.universe(), ids = Object.keys(UNIS), cur = PREF.uni && UNIS[PREF.uni] ? PREF.uni : 'public_domain';
  var items = info.promotions.map(function (d) {
    return { act: 'pick', v: d.id, d: d, html: '<span class="ab">' + esc(d.name) + '</span><span class="fn">' + (d.full ? '- ' + esc(d.full) : '') + '</span><span class="st">Pop ' + d.image + ' \u00B7 ' + cash(d.cash) + ' \u00B7 ' + (info.count[d.id] || 0) + ' workers</span>' };
  });
  items.push({ act: 'pick', v: 'OWN', cls: 'new', html: '<span class="fn">CREATE NEW FEDERATION</span>' });
  var list = menuList(items), it = items[U.mi], d = it.d;
  var det = d ? '<p><b>' + esc(d.full || d.name) + '.</b> ' + esc(d.blurb) + '</p><p class="kv"><span>Popularity <b>' + d.image + '</b></span><span>Cash <b>' + cash(d.cash) + '</b></span><span>Roster <b>' + (info.count[d.id] || 0) + '</b></span><span>Weekly shows <b>' + d.shows.length + '</b></span><span>Owner <b>' + esc(d.owner.name) + '</b></span></p>'
    : '<p><b>Create your own federation.</b> Name it, pick its size and house style, and start as owner and booker with a roster of unknowns and every title vacant.</p>';
  return '<div class="crt">' + startMenu() + '<div class="start">' +
    '<div class="dbox"><h1 class="dt">Select promotion</h1>' + list + '</div>' +
    '<section class="panel det" style="margin-bottom:22px" aria-live="polite"><h2>' + (d ? esc(d.name) : 'New') + '</h2>' + det + '</section>' +
    '<section class="panel" style="margin-bottom:18px"><h2>Universe</h2><div class="row"><select id="uni-sel" data-ch="uni" aria-label="Universe"><option value="public_domain"' + (cur === 'public_domain' ? ' selected' : '') + '>' + esc(window.GP_UNIVERSE.manifest.name) + ' (built in)</option>' + ids.map(function (id) { return '<option value="' + esc(id) + '"' + (cur === id ? ' selected' : '') + '>' + esc(UNIS[id].manifest.name) + ' (imported)</option>'; }).join('') + '</select><button class="btn" data-act="uni-import">Import a universe file</button>' + (cur !== 'public_domain' ? '<button class="btn" data-act="uni-remove">Remove this one</button>' : '') + '<input type="file" id="uni-file" accept=".json,application/json" hidden></div>' +
    '<p class="muted" style="margin-top:8px">' + esc(info.desc) + ' ' + info.workers + ' workers, ' + info.promotions.length + ' promotions. Starts in ' + esc(info.start) + '.' + (info.author ? ' By ' + esc(info.author) + '.' : '') + '</p>' +
    '<p class="muted" style="margin-top:6px">Every roster is a universe package: a JSON file anyone can write and share. The built-in one is made of history, myth and fiction published before 1929.</p></section></div>' +
    '<div class="status"><span class="opt">Arrows: move</span><span class="opt">Enter: select</span><span>Esc: back</span></div></div>';
}
function startView() {
  if (U.setup) return setupView() + modalHtml();
  return (U.scr === 'select' ? selectView() : titleView()) + modalHtml();
}
function helpHtml() {
  return '<p><b>The job.</b> Each week you book the shows on the Booking screen, deal with the Office inbox, then close the week. Shows that beat what the crowd expects raise your popularity.</p>' +
    '<p style="margin-top:6px"><b>Who wins.</b> The odds decide, from momentum, overness and the story so far. Spend booking power (BP) to call a finish yourself. The owner grants BP each week.</p>' +
    '<p style="margin-top:6px"><b>The long game.</b> Keep the locker room content, the bodies healthy and the owner on side. Earn enough trust and the company becomes yours.</p>' +
    '<p class="eyebrow" style="margin-top:8px">Keys</p><div class="keys">' + Object.keys(HOT).map(function (k) { var t = TABS.filter(function (x) { return x[0] === HOT[k]; })[0]; return '<span><b>' + k.toUpperCase() + '</b> ' + (t ? t[1] : HOT[k]) + '</span>'; }).join('') + '<span><b>Enter</b> next line of a show</span><span><b>Esc</b> skip or close</span><span><b>F1</b> this window</span><span><b>F2</b> options</span></div>';
}
function pickOpt(k, n, d, opts) { return '<li class="col"><span><b>' + n + '</b><br><span class="muted">' + d + '</span></span><span class="row">' + opts.map(function (o) { var on = String(PREF[k]) === String(o[0]); return '<button class="btn sm' + (on ? ' on' : '') + '" data-act="prefset" data-k="' + k + '" data-v="' + o[0] + '"' + (on ? ' aria-pressed="true"' : '') + '>' + o[1] + '</button>'; }).join('') + '</span></li>'; }
function optionsHtml() {
  var row = function (k, n, d) { return '<li><span><b>' + n + '</b><br><span class="muted">' + d + '</span></span><button class="btn sm' + (PREF[k] ? ' on' : '') + '" data-act="pref" data-k="' + k + '" aria-pressed="' + (PREF[k] ? 'true' : 'false') + '">' + (PREF[k] ? 'On' : 'Off') + '</button></li>'; };
  return '<ul class="list">' + row('snd', 'Sound', 'Beeps, bells and fanfares.') + row('type', 'Typewriter text', 'Commentary types itself out during a show.') + row('crt', 'Monitor effect', 'Scanlines and a darkened edge, like a tube screen.') + row('boot', 'Boot sequence', 'The loading screen when the game starts.') +
    pickOpt('screen', 'Screen', 'Auto picks from the device. TV is for the couch: larger text, edge margins, and a remote or gamepad moves the highlight.', [['auto', 'Auto (' + ({ desk: 'desk', tablet: 'tablet', tv: 'TV', phone: 'phone' })[autoScreen()] + ')'], ['desk', 'Desk'], ['tablet', 'Tablet'], ['tv', 'TV']]) +
    pickOpt('zoom', 'Text size', 'Scales everything on screen.', [[0.85, 'Small'], [1, 'Normal'], [1.2, 'Large'], [1.45, 'Largest']]) + '</ul>' +
    '<div class="row" style="margin-top:10px"><button class="btn sm" data-act="fullscreen">Full screen on or off</button></div>' +
    (S ? '<div class="row" style="margin-top:10px"><button class="btn danger" data-act="newgame">Start a new game</button><span class="muted">Asks before erasing anything.</span></div>' : '');
}

function pickRow(k, table, cur, label) {
  return '<p class="eyebrow">' + label + '</p><div class="row opts">' + Object.keys(table).map(function (id) { return '<button class="btn sm' + (id === cur ? ' on' : '') + '" data-act="setup-set" data-k="' + k + '" data-v="' + id + '"' + (id === cur ? ' aria-pressed="true"' : '') + '>' + esc(table[id].n) + '</button>'; }).join('') + '</div><p class="muted" style="margin:6px 0 10px">' + esc(table[cur].d || '') + '</p>';
}
function diffPanel() {
  return '<section class="panel" style="margin-bottom:20px"><h2>Difficulty</h2>' + pickRow('diff', E.DIFF, U.setup.diff || 'normal', 'How hard a job is it?') + '</section>';
}
function fedSetupView() {
  var f = U.setup.fed, z = E.FED_SIZE[f.size];
  var inp = function (k, label, max, ph, w) { return '<label class="f">' + label + '<input type="text" id="fed-' + k + '" maxlength="' + max + '" placeholder="' + esc(ph) + '" value="' + esc(f[k] || '') + '" data-inp="fed" data-k="' + k + '" style="width:' + (w || 30) + 'ch;max-width:100%"></label>'; };
  return '<div class="crt">' + startMenu() + '<div class="start">' +
    '<div class="head"><div><p class="eyebrow">Create a federation</p><h1><span class="hl">Your name on the door</span></h1></div></div>' +
    '<section class="panel" style="margin-bottom:20px"><h2>The name</h2><div class="editor" style="border:0;margin:0;padding:0">' + inp('name', 'Full name', 40, 'Elite Wrestling Federation') + inp('short', 'Initials (up to 6)', 6, 'EWF', 10) + inp('show', 'Weekly TV show', 28, 'Friday Night Fury') + inp('title', 'Top title', 28, 'World Title') + '</div></section>' +
    '<section class="panel" style="margin-bottom:20px"><h2>The company</h2>' + pickRow('size', E.FED_SIZE, f.size, 'How big do you start?') +
    '<p class="muted" style="margin:-4px 0 10px">Popularity ' + z.image + ', ' + cash(z.cash) + ' in the bank, a roster of ' + z.roster + ' unknowns.</p>' + pickRow('region', E.FED_REGION, f.region, 'Home territory') +
    '<p class="eyebrow">Women’s division</p><div class="row opts"><button class="btn sm' + (f.women ? ' on' : '') + '" data-act="setup-set" data-k="women" data-v="1">Yes</button><button class="btn sm' + (f.women ? '' : ' on') + '" data-act="setup-set" data-k="women" data-v="">No</button></div></section>' +
    '<section class="panel" style="margin-bottom:20px"><h2>The house style</h2>' + pickRow('style', E.STYLES, f.style, 'What wins matches here?') + pickRow('roots', E.ROOTS, f.roots, 'What does your crowd expect?') + pickRow('pledge', E.PLEDGE, f.pledge, 'What do you promise the locker room?') + '</section>' + diffPanel() +
    '<section class="panel" style="margin-bottom:20px"><h2>How it works</h2><p>You are owner and booker from day one. Nobody grants you booking power and nobody can fire you, but the money is yours to lose.</p><p style="margin-top:6px">Every title starts vacant. Run a tournament from the Titles screen to crown your first champion.</p></section>' +
    '<div class="row"><label class="row" style="gap:8px">Your name <input type="text" id="bname" maxlength="24" placeholder="The Booker" value="' + esc(U.setup.name || '') + '" data-inp="bname" style="width:24ch"></label><button class="btn go" data-act="begin">Open the doors</button><button class="btn" data-act="unpick">Back</button></div>' +
    '</div><div class="status"><span>Name your federation and open the doors</span></div></div>';
}
function setupView() {
  if (U.setup.pid === 'OWN') return fedSetupView();
  var d = E.universe().promotions.filter(function (p) { return p.id === U.setup.pid; })[0], o = d.owner;
  return '<div class="crt">' + startMenu() + '<div class="start">' +
    '<div class="head"><div><p class="eyebrow">' + esc(d.full || d.name) + '</p><h1><span class="hl">Your first day</span></h1></div></div>' +
    '<section class="panel" style="margin-bottom:20px"><h2>The owner</h2><p><b>' + esc(o.name) + '</b> owns ' + esc(d.name) + ' and has hired you to book it.</p>' +
    '<p style="margin-top:6px">House style: <b>' + esc(E.STYLES[o.style].n) + '.</b> ' + esc(E.STYLES[o.style].d) + ' ' + esc(o.name) + ' is happiest with ' + esc(E.STYLES[o.style].likes) + '.</p>' +
    '<p style="margin-top:6px">The crowd: <b>' + esc(E.ROOTS[o.roots].n) + '.</b> ' + esc(E.ROOTS[o.roots].d) + '</p>' +
    '<p style="margin-top:6px">The locker room was promised: <b>' + esc(E.PLEDGE[o.pledge].n) + '.</b> ' + esc(E.PLEDGE[o.pledge].d) + '</p></section>' +
    '<section class="panel" style="margin-bottom:20px"><h2>How it works</h2><p>You set the card. Every match has odds, and the dice decide the winner on the night.</p>' +
    '<p style="margin-top:6px">Each week ' + esc(o.name) + ' grants you <b>booking power</b>. Spend it to call a finish: 1 point for the favourite, 2 for an underdog, 3 for a long shot, and 1 more to change a title.</p>' +
    '<p style="margin-top:6px">Good shows and met directives raise the owner’s trust, which raises your allowance. Lose that trust and you are out. Earn enough of it and the company is yours.</p></section>' +
    diffPanel() + '<div class="row"><label class="row" style="gap:8px">Your name <input type="text" id="bname" maxlength="24" placeholder="The Booker" value="' + esc(U.setup.name || '') + '" data-inp="bname" style="width:24ch"></label><button class="btn go" data-act="begin">Take the job</button><button class="btn" data-act="unpick">Back</button></div>' +
    '</div><div class="status"><span>Enter a name and take the job</span></div></div>';
}

/* ---------- shell ---------- */
var TABS = [['office', 'Office'], ['booking', 'Booking'], ['roster', 'Roster'], ['story', 'Storylines'], ['titles', 'Titles'], ['history', 'History'], ['market', 'Market'], ['money', 'Finances'], ['company', 'Company'], ['world', 'World'], ['net', 'Net'], ['ach', 'Career']];
var NAVG = [
  { id: 'office', n: 'Office', pages: ['office', 'ach'], subs: [['oview', 'desk', 'The desk'], ['oview', 'back', 'Backstage'], ['tab', 'ach', 'Career']] },
  { id: 'booking', n: 'Booking', pages: ['booking'], subs: [] },
  { id: 'roster', n: 'Roster', pages: ['roster', 'titles', 'market'], subs: [['rview', 'table', 'Roster'], ['rview', 'room', 'Locker room'], ['tab', 'titles', 'Titles'], ['tab', 'market', 'Market']] },
  { id: 'story', n: 'Stories', pages: ['story', 'history', 'net'], subs: [['tab', 'story', 'Storylines'], ['tab', 'history', 'History'], ['tab', 'net', 'The Net']] },
  { id: 'company', n: 'Company', pages: ['company', 'money', 'world'], subs: [['tab', 'company', 'Front office'], ['tab', 'money', 'Finances'], ['tab', 'world', 'World']] }
];
function groupOf(tab) { for (var i = 0; i < NAVG.length; i++) if (NAVG[i].pages.indexOf(tab) >= 0) return NAVG[i]; return NAVG[0]; }
function subOn(x) { return x[0] === 'oview' ? U.tab === 'office' && (U.ov || 'desk') === x[1] : (x[0] === 'rview' ? U.tab === 'roster' && (U.rv || 'table') === x[1] : U.tab === x[1]); }
function navBar() {
  var n = pend(), g = groupOf(U.tab), P = me();
  return '<nav class="menu" aria-label="Sections">' + NAVG.map(function (t) {
    var b = t.id === 'office' && n ? ' <span class="badge">(' + n + ')</span>' : (t.id === 'booking' && !weekDone() ? ' <span class="badge">(' + (S.queue.length - S.qi) + ')</span>' : '');
    return '<button data-act="tab" data-v="' + t.id + '"' + (g === t ? ' aria-current="page"' : '') + '><u>' + t.n.charAt(0) + '</u>' + t.n.slice(1) + b + '</button>';
  }).join('') + '<span class="sp"></span><span class="ttl">' + esc(P.name) + ' \u00B7 ' + esc(E.cal(S.week).label) + '</span><button class="f1" data-act="help">Help</button></nav>';
}
function subNav() {
  var g = groupOf(U.tab); if (!g.subs.length || S.over || (U.tab === 'booking')) return '';
  return '<div class="subnav" role="group" aria-label="' + g.n + ' pages">' + g.subs.map(function (x) {
    var on = subOn(x), extra = x[1] === 'back' ? ' \u00B7 ' + (S.ap == null ? 0 : S.ap) + ' AP' + (S.court && S.court.length ? ' \u00B7 ' + S.court.length + ' in court' : '') : '';
    return '<button class="btn sm' + (on ? ' on' : '') + '" data-act="' + x[0] + '" data-v="' + x[1] + '"' + (on ? ' aria-pressed="true"' : '') + '>' + x[2] + extra + '</button>';
  }).join('') + '</div>';
}
function statusBar(P) {
  return '<footer class="status"><span><b>BP</b> ' + S.bp + '</span><span><b>AP</b> ' + (S.ap == null ? 0 : S.ap) + '</span><span><b>Cash</b> ' + cash(P.cash) + '</span><span><b>Pop</b> ' + P.image.toFixed(1) + '</span>' + (S.owner.me ? '' : '<span class="opt"><b>Owner</b> ' + Math.round(S.owner.trust) + '</span>') + '<span class="sp"></span>' +
    (U.live ? '<span class="opt"><b>Enter</b> continue</span><span class="opt"><b>Esc</b> skip</span>' : '') + padHints() + '<button data-act="options">[Options]</button></footer>';
}
function padHints() { return NAV.pad ? '<span class="opt"><b>A</b> select</span><span class="opt"><b>B</b> back</span><span class="opt"><b>LB RB</b> sections</span>' : (NAV.on ? '<span class="opt"><b>OK</b> select</span><span class="opt"><b>Back</b> back</span>' : ''); }
function flashBar() {
  var h = '';
  if (U.confirm === 'new') h += '<div class="flash err"><div class="row"><span>Start over? Your current game will be erased.</span><button class="btn danger" data-act="newgame-yes">Yes, new game</button><button class="btn" data-act="cancel">Keep playing</button></div></div>';
  if (U.flash) h += '<div class="flash' + (U.flash.err ? ' err' : '') + '" role="status">' + U.flash.html + '</div>';
  return h;
}
function afterRender(fk) {
  if (U.modal && !U.modal.shown) { U.modal.shown = true; if (!U.focus) U.focus = { id: 'modal-ok', pos: 0 }; }
  if (U.focus) { var el = document.getElementById(U.focus.id); if (el) { el.focus(); try { el.setSelectionRange(U.focus.pos, U.focus.pos); } catch (e) {} } U.focus = null; NAV.home = false; }
  else restoreFocus(fk);
}
function render() {
  document.documentElement.classList.toggle('crtfx', !!PREF.crt); applyScreen();
  if (BOOT) { app.innerHTML = bootView(); return; }
  var fk = focusKey();
  if (!S) { app.innerHTML = startView(); paintPortraits(); afterRender(fk); return; }
  if (U.live) U.focus = { id: 'live-go', pos: 0 };
  var v = S.over ? overView() : ({ office: officeView, booking: bookingView, roster: rosterView, story: storyView, titles: titlesView, history: historyView, market: marketView, money: moneyView, company: companyView, world: worldView, net: netView, ach: achView }[U.tab] || officeView)();
  app.innerHTML = '<div class="crt">' + navBar() + '<main class="main">' + flashBar() + subNav() + v + '</main>' + statusBar(me()) + '</div>' + (U.cwOpen && !S.over ? cawView() : '') + modalHtml();
  paintPortraits();
  [].forEach.call(document.querySelectorAll('tr.pick'), function (tr) { tr.tabIndex = 0; });
  afterRender(fk);
  flushToasts();
  typeLast();
}
function flushToasts() {
  while (S && S.toasts.length) {
    var id = S.toasts.shift(), a = E.ACH.filter(function (x) { return x.id === id; })[0]; if (!a) continue;
    PLATFORM.unlock(id); SFX.ach();
    var d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status');
    d.innerHTML = '<small>Achievement unlocked</small><b>' + esc(a.name) + '</b><div>' + esc(a.desc) + '</div>';
    toastBox.appendChild(d); while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild); (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 6000); })(d);
  }
}
function overView() {
  var fired = S.over.why === 'fired', P = me();
  var stats = '<div class="kv" style="margin:14px 0"><div><small>Booker level</small><span>' + S.booker.lvl + '</span></div><div><small>Shows run</small><span>' + S.stats.shows + '</span></div><div><small>Best show</small><span>' + S.stats.bestShow + '%</span></div><div><small>Best match</small><span>' + S.stats.bestMatch + '%</span></div><div><small>Feuds finished</small><span>' + S.stats.feudsDone + '</span></div></div>';
  var jobs = fired ? '<h2 style="margin:10px 0 6px">Somebody is always hiring</h2><p class="muted">You keep your level and skills. Pick up the phone:</p><div class="row" style="margin-top:8px">' + E.jobOffers(S).map(function (id) { return '<button class="btn" data-act="job" data-v="' + id + '">Book for ' + esc(S.promos[id].name) + '</button>'; }).join('') + '</div>' : '';
  return '<div class="head"><div><p class="eyebrow">' + esc(E.cal(S.over.week).label) + '</p><h1><span class="hl">' + (fired ? 'You are fired' : 'Out of business') + '</span></h1></div></div>' +
    '<div class="panel"><p>' + (fired ? esc(S.owner.name) + ' has lost faith in your booking and let you go from ' + esc(P.name) + '.' : esc(P.name) + ' ran out of money after six straight weeks in the red.') + '</p>' + stats + jobs +
    '<div class="row" style="margin-top:14px"><button class="btn go" data-act="newgame-yes">Start a new game</button></div></div>';
}

function youPanel() {
  var b = S.booker, o = S.owner, P = me(), need = E.xpNeed(b.lvl);
  var skills = '<ul class="list">' + Object.keys(E.SKILLS).map(function (k) {
    var sk = E.SKILLS[k], lv = b.sk[k];
    return '<li><span><b>' + esc(sk.n) + '</b> <span class="num gold">' + new Array(lv + 1).join('■') + '<span class="muted">' + new Array(sk.max - lv + 1).join('□') + '</span></span><br><span class="muted">' + esc(sk.d) + '</span></span>' + (b.pts > 0 && lv < sk.max ? '<button class="btn sm" data-act="skill" data-k="' + k + '">+1</button>' : '') + '</li>';
  }).join('') + '</ul>';
  return '<section class="panel"><h2>You</h2><p><b>' + esc(b.name) + '</b>, ' + (o.me ? 'owner and booker' : 'booker') + ' of ' + esc(P.name) + '</p>' +
    '<p class="muted">Difficulty: ' + esc((E.DIFF[S.diff] || E.DIFF.normal).n) + '</p><p>Level <b>' + b.lvl + '</b> ' + meter(b.xp / need * 100, 'au') + ' <span class="num muted">' + b.xp + '/' + need + ' XP</span>' + (b.pts ? ' · <span class="mark">' + b.pts + ' skill point' + (b.pts > 1 ? 's' : '') + '</span>' : '') + '</p>' +
    '<p>Booking power <b class="gold">' + S.bp + '</b> <span class="muted">(+' + S.bpGrant + ' a week, holds up to ' + (S.bpGrant * 2) + ')</span></p>' +
    (o.me ? '<p class="good">The company is yours. House style: ' + esc(E.STYLES[o.style].n) + '.</p>' : '<p>' + esc(o.name) + '’s trust ' + meter(o.trust, o.trust < 25 ? 'hot' : 'cool') + ' <span class="num">' + Math.round(o.trust) + '</span>' + (o.trust < 20 ? ' <span class="bad">Your job is in danger.</span>' : '') + '<br><span class="muted">House style: ' + esc(E.STYLES[o.style].n) + '. ' + esc(o.name) + ' wants ' + esc(E.STYLES[o.style].likes) + '.</span></p>') +
    skills + '</section>';
}
function trustPanel() {
  var t = S.trust == null ? 60 : S.trust, L = S.ledger || [];
  return '<p>Locker-room trust ' + meter(t, 'cool') + ' <span class="num">' + Math.round(t) + '</span></p>' +
    (L.length ? '<ul class="list">' + L.slice(0, 6).map(function (x) { return '<li><span>' + esc(x.t) + '</span><span class="tag ' + (x.k ? 'good' : 'bad') + '">' + (x.k ? 'Kept' : 'Broken') + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">No promises made yet. Keeping your word builds trust; breaking it costs far more than it earns.</p>');
}
function advicePanel() {
  var A = E.advice(S, S.card), any = A.some(function (a) { return a.tips.length; });
  if (!S.card.length) return '<p class="empty">Put a card together and your staff will look it over.</p>';
  if (!any) return '<p class="good">Nobody in the office has a complaint about this card.</p>';
  return A.filter(function (a) { return a.tips.length; }).map(function (a) { return '<p class="eyebrow" style="margin-top:6px">' + esc(a.who) + '</p>' + a.tips.map(function (t) { return '<p>“' + esc(t) + '”</p>'; }).join(''); }).join('');
}
function oddsText(m, i, n) {
  var o = E.matchOdds(S, m, i, n);
  if (!o) return '<span class="warn">Unfinished</span>';
  if (m.call != null) return '<span class="gold">Your call: ' + (m.call < 0 ? 'a draw' : esc(sideText(m.sides[m.call])) + ' wins') + ' (' + (m.call < 0 ? o.drawCost : o.cost[m.call]) + ' BP)</span>';
  return 'Favourite: <b>' + esc(sideText(m.sides[o.fav])) + '</b> ' + Math.round(o.p[o.fav] * 100) + '%';
}

/* ---------- office ---------- */
function repFor(sh) { for (var i = 0; i < S.reports.length; i++) if (S.reports[i].week === S.week && S.reports[i].id === sh.id) return i; return -1; }
function scheduleList() {
  return '<ul class="list">' + S.queue.map(function (sh, i) {
    var right;
    if (i < S.qi) { var ri = repFor(sh), r = ri >= 0 ? S.reports[ri] : null; right = r ? '<span class="row"><span class="num">' + r.rating + '%</span><button class="btn sm" data-act="report" data-v="' + ri + '">Report</button></span>' : '<span class="muted">Done</span>'; }
    else if (i === S.qi) right = '<button class="btn go" data-act="tab" data-v="booking">Book this show</button>';
    else right = '<span class="muted">Up next</span>';
    return '<li><span><b>' + esc(sh.name) + '</b> ' + (sh.big ? '<span class="tag gold">Big event</span>' : '<span class="tag">TV</span>') + (sh.brand ? ' <span class="tag">' + esc(brandName(me(), sh.brand)) + '</span>' : '') + '</span>' + right + '</li>';
  }).join('') + '</ul>';
}
function endWeekBtn() {
  var n = pend();
  return '<div class="row" style="margin-top:12px"><button class="btn go" data-act="endweek"' + (n ? ' disabled' : '') + '>End the week</button>' + (n ? '<span class="muted">Answer your inbox first.</span>' : '') + '</div>';
}
function questList() {
  if (!S.quests.length) return '<p class="empty">Nothing promised. Wrestlers and the network will ask soon enough.</p>';
  return '<ul class="list">' + S.quests.map(function (q) { var left = q.due - S.week; return '<li><span>' + esc(q.text) + '</span><span class="tag ' + (left <= 0 ? 'warn' : '') + '">' + (left <= 0 ? 'This week' : left + ' wk left') + '</span></li>'; }).join('') + '</ul>';
}
function gauge(frac) { var n = 18, f = Math.max(0, Math.min(n, Math.round(frac * n))), h = ''; for (var i = 0; i < n; i++) h += '<i' + (i < f ? ' class="on"' : '') + '></i>'; return '<div class="gauge" role="img" aria-label="' + Math.round(Math.max(0, Math.min(1, frac)) * 100) + ' percent">' + h + '</div>'; }
var NEWSH = { title: 'Title Change', injury: 'Injury Report', contract: 'Roster Update', story: 'Storylines', money: 'Front Office', world: 'Around the Territories', you: 'Your Career' };
function officeNews(n) {
  if (!S.news.length) return '<p class="empty">No news yet.</p>';
  var seen = {};
  return '<ul class="onews">' + S.news.slice(0, n).map(function (x) {
    var c = E.cal(x.w), k = seen[x.w] = (seen[x.w] || 0) + 1, day = (c.wom - 1) * 7 + Math.max(1, 8 - k);
    return '<li><span class="d num">' + (c.month + 1) + '/' + day + '/' + String(c.year).slice(-2) + '</span><span class="h">' + (NEWSH[x.k] || 'Office Memo') + '</span><span>' + esc(x.t) + '</span></li>';
  }).join('') + '</ul>';
}
function dashView() {
  var P = me(), H = P.hist, last = H[H.length - 1], wk = last ? last.net : 0, c0 = Math.max(1, P.cash0 || P.cash);
  var old = H.length >= 4 ? H[H.length - 4].image : P.image0, tr = Math.round((P.image - old) * 10) / 10;
  var rank = 1 + S.order.filter(function (id) { return S.promos[id].image > P.image; }).length, max = Math.max(1, (S.bpGrant || S.bp || 1) * 2), nb = E.nextBig(S);
  return '<div class="dash"><div class="stack">' +
    '<section class="gp"><h2>Cash</h2><p class="kv"><span>Current balance:</span><b class="num' + (P.cash < 0 ? ' bad' : '') + '">' + full(P.cash) + '</b></p>' + gauge(P.cash / (c0 * 2)) +
    '<p>Week change: <span class="num ' + (wk < 0 ? 'bad' : 'good') + '">' + (wk >= 0 ? '+' : '') + full(wk) + '</span>' + ' <span class="muted">· opened with ' + cash(c0) + '</span>' + '</p></section>' +
    '<section class="gp"><h2>Popularity</h2><p class="kv"><span>Company popularity:</span><b class="num">' + Math.round(P.image) + '%</b></p>' + gauge(P.image / 100) +
    '<p>Trend: ' + (tr >= 0.3 ? '<span class="good">▲ UP (+' + tr.toFixed(1) + ')</span>' : (tr <= -0.3 ? '<span class="bad">▼ DOWN (' + tr.toFixed(1) + ')</span>' : '<span class="muted">■ LEVEL</span>')) + ' <span class="muted">· No. ' + rank + ' of ' + S.order.length + '</span></p></section>' +
    '<section class="gp"><h2>Booking power</h2><p class="kv"><span>Current booking power:</span><b class="num">' + S.bp + '</b></p>' + gauge(S.bp / max) +
    '<p>Next event: <span class="gold">' + esc(nb.name.toUpperCase()) + '</span> <span class="muted">(' + (nb.week === S.week ? 'THIS WEEK' : 'WEEK ' + nb.week) + ')</span></p></section>' +
    '</div><section class="gp onw"><h2>Office news</h2>' + officeNews(4) + '<div class="row" style="margin-top:8px;justify-content:center"><button class="btn sm" data-act="tab" data-v="world">All the news</button></div></section></div>';
}
function dial(v, n, bad) {
  var W = 11, H = 5, rows = [];
  for (var y = 0; y < H; y++) {
    var ln = '';
    for (var x = 0; x < W; x++) {
      var dx = (x - (W - 1) / 2) / ((W - 1) / 2), dy = (y - (H - 1) / 2) / ((H - 1) / 2);
      if (dx * dx + dy * dy > 1.12) { ln += ' '; continue; }
      var a = Math.atan2(dx, -dy) / (2 * Math.PI); if (a < 0) a += 1;
      ln += Math.min(n - 1, Math.floor(a * n)) < v ? '<span class="on">█</span>' : '<span class="off">░</span>';
    }
    rows.push(ln);
  }
  return '<pre class="dial ' + (bad ? 'bad' : 'good') + '" aria-hidden="true">' + rows.join('\n') + '</pre>';
}
function clocksPanel() {
  var C = E.clocks(S);
  return '<section class="panel"><h2>Clocks</h2><div class="clocks">' + C.map(function (c) {
    return '<button class="clock" data-act="clock" data-k="' + c.id + '" aria-label="' + esc(c.n + ': ' + c.v + ' of ' + c.segs + '. ' + (c.why || '')) + '">' + dial(c.v, c.segs, c.bad) + '<span><b>' + esc(c.n) + '</b> <span class="num ' + (c.bad ? (c.v >= c.segs - 2 ? 'bad' : 'muted') : 'good') + '">' + c.v + '/' + c.segs + '</span><br><span class="muted">' + esc(c.why || 'Nothing moving') + '</span></span></button>';
  }).join('') + '</div><p class="muted" style="margin-top:6px">Red clocks are trouble building. Green clocks pay out when they fill. Select one to see what moves it.</p></section>';
}
var ROOMART = { office: ['╔═══╗', '║ $ ║', '╚═╩═╝'], court: [' ─┬─ ', '╱ │ ╲', '▔▔┴▔▔'], trainer: ['┌───┐', '│ + │', '└───┘'], gym: ['╔═╤═╗', '╟─┼─╢', '╚═╧═╝'], catering: [' ≈≈≈ ', '╲▁▁▁╱', ' ▔▔▔ '], lot: ['│P│ │', '│ │ │', '╵ ╵ ╵'], truck: ['┌───┐', '│▶ ■│', '└o─o┘'] };
function bsSelect(k, cur, list) { return '<select id="bs-' + k + '" data-ch="bs" data-k="' + k + '" aria-label="' + (k === 'a' ? 'First wrestler' : 'Second wrestler') + '"><option value="">Pick a wrestler</option>' + list.map(function (w) { return '<option value="' + w.id + '"' + (cur === w.id ? ' selected' : '') + '>' + esc(w.name) + ' · ' + Math.round(w.ovr) + ' ' + w.align + (w.inj > 0 ? ' · injured' : '') + '</option>'; }).join('') + '</select>'; }
function backstageView() {
  var B = E.backstage(S), bs = U.bs || (U.bs = { pl: null, a: null, b: null }), sel = bs.pl ? B.places.filter(function (p) { return p.id === bs.pl; })[0] : null;
  var R = E.rosterOf(S, S.player).filter(function (w) { return !w.nw; }).sort(function (a, b) { return b.ovr - a.ovr; });
  var pips = ''; for (var i = 0; i < B.max; i++) pips += i < B.ap ? '<span class="gold">◆</span>' : '<span class="muted">◇</span>';
  var map = '<div class="bsmap">' + B.places.map(function (p) {
    return '<button class="room' + (sel && sel.id === p.id ? ' on' : '') + (p.used ? ' used' : '') + '" data-act="bs-room" data-v="' + p.id + '"' + (sel && sel.id === p.id ? ' aria-pressed="true"' : '') + '><pre aria-hidden="true">' + ROOMART[p.id].join('\n') + '</pre><span class="rn">' + esc(p.n) + '</span><span class="rs">' + (p.used ? 'Visited this week' : (p.badge ? p.badge + ' case' + (p.badge > 1 ? 's' : '') + ' waiting' : ' ')) + '</span></button>';
  }).join('') + '</div>';
  var det = '<p class="empty">Pick a room. Each visit costs one action point, and you can visit each room once a week.</p>';
  if (sel) {
    var blocked = B.ap <= 0 ? 'You are out of action points this week.' : (sel.used ? 'You have already spent time here this week.' : '');
    det = '<p class="muted">' + esc(sel.d) + '</p>' + (blocked ? '<p class="bad" style="margin-top:4px">' + blocked + '</p>' : '') + '<ul class="list">';
    if (sel.id === 'court') {
      var cs = E.court(S);
      if (!cs.length) det += '<li><span class="empty">No cases on the docket. Disputes turn up when tempers do.</span></li>';
      cs.forEach(function (c) {
        var A = S.w[c.a], Bw = S.w[c.b], dis = blocked ? ' disabled' : '';
        det += '<li class="col"><span><b>' + esc(A.name) + ' against ' + esc(Bw.name) + '</b><br>' + esc(c.text) + '<br><span class="muted">' + (c.left ? 'Festers into a grudge in ' + c.left + ' week' + (c.left === 1 ? '' : 's') + '.' : 'Last chance: this turns into a grudge at the end of the week.') + '</span></span>' +
          '<span><span class="eyebrow">Witnesses</span><br>' + c.ev.map(function (e) { return esc(e.name) + (e.role ? ' <span class="tag gold">' + esc(e.role) + '</span>' : '') + ' backs <b>' + esc(e.backs) + '</b>'; }).join('<br>') + '</span>' +
          '<span class="row"><button class="btn sm" data-act="bs-court" data-id="' + c.id + '" data-v="0"' + dis + '>Find for ' + esc(A.name) + '</button><button class="btn sm" data-act="bs-court" data-id="' + c.id + '" data-v="1"' + dis + '>Find for ' + esc(Bw.name) + '</button>' +
          (c.ring ? '<button class="btn sm" data-act="bs-court" data-id="' + c.id + '" data-v="2"' + dis + '>Settle it in the ring</button>' : '') + '<button class="btn sm" data-act="bs-court" data-id="' + c.id + '" data-v="3"' + dis + '>Dismiss</button>' +
          (c.leader ? '<button class="btn sm" data-act="bs-deleg" data-id="' + c.id + '">Let a locker-room leader hear it (free)</button>' : '') + '</span></li>';
      });
      det += '</ul><p class="muted" style="margin-top:6px">A fair verdict builds locker-room trust; a wrong one costs it. Leaders and veterans are reliable witnesses. A toxic influence usually is not.</p>';
    } else {
      sel.acts.forEach(function (a) {
        det += '<li class="col"><span><b>' + esc(a.n) + '</b><br><span class="muted">' + esc(a.d) + '</span>' + (a.ck ? checkLine(a.n, a.ck) : '') + '</span><span class="row">' +
          (a.need ? bsSelect('a', bs.a, R) : '') + (a.need === 'pair' ? bsSelect('b', bs.b, a.same && bs.a != null && S.w[bs.a] ? R.filter(function (w) { return w.g === S.w[bs.a].g && w.id !== bs.a; }) : R) : '') + '<button class="btn sm go" data-act="bs-do" data-k="' + sel.id + '" data-v="' + a.id + '"' + (blocked ? ' disabled' : '') + '>Spend 1 action point</button></span></li>';
      });
      det += '</ul>';
    }
  }
  return '<div class="cols"><section class="panel"><h2>Backstage</h2><p>Action points this week: <span class="pips" role="img" aria-label="' + B.ap + ' of ' + B.max + '">' + pips + '</span> <span class="num">' + B.ap + ' of ' + B.max + '</span></p>' + map + '</section>' +
    '<section class="panel"><h2>' + (sel ? esc(sel.n) : 'Where to?') + '</h2>' + det + '</section></div>';
}
function housePanel() {
  var H = E.houseInfo(S);
  return '<section class="panel"><h2>House rules</h2><p><b>' + H.on.length + ' of ' + H.slots + '</b> slots in use.' + (H.wait ? ' <span class="bad">The room needs ' + H.wait + ' more week' + (H.wait === 1 ? '' : 's') + ' before a new rule.</span>' : '') + ' <span class="muted">A third slot opens at booker level 4, and another when you own the company.</span></p><ul class="list">' + H.rules.map(function (r) {
    return '<li><span><b>' + esc(r.n) + '</b>' + (r.on ? ' <span class="tag gold">In force</span>' : '') + '<br><span class="muted">' + esc(r.d) + '</span><br><span class="good">+ ' + esc(r.plus) + '</span><br><span class="bad">− ' + esc(r.minus) + '</span></span><button class="btn sm' + (r.on ? ' on' : '') + '" data-act="house" data-k="' + r.id + '"' + (!r.on && (H.on.length >= H.slots || r.clash || H.wait) ? ' disabled' : '') + '>' + (r.on ? 'Scrap it' : 'Adopt') + '</button></li>';
  }).join('') + '</ul></section>';
}
function chaosHtml() {
  var c = S.chs; if (!c || c.done) return '<p>The moment has passed.</p>';
  return '<pre class="ascii phone" aria-hidden="true">  .-------.\n /  ( ! )  \\\n \\_________/\n   |RED |\n   \'----\'</pre><p><b>' + esc(c.text) + '</b></p><p class="muted" style="margin-top:4px">The director is shouting in your headset. Make the call.</p>' +
    (c.checks ? Object.keys(c.checks).map(function (k) { return checkLine(c.choices[k], c.checks[k]); }).join('') : '') +
    '<div class="stack" style="gap:6px;margin-top:10px">' + c.choices.map(function (x, i) { return '<button class="btn' + (i === 0 ? ' go' : '') + '" data-act="chaos" data-c="' + i + '"' + (i === 0 ? ' id="modal-ok"' : '') + '>' + esc(x) + '</button>'; }).join('') + '</div>';
}
function officeView() {
  var P = me(), R = E.rosterOf(S, P.id), alerts = [];
  if (S.owner.pending) alerts.push('<span class="mark">The company is yours. Set your house style on the Company screen.</span>');
  if (P.neg > 0) alerts.push('<span class="bad">Cash has been negative for ' + P.neg + ' week' + (P.neg > 1 ? 's' : '') + '. Six in a row ends the game.</span>');
  P.titles.forEach(function (t) { if (!t.holders.length) alerts.push('The ' + esc(t.name) + ' ' + (t.tag ? 'are' : 'is') + ' vacant. Book a match for ' + (t.tag ? 'them' : 'it') + ' to crown a champion.'); });
  R.filter(function (w) { return w.inj > 0; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 5).forEach(function (w) { alerts.push(nm(w) + ' is injured: ' + w.inj + ' week' + (w.inj > 1 ? 's' : '') + ' left.'); });
  R.filter(function (w) { return w.con <= 8; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 5).forEach(function (w) { alerts.push(nm(w) + '’s contract ends in ' + Math.max(0, w.con) + ' week' + (w.con === 1 ? '' : 's') + '.'); });
  R.filter(function (w) { return (w.stress || 0) >= 60; }).slice(0, 4).forEach(function (w) { alerts.push(nm(w) + ' is under strain (stress ' + Math.round(w.stress) + ').'); });
  R.filter(function (w) { return w.morale < 40; }).slice(0, 4).forEach(function (w) { alerts.push(nm(w) + ' is unhappy (morale ' + Math.round(w.morale) + ').'); });
  var inbox = S.inbox.length ? '<ul class="list">' + S.inbox.map(function (e) {
    var h = '<li><span>' + esc(e.text);
    if (e.result) h += '<br>' + dice(e.roll) + '<span class="' + (e.roll ? (e.roll.ok ? 'good' : 'bad') : 'muted') + '">' + esc(e.result) + '</span>';
    if (!e.done && e.checks) h += Object.keys(e.checks).map(function (k) { return checkLine(e.choices[k], e.checks[k]); }).join('');
    h += '</span>';
    if (!e.done) h += '<span class="row">' + e.choices.map(function (c, i) { return '<button class="btn sm" data-act="ev" data-id="' + e.id + '" data-c="' + i + '">' + esc(c) + '</button>'; }).join('') + '</span>';
    return h + '</li>';
  }).join('') + '</ul>' : '<p class="empty">A quiet week in the office.</p>';
  if (U.ov === 'back') return '<div class="head"><div><p class="eyebrow">' + esc(E.cal(S.week).label) + '</p><h1><span class="hl">Backstage - Week ' + S.week + '</span></h1></div></div>' + backstageView();
  var q = questList();
  return '<div class="head"><div><p class="eyebrow">' + esc(E.cal(S.week).label) + '</p><h1><span class="hl">Office - Week ' + S.week + '</span></h1></div></div>' + dashView() +
    '<div class="cols"><div class="stack">' +
    '<section class="panel"><h2>This week</h2>' + scheduleList() + (weekDone() ? endWeekBtn() : '') + '</section>' +
    '<section class="panel"><h2>Inbox</h2>' + inbox + '</section>' +
    '<section class="panel"><h2>Promises and targets</h2>' + q + '</section>' +
    '</div><div class="stack">' +
    '<section class="panel"><h2>Needs attention</h2>' + (alerts.length ? '<ul class="list">' + alerts.map(function (a) { return '<li><span>' + a + '</span></li>'; }).join('') + '</ul>' : '<p class="empty">Nothing urgent.</p>') + '</section>' +
    clocksPanel() + '</div></div>';
}
function sagaPanel() {
  var G = E.sagaInfo(S); if (!G) return '';
  return '<section class="panel"><h2>Season ' + G.n + ' saga</h2><ul class="list">' + G.ch.map(function (c, i) {
    var st = c.done === true ? '<span class="tag good">Done</span>' : (c.done === false ? '<span class="tag bad">Missed</span>' : (c.cur ? '<span class="tag gold">' + c.v + ' of ' + c.need + '</span>' : '<span class="tag">To come</span>'));
    return '<li><span><b>Chapter ' + (i + 1) + ': ' + esc(c.name) + '</b>' + (c.goal && (c.cur || c.done != null) ? '<br><span class="muted">' + esc(c.goal) + (c.cur && c.done == null ? ' By ' + esc(E.cal(c.due).label) + '.' : '') + '</span>' : '') + '</span>' + st + '</li>';
  }).join('') + '</ul><p class="muted" style="margin-top:8px">A chapter lasts twelve weeks. Finishing one earns 2 booking power. The season ends with a chronicle on the History screen.</p></section>';
}
function newsList(n) {
  if (!S.news.length) return '<p class="empty">No news yet.</p>';
  return '<ul class="list news">' + S.news.slice(0, n).map(function (x) { return '<li><span class="num muted">Wk ' + x.w + '</span><span>' + esc(x.t) + '</span></li>'; }).join('') + '</ul>';
}

/* ---------- booking ---------- */
function complete(m) { return m.sides.every(function (s) { return s.every(function (id) { return id != null; }); }); }
function sidesHtml(m) { if (m.mt === 'br') return '<span class="muted">Battle royal:</span> ' + m.sides.map(function (s) { return s[0] == null ? '<span class="muted">open spot</span>' : nm(S.w[s[0]]); }).join(', '); return m.sides.map(function (s) { return s.map(function (id) { return id == null ? '<span class="muted">open spot</span>' : nm(S.w[id]); }).join(' &amp; '); }).join(' <span class="muted">vs</span> '); }
function sideText(s) { return s.map(function (id) { return id == null ? 'open spot' : S.w[id].name; }).join(' & '); }
function wrestlerSelect(id, sel, attrs, elig, onCard) {
  var groups = { M: '', F: '' };
  elig.forEach(function (w) { groups[w.g] += '<option value="' + w.id + '"' + (w.id === sel ? ' selected' : '') + '>' + esc(w.name) + ' · ' + Math.round(w.ovr) + ' ' + w.align + (w.promo !== S.player ? ' · visiting' : '') + (w.cond < 45 ? ' · worn down' : '') + (onCard[w.id] ? ' · booked' : '') + '</option>'; });
  return '<select id="' + id + '" ' + attrs + '><option value="">Pick a wrestler</option>' + (groups.M ? '<optgroup label="Men">' + groups.M + '</optgroup>' : '') + (groups.F ? '<optgroup label="Women">' + groups.F + '</optgroup>' : '') + '</select>';
}
function editor(m, i, show) {
  var P = me(), elig = E.eligible(S).slice().sort(function (a, b) { return b.ovr - a.ovr; }), inE = {}, onCard = {};
  elig.forEach(function (w) { inE[w.id] = 1; });
  S.card.forEach(function (x, k) { if (k !== i) x.sides.forEach(function (s) { s.forEach(function (id) { if (id != null) onCard[id] = 1; }); }); });
  var h = '<div class="editor"><label class="f">Match type<select id="m' + i + '-type" data-ch="mt" data-i="' + i + '">' + Object.keys(E.MT).map(function (k) { return '<option value="' + k + '"' + (m.mt === k ? ' selected' : '') + '>' + E.MT[k].n + '</option>'; }).join('') + '</select></label>';
  var teams = m.mt === 'tag' ? S.teams.filter(function (t) { return t.promo === P.id && inE[t.m[0]] && inE[t.m[1]]; }) : [];
  m.sides.forEach(function (s, k) {
    h += '<div class="side">';
    s.forEach(function (id, p) { h += '<label class="f">' + (m.sides.length > 2 ? (m.mt === 'br' ? 'Entrant ' : 'Wrestler ') + (k + 1) : (s.length > 1 ? 'Team ' + (k + 1) + ', member ' + (p + 1) : (k === 0 ? 'In this corner' : 'Opponent'))) + wrestlerSelect('m' + i + '-s' + k + '-' + p, id, 'data-ch="slot" data-i="' + i + '" data-s="' + k + '" data-p="' + p + '"', elig, onCard) + '</label>'; });
    if (teams.length) h += '<label class="f">Or pick a team<select id="m' + i + '-t' + k + '" data-ch="team" data-i="' + i + '" data-s="' + k + '"><option value="">Regular teams</option>' + teams.map(function (t) { return '<option value="' + t.id + '">' + teamName(t) + '</option>'; }).join('') + '</select></label>';
    h += '</div>';
  });
  var od = E.matchOdds(S, m, i, S.card.length);
  h += '<label class="f">Call the finish<select id="m' + i + '-call" data-ch="call" data-i="' + i + '"><option value="">Let it play out (free)</option>' + (od ? m.sides.map(function (s, k) { return '<option value="' + k + '"' + (m.call === k ? ' selected' : '') + '>' + esc(sideText(s)) + ' wins · ' + Math.round(od.p[k] * 100) + '% · ' + od.cost[k] + ' BP</option>'; }).join('') + (m.sides.length === 2 ? '<option value="-1"' + (m.call === -1 ? ' selected' : '') + '>Draw · ' + od.drawCost + ' BP</option>' : '') : '') + '</select></label>';
  var ts = E.showTitles(S).filter(function (t) { return t.tag ? m.mt === 'tag' : (E.MT[m.mt].per === 1 && !(m.mt === 'br' && t.holders.length)); });
  h += '<label class="f">Title on the line<select id="m' + i + '-title" data-ch="title" data-i="' + i + '"><option value="">No title</option>' + ts.map(function (t) { return '<option value="' + t.id + '"' + (m.title === t.id ? ' selected' : '') + '>' + esc(t.name) + (t.holders.length ? '' : ' (vacant)') + '</option>'; }).join('') + '</select></label>';
  h += '<label class="f">Stipulation<select id="m' + i + '-stip" data-ch="stip" data-i="' + i + '">' + Object.keys(E.STIP).map(function (k) { return '<option value="' + k + '"' + (m.stip === k ? ' selected' : '') + '>' + E.STIP[k].n + '</option>'; }).join('') + '</select></label>';
  h += '<label class="f">Intensity<select id="m' + i + '-int" data-ch="int" data-i="' + i + '">' + Object.keys(E.INTN).map(function (k) { return '<option value="' + k + '"' + ((m.int || 'normal') === k ? ' selected' : '') + '>' + E.INTN[k].n + (k === 'safe' ? ' \u00B7 less wear, flatter crowd' : (k === 'brutal' ? ' \u00B7 louder crowd, heavy wear' : '')) + '</option>'; }).join('') + '</select></label>';
  h += '<label class="f">Length<select id="m' + i + '-len" data-ch="len" data-i="' + i + '">' + [['S', 'Short'], ['M', 'Medium'], ['L', 'Long']].map(function (x) { return '<option value="' + x[0] + '"' + (m.len === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>';
  if (od && od.chem != null) h += '<p class="muted" style="grid-column:1/-1">Ring chemistry between them: ' + (od.chem >= 2.2 ? '<span class="good">great</span>' : (od.chem <= -2.2 ? '<span class="bad">poor</span>' : 'ordinary')) + '.</p>';
  return h + '</div>';
}
function matchRow(m, i, n, show) {
  var P = me(), t = m.title ? P.titles.filter(function (x) { return x.id === m.title; })[0] : null, open = U.edit === i;
  var win = oddsText(m, i, n);
  var meta = [E.MT[m.mt].n, { S: 'Short', M: 'Medium', L: 'Long' }[m.len]];
  if (m.stip !== 'std') meta.push(E.STIP[m.stip].n);
  if (m.int && m.int !== 'normal') meta.push('<span class="' + (m.int === 'brutal' ? 'bad' : 'good') + '">' + E.INTN[m.int].n + '</span>');
  return '<div class="seg' + (i === n - 1 ? ' me' : '') + '"><div class="no" aria-hidden="true">' + (i + 1) + '</div><div class="body">' +
    '<div class="line1"><div><div class="who">' + sidesHtml(m) + '</div><div class="meta">' + (i === n - 1 ? 'Main event · ' : '') + meta.join(' · ') + (t ? ' · <span class="gold">' + esc(t.name) + '</span>' : '') + ' · ' + win + '</div></div>' +
    '<div class="row"><button class="btn sm" data-act="edit" data-v="' + i + '">' + (open ? 'Done' : 'Edit') + '</button><button class="btn sm" data-act="up" data-v="' + i + '" aria-label="Move match ' + (i + 1) + ' earlier"' + (i === 0 ? ' disabled' : '') + '>↑</button><button class="btn sm" data-act="down" data-v="' + i + '" aria-label="Move match ' + (i + 1) + ' later"' + (i === n - 1 ? ' disabled' : '') + '>↓</button><button class="btn sm" data-act="rm" data-v="' + i + '">Remove</button></div></div>' +
    (open ? editor(m, i, show) : '') + '</div></div>';
}
function feudPanel(onCard) {
  var fs = E.activeFeuds(S).filter(function (f) { return f.promo === S.player; }).sort(function (a, b) { return b.heat - a.heat; });
  if (!fs.length) return '<p class="empty">No rivalries yet. They start on their own once you run shows.</p>';
  return '<ul class="list">' + fs.map(function (f) {
    var ids = f.a.concat(f.b), booked = onCard ? ids.filter(function (id) { return onCard[id]; }).length : -1, out = ids.filter(function (id) { return S.w[id].inj > 0; }).length;
    return '<li><span><b>' + esc(E.feudLabel(S, f)) + '</b><br><span class="muted">' + E.feudStage(f) + (f.kind === 'dream' ? ' · dream match' : '') + (out ? ' · injury' : '') + (booked >= 0 ? ' · ' + (booked === ids.length ? 'all booked tonight' : (booked ? 'partly booked tonight' : 'not booked tonight')) : '') + '</span></span><span class="row">' + meter(f.heat, 'hot') + '<span class="num">' + Math.round(f.heat) + '</span></span></li>';
  }).join('') + '</ul>';
}
function bookSide(onCard) {
  var k = U.bk || 'advice', tabs = [['advice', 'Staff notes'], ['promo', 'Opening promo'], ['feuds', 'Storylines'], ['targets', 'Targets']], tr = tournOwed(onCard);
  var body = k === 'promo' ? promoPanel() : (k === 'feuds' ? '<section class="panel"><h2>Storylines in play</h2>' + feudPanel(onCard) + '<p class="muted" style="margin-top:8px">Rivals who are both on the show get promos, brawls and run-ins. A hot feud ends with a win at a big event or in a gimmick match.</p></section>' :
    (k === 'targets' ? '<section class="panel"><h2>Promises and targets</h2>' + questList() + '</section>' : '<section class="panel"><h2>The office says</h2>' + advicePanel() + '</section>'));
  return '<div class="subnav" role="group" aria-label="Booking notes">' + tabs.map(function (t) { return '<button class="btn sm' + (k === t[0] ? ' on' : '') + '" data-act="bk" data-v="' + t[0] + '"' + (k === t[0] ? ' aria-pressed="true"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>' + body + tr;
}
function bookingView() {
  if (U.report != null && S.reports[U.report]) return U.live && S.reports[U.report].venue ? liveView(S.reports[U.report]) : reportView(S.reports[U.report]);
  var P = me(), c = E.cal(S.week);
  if (weekDone()) {
    return '<div class="head"><div><p class="eyebrow">' + esc(c.label) + '</p><h1><span class="hl">Week booked</span></h1></div></div>' +
      '<section class="panel"><h2>This week</h2>' + scheduleList() + endWeekBtn() + '</section>';
  }
  var show = S.queue[S.qi], n = S.card.length, v = E.validate(S, S.card), onCard = {};
  S.card.forEach(function (m) { m.sides.forEach(function (s) { s.forEach(function (id) { if (id != null) onCard[id] = 1; }); }); });
  var msgs = '', pre = S.pre && !S.pre.done && S.pre.key === S.week + ':' + show.id ? S.pre : null;
  if (pre) msgs += '<section class="panel" style="margin-bottom:18px"><h2>Before the show</h2><p>' + esc(pre.text) + '</p><div class="row" style="margin-top:10px">' + pre.choices.map(function (c, i) { return '<button class="btn go" data-act="pre" data-c="' + i + '">' + esc(c) + '</button>'; }).join('') + '</div></section>';
  if (U.tried && v.errors.length) msgs += '<div class="flash err"><b>Fix before the show can run</b><ul style="margin:6px 0 0;padding-left:18px">' + v.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
  if (n && v.warnings.length) msgs += '<div class="flash">' + v.warnings.map(esc).join('<br>') + '</div>';
  var sheet = n ? '<div class="sheet">' + S.card.map(function (m, i) { return matchRow(m, i, n, show); }).join('') + '</div>' :
    '<div class="panel"><p><b>The card is empty.</b> Add matches one at a time, or start from a suggested card and change what you like.</p><p class="muted" style="margin-top:6px">You choose who wrestles. The odds decide who wins, unless you spend booking power to call a finish. Finishes, interviews and run-ins come from the storylines in play.</p></div>';
  return '<div class="head"><div><p class="eyebrow">' + esc(c.label) + ' · show ' + (S.qi + 1) + ' of ' + S.queue.length + '</p><h1><span class="hl">' + esc(show.name) + '</span></h1>' +
    '<p class="muted" style="margin-top:4px">' + (show.big ? 'Big event' + (show.flag ? ', the biggest of the year' : '') + '. Whole roster available.' : 'Weekly TV' + (show.brand ? ', ' + esc(brandName(P, show.brand)) + ' brand roster' : '') + '.') + ' The crowd expects about <b class="num">' + E.expected(S, show) + '%</b>.</p>' + (show.rule && E.RULES[show.rule] ? '<p class="good" style="margin-top:4px">' + esc(E.RULES[show.rule]) + '</p>' : '') + '<p style="margin-top:4px">Booking power: <b class="gold">' + S.bp + '</b>' + (E.cardCost(S, S.card) ? ' <span class="' + (E.cardCost(S, S.card) > S.bp ? 'bad' : 'muted') + '">(' + E.cardCost(S, S.card) + ' committed on this card)</span>' : ' <span class="muted">(nothing called yet: every match plays out on the odds)</span>') + '</p></div>' +
    '<div class="row"><button class="btn" data-act="suggest">Suggest a card</button><button class="btn" data-act="add">Add a match</button>' + (n ? '<button class="btn" data-act="clear">Clear</button>' : '') + (pre ? '' : '<button class="btn go" data-act="run">Run the show</button>') + '</div></div>' +
    msgs + '<div class="cols"><div class="stack">' + sheet + '</div><div class="stack">' +
    bookSide(onCard) +
    '</div></div>';
}
function promoPanel() {
  var L = E.promoBrief(S), pl = S.plan, x = E.xfState(S);
  var h = '<section class="panel"><h2>Opening promo</h2><label class="f">Who opens the show?<select id="plan-sp" data-ch="plan" data-k="sp"><option value="">Nobody. Leave it to the writers</option>' + L.map(function (w) { return '<option value="' + w.id + '"' + (pl && pl.sp === w.id ? ' selected' : '') + '>' + esc(w.name) + ' · mic ' + w.mic + '</option>'; }).join('') + '</select></label>';
  if (pl) {
    var o = E.promoOdds(S, pl);
    h += '<label class="f" style="margin-top:8px">About what?<select id="plan-topic" data-ch="plan" data-k="topic">' + Object.keys(E.TOPIC).map(function (k) { return '<option value="' + k + '"' + (pl.topic === k ? ' selected' : '') + '>' + esc(E.TOPIC[k].n) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f" style="margin-top:8px">How?<select id="plan-del" data-ch="plan" data-k="del">' + Object.keys(E.DELIV).map(function (k) { return '<option value="' + k + '"' + (pl.del === k ? ' selected' : '') + '>' + esc(E.DELIV[k].n) + '</option>'; }).join('') + '</select></label>' +
      '<p class="muted" style="margin-top:8px">' + esc(E.DELIV[pl.del].d) + ' ' + esc(o.why) + '.</p>' + checkLine('Delivery (up to ' + o.cap + ' of 10)', o.ck) +
      '<p>Content <b>' + o.content + '</b> · Character <b>' + o.character + '</b> · Crowd <b>' + o.crowd + '</b> <span class="muted">out of 10</span></p>';
  } else h += '<p class="muted" style="margin-top:8px">Pick someone and you choose the subject and how tightly it is scripted. It is scored on delivery, content, character and crowd, and it counts toward the show.</p>';
  if (x) h += '<p class="note" style="margin-top:8px"><span>' + (x.kind === 'war' ? 'War with ' : 'Supershow with ') + esc(S.promos[x.with].name) + ': ' + x.sc[0] + '–' + x.sc[1] + '. Their wrestlers are marked “visiting” in the match editor' + (x.kind === 'war' ? '' : ' at the big event') + '.</span></p>';
  return h + '</section>';
}
function tournOwed(onCard) {
  var T = E.tournActive(S); if (!T || !T.pend.length) return '';
  return '<section class="panel"><h2>' + esc(T.name) + '</h2><ul class="list">' + T.pend.slice(0, 8).map(function (p) { var on = onCard[p[0]] && onCard[p[1]] && S.card.some(function (m) { return m.mt === '1v1' && ((m.sides[0][0] === p[0] && m.sides[1][0] === p[1]) || (m.sides[0][0] === p[1] && m.sides[1][0] === p[0])); }); return '<li><span>' + nm(S.w[p[0]]) + ' <span class="muted">vs</span> ' + nm(S.w[p[1]]) + '</span><span class="tag ' + (on ? 'good' : '') + '">' + (on ? 'On tonight' : 'Still to run') + '</span></li>'; }).join('') + '</ul>' + (T.pend.length > 8 ? '<p class="muted">And ' + (T.pend.length - 8) + ' more.</p>' : '') + '<p class="muted" style="margin-top:8px">Book these as singles matches. A disqualification or count-out in a knockout match means it has to be run again.</p></section>';
}
/* ---------- the broadcast: click through the show ---------- */
function lead(seg) { var b = seg.bc || [], i = 0; while (i < b.length && (b[i].t === 'ring' || b[i].t === 'ent')) i++; return Math.max(0, i - 1); }
function verdict(r) { var d = r.rating - r.exp; return d >= 4 ? 'Well above what the crowd expected' : d >= 0.5 ? 'Better than the crowd expected' : d > -0.5 ? 'Right on expectations' : d > -4 ? 'A little under expectations' : 'Well under expectations'; }
function line(r, b, last) {
  if (b.t === 'note') return '<p class="ln note' + (last ? ' last' : '') + '">' + esc(b.x) + '</p>';
  if (b.t === 'ent') return '<p class="ln ent' + (last ? ' last' : '') + '">' + esc(b.x) + '</p>';
  var who = b.t === 'pbp' ? r.ann[0].split(' ').pop() : (b.t === 'col' ? r.ann[1].split(' ').pop() : 'Ring');
  return '<p class="ln ' + b.t + (last ? ' last' : '') + '"><span class="sp">' + esc(who) + ':</span><span class="tx">' + esc(b.x) + '</span></p>';
}
function vsStrip(s) {
  var ids = s.ids || [], ns = (s.sidesN || []).length; if (!ns || ids.length > 6 || ids.length % ns) return '';
  var per = ids.length / ns, h = '';
  for (var k = 0; k < ns; k++) { if (k) h += '<b aria-hidden="true">VS</b>'; h += '<span class="row" style="gap:6px">' + ids.slice(k * per, k * per + per).map(function (id) { return S.w[id] ? portrait(S.w[id]) : ''; }).join('') + '</span>'; }
  return '<div class="vs">' + h + '</div>';
}
function liveView(r) {
  var L = U.live, n = r.segs.length, P = me(), h = '', foot = '';
  var ms = r.segs.filter(function (s) { return s.k === 'match'; }), city = r.venue.replace(/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/, '');
  var bar = '<div class="bar"><span>' + esc(r.name) + '</span><span>' + (L.s < 0 ? 'On the air' : (L.s >= n ? 'Sign-off' : 'Segment ' + (L.s + 1) + ' of ' + n)) + '</span></div>';
  var rule = '<div class="rule" aria-hidden="true">' + new Array(61).join('═') + '</div>';
  if (L.s < 0) {
    h = '<div class="card">' + rule + '<p class="eyebrow">' + esc(P.name) + ' presents</p>' + (r.big ? banner(r.name.replace(P.name + ' ', ''), 'gold') : '<div class="show">' + esc(r.name) + '</div>') + rule +
      '<p><b>Live from the ' + esc(r.venue) + '</b> · ' + esc(E.cal(r.week).label) + '</p><p>Your hosts: ' + esc(r.ann[0]) + ' and ' + esc(r.ann[1]) + '</p>' +
      '<p class="eyebrow" style="margin-top:10px">Tonight</p><ol>' + r.lineup.map(function (x, i) { return '<li>' + (i === r.lineup.length - 1 ? '<span class="gold">Main event:</span> <b>' + esc(x) + '</b>' : (i + 1) + '. ' + esc(x)) + '</li>'; }).join('') + '</ol>' + (r.pre ? '<p class="good">Before the show: ' + esc(r.pre) + '</p>' : '') + '</div>' +
      line(r, { t: 'pbp', x: 'Welcome, everybody, to ' + r.name + '! We are live in ' + city + ' with ' + r.att.toLocaleString('en-US') + ' on hand' + (r.sellout ? ', and this place is sold out!' : '.') }) +
      line(r, { t: 'col', x: 'And wait until you see the main event: ' + r.lineup[r.lineup.length - 1].split(' — ')[0] + '.' }, true);
    foot = '<button id="live-go" class="btn go" data-act="live-next">Ring the bell</button><button class="btn sm" data-act="live-end">Skip to the results</button>';
  } else if (L.s >= n) {
    h = '<div class="card">' + rule + '<p class="eyebrow">That is the show</p><div class="show">' + r.rating + '%</div>' + rule + '<p><b>' + verdict(r) + '</b> (' + r.exp + '%).</p></div>' +
      '<div class="kv" style="margin:8px 0"><div><small>Attendance</small><span>' + r.att.toLocaleString('en-US') + (r.sellout ? ' <span class="mark">sell-out</span>' : '') + '</span></div><div><small>TV viewers</small><span>' + (r.viewers / 1e6).toFixed(2) + 'M</span></div>' + (r.big ? '<div><small>Buys</small><span>' + r.buys.toLocaleString('en-US') + '</span></div>' : '') + '<div><small>Best match</small><span>' + Math.max.apply(null, ms.map(function (s) { return s.ov; })) + '%</span></div></div>' +
      line(r, { t: 'pbp', x: 'For ' + r.ann[1] + ' and everyone at ' + P.name + ', I am ' + r.ann[0] + '. Good night from ' + city + '!' }, true);
    foot = '<button id="live-go" class="btn go" data-act="live-done">See the full report</button>';
  } else {
    var s = r.segs[L.s], bc = s.bc || [], done = L.b >= bc.length, mi = ms.indexOf(s);
    if (s.k === 'match') {
      var meta = [s.mt, s.mins + ' min']; if (s.stip) meta.push(s.stip);
      h = '<p class="eyebrow">' + (mi === ms.length - 1 ? 'Main event' : 'Match ' + (mi + 1) + ' of ' + ms.length) + ' · ' + meta.join(' · ') + (s.title ? ' · <span class="gold">' + esc(s.title) + '</span>' : '') + '</p><h1>' + esc(s.label) + '</h1>' + vsStrip(s);
    } else h = '<p class="eyebrow">' + esc(s.head) + '</p><h1>Meanwhile...</h1>';
    var shown = bc.slice(0, Math.min(bc.length, L.b + 1));
    h += shown.map(function (b, i) { return line(r, b, !done && i === shown.length - 1); }).join('');
    if (done) {
      h += s.k === 'match' ? (s.change ? beltArt(s.title) : '') + '<div class="result"><p><b>' + (s.win ? 'Winner: ' + esc(s.win) : 'Draw') + '</b> · <span class="gold">' + s.ov + '% ' + stars(s.ov) + '</span></p>' + oddsLine(s) + '<div class="scores"><div><span>Match quality</span><span>' + meter(s.mq) + ' ' + s.mq + '%</span></div><div><span>Crowd reaction</span><span>' + meter(s.cr, 'hot') + ' ' + s.cr + '%</span></div><div><span>Worker effort</span><span>' + meter(s.eff, 'cool') + ' ' + s.eff + '%</span></div><div class="ov"><span>Overall</span><span>' + meter(s.ov, 'au') + ' ' + s.ov + '%</span></div></div>' + fxList(s, 5) + '</div>' :
        '<div class="result"><p>Segment rating: <span class="gold">' + s.ov + '%</span> ' + meter(s.ov, 'au') + '</p></div>';
      var nx = r.segs[L.s + 1];
      foot = '<button id="live-go" class="btn go" data-act="live-next">' + (nx ? (nx.k === 'match' ? 'Next match' : 'Next') : 'Close the show') + '</button>';
    } else foot = '<button id="live-go" class="btn go" data-act="live-next">Continue</button><button class="btn sm" data-act="live-skip">Skip to the result</button>';
    if (L.s < n - 1 || !done) foot += '<button class="btn sm" data-act="live-end">Skip the rest of the show</button>';
  }
  return '<div class="live" id="live">' + bar + h + '<div class="foot">' + foot + '<span class="blink" aria-hidden="true">_</span></div></div>';
}
function reportView(r) {
  var P = me(), d = r.rating - r.exp, ms = r.segs.filter(function (s) { return s.k === 'match'; }), no = 0;
  var segs = r.segs.map(function (s) {
    if (s.k === 'angle') return '<div class="angle"><p><span class="tag">' + esc(s.head) + '</span> ' + esc(s.text) + (s.rub ? '<br><span class="muted">Delivery ' + s.rub.d + ' · Content ' + s.rub.c + ' · Character ' + s.rub.ch + ' · Crowd ' + s.rub.cr + ' out of 10</span>' : '') + '</p><span class="num">' + s.ov + '%</span></div>';
    no++;
    var meta = [s.mt, s.mins + ' min']; if (s.stip) meta.push(s.stip);
    return '<div class="seg' + (no === ms.length ? ' me' : '') + '"><div class="no" aria-hidden="true">' + no + '</div><div class="body">' +
      '<div class="line1"><div><div class="who">' + esc(s.label) + '</div><div class="meta">' + (no === ms.length ? 'Main event · ' : '') + meta.join(' · ') + (s.title ? ' · <span class="gold">' + esc(s.title) + '</span>' : '') + '</div></div><div class="gold">' + s.ov + '% ' + stars(s.ov) + '</div></div>' +
      oddsLine(s) + '<div class="pbp">' + s.lines.map(esc).join('<br>') + '<br><b>' + esc(s.finish) + '</b></div>' +
      '<div class="scores"><div><span>Match quality</span><span class="num">' + s.mq + '%</span></div><div><span>Crowd reaction</span><span class="num">' + s.cr + '%</span></div><div><span>Worker effort</span><span class="num">' + s.eff + '%</span></div><div class="ov"><span>Overall</span><span class="num">' + s.ov + '%</span></div></div>' +
      fxList(s, 8) + s.notes.map(function (x) { return '<p class="note"><span>' + esc(x) + '</span></p>'; }).join('') + '</div></div>';
  }).join('');
  if (r.pre) segs = '<div class="angle"><p><span class="tag">Before the show</span> ' + esc(r.pre) + '</p></div>' + segs;
  var own = r.owner && r.owner.text ? '<p class="note"><span>' + esc(r.owner.text) + (r.owner.bonus ? ' You earn 1 booking power.' : '') + '</span></p>' : '';
  var sheet = r.sheet ? '<section class="panel" style="margin-bottom:18px"><h2>The dirt sheet</h2><p class="eyebrow">' + esc(r.sheet.by) + '</p>' + r.sheet.lines.map(function (x) { return '<p style="margin-top:4px">' + esc(x) + '</p>'; }).join('') + '</section>' : '';
  var again = r.venue ? '<button class="btn sm" data-act="replay">Replay the broadcast</button>' : '';
  var next = r.week === S.week ? (weekDone() ? endWeekBtn().replace('</div>', again + '</div>') : '<div class="row" style="margin-top:12px"><button class="btn go" data-act="closeReport">Book ' + esc(S.queue[S.qi].name) + '</button>' + again + '</div>') : '<div class="row" style="margin-top:12px"><button class="btn" data-act="closeReport">Back</button>' + again + '</div>';
  return '<div class="head"><div><p class="eyebrow">' + esc(E.cal(r.week).label) + ' · show report</p><h1><span class="hl">' + esc(r.name) + '</span></h1></div></div>' +
    '<section class="panel" style="margin-bottom:18px"><div class="row" style="gap:24px;align-items:flex-end"><div><div class="eyebrow">Show rating</div><div class="big">' + r.rating + '%</div></div>' +
    '<p style="flex:1 1 260px">' + verdict(r) + ' (' + r.exp + '%). ' + (Math.abs(r.dImage) < 0.05 ? 'Popularity unchanged.' : 'Popularity ' + (r.dImage > 0 ? 'up ' : 'down ') + Math.abs(r.dImage).toFixed(1) + '.') + '</p></div>' +
    '<div class="kv" style="margin-top:14px"><div><small>Attendance</small><span>' + r.att.toLocaleString('en-US') + (r.sellout ? ' <span class="mark">sell-out</span>' : '') + '</span></div><div><small>Gate</small><span>' + cash(r.gate) + '</span></div><div><small>TV viewers</small><span>' + (r.viewers / 1e6).toFixed(2) + 'M</span></div><div><small>TV money</small><span>' + cash(r.tv) + '</span></div>' + (r.big ? '<div><small>Buys</small><span>' + r.buys.toLocaleString('en-US') + '</span></div><div><small>Buy revenue</small><span>' + cash(r.ppv) + '</span></div>' : '') + '</div>' +
    (r.quest && r.quest.length ? r.quest.map(function (q) { return '<p class="note"><span>' + esc(q) + '</span></p>'; }).join('') : '') + own + next + '</section>' +
    sheet + '<div class="sheet">' + segs + '</div>' + next;
}
function oddsLine(s) {
  if (!s.odds || !s.sidesN) return '';
  return '<p class="muted">Odds at the bell: ' + s.sidesN.map(function (n, k) { return esc(n) + ' ' + s.odds[k] + '%'; }).join(' / ') + (s.called ? ' \u00B7 <span class="gold">your call</span>' : ' \u00B7 played out') + '</p>';
}
function fxList(s, max) {
  if (!s.fx || !s.fx.length) return '';
  return '<ul class="fx">' + s.fx.slice(0, max).map(function (f) { return '<li class="' + (f.s > 0 ? 'good' : 'bad') + '">' + (f.s > 0 ? '+ ' : '\u2212 ') + esc(f.x) + '</li>'; }).join('') + '</ul>';
}

/* ---------- roster ---------- */
function bar(label, v, cls) { return '<div><small>' + label + '</small><span>' + Math.round(v) + ' ' + meter(v, cls) + '</span></div>'; }
function careerBlock(cr) {
  return '<div class="cols" style="margin-top:12px"><div><p class="eyebrow">Career, year by year</p>' + (cr.years.length ? '<div class="tw"><table><thead><tr><th>Year</th><th class="r">Matches</th><th class="r">W</th><th class="r">L</th><th class="r">D</th><th class="r">Best</th><th class="r">Main events</th><th class="r">Titles</th></tr></thead><tbody>' + cr.years.map(function (y) { return '<tr><td class="num">' + y.y + '</td><td class="r num">' + y.m + '</td><td class="r num">' + y.w + '</td><td class="r num">' + y.l + '</td><td class="r num">' + y.d + '</td><td class="r num">' + y.best + '%</td><td class="r num">' + y.main + '</td><td class="r num">' + y.titles + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="empty">No matches yet.</p>') + '</div><div><p class="eyebrow">Milestones</p>' + (cr.log.length ? '<div class="log">' + cr.log.slice(0, 8).map(function (l) { return '<span>' + esc(E.cal(l.w).label) + '  ' + esc(l.t) + '</span>'; }).join('') + '</div>' : '<p class="empty">Nothing of note yet.</p>') + '</div></div>';
}
function detail(w, push) {
  var pt = U.pt || 'over', P = me(), tm = E.teamOf(S, w), fs = E.feudsFor(S, w.id), ch = champOf(P, w.id), work = E.workRate(w), room = w.pot - work;
  var h = '<section class="panel" style="margin-bottom:14px"><div class="line1 row" style="justify-content:space-between"><div class="row" style="align-items:flex-start;gap:2ch;flex-wrap:nowrap">' + portrait(w) + '<div><h2 style="margin:0">' + esc(w.name) + '</h2><p class="muted">Age ' + w.age + ' \u00B7 ' + esc(E.intel(S, w.id).phase) + (w.nw ? ' \u00B7 Not a wrestler' : '') + (w.retiring ? ' \u00B7 <span class="bad">Retiring after ' + esc(E.cal(w.retiring).label) + '</span>' : '') + '</p><div class="row" style="margin-top:4px">' + side(w) + '<span class="tag">' + esc(E.STYLE_NAME[w.style] || '') + '</span><span class="tag">' + push[w.id] + '</span>' + (w.brand ? '<span class="tag">' + esc(brandName(P, w.brand)) + '</span>' : '') + ch.map(function (c) { return '<span class="tag gold">' + esc(c) + '</span>'; }).join('') + (w.inj > 0 ? '<span class="tag bad">Out ' + w.inj + ' wk</span>' : '') + (w.role ? '<span class="tag ' + (w.role === 'toxic' || w.role === 'diva' ? 'bad' : 'good') + '">' + esc(E.ROLE[w.role].n) + '</span>' : '') + (w.camp ? '<span class="tag warn">In camp: ' + esc(E.FOCUS[w.focus] || '') + '</span>' : '') + (w.hof ? '<span class="tag gold">Hall of fame</span>' : '') + '</div></div></div><button class="btn sm" data-act="sel" data-id="' + w.id + '">Close</button></div>' +
    '<div class="subnav" role="group" aria-label="Profile pages" style="margin:10px 0 0">' + [['over', 'Overview'], ['deal', 'Contract'], ['room', 'Locker room'], ['scout', 'Scouting and career']].map(function (t) { return '<button class="btn sm' + (pt === t[0] ? ' on' : '') + '" data-act="ptab" data-v="' + t[0] + '"' + (pt === t[0] ? ' aria-pressed="true"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>';
  if (pt === 'over') h += '<div class="kv" style="margin:14px 0">' + bar('Overness', w.ovr, 'au') + bar('Brawling', w.brawl) + bar('Technical', w.tech) + bar('Aerial', w.speed) + bar('Hardcore', w.hc) + bar('Stamina', w.stam) + bar('Charisma', w.cha, 'au') + bar('Promo', w.mic, 'au') + bar('Condition', w.cond, 'cool') + bar('Morale', w.morale, 'cool') + '</div>' +
    '<p>Finisher: <b>the ' + esc(w.fin || 'finish') + '</b> \u00B7 Gimmick: <b>' + esc(gimName(w.gim)) + '</b> ' + meter(E.gimFit(w), 'au') + ' <span class="num">' + E.gimFit(w) + '% fit</span></p>' + (w.tr && w.tr.length ? '<p>Traits: ' + w.tr.map(function (t) { return '<span class="tag good">' + esc(E.TRAITS[t].n) + '</span>'; }).join(' ') + '</p>' : '') + (w.arc && w.arc.t === 'flop' ? '<p class="bad">The crowd is rejecting the current act until ' + esc(E.cal(w.arc.until).label) + '.</p>' : '') + (w.notice ? '<p class="bad">Has given notice and leaves after ' + esc(E.cal(w.notice).label) + '.</p>' : '') + '<p class="muted">Record ' + w.wins + '–' + w.losses + (w.ws >= 2 ? ', won ' + w.ws + ' in a row' : (w.ws <= -2 ? ', lost ' + (-w.ws) + ' in a row' : '')) + '. Momentum ' + (w.mom > 0 ? '+' : '') + w.mom.toFixed(1) + '. ' + 'Work rate ' + work + '.' + relText(w) +
    (tm ? ' Teams with ' + esc(E.partnerOf(S, w).name) + ' (experience ' + tm.exp + ').' : '') + (fs.length ? ' Feuding: ' + fs.map(function (f) { return esc(E.feudLabel(S, f)); }).join('; ') + '.' : '') + '</p>';
  if (pt === 'room') h += lockerBlock(w);
  if (pt === 'scout') { h += scoutBlock(w); var cr0 = E.career(S, w.id); if (cr0 && (cr0.years.length || cr0.log.length)) h += careerBlock(cr0); }
  if (pt !== 'deal') return h + '</section>';
  h += '<p style="margin-top:12px">' + full(w.wage) + ' a week, ' + Math.max(0, w.con) + ' weeks left.</p><div class="row" style="margin-top:10px">' +
    '<button class="btn sm" data-act="renew" data-id="' + w.id + '" data-w="48">Renew 48 weeks</button><button class="btn sm" data-act="renew" data-id="' + w.id + '" data-w="96">Renew 96 weeks</button>';
  var mps = E.mouthpieces(S, w.id);
  if (mps.length || w.mgr != null) h += '<label class="row" style="gap:6px">Mouthpiece <select id="mgr-' + w.id + '" data-ch="mgr" data-id="' + w.id + '"><option value="">Nobody</option>' + mps.map(function (x) { return '<option value="' + x.id + '"' + (w.mgr === x.id ? ' selected' : '') + '>' + esc(x.name) + ' \u00B7 mic ' + x.mic + '</option>'; }).join('') + '</select></label>';
  if (P.brands) h += '<label class="row" style="gap:6px">Brand <select id="brand-' + w.id + '" data-ch="brand" data-id="' + w.id + '">' + P.brands.map(function (b) { return '<option value="' + b.id + '"' + (w.brand === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select></label>';
  h += U.confirm === 'rel' + w.id ? '<span>Release and pay ' + full(w.wage * 4) + ' severance?</span><button class="btn sm danger" data-act="release-yes" data-id="' + w.id + '">Release</button><button class="btn sm" data-act="cancel">Keep</button>' : '<button class="btn sm danger" data-act="release" data-id="' + w.id + '">Release</button>';
  var rg = U.repack && U.repack.id === w.id ? U.repack.g : '';
  h += '</div><div class="row" style="margin-top:10px"><label class="row" style="gap:6px">Repackage as <select id="repack-' + w.id + '" data-ch="repack" data-id="' + w.id + '"><option value="">Pick a gimmick</option>' + E.GIMS.filter(function (g) { return g.id !== w.gim; }).map(function (g) { return '<option value="' + g.id + '"' + (rg === g.id ? ' selected' : '') + '>' + esc(g.n) + '</option>'; }).join('') + '</select></label>' + (rg ? '<button class="btn sm" data-act="repack" data-id="' + w.id + '">Try it</button>' : '') + '</div>' + (rg ? checkLine('', E.repackOdds(S, w.id, rg)) : '');
  var ci = E.campInfo(S);
  h += '<div class="row" style="margin-top:10px">' + (w.camp ? '<span>In training camp, working on <b>' + esc(E.FOCUS[w.focus].toLowerCase()) + '</b>.</span><button class="btn sm go" data-act="callup" data-id="' + w.id + '">Call up</button>' : (ci.cap ? '<span class="muted">Training camp (' + ci.n + ' of ' + ci.cap + ' places):</span>' : '<span class="muted">The company has no training camp.</span>')) +
    (ci.cap ? Object.keys(E.FOCUS).map(function (k) { return '<button class="btn sm' + (w.camp && w.focus === k ? ' on' : '') + '" data-act="camp" data-id="' + w.id + '" data-k="' + k + '">' + (w.camp ? '' : 'Send: ') + esc(E.FOCUS[k]) + '</button>'; }).join('') : '') + '</div>' + (w.camp ? '' : '<p class="muted">In camp a wrestler improves every week but is off the shows, and the crowd slowly forgets them.</p>');
  return h + '</section>';
}
function zoneCls(v) { return v >= 80 ? 'bad' : (v >= 60 ? 'warn' : (v >= 40 ? 'gold' : 'good')); }
function bodyFig(w) {
  var z = E.zones(S, w.id), by = {}; z.forEach(function (x) { by[x.k] = x; });
  var row = function (art, x) { return '<span class="' + zoneCls(x.v) + '">' + art + '</span>  ' + (x.n + '          ').slice(0, 10) + '<span class="' + zoneCls(x.v) + '">' + new Array(Math.round(x.v / 10) + 1).join('\u2588') + '</span><span class="muted">' + new Array(11 - Math.round(x.v / 10)).join('\u2591') + '</span> ' + x.v; };
  return '<pre class="ascii body" role="img" aria-label="Wear: ' + z.map(function (x) { return x.n + ' ' + x.v; }).join(', ') + '">' + [row('  ( )  ', by.n), row(' --+-- ', by.s), row('   |   ', by.b), row('  / \\  ', by.k)].join('\n') + '</pre>';
}
function lockerBlock(w) {
  var eg = E.ego(S, w.id); if (!eg) return '';
  var glyph = function (v) { return v >= 2 ? '<span class="good">\u25B2\u25B2</span>' : (v === 1 ? '<span class="good">\u25B2 </span>' : (v === 0 ? '<span class="muted">\u25A0 </span>' : (v === -1 ? '<span class="bad">\u25BC </span>' : '<span class="bad">\u25BC\u25BC</span>'))); };
  var grid = '<div class="ego">' + eg.lines.map(function (l) { return '<div><span>' + glyph(l.v) + ' ' + esc(l.n) + '</span><span class="muted">' + esc(l.why) + '</span></div>'; }).join('') + '</div>';
  var ms = E.mentorsFor(S, w.id), wo = E.wordOdds(S, w.id), hurtOk = E.workHurtOk(S, w.id);
  var acts = '<div class="row" style="margin-top:8px">' + (w.inj > 0 ? (hurtOk ? '<button class="btn sm danger" data-act="workhurt" data-id="' + w.id + '">Work them hurt this week</button>' : '') : '<button class="btn sm' + (w.rest === S.week ? ' on' : '') + '" data-act="rest" data-id="' + w.id + '">' + (w.rest === S.week ? 'Resting this week (undo)' : 'Give them the week off') + '</button>') +
    (ms.length || w.ment != null ? '<label class="row" style="gap:6px">Mentor <select id="ment-' + w.id + '" data-ch="ment" data-id="' + w.id + '"><option value="">Nobody</option>' + (w.ment != null && !ms.some(function (m) { return m.id === w.ment; }) ? [S.w[w.ment]] : []).concat(ms).map(function (m) { return '<option value="' + m.id + '"' + (w.ment === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join('') + '</select></label>' : '') +
    (wo ? '<button class="btn sm" data-act="word" data-id="' + w.id + '">Have a word</button>' : '') + '</div>' + (wo ? checkLine('Have a word', wo) : '');
  return '<div class="cols" style="margin-top:12px"><div><p class="eyebrow">Why they feel the way they do' + (eg.role ? ' \u00B7 <span class="gold">' + esc(E.ROLE[eg.role].n) + '</span>' : '') + '</p>' + (eg.role ? '<p class="muted">' + esc(E.ROLE[eg.role].d) + '</p>' : '') + grid +
    '<p style="margin-top:6px">Morale is heading for <b>' + eg.target + '</b>. Stress ' + meter(eg.stress, eg.stress >= 50 ? 'hot' : 'cool') + ' <span class="num">' + eg.stress + '</span>' + (eg.stress >= 75 ? ' <span class="bad">Close to breaking.</span>' : '') + '</p></div>' +
    '<div><p class="eyebrow">Wear and tear</p>' + bodyFig(w) + '<p class="muted">Over 60 it hurts their work. Over 85 the next injury there is a bad one.</p>' + acts + '</div></div>';
}
function lockerRoomView() {
  var P = me(), L = E.lockerRoom(S), R = E.rosterOf(S, P.id), mi = E.medInfo(S);
  var roles = Object.keys(E.ROLE).map(function (k) { var ids = L.roles[k] || []; return '<li class="col"><span><b>' + esc(E.ROLE[k].n) + (ids.length > 1 ? 's' : '') + '</b><br><span class="muted">' + esc(E.ROLE[k].d) + '</span></span><span>' + (ids.length ? ids.map(function (id) { return '<button class="btn sm" data-act="sel" data-id="' + id + '">' + esc(S.w[id].name) + '</button>'; }).join(' ') : '<span class="muted">Nobody</span>') + '</span></li>'; }).join('');
  var trouble = L.trouble.length ? '<ul class="list">' + L.trouble.slice(0, 12).map(function (t) { var w = S.w[t.id]; return '<li><span><button class="btn sm" data-act="sel" data-id="' + w.id + '">' + esc(w.name) + '</button> <span class="muted">' + esc(t.why) + '</span></span><span class="row">' + meter(t.stress, 'hot') + '<span class="num">stress ' + t.stress + '</span></span></li>'; }).join('') + '</ul>' : '<p class="empty">Nobody is close to the edge.</p>';
  var hurt = L.hurt.length ? '<ul class="list">' + L.hurt.slice(0, 12).map(function (id) { var w = S.w[id], z = E.zones(S, id).sort(function (a, b) { return b.v - a.v; })[0]; return '<li><span><button class="btn sm" data-act="sel" data-id="' + id + '">' + esc(w.name) + '</button> <span class="' + zoneCls(z.v) + '">' + esc(z.n) + ' ' + z.v + '</span></span><button class="btn sm' + (w.rest === S.week ? ' on' : '') + '" data-act="rest" data-id="' + id + '">' + (w.rest === S.week ? 'Resting' : 'Rest this week') + '</button></li>'; }).join('') + '</ul>' : '<p class="empty">No bodies in the danger zone.</p>';
  return '<div class="cols"><div class="stack"><section class="panel"><h2>Mood of the room</h2>' + pie([{ n: 'Content (70+)', v: L.happy }, { n: 'Getting by', v: L.ok }, { n: 'Unhappy (under 45)', v: L.unhappy }], 'Morale across the roster') +
    '<p style="margin-top:8px">' + (L.mood > 0 ? 'Your leaders are steadying the room: everybody\u2019s morale settles ' + L.mood + ' higher.' : (L.mood < 0 ? '<span class="bad">Something is dragging the room down: everybody\u2019s morale settles ' + (-L.mood) + ' lower.</span>' : 'Nobody is pulling the room up or down.')) + '</p></section>' +
    '<section class="panel"><h2>Who is who</h2><ul class="list">' + roles + '</ul></section></div>' +
    '<div class="stack"><section class="panel"><h2>Under strain</h2>' + trouble + '<p class="muted" style="margin-top:8px">Stress builds from bad pay, a push below expectations, broken promises, pain and overwork. At 75 somebody snaps.</p></section>' +
    '<section class="panel"><h2>The trainer\u2019s room</h2><p class="muted">' + esc(mi.names[mi.lvl]) + '. ' + R.filter(function (w) { return w.inj > 0; }).length + ' injured.</p>' + hurt + '</section></div></div>';
}
function scoutBlock(w) {
  var it = E.intel(S, w.id), si = E.scoutInfo(S);
  return '<div style="margin-top:12px"><p class="eyebrow">Scouting report' + (it.exact ? '' : (w.sc ? ' (full report on file)' : ' (rough: your scouts have not filed on this one)')) + '</p><div class="scout">' + Object.keys(E.HIDDEN).map(function (k) { var r = it.stats[k]; return '<div><span>' + E.HIDDEN[k] + '</span>' + rangeBar(r.lo, r.hi) + '<span class="num">' + (r.lo === r.hi ? r.lo : r.lo + '\u2013' + r.hi) + '</span></div>'; }).join('') + '</div>' +
    '<p class="muted">' + esc(it.phase) + '.' + (it.peak ? ' Peak years ' + it.peak[0] + ' to ' + it.peak[1] + '.' : '') + (it.cliff ? ' Expect a sharp drop from ' + it.cliff + '.' : '') + '</p>' +
    (it.exact || w.sc ? '' : '<div class="row" style="margin-top:6px"><button class="btn sm" data-act="scout" data-id="' + w.id + '"' + (si.left ? '' : ' disabled') + '>Send a scout (' + full(si.cost) + ')</button><span class="muted">' + si.left + ' of ' + si.max + ' reports left this week.</span></div>') + '</div>';
}
function relText(w) {
  var r = E.relations(S, w.id), t = '';
  if (r.good.length) t += ' Clicks with ' + r.good.slice(0, 3).map(function (x) { return esc(x.name); }).join(', ') + '.';
  if (r.bad.length) t += ' An awkward pairing with ' + r.bad.slice(0, 3).map(function (x) { return esc(x.name); }).join(', ') + '.';
  if (w.fav) t += ' <span class="gold">The owner\u2019s favourite.</span>';
  return t;
}
function gimName(id) { var g = E.GIMS.filter(function (x) { return x.id === id; })[0]; return g ? g.n : 'None'; }
function rosterView() {
  var P = me(), R = E.rosterOf(S, P.id), push = E.pushMap(S, P.id), f = U.rf, q = f.q.toLowerCase();
  var L = R.filter(function (w) { return (f.brand === 'all' || w.brand === f.brand) && (f.g === 'all' || w.g === f.g) && (f.al === 'all' || w.align === f.al) && (!q || w.name.toLowerCase().indexOf(q) >= 0); });
  var k = U.rs.k, d = U.rs.d, val = function (w) { return k === 'name' ? w.name : (k === 'work' ? E.workRate(w) : w[k]); };
  L.sort(function (a, b) { var x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * d || b.ovr - a.ovr; });
  var th = function (key, label, r) { return '<th' + (r ? ' class="r"' : '') + (k === key ? ' aria-sort="' + (d > 0 ? 'ascending' : 'descending') + '"' : '') + '><button data-act="sort" data-v="' + key + '">' + label + (k === key ? (d > 0 ? ' ▲' : ' ▼') : '') + '</button></th>'; };
  var sel = U.sel != null && S.w[U.sel] && S.w[U.sel].promo === P.id ? S.w[U.sel] : null;
  var filt = '<div class="row" style="margin-bottom:12px"><input type="search" id="rq" placeholder="Search by name" value="' + esc(f.q) + '" data-inp="rq" aria-label="Search roster">' +
    (P.brands ? '<select id="rf-brand" data-ch="rf" data-k="brand" aria-label="Brand"><option value="all">All brands</option>' + P.brands.map(function (b) { return '<option value="' + b.id + '"' + (f.brand === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select>' : '') +
    '<select id="rf-g" data-ch="rf" data-k="g" aria-label="Division"><option value="all">Men and women</option><option value="M"' + (f.g === 'M' ? ' selected' : '') + '>Men</option><option value="F"' + (f.g === 'F' ? ' selected' : '') + '>Women</option></select>' +
    '<select id="rf-al" data-ch="rf" data-k="al" aria-label="Alignment"><option value="all">Faces and heels</option><option value="F"' + (f.al === 'F' ? ' selected' : '') + '>Faces</option><option value="H"' + (f.al === 'H' ? ' selected' : '') + '>Heels</option></select><span class="muted">' + L.length + ' of ' + R.length + '</span></div>';
  var rows = L.map(function (w) {
    var ch = champOf(P, w.id), st = (w.camp ? '<span class="tag warn">Camp</span> ' : '') + (w.inj > 0 ? '<span class="tag bad">Out ' + w.inj + ' wk</span> ' : '') + (ch.length ? '<span class="tag gold">Champion</span> ' : '') + (w.nw ? '<span class="tag">' + esc((w.roles || ['staff'])[0].replace('_', ' ')) + '</span> ' : '') + (w.retiring ? '<span class="tag bad">Retiring</span> ' : '') + (w.team != null ? '<span class="tag">Team</span> ' : '') + (w.stable != null ? '<span class="tag warn">Stable</span> ' : '') + (E.feudsFor(S, w.id).length ? '<span class="tag heel">Feud</span>' : '');
    return '<tr class="pick' + (sel && sel.id === w.id ? ' on' : '') + '" data-act="sel" data-id="' + w.id + '"><td><span class="nm">' + esc(w.name) + '</span></td>' + (P.brands ? '<td>' + esc(brandName(P, w.brand)) + '</td>' : '') + '<td>' + side(w) + '</td><td>' + push[w.id] + '</td>' +
      '<td class="r num">' + w.age + '</td><td class="r num">' + Math.round(w.ovr) + '</td><td class="r num">' + E.workRate(w) + '</td><td class="r num">' + w.mic + '</td><td class="r num">' + (w.mom > 0 ? '+' : '') + Math.round(w.mom) + '</td><td class="r num">' + Math.round(w.cond) + '</td><td class="r num">' + Math.round(w.morale) + '</td><td class="r num">' + cash(w.wage) + '</td><td class="r num">' + Math.max(0, w.con) + '</td><td>' + st + '</td></tr>';
  }).join('');
  var tog = '';
  if (U.rv === 'room') return '<div class="head"><div><p class="eyebrow">' + esc(P.name) + ' · ' + R.length + ' under contract</p><h1><span class="hl">Locker room</span></h1></div></div>' + (sel ? detail(sel, push) : '') + tog + lockerRoomView();
  return '<div class="head"><div><p class="eyebrow">' + esc(P.name) + ' · ' + R.length + ' under contract</p><h1><span class="hl">Roster</span></h1></div></div>' + (sel ? detail(sel, push) : '') + tog + filt +
    '<div class="tw"><table><thead><tr>' + th('name', 'Name') + (P.brands ? th('brand', 'Brand') : '') + th('align', 'Side') + '<th>Push</th>' + th('age', 'Age', 1) + th('ovr', 'Over', 1) + th('work', 'Work', 1) + th('mic', 'Promo', 1) + th('mom', 'Mom.', 1) + th('cond', 'Cond.', 1) + th('morale', 'Morale', 1) + th('wage', 'Wage/wk', 1) + th('con', 'Weeks', 1) + '<th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="14" class="muted">Nobody matches those filters.</td></tr>') + '</tbody></table></div>';
}

/* ---------- storylines ---------- */
function storyView() {
  var P = me(), fs = E.activeFeuds(S).filter(function (f) { return f.promo === P.id; }).sort(function (a, b) { return b.heat - a.heat; });
  var done = S.feuds.filter(function (f) { return f.res && f.promo === P.id; }).slice(-8).reverse();
  var card = function (f) {
    var t = f.title ? P.titles.filter(function (x) { return x.id === f.title; })[0] : null;
    return '<section class="panel feud"><div class="row" style="justify-content:space-between"><div class="t">' + esc(E.feudLabel(S, f)) + '</div><div class="row">' + meter(f.heat, 'hot') + '<span class="num">' + Math.round(f.heat) + ' heat</span></div></div>' +
      '<div class="row"><span class="tag gold">Act ' + E.feudAct(f) + ' of 4: ' + E.ACTN[E.feudAct(f)] + '</span><span class="tag ' + (f.heat >= 60 ? 'heel' : '') + '">' + E.feudStage(f) + '</span>' + (f.finale ? '<span class="tag good">Match made</span>' : '') + (f.kind === 'dream' ? '<span class="tag">Dream match</span>' : '') + (t ? '<span class="tag gold">' + esc(t.name) + '</span>' : '') + '<span class="muted">' + f.matches + ' match' + (f.matches === 1 ? '' : 'es') + ', ' + f.aw + '–' + f.bw + ' · since week ' + f.start + '</span></div>' +
      (f.stakes ? '<p class="good">Stakes: ' + esc(f.stakes) + '</p>' : '') + '<p class="muted">' + ['', 'Words and mind games. Keep both on the show to build it.', 'Brawls, ambushes and contract signings. It needs to reach 60 heat.', 'Something is about to change this feud for good.', (f.finale ? 'Book the match at the big event' : 'The match gets made official next') + ', then finish it at a big event or in a gimmick match.'][E.feudAct(f)] + '</p>' +
      '<div class="log">' + f.log.slice(-6).map(function (l) { return '<span>Wk ' + l.w + '  ' + esc(l.t) + '</span>'; }).join('') + '</div></section>';
  };
  var my = S.mystery && S.mystery.promo === P.id ? '<section class="panel"><h2>Unsolved</h2><p>Someone attacked ' + nm(S.w[S.mystery.v]) + ' in week ' + S.mystery.start + '. The attacker has not been named yet.</p></section>' : '';
  var streaks = E.rosterOf(S, P.id).filter(function (w) { return w.ws >= 4; }).sort(function (a, b) { return b.ws - a.ws; });
  var teams = S.teams.filter(function (t) { return t.promo === P.id; }).sort(function (a, b) { return b.exp - a.exp; });
  return '<div class="head"><div><p class="eyebrow">What your booking has set in motion</p><h1><span class="hl">Storylines</span></h1></div></div>' +
    '<div class="cols"><div class="stack">' + my + (fs.length ? fs.map(card).join('') : '<section class="panel"><p class="empty">No rivalries yet. Run a show or two: ambushes, challenges and betrayals start them.</p></section>') +
    (done.length ? '<section class="panel"><h2>Finished</h2><ul class="list">' + done.map(function (f) { return '<li><span>' + esc(E.feudLabel(S, f)) + '</span><span class="muted">' + (f.dead ? 'Fizzled out' : 'Settled') + ', week ' + f.end + '</span></li>'; }).join('') + '</ul></section>' : '') + '</div>' +
    '<div class="stack"><section class="panel"><h2>Winning streaks</h2>' + (streaks.length ? '<ul class="list">' + streaks.map(function (w) { return '<li><span>' + nm(w) + '</span><span class="num">' + w.ws + ' straight</span></li>'; }).join('') + '</ul><p class="muted" style="margin-top:8px">A streak of six or more draws a bigger reaction. Whoever ends it gets the rub.</p>' : '<p class="empty">Nobody has won four in a row.</p>') + '</section>' +
    stablePanel() + '<section class="panel"><h2>Tag teams</h2>' + (teams.length ? '<ul class="list">' + teams.map(function (t) { return '<li><span>' + teamName(t) + '</span><span class="row">' + meter(t.exp) + '<span class="num">' + t.exp + '</span></span></li>'; }).join('') + '</ul><p class="muted" style="margin-top:8px">Experience improves tag matches. Losing teams with little experience can fall apart.</p>' : '<p class="empty">No regular teams.</p>') + '</section></div></div>';
}

function stablePanel() {
  var L = (S.stables || []).filter(function (s) { return s.promo === S.player; });
  if (!L.length) return '';
  return '<section class="panel"><h2>Stables</h2><ul class="list">' + L.map(function (s) {
    return '<li><span><b>' + esc(s.name) + '</b><br>' + s.m.map(function (id) { return nm(S.w[id]) + (id === s.leader ? ' <span class="muted">(leader)</span>' : ''); }).join(', ') + '</span><span class="row">' + meter(Math.min(100, s.tension * 10), 'hot') + '<span class="muted">tension</span></span></li>';
  }).join('') + '</ul><p class="muted" style="margin-top:8px">Stablemates run in for each other. Losses raise the tension, and at the top of the meter somebody gets thrown out.</p></section>';
}

/* ---------- titles ---------- */
function titlesView() {
  var P = me();
  return '<div class="head"><div><p class="eyebrow">' + esc(P.name) + '</p><h1><span class="hl">Titles</span></h1></div></div><div class="tw"><table><thead><tr><th>Title</th>' + (P.brands ? '<th>Brand</th>' : '') + '<th>Champion</th><th class="r">Reign</th><th class="r">Defences</th><th>Prestige</th><th class="r">Last defended</th></tr></thead><tbody>' +
    P.titles.map(function (t) {
      return '<tr><td><span class="nm gold">' + esc(t.name) + '</span></td>' + (P.brands ? '<td>' + esc(brandName(P, t.brand)) + '</td>' : '') + '<td>' + (t.holders.length ? t.holders.map(function (id) { return nm(S.w[id]); }).join(' &amp; ') : '<span class="mark">Vacant</span>') + '</td><td class="r num">' + (t.holders.length ? (S.week - t.since) + ' wk' : '—') + '</td><td class="r num">' + t.defs + '</td><td>' + meter(t.prestige, 'au') + ' <span class="num">' + Math.round(t.prestige) + '</span></td><td class="r num">' + (S.week - t.last === 0 ? 'This week' : (S.week - t.last) + ' wk ago') + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="muted" style="margin:10px 0 18px">Put a title on the line when you book a match. Prestige follows the quality of title matches.</p>' +
    tournPanel() + '<h2 style="margin:0 0 8px">Contenders</h2><div class="grid">' + P.titles.filter(function (t) { return !t.tag; }).map(function (t) {
      var L = E.rankFor(S, t.id, 5), ko = E.tournOk(S, t.id, 'ko'), rr = E.tournOk(S, t.id, 'rr'), busy = !!E.tournActive(S);
      return '<section class="panel"><h2>' + esc(t.name) + '</h2>' + (L.length ? '<ol class="rank">' + L.map(function (w) { return '<li>' + nm(w) + ' <span class="muted num">' + Math.round(w.ovr) + ' · ' + Math.round(w.pts || 0) + ' pts</span>' + (w.shot === t.id ? ' <span class="tag gold">Earned a shot</span>' : '') + '</li>'; }).join('') + '</ol>' : '<p class="empty">Nobody is in line.</p>') +
        '<div class="row" style="margin-top:8px"><button class="btn sm" data-act="tourn" data-k="' + esc(t.id) + '" data-v="ko"' + (ko ? ' disabled' : '') + '>Knockout (8)</button><button class="btn sm" data-act="tourn" data-k="' + esc(t.id) + '" data-v="rr"' + (rr ? ' disabled' : '') + '>League (6)</button></div>' + (ko && !busy ? '<p class="muted">' + esc(ko) + '</p>' : '') + '</section>';
    }).join('') + '</div><p class="muted" style="margin-top:10px">Wins earn ranking points, more at big events and in main events, and they fade week by week. The crowd reacts badly to a challenger who has not earned the shot. A tournament winner takes a vacant title, or a shot at the champion. A battle royal winner earns a shot too.</p>';
}
function tournPanel() {
  var T = S.tourn; if (!T) return '';
  var h = '<section class="panel" style="margin-bottom:18px"><h2>' + esc(T.name) + '</h2>' + (T.done ? '<p class="good">Winner: <b>' + esc(S.w[T.champ].name) + '</b>.</p>' : '<p class="muted">Started ' + esc(E.cal(T.start).label) + '. ' + T.pend.length + ' match' + (T.pend.length === 1 ? '' : 'es') + ' still to run' + (T.fmt === 'ko' ? ' in this round' : '') + '.</p>');
  var res = function (r) { var a = S.w[r.a], b = S.w[r.b]; return '<li><span>' + (r.w === a.id ? '<b>' + esc(a.name) + '</b>' : esc(a.name)) + ' <span class="muted">vs</span> ' + (r.w === b.id ? '<b>' + esc(b.name) + '</b>' : esc(b.name)) + '</span><span class="muted">' + (r.bye ? 'Walkover' : (r.w < 0 ? 'Draw' : 'Wk ' + r.week)) + '</span></li>'; };
  var todo = function (p) { return '<li><span>' + nm(S.w[p[0]]) + ' <span class="muted">vs</span> ' + nm(S.w[p[1]]) + '</span><span class="tag">To run</span></li>'; };
  if (T.fmt === 'rr') {
    var left = {}; T.pend.forEach(function (p) { left[p[0]] = (left[p[0]] || 0) + 1; left[p[1]] = (left[p[1]] || 0) + 1; });
    h += '<div class="tw"><table><thead><tr><th>#</th><th>Wrestler</th><th class="r">Points</th><th class="r">Matches left</th></tr></thead><tbody>' + T.ents.slice().sort(function (a, b) { return (T.pts[b] - T.pts[a]) || (S.w[b].ovr - S.w[a].ovr); }).map(function (id, i) { return '<tr><td class="num">' + (i + 1) + '</td><td>' + nm(S.w[id]) + '</td><td class="r num">' + T.pts[id] + '</td><td class="r num">' + (left[id] || 0) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="muted" style="margin-top:6px">Two points for a win, one each for a draw.</p>';
    if (T.pend.length) h += '<ul class="list" style="margin-top:8px">' + T.pend.slice(0, 6).map(todo).join('') + '</ul>' + (T.pend.length > 6 ? '<p class="muted">And ' + (T.pend.length - 6) + ' more.</p>' : '');
  } else {
    var RN = ['', 'Quarter-finals', 'Semi-finals', 'Final'];
    for (var r = 1; r <= T.round; r++) {
      var rs = T.res.filter(function (x) { return x.round === r; }), pn = r === T.round ? T.pend : [];
      if (!rs.length && !pn.length) continue;
      h += '<p class="eyebrow" style="margin-top:8px">' + RN[r] + '</p><ul class="list">' + rs.map(res).join('') + pn.map(todo).join('') + '</ul>';
    }
  }
  return h + '</section>';
}
function historyView() {
  var P = me(), R = S.rec || {}, wk = function (w) { return esc(E.cal(Math.max(1, w)).label); };
  var lines = P.titles.map(function (t) {
    var H = (t.hist || []).slice().reverse();
    return '<section class="panel"><h2>' + esc(t.name) + '</h2>' + (H.length ? '<ul class="list">' + H.slice(0, 8).map(function (x) { return '<li><span>' + (x.to == null ? '<b class="gold">' + esc(x.h.join(' & ')) + '</b>' : esc(x.h.join(' & '))) + '<br><span class="muted">' + (x.from <= 1 ? 'Champion when you arrived' : 'Won ' + wk(x.from) + (x.show ? ' at ' + esc(x.show) : '')) + '</span></span><span class="num muted">' + ((x.to == null ? S.week : x.to) - x.from) + ' wk · ' + x.defs + ' def.</span></li>'; }).join('') + '</ul>' + (H.length > 8 ? '<p class="muted">' + (H.length - 8) + ' earlier reigns.</p>' : '') : '<p class="empty">Nobody has held it yet.</p>') + '</section>';
  }).join('');
  var li = function (a, b) { return '<li><span>' + a + '</span><span class="num muted">' + b + '</span></li>'; };
  var rec = '<section class="panel"><h2>Record book</h2>' + ((R.matches || []).length ? '<p class="eyebrow">Best matches</p><ul class="list">' + R.matches.slice(0, 10).map(function (m) { return li('<b class="num">' + m.ov + '%</b> ' + esc(m.l) + '<br><span class="muted">' + esc(m.show) + ', ' + wk(m.w) + '</span>', stars(m.ov)); }).join('') + '</ul>' +
    '<p class="eyebrow" style="margin-top:10px">Best shows</p><ul class="list">' + R.shows.map(function (s) { return li(esc(s.n) + '<br><span class="muted">' + wk(s.w) + '</span>', s.r + '%'); }).join('') + '</ul>' +
    '<p class="eyebrow" style="margin-top:10px">High-water marks</p><ul class="list">' + (R.gate ? li('Biggest crowd<br><span class="muted">' + esc(R.gate.n) + ', ' + wk(R.gate.w) + '</span>', R.gate.v.toLocaleString('en-US')) : '') + (R.buys ? li('Most big-event buys<br><span class="muted">' + esc(R.buys.n) + ', ' + wk(R.buys.w) + '</span>', Math.round(R.buys.v).toLocaleString('en-US')) : '') + (R.streak ? li('Longest winning streak<br><span class="muted">' + esc(R.streak.n) + '</span>', R.streak.v + ' straight') : '') + '</ul>' : '<p class="empty">Run a show and the book opens.</p>') + '</section>';
  var aw = '<section class="panel"><h2>Year-end awards</h2>' + ((S.awards || []).length ? S.awards.map(function (y) { return '<p class="eyebrow" style="margin-top:6px">' + y.year + '</p><ul class="list">' + y.list.map(function (x) { return li(esc(x.k), '<span class="gold">' + esc(x.v) + '</span>'); }).join('') + '</ul>'; }).join('') : '<p class="empty">The awards are handed out in the last week of December.</p>') + '</section>';
  var hof = '<section class="panel"><h2>Hall of fame</h2>' + ((S.hof || []).length ? '<ul class="list">' + S.hof.map(function (x) { return li('<b class="gold">' + esc(x.n) + '</b>', 'Class of ' + x.year); }).join('') + '</ul>' : '<p class="empty">Nobody inducted yet. You choose one name each year after the awards.</p>') + '</section>';
  var chron = '<section class="panel"><h2>Season chronicles</h2>' + ((S.chron || []).length ? S.chron.map(function (c) { return '<p class="eyebrow" style="margin-top:6px">Season ' + c.n + ': ' + esc(c.title) + '</p>' + c.lines.map(function (x) { return '<p style="margin-top:4px">' + esc(x) + '</p>'; }).join(''); }).join('') : '<p class="empty">The first chronicle is written when season one ends, 48 weeks in.</p>') + '</section>';
  return '<div class="head"><div><p class="eyebrow">' + esc(P.name) + '</p><h1><span class="hl">History</span></h1></div></div><div class="cols"><div class="stack">' + chron + rec + aw + hof + '</div><div class="stack">' + lines + '</div></div>';
}

/* ---------- market ---------- */
var PT = window.EWFPortrait;
function faceOf(w) { return w.face ? PT.norm(w.face) : PT.derive(w.name, w.g, w.age); }
function portrait(w, cls) { return '<canvas class="pt' + (cls ? ' ' + cls : '') + '" width="96" height="96" role="img" aria-label="Portrait of ' + esc(w.name) + '" data-pf="' + esc(JSON.stringify({ f: faceOf(w), g: w.g, bg: w.twn ? 'N' : w.align })) + '"></canvas>'; }
function paintPortraits() { var L = document.querySelectorAll('canvas[data-pf]'); for (var i = 0; i < L.length; i++) { try { var d = JSON.parse(L[i].dataset.pf); PT.draw(L[i], d.f, { g: d.g, bg: d.bg }); } catch (e) {} } }
function cwDefault() { return { name: '', g: 'M', style: 'A', align: 'F', bg: 'indie', emph: 'ring', fin: '', gim: '', face: PT.derive('cw' + Date.now(), 'M', 25) }; }
var CAWPART = { hr: 'Hair', fh: 'Facial hair', ms: 'Mustache', ey: 'Eyes', ns: 'Nose' };
function cawPart() { var A = U.caw; return A.cat === 'head' ? 'h' : (A.cat === 'face' ? A.part : null); }
function cawFace() { var c = U.cw, part = cawPart(), pf = {}; Object.keys(c.face).forEach(function (k) { pf[k] = c.face[k]; }); if (part && U.caw.pick != null) pf[part] = U.caw.pick; return pf; }
function cawView() {
  var c = U.cw, A = U.caw, info = E.createInfo(S), pv = E.createPreview(S, c);
  var part = cawPart(), cur = part ? c.face[part] : 0, pick = part && A.pick != null ? A.pick : cur, pname = part ? (part === 'h' ? 'Head' : CAWPART[part]) : '';
  var cat = function (k, n) { return '<button class="caw-cat' + (A.cat === k ? ' on' : '') + '" type="button" data-act="caw-cat" data-v="' + k + '" aria-expanded="' + (A.cat === k) + '"><span class="lbl">' + n + '</span>' + (A.cat === k ? '<i class="caw-led" aria-hidden="true"></i>' : '') + '</button>'; };
  var sel = function (k, label, opts) { return '<label for="cw-' + k + '">' + label + '</label><select id="cw-' + k + '" data-ch="cw" data-k="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (c[k] === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
  var txt = function (k, label, max) { return '<label for="cw-' + k + '">' + label + '</label><input type="text" id="cw-' + k + '" maxlength="' + max + '" value="' + esc(c[k]) + '" data-inp="cw" data-k="' + k + '">'; };
  var pages = ''; for (var k = 0; k < 10; k++) pages += '<button type="button" data-act="caw-pick" data-v="' + k + '" class="' + (k === pick ? 'on' : '') + (k === cur ? ' cur' : '') + '" aria-label="' + pname + ' style ' + (k + 1) + ': ' + esc(part ? PT.NAMES[part][k] : '') + '"' + (k === pick ? ' aria-pressed="true"' : '') + '>' + (k + 1) + '</button>';
  var ctl = !part ? '' : '<div class="caw-scroll"><button class="caw-arr" type="button" data-act="caw-step" data-v="-1" aria-label="Previous style">◄</button><div class="caw-track"><i class="caw-thumb" style="left:' + (pick / 9 * 78).toFixed(1) + '%"></i></div><button class="caw-arr" type="button" data-act="caw-step" data-v="1" aria-label="Next style">►</button></div>' +
    '<div class="caw-ctl"><div class="caw-sliders">' +
    '<label class="caw-slider" title="Skin tone"><span class="caw-ico" aria-hidden="true">☼</span><input class="caw-range" type="range" min="0" max="100" value="' + c.face.sk + '" data-inp="cawsl" data-k="sk" aria-label="Skin tone"></label>' +
    '<label class="caw-slider" title="Hair colour"><span class="caw-ico" aria-hidden="true">✎</span><input class="caw-range" type="range" min="0" max="100" value="' + c.face.hc + '" data-inp="cawsl" data-k="hc" aria-label="Hair colour"></label></div>' +
    '<div class="caw-pages" role="group" aria-label="' + pname + ' style">' + pages + '</div>' +
    '<button class="caw-btn" type="button" data-act="caw-apply"' + (pick === cur ? ' disabled' : '') + '>APPLY ' + pname.toUpperCase() + ' ' + (pick + 1) + '</button></div>';
  var tree = A.cat !== 'face' ? '' : '<ul class="caw-tree">' + Object.keys(CAWPART).map(function (k) { return '<li><button type="button" data-act="caw-part" data-v="' + k + '"' + (A.part === k ? ' class="on" aria-current="true"' : '') + '>' + CAWPART[k] + '</button></li>'; }).join('') + '</ul>';
  var body = A.cat !== 'body' ? '' : '<div class="caw-fields">' + sel('g', 'Division', [['M', 'Men'], ['F', 'Women']]) + sel('style', 'Style', Object.keys(E.STYLE_NAME).map(function (k) { return [k, E.STYLE_NAME[k]]; })) + sel('bg', 'Background', Object.keys(info.bgs).map(function (k) { return [k, info.bgs[k].n]; })) + '<p>' + esc(info.bgs[c.bg].d) + '</p></div>';
  var gear = A.cat !== 'gear' ? '' : '<div class="caw-fields">' + txt('name', 'Ring name', 28) + txt('fin', 'Finisher', 24) + sel('align', 'Side', [['F', 'Face'], ['H', 'Heel']]) + sel('gim', 'Gimmick', [['', 'Whatever suits them']].concat(E.GIMS.map(function (g) { return [g.id, g.n]; }))) + '</div>';
  var skills = A.cat !== 'skills' ? '' : '<div class="caw-fields">' + sel('emph', 'Strongest suit', Object.keys(info.emph).map(function (k) { return [k, info.emph[k]]; })) + '<p>Overness <b>' + pv.ovr + '</b> · Work rate about <b>' + pv.work + '</b></p><p>Charisma <b>' + pv.mic + '</b> · Potential <b>' + pv.pot + '</b></p></div>';
  return '<div class="scrim cawscrim"><div class="caw"><div class="caw-win" role="dialog" aria-modal="true" aria-label="Create a wrestler"><div class="caw-title"><span>Create a wrestler - Edit ' + A.cat + '</span><button class="caw-x" type="button" data-act="cw-open" aria-label="Close">✕</button></div>' +
    '<div class="caw-body"><div class="caw-left">' + cat('head', 'Head') + cat('face', 'Face') + tree + ctl +
    '<div class="caw-split">' + cat('body', 'Body') + '<div class="caw-btn" role="status">' + (part ? esc(pname + ' ' + (pick + 1) + ': ' + PT.NAMES[part][pick]) : esc(c.name || 'No name yet')) + '</div></div>' + body + cat('gear', 'Gear') + gear + cat('skills', 'Skills') + skills + '</div>' +
    '<div class="caw-view"><div class="caw-screen"><canvas id="portraitCanvas" width="96" height="96" role="img" aria-label="Portrait preview" data-pf="' + esc(JSON.stringify({ f: cawFace(), g: c.g, bg: c.align })) + '"></canvas></div></div></div>' +
    '<div class="caw-foot"><span>' + (U.cawMsg ? '<span style="color:#a00000">' + esc(U.cawMsg) + '</span>' : (info.ok ? full(pv.wage) + ' a week · ' + full(pv.fee) + ' to sign' : 'Your scouts need ' + info.wait + ' more week' + (info.wait === 1 ? '' : 's') + '.')) + '</span><span class="sp"></span>' +
    '<button class="caw-btn up" type="button" data-act="caw-rnd">Random face</button><button class="caw-btn up" type="button" data-act="cw-make"' + (info.ok ? '' : ' disabled') + '>Sign them</button><button class="caw-btn up" type="button" data-act="cw-open">Cancel</button></div></div></div></div>';
}
function createPanel() {
  var info = E.createInfo(S);
  return '<section class="panel" style="margin-bottom:14px"><div class="row"><button class="btn" data-act="cw-open">Create a wrestler</button><span class="muted">' + (info.ok ? 'Your scouts have somebody for you to look at.' : 'Your scouts need ' + info.wait + ' more week' + (info.wait === 1 ? '' : 's') + '. You can still design one.') + '</span></div></section>';
}
function marketView() {
  var P = me(), q = U.mq.toLowerCase(), L = E.market(S).filter(function (w) { return !q || w.name.toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 120);
  var rows = L.map(function (w) {
    var ask = E.ask(S, w), from = w.promo === 'FA' ? 'Free agent' : esc(S.promos[w.promo].name) + ', ' + Math.max(0, w.con) + ' wk left', locked = w.lock > S.week;
    var r = '<tr><td><span class="nm">' + esc(w.name) + '</span></td><td>' + from + '</td><td>' + side(w) + '</td><td>' + esc(E.STYLE_NAME[w.style] || '') + (w.rk ? ' <span class="tag gold">Rookie</span>' : '') + '</td><td class="r num">' + w.age + '</td><td class="r num">' + Math.round(w.ovr) + '</td><td class="r num">' + E.workRate(w) + '</td><td class="r num">' + w.mic + '</td><td class="r num">' + (function (r) { return r.lo === r.hi ? r.lo : r.lo + '\u2013' + r.hi; })(E.intel(S, w.id).stats.pot) + '</td><td class="r num">' + cash(ask) + '</td><td>' + (!E.canSign(S, w) ? '<span class="muted">Out of reach for now</span>' : locked ? '<span class="muted">Not talking</span>' : '<button class="btn sm" data-act="offer" data-id="' + w.id + '">' + (U.offer === w.id ? 'Cancel' : 'Make an offer') + '</button>') + '</td></tr>';
    if (U.offer === w.id && !locked && E.canSign(S, w)) r += '<tr class="on"><td colspan="11"><div class="row"><label class="row" style="gap:6px">Weekly wage <input type="number" id="offer-wage" min="0" step="50" value="' + ask + '" style="width:120px"></label><label class="row" style="gap:6px">Length <select id="offer-weeks"><option value="48">48 weeks</option><option value="96">96 weeks</option></select></label><button class="btn go" data-act="sign" data-id="' + w.id + '">Send offer</button><span class="muted">They are asking about ' + full(ask) + '. A lowball ends talks for a month.</span>' + (w.sc ? '' : '<button class="btn sm" data-act="scout" data-id="' + w.id + '">Scout first (' + full(E.scoutInfo(S).cost) + ')</button>') + '</div></td></tr>';
    return r;
  }).join('');
  return '<div class="head"><div><p class="eyebrow">Free agents and rivals’ talent with 12 weeks or less on their deals</p><h1><span class="hl">Market</span></h1></div></div>' +
    (S.owner.me ? '' : '<p class="muted" style="margin-bottom:10px">' + esc(S.owner.name) + '\u2019s wage budget is ' + full(E.budget(S)) + ' a week. The bill is ' + full(E.rosterOf(S, P.id).reduce(function (a, w) { return a + w.wage; }, 0)) + '.</p>') +
    createPanel() + '<div class="row" style="margin-bottom:12px"><input type="search" id="mq" placeholder="Search by name" value="' + esc(U.mq) + '" data-inp="mq" aria-label="Search market"><span class="muted">' + L.length + ' available</span></div>' +
    '<div class="tw"><table><thead><tr><th>Name</th><th>Status</th><th>Side</th><th>Style</th><th class="r">Age</th><th class="r">Over</th><th class="r">Work</th><th class="r">Promo</th><th class="r">Potential</th><th class="r">Asking/wk</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="11" class="muted">Nobody available.</td></tr>') + '</tbody></table></div>';
}

/* ---------- finances ---------- */
function netChart(H) {
  var W = 640, Ht = 190, l = 58, r = 8, t = 12, b = 24, n = H.length, max = 1;
  H.forEach(function (x) { if (Math.abs(x.net) > max) max = Math.abs(x.net); });
  var mid = t + (Ht - t - b) / 2, half = (Ht - t - b) / 2, bw = (W - l - r) / Math.max(n, 1), svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="Weekly net income for the last ' + n + ' weeks" style="width:100%;height:auto">';
  svg += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + mid + '" y2="' + mid + '" stroke="var(--grey)" stroke-width="1"/>';
  svg += '<text x="' + (l - 6) + '" y="' + (t + 4) + '" text-anchor="end">' + cash(max) + '</text><text x="' + (l - 6) + '" y="' + (mid + 4) + '" text-anchor="end">$0</text><text x="' + (l - 6) + '" y="' + (Ht - b + 2) + '" text-anchor="end">' + cash(-max) + '</text>';
  H.forEach(function (x, i) {
    var h = Math.abs(x.net) / max * half, y = x.net >= 0 ? mid - h : mid, cx = l + i * bw;
    svg += '<rect x="' + (cx + 1.5).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, bw - 3).toFixed(1) + '" height="' + Math.max(0.5, h).toFixed(1) + '" fill="' + (x.net >= 0 ? 'var(--green)' : 'var(--red)') + '"><title>Week ' + x.w + ': ' + full(x.net) + '</title></rect>';
    if (n <= 12 || i % 4 === 0 || i === n - 1) svg += '<text x="' + (cx + bw / 2).toFixed(1) + '" y="' + (Ht - 6) + '" text-anchor="middle">' + x.w + '</text>';
  });
  return svg + '</svg>';
}
function moneyView() {
  var P = me(), H = P.hist.slice(-24), f = S.fin, wages = 0;
  E.rosterOf(S, P.id).forEach(function (w) { wages += w.wage; });
  var line = function (k, v, neg) { return '<li><span>' + k + '</span><span class="num ' + (neg ? 'bad' : '') + '">' + (neg ? full(-v) : full(v)) + '</span></li>'; };
  var led = f ? '<div class="cols"><section class="panel"><h2>Week ' + f.w + ' income</h2><ul class="list">' + line('TV money', f.tv) + line('Ticket sales', f.gate) + line('Big event buys', f.ppv) + line('Merchandise', f.merch) + line('Sponsors', f.spons || 0) + line('Bonuses', f.bonus) + '<li><span><b>Total</b></span><span class="num"><b>' + full(f.inc) + '</b></span></li></ul>' + pie([{ n: 'TV money', v: f.tv }, { n: 'Tickets', v: f.gate }, { n: 'Big event buys', v: f.ppv }, { n: 'Merchandise', v: f.merch }, { n: 'Sponsors', v: f.spons || 0 }, { n: 'Bonuses', v: f.bonus }], 'Where the money came from') + '</section>' +
    '<section class="panel"><h2>Week ' + f.w + ' costs</h2><ul class="list">' + line('Wages', f.wages, 1) + line('Production', f.prod, 1) + line('Advertising', f.adv || 0, 1) + line('Training camp', f.camp || 0, 1) + line('Medical staff', f.med || 0, 1) + line('Overheads', f.over, 1) + '<li><span><b>Total</b></span><span class="num"><b>' + full(-f.exp) + '</b></span></li><li><span><b>Net</b></span><span class="num ' + (f.net < 0 ? 'bad' : 'good') + '"><b>' + full(f.net) + '</b></span></li></ul>' + pie([{ n: 'Wages', v: f.wages }, { n: 'Production', v: f.prod }, { n: 'Advertising', v: f.adv || 0 }, { n: 'Training camp', v: f.camp || 0 }, { n: 'Medical staff', v: f.med || 0 }, { n: 'Overheads', v: f.over }], 'Where the money went') + '</section></div>' : '<section class="panel"><p class="empty">The books open after your first week.</p></section>';
  return '<div class="head"><div><p class="eyebrow">' + esc(P.name) + '</p><h1><span class="hl">Finances</span></h1></div></div>' +
    '<section class="panel" style="margin-bottom:18px"><div class="kv"><div><small>Cash</small><span class="' + (P.cash < 0 ? 'bad' : '') + '">' + full(P.cash) + '</span></div><div><small>Weekly wage bill</small><span>' + full(wages) + '</span></div><div><small>Popularity</small><span>' + P.image.toFixed(1) + '</span></div><div><small>Started with</small><span>' + cash(P.cash0) + '</span></div></div>' +
    '<p class="muted" style="margin-top:10px">Weekly TV roughly pays for itself. The monthly big event is where the money is made, and popularity drives all of it.</p></section>' +
    (H.length ? '<section class="panel" style="margin-bottom:18px"><h2>Weekly net</h2>' + netChart(H) + '</section>' : '') + led +
    (H.length ? '<div class="tw" style="margin-top:18px"><table><thead><tr><th>Week</th><th class="r">Income</th><th class="r">Costs</th><th class="r">Net</th><th class="r">Cash</th><th class="r">Popularity</th></tr></thead><tbody>' + H.slice().reverse().slice(0, 12).map(function (x) { return '<tr><td class="num">' + esc(E.cal(x.w).label) + '</td><td class="r num">' + full(x.inc) + '</td><td class="r num">' + full(x.exp) + '</td><td class="r num ' + (x.net < 0 ? 'bad' : 'good') + '">' + full(x.net) + '</td><td class="r num">' + full(x.cash) + '</td><td class="r num">' + x.image.toFixed(1) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '');
}

/* ---------- company ---------- */
function optRow(key, cur, names, notes) {
  var own = S.owner.me, h = '<div class="row opts">' + names.map(function (n, i) { return '<button class="btn sm' + (i === cur ? ' on' : '') + '" data-act="co-set" data-k="' + key + '" data-v="' + i + '"' + (i === cur ? ' aria-pressed="true"' : '') + '>' + esc(n) + '</button>'; }).join('') + '</div><p class="muted" style="margin-top:6px">' + notes[cur] + '</p>';
  if (!own) {
    var up = cur < names.length - 1 ? E.lobbyOdds(S, key, cur + 1) : null, dn = cur > 0 ? E.lobbyOdds(S, key, cur - 1) : null;
    h += '<p class="muted">Needs ' + esc(S.owner.name) + '’s approval:' + (up ? ' <b>' + Math.round(up.p * 100) + '%</b> to go up' : '') + (up && dn ? ',' : '') + (dn ? ' <b>' + Math.round(dn.p * 100) + '%</b> to go down' : '') + '. One ask per setting every four weeks.</p>';
  }
  return h;
}
function creedRow(kind, table, cur) {
  var c = (U.creed && U.creed[kind]) || cur;
  return '<div class="row opts">' + Object.keys(table).map(function (k) { return '<button class="btn sm' + (k === c ? ' on' : '') + '" data-act="creed-pick" data-k="' + kind + '" data-v="' + k + '"' + (k === c ? ' aria-pressed="true"' : '') + '>' + esc(table[k].n) + '</button>'; }).join('') + '</div><p class="muted" style="margin:6px 0 10px">' + esc(table[c].d) + '</p>';
}
function ownershipPanel() {
  var o = S.owner, P = me();
  if (!o.me) return '<section class="panel"><h2>Ownership</h2><p><b>' + esc(o.name) + '</b> owns ' + esc(P.name) + '. You book it.</p>' +
    '<p style="margin-top:6px">House style: <b>' + esc(E.STYLES[o.style].n) + '.</b> ' + esc(E.STYLES[o.style].d) + '</p>' +
    '<p style="margin-top:6px">The crowd: <b>' + esc(E.ROOTS[o.roots].n) + '.</b> ' + esc(E.ROOTS[o.roots].d) + '</p>' +
    '<p style="margin-top:6px">The locker room: <b>' + esc(E.PLEDGE[o.pledge].n) + '.</b> ' + esc(E.PLEDGE[o.pledge].d) + '</p>' +
    '<p class="muted" style="margin-top:8px">True to the crowd ' + meter(S.creedScore, 'cool') + ' ' + S.creedScore + '. Reach booker level 5 with ' + esc(o.name) + '’s trust at 80 and the company can become yours.</p></section>';
  return '<section class="panel"><h2>Your house style</h2>' + (o.pending ? '<p class="mark" style="margin-bottom:8px">The company is yours. Decide what kind of promotion it is.</p>' : '') +
    '<p class="eyebrow">What wins matches here?</p>' + creedRow('style', E.STYLES, o.style) +
    '<p class="eyebrow">What does your crowd expect?</p>' + creedRow('roots', E.ROOTS, o.roots) +
    '<p class="eyebrow">What do you promise the locker room?</p>' + creedRow('pledge', E.PLEDGE, o.pledge) +
    '<div class="row"><button class="btn go" data-act="creed-save">Set the house style</button><span class="muted">True to the crowd ' + meter(S.creedScore, 'cool') + ' ' + S.creedScore + '. You can change this once every 12 weeks.</span></div></section>';
}
function companyView() {
  var P = me(), C = E.company(S), so = E.slotOdds(S);
  var pct = function (x) { return (x >= 1 ? '+' : '−') + Math.abs(Math.round((x - 1) * 100)) + '%'; };
  var prodNotes = E.PRODN.map(function (n, i) { return cash(C.prodCost[i]) + ' a TV show. ' + (i === P.prod0 ? 'What this audience is used to.' : (i > P.prod0 ? 'Show ratings +' + ((i - P.prod0) * 0.6).toFixed(1) + ', a few more viewers.' : 'Show ratings −' + ((P.prod0 - i) * 0.6).toFixed(1) + ', fewer viewers.')); });
  var riskNotes = ['Sponsors pay the most. Gimmick matches fall flat and injuries are rarer.', 'The middle of the road. Sponsors are comfortable.', 'Gimmick matches hit harder. Sponsors pay less and injuries go up.', 'Gimmick matches hit hardest. Sponsors pay half, injuries climb, and prime time is off the table.'];
  var tixNotes = E.TIXN.map(function (n, i) { return 'Ticket price ' + pct(C.tixP[i]) + ', demand ' + pct(C.tixD[i]) + '. ' + (i === 0 ? 'Fuller buildings are louder.' : (i === 3 ? 'Empty seats flatten a crowd.' : '')); });
  var advNotes = E.ADVN.map(function (n, i) { return i ? cash(C.adCost[i]) + ' a week. Lifts ticket demand and big-event buys by about ' + [0, 6, 12, 18][i] + '%.' : 'No spend. The card has to sell itself.'; });
  var mdi = E.medInfo(S), ci = E.campInfo(S), campNotes = ci.names.map(function (n, i) { return i ? cash(ci.costs[i]) + ' a week. ' + ci.caps[i] + ' places. Wrestlers in camp improve ' + ['', 'steadily', 'faster', 'fastest'][i] + '. ' + ci.n + ' there now.' : 'No camp. Nobody can be sent away to train.'; });
  var sp = S.sponsors.length ? '<ul class="list">' + S.sponsors.map(function (x, i) { return '<li><span><b>' + esc(x.name) + '</b> · ' + cash(x.pay) + ' a week · ' + x.weeks + ' weeks left<br><span class="muted">Condition: ' + esc(x.text) + '</span></span><button class="btn sm" data-act="sp-drop" data-v="' + i + '">End deal</button></li>'; }).join('') + '</ul>' : '<p class="empty">No sponsors signed. You can carry three.</p>';
  var of = S.spOffers.length ? '<ul class="list">' + S.spOffers.map(function (x, i) { var ok = E.sponsorOk(S, x); return '<li><span><b>' + esc(x.name) + '</b> · ' + cash(x.pay) + ' a week for ' + x.weeks + ' weeks<br><span class="muted">Condition: ' + esc(x.text) + '</span></span><button class="btn sm" data-act="sp-accept" data-v="' + i + '"' + (ok ? '' : ' disabled') + '>' + (ok ? 'Sign' : (S.sponsors.length >= 3 ? 'Full' : 'Not met')) + '</button></li>'; }).join('') + '</ul>' : '<p class="empty">No offers on the table. New ones arrive every four weeks.</p>';
  return '<div class="head"><div><p class="eyebrow">' + esc(P.name) + '</p><h1><span class="hl">Company</span></h1></div></div>' +
    '<div class="cols"><div class="stack">' + ownershipPanel() +
    '<section class="panel"><h2>Broadcast</h2><p>Your shows air in <b>' + E.SLOTN[P.slot].toLowerCase() + '</b>: room for ' + E.SLOT_MAX[P.slot] + ' matches a show' + (P.slot !== P.slot0 ? ', viewers ' + pct(C.slotV[P.slot]) + ' against where you started' : '') + '.</p>' +
    (so.can ? '<div class="row" style="margin-top:8px"><button class="btn" data-act="slot-ask">Ask the network for ' + E.SLOTN[so.to].toLowerCase() + '</button><span class="muted">' + Math.round(so.p * 100) + '% chance. One meeting every eight weeks.</span></div>' : '<p class="muted" style="margin-top:6px">' + esc(so.why) + '</p>') + '</section>' +
    '<section class="panel"><h2>Production values</h2>' + optRow('prodLvl', P.prodLvl, E.PRODN, prodNotes) + '</section>' +
    '<section class="panel"><h2>Risk level</h2>' + optRow('risk', P.risk, E.RISKN, riskNotes) + '</section>' +
    '<section class="panel"><h2>Ticket prices</h2>' + optRow('tix', P.tix, E.TIXN, tixNotes) + '</section>' +
    '<section class="panel"><h2>Advertising</h2>' + optRow('adv', P.adv, E.ADVN, advNotes) + '</section>' +
    '<section class="panel"><h2>Training camp</h2>' + optRow('camp', P.camp || 0, ci.names, campNotes) + '</section>' +
    '<section class="panel"><h2>Medical staff</h2>' + optRow('med', P.med || 0, mdi.names, mdi.names.map(function (n, i) { return i ? cash(mdi.costs[i]) + ' a week. Bodies recover faster, injuries are ' + [0, 8, 18, 28][i] + '% shorter and a little rarer.' : 'Nobody at ringside. Wear heals at its own pace.'; })) + '</section>' +
    '</div><div class="stack">' + housePanel() + '<section class="panel"><h2>Universe</h2><p>This world began as <b>' + esc(S.uni ? S.uni.name : 'the built-in roster') + '</b>.</p><p class="muted" style="margin-top:6px">Export it as it stands today, with every signing, title change and created wrestler, as a universe package you can share or start a new game from.</p><div class="row" style="margin-top:8px"><button class="btn" data-act="uni-export">Export this world</button></div></section><section class="panel"><h2>Sponsors</h2>' + sp + '</section><section class="panel"><h2>Offers</h2>' + of + '<p class="muted" style="margin-top:8px">Break a condition and the sponsor walks, taking a little of your reputation along.</p></section></div></div>';
}

/* ---------- world ---------- */
function rivalsPanel() {
  var P = me(), x = E.xfState(S), T = U.trade || (U.trade = { pid: '', theirs: '', mine: '' });
  var rows = S.order.filter(function (id) { return id !== S.player; }).map(function (id) {
    var R = S.promos[id], r = Math.round(R.rel || 0), why = E.xfCan(S, id), so = E.xfOdds(S, id, 'super'), wo = E.xfOdds(S, id, 'war');
    return '<li><span><b>' + esc(R.name) + '</b> <span class="muted">relations</span> <span class="' + (r >= 20 ? 'good' : (r <= -20 ? 'bad' : 'muted')) + '">' + (r > 0 ? '+' : '') + r + '</span>' + (why && !x ? '<br><span class="muted">' + esc(why) + '</span>' : '') + '</span><span class="row"><button class="btn sm" data-act="xf" data-k="' + id + '" data-v="super"' + (why ? ' disabled' : '') + '>Supershow ' + Math.round(so.p * 100) + '%</button><button class="btn sm" data-act="xf" data-k="' + id + '" data-v="war"' + (why ? ' disabled' : '') + '>Start a war ' + Math.round(wo.p * 100) + '%</button></span></li>';
  }).join('');
  var st = x ? '<p class="note"><span>' + (x.kind === 'war' ? 'At war with ' : 'Supershow with ') + esc(S.promos[x.with].name) + ' until ' + esc(E.cal(x.until).label) + '. Series: ' + x.sc[0] + '–' + x.sc[1] + '. Visiting: ' + x.guests.map(function (id) { return esc(S.w[id].name); }).join(', ') + '.</span></p>' : '';
  var their = T.pid ? E.tradeList(S, T.pid) : [], mine = E.rosterOf(S, P.id).filter(function (w) { return !champOf(P, w.id).length && w.inj <= 0; }).sort(function (a, b) { return b.ovr - a.ovr; });
  var ck = T.mine !== '' && T.theirs !== '' ? E.tradeOdds(S, +T.mine, +T.theirs) : null;
  var opt = function (w, cur) { return '<option value="' + w.id + '"' + (String(cur) === String(w.id) ? ' selected' : '') + '>' + esc(w.name) + ' · ' + Math.round(w.ovr) + '</option>'; };
  var trade = '<p class="eyebrow" style="margin-top:12px">Talent trade</p><div class="editor" style="border:0;margin:0;padding:0"><label class="f">Trade with<select id="tr-pid" data-ch="trade" data-k="pid"><option value="">Pick a promotion</option>' + S.order.filter(function (id) { return id !== S.player; }).map(function (id) { return '<option value="' + id + '"' + (T.pid === id ? ' selected' : '') + '>' + esc(S.promos[id].name) + '</option>'; }).join('') + '</select></label>' +
    (T.pid ? '<label class="f">You get<select id="tr-theirs" data-ch="trade" data-k="theirs"><option value="">Pick one of theirs</option>' + their.map(function (w) { return opt(w, T.theirs); }).join('') + '</select></label><label class="f">You give<select id="tr-mine" data-ch="trade" data-k="mine"><option value="">Pick one of yours</option>' + mine.map(function (w) { return opt(w, T.mine); }).join('') + '</select></label>' : '') + '</div>' +
    (ck ? checkLine('They say yes', ck) + '<div class="row" style="margin-top:8px"><button class="btn go" data-act="trade">Propose the trade</button><span class="muted">Champions and anyone out of your reach are not listed.</span></div>' : '');
  return '<section class="panel" style="margin-bottom:18px"><h2>Rival promotions</h2>' + st + '<ul class="list">' + rows + '</ul><p class="muted" style="margin-top:8px">A supershow lends you their stars for your next big event and lifts the gate. A war puts four of theirs on your shows for two months: win the series and your popularity rises at their expense. Signing a rival’s talent sours relations.</p>' + trade + '</section>';
}
function netView() {
  var N = S.net || { mood: 60, threads: [] }, P = me();
  return '<div class="head"><div><p class="eyebrow">alt.wrestling.' + esc(P.name.toLowerCase().replace(/[^a-z0-9]/g, '')) + '</p><h1><span class="hl">The Net</span></h1></div></div>' +
    '<section class="panel" style="margin-bottom:18px"><p>Mood of the board ' + meter(N.mood, N.mood < 40 ? 'hot' : 'cool') + ' <span class="num">' + Math.round(N.mood) + '</span> <span class="muted">' + (N.mood >= 75 ? 'They love you right now. Ticket demand is up a little.' : (N.mood >= 45 ? 'The usual grumbling.' : 'They have turned on the product. Ticket demand is down a little.')) + '</span></p></section>' +
    (N.threads.length ? N.threads.map(function (t) { return '<section class="panel" style="margin-bottom:14px"><h2>' + esc(t.sub) + '</h2><p class="eyebrow">' + esc(E.cal(t.w).label) + ' · ' + t.posts.length + ' post' + (t.posts.length === 1 ? '' : 's') + '</p>' + t.posts.map(function (p) { return '<p class="post"><span class="u">&lt;' + esc(p.u) + '&gt;</span> ' + esc(p.t) + '</p>'; }).join('') + '</section>'; }).join('') : '<section class="panel"><p class="empty">Nobody has posted yet. Run a show and they will have opinions.</p></section>');
}
function worldView() {
  var rows = S.order.slice().sort(function (a, b) { return S.promos[b].image - S.promos[a].image; }).map(function (id) {
    var P = S.promos[id], top = P.titles.filter(function (t) { return !t.tag && t.g === 'M'; }).sort(function (a, b) { return b.lvl - a.lvl; })[0];
    return '<tr' + (id === S.player ? ' class="on"' : '') + '><td><span class="nm">' + esc(P.name) + '</span>' + (id === S.player ? ' <span class="tag">You</span>' : '') + '</td><td>' + meter(P.image) + ' <span class="num">' + P.image.toFixed(1) + '</span></td><td class="r num">' + cash(P.cash) + '</td><td class="r num">' + E.rosterOf(S, id).length + '</td><td>' + (top && top.holders.length ? esc(S.w[top.holders[0]].name) : '<span class="muted">Vacant</span>') + '</td><td>' + (P.last ? esc(P.last.name) + ' <span class="num">' + P.last.rating + '%</span>' : '<span class="muted">—</span>') + '</td></tr>';
  }).join('');
  return '<div class="head"><div><p class="eyebrow">' + esc(E.cal(S.week).label) + '</p><h1><span class="hl">World</span></h1></div></div>' +
    '<div class="tw" style="margin-bottom:18px"><table><thead><tr><th>Promotion</th><th>Popularity</th><th class="r">Cash</th><th class="r">Roster</th><th>Top champion</th><th>Last show</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    rivalsPanel() + '<div class="cols"><section class="panel"><h2>News wire</h2>' + newsList(60) + '</section><section class="panel"><h2>The power ten</h2><ol class="rank">' + E.power(S, 10).map(function (w) { return '<li>' + (w.promo === S.player ? '<b>' + esc(w.name) + '</b>' : esc(w.name)) + ' <span class="muted">' + esc(S.promos[w.promo].name) + ' · ' + Math.round(w.yp || 0) + ' pts</span></li>'; }).join('') + '</ol><p class="muted" style="margin-top:8px">The best year anyone is having, across every promotion. Wins on bigger stages count for more. The top name in the last week of December is wrestler of the year.</p></section></div>';
}

/* ---------- achievements ---------- */
function achView() {
  var got = Object.keys(S.ach).length, P = me();
  return '<div class="head"><div><p class="eyebrow">' + esc(S.booker.name) + ', ' + (S.owner.me ? 'owner and booker' : 'booker') + ' of ' + esc(P.name) + '</p><h1><span class="hl">Career</span></h1></div></div>' +
    '<div class="cols"><div class="stack">' + youPanel() + '<section class="panel"><h2>Your word</h2>' + trustPanel() + '</section></div><div class="stack">' + sagaPanel() + '</div></div>' +
    '<h2 style="margin:22px 0 10px">Achievements \u00B7 ' + got + ' of ' + E.ACH.length + '</h2><div class="ach">' +
    E.ACH.map(function (a) { var g = S.ach[a.id], hide = a.hidden && !g; return '<div class="' + (g ? 'got' : '') + '"><b>' + (hide ? 'Hidden' : esc(a.name)) + '</b><span>' + (hide ? 'Keep playing to find this one.' : esc(a.desc)) + '</span>' + (g ? '<br><span class="muted">Unlocked ' + esc(E.cal(g).label) + '</span>' : '') + '</div>'; }).join('') + '</div>';
}

/* ---------- actions ---------- */
function say(html, err) { U.flash = { html: html, err: !!err }; }
function act(a, d) {
  if (NAV.on && (a === 'scr' || a === 'pick' || a === 'unpick' || a === 'begin' || a === 'continue' || a === 'job' || a === 'newgame-yes' || a === 'live-done' || a === 'closeReport' || a === 'endweek')) NAV.home = true;
  if (a === 'pick') { U.setup = { pid: d.v, name: (U.setup && U.setup.name) || '', diff: (U.setup && U.setup.diff) || 'normal', fed: { name: '', short: '', show: '', title: '', size: 'regional', region: 'midwest', style: 'merit', roots: 'tradition', pledge: 'chance', women: true } }; render(); top0(); return; }
  if (a === 'setup-set' && U.setup) { if (d.k === 'diff') U.setup.diff = d.v; else U.setup.fed[d.k] = d.k === 'women' ? !!d.v : d.v; render(); return; }
  if (a === 'unpick') { U.setup = null; U.scr = 'select'; render(); return; }
  if (a === 'begin' && U.setup) { var nb = document.getElementById('bname'); setUniverse(PREF.uni || 'public_domain'); S = E.newGame(U.setup.pid === 'OWN' ? null : U.setup.pid, (Date.now() % 2000000000) | 0, { name: nb ? nb.value : '', diff: U.setup.diff, fed: U.setup.pid === 'OWN' ? U.setup.fed : null }); U = fresh(); save(); render(); top0(); return; }
  if (a === 'job' && S) { var bk = S.booker; S = E.newGame(d.v, (Date.now() % 2000000000) | 0, { name: bk.name, booker: bk, diff: S.diff }); U = fresh(); toastBox.innerHTML = ''; save(); render(); top0(); return; }
  if (a === 'continue') { var sv = load(); if (sv) { S = sv; U = fresh(); E.attach(S); SAVEB = JSON.stringify(S).length; } render(); return; }
  if (a === 'boot-skip') { bootSkip(); return; }
  if (a === 'scr') { U.scr = d.v; U.mi = 0; U.setup = null; render(); top0(); return; }
  if (a === 'help') { U.modal = { title: 'Help', kind: 'help', html: '', ok: 'Got it' }; render(); return; }
  if (a === 'options') { U.modal = { title: 'Options', kind: 'options', html: '', ok: 'Done' }; render(); return; }
  if (a === 'prefset') { PREF[d.k] = d.k === 'zoom' ? +d.v : d.v; savePrefs(); render(); return; }
  if (a === 'fullscreen') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); } catch (e) {} return; }
  if (a === 'pref') { PREF[d.k] = !PREF[d.k]; savePrefs(); if (d.k === 'snd' && PREF.snd) SFX.ach(); render(); return; }
  if (a === 'modal-close') { U.modal = null; render(); return; }
  if (a === 'copy-modal') { copyText(U.modal && U.modal.text, 'modal-text'); return; }
  if (a === 'uni-import') { var fi = document.getElementById('uni-file'); if (fi) fi.click(); return; }
  if (a === 'uni-remove') { delete UNIS[PREF.uni]; saveUnis(); setUniverse('public_domain'); render(); return; }
  if (!S) return;
  U.flash = null;
  var P = me(), i = +d.v, id = +d.id, r, t;
  switch (a) {
    case 'tab': U.tab = d.v; if (d.v === 'office') U.ov = 'desk'; if (d.v === 'roster') U.rv = 'table'; U.report = null; U.live = null; U.confirm = null; U.offer = null; top0(); break;
    case 'live-next':
      if (typer.active()) { typer.finish(); return; }
      if (U.live && S.reports[U.report]) {
        var LR = S.reports[U.report], sg = LR.segs[U.live.s];
        if (sg && U.live.b < (sg.bc || []).length) { U.live.b++; var nb = (sg.bc || [])[U.live.b]; if (nb && /One, two, three|hree count|tapping|taps!|gets the three|and that is it/.test(nb.x)) SFX.count(); else if (!nb && sg.k === 'match') SFX.crowd(sg.cr); else if (nb && nb.t === 'pbp' && sg.k === 'match' && U.live.b === lead(sg) + 2) SFX.bell(); }
        else { U.live.s++; U.live.b = LR.segs[U.live.s] ? lead(LR.segs[U.live.s]) : 0; }
      }
      break;
    case 'live-skip': typer.finish(); if (U.live && S.reports[U.report] && S.reports[U.report].segs[U.live.s]) U.live.b = (S.reports[U.report].segs[U.live.s].bc || []).length; break;
    case 'live-end': if (U.live && S.reports[U.report]) { U.live.s = S.reports[U.report].segs.length; U.live.b = 0; } break;
    case 'live-done': U.live = null; top0(); break;
    case 'replay': U.live = { s: -1, b: 0 }; top0(); break;
    case 'newgame': U.confirm = 'new'; U.modal = null; top0(); break;
    case 'newgame-yes': clearSave(); S = null; U = fresh(); U.scr = 'select'; toastBox.innerHTML = ''; setUniverse(PREF.uni || 'public_domain'); break;
    case 'cancel': U.confirm = null; break;
    case 'suggest': S.card = E.suggest(S); U.edit = -1; U.tried = false; break;
    case 'add': S.card.push({ mt: '1v1', sides: [[null], [null]], win: -2, call: null, title: null, stip: 'std', len: 'M' }); U.edit = S.card.length - 1; break;
    case 'clear': S.card = []; U.edit = -1; U.tried = false; break;
    case 'edit': U.edit = U.edit === i ? -1 : i; break;
    case 'rm': S.card.splice(i, 1); U.edit = -1; break;
    case 'up': if (i > 0) { t = S.card[i]; S.card[i] = S.card[i - 1]; S.card[i - 1] = t; if (U.edit === i) U.edit = i - 1; else if (U.edit === i - 1) U.edit = i; } break;
    case 'down': if (i < S.card.length - 1) { t = S.card[i]; S.card[i] = S.card[i + 1]; S.card[i + 1] = t; if (U.edit === i) U.edit = i + 1; else if (U.edit === i + 1) U.edit = i; } break;
    case 'run':
    case 'pre':
    case 'chaos':
      var preNote = null, chNote = null;
      if (a === 'pre') { preNote = E.resolvePre(S, S.card, +d.c); U.edit = -1; }
      if (a === 'chaos') { chNote = E.resolveChaos(S, S.card, +d.c); U.modal = null; }
      if (E.validate(S, S.card).errors.length) { U.tried = true; say('The show can’t run yet. See the list below.', 1); break; }
      if (a === 'run' && E.preShow(S, S.card)) { U.edit = -1; top0(); break; }
      if (a !== 'chaos' && E.chaos(S, S.card)) { U.modal = { title: 'Gorilla position', kind: 'chaos', html: '', noOk: true }; U.edit = -1; SFX.ach(); save(); break; }
      r = E.runPlayerShow(S, S.card);
      if (r.errors) { U.tried = true; say('The show can’t run yet. See the list below.', 1); }
      else { if (preNote || (S.pre && S.pre.result)) r.rep.pre = preNote || S.pre.result; U.report = 0; U.live = { s: -1, b: 0 }; U.edit = -1; U.tried = false; if (chNote) say(dice(S.chs && S.chs.roll) + 'Your call: ' + esc(chNote)); save(); top0(); SFX.fanfare(); }
      break;
    case 'report': U.tab = 'booking'; U.report = i; U.live = null; top0(); break;
    case 'closeReport': U.report = null; U.live = null; top0(); break;
    case 'endweek':
      if (pend() || !weekDone()) break;
      E.endWeek(S); U.report = null; U.live = null; U.tab = 'office'; U.edit = -1;
      if (S.fin && !S.over) { var Hh = P.hist.slice(-10), nw = S.news.filter(function (x) { return x.w === S.week - 1; }).slice(0, 6);
        U.modal = { title: 'Week closed', html: '<p>Net for the week: <b class="num ' + (S.fin.net < 0 ? 'bad' : 'good') + '">' + full(S.fin.net) + '</b>. Cash in the bank: <b class="num">' + full(P.cash) + '</b>.</p>' + colChart(Hh.map(function (x) { return x.net; }), Hh.map(function (x) { return x.w; }), 'Weekly net, last ' + Hh.length + ' weeks') + (nw.length ? '<p class="eyebrow" style="margin-top:6px">This week</p><ul class="list">' + nw.map(function (x) { return '<li><span>' + esc(x.t) + '</span></li>'; }).join('') + '</ul>' : '') + '<p style="margin-top:8px">It is now <b>' + esc(E.cal(S.week).label) + '</b>.</p>', ok: 'On to next week' }; }
      save(); top0(); break;
    case 'ev': E.resolveEvent(S, id, +d.c); save(); break;
    case 'co-set': if (S.owner.me) E.setCompany(S, d.k, +d.v); else if (+d.v !== P[d.k]) { r = E.lobby(S, d.k, +d.v); say(esc(r.msg), !r.ok); } save(); break;
    case 'skill': E.spendPoint(S, d.k); save(); break;
    case 'creed-pick': U.creed = U.creed || {}; U.creed[d.k] = d.v; break;
    case 'creed-save': r = E.setCreed(S, { style: (U.creed && U.creed.style) || S.owner.style, roots: (U.creed && U.creed.roots) || S.owner.roots, pledge: (U.creed && U.creed.pledge) || S.owner.pledge }); U.creed = null; if (r) say(esc(r)); save(); break;
    case 'scout': r = E.scout(S, id); var sw = S.w[id], it2 = E.intel(S, id); U.modal = { title: 'Scouting report: ' + sw.name, html: '<div class="row" style="align-items:flex-start;gap:2ch;flex-wrap:nowrap">' + portrait(sw) + '<div><p>' + esc(r || '') + '</p><p class="muted">Age ' + sw.age + ' \u00B7 ' + esc(E.STYLE_NAME[sw.style] || '') + ' \u00B7 overness ' + Math.round(sw.ovr) + '</p></div></div><div class="scout" style="margin-top:8px">' + Object.keys(E.HIDDEN).map(function (k) { var q = it2.stats[k]; return '<div><span>' + E.HIDDEN[k] + '</span>' + rangeBar(q.lo, q.hi) + '<span class="num">' + (q.lo === q.hi ? q.lo : q.lo + '\u2013' + q.hi) + '</span></div>'; }).join('') + '</div>' + (it2.peak ? '<p style="margin-top:6px">Peak years ' + it2.peak[0] + ' to ' + it2.peak[1] + '.</p>' : '') }; save(); break;
    case 'uni-export': var pk = E.exportUniverse(S, { name: (S.uni ? S.uni.name : 'My universe') + ', ' + E.cal(S.week).label, id: (S.uni ? S.uni.id : 'my_universe') + '_wk' + S.week }), tx = JSON.stringify(pk); U.modal = { title: 'Export universe', wide: true, copy: true, text: tx, html: '<p>' + pk.workers.length + ' workers, ' + pk.promotions.length + ' promotions, ' + Math.round(tx.length / 1024) + ' KB. Copy the text and save it as a <b>.json</b> file. Anyone can load it from the Universe panel on the title screen.</p><textarea id="modal-text" readonly rows="8" style="width:100%;margin-top:8px">' + esc(tx) + '</textarea>' }; break;
    case 'xf': r = E.xfPropose(S, d.k, d.v); say(dice(r.roll) + esc(r.msg), !r.ok); save(); break;
    case 'trade': r = E.trade(S, +U.trade.mine, +U.trade.theirs); say(dice(r.roll) + esc(r.msg), !r.ok); if (r.ok) U.trade = null; save(); break;
    case 'cw-open': U.cwOpen = !U.cwOpen; U.cawMsg = null; NAV.home = NAV.on; if (U.cwOpen) { U.cw = U.cw || cwDefault(); if (!U.cw.face) U.cw.face = PT.derive('cw' + Date.now(), U.cw.g, 25); U.caw = { cat: 'face', part: 'hr', pick: null }; } break;
    case 'caw-cat': U.caw.cat = d.v; U.caw.pick = null; U.cawMsg = null; break;
    case 'caw-part': U.caw.part = d.v; U.caw.pick = null; break;
    case 'caw-pick': U.caw.pick = +d.v; break;
    case 'caw-step': var cp = cawPart(); if (cp) { var cv = U.caw.pick != null ? U.caw.pick : U.cw.face[cp]; U.caw.pick = (cv + (+d.v) + 10) % 10; } break;
    case 'caw-apply': var ap = cawPart(); if (ap && U.caw.pick != null) { U.cw.face[ap] = U.caw.pick; U.caw.pick = null; } break;
    case 'caw-rnd': U.cw.face = PT.derive('cw' + Math.random(), U.cw.g, 25); U.caw.pick = null; break;
    case 'cw-make': if (U.cwOpen && U.caw && U.caw.pick != null && cawPart()) { U.cw.face[cawPart()] = U.caw.pick; U.caw.pick = null; } r = E.createWrestler(S, U.cw || cwDefault()); if (r.ok) { say(esc(r.msg)); U.cw = null; U.cwOpen = false; U.cawMsg = null; } else if (U.cwOpen) U.cawMsg = r.msg; else say(esc(r.msg), 1); save(); break;
    case 'tourn': r = E.startTourn(S, d.k, d.v); if (r) say(esc(r), !/is set/.test(r)); save(); break;
    case 'rview': U.tab = 'roster'; U.rv = d.v; U.confirm = null; break;
    case 'bk': U.bk = d.v; break;
    case 'ptab': U.pt = d.v; break;
    case 'oview': U.tab = 'office'; U.ov = d.v; U.confirm = null; break;
    case 'bs-room': U.bs = U.bs || { pl: null, a: null, b: null }; U.bs.pl = U.bs.pl === d.v ? null : d.v; break;
    case 'bs-do': r = E.apDo(S, d.k, d.v, { a: U.bs && U.bs.a, b: U.bs && U.bs.b }); say(dice(r.roll) + esc(r.msg), !r.ok); save(); break;
    case 'bs-court': r = E.apDo(S, 'court', 'case', { cid: id, v: +d.v }); say(esc(r.msg), !r.ok); save(); break;
    case 'bs-deleg': r = E.courtDelegate(S, id); say(esc(r.msg), !r.ok); save(); break;
    case 'house': r = E.setHouse(S, d.k); if (r) say(esc(r.msg), !r.ok); save(); break;
    case 'clock': var ck = E.clocks(S).filter(function (x) { return x.id === d.k; })[0]; if (ck) U.modal = { title: ck.n, html: '<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:2ch">' + dial(ck.v, ck.segs, ck.bad) + '<div><p><b>' + ck.v + ' of ' + ck.segs + '</b> segments filled.</p><p style="margin-top:4px">' + esc(ck.d) + '</p>' + (ck.why ? '<p class="muted" style="margin-top:4px">This week: ' + esc(ck.why) + '.</p>' : '') + '</div></div>' }; break;
    case 'rest': r = E.rest(S, id); if (r) say(esc(r)); save(); break;
    case 'workhurt': r = E.workHurt(S, id); if (r) say(esc(r), 1); save(); break;
    case 'word': r = E.haveWord(S, id); if (r) say(dice(r.roll) + esc(r.msg), !r.ok); save(); break;
    case 'camp': r = E.sendCamp(S, id, d.k); if (r) say(esc(r), /full|champion/.test(r)); save(); break;
    case 'callup': r = E.callUp(S, id); if (r) say(esc(r)); save(); break;
    case 'sp-accept': r = E.acceptSponsor(S, i); if (r) say(esc(r)); save(); break;
    case 'sp-drop': r = E.dropSponsor(S, i); if (r) say(esc(r)); save(); break;
    case 'slot-ask': r = E.askSlot(S); if (r) say(esc(r)); save(); break;
    case 'sel': U.sel = U.sel === id ? null : id; U.confirm = null; if (U.sel != null) top0(); break;
    case 'sort': if (U.rs.k === d.v) U.rs.d = -U.rs.d; else U.rs = { k: d.v, d: d.v === 'name' || d.v === 'brand' || d.v === 'align' ? 1 : -1 }; break;
    case 'repack': if (U.repack && U.repack.id === id) { r = E.repackage(S, id, U.repack.g); U.repack = null; if (r) say(esc(r), /failure/.test(r)); save(); } break;
    case 'renew': r = E.renew(S, id, +d.w); if (r) say(esc(r)); save(); break;
    case 'release': U.confirm = 'rel' + id; break;
    case 'release-yes': r = E.release(S, id); U.confirm = null; U.sel = null; if (r) say(esc(r)); save(); break;
    case 'offer': U.offer = U.offer === id ? null : id; break;
    case 'sign':
      var wg = document.getElementById('offer-wage'), wk = document.getElementById('offer-weeks');
      r = E.sign(S, id, wg ? +wg.value : 0, wk ? +wk.value : 48); say(esc(r.msg), !r.ok); U.offer = null; save(); break;
  }
  render();
}
function chg(c, d, el) {
  if (c === 'uni') { setUniverse(el.value); U.setup = null; render(); return; }
  if (!S) return;
  var i = +d.i, m = S.card[i], v = el.value;
  if (c === 'rf') { U.rf[d.k] = v; render(); return; }
  if (c === 'bs') { U.bs = U.bs || { pl: null, a: null, b: null }; U.bs[d.k] = v === '' ? null : +v; U.focus = { id: el.id, pos: 0 }; render(); return; }
  if (c === 'brand') { E.setBrand(S, +d.id, v); save(); render(); return; }
  if (c === 'ment') { var mr = E.setMentor(S, +d.id, v === '' ? null : +v); if (mr) say(esc(mr)); save(); render(); return; }
  if (c === 'mgr') { E.setManager(S, +d.id, v === '' ? null : +v); save(); render(); return; }
  if (c === 'cw') { U.cw = U.cw || cwDefault(); U.cw[d.k] = v; U.focus = { id: el.id, pos: 0 }; render(); return; }
  if (c === 'trade') { U.trade = U.trade || { pid: '', theirs: '', mine: '' }; U.trade[d.k] = v; if (d.k === 'pid') U.trade.theirs = ''; U.focus = { id: el.id, pos: 0 }; render(); return; }
  if (c === 'plan') { var pl = S.plan || { sp: null, topic: 'crowd', del: 'notes' }; if (d.k === 'sp') { if (v === '') pl = null; else pl.sp = +v; } else pl[d.k] = v; E.setPlan(S, pl); U.focus = { id: el.id, pos: 0 }; render(); return; }
  if (c === 'repack') { U.repack = v ? { id: +d.id, g: v } : null; U.focus = { id: el.id, pos: 0 }; render(); return; }
  if (!m) return;
  if (c === 'mt') { var def = E.MT[v], ids = [].concat.apply([], m.sides).filter(function (x) { return x != null; }), k = 0; m.mt = v; m.sides = []; for (var s = 0; s < def.sides; s++) { var a = []; for (var p = 0; p < def.per; p++) a.push(k < ids.length ? ids[k++] : null); m.sides.push(a); } m.win = -2; m.call = null; m.title = null; }
  else if (c === 'slot') { m.sides[+d.s][+d.p] = v === '' ? null : +v; }
  else if (c === 'team') { var tm = S.teams.filter(function (x) { return x.id === +v; })[0]; if (tm) m.sides[+d.s] = tm.m.slice(); }
  else if (c === 'call') m.call = v === '' ? null : +v;
  else if (c === 'title') m.title = v || null;
  else if (c === 'stip') m.stip = v;
  else if (c === 'len') m.len = v;
  else if (c === 'int') m.int = v;
  U.focus = { id: el.id, pos: 0 };
  render();
}
document.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b || b.disabled) return; if (e.target.closest('select,input,label') && b.tagName === 'TR') return; act(b.dataset.act, b.dataset); });
document.addEventListener('change', function (e) { var t = e.target; if (t.id === 'uni-file' && t.files && t.files[0]) { var fl = t.files[0], fr = new FileReader(); fr.onload = function () { importUniverse(String(fr.result), fl.name); }; fr.onerror = function () { U.modal = { title: 'Universe not loaded', html: '<p class="bad">That file could not be read.</p>' }; render(); }; fr.readAsText(fl); return; } if (t.dataset && t.dataset.ch) chg(t.dataset.ch, t.dataset, t); });
document.addEventListener('input', function (e) { var t = e.target; if (t.dataset && t.dataset.inp === 'cawsl') { if (U.cw && U.cw.face) { U.cw.face[t.dataset.k] = +t.value; var pc = document.getElementById('portraitCanvas'); if (pc) { pc.dataset.pf = JSON.stringify({ f: cawFace(), g: U.cw.g, bg: U.cw.align }); paintPortraits(); } } return; } if (t.dataset && t.dataset.inp === 'bname') { if (U.setup) U.setup.name = t.value; return; } if (t.dataset && t.dataset.inp === 'fed') { if (U.setup) U.setup.fed[t.dataset.k] = t.value; return; } if (t.dataset && t.dataset.inp === 'cw') { U.cw = U.cw || cwDefault(); U.cw[t.dataset.k] = t.value; return; } if (!S || !t.dataset || !t.dataset.inp) return; if (t.dataset.inp === 'rq') U.rf.q = t.value; else U.mq = t.value; U.focus = { id: t.id, pos: t.selectionStart }; render(); });

var HOT = { o: 'office', b: 'booking', r: 'roster', s: 'story', t: 'titles', h: 'history', m: 'market', f: 'money', c: 'company', w: 'world', n: 'net', a: 'ach' };
document.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest('.dmenu .mi'); if (!b || S || !NAV.on) return; var k = +b.dataset.i; if (k !== U.mi) { U.mi = k; render(); } });
document.addEventListener('mouseover', function (e) { var b = e.target.closest && e.target.closest('.dmenu .mi'); if (!b || S) return; var k = +b.dataset.i; if (k !== U.mi) { U.mi = k; render(); } });
document.addEventListener('keydown', function (e) {
  if (BOOT) { e.preventDefault(); bootSkip(); return; }
  if (e.key === 'F1') { e.preventDefault(); if (U.modal && U.modal.kind === 'help') act('modal-close', {}); else act('help', {}); return; }
  if (e.key === 'F2') { e.preventDefault(); act('options', {}); return; }
  if (e.key === 'GoBack' || e.key === 'BrowserBack' || e.keyCode === 461 || e.keyCode === 10009 || (e.key === 'Backspace' && NAV.on && !isText(e.target))) { if (goBack()) e.preventDefault(); return; }
  if (e.key === 'Enter' && e.target && e.target.tagName === 'TR') { e.preventDefault(); e.target.click(); return; }
  if (NAV.on && /^Arrow/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) { if (navKey(e.key.slice(5).toLowerCase())) e.preventDefault(); return; }
  if (!S && !U.modal && !U.setup) {
    var tgs = e.target && e.target.tagName; if (tgs === 'SELECT' || tgs === 'INPUT') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var nn = U.mn || 1; U.mi = ((U.mi || 0) + (e.key === 'ArrowDown' ? 1 : nn - 1)) % nn; render(); return; }
    if (e.key === 'Enter' || e.key === ' ') { var on = document.querySelector('.dmenu .mi.on'); if (on && (!e.target.closest || !e.target.closest('button') || e.target.classList.contains('mi'))) { e.preventDefault(); act(on.dataset.act, on.dataset); } return; }
    if (e.key === 'Escape' && U.scr === 'select') { e.preventDefault(); act('scr', { v: 'title' }); return; }
    return;
  }
  if (U.modal) { if (e.key === 'Escape') { e.preventDefault(); act('modal-close', {}); } return; }
  if (S && U.cwOpen) { var ct = e.target && e.target.tagName; if (e.key === 'Escape') { e.preventDefault(); act('cw-open', {}); } else if (ct !== 'INPUT' && ct !== 'SELECT' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); act('caw-step', { v: e.key === 'ArrowLeft' ? -1 : 1 }); } return; }
  if (!S || e.ctrlKey || e.metaKey || e.altKey) return;
  var tg = e.target, tag = tg && tg.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (U.live) {
    if (e.key === 'Escape') { e.preventDefault(); act('live-skip', {}); }
    else if ((e.key === 'Enter' || e.key === ' ') && tag !== 'BUTTON') { e.preventDefault(); var go = document.getElementById('live-go'); if (go) act(go.dataset.act, go.dataset); }
    return;
  }
  var k = e.key.length === 1 ? e.key.toLowerCase() : '';
  if (HOT[k]) { e.preventDefault(); act('tab', { v: HOT[k] }); }
});
function boot(d) {
  if (d && d.S && d.S.v === 4) { S = d.S; U = d.U || fresh(); E.attach(S); SAVEB = JSON.stringify(S).length; }
  else { var rm = false; try { rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {} if (PREF.boot && !rm) { BOOT = { step: 0 }; BOOT.t = setTimeout(bootTick, 380); } }
  render();
}
window.EWF_DEBUG = { state: function () { return S; }, render: render, go: function (t) { act('tab', { v: t }); }, pad: padPress, nav: NAV };
var hot = window.claude && window.claude.hot;
if (hot && hot.snapshot) hot.snapshot(function () { return { S: S, U: U }; });
setUniverse(PREF.uni || 'public_domain');
if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
})();
