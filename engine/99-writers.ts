// @ts-nocheck
/* Moved from src/99-writers.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.wrInit = wrInit; $L.wrName = wrName; $L.wrPitch = wrPitch;
/* The writers' room (the add-ons run, item 6). Three named writers join your staff (people on the roster, nw, srole
   'writer', so they can like and resent each other and remember you): the head writer from the company's staff list
   and two more. Each has a style (comedy, drama, grit, spectacle) and a strength. Most weeks two of them pitch at the
   desk: a storyline built from what has happened (E.sift), or a spotlight for a star. They argue, the road agent takes a
   side, and the pitch you run is remembered by both writers (relBump between them, youRemember with you). A head
   writer passed over twice running sulks. The head writer's style shows in the words of the segments the writers fill
   on the night (GR_WROOM through gram()). Nothing here calls rnd(S). */
export var WR_STYLE={
  comedy:{n:'comedy',slur:'a joke that writes itself',likes:'a laugh'},
  drama:{n:'drama',slur:'a soap opera',likes:'a story with tears in it'},
  grit:{n:'grit',slur:'too dark for television',likes:'something that feels real'},
  spectacle:{n:'spectacle',slur:'all fireworks, no story',likes:'a big moment'}
};
$L.WR_STYLE = WR_STYLE;
export var GR_WROOM={
  comedy:['The crowd laughs in all the right places: #hw# wrote this one.','A line lands so well the announcers lose it. #hw#’s room, no doubt.','It is silly, and the building loves it.'],
  drama:['Somebody in the front row is crying. #hw# got what #hw# wanted.','It plays like the last scene of a long film.','Quiet, then loud, then quiet again. A drama writer’s segment.'],
  grit:['No music, no smiles. It feels like it really happened.','#hw# wrote it rough, and the crowd believes every word.','It is uncomfortable to watch, which is the point.'],
  spectacle:['Pyro, lights, a lot of noise. #hw# never wrote a small thing.','Everything is bigger than it needs to be, and nobody minds.','The kind of moment that ends up in the opening video.']
};
$L.GR_WROOM = GR_WROOM;
export var WR_FIRST=['Abel','Bette','Cyril','Delia','Ezra','Flo','Gideon','Hester','Ivo','June','Kit','Lorna'],WR_LAST=['Ashdown','Bramble','Corrie','Dunmore','Elwood','Fenn','Garnet','Holloway','Inchley','Jessop','Kell','Larkin'];
$L.WR_FIRST = WR_FIRST; $L.WR_LAST = WR_LAST;
export function wrInit(S){
  if(S.wr&&S.wr.ids.every(function(id){return S.w[id];}))return S.wr;
  var P=S.promos[S.player],styles=Object.keys($L.WR_STYLE),ids=[];
  for(var i=0;i<3;i++){
    var nm=i===0&&P.staff&&P.staff.writer&&P.staff.writer!=='The head writer'?P.staff.writer:$L.WR_FIRST[$L.hash(S.seed+'wf'+i)%$L.WR_FIRST.length]+' '+$L.WR_LAST[$L.hash(S.seed+'wl'+i)%$L.WR_LAST.length];
    var w=$L.addWrestler(S,{name:nm,g:$L.hash(nm)%2?'F':'M',style:'E',ovr:40,mic:55,align:'F',roles:['writer'],age:30+$L.hash(nm)%25},P.id);
    w.srole='writer';w.wst=styles[$L.hash(S.seed+'ws'+i)%styles.length];w.wsk=55+$L.hash(S.seed+'wk'+i)%40;w.wage=0;w.con=999;ids.push(w.id);
  }
  S.wr={ids:ids,head:ids[0],passed:0,last:-1};return S.wr;
}
export function wrName(S,id){return S.w[id]?S.w[id].name:'A writer';}
/** The pitches two writers might make this week: a storyline found in what has happened, or a spotlight. */
export function wrPitch(S,id,k){
  var P=S.promos[S.player],w=S.w[id],st=$L.WR_STYLE[w.wst],F=$L.E.sift(S)||[],off=$L.hash(S.seed+':wp:'+S.week+':'+id)+k,f=null;
  var many=$L.activeFeuds(S).filter(function(x){return x.promo===P.id;}).length>=8;   // a full slate of stories: the room pitches a spotlight instead
  for(var i=0;i<F.length&&!many&&!f;i++){var c=F[(off+i)%F.length];if(c&&S.w[c.a]&&S.w[c.b]&&!$L.inFeud(S,c.a)&&!$L.inFeud(S,c.b))f=c;}
  if(f)return {k:'feud',a:f.a,b:f.b,t:S.w[f.a].name+' against '+S.w[f.b].name+', played as '+st.likes};
  var R=$L.rosterOf(S,P.id).filter(function(x){return !x.nw&&!(x.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;}),star=R[(k*2+$L.hash(S.seed+':wq:'+S.week))%Math.max(1,Math.min(R.length,6))];
  return star?{k:'spot',a:star.id,t:'a spotlight on '+star.name+': '+st.likes}:null;
}
$L.WEEKX.push(function(S){
  if(S.cal||S.over||S.week%2)return;var X=$L.wrInit(S);
  if(S.inbox.some(function(e){return !e.done&&e.type==='wroom';}))return;
  var n=Math.floor(S.week/2)%3,a=X.ids[n],b=X.ids[(n+1)%3],pa=$L.wrPitch(S,a,0),pb=$L.wrPitch(S,b,1);if(!pa||!pb)return;
  var A=S.w[a],B=S.w[b],P=S.promos[S.player],ag=P.staff&&P.staff.agent?P.staff.agent:'The road agent',side=(A.wsk+(a===X.head?10:0))>=(B.wsk+(b===X.head?10:0))?A:B;
  $L.pushEv(S,{type:'wroom',a:a,b:b,pa:pa,pb:pb,text:'The writers’ room. '+A.name+' ('+$L.WR_STYLE[A.wst].n+(a===X.head?', head writer':'')+') pitches '+pa.t+'. '+B.name+' calls it '+$L.WR_STYLE[A.wst].slur+' and pitches '+pb.t+'. '+ag+' sides with '+side.name+'.',
    choices:['Run '+A.name+'’s pitch','Run '+B.name+'’s pitch','Neither: the room can try again']});
});
$L.EVR.wroom=function(S,ev,choice,P){
  var X=$L.wrInit(S),A=S.w[ev.a],B=S.w[ev.b];if(!A||!B)return 'The room has moved on.';
  if(choice===2){$L.youRemember(S,A,'pitchno','You turned their pitch down.',-1);$L.youRemember(S,B,'pitchno','You turned their pitch down.',-1);return 'Neither. The room goes quiet, and both of them go back to their desks a little smaller.';}
  var W=choice===0?A:B,L=choice===0?B:A,pt=choice===0?ev.pa:ev.pb,msg;
  $L.relBump(S,W.id,L.id,{bond:-8},{k:'room',t:W.name+' won the argument in the writers’ room.'});
  $L.youRemember(S,W,'pitchyes','You ran their pitch.',2);$L.youRemember(S,L,'pitchno','You ran the other pitch.',-1);
  if(L.id===X.head){X.passed++;if(X.passed>=2){L.morale=$L.clamp(L.morale-12,0,100);$L.note(S,'The head writer is sulking',L.name+' has been passed over twice running.','bad');}}else if(W.id===X.head)X.passed=0;
  X.style=W.wst;X.by=W.id;X.until=S.week+4;
  if(pt.k==='feud'&&S.w[pt.a]&&S.w[pt.b]&&!$L.feudOf(S,pt.a,pt.b)){var f=$L.startFeud(S,P,S.w[pt.a],S.w[pt.b],24,W.name+' wrote '+S.w[pt.a].name+' and '+S.w[pt.b].name+' into a story',{force:true});msg=f?'The story starts: '+pt.t+'.':'The story would not take.';}
  else{var s=S.w[pt.a];if(s){s.mom=$L.clamp((s.mom||0)+2,-10,10);$L.youRemember(S,s,'spot','The writers built a week around them.',1);}msg='Next week belongs to '+(s?s.name:'them')+'.';}
  return W.name+'’s pitch it is. '+msg+' For a month the writers’ segments carry '+W.name+'’s touch.';
};
/* the style shows in the words: a segment the writers fill carries a line in their voice, and a strong writer lifts it */
$L.ANGDONE.push(function(S,P,ba){
  var X=S.wr;if(!X||P.id!==S.player||!ba.wr)return;
  var id=X.until>=S.week&&X.by!=null?X.by:X.head,w=S.w[id];if(!w||!$L.WR_STYLE[w.wst])return;
  var L=$L.GR_WROOM[w.wst],line=L[Math.floor($L.h01(S.seed+':wl:'+S.week+':'+(ba.text||'').length)*L.length)].replace(/#hw#/g,w.name);
  ba.text=(ba.text||'')+' '+line;if(w.wsk>=80)ba.ov=Math.min(100,(ba.ov||0)+1);
});
/** For the screens: the writers, their styles and strengths, and who has the pen this month. */
$L.E.writers=function(S){var X=$L.wrInit(S);return X.ids.map(function(id){var w=S.w[id];return {id:id,name:w.name,style:$L.WR_STYLE[w.wst].n,likes:$L.WR_STYLE[w.wst].likes,strong:w.wsk>=80?'a strong writer':(w.wsk>=65?'a good writer':'still learning'),head:id===X.head,pen:X.by===id&&X.until>=S.week,mood:w.morale<40?'unhappy':'content',you:(S.rmY&&S.rmY[id]?S.rmY[id].v:0)};});};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.WR_STYLE = WR_STYLE;
$L.GR_WROOM = GR_WROOM;
$L.WR_FIRST = WR_FIRST;
$L.WR_LAST = WR_LAST;
$L.wrInit = wrInit;
$L.wrName = wrName;
$L.wrPitch = wrPitch;
