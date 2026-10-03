/* ---------- the company: broadcast slot, production, risk, tickets, advertising, sponsors ---------- */
function mkOffer(S,P){
  var used={};S.sponsors.concat(S.spOffers).forEach(function(x){used[x.name]=1;});
  var names=(dbOf(S).sponsors||['Ironclad Tools','Blue Comet Energy','Harbor Lager','Pinnacle Insurance','Redline Auto Parts','Summit Sports Drinks','Big Sky Jerky','Voltage Games']).filter(function(n){return !used[n];});if(!names.length)return null;
  var MD=modelOf(P),type=pick(S,MD.riskFree?['image','rating']:['risk','image','rating']),o={name:pick(S,names),weeks:ri(S,12,36),type:type},mult=1;
  if(type==='risk'){o.val=ri(S,0,2);mult=[1.5,1.2,1][o.val];o.text='Keep the product '+RISKN[o.val]+(o.val?' or tamer':'');}
  else if(type==='image'){o.val=Math.round(P.image-ri(S,0,3));o.text='Popularity stays at '+o.val+' or better';}
  else{var lo=99;Object.keys(P.base).forEach(function(k){if(P.base[k]<lo)lo=P.base[k];});o.val=Math.round(lo+0.6*(P.image-P.image0)-ri(S,5,10));o.text='No show rated under '+o.val+'%';}
  o.pay=Math.max(1000,Math.round(P.inc0*(0.012+rnd(S)*0.02)*mult*mixOf(P).sp/1000)*1000);
  return o;
}
function refreshOffers(S){var P=S.promos[S.player];S.spOffers=[];for(var i=0;i<3;i++){var o=mkOffer(S,P);if(o)S.spOffers.push(o);}}
function sponsorBroken(S,P,x){
  if(x.type==='risk')return P.risk>x.val;
  if(x.type==='image')return P.image<x.val;
  return S.reports.some(function(r){return r.week===S.week&&r.rating<x.val;});
}
NEWX.push(function(S){refreshOffers(S);});
WEEKX.push(function(S){
  var P=S.promos[S.player];
  S.sponsors=S.sponsors.filter(function(x){
    if(sponsorBroken(S,P,x)){news(S,'money',x.name+' pulled its sponsorship: '+x.text.toLowerCase()+' was the deal.');P.image=clamp(P.image-0.3,5,100);return false;}
    x.weeks--;if(x.weeks<=0){news(S,'money','The '+x.name+' sponsorship ran its course.');return false;}
    return true;
  });
  if(S.week%4===0)refreshOffers(S);
  // the network reviews your slot
  if(P.slot>0&&(P.image<SLOT_REQ[P.slot]-5||P.risk>SLOT_RISK[P.slot])){P.slot--;news(S,'money','The network moved '+P.name+' down to '+SLOTN[P.slot].toLowerCase()+'.');}
});
E.setCompany=function(S,k,v){
  var P=S.promos[S.player],max={prodLvl:4,risk:3,tix:3,adv:3,camp:3,med:3}[k];if(max==null||!S.owner.me)return;
  P[k]=clamp(Math.round(v),0,max);if(k==='risk'){var rr=riskRange(P);P.risk=clamp(P.risk,rr[0],rr[1]);}
};
E.sponsorOk=function(S,o){var P=S.promos[S.player];return S.sponsors.length<spMax(P)&&!(o.type==='risk'&&P.risk>o.val)&&!(o.type==='image'&&P.image<o.val);};
E.acceptSponsor=function(S,i){var o=S.spOffers[i];if(!o||!E.sponsorOk(S,o))return null;S.spOffers.splice(i,1);S.sponsors.push(o);news(S,'money',o.name+' signed on as a sponsor for '+money(o.pay)+' a week.');return o.name+' is on board for '+o.weeks+' weeks.';};
E.dropSponsor=function(S,i){var o=S.sponsors[i];if(!o)return null;S.sponsors.splice(i,1);return 'You ended the '+o.name+' deal.';};
E.slotOdds=function(S){
  var P=S.promos[S.player],to=P.slot+1;if(to>2)return {can:false,why:'You already have the best slot there is.'};
  if(P.risk>SLOT_RISK[to])return {can:false,why:'The network will not put an '+RISKN[P.risk].toLowerCase()+' product in '+SLOTN[to].toLowerCase()+'.'};
  if(P.image<SLOT_REQ[to])return {can:false,why:SLOTN[to]+' needs popularity '+SLOT_REQ[to]+'. You are at '+P.image.toFixed(1)+'.'};
  if(S.week-S.slotAsk<8)return {can:false,why:'The network will not take another meeting for '+(8-(S.week-S.slotAsk))+' weeks.'};
  return {can:true,to:to,p:clamp(0.25+(P.image-SLOT_REQ[to])/40+(P.trend||0)/20,0.05,0.9)};
};
E.askSlot=function(S){
  var P=S.promos[S.player],o=E.slotOdds(S);if(!o.can)return o.why;
  S.slotAsk=S.week;var roll=rnd(S);
  if(roll<o.p){P.slot=o.to;news(S,'money','The network moved '+P.name+' up to '+SLOTN[P.slot].toLowerCase()+'.');return 'The network says yes. You move to '+SLOTN[P.slot].toLowerCase()+': more viewers, and room for '+SLOT_MAX[P.slot]+' matches a show.';}
  S.quests.push({id:S.nid++,type:'prove',left:2,due:S.week+12,text:'Network: beat expectations on your next two TV shows to earn the better slot'});
  return 'The network says not yet, but leaves a door open: beat expectations on your next two TV shows and the slot is yours.';
};
E.company=function(S){var P=S.promos[S.player],rr=riskRange(P);return {riskMin:rr[0],riskMax:rr[1],spMax:spMax(P),adCost:ADV_C.map(function(c){return Math.round(c*P.inc0);}),prodCost:PRODF.map(function(f){return Math.round(P.prod*f/PRODF[P.prod0]);}),tixP:TIX_P,tixD:TIX_D,slotV:SLOT_V.map(function(v){return v/SLOT_V[P.slot0];}),slotReq:SLOT_REQ};};
