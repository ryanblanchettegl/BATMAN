/* ---------- how long a story runs (docs/plans/storylines.md, part 1) ----------
   Every feud has a length: short, medium or long. The length says where the story ends (f.pay, the week of its
   planned blow-off), how hot it can get, and what the ending is worth. A long story ends in
   chapters (f.ch, the weeks of the big events where a chapter closes; f.chd, how many have closed).
   The act a story is in comes from the calendar, not from heat: heat says how well it is going, the calendar says
   where it is. Old saves need nothing: feudPlan() fills in what is missing the first time a feud is looked at.
   Nothing here uses rnd(S). */
var FLEN={
  s:{n:'Short',cap:60,cost:1,lift:0.6,late:12,runs:'2 to 4 weeks'},
  m:{n:'Medium',cap:85,cost:2,lift:1,late:5,runs:'5 to 8 weeks'},
  l:{n:'Long',cap:100,cost:3,lift:1.6,late:3,runs:'12 to 24 weeks'}
};
function isBigWeek(w){return cal(w).wom===4;}
function bigWeeks(from,to){var L=[];for(var w=from;w<=to;w++)if(isBigWeek(w))L.push(w);return L;}
function nextBigFrom(w){while(!isBigWeek(w))w++;return w;}
/* the length a story gets when nobody chose one: a dream match runs short, anything else medium */
function feudLenAuto(f){return f.kind==='dream'?'s':'m';}
/* when a story of this length, starting in week st, should end */
function feudPayPlan(len,st){
  if(len==='s'){var b=bigWeeks(st+2,st+4);return {pay:b.length?b[0]:st+3};}
  if(len==='m')return {pay:nextBigFrom(st+5)};
  var L=bigWeeks(st+5,st+24),ch=L.length>=3?[L[0],L[Math.floor(L.length/2)],L[L.length-1]]:L;
  return {pay:ch[ch.length-1],ch:ch};
}
/** Give a feud its length and its ending if it has none. Safe to call any time. */
function feudPlan(S,f){
  if(!f||f.len)return f;
  f.len=feudLenAuto(f);
  var st=f.start==null?S.week:f.start,p=feudPayPlan(f.len,st);
  // an old feud whose ending would already be behind it ends at the next sensible point from today
  if(p.pay<=S.week)p=f.len==='s'?{pay:S.week+2}:{pay:nextBigFrom(S.week+1)};
  f.pay=p.pay;if(p.ch){f.ch=p.ch;f.chd=0;}
  return f;
}
/** Change a story's length. The ending is worked out again from the week it started (or from today if that has passed). */
function feudSetLen(S,f,len){
  if(!FLEN[len]||f.res)return false;
  f.len=len;delete f.ch;delete f.chd;delete f.slip;
  var p=feudPayPlan(len,f.start==null?S.week:f.start);
  if(p.pay<=S.week){p=feudPayPlan(len,S.week-(len==='l'?3:1));if(p.pay<=S.week)p={pay:len==='s'?S.week+2:nextBigFrom(S.week+1)};}
  if(p.ch)p.ch=p.ch.filter(function(w){return w>S.week;});
  f.pay=p.pay;if(p.ch&&p.ch.length){f.ch=p.ch;f.chd=0;}
  f.heat=Math.min(f.heat,FLEN[len].cap);
  return true;
}
/* the stretch of the story we are in: from s0 to e (its next ending), and whether it is the first stretch */
function feudSeg(S,f){
  feudPlan(S,f);
  if(f.len==='l'&&f.ch&&f.ch.length){var k=Math.min(f.chd||0,f.ch.length-1);return {s0:k?f.ch[k-1]:f.start,e:f.ch[k],first:!k,last:k===f.ch.length-1};}
  return {s0:f.start==null?S.week:f.start,e:f.pay,first:true,last:true};
}
/* the act, from the calendar. Short: Spark, then Blow-off in its last week. Medium and each chapter of a long one:
   the first third Spark (a later chapter skips it), then Escalation, then Twist, and the last week before the ending is Blow-off. */
function feudActCal(S,f){
  if(f.res)return 4;
  var g=feudSeg(S,f),d=g.e-S.week;
  if(d<=1)return 4;
  if(f.len==='s')return 1;
  var span=Math.max(1,g.e-1-g.s0),fr=(S.week-g.s0)/span;
  if(g.first)return fr<1/3?1:(fr<2/3?2:3);
  return fr<0.5?2:3;
}
/** Is this the night the story ends? 'end' for its blow-off, 'chapter' for a chapter of a long one, null if not yet. */
function feudDue(S,f,show){
  feudPlan(S,f);var big=!!(show&&show.big);
  if(f.len==='s')return S.week>=f.pay?'end':null;
  if(f.len==='l'&&f.ch&&f.ch.length){var k=f.chd||0;if(k>=f.ch.length)return big?'end':null;if(S.week>=f.ch[k]&&big)return k===f.ch.length-1?'end':'chapter';return null;}
  return S.week>=f.pay&&big?'end':null;
}
/* a chapter of a long story closes: the winner has the upper hand, the heat settles a little, the story goes on */
function closeChapter(S,P,show,f,winners,losers,isPl){
  f.chd=(f.chd||0)+1;(f.chw||(f.chw=[])).push(winners[0]?winners[0].id:null);
  f.finale=false;f.slip=0;f.heat=Math.max(35,Math.round(f.heat*0.75));f.last=S.week;
  winners.forEach(function(w){addOvr(P,w,1);w.mom=clamp(w.mom+1,-10,10);});losers.forEach(function(w){addOvr(P,w,0.5);});
  var left=f.ch.length-f.chd,msg='Chapter '+f.chd+' of '+feudLabel(S,f)+' goes to '+names(winners)+'. It is not over: '+left+' to go.';
  f.log.push({w:S.week,t:'Chapter '+f.chd+' went to '+names(winners)+' at '+show.name});if(f.log.length>16)f.log.shift();
  if(isPl){losers.forEach(function(l){winners.forEach(function(w){relBump(S,l.id,w.id,{bond:-3});});});
    losers.forEach(function(l){youRemember(S,l,'chapter','You gave '+names(winners)+' chapter '+f.chd+' of our story',-2);});
    winners.forEach(function(w){youRemember(S,w,'chapter','You gave me chapter '+f.chd+' against '+names(losers),2);});
    note(S,'Chapter '+f.chd+' is over',msg,'');}
  news(S,'story',msg);
  return msg;
}
/* what an ending is worth: the length's lift, more for a hot story and less for a cold one, less again if it came late. Used by settleFeud(). */
function feudPayMult(S,f){feudPlan(S,f);var m=FLEN[f.len].lift*clamp(f.heat/70,0.5,1.2);return S.week>f.pay?m*0.7:m;}
/* how hot a story of this length can get */
function feudHeatRoom(S,f,amt){feudPlan(S,f);return {amt:amt,cap:FLEN[f.len].cap};}
/* at the end of every week (before the week moves on): a story past its ending cools, a medium one gets one more big event, a long one with no twist tires */
WEEKX.push(function(S){
  activeFeuds(S).forEach(function(f){
    feudPlan(S,f);var L=FLEN[f.len];
    if(f.len==='l'&&f.ch&&f.chd<f.ch.length&&S.week>=f.ch[f.chd]){
      var lastCh=f.chd===f.ch.length-1;
      if(!f.slip){f.slip=1;var nx=nextBigFrom(S.week+1),sh=nx-f.ch[f.chd];for(var i=f.chd;i<f.ch.length;i++)f.ch[i]+=sh;f.pay=f.ch[f.ch.length-1];
        if(f.promo===S.player)news(S,'story','Chapter '+(f.chd+1)+' of '+feudLabel(S,f)+' missed its night. It moves to the next big event.');}
      else if(!lastCh){f.chd++;(f.chw||(f.chw=[])).push(null);f.slip=0;f.heat=Math.max(0,f.heat-10);   // missed twice: the chapter is lost and the story goes on without it
        if(f.promo===S.player)news(S,'story','Chapter '+f.chd+' of '+feudLabel(S,f)+' never happened. The crowd noticed.');}
      else f.heat=Math.max(0,f.heat-L.late);
    }else if(f.len==='m'&&S.week>=f.pay){
      if(!f.slip){f.slip=1;f.pay=nextBigFrom(S.week+1);if(f.promo===S.player)news(S,'story',feudLabel(S,f)+' missed its ending. It has one more big event before it cools.');}
      else f.heat=Math.max(0,f.heat-L.late);
    }else if(f.len==='s'&&S.week>=f.pay+1)f.heat=Math.max(0,f.heat-L.late);
    if(f.len==='l'&&S.week-Math.max(f.tww||0,f.start||0)>5)f.heat=Math.max(0,f.heat-2);
  });
});

/** Everything the screens need about a story's length and ending. */
E.feudPlan=function(S,f){
  feudPlan(S,f);var P=S.promos[f.promo]||S.promos[S.player],L=FLEN[f.len];
  var at=function(w){return isBigWeek(w)?P.name+' '+dbOf(S).events[cal(w).month]:(P.shows[0]?P.shows[0].name:'a weekly show');};
  return {len:f.len,n:L.n,runs:L.runs,cap:L.cap,pay:f.pay,in:f.pay-S.week,at:at(f.pay),late:S.week>f.pay,slip:!!f.slip,act:feudActCal(S,f),
    ch:f.ch?f.ch.map(function(w,i){return {w:w,at:at(w),done:i<(f.chd||0),won:f.chw&&f.chw[i]!=null&&S.w[f.chw[i]]?S.w[f.chw[i]].name:null};}):null};
};
E.feudSetLen=function(S,id,len){var f=S.feuds.filter(function(x){return x.id===id;})[0];return f?feudSetLen(S,f,len):false;};
E.FLEN=FLEN;
/** Start a story between two people (ids) with a length. Null if there is no room for another. */
E.startStory=function(S,a,b,len,why){var P=S.promos[S.player],A=S.w[a],B=S.w[b];if(!A||!B)return null;return startFeud(S,P,A,B,30,why||(A.name+' and '+B.name+' have a score to settle'),{force:true,len:len});};
/** Heat a story up (or down) by an amount, as a show would. For tests. */
E.heatStory=function(S,f,amt){heatUp(S,f,amt,null);return f.heat;};
