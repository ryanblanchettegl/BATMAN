// @ts-nocheck
/* Moved from src/99-audience.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.audInit = audInit; $L.audReach = audReach; $L.audLean = audLean; $L.audTarget = audTarget; $L.audBase = audBase; $L.audTotal = audTotal; $L.audOffer = audOffer;
/* wraps: 00-core.js, 34-night.js (it must sort after them; test-buildorder.js checks) */
/* Audience share (Ryan, 20 October: "I want the companies fighting for audience share. Build out a full demographic
   system that changes who watches what based on the shows you run, star power, storyline and other tangible things
   ... Audience share is how we rank the companies, start the companies based on real world companies").
   The wrestling audience is six groups, each a number of homes and a taste of its own:
     casual    tunes in for stars, hot stories and big nights
     diehard   wants great matches and is put off by gimmicks
     family    wants the heroes to win and no hardcore
     young     likes villains, edge, hardcore and the women's division
     lucha     likes high flyers, masks and spectacle
     oldschool likes veterans, title matches and tradition
   Every show any company runs is read for what it offered each group (SHOWX): how it went against its own crowd (the
   letter), the stars on it, the heat of its stories, who won the main event, hardcore and gimmick matches, high flyers
   and masks, women's matches, veterans and titles. Each company's model has its own lean too. Once a week (WEEKX) each
   group drifts toward the companies that offered it most, weighted by how far each company reaches; a group never
   jumps all at once. A company's audience share is its slice of all six. It ranks the companies (E.audience), and it
   moves television money: viewers follow share, measured against where a company began, so a new game draws what
   it drew before. The world starts where the world is: the shares at the start come from each company's size and
   lean, and the parody world's companies are sized like the ones they parody. Nothing here calls rnd(S).
   What it hands on (rule 7a): a group slipping away, and a rival gaining on you, named on the desk and After the show. */
export var AUD=[
  {k:'casual',n:'Casual fans',size:4.2,want:'stars, hot stories and big nights'},
  {k:'diehard',n:'Diehards',size:1.6,want:'great matches, given time'},
  {k:'family',n:'Families',size:2.4,want:'heroes who win, and nothing too rough'},
  {k:'young',n:'Young adults',size:2.6,want:'villains, edge, hardcore and the women’s division'},
  {k:'lucha',n:'Lucha and high-flyer fans',size:1.0,want:'high flyers, masks and spectacle'},
  {k:'oldschool',n:'Old-school fans',size:1.2,want:'veterans, title matches and tradition'}
];
$L.AUD = AUD;
/* how each kind of company leans with each group (1 is no lean) */
export var AUD_MODEL={
  corporate:{casual:1.25,family:1.3,young:0.9,diehard:0.75,lucha:0.85,oldschool:0.95},
  workrate:{diehard:1.4,casual:0.9,family:0.85,young:1.05,oldschool:1.05},
  purist:{diehard:1.35,oldschool:1.25,family:0.9,casual:0.85,lucha:0.85},
  underdog:{young:1.15,diehard:1.1,casual:0.95},
  startup:{casual:1.1,young:1.15,oldschool:0.8},
  outlaw:{young:1.45,family:0.55,diehard:1.05,oldschool:0.8},
  spectacle:{lucha:1.6,family:1.15,casual:1.0,oldschool:0.85},
  tradition:{lucha:1.45,oldschool:1.25,family:1.05},
  joshi:{diehard:1.25,young:1.2,casual:0.9},
  classic:{}
};
$L.AUD_MODEL = AUD_MODEL;
export var AUD_DRIFT=0.06;
$L.AUD_DRIFT = AUD_DRIFT;   // how much of the gap a group closes in a week
export function audInit(S){
  if(S.aud&&S.aud.sh)return S.aud;
  var A=S.aud={sh:{},wk:{},hist:{}};
  $L.AUD.forEach(function(g){var t=$L.audTarget(S,g.k,null);A.sh[g.k]=t;});
  S.order.forEach(function(pid){var P=S.promos[pid];if(P){P.aud0=$L.audTotal(S,pid);P.audM=1;}});
  return A;
}
export function audReach(P){return Math.pow(Math.max(5,P.image||50)/100,2.2)*(P.dead?0:1);}
export function audLean(P,k){var m=$L.AUD_MODEL[P.model||'classic']||{};return m[k]||1;}
/** Where group k would settle: every live company's pull (its reach, its lean, and what it offered this week). */
export function audTarget(S,k,offer){
  var t={},sum=0;
  S.order.forEach(function(pid){var P=S.promos[pid];if(!P||P.dead)return;var o=offer&&offer[pid]&&offer[pid][k]!=null?offer[pid][k]:1;
    var v=$L.audReach(P)*$L.audLean(P,k)*Math.pow(Math.max(0.2,o),2.4);t[pid]=v;sum+=v;});
  Object.keys(t).forEach(function(pid){t[pid]=sum?t[pid]/sum:0;});
  return t;
}
/** The share a company would hold if every company's shows offered the same: its reach and its lean alone. */
export function audBase(S,pid){var tot=0,all=0;$L.AUD.forEach(function(g){all+=g.size;tot+=g.size*($L.audTarget(S,g.k,null)[pid]||0);});return all?tot/all:0;}
/** A company's slice of the whole audience, 0 to 1. */
export function audTotal(S,pid){var A=S.aud,tot=0,all=0;if(!A||!A.sh)return 0;$L.AUD.forEach(function(g){all+=g.size;tot+=g.size*((A.sh[g.k]||{})[pid]||0);});return all?tot/all:0;}
/* what one show offered each group, from what was on it */
export function audOffer(S,P,show,rep,card){
  if(!rep)return null;
  var cs=$L.repCS(rep),grade=0.55+0.9*$L.clamp((cs-45)/45,0,1.3);
  var ms=(card||[]).filter(function(m){return m&&m.sides;}),n=Math.max(1,ms.length),ids=[];ms.forEach(function(m){$L.flat(m.sides).forEach(function(id){if(ids.indexOf(id)<0)ids.push(id);});});
  var ws=ids.map(function(id){return S.w[id];}).filter(Boolean),top=ws.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}).slice(0,3);
  var star=$L.clamp(($L.avg(top.length?top:[50])-55)/35,0,1.2);
  var heat=0,fs=(S.feuds||[]).filter(function(f){return !f.res&&f.promo===P.id&&f.a.concat(f.b).some(function(id){return ids.indexOf(id)>=0;});});fs.forEach(function(f){heat=Math.max(heat,f.heat||0);});heat=heat/100;
  var share=function(fn){return ms.filter(fn).length/n;};
  var hard=share(function(m){return /hardcore|tables|cage|ladder|street|barbed|weapons|no_dq|nodq|lumber/i.test(m.stip||'');});
  var multi=share(function(m){return m.mt==='3way'||m.mt==='4way'||m.mt==='6man'||m.mt==='br';});
  var women=share(function(m){var w=S.w[$L.flat(m.sides)[0]];return w&&w.g==='F';});
  var titles=share(function(m){return !!m.title;});
  var fly=ws.length?ws.filter(function(w){return w.style==='H';}).length/ws.length:0;
  var mask=ws.length?ws.filter(function(w){return typeof $L.masked==='function'&&$L.masked(w)===1;}).length/ws.length:0;
  var vets=ws.length?ws.filter(function(w){return (w.age||30)>=38;}).length/ws.length:0;
  var segs=(rep.segs||[]).filter(function(s){return s.k==='match';}),mq=segs.length?$L.avg(segs.map(function(s){return s.ov||0;}))/5:0.5;
  var main=segs[segs.length-1],heroWon=0,heelWon=0;if(main&&main.wi&&main.wi.length){var w0=S.w[main.wi[0]];if(w0){if(w0.align==='F')heroWon=1;else heelWon=1;}}
  var big=show&&show.big?1:0;
  var o={
    casual:grade*(0.75+0.45*star+0.3*heat+0.15*big),
    diehard:grade*(0.6+0.75*mq-0.25*multi-0.15*hard*(hard>0.4?1:0)),
    family:grade*(0.8+0.35*heroWon-0.2*heelWon-0.7*hard+0.2*star),
    young:grade*(0.7+0.5*hard+0.3*heat+0.2*heelWon+0.3*women),
    lucha:grade*(0.65+0.8*fly+0.4*mask+0.25*multi),
    oldschool:grade*(0.7+0.6*vets+0.35*titles-0.35*hard+0.15*mq)
  };
  Object.keys(o).forEach(function(k){o[k]=$L.clamp(o[k],0.2,2.2);});
  return o;
}
$L.SHOWX.push(function(S,P,show,rep,card){
  if(S.cal||!P||!rep)return;var A=$L.audInit(S),o=$L.audOffer(S,P,show,rep,card||rep.card);if(!o)return;
  var w=A.wk[P.id]||(A.wk[P.id]={n:0});w.n++;Object.keys(o).forEach(function(k){w[k]=(w[k]||0)+o[k]*(show&&show.big?1.6:1);});
  if(P.id===S.player)rep.aud=o;   // what this show offered each group, for After the show
});
$L.WEEKX.push(function(S){
  if(S.cal||S.over)return;var A=$L.audInit(S),offer={};
  S.order.forEach(function(pid){var w=A.wk[pid],P=S.promos[pid];if(!P)return;offer[pid]={};$L.AUD.forEach(function(g){offer[pid][g.k]=w&&w.n?w[g.k]/w.n:0.85;});});   // a company that ran nothing this week offers a little less
  var was={};S.order.forEach(function(pid){was[pid]=$L.audTotal(S,pid);});
  $L.AUD.forEach(function(g){var t=$L.audTarget(S,g.k,offer),cur=A.sh[g.k]||(A.sh[g.k]={}),sum=0;
    S.order.forEach(function(pid){var v=(cur[pid]||0)+$L.AUD_DRIFT*((t[pid]||0)-(cur[pid]||0));cur[pid]=Math.max(0,v);sum+=cur[pid];});
    if(sum>0)S.order.forEach(function(pid){cur[pid]/=sum;});});
  S.order.forEach(function(pid){var P=S.promos[pid];if(!P)return;var now=$L.audTotal(S,pid),h=A.hist[pid]||(A.hist[pid]=[]);h.push(Math.round(now*10000)/10000);if(h.length>24)h.shift();
    // television follows the audience. Popularity already moves viewers, so the share is measured against what a
    // company of this popularity and kind would hold with ordinary shows: only what its shows offer moves the money.
    // A rival office has nobody to react to a slide, so a falling share costs it less than it costs the player.
    var base=$L.audBase(S,pid),lo=pid===S.player?0.8:0.9;P.audM=base>0?$L.clamp(Math.pow(now/base,0.6),lo,1.6):1;});
  A.wk={};
  // the player hears where they stand when it moves
  var P=S.promos[S.player],me=$L.audTotal(S,S.player),d=me-(was[S.player]||me),rk=$L.E.audience(S).rank;
  if(P&&Math.abs(d)>=0.002)$L.news(S,'world','AUDIENCE: '+P.name+' '+(d>0?'gained':'lost')+' '+(Math.abs(d)*100).toFixed(1)+' points of audience share, now '+(me*100).toFixed(1)+'% (number '+rk+' in the world).');
});
(function(){var vk=$L.viewersK;$L.viewersK=function(P,show,qf){return vk.apply(this,arguments)*(P&&P.audM?P.audM:1);};})();
/** Audience share for the screens: every company ranked, and the player's six groups with what each wants. */
$L.E.audience=function(S){
  var A=$L.audInit(S),L=S.order.filter(function(pid){return S.promos[pid]&&!S.promos[pid].dead;}).map(function(pid){var P=S.promos[pid],h=(A.hist[pid]||[]),now=$L.audTotal(S,pid),then=h.length>4?h[h.length-5]:(P.aud0||now);
    return {id:pid,name:P.name,share:Math.round(now*1000)/10,move:Math.round((now-then)*1000)/10,mine:pid===S.player,homes:Math.round(now*$L.AUD.reduce(function(a,g){return a+g.size;},0)*100)/100};}).sort(function(a,b){return b.share-a.share;});
  var rank=L.findIndex(function(x){return x.mine;})+1;
  var groups=$L.AUD.map(function(g){var s=(A.sh[g.k]||{})[S.player]||0,lead=Object.keys(A.sh[g.k]||{}).sort(function(a,b){return A.sh[g.k][b]-A.sh[g.k][a];})[0];
    return {k:g.k,n:g.n,size:g.size,share:Math.round(s*1000)/10,want:g.want,leader:lead&&S.promos[lead]?S.promos[lead].name:'',lead:lead===S.player};});
  return {rank:rank,of:L.length,table:L,groups:groups};
};
/** A company's audience share, 0 to 100. */
$L.E.shareOf=function(S,pid){$L.audInit(S);return Math.round($L.audTotal(S,pid)*1000)/10;};
/* After the show says which groups the night pleased and which it put off (rule 7a: a group slipping away is next week's problem) */
(function(){var af=$L.E.afterShow;$L.E.afterShow=function(S){var r=af.apply(this,arguments);if(!r||!r.items)return r;
  var rep=null;for(var i=0;i<S.reports.length;i++){if(S.reports[i].week===S.week&&S.reports[i].left&&S.reports[i].left.key===r.key){rep=S.reports[i];break;}}
  if(!rep||!rep.aud)return r;
  var L=$L.AUD.map(function(g){return {g:g,v:rep.aud[g.k]||1};}).sort(function(a,b){return b.v-a.v;}),best=L[0],worst=L[L.length-1],A=$L.E.audience(S);
  var line=best.g.n+' loved it'+(worst.v<0.85?'; '+worst.g.n.toLowerCase()+' were put off':'')+'. You are number '+A.rank+' in audience share.';
  var detail=L.map(function(x){return x.g.n+': '+(x.v>=1.25?'loved it':x.v>=1?'liked it':x.v>=0.8?'so-so':'put off')+'. They want '+x.g.want+'.';}).concat(['Groups drift a little every week toward whoever gives them what they want. Television money follows your share.']);
  var seen=!!(S.nightSeen&&S.nightSeen.key===r.key&&S.nightSeen.k&&S.nightSeen.k.aud),it={k:'aud',n:'The audience',line:line,detail:detail,tone:worst.v<0.8?'warn':'good',seen:seen};
  var at=r.items.findIndex(function(x){return x.k==='next';});if(at<0)r.items.push(it);else r.items.splice(at,0,it);if(!seen)r.unseen=(r.unseen||0)+1;
  return r;};})();

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.AUD = AUD;
$L.AUD_MODEL = AUD_MODEL;
$L.AUD_DRIFT = AUD_DRIFT;
$L.audInit = audInit;
$L.audReach = audReach;
$L.audLean = audLean;
$L.audTarget = audTarget;
$L.audBase = audBase;
$L.audTotal = audTotal;
$L.audOffer = audOffer;
