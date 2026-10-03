/* ---------- 89. A reputation as a booker: traits earned by how you book, each with a small edge and a small cost (S.reps) ---------- */
var BTRAIT={
  star:{n:'Star maker',earn:'Three or more of your wrestlers have gained five points of popularity this year.',edge:'Wrestlers 27 and under learn a little faster.',cost:'Veterans (34 and over) grumble that the young get the push: their mood slips.',
    rival:'is known for making stars',talk:'Every young wrestler wants to work for them.'},
  hot:{n:'Hot-shot booker',earn:'Your shows beat the expected rating by two points or more across the last twelve.',edge:'The crowd and the board trust the name: every match gets a little lift.',cost:'The room resents the glory. Locker-room trust drifts down toward the middle.',
    rival:'is the booker everybody is watching',talk:'People say your shows are the ones to beat.'},
  horse:{n:'Friend of the workhorse',earn:'Five or more mid-card wrestlers have at least two wins in their last five.',edge:'Mid-card wrestlers are happier and cheaper to keep.',cost:'The top of the card grumbles about sharing the wins: main events lose a little.',
    rival:'looks after the people in the middle',talk:'The undercard thinks you are the fairest booker in the business.'},
  keeper:{n:'Keeper of titles',earn:'Two or more singles champions have held on for twenty weeks with three defences.',edge:'Your titles gain prestige every week.',cost:'Challengers wait too long: contenders without a belt get restless.',
    rival:'treats a title like it means something',talk:'Your belts mean something.'}
};
E.BTRAIT=BTRAIT;
function repMetric(S,k){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  if(k==='star')return R.filter(function(w){return w.ovr-(w.oy==null?w.ovr:w.oy)>=5;}).length;
  if(k==='hot'){var a=S.repS||[];return a.length>=8?avg(a):0;}
  if(k==='horse'){var cut=P.image-5;return R.filter(function(w){return w.ovr<cut&&w.rr&&w.rr.length>=3&&w.rr.filter(function(x){return x.r==='W';}).length>=2;}).length;}
  return P.titles.filter(function(t){return !t.tag&&t.holders.length&&S.week-t.since>=20&&t.defs>=3;}).length;
}
var BNEED={star:3,hot:2,horse:5,keeper:2};
SHOWX.push(function(S,P,show,rep){if(S.cal||P.id!==S.player)return;var a=S.repS||(S.repS=[]);a.push(rep.rating-rep.exp);if(a.length>12)a.shift();});
WEEKX.push(function(S){
  if(S.cal||S.week%4)return;
  var Rp=S.reps||(S.reps={}),P=S.promos[S.player];
  Object.keys(BTRAIT).forEach(function(k){
    var v=repMetric(S,k),has=Rp[k];
    if(!has&&v>=BNEED[k]){Rp[k]=S.week;news(S,'you','You are gaining a reputation: '+BTRAIT[k].n.toLowerCase()+'.');
      var rv=S.order.filter(function(id){return id!==P.id&&S.promos[id].owner;});if(rv.length){var o=S.promos[pick(S,rv)];news(S,'world',o.owner.name+' of '+o.name+' says '+S.booker.name+' '+BTRAIT[k].rival+'.');}
      if(S.net)S.net.threads.unshift({w:S.week,sub:'Booker watch',posts:[{u:fanFor(S,'casual',{}),t:'Whoever is booking '+P.name+' '+BTRAIT[k].rival+'. '+BTRAIT[k].talk,s:1}]});}
    else if(has&&v<BNEED[k]*0.6){delete Rp[k];news(S,'you','You have lost your name as a '+BTRAIT[k].n.toLowerCase()+'.');}
  });
  if(S.net&&S.net.threads.length>10)S.net.threads.length=10;
});
/* the edges and the costs */
WEEKX.push(function(S){
  if(S.cal||!S.reps)return;var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  if(S.reps.star){R.forEach(function(w){if(w.age<=27&&workRate(w)<w.pot)w.xp+=0.04;if(w.age>=34&&w.morale>55)w.morale-=0.4;});}
  if(S.reps.hot&&S.trust>55)S.trust=Math.max(55,S.trust-0.2);
  if(S.reps.horse){R.forEach(function(w){if(w.ovr<P.image-5&&w.morale<85)w.morale+=0.3;});}
  if(S.reps.keeper){P.titles.forEach(function(t){if(!t.tag&&t.holders.length&&t.prestige<90)t.prestige=Math.min(90,t.prestige+0.1);});
    R.forEach(function(w){if(holdLvl(P,w.id)===0&&(w.shot||w.mom>=3)&&w.morale>45)w.morale-=0.3;});}
});
CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal||!ctx.S.reps)return null;var d=0,x=null;
  if(ctx.S.reps.hot){d+=0.5;x='This booker has the crowd’s trust';}
  if(ctx.S.reps.horse&&ctx.isMain)d-=0.4;
  return d?{d:d,x:x}:null;
});
E.bookerRep=function(S){
  var R=S.reps||{};
  return Object.keys(BTRAIT).map(function(k){var T=BTRAIT[k],v=repMetric(S,k);
    return {id:k,n:T.n,has:!!R[k],since:R[k]||null,earn:T.earn,edge:T.edge,cost:T.cost,progress:k==='hot'?Math.round(v*10)/10:v,need:BNEED[k]};});
};
