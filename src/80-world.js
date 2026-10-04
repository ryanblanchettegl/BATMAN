/* ---------- difficulty ---------- */
var DIFF={
  easy:{n:'Rookie',d:'A patient owner, extra booking power and a softer crowd.',bp:2,exp:-1.5,over:-0.03,inj:0.8,fire:-5,mor:3},
  normal:{n:'Veteran',d:'The game as designed.',bp:0,exp:0,over:0,inj:1,fire:0,mor:0},
  hard:{n:'Main eventer',d:'The crowd expects more, money is tighter and the owner has less patience.',bp:-1,exp:1.5,over:0.03,inj:1.15,fire:7,mor:-2},
  brutal:{n:'Legend',d:'Thin margins, a demanding crowd and an owner who fires fast.',bp:-2,exp:3,over:0.06,inj:1.3,fire:13,mor:-4}
};
/* difficulty by part: money, injuries, egos and rival aggression can each be set a step easier (0) or harder (2) than the chosen level (1) */
var DPART_N={money:'Money',inj:'Injuries',ego:'Egos',rival:'Rival aggression'};
function dif(S){
  var d=DIFF[S.diff]||DIFF.normal,p=S.dpart;if(!p)return d;
  return {n:d.n,d:d.d,bp:d.bp,exp:d.exp,fire:d.fire,over:d.over+(p.money-1)*0.03,inj:d.inj*[0.8,1,1.25][p.inj],mor:d.mor+(1-p.ego)*3};
}
E.DPART=DPART_N;
E.diffSummary=function(S){var p=S.dpart;if(!p)return null;var w=['easier','as set','harder'];return Object.keys(DPART_N).filter(function(k){return p[k]!==1;}).map(function(k){return DPART_N[k].toLowerCase()+' '+w[p[k]];}).join(', ')||null;};
NEWX.push(function(S){var P=S.promos[S.player],d=dif(S);P.expB=d.exp;P.fixed=Math.max(0,P.fixed+Math.round(P.inc0*d.over));});
WEEKX.push(function(S){if(S.week>=49&&(S.diff==='hard'||S.diff==='brutal'))award(S,'ACH_HARD');});
E.DIFF=DIFF;

/* ---------- create a federation ---------- */
var FED_SIZE={
  local:{n:'Local',d:'A few hundred fans in an armory. Tiny wages, tiny margins, everything to build.',image:20,cash:150000,wageMult:0.22,tvRate:300,prod:4000,net:300,roster:18,prodLvl:0,angles:1},
  regional:{n:'Regional',d:'A regional TV deal and a loyal territory.',image:32,cash:800000,wageMult:0.32,tvRate:700,prod:20000,net:1500,roster:24,prodLvl:1,angles:2},
  cult:{n:'Cult favourite',d:'A national following without the national money.',image:44,cash:3000000,wageMult:0.45,tvRate:1200,prod:60000,net:5000,roster:32,prodLvl:1,angles:2}
};
var FED_REGION={
  midwest:{n:'Midwest',c:['Minneapolis','Chicago','Milwaukee','Des Moines','Omaha','St. Louis','Kansas City','Indianapolis','Detroit','Cleveland']},
  south:{n:'South',c:['Atlanta','Nashville','Memphis','Charlotte','Birmingham','New Orleans','Dallas','Houston','Tampa','Louisville']},
  east:{n:'Northeast',c:['Philadelphia','Boston','Pittsburgh','Baltimore','Hartford','Providence','Albany','Buffalo','Newark','Allentown']},
  west:{n:'West',c:['Phoenix','Denver','Portland','Sacramento','Las Vegas','Salt Lake City','San Diego','Albuquerque','Spokane','Reno']}
};
function clean(s,n){return String(s==null?'':s).replace(/[<>&"|\n\r]/g,'').replace(/\s+/g,' ').trim().slice(0,n);}
function mkFedDef(f,bookerName){
  var z=FED_SIZE[f.size]||FED_SIZE.regional,rg=FED_REGION[f.region]||FED_REGION.midwest,MF=MODELS[f.model]||MODELS.classic,only=MF.gender||null,women=only==='F'||f.women!==false,g1=only||'M';
  var short=clean(f.short,6).toUpperCase()||'EWF',titles=[{id:'own_w',name:clean(f.title,28)||'World Title',g:g1,lvl:3,holders:[]},{id:'own_m',name:'Television Title',g:g1,lvl:2,holders:[]}];
  if(women&&!only)titles.push({id:'own_f',name:'Women’s Title',g:'F',lvl:3,holders:[]});
  titles.push({id:'own_t',name:'Tag Team Titles',g:g1,lvl:2,tag:true,holders:[]});
  return {id:'OWN',mine:true,name:short,full:clean(f.name,40)||'Elite Wrestling Federation',blurb:'Your own promotion.',cash:z.cash,image:z.image,wq:MF.wq||0.5,angles:z.angles,wageMult:z.wageMult,tvRate:z.tvRate,prod:z.prod,net:z.net,flagship:3,
    prodLvl:z.prodLvl,risk:clamp(1,MF.riskMin||0,MF.riskMax==null?3:MF.riskMax),slot:0,model:MODELS[f.model]&&f.model!=='classic'?f.model:null,announcers:['Dale Pruitt','Vic Marlowe'],cities:rg.c.slice(),staff:{agent:'Walt Dunleavy',writer:'June Castellan'},
    owner:{name:bookerName,style:STYLES[f.style]?f.style:'merit',roots:ROOTS[f.roots]?f.roots:'tradition',pledge:PLEDGE[f.pledge]?f.pledge:'chance'},
    shows:[{id:'own1',name:clean(f.show,28)||'Friday Night Fury',mult:1}],titles:titles,teams:[],draft:{n:z.roster,women:women,only:only}};
}
function draftRoster(S,P,d){
  var fa=S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw&&w.ovr<=P.image+12;}).sort(function(a,b){return b.ovr-a.ovr;});
  // a company drafts for its own system: the best fits first
  fa.sort(function(a,b){return fitFor(S,P,b)-fitFor(S,P,a);});
  var only=d.draft.only,nf=only==='F'?d.draft.n:(d.draft.women?Math.round(d.draft.n*0.3):0),nm=d.draft.n-nf,men=fa.filter(function(w){return w.g==='M';}).slice(0,nm),wom=fa.filter(function(w){return w.g==='F';}).slice(0,nf);
  men.concat(wom).forEach(function(w,i){w.promo=P.id;w.brand=null;w.align=i%2?'H':'F';});
  var tm=only==='F'?wom:men;
  for(var i=2;i+1<tm.length&&i<8;i+=2)formTeam(S,P,tm[i],tm[i+1],20);
}
E.FED_SIZE=FED_SIZE;E.FED_REGION=FED_REGION;

/* ---------- career records: the shared bones for a booking game and a career mode ----------
   Every wrestler carries a milestone log and a stat line per year, whoever books them. */
function mile(S,w,k,t){if(S.cal||!w)return;var L=w.log||(w.log=[]);L.push({w:S.week,k:k,t:t});if(L.length>24)L.splice(1,1);}
function ystat(S,w){var y=cal(S.week).year,Y=w.ys||(w.ys={});return Y[y]||(Y[y]=[0,0,0,0,0,0,0]);}   // matches, wins, losses, draws, best match, main events, titles won
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P;if(S.cal)return;
  ctx.all.forEach(function(w){var y=ystat(S,w);y[0]++;if(r.OV>y[4])y[4]=r.OV;if(ctx.isMain)y[5]++;if(r.win<0)y[3]++;});
  r.winners.forEach(function(w){ystat(S,w)[1]++;if(w.ws===10)mile(S,w,'streak','Reached ten wins in a row');});
  if(ctx.m.mt!=='br')r.losers.forEach(function(w){ystat(S,w)[2]++;});
  if(r.seg.change&&ctx.t)r.winners.forEach(function(w){ystat(S,w)[6]++;mile(S,w,'title','Won the '+P.name+' '+ctx.t.name+' at '+ctx.show.name);});
  if(ctx.isPl&&starQ(r.OV)>=20&&ctx.m.mt!=='br')ctx.all.forEach(function(w){mile(S,w,'match','A five-star match at '+ctx.show.name);});
});
E.career=function(S,id){
  var w=S.w[id];if(!w)return null;var Y=w.ys||{},reigns=[];
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){if((','+h.ids+',').indexOf(','+id+',')>=0)reigns.push({t:t.name,p:S.promos[pid].name,from:h.from,to:h.to,defs:h.defs});});});});
  return {log:(w.log||[]).slice().reverse(),years:Object.keys(Y).sort().reverse().map(function(y){var a=Y[y];return {y:+y,m:a[0],w:a[1],l:a[2],d:a[3],best:a[4],main:a[5],titles:a[6]};}),reigns:reigns.sort(function(a,b){return b.from-a.from;})};
};

/* ---------- create a wrestler ---------- */
var BGS={
  rookie:{n:'Green rookie',d:'Raw and cheap, with a high ceiling. Send them to camp.',ovr:-28,work:46,mic:45,pot:24},
  indie:{n:'Indie standout',d:'Can work today. The crowd does not know them yet.',ovr:-20,work:68,mic:55,pot:9},
  athlete:{n:'Crossover athlete',d:'A name from another sport. People will look, but the ring work is years away.',ovr:-8,work:40,mic:58,pot:26},
  veteran:{n:'Veteran hand',d:'Knows every trick and can talk. No room left to grow.',ovr:-14,work:76,mic:72,pot:0}
};
var EMPH={ring:'Ring work',mic:'Charisma',look:'Star presence'};
function createStats(S,o){
  var P=S.promos[S.player],bg=BGS[o.bg]||BGS.indie,ovr=clamp(Math.round(P.image+bg.ovr+(o.emph==='look'?5:0)),5,90),work=bg.work+(o.emph==='ring'?8:0),mic=bg.mic+(o.emph==='mic'?10:0),wage=wageFor(ovr,P);
  return {ovr:ovr,work:work,mic:mic,pot:Math.min(99,work+bg.pot),wage:wage,fee:wage*8};
}
E.createInfo=function(S){var wait=(S.lastCreate==null?-99:S.lastCreate)+6-S.week;return {ok:wait<=0,wait:Math.max(0,wait),bgs:BGS,emph:EMPH};};
E.createPreview=createStats;
E.createWrestler=function(S,o){
  var P=S.promos[S.player],info=E.createInfo(S);if(!info.ok)return {ok:false,msg:'Your scouts need '+info.wait+' more week'+(info.wait===1?'':'s')+' before they bring you anyone new.'};
  var name=clean(o.name,28);if(name.length<2)return {ok:false,msg:'Give them a name first.'};
  if(S.w.some(function(w){return w.name.toLowerCase()===name.toLowerCase();}))return {ok:false,msg:'There is already a '+name+' in the business.'};
  var st=createStats(S,o);
  if(wagesWeek(S,P)+st.wage>E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on another wage.'};
  var w=addWrestler(S,{name:name,g:o.g==='F'?'F':'M',ovr:st.ovr,style:STYLE[o.style]?o.style:'A',work:st.work,mic:st.mic,align:o.align==='H'?'H':'F',fin:clean(o.fin,24)||null},'FA',null);
  w.pot=clamp(st.pot,workRate(w),99);w.cr=true;assignGim(w);if(GIMBY[o.gim])w.gim=o.gim;
  if(o.face&&typeof o.face==='object'){w.face={};['h','hr','fh','ms','ey','ns'].forEach(function(k){w.face[k]=clamp(Math.round(+o.face[k]||0),0,9);});w.face.sk=clamp(Math.round(+o.face.sk||0),0,100);w.face.hc=clamp(Math.round(+o.face.hc||0),0,100);}
  joinCompany(S,w,P,st.wage,96);P.cash-=st.fee;S.lastCreate=S.week;
  mile(S,w,'debut','Discovered and signed by '+P.name);news(S,'contract',P.name+' signed newcomer '+w.name+'.');award(S,'ACH_CREATE');
  return {ok:true,id:w.id,msg:w.name+' signs a two-year deal at '+money(st.wage)+' a week. Signing cost: '+money(st.fee)+'.'};
};

/* ---------- the opening promo: you choose who talks, about what, and how ---------- */
var TOPIC={
  rival:{n:'Go after a rival',d:'Needs a feud. A good one adds heat to it.'},
  title:{n:'Talk about the title',d:'Best from a champion or a ranked contender.'},
  crowd:{n:'Work the crowd',d:'Safe anywhere. Builds momentum.'},
  story:{n:'Tell their own story',d:'Best right after something has happened to them.'}
};
var DELIV={
  script:{n:'Scripted word for word',t:5,cap:7,d:'Hard to get wrong, and never great.'},
  notes:{n:'Bullet points',t:7,cap:9,d:'The usual way.'},
  cuff:{n:'Off the cuff',t:9,cap:10,d:'The best promos are made this way. So are the worst.'}
};
/* ---------- 27. Promo kinds: seven ways to run the segment, each on different skills and each going wrong in its own way ---------- */
var PKIND={
  interview:{n:'Interview',skill:'Charisma',d:'The usual. Charisma carries it.',fail:'The questions go nowhere.'},
  challenge:{n:'Challenge',skill:'Charisma',d:'Needs a live feud. A good one adds extra heat. Without a feud it just sounds loud.',fail:'The challenge falls flat and the crowd laughs.'},
  brawl:{n:'Brawl',skill:'Fighting skill',d:'Words give way to fists. Fighting skill and a hot feud carry it. A bad one hurts somebody.',fail:'It turns into a real fight.'},
  signing:{n:'Contract signing',skill:'Charisma',d:'Needs a hot feud. Success sets up the match; the heat goes up.',fail:'Neither of them will sign, and the table stays standing.'},
  vignette:{n:'Taped vignette',skill:'Gimmick and presence',d:'Safe and tight. It cannot get great marks, and it cannot go wrong.',fail:'The tape looks cheap.'},
  sitdown:{n:'Sit-down interview',skill:'Charisma',d:'Calm and story-led. Best right after something has happened to them.',fail:'It drags.'},
  celebration:{n:'Celebration',skill:'Charisma',d:'For a champion or somebody on a run. Anyone else looks silly.',fail:'Nobody came to the party.'}
};
E.PKIND=PKIND;
function promoParts(S,P,w,topic,kind){
  var f=feudsFor(S,w.id).filter(function(x){return x.promo===P.id;}).sort(function(a,b){return b.heat-a.heat;})[0],rv=f?S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]]:null;
  var C=5,why='',heel=w.align==='H',fit=7;
  if(topic==='rival'){C=f?Math.min(10,Math.round(6+f.heat/25)):3;why=f?'There is a live feud with '+rv.name+' to talk about':'Nobody to aim it at';fit=heel?9:7;}
  else if(topic==='title'){
    var lv=holdLvl(P,w.id),rk=-1,tn=null;
    if(lv>0){P.titles.forEach(function(t){if(t.holders.indexOf(w.id)>=0&&(!tn||t.lvl>tn.lvl))tn=t;});C=tn&&tn.defs>=3?9:8;why='Speaks as '+tn.name+' champion';}
    else{P.titles.forEach(function(t){if(t.tag||t.g!==w.g)return;var ix=rankFor(S,P,t,5).map(function(x){return x.id;}).indexOf(w.id);if(ix>=0&&(rk<0||ix<rk)){rk=ix;tn=t;}});
      C=w.shot?9:(rk<0?3:(rk<=2?8:6));why=w.shot?'Has a title shot in hand':(rk<0?'Has not earned the right to talk about a title':'Ranked number '+(rk+1)+' for the '+tn.name);}
    fit=7;
  }else if(topic==='crowd'){C=6;why='Always something to say about the town';fit=8;}
  else{
    var hot=(w.lt&&S.week-w.lt.w<=8)||(w.tw&&S.week-w.tw<=6)||(w.rw&&S.week-w.rw<=3)||w.ws>=4||w.ws<=-3||w.deb;
    C=hot?9:5;why=hot?'Something has just happened to them worth talking about':'Nothing new in their story right now';fit=heel?6:9;
  }
  kind=PKIND[kind]?kind:'interview';
  if(kind==='challenge'||kind==='signing'){if(!f){C=Math.min(C,3);why='A '+PKIND[kind].n.toLowerCase()+' needs a feud to aim at';}else{C=Math.min(10,Math.max(C,Math.round(5+f.heat/22)));if(kind==='signing'&&f.heat<50){C=Math.min(C,5);why='The feud is not hot enough to sell a signing yet';}}}
  else if(kind==='brawl'){C=f?Math.min(10,Math.round(5+f.heat/20)):4;why=f?'A feud with '+rv.name+' is ready to turn physical':'Nobody to fight';}
  else if(kind==='celebration'){var win=holdLvl(P,w.id)>0||w.ws>=3;C=win?8:3;why=win?'There is something to celebrate':'Nothing to celebrate yet';}
  else if(kind==='vignette'){C=6;why='Taped and tight';}
  else if(kind==='sitdown'){var hot2=(w.lt&&S.week-w.lt.w<=8)||(w.tw&&S.week-w.tw<=6)||(w.rw&&S.week-w.rw<=3)||w.ws>=4||w.ws<=-3||w.deb;C=hot2?9:5;why=hot2?'Something has just happened to them worth talking about':'Nothing new in their story right now';}
  var Ch=clamp(Math.round(0.5*gimFit(w)/10+0.5*fit),1,10);
  return {f:f,rv:rv,C:C,why:why,Ch:Ch,Cr:clamp(Math.round(0.07*w.ovr+0.03*w.cha+w.mom*0.3),1,10),kind:kind};
}
function promoCheck(S,w,del,kind){
  var D=DELIV[del]||DELIV.notes,m=micOf(S,w),label=hasMouthpiece(S,w)?'A mouthpiece does the talking: charisma ':'Charisma ',t=D.t;
  if(kind==='brawl'){m=w.brawl*0.7+w.cha*0.3;label='Fighting skill ';}
  else if(kind==='vignette'){m=gimFit(w)*0.6+w.cha*0.4;label='Gimmick and presence ';t=Math.max(3,D.t-2);}
  return mkCheck(t,[{n:label+Math.round(m),v:m>=85?2:(m>=70?1:(m<50?-1:0))},{n:'The gimmick fits',v:gimFit(w)>=80?1:0},moraleMod(w)].concat(skillMods(S,'creative')));
}
E.TOPIC=TOPIC;E.DELIV=DELIV;
E.promoBrief=function(S){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return [];
  return eligible(S,P,show).filter(function(w){return w.promo===P.id&&!(show.big&&isDev(P,w.brand));}).sort(function(a,b){return (micOf(S,b)+b.ovr*0.5)-(micOf(S,a)+a.ovr*0.5);}).slice(0,12);
};
E.promoOdds=function(S,plan){
  var P=S.promos[S.player],w=plan&&S.w[plan.sp];if(!w)return null;
  var pp=promoParts(S,P,w,plan.topic,plan.kind),ck=promoCheck(S,w,plan.del,plan.kind);
  return {kind:pp.kind,ck:ck,content:pp.C,why:pp.why,character:pp.Ch,crowd:pp.Cr,rival:pp.rv?pp.rv.name:null,cap:(DELIV[plan.del]||DELIV.notes).cap};
};
E.setPlan=function(S,plan){S.plan=plan&&S.w[plan.sp]?{sp:+plan.sp,topic:TOPIC[plan.topic]?plan.topic:'crowd',del:DELIV[plan.del]?plan.del:'notes',kind:PKIND[plan.kind]?plan.kind:'interview'}:null;};
function planPromo(S,P,show,ctx){
  var pl=S.plan;S.plan=null;if(!pl)return null;var w=S.w[pl.sp];if(!w||!ctx.inP[w.id])return null;
  var kind=PKIND[pl.kind]?pl.kind:'interview',pp=promoParts(S,P,w,pl.topic,kind),D0=DELIV[pl.del],r=rollCheck(S,promoCheck(S,w,pl.del,kind)),mg=r.total-r.target;
  var D=r.ok?Math.min(D0.cap,7+mg):Math.max(2,5+mg),ov=clamp(Math.round(10*(0.35*D+0.25*pp.C+0.2*pp.Ch+0.2*pp.Cr)),5,kind==='vignette'?78:99);
  ctx.angled[w.id]=1;
  var who=hasMouthpiece(S,w)?S.w[w.mgr].name+', speaking for '+w.name+',':w.name;
  var KT={challenge:pp.rv?' and issues a challenge to '+pp.rv.name:' and issues a challenge to anybody listening',brawl:pp.rv?' and the talking stops: it turns into a brawl with '+pp.rv.name:' and picks a fight with a ringside barrier',signing:pp.rv?' and sits down with '+pp.rv.name+' for a contract signing':' and sits down to sign a contract with nobody',vignette:' and a taped vignette plays on the screens',sitdown:' and sits down for a quiet interview',celebration:' and celebrates in the middle of the ring'};
  var text=kind!=='interview'?who+' opens the show'+KT[kind]+'. '+(r.ok?(D>=9?'Every line lands.':'It does the job.'):PKIND[kind].fail):who+' opens the show '+(pl.topic==='rival'?(pp.rv?'and goes after '+pp.rv.name:'looking for a fight and finding nobody'):(pl.topic==='title'?'and talks about championship gold':(pl.topic==='crowd'?'and plays to the crowd':'and tells the people where things stand')))+', '+(pl.del==='script'?'word for word from the script':(pl.del==='notes'?'working from a few bullet points':'with no script at all'))+'. '+
    (r.ok?(D>=9?'Every line lands.':'It does the job.'):(pl.del==='cuff'?'It wanders, and the crowd drifts.':'The delivery is flat.'));
  addOvr(P,w,clamp((ov-w.ovr)/30,-1,1.5));
  var extra='';
  if(pl.topic==='rival'&&pp.f){heatUp(S,pp.f,clamp((ov-55)/4,-3,9),w.name+' cut a promo on '+pp.rv.name);ctx.angled[pp.rv.id]=1;}
  else if(pl.topic==='title'&&pp.C>=8&&holdLvl(P,w.id)===0)w.pts=(w.pts||0)+3;
  else if(pl.topic==='crowd'&&ov>=70)w.mom=clamp(w.mom+1,-10,10);
  else if(pl.topic==='story'&&ov>=70)w.morale=clamp(w.morale+3,0,100);
  // each kind pays and fails in its own way
  if(kind==='challenge'&&pp.f){heatUp(S,pp.f,r.ok?clamp((ov-45)/5,2,10):-2,w.name+' issued a challenge to '+pp.rv.name);ctx.angled[pp.rv.id]=1;extra+=r.ok?' '+pp.rv.name+' will have to answer.':'';}
  else if(kind==='challenge'&&!pp.f&&r.ok){var ch=ctx.pool.filter(function(x){return x.id!==w.id&&x.g===w.g&&Math.abs(x.ovr-w.ovr)<=12&&!inFeud(S,x.id);});if(ch.length&&startFeud(S,P,pick(S,ch),w,30,w.name+' issued an open challenge'))extra+=' Somebody answered.';}
  else if(kind==='brawl'&&pp.f){heatUp(S,pp.f,r.ok?clamp((ov-40)/6,2,9):3,w.name+' and '+pp.rv.name+' came to blows');ctx.angled[pp.rv.id]=1;if(!r.ok&&chance(S,0.35)){var hurt=chance(S,0.5)?w:pp.rv;hurt.inj=Math.max(hurt.inj,ri(S,1,3));extra+=' '+hurt.name+' was hurt in it.';}}
  else if(kind==='signing'&&pp.f){heatUp(S,pp.f,r.ok?8:(pp.f.heat>=50?3:0),w.name+' and '+pp.rv.name+' faced off at a contract signing');ctx.angled[pp.rv.id]=1;extra+=r.ok?' The match is made for the next big event.':' The table is overturned and nobody signs.';}
  else if(kind==='celebration'&&r.ok&&holdLvl(P,w.id)>0){P.titles.forEach(function(t){if(t.holders.indexOf(w.id)>=0)t.prestige=clamp(t.prestige+0.8,10,100);});}
  else if(kind==='sitdown'&&r.ok&&pp.C>=9)w.morale=clamp(w.morale+3,0,100);
  if(!r.ok&&pl.del==='cuff'&&chance(S,0.4)){
    var cs=ctx.pool.filter(function(x){return x.id!==w.id&&x.g===w.g&&Math.abs(x.ovr-w.ovr)<=10&&!feudOf(S,w.id,x.id)&&(w.team==null||x.team!==w.team);});
    if(cs.length){var tg=pick(S,cs);if(startFeud(S,P,tg,w,30,w.name+' took an unscripted shot at '+tg.name))extra=' An unscripted remark about '+tg.name+' has started something.';}
  }
  if(ov>=80)gainXp(S,3);if(starQ(ov)>=17)award(S,'ACH_PROMO');
  var seg=angle(kind==='interview'?'Opening promo':'Opening '+PKIND[kind].n.toLowerCase(),text+extra,ov);
  seg.rub={d:D,c:pp.C,ch:pp.Ch,cr:pp.Cr};seg.roll=r;seg.who=w.name;if(pp.f&&pl.topic==='rival')seg.feud=pp.f.id;
  seg.bc=[{t:'note',x:text+extra},{t:'note',x:rollText(r)+'Delivery '+D+', content '+pp.C+', character '+pp.Ch+', crowd '+pp.Cr+' out of 10.'},{t:'col',x:ov>=80?'That is how you open a show.':(ov>=60?'A solid start to the night.':'Well. We have a long show ahead of us to make up for that.')}];
  return seg;
}

/* ---------- fed against fed: relations, trades, supershows and turf wars ---------- */

function xf(S){return S.xf&&S.xf.until>=S.week?S.xf:null;}
function isGuest(S,P,w,show){var x=S.xf;return !!x&&x.until>=S.week&&P.id===S.player&&w.promo===x.with&&x.guests.indexOf(w.id)>=0&&w.inj<=0&&(x.kind==='war'||!!show.big);}
function relMod(RV){var r=RV.rel||0;return {n:'Relations with '+RV.name+(r>=20?' are good':(r<=-20?' are bad':' are neutral')),v:r>=50?2:(r>=20?1:(r<=-50?-2:(r<=-20?-1:0)))};}
/* ---------- 59. Rival owners are people: raider, gentleman, hermit or showman decides how they trade, fight and talk ---------- */
var TEMPER={
  raider:{n:'Raider',d:'Takes what is not nailed down. Drives a hard bargain and raids contracts.',trade:-1,show:0,war:1},
  gentleman:{n:'Gentleman',d:'Plays fair and keeps their word. Easy to deal with, rarely starts a fight.',trade:1,show:1,war:-1},
  hermit:{n:'Hermit',d:'Keeps to themselves. Hard to reach, and it is hard to start a war with them.',trade:-1,show:-2,war:-2},
  showman:{n:'Showman',d:'Lives for the spectacle. Loves a crossover show and a good fight.',trade:0,show:1,war:1}
};
function temperOf(P){
  if(!P)return TEMPER.gentleman;if(P.temper&&TEMPER[P.temper])return TEMPER[P.temper];
  var m=P.model,k=m==='outlaw'?'raider':(m==='tradition'?'gentleman':(m==='spectacle'?'showman':(m==='corporate'?'hermit':['raider','gentleman','hermit','showman'][hash('temper'+P.id)%4])));
  return TEMPER[k];
}
function temperKey(P){var t=temperOf(P);return Object.keys(TEMPER).filter(function(k){return TEMPER[k]===t;})[0];}
function temperMod(RV,kind){var t=temperOf(RV),v=t[kind]||0;return {n:RV.owner&&RV.owner.name?RV.owner.name+', a '+t.n.toLowerCase():'Their owner, a '+t.n.toLowerCase(),v:v};}
E.TEMPER=TEMPER;
E.temperOf=function(S,pid){var P=S.promos[pid];if(!P)return null;var t=temperOf(P);return {key:temperKey(P),n:t.n,d:t.d,owner:P.owner?P.owner.name:null};};
function agreeTradeMod(S,RV){return S.agree&&S.agree.with===RV.id?{n:'Your working agreement: talent moves easily between you',v:2}:null;}
function gapMod(P,RV){return {n:'Your popularity against theirs',v:P.image>=RV.image?1:(RV.image-P.image>30?-3:(RV.image-P.image>15?-2:-1))};}
E.xfOdds=function(S,pid,kind){
  var P=S.promos[S.player],RV=S.promos[pid];if(!RV||pid===P.id)return null;
  if(kind==='war'){var rm=relMod(RV);return mkCheck(7,[{n:rm.n,v:-rm.v},gapMod(P,RV),temperMod(RV,'war')].concat(skillMods(S,'creative')));}
  var xm=(modelOf(P).xf||0)+(modelOf(RV).xf||0);
  return mkCheck(8,[relMod(RV),gapMod(P,RV),temperMod(RV,'show')].concat(xm?[{n:'Crossover shows are the business of a lucha spectacle',v:Math.min(2,xm)}]:[]).concat(skillMods(S,'talk')));
};
E.xfCan=function(S,pid){
  if(xf(S))return 'You already have an arrangement running with '+S.promos[S.xf.with].name+'.';
  var RV=S.promos[pid];if(RV.image-S.promos[S.player].image>25)return RV.name+' is too big to take your calls yet.';
  if(RV.xfAsk&&S.week-RV.xfAsk<4)return RV.name+' will not take another call until '+cal(RV.xfAsk+4).label+'.';
  return null;
};
function startXf(S,pid,kind){
  var P=S.promos[S.player],RV=S.promos[pid],GX=mainG(S,P),L=rosterOf(S,pid).filter(function(w){return w.inj<=0&&!w.nw&&w.g===GX&&!isDev(RV,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;});
  var pickIx=kind==='war'?[3,5,7,9]:[1,2,4],guests=pickIx.map(function(i){return L[i];}).filter(Boolean).map(function(w){return w.id;});
  if(kind==='super'&&rosterOf(S,P.id).some(function(w){return w.g==='F';})){var fw=rosterOf(S,pid).filter(function(w){return w.inj<=0&&w.g==='F';}).sort(function(a,b){return b.ovr-a.ovr;})[1];if(fw)guests.push(fw.id);}
  var wom=cal(S.week).wom,until;
  if(kind==='war'){until=S.week+7;until+=4-cal(until).wom;}else until=S.week+(4-wom)+(wom===4&&S.qi>=S.queue.length?4:0);
  S.xf={kind:kind,with:pid,start:S.week,until:until,guests:guests,sc:[0,0],n:0};
  news(S,'world',kind==='war'?RV.name+' and '+P.name+' are at war: '+guests.map(function(id){return S.w[id].name;}).join(', ')+' have crossed the line.':P.name+' and '+RV.name+' will share a supershow at '+P.name+' '+dbOf(S).events[cal(until).month]+'.');
}
E.xfPropose=function(S,pid,kind){
  var why=E.xfCan(S,pid);if(why)return {ok:false,msg:why};
  var RV=S.promos[pid],r=rollCheck(S,E.xfOdds(S,pid,kind));RV.xfAsk=S.week;
  if(!r.ok){RV.rel=clamp((RV.rel||0)-(kind==='war'?0:4),-100,100);return {ok:false,roll:r,msg:rollText(r)+(kind==='war'?RV.name+' will not be drawn into a fight.':RV.name+' turns the idea down.')};}
  startXf(S,pid,kind);
  return {ok:true,roll:r,msg:rollText(r)+(kind==='war'?'It is on. Four of theirs will show up on your shows until '+cal(S.xf.until).label+'. Beat them in the ring.':'They are in. Their wrestlers are yours to book at the big event in '+cal(S.xf.until).label+'.')};
};
function endXf(S,P,rep){
  var x=S.xf,RV=S.promos[x.with],msg;
  if(x.kind==='super'){
    if(x.n>0&&rep){var bonus=Math.round(0.15*(rep.ppv+rep.gate));P.led.bonus+=bonus;RV.cash+=Math.round(bonus*0.5);RV.rel=clamp((RV.rel||0)+10,-100,100);P.image=clamp(P.image+0.3,5,100);RV.image=clamp(RV.image+0.2,5,100);
      msg='The supershow with '+RV.name+' ended '+x.sc[0]+'–'+x.sc[1]+' in '+(x.sc[0]>=x.sc[1]?P.name:RV.name)+'’s favour and brought in '+money(bonus)+' extra.';rep.quest.push(msg);award(S,'ACH_SUPERSHOW');gainXp(S,15);}
    else{RV.rel=clamp((RV.rel||0)-8,-100,100);msg=RV.name+' sent talent to your big event and you never used them. They will remember that.';if(rep)rep.quest.push(msg);}
  }else{
    var won=x.sc[0]>x.sc[1],tie=x.sc[0]===x.sc[1];
    if(!tie){P.image=clamp(P.image+(won?0.6:-0.4),5,100);RV.image=clamp(RV.image+(won?-0.4:0.4),5,100);}
    RV.rel=clamp((RV.rel||0)+15,-100,100);
    msg='The war with '+RV.name+' is over, '+x.sc[0]+'–'+x.sc[1]+'. '+(tie?'Honours even.':(won?P.name+' held the line.':RV.name+' got the better of it.'));if(rep)rep.quest.push(msg);
    if(won){award(S,'ACH_WAR');gainXp(S,25);}
  }
  news(S,'world',msg);
  S.feuds.forEach(function(f){if(!f.res&&f.a.concat(f.b).some(function(id){return x.guests.indexOf(id)>=0;})){f.res=true;f.dead=true;f.end=S.week;}});
  S.xfLast={kind:x.kind,with:x.with,sc:x.sc,week:S.week};S.xf=null;
}
PREX.push(function(S,P,show){var x=xf(S);if(x&&(x.kind==='war'||show.big))S.hype=(S.hype||0)+(x.kind==='war'?0.04:0.1);});
CRX.push(function(ctx){
  var x=ctx.S.xf;if(!x||!ctx.isPl)return null;
  var g=ctx.sides.filter(function(s){return s.some(function(w){return w.promo!==ctx.P.id;});}).length;
  if(!g||g===ctx.sides.length)return g?{d:-2,x:'Two visitors and nobody from the home team'}:null;
  return {d:x.kind==='war'?6:4,x:'Promotion against promotion'};
});
POST.push(function(ctx){
  var S=ctx.S,x=S.xf,r=ctx.res;if(!x||!ctx.isPl)return;
  var g=ctx.sides.filter(function(s){return s.some(function(w){return w.promo!==ctx.P.id;});}).length;if(!g||g===ctx.sides.length)return;
  x.n++;r.seg.xf=true;if(r.win<0)return;
  var home=r.winners[0].promo===ctx.P.id;x.sc[home?0:1]++;
  r.seg.notes.push((home?ctx.P.name:S.promos[x.with].name)+' takes that one. The series stands at '+x.sc[0]+'–'+x.sc[1]+'.');
});
SHOWX.push(function(S,P,show,rep){var x=S.xf;if(!x||P.id!==S.player||!show.big||S.week<x.until)return;endXf(S,P,rep);});
WEEKX.push(function(S){
  S.order.forEach(function(id){var Q=S.promos[id];if(Q.rel)Q.rel+=Q.rel>0?-Math.min(0.5,Q.rel):Math.min(0.5,-Q.rel);});
  if(S.xf&&S.xf.until<=S.week)endXf(S,S.promos[S.player],null);
});
EVMAKE.push(function(S,P){
  if(S.xf||S.week<6)return null;
  var L=S.order.filter(function(id){return id!==P.id&&(S.promos[id].rel||0)<=-20&&S.promos[id].image-P.image<=25&&!(S.promos[id].xfAsk&&S.week-S.promos[id].xfAsk<8);});
  if(!L.length||!chance(S,0.3))return null;var pid=pick(S,L);S.promos[pid].xfAsk=S.week;
  return {type:'invasion',rival:pid,text:'Wrestlers from '+S.promos[pid].name+' bought front-row tickets to your last show and jumped the rail. The crowd went wild. Security is waiting on your word.',choices:['Turn it into a turf war','Throw them out']};
});
EVR.invasion=function(S,ev,choice){
  var RV=S.promos[ev.rival];
  if(choice===0&&!S.xf){startXf(S,ev.rival,'war');return 'It is a war. Four of theirs will be on your shows until '+cal(S.xf.until).label+'. Win more of those matches than you lose.';}
  RV.rel=clamp((RV.rel||0)+6,-100,100);S.hype=(S.hype||0)-0.03;return 'Security walks them out. The crowd wanted the fight, and the next house will be a little flatter for it.';
};
function tradeVal(w){return w.ovr+Math.max(0,w.pot-workRate(w))*0.3+(w.mic-60)*0.05;}
E.tradeList=function(S,pid){var RV=S.promos[pid];return rosterOf(S,pid).filter(function(w){return holdLvl(RV,w.id)===0&&w.inj<=0&&!w.nw&&E.canSign(S,w);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,40);};
E.tradeOdds=function(S,mine,theirs){
  var a=S.w[mine],b=S.w[theirs];if(!a||!b||a.promo!==S.player||b.promo===S.player||b.promo==='FA')return null;
  var RV=S.promos[b.promo];
  return mkCheck(8,[{n:'What they get against what they give up',v:clamp(Math.round((tradeVal(a)-tradeVal(b))/3),-5,4)},relMod(RV),temperMod(RV,'trade'),agreeTradeMod(S,RV)].concat(skillMods(S,'talk')));
};
E.trade=function(S,mine,theirs){
  var a=S.w[mine],b=S.w[theirs],P=S.promos[S.player],ck=E.tradeOdds(S,mine,theirs);if(!ck)return {ok:false,msg:'Pick one of yours and one of theirs.'};
  var RV=S.promos[b.promo];
  if(holdLvl(P,a.id)>0||holdLvl(RV,b.id)>0)return {ok:false,msg:'Champions are not on the table.'};
  if(a.inj>0||b.inj>0)return {ok:false,msg:'Nobody trades for an injured wrestler.'};
  if(RV.tradeAsk&&S.week-RV.tradeAsk<4)return {ok:false,msg:RV.name+' will not talk trades again until '+cal(RV.tradeAsk+4).label+'.'};
  if(!E.canSign(S,b))return {ok:false,msg:b.name+' would not come to a promotion your size.'};
  var wage=wageFor(b.ovr,P);if(wagesWeek(S,P)-a.wage+wage>E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on the wages.'};
  var r=rollCheck(S,ck);RV.tradeAsk=S.week;
  if(!r.ok){RV.rel=clamp((RV.rel||0)-3,-100,100);return {ok:false,roll:r,msg:rollText(r)+RV.name+' says no deal.'};}
  leaveCompany(S,a,'traded to '+RV.name);leaveCompany(S,b,'traded to '+P.name);
  joinCompany(S,a,RV,wageFor(a.ovr,RV),48);joinCompany(S,b,P,wage,48);
  RV.rel=clamp((RV.rel||0)+5,-100,100);news(S,'contract',P.name+' traded '+a.name+' to '+RV.name+' for '+b.name+'.');award(S,'ACH_TRADE');
  return {ok:true,roll:r,msg:rollText(r)+a.name+' goes to '+RV.name+'. '+b.name+' is yours at '+money(wage)+' a week.'};
};
E.xfState=function(S){var x=xf(S);return x?{kind:x.kind,with:x.with,until:x.until,sc:x.sc,guests:x.guests}:null;};

/* ---------- the net: what the fans are saying ---------- */
var FANS=[['ringrat_88','smark'],['FiveStarFrogSplash','smark'],['KayfabeKaren','casual'],['markmywords','casual'],['TurnbuckleTed','old'],['BellToBell_Bill','old'],['xX_HeelHeat_Xx','heel'],['statsguy_dave','stats'],['JobberJoe','under'],['CheapPop_Chris','casual'],['TapOrSnap','smark'],['row_z_ronnie','under']];
function fanFor(S,kind,used){var L=FANS.filter(function(f){return f[1]===kind&&!used[f[0]];});if(!L.length)L=FANS.filter(function(f){return !used[f[0]];});if(!L.length)L=FANS;var f=pick(S,L);used[f[0]]=1;return f[0];}
function netPosts(S,P,show,rep){
  var ms=rep.segs.filter(function(s){return s.k==='match';}),out=[],used={},d=rep.rating-rep.exp;if(!ms.length)return out;
  var best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],worst=ms.slice().sort(function(a,b){return a.ov-b.ov;})[0],main=ms[ms.length-1];
  var mw=main.wi&&main.wi.length?S.w[main.wi[0]]:null,cheap=ms.filter(function(s){return s.fin==='cheap'||s.fin==='interf';}).length,nonf=ms.filter(function(s){return s.fin==='dq'||s.fin==='co'||s.fin==='draw';}).length,clean=ms.filter(function(s){return s.fin==='clean';}).length;
  function add(kind,s,t){out.push({k:kind,s:s,t:t});}
  if(best.ov>=rep.exp+10)add('smark',1,pick(S,[best.label+' was a clinic. I had the work at '+starG(best.mq)+'.',best.label+'. Bookmark it. '+starG(best.ov)+' and it earned every one.','Go out of your way to see '+best.label+'. Best thing this company has done in a while.']));
  else if(best.ov<rep.exp+2)add('smark',-1,pick(S,['Not one match tonight worth watching twice. '+best.label+' was the best of it and that is being generous.','Nothing on that card stood out. '+best.label+' was fine, I suppose.','A show with no peak. Even '+best.label+' never got out of second gear.']));
  if(worst!==best&&worst.ov<rep.rating-12)add('smark',-1,pick(S,['Whoever laid out '+worst.label+' owes me '+worst.mins+' minutes of my life back.',worst.label+', '+starG(worst.ov)+'. Somebody in that office thought that was a good idea.']));
  ms.forEach(function(s){
    if(s.change)add('casual',1,pick(S,['NEW CHAMPION!!! '+s.win+' did it! I am still shaking.',s.win+' with the '+s.title+'. I did not think they would pull the trigger.']));
    if(s.win&&s.wi&&!s.called&&s.sidesN.length===2){var k=s.sidesN.indexOf(s.win);if(k>=0&&s.odds[k]<=25)add('stats',1,s.win+' had a '+s.odds[k]+'% chance going in by my numbers. My numbers are in the bin.');}
    if(s.win&&s.called&&s.sidesN.length===2){var k2=s.sidesN.indexOf(s.win);if(k2>=0&&s.odds[k2]<=30)add('under',0,s.win+' going over like that? Somebody in the office made a phone call. Not complaining.');}
    if(s.xf)add('casual',1,'Company against company. This is the stuff I used to argue about at school.');
  });
  if(mw)add(mw.align==='F'?'casual':'heel',mw.align==='F'?1:1,mw.align==='F'?pick(S,[main.win+' on top to end the night. That is all I ask.','Sent home happy. '+main.win+' in the main event is money.']):pick(S,[main.win+' is the best thing in wrestling and the booker knows it.',main.win+' wins again and the crowd hated every second. Perfect.']));
  if(mw&&mw.align==='H')add('casual',-1,'Why does '+main.win+' keep winning? I nearly threw the remote.');
  if(mw&&mw.align==='F')add('heel',-1,'The hero wins the main event. Groundbreaking. I was asleep by the bell.');
  if(cheap>=2)add('old',-1,'In my day you won with a wrestling hold, not a handful of tights. '+cheap+' cheap finishes tonight.');
  if(nonf>=2)add('old',-1,nonf+' matches without a winner. I counted. Finish your matches.');
  if(clean>=ms.length-1&&ms.length>=4)add('old',1,'Clean finishes up and down the card. That is how you build a division.');
  if(rep.gim&&!show.big)add('old',-1,'Giving away gimmick matches on free TV now. Save something for the big show.');
  add('stats',d>=0?1:-1,rep.name+': '+showVerdict(rep.rating,rep.exp).line.replace(/^./,function(c){return c.toLowerCase();})+' '+(d>=0.5?'That is over par.':(d>-0.5?'That is par.':'That is under par.'))+' Paid attendance '+rep.att.toLocaleString('en-US')+(rep.sellout?', a sell-out.':'.'));
  var pr=rep.segs.filter(function(s){return s.rub;})[0];
  if(pr){var pd=pr.ov-rep.exp;if(pd>=5)add('casual',1,pick(S,['That opening promo from '+pr.who+'. Chills.',pr.who+' on the microphone to open the show. More of that.']));else if(pd<-8)add('smark',-1,pick(S,['The opening promo died in front of a live audience.','Somebody take the microphone away from '+pr.who+'.']));}
  if(d>=4)add('under',1,'Best show in months. Tell your friends.');else if(d<=-4)add('under',-1,'I defend this company every week and they give me that.');
  if(rep.sellout)add('under',1,'I was there. Could not hear myself think. Sold out and it sounded like it.');
  // five posts at most, one per poster, in a shuffled order
  for(var i=out.length-1;i>0;i--){var j=Math.floor(rnd(S)*(i+1)),t=out[i];out[i]=out[j];out[j]=t;}
  return boardTouch(S,ms,out.slice(0,5).map(function(p){return {u:fanFor(S,p.k,used),t:p.t,s:p.s};}),used);
}
NEWX.push(function(S){S.net={mood:60,threads:[]};});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal||!S.net)return;
  var posts=netPosts(S,P,show,rep),sum=0;posts.forEach(function(p){sum+=p.s;});
  S.net.mood=clamp(S.net.mood+(clamp(55+(rep.rating-rep.exp)*5+sum*3,0,100)-S.net.mood)*0.25,0,100);
  S.net.threads.unshift({w:S.week,sub:rep.name+' ('+rep.rating+'%)',posts:posts});if(S.net.threads.length>10)S.net.threads.length=10;
  if(S.net.mood>=90)award(S,'ACH_BOARD');
});
PREX.push(function(S){if(S.net)S.hype=(S.hype||0)+clamp((S.net.mood-55)/900,-0.03,0.04)*(modelOf(S.promos[S.player]).netX||1);});
WEEKX.push(function(S){
  if(!S.net||S.over)return;var P=S.promos[S.player],R=rosterOf(S,P.id),L=[],used={};
  var exp=R.filter(function(w){return w.con<=6;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
  if(exp&&exp.ovr>=P.image-10)L.push(['casual','Hearing '+exp.name+'’s deal is nearly up. If '+P.name+' lets that walk out of the door I am done.']);
  if(!S.owner.me&&S.owner.trust<30)L.push(['smark','Word is the owner is losing patience with whoever is booking this. You can see why.']);
  var T=tournActive(S);if(T&&T.pend.length){var fav=T.ents.slice().sort(function(a,b){return S.w[b].ovr-S.w[a].ovr;})[0];L.push(['stats','My pick for the '+T.name+': '+S.w[fav].name+'. Bracket predictions below.']);}
  P.titles.forEach(function(t){if(t.holders.length&&!t.tag&&S.week-t.since>=20&&S.week%4===0)L.push(['old',S.w[t.holders[0]].name+' has held the '+t.name+' for '+(S.week-t.since)+' weeks. All-time great reign or going stale? Discuss.']);});
  var hot=activeFeuds(S).filter(function(f){return f.promo===P.id&&f.heat>=80;})[0];if(hot)L.push(['under',feudLabel(S,hot)+' has to happen at '+nextBigName(S,P)+'. Do not give it away on free TV.']);
  if(S.xf)L.push(['heel',S.promos[S.xf.with].name+' are going to walk through this roster.'+(S.xf.n?' '+S.xf.sc[1]+' to '+S.xf.sc[0]+' in their favour so far by my count.':' Wait and see.')]);
  var top=R.filter(function(w){return w.inj<=0&&!w.camp&&S.week-w.lu>=4;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
  if(top&&top.ovr>=P.image)L.push(['casual','Has anyone seen '+top.name+'? '+(S.week-top.lu)+' weeks off the shows now.']);
  var said=S.net.said||(S.net.said={});L=L.filter(function(p){var k=p[1].slice(0,24);if(said[k]&&S.week-said[k]<6)return false;return true;});
  if(!L.length)return;
  for(var i=L.length-1;i>0;i--){var j=Math.floor(rnd(S)*(i+1)),t=L[i];L[i]=L[j];L[j]=t;}
  L=L.slice(0,2);L.forEach(function(p){said[p[1].slice(0,24)]=S.week;});Object.keys(said).forEach(function(k){if(S.week-said[k]>8)delete said[k];});
  S.net.threads.unshift({w:S.week,sub:'Rumour mill',posts:L.map(function(p){return {u:fanFor(S,p[0],used),t:p[1],s:0};})});if(S.net.threads.length>10)S.net.threads.length=10;
});

/* ---------- the season saga: four chapters, twelve weeks each, and a chronicle at the end ---------- */
var SAGA={
  reign:{n:'Find your champion',g:function(){return 'Have your champions make four successful title defences.';},need:function(){return 4;},v:function(S,c){return c.cnt.defs;}},
  star:{n:'Make a star',g:function(){return 'Raise one wrestler five points of overness.';},need:function(){return 5;},v:function(S,c){var P=S.promos[S.player],m=0;rosterOf(S,P.id).forEach(function(w){if(w.sg!=null&&w.ovr-w.sg>m)m=w.ovr-w.sg;});return Math.floor(m);}},
  feud:{n:'The rivalry',g:function(){return 'Settle two feuds in the ring.';},need:function(){return 2;},v:function(S,c){return S.stats.feudsDone-c.b.feuds;}},
  match:{n:'Match of the season',g:function(S,c){return 'Put on a match of '+starG(c.b.thr)+' or better.';},need:function(){return 1;},v:function(S,c){return c.cnt.m;}},
  blood:{n:'New blood',g:function(){return 'Crown two new champions.';},need:function(){return 2;},v:function(S,c){return c.cnt.changes;}},
  roll:{n:'On a roll',g:function(){return 'Beat the crowd’s expectations on six shows.';},need:function(){return 6;},v:function(S,c){return c.cnt.beat;}},
  house:{n:'Full house',g:function(){return 'Sell out three shows.';},need:function(){return 3;},v:function(S,c){return c.cnt.sell;}},
  grow:{n:'Grow the territory',g:function(){return 'Raise your popularity by a point and a half.';},need:function(){return 1.5;},v:function(S,c){return r1(S.promos[S.player].image-c.b.image);}},
  big:{n:'The big one',g:function(){return 'Run a big event three points over what the crowd expects.';},need:function(){return 1;},v:function(S,c){return c.cnt.big;}}
};
function sagaChapter(S,k){
  var P=S.promos[S.player];rosterOf(S,P.id).forEach(function(w){w.sg=w.ovr;});
  return {k:k,start:S.week,due:S.week+11,done:null,cnt:{defs:0,changes:0,m:0,beat:0,sell:0,big:0},b:{feuds:S.stats.feudsDone,image:P.image,thr:Math.min(97,Math.round((P.mainB.big||75)+6))}};
}
function newSaga(S,n){
  var ks=Object.keys(SAGA).filter(function(k){return k!=='big';}),i,j,t;
  for(i=ks.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=ks[i];ks[i]=ks[j];ks[j]=t;}
  var P=S.promos[S.player];
  S.saga={n:n,start:S.week,plan:ks.slice(0,3).concat(['big']),ch:[],i:0,b:{image:P.image,cash:P.cash,feuds:S.stats.feudsDone,shows:S.stats.shows,lvl:S.booker.lvl}};
  S.saga.ch.push(sagaChapter(S,S.saga.plan[0]));
}
NEWX.push(function(S){S.chron=[];newSaga(S,1);});
function sagaCheck(S){
  var G=S.saga;if(!G||S.over)return;var c=G.ch[G.i];if(!c||c.done!=null)return;
  var def=SAGA[c.k];
  if(def.v(S,c)>=def.need(S,c)){
    c.done=true;c.week=S.week;gainXp(S,30);S.bp+=2;if(!S.owner.me)S.owner.trust=clamp(S.owner.trust+3,0,100);
    news(S,'you','Season '+G.n+', chapter '+(G.i+1)+' complete: '+def.n+'. You earn 2 booking power.');
  }
}
function sagaAdvance(S){
  var G=S.saga;if(!G||S.over)return;var c=G.ch[G.i];
  if(c.done==null&&S.week>c.due){c.done=false;c.week=S.week;news(S,'you','Season '+G.n+', chapter '+(G.i+1)+' slipped away: '+SAGA[c.k].n+'.');}
  if(c.done==null||S.week<=c.due)return;
  if(G.i<3){G.i++;G.ch.push(sagaChapter(S,G.plan[G.i]));return;}
  chronicle(S);newSaga(S,G.n+1);
}
function chronicle(S){
  var G=S.saga,P=S.promos[S.player],L=[],done=G.ch.filter(function(c){return c.done;}).length;
  L.push('Season '+G.n+' ran from '+cal(G.start).label+' to '+cal(S.week).label+'. '+S.booker.name+' ran '+(S.stats.shows-G.b.shows)+' shows.');
  var top=P.titles.filter(function(t){return !t.tag;}).sort(function(a,b){return b.lvl-a.lvl;})[0];
  if(top){var ch=(top.hist||[]).filter(function(h){return h.from>=G.start;}).length;L.push('The '+top.name+' changed hands '+ch+' time'+(ch===1?'':'s')+'. '+(top.holders.length?S.w[top.holders[0]].name+' ended the season as champion.':'It ended the season vacant.'));}
  var bm=(S.rec.matches||[]).filter(function(m){return m.w>=G.start;})[0];if(bm)L.push('The match people will remember: '+bm.l+', '+starG(bm.ov)+' at '+bm.show+'.');
  var fd=S.stats.feudsDone-G.b.feuds;L.push(fd?fd+' feud'+(fd===1?' was':'s were')+' settled in the ring.':'Not one feud reached a proper ending.');
  var di=P.image-G.b.image;L.push('Popularity went from '+G.b.image.toFixed(1)+' to '+P.image.toFixed(1)+(di>=1?', a season of growth.':(di<=-1?', a season of decline.':', holding steady.'))+' The bank balance moved by '+money(P.cash-G.b.cash)+'.');
  G.ch.forEach(function(c,i){L.push('Chapter '+(i+1)+', “'+SAGA[c.k].n+'”: '+(c.done?'done in '+cal(c.week).label+'.':'missed.'));});
  if(S.xfLast&&S.xfLast.week>=G.start)L.push('There was '+(S.xfLast.kind==='war'?'a war':'a supershow')+' with '+S.promos[S.xfLast.with].name+', '+S.xfLast.sc[0]+'–'+S.xfLast.sc[1]+'.');
  L.push(S.owner.me?S.booker.name+' owns the company and answers to nobody.':S.owner.name+'’s trust in '+S.booker.name+' stands at '+Math.round(S.owner.trust)+'.');
  S.chron.unshift({n:G.n,title:done>=4?'A perfect season':(done>=3?'A season to be proud of':(done>=2?'A mixed season':'A season to forget')),done:done,lines:L});if(S.chron.length>12)S.chron.length=12;
  if(done>=3){award(S,'ACH_SAGA');P.image=clamp(P.image+0.5,5,100);}
  news(S,'you','Season '+G.n+' is in the books: '+S.chron[0].title.toLowerCase()+'. Read the chronicle on the History screen.');
}
POST.push(function(ctx){
  var S=ctx.S,G=S.saga,r=ctx.res;if(!G||!ctx.isPl)return;var c=G.ch[G.i];if(!c||c.done!=null)return;
  if(ctx.t&&r.seg.change)c.cnt.changes++;else if(ctx.t&&ctx.champSide>=0&&r.win===ctx.champSide)c.cnt.defs++;
  if(starMeets(r.OV,c.b.thr))c.cnt.m++;
});
SHOWX.push(function(S,P,show,rep){
  var G=S.saga;if(!G||P.id!==S.player||S.cal)return;var c=G.ch[G.i];if(!c||c.done!=null)return;
  if(rep.rating>rep.exp)c.cnt.beat++;if(rep.sellout)c.cnt.sell++;if(show.big&&rep.rating>=rep.exp+3)c.cnt.big++;
  sagaCheck(S);
});
WEEKX.push(function(S){sagaCheck(S);sagaAdvance(S);});
E.sagaInfo=function(S){
  var G=S.saga;if(!G)return null;
  return {n:G.n,i:G.i,ch:G.plan.map(function(k,i){var c=G.ch[i],def=SAGA[k];return {name:def.n,goal:c?def.g(S,c):null,done:c?c.done:null,cur:i===G.i,v:c?Math.max(0,def.v(S,c)):0,need:c?def.need(S,c):0,due:c?c.due:null};})};
};
