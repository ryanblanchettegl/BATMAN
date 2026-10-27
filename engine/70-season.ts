// @ts-nocheck
/* Moved from src/70-season.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, avg, award, cal, chance, clamp, dissolveTeam, divOk, feudLabel, holdLvl, isDev, rosterOf, starG, startFeud, teamOf, titleById, titleFull, workRate } from './00-core';
import { CRX, EVMAKE, EVR, NEWX, POST, SHOWX, WEEKX, addOvr } from './10-match';
import { leaveStable, stableOf } from './60-rpg';
import { gainXp } from './65-you';
$L.rankFor = rankFor; $L.tournActive = tournActive; $L.koPairs = koPairs; $L.tournAdvance = tournAdvance; $L.tournPair = tournPair; $L.syncTitles = syncTitles; $L.yearEnd = yearEnd; $L.powerHeld = powerHeld; $L.powerScore = powerScore; $L.campCost = campCost;
/* ---------- contender rankings ---------- */
export function rankFor(S,P,t,n){
  var L=rosterOf(S,P.id).filter(function(w){return divOk(P,t,w)&&t.holders.indexOf(w.id)<0&&w.inj<=0&&!w.camp&&!w.nw&&(!t.brand||w.brand===t.brand)&&isDev(P,w.brand)===isDev(P,t.brand)&&holdLvl(P,w.id)<t.lvl;});
  if(t.lvl<3&&L.length){var top=Math.max.apply(null,L.map(function(w){return w.ovr;}));L=L.filter(function(w){return w.ovr<=top-(t.lvl===2?3:10);});}
  return L.map(function(w){return {w:w,s:(w.pts||0)+w.ovr*0.12+w.mom*0.3+(w.shot===t.id?50:0)};}).sort(function(a,b){return b.s-a.s;}).slice(0,n||5).map(function(x){return x.w;});
}
POST.push(function(ctx){
  var r=ctx.res;if(r.win<0)return;
  var wa=avg(r.winners.map(function(w){return w.ovr;})),la=avg(r.losers.map(function(w){return w.ovr;}));
  var st=0.6+ctx.P.image/125;
  r.winners.forEach(function(w){var p=3+(la>wa?1:0)+(ctx.big?2:0)+(ctx.isMain?1:0);w.pts=(w.pts||0)+p;w.yp=(w.yp||0)+p*st;w.cp=(w.cp||0)+p;});
  if(ctx.m.mt!=='br')r.losers.forEach(function(w){w.pts=Math.max(0,(w.pts||0)-1);});
});
/* a battle royal win is a title shot in the bank; a stable fighting as a unit gets a hand */
POST.push(function(ctx){
  var r=ctx.res,P=ctx.P;if(ctx.m.mt!=='br'||r.win<0)return;
  if(ctx.isPl)award(ctx.S,'ACH_BR');
  if(ctx.t||(ctx.isPl&&!ctx.m.shot))return;   // the player's battle royal is for a title shot only when booked as one
  var w=r.winners[0],tt=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w.g&&x.holders.length&&x.holders[0]!==w.id&&(!x.brand||x.brand===w.brand)&&isDev(P,x.brand)===isDev(P,w.brand)&&x.lvl>holdLvl(P,w.id)&&(!tt||x.lvl>tt.lvl))tt=x;});
  if(!tt)return;w.shot=tt.id;w.pts=(w.pts||0)+6;r.seg.notes.push(w.name+' has earned a shot at the '+tt.name+'.');
});
CRX.push(function(ctx){
  if(ctx.m.mt!=='6man')return null;var d=0;
  ctx.sides.forEach(function(s){var st=stableOf(ctx.S,s[0]);if(st&&s.every(function(w){return stableOf(ctx.S,w)===st;}))d+=2;});
  return d?{d:d,x:'A stable fighting as a unit'}:null;
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.pts)w.pts=Math.round(w.pts*90)/100;});
  // a short prestige history for every title, so the Titles page can show which way it is moving
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){var h=t.ph||(t.ph=[]);h.push(Math.round(t.prestige*10)/10);if(h.length>8)h.shift();});});});
CRX.push(function(ctx){
  var t=ctx.t;if(!t||t.tag||ctx.champSide<0||ctx.m.mt!=='1v1')return null;
  var ch=ctx.sides[ctx.champSide===0?1:0][0];
  if(ch.shot===t.id)return {d:3,x:'A challenger who earned the shot the hard way'};
  var rk=rankFor(ctx.S,ctx.P,t,5).map(function(w){return w.id;}),ix=rk.indexOf(ch.id);
  return ix<0?{d:-3,x:'The challenger has not earned a title shot'}:(ix<=1?{d:2,x:'The top contender gets the shot'}:null);
});
POST.push(function(ctx){var t=ctx.t;if(t)ctx.all.forEach(function(w){if(w.shot===t.id)w.shot=null;});});
E.rankFor=function(S,tid,n){var P=S.promos[S.player],t=titleById(P,tid);return t&&!t.tag?rankFor(S,P,t,n||5):[];};

/* ---------- tournaments: an eight-wrestler knockout or a six-wrestler league ---------- */
export function tournActive(S){return S.tourn&&!S.tourn.done?S.tourn:null;}
export function koPairs(ids){return [[ids[0],ids[7]],[ids[3],ids[4]],[ids[1],ids[6]],[ids[2],ids[5]]];}
E.tournOk=function(S,tid,fmt){
  var P=S.promos[S.player],t=titleById(P,tid);if(!t||t.tag)return 'Tournaments are for singles titles.';
  if(tournActive(S))return 'Finish the '+S.tourn.name+' first.';
  var need=fmt==='rr'?6:8;if(rankFor(S,P,t,need).length<need)return 'Not enough healthy contenders for that ('+need+' needed).';
  return null;
};
E.startTourn=function(S,tid,fmt){
  var why=E.tournOk(S,tid,fmt);if(why)return why;
  var P=S.promos[S.player],t=titleById(P,tid),need=fmt==='rr'?6:8,ents=rankFor(S,P,t,need).map(function(w){return w.id;}),T;
  T=S.tourn={id:S.nid++,promo:P.id,title:t.id,fmt:fmt,name:t.name.replace(/ Titles?$/,'')+(fmt==='rr'?' League':' Tournament'),ents:ents,round:1,pend:[],res:[],pts:{},done:false,start:S.week};
  if(fmt==='rr'){for(var i=0;i<ents.length;i++){T.pts[ents[i]]=0;for(var j=i+1;j<ents.length;j++)T.pend.push([ents[i],ents[j]]);}}
  else{T.pend=koPairs(ents);T.br={1:koPairs(ents)};}
  $L.news(S,'story','The '+T.name+' begins: '+ents.map(function(id){return S.w[id].name;}).join(', ')+'.');
  return 'The '+T.name+' is set. Book the listed matches on your shows; the suggested card includes them.';
};
export function tournAdvance(S,T){
  var P=S.promos[T.promo],t=titleById(P,T.title);
  if(T.pend.length)return;
  var champ=null;
  if(T.fmt==='rr'){champ=T.ents.slice().sort(function(a,b){return (T.pts[b]-T.pts[a])||(S.w[b].ovr-S.w[a].ovr);})[0];}
  else{
    var ws=T.res.filter(function(r){return r.round===T.round;}).map(function(r){return r.w;});
    // winners are paired by their place in the bracket, not by the order the matches were run in
    if(T.br&&T.br[T.round]){var prs=T.br[T.round],ow=[];prs.forEach(function(pr){var rr=T.res.filter(function(x){return x.round===T.round&&((x.a===pr[0]&&x.b===pr[1])||(x.a===pr[1]&&x.b===pr[0]));})[0];if(rr)ow.push(rr.w);});if(ow.length===prs.length)ws=ow;}
    if(ws.length>1){T.round++;var nx=[];for(var i=0;i<ws.length;i+=2){T.pend.push([ws[i],ws[i+1]]);nx.push([ws[i],ws[i+1]]);}if(T.br)T.br[T.round]=nx;return;}
    champ=ws[0];
  }
  T.done=true;T.champ=champ;var w=S.w[champ];$L.mile(S,w,'tourn','Won the '+T.name);w.mom=clamp(w.mom+3,-10,10);addOvr(P,w,1.5);
  if(t.holders[0]===champ){$L.news(S,'story',w.name+' won the '+T.name+' as champion. Nobody is left to argue.');t.prestige=clamp(t.prestige+3,10,100);}
  else if(!t.holders.length){t.holders=[champ];t.since=S.week;t.defs=0;$L.ystat(S,w)[6]++;$L.mile(S,w,'title','Won the vacant '+titleFull(P,t));$L.news(S,'title',w.name+' won the '+T.name+' and the vacant '+titleFull(P,t)+'.');}
  else{w.shot=t.id;startFeud(S,P,w,S.w[t.holders[0]],45,w.name+' won the '+T.name+' and a shot at the '+t.name,{title:t.id,force:true});$L.news(S,'story',w.name+' won the '+T.name+' and a shot at the '+t.name+'.');}
  if(P.id===S.player){gainXp(S,25);award(S,'ACH_TOURN');}
}
export function tournPair(T,a,b){for(var i=0;i<T.pend.length;i++){var p=T.pend[i];if((p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a))return i;}return -1;}
CRX.push(function(ctx){var T=tournActive(ctx.S);if(!T||!ctx.isPl||ctx.m.mt!=='1v1'||tournPair(T,ctx.all[0].id,ctx.all[1].id)<0)return null;return {d:2,x:'Tournament stakes'};});
POST.push(function(ctx){
  var S=ctx.S,T=tournActive(S),r=ctx.res;if(!T||!ctx.isPl||ctx.m.mt!=='1v1')return;
  var a=ctx.all[0].id,b=ctx.all[1].id,ix=tournPair(T,a,b);if(ix<0)return;
  if(T.fmt==='rr'){
    T.pend.splice(ix,1);if(r.win<0){T.pts[a]+=1;T.pts[b]+=1;}else T.pts[r.winners[0].id]+=2;
    T.res.push({a:a,b:b,w:r.win<0?-1:r.winners[0].id,week:S.week,round:1});
    r.seg.notes.push(T.name+': '+(r.win<0?'a point each.':r.winners[0].name+' takes two points.'));
  }else{
    if(r.win<0||r.fin==='dq'||r.fin==='co'){r.seg.notes.push('No clear winner. The '+T.name+' match will have to be run again.');return;}
    T.pend.splice(ix,1);T.res.push({a:a,b:b,w:r.winners[0].id,week:S.week,round:T.round});
    r.seg.notes.push(r.winners[0].name+' advances in the '+T.name+'.');
  }
  tournAdvance(S,T);
  if(T.done)r.seg.notes.push(S.w[T.champ].name+' wins the '+T.name+'!');
});
WEEKX.push(function(S){
  var T=tournActive(S);if(!T)return;
  T.pend.slice().forEach(function(p){
    var a=S.w[p[0]],b=S.w[p[1]],ga=a.promo!==T.promo||a.inj>=2||a.camp,gb=b.promo!==T.promo||b.inj>=2||b.camp;if(!ga&&!gb)return;
    T.pend.splice(T.pend.indexOf(p),1);var w=ga&&gb?(a.ovr>=b.ovr?a:b):(ga?b:a);
    if(T.fmt==='rr')T.pts[w.id]=(T.pts[w.id]||0)+2;T.res.push({a:a.id,b:b.id,w:w.id,week:S.week,round:T.round,bye:true});
    $L.news(S,'story',w.name+' gets a walkover in the '+T.name+'.');
  });
  tournAdvance(S,T);
});

/* ---------- title histories and the record book ---------- */
export function syncTitles(S){
  S.order.forEach(function(pid){var P=S.promos[pid];P.titles.forEach(function(t){
    t.hist=t.hist||[];var last=t.hist[t.hist.length-1],cur=t.holders.slice().sort().join(',');
    if(last&&last.to==null&&last.ids===cur){last.defs=t.defs;return;}
    if(last&&last.to==null){last.to=S.week;}
    if(cur)t.hist.push({ids:cur,h:t.holders.map(function(id){return S.w[id].name;}),from:S.week,to:null,show:S.week<=1?'Before your time':(P.last?P.last.name:''),defs:0});
    if(t.hist.length>60)t.hist.shift();
  });});
}
NEWX.push(function(S){S.rec={matches:[],shows:[],gate:null,buys:null,streak:null};S.year={};S.awards=[];S.hof=[];S.w.forEach(function(w){w.oy=w.ovr;});syncTitles(S);});
SHOWX.push(function(S,P,show,rep){
  syncTitles(S);if(P.id!==S.player)return;
  var R=S.rec,Y=S.year;
  rep.segs.forEach(function(s){if(s.k!=='match')return;
    R.matches.push({l:s.label,ov:s.ov,show:rep.name,w:S.week});
    if(!Y.match||s.ov>Y.match.ov)Y.match={l:s.label,ov:s.ov,show:rep.name,w:S.week};
  });
  R.matches.sort(function(a,b){return b.ov-a.ov;});R.matches.length=Math.min(10,R.matches.length);
  R.shows.push({n:rep.name,r:rep.rating,c:$L.repCS(rep),w:S.week});R.shows.sort(function(a,b){return b.r-a.r;});R.shows.length=Math.min(5,R.shows.length);
  if(!Y.show||rep.rating>Y.show.r)Y.show={n:rep.name,r:rep.rating,c:$L.repCS(rep),w:S.week};
  if(!R.gate||rep.att>R.gate.v)R.gate={v:rep.att,n:rep.name,w:S.week};
  if(rep.buys&&(!R.buys||rep.buys>R.buys.v))R.buys={v:rep.buys,n:rep.name,w:S.week};
  rosterOf(S,P.id).forEach(function(w){if(w.ws>=3&&(!R.streak||w.ws>R.streak.v))R.streak={v:w.ws,n:w.name,w:S.week};});
  S.feuds.forEach(function(f){if(f.res&&!f.dead&&f.end===S.week&&f.promo===P.id&&(!Y.feud||f.heat>Y.feud.h))Y.feud={l:feudLabel(S,f),h:Math.round(f.heat),w:S.week};});
});

/* ---------- year-end awards and the hall of fame ---------- */
export function yearEnd(S){
  var P=S.promos[S.player],yr=cal(S.week).year,Y=S.year||{},L=[],all=S.w.filter(function(w){return w.promo!=='FA';}),mine=rosterOf(S,P.id);
  var by=function(arr,f){return arr.slice().sort(function(a,b){return f(b)-f(a);})[0];};
  var woy=by(all,function(w){return w.yp||0;}),mwoy=by(mine,function(w){return w.yp||0;}),imp=by(mine,function(w){return w.ovr-(w.oy==null?w.ovr:w.oy);});
  if(woy&&woy.yp){L.push({k:'Wrestler of the year',v:woy.name+' ('+S.promos[woy.promo].name+')',w:woy.id});$L.mile(S,woy,'award','Wrestler of the year, '+yr);}
  if(mwoy&&mwoy.yp){L.push({k:P.name+' wrestler of the year',v:mwoy.name,w:mwoy.id});addOvr(P,mwoy,1);mwoy.morale=clamp(mwoy.morale+5,0,100);}
  if(Y.match)L.push({k:'Match of the year',v:Y.match.l+', '+starG(Y.match.ov)+' at '+Y.match.show});
  if(Y.feud)L.push({k:'Feud of the year',v:Y.feud.l});
  if(Y.show)L.push({k:'Show of the year',v:Y.show.n+', graded '+$L.gradeG(Y.show.c!=null?Y.show.c:Y.show.r)});
  if(imp&&imp.ovr-imp.oy>=2)L.push({k:'Most improved',v:imp.name+' (+'+Math.round(imp.ovr-imp.oy)+' overness)',w:imp.id});
  var tm=by(S.teams.filter(function(t){return t.promo===P.id;}),function(t){return t.exp;});if(tm)L.push({k:'Tag team of the year',v:S.w[tm.m[0]].name+' & '+S.w[tm.m[1]].name});
  var pr=by(S.order.map(function(id){return S.promos[id];}),function(p){return p.image-(p.imgY==null?p.image0:p.imgY);});if(pr)L.push({k:'Promotion of the year',v:pr.name});
  S.awards.unshift({year:yr,list:L,week:S.week});
  $L.news(S,'world','The '+yr+' awards are in. '+(woy?woy.name+' is wrestler of the year.':''));
  S.inbox.push({id:S.nid++,type:'awards',text:'The '+yr+' year-end awards: '+L.map(function(x){return x.k+': '+x.v;}).join('. ')+'.',done:true,result:null});
  // the year's power list (NEXT.md 8.1): the top twenty-five across the world, with last year's place beside each
  // kept small: [id, last year's place or 0] for the top 200, with the names of the top 25 written in
  var prevL=(S.pwList&&S.pwList[0])?S.pwList[0].l:[],pidx={};prevL.forEach(function(x,i){pidx[x.id!=null?x.id:x[0]]=i+1;});
  (S.pwList||(S.pwList=[])).unshift({year:yr,l:E.power(S,200).map(function(w,i){return i<25?{id:w.id,n:w.name,p:S.promos[w.promo]?S.promos[w.promo].name:'',was:pidx[w.id]||0}:[w.id,pidx[w.id]||0];})});
  S.pwList=S.pwList.slice(0,2);
  S.w.forEach(function(w){w.yp=0;w.oy=w.ovr;});S.order.forEach(function(id){S.promos[id].imgY=S.promos[id].image;});S.year={};S.hofDue=true;
  if(P.id===S.player)award(S,'ACH_AWARDS');
}
WEEKX.push(function(S){syncTitles(S);var c=cal(S.week);if(c.month===11&&c.wom===4)yearEnd(S);});
EVMAKE.push(function(S,P){
  if(!S.hofDue)return null;S.hofDue=false;
  var c=rosterOf(S,P.id).filter(function(w){return !w.hof&&(w.ovr>=75||(w.cp||0)>=60||(w.tr&&w.tr.length>=2));}).sort(function(a,b){return (b.cp||0)+b.ovr*2-(a.cp||0)-a.ovr*2;}).slice(0,3);
  if(!c.length)return null;
  return {type:'hof',c:c.map(function(w){return w.id;}),text:'It is hall of fame season. Who goes in this year?',choices:c.map(function(w){return 'Induct '+w.name;}).concat(['Nobody this year'])};
});
EVR.hof=function(S,ev,choice,P){
  var id=ev.c[choice];if(id==null)return 'No induction this year.';
  var w=S.w[id];w.hof=true;$L.mile(S,w,'hof','Inducted into the '+P.name+' hall of fame');S.hof.unshift({n:w.name,year:cal(S.week).year,p:P.name});addOvr(P,w,1);w.morale=clamp(w.morale+10,0,100);P.image=clamp(P.image+0.3,5,100);
  $L.news(S,'story',w.name+' was inducted into the '+P.name+' hall of fame.');award(S,'ACH_HOF');
  return w.name+' takes a place in the hall of fame. The ceremony is a moment the crowd will remember.';
};
/** The year's power lists, newest first: {year, l:[{id, n, p, was}]}. */
E.powerYears=function(S){return S.pwList||[];};
/* the ranking (NEXT.md 8.1): the year's points from results (wins count more on bigger stages and with better
   matches), a quarter of how over they are, and a champion counts for more */
export function powerHeld(S){var h={};S.order.forEach(function(pid){(S.promos[pid].titles||[]).forEach(function(t,ti){(t.holders||[]).forEach(function(id){h[id]=(h[id]||0)+(ti===0?2:1);});});});return h;}
export function powerScore(w,held){return (w.yp||0)+w.ovr*0.25+(held[w.id]||0)*6;}
E.power=function(S,n){var held=powerHeld(S);return S.w.filter(function(w){return w.promo!=='FA'&&!w.rt;}).sort(function(a,b){return powerScore(b,held)-powerScore(a,held);}).slice(0,n||10);};
/** Last week's place in the ranking, 1 up, or 0 if they were not in the top fifty. */
E.powerWas=function(S,id){var L=S.pwPrev||[],i=L.indexOf(id);return i>=0?i+1:0;};

/* ---------- training camp ---------- */
export var CAMP_CAP=[0,4,8,12],CAMP_C=[0,0.004,0.009,0.015],CAMPN=['None','Small gym','Training centre','Performance institute'];
$L.CAMP_CAP = CAMP_CAP; $L.CAMP_C = CAMP_C; $L.CAMPN = CAMPN;
export var FOCUS={ring:'In-ring work',mic:'Promos',cond:'Conditioning'};
$L.FOCUS = FOCUS;
export function campCost(P){return Math.round($L.CAMP_C[P.camp||0]*P.inc0);}
WEEKX.push(function(S){
  var P=S.promos[S.player],lv=P.camp||0;
  S.w.forEach(function(w){
    if(w.promo==='FA')return;var Q=S.promos[w.promo];
    if(isDev(Q,w.brand)&&workRate(w)<w.pot)w.xp+=0.1;
    if(!w.camp||w.promo!==P.id)return;
    var rate=0.6+0.2*lv;addOvr(P,w,-0.2);w.lu=S.week;w.cond=100;
    if(w.focus==='mic'){var cap=Math.min(88,w.mic0+15);if(w.mic<cap){w.micx=(w.micx||0)+0.45*rate;if(w.micx>=1){w.micx-=1;w.mic++;}}}
    else if(w.focus==='cond'){if(w.stam<90){w.stx=(w.stx||0)+0.6*rate;if(w.stx>=1){w.stx-=1;w.stam++;}}}
    else if(workRate(w)<w.pot){w.xp+=0.42*rate;if(w.xp>=1){w.xp-=1;w.brawl=Math.min(99,w.brawl+1);w.tech=Math.min(99,w.tech+1);w.speed=Math.min(99,w.speed+1);}}
    else if(chance(S,0.05)){w.pot=Math.min(99,w.pot+1);}
  });
});
E.campInfo=function(S){var P=S.promos[S.player],n=rosterOf(S,P.id).filter(function(w){return w.camp;}).length;return {lvl:P.camp||0,cap:$L.CAMP_CAP[P.camp||0],n:n,cost:campCost(P),names:$L.CAMPN,costs:$L.CAMP_C.map(function(c){return Math.round(c*P.inc0);}),caps:$L.CAMP_CAP};};
E.sendCamp=function(S,id,focus){
  var w=S.w[id],P=S.promos[S.player],i=E.campInfo(S);if(!w||w.promo!==P.id)return null;
  if(!w.camp&&i.n>=i.cap)return 'The camp is full ('+i.cap+' places). Call someone up or ask for a bigger one.';
  if(holdLvl(P,w.id)>0)return w.name+' is a champion. Champions do not go to camp.';
  if(!w.camp){leaveStable(S,w);var tm=teamOf(S,w);if(tm)dissolveTeam(S,tm);S.feuds.forEach(function(f){if(!f.res&&(f.a.indexOf(w.id)>=0||f.b.indexOf(w.id)>=0)){f.res=true;f.dead=true;f.end=S.week;}});}
  if(!w.camp){w.cw0=workRate(w);w.cm0=w.mic;}w.camp=true;w.focus=$L.FOCUS[focus]?focus:'ring';if(w.mic0==null)w.mic0=w.mic;
  return w.name+' is in camp, working on '+$L.FOCUS[w.focus].toLowerCase()+'. They are off the shows until you call them up.';
};
E.callUp=function(S,id){var w=S.w[id];if(!w||!w.camp)return null;w.camp=false;w.deb=true;w.mom=clamp(w.mom+2,-10,10);w.lu=S.week;if(workRate(w)>(w.cw0||999)||w.mic>(w.cm0||999))award(S,'ACH_GRAD');return w.name+' is back on the active roster.';};
WEEKX.push(function(S){var P=S.promos[S.player],L=rosterOf(S,P.id).filter(function(w){return w.camp;}),cap=$L.CAMP_CAP[P.camp||0];while(L.length>cap){var w=L.pop();E.callUp(S,w.id);$L.news(S,'story',w.name+' was sent back from camp: there is no longer room.');}});
E.FOCUS=FOCUS;E.tournActive=tournActive;

/* Housekeeping: retired wrestlers who never held a title do not need their year lines, recent results or long logs.
   Keeps the save small in a long game (about 1.4 MB at week 300). Runs every 26 weeks. */
WEEKX.push(function(S){
  // the play-by-play of an old show is never read again: only the newest two keep it
  (S.reports||[]).slice(2).forEach(function(r){(r.segs||[]).forEach(function(g){if(g.bc)delete g.bc;});});
  if(S.week%26!==0)return;
  var champs={};S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){String(h.ids||'').split(',').forEach(function(id){champs[id]=1;});});t.holders.forEach(function(id){champs[id]=1;});});});
  // long decimals cost room and say nothing: three places is plenty
  S.w.forEach(function(w){for(var k in w){var v=w[k];if(typeof v==='number'&&v!==Math.round(v))w[k]=Math.round(v*1000)/1000;}});
  S.w.forEach(function(w){
    if(!w.rt||champs[w.id])return;
    delete w.rr;delete w.ys;delete w.bz;
    if(w.log&&w.log.length>6)w.log=w.log.slice(0,1).concat(w.log.slice(-5));
  });
  // relationships with somebody retired are never read again
  if(S.rm)Object.keys(S.rm).forEach(function(k){var ids=k.split('-');if(ids.some(function(id){var w=S.w[+id];return !w||w.rt;}))delete S.rm[k];});
  // old head-to-head and recent-match keys nobody will read again
  var keys=Object.keys(S.recent||{});keys.forEach(function(k){if(S.week-S.recent[k]>20)delete S.recent[k];});
  // where somebody worked on the indies is only read while they are free or on outside dates
  S.w.forEach(function(w){if(w.ind&&(w.rt||(w.promo!=='FA'&&!(w.cl&&w.cl.outside))))delete w.ind;});
});
/* the power ten matters to the people in it (NEXT.md 8.2): one of yours who climbs into it is lifted, and one who drops
   out on a losing run starts to grumble. It reads the ranking and never calls rnd(S). */
WEEKX.push(function(S){
  if(S.cal)return;var top=E.power(S,10).map(function(x){return x.id!=null?x.id:(x.w?x.w.id:x);}),was=S.pw10||null;S.pw10=top;if(!was)return;
  top.forEach(function(id){var w=S.w[id];if(!w||w.promo!==S.player||was.indexOf(id)>=0)return;w.morale=clamp(w.morale+3,0,100);$L.note(S,'The power ten',w.name+' is in the power ten.','good');});
  was.forEach(function(id){var w=S.w[id];if(!w||w.promo!==S.player||top.indexOf(id)>=0)return;var lost=(w.rr||[]).slice(0,3).filter(function(x){return x.r==='L';}).length;
    if(lost>=2){w.morale=clamp(w.morale-3,0,100);$L.note(S,'The power ten',w.name+' has dropped out of the power ten, and is not happy about the losses.','bad');}});
});

/* last week's ranking, kept for the World page's arrows (the top fifty, ids only) */
WEEKX.push(function(S){if(S.cal)return;S.pwPrev=E.power(S,50).map(function(w){return w.id;});});

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.rankFor = rankFor;
$L.tournActive = tournActive;
$L.koPairs = koPairs;
$L.tournAdvance = tournAdvance;
$L.tournPair = tournPair;
$L.syncTitles = syncTitles;
$L.yearEnd = yearEnd;
$L.powerHeld = powerHeld;
$L.powerScore = powerScore;
$L.CAMP_CAP = CAMP_CAP;
$L.CAMP_C = CAMP_C;
$L.CAMPN = CAMPN;
$L.FOCUS = FOCUS;
$L.campCost = campCost;
