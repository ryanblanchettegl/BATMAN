/* ---------- Calls in the ring ----------
   Three more calls from the gorilla position (src/31-live.js runs them), each caused by what is true of the match:

   Somebody is hurt. A worn body in a demanding match goes down wrong. It is the same decision as the old headset's
   bad landing (stop it, go straight to the finish, or have the other one carry it), but it does not come from
   nowhere: the road agent's comments before the show pointed at it.

   The crowd has gone quiet. The match before fell flat, and the one in the ring is going the same way.
   Stay with the plan, take it to the floor, have the villain cheat, or call the upset.

   They are not going home. Two people who work well together, a hot feud or somebody with creative control are
   going long. Take it home on time, or give them the time and decide who pays for it. */
var BOTCH_CD=4,AUD_CD=2,OT_CD=3,AUD_CR=58,ZONE_WORD={n:'neck',s:'shoulder',b:'back',k:'knee'};
function ringOk(M){return !!M&&M.c.sides.length===2&&M.m.mt!=='br'&&!M.m.nc&&!M.m.ff;}
function lcdOk(S,k,n){var cd=S.lcd&&S.lcd[k];return cd==null||S.week-cd>=n;}
function lcdSet(S,k){(S.lcd=S.lcd||{})[k]=S.week;}

/** Who in this match is most likely to go down wrong, and why. Something about the body, and at least one more reason. */
function botchRead(S,M){
  var show=S.queue[S.qi],mins=bellMins(show,M.m,M.main),stip=M.m.stip||'std',best=null;
  flat(M.c.sides).forEach(function(w){
    if(!lcdOk(S,'bt'+w.id,BOTCH_CD))return;
    var body=[],load=[],z=zonesOf(w),hz='b',hv=0;['n','s','b','k'].forEach(function(k){if(z[k]>hv){hv=z[k];hz=k;}});
    if(w.cond<45)body.push(w.name+' is worn down');
    if(hv>=70)body.push(w.name+' is carrying a bad '+ZONE_WORD[hz]);
    if((w.rd||0)>=70)body.push(w.name+' has been on the road too long');
    if(w.hurt===S.week)body.push(w.name+' was already hurt this week');
    if(M.m.int==='brutal')load.push('Brutal intensity');
    if(STIP[stip]&&STIP[stip].inj>=1.5)load.push('A '+STIP[stip].n.toLowerCase()+' match');
    if(mins>gasLimit(w)+3)load.push(mins+' minutes is a long match for '+w.name);
    var n=body.length+load.length;
    if(body.length&&n>=2&&(!best||n>best.n))best={w:w,why:body.concat(load),n:n};
  });
  return best;
}
LIVEK.botch={n:'Somebody is hurt',
  pre:function(S,L,step){
    if(step.t!=='match')return null;var M=liveMatch(S,L,step.i),ch=S.chs;
    if(!M||M.m.mt==='br'||M.m.nc||(ch&&ch.key===L.key&&!ch.done))return null;   // trouble already on its way tonight has the headset
    var b=botchRead(S,M);if(!b)return null;
    var w=b.w,o=flat(M.c.sides).filter(function(q){return q.id!==w.id;}).sort(function(x,y){return workRate(y)-workRate(x);})[0],bd=bondOf(S,w.id,o.id);
    lcdSet(S,'bt'+w.id);
    return {phase:'mid',mi:step.i,who:w.id,other:o.id,
      text:w.name+' goes down wrong and does not get up. The referee looks over at the truck.',why:b.why,safe:0,
      choices:[{n:'Stop the match',says:'No finish, and the crowd gets nothing. '+w.name+' is looked after, and will remember you made the safe call.'},
        {n:'Go straight to the finish',says:'The match is cut short. '+w.name+' finishes it hurt and may be hurt worse, and will hold it against you.'},
        {n:'Have '+o.name+' carry it and hide the damage',says:'An attempt. If it works, nobody in the building knows. If it does not, the match falls apart and '+w.name+' takes more punishment.'}],
      checks:{2:mkCheck(8,[{n:o.name+'’s work rate '+workRate(o),v:workRate(o)>=85?2:(workRate(o)>=72?1:(workRate(o)<55?-1:0))},{n:bd>=REL_ON?'They trust each other':'They do not get on',v:bd>=REL_ON?1:(bd<=-REL_ON?-1:0)}])}};
  },
  run:function(S,L,ev,c){
    S.chs={type:'ko',w:ev.who,o:ev.other,text:ev.text,choices:ev.choices.map(function(x){return x.n;}),checks:ev.checks,key:L.key,mi:ev.mi,done:false,result:null,roll:null};
    return LIVEK.chaos.run(S,L,ev,c);
  }
};

LIVEK.audible={n:'The crowd has gone quiet',
  pre:function(S,L,step){
    if(step.t!=='match'||step.i<1||!lcdOk(S,'aud',AUD_CD))return null;var M=liveMatch(S,L,step.i);if(!ringOk(M)||M.m.how||M.m.runin)return null;
    var P=S.promos[S.player],show=S.queue[S.qi],segs=L.st.rep.segs,prev=null,q;for(q=segs.length-1;q>=0&&!prev;q--)if(segs[q].k==='match')prev=segs[q];
    if(!prev||!(prev.cr<AUD_CR||prev.ov<=expected(P,show)-8))return null;   // the cause is what the building just sat through
    var a=M.c.sides[0],b=M.c.sides[1],f=M.c.feud,why=[prev.cr<AUD_CR?'The crowd sat on its hands through the last match':'The last match fell well short of what this crowd expects ('+starG(prev.ov)+')'];
    if(a[0].align===b[0].align&&!f)why.push('It is '+(a[0].align==='F'?'hero against hero':'villain against villain')+', and nobody knows who to cheer');
    if(f&&f.matches>=3&&f.heat<30)why.push('They have seen this match before and the feud has gone cold');
    var od=E.matchOdds(S,M.m,step.i,M.n);if(!od)return null;
    var ch=[{n:'Stay with the plan',says:'The match plays out as it was laid out. A quiet crowd stays quiet.'}];
    if(M.m.int!=='brutal')ch.push({n:'Take it to the floor',k:'floor',says:'A fight through the seats wakes the building up. It is rougher to watch and harder on their bodies.'});
    if(a[0].align!==b[0].align){var hs=a[0].align==='H'?0:1;ch.push({n:names(M.c.sides[hs])+' cheat'+(M.c.sides[hs].length>1?'':'s')+' to win',k:'cheat',side:hs,bp:1,says:'The crowd comes alive to boo it. '+names(M.c.sides[1-hs])+' '+(M.c.sides[1-hs].length>1?'are':'is')+' protected, and '+(f?'the feud gets hotter.':'a feud starts tonight.')});}
    var us=od.p[0]<od.p[1]?0:1;
    if(Math.abs(od.p[0]-od.p[1])>=0.15&&M.m.call!==us)ch.push({n:'Call the upset: '+names(M.c.sides[us])+' win'+(M.c.sides[us].length>1?'':'s'),k:'upset',side:us,bp:2,says:'Nobody sees it coming, and the building wakes up. '+names(M.c.sides[1-us])+' will remember losing a match on a whim.'});
    if(ch.length<2)return null;
    lcdSet(S,'aud');
    return {phase:'mid',mi:step.i,who:a[0].id,other:b[0].id,text:'The building has gone quiet, and the finish as it is laid out will die in front of them. The referee is waiting for a word.',why:why,safe:0,choices:ch};
  },
  run:function(S,L,ev,c){
    var M=liveMatch(S,L,ev.mi),P=S.promos[S.player],pick=ev.choices[c];if(!M||!pick||!pick.k)return 'The plan stands. The crowd sits on its hands.';
    var all=flat(M.c.sides),f=M.c.feud;
    if(pick.k==='floor'){
      M.m.int='brutal';livePut(M.m,{cr:4,mq:-2,x:'They fought through the seats and woke the building up'});
      all.forEach(function(w){stressAdd(S,w,4);});
      return 'The referee waves them out of the ring. They are in the third row before the count reaches four.';
    }
    var win=M.c.sides[pick.side],lose=M.c.sides[1-pick.side];
    if(pick.k==='cheat'){
      M.m.call=pick.side;M.m.ff='cheap';livePut(M.m,{cr:4,x:'The crowd came alive to boo the finish'});
      if(f)heatUp(S,f,6,names(win)+' stole one from '+names(lose));else if(win[0].g===lose[0].g)startFeud(S,P,lose[0],win[0],30,names(win)+' stole one from '+names(lose));
      lose.forEach(function(w){youRemember(S,w,'protected','You kept them strong when the finish was changed on the night.',3);});
      return 'The word goes out. '+names(win)+' will take a shortcut, and the building will hate it.';
    }
    M.m.call=pick.side;livePut(M.m,{cr:7,x:'Nobody saw the finish coming'});
    lose.forEach(function(w){youRemember(S,w,'audible','You beat them on a whim to wake up a crowd.',-10);relBump(S,w.id,win[0].id,{ja:10},{k:'passed',t:w.name+' lost to '+win[0].name+' because the finish was changed on the night.'});});
    win.forEach(function(w){youRemember(S,w,'chance','You changed the finish on the night and gave them the win.',8);});
    return 'The finish is changed. '+names(win)+' '+(win.length>1?'are':'is')+' going over, and nobody in the building knows it yet.';
  }
};

function lenUp(m){m.len=m.len==='S'?'M':'L';}
function lenDown(m){m.len=m.len==='L'?'M':'S';}
LIVEK.overtime={n:'They are not going home',
  pre:function(S,L,step){
    if(step.t!=='match'||!lcdOk(S,'ot',OT_CD))return null;var M=liveMatch(S,L,step.i);
    if(!ringOk(M)||(M.m.mt!=='1v1'&&M.m.mt!=='tag')||M.m.len==='L'||M.m.stip==='iron')return null;
    var show=S.queue[S.qi],st=L.st,ws=flat(M.c.sides),a=M.c.sides[0][0],b=M.c.sides[1][0],wr=avg(ws.map(workRate)),f=M.c.feud,why=[];
    if(wr>=76&&relChem(S,a.id,b.id)>=1)why.push(a.name+' and '+b.name+' work well together, and they know it');
    var cc=ws.filter(function(w){return w.cc;})[0];if(cc)why.push(cc.name+' has creative control and is using it');
    if(f&&f.heat>=60&&wr>=72)why.push('The feud is hot and the crowd is with them');
    if(!why.length)return null;
    var ch=[{n:'Tell the referee to take it home',says:'The match ends in its time. Nothing is lost, and nothing is gained.'}],q,mi=L.card.length-1;
    for(q=st.k+1;q<st.steps.length;q++)if(st.steps[q].t==='seg'&&!st.steps[q].cut){
      var sg=st.steps[q].sg,who=(sg.who||[]).map(function(id){return S.w[id];}).filter(Boolean),lab=who.length?segLabel(S,sg):'the writers’ segment';
      ch.push({n:'Give them five more minutes. Cut '+lab,k:'seg',q:q,says:'The match gets longer, and a good one gets better. '+(who.length?names(who)+' will not thank you for losing their time on the show.':'The writers lose their time on the show.')});break;
    }
    if(step.i!==mi&&L.card[mi].len!=='S'&&L.card[mi].stip!=='iron')ch.push({n:'Give them five more minutes. Take it out of the main event',k:'main',says:'The match gets longer. The main event gets shorter, and '+names(flat(L.card[mi].sides).map(function(id){return S.w[id];}))+' will know whose time it was.'});
    if(step.i===mi&&!show.big)ch.push({n:'Let them go. Run over the slot',k:'over',says:'The match gets longer. The network watches the clock, and its patience wears a little thinner.'});
    if(ch.length<2)return null;
    lcdSet(S,'ot');
    return {phase:'mid',mi:step.i,who:a.id,other:b.id,text:'They are past their time and not looking at the referee. The truck wants to know if you are taking it home.',why:why,safe:0,choices:ch};
  },
  run:function(S,L,ev,c){
    var M=liveMatch(S,L,ev.mi),pick=ev.choices[c],st=L.st,show=S.queue[S.qi];if(!M||!pick||!pick.k)return 'The referee gets the word, and they go home on time.';
    var before=matchSlot(show,M.m,M.main);lenUp(M.m);var more=matchSlot(show,M.m,M.main)-before;
    livePut(M.m,{cr:2,x:'They were given time and used it'});
    flat(M.c.sides).forEach(function(w){youRemember(S,w,'time','You gave them more time when the match was working.',5);});
    if(pick.k==='seg'){
      var sp=st.steps[pick.q];if(sp&&sp.t==='seg'){sp.cut=1;(sp.sg.who||[]).forEach(function(id){if(S.w[id])youRemember(S,S.w[id],'bumped','You cut their segment from the show for time.',-6);});
        var back=segMins(sp.sg)-more;if(back>0)st.rep.slack=(st.rep.slack||0)+back;}
      return 'They get their time. The segment that was coming up will not air tonight.';
    }
    if(pick.k==='main'){
      var mm=L.card[L.card.length-1];lenDown(mm);
      flat(mm.sides).forEach(function(id){if(S.w[id])youRemember(S,S.w[id],'shorted','You gave their main event time to another match.',-5);});
      return 'They get their time. The main event will have to be shorter.';
    }
    E.clocks(S);S.clocks.net.v=clamp(S.clocks.net.v+1,0,CLOCKS.net.segs);S.clocks.net.why='The show ran over its slot';
    return 'They get their time, and the show runs over. Somebody at the network is looking at a clock.';
  }
};
LIVE_ORDER=['chaos','botch','titlecall','owner','sponsor','network','overtime','audible','runin','hotmic'];
