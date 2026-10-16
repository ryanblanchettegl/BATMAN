/* Battle royals (roadmap 2, Ryan 16 October). A battle royal takes 6 to 30 entrants and runs 30 minutes for every 15
   in it (brMins() in src/97-time.js). The booker can hold one spot for a surprise: somebody nobody on the roster, a free
   agent, a legend first, who walks out when the bell has rung and is paid for the night. The winner earns a title match
   (the battle royal POST in src/70-season.js). It wraps E.liveBegin, so it sorts after src/34-night.js.
   The surprise is picked with h01(), never rnd(S). */
/** Grow or shrink the battle royal at card position i to n entrants; new spots are empty. */
E.brSize=function(S,i,n){
  var m=S.card&&S.card[i];if(!m||m.mt!=='br')return {ok:false};
  n=clamp(n|0,MT.br.min,MT.br.max);
  while(m.sides.length<n)m.sides.push([null]);
  if(m.sides.length>n)m.sides=m.sides.slice(0,n);
  if(m.call!=null&&m.call>=n)m.call=null;
  return {ok:true,n:n};
};
/** The free agents who could be the surprise entrant: same gender as most of the field, fit to work, legends first. */
function brSurprisePool(S,m){
  var g={M:0,F:0};flat(m.sides).forEach(function(id){var w=id!=null&&S.w[id];if(w)g[w.g]=(g[w.g]||0)+1;});
  var G=g.F>g.M?'F':'M',on={};flat(m.sides).forEach(function(id){on[id]=1;});
  var leg=function(w){var p=E.persona(S,w.id);return p&&p.legend?1:0;};
  return Object.keys(S.w).map(function(k){return S.w[k];}).filter(function(w){return w&&w.promo==='FA'&&w.rt==null&&!w.nw&&!(w.inj>0)&&w.g===G&&!on[w.id];})
    .sort(function(a,b){return leg(b)-leg(a)||b.ovr-a.ovr;});
}
/** Book the battle royal at card position i as one for a title shot, or not. A battle royal for a vacant title is for the title itself. */
E.brShot=function(S,i,on){
  var m=S.card&&S.card[i];if(!m||m.mt!=='br')return {ok:false};
  if(on)m.shot=1;else delete m.shot;
  return {ok:true};
};
/** What a surprise appearance costs for one night. */
function brFee(w){return Math.round((2000+w.ovr*w.ovr*3)/500)*500;}
/** Turn the surprise spot on or off. The booker does not pick the person: the office finds somebody on the night. */
E.brSurprise=function(S,i,on){
  var m=S.card&&S.card[i];if(!m||m.mt!=='br')return {ok:false};
  if(on)m.surp=1;else delete m.surp;
  return {ok:true};
};
/** For the editor: what the surprise spot would cost, and how many could fill it. Never names them. */
E.brSurpriseInfo=function(S,m){
  var L=brSurprisePool(S,m).slice(0,5);if(!L.length)return {n:0,fee:0,d:'Nobody free to come in. The spot would go empty.'};
  var fee=Math.round(avg(L.map(brFee))/500)*500;
  return {n:L.length,fee:fee,d:'A name from outside the company walks out when the bell has rung. About '+money(fee)+' for the night. The crowd only finds out when the music hits.'};
};
(function(){
  var begin=E.liveBegin;
  E.liveBegin=function(S,card){
    var P=S.promos[S.player],adds=[];
    (card||S.card||[]).forEach(function(m,i){
      if(m.mt!=='br'||!m.surp||m.surpId!=null)return;
      var L=brSurprisePool(S,m).slice(0,5);if(!L.length){delete m.surp;return;}
      var w=L[Math.floor(h01('brs'+S.week+':'+i+':'+S.seed)*L.length)],fee=brFee(w);
      if(P.cash<fee){delete m.surp;return;}
      adds.push({i:i,m:m,w:w,fee:fee});
    });
    // the surprise joins after the card has been checked, so a free agent can stand in a battle royal for one night
    var r=begin(S,card);
    if(r&&r.ok&&S.live)adds.forEach(function(a){
      var lm=S.live.card[a.i];if(!lm)return;lm.sides.push([a.w.id]);lm.surpId=a.w.id;P.cash-=a.fee;
      youRemember(S,a.w,'surprise','Brought in as the surprise entrant in a battle royal.',3);
      note(S,'A surprise entrant',a.w.name+' walks out during the battle royal. Paid '+money(a.fee)+' for the night.','good');
    });
    return r;
  };
})();
/* The run sheet (roadmap 6): a match is moved to any place on the card, and a locked match (m.lock) keeps its place.
   Moving one match shifts the others that are not locked; nothing moves into or out of a locked place. */
E.lockMatch=function(S,i,on){var m=S.card&&S.card[i];if(!m)return {ok:false};if(on)m.lock=1;else delete m.lock;return {ok:true};};
E.moveMatchTo=function(S,from,to){
  var c=S.card||[];if(from===to||from<0||to<0||from>=c.length||to>=c.length)return {ok:false,msg:''};
  if(c[from].lock)return {ok:false,msg:'That match is locked in its place. Unlock it first.'};
  if(c[to].lock)return {ok:false,msg:'Match '+(to+1)+' is locked in its place.'};
  var free=[],k;for(k=0;k<c.length;k++)if(!c[k].lock)free.push(k);
  var order=free.map(function(x){return c[x];}),a=free.indexOf(from),b=free.indexOf(to),m=order.splice(a,1)[0];order.splice(b,0,m);
  var out=c.slice();free.forEach(function(x,q){out[x]=order[q];});
  for(k=0;k<c.length;k++)c[k]=out[k];
  return {ok:true,i:to};
};
/** Suggest a card that keeps the locked matches where they are: the suggestion fills the places around them. */
E.suggestKeep=function(S){
  var keep=(S.card||[]).map(function(m,i){return m.lock?{m:m,i:i}:null;}).filter(Boolean),c=E.suggest(S);
  if(!keep.length)return c;
  var used={};keep.forEach(function(k){flat(k.m.sides).forEach(function(id){used[id]=1;});});
  c=c.filter(function(m){return !flat(m.sides).some(function(id){return used[id];});});
  keep.forEach(function(k){c.splice(Math.min(k.i,c.length),0,k.m);});
  fitShow(S,c);return c;
};
