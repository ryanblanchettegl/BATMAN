/* ---------- your week: house rules, action points and the backstage map, wrestlers' court, mid-match chaos, clocks ---------- */
function bsInit(S){
  if(!S.house)S.house={on:[],wk:null};
  if(S.ap==null){S.ap=apMax(S);S.apUsed={};}
  if(!S.apLog)S.apLog=[];
  if(!S.court)S.court=[];
  if(!S.clocks){S.clocks={};Object.keys(CLOCKS).forEach(function(k){S.clocks[k]={v:0,why:''};});}
  if(!S.mainLog)S.mainLog=[];
}
NEWX.push(function(S){bsInit(S);});

/* --- house rules: pick a few, live with the trade-offs --- */
var HOUSE={
  clean:{n:'Clean finishes',d:'No screwjobs. Cheap wins, disqualifications and count-outs are rebooked as clean falls.',plus:'The crowd likes knowing every match has a finish.',minus:'Feuds heat up more slowly and nobody is protected in defeat.'},
  ranked:{n:'Rankings are law',d:'Title shots go to the top five contenders and nobody else.',plus:'A ranked challenger draws a louder crowd for a title match.',minus:'An unranked challenger is booed, and it costs you locker-room trust.'},
  def4:{n:'Thirty-day rule',d:'Every champion defends at least once every four weeks.',plus:'Titles feel important: title matches score higher.',minus:'A title left on the shelf sours the fans, week after week.'},
  open:{n:'Open door',d:'Anybody can walk through your door, and your people can talk to anybody.',plus:'Guests lift your crowd and rivals warm to you over time.',minus:'Rivals circle your roster: the raid clock runs faster.'},
  youth:{n:'Youth movement',d:'The future is now. Young wrestlers get the time and the trust.',plus:'Wrestlers of 26 and under improve faster.',minus:'Veterans of 35 and over are unhappy about it.',x:'senior'},
  senior:{n:'Respect your elders',d:'Seniority decides who speaks first and who goes on last.',plus:'Veterans of 33 and over are happier, and mentors teach faster.',minus:'Wrestlers of 25 and under feel held back.',x:'youth'},
  iron:{n:'Iron schedule',d:'House shows between every taping. The crew lives on the road.',plus:'Gate money rises by a tenth.',minus:'Bodies recover more slowly and stress creeps up.'},
  kayfabe:{n:'Kayfabe is sacred',d:'Heroes and villains never travel together. Nobody breaks character in public.',plus:'Feuds heat up faster.',minus:'Living the gimmick adds stress, and tempers flare into more disputes.'},
  curfew:{n:'Curfew and dress code',d:'In by midnight, collared shirt on the plane.',plus:'Stress falls faster and there are fewer disputes.',minus:'Your biggest egos resent it.'},
  testing:{n:'Fitness checks',d:'Everyone is checked by the medical staff before every show.',plus:'Injuries are a little rarer.',minus:'Wrestlers resent the queue and the paperwork.'},
  bonus:{n:'Win bonuses',d:'The winner’s purse is bigger than the loser’s.',plus:'Everybody works harder to win.',minus:'It costs a slice of every gate, and losing stings more.'}
};
function hasRule(S,k){return !!(S&&!S.cal&&S.house&&S.house.on.indexOf(k)>=0);}
function houseSlots(S){return 2+(S.booker&&S.booker.lvl>=4?1:0)+(S.owner&&S.owner.me?1:0);}
function houseHeat(S){return (hasRule(S,'clean')?0.8:1)*(hasRule(S,'kayfabe')?1.12:1);}
function ruleMorale(S,w){
  var d=0;if(!S.house||!S.house.on.length)return 0;
  if(hasRule(S,'youth')&&w.age>=35)d-=4;
  if(hasRule(S,'senior')){if(w.age>=33)d+=4;else if(w.age<=25)d-=3;}
  if(hasRule(S,'testing'))d-=1;
  if(hasRule(S,'curfew')){d-=1;if(w.role==='diva'||w.role==='toxic'||w.ex>=4)d-=4;}
  return d;
}
/* each company model has a view on the house rules: +1 approves, -1 frowns. The owner's trust follows once a month. */
var HOUSE_VIEW={corporate:{clean:1,curfew:1,testing:1,iron:-1,open:-1},workrate:{def4:1,ranked:1,bonus:1,kayfabe:-1},purist:{clean:1,ranked:1,testing:1,curfew:1,kayfabe:-1},
  underdog:{open:1,iron:1,bonus:-1},startup:{iron:1,open:1,curfew:-1},outlaw:{curfew:-1,clean:-1,kayfabe:1,testing:-1},spectacle:{kayfabe:1,open:1,youth:1,clean:-1},
  tradition:{senior:1,kayfabe:1,ranked:1,clean:1,youth:-1},joshi:{testing:1,youth:1,def4:1,iron:-1}};
function houseView(P,k){var v=HOUSE_VIEW[P.model||'classic'];return v&&v[k]||0;}
WEEKX.push(function(S){
  if(S.owner&&S.owner.me||cal(S.week).wom!==4||!S.house)return;var P=S.promos[S.player],d=0,likes=[],frowns=[];
  S.house.on.forEach(function(k){var v=houseView(P,k);d+=0.6*v;if(v>0)likes.push(HOUSE[k].n);else if(v<0)frowns.push(HOUSE[k].n);});
  if(d){S.owner.trust=clamp(S.owner.trust+d,0,100);news(S,'you',S.owner.name+(d>0?' approves of ':' is not happy about ')+(d>0?likes:frowns).join(' and ')+' under '+modelOf(P).ph+'.');}
});
E.HOUSE=HOUSE;
E.houseInfo=function(S){bsInit(S);var H=S.house,wait=Math.max(0,(H.wk==null?-99:H.wk)+4-S.week);
  return {slots:houseSlots(S),on:H.on.slice(),wait:wait,rules:Object.keys(HOUSE).map(function(k){var r=HOUSE[k];return {id:k,view:houseView(S.promos[S.player],k),n:r.n,d:r.d,plus:r.plus,minus:r.minus,on:H.on.indexOf(k)>=0,clash:r.x&&H.on.indexOf(r.x)>=0?HOUSE[r.x].n:null};})};};
E.setHouse=function(S,k){
  bsInit(S);var H=S.house,i=H.on.indexOf(k),r=HOUSE[k];if(!r)return null;
  if(i>=0){H.on.splice(i,1);H.wk=S.week;news(S,'you','You scrapped a house rule: '+r.n+'.');return {ok:true,msg:r.n+' is scrapped. The locker room needs four weeks to settle before a new rule can take its place.'};}
  if(H.on.length>=houseSlots(S))return {ok:false,msg:'Every slot is in use. Scrap a rule first.'};
  if(r.x&&H.on.indexOf(r.x)>=0)return {ok:false,msg:'That cannot stand alongside '+HOUSE[r.x].n+'.'};
  var wait=(H.wk==null?-99:H.wk)+4-S.week;if(wait>0)return {ok:false,msg:'You changed the rules recently. Wait '+wait+' more week'+(wait===1?'':'s')+'.'};
  H.on.push(k);news(S,'you','New house rule: '+r.n+'.');if(H.on.length>=houseSlots(S))award(S,'ACH_HOUSE');
  return {ok:true,msg:r.n+' is now the rule of the house.'};
};
CRX.push(function(ctx){
  if(!ctx.isPl)return null;var S=ctx.S,d=0,x=null;
  if(hasRule(S,'clean'))d+=0.8;
  if(ctx.t&&ctx.champSide>=0){
    if(hasRule(S,'def4')){d+=1.5;x='The thirty-day rule keeps this title busy';}
    if(hasRule(S,'ranked')&&!ctx.t.tag&&ctx.m.mt==='1v1'){
      var top=rankFor(S,ctx.P,ctx.t,5).map(function(w){return w.id;}),ch=flat(ctx.sides.filter(function(s,k){return k!==ctx.champSide;}));
      if(ch.every(function(w){return top.indexOf(w.id)>=0;})){d+=2.5;x='A ranked contender who earned the shot';}else{d-=5;x='The challenger has not earned this shot';S.trust=clamp(S.trust-1,0,100);}
    }
  }
  if(hasRule(S,'open')&&ctx.all.some(function(w){return w.promo!==ctx.P.id;})){d+=2;x=x||'The open door brings a guest through it';}
  return d?{d:d,x:x}:null;
});
EFX.push(function(ctx,w){var S=ctx.S,e=0;if(!ctx.isPl)return 0;if(hasRule(S,'bonus'))e+=2;if(S.pep&&S.pep===showKey(S))e+=2;return e;});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal)return;bsInit(S);
  if(hasRule(S,'iron')){var x=Math.round(rep.gate*0.1);P.led.gate+=x;rep.gate+=x;}
  if(hasRule(S,'bonus'))P.led.bonus-=Math.round(rep.gate*0.04);
  var ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1];
  if(main&&main.ids){S.mainLog.push({w:S.week,ids:main.ids.slice()});if(S.mainLog.length>8)S.mainLog.shift();}
  S.pep=null;
});

/* --- action points and the backstage map --- */
function apMax(S){return 3+(S.booker&&S.booker.lvl>=5?1:0)+(S.owner&&S.owner.me?1:0);}
var PLACES={
  office:{n:'The owner’s office',d:'Where the money and the booking power come from.'},
  court:{n:'Wrestlers’ court',d:'The locker room settles its own disputes. You wear the robe.'},
  trainer:{n:'The trainer’s room',d:'Ice, tape and bad news.'},
  gym:{n:'The gym',d:'A ring, some mats and whoever turned up early.'},
  catering:{n:'Catering',d:'Where everybody talks and nobody is on guard.'},
  lot:{n:'The parking lot',d:'No cameras, as far as anybody knows.'},
  truck:{n:'The production truck',d:'Forty screens and one director with a headset.'}
};
function ownerMod(S){var t=S.owner.trust;return {n:'Owner trust '+Math.round(t),v:t>=75?2:(t>=55?1:(t<35?-1:0))};}
function activeRoster(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.inj<=0&&!w.camp&&!(w.away>=S.week);});}
function apActs(S,pl){
  var P=S.promos[S.player],own=S.owner.me,L=[];
  if(pl==='office'){
    if(own){L.push({id:'network',n:'Call the network',d:'Talk up this week’s show. A bigger audience for your next card.',ck:mkCheck(7,skillMods(S,'talk'))});
      L.push({id:'sponsors',n:'Work the phones',d:'A fresh set of sponsor offers lands on your desk.'});}
    else{L.push({id:'bp',n:'Ask for more booking power',d:'Three extra points this week if the owner says yes. A little trust lost if not.',ck:mkCheck(8,[ownerMod(S)].concat(skillMods(S,'talk')))});
      L.push({id:'budget',n:'Ask for a bigger wage budget',d:'Five per cent more to spend on contracts, for good.',ck:mkCheck(9,[ownerMod(S),{n:'The company is making money',v:S.fin&&S.fin.net>0?1:0}].concat(skillMods(S,'talk')))});}
  }else if(pl==='court'){
    S.court.forEach(function(c){L.push({id:'case',n:'Hear the case: '+S.w[c.a].name+' against '+S.w[c.b].name,d:c.text,cid:c.id});});
    if(!L.length)L.push({id:'none',n:'No cases on the docket',d:'Nobody has brought a dispute this week.',off:true});
  }else if(pl==='trainer'){
    L.push({id:'treat',n:'Stand over the trainer while they work',d:'One wrestler: eight points off every worn body zone, and a week off an injury of two weeks or more.',need:'w'});
  }else if(pl==='gym'){
    L.push({id:'drill',n:'Put two wrestlers through drills',d:'Their ring chemistry improves. A regular team also gains experience.',need:'pair'});
    L.push({id:'class',n:'Run the class yourself',d:'Up to six wrestlers of 25 and under learn a little faster this week.'});
  }else if(pl==='catering'){
    L.push({id:'rounds',n:'Do the rounds',d:'Sit down with the three most stressed people on the roster.',ck:mkCheck(7,[trustMod(S)].concat(skillMods(S,'talk')))});
    L.push({id:'pep',n:'Give the pep talk',d:'Everybody works a little harder on your next show.'});
  }else if(pl==='lot'){
    L.push({id:'attack',n:'Stage a sneak attack',d:'The first wrestler jumps the second. Starts a rivalry, or pours fuel on one they already have.',need:'pair',same:true,ck:mkCheck(7,skillMods(S,'creative'))});
  }else if(pl==='truck'){
    L.push({id:'meet',n:'Sit in on the production meeting',d:'Your next show looks sharper. Better still if your ideas land.',ck:mkCheck(7,skillMods(S,'creative'))});
    L.push({id:'tease',n:'Shoot a teaser vignette',d:'For a newcomer who has not appeared yet. Each teaser builds hype for the debut, up to three. A hyped debut starts hot, but a weak one that was over-hyped costs you.',need:'w'});
    L.push({id:'hype',n:'Cut a hype package',d:'A video for the top of the show. More people in the building next time.'});
  }
  return L;
}
E.PLACES=PLACES;
E.backstage=function(S){bsInit(S);return {log:S.apLog,ap:S.ap,max:apMax(S),places:Object.keys(PLACES).map(function(k){return {id:k,n:PLACES[k].n,d:PLACES[k].d,used:!!S.apUsed[k],acts:apActs(S,k),badge:k==='court'?S.court.length:0};})};};
E.apDo=function(S,pl,act,o){
  bsInit(S);o=o||{};var P=S.promos[S.player],L=apActs(S,pl),A=L.filter(function(x){return x.id===act&&(act!=='case'||x.cid===+o.cid);})[0];
  if(!A||A.off)return {ok:false,msg:'Nothing to do there.'};
  if(S.ap<=0)return {ok:false,msg:'You are out of action points this week.'};
  if(S.apUsed[pl])return {ok:false,msg:'You have already spent time there this week.'};
  var a=o.a!=null&&o.a!==''?S.w[+o.a]:null,b=o.b!=null&&o.b!==''?S.w[+o.b]:null,r=null,msg='',ok=true,fair=null,mine=function(w){return w&&w.promo===P.id&&!w.nw;};
  if(A.need==='pair'){if(!mine(a)||!mine(b)||a.id===b.id)return {ok:false,msg:'Pick two different wrestlers first.'};if(A.same&&a.g!==b.g)return {ok:false,msg:'Pick two wrestlers from the same division.'};
    if(a.inj>0||b.inj>0||a.camp||b.camp)return {ok:false,msg:'Both of them need to be fit and in the building.'};}
  if(A.need==='w'&&!mine(a))return {ok:false,msg:'Pick a wrestler first.'};
  if(A.ck){r=rollCheck(S,A.ck);ok=r.ok;}
  if(act==='bp'){if(ok){S.bp+=3;msg=S.owner.name+' nods. Three more points of booking power this week.';}else{S.owner.trust=clamp(S.owner.trust-2,0,100);msg=S.owner.name+' says you have enough rope already.';}}
  else if(act==='budget'){if(ok){S.owner.wage0=Math.round(S.owner.wage0*1.05);msg=S.owner.name+' signs off on a bigger wage budget: '+money(E.budget(S))+' a week.';}else{S.owner.trust=clamp(S.owner.trust-2,0,100);msg=S.owner.name+' wants to see the books improve first.';}}
  else if(act==='network'){S.hype=(S.hype||0)+(ok?0.07:0.02);msg=ok?'The network gives your next show a push in the listings.':'They take the call. That is about all they do.';}
  else if(act==='sponsors'){refreshOffers(S);msg='Three new sponsor offers are on the Manage screen, under Deals.';}
  else if(act==='case'){var res=E.courtRule(S,+o.cid,+o.v);if(!res.ok)return res;msg=res.msg;fair=res.fair;ok=res.fair!==false;}
  else if(act==='treat'){var z=zonesOf(a),eased=0;['n','s','b','k'].forEach(function(k){var f=zoneFloor(a,k),nv=Math.max(f,z[k]-8);eased+=z[k]-nv;z[k]=nv;});if(a.inj>=2)a.inj--;stressAdd(S,a,-4);
    msg=a.name+' gets the full treatment'+(a.inj>0?' and should be back a week sooner.':(eased>=4?' and walks out moving more freely.':'. There was not much to fix.'));}
  else if(act==='drill'){var k=rkey(a.id,b.id),c=chem(S,a.id,b.id);(S.chemX||(S.chemX={}))[k]=clamp(c+1.2,-6,6);var tm=a.team!=null&&a.team===b.team?teamOf(S,a):null;if(tm)tm.exp=Math.min(100,tm.exp+6);
    a.cond=clamp(a.cond-5,5,100);b.cond=clamp(b.cond-5,5,100);msg=a.name+' and '+b.name+' work through it until it clicks. Their chemistry is better for it'+(tm?', and so is their teamwork.':'.');}
  else if(act==='class'){var ys=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.age<=25&&w.inj<=0&&workRate(w)<w.pot;}).sort(function(x,y){return y.pot-x.pot;}).slice(0,6);ys.forEach(function(w){w.xp+=0.22;});
    msg=ys.length?'You run the class. '+names(ys.slice(0,3))+(ys.length>3?' and '+(ys.length-3)+' more':'')+' get a little better.':'Nobody young enough to teach turned up.';}
  else if(act==='rounds'){var st=rosterOf(S,P.id).filter(function(w){return !w.nw;}).sort(function(x,y){return (y.stress||0)-(x.stress||0);}).slice(0,3);
    st.forEach(function(w){stressAdd(S,w,ok?-12:-4);});if(ok)S.trust=clamp(S.trust+1,0,100);msg=ok?'You listen more than you talk. '+names(st)+' leave the table lighter.':'They are polite about it. Nobody says what is really on their mind.';}
  else if(act==='pep'){S.pep=showKey(S)||('next');if(!S.queue[S.qi])S.pep=null;msg=S.pep?'You have the room. Expect more effort on '+S.queue[S.qi].name+'.':'There is no show left this week to fire them up for.';if(!S.pep)return {ok:false,msg:msg};}
  else if(act==='tease'){if(!a.deb||a.hy>=3)return {ok:false,msg:a.deb?a.name+' already has all the hype a debut can carry.':a.name+' has already appeared on the shows. Pick a newcomer.'};
    a.hy=(a.hy||0)+1;msg='A dark, grainy teaser for '+a.name+' airs on the next show. Hype for the debut: '+a.hy+' of 3.'+(a.hy>=3?' Any more would be too much.':'');}
  else if(act==='attack'){
    var f=feudOf(S,a.id,b.id);
    if(f){heatUp(S,f,ok?12:5,a.name+' jumped '+b.name+' in the parking lot');msg=ok?'It makes the news. The rivalry is hotter for it.':'The camera missed most of it, but word gets round.';}
    else{f=startFeud(S,P,a,b,ok?22:14,a.name+' jumped '+b.name+' in the parking lot');if(!f)return {ok:false,msg:'There are too many rivalries running to start another.'};msg=ok?a.name+' leaves '+b.name+' on the tarmac. A new rivalry, and people are talking.':a.name+' jumps '+b.name+'. It looked clumsy, but the rivalry is on.';}
    if(!ok){var zz=zonesOf(b),hz=hurtZone(S,b);zz[hz]=Math.min(100,zz[hz]+6);stressAdd(S,b,5);}
    if(a.align==='H')addOvr(P,a,0.4);b.mom=clamp(b.mom+(b.align==='F'?1:0),-10,10);
  }
  else if(act==='meet'){S.rateMod=(S.rateMod||0)+(ok?1.5:0.5);msg=ok?'Your notes make it to air. The next show will look a point or two better.':'They nod, and change one camera angle.';}
  else if(act==='hype'){S.hype=(S.hype||0)+0.05;msg='The package is in the can. Expect a bigger house.';}
  S.ap--;S.apUsed[pl]=1;gainXp(S,4);
  // keep a note of what was done and how it went, so the desk can show the week so far
  var out=(r?rollText(r):'')+msg;S.apLog.push({pl:pl,place:PLACES[pl].n,act:A.n,ok:ok,msg:out,who:[a,b].filter(Boolean).map(function(w){return w.name;})});
  return {ok:ok,done:true,fair:fair,roll:r,msg:out};
};

/* --- wrestlers' court --- */
var CASES=[
  ['stiff','{a} says {b} worked stiff on purpose and wants it dealt with.'],
  ['spot','{a} says {b} went to the office behind their back to take their spot on the card.'],
  ['rib','{a} found their gear bag full of shaving foam and blames {b}.'],
  ['late','{a} wants {b} fined for turning up late and skipping the handshakes.'],
  ['phrase','{a} says {b} lifted their catchphrase.'],
  ['ride','{a} says {b} left them at a gas station on the drive between towns.']
];
function mkCase(S){
  var R=activeRoster(S);if(R.length<6)return null;
  var a=pick(S,R),bad=R.filter(function(w){return w.id!==a.id&&relOf(S,a.id,w.id)<0;}),b=bad.length&&chance(S,0.6)?pick(S,bad):pick(S,R.filter(function(w){return w.id!==a.id;}));
  if(S.court.some(function(c){return c.a===a.id||c.b===a.id||c.a===b.id||c.b===b.id;}))return null;
  var k=pick(S,CASES),right=chance(S,b.role==='toxic'?0.8:(a.role==='toxic'||a.role==='diva'?0.3:0.55))?'a':'b';
  var wit=R.filter(function(w){return w.id!==a.id&&w.id!==b.id;}).sort(function(x,y){return ({leader:3,gate:2,mentor:2,toxic:2}[y.role]||0)+h01(S.seed+'w'+y.id+S.week)-({leader:3,gate:2,mentor:2,toxic:2}[x.role]||0)-h01(S.seed+'w'+x.id+S.week);}).slice(0,3);
  var ev=wit.map(function(w){var rel=w.role==='leader'?0.88:(w.role==='gate'||w.role==='mentor'?0.78:(w.role==='toxic'?0.25:0.66)),says=chance(S,rel)?right:(right==='a'?'b':'a');return {w:w.id,side:says};});
  return {id:S.nid++,a:a.id,b:b.id,k:k[0],wk:S.week,right:right,ev:ev,text:fill(k[1],{a:a.name,b:b.name})};
}
E.court=function(S){bsInit(S);return S.court.map(function(c){return {id:c.id,a:c.a,b:c.b,text:c.text,age:S.week-c.wk,left:Math.max(0,3-(S.week-c.wk)),ev:c.ev.map(function(e){var w=S.w[e.w];return {w:e.w,name:w.name,role:w.role?ROLE[w.role].n:null,backs:S.w[c[e.side]].name};}),ring:S.w[c.a].g===S.w[c.b].g,leader:rosterOf(S,S.player).some(function(w){return !w.nw&&w.inj<=0&&w.id!==c.a&&w.id!==c.b&&(w.role==='leader'||(w.age>=35&&w.morale>=50));})};});};
E.courtLog=function(S){return (S.verdicts||[]).slice(0,6).map(function(v){return {w:v.w,win:v.win,lose:v.lose,fair:v.fair,judge:v.judge,rep:v.rep,n:v.n};});};
function courtApply(S,c,side,byYou){
  var win=S.w[c[side]],lose=S.w[c[side==='a'?'b':'a']],fair=side===c.right;
  win.morale=clamp(win.morale+5,0,100);stressAdd(S,win,-8);lose.morale=clamp(lose.morale-5,0,100);stressAdd(S,lose,8);
  // the court remembers: a wrestler found against again and again is dealt with harder, and every verdict is kept
  lose.cl=(lose.cl||0)+1;var rep=lose.cl>=2;if(rep){lose.morale=clamp(lose.morale-Math.min(9,3*(lose.cl-1)),0,100);stressAdd(S,lose,Math.min(10,4*(lose.cl-1)));}
  (S.verdicts||(S.verdicts=[])).unshift({w:S.week,win:win.id,lose:lose.id,fair:fair,judge:byYou?null:(S.lastJudge||null),rep:rep,n:lose.cl});if(S.verdicts.length>20)S.verdicts.length=20;S.lastJudge=null;
  if(byYou){win.you=clamp((win.you||0)+1,-1,1);
    if(fair){S.trust=clamp(S.trust+2,0,100);S.courtFair=(S.courtFair||0)+1;if(S.courtFair>=5)award(S,'ACH_COURT');}
    else{S.trust=clamp(S.trust-3,0,100);stressAdd(S,lose,8);lose.you=clamp((lose.you||0)-1,-1,1);S.rel[rkey(win.id,lose.id)]=-1;}}
  return fair;
}
E.courtRule=function(S,cid,v){
  var c=S.court.filter(function(x){return x.id===cid;})[0];if(!c)return {ok:false,msg:'That case is closed.'};
  var a=S.w[c.a],b=S.w[c.b],P=S.promos[S.player],msg,fair=null;
  if(v===0||v===1){var side=v===0?'a':'b';fair=courtApply(S,c,side,true);msg='You find for '+S.w[c[side]].name+'. '+(fair?'The room agrees: that was the right call.':'The room goes quiet. Most of them think you got it wrong.');}
  else if(v===2){if(a.g!==b.g)return {ok:false,msg:'They are in different divisions. It cannot be settled in the ring.'};
    var f=startFeud(S,P,a,b,22,'Settled in the ring by order of wrestlers’ court');if(!f)return {ok:false,msg:'There are too many rivalries running to add another.'};
    stressAdd(S,a,-5);stressAdd(S,b,-5);S.trust=clamp(S.trust+1,0,100);msg='Settle it in the ring. '+a.name+' and '+b.name+' have a match to build to, and the room likes the ruling.';}
  else{a.morale=clamp(a.morale-2,0,100);b.morale=clamp(b.morale-2,0,100);S.trust=clamp(S.trust-1,0,100);msg='Case dismissed. Neither of them is happy, and it is over.';}
  S.court=S.court.filter(function(x){return x!==c;});news(S,'story','Wrestlers’ court: '+a.name+' against '+b.name+'. '+(v===2?'To be settled in the ring.':(v===3?'Dismissed.':'Decided for '+S.w[c[v===0?'a':'b']].name+'.')));
  return {ok:true,fair:fair,msg:msg};
};
E.courtDelegate=function(S,cid){
  var c=S.court.filter(function(x){return x.id===cid;})[0];if(!c)return {ok:false,msg:'That case is closed.'};
  var inCase=function(w){return w.id===c.a||w.id===c.b;},R0=rosterOf(S,S.player).filter(function(w){return !w.nw&&w.inj<=0&&!inCase(w);});
  // the judge is a leader if there is one, otherwise the most senior veteran in good spirits
  var ld=R0.filter(function(w){return w.role==='leader';})[0]||R0.filter(function(w){return w.age>=35&&w.morale>=50;}).sort(function(x,y){return y.age-x.age;})[0];
  if(!ld)return {ok:false,msg:'You have no leader or veteran to hand it to.'};
  S.lastJudge=ld.id;var side=chance(S,0.75)?c.right:(c.right==='a'?'b':'a');courtApply(S,c,side,false);S.court=S.court.filter(function(x){return x!==c;});
  news(S,'story','Wrestlers’ court: '+ld.name+' heard '+S.w[c.a].name+' against '+S.w[c.b].name+' and found for '+S.w[c[side]].name+'.');
  return {ok:true,msg:ld.name+' hears the case and finds for '+S.w[c[side]].name+'. It costs you nothing and earns you nothing.'};
};

/* --- mid-match chaos: something goes wrong on the air and the headset wants an answer --- */
E.chaos=function(S,card){
  var key=showKey(S);if(!key||S.over)return null;
  if(S.chs&&S.chs.key===key)return S.chs.done?null:S.chs;
  S.chs={key:key,done:true};
  var P=S.promos[S.player],show=S.queue[S.qi],n=card.length;if(n<3)return null;
  if(!chance(S,0.13+(show.big?0.09:0)+(P.risk>=2?0.05:0)))return null;
  var mi=ri(S,0,n-1),m=card[mi],ids=flat(m.sides),ws=ids.map(function(id){return S.w[id];}),oc=onCard(card),ch=null;
  var kind=pick(S,['lights','power','shoot','riot','ko']),label='Match '+(mi+1)+(mi===n-1?', the main event':'')+': ';
  if(kind==='lights'){
    var free=eligible(S,P,show).filter(function(w){return oc[w.id]==null&&w.promo===P.id;}).sort(function(x,y){return y.ovr-x.ovr;}),x=free.filter(function(w){return w.align==='H';})[0]||free[0];
    if(x)ch={type:'lights',x:x.id,text:label+'the lights go out. The whole building is dark and the crowd is roaring.',choices:['Put '+x.name+' in the ring when they come back on','Restart the match when the lights return','Call it a no contest']};
  }else if(kind==='shoot'&&(m.mt==='1v1'||m.mt==='tag')){
    var a=m.sides[0][0],b=m.sides[1][0];
    ch={type:'shoot',w:a,o:b,text:label+S.w[a].name+' and '+S.w[b].name+' have stopped working. Those are real punches.',choices:['Send the locker room out to break it up','Let them fight','Tell the referee to go home early']};
  }else if(kind==='riot'){
    var hs=ws.filter(function(w){return w.align==='H';}).sort(function(x,y){return y.ovr-x.ovr;}),fs=ws.filter(function(w){return w.align==='F';}).sort(function(x,y){return y.cha-x.cha;});
    if(hs.length&&fs.length)ch={type:'riot',w:fs[0].id,o:hs[0].id,text:label+'the crowd is throwing things and somebody is over the barrier. Security is outnumbered.',choices:['Send '+fs[0].name+' out to calm them down','Cut to commercial and let security handle it','Hand '+hs[0].name+' the microphone'],
      checks:{0:mkCheck(7,[{n:fs[0].name+'’s charisma '+fs[0].cha,v:fs[0].cha>=85?2:(fs[0].cha>=70?1:(fs[0].cha<50?-1:0))}])}};
  }else if(kind==='ko'){
    var w=pick(S,ws),opp=ws.filter(function(q){return q.id!==w.id;}).sort(function(x,y){return workRate(y)-workRate(x);})[0];
    ch={type:'ko',w:w.id,o:opp.id,text:label+w.name+' took a bad landing and is not responding. The referee is throwing up the X.',choices:['Stop the match','Go straight to the finish','Have '+opp.name+' carry it and hide the damage'],
      checks:{2:mkCheck(8,[{n:opp.name+'’s work rate '+workRate(opp),v:workRate(opp)>=85?2:(workRate(opp)>=72?1:(workRate(opp)<55?-1:0))}])}};
  }
  if(!ch){var tk=rosterOf(S,P.id).filter(function(q){return q.inj<=0&&!q.camp;}).sort(function(x,y){return y.mic-x.mic;})[0],cost=Math.round(P.prod*0.4/1000)*1000;
    ch={type:'power',w:tk.id,cost:cost,text:label+'the truck has lost power. You are off the air and the building does not know it yet.',choices:['Send '+tk.name+' out to fill time until you are back','Carry on for the live crowd','Pay '+money(cost)+' for the emergency generator'],
      checks:{0:mkCheck(7,[{n:tk.name+'’s promo skill '+tk.mic,v:tk.mic>=85?2:(tk.mic>=70?1:(tk.mic<50?-1:0))}])}};}
  ch.key=key;ch.mi=mi;ch.done=false;ch.result=null;ch.roll=null;S.chs=ch;return ch;
};
E.resolveChaos=function(S,card,c){
  var ch=S.chs;if(!ch||ch.done)return null;
  var P=S.promos[S.player],m=card[ch.mi],w=ch.w!=null?S.w[ch.w]:null,o=ch.o!=null?S.w[ch.o]:null,X={k:ch.type,c:c,cr:0,mq:0,x:null,note:''},res='',r=null;
  if(ch.checks&&ch.checks[c]){r=rollCheck(S,ch.checks[c]);ch.roll=r;}
  if(!m){ch.done=true;return '';}
  if(ch.type==='lights'){
    var x=S.w[ch.x];
    if(c===0){X.cr=5;X.x='The lights came back on and the building came unglued';var tg=flat(m.sides).map(function(id){return S.w[id];}).filter(function(q){return q.g===x.g&&q.align!==x.align;}).sort(function(p,q){return q.ovr-p.ovr;})[0];
      if(tg){startFeud(S,P,x,tg,24,x.name+' appeared when the lights came back on');X.note='When the lights came back, '+x.name+' was standing over '+tg.name+'.';}else X.note='When the lights came back, '+x.name+' was standing in the ring.';
      x.la=S.week;res=x.name+' is in position. This will get a reaction.';}
    else if(c===1){X.cr=-2;X.mq=-1;X.x='A blackout broke the rhythm of the match';X.note='The match restarted after a blackout.';res='The referee restarts it once the lights are back. The match loses its rhythm.';}
    else{m.nc=true;X.cr=-4;X.x='Thrown out after the blackout';X.fin='The referee waves it off after the blackout. No contest.';X.note='Ruled a no contest after the lights went out.';res='You throw it out. Nobody got hurt in the dark, and nobody got a finish.';}
  }else if(ch.type==='power'){
    if(c===0){if(r.ok){S.rateMod=(S.rateMod||0)+1;addOvr(P,w,0.5);w.la=S.week;res=w.name+' holds the building in the palm of one hand until the picture returns.';X.note=w.name+' filled time during a power failure and stole the show.';}
      else{S.rateMod=(S.rateMod||0)-2;res=w.name+' runs out of things to say after a minute. It feels like ten.';X.note='Dead air during a power failure.';}}
    else if(c===1){S.rateMod=(S.rateMod||0)-1.5;X.cr=1;res='The building sees a match the cameras miss.';X.note='This match did not make it to air.';}
    else{P.cash-=ch.cost;res='The generator kicks in after ninety seconds. That cost '+money(ch.cost)+'.';X.note='A short power failure, fixed fast.';}
  }else if(ch.type==='shoot'){
    S.rel[rkey(w.id,o.id)]=-1;
    if(c===0){m.nc=true;X.cr=1;X.x='It turned into a real fight and the locker room emptied';X.fin='The locker room pours out to pull them apart. No contest.';stressAdd(S,w,10);stressAdd(S,o,10);
      if(w.g===o.g)startFeud(S,P,w,o,30,'It got real between them');X.note='The match broke down into a real fight.';res='Twenty wrestlers pull them apart. There is no finish, but nobody will forget it.';}
    else if(c===1){X.cr=7;X.mq=-3;X.x='A real fight, and the crowd could tell';m.hurt=w.dur<=o.dur?w.id:o.id;[w,o].forEach(function(q){var z=zonesOf(q),hz=hurtZone(S,q);z[hz]=Math.min(100,z[hz]+8);stressAdd(S,q,6);});
      S.trust=clamp(S.trust-3,0,100);if(w.g===o.g)startFeud(S,P,w,o,35,'It got real between them');X.note='They stopped co-operating. It was ugly and the crowd loved it.';res='You let it go. The crowd loves it. The locker room notices that you did nothing.';}
    else{m.len='S';if(m.stip==='iron')m.stip='std';X.cr=-2;X.mq=-3;X.x='Rushed to the finish';stressAdd(S,w,5);stressAdd(S,o,5);X.note='The referee hurried them to the finish.';res='The referee gets them to the finish early. It looks rushed because it was.';}
  }else if(ch.type==='riot'){
    if(c===0){if(r.ok){X.cr=3;X.x=w.name+' settled the crowd';addOvr(P,w,0.8);res=w.name+' gets them back in their seats, and gets a bigger cheer for it.';X.note=w.name+' talked down an angry crowd.';}
      else{X.cr=-4;X.x='The crowd turned ugly';var fine=Math.round(P.prod*0.3/1000)*1000;P.cash-=fine;res='They do not listen. The building fines you '+money(fine)+' for the damage.';X.note='Crowd trouble stopped the show for several minutes.';}}
    else if(c===1){S.rateMod=(S.rateMod||0)-1;res='Security clears it up during the break. The show loses its momentum.';X.note='Crowd trouble during the match.';}
    else{X.cr=4;X.x=o.name+' poured petrol on it';addOvr(P,o,1.2);o.la=S.week;if(S.net)S.net.mood=clamp(S.net.mood+3,0,100);X.note=o.name+' took the microphone and made it worse, on purpose.';res=o.name+' makes it much worse and loves every second.';
      if(S.sponsors.length&&chance(S,0.35)){var sp=pick(S,S.sponsors);P.led.bonus-=sp.pay;res+=' '+sp.name+' are not amused and withhold this week’s payment.';news(S,'money',sp.name+' withheld a payment after crowd trouble at '+S.queue[S.qi].name+'.');}}
  }else if(ch.type==='ko'){
    if(c===0){m.nc=true;X.ko=w.id;X.cr=-3;X.x='Stopped for a real injury';X.fin='The referee stops the match. '+w.name+' is helped to the back.';S.trust=clamp(S.trust+3,0,100);X.note='Stopped by the referee: '+w.name+' was hurt for real.';res='You stop it. '+w.name+' walks to the back with help. The locker room will remember that you made the safe call.';}
    else if(c===1){m.len='S';if(m.stip==='iron')m.stip='std';m.hurt=w.id;X.mq=-4;X.x='They went home early with somebody hurt';S.trust=clamp(S.trust-1,0,100);X.note=w.name+' was hurt and they went straight to the finish.';res='They go to the finish. '+w.name+' is on autopilot.';}
    else{if(r.ok){X.mq=-1;X.note=o.name+' carried an injured '+w.name+' through it.';res=o.name+' walks '+w.name+' through the rest of it. Nobody in the building knew.';o.morale=clamp(o.morale+2,0,100);}
      else{X.mq=-6;X.x='It fell apart with somebody hurt';m.hurt=w.id;S.trust=clamp(S.trust-2,0,100);X.note='The match fell apart after '+w.name+' was hurt.';res='It falls apart in front of everybody, and '+w.name+' takes more punishment.';}}
  }
  m.chaos=X;ch.done=true;ch.result=(r?rollText(r):'')+res;gainXp(S,3);return ch.result;
};
CRX.push(function(ctx){var c=ctx.m.chaos;return c&&c.cr?{d:c.cr,x:c.x}:null;});
MQX.push(function(ctx){var c=ctx.m.chaos;return c&&c.mq?{d:c.mq,x:c.cr?null:c.x}:null;});
POST.push(function(ctx){
  var S=ctx.S,m=ctx.m,r=ctx.res,c=m.chaos;if(S.cal)return;
  if(ctx.isPl){
    r.winners.forEach(function(w){w.wonWk=S.week;});
    if(hasRule(S,'bonus'))r.losers.forEach(function(w){w.morale=clamp(w.morale-0.6,0,100);});
    if(hasRule(S,'youth'))ctx.all.forEach(function(w){if(w.age<=26&&workRate(w)<w.pot)w.xp+=0.035;});
    if(ctx.isMain)S.quests.slice().forEach(function(q){if(q.type==='netvow'&&r.OV>=q.target){dropQuest(S,q);ctx.P.led.bonus+=q.bonus;S.clocks.net.v=0;news(S,'money','You kept your promise to the network: a '+r.OV+'% main event. They send a bonus of '+money(q.bonus)+'.');r.seg.notes.push('The network got the main event you promised.');}});
  }
  if(!c)return;
  if(c.fin)r.seg.finish=c.fin;
  if(c.ko&&S.w[c.ko]){var w=S.w[c.ko];if(w.inj<=0){w.inj=1;w.iz=w.iz||'n';news(S,'injury',w.name+' ('+ctx.P.name+') was hurt at '+ctx.show.name+' and will miss a week.');}}
  if(c.note){r.seg.notes.unshift(c.note);if(r.seg.bc)r.seg.bc.splice(Math.min(2,r.seg.bc.length),0,{t:'note',x:c.note});}
  if(ctx.isPl&&r.OV>=80)award(S,'ACH_CHAOS');
});

/* --- clocks: slow pressure you can watch build --- */
var CLOCKS={
  mutiny:{n:'Mutiny',segs:6,bad:true,d:'Fills while the locker room is unhappy or under strain. When it is full they call a meeting without you.'},
  raid:{n:'Talent raid',segs:6,bad:true,d:'Fills while a rival has reason to go after your stars: short contracts or low morale near the top of your card.'},
  stale:{n:'Stale act',segs:8,bad:true,d:'Fills when the same faces close every show or a title reign drags. A title change or a big turn winds it back.'},
  net:{n:'Network patience',segs:6,bad:true,d:'Fills when a weekly show comes in under expectations. When it is full the network wants a meeting.'},
  hot:{n:'Hot streak',segs:4,bad:false,d:'Fills each week every show beats expectations. Full, it pays out booking power and goodwill.'},
  star:{n:'Breakout',segs:6,bad:false,d:'Follows one young wrestler. Fills each week they win. Full, they arrive as a star.'}
};
function starPick(S){
  var P=S.promos[S.player],c=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.age<=27&&w.inj<=4&&!w.camp&&(w.ex==null||w.ex<=3)&&w.ovr<P.image+2;}).sort(function(a,b){return (b.pot-workRate(b)+b.cha*0.3+b.sq*0.3)-(a.pot-workRate(a)+a.cha*0.3+a.sq*0.3);});
  return c.length?c[0].id:null;
}
E.CLOCKS=CLOCKS;
E.clocks=function(S){bsInit(S);return Object.keys(CLOCKS).map(function(k){var c=S.clocks[k],d=CLOCKS[k];return {id:k,n:d.n+(k==='star'&&c.w!=null&&S.w[c.w]?': '+S.w[c.w].name:''),v:Math.max(0,Math.min(d.segs,Math.round(c.v))),segs:d.segs,bad:d.bad,d:d.d,why:c.why||'',w:k==='star'?c.w:null};});};
function tickClocks(S){
  var P=S.promos[S.player],C=S.clocks,R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),n=Math.max(1,R.length),bump=function(k,d,why){C[k].v=clamp(C[k].v+d,0,CLOCKS[k].segs);C[k].why=why;};
  // mutiny
  var un=R.filter(function(w){return w.morale<45;}).length/n,strained=R.filter(function(w){return (w.stress||0)>=75;}).length;
  if(un>=0.12||strained>=2||(roomMood(S,P)<0&&un>=0.06))bump('mutiny',1,strained>=2?strained+' wrestlers are close to breaking':Math.round(un*100)+'% of the roster is unhappy');
  else if(un<0.05&&S.trust>=55)bump('mutiny',-1,'The room is settled');else C.mutiny.why='Holding';
  if(C.mutiny.v>=CLOCKS.mutiny.segs){C.mutiny.v=2;var own=S.owner.me;
    pushEv(S,{type:'mutiny',text:'The locker room has held a meeting without you. They want answers about pay, pushes and promises.',choices:['Face the room',own?'Give everybody a five per cent rise':'Send '+S.owner.name+' in to talk to them','Ignore it'],
      checks:{0:mkCheck(8,[trustMod(S),{n:'A leader in the locker room',v:roomMood(S,P)>0?1:0}].concat(skillMods(S,'talk')))}});news(S,'story','The '+P.name+' locker room held a meeting without the booker.');}
  // raid
  var top=R.slice().sort(function(a,b){return b.ovr-a.ovr;}).slice(0,8).filter(function(w){return (w.con<=16||w.morale<50)&&!hasQuest(S,w.id)&&w.inj<=0;});
  var rv=S.order.filter(function(id){return id!==P.id&&S.promos[id].image>=P.image-15;}).sort(function(a,b){return S.promos[b].image-S.promos[a].image;});
  if(top.length&&rv.length)bump('raid',(S.dpart&&S.dpart.rival===0&&S.week%2?0:1)+(S.dpart&&S.dpart.rival===2?1:0)+(hasRule(S,'open')&&S.week%2===0?1:0),top[0].name+(top[0].con<=16?' is nearly out of contract':' is unhappy')+', and rivals know it');
  else bump('raid',-1,'Your stars are tied down and content');
  if(C.raid.v>=CLOCKS.raid.segs&&top.length&&rv.length){C.raid.v=1;var tw=top[0],RV=S.promos[rv[0]],raise=Math.round(tw.wage*1.3/50)*50;tw.off=S.week+10;
    pushEv(S,{type:'offer',w:tw.id,rival:rv[0],raise:raise,text:RV.name+' have been circling for weeks. Now they have made '+tw.name+' an offer.',choices:['Match it: '+money(raise)+' a week, new 48-week deal','Appeal to loyalty','Let them go']});}
  // stale
  var last=S.mainLog.slice(-4),cnt={},worst=0,who=null;last.forEach(function(e){e.ids.forEach(function(id){cnt[id]=(cnt[id]||0)+1;if(cnt[id]>worst){worst=cnt[id];who=id;}});});
  var topT=P.titles.filter(function(t){return t.lvl>=3&&t.holders.length;})[0],changed=P.titles.some(function(t){return t.lvl>=3&&t.since===S.week&&t.holders.length;}),turned=R.some(function(w){return w.tw===S.week&&w.ovr>=P.image-12;});
  if(changed)bump('stale',-3,'A new champion freshens everything up');
  else if(turned)bump('stale',-2,'A big turn has people talking');
  else if(last.length>=4&&worst>=4)bump('stale',1,S.w[who].name+' has closed four shows in a row');
  else if(topT&&S.week-topT.since>30&&S.week%2===0)bump('stale',1,'The '+topT.name+' has not changed hands in '+(S.week-topT.since)+' weeks');
  else if(S.week%3===0)bump('stale',-1,'Enough variety at the top of the card');else C.stale.why=C.stale.why||'Holding';
  if(C.stale.v>=CLOCKS.stale.segs){C.stale.v=4;S.staleUntil=S.week+4;if(S.net)S.net.mood=clamp(S.net.mood-15,0,100);news(S,'world','The crowd has seen this act too many times. Expect thinner houses for '+P.name+' until something changes.');}
  // network patience and hot streak
  var reps=S.reports.filter(function(r){return r.week===S.week;}),tv=reps.filter(function(r){return !r.big;});
  if(tv.some(function(r){return r.rating<r.exp-2;}))bump('net',1,'A weekly show came in well under expectations');
  else if(tv.length&&tv.every(function(r){return r.rating>r.exp+1;}))bump('net',-1,'The network liked this week');else C.net.why=C.net.why||'Holding';
  if(C.net.v>=CLOCKS.net.segs){C.net.v=2;pushEv(S,{type:'netmeet',text:'The network wants a meeting. The numbers for your weekly show have been soft for too long.',choices:['Promise them a big main event','Accept a worse time slot','Push back'],checks:{2:mkCheck(9,[{n:'Popularity '+Math.round(P.image),v:P.image>=75?2:(P.image>=55?1:0)}].concat(skillMods(S,'talk')))}});}
  if(reps.length&&reps.every(function(r){return r.rating>r.exp;}))bump('hot',1,'Every show this week beat expectations');
  else if(reps.some(function(r){return r.rating<r.exp-2;})){C.hot.v=0;C.hot.why='A flat show broke the streak';}
  if(C.hot.v>=CLOCKS.hot.segs){C.hot.v=0;S.bp=(S.bp||0)+3;S.trust=clamp(S.trust+2,0,100);if(S.net)S.net.mood=clamp(S.net.mood+5,0,100);if(!S.owner.me)S.owner.trust=clamp(S.owner.trust+2,0,100);news(S,'you',P.name+' is on a hot streak. You bank three extra booking power.');}
  // breakout
  var st=C.star,sw=st.w!=null?S.w[st.w]:null;
  if(!sw||sw.promo!==P.id||sw.rt||sw.age>28||sw.camp){st.w=starPick(S);st.v=0;st.why=st.w!=null?'Your scouts like this one':'Nobody on the roster fits';sw=null;}
  if(sw){if(sw.wonWk===S.week)bump('star',1,sw.name+' won this week');else if(sw.ws<=-2)bump('star',-1,sw.name+' keeps losing');else if(S.week-(sw.lu||0)>=3)st.why=sw.name+' is not being used';
    if(st.v>=CLOCKS.star.segs){sw.ovr=clamp(sw.ovr+5,1,100);sw.mom=clamp(sw.mom+3,-10,10);sw.morale=clamp(sw.morale+8,0,100);mile(S,sw,'breakout','Broke out as a star in '+P.name);news(S,'story',sw.name+' has arrived. The crowd treats them like a star now.');award(S,'ACH_BREAKOUT');st.w=starPick(S);if(st.w===sw.id)st.w=null;st.v=0;st.why='Looking for the next one';}}
}
EVR.mutiny=function(S,ev,choice,P){
  var R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),all=function(fn){R.forEach(fn);};
  if(choice===0){var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){S.trust=clamp(S.trust+8,0,100);all(function(w){stressAdd(S,w,-12);w.morale=clamp(w.morale+3,0,100);});S.clocks.mutiny.v=0;return rollText(r)+'You take every question and duck none of them. The room is with you again.';}
    S.trust=clamp(S.trust-5,0,100);all(function(w){w.morale=clamp(w.morale-3,0,100);});return rollText(r)+'It turns into a shouting match. You leave with less than you walked in with.';}
  if(choice===1){
    if(S.owner.me){all(function(w){w.wage=Math.round(w.wage*1.05/10)*10;w.morale=clamp(w.morale+6,0,100);stressAdd(S,w,-6);});S.clocks.mutiny.v=0;return 'Everybody gets five per cent. It is expensive, and it works.';}
    S.owner.trust=clamp(S.owner.trust-6,0,100);all(function(w){w.morale=clamp(w.morale+3,0,100);stressAdd(S,w,-6);});return S.owner.name+' calms them down, and reminds you afterwards whose job that was.';}
  S.trust=clamp(S.trust-10,0,100);all(function(w){w.morale=clamp(w.morale-4,0,100);stressAdd(S,w,8);});return 'You carry on as if nothing happened. They notice.';
};
EVR.netmeet=function(S,ev,choice,P){
  var down=function(){if(P.slot>0){P.slot--;return 'Your show moves to '+SLOTN[P.slot].toLowerCase()+'.';}P.tvRate=Math.round(P.tvRate*0.93);return 'There is no worse slot to give you, so they cut the rights fee instead.';};
  if(choice===0){var sh=P.shows[0],tg=Math.round(clamp(expected(P,sh)+4,40,95)),bonus=Math.round(P.inc0*0.05/1000)*1000;
    S.quests.push({id:S.nid++,type:'netvow',due:S.week+3,target:tg,bonus:bonus,text:'Promise to the network: a main event of '+tg+'% or better by '+cal(S.week+3).label});return 'You give your word: a main event of '+tg+'% or better within three weeks.';}
  if(choice===1){S.clocks.net.v=0;return 'You take the hit. '+down();}
  var r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){S.clocks.net.v=0;return rollText(r)+'You remind them what your show does for their Thursday. They back off.';}
  if(!S.owner.me)S.owner.trust=clamp(S.owner.trust-4,0,100);return rollText(r)+'They do not appreciate the tone. '+down();
};
QEND.netvow=function(S,q){var P=S.promos[S.player];if(P.slot>0){P.slot--;news(S,'money','You broke your promise to the network. '+P.name+' moves to '+SLOTN[P.slot].toLowerCase()+'.');}else{P.tvRate=Math.round(P.tvRate*0.93);news(S,'money','You broke your promise to the network. They cut the rights fee.');}};
PREX.push(function(S){if(S.staleUntil&&S.week<=S.staleUntil)S.hype=(S.hype||0)-0.05;});

/* --- every week --- */
WEEKX.push(function(S){
  if(S.over)return;bsInit(S);
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  // house rules that work on the week
  if(S.house.on.length)R.forEach(function(w){var d=(hasRule(S,'iron')?1:0)+(hasRule(S,'kayfabe')?0.5:0)-(hasRule(S,'curfew')?1.5:0);if(d)stressAdd(S,w,d);});
  if(hasRule(S,'def4'))P.titles.forEach(function(t){if(t.holders.length&&S.week-(t.last||t.since||0)>4){if(S.net)S.net.mood=clamp(S.net.mood-3,0,100);if(!t.warn||S.week-t.warn>=4){t.warn=S.week;news(S,'title','The '+t.name+' has gone more than four weeks without a defence. The thirty-day rule is being ignored.');}}});
  if(hasRule(S,'open'))S.order.forEach(function(id){if(id!==P.id){var RV=S.promos[id];if((RV.rel||0)<40)RV.rel=(RV.rel||0)+0.5;}});
  // the docket
  S.court.slice().forEach(function(c){
    var a=S.w[c.a],b=S.w[c.b];
    if(a.promo!==P.id||b.promo!==P.id){S.court=S.court.filter(function(x){return x!==c;});return;}
    if(S.week-c.wk>=3){stressAdd(S,a,10);stressAdd(S,b,10);S.rel[rkey(a.id,b.id)]=-1;S.trust=clamp(S.trust-2,0,100);S.court=S.court.filter(function(x){return x!==c;});news(S,'story','Nobody heard '+a.name+'’s complaint against '+b.name+'. It has turned into a grudge.');}
  });
  if(S.court.length<2&&chance(S,0.15+(hasRule(S,'kayfabe')?0.08:0)-(hasRule(S,'curfew')?0.07:0)+(R.some(function(w){return w.role==='toxic';})?0.06:0)+(R.some(function(w){return w.role==='leader'&&w.morale>=50;})?0:0.07))){var c=mkCase(S);if(c){S.court.push(c);news(S,'story','A case for wrestlers’ court: '+c.text);}}
  tickClocks(S);
  S.ap=apMax(S);S.apUsed={};S.apLog=[];
});
