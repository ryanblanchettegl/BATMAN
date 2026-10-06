/* ---------- booking power on the Storylines page ----------
   Ryan, 6 October: "Storylines will also start interacting with booking points and you can use booking points to
   do various things on the Storylines screen besides start the top feud. Like tag team break up, push a wrestler,
   buy budget pre-tape angle/promo that auto adds itself to the next show based on where you say it goes on this
   screen. Like start of the show, mid show, end of show."
   Three things booking power buys here. Each is one entry in PLOT, so more can be added:
     split   a regular tag team breaks up, and the two of them are a rivalry
     push    the office gets behind one wrestler: momentum now, and the ones near them notice
     tape    a cheap pre-taped promo or angle goes onto the next show's run sheet by itself, at the start, the
             middle or the end. It is marked tape:1 so a suggested card keeps it.
   What each does to people goes through relBump() and youRemember(). */
var PLOT_PUSH_CD=8,PLOT_TAPE={interview:'A pre-taped interview',callout:'A pre-taped call-out',ambush:'A pre-taped attack'},PLOT_POS={start:['Start of the show',0],mid:['Middle of the show',2],end:['End of the show',99]};
var PLOT={
  split:{n:'Break up a tag team',cost:2,d:'One of them turns on the other. The team is gone and the two of them are a rivalry that starts hot.'},
  push:{n:'Push a wrestler',cost:2,d:'The office gets behind them: wins come easier and the crowd is told they matter. The ones next to them on the card will notice.'},
  tape:{n:'Buy a budget pre-tape',cost:1,d:'A cheap promo or angle shot in advance. It adds itself to your next show where you say. Five minutes, and it never looks as good as live.'}
};
function plotTeams(S,P){return S.teams.filter(function(t){if(t.promo!==P.id||t.m.length!==2)return false;var a=S.w[t.m[0]],b=S.w[t.m[1]];return a&&b&&a.promo===P.id&&b.promo===P.id&&!a.nw&&!b.nw&&!feudOf(S,a.id,b.id);});}
function plotPushable(S,P){return rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt&&!(w.inj>0)&&!(S.lcd&&S.lcd['pu'+w.id]!=null&&S.week-S.lcd['pu'+w.id]<PLOT_PUSH_CD);}).sort(function(a,b){return b.ovr-a.ovr;});}
function plotTapeOn(S){return segRead(S).filter(function(sg){return sg.tape;});}
E.plotInfo=function(S){
  var P=S.promos[S.player],show=S.queue[S.qi]||null,tp=plotTapeOn(S)[0]||null;
  return {bp:S.bp,acts:Object.keys(PLOT).map(function(k){var A=PLOT[k];return {id:k,n:A.n,cost:A.cost,d:A.d,can:S.bp>=A.cost};}),
    teams:plotTeams(S,P).map(function(t){var a=S.w[t.m[0]],b=S.w[t.m[1]];return {id:t.id,a:a.id,b:b.id,n:a.name+' & '+b.name};}),
    push:plotPushable(S,P).slice(0,40).map(function(w){return {id:w.id,n:w.name+' · '+Math.round(w.ovr)};}),
    show:show?show.name:null,kinds:Object.keys(PLOT_TAPE).map(function(k){return {id:k,n:PLOT_TAPE[k],two:k!=='interview'};}),pos:Object.keys(PLOT_POS).map(function(k){return {id:k,n:PLOT_POS[k][0]};}),
    taped:tp?{label:segLabel(S,tp),at:tp.at||'start',where:PLOT_POS[tp.at||'start'][0]}:null};
};
/** Who a pre-tape can use, role by role, for the show that is next. */
E.plotTapeWho=function(S,kind,who){return E.segChoices(S,kind,who||[],-1);};
E.plotDo=function(S,id,o){
  var A=PLOT[id],P=S.promos[S.player];o=o||{};
  if(!A)return {ok:false,msg:'That is not something booking power buys.'};
  if(S.bp<A.cost)return {ok:false,msg:A.n+' takes '+A.cost+' booking power. You have '+S.bp+'.'};
  var msg='';
  if(id==='split'){
    var t=plotTeams(S,P).filter(function(x){return x.id===+o.team;})[0];if(!t)return {ok:false,msg:'Pick a regular team first.'};
    var a=S.w[t.m[0]],b=S.w[t.m[1]],who=o.who!=null&&+o.who===b.id?b:(o.who!=null&&+o.who===a.id?a:(a.morale<=b.morale?a:b)),other=who===a?b:a;
    dissolveTeam(S,t);var f=startFeud(S,P,who,other,48,who.name+' turned on '+other.name,{force:true});
    if(who.align!=='H'){who.align='H';}if(other.align==='H'&&who.align==='H')other.align='F';
    relBump(S,who.id,other.id,{bond:-30},{k:'split',keep:true,t:who.name+' turned on '+other.name+' and ended the team.',by:'you'});
    youRemember(S,other,'split','You broke up their team and had '+who.name+' turn on them.',-4);youRemember(S,who,'splitup','You broke up the team and gave them the turn.',4);
    news(S,'story',who.name+' has turned on '+other.name+'. The team is finished, and the rivalry starts now.');
    msg=who.name+' turns on '+other.name+'. The team is gone, and '+who.name+' against '+other.name+' is a rivalry that starts hot.';
  }else if(id==='push'){
    var w=plotPushable(S,P).filter(function(x){return x.id===+o.w;})[0];if(!w)return {ok:false,msg:'Pick somebody who can be pushed right now. One push in eight weeks for each wrestler.'};
    (S.lcd=S.lcd||{})['pu'+w.id]=S.week;w.mom=clamp((w.mom||0)+3,-10,10);w.morale=clamp(w.morale+6,0,100);addOvr(P,w,0.6);
    youRemember(S,w,'pushed','You put the office behind them.',8);
    rosterOf(S,P.id).filter(function(x){return !x.nw&&x.id!==w.id&&x.g===w.g&&Math.abs(x.ovr-w.ovr)<=6;}).sort(function(x,y){return y.ovr-x.ovr;}).slice(0,2).forEach(function(x){relBump(S,x.id,w.id,{ja:8},{k:'pushed',t:x.name+' watched the office get behind '+w.name+'.'});});
    news(S,'story',P.name+' is getting behind '+w.name+'.');
    msg='The office is behind '+w.name+': momentum now, and the crowd is told they matter. Book them to win, or it is wasted.';
  }else if(id==='tape'){
    var show=S.queue[S.qi];if(!show)return {ok:false,msg:'Every show this week has run. Buy it when there is a show to put it on.'};
    if(plotTapeOn(S).length)return {ok:false,msg:'There is already a pre-tape on '+show.name+'. One a show.'};
    if(!PLOT_TAPE[o.k]||!PLOT_POS[o.at])return {ok:false,msg:'Pick what it is and where it goes.'};
    var r=E.setSeg(S,-1,{k:o.k,who:(o.who||[]).map(function(x){return +x;}),pos:PLOT_POS[o.at][1],len:'S'});if(!r.ok)return {ok:false,msg:r.msg};
    var sg=segList(S)[r.slot];sg.tape=1;sg.at=o.at;sg.mod=-4;
    msg=PLOT_TAPE[o.k]+' is on the run sheet for '+show.name+', at the '+PLOT_POS[o.at][0].toLowerCase().replace(' of the show','')+' of the show: '+segLabel(S,sg)+'. Five minutes of the show’s time.';
  }
  S.bp-=A.cost;
  return {ok:true,msg:msg+' ('+A.cost+' booking power.)'};
};
/* a suggested card keeps the pre-tape that was paid for */
(function(){
  var sug=E.suggest;
  E.suggest=function(S){
    var keep=plotTapeOn(S).map(function(sg){return JSON.parse(JSON.stringify(sg));}),card=sug(S);
    if(keep.length&&!plotTapeOn(S).length){var L=segList(S),busy={};keep.forEach(function(sg){sg.who.forEach(function(id){busy[id]=1;});});
      for(var i=L.length-1;i>=0;i--)if(L[i].who&&L[i].who.some(function(id){return busy[id];}))L.splice(i,1);
      keep.forEach(function(sg){L.push(sg);});E.fitShow(S,card);}
    return card;
  };
})();
