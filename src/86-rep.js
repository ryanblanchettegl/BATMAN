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

/* ---------- 92. Legacy: a timeline of the career, the stars you made, your best matches, and a score to beat ---------- */
E.legacy=function(S){
  var P=S.promos[S.player],st=S.stats,R=S.rec||{matches:[],shows:[]},A=S.awards||[];
  var made=S.w.filter(function(w){return w.promo===P.id&&!w.nw&&w.o0!=null&&w.ovr-w.o0>=6;}).map(function(w){return {w:w,from:Math.round(w.o0),to:Math.round(w.ovr),gain:Math.round(w.ovr-w.o0)};}).sort(function(a,b){return b.gain-a.gain;}).slice(0,5);
  var hof=(S.hof||[]).length,achN=Object.keys(S.ach||{}).filter(function(k){return !/^MS_/.test(k);}).length,traits=Object.keys(S.reps||{}).length;
  var parts=[
    {n:'Shows run',v:Math.min(60,Math.round(st.shows*0.5))},
    {n:'Best show',v:Math.max(0,Math.min(30,Math.round(st.bestShow-70)))},
    {n:'Best match',v:Math.max(0,Math.min(30,Math.round(st.bestMatch-70)))},
    {n:'Popularity gained',v:Math.max(0,Math.min(90,Math.round((P.image-P.image0)*3)))},
    {n:'Feuds finished',v:Math.min(30,st.feudsDone*2)},
    {n:'Stars made',v:Math.min(60,made.length*8)},
    {n:'Achievements',v:Math.round(achN*1.5)},
    {n:'Reputation',v:traits*8},
    {n:'Hall of fame',v:hof*5},
    {n:'Awards years',v:Math.min(40,A.length*5)}
  ];
  if(S.over&&S.over.why==='fired')parts.push({n:'Fired',v:-10});
  var score=0;parts.forEach(function(p){score+=p.v;});
  var tl=[{w:1,label:'Took over '+P.name+'.'}];
  if(R.shows[0])tl.push({w:R.shows[0].w,label:'Best show: '+R.shows[0].n+', '+R.shows[0].r+'%.'});
  if(R.matches[0])tl.push({w:R.matches[0].w,label:'Best match: '+R.matches[0].l+', '+R.matches[0].ov+'%.'});
  if(R.gate)tl.push({w:R.gate.w,label:'Biggest crowd: '+R.gate.v.toLocaleString('en-US')+' at '+R.gate.n+'.'});
  A.slice(0,4).forEach(function(a){var w0=a.list[0];tl.push({w:(a.week||0),year:a.year,label:'The '+a.year+' awards: '+(w0?w0.k+', '+w0.v+'.':'')});});
  Object.keys(S.ach||{}).filter(function(k){return !/^MS_/.test(k);}).sort(function(a,b){return S.ach[a]-S.ach[b];}).slice(0,10).forEach(function(k){
    var a=ACH.filter(function(x){return x.id===k;})[0];if(a)tl.push({w:S.ach[k],label:'Achievement: '+a.name});});
  if(S.over)tl.push({w:S.over.week,label:S.over.why==='fired'?'Let go by '+S.owner.name+'.':'The money ran out.'});
  tl.sort(function(a,b){return (a.w||0)-(b.w||0);});
  tl.forEach(function(e){if(e.w)e.when=E.cal(e.w).label;});
  return {score:score,parts:parts,timeline:tl,made:made,best:R.matches.slice(0,5),weeks:S.week};
};

/* ---------- 98. The record book: sortable records across every promotion ---------- */
POST.push(function(ctx){
  if(ctx.S.cal||ctx.m.mt==='br')return;var OV=ctx.res.OV;
  ctx.all.forEach(function(w){w.sov=(w.sov||0)+OV;w.nov=(w.nov|0)+1;if(w.ws>(w.bws|0))w.bws=w.ws;});
});
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player||!S.rec)return;var G=S.rec.gates||(S.rec.gates=[]);
  G.push({v:rep.att,n:rep.name,w:S.week});G.sort(function(a,b){return b.v-a.v;});if(G.length>10)G.length=10;
});
var RECK=[
  {id:'reigns',n:'Most title reigns',unit:'reigns'},
  {id:'longest',n:'Longest reign',unit:'weeks'},
  {id:'defs',n:'Most defences in one reign',unit:'defences'},
  {id:'grade',n:'Best average match grade',unit:'%'},
  {id:'run',n:'Longest winning run',unit:'wins'},
  {id:'wins',n:'Most wins',unit:'wins'},
  {id:'gates',n:'Biggest gates',unit:'people'}
];
E.RECK=RECK;
E.records=function(S,k,asc){
  var rows=[],cnt={};
  function wr(id){return S.w[+id]||null;}
  if(k==='reigns'||k==='longest'||k==='defs'){
    S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){
      var ids=String(h.ids||'').split(',').filter(Boolean);if(!ids.length)return;var len=(h.to||S.week)-Math.max(1,h.from);
      if(k==='reigns')ids.forEach(function(id){cnt[id]=(cnt[id]||0)+1;});
      else rows.push({ids:ids,v:k==='longest'?len:(h.defs|0),note:t.name});
    });});});
    if(k==='reigns')Object.keys(cnt).forEach(function(id){rows.push({ids:[id],v:cnt[id],note:''});});
  }else if(k==='grade'){S.w.forEach(function(w){if((w.nov|0)>=10)rows.push({ids:[w.id],v:Math.round(w.sov/w.nov*10)/10,note:w.nov+' matches'});});}
  else if(k==='run'){S.w.forEach(function(w){if((w.bws|0)>=3)rows.push({ids:[w.id],v:w.bws,note:''});});}
  else if(k==='wins'){S.w.forEach(function(w){if((w.wins|0)>=5)rows.push({ids:[w.id],v:w.wins,note:w.losses+' losses'});});}
  else if(k==='gates'){((S.rec&&S.rec.gates)||[]).forEach(function(g){rows.push({ids:[],v:g.v,note:g.n+', '+E.cal(g.w).label});});}
  rows.sort(function(a,b){return asc?a.v-b.v:b.v-a.v;});
  return rows.slice(0,10).map(function(r){return {w:r.ids.map(wr).filter(Boolean),v:r.v,note:r.note};});
};
