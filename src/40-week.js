/* ---------- the week ---------- */
function weekShows(S,P){
  var c=cal(S.week),out=P.shows.map(function(sh){return {id:sh.id,name:sh.name,brand:sh.brand||null,mult:sh.mult};});
  if(c.wom===4)out.push({id:'big',big:true,flag:c.month===P.flagship,brand:null,name:P.name+' '+dbOf(S).events[c.month],rule:(dbOf(S).rules&&dbOf(S).rules[c.month])||null});
  return out;
}
function startWeek(S){var P=S.promos[S.player];S.queue=weekShows(S,P);S.qi=0;S.card=[];grantBP(S);S.inbox=S.inbox.filter(function(e){return !e.done;});genEvents(S);}
function leaveCompany(S,w,why,quiet){
  var P=S.promos[w.promo];if(!P)return;
  vacateFor(S,P,w,why,quiet);var tm=teamOf(S,w);if(tm)dissolveTeam(S,tm);leaveStable(S,w);w.mgr=null;S.w.forEach(function(x){if(x.mgr===w.id)x.mgr=null;});
  S.feuds.forEach(function(f){if(!f.res&&(f.a.indexOf(w.id)>=0||f.b.indexOf(w.id)>=0)){f.res=true;f.dead=true;f.end=S.week;}});
  if(S.mystery&&S.mystery.v===w.id)S.mystery=null;
  S.quests=S.quests.filter(function(q){return q.w!==w.id&&q.a!==w.id&&q.b!==w.id;});
  S.inbox=S.inbox.filter(function(e){return e.done||e.w!==w.id;});
}
function joinCompany(S,w,P,wage,weeks){
  w.promo=P.id;w.brand=null;
  if(P.brands){var main=P.brands.filter(function(b){return !b.dev;}),dev=P.brands.filter(function(b){return b.dev;});w.brand=(w.ovr<55&&dev.length?dev[0]:main[Math.floor(rnd(S)*main.length)]).id;}
  w.wage=wage||wageFor(w.ovr,P);w.con=weeks||ri(S,48,96);w.o0=w.ovr;w.morale=75;modelJoin(S,w,P);w.cn=false;w.lu=S.week;w.deb=true;w.away=0;w.camp=false;w.ex=w.nw?1.1:(w.ovr>=P.image+8?4.4:(w.ovr>=P.image-2?3.5:(w.ovr>=P.image-12?2.6:(w.ovr>=P.image-22?1.8:1.1))));w.pos=w.ex;w.stress=0;w.ment=null;w.pk2=0;w.pb2=0;w.you=0;if(S.week>1)mile(S,w,'sign','Joined '+P.name);
}
function settle(S,P){
  var mine=P.id===S.player,sp=0;if(mine)S.sponsors.forEach(function(x){sp+=x.pay;});
  var adv=Math.round(ADV_C[P.adv]*P.inc0),camp=campCost(P),med=medCost(P);
  var L=P.led,merch=merchWeek(S,P),wages=wagesWeek(S,P),inc=L.tv+L.gate+L.ppv+L.bonus+merch+sp,over=P.fixed+P.varRate*(inc-sp),exp=wages+L.prod+over+adv+camp+med;
  var row={w:S.week,spons:sp,adv:adv,camp:camp,med:med,tv:Math.round(L.tv),gate:Math.round(L.gate),ppv:Math.round(L.ppv),bonus:Math.round(L.bonus),merch:Math.round(merch),wages:Math.round(wages),prod:Math.round(L.prod),over:Math.round(over),inc:Math.round(inc),exp:Math.round(exp),net:Math.round(inc-exp),image:r1(P.image)};
  P.cash+=row.net;row.cash=Math.round(P.cash);P.hist.push(row);if(P.hist.length>60)P.hist.shift();
  P.led={tv:0,gate:0,ppv:0,bonus:0,prod:0};
  return row;
}
E.endWeek=function(S){
  if(S.over)return;
  var PL=S.promos[S.player];
  S.order.forEach(function(pid){if(pid===S.player)return;var P=S.promos[pid];weekShows(S,P).forEach(function(sh){var card=autoBook(S,P,sh);if(card.length>=3)runShow(S,P,sh,card);});});
  S.order.forEach(function(pid){var P=S.promos[pid],row=settle(S,P);if(pid===S.player)S.fin=row;P.neg=P.cash<0?(P.neg||0)+1:0;});
  // roster upkeep
  var top={};S.order.forEach(function(pid){var o=rosterOf(S,pid).map(function(w){return w.ovr;}).sort(function(a,b){return b-a;});top[pid]=o[Math.floor(o.length/3)]||0;});
  S.w.forEach(function(w){
    if(w.promo==='FA')return;var P=S.promos[w.promo],mine=w.promo===S.player;
    if(w.inj>0){w.inj--;if(w.inj===0){w.ret=true;w.rw=S.week+1;if(mine)news(S,'injury',w.name+' is cleared to return.');}}
    if(w.away&&w.away===S.week)w.ret=true;
    w.cond=Math.min(100,w.cond+14);
    w.mom+=w.mom>0?-Math.min(0.5,w.mom):Math.min(0.5,-w.mom);
    if(w.inj<=0&&S.week-w.lu>=4){addOvr(P,w,-0.25);if(mine&&w.ovr>=top[w.promo]&&!modelOf(P).noTvEgo)w.morale=clamp(w.morale-2,0,100);}
    if(w.ovr>ovrCap(P,w))w.ovr-=0.1;
    var mt=mine?egoTarget(S,w):65;w.morale=clamp(w.morale+clamp((mt-w.morale)*0.08,-1.2,1.2),0,100);
    if(mine&&w.ovr>=w.o0+15)award(S,'ACH_STAR_MAKER');
    w.con--;
    if(w.con<=0){
      if(mine){news(S,'contract',w.name+'’s contract ran out. They are now a free agent.');leaveCompany(S,w,'contract expired');w.promo='FA';w.brand=null;}
      else if(chance(S,0.8)){w.con=ri(S,48,110);w.wage=wageFor(w.ovr,P);}
      else{var held=P.titles.filter(function(t){return t.holders.indexOf(w.id)>=0;});news(S,'contract',w.name+' has left '+P.name+' and is a free agent.'+(held.length?' The '+held.map(function(t){return t.name;}).join(' and the ')+' '+(held.length>1||held[0].tag?'are':'is')+' vacated.':''));leaveCompany(S,w,'left the company',held.length>0);w.cut={w:S.week,from:P.id,img:P.image};w.promo='FA';w.brand=null;}
    }
  });
  // feuds cool off if you leave them alone
  activeFeuds(S).forEach(function(f){
    if(f.last<S.week)f.heat=Math.max(0,f.heat-3);
    if(f.heat<=0||S.week-f.last>=5){f.res=true;f.dead=true;f.end=S.week;f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(w.promo===f.promo)addOvr(S.promos[f.promo],w,-0.5);});news(S,'story','The '+feudLabel(S,f)+' rivalry fizzles out.');}
  });
  var done=S.feuds.filter(function(f){return f.res;});if(done.length>12){var drop=done.slice(0,done.length-12);S.feuds=S.feuds.filter(function(f){return drop.indexOf(f)<0;});}
  // promises come due
  S.quests.slice().forEach(function(q){
    if(q.due>S.week)return;
    if(QEND[q.type])QEND[q.type](S,q);
    if(q.type==='shot'||q.type==='win'){var w=S.w[q.w];w.morale=clamp(w.morale-(q.type==='shot'?18:12),0,100);w.mom=clamp(w.mom-2,-10,10);news(S,'contract','You broke your promise to '+w.name+'. Morale drops.');keptPromise(S,q,false);}
    dropQuest(S,q);
  });
  // rivals pick up free agents
  S.order.forEach(function(pid){
    if(pid===S.player)return;var P=S.promos[pid],n=rosterOf(S,pid).length,short=(P.size0||n)-n;
    if(!chance(S,short>=3?0.6:0.2))return;
    // each company hires for its own system: the fit score, youth with potential, and for an underdog a recent castoff
    var M=modelOf(P),sc=function(w){return fitFor(S,P,w)+(w.age<=26?(w.pot-50)*0.4:0)-(w.age>=36?(w.age-35)*4:0);};
    var fa=S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw&&(!M.gender||w.g===M.gender)&&!(w.cut&&w.cut.from===pid&&S.week-w.cut.w<52)&&w.ovr<=P.image+(M.reach?M.reach-15:10)&&(short>=3||w.ovr>=P.image-45||(w.age<=24&&w.pot>=80));}).sort(function(a,b){return sc(b)-sc(a);});
    for(var k=0;k<(short>=8?2:1)&&k<fa.length;k++){joinCompany(S,fa[k],P);if(fa[k].ovr>=50)news(S,'contract',P.name+' signed free agent '+fa[k].name+'.');}
  });
  WEEKX.forEach(function(fn){fn(S);});
  var k,keys=Object.keys(S.recent);if(keys.length>4000)for(k=0;k<keys.length;k++)if(S.week-S.recent[keys[k]]>12)delete S.recent[keys[k]];
  if(S.week>=48)award(S,'ACH_YEAR');
  if(PL.image>=PL.image0+5)award(S,'ACH_IMAGE_UP');
  if(S.order.every(function(pid){return pid===S.player||S.promos[pid].image<PL.image;}))award(S,'ACH_NO1');
  if(PL.neg>=6){S.over={why:'bankrupt',week:S.week};award(S,'ACH_BROKE');news(S,'world',PL.name+' has run out of money.');return;}
  S.week++;startWeek(S);
};

/* ---------- the office: events with choices ---------- */
function hasQuest(S,id){return S.quests.some(function(q){return q.w===id||q.a===id||q.b===id;})||S.inbox.some(function(e){return !e.done&&e.w===id;});}
function money(n){return '$'+Math.round(n).toLocaleString('en-US');}
function pushEv(S,ev){if(!ev.checks)addChecks(S,ev);ev.id=S.nid++;ev.done=!ev.choices;ev.result=null;S.inbox.push(ev);return ev;}
var EV={
  shot:function(S,P,R){
    var c=R.filter(function(w){return w.mom>=2&&holdLvl(P,w.id)===0&&!hasQuest(S,w.id);}).sort(function(a,b){return b.mom-a.mom;});
    for(var i=0;i<c.length;i++){var w=c[i],t=null;
      P.titles.forEach(function(x){if(x.tag||x.g!==w.g||!x.holders.length||(x.brand&&x.brand!==w.brand))return;var ch=S.w[x.holders[0]];if(w.ovr>=ch.ovr-25&&w.ovr<=ch.ovr+12&&(!t||x.lvl>t.lvl))t=x;});
      if(t)return {type:'shot',w:w.id,title:t.id,text:w.name+' is on a roll and asks for a shot at the '+t.name+'.',choices:['Promise the shot within 6 weeks','Not yet']};}
    return null;
  },
  losing:function(S,P,R){
    var os=R.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),med=os[Math.floor(os.length/2)]||0;
    var c=R.filter(function(w){return w.ws<=-3&&w.ovr>=med&&!hasQuest(S,w.id);});if(!c.length)return null;
    var w=pick(S,c);return {type:'losing',w:w.id,text:w.name+' has lost '+(-w.ws)+' in a row and wants to know where this is going.',choices:['Promise a win within 2 weeks','Ask for patience']};
  },
  offer:function(S,P,R){
    var c=R.slice().sort(function(a,b){return b.ovr-a.ovr;}).slice(0,12).filter(function(w){return (w.con<=30||w.morale<55)&&!hasQuest(S,w.id)&&!(w.off>S.week);});if(!c.length)return null;
    var rv=S.order.filter(function(id){return id!==P.id&&S.promos[id].image>=P.image-25;}).sort(function(a,b){return S.promos[b].image-S.promos[a].image;});if(!rv.length)return null;
    var w=pick(S,c),raise=Math.round(w.wage*1.25/50)*50;w.off=S.week+10;
    return {type:'offer',w:w.id,rival:rv[0],raise:raise,text:S.promos[rv[0]].name+' has made '+w.name+' an offer.',choices:['Match it: '+money(raise)+' a week, new 48-week deal','Appeal to loyalty','Let them go']};
  },
  team:function(S,P,R){
    var c=R.filter(function(w){return w.team==null&&!hasQuest(S,w.id)&&!inFeud(S,w.id);});
    for(var k=0;k<12&&c.length>1;k++){var a=pick(S,c),bs=c.filter(function(w){return w.id!==a.id&&w.g===a.g&&w.align===a.align&&w.brand===a.brand&&Math.abs(w.ovr-a.ovr)<=8;});
      if(bs.length){var b=pick(S,bs);return {type:'team',w:a.id,o:b.id,text:a.name+' and '+b.name+' want to team up.',choices:['Make it official','No']};}}
    return null;
  },
  pitch:function(S,P,R){
    var c=R.filter(function(w){return w.mic>=60&&w.mom<=0&&!hasQuest(S,w.id)&&!inFeud(S,w.id);});if(!c.length)return null;
    var w=pick(S,c);return {type:'pitch',w:w.id,text:w.name+' pitches a '+(w.align==='F'?'heel':'face')+' turn to freshen things up.',choices:['Go with it','Keep things as they are']};
  },
  buzz:function(S,P,R){
    var c=R.filter(function(w){return w.ovr>=35&&w.ovr<=75&&S.week-w.lu<=2;});if(!c.length)return null;
    var w=pick(S,c);addOvr(P,w,2);w.mom=clamp(w.mom+3,-10,10);return {type:'buzz',w:w.id,text:w.name+' is catching fire with the fans. Overness and momentum are up.'};
  },
  mentor:function(S,P,R){
    var ps=R.filter(function(w){return w.pot-workRate(w)>=5&&w.ovr<60&&!hasQuest(S,w.id);});if(!ps.length)return null;
    var p=pick(S,ps),vs=R.filter(function(w){return w.id!==p.id&&w.g===p.g&&workRate(w)>=80&&w.ovr>=60&&w.brand===p.brand;});if(!vs.length)return null;
    var v=pick(S,vs);return {type:'mentor',w:p.id,o:v.id,text:v.name+' offers to take '+p.name+' under their wing.',choices:['Pair them up','Not now']};
  },
  dream:function(S,P,R){
    if(S.quests.some(function(q){return q.type==='dream';})||activeFeuds(S).length>=7)return null;
    var GX=mainG(S,P),L=R.filter(function(w){return w.align==='F'&&w.g===GX&&!inFeud(S,w.id)&&!hasQuest(S,w.id)&&!isDev(P,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,6);
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){var a=L[i],b=L[j],rk=S.recent[P.id+':'+rkey(a.id,b.id)];if((rk&&S.week-rk<10)||(a.team!=null&&a.team===b.team))continue;
      var due=S.week+(4-cal(S.week).wom)+(cal(S.week).wom===4?4:0),bonus=Math.round(P.inc0*0.1/1000)*1000;
      startFeud(S,P,a,b,35,'Fans are calling for '+a.name+' vs '+b.name,{kind:'dream'});
      S.quests.push({id:S.nid++,type:'dream',a:a.id,b:b.id,bonus:bonus,due:due+1,text:'Dream match: book '+a.name+' vs '+b.name+' at the next big event ('+money(bonus)+' in extra buys)'});
      return {type:'dream',w:a.id,o:b.id,text:'Fans are calling for a dream match: '+a.name+' vs '+b.name+'. Book it at the next big event for a boost in buys.'};}
    return null;
  },
  network:function(S,P){
    if(S.quests.some(function(q){return q.type==='network';}))return null;
    var sh=pick(S,P.shows),target=Math.round((P.mainB[sh.id]||75)+4),bonus=Math.round(P.inc0*0.04/1000)*1000;
    S.quests.push({id:S.nid++,type:'network',show:sh.id,target:target,bonus:bonus,due:S.week,text:'Network: main event of '+sh.name+' rated '+target+'% or better this week ('+money(bonus)+')'});
    return {type:'network',text:'The network wants a big main event on '+sh.name+' this week. '+target+'% or better pays a '+money(bonus)+' bonus.'};
  },
  sponsor:function(S,P){
    if(cal(S.week).wom!==4||S.quests.some(function(q){return q.type==='sponsor';}))return null;
    var target=Math.round(expected(P,{big:true})+3),bonus=Math.round(P.inc0*0.08/1000)*1000;
    S.quests.push({id:S.nid++,type:'sponsor',target:target,bonus:bonus,due:S.week,text:'Sponsor: big event rated '+target+'% or better ('+money(bonus)+')'});
    return {type:'sponsor',text:'A sponsor will pay '+money(bonus)+' if this month’s big event rates '+target+'% or better.'};
  }
};
function genEvents(S){
  var P=S.promos[S.player],all=rosterOf(S,P.id),R=all.filter(function(w){return w.inj<=0&&!w.camp&&!w.nw&&!w.retiring;});
  all.filter(function(w){return w.con<=6&&!w.cn;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,3).forEach(function(w){
    w.cn=true;var ask=renewAsk(S,w);
    pushEv(S,{type:'expire',w:w.id,ask:ask,text:w.name+'’s contract is up in '+Math.max(1,w.con)+' week'+(w.con>1?'s':'')+'. They want '+money(ask)+' a week to stay.',choices:['Renew for 48 weeks at '+money(ask),'Renew for 96 weeks at '+money(Math.round(ask*1.1/50)*50),'Let it run out']});
  });
  EVMAKE.forEach(function(fn){var e=fn(S,P,R);if(e)pushEv(S,e);});
  var types=['shot','losing','offer','team','pitch','buzz','mentor','dream','network','sponsor'],i,j,t;
  for(i=types.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=types[i];types[i]=types[j];types[j]=t;}
  if(S.week===1)types.unshift('network');else if(cal(S.week).wom===4)types.unshift('sponsor');
  var want=S.week===1?1:(chance(S,0.2)?0:(chance(S,0.45)?2:1)),made=0;
  if(cal(S.week).wom===4&&want<1)want=1;
  for(i=0;i<types.length&&made<want;i++){var ev=EV[types[i]](S,P,R);if(ev){pushEv(S,ev);made++;}}
}
function renewAsk(S,w){return Math.round(wageFor(w.ovr,S.promos[S.player])*(1.05+(70-w.morale)/200)*talkDiscount(S)*pledgeRenew(S)/50)*50;}
E.resolveEvent=function(S,id,choice){
  var ev=null;S.inbox.forEach(function(e){if(e.id===id)ev=e;});if(!ev||ev.done)return null;
  var P=S.promos[S.player],w=ev.w!=null?S.w[ev.w]:null,o=ev.o!=null?S.w[ev.o]:null,res='',roll;
  if(EVR[ev.type]){res=EVR[ev.type](S,ev,choice,P,w,o);ev.done=true;ev.result=res;return res;}
  if(ev.type==='shot'){
    if(choice===0){var t=titleById(P,ev.title);S.quests.push({id:S.nid++,type:'shot',w:w.id,title:ev.title,due:S.week+6,text:'Promise: give '+w.name+' a '+t.name+' match by '+cal(S.week+6).label});w.morale=clamp(w.morale+8,0,100);res='You gave your word. '+w.name+' is fired up.';}
    else{w.morale=clamp(w.morale-6,0,100);res=w.name+' is not happy, but accepts it for now.';}
  }else if(ev.type==='losing'){
    if(choice===0){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+2,text:'Promise: book a win for '+w.name+' by '+cal(S.week+2).label});w.morale=clamp(w.morale+5,0,100);res='You promised a win. '+w.name+' will hold you to it.';}
    else{roll=ri(S,1,100);if(roll<=w.morale){w.morale=clamp(w.morale-2,0,100);res='You ask for patience. '+w.name+' agrees to wait.';}else{w.morale=clamp(w.morale-10,0,100);res='You ask for patience. '+w.name+' storms out. Morale drops.';}}
  }else if(ev.type==='offer'){
    var RV=S.promos[ev.rival];
    if(choice===0){w.wage=ev.raise;w.con=48;w.cn=false;w.morale=clamp(w.morale+6,0,100);res=w.name+' re-signs for '+money(ev.raise)+' a week.';}
    else{var stay=false;if(choice===1){roll=ri(S,1,100);stay=roll<=w.morale;res='You make your case. ';}
      if(stay){w.con=Math.max(w.con,24);w.morale=clamp(w.morale+2,0,100);res+=w.name+' stays.';}
      else{leaveCompany(S,w,'left for '+RV.name);joinCompany(S,w,RV);news(S,'contract',w.name+' has jumped to '+RV.name+'.');res+=w.name+' signs with '+RV.name+'.';}}
  }else if(ev.type==='team'){
    if(choice===0&&w.team==null&&o.team==null){formTeam(S,P,w,o,10);w.morale=clamp(w.morale+4,0,100);o.morale=clamp(o.morale+4,0,100);news(S,'story','New team: '+w.name+' & '+o.name+'.');res=w.name+' & '+o.name+' are now a team.';}
    else res='They stay singles wrestlers.';
  }else if(ev.type==='pitch'){
    if(choice===0){var need=Math.round(40+w.mic/2);roll=ri(S,1,100);turn(S,w,'a new attitude');if(roll<=need){addOvr(P,w,3);w.mom=clamp(w.mom+3,-10,10);res='The turn lands. Overness up.';}else{addOvr(P,w,-2.5);res='The crowd does not buy it. Overness down.';}}
    else{w.morale=clamp(w.morale-3,0,100);res=w.name+' shrugs it off.';}
  }else if(ev.type==='mentor'){
    if(choice===0){var up=function(v){return Math.min(99,v+2);};w.brawl=up(w.brawl);w.tech=up(w.tech);w.speed=up(w.speed);o.morale=clamp(o.morale+3,0,100);res=w.name+' is already picking things up from '+o.name+'.';}
    else res='Maybe another time.';
  }else if(ev.type==='expire'){
    if(choice===0||choice===1){w.wage=choice===0?ev.ask:Math.round(ev.ask*1.1/50)*50;w.con=choice===0?48:96;w.cn=false;w.morale=clamp(w.morale+3,0,100);res=w.name+' re-signs for '+money(w.wage)+' a week.';}
    else res=w.name+' will leave when the contract ends.';
  }
  ev.done=true;ev.result=res;return res;
};

