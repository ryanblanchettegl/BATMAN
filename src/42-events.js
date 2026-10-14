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
