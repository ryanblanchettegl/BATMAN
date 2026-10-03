/* ---------- the locker room: roles, the ego grid, stress, bodies that wear out, and the people who patch them up ---------- */
var ROLE={
  leader:{n:'Locker-room leader',d:'Steadies everyone around them while content. An unhappy leader drags the room down.'},
  mentor:{n:'Mentor',d:'Can take a young wrestler under their wing and speed up their growth.'},
  gate:{n:'Gatekeeper',d:'The test every newcomer has to pass. Beating them clean means more, and they do not mind losing.'},
  diva:{n:'Diva',d:'Works hard in the main event and sulks anywhere else. Expects top money.'},
  toxic:{n:'Toxic influence',d:'Spreads unhappiness through the locker room every week until somebody deals with it.'}
};
var ZONES={n:{n:'Neck',len:1.6},s:{n:'Shoulders',len:1.0},b:{n:'Back',len:1.1},k:{n:'Knees',len:1.3}};
var INTN={safe:{n:'Safe',w:0.6,i:0.6},normal:{n:'Normal',w:1,i:1},brutal:{n:'Brutal',w:1.7,i:1.6}};
var MEDN=['No medical cover','Ringside trainer','Physio team','Full medical staff'],MED_C=[0,0.003,0.007,0.012],MED_R=[0,0.1,0.2,0.35],MED_L=[1,0.92,0.82,0.72],MED_I=[1,0.96,0.9,0.85];
var EXN={'Main event':4.4,'Upper midcard':3.5,'Midcard':2.6,'Lower midcard':1.8,'Opener':1.1},PUSHN={main_eventer:4.4,upper_midcarder:3.5,midcarder:2.6,lower_midcarder:1.8,jobber:1.1,non_wrestler:1.1};
function medCost(P){return Math.round(MED_C[P.med||0]*P.inc0);}
function zonesOf(w){return w.bz||(w.bz={n:0,s:0,b:0,k:0});}
function zoneFloor(w,k){return clamp(((w.age-26)*1.4+(w.ml||0)/30)*(1.25-w.dur/200)*(OWNZ[w.style]===k?1.3:1),0,50);}
function maxZone(w){var z=zonesOf(w);return Math.max(z.n,z.s,z.b,z.k);}
function fictional(S){return !!(S.db&&S.db.fictional);}

/* --- set-up --- */
function assignRoles(S){
  var fic=fictional(S);
  S.order.forEach(function(pid){
    var P=S.promos[pid],R=rosterOf(S,pid).filter(function(w){return !w.nw;}),n=R.length,ov=R.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),med=ov[Math.floor(n/2)]||50;
    var h=function(w,k){return h01(S.seed+k+w.id);},by=function(f,ok){return R.filter(function(w){return !w.role&&ok(w);}).sort(function(a,b){return f(b)-f(a);});};
    var take=function(L,role,k){var have=R.filter(function(w){return w.role===role;}).length;L.slice(0,Math.max(0,k-have)).forEach(function(w){w.role=role;});};
    take(by(function(w){return w.mic*0.4+w.ovr*0.4+h(w,'L')*25;},function(w){return w.age>=30;}),'leader',n>=40?2:1);
    take(by(function(w){return (w.age-30)*3+workRate(w)*0.6+h(w,'M')*20;},function(w){return w.age>=33&&workRate(w)>=66;}),'mentor',n>=40?3:2);
    take(by(function(w){return w.cons*0.5+workRate(w)*0.4+h(w,'G')*25-Math.abs(w.ovr-med)*1.2;},function(w){return w.age>=29;}),'gate',2);
    if(fic){
      take(by(function(w){return w.sq*0.5+w.ovr*0.5+h(w,'D')*30;},function(w){return w.ovr>=P.image-5;}),'diva',n>=40?2:1);
      take(by(function(w){return h(w,'X')*100;},function(w){return w.ovr>=P.image-25&&w.ovr<P.image+5;}),'toxic',1);
    }
    if(pid!==S.player)autoMentor(S,pid);
  });
}
function autoMentor(S,pid){
  var R=rosterOf(S,pid),ms=R.filter(function(w){return w.role==='mentor';}),ys=R.filter(function(w){return !w.nw&&w.age<=26&&w.ment==null;}).sort(function(a,b){return b.pot-a.pot;});
  ms.forEach(function(m,i){if(ys[i])ys[i].ment=m.id;});
}
NEWX.push(function(S){
  var by={};S.w.forEach(function(w){if(w.uid)by[w.uid]=w;});
  (DB.rows||[]).forEach(function(d){var w=by[d.uid];if(w&&d.lrole&&ROLE[d.lrole])w.role=d.lrole;});
  S.w.forEach(function(w){
    var z=zonesOf(w),j=function(k){return h01(S.seed+'z'+k+w.id);};w.ml=Math.max(0,w.age-21)*30;
    ['n','s','b','k'].forEach(function(k){z[k]=Math.min(58,Math.round(zoneFloor(w,k)*(1+j(k)*0.6)));});
    w.stress=0;
  });
  assignRoles(S);
  S.order.forEach(function(pid){var pm=E.pushMap(S,pid);rosterOf(S,pid).forEach(function(w){w.ex=w.push&&PUSHN[w.push]?PUSHN[w.push]:(EXN[pm[w.id]]||2);w.pos=w.ex;});});
});

/* --- the ego grid: seven lines that say why somebody is happy or not --- */
function egoLines(S,w){
  var P=S.promos[w.promo],L=[],add=function(k,n,v,why){L.push({k:k,n:n,v:clamp(v,-2,2),why:why});};
  var ex=w.ex==null?2:w.ex,pos=w.pos==null?ex:w.pos,d=pos-ex,idle=S.week-(w.lu||0),low=ex<=1.3;
  var pv=d>=0.8?2:(d>=0.3?1:(d<=-1.2?-2:(d<=-0.5?-1:0)));if(low&&pv<0)pv=idle>=12?-1:0;if(w.nw||w.camp)pv=0;
  add('push','Push',pv,pv>0?'Booked above what they expected':(pv<0?'Expects a bigger spot than they are getting':'Booked about where they expect to be'));
  var fair=wageFor(w.ovr,P)*(w.role==='diva'?1.15:1),r=w.wage/Math.max(1,fair);
  add('pay','Pay',r>=1.4?2:(r>=1.15?1:(r<=0.65?-2:(r<=0.85?-1:0))),r>=1.15?'Paid better than their standing':(r<=0.85?'Underpaid for how big a star they are now':'Paid about right'));
  var pk=w.pk2||0,pb=w.pb2||0;add('promise','Promises',pk-2*pb,pb?'You have broken your word to them':(pk?'You kept your word':'No promises between you'));
  var lv=holdLvl(P,w.id),lost=w.lt&&S.week-w.lt.w<=12;
  add('title','Titles',lv>=3?2:(lv>0?1:(lost?-1:(ex>=4&&!w.hadTop&&S.week>24?-1:0))),lv?'Holds a title':(lost?'Lost a title recently':(ex>=4&&!w.hadTop&&S.week>24?'A main eventer who has never held the top title here':'No strong feelings')));
  var i1=ex>=4?3:(ex>=2.4?5:8),sp=(w.la&&S.week-w.la<=2?1:0)+(idle>=i1*2?-2:(idle>=i1?-1:0));if(w.nw||w.camp||w.inj>0)sp=Math.max(0,sp);
  add('spot','Spotlight',sp,sp>0?'Got time on the microphone lately':(sp<0?'Off the shows for '+idle+' weeks':'On the shows often enough'));
  var cv=(P.image-P.image0>=3?1:(P.image-P.image0<=-3?-1:0))+(P.cash<0?-1:0);add('company','The company',cv,cv>0?'The company is growing':(cv<0?'The company is going the wrong way':'The company is steady'));
  var t=S.trust==null?60:S.trust,yv=(t>=90?2:(t>=75?1:(t<20?-2:(t<40?-1:0))))+(w.you||0);add('you','You',yv,yv>0?'Trusts the booker':(yv<0?'Does not trust the booker':'No opinion of the booker yet'));
  return L;
}
function egoSum(S,w){var s=0;egoLines(S,w).forEach(function(l){s+=l.v;});return s;}
function roomMood(S,P){var d=0;rosterOf(S,P.id).forEach(function(w){if(w.inj>0||w.camp)return;if(w.role==='leader')d+=w.morale>=60?1.5:(w.morale<40?-2:0);else if(w.role==='toxic')d-=2;});return d;}
function egoTarget(S,w){return clamp(moraleTarget(S)+2.5*egoSum(S,w)+roomMood(S,S.promos[w.promo])+ruleMorale(S,w),15,97);}
E.ego=function(S,id){var w=S.w[id];if(!w||w.promo==='FA')return null;var L=egoLines(S,w),s=0;L.forEach(function(l){s+=l.v;});return {lines:L,sum:s,target:Math.round(egoTarget(S,w)),stress:Math.round(w.stress||0),ex:w.ex,pos:w.pos,role:w.role||null};};
E.lockerRoom=function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id),o={happy:0,ok:0,unhappy:0,roles:{},trouble:[],hurt:[],mood:roomMood(S,P)};
  R.forEach(function(w){
    var s=egoSum(S,w);if(w.morale>=70)o.happy++;else if(w.morale>=45)o.ok++;else o.unhappy++;
    if(w.role)(o.roles[w.role]=o.roles[w.role]||[]).push(w.id);
    if((w.stress||0)>=50||s<=-3){var worst=egoLines(S,w).sort(function(a,b){return a.v-b.v;})[0];o.trouble.push({id:w.id,stress:Math.round(w.stress||0),sum:s,why:worst.v<0?worst.why:'Stress is building'});}
    if(maxZone(w)>=60)o.hurt.push(w.id);
  });
  o.trouble.sort(function(a,b){return (b.stress-b.sum*8)-(a.stress-a.sum*8);});
  return o;
};

/* --- stress and breaking points --- */
function stressAdd(S,w,n){if(S.cal||!w||w.promo!==S.player)return;if(n>0&&has(w,'grudge'))n*=1.25;w.stress=clamp((w.stress||0)+n,0,100);}
function breakdown(S,w){
  w.brk=S.week;var P=S.promos[w.promo],kind=w.role==='diva'||w.ex>=4?'noshow':(w.mic>=70?'shoot':'walkout');
  if(kind==='shoot'){w.arc={t:'grievance'};w.stress=Math.max(0,w.stress-25);
    S.inbox.push({id:S.nid++,type:'break',w:w.id,text:w.name+' has had enough. Word is they plan to say so on the next show, script or no script.',done:true,result:null});news(S,'story',w.name+' is at breaking point.');return;}
  w.away=S.week+(kind==='walkout'?2:1);
  pushEv(S,{type:'break',kind:kind,w:w.id,text:kind==='noshow'?w.name+' did not turn up to the building this week. The stress has been building for a while.':w.name+' has walked out. They will be gone for two weeks at least.',
    choices:['Sit down and listen','Fine them','Let it go'],checks:{0:mkCheck(7,[moraleMod(w),trustMod(S),{n:'A leader in the locker room',v:roomMood(S,P)>0?1:0}].concat(skillMods(S,'talk')))}});
  news(S,'story',w.name+(kind==='noshow'?' no-showed.':' walked out on '+P.name+'.'));
}
EVR['break']=function(S,ev,choice,P,w){
  if(!w)return '';
  if(choice===0){
    var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){w.stress=Math.max(0,w.stress-35);w.morale=clamp(w.morale+6,0,100);w.you=clamp((w.you||0)+1,-1,1);return rollText(r)+w.name+' talks it through and comes back in a better place.';}
    w.morale=clamp(w.morale-6,0,100);w.stress=Math.max(0,w.stress-10);return rollText(r)+w.name+' hears you out and is not convinced.';
  }
  if(choice===1){w.stress=clamp(w.stress+5,0,100);w.morale=clamp(w.morale-5,0,100);S.trust=clamp(S.trust+2,0,100);w.you=clamp((w.you||0)-1,-1,1);return 'You fine '+w.name+'. The locker room notices that the rules apply to everyone.';}
  w.stress=Math.max(0,w.stress-20);S.trust=clamp(S.trust-3,0,100);return 'You let it go. '+w.name+' calms down, and the others notice what you let slide.';
};
TRAITS.grudge={n:'Holds a grudge',d:'Stress builds faster. Works harder inside a feud.'};
EFX.push(function(ctx,w){
  if(ctx.S.cal)return 0;var e=0,z=zonesOf(w),S=ctx.S;
  ['n','s','b','k'].forEach(function(k){if(z[k]>60)e-=(z[k]-60)*0.22;});
  if(w.hurt===S.week)e-=10;
  if(w.promo===S.player){
    if((w.stress||0)>=75)e-=6;else if((w.stress||0)>=50)e-=3;
    if(w.role==='diva')e+=ctx.isMain||ctx.i===ctx.n-2?3:-5;
    if(has(w,'grudge')&&ctx.feud)e+=2;
  }
  return e;
});

/* --- the brutality dial --- */
CRX.push(function(ctx){
  var it=ctx.m.int;if(!it||it==='normal'||!INTN[it])return null;var gim=ctx.stip!=='std';
  if(it==='safe')return {d:gim?-4:-2,x:gim?'A gimmick match where everyone held back':'They played it safe, and the crowd could tell'};
  var rk=ctx.P.risk>=2?1:0;return {d:(gim?(ctx.feud&&ctx.feud.heat>=40?5:3):2)+rk,x:gim?'They left everything in there':'Stiff, reckless and loud'};
});
MQX.push(function(ctx){var it=ctx.m.int;return it==='brutal'?{d:1.5,x:null}:(it==='safe'?{d:-1,x:null}:null);});
function hurtRisk(S,P,w,m){var it=INTN[m.int]||INTN.normal;return it.i*MED_I[P.med||0]*(1+Math.max(0,maxZone(w)-50)/40)*(w.hurt===S.week?3:1)*(m.note==='steal'?1.5:(m.note==='safe'?0.55:(m.note==='long'?1.15:(m.note==='short'?0.85:1))));}
function hurtZone(S,w){var z=zonesOf(w),ks=['n','s','b','k'],tot=0,x;ks.forEach(function(k){tot+=10+z[k];});x=rnd(S)*tot;for(var i=0;i<4;i++){x-=10+z[ks[i]];if(x<=0)return ks[i];}return 'b';}
var OWNZ={H:'k',P:'b',B:'s',T:'n',S:'s',A:'b',E:'k'},OPPZ={T:'s',P:'b',S:'n',H:'n',B:'b',A:'s',E:'k'};
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P,m=ctx.m,it=INTN[m.int]||INTN.normal,mine=ctx.isPl;if(S.cal)return;
  ctx.sides.forEach(function(side,k){
    side.forEach(function(w){
      // wear: half from how they work, half from who they are in there with
      var opp=flat(ctx.sides.filter(function(s,x){return x!==k;})),o=opp.length?opp[Math.floor(rnd(S)*opp.length)]:w,z=zonesOf(w);
      var wear=ctx.mins*0.07*it.w*(STIP[ctx.stip].inj>1.5?1.5:1)*(1.5-w.dur/125)*(w.age>w.pk[1]?1.3:1)*(has(w,'horse')?0.8:1);
      var a=OWNZ[w.style]||'b',b=OPPZ[o.style]||'s';z[a]=Math.min(100,z[a]+wear*0.55);z[b]=Math.min(100,z[b]+wear*0.45);w.wk=S.week;w.ml=(w.ml||0)+1;
      if(!mine)return;
      // where they stood on the card
      var n=ctx.n,i=ctx.i,sc=ctx.isMain?5:(i===n-2?4:(i>=n*0.5?3:(i>=1?2:1.6)));if(ctx.t)sc+=0.5;if(ctx.big)sc*=1.15;
      if(r.win>=0&&m.mt!=='br')sc+=r.winners.indexOf(w)>=0?0.3:(r.fin==='clean'?-0.3:0);
      w.pos=(w.pos==null?w.ex:w.pos)*0.8+Math.min(5.5,sc)*0.2;
      if(w.wkW!==S.week){w.wkW=S.week;w.wkN=0;}w.wkN++;if(w.wkN>1)stressAdd(S,w,5);
      if(w.cond<35)stressAdd(S,w,4);
    });
  });
  if(mine&&m.int==='brutal'&&ctx.stip!=='std'&&r.OV>=90)award(S,'ACH_BRUTAL');
  if(r.win<0)return;
  if(ctx.t&&r.seg.change)r.winners.forEach(function(w){if(ctx.t.lvl>=3)w.hadTop=true;stressAdd(S,w,-15);});
  else if(ctx.isMain||ctx.big)r.winners.forEach(function(w){stressAdd(S,w,-4);});
  var wa=avg(r.winners.map(function(w){return w.ovr;}));
  if(m.mt!=='br')r.losers.forEach(function(l){
    if(r.fin==='clean'&&(l.role==='diva'||l.ex>=4)&&wa<=l.ovr-10)stressAdd(S,l,12);
    if(l.ws<=-4)stressAdd(S,l,4);
    if(l.role==='gate'&&(r.fin==='clean'||r.fin==='flash')&&wa<l.ovr){
      r.winners.forEach(function(w){addOvr(P,w,0.6);w.pts=(w.pts||0)+2;});addOvr(P,l,0.25);l.morale=clamp(l.morale+1,0,100);
      if(mine)r.seg.notes.push(names(r.winners)+' passed the '+l.name+' test. That win means more than most.');
    }
  });
});

/* --- every week --- */
WEEKX.push(function(S){
  var PL=S.promos[S.player],lead=rosterOf(S,PL.id).some(function(w){return w.role==='leader'&&w.morale>=60&&w.inj<=0;});
  S.w.forEach(function(w){
    if(w.rt)return;var z=zonesOf(w),P=w.promo!=='FA'?S.promos[w.promo]:null,worked=w.wk===S.week,rec=((worked?0.25:0.6)+(P?MED_R[P.med||0]:0)+(w.inj>0?0.6:0)+(w.rest===S.week?0.8:0))*(P&&P.id===S.player&&hasRule(S,'iron')?0.65:1);
    ['n','s','b','k'].forEach(function(k){z[k]=Math.max(zoneFloor(w,k),z[k]-rec);});
    if(!P)return;
    if(w.ment!=null){var mt=S.w[w.ment];if(!mt||mt.promo!==w.promo||mt.rt||mt.role!=='mentor'||w.age>28)w.ment=null;else{if(workRate(w)<w.pot)w.xp+=0.12*(w.promo===S.player&&hasRule(S,'senior')?1.4:1);if(w.mic<Math.min(88,mt.mic-5)){w.mx=(w.mx||0)+0.2;if(w.mx>=1){w.mx-=1;w.mic++;}}mt.morale=clamp(mt.morale+0.4,0,100);}}
    if(w.promo!==S.player)return;
    // stress: what eases it and what feeds it
    var L=egoLines(S,w),g={};L.forEach(function(l){g[l.k]=l.v;});
    var ds=-3-(lead?2:0)-(worked?0:2)+(maxZone(w)>=70?2:0)+(g.pay<=-1?1:0)+(g.push<=-2?3:(g.push<=-1?1.5:0))+(g.promise<0?1.5:0);
    stressAdd(S,w,ds);
    if((w.stress||0)>=75&&w.inj<=0&&!w.camp&&!(w.away>=S.week)&&S.week-(w.brk||-99)>=8&&chance(S,0.35)){breakdown(S,w);if(chance(S,0.3)&&!has(w,'grudge')){(w.tr=w.tr||[]).push('grudge');news(S,'story',w.name+' earned a trait: '+TRAITS.grudge.n+'.');}}
  });
  // a toxic influence works on the people around them
  rosterOf(S,PL.id).filter(function(w){return w.role==='toxic'&&w.inj<=0&&!w.camp;}).forEach(function(tx){
    var c=rosterOf(S,PL.id).filter(function(w){return w.id!==tx.id&&!w.nw&&w.role!=='leader';});
    for(var k=0;k<3&&c.length;k++)stressAdd(S,pick(S,c),3);
  });
  if(S.week%4===0)S.order.forEach(function(pid){var pm=E.pushMap(S,pid);rosterOf(S,pid).forEach(function(w){var tg=EXN[pm[w.id]]||2;w.ex=(w.ex==null?tg:w.ex)*0.75+tg*0.25;});});
  if(S.week%48===0){S.w.forEach(function(w){if(w.pk2)w.pk2=Math.floor(w.pk2/2);if(w.pb2)w.pb2=Math.floor(w.pb2/2);});S.order.forEach(function(pid){if(pid!==S.player)autoMentor(S,pid);});}
});

/* --- things you can do about it --- */
E.ROLE=ROLE;E.ZONES=ZONES;E.INTN=INTN;E.MEDN=MEDN;
E.zones=function(S,id){var w=S.w[id];if(!w)return null;var z=zonesOf(w);return ['n','s','b','k'].map(function(k){return {k:k,n:ZONES[k].n,v:Math.round(z[k])};});};
E.medInfo=function(S){var P=S.promos[S.player];return {lvl:P.med||0,names:MEDN,costs:MED_C.map(function(c){return Math.round(c*P.inc0);}),cost:medCost(P)};};
E.rest=function(S,id){var w=S.w[id];if(!w||w.promo!==S.player)return null;if(w.rest===S.week){w.rest=0;return w.name+' is back on the card this week.';}w.rest=S.week;return w.name+' gets the week off. Rest eases wear and stress, and they cannot be booked until next week.';};
E.workHurtOk=function(S,id){var w=S.w[id];return !!(w&&w.promo===S.player&&w.inj>0&&w.inj<=2+(S.promos[S.player].med>=2?1:0));};
E.workHurt=function(S,id){
  var w=S.w[id];if(!E.workHurtOk(S,id))return null;var z=zonesOf(w),k=w.iz||'b';
  w.inj=0;w.hurt=S.week;z[k]=Math.min(100,z[k]+8);stressAdd(S,w,6);
  return w.name+' is cleared to work hurt this week ('+ZONES[k].n.toLowerCase()+'). They will not be at their best, and the risk of making it worse is three times normal.';
};
E.mentorsFor=function(S,id){var w=S.w[id];if(!w||w.age>26||w.nw)return [];return rosterOf(S,w.promo).filter(function(m){return m.role==='mentor'&&m.id!==w.id&&rosterOf(S,w.promo).filter(function(x){return x.ment===m.id&&x.id!==w.id;}).length<2;});};
E.setMentor=function(S,id,mid){var w=S.w[id];if(!w||w.promo!==S.player)return null;if(mid==null){w.ment=null;return w.name+' is on their own again.';}var m=S.w[mid];if(!m||m.role!=='mentor'||m.promo!==w.promo)return null;w.ment=m.id;award(S,'ACH_MENTOR');return m.name+' takes '+w.name+' under their wing. Expect faster growth in the ring and on the microphone.';};
E.wordOdds=function(S,id){var w=S.w[id],P=S.promos[S.player];if(!w||(w.role!=='toxic'&&w.role!=='diva'))return null;return mkCheck(w.role==='toxic'?10:9,[moraleMod(w),trustMod(S),{n:'A leader backs you up',v:roomMood(S,P)>0?1:0}].concat(skillMods(S,'talk')));};
E.haveWord=function(S,id){
  var w=S.w[id],ck=E.wordOdds(S,id);if(!ck||w.promo!==S.player)return null;
  if(w.wordWeek&&S.week-w.wordWeek<8)return {ok:false,msg:'You have had that conversation with '+w.name+' recently. Give it until '+cal(w.wordWeek+8).label+'.'};
  var r=rollCheck(S,ck);w.wordWeek=S.week;
  if(r.ok){var was=w.role;w.role=null;award(S,'ACH_REFORM');w.morale=clamp(w.morale+4,0,100);news(S,'story',w.name+' has turned a corner backstage.');return {ok:true,roll:r,msg:rollText(r)+w.name+' takes it on board. '+(was==='toxic'?'The poison stops.':'The demands stop.')};}
  stressAdd(S,w,15);w.morale=clamp(w.morale-4,0,100);return {ok:false,roll:r,msg:rollText(r)+w.name+' does not take it well.'};
};

/* ---------- who trained whom: the trainer is remembered after the mentoring ends ---------- */
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.ment==null||w.rt)return;var m=S.w[w.ment];if(!m)return;
    if(w.coach==null)w.coach=m.id;
    w.cw=(w.cw||0)+1;
    // every quarter a student moves one point towards the trainer's way of working
    if(w.cw%13===0)['brawl','tech','speed'].forEach(function(k){var d=m[k]-w[k];if(Math.abs(d)>=4)w[k]=clamp(w[k]+(d>0?1:-1),1,99);});
    if(w.cw===52&&w.style!==m.style){var was=w.style;w.style=m.style;if(w.promo===S.player)news(S,'story',w.name+' has spent a year with '+m.name+' and has picked up their style of working.');mile(S,w,'train','Took on the style of '+m.name);}
  });
});
/* the family tree of one wrestler: the line of trainers above, the students below */
E.family=function(S,id){
  var w=S.w[id];if(!w)return null;var up=[],seen={},c=w,g=0;seen[id]=1;
  while(c.coach!=null&&!seen[c.coach]&&g++<6){c=S.w[c.coach];if(!c)break;seen[c.id]=1;up.push(c.id);}
  function kids(x,depth){if(depth>3)return [];return S.w.filter(function(s){return s.coach===x&&s.id!==x;}).slice(0,12).map(function(s){return {id:s.id,kids:kids(s.id,depth+1)};});}
  return {coach:w.coach!=null&&S.w[w.coach]?w.coach:null,up:up,students:S.w.filter(function(s){return s.coach===id;}).map(function(s){return s.id;}),tree:kids(id,1)};
};
