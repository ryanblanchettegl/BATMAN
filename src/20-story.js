/* ---------- angles: the story director ---------- */
function promoScore(S,w,bonus){return clamp(Math.round(0.62*micOf(S,w)+0.38*w.ovr+(bonus||0)+(S.booker&&w.promo===S.player?S.booker.sk.creative:0)+rnd(S)*8-4),5,99);}
function angle(head,text,ov){return {k:'angle',head:head,text:text,ov:clamp(Math.round(ov),5,99)};}
var ACTN=['','Spark','Escalation','Twist','Blow-off'];
function feudAct(f){return f.res?4:(f.heat>=60?(f.twist?4:3):(f.heat>=30?2:1));}
function nextBigName(S,P){var w=S.week+(4-cal(S.week).wom);return P.name+' '+dbOf(S).events[cal(w).month];}

/* Feud storylets: each feud moves through four acts, and each act unlocks different beats.
   A storylet is {id, head, acts, w (weight), ok(c) -> bool, run(c) -> angle}. c carries the feud and both leads. */
var FEUDLETS=[
  {id:'words',head:'Promo',acts:[1,2],w:4,ok:function(){return true;},run:function(c){
    var sp=c.a.mic>=c.b.mic?c.a:c.b,tg=sp===c.a?c.b:c.a,sc=promoScore(c.S,sp,c.f.heat*0.06);
    heatUp(c.S,c.f,3+sc/14,sp.name+' cut a promo on '+tg.name);
    return angle('Promo',chance(c.S,0.5)?sp.name+' runs down '+tg.name+' on the microphone and promises to settle it in the ring.':sp.name+' calls out '+tg.name+'. The two go nose to nose on the stage before officials step in.',sc);}},
  {id:'stare',head:'Mind games',acts:[1],w:2,ok:function(){return true;},run:function(c){
    var x=c.h||c.a,y=x===c.a?c.b:c.a;heatUp(c.S,c.f,4,x.name+' played mind games with '+y.name);
    return angle('Mind games',x.name+' appears at the top of the ramp during '+y.name+'’s interview, says nothing, and walks away.',0.7*(c.a.ovr+c.b.ovr)/2+6+rnd(c.S)*6-3);}},
  {id:'sneak',head:'Ambush',acts:[1,2],w:3,ok:function(c){return !!c.h&&c.f.kind!=='dream';},run:function(c){
    heatUp(c.S,c.f,7,c.h.name+' jumped '+c.o.name+' from behind');
    return angle('Ambush',c.h.name+' jumps '+c.o.name+' from behind in the parking lot and leaves '+c.o.name+' down on the concrete.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+4);}},
  {id:'brawl',head:'Brawl',acts:[2,3,4],w:3,ok:function(c){return c.f.kind!=='dream';},run:function(c){
    heatUp(c.S,c.f,8,'Pull-apart brawl between '+c.a.name+' and '+c.b.name);
    return angle('Brawl',chance(c.S,0.5)?c.a.name+' and '+c.b.name+' come to blows backstage. Officials pull them apart.':(c.h||c.a).name+' jumps '+(c.o||c.b).name+' during an interview. Security separates them.',0.7*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+4+rnd(c.S)*8-4);}},
  {id:'partner',head:'Attack',acts:[2],w:3,ok:function(c){if(!c.h||c.f.kind==='dream')return false;var pt=partnerOf(c.S,c.o);return !!pt&&c.ok(pt.id)&&c.f.a.concat(c.f.b).indexOf(pt.id)<0;},run:function(c){
    var pt=partnerOf(c.S,c.o),side=c.f.a.indexOf(c.o.id)>=0?c.f.a:c.f.b;if(side.length<2)side.push(pt.id);c.mark(pt);
    heatUp(c.S,c.f,8,c.h.name+' went after '+c.o.name+'’s partner '+pt.name);
    return angle('Attack',c.h.name+' cannot get to '+c.o.name+', so '+pt.name+' pays for it instead. '+c.o.name+' arrives too late to help.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+5);}},
  {id:'signing',head:'Contract signing',acts:[2,4],w:4,ok:function(c){return cal(c.S.week).wom>=3||c.show.big;},run:function(c){
    heatUp(c.S,c.f,10,'The contract signing between '+c.a.name+' and '+c.b.name+' ended in a brawl');
    return angle('Contract signing',c.a.name+' and '+c.b.name+' sit down to sign the contract. Pens are thrown, the table goes over, and security floods the ring.',0.75*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+5);}},
  {id:'video',head:'Video',acts:[2,3,4],w:1.5,ok:function(c){return c.f.log.length>=4;},run:function(c){
    heatUp(c.S,c.f,3,'A video package told the story so far');
    return angle('Video','A video package retells the story of '+c.a.name+' and '+c.b.name+', from the first shove to last week.',0.8*(c.a.ovr+c.b.ovr)/2+4);}},
  {id:'stakes',head:'Stakes',acts:[3],w:7,twist:true,ok:function(){return true;},run:function(c){
    var st=pick(c.S,c.f.title?['Loser sits out four weeks','No disqualifications: nobody can save you']:['Loser sits out four weeks','Winner gets a title shot','No disqualifications: nobody can save you']);
    c.f.stakes=st;c.f.twist='stakes';heatUp(c.S,c.f,10,'The stakes were raised: '+st.toLowerCase());
    var sp=c.a.mic>=c.b.mic?c.a:c.b;
    return angle('Stakes',sp.name+' raises the stakes, and '+(sp===c.a?c.b:c.a).name+' accepts on the spot. '+st+'.',promoScore(c.S,sp,8));}},
  {id:'betray',head:'Betrayal',acts:[3],w:8,twist:true,ok:function(c){var A=c.f.a,B=c.f.b;return (A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))||(B.length>1&&A.indexOf(B[1])<0&&c.ok(B[1]));},run:function(c){
    var S=c.S,A=c.f.a,B=c.f.b,from=(A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))?A:B,to=from===A?B:A,lead=S.w[from[0]],ally=S.w[from[1]];
    if(!ally){heatUp(S,c.f,6,c.a.name+' and '+c.b.name+' had to be pulled apart');return angle('Brawl',c.a.name+' and '+c.b.name+' go at it before the bell and have to be pulled apart.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+5);}
    from.splice(1,1);if(to.length<2)to.push(ally.id);
    var tm=teamOf(S,ally);if(tm&&tm.m.indexOf(lead.id)>=0){c.P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(lead.id)>=0&&tt.holders.indexOf(ally.id)>=0){tt.holders=[];tt.since=S.week;news(S,'title','The '+c.P.name+' '+tt.name+' are vacated after the champions split.');}});dissolveTeam(S,tm);}
    if(ally.align===lead.align)turn(S,ally,'turned on '+lead.name);
    c.f.twist='betray';c.mark(ally);heatUp(S,c.f,15,ally.name+' turned on '+lead.name);memBetray(S,ally,lead);award(S,'ACH_BETRAYAL');
    return angle('Betrayal',lead.name+' turns around to find '+ally.name+' standing there. '+ally.name+' strikes first. The one person '+lead.name+' trusted has switched sides.',0.8*(lead.ovr+ally.ovr)/2+12);}},
  {id:'injury',head:'Attack',acts:[3],w:6,twist:true,ok:function(c){return !!c.h&&c.f.kind!=='dream'&&!c.left[c.o.id]&&!c.left[c.h.id];},run:function(c){
    c.o.away=c.S.week+1;c.f.twist='injury';heatUp(c.S,c.f,12,c.h.name+' put '+c.o.name+' through a table');
    return angle('Attack',c.h.name+' puts '+c.o.name+' through the announce table. '+c.o.name+' is helped to the back and will miss next week.',0.75*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+8);}},
  {id:'swerve',head:'Turn',acts:[3],w:8,twist:true,ok:function(c){return c.f.kind==='dream';},run:function(c){
    var x=c.a.mic>=c.b.mic?c.b:c.a,y=x===c.a?c.b:c.a;turn(c.S,x,'attacked '+y.name+' during a handshake');
    c.f.kind='feud';c.f.twist='swerve';heatUp(c.S,c.f,20,x.name+' attacked '+y.name+' during a handshake');
    return angle('Turn',y.name+' offers a handshake. '+x.name+' takes it, pulls '+y.name+' in, and lays '+y.name+' out. Respect is finished.',0.8*(c.a.ovr+c.b.ovr)/2+14);}},
  {id:'made',head:'Announcement',acts:[4],w:8,ok:function(c){return !c.f.finale&&!c.show.big;},run:function(c){
    var ev=nextBigName(c.S,c.P),tt=c.f.title?titleById(c.P,c.f.title):null;c.f.finale=true;
    heatUp(c.S,c.f,6,'The match was made official for '+ev);
    return angle('Announcement','It is official: '+c.a.name+' against '+c.b.name+' at '+ev+(tt?', for the '+tt.name:'')+(c.f.stakes?'. '+c.f.stakes:'')+'.',0.75*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+4);}},
  {id:'final',head:'Face-off',acts:[4],w:3,ok:function(c){return !!c.f.finale;},run:function(c){
    heatUp(c.S,c.f,5,'One last face-off before the match');
    return angle('Face-off',c.a.name+' and '+c.b.name+' stand nose to nose in the ring. Nothing left to say. It ends at the big event.',0.75*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+3);}}
];

function genAngle(S,P,show,ctx){
  var pool=ctx.pool,inP=ctx.inP,ang=ctx.angled,opts=[];
  function ok(id){return inP[id]&&!ang[id]&&!(S.w[id].away>=S.week);}
  function mark(){for(var i=0;i<arguments.length;i++)ang[arguments[i].id]=1;}
  var my=S.mystery&&S.mystery.promo===P.id?S.mystery:null;
  // feud storylets
  activeFeuds(S).forEach(function(f){
    if(f.promo!==P.id||!ok(f.a[0])||!ok(f.b[0]))return;
    var a=S.w[f.a[0]],b=S.w[f.b[0]],h=a.align==='H'?a:(b.align==='H'?b:null),act=feudAct(f);
    var c={S:S,P:P,f:f,a:a,b:b,h:h,o:h?(h===a?b:a):null,show:show,ok:ok,mark:mark,left:ctx.left||{}};
    FEUDLETS.forEach(function(sl){
      if(sl.acts.indexOf(act)<0||!sl.ok(c))return;
      opts.push([sl.w*(1+f.heat/100)*(f.beat===sl.id?0.12:1),function(){mark(a,b);f.beat=sl.id;var r=sl.run(c);r.feud=f.id;r.act=feudAct(f);return r;}]);
    });
  });
  function interview(){
    var c=pool.filter(function(w){return !ang[w.id];}).sort(function(a,b){return (b.mic+b.ovr*0.5)-(a.mic+a.ovr*0.5);}).slice(0,4);
    if(!c.length)return null;var sp=pick(S,c),sc=promoScore(S,sp,0),lv=holdLvl(P,sp.id);mark(sp);
    if(sc>sp.ovr)addOvr(P,sp,0.25);
    if(hasMouthpiece(S,sp))return angle('Interview',S.w[sp.mgr].name+' does the talking for '+sp.name+', and does it well: '+(lv?'the title is going nowhere.':'the best is still to come.'),sc);
    return angle('Interview',sp.name+' takes the microphone and '+(lv?'vows that the title is going nowhere.':(sp.ws>=3?'talks up a '+sp.ws+'-match winning streak.':'promises bigger things are coming.')),sc);
  }
  function callOut(){
    var hs=pool.filter(function(w){return w.align==='H'&&w.mic>=55&&!ang[w.id]&&!inFeud(S,w.id);});if(!hs.length)return null;
    hs.sort(function(a,b){return b.ovr-a.ovr;});var h=pick(S,hs.slice(0,8));
    var ts=pool.filter(function(w){return w.align==='F'&&w.g===h.g&&!ang[w.id]&&!inFeud(S,w.id)&&Math.abs(w.ovr-h.ovr)<=10&&(h.team==null||w.team!==h.team);});
    if(!ts.length)return null;ts.sort(function(a,b){return Math.abs(a.ovr-h.ovr)-Math.abs(b.ovr-h.ovr);});
    var tg=ts[0];if(!startFeud(S,P,tg,h,24+ri(S,0,10),h.name+' attacked '+tg.name+' from behind'))return null;mark(h,tg);
    return angle('Ambush',h.name+' interrupts '+tg.name+'’s interview and attacks from behind. A new rivalry begins.',promoScore(S,h,3));
  }
  function champChallenge(){
    var ts=showTitles(P,show).filter(function(t){return !t.tag&&t.holders.length&&ok(t.holders[0])&&!inFeud(S,t.holders[0]);});if(!ts.length)return null;
    var t=pick(S,ts),c=S.w[t.holders[0]];
    var cs=pool.filter(function(w){return w.id!==c.id&&w.g===c.g&&!ang[w.id]&&holdLvl(P,w.id)===0&&!inFeud(S,w.id)&&Math.abs(w.ovr-c.ovr)<=16&&(!t.brand||show.big||w.brand===t.brand);});
    if(!cs.length)return null;cs.sort(function(a,b){return (b.ovr+b.mom*2+(b.align!==c.align?6:0))-(a.ovr+a.mom*2+(a.align!==c.align?6:0));});
    var ch=cs[0];if(!startFeud(S,P,ch,c,30,ch.name+' challenged for the '+t.name,{title:t.id}))return null;mark(c,ch);
    return angle('Challenge',ch.name+' interrupts '+c.name+' and lays claim to the '+t.name+'.',promoScore(S,ch.mic>c.mic?ch:c,4));
  }
  function mysteryStart(){
    var os=pool.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=os[Math.floor(os.length*0.3)]||0;
    var vs=pool.filter(function(w){return w.align==='F'&&w.ovr>=cut&&!ang[w.id]&&!inFeud(S,w.id);});if(!vs.length)return null;
    var v=pick(S,vs);S.mystery={v:v.id,left:ri(S,2,3),promo:P.id,start:S.week};mark(v);
    news(S,'story','Who attacked '+v.name+'? Nobody saw a thing.');
    return angle('Mystery',v.name+' is found laid out in the locker room. Nobody saw the attacker.',0.8*v.ovr+8+rnd(S)*6-3);
  }
  function mysteryClue(){
    var v=S.w[my.v];my.left--;mark(v);
    return angle('Mystery',chance(S,0.5)?'Footage of the attack on '+v.name+' airs. The attacker’s face is hidden.':v.name+' demands answers and accuses half the locker room.',0.75*v.ovr+8+rnd(S)*6-3);
  }
  function mysteryReveal(){
    var v=S.w[my.v],pt=partnerOf(S,v),c=null,betray=false;
    if(pt&&pt.promo===P.id&&pt.inj<=0&&chance(S,0.4)){c=pt;betray=true;}
    if(!c){var hs=rosterOf(S,P.id).filter(function(w){return w.id!==v.id&&w.g===v.g&&w.inj<=0&&!w.camp&&!w.nw&&!inFeud(S,w.id)&&(w.team==null||w.team!==v.team);});
      hs.sort(function(a,b){return (Math.abs(a.ovr-v.ovr)+(a.align==='H'?0:12))-(Math.abs(b.ovr-v.ovr)+(b.align==='H'?0:12));});c=hs[0];}
    S.mystery=null;if(!c)return null;
    if(betray){var tm=teamOf(S,v);P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(v.id)>=0){tt.holders=[];tt.since=S.week;news(S,'title','The '+P.name+' '+tt.name+' are vacated after the champions split.');}});if(tm)dissolveTeam(S,tm);award(S,'ACH_BETRAYAL');}
    if(c.align==='F')turn(S,c,'revealed as the mystery attacker');
    var f=startFeud(S,P,v,c,65,c.name+' was revealed as the one who attacked '+v.name,{force:true});if(f)f.twist='reveal';
    award(S,'ACH_MYSTERY');mark(v,c);
    return angle('Reveal','The attacker is revealed: '+c.name+'.'+(betray?' '+v.name+'’s own partner.':'')+' '+v.name+' wants revenge.',0.8*(v.ovr+c.ovr)/2+12);
  }
  function stareDown(){
    var GX=mainG(S,P),L=pool.filter(function(w){return !ang[w.id]&&!inFeud(S,w.id)&&w.g===GX;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,6);
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){
      var a=L[i],b=L[j],rk=S.recent[P.id+':'+rkey(a.id,b.id)];
      if(a.align!=='F'||b.align!=='F'||(a.team!=null&&a.team===b.team)||(rk&&S.week-rk<10))continue;
      if(!startFeud(S,P,a,b,30,a.name+' and '+b.name+' faced off',{kind:'dream'}))return null;mark(a,b);
      return angle('Face-off',a.name+' and '+b.name+' cross paths on the stage. Neither backs down, and the crowd wants the match.',0.8*(a.ovr+b.ovr)/2+8);
    }
    return null;
  }
  function comeback(){
    var c=pool.filter(function(w){return w.ret&&!ang[w.id];});if(!c.length)return null;
    var w=c[0],f=feudsFor(S,w.id)[0],r=null;w.ret=false;w.mom=clamp(w.mom+3,-10,10);mark(w);
    if(f){r=S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]];heatUp(S,f,10,w.name+' returned and went after '+r.name);}
    return angle('Return',w.name+' returns to a big reaction'+(r?' and goes straight after '+r.name+'.':'.'),0.9*w.ovr+8);
  }
  function teamUp(){
    var os=pool.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),lo=os[Math.floor(os.length*0.3)]||0,hi=os[Math.floor(os.length*0.8)]||100;
    var fa=pool.filter(function(w){return w.align==='F'&&w.team==null&&!ang[w.id]&&w.ovr>=lo&&w.ovr<=hi&&!inFeud(S,w.id);});
    if(fa.length<2)return null;var a=pick(S,fa);
    var bs=fa.filter(function(w){return w.id!==a.id&&w.g===a.g&&Math.abs(w.ovr-a.ovr)<=8&&(!a.brand||w.brand===a.brand);});if(!bs.length)return null;
    var hs=pool.filter(function(w){return w.align==='H'&&w.g===a.g&&!ang[w.id]&&Math.abs(w.ovr-a.ovr)<=14;});if(!hs.length)return null;
    var b=pick(S,bs),h=pick(S,hs);formTeam(S,P,a,b,8);mark(a,b,h);
    var f=startFeud(S,P,a,h,20,h.name+' attacked '+a.name+'; '+b.name+' made the save');if(f&&f.a.indexOf(a.id)>=0&&f.a.length<2)f.a.push(b.id);
    news(S,'story','New team: '+a.name+' & '+b.name+'.');
    return angle('Save',h.name+' attacks '+a.name+' after an interview. '+b.name+' runs out to make the save, and the two shake hands. A new team is born.',0.75*(a.ovr+b.ovr+h.ovr)/3+6);
  }
  function crowdTurn(){
    var c=pool.filter(function(w){return !ang[w.id]&&!inFeud(S,w.id)&&((w.align==='H'&&w.mom>=4&&w.mic>=65)||(w.align==='F'&&w.mom<=-4&&w.mic>=60));});if(!c.length)return null;
    var w=pick(S,c),was=w.align;mark(w);
    turn(S,w,was==='H'?'the crowd got behind them':'turned on the fans');
    if(was==='H')addOvr(P,w,2);else w.mom=clamp(w.mom+3,-10,10);
    return angle('Turn',was==='H'?'The crowd has been cheering '+w.name+' for weeks. Tonight '+w.name+' embraces it.':'After weeks of losses, '+w.name+' blames the fans and walks out to boos.',promoScore(S,w,6));
  }
  if(my&&my.left<=0){var r=mysteryReveal();if(r)return r;}
  if(pool.some(function(w){return w.ret&&!ang[w.id];}))opts.push([7,comeback]);
  if(my&&inP[my.v]&&!ang[my.v])opts.push([4,mysteryClue]);
  var nf=activeFeuds(S).length;
  if(nf<6){opts.push([nf<3?5:2,callOut]);opts.push([nf<3?4:2,champChallenge]);opts.push([0.8,stareDown]);}
  if(!S.mystery)opts.push([0.7,mysteryStart]);
  opts.push([0.8,teamUp]);opts.push([1,crowdTurn]);opts.push([1.5,interview]);
  ANGX.forEach(function(fn){var e=fn(S,P,show,ctx,{ok:ok,mark:mark,pool:pool,ang:ang});if(e)opts.push(e);});
  for(var tries=0;tries<5&&opts.length;tries++){
    var tot=0,i;for(i=0;i<opts.length;i++)tot+=opts[i][0];
    var x=rnd(S)*tot;for(i=0;i<opts.length;i++){x-=opts[i][0];if(x<=0)break;}
    i=Math.min(i,opts.length-1);
    var res=opts[i][1]();if(res)return res;opts.splice(i,1);
  }
  return interview();
}
