/* ---------- second careers ----------
   A retired wrestler of yours can stay: road agent, trainer, commentator, manager or on-screen boss. Each role uses one of their old skills.
   Staff stay on the roster as non-wrestlers (nw) with a role in w.srole. */
var SROLES={
  agent:{n:'Road agent',skill:function(w){return (w.cons||60)*0.5+workRate(w)*0.5;},d:'Keeps the matches tight: young wrestlers on the card work a little better and get hurt a little less.'},
  trainer:{n:'Trainer',skill:function(w){return workRate(w);},d:'Teaches the young: every wrestler of 26 and under learns a little faster.'},
  commentator:{n:'Commentator',skill:function(w){return w.mic;},d:'Sells the stories on air: the show reads a little better.'},
  manager:{n:'Manager',skill:function(w){return w.mic;},d:'Speaks for a client at ringside and can be given one from the roster page.'},
  boss:{n:'On-screen boss',skill:function(w){return (w.mic+w.ovr)/2;},d:'Makes matches and feuds with a rebel on screen. Helps a show, overshadows it if overused.'}
};
E.SROLES=Object.keys(SROLES).map(function(k){return {id:k,n:SROLES[k].n,d:SROLES[k].d};});
WEEKX.push(function(S){
  if(S.cal)return;
  S.w.forEach(function(w){
    if(w.rt!==S.week||w.rtp!==S.player||w.nw||w.srole||w.age>60)return;
    var ch=Object.keys(SROLES).filter(function(k){return SROLES[k].skill(w)>=58;});if(!ch.length||(w.ovr<45&&w.age<45))return;
    pushEv(S,{type:'secondcareer',w:w.id,roles:ch,text:w.name+' has retired, and would like to stay in the business. What could they do for you?',choices:ch.map(function(k){return SROLES[k].n+': '+SROLES[k].d;}).concat(['Let them go with thanks'])});
  });
});
EVR.secondcareer=function(S,ev,choice,P,w){
  var k=ev.roles[choice];if(!k)return w.name+' is thanked, given a watch and sent home.';
  w.promo=S.player;w.nw=true;w.srole=k;w.roles=[SROLES[k].n.toLowerCase().replace(/ /g,'_')];w.wage=Math.round(w.wage*0.35/50)*50;w.con=48;w.morale=85;w.inj=0;w.rest=0;
  news(S,'contract',w.name+' stays on as '+SROLES[k].n.toLowerCase()+'.');return w.name+' takes the job of '+SROLES[k].n.toLowerCase()+'. '+SROLES[k].d;
};
function staffOf(S,k){return rosterOf(S,S.player).filter(function(w){return w.nw&&w.srole===k&&!w.rt0;});}
E.staff=function(S){return rosterOf(S,S.player).filter(function(w){return w.srole;}).map(function(w){return {id:w.id,role:SROLES[w.srole].n,d:SROLES[w.srole].d};});};
/* the effects */
CRX.push(function(ctx){
  if(!ctx.isPl)return null;var S=ctx.S,d=0,x=null;
  if(staffOf(S,'agent').length&&!ctx.m.agent&&ctx.all.some(function(w){return w.age<=28;})){d+=0.5;x='The road agent keeps the young wrestlers on script';}
  if(staffOf(S,'commentator').length){d+=0.3;x=x||'The commentary team sells the story';}
  var boss=staffOf(S,'boss')[0];if(boss){d+=0.4-(S.bossUse>5?0.8:0);x=x||(boss.name+' is on screen again');}
  return d?{d:d,x:x}:null;
});
WEEKX.push(function(S){
  if(S.cal)return;var tr=staffOf(S,'trainer');if(tr.length)rosterOf(S,S.player).forEach(function(w){if(!w.nw&&w.age<=26&&workRate(w)<w.pot)w.xp+=0.04;});
  S.bossUse=Math.max(0,(S.bossUse||0)*0.7);if(S.bossUse<3)S.bossWarn=0;
});
/* an on-screen boss who is on every show overshadows the wrestlers, and the fans say so */
SHOWX.push(function(S,P,show,rep){if(P.id!==S.player||S.cal)return;if(staffOf(S,'boss').length){S.bossUse=(S.bossUse||0)+0.3;if(S.bossUse>5&&!S.bossWarn){S.bossWarn=1;news(S,'story','The fans are asking why the boss is on every show. The wrestlers are being overshadowed.');}}});

/* ---------- 34. The on-screen boss makes matches and feuds with a rebel (m.boss, S.rebel) ---------- */
/* a match marked as the boss's own: it reads well when the story explains it, and every one adds to the overshadowing count */
E.hasBoss=function(S){return staffOf(S,'boss').length>0;};
E.bossMakes=function(S,i,on){
  var m=S.card&&S.card[i];if(!m)return false;
  if(on&&E.hasBoss(S))m.boss=1;else delete m.boss;return true;
};
CRX.push(function(ctx){
  if(!ctx.isPl||!ctx.m.boss||!E.hasBoss(ctx.S))return null;
  var f=ctx.feud;
  return f&&f.heat>=30?{d:1.8,x:'The boss made this match, and the story explains why'}:{d:0.5,x:'The boss put them in the ring'};
});
POST.push(function(ctx){if(ctx.isPl&&ctx.m.boss&&!ctx.S.cal&&E.hasBoss(ctx.S))ctx.S.bossUse=(ctx.S.bossUse||0)+0.7;});
/* now and then a heel rebels against the boss: weeks of build, then an inbox choice settles it */
WEEKX.push(function(S){
  if(S.cal||!E.hasBoss(S))return;
  var P=S.promos[S.player],R=S.rebel;
  if(R){
    var w=S.w[R.w];
    if(!w||w.promo!==P.id||w.nw){S.rebel=null;S.rebelEnd=S.week;return;}
    if(w.lu===S.week)R.heat=Math.min(100,R.heat+3);R.heat=Math.min(100,R.heat+2);
    if(!R.ev&&(R.heat>=70||S.week-R.since>=10)){
      R.ev=true;var bs=staffOf(S,'boss')[0];
      pushEv(S,{type:'rebel',w:w.id,text:w.name+' has been at war with '+bs.name+' for '+(S.week-R.since)+' weeks. The crowd wants it settled. How does it end?',choices:[bs.name+' wins and makes an example of '+w.name,w.name+' wins and the boss is humbled','Let it fizzle out']});
    }
    return;
  }
  if(S.week-(S.rebelEnd||0)<20||!chance(S,0.07))return;
  var c=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.align==='H'&&w.inj<=0&&w.mic>=55&&w.ovr>=P.image-5&&!w.away;}).sort(function(a,b){return b.ovr-a.ovr;});
  if(!c.length)return;
  var rb=c[0],bs=staffOf(S,'boss')[0];
  S.rebel={w:rb.id,since:S.week,heat:30};
  news(S,'story',rb.name+' has declared war on '+bs.name+', the boss, and says nobody tells them where to wrestle.');
});
EVR.rebel=function(S,ev,choice,P,w){
  var bs=staffOf(S,'boss')[0],name=bs?bs.name:'The boss';
  S.rebel=null;S.rebelEnd=S.week;
  if(choice===0){w.morale=clamp(w.morale-10,0,100);w.away=S.week+1;S.bossUse=(S.bossUse||0)+2;w.mom=clamp(w.mom-2,-10,10);news(S,'story',name+' put '+w.name+' in their place on screen.');return name+' wins. '+w.name+' sits out a week and is not happy about it. The fans saw a lot of the boss, though.';}
  if(choice===1){S.bossUse=0;w.morale=clamp(w.morale+10,0,100);w.mom=clamp(w.mom+4,-10,10);addOvr(P,w,1.5);
    var t=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w.g&&x.holders.length&&x.holders[0]!==w.id&&(!x.brand||x.brand===w.brand)&&(!t||x.lvl>t.lvl))t=x;});
    if(t)w.shot=t.id;news(S,'story',w.name+' beat the boss at '+name+'’s own game.');return w.name+' wins. The crowd loved it and the boss is quiet for a while.'+(t?' '+w.name+' has earned a shot at the '+t.name+'.':'');}
  w.morale=clamp(w.morale-3,0,100);return 'The feud fades. Nobody got the ending they wanted.';
};
E.rebelInfo=function(S){var R=S.rebel;if(!R||!S.w[R.w])return null;var bs=staffOf(S,'boss')[0];return {w:S.w[R.w],boss:bs||null,heat:Math.round(R.heat),weeks:S.week-R.since};};

/* ---------- 46. Road agents: give a match to an agent (m.agent); one agent covers two matches a night ---------- */
function agentOf(S,m){var a=m&&m.agent!=null?S.w[m.agent]:null;return a&&a.nw&&a.srole==='agent'&&a.promo===S.player?a:null;}
function agentQ(a){return clamp((SROLES.agent.skill(a)-50)/40,0.2,1.2);}
function agentRisk(S,m){var a=agentOf(S,m);return a?1-0.25*agentQ(a):1;}
E.agents=function(S){return staffOf(S,'agent').map(function(w){return {id:w.id,name:w.name,skill:Math.round(SROLES.agent.skill(w))};});};
E.setAgent=function(S,i,id){var m=S.card&&S.card[i];if(!m)return false;if(id==null||id===''||!S.w[id])delete m.agent;else m.agent=+id;return true;};
MQX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var a=agentOf(ctx.S,ctx.m);if(!a)return null;
  var young=ctx.all.some(function(w){return w.age<=28;});
  return {d:Math.round((0.6+agentQ(a)*1.2+(young?0.5:0))*10)/10,x:a.name+', the road agent, kept the match tight'};
});
POST.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return;var a=agentOf(ctx.S,ctx.m);if(!a)return;
  var n=0;ctx.all.forEach(function(w){if(w.age<=26&&workRate(w)<w.pot){w.xp+=0.08;n++;}});
  if(n&&ctx.res.OV>=75)ctx.res.seg.notes.push(a.name+' talked the young ones through it afterwards.');
});
