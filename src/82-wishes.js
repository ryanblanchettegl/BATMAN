/* ---------- small depth systems from WISHLIST.md ---------- */

/* a wrestler back from a long injury gets a returning pop that fades over four weeks */
CRX.push(function(ctx){
  var d=0,names=[];
  ctx.all.forEach(function(w){
    if(!w.rw||w.rwl==null)return;var age=ctx.S.week-w.rw;
    if(age<0||age>3||w.rwl<3)return;
    d+=2.4*(1-age/4)*(w.ovr>=50?1:0.6);names.push(w.name);
  });
  return names.length?{d:d,x:names.join(' and ')+(names.length>1?' are':' is')+' back from injury and the crowd knows it'}:null;
});

/* gimmick matches wear out: each stipulation draws a little less every time it is used inside a year, and recovers with rest */
function stipUseList(P,stip){var u=P.su||(P.su={});return u[stip]||(u[stip]=[]);}
function stipWorn(S,P,stip){if(!stip||stip==='std')return 0;var L=stipUseList(P,stip).filter(function(w){return S.week-w<52;});return modelOf(P).gimFree?0:Math.max(0,L.length-12);}   // a gimmick company's crowd never tires of them
CRX.push(function(ctx){
  var n=stipWorn(ctx.S,ctx.P,ctx.stip);if(!n)return null;
  return {d:-Math.min(2,n*0.15),x:'The '+STIP[ctx.stip].n.toLowerCase()+' match has been done to death this year'};
});
POST.push(function(ctx){if(ctx.S.cal||!ctx.stip||ctx.stip==='std')return;var L=stipUseList(ctx.P,ctx.stip);L.push(ctx.S.week);while(L.length&&ctx.S.week-L[0]>=52)L.shift();});
/* for the booking screen: how worn is a stipulation for the player's company */
E.stipFresh=function(S,stip){var n=stipWorn(S,S.promos[S.player],stip);return {worn:n,word:n>=12?'overused':(n>=5?'getting stale':'fresh')};};

/* referees: four named officials with a skill. A sharp one lifts the main event; a weak one can miss a call, and it becomes a story */
var REFEREES=[{n:'Inspector Bucket',sk:82},{n:'Sergeant Cuff',sk:70},{n:'Mr. Pickwick',sk:56},{n:'Dogberry',sk:32}];
function refFor(ctx){var h=(ctx.S.week*7+(ctx.show.id||'x').length*3+(ctx.isMain?0:1+ctx.m.sides.length))%REFEREES.length;return REFEREES[h];}
CRX.push(function(ctx){
  var r=refFor(ctx);if(!ctx.isMain||r.sk<75)return null;
  return {d:1.2,x:r.n+' is the referee for the main event, and nothing gets past them'};
});
POST.push(function(ctx){
  if(ctx.S.cal)return;var r=refFor(ctx),seg=ctx.res.seg;seg.ref=r.n;
  if(r.sk>=45||!chance(ctx.S,0.14))return;
  var what=pick(ctx.S,['a clear pin','a low blow','a tag','a rope break','a foreign object']);
  seg.ov=clamp(seg.ov-3,5,99);seg.notes.push(r.n+' missed '+what+'. The crowd is furious.');
  if(ctx.feud)heatUp(ctx.S,ctx.feud,4,r.n+' missed '+what);
  if(ctx.isPl)news(ctx.S,'story',r.n+' missed '+what+' at '+ctx.show.name+'. The talk is of nothing else.');
});

/* managers meddle: ringside interference, heat that belongs to the manager, and the manager turning on a client who keeps losing */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(S.cal||!ctx.isPl)return;
  ctx.all.forEach(function(w){
    if(w.mgr==null)return;var mg=S.w[w.mgr];if(!mg||mg.promo!==w.promo||mg.rt)return;
    var won=r.winners.indexOf(w)>=0,fin=r.fin;
    // the manager turns on a client who keeps losing, once they have made enough enemies of their own
    if(!won&&r.win>=0&&w.ws<=-3&&(mg.mh||0)>=30&&chance(S,0.2)){
      w.mgr=null;w.morale=clamp(w.morale-6,0,100);if(mg.align===w.align)turn(S,mg,'walked out on '+w.name);
      r.seg.notes.push(mg.name+' has seen enough, shoves '+w.name+' and walks to the back.');news(S,'story',mg.name+' has walked out on '+w.name+' after the losing streak.');return;}
    if(fin==='interf'||fin==='foiled'||!chance(S,0.1))return;
    var good=chance(S,clamp(0.45+(mg.mic-60)/200,0.2,0.75));
    if(good){mg.mh=clamp((mg.mh||0)+6,0,100);r.seg.notes.push(mg.name+' distracts the referee at ringside and '+w.name+' gets the edge.');if(ctx.feud)heatUp(S,ctx.feud,3,mg.name+' interfered for '+w.name);r.seg.ov=clamp(r.seg.ov+1,5,99);}
    else{mg.mh=clamp((mg.mh||0)+2,0,100);r.seg.notes.push(mg.name+' tries to interfere and is thrown out by the referee.');r.seg.ov=clamp(r.seg.ov+0.5,5,99);}
  });
});
/* a manager the crowd hates is worth a little to the show */
CRX.push(function(ctx){
  var h=0,who=null;ctx.all.forEach(function(w){if(w.mgr!=null){var mg=ctx.S.w[w.mgr];if(mg&&(mg.mh||0)>=30&&mg.promo===w.promo){h=Math.max(h,mg.mh);who=mg;}}});
  return who?{d:clamp(h/40,0.5,2),x:'The crowd loves to hate '+who.name}:null;
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.mh)w.mh=w.mh>1?w.mh*0.96:0;});});   // a manager's heat cools if they stay quiet

/* botches and saves: rarely a risky move goes wrong, and a veteran in the match can cover for it */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal)return;var risk=0.012*(STIP[ctx.stip]?STIP[ctx.stip].inj:1)*(ctx.mins>=14?1.2:1);
  if(!chance(S,risk))return;
  var seg=ctx.res.seg,mover=pick(S,ctx.all),vets=ctx.all.filter(function(w){return w!==mover&&w.age>=33;}).sort(function(a,b){return (b.cons||60)-(a.cons||60);}),vet=vets[0];
  var move=pick(S,['a top-rope move','a bump on the floor','a springboard','a suplex','a dive over the top']);
  if(vet&&chance(S,clamp(0.45+((vet.cons||60)-60)/150,0.3,0.85))){
    seg.notes.push(mover.name+' slipped on '+move+', and '+vet.name+' covered it so smoothly that most of the crowd never noticed.');vet.morale=clamp(vet.morale+2,0,100);mover.morale=clamp(mover.morale+1,0,100);
  }else{
    seg.ov=clamp(seg.ov-5,5,99);seg.notes.push(mover.name+' botched '+move+(vet?' and even '+vet.name+' could not cover it.':'. Nobody in the ring could cover it.')+' The crowd noticed.');
    mover.morale=clamp(mover.morale-3,0,100);
  }
});

/* match of the year, live: a running top ten of this calendar year's best matches across every promotion */
SHOWX.push(function(S,P,show,rep){
  var yr=cal(S.week).year,L=S.moty||(S.moty=[]);
  rep.segs.forEach(function(s){if(s.k!=='match'||s.ov==null)return;
    L.push({l:s.label,ov:s.ov,show:rep.name,promo:P.id,w:S.week,yr:yr,win:s.win||null,title:s.title||null,stip:s.stip||null,mt:s.mt||'',mins:s.mins||0,ids:(s.ids||[]).slice(0,8)});});
  S.moty=L.filter(function(m){return m.yr===yr;}).sort(function(a,b){return b.ov-a.ov||a.w-b.w;}).slice(0,10);
});
E.matchOfYear=function(S){var yr=cal(S.week).year;return (S.moty||[]).filter(function(m){return m.yr===yr;}).map(function(m){return {l:m.l,ov:m.ov,show:m.show,promo:m.promo,promoName:S.promos[m.promo]?S.promos[m.promo].name:m.promo,w:m.w,win:m.win,title:m.title,stip:m.stip,mt:m.mt,mins:m.mins,ids:m.ids};});};
