/* Moved from src/99-tonight.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, activeFeuds, clamp, feudLabel, flat, h01 } from './00-core';
import { faceOf } from './32-direction';
import { fogSkill } from './99-fog';
/* What could happen tonight (roadmap 7, Ryan 16 October). A window on Book the show with four parts: moments that could
   happen, who is at risk, what the card sets up and what it leaves cold, and one gut line from the road agent. All of it
   is what can be seen from the card and the roster, in words: it never says what will happen (fog of war, src/99-fog.js).
   It only reads the game. */
E.couldHappen=function(S){
  var P=S.promos[S.player],show=S.queue&&S.queue[S.qi],card=(S.card||[]).filter(function(m){return m&&m.sides&&flat(m.sides).every(function(id){return id!=null&&S.w[id];});});
  var out={moments:[],risk:[],sets:[],cold:[],gut:''};if(!show)return out;
  var nm=function(id){return S.w[id].name;},on={},seen={};
  card.forEach(function(m){flat(m.sides).forEach(function(id){on[id]=1;});});
  card.forEach(function(m,i){
    var t=m.title?P.titles.filter(function(x){return x.id===m.title;})[0]:null,f=E.matchFeud(S,m);
    if(t)out.moments.push(t.holders.length?'The '+t.name+' could change hands.':'Somebody walks out with the vacant '+t.name+'.');
    if(f&&f.heat>=60)out.moments.push(feudLabel(S,f)+' could boil over.');
    if(m.mt==='br'&&m.shot)out.moments.push('Somebody leaves the battle royal with a title shot.');
    if(m.mt==='br'&&m.surp)out.moments.push('A face from outside could walk through the curtain.');
    if(m.int==='brutal'||m.stip==='ladder'||m.stip==='cage'||m.stip==='cell')flat(m.sides).forEach(function(id){var w=S.w[id];if(w.cond<65&&!seen[id]){seen[id]=1;out.risk.push(w.name+' is worn, in a match that hurts.');}});
    if(f)out.sets.push(m.end?feudLabel(S,f)+' ends here: the next story starts from what happens.':feudLabel(S,f)+' moves on.');
    if(m.title&&i<card.length-1)out.sets.push('A title match below the main event: a new champion would need a story.');
  });
  Object.keys(on).forEach(function(id){var w=S.w[id];if(seen[id])return;
    if(w.cond<50){seen[id]=1;out.risk.push(w.name+' is running on fumes.');}
    else if(w.morale<38){seen[id]=1;out.risk.push(w.name+' is unhappy and could make a scene.');}});
  if(card.length>=3){var lows=card.filter(function(m){return flat(m.sides).every(function(id){return S.w[id].ovr<55;});}).length;
    if(lows>=Math.ceil(card.length/2))out.moments.push('The crowd could turn on a card without names on it.');}
  activeFeuds(S).filter(function(f){return f.promo===P.id&&f.heat>=50&&!f.a.concat(f.b).some(function(id){return on[id];});}).slice(0,2)
    .forEach(function(f){out.cold.push(feudLabel(S,f)+' is hot and not on the show.');});
  var fw=faceOf(S);if(fw&&card.length&&!on[fw.id])out.cold.push(fw.name+', the face of the company, sits this one out.');
  // the gut line: the agent's feel for the whole card, said plainly; a weaker agent says less
  var A=E.fogInfo?E.fogInfo(S):null,who=A&&A.head?A.head:'Your road agent',sharp=h01(S.seed+':gut:'+S.week+':'+card.length)<clamp(0.4+fogSkill(S),0.1,0.95);
  var good=out.sets.length+out.moments.length,bad=out.risk.length+out.cold.length;
  if(!card.length)out.gut='';
  else if(!sharp)out.gut=who+': "Hard to say. We will know when the bell rings."';
  else if(bad>good+1)out.gut=who+': "I do not like the feel of this one. Too much could go wrong."';
  else if(good>=bad+3)out.gut=who+': "This one has a chance to be special."';
  else out.gut=who+': "Solid on paper. It comes down to the people in the ring."';
  ['moments','risk','sets','cold'].forEach(function(k){out[k]=out[k].slice(0,4);});
  return out;
};
