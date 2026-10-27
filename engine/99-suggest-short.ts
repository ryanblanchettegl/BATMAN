// @ts-nocheck
/* Moved from src/99-suggest-short.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, SLOT_MAX, flat, hash } from './00-core';
/* wraps: 99-suggest-flat.js, 55-preshow.js (it must sort after them; test-buildorder.js checks) */
/* Suggest a card never comes up short (the week of 20 October, step 1). On a brand show whose roster has run thin
   (injuries, people on the week off, worn bodies kept back), the suggestion could leave two matches and empty time,
   and the show could not run. Now, when it is short, it fills from the people who are still able to work on that
   brand: first anybody it held back for being worn down, then, as a last resort, somebody working twice tonight
   ("double duty", which the run sheet already warns about). Then the clock is filled again. It never takes a person
   from another brand (that breaks the brand) and never calls rnd(S): the picks come from a hash. */
(function(){
  function short(S,card){
    var v=E.validate(S,card).errors;
    return v.some(function(e){return /at least 3 matches|still empty/.test(e);});
  }
  function topUp(S,card){
    var show=S.queue&&S.queue[S.qi],P=S.promos[S.player];
    if(!show||!card||!P||!short(S,card))return card;
    var key='fill'+S.seed+':'+S.week+':'+S.qi,used={};
    card.forEach(function(m){flat(m.sides).forEach(function(id){used[id]=(used[id]||0)+1;});});
    var able=S.w.filter(function(w){return w.promo===P.id&&!w.nw&&w.inj<=0&&!w.camp&&w.rest!==S.week&&!(w.away>=S.week)&&(show.big||!show.brand||w.brand===show.brand);});
    function order(a,b){return (used[a.id]||0)-(used[b.id]||0)||b.cond-a.cond||hash(key+a.id)-hash(key+b.id);}
    var max=show.big?10:SLOT_MAX[P.slot],tries=0;
    // first people not yet on the card, while the show is short; then, only to reach three matches, double duty
    while(short(S,card)&&card.length<max&&tries++<8){
      var added=false;
      // fresh people in either division first; somebody twice tonight only to reach three matches
      [true,false].forEach(function(fresh){
        if(added||(!fresh&&card.length>=3))return;
        ['M','F'].forEach(function(g){
          if(added||card.length>=max)return;
          var L=able.filter(function(w){return w.g===g&&(!fresh||!used[w.id]);}).sort(order);if(L.length<2)return;
          var a=L[0],b=null;
          for(var i=1;i<L.length;i++){if(L[i].team==null||L[i].team!==a.team){b=L[i];break;}}
          if(!b)return;
          card.push({mt:'1v1',sides:[[a.id],[b.id]],win:-2,title:null,stip:'std',len:'M',fill:1});
          used[a.id]=(used[a.id]||0)+1;used[b.id]=(used[b.id]||0)+1;added=true;
        });
      });
      if(!added)break;
      E.fitShow(S,card);
    }
    // nobody left who can work: the writers fill the rest of the night with backstage segments
    var L=$L.segList(S),k=0;
    while(short(S,card)&&card.length>=3&&k++<6){L.push({k:'writers',who:[],pos:k%card.length,len:'L'});E.fitShow(S,card);}
    return card;
  }
  var flatS=E.suggest,smartS=E.suggestSmart,pre=E.resolvePre;
  // a pre-show problem (somebody does not turn up) can take a match off the card: the office fills the hole
  E.resolvePre=function(S,card){var r=pre.apply(this,arguments);if(card&&S.queue&&S.queue[S.qi])topUp(S,card);return r;};
  E.suggest=function(S){return topUp(S,flatS(S));};
  E.suggestSmart=function(S){return topUp(S,smartS(S));};
})();
