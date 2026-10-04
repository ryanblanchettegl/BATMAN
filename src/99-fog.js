/* ---------- Fog of war ----------
   The game does not tell the booker how a match or a promo will go. The road agent comments on every match on the
   sheet, and what the agent can say depends on three things:
     - what anyone can see (a wrestler who is worn down, a squash, two partners who are not a team);
     - what the office has seen on its own shows, which it knows for good: once two people have had a singles match
       their ring chemistry is known, once someone has blown up their limit is known, once someone has cut a promo
       the writers know what they can do with a microphone;
     - what the agent can read without having seen it. A better agent reads more, an agent given the match reads it
       best, and the booker's Eye for talent and level make every read surer. A read is never wrong. A weaker agent
       just has less to say.
   During the match the agent talks in the booker's ear: what is working and what is not, in words. After the show
   the report lists what was learned. That is how the booker learns what works: by running it and reading the night.
   Nothing here uses random numbers: a read is settled by a hash of the week, the people and the agent, so it is the
   same every time the page is drawn and cannot change how a game plays out. */
var KNOW0={p:{},w:{}};
/** What the office knows, made on first need. An older save starts with the pairs it has run lately. */
function knowMake(S){
  if(S.know)return S.know;
  var K=S.know={p:{},w:{}},pre=S.player+':';
  Object.keys(S.recent||{}).forEach(function(k){if(k.indexOf(pre)===0)K.p[k.slice(pre.length)]=1;});
  return K;
}
NEWX.push(function(S){S.know={p:{},w:{}};});
function gasLimit(w){return Math.floor(9+w.stam*0.25);}
function fogSkill(S){var b=S.booker;return b?0.12*b.sk.eye+0.01*(b.lvl-1):0;}
/** The chance the agent on this match reads something nobody has seen yet. */
function readP(S,m){var a=agentOf(S,m);return clamp((a?0.4+0.45*agentQ(a):0.25)+fogSkill(S),0.05,0.95);}
function reads(S,m,key){return h01(S.seed+':rd:'+S.week+':'+key+':'+(agentOf(S,m)?m.agent:'h'))<readP(S,m);}
function agentName(S,m){var a=agentOf(S,m);return a?a.name:S.promos[S.player].staff.agent;}
/** The agent's comment on one match of a card: {who, lines:[{s, t, src}], more}. src is 'see', 'seen', 'read' or 'none'.
    Null while the match is not filled in. */
function matchRead(S,card,i){
  var m=card[i],c=matchSetup(S,m);if(!c)return null;
  var show=S.queue[S.qi],n=card.length,all=flat(c.sides),mins=bellMins(show,m,i===n-1),K=S.know||KNOW0,out=[],blind=false;
  var add=function(s,t,src){out.push({s:s,t:t,src:src});};
  // what anyone can see
  all.forEach(function(w){
    var zs=E.zones(S,w.id).sort(function(a,b){return b.v-a.v;})[0];
    if(zs.v>=65&&m.int!=='safe')add(-1,w.name+'’s '+zs.n.toLowerCase()+(zs.k==='n'||zs.k==='b'?' is':' are')+' in a bad way. Book this one safe, or give them the night off.','see');
    if(w.cond<50)add(-1,w.name+' is running on fumes. This match will suffer for it.','see');
  });
  // who can go how long: known once they have blown up on your show, read by a good agent before that
  all.forEach(function(w){
    if(mins<=gasLimit(w))return;
    if(K.w[w.id]&&K.w[w.id].gas)add(-1,w.name+' is good for about '+gasLimit(w)+' minutes. We have seen it. '+mins+' is too many.','seen');
    else if(reads(S,m,'g'+w.id))add(-1,'My read: '+w.name+' does not have '+mins+' minutes in the tank. I would shorten it.','read');
    else blind=true;
  });
  if(m.mt==='1v1'){
    var a=all[0],b=all[1],ch=chem(S,a.id,b.id),key=rkey(a.id,b.id);
    if(K.p[key])add(ch>=2.2?1:(ch<=-2.2?-1:0),ch>=2.2?'They have real chemistry. We have seen it. Give them time.':(ch<=-2.2?'They do not click. We have seen it. Keep it short, or change the match.':'They have worked each other before. Nothing special between them, and nothing wrong.'),'seen');
    else if(reads(S,m,'c'+key))add(ch>=2.2?1:(ch<=-2.2?-1:0),ch>=2.2?'My read: these two will click. I would give them time.':(ch<=-2.2?'My read: these two will not click. I would keep it short.':'My read: no sparks between these two, and no trouble either.'),'read');
    else blind=true;
    if(Math.abs(a.ovr-b.ovr)>25&&mins>7)add(-1,'This is a squash. Keep it short.','see');
  }else blind=blind||m.mt!=='tag';
  if(m.mt==='tag')c.sides.forEach(function(s){
    if(s[0].team==null||s[0].team!==s[1].team)add(-1,names(s)+' are not a regular team. Expect it to be rough.','see');
    else if(relOf(S,s[0].id,s[1].id)<0)add(-1,names(s)+' do not get on. It shows when they tag.','see');
  });
  var NEW=['First time for these two on our shows. I have no read. We find out at the bell.','I have not seen these two work each other. I cannot tell you how it goes.','A new pairing for us. No read yet. Run it and we will know.'];
  if(!out.length)add(0,m.mt==='1v1'?(blind?NEW[Math.floor(h01(S.seed+':nw:'+rkey(all[0].id,all[1].id))*NEW.length)%NEW.length]:'Nothing to flag.'):(m.mt==='tag'?'Two regular teams. Nothing to flag.':'A lot of bodies in there. Hard to read until the bell.'),'none');
  var max=1+(agentOf(S,m)?1:0)+(S.booker&&S.booker.sk.eye>=3?1:0);
  return {i:i,who:agentName(S,m),lines:out.slice(0,max),more:out.length>max,own:!!agentOf(S,m)};
}
/** The agent's comment on every match of the card on the desk, in card order. */
E.agentReads=function(S,card){card=card||S.card||[];return card.map(function(m,i){return matchRead(S,card,i);});};
/** How the reads work, for the panel beside the card. */
E.fogInfo=function(S){
  var P=S.promos[S.player],ag=E.agents(S),K=S.know||KNOW0;
  return {head:P.staff.agent,agents:ag.length,eye:S.booker?S.booker.sk.eye:0,pairs:Object.keys(K.p).length,
    people:Object.keys(K.w).filter(function(id){return K.w[id].gas||K.w[id].mic;}).length};
};

/* ---------- promos and angles: a read in words, not a forecast in stars ---------- */
function fogLook(S,sg,L){
  if(!sg||!L||!L.ok)return L;
  if(sg.k==='writers'){L.read={k:'none',t:'The writers decide on the night.'};return L;}
  var K=S.know||KNOW0,P=S.promos[S.player],show=S.queue[S.qi],ex=expected(P,show),KD=SEGK[sg.k];
  var talk=KD.t==='promo'&&!KD.fix&&sg.k!=='faceoff',who=(sg.who||[]).map(function(id){return S.w[id];}).filter(Boolean);
  var heard=!talk||who.every(function(w){return K.w[w.id]&&K.w[w.id].mic;});
  var rd=heard||h01(S.seed+':rs:'+S.week+':'+sg.k+':'+sg.who.join('-'))<clamp(0.25+fogSkill(S),0.05,0.9);
  if(!rd){
    var fresh=who.filter(function(w){return !(K.w[w.id]&&K.w[w.id].mic);});
    L.read={k:'none',t:'Nobody here has heard '+names(fresh)+' on the microphone on your shows. No read. You find out on the night.'};
    L.notes=L.notes.filter(function(x){return !x[2];});
    return L;
  }
  var d=L.mid-ex;
  L.read={k:d>=4?'good':(d<=-8?'bad':'ok'),t:(talk&&heard?'You have heard them talk. ':'The writers’ read: ')+(d>=4?'This should land.':(d<=-8?'This could die out there.':'It should do its job.'))};
  return L;
}

/* ---------- what the night teaches ---------- */
POST.push(function(ctx){
  var S=ctx.S;if(!ctx.isPl||S.cal||!ctx.rep)return;
  var K=knowMake(S),L=ctx.rep.learned||(ctx.rep.learned=[]);
  if(ctx.m.mt==='1v1'&&ctx.all.length===2){
    var a=ctx.all[0],b=ctx.all[1],key=rkey(a.id,b.id);
    if(!K.p[key]){K.p[key]=1;var ch=chem(S,a.id,b.id);L.push(ch>=2.2?a.name+' and '+b.name+' have real chemistry.':(ch<=-2.2?a.name+' and '+b.name+' do not click in the ring.':a.name+' and '+b.name+' work together without trouble, and without sparks.'));}
  }
  ctx.all.forEach(function(w){
    if(ctx.mins<=gasLimit(w))return;var kw=K.w[w.id]||(K.w[w.id]={});
    if(!kw.gas){kw.gas=1;L.push(w.name+' blew up. Good for about '+gasLimit(w)+' minutes, no more.');}
  });
});
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player)return;
  var K=knowMake(S),L=rep.learned||(rep.learned=[]),hear=function(id){var w=S.w[id];if(!w)return;var kw=K.w[id]||(K.w[id]={});if(kw.mic)return;kw.mic=1;var mc=micOf(S,w);L.push('You have heard '+w.name+' on the microphone now: '+(mc>=75?'a real talker.':(mc>=55?'they can hold a crowd.':'not a talker.')));};
  rep.segs.forEach(function(s){if(s.k==='angle'&&s.booked&&SEGK[s.booked]&&SEGK[s.booked].t==='promo'&&!SEGK[s.booked].fix&&s.booked!=='faceoff')(s.ids||[]).forEach(hear);else if(s.k==='angle'&&s.rub&&rep.open&&rep.open.k==='promo'&&rep.open.ids&&rep.open.ids.length)hear(rep.open.ids[0]);});
  if(!L.length)delete rep.learned;
});

/* ---------- in the booker's ear: the agent says what is working and what is not, while it happens ---------- */
var EAR_BAD=[
  [/^(.*) ran out of gas$/,function(m){return m[1]+' is blown up. There is nothing left in the tank.';}],
  [/^No chemistry between them$/,function(){return 'They are not on the same page out there.';}],
  [/^Went too long for what they can do$/,function(){return 'They have run out of things to do. Take them home.';}],
  [/^Too short for workers this good$/,function(){return 'They were only getting started, and we are sending them home.';}],
  [/^A mismatch that dragged on$/,function(){return 'Nobody believes this is a contest. It needs to end.';}],
  [/^Nobody to/,function(){return 'Listen to them. They do not know who to cheer.';}],
  [/^Two long matches back to back$/,function(){return 'The crowd is tired. They just sat through a long one.';}]
];
var EAR_GOOD=[
  [/^Great chemistry between them$/,function(){return 'These two are clicking. Look at them go.';}],
  [/^Given time to tell a story$/,function(){return 'They are using every minute. The story is landing.';}],
  [/^Clear face against heel$/,function(){return 'The crowd knows exactly who to boo. That is half the job done.';}],
  [/^A fast opener woke the building up$/,function(){return 'That woke them up. The building is ready for a show.';}]
];
function earLine(fx,table,s){
  for(var k=0;k<table.length;k++)for(var j=0;j<fx.length;j++){if(fx[j].s*s<=0)continue;var mm=table[k][0].exec(fx[j].x);if(mm)return table[k][1](mm);}
  return null;
}
POST.push(function(ctx){
  var S=ctx.S,seg=ctx.res&&ctx.res.seg;if(!ctx.isPl||S.cal||!seg||!seg.bc||!seg.bc.length)return;
  var fx=seg.fx||[],who=agentName(S,ctx.m),lines=[],bad=earLine(fx,EAR_BAD,-1),good=earLine(fx,EAR_GOOD,1);
  if(good)lines.push(good);if(bad)lines.push(bad);
  if(!lines.length)lines.push(seg.cr>=80?'The crowd is with them.':(seg.cr<=50?'Listen to that. Nothing. The crowd is not with this one.':'It is fine. Nothing more than fine.'));
  // just before the announcers sum the match up: after the bell and the body of the match
  var bc=seg.bc,first=-1,at=-1,i;
  for(i=0;i<bc.length;i++){if(bc[i].t==='pbp'){first=i;break;}}
  for(i=first+1;first>=0&&i<bc.length;i++){if(bc[i].t==='col'){at=i;break;}}
  if(at<0)at=Math.max(1,bc.length-2);
  lines.forEach(function(t,k){bc.splice(at+k,0,{t:'ear',who:who,x:who+': “'+t+'”'});});
});

/* ---------- what the booking screen calls ---------- */
(function(){
  var l0=E.segLook,i0=E.segInfo,s0=E.setSeg;
  E.segLook=function(S,sg,slot){return fogLook(S,sg,l0(S,sg,slot));};
  E.segInfo=function(S){var I=i0(S),L=segRead(S);I.list.forEach(function(x){if(x.look)fogLook(S,L[x.slot],x.look);});return I;};
  E.setSeg=function(S,slot,sg){
    var r=s0(S,slot,sg);if(!r||!r.ok||!sg||r.slot==null)return r;
    var cur=segRead(S)[r.slot],lk=cur?fogLook(S,cur,l0(S,cur,r.slot)):null;
    if(lk&&lk.read)r.msg=r.msg.replace(/ It should be about [^.]*\.$/,' '+lk.read.t);
    return r;
  };
})();
