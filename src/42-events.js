/* ===== Big events belong to a company (NEXT.md, job 3) =====
   Each promotion has its own twelve monthly big events in P.events: a name, a type and an optional rule. They are
   filled from the world's list the first time they are needed, so old saves and worlds need nothing. Each company's
   flagship gets an original name of its own from a word list, so no two companies share one. */
var FLAG_WORDS=['Summit','Coronation','Homecoming','Jubilee','High Water','Reckoning','Crown of Iron','Last Light','Great Gathering','Grand Assembly','Year of Days','Long Night','Iron Harvest','First Light'];
function evList(S,P){
  if(P.events&&P.events.length===12)return P.events;
  var db=dbOf(S),rules=db.rules||{},used={};
  S.order.forEach(function(id){var Q=S.promos[id];if(Q&&Q!==P&&Q.events)Q.events.forEach(function(e){if(e.t==='flag')used[e.n]=1;});});
  var fw=null;for(var i=0;i<FLAG_WORDS.length&&!fw;i++){var k=(hash('flag'+P.id)+i)%FLAG_WORDS.length;if(!used[FLAG_WORDS[k]])fw=FLAG_WORDS[k];}
  P.events=db.events.map(function(n,m){var flag=m===P.flagship;return {n:flag&&fw?fw:n,t:flag?'flag':'arena',rule:rules[m]||null};});
  return P.events;
}
/** The name of a company's big event in a month (0 to 11), without the company's name. */
function evName(S,P,m){return P?evList(S,P)[m].n:dbOf(S).events[m];}
function evRule(S,P,m){return P?evList(S,P)[m].rule:((dbOf(S).rules||{})[m]||null);}
NEWX.push(function(S){S.order.forEach(function(id){evList(S,S.promos[id]);});});
/** The player's twelve big events, for the screens. */
E.events=function(S){var P=S.promos[S.player];return evList(S,P).map(function(e,m){return {m:m,month:MONTHS[m],n:e.n,t:e.t,rule:e.rule,flag:e.t==='flag'};});};
