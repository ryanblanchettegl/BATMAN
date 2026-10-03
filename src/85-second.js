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
  if(staffOf(S,'agent').length&&ctx.all.some(function(w){return w.age<=28;})){d+=0.5;x='The road agent keeps the young wrestlers on script';}
  if(staffOf(S,'commentator').length){d+=0.3;x=x||'The commentary team sells the story';}
  var boss=staffOf(S,'boss')[0];if(boss){d+=0.4-(S.bossUse>3?0.8:0);x=x||(boss.name+' is on screen again');}
  return d?{d:d,x:x}:null;
});
WEEKX.push(function(S){
  if(S.cal)return;var tr=staffOf(S,'trainer');if(tr.length)rosterOf(S,S.player).forEach(function(w){if(!w.nw&&w.age<=26&&workRate(w)<w.pot)w.xp+=0.04;});
  S.bossUse=Math.max(0,(S.bossUse||0)-(S.week%3===0?1:0));
});
/* an on-screen boss who is on every show overshadows the wrestlers, and the fans say so */
SHOWX.push(function(S,P,show,rep){if(P.id!==S.player||S.cal)return;if(staffOf(S,'boss').length){S.bossUse=(S.bossUse||0)+1;if(S.bossUse===4){news(S,'story','The fans are asking why the boss is on every show. The wrestlers are being overshadowed.');}}});
