// @ts-nocheck
/* Moved from src/99-suggest-flat.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
/* wraps: 90-api.js (it must sort after them; test-buildorder.js checks) */
/* ===== Suggest a card is safe and flat (Ryan, 16 October; docs/roadmap.md change 1) =====
   "I want suggest a card to give a mediocre show, so you have to have smart decision making if you want to win the
   game or keep your job." The suggested card still fills the clock and breaks no rule, but it does none of the
   thinking: no finishes called, no story ended on the right night, pairings not tuned for chemistry, and the segments
   handed to the writers. The people and the running order are sensible, so it helps. It lands around a C. Every choice here comes from a hash,
   never rnd(S), so asking for a suggestion cannot change how the game plays out. Rival companies book themselves
   and are not touched. */
export var SUG_FLAT=10;   // how much flatter the crowd is for a match left as suggested
(function(){
  var smart=$L.E.suggest;
  $L.E.suggest=function(S){
    var card=smart(S);if(!card||card.length<2)return card;
    var key='flat'+S.seed+':'+S.week+':'+S.qi,show=S.queue&&S.queue[S.qi];
    card.forEach(function(m){m.call=null;delete m.end;});

    // the right people, but who faces whom by the hash: no eye for chemistry or story. A champion stays in their
    // title match. (Ryan: it should still be helpful, it just cannot play the game for you.)
    var P=S.promos[S.player],held={};(P.titles||[]).forEach(function(t){(t.holders||[]).forEach(function(id){held[id]=1;});});
    var pool={};card.forEach(function(m){if(m.mt==='br')return;m.sides.forEach(function(sd){sd.forEach(function(id){var w=S.w[id];if(!w||(m.title&&held[id]))return;(pool[w.g]||(pool[w.g]=[])).push(id);});});});
    Object.keys(pool).forEach(function(g){pool[g].sort(function(a,b){return $L.hash(key+'p'+a)-$L.hash(key+'p'+b);});});
    var was=JSON.stringify(card.map(function(m){return m.sides;}));
    card.forEach(function(m){if(m.mt==='br')return;m.sides=m.sides.map(function(sd){return sd.map(function(id){var w=S.w[id];if(!w||(m.title&&held[id]))return id;var L=pool[w.g];return L&&L.length?L.shift():id;});});});
    if($L.E.validate(S,card).errors.length){var back=JSON.parse(was);card.forEach(function(m,i){m.sides=back[i];});}
    // the promos and angles go to the writers, who write whatever comes to mind on the night
    $L.segRead(S).forEach(function(sg){if(!sg.tape){sg.k='writers';sg.who=[];sg.ids=[];}});
    $L.E.fitShow(S,card);
    S.sug={w:S.week,qi:S.qi,k:card.map(sugKey)};
    return card;
  };
  /* the crowd can tell a card booked by the numbers (Bill, 21 October: Suggest a card lands around a C). A match left
     just as Suggest a card put it, same people, same kind, same title, works in front of a flat crowd. Change who is
     in it and it is your match. */
  function sugKey(m){return m.mt+'|'+(m.title||'')+'|'+m.sides.map(function(sd){return sd.slice().sort(function(a,b){return a-b;}).join(',');}).sort().join('/');}
  $L.CRX.push(function(ctx){
    var S=ctx.S,G=S.sug;if(!ctx.isPl||!G||G.w!==S.week||G.qi!==S.qi||G.k.indexOf(sugKey(ctx.m))<0)return null;
    return {d:-SUG_FLAT,x:'Booked by the numbers: the crowd has seen this one before'};
  });
  /** The thinking suggest did before it was made flat, for rival-free tools and tests that want a good card. */
  $L.E.suggestSmart=function(S){return smart(S);};
})();

// hand this module's names back to the bridge, so legacy code that calls them finds them
$L.SUG_FLAT = SUG_FLAT;
