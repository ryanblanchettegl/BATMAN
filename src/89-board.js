/* ---------- the fan board grows up: stars, replies, and a critic's list ---------- */

/* ---------- 71. Posts name matches and give them stars, fans argue with each other, and an invented critic keeps a list the wrestlers care about (w.cs) ---------- */
function starsOf(ov){return (Math.round(ov/20*4)/4).toFixed(2).replace(/0$/,'').replace(/\.$/,'');}
function boardTouch(S,ms,posts,used){
  // any post that names a match gets its stars
  posts.forEach(function(p){ms.forEach(function(s){if(s.label&&p.t.indexOf(s.label)>=0&&!/stars\)/.test(p.t)){p.t+=' ('+starsOf(s.ov)+' stars)';}});});
  // somebody always disagrees
  if(posts.length>=2&&chance(S,0.75)){
    var tg=posts[0],kind=tg.s>0?pick(S,['old','heel','stats']):pick(S,['casual','under']);
    var rep=tg.s>0?pick(S,['you are being generous. I had it a half star lower.','that is a take. The room was dead for the first half, I was there.','I wish I had watched the show you watched.','stars are not a personality, but fine.']):pick(S,['it was not that bad. You are being precious.','you say that every week. I enjoyed it.','a bad show is still a show. Lighten up.','I will take that over what the other company put out.']);
    posts.push({u:fanFor(S,kind,used),t:'@'+tg.u+' '+rep,s:tg.s>0?-1:1});
  }
  return posts;
}
E.starsOf=starsOf;
/* the critic */
var CRITIC='Mortimer Vane';
function criticScore(w){return (w.cs==null?50:w.cs)*0.6+w.ovr*0.4;}
function criticRank(S){
  return S.w.filter(function(w){return w.promo!=='FA'&&!w.nw&&(w.csn|0)>=5;}).sort(function(a,b){return criticScore(b)-criticScore(a);}).slice(0,10);
}
POST.push(function(ctx){
  if(ctx.S.cal||ctx.m.mt==='br')return;var OV=ctx.res.OV;
  ctx.all.forEach(function(w){w.cs=w.cs==null?OV:w.cs*0.88+OV*0.12;w.csn=(w.csn|0)+1;});
});
WEEKX.push(function(S){
  if(S.cal||S.week%2)return;
  var C=S.critic||(S.critic={name:CRITIC,last:{}}),list=criticRank(S),now={},P=S.promos[S.player];
  list.forEach(function(w,i){
    now[w.id]=i+1;
    if(!C.last[w.id]&&w.promo===P.id){w.morale=clamp(w.morale+3,0,100);news(S,'story',C.name+' put '+w.name+' in his top ten.');}
    if(i===0&&C.top!==w.id){C.top=w.id;if(w.promo===P.id){w.morale=clamp(w.morale+5,0,100);w.mom=clamp(w.mom+1,-10,10);}if(S.week-(C.topAt||-99)>=8){C.topAt=S.week;news(S,'story',C.name+' names '+w.name+' the best wrestler in the world this month.');}}
  });
  C.prev=C.last;C.last=now;
  if(S.week%8===0&&S.net&&list.length>=5){
    S.net.threads.unshift({w:S.week,sub:'The '+C.name.split(' ')[1]+' List',posts:[{u:C.name,t:'This month: '+list.slice(0,5).map(function(w,i){return (i+1)+'. '+w.name;}).join(', ')+'.',s:0}]});
    if(S.net.threads.length>10)S.net.threads.length=10;
  }
});
E.criticList=function(S){
  var C=S.critic||{last:{},prev:{}},list=criticRank(S);
  return {name:C.name||CRITIC,rows:list.map(function(w,i){var was=C.prev?C.prev[w.id]:null;return {w:w,rank:i+1,score:Math.round(criticScore(w)),move:was?was-(i+1):null,mine:w.promo===S.player};})};
};
