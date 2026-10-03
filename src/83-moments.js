/* ---------- moments from wrestling history ----------
   Situations modelled on famous nights, under invented names. Each is an inbox event with three or four choices, an attempt where luck
   matters, and results that last for weeks. A moment can turn up about once every ten weeks, when the story is in place for it.
   MOM[id] = {make(S,P,R) -> event or null, res(S,ev,choice,P,w,o) -> text}. Follow-ups are kept in S.after and run when due. */
var MOM={},AFTER={};
function momTop(P){var best=null;P.titles.forEach(function(t){if(!t.tag&&t.holders.length&&(!best||t.lvl>best.lvl))best=t;});return best;}
function momMine(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.inj<=0;});}
function momLater(S,wks,key,args){(S.after||(S.after=[])).push({w:S.week+Math.max(1,wks),k:key,a:args||{}});}
function momLose(S,w,why){var P=S.promos[w.promo];leaveCompany(S,w,why);w.cut={w:S.week,from:P.id,img:P.image};w.promo='FA';w.brand=null;}
WEEKX.push(function(S){
  if(!S.after||!S.after.length)return;var due=S.after.filter(function(x){return x.w<=S.week;});
  S.after=S.after.filter(function(x){return x.w>S.week;});due.forEach(function(x){if(AFTER[x.k])AFTER[x.k](S,x.a);});
});
EVMAKE.push(function(S,P,R){
  if(S.cal||S.week<8||(S.momWeek!=null&&S.week-S.momWeek<10)||!chance(S,0.22))return null;
  var ids=Object.keys(MOM),i,j,t;for(i=ids.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=ids[i];ids[i]=ids[j];ids[j]=t;}
  for(i=0;i<ids.length;i++){var ev=MOM[ids[i]].make(S,P,R);if(ev){ev.type='mom';ev.mid=ids[i];S.momWeek=S.week;return ev;}}
  return null;
});
EVR.mom=function(S,ev,choice,P,w,o){return MOM[ev.mid].res(S,ev,choice,P,w,o);};
E.momentIds=function(){return Object.keys(MOM);};

/* 79. The champion who is leaving */
MOM.leaving={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var ch=S.w[t.holders[0]];if(!ch||ch.con>8||ch.retiring||ch.nw)return null;var big=E.nextBig(S);
    return {w:ch.id,title:t.id,wks:Math.max(1,big.week-S.week),text:ch.name+'’s contract ends the night of '+big.name+', and word is out that they will not lose the '+t.name+' in front of that crowd. What do you do?',
      choices:['Trust them and book the finish as planned','Change the finish behind their back','Strip the title now','Pay to keep them'],
      checks:{0:mkCheck(7,[moraleMod(ch),trustMod(S)]),1:mkCheck(8,skillMods(S,'creative').concat([{n:'They are not watching the card',v:ch.mic<70?1:0}]))}};
  },
  res:function(S,ev,c,P,w){
    var t=titleById(P,ev.title),r;
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;
      if(r.ok){w.morale=clamp(w.morale+6,0,100);S.trust=clamp(S.trust+3,0,100);momLater(S,ev.wks,'leaveGood',{w:w.id,t:t.id});return rollText(r)+w.name+' gives you their word and keeps it. The title will change hands on the night and they leave on good terms.';}
      momLater(S,ev.wks,'leaveBad',{w:w.id,t:t.id});return rollText(r)+w.name+' smiles and says nothing. You have a bad feeling about the big show.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;
      if(r.ok){momLater(S,ev.wks,'leaveForced',{w:w.id,t:t.id});return rollText(r)+'The new finish is in the booker’s head and nobody else’s. '+w.name+' suspects nothing. For now.';}
      t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-8,10,100);S.trust=clamp(S.trust-4,0,100);momLose(S,w,'walked out');news(S,'title',w.name+' found out about the finish and walked out with the '+P.name+' '+t.name+'.');
      return rollText(r)+w.name+' found out and walked out of the building tonight with the title. It will be on every dirt sheet.';}
    if(c===2){t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-3,10,100);w.morale=clamp(w.morale-15,0,100);w.con=Math.min(w.con,2);news(S,'title',P.name+' stripped '+w.name+' of the '+t.name+'.');
      return 'You strip '+w.name+' of the title before anything can happen. Safe, and a little cold. They will not forget it.';}
    var cost=w.wage*12;P.cash-=cost;w.wage=Math.round(w.wage*1.15/50)*50;w.con=48;w.cn=false;w.morale=clamp(w.morale+8,0,100);
    momMine(S).filter(function(x){return x.id!==w.id&&x.ovr>=w.ovr-8;}).forEach(function(x){x.morale=clamp(x.morale-2,0,100);});
    return 'You pay '+money(cost)+' up front and a raise to '+money(w.wage)+' a week. '+w.name+' stays, and the other top names notice what it took.';
  }
};
AFTER.leaveGood=function(S,a){var w=S.w[a.w],P=S.promos[S.player],t=titleById(P,a.t);if(!w||w.promo!==P.id)return;t.holders=[];t.since=S.week;news(S,'title',w.name+' put the '+t.name+' over at the big show and left '+P.name+' on good terms. The title is vacant.');momLose(S,w,'contract ended');};
AFTER.leaveBad=function(S,a){var w=S.w[a.w],P=S.promos[S.player],t=titleById(P,a.t);if(!w||w.promo!==P.id)return;t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-6,10,100);S.trust=clamp(S.trust-3,0,100);news(S,'title',w.name+' refused to lose and left with the '+t.name+' on their shoulder. The crowd went home angry.');momLose(S,w,'walked out');};
AFTER.leaveForced=function(S,a){var w=S.w[a.w],P=S.promos[S.player],t=titleById(P,a.t);if(!w||w.promo!==P.id)return;t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-2,10,100);news(S,'title',w.name+' lost the '+t.name+' on the night as booked, and left '+P.name+' furious about it.');momLose(S,w,'contract ended');};

/* 80. The belt on the wrong show */
MOM.beltElsewhere={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var ch=S.w[t.holders[0]];if(!ch||ch.con>4||ch.nw||ch.morale>55)return null;var rv=S.order.filter(function(id){return id!==S.player&&S.promos[id].image>=P.image-20;});if(!rv.length)return null;var RV=S.promos[pick(S,rv)];
    return {w:ch.id,title:t.id,rv:RV.id,text:ch.name+' has walked out and turned up on '+RV.name+'’s broadcast, holding your '+t.name+' over their head. The phones in your office are ringing.',
      choices:['Take them to court for the belt','Laugh it off and mock them on air','Crown a new champion in a hurry'],
      checks:{0:mkCheck(8,skillMods(S,'talk').concat([trustMod(S)])),1:mkCheck(7,skillMods(S,'creative'))}};
  },
  res:function(S,ev,c,P,w){
    var t=titleById(P,ev.title),RV=S.promos[ev.rv],r;t.holders=[];t.since=S.week;momLose(S,w,'walked out with the belt');joinCompany(S,w,RV,null,48);news(S,'title',w.name+' walked out of '+P.name+' with the '+t.name+' and appeared on '+RV.name+'’s show.');
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;P.cash-=90000;if(r.ok){t.prestige=clamp(t.prestige+3,10,100);RV.rel=clamp((RV.rel||0)-10,-100,100);return rollText(r)+'The lawyers get the belt back inside the week. It costs '+money(90000)+' and you are the injured party for once. The title is vacant and its prestige is up.';}
      P.image=clamp(P.image-0.3,5,100);P.cash-=60000;return rollText(r)+'The case drags. You spend '+money(150000)+' and the papers call you petty.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){S.hype=(S.hype||0)+0.06;P.image=clamp(P.image+0.2,5,100);return rollText(r)+'Your next show opens with a joke at their expense. The crowd loves it and the story is yours now.';}
      S.rateMod=(S.rateMod||0)-2;return rollText(r)+'The joke dies on air. The belt is still on their show and you look small.';}
    momMine(S).filter(function(x){return x.g===w.g;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,4).forEach(function(x){x.morale=clamp(x.morale+4,0,100);});
    return 'You declare the title vacant and book a hunt for its next champion. The top contenders are suddenly very keen.';
  }
};

/* 81. The live microphone */
MOM.liveMic={
  make:function(S,P){
    var c=momMine(S).filter(function(w){return w.mic>=65&&w.morale<50&&w.ovr>=P.image-15;}).sort(function(a,b){return a.morale-b.morale;})[0];if(!c)return null;
    return {w:c.id,text:c.name+' has real grievances about their booking, and tonight, live on the air, they have gone off script. The director is shouting in your ear. What do you do?',
      choices:['Cut the feed','Let it run','Fine them after the show'],checks:{0:mkCheck(7,skillMods(S,'talk')),1:mkCheck(8,[{n:'Charisma '+c.mic,v:c.mic>=80?2:1}].concat(skillMods(S,'creative')))}};
  },
  res:function(S,ev,c,P,w){
    var r;
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;w.morale=clamp(w.morale-6,0,100);if(r.ok){return rollText(r)+'The feed cuts to a video package before anyone at home understands. '+w.name+' storms out. The damage stays inside the building.';}
      P.image=clamp(P.image-0.3,5,100);return rollText(r)+'The cut is clumsy and the viewers see all of it anyway. Worse, it looks like you were afraid of them.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;
      if(r.ok){addOvr(P,w,3);w.mom=clamp(w.mom+4,-10,10);w.morale=clamp(w.morale+10,0,100);S.hype=(S.hype||0)+0.06;news(S,'story',w.name+' went off script live and the crowd has not stopped talking about it.');return rollText(r)+'You let it run. It is the best thing on the show: raw, angry and true. '+w.name+' has made a name for themselves tonight.';}
      P.image=clamp(P.image-0.5,5,100);w.morale=clamp(w.morale-4,0,100);return rollText(r)+'You let it run, and it turns into a rant that goes nowhere. The company looks out of control.';}
    w.morale=clamp(w.morale-12,0,100);S.trust=clamp(S.trust-2,0,100);stressAdd(S,w,15);return 'You fine '+w.name+' after the show. They pay it, and the grievance stays exactly where it was.';
  }
};

/* 82. The curtain call */
MOM.curtainCall={
  make:function(S,P){
    var vet=momMine(S).filter(function(w){return w.retiring;})[0];if(!vet)return null;
    var f=activeFeuds(S).filter(function(x){return x.promo===P.id&&x.heat>=35&&S.w[x.a[0]].inj<=0&&S.w[x.b[0]].inj<=0;})[0];if(!f)return null;var a=S.w[f.a[0]],b=S.w[f.b[0]];
    return {w:a.id,o:b.id,vet:vet.id,feud:f.id,text:'At '+vet.name+'’s farewell, '+a.name+' and '+b.name+', who are supposed to hate each other, embrace in the ring. The locker room loved it. The story you spent weeks building did not. Someone has to answer for it.',
      choices:['Punish both of them','Punish only '+(a.ovr<b.ovr?a.name:b.name),'Let it go'],checks:{}};
  },
  res:function(S,ev,c,P,a,b){
    var f=S.feuds.filter(function(x){return x.id===ev.feud;})[0],junior=a.ovr<b.ovr?a:b,senior=junior===a?b:a;
    if(c===0){a.morale=clamp(a.morale-8,0,100);b.morale=clamp(b.morale-8,0,100);S.trust=clamp(S.trust-1,0,100);if(f)heatUp(S,f,6,'Punished for the farewell hug');return 'You punish both. The feud is saved and the room goes quiet. Nobody hugs anyone for a while.';}
    if(c===1){junior.morale=clamp(junior.morale-12,0,100);junior.mom=clamp(junior.mom-2,-10,10);senior.morale=clamp(senior.morale+3,0,100);S.trust=clamp(S.trust-3,0,100);if(f)heatUp(S,f,6,'Punished for the farewell hug');return 'You punish '+junior.name+' only, because you cannot afford to punish '+senior.name+'. Everyone sees exactly what that means. '+junior.name+' will remember it.';}
    S.trust=clamp(S.trust+3,0,100);if(f){f.heat=Math.max(0,f.heat-20);f.log.push({w:S.week,t:'The farewell hug took the edge off'});}return 'You let it go. The room is grateful, and the feud has lost a little of its poison. You will have to rebuild it.';
  }
};

/* 83. The title handed over */
MOM.handed={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var ch=S.w[t.holders[0]];if(!ch||!ch.stable)return null;var st=S.stables.filter(function(s){return s.id===ch.stable;})[0];if(!st)return null;
    var fr=st.m.map(function(id){return S.w[id];}).filter(function(x){return x&&x.id!==ch.id&&x.promo===P.id&&x.g===ch.g&&x.inj<=0;})[0];if(!fr)return null;
    return {w:ch.id,o:fr.id,title:t.id,text:'The leader of '+st.name+' wants the '+t.name+' passed to their friend '+fr.name+' without a real match. They have the room behind them and they are not asking twice.',
      choices:['Agree','Refuse','Offer a title match with strings attached'],checks:{1:mkCheck(9,skillMods(S,'talk').concat([trustMod(S)])),2:mkCheck(7,skillMods(S,'talk').concat([ownerMod(S)]))}};
  },
  res:function(S,ev,c,P,ch,fr){
    var t=titleById(P,ev.title),r;
    if(c===0){t.holders=[fr.id];t.since=S.week;t.defs=0;t.last=S.week;t.prestige=clamp(t.prestige-12,10,100);ch.morale=clamp(ch.morale+8,0,100);S.trust=clamp(S.trust-2,0,100);news(S,'title',ch.name+' handed the '+t.name+' to '+fr.name+' without a match. The fans are not impressed.');return 'You agree. The title changes hands in a back room, then on air. Its prestige drops by twelve points. The stable is delighted.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){S.trust=clamp(S.trust+3,0,100);ch.morale=clamp(ch.morale-5,0,100);return rollText(r)+'You say no, and you hold it. The stable sulks and the title keeps its meaning.';}
      ch.morale=clamp(ch.morale-14,0,100);stressAdd(S,ch,14);S.trust=clamp(S.trust-3,0,100);if(ch.align===fr.align)turn(S,ch,'turned on the office');return rollText(r)+'They do not take no for an answer. '+ch.name+' now acts as if the office is the enemy, and the room is watching.';}
    r=rollCheck(S,ev.checks[2]);ev.roll=r;
    if(r.ok){S.quests.push({id:S.nid++,type:'shot',w:fr.id,title:t.id,due:S.week+6,text:'Promise: give '+fr.name+' a '+t.name+' match by '+cal(S.week+6).label});ch.morale=clamp(ch.morale+2,0,100);return rollText(r)+'They accept a real match for '+fr.name+' within six weeks. The title keeps its meaning and the stable keeps its pride.';}
    ch.morale=clamp(ch.morale-8,0,100);return rollText(r)+'They laugh at the offer and walk out. The champion is still on side, just about.';
  }
};

/* 84. The surprise arrival */
MOM.arrival={
  make:function(S,P){
    var rv=S.order.filter(function(id){return id!==S.player;}).map(function(id){return S.promos[id];}).sort(function(a,b){return b.image-a.image;})[0];if(!rv)return null;
    var star=rosterOf(S,rv.id).filter(function(w){return !w.nw&&holdLvl(rv,w.id)>0;}).sort(function(a,b){return b.ovr-a.ovr;})[0];if(!star||star.ovr<P.image)return null;var fee=Math.round(star.wage*10/1000)*1000+25000;
    return {w:star.id,rv:rv.id,fee:fee,text:rv.name+'’s biggest star, '+star.name+', has a free night and is willing to walk onto your show unannounced for '+money(fee)+'. Your locker room is watching what you do.',
      choices:['Pay '+money(fee)+' and spring it','Decline','Tease it on the air and decide later'],checks:{2:mkCheck(7,skillMods(S,'creative'))}};
  },
  res:function(S,ev,c,P,star){
    var RV=S.promos[ev.rv],r;
    if(c===0){P.cash-=ev.fee;S.hype=(S.hype||0)+0.1;S.rateMod=(S.rateMod||0)+2;RV.rel=clamp((RV.rel||0)-8,-100,100);momMine(S).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,5).forEach(function(x){x.morale=clamp(x.morale-2,0,100);});news(S,'story',star.name+' walked onto a '+P.name+' show unannounced.');return 'You pay '+money(ev.fee)+'. The building erupts. Your top names grumble about who is getting paid, and '+RV.name+' will remember this.';}
    if(c===1){S.trust=clamp(S.trust+2,0,100);RV.rel=clamp((RV.rel||0)+3,-100,100);return 'You decline. Your own people notice that you backed them over a famous name.';}
    r=rollCheck(S,ev.checks[2]);ev.roll=r;if(r.ok){S.hype=(S.hype||0)+0.07;return rollText(r)+'The tease runs all week. The building is full of people wondering who is coming. You keep your money and your option.';}
    return rollText(r)+'The tease lands flat, and by the time you call, '+star.name+' has other plans.';
  }
};

/* 85. Giving away their result */
MOM.spoiler={
  make:function(S,P){
    var rv=S.order.filter(function(id){return id!==S.player;}).map(function(id){return S.promos[id];}).sort(function(a,b){return b.image-a.image;})[0];if(!rv||!rv.last||rv.image<P.image-10)return null;
    return {rv:rv.id,text:'Your show goes out live tonight. '+rv.name+'’s was taped last week, and one of your staff knows exactly how its big match ended. Spoil it on air and some of their audience will switch over. It is also not the kind of thing people forgive.',
      choices:['Spoil it on air','Leave it alone'],checks:{0:mkCheck(7,skillMods(S,'creative'))}};
  },
  res:function(S,ev,c,P){
    var RV=S.promos[ev.rv],r;
    if(c===1){S.trust=clamp(S.trust+1,0,100);return 'You leave it alone. The pettiness would have cost more than it won.';}
    r=rollCheck(S,ev.checks[0]);ev.roll=r;RV.rel=clamp((RV.rel||0)-12,-100,100);RV.image=clamp(RV.image-0.3,5,100);
    if(r.ok){S.hype=(S.hype||0)+0.07;P.image=clamp(P.image+0.2,5,100);news(S,'world',P.name+' spoiled '+RV.name+'’s taped main event on the air. Their viewers are furious. Some of them are watching '+P.name+'.');return rollText(r)+'You spoil it. Their viewers flood your lines and your numbers jump. '+RV.name+' will not forget this.';}
    P.image=clamp(P.image-0.4,5,100);return rollText(r)+'The spoiler gets out, but the story turns on you: “petty”, they call it. Their viewers stay where they are and yours are embarrassed.';
  }
};

/* 86. The walkout */
MOM.walkout={
  make:function(S,P){
    var L=momMine(S).filter(function(w){return w.morale<38&&w.ovr>=P.image-20;}).sort(function(a,b){return a.morale-b.morale;});if(L.length<2)return null;var a=L[0],b=L[1];
    return {w:a.id,o:b.id,text:a.name+' and '+b.name+', both unhappy with their booking, have left the building before a live show. You have ten minutes.',
      choices:['Rebook the card in ten minutes','Suspend them both','Go after them yourself'],checks:{2:mkCheck(8,skillMods(S,'talk').concat([trustMod(S)]))}};
  },
  res:function(S,ev,c,P,a,b){
    var r;
    if(c===0){S.rateMod=(S.rateMod||0)-2;a.morale=clamp(a.morale-4,0,100);b.morale=clamp(b.morale-4,0,100);return 'You rebuild the card on the back of an envelope. The show gets through it, a little thinner. Their grievance is still there on Monday.';}
    if(c===1){a.away=S.week+4;b.away=S.week+4;a.morale=clamp(a.morale-10,0,100);b.morale=clamp(b.morale-10,0,100);S.trust=clamp(S.trust-2,0,100);return 'You suspend them both for four weeks. Order is order, and the rest of the room sees it. Some of them see the unhappiness behind it too.';}
    r=rollCheck(S,ev.checks[2]);ev.roll=r;if(r.ok){a.morale=clamp(a.morale+10,0,100);b.morale=clamp(b.morale+10,0,100);S.trust=clamp(S.trust+3,0,100);return rollText(r)+'You find them in the car park and hear them out. They come back for the main event, and they come back as yours.';}
    momLose(S,b,'walked out');b.morale=40;a.morale=clamp(a.morale-6,0,100);return rollText(r)+'You find them, and it goes badly. '+a.name+' comes back. '+b.name+' does not, and has left the company.';
  }
};

/* 87. Not fit to perform */
MOM.unfit={
  make:function(S,P){
    if(!S.queue.some(function(sh){return sh.big;}))return null;var star=momMine(S).sort(function(a,b){return b.ovr-a.ovr;})[0];if(!star||star.ovr<P.image)return null;
    return {w:star.id,text:star.name+' has arrived at the biggest show of the year in no state to wrestle. Everyone can see it and nobody wants to say it.',
      choices:['Send them out anyway','Swap the match','Tell the crowd the truth'],checks:{0:mkCheck(8,[moraleMod(star),{n:'Veteran',v:star.age>=33?1:0}].concat(skillMods(S,'motivator')))}};
  },
  res:function(S,ev,c,P,w){
    var r;
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;if(r.ok){addOvr(P,w,1);w.morale=clamp(w.morale+5,0,100);S.rateMod=(S.rateMod||0)-1;return rollText(r)+w.name+' somehow gets through it. Not their best night, but nobody will remember anything except the finish.';}
      S.rateMod=(S.rateMod||0)-6;w.inj=Math.max(w.inj,2);return rollText(r)+w.name+' cannot get through it. The match is a mess and they are hurt for two weeks.';}
    if(c===1){S.rateMod=(S.rateMod||0)-2;w.morale=clamp(w.morale-4,0,100);w.away=S.week+1;return 'You swap the match and rest '+w.name+'. The show loses a little shine, and they are grateful, in a quiet way.';}
    S.hype=(S.hype||0)+0.04;S.rateMod=(S.rateMod||0)+1;w.mom=clamp(w.mom-3,-10,10);w.away=S.week+2;news(S,'story',P.name+' told the crowd the truth about '+w.name+'’s condition.');return 'You tell the crowd. They take it well, and sympathy fills the building. '+w.name+' loses some of their aura and rests for two weeks.';
  }
};

/* 88. The wrong hero */
MOM.wrongHero={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var hero=S.w[t.holders[0]];if(!hero||hero.align!=='F'||hero.nw)return null;
    var vil=momMine(S).filter(function(w){return w.align==='H'&&w.g===hero.g&&w.mic>=70&&w.id!==hero.id;}).sort(function(a,b){return b.mic-a.mic;})[0];if(!vil)return null;
    return {w:hero.id,o:vil.id,title:t.id,text:'The crowd is booing '+hero.name+', the hero you spent a year building, and cheering '+vil.name+', the villain, louder than they have cheered anyone. The big match is tonight. What do you do?',
      choices:['Change the finish: let the villain win','Hold your nerve'],checks:{1:mkCheck(8,skillMods(S,'creative').concat([{n:'Momentum '+Math.round(hero.mom),v:hero.mom>=2?1:(hero.mom<=-3?-1:0)}]))}};
  },
  res:function(S,ev,c,P,hero,vil){
    var t=titleById(P,ev.title),r;
    if(c===0){t.holders=[vil.id];t.since=S.week;t.defs=0;t.last=S.week;hero.morale=clamp(hero.morale-8,0,100);vil.mom=clamp(vil.mom+3,-10,10);vil.morale=clamp(vil.morale+8,0,100);S.rateMod=(S.rateMod||0)+2;news(S,'title',vil.name+' won the '+t.name+' from '+hero.name+' as the crowd roared. A hero has been made of the villain.');if(vil.align==='H')turn(S,vil,'the crowd made them a hero');return 'You change the finish on the night. '+vil.name+' wins the title to the loudest noise of the year, and the crowd has told you who its hero is. '+hero.name+' will take some talking round.';}
    r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){hero.mom=clamp(hero.mom+3,-10,10);addOvr(P,hero,2);return rollText(r)+'You hold your nerve. By the end of the match the crowd has come round. '+hero.name+' has earned it the hard way.';}
    S.rateMod=(S.rateMod||0)-4;hero.mom=clamp(hero.mom-3,-10,10);return rollText(r)+'You hold, and the crowd does not come round. The finish is met with silence, and '+hero.name+' knows it.';
  }
};
/* for tests: build a moment now, if the story for it is in place, and put it in the inbox */
E.momentForce=function(S,id){var P=S.promos[S.player],ev=MOM[id]&&MOM[id].make(S,P,rosterOf(S,P.id));if(!ev)return null;ev.type='mom';ev.mid=id;return pushEv(S,ev);};
