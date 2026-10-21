/* wraps: 90-api.js, 97-clauses.js (it must sort after them; test-buildorder.js checks) */
/* Contracts by the size of the company (Ryan, 21 October: "realistic contracts. Big companies do yearly contracts,
   indies do per show appearance"). Two kinds of deal:
     - a yearly deal (w.dl 'year'): one to three years, a salary every week whether they are booked or not. The big
       companies put everybody on one, and a mid-sized company puts the top of its card on one.
     - per appearance (w.dl 'show'): a fee for each show they are on (w.fee), nothing in a week they are not. No long
       deal: a handshake that rolls on (w.con stays at 12), so anybody can make them an offer. The small companies
       put everybody on one, and a mid-sized company the rest of its card. A world can mark a deal as per appearance
       (contract_type 'pwa').
   The week's wage bill (settle() in src/40-week.js) pays a fee for each show a per-appearance wrestler was on
   (payWeek()); the wage budget still reads w.wage, what a deal costs in an ordinary week. No rnd(S). */
var CT_BIG=65,CT_INDIE=50,CT_ROLL=12;
function ctWeekly(P){return Math.max(1,(P.shows||[]).length);}
/** What deal a company gives this person. */
function ctPolicy(S,P,w){
  if(!P)return 'year';if(w.pwa)return 'show';if(w.nw)return P.image<CT_INDIE?'show':'year';
  if(P.image>=CT_BIG)return 'year';if(P.image<CT_INDIE)return 'show';
  // a mid-sized company: the top third of its card (by how over they are) on yearly deals, the rest per appearance
  var R=rosterOf(S,P.id).filter(function(x){return !x.nw&&x.id!==w.id;}),above=R.filter(function(x){return (x.ovr||0)>(w.ovr||0);}).length;
  return above<Math.ceil((R.length+1)/3)?'year':'show';
}
/** Fee a show: a quarter more than a salaried week spread over the shows, since nothing is promised. */
function ctFee(P,wage){var v=wage*1.25/ctWeekly(P);return Math.max(50,v<1000?Math.round(v/10)*10:Math.round(v/50)*50);}
function ctAssign(S,w,fee){
  var P=S.promos[w.promo];if(!P)return;w.dl=ctPolicy(S,P,w);w.dlP=w.promo;
  if(w.dl==='show'){w.fee=fee||ctFee(P,w.wage||wageFor(w.ovr,P));w.con=CT_ROLL;}else w.fee=null;
  w.dlc=w.con;
}
/* every week: anybody new to a company gets its kind of deal, a renewal is a new deal, and a handshake rolls on */
function ctWeek(S){
  S.w.forEach(function(w){
    if(!w||w.rt||w.promo==='FA'||!S.promos[w.promo]){if(w&&w.promo==='FA'){w.dl=null;w.dlP=null;}return;}
    if(w.dlP!==w.promo||w.dl==null||(w.dl==='year'&&w.con>(w.dlc||0)+1)){ctAssign(S,w,w.dlP===w.promo?w.fee:null);return;}
    if(w.dl==='show')w.con=CT_ROLL;
    w.dlc=w.con;
  });
}
NEWX.push(ctWeek);WEEKX.push(ctWeek);
/* who appeared on a show this week, and how many times: a fee is paid for each */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||!rep||!rep.segs||!P)return;var seen={};
  rep.segs.forEach(function(s){(s.ids||s.bids||[]).forEach(function(id){var w=S.w[id];if(!w||w.promo!==P.id||seen[id])return;seen[id]=1;if(w.shw!==S.week){w.shw=S.week;w.shn=0;}w.shn++;});});
});
/** What the week's wages come to: salaries, and a fee for each show a per-appearance wrestler was on. */
function payWeek(S,P){
  var s=0;S.w.forEach(function(w){if(w.promo!==P.id)return;s+=w.dl==='show'&&w.fee!=null?(w.shw===S.week?w.fee*(w.shn||1):0):w.wage;});
  return s+deskWage(S,P);
}
/** A deal in words, for the screens. */
E.contractOf=function(S,w){
  if(typeof w==='number')w=S.w[w];if(!w||w.promo==='FA')return null;
  if(w.dl==='show')return {ct:'show',n:'Per appearance',pay:w.fee,short:'Per show',line:money(w.fee||0)+' a show, paid only when they are booked. A handshake: other companies can make them an offer.'};
  var y=Math.floor(Math.max(0,w.con)/48),r=Math.max(0,w.con)%48,left=(y?y+(y===1?' year':' years'):'')+(y&&r?' and ':'')+(r||!y?r+(r===1?' week':' weeks'):'');
  return {ct:'year',n:'Yearly deal',pay:w.wage,short:Math.max(0,w.con)+'w',line:money(w.wage)+' a week, '+left+' left.'};
};
/** The terms the player can offer this person: the kind of deal, the ask, and the lengths. */
E.offerTerms=function(S,id){
  var w=S.w[id],P=S.promos[S.player];if(!w||!P)return null;var ct=ctPolicy(S,P,w),ask=E.ask(S,w);
  return ct==='show'?{ct:'show',n:'Per appearance',ask:ask,fee:ctFee(P,ask),lens:null,why:P.name+' pays per appearance: a fee for each show they are on, nothing promised beyond that.'}
    :{ct:'year',n:'Yearly deal',ask:ask,fee:null,lens:[[48,'1 year'],[96,'2 years'],[144,'3 years']],why:P.name+' signs people to yearly deals: a salary every week, booked or not.'};
};
/* signing: the deal takes the company's kind at once; a fee offered for a per-appearance deal is turned into its
   ordinary week for the wage budget and the asking price */
(function(){
  var s0=E.sign;
  E.sign=function(S,id,wage,weeks,cl){var r=s0.apply(this,arguments);var w=S.w[id];if(r&&r.ok&&w&&w.promo===S.player)ctAssign(S,w);return r;};
  E.signFee=function(S,id,fee,cl){
    var P=S.promos[S.player],w=S.w[id];if(!w||!P)return {ok:false,msg:'Not available.'};
    var wage=Math.round(fee*ctWeekly(P)/1.25/50)*50,r=E.sign(S,id,wage,CT_ROLL,cl);
    if(r&&r.ok&&w.promo===S.player){w.fee=fee;r.msg=w.name+' will work for '+money(fee)+' a show.';}
    return r;
  };
})();
/* a handshake costs nothing to end, and a per-appearance deal is not renewed (it rolls on by itself) */
(function(){
  var r0=E.release,n0=E.renew;
  E.release=function(S,id){var w=S.w[id],P=S.promos[S.player];if(w&&P&&w.promo===P.id&&w.dl==='show'){var keep=w.wage;w.wage=0;var r=r0.apply(this,arguments);w.wage=keep;return r;}return r0.apply(this,arguments);};
  E.renew=function(S,id,weeks){var w=S.w[id];if(w&&w.dl==='show')return w.name+' works per appearance: there is nothing to renew.';var r=n0.apply(this,arguments);if(w)w.dlc=w.con;return r;};
})();
/* somebody under contract elsewhere does not leave for less than half of what they earn there; a free agent asks what the signing company pays */
(function(){var a0=E.ask;E.ask=function(S,w){var a=a0.apply(this,arguments);if(!w||w.nw||w.promo===S.player||w.promo==='FA'||!(w.wage>0))return a;return Math.max(a,Math.round(w.wage*0.5/50)*50);};})();
E.__payWeek=payWeek;E.__ctWeek=ctWeek;   // for test-staff.js
