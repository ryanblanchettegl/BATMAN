// @ts-nocheck
/* Moved from src/99-ringwork.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
/* wraps: 10-match.js (it must sort after them; test-buildorder.js checks) */
/* Ring work: a match on the broadcast is a match, not a summary (Ryan, 20 October: "each match and segment needs to
   last longer with more back and forth and use of moves"). After the bell, callMatch() used to say a handful of
   lines. Now a run of exchanges goes in between: who has control, the moves they use (their own signature moves from
   the world file or Create a Player first, then moves of their style), the cut-off, the comeback, a near fall that
   builds late, and the colour voice reacting now and then. The number grows with the match's length: a short opener
   gets a few, a long main event a lot. The winner's side has the better of the closing stretch. It is picked by a
   hash of the match, never rnd(S), so it changes what is said and never what happens. */
export var RW_MOVES={
  B:['a running clothesline','a flurry of right hands','a headbutt','a back body drop','a stiff elbow','a sit-out slam','a spinebuster','a chop that echoes round the building'],
  T:['a snap suplex','a hammerlock','a German suplex','a short-arm clothesline','a single-leg crab','a fisherman suplex','a drop toehold','a cross armbar','a belly-to-back suplex'],
  H:['a springboard dropkick','a hurricanrana','a tope through the ropes','a missile dropkick','a moonsault press','a handspring elbow','a diving crossbody','a corkscrew plancha'],
  P:['a scoop slam','a shoulder tackle that flattens','a delayed vertical suplex','a bearhug','a big boot','a gorilla press','a powerslam','a running splash in the corner'],
  S:['a spinning back kick','a knee to the jaw','a superkick','a rolling elbow','a flurry of kicks','a jumping knee','a discus lariat'],
  E:['a swinging neckbreaker','a showboating elbow drop','a Russian leg sweep','a running bulldog','a sunset flip','a rope-assisted leg drop'],
  A:['a dropkick','a DDT','a backbreaker','an inverted atomic drop','a neckbreaker','a suplex','a bulldog','a clothesline off the top']
};
export var RW_LINES={
  open:['{a} takes control with {m}.','{a} gets the upper hand early with {m}.','{a} sets the pace: {m}.'],
  press:['{a} keeps the pressure on with {m}.','{a} stays on top of it: {m}.','{a} follows up with {m}.','{a} grinds {b} down with {m}.'],
  cut:['{b} tries to fight back, but {a} cuts it off with {m}.','{b} goes for a comeback and runs straight into {m}.','Not so fast: {a} stops {b} cold with {m}.'],
  swing:['{a} reverses it and hits {m}!','Out of nowhere, {a} turns it round with {m}!','{a} counters and lands {m}!','{a} fights out of it and connects with {m}!'],
  sig:['{a} hits {s}! The crowd knows what that is!','{a} goes to the well: {s}!','That is {s}, {a}’s signature, and it lands clean!'],
  near:['Cover! One, two... {b} kicks out!','{a} hooks the leg! One, two... no! {b} gets a shoulder up!','One, two... so close! {b} is still in this!'],
  col:['{p}, {b} is fighting from underneath, but you can never count them out.','These two know each other, {p}. Every move is answered.','The crowd is right in this one, {p}.','{a} is controlling the tempo, {p}. Smart wrestling.','Listen to this place, {p}! They are hanging on every move.','You can feel the momentum going back and forth, {p}.']
};
export function rwMoves(S,w){
  var L=[],ps=typeof $L.E.persona==='function'?$L.E.persona(S,w.id):null;
  if(w.look&&Array.isArray(w.look.finishing_moves))w.look.finishing_moves.slice(1).forEach(function(m){if(m&&m.name)L.push({n:m.name,sig:1});});
  if(ps&&ps.sigs)ps.sigs.forEach(function(m){if(m&&m.name)L.push({n:m.name,sig:1});});
  (RW_MOVES[w.style]||RW_MOVES.A).forEach(function(n){L.push({n:n});});
  return L;
}
(function(){
  var cm=$L.callMatch;
  $L.callMatch=function(S,P,x){
    var bc=cm.apply(this,arguments);
    if(!bc||!x||!x.sides||x.m.mt==='br'||x.sides.length<2)return bc;
    var at=-1;for(var i=0;i<bc.length;i++){if(bc[i].t==='pbp'){at=i;break;}}   // the bell
    if(at<0)return bc;
    var hk='rw|'+(x.o&&x.o.a||'')+'|'+(x.o&&x.o.b||'')+'|'+x.mins+'|'+S.week+'|'+(x.show||''),k=0,h=function(){return ($L.hash((k++)+'#'+hk)>>>0)%100003/100003;};
    // nothing said twice in one match while there is something else to say
    var said={},pick=function(L){var f=L.filter(function(v){return !said[v.n||v];}),Q=f.length?f:L,v=Q[Math.floor(h()*Q.length)%Q.length];said[v.n||v]=1;return v;};
    var cap=function(t){return t.charAt(0).toUpperCase()+t.slice(1);};
    var lead=function(s){return s[Math.floor(h()*s.length)%s.length];};
    var ws=x.win>=0&&x.win<x.sides.length?x.win:0;
    var n=Math.max(3,Math.min(16,Math.round((x.mins||10)/1.4))),out=[],side=h()<0.5?0:1,sigUsed={};
    var p=x.o&&x.o.p||'partner';
    for(var j=0;j<n;j++){
      var late=j>=n*0.6,other=function(s){return (s+1+Math.floor(h()*(x.sides.length-1)))%x.sides.length;};
      // the closing stretch leans to the side that wins; early on it swings either way
      var swap=j===0?false:(late?(side!==ws?h()<0.55:h()<0.3):h()<0.4);
      if(swap)side=other(side);
      var A=lead(x.sides[side]),B=lead(x.sides[other(side)]),M=rwMoves(S,A),sigs=M.filter(function(m){return m.sig&&!sigUsed[A.id+m.n];});
      var ctx={a:A.name,b:B.name,p:p},kind;
      if(late&&sigs.length&&h()<0.45){var s=pick(sigs);sigUsed[A.id+s.n]=1;ctx.s=s.n;out.push({t:'pbp',x:$L.fill(pick(RW_LINES.sig),ctx),h:1});
        if(h()<0.6)out.push({t:'pbp',x:$L.fill(pick(RW_LINES.near),ctx),h:1});continue;}
      ctx.m=pick(M.filter(function(m){return !m.sig;})).n;
      kind=j===0?'open':(swap?'swing':(h()<0.35?'cut':'press'));
      out.push({t:'pbp',x:cap($L.fill(pick(RW_LINES[kind]),ctx))});
      if(late&&h()<0.25)out.push({t:'pbp',x:$L.fill(pick(RW_LINES.near),ctx),h:1});
      else if(h()<0.22)out.push({t:'col',x:cap($L.fill(pick(RW_LINES.col),ctx))});
    }
    bc.splice.apply(bc,[at+1,0].concat(out));
    return bc;
  };
})();

// hand this module's names back to the bridge, so legacy code that calls them finds them
$L.RW_MOVES = RW_MOVES;
$L.RW_LINES = RW_LINES;
$L.rwMoves = rwMoves;
