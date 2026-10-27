/* Moved from src/76-friends.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { clamp, feudOf, rkey, startFeud, titleById } from './00-core';
import { EVR, WEEKX } from './10-match';
import { pushEv } from './40-week';
import { REL_ON, bondOf, relBump, youRemember } from './66-relations';
import { rankFor } from './70-season';
/* ---------- friends on a collision course ----------
   A friend of the champion is now the top challenger for their title. It reaches the desk once a pair: a
   respectful title match between friends, let it turn sour, or keep them apart for now. Reads the relationship matrix
   and the title rankings; every answer goes through relBump() and youRemember(). */
WEEKX.push(function(S){
  if(S.cal||S.over||S.week<6)return;
  var P=S.promos[S.player],t=$L.momTop(P);if(!t||t.holders.length!==1)return;
  var c=S.w[t.holders[0]];if(!c||c.promo!==P.id)return;
  var top=rankFor(S,P,t,2).filter(function(x){return x.id!==c.id&&x.promo===P.id&&!x.nw&&x.inj<=0;})[0];
  if(!top||bondOf(S,c.id,top.id)<REL_ON||feudOf(S,c.id,top.id))return;
  var k='fr'+rkey(c.id,top.id),L=S.lcd||(S.lcd={});if((L[k]&&S.week<L[k])||(L.frAny&&S.week<L.frAny))return;L[k]=S.week+48;L.frAny=S.week+12;
  pushEv(S,{type:'friends',w:top.id,o:c.id,title:t.id,text:c.name+' holds the '+t.name+'. The next in line is '+top.name+', a friend of theirs. Everyone backstage is waiting to see what you do with it.',
    choices:['A title match between friends, done with respect','Let it turn sour','Keep them apart for now']});
});
EVR.friends=function(S,ev,choice,P,w,o){
  var f=w,c=o,t=titleById(P,ev.title);if(!f||!c||f.promo!==P.id||c.promo!==P.id||!t)return 'Things have changed since. The moment has passed.';
  if(choice===0){
    f.shot=t.id;f.pts=(f.pts||0)+2;
    relBump(S,c.id,f.id,{ra:10,rb:10},{k:'friends',keep:true,t:c.name+' and '+f.name+' agreed to fight for the '+t.name+' and stay friends.'});
    youRemember(S,f,'shot','You gave them their title shot against a friend, and let them keep the friendship.',5);youRemember(S,c,'shot','You trusted them to fight a friend for the title the right way.',3);
    return 'Friends, for one night opponents. '+f.name+' gets the shot, and the crowd will respect both of them for how it is done.';
  }
  if(choice===1){
    f.shot=t.id;var nf=startFeud(S,P,f,c,50,f.name+' wants the '+t.name+' more than the friendship',{title:t.id});
    relBump(S,c.id,f.id,{bond:-35},{k:'friends',by:f.id,keep:true,t:f.name+' decided the '+t.name+' mattered more than their friendship with '+c.name+'.'});
    youRemember(S,f,'story','You gave them the title shot, and a reason to stop being friends.',2);youRemember(S,c,'story','You let a friendship go sour for a title story.',-3);
    return nf?'The friendship cracks. '+f.name+' wants the title more, and '+c.name+' knows it.':'It cracks, but the office has too many feuds to make it official. The two of them know.';
  }
  f.morale=clamp(f.morale-5,0,100);youRemember(S,f,'keptoff','You kept them away from the title because their friend holds it.',-5);
  return 'You keep them apart. '+f.name+' understands. They do not like it.';
};
