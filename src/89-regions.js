/* ---------- regions: where the world likes what ---------- */

/* ---------- 55. Tours abroad (P.tour) and the regions' tastes; 64 extends the tastes to the home region ---------- */
var REGIONS=[
  {id:'iron',n:'the Iron Coast',taste:'brawl',d:'Dockworkers and mill towns. They come for a fight.'},
  {id:'garden',n:'the Garden Cities',taste:'spectacle',d:'Big halls and bigger entrances.'},
  {id:'reach',n:'the Eastern Reach',taste:'work',d:'Students of the sport. They count the holds.'},
  {id:'high',n:'the Highlands',taste:'brawl',d:'Hard people who like it hard.'},
  {id:'isles',n:'the Sunlit Isles',taste:'spectacle',d:'Colour, noise and flyers.'}
];
var TASTEN={brawl:'brawling',work:'work rate',spectacle:'spectacle'};
function homeReg(P){return hash('reg'+P.id)%REGIONS.length;}
E.REGIONS=REGIONS;E.TASTEN=TASTEN;
E.homeRegion=function(S){var P=S.promos[S.player];return REGIONS[homeReg(P)];};
function tourCost(P,weeks){return Math.round(P.inc0*(0.02+0.025*weeks)*(1-TRV_R[P.trv||0]*0.5));}
function tourBoost(S,P){
  if(!P.tour)return 1;var f=(P.fol&&P.fol[P.tour.reg])||0;
  return 1.3+f/250;
}
E.tourInfo=function(S){
  var P=S.promos[S.player],home=homeReg(P);
  return {tour:P.tour?{reg:REGIONS[P.tour.reg],left:P.tour.left,weeks:P.tour.weeks,earned:Math.round(P.tour.earned||0)}:null,
    options:REGIONS.map(function(r,i){return {id:i,reg:r,home:i===home,fol:Math.round((P.fol&&P.fol[i])||0),cost2:tourCost(P,2),cost3:tourCost(P,3)};}).filter(function(o){return !o.home;}),
    follow:REGIONS.map(function(r,i){return {reg:r,fol:Math.round((P.fol&&P.fol[i])||0)};}).filter(function(o){return o.fol>=1;})};
};
E.startTour=function(S,reg,weeks){
  var P=S.promos[S.player],r=REGIONS[reg];if(!r||reg===homeReg(P))return {ok:false,text:'Pick a region away from home.'};
  if(P.tour)return {ok:false,text:'You are already on tour.'};
  if(weeks!==2&&weeks!==3)return {ok:false,text:'A tour is two or three weeks.'};
  if(S.week-(P.tourEnd||-99)<8)return {ok:false,text:'The roster needs eight weeks at home first.'};
  var c=tourCost(P,weeks);if(P.cash<c)return {ok:false,text:'A '+weeks+'-week tour costs '+money(c)+' up front.'};
  P.cash-=c;P.tour={reg:reg,left:weeks,weeks:weeks,earned:0,start:S.week};
  news(S,'story',P.name+' set out on a '+weeks+'-week tour of '+r.n+'.');
  return {ok:true,text:'The tour of '+r.n+' starts now and lasts '+weeks+' weeks. It cost '+money(c)+'. Crowds will be bigger. The roster will be worn out by the end.'};
};
/* a tour brings bigger crowds, and wears the whole roster down */
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];
  P.fol=P.fol||{};Object.keys(P.fol).forEach(function(k){P.fol[k]=Math.max(0,P.fol[k]-0.4);});
  if(!P.tour)return;
  var T=P.tour,last=P.hist[P.hist.length-1];if(last)T.earned+=last.gate*0.3;
  rosterOf(S,P.id).forEach(function(w){if(!w.nw)w.rd=clamp((w.rd||0)+10,0,100);});
  var good=P.last&&P.last.rating>=70;
  P.fol[T.reg]=clamp((P.fol[T.reg]||0)+(good?6:2),0,100);
  T.left--;
  if(T.left<=0){
    news(S,'story',P.name+' came home from '+REGIONS[T.reg].n+' with a following of '+Math.round(P.fol[T.reg])+'.');
    P.tour=null;P.tourEnd=S.week;
  }
});
/* each region has a taste, and the wrong product plays flat there */
CRX.push(function(ctx){
  var P=ctx.P;if(!ctx.isPl||!P.tour||ctx.S.cal)return null;
  var t=REGIONS[P.tour.reg].taste,all=ctx.all,d=0,x=null;
  if(t==='brawl'){var b=avg(all.map(function(w){return w.brawl;}));if(b>=62||ctx.stip==='hardcore'||ctx.stip==='cage'){d=1.5;x='A brawl, and this region likes a brawl';}else if(b<=48){d=-1.5;x='Too gentle for a region that likes a fight';}}
  else if(t==='work'){var wk=avg(all.map(workRate));if(wk>=65){d=1.5;x='Fine wrestling for a region that counts the holds';}else if(wk<50){d=-1.5;x='Sloppy work in front of a region that notices';}}
  else{var sq=avg(all.map(function(w){return w.sq;}));if(sq>=65||ctx.stip==='ladder'){d=1.5;x='Spectacle, and this region came for spectacle';}else if(sq<=45){d=-1.5;x='Plain stuff for a region that wants spectacle';}}
  return d?{d:d,x:x}:null;
});

/* ---------- 59 (continued): what the rival owners say about you, by temperament ---------- */
WEEKX.push(function(S){
  if(S.cal||!chance(S,0.35))return;
  var P=S.promos[S.player],pid=pick(S,S.order.filter(function(id){return id!==P.id;})),RV=S.promos[pid];if(!RV||!RV.owner)return;
  var t=E.temperOf(S,pid),nm=RV.owner.name,up=P.image>RV.image,last=P.last&&P.last.rating>=75,L=null;
  if(t.key==='raider')L=up?nm+' of '+RV.name+' said '+P.name+' has the best roster in the business and is "ripe for the picking".':(chance(S,0.5)?nm+' of '+RV.name+' told a reporter that '+P.name+' is "a company that has had its day".':null);
  else if(t.key==='gentleman')L=(last||(RV.rel||0)>=20)?nm+' of '+RV.name+' tipped a hat to '+P.name+': "Good wrestling is good for all of us."':null;
  else if(t.key==='showman')L=nm+' of '+RV.name+' dared '+P.name+' to put its best against '+RV.name+'’s on one stage, "and let the people decide".';
  else L=chance(S,0.15)?nm+' of '+RV.name+' has still not said a word in public about anyone.':null;
  if(L&&(S.week-(S.talkAt||-99)>=3)){S.talkAt=S.week;news(S,'world',L);}
});

/* ---------- 61. Working agreements: a formal partnership with one rival (S.agree) that can sour ---------- */
/* terms: trades are easier (exchange), top titles are recognised by both (title), and a joint supershow every twelve weeks (show) */
E.agreeOdds=function(S,pid){
  var P=S.promos[S.player],RV=S.promos[pid];if(!RV||pid===P.id)return null;
  return mkCheck(9,[relMod(RV),gapMod(P,RV),temperMod(RV,'show')].concat(skillMods(S,'talk')));
};
E.agreeCan=function(S,pid){
  var P=S.promos[S.player],RV=S.promos[pid];
  if(S.agree)return 'You already have a working agreement with '+S.promos[S.agree.with].name+'.';
  if((RV.rel||0)<30)return RV.name+' does not know you well enough yet. Relations must reach 30.';
  if(RV.image-P.image>25)return RV.name+' is too big to sit down with you yet.';
  if(RV.agAsk&&S.week-RV.agAsk<8)return RV.name+' will not take another meeting until '+cal(RV.agAsk+8).label+'.';
  return null;
};
E.agreePropose=function(S,pid){
  var why=E.agreeCan(S,pid);if(why)return {ok:false,text:why};
  var RV=S.promos[pid],r=rollCheck(S,E.agreeOdds(S,pid));RV.agAsk=S.week;
  if(!r.ok){RV.rel=clamp((RV.rel||0)-3,-100,100);return {ok:false,text:rollText(r)+RV.name+' wants to think about it.'};}
  S.agree={with:pid,since:S.week,next:S.week+12,trouble:0};
  news(S,'world',S.promos[S.player].name+' and '+RV.name+' signed a working agreement.');
  return {ok:true,text:rollText(r)+'You and '+RV.name+' are partners. Trades are easier, your top titles are recognised by both, and a joint supershow runs every twelve weeks.'};
};
E.agreeEnd=function(S){var A=S.agree;if(!A)return {ok:false,text:'There is no agreement.'};var RV=S.promos[A.with];RV.rel=clamp((RV.rel||0)-10,-100,100);S.agree=null;news(S,'world',S.promos[S.player].name+' ended the working agreement with '+RV.name+'.');return {ok:true,text:'The agreement is over. '+RV.name+' is not pleased.'};};
E.agreement=function(S){
  var A=S.agree;if(!A)return null;var RV=S.promos[A.with];
  return {with:RV,rel:Math.round(RV.rel||0),since:A.since,next:Math.max(0,A.next-S.week),trouble:A.trouble};
};
WEEKX.push(function(S){
  var A=S.agree;if(S.cal||!A)return;
  var P=S.promos[S.player],RV=S.promos[A.with];
  // a recognised title lifts both companies' top titles a little
  [P,RV].forEach(function(Q){var t=Q.titles.filter(function(x){return !x.tag&&x.lvl>=3;})[0];if(t&&t.prestige<90)t.prestige=Math.min(90,t.prestige+0.15);});
  // the joint show
  if(S.week>=A.next&&!E.xfState(S)&&!E.xfCan(S,A.with)){A.next=S.week+12;startXf(S,A.with,'super');news(S,'world','The joint supershow with '+RV.name+' is on, as agreed.');}
  // partners fall out over time: the incident is more likely with a raider
  var p=({raider:0.05,gentleman:0.01,hermit:0.02,showman:0.03})[E.temperOf(S,A.with).key]||0.02;
  if(chance(S,p)&&!S.inbox.some(function(e){return e.type==='agreetrouble'&&!e.done;})){
    var o=RV.owner&&RV.owner.name?RV.owner.name:'Their owner',cost=Math.round(P.inc0*0.3);
    A.trouble++;pushEv(S,{type:'agreetrouble',text:o+' of '+RV.name+' is angry: one of their stars was sent home early from your show and no one told them. The agreement is at risk.',
      choices:['Send a gift and an apology: '+money(cost),'Say it was a mistake (an attempt)','End the agreement'],cost:cost,checks:{1:mkCheck(7,[relMod(RV),trustMod(S)].concat(skillMods(S,'talk')))}});
  }
  if((RV.rel||0)<0&&A.trouble>=2){S.agree=null;news(S,'world','The working agreement with '+RV.name+' collapsed.');}
});
EVR.agreetrouble=function(S,ev,choice,P){
  var A=S.agree;if(!A)return 'The agreement is already over.';var RV=S.promos[A.with];
  if(choice===0){if(P.cash<ev.cost){RV.rel=clamp((RV.rel||0)-6,-100,100);return 'You cannot afford the gift. '+RV.name+' takes that badly.';}P.cash-=ev.cost;RV.rel=clamp((RV.rel||0)+12,-100,100);A.trouble=Math.max(0,A.trouble-1);return 'The gift and the apology work. '+RV.name+' is back on side.';}
  if(choice===1){var r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){RV.rel=clamp((RV.rel||0)+4,-100,100);return rollText(r)+RV.name+' accepts the explanation.';}RV.rel=clamp((RV.rel||0)-12,-100,100);return rollText(r)+RV.name+' does not believe it. Relations take a hit.';}
  return E.agreeEnd(S).text;
};
CRX.push(function(ctx){
  var A=ctx.S.agree;if(!A||!ctx.isPl||!ctx.t||ctx.t.lvl<3||ctx.S.cal)return null;
  return {d:1,x:'The title is recognised by both companies'};
});
