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
