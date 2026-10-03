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
