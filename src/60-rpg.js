/* ---------- attempts: a chance of success built from what helps and what hurts, shown before you choose ----------
   Under the hood it is two six-sided numbers plus modifiers against a target; the player only ever sees the chance. */
var P2D6=[1,1,1,35/36,33/36,30/36,26/36,21/36,15/36,10/36,6/36,3/36,1/36];
function odds(target,mod){var k=target-mod;return k<=2?1:(k>12?0:P2D6[k]);}
function mkCheck(target,mods){mods=mods.filter(function(m){return m&&m.v;});var mod=0;mods.forEach(function(m){mod+=m.v;});return {target:target,mods:mods,mod:mod,p:odds(target,mod)};}
function rollCheck(S,ck){var a=ri(S,1,6),b=ri(S,1,6),tot=a+b+ck.mod;return {d:[a,b],mod:ck.mod,target:ck.target,total:tot,ok:tot>=ck.target};}
function rollText(r){return r.ok?'The attempt worked. ':'The attempt did not come off. ';}
function moraleMod(w){return {n:'Morale '+Math.round(w.morale),v:w.morale>=85?2:(w.morale>=70?1:(w.morale<35?-2:(w.morale<50?-1:0)))};}
function trustMod(S){var t=S.trust==null?60:S.trust;return {n:'Locker-room trust '+Math.round(t),v:t>=75?1:(t<40?-1:0)};}
var SKILLMOD=[];   // later systems (your booker's skills) add modifiers here: fn(S,kind) -> {n,v}
function skillMods(S,kind){return SKILLMOD.map(function(fn){return fn(S,kind);});}
function addChecks(S,ev){
  var P=S.promos[S.player],w=ev.w!=null?S.w[ev.w]:null;
  if(ev.type==='losing')ev.checks={1:mkCheck(7,[moraleMod(w),trustMod(S)].concat(skillMods(S,'talk')))};
  else if(ev.type==='offer'){var RV=S.promos[ev.rival];ev.checks={1:mkCheck(8,[moraleMod(w),trustMod(S),{n:'Your popularity against theirs',v:P.image>=RV.image?1:(RV.image-P.image>20?-1:0)},{n:'Holds a title here',v:holdLvl(P,w.id)>0?1:0}].concat(skillMods(S,'talk')))};}
  else if(ev.type==='pitch')ev.checks={0:mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=80?1:(w.mic<65?-1:0)},{n:'A crowd ready for a change',v:w.mom<=-3?1:0}].concat(skillMods(S,'creative')))};
  else if(ev.type==='flop')ev.checks={0:mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=75?1:0},{n:'Second attempt',v:1}].concat(skillMods(S,'creative')))};
}

/* ---------- fail forward: a failed attempt starts a different story ---------- */
EVR.losing=function(S,ev,choice,P,w){
  if(choice===0){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+2,text:'Promise: book a win for '+w.name+' by '+cal(S.week+2).label});w.morale=clamp(w.morale+5,0,100);return 'You promised a win. '+w.name+' will hold you to it.';}
  var r=rollCheck(S,ev.checks[1]);ev.roll=r;
  if(r.ok){w.morale=clamp(w.morale-2,0,100);return rollText(r)+w.name+' agrees to be patient.';}
  w.morale=clamp(w.morale-6,0,100);w.arc={t:'grievance'};
  return rollText(r)+w.name+' is not taking it quietly. Expect them to say so on the next show, and the crowd may well take their side.';
};
EVR.offer=function(S,ev,choice,P,w){
  var RV=S.promos[ev.rival];
  if(choice===0){w.wage=ev.raise;w.con=48;w.cn=false;w.morale=clamp(w.morale+6,0,100);return w.name+' re-signs for '+money(ev.raise)+' a week.';}
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){w.con=Math.max(w.con,24);w.morale=clamp(w.morale+2,0,100);return rollText(r)+w.name+' stays.';}
    w.notice=S.week+2;w.to=ev.rival;
    return rollText(r)+w.name+' gives notice and joins '+RV.name+' in two weeks. Until then they are yours to book: a clean loss on the way out will make whoever beats them.';
  }
  if(choice===3){
    var t=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w.g&&x.holders.length&&x.holders.indexOf(w.id)<0&&(!x.brand||x.brand===w.brand)&&(!t||x.lvl>t.lvl))t=x;});
    w.wage=ev.beat||Math.round(w.wage*1.45/50)*50;w.con=60;w.cn=false;w.morale=clamp(w.morale+12,0,100);
    if(t)S.quests.push({id:S.nid++,type:'shot',w:w.id,title:t.id,due:S.week+8,text:'Promise: give '+w.name+' a '+t.name+' match by '+cal(S.week+8).label});
    RV.rel=clamp((RV.rel||0)-4,-100,100);
    return w.name+' stays at '+money(w.wage)+' a week on a 60-week deal'+(t?', with your word on a shot at the '+t.name+'.':'.')+' '+RV.name+' will not forget being outbid.';
  }
  leaveCompany(S,w,'left for '+RV.name);joinCompany(S,w,RV);news(S,'contract',w.name+' has jumped to '+RV.name+'.');return w.name+' signs with '+RV.name+'.';
};
EVR.pitch=function(S,ev,choice,P,w){
  if(choice!==0){w.morale=clamp(w.morale-3,0,100);return w.name+' shrugs it off.';}
  var r=rollCheck(S,ev.checks[0]);ev.roll=r;turn(S,w,'a new attitude');
  if(r.ok){addOvr(P,w,3);w.mom=clamp(w.mom+3,-10,10);return rollText(r)+'The turn lands. Overness up.';}
  w.arc={t:'flop',until:S.week+4,asked:false};
  return rollText(r)+'The crowd is not buying the new '+w.name+'. Reactions will suffer for a month, and you will have a decision to make.';
};
EVR.flop=function(S,ev,choice,P,w){
  if(choice===0){
    var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){w.arc=null;addOvr(P,w,4);w.mom=clamp(w.mom+3,-10,10);return rollText(r)+'Doubling down worked. The crowd finally gets it, and '+w.name+' comes out of this a bigger star.';}
    w.arc={t:'flop',until:S.week+3,asked:true};addOvr(P,w,-1);return rollText(r)+'Still nothing. '+w.name+' is stuck with it for another three weeks.';
  }
  turn(S,w,'back where they belong');w.arc=null;addOvr(P,w,1);w.morale=clamp(w.morale-2,0,100);return w.name+' goes back to what worked. The crowd is relieved.';
};
EVR.counter=function(S,ev,choice,P,w){
  if(choice===0&&wagesWeek(S,P)+ev.ask>E.budget(S))return S.owner.name+' will not sign off on that: it breaks the wage budget.';
  if(choice===0&&w.promo!==P.id&&E.canSign(S,w)){var from=w.promo;if(from!=='FA')leaveCompany(S,w,'left for '+P.name);joinCompany(S,w,P,ev.ask,ev.weeks);news(S,'contract',P.name+' signed '+w.name+(from!=='FA'?' away from '+S.promos[from].name:'')+'.');award(S,from==='FA'?'ACH_SIGN':'ACH_POACH');return w.name+' signs for '+money(ev.ask)+' a week.';}
  w.lock=S.week+4;return 'You walk away. '+w.name+' will not talk again for a month.';
};
EVMAKE.push(function(S,P,R){
  var c=R.filter(function(w){return w.arc&&w.arc.t==='flop'&&!w.arc.asked;})[0];if(!c)return null;c.arc.asked=true;
  return {type:'flop',w:c.id,text:'The new '+c.name+' is not connecting. The writers want to know what to do.',choices:['Double down on it','Turn '+c.name+' back']};
});
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.notice&&S.week>=w.notice&&w.promo===S.player){var RV=S.promos[w.to];w.notice=0;leaveCompany(S,w,'left for '+RV.name);joinCompany(S,w,RV);news(S,'contract',w.name+' has left for '+RV.name+'.');}
    if(w.arc&&w.arc.t==='flop'&&S.week>w.arc.until)w.arc=null;
  });
});
POST.push(function(ctx){
  var r=ctx.res;if(!ctx.isPl||r.win<0)return;
  r.losers.forEach(function(l){if(l.notice&&(r.fin==='clean'||r.fin==='flash')){r.winners.forEach(function(w){addOvr(ctx.P,w,2);w.mom=clamp(w.mom+3,-10,10);});r.seg.notes.push(l.name+' puts '+names(r.winners)+' over on the way out. That is how you make a new star.');}});
});
ANGX.push(function(S,P,show,ctx,h){
  var c=h.pool.filter(function(w){return w.arc&&w.arc.t==='grievance'&&!h.ang[w.id];})[0];if(!c)return null;
  return [9,function(){
    c.arc=null;h.mark(c);var sc=promoScore(S,c,8);addOvr(P,c,1);c.mom=clamp(c.mom+3,-10,10);
    S.quests.push({id:S.nid++,type:'win',w:c.id,due:S.week+3,text:'The crowd is behind '+c.name+' now: book them a win by '+cal(S.week+3).label});
    return angle('Interview',c.name+' takes a live microphone and says the losing has gone on long enough. It sounds a little too real, and the crowd roars in agreement.',sc);
  }];
});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||show.big)return;
  S.quests.slice().forEach(function(q){
    if(q.type!=='prove')return;
    if(rep.rating>rep.exp){q.left--;if(q.left<=0){P.slot=Math.min(2,P.slot+1);news(S,'money','You proved it. The network moved '+P.name+' up to '+SLOTN[P.slot].toLowerCase()+'.');rep.quest.push('The network is convinced: you move to '+SLOTN[P.slot].toLowerCase()+'.');award(S,'ACH_QUEST');dropQuest(S,q);}else q.text='Network: beat expectations on one more TV show to earn the better slot';}
    else{rep.quest.push('The network wanted a show above expectations. The slot upgrade is off the table.');dropQuest(S,q);}
  });
});

/* ---------- gimmicks: a character type that either fits the wrestler or does not ---------- */
var GIMS=[
  {id:'brute',n:'Brute',f:function(w){return w.brawl*0.6+(w.style==='P'||w.style==='B'?28:0)+(w.align==='H'?8:0);}},
  {id:'cocky',n:'Cocky',f:function(w){return w.mic*0.6+(w.align==='H'?35:5);}},
  {id:'underdog',n:'Underdog',f:function(w){return (w.align==='F'?35:0)+(100-w.ovr)*0.3+w.speed*0.3;}},
  {id:'daredevil',n:'Daredevil',f:function(w){return w.speed*0.7+(w.style==='H'?25:0);}},
  {id:'technician',n:'Technician',f:function(w){return w.tech*0.7+(w.style==='T'?25:0);}},
  {id:'monster',n:'Monster',f:function(w){return (w.style==='P'?35:0)+w.brawl*0.4+(100-w.mic)*0.2;}},
  {id:'oldhand',n:'Old hand',f:function(w){return workRate(w)*0.45+w.ovr*0.45+5;}},
  {id:'rebel',n:'Rebel',f:function(w){return w.mic*0.4+w.brawl*0.3+22;}},
  {id:'hero',n:'Clean-cut hero',f:function(w){return (w.align==='F'?35:0)+w.ovr*0.3+workRate(w)*0.3;}},
  {id:'showman',n:'Showman',f:function(w){return w.mic*0.5+(w.style==='E'?35:0)+w.ovr*0.2;}},
  {id:'mystic',n:'Mystic',f:function(w){return (100-w.mic)*0.3+(w.align==='H'?20:10)+w.ovr*0.3+15;}},
  {id:'workhorse',n:'Workhorse',f:function(w){return workRate(w)*0.6+w.stam*0.35;}},
  {id:'outlaw',n:'Outlaw',f:function(w){return (w.align==='H'?25:5)+w.brawl*0.5+w.mic*0.25;}},
  {id:'comedy',n:'Comedy',f:function(w){return (w.style==='E'?40:0)+w.mic*0.5;}}
];
var GIMBY={};GIMS.forEach(function(g){GIMBY[g.id]=g;});
function gimFit(w){var g=GIMBY[w.gim];return g?clamp(Math.round(g.f(w)+(w.gr!=null?(w.gr-60)*0.3:0)),0,100):60;}
function assignGim(w){var best=null,bs=-1;for(var k=0;k<3;k++){var g=GIMS[hash(w.name+'g'+k)%GIMS.length],s=g.f(w);if(s>bs){bs=s;best=g;}}w.gim=best.id;w.gw=0;}
function initGimmicks(S){S.w.forEach(assignGim);}
CRX.push(function(ctx){
  var d=0,S=ctx.S,flop=null;
  ctx.all.forEach(function(w){
    var x=clamp((gimFit(w)-60)/14,-2.5,2.5);
    if(w.gw&&S.week-w.gw<=4)x+=1;else if(w.gw&&S.week-w.gw>60)x-=1;
    if(w.arc&&w.arc.t==='flop'){x-=3;flop=w;}
    d+=x;
  });
  d/=ctx.all.length;
  return {d:d,x:flop?'The crowd is rejecting the new '+flop.name:(d>=1.2?'Characters the crowd believes in':(d<=-1.2?'Gimmicks that are not connecting':null))};
});
E.repackOdds=function(S,id,gim){
  var w=S.w[id],old=w.gim;w.gim=gim;var fit=gimFit(w);w.gim=old;
  return mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=75?1:(w.mic<50?-1:0)},{n:'How well it suits them',v:fit>=70?1:(fit<45?-1:0)}].concat(skillMods(S,'creative')));
};
E.repackage=function(S,id,gim){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id||!GIMBY[gim]||gim===w.gim)return null;
  if(w.gcd>S.week)return w.name+' was repackaged recently. Give it until '+cal(w.gcd).label+'.';
  var r=rollCheck(S,E.repackOdds(S,id,gim));w.gim=gim;w.gw=S.week;w.gcd=S.week+12;
  if(r.ok){w.mom=clamp(w.mom+2,-10,10);return rollText(r)+w.name+' debuts the new '+GIMBY[gim].n.toLowerCase()+' character to a good reaction.';}
  w.arc={t:'flop',until:S.week+4,asked:false};return rollText(r)+'The '+GIMBY[gim].n.toLowerCase()+' character falls flat. Reactions will suffer for a month.';
};

/* ---------- earned traits ---------- */
var TRAITS={
  bigmatch:{n:'Big-match performer',d:'Raises their game at big events.'},
  giant:{n:'Giant killer',d:'The crowd believes in them as an underdog.'},
  iron:{n:'Iron lungs',d:'Stamina to go long.'},
  fav:{n:'Crowd favourite',d:'A bigger reaction as a face.'},
  hated:{n:'Most hated',d:'A bigger reaction as a heel.'},
  horse:{n:'Workhorse',d:'Loses less condition per match.'},
  closer:{n:'Closer',d:'Raises their game in main events.'},
  tag:{n:'Tag specialist',d:'Better tag matches.'},
  aura:{n:'Unbeatable aura',d:'A long winning streak left a mark on the crowd.'}
};
function has(w,t){return w.tr&&w.tr.indexOf(t)>=0;}
function earn(ctx,w,t){
  if(has(w,t))return;(w.tr=w.tr||[]).push(t);
  if(t==='iron')w.stam=Math.min(99,w.stam+8);
  if(w.promo===ctx.S.player){ctx.res.seg.notes.push(w.name+' has earned a trait: '+TRAITS[t].n+'.');news(ctx.S,'story',w.name+' earned a trait: '+TRAITS[t].n+'.');}
}
function bump(w,k){w.ct=w.ct||{};w.ct[k]=(w.ct[k]||0)+1;return w.ct[k];}
EFX.push(function(ctx,w){return (ctx.big&&has(w,'bigmatch')?6:0)+(ctx.isMain&&has(w,'closer')?4:0);});
MQX.push(function(ctx){if(ctx.m.mt!=='tag')return null;var n=ctx.all.filter(function(w){return has(w,'tag');}).length;return n?{d:Math.min(2,n*0.6),x:n>=2?'Tag specialists at work':null}:null;});
CRX.push(function(ctx){
  var d=0,lab=null,ov=ctx.all.map(function(w){return w.ovr;}),top=Math.max.apply(null,ov);
  ctx.all.forEach(function(w){
    if(has(w,'fav')&&w.align==='F'){d+=1.5;lab=w.name+' is a crowd favourite';}
    if(has(w,'hated')&&w.align==='H'){d+=1.5;lab='The crowd loves to hate '+w.name;}
    if(has(w,'aura'))d+=1;
    if(has(w,'giant')&&top-w.ovr>=10){d+=2;lab='They believe '+w.name+' can pull off the upset';}
  });
  return d?{d:Math.min(4,d),x:lab}:null;
});
POST.push(function(ctx){
  var r=ctx.res,P=ctx.P;
  ctx.all.forEach(function(w){
    if(bump(w,'m')>=25)earn(ctx,w,'horse');
    if(has(w,'horse'))w.cond=clamp(w.cond+ctx.mins*0.11,5,100);
    if(ctx.mins>=20&&bump(w,'long')>=5)earn(ctx,w,'iron');
    if(ctx.m.mt==='tag'&&bump(w,'tag')>=15)earn(ctx,w,'tag');
    if(ctx.big&&r.OV>=(P.base.big||80)+2&&bump(w,'big')>=3)earn(ctx,w,'bigmatch');
    if(ctx.isMain&&!ctx.big&&r.OV>=(P.mainB[ctx.show.id]||80)&&bump(w,'main')>=8)earn(ctx,w,'closer');
  });
  if(r.win<0)return;
  r.winners.forEach(function(w){
    if(r.upset&&bump(w,'upset')>=2)earn(ctx,w,'giant');
    if(w.ws>=10)earn(ctx,w,'aura');
    if(w.ws>=6&&w.align==='F')earn(ctx,w,'fav');
    if(w.align==='H'&&(r.fin==='cheap'||r.fin==='interf')&&bump(w,'cheap')>=5)earn(ctx,w,'hated');
  });
});

/* ---------- stables and managers ---------- */
var STABLEN=['The Iron Circle','Night Shift','The Foundry','Cold Front','The Ledger','Black Harbor','The Standard','Sixth Street','The Understudies','House Money','The Long Table','Grey Market'];
function stableOf(S,w){if(w.stable==null)return null;for(var i=0;i<S.stables.length;i++)if(S.stables[i].id===w.stable)return S.stables[i];return null;}
function endStable(S,st,why){st.m.forEach(function(id){S.w[id].stable=null;});S.stables=S.stables.filter(function(x){return x!==st;});news(S,'story',st.name+' are finished'+(why?': '+why:'')+'.');}
function leaveStable(S,w){var st=stableOf(S,w);if(!st)return;w.stable=null;st.m=st.m.filter(function(id){return id!==w.id;});if(st.leader===w.id||st.m.length<2)endStable(S,st,st.leader===w.id?'the leader is gone':'not enough members left');}
function stableMates(S,rivals,all){
  var out=[];rivals.forEach(function(r){var st=stableOf(S,r);if(st)st.m.forEach(function(id){var w=S.w[id];if(w.id!==r.id&&all.indexOf(w)<0&&w.inj<=0&&w.promo===r.promo&&!(w.away>=S.week)&&out.indexOf(w)<0)out.push(w);});});
  return out;
}
function micOf(S,w){var m=w.mgr!=null?S.w[w.mgr]:null;return m&&m.promo===w.promo&&m.inj<=0?Math.max(w.mic,Math.round(m.mic*0.92)):w.mic;}
function hasMouthpiece(S,w){var m=w.mgr!=null?S.w[w.mgr]:null;return !!(m&&m.promo===w.promo&&m.inj<=0&&m.mic>w.mic);}
NEWX.push(function(S){S.stables=[];});
ANGX.push(function(S,P,show,ctx,h){
  if(S.stables.filter(function(s){return s.promo===P.id;}).length>=2)return null;
  var hs=h.pool.filter(function(w){return w.align==='H'&&w.stable==null&&!h.ang[w.id];}).sort(function(a,b){return b.ovr-a.ovr;});
  if(hs.length<6)return null;
  return [0.9,function(){
    var L=hs.slice(0,Math.max(2,Math.floor(hs.length/4))).filter(function(w){return w.mic>=60;});if(!L.length)return null;
    var lead=pick(S,L),ms=hs.filter(function(w){return w.id!==lead.id&&w.g===lead.g&&w.ovr<lead.ovr-3&&w.ovr>lead.ovr-30&&(!lead.brand||w.brand===lead.brand);}).slice(0,2);
    if(ms.length<2)return null;
    var used={};S.stables.forEach(function(s){used[s.name]=1;});var nm=STABLEN.filter(function(n){return !used[n];});if(!nm.length)return null;
    var st={id:S.nid++,promo:P.id,name:pick(S,nm),leader:lead.id,m:[lead.id,ms[0].id,ms[1].id],formed:S.week,tension:0};
    S.stables.push(st);st.m.forEach(function(id){S.w[id].stable=st.id;});h.mark(lead,ms[0],ms[1]);
    news(S,'story','A new stable: '+st.name+' ('+lead.name+', '+ms[0].name+' and '+ms[1].name+').');
    return angle('Announcement',lead.name+' steps out flanked by '+ms[0].name+' and '+ms[1].name+'. From tonight they answer to one name: '+st.name+'.',promoScore(S,lead,6));
  }];
});
ANGX.push(function(S,P,show,ctx,h){
  var st=S.stables.filter(function(s){return s.promo===P.id&&s.tension>=10&&h.ok(s.leader);})[0];if(!st)return null;
  var outs=st.m.filter(function(id){return id!==st.leader&&h.ok(id);});if(!outs.length)return null;
  return [8,function(){
    var lead=S.w[st.leader],weakIds=E.stableWeak(S,st).map(function(x){return x.id;}).filter(function(id){return outs.indexOf(id)>=0;}),out=S.w[(weakIds.length?weakIds:outs).sort(function(a,b){return S.w[a].mom-S.w[b].mom;})[0]];
    h.mark(lead,out);leaveStable(S,out);if(out.align==='H')turn(S,out,'thrown out of '+st.name);
    var f=startFeud(S,P,out,lead,50,lead.name+' threw '+out.name+' out of '+st.name,{force:true});if(f)f.twist='expelled';memBetray(S,lead,out);st.tension=3;
    return angle('Betrayal',lead.name+' blames '+out.name+' for everything going wrong in '+st.name+'. The rest of the group turns on '+out.name+' and leaves them lying in the ring.',0.8*(lead.ovr+out.ovr)/2+10);
  }];
});
POST.push(function(ctx){
  var r=ctx.res,S=ctx.S;if(r.win<0||!S.stables)return;
  r.losers.forEach(function(w){var st=stableOf(S,w);if(st)st.tension+=w.id===st.leader?2:1;});
  r.winners.forEach(function(w){var st=stableOf(S,w);if(st)st.tension=Math.max(0,st.tension-0.5);});
});
E.setManager=function(S,id,mid){var w=S.w[id];if(!w||w.promo!==S.player)return;if(mid==null||mid===''||isNaN(mid)){w.mgr=null;return;}S.w.forEach(function(x){if(x.mgr===+mid&&x.promo===w.promo)x.mgr=null;});w.mgr=+mid;};
E.mouthpieces=function(S,id){var w=S.w[id];return rosterOf(S,w.promo).filter(function(x){return x.id!==w.id&&x.mic>=70&&x.mic>w.mic&&(x.nw||(x.g===w.g&&(!w.brand||x.brand===w.brand)));}).sort(function(a,b){return b.mic-a.mic;});};
E.gimFit=gimFit;E.GIMS=GIMS;E.TRAITS=TRAITS;E.stableOf=stableOf;E.micOf=micOf;E.odds=odds;
