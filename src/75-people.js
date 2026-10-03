/* ---------- people: ageing, retirement, each year's rookie class, and what your scouts can tell you ---------- */
function ovrCap(P,w){return Math.min(100,P.image+10+(w.sq==null?50:w.sq)*0.2);}
function phaseOf(w){return w.age<w.pk[0]?0:(w.age<=w.pk[1]?1:(w.age<w.cl?2:3));}
var PHASE=['Still developing','In their prime','Past their peak','In steep decline'];
function retire(S,w,why){
  if(w.promo!=='FA'){var P=S.promos[w.promo];leaveCompany(S,w,'retired');if(w.ovr>=50||w.promo===S.player)news(S,'contract',w.name+' ('+P.name+') has retired at '+w.age+(why?': '+why:'')+'.');}
  mile(S,w,'retire','Retired at '+w.age);w.rtp=w.promo!=='FA'?w.promo:null;w.promo='FA';w.brand=null;w.rt=S.week;w.camp=false;w.retiring=null;
}
function birthday(S,w){
  w.age++;var act=w.ya||0;w.ya=0;
  if(w.rt)return;
  if(w.age<=w.pk[0]){if(workRate(w)<w.pot)w.xp+=0.6;return;}
  if(w.age<=w.pk[1])return;
  // past the peak: decline can be slowed by staying active and healthy, never stopped
  var over=w.age-w.pk[1],d=(w.age>=w.cl?2.2:1)*(act>=20?0.7:(act<6?1.25:1))*((w.yi||0)>=8?1.25:1);w.yi=0;
  var dn=function(k,n){w[k]=clamp(w[k]-Math.max(0,Math.round(n)),15,99);};
  dn('speed',(w.style==='H'?1.7:1.4)*d+over*0.3);dn('stam',1.1*d+over*0.2);dn('brawl',0.6*d);dn('tech',0.3*d);dn('dur',1.5*d);
  w.pot=Math.max(workRate(w),w.pot-2);
  if(w.promo===S.player&&!w.slow){w.slow=true;news(S,'story',w.name+' is '+w.age+' and starting to slow down.');mile(S,w,'age','Began to slow down at '+w.age);}
  if(w.age>=w.cl+1&&!w.retiring&&(workRate(w)<52||w.age>=w.cl+4||chance(S,0.3))){
    if(w.promo===S.player){w.retiring=S.week+8;news(S,'contract',w.name+' has told you this is the end. They will retire after '+cal(w.retiring).label+'.');pushEv(S,{type:'finalyear',w:w.id,text:w.name+', '+w.age+', has decided to retire. They would like a farewell tour: one last year, with the building full of people who came to say goodbye. Or a short goodbye after eight weeks.',choices:['A final year: a farewell tour','Eight weeks, then a short goodbye']});}
    else retire(S,w);
  }
}
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.inj>0)w.yi=(w.yi||0)+1;
    if(w.retiring&&S.week>=w.retiring&&w.fw&&!w.fwDone&&w.promo===S.player){
      // a farewell tour ends with a last match, and the booker chooses who gets the honour of the final win
      var heirs=rosterOf(S,S.player).filter(function(x){return !x.nw&&x.id!==w.id&&x.g===w.g&&x.inj<=0&&x.age<=32;}).sort(function(a,b){return (b.pot+b.ovr)-(a.pot+a.ovr);}).slice(0,3);
      w.fwDone=true;w.retiring=S.week+1;
      if(heirs.length){pushEv(S,{type:'lastwin',w:w.id,c:heirs.map(function(x){return x.id;}),text:w.name+'’s last match is tonight. Who gets the honour of the final win over them?',choices:heirs.map(function(x){return x.name;})});return;}
    }
    if(w.retiring&&S.week>=w.retiring){var P=S.promos[w.promo];if(P){rosterOf(S,P.id).forEach(function(x){x.morale=clamp(x.morale+2,0,100);});P.image=clamp(P.image+(w.ovr>=P.image?0.3:0.1),5,100);}retire(S,w,'a farewell the locker room will remember');}
    if((S.week+w.bw)%48===0)birthday(S,w);
    // in rival companies, young talent with star quality rises whether you are watching or not
    if(w.promo!=='FA'&&w.promo!==S.player&&!w.nw&&w.age<=w.pk[0]+1){var Q=S.promos[w.promo],tg=Math.min(ovrCap(Q,w),w.sq+5);if(w.ovr<tg)w.ovr+=0.02*(tg-w.ovr);if(workRate(w)<w.pot)w.xp+=0.05;}
    // unsigned youngsters learn their trade on small shows nobody sees
    if(w.promo==='FA'&&!w.rt&&w.age<=28){if(workRate(w)<w.pot){w.xp+=0.07;if(w.xp>=1){w.xp-=1;w.brawl=Math.min(99,w.brawl+1);w.tech=Math.min(99,w.tech+1);w.speed=Math.min(99,w.speed+1);}}if(w.ovr<12+(w.pot-50)*0.5)w.ovr+=0.08;}
    // free agents nobody wants drift out of the business
    if(w.promo==='FA'&&!w.rt&&w.age>=36&&S.week%12===0&&chance(S,0.25)){mile(S,w,'retire','Left the business at '+w.age);w.rt=S.week;}
  });
  var c=cal(S.week+1);if(c.month===0&&c.wom===1)rookieClass(S,c.year);
});
POST.push(function(ctx){ctx.all.forEach(function(w){w.ya=(w.ya||0)+1;});});
function rookieClass(S,year){
  var I=dbOf(S).indie,styles=['B','T','H','P','A','S','E'],made=[],have={};S.w.forEach(function(w){have[w.name]=1;});
  // the class grows with the number of promotions, so the free agent pool does not drain in a big world
  for(var i=0,nClass=Math.max(22,Math.round(8*S.order.length));i<nClass;i++){
    var g=i%3===2?'F':'M',nm,tries=0;
    do{nm=pick(S,g==='F'?I.firstF:I.firstM)+' '+pick(S,I.last);}while(have[nm]&&tries++<40);
    if(have[nm])continue;have[nm]=1;
    var work=ri(S,38,60),blue=chance(S,0.15),w=addWrestler(S,{name:nm,g:g,ovr:ri(S,6,20)+(blue?6:0),style:pick(S,styles),work:work,mic:ri(S,30,75),align:chance(S,0.5)?'F':'H',age:ri(S,19,23)},'FA',null);
    w.pot=clamp(work+ri(S,10,24)+(blue?12:0),work,97);w.sq=clamp(ri(S,30,72)+(blue?16:0),20,97);w.blue=blue;w.rk=year;assignGim(w);mile(S,w,'debut','Turned professional, class of '+year);made.push(w);
  }
  made.sort(function(a,b){return b.pot-a.pot;});
  if(made.length)news(S,'world','The class of '+year+' has turned professional: '+made.length+' rookies. The one everybody is talking about is '+made[0].name+'.');
}
/* scouting: hidden ratings show as a range until you know the wrestler well */
var HIDDEN={pot:'Potential',sq:'Star quality',dur:'Durability',safe:'Safety',cons:'Consistency'};
function margin(S,w){var eye=S.booker?S.booker.sk.eye:0,m=(w.promo===S.player?10:18)-3*eye;if(w.sc)m-=8;return Math.max(0,m);}
E.intel=function(S,id){
  var w=S.w[id];if(!w)return null;var m=margin(S,w),out={m:m,exact:m<=1,stats:{}};
  Object.keys(HIDDEN).forEach(function(k){
    var v=w[k];if(m<=1){out.stats[k]={lo:v,hi:v};return;}
    var c=v+Math.round((h01(S.seed+':'+w.id+k)-0.5)*m*1.2);out.stats[k]={lo:clamp(c-m,1,99),hi:clamp(c+m,1,99)};
  });
  out.phase=PHASE[phaseOf(w)];out.peak=m<=4?[w.pk[0],w.pk[1]]:null;out.cliff=m<=1?w.cl:null;
  return out;
};
E.scoutInfo=function(S){var P=S.promos[S.player],used=S.scoutWeek===S.week?(S.scoutN||0):0,max=2+S.booker.sk.eye;return {left:Math.max(0,max-used),max:max,cost:Math.max(200,Math.round(P.inc0*0.002/100)*100)};};
E.scout=function(S,id){
  var w=S.w[id],P=S.promos[S.player],i=E.scoutInfo(S);if(!w)return null;
  if(w.sc)return 'Your scouts have already filed a full report on '+w.name+'.';
  if(i.left<=0)return 'Your scouts are stretched this week. They can file '+i.max+' report'+(i.max===1?'':'s')+' a week.';
  if(S.scoutWeek!==S.week){S.scoutWeek=S.week;S.scoutN=0;}S.scoutN++;P.cash-=i.cost;w.sc=S.week;
  var n=E.intel(S,id);return 'The report on '+w.name+' is in: potential '+rng(n.stats.pot)+', star quality '+rng(n.stats.sq)+'. '+n.phase+'.';
};
function rng(r){return r.lo===r.hi?String(r.lo):r.lo+'–'+r.hi;}
NEWX.push(function(S){S.order.forEach(function(id){S.promos[id].size0=rosterOf(S,id).length;});});
E.HIDDEN=HIDDEN;E.phaseOf=phaseOf;E.PHASE=PHASE;
