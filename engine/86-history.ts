// @ts-nocheck
/* Moved from src/86-history.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, rkey } from './00-core';
$L.histWeek = histWeek; $L.histApply = histApply;
/* wraps: 00-core.js, 85-universe.js (it must sort after them; test-buildorder.js checks) */
/* ===== A world's history: what happened before the game begins (Ryan, 16 October: the parody world's 2020 to 2025) =====
   A world package can carry an optional `history` table, so a new game opens on years that already happened:
     reigns    [{title, holders:[ids], from:'2021-03', to:'2022-04' or null, defs, event}]  the line of champions
     matches   [{a, b, winner, date:'2023-04', event, stars, note}]  head to head records; a famous one is in both careers
     feuds     [{a:[ids], b:[ids], from:'2022-01', to:'2022-08', heat, ended, note}]  old rivalries: real heat between
               them, and if it ended in the last year, an ember, so the same two start again with a head start
     moments   [{who, date, text}]  a line in a wrestler's career (a debut, a return, an injury, a turn)
   Dates are a year and a month. Everything before the world's start date is turned into game weeks before week 1.
   It is read once, when a game starts, and never calls rnd(S), so a world with history plays the same seed the
   same way every time. */
export function histWeek(date,y0,m0){var p=String(date||'').split('-'),y=+p[0],m=(+p[1]||1)-1;if(!y)return null;return 1+((y-y0)*12+(m-m0))*4;}
(function(){
  var build=$L.buildDB;
  $L.buildDB=function(pkg){
    var d=build(pkg),H=pkg.history;
    // the persona each wrestler carries in the world file (gimmick, catchphrase, finisher, debut, legend). Kept with
    // the world, not in the save: the save stays small however many people a world has.
    d.persona={};(pkg.workers||[]).forEach(function(w){if(w.gimmick||w.catchphrase||w.finisher_description||w.gimmick_category||w.debut_year||w.legend||w.signatures)
      d.persona[w.id]={cat:w.gimmick_category||null,d:w.gimmick||null,say:w.catchphrase||null,fin:w.finisher_description||null,move:w.finisher_move||null,sigs:Array.isArray(w.signatures)?w.signatures:null,debut:w.debut_year||null,legend:!!w.legend,ht:w.height||null,wt:w.weight||null};});
    if(!H||typeof H!=='object')return d;d.history=H;
    // an old feud is real heat between the people in it, written into the relationships the game starts from
    var W={};(pkg.workers||[]).forEach(function(w){W[w.id]=1;});
    (H.feuds||[]).forEach(function(f){(f.a||[]).forEach(function(a){(f.b||[]).forEach(function(b){if(W[a]&&W[b]&&!d.rels.some(function(r){return (r.a===a&&r.b===b)||(r.a===b&&r.b===a);}))
      d.rels.push({a:a,b:b,type:'rivalry',strength:-Math.min(90,Math.max(30,f.heat||60)),ring_chemistry:f.chem!=null?f.chem:4,note:f.note||'They have history.'});});});});
    return d;
  };
})();
/** Lay a world's history into a new game. */
export function histApply(S){
  var H=$L.DB&&$L.DB.history;if(!H)return;var y0=$L.DB.startYear,m0=$L.DB.startMonth,id={};S.w.forEach(function(w){if(w.uid)id[w.uid]=w.id;});
  var wk=function(d){return histWeek(d,y0,m0);},nm=function(u){var w=S.w[id[u]];return w?w.name:u;};
  var tby={};S.order.forEach(function(pid){(S.promos[pid].titles||[]).forEach(function(t){tby[t.id]=t;});});
  // the line of champions, oldest first; the reign still running joins the one the title already has
  (H.reigns||[]).slice().sort(function(a,b){return (wk(a.from)||0)-(wk(b.from)||0);}).forEach(function(r){var t=tby[r.title];if(!t)return;
    var ids=(r.holders||[]).map(function(u){return id[u];}).filter(function(x){return x!=null;});if(!ids.length)return;
    t.hist=t.hist||[];var to=r.to?wk(r.to):null;if(to!=null&&to>0)to=0;
    if(to==null){t.hist=t.hist.filter(function(h){return !(h.ids===ids.slice().sort().join(',')&&h.to==null);});}
    t.hist.push({ids:ids.slice().sort().join(','),h:ids.map(function(i){return S.w[i].name;}),from:wk(r.from),to:to,show:r.event||'Before your time',defs:r.defs||0});
    // the reign still running when the game begins is the champion's own: it keeps the weeks and defences it already has
    var cur=(t.holders||[]).slice().sort().join(',');
    if(to==null&&cur&&cur===ids.slice().sort().join(',')&&wk(r.from)!=null&&wk(r.from)<1){t.since=wk(r.from);t.defs=r.defs||0;t.defs0=t.defs;   /* the champion's edge in a title match counts only defences made in this game */ var gap=(1-t.since)/((r.defs||0)+1);t.last=Math.min(0,Math.round(t.since+gap*(r.defs||0)));}
    ids.forEach(function(i){var w=S.w[i];(w.tr||(w.tr=[])).push(t.name);});
  });
  Object.keys(tby).forEach(function(k){var t=tby[k];if(t.hist)t.hist.sort(function(a,b){return (a.from||0)-(b.from||0);});});
  // head to head, and the famous nights in both careers
  (H.matches||[]).forEach(function(m){var a=id[m.a],b=id[m.b];if(a==null||b==null)return;var k=rkey(a,b),h=S.h2h[k]||(S.h2h[k]={n:0,a:0,b:0,lw:-1,w:0});
    var win=m.winner!=null?id[m.winner]:null;h.n++;h.w=Math.min(0,wk(m.date)||0);if(win!=null){h.lw=win;if(win===Math.min(a,b))h.a++;else h.b++;}
    if((m.stars||0)>=4.5||m.note){var t=(m.event?m.event+', ':'')+String(m.date||'').slice(0,4)+': '+(win!=null?nm(m.winner)+' beat '+(win===a?nm(m.b):nm(m.a)):nm(m.a)+' and '+nm(m.b)+' fought to a draw')+(m.note?'. '+m.note:'');
      [a,b].forEach(function(i){var w=S.w[i];(w.log||(w.log=[])).push({w:Math.min(0,wk(m.date)||0),k:'classic',t:t});});}
  });
  // old feuds that ended in the last year leave an ember: the same two start again with a head start
  (H.feuds||[]).forEach(function(f){var a=id[(f.a||[])[0]],b=id[(f.b||[])[0]],end=wk(f.to);if(a==null||b==null||end==null||end<-47)return;
    (S.embers||(S.embers={}))[rkey(a,b)]={w:end,h:Math.round(f.heat||60),n:1};});
  // moments in a career
  (H.moments||[]).forEach(function(x){var w=S.w[id[x.who]];if(w)(w.log||(w.log=[])).push({w:Math.min(0,wk(x.date)||0),k:x.k||'moment',t:x.text});});
  S.w.forEach(function(w){if(w.log&&w.log.length){w.log.sort(function(p,q){return p.w-q.w;});if(w.log.length>16)w.log=w.log.slice(-16);}});
  S.histFrom=H.from||null;
}
(function(){var ng=E.newGame;E.newGame=function(){var S=ng.apply(this,arguments);if(S&&S.w)histApply(S);return S;};})();
/** A wrestler's persona from the world file: gimmick, catchphrase, finisher, debut year and whether they are a legend. */
E.persona=function(S,id){var w=S.w[id];return w&&w.uid&&$L.DB&&$L.DB.persona?$L.DB.persona[w.uid]||null:null;};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.histWeek = histWeek;
$L.histApply = histApply;
