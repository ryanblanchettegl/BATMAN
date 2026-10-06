/* This week's tasks: everything on the booker's desk that should be filled in before a show is booked or the week ends.
   A task is done by doing it, or waved off for the week where that is allowed ("Not this week").
   The engine only lists them and answers "may the show run?". The screens do the stopping, so headless games are not held up.
   S.gateOff turns the stopping off for a game (the list stays as reminders).
   Another system adds its own task through the TASKX hook list (declared with the others in src/10-match.js). */
function taskOpen(S){
  var P=S.promos[S.player],L=[],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  var add=function(id,text,to,label,o){o=o||{};L.push({id:id,text:text,short:o.short||text,done:o.done||text,to:to,label:label,gate:o.gate||'show',card:!!o.card,need:o.need!==false,waive:o.waive!==false&&o.need!==false,req:!!o.req});};
  if(S.owner&&S.owner.pending)add('house','The company is yours. Set your house style.','house','Set it',{waive:false,done:'House style set.',short:'Set your house style'});
  var n=S.inbox.filter(function(e){return !e.done;}).length;
  if(n)add('inbox',n+' '+(n===1?'matter':'matters')+' in your inbox '+(n===1?'needs':'need')+' an answer.','desk','Answer',{gate:'week',waive:false,done:'Inbox answered.',short:'Answer the inbox ('+n+')'});
  var D=P.desk||{},spare=(S.voices||[]).filter(function(v){return !v.hired;}).length;
  if(spare){
    if(D.pbp==null)add('desk-pbp','You have not picked a play-by-play voice for the commentary desk.','manage','Assign',{done:'A play-by-play voice is in the chair.',short:'Pick a play-by-play voice'});
    if(D.col==null)add('desk-col','You have not picked a colour voice for the commentary desk.','manage','Assign',{done:'A colour voice is in the chair.',short:'Pick a colour voice'});
  }
  var slots=spMax(P)-S.sponsors.length,can=S.spOffers.filter(function(o){return E.sponsorOk(S,o);}).length;
  // after the first show a sponsor has to be signed, once: it cannot be left for another week (src/96-first.js)
  var needSp=!(S.req&&S.req.sponsor)&&!S.sponsors.length&&S.stats&&S.stats.shows>=1;
  if(slots>0&&can>0)add('sponsors',(needSp?'Your first show is done. Sign your first sponsor: money every week, for a condition you have to keep. ':'')+can+' sponsor '+(can===1?'offer':'offers')+' you could sign, and '+slots+' free '+(slots===1?'slot':'slots')+'.','deals','See offers',{done:'Sponsor offers dealt with.',short:needSp?'Sign your first sponsor':'Sponsor offers ('+can+')',waive:!needSp,req:needSp});
  var T=tournActive(S);
  P.titles.forEach(function(t){
    if(t.holders.length)return;
    if(T&&T.title===t.id)return;
    if((S.card||[]).some(function(m){return m&&m.title===t.id;}))return;
    add('title-'+t.id,'The '+t.name+' '+(t.tag?'are':'is')+' vacant. Book a match for '+(t.tag?'them':'it')+' or start a tournament.','titles','Decide',{card:true,done:'The '+t.name+' '+(t.tag?'are':'is')+' taken care of.',short:'The '+t.name+': vacant'});
  });
  R.filter(function(w){return w.con!=null&&w.con<=1;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,4).forEach(function(w){
    add('con-'+w.id,w.name+'’s contract ends '+(w.con<=0?'this week':'next week')+'. Renew it or let them go.','roster','Decide',{done:w.name+'’s contract is dealt with.',short:w.name+'’s contract ends'});
  });
  // tasks from other systems: TASKX.push(function(S,P,add){ add(id,text,page,label,{gate,waive,need,card,done}); })
  TASKX.forEach(function(fn){fn(S,P,add);});
  // worth doing, never in the way
  var left=S.queue.length-S.qi,ap=E.backstage(S).ap;
  if(ap>0&&left>0)add('ap',ap+' action '+(ap===1?'point':'points')+' to spend backstage before the week is out.','backstage','Go backstage',{need:false,done:'Action points spent.',short:'Action points to spend ('+ap+')'});
  S.quests.filter(function(q){return q.due!=null&&q.due<=S.week;}).slice(0,3).forEach(function(q){add('q-'+q.id,'Due this week: '+q.text,'booking','Booking',{need:false,done:'No longer due: '+q.text,short:'A promise is due this week'});});
  return L;
}
/** The week's list: open tasks first, then what was done or waved off this week. Remembers what it has shown, so a
    task that is finished stays on the list with a tick until the week ends. That memory is bookkeeping, not game state. */
E.tasks=function(S){
  var open=taskOpen(S),seen=S.taskSeen&&S.taskSeen.w===S.week?S.taskSeen:(S.taskSeen={w:S.week,t:{}}),wave=S.taskWave&&S.taskWave.w===S.week?S.taskWave.ids:{},now={},L=[];
  open.forEach(function(t){now[t.id]=1;seen.t[t.id]={text:t.done,need:t.need};var waved=!!wave[t.id]&&t.waive;L.push({id:t.id,text:t.text,short:t.short,to:t.to,label:t.label,gate:t.gate,card:t.card,need:t.need,waive:t.waive,req:!!t.req,state:waved?'waved':(t.need?'todo':'optional')});});
  Object.keys(seen.t).forEach(function(id){if(!now[id])L.push({id:id,text:seen.t[id].text,need:seen.t[id].need,state:'done'});});
  var rank={todo:0,optional:1,waved:2,done:3};
  L.sort(function(a,b){return rank[a.state]-rank[b.state];});
  var todo=L.filter(function(t){return t.state==='todo';});
  return {list:L,todo:todo.length,show:todo.filter(function(t){return t.gate==='show';}).length,strict:!S.gateOff};
};
/** May the card be opened (gate 'book'), the show run (gate 'show') or the week end (gate 'week')? Lists what is still
    in the way. A task that is answered on the card itself (a match for a vacant title) does not stop the card opening. */
E.taskGate=function(S,gate){
  if(S.gateOff||S.over)return {ok:true,left:[]};
  var left=E.tasks(S).list.filter(function(t){return t.state==='todo'&&(gate==='week'||t.gate==='show')&&!(gate==='book'&&t.card);});
  return {ok:!left.length,left:left.map(function(t){return t.text;})};
};
E.taskWave=function(S,id){
  var t=taskOpen(S).filter(function(x){return x.id===id;})[0];
  if(!t)return {ok:false,msg:'That is already done.'};
  if(!t.waive)return {ok:false,msg:'That one cannot wait.'};
  if(!S.taskWave||S.taskWave.w!==S.week)S.taskWave={w:S.week,ids:{}};
  S.taskWave.ids[id]=1;return {ok:true,msg:'Left for another week. It will be back on the list next week if it is still open.'};
};
E.taskUnwave=function(S,id){if(S.taskWave&&S.taskWave.w===S.week)delete S.taskWave.ids[id];return {ok:true,msg:'Back on the list.'};};
/** Whether open tasks stop a show from running and a week from ending (the default), or are only reminders. */
E.setGate=function(S,strict){S.gateOff=!strict;return {ok:true,msg:strict?'This week’s tasks must be done or waved off before a show runs.':'This week’s tasks are reminders only.'};};
