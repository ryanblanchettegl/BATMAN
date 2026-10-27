/* Moved from src/99-kayfabe.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, activeFeuds, cal, clamp, feudLabel, h01, rosterOf } from './00-core';
import { CRX, EVR, WEEKX } from './10-match';
import { pushEv } from './40-week';
import { bondOf, relBump, youRemember } from './66-relations';
import { hasRule } from './77-backstage';
$L.kfWord = kfWord; $L.kfInit = kfInit; $L.kfFind = kfFind; $L.kfLeakP = kfLeakP;
/* The kayfabe layer (the add-ons run, item 3). The public believes one thing; insiders know another. The game keeps
   the secrets that are true of your company (S.kf.sec): two people the crowd thinks are friends who really cannot stand
   each other, somebody whose contract runs out and who is leaving, and the ending planned for a big night. Each week a
   secret can leak: an unhappy person talks, a locker room that does not trust you is loose-lipped, and the longer a
   secret is kept the harder it is to keep. A leak reaches the dirt sheet and comes to the desk as a matter (deny it,
   work it into the story, or let it go). How well the business is protected (S.kf.prot, 0 to 100, said only in words)
   falls with every leak and mends slowly: a crowd that knows too much is harder to fool on the night, and the owner
   notices. Nothing here calls rnd(S): a leak is decided by a hash of the week and the secret. */
export var KF_WORDS=[[80,'Airtight: the public believes what it sees'],[60,'Mostly kept: a rumour here and there'],[40,'Leaking: the smart fans know more than they should'],[20,'Wide open: half the crowd reads the dirt sheet first'],[0,'Exposed: nothing on the show is a surprise any more']];
$L.KF_WORDS = KF_WORDS;
export function kfWord(p){for(var i=0;i<$L.KF_WORDS.length;i++)if(p>=$L.KF_WORDS[i][0])return $L.KF_WORDS[i][1];return $L.KF_WORDS[$L.KF_WORDS.length-1][1];}
export function kfInit(S){if(!S.kf)S.kf={sec:{},prot:75,leaks:[]};return S.kf;}
/** The secrets that are true this week, by key: {k, ids, t (what the public believes), real (what is true), since}. */
export function kfFind(S){
  var P=S.promos[S.player],out={},add=function(key,o){out[key]=o;};
  // partners on screen who really cannot stand each other
  (S.teams||[]).forEach(function(tm){if(tm.promo!==P.id||!tm.m||tm.m.length<2)return;var a=S.w[tm.m[0]],b=S.w[tm.m[1]];if(!a||!b)return;
    if(bondOf(S,a.id,b.id)<=-40)add('heat:'+a.id+'-'+b.id,{k:'heat',ids:[a.id,b.id],t:a.name+' and '+b.name+' are a team the crowd loves',real:a.name+' and '+b.name+' cannot stand each other in real life'});});
  // somebody leaving: a contract running out that has not been renewed
  rosterOf(S,P.id).forEach(function(w){if(!w.nw&&w.con>0&&w.con<=4&&w.ovr>=P.image-15)add('leave:'+w.id,{k:'leave',ids:[w.id],t:w.name+' is part of the future of '+P.name,real:w.name+'’s contract runs out in '+w.con+' weeks, and nothing is signed'});});
  // a star who smiles on television and is miserable in the locker room
  rosterOf(S,P.id).filter(function(w){return !w.nw&&w.ovr>=P.image-8;}).forEach(function(w){if(w.morale<38)add('unh:'+w.id,{k:'unh',ids:[w.id],t:w.name+' is happy in '+P.name,real:w.name+' is miserable and talking about leaving'});});
  // somebody working hurt: the public sees them every week and thinks nothing of it
  rosterOf(S,P.id).forEach(function(w){if(w.nw||w.inj>0)return;var z=E.zones(S,w.id).sort(function(a,b){return b.v-a.v;})[0];if(z&&z.v>=70&&w.ovr>=P.image-15)add('hurt:'+w.id,{k:'hurt',ids:[w.id],t:w.name+' is fit and ready',real:w.name+' is wrestling hurt: their '+z.n.toLowerCase()+(z.k==='n'||z.k==='b'?' is':' are')+' in a bad way'});});
  // the ending planned for a big night
  activeFeuds(S).forEach(function(f){if(f.promo!==P.id||!f.endAt||f.endAt<S.week)return;add('end:'+f.id,{k:'end',ids:f.a.concat(f.b),t:feudLabel(S,f)+' has a long way to run',real:feudLabel(S,f)+' is planned to end on '+cal(f.endAt).label});});
  return out;
}
/** The chance this week that a secret gets out: what helps and what hurts, as an attempt (rule 4). */
export function kfLeakP(S,s){
  var K=kfInit(S),age=S.week-(s.since||S.week),p=0.03+Math.min(0.08,age*0.006);
  s.ids.forEach(function(id){var w=S.w[id];if(w&&w.morale<35)p+=0.05;});
  if((S.trust||50)<40)p+=0.04;if(hasRule(S,'kayfabe'))p-=0.03;
  return clamp(p,0.01,0.3);
}
/* each week: keep the list of secrets, and see whether one gets out */
WEEKX.push(function(S){
  if(S.cal||S.over)return;var K=kfInit(S),now=kfFind(S),leaked=null;
  Object.keys(K.sec).forEach(function(k){if(!now[k])delete K.sec[k];});
  Object.keys(now).forEach(function(k){if(!K.sec[k]){now[k].since=S.week;K.sec[k]=now[k];}else{K.sec[k].real=now[k].real;}});
  Object.keys(K.sec).sort().forEach(function(k){var s=K.sec[k];if(leaked||s.out)return;if(h01(S.seed+':kf:'+S.week+':'+k)<$L.kfLeakP(S,s))leaked=s;});
  K.prot=clamp(K.prot+(leaked?-12:1),0,100);
  if(!leaked)return;
  leaked.out=S.week;var who=leaked.ids.map(function(id){return S.w[id];}).filter(Boolean);
  K.leaks.unshift({w:S.week,k:leaked.k,t:leaked.real});if(K.leaks.length>12)K.leaks.length=12;
  $L.news(S,'world','RUMOUR: '+leaked.real+'. The office has not commented.');
  who.forEach(function(w){youRemember(S,w,'leak','What was said about them reached the dirt sheet.',-1);});
  if(!S.owner.me)S.owner.trust=clamp(S.owner.trust-1,0,100);
  pushEv(S,{type:'leak',key:leaked.k,ids:leaked.ids,text:'It got out. The dirt sheet says: '+leaked.real+'. Until now the public believed: '+leaked.t+'.',
    choices:['Deny it, loudly','Work it into the story','Let it go']});
  $L.note(S,'A secret got out',leaked.real+'.','bad');
});
EVR.leak=function(S,ev,choice,P){
  var K=kfInit(S),who=(ev.ids||[]).map(function(id){return S.w[id];}).filter(Boolean),n=who.map(function(w){return w.name;}).join(' and ');
  if(choice===0){var ok=h01(S.seed+':kfd:'+ev.id)<0.5;if(ok){K.prot=clamp(K.prot+8,0,100);return 'You deny it on every channel. Most people believe you. The secret is safer than it was.';}
    K.prot=clamp(K.prot-5,0,100);if(!S.owner.me)S.owner.trust=clamp(S.owner.trust-2,0,100);return 'You deny it, and then it turns out to be true in front of everybody. That costs more than the leak did.';}
  if(choice===1){who.forEach(function(w){youRemember(S,w,'leakstory','You turned the rumour about them into a story.',ev.key==='heat'?1:0);});
    if(ev.key==='heat'&&who.length===2){relBump(S,who[0].id,who[1].id,{bond:-5},{k:'leakstory',t:'The rumour became the story.'});}
    K.prot=clamp(K.prot+3,0,100);return 'The rumour becomes the angle: '+n+(who.length>1?' are':' is')+' written into a story about it. The smart fans feel clever, and the rest never knew.';}
  return 'You say nothing. It fades in a week or two, and so does a little of the mystery.';
};
/* a crowd that knows too much is harder to fool */
CRX.push(function(ctx){if(!ctx.isPl||!ctx.S.kf)return null;var p=ctx.S.kf.prot;return p<40?{d:-1,x:'A crowd that reads the dirt sheet saw it coming'}:null;});
/** For the screens: how well the business keeps its secrets, what is being kept, and what got out. */
E.kayfabe=function(S){
  var K=kfInit(S),sec=Object.keys(K.sec).map(function(k){return K.sec[k];}).filter(function(s){return !s.out;});
  return {prot:K.prot,word:kfWord(K.prot),kept:sec.map(function(s){return {k:s.k,t:s.t,real:s.real,since:s.since,risk:Math.round($L.kfLeakP(S,s)*100)};}),leaks:K.leaks.slice(0,6).map(function(l){return {w:l.w,when:cal(l.w).label,t:l.t};}),
    line:sec.length?sec.length+' '+(sec.length===1?'secret':'secrets')+' kept. '+kfWord(K.prot)+'.':kfWord(K.prot)+'.'};
};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.KF_WORDS = KF_WORDS;
$L.kfWord = kfWord;
$L.kfInit = kfInit;
$L.kfFind = kfFind;
$L.kfLeakP = kfLeakP;
