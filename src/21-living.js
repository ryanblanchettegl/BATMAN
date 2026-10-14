/* ---------- living storylines (docs/plans/living-storylines.md) ----------
   A feud has no length and no planned week. It has heat (how much the crowd cares, 0 to 100) and freshness (how much
   the story still has to give, 0 to 100). Every beat raises heat and costs freshness; the same kind of beat again is
   worth less; a twist gives freshness back, and so does a week of rest. It ends when the booker ends it (a match
   marked as the blow-off, or an ending planned for a night), or it fizzles when the crowd stops caring. Rivals end
   theirs by the same rules. An old save's feud simply goes on: its length and planned week are ignored.
   Nothing here uses rnd(S). */
var LIVE_FIZZ=20,LIVE_FIZZW=4,LIVE_SHELF=10,LIVE_FLAT=12;
function isBigWeek(w){return cal(w).wom===4;}
function nextBigFrom(w){while(!isBigWeek(w))w++;return w;}
/** Give a feud what a living story needs, if it has none yet. Safe to call any time. */
function feudPlan(S,f){
  if(!f)return f;
  if(f.fresh==null)f.fresh=100;if(f.peak==null)f.peak=f.heat||0;if(!f.hist)f.hist=[];if(f.start==null)f.start=S.week;
  return f;
}
/* the stretch of story we are in: a twist is welcome once in four weeks */
function feudSeg(S,f){feudPlan(S,f);return {s0:Math.max(f.start,S.week-3),e:S.week+4,first:S.week-f.start<4,last:false,k:0};}
/* where the story is, in words: from the state, not the calendar */
var PHASE_N={spark:'Spark',build:'Building',boil:'Boiling',stale:'Going stale',cool:'Cooling',rest:'On the back burner',done:'Finished'};
function feudPhase(S,f){
  feudPlan(S,f);if(f.res)return 'done';if(f.bb!=null&&S.week<=f.bb)return 'rest';
  var h=f.hist,was=h.length>=3?h[h.length-3]:null;
  if(f.fresh<35&&f.heat>=30)return 'stale';
  if(was!=null&&f.heat<was-8&&f.heat<f.peak-10)return 'cool';
  if(S.week-f.start<3&&f.heat<45)return 'spark';
  return f.heat>=60?'boil':'build';
}
/* the act the writers read (1 spark, 2 build, 3 boiling or stale, 4 the ending is due) */
function feudActAt(S,f,w){
  if(f.res)return 4;if(f.endAt!=null&&(w==null?S.week:w)>=f.endAt)return 4;
  var p=feudPhase(S,f);return p==='spark'?1:((p==='boil'||p==='stale')?3:2);
}
function feudActCal(S,f){return feudActAt(S,f,S.week);}
/** A rival's office ends a feud when it is hot and going stale, when it has peaked and started to slide, or when it
    is white hot with little left to give. */
function rivalRipe(S,f){
  var age=S.week-f.start;
  return (f.heat>=70&&f.fresh<45)||(age>=10&&f.heat<f.peak-15&&f.heat>=35)||(f.heat>=90&&f.fresh<60)||age>=40;
}
/** Is this the night the story ends ('end'), a round of it on a big night ('chapter'), or neither? */
function feudDue(S,f,show){
  feudPlan(S,f);var big=!!(show&&show.big);
  if(f.promo===S.player){
    if(f.endAt!=null&&S.week>=f.endAt&&(big||!isBigWeek(f.endAt)))return 'end';
    return big?'chapter':null;
  }
  if(big&&rivalRipe(S,f))return 'end';
  return big?'chapter':null;
}
/* a round of the feud on a big night: the winner has the upper hand, the loser wants it back, and the story goes on */
function closeChapter(S,P,show,f,winners,losers,isPl){
  feudPlan(S,f);f.chd=(f.chd||0)+1;(f.chw||(f.chw=[])).push(winners[0]?winners[0].id:null);f.last=S.week;f.finale=false;
  winners.forEach(function(w){addOvr(P,w,1);w.mom=clamp(w.mom+1,-10,10);});losers.forEach(function(w){addOvr(P,w,0.5);});
  var lead=feudLead(f),msg='Round '+f.chd+' of '+feudLabel(S,f)+' goes to '+names(winners)+'. '+(lead?lead:'It is not over.');
  f.log.push({w:S.week,t:'Round '+f.chd+' went to '+names(winners)+' at '+show.name});if(f.log.length>16)f.log.shift();
  if(isPl){losers.forEach(function(l){winners.forEach(function(w){relBump(S,l.id,w.id,{bond:-3});});});
    losers.forEach(function(l){youRemember(S,l,'chapter','You gave '+names(winners)+' round '+f.chd+' of our feud',-2);});
    winners.forEach(function(w){youRemember(S,w,'chapter','You gave me round '+f.chd+' against '+names(losers),2);});
    note(S,'Round '+f.chd+' is over',msg,'');}
  news(S,'story',msg);
  return msg;
}
/* who has the upper hand, in a few words */
function feudLead(f){var a=f.aw||0,b=f.bw||0;if(a+b<2)return '';if(a===b)return 'It is all square.';if(Math.min(a,b)===0)return 'One side has won every time. The crowd needs a reason to believe it can change.';return 'One side is ahead, '+Math.max(a,b)+' to '+Math.min(a,b)+'.';}
/* what an ending is worth: how hot it is, how much it still had to give, and how long it lived */
function feudPayMult(S,f){
  feudPlan(S,f);var age=S.week-f.start;
  return clamp(f.heat/70,0.3,1.4)*(0.6+0.4*f.fresh/100)*(1+Math.min(0.5,age/48));
}
/* how much a beat adds: freshness, one-sidedness, split attention and real heat change it; a beat costs freshness */
function feudHeatRoom(S,f,amt){
  feudPlan(S,f);
  if(f.tww===S.week&&f.twR!==S.week){f.twR=S.week;f.fresh=Math.min(100,f.fresh+30);}   // a twist gives the story room again
  if(amt<=0)return {amt:amt,cap:100};
  var x=0.3+0.7*f.fresh/100;
  if((f.matches||0)>=3&&Math.min(f.aw||0,f.bw||0)===0)x*=0.75;   // the crowd needs doubt
  var split=f.a.concat(f.b).some(function(id){return feudsFor(S,id).length>1;});if(split)x*=0.8;
  var b=bondOf(S,f.a[0],f.b[0]);if(b<=-REL_STRONG)x*=1.2;else if(b<=-REL_ON)x*=1.1;   // real heat
  x*=1+clamp(chem(S,f.a[0],f.b[0])/12,-0.2,0.25);   // two who work well together make it easier to believe
  var sh=S.queue&&S.queue[S.qi];if(sh&&sh.big&&f.promo===S.player&&!S.cal)x*=1.25;   // a big night counts for more
  var same=f.lb===S.week-1||f.lb===S.week;f.fresh=Math.max(0,f.fresh-(same?5:3));f.lb=S.week;
  return {amt:amt*x,cap:100};
}
/* at the end of every week: the heat line, rest, a peak, the shelf and fizzling */
WEEKX.push(function(S){
  activeFeuds(S).forEach(function(f){
    feudPlan(S,f);
    var shelf=f.bb!=null&&S.week<=f.bb;   // on the back burner: it rests and freshens, and cools only slowly
    if(shelf){f.fresh=Math.min(100,f.fresh+10);f.heat=Math.max(0,f.heat-1.5);}
    else if(f.last<S.week){f.fresh=Math.min(100,f.fresh+6);f.heat=Math.max(0,f.heat-f.heat*0.05);}   // a week off gives the story room, and a hot one cools faster
    else if(f.fresh<20)f.heat=Math.max(0,f.heat-8);   // fed again with nothing left to give: the crowd has seen it all
    f.peak=Math.max(f.peak,f.heat);f.hist.push(Math.round(f.heat));if(f.hist.length>24)f.hist.shift();
    f.fz=f.heat<LIVE_FIZZ&&S.week-f.start>=2?(f.fz||0)+1:Math.max(0,(f.fz||0)-1);   // a cold week counts, a warm one only takes one back
  });
});
/* rival companies keep feuds too: each keeps two or three going, between people near the top of its card, a hero
   against a villain where it can. Their matches heat them, and they end them by rivalRipe() on a big night. */
WEEKX.push(function(S){
  S.order.forEach(function(pid){
    if(pid===S.player)return;var P=S.promos[pid];if(!P||P.dead)return;
    var mine=activeFeuds(S).filter(function(f){return f.promo===pid;});
    mine.forEach(function(f){if(chance(S,0.6))heatUp(S,f,3+ri(S,0,5),null);});   // their television's promos and angles feed their stories
    if(mine.length>=3||chance(S,0.5))return;
    var R=rosterOf(S,pid).filter(function(w){return !w.nw&&!w.rt&&!(w.inj>0)&&!inFeud(S,w.id);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,10);
    if(R.length<2)return;var a=pick(S,R.slice(0,5)),o=R.filter(function(w){return w.id!==a.id&&w.g===a.g&&(a.team==null||w.team!==a.team);});
    if(!o.length)return;o.sort(function(x,y){return (x.align===a.align?8:0)+Math.abs(x.ovr-a.ovr)-((y.align===a.align?8:0)+Math.abs(y.ovr-a.ovr));});
    var b=o[0],hero=a.align==='F'?a:b,vil=hero===a?b:a;startFeud(S,P,hero,vil,22+ri(S,0,10),vil.name+' and '+hero.name+' have a score to settle');
  });
});
/** Fizzling: a feud nobody cares about for four weeks, one that never got going in three months, or one left on the shelf too long, ends with no payoff. Called by the week. */
function feudFizzle(S,f){
  if(f.bb!=null&&S.week<=f.bb)return false;   // a story on the back burner does not die
  var flat=S.week-f.start>=LIVE_FLAT&&(f.peak||0)<35;   // three months and it never got going
  if(!(f.fz>=LIVE_FIZZW||flat||S.week-f.last>=LIVE_SHELF))return false;
  var cold=f.fz>=LIVE_FIZZW||flat;f.res=true;f.dead=true;f.fizzle=cold?'cold':'shelf';f.end=S.week;
  f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(w&&w.promo===f.promo){addOvr(S.promos[f.promo],w,-0.5);if(f.promo===S.player)youRemember(S,w,'fizzle',cold?'Our feud never caught on.':'You left our feud on the shelf until it died.',-1);}});
  news(S,'story',cold?'The rivalry between '+feudLabel(S,f)+' never caught on. It fizzles out.':'The rivalry between '+feudLabel(S,f)+' was left alone too long and is over.');
  return true;
}

/* embers: when a feud ends, the pair is remembered for a year; the same two start again with a head start */
function feudEmber(S,f){var k=rkey(f.a[0],f.b[0]);(S.embers||(S.embers={}))[k]={w:S.week,h:Math.round(f.heat),n:((S.embers[k]||{}).n||0)+1};
  Object.keys(S.embers).forEach(function(x){if(S.week-S.embers[x].w>48)delete S.embers[x];});}
function emberOf(S,a,b){var e=S.embers&&S.embers[rkey(a,b)];return e&&S.week-e.w<=48?e:null;}
/** Everything the screens need about one story. */
E.feudPlan=function(S,f){
  feudPlan(S,f);var P=S.promos[f.promo]||S.promos[S.player];
  var at=function(w){return isBigWeek(w)?P.name+' '+dbOf(S).events[cal(w).month]:(P.shows[0]?P.shows[0].name:'a weekly show');};
  var ph=feudPhase(S,f);
  return {heat:Math.round(f.heat),fresh:Math.round(f.fresh),peak:Math.round(f.peak),phase:ph,pn:PHASE_N[ph],weeks:S.week-f.start,hist:f.hist.slice(-12),
    end:f.endAt!=null?{w:f.endAt,in:f.endAt-S.week,at:at(f.endAt)}:null,ripe:f.heat>=65&&f.fresh<50,lead:feudLead(f),rounds:f.chd||0,act:feudActCal(S,f),
    next:{w:nextBigFrom(S.week),in:nextBigFrom(S.week)-S.week,at:at(nextBigFrom(S.week))}};
};
E.feudPhase=function(S,f){return PHASE_N[feudPhase(S,f)];};
E.feudEmber=function(S,f){feudEmber(S,f);};
/** Start a story between two people (ids). Null if there is no room for another. */
E.startStory=function(S,a,b,_len,why){var P=S.promos[S.player],A=S.w[a],B=S.w[b];if(!A||!B)return null;return startFeud(S,P,A,B,30,why||(A.name+' and '+B.name+' have a score to settle'),{force:true});};
/** Heat a story up (or down) by an amount, as a show would. For tests. */
E.heatStory=function(S,f,amt){heatUp(S,f,amt,null);return f.heat;};
/** Plan the ending for the next big event (or a given week), or take the plan off with null. */
E.storyPlanEnd=function(S,id,w){
  var f=S.feuds.filter(function(x){return x.id===id&&!x.res&&x.promo===S.player;})[0];if(!f)return {ok:false,msg:'That feud is already over.'};
  if(w===null){delete f.endAt;return {ok:true,msg:'No ending planned. '+feudLabel(S,f)+' goes on as long as you want it to.'};}
  f.endAt=w==null?nextBigFrom(S.week):w;var p=E.feudPlan(S,f);
  return {ok:true,msg:feudLabel(S,f)+' ends at '+p.end.at+(p.end.in<=0?', this week':(p.end.in===1?', next week':', in '+p.end.in+' weeks'))+'. Book the two of them on that show.'};
};
/** Mark a match on the card as the end of the story between its two sides (or take the mark off). */
E.setMatchEnd=function(S,i,on){var m=S.card[i];if(!m)return false;if(on)m.end=1;else delete m.end;return true;};
/** The feud a match on the card belongs to, if its sides are rivals. */
E.matchFeud=function(S,m){
  if(!m||!m.sides||m.sides.length!==2)return null;var a=m.sides[0][0],b=m.sides[1][0];if(a==null||b==null)return null;
  var f=feudOf(S,a,b);return f&&f.promo===S.player?f:null;
};

/* ---------- Start a feud ----------
   The player picks two people and pays 2 booking power. storyPreview() says everything the pop-up shows before
   anything is spent; storyStart() does it. */
var STORY_COST=2;
/** Who can be put in a story: everybody on your roster who is not brand new. Hurt people are listed and marked. */
E.storyPeople=function(S){
  var P=S.promos[S.player];
  return rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt;}).sort(function(a,b){return b.ovr-a.ovr;})
    .map(function(w){var n=feudsFor(S,w.id).length;return {id:w.id,name:w.name,g:w.g,al:w.align,hurt:w.inj>0,n:n};});
};
/** Everything the Start a feud pop-up shows for two people, before anything is spent. */
E.storyPreview=function(S,a,b){
  var P=S.promos[S.player],A=S.w[a],B=S.w[b],stop=[],warn=[],good=[];
  if(!A||!B)return {ok:false,stop:['Pick two people.'],cost:STORY_COST,bp:S.bp};
  if(A.id===B.id)stop.push('A feud needs two people.');
  if(A.promo!==P.id||B.promo!==P.id)stop.push('Both have to be on your roster.');
  if(A.g!==B.g)stop.push('They would never meet in the ring: a feud needs two who can wrestle each other.');
  if(feudOf(S,A.id,B.id))stop.push('They are already in a feud together.');
  if(S.bp<STORY_COST)stop.push('A feud takes '+STORY_COST+' booking power. You have '+S.bp+'.');
  [A,B].forEach(function(w){
    if(w.inj>0)warn.push(w.name+' is hurt for '+w.inj+' more '+(w.inj===1?'week':'weeks')+'. The feud can start without them in the ring.');
    feudsFor(S,w.id).forEach(function(f){warn.push(w.name+' is already in '+feudLabel(S,f)+'. Two feuds at once heat more slowly.');});
  });
  if(A.align===B.align)warn.push('Both are '+(A.align==='F'?'heroes':'villains')+'. The crowd will need a reason to pick a side.');
  else good.push('A hero against a villain: the crowd knows who to cheer.');
  var bd=bondOf(S,A.id,B.id);if(bd<=-REL_ON)good.push('They really do not like each other. It will heat faster.');
  var em=emberOf(S,A.id,B.id);if(em)good.push('They have history: their last feud ended '+(S.week-em.w)+' weeks ago. This one starts warm.');
  var hh=S.h2h&&S.h2h[rkey(A.id,B.id)],lo=Math.min(A.id,B.id),know=[];
  if(hh&&hh.n){var aw=A.id===lo?hh.a:hh.b,bw=A.id===lo?hh.b:hh.a;know.push('They have met '+hh.n+' '+(hh.n===1?'time':'times')+' on your shows: '+A.name+' '+aw+', '+B.name+' '+bw+'.');}
  else know.push('They have not met on your shows.');
  var K=S.know||KNOW0,key=rkey(A.id,B.id),ch=chem(S,A.id,B.id),agent=P.staff&&P.staff.agent?P.staff.agent:'The road agent',read;
  if(K.p[key])read=ch>=2.2?'They have real chemistry. We have seen it.':(ch<=-2.2?'They do not click. We have seen it. Keep their matches short.':'Nothing special between them in the ring, and nothing wrong.');
  else if(h01(S.seed+':st:'+S.week+':'+key)<clamp(0.3+fogSkill(S),0.05,0.95))read=ch>=2.2?'My read: these two will click.':(ch<=-2.2?'My read: these two will not click.':'My read: no sparks, and no trouble either.');
  else read='I have not seen them together. I cannot tell you yet.';
  return {ok:!stop.length,stop:stop,warn:warn,good:good,know:know,agent:agent,read:read,cost:STORY_COST,bp:S.bp,a:{id:A.id,name:A.name,al:A.align},b:{id:B.id,name:B.name,al:B.align}};
};
/** Start a story between two of your people for its booking power. */
E.storyStart=function(S,a,b){
  var pv=E.storyPreview(S,a,b),P=S.promos[S.player];
  if(!pv.ok)return {ok:false,msg:pv.stop[0]};
  var A=S.w[a],B=S.w[b],f=startFeud(S,P,A,B,24,'The office put '+A.name+' and '+B.name+' in a feud',{force:true});
  if(!f)return {ok:false,msg:'The feud could not start.'};
  S.bp-=STORY_COST;f.chose=1;
  [A,B].forEach(function(w){var o=w===A?B:A;youRemember(S,w,'story','You gave me a feud against '+o.name+'.',3);});
  relBump(S,A.id,B.id,{ra:1,rb:1},{k:'story',t:'The office put them in a feud together.',by:'you'});
  return {ok:true,msg:feudLabel(S,f)+' is a feud now. It runs as long as you want it to: heat it with promos, angles and matches, and end it when the time is right. ('+STORY_COST+' booking power)',id:f.id};
};

/* ---------- the season: every story's heat over the last twelve weeks, and what the state of each says ---------- */
var SEASON_N=12;
function bigShort(S,w){return dbOf(S).events[cal(w).month];}
E.season=function(S){
  var P=S.promos[S.player],weeks=[],L=activeFeuds(S).filter(function(f){return f.promo===P.id;});
  for(var i=SEASON_N-1;i>=0;i--){var w=S.week-i,c=cal(Math.max(1,w));weeks.push({w:w,wom:c.wom,month:MONTHS[c.month],big:isBigWeek(Math.max(1,w)),ev:isBigWeek(Math.max(1,w))?bigShort(S,Math.max(1,w)):null});}
  L.forEach(function(f){feudPlan(S,f);});
  L.sort(function(a,b){return b.heat-a.heat;});
  var stories=L.map(function(f){var p=E.feudPlan(S,f),h=f.hist.slice(-(SEASON_N-1)).concat([Math.round(f.heat)]),pad=SEASON_N-h.length,cells=[];
    for(var k=0;k<SEASON_N;k++){var v=k<pad?null:h[k-pad];cells.push(v==null?{a:0}:{a:v>=60?3:(v>=30?2:1),h:v});}
    return {id:f.id,label:feudLabel(S,f),a:f.a[0],b:f.b[0],heat:p.heat,fresh:p.fresh,stage:feudStage(f),phase:p.pn,ph:p.phase,end:p.end,cells:cells};});
  var says=[],who={};
  L.forEach(function(f){f.a.concat(f.b).forEach(function(id){(who[id]=who[id]||[]).push(f);});});
  L.forEach(function(f){var p=E.feudPlan(S,f);
    if(p.ripe)says.push({k:'ripe',t:feudLabel(S,f)+' is ripe. End it at '+p.next.at+'.',id:f.id});
    else if(p.phase==='stale')says.push({k:'tired',t:feudLabel(S,f)+' is going stale. Twist it or rest it.',id:f.id});
    if(f.fz>=1)says.push({k:'cold',t:feudLabel(S,f)+' is not catching on. Heat it or lose it.',id:f.id});
    if((f.matches||0)>=3&&Math.min(f.aw||0,f.bw||0)===0)says.push({k:'lop',t:feudLabel(S,f)+' is one-sided. The other side needs a win.',id:f.id});
    if(S.week-f.start>=24&&f.heat>=60)says.push({k:'good',t:feudLabel(S,f)+' has run '+(S.week-f.start)+' weeks and is still hot.',id:f.id});
    if(p.end&&p.end.in<0)says.push({k:'late',t:feudLabel(S,f)+' was meant to end at '+p.end.at+'. It goes on until you book the ending.',id:f.id});
    f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(w.inj>0&&p.end&&S.week+w.inj>p.end.w)says.push({k:'hurt',t:w.name+' is hurt past the night '+feudLabel(S,f)+' ends.',id:f.id});});
  });
  Object.keys(who).forEach(function(id){if(who[id].length>1)says.push({k:'clash',t:S.w[id].name+' is in '+who[id].length+' feuds. Both heat slower.',id:who[id][0].id,w:+id});});
  var lone=[];P.titles.forEach(function(t){if(!t.holders.length||t.tag)return;var h=t.holders[0];if(!who[h]&&S.w[h]&&!(S.w[h].inj>0)&&lone.indexOf(h)<0)lone.push(h);});
  if(lone.length===1)says.push({k:'idle',t:'Your champion '+S.w[lone[0]].name+' has no challenger.',w:lone[0]});
  else if(lone.length)says.push({k:'idle',t:lone.length+' champions have no challenger: '+lone.map(function(id){return S.w[id].name;}).join(', ')+'.',ids:lone});
  var recent={};S.feuds.forEach(function(f){if(f.promo===P.id&&f.res&&S.week-(f.end||0)<=4)f.a.concat(f.b).forEach(function(id){recent[id]=1;});});
  var top=rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,12);
  var idle=top.filter(function(w){return !who[w.id]&&!recent[w.id]&&!(w.inj>0);});
  if(idle.length)says.push({k:'idle',t:idle.length+' of your top 12 '+(idle.length===1?'has':'have')+' had no feud in four weeks.',ids:idle.slice(0,8).map(function(w){return w.id;})});
  var nb=nextBigFrom(S.week),ending=L.filter(function(f){return f.endAt===nb;});
  if(ending.length>=3)says.push({k:'crowd',t:ending.length+' feuds end at '+bigShort(S,nb)+'. Not all of them can be the main event.',w0:nb});
  var ORD={late:0,hurt:1,cold:2,ripe:3,clash:4,lop:5,tired:6,crowd:7,idle:8,good:9};says.sort(function(a,b){return ORD[a.k]-ORD[b.k];});
  return {week:S.week,weeks:weeks,stories:stories,says:says,next:{w:nb,in:nb-S.week,ev:bigShort(S,nb),n:ending.length}};
};
/** End a story now, with no match. No payoff, and both of them remember. */
E.storyEnd=function(S,id){
  var f=S.feuds.filter(function(x){return x.id===id&&!x.res&&x.promo===S.player;})[0];if(!f)return {ok:false,msg:'That feud is already over.'};
  f.res=true;f.dead=true;f.cut=1;f.end=S.week;
  f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(!w)return;w.morale=clamp(w.morale-3,0,100);youRemember(S,w,'storycut','You dropped our feud with no ending.',-3);});
  news(S,'story','The '+feudLabel(S,f)+' feud was dropped with no ending.');
  return {ok:true,msg:'The '+feudLabel(S,f)+' feud is over. It never got its blow-off, and both of them know it.'};
};

/* ---------- tonight, on the card being booked (Book the show: Tonight's stakes and Before the bell) ----------
   What rides on tonight's show, and the checks a booker runs before the bell. Reads only. */
E.tonight=function(S){
  var P=S.promos[S.player],show=S.queue&&S.queue[S.qi],card=S.card||[],stakes=[],checks=[];
  if(!show)return {stakes:stakes,checks:checks};
  var nm=function(ids){return ids.map(function(id){return S.w[id]?S.w[id].name:'';}).join(' & ');};
  (S.quests||[]).filter(function(q){return q.due-S.week<=1;}).slice(0,2).forEach(function(q){var qt=q.text.replace(/^[^:]+: /,'');stakes.push({k:'due',t:qt.charAt(0).toUpperCase()+qt.slice(1)});});
  card.forEach(function(m){if(!m||!m.sides||m.sides.length<2||m.sides.some(function(s){return !s.length||s.some(function(id){return id==null;});}))return;
    var f=E.matchFeud(S,m);if(m.end&&f)stakes.push({k:'story',t:feudLabel(S,f)+' ends tonight.'});
    else if(f)stakes.push({k:'story',t:feudLabel(S,f)+': '+PHASE_N[feudPhase(S,f)].toLowerCase()+', heat '+Math.round(f.heat)+'.'});
    if(m.title){var t=P.titles.filter(function(x){return x.id===m.title;})[0];if(t)stakes.push({k:'title',t:'The '+t.name+(t.tag?' are':' is')+' on the line.'});}});
  if(show.big)activeFeuds(S).filter(function(f){return f.promo===P.id&&f.heat>=65&&f.fresh<50&&!card.some(function(m){return m&&m.end&&E.matchFeud(S,m)===f;});})
    .slice(0,1).forEach(function(f){stakes.push({k:'ripe',t:feudLabel(S,f)+' is ripe and not ending tonight.'});});
  var fw=faceOf(S);if(fw&&card.length&&!card.some(function(m){return m&&m.sides&&m.sides.some(function(s){return s.indexOf(fw.id)>=0;});}))stakes.push({k:'face',t:fw.name+', the face of the company, is not on the card.'});
  var ck=E.clock(S);
  checks.push({ok:!ck.over&&!ck.short,t:ck.over?'The show runs over its slot.':(ck.short?'There is too much empty time.':'The run sheet fills the slot.')});
  var last=card[card.length-1];
  if(last)checks.push({ok:!!(last.title||E.matchFeud(S,last)),t:last.title?'A title match closes the show.':(E.matchFeud(S,last)?'A feud closes the show.':'Nothing is at stake in the main event.')});
  if(!card.length)checks.push({ok:false,t:'The card is empty.'});
  return {stakes:stakes.slice(0,3),checks:checks.slice(0,2)};
};

/* ---------- what the booker can do to a feud from the Storylines page ----------
   Ways to heat a story or freshen it without waiting for the show: raise the stakes (a twist), a sit-down interview
   aired on the next show (a beat), or put a title on it. Each spends booking power where it says, and both people
   remember it. */
var STORY_STAKES=['Loser sits out four weeks','Winner gets a title shot','No disqualifications: nobody can save you'];
E.storyActs=function(S,id){
  var f=S.feuds.filter(function(x){return x.id===id&&!x.res&&x.promo===S.player;})[0];if(!f)return [];feudPlan(S,f);
  var P=S.promos[S.player],A=S.w[f.a[0]],B=S.w[f.b[0]],out=[];
  out.push({id:'stakes',n:'Raise the stakes',cost:1,d:'A twist: the next match between them means more. It freshens the story.',can:S.bp>=1&&!f.stakes,why:f.stakes?'The stakes are already raised: '+f.stakes.toLowerCase()+'.':(S.bp<1?'Takes 1 booking power.':'')});
  out.push({id:'sitdown',n:'Sit-down interview',cost:1,d:'Both of them, one table, cameras rolling. A beat that heats it, once a week.',can:S.bp>=1&&f.sit!==S.week,why:f.sit===S.week?'They sat down this week already.':(S.bp<1?'Takes 1 booking power.':'')});
  var t=null;P.titles.forEach(function(x){if(!t&&!x.tag&&x.holders.length&&(x.holders[0]===A.id||x.holders[0]===B.id))t=x;});
  var bb=f.bb!=null&&S.week<=f.bb;
  out.push({id:'shelf',n:bb?'Bring it back':'Back burner',cost:0,d:bb?'Back on the shows from this week.':'Set it aside for four weeks: it rests and freshens, cools slowly, and will not fizzle. For an injury, or a story that needs a breather.',can:true,why:''});
  out.push({id:'title',n:t?'Put the '+t.name+' on it':'Put a title on it',cost:0,d:'The next match between them is for the belt. It freshens the story and raises the heat.',can:!!t&&!f.title,why:f.title?'A title is already on the line.':(!t?'Neither of them holds a singles title.':'')});
  return out;
};
E.storyDo=function(S,id,act){
  var f=S.feuds.filter(function(x){return x.id===id&&!x.res&&x.promo===S.player;})[0];if(!f)return {ok:false,msg:'That feud is over.'};
  var a=E.storyActs(S,id).filter(function(x){return x.id===act;})[0];if(!a)return {ok:false,msg:'Nothing to do.'};if(!a.can)return {ok:false,msg:a.why||'Not now.'};
  var P=S.promos[S.player],A=S.w[f.a[0]],B=S.w[f.b[0]],L=feudLabel(S,f),msg='';
  S.bp-=a.cost;
  if(act==='stakes'){var opts=STORY_STAKES.filter(function(x){return !(f.title&&/title shot/.test(x));});f.stakes=opts[Math.floor(h01(S.seed+':stk:'+f.id+':'+S.week)*opts.length)%opts.length];f.twist='stakes';f.tww=S.week;
    heatUp(S,f,6,'The stakes were raised: '+f.stakes.toLowerCase());msg='The stakes are raised for '+L+': '+f.stakes.toLowerCase()+'. The story has room again.';
    [A,B].forEach(function(w){youRemember(S,w,'stakes','You raised the stakes on our feud.',1);});}
  else if(act==='sitdown'){f.sit=S.week;heatUp(S,f,8,A.name+' and '+B.name+' sat down face to face, and it went badly');relBump(S,A.id,B.id,{bond:-4});
    msg=A.name+' and '+B.name+' sit down for an interview. It ends with the table on the floor. The heat is '+Math.round(f.heat)+'.';}
  else if(act==='shelf'){if(f.bb!=null&&S.week<=f.bb){delete f.bb;f.last=S.week;msg=L+' is back on the shows.';}else{f.bb=S.week+4;msg=L+' is on the back burner until '+cal(f.bb).label+'. It will rest and freshen.';}}
  else if(act==='title'){var t=null;P.titles.forEach(function(x){if(!t&&!x.tag&&x.holders.length&&(x.holders[0]===A.id||x.holders[0]===B.id))t=x;});
    f.title=t.id;f.tww=S.week;heatUp(S,f,5,'The '+t.name+' was put on the line');msg='The '+t.name+' is on the line in '+L+'. Book the match and the belt goes with it.';
    var ch=S.w[t.holders[0]],cl=ch===A?B:A;youRemember(S,cl,'titleshot','You gave me a title match against '+ch.name+'.',3);}
  return {ok:true,msg:msg};
};
