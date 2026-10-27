// @ts-nocheck
/* Moved from src/99-zpodcast.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
/* The podcast (Bill, 21 October: "get rid of the chat room and make it a weekly podcast"). Once a week two hosts talk
   through the week in wrestling: a writer from the press (the reporter on the ring beat, S.press) and a retired
   wrestler with a good mic, or an original name when the world has none. An episode is a script, plain data in S.pod:
   segments, and lines that say who speaks and, for some, the picture to cut to. It is written at the end of the week
   from what the paper already knows (this week's dirt sheet, the news, the feed, the titles), so the hosts never say a
   secret that has not leaked. The file sorts after 94-net.js, 99-postmortem.js and 99-press.js on purpose: its
   end-of-week hook runs after theirs and reads the sheet, the month in review and the column they file. Every pick is
   hashed; nothing here calls rnd(S), so an episode can never change how a game plays out. */
export var POD_EPS=4,POD_MAX=72;
export var POD_SEGS={open:'Cold open',yours:'This week in {co}',world:'Around the business',feuds:'Feud watch',money:'Business',rumours:'The rumour mill',titles:'The title picture',mail:'The mailbag',picks:'Picks and goodbye'};
export function podFirst(n){return String(n||'').split(' of ')[0].split(' ')[0];}
export function podPlain(n){return String(n||'').split(' of ')[0];}
/* the show's name comes from the dirt sheet: "Wade Kessler of the Ringside Wire" makes The Ringside Wire Radio */
export function podShowName(S){
  var c=S.columnist||'The Ringside Wire',o=c.indexOf(' of ')>=0?c.slice(c.indexOf(' of ')+4):c;
  o=o.replace(/^the /i,'');return 'The '+o+' Radio';
}
export function podInit(S){
  if(S.pod)return S.pod;
  var X=$L.pressInit(S),ra=X.rep.filter(function(r){return r.beat==='ring';})[0]||X.rep[0];
  // the co-host: the retired wrestler with the best mic, kept for good
  var rt=S.w.filter(function(w){return w&&w.rt!=null&&w.promo==='FA'&&!w.nw&&(w.mic||0)>=60;}).sort(function(a,b){return (b.mic||0)-(a.mic||0)||a.id-b.id;})[0],nb;
  if(rt)nb=rt.name;
  else{var tries=0;do{nb=$L.PRESS_FIRST[$L.hash(S.seed+'podb'+tries)%$L.PRESS_FIRST.length]+' '+$L.PRESS_LAST[$L.hash(S.seed+'podl'+tries)%$L.PRESS_LAST.length];tries++;}
    while(tries<20&&X.rep.some(function(r){return podPlain(r.name)===nb||podFirst(r.name)===podFirst(nb);}));}
  S.pod={show:podShowName(S),a:{rep:ra.id,name:podPlain(ra.name)},b:{w:rt?rt.id:null,name:nb},eps:[],picks:[],rec:{r:0,x:0},n:0};
  return S.pod;
}
/* how warm the writer is to your company: 1 friendly, 0 fair, -1 cool (src/99-press.js) */
export function podTone(S,pod){var r=S.press&&S.press.rep[pod.a.rep];if(!r)return 0;var v=r.warm+r.bias*0.5;return v>=25?1:(v<=-25?-1:0);}
export function podPickSide(S,f,key){
  var sum=function(ids){return ids.reduce(function(t,id){var w=S.w[id];return t+(w?w.ovr+w.mom*2:0);},0);},d=sum(f.a)-sum(f.b);
  return d>3?'a':(d<-3?'b':($L.h01(key)<0.5?'a':'b'));
}
export function podWrite(S){
  var pod=podInit(S),P=S.promos[S.player],wk=S.week,key=S.seed+':pod:'+wk,used={},lines=[],segs=[],n=0;
  var sheet=(S.sheets||[])[0];if(!sheet||sheet.week!==wk)sheet=$L.netSheet(S,wk);
  var cx={a:podFirst(pod.a.name),b:podFirst(pod.b.name),show:pod.show,co:P.name,wk:$L.cal(wk).label.replace(/^Week/,'week'),tone:podTone(S,pod)};
  var say=function(s,rule,c,p){if(lines.length>=POD_MAX)return;var o={};for(var k in cx)o[k]=cx[k];if(c)for(var j in c)o[j]=c[j];
    var t='';for(var tr=0;tr<5;tr++){t=$L.gram($L.GR_POD,rule,o,key+':'+(n++));if(!used[t])break;}if(!t)return;used[t]=1;var L={s:s,t:t,g:segs.length-1};if(p)L.p=p;lines.push(L);};
  var raw=function(s,t,p){if(lines.length>=POD_MAX)return;var L={s:s,t:t,g:segs.length-1};if(p)L.p=p;lines.push(L);};
  var seg=function(k){segs.push({k:k,n:$L.fill(POD_SEGS[k],{co:P.name}),i:lines.length});};
  var maybe=function(tag,p){return $L.h01(key+':c:'+tag)<p;};
  var reps=S.reports.filter(function(r){return r.week===wk&&r.promo===P.id;}).sort(function(a,b){return (b.big?1:0)-(a.big?1:0)||b.rating-a.rating;}).slice(0,2);
  var newChamps=[];P.titles.forEach(function(t){if(t.since===wk&&t.holders.length)newChamps.push({t:t,w:t.holders[0]});});
  // 1. the cold open
  seg('open');raw('x','[Theme music plays]');say('a','hello');say('b','hi_b');
  if(sheet.lead&&sheet.lead.text&&!/^Nothing broke/.test(sheet.lead.text)){
    var lp=newChamps.length?{k:'champ',w:newChamps[0].w,t:newChamps[0].t.id}:null;say('a','lead',{lead:sheet.lead.text},lp);say('b','lead_b');}
  // 2. your shows
  if(reps.length){
    seg('yours');
    reps.forEach(function(r,ri){
      var g,band=$L.verdictBand(r.rating-(r.exp==null?r.rating:r.exp)),g=$L.gradeG($L.repCS(r)),c={sh:r.name,g:g,ag:(/^[AEF]/.test(g)?'an ':'a ')+g,band:band};
      say('a','grade',c);say('b','grade_b',c);
      if(r.att){raw('a',$L.fill($L.gram($L.GR_POD,'crowd',{att:r.att.toLocaleString('en-US')},key+':att'+ri),{})+(r.sellout?' '+$L.gram($L.GR_POD,'sellout',{},key+':so'+ri):''));}
      var ms=r.segs.filter(function(s){return s.k==='match';});if(!ms.length)return;
      var best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],main=ms[ms.length-1];
      say('a','best',{best:best.label,stars:$L.starG(best.ov)},{k:'match',l:best.label});if(maybe('bb'+ri,0.75))say('b','best_b');
      if(main!==best&&main.win){var lose=main.label.split(' vs ').filter(function(x){return x.indexOf(main.win)<0;})[0];if(lose){say('a','main',{win:main.win,lose:lose});say('b','main_b',{win:main.win,lose:lose});}}
    });
    newChamps.forEach(function(nc,ci){var w=S.w[nc.w];if(!w)return;say('a','champ',{win:w.name,title:nc.t.name},{k:'champ',w:w.id,t:nc.t.id});say('b','champ_b',{win:w.name},{k:'champ',w:w.id,t:nc.t.id});});
    // what the wrestlers posted afterwards (src/94-net.js)
    var mine={};$L.rosterOf(S,P.id).forEach(function(w){mine[w.name]=1;});
    (S.feed||[]).filter(function(f){return f.w===wk&&f.k==='w'&&mine[f.n];}).slice(0,2).forEach(function(f,fi){say('a','post',{n:f.n,t:f.t});if(maybe('pb'+fi,0.6))say('b','post_b');});
  }
  // 3. around the business
  var wl=(sheet.world||[]).filter(function(x){return x.lines&&x.lines.length;}).sort(function(a,b){return $L.h01(key+'w'+a.id)-$L.h01(key+'w'+b.id);}).slice(0,3);
  if(wl.length){seg('world');say('a','world_in');wl.forEach(function(x,i){var t=x.lines.filter(function(l){return !/ was graded [A-F][+-]?\.$/.test(l);})[0]||x.lines[0];say('a','world',{co:x.name,t:t});if(maybe('wb'+i,0.5))say('b','world_b');});}
  // 4. feud watch
  if((sheet.feuds||[]).length){seg('feuds');say('a','feud_in');sheet.feuds.slice(0,3).forEach(function(t,i){raw('a',t);var fk=/came to an end|a wrap|never caught on|let .* die/.test(t)?'end':(/run out of road|take the hint|starting to drag/.test(t)?'stale':(/only just starting|started something|Early days/.test(t)?'new':'hot'));if(maybe('fb'+i,0.6))say('b','feud_b',{fk:fk});});}
  // 5. business: the sheet's business column, and this week's audience and column lines
  var biz=(sheet.business||[]).slice(0,2);
  S.news.filter(function(x){return x.w===wk&&/^(AUDIENCE|COLUMN): /.test(x.t);}).slice(0,2).forEach(function(x){biz.push(x.t.replace(/^(AUDIENCE|COLUMN): /,''));});
  if(biz.length){seg('money');say('a','money_in');biz.forEach(function(t){raw('a',t);});say('b','money_b');}
  // 6. the rumour mill: last week's calls checked first, then what is going round now
  var fu=(sheet.followups||[]).slice(0,2),ru=(sheet.rumours||[]).slice(0,3);
  if(fu.length||ru.length){
    seg('rumours');say('a','rum_in');
    fu.forEach(function(x){var t=x.t.replace(/^(CONFIRMED|UPDATE|CORRECTION): /,'');say('a',x.ok?'fix_ok':'fix_no',{t:t});say('b',x.ok?'fix_ok_b':'fix_no_b');});
    ru.forEach(function(x,i){say('a','rum_'+(x.lvl||'thin'),{t:x.t});if(x.lvl==='thin'||maybe('rb'+i,0.4))say('b','rum_b');});
  }
  // 7. the title picture: the top three belts, who holds them, who is next
  var ts=P.titles.slice().sort(function(a,b){return b.lvl-a.lvl||(b.prestige||0)-(a.prestige||0);}).slice(0,3);
  if(ts.length&&(wk%2===0||newChamps.length)){
    seg('titles');say('a','title_in');
    ts.forEach(function(t,i){
      if(!t.holders.length){say('a','vacant',{title:t.name});return;}
      var nm=t.holders.map(function(id){return S.w[id]?S.w[id].name:'';}).filter(Boolean).join(' and '),p={k:'champ',w:t.holders[0],t:t.id},two=t.holders.length>1,vb={hv:two?'hold':'holds',hs:two?'have':'has',is:two?'are':'is'};
      if(t.since===wk)say('a','hold_new',{w:nm,title:t.name,hv:vb.hv,is:vb.is},p);else say('a','hold',{w:nm,title:t.name,n:Math.max(1,wk-t.since),hv:vb.hv,hs:vb.hs},p);
      var c=t.tag?null:$L.rankFor(S,P,t,1)[0];if(c&&maybe('nx'+i,0.7))say('b','next',{c:c.name},{k:'face',ids:[t.holders[0],c.id]});
    });
  }
  // 8. the mailbag: what the fans wrote after the show (GR_CHAT lines)
  var who={},ml=(S.feed||[]).filter(function(f){if(f.w!==wk||f.k!=='f'||who[f.u])return false;who[f.u]=1;return true;}).slice(0,3);
  if(ml.length){seg('mail');say('a','mail_in');ml.forEach(function(f,i){say('b','mail',{u:String(f.u||f.n).replace(/^@/,''),t:f.t});say('a','mail_re');});}
  // 9. picks and goodbye: picks that came in are scored, then a pick for the next big night
  seg('picks');
  pod.picks=(pod.picks||[]).filter(function(pk){
    var f=S.feuds.filter(function(x){return x.id===pk.f;})[0];if(!f)return false;if(!f.res)return wk-pk.w<26;
    var win=f.aw>f.bw?'a':(f.bw>f.aw?'b':null);if(!win)return false;
    var right=win===pk.s;pod.rec[right?'r':'x']++;say('a',right?'score_ok':'score_no',{f:$L.feudLabel(S,f),r:pod.rec.r,x:pod.rec.x});return false;
  });
  var c=$L.cal(wk);if(c.wom===4&&S.pm&&S.pm.month[0]&&S.pm.unread===wk){var m=S.pm.month[0],sh=function(L){return L.filter(function(x){return / shows /.test(x.t);})[0];},mg=sh(m.well),mb=sh(m.badly);
    if(mg||mb)say('a','month',{good:mg?mg.t:'not much',bad:mb?mb.t:null});}
  var hot=$L.activeFeuds(S).filter(function(f){return f.promo===P.id&&f.heat>=60&&!(pod.picks||[]).some(function(pk){return pk.f===f.id;});}).sort(function(a,b){return b.heat-a.heat||a.id-b.id;})[0];
  if(hot){
    var side=podPickSide(S,hot,key+'pk'),nameOf=function(ids){return ids.map(function(id){return S.w[id]?S.w[id].name:'';}).join(' and ');},pn=nameOf(hot[side]),on=nameOf(hot[side==='a'?'b':'a']);
    say('a','pick',{big:c.wom===4?P.name+' '+$L.evName(S,P,$L.cal(wk+4).month):$L.nextBigName(S,P),p:pn,o:on},{k:'face',ids:[hot[side][0],hot[side==='a'?'b':'a'][0]]});say('b',maybe('pd',0.4)?'pick_diff':'pick_same',{p:pn,o:on});
    pod.picks.push({f:hot.id,s:side,w:wk});
  }
  say('a','bye');say('b','bye_b');raw('x','[Theme music plays]');
  var words=lines.reduce(function(t,L){return t+L.t.split(/\s+/).length;},0);
  pod.n++;
  var ep={w:wk,n:pod.n,label:$L.cal(wk).label,title:'Episode '+pod.n+': '+(sheet.lead&&sheet.lead.head?sheet.lead.head:$L.cal(wk).label),mins:Math.max(1,Math.round(words/150)),segs:segs,lines:lines,you:reps.length>0};
  pod.eps.unshift(ep);if(pod.eps.length>POD_EPS)pod.eps.length=POD_EPS;
  return ep;
}
$L.WEEKX.push(function(S){if(S.cal||S.over||!S.promos[S.player])return;podWrite(S);});
/** The podcast for the screen: its name, the hosts, the record on picks, and the episodes kept (newest first) without their lines. */
$L.E.podcast=function(S){
  var pod=podInit(S);
  return {show:pod.show,hosts:[{k:'a',name:pod.a.name,role:'Writer'},{k:'b',name:pod.b.name,role:pod.b.w!=null?'Retired wrestler':'Co-host'}],rec:{r:pod.rec.r,x:pod.rec.x},
    eps:pod.eps.map(function(e){return {w:e.w,n:e.n,label:e.label,title:e.title,mins:e.mins,you:e.you,segs:e.segs.map(function(s){return s.n;}),lines:e.lines.length};})};
};
/** One episode in full, by its number (the newest when left out). */
$L.E.podEp=function(S,n){var pod=podInit(S);for(var i=0;i<pod.eps.length;i++)if(n==null||pod.eps[i].n===n)return JSON.parse(JSON.stringify(pod.eps[i]));return null;};

// hand this module's names back to the bridge, so legacy code that calls them finds them
$L.POD_EPS = POD_EPS;
$L.POD_MAX = POD_MAX;
$L.POD_SEGS = POD_SEGS;
$L.podFirst = podFirst;
$L.podPlain = podPlain;
$L.podShowName = podShowName;
$L.podInit = podInit;
$L.podTone = podTone;
$L.podPickSide = podPickSide;
$L.podWrite = podWrite;
