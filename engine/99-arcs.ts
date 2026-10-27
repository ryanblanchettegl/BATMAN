/* Moved from src/99-arcs.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, cal, clamp, flat, rosterOf } from './00-core';
import { EVR, SHOWX, WEEKX } from './10-match';
import { pushEv } from './40-week';
import { flagWeekFrom } from './42-events';
import { bondOf, relBump, youRemember } from './66-relations';
import { repCS } from './98-words';
$L.arcHeels = arcHeels; $L.arcFaces = arcFaces; $L.arcFill = arcFill; $L.arcEnd = arcEnd; $L.arcWord = arcWord; $L.arcSplit = arcSplit;
/* Company arcs (roadmap 11, Ryan 16 October). One arc a year: picked on Storylines, it runs until the next flagship
   and pays off there. It is built from the roster you have (the people in it are picked by what is true of them),
   it comes to the desk as chapters with a decision each, and every decision moves how well it is landing (arc.s, 0 to
   100, said only in words). It can flop. A flop can still be turned around on the last chapter, at a cost, and
   something saved at the flagship. The first three: the faction takeover, the hostile authority, the brand split.
   A new arc is one more entry in ARCS with a cast() and its chapters. Nothing here calls rnd(S). */
export function arcHeels(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.align==='H'&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;});}
export function arcFaces(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.align!=='H'&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;});}
export var ARCS={
  faction:{n:'The faction takeover',d:'A group forms and runs roughshod over the company until somebody stops them.',
    pick:'lead',pickFrom:function(S){return arcHeels(S).slice(0,6);},
    cast:function(S,o){var H=arcHeels(S),F=arcFaces(S),L=o&&o.lead!=null?S.w[o.lead]:H[0];if(!L||H.length<3||F.length<2)return null;H=H.filter(function(w){return w!==L;});
      var young=F.slice(1).filter(function(w){return w.age<=27||w.deb;}).sort(function(a,b){return a.ovr-b.ovr;})[0]||F[F.length-1];
      return {lead:L.id,a:H[0].id,b:H[1].id,hero:F[0].id,j1:F[1].id,j2:young.id};},
    ch:[
      {t:'{lead} has gathered {a} and {b}. They want to run the place. How do they arrive?',o:[
        {n:'They attack the main event',d:'Loud and fast. The crowd hates them at once.',s:8,who:['lead','hero'],bond:-20},
        {n:'They cut a promo and wait',d:'Slower, and it gives them time to talk.',s:3},
        {n:'They hide in plain sight',d:'Nobody knows they are together yet. A gamble.',s:-8}]},
      {t:'The group needs a fourth. Who joins {lead}?',o:[
        {n:'{j1} turns on the fans',d:'A face the crowd loved walks over to them. It hurts, and it works.',s:10,join:'j1'},
        {n:'Nobody: they stay three',d:'Tight, and easier to book.',s:-5},
        {n:'{j2}, a young one, signs up',d:'A fresh face with nothing to lose.',s:4,join:'j2'}]},
      {t:'{hero} has had enough of {lead} and the rest. What now?',o:[
        {n:'{hero} fights them alone',d:'The lone hero. The crowd backs the underdog.',s:7,who:['hero','lead'],bond:-15},
        {n:'{hero} gathers a team',d:'Five against four at the flagship.',s:5},
        {n:'Let the group win for now',d:'They grow stronger. The payoff has to be big.',s:-7}]},
      {t:'Cracks inside the group. Somebody is ready to turn on {lead}. Who?',o:[
        {n:'{a} betrays {lead}',d:'The right-hand man walks out. The crowd cheers a villain for once.',s:9,betray:'a'},
        {n:'{b} betrays {lead}',d:'The quiet one snaps. Nobody saw it coming.',s:7,betray:'b'},
        {n:'Nobody: they hold together',d:'Strong to the end. The hero needs a bigger night.',s:-4}]}
    ],last:'The flagship is near. The takeover ends there, one way or the other.'},
  authority:{n:'The hostile authority',d:'Somebody with power on screen makes life hard for the top good guy all year.',
    cast:function(S){var F=arcFaces(S),H=arcHeels(S);if(F.length<3||!H.length)return null;var boss=rosterOf(S,S.player).filter(function(w){return w.nw;}).sort(function(a,b){return (b.mic||0)-(a.mic||0);})[0]||H[0];
      return {lead:boss.id,hero:F[0].id,a:H[0].id===boss.id?(H[1]||H[0]).id:H[0].id,c:F[Math.min(F.length-1,3)].id};},
    ch:[
      {t:'{lead} takes charge on screen and picks a target: {hero}. How is it done?',o:[
        {n:'Impossible matches, every week',d:'{hero} has to fight through whatever {lead} puts in front of them.',s:7,who:['lead','hero'],bond:-10},
        {n:'Strip them of something',d:'A title shot taken away, a spot on the card.',s:5},
        {n:'Quiet favours for {a}',d:'{lead} makes {a} the chosen one. Slower to land.',s:-5}]},
      {t:'{hero} fights back against {lead}. How far does it go?',o:[
        {n:'{hero} lays hands on the boss',d:'The crowd has waited for this. Big pop, real consequences.',s:9,who:['hero','lead'],bond:-15},
        {n:'A petition from the locker room',d:'The room stands up. Good for morale, quieter on TV.',s:3,room:1},
        {n:'{hero} keeps their head down',d:'It saves the moment for later. Or wastes it.',s:-8}]},
      {t:'{lead} wants to make an example of somebody. On live television.',o:[
        {n:'{lead} fires {c} on screen',d:'{c} is gone for four weeks. The crowd is furious, in the good way.',s:7,fire:'c'},
        {n:'{lead} threatens the whole locker room',d:'Everybody is on notice. The room does not like it.',s:4,room:-1},
        {n:'No firings',d:'The boss looks all talk.',s:-6}]},
      {t:'{lead} puts everything on one night. What is on the line?',o:[
        {n:'{lead}\'s job',d:'If {hero} wins at the flagship, {lead} is gone.',s:8},
        {n:'{hero}\'s career',d:'Lose and leave. The highest stakes.',s:6},
        {n:'Nothing said out loud',d:'The crowd is left to guess.',s:-7}]}
    ],last:'The flagship is near. {hero} has to win there to overthrow {lead}.',over:'hero'},
  split:{n:'The brand split',d:'The roster is divided in two, and each side has to prove it is the real company.',
    cast:function(S){var R=rosterOf(S,S.player).filter(function(w){return !w.nw&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;});if(R.length<6)return null;return {lead:R[0].id,hero:R[1].id,a:R[2].id,b:R[3].id};},
    ch:[
      {t:'The roster is split. {lead} leads one side, {hero} the other. How is the split made?',o:[
        {n:'A draft on live television',d:'Everybody watches who goes first and who goes last. Feelings get hurt.',s:8,room:-1,split:'draft'},
        {n:'The office decides quietly',d:'Calmer backstage, flatter on screen.',s:-5,split:'office'},
        {n:'The wrestlers choose',d:'Friends stay together. Some sides look thin.',s:4,split:'friends'}]},
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
$L.ARCS = ARCS;
E.ARCS=ARCS;
export function arcFill(S,A,t){return String(t).replace(/\{(\w+)\}/g,function(_,k){var id=A.cast[k];return id!=null&&S.w[id]?S.w[id].name:k;});}
export function arcEnd(S){var P=S.promos[S.player],w=flagWeekFrom(S,P);if(w!=null&&w-S.week<12)w=flagWeekFrom({week:w},P);return w;}
export function arcWord(s){return s>=75?'The crowd is hooked':(s>=60?'It is landing':(s>=45?'It is slow to land':(s>=35?'It is losing them':'It is flopping')));}
/* the brand split: with two weekly shows and no brands yet, the roster is really split in two and kept apart */
export function arcSplit(S,P,A,mode){
  var tv=P.shows.filter(function(sh){return !sh.big&&!sh.off;});
  if(P.brands||tv.length<2){A.split='story';$L.note(S,'The split','Two sides on one show: the split lives in the story.','');return;}
  P.brands=[{id:'arcA',name:S.w[A.cast.lead].name+'\'s side'},{id:'arcB',name:S.w[A.cast.hero].name+'\'s side'}];
  tv[0].brand='arcA';tv[1].brand='arcB';
  var R=rosterOf(S,P.id).sort(function(a,b){return b.ovr-a.ovr;}),k=0;
  R.forEach(function(w){if(w.id===A.cast.lead||(mode==='friends'&&A.cast.lead!=null&&bondOf(S,w.id,A.cast.lead)>40))w.brand='arcA';else if(w.id===A.cast.hero)w.brand='arcB';else{w.brand=k%2?'arcB':'arcA';k++;}});
  A.split='real';$L.news(S,'story',P.name+' splits its roster in two: '+P.brands[0].name+' on '+tv[0].name+', '+P.brands[1].name+' on '+tv[1].name+'.');
  $L.note(S,'The split','The roster is split. Each show books only its own side.','good');
}
/** What the screens show: the arc running, or the arcs on offer. */
E.arcInfo=function(S){
  var A=S.arc;
  if(A&&!A.done){var K=$L.ARCS[A.k];return {on:true,k:A.k,n:K.n,d:K.d,word:arcWord(A.s),ch:A.ch,of:K.ch.length+1,end:A.end,endLabel:cal(A.end).label,cast:Object.keys(A.cast).map(function(r){return S.w[A.cast[r]]?S.w[A.cast[r]].name:'';}).filter(Boolean),flop:A.s<35};}
  var c=cal(S.week),P=S.promos[S.player],past=(S.arcs||[]).length,ok=!past||c.month===(P.flagship+1)%12||c.month===(P.flagship+2)%12;
  return {on:false,can:ok,why:ok?'':'A new arc is picked in the month after the flagship.',last:past?S.arcs[past-1]:null,
    list:Object.keys($L.ARCS).map(function(k){var K=$L.ARCS[k],cs=K.cast(S);return {k:k,n:K.n,d:K.d,can:!!cs,who:cs?['lead','hero','a'].filter(function(r){return cs[r]!=null;}).map(function(r){return S.w[cs[r]].name;}):[],why:cs?'':'The roster does not have the people for it.',
      pick:K.pick?{role:K.pick,from:K.pickFrom(S).map(function(w){return {id:w.id,n:w.name};})}:null};})};
};
E.arcStart=function(S,k,o){
  var I=E.arcInfo(S);if(I.on)return {ok:false,msg:'An arc is already running.'};if(!I.can)return {ok:false,msg:I.why};
  var K=$L.ARCS[k],cs=K&&K.cast(S,o);if(!cs)return {ok:false,msg:'The roster does not have the people for it.'};
  var end=arcEnd(S);if(end==null)return {ok:false,msg:'There is no flagship to build to.'};
  var len=end-S.week,nc=K.ch.length,due=K.ch.map(function(_,i){return S.week+Math.max(1,Math.round(len*(0.12+0.68*i/Math.max(1,nc-1))));});due.push(end-2);   // fired as the week before the flagship begins, so it is answered before the night
  S.arc={k:k,cast:cs,s:50,ch:0,due:due,start:S.week,end:end};
  Object.keys(cs).forEach(function(r){youRemember(S,S.w[cs[r]],'arc','Put at the centre of '+K.n.toLowerCase()+'.',2);});
  $L.news(S,'story',S.promos[S.player].name+' begins a year-long story: '+K.n.toLowerCase()+'.');
  return {ok:true,msg:K.n+' begins. It builds to the flagship, '+cal(end).label+'.'};
};
/* chapters come to the desk when they are due */
WEEKX.push(function(S){
  var A=S.arc;if(!A||A.done||A.ch>=A.due.length||S.week<A.due[A.ch])return;
  if(S.inbox.some(function(e){return !e.done&&e.type==='arcch';}))return;
  var K=$L.ARCS[A.k],i=A.ch;
  if(i<K.ch.length){var C=K.ch[i];pushEv(S,{type:'arcch',n:i,text:K.n+', chapter '+(i+1)+'. '+arcFill(S,A,C.t),choices:C.o.map(function(o){return arcFill(S,A,o.n)+': '+arcFill(S,A,o.d);})});}
  else{var flop=A.s<35;pushEv(S,{type:'arcch',n:i,last:1,text:K.n+'. '+arcFill(S,A,K.last)+' '+arcWord(A.s)+'.'+(flop?' It is flopping. It can still be turned around: a swerve nobody sees coming, for 3 booking power.':''),
    choices:flop?['Turn it around (3 booking power)','Let it play out']:['Go all in at the flagship','Keep it simple']});}
  A.ch++;
});
EVR.arcch=function(S,ev,choice,P){
  var A=S.arc;if(!A||A.done)return 'The arc is over.';var K=$L.ARCS[A.k];
  if(ev.last){
    if(A.s<35){if(choice===0){if(S.bp<3)return 'You do not have 3 booking power to spend. It plays out as it is.';S.bp-=3;A.saved=1;A.s=Math.max(A.s,40);return 'The swerve is set. Nobody will see it coming. Something can still be saved at the flagship.';}return 'You let it play out. The flagship will tell.';}
    if(choice===0){A.s=clamp(A.s+4,0,100);A.allin=1;return 'Everything goes on the flagship. The bigger the night, the bigger the payoff, or the fall.';}return 'You keep it simple. A safe ending.';
  }
  var o=K.ch[ev.n].o[choice];if(!o)return '';
  A.s=clamp(A.s+o.s,0,100);
  if(o.who){var x=S.w[A.cast[o.who[0]]],y=S.w[A.cast[o.who[1]]];if(x&&y)relBump(S,x.id,y.id,{bond:o.bond||0},{k:'arc',t:arcFill(S,A,o.n)});}
  if(o.join){var j=S.w[A.cast[o.join]];if(j){A.cast.join=j.id;if(j.align!=='H'){j.align='H';j.tw=S.week;}relBump(S,j.id,A.cast.lead,{bond:20},{k:'arc',t:'Joined '+S.w[A.cast.lead].name+'.'});$L.note(S,'The group grows',j.name+' joins '+S.w[A.cast.lead].name+'.','good');}}
  if(o.betray){var bt=S.w[A.cast[o.betray]];if(bt){bt.align='F';bt.tw=S.week;A.cast.traitor=bt.id;relBump(S,bt.id,A.cast.lead,{bond:-40},{k:'betray',keep:true,t:bt.name+' turned on '+S.w[A.cast.lead].name+'.'});$L.note(S,'A betrayal',bt.name+' turns on '+S.w[A.cast.lead].name+'.','good');}}
  if(o.fire){var fw=S.w[A.cast[o.fire]];if(fw){fw.away=S.week+4;youRemember(S,fw,'fired','Fired on screen for the story, off TV for four weeks.',-1);$L.note(S,'Fired on screen',fw.name+' is off television for four weeks.','bad');}}
  if(o.split)arcSplit(S,P,A,o.split);
  if(o.turn){var t=arcFaces(S).filter(function(w){return Object.keys(A.cast).every(function(r){return A.cast[r]!==w.id;});})[0];if(t){t.align='H';t.tw=S.week;A.cast.turn=t.id;youRemember(S,t,'arcturn','You turned them for '+K.n.toLowerCase()+'.',-1);$L.note(S,'A turn',t.name+' joins '+S.w[A.cast.lead].name+'.','good');}}
  if(o.room)rosterOf(S,P.id).forEach(function(w){if(!w.nw)w.morale=clamp(w.morale+(o.room>0?3:-3),0,100);});
  Object.keys(A.cast).forEach(function(r){var w=S.w[A.cast[r]];if(w)youRemember(S,w,'arcch',arcFill(S,A,o.n)+'.',o.s>=6?1:(o.s<0?-1:0));});
  return arcFill(S,A,o.n)+'. '+arcWord(A.s)+'.';
};
/* every show with the arc's people at the top of the card keeps it going */
SHOWX.push(function(S,P,show,rep,card){
  var A=S.arc;if(S.cal||P.id!==S.player||!A||A.done)return;
  var last=card&&card[card.length-1],ids=last?flat(last.sides):[],on=Object.keys(A.cast).some(function(r){return ids.indexOf(A.cast[r])>=0;});
  // once a week: at the top of the card it keeps warm (only up to the middle: the choices decide whether it lands), away it cools
  if(A.wk!==S.week){A.wk=S.week;if(on){if(A.s<50)A.s=clamp(A.s+0.5,0,50);}else A.s=clamp(A.s-1,0,100);}
  if(!show.flag||S.week<A.end)return;
  // the payoff
  var K=$L.ARCS[A.k],sc=A.s+(A.allin?(repCS(rep)>=70?8:-8):0),res,img=0,tr=0,bp=0;
  if(K.over){var hw=S.w[A.cast[K.over]],won=hw&&(rep.segs||[]).some(function(g){return g.k==='match'&&g.win&&g.win.indexOf(hw.name)>=0;});sc+=won?10:-10;rep.over=won;}
  if(sc<35&&A.saved)sc=35;
  if(sc>=60){res='paid off';img=3;tr=4;bp=3;}else if(sc>=35){res=A.saved?'was saved':'landed';img=A.saved?1:1;tr=A.saved?1:2;bp=1;}else{res='flopped';img=-2;tr=-3;}
  P.image=clamp(P.image+img,1,100);if(!S.owner.me)S.owner.trust=clamp(S.owner.trust+tr,0,100);S.bp=(S.bp||0)+bp;
  Object.keys(A.cast).forEach(function(r){var w=S.w[A.cast[r]];if(w)youRemember(S,w,'arcend',K.n+' '+res+' at the flagship.',img>0?2:(img<0?-2:0));});
  A.done=1;A.res=res;(S.arcs||(S.arcs=[])).push({k:A.k,n:K.n,res:res,y:cal(S.week).label});S.arc=null;
  rep.arc=K.n+' '+res+'.';
  $L.news(S,'story',K.n+' '+res+' at '+show.name+'.');$L.note(S,'The arc',K.n+' '+res+'.',img>0?'good':(img<0?'bad':''));
});

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.arcHeels = arcHeels;
$L.arcFaces = arcFaces;
$L.ARCS = ARCS;
$L.arcFill = arcFill;
$L.arcEnd = arcEnd;
$L.arcWord = arcWord;
$L.arcSplit = arcSplit;
