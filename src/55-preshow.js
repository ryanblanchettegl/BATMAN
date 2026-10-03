/* ---------- before the bell: something goes wrong (or right) and you make a call ---------- */
EFX.push(function(ctx,w){return ctx.m.eff&&ctx.m.eff[w.id]?ctx.m.eff[w.id]:0;});
function showKey(S){var sh=S.queue[S.qi];return sh?S.week+':'+sh.id:'';}
function onCard(card){var o={};card.forEach(function(m,i){flat(m.sides).forEach(function(id){if(o[id]==null)o[id]=i;});});return o;}
E.preShow=function(S,card){
  var key=showKey(S);if(!key||S.over)return null;
  if(S.pre&&S.pre.key===key)return S.pre.done?null:S.pre;
  S.pre={key:key,done:true};
  if(!chance(S,0.38))return null;
  var P=S.promos[S.player],oc=onCard(card),ids=Object.keys(oc).map(Number),n=card.length,pre=null,w,mi,m;
  var kind=pick(S,['travel','banged','truck','protect','walkup','walkup']);
  if(kind==='travel'&&ids.length){
    w=S.w[pick(S,ids)];mi=oc[w.id];
    pre={type:'travel',w:w.id,mi:mi,text:w.name+'’s flight is delayed. They may not make it to the building in time for match '+(mi+1)+'.',choices:['Pull '+w.name+' and find a replacement',mi<n-1?'Move the match to later in the show':'Go on as planned and hope']};
  }else if(kind==='banged'&&ids.length&&ids.some(function(id){return S.w[id].cond<78;})){
    var tired=ids.map(function(id){return S.w[id];}).sort(function(a,b){return a.cond-b.cond;})[0];w=tired;mi=oc[w.id];
    pre={type:'banged',w:w.id,mi:mi,text:w.name+' is banged up tonight ('+Math.round(w.cond)+'% condition) and the trainer wants a word about match '+(mi+1)+'.',choices:['Work the match as planned','Keep the match short','Pull '+w.name+' and find a replacement']};
  }else if(kind==='truck'){
    var cost=Math.round(P.prod*0.5/1000)*1000;
    pre={type:'truck',cost:cost,text:'The production truck has a fault. The lighting rig and half the cameras are down.',choices:['Pay '+money(cost)+' for an emergency fix','Run the show without them']};
  }else if(kind==='protect'){
    var c=[];card.forEach(function(mm,i){if(mm.mt!=='1v1'||mm.title||!(mm.win>=0))return;var l=S.w[mm.sides[mm.win===0?1:0][0]];if(inFeud(S,l.id)&&!feudOf(S,mm.sides[0][0],mm.sides[1][0]))c.push([l,i]);});
    if(c.length){var p=pick(S,c);w=p[0];mi=p[1];var f=feudsFor(S,w.id)[0];
      pre={type:'protect',w:w.id,mi:mi,text:'The writers suggest protecting '+w.name+' in match '+(mi+1)+'. A clean loss tonight would take the shine off the feud with '+S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]].name+'.',choices:['Protect '+w.name+' with a disqualification finish','Stick to the plan']};}
  }
  if(!pre&&kind==='walkup'||(!pre&&chance(S,0.5))){
    var up=chance(S,0.55);S.hype=(S.hype||0)+(up?0.08:-0.08);
    pre={type:'walkup',text:up?'The box office reports a big walk-up crowd. The building will be fuller and louder than expected.':'Bad weather has hit the walk-up. Expect some empty seats tonight.',choices:['Noted']};
  }
  if(!pre)return null;
  pre.key=key;pre.done=false;pre.result=null;S.pre=pre;return pre;
};
function replaceOn(S,card,mi,w){
  var P=S.promos[S.player],show=S.queue[S.qi],oc=onCard(card),m=card[mi];
  var cands=eligible(S,P,show).filter(function(x){return oc[x.id]==null&&x.g===w.g&&x.id!==w.id;}).sort(function(a,b){return Math.abs(a.ovr-w.ovr)-Math.abs(b.ovr-w.ovr);});
  if(m.title){var t=titleById(P,m.title);if(t&&t.holders.indexOf(w.id)>=0)m.title=null;}
  if(!cands.length){card.splice(mi,1);return null;}
  m.sides.forEach(function(s){var k=s.indexOf(w.id);if(k>=0)s[k]=cands[0].id;});
  return cands[0];
}
E.resolvePre=function(S,card,choice){
  var pre=S.pre;if(!pre||pre.done)return null;
  var P=S.promos[S.player],w=pre.w!=null?S.w[pre.w]:null,m=pre.mi!=null?card[pre.mi]:null,res='',r;
  if(pre.mi!=null&&(!m||(w&&flat(m.sides).indexOf(w.id)<0))){pre.done=true;pre.result='The card changed, so it no longer matters.';return pre.result;}
  if(pre.type==='travel'){
    if(choice===0){r=replaceOn(S,card,pre.mi,w);res=r?r.name+' steps in for '+w.name+'.':'No replacement was available, so the match is off the card.';}
    else if(pre.mi<card.length-1){var mv=card.splice(pre.mi,1)[0];card.splice(card.length-1,0,mv);(mv.eff=mv.eff||{})[w.id]=-12;res=w.name+' arrives with minutes to spare and goes on cold. The match moves to the semi-main slot.';}
    else{(m.eff=m.eff||{})[w.id]=-12;res=w.name+' makes it, just, and goes on cold.';}
  }else if(pre.type==='banged'){
    if(choice===0){m.hurt=w.id;(m.eff=m.eff||{})[w.id]=-6;res=w.name+' will work through it. The risk of a real injury is much higher tonight.';}
    else if(choice===1){m.len='S';if(m.stip==='iron')m.stip='std';res='Match '+(pre.mi+1)+' is cut short to protect '+w.name+'.';}
    else{r=replaceOn(S,card,pre.mi,w);res=r?r.name+' steps in for '+w.name+'.':'No replacement was available, so the match is off the card.';}
  }else if(pre.type==='truck'){
    if(choice===0){P.cash-=pre.cost;res='The crew gets it working ten minutes before air. That cost '+money(pre.cost)+'.';}
    else{S.rateMod=(S.rateMod||0)-2;res='The show goes out looking cheaper than usual. It will cost a couple of points.';}
  }else if(pre.type==='protect'){
    if(choice===0){m.ff='dq';res=w.name+' will lose by disqualification and keep the heat for the feud.';}
    else res='The plan stands. '+w.name+' does the job clean.';
  }else res=pre.text;
  pre.done=true;pre.result=res;return res;
};
