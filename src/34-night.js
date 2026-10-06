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
  return {key:L.key,name:rep.name,grade:gradeG(rep.rating),head:v.head,line:v.line,items:items,unseen:items.filter(function(x){return !x.seen;}).length,left:S.queue.length-S.qi};
};
/** The booker has looked at one of the things the night left. */
E.nightSeen=function(S,k){var A=E.afterShow(S);if(!A)return;if(!S.nightSeen||S.nightSeen.key!==A.key)S.nightSeen={key:A.key,k:{}};S.nightSeen.k[k]=1;};
