/* The desk as the Map Board (docs/plans/desk-map-board.md, Bill 28 October 2026): one call with everything the three
   columns read. Your company on the left (the standings by TV share, the stars by overall rating, the ones to watch
   by potential, a line from the owner when there is news, the next big event), the poster in the middle (the face of
   the company between the two most popular who are fit) and what is already on the card. It only reads the game:
   no rnd(S), nothing written. */
import { E, rosterOf, cal, starG } from './00-core';
import { faceOf } from './32-direction';
import { nightOf } from './88-nights';

E.deskBoard=function(S){
  var P=S.promos[S.player];if(!P)return null;
  var R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),ovr=function(w){return E.overallOf(w);};
  var A=typeof E.audience==='function'?E.audience(S):{rank:1,of:1,table:[]};
  var mine=A.table.findIndex(function(x){return x.mine;}),table=A.table.slice(0,4);
  if(mine>=4)table=A.table.slice(0,3).concat([A.table[mine]]);
  table=table.map(function(x){return {name:x.name,share:x.share,mine:x.mine,rank:A.table.indexOf(x)+1};});
  var stars=R.slice().sort(function(a,b){return ovr(b)-ovr(a);}).slice(0,3);
  var starIds={};stars.forEach(function(w){starIds[w.id]=1;});
  var DEV=['Normal','Rising star','Blue-chip','Generational'];
  var watch=R.filter(function(w){return !starIds[w.id];}).sort(function(a,b){return (b.dev||0)-(a.dev||0)||a.age-b.age||ovr(b)-ovr(a);}).slice(0,3);
  var word=function(w){if(w.inj>0)return 'Hurt: '+w.inj+(w.inj===1?' week':' weeks');var t=P.titles.find(function(t){return t.holders.indexOf(w.id)>=0;});if(t)return 'Champion';if(w.ovr>=80)return 'Red hot';if(w.morale<40)return 'Unhappy';return w.ovr>=60?'Over with the crowd':'Building';};
  // the poster: the face of the company in the middle, the two most popular who are fit beside them; a hurt star steps off
  var fit=R.filter(function(w){return !(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;}),fc=faceOf(S),mid=fc&&!(fc.inj>0)?fc:fit[0];
  var side=fit.filter(function(w){return !mid||w.id!==mid.id;}).slice(0,2);
  var poster=mid?[side[0],mid,side[1]].filter(Boolean).map(function(w){return w.id;}):[];
  // the owner speaks only with news
  var lead=A.table[0],me=A.table[mine],owner=null,t=S.owner?S.owner.trust:60,mv=E.moved?E.moved(S):null;
  if(P.neg>0)owner='Cash is negative. Fix it before it fixes you.';
  else if(t<35)owner='I am running out of patience with you.';
  else if(me&&lead&&!lead.mine&&lead.share-me.share<=4)owner='We are '+(Math.round((lead.share-me.share)*10)/10)+' points behind '+lead.name+'. Close it and we talk about a bigger building.';
  else if(mv&&mv.cash.dir<0&&mv.cash.d<-(P.cash*0.05))owner='The money went the wrong way. I noticed.';
  var nb=E.nextBig(S),bigStop=(E.roadAhead?E.roadAhead(S,16):[]).filter(function(a){return a.big;})[0];
  // the last show of yours, all of it from its own report: the grade and the verdict, the house, the head to head that
  // night if there was one, and the match of the night
  var r=S.reports.find(function(x){return x.promo===S.player;}),last=null;
  if(r){var v=E.showVerdict(r.rating,r.exp),best=(r.segs||[]).filter(function(g){return g.k==='match';}).sort(function(a,b){return b.ov-a.ov;})[0];
    last={name:r.name,city:r.city,grade:E.repGrade(r),word:v.word.w,line:v.line,att:r.att,h2h:r.h2h?{co:r.h2h.co,won:!!r.h2h.won}:null,motn:best?{label:best.label,stars:starG(best.ov)}:null};}
  // the grade the last night in each city got, for the labels on the map
  var grades={};Object.keys(S.rdv||{}).forEach(function(c){grades[c]=E.grade(S.rdv[c].cs);});
  var sh=S.queue[S.qi],day=sh?nightOf(sh):'';
  // what is already on the card: the main title's champion, promises owed, the next shows
  var card=[],T=P.titles.filter(function(t){return !t.tag&&t.holders.length;}).sort(function(a,b){return (b.pres||0)-(a.pres||0);})[0];
  if(T){var c=S.w[T.holders[0]];card.push({k:'Main event',t:c.name+(c.inj>0?' is hurt and cannot defend the '+T.name:' defends the '+T.name+' · challenger open')});}
  S.quests.filter(function(q){return q.due!=null&&q.due>=S.week;}).sort(function(a,b){return a.due-b.due;}).slice(0,2).forEach(function(q){card.push({k:q.type==='dream'?'Dream match':'Promise',t:String(q.text).replace(/^Promise: /,'').replace(/^Dream match: /,'')});});
  var then=(E.comingUp?E.comingUp(S):[]).slice(0,2).map(function(u){return u.t;});
  if(then.length)card.push({k:'Then',t:then.join(' · ')});
  var room=E.roomInfo?E.roomInfo(S):null;
  return {lv:S.booker?S.booker.lvl:1,rank:A.rank,of:A.of,table:table,mood:room?room.mood.w:'',
    stars:stars.map(function(w){return {id:w.id,ovr:ovr(w),word:word(w),hurt:w.inj>0};}),
    watch:watch.map(function(w){return {id:w.id,ovr:ovr(w),dev:DEV[w.dev||0]};}),
    owner:owner,big:{name:nb.name,in:nb.week-S.week,label:nb.label,city:bigStop&&bigStop.w===nb.week?bigStop.city:''},last:last,grades:grades,day:day,poster:poster,face:mid?mid.id:null,card:card,week:cal(S.week).label};
};
