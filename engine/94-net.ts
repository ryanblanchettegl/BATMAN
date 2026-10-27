// @ts-nocheck
/* Moved from src/94-net.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.netPickH = netPickH; $L.netHandle = netHandle; $L.netLikes = netLikes; $L.netPost = netPost; $L.netStarPost = netStarPost; $L.netTurn = netTurn; $L.netMentions = netMentions; $L.netRumours = netRumours; $L.netBackstage = netBackstage; $L.netThrowback = netThrowback; $L.netMoment = netMoment; $L.netSheet = netSheet;
/* The Net section: a weekly dirt sheet, a feed of short posts, and the fan boards (the boards live in S.net, from
   src/80-world.js). Everything here is flavour and information. It never consumes the game's random stream: lines are
   picked with a hash of stable values, so adding a post can never change how a game plays out. */
export var NET_FEED_MAX=60,NET_SHEETS=4;
$L.NET_FEED_MAX = NET_FEED_MAX; $L.NET_SHEETS = NET_SHEETS;
export function netPickH(arr,key){return arr[Math.floor($L.h01(String(key))*arr.length)%arr.length];}
export function netHandle(name){return '@'+String(name).split(' of ')[0].replace(/[^A-Za-z0-9]/g,'').slice(0,16);}
export function netLikes(base,key){return Math.max(3,Math.round(base*(0.6+0.8*$L.h01('l'+key))));}
export function netPost(S,k,u,n,t,likes){
  var F=S.feed||(S.feed=[]);F.unshift({w:S.week,k:k,u:u,n:n,t:t,l:likes});if(F.length>$L.NET_FEED_MAX)F.length=$L.NET_FEED_MAX;
}
export function netStarPost(S,w,t,key){$L.netPost(S,'w',$L.netHandle(w.name),w.name,t,$L.netLikes(w.ovr*w.ovr*1.6,key));}
export var NET_WIN_F=['Thank you, {city}. That one was for you.','Every mile on the road was worth it tonight.','I said I would do it. Done.','Listen to that crowd. I will never get used to it.'];
$L.NET_WIN_F = NET_WIN_F;
export var NET_WIN_H=['Told you. Nobody in that building is on my level.','Boo all you like. The result is the same.','That was not a fight. That was a lesson.','You paid to see me win. You are welcome.'];
$L.NET_WIN_H = NET_WIN_H;
export var NET_NEW=['AND NEW. Read it again.','It is mine now. Come and try to take it.','Years of work for one night like this.'];
$L.NET_NEW = NET_NEW;
export var NET_LOSE=['Not my night. It will not happen twice.','I heard the count. I will hear it in my sleep. I will be back.','No excuses. Run it back.'];
$L.NET_LOSE = NET_LOSE;
export var NET_RIVAL=['{show} is in the books. Ask anybody who was there.','Another night, another building on its feet.','They say the competition is catching up. I have not noticed.'];
$L.NET_RIVAL = NET_RIVAL;

/* two people turn into friends or enemies: the fans have a view, each in their own voice (called from relBump, never uses rnd) */
export var NET_TURN={
  heat:{smark:['{a} and {b} have real heat now. This is the story I wanted.','{a} versus {b} for real? Book it.'],casual:['wait, did {a} and {b} fall out?','{a} and {b} not getting on. That will be good TV.'],old:['{a} and {b} at odds backstage. It used to get settled in the ring.'],heel:['{a} and {b} fighting. Good. Let them.'],stats:['{a} and {b} have clashed. Watch their next match.'],under:['{a} and {b} at war and nobody asks us.']},
  friends:{smark:['{a} and {b} are tight now. Tag team when?','Anyone else see {a} and {b} getting along?'],casual:['{a} and {b} are friends? That is nice.'],old:['Good to see {a} and {b} looking out for each other.'],heel:['{a} and {b} are a team now. Fine. They still lose.'],stats:['{a} and {b} have become friends. Their matches together will be better.'],under:['{a} and {b} share a locker room and a laugh. Good for them.']}
};
$L.NET_TURN = NET_TURN;
export function netTurn(S,a,b,now){
  if(S.cal||!now)return;var x=S.w[a],y=S.w[b];if(!x||!y)return;
  if(!($L.relMine(S,a,b)||x.ovr+y.ovr>=130))return;
  var key=S.week+':t:'+a+'-'+b,f=$L.FANS[Math.floor($L.h01(key)*$L.FANS.length)%$L.FANS.length],L=$L.NET_TURN[now<0?'heat':'friends'][f[1]]||$L.NET_TURN[now<0?'heat':'friends'].casual;
  $L.netPost(S,'f','@'+f[0],f[0],$L.fill($L.netPickH(L,key+'t'),{a:x.name,b:y.name}),$L.netLikes(150,key));
}
/* after every show: the people in it and the people who watched it have something to say */
$L.SHOWX.push(function(S,P,show,rep){
  if(S.cal)return;
  var ms=rep.segs.filter(function(s){return s.k==='match';});if(!ms.length)return;
  var main=ms[ms.length-1],best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],key=S.week+':'+P.id+':'+show.id;
  if(P.id!==S.player){
    // rivals: only their big nights make the feed
    if(!show.big||!main.wi||!main.wi.length)return;
    var rw=S.w[main.wi[0]];if(rw)$L.netStarPost(S,rw,$L.fill($L.netPickH($L.NET_RIVAL,key),{show:rep.name}),key);
    return;
  }
  var city=rep.venue?String(rep.venue).replace(/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/,''):'everybody',d=rep.rating-(rep.exp||rep.rating);
  var mw=main.wi&&main.wi.length?S.w[main.wi[0]]:null;
  if(mw)$L.netStarPost(S,mw,$L.fill($L.netPickH(main.change?$L.NET_NEW:(mw.align==='H'?$L.NET_WIN_H:$L.NET_WIN_F),key+'w'),{city:city}),key+'w');
  var loserId=main.ids.filter(function(id){return !main.wi||main.wi.indexOf(id)<0;})[0],ml=loserId!=null?S.w[loserId]:null;
  if(ml&&$L.h01(key+'L')<0.6)$L.netStarPost(S,ml,$L.netPickH($L.NET_LOSE,key+'l'),key+'l');
  ms.forEach(function(s,i){if(s!==main&&s.change&&s.wi&&s.wi.length){var cw=S.w[s.wi[0]];if(cw)$L.netStarPost(S,cw,$L.netPickH($L.NET_NEW,key+'c'+i),key+'c'+i);}});
  $L.netPost(S,'c',$L.netHandle(P.name),P.full||P.name,(rep.att?rep.att.toLocaleString('en-US')+' of you in the building':'A full night')+' for '+rep.name+'. '+(rep.sellout?'A sell-out. ':'')+'Thank you.',$L.netLikes(P.image*P.image*2,key+'co'));
  $L.netPost(S,'p',$L.netHandle(S.columnist||'The Ringside Wire'),S.columnist||'The Ringside Wire',best.label+' at '+rep.name+': '+$L.starG(best.ov)+'. The show was graded '+$L.gradeG($L.repCS(rep))+($L.verdictBand(d)>0?', better than this crowd expected.':($L.verdictBand(d)<0?', short of what this crowd expected.':', what this crowd came for.')),$L.netLikes(900,key+'pr'));
  // the chat room after the show: two to four fans, each line written by the grammar from what happened (src/60-grammar.js)
  var mf=main.ids&&main.ids.length>=2?S.feuds.filter(function(f){return f.promo===P.id&&(f.a.indexOf(main.ids[0])>=0&&f.b.indexOf(main.ids[1])>=0||f.b.indexOf(main.ids[0])>=0&&f.a.indexOf(main.ids[1])>=0);}).slice(-1)[0]:null;
  var cc={show:rep.name,co:P.name,band:$L.verdictBand(d),best:best.label,win:mw?mw.name:null,lose:ml?ml.name:null,champ:main.change&&mw?mw.name:null,feud:mf?$L.feudLabel(S,mf):null,fheat:mf?mf.heat:0,fstale:!!(mf&&!mf.res&&mf.fresh!=null&&mf.fresh<30),fend:!!(mf&&mf.res&&mf.end===S.week),turn:null},nf=2+Math.floor($L.h01(key+'nf')*3),said={};
  var tw=$L.rosterOf(S,P.id).filter(function(w){return w.tw===S.week;})[0];if(tw){cc.turn=tw.name;cc.heel=tw.align==='H';}
  for(var fi=0;fi<nf;fi++){var fan=$L.FANS[Math.floor($L.h01(key+'f'+fi)*$L.FANS.length)%$L.FANS.length][0],ln=$L.gram($L.GR_CHAT,'line',cc,key+'ft'+fi);if(said[ln])continue;said[ln]=1;$L.netPost(S,'f','@'+fan,fan,ln,$L.netLikes(120,key+'fl'+fi));}
});
/* at the end of the week: the news that broke, as the press posts it */
$L.WEEKX.push(function(S){
  if(S.cal||S.over)return;
  var by=S.columnist||'The Ringside Wire',n=0;
  S.news.filter(function(x){return x.w===S.week&&(x.k==='title'||x.k==='contract'||x.k==='world'||x.k==='injury');}).slice(0,12).reverse().forEach(function(x,i){
    if(n>=3||$L.h01(S.week+'n'+i+x.t.length)>0.7)return;n++;
    $L.netPost(S,'p',$L.netHandle(by),by,(x.k==='title'?'TITLE NEWS: ':(x.k==='contract'?'CONTRACTS: ':(x.k==='injury'?'INJURY: ':'NEWS: ')))+x.t,$L.netLikes(x.k==='title'?2400:1100,S.week+'n'+i));
  });
  // rumours that came due are settled: confirmed, or corrected
  var RF=S.rumF||(S.rumF=[]),RR=S.rumR||(S.rumR=[]);
  S.rumF=RF.filter(function(r){
    if(r.due>S.week)return true;
    var w=S.w[r.w],P=S.promos[r.pid];if(!w||!P)return false;
    var yes=r.k==='exp'||r.k==='unh'?w.promo!==r.pid:w.promo===r.pid,txt;
    if(r.k==='unh')txt=yes?w.name+' has left '+P.name+'. The talk was true.':w.name+' stayed with '+P.name+' after all.';
    else if(r.k==='exp')txt=yes?w.name+' has left '+P.name+', as the paper said.':w.name+' has re-signed with '+P.name+'. The deal did run out, and talks ended well.';
    else txt=yes?w.name+' has signed with '+P.name+'. The earlier report was right.':'Nothing came of '+w.name+' at '+P.name+'. We got that one wrong.';
    RR.unshift({w:S.week,ok:yes,lvl:r.lvl,t:(yes?'CONFIRMED: ':(r.k==='exp'||r.k==='unh'?'UPDATE: ':'CORRECTION: '))+txt});
    if(yes)$L.netPost(S,'p',$L.netHandle(by),by,txt,$L.netLikes(1500,S.week+'rr'+r.w));
    return false;
  });
  if(RR.length>12)RR.length=12;
  // new rumours worth following up are kept until they come due
  $L.netRumours(S,S.week).forEach(function(r){
    if(!r.k||S.rumF.length>=20||S.rumF.some(function(x){return x.w===r.w;}))return;
    S.rumF.push({w:r.w,k:r.k,pid:r.pid,due:r.due,lvl:r.lvl});
  });
  // and the issue of the dirt sheet for the week that just ended is filed
  var L=S.sheets||(S.sheets=[]);L.unshift($L.netSheet(S,S.week));if(L.length>$L.NET_SHEETS)L.length=$L.NET_SHEETS;
});

/* ---------- the dirt sheet ---------- */
export function netMentions(text,name){return new RegExp('(^|[^A-Za-z0-9])'+String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^A-Za-z0-9]|$)').test(text);}
export function netRumours(S,wk){
  var out=[],me=S.promos[S.player];
  S.order.forEach(function(pid){
    if(pid===S.player)return;var P=S.promos[pid],R=$L.rosterOf(S,pid).filter(function(w){return !w.nw;});
    var up=R.filter(function(w){return w.con!=null&&w.con<=6;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
    if(up&&up.ovr>=P.image-12)out.push({lvl:'sure',t:up.name+'’s deal with '+P.name+' runs out in '+up.con+' '+(up.con===1?'week':'weeks')+'. Nothing new has been signed.',w:up.id,k:'exp',pid:pid,due:wk+up.con+1});
    // a star who is unhappy where they are, with the deal running down: the paper hears it before the market does
    var sour=R.filter(function(w){return w.con!=null&&w.con>6&&w.con<=14&&w.ovr>=P.image-5&&$L.holdLvl(P,w.id)===0;}).sort(function(a,b){return a.morale-b.morale||b.ovr-a.ovr;})[0];
    if(sour)out.push({lvl:sour.morale<50?'likely':'thin',t:sour.name+' is said to be unhappy with their spot at '+P.name+', and their deal is up in a few months. Other companies will be listening.',w:sour.id,k:'unh',pid:pid,due:wk+sour.con+1});
    if(P.cash<0)out.push({lvl:'likely',t:P.name+' are behind on their bills. Expect cuts.'});
    if(P.shows.length<3&&P.cash>0&&P.image>=45+15*P.shows.length&&R.length>=14*(P.shows.length+1))out.push({lvl:'likely',t:P.name+' have been talking to a network about another weekly show.'});
  });
  // a thin rumour is wrong about half the time (NEXT.md 9.2): some weeks the paper hears that a happy star wants out.
  // It is filed like any other, so it comes due and is corrected: "stayed with them after all"
  if($L.h01(wk+'lie'+S.seed)<0.5){var cand=[];S.order.forEach(function(pid){if(pid===S.player)return;$L.rosterOf(S,pid).forEach(function(w){if(!w.nw&&w.con!=null&&w.con>20&&w.morale>=65&&w.ovr>=S.promos[pid].image-5)cand.push(w);});});
    if(cand.length){var lw=cand[Math.floor($L.h01(wk+'liew'+S.seed)*cand.length)%cand.length],lp=S.promos[lw.promo];out.push({lvl:'thin',t:lw.name+' is said to be unhappy with their spot at '+lp.name+'. Other companies will be listening.',w:lw.id,k:'unh',pid:lw.promo,due:wk+6,lie:1});}}
  var fa=S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw;}).sort(function(a,b){return b.ovr-a.ovr;})[0],rv=S.order.filter(function(p){var g=$L.modelOf(S.promos[p]).gender;return p!==S.player&&(!g||!fa||g===fa.g);});
  if(fa&&rv.length){var fp=$L.netPickH(rv,wk+'thin');out.push({lvl:'thin',t:fa.name+' was seen at a '+S.promos[fp].name+' show this week. It could mean anything.',w:fa.id,k:'fa',pid:fp,due:wk+4});}
  // a team that is coming apart: one partner jealous of the other (the warning before a betrayal)
  (S.teams||[]).forEach(function(tm){
    if(!tm.m||tm.m.length!==2)return;var a=S.w[tm.m[0]],b=S.w[tm.m[1]];if(!a||!b||a.promo!==me.id||b.promo!==me.id)return;
    var ja=$L.jealOf(S,a.id,b.id),jb=$L.jealOf(S,b.id,a.id);if(Math.max(ja,jb)<45)return;
    var x=ja>=jb?a:b,y=x===a?b:a;out.push({lvl:Math.max(ja,jb)>=60?'likely':'thin',t:'People backstage say '+x.name+' is tired of standing in '+y.name+'’s shadow. Watch that team.',w:x.id});
  });
  var hot=$L.activeFeuds(S).filter(function(f){return f.promo===me.id&&f.heat>=70;})[0];
  if(hot)out.push({lvl:'likely',t:'Everybody expects '+$L.feudLabel(S,hot)+' to be settled at '+$L.nextBigName(S,me)+'.'});
  // a different three each week, sure things first
  var rank={sure:0,likely:1,thin:2};
  return out.sort(function(a,b){return (rank[a.lvl]-rank[b.lvl])||($L.h01(wk+a.t)-$L.h01(wk+b.t));}).slice(0,4);
}
/** Backstage reports: what people did to each other in week `wk`, read from the relationship matrix. How sure the paper is depends on
    how close it sits to the people: both are yours (Sure), one is (Likely), neither (Thin, and only some of them get out). Reads only. */
export function netBackstage(S,wk){
  var out=[],M=$L.rmAll(S);
  Object.keys(M).forEach(function(k){
    var e=M[k];if(e.last!==wk||!e.mem.length||e.mem[0].w!==wk)return;
    var ids=k.split('-').map(Number),x=S.w[ids[0]],y=S.w[ids[1]];if(!x||!y)return;
    var mine=(x.promo===S.player?1:0)+(y.promo===S.player?1:0),m=e.mem[0];
    if(!mine&&$L.h01('bk'+wk+k)>0.4)return;
    out.push({lvl:mine===2?'sure':(mine?'likely':'thin'),t:m.t,w:ids[0],v:ids[1],mood:e.bond<=-$L.REL_ON?'heat':(e.bond>=$L.REL_ON?'close':'')});
  });
  var rank={sure:0,likely:1,thin:2};
  return out.sort(function(a,b){return (rank[a.lvl]-rank[b.lvl])||($L.h01(wk+a.t)-$L.h01(wk+b.t));}).slice(0,3);
}
/** Looking back: a title win whose anniversary falls in week `wk`, from the real title histories. Reads only. */
export function netThrowback(S,wk){
  var out=[];
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){
    var d=wk-h.from;if(d<=0||d%48||h.show==='Before your time'||!h.h||!h.h.length||(h.to!=null&&h.to-h.from<4))return;
    var y=d/48,span=h.to!=null?(h.to-h.from):null;
    out.push({t:y+' '+(y===1?'year':'years')+' ago this week, '+h.h.join(' and ')+' won the '+S.promos[pid].name+' '+t.name+(h.show?' at '+h.show:'')+'.'+(span!=null&&span>=24?' The reign lasted '+span+' weeks.':'')});
  });});});
  // the stories that ended, and the best matches, a year or more ago this week (your own shows)
  (S.feudBook||[]).forEach(function(e){var d=wk-e.e;if(d<=0||d%48)return;var y=d/48;out.push({t:y+' '+(y===1?'year':'years')+' ago this week, '+e.l+' came to an end after '+(e.e-e.s)+' weeks.'});});
  ((S.rec&&S.rec.matches)||[]).forEach(function(m){var d=wk-m.w;if(m.w==null||d<=0||d%48)return;var y=d/48;out.push({t:y+' '+(y===1?'year':'years')+' ago this week: '+m.l+(m.show?' at '+m.show:'')+', '+$L.starG(m.ov)+'.'});});
  return out.sort(function(a,b){return $L.h01(wk+a.t)-$L.h01(wk+b.t);}).slice(0,1);
}
/** The moment of the week: the biggest marked beat from the player's shows (a new champion first, then the best match). */
export function netMoment(reps){
  var best=null;
  reps.forEach(function(r){(r.segs||[]).forEach(function(sg){if(sg.k!=='match')return;(sg.bc||[]).forEach(function(b){
    if(b.h&&(!best||b.h>best.h||(b.h===best.h&&sg.ov>best.ov)))best={h:b.h,ov:sg.ov,x:b.x,label:sg.label,show:r.name};});});});
  return best?{t:best.x,label:best.label,show:best.show,stars:$L.starG(best.ov)}:null;
}
/** One issue of the dirt sheet: what happened in week `wk`, as far as the game still remembers it. */
export function netSheet(S,wk){
  var P=S.promos[S.player],news=S.news.filter(function(x){return x.w===wk;}),reps=S.reports.filter(function(r){return r.week===wk&&r.promo===P.id;}).reverse();
  var yours=reps.map(function(r){return {show:r.name,rating:r.rating,exp:r.exp==null?null:Math.round(r.exp*10)/10,big:!!r.big,lines:r.sheet&&r.sheet.lines?r.sheet.lines.slice(0,5):[],head:$L.gram($L.GR_WEB,'results',{show:r.name,band:$L.verdictBand(r.rating-(r.exp==null?r.rating:r.exp))},'res'+r.week+r.name)};});
  var best=null;reps.forEach(function(r){r.segs.forEach(function(s){if(s.k==='match'&&(!best||s.ov>best.ov))best={label:s.label,ov:s.ov,show:r.name,stars:$L.starG(s.ov)};});});
  var lead=null,d=reps.length?$L.avg(reps.map(function(r){return r.rating-(r.exp==null?r.rating:r.exp);})):0,tn=news.filter(function(x){return x.k==='title';})[0];
  // the headline and the editor's opening come from the grammar (src/60-grammar.js), so no two weeks read the same
  var gk='sheet'+wk+P.id,gc={co:P.name,d:d,who:null,rival:S.order.length>1?S.promos[$L.netPickH(S.order.filter(function(p){return p!==P.id;}),gk+'rv')].name:P.name};
  if(tn){gc.k='title';gc.who=/ won the /.test(tn.t)?tn.t.split(' won the ')[0]:null;lead={head:'',text:tn.t};}
  else if(reps.length&&d>=5){gc.k='hot';lead={head:'',text:'The shows beat what the crowd expected by '+d.toFixed(1)+' points. People are talking.'};}
  else if(reps.length&&d<=-5){gc.k='cold';lead={head:'',text:'The shows fell '+(-d).toFixed(1)+' points short of what the crowd expected. The mood in the building was flat.'};}
  else{var wn=news.filter(function(x){return x.k==='world';})[0]||news.filter(function(x){return x.k==='story';})[0]||news[0];gc.k=wn?'world':'quiet';lead=wn?{head:'',text:wn.t}:{head:'',text:'Nothing broke this week that anybody will remember.'};}
  lead.head=$L.gram($L.GR_SHEET,'head',gc,gk+'h');lead.open=$L.gram($L.GR_SHEET,'open',gc,gk+'o');
  var used={};if(lead)used[lead.text]=1;
  var world=[];S.order.forEach(function(pid){
    if(pid===P.id)return;var RV=S.promos[pid],lines=news.filter(function(x){return x.k!=='you'&&!used[x.t]&&$L.netMentions(x.t,RV.name);}).slice(0,2).map(function(x){used[x.t]=1;return x.t;});
    if(RV.last&&RV.last.week===wk)lines.unshift(RV.last.name+' was graded '+$L.gradeG($L.repCS(RV.last))+'.');
    if(lines.length)world.push({id:pid,name:RV.name,lines:lines.slice(0,3)});
  });
  var business=news.filter(function(x){return (x.k==='money'||x.k==='contract'||x.k==='injury')&&!used[x.t];}).slice(0,4).map(function(x){used[x.t]=1;return x.t;});
  var c=$L.cal(wk+1),next=[];
  if(c.wom===4)next.push(P.name+' '+$L.evName(S,P,c.month)+' is next week.');
  var soon=$L.rosterOf(S,P.id).filter(function(w){return !w.nw&&w.con!=null&&w.con<=2;}).sort(function(a,b){return b.ovr-a.ovr;})[0];if(soon)next.push(soon.name+'’s contract with '+P.name+' is nearly up.');
  // feud watch: the stories around the business, from their heat, freshness and age (src/21-living.js), one line each
  var fw=[];S.feuds.forEach(function(f){var co=S.promos[f.promo]?S.promos[f.promo].name:'';if(!co)return;var c={f:$L.feudLabel(S,f),co:co,w:wk-f.start,k:null};
    if(f.res){if(f.end===wk)c.k=f.dead?(f.fizzle==='cold'?'fizz':null):'done';}
    else if(wk-f.start>=24&&f.heat>=60)c.k='long';else if(f.heat>=75)c.k=f.fresh!=null&&f.fresh<35?'stale':'hot';else if(wk-f.start<=1)c.k='new';
    if(c.k)fw.push({k:c.k,h:f.heat,t:$L.gram($L.GR_FEUD,'line',c,'fw'+wk+f.id)});});
  var FWO={done:0,hot:1,long:2,stale:3,fizz:4,new:5};fw.sort(function(a,b){return FWO[a.k]-FWO[b.k]||b.h-a.h;});
  var review=reps.length?$L.gram($L.GR_SHEET,'verdict',gc,gk+'v'):'No shows from '+P.name+' yet this week.';
  return {week:wk,label:$L.cal(wk).label,by:S.columnist||'The Ringside Wire',lead:lead,yours:yours,best:best,world:world,business:business,backstage:$L.netBackstage(S,wk),moment:$L.netMoment(reps),throwback:$L.netThrowback(S,wk),feuds:(function(){var n={};return fw.filter(function(x){n[x.k]=(n[x.k]||0)+1;return n[x.k]<=2;}).slice(0,5).map(function(x){return x.t;});})(),followups:(S.rumR||[]).filter(function(x){return x.w===wk;}),rumours:$L.netRumours(S,wk),next:next,review:review};
}
$L.E.sheetInfo=function(S){return {now:$L.netSheet(S,S.week),past:(S.sheets||[]).slice()};};
$L.E.feed=function(S){return (S.feed||[]).slice();};
/** The headline each site on Wrestle Search runs this week, written by the grammar from what is true of the game. Reads only. */
$L.E.webHeads=function(S){
  var wk=S.week,P=S.promos[S.player],rum=$L.netRumours(S,wk).filter(function(r){return r.w!=null;})[0],C=$L.E.criticList(S),key='web'+wk;
  var nb=0;S.order.forEach(function(pid){nb+=S.promos[pid].titles.length;});
  var hurt=(S.news||[]).filter(function(x){return x.w>=wk-1&&x.k==='injury';})[0],N=S.net||{mood:60,threads:[]};
  var star=$L.rosterOf(S,P.id).filter(function(w){return !w.nw;}).sort(function(a,b){return a.morale-b.morale;})[0];
  return {
    rumor:$L.gram($L.GR_WEB,'rumor',{who:rum?S.w[rum.w].name:null,co:rum&&rum.pid?S.promos[rum.pid].name:null},key+'r'),
    results:$L.gram($L.GR_WEB,'results',{show:P.last?P.last.name:P.name,band:P.last?$L.verdictBand(P.last.rating-(P.last.exp==null?P.last.rating:P.last.exp)):0},key+'s'),
    rank:$L.gram($L.GR_WEB,'rank',{who:C.rows.length?C.rows[0].w.name:null},key+'k'),
    belts:$L.gram($L.GR_WEB,'belts',{n:nb},key+'b'),
    whisper:$L.gram($L.GR_WEB,'whisper',{who:star&&star.morale<50?star.name:(hurt?null:null)},key+'w'),
    board:$L.gram($L.GR_WEB,'board',{mood:N.mood,topic:N.threads.length?N.threads[0].sub:'the last show'},key+'o')
  };
};
$L.E.NET_LVL={sure:'Sure',likely:'Likely',thin:'Thin'};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.NET_FEED_MAX = NET_FEED_MAX;
$L.NET_SHEETS = NET_SHEETS;
$L.netPickH = netPickH;
$L.netHandle = netHandle;
$L.netLikes = netLikes;
$L.netPost = netPost;
$L.netStarPost = netStarPost;
$L.NET_WIN_F = NET_WIN_F;
$L.NET_WIN_H = NET_WIN_H;
$L.NET_NEW = NET_NEW;
$L.NET_LOSE = NET_LOSE;
$L.NET_RIVAL = NET_RIVAL;
$L.NET_TURN = NET_TURN;
$L.netTurn = netTurn;
$L.netMentions = netMentions;
$L.netRumours = netRumours;
$L.netBackstage = netBackstage;
$L.netThrowback = netThrowback;
$L.netMoment = netMoment;
$L.netSheet = netSheet;
