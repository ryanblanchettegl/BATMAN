/* Book a debut (roadmap 9, Ryan 16 October). When somebody new joins, the booker picks how they are introduced:
   vignettes (a teaser airs every week until they first appear, so the crowd knows the name), a surprise attack (they
   come out of nowhere: a louder crowd for the debut, and momentum), or a straight match (a win makes them, a loss sets
   them back). w.dk holds the plan until the debut. Nothing here calls rnd(S). */
var DEBUT={
  vig:{n:'Vignettes',d:'A teaser airs every week until they first appear. The crowd knows the name before the bell.'},
  atk:{n:'A surprise attack',d:'They come out of nowhere on the night. A louder crowd, and momentum from the shock.'},
  match:{n:'A straight match',d:'Book them in a match and let the result speak. A win makes them; a loss sets them back.'}
};
E.DEBUT=DEBUT;
/** Newcomers on your roster who have not appeared yet. */
E.debuts=function(S){return rosterOf(S,S.player).filter(function(w){return w.deb&&!w.nw&&!w.camp;}).map(function(w){return {id:w.id,name:w.name,k:w.dk||null,hy:w.hy||0};});};
E.debutPlan=function(S,id,k){
  var w=S.w[id];if(!w||!w.deb||w.promo!==S.player||!DEBUT[k])return {ok:false,msg:'There is no debut to plan for them.'};
  w.dk=k;youRemember(S,w,'debut','You planned their debut: '+DEBUT[k].n.toLowerCase()+'.',1);
  return {ok:true,msg:w.name+' will debut with '+DEBUT[k].n.toLowerCase()+'.'};
};
/* vignettes: a teaser a week, up to the most a debut can carry (w.hy, read in src/82-wishes.js) */
WEEKX.push(function(S){rosterOf(S,S.player).forEach(function(w){if(w.deb&&w.dk==='vig'&&(w.hy||0)<3)w.hy=(w.hy||0)+1;});});
/* a surprise attack: the crowd did not see it coming */
CRX.push(function(ctx){if(!ctx.isPl)return null;var w=ctx.all.filter(function(x){return x.deb&&x.dk==='atk';})[0];return w?{d:3,x:w.name+' came out of nowhere'}:null;});
/* after the debut: what it did for them */
POST.push(function(ctx){
  if(!ctx.isPl||!ctx.res)return;var S=ctx.S,r=ctx.res,won=r.winners||[];
  ctx.all.forEach(function(w){if(!w.dk)return;
    var win=won.indexOf(w)>=0;
    if(w.dk==='atk'){w.mom=clamp((w.mom||0)+2,-10,10);note(S,'A debut',w.name+' arrived with a surprise attack. People are talking.','good');}
    else if(w.dk==='match'){w.ovr=clamp(w.ovr+(win?2:-2),1,100);youRemember(S,w,win?'debutwin':'debutloss',win?'Won on their debut.':'Lost on their debut.',win?2:-2);note(S,'A debut',w.name+(win?' won on their debut.':' lost on their debut. It is a slow start.'),win?'good':'bad');}
    else note(S,'A debut',w.name+' finally appears, after weeks of teasers.','good');
    delete w.dk;});
});
/* a task on the desk: a newcomer with no plan for their debut */
TASKX.push(function(S,P,add){E.debuts(S).filter(function(d){return !d.k;}).slice(0,2).forEach(function(d){
  add('deb-'+d.id,d.name+' has not appeared yet. Plan how they are introduced.','booking','Plan it',{need:false,short:'Plan a debut: '+d.name,done:'Debut planned.'});});});
