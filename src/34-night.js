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
  (rep.targets||[]).filter(function(t){return !t.ok;}).forEach(function(t,i){add('miss'+i,'Target missed',t.t,[t.t,'Nothing is paid for a target that is missed.'],'bad');});
  var ow=rep.owner;
  if(ow&&!ow.me&&ow.was!=null){var od=Math.round((ow.now-ow.was)*10)/10,ol=S.owner.name+': trust '+(od>0?'up '+od:(od<0?'down '+(-od):'unchanged'))+', now '+Math.round(ow.now)+'.';
    if(od<0||ow.edge)add('owner','The owner',ol,[ow.text].concat(ow.why),ow.edge||od<=-1?'bad':'warn');}
  if(down.length||up.length||rel.length){
    var d=[];down.forEach(function(m){d.push(nm(m.id)+' went home unhappy.');});up.forEach(function(m){d.push(nm(m.id)+' went home in a better mood.');});rel.forEach(function(n){d.push(n.h+(n.t?': '+n.t:'')+(/[.!?]$/.test(n.t||n.h)?'':'.'));});
    add('room','The locker room',(down.length?down.length+' went home unhappy':'Nobody went home unhappy')+(up.length?', '+up.length+' in a better mood':'')+(rel.length?'. '+rel.length+' '+(rel.length===1?'thing':'things')+' people will remember':'')+'.',d,down.length?'bad':(up.length?'good':''));
  }
  add('gate','The gate',g.sold?'Sold out: '+g.att.toLocaleString('en-US')+' tickets, every one there was.':g.att.toLocaleString('en-US')+' tickets sold of '+g.cap.toLocaleString('en-US')+'. '+empty.toLocaleString('en-US')+' seats were empty.',
    [g.att.toLocaleString('en-US')+' tickets sold of '+g.cap.toLocaleString('en-US')+' in the '+rep.venue+'.',g.sold?'A sell-out. A bigger building would have sold more.':(pct>=0.85?'A healthy house. The empty seats did not show on television.':(pct>=0.6?'A soft house. The camera had to stay off parts of the building.':'A poor house. It looked empty on television, and the crowd was quieter for it.')),'The gate was '+money(g.money)+'.'],g.sold?'good':(pct<0.6?'bad':''));
  if(rep.mkt&&rep.city&&rep.mkt.now!==rep.mkt.was){var mw=mktWord(rep.mkt.now),mo=mktWord(rep.mkt.was),mu=rep.mkt.now>rep.mkt.was;
    add('market','The market',rep.city+(mw.w!==mo.w?': now '+mw.w.toLowerCase()+' (was '+mo.w.toLowerCase()+').':(mu?' knows you a little better.':' thinks a little less of you.')),
      [rep.city+(mu?' liked what it saw.':' did not like what it saw.')+' '+mw.d,'A strong market fills a bigger building and buys its tickets earlier. Stay away too long and it cools.'],mu?'good':'bad');}
  var t=L.tv,tl=(t.v/1e6).toFixed(2)+'M watched'+(t.was?(t.v>t.was*1.01?', up on the show’s recent run':(t.v<t.was*0.99?', down on the show’s recent run':', level with the show’s recent run')):'')+'.';
  add('tv',rep.big?'Buys and viewers':'Television',rep.big?t.buys.toLocaleString('en-US')+' bought the event.':tl,
    (rep.big?[t.buys.toLocaleString('en-US')+' homes bought '+rep.name+'.']:[tl.charAt(0).toUpperCase()+tl.slice(1)].concat(rep.net?['It went out on '+rep.net+'.']:[])).concat(t.was&&!rep.big?['The show’s recent run is about '+(t.was/1e6).toFixed(2)+'M. A growing audience is one of the things that builds a show’s standing.']:[]).concat(['Numbers by kind of viewer are not counted yet.']),t.was&&t.v<t.was*0.99?'bad':(t.was&&t.v>t.was*1.01?'good':''));
  add('writers','The writers',L.writers[0].x,L.writers.map(function(w){return w.x;}),L.writers[0].s<0?'bad':(L.writers[0].s>0?'good':''));
  if(rep.sheet&&rep.sheet.lines&&rep.sheet.lines.length)add('sheet','The dirt sheet',rep.sheet.lines[0],rep.sheet.lines.slice(),'');
  var mt=null;if(L.matter!=null)S.inbox.forEach(function(e){if(e.id===L.matter)mt={id:e.id,text:e.text,done:!!e.done,result:e.result||''};});
  // what the night hands to next week: promises coming due, and whatever the desk is counting down to
  var nx=[];S.quests.filter(function(q){return q.due!=null&&q.text;}).sort(function(a,b){return a.due-b.due;}).slice(0,3).forEach(function(q){var d=q.due-S.week;nx.push({t:q.text,when:d<=0?'this week':(d===1?'next week':'in '+d+' weeks'),soon:d<=1});});
  (typeof E.comingUp==='function'?E.comingUp(S):[]).slice(0,3).forEach(function(u){nx.push({t:u.t,when:'',soon:false});});
  nx=nx.slice(0,5);
  (rep.targets||[]).filter(function(t){return t.ok;}).forEach(function(t,i){add('hit'+i,'Target hit',t.t,[t.t],'good');});
  if(ow&&!ow.me&&ow.was!=null&&!(od<0||ow.edge))add('owner','The owner',ol,[ow.text].concat(ow.why),od>0?'good':'');
  if(nx.length)add('next','Next week',nx[0].t+(nx[0].when?' ('+nx[0].when+')':''),nx.map(function(x){return x.t+(x.when?' ('+x.when+').':'');}),nx[0].soon?'warn':'');
  return {key:L.key,name:rep.name,grade:gradeG(repCS(rep)),head:v.head,line:v.line,matter:mt,next:nx,items:items,unseen:items.filter(function(x){return !x.seen;}).length,left:S.queue.length-S.qi};
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
  var ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1];
  var one=function(q){return q.wi&&q.wi.length===1&&q.ids&&q.ids.length===2;},loserOf=function(q){return S.w[q.ids[0]===q.wi[0]?q.ids[1]:q.ids[0]];};
  // a belt changed hands: the one who lost it wants it back, and wants your word tonight
  var tc=ms.filter(function(q){return q.change&&q.title&&one(q);})[0];
  if(tc){var lw=loserOf(tc),nw=S.w[tc.wi[0]],tt=P.titles.filter(function(x){return x.name===tc.title;})[0];
    if(lw&&nw&&tt&&lw.promo===P.id&&nw.promo===P.id&&!(lw.inj>0)&&nightFree(S,'nt',lw.id)){nightMark(S,'nt',lw.id);
      return {type:'clause',w:lw.id,o:nw.id,tid:tt.id,text:lw.name+' lost the '+tt.name+' to '+nw.name+' on '+rep.name+'. They want their rematch, and they want your word on it tonight.',
        choices:['Promise the rematch within four weeks','No rematch. '+nw.name+' moves on to somebody new']};}}
  var hot=ms.slice(0,-1).filter(function(s){return main&&s.cr>=main.cr-4&&s.cr>=58&&s.win&&s.wi&&s.wi.length===1;}).sort(function(a,b){return b.cr-a.cr;})[0];
  if(hot){w=S.w[hot.wi[0]];
    if(w&&w.promo===P.id&&holdLvl(P,w.id)===0&&!(w.inj>0)&&nightFree(S,'nh',w.id)){nightMark(S,'nh',w.id);
      return {type:'caughtfire',w:w.id,text:'The crowd took to '+w.name+' on '+rep.name+', as loud as anything on the show. The writers say this does not last if nothing is done with it.',
        choices:['Promise them a win within two weeks, and build on it','Not yet. Let it grow by itself']};}}
  // an upset the office did not call: the favourite lost, and both of them want to know what it means
  var up=ms.filter(function(q){return !q.called&&!q.change&&one(q)&&q.odds&&q.odds[q.ids[0]===q.wi[0]?0:1]<=30;})[0];
  if(up){var uw=S.w[up.wi[0]],ul=loserOf(up);
    if(uw&&ul&&uw.promo===P.id&&ul.promo===P.id&&!(uw.inj>0)&&!(ul.inj>0)&&nightFree(S,'nu',uw.id)&&nightFree(S,'nu',ul.id)){nightMark(S,'nu',uw.id);nightMark(S,'nu',ul.id);
      return {type:'upset',w:uw.id,o:ul.id,text:uw.name+' beat '+ul.name+' on '+rep.name+', and nobody saw it coming. '+uw.name+' thinks it is the start of something. '+ul.name+' wants it put right.',
        choices:['Back the upset: a win for '+uw.name+' within two weeks','Call it a fluke: a win for '+ul.name+' within two weeks','Say nothing to either of them']};}}
  // the main event was the weakest match on the show: somebody has to carry it
  if(main&&ms.length>=3&&main.ids&&main.ids.length===2&&main.ov<=rep.rating-6&&!ms.some(function(q){return q!==main&&q.ov<main.ov;})){var fa=S.w[main.ids[0]],fb=S.w[main.ids[1]];
    if(fa&&fb&&fa.promo===P.id&&fb.promo===P.id&&nightFree(S,'nm',fa.id)&&nightFree(S,'nm',fb.id)){nightMark(S,'nm',fa.id);nightMark(S,'nm',fb.id);var boss=S.owner&&!S.owner.me?S.owner.name:null;
      return {type:'mainflop',w:fa.id,o:fb.id,text:'The main event of '+rep.name+', '+fa.name+' against '+fb.name+', was the weakest match on the show. '+(boss?boss+' wants':'The writers want')+' to know whose fault it was.',
        choices:['Take the blame yourself','Blame '+fa.name,'Blame '+fb.name]};}}
  // the match of the night, between two people with no story yet
  var best=ms.filter(function(q){return q.ids&&q.ids.length===2&&q.win&&q.ov>=rep.rating+5&&q.ov>=70;}).sort(function(x,y){return y.ov-x.ov;})[0];
  if(best){var a=S.w[best.ids[0]],b=S.w[best.ids[1]];
    if(a&&b&&a.promo===P.id&&b.promo===P.id&&!(a.inj>0)&&!(b.inj>0)&&!feudOf(S,a.id,b.id)&&activeFeuds(S).length<8&&nightFree(S,'nr',a.id)&&nightFree(S,'nr',b.id)){nightMark(S,'nr',a.id);nightMark(S,'nr',b.id);
      return {type:'rematch',w:a.id,o:b.id,ov:best.ov,text:a.name+' against '+b.name+' was the match of the night on '+rep.name+' ('+starG(best.ov)+'), and there is no story between them. People are already asking to see it again.',
        choices:['Make it a rivalry','Leave it as one great night']};}}
  return null;
}
EVR.clause=function(S,ev,choice,P,w,o){
  var t=titleById(P,ev.tid);if(!w||w.promo!==P.id||!t)return 'It no longer matters.';
  if(choice===0){S.quests.push({id:S.nid++,type:'shot',w:w.id,title:t.id,due:S.week+4,text:'Promise: give '+w.name+' the rematch for the '+t.name+' by '+cal(S.week+4).label});w.morale=clamp(w.morale+6,0,100);youRemember(S,w,'clause','They lost the belt and you gave them your word on a rematch.',6);
    return 'You gave your word. '+w.name+' gets the rematch for the '+t.name+' by '+cal(S.week+4).label+'.';}
  w.morale=clamp(w.morale-8,0,100);w.mom=clamp((w.mom||0)-1,-10,10);youRemember(S,w,'noclause','They lost the belt and you told them there would be no rematch.',-7);
  if(o&&o.promo===P.id){o.morale=clamp(o.morale+4,0,100);youRemember(S,o,'newera','You let them start their run as champion with somebody new.',3);}
  return 'No rematch. '+w.name+' takes it badly.'+(o?' '+o.name+' gets a clean start as champion.':'');
};
EVR.upset=function(S,ev,choice,P,w,o){
  if(!w||!o||w.promo!==P.id||o.promo!==P.id)return 'One of them is no longer with the company.';
  if(choice===0){nightWin(S,w);w.mom=clamp((w.mom||0)+2,-10,10);w.morale=clamp(w.morale+6,0,100);youRemember(S,w,'backed','They got the upset and you backed it.',7);o.morale=clamp(o.morale-4,0,100);youRemember(S,o,'leftit','They were beaten in an upset and you built on it.',-3);
    return 'You gave your word: another win for '+w.name+' within two weeks. '+o.name+' will have to live with it.';}
  if(choice===1){nightWin(S,o);o.morale=clamp(o.morale+4,0,100);youRemember(S,o,'putright','They were beaten in an upset and you promised to put it right.',4);w.morale=clamp(w.morale-6,0,100);youRemember(S,w,'fluke','They got the win of their life and you called it a fluke.',-6);
    return 'You gave your word: a win for '+o.name+' within two weeks. '+w.name+' heard the word fluke, and will not forget it.';}
  w.morale=clamp(w.morale-3,0,100);youRemember(S,w,'waited','They got the upset and you said nothing.',-3);
  return 'You say nothing. '+w.name+' wonders what it takes. '+o.name+' assumes it will be put right without asking.';
};
EVR.mainflop=function(S,ev,choice,P,w,o){
  if(!w||!o)return 'It no longer matters.';
  if(choice===0){if(S.owner&&!S.owner.me)S.owner.trust=clamp(S.owner.trust-3,0,100);[w,o].forEach(function(x){if(x.promo===P.id){x.morale=clamp(x.morale+4,0,100);youRemember(S,x,'tookit','The main event fell flat and you took the blame yourself.',6);}});
    return 'You say it was the booking. '+w.name+' and '+o.name+' both hear that you did.'+(S.owner&&!S.owner.me?' '+S.owner.name+' trusts you a little less.':'');}
  var bad=choice===1?w:o,other=bad===w?o:w;bad.morale=clamp(bad.morale-8,0,100);youRemember(S,bad,'blamed','The main event fell flat and you put it on them.',-8);youRemember(S,other,'spared','The main event fell flat and you did not put it on them.',2);
  relBump(S,bad.id,other.id,{bond:-8},{k:'blame',t:'The booker blamed '+bad.name+' for their main event.',by:'you'});
  return 'You put it on '+bad.name+'. They hear about it before they have left the building. It sits between them and '+other.name+' now.';
};
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
