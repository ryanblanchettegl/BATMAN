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
  if(ms.some(function(s){return starQ(s.ov)>=18;}))msAward(S,'MS_TOPMATCH');
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

/* booking makes friends and enemies: that now lives in the relationship matrix (src/66-relations.js) */

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

/* ---------- 15. Finishes have a price (m.how: the finish the booker picks) ---------- */
var HOWS={
  clean:{n:'Clean win',price:'The winner gains in full. The loser pays most, and a third clean loss in a row buries them.'},
  flash:{n:'Roll-up',price:'A small win for the winner. The loser is protected. The feud heats up: they will want a rematch.'},
  cheap:{n:'Cheap win',price:'The feud gets hot and the loser gets sympathy. A hero who wins this way confuses the crowd.'},
  dq:{n:'Disqualification',price:'Both are protected and the feud keeps its heat. The crowd is annoyed, most of all in a main event.'},
  co:{n:'Count-out',price:'Both are protected, the feud cools and the crowd is annoyed.'}
};
var UNCLEAN={cheap:1,interf:1,dq:1,co:1,draw:1};
function howOf(S,m,isPl){
  var k=m&&m.how;if(!isPl||!k||!HOWS[k]||m.mt==='br')return null;
  if((k==='cheap'||k==='dq'||k==='co')&&hasRule(S,'clean'))return null;
  return k;
}
function sourMood(S){
  var n=0,u=0;(S.fh||[]).forEach(function(e){if(S.week-e.w<4){n++;if(e.u)u++;}});
  var sh=n?u/n:0;return {n:n,u:u,share:sh,pen:n>=12?clamp((sh-0.5)*14,0,4):0};
}
CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var o=sourMood(ctx.S);
  return o.pen>=0.5?{d:-o.pen,x:'The crowd is tired of matches that end without a clean winner'}:null;
});
FINX.push(function(ctx,fin,winners){
  if(fin==='cheap'&&winners[0]&&winners[0].align==='F'&&ctx.isPl)return {d:-2.5,x:'A hero won with a cheap shot and the crowd did not like it'};
  return null;
});
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P;if(S.cal||!ctx.isPl)return;
  var fh=S.fh||(S.fh=[]);fh.push({w:S.week,u:UNCLEAN[r.fin]?1:0});S.fh=fh.filter(function(e){return S.week-e.w<8;});
  if(ctx.m.mt==='br')return;
  var f=ctx.feud;
  if(f){
    if(r.fin==='flash')heatUp(S,f,2);
    else if(r.fin==='co')heatUp(S,f,-7);
    else if(r.fin==='draw')heatUp(S,f,-2);
  }
  if(r.win>=0){
    if(r.fin==='clean')r.losers.forEach(function(l){
      if(l.ws<=-3){l.morale=clamp(l.morale-2,0,100);l.mom=clamp(l.mom-1,-10,10);if(r.losers.indexOf(l)===0)r.seg.notes.push(l.name+' has lost clean '+(-l.ws)+' times running. The fans have stopped believing.');}
    });
    if(r.fin==='cheap'){
      r.losers.forEach(function(l){if(l.align==='F')l.mom=clamp(l.mom+1,-10,10);});
      r.winners.forEach(function(w){w.mom=clamp(w.mom+(w.align==='H'?0.5:-1),-10,10);});
    }
  }
  var o=sourMood(S);
  if(o.pen>=0.5&&!S.fsour){S.fsour=1;r.seg.notes.push('The crowd is tired of cheap finishes. Give them a clean one.');news(S,'story','Fans of '+P.name+' are grumbling about shows that end without a winner.');}
  else if(o.pen<0.2&&S.fsour)S.fsour=0;
});
E.HOWS=HOWS;
E.finishPrice=function(k){return HOWS[k]?HOWS[k].price:'The story decides how it ends.';};
/* for the desk and the booking screen: how many finishes in the last four weeks were not clean */
E.finishMood=function(S){
  var o=sourMood(S);
  return {n:o.n,u:o.u,share:o.share,sour:o.pen>=0.5,text:o.n<4?null:'Unclean finishes in the last four weeks: '+o.u+' of '+o.n+(o.pen>=0.5?'. The crowd is losing patience.':'.')};
};
E.hasRule=hasRule;

/* ---------- 16. A library of match types: tables, lumberjack, mask against mask, hair against hair ---------- */
/* masks: about one in seven wrestlers works in one. w.mk is 1 (masked), 0 (lost it) or missing (decided by name) */
function masked(w){if(!w)return 0;if(w.mk!=null)return w.mk;return h01('mask'+w.id+w.name)<0.14?1:0;}
var STIPFIT={
  purist:{tables:[-3,'Tables are not what this crowd pays for'],lumber:[-1.5,'A lumberjack match is a circus to this crowd'],hair:[-1.5,'A haircut is a gimmick, and this crowd does not pay for gimmicks']},
  corporate:{tables:[-2,'The sponsors winced at the tables'],mask:[-1,'Masks do not sell to this audience'],hair:[-1,'A haircut on television was a step too far']},
  workrate:{tables:[-2,'Spots instead of wrestling, and this crowd noticed'],lumber:[-1,'Lumberjacks got in the way of the wrestling'],mask:[1.5,'A mask match decided by skill: the crowd approved'],hair:[-1,'The wager mattered more than the wrestling']},
  outlaw:{tables:[3,'This crowd wanted to see someone go through a table'],lumber:[1.5,'A ring of lumberjacks suits this crowd'],hair:[1,'A wager like that suits this crowd']},
  spectacle:{tables:[2,'Tables make a spectacle, and this crowd loves one'],lumber:[1.5,'The lumberjacks made it a show'],mask:[3,'A mask on the line: this crowd came for exactly this'],hair:[2,'Hair on the line is a big night here']},
  tradition:{tables:[-2,'Tables are not how this crowd likes it done'],lumber:[1,'An old-fashioned lumberjack match'],mask:[2,'An old wager, and this crowd respects it'],hair:[2,'An old wager, and this crowd respects it']},
  joshi:{tables:[-1,'Tables are not what this crowd came for'],mask:[1,null],hair:[3,'A hair match is a big night in this tradition']},
  underdog:{tables:[1,null],lumber:[1,null],mask:[1,null],hair:[1,null]},
  startup:{tables:[1.5,'A table keeps the new crowd awake'],lumber:[0.5,null]},
  classic:{mask:[1,null],hair:[1,null]}
};
CRX.push(function(ctx){
  var k=ctx.stip,d=0,f;if(!STIP[k]||(k!=='tables'&&k!=='lumber'&&k!=='mask'&&k!=='hair'))return null;
  var fit=(STIPFIT[ctx.P.model]||{})[k];
  if(fit){d+=fit[0];if(fit[1]&&Math.abs(fit[0])>=1)ctx.fx.push({s:fit[0]>=0?1:-1,x:fit[1],m:1});}
  if((k==='mask'||k==='hair')&&!(ctx.feud&&ctx.feud.heat>=40)){d-=3;ctx.fx.push({s:-1,x:'Nothing in the story to wager a '+(k==='mask'?'mask':'head of hair')+' on'});}
  if(k==='tables'&&ctx.P.risk===0){d-=2.5;ctx.fx.push({s:-1,x:'Tables are too rough for a family show'});}
  if(k==='lumber'&&!ctx.S.cal){
    var idle=rosterOf(ctx.S,ctx.P.id).filter(function(w){return w.inj<=0&&!w.nw&&ctx.all.indexOf(w)<0;}).length;
    if(idle>=10){d+=1.5;ctx.fx.push({s:1,x:'Plenty of lumberjacks at ringside'});}else if(idle<6){d-=3;ctx.fx.push({s:-1,x:'Too few lumberjacks to fill the ringside'});}
  }
  return d?{d:d,x:null}:null;
});
/* the wager is paid when the bell rings */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,k=ctx.stip;if(S.cal||r.win<0||(k!=='mask'&&k!=='hair'))return;
  r.losers.forEach(function(w){
    if(k==='mask'){w.mk=0;w.mom=clamp(w.mom-3,-10,10);w.morale=clamp(w.morale-8,0,100);addOvr(ctx.P,w,-0.6);}
    else{w.sh=S.week;w.mom=clamp(w.mom-2,-10,10);w.morale=clamp(w.morale-6,0,100);}
  });
  r.winners.forEach(function(w){w.mom=clamp(w.mom+3,-10,10);addOvr(ctx.P,w,1);w.morale=clamp(w.morale+4,0,100);});
  var txt=names(r.losers)+(k==='mask'?' lost the mask to ':' lost their hair to ')+names(r.winners)+' at '+ctx.show.name+'.';
  news(S,'story',txt);
  if(ctx.isPl)r.seg.notes.push(k==='mask'?names(r.losers)+(r.losers.length>1?' are':' is')+' unmasked for good.':names(r.losers)+(r.losers.length>1?' have':' has')+' lost '+(r.losers.length>1?'their':'their')+' hair.');
});
E.masked=masked;
E.STIPNOTE={
  hardcore:'Rewards brawlers. Heavy wear and hurts. Not for family shows.',
  ladder:'Rewards high flyers. The biggest risk of a hurt.',
  cage:'Rewards brawlers. Good for ending a feud.',
  sub:'Rewards technicians.',
  iron:'Thirty minutes. Only the fittest should try it.',
  tables:'Rewards brawlers. A heavy risk of a hurt. Purist and family crowds hate it.',
  lumber:'Needs ten healthy wrestlers waiting at ringside to feel big.',
  mask:'Everyone in it must wear a mask. Needs a hot feud. The loser is unmasked for good.',
  hair:'Needs a hot feud. The loser is shaved and cannot wager again for 20 weeks.'
};

/* ---------- 21. Teams grow together: a team finisher once they have 60 experience (tm.fin) ---------- */
var TFIN=['the Pincer','the Last Orders','the Double Drop','the Closing Time','the Tight Squeeze','the Hammer and Anvil','the Final Notice','the Crossroads','the Twin Bells','the Short Fuse','the Slingshot Special','the Open Door','the Second Opinion','the Long Goodbye','the Rush Hour','the Sandwich'];
function teamSides(S,ctx){
  if(ctx.m.mt!=='tag')return [];
  return ctx.sides.map(function(s){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;return tm&&tm.fin?tm:null;});
}
function teamFin(S,winners){if(winners.length!==2||winners[0].team==null||winners[0].team!==winners[1].team)return null;var tm=teamOf(S,winners[0]);return tm&&tm.fin?tm.fin:null;}
MQX.push(function(ctx){
  var n=teamSides(ctx.S,ctx).filter(function(t){return t;}).length;
  return n?{d:Math.min(1.6,0.8*n),x:'A team finisher the crowd knows'}:null;
});
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||ctx.m.mt!=='tag')return;
  ctx.sides.forEach(function(s){
    var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;
    if(!tm||tm.fin||tm.exp<60)return;
    tm.fin=TFIN[hash('tfin'+tm.id+s[0].name)%TFIN.length];
    if(tm.promo===S.player){
      news(S,'story',s[0].name+' and '+s[1].name+' now have a team finisher: '+tm.fin+'.');
      if(ctx.isPl)ctx.res.seg.notes.push(s[0].name+' and '+s[1].name+' have worked together long enough to have a finisher of their own: '+tm.fin+'.');
    }
  });
});
E.teamFinisher=function(S,t){return t&&t.fin?t.fin:null;};
WEEKX.push(function(S){
  S.teams.forEach(function(tm){
    if(tm.fin||tm.exp<60||!S.w[tm.m[0]]||!S.w[tm.m[1]])return;
    tm.fin=TFIN[hash('tfin'+tm.id+S.w[tm.m[0]].name)%TFIN.length];
    if(tm.promo===S.player)news(S,'story',S.w[tm.m[0]].name+' and '+S.w[tm.m[1]].name+' now have a team finisher: '+tm.fin+'.');
  });
});

/* ---------- 24. Styles clash and blend: a grid of style against style (added to ring chemistry) ---------- */
var SGRID={BB:1,BT:-1.5,BH:-0.5,BP:0.5,BA:0,BS:1.5,BE:-0.5,TT:1.5,TH:1.5,TP:0.5,TA:1,TS:-0.5,TE:-1,HH:1,HP:2,HA:0.5,HS:-1,HE:0.5,PP:-2,PA:0,PS:0.5,PE:-0.5,AA:0.5,AS:0.5,AE:0.5,SS:1.5,SE:-1.5,EE:-0.5};
function styleKey(x,y){return x<=y?x+y:y+x;}
function styleBlend(a,b){if(!a||!b)return 0;var k=styleKey('BTHPASE'.indexOf(a.style)<=-1?'A':a.style,'BTHPASE'.indexOf(b.style)<=-1?'A':b.style);return SGRID[k]||0;}
/* every match remembers which style met which; the booker only learns what a pair is like by seeing it twice */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||!ctx.isPl||ctx.m.mt==='br')return;
  var seen=S.sty||(S.sty={}),done={};
  for(var x=0;x<ctx.sides.length;x++)for(var y=x+1;y<ctx.sides.length;y++)ctx.sides[x].forEach(function(p){ctx.sides[y].forEach(function(o){
    var k=styleKey(p.style,o.style);if(done[k])return;done[k]=1;seen[k]=(seen[k]||0)+1;
    if(seen[k]===2&&Math.abs(SGRID[k]||0)>=1.5)ctx.res.seg.notes.push('The booker has seen it twice now: '+E.STYLE_NAME[p.style].toLowerCase()+' against '+E.STYLE_NAME[o.style].toLowerCase()+' '+((SGRID[k]||0)>0?'works well.':'does not mesh.'));
  });});
});
E.styleBlend=styleBlend;
E.STYLE_GRID=SGRID;
/* what the booker has learned about this wrestler's style: which others it works well and badly with */
E.styleLessons=function(S,w){
  var seen=S.sty||{},good=[],bad=[];
  Object.keys(E.STYLE_NAME).forEach(function(o){
    var k=styleKey(w.style,o),g=SGRID[k]||0;if((seen[k]||0)<2)return;
    if(g>=1.5)good.push(E.STYLE_NAME[o]);else if(g<=-1.5)bad.push(E.STYLE_NAME[o]);
  });
  return {good:good,bad:bad};
};

/* ---------- 26. The long plan: pencil in the flagship main event months ahead (S.lp) ---------- */
function flagshipWeek(S){var P=S.promos[S.player];for(var w=S.week;w<S.week+60;w++){var c=cal(w);if(c.wom===4&&c.month===P.flagship)return w;}return null;}
function lpFeud(S,lp){var f=feudOf(S,lp.a,lp.b);return f&&!f.res?f:null;}
E.longPlan=function(S){
  var lp=S.lp;if(!lp)return null;
  var a=S.w[lp.a],b=S.w[lp.b],toGo=Math.max(0,lp.wk-S.week),made=S.week-lp.made;
  var early=lp.wk-lp.made>=12;
  return {a:a,b:b,title:lp.title,wk:lp.wk,toGo:toGo,made:made,built:lp.built,early:early,
    when:cal(lp.wk).label,bonus:Math.round(Math.min(9,lp.built*0.5+(early?2:(lp.wk-lp.made>=8?1:0)))*10)/10,
    state:lp.built>=10?'Everyone is talking about it.':(lp.built>=5?'The build is working.':(lp.built>=2?'The story is getting going.':'Nothing has been built yet. Put them in a feud.'))};
};
/* the flagship week, for the screen's heading */
E.flagshipWeek=flagshipWeek;
E.setLongPlan=function(S,a,b,title){
  var P=S.promos[S.player],A=S.w[a],B=S.w[b],wk=flagshipWeek(S);
  if(!wk)return {ok:false,text:'There is no flagship show in sight.'};
  if(!A||!B||A===B||A.promo!==P.id||B.promo!==P.id)return {ok:false,text:'Pick two different wrestlers from your roster.'};
  var cost='',old=S.lp;
  if(old&&(old.a!==a||old.b!==b)){
    if(old.wk-S.week<=4){
      [S.w[old.a],S.w[old.b]].forEach(function(w){if(w)w.morale=clamp(w.morale-4,0,100);});S.trust=clamp(S.trust-2,0,100);
      cost=' Changing the plan this late cost some trust, and '+(S.w[old.a]?S.w[old.a].name:'one')+' and '+(S.w[old.b]?S.w[old.b].name:'one')+' are not happy.';
    }
  }
  var keep=old&&old.a===a&&old.b===b;
  S.lp={a:a,b:b,title:title||null,made:keep?old.made:S.week,wk:wk,built:keep?old.built:0};
  return {ok:true,text:A.name+' against '+B.name+' is pencilled in for '+cal(wk).label+'.'+cost};
};
E.clearLongPlan=function(S){
  var old=S.lp;if(!old)return {ok:true,text:'There was no plan.'};
  var cost='';
  if(old.wk-S.week<=4){[S.w[old.a],S.w[old.b]].forEach(function(w){if(w)w.morale=clamp(w.morale-4,0,100);});S.trust=clamp(S.trust-2,0,100);cost=' Scrapping it this late cost some trust.';}
  S.lp=null;return {ok:true,text:'The plan is scrapped.'+cost};
};
WEEKX.push(function(S){
  var lp=S.lp;if(!lp||S.cal)return;
  var a=S.w[lp.a],b=S.w[lp.b],P=S.promos[S.player];
  if(!a||!b||a.promo!==P.id||b.promo!==P.id){news(S,'story','The plan for the flagship main event fell apart: one of the two has left.');S.lp=null;return;}
  if(S.week>=lp.wk){
    if(!lp.done)news(S,'story','The flagship passed without the planned main event.');
    S.lp=null;return;
  }
  if(a.inj>lp.wk-S.week||b.inj>lp.wk-S.week){news(S,'story','The plan for the flagship main event is in doubt: '+(a.inj>lp.wk-S.week?a.name:b.name)+' will not be fit in time.');}
  var f=lpFeud(S,lp),n=0;
  if(f)n+=1+(f.heat>=50?1:0)+(f.heat>=75?1:0);else n+=(a.lu===S.week?0.3:0)+(b.lu===S.week?0.3:0);
  lp.built=Math.round((lp.built+n)*10)/10;
});
CRX.push(function(ctx){
  var S=ctx.S,lp=S.lp;if(!lp||!ctx.isPl||!ctx.show.big||!ctx.show.flag||!ctx.isMain)return null;
  var sd=ctx.m.sides,ia=-1,ib=-1;sd.forEach(function(s,k){if(s.indexOf(lp.a)>=0)ia=k;if(s.indexOf(lp.b)>=0)ib=k;});
  if(ia<0||ib<0||ia===ib)return null;
  var pl=E.longPlan(S);if(!pl.bonus)return null;
  return {d:pl.bonus,x:pl.early?'The main event they have been building to for months':'A main event that was planned ahead'};
});
POST.push(function(ctx){
  var S=ctx.S,lp=S.lp;if(!lp||!ctx.isPl||S.cal||!ctx.show.big||!ctx.show.flag||!ctx.isMain)return;
  var ia=-1,ib=-1;ctx.m.sides.forEach(function(s,k){if(s.indexOf(lp.a)>=0)ia=k;if(s.indexOf(lp.b)>=0)ib=k;});
  if(ia<0||ib<0||ia===ib)return;
  lp.done=true;var pl=E.longPlan(S);
  [S.w[lp.a],S.w[lp.b]].forEach(function(w){w.morale=clamp(w.morale+5,0,100);w.mom=clamp(w.mom+1,-10,10);});
  ctx.res.seg.notes.push('The plan paid off: the flagship main event that was pencilled in '+pl.made+' weeks ago was worth the wait.'+(pl.bonus>=3?' The crowd knew what it was there for.':''));
  news(S,'story','The long plan paid off at '+ctx.show.name+': '+S.w[lp.a].name+' against '+S.w[lp.b].name+'.');
  S.stats.plans=(S.stats.plans||0)+1;
});

/* ---------- 29. Titles have prestige: a short log of why it moves (t.pw), rises and falls ---------- */
function presMove(S,t,d,why){
  t.prestige=clamp(t.prestige+d,10,100);var L=t.pw||(t.pw=[]);
  if(L.length&&L[0].x===why&&L[0].w===S.week){L[0].d=Math.round((L[0].d+d)*10)/10;return;}
  L.unshift({w:S.week,d:Math.round(d*10)/10,x:why});if(L.length>6)L.length=6;
}
CRX.push(function(ctx){if(ctx.t){ctx.since0=ctx.t.since;ctx.defs0=ctx.t.defs;}return null;});
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P,t=ctx.t;if(S.cal||ctx.m.mt==='br')return;
  if(t){
    if(r.seg.change&&!r.seg.crown){
      var len=S.week-(ctx.since0||0);
      if(len<4)presMove(S,t,-5,'It changed hands after only '+Math.max(1,len)+' '+(len<=1?'week':'weeks'));
      else if(len>=26&&(ctx.defs0|0)>=4)presMove(S,t,2,'A long, credible reign came to a proper end');
    }else if(r.win===ctx.champSide&&ctx.champSide>=0){
      if(r.OV>=80&&(r.fin==='clean'||r.fin==='foiled'))presMove(S,t,1,'A strong defence');
      else if(r.OV<50)presMove(S,t,-1,'A poor defence');
    }
  }
  if(r.win>=0&&r.fin!=='dq'&&r.fin!=='co')r.losers.forEach(function(w){
    P.titles.forEach(function(x){
      if(x===t||x.holders.indexOf(w.id)<0)return;
      presMove(S,x,-1.2,w.name+' lost a non-title match');
    });
  });
});
WEEKX.push(function(S){
  if(S.cal)return;
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){
    if(t.holders.length){
      if(S.week-(t.last|0)>=10)presMove(S,t,-0.4,'Nobody has seen the title defended in weeks');
      else if(S.week-t.since>=13&&t.defs>=3&&t.prestige<85)presMove(S,t,0.3,'A reign with real defences');
    }else if(S.week-t.since>=6)presMove(S,t,-0.5,'The title has been vacant for weeks');
  });});
});
E.prestigeWhy=function(t){return (t.pw||[]).slice(0,3);};

/* ---------- 30. Contender ladders: jumping the queue costs most in the purist and tradition models ---------- */
CRX.push(function(ctx){
  var t=ctx.t;if(!t||t.tag||ctx.champSide<0||ctx.m.mt!=='1v1'||ctx.S.cal)return null;
  var m=ctx.P.model;if(m!=='purist'&&m!=='tradition')return null;
  var ch=ctx.sides[ctx.champSide===0?1:0][0];if(ch.shot===t.id)return null;
  var rk=rankFor(ctx.S,ctx.P,t,5).map(function(w){return w.id;});
  return rk.indexOf(ch.id)<0?{d:-3,x:m==='purist'?'The purists want a title shot earned in the ring':'Tradition says you wait your turn for a title shot'}:null;
});

/* ---------- 31. Brackets and leagues: a bracket drawn in text, and upsets that turn into stories ---------- */
/* the knockout as lines of text: three columns, names cut to twelve letters, with the winners carried across */
E.bracketLines=function(S,T){
  if(!T||T.fmt!=='ko')return [];
  var W=12,rows=[],R1=T.br&&T.br[1]?T.br[1]:koPairs(T.ents),names=function(id){return id==null?'':S.w[id].name.slice(0,W);};
  // who goes where in every round: from what has been played
  var rounds=[[]];R1.forEach(function(p){rounds[0].push(p[0],p[1]);});
  function winnerOf(r,a,b){var x=T.res.filter(function(q){return q.round===r&&((q.a===a&&q.b===b)||(q.a===b&&q.b===a));})[0];return x&&x.w>=0?x.w:null;}
  for(var r=1;r<=3;r++){
    var prev=rounds[r-1],nxt=[];
    for(var i=0;i<prev.length;i+=2)nxt.push(prev[i]==null||prev[i+1]==null?null:winnerOf(r,prev[i],prev[i+1]));
    rounds.push(nxt);
  }
  var H=15,grid=[];for(var y=0;y<H;y++)grid.push(new Array(58).join(' ').split(''));
  function put(y,x,str){for(var k=0;k<str.length;k++)grid[y][x+k]=str[k];}
  var rowOf=function(r,i){return r===0?2*i:(r===1?4*i+1:(r===2?8*i+3:7));};
  for(var rr=0;rr<=3;rr++){
    var x=rr*15;
    rounds[rr].forEach(function(id,i){
      var y=rowOf(rr,i);put(y,x,(id==null?'':names(id)).padEnd(W,' '));
      if(rr<3){grid[y][x+W]='─';}
      if(rr<3){var cx=x+W+1;grid[y][cx]=i%2===0?'┐':'┘';if(i%2===0){var yb=rowOf(rr,i+1);for(var q=y+1;q<yb;q++)grid[q][cx]='│';grid[(y+yb)/2][cx]='├';grid[(y+yb)/2][cx+1]='─';}}
    });
  }
  grid.forEach(function(g){rows.push(g.join('').replace(/\s+$/,''));});
  return rows;
};
POST.push(function(ctx){
  var S=ctx.S,T=S.tourn,r=ctx.res;if(!T||!ctx.isPl||ctx.m.mt!=='1v1'||r.win<0||S.cal)return;
  var last=T.res[T.res.length-1];if(!last||last.week!==S.week||last.bye)return;
  var a=ctx.all[0].id,b=ctx.all[1].id;if(!((last.a===a&&last.b===b)||(last.a===b&&last.b===a)))return;
  var w=r.winners[0],l=r.losers[0],sw=T.ents.indexOf(w.id),sl=T.ents.indexOf(l.id);
  if(sw<0||sl<0||sw-sl<3||w.ovr>l.ovr-6)return;
  w.mom=clamp(w.mom+2,-10,10);
  news(S,'story','Upset in the '+T.name+': '+w.name+', the number '+(sw+1)+' seed, beat '+l.name+'.');
  r.seg.notes.push('An upset in the '+T.name+': '+w.name+' beat '+l.name+', who was seeded much higher.');
  if(S.promos[S.player].id===T.promo)startFeud(S,S.promos[T.promo],l,w,35,l.name+' wants to settle the score after the '+T.name+' upset',{force:true});
});

/* ---------- 32. Stable roles: leader, enforcer, mouthpiece, young gun, workhorse; unity (st.unity) ---------- */
var SROLE_N={leader:'Leader',enforcer:'Enforcer',mouth:'Mouthpiece',young:'Young gun',horse:'Workhorse'};
var SROLE_D={enforcer:'Brings the muscle. Needs real fighting skill.',mouth:'Does the talking. Needs a good voice.',young:'The future of the group. Young with room to grow.',horse:'Carries the match. Needs stamina and technique.'};
function srFit(role,w){
  if(role==='enforcer')return Math.max(w.brawl,w.hc==null?w.brawl:w.hc)-(w.style==='P'||w.style==='B'?0:8);
  if(role==='mouth')return w.mic;
  if(role==='young')return w.age<=27&&w.pot>=62?w.pot+(27-w.age)*2:0;
  if(role==='horse')return (w.stam+w.tech)/2;
  return 0;
}
/* hand out the roles: the leader first, then each role goes to the best fit among the rest; a member nobody needs has no role */
function stableRoles(S,st){
  var roles={},left=st.m.filter(function(id){return id!==st.leader&&S.w[id];});roles[st.leader]='leader';
  var order=['mouth','enforcer','young','horse'],need={mouth:60,enforcer:62,young:62,horse:60};
  order.forEach(function(r){
    var best=null,bs=0;left.forEach(function(id){var f=srFit(r,S.w[id]);if(f>bs){bs=f;best=id;}});
    if(best!=null&&bs>=need[r]){roles[best]=r;left=left.filter(function(id){return id!==best;});}
  });
  return roles;
}
E.stableRoles=function(S,st){
  var roles=stableRoles(S,st);
  return st.m.filter(function(id){return S.w[id];}).map(function(id){var r=roles[id]||null;return {w:S.w[id],role:r,name:r?SROLE_N[r]:'No role',note:r&&SROLE_D[r]||'Nobody needs what they do. Unless that changes, they will be the first out.'};});
};
E.stableUnity=function(S,st){return Math.round(st.unity==null?60:st.unity);};
E.stableWeak=function(S,st){
  var roles=stableRoles(S,st);
  return st.m.filter(function(id){var w=S.w[id];return w&&id!==st.leader&&(!roles[id]||(w.rr&&w.rr.length>=4&&w.rr.every(function(x){return x.r==='L';})));}).map(function(id){return S.w[id];});
};
WEEKX.push(function(S){
  (S.stables||[]).forEach(function(st){
    var roles=stableRoles(S,st),d=0,weak=[];
    st.m.forEach(function(id){
      var w=S.w[id];if(!w)return;
      var noWins=w.rr&&w.rr.length>=4&&w.rr.every(function(x){return x.r==='L';});
      if(id!==st.leader&&!roles[id]){d-=1.5;weak.push(w);}
      if(noWins){d-=1;if(weak.indexOf(w)<0)weak.push(w);}
    });
    if(!weak.length)d+=1.2;
    st.unity=clamp((st.unity==null?60:st.unity)+d,0,100);
    if(weak.length)st.tension=(st.tension||0)+0.3*weak.length;
    if(st.promo===S.player&&weak.length&&st.unity<40&&S.week%6===0)news(S,'story',st.name+' are coming apart: '+weak[0].name+' has no place in the group and no wins. Somebody is going to be thrown out.');
  });
});
/* a group that works as a unit lifts the matches its members are in */
CRX.push(function(ctx){
  if(!ctx.S.stables||ctx.S.cal)return null;var best=null;
  ctx.all.forEach(function(w){var st=stableOf(ctx.S,w);if(st&&(st.unity==null?60:st.unity)>=72&&stableWeak2(ctx.S,st)===0&&(!best||st.unity>best.unity))best=st;});
  return best?{d:1,x:best.name+' work as one unit and the crowd sees it'}:null;
});
function stableWeak2(S,st){return E.stableWeak(S,st).length;}

/* ---------- 35. The game remembers: betrayals, first meetings, droughts and history (S.mem) ---------- */
function memBetray(S,att,vic){var M=S.mem||(S.mem={bet:{}});M.bet[rkey(att.id,vic.id)]={att:att.id,vic:vic.id,w:S.week};
  relBump(S,vic.id,att.id,{bond:-60,ra:-40},{k:'betray',by:att.id,keep:true,t:att.name+' turned on '+vic.name+'.'});}
function memOf(S,a,b){
  var hh=S.h2h&&S.h2h[rkey(a.id,b.id)],bt=S.mem&&S.mem.bet&&S.mem.bet[rkey(a.id,b.id)];
  var n=hh?hh.n:0,wa=hh?(a.id<b.id?hh.a:hh.b):0,wb=hh?(a.id<b.id?hh.b:hh.a):0;
  return {n:n,wa:wa,wb:wb,last:hh?hh.w:null,bet:bt&&S.week-bt.w<104?bt:null,
    drought:n>=3&&(wa===0||wb===0)?(wa===0?a:b):null};
}
CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal||ctx.m.mt!=='1v1')return null;
  var a=ctx.all[0],b=ctx.all[1],o=memOf(ctx.S,a,b),d=0,x=null;
  if(o.bet){d+=2;x=S_name(ctx.S,o.bet.vic)+' has not forgotten what '+S_name(ctx.S,o.bet.att)+' did';}
  else if(o.n===0&&(a.ovr+b.ovr)/2>=60&&(ctx.i>=ctx.n-2||ctx.t)){d+=1.5;x='The first time these two have ever met';}
  else if(o.drought){d+=1.2;x=o.drought.name+' has never beaten '+(o.drought===a?b:a).name;}
  else if(o.n>=4&&ctx.S.week-(o.last|0)>=6){d+=0.8;x='These two have a history';}
  return d?{d:d,x:x}:null;
});
function S_name(S,id){return S.w[id]?S.w[id].name:'Someone';}
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(!ctx.isPl||S.cal||ctx.m.mt!=='1v1'||r.win<0)return;
  var a=ctx.all[0],b=ctx.all[1],o=memOf(S,a,b),w=r.winners[0],l=r.losers[0];
  // the h2h record was updated before this hook, so n counts the match just played
  if(o.n===1&&(a.ovr+b.ovr)/2>=60&&(ctx.i>=ctx.n-2||ctx.t))r.seg.notes.push('Their first meeting. '+w.name+' wins it.');
  // a drought ends: the winner had lost every earlier meeting
  var hw=S.h2h[rkey(a.id,b.id)],winsW=w.id===Math.min(a.id,b.id)?hw.a:hw.b;
  if(o.n>=4&&winsW===1){w.mom=clamp(w.mom+2,-10,10);addOvr(ctx.P,w,1);r.seg.notes.push(w.name+' has finally beaten '+l.name+', at the '+(o.n)+'th attempt.');news(S,'story',w.name+' finally beat '+l.name+' after '+(o.n-1)+' defeats.');}
});
/* what the booker knows about a pair, for the editor */
E.pairMemory=function(S,aId,bId){
  var a=S.w[aId],b=S.w[bId];if(!a||!b)return '';
  var o=memOf(S,a,b),L=[];
  if(o.n===0)L.push('They have never met.');
  else L.push('They have met '+o.n+' '+(o.n===1?'time':'times')+': '+a.name+' '+o.wa+', '+b.name+' '+o.wb+'.');
  if(o.drought)L.push(o.drought.name+' has never beaten '+(o.drought===a?b:a).name+'.');
  if(o.bet)L.push(S_name(S,o.bet.att)+' turned on '+S_name(S,o.bet.vic)+' in '+E.cal(o.bet.w).label+'.');
  return L.join(' ');
};
E.memBetray=memBetray;
