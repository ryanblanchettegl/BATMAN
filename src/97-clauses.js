/* ===== Contract clauses (docs/plans/contract-clauses.md, NEXT.md 11.1) =====
   A wrestler cares about at most three clauses, chosen by who they are. Each one they want and get lowers what they
   ask for. A clause is kept on the wrestler (w.cl) for the length of the deal and does what it says:
   paid travel (their body recovers faster, at a weekly cost), a merchandise share (a quarter of their lines' money), a no-cut promise (letting them go costs six months'
   pay and the room hears about it), and a title match (a promised shot within twelve weeks). */
var CLAUSE={
  travel:{n:'Paid travel',d:'You pay their travel. Their body recovers faster between shows. It costs a tenth of their wage again each week.',save:0.06,
    wants:function(S,w){return w.age>=33||w.cond<70;}},
  nocut:{n:'A no-cut promise',d:'You will not let them go. If you do, it costs six months of their wage and the locker room hears about it.',save:0.08,
    wants:function(S,w){return w.morale<55||!!w.cut;}},
  merch:{n:'A merchandise share',d:'A quarter of what their own merchandise lines make goes to them. Every line with their face on it keeps them happy.',save:0.07,
    wants:function(S,w){return w.mic>=72;}},
  title:{n:'A title match',d:'A match for a belt within twelve weeks of signing. Break it and they will remember.',save:0.1,
    wants:function(S,w){var P=S.promos[S.player];return w.ovr>=P.image-6;}}
};
/** The clauses this wrestler wants, best first, at most three. */
function clausesWanted(S,w){return Object.keys(CLAUSE).filter(function(k){return CLAUSE[k].wants(S,w);}).slice(0,3);}
E.clauses=function(S,id){var w=S.w[id];if(!w)return [];var ask=E.ask(S,w);return clausesWanted(S,w).map(function(k){var c=CLAUSE[k];return {k:k,n:c.n,d:c.d,save:Math.round(ask*c.save/50)*50};});};
/* signing with clauses: the asking price comes down by what each clause is worth to them */
(function(){
  var sign0=E.sign,rel0=E.release;
  E.sign=function(S,id,wage,weeks,cl){
    var w=S.w[id];cl=(cl||[]).filter(function(k){return CLAUSE[k]&&w&&clausesWanted(S,w).indexOf(k)>=0;});
    if(!cl.length)return sign0(S,id,wage,weeks);
    var save=cl.reduce(function(a,k){return a+CLAUSE[k].save;},0),ask0=E.ask;
    E.ask=function(S2,w2){var a=ask0(S2,w2);return w2===w?Math.round(a*(1-save)/50)*50:a;};
    var r;try{r=sign0(S,id,wage,weeks);}finally{E.ask=ask0;}
    if(r&&r.ok){var P=S.promos[S.player];w.cl={};cl.forEach(function(k){w.cl[k]=S.week;});
      if(w.cl.title){var t=P.titles.filter(function(x){return !x.tag&&x.g===w.g&&x.holders.length&&x.holders[0]!==w.id;}).sort(function(a,b){return b.lvl-a.lvl;})[0];
        if(t)S.quests.push({id:S.nid++,type:'shot',w:w.id,title:t.id,due:S.week+12,text:'Promise: give '+w.name+' a match for the '+t.name+' by '+cal(S.week+12).label+' (it is in their contract)'});}
      youRemember(S,w,'clauses','You signed me with '+cl.map(function(k){return CLAUSE[k].n.toLowerCase();}).join(' and ')+' in the contract.',3);
      r.msg+=' The contract has '+cl.map(function(k){return CLAUSE[k].n.toLowerCase();}).join(' and ')+'.';}
    return r;
  };
  E.release=function(S,id){
    var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id||!w.cl||!w.cl.nocut)return rel0(S,id);
    var pay=w.wage*24;P.cash-=pay;rosterOf(S,P.id).forEach(function(x){if(x!==w)x.morale=clamp(x.morale-2,0,100);});S.trust=clamp((S.trust==null?60:S.trust)-5,0,100);
    news(S,'contract',P.name+' broke a no-cut promise to '+w.name+'.');delete w.cl;var msg=rel0(S,id);
    return (msg||'')+' It was a no-cut deal: another '+money(pay)+' paid, and the locker room heard about it.';
  };
})();
/* paid travel: the body recovers faster, and the company pays a tenth of the wage again each week */
WEEKX.push(function(S){if(S.cal)return;var P=S.promos[S.player];rosterOf(S,P.id).forEach(function(w){if(!w.cl||!w.cl.travel)return;w.cond=Math.min(100,w.cond+2);P.cash-=Math.round(w.wage*0.1);});});
/* a merchandise share: somebody with a line out and a share of it is happier for it each week */
WEEKX.push(function(S){if(S.cal)return;var P=S.promos[S.player];(P.lines||[]).forEach(function(L){var w=S.w[L.w];if(w&&w.cl&&w.cl.merch)w.morale=clamp(w.morale+1,0,100);});});
/* a clause lasts as long as the deal it was signed with */
WEEKX.push(function(S){S.w.forEach(function(w){if(w.cl&&(w.promo!==S.player||w.rt))delete w.cl;});});
/* renewing with clauses: the same saving on the new price, and the clauses start again with the new deal */
(function(){
  var ren0=E.renew,ra0=E.renewAsk,pick=function(S,w,cl){return (cl||[]).filter(function(k){return CLAUSE[k]&&clausesWanted(S,w).indexOf(k)>=0;});};
  E.renewAsk=function(S,id,weeks,cl){var a=ra0(S,id,weeks),w=S.w[id];if(!w)return a;var sv=pick(S,w,cl).reduce(function(x,k){return x+CLAUSE[k].save;},0);return Math.round(a*(1-sv)/50)*50;};
  E.renew=function(S,id,weeks,cl){var w=S.w[id];if(!w)return ren0(S,id,weeks);cl=pick(S,w,cl);var ask=E.renewAsk(S,id,weeks,cl),r=ren0(S,id,weeks);if(!cl.length||w.promo!==S.player)return r;
    w.wage=ask;w.cl={};cl.forEach(function(k){w.cl[k]=S.week;});
    if(w.cl.title){var P=S.promos[S.player],t=P.titles.filter(function(x){return !x.tag&&x.g===w.g&&x.holders.length&&x.holders[0]!==w.id;}).sort(function(a,b){return b.lvl-a.lvl;})[0];
      if(t)S.quests.push({id:S.nid++,type:'shot',w:w.id,title:t.id,due:S.week+12,text:'Promise: give '+w.name+' a match for the '+t.name+' by '+cal(S.week+12).label+' (it is in their contract)'});}
    return w.name+' re-signs for '+money(w.wage)+' a week, with '+cl.map(function(k){return CLAUSE[k].n.toLowerCase();}).join(' and ')+' in the contract.';};
})();
E.CLAUSE=CLAUSE;
