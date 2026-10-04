/* A company grows: new weekly shows and new belts during a game, for the player and for rivals.
   The World Editor makes these before a game starts; this file makes them after.

   A new belt or a new weekly show is a big moment, not a yearly habit. It takes an occasion, the kind of thing
   that has made real companies add one:
     a belt   a division with no title of its own; enough regular teams for tag belts; a roster that has outgrown
              the titles it has (a second title, then a third); a new weekly show that needs a title of its own.
     a show   a company on a boom; a hit in prime time; a roster too big for the nights it has.
   No company adds more than one belt in a year or one show in two, and a network wants a year of a booker's shows
   before it talks about another night. The player needs an occasion that is open. A rival needs one that has come
   about since the game began, looks once a year, and does one thing at most. Across all the rivals, new belts come
   at least 36 weeks apart and new shows at least 72 (S.mkw), so each one is news on its own.
   P.mk = {img, belt, show, c0} is where a company stood when the game began or when it last added a show (img),
   the weeks it last added a belt and a show, and the roster counts it started with. P.grown is the record. */
var MAKE_SHOWS=3,MAKE_PER_SHOW=12,MAKE_WAIT=8,MAKE_BELT_GAP=48,MAKE_SHOW_GAP=96,MAKE_BOOM=5,MAKE_CROWD=16,MAKE_FIRST=48,WORLD_BELT_GAP=36,WORLD_SHOW_GAP=72;
var BELT_NEED={div:6,tag:4,second:14,third:24};
var MAKE_DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MAKE_SHOW_WORDS=['Uproar','Bell Time','Turnbuckle','Roll Call','Open Challenge','Marquee','Late Card','Ringside','Headlock','Proving Ground','Main Line','Spotlight'];
var MAKE_TITLE_WORDS=['Television','Openweight','Iron','Frontier','Crown','Midnight','Marathon','Golden','Rising Star','Lightweight','Middleweight','Summit','Keystone','Crossroads','Trailblazer'];
var MAKE_SIZE=[[0.75,'A second show'],[0.55,'A mid-size show'],[0,'A small show']];

function makeWrestlers(S,P,g){return rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt&&(!g||w.g===g);});}
function makeSizeWord(m){for(var i=0;i<MAKE_SIZE.length;i++)if(m>=MAKE_SIZE[i][0])return m>=0.95?'The main show':MAKE_SIZE[i][1];return 'A small show';}
function makeShowIncome(P,sh){var mx=mixOf(P),d=demand(P,sh,1);return viewersK(P,sh,1)*P.tvRate*mx.tv+Math.min(capFor(d),d*1.04)*ticket(P,sh)*mx.gate;}
function makeCleanName(s,max){return String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,max||40);}
/** How many men and women wrestle here, and how many regular teams of each (tM, tF). */
function mkCount(S,P){
  var o={M:0,F:0,tM:0,tF:0};makeWrestlers(S,P).forEach(function(w){o[w.g]=(o[w.g]||0)+1;});
  S.teams.forEach(function(t){if(t.promo!==P.id)return;var a=S.w[t.m[0]],b=S.w[t.m[1]];if(a&&b&&a.promo===P.id&&b.promo===P.id&&!a.rt&&!b.rt)o['t'+a.g]=(o['t'+a.g]||0)+1;});
  return o;
}
function mkOf(S,P){if(!P.mk)P.mk={img:P.image,belt:null,show:null,t0:S.week,c0:mkCount(S,P)};return P.mk;}
function mkLog(P,t,name,why){(P.grown||(P.grown=[])).unshift({w:0,t:t,n:name,why:why});if(P.grown.length>12)P.grown.length=12;return P.grown[0];}
NEWX.push(function(S){S.order.forEach(function(pid){mkOf(S,S.promos[pid]);});});

/* ---------- shows ---------- */
function makeShowCost(P){return Math.round(P.prod*2/1000)*1000;}
/** Every occasion on which a network gives a company another night, and whether it is open for this one now. */
function showOccasions(S,P){
  var mk=mkOf(S,P),n=makeWrestlers(S,P).length,k=P.shows.length,up=P.image-mk.img,boom=up>=MAKE_BOOM&&P.image>=50,prime=P.slot>=2&&P.image>=70,crowd=n>=MAKE_CROWD*(k+1);
  return [
    {k:'boom',n:'A company on a boom',open:boom,say:boom?'Popularity has gone from '+Math.round(mk.img)+' to '+Math.round(P.image)+' since '+(mk.show!=null?'the last show was added':'the start')+'.':'Popularity has to climb '+MAKE_BOOM+' points from where it stood ('+Math.round(mk.img)+') and be 50 or better. It is '+Math.round(P.image)+'.'},
    {k:'prime',n:'A hit in prime time',open:prime,say:prime?'A prime time show with popularity '+Math.round(P.image)+'. The network wants more of it.':'It takes a prime time slot and popularity of 70 or better.'},
    {k:'crowd',n:'A roster too big for the nights it has',open:crowd,say:crowd?n+' wrestlers and '+k+' weekly '+(k===1?'show':'shows')+'. People are sitting at home.':'It takes a roster of '+MAKE_CROWD*(k+1)+' to outgrow '+k+' weekly '+(k===1?'show':'shows')+'. You have '+n+'.'}
  ];
}
var MAKE_SHOW_NONE='Nothing has happened that calls for another weekly show. A network gives a company another night when it is on a boom, when its show is a hit in prime time, or when its roster has outgrown the nights it has.';
function makeShowWhy(S,P){
  if(P.shows.length>=MAKE_SHOWS)return 'Three weekly shows is as many as a company can run.';
  var mk=mkOf(S,P);
  if(mk.show!=null&&S.week-mk.show<MAKE_SHOW_GAP)return 'A new weekly show comes along once in years. '+P.name+' launched one '+(S.week-mk.show)+' weeks ago. The next can be asked for after '+cal(mk.show+MAKE_SHOW_GAP).label+'.';
  if(S.week-(mk.t0||0)<MAKE_FIRST)return 'A network wants to see a year of your shows before it talks about another night. Ask after '+cal((mk.t0||0)+MAKE_FIRST).label+'.';
  if(!showOccasions(S,P).some(function(x){return x.open;}))return MAKE_SHOW_NONE;
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
  var cost=makeShowCost(P),occ=showOccasions(S,P).filter(function(x){return x.open;})[0],mk=mkOf(S,P);P.cash-=cost;var sh=addShow(S,P,name);
  mk.show=S.week;mk.img=P.image;sh.why=occ.n;mkLog(P,'show',name,occ.n).w=S.week;
  news(S,'world',P.name+' is launching a new weekly show, '+name+'. '+occ.n+': the network has given it another night.');
  note(S,'A new weekly show',name+' starts next week. Its first night is an occasion.','good');
  return {ok:true,roll:r,msg:rollText(r)+name+' starts next week as a small show, and its first night is an occasion: the building will be up for it. Launching it cost '+money(cost)+'. It brings television and gate money every week, and your roster now works one more night. '+P.name+' will not get another for two years.'};
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
/** Every occasion on which a company adds a belt, and whether it is open for this one now. Each says what the belt would be. */
function beltOccasions(S,P){
  var MD=modelOf(P),c=mkCount(S,P),out=[],gs=MD.gender?[MD.gender]:['M','F'],two=gs.length>1;
  var has=function(g,tag,lvl){return P.titles.some(function(t){return t.g===g&&!!t.tag===!!tag&&(lvl==null||t.lvl===lvl);});};
  var gw=function(g){return g==='F'?'women':'men';},pre=function(g){return two?(g==='F'?'women’s ':'men’s '):'';};
  gs.forEach(function(g){
    var n=c[g]||0,teams=c['t'+g]||0,ok;
    if(!has(g,false)){ok=n>=BELT_NEED.div;out.push({k:'div:'+g,g:g,tag:false,lvl:3,n:'A division with no title of its own',what:cap1(pre(g)+'top title'),open:ok,
      say:ok?'You have '+n+' '+gw(g)+' and no title for them to fight over.':'A division of its own needs '+BELT_NEED.div+' '+gw(g)+'. You have '+n+'.'});}
    else if(!has(g,false,2)){ok=n>=BELT_NEED.second;out.push({k:'second:'+g,g:g,tag:false,lvl:2,n:'A roster that has outgrown one title',what:cap1(pre(g)+'second title'),open:ok,
      say:ok?n+' '+gw(g)+' and one title between them. The middle of the card has nothing to fight for.':'A second '+pre(g)+'title needs '+BELT_NEED.second+' '+gw(g)+'. You have '+n+'.'});}
    else if(!has(g,false,1)){ok=n>=BELT_NEED.third;out.push({k:'third:'+g,g:g,tag:false,lvl:1,n:'A roster big enough for a third title',what:cap1(pre(g)+'third title'),open:ok,
      say:ok?n+' '+gw(g)+' and two titles. There is room for a third, for the ones on the way up.':'A third '+pre(g)+'title needs '+BELT_NEED.third+' '+gw(g)+'. You have '+n+'.'});}
    if(!has(g,true)){ok=teams>=BELT_NEED.tag;out.push({k:'tag:'+g,g:g,tag:true,lvl:3,n:'A tag team division',what:cap1(pre(g)+'tag team titles'),open:ok,
      say:ok?teams+' regular '+pre(g)+'teams and no belts for them.':cap1(pre(g))+(two?'tag':'Tag')+' team belts need '+BELT_NEED.tag+' regular teams. You have '+teams+'.'});}
  });
  P.shows.forEach(function(sh){
    if(!sh.since||sh.belt||S.week-sh.since>52)return;var g=gs[0];
    out.push({k:'show:'+sh.id,g:g,tag:false,lvl:has(g,false,2)?1:2,show:sh.id,n:'A new show that needs a title of its own',what:'A title for '+sh.name,open:true,say:sh.name+' is new and has no title of its own.'});
  });
  if(!out.some(function(x){return x.show;}))out.push({k:'show',g:gs[0],tag:false,lvl:2,n:'A new show that needs a title of its own',what:'A title for the new show',open:false,say:'No weekly show has been launched in the last year.'});
  return out;
}
var MAKE_BELT_NONE='Nothing has happened that calls for a new belt. A company adds one when a division has no title of its own, when it has the teams for tag belts, when its roster has outgrown the titles it has, or when a new show needs one.';
function makeBeltWait(S,P){
  var mk=mkOf(S,P);
  if(mk.belt!=null&&S.week-mk.belt<MAKE_BELT_GAP)return 'A new belt is a big moment. '+P.name+' introduced one '+(S.week-mk.belt)+' weeks ago. The next can come after '+cal(mk.belt+MAKE_BELT_GAP).label+'.';
  if(P.titles.length>=makeTitleMax(S,P))return 'A roster this size carries '+makeTitleMax(S,P)+' belts. Any more and none of them would mean much.';
  return '';
}
/** The occasion a request for a belt rests on: the one named, or one that is open for that kind of belt. */
function beltOccasion(S,P,o){
  var occ=beltOccasions(S,P);o=o||{};
  if(o.occ)return occ.filter(function(x){return x.k===o.occ;})[0]||null;
  var g=o.g==='F'?'F':(o.g==='M'?'M':null),open=occ.filter(function(x){return x.open&&(g==null||x.g===g)&&(o.tag==null||!!o.tag===x.tag);});
  return open.filter(function(x){return o.lvl!=null&&x.lvl===(o.lvl|0);})[0]||open[0]||null;
}
function makeTitleWhy(S,P,o){
  var wait=makeBeltWait(S,P);if(wait)return wait;
  var occ=beltOccasions(S,P);if(!occ.some(function(x){return x.open;}))return MAKE_BELT_NONE;
  var x=beltOccasion(S,P,o);
  if(!x)return o&&o.occ?'That is not an occasion for a new belt.':'Nothing has happened that calls for that kind of belt. Look at what is open.';
  if(!x.open)return x.say;
  if(P.cash<makeTitleCost(P))return 'Having the belt made costs '+money(makeTitleCost(P))+'. You do not have it.';
  return '';
}
function addTitle(S,P,o){
  var lvl=clamp(o.lvl|0,1,3),t={id:'x'+S.nid++,name:o.name,brand:null,g:o.g==='F'?'F':'M',lvl:lvl,tag:!!o.tag,holders:[],prestige:lvl===3?60:(lvl===2?45:35),defs:0,since:S.week,last:S.week,hist:[],born:S.week};
  P.titles.push(t);return t;
}
E.makeTitle=function(S,o){
  var P=S.promos[S.player];o=o||{};var name=makeCleanName(o.name,40),why=makeTitleWhy(S,P,o);
  if(why)return {ok:false,msg:why};
  if(name.length<3)return {ok:false,msg:'Give the belt a name first.'};
  if(P.titles.some(function(t){return t.name.toLowerCase()===name.toLowerCase();}))return {ok:false,msg:'You already have a belt called '+name+'.'};
  var x=beltOccasion(S,P,o),cost=makeTitleCost(P),mk=mkOf(S,P);
  P.cash-=cost;var t=addTitle(S,P,{name:name,g:x.g,lvl:x.lvl,tag:x.tag});
  mk.belt=S.week;t.why=x.n;mkLog(P,'belt',name,x.n).w=S.week;
  if(x.show){var sh=P.shows.filter(function(q){return q.id===x.show;})[0];if(sh)sh.belt=t.id;}
  news(S,'title',P.name+' unveiled a new belt: the '+name+'. '+x.n+'.');
  note(S,'A new belt','The '+name+' is made and vacant. The night its first champion is crowned is an occasion.','good');
  return {ok:true,id:t.id,msg:'The '+name+' is made and vacant. It cost '+money(cost)+'. A new belt starts with little prestige: good matches for it are what build it. Crown a first champion with a tournament on the Titles page, or book a match for it: that night is an occasion, and the crowd will be up for it. '+P.name+' will not add another belt for a year.'};
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
    beltOcc:beltOccasions(S,P).map(function(x){return {k:x.k,n:x.n,what:x.what,say:x.say,open:x.open,lvl:x.lvl,tag:x.tag,g:x.g};}),beltWait:makeBeltWait(S,P),beltWhy:makeTitleWhy(S,P,{}),
    showOcc:showOccasions(S,P).map(function(x){return {k:x.k,n:x.n,say:x.say,open:x.open};}),
    grown:(P.grown||[]).slice(),
    old:(P.oldTitles||[]).slice()
  };
};
E.makeTitleWhy=function(S,o){return makeTitleWhy(S,S.promos[S.player],o||{});};
E.makeTitleLevels=function(S,g,tag){return makeTitleLevels(S.promos[S.player],g==='F'?'F':'M',!!tag);};
E.MAKE_LVL={3:'Top title',2:'Second title',1:'Third title'};

/* ---------- rivals grow or shrink too, when something calls for it; and a show a company launched finds its audience ---------- */
function makePick(S,a){return a[Math.floor(rnd(S)*a.length)];}
/** Has this occasion come about since the game began? A rival does not add a belt for something that was always true of it. */
function rivalNew(x,c,c0){
  var k=x.k.split(':')[0],g=x.g;
  if(k==='show')return true;
  if(k==='tag')return (c0['t'+g]||0)<BELT_NEED.tag;
  return (c0[g]||0)<BELT_NEED[k];
}
/** A rival's look at itself, once a year. It does one thing at most: cancel a show it cannot carry, launch one on a boom, or add a belt. */
function rivalGrow(S,P){
  var MD=modelOf(P),mk=mkOf(S,P),ros=makeWrestlers(S,P),n=ros.length,k=P.shows.length,W=S.mkw||(S.mkw={belt:null,show:null});
  if(k>1&&(P.cash<0||n<10*k)){
    var sh=P.shows.filter(function(s){return s.since;}).pop()||P.shows[P.shows.length-1];removeShow(S,P,sh);mkLog(P,'cut',sh.name,P.cash<0?'The money ran out':'Not enough people to fill it').w=S.week;
    news(S,'world',P.name+' cancelled '+sh.name+'. '+(P.cash<0?'The company is losing money.':'The roster is too thin to fill it.'));return;
  }
  // another weekly show: only on a boom, with the people and the money for it, and not twice in two years
  // a third show waits until the ones the company launched have found their audience
  if(k<MAKE_SHOWS&&S.week-(mk.t0||0)>=MAKE_FIRST&&(mk.show==null||S.week-mk.show>=MAKE_SHOW_GAP)&&(W.show==null||S.week-W.show>=WORLD_SHOW_GAP)&&P.cash>0&&P.image>=mk.img+MAKE_BOOM+1&&P.image>=50+10*(k-1)&&n>=14*(k+1)&&P.shows.every(function(q){return !q.since||q.mult>=0.7;})){
    var used={};P.shows.forEach(function(s){MAKE_DAYS.forEach(function(d){if(s.name.indexOf(d)>=0)used[d]=1;});});
    var days=MAKE_DAYS.filter(function(d){return !used[d];}),sn=(days.length?makePick(S,days):'Sunday')+' Night '+makePick(S,MAKE_SHOW_WORDS);
    if(!P.shows.some(function(s){return s.name===sn;})){
      var was=Math.round(mk.img);addShow(S,P,sn).why='A company on a boom';mk.show=S.week;mk.img=P.image;W.show=S.week;mkLog(P,'show',sn,'A company on a boom').w=S.week;
      news(S,'world',P.name+' is launching a second night of television: '+sn+'. Its popularity has gone from '+was+' to '+Math.round(P.image)+', and the network wants more.');
      note(S,'Big news',P.name+' is launching a new weekly show, '+sn+'.','');return;
    }
  }
  // a belt: only when something that calls for one has come about since the game began, and not twice in a year
  if((mk.belt==null||S.week-mk.belt>=MAKE_BELT_GAP)&&(W.belt==null||S.week-W.belt>=WORLD_BELT_GAP)&&P.titles.length<makeTitleMax(S,P)){
    var c=mkCount(S,P),x=beltOccasions(S,P).filter(function(q){return q.open&&rivalNew(q,c,mk.c0);})[0];if(!x)return;
    var kind=x.k.split(':')[0],two=!MD.gender,word=null;
    if(kind==='show')word='Television';
    else if(kind==='second'||kind==='third'){var free=MAKE_TITLE_WORDS.filter(function(w){return w!=='Television'&&!P.titles.some(function(t){return t.name.indexOf(w)>=0;});});if(!free.length)return;word=makePick(S,free);}
    var nm=P.name+' '+(x.g==='F'&&two?'Women’s ':'')+(word?word+' ':(kind==='div'?'World ':''))+(x.tag?'Tag Team Titles':'Title');
    if(P.titles.some(function(t){return t.name===nm;}))return;
    var t=addTitle(S,P,{name:nm,g:x.g,lvl:x.lvl,tag:x.tag});t.why=x.n;mk.belt=S.week;W.belt=S.week;mkLog(P,'belt',nm,x.n).w=S.week;
    if(x.show){var s2=P.shows.filter(function(q){return q.id===x.show;})[0];if(s2)s2.belt=t.id;}
    news(S,'title',P.name+' introduced the '+nm+'. '+x.n+'.');
    note(S,'Big news',P.name+' has a new belt: the '+nm+'.','');
  }
}
/* the night a new belt gets its first champion, and the first night of a new show, are occasions */
CRX.push(function(ctx){var t=ctx.t;if(!ctx.isPl||!t||!t.born||t.crowned||t.holders.length)return null;return {d:3,x:'A first champion was being crowned'};});
POST.push(function(ctx){
  var t=ctx.t,r=ctx.res;if(ctx.S.cal||!t||!t.born||t.crowned||!r.seg.change)return;
  t.crowned=ctx.S.week;t.prestige=clamp(t.prestige+5,0,100);
  if(ctx.isPl)r.seg.notes.push(names(r.winners)+' '+(r.winners.length>1?'are':'is')+' the first to hold the '+t.name+'.');
});
PREX.push(function(S,P,show){var sh=P.shows.filter(function(q){return q.id===show.id;})[0];if(sh&&sh.since&&!sh.aired)S.hype=(S.hype||0)+0.08;});
SHOWX.push(function(S,P,show,rep){var sh=P.shows.filter(function(q){return q.id===show.id;})[0];if(sh&&sh.since&&!sh.aired){sh.aired=S.week;if(P.id===S.player)rep.firstNight=true;}});
WEEKX.push(function(S){
  var c=cal(S.week);
  // a show launched during the game grows a little on each anniversary while the company is doing well
  S.order.forEach(function(pid){var P=S.promos[pid];P.shows.forEach(function(sh){
    if(!sh.since||S.week<=sh.since||(S.week-sh.since)%48!==0||sh.mult>=0.8||(P.trend||0)<0)return;
    sh.mult=Math.round((sh.mult+0.1)*100)/100;sh.inc=Math.round(makeShowIncome(P,sh));
    if(pid===S.player)news(S,'money',sh.name+' has found its audience. The network gives it a better hour.');
  });});
  // each rival looks at itself once a year, in its own month, so the world does not all move in January
  if(c.wom===1)S.order.forEach(function(pid){if(pid!==S.player&&hash('mk'+pid)%12===c.month)rivalGrow(S,S.promos[pid]);});
});
