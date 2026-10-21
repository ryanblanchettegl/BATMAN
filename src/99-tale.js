/* Storylines on the card (Ryan, 21 October: a new core feature). docs/plans/arcs-on-the-card.md is the plan.
   A match with two people in a storyline together is a storyline match: the run sheet shows it in red, so the booker
   sees at once which matches tell a story. Two people are in a storyline together when they are on the same running
   feud (either side of it) or both in the arc that is running. Nothing here calls rnd(S). */
/** The storyline a match tells, or null: {k: 'feud' | 'arc', n: its name, ids: the two (or more) in it}. */
function storyOfMatch(S,m){
  if(!m||!m.sides)return null;
  var ids=flat(m.sides).filter(function(x){return x!=null&&S.w[x];}),i,j,f;
  for(i=0;i<ids.length;i++)for(j=i+1;j<ids.length;j++){
    f=feudsFor(S,ids[i]).filter(function(x){return x.a.concat(x.b).indexOf(ids[j])>=0;})[0];
    if(f)return {k:'feud',n:feudLabel(S,f),ids:[ids[i],ids[j]],feud:f.id};
  }
  var A=S.sa;if(A&&!A.done){var cast=Object.keys(A.cast).map(function(r){return A.cast[r];}),inA=ids.filter(function(x){return cast.indexOf(x)>=0;});
    if(inA.length>=2)return {k:'arc',n:taleName(A),ids:inA};}
  return null;
}
E.storyOfMatch=function(S,m){return storyOfMatch(S,m);};
/** For the run sheet: the storyline of every match on the card, by place (null where it tells none). */
E.cardStories=function(S,card){return (card||S.card||[]).map(function(m){return storyOfMatch(S,m);});};

/* ---------- arcs: stories the writers put on the show ----------
   An arc is a story told in chapters. Each chapter is a segment the writers put on the run sheet themselves (sg.k
   'arc', sg.forced): the booker cannot take it off, and does not book it. The booker's job there is to decide where the
   story goes: every chapter asks one question, and each answer leads to a different chapter (TALES[k].nodes, `next`).
   The answer is kept on the arc (S.sa.ch), so suggesting or clearing the card never loses it; a chapter that airs with
   no answer goes the way the writers would have taken it (the option marked `safe`, else the first). A chapter can wait
   for a big event (`at: 'big'`) and can come after the main event (`post`). It plays a storyline beat's scene (rule 9c:
   `beat` on the chapter or the answer). An answer moves the people in it through relBump() and youRemember(), and can
   start a feud, turn somebody, form or break a team, and lock a match onto a later show (a lock, below).
   S.sa = {k, cast: {role: id}, node, ch, heat, due, hist: [{node, ch, w}], start}. One runs at a time. A new arc is one
   more entry in TALES with a cast() and its chapters. */
SEGK.arc={len:'M',fix:1,arc:1,n:'Arc',t:'angle',roles:[],d:'A chapter of a story the writers are telling. They put it on the show; you decide where the story goes.'};
function taleFree(S,P,w){return !!w&&w.promo===P.id&&!w.nw&&!(w.inj>0)&&!(w.away>=S.week)&&!w.camp;}
/** Who was at the centre of the last two arcs: a new arc finds somebody else. */
function taleRecent(S){var o={};(S.sas||[]).slice(-2).forEach(function(a){(a.cast||[]).forEach(function(id){o[id]=1;});});return o;}
function taleBond(S,a,b){return typeof bondOf==='function'?bondOf(S,a,b):0;}
var TALES={
  betrayal:{n:'The betrayal',d:'Two partners. One of them is going to turn on the other, and the crowd will pick a side.',
    cast:function(S){
      var P=S.promos[S.player],was=taleRecent(S),ok=function(w){return taleFree(S,P,w)&&!was[w.id];},a=null,b=null;
      var tm=S.teams.filter(function(t){return t.promo===P.id&&t.m.length===2&&t.m.every(function(id){return ok(S.w[id]);});}).sort(function(x,y){return (y.exp||0)-(x.exp||0);})[0];
      if(tm){a=S.w[tm.m[0]];b=S.w[tm.m[1]];}
      else{var R=rosterOf(S,P.id).filter(ok).sort(function(x,y){return y.ovr-x.ovr;}).slice(0,14),best=-1e9,i,j,v;
        for(i=0;i<R.length;i++)for(j=i+1;j<R.length;j++){if(R[i].g!==R[j].g||R[i].align!==R[j].align)continue;v=taleBond(S,R[i].id,R[j].id)*2+(R[i].ovr+R[j].ovr)/10;if(v>best){best=v;a=R[i];b=R[j];}}}
      if(!a||!b)return null;
      var c=rosterOf(S,P.id).filter(function(w){return ok(w)&&w.id!==a.id&&w.id!==b.id&&w.align==='H';}).sort(function(x,y){return (y.g===a.g)-(x.g===a.g)||y.ovr-x.ovr;})[0];
      if(!c)return null;
      return {a:a.id,b:b.id,c:c.id};},
    start:'cracks',
    nodes:{
      cracks:{n:'Cracks',beat:'feud_words',who:['a','b'],t:'{a} and {b} lost a match they should have won. Tonight, in the ring, it boils over between them.',q:'Who takes the blame?',o:[
        {n:'{a} blames {b}',d:'{a} says {b} cost them. {b} takes it quietly, and the crowd starts to feel for them.',next:'turn',set:{T:'a',H:'b'},bond:[['a','b',-15]],s:6},
        {n:'{b} blames {a}',d:'{b} snaps at {a} in front of everybody. {a} looks hurt.',next:'turn',set:{T:'b',H:'a'},bond:[['a','b',-15]],s:6},
        {n:'They shake it off',d:'A hug, a laugh, and the crowd breathes again. For now.',next:'mended',bond:[['a','b',8]],s:2,safe:1}]},
      mended:{n:'An offer',beat:'feud_stare',who:['c','a','b'],t:'{a} and {b} look fine again. Then {c} comes out with an offer for one of them: leave the team and be somebody on your own.',q:'Who listens to {c}?',o:[
        {n:'{a} listens',d:'{a} does not say no. {b} sees it.',next:'turn',set:{T:'a',H:'b'},bond:[['a','c',10],['a','b',-10]],s:5},
        {n:'{b} listens',d:'{b} hesitates a second too long.',next:'turn',set:{T:'b',H:'a'},bond:[['b','c',10],['a','b',-10]],s:5},
        {n:'Neither: they run {c} off',d:'The team stands together. {c} has two enemies now, and the crowd loves it.',next:'united',feud:['a','c',30],bond:[['a','b',10]],s:4,safe:1}]},
      turn:{n:'The turn',beat:'feud_betray',who:['T','H'],t:'The night it happens. {T} turns on {H}.',q:'How does {T} do it?',o:[
        {n:'A chair to the back after a win',d:'Ugly and loud. The crowd will not forgive {T} for a long time.',turn:'T',feud:['T','H',45],split:1,hurtH:1,bond:[['T','H',-35]],s:9,beat:'feud_betray'},
        {n:'Walks out on {H} mid-match',d:'{T} leaves {H} alone, two against one. Colder, and it stings.',turn:'T',feud:['T','H',35],split:1,bond:[['T','H',-25]],s:6,safe:1},
        {n:'Reveals a deal with {c}',d:'{T} was working with {c} all along. A twist the crowd did not see coming.',turn:'T',feud:['T','H',40],split:1,bond:[['T','H',-30],['T','c',25]],s:8,beat:'feud_swerve'}],nextAll:'fallout'},
      united:{n:'Two against one',beat:'feud_brawl',who:['a','b','c'],t:'{c} wants revenge on {a} and {b}, the team that ran them off, and has brought trouble.',q:'How do {a} and {b} answer?',o:[
        {n:'They take {c} apart',d:'The team looks better than ever. A title shot looks closer.',next:'payoff_team',heat:8,s:5,safe:1},
        {n:'{a} takes a beating for {b}',d:'{a} is left lying. {b} owes them now, and the crowd knows it.',next:'payoff_team',hurt:'a',bond:[['a','b',12]],s:6},
        {n:'{b} is too slow to help',d:'{a} is left alone. Doubt creeps in.',next:'turn',set:{T:'b',H:'a'},bond:[['a','b',-15]],s:6}]},
      fallout:{n:'The answer',beat:'feud_words',who:['H','T'],t:'{H} comes to the ring to answer what {T} did.',q:'What does {H} want?',o:[
        {n:'A match at the next big event',d:'It is made: {H} against {T}, locked on the card for the next big event.',next:'payoff',lock:{sides:[['H'],['T']],big:1},heat:6,s:6,safe:1,beat:'feud_made'},
        {n:'A fight, right now',d:'They brawl all over the building. Security needs ten people.',next:'payoff',heat:12,s:7,beat:'feud_brawl'},
        {n:'Nothing: {H} walks away',d:'The crowd is left wanting more. It can go cold.',next:'payoff',heat:-6,s:-4}]},
      payoff:{n:'The last word',beat:'payoff',who:['H','T'],at:'big',post:1,t:'After the main event, {H} and {T} meet in the ring one last time. Everybody stayed in their seats for this.',q:'How does it end?',end:1,o:[
        {n:'{H} gets the last word',d:'{H} stands tall over {T}. Closure, and the crowd goes home happy.',res:'paid off',push:'H',endFeud:1,s:8,safe:1},
        {n:'{T} lays {H} out again',d:'The villain wins the night. It is not over, and the crowd wants more.',res:'goes on',push:'T',heat:10,s:5},
        {n:'They shake hands',d:'Partners again, after all of it. A reunion they will be talking about all week.',res:'ended in a reunion',reunite:1,endFeud:1,bond:[['T','H',40]],s:6}]},
      payoff_team:{n:'Standing tall',beat:'payoff',who:['a','b','c'],at:'big',post:1,t:'After the main event, {a} and {b} come out for {c}, one last time.',q:'How does it end?',end:1,o:[
        {n:'The team stands tall',d:'{a} and {b} send {c} home. The tag titles are next.',res:'paid off',push:'a',endFeud:1,bond:[['a','b',15]],s:7,safe:1},
        {n:'{c} gets the last laugh',d:'{c} escapes with a cheap shot. There is more to this.',res:'goes on',push:'c',heat:8,s:4},
        {n:'{c} joins them',d:'A handshake nobody expected. Three now, and a group is born.',res:'ended with a new group',endFeud:1,bond:[['a','c',20],['b','c',20]],s:5}]}
    }}
};
E.TALES=TALES;
function taleRole(A,r){return A.cast[r];}
function taleFill(S,A,t){return String(t).replace(/\{(\w+)\}/g,function(_,k){var id=A.cast[k];return id!=null&&S.w[id]?S.w[id].name:k;});}
function taleName(A){var K=TALES[A.k];return K?K.n:'The arc';}
function taleNode(A){var K=TALES[A&&A.k];return K&&K.nodes[A.node]||null;}
/** Begin an arc: at its start, or (the tutorial) at a chapter, with what came before it already written. */
function taleStart(S,k,o){
  o=o||{};var K=TALES[k];if(!K)return null;var cs=o.cast||K.cast(S);if(!cs)return null;
  S.sa={k:k,cast:cs,node:o.node||K.start,ch:null,heat:o.heat==null?30:o.heat,due:o.due==null?S.week:o.due,hist:(o.hist||[]).slice(),start:S.week};
  if(o.set)Object.keys(o.set).forEach(function(r){S.sa.cast[r]=cs[o.set[r]];});
  if(!o.quiet){news(S,'story','The writers begin a new story: '+K.n.toLowerCase()+'.');note(S,'A new arc',K.n+'. The writers will put its chapters on your shows. You decide where it goes.','good');}
  return S.sa;
}
E.taleStart=function(S,k,o){return taleStart(S,k,o);};
/** The chapter the writers want on this show, as a segment, or null. Reads only. */
function taleWant(S){
  var A=S.sa,show=S.queue&&S.queue[S.qi],P=S.promos[S.player];if(!A||A.done||!show||S.week<A.due)return null;
  var N=taleNode(A);if(!N)return null;
  if(N.at==='big'&&!show.big)return null;
  if(A.aired===showKey(S))return null;
  var who=N.who.map(function(r){return A.cast[r];});
  if(who.some(function(id){return id==null||!taleFree(S,P,S.w[id]);}))return null;   // somebody is not here: the chapter waits
  return {k:'arc',who:who,pos:1,len:'M',forced:1,node:A.node,post:N.post?1:0};
}
SEGNEW.push(function(S,L){var sg=taleWant(S);if(sg&&!L.some(function(x){return x&&x.k==='arc';}))L.push(sg);});
/* what the segment rules say about an arc chapter */
(function(){
  var why0=segWhy,look0=segLook,lab0=segLabel,run0=runSeg,ch0=segChoices;
  segWhy=function(S,sg,slot){return sg&&sg.k==='arc'?'':why0(S,sg,slot);};
  segChoices=function(S,kind,who,slot){return kind==='arc'?[]:ch0(S,kind,who,slot);};
  segLook=function(S,sg,slot){if(!sg||sg.k!=='arc')return look0(S,sg,slot);var A=S.sa,N=A&&taleNode(A);
    return {ok:true,mid:null,lo:null,hi:null,notes:[[0,N?taleFill(S,A,N.q):'The writers decide']],mins:segMins(sg),read:{k:'',t:N?taleFill(S,A,N.t):''}};};
  segLabel=function(S,sg){if(!sg||sg.k!=='arc')return lab0(S,sg);var A=S.sa,N=A&&taleNode(A);return A?taleName(A)+': '+(N?N.n:''):'Arc';};
  runSeg=function(S,P,show,ctx,sg,slot,opens){return sg&&sg.k==='arc'?taleRun(S,P,show,ctx,sg):run0(S,P,show,ctx,sg,slot,opens);};
})();
/** The answer the booker gave for this chapter, or the writers' own. */
function taleChoice(N,ch){if(ch!=null&&N.o[ch])return ch;for(var i=0;i<N.o.length;i++)if(N.o[i].safe)return i;return 0;}
/** A chapter on the air: the scene, what the answer does to the people in it, and where the story goes next. */
function taleRun(S,P,show,ctx,sg){
  var A=S.sa;if(!A||A.done||A.node!==sg.node)return null;var K=TALES[A.k],N=taleNode(A);if(!N)return null;
  // they were here when the chapter went on the show (taleWant); hurt or sent home since, they are still in the building tonight. Only somebody who has left the company holds it back
  var who=N.who.map(function(r){return S.w[A.cast[r]];}),here=function(w){return !!w&&w.promo===P.id;};
  if(who.some(function(w){return !here(w);})){return angle(K.n,'The writers had a chapter of '+K.n.toLowerCase()+' ready, but '+who.filter(function(w){return !here(w);}).map(function(w){return w?w.name:'somebody';}).join(' and ')+' is not here. It waits.',40);}
  var byYou=A.ch!=null,ci=taleChoice(N,A.ch),o=N.o[ci];
  who.forEach(function(w){ctx.angled[w.id]=1;});
  // scored the way the other angles are (segLook): the people in it, on the microphone and in the ring, and how hooked the crowd is on the story
  var talk=who.reduce(function(s,w){return s+segMean(S,w,0);},0)/who.length,stand=0.8*who.reduce(function(s,w){return s+w.ovr;},0)/who.length+8;
  var ov=clamp(0.5*talk+0.5*stand+A.heat/8+(o.s||0)/2+2+(rnd(S)*6-3),5,99);
  var r=angle(K.n,taleFill(S,A,N.t)+' '+taleFill(S,A,o.d),ov);
  taleApply(S,P,A,o);
  A.heat=clamp(A.heat+6+(o.s||0)/2+(o.heat||0)/2+(ov-55)/8,0,100);
  A.hist.push({node:A.node,ch:ci,w:S.week,you:byYou?1:0,ov:Math.round(ov)});A.aired=showKey(S);
  r.beat=o.beat||N.beat;r.bids=N.who.map(function(rr){return A.cast[rr];});r.arc={k:A.k,node:A.node,ch:ci,you:byYou?1:0};r.ids=r.bids.slice();
  if(!byYou)note(S,'The writers decided',K.n+': '+taleFill(S,A,o.n)+'.','');
  var nx=o.next||N.nextAll;A.ch=null;
  if(N.end||!nx)taleEnd(S,P,A,o,show,r);else{A.node=nx;A.due=S.week+1;}
  return r;
}
function taleApply(S,P,A,o){
  var W=function(r){return S.w[A.cast[r]];},why=taleFill(S,A,o.n);
  if(o.set)Object.keys(o.set).forEach(function(r){A.cast[r]=A.cast[o.set[r]];});
  (o.bond||[]).forEach(function(b){var x=W(b[0]),y=W(b[1]);if(x&&y)relBump(S,x.id,y.id,{bond:b[2]},{k:'arc',t:why+'.',keep:Math.abs(b[2])>=25});});
  if(o.turn){var t=W(o.turn);if(t)turn(S,t,'the story called for it');}
  if(o.split){var a=W('a'),b=W('b'),tm=a&&teamOf(S,a);if(tm&&b&&tm.m.indexOf(b.id)>=0){dissolveTeam(S,tm);news(S,'story',a.name+' and '+b.name+' are a team no more.');}}
  if(o.reunite){var x=W('T'),y=W('H');if(x&&y){if(x.align!==y.align)turn(S,x,'came home to their partner');if(!teamOf(S,x)&&!teamOf(S,y))formTeam(S,P,x,y,30);}}
  if(o.feud){var f1=W(o.feud[0]),f2=W(o.feud[1]);if(f1&&f2){var f=startFeud(S,P,f2,f1,o.feud[2],why,{force:true});if(f)A.feud=f.id;}}
  if(o.heat){var ff=taleFeud(S,A);if(ff)heatUp(S,ff,o.heat,why);}
  if(o.hurt){var h=W(o.hurt);if(h)h.cond=clamp(h.cond-8,5,100);}
  if(o.hurtH){var hh=W('H');if(hh)hh.cond=clamp(hh.cond-10,5,100);}
  if(o.push){var pw=W(o.push);if(pw){pw.mom=clamp((pw.mom||0)+3,-10,10);addOvr(P,pw,0.5);}}
  if(o.lock){var sides=o.lock.sides.map(function(sd){return sd.map(function(r){return A.cast[r];});});lockAdd(S,{kind:'match',sides:sides,big:o.lock.big?1:0,why:taleName(A),arc:1});}
  if(o.endFeud){var fe=taleFeud(S,A);if(fe){fe.res=true;fe.end=S.week;fe.done=1;if((fe.peak||0)>=50&&typeof feudFile==='function')feudFile(S,fe,'end');}}
  var seen={};Object.keys(A.cast).forEach(function(r){var id=A.cast[r],w=S.w[id];if(!w||seen[id])return;seen[id]=1;youRemember(S,w,'arc',taleName(A)+': '+why+'.',o.s>=6?1:0);});
}
function taleFeud(S,A){var f=A.feud!=null?S.feuds.filter(function(x){return x.id===A.feud&&!x.res;})[0]:null;if(f)return f;var x=A.cast.T!=null?A.cast.T:A.cast.a,y=A.cast.H!=null?A.cast.H:A.cast.c;return x!=null&&y!=null?feudOf(S,x,y):null;}
/** The end of an arc: how it landed, by how much the crowd came to care (A.heat), and what the last answer was. */
function taleEnd(S,P,A,o,show,r){
  var K=TALES[A.k],res=o.res||'ended',land=A.heat>=65?'big':(A.heat>=40?'ok':'flat');
  // a few arcs a year: each pays a little (the year's company arc, src/99-arcs.js, is the big one). Popularity raises what every crowd expects, so it is paid sparingly
  var img=land==='big'?1:(land==='flat'?-1:0),bp=land==='big'?2:(land==='ok'?1:0);
  P.image=clamp(P.image+img,1,100);S.bp=(S.bp||0)+bp;if(S.owner&&!S.owner.me&&land!=='flat')S.owner.trust=clamp(S.owner.trust+(land==='big'?2:1),0,100);
  A.done=1;A.res=res;(S.sas||(S.sas=[])).push({k:A.k,n:K.n,res:res,land:land,y:cal(S.week).label,cast:Object.keys(A.cast).filter(function(x){return x==='T'||x==='H'||(!A.cast.T&&(x==='a'||x==='b'));}).map(function(x){return A.cast[x];})});
  S.sa=null;S.saNext=S.week+6;
  if(r)r.text+=' '+K.n+' '+res+(land==='big'?', and the crowd will remember it.':(land==='ok'?'.':', but the crowd had stopped caring a while ago.'));
  news(S,'story',K.n+' '+res+' at '+show.name+'.');note(S,'The arc is over',K.n+' '+res+'.',land==='flat'?'bad':'good');
}
/* a new arc begins a few weeks after the last one ended, with whoever fits it now */
WEEKX.push(function(S){
  if(S.cal||S.sa||S.week<(S.saNext==null?3:S.saNext))return;
  var ks=Object.keys(TALES),k=ks[(S.sas||[]).length%ks.length];
  if(!taleStart(S,k,{due:S.week+1}))S.saNext=S.week+2;
});
/** Decide where the arc goes on this show (the booker's answer). i null takes the answer back. */
E.taleDecide=function(S,i){var A=S.sa,N=A&&taleNode(A);if(!N)return {ok:false,msg:'No arc is waiting for an answer.'};
  if(i==null){A.ch=null;return {ok:true,msg:'Undecided again.'};}if(!N.o[i])return {ok:false,msg:'That is not one of the answers.'};
  A.ch=i;return {ok:true,msg:taleFill(S,A,N.o[i].n)+'. It plays out on the show.'};};
/** Everything the screens show about the arc: its chapter, the question and the answers, what came before. */
E.taleInfo=function(S){
  var A=S.sa;if(!A||A.done)return {on:false,past:(S.sas||[]).slice(-3)};
  var K=TALES[A.k],N=taleNode(A),seg=segRead(S).filter(function(sg){return sg.k==='arc';})[0]||null,nx=N.at==='big'?nextBigFrom(S.week,S):A.due;
  return {on:true,k:A.k,n:K.n,d:K.d,node:A.node,cn:N.n,t:taleFill(S,A,N.t),q:taleFill(S,A,N.q),end:!!N.end,post:!!N.post,big:N.at==='big',
    tonight:!!seg,ch:A.ch,heat:Math.round(A.heat),word:A.heat>=65?'The crowd is hooked':(A.heat>=40?'The crowd is following it':'The crowd has not caught on yet'),
    when:seg?'Tonight':cal(Math.max(nx,S.week)).label,
    who:N.who.map(function(r){return A.cast[r];}),cast:Object.keys(A.cast).filter(function(r){return ['a','b','c'].indexOf(r)>=0;}).map(function(r){return A.cast[r];}),
    o:N.o.map(function(o,i){return {i:i,n:taleFill(S,A,o.n),d:taleFill(S,A,o.d),safe:!!o.safe,lock:!!o.lock,end:!!N.end};}),
    hist:A.hist.map(function(h){var M=K.nodes[h.node],o=M&&M.o[h.ch];return {cn:M?M.n:h.node,n:o?taleFill(S,A,o.n):'',w:cal(h.w).label,you:!!h.you,pre:!!h.pre};})};
};
/* the arc on this show needs an answer before it can run (the screens stop; a game nobody plays never waits) */
TASKX.push(function(S,P,add){var I=E.taleInfo(S);if(I.on&&I.tonight&&I.ch==null)add('arc','The arc on tonight’s show, '+I.n+', needs your decision: '+I.q,'booking','Decide',{card:true,waive:false,short:'Decide the arc',done:'The arc is decided.'});});

/* ---------- locks: what is promised for a show is on its card already ----------
   A lock is a match or a promo promised for a later show: a title match or a rematch at the next big event, a match an
   arc made, a promo promised to somebody. When that show comes up, the match is on the card already (m.pm, and
   m.lock so it keeps its place) or the promo is on the run sheet (sg.forced), with at least the promised wrestler in
   it. The booker fills the rest. Suggest keeps it, Clear keeps it, and the show cannot run without it.
   S.locks = [{id, kind: 'match' | 'promo', w: the week, big: 1 for the big event, sid: the show's id otherwise, sides,
   title, why, q: the promise it keeps, who (a promo)}]. */
/** The week and show of the next big event the booker can still book (this week's, if it has not run). */
function nextBigShow(S){var ranBig=(S.queue||[]).slice(0,S.qi).some(function(sh){return sh.big;});return isBigWeek(S.week,S)&&!ranBig?S.week:nextBigFrom(S.week+1,S);}
/** The next show of the player's after the one on the desk: {w, sid}. */
function nextShowAfter(S){var q=S.queue||[];if(S.qi+1<q.length)return {w:S.week,sid:q[S.qi+1].id};var P=S.promos[S.player],L=weekShows(S,P,S.week+1);return L.length?{w:S.week+1,sid:L[0].id}:{w:S.week+1,sid:'big'};}
/** Move a promise for a big event to the one after it: the clash is nobody's fault, but the wrestler hears about it. */
function lockPut(S,l,why){var nw=nextBigFrom(l.w+1,S),q=l.q!=null?S.quests.filter(function(x){return x.id===l.q;})[0]:null,w=S.w[l.sides[0][0]];l.w=nw;if(q){q.due=nw;q.at=nw;q.text=q.text.replace(/ at .*$/,' at '+bigNameAt(S,nw));}
  if(w){note(S,'A promise moves',w.name+'’s match moves to '+bigNameAt(S,nw)+': '+(why||'the one they face cannot be in it tonight')+'.','');youRemember(S,w,'moved','Their promised match was moved back a month.',-2);}}
function lockAdd(S,o){
  var L=S.locks||(S.locks=[]),at=o.big?{w:o.w!=null?o.w:nextBigShow(S),sid:'big'}:(o.w!=null?{w:o.w,sid:o.sid}:nextShowAfter(S));
  var lk={id:S.nid++,kind:o.kind||'match',w:at.w,big:o.big?1:0,sid:at.sid,sides:o.sides||null,title:o.title||null,why:o.why||'',q:o.q==null?null:o.q,who:o.who==null?null:o.who,arc:o.arc?1:0};
  L.push(lk);return lk;
}
E.lockAdd=function(S,o){return lockAdd(S,o);};
function lockHere(S,l){var show=S.queue&&S.queue[S.qi];if(!show||l.w!==S.week)return false;return l.big?!!show.big:show.id===l.sid;}
/** The locks for the show on the desk. */
function locksNow(S){return (S.locks||[]).filter(function(l){return lockHere(S,l);});}
E.locksNow=function(S){return locksNow(S).map(function(l){return {id:l.id,kind:l.kind,why:l.why,label:lockLabel(S,l)};});};
function lockLabel(S,l){var P=S.promos[S.player],t=l.title?titleById(P,l.title):null,nm=function(id){return id!=null&&S.w[id]?S.w[id].name:'an opponent you pick';};
  if(l.kind==='promo')return nm(l.who)+' gets a promo';
  return l.sides.map(function(sd){return sd.map(nm).join(' & ');}).join(' vs ')+(t?' for the '+t.name:'');}
/** The match a lock puts on the card: the promised wrestler in, the champion against them for a title, the rest open. */
function lockMatch(S,l){
  var P=S.promos[S.player],show=S.queue[S.qi],t=l.title?titleById(P,l.title):null,sides=l.sides.map(function(sd){return sd.slice();});
  if(t&&!t.tag&&t.holders.length){var hold=t.holders[0];if(sides[0].indexOf(hold)>=0)return null;sides[1]=[hold];}   // the champion now, whoever it is; a promised wrestler who has since won it needs no shot
  var ok=eligible(S,P,show),inE={};ok.forEach(function(w){inE[w.id]=1;});
  if(t&&!t.tag&&t.holders.length&&!inE[t.holders[0]])return 'wait';   // the champion cannot work tonight: the title match waits for the next big event
  sides=sides.map(function(sd){return sd.map(function(id){return id!=null&&inE[id]?id:null;});});
  if(sides[0][0]==null)return null;   // the promised wrestler cannot work tonight
  return {mt:'1v1',sides:sides,win:-2,call:null,title:t?t.id:null,stip:'std',len:'M',lock:1,pm:l.id};
}
/** Put this show's locks on the card and the run sheet. */
function lockSeed(S){
  var c=S.card||(S.card=[]);
  locksNow(S).forEach(function(l){
    if(l.kind==='match'){if(c.some(function(m){return m.pm===l.id;}))return;var m=lockMatch(S,l);if(m==='wait'&&l.big){lockPut(S,l);return;}if(!m||m==='wait')return;
      // somebody in it is in another promised match tonight (a champion of two belts, a belt that changed hands): this one moves to the next big event
      var ids=flat(m.sides).filter(function(x){return x!=null;});if(l.big&&c.some(function(x){return x.pm!=null&&flat(x.sides).some(function(id){return ids.indexOf(id)>=0;});})){lockPut(S,l);return;}var at=l.arc?c.length:Math.max(0,c.length-1);c.splice(Math.min(at,c.length),0,m);}
  });
}
SHOWON.push(function(S){if(S.player&&!S.cal)lockSeed(S);});
SEGNEW.push(function(S,L){locksNow(S).forEach(function(l){if(l.kind==='promo'&&l.who!=null&&S.w[l.who]&&!L.some(function(x){return x&&x.pm===l.id;})){var P=S.promos[S.player];if(taleFree(S,P,S.w[l.who]))L.push({k:'interview',who:[l.who],pos:1,len:'M',forced:1,pm:l.id});}});});
/* a suggested card keeps what is promised for the show */
(function(){
  var s0=E.suggest;
  E.suggest=function(S){
    var c=s0(S),L=locksNow(S).filter(function(l){return l.kind==='match';});if(!L.length)return c;
    var saved=S.card;S.card=[];lockSeed(S);var put=S.card.filter(function(m){return m&&m!=='wait';});S.card=saved;
    put.forEach(function(m){var ids=flat(m.sides).filter(function(x){return x!=null;}),clash=function(x){return flat(x.sides).some(function(id){return ids.indexOf(id)>=0;})||(m.title&&x.title===m.title);};
      // it takes the place of the match it replaces (often the main event, with the same champion in it); else it goes before the main event
      var at=-1;c.forEach(function(x,k){if(at<0&&clash(x))at=k;});var wasMain=at>=0&&at===c.length-1;
      c=c.filter(function(x,k){return !clash(x);});
      // fill an open spot with somebody fresh on the roster of the right kind
      m.sides.forEach(function(sd,k){sd.forEach(function(id,q){if(id!=null)return;var used={};c.concat([m]).forEach(function(x){flat(x.sides).forEach(function(y){used[y]=1;});});
        var a=S.w[flat(m.sides).filter(function(x){return x!=null;})[0]],pick=eligible(S,S.promos[S.player],S.queue[S.qi]).filter(function(w){return !used[w.id]&&w.g===a.g;}).sort(function(x,y){return Math.abs(x.ovr-a.ovr)-Math.abs(y.ovr-a.ovr);})[0];if(pick)sd[q]=pick.id;});});
      if(wasMain)c.push(m);else c.splice(at>=0?Math.min(at,c.length):Math.max(0,c.length-1),0,m);});
    fitShow(S,c);return c;
  };
})();
/* the show cannot run without what was promised for it */
(function(){
  var v0=E.validate;
  E.validate=function(S,card){
    var v=v0(S,card),P=S.promos[S.player],show=S.queue&&S.queue[S.qi];if(!show)return v;var inE={};eligible(S,P,show).forEach(function(w){inE[w.id]=1;});
    locksNow(S).forEach(function(l){
      if(l.kind!=='match')return;var who=l.sides[0][0];if(who==null||!inE[who])return;   // they cannot work tonight: nothing to be done about it on the card
      var t=l.title?titleById(P,l.title):null;if(t&&t.holders.indexOf(who)>=0)return;if(t&&!t.tag&&t.holders.length&&!inE[t.holders[0]])return;   // no champion tonight: it waits
      // a title match is the promised wrestler for that title, whoever holds it by then; any other match is the two of them
      var on=card.some(function(m){return flat(m.sides).indexOf(who)>=0&&(l.title?m.title===l.title:l.sides[1].every(function(id){return id==null||!inE[id]||flat(m.sides).indexOf(id)>=0;}));});
      if(!on)v.errors.push('Promised for tonight: '+lockLabel(S,l)+(l.why?' ('+l.why+')':'')+'. It has to be on the card.');
    });
    // a story planned to end tonight, with one of the two promised a different match: both cannot happen
    if(show.big)locksNow(S).forEach(function(l){if(l.kind!=='match')return;var ids=flat(l.sides).filter(function(x){return x!=null;});
      ids.forEach(function(id){feudsFor(S,id).forEach(function(f){if(f.promo!==P.id||f.endAt!==S.week)return;var o=f.a.concat(f.b).filter(function(x){return f.a.indexOf(id)>=0?f.b.indexOf(x)>=0:f.a.indexOf(x)>=0;})[0];
        if(o!=null&&ids.indexOf(o)<0&&S.w[o])v.warnings.push(S.w[id].name+'’s story with '+S.w[o].name+' was planned to end tonight, but '+S.w[id].name+' is promised another match: '+lockLabel(S,l)+'. Only one of them can happen.');});});});
    return v;
  };
})();
/* once the show has run, its locks are spent */
SHOWX.push(function(S,P,show){if(S.cal||P.id!==S.player||!S.locks)return;S.locks=S.locks.filter(function(l){return !(l.w===S.week&&(l.big?show.big:l.sid===show.id));});});
WEEKX.push(function(S){if(S.locks)S.locks=S.locks.filter(function(l){return l.w>=S.week;});});
/** The name of the big event in week w, and when: "EWF Night of Champions (Week 4, May 2027)". */
function bigNameAt(S,w){var P=S.promos[S.player];return P.name+' '+evName(S,P,cal(w).month)+' ('+cal(w).label+')';}
/** Promise a wrestler a title match (a shot, or the rematch) at the next big event: the promise, and the match locked on that card. */
function promiseShot(S,w,t,o,what){
  // somebody else has that title match at that event already: this one is promised for the big event after it
  var hold=t.holders.slice(),busy=function(l){return l.big&&l.w===at&&(l.title===t.id||flat(l.sides||[]).some(function(id){return id===w.id||hold.indexOf(id)>=0;})||(l.title&&(titleById(S.promos[S.player],l.title)||{holders:[]}).holders.some(function(id){return hold.indexOf(id)>=0||id===w.id;})));};
  var at=nextBigShow(S);while((S.locks||[]).some(busy))at=nextBigFrom(at+1,S);   // the champion (or the challenger) is promised a match that night already
  var q={id:S.nid++,type:'shot',w:w.id,title:t.id,due:at,at:at,text:'Promise: '+w.name+' gets '+(what||'a match')+' for the '+t.name+' at '+bigNameAt(S,at)};
  S.quests.push(q);lockAdd(S,{kind:'match',sides:[[w.id],[o?o.id:null]],title:t.id,big:1,w:at,why:'You promised it',q:q.id});return q;
}
/** Promise a wrestler a promo on the next show: it goes on that run sheet, and stays there. */
function promisePromo(S,w){var nx=nextShowAfter(S),lk=lockAdd(S,{kind:'promo',who:w.id,w:nx.w,sid:nx.sid,why:'You promised it'});return lk;}
E.promisePromo=function(S,id){var w=S.w[id];if(!w)return {ok:false,msg:''};var lk=promisePromo(S,w);return {ok:true,msg:w.name+' gets a promo on the next show. It is on that run sheet already.',lock:lk.id};};
/** Take a match off the card, unless it was promised. Clearing the card keeps what was promised. */
E.cardRemove=function(S,i){var m=S.card&&S.card[i];if(!m)return {ok:false,msg:''};if(m.pm!=null&&locksNow(S).some(function(l){return l.id===m.pm;}))return {ok:false,msg:'This match was promised for tonight. It stays on the card.'};S.card.splice(i,1);return {ok:true,msg:'That match is off the card.'};};
E.cardClear=function(S){var keep=(S.card||[]).filter(function(m){return m.pm!=null&&locksNow(S).some(function(l){return l.id===m.pm;});});S.card=keep;E.segClear(S);return {ok:true,msg:keep.length?'The card is clear, but for what was promised.':'The card is clear.'};};
