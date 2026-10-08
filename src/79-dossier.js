/* ---------- the dossier and the room (docs/plans/art-direction.md, 6.10) ----------
   E.dossier(S, id) is everything Backstage knows about one person, in one call: why they are in the building, their
   mood and how it moved since the last show, where they stand with you, stress, the last three things they remember
   about you, their two closest friends and two worst rivals, their stories, and the answers open to you with what
   each costs. E.roomInfo(S) sums up the locker room. Both only read the game.

   The one thing kept: S.moodAt, everybody's mood when your last show went off the air, so "since the show" means
   something. Nothing here uses rnd(S). */
var MOOD_WORDS=[[80,'Flying'],[65,'Happy'],[50,'Steady'],[40,'Restless'],[25,'Unhappy'],[0,'Furious']];
var STRESS_WORDS=[[75,'At breaking point'],[55,'Under strain'],[30,'Feeling it'],[0,'Easy']];
var YOU_WORDS=[[40,'Trusts you'],[15,'Thinks well of you'],[-15,'Has no view of you yet'],[-40,'Wary of you'],[-101,'Does not trust you']];
function wordOf(L,v){for(var i=0;i<L.length;i++)if(v>=L[i][0])return L[i][1];return L[L.length-1][1];}

/* when your show goes off the air, write down how everybody stood */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player)return;
  var m={};rosterOf(S,P.id).forEach(function(w){m[w.id]=Math.round(w.morale);});S.moodAt={w:S.week,m:m};
});

/* the people a person is closest to and furthest from, among those still on the roster */
function dosTies(S,id,pid){
  var M=S.rm||{},pre=id+'-',suf='-'+id,L=[];
  Object.keys(M).forEach(function(k){
    var o=null;if(k.indexOf(pre)===0)o=+k.slice(pre.length);else if(k.slice(-suf.length)===suf)o=+k.slice(0,k.length-suf.length);
    if(o==null||isNaN(o)||!S.w[o]||S.w[o].promo!==pid)return;
    L.push({id:o,name:S.w[o].name,bond:Math.round(M[k].bond),jeal:Math.round(jealOf(S,id,o)),why:(M[k].mem&&M[k].mem[0]&&M[k].mem[0].t)||''});
  });
  return {friends:L.filter(function(x){return x.bond>=15;}).sort(function(a,b){return b.bond-a.bond;}).slice(0,2),
    rivals:L.filter(function(x){return x.bond<=-15;}).sort(function(a,b){return a.bond-b.bond;}).slice(0,2)};
}

/** One person's file. Null if there is nobody by that id on your roster. */
E.dossier=function(S,id){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id)return null;
  var N=peopleNow(S),here=null;
  // their own reason first; failing that, a scene somebody else brought them into
  var mine=null,theirs=null;PPL_ROOMS.forEach(function(k){N[k].forEach(function(p){if(p.id===w.id&&!mine)mine=[k,p];else if(p.with===w.id&&!theirs)theirs=[k,p];});});
  [mine||theirs].forEach(function(kp){if(!kp)return;var k=kp[0],p=kp[1];{var o=p.with!=null?S.w[p.with]:null;
    here={room:k,pid:p.id,place:PLACES[k].n,why:p.why,tone:p.tone||'',story:p.story||'',with:p.with===w.id?p.id:p.with,used:!!p.used,
      acts:p.acts.map(function(a){var A=PPL_ACT[a],ck=A.ck?A.ck(S,P,S.w[p.id],o):null;return {id:a,n:pplTxt(A.n,S,P,S.w[p.id],o),free:!!A.free,cost:A.free?'Free':'1 action point',p:ck?Math.round(ck.p*100):null};})};
    if(p.id!==w.id&&o){here.why=p.why.split(w.name).join(S.w[p.id].name);}}});   // a scene, told from their side
  var mood=Math.round(w.morale),was=S.moodAt&&S.moodAt.m&&S.moodAt.m[w.id]!=null?S.moodAt.m[w.id]:null,Y=S.rmY&&S.rmY[w.id],yv=Y?Math.round(Y.v):0,T=dosTies(S,w.id,P.id);
  return {id:w.id,name:w.name,age:w.age,align:w.align,ovr:Math.round(w.ovr),con:w.con,wage:w.wage,hurt:w.inj>0?w.inj:0,town:w.town||null,
    here:here,
    mood:{v:mood,w:wordOf(MOOD_WORDS,mood),d:was==null?null:mood-was},
    stress:{v:Math.round(w.stress||0),w:wordOf(STRESS_WORDS,w.stress||0)},
    you:{v:yv,w:wordOf(YOU_WORDS,yv)},
    remember:Y?Y.mem.slice(0,3).map(function(m){var c=cal(m.w);return {when:c.label,ago:S.week-m.w,t:m.t,v:m.v};}):[],
    friends:T.friends,rivals:T.rivals,
    feuds:feudsFor(S,w.id).map(function(f){return {label:feudLabel(S,f),stage:feudStage(f)};})};
};

/** The locker room in a few numbers and names: trust in you, the mood, who is unhappy or hurt, the circles, the real heat. */
E.roomInfo=function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),ids={};R.forEach(function(w){ids[w.id]=1;});
  var avg0=R.length?R.reduce(function(a,w){return a+w.morale;},0)/R.length:50,heat=[];
  Object.keys(S.rm||{}).forEach(function(k){var e=S.rm[k],p=k.split('-');if(e.bond<=-REL_STRONG&&ids[p[0]]&&ids[p[1]])heat.push({a:S.w[+p[0]].name,b:S.w[+p[1]].name,bond:Math.round(e.bond)});});
  heat.sort(function(a,b){return a.bond-b.bond;});
  var was=S.moodAt&&S.moodAt.m?R.filter(function(w){return S.moodAt.m[w.id]!=null;}):[],d=was.length?Math.round(was.reduce(function(a,w){return a+w.morale-S.moodAt.m[w.id];},0)/was.length*10)/10:null;
  var t=S.trust==null?60:S.trust;
  return {trust:{v:Math.round(t),w:t>=75?'They trust you':(t>=50?'They give you a chance':(t>=30?'They doubt you':'They have stopped listening'))},
    mood:{v:Math.round(avg0),w:wordOf(MOOD_WORDS,avg0),d:d},
    unhappy:R.filter(function(w){return w.morale<40;}).length,hurt:R.filter(function(w){return w.inj>0;}).length,size:R.length,
    circles:E.cliques(S).map(function(c){return {name:c.name,n:c.m.length,power:!!c.power};}),
    heat:heat.slice(0,3),heatN:heat.length};
};
