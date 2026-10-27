// @ts-nocheck
/* Moved from src/99-midstory.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.midStory = midStory;
/* wraps: 00-core.js, 86-history.js (it must sort after them; test-buildorder.js checks) */
/* The world starts mid-story (the week of 20 October, step 3). A new game used to open with no story running and
   every champion without a challenger, as if the company had been switched on that morning. Now the company you take
   over is already in the middle of things:
   - each singles champion has a challenger chasing them, the best fit on the same brand and in the same division,
     with the other alignment where there is one;
   - the worst real-life rivalries on the roster (the relationship matrix, which the world's history and relationships
     feed) are already running as feuds;
   - each of these began a few weeks before you arrived, so it has some heat and has used a little of its freshness.
   At most four stories, so the first week has something to book without being full. It runs once, when the game
   starts, picks people by a hash and never calls rnd(S), so the same world and seed open the same way. What it hands
   on (rule 7a): a title match the crowd is waiting for, and a feud that wants its next chapter. */
export var MID_MAX=4;
$L.MID_MAX = MID_MAX;
export function midStory(S){
  var P=S.promos[S.player];if(!P||S.mid||S.custom)return;S.mid=1;   // a federation you start yourself has no past yet
  var key='mid'+S.seed,busy={},made=0,R=$L.rosterOf(S,P.id).filter(function(w){return !w.nw&&w.inj<=0;});
  var age=function(k){return 3+$L.hash(key+k)%6;};   // three to eight weeks old
  function open(f,weeks,why){
    if(!f)return;f.start=1-weeks;f.last=0;f.fresh=$L.clamp(100-weeks*4,60,95);
    f.log=[{w:f.start,t:why}];f.mid=1;made++;
    f.a.concat(f.b).forEach(function(id){busy[id]=1;});
  }
  // 1. a challenger for every singles champion
  P.titles.filter(function(t){return !t.tag&&t.holders.length===1;}).sort(function(a,b){return b.lvl-a.lvl;}).forEach(function(t){
    if(made>=$L.MID_MAX-1)return;var ch=S.w[t.holders[0]];if(!ch||busy[ch.id])return;
    var pool=R.filter(function(w){return w.id!==ch.id&&!busy[w.id]&&w.g===ch.g&&(!t.brand||w.brand===t.brand)&&!$L.holdLvl(P,w.id);});
    if(!pool.length)return;
    pool.sort(function(a,b){var s=function(w){return w.ovr+(w.align!==ch.align?6:0)+($L.hash(key+t.id+w.id)%5);};return s(b)-s(a);});
    var c=pool[0],wk=age(t.id);
    open($L.startFeud(S,P,c,ch,30+wk*4,c.name+' has been chasing the '+t.name,{title:t.id,force:true}),wk,c.name+' has been chasing '+ch.name+' and the '+t.name+' for weeks');
  });
  // 2. the worst real heat on the roster
  var pairs=[];
  R.forEach(function(a,i){R.slice(i+1).forEach(function(b){if(a.g!==b.g||(a.brand&&b.brand&&a.brand!==b.brand))return;var v=$L.bondOf(S,a.id,b.id);if(v<=-40)pairs.push({a:a,b:b,v:v});});});
  pairs.sort(function(x,y){return x.v-y.v||$L.hash(key+x.a.id+'-'+x.b.id)-$L.hash(key+y.a.id+'-'+y.b.id);});
  pairs.forEach(function(p){
    if(made>=$L.MID_MAX||busy[p.a.id]||busy[p.b.id])return;var wk=age(p.a.id+'-'+p.b.id);
    open($L.startFeud(S,P,p.a,p.b,35+Math.min(25,-p.v/4),'Real heat between '+p.a.name+' and '+p.b.name+' spilled onto the show',{force:true}),wk,p.a.name+' and '+p.b.name+' cannot stand each other, and it is on the show now');
  });
}
// a test of one mechanic can start from a blank slate: E.newGame(pid, seed, {mid: false})
(function(){var ng=$L.E.newGame;$L.E.newGame=function(){var S=ng.apply(this,arguments),o=arguments[2];if(S&&S.w&&!S.cal&&!(o&&o.mid===false))$L.midStory(S);return S;};})();

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.MID_MAX = MID_MAX;
$L.midStory = midStory;
