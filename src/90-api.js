/* ---------- roster moves ---------- */
E.ask=function(S,w){var P=S.promos[S.player],MD=modelOf(P),m=(w.promo==='FA'?1:1.3)*talkDiscount(S);if(w.promo!=='FA'&&S.promos[w.promo].image>P.image+10)m+=0.25;
  if(MD.premium&&w.ovr>P.image+8)m*=MD.premium;                                   // a startup pays over the odds for a name
  if(MD.chip&&w.cut&&S.week-w.cut.w<52&&w.promo==='FA')m*=0.85;                   // a castoff comes cheap to an underdog
  return Math.round(wageFor(w.ovr,P)*m/50)*50;};
E.canSign=function(S,w){var P=S.promos[S.player],MD=modelOf(P);return !(MD.gender&&w.g!==MD.gender)&&w.ovr<=P.image+(MD.reach||25);};
E.signWhy=function(S,w){var P=S.promos[S.player],MD=modelOf(P);return MD.gender&&w.g!==MD.gender?P.name+' is an all-women company.':(E.canSign(S,w)?null:w.name+' is not interested in a promotion your size yet. Raise your popularity first.');};
E.market=function(S){return S.w.filter(function(w){return !w.rt&&(w.promo==='FA'||(w.promo!==S.player&&w.con<=12));});};
E.sign=function(S,id,wage,weeks){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo===P.id)return {ok:false,msg:'Not available.'};
  if(w.rt)return {ok:false,msg:w.name+' has retired.'};
  if(w.lock>S.week)return {ok:false,msg:w.name+' will not talk again until '+cal(w.lock).label+'.'};
  if(w.promo!=='FA'&&w.con>12)return {ok:false,msg:w.name+' is under contract.'};
  if(!E.canSign(S,w))return {ok:false,msg:E.signWhy(S,w)};
  if(wagesWeek(S,P)+wage>E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on that. It would take the wage bill past the '+money(E.budget(S))+' a week budget.'};
  var ask=E.ask(S,w);
  if(wage<ask*0.97){
    if(!w.ctr){w.ctr=true;var ca=Math.round(ask*1.08/50)*50;pushEv(S,{type:'counter',w:w.id,ask:ca,weeks:weeks||48,text:w.name+'\u2019s side did not like your offer, but they have come back with a number: '+money(ca)+' a week.',choices:['Accept at '+money(ca)+' a week','Walk away']});return {ok:false,msg:w.name+' turned that down and sent a counter-offer. It is in your inbox.'};}
    w.lock=S.week+4;return {ok:false,msg:'Talks broke down. '+w.name+' wanted about '+money(ask)+' a week.'};
  }
  var from=w.promo;if(from!=='FA'){S.promos[from].rel=clamp((S.promos[from].rel||0)-12,-100,100);leaveCompany(S,w,'left for '+P.name);}
  joinCompany(S,w,P,wage,weeks||48);
  news(S,'contract',P.name+' signed '+w.name+(from!=='FA'?' away from '+S.promos[from].name:'')+'.');
  award(S,from==='FA'?'ACH_SIGN':'ACH_POACH');
  return {ok:true,msg:w.name+' signs for '+money(wage)+' a week.'};
};
E.release=function(S,id){var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id)return null;var pay=w.wage*4;P.cash-=pay;if(S.owner.pledge==='stable'){rosterOf(S,P.id).forEach(function(x){x.morale=clamp(x.morale-3,0,100);});S.trust=clamp(S.trust-4,0,100);}leaveCompany(S,w,'released');w.promo='FA';w.brand=null;news(S,'contract',P.name+' released '+w.name+'.');return w.name+' is released. Severance: '+money(pay)+'.';};
/** What a new contract would cost a week, before it is signed. */
E.renewAsk=function(S,id,weeks){var w=S.w[id];if(!w||w.promo!==S.player)return 0;return Math.round(renewAsk(S,w)*(weeks>60?1.1:1)/50)*50;};
E.renew=function(S,id,weeks){var w=S.w[id];if(!w||w.promo!==S.player)return null;var ask=Math.round(renewAsk(S,w)*(weeks>60?1.1:1)/50)*50;w.wage=ask;w.con=weeks;w.cn=false;w.morale=clamp(w.morale+3,0,100);return w.name+' re-signs for '+money(ask)+' a week.';};
E.setBrand=function(S,id,b){var w=S.w[id];if(w&&w.promo===S.player){w.brand=b;var tm=teamOf(S,w);if(tm&&S.w[tm.m[0]].brand!==S.w[tm.m[1]].brand)dissolveTeam(S,tm);}};
E.pushMap=function(S,pid){
  var out={},P=S.promos[pid],groups={};
  rosterOf(S,pid).forEach(function(w){var k=(w.brand||'')+w.g;(groups[k]=groups[k]||[]).push(w);});
  Object.keys(groups).forEach(function(k){var L=groups[k].sort(function(a,b){return b.ovr-a.ovr;}),n=L.length;L.forEach(function(w,i){var f=i/n;out[w.id]=f<0.1?'Main event':(f<0.3?'Upper midcard':(f<0.6?'Midcard':(f<0.85?'Lower midcard':'Opener')));});});
  return out;
};
/* the player's show runs live, one step at a time (src/31-live.js). This runs all of it, with every call answered safely. */
E.runPlayerShow=function(S,card){return livePlay(S,card);};
E.suggest=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?autoBook(S,P,show):[];};
E.validate=function(S,card){var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return {errors:[],warnings:[]};var v=validate(S,P,show,card),c=cardCost(S,card);if(c>S.bp){if(S.owner.me)v.warnings.push('You are '+(c-S.bp)+' booking power over. As the owner you can overrule, but each extra point costs locker-room trust.');else v.errors.push('These calls need '+c+' booking power and you have '+S.bp+'. Let some matches play out.');}return v;};
E.eligible=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?eligible(S,P,show):[];};
E.showTitles=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?(show.big?P.titles:showTitles(P,show)):[];};
E.nextBig=function(S){var w=S.week+(4-cal(S.week).wom),c=cal(w);return {week:w,name:dbOf(S).events[c.month]||'the next big show',label:c.label};};
E.expected=function(S,show){return r1(expected(S.promos[S.player],show));};
E.cal=cal;E.workRate=workRate;E.rosterOf=rosterOf;E.teamOf=teamOf;E.partnerOf=partnerOf;E.feudOf=feudOf;E.feudsFor=feudsFor;E.activeFeuds=activeFeuds;E.feudLabel=feudLabel;E.feudStage=feudStage;
E.holdLvl=holdLvl;E.isDev=isDev;E.wageFor=wageFor;E.money=money;E.autoBook=autoBook;E.runShow=runShow;E.weekShows=weekShows;
E.feudAct=function(f,S){return feudAct(f,S);};E.ACTN=ACTN;E.RISKN=RISKN;E.TIXN=TIXN;E.ADVN=ADVN;E.SLOTN=SLOTN;E.PRODN=PRODN;E.SLOT_MAX=SLOT_MAX;
E.MT=MT;E.STIP=STIP;E.ACH=ACH;E.STYLE_NAME=STYLE_NAME;E.MONTHS=MONTHS;
