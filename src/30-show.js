/* ---------- running a show ---------- */
function dirtSheet(S,P,show,rep,pool){
  var ms=rep.segs.filter(function(s){return s.k==='match';}),L=[],d=rep.rating-rep.exp,i;
  var vb=verdictBand(d);L.push(vb>1?show.name+' beat every expectation. This is a company on a roll.':(vb>0?'A good night. '+show.name+' gave the crowd a little more than they came for.':(vb===0?show.name+' was exactly the show people expected. No more, no less.':(vb===-1?'A flat night. '+show.name+' came up short of what this audience expects.':show.name+' was a miss. People were leaving before the main event ended.'))));
  var best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],worst=ms.slice().sort(function(a,b){return a.ov-b.ov;})[0],main=ms[ms.length-1];
  if(best)L.push('Match of the night: '+best.label+', '+starG(best.ov)+(best.fx.filter(function(f){return f.s>0;})[0]?'. '+best.fx.filter(function(f){return f.s>0;})[0].x+'.':'.'));
  if(worst&&worst!==best&&worst.ov<rep.rating-10){var why=worst.fx.filter(function(f){return f.s<0;})[0];L.push((worst.ov>=60?'Below this crowd’s bar: ':'Low point: ')+worst.label+', '+starG(worst.ov)+(why?'. '+why.x+'.':'.'));}
  if(main&&main!==best)L.push(main.ov>=rep.rating+4?'The main event delivered: '+starG(main.ov)+'.':(main.ov<rep.rating-3?'The main event ('+starG(main.ov)+') did not close the show the way it needed to.':'The main event did its job.'));
  var nf=ms.filter(function(s){return s.fin==='dq'||s.fin==='co'||s.fin==='draw';}).length;if(nf>=2)L.push(nf+' matches without a real finish is too many for one night.');
  var flat=ms.filter(function(s){return s.fx.some(function(f){return /^Nobody to/.test(f.x);});}).length;if(flat>=2)L.push(flat+' matches had nobody to cheer against. Mix your faces and heels.');
  var seen={};rep.segs.forEach(function(s){(s.ids||[]).forEach(function(id){seen[id]=1;});if(s.feud)seen['f'+s.feud]=1;});
  var cold=activeFeuds(S).filter(function(f){return f.promo===P.id&&!seen['f'+f.id]&&!(seen[f.a[0]]&&seen[f.b[0]])&&pool[f.a[0]]&&pool[f.b[0]];}).sort(function(a,b){return b.heat-a.heat;})[0];
  if(cold)L.push('Nothing tonight from '+feudLabel(S,cold)+'. That feud cools a little every week it is left alone.');
  var top=Object.keys(pool).map(function(id){return S.w[id];}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,8).filter(function(w){return S.week-w.lu>=3;})[0];
  if(top)L.push(top.name+' has not wrestled in '+(S.week-top.lu)+' weeks. Stars fade when they are off the card.');
  L.push(rep.sellout?'The building was sold out, '+rep.att.toLocaleString('en-US')+' strong.':(rep.att<rep.cap*0.75?'Only '+rep.att.toLocaleString('en-US')+' in a building that holds '+rep.cap.toLocaleString('en-US')+'. The card did not sell tickets.':rep.att.toLocaleString('en-US')+' paid to get in.'));
  return {by:S.columnist||'The Ringside Wire',lines:L.slice(0,7)};
}
/* A show runs in steps, so that the player's show can stop between any two of them for a call from the headset
   (src/31-live.js). showStart sells the tickets and lays out the steps; showStep runs the next one; showEnd scores
   the night and books the money. Everything a show needs between steps is in `st`, which is plain data, so a show
   that is on the air can be saved and loaded. Rival shows and the sample shows run the three straight through. */
function showPool(S,P,show){return eligible(S,P,show).filter(function(w){return w.promo===P.id&&!(show.big&&isDev(P,w.brand));});}
function showStart(S,P,show,card){
  var isPl=P.id===S.player&&!S.cal,big=!!show.big,n=card.length,i,key=big?'big':show.id;
  var rep={promo:P.id,id:show.id,name:show.name,big:big,week:S.week,segs:[],gim:false};
  var pool=showPool(S,P,show);
  // the advertised card sells the tickets: star power in the main event, the hottest feud, and advertising
  var star=n?avg(flat(card[n-1].sides).map(function(id){return S.w[id].ovr;})):50,heat=0;
  card.forEach(function(m){var ids=flat(m.sides);for(var x=0;x<ids.length;x++)for(var y=x+1;y<ids.length;y++){var f=feudOf(S,ids[x],ids[y]);if(f&&f.heat>heat)heat=f.heat;}});
  rep.mainStar=star;
  if(!S.cal){
    var hype=clamp(1+(star-(P.starB[key]||star))/80+heat/500+ADV_H[P.adv]+(isPl&&S.hype?S.hype:0)+(isPl?faceHype(S,P,card):0),0.8,1.4),dm=TIX_D[P.tix],d=demand(P,show,1)*(isPl?tourBoost(S,P)*tasteDraw(S,P,card,rep):1),cap=capFor(d);
    rep.hype=hype;rep.cap=cap;rep.att=Math.round(Math.min(cap,d*hype*dm));rep.sellout=rep.att>=cap;
    rep.energy=isPl?clamp((hype*dm-1)*9,-2,2):0;
    if(isPl){rep.venue=venueFor(S,P,cap);rep.ann=(deskNames(S,P)||P.ann).slice();var air=airStart(S,P,show);if(air){rep.ep=air.ep;rep.net=air.net;if(air.occ)rep.occ=air.occ;}S.hype=0;
      rep.lineup=card.map(function(m){var t=m.title?titleById(P,m.title):null;return vsLabel(m.sides.map(function(ids){return ids.map(function(id){return S.w[id];});}))+(t?' — '+t.name:'');});}
  }
  var st={rep:rep,used:{},angled:{},k:0,steps:[]};
  if(isPl){
    // the player books every promo and angle, and decides how much time the writers get (src/93-segments.js, src/97-time.js)
    var bk=segBooked(S,show,n);rep.open={k:'match'};
    if(S.plan)st.steps.push({t:'plan'});
    for(i=0;i<n;i++){(bk.at[i]||[]).forEach(function(x){st.steps.push({t:'seg',i:i,slot:x.slot,sg:JSON.parse(JSON.stringify(x.sg))});});st.steps.push({t:'match',i:i});}
  }else{for(i=0;i<n;i++)st.steps.push({t:'match',i:i});st.pool=pool;}
  return st;
}
/** Run the next step of a show. Returns the segment it made (a match, a promo or an angle), or null if it made none. */
function showStep(S,P,show,card,st){
  var step=st.steps[st.k++],rep=st.rep,n=card.length,seg;if(!step||step.cut)return null;   // a segment cut for time on the night does not air
  if(step.t==='match'){seg=doMatch(S,P,show,card[step.i],step.i,n,rep,st.used);rep.segs.push(seg);return seg;}
  var pool=showPool(S,P,show),inP={};pool.forEach(function(w){inP[w.id]=1;});
  var ctx={pool:pool,inP:inP,angled:st.angled,left:{},extra:[]};
  if(step.t==='plan'){var pp=planPromo(S,P,show,ctx);if(pp){pp.mins=PLAN_MINS;rep.open={k:'promo',ids:Object.keys(ctx.angled).map(Number),ov:pp.ov,feud:pp.feud};rep.segs.push(pp);}return pp;}
  for(var q=step.i;q<n;q++)flat(card[q].sides).forEach(function(id){ctx.left[id]=1;});
  var ng=Object.keys(ctx.angled).length,first=!rep.segs.length,wr=step.sg.k==='writers',ba=wr?genAngle(S,P,show,ctx):runSeg(S,P,show,ctx,step.sg,step.slot,first);
  if(!ba)return null;
  ba.mins=segMins(step.sg);if(wr)ba.wr=1;
  if(first)rep.open={k:wr?'angle':(step.sg.k==='recap'?'recap':SEGK[step.sg.k].t),ids:Object.keys(ctx.angled).slice(ng).map(Number),ov:ba.ov,feud:ba.feud};
  rep.en=Math.min(100,(rep.en==null?100:rep.en)+14);ANGDONE.forEach(function(fn){fn(S,P,ba,Object.keys(ctx.angled).slice(ng));});
  var o={p:P.ann[0].split(' ')[0],c:P.ann[1].split(' ')[0]};ba.bc=[{t:'note',x:ba.text},{t:'col',x:fill(sayPick(S,REACT[ba.head]||['Well, how about that.']),o)}];rep.segs.push(ba);
  return ba;
}
function runShow(S,P,show,card){var st=showStart(S,P,show,card);while(st.k<st.steps.length)showStep(S,P,show,card,st);return showEnd(S,P,show,card,st);}
/** Score the night, sell it, and file the report. */
function showEnd(S,P,show,card,st){
  var isPl=P.id===S.player&&!S.cal,big=!!show.big,rep=st.rep,key=big?'big':show.id,k,pool=st.pool||showPool(S,P,show),inP={},ctx={angled:st.angled};pool.forEach(function(w){inP[w.id]=1;});
  if(!isPl){var top=pool.slice().sort(function(a,b){return (b.mic+b.ovr)-(a.mic+a.ovr);});
    for(k=0;k<(big?2:P.angles)&&k<top.length;k++)rep.segs.push({k:'angle',ai:true,ov:clamp(Math.round(0.62*top[k].mic+0.38*top[k].ovr+rnd(S)*8-4),5,99)});}
  // rating: the main event counts triple; production values lift the whole show
  var ms=rep.segs.filter(function(s){return s.k==='match';}),num=0,den=0;
  ms.forEach(function(s,ix){var w=ix===ms.length-1?3:(ix===ms.length-2?2:(ix===0?1.5:1));num+=s.ov*w;den+=w;});
  // a promo or an angle counts by how long it ran
  rep.segs.forEach(function(s){if(s.k==='angle'){var aw=s.mins?(s.mins<=5?0.45:(s.mins>=15?0.95:0.7)):0.7;num+=s.ov*aw;den+=aw;}});
  var tm=isPl?showTimes(S,P,show,rep,card):0;
  rep.rating=clamp(r1((den?num/den:30)+tm+(P.prodLvl-P.prod0)*0.6*(modelOf(P).prodX==null?1:modelOf(P).prodX)+(isPl&&S.rateMod?S.rateMod:0)),5,99);rep.mainOv=ms.length?ms[ms.length-1].ov:0;
  if(isPl)S.rateMod=0;
  if(S.cal)return rep;
  var exp=expected(P,show);
  if(isPl&&rep.venue){var bar=barCity(S,rep.venue);if(bar){exp+=bar.d;rep.barNote=bar.note;}}
  var qf=clamp(1+(P.trend||0)/60,0.85,1.15)*(SLOT_V[P.slot]/SLOT_V[P.slot0])*(1+0.03*(P.prodLvl-P.prod0))*airPF(P,show);
  rep.exp=r1(exp);rep.cs=crowdScore(rep.rating,rep.exp);
  var mx=mixOf(P);
  rep.viewers=Math.round(viewersK(P,show,qf)*1000);rep.gate=Math.round(rep.att*ticket(P,show)*TIX_P[P.tix]*mx.gate);rep.tv=Math.round(rep.viewers/1000*P.tvRate*mx.tv*airRate(P,show));
  rep.buys=big?Math.round(buysK(P,show,rep.hype)*1000):0;rep.ppv=Math.round(rep.buys*22*mx.ppv);
  P.led.tv+=rep.tv;P.led.gate+=rep.gate;P.led.ppv+=rep.ppv;P.led.prod+=P.prod*(big?4:1)*PRODF[P.prodLvl]/PRODF[P.prod0]*airProd(P,show);
  var before=P.image;
  P.image=clamp(P.image+(rep.rating-exp)*(big?0.08:0.03*showMult(show)*airReach(P,show)),5,modelOf(P).cap||100);rep.dImage=r1(P.image-before);
  P.trend=(P.trend||0)*0.6+(rep.rating-exp)*0.4;P.mainB[key]=(P.mainB[key]||rep.mainOv)*0.9+rep.mainOv*0.1;
  P.last={name:show.name,rating:rep.rating,cs:rep.cs,week:S.week};
  // the crowd gets used to about half of whatever you keep giving it, good or bad
  if(isPl){var raw=rep.rating-(exp-(P.expA||0)-(P.expB||0));P.expA=clamp((P.expA||0)+(0.5*raw-(P.expA||0))*0.16/(P.shows.length+1),-4,8);}
  if(isPl){
    S.stats.shows++;if(rep.rating>S.stats.bestShow)S.stats.bestShow=rep.rating;if(rep.cs>(S.stats.bestCS||0))S.stats.bestCS=rep.cs;
    S.stats.run=rep.rating>exp?S.stats.run+1:0;
    award(S,'ACH_FIRST_BELL');if(rep.cs>=80)award(S,'ACH_SHOW_80');if(rep.cs>=90)award(S,'ACH_SHOW_90');if(rep.rating<40)award(S,'ACH_BOMB');
    if(rep.sellout)award(S,'ACH_SELLOUT');if(S.stats.run>=5)award(S,'ACH_RUN_5');
    rep.quest=rep.quest||[];
    S.quests.slice().forEach(function(q){
      if(q.type==='sponsor'&&big){if((cgFix(S),gradeMeets(rep.cs,q.target))){P.led.bonus+=q.bonus;rep.quest.push('Sponsor target hit: +$'+q.bonus.toLocaleString('en-US')+'.');award(S,'ACH_QUEST');}else rep.quest.push('Sponsor target missed ('+gradeA(q.target)+' show was needed).');dropQuest(S,q);}
      if(q.type==='network'&&q.show===show.id){if(q.hit){P.led.bonus+=q.bonus;rep.quest.push('Network target hit: +$'+q.bonus.toLocaleString('en-US')+'.');award(S,'ACH_QUEST');}else rep.quest.push('Network target missed (a '+starG(q.target)+' main event was needed).');dropQuest(S,q);}
    });
    rep.sheet=dirtSheet(S,P,show,rep,inP);
    S.reports.unshift(rep);if(S.reports.length>8)S.reports.length=8;
  }else if(big){var mm=ms[ms.length-1];news(S,'world',show.name+' was graded '+gradeG(repCS(rep))+'. Main event: '+mm.label+(mm.win?' ('+mm.win+' won).':' (draw).'));}
  if(isPl)Object.keys(ctx.angled).forEach(function(id){if(S.w[id])S.w[id].la=S.week;});
  SHOWX.forEach(function(fn){fn(S,P,show,rep,card);});
  return rep;
}
function dropQuest(S,q){S.quests=S.quests.filter(function(x){return x!==q;});}
function matchQuests(S,P,show,m,sides,win,t,OV,isMain,seg){
  var ids=flat(m.sides);
  S.quests.slice().forEach(function(q){
    if(q.type==='shot'&&t&&t.id===q.title&&ids.indexOf(q.w)>=0){S.w[q.w].morale=clamp(S.w[q.w].morale+6,0,100);seg.notes.push('Promise kept: '+S.w[q.w].name+' got the title shot.');award(S,'ACH_PROMISE');keptPromise(S,q,true);dropQuest(S,q);}
    else if(q.type==='win'&&win>=0&&m.sides[win].indexOf(q.w)>=0){S.w[q.w].morale=clamp(S.w[q.w].morale+6,0,100);seg.notes.push('Promise kept: '+S.w[q.w].name+' got the win.');award(S,'ACH_PROMISE');keptPromise(S,q,true);dropQuest(S,q);}
    else if(q.type==='network'&&isMain&&q.show===show.id){q.hit=starMeets(OV,q.target);}
    else if(q.type==='dream'&&show.big&&ids.indexOf(q.a)>=0&&ids.indexOf(q.b)>=0){P.led.bonus+=q.bonus;P.image=clamp(P.image+0.6,5,100);seg.notes.push('The dream match delivered: +$'+q.bonus.toLocaleString('en-US')+' in extra buys.');award(S,'ACH_QUEST');dropQuest(S,q);}
  });
}
function keptPromise(S,q,kept){
  S.ledger=S.ledger||[];S.ledger.unshift({w:S.week,k:kept,t:q.text.replace(/^Promise: /,'')});if(S.ledger.length>16)S.ledger.length=16;
  S.trust=clamp((S.trust==null?60:S.trust)+(kept?3:-8),0,100);
  var pw=q.w!=null?S.w[q.w]:null;if(pw){if(kept){pw.pk2=(pw.pk2||0)+1;stressAdd(S,pw,-10);}else{pw.pb2=(pw.pb2||0)+1;stressAdd(S,pw,15);}}
}
