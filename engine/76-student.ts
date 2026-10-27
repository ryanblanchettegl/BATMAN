/* Moved from src/76-student.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { clamp, rosterOf, startFeud } from './00-core';
import { EVR, WEEKX } from './10-match';
import { pushEv } from './40-week';
import { bondOf, relBump, youRemember } from './66-relations';
/* ---------- the student passes the teacher ----------
   When somebody a wrestler trained becomes more over than they are, it reaches the booker's desk once: have the teacher
   put the student over, leave it alone (the teacher notices, and it feeds their jealousy), or make it a story, teacher
   against student. Reads the training tree kept in src/76-locker.js (w.coach). Every answer goes through relBump() and
   youRemember(), so both of them remember it. */
WEEKX.push(function(S){
  if(S.cal||S.over||S.week<4)return;
  var P=S.promos[S.player],R=rosterOf(S,P.id),done=false;
  R.forEach(function(w){
    if(done||w.nw||w.passed!=null||w.coach==null)return;
    var m=S.w[w.coach];if(!m||m.promo!==P.id||m.rt||m.nw||w.ovr<m.ovr+3)return;
    w.passed=S.week;done=true;
    pushEv(S,{type:'passed',w:w.id,o:m.id,text:m.name+' trained '+w.name+'. Now the crowd cares more about the student than the teacher, and '+m.name+' has noticed. What do you do with it?',
      choices:['Have '+m.name+' put '+w.name+' over','Leave it alone','Make it a story: teacher against student']});
  });
});
EVR.passed=function(S,ev,choice,P,w,o){
  var m=o;if(!w||!m||w.promo!==P.id||m.promo!==P.id)return 'One of them is no longer with the company.';
  var proud=m.morale>=60||bondOf(S,m.id,w.id)>=30;
  if(choice===0){
    w.mom=clamp((w.mom||0)+2,-10,10);w.pts=(w.pts||0)+3;
    relBump(S,m.id,w.id,proud?{bond:8,ra:15}:{bond:-6,ja:15},{k:'passed',by:w.id,keep:true,t:proud?m.name+' lay down for their own student, '+w.name+', and was proud to.':m.name+' was told to make their own student, '+w.name+', look like a star.'});
    youRemember(S,m,'putover',proud?'You asked them to hand the torch to their student, and they were glad to.':'You asked them to lie down for their own student.',proud?4:-8);
    youRemember(S,w,'putover','You had their teacher make them look like a star.',6);
    return proud?m.name+' is happy to do it. The student has the teacher’s blessing, and the crowd can tell.':m.name+' will do it, but not with a smile. '+w.name+' has momentum. '+m.name+' has a grudge.';
  }
  if(choice===1){
    relBump(S,m.id,w.id,{ja:20},{k:'passed',by:w.id,t:m.name+' watched their own student pass them by.'});
    return 'You leave it. '+m.name+' says nothing, which is not the same as being fine with it.';
  }
  var f=startFeud(S,P,m,w,40,'The teacher against the student: '+m.name+' and '+w.name);
  relBump(S,m.id,w.id,{bond:-15},{k:'passed',by:w.id,keep:true,t:m.name+' and '+w.name+' went from teacher and student to rivals.'});
  youRemember(S,m,'story','You gave them a story with their own student at the heart of it.',3);
  youRemember(S,w,'story','You put them against the one who trained them.',3);
  return f?'The teacher against the student. Everything '+m.name+' taught, '+w.name+' will use against them.':'The office has too many feuds running to make it official, but the two of them know.';
};
