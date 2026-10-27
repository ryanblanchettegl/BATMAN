// @ts-nocheck
/* Moved from src/99-staff.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.staffTag = staffTag; $L.staffVoice = staffVoice; $L.staffUnvoice = staffUnvoice; $L.toStaffOk = toStaffOk;
/* wraps: 85-second.js, 93-segments.js (it must sort after them; test-buildorder.js checks) */
/* Create staff (Ryan, 20 October: "we also need to have create staff for referees and commentators, authority
   figures, where wrestlers can easily be ported in"). Staff are people on your books who do not wrestle (w.nw) with a
   job (w.srole). They used to come only from second careers. Now:
     - Create staff makes a new one straight onto your books: a name, a job and how seasoned they are.
     - Move to staff takes a wrestler off the card and gives them a job; Back to wrestling undoes it.
     - Two new jobs join the five of second careers: the referee and the interviewer. The on-screen boss is the
       authority figure.
   Every job carries the tag scenes look for (E.sceneHooks): a referee of yours works the scenes, the interviewer
   holds the microphone, the boss is the authority. A commentator also takes a seat in the pool for the commentary
   desk (S.voices), paid by their contract, so they can be put in a chair like a hired voice.
   What it hands on (rule 7a): a wrestler moved to staff remembers how it was done (youRemember), and the desk and the
   scenes change with who is on the books. No rnd(S): the choices here are the player's. */
$L.SROLES.referee={n:'Referee',skill:function(w){return ((w.cons||60)+(w.safe||55))/2;},d:'Keeps the matches safe and on time: the action lands a little cleaner, and they work the scenes as the official.'};
$L.SROLES.interviewer={n:'Interviewer',skill:function(w){return ((w.mic||50)+(w.cha||50))/2;},d:'Holds the microphone backstage: promos read a little better, and they are the face of the interviews.'};
$L.E.SROLES=Object.keys($L.SROLES).map(function(k){return {id:k,n:$L.SROLES[k].n,d:$L.SROLES[k].d};});
/* the tag each job carries, the one scenes and the editor read (src/86-scenes.js, ROLES in src/85-universe.js) */
export var STAFF_TAG={agent:'road_agent',trainer:'trainer',commentator:'announcer',manager:'manager',boss:'booker',referee:'referee',interviewer:'interviewer'};
$L.STAFF_TAG = STAFF_TAG;
/* how seasoned a new hire is: their skill at the job, and what a week of it costs */
export var STAFF_LVL={rookie:{n:'Green',s:52,wage:400},solid:{n:'Solid',s:66,wage:900},veteran:{n:'Veteran',s:80,wage:1800}};
$L.STAFF_LVL = STAFF_LVL;
$L.E.STAFF_LVL=Object.keys(STAFF_LVL).map(function(k){return {id:k,n:$L.STAFF_LVL[k].n,wage:$L.STAFF_LVL[k].wage};});
export function staffTag(w,k){w.roles=[$L.STAFF_TAG[k]||k];}
/* a commentator gets a seat in the pool for the desk, paid by their contract rather than as a hired voice */
export function staffVoice(S,w){
  if(w.srole!=='commentator')return;S.voices=S.voices||[];
  if(S.voices.some(function(v){return v.wid===w.id;}))return;
  var st=['hot','dry','warm'][$L.hash(w.name+'vs')%3];
  S.voices.push({id:S.nid++,name:w.name,g:w.g,pbp:$L.clamp(Math.round(w.mic||50),30,95),col:$L.clamp(Math.round(w.cha||w.mic||50),30,95),style:st,wage:0,hired:null,added:S.week,wid:w.id});
}
export function staffUnvoice(S,w){
  var P=S.promos[S.player],L=S.voices||[];
  L.filter(function(v){return v.wid===w.id;}).forEach(function(v){if(P&&P.desk){['pbp','col'].forEach(function(k){if(P.desk[k]===v.id)P.desk[k]=null;});}});
  S.voices=L.filter(function(v){return v.wid!==w.id;});
}
/* second careers carry the tag too, and a commentator from one gets a seat at the desk */
(function(){
  var sc=$L.EVR.secondcareer;
  $L.EVR.secondcareer=function(S,ev,choice,P,w){var r=sc.apply(this,arguments);if(w&&w.srole){$L.staffTag(w,w.srole);$L.staffVoice(S,w);}return r;};
})();
/** Make a new member of staff straight onto your books: {name, g, role, lvl}. */
$L.E.createStaff=function(S,o){
  o=o||{};var P=S.promos[S.player],k=o.role,L=$L.STAFF_LVL[o.lvl]||$L.STAFF_LVL.solid;
  if(!$L.SROLES[k])return {ok:false,msg:'Pick a job for them.'};
  var name=$L.clean(o.name,28);if(name.length<2)return {ok:false,msg:'Give them a name first.'};
  if(S.w.some(function(w){return w.name.toLowerCase()===name.toLowerCase();}))return {ok:false,msg:'There is already a '+name+' in the business.'};
  var s=L.s,ovr=k==='boss'?$L.clamp(s-10,20,80):(k==='referee'?20:$L.clamp(s-30,15,60));
  var w=$L.addWrestler(S,{name:name,g:o.g==='F'?'F':'M',ovr:ovr,style:'A',work:$L.clamp(s-25,20,70),mic:k==='referee'?$L.clamp(s-20,20,70):s,align:o.align==='H'?'H':'F',cons:k==='referee'?s+6:s,safe:k==='referee'?s+6:s,cha:s},P.id,null);
  w.nw=true;w.srole=k;$L.staffTag(w,k);w.wage=L.wage;w.con=48;w.morale=80;w.cr=true;w.age=$L.clamp(+o.age||(k==='referee'?34:40),18,75);
  if(o.look){var lc=$L.lookClean(o.look);if(lc&&$L.E.lookOk(lc)){lc.name=w.name;w.look=lc;}}
  $L.staffVoice(S,w);
  $L.news(S,'contract',P.name+' hires '+name+' as '+$L.SROLES[k].n.toLowerCase()+'.');
  return {ok:true,id:w.id,msg:name+' joins the staff as '+$L.SROLES[k].n.toLowerCase()+' at '+$L.money(L.wage)+' a week. '+$L.SROLES[k].d};
};
/** Can this wrestler of yours move to staff? {ok, why}. */
export function toStaffOk(S,w){
  var P=S.promos[S.player];
  if(!w||w.promo!==P.id)return {ok:false,why:'They are not on your books.'};
  if(w.nw)return {ok:false,why:'They are on the staff already.'};
  if(P.titles.some(function(t){return t.holders.indexOf(w.id)>=0;}))return {ok:false,why:'They hold a title. Get the belt off them first.'};
  if((S.feuds||[]).some(function(f){return !f.res&&f.promo===P.id&&f.a.concat(f.b).indexOf(w.id)>=0;}))return {ok:false,why:'They are in a story. End it first.'};
  if(w.team!=null||(S.teams||[]).some(function(t){return t.promo===P.id&&!t.dead&&t.m&&t.m.indexOf(w.id)>=0;}))return {ok:false,why:'They are in a tag team. Break it up first.'};
  if(S.card&&S.card.some(function(m){return m&&m.sides&&$L.flat(m.sides).indexOf(w.id)>=0;}))return {ok:false,why:'They are on this week’s card. Take them off it first.'};
  return {ok:true};
}
$L.E.toStaffOk=function(S,id){return $L.toStaffOk(S,S.w[id]);};
/** Move a wrestler of yours to staff, in a job: they stop wrestling, keep their deal, and remember how it was done. */
$L.E.toStaff=function(S,id,k){
  var w=S.w[id],ok=$L.toStaffOk(S,w);if(!ok.ok)return {ok:false,msg:ok.why};
  if(!$L.SROLES[k])return {ok:false,msg:'Pick a job for them.'};
  w.nw=true;w.srole=k;w.wasW=1;$L.staffTag(w,k);$L.staffVoice(S,w);
  var keen=$L.SROLES[k].skill(w)>=60||w.age>=36;
  $L.youRemember(S,w,'staff',keen?'You found them a job when the ring was getting harder':'You took them off the card and gave them a desk job',keen?4:-6);
  w.morale=$L.clamp(w.morale+(keen?4:-8),0,100);
  $L.note(S,'Staff',w.name+' moves to '+$L.SROLES[k].n.toLowerCase()+(keen?'. They are glad of it.':'. They wanted to wrestle.'),keen?'good':'bad');
  $L.news(S,'contract',w.name+' steps away from the ring to become '+S.promos[S.player].name+'’s '+$L.SROLES[k].n.toLowerCase()+'.');
  return {ok:true,msg:w.name+' is your '+$L.SROLES[k].n.toLowerCase()+' now. '+$L.SROLES[k].d+(keen?'':' They are not happy about leaving the ring.')};
};
/** Bring somebody who used to wrestle back to the ring. */
$L.E.fromStaff=function(S,id){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id||!w.nw)return {ok:false,msg:'They are not on the staff.'};
  if(!w.wasW)return {ok:false,msg:w.name+' has never wrestled.'};
  $L.staffUnvoice(S,w);w.nw=false;delete w.srole;delete w.wasW;w.roles=null;delete w.roles;
  $L.youRemember(S,w,'staff','You gave them their spot in the ring back',5);w.morale=$L.clamp(w.morale+6,0,100);
  $L.note(S,'Staff',w.name+' is back on the active roster.','good');
  return {ok:true,msg:w.name+' is back on the active roster.'};
};
/** Everybody on your staff, with the job and what it does. */
$L.E.staffList=function(S){
  var TAGN={announcer:'Commentator',referee:'Referee',owner:'Owner',booker:'Booker',manager:'Manager',road_agent:'Road agent',interviewer:'Interviewer',trainer:'Trainer'};
  return $L.rosterOf(S,S.player).filter(function(w){return w.nw&&!w.rt;}).map(function(w){var k=w.srole,R=$L.SROLES[k],tg=w.roles&&w.roles[0];
    return {id:w.id,name:w.name,role:R?R.n:(TAGN[tg]||'Staff'),k:k||null,d:R?R.d:'',skill:R?Math.round(R.skill(w)):null,wage:w.wage,back:!!w.wasW,
      desk:(S.voices||[]).some(function(v){return v.wid===w.id&&v.hired;})};});
};
/* the new jobs do something: a referee keeps the action clean, an interviewer lifts the talking */
$L.CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var S=ctx.S,r=$L.staffOf(S,'referee').sort(function(a,b){return $L.SROLES.referee.skill(b)-$L.SROLES.referee.skill(a);})[0];
  if(!r)return null;var sk=$L.SROLES.referee.skill(r);if(sk<60)return null;
  return {d:$L.clamp((sk-60)/40,0,0.5),x:r.name+' kept the match clean'};
});
/* a promo of yours reads a little better with a good interviewer holding the microphone */
(function(){
  var sm=$L.segMean;
  $L.segMean=function(S,w,bonus){var v=sm.apply(this,arguments);if(!w||w.promo!==S.player||S.cal)return v;
    var iv=$L.staffOf(S,'interviewer').map(function(x){return $L.SROLES.interviewer.skill(x);}).sort(function(a,b){return b-a;})[0];
    return iv>=60?v+$L.clamp((iv-60)/8,0,2.5):v;};
})();
/** How good this person would be at a job, 0 to 100 (for the Move to staff pop-up). */
$L.E.staffSkill=function(S,id,k){var w=S.w[id];return w&&$L.SROLES[k]?$L.SROLES[k].skill(w):0;};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.STAFF_TAG = STAFF_TAG;
$L.STAFF_LVL = STAFF_LVL;
$L.staffTag = staffTag;
$L.staffVoice = staffVoice;
$L.staffUnvoice = staffUnvoice;
$L.toStaffOk = toStaffOk;
