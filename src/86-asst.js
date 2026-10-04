/* ---------- 94. The assistant: learns how you book, and books the small shows your way (S.asst; engine and one button, fast mode uses it) ---------- */
function asstInit(S){return S.asst||(S.asst={n:0,own:0,h:{S:0.2,M:0.6,L:0.2,stip:0.15,call:0.2,title:0.15,young:0.3},fav:{}});}
function asstLvl(A){return A.n>=140?3:(A.n>=60?2:(A.n>=20?1:0));}
var ASTN=['Learning the ropes','Getting the idea','Knows your style','Books like you'];
/* every show the player books teaches the assistant a little; the assistant's own shows teach it nothing */
SHOWX.push(function(S,P,show,rep,card){
  if(S.cal||P.id!==S.player||S.asstRun||!card||!card.length)return;
  var A=asstInit(S),H=A.h,k=0.12,n=card.length;A.n++;
  var ls={S:0,M:0,L:0},stip=0,call=0,ttl=0;
  card.forEach(function(m){ls[m.len||'M']++;if(m.stip&&m.stip!=='std')stip++;if(m.call!=null)call++;if(m.title)ttl++;});
  ['S','M','L'].forEach(function(l){H[l]+=(ls[l]/n-H[l])*k;});H.stip+=(stip/n-H.stip)*k;H.call+=(call/n-H.call)*k;H.title+=(ttl/n-H.title)*k;
  var last=card[n-1],ids=[].concat.apply([],last.sides).map(function(id){return S.w[id];}).filter(Boolean);
  H.young+=((ids.some(function(w){return w.age<=27;})?1:0)-H.young)*k;
  var fav=A.fav;Object.keys(fav).forEach(function(id){fav[id]*=0.97;if(fav[id]<0.05)delete fav[id];});
  card.forEach(function(m){[].concat.apply([],m.sides).forEach(function(id){if(id!=null)fav[id]=(fav[id]||0)+1;});});
});
function asstPickLen(S,H){var r=rnd(S),t=H.S+H.M+H.L;r*=t||1;return r<H.S?'S':(r<H.S+H.M?'M':'L');}
function asstBook(S){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return [];
  var A=asstInit(S),H=A.h,lv=asstLvl(A),card=autoBook(S,P,show);
  card.forEach(function(m,i){
    var main=i===card.length-1;
    if(!main&&m.mt!=='br'){m.len=asstPickLen(S,H);}
    if(m.stip&&m.stip!=='std'&&!m.title&&chance(S,clamp(0.7-H.stip*2,0.1,0.8)))m.stip='std';   // you rarely book gimmick matches, so neither does it
    m.asst=lv;
  });
  // the people you use most get the spots they usually get
  var favs=Object.keys(A.fav).map(Number).filter(function(id){var w=S.w[id];return w&&w.promo===P.id&&!w.nw&&w.inj<=0&&!(w.away>=S.week)&&w.rest!==S.week&&A.fav[id]>=2;}).sort(function(a,b){return A.fav[b]-A.fav[a];}).slice(0,6);
  var on={};card.forEach(function(m){[].concat.apply([],m.sides).forEach(function(id){on[id]=1;});});
  var swaps=lv,done=0;
  favs.forEach(function(id){
    if(on[id]||done>=swaps)return;var f=S.w[id];
    var cand=card.filter(function(m,i){return i<card.length-1&&m.mt==='1v1'&&!m.title&&m.sides.every(function(s){return s.length===1;});});
    for(var c=0;c<cand.length;c++){var m=cand[c],ix=m.sides.findIndex(function(s){var w=S.w[s[0]];return w&&w.g===f.g&&w.ovr<=f.ovr+6;});if(ix>=0&&!(show.brand&&f.brand!==show.brand&&!show.big)){on[m.sides[ix][0]]=0;m.sides[ix]=[id];on[id]=1;done++;break;}}
  });
  // the same share of calls as you make, spent on the likelier winner, within the booking power in hand
  card.forEach(function(m){if(m.call==null&&chance(S,H.call*(0.4+lv*0.2))){var o=E.matchOdds(S,m,0,card.length);if(o&&o.fav!=null&&o.p[o.fav]>=0.5)m.call=o.fav;}});
  var g=0;while(g++<10&&cardCost(S,card)>S.bp){var last=card.slice().reverse().filter(function(m){return m.call!=null;})[0];if(!last)break;delete last.call;}
  return card;
}
E.assistantBook=function(S){S.card=showFill(S,asstBook(S));return S.card;};
/* a small show the assistant runs: never a big event, and a worse card while it is still learning */
CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal||ctx.m.asst==null)return null;
  var lv=ctx.m.asst,d=-(3-lv)*0.5;
  return d?{d:d,x:'The assistant is still learning your way'}:(lv>=3?{d:0.3,x:'Booked the way the boss would'}:null);
});
E.assistant=function(S){
  var A=asstInit(S),lv=asstLvl(A),H=A.h;
  var fav=Object.keys(A.fav).map(Number).filter(function(id){return S.w[id];}).sort(function(a,b){return A.fav[b]-A.fav[a];}).slice(0,4).map(function(id){return S.w[id];});
  return {lvl:lv,word:ASTN[lv],shows:A.n,next:lv<3?[20,60,140][lv]-A.n:0,own:A.own,
    habits:['You like '+(H.L>=H.M&&H.L>=H.S?'long':(H.S>=H.M?'short':'medium'))+' matches.',H.stip>=0.25?'You book a lot of gimmick matches.':'You rarely book gimmick matches.',H.call>=0.4?'You call a lot of finishes.':(H.call>=0.15?'You call a few finishes.':'You mostly let matches play out.'),H.young>=0.5?'You like a young name in the main event.':'You like a veteran in the main event.'],fav:fav};
};
/* fast mode: the assistant books and runs every small show left this week, and stops at the first big event */
E.assistantRun=function(S){
  var out=[],A=asstInit(S);if(S.over)return out;
  while(S.qi<S.queue.length&&!S.queue[S.qi].big&&!S.over){
    var show=S.queue[S.qi],card=showFill(S,asstBook(S));S.card=card;
    var pr=E.preShow(S,card);if(pr){E.resolvePre(S,card,0);fitShow(S,card);}
    var v=E.validate(S,card);if(v.errors.length){out.push({show:show.name,err:v.errors[0]});break;}
    S.asstRun=true;var r=E.runPlayerShow(S,card);S.asstRun=false;
    if(r.errors){out.push({show:show.name,err:r.errors[0]});break;}
    A.own++;out.push({show:show.name,rating:r.rep.rating,exp:r.rep.exp});
  }
  return out;
};
