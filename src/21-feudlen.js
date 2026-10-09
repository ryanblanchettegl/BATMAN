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
  // a medium story nobody planned does not pile onto a night that already has three endings: it runs to the next one
  if(f.len==='m'){var full=function(w){return activeFeuds(S).filter(function(x){return x!==f&&x.promo===f.promo&&x.pay===w;}).length>=3;};var g=0;while(full(p.pay)&&g++<2)p={pay:nextBigFrom(p.pay+1)};}
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
function feudSeg(S,f,w){
  feudPlan(S,f);if(w==null)w=S.week;
  if(f.len==='l'&&f.ch&&f.ch.length){
    // chapters ahead are taken to close on their nights; the ones already closed are counted as closed
    var k=f.chd||0;while(k<f.ch.length-1&&f.ch[k]<w&&w>S.week)k++;k=Math.min(k,f.ch.length-1);
    return {s0:k?f.ch[k-1]:f.start,e:f.ch[k],first:!k,last:k===f.ch.length-1,k:k};}
  return {s0:f.start==null?S.week:f.start,e:f.pay,first:true,last:true,k:0};
}
/* the act in week w (today if left out), from the calendar. Short: Spark, then Blow-off in its last week. Medium and
   each chapter of a long one: the first third Spark (a later chapter skips it), then Escalation, then Twist, and the
   last week before the ending is Blow-off. */
function feudActAt(S,f,w){
  if(f.res)return 4;if(w==null)w=S.week;
  var g=feudSeg(S,f,w),d=g.e-w;
  if(d<=1)return 4;
  if(f.len==='s')return 1;
  var span=Math.max(1,g.e-1-g.s0),fr=(w-g.s0)/span;
  if(g.first)return fr<1/3?1:(fr<2/3?2:3);
  return fr<0.5?2:3;
}
function feudActCal(S,f){return feudActAt(S,f,S.week);}
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

/* ---------- Start a story (docs/plans/storylines.md, step 2) ----------
   The player picks two people and a length, and pays for it in booking power: short 1, medium 2, long 3.
   storyPreview() says everything the pop-up shows before anything is spent; storyStart() does it. */
var FLEN_GOOD={s:'A challenger for a month. It cannot carry a big main event.',m:'Four acts and a blow-off at the big event.',l:'The story of the year. A twist in every chapter.'};
var FLEN_CAPW={s:'Hot',m:'White hot',l:'As far as it goes'};
function storyEnding(S,len){
  var p=feudPayPlan(len,S.week);
  if(p.pay<=S.week)p={pay:len==='s'?S.week+2:nextBigFrom(S.week+1)};
  return p;
}
/** Who can be put in a story: everybody on your roster who is not brand new. Hurt people are listed and marked. */
E.storyPeople=function(S){
  var P=S.promos[S.player];
  return rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt;}).sort(function(a,b){return b.ovr-a.ovr;})
    .map(function(w){var n=feudsFor(S,w.id).length;return {id:w.id,name:w.name,g:w.g,al:w.align,hurt:w.inj>0,n:n};});
};
/** Everything the Start a story pop-up shows for two people, before anything is spent. */
E.storyPreview=function(S,a,b){
  var P=S.promos[S.player],A=S.w[a],B=S.w[b],stop=[],warn=[];
  if(!A||!B)return {ok:false,stop:['Pick two people.'],lens:[]};
  if(A.id===B.id)stop.push('A story needs two people.');
  if(A.promo!==P.id||B.promo!==P.id)stop.push('Both have to be on your roster.');
  if(A.g!==B.g)stop.push('They would never meet in the ring: a story needs two who can wrestle each other.');
  if(feudOf(S,A.id,B.id))stop.push('They are already in a story together. Its card on this page says where it ends.');
  [A,B].forEach(function(w){
    if(w.inj>0)warn.push(w.name+' is hurt for '+w.inj+' more '+(w.inj===1?'week':'weeks')+'. The story can start without them in the ring.');
    feudsFor(S,w.id).forEach(function(f){warn.push(w.name+' is already in '+feudLabel(S,f)+'. Two stories at once split the crowd.');});
  });
  if(A.align===B.align)warn.push('Both are '+(A.align==='F'?'heroes':'villains')+'. The crowd will need a reason to pick a side.');
  var bd=bondOf(S,A.id,B.id);if(bd<=-REL_STRONG)warn.push('They really do not like each other. The crowd will feel it, and it can get stiff in the ring.');
  // what the office knows about them together
  var hh=S.h2h&&S.h2h[rkey(A.id,B.id)],lo=Math.min(A.id,B.id),know=[];
  if(hh&&hh.n){var aw=A.id===lo?hh.a:hh.b,bw=A.id===lo?hh.b:hh.a;know.push('They have met '+hh.n+' '+(hh.n===1?'time':'times')+' on your shows: '+A.name+' '+aw+', '+B.name+' '+bw+'.');}
  else know.push('They have not met on your shows.');
  var K=S.know||KNOW0,key=rkey(A.id,B.id),ch=chem(S,A.id,B.id),agent=P.staff&&P.staff.agent?P.staff.agent:'The road agent',read;
  if(K.p[key])read=ch>=2.2?'They have real chemistry. We have seen it.':(ch<=-2.2?'They do not click. We have seen it. Keep their matches short.':'Nothing special between them in the ring, and nothing wrong.');
  else if(h01(S.seed+':st:'+S.week+':'+key)<clamp(0.3+fogSkill(S),0.05,0.95))read=ch>=2.2?'My read: these two will click.':(ch<=-2.2?'My read: these two will not click.':'My read: no sparks, and no trouble either.');
  else read='I have not seen them together. I cannot tell you yet.';
  var lens=['s','m','l'].map(function(k){var L=FLEN[k],p=storyEnding(S,k),at=function(w){return isBigWeek(w)?P.name+' '+dbOf(S).events[cal(w).month]:(P.shows[0]?P.shows[0].name:'a weekly show');};
    var atS=function(w){return isBigWeek(w)?dbOf(S).events[cal(w).month]:(P.shows[0]?P.shows[0].name:'a weekly show');};
    return {len:k,n:L.n,runs:L.runs,cost:L.cost,can:S.bp>=L.cost,cap:FLEN_CAPW[k],good:FLEN_GOOD[k],pay:p.pay,in:p.pay-S.week,at:at(p.pay),atS:atS(p.pay),
      ch:p.ch?p.ch.map(function(w){return {w:w,at:at(w),atS:atS(w),in:w-S.week};}):null};});
  return {ok:!stop.length,stop:stop,warn:warn,know:know,agent:agent,read:read,lens:lens,bp:S.bp,a:{id:A.id,name:A.name,al:A.align},b:{id:B.id,name:B.name,al:B.align}};
};
/** Start a story between two of your people, at a length, for its booking power. */
E.storyStart=function(S,a,b,len){
  var pv=E.storyPreview(S,a,b),L=FLEN[len],P=S.promos[S.player];
  if(!L)return {ok:false,msg:'Pick how long it runs.'};
  if(!pv.ok)return {ok:false,msg:pv.stop[0]};
  if(S.bp<L.cost)return {ok:false,msg:'A '+L.n.toLowerCase()+' story takes '+L.cost+' booking power. You have '+S.bp+'.'};
  var A=S.w[a],B=S.w[b],f=startFeud(S,P,A,B,len==='s'?28:22,'The office put '+A.name+' and '+B.name+' in a story',{force:true,len:len});
  if(!f)return {ok:false,msg:'The story could not start.'};
  S.bp-=L.cost;f.chose=1;
  var pl=E.feudPlan(S,f),big=len==='l'?6:(len==='m'?4:2);
  [A,B].forEach(function(w){var o=w===A?B:A;youRemember(S,w,'story','You gave me a '+L.n.toLowerCase()+' story against '+o.name+'.',big);});
  relBump(S,A.id,B.id,{ra:1,rb:1},{k:'story',t:'The office put them in a story together.',by:'you'});
  var msg=feudLabel(S,f)+' is a '+L.n.toLowerCase()+' story. '+(pl.ch?'Chapter 1 ends at '+pl.ch[0].at+', and it ends for good at '+pl.at+'.':'It ends at '+pl.at+', in '+pl.in+' '+(pl.in===1?'week':'weeks')+'.')+' ('+L.cost+' booking power.)';
  return {ok:true,msg:msg,id:f.id};
};

/* ---------- the season (docs/plans/storylines.md, step 3) ----------
   E.season(S): the next twelve weeks of every one of your stories, week by week, and what the calendar says about them.
   It only reads the game. */
var SEASON_N=12;
function seasonCells(S,f){
  feudPlan(S,f);var out=[],P=S.promos[f.promo];
  for(var i=0;i<SEASON_N;i++){
    var w=S.week+i,c={a:0,star:0};
    var end=f.pay;if(S.week>end&&i===0){c.a=4;c.late=1;out.push(c);continue;}
    if(w>end){out.push(c);continue;}
    c.a=feudActAt(S,f,w);
    if(f.ch&&f.ch.indexOf(w)>=0&&w!==f.pay&&f.ch.indexOf(w)>=(f.chd||0)){c.a=5;c.star=1;}
    else if(w===f.pay)c.star=1;
    out.push(c);
  }
  return out;
}
function bigShort(S,w){return dbOf(S).events[cal(w).month];}
E.season=function(S){
  var P=S.promos[S.player],weeks=[],L=activeFeuds(S).filter(function(f){return f.promo===P.id;});
  for(var i=0;i<SEASON_N;i++){var w=S.week+i,c=cal(w);weeks.push({w:w,wom:c.wom,month:MONTHS[c.month],big:isBigWeek(w),ev:isBigWeek(w)?bigShort(S,w):null});}
  L.forEach(function(f){feudPlan(S,f);});
  L.sort(function(a,b){return (a.pay-b.pay)||(b.heat-a.heat);});
  var stories=L.map(function(f){var p=E.feudPlan(S,f);return {id:f.id,label:feudLabel(S,f),a:f.a[0],b:f.b[0],len:f.len,n:p.n,heat:Math.round(f.heat),stage:feudStage(f),
    act:feudActAt(S,f),pay:f.pay,in:f.pay-S.week,at:p.at,late:p.late,cells:seasonCells(S,f)};});
  // what the calendar says: each line something the player can act on
  var says=[],ends={};
  L.forEach(function(f){(f.ch?f.ch.slice(f.chd||0):[f.pay]).forEach(function(w){if(isBigWeek(w)){(ends[w]=ends[w]||[]).push(f);}});});
  L.forEach(function(f){if(f.pay<S.week)says.push({k:'late',t:feudLabel(S,f)+' is past its night and cooling. Book the match.',id:f.id});});
  var who={};L.forEach(function(f){f.a.concat(f.b).forEach(function(id){(who[id]=who[id]||[]).push(f);});});
  Object.keys(who).forEach(function(id){if(who[id].length>1)says.push({k:'clash',t:S.w[id].name+' is in '+who[id].length+' stories at once.',id:who[id][0].id,w:+id});});
  L.forEach(function(f){if(f.len==='l'&&S.week-Math.max(f.tww||0,f.start||0)>=4)says.push({k:'tired',t:feudLabel(S,f)+': no twist in '+(S.week-Math.max(f.tww||0,f.start||0))+' weeks. The crowd is tiring of it.',id:f.id});});
  L.forEach(function(f){f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(w.inj>0&&S.week+w.inj>(f.ch?f.ch[Math.min(f.chd||0,f.ch.length-1)]:f.pay))says.push({k:'hurt',t:w.name+' is hurt past the night '+feudLabel(S,f)+' ends.',id:f.id,w:w.id});});});
  weeks.forEach(function(x){if(!x.big)return;var n=(ends[x.w]||[]).length;
    if(n>=3)says.push({k:'crowd',t:n+' stories end at '+x.ev+'. Not all of them can be the main event.',w0:x.w});
    else if(n===2)says.push({k:'good',t:'Two stories end at '+x.ev+'.',w0:x.w});
    else if(n===0&&x.w-S.week>=2)says.push({k:'gap',t:'Nothing ends at '+x.ev+'. The crowd needs a reason to buy it.',w0:x.w});});
  // the champions with nobody after them
  var lone=[];P.titles.forEach(function(t){if(!t.holders.length||t.tag)return;var h=t.holders[0];if(!who[h]&&S.w[h]&&!(S.w[h].inj>0)&&lone.indexOf(h)<0)lone.push(h);});
  if(lone.length===1)says.push({k:'idle',t:'Your champion '+S.w[lone[0]].name+' has no challenger.',w:lone[0]});
  else if(lone.length)says.push({k:'idle',t:lone.length+' champions have no challenger: '+lone.map(function(id){return S.w[id].name;}).join(', ')+'.',ids:lone});
  var recent={};S.feuds.forEach(function(f){if(f.promo===P.id&&f.res&&S.week-(f.end||0)<=4)f.a.concat(f.b).forEach(function(id){recent[id]=1;});});
  var top=rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt;}).sort(function(a,b){return b.ovr-a.ovr;});top=top.slice(0,12);
  var idle=top.filter(function(w){return !who[w.id]&&!recent[w.id]&&!(w.inj>0);});
  if(idle.length)says.push({k:'idle',t:idle.length+' of your top 12 '+(idle.length===1?'has':'have')+' had no story in four weeks.',ids:idle.slice(0,8).map(function(w){return w.id;})});
  var ORD={late:0,hurt:1,clash:2,tired:3,crowd:4,gap:5,idle:6,good:7};says.sort(function(a,b){return ORD[a.k]-ORD[b.k];});
  var nx=null;Object.keys(ends).map(Number).sort(function(a,b){return a-b;}).forEach(function(w){if(nx==null&&w>=S.week)nx=w;});
  return {week:S.week,weeks:weeks,stories:stories,says:says,next:nx==null?null:{w:nx,in:nx-S.week,ev:bigShort(S,nx),n:ends[nx].length}};
};
/** End a story now, before its night. No payoff, and both of them remember. */
E.storyEnd=function(S,id){
  var f=S.feuds.filter(function(x){return x.id===id&&!x.res&&x.promo===S.player;})[0];if(!f)return {ok:false,msg:'That story is already over.'};
  f.res=true;f.dead=true;f.cut=1;f.end=S.week;
  f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(!w)return;w.morale=clamp(w.morale-3,0,100);youRemember(S,w,'storycut','You ended our story before it paid off.',-3);});
  news(S,'story','The '+feudLabel(S,f)+' story was dropped before it paid off.');
  return {ok:true,msg:'The '+feudLabel(S,f)+' story is over. It never got its night, and both of them know it.'};
};
