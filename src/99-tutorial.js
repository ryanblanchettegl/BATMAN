/* wraps: 00-core.js (it must sort after them; test-buildorder.js checks) */
/* The first show is the tutorial (Ryan, 21 October). A new game opens in the week of the company's biggest show of
   the year (E.newGame with start: 'flag', src/00-core.js), with only that show to book. The card is not empty: a
   match was promised before the booker arrived (a lock, src/99-tale.js), and the arc that has run all year is at its
   last chapter, booked after the main event, waiting for the booker to decide how it ends. The tutorial asks for every
   champion to be booked in a match for their title (Title matches does that in one press, E.suggestTitles), points at
   the promise and the arc, and has the rest filled to time. Its steps are E.tutInfo(S); the ones that must be done are
   tasks (card: true, no waving them off), so the screens stop for them and a game nobody plays never waits.
   S.tut = {on, show, used: {titles, suggest}}. Nothing here calls rnd(S). */
function tutShowNow(S){return !!(S.tut&&S.tut.on&&S.tut.show===showKey(S));}
/** Titles on this show whose champion can work tonight, and whether each has its match on the card. */
function tutTitles(S,card){
  var P=S.promos[S.player],show=S.queue&&S.queue[S.qi];if(!show)return [];var inE={};eligible(S,P,show).forEach(function(w){inE[w.id]=1;});
  return showTitles(P,show).filter(function(t){return t.holders.length&&t.holders.every(function(id){return inE[id];});}).map(function(t){
    return {id:t.id,n:t.name,on:(card||[]).some(function(m){return m.title===t.id&&t.holders.every(function(id){return flat(m.sides).indexOf(id)>=0;});})};});
}
/** A match for every title on this show that has none on the card: the champion against the best challenger free
    tonight (one with a story with the champion first). Keeps everything already on the card, and locks the matches it
    makes in their places, so Suggest fills the show around them. */
E.suggestTitles=function(S){
  var P=S.promos[S.player],show=S.queue&&S.queue[S.qi];if(!show)return {ok:false,msg:'No show to book.'};
  var card=S.card||(S.card=[]),made=0,full=0,L=tutCands(S,card);
  L.forEach(function(x){
    var used=tutUsed(S,card);if(x.m.sides.some(function(sd){return sd.some(function(id){return used[id];});}))return;   // a challenger taken by a match made just now
    var lenOk=['M','S'].filter(function(l){x.m.len=l;return tutFits(S,card,x.m);})[0];if(!lenOk){full++;return;}x.m.len=lenOk;
    // the top title closes the show when nothing else does; the others go before the main event
    var main=card.length?card[card.length-1]:null;
    if(x.t.lvl>=3&&(!main||!main.title))card.push(x.m);else card.splice(Math.max(0,card.length-(main?1:0)),0,x.m);
    made++;
  });
  if(S.tut&&S.tut.on)(S.tut.used||(S.tut.used={})).titles=1;
  if(made)fitShow(S,card);
  return {ok:made>0,msg:(made?(made===1?'A title match is on the card.':made+' title matches are on the card.')+' Change the challengers if you like.':'Every champion who can work tonight is booked already.')+(full?' '+full+' more '+(full===1?'title does':'titles do')+' not fit: the show has no more room.':'')};
};
/** Who is booked on the card or in the arc tonight. */
function tutUsed(S,card){var used={};card.forEach(function(m){flat(m.sides).forEach(function(id){if(id!=null)used[id]=1;});});segRead(S).forEach(function(sg){if(sg.k==='arc')(sg.who||[]).forEach(function(id){used[id]=1;});});return used;}
/** A title match for every title on this show that has none on the card, most important first: the champion against
    the best challenger free tonight (one with a story with the champion first). */
function tutCands(S,card){
  var P=S.promos[S.player],show=S.queue[S.qi],inE={},el=eligible(S,P,show),used=tutUsed(S,card),held={},out=[];el.forEach(function(w){inE[w.id]=1;});
  P.titles.forEach(function(t){t.holders.forEach(function(id){held[id]=1;});});
  showTitles(P,show).filter(function(t){return t.holders.length&&t.holders.every(function(id){return inE[id];});}).sort(function(a,b){return b.lvl-a.lvl||(a.tag?1:0)-(b.tag?1:0);}).forEach(function(t){
    if(card.some(function(m){return m.title===t.id;}))return;
    if(t.holders.some(function(id){return used[id];}))return;   // the champion is booked already: put the belt on that match by hand
    var ch=t.holders.map(function(id){return S.w[id];}),c0=ch[0],m=null;
    if(t.tag){var tm=S.teams.filter(function(x){return x.promo===P.id&&x.m.length===ch.length&&x.m.every(function(id){return inE[id]&&!used[id]&&!held[id];})&&x.m.indexOf(c0.id)<0;}).sort(function(a,b){return (b.exp||0)-(a.exp||0);})[0];
      if(tm)m={mt:'tag',sides:[ch.map(function(w){return w.id;}),tm.m.slice()],win:-2,call:null,title:t.id,stip:'std',len:'M',lock:1};}
    else{var cs=el.filter(function(w){return !used[w.id]&&!held[w.id]&&w.g===c0.g&&w.id!==c0.id;}).sort(function(a,b){var fa=feudOf(S,a.id,c0.id)?20:0,fb=feudOf(S,b.id,c0.id)?20:0;return (fb+b.ovr+(b.mom||0)*2)-(fa+a.ovr+(a.mom||0)*2);});
      if(cs[0])m={mt:'1v1',sides:[[c0.id],[cs[0].id]],win:-2,call:null,title:t.id,stip:'std',len:'M',lock:1};}
    if(m){out.push({t:t,m:m});m.sides.forEach(function(sd){sd.forEach(function(id){used[id]=1;});});}
  });
  return out;
}
/** Would one more match fit the show: its slots, and its time with a little left for the rest of the night? */
function tutFits(S,card,m){var P=S.promos[S.player],show=S.queue[S.qi],mx=show.big?10:SLOT_MAX[P.slot];if(card.length+1>mx-1)return false;var k=showClock(S,card.concat([m]));return k.total<=k.budget-10;}
/** The tutorial's steps for the show on the desk, or {on: false}. */
E.tutInfo=function(S){
  if(!tutShowNow(S))return {on:false};
  var show=S.queue[S.qi],T=tutTitles(S,S.card),A=E.taleInfo(S),ck=E.clock(S),L=locksNow(S),u=S.tut.used||{};
  var room=tutCands(S,S.card).some(function(x){x.m.len='S';return tutFits(S,S.card,x.m);}),on=T.filter(function(x){return x.on;}).length;
  var steps=[
    {k:'show',t:show.name+' is the biggest show of the year, and it is your first night in charge. Everything you book here goes out with your name on it.',done:true},
    {k:'champs',t:'Book every champion in a match for their title ('+on+' of '+T.length+' booked'+(T.length>6?', or as many as the show has room for':'')+'). Title matches books them, the biggest titles first.',done:T.every(function(x){return x.on;})||(on>0&&!room),act:'titles',need:true},
    {k:'promise',t:L.length?'One match was promised before you arrived: '+lockLabel(S,L[0])+'. It is locked on the card and cannot come off.':'Nothing was promised for tonight.',done:true,act:L.length?'promise':null},
    {k:'arc',t:A.on&&A.tonight?'After the main event the writers end '+A.n.toLowerCase()+'. Open it on the run sheet and decide how it ends.':'There is no arc on tonight’s show.',done:!(A.on&&A.tonight)||A.ch!=null,act:A.on&&A.tonight?'arc':null,need:true},
    {k:'storyline',t:'A match in red is a storyline match: two people in a story together. Each match can also have a guest on commentary and a run-in.',done:true},
    {k:'fill',t:'Fill the rest of the three hours. Suggest fills it around what is there; then change what you like.',done:!ck.over&&!ck.short&&S.card.length>0,act:'suggest'},
    {k:'air',t:'When the steps above are done, the key at the bottom right puts the show on the air.',done:false}
  ];
  return {on:true,show:show.name,steps:steps,left:steps.filter(function(x){return x.need&&!x.done;}).length};
};
TASKX.push(function(S,P,add){var I=E.tutInfo(S);if(!I.on)return;var c=I.steps.filter(function(x){return x.k==='champs';})[0];if(c&&!c.done)add('tut-champs','Your first show: book every champion in a match for their title.','booking','Book',{card:true,waive:false,short:'Book every champion',done:'Every champion is booked.'});});
/* a new game that opens on the flagship: that show alone, the promise on its card, and the year's arc at its ending */
function tutSetup(S){
  var P=S.promos[S.player];S.queue=S.queue.filter(function(sh){return sh.big;});if(!S.queue.length)return;
  S.qi=0;S.card=[];S.segs=[];S.segKey=null;S.tut={on:1,show:showKey(S),used:{}};
  var K=TALES.betrayal,cs=K&&K.cast(S);
  if(cs){
    var T=S.w[cs.a],H=S.w[cs.b],tm=teamOf(S,T);if(tm&&tm.m.indexOf(H.id)>=0)dissolveTeam(S,tm);
    T.align='H';H.align='F';T.tw=S.week-6;
    relBump(S,T.id,H.id,{bond:-45},{k:'arc',keep:true,t:T.name+' turned on '+H.name+'.'});
    var f=startFeud(S,P,H,T,72,T.name+' turned on '+H.name,{force:true});
    taleStart(S,'betrayal',{cast:cs,set:{T:'a',H:'b'},node:'payoff',heat:62,due:S.week,quiet:1,
      hist:[{node:'cracks',ch:0,w:S.week,pre:1},{node:'turn',ch:0,w:S.week,pre:1},{node:'fallout',ch:0,w:S.week,pre:1}]});
    if(f&&S.sa)S.sa.feud=f.id;
    lockAdd(S,{kind:'match',sides:[[H.id],[T.id]],big:1,w:S.week,why:K.n+': '+H.name+' asked for it',arc:1});
  }
  S.saNext=S.week+6;
  SHOWON.forEach(function(fn){fn(S);});
  news(S,'story','This week: '+S.queue[0].name+', the biggest show of the year.');
}
(function(){var ng=E.newGame;E.newGame=function(){var S=ng.apply(this,arguments);if(S&&S.flagStart&&S.promos)tutSetup(S);return S;};})();
/* once the first show is off the air the tutorial is over */
SHOWX.push(function(S,P,show){if(!S.cal&&P.id===S.player&&S.tut&&S.tut.on){S.tut.on=0;S.tut.done=S.week;note(S,'Your first show is done','From here the week is yours: the desk, backstage, and the next show.','good');}});
