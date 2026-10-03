/* ---------- company models: how a promotion is run ----------
   Every promotion follows one model. A model changes what its crowd rewards, where its money comes from, how much risk
   it can carry, who it pushes, who it hires and who it lets go. The same wrestler is worth a different amount to each.
   Models are patterns of how wrestling companies are really run; the promotions and people using them are invented.
   Hooks: mq/cr/fin(ctx) add to match quality, crowd and finish; push(w,P,S) biases who wins; fit(w,P,S) scores a wrestler
   for this company (overness-like units); card(h) reshapes a suggested card; show(S,P,show,rep) and month(S,P) are the
   owner's verdict when the player books here. */
function mAvg(ws,k){return avg(ws.map(function(w){return w[k]==null?60:w[k];}));}
function isMulti(m){return m.mt==='3way'||m.mt==='4way'||m.mt==='6man'||m.mt==='br';}
function isGim(stip){return stip==='hardcore'||stip==='ladder'||stip==='cage';}
function tenureW(S,w){return S.week-(w.jw==null?-104:w.jw);}
var MGC={};   // main gender per promotion, counted once a week (the roster does not change its mind inside a week)
function mainG(S,P){var k=S.seed+':'+S.week+':'+P.id,c=MGC[k];if(c)return c;var m=0,f=0;S.w.forEach(function(w){if(w.promo===P.id&&!w.nw){if(w.g==='F')f++;else m++;}});if(Object.keys(MGC).length>200)MGC={};return MGC[k]=f>m?'F':'M';}
/* add `d` to a running total and put a line on the match's plus-and-minus list when it is big enough to matter */
function mNote(ctx,d,text){if(text&&Math.abs(d)>=1)ctx.fx.push({s:d>=0?1:-1,x:text,m:1});return d;}

var MODELS={
  classic:{n:'Independent',ph:'an independent company',vals:'overness',d:'No house system. The crowd takes each show as it comes.',good:[],bad:[],mix:{}},

  corporate:{n:'Corporate giant',ph:'a corporate giant',vals:'overness, charisma and star quality',wq:0.34,own:'the board',
    d:'Publicly traded. A family audience, entertainment before sport, and a board that reads the accounts before the reviews.',
    good:['Star quality and charisma lift every match','Television and sponsors pay more here than anywhere','Fewer injuries: the house style is safe'],
    bad:['Hardcore matches upset the audience and the sponsors','The product can never go past Mainstream','Great wrestlers nobody cares about get lost, and then released','The shareholders take a dividend of any surplus above a reserve'],
    mix:{tv:1.25,gate:0.95,merch:1.2,sp:1.4},riskMax:1,inj:0.9,turn:1.3,ownShow:0.5,div:[1.3,0.5],
    cr:function(ctx){var d=0,sq=mAvg(ctx.all,'sq'),ch=mAvg(ctx.all,'cha');
      d+=mNote(ctx,clamp((sq-70)*0.07,-2,2.5),sq>=70?'Star presence: this audience buys names':'Nobody in there looks like a star to this audience');
      if(ctx.stip==='hardcore')d+=mNote(ctx,-3,'Too violent for a family audience');
      if(ch<60)d+=mNote(ctx,-1.5,'Good wrestlers this audience has been given no reason to care about');
      return {d:d,x:null};},
    push:function(w){return 0.12*(w.sq-65)+0.06*(w.cha-65);},
    fit:function(w){return 0.5*w.ovr+0.3*w.cha+0.2*w.sq;},
    show:function(S,P,show,rep){return rep.segs.some(function(s){return s.k==='match'&&s.stip==='Hardcore';})?{d:-1,x:'The board had calls from sponsors about the violence.'}:null;},
    month:function(S,P){var H=P.hist.slice(-4),net=0;H.forEach(function(h){net+=h.net;});var tgt=4*P.net,d=(net-tgt)/Math.max(1,Math.abs(tgt))*2;d=Math.abs(d)<0.5?0:(d>0?1:-1)*clamp(Math.abs(d),1,3);   // a good or bad month moves trust by one to three points
      return {d:r1(d),x:'The board reviewed the month: '+money(net)+' against a plan of '+money(tgt)+'.'};}},

  workrate:{n:'Wrestling for the diehards',ph:'a diehards’ company',vals:'overness and work rate, with some stamina',wq:0.62,own:'the founder',
    d:'Founded by a fan for the fans who rate matches. The work comes first, the crowd knows the difference, and the internet is always watching.',
    good:['Great matches lift the crowd as well as the rating','Two elite workers together are an event','Gimmick matches that settle a feud go over big'],
    bad:['A bad match gets booed, whoever is in it','Fan mood online moves ticket sales twice as much','Wages run high: the best workers know their value'],
    mix:{gate:1.1,ppv:1.15,merch:0.95,sp:0.9},inj:1.1,reach:30,netX:2,ownShow:1.15,
    mq:function(ctx){var d=0;if(ctx.all.length<=4&&ctx.all.every(function(w){return workRate(w)>=84;}))d+=mNote(ctx,2,'Two elite workers: the diehards came for this');
      if(ctx.stip!=='std'&&ctx.feud&&ctx.feud.heat>=40)d+=mNote(ctx,1,'A feud settled the hard way');return {d:d,x:null};},
    cr:function(ctx){var d=clamp((ctx.MQ-75)*0.12,-2.5,3.5);return {d:mNote(ctx,d,d>=0?'This crowd rewards the work':'This crowd knows a bad match when it sees one'),x:null};},
    post:function(ctx){if(ctx.res.OV>=88)ctx.all.forEach(function(w){w.morale=clamp(w.morale+1,0,100);});},
    push:function(w){return 0.12*(workRate(w)-72);},
    fit:function(w){return 0.45*w.ovr+0.45*workRate(w)+0.1*w.stam;},
    show:function(S,P,show,rep){return rep.segs.some(function(s){return s.k==='match'&&s.mq>=88;})?{d:0.5,x:'The founder is a fan first: one of those matches made the night.'}:null;}},

  purist:{n:'Sport first',ph:'a sport-first company',vals:'overness, work rate and stamina. Showmen are marked down',wq:0.68,own:'the committee',
    d:'Wrestling presented as a sport. Stamina, fighting spirit and clean results; the roster is judged on its matches, not its television time.',
    good:['Stamina and long matches are rewarded','Tournament matches mean more','Great matches lift locker-room morale; time off television does not hurt it'],
    bad:['Entertainers and comedy are rejected','Gimmick matches and cheap finishes cost you','Little television money: the gate is the business'],
    mix:{tv:0.7,gate:1.35,ppv:1.1,sp:0.9},riskMax:1,inj:1.15,noTvEgo:true,turn:1.1,
    mq:function(ctx){var d=0,st=mAvg(ctx.all,'stam');d+=mNote(ctx,clamp((st-72)*0.06,-1.5,2),st>=72?'Conditioning this crowd respects':'Short of the conditioning this crowd expects');
      if(ctx.m.len==='S'&&ctx.i>=ctx.n-3)d+=mNote(ctx,-1.5,'Too short to be taken seriously here');
      if(isGim(ctx.stip))d+=mNote(ctx,-3,'Gimmick matches are not what this crowd pays for');
      var T=ctx.S.tourn;if(T&&!T.done&&T.promo===ctx.P.id&&ctx.m.mt==='1v1'&&tournPair(T,ctx.all[0].id,ctx.all[1].id)>=0)d+=mNote(ctx,2,'A tournament match in a company built on them');
      return {d:d,x:null};},
    cr:function(ctx){var e=ctx.all.filter(function(w){return w.style==='E';}).length;return e?{d:mNote(ctx,-Math.min(3,e*2),'An entertainer in a company that sells sport'),x:null}:null;},
    fin:function(ctx,fin){return fin==='clean'?{d:1,x:null}:(fin==='cheap'||fin==='interf'?{d:mNote(ctx,-2,'This crowd wants a clean result'),x:null}:null);},
    post:function(ctx){var ov=ctx.res.OV;if(ov>=85||ov<55)ctx.all.forEach(function(w){w.morale=clamp(w.morale+(ov>=85?1.5:-1),0,100);});},
    push:function(w){return 0.1*(workRate(w)-72)+0.08*(w.stam-70);},
    fit:function(w){return 0.45*w.ovr+0.35*workRate(w)+0.2*w.stam-(w.style==='E'?8:0);},
    card:function(h){h.card.forEach(function(m){if(m._p>=60&&m.len!=='L')m.len=m._p>=90?'L':'M';});},
    show:function(S,P,show,rep){var ms=rep.segs.filter(function(s){return s.k==='match';}),cl=ms.filter(function(s){return s.fin==='clean';}).length/Math.max(1,ms.length),main=ms[ms.length-1];
      if(main&&(main.fin==='dq'||main.fin==='co'))return {d:-0.5,x:'The committee does not accept a main event without a result.'};return cl>=0.7?{d:0.3,x:'The committee approved of the clean results.'}:null;}},

  underdog:{n:'Resilient underdog',ph:'an underdog company',vals:'overness, work rate and charisma. A recent castoff gets a boost',wq:0.52,own:'the promoter',
    d:'A small budget and a long memory. It builds divisions the big companies ignore and turns their castoffs back into stars.',
    good:['Matches for secondary and division titles draw extra interest','Wrestlers released by a bigger company arrive cheap and motivated','Division titles gain prestige faster'],
    bad:['Thin margins: one bad month shows','Stars you build get poached','Low production values to start'],
    mix:{tv:1.1,gate:0.9,ppv:0.9,sp:1.1},chip:true,
    cr:function(ctx){var t=ctx.t,d=0;if(t&&(t.lvl<3||t.g!==mainG(ctx.S,ctx.P)))d+=mNote(ctx,2.5,'The division is the draw here');
      if(ctx.all.some(function(w){return w.chip>=ctx.S.week;}))d+=mNote(ctx,1,'A castoff with a point to prove');return d?{d:d,x:null}:null;},
    post:function(ctx){var t=ctx.t,r=ctx.res;if(t&&t.lvl<3&&r.OV>=70)t.prestige=clamp(t.prestige+0.6,10,100);if(r.win>=0)r.winners.forEach(function(w){if(w.chip>=ctx.S.week)addOvr(ctx.P,w,0.3);});},
    push:function(w,P,S){return (w.chip>=S.week?3:0)+0.05*(workRate(w)-70);},
    fit:function(w,P,S){return 0.6*w.ovr+0.25*workRate(w)+0.15*w.cha+(w.cut&&S.week-w.cut.w<52?6:0);}},

  startup:{n:'New money',ph:'a new-money company',vals:'overness and star quality, and young wrestlers with potential',wq:0.5,own:'the backer',
    d:'A brand-new company with a blank cheque and a clock. Stars cost a fortune, the rest of the roster is unknowns, and it loses money until it lands real television.',
    good:['Big names will sign for a company this size, at a price','A marquee name in the main event lifts the crowd','Television is worth more here than anywhere once the slot improves'],
    bad:['It loses money every week it stays in a late-night slot','Popularity leaks away while there is no better TV deal','A main event without a star falls flat'],
    mix:{tv:1.3,sp:1.1},turn:1.9,reach:45,premium:1.35,
    cr:function(ctx){if(!ctx.isMain)return null;var top=Math.max.apply(null,ctx.all.map(function(w){return w.ovr;})),im=ctx.P.image;
      return top>=im+22?{d:mNote(ctx,2,'A marquee name the building came to see'),x:null}:(top<im+8?{d:mNote(ctx,-2,'No star in the main event of a company built on stars'),x:null}:null);},
    push:function(w,P){return clamp(0.1*(w.ovr-P.image-10),-2,4);},
    fit:function(w){return 0.7*w.ovr+0.3*w.sq+(w.age<=25?(w.pot-60)*0.25:0);},
    month:function(S,P){
      if(P.slot>(P.slotSeen==null?P.slot0:P.slotSeen)){P.slotSeen=P.slot;P.image=clamp(P.image+1.5,5,100);return {d:6,x:'A better television slot is exactly what this company was built to land. The buzz is back.'};}
      P.slotSeen=P.slot;if(P.slot===0&&S.week>12){P.image=clamp(P.image-0.4,5,100);return {d:-1.5,x:'Still in a late-night slot. The backer is losing patience and the buzz is fading.'};}return null;}},

  outlaw:{n:'Outlaw',ph:'an outlaw company',vals:'overness, hardcore skill and charisma',wq:0.4,own:'the promoter',
    d:'A cult following and no rules. Weapons, blood and personality; technique is beside the point. Cheap to run, and it will never be mainstream.',
    good:['Toughness and charisma are the work rate here','Gimmick matches hit harder, and you can run as many as you like','Tiny production costs; the gate and the merchandise table pay the bills'],
    bad:['Popularity has a ceiling','Sponsors and networks pay little','A plain wrestling match bores this crowd'],
    mix:{tv:0.6,gate:1.3,ppv:0.9,merch:1.35,sp:0.5},turn:0.6,cap:62,riskMin:2,riskFree:true,gimFree:true,
    mq:function(ctx){var d=0,g=clamp((mAvg(ctx.all,'hc')-mAvg(ctx.all,'tech'))*0.08,-3,3);d+=mNote(ctx,g,g>=0?'Toughness is the work rate here':'Technicians without the stomach for this');
      if(isGim(ctx.stip))d+=mNote(ctx,2,'Exactly the kind of match this crowd came for');else if(ctx.stip==='std'&&ctx.i>=ctx.n-2)d+=mNote(ctx,-1.5,'No weapons, no blood: this crowd got restless');return {d:d,x:null};},
    cr:function(ctx){var c=mAvg(ctx.all,'cha');return {d:mNote(ctx,clamp((c-68)*0.1,-3,3),c>=68?'Personalities this crowd lives for':'Nobody in there this crowd connects with'),x:null};},
    push:function(w){return 0.1*(w.hc-65)+0.08*(w.cha-68);},
    fit:function(w){return 0.4*w.ovr+0.3*w.hc+0.3*w.cha;},
    card:function(h){var k=0;h.card.forEach(function(m){if(m.mt==='1v1'&&m.stip==='std'&&k<3&&(m._p>=90||h.chance(0.3))){m.stip=h.pick(['hardcore','hardcore','cage','ladder']);k++;}});}},

  spectacle:{n:'Lucha spectacle',ph:'a lucha spectacle company',vals:'overness, charisma and high flying',wq:0.42,own:'the showman',
    d:'Commercial, colourful and chaotic. Multi-man matches, soap-opera feuds, a sponsor on every turnbuckle and a door always open to crossover shows.',
    good:['Multi-man matches are the house style','Feuds heat up faster','Sponsors pay far more, and rivals say yes to supershows more easily'],
    bad:['A plain undercard singles match feels flat','High flying means more injuries','The product cannot go past Edgy without losing the sponsors'],
    mix:{tv:1.1,ppv:0.9,merch:1.15,sp:1.7},riskMax:2,inj:1.1,heat:1.2,xf:1,
    cr:function(ctx){var d=0,sp=mAvg(ctx.all,'speed');if(isMulti(ctx.m))d+=mNote(ctx,3,'Chaos in the ring is the house style');
      else if(ctx.m.mt==='1v1'&&!ctx.t&&!ctx.feud&&!ctx.isMain)d+=mNote(ctx,-1,'A plain singles match on a card built for spectacle');
      var fl=clamp((sp-70)*0.05,-1,1.5);d+=mNote(ctx,fl,fl>0?'High flying this crowd came to see':'Too grounded for this crowd');return {d:d,x:null};},
    fin:function(ctx,fin){return fin==='cheap'||fin==='interf'||fin==='foiled'?{d:1,x:null}:null;},
    push:function(w){return 0.1*(w.cha-68)+0.06*(w.speed-68);},
    fit:function(w){return 0.45*w.ovr+0.3*w.cha+0.25*w.speed;},
    card:function(h){h.multi(h.chance(0.5)?'6man':'4way');}},

  tradition:{n:'Lucha tradition',ph:'a lucha tradition company',vals:'overness, work rate, consistency and years with the company',wq:0.55,own:'the council',
    d:'The oldest way of doing things. Clean wrestling, teams and trios, family names, and a top spot that has to be earned over years.',
    good:['Tag and trios matches are the tradition','Clean finishes are rewarded','Long-serving wrestlers lift the top of the card and stay loyal'],
    bad:['Pushing anyone with under a year in the company costs you','A newcomer taking a title angers the veterans','Gimmick matches and cheap finishes go down badly'],
    mix:{tv:0.9,gate:1.3,ppv:0.85,merch:0.9,sp:0.9},riskMax:1,inj:0.95,turn:0.9,
    cr:function(ctx){var d=0,S=ctx.S;
      if(ctx.isMain||ctx.t){var nw=ctx.all.filter(function(w){return tenureW(S,w)<52;});
        if(nw.length)d+=mNote(ctx,-2.5,nw[0].name+' has not paid their dues in this company');else if(ctx.all.every(function(w){return tenureW(S,w)>=156;}))d+=mNote(ctx,1,'Faces this crowd has trusted for years');}
      if(ctx.m.mt==='6man'||ctx.m.mt==='tag')d+=mNote(ctx,2,'Teams are the tradition here');
      if(isGim(ctx.stip))d+=mNote(ctx,-2,'A gimmick match in a company that does not hold with them');return d?{d:d,x:null}:null;},
    fin:function(ctx,fin){return fin==='clean'?{d:1,x:null}:(fin==='cheap'||fin==='interf'?{d:mNote(ctx,-1.5,'Not how matches are won here'),x:null}:(fin==='dq'?{d:-1,x:null}:null));},
    post:function(ctx){var S=ctx.S,r=ctx.res;if(!r.seg.change)return;var nw=r.winners.filter(function(w){return tenureW(S,w)<52;});if(!nw.length)return;
      rosterOf(S,ctx.P.id).forEach(function(w){if(tenureW(S,w)>=104&&r.winners.indexOf(w)<0)w.morale=clamp(w.morale-3,0,100);});
      if(ctx.isPl)r.seg.notes.push('The veterans did not like a newcomer taking that title.');r.newcomer=true;},
    push:function(w,P,S){return Math.min(3,tenureW(S,w)/104)+(w.age>=35?1:0)-(tenureW(S,w)<52?3:0);},
    fit:function(w,P,S){return 0.5*w.ovr+0.25*workRate(w)+0.15*w.cons+Math.min(10,tenureW(S,w)/26);},
    card:function(h){h.multi('6man');},
    show:function(S,P,show,rep){return rep.segs.some(function(s){return s.k==='match'&&s.newcomer;})?{d:-2,x:'The council does not hand titles to newcomers.'}:null;}},

  joshi:{n:'Joshi',ph:'a joshi company',vals:'overness, work rate and charisma',wq:0.62,own:'the founder',gender:'F',
    d:'An all-women company. Blistering pace, stiff strikes and loyal factions; the money comes from the merchandise table, not the network.',
    good:['Speed and conditioning are rewarded','Faction against faction lifts the crowd','Merchandise pays double: the stars you build are the business'],
    bad:['Only women can be signed','The stiff style means more injuries','Television money is half what it is elsewhere'],
    mix:{tv:0.5,gate:1.1,ppv:0.8,merch:1.35},turn:1.3,riskMax:2,inj:1.3,
    mq:function(ctx){var d=0,p=(mAvg(ctx.all,'speed')+mAvg(ctx.all,'stam'))/2;d+=mNote(ctx,clamp((p-72)*0.07,-2,2.5),p>=72?'The pace this crowd expects':'Too slow for this crowd');
      if(ctx.m.len==='L'&&!ctx.isMain)d+=mNote(ctx,-1,'The pace dropped in a long undercard match');return {d:d,x:null};},
    cr:function(ctx){if(ctx.sides.length!==2)return null;var a=ctx.sides[0][0].stable,b=ctx.sides[1][0].stable;if(a==null||b==null)return null;
      return a!==b?{d:mNote(ctx,2,'Faction against faction'),x:null}:{d:mNote(ctx,-1,'Stablemates with nothing to fight over'),x:null};},
    push:function(w){return 0.1*(workRate(w)-75)+0.05*(w.cha-65);},
    fit:function(w){return w.g==='F'?0.45*w.ovr+0.4*workRate(w)+0.15*w.cha:-999;}}
};
function modelOf(P){return (P&&MODELS[P.model])||MODELS.classic;}
function mixOf(P){var m=modelOf(P).mix||{};return {tv:m.tv||1,gate:m.gate||1,ppv:m.ppv||1,merch:m.merch||1,sp:m.sp||1};}
function fitFor(S,P,w){var M=modelOf(P);return M.fit?M.fit(w,P,S):w.ovr;}
function riskRange(P){var M=modelOf(P);return [M.riskMin||0,M.riskMax==null?3:M.riskMax];}
function spMax(P){return modelOf(P).spMax||3;}

/* the match engine asks the model at every step */
MQX.push(function(ctx){var M=modelOf(ctx.P);return M.mq?M.mq(ctx):null;});
CRX.push(function(ctx){var M=modelOf(ctx.P);return M.cr?M.cr(ctx):null;});
FINX.push(function(ctx,fin,winners,losers,win){var M=modelOf(ctx.P);return M.fin?M.fin(ctx,fin,winners,losers,win):null;});
EFX.push(function(ctx,w){return w.chip>=ctx.S.week?5:0;});
POST.push(function(ctx){var M=modelOf(ctx.P);if(M.post&&!ctx.S.cal)M.post(ctx);if(ctx.res.newcomer)ctx.res.seg.newcomer=true;});

/* a new world: tenure for everybody already under contract, and each company clamps its risk level to what its model allows */
NEWX.push(function(S){
  S.w.forEach(function(w){if(w.promo!=='FA'&&w.jw==null)w.jw=-Math.round(52*clamp((w.age-21)*0.5*(0.4+h01(w.name+'ten')),0.2,12));});
  S.order.forEach(function(pid){var P=S.promos[pid],rr=riskRange(P);P.risk=clamp(P.risk,rr[0],rr[1]);P.size0=rosterOf(S,pid).length;});
});

/* every week: the popularity ceiling; every fourth week: the owner's monthly verdict, and rival companies trim and restock by fit */
WEEKX.push(function(S){
  S.order.forEach(function(pid){var P=S.promos[pid],M=modelOf(P);if(M.cap&&P.image>M.cap)P.image=M.cap;});
  // a company run for its shareholders pays out most of what piles up beyond a healthy reserve, once a month
  if(cal(S.week).wom===4)S.order.forEach(function(pid){var P=S.promos[pid],M=modelOf(P);if(!M.div)return;var ex=P.cash-(P.cash0||P.cash)*M.div[0];
    if(ex>0){var dv=Math.round(ex*M.div[1]/10000)*10000;P.cash-=dv;if(pid===S.player)news(S,'money','The shareholders took a dividend of '+money(dv)+' from the month\'s surplus.');}});
  var PL=S.promos[S.player],MP=modelOf(PL);
  if(cal(S.week).wom===4&&MP.month){var v=MP.month(S,PL);if(v){if(S.owner&&!S.owner.me)S.owner.trust=clamp(S.owner.trust+v.d,0,100);news(S,'you',v.x);}}
  S.order.forEach(function(pid,ix){
    if(pid===S.player||(S.week+ix)%4)return;
    var P=S.promos[pid],M=modelOf(P),R=rosterOf(S,pid).filter(function(w){return !w.nw;});
    if(M===MODELS.startup){if(P.slot<2&&P.image>=SLOT_REQ[P.slot+1]&&chance(S,0.2)){P.slot++;news(S,'money',P.name+' landed a better television slot: '+SLOTN[P.slot].toLowerCase()+'.');}M.month(S,P);}
    // a company that has run out of money sheds its biggest wage
    if(P.cash<0&&P.neg>=12&&(P.prodLvl>0||P.adv>0)){
      if(P.prodLvl>0){P.prodLvl--;news(S,'money',P.name+' cut production to '+PRODN[P.prodLvl].toLowerCase()+' after weeks in the red.');}
      else{P.adv--;news(S,'money',P.name+' cut its advertising after weeks in the red.');}
      P.neg=8;return;}
    if(P.cash<0&&P.neg>=3&&chance(S,0.5)){var big=R.filter(function(w){return holdLvl(P,w.id)===0&&!inFeud(S,w.id);}).sort(function(a,b){return b.wage-a.wage;})[0];
      if(big){news(S,'contract',P.name+' can no longer afford '+big.name+', who is a free agent.');P.nrel=(P.nrel||0)+1;leaveCompany(S,big,'released');big.cut={w:S.week,from:pid,img:P.image};big.promo='FA';big.brand=null;return;}}
    if(!M.fit||R.length<Math.max(14,(P.size0||R.length)-3)||!chance(S,0.2*(M.turn||1)))return;
    // let go of whoever is worth least to this company relative to their standing: never a champion, a team half or anyone mid-feud
    var G=mainG(S,P),c=R.filter(function(w){return holdLvl(P,w.id)===0&&w.team==null&&w.inj<=0&&!inFeud(S,w.id)&&S.week-(w.jw||0)>=26&&R.filter(function(x){return x.g===w.g;}).length>6;});
    if(!c.length)return;
    var res=function(x){return fitFor(S,P,x)-x.ovr;},all=R.map(res).sort(function(a,b){return a-b;}),med=all[Math.floor(all.length/2)];
    c.sort(function(a,b){return res(a)-res(b);});
    var w=c[0];if(res(w)>med-5)return;
    news(S,'contract',P.name+' released '+w.name+'.'+(w.ovr>=60?' '+pick(S,['Not what that company is looking for.','A good hand who never fitted the system there.','Somebody else is going to be glad of that.']):''));
    P.nrel=(P.nrel||0)+1;leaveCompany(S,w,'released');w.cut={w:S.week,from:pid,img:P.image};w.promo='FA';w.brand=null;w.morale=clamp(w.morale-10,20,100);
  });
});

/* joining and leaving: tenure starts again, and a castoff arrives at an underdog with something to prove */
function modelJoin(S,w,P){
  w.jw=S.week;
  if(modelOf(P).chip&&w.cut&&S.week-w.cut.w<52&&w.cut.img>P.image+5){w.chip=S.week+26;w.mom=clamp(w.mom+3,-10,10);w.morale=Math.max(w.morale,88);if(P.id===S.player)news(S,'contract',w.name+' arrives with a point to prove after being let go by '+(S.promos[w.cut.from]?S.promos[w.cut.from].name:'a bigger company')+'.');}
}

/* what the screens show */
E.MODELS=MODELS;E.tenure=function(S,id){var w=S.w[id];return w&&w.jw!=null?Math.max(0,S.week-w.jw):null;};E.chem=function(S,a,b){return chem(S,a,b);};
E.modelOf=function(S,pid){var P=S.promos[pid||S.player],M=modelOf(P),rr=riskRange(P),mx=mixOf(P);return {id:P.model||'classic',n:M.n,ph:M.ph,vals:M.vals||'overness',d:M.d,good:M.good,bad:M.bad,own:M.own||'the owner',mix:mx,riskMin:rr[0],riskMax:rr[1],spMax:spMax(P),cap:M.cap||null,gender:M.gender||null};};
E.modelList=function(){return Object.keys(MODELS).map(function(k){var M=MODELS[k];return {id:k,n:M.n,d:M.d,good:M.good,bad:M.bad};});};
/* how well a wrestler suits the player's company: the fit score set against their overness */
var fitMed={k:'',v:0};
E.fit=function(S,id){var w=S.w[id],P=S.promos[S.player],M=modelOf(P);if(!w||!M.fit)return null;var f=M.fit(w,P,S);if(f<-100)return {v:-99,n:'Cannot work here'};
  // judged against the typical member of your own roster, so a star is not marked down just for being a star
  var R=rosterOf(S,P.id).filter(function(x){return !x.nw;}),k=S.seed+':'+S.week+':'+P.id+':'+R.length;
  if(fitMed.k!==k){var a=R.map(function(x){return M.fit(x,P,S)-x.ovr;}).sort(function(x,y){return x-y;});fitMed={k:k,v:a.length?a[Math.floor(a.length/2)]:0};}
  var d=f-w.ovr-fitMed.v;
  return {v:Math.round(d),n:d>=5?'Made for this company':(d>=2?'A good fit':(d>-2?'Fits well enough':(d>-5?'An awkward fit':'Wrong for this company')))};};
