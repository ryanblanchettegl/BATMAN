/* ---------- the money side: loans and investors, licensing, budgets ---------- */

/* ---------- 53. Loans and investors (P.loan, P.inv); only an owner can borrow or sell a share ---------- */
var LOANT={
  small:{n:'Small loan',mult:4,rate:0.0016},
  medium:{n:'Medium loan',mult:10,rate:0.0020},
  large:{n:'Large loan',mult:20,rate:0.0026}
};
var INVWANT={
  risk:{n:'want the product pushed harder',d:'A risk level of Edgy or above.',ok:function(S,P){return P.risk>=2;},fix:function(S,P){P.risk=Math.min(riskRange(P)[1],Math.max(P.risk,2));}},
  safe:{n:'want no trouble with sponsors',d:'A risk level of Mainstream or below.',ok:function(S,P){return P.risk<=1;},fix:function(S,P){P.risk=Math.max(riskRange(P)[0],Math.min(P.risk,1));}},
  prod:{n:'want a better looking show',d:'Production values of Slick or better.',ok:function(S,P){return P.prodLvl>=3;},fix:function(S,P){P.prodLvl=Math.max(P.prodLvl,3);}},
  lean:{n:'want a lean company',d:'Wages under 45% of what comes in.',ok:function(S,P){var r=P.hist[P.hist.length-1];return !r||r.wages<=r.inc*0.45;},fix:null}
};
function financeCost(S,P,net){
  var t=0;
  if(P.loan){var pay=P.loan.amt/52+P.loan.bal*P.loan.rate;t+=pay;P.loan.bal=Math.max(0,P.loan.bal-P.loan.amt/52);if(P.loan.bal<=1){news(S,'money','The last loan payment is made. You owe nothing.');P.loan=null;}}
  if(P.inv&&net>0)t+=net*P.inv.share;
  return Math.round(t);
}
E.loanOffers=function(S){var P=S.promos[S.player];return Object.keys(LOANT).map(function(k){return {id:k,n:LOANT[k].n,amt:Math.round(P.inc0*LOANT[k].mult),weekly:Math.round(P.inc0*LOANT[k].mult*(1/52+LOANT[k].rate)),apr:Math.round(LOANT[k].rate*52*1000)/10};});};
E.investorOffer=function(S){var P=S.promos[S.player];return {amt:Math.round(P.inc0*16),share:0.15};};
E.finance=function(S){
  var P=S.promos[S.player],wants=P.inv?INVWANT[P.inv.want]:null;
  return {owner:!!S.owner.me,loan:P.loan?{amt:P.loan.amt,bal:Math.round(P.loan.bal),weekly:Math.round(P.loan.amt/52+P.loan.bal*P.loan.rate)}:null,
    inv:P.inv?{share:P.inv.share,want:wants.n,d:wants.d,ok:wants.ok(S,P),trust:Math.round(P.inv.trust),buyout:Math.round(P.inv.paid*1.4)}:null};
};
E.takeLoan=function(S,k){
  var P=S.promos[S.player],T=LOANT[k];if(!S.owner.me)return {ok:false,text:'Only an owner can borrow for the company.'};
  if(!T)return {ok:false,text:'Pick a loan.'};if(P.loan)return {ok:false,text:'You already have a loan. Pay it off first.'};
  var amt=Math.round(P.inc0*T.mult);P.cash+=amt;P.loan={amt:amt,bal:amt,rate:T.rate};
  news(S,'money','You borrowed '+money(amt)+' from the bank.');
  return {ok:true,text:'The bank lends '+money(amt)+'. It comes back over a year, at about '+money(Math.round(amt/52+amt*T.rate))+' a week with interest.'};
};
E.repayLoan=function(S){
  var P=S.promos[S.player];if(!P.loan)return {ok:false,text:'You have no loan.'};
  var due=Math.round(P.loan.bal);if(P.cash<due)return {ok:false,text:'You need '+money(due)+' in the bank to clear it.'};
  P.cash-=due;P.loan=null;news(S,'money','You paid off the bank loan early.');return {ok:true,text:'The loan is paid off.'};
};
E.sellShare=function(S){
  var P=S.promos[S.player],o=E.investorOffer(S);if(!S.owner.me)return {ok:false,text:'Only an owner can sell a share.'};
  if(P.inv)return {ok:false,text:'You already have an investor.'};
  var want=pick(S,Object.keys(INVWANT));P.cash+=o.amt;P.inv={share:o.share,want:want,trust:60,paid:o.amt};
  news(S,'money','An investor bought '+Math.round(o.share*100)+'% of '+P.name+' for '+money(o.amt)+'.');
  return {ok:true,text:'The investor puts in '+money(o.amt)+' and takes '+Math.round(o.share*100)+'% of every profit. They '+INVWANT[want].n+': '+INVWANT[want].d};
};
E.buyOutInvestor=function(S){
  var P=S.promos[S.player];if(!P.inv)return {ok:false,text:'There is no investor.'};
  var due=Math.round(P.inv.paid*1.4);if(P.cash<due)return {ok:false,text:'Buying them out costs '+money(due)+'.'};
  P.cash-=due;P.inv=null;news(S,'money','You bought your investor out.');return {ok:true,text:'The investor is gone and the company is yours again.'};
};
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],iv=P.inv;if(!iv)return;
  var W=INVWANT[iv.want];iv.trust=clamp(iv.trust+(W.ok(S,P)?1:-2),0,100);
  if(iv.trust<=25&&!S.inbox.some(function(e){return e.type==='investor'&&!e.done;})&&(iv.at==null||S.week-iv.at>=8)){
    iv.at=S.week;
    pushEv(S,{type:'investor',text:'Your investor is losing patience. They '+W.n+', and they say the product is not there. They would like it fixed, or to talk about being bought out.',
      choices:[W.fix?'Give in: change the product to suit them':'Promise to cut the payroll','Buy them out for '+money(Math.round(iv.paid*1.4)),'Hold your ground']});
  }
});
EVR.investor=function(S,ev,choice,P){
  var iv=P.inv;if(!iv)return 'The investor is already gone.';var W=INVWANT[iv.want];
  if(choice===0){if(W.fix)W.fix(S,P);iv.trust=clamp(iv.trust+25,0,100);return W.fix?'You changed the product to suit them. The investor is content for now.':'You promised to trim the payroll. The investor will be watching the numbers.';}
  if(choice===1){var r=E.buyOutInvestor(S);return r.text;}
  iv.trust=clamp(iv.trust-10,0,100);S.owner.trust=clamp(S.owner.trust-2,0,100);P.image=clamp(P.image-0.3,0,100);
  return 'You told them no. The investor leaks their side to the press, and the company looks a little less steady.';
};
E.LOANT=LOANT;
