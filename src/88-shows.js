/* ---------- a weekly show lasts ----------
   Ryan, 4 October: "Shows exist and can gain prestige the longer they are on and based on viewership and growth."
   A weekly show is not opened and shut. It stays on the air for years, and the years are part of what it is worth.
   It does not end: now and then it changes network. This file keeps, for every weekly show of every company:
     sh.on     the week it first aired (before week 1 for a show that was already running when the game began)
     sh.ep     how many episodes have aired
     sh.pr     its prestige, 0 to 100. Said in words (airWord), never shown as a number.
     sh.pr0    where its prestige stood when the game began or the show was launched. What it draws is measured
               against that, so a new game starts exactly where the calibration put it.
     sh.net    the network it is on; sh.tier how big that network is (0 small, 1 cable, 2 major); sh.netOn since when
     sh.deal   the week the rights are up; sh.prd its prestige when that deal was signed; sh.rate what the deal pays
               against the first one
   Prestige moves a little every week: up when the show beats what its crowd expected and when its audience is
   growing, down when it does not, and up a point on every anniversary. More prestige means more viewers.
   When the deal is up the show is worth what it has become: the network pays more or less, and another network
   may want it. The player answers that in the inbox. A rival moves by itself, and it is news.
   A rival in trouble does not cancel a show: the show moves to a smaller network.
   A milestone episode and an anniversary are occasions: the building is up for them. */
var AIR_NETS=[['Kestrel','Station 44','Gaslight','Pine Barrens TV','Foundry TV'],['Bellwether Cable','Tidewater Sports','Copperline','Ridgeline','Wexford'],['Northlight','Atlas One','Calder','Sovereign Television','Aurelian']];
var AIR_TIERN=['a small network','a cable network','a major network'];
var AIR_WORD=[[75,'An institution'],[60,'Appointment viewing'],[45,'A fixture'],[30,'Established'],[15,'Finding its feet'],[0,'Brand new']];
var AIR_YEAR=48,AIR_DEAL_MIN=3,AIR_DEAL_SPAN=3,AIR_GAP=3,AIR_TIER_V=1.07,AIR_TIER_REACH=0.15;
function airLevelOf(v){for(var i=0;i<AIR_WORD.length;i++)if(v>=AIR_WORD[i][0])return AIR_WORD.length-1-i;return 0;}
/** The word for a show's standing. It moves up at each mark and only comes back down three points under it, so it does not flicker. */
function airWord(sh){return AIR_WORD[AIR_WORD.length-1-(sh.lv||0)][1];}
function airStep(sh){
  var lv=sh.lv==null?airLevelOf(sh.pr):sh.lv,up=airLevelOf(sh.pr),down=airLevelOf(sh.pr+3);
  if(up>lv)lv=up;else if(down<lv)lv=down;
  var was=sh.lv;sh.lv=lv;return was==null?0:lv-was;
}
function airRec(P,id){for(var i=0;i<P.shows.length;i++)if(P.shows[i].id===id)return P.shows[i];return null;}
function airNets(S,t){var d=dbOf(S).networks;return d&&d[t]&&d[t].length>1?d[t]:AIR_NETS[t];}
/** A network of this size for this show: not the one it is leaving, and not the same one twice running. */
function airPickNet(S,P,sh,t,not){var L=airNets(S,t).filter(function(n){return n!==not;});return L[hash('net'+P.id+sh.id+':'+t+':'+(sh.moves||0))%L.length];}
function airTier0(P){return P.image0>=68?2:(P.image0>=46?1:0);}
function airYears(S,sh){return Math.max(0,Math.floor((S.week-sh.on)/AIR_YEAR));}
function airDealWeeks(P,sh){return (AIR_DEAL_MIN+hash('deal'+P.id+sh.id+(sh.moves||0)+':'+(sh.deals||0))%AIR_DEAL_SPAN)*AIR_YEAR;}
/** Everything a show carries about its time on the air. Filled in the first time it is asked for, so an older save picks it up. */
function airOf(S,P,sh){
  if(sh.pr!=null)return sh;
  var k=hash('air'+P.id+sh.id),m=sh.mult==null?1:sh.mult,main=P.shows[0]===sh||m>=1;
  // a company founded during the game, or by the player, has no years behind it
  var fresh=!sh.since&&(P.born!=null||!!(S.custom&&S.custom.id===P.id&&S.custom.mine)),young=!!sh.since||fresh;
  if(young){sh.on=sh.since||P.born||1;sh.pr=fresh?clamp(Math.round(P.image0*0.3),6,25):8;sh.tier=Math.max(0,airTier0(P)-1);}
  else{
    // a show that was running when the game began: the bigger the company, the longer it has been on the air
    var yrs=P.model==='startup'?0:clamp(Math.round((P.image0-32)/2.2)+k%4,1,40);if(!main)yrs=Math.max(1,Math.floor(yrs*m*0.5));
    sh.on=1-(yrs*AIR_YEAR+k%AIR_YEAR);
    sh.pr=clamp(Math.round((P.image0*(yrs<2?0.35:0.55)+yrs*1.1)*(main?1:0.8)),5,95);
    sh.tier=Math.max(0,airTier0(P)-(main||k%2?0:1));
  }
  sh.ep=Math.max(0,S.week-sh.on);sh.pr0=sh.pr;sh.prd=sh.pr;sh.tier0=sh.tier;sh.rate=1;sh.moves=0;sh.deals=0;
  sh.net=airPickNet(S,P,sh,sh.tier,null);
  sh.netOn=young?sh.on:Math.max(sh.on,S.week-((k>>>3)%7+1)*AIR_YEAR);
  sh.deal=young?sh.on+airDealWeeks(P,sh):S.week+24+(k>>>5)%120;
  airStep(sh);return sh;
}
NEWX.push(function(S){S.order.forEach(function(pid){var P=S.promos[pid];P.shows.forEach(function(sh){airOf(S,P,sh);});});});
/** What a show's standing and its network do to its audience, against where it began. 1 at the start of a game. */
function airPF(P,show){var sh=show&&!show.big?airRec(P,show.id):null;if(!sh||sh.pr==null)return 1;return clamp(1+(sh.pr-sh.pr0)/250,0.85,1.3)*Math.pow(AIR_TIER_V,sh.tier-sh.tier0);}
/** What the show's deal pays against its first one. */
function airRate(P,show){var sh=show&&!show.big?airRec(P,show.id):null;return sh&&sh.rate?sh.rate:1;}
/** A show moved to a smaller network is made for less. */
function airProd(P,show){var sh=show&&!show.big?airRec(P,show.id):null;return sh&&sh.pc?sh.pc:1;}
/** A bigger network puts the show in front of more people: what it does to the company's popularity counts for more. */
function airReach(P,show){var sh=show&&!show.big?airRec(P,show.id):null;if(!sh||sh.pr==null)return 1;return 1+AIR_TIER_REACH*(sh.tier-sh.tier0);}
/** Is the episode about to air an occasion? A milestone episode, or the show's anniversary. */
function airNight(S,sh,week){
  var wk=week==null?S.week:week,n=(sh.ep||0)+1,y=(wk-sh.on)/AIR_YEAR;
  if(n===100||n===250||(n>=500&&n%500===0))return {k:'ep',n:n,h:n>=500?0.08:0.05,x:'Episode '+n.toLocaleString('en-US')};
  if(wk>sh.on&&(wk-sh.on)%AIR_YEAR===0)return {k:'yr',n:y,h:y%5===0?0.06:0.03,x:y===1?'One year on the air':y+' years on the air'};
  return null;
}
/** For the title card of the player's show: the episode number, the network, and what tonight is. */
function airStart(S,P,show){
  var sh=show&&!show.big?airRec(P,show.id):null;if(!sh)return null;airOf(S,P,sh);
  var o=airNight(S,sh);return {ep:(sh.ep||0)+1,net:sh.net,occ:o?{k:o.k,n:o.n,x:o.x}:null};
}
PREX.push(function(S,P,show){var sh=show&&!show.big?airRec(P,show.id):null;if(!sh)return;airOf(S,P,sh);var o=airNight(S,sh);if(o)S.hype=(S.hype||0)+o.h;});
SHOWX.push(function(S,P,show,rep){
  if(S.cal||show.big)return;var sh=airRec(P,show.id);if(!sh)return;airOf(S,P,sh);
  var isPl=P.id===S.player,o=airNight(S,sh),d=clamp((rep.rating-rep.exp)/45,-0.18,0.2);
  // the audience: growing or shrinking against its own recent run
  if(sh.va)d+=rep.viewers>sh.va*1.01?0.04:(rep.viewers<sh.va*0.99?-0.04:0);
  sh.va=sh.va?sh.va*0.9+rep.viewers*0.1:rep.viewers;
  if(o&&o.k==='yr')d+=1;
  if(o&&o.k==='ep')d+=0.5;
  sh.ep=(sh.ep||0)+1;sh.pr=clamp(sh.pr+d,0,100);
  if(o&&!isPl&&(o.k==='ep'||o.n%5===0))news(S,'world',o.k==='ep'?sh.name+' reached episode '+o.n.toLocaleString('en-US')+'. '+P.name+' made a night of it.':P.name+' marked '+o.n+' years of '+sh.name+' on the air.');
  var mv=airStep(sh);
  if(mv&&isPl){
    news(S,'money',mv>0?sh.name+' has grown. People now call it '+airWord(sh).toLowerCase()+'.':sh.name+' has lost some of its standing. It is back to '+airWord(sh).toLowerCase()+'.');
    note(S,mv>0?'The show has grown':'The show has slipped',sh.name+': '+airWord(sh).toLowerCase()+'.',mv>0?'good':'bad');
  }
});
/* the desk hears about an occasion as its week begins (the week closes before the date moves on) */
WEEKX.push(function(S){
  var P=S.promos[S.player];if(!P)return;
  P.shows.forEach(function(sh){airOf(S,P,sh);var o=airNight(S,sh,S.week+1);if(!o)return;
    news(S,'money','Coming up on '+sh.name+': '+(o.k==='ep'?'episode '+o.n.toLocaleString('en-US'):(o.n===1?'one year':o.n+' years')+' on the air')+'. The building will be up for it.');
    note(S,'An occasion this week',sh.name+': '+o.x.toLowerCase()+'.','good');});
});

/* ---------- the rights: a show changes network, it does not end ---------- */
function airPay(P,sh,rate,tier,pr){
  var pf=clamp(1+((pr==null?sh.pr:pr)-sh.pr0)/250,0.85,1.3)*Math.pow(AIR_TIER_V,tier-sh.tier0);
  return Math.round(viewersK(P,sh,pf)*P.tvRate*mixOf(P).tv*rate/100)*100;
}
/** What the network a show is on pays to keep it, against the deal that is ending: the show is worth what it has become. */
function airStay(sh){return clamp(1+(sh.pr-sh.prd)/60,0.9,1.15);}
function airSign(S,P,sh,net,tier,rate){
  if(net!==sh.net){sh.moves=(sh.moves||0)+1;sh.netOn=S.week;}
  sh.net=net;sh.tier=tier;sh.rate=clamp(rate,0.6,1.8);sh.deals=(sh.deals||0)+1;sh.prd=sh.pr;sh.deal=S.week+airDealWeeks(P,sh);
}
/** The three ways a deal can go for this show right now: what it is worth to the network it is on, and who else wants it. */
function airFits(P,sh,t){return t<=0||(t===1?(P.image>=40||sh.pr>=28):(P.image>=62||sh.pr>=58));}
function airOffer(S,P,sh){
  var g=sh.pr-sh.prd,up=g>=AIR_GAP&&sh.tier<2&&airFits(P,sh,sh.tier+1),down=g<=-AIR_GAP&&sh.tier>0,t2=up?sh.tier+1:(down?sh.tier-1:sh.tier),stay=airStay(sh);
  return {g:g,up:up,down:down,t2:t2,other:airPickNet(S,P,sh,t2,sh.net),stay:sh.rate*stay,
    move:sh.rate*(up?stay+0.06:(down?Math.max(1,stay+0.08):stay+0.04)),fee:down?Math.round(airPay(P,sh,sh.rate,sh.tier)*6/1000)*1000:0,
    dip:up?3:2};
}
function airAsk(S,P,sh){
  var o=airOffer(S,P,sh),y=Math.max(1,Math.round((S.week-sh.netOn)/AIR_YEAR)),now=airPay(P,sh,sh.rate,sh.tier),
    st=airPay(P,sh,o.stay,sh.tier),mv=airPay(P,sh,o.move,o.t2,sh.pr-o.dip);
  var txt='The deal that puts '+sh.name+' on '+sh.net+' is up after '+y+' '+(y===1?'year':'years')+'. It pays about '+money(now)+' a week. ';
  txt+=o.g>=AIR_GAP?'The show is worth more than when the deal was signed. ':(o.g<=-AIR_GAP?'The show is worth less than when the deal was signed. ':'');
  txt+=sh.net+' will '+(st>now?'pay about '+money(st)+' to keep it':(st<now?'keep it for about '+money(st):'carry on at about '+money(st)))+'. ';
  if(o.up)txt+=o.other+', '+AIR_TIERN[o.t2]+', wants it too, at about '+money(mv)+': more viewers, and what your shows do to your popularity counts for more. The audience has to find it again.';
  else if(o.down)txt+=o.other+', '+AIR_TIERN[o.t2]+', would pay about '+money(mv)+' and '+money(o.fee)+' on signing, for fewer viewers.';
  else txt+=o.other+', another network of the same size, has asked about it and would pay about '+money(mv)+'. The audience would have to find it again.';
  pushEv(S,{type:'rights',sid:sh.id,other:o.other,t2:o.t2,text:txt,choices:['Stay on '+sh.net,'Move to '+o.other,'Hold out for more from '+sh.net],
    checks:{2:mkCheck(9,[{n:'The show is '+airWord(sh).toLowerCase(),v:sh.lv>=4?2:(sh.lv>=3?1:(sh.lv<=1?-1:0))},{n:(P.trend||0)>1?'Your shows are on a hot run':'Your shows are on a cold run',v:(P.trend||0)>1?1:((P.trend||0)<-1?-1:0)},{n:o.other+' wants the show',v:o.up?1:0}].concat(skillMods(S,'talk')))}});
  sh.asked=S.week;
}
EVR.rights=function(S,ev,choice,P){
  var sh=airRec(P,ev.sid);if(!sh)return 'That show is no longer on your schedule.';
  var o=airOffer(S,P,sh),old=sh.net,yrs=function(){return Math.round((sh.deal-S.week)/AIR_YEAR);};
  o.other=ev.other;o.t2=ev.t2;
  if(choice===1){
    airSign(S,P,sh,o.other,o.t2,o.move);sh.pr=clamp(sh.pr-o.dip,0,100);sh.prd=sh.pr;airStep(sh);
    E.clocks(S);S.clocks.net.v=0;S.clocks.net.why='A new network, and a clean slate';
    if(o.fee){P.cash+=o.fee;}
    news(S,'money',P.name+' is moving '+sh.name+' from '+old+' to '+sh.net+'.');
    note(S,'A new network',sh.name+' is on '+sh.net+' from next week.','');
    return sh.name+' moves to '+sh.net+' for '+yrs()+' years at about '+money(airPay(P,sh,sh.rate,sh.tier))+' a week.'+(o.fee?' They paid '+money(o.fee)+' on signing.':'')+' A new network starts with a clean slate, and the audience has to find the show again.';
  }
  if(choice===2){
    var r=rollCheck(S,ev.checks[2]);ev.roll=r;
    if(r.ok){airSign(S,P,sh,old,sh.tier,o.stay+sh.rate*0.08);return rollText(r)+old+' finds the money. '+sh.name+' stays for '+yrs()+' more years at about '+money(airPay(P,sh,sh.rate,sh.tier))+' a week.';}
    airSign(S,P,sh,old,sh.tier,o.stay-sh.rate*0.03);E.clocks(S);S.clocks.net.v=clamp(S.clocks.net.v+2,0,CLOCKS.net.segs);S.clocks.net.why='You pushed the network too hard over the new deal';
    return rollText(r)+old+' does not move, and does not like being pushed. '+sh.name+' stays for '+yrs()+' more years at about '+money(airPay(P,sh,sh.rate,sh.tier))+' a week, and the network’s patience is thinner.';
  }
  airSign(S,P,sh,old,sh.tier,o.stay);
  return sh.name+' stays on '+old+' for '+yrs()+' more years at about '+money(airPay(P,sh,sh.rate,sh.tier))+' a week.';
};
/** A rival's deal is up. Mostly the show stays where it is. A show that has grown can move up, one that has slipped can move down, and now and then one just moves. */
function airRival(S,P,sh){
  var o=airOffer(S,P,sh),old=sh.net,y=Math.max(1,Math.round((S.week-sh.netOn)/AIR_YEAR)),yy=y+' '+(y===1?'year':'years');
  if(o.up&&chance(S,0.6)){airSign(S,P,sh,o.other,o.t2,o.move);sh.pr=clamp(sh.pr-o.dip,0,100);sh.prd=sh.pr;airStep(sh);
    news(S,'world',P.name+' is taking '+sh.name+' to '+sh.net+' after '+yy+' on '+old+'. A bigger network, and a bigger deal.');note(S,'Big news',sh.name+' moves to '+sh.net+'.','');return;}
  if(o.down&&chance(S,0.6)){airSign(S,P,sh,o.other,o.t2,o.move);sh.pr=clamp(sh.pr-o.dip,0,100);sh.prd=sh.pr;airStep(sh);
    news(S,'world',old+' did not renew '+sh.name+' after '+yy+'. '+P.name+' has moved it to '+sh.net+', '+AIR_TIERN[sh.tier]+'.');return;}
  if(!o.up&&!o.down&&chance(S,0.15)){airSign(S,P,sh,o.other,o.t2,o.move);sh.pr=clamp(sh.pr-o.dip,0,100);sh.prd=sh.pr;airStep(sh);
    news(S,'world',sh.name+' is changing networks: '+P.name+' has signed with '+sh.net+' after '+yy+' on '+old+'.');return;}
  airSign(S,P,sh,old,sh.tier,o.stay);
}
/** A rival that cannot carry a show does not cancel it. The show moves to a smaller network: fewer viewers, less money, a cheaper production. */
function airDemote(S,P,sh){
  airOf(S,P,sh);var m=sh.mult==null?1:sh.mult;if(sh.tier<=0&&m<=0.3)return null;
  var old=sh.net,was=makeShowIncome(P,sh),t=Math.max(0,sh.tier-1);
  sh.mult=Math.max(0.3,Math.round(m*0.75*100)/100);sh.pc=Math.max(0.4,(sh.pc||1)*0.6);
  airSign(S,P,sh,airPickNet(S,P,sh,t,sh.net),t,sh.rate*0.92);sh.pr=clamp(sh.pr-4,0,100);sh.prd=sh.pr;airStep(sh);
  var lost=was-makeShowIncome(P,sh);if(lost>0&&P.inc0>lost){P.fixed=Math.round((P.fixed||0)*(P.inc0-lost)/P.inc0);P.inc0-=lost;}
  sh.inc=Math.round(makeShowIncome(P,sh));
  return {from:old,to:sh.net};
}
WEEKX.push(function(S){
  S.order.forEach(function(pid){var P=S.promos[pid];P.shows.forEach(function(sh){
    airOf(S,P,sh);if(S.week+1<sh.deal)return;
    if(pid!==S.player){airRival(S,P,sh);return;}
    if(!S.inbox.some(function(e){return !e.done&&e.type==='rights'&&e.sid===sh.id;}))airAsk(S,P,sh);
  });});
});

/** A company's weekly shows as they stand on the air: standing in words, years, episodes, the network and its deal. */
function airInfo(S,P){
  return P.shows.map(function(sh){airOf(S,P,sh);var y=airYears(S,sh),ny=Math.max(0,Math.floor((S.week-sh.netOn)/AIR_YEAR));
    return {id:sh.id,name:sh.name,word:airWord(sh),years:y,yearsSay:y<1?'in its first year':(y===1?'one year on the air':y+' years on the air'),ep:sh.ep||0,net:sh.net,tier:AIR_TIERN[sh.tier],
      netSay:ny<1?'since this year':'for '+(ny===1?'one year':ny+' years'),dealTo:cal(sh.deal).label,dealWeeks:Math.max(0,sh.deal-S.week),pay:airPay(P,sh,sh.rate,sh.tier),next:(function(){var o=null;for(var w=0;w<8&&!o;w++){var n=(sh.ep||0)+1+w;if(n===100||n===250||(n>=500&&n%500===0))o='Episode '+n.toLocaleString('en-US')+' is '+(w?w+' '+(w===1?'show':'shows')+' away':'next');}return o;})()};});
}
E.airInfo=function(S,pid){return airInfo(S,S.promos[pid||S.player]);};
(function(){
  var was=E.makeInfo;
  E.makeInfo=function(S){var o=was(S),A=airInfo(S,S.promos[S.player]);o.shows.forEach(function(s){var a=A.filter(function(x){return x.id===s.id;})[0];if(a)s.air=a;});return o;};
})();
