/* wraps: 90-api.js (it must sort after them; test-buildorder.js checks) */
/* ===== Suggest a card is safe and flat (Ryan, 16 October; docs/roadmap.md change 1) =====
   "I want suggest a card to give a mediocre show, so you have to have smart decision making if you want to win the
   game or keep your job." The suggested card still fills the clock and breaks no rule, but it does none of the
   thinking: no finishes called, no story ended on the right night, pairings not tuned for chemistry, and the segments
   handed to the writers. The people and the running order are sensible, so it helps. It lands around a B- or C+. Every choice here comes from a hash,
   never rnd(S), so asking for a suggestion cannot change how the game plays out. Rival companies book themselves
   and are not touched. */
(function(){
  var smart=E.suggest;
  E.suggest=function(S){
    var card=smart(S);if(!card||card.length<2)return card;
    var key='flat'+S.seed+':'+S.week+':'+S.qi,show=S.queue&&S.queue[S.qi];
    card.forEach(function(m){m.call=null;delete m.end;});

    // the right people, but who faces whom by the hash: no eye for chemistry or story. A champion stays in their
    // title match. (Ryan: it should still be helpful, it just cannot play the game for you.)
    var P=S.promos[S.player],held={};(P.titles||[]).forEach(function(t){(t.holders||[]).forEach(function(id){held[id]=1;});});
    var pool={};card.forEach(function(m){if(m.mt==='br')return;m.sides.forEach(function(sd){sd.forEach(function(id){var w=S.w[id];if(!w||(m.title&&held[id]))return;(pool[w.g]||(pool[w.g]=[])).push(id);});});});
    Object.keys(pool).forEach(function(g){pool[g].sort(function(a,b){return hash(key+'p'+a)-hash(key+'p'+b);});});
    var was=JSON.stringify(card.map(function(m){return m.sides;}));
    card.forEach(function(m){if(m.mt==='br')return;m.sides=m.sides.map(function(sd){return sd.map(function(id){var w=S.w[id];if(!w||(m.title&&held[id]))return id;var L=pool[w.g];return L&&L.length?L.shift():id;});});});
    if(E.validate(S,card).errors.length){var back=JSON.parse(was);card.forEach(function(m,i){m.sides=back[i];});}
    // the promos and angles go to the writers, who write whatever comes to mind on the night
    segRead(S).forEach(function(sg){if(!sg.tape){sg.k='writers';sg.who=[];sg.ids=[];}});
    E.fitShow(S,card);
    return card;
  };
  /** The thinking suggest did before it was made flat, for rival-free tools and tests that want a good card. */
  E.suggestSmart=function(S){return smart(S);};
})();
