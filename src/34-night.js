/* ---------- what the night left behind ----------
   Ryan, 4 October: "After a show, it should go back to the Office or your desk, so you can work through any new
   events or decisions that need to be made after the show." A show does not end on its report. It ends on the
   desk, with whatever the night left there (docs/design.md, sections 2a and 2c).
   When the show goes on the air the engine notes how everybody stood (S.live.n0). When it goes off, the difference
   is filed with the report as rep.left: the gate, the television number, who got hurt, whose mood moved, what
   people will remember, and what the writers thought. E.afterShow(S) lays it out for the desk, one line each,
   with the detail for a pop-up. Nothing here uses rnd(S): it only reads the night. */
(function(){
  var begin=E.liveBegin;
  E.liveBegin=function(S,card){
    var r=begin(S,card);
    if(r&&r.ok&&S.live){var n0={inj:{},mor:{},notes:[]};rosterOf(S,S.player).forEach(function(w){n0.inj[w.id]=w.inj||0;n0.mor[w.id]=w.morale;});S.live.n0=n0;}
    return r;
  };
})();
/** note() calls this while a show is on the air, so the report keeps what the notification bar said. */
function nightNote(S,head,text,kind){var L=S.live;if(L&&L.n0&&L.n0.notes.length<40)L.n0.notes.push({h:head,t:text||'',k:kind||''});}
function nightWriters(S,P,rep,card){
  var out=[],ms=rep.segs.filter(function(s){return s.k==='match';}),talk=rep.segs.filter(function(s){return s.k!=='match';}),on={};
  rep.segs.forEach(function(s){(s.ids||[]).forEach(function(id){on[id]=1;});});
  var bt=talk.slice().sort(function(a,b){return b.ov-a.ov;})[0],wt=talk.slice().sort(function(a,b){return a.ov-b.ov;})[0];
  if(bt&&bt.ov>=rep.exp)out.push({x:'The writers want to follow this up next week ('+starG(bt.ov)+'): '+(bt.text||bt.head||'the best talking segment of the night'),s:1});
  if(wt&&wt!==bt&&wt.ov<rep.exp-8)out.push({x:'This did not get across ('+starG(wt.ov)+'), and the writers would rework it or drop it: '+(wt.text||wt.head||'the weakest talking segment of the night'),s:-1});
  // an act lower on the card that the crowd took to
  var under=ms.slice(0,-1).filter(function(s){return s.cr>=((ms[ms.length-1]||{}).cr||0)&&s.cr>=65&&s.win;}).sort(function(a,b){return b.cr-a.cr;})[0];
  if(under)out.push({x:'The crowd took to '+under.win+' tonight, louder than for the main event. The writers want them higher on the card.',s:1});
  // the hottest feud that was left off the show
  var f=S.feuds.filter(function(q){return !q.res&&q.promo===P.id&&q.heat>=50&&!q.a.concat(q.b).some(function(id){return on[id];})&&q.a.concat(q.b).every(function(id){return S.w[id]&&S.w[id].promo===P.id&&!(S.w[id].inj>0);});}).sort(function(a,b){return b.heat-a.heat;})[0];
  if(f)out.push({x:names(f.a.map(function(id){return S.w[id];}))+' against '+names(f.b.map(function(id){return S.w[id];}))+' was not on the show, and it is hot. The writers want it back next week before it cools.',s:-1});
  if(!out.length)out.push({x:'The writers have nothing to add. The show did what it was written to do.',s:0});
  return out;
}
SHOWX.push(function(S,P,show,rep,card){
  var L=S.live;if(P.id!==S.player||!L||!L.n0)return;
  var n0=L.n0,hurt=[],mood=[];
  rosterOf(S,P.id).forEach(function(w){
    if(w.inj>0&&!(n0.inj[w.id]>0)){var t=P.titles.filter(function(x){return x.holders.indexOf(w.id)>=0;})[0];hurt.push({id:w.id,weeks:w.inj,belt:t?t.name:null});}
    if(n0.mor[w.id]!=null){var d=Math.round(w.morale-n0.mor[w.id]);if(Math.abs(d)>=4)mood.push({id:w.id,d:d});}
  });
  mood.sort(function(a,b){return Math.abs(b.d)-Math.abs(a.d);});
  var sh=!show.big&&typeof airRec==='function'?airRec(P,show.id):null;
  rep.left={key:L.key,gate:{att:rep.att,cap:rep.cap,sold:rep.sellout,money:rep.gate},tv:{v:rep.viewers,was:sh&&sh.va?Math.round(sh.va):null,buys:rep.buys||0},
    hurt:hurt,mood:mood.slice(0,8),notes:n0.notes.slice(),writers:nightWriters(S,P,rep,card)};
});
/** The desk after a show: what the last show of this week left behind, one line each, with the detail for a pop-up.
    Null before the first show of a week has run. */
E.afterShow=function(S){
  var rep=null,i;for(i=0;i<S.reports.length;i++){if(S.reports[i].week===S.week&&S.reports[i].left){rep=S.reports[i];break;}}
  if(!rep)return null;
  var L=rep.left,seen=(S.nightSeen&&S.nightSeen.key===L.key&&S.nightSeen.k)||{},items=[],nm=function(id){return S.w[id]?S.w[id].name:'Somebody';};
  var add=function(k,n,line,detail,tone){items.push({k:k,n:n,line:line,detail:detail,tone:tone||'',seen:!!seen[k]});};
  var v=E.showVerdict(rep.rating,rep.exp),g=L.gate,empty=g.cap-g.att,pct=g.cap?g.att/g.cap:1;
  // trouble first
  if(L.hurt.length)add('hurt',L.hurt.length===1?'One injury':L.hurt.length+' injuries',L.hurt.map(function(h){return nm(h.id)+', '+h.weeks+' '+(h.weeks===1?'week':'weeks')+(h.belt?' (holds the '+h.belt+')':'');}).join('. ')+'.',
    L.hurt.map(function(h){return nm(h.id)+' is out for '+h.weeks+' '+(h.weeks===1?'week':'weeks')+'.'+(h.belt?' They hold the '+h.belt+': it cannot be defended until they are back, or it has to change hands another way.':'')+' Anything booked for them needs a new plan.';}),'bad');
  var down=L.mood.filter(function(m){return m.d<0;}),up=L.mood.filter(function(m){return m.d>0;}),rel=L.notes.filter(function(n){return n.h;});
  if(down.length||up.length||rel.length){
    var d=[];down.forEach(function(m){d.push(nm(m.id)+' went home unhappy.');});up.forEach(function(m){d.push(nm(m.id)+' went home in a better mood.');});rel.forEach(function(n){d.push(n.h+(n.t?': '+n.t:'')+(/[.!?]$/.test(n.t||n.h)?'':'.'));});
    add('room','The locker room',(down.length?down.length+' went home unhappy':'Nobody went home unhappy')+(up.length?', '+up.length+' in a better mood':'')+(rel.length?'. '+rel.length+' '+(rel.length===1?'thing':'things')+' people will remember':'')+'.',d,down.length?'bad':(up.length?'good':''));
  }
  add('gate','The gate',g.sold?'Sold out: '+g.att.toLocaleString('en-US')+' tickets, every one there was.':g.att.toLocaleString('en-US')+' tickets sold of '+g.cap.toLocaleString('en-US')+'. '+empty.toLocaleString('en-US')+' seats were empty.',
    [g.att.toLocaleString('en-US')+' tickets sold of '+g.cap.toLocaleString('en-US')+' in the '+rep.venue+'.',g.sold?'A sell-out. A bigger building would have sold more.':(pct>=0.85?'A healthy house. The empty seats did not show on television.':(pct>=0.6?'A soft house. The camera had to stay off parts of the building.':'A poor house. It looked empty on television, and the crowd was quieter for it.')),'The gate was '+money(g.money)+'.'],g.sold?'good':(pct<0.6?'bad':''));
  var t=L.tv,tl=(t.v/1e6).toFixed(2)+'M watched'+(t.was?(t.v>t.was*1.01?', up on the show’s recent run':(t.v<t.was*0.99?', down on the show’s recent run':', level with the show’s recent run')):'')+'.';
  add('tv',rep.big?'Buys and viewers':'Television',rep.big?t.buys.toLocaleString('en-US')+' bought the event.':tl,
    (rep.big?[t.buys.toLocaleString('en-US')+' homes bought '+rep.name+'.']:[tl.charAt(0).toUpperCase()+tl.slice(1)].concat(rep.net?['It went out on '+rep.net+'.']:[])).concat(t.was&&!rep.big?['The show’s recent run is about '+(t.was/1e6).toFixed(2)+'M. A growing audience is one of the things that builds a show’s standing.']:[]).concat(['Numbers by kind of viewer are not counted yet.']),t.was&&t.v<t.was*0.99?'bad':(t.was&&t.v>t.was*1.01?'good':''));
  add('writers','The writers',L.writers[0].x,L.writers.map(function(w){return w.x;}),L.writers.some(function(w){return w.s<0;})?'bad':'');
  if(rep.sheet&&rep.sheet.lines&&rep.sheet.lines.length)add('sheet','The dirt sheet',rep.sheet.lines[0],rep.sheet.lines.slice(),'');
  var mt=null;if(L.matter!=null)S.inbox.forEach(function(e){if(e.id===L.matter)mt={id:e.id,text:e.text,done:!!e.done,result:e.result||''};});
  return {key:L.key,name:rep.name,grade:gradeG(rep.rating),head:v.head,line:v.line,matter:mt,items:items,unseen:items.filter(function(x){return !x.seen;}).length,left:S.queue.length-S.qi};
};
/** The booker has looked at one of the things the night left. */
E.nightSeen=function(S,k){var A=E.afterShow(S);if(!A)return;if(!S.nightSeen||S.nightSeen.key!==A.key)S.nightSeen={key:A.key,k:{}};S.nightSeen.k[k]=1;};

/* ---------- the night ends on a named problem ----------
   Rule 7a: the Show hands the Office something unresolved. One matter at most from each show goes into the inbox,
   so it has to be answered before the week can end: a champion who got hurt, somebody who went home furious, or
   an act lower on the card that the crowd took to. Each is caused by the night, never by chance, and each answer
   is remembered (youRemember). A person is not the subject of one twice in eight weeks (S.lcd). */
var NIGHT_CD=8,NIGHT_OUT=2,NIGHT_FURY=5;
function nightFree(S,k,id){var c=S.lcd&&S.lcd[k+id];return (c==null||S.week-c>=NIGHT_CD)&&!hasQuest(S,id);}
function nightMark(S,k,id){(S.lcd=S.lcd||{})[k+id]=S.week;}
function nightMatter(S,P,rep){
  var L=rep.left,i,w,t;
  for(i=0;i<L.hurt.length;i++){w=S.w[L.hurt[i].id];t=w&&P.titles.filter(function(x){return x.holders.indexOf(w.id)>=0;})[0];
    if(w&&t&&w.inj>=NIGHT_OUT&&nightFree(S,'nc',w.id)){nightMark(S,'nc',w.id);
      return {type:'champout',w:w.id,tid:t.id,weeks:w.inj,text:w.name+' was hurt on '+rep.name+' and is out for '+w.inj+' weeks. They hold the '+t.name+'. The belt cannot be defended until they are back.',
        choices:['Vacate the '+t.name,'Keep the belt on them until they are back']};}}
  var down=L.mood.filter(function(m){return m.d<=-NIGHT_FURY&&S.w[m.id]&&S.w[m.id].promo===P.id&&!(S.w[m.id].inj>0)&&nightFree(S,'nf',m.id);})[0];
  if(down){w=S.w[down.id];nightMark(S,'nf',w.id);var bonus=Math.max(500,Math.round(w.wage*2/100)*100);
    return {type:'furious',w:w.id,bonus:bonus,text:w.name+' went home furious after '+rep.name+'. If it is left alone it will not stay between the two of you.',
      choices:['Talk to them tonight','Promise them a win within two weeks','Pay them a bonus of '+money(bonus),'Let them cool off'],
      checks:{0:mkCheck(8,[{n:'Where you stand with them',v:youLean(S,w)},{n:'Their morale is '+Math.round(w.morale),v:w.morale<35?-1:0}].concat(skillMods(S,'talk')))}};}
  var ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1],hot=ms.slice(0,-1).filter(function(s){return main&&s.cr>=main.cr-4&&s.cr>=58&&s.win&&s.wi&&s.wi.length===1;}).sort(function(a,b){return b.cr-a.cr;})[0];
  if(hot){w=S.w[hot.wi[0]];
    if(w&&w.promo===P.id&&holdLvl(P,w.id)===0&&!(w.inj>0)&&nightFree(S,'nh',w.id)){nightMark(S,'nh',w.id);
      return {type:'caughtfire',w:w.id,text:'The crowd took to '+w.name+' on '+rep.name+', as loud as anything on the show. The writers say this does not last if nothing is done with it.',
        choices:['Promise them a win within two weeks, and build on it','Not yet. Let it grow by itself']};}}
  // the match of the night, between two people with no story yet
  var best=ms.filter(function(q){return q.ids&&q.ids.length===2&&q.win&&q.ov>=rep.rating+5&&q.ov>=70;}).sort(function(x,y){return y.ov-x.ov;})[0];
  if(best){var a=S.w[best.ids[0]],b=S.w[best.ids[1]];
    if(a&&b&&a.promo===P.id&&b.promo===P.id&&!(a.inj>0)&&!(b.inj>0)&&!feudOf(S,a.id,b.id)&&activeFeuds(S).length<8&&nightFree(S,'nr',a.id)&&nightFree(S,'nr',b.id)){nightMark(S,'nr',a.id);nightMark(S,'nr',b.id);
      return {type:'rematch',w:a.id,o:b.id,ov:best.ov,text:a.name+' against '+b.name+' was the match of the night on '+rep.name+' ('+starG(best.ov)+'), and there is no story between them. People are already asking to see it again.',
        choices:['Make it a rivalry','Leave it as one great night']};}}
  return null;
}
EVR.rematch=function(S,ev,choice,P,w,o){
  if(!w||!o||w.promo!==P.id||o.promo!==P.id)return 'One of them is no longer with the company.';
  if(choice===0){var f=startFeud(S,P,w,o,45,'It began with the match of the night',{});if(!f)return 'There are too many rivalries running already. This one will have to wait.';
    [w,o].forEach(function(x){x.morale=clamp(x.morale+4,0,100);youRemember(S,x,'program','You saw what they had together and built a rivalry on it.',5);});
    return w.name+' against '+o.name+' is a rivalry now, and it starts warm. It is on the Storylines page.';}
  return 'You leave it as one great night. Nobody is unhappy, and nothing is built.';
};
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||!rep.left||S.cal)return;
  var ev=nightMatter(S,P,rep);if(!ev)return;
  ev.night=rep.left.key;pushEv(S,ev);rep.left.matter=ev.id;
  note(S,'On your desk',ev.text.split('. ')[0]+'.','bad');
});
function nightWin(S,w){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+2,text:'Promise: book a win for '+w.name+' by '+cal(S.week+2).label});}
EVR.champout=function(S,ev,choice,P,w){
  var t=titleById(P,ev.tid);if(!w||!t||t.holders.indexOf(w.id)<0)return 'The belt has already moved on.';
  if(choice===0){
    vacateFor(S,P,w,'injury');w.morale=clamp(w.morale-8,0,100);youRemember(S,w,'stripped','You took the '+t.name+' off them while they were hurt.',-10);
    return 'The '+t.name+' is vacant. Crown a new champion with a tournament on the Titles page, or book a match for it. '+w.name+' heard about it from a hospital bed.';
  }
  var cost=Math.min(6,ev.weeks||3);t.prestige=clamp(t.prestige-cost,0,100);w.morale=clamp(w.morale+6,0,100);youRemember(S,w,'keptbelt','You kept the '+t.name+' on them while they were hurt.',8);
  return w.name+' keeps the '+t.name+'. A belt nobody can fight for means a little less every week: it has lost some of its standing. '+w.name+' will not forget that you waited.';
};
EVR.furious=function(S,ev,choice,P,w){
  if(!w||w.promo!==P.id)return 'They are no longer with the company.';
  if(choice===0){var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){w.morale=clamp(w.morale+9,0,100);youRemember(S,w,'talked','You came and found them the same night and heard them out.',6);return rollText(r)+'You hear '+w.name+' out. They leave the building calmer than they arrived at your door.';}
    w.morale=clamp(w.morale-3,0,100);youRemember(S,w,'talkedbad','You tried to talk them round after a bad night, and it made it worse.',-4);return rollText(r)+w.name+' did not want to be managed tonight. It is a little worse than before.';}
  if(choice===1){nightWin(S,w);w.morale=clamp(w.morale+6,0,100);return 'You promised a win. '+w.name+' will hold you to it.';}
  if(choice===2){if(P.cash<ev.bonus)return 'There is not the money for that.';P.cash-=ev.bonus;w.morale=clamp(w.morale+10,0,100);youRemember(S,w,'paid','You paid them a bonus after a bad night.',3);return w.name+' takes the '+money(ev.bonus)+'. It helps. It also teaches them what a bad mood is worth.';}
  w.morale=clamp(w.morale-2,0,100);stressAdd(S,w,6);youRemember(S,w,'ignored','They went home furious and you said nothing.',-6);
  return 'You leave it. '+w.name+' notices that nobody came.';
};
EVR.caughtfire=function(S,ev,choice,P,w){
  if(!w||w.promo!==P.id)return 'They are no longer with the company.';
  if(choice===0){nightWin(S,w);w.mom=clamp((w.mom||0)+2,-10,10);w.morale=clamp(w.morale+6,0,100);youRemember(S,w,'backed','You saw the crowd take to them and backed it straight away.',8);
    return 'You gave your word: a win for '+w.name+' within two weeks. They have momentum now, and they know you noticed.';}
  w.morale=clamp(w.morale-3,0,100);youRemember(S,w,'waited','The crowd took to them and you did nothing with it.',-3);
  return 'You wait. '+w.name+' heard that crowd too, and wonders what it takes.';
};
