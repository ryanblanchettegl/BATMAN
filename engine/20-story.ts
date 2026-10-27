// @ts-nocheck
/* Moved from src/20-story.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.promoScore = promoScore; $L.angle = angle; $L.beatTag = beatTag; $L.feudAct = feudAct; $L.nextBigName = nextBigName; $L.genAngle = genAngle;
/* ---------- angles: the story director ---------- */
export function promoScore(S,w,bonus){return $L.clamp(Math.round(0.62*$L.micOf(S,w)+0.38*w.ovr+(bonus||0)+(S.booker&&w.promo===S.player?S.booker.sk.creative:0)+$L.rnd(S)*8-4),5,99);}
export function angle(head,text,ov){return {k:'angle',head:head,text:text,ov:$L.clamp(Math.round(ov),5,99)};}
/* Every storyline beat is a scene (rule 9c): an angle the story director writes says which beat it is (`beat`) and who
   is in it, in the order the scene casts them (`bids`: the first is A, the second B, a third C). The screens play the
   scene 'beat_<beat>' for it, or the booked kind's 'seg_<beat>' where the beat is the same thing. BEATS lists them all. */
export var BEATS=['feud_words','feud_stare','feud_sneak','feud_brawl','feud_partner','feud_signing','feud_video','feud_stakes','feud_betray','feud_injury','feud_swerve','feud_made','feud_final','interview','ambush','challenge','faceoff','save','turn','mystery','mystery_clue','mystery_reveal','return','stable','stable_out','debut_vig','debut_atk','debut_match','chapter','payoff'];
$L.BEATS = BEATS;   // the last five are matches: a debut (seg.debut) and a story's chapter or ending (seg.story)
export function beatTag(r,beat,ws){if(r){r.beat=beat;r.bids=ws.filter(function(w){return !!w;}).map(function(w){return w.id;});}return r;}
/* who each feud beat is about, worked out before the beat runs (a betrayal moves people between sides) */
export var BEAT_WHO={
  words:function(c){var sp=c.a.mic>=c.b.mic?c.a:c.b;return [sp,sp===c.a?c.b:c.a];},
  stare:function(c){var x=c.h||c.a;return [x,x===c.a?c.b:c.a];},
  sneak:function(c){return [c.h,c.o];},
  brawl:function(c){return [c.h||c.a,c.o||c.b];},
  partner:function(c){return [c.h,$L.partnerOf(c.S,c.o),c.o];},
  stakes:function(c){var sp=c.a.mic>=c.b.mic?c.a:c.b;return [sp,sp===c.a?c.b:c.a];},
  betray:function(c){var A=c.f.a,B=c.f.b,from=(A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))?A:B;return [c.S.w[from[1]],c.S.w[from[0]]];},
  injury:function(c){return [c.h,c.o];},
  swerve:function(c){var x=c.a.mic>=c.b.mic?c.b:c.a;return [x,x===c.a?c.b:c.a];}
};
$L.BEAT_WHO = BEAT_WHO;
export var ACTN=['','Spark','Escalation','Twist','Blow-off'];
$L.ACTN = ACTN;
export function feudAct(f,S){if(S&&f.promo!=null)return $L.feudActCal(S,f);return f.res?4:(f.heat>=60?(f.twist?4:3):(f.heat>=30?2:1));}
export function nextBigName(S,P){var w=S.week+(4-$L.cal(S.week).wom);return P.name+' '+$L.evName(S,P,$L.cal(w).month);}

/* Feud storylets: each feud moves through four acts, and each act unlocks different beats.
   A storylet is {id, head, acts, w (weight), ok(c) -> bool, run(c) -> angle}. c carries the feud and both leads. */
export var FEUDLETS=[
  {id:'words',head:'Promo',acts:[1,2],w:4,ok:function(){return true;},run:function(c){
    var sp=c.a.mic>=c.b.mic?c.a:c.b,tg=sp===c.a?c.b:c.a,sc=$L.promoScore(c.S,sp,c.f.heat*0.06);
    $L.heatUp(c.S,c.f,3+sc/14,sp.name+' cut a promo on '+tg.name);
    return $L.angle('Promo',$L.chance(c.S,0.5)?sp.name+' runs down '+tg.name+' on the microphone and promises to settle it in the ring.':sp.name+' calls out '+tg.name+'. The two go nose to nose on the stage before officials step in.',sc);}},
  {id:'stare',head:'Mind games',acts:[1],w:2,ok:function(){return true;},run:function(c){
    var x=c.h||c.a,y=x===c.a?c.b:c.a;$L.heatUp(c.S,c.f,4,x.name+' played mind games with '+y.name);
    return $L.angle('Mind games',x.name+' appears at the top of the ramp during '+y.name+'’s interview, says nothing, and walks away.',0.7*(c.a.ovr+c.b.ovr)/2+6+$L.rnd(c.S)*6-3);}},
  {id:'sneak',head:'Ambush',acts:[1,2],w:3,ok:function(c){return !!c.h&&c.f.kind!=='dream';},run:function(c){
    $L.heatUp(c.S,c.f,7,c.h.name+' jumped '+c.o.name+' from behind');
    return $L.angle('Ambush',c.h.name+' jumps '+c.o.name+' from behind in the parking lot and leaves '+c.o.name+' down on the concrete.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+4);}},
  {id:'brawl',head:'Brawl',acts:[2,3,4],w:3,ok:function(c){return c.f.kind!=='dream';},run:function(c){
    $L.heatUp(c.S,c.f,8,'Pull-apart brawl between '+c.a.name+' and '+c.b.name);
    return $L.angle('Brawl',$L.chance(c.S,0.5)?c.a.name+' and '+c.b.name+' come to blows backstage. Officials pull them apart.':(c.h||c.a).name+' jumps '+(c.o||c.b).name+' during an interview. Security separates them.',0.7*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+4+$L.rnd(c.S)*8-4);}},
  {id:'partner',head:'Attack',acts:[2],w:3,ok:function(c){if(!c.h||c.f.kind==='dream')return false;var pt=$L.partnerOf(c.S,c.o);return !!pt&&c.ok(pt.id)&&c.f.a.concat(c.f.b).indexOf(pt.id)<0;},run:function(c){
    var pt=$L.partnerOf(c.S,c.o),side=c.f.a.indexOf(c.o.id)>=0?c.f.a:c.f.b;if(side.length<2)side.push(pt.id);c.mark(pt);
    $L.heatUp(c.S,c.f,8,c.h.name+' went after '+c.o.name+'’s partner '+pt.name);
    return $L.angle('Attack',c.h.name+' cannot get to '+c.o.name+', so '+pt.name+' pays for it instead. '+c.o.name+' arrives too late to help.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+5);}},
  {id:'signing',head:'Contract signing',acts:[2,4],w:4,ok:function(c){return $L.cal(c.S.week).wom>=3||c.show.big;},run:function(c){
    $L.heatUp(c.S,c.f,10,'The contract signing between '+c.a.name+' and '+c.b.name+' ended in a brawl');
    return $L.angle('Contract signing',c.a.name+' and '+c.b.name+' sit down to sign the contract. Pens are thrown, the table goes over, and security floods the ring.',0.75*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+5);}},
  {id:'video',head:'Video',acts:[2,3,4],w:1.5,ok:function(c){return c.f.log.length>=4;},run:function(c){
    $L.heatUp(c.S,c.f,3,'A video package told the story so far');
    return $L.angle('Video','A video package retells the story of '+c.a.name+' and '+c.b.name+', from the first shove to last week.',0.8*(c.a.ovr+c.b.ovr)/2+4);}},
  {id:'stakes',head:'Stakes',acts:[3],w:7,twist:true,ok:function(){return true;},run:function(c){
    var st=$L.pick(c.S,c.f.title?['Loser sits out four weeks','No disqualifications: nobody can save you']:['Loser sits out four weeks','Winner gets a title shot','No disqualifications: nobody can save you']);
    c.f.stakes=st;c.f.twist='stakes';$L.heatUp(c.S,c.f,10,'The stakes were raised: '+st.toLowerCase());
    var sp=c.a.mic>=c.b.mic?c.a:c.b;
    return $L.angle('Stakes',sp.name+' raises the stakes, and '+(sp===c.a?c.b:c.a).name+' accepts on the spot. '+st+'.',$L.promoScore(c.S,sp,8));}},
  {id:'betray',head:'Betrayal',acts:[3],w:8,twist:true,ok:function(c){var A=c.f.a,B=c.f.b;return (A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))||(B.length>1&&A.indexOf(B[1])<0&&c.ok(B[1]));},run:function(c){
    var S=c.S,A=c.f.a,B=c.f.b,from=(A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))?A:B,to=from===A?B:A,lead=S.w[from[0]],ally=S.w[from[1]];
    if(!ally){$L.heatUp(S,c.f,6,c.a.name+' and '+c.b.name+' had to be pulled apart');return $L.angle('Brawl',c.a.name+' and '+c.b.name+' go at it before the bell and have to be pulled apart.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+5);}
    from.splice(1,1);if(to.length<2)to.push(ally.id);
    var tm=$L.teamOf(S,ally);if(tm&&tm.m.indexOf(lead.id)>=0){c.P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(lead.id)>=0&&tt.holders.indexOf(ally.id)>=0){tt.holders=[];tt.since=S.week;$L.news(S,'title','The '+c.P.name+' '+tt.name+' are vacated after the champions split.');}});$L.dissolveTeam(S,tm);}
    if(ally.align===lead.align)$L.turn(S,ally,'turned on '+lead.name);
    c.f.twist='betray';c.mark(ally);$L.heatUp(S,c.f,15,ally.name+' turned on '+lead.name);$L.memBetray(S,ally,lead);$L.award(S,'ACH_BETRAYAL');
    return $L.angle('Betrayal',lead.name+' turns around to find '+ally.name+' standing there. '+ally.name+' strikes first. The one person '+lead.name+' trusted has switched sides.',0.8*(lead.ovr+ally.ovr)/2+12);}},
  {id:'injury',head:'Attack',acts:[3],w:6,twist:true,ok:function(c){return !!c.h&&c.f.kind!=='dream'&&!c.left[c.o.id]&&!c.left[c.h.id];},run:function(c){
    c.o.away=c.S.week+1;c.f.twist='injury';$L.heatUp(c.S,c.f,12,c.h.name+' put '+c.o.name+' through a table');
    return $L.angle('Attack',c.h.name+' puts '+c.o.name+' through the announce table. '+c.o.name+' is helped to the back and will miss next week.',0.75*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+8);}},
  {id:'swerve',head:'Turn',acts:[3],w:8,twist:true,ok:function(c){return c.f.kind==='dream';},run:function(c){
    var x=c.a.mic>=c.b.mic?c.b:c.a,y=x===c.a?c.b:c.a;$L.turn(c.S,x,'attacked '+y.name+' during a handshake');
    c.f.kind='feud';c.f.twist='swerve';$L.heatUp(c.S,c.f,20,x.name+' attacked '+y.name+' during a handshake');
    return $L.angle('Turn',y.name+' offers a handshake. '+x.name+' takes it, pulls '+y.name+' in, and lays '+y.name+' out. Respect is finished.',0.8*(c.a.ovr+c.b.ovr)/2+14);}},
  {id:'made',head:'Announcement',acts:[4],w:8,ok:function(c){return !c.f.finale&&!c.show.big;},run:function(c){
    var ev=$L.nextBigName(c.S,c.P),tt=c.f.title?$L.titleById(c.P,c.f.title):null;c.f.finale=true;
    $L.heatUp(c.S,c.f,6,'The match was made official for '+ev);
    return $L.angle('Announcement','It is official: '+c.a.name+' against '+c.b.name+' at '+ev+(tt?', for the '+tt.name:'')+(c.f.stakes?'. '+c.f.stakes:'')+'.',0.75*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+4);}},
  {id:'final',head:'Face-off',acts:[4],w:3,ok:function(c){return !!c.f.finale;},run:function(c){
    $L.heatUp(c.S,c.f,5,'One last face-off before the match');
    return $L.angle('Face-off',c.a.name+' and '+c.b.name+' stand nose to nose in the ring. Nothing left to say. It ends at the big event.',0.75*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+3);}}
];
$L.FEUDLETS = FEUDLETS;

export function genAngle(S,P,show,ctx){
  var pool=ctx.pool,inP=ctx.inP,ang=ctx.angled,opts=[];
  function ok(id){return inP[id]&&!ang[id]&&!(S.w[id].away>=S.week);}
  function mark(){for(var i=0;i<arguments.length;i++)ang[arguments[i].id]=1;}
  var my=S.mystery&&S.mystery.promo===P.id?S.mystery:null;
  // feud storylets
  $L.activeFeuds(S).forEach(function(f){
    if(f.promo!==P.id||!ok(f.a[0])||!ok(f.b[0]))return;
    var a=S.w[f.a[0]],b=S.w[f.b[0]],h=a.align==='H'?a:(b.align==='H'?b:null),act=$L.feudAct(f,S),seg=$L.feudSeg(S,f);
    var c={S:S,P:P,f:f,a:a,b:b,h:h,o:h?(h===a?b:a):null,show:show,ok:ok,mark:mark,left:ctx.left||{}};
    $L.FEUDLETS.forEach(function(sl){
      if(sl.acts.indexOf(act)<0||!sl.ok(c))return;
      if(sl.twist&&f.tww!=null&&f.tww>=seg.s0)return;   // one twist to a stretch of the story
      opts.push([sl.w*(1+f.heat/100)*(f.beat===sl.id?0.12:1),function(){mark(a,b);f.beat=sl.id;if(sl.twist)f.tww=S.week;var bw=$L.BEAT_WHO[sl.id]?$L.BEAT_WHO[sl.id](c):[a,b],r=sl.run(c);r.feud=f.id;r.act=$L.feudAct(f,S);return $L.beatTag(r,'feud_'+(r.head===sl.head?sl.id:'brawl'),r.head===sl.head?bw:[a,b]);}]);
    });
  });
  function interview(){
    var c=pool.filter(function(w){return !ang[w.id];}).sort(function(a,b){return (b.mic+b.ovr*0.5)-(a.mic+a.ovr*0.5);}).slice(0,4);
    if(!c.length)return null;var sp=$L.pick(S,c),sc=$L.promoScore(S,sp,0),lv=$L.holdLvl(P,sp.id);mark(sp);
    if(sc>sp.ovr)$L.addOvr(P,sp,0.25);
    if($L.hasMouthpiece(S,sp))return $L.beatTag($L.angle('Interview',S.w[sp.mgr].name+' does the talking for '+sp.name+', and does it well: '+(lv?'the title is going nowhere.':'the best is still to come.'),sc),'interview',[sp]);
    var r0=$L.angle('Interview',sp.name+' takes the microphone and '+(lv?'vows that the title is going nowhere.':(sp.ws>=3?'talks up a '+sp.ws+'-match winning streak.':'promises bigger things are coming.')),sc);
    r0.text+=' '+$L.promoSpeech(S,sp,null,'interview',sc,ctx.city||null,'wi'+S.week+':'+sp.id);return $L.beatTag(r0,'interview',[sp]);
  }
  function callOut(){
    var hs=pool.filter(function(w){return w.align==='H'&&w.mic>=55&&!ang[w.id]&&!$L.inFeud(S,w.id);});if(!hs.length)return null;
    hs.sort(function(a,b){return b.ovr-a.ovr;});var h=$L.pick(S,hs.slice(0,8));
    var ts=pool.filter(function(w){return w.align==='F'&&w.g===h.g&&!ang[w.id]&&!$L.inFeud(S,w.id)&&Math.abs(w.ovr-h.ovr)<=10&&(h.team==null||w.team!==h.team);});
    if(!ts.length)return null;ts.sort(function(a,b){return Math.abs(a.ovr-h.ovr)-Math.abs(b.ovr-h.ovr);});
    var tg=ts[0];if(!$L.startFeud(S,P,tg,h,24+$L.ri(S,0,10),h.name+' attacked '+tg.name+' from behind'))return null;mark(h,tg);
    return $L.beatTag($L.angle('Ambush',h.name+' interrupts '+tg.name+'’s interview and attacks from behind. A new rivalry begins.',$L.promoScore(S,h,3)),'ambush',[h,tg]);
  }
  function champChallenge(){
    var ts=$L.showTitles(P,show).filter(function(t){return !t.tag&&t.holders.length&&ok(t.holders[0])&&!$L.inFeud(S,t.holders[0]);});if(!ts.length)return null;
    var t=$L.pick(S,ts),c=S.w[t.holders[0]];
    var cs=pool.filter(function(w){return w.id!==c.id&&w.g===c.g&&!ang[w.id]&&$L.holdLvl(P,w.id)===0&&!$L.inFeud(S,w.id)&&Math.abs(w.ovr-c.ovr)<=16&&(!t.brand||show.big||w.brand===t.brand);});
    if(!cs.length)return null;cs.sort(function(a,b){return (b.ovr+b.mom*2+(b.align!==c.align?6:0))-(a.ovr+a.mom*2+(a.align!==c.align?6:0));});
    var ch=cs[0];if(!$L.startFeud(S,P,ch,c,30,ch.name+' challenged for the '+t.name,{title:t.id}))return null;mark(c,ch);
    var r1=$L.angle('Challenge',ch.name+' interrupts '+c.name+' and lays claim to the '+t.name+'.',$L.promoScore(S,ch.mic>c.mic?ch:c,4)),k1='wc'+S.week+':'+ch.id;
    r1.text+=' '+$L.promoSpeech(S,ch,c,'challenge',ch.mic,ctx.city||null,k1)+' '+$L.promoSpeech(S,c,ch,'words',c.mic,ctx.city||null,k1+'b');return $L.beatTag(r1,'challenge',[ch,c]);
  }
  function mysteryStart(){
    var os=pool.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=os[Math.floor(os.length*0.3)]||0;
    var vs=pool.filter(function(w){return w.align==='F'&&w.ovr>=cut&&!ang[w.id]&&!$L.inFeud(S,w.id);});if(!vs.length)return null;
    var v=$L.pick(S,vs);S.mystery={v:v.id,left:$L.ri(S,2,3),promo:P.id,start:S.week};mark(v);
    $L.news(S,'story','Who attacked '+v.name+'? Nobody saw a thing.');
    return $L.beatTag($L.angle('Mystery',v.name+' is found laid out in the locker room. Nobody saw the attacker.',0.8*v.ovr+8+$L.rnd(S)*6-3),'mystery',[v]);
  }
  function mysteryClue(){
    var v=S.w[my.v];my.left--;mark(v);
    return $L.beatTag($L.angle('Mystery',$L.chance(S,0.5)?'Footage of the attack on '+v.name+' airs. The attacker’s face is hidden.':v.name+' demands answers and accuses half the locker room.',0.75*v.ovr+8+$L.rnd(S)*6-3),'mystery_clue',[v]);
  }
  function mysteryReveal(){
    var v=S.w[my.v],pt=$L.partnerOf(S,v),c=null,betray=false;
    if(pt&&pt.promo===P.id&&pt.inj<=0&&$L.chance(S,0.4)){c=pt;betray=true;}
    if(!c){var hs=$L.rosterOf(S,P.id).filter(function(w){return w.id!==v.id&&w.g===v.g&&w.inj<=0&&!w.camp&&!w.nw&&!$L.inFeud(S,w.id)&&(w.team==null||w.team!==v.team);});
      hs.sort(function(a,b){return (Math.abs(a.ovr-v.ovr)+(a.align==='H'?0:12))-(Math.abs(b.ovr-v.ovr)+(b.align==='H'?0:12));});c=hs[0];}
    S.mystery=null;if(!c)return null;
    if(betray){var tm=$L.teamOf(S,v);P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(v.id)>=0){tt.holders=[];tt.since=S.week;$L.news(S,'title','The '+P.name+' '+tt.name+' are vacated after the champions split.');}});if(tm)$L.dissolveTeam(S,tm);$L.award(S,'ACH_BETRAYAL');}
    if(c.align==='F')$L.turn(S,c,'revealed as the mystery attacker');
    var f=$L.startFeud(S,P,v,c,65,c.name+' was revealed as the one who attacked '+v.name,{force:true});if(f)f.twist='reveal';
    $L.award(S,'ACH_MYSTERY');mark(v,c);
    return $L.beatTag($L.angle('Reveal','The attacker is revealed: '+c.name+'.'+(betray?' '+v.name+'’s own partner.':'')+' '+v.name+' wants revenge.',0.8*(v.ovr+c.ovr)/2+12),'mystery_reveal',[c,v]);
  }
  function stareDown(){
    var GX=$L.mainG(S,P),L=pool.filter(function(w){return !ang[w.id]&&!$L.inFeud(S,w.id)&&w.g===GX;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,6);
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){
      var a=L[i],b=L[j],rk=S.recent[P.id+':'+$L.rkey(a.id,b.id)];
      if(a.align!=='F'||b.align!=='F'||(a.team!=null&&a.team===b.team)||(rk&&S.week-rk<10))continue;
      if(!$L.startFeud(S,P,a,b,30,a.name+' and '+b.name+' faced off',{kind:'dream'}))return null;mark(a,b);
      var r2=$L.angle('Face-off',a.name+' and '+b.name+' cross paths on the stage. Neither backs down, and the crowd wants the match.',0.8*(a.ovr+b.ovr)/2+8),k2='wf'+S.week+':'+a.id;
      r2.text+=' '+$L.promoSpeech(S,a,b,'faceoff',a.mic,ctx.city||null,k2)+' '+$L.promoSpeech(S,b,a,'faceoff',b.mic,ctx.city||null,k2+'b');return $L.beatTag(r2,'faceoff',[a,b]);
    }
    return null;
  }
  function comeback(){
    var c=pool.filter(function(w){return w.ret&&!ang[w.id];});if(!c.length)return null;
    var w=c[0],f=$L.feudsFor(S,w.id)[0],r=null;w.ret=false;w.mom=$L.clamp(w.mom+3,-10,10);mark(w);
    if(f){r=S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]];$L.heatUp(S,f,10,w.name+' returned and went after '+r.name);}
    return $L.beatTag($L.angle('Return',w.name+' returns to a big reaction'+(r?' and goes straight after '+r.name+'.':'.'),0.9*w.ovr+8),'return',[w,r]);
  }
  function teamUp(){
    var os=pool.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),lo=os[Math.floor(os.length*0.3)]||0,hi=os[Math.floor(os.length*0.8)]||100;
    var fa=pool.filter(function(w){return w.align==='F'&&w.team==null&&!ang[w.id]&&w.ovr>=lo&&w.ovr<=hi&&!$L.inFeud(S,w.id);});
    if(fa.length<2)return null;var a=$L.pick(S,fa);
    var bs=fa.filter(function(w){return w.id!==a.id&&w.g===a.g&&Math.abs(w.ovr-a.ovr)<=8&&(!a.brand||w.brand===a.brand);});if(!bs.length)return null;
    var hs=pool.filter(function(w){return w.align==='H'&&w.g===a.g&&!ang[w.id]&&Math.abs(w.ovr-a.ovr)<=14;});if(!hs.length)return null;
    var b=$L.pick(S,bs),h=$L.pick(S,hs);$L.formTeam(S,P,a,b,8);mark(a,b,h);
    var f=$L.startFeud(S,P,a,h,20,h.name+' attacked '+a.name+'; '+b.name+' made the save');if(f&&f.a.indexOf(a.id)>=0&&f.a.length<2)f.a.push(b.id);
    $L.news(S,'story','New team: '+a.name+' & '+b.name+'.');
    return $L.beatTag($L.angle('Save',h.name+' attacks '+a.name+' after an interview. '+b.name+' runs out to make the save, and the two shake hands. A new team is born.',0.75*(a.ovr+b.ovr+h.ovr)/3+6),'save',[a,b,h]);
  }
  function crowdTurn(){
    var c=pool.filter(function(w){return !ang[w.id]&&!$L.inFeud(S,w.id)&&((w.align==='H'&&w.mom>=4&&w.mic>=65)||(w.align==='F'&&w.mom<=-4&&w.mic>=60));});if(!c.length)return null;
    var w=$L.pick(S,c),was=w.align;mark(w);
    $L.turn(S,w,was==='H'?'the crowd got behind them':'turned on the fans');
    if(was==='H')$L.addOvr(P,w,2);else w.mom=$L.clamp(w.mom+3,-10,10);
    return $L.beatTag($L.angle('Turn',was==='H'?'The crowd has been cheering '+w.name+' for weeks. Tonight '+w.name+' embraces it.':'After weeks of losses, '+w.name+' blames the fans and walks out to boos.',$L.promoScore(S,w,6)),'turn',[w]);
  }
  if(my&&my.left<=0){var r=mysteryReveal();if(r)return r;}
  if(pool.some(function(w){return w.ret&&!ang[w.id];}))opts.push([7,comeback]);
  if(my&&inP[my.v]&&!ang[my.v])opts.push([4,mysteryClue]);
  var nf=$L.activeFeuds(S).length;
  if(nf<6){opts.push([nf<3?5:2,callOut]);opts.push([nf<3?4:2,champChallenge]);opts.push([0.8,stareDown]);}
  if(!S.mystery)opts.push([0.7,mysteryStart]);
  opts.push([0.8,teamUp]);opts.push([1,crowdTurn]);opts.push([1.5,interview]);
  $L.ANGX.forEach(function(fn){var e=fn(S,P,show,ctx,{ok:ok,mark:mark,pool:pool,ang:ang});if(e)opts.push(e);});
  for(var tries=0;tries<5&&opts.length;tries++){
    var tot=0,i;for(i=0;i<opts.length;i++)tot+=opts[i][0];
    var x=$L.rnd(S)*tot;for(i=0;i<opts.length;i++){x-=opts[i][0];if(x<=0)break;}
    i=Math.min(i,opts.length-1);
    var res=opts[i][1]();if(res)return res;opts.splice(i,1);
  }
  return interview();
}

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.promoScore = promoScore;
$L.angle = angle;
$L.BEATS = BEATS;
$L.beatTag = beatTag;
$L.BEAT_WHO = BEAT_WHO;
$L.ACTN = ACTN;
$L.feudAct = feudAct;
$L.nextBigName = nextBigName;
$L.FEUDLETS = FEUDLETS;
$L.genAngle = genAngle;
