/* ===== Big events belong to a company (NEXT.md, job 3) =====
   Each promotion has its own twelve monthly big events in P.events: a name, a type and an optional rule. They are
   filled from the world's list the first time they are needed, so old saves and worlds need nothing. Each company's
   flagship gets an original name of its own from a word list, so no two companies share one. */
/* What a type of big event changes: the size of the house (cap), the ticket price (price), the buys at home (buys),
   and what the crowd expects (exp, on the show rating scale). Flagship and arena change nothing from the old game. */
var EV_TYPES={
  flag:{n:'Flagship',cap:1,price:1,buys:1,exp:0,prod:1,d:'The biggest night of your year. The house, the price and the buys are at their highest.'},
  arena:{n:'Arena show',cap:1,price:1,buys:1,exp:0,prod:1,d:'A big event in a big building. What the crowd expects of a big night.'},
  ballroom:{n:'Ballroom show',cap:0.4,price:0.75,buys:0.7,exp:-6,prod:0.4,d:'A small room and a loud crowd. Fewer seats and fewer buys, but it costs far less to put on and the crowd forgives more.'},
  gimmick:{n:'Gimmick night',cap:0.9,price:1,buys:1.1,exp:3,prod:1.1,d:'A night of stipulations. The buys go up, and the crowd expects violence.'},
  rumble:{n:'Battle royal night',cap:1,price:0.9,buys:1.05,exp:1,prod:1,d:'A night built around a battle royal. A full house at a friendly price.'},
  tourn:{n:'Tournament night',cap:0.85,price:0.9,buys:0.95,exp:-2,prod:0.9,d:'A bracket in one night. The crowd comes to see who survives.'}
};
function evTy(show){return (show&&show.big&&EV_TYPES[show.ty])||EV_TYPES.arena;}
var FLAG_WORDS=['Summit','Coronation','Homecoming','Jubilee','High Water','Reckoning','Crown of Iron','Last Light','Great Gathering','Grand Assembly','Year of Days','Long Night','Iron Harvest','First Light'];
function evList(S,P){
  if(P.events&&P.events.length===12)return P.events;
  var db=dbOf(S),rules=db.rules||{},used={};
  S.order.forEach(function(id){var Q=S.promos[id];if(Q&&Q!==P&&Q.events)Q.events.forEach(function(e){if(e.t==='flag')used[e.n]=1;});});
  var fw=null;for(var i=0;i<FLAG_WORDS.length&&!fw;i++){var k=(hash('flag'+P.id)+i)%FLAG_WORDS.length;if(!used[FLAG_WORDS[k]])fw=FLAG_WORDS[k];}
  var own={};(P.evIn||[]).forEach(function(e){if(e&&e.month>=1&&e.month<=12&&e.name)own[e.month-1]=e;});   // a world package can name a company's own events
  P.events=db.events.map(function(n,m){var flag=m===P.flagship,o=own[m];return {n:o?String(o.name).trim().slice(0,28):(flag&&fw?fw:n),t:flag?'flag':(o&&EV_TYPES[o.type]&&o.type!=='flag'?o.type:'arena'),rule:(o&&o.rule)||rules[m]||null};});
  delete P.evIn;
  return P.events;
}
/** The name of a company's big event in a month (0 to 11), without the company's name. */
function evName(S,P,m){return P?evList(S,P)[m].n:dbOf(S).events[m];}
function evRule(S,P,m){return P?evList(S,P)[m].rule:((dbOf(S).rules||{})[m]||null);}
NEWX.push(function(S){S.order.forEach(function(id){evList(S,S.promos[id]);});});
/** The player's twelve big events, for the screens. */
E.events=function(S){var P=S.promos[S.player],now=cal(S.week).month;return evList(S,P).map(function(e,m){return {m:m,month:MONTHS[m],n:e.n,t:e.t,tn:EV_TYPES[e.t].n,d:EV_TYPES[e.t].d,rule:e.rule,flag:e.t==='flag',now:m===now};});};
/** Rename a big event or change its type. Not this month's: changes take effect from the next month. */
E.evSet=function(S,m,o){
  var P=S.promos[S.player],L=evList(S,P),e=L[m];if(!e)return {ok:false,msg:'There is no such month.'};
  if(m===cal(S.week).month)return {ok:false,msg:'This month\u2019s event is already on sale. Change a later one.'};
  if(o.n!=null){var n=String(o.n).replace(/\s+/g,' ').trim().slice(0,28);if(n.length<3)return {ok:false,msg:'A name needs three letters or more.'};
    if(L.some(function(x,i){return i!==m&&x.n.toLowerCase()===n.toLowerCase();}))return {ok:false,msg:'You already have an event called that.'};e.n=n;}
  if(o.t!=null){if(!EV_TYPES[o.t])return {ok:false,msg:'There is no such kind of event.'};if((o.t==='flag')!==(e.t==='flag'))return {ok:false,msg:'The flagship stays the flagship.'};e.t=o.t;}
  return {ok:true,msg:MONTHS[m]+': '+P.name+' '+e.n+', '+EV_TYPES[e.t].n.toLowerCase()+'.'};
};
E.EV_TYPES=EV_TYPES;
/* rivals plan their year too (NEXT.md 3.7): once a year, in a month of its own, a rival reshapes one later month.
   A small company turns an arena show into a ballroom show it can fill; a big one makes a month a gimmick night.
   It reads the game and never calls rnd(S), so it cannot change how a game plays except through the rival's own nights. */
WEEKX.push(function(S){
  if(S.cal)return;var c=cal(S.week);if(c.wom!==1)return;
  S.order.forEach(function(id){
    var P=S.promos[id];if(!P||id===S.player||P.dead)return;if(hash('evy'+id)%12!==c.month||P.evY===c.year)return;P.evY=c.year;
    var L=evList(S,P),pick=function(want){for(var k=2;k<12;k++){var m=(c.month+k)%12,e=L[m];if(e.t===want)return m;}return -1;};
    var to=P.image<45?'ballroom':(P.image>=70?'gimmick':null);if(!to||L.some(function(e){return e.t===to;}))return;
    var m=pick('arena');if(m<0)return;L[m].t=to;
    news(S,'world',P.name+' turns its '+MONTHS[m]+' event, '+L[m].n+', into '+(to==='ballroom'?'a ballroom show: a smaller room it can fill.':'a gimmick night.'));
  });
});
/* every big night of yours is kept for Finances: the buys against the forecast and the money (NEXT.md 3.6) */
SHOWX.push(function(S,P,show,rep){if(S.cal||P.id!==S.player||!show.big||!rep.bf)return;var L=S.buyLog||(S.buyLog=[]);L.unshift({w:S.week,n:rep.name,b:rep.buys,f:rep.bf,m:rep.ppv,t:(evTy(show)||{}).n});if(L.length>24)L.length=24;});
E.buyLog=function(S){return (S.buyLog||[]).slice();};

/* promoting the next big night (NEXT.md 3.5): a weekly spend builds that night's hype, P.evHype, up to a cap.
   It is spent on the night: the hype lifts the house and the buys, and the meter starts again. */
var EV_SPN=['Nothing','Some','Heavy'],EV_SPC=[0,0.01,0.025],EV_SPH=[0,0.02,0.04],EV_HMAX=0.15;
function evSpendCost(P){return Math.round(EV_SPC[P.evSp||0]*P.inc0);}
WEEKX.push(function(S){var P=S.promos[S.player];if(!P||S.cal)return;if(P.evSp)P.evHype=Math.min(EV_HMAX,(P.evHype||0)+EV_SPH[P.evSp]);});
SHOWX.push(function(S,P,show){if(S.cal||P.id!==S.player||!show.big)return;P.evHype=0;});
E.evSpend=function(S,lvl){var P=S.promos[S.player];lvl=clamp(lvl|0,0,2);P.evSp=lvl;return {ok:true,msg:lvl?EV_SPN[lvl]+' spending on the next big night: '+money(evSpendCost(P))+' a week.':'No more money on promoting the next big night.'};};
E.evHype=function(S){var P=S.promos[S.player],h=P.evHype||0;return {lvl:P.evSp||0,names:EV_SPN,cost:EV_SPC.map(function(c){return Math.round(c*P.inc0);}),h:h,pct:Math.round(h/EV_HMAX*100),word:h<=0?'Nothing yet':(h<0.05?'A little buzz':(h<0.1?'Building':(h<EV_HMAX?'Strong':'As high as it goes')))};};
/* the press scrum after a big night (NEXT.md 9.3): one question, and the answer is yours. It costs nothing and it is
   remembered: praise the roster, sell the next big night, or say the main event was only the start. */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player||!show.big)return;
  var ms=(rep.segs||[]).filter(function(g){return g.k==='match';}),m=ms[ms.length-1];if(!m||!m.wi||!m.wi.length||!m.ids)return;
  var w=m.wi[0],o=m.ids.filter(function(id){return m.wi.indexOf(id)<0;})[0];if(o==null||!S.w[w]||!S.w[o])return;
  var nn=P.name+' '+evName(S,P,(cal(S.week).month+1)%12),cs=repCS(rep),good=cs>=0;
  pushEv(S,{type:'scrum',w:w,o:o,text:'The press catches you on the way out of '+rep.name+'. '+(good?'The room is in a good mood':'The room smells blood')+'. One question: "What did tonight mean?"',
    choices:['"This roster is the best in the business."','"Wait until you see '+nn+'."','"'+S.w[w].name+' and '+S.w[o].name+' are not finished."']});
});
EVR.scrum=function(S,ev,choice,P,w,o){
  if(choice===0){rosterOf(S,P.id).forEach(function(x){if(!x.nw)x.morale=clamp(x.morale+2,0,100);});if(w)youRemember(S,w,'praised','You told the press the roster was the best in the business, after my main event.',2);
    return 'The locker room reads it the next morning. Everybody walks a little taller.';}
  if(choice===1){S.hype=(S.hype||0)+0.03;if(S.owner&&!S.owner.me)S.owner.trust=clamp(S.owner.trust+1,0,100);return 'It runs as the headline. People are already talking about the next big night.';}
  if(!w||!o||w.promo!==P.id||o.promo!==P.id)return 'One of them has gone. The quote ages badly.';
  var f=feudOf(S,w.id,o.id);if(f&&!f.res){heatUp(S,f,6,'The booker told the press they were not finished');}else startFeud(S,P,w,o,32,'The booker told the press they were not finished',{force:true});
  [w,o].forEach(function(x){youRemember(S,x,'notdone','You told the press our story was not finished.',3);});
  return 'Now everybody wants the rematch. '+w.name+' and '+o.name+' are a story again.';
};
