// @ts-nocheck
/* Moved from src/90-api.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
/* ---------- roster moves ---------- */
$L.E.ask=function(S,w){var P=S.promos[S.player],MD=$L.modelOf(P),m=(w.promo==='FA'?1:1.3)*$L.talkDiscount(S);if(w.promo!=='FA'&&S.promos[w.promo].image>P.image+10)m+=0.25;if(S.pw10&&S.pw10.indexOf(w.id)>=0)m+=0.1;
  if(MD.premium&&w.ovr>P.image+8)m*=MD.premium;                                   // a startup pays over the odds for a name
  if(MD.chip&&w.cut&&S.week-w.cut.w<52&&w.promo==='FA')m*=0.85;                   // a castoff comes cheap to an underdog
  return Math.round($L.wageFor(w.ovr,P)*m/50)*50;};
$L.E.canSign=function(S,w){var P=S.promos[S.player],MD=$L.modelOf(P);return !(MD.gender&&w.g!==MD.gender)&&w.ovr<=P.image+(MD.reach||25);};
$L.E.signWhy=function(S,w){var P=S.promos[S.player],MD=$L.modelOf(P);return MD.gender&&w.g!==MD.gender?P.name+' is an all-women company.':($L.E.canSign(S,w)?null:w.name+' is not interested in a promotion your size yet. Raise your popularity first.');};
$L.E.market=function(S){return S.w.filter(function(w){return !w.rt&&(w.promo==='FA'||(w.promo!==S.player&&w.con<=12));});};
$L.E.sign=function(S,id,wage,weeks){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo===P.id)return {ok:false,msg:'Not available.'};
  if(w.rt)return {ok:false,msg:w.name+' has retired.'};
  if(w.lock>S.week)return {ok:false,msg:w.name+' will not talk again until '+$L.cal(w.lock).label+'.'};
  if(w.promo!=='FA'&&w.con>12)return {ok:false,msg:w.name+' is under contract.'};
  if(!$L.E.canSign(S,w))return {ok:false,msg:$L.E.signWhy(S,w)};
  if($L.wagesWeek(S,P)+wage>$L.E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on that. It would take the wage bill past the '+$L.money($L.E.budget(S))+' a week budget.'};
  var ask=$L.E.ask(S,w);
  if(wage<ask*0.97){
    if(!w.ctr){w.ctr=true;var ca=Math.round(ask*1.08/50)*50;var half=Math.round((wage+ca)/2/50)*50;$L.pushEv(S,{type:'counter',w:w.id,ask:ca,offer:wage,half:half,weeks:weeks||48,text:w.name+'\u2019s side did not like your offer of '+$L.money(wage)+', but they have come back with a number: '+$L.money(ca)+' a week.',choices:['Accept at '+$L.money(ca)+' a week','Meet them halfway: '+$L.money(half)+' a week','Walk away'],checks:{1:$L.mkCheck(7,[{n:w.promo==='FA'?'They need the work':'They have a job already',v:w.promo==='FA'?1:-1},{n:'They are unhappy where they are',v:w.promo!=='FA'&&w.morale<45?1:0}].concat($L.skillMods(S,'talk')))}});return {ok:false,msg:w.name+' turned that down and sent a counter-offer. It is in your inbox.'};}
    w.lock=S.week+4;return {ok:false,msg:'Talks broke down. '+w.name+' wanted about '+$L.money(ask)+' a week.'};
  }
  var from=w.promo;if(from!=='FA'){S.promos[from].rel=$L.clamp((S.promos[from].rel||0)-12,-100,100);$L.leaveCompany(S,w,'left for '+P.name);}
  $L.joinCompany(S,w,P,wage,weeks||48);
  $L.news(S,'contract',P.name+' signed '+w.name+(from!=='FA'?' away from '+S.promos[from].name:'')+'.');
  $L.award(S,from==='FA'?'ACH_SIGN':'ACH_POACH');if(w.cr)$L.award(S,'ACH_CREATE');   // a wrestler made in Create a Player
  return {ok:true,msg:w.name+' signs for '+$L.money(wage)+' a week.'};
};
$L.E.release=function(S,id){var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id)return null;var pay=w.wage*4;P.cash-=pay;if(S.owner.pledge==='stable'){$L.rosterOf(S,P.id).forEach(function(x){x.morale=$L.clamp(x.morale-3,0,100);});S.trust=$L.clamp(S.trust-4,0,100);}$L.leaveCompany(S,w,'released');w.promo='FA';w.brand=null;$L.news(S,'contract',P.name+' released '+w.name+'.');return w.name+' is released. Severance: '+$L.money(pay)+'.';};
/** What a new contract would cost a week, before it is signed. */
$L.E.renewAsk=function(S,id,weeks){var w=S.w[id];if(!w||w.promo!==S.player)return 0;return Math.round($L.renewAsk(S,w)*(weeks>60?1.1:1)/50)*50;};
$L.E.renew=function(S,id,weeks){var w=S.w[id];if(!w||w.promo!==S.player)return null;var ask=Math.round($L.renewAsk(S,w)*(weeks>60?1.1:1)/50)*50;w.wage=ask;w.con=weeks;w.cn=false;w.morale=$L.clamp(w.morale+3,0,100);return w.name+' re-signs for '+$L.money(ask)+' a week.';};
$L.E.setBrand=function(S,id,b){var w=S.w[id];if(w&&w.promo===S.player){w.brand=b;var tm=$L.teamOf(S,w);if(tm&&S.w[tm.m[0]].brand!==S.w[tm.m[1]].brand)$L.dissolveTeam(S,tm);}};
$L.E.pushMap=function(S,pid){
  var out={},P=S.promos[pid],groups={};
  $L.rosterOf(S,pid).forEach(function(w){var k=(w.brand||'')+w.g;(groups[k]=groups[k]||[]).push(w);});
  Object.keys(groups).forEach(function(k){var L=groups[k].sort(function(a,b){return b.ovr-a.ovr;}),n=L.length;L.forEach(function(w,i){var f=i/n;out[w.id]=f<0.1?'Main event':(f<0.3?'Upper midcard':(f<0.6?'Midcard':(f<0.85?'Lower midcard':'Opener')));});});
  return out;
};
/* the player's show runs live, one step at a time (src/31-live.js). This runs all of it, with every call answered safely. */
$L.E.runPlayerShow=function(S,card){return $L.livePlay(S,card);};
$L.E.suggest=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?$L.autoBook(S,P,show):[];};
$L.E.validate=function(S,card){var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return {errors:[],warnings:[]};var v=$L.validate(S,P,show,card),c=$L.cardCost(S,card);if(c>S.bp){if(S.owner.me)v.warnings.push('You are '+(c-S.bp)+' booking power over. As the owner you can overrule, but each extra point costs locker-room trust.');else v.errors.push('These calls need '+c+' booking power and you have '+S.bp+'. Let some matches play out.');}return v;};
$L.E.eligible=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?$L.eligible(S,P,show):[];};
$L.E.showTitles=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?(show.big?P.titles:$L.showTitles(P,show)):[];};
$L.E.nextBig=function(S){var w=$L.nextBigFrom(S.week,S),c=$L.cal(w);return {week:w,name:$L.evName(S,S.promos[S.player],c.month)||'the next big show',label:c.label};};
$L.E.expected=function(S,show){return $L.r1($L.expected(S.promos[S.player],show)-($L.firstNight(S)?$L.FIRST_NIGHT:0));};   // a new booker's first night (src/30-show.js)
$L.E.cal=$L.cal;$L.E.workRate=$L.workRate;$L.E.rosterOf=$L.rosterOf;$L.E.teamOf=$L.teamOf;$L.E.partnerOf=$L.partnerOf;$L.E.feudOf=$L.feudOf;$L.E.feudsFor=$L.feudsFor;$L.E.activeFeuds=$L.activeFeuds;$L.E.feudLabel=$L.feudLabel;$L.E.feudStage=$L.feudStage;
$L.E.holdLvl=$L.holdLvl;$L.E.isDev=$L.isDev;$L.E.wageFor=$L.wageFor;$L.E.money=$L.money;$L.E.autoBook=$L.autoBook;$L.E.runShow=$L.runShow;$L.E.weekShows=$L.weekShows;
$L.E.feudAct=function(f,S){return $L.feudAct(f,S);};$L.E.ACTN=$L.ACTN;$L.E.RISKN=$L.RISKN;$L.E.TIXN=$L.TIXN;$L.E.ADVN=$L.ADVN;$L.E.SLOTN=$L.SLOTN;$L.E.PRODN=$L.PRODN;$L.E.SLOT_MAX=$L.SLOT_MAX;
$L.E.MT=$L.MT;$L.E.STIP=$L.STIP;$L.E.ACH=$L.ACH;$L.E.STYLE_NAME=$L.STYLE_NAME;$L.E.MONTHS=$L.MONTHS;
