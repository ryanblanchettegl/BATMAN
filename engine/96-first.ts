/* Moved from src/96-first.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, cal, clamp, holdLvl, rosterOf } from './00-core';
import { TASKX } from './10-match';
import { faceOf } from './32-direction';
import { relBump, youLean, youRemember } from './66-relations';
import { modelOf } from './78-models';
$L.reqOf = reqOf; $L.faceCandidates = faceCandidates;
/* ---------- the first year: things every game makes you do, and how a game opens ----------
   Ryan, 4 October: "We want every new game to feel free but some required actions need to be taken early on to make
   sure all available mechanics are being used." A required action is a task on the desk that cannot be left for
   another week, the first time only. Each says in a line what the mechanic is.
     after your first show     sign a sponsor
     before your first big event   name the face of your company
   S.req = {sponsor, face} records the ones that are done. More go here.
   Ryan, 6 October: a new game opens on the owner congratulating you on the job, with a little pretext
   (E.welcome). The pretext is short for now and will be built out. */
export function reqOf(S){return S.req||(S.req={});}
export function faceCandidates(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt&&!(w.inj>8);});
  var sc=function(w){return w.ovr+(w.cha||50)*0.25+(w.sq||50)*0.2+holdLvl(P,w.id)*4+(w.mom||0);};
  return R.sort(function(a,b){return sc(b)-sc(a);}).slice(0,6).map(function(w){var t=P.titles.filter(function(x){return x.holders.indexOf(w.id)>=0;})[0],why=[];
    if(t)why.push('Holds the '+t.name);if(S.owner&&S.owner.fav===w.id&&!S.owner.me)why.push(S.owner.name+'’s favourite');
    if(w.mom>=3)why.push('On a roll');if(w.age<=27)why.push('Young: '+w.age);else if(w.age>=38)why.push('Getting on: '+w.age);
    if(youLean(S,w)>0)why.push('Thinks well of you');else if(youLean(S,w)<0)why.push('Does not trust you');
    return {id:w.id,name:w.name,align:w.align,why:why.length?why.join('. ')+'.':'One of the biggest names you have.'};});
}
E.faceCandidates=function(S){return faceCandidates(S);};
/** Name the face of the company from the desk. On the air it can still change after a main event. */
E.nameFace=function(S,id){
  var P=S.promos[S.player],w=S.w[+id],old=faceOf(S);
  if(!w||w.promo!==P.id||w.nw)return {ok:false,msg:'Pick somebody on your roster.'};
  if(old&&old.id===w.id)return {ok:false,msg:'The shows are already built around '+w.name+'.'};
  S.fc={id:w.id,w:S.week};w.morale=clamp(w.morale+6,0,100);reqOf(S).face=1;
  youRemember(S,w,'theone','You built the company around them.',18);
  if(old){youRemember(S,old,'replaced','You took the company off their shoulders and gave it to '+w.name+'.',-15);relBump(S,old.id,w.id,{bond:-10,ja:25},{k:'passed',keep:true,t:old.name+' watched the company get built around '+w.name+'.'});}
  rosterOf(S,P.id).filter(function(x){return !x.nw&&x.id!==w.id&&(!old||x.id!==old.id)&&x.ovr>=w.ovr-6;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,3).forEach(function(x){relBump(S,x.id,w.id,{ja:10},{k:'passed',t:x.name+' thinks the company should have been built around someone else.'});});
  $L.news(S,'story',P.name+' is building its shows around '+w.name+'.');
  return {ok:true,msg:'The shows are built around '+w.name+' now. The crowd comes to see them: a lift when they are in the main event, a letdown when they could be on the card and are not. The ones who thought it should be them will remember.'};
};
TASKX.push(function(S,P,add){
  var R=reqOf(S);if(!R.sponsor&&S.sponsors&&S.sponsors.length)R.sponsor=1;
  // before the first big event: who are the shows built around?
  if(!R.face){
    if(S.fc&&faceOf(S))R.face=1;
    else if((S.queue||[]).slice(S.qi).some(function(q){return q.big;}))add('face','Your first big event is this week. Before it, name the face of your company: the one the shows are built around.','desk','Name them',{gate:'book',waive:false,req:true,done:'The face of the company is named.',short:'Name the face of the company'});
  }
});
/** The letter a new game opens on. */
E.welcome=function(S){
  if(S.letter)return S.letter;   // the letter is kept as it was written, so it can be read again later
  var P=S.promos[S.player],o=S.owner,me=!!o.me,rank=(typeof E.audience==='function'?E.audience(S).rank:S.order.slice().sort(function(a,b){return S.promos[b].image-S.promos[a].image;}).indexOf(P.id)+1),n=S.order.length,sh=S.queue[S.qi]||P.shows[0];
  var top=P.titles.filter(function(t){return !t.tag&&t.holders.length;}).sort(function(a,b){return b.lvl-a.lvl;})[0],ch=top?S.w[top.holders[0]]:null,fav=!me&&o.fav!=null?S.w[o.fav]:null;
  var place=rank===1?'We are the biggest company in the world, and everybody else gets up in the morning to change that.':(rank<=3?'We are number '+rank+' of '+n+'. I did not hire you to stay there.':(rank>=n-1?'We are near the bottom of '+n+' companies. Nobody expects anything from us. Good.':'We are number '+rank+' of '+n+'. There is room above us and people below who want our spot.'));
  var L=me?['It is yours. Your name is on the lease, the ring is paid for, and nobody upstairs can tell you no.',
      'Nobody upstairs can save you either.',place.replace(/^We are/,'You are').replace(/I did not hire you to stay there\./,'That is not why you did this.')]
    :['Congratulations. The job is yours.','You are the booker of '+(P.full||P.name)+', '+modelOf(P).ph+'. From tonight every match, every promo and every finish goes out with your name on it.',place];
  if(ch)L.push(ch.name+' holds the '+top.name+'.'+(fav&&fav.id!==ch.id?' My money is on '+fav.name+'. You will hear from me about that.':(fav?' I like it that way.':'')));
  // the stories already running when you arrive (src/99-midstory.js): the owner names the one that matters most
  var mid=(S.feuds||[]).filter(function(f){return f.mid&&!f.res&&f.promo===P.id;});
  if(mid.length){var f0=mid[0],A=S.w[f0.a[0]],B=S.w[f0.b[0]];if(A&&B)L.push(A.name+' and '+B.name+' have been at it for weeks'+(f0.title?', with the belt on the line':'')+'. '+(mid.length>1?(mid.length-1)+' more '+(mid.length===2?'story is':'stories are')+' already running. ':'')+'Do not let them go cold.');}
  L.push('Your first show is '+sh.name+'. The card is empty and the building is sold.');
  // the owner's goals for the year (src/66-owner-year.js), in the owner's words
  var Y=!me&&typeof E.ownerYear==='function'?E.ownerYear(S):null;
  if(Y)L.push('By '+(Y.end?'the flagship, '+Y.end:'the end of the year')+', I want three things: popularity up to '+Y.asks[0].n.replace(/^Popularity | or more$/g,'')+', at least half our shows giving the crowd what it came for, and no losses I have to cover. Do that two years running and we can talk about who owns this place.');
  L.push(me?'Go and book it.':'Do not make me regret this.');
  return S.letter={from:me?S.booker.name:o.name,role:me?'Owner and booker':'Owner',company:P.full||P.name,short:P.name,to:S.booker.name,date:cal(S.week).label,lines:L,show:sh.name,
    ps:'Before the show, the Office is where the week starts. The key at the bottom right always says what is next.'};
};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.reqOf = reqOf;
$L.faceCandidates = faceCandidates;
