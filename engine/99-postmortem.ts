/* Moved from src/99-postmortem.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, MONTHS, cal } from './00-core';
import { SHOWX, WEEKX } from './10-match';
import { money } from './40-week';
import { gradeG, repCS } from './98-words';
$L.clog = clog; $L.pmMoney = pmMoney; $L.pmReview = pmReview; $L.P0month = P0month;
/* wraps: 00-core.js, 66-relations.js (it must sort after them; test-buildorder.js checks) */
/* Post-mortems (the add-ons run, item 17). First a causal log (S.clog): what happened, what caused it and who was
   involved, kept short (the newest 200 lines). It is fed through hooks: every line on the notification bar, the news
   that matters (titles, injuries, contracts, rumours), each of your shows (its grade and why the owner felt as they
   did) and the money each week. From it, every four weeks, a month in review in plain words: what went well, what went
   badly, and the chain of causes behind each. Once a year a season in review. They read only what already happened:
   no hidden score, no forecast (fog of war). The month goes to the desk; the season is kept in History. No rnd(S). */
export var CLOG_MAX=200,CLOG_SKIP={'Refilled':1,'The month in review':1};
$L.CLOG_MAX = CLOG_MAX; $L.CLOG_SKIP = CLOG_SKIP;
export function clog(S,k,t,why,ids,v){if(S.cal||!S.w)return;var L=S.clog||(S.clog=[]);L.unshift({w:S.week,k:k,t:t,why:why||'',ids:ids||[],v:v||0});if(L.length>$L.CLOG_MAX)L.length=$L.CLOG_MAX;}
(function(){
  var nt=$L.note;$L.note=function(S,head,text,kind){nt.apply(this,arguments);if(S&&!S.cal&&S.w&&!$L.CLOG_SKIP[head])clog(S,'note',head,text||'',[],kind==='good'?1:(kind==='bad'?-1:0));};
  var nw=$L.news;$L.news=function(S,kind,text){nw.apply(this,arguments);var P=S&&S.promos&&S.promos[S.player];if(S&&!S.cal&&S.w&&P&&((kind==='title'||kind==='contract')&&text.indexOf(P.name)>=0||kind==='injury'||/^RUMOUR/.test(text)))clog(S,kind,text,'',[],kind==='injury'||/^RUMOUR/.test(text)?-1:0);};
})();
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player)return;var o=rep.owner,cs=repCS(rep),g=gradeG(cs);
  clog(S,'show',show.name+' was graded '+g,o&&o.why?o.why.join(' '):'',[],cs>=75?1:(cs<60?-1:0));
});
WEEKX.push(function(S){
  if(S.cal||S.over)return;var P=S.promos[S.player],r=P.hist&&P.hist[P.hist.length-1];if(!r||r.w!==S.week)return;
  var parts=[['tv','television'],['gate','the gate'],['ppv','big-event buys'],['merch','merchandise']],big=parts.slice().sort(function(a,b){return (r[b[0]]||0)-(r[a[0]]||0);})[0];
  clog(S,'money',r.net>=0?'The week made '+money(r.net):'The week lost '+money(-r.net),'Most of the money came from '+big[1]+'; wages were '+money(r.wages)+'.',[],r.net>=0?0:-1);
});
/* the review: a month or a season, from the log and the books */
export function pmMoney(S,from,to){
  var P=S.promos[S.player],H=(P.hist||[]).filter(function(r){return r.w>from&&r.w<=to;});if(!H.length)return null;
  var sum=function(k){return H.reduce(function(a,r){return a+(r[k]||0);},0);},net=sum('net'),bigs=H.filter(function(r){return (r.ppv||0)>0;}).length;
  var lines=[(net>=0?'The company made ':'The company lost ')+money(Math.abs(net))+' over '+H.length+' weeks.'];
  var inc=[['television',sum('tv')],['the gate',sum('gate')],['big-event buys',sum('ppv')],['merchandise',sum('merch')],['sponsors',sum('spons')]].sort(function(a,b){return b[1]-a[1];});
  lines.push('Most of it came from '+inc[0][0]+(inc[1][1]>0?', then '+inc[1][0]:'')+'. Wages took '+money(sum('wages'))+'.');
  if(net<0&&!bigs)lines.push('There was no big event in these weeks to carry them.');
  return {good:net>=0,lines:lines};
}
export function pmReview(S,from,to,label){
  var L=(S.clog||[]).filter(function(x){return x.w>from&&x.w<=to;}),P=S.promos[S.player],out={label:label,from:from,to:to,well:[],badly:[],money:null,owner:null};
  out.money=pmMoney(S,from,to);
  var shows=L.filter(function(x){return x.k==='show';}),good=shows.filter(function(x){return x.v>0;}),bad=shows.filter(function(x){return x.v<0;});
  if(good.length)out.well.push({t:good.length+' of '+shows.length+' shows beat what the crowd expected',why:good[0].t+'. '+good[0].why});
  if(bad.length)out.badly.push({t:bad.length+' of '+shows.length+' shows fell short',why:bad[0].t+'. '+bad[0].why});
  L.filter(function(x){return x.k==='note'&&x.v>0;}).slice(0,3).forEach(function(x){out.well.push({t:x.t,why:x.why});});
  L.filter(function(x){return (x.k==='note'||x.k==='injury'||/^RUMOUR/.test(x.t))&&x.v<0;}).slice(0,4).forEach(function(x){out.badly.push({t:x.t.replace(/^RUMOUR(\s\([^)]*\))?:\s*/,'A leak: '),why:x.why});});
  L.filter(function(x){return x.k==='title';}).slice(0,2).forEach(function(x){out.well.push({t:x.t,why:''});});
  L.filter(function(x){return x.k==='contract'&&/released|can no longer afford|has left|let go/i.test(x.t);}).slice(0,2).forEach(function(x){out.badly.push({t:x.t,why:''});});
  if(!S.owner.me){var w=(S.ownWas||{})[from]!=null?S.ownWas[from]:null,now=S.owner.trust;
    if(w!=null)out.owner=Math.abs(now-w)<2?S.owner.name+'’s trust held steady.':(now>w?S.owner.name+' trusts you more than a month ago'+(good.length?': the shows did it.':'.'):S.owner.name+' trusts you less than a month ago'+(bad.length?': the shows did it.':'.'));}
  if(!out.well.length)out.well.push({t:'Nothing stood out on the good side',why:''});
  if(!out.badly.length)out.badly.push({t:'Nothing went badly wrong',why:''});
  return out;
}
WEEKX.push(function(S){
  if(S.cal||S.over)return;var c=cal(S.week),pm=S.pm||(S.pm={month:[],season:[]});
  var OW=S.ownWas||(S.ownWas={});if(c.wom===1)OW[S.week-1]=S.owner.trust;
  Object.keys(OW).forEach(function(k){if(S.week-+k>60)delete OW[k];});
  if(c.wom===4){var m=pmReview(S,S.week-4,S.week,MONTHS[c.month]+' '+c.year);pm.month.unshift(m);if(pm.month.length>3)pm.month.length=3;pm.unread=S.week;
    $L.note(S,'The month in review','How '+MONTHS[c.month]+' went, and why. It is on your desk.','');}
  if(c.wom===4&&c.month===(P0month(S)+11)%12){var y=pmReview(S,S.week-48,S.week,'The season to '+MONTHS[c.month]+' '+c.year);pm.season.unshift(y);if(pm.season.length>4)pm.season.length=4;}
});
export function P0month(S){return S.db&&S.db.startMonth!=null?S.db.startMonth:9;}
/** The latest month in review, and whether it has been read. */
E.monthReview=function(S){var pm=S.pm;return pm&&pm.month[0]?{r:pm.month[0],unread:pm.unread!=null&&pm.read!==pm.unread}:null;};
E.readMonth=function(S){if(S.pm)S.pm.read=S.pm.unread;return {ok:true};};
E.seasonReviews=function(S){return S.pm?S.pm.season.slice():[];};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.CLOG_MAX = CLOG_MAX;
$L.CLOG_SKIP = CLOG_SKIP;
$L.clog = clog;
$L.pmMoney = pmMoney;
$L.pmReview = pmReview;
$L.P0month = P0month;
