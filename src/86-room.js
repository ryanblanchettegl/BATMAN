/* ---------- the locker room as a group of people: cliques, creative control ---------- */

/* ---------- 38. Cliques: friends form a group; a group with a star asks for favours as a block ---------- */
/* three or more of your people who all get on with somebody in the group (relOf above zero), found as connected groups */
E.cliques=function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.inj<=0&&!w.rt;}),seen={},out=[];
  var ovrs=R.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=ovrs[Math.floor(R.length*0.3)]||0;
  R.forEach(function(w){
    if(seen[w.id])return;
    var grp=[w],q=[w];seen[w.id]=1;
    while(q.length){var c=q.pop();R.forEach(function(o){if(!seen[o.id]&&relOf(S,c.id,o.id)>0){seen[o.id]=1;grp.push(o);q.push(o);}});}
    if(grp.length<3)return;
    grp.sort(function(a,b){return b.ovr-a.ovr;});
    out.push({star:grp[0],m:grp,name:grp[0].name.split(' ')[0]+'’s circle',power:grp[0].ovr>=cut});
  });
  return out;
};
WEEKX.push(function(S){
  if(S.cal||S.week-(S.cliqueAt||0)<10||!chance(S,0.07))return;
  if(S.inbox.some(function(e){return e.type==='clique'&&!e.done;}))return;
  var P=S.promos[S.player],cl=E.cliques(S).filter(function(c){return c.power&&c.star.morale>=25;});if(!cl.length)return;
  var c=pick(S,cl),star=c.star,friends=c.m.filter(function(w){return w!==star&&w.ovr<star.ovr-6&&w.ws<=1;}).sort(function(a,b){return a.ovr-b.ovr;});
  var rivals=rosterOf(S,P.id).filter(function(w){return !w.nw&&c.m.indexOf(w)<0&&relOf(S,star.id,w.id)<0&&w.ovr<=star.ovr+5&&w.ovr>=star.ovr-25&&!w.held;}).sort(function(a,b){return b.ovr-a.ovr;});
  var kind=friends.length&&(!rivals.length||chance(S,0.55))?'push':(rivals.length?'hold':null);if(!kind)return;
  var tgt=kind==='push'?friends[0]:rivals[0];S.cliqueAt=S.week;
  var names=c.m.filter(function(w){return w!==star;}).slice(0,3).map(function(w){return w.name;});
  var ev={type:'clique',w:star.id,target:tgt.id,kind:kind,members:c.m.map(function(w){return w.id;}),cname:c.name,
    text:star.name+' comes to you with '+names.join(', ')+'. They stand together, and they have a favour to ask: '+(kind==='push'?'a win for '+tgt.name+', one of their own.':'keep '+tgt.name+' down for eight weeks.'),
    choices:['Say yes','Say no','Break up the group'],
    checks:{1:mkCheck(7,[moraleMod(star),trustMod(S)].concat(skillMods(S,'talk'))),2:mkCheck(8,[moraleMod(star),trustMod(S),{n:'A big group',v:c.m.length>=5?-1:0}].concat(skillMods(S,'talk')))}};
  pushEv(S,ev);
});
EVR.clique=function(S,ev,choice,P,w){
  var tgt=S.w[ev.target],mem=ev.members.map(function(id){return S.w[id];}).filter(Boolean),r;
  if(choice===0){
    mem.forEach(function(x){x.morale=clamp(x.morale+4,0,100);});
    if(ev.kind==='push'&&tgt){S.quests.push({id:S.nid++,type:'win',w:tgt.id,due:S.week+3,text:'Promise to '+ev.cname+': book a win for '+tgt.name+' by '+cal(S.week+3).label});return 'You said yes. '+w.name+' and the others are pleased, and they will hold you to a win for '+tgt.name+'.';}
    if(tgt){tgt.held=S.week+8;tgt.heldBy=w.id;tgt.morale=clamp(tgt.morale-4,0,100);return 'You said yes. '+tgt.name+' will hear about it, and '+w.name+' will notice if you push them in the next eight weeks.';}
    return 'You said yes.';
  }
  if(choice===1){
    r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){mem.forEach(function(x){x.morale=clamp(x.morale-1,0,100);});return rollText(r)+w.name+' takes it well enough. The group goes quiet.';}
    mem.forEach(function(x){x.morale=clamp(x.morale-5,0,100);});w.arc={t:'grievance'};
    return rollText(r)+'The group closes ranks against you. Expect '+w.name+' to say so on the next show.';
  }
  r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){
    for(var i=0;i<mem.length;i++)for(var j=i+1;j<mem.length;j++){var k=rkey(mem[i].id,mem[j].id);if(S.rel&&S.rel[k]>0)S.rel[k]=0;if(S.bond&&S.bond[k]>0)S.bond[k]=0;}
    mem.forEach(function(x){x.morale=clamp(x.morale-3,0,100);});
    news(S,'story','The locker room is quieter. '+ev.cname+' has been broken up.');
    return rollText(r)+'You split them up on the card and in the dressing room. The group is gone. Nobody enjoyed it.';
  }
  mem.forEach(function(x){x.morale=clamp(x.morale-6,0,100);});
  for(var a=0;a<mem.length;a++)for(var b=a+1;b<mem.length;b++){var kk=rkey(mem[a].id,mem[b].id);S.bond=S.bond||{};S.bond[kk]=Math.min(10,(S.bond[kk]||0)+2);}
  return rollText(r)+'It backfires. They are closer than ever, and angrier.';
};
/* if you push someone you promised to hold down, their friends notice */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(!ctx.isPl||S.cal||r.win<0)return;
  r.winners.forEach(function(w){
    if(w.held==null||w.held<S.week)return;
    var star=S.w[w.heldBy];w.held=null;if(!star)return;
    star.morale=clamp(star.morale-6,0,100);S.trust=clamp(S.trust-1,0,100);
    r.seg.notes.push(star.name+' noticed that '+w.name+' got the win. You said you would hold them down.');
  });
});

/* ---------- 39. Creative control: a top star can win the right to refuse a loss (w.cc) ---------- */
/* the extra booking power for calling a loss on someone with control; a draw costs nothing extra */
function ccCost(S,m,k){
  return m.sides.some(function(s,j){return j!==k&&s.some(function(id){return S.w[id]&&S.w[id].cc;});})?2:0;
}
/* when the result is left to play out and the dice would have a controlling star lose, they refuse (not as a challenger in a title match) */
function ccRefusal(S,sides,win,t,champSide){
  for(var k=0;k<sides.length;k++){
    if(k===win)continue;
    for(var i=0;i<sides[k].length;i++){
      var w=sides[k][i];
      if(w.cc&&!(t&&champSide>=0&&k!==champSide))return {side:k,w:w};
    }
  }
  return null;
}
WEEKX.push(function(S){
  if(S.cal)return;
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  R.forEach(function(w){if(w.cc&&(S.week>=(w.ccUntil||0)||w.promo!==P.id)){w.cc=0;news(S,'contract',w.name+'’s creative control ended with the contract.');}});
  if(!chance(S,0.05)||S.inbox.some(function(e){return e.type==='ccask'&&!e.done;}))return;
  var ovrs=R.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=ovrs[Math.max(0,Math.floor(R.length*0.12))]||0;
  var c=R.filter(function(w){return w.ovr>=cut&&w.ovr>=60&&!w.cc&&w.con>=6&&w.morale>=40&&w.inj<=0&&(w.ccAsk==null||S.week-w.ccAsk>=52);}).sort(function(a,b){return b.ovr-a.ovr;});
  if(!c.length)return;
  var w=c[0];w.ccAsk=S.week;
  pushEv(S,{type:'ccask',w:w.id,text:w.name+' wants a clause in the contract: creative control. They would be able to refuse a loss on any show until the contract ends.',
    choices:['Grant it until the contract ends','Offer ten percent more money instead','Turn them down'],
    checks:{1:mkCheck(7,[moraleMod(w),trustMod(S)].concat(skillMods(S,'talk')))}});
});
EVR.ccask=function(S,ev,choice,P,w){
  if(choice===0){w.cc=1;w.ccUntil=S.week+Math.max(6,w.con|0);w.morale=clamp(w.morale+10,0,100);return w.name+' has creative control until the contract ends. Leaving them to play out can end in a win they asked for, and calling a loss on them costs 2 more booking power.';}
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){w.wage=Math.round(w.wage*1.1/50)*50;w.morale=clamp(w.morale+3,0,100);return rollText(r)+w.name+' takes the money, now '+money(w.wage)+' a week, and drops the clause.';}
    w.morale=clamp(w.morale-4,0,100);return rollText(r)+w.name+' says money is not the point.';
  }
  w.morale=clamp(w.morale-8,0,100);stressAdd(S,w,6);return w.name+' is not happy, but it is your show.';
};
POST.push(function(ctx){
  var S=ctx.S,m=ctx.m,r=ctx.res;if(!ctx.isPl||S.cal||m.call==null||m.call<0||r.win<0)return;
  ctx.sides.forEach(function(s,k){if(k===m.call)return;s.forEach(function(w){if(w.cc){w.morale=clamp(w.morale-5,0,100);S.trust=clamp(S.trust-1,0,100);r.seg.notes.push(w.name+' has creative control, and you overrode it. They remember.');}});});
});
E.controlWord=function(w){return w.cc?'Can refuse to lose. Calling a loss on them costs 2 more booking power and a little trust.':null;};

/* ---------- 44. The road: wear from the schedule (w.rd), travel partners, and a bus or a charter (P.trv) ---------- */
var TRVN=['Vans and cars','Tour bus','Charter flights'],TRV_C=[0,0.004,0.011],TRV_R=[0,0.3,0.6];
function travelCost(P){return Math.round(TRV_C[P.trv||0]*P.inc0);}
E.TRVN=TRVN;E.TRV_C=TRV_C;
E.travelInfo=function(S){var P=S.promos[S.player];return {lvl:P.trv||0,names:TRVN,costs:TRV_C.map(function(c){return Math.round(c*P.inc0);}),cost:travelCost(P)};};
E.roadWord=function(w){var v=w.rd||0;return v>=80?'Wrecked':(v>=60?'Worn down':(v>=35?'Tired':'Fresh'));};
WEEKX.push(function(S){
  if(S.cal)return;
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),cut=1-TRV_R[P.trv||0];
  R.forEach(function(w){
    var worked=w.wk===S.week,n=worked?(w.wkW===S.week?w.wkN||1:1):0;
    w.rd=clamp((w.rd||0)+(worked?(5+(n-1)*3)*cut:-9-(w.rest===S.week?6:0)),0,100);
  });
  // cars: the people who worked this week are shuffled into groups of three on the road
  var on=R.filter(function(w){return w.wk===S.week&&w.inj<=0;}).sort(function(a,b){return hash('car'+S.week+a.id)-hash('car'+S.week+b.id);});
  var fric=[0.02,0.01,0.004][P.trv||0],B=S.bond||(S.bond={});
  for(var i=0;i+1<on.length;i+=3){
    var grp=on.slice(i,i+3);
    for(var a=0;a<grp.length;a++)for(var b=a+1;b<grp.length;b++){
      var x=grp[a],y=grp[b],k=rkey(x.id,y.id),v=B[k]||0;
      B[k]=clamp(v+(relOf(S,x.id,y.id)<0?-0.3:0.25),-8,8);
      var p=fric*(1+Math.max(0,-v)*0.4)*(1+((x.stress||0)+(y.stress||0))/150);
      if(S.week-(S.carAt||-99)>=10&&chance(S,p)&&!S.inbox.some(function(e){return e.type==='carfight'&&!e.done;})){
        S.carAt=S.week;
        pushEv(S,{type:'carfight',w:x.id,o:y.id,text:x.name+' and '+y.name+' came to blows on the road after a long week. Word is already out.',
          choices:['Turn it into a feud','Make them shake hands','Fine them both'],checks:{1:mkCheck(7,[trustMod(S),{n:'They are tired of the road',v:((x.rd||0)+(y.rd||0))/2>=60?-1:0}].concat(skillMods(S,'talk')))}});
      }
    }
  }
});
EVR.carfight=function(S,ev,choice,P,w){
  var o=S.w[ev.o],k=rkey(w.id,o.id);S.bond=S.bond||{};
  if(choice===0){var f=startFeud(S,P,w,o,40,w.name+' and '+o.name+' fought on the road',{force:true});w.mom=clamp(w.mom+1,-10,10);o.mom=clamp(o.mom+1,-10,10);return f?'You turned it into a story. '+w.name+' against '+o.name+' is on.':'There was already a story between them, and the fight fed it.';}
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){S.bond[k]=Math.min(8,(S.bond[k]||0)+2);return rollText(r)+'They shake hands and mean it, mostly.';}
    S.bond[k]=Math.max(-8,(S.bond[k]||0)-1.5);w.morale=clamp(w.morale-3,0,100);o.morale=clamp(o.morale-3,0,100);return rollText(r)+'They shake hands for the cameras and go back to glaring.';
  }
  w.morale=clamp(w.morale-5,0,100);o.morale=clamp(o.morale-5,0,100);P.cash-=5000;S.bond[k]=Math.max(-8,(S.bond[k]||0)-0.5);return 'You fined them both. Nobody argued, and nobody forgot.';
};
MQX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var v=avg(ctx.all.map(function(w){return w.rd||0;}));
  return v>=65?{d:-(v-60)/12,x:'Worn out from the road'}:null;
});
