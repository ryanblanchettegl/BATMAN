/* ---------- The ADVANCE button: what the week needs next ----------
   One button, always in the same place (top right), big, one or two words: the next thing that needs the booker. It guides: for a
   decision it says where to go, and the screen takes the player there. It only acts for the two things that are a
   single press already: running the show and ending the week. When this week's tasks (src/95-tasks.js) are in the
   way it says only "Attention" and leads to the desk, where the list is. The desk also shows what is coming up (the
   nearest countdowns), so there is always something about to pay off. The research is in docs/plans/advance-button.md.
   Everything here only reads the game. It can be called on every redraw. */
var ADV_DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
/** The day a show is on, from its name ("Wednesday Night Folio"). A big event is a Sunday. */
function showDay(sh){
  if(!sh)return '';
  for(var i=0;i<ADV_DAYS.length;i++)if(sh.name.indexOf(ADV_DAYS[i])>=0)return ADV_DAYS[i];
  return sh.big?'Sunday':'';
}
/** The next step of the week.
    short: the one or two words on the button. label: the same thing as a sentence, for the note under the button.
    k: 'task' (something needs attention: the button says only "Attention", and `why` lists everything in the way), 'book' (the card needs building or fixing), 'pre' (a problem before the bell),
       'run' (the card is ready), 'week' (end the week), 'over'.
    to: the page to go to. act: 'run' or 'week' when one press does it. why: what is in the way, in words. */
E.advance=function(S){
  if(S.over)return {k:'over',short:'',label:'The game is over',to:'desk',act:null,why:[],day:'',step:0,steps:0};
  var T=E.tasks(S),todo=T.list.filter(function(t){return t.state==='todo';}),strict=T.strict,sh=S.queue[S.qi],n=S.queue.length;
  var steps=n+1,step=Math.min(S.qi,n)+1,out=function(o){o.why=o.why||[];o.act=o.act||null;o.step=step;o.steps=steps;return o;};
  if(sh){
    var day=showDay(sh);
    var hold=strict?todo.filter(function(t){return t.gate==='show'&&!t.card;}):[];
    if(hold.length)return out({k:'task',short:'Attention',id:hold[0].id,label:hold[0].short,to:'desk',day:'Before '+sh.name,why:hold.map(function(t){return t.text;})});
    if(S.pre&&S.pre.key===showKey(S)&&!S.pre.done)return out({k:'pre',short:'Attention',label:'Answer the problem before the show',to:'booking',day:day,why:['Something has come up before '+sh.name+'. It is at the top of the card.']});
    var card=S.card||[];
    if(!card.length)return out({k:'book',short:'Book show',label:'Book '+sh.name,to:'booking',day:day});
    var v=E.validate(S,card);
    if(v.errors.length)return out({k:'book',short:'Fix card',label:'Finish the card for '+sh.name,to:'booking',day:day,why:v.errors.slice(0,3)});
    var onCard=strict?todo.filter(function(t){return t.gate==='show'&&t.card;}):[];
    if(onCard.length)return out({k:'task',short:'Attention',id:onCard[0].id,label:onCard[0].short,to:'desk',day:day,why:onCard.map(function(t){return t.text;})});
    return out({k:'run',short:'Run show',label:'Run '+sh.name,to:'booking',act:'run',day:day});
  }
  var open=S.inbox.some(function(e){return !e.done;});
  if(open){var ib=todo.filter(function(t){return t.id==='inbox';})[0];return out({k:'task',short:'Attention',id:'inbox',label:ib?ib.short:'Answer the inbox',to:'desk',day:'The week is nearly over',why:[ib?ib.text:'The inbox needs an answer.']});}
  if(strict&&todo.length)return out({k:'task',short:'Attention',id:todo[0].id,label:todo[0].short,to:'desk',day:'The week is nearly over',why:todo.map(function(t){return t.text;})});
  return out({k:'week',short:'End week',label:'End the week',to:'desk',act:'week',day:'Sunday night'});
};
/** What is coming up: the nearest countdowns, soonest first, never more than three. n is weeks away (0 is this week). */
E.comingUp=function(S){
  if(S.over)return [];
  var P=S.promos[S.player],L=[],wk=function(n){return n<=0?'this week':(n===1?'next week':'in '+n+' weeks');};
  var nb=E.nextBig(S);L.push({n:nb.week-S.week,t:nb.name+' '+wk(nb.week-S.week),to:'booking',k:'big'});
  var fs=activeFeuds(S).filter(function(f){return f.promo===P.id;}).sort(function(a,b){return b.heat-a.heat;});
  fs.slice(0,6).forEach(function(f){
    var act=feudAct(f),big=nb.week-S.week;
    if(f.heat>=60&&big<=2)L.push({n:big,t:feudLabel(S,f)+' is ready to end at '+nb.name,to:'storylines',k:'feud'});
    else if(act<3&&(f.heat>=52&&f.heat<60||f.heat>=24&&f.heat<30))L.push({n:1,t:feudLabel(S,f)+' is one good show from its next act',to:'storylines',k:'feud'});
  });
  var c=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.con!=null&&w.con>=2&&w.con<=6;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
  if(c)L.push({n:c.con,t:c.name+'’s contract ends '+wk(c.con),to:'roster',k:'con'});
  S.quests.filter(function(q){return q.due!=null&&q.due>S.week&&q.due-S.week<=4;}).sort(function(a,b){return a.due-b.due;}).slice(0,1).forEach(function(q){L.push({n:q.due-S.week,t:'A promise is due '+wk(q.due-S.week),to:'desk',k:'q'});});
  var ye=48-((S.week-1)%48)-1;if(ye<=4)L.push({n:ye,t:'The year-end awards are '+wk(ye),to:'history',k:'year'});
  if(S.scn&&!S.scn.done)L.push({n:S.scn.weeks-S.week,t:'The scenario ends '+wk(S.scn.weeks-S.week),to:'desk',k:'scn'});
  if(S.chal&&!S.chal.done)L.push({n:S.chal.weeks-S.week,t:'The challenge ends '+wk(S.chal.weeks-S.week),to:'desk',k:'chal'});
  var seen={};
  return L.filter(function(x){if(x.n<0||seen[x.t])return false;seen[x.t]=1;return true;}).sort(function(a,b){return a.n-b.n||(a.k==='big'?-1:1);}).slice(0,3);
};
