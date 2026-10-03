/* A company grows: new weekly shows and new belts during a game, for the player and, once a year, for rivals.
   The World Editor makes these before a game starts; this file makes them after. */
var MAKE_SHOWS=3,MAKE_PER_SHOW=12,MAKE_WAIT=8;
var MAKE_DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MAKE_SHOW_WORDS=['Uproar','Bell Time','Turnbuckle','Roll Call','Open Challenge','Marquee','Late Card','Ringside','Headlock','Proving Ground','Main Line','Spotlight'];
var MAKE_TITLE_WORDS=['Television','Openweight','Iron','Frontier','Crown','Midnight','Marathon','Golden','Rising Star','Lightweight','Middleweight','Summit','Keystone','Crossroads','Trailblazer'];
var MAKE_SIZE=[[0.75,'A second show'],[0.55,'A mid-size show'],[0,'A small show']];

function makeWrestlers(S,P,g){return rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt&&(!g||w.g===g);});}
function makeSizeWord(m){for(var i=0;i<MAKE_SIZE.length;i++)if(m>=MAKE_SIZE[i][0])return m>=0.95?'The main show':MAKE_SIZE[i][1];return 'A small show';}
function makeShowIncome(P,sh){var mx=mixOf(P),d=demand(P,sh,1);return viewersK(P,sh,1)*P.tvRate*mx.tv+Math.min(capFor(d),d*1.04)*ticket(P,sh)*mx.gate;}
function makeCleanName(s,max){return String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,max||40);}

/* ---------- shows ---------- */
function makeShowCost(P){return Math.round(P.prod*2/1000)*1000;}
function makeShowWhy(S,P){
  if(P.shows.length>=MAKE_SHOWS)return 'Three weekly shows is as many as a company can run.';
  var n=makeWrestlers(S,P).length,need=MAKE_PER_SHOW*(P.shows.length+1);
  if(n<need)return 'Another weekly show needs a roster of '+need+'. You have '+n+'.';
  if(P.cash<makeShowCost(P))return 'Launching a show costs '+money(makeShowCost(P))+'. You do not have it.';
  if(S.showAsk!=null&&S.week-S.showAsk<MAKE_WAIT)return 'The network will not talk about another show for '+(MAKE_WAIT-(S.week-S.showAsk))+' more weeks.';
  return '';
}
function makeShowCheck(S,P){
  var tr=P.trend||0;
  return mkCheck(8,[{n:'Popularity '+Math.round(P.image),v:P.image>=75?2:(P.image>=55?1:(P.image<35?-1:0))},
    {n:P.shows.length+' weekly '+(P.shows.length===1?'show':'shows')+' on the air already',v:-(P.shows.length-1)},
    {n:tr>1?'Your shows are on a hot run':'Your shows are on a cold run',v:tr>1?1:(tr<-1?-1:0)}].concat(skillMods(S,'talk')));
}
/** Put a new weekly show on a company's schedule. The overheads grow with it, as they did for the shows it started with. */
function addShow(S,P,name){
  var sh={id:'s'+S.nid++,name:name,brand:null,mult:0.4,since:S.week},first=P.shows[0];
  var inc=makeShowIncome(P,sh);sh.inc=Math.round(inc);
  if(P.inc0>0){P.fixed=Math.round((P.fixed||0)*(P.inc0+inc)/P.inc0);P.inc0+=inc;}
  if(first){P.base[sh.id]=P.base[first.id];P.mainB[sh.id]=P.mainB[first.id];P.starB[sh.id]=P.starB[first.id];}
  P.shows.push(sh);return sh;
}
function removeShow(S,P,sh){
  var inc=sh.inc||0;
  if(inc>0&&P.inc0>inc){P.fixed=Math.round((P.fixed||0)*(P.inc0-inc)/P.inc0);P.inc0-=inc;}
  P.shows=P.shows.filter(function(x){return x!==sh;});delete P.base[sh.id];delete P.mainB[sh.id];delete P.starB[sh.id];
}
E.makeShow=function(S,o){
  var P=S.promos[S.player],why=makeShowWhy(S,P),name=makeCleanName(o&&o.name,32);
  if(why)return {ok:false,msg:why};
  if(name.length<3)return {ok:false,msg:'Give the show a name first.'};
  if(P.shows.some(function(x){return x.name.toLowerCase()===name.toLowerCase();}))return {ok:false,msg:'You already have a show called '+name+'.'};
  var r=rollCheck(S,makeShowCheck(S,P));S.showAsk=S.week;
  if(!r.ok)return {ok:false,roll:r,msg:rollText(r)+'The network is not ready to give '+P.name+' another show. Ask again in '+MAKE_WAIT+' weeks.'};
  var cost=makeShowCost(P);P.cash-=cost;addShow(S,P,name);
  news(S,'money',P.name+' is adding a weekly show: '+name+'.');
  return {ok:true,roll:r,msg:rollText(r)+name+' starts next week as a small show. Launching it cost '+money(cost)+'. It brings television and gate money every week, and your roster now works one more night.'};
};
E.dropShow=function(S,id){
  var P=S.promos[S.player],sh=P.shows.filter(function(x){return x.id===id;})[0];
  if(!sh)return {ok:false,msg:'That show is not on your schedule.'};
  if(P.shows.length<=1)return {ok:false,msg:'A company needs one weekly show.'};
  // a show still to run this week comes off the schedule too; a card half booked for it is dropped
  var cur=S.queue[S.qi];if(cur&&cur.id===id)S.card=[];
  S.queue=S.queue.filter(function(q,i){return i<S.qi||q.id!==id;});
  removeShow(S,P,sh);P.image=clamp(P.image-0.5,5,100);
  news(S,'money',P.name+' cancelled '+sh.name+'.');
  return {ok:true,msg:sh.name+' is off the schedule. The network is not pleased: popularity down half a point.'};
};
E.renameShow=function(S,id,name){
  var P=S.promos[S.player],sh=P.shows.filter(function(x){return x.id===id;})[0];name=makeCleanName(name,32);
  if(!sh)return {ok:false,msg:'That show is not on your schedule.'};
  if(name.length<3)return {ok:false,msg:'A show needs a name of three letters or more.'};
  var was=sh.name;sh.name=name;S.queue.forEach(function(q){if(q.id===id)q.name=name;});
  return {ok:true,msg:was+' is now '+name+'.'};
};

/* ---------- belts ---------- */
function makeTitleMax(S,P){return Math.max(2,Math.floor(makeWrestlers(S,P).length/6));}
function makeTitleCost(P){return Math.max(2000,Math.round((P.inc0||0)*0.002/500)*500);}
function makeTitleLevels(P,g,tag){
  var top=P.titles.some(function(t){return t.g===g&&!!t.tag===!!tag&&t.lvl>=3;});
  return top?[2,1]:[3,2,1];
}
function makeTitleWhy(S,P,o){
  var MD=modelOf(P),g=o.g==='F'?'F':'M',n;
  if(P.titles.length>=makeTitleMax(S,P))return 'A roster this size carries '+makeTitleMax(S,P)+' belts. Any more and none of them would mean much.';
  if(MD.gender&&g!==MD.gender)return cap1(MD.ph||MD.n)+' has only '+(MD.gender==='F'?'women’s':'men’s')+' belts.';
  n=makeWrestlers(S,P,g).length;
  if(n<(o.tag?6:4))return (o.tag?'Tag team belts need six ':'A belt needs four ')+(g==='F'?'women':'men')+' on the roster. You have '+n+'.';
  if(P.cash<makeTitleCost(P))return 'Having the belt made costs '+money(makeTitleCost(P))+'. You do not have it.';
  return '';
}
function addTitle(S,P,o){
  var lvl=clamp(o.lvl|0,1,3),t={id:'x'+S.nid++,name:o.name,brand:null,g:o.g==='F'?'F':'M',lvl:lvl,tag:!!o.tag,holders:[],prestige:lvl===3?60:(lvl===2?45:35),defs:0,since:S.week,last:S.week,hist:[],born:S.week};
  P.titles.push(t);return t;
}
E.makeTitle=function(S,o){
  var P=S.promos[S.player];o=o||{};var name=makeCleanName(o.name,40),why=makeTitleWhy(S,P,o),g=o.g==='F'?'F':'M';
  if(why)return {ok:false,msg:why};
  if(name.length<3)return {ok:false,msg:'Give the belt a name first.'};
  if(P.titles.some(function(t){return t.name.toLowerCase()===name.toLowerCase();}))return {ok:false,msg:'You already have a belt called '+name+'.'};
  var lv=makeTitleLevels(P,g,!!o.tag),lvl=lv.indexOf(o.lvl|0)>=0?o.lvl|0:lv[0],cost=makeTitleCost(P);
  P.cash-=cost;var t=addTitle(S,P,{name:name,g:g,lvl:lvl,tag:!!o.tag});
  news(S,'title',P.name+' unveiled a new belt: the '+name+'.');
  return {ok:true,id:t.id,msg:'The '+name+' is made and vacant. It cost '+money(cost)+'. A new belt starts with little prestige: good matches for it are what build it. Crown a first champion with a tournament on the Titles page, or book a match for it.'};
};
/** Why a belt cannot be retired right now, or '' when it can. */
function titleBusy(S,P,id){
  var t=titleById(P,id);if(!t)return 'That belt is not yours.';
  if(P.titles.length<=1)return 'A company needs one belt.';
  if(!t.tag&&t.lvl>=3&&!P.titles.some(function(x){return x!==t&&!x.tag&&x.lvl>=3;}))return 'The '+t.name+' is your only top title. Create another top title before you retire it.';
  if(S.tourn&&!S.tourn.done&&S.tourn.title===id)return 'Finish the '+S.tourn.name+' first.';
  if((S.card||[]).some(function(m){return m&&m.title===id;}))return 'It is on the card you are booking. Take it off first.';
  if((S.inbox||[]).some(function(e){return !e.done&&e.title===id;}))return 'There is an open matter about this belt in your inbox. Answer it first.';
  if((S.after||[]).some(function(a){return a.a&&a.a.t===id;}))return 'A story about this belt is still playing out. Wait until it is settled.';
  if((S.quests||[]).some(function(q){return q.title===id;}))return 'You have promised someone a match for this belt. Keep the promise first.';
  if(S.feuds.some(function(f){return !f.res&&f.title===id;}))return 'A feud is being fought over this belt. Let it finish first.';
  if(S.lp&&S.lp.title===id)return 'Your long plan ends in a match for this belt. Change the plan first.';
  return '';
}
E.dropTitle=function(S,id){
  var P=S.promos[S.player],why=titleBusy(S,P,id);if(why)return {ok:false,msg:why};
  var t=titleById(P,id),last=t.holders.map(function(h){return S.w[h];}).filter(Boolean);
  last.forEach(function(w){w.morale=clamp(w.morale-8,0,100);});
  (P.oldTitles||(P.oldTitles=[])).unshift({name:t.name,g:t.g,lvl:t.lvl,tag:!!t.tag,to:S.week,last:last.map(function(w){return w.name;}),prestige:Math.round(t.prestige)});
  if(P.oldTitles.length>20)P.oldTitles.length=20;
  P.titles=P.titles.filter(function(x){return x!==t;});
  news(S,'title',P.name+' retired the '+t.name+'.'+(last.length?' '+last.map(function(w){return w.name;}).join(' and ')+(last.length>1?' were':' was')+' the last to hold it.':''));
  return {ok:true,msg:'The '+t.name+' is retired.'+(last.length?' '+last.map(function(w){return w.name;}).join(' and ')+' '+(last.length>1?'are':'is')+' not happy to lose it this way.':'')};
};
E.renameTitle=function(S,id,name){
  var P=S.promos[S.player],t=titleById(P,id);name=makeCleanName(name,40);
  if(!t)return {ok:false,msg:'That belt is not yours.'};
  if(name.length<3)return {ok:false,msg:'A belt needs a name of three letters or more.'};
  var was=t.name;t.name=name;return {ok:true,msg:'The '+was+' is now the '+name+'.'};
};

/** Everything the Shows and belts window needs. */
E.makeInfo=function(S){
  var P=S.promos[S.player],MD=modelOf(P),sw=makeShowWhy(S,P),used={};
  P.shows.forEach(function(s){MAKE_DAYS.forEach(function(d){if(s.name.indexOf(d)>=0)used[d]=1;});});
  var day=MAKE_DAYS.filter(function(d){return !used[d];})[0]||'Sunday';
  return {
    shows:P.shows.map(function(s){return {id:s.id,name:s.name,size:makeSizeWord(s.mult==null?1:s.mult),since:s.since||null,income:Math.round(makeShowIncome(P,s)),own:!!s.since};}),
    showMax:MAKE_SHOWS,showCan:!sw,showWhy:sw,showCost:makeShowCost(P),showCheck:sw?null:makeShowCheck(S,P),showNeed:MAKE_PER_SHOW*(P.shows.length+1),showSay:day+' Night '+MAKE_SHOW_WORDS[(S.week+P.shows.length)%MAKE_SHOW_WORDS.length],
    showGain:Math.round(makeShowIncome(P,{mult:0.4})),showProd:Math.round(P.prod),
    titles:P.titles.map(function(t){return {id:t.id,name:t.name,g:t.g,lvl:t.lvl,tag:!!t.tag,prestige:Math.round(t.prestige),holders:t.holders.slice(),busy:titleBusy(S,P,t.id),born:t.born||null};}),
    titleMax:makeTitleMax(S,P),titleCost:makeTitleCost(P),gender:MD.gender||null,roster:makeWrestlers(S,P).length,
    old:(P.oldTitles||[]).slice()
  };
};
E.makeTitleWhy=function(S,o){return makeTitleWhy(S,S.promos[S.player],o||{});};
E.makeTitleLevels=function(S,g,tag){return makeTitleLevels(S.promos[S.player],g==='F'?'F':'M',!!tag);};
E.MAKE_LVL={3:'Top title',2:'Second title',1:'Third title'};

/* ---------- once a year, rivals grow or shrink too; and a show a company launched finds its audience ---------- */
function makePick(S,a){return a[Math.floor(rnd(S)*a.length)];}
function rivalGrow(S,P){
  var MD=modelOf(P),ros=makeWrestlers(S,P),n=ros.length;
  // a belt the roster can carry and does not have yet
  if(P.titles.length<makeTitleMax(S,P)&&chance(S,0.45)){
    var women=makeWrestlers(S,P,'F').length,men=n-women,g=MD.gender||'M',tag=false,word=null,has=function(gg,tg){return P.titles.some(function(t){return t.g===gg&&!!t.tag===tg;});};
    if(!MD.gender&&women>=5&&!has('F',false)){g='F';}
    else if((g==='F'?women:men)>=8&&!has(g,true)){tag=true;}
    else{var free=MAKE_TITLE_WORDS.filter(function(w){return !P.titles.some(function(t){return t.name.indexOf(w)>=0;});});if(!free.length)return;word=makePick(S,free);if(!MD.gender&&women>=10&&chance(S,0.3))g='F';}
    var lv=makeTitleLevels(P,g,tag),nm=P.name+' '+(g==='F'&&!MD.gender?'Women’s ':'')+(word?word+' ':(lv[0]===3?'World ':''))+(tag?'Tag Team Titles':'Title');
    if(!P.titles.some(function(t){return t.name===nm;})){addTitle(S,P,{name:nm,g:g,lvl:word?(chance(S,0.5)?2:1):lv[0],tag:tag});news(S,'title',P.name+' introduced the '+nm+'.');}
  }
  // another weekly show, when the company is big enough and has the people for it
  if(P.shows.length<MAKE_SHOWS&&P.cash>0&&P.image>=45+15*P.shows.length&&n>=14*(P.shows.length+1)&&chance(S,0.3)){
    var used={};P.shows.forEach(function(s){MAKE_DAYS.forEach(function(d){if(s.name.indexOf(d)>=0)used[d]=1;});});
    var days=MAKE_DAYS.filter(function(d){return !used[d];}),sn=(days.length?makePick(S,days):'Sunday')+' Night '+makePick(S,MAKE_SHOW_WORDS);
    if(!P.shows.some(function(s){return s.name===sn;})){addShow(S,P,sn);news(S,'money',P.name+' is adding a weekly show: '+sn+'.');}
  }else if(P.shows.length>1&&(P.cash<0||n<10*P.shows.length)){
    var sh=P.shows.filter(function(s){return s.since;}).pop()||P.shows[P.shows.length-1];removeShow(S,P,sh);news(S,'money',P.name+' cancelled '+sh.name+'.');
  }
}
WEEKX.push(function(S){
  var c=cal(S.week);
  // a show launched during the game grows a little on each anniversary while the company is doing well
  S.order.forEach(function(pid){var P=S.promos[pid];P.shows.forEach(function(sh){
    if(!sh.since||S.week<=sh.since||(S.week-sh.since)%48!==0||sh.mult>=0.8||(P.trend||0)<0)return;
    sh.mult=Math.round((sh.mult+0.1)*100)/100;sh.inc=Math.round(makeShowIncome(P,sh));
    if(pid===S.player)news(S,'money',sh.name+' has found its audience. The network gives it a better hour.');
  });});
  if(c.month===0&&c.wom===1)S.order.forEach(function(pid){if(pid!==S.player)rivalGrow(S,S.promos[pid]);});
});
