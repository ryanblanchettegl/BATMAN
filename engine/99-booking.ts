/* ---------- the Clock Wall booking screen: what the screen reads ----------
   Research/docs/plans/booking-clock-wall.md (Ryan, 26 October; D-019). Three questions the booking screen asks of a
   card while it is being built. They only read the game: no rnd(S), nothing written to S, the same answer every time
   the page is drawn.
     - E.fitsFor(S, card, i, si): who could fill a spot on match i, best first, with the reasons in words;
     - E.cardKnock(S, card): what this card changes (feuds on, half on or left off, a promise, worn bodies, booking power, titles);
     - E.looseThreads(S, card): every running feud of yours that does not meet tonight, hottest first, with its stakes. */
import { L as $L } from './_gen/legacy.js';
import { E, cal, eligible, feudOf, flat, titleById } from './00-core';
import { feudPhase, PHASE_N } from './21-living';
import { cardCost } from './65-you';
import { bondOf, REL_ON } from './66-relations';

function bookedIds(card){var on={};(card||[]).forEach(function(m){(m.sides||[]).forEach(function(s){s.forEach(function(id){if(id!=null)on[id]=1;});});});return on;}
function myFeuds(S){return (S.feuds||[]).filter(function(f){return !f.res&&f.promo===S.player;});}
function names(S,ids){return ids.map(function(id){return S.w[id]?S.w[id].name:'?';}).join(' and ');}
function meets(card,f){return (card||[]).some(function(m){var s=m.sides||[];for(var x=0;x<s.length;x++)for(var y=0;y<s.length;y++){if(x===y)continue;if(s[x].some(function(id){return f.a.indexOf(id)>=0;})&&s[y].some(function(id){return f.b.indexOf(id)>=0;}))return true;}return false;});}
function winOwed(S,id){return (S.quests||[]).some(function(q){return q.type==='win'&&q.w===id;});}

/** Who could fill a spot on match i, side si (the first side with an empty place when si is left out). Best first, at most n.
    Each is {id, name, score, why:[{s, t}], other}: s is +1 or -1, other is true for somebody from another brand. */
E.fitsFor=function(S,card,i,si,n){
  card=card||S.card||[];var m=card[i],P=S.promos[S.player],show=S.queue[S.qi];if(!m||!show)return [];
  if(si==null){si=0;(m.sides||[]).some(function(s,k){if(s.some(function(id){return id==null;})){si=k;return true;}return false;});}
  var on=bookedIds(card),el=eligible(S,P,show),elIds={};el.forEach(function(w){elIds[w.id]=1;});
  // the other brand's people are offered too, flagged and marked down (Ryan's answer 4)
  var pool=el.concat(S.w.filter(function(w){return w.promo===P.id&&!elIds[w.id]&&w.inj<=0&&!w.camp&&!w.nw&&!(w.away>=S.week)&&show.brand&&!show.big&&w.brand!==show.brand;}));
  var mates=(m.sides[si]||[]).filter(function(id){return id!=null&&S.w[id];}),foes=[];
  (m.sides||[]).forEach(function(s,k){if(k!==si)s.forEach(function(id){if(id!=null&&S.w[id])foes.push(id);});});
  var others=mates.concat(foes),feuds=myFeuds(S);
  var out=pool.filter(function(w){return !on[w.id];}).map(function(w){
    var why=[],sc=E.overallOf?E.overallOf(w)/10:0,add=function(s,v,t){why.push({s:s,t:t});sc+=v;};
    foes.forEach(function(id){var f=feudOf(S,w.id,id);if(f)add(1,4,'In a feud with '+S.w[id].name+'.');});
    feuds.forEach(function(f){var mine=f.a.indexOf(w.id)>=0?f.b:(f.b.indexOf(w.id)>=0?f.a:null);if(!mine)return;
      if(mine.some(function(id){return foes.indexOf(id)>=0;}))return;
      add(-1,-1,'Their feud with '+names(S,mine)+' would wait.');});
    mates.forEach(function(id){var b=bondOf(S,w.id,id);if(b>=REL_ON)add(1,1.5,'Gets on with '+S.w[id].name+'.');else if(b<=-REL_ON)add(-1,-2,'Does not get on with '+S.w[id].name+'.');});
    if(foes.length&&foes.every(function(id){return S.w[id].align===w.align;})&&!foes.some(function(id){return feudOf(S,w.id,id);}))add(-1,-1,'Same side as '+names(S,foes)+': '+(w.align==='F'?'two faces':'two heels')+'.');
    if(mates.some(function(id){return S.w[id].align!==w.align;}))add(-1,-1,'A face and a heel on one side.');
    if(!P.ig&&others.some(function(id){return S.w[id].g!==w.g;}))add(-1,-4,'A mixed match.');
    if(w.cond<50)add(-1,-2,'Worn down.');
    if(w.morale<38)add(-1,-0.5,'Unhappy.');
    if(winOwed(S,w.id))add(1,2,'You promised them a win.');
    var other=!elIds[w.id];if(other)add(-1,-2,'Other brand.');
    return {id:w.id,name:w.name,score:Math.round(sc*10)/10,why:why,other:other};
  });
  out.sort(function(a,b){return b.score-a.score||(a.id<b.id?-1:1);});
  return out.slice(0,n||8);
};

/** What this card changes, as lines {kind, text, ids}. kind is on, half, promise, worn, unhappy, bp or title. */
E.cardKnock=function(S,card){
  card=card||S.card||[];var out=[],P=S.promos[S.player],on=bookedIds(card),add=function(k,t,ids){out.push({kind:k,text:t,ids:ids||[]});};
  myFeuds(S).forEach(function(f){var ids=f.a.concat(f.b);
    if(meets(card,f))add('on',names(S,f.a)+' and '+names(S,f.b)+' meet tonight. The story moves on.',ids);
    else if(ids.some(function(id){return on[id];}))add('half','Only one side of '+names(S,f.a)+' and '+names(S,f.b)+' is on the card.',ids);});
  (S.quests||[]).forEach(function(q){if(q.type!=='win'||!S.w[q.w])return;var w=S.w[q.w];
    var won=card.some(function(m){return m.call!=null&&m.call>=0&&m.sides[m.call]&&m.sides[m.call].indexOf(w.id)>=0;});
    if(!won)add('promise','You promised '+w.name+' a win by '+cal(q.due).label+(on[w.id]?'. Call the finish, or hope.':'. They are not on the card.'),[w.id]);});
  card.forEach(function(m){(m.sides||[]).forEach(function(s,si){s.forEach(function(id){var w=id!=null&&S.w[id];if(!w)return;
    if(w.cond<40)add('worn',w.name+' is worn down. A long match could hurt them.',[w.id]);
    if(w.morale<38&&m.call!=null&&m.call!==si)add('unhappy',w.name+' is unhappy. A loss here will be remembered.',[w.id]);});});
    if(m.title){var t=titleById(P,m.title);if(t)add('title','The '+t.name+' is on the line.',flat(m.sides).filter(function(id){return id!=null;}));}});
  var c=cardCost(S,card);if(c>0)add('bp','The finishes you called cost '+c+' booking power. You have '+S.bp+'.'+(c>S.bp?' The owner will notice the rest.':''),[]);
  return out;
};

/** Every running feud of yours that does not meet tonight, hottest first: {id, a, b, ids, heat, phase, stakes}. */
E.looseThreads=function(S,card){
  card=card||S.card||[];var on=bookedIds(card);
  return myFeuds(S).filter(function(f){return !meets(card,f);}).map(function(f){
    var ph=feudPhase(S,f),ids=f.a.concat(f.b),half=ids.some(function(id){return on[id];});
    var stakes=ph==='boil'?'Leave it off and it cools.':ph==='stale'?'It needs a twist or an ending.':ph==='spark'?'A first meeting would light it.':ph==='cool'?'It needs a night soon.':'A week off costs a little heat.';
    if(half)stakes='One side is booked tonight. '+stakes;
    return {id:f.id,a:names(S,f.a),b:names(S,f.b),ids:ids,heat:Math.round(f.heat||0),phase:PHASE_N[ph]||ph,stakes:stakes};
  }).sort(function(a,b){return b.heat-a.heat||(a.id<b.id?-1:1);});
};

/** Suggest's first press on the Clock Wall (Ryan's answer 6): fill the empty spots and the open time, keep what was booked. */
E.suggestGaps=function(S){
  var keep=(S.card||[]).map(function(m){return JSON.parse(JSON.stringify(m));}),full=E.suggestKeep(S);
  if(!keep.length){S.card=full;return S.card;}
  var used={};keep.forEach(function(m){m.sides.forEach(function(s){s.forEach(function(id){if(id!=null)used[id]=1;});});});
  var pool=[];full.forEach(function(m){flat(m.sides).forEach(function(id){if(id!=null&&!used[id])pool.push(id);});});
  keep.forEach(function(m){m.sides.forEach(function(s){s.forEach(function(id,p){if(id==null&&pool.length){var x=pool.shift();s[p]=x;used[x]=1;}});});});
  var extra=full.filter(function(m){return flat(m.sides).every(function(id){return id!=null&&!used[id];});});
  S.card=keep;E.fitShow(S,S.card);
  for(var k=0;k<extra.length;k++){var ck=E.clock(S);if(ck.total>=ck.budget-5)break;S.card.splice(S.card.length-1,0,extra[k]);E.fitShow(S,S.card);}
  return S.card;
};
