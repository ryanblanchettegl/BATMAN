/* The Net section: a weekly dirt sheet, a feed of short posts, and the fan boards (the boards live in S.net, from
   src/80-world.js). Everything here is flavour and information. It never consumes the game's random stream: lines are
   picked with a hash of stable values, so adding a post can never change how a game plays out. */
var NET_FEED_MAX=60,NET_SHEETS=4;
function netPickH(arr,key){return arr[Math.floor(h01(String(key))*arr.length)%arr.length];}
function netHandle(name){return '@'+String(name).split(' of ')[0].replace(/[^A-Za-z0-9]/g,'').slice(0,16);}
function netLikes(base,key){return Math.max(3,Math.round(base*(0.6+0.8*h01('l'+key))));}
function netPost(S,k,u,n,t,likes){
  var F=S.feed||(S.feed=[]);F.unshift({w:S.week,k:k,u:u,n:n,t:t,l:likes});if(F.length>NET_FEED_MAX)F.length=NET_FEED_MAX;
}
function netStarPost(S,w,t,key){netPost(S,'w',netHandle(w.name),w.name,t,netLikes(w.ovr*w.ovr*1.6,key));}
var NET_WIN_F=['Thank you, {city}. That one was for you.','Every mile on the road was worth it tonight.','I said I would do it. Done.','Listen to that crowd. I will never get used to it.'];
var NET_WIN_H=['Told you. Nobody in that building is on my level.','Boo all you like. The result is the same.','That was not a fight. That was a lesson.','You paid to see me win. You are welcome.'];
var NET_NEW=['AND NEW. Read it again.','It is mine now. Come and try to take it.','Years of work for one night like this.'];
var NET_LOSE=['Not my night. It will not happen twice.','I heard the count. I will hear it in my sleep. I will be back.','No excuses. Run it back.'];
var NET_FAN=['Still thinking about {best}.','{win} over {lose} and I am fine with it.','{show} was a {word} show. Fight me.','I was there for {best}. My voice is gone.'];
var NET_RIVAL=['{show} is in the books. Ask anybody who was there.','Another night, another building on its feet.','They say the competition is catching up. I have not noticed.'];

/* two people turn into friends or enemies: the fans have a view, each in their own voice (called from relBump, never uses rnd) */
var NET_TURN={
  heat:{smark:['{a} and {b} have real heat now. This is the story I wanted.','{a} versus {b} for real? Book it.'],casual:['wait, did {a} and {b} fall out?','{a} and {b} not getting on. That will be good TV.'],old:['{a} and {b} at odds backstage. It used to get settled in the ring.'],heel:['{a} and {b} fighting. Good. Let them.'],stats:['{a} and {b} have clashed. Watch their next match.'],under:['{a} and {b} at war and nobody asks us.']},
  friends:{smark:['{a} and {b} are tight now. Tag team when?','Anyone else see {a} and {b} getting along?'],casual:['{a} and {b} are friends? That is nice.'],old:['Good to see {a} and {b} looking out for each other.'],heel:['{a} and {b} are a team now. Fine. They still lose.'],stats:['{a} and {b} have become friends. Their matches together will be better.'],under:['{a} and {b} share a locker room and a laugh. Good for them.']}
};
function netTurn(S,a,b,now){
  if(S.cal||!now)return;var x=S.w[a],y=S.w[b];if(!x||!y)return;
  if(!(relMine(S,a,b)||x.ovr+y.ovr>=130))return;
  var key=S.week+':t:'+a+'-'+b,f=FANS[Math.floor(h01(key)*FANS.length)%FANS.length],L=NET_TURN[now<0?'heat':'friends'][f[1]]||NET_TURN[now<0?'heat':'friends'].casual;
  netPost(S,'f','@'+f[0],f[0],fill(netPickH(L,key+'t'),{a:x.name,b:y.name}),netLikes(150,key));
}
/* after every show: the people in it and the people who watched it have something to say */
SHOWX.push(function(S,P,show,rep){
  if(S.cal)return;
  var ms=rep.segs.filter(function(s){return s.k==='match';});if(!ms.length)return;
  var main=ms[ms.length-1],best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],key=S.week+':'+P.id+':'+show.id;
  if(P.id!==S.player){
    // rivals: only their big nights make the feed
    if(!show.big||!main.wi||!main.wi.length)return;
    var rw=S.w[main.wi[0]];if(rw)netStarPost(S,rw,fill(netPickH(NET_RIVAL,key),{show:rep.name}),key);
    return;
  }
  var city=rep.venue?String(rep.venue).replace(/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/,''):'everybody',d=rep.rating-(rep.exp||rep.rating);
  var mw=main.wi&&main.wi.length?S.w[main.wi[0]]:null;
  if(mw)netStarPost(S,mw,fill(netPickH(main.change?NET_NEW:(mw.align==='H'?NET_WIN_H:NET_WIN_F),key+'w'),{city:city}),key+'w');
  var loserId=main.ids.filter(function(id){return !main.wi||main.wi.indexOf(id)<0;})[0],ml=loserId!=null?S.w[loserId]:null;
  if(ml&&h01(key+'L')<0.6)netStarPost(S,ml,netPickH(NET_LOSE,key+'l'),key+'l');
  ms.forEach(function(s,i){if(s!==main&&s.change&&s.wi&&s.wi.length){var cw=S.w[s.wi[0]];if(cw)netStarPost(S,cw,netPickH(NET_NEW,key+'c'+i),key+'c'+i);}});
  netPost(S,'c',netHandle(P.name),P.full||P.name,(rep.att?rep.att.toLocaleString('en-US')+' of you in the building':'A full night')+' for '+rep.name+'. '+(rep.sellout?'A sell-out. ':'')+'Thank you.',netLikes(P.image*P.image*2,key+'co'));
  netPost(S,'p',netHandle(S.columnist||'The Ringside Wire'),S.columnist||'The Ringside Wire',best.label+' at '+rep.name+': '+starG(best.ov)+'. The show was graded '+gradeG(repCS(rep))+(verdictBand(d)>0?', better than this crowd expected.':(verdictBand(d)<0?', short of what this crowd expected.':', what this crowd came for.')),netLikes(900,key+'pr'));
  var fan=FANS[Math.floor(h01(key+'f')*FANS.length)%FANS.length][0],word=verdictBand(d)>0?'great':(verdictBand(d)<0?'flat':'solid');
  netPost(S,'f','@'+fan,fan,fill(netPickH(NET_FAN,key+'ft'),{best:best.label,win:main.win||'nobody',lose:ml?ml.name:'the other side',show:rep.name,word:word}),netLikes(120,key+'fl'));
});
/* at the end of the week: the news that broke, as the press posts it */
WEEKX.push(function(S){
  if(S.cal||S.over)return;
  var by=S.columnist||'The Ringside Wire',n=0;
  S.news.filter(function(x){return x.w===S.week&&(x.k==='title'||x.k==='contract'||x.k==='world'||x.k==='injury');}).slice(0,12).reverse().forEach(function(x,i){
    if(n>=3||h01(S.week+'n'+i+x.t.length)>0.7)return;n++;
    netPost(S,'p',netHandle(by),by,(x.k==='title'?'TITLE NEWS: ':(x.k==='contract'?'CONTRACTS: ':(x.k==='injury'?'INJURY: ':'NEWS: ')))+x.t,netLikes(x.k==='title'?2400:1100,S.week+'n'+i));
  });
  // rumours that came due are settled: confirmed, or corrected
  var RF=S.rumF||(S.rumF=[]),RR=S.rumR||(S.rumR=[]);
  S.rumF=RF.filter(function(r){
    if(r.due>S.week)return true;
    var w=S.w[r.w],P=S.promos[r.pid];if(!w||!P)return false;
    var yes=r.k==='exp'?w.promo!==r.pid:w.promo===r.pid,txt;
    if(r.k==='exp')txt=yes?w.name+' has left '+P.name+', as the paper said.':w.name+' has re-signed with '+P.name+'. The deal did run out, and talks ended well.';
    else txt=yes?w.name+' has signed with '+P.name+'. The earlier report was right.':'Nothing came of '+w.name+' at '+P.name+'. We got that one wrong.';
    RR.unshift({w:S.week,ok:yes,lvl:r.lvl,t:(yes?'CONFIRMED: ':(r.k==='exp'?'UPDATE: ':'CORRECTION: '))+txt});
    if(yes)netPost(S,'p',netHandle(by),by,txt,netLikes(1500,S.week+'rr'+r.w));
    return false;
  });
  if(RR.length>12)RR.length=12;
  // new rumours worth following up are kept until they come due
  netRumours(S,S.week).forEach(function(r){
    if(!r.k||S.rumF.length>=20||S.rumF.some(function(x){return x.w===r.w&&x.k===r.k;}))return;
    S.rumF.push({w:r.w,k:r.k,pid:r.pid,due:r.due,lvl:r.lvl});
  });
  // and the issue of the dirt sheet for the week that just ended is filed
  var L=S.sheets||(S.sheets=[]);L.unshift(netSheet(S,S.week));if(L.length>NET_SHEETS)L.length=NET_SHEETS;
});

/* ---------- the dirt sheet ---------- */
function netMentions(text,name){return new RegExp('(^|[^A-Za-z0-9])'+String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^A-Za-z0-9]|$)').test(text);}
function netRumours(S,wk){
  var out=[],me=S.promos[S.player];
  S.order.forEach(function(pid){
    if(pid===S.player)return;var P=S.promos[pid],R=rosterOf(S,pid).filter(function(w){return !w.nw;});
    var up=R.filter(function(w){return w.con!=null&&w.con<=6;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
    if(up&&up.ovr>=P.image-12)out.push({lvl:'sure',t:up.name+'’s deal with '+P.name+' runs out in '+up.con+' '+(up.con===1?'week':'weeks')+'. Nothing new has been signed.',w:up.id,k:'exp',pid:pid,due:wk+up.con+1});
    if(P.cash<0)out.push({lvl:'likely',t:P.name+' are behind on their bills. Expect cuts.'});
    if(P.shows.length<3&&P.cash>0&&P.image>=45+15*P.shows.length&&R.length>=14*(P.shows.length+1))out.push({lvl:'likely',t:P.name+' have been talking to a network about another weekly show.'});
  });
  var fa=S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw;}).sort(function(a,b){return b.ovr-a.ovr;})[0],rv=S.order.filter(function(p){var g=modelOf(S.promos[p]).gender;return p!==S.player&&(!g||!fa||g===fa.g);});
  if(fa&&rv.length){var fp=netPickH(rv,wk+'thin');out.push({lvl:'thin',t:fa.name+' was seen at a '+S.promos[fp].name+' show this week. It could mean anything.',w:fa.id,k:'fa',pid:fp,due:wk+4});}
  // a team that is coming apart: one partner jealous of the other (the warning before a betrayal)
  (S.teams||[]).forEach(function(tm){
    if(!tm.m||tm.m.length!==2)return;var a=S.w[tm.m[0]],b=S.w[tm.m[1]];if(!a||!b||a.promo!==me.id||b.promo!==me.id)return;
    var ja=jealOf(S,a.id,b.id),jb=jealOf(S,b.id,a.id);if(Math.max(ja,jb)<45)return;
    var x=ja>=jb?a:b,y=x===a?b:a;out.push({lvl:Math.max(ja,jb)>=60?'likely':'thin',t:'People backstage say '+x.name+' is tired of standing in '+y.name+'’s shadow. Watch that team.',w:x.id});
  });
  var hot=activeFeuds(S).filter(function(f){return f.promo===me.id&&f.heat>=70;})[0];
  if(hot)out.push({lvl:'likely',t:'Everybody expects '+feudLabel(S,hot)+' to be settled at '+nextBigName(S,me)+'.'});
  // a different three each week, sure things first
  var rank={sure:0,likely:1,thin:2};
  return out.sort(function(a,b){return (rank[a.lvl]-rank[b.lvl])||(h01(wk+a.t)-h01(wk+b.t));}).slice(0,4);
}
/** Backstage reports: what people did to each other in week `wk`, read from the relationship matrix. How sure the paper is depends on
    how close it sits to the people: both are yours (Sure), one is (Likely), neither (Thin, and only some of them get out). Reads only. */
function netBackstage(S,wk){
  var out=[],M=rmAll(S);
  Object.keys(M).forEach(function(k){
    var e=M[k];if(e.last!==wk||!e.mem.length||e.mem[0].w!==wk)return;
    var ids=k.split('-').map(Number),x=S.w[ids[0]],y=S.w[ids[1]];if(!x||!y)return;
    var mine=(x.promo===S.player?1:0)+(y.promo===S.player?1:0),m=e.mem[0];
    if(!mine&&h01('bk'+wk+k)>0.4)return;
    out.push({lvl:mine===2?'sure':(mine?'likely':'thin'),t:m.t,w:ids[0],v:ids[1],mood:e.bond<=-REL_ON?'heat':(e.bond>=REL_ON?'close':'')});
  });
  var rank={sure:0,likely:1,thin:2};
  return out.sort(function(a,b){return (rank[a.lvl]-rank[b.lvl])||(h01(wk+a.t)-h01(wk+b.t));}).slice(0,3);
}
/** Looking back: a title win whose anniversary falls in week `wk`, from the real title histories. Reads only. */
function netThrowback(S,wk){
  var out=[];
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){
    var d=wk-h.from;if(d<=0||d%48||h.show==='Before your time'||!h.h||!h.h.length||(h.to!=null&&h.to-h.from<4))return;
    var y=d/48,span=h.to!=null?(h.to-h.from):null;
    out.push({t:y+' '+(y===1?'year':'years')+' ago this week, '+h.h.join(' and ')+' won the '+S.promos[pid].name+' '+t.name+(h.show?' at '+h.show:'')+'.'+(span!=null&&span>=24?' The reign lasted '+span+' weeks.':'')});
  });});});
  return out.sort(function(a,b){return h01(wk+a.t)-h01(wk+b.t);}).slice(0,1);
}
/** The moment of the week: the biggest marked beat from the player's shows (a new champion first, then the best match). */
function netMoment(reps){
  var best=null;
  reps.forEach(function(r){(r.segs||[]).forEach(function(sg){if(sg.k!=='match')return;(sg.bc||[]).forEach(function(b){
    if(b.h&&(!best||b.h>best.h||(b.h===best.h&&sg.ov>best.ov)))best={h:b.h,ov:sg.ov,x:b.x,label:sg.label,show:r.name};});});});
  return best?{t:best.x,label:best.label,show:best.show,stars:starG(best.ov)}:null;
}
/** One issue of the dirt sheet: what happened in week `wk`, as far as the game still remembers it. */
function netSheet(S,wk){
  var P=S.promos[S.player],news=S.news.filter(function(x){return x.w===wk;}),reps=S.reports.filter(function(r){return r.week===wk&&r.promo===P.id;}).reverse();
  var yours=reps.map(function(r){return {show:r.name,rating:r.rating,exp:r.exp==null?null:Math.round(r.exp*10)/10,big:!!r.big,lines:r.sheet&&r.sheet.lines?r.sheet.lines.slice(0,5):[]};});
  var best=null;reps.forEach(function(r){r.segs.forEach(function(s){if(s.k==='match'&&(!best||s.ov>best.ov))best={label:s.label,ov:s.ov,show:r.name,stars:starG(s.ov)};});});
  var lead=null,d=reps.length?avg(reps.map(function(r){return r.rating-(r.exp==null?r.rating:r.exp);})):0,tn=news.filter(function(x){return x.k==='title';})[0];
  if(tn)lead={head:'Gold changes hands',text:tn.t};
  else if(reps.length&&d>=5)lead={head:'A big week for '+P.name,text:'The shows beat what the crowd expected by '+d.toFixed(1)+' points. People are talking.'};
  else if(reps.length&&d<=-5)lead={head:'A rough week for '+P.name,text:'The shows fell '+(-d).toFixed(1)+' points short of what the crowd expected. The mood in the building was flat.'};
  else{var wn=news.filter(function(x){return x.k==='world';})[0]||news.filter(function(x){return x.k==='story';})[0]||news[0];lead=wn?{head:wn.k==='world'?'Around the business':'The story of the week',text:wn.t}:{head:'A quiet week',text:'Nothing broke this week that anybody will remember.'};}
  var used={};if(lead)used[lead.text]=1;
  var world=[];S.order.forEach(function(pid){
    if(pid===P.id)return;var RV=S.promos[pid],lines=news.filter(function(x){return x.k!=='you'&&!used[x.t]&&netMentions(x.t,RV.name);}).slice(0,2).map(function(x){used[x.t]=1;return x.t;});
    if(RV.last&&RV.last.week===wk)lines.unshift(RV.last.name+' was graded '+gradeG(repCS(RV.last))+'.');
    if(lines.length)world.push({id:pid,name:RV.name,lines:lines.slice(0,3)});
  });
  var business=news.filter(function(x){return (x.k==='money'||x.k==='contract'||x.k==='injury')&&!used[x.t];}).slice(0,4).map(function(x){used[x.t]=1;return x.t;});
  var c=cal(wk+1),next=[];
  if(c.wom===4)next.push(P.name+' '+dbOf(S).events[c.month]+' is next week.');
  var soon=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.con!=null&&w.con<=2;}).sort(function(a,b){return b.ovr-a.ovr;})[0];if(soon)next.push(soon.name+'’s contract with '+P.name+' is nearly up.');
  var review=reps.length?(d>=3?'The booking is working: the shows are beating expectations.':(d<=-3?'The booking is missing: the shows are under what the crowd expects.':'The booking is doing its job, no more.')):'No shows from '+P.name+' yet this week.';
  return {week:wk,label:cal(wk).label,by:S.columnist||'The Ringside Wire',lead:lead,yours:yours,best:best,world:world,business:business,backstage:netBackstage(S,wk),moment:netMoment(reps),throwback:netThrowback(S,wk),followups:(S.rumR||[]).filter(function(x){return x.w===wk;}),rumours:netRumours(S,wk),next:next,review:review};
}
E.sheetInfo=function(S){return {now:netSheet(S,S.week),past:(S.sheets||[]).slice()};};
E.feed=function(S){return (S.feed||[]).slice();};
E.NET_LVL={sure:'Sure',likely:'Likely',thin:'Thin'};
