/* ---------- you: the booker, the owner you answer to, and booking power ---------- */
var STYLES={
  stars:{n:'Star system',d:'The biggest names win. Overness counts for more than anything else.',likes:'star power in the main event'},
  merit:{n:'Sport',d:'The better wrestler on a roll wins. Work rate and momentum count for more.',likes:'a great match on every show'},
  drama:{n:'Soap opera',d:'Villains cheat their way through the build and get what is coming at the big event. Expect more upsets.',likes:'feuds on every show'},
  heroes:{n:'Heroes and villains',d:'Heels win on TV, and heroes win the big ones.',likes:'a hero standing tall at the end of the night'}
};
var ROOTS={
  tradition:{n:'Tradition',d:'Clean finishes are rewarded. Cheap finishes and non-finishes cost more.'},
  rebellion:{n:'Rebellion',d:'Rule-breaking is the brand. Cheap heel wins and gimmick matches go over better.'},
  family:{n:'Family entertainment',d:'A face winning the main event lifts the show. A heel winning it deflates it.'}
};
var PLEDGE={
  pay:{n:'Fair pay',d:'Morale runs higher, but contract renewals cost a little more.'},
  chance:{n:'Opportunity',d:'The lower card works harder, but anyone left off the shows for a month gets unhappy fast.'},
  stable:{n:'Stability',d:'Renewals are cheaper and morale is steadier, but every release shakes the whole locker room.'}
};
var SKILLS={
  creative:{n:'Creative',max:5,d:'Better angles, hotter feuds, and better odds on creative gambles.'},
  talk:{n:'Negotiation',max:5,d:'Cheaper contracts and better odds when you have to talk someone round.'},
  eye:{n:'Eye for talent',max:3,d:'1: see potential. 2: see ring chemistry. 3: your staff spot more problems.'},
  motivator:{n:'Motivator',max:5,d:'More effort in the ring and steadier morale.'},
  clout:{n:'Clout',max:3,d:'One more point of booking power every week.'}
};
function cap1(t){return t.charAt(0).toUpperCase()+t.slice(1);}
function xpNeed(l){return 80+50*l;}
function gainXp(S,n){
  var b=S.booker;if(!b||S.cal)return;b.xp+=Math.round(n);
  while(b.xp>=xpNeed(b.lvl)&&b.lvl<22){b.xp-=xpNeed(b.lvl);b.lvl++;b.pts++;news(S,'you','You reached booker level '+b.lvl+'. You have a skill point to spend.');if(b.lvl>=5)award(S,'ACH_LEVEL5');}
}
function initYou(S,opts){
  var d=S.custom&&S.custom.id===S.player?S.custom:DB.promotions.filter(function(p){return p.id===S.player;})[0],o=d.owner||{name:'The owner',style:'stars',roots:'tradition',pledge:'pay'};
  S.booker={name:String(opts.name||'').trim().slice(0,24)||'The Booker',xp:0,lvl:1,pts:0,sk:{creative:0,talk:0,eye:0,motivator:0,clout:0}};
  if(opts.booker){S.booker.xp=opts.booker.xp;S.booker.lvl=opts.booker.lvl;S.booker.pts=opts.booker.pts;Object.keys(S.booker.sk).forEach(function(k){S.booker.sk[k]=opts.booker.sk[k]||0;});}
  S.owner={name:o.name,trust:55,me:false,style:o.style,roots:o.roots,pledge:o.pledge,lobby:{},asked:0,creedWeek:-99,wage0:wagesWeek(S,S.promos[S.player])};
  S.creedScore=60;S.bp=0;S.rel={};S.stats.calls=0;
  if(d.mine){S.owner.me=true;S.owner.name=S.booker.name;S.owner.creedWeek=1;S.mode='owner';}
}
SKILLMOD.push(function(S,kind){var b=S.booker;if(!b)return null;var l=kind==='creative'?b.sk.creative:b.sk.talk;return {n:(kind==='creative'?'Your creative skill':'Your negotiation skill'),v:l>=4?2:(l>=2?1:0)};});
function talkDiscount(S){return S.booker?1-0.03*S.booker.sk.talk:1;}
function pledgeRenew(S){return S.owner?(S.owner.pledge==='pay'?1.05:(S.owner.pledge==='stable'?0.9:1)):1;}
function moraleTarget(S){var o=S.owner,b=S.booker;return 65+dif(S).mor+((S.trust==null?60:S.trust)-60)/5+(b?1.5*b.sk.motivator:0)+(o?(o.pledge==='pay'?5:(o.pledge==='stable'?3:0)):0);}
E.spendPoint=function(S,k){var b=S.booker,sk=SKILLS[k];if(!sk||b.pts<=0||b.sk[k]>=sk.max)return false;b.sk[k]++;b.pts--;return true;};

/* booking power */
function bpGrant(S){
  var P=S.promos[S.player],n=P.shows.length,b=S.booker,o=S.owner,big=cal(S.week).wom===4?3:0;
  return Math.max(1,(o.me?n*3+2+Math.floor(b.lvl/2):Math.round(n*1.5)+Math.floor(o.trust/25)+Math.floor(b.lvl/3))+b.sk.clout+big+dif(S).bp);
}
function grantBP(S){var g=bpGrant(S);S.bpGrant=g;S.bp=Math.min(g*2,(S.bp||0)+g);}
function matchSetup(S,m){
  var P=S.promos[S.player],show=S.queue[S.qi],def=MT[m.mt];if(!show||!def)return null;
  var ids=flat(m.sides);if(m.sides.length!==def.sides||ids.some(function(id){return id==null||!S.w[id];}))return null;
  var sides=m.sides.map(function(s){return s.map(function(id){return S.w[id];});}),t=m.title?titleById(P,m.title):null,champSide=-1,feud=null,x,y;
  if(t&&!titleFits(t,m))t=null;
  if(t&&t.holders.length){m.sides.forEach(function(s,k){if(t.holders.every(function(h){return s.indexOf(h)>=0;}))champSide=k;});if(champSide<0)t=null;}
  for(x=0;x<ids.length&&!feud;x++)for(y=x+1;y<ids.length&&!feud;y++)feud=feudOf(S,ids[x],ids[y]);
  return {P:P,show:show,sides:sides,t:t,champSide:champSide,feud:feud};
}
E.matchOdds=function(S,m,i,n){
  var c=matchSetup(S,m);if(!c)return null;
  var od=winOdds(S,c.P,c.show,m,c.sides,c.t,c.champSide,c.feud,!!c.show.big,i===n-1),fav=0;
  od.p.forEach(function(p,k){if(p>od.p[fav])fav=k;});
  var cost=od.p.map(function(p,k){return (p>=0.5?1:(p>=0.25?2:3))+(c.t&&c.t.holders.length&&k!==c.champSide?1:0);});
  return {p:od.p,draw:od.draw,fav:fav,cost:cost,drawCost:2,chem:(S.booker.sk.eye>=2&&m.mt==='1v1')?chem(S,c.sides[0][0].id,c.sides[1][0].id):null};
};
function cardCost(S,card){
  var tot=0,n=card.length;
  card.forEach(function(m,i){if(m.call==null)return;var o=E.matchOdds(S,m,i,n);if(!o)return;tot+=m.call<0?o.drawCost:(o.cost[m.call]||1);});
  return tot;
}
function spendBP(S,card){
  var c=cardCost(S,card),n=card.length,long=false;if(!c)return;
  card.forEach(function(m,i){if(m.call!=null&&m.call>=0){var o=E.matchOdds(S,m,i,n);if(o&&o.p[m.call]<0.25)long=true;}});
  if(c>S.bp){S.trust=clamp(S.trust-2*(c-S.bp),0,100);S.bp=0;}else S.bp-=c;
  S.stats.calls+=card.filter(function(m){return m.call!=null;}).length;award(S,'ACH_CALL');if(long)award(S,'ACH_LONGSHOT');
}
E.cardCost=cardCost;

/* the owner judges every show, and the locker room's creed colours the crowd */
FINX.push(function(ctx,fin,winners,losers,win){
  var S=ctx.S;if(!ctx.isPl||!S.owner)return null;var r=S.owner.roots;
  if(r==='tradition'){if(fin==='clean')return {d:1,x:'A clean finish, the way this crowd likes it'};if(fin==='cheap'||fin==='interf')return {d:-1,x:null};if(fin==='dq'||fin==='co')return {d:-1.5,x:null};}
  else if(r==='rebellion'){if(win>=0&&winners[0].align==='H'&&(fin==='cheap'||fin==='interf'))return {d:1.5,x:'They love a villain getting away with it here'};}
  else if(r==='family'&&ctx.isMain&&win>=0)return winners[0].align==='F'?{d:2,x:'The hero won the main event'}:{d:-2,x:'The villain won the main event, and the families went home unhappy'};
  return null;
});
CRX.push(function(ctx){var S=ctx.S;if(!ctx.isPl||!S.owner||S.owner.roots!=='rebellion'||ctx.stip==='std')return null;return {d:1,x:null};});
EFX.push(function(ctx,w){
  var S=ctx.S;if(!ctx.isPl||!S.booker)return 0;var e=S.booker.sk.motivator;
  if(S.owner.pledge==='chance'){if(ctx.rep._med==null){var o=rosterOf(S,ctx.P.id).map(function(x){return x.ovr;}).sort(function(a,b){return a-b;});ctx.rep._med=o[Math.floor(o.length/2)]||0;}if(w.ovr<ctx.rep._med)e+=3;}
  return e;
});
POST.push(function(ctx){var r=ctx.res;r.seg.wi=r.winners.map(function(w){return w.id;});if(ctx.isPl&&r.seg.change)gainXp(ctx.S,5);});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||!S.owner)return;
  var o=S.owner,d=rep.rating-rep.exp,ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1],key=show.big?'big':show.id,like=false;
  if(o.style==='stars')like=rep.mainStar>=(P.starB[key]||0)+1;
  else if(o.style==='merit')like=ms.some(function(s){return s.mq>=85||s.ov>=(P.mainB[key]||80)+3;});
  else if(o.style==='drama')like=rep.segs.some(function(s){return s.feud;})||ms.some(function(s){return s.fx.some(function(f){return /feud/i.test(f.x)&&f.s>0;});});
  else like=!!(main&&main.wi&&main.wi.length&&S.w[main.wi[0]].align==='F');
  // staying true to what the crowd came for
  var r=o.roots,clean=ms.filter(function(s){return s.fin==='clean';}).length/Math.max(1,ms.length);
  var faceWon=!!(main&&main.wi&&main.wi.length&&S.w[main.wi[0]].align==='F');
  var okc=r==='tradition'?clean>=0.6:(r==='rebellion'?ms.some(function(s){return s.stip||s.fin==='cheap'||s.fin==='interf';}):faceWon);
  S.creedScore=clamp(S.creedScore+(okc?4:-5),0,100);
  if(S.creedScore>=75)P.image=clamp(P.image+0.01,5,100);else if(S.creedScore<=35)P.image=clamp(P.image-0.04,5,100);
  gainXp(S,clamp(10+d*3,2,40)*2/(P.shows.length+1));
  if(o.me){rep.owner={me:true,like:like};if(d>=3)S.bp+=1;return;}
  // the company's model colours the verdict: a board cares less about the reviews, a founder who is a fan cares more
  var MD=modelOf(P),mv=MD.show?MD.show(S,P,show,rep):null;
  var dt=(clamp(d*0.5,-3,3)*(MD.ownShow||1)+(like?0.5:(show.big?-0.5:0)))*2/(P.shows.length+1)+(mv?mv.d:0);
  o.trust=clamp(o.trust+dt,0,100);if(d>=3)S.bp+=1;
  rep.owner={d:r1(dt),like:like,bonus:d>=3,text:o.name+(dt>=2?' is delighted.':(dt>=0.5?' is pleased.':(dt>-0.5?' has no complaints.':(dt>-2?' is not impressed.':' is furious.'))))+(like?' You gave them '+STYLES[o.style].likes+'.':'')+(mv?' '+mv.x:'')};
  if(o.trust>=90)award(S,'ACH_OWNER_TRUST');
});
WEEKX.push(function(S){
  var o=S.owner,P=S.promos[S.player];if(!o)return;
  if(S.trust>=90)award(S,'ACH_TRUST');
  if(S.owner.pledge==='chance')rosterOf(S,P.id).forEach(function(w){if(w.inj<=0&&!w.nw&&!w.camp&&S.week-w.lu>=4&&w.morale>30)w.morale-=1;});
  if(o.me)return;
  if(S.fin)o.trust=clamp(o.trust+(S.fin.net<0&&cal(S.week).wom===4?-2:0)+(o.trust>55?-0.3:(o.trust<45?0.2:0)),0,100);
  if(o.trust<=5+dif(S).fire&&!S.over){S.over={why:'fired',week:S.week};award(S,'ACH_FIRED');news(S,'you',o.name+' has let you go.');}
});

/* directives: what the owner wants this month */
function ownerQuest(S){return S.quests.some(function(q){return /^o_/.test(q.type);});}
function directiveDone(S,q,ok,why){
  var o=S.owner;dropQuest(S,q);if(o.me)return;
  if(ok){o.trust=clamp(o.trust+(q.gain||6),0,100);S.bp+=q.bp||2;gainXp(S,20);award(S,'ACH_DIRECTIVE');news(S,'you','Directive met: '+why+' '+o.name+' gives you '+(q.bp||2)+' more booking power.');}
  else{o.trust=clamp(o.trust-(q.loss||6),0,100);news(S,'you','Directive missed: '+why+' '+o.name+' is not happy.');}
}
NEWX.push(function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !isDev(P,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;});
  var f=pick(S,R.slice(0,10));f.fav=true;S.owner.fav=f.id;
  // working relationships are rolled fresh for every game
  S.order.forEach(function(pid){
    var L=rosterOf(S,pid);
    L.forEach(function(w){
      var c=L.filter(function(x){return x.id!==w.id&&x.g===w.g&&x.brand===w.brand;});if(!c.length)return;
      if(chance(S,0.5)){var a=pick(S,c),k=rkey(w.id,a.id);if(S.rel[k]==null)S.rel[k]=1;}
      if(chance(S,0.25)){var b=pick(S,c),k2=rkey(w.id,b.id);if(S.rel[k2]==null)S.rel[k2]=-1;}
    });
  });
});
EVMAKE.push(function(S,P,R){
  var o=S.owner;if(o.me||cal(S.week).wom!==1||ownerQuest(S))return null;
  var kinds=['strong','belt','elevate'],i,j,t;for(i=kinds.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=kinds[i];kinds[i]=kinds[j];kinds[j]=t;}
  for(i=0;i<kinds.length;i++){
    if(kinds[i]==='strong'){
      var f=S.w[o.fav];if(!f||f.promo!==P.id||f.inj>0){var top=R.filter(function(w){return !isDev(P,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,10);if(!top.length)continue;if(f)f.fav=false;f=pick(S,top);f.fav=true;o.fav=f.id;}
      S.quests.push({id:S.nid++,type:'o_strong',w:f.id,due:S.week+3,gain:6,bp:2,text:o.name+': keep '+f.name+' strong this month. No clean losses.'});
      return {type:'directive',w:f.id,text:o.name+' has a favourite. “'+f.name+' is the future of this company. I do not want to see a clean loss this month.”'};
    }
    if(kinds[i]==='belt'){
      var ts=P.titles.filter(function(x){return !x.tag&&x.holders.length&&!isDev(P,x.brand);});if(!ts.length)continue;
      var tt=pick(S,ts),ch=S.w[tt.holders[0]],cs=R.filter(function(w){return w.id!==ch.id&&w.g===tt.g&&holdLvl(P,w.id)===0&&(!tt.brand||w.brand===tt.brand)&&Math.abs(w.ovr-ch.ovr)<=14&&(o.style!=='heroes'||w.align==='F');}).sort(function(a,b){return b.ovr+b.mom*2-a.ovr-a.mom*2;});
      if(!cs.length)continue;var c=cs[0];
      S.quests.push({id:S.nid++,type:'o_belt',w:c.id,title:tt.id,due:S.week+7,gain:8,bp:3,loss:6,text:o.name+': get the '+tt.name+' on '+c.name+' by '+cal(S.week+7).label});
      return {type:'directive',w:c.id,text:o.name+' wants a change at the top. “I want the '+tt.name+' on '+c.name+' within two months. How you get there is your business.”'};
    }
    if(kinds[i]==='elevate'){
      var ms=R.filter(function(w){return w.ovr>=40&&w.ovr<=66&&!isDev(P,w.brand)&&!hasQuest(S,w.id);});if(!ms.length)continue;
      var m=pick(S,ms),tg=Math.round(m.ovr+4);
      S.quests.push({id:S.nid++,type:'o_elevate',w:m.id,target:tg,due:S.week+7,gain:6,bp:2,loss:4,text:o.name+': build '+m.name+' to '+tg+' overness by '+cal(S.week+7).label});
      return {type:'directive',w:m.id,text:o.name+' sees something in '+m.name+'. “Make me a star. I want '+m.name+' at '+tg+' overness in two months.”'};
    }
  }
  return null;
});
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(!ctx.isPl)return;
  S.quests.slice().forEach(function(q){
    if(q.type==='o_strong'&&r.win>=0&&r.losers.some(function(w){return w.id===q.w;})&&(r.fin==='clean'||r.fin==='flash')){r.seg.notes.push(S.owner.name+' is not going to like that. '+S.w[q.w].name+' was supposed to be kept strong.');directiveDone(S,q,false,S.w[q.w].name+' lost clean.');}
    else if(q.type==='o_belt'&&r.seg.change&&ctx.t&&ctx.t.id===q.title&&r.winners.some(function(w){return w.id===q.w;})){r.seg.notes.push('That is exactly what '+S.owner.name+' asked for.');directiveDone(S,q,true,S.w[q.w].name+' has the title.');}
  });
});
WEEKX.push(function(S){S.quests.slice().forEach(function(q){if(q.type==='o_elevate'&&S.w[q.w].ovr>=q.target)directiveDone(S,q,true,S.w[q.w].name+' is at '+q.target+' overness.');});});
QEND.o_strong=function(S,q){directiveDone(S,q,true,S.w[q.w].name+' stayed strong all month.');};
QEND.o_belt=function(S,q){directiveDone(S,q,false,S.w[q.w].name+' never got the title.');};
QEND.o_elevate=function(S,q){directiveDone(S,q,false,S.w[q.w].name+' did not get there.');};

/* taking over the company */
EVMAKE.push(function(S){
  var o=S.owner,b=S.booker;if(o.me||b.lvl<5||o.trust<80||S.week<30||S.week-o.asked<12)return null;o.asked=S.week;
  return {type:'handover',text:o.name+' calls you in. “I am stepping back. You have earned this. The company is yours if you want it.”',choices:['Take the keys','Not yet']};
});
EVR.handover=function(S,ev,choice){
  if(choice!==0)return 'You tell '+S.owner.name+' you are not ready. The offer will come round again.';
  var o=S.owner,old=o.name;o.me=true;o.name=S.booker.name;o.pending=true;if(o.fav!=null&&S.w[o.fav])S.w[o.fav].fav=false;o.fav=null;
  S.quests=S.quests.filter(function(q){return !/^o_/.test(q.type);});
  award(S,'ACH_OWNER');news(S,'you',old+' has handed '+S.promos[S.player].name+' to '+S.booker.name+'.');grantBP(S);
  return 'The company is yours. Set your house style on the Manage screen. Nobody grants you booking power now: you have more of it, and you can overrule past it at a cost to locker-room trust.';
};
EVR.directive=function(){return '';};
function recalibrate(S,pid){
  var C=JSON.parse(JSON.stringify(S));C.cal=true;C.player=null;var P=C.promos[pid],RP=S.promos[pid],d0=RP.image-RP.image0;
  P.shows.concat([{id:'big',big:true,name:'x'}]).forEach(function(sh){
    var rs=[],mains=[],stars=[];for(var k=0;k<4;k++){var rep=runShow(C,P,sh,autoBook(C,P,sh));rs.push(rep.rating);mains.push(rep.mainOv);stars.push(rep.mainStar);restAll(C,pid);}
    RP.base[sh.id]=r1(avg(rs)-0.6*d0);RP.starB[sh.id]=r1(avg(stars));
  });
}
E.setCreed=function(S,c){
  var o=S.owner,P=S.promos[S.player];if(!o.me)return 'Only the owner sets the house style.';
  if(!o.pending&&S.week-o.creedWeek<12)return 'You changed the house style recently. The crowd needs until '+cal(o.creedWeek+12).label+' to settle.';
  if(STYLES[c.style])o.style=c.style;if(ROOTS[c.roots])o.roots=c.roots;if(PLEDGE[c.pledge])o.pledge=c.pledge;
  P.style=o.style;o.pending=false;o.creedWeek=S.week;S.creedScore=60;recalibrate(S,P.id);
  return 'The house style is set: '+STYLES[o.style].n+', '+ROOTS[o.roots].n.toLowerCase()+', '+PLEDGE[o.pledge].n.toLowerCase()+'.';
};

/* as a booker you have to talk the owner into company changes, and stay inside the wage budget */
E.budget=function(S){var P=S.promos[S.player];return S.owner.me?Infinity:Math.round(S.owner.wage0*(1.12+Math.max(0,P.image-P.image0)*0.02)/1000)*1000;};
E.lobbyOdds=function(S,k,v){
  var P=S.promos[S.player],o=S.owner,up=v>P[k],costly=(k==='prodLvl'||k==='adv'||k==='camp'||k==='med')?up:(k==='tix'?!up:false);
  return mkCheck(8,[{n:'Owner’s trust '+Math.round(o.trust),v:o.trust>=75?2:(o.trust>=55?1:(o.trust<35?-1:0))},{n:costly?'It costs the owner money':'It saves or makes money',v:costly?-1:(k==='risk'?0:1)}].concat(skillMods(S,'talk')));
};
E.lobby=function(S,k,v){
  var o=S.owner,rr=riskRange(S.promos[S.player]);
  if(k==='risk'&&(v<rr[0]||v>rr[1]))return {ok:false,msg:cap1(modelOf(S.promos[S.player]).ph)+' cannot run '+(/^[AEIOU]/.test(RISKN[v])?'an ':'a ')+RISKN[v]+' product.'};
  if(o.lobby[k]&&S.week-o.lobby[k]<4)return {ok:false,msg:o.name+' has heard enough about that for now. Bring it up again after '+cal(o.lobby[k]+4).label+'.'};
  var r=rollCheck(S,E.lobbyOdds(S,k,v));o.lobby[k]=S.week;
  if(r.ok){S.promos[S.player][k]=v;return {ok:true,msg:rollText(r)+o.name+' agrees.'};}
  o.trust=clamp(o.trust-1,0,100);return {ok:false,msg:rollText(r)+o.name+' says no.'};
};
E.jobOffers=function(S){var cur=S.promos[S.player].image;var L=S.order.filter(function(id){return id!==S.player&&S.promos[id].image<cur;});if(!L.length)L=S.order.filter(function(id){return id!==S.player;});return L;};

/* relationships: who clicks in the ring and who does not */
function relOf(S,a,b){var r=S.rel?S.rel[rkey(a,b)]||0:0;if(!r&&S.bond){var bd=S.bond[rkey(a,b)]||0;r=bd>=3?1:(bd<=-3?-1:0);}return r;}   // the bond score only speaks once it is strong
MQX.push(function(ctx){
  var S=ctx.S,d=0,lab=null;
  ctx.sides.forEach(function(s,k){
    if(s.length>1){var r=relOf(S,s[0].id,s[1].id);if(r>0){d+=1.5;lab='Partners who click';}else if(r<0){d-=2;lab='Partners who do not mesh';}}
    for(var j=k+1;j<ctx.sides.length;j++)s.forEach(function(p){ctx.sides[j].forEach(function(q){var r2=relOf(S,p.id,q.id);if(r2>0){d+=1;lab=lab||'Opponents who trust each other';}else if(r2<0)d-=1;});});
  });
  return d?{d:clamp(d,-3,3),x:lab}:null;
});
E.relations=function(S,id){var w=S.w[id],good=[],bad=[];rosterOf(S,w.promo).forEach(function(x){if(x.id===w.id)return;var r=relOf(S,w.id,x.id);if(r>0)good.push(x);else if(r<0)bad.push(x);});return {good:good,bad:bad};};

/* advisors: three voices look over your card before it runs */
E.advice=function(S,card){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return [];
  var agent=[],writer=[],ann=[],n=card.length,on={},twice={},extra=S.booker.sk.eye>=3?1:0;
  card.forEach(function(m){flat(m.sides).forEach(function(id){if(id!=null){if(on[id])twice[id]=1;on[id]=1;}});});
  card.forEach(function(m,i){
    var c=matchSetup(S,m);if(!c)return;var all=flat(c.sides),mins=(m.stip==='iron'?30:(LEN[m.len]||12))+(show.big?4:0)+(i===n-1?3:0);
    all.forEach(function(w){var zs=E.zones(S,w.id).sort(function(a,b){return b.v-a.v;})[0];if(zs.v>=65&&m.int!=='safe')agent.push(w.name+'\u2019s '+zs.n.toLowerCase()+(zs.k==='n'||zs.k==='b'?' is':' are')+' in a bad way ('+zs.v+'). Book match '+(i+1)+' safe, or give them the week off.');
      if(w.cond<50)agent.push(w.name+' is running on fumes ('+Math.round(w.cond)+'%). Match '+(i+1)+' will suffer.');else if(mins>6+w.stam*0.25+3)agent.push(w.name+' cannot go '+mins+' minutes. Shorten match '+(i+1)+'.');});
    if(m.mt==='1v1'){
      var ch=chem(S,all[0].id,all[1].id),gap=Math.abs(all[0].ovr-all[1].ovr);
      if(ch>=2.2)agent.push(all[0].name+' and '+all[1].name+' have real chemistry. Give match '+(i+1)+' time.');else if(ch<=-2.2)agent.push(all[0].name+' and '+all[1].name+' do not click in the ring. Keep match '+(i+1)+' short or change it.');
      if(gap>25&&mins>7)agent.push('Match '+(i+1)+' is a squash. Keep it short.');
      if(all[0].align===all[1].align&&!c.feud)writer.push('Match '+(i+1)+' is '+(all[0].align==='F'?'face against face. Who do they boo?':'heel against heel. Who do they cheer?'));
      var rk=S.recent[P.id+':'+rkey(all[0].id,all[1].id)];if(rk&&S.week-rk<4&&!c.feud)ann.push('We just saw '+all[0].name+' against '+all[1].name+'. The crowd will not care a second time.');
    }
    if(m.mt==='tag')c.sides.forEach(function(s){if(s[0].team==null||s[0].team!==s[1].team)agent.push(names(s)+' are not a regular team. Expect a rough match.');else if(relOf(S,s[0].id,s[1].id)<0)agent.push(names(s)+' do not mesh as partners.');});
    if(c.feud&&c.feud.heat>=60&&!show.big&&m.stip==='std')writer.push(feudLabel(S,c.feud)+' is hot enough to end. Save that match for the big event, or it will only simmer on.');
    if(m.call==null){var od=winOdds(S,P,show,m,c.sides,c.t,c.champSide,c.feud,!!show.big,i===n-1);S.quests.forEach(function(q){if(q.type==='win'||q.type==='o_strong'){var k=-1;c.sides.forEach(function(s,x){if(s.some(function(w){return w.id===q.w;}))k=x;});if(k>=0&&od.p[k]<0.6)writer.push(S.w[q.w].name+' is only '+Math.round(od.p[k]*100)+'% to win match '+(i+1)+', and you have a promise riding on it. Consider calling it.');}});}
  });
  activeFeuds(S).forEach(function(f){
    if(f.promo!==P.id)return;var a=S.w[f.a[0]],b=S.w[f.b[0]],av=function(w){return w.inj<=0&&!(w.away>=S.week)&&(show.big||!show.brand||w.brand===show.brand);};
    if(!av(a)||!av(b))return;
    if(!(on[a.id]&&on[b.id]))writer.push('Nothing tonight for '+feudLabel(S,f)+'? Both need to be on the show or the feud cools.');
    else if(show.big&&f.heat>=60&&!card.some(function(m){var ids=flat(m.sides);return ids.indexOf(a.id)>=0&&ids.indexOf(b.id)>=0;}))writer.push('This is the night to finish '+feudLabel(S,f)+'. Put them in a match.');
  });
  P.titles.forEach(function(t){if(!t.holders.length||(!show.big&&t.brand&&show.brand&&t.brand!==show.brand))return;if(S.week-t.last>=6&&!card.some(function(m){return m.title===t.id;}))writer.push('The '+t.name+' has not been defended in '+(S.week-t.last)+' weeks.');});
  if(n){var mc=matchSetup(S,card[n-1]);if(mc){var star=avg(flat(mc.sides).map(function(w){return w.ovr;})),base=P.starB[show.big?'big':show.id]||star;if(star<base-5)ann.push('That main event will not sell a ticket. The crowd expects bigger names on last.');}}
  if(card.filter(function(m){return m.stip&&m.stip!=='std';}).length>=2)ann.push('Two gimmick matches on one show. The second one will fall flat.');
  Object.keys(twice).forEach(function(id){ann.push(S.w[id].name+' is working twice tonight. The second reaction will be weaker.');});
  var pool=eligible(S,P,show).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,8).filter(function(w){return !on[w.id]&&S.week-w.lu>=3;});
  if(pool.length)ann.push(pool[0].name+' has been off the shows for '+(S.week-pool[0].lu)+' weeks. People are asking.');
  var out=[],cap=2+extra;
  [[P.staff.agent+', road agent',agent],[P.staff.writer+', head writer',writer],[P.ann[0]+', lead announcer',ann]].forEach(function(x){out.push({who:x[0],tips:x[1].filter(function(t,i,a){return a.indexOf(t)===i;}).slice(0,cap)});});
  return out;
};
E.STYLES=STYLES;E.ROOTS=ROOTS;E.PLEDGE=PLEDGE;E.SKILLS=SKILLS;E.xpNeed=xpNeed;E.bpGrant=bpGrant;
