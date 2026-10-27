// @ts-nocheck
/* Moved from src/99-reigns.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { hash } from './00-core';
/* wraps: 10-match.js (it must sort after them; test-buildorder.js checks) */
/* Rival offices plan their reigns (the week of 20 October, step 4). A rival company's champion used to have the same
   odds as anybody in every title match, so belts changed hands about every two months across the world. Real offices
   decide how long a reign should run. Now each rival reign has a planned length, 16 to 51 weeks (a reign already running when the game begins goes on 8 to 31 weeks more), fixed by a hash of
   the title and the day the reign began. Before it is up the champion is protected, most of all on weekly television;
   after it, the title match is as open as any other. The player's own titles are untouched: the player books their own
   finishes. No rnd(S) is added: the odds change, the draw that reads them does not. */
(function(){
  var w0=$L.winOdds;
  $L.winOdds=function(S,P,show,m,sides,t,champSide){
    var od=w0.apply(this,arguments);
    if(!t||champSide<0||!P||P.id===S.player||S.cal||!od||!od.p)return od;
    var h=hash(S.seed+':'+t.id+':'+t.since),plan=16+h%36,age=S.week-t.since;
    if(t.since<1)plan=Math.max(plan,(1-t.since)+8+(h>>>6)%24);   // a reign carried from the world's history runs on for a while yet
    if(age>=plan)return od;
    var keep=show&&show.big?0.35:0.15,pc=od.p[champSide],room=1-od.draw,np=room-(room-pc)*keep,k=room-pc>0?(room-np)/(room-pc):0;
    od.p=od.p.map(function(p,i){return i===champSide?np:p*k;});
    return od;
  };
})();
