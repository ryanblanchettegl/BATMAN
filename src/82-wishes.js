/* ---------- small depth systems from WISHLIST.md ---------- */

/* a wrestler back from a long injury gets a returning pop that fades over four weeks */
CRX.push(function(ctx){
  var d=0,names=[];
  ctx.all.forEach(function(w){
    if(!w.rw||w.rwl==null)return;var age=ctx.S.week-w.rw;
    if(age<0||age>3||w.rwl<3)return;
    d+=2.4*(1-age/4)*(w.ovr>=50?1:0.6);names.push(w.name);
  });
  return names.length?{d:d,x:names.join(' and ')+(names.length>1?' are':' is')+' back from injury and the crowd knows it'}:null;
});

/* gimmick matches wear out: each stipulation draws a little less every time it is used inside a year, and recovers with rest */
function stipUseList(P,stip){var u=P.su||(P.su={});return u[stip]||(u[stip]=[]);}
function stipWorn(S,P,stip){if(!stip||stip==='std')return 0;var L=stipUseList(P,stip).filter(function(w){return S.week-w<52;});return modelOf(P).gimFree?0:Math.max(0,L.length-12);}   // a gimmick company's crowd never tires of them
CRX.push(function(ctx){
  var n=stipWorn(ctx.S,ctx.P,ctx.stip);if(!n)return null;
  return {d:-Math.min(2,n*0.15),x:'The '+STIP[ctx.stip].n.toLowerCase()+' match has been done to death this year'};
});
POST.push(function(ctx){if(ctx.S.cal||!ctx.stip||ctx.stip==='std')return;var L=stipUseList(ctx.P,ctx.stip);L.push(ctx.S.week);while(L.length&&ctx.S.week-L[0]>=52)L.shift();});
/* for the booking screen: how worn is a stipulation for the player's company */
E.stipFresh=function(S,stip){var n=stipWorn(S,S.promos[S.player],stip);return {worn:n,word:n>=12?'overused':(n>=5?'getting stale':'fresh')};};

/* referees: four named officials with a skill. A sharp one lifts the main event; a weak one can miss a call, and it becomes a story */
var REFEREES=[{n:'Inspector Bucket',sk:82},{n:'Sergeant Cuff',sk:70},{n:'Mr. Pickwick',sk:56},{n:'Dogberry',sk:32}];
function refFor(ctx){var h=(ctx.S.week*7+(ctx.show.id||'x').length*3+(ctx.isMain?0:1+ctx.m.sides.length))%REFEREES.length;return REFEREES[h];}
CRX.push(function(ctx){
  var r=refFor(ctx);if(!ctx.isMain||r.sk<75)return null;
  return {d:1.2,x:r.n+' is the referee for the main event, and nothing gets past them'};
});
POST.push(function(ctx){
  if(ctx.S.cal)return;var r=refFor(ctx),seg=ctx.res.seg;seg.ref=r.n;
  if(r.sk>=45||!chance(ctx.S,0.14))return;
  var what=pick(ctx.S,['a clear pin','a low blow','a tag','a rope break','a foreign object']);
  seg.ov=clamp(seg.ov-3,5,99);seg.notes.push(r.n+' missed '+what+'. The crowd is furious.');
  if(ctx.feud)heatUp(ctx.S,ctx.feud,4,r.n+' missed '+what);
  if(ctx.isPl)news(ctx.S,'story',r.n+' missed '+what+' at '+ctx.show.name+'. The talk is of nothing else.');
});

/* managers meddle: ringside interference, heat that belongs to the manager, and the manager turning on a client who keeps losing */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(S.cal||!ctx.isPl)return;
  ctx.all.forEach(function(w){
    if(w.mgr==null)return;var mg=S.w[w.mgr];if(!mg||mg.promo!==w.promo||mg.rt)return;
    var won=r.winners.indexOf(w)>=0,fin=r.fin;
    // the manager turns on a client who keeps losing, once they have made enough enemies of their own
    if(!won&&r.win>=0&&w.ws<=-3&&(mg.mh||0)>=30&&chance(S,0.2)){
      w.mgr=null;w.morale=clamp(w.morale-6,0,100);if(mg.align===w.align)turn(S,mg,'walked out on '+w.name);
      r.seg.notes.push(mg.name+' has seen enough, shoves '+w.name+' and walks to the back.');news(S,'story',mg.name+' has walked out on '+w.name+' after the losing streak.');return;}
    if(fin==='interf'||fin==='foiled'||!chance(S,0.1))return;
    var good=chance(S,clamp(0.45+(mg.mic-60)/200,0.2,0.75));
    if(good){mg.mh=clamp((mg.mh||0)+6,0,100);r.seg.notes.push(mg.name+' distracts the referee at ringside and '+w.name+' gets the edge.');if(ctx.feud)heatUp(S,ctx.feud,3,mg.name+' interfered for '+w.name);r.seg.ov=clamp(r.seg.ov+1,5,99);}
    else{mg.mh=clamp((mg.mh||0)+2,0,100);r.seg.notes.push(mg.name+' tries to interfere and is thrown out by the referee.');r.seg.ov=clamp(r.seg.ov+0.5,5,99);}
  });
});
/* a manager the crowd hates is worth a little to the show */
CRX.push(function(ctx){
  var h=0,who=null;ctx.all.forEach(function(w){if(w.mgr!=null){var mg=ctx.S.w[w.mgr];if(mg&&(mg.mh||0)>=30&&mg.promo===w.promo){h=Math.max(h,mg.mh);who=mg;}}});
  return who?{d:clamp(h/40,0.5,2),x:'The crowd loves to hate '+who.name}:null;
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.mh)w.mh=w.mh>1?w.mh*0.96:0;});});   // a manager's heat cools if they stay quiet

/* botches and saves: rarely a risky move goes wrong, and a veteran in the match can cover for it */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal)return;var risk=0.012*(STIP[ctx.stip]?STIP[ctx.stip].inj:1)*(ctx.mins>=14?1.2:1);
  if(!chance(S,risk))return;
  var seg=ctx.res.seg,mover=pick(S,ctx.all),vets=ctx.all.filter(function(w){return w!==mover&&w.age>=33;}).sort(function(a,b){return (b.cons||60)-(a.cons||60);}),vet=vets[0];
  var move=pick(S,['a top-rope move','a bump on the floor','a springboard','a suplex','a dive over the top']);
  if(vet&&chance(S,clamp(0.45+((vet.cons||60)-60)/150,0.3,0.85))){
    seg.notes.push(mover.name+' slipped on '+move+', and '+vet.name+' covered it so smoothly that most of the crowd never noticed.');vet.morale=clamp(vet.morale+2,0,100);mover.morale=clamp(mover.morale+1,0,100);
  }else{
    seg.ov=clamp(seg.ov-5,5,99);seg.notes.push(mover.name+' botched '+move+(vet?' and even '+vet.name+' could not cover it.':'. Nobody in the ring could cover it.')+' The crowd noticed.');
    mover.morale=clamp(mover.morale-3,0,100);
  }
});

/* match of the year, live: a running top ten of this calendar year's best matches across every promotion */
SHOWX.push(function(S,P,show,rep){
  var yr=cal(S.week).year,L=S.moty||(S.moty=[]);
  rep.segs.forEach(function(s){if(s.k!=='match'||s.ov==null)return;
    L.push({l:s.label,ov:s.ov,show:rep.name,promo:P.id,w:S.week,yr:yr,win:s.win||null,title:s.title||null,stip:s.stip||null,mt:s.mt||'',mins:s.mins||0,ids:(s.ids||[]).slice(0,8)});});
  S.moty=L.filter(function(m){return m.yr===yr;}).sort(function(a,b){return b.ov-a.ov||a.w-b.w;}).slice(0,10);
});
E.matchOfYear=function(S){var yr=cal(S.week).year;return (S.moty||[]).filter(function(m){return m.yr===yr;}).map(function(m){return {l:m.l,ov:m.ov,show:m.show,promo:m.promo,promoName:S.promos[m.promo]?S.promos[m.promo].name:m.promo,w:m.w,win:m.win,title:m.title,stip:m.stip,mt:m.mt,mins:m.mins,ids:m.ids};});};

/* catchphrases: a promo that lands can coin one. It lifts the crowd and merchandise until it is overused */
var CATCHES=['Nobody leaves until I say so.','The house always wins.','Count the lights. Then count me out.','Kneel, or be knelt.','My name is the last thing you will hear.','Read it, and weep.','Say it to my face.','The bell tolls for you.','Ask the crowd who owns this ring.','Every story ends. Yours ends tonight.','You are late to your own funeral.','Bow to the champion.','The curtain falls on you.','Hear that? That is the sound of the end.','I was here before the bell.','Keep your eyes on the door.'];
ANGDONE.push(function(S,P,a,ids){
  if(S.cal||P.id!==S.player||!a||a.ov<72||!ids.length)return;
  var w=ids.map(function(id){return S.w[id];}).filter(function(x){return x&&!x.cphrase&&x.mic>=60;}).sort(function(p,q){return q.mic-p.mic;})[0];
  if(!w||rosterOf(S,P.id).filter(function(x){return x.cphrase;}).length>=6||!chance(S,0.15))return;
  var taken={};S.w.forEach(function(x){if(x.cphrase)taken[x.cphrase.t]=1;});var free=CATCHES.filter(function(c){return !taken['“'+c+'”'];});if(!free.length)return;
  var ph='“'+pick(S,free)+'”';w.cphrase={t:ph,w:S.week,n:0};
  a.text+=' '+w.name+' ends it with a line the crowd will not forget: '+ph;news(S,'story',w.name+' has a catchphrase now: '+ph);mile(S,w,'promo','Coined a catchphrase: '+ph);
});
function catchFresh(w){return w.cphrase?clamp(1-w.cphrase.n/40,0,1):0;}
function catchBoost(S,P){var b=0;rosterOf(S,P.id).forEach(function(w){if(w.cphrase)b+=0.025*catchFresh(w);if(w.fol>20)b+=Math.min(0.02,w.fol/5000);});return Math.min(0.16,b);}
CRX.push(function(ctx){
  var d=0,who=[];ctx.all.forEach(function(w){if(w.cphrase&&catchFresh(w)>0.15){d+=1.2*catchFresh(w);who.push(w.name);}});
  return who.length?{d:Math.min(2,d),x:'The crowd chants '+who[0]+'’s catchphrase with them'}:null;
});
POST.push(function(ctx){if(ctx.S.cal)return;ctx.all.forEach(function(w){if(w.cphrase)w.cphrase.n++;});});

/* debuts with a build: teaser vignettes before a newcomer's first match. A hyped debut starts hot; an over-hyped one that flops costs more than no hype */
CRX.push(function(ctx){
  var d=0,who=[];ctx.all.forEach(function(w){if(w.deb&&w.hy){d+=1.3*w.hy;who.push(w);}});
  ctx.debuts=who;
  return who.length?{d:Math.min(4,d),x:who[0].name+'’s debut has been talked up for weeks'}:null;
});
POST.push(function(ctx){
  var S=ctx.S,seg=ctx.res.seg;if(S.cal||!ctx.debuts||!ctx.debuts.length)return;
  ctx.debuts.forEach(function(w){
    var hy=w.hy;w.hy=0;
    if(seg.ov<62&&hy>=2){w.morale=clamp(w.morale-8,0,100);ctx.P.image=clamp(ctx.P.image-0.25*hy,5,100);seg.notes.push(w.name+' was sold as the next big thing and the debut did not deliver. The crowd feels cheated.');if(ctx.isPl)news(S,'story',w.name+'’s debut flopped after weeks of hype.');}
    else if(seg.ov>=72){w.mom=clamp(w.mom+2,-10,10);addOvr(ctx.P,w,0.6*hy);seg.notes.push(w.name+' arrives hot. The weeks of teasers paid off.');if(ctx.isPl)news(S,'story',w.name+' made a hot debut.');}
  });
});

/* cliffhangers: a main event that settles nothing leaves a question open and the next show opens to a bigger crowd. Three open at once and the crowd stops caring */
PREX.push(function(S,P,show){
  var L=(S.open||[]).filter(function(o){return S.week-o.w<=2&&!o.used;});S.carryNote=null;if(!L.length)return;
  var n=L.length;S.hype=(S.hype||0)+(n<=2?0.04*n:-0.04);
  S.carryNote=n<=2?(n===1?'Last time out left a question hanging. The crowd came back to hear the answer.':'Two questions are hanging. The crowd came back curious.'):'There are '+n+' questions hanging at once. The crowd has stopped caring about any of them.';
  L.forEach(function(o){o.used=1;});
});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player)return;var ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1];
  if(S.carryNote){rep.carry=S.carryNote;if(rep.sheet)rep.sheet.lines.unshift(S.carryNote);S.carryNote=null;}
  var open=S.open||(S.open=[]);S.open=open.filter(function(o){return S.week-o.w<=2;});
  if(main&&(main.fin==='dq'||main.fin==='co'||main.fin==='draw'||main.fin==='interf')&&S.open.length<6)S.open.push({w:S.week,t:main.label});
});
E.openThreads=function(S){return (S.open||[]).filter(function(o){return S.week-o.w<=2&&!o.used;}).map(function(o){return {w:o.w,t:o.t};});};

/* ask the room: before a signing, who is glad and who is angry about it */
E.askRoom=function(S,id){
  var w=S.w[id],P=S.promos[S.player];if(!w)return null;
  var glad=[],angry=[];
  rosterOf(S,P.id).forEach(function(x){
    if(x.nw||x.id===id||x.inj>0)return;var c=chem(S,x.id,id),threat=x.g===w.g&&w.ovr>x.ovr+4&&w.ovr<x.ovr+28&&holdLvl(P,x.id)===0&&x.ovr>=P.image-12&&x.morale<75,champThreat=x.g===w.g&&holdLvl(P,x.id)>0&&w.ovr>x.ovr-4;
    if(c>=2.2)glad.push({w:x,s:c,why:'they work well together'});
    else if(c<=-2.2)angry.push({w:x,s:c,why:'they do not get on'});
    else if(champThreat)angry.push({w:x,s:-9,why:'the title picture just got crowded'});
    else if(threat)angry.push({w:x,s:-3,why:'they see a rival for the same spot'});
  });
  glad.sort(function(a,b){return b.s-a.s;});angry.sort(function(a,b){return a.s-b.s;});
  var f=function(L){return L.slice(0,3).map(function(o){return o.w.name+' ('+o.why+')';}).join('; ');};
  var text=w.name+': '+(glad.length?'glad to see them: '+f(glad)+'. ':'nobody is especially glad. ')+(angry.length?'Unhappy: '+f(angry)+'.':'Nobody has a problem with it.');
  return {glad:glad.map(function(o){return o.w.id;}),angry:angry.map(function(o){return o.w.id;}),text:text};
};

/* production values: lights, set, pyro and cameras lift a big match. A corporate board expects a slick show; an outlaw crowd does not care */
CRX.push(function(ctx){
  var P=ctx.P,lv=P.prodLvl,M=modelOf(P),d=0,x=null;
  if(ctx.isMain&&(ctx.big||ctx.show.big)&&M.prodX!==0.25&&lv!==P.prod0){d=0.7*(lv-P.prod0);x=d>0?'The production team makes the main event look huge':'The main event looks cheap next to what this crowd expects';}
  if(M===MODELS.corporate&&lv<2){d-=1;x=x||'The board expects a slicker product than this';}
  return d?{d:d,x:x}:null;
});

/* the annual report: at the end of the year, money by source, best draw, best match, biggest signing and a letter from the owner */
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal)return;var y=S.ybest||(S.ybest={});
  if(!y.draw||rep.att>y.draw.v)y.draw={v:rep.att,n:rep.name,w:S.week};
});
WEEKX.push(function(S){
  var c=cal(S.week);if(c.month!==11||c.wom!==4||S.cal)return;
  var P=S.promos[S.player],rows=P.hist.slice(-48),sum=function(k){return rows.reduce(function(a,r){return a+(r[k]||0);},0);};
  var src=[{n:'Television',v:sum('tv')},{n:'Tickets',v:sum('gate')},{n:'Big event buys',v:sum('ppv')},{n:'Merchandise',v:sum('merch')},{n:'Sponsors',v:sum('spons')},{n:'Bonuses',v:sum('bonus')}],net=sum('net'),plan=P.net*rows.length;
  var A=(S.awards&&S.awards[0]&&S.awards[0].year===c.year)?S.awards[0].list:[],mt=A.filter(function(x){return x.k==='Match of the year';})[0];
  var sign=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.jw!=null&&S.week-w.jw<=48;}).sort(function(a,b){return b.wage-a.wage;})[0];
  var o=S.owner,good=net>=plan,t=o.me?null:o.trust;
  var letter=o.me?'You kept the doors open for another year. Read the figures, then decide what the next one is for.':
    o.name+(good?' writes: “The year beat the plan by '+money(net-plan)+'. ':' writes: “The year fell short of the plan by '+money(plan-net)+'. ')+(t>=70?'You have my confidence, and I mean to show it.”':(t>=45?'I will be watching the next one closely.”':'I need to see a different year from this one.”'));
  S.annual={year:c.year,src:src,net:net,plan:plan,draw:S.ybest&&S.ybest.draw||null,match:mt?mt.v:null,sign:sign?{name:sign.name,wage:sign.wage,id:sign.id}:null,letter:letter};S.annualNew=true;S.ybest={};
});
E.annualReport=function(S){return S.annual||null;};

/* the bar moves: when a rival has a great night in a city you share, your next show there has more to live up to */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id===S.player||rep.exp==null||rep.rating<rep.exp+4)return;
  var mine=S.promos[S.player].cities||[],theirs=P.cities||[];if(!theirs.length)return;
  var city=theirs[hash('bar'+S.seed+P.id+S.week)%theirs.length];if(mine.indexOf(city)<0)return;
  (S.bar||(S.bar={}))[city]={w:S.week,d:Math.min(3,(rep.rating-rep.exp)/3),by:P.name,r:rep.rating};
  news(S,'world',P.name+' had a great night in '+city+' ('+rep.rating+'%). Anyone who follows them there has more to live up to.');
});
function barCity(S,venue){
  var B=S.bar;if(!B)return null;
  for(var c in B){if(venue.indexOf(c)===0&&S.week-B[c].w<=4){var b=B[c];delete B[c];return {d:b.d,note:b.by+' had a great night in '+c+' recently. The crowd expected more from this show.'};}}
  return null;
}
SHOWX.push(function(S,P,show,rep){if(P.id===S.player&&rep.barNote&&rep.sheet)rep.sheet.lines.unshift(rep.barNote);});

/* followers: every wrestler has a following that grows with big moments and fades without them. A clip can spread, bringing casual fans and merchandise */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal)return;var r=ctx.res,big=ctx.big||ctx.show.big,gain=0,clip=false;
  if(r.seg.change)gain+=8;if(r.upset)gain+=4;if(ctx.isMain&&big&&r.OV>=80)gain+=5;if(r.OV>=90){gain+=6;clip=true;}else if(r.OV>=80)gain+=1.5;
  if(!gain&&!clip)return;
  var shared=r.win>=0?r.winners:ctx.all;shared.forEach(function(w){w.fol=Math.min(400,(w.fol||0)+gain*(w.ovr>=70?0.8:1.2));});
  if(clip&&ctx.isPl&&chance(S,0.3)){var star=shared.slice().sort(function(a,b){return b.ovr-a.ovr;})[0];star.fol=Math.min(400,(star.fol||0)+10);r.seg.notes.push('A clip of this match is spreading online. Casual fans are asking who '+star.name+' is.');news(S,'story','A clip of '+r.seg.label+' is everywhere. '+star.name+' has a lot of new followers.');}
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.fol)w.fol=w.fol>2?w.fol*0.985:0;});});

/* guest stars: an invented actor, athlete or singer wants a one-night spot. Casuals tune in, diehards groan, and the match itself is a risk */
var GUESTS=[['Marlowe Kane','a film actor'],['Tessa Quill','a pop singer'],['Dag Holloway','an Olympic sprinter'],['Iris Valdane','a television host'],['Rudy Ashgrove','a retired boxer']];
EVMAKE.push(function(S,P,R){
  if(S.cal||(S.guestWeek!=null&&S.week-S.guestWeek<20)||S.week<6||!chance(S,0.05))return null;
  var g=pick(S,GUESTS);S.guestWeek=S.week;
  return {type:'guest',g:g[0],text:g[0]+', '+g[1]+', has asked for a one-night spot on your show. The casuals would tune in. The diehards would not thank you.',choices:['Book them in a match','A short cameo only','Turn them down']};
});
EVR.guest=function(S,ev,choice,P){
  if(choice===2)return 'You thank '+ev.g+' and say the card is full. Nobody is surprised.';
  if(choice===1){S.hype=(S.hype||0)+0.05;S.rateMod=(S.rateMod||0)-1;return ev.g+' walks out, waves, and walks off. Casual viewers will notice. The diehards will grumble. Expect a slight lift in the building and a flat spot in the show.';}
  var ok=chance(S,0.5);S.hype=(S.hype||0)+0.12;S.rateMod=(S.rateMod||0)+(ok?3:-5);S.guestNote=ev.g+(ok?' held up better than anyone dared hope.':' was a liability in the ring.');
  return ev.g+' will take part in a match on your next show. A big lift in the building, and a real risk in the ring.';
};
SHOWX.push(function(S,P,show,rep){if(P.id===S.player&&S.guestNote){rep.guest=S.guestNote;if(rep.sheet)rep.sheet.lines.unshift('Guest spot: '+S.guestNote);S.guestNote=null;}});

/* hall of fame night: an induction is held on the flagship weekend, with a speech and a lift for the crowd */
var HOF_SPEECH=['“I never thought a bag, a bell and a bad idea would bring me here.”','“Thank you to everyone who booed me. You made me.”','“The ring was the only place I ever knew who I was.”','“Look after each other. The business forgets, but we should not.”','“I fell more times than I won. I would do every one of them again.”'];
(function(){
  var old=EVR.hof;
  EVR.hof=function(S,ev,choice,P){
    var res=old(S,ev,choice,P),id=ev.c[choice];
    if(id!=null){S.hofNight={id:id,week:E.nextBig(S).week};res+=' The ceremony will be held at '+E.nextBig(S).name+'.';}
    return res;
  };
})();
CRX.push(function(ctx){
  var h=ctx.S.hofNight;if(!h||!(ctx.big||ctx.show.big)||ctx.S.week<h.week||ctx.P.id!==ctx.S.player||!ctx.isMain)return null;
  return {d:1.5,x:'The hall of fame induction has warmed the building before the bell'};
});
SHOWX.push(function(S,P,show,rep){
  var h=S.hofNight;if(!h||P.id!==S.player||!show.big||S.week<h.week)return;
  var w=S.w[h.id];S.hofNight=null;if(!w)return;
  rep.hofNight={name:w.name,speech:pick(S,HOF_SPEECH)};
  if(rep.sheet)rep.sheet.lines.unshift(w.name+' was inducted into the hall of fame tonight. '+rep.hofNight.speech);
  P.image=clamp(P.image+0.2,5,100);news(S,'story',w.name+'’s hall of fame induction was the emotional moment of '+show.name+'. '+rep.hofNight.speech);
});

/* home-town heroes: a wrestler in their home city gets a pop. Beating them there costs. A home-town title win lifts the city */
function atHome(ctx,w){return !!(w.town&&ctx.rep&&ctx.rep.venue&&ctx.rep.venue.indexOf(w.town)===0);}
CRX.push(function(ctx){
  var h=ctx.all.filter(function(w){return atHome(ctx,w);});
  return h.length?{d:1.6*Math.min(2,h.length),x:h[0].name+' is a hometown hero here'+(ctx.rep.venue?' in '+h[0].town:'')}:null;
});
POST.push(function(ctx){
  if(ctx.S.cal||!ctx.rep||!ctx.rep.venue)return;var r=ctx.res,seg=r.seg;
  var home=r.losers.filter(function(w){return atHome(ctx,w);});
  if(home.length&&r.win>=0&&r.fin!=='dq'&&r.fin!=='co'){r.winners.forEach(function(w){w.mom=clamp(w.mom-1,-10,10);});seg.notes.push('The home crowd turns on '+names(r.winners)+' for beating '+home[0].name+' in '+home[0].town+'.');}
  var champ=r.win>=0&&seg.change?r.winners.filter(function(w){return atHome(ctx,w);})[0]:null;
  if(champ){ctx.P.image=clamp(ctx.P.image+0.15,5,100);seg.notes.push(champ.name+' wins the title in '+champ.town+'. The whole city is celebrating.');if(ctx.isPl)news(ctx.S,'story',champ.name+' won the title in their home town of '+champ.town+'.');}
});

/* the milestone wall: a list of firsts with dates. Each one lands as a pop-up and is listed on Career */
function msAward(S,id){if(S.cal||(S.firsts&&S.firsts[id]))return;(S.firsts||(S.firsts={}))[id]=S.week;S.toasts.push(id);}
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal)return;var ms=rep.segs.filter(function(s){return s.k==='match';});
  if(rep.sellout)msAward(S,'MS_SELLOUT');if(rep.rating>=80)msAward(S,'MS_SHOW80');
  if(ms.some(function(s){return s.ov>=90;}))msAward(S,'MS_TOPMATCH');
  if(ms.some(function(s){return s.change;}))msAward(S,'MS_TITLECHANGE');
  if(ms.some(function(s){return s.crown;}))msAward(S,'MS_CROWN');
  ms.forEach(function(s){if(!s.change||!s.wids)return;s.wids.forEach(function(id){var w=S.w[id];if(w&&w.o0!=null&&w.o0<=35&&w.promo===S.player)msAward(S,'MS_BUILT');});});
  if(S.stats.shows>=50)msAward(S,'MS_50');if(S.stats.shows>=100)msAward(S,'MS_100');
});
WEEKX.push(function(S){
  if(S.stats&&S.stats.feudsDone>=1)msAward(S,'MS_FEUD');if(S.sponsors&&S.sponsors.length)msAward(S,'MS_SPONSOR');
});
E.milestones=function(S){return E.ACH.filter(function(a){return a.ms;}).map(function(a){return {id:a.id,name:a.name,desc:a.desc,w:(S.firsts&&S.firsts[a.id])||null};});};

/* careers have a shape: rising, in their prime, past their best, on the way out. High flyers peak young and fade fast; brawlers and talkers last */
E.phase=function(w){
  if(!w||w.rt)return {id:'retired',word:'retired'};
  if(w.age<w.pk[0])return {id:'rising',word:'rising'};
  if(w.age<=w.pk[1])return {id:'prime',word:'in their prime'};
  if(w.age<w.cl)return {id:'past',word:'past their best'};
  return {id:'late',word:'on the way out'};
};
/* once a year the booker hears who has moved from one phase to the next */
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.rt||w.promo!==S.player||w.nw)return;var ph=E.phase(w).id;
    if(w.ph==null){w.ph=ph;return;}
    if(w.ph!==ph){(S.phaseLog||(S.phaseLog=[])).push({id:w.id,from:w.ph,to:ph,w:S.week});w.ph=ph;}
  });
  var c=cal(S.week);if(c.month!==11||c.wom!==4||S.cal)return;
  var L=(S.phaseLog||[]).filter(function(x){return S.week-x.w<48&&S.w[x.id]&&S.w[x.id].promo===S.player;});S.phaseLog=[];if(!L.length)return;
  var word={prime:'has reached their prime',past:'is now past their best',late:'is on the way out',rising:'is on the rise'};
  news(S,'you','The year in careers: '+L.map(function(x){return S.w[x.id].name+' '+word[x.to];}).join('; ')+'.');
});

/* wear and tear in one word: fresh, sore, banged up, running on fumes. Combines condition and the worst body zone */
E.bodyWord=function(S,id){
  var w=S.w[id];if(!w)return null;var worst=Math.max(maxZone(w),100-w.cond),word=worst<25?'fresh':(worst<45?'sore':(worst<65?'banged up':'running on fumes'));
  return {word:word,v:Math.round(worst),bad:worst>=45};
};

/* finishers: a finisher nobody kicks out of lifts the crowd. A booked kick-out (m.kick) spends that protection and makes the match */
CRX.push(function(ctx){
  var d=0,who=null;ctx.all.forEach(function(w){if((w.fp||0)>=2&&w.fin){d+=Math.min(0.8,w.fp*0.16);who=who||w;}});
  var k=ctx.m.kick&&who;d=Math.min(1.2,d);if(k)d+=1.2;
  return who?{d:d,x:k?'The crowd gasps as '+who.name+'’s '+(who.fin||'finish')+' is kicked out of':'Everyone knows '+who.name+'’s '+(who.fin||'finish')+' ends it'}:null;
});
POST.push(function(ctx){
  var r=ctx.res,S=ctx.S;if(S.cal||r.win<0)return;
  r.winners.forEach(function(w){
    if(ctx.m.kick&&(w.fp||0)>=2){w.fp=Math.max(0,w.fp-2);ctx.res.seg.notes.push(w.name+'’s finisher was kicked out of. Its protection drops to '+w.fp+'.');}
    else if(r.fin==='clean'&&w.fin)w.fp=Math.min(5,(w.fp||0)+1);
  });
  r.losers.forEach(function(w){if(w.fp)w.fp=Math.max(0,w.fp-0.5);});
});
E.finisherWord=function(w){var f=w.fp||0;return f>=4?'unbeaten':(f>=2?'strong':(f>=1?'building':'untested'));};

/* gimmicks go stale: freshness climbs for the first twelve weeks, peaks, then fades. A repackage or a turn starts it over */
function gimFresh(S,w){
  var set=Math.max(w.gw==null?-1e4:w.gw,w.gs==null?-1e4:w.gs);if(set<-9e3)set=-26;   // a repackage (gw) or a turn (gs) starts it over
  var t=S.week-set;
  return Math.round(t<12?45+t*3.75:(t<30?90:Math.max(20,90-(t-30)*0.9)));
}
E.gimFresh=function(S,id){var w=S.w[id];return w?gimFresh(S,w):null;};
CRX.push(function(ctx){
  var d=0,up=null,down=null;ctx.all.forEach(function(w){var f=gimFresh(ctx.S,w);if(f>=85){d+=0.4;up=up||w;}else if(f<=35){d-=0.7;down=down||w;}});
  d=clamp(d,-1.5,1);return d?{d:d,x:d>0?up.name+'’s act is at its freshest':down.name+'’s gimmick has gone stale'}:null;
});

/* booking makes friends and enemies: pairs build a score from what happens between them in the ring. It feeds chemistry, relations and backstage disputes */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||!ctx.isPl)return;var B=S.bond||(S.bond={}),r=ctx.res,all=ctx.all;
  function add(a,b,d){var k=rkey(a.id,b.id);B[k]=clamp((B[k]||0)+d,-8,8);}
  for(var i=0;i<all.length;i++)for(var j=i+1;j<all.length;j++){
    var a=all[i],b=all[j],same=ctx.sides.some(function(s){return s.indexOf(a)>=0&&s.indexOf(b)>=0;});
    if(same)add(a,b,0.4);                                   // partners who travel together grow close
    else if(r.OV>=85)add(a,b,0.7);                          // made each other look good
    else if(r.OV>=65)add(a,b,0.15);
    else if(r.OV<50)add(a,b,-0.5);
    if(!same&&r.win>=0){                  // a winner called again and again over the same person is a grudge
      var ka=rkey(a.id,b.id),last=(S.bondLast||(S.bondLast={}))[ka],w=r.winners[0]&&r.winners[0].id;
      if(last===w&&w!=null){add(a,b,-0.7);if(B[ka]<=-3&&!S.bondNote)S.bondNote=1;}S.bondLast[ka]=w;
    }
  }
});
WEEKX.push(function(S){if(S.bond)Object.keys(S.bond).forEach(function(k){S.bond[k]*=0.985;if(Math.abs(S.bond[k])<0.05)delete S.bond[k];});});
E.bond=function(S,a,b){return S.bond?S.bond[rkey(a,b)]||0:0;};
E.bondWord=function(S,a,b){var v=E.bond(S,a,b);return v>=6?'inseparable':(v>=3?'close':(v<=-6?'bitter enemies':(v<=-3?'at odds':'neutral')));};

/* the last year: a veteran can announce a final year. The farewell tour lifts gates, and the last match gives one rising star the honour of the final win */
EVR.finalyear=function(S,ev,choice,P,w){
  if(choice===0){w.retiring=S.week+48;w.fw=true;w.morale=clamp(w.morale+10,0,100);news(S,'story',w.name+' has announced a final year. The farewell tour starts now.');return w.name+' will wrestle for one more year, and every crowd will know it. Expect fuller buildings when they are on the card, and a last match to decide.';}
  w.morale=clamp(w.morale+2,0,100);return w.name+' will retire after '+cal(w.retiring).label+'. A short goodbye, then.';
};
EVR.lastwin=function(S,ev,choice,P,w){
  var id=ev.c[choice],h=S.w[id];if(!h)return 'The last match goes ahead without a ceremony.';
  addOvr(P,h,3);h.mom=clamp(h.mom+5,-10,10);h.morale=clamp(h.morale+10,0,100);w.morale=clamp(w.morale+5,0,100);mile(S,h,'honour','Got the final win over '+w.name+' in their last match');
  news(S,'story',h.name+' got the final win over '+w.name+' in their last match. The crowd gave '+w.name+' a standing ovation.');
  return h.name+' pins '+w.name+' in the last match of a long career. The building stands for both of them.';
};
PREX.push(function(S,P,show,card){if(S.cal)return;if(card.some(function(m){return [].concat.apply([],m.sides).some(function(id){var w=S.w[id];return w&&w.fw&&w.retiring>S.week;});}))S.hype=(S.hype||0)+0.04;});
CRX.push(function(ctx){var f=ctx.all.filter(function(w){return w.fw&&w.retiring>ctx.S.week;})[0];return f?{d:1.4,x:'Everyone came to say goodbye to '+f.name}:null;});

/* the crowd has a night: one pool of energy across the show. Hot matches back to back tire it, a talking segment lets it breathe */
CRX.push(function(ctx){
  var rep=ctx.rep;if(!rep)return null;var en=rep.en==null?100:rep.en;
  if(en>=88)return null;
  var d=clamp((en-72)/28,-1.4,0.6);if(Math.abs(d)<0.3)return null;
  return {d:d,x:d>0?'The crowd is fresh and ready':(en<40?'The crowd is spent after what it has already seen':'The crowd is starting to tire')};
});
POST.push(function(ctx){
  var rep=ctx.rep;if(!rep)return;var en=rep.en==null?100:rep.en,cr=ctx.res.CR;
  rep.en=clamp(en-(12+(cr-50)*0.35)+6,0,100);
});
/* for the booking screen: a text line of the crowd's energy across a card, from the names on it */
E.energyLine=function(S,card){
  var en=100,out=[];
  card.forEach(function(m){
    var ids=[].concat.apply([],m.sides).filter(function(id){return id!=null&&S.w[id];}),o=ids.length?avg(ids.map(function(id){return S.w[id].ovr;})):50,cr=clamp(35+o*0.6,20,95);
    out.push(Math.round(en));en=clamp(en-(12+(cr-50)*0.35)+6,0,100);
  });
  out.push(Math.round(en));
  var low=out.some(function(v,i){return i>=2&&v<45;});
  return {steps:out,text:'Crowd energy: '+out.join(' → '),warn:low?'The crowd will be spent before the end. Put a talking segment or an easy match in the middle.':null};
};

/* ---------- 14. Agent notes: one instruction per match (m.note) ---------- */
var NOTES={
  long:{n:'Go long',d:'Adds five minutes. Workers with stamina can use the time. Everyone tires, and a hurt is a little likelier.'},
  short:{n:'Keep it short',d:'Cuts four minutes. Less wear and less risk, and less time to tell a story.'},
  protect:{n:'Protect the loser',d:'The loser keeps their standing and their mood. The match plays flatter.'},
  crowd:{n:'Work the crowd',d:'Play to the seats. The crowd gets louder if they have the charisma. The match itself is rougher.'},
  steal:{n:'Steal the show',d:'Go for the match of the night. Skilled workers can do it. A hurt is half again as likely, and it flops if they lack the skill.'},
  safe:{n:'Work safe',d:'A hurt is almost half as likely. The match is a little flatter.'}
};
function noteMins(m){return m&&m.note==='long'?5:(m&&m.note==='short'?-4:0);}
function noteSkill(ctx){return avg(ctx.all.map(function(w){return workOf(w,ctx.stip,ctx.mins);}));}
MQX.push(function(ctx){
  var k=ctx.m.note;if(!k||!NOTES[k])return null;
  if(k==='long'){var st=avg(ctx.all.map(function(w){return w.stam;}));return st>=55?{d:1,x:'Given room to build, and they had the stamina for it'}:{d:-1.5,x:'Told to go long without the stamina for it'};}
  if(k==='short')return {d:-0.5,x:null};
  if(k==='protect')return {d:-1.5,x:'The loser was held back to protect them'};
  if(k==='crowd')return {d:-1,x:null};
  if(k==='safe')return {d:-1.2,x:null};
  if(k==='steal'){var sk=noteSkill(ctx);return sk>=72?{d:3.5,x:'They stole the show'}:(sk<=58?{d:-3.5,x:'They tried to steal the show and could not'}:null);}
  return null;
});
CRX.push(function(ctx){
  if(ctx.m.note!=='crowd')return null;
  var ch=avg(ctx.all.map(function(w){return w.cha;}));
  return ch>=62?{d:2.5,x:'They worked the crowd and the crowd answered'}:(ch<=48?{d:-2,x:'They worked the crowd and the crowd shrugged'}:{d:1,x:null});
});
POST.push(function(ctx){
  var m=ctx.m,r=ctx.res;if(m.note!=='protect'||ctx.S.cal||r.win<0)return;
  // give back what the loss cost them
  r.losers.forEach(function(w){var F=FIN[r.fin]||FIN.clean;addOvr(ctx.P,w,0.4*clamp(1+(w.ovr-avg(r.winners.map(function(x){return x.ovr;})))/35,0.2,2.5)*F.lg*(ctx.big?1.3:1)*0.7);w.mom=clamp(w.mom+1,-10,10);w.morale=clamp(w.morale+1.5,0,100);});
  if(ctx.isPl)r.seg.notes.push(names(r.losers)+(r.losers.length>1?' were':' was')+' protected in defeat.');
});
E.NOTES=NOTES;
E.noteLabel=function(k){return NOTES[k]?NOTES[k].n:'No note';};
E.setNote=function(S,i,k){var m=S.card&&S.card[i];if(!m)return false;if(!k||!NOTES[k]){delete m.note;return true;}m.note=k;return true;};
/* the booker's read of a note for this match, for the editor's help line */
E.noteHint=function(S,m,k){
  if(!NOTES[k])return '';
  var ids=[].concat.apply([],m.sides).filter(function(id){return id!=null&&S.w[id];}).map(function(id){return S.w[id];});
  if(!ids.length)return NOTES[k].d;
  var st=avg(ids.map(function(w){return w.stam;})),ch=avg(ids.map(function(w){return w.cha;})),sk=avg(ids.map(function(w){return workOf(w,m.stip||'std',12);}));
  if(k==='long')return st>=55?'They have the stamina for it.':'They will tire. Better to keep it short.';
  if(k==='crowd')return ch>=62?'They have the charisma to carry it.':(ch<=48?'The crowd will not follow them.':'It should help a little.');
  if(k==='steal')return sk>=72?'They are good enough to try.':(sk<=58?'They are not good enough. It would flop.':'It could go either way.');
  return NOTES[k].d;
};
