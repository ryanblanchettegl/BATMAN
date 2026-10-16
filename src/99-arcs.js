/* Company arcs (roadmap 11, Ryan 16 October). One arc a year: picked on Storylines, it runs until the next flagship
   and pays off there. It is built from the roster you have (the people in it are picked by what is true of them),
   it comes to the desk as chapters with a decision each, and every decision moves how well it is landing (arc.s, 0 to
   100, said only in words). It can flop. A flop can still be turned around on the last chapter, at a cost, and
   something saved at the flagship. The first three: the faction takeover, the hostile authority, the brand split.
   A new arc is one more entry in ARCS with a cast() and its chapters. Nothing here calls rnd(S). */
function arcHeels(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.align==='H'&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;});}
function arcFaces(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.align!=='H'&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;});}
var ARCS={
  faction:{n:'The faction takeover',d:'A group forms and runs roughshod over the company until somebody stops them.',
    cast:function(S){var H=arcHeels(S),F=arcFaces(S);if(H.length<3||!F.length)return null;return {lead:H[0].id,a:H[1].id,b:H[2].id,hero:F[0].id};},
    ch:[
      {t:'{lead} has gathered {a} and {b}. They want to run the place. How do they arrive?',o:[
        {n:'They attack the main event',d:'Loud and fast. The crowd hates them at once.',s:8,who:['lead','hero'],bond:-20},
        {n:'They cut a promo and wait',d:'Slower, and it gives them time to talk.',s:3},
        {n:'They hide in plain sight',d:'Nobody knows they are together yet. A gamble.',s:-8}]},
      {t:'The group needs a fourth. Who joins {lead}?',o:[
        {n:'A trusted name turns',d:'A face the crowd loved walks over to them. It hurts, and it works.',s:10,turn:1},
        {n:'Nobody: they stay three',d:'Tight, and easier to book.',s:-5},
        {n:'A newcomer they bring in',d:'A fresh face with nothing to lose.',s:4}]},
      {t:'{hero} has had enough of {lead} and the rest. What now?',o:[
        {n:'{hero} fights them alone',d:'The lone hero. The crowd backs the underdog.',s:7,who:['hero','lead'],bond:-15},
        {n:'{hero} gathers a team',d:'Five against four at the flagship.',s:5},
        {n:'Let the group win for now',d:'They grow stronger. The payoff has to be big.',s:-7}]}
    ],last:'The flagship is near. The takeover ends there, one way or the other.'},
  authority:{n:'The hostile authority',d:'Somebody with power on screen makes life hard for the top good guy all year.',
    cast:function(S){var F=arcFaces(S),H=arcHeels(S);if(!F.length||!H.length)return null;var boss=rosterOf(S,S.player).filter(function(w){return w.nw;}).sort(function(a,b){return (b.mic||0)-(a.mic||0);})[0]||H[0];return {lead:boss.id,hero:F[0].id,a:H[0].id===boss.id?(H[1]||H[0]).id:H[0].id};},
    ch:[
      {t:'{lead} takes charge on screen and picks a target: {hero}. How is it done?',o:[
        {n:'Impossible matches, every week',d:'{hero} has to fight through whatever {lead} puts in front of them.',s:7,who:['lead','hero'],bond:-10},
        {n:'Strip them of something',d:'A title shot taken away, a spot on the card.',s:5},
        {n:'Quiet favours for {a}',d:'{lead} makes {a} the chosen one. Slower to land.',s:-5}]},
      {t:'{hero} fights back against {lead}. How far does it go?',o:[
        {n:'{hero} lays hands on the boss',d:'The crowd has waited for this. Big pop, real consequences.',s:9,who:['hero','lead'],bond:-15},
        {n:'A petition from the locker room',d:'The room stands up. Good for morale, quieter on TV.',s:3,room:1},
        {n:'{hero} keeps their head down',d:'It saves the moment for later. Or wastes it.',s:-8}]},
      {t:'{lead} puts everything on one night. What is on the line?',o:[
        {n:'{lead}\'s job',d:'If {hero} wins at the flagship, {lead} is gone.',s:8},
        {n:'{hero}\'s career',d:'Lose and leave. The highest stakes.',s:6},
        {n:'Nothing said out loud',d:'The crowd is left to guess.',s:-7}]}
    ],last:'The flagship is near. {hero} and {lead} settle it there.'},
  split:{n:'The brand split',d:'The roster is divided in two, and each side has to prove it is the real company.',
    cast:function(S){var R=rosterOf(S,S.player).filter(function(w){return !w.nw&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;});if(R.length<6)return null;return {lead:R[0].id,hero:R[1].id,a:R[2].id,b:R[3].id};},
    ch:[
      {t:'The roster is split. {lead} leads one side, {hero} the other. How is the split made?',o:[
        {n:'A draft on live television',d:'Everybody watches who goes first and who goes last. Feelings get hurt.',s:8,room:-1},
        {n:'The office decides quietly',d:'Calmer backstage, flatter on screen.',s:-5},
        {n:'The wrestlers choose',d:'Friends stay together. Some sides look thin.',s:4}]},
      {t:'{a} wants to cross over from one side to the other. Do you let them?',o:[
        {n:'Yes, and make it a story',d:'A defection. The other side calls it betrayal.',s:7,who:['a','lead'],bond:-10},
        {n:'No: the lines are the lines',d:'It keeps the sides clean.',s:-5},
        {n:'A trade for {b}',d:'Both sides get something. Neither is happy.',s:4}]},
      {t:'The two sides meet at last. How?',o:[
        {n:'An invasion of the other side\'s show',d:'Chaos, and the crowd loves chaos.',s:8,who:['lead','hero'],bond:-10},
        {n:'A series of matches, side against side',d:'The score is kept every week.',s:6},
        {n:'Nothing until the flagship',d:'All the meeting is saved for one night.',s:-7}]}
    ],last:'The flagship is near. One side proves it is the real company there.'}
};
E.ARCS=ARCS;
function arcFill(S,A,t){return String(t).replace(/\{(\w+)\}/g,function(_,k){var id=A.cast[k];return id!=null&&S.w[id]?S.w[id].name:k;});}
function arcEnd(S){var P=S.promos[S.player],w=flagWeekFrom(S,P);if(w!=null&&w-S.week<12)w=flagWeekFrom({week:w},P);return w;}
function arcWord(s){return s>=75?'The crowd is hooked':(s>=60?'It is landing':(s>=45?'It is slow to land':(s>=35?'It is losing them':'It is flopping')));}
/** What the screens show: the arc running, or the arcs on offer. */
E.arcInfo=function(S){
  var A=S.arc;
  if(A&&!A.done){var K=ARCS[A.k];return {on:true,k:A.k,n:K.n,d:K.d,word:arcWord(A.s),ch:A.ch,of:K.ch.length+1,end:A.end,endLabel:cal(A.end).label,cast:Object.keys(A.cast).map(function(r){return S.w[A.cast[r]]?S.w[A.cast[r]].name:'';}).filter(Boolean),flop:A.s<35};}
  var c=cal(S.week),P=S.promos[S.player],past=(S.arcs||[]).length,ok=!past||c.month===(P.flagship+1)%12||c.month===(P.flagship+2)%12;
  return {on:false,can:ok,why:ok?'':'A new arc is picked in the month after the flagship.',last:past?S.arcs[past-1]:null,
    list:Object.keys(ARCS).map(function(k){var cs=ARCS[k].cast(S);return {k:k,n:ARCS[k].n,d:ARCS[k].d,can:!!cs,who:cs?Object.keys(cs).map(function(r){return S.w[cs[r]].name;}):[],why:cs?'':'The roster does not have the people for it.'};})};
};
E.arcStart=function(S,k){
  var I=E.arcInfo(S);if(I.on)return {ok:false,msg:'An arc is already running.'};if(!I.can)return {ok:false,msg:I.why};
  var K=ARCS[k],cs=K&&K.cast(S);if(!cs)return {ok:false,msg:'The roster does not have the people for it.'};
  var end=arcEnd(S);if(end==null)return {ok:false,msg:'There is no flagship to build to.'};
  var len=end-S.week,due=[0.15,0.45,0.75].map(function(f){return S.week+Math.max(1,Math.round(len*f));});due.push(end-2);   // fired as the week before the flagship begins, so it is answered before the night
  S.arc={k:k,cast:cs,s:50,ch:0,due:due,start:S.week,end:end};
  Object.keys(cs).forEach(function(r){youRemember(S,S.w[cs[r]],'arc','Put at the centre of '+K.n.toLowerCase()+'.',2);});
  news(S,'story',S.promos[S.player].name+' begins a year-long story: '+K.n.toLowerCase()+'.');
  return {ok:true,msg:K.n+' begins. It builds to the flagship, '+cal(end).label+'.'};
};
/* chapters come to the desk when they are due */
WEEKX.push(function(S){
  var A=S.arc;if(!A||A.done||A.ch>=A.due.length||S.week<A.due[A.ch])return;
  if(S.inbox.some(function(e){return !e.done&&e.type==='arcch';}))return;
  var K=ARCS[A.k],i=A.ch;
  if(i<K.ch.length){var C=K.ch[i];pushEv(S,{type:'arcch',n:i,text:K.n+', chapter '+(i+1)+'. '+arcFill(S,A,C.t),choices:C.o.map(function(o){return arcFill(S,A,o.n)+': '+arcFill(S,A,o.d);})});}
  else{var flop=A.s<35;pushEv(S,{type:'arcch',n:i,last:1,text:K.n+'. '+arcFill(S,A,K.last)+' '+arcWord(A.s)+'.'+(flop?' It is flopping. It can still be turned around: a swerve nobody sees coming, for 3 booking power.':''),
    choices:flop?['Turn it around (3 booking power)','Let it play out']:['Go all in at the flagship','Keep it simple']});}
  A.ch++;
});
EVR.arcch=function(S,ev,choice,P){
  var A=S.arc;if(!A||A.done)return 'The arc is over.';var K=ARCS[A.k];
  if(ev.last){
    if(A.s<35){if(choice===0){if(S.bp<3)return 'You do not have 3 booking power to spend. It plays out as it is.';S.bp-=3;A.saved=1;A.s=Math.max(A.s,40);return 'The swerve is set. Nobody will see it coming. Something can still be saved at the flagship.';}return 'You let it play out. The flagship will tell.';}
    if(choice===0){A.s=clamp(A.s+4,0,100);A.allin=1;return 'Everything goes on the flagship. The bigger the night, the bigger the payoff, or the fall.';}return 'You keep it simple. A safe ending.';
  }
  var o=K.ch[ev.n].o[choice];if(!o)return '';
  A.s=clamp(A.s+o.s,0,100);
  if(o.who){var x=S.w[A.cast[o.who[0]]],y=S.w[A.cast[o.who[1]]];if(x&&y)relBump(S,x.id,y.id,{bond:o.bond||0},{k:'arc',t:arcFill(S,A,o.n)});}
  if(o.turn){var t=arcFaces(S).filter(function(w){return Object.keys(A.cast).every(function(r){return A.cast[r]!==w.id;});})[0];if(t){t.align='H';t.tw=S.week;A.cast.turn=t.id;youRemember(S,t,'arcturn','You turned them for '+K.n.toLowerCase()+'.',-1);note(S,'A turn',t.name+' joins '+S.w[A.cast.lead].name+'.','good');}}
  if(o.room)rosterOf(S,P.id).forEach(function(w){if(!w.nw)w.morale=clamp(w.morale+(o.room>0?3:-3),0,100);});
  Object.keys(A.cast).forEach(function(r){var w=S.w[A.cast[r]];if(w)youRemember(S,w,'arcch',arcFill(S,A,o.n)+'.',o.s>=6?1:(o.s<0?-1:0));});
  return arcFill(S,A,o.n)+'. '+arcWord(A.s)+'.';
};
/* every show with the arc's people at the top of the card keeps it going */
SHOWX.push(function(S,P,show,rep,card){
  var A=S.arc;if(S.cal||P.id!==S.player||!A||A.done)return;
  var last=card&&card[card.length-1],ids=last?flat(last.sides):[],on=Object.keys(A.cast).some(function(r){return ids.indexOf(A.cast[r])>=0;});
  // once a week: at the top of the card it keeps warm (only so far: the choices make it great), away it cools
  if(A.wk!==S.week){A.wk=S.week;if(on){if(A.s<60)A.s=clamp(A.s+1,0,60);}else A.s=clamp(A.s-1,0,100);}
  if(!show.flag||S.week<A.end)return;
  // the payoff
  var K=ARCS[A.k],sc=A.s+(A.allin?(repCS(rep)>=70?8:-8):0),res,img=0,tr=0,bp=0;
  if(sc<35&&A.saved)sc=35;
  if(sc>=60){res='paid off';img=3;tr=4;bp=3;}else if(sc>=35){res=A.saved?'was saved':'landed';img=A.saved?1:1;tr=A.saved?1:2;bp=1;}else{res='flopped';img=-2;tr=-3;}
  P.image=clamp(P.image+img,1,100);if(!S.owner.me)S.owner.trust=clamp(S.owner.trust+tr,0,100);S.bp=(S.bp||0)+bp;
  Object.keys(A.cast).forEach(function(r){var w=S.w[A.cast[r]];if(w)youRemember(S,w,'arcend',K.n+' '+res+' at the flagship.',img>0?2:(img<0?-2:0));});
  A.done=1;A.res=res;(S.arcs||(S.arcs=[])).push({k:A.k,n:K.n,res:res,y:cal(S.week).label});S.arc=null;
  rep.arc=K.n+' '+res+'.';
  news(S,'story',K.n+' '+res+' at '+show.name+'.');note(S,'The arc',K.n+' '+res+'.',img>0?'good':(img<0?'bad':''));
});
