// @ts-nocheck
/* Moved from src/50-company.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.mkOffer = mkOffer; $L.refreshOffers = refreshOffers; $L.sponsorBroken = sponsorBroken;
/* ---------- the company: broadcast slot, production, risk, tickets, advertising, sponsors ---------- */
export var SP_TIER=['Local','Regional','National'];
$L.SP_TIER = SP_TIER;
export function mkOffer(S,P){
  var used={};S.sponsors.concat(S.spOffers).forEach(function(x){used[x.name]=1;});
  var names=($L.dbOf(S).sponsors||['Ironclad Tools','Blue Comet Energy','Harbor Lager','Pinnacle Insurance','Redline Auto Parts','Summit Sports Drinks','Big Sky Jerky','Voltage Games']).filter(function(n){return !used[n];});if(!names.length)return null;
  var MD=$L.modelOf(P),type=$L.pick(S,MD.riskFree?['image','rating']:['risk','image','rating']),o={name:$L.pick(S,names),weeks:$L.ri(S,12,36),type:type},mult=1;
  if(type==='risk'){o.val=$L.ri(S,0,2);mult=[1.5,1.2,1][o.val];o.text='Keep the product '+$L.RISKN[o.val]+(o.val?' or tamer':'');}
  else if(type==='image'){o.val=Math.round(P.image-$L.ri(S,0,3));o.text='Popularity stays at '+o.val+' or better';}
  else{var lo=99;Object.keys(P.base).forEach(function(k){if(P.base[k]<lo)lo=P.base[k];});o.val=Math.round($L.crowdScoreD(-$L.ri(S,5,10)));o.cg=1;o.text='No show graded under '+$L.gradeG(o.val);}
  // a tier, picked by a hash so the seeded draws stay in step: national sponsors only talk to a popular company (TASKS 6)
  var hv=$L.h01('sp'+S.seed+o.name+S.week),tr=P.image>=65&&hv<0.3?2:(P.image>=45&&hv<0.65?1:0);o.tier=tr;o.tn=$L.SP_TIER[tr];mult*=[1,1.35,1.8][tr];
  o.pay=(function(v){return v<5000?Math.max(100,Math.round(v/100)*100):Math.round(v/1000)*1000;})(P.inc0*(0.012+$L.rnd(S)*0.02)*mult*$L.mixOf(P).sp);
  return o;
}
export function refreshOffers(S){var P=S.promos[S.player];S.spOffers=[];for(var i=0;i<3;i++){var o=$L.mkOffer(S,P);if(o)S.spOffers.push(o);}}
export function sponsorBroken(S,P,x){
  if(x.type==='risk')return P.risk>x.val;
  if(x.type==='image')return P.image<x.val;
  $L.cgFix(S);return S.reports.some(function(r){return r.week===S.week&&!$L.gradeMeets($L.repCS(r),x.val);});
}
$L.NEWX.push(function(S){$L.refreshOffers(S);});
$L.WEEKX.push(function(S){
  var P=S.promos[S.player];
  S.sponsors=S.sponsors.filter(function(x){
    if($L.sponsorBroken(S,P,x)){$L.news(S,'money',x.name+' pulled its sponsorship: '+x.text.toLowerCase()+' was the deal.');P.image=$L.clamp(P.image-0.3,5,100);return false;}
    x.weeks--;if(x.weeks<=0){$L.news(S,'money','The '+x.name+' sponsorship ran its course.');return false;}
    return true;
  });
  if(S.week%4===0)$L.refreshOffers(S);
  // the network reviews your slot
  if(P.slot>0&&(P.image<$L.SLOT_REQ[P.slot]-5||P.risk>$L.SLOT_RISK[P.slot])){P.slot--;$L.news(S,'money','The network moved '+P.name+' down to '+$L.SLOTN[P.slot].toLowerCase()+'.');}
});
$L.E.setCompany=function(S,k,v){
  var P=S.promos[S.player],max={prodLvl:4,risk:3,tix:3,adv:3,camp:3,med:3,trv:2}[k];if(max==null||!S.owner.me)return;
  P[k]=$L.clamp(Math.round(v),0,max);if(k==='risk'){var rr=$L.riskRange(P);P.risk=$L.clamp(P.risk,rr[0],rr[1]);}
};
$L.E.sponsorOk=function(S,o){var P=S.promos[S.player];return S.sponsors.length<$L.spMax(P)&&!(o.type==='risk'&&P.risk>o.val)&&!(o.type==='image'&&P.image<o.val);};
$L.E.acceptSponsor=function(S,i){var o=S.spOffers[i];if(!o||!$L.E.sponsorOk(S,o))return null;S.spOffers.splice(i,1);S.sponsors.push(o);$L.news(S,'money',o.name+' signed on as a sponsor for '+$L.money(o.pay)+' a week.');return o.name+' is on board for '+o.weeks+' weeks.';};
$L.E.dropSponsor=function(S,i){var o=S.sponsors[i];if(!o)return null;S.sponsors.splice(i,1);return 'You ended the '+o.name+' deal.';};
$L.E.slotOdds=function(S){
  var P=S.promos[S.player],to=P.slot+1;if(to>2)return {can:false,why:'You already have the best slot there is.'};
  if(P.risk>$L.SLOT_RISK[to])return {can:false,why:'The network will not put an '+$L.RISKN[P.risk].toLowerCase()+' product in '+$L.SLOTN[to].toLowerCase()+'.'};
  if(P.image<$L.SLOT_REQ[to])return {can:false,why:$L.SLOTN[to]+' needs popularity '+$L.SLOT_REQ[to]+'. You are at '+P.image.toFixed(1)+'.'};
  if(S.week-S.slotAsk<8)return {can:false,why:'The network will not take another meeting for '+(8-(S.week-S.slotAsk))+' weeks.'};
  return {can:true,to:to,p:$L.clamp(0.25+(P.image-$L.SLOT_REQ[to])/40+(P.trend||0)/20,0.05,0.9)};
};
$L.E.askSlot=function(S){
  var P=S.promos[S.player],o=$L.E.slotOdds(S);if(!o.can)return o.why;
  S.slotAsk=S.week;var roll=$L.rnd(S);
  if(roll<o.p){P.slot=o.to;$L.news(S,'money','The network moved '+P.name+' up to '+$L.SLOTN[P.slot].toLowerCase()+'.');return 'The network says yes. You move to '+$L.SLOTN[P.slot].toLowerCase()+': more viewers, and room for '+$L.SLOT_MAX[P.slot]+' matches a show.';}
  S.quests.push({id:S.nid++,type:'prove',left:2,due:S.week+12,text:'Network: beat expectations on your next two TV shows to earn the better slot'});
  return 'The network says not yet, but leaves a door open: beat expectations on your next two TV shows and the slot is yours.';
};
$L.E.company=function(S){var P=S.promos[S.player],rr=$L.riskRange(P);return {riskMin:rr[0],riskMax:rr[1],spMax:$L.spMax(P),adCost:$L.ADV_C.map(function(c){return Math.round(c*P.inc0);}),prodCost:$L.PRODF.map(function(f){return Math.round(P.prod*f/$L.PRODF[P.prod0]);}),tixP:$L.TIX_P,tixD:$L.TIX_D,slotV:$L.SLOT_V.map(function(v){return v/$L.SLOT_V[P.slot0];}),slotReq:$L.SLOT_REQ};};

/* a national sponsor's advertising brings people in: every show of yours draws a little more while one is signed */
$L.PREX.push(function(S){if((S.sponsors||[]).some(function(o){return o.tier===2;}))S.hype=(S.hype||0)+0.02;});

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.SP_TIER = SP_TIER;
$L.mkOffer = mkOffer;
$L.refreshOffers = refreshOffers;
$L.sponsorBroken = sponsorBroken;
