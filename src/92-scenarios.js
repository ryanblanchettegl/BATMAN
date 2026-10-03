/* ---------- 95. Scenarios: a problem and a deadline, each ending with a result (S.scn) ---------- */
var SCN={
  rescue:{n:'Save the company',promo:'ttt',weeks:26,d:'A small company with the wage bill too high and almost no cash. Keep it open for 26 weeks and end with $1.5M in the bank.',
    setup:function(S){var P=S.promos[S.player];P.cash=Math.round(P.inc0*0.8);rosterOf(S,P.id).forEach(function(w){w.wage=Math.round(w.wage*1.25/50)*50;});},
    check:function(S){var P=S.promos[S.player],ok=P.cash>=1500000;return {ok:ok,text:ok?'The company is safe: '+money(P.cash)+' in the bank after 26 weeks.':'The company is still open, but only '+money(P.cash)+' is in the bank. The target was $1.5M.'};},
    figures:function(S){var P=S.promos[S.player];return ['Cash '+money(P.cash)+' (target $1.5M)'];}},
  champion:{n:'A champion from the bottom',promo:'ocw',weeks:39,d:'One of the least known men on the roster has been picked as your project. Have them hold the top title when 39 weeks are up.',
    setup:function(S){var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.g==='M'&&w.age<=30;}).sort(function(a,b){return a.ovr-b.ovr;});var tg=R[Math.min(2,R.length-1)];S.scn.target=tg.id;tg.mom=0;},
    check:function(S){var P=S.promos[S.player],w=S.w[S.scn.target],top=P.titles.filter(function(t){return !t.tag&&t.g===w.g;}).sort(function(a,b){return b.lvl-a.lvl;})[0],ok=!!(top&&top.holders.indexOf(w.id)>=0&&w.promo===P.id);
      return {ok:ok,text:ok?w.name+' holds the '+top.name+'. From the bottom of the roster to the top of the company.':w.name+' does not hold the '+(top?top.name:'top title')+' after 39 weeks. They are now rated '+Math.round(w.ovr)+'.'};},
    figures:function(S){var w=S.w[S.scn.target];return [w.name+' rated '+Math.round(w.ovr)+' (started at '+Math.round(S.scn.o0)+')'];}},
  war:{n:'Win the ratings war',promo:'ocw',weeks:26,d:'PDW has come after your audience, and a war is on. For 26 weeks, your shows must beat what the audience expects by more than theirs do.',
    setup:function(S){var rv=S.promos.pdw;S.scn.rival='pdw';S.scn.me=[];S.scn.rv=[];S.promos[S.player].image=60;rv.image=66;
      if(!S.xf)startXf(S,'pdw','war');},
    check:function(S){var m=avg(S.scn.me||[0]),r=avg(S.scn.rv||[0]),ok=m>r+0.3;return {ok:ok,text:(ok?'You won the ratings war':'You lost the ratings war')+': your shows averaged '+(m>=0?'+':'')+m.toFixed(1)+' against expectations, theirs '+(r>=0?'+':'')+r.toFixed(1)+'.'};},
    figures:function(S){return ['Your shows: '+((S.scn.me&&S.scn.me.length)?(avg(S.scn.me)>=0?'+':'')+avg(S.scn.me).toFixed(1):'0')+' against expectations','Theirs: '+((S.scn.rv&&S.scn.rv.length)?(avg(S.scn.rv)>=0?'+':'')+avg(S.scn.rv).toFixed(1):'0')];}}
};
E.SCENARIOS=Object.keys(SCN).map(function(k){return {id:k,n:SCN[k].n,d:SCN[k].d,weeks:SCN[k].weeks,promo:SCN[k].promo};});
E.scenarioStart=function(id){
  var D=SCN[id];if(!D)return null;var U=E.universe();if(!U.promotions.some(function(p){return p.id===D.promo;}))return null;
  return E.newGame(D.promo,5000+hash('scn'+id)%1000000,{name:'Booker',diff:'normal',fed:null,scn:id});
};
(function(){
  var ng=E.newGame;
  E.newGame=function(pid,seed,opts){
    var S=ng(pid,seed,opts);
    if(opts&&opts.scn&&SCN[opts.scn]){S.scn={id:opts.scn,weeks:SCN[opts.scn].weeks,done:false};var t=S.promos[S.player];S.scn.o0=0;SCN[opts.scn].setup(S);if(S.scn.target!=null)S.scn.o0=S.w[S.scn.target].ovr;}
    return S;
  };
})();
SHOWX.push(function(S,P,show,rep){
  var C=S.scn;if(S.cal||!C||C.done||C.id!=='war')return;
  if(P.id===S.player)C.me.push(rep.rating-rep.exp);else if(P.id===C.rival)C.rv.push(rep.rating-rep.exp);
});
WEEKX.push(function(S){
  var C=S.scn;if(S.cal||!C||C.done||S.over)return;
  if(S.week>=C.weeks){C.done=true;C.res=SCN[C.id].check(S);C.res.figures=SCN[C.id].figures(S);S.over={why:'scenario',week:S.week};}
});
