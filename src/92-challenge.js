/* ---------- 100. The weekly challenge: a dated seed, the same world for everyone, twelve weeks, one score, and a short code to share (S.chal) ---------- */
function isoParts(id){var m=/^(\d{4})-?W(\d{1,2})$/.exec(String(id||''));return m?{y:+m[1],w:+m[2]}:null;}
E.challengeInfo=function(id){
  var p=isoParts(id);if(!p)return null;var U=E.universe(),L=U.promotions,seed=((p.y*100+p.w)*7919+104729)%2000000000;
  var pr=L[hash('chal'+p.y+'W'+p.w)%L.length];
  return {id:p.y+'-W'+(p.w<10?'0':'')+p.w,seed:seed,promo:pr.id,name:pr.name,weeks:12};
};
E.challengeStart=function(id){
  var I=E.challengeInfo(id);if(!I)return null;
  return E.newGame(I.promo,I.seed,{name:'Challenger',diff:'normal',fed:null,chal:I.id});
};
(function(){
  var ng=E.newGame;
  E.newGame=function(pid,seed,opts){
    var S=ng(pid,seed,opts);
    if(opts&&opts.chal){var P=S.promos[S.player];S.chal={id:opts.chal,weeks:12,sum:0,done:false,image0:P.image,cash0:P.cash,promo:pid};}
    return S;
  };
})();
SHOWX.push(function(S,P,show,rep){if(S.cal||!S.chal||P.id!==S.player||S.chal.done)return;S.chal.sum+=rep.rating-rep.exp;});
E.challengeScore=function(S){
  var C=S.chal;if(!C)return 0;var P=S.promos[S.player];
  var s=400+C.sum*4+(P.image-C.image0)*15+clamp((P.cash-C.cash0)/P.inc0,-10,30)*5+S.stats.feudsDone*10+Math.max(0,S.stats.bestShow-70)*2;
  return Math.max(0,Math.round(s));
};
function chalCheck(id,score){return (hash(id+':'+score)%1296).toString(36).toUpperCase().replace(/^(.)$/,'0$1');}
E.challengeCode=function(S){
  var C=S.chal;if(!C)return null;var sc=E.challengeScore(S);
  return 'EWF-'+C.id.replace('-','')+'-'+sc.toString(36).toUpperCase()+'-'+chalCheck(C.id,sc);
};
E.challengeRead=function(code){
  var m=/^EWF-(\d{4})(W\d{2})-([0-9A-Z]+)-([0-9A-Z]{2})$/.exec(String(code||'').trim().toUpperCase());
  if(!m)return {ok:false,text:'That is not a challenge code.'};
  var id=m[1]+'-'+m[2],sc=parseInt(m[3],36);
  if(chalCheck(id,sc)!==m[4])return {ok:false,text:'That code does not check out. One letter may be wrong.'};
  var I=E.challengeInfo(id);return {ok:true,id:id,score:sc,name:I?I.name:'',text:'A score of '+sc+' in the challenge of '+id+(I?' with '+I.name:'')+'.'};
};
/* twelve weeks and it is over */
WEEKX.push(function(S){
  var C=S.chal;if(S.cal||!C||C.done||S.over)return;
  if(S.week>=C.weeks){C.done=true;C.score=E.challengeScore(S);C.code=E.challengeCode(S);S.over={why:'challenge',week:S.week};}
});
