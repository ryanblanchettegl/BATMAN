/* ===== Story sifting: storylines the game finds in what has already happened =====
   In the manner of Felt (story sifting over an event log): each pattern looks through your roster's history (head
   to head records, title changes, the relationship matrix, who trained whom) for a pair of people who already have
   a story between them and are not in a feud. E.sift(S) lists the best few, each with the facts that make it a story
   and a pitch line from the grammar. It only reads the game and never calls rnd(S). */
var GR_SIFT={
  pitch:[
    {t:'#p_rubber#',if:function(c){return c.k==='rubber';}},
    {t:'#p_rematch#',if:function(c){return c.k==='rematch';}},
    {t:'#p_heat#',if:function(c){return c.k==='heat';}},
    {t:'#p_teach#',if:function(c){return c.k==='teach';}},
    {t:'#p_shadow#',if:function(c){return c.k==='shadow';}},
    {t:'#p_owed#',if:function(c){return c.k==='owed';}},
    {t:'#p_again#',if:function(c){return c.k==='again';}}
  ],
  p_rubber:['One more match settles it.','The series is too close to leave alone.','The crowd wants to know who is better. So do they.','Best of {n} is not enough. Make it a decider.'],
  p_rematch:['{b} never got the rematch.','{b} has been waiting for this since the night the belt went.','The old champion against the new one.','{b} says the title was taken, not won.'],
  p_heat:['There is real heat here. Put it in the ring before it boils over backstage.','They cannot stand each other. The crowd will feel it.','Nobody has to act. That is the best kind of story.'],
  p_teach:['The student is ready to step out of the shadow.','Teacher against student: one of them learns something.','{b} taught {a} everything. Almost everything.'],
  p_shadow:['{a} is tired of standing behind {b}.','Partners who need different things.','One of them is going to turn. The question is when.'],
  p_again:['They were never really finished.','The last chapter left a door open.','{a} and {b} again. The crowd remembers.','Months later, it still is not settled.'],
  p_owed:['{a} beat {b} clean and {b} has not forgotten.','{b} wants the loss back.','Last time, {a} won. {b} says that was the last time.']
};
var SIFT_N={rubber:'The decider',rematch:'The rematch never given',heat:'Real heat',teach:'Teacher and student',shadow:'Partners apart',owed:'A loss to pay back',again:'Unfinished business'};

/** Every storyline the game can find on your roster right now, best first. */
E.sift=function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt;}),on={},out=[],seen={};
  R.forEach(function(w){on[w.id]=w;});
  var feuding=function(a,b){return activeFeuds(S).some(function(f){return (f.a.indexOf(a)>=0&&f.b.indexOf(b)>=0)||(f.a.indexOf(b)>=0&&f.b.indexOf(a)>=0);});};
  var add=function(k,a,b,score,facts){
    if(!on[a]||!on[b]||a===b||feuding(a,b))return;var key=rkey(a,b);if(seen[key]&&seen[key].score>=score)return;
    var A=S.w[a],B=S.w[b],c={k:k,a:A.name,b:B.name,n:facts.n||3};
    var x={k:k,n:SIFT_N[k],a:a,b:b,score:score,facts:facts.lines,pitch:gram(GR_SIFT,'pitch',c,'sift'+key+k+Math.floor(S.week/4))};
    if(seen[key])out.splice(out.indexOf(seen[key]),1);seen[key]=x;out.push(x);
  };
  // a close series: three or more meetings, no more than one win between them
  Object.keys(S.h2h||{}).forEach(function(key){
    var h=S.h2h[key],ids=key.split('-').map(Number);if(h.n<3||Math.abs(h.a-h.b)>1)return;
    var lo=Math.min(ids[0],ids[1]),hi=Math.max(ids[0],ids[1]);if(!on[lo]||!on[hi])return;
    add('rubber',lo,hi,40+h.n*6,{n:h.n+1,lines:['They have met '+h.n+' times on your shows.',S.w[lo].name+' '+h.a+', '+S.w[hi].name+' '+h.b+(h.n-h.a-h.b>0?', and '+(h.n-h.a-h.b)+' with no winner':'')+'.']});
  });
  // the rematch never given: whoever lost a title on your shows, still here, and not champion since
  P.titles.forEach(function(t){
    if(!t.holders.length||t.tag)return;var cur=t.holders[0],h=(t.hist||[]).slice(-3);
    h.forEach(function(r){var old=+String(r.ids).split(',')[0];if(r.to==null||old===cur||!on[old])return;if(S.week-r.to>24)return;
      add('rematch',cur,old,70-(S.week-r.to),{lines:[S.w[old].name+' lost the '+t.name+' to '+S.w[cur].name+' '+(S.week-r.to<=1?'last week':(S.week-r.to)+' weeks ago')+'.','There has been no rematch.']});});
  });
  // a head to head that one of them wants back: beaten more than once, the last one too
  Object.keys(S.h2h||{}).forEach(function(key){
    var h=S.h2h[key],ids=key.split('-').map(Number),lo=Math.min(ids[0],ids[1]),hi=Math.max(ids[0],ids[1]);if(h.n<2||h.lw<0||S.week-h.w>12)return;
    var win=h.lw,lose=win===lo?hi:lo,ww=win===lo?h.a:h.b,lw=win===lo?h.b:h.a;if(ww<2||lw>0)return;
    add('owed',win,lose,30+ww*8,{lines:[S.w[win].name+' has beaten '+S.w[lose].name+' '+ww+' times out of '+h.n+'.',S.w[lose].name+' has not won one yet.']});
  });
  // real heat: two people who do not get on, from the relationship matrix
  R.forEach(function(A){R.forEach(function(B){
    if(A.id>=B.id)return;var b=bondOf(S,A.id,B.id);if(b>-REL_ON)return;
    add('heat',A.id,B.id,30+Math.min(25,(-b-REL_ON)/3),{lines:[A.name+' and '+B.name+' do not get on.',(b<=-60?'It is bad enough that people backstage have noticed.':'It has been building for a while.')]});
  });});
  // teacher and student, when the student is near the teacher on the card
  R.forEach(function(st){var t=st.coach!=null?on[st.coach]:null;if(!t||st.ovr<t.ovr-8)return;
    add('teach',st.id,t.id,45+(st.ovr-t.ovr),{lines:[t.name+' trained '+st.name+'.',st.ovr>=t.ovr?'The student is now the bigger name.':'The student is closing in.']});});
  // partners apart: one tag partner jealous of the other
  (S.teams||[]).forEach(function(tm){if(!tm.m||tm.m.length!==2||!on[tm.m[0]]||!on[tm.m[1]])return;
    var ja=jealOf(S,tm.m[0],tm.m[1]),jb=jealOf(S,tm.m[1],tm.m[0]),j=Math.max(ja,jb);if(j<35)return;var x=ja>=jb?tm.m[0]:tm.m[1],y=x===tm.m[0]?tm.m[1]:tm.m[0];
    add('shadow',x,y,30+j/2,{lines:[S.w[x].name+' and '+S.w[y].name+(tm.name?' team as '+tm.name+'.':' are a team.'),S.w[x].name+' has grown jealous of '+S.w[y].name+'.']});});
  // unfinished business: a story that ended hot at least twelve weeks ago, and both still here
  Object.keys(S.embers||{}).forEach(function(key){var e=S.embers[key],ids=key.split('-').map(Number);if(S.week-e.w<12||e.h<55)return;
    add('again',ids[0],ids[1],35+e.h/3,{lines:[S.w[ids[0]].name+' and '+S.w[ids[1]].name+' ended their story '+(S.week-e.w)+' weeks ago, still hot.',(e.n>1?'They have done this '+e.n+' times now.':'Start it again and it picks up where it left off.')]});});
  // the best of each kind first, then the next best of each, so one kind of story never fills the list
  out.sort(function(a,b){return b.score-a.score;});
  var by={},rank=[];out.forEach(function(x){var n=by[x.k]=(by[x.k]||0)+1;rank.push({x:x,r:n});});
  return rank.sort(function(a,b){return a.r-b.r||b.x.score-a.x.score;}).map(function(q){return q.x;}).slice(0,6);
};

